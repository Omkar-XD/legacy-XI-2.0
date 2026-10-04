const crypto = require('crypto');
const { db } = require('./src/db');
const { users, products, product_variants, inventory, carts, cart_items, orders, payments, reservations, processed_webhook_events } = require('./src/db/schema');
const { eq, sql, and } = require('drizzle-orm');
const { runReservationSweep } = require('./src/modules/workers/reservation.sweep');

async function waitFor(condition, timeoutMs = 5000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

async function runTests() {
  console.log('--- STARTING SAFETY FIX TESTS ---');
  const baseUrl = 'http://localhost:3001/api';
  
  require('dotenv').config();
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET || 'test_stripe_secret';
  
  const fetch = globalThis.fetch;
  
  let passed = 0;
  let failed = 0;

  // 1. Setup Test Data
  const [testUser] = await db.insert(users).values({
    email: `safety_${Date.now()}@test.com`,
    password_hash: 'hash',
    role: 'customer'
  }).returning();

  const [testProduct] = await db.insert(products).values({
    name: 'Safety Test Product',
    slug: `safety-prod-${Date.now()}`,
    base_price: 1000
  }).returning();

  const [testVariant] = await db.insert(product_variants).values({
    product_id: testProduct.id,
    sku: `SAFE-SKU-${Date.now()}`,
    size: 'M'
  }).returning();

  await db.insert(inventory).values({
    variant_id: testVariant.id,
    available_quantity: 10,
    reserved_quantity: 0
  });

  const [testCart] = await db.insert(carts).values({ user_id: testUser.id }).returning();
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: testUser.id, role: testUser.role }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1h' });
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Cookie': `token=${token}` };

  const genStripeSig = (body, secret, timestamp) => {
    const payload = `${timestamp}.${body}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  let res, data;

  console.log('\nTEST 1: Webhook duplicate delivery is handled securely');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  data = await res.json();
  let orderId = data.order.id;
  
  await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: orderId, provider: 'stripe' }) });
  const [payment1] = await db.select().from(payments).where(eq(payments.order_id, orderId));
  
  const eventId1 = 'evt_str_' + Date.now();
  const stripeEvent1 = JSON.stringify({ 
    id: eventId1, 
    type: 'checkout.session.completed', 
    data: { object: { id: payment1.provider_transaction_id, amount_total: 1000 } } 
  });
  
  let ts = Math.floor(Date.now() / 1000);
  await fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent1, stripeSecret, ts) },
    body: stripeEvent1
  });
  
  await waitFor(async () => {
    const [dbEvent] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId1));
    return dbEvent && dbEvent.status === 'processed';
  });
  
  let resDup = await fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent1, stripeSecret, ts) },
    body: stripeEvent1
  });
  
  let dupJson = await resDup.json();
  const [dbEvent1] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId1));
  
  if (dupJson.message === 'Already processed' && dbEvent1.status === 'processed' && dbEvent1.payload) {
    console.log('✅ Passed (Duplicate blocked, status is processed)'); passed++;
  } else { console.log('❌ Failed', dupJson, dbEvent1); failed++; }


  console.log('\nTEST 2: Crash after webhook insertion, then retry successfully rebuilds job');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let order2Id = (await res.json()).order.id;
  await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: order2Id, provider: 'stripe' }) });
  const [payment2] = await db.select().from(payments).where(eq(payments.order_id, order2Id));
  
  const eventId2 = 'evt_str_crash_' + Date.now();
  await db.insert(processed_webhook_events).values({
    provider: 'stripe',
    event_id: eventId2,
    status: 'pending',
    payload: {}, // crash before saving payload
    updated_at: new Date()
  });

  const stripeEvent2 = JSON.stringify({ 
    id: eventId2, 
    type: 'checkout.session.completed', 
    data: { object: { id: payment2.provider_transaction_id, amount_total: 1000 } } 
  });
  
  ts = Math.floor(Date.now() / 1000);
  await fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent2, stripeSecret, ts) },
    body: stripeEvent2
  });

  await waitFor(async () => {
    const [dbEvent] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId2));
    const [orderState] = await db.select().from(orders).where(eq(orders.id, order2Id));
    return dbEvent.status === 'processed' && orderState.status === 'PAID';
  });
  
  const [dbEvent2] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId2));
  const [order2State] = await db.select().from(orders).where(eq(orders.id, order2Id));
  
  if (dbEvent2.status === 'processed' && order2State.status === 'PAID') {
    console.log('✅ Passed (Retry successfully completed the job)'); passed++;
  } else { console.log('❌ Failed', dbEvent2, order2State); failed++; }


  console.log('\nTEST 3: Reservation sweep releases expired inventory cleanly');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let order3Id = (await res.json()).order.id;
  
  let oldDate = new Date();
  oldDate.setHours(oldDate.getHours() - 1);
  await db.update(reservations).set({ expires_at: oldDate }).where(eq(reservations.order_id, order3Id));
  
  await runReservationSweep();
  
  const [resAfterSweep] = await db.select().from(reservations).where(eq(reservations.order_id, order3Id));
  const [invAfterSweep] = await db.select().from(inventory).where(eq(inventory.variant_id, testVariant.id));
  const [order3State] = await db.select().from(orders).where(eq(orders.id, order3Id));
  
  // order 1 paid, order 2 paid -> reserved_quantity is 2 before this test
  if (resAfterSweep.status === 'RELEASED' && order3State.status === 'CANCELED' && invAfterSweep.reserved_quantity === 2) {
    console.log('✅ Passed (Reservation sweep works)'); passed++;
  } else { console.log('❌ Failed', resAfterSweep, order3State, invAfterSweep); failed++; }


  console.log('\nTEST 4: Reservation sweep does not release PAID orders');
  await db.update(reservations).set({ expires_at: oldDate }).where(eq(reservations.order_id, orderId));
  await runReservationSweep();
  
  const [resPaid] = await db.select().from(reservations).where(eq(reservations.order_id, orderId));
  if (resPaid.status === 'CONFIRMED_SOLD') {
    console.log('✅ Passed (Paid order reservations are kept sold)'); passed++;
  } else { console.log('❌ Failed', resPaid); failed++; }
  

  console.log('\nTEST 5: Concurrent duplicate Stripe deliveries');
  await db.insert(cart_items).values({ cart_id: testCart.id, variant_id: testVariant.id, quantity: 1 });
  res = await fetch(`${baseUrl}/checkout`, { method: 'POST', headers, body: JSON.stringify({}) });
  let order5Id = (await res.json()).order.id;
  await fetch(`${baseUrl}/payments/create`, { method: 'POST', headers, body: JSON.stringify({ order_id: order5Id, provider: 'stripe' }) });
  const [payment5] = await db.select().from(payments).where(eq(payments.order_id, order5Id));

  const eventId5 = 'evt_str_concurrent_' + Date.now();
  const stripeEvent5 = JSON.stringify({ 
    id: eventId5, 
    type: 'checkout.session.completed', 
    data: { object: { id: payment5.provider_transaction_id, amount_total: 1000 } } 
  });
  
  ts = Math.floor(Date.now() / 1000);
  
  const req1 = fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent5, stripeSecret, ts) },
    body: stripeEvent5
  });
  const req2 = fetch(`${baseUrl}/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': genStripeSig(stripeEvent5, stripeSecret, ts) },
    body: stripeEvent5
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  
  if (res1.status === 200 && res2.status === 200) {
    const json1 = await res1.json();
    const json2 = await res2.json();
    console.log('✅ Passed (Both returned 200, concurrent UPSERT successfully avoided 500 error)'); passed++;
  } else {
    console.log(`❌ Failed: Res1=${res1.status}, Res2=${res2.status}`); failed++;
  }
  
  // Clean up server background tasks manually if any
  console.log(`\n--- SUMMARY: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(console.error);
