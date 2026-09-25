
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (coalesce(unit_id, listing_id) WITH =, daterange(start_date, end_date, '[)') WITH &&)
  WHERE (status IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE'));

CREATE OR REPLACE FUNCTION prevent_booking_overlap() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM bookings b WHERE b.id <> NEW.id
      AND b.status IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE')
      AND b.listing_id = NEW.listing_id
      AND daterange(b.start_date,b.end_date,'[)') && daterange(NEW.start_date,NEW.end_date,'[)')
      AND (b.unit_id IS NULL OR NEW.unit_id IS NULL OR b.unit_id = NEW.unit_id)
  ) THEN RAISE EXCEPTION 'booking_date_overlap' USING ERRCODE = '23P01'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS bookings_prevent_overlap ON bookings;
CREATE TRIGGER bookings_prevent_overlap
BEFORE INSERT OR UPDATE OF listing_id,unit_id,start_date,end_date,status ON bookings
FOR EACH ROW EXECUTE FUNCTION prevent_booking_overlap();

CREATE TABLE IF NOT EXISTS reauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reauth_tokens_user_action_idx ON reauth_tokens(user_id, action, expires_at) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS device_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_push_tokens_user_idx ON device_push_tokens(user_id, updated_at DESC);

ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE payment_refunds ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS tenant_signature_hash TEXT,
  ADD COLUMN IF NOT EXISTS landlord_signature_hash TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS landlord_signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS rental_agreements_booking_idx ON rental_agreements(booking_id);
CREATE INDEX IF NOT EXISTS payment_refunds_intent_idx ON payment_refunds(intent_id, created_at DESC);
