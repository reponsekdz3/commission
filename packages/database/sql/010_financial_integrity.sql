ALTER TABLE payment_refunds ADD COLUMN IF NOT EXISTS request_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payment_refunds_request_key_uidx ON payment_refunds(request_key) WHERE request_key IS NOT NULL;
