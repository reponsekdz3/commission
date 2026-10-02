ALTER TABLE message_attachments
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'CLEAN',
  ADD COLUMN IF NOT EXISTS scan_result TEXT,
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS message_attachments_scan_status_idx
  ON message_attachments(conversation_id, scan_status, created_at);
