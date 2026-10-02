ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS event_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_intent_hash_uidx
  ON payment_events(intent_id,event_hash)
  WHERE event_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_intents_provider_reference_idx
  ON payment_intents(provider_reference)
  WHERE provider_reference IS NOT NULL;

ALTER TABLE payment_refunds ADD COLUMN IF NOT EXISTS provider_reference TEXT;
CREATE INDEX IF NOT EXISTS payment_refunds_provider_reference_idx ON payment_refunds(provider_reference) WHERE provider_reference IS NOT NULL;
