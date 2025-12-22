-- QUEST SYSTEM (D1)

CREATE TABLE IF NOT EXISTS quest_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_weeks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,   -- YYYY-MM-DD
  end_date TEXT NOT NULL,     -- YYYY-MM-DD
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quest_days (
  id TEXT PRIMARY KEY,
  week_id TEXT NOT NULL,
  date TEXT NOT NULL,         -- YYYY-MM-DD
  label TEXT DEFAULT '',
  title TEXT NOT NULL,
  provider TEXT DEFAULT '',
  reward TEXT NOT NULL,
  voucher_code TEXT NOT NULL,
  tnc_json TEXT NOT NULL,     -- JSON array of strings
  admin_status TEXT DEFAULT 'auto', -- auto|forceLocked|forceToday|forcePass|forceClaimed
  final_tag TEXT DEFAULT '',  -- '' | final | boost
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (week_id) REFERENCES quest_weeks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quest_days_week ON quest_days(week_id);
CREATE INDEX IF NOT EXISTS idx_quest_days_date ON quest_days(date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_quest_voucher ON quest_days(voucher_code);

CREATE TABLE IF NOT EXISTS quest_optins (
  id TEXT PRIMARY KEY,
  voucher_code TEXT NOT NULL,
  alias TEXT DEFAULT '',
  ip_hash TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_optins_voucher ON quest_optins(voucher_code);
CREATE INDEX IF NOT EXISTS idx_optins_created ON quest_optins(created_at);
