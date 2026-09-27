CREATE TABLE IF NOT EXISTS rwanda_admin_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('PROVINCE','DISTRICT','SECTOR','CELL','VILLAGE')),
  code TEXT NOT NULL,
  parent_id UUID REFERENCES rwanda_admin_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'NISR_2022',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level, code),
  UNIQUE(level, parent_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS rwanda_admin_units_parent_idx ON rwanda_admin_units(parent_id, level, normalized_name);
CREATE INDEX IF NOT EXISTS rwanda_admin_units_level_idx ON rwanda_admin_units(level, active, normalized_name);
CREATE INDEX IF NOT EXISTS rwanda_admin_units_code_idx ON rwanda_admin_units(code);

ALTER TABLE property_locations
  ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES rwanda_admin_units(id),
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES rwanda_admin_units(id),
  ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES rwanda_admin_units(id),
  ADD COLUMN IF NOT EXISTS cell_id UUID REFERENCES rwanda_admin_units(id),
  ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES rwanda_admin_units(id);

CREATE INDEX IF NOT EXISTS property_locations_admin_idx
  ON property_locations(province_id, district_id, sector_id, cell_id, village_id);

-- Existing free-text records remain readable; new Rwanda records are canonicalized by the application.
