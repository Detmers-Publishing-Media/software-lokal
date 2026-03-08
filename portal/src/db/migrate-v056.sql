-- Migration v0.5.6: mitglieder-lokal Produkt-Seed

INSERT INTO products (id, name, description, price_cents, status, forgejo_repo)
VALUES (
  'mitglieder-lokal',
  'Mitglieder lokal',
  'Mitgliederverwaltung fuer Vereine — einfach, offline, DSGVO-konform',
  4900,
  'active',
  'factory/mitglieder-lokal'
) ON CONFLICT (id) DO NOTHING;
