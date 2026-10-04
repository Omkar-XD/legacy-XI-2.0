ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'processed';
ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS error text;
ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT NOW();