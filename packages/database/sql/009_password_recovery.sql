CREATE TABLE IF NOT EXISTS password_reset_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_challenges_email_idx
  ON password_reset_challenges(email, created_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_challenges_active_idx
  ON password_reset_challenges(user_id, expires_at)
  WHERE consumed_at IS NULL;
