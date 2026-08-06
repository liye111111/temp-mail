CREATE TABLE IF NOT EXISTS mail_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mail_rate_limits_updated ON mail_rate_limits(updated_at);
