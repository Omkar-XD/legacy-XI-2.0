const { db, pool } = require('./src/db');
const { products, product_variants, orders, order_items, users } = require('./src/db/schema');
const { eq, inArray, like } = require('drizzle-orm');

async function cleanup() {
  try {
    console.log('Cleaning up test data...');
    
    // Find test products
    const testProducts = await db.select().from(products).where(like(products.name, 'SAFETY TEST PRODUCT'));
    const testProductIds = testProducts.map(p => p.id);
    
    if (testProductIds.length === 0) {
      console.log('No test products found.');
      process.exit(0);
    }
    
    console.log(`Found ${testProductIds.length} test products.`);

    // Find their variants
    const variants = await db.select().from(product_variants).where(inArray(product_variants.product_id, testProductIds));
    const variantIds = variants.map(v => v.id);

    if (variantIds.length > 0) {
      // Find orders containing these variants
      const oItems = await db.select().from(order_items).where(inArray(order_items.variant_id, variantIds));
      const orderIds = oItems.map(item => item.order_id);
      
      if (orderIds.length > 0) {
        console.log(`Found ${orderIds.length} test orders associated with these products. Deleting orders first...`);
        await db.delete(orders).where(inArray(orders.id, orderIds));
      }
    }

    // Now delete the products
    console.log('Deleting test products...');
    await db.delete(products).where(inArray(products.id, testProductIds));

    console.log('Cleanup successful!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await pool.end();
  }
}

cleanup();
