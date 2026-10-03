const { db } = require('./src/db');
const { sql } = require('drizzle-orm');

async function migrate() {
  try {
    // Check if table exists
    const checkTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_categories'
      );
    `);
    
    if (!checkTable[0].exists) {
      await db.execute(sql`
        CREATE TABLE product_categories (
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          CONSTRAINT product_category_pk UNIQUE (product_id, category_id)
        );
      `);
      console.log("Created product_categories table");
    }

    // Check if column exists
    const checkColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
      );
    `);
    
    if (checkColumn[0].exists) {
      // Migrate existing data (though we truncated recently, it might be empty)
      await db.execute(sql`
        INSERT INTO product_categories (product_id, category_id)
        SELECT id, category_id FROM products
        ON CONFLICT DO NOTHING;
      `);
      console.log("Migrated existing category data");

      // Drop the old column
      await db.execute(sql`
        ALTER TABLE products DROP COLUMN category_id;
      `);
      console.log("Dropped category_id column from products");
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
