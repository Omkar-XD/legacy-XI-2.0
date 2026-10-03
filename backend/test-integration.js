const crypto = require('crypto');
const { db } = require('./src/db');
const { users, products, product_variants, inventory, carts, cart_items, orders, payments, reservations } = require('./src/db/schema');
const { eq, desc } = require('drizzle-orm');

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---');
  const baseUrl = 'http://localhost:3001/api';
  
  require('dotenv').config();
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET || 'test_stripe_secret';
  
  const fetch = globalThis.fetch;
  
  let passed = 0;
  let failed = 0;

  // 1. Setup Test Data (Mock User, Product, Inventory)
  const [testUser] = await db.insert(users).values({
    email: `test_${Date.now()}@test.com`,
    password_hash: 'hash',
    role: 'customer'
  }).returning();

  const [testProduct] = await db.insert(products).values({
    name: 'Test Product',
    slug: `test-prod-${Date.now()}`,
    base_price: 1000 // $10.00
  }).returning();

  const [testVariant] = await db.insert(product_variants).values({
    product_id: testProduct.id,
    sku: `SKU-${Date.now()}`,
    size: 'M'
  }).returning();

  await db.insert(inventory).values({
    variant_id: testVariant.id,
    available_quantity: 10,
    reserved_quantity: 0
  });

  const [testCart] = await db.insert(carts).values({ user_id: testUser.id }).returning();
  await db.insert(cart_items).values({
    cart_id: testCart.id,
    variant_id: testVariant.id,
    quantity: 1
  });

  // Mock Authentication for API calls
  // In Legacy XI, we can bypass actual JWT by creating a fake token if we have a test endpoint, 
  // or we can test the internal services directly. Since we are testing integration, 
  // let's test the DB state changes directly via service calls to simulate the checkout.
  
  // Actually, we can use the db object to simulate the checkout since we don't have a JWT token handy.
  // Wait, I can generate a valid JWT using the app's secret.
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: testUser.id, role: testUser.role }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1h' });
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Cookie': `token=${token}` };

  console.log('\\nTEST 1: Checkout creates PAYMENT_PENDING order & locks inventory');
  let res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let data = await res.json();
  let orderId = data?.order?.id;
  
  const [createdOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
  const [inv1] = await db.select().from(inventory).where(eq(inventory.variant_id, testVariant.id));
  const [res1] = await db.select().from(reservations).where(eq(reservations.order_id, orderId));
  
  if (createdOrder.status === 'PAYMENT_PENDING' && inv1.available_quantity === 9 && inv1.reserved_quantity === 1 && res1.status === 'RESERVED') {
    console.log('✅ Passed'); passed++;
  } else { console.log('❌ Failed', data, createdOrder, inv1, res1); failed++; }


  console.log('\\nTEST 2: Payment initialization creates PENDING payment record');
  res = await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: orderId, provider: 'stripe' }) });
  data = await res.json();
  
  const [payment1] = await db.select().from(payments).where(eq(payments.order_id, orderId));
  if (payment1 && payment1.status === 'pending' && payment1.amount === 1000 && data.clientSecret) {
    console.log('✅ Passed'); passed++;
  } else { console.log('❌ Failed', data, payment1); failed++; }


  console.log('\\nTEST 3: Webhook processes payment & transitions order to PAID and inventory to CONFIRMED');
  const stripeEvent1 = JSON.stringify({ 
    id: 'evt_str_' + Date.now(), 
    type: 'checkout.session.completed', 
    data: { object: { id: payment1.provider_transaction_id, amount_total: 1000 } } 
  });
  const ts = Math.floor(Date.now() / 1000);
  const genStripeSig = (body, secret, timestamp) => {
    const payload = `${timestamp}.${body}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  res = await fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent1, stripeSecret, ts) },
    body: stripeEvent1
  });
  
  // Wait a few seconds for BullMQ to process
  await new Promise(r => setTimeout(r, 2000));
  
  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
  const [updatedPayment] = await db.select().from(payments).where(eq(payments.order_id, orderId));
  const [updatedRes] = await db.select().from(reservations).where(eq(reservations.order_id, orderId));
  
  if (updatedOrder.status === 'PAID' && updatedPayment.status === 'success' && updatedRes.status === 'CONFIRMED_SOLD') {
    console.log('✅ Passed'); passed++;
  } else { console.log('❌ Failed', updatedOrder, updatedPayment, updatedRes); failed++; }

  console.log('\\nTEST 4: Amount mismatch security check (Simulate Fake Webhook)');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let order2Id = (await res.json()).order.id;
  await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: order2Id, provider: 'stripe' }) });
  
  const [payment2] = await db.select().from(payments).where(eq(payments.order_id, order2Id));
  
  // Mismatch amount: 500 instead of 1000
  const stripeEvent2 = JSON.stringify({ 
    id: 'evt_str_' + Date.now(), 
    type: 'checkout.session.completed', 
    data: { object: { id: payment2.provider_transaction_id, amount_total: 500 } } 
  });
  
  await fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent2, stripeSecret, ts) },
    body: stripeEvent2
  });
  
  await new Promise(r => setTimeout(r, 2000));
  const [hackedOrder] = await db.select().from(orders).where(eq(orders.id, order2Id));
  const [hackedPayment] = await db.select().from(payments).where(eq(payments.order_id, order2Id));
  
  if (hackedOrder.status === 'PAYMENT_PENDING' && hackedPayment.status === 'pending') {
    console.log('✅ Passed (Mismatched amount rejected safely)'); passed++;
  } else { console.log('❌ Failed', hackedOrder, hackedPayment); failed++; }


  console.log('\\nTEST 5: COD Flow creates order in PROCESSING status directly');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let order3Id = (await res.json()).order.id;
  
  res = await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: order3Id, provider: 'COD' }) });
  data = await res.json();
  
  const [codOrder] = await db.select().from(orders).where(eq(orders.id, order3Id));
  const [codPayment] = await db.select().from(payments).where(eq(payments.order_id, order3Id));
  const [codRes] = await db.select().from(reservations).where(eq(reservations.order_id, order3Id));
  
  if (codOrder.status === 'PROCESSING' && codPayment.status === 'pending' && codPayment.provider === 'COD' && codRes.status === 'CONFIRMED_SOLD') {
    console.log('✅ Passed'); passed++;
  } else { console.log('❌ Failed', codOrder, codPayment, codRes); failed++; }


  console.log('\\nTEST 6: Admin COD Collection transitions payment to PAID');
  
  // Make the user an admin and sign a new token with admin role
  await db.update(users).set({ role: 'admin' }).where(eq(users.id, testUser.id));
  const adminToken = jwt.sign({ id: testUser.id, role: 'admin' }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1h' });
  const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'Cookie': `token=${adminToken}` };
  
  res = await fetch(`${baseUrl}/admin/orders/${order3Id}/cod-collect`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });
  data = await res.json();
  
  const [collectedPayment] = await db.select().from(payments).where(eq(payments.order_id, order3Id));
  if (collectedPayment && collectedPayment.status === 'success') {
    console.log('✅ Passed'); passed++;
  } else { console.log('❌ Failed', data, collectedPayment); failed++; }


  console.log(`\\n--- SUMMARY: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(console.error);
