-- Migration v0.5.0 "Kassenschluss" — Digistore24 IPN-Integration
-- Idempotent: kann mehrfach ausgefuehrt werden

-- Neue Spalten fuer licenses-Tabelle
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id VARCHAR(100) UNIQUE;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'portal';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- IPN Audit-Log
CREATE TABLE IF NOT EXISTS digistore_ipn_log (
    id            SERIAL PRIMARY KEY,
    event_type    VARCHAR(50) NOT NULL,
    order_id      VARCHAR(100),
    license_key   VARCHAR(50),
    payload       JSONB,
    processed_at  TIMESTAMPTZ DEFAULT NOW(),
    result        VARCHAR(20) NOT NULL,
    error_msg     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ipn_log_order ON digistore_ipn_log(order_id);
