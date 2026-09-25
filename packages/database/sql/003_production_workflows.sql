CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','DONE','FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS background_jobs_ready_idx
  ON background_jobs(status, run_at, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS viewing_appointments_active_slot_uidx
  ON viewing_appointments(listing_id, slot_start)
  WHERE status IN ('REQUESTED','CONFIRMED');

CREATE OR REPLACE FUNCTION prevent_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('PAYMENT_PENDING','CONFIRMED','ACTIVE') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.id <> NEW.id
      AND b.status IN ('PAYMENT_PENDING','CONFIRMED','ACTIVE')
      AND b.listing_id = NEW.listing_id
      AND daterange(b.start_date,b.end_date,'[)') && daterange(NEW.start_date,NEW.end_date,'[)')
      AND (b.unit_id IS NULL OR NEW.unit_id IS NULL OR b.unit_id = NEW.unit_id)
  ) THEN
    RAISE EXCEPTION 'booking_date_overlap'
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_prevent_overlap ON bookings;

CREATE TRIGGER bookings_prevent_overlap
BEFORE INSERT OR UPDATE OF listing_id,unit_id,start_date,end_date,status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION prevent_booking_overlap();

CREATE INDEX IF NOT EXISTS payment_intents_booking_idx
  ON payment_intents(booking_id);

CREATE INDEX IF NOT EXISTS payment_events_intent_idx
  ON payment_events(intent_id, received_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
  ON analytics_events(name, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
