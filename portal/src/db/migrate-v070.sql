-- Migration v0.7.0: License key format + validation support
--
-- Changes:
-- 1. license_key: UUID -> VARCHAR(50) for custom CFML-XXXX format
-- 2. license_hash: HMAC-SHA256 for ticket correlation without key exposure
-- 3. Validation tracking: last_validated_at, validation_count
-- 4. auto_renew flag for cancellation tracking

-- Allow custom-format keys (CFML-XXXX-XXXX-XXXX-XXXX = 24 chars)
ALTER TABLE licenses ALTER COLUMN license_key TYPE VARCHAR(50) USING license_key::text;
ALTER TABLE licenses ALTER COLUMN license_key DROP DEFAULT;

-- HMAC hash for portal communication (tickets, support)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_licenses_hash ON licenses(license_hash);

-- App validation tracking
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS validation_count INTEGER DEFAULT 0;

-- Cancellation: subscription runs until expires_at, no immediate revocation
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Add finanz-rechner product
INSERT INTO products (id, name, description, price_cents, status, forgejo_repo)
VALUES (
  'finanz-rechner',
  'FinanzRechner',
  'Finanzrechner fuer Versicherungsmakler — lokal, sicher, unabhaengig',
  2900,
  'active',
  'factory/finanz-rechner'
) ON CONFLICT (id) DO NOTHING;

-- Update mitglieder-simple price to 29 EUR/year (support abo)
UPDATE products SET price_cents = 2900 WHERE id = 'mitglieder-simple';
