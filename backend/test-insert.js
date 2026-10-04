const { db } = require('./src/db');
const { products } = require('./src/db/schema');

async function test() {
  try {
    console.log("Attempting to insert product...");
    const [newProduct] = await db.insert(products).values({
      name: "Messi Argentina 2026 Last Match Half Sleeve Sublimation jersey",
      slug: "argentina-2026-last-match",
      description: "Messi Argentina 2026 Last Match Half Sleeve Sublimation Jersey — Celebrate Lionel Messi’s iconic Argentina legacy with this stylish 2026 Last Match jersey, featuring a classic Argentina-inspired design, comfortable half sleeves, lightweight fabric, and high-quality sublimation printing. Perfect for football matches, casual wear, and dedicated Messi fans.",
      base_price: 35000,
      is_active: true
    }).returning();
    console.log("Success:", newProduct);
  } catch (error) {
    console.error("Failed!");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Detail:", error.detail);
  }
  process.exit(0);
}

test();
