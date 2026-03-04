CREATE TABLE IF NOT EXISTS fee_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'jaehrlich'
    CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
  active INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO fee_classes (id, name, amount_cents, interval) VALUES
  (1, 'Vollmitglied', 6000, 'jaehrlich'),
  (2, 'Ermaessigt', 3000, 'jaehrlich'),
  (3, 'Ehrenmitglied', 0, 'jaehrlich'),
  (4, 'Foerdermitglied', 12000, 'jaehrlich');

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  street TEXT,
  zip TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  birth_date TEXT,
  entry_date TEXT NOT NULL DEFAULT (date('now')),
  exit_date TEXT,
  exit_reason TEXT,
  status TEXT NOT NULL DEFAULT 'aktiv'
    CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
  fee_class_id INTEGER REFERENCES fee_classes(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
