require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  try {
    await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TIMESTAMP, ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024);');
    console.log('Altered table users successfully');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
