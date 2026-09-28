ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS saved_searches_last_notified_idx ON saved_searches(last_notified_at,created_at);
