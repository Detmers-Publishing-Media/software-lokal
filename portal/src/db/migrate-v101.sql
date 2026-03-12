-- Migration v1.0.1: Preise auf 39 EUR vereinheitlichen
--
-- Changes:
-- 1. mitglieder-lokal: 2900 → 3900
-- 2. finanz-rechner: 2900 → 3900

UPDATE products SET price_cents = 3900, updated_at = NOW()
WHERE id = 'mitglieder-lokal' AND price_cents = 2900;

UPDATE products SET price_cents = 3900, updated_at = NOW()
WHERE id = 'finanz-rechner' AND price_cents = 2900;
