ALTER TABLE property_media
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'CLEAN',
  ADD COLUMN IF NOT EXISTS scan_result TEXT,
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS property_media_scan_status_idx
  ON property_media(property_id, scan_status, sort_order);
