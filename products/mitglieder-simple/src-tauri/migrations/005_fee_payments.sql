CREATE TABLE IF NOT EXISTS fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'ueberweisung'
        CHECK (payment_method IN ('bar', 'ueberweisung')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fee_payments_member_year ON fee_payments(member_id, year);
