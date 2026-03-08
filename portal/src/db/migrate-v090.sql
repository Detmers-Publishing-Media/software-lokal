-- Migration v0.9.0: Add Rechnung Lokal product
--
-- Changes:
-- 1. New product: rechnung-lokal (Rechnungsstellung mit E-Rechnung)

INSERT INTO products (id, name, description, price_cents, status, forgejo_repo, created_at, updated_at)
VALUES (
  'rechnung-lokal',
  'Rechnung Lokal',
  'Rechnungsstellung mit E-Rechnung (ZUGFeRD) fuer Nebenberufler und Kleinunternehmer',
  3900,
  'active',
  'factory-admin/rechnung-lokal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
