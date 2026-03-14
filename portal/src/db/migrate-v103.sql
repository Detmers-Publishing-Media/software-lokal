-- v1.0.3: Instance-Tracking + Trial-Keys + Berater Lokal Produkt

-- Instance-Tracking: max 3 Instanzen pro Key
CREATE TABLE IF NOT EXISTS license_instances (
    id          SERIAL PRIMARY KEY,
    license_id  INTEGER NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    instance_id VARCHAR(36) NOT NULL,
    first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_license_instance UNIQUE (license_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_license_instances_license ON license_instances (license_id);
CREATE INDEX IF NOT EXISTS idx_license_instances_last_seen ON license_instances (last_seen);

-- Berater Lokal Produkt
INSERT INTO products (id, name, description, price_cents, status, forgejo_repo)
VALUES (
  'berater-lokal',
  'Berater Lokal',
  'Ganzheitliche Beratungssoftware fuer Versicherungsmakler — Kundenverwaltung, Lueckenanalyse, Beratungsprotokoll',
  3900,
  'active',
  'factory/berater-lokal'
) ON CONFLICT (id) DO NOTHING;

-- Support-Ticket sequence (if not exists from v071)
CREATE SEQUENCE IF NOT EXISTS seq_support_tickets START 1;
