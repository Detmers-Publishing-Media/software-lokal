-- Migration v0.9.1: Remove customer_email/customer_name from licenses
--
-- Strict no-email: License-Key-only identification.
-- Digistore24 is the Reseller and holds customer data.

ALTER TABLE licenses DROP COLUMN IF EXISTS customer_email;
ALTER TABLE licenses DROP COLUMN IF EXISTS customer_name;

DROP INDEX IF EXISTS idx_licenses_email;
