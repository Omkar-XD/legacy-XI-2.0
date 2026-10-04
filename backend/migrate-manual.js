const { queryClient } = require('./src/db');

async function migrate() {
  try {
    await queryClient`ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'processed'`;
    await queryClient`ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS payload jsonb`;
    await queryClient`ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS error text`;
    await queryClient`ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT NOW()`;
    console.log('Migration successful');
  } catch(e) {
    console.error(e);
  } finally {
    queryClient.end();
  }
}
migrate();
