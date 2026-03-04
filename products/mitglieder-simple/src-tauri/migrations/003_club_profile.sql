CREATE TABLE IF NOT EXISTS club_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    street TEXT DEFAULT '',
    zip TEXT DEFAULT '',
    city TEXT DEFAULT '',
    register_court TEXT DEFAULT '',
    register_number TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    iban TEXT DEFAULT '',
    bic TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    chairman TEXT DEFAULT '',
    logo_path TEXT DEFAULT ''
);
INSERT OR IGNORE INTO club_profile (id) VALUES (1);
