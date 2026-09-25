CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
  ADD COLUMN IF NOT EXISTS parking INTEGER,
  ADD COLUMN IF NOT EXISTS area_value NUMERIC,
  ADD COLUMN IF NOT EXISTS area_unit TEXT NOT NULL DEFAULT 'SQM';

ALTER TABLE property_listings
  ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS properties_title_trgm_gin_idx
  ON properties USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS properties_description_trgm_gin_idx
  ON properties USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS properties_type_status_idx
  ON properties (property_type, status);

CREATE INDEX IF NOT EXISTS property_locations_district_idx
  ON property_locations (district);

CREATE INDEX IF NOT EXISTS property_locations_sector_idx
  ON property_locations (sector);

CREATE INDEX IF NOT EXISTS property_listings_available_from_idx
  ON property_listings (available_from);

CREATE INDEX IF NOT EXISTS sessions_refresh_token_hash_uidx
  ON sessions (refresh_token_hash);

CREATE INDEX IF NOT EXISTS property_prices_active_idx
  ON property_prices (listing_id, effective_from DESC)
  WHERE effective_to IS NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_organization_idx ON users (organization_id);
