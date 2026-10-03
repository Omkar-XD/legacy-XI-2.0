const { db, queryClient } = require('./src/db');
const { categories, products, product_variants, inventory, reservations } = require('./src/db/schema');
const { reserveInventory, releaseReservation } = require('./src/modules/inventory/inventory.service');
const { eq } = require('drizzle-orm');

async function seedData() {
  const [cat] = await db.insert(categories).values({ name: 'Test', slug: `test-${Date.now()}` }).returning();
  const [prod] = await db.insert(products).values({ 
    category_id: cat.id, name: 'Test Prod', slug: `prod-${Date.now()}`, base_price: 1000 
  }).returning();
  
  const [var1] = await db.insert(product_variants).values({ product_id: prod.id, sku: `sku1-${Date.now()}` }).returning();
  await db.insert(inventory).values({ variant_id: var1.id, available_quantity: 1 });

  const [var2] = await db.insert(product_variants).values({ product_id: prod.id, sku: `sku2-${Date.now()}` }).returning();
  await db.insert(inventory).values({ variant_id: var2.id, available_quantity: 5 });

  return { var1, var2 };
}

async function runTests() {
  try {
    const { var1, var2 } = await seedData();

    console.log('Test 1: One item / one buyer');
    const res1 = await reserveInventory([{ variant_id: var1.id, quantity: 1 }]);
    console.assert(res1.length === 1, 'Expected 1 reservation');
    console.log(' - OK');

    console.log('Test 2: Insufficient stock (since it was just reserved)');
    try {
      await reserveInventory([{ variant_id: var1.id, quantity: 1 }]);
      console.error(' - FAILED: Should have thrown insufficient stock');
      process.exit(1);
    } catch(e) {
      console.assert(e.message.includes('Insufficient stock'), 'Expected insufficient stock error');
      console.log(' - OK');
    }

    console.log('Test 3: Reservation release');
    await releaseReservation(res1[0].id);
    const [invAfterRelease] = await db.select().from(inventory).where(eq(inventory.variant_id, var1.id));
    console.assert(invAfterRelease.available_quantity === 1, 'Expected available quantity to be restored to 1');
    console.log(' - OK');

    console.log('Test 4: One item / two concurrent buyers');
    let successCount = 0;
    let failCount = 0;
    const p1 = reserveInventory([{ variant_id: var1.id, quantity: 1 }]).then(()=>successCount++).catch(()=>failCount++);
    const p2 = reserveInventory([{ variant_id: var1.id, quantity: 1 }]).then(()=>successCount++).catch(()=>failCount++);
    await Promise.all([p1, p2]);
    
    console.assert(successCount === 1, `Expected 1 success, got ${successCount}`);
    console.assert(failCount === 1, `Expected 1 failure, got ${failCount}`);
    console.log(' - OK');

    console.log('Test 5: Multiple variants deterministic locking');
    // We try to reserve var1 and var2 in one go. We already reserved var1, so let's reset var1 stock first manually
    await db.update(inventory).set({ available_quantity: 10, reserved_quantity: 0 }).where(eq(inventory.variant_id, var1.id));
    
    // Concurrent requests with different order of items in array should NOT deadlock
    const p3 = reserveInventory([
      { variant_id: var1.id, quantity: 1 },
      { variant_id: var2.id, quantity: 1 }
    ]);
    const p4 = reserveInventory([
      { variant_id: var2.id, quantity: 1 },
      { variant_id: var1.id, quantity: 1 }
    ]);

    await Promise.all([p3, p4]);
    console.log(' - OK (No deadlocks occurred)');

    console.log('Test 6: Transaction rollback on failure mid-way');
    const prevInv = await db.select().from(inventory).where(eq(inventory.variant_id, var2.id));
    try {
      // Try to reserve var2 and some non-existent variant to trigger failure
      await reserveInventory([
        { variant_id: var2.id, quantity: 1 },
        { variant_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }
      ]);
    } catch(e) {
      // Expected to fail
    }
    const currInv = await db.select().from(inventory).where(eq(inventory.variant_id, var2.id));
    console.assert(prevInv[0].available_quantity === currInv[0].available_quantity, 'Expected transaction rollback, stock should not change');
    console.log(' - OK');
    
    console.log('ALL TESTS PASSED');

  } catch(e) {
    console.error('Test suite failed', e);
  } finally {
    await queryClient.end();
  }
}

runTests();
