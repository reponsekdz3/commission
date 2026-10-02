ALTER TABLE property_listings
  ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS property_listings_available_from_idx
  ON property_listings (available_from, status);