require('dotenv').config();
const { db } = require('./src/db/index');
const schema = require('./src/db/schema/index');
const { sql } = require('drizzle-orm');

async function clean() {
  console.log('--- Current Counts ---');
  for (const key of Object.keys(schema)) {
    if (schema[key].name) {
      try {
        const res = await db.execute(sql`SELECT count(*) FROM ${schema[key]}`);
        console.log(`${schema[key].name || key}: ${res[0].count}`);
      } catch (e) {
        console.error(`Error counting ${key}:`, e.message);
      }
    }
  }

  console.log('--- Cleaning DB ---');
  // Delete all orders, carts, products, categories, addresses, and test users
  try {
    await db.execute(sql`DELETE FROM processed_webhook_events`);
    await db.execute(sql`DELETE FROM payments`);
    await db.execute(sql`DELETE FROM reservations`);
    await db.execute(sql`DELETE FROM order_items`);
    await db.execute(sql`DELETE FROM orders`);
    await db.execute(sql`DELETE FROM cart_items`);
    await db.execute(sql`DELETE FROM carts`);
    await db.execute(sql`DELETE FROM inventory`);
    await db.execute(sql`DELETE FROM product_variants`);
    await db.execute(sql`DELETE FROM product_media`);
    await db.execute(sql`DELETE FROM products`);
    await db.execute(sql`DELETE FROM categories`);
    await db.execute(sql`DELETE FROM addresses`);
    // Delete non-admin users
    await db.execute(sql`DELETE FROM users WHERE role != 'admin'`);

    console.log('--- Cleanup complete ---');

    console.log('--- New Counts ---');
    for (const key of Object.keys(schema)) {
      if (schema[key].name) {
        try {
          const res = await db.execute(sql`SELECT count(*) FROM ${schema[key]}`);
          console.log(`${schema[key].name || key}: ${res[0].count}`);
        } catch (e) {
        }
      }
    }

  } catch (e) {
    console.error('Cleanup failed:', e);
  }
  process.exit(0);
}

clean();
