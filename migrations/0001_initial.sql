PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inboxes (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  local_part TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  extended_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inboxes_expiry ON inboxes(expires_at);
CREATE INDEX IF NOT EXISTS idx_inboxes_address_expiry ON inboxes(address, expires_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  inbox_id TEXT NOT NULL,
  envelope_from TEXT,
  envelope_to TEXT NOT NULL,
  sender TEXT,
  subject TEXT,
  verification_code TEXT,
  raw_object_key TEXT NOT NULL,
  parsed_object_key TEXT,
  size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  received_at INTEGER NOT NULL,
  parsed_at INTEGER,
  FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_inbox_received ON messages(inbox_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status, received_at);
