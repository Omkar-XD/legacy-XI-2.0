const { db } = require('./src/db');
const { categories } = require('./src/db/schema');
const { sql } = require('drizzle-orm');

const cats = [
  { name: 'Player Version', slug: 'player-version' },
  { name: 'Half Sleeve', slug: 'half-sleeve' },
  { name: 'Five Sleeve', slug: 'five-sleeve' },
  { name: 'Full Sleeve', slug: 'full-sleeve' },
  { name: 'National Kits', slug: 'national-kits' },
  { name: 'Season Kits', slug: 'season-kits' },
  { name: 'Full Kit', slug: 'full-kit' },
  { name: 'Bibs', slug: 'bibs' },
  { name: 'Cricket', slug: 'cricket' },
  { name: 'Special Edition', slug: 'special-edition' },
  { name: 'Shorts', slug: 'shorts' },
  { name: 'Kids', slug: 'kids' },
  { name: 'Exclusive Offer', slug: 'exclusive-offer' }
];

async function seed() {
  await db.execute(sql`TRUNCATE TABLE categories CASCADE`);
  // Reset sequence
  await db.execute(sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`);
  
  for (const cat of cats) {
    await db.insert(categories).values(cat);
  }
  
  console.log("Categories seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
