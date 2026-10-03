const { db, queryClient } = require('./src/db');
const { orders } = require('./src/db/schema');
const { transitionOrderStatus } = require('./src/modules/orders/orders.service');

async function seedOrder() {
  const [order] = await db.insert(orders).values({
    total_amount: 1000,
    status: 'PENDING'
  }).returning();
  return order;
}

async function runTests() {
  try {
    const order = await seedOrder();

    console.log('Test 1: Valid transition PENDING -> PAYMENT_PENDING');
    await transitionOrderStatus(order.id, 'PAYMENT_PENDING');
    console.log(' - OK');

    console.log('Test 2: Invalid transition PAYMENT_PENDING -> DELIVERED');
    try {
      await transitionOrderStatus(order.id, 'DELIVERED');
      console.error(' - FAILED: Should have rejected transition');
      process.exit(1);
    } catch (e) {
      console.assert(e.message.includes('Invalid transition'), 'Expected invalid transition error');
      console.log(' - OK');
    }

    console.log('Test 3: Valid transitions chain');
    await transitionOrderStatus(order.id, 'PAID');
    await transitionOrderStatus(order.id, 'PROCESSING');
    await transitionOrderStatus(order.id, 'SHIPPED');
    await transitionOrderStatus(order.id, 'DELIVERED');
    console.log(' - OK');

    console.log('Test 4: Terminal state (cannot transition away from DELIVERED)');
    try {
      await transitionOrderStatus(order.id, 'PAYMENT_PENDING');
      console.error(' - FAILED: Should have rejected transition');
      process.exit(1);
    } catch (e) {
      console.log(' - OK');
    }

    console.log('ALL TESTS PASSED');

  } catch(e) {
    console.error('Failed', e);
  } finally {
    await queryClient.end();
  }
}

runTests();
