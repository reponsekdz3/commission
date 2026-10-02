ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
  ADD COLUMN IF NOT EXISTS parking INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_value NUMERIC,
  ADD COLUMN IF NOT EXISTS area_unit TEXT NOT NULL DEFAULT 'SQM';

CREATE INDEX IF NOT EXISTS properties_bedrooms_idx
  ON properties (bedrooms);

CREATE INDEX IF NOT EXISTS properties_area_idx
  ON properties (area_value);