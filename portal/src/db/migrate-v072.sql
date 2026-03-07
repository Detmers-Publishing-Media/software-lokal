-- Migration v0.7.2: Trial license support
--
-- Changes:
-- 1. note column for manual/trial license annotations
-- 2. source column default (was missing explicit default)

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS note TEXT;
