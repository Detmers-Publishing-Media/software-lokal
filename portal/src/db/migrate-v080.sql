-- Migration v0.8.0: Product display name updates
--
-- Changes:
-- 1. MitgliederSimple -> Mitglieder lokal
-- 2. FinanzRechner -> FinanzRechner lokal

UPDATE products SET name = 'Mitglieder lokal' WHERE id = 'mitglieder-lokal';
UPDATE products SET name = 'FinanzRechner lokal' WHERE id = 'finanz-rechner';
