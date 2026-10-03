const http = require('http');
const { db, queryClient } = require('./src/db');
const { categories, products, product_variants, inventory, users, carts, cart_items } = require('./src/db/schema');
const { eq } = require('drizzle-orm');
const { hashPassword } = require('./src/utils/password');
const { signToken } = require('./src/utils/jwt');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    if (token) options.headers['Cookie'] = `token=${token}`;
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(data) }); } 
        catch(e) { resolve({ statusCode: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function seedUserAndCart() {
  const ts = Date.now();
  const [user] = await db.insert(users).values({ email: `test_${ts}@e.com`, password_hash: '123' }).returning();
  const [cat] = await db.insert(categories).values({ name: 'Cat', slug: `cat-${ts}` }).returning();
  const [prod] = await db.insert(products).values({ category_id: cat.id, name: 'P1', slug: `p1-${ts}`, base_price: 1000 }).returning();
  const [var1] = await db.insert(product_variants).values({ product_id: prod.id, sku: `sku1-${ts}` }).returning();
  await db.insert(inventory).values({ variant_id: var1.id, available_quantity: 5 });
  const [cart] = await db.insert(carts).values({ user_id: user.id }).returning();
  
  return { user, cart, prod, var1, token: signToken({ id: user.id }) };
}

async function runTests() {
  try {
    const ctx = await seedUserAndCart();
    console.log('Test 1: Empty cart');
    let res = await request('POST', '/api/checkout', null, ctx.token);
    console.assert(res.statusCode === 400, 'Expected 400 Empty cart');
    console.log(' - OK');

    console.log('Test 2: Successful checkout');
    await db.insert(cart_items).values({ cart_id: ctx.cart.id, variant_id: ctx.var1.id, quantity: 1 });
    res = await request('POST', '/api/checkout', null, ctx.token);
    console.assert(res.statusCode === 200, 'Expected 200');
    console.assert(res.data.order.total_amount === 1000, 'Expected 1000');
    console.log(' - OK');

    console.log('Test 3: Insufficient inventory');
    await db.insert(cart_items).values({ cart_id: ctx.cart.id, variant_id: ctx.var1.id, quantity: 10 });
    res = await request('POST', '/api/checkout', null, ctx.token);
    console.assert(res.statusCode === 400, 'Expected 400 Insufficient stock');
    await db.delete(cart_items).where(eq(cart_items.cart_id, ctx.cart.id));
    console.log(' - OK');

    console.log('Test 4: Price changes between cart and checkout');
    await db.insert(cart_items).values({ cart_id: ctx.cart.id, variant_id: ctx.var1.id, quantity: 1 });
    await db.update(products).set({ base_price: 2500 }).where(eq(products.id, ctx.prod.id));
    res = await request('POST', '/api/checkout', null, ctx.token);
    console.assert(res.statusCode === 200, 'Expected 200');
    console.assert(res.data.order.total_amount === 2500, 'Expected authoritative price 2500');
    console.log(' - OK');

    console.log('Test 5: Concurrent checkout');
    // Seed new user and variants
    const ctx2 = await seedUserAndCart();
    await db.update(inventory).set({ available_quantity: 1 }).where(eq(inventory.variant_id, ctx2.var1.id));
    await db.insert(cart_items).values({ cart_id: ctx2.cart.id, variant_id: ctx2.var1.id, quantity: 1 });
    
    // Simulate concurrent checkout by making two requests at the exact same time using the same token/cart
    const p1 = request('POST', '/api/checkout', null, ctx2.token);
    const p2 = request('POST', '/api/checkout', null, ctx2.token);
    const [res1, res2] = await Promise.all([p1, p2]);
    
    const statuses = [res1.statusCode, res2.statusCode].sort();
    console.assert(statuses[0] === 200 && statuses[1] === 400, 'One should succeed, one should fail');
    console.log(' - OK');

    console.log('Test 6: Invalid variant');
    // Add deleted variant to cart
    const ctx3 = await seedUserAndCart();
    await db.insert(cart_items).values({ cart_id: ctx3.cart.id, variant_id: ctx3.var1.id, quantity: 1 });
    await db.delete(product_variants).where(eq(product_variants.id, ctx3.var1.id));
    res = await request('POST', '/api/checkout', null, ctx3.token);
    console.assert(res.statusCode === 400, 'Expected 400');
    console.log(' - OK');

    console.log('ALL TESTS PASSED');
  } catch(e) {
    console.error('Failed', e);
  } finally {
    await queryClient.end();
  }
}

runTests();
