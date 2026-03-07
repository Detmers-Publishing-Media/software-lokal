-- Migration v0.7.1: support_tickets table for HMAC-based ticket flow
--
-- Separate from support_cases (which uses direct license_key auth).
-- support_tickets uses license_hash (HMAC) for privacy-preserving auth.

CREATE TABLE IF NOT EXISTS support_tickets (
  id            SERIAL PRIMARY KEY,
  ticket_ref    VARCHAR(30) UNIQUE NOT NULL,     -- CF-2026-03-07-00123
  license_hash  VARCHAR(64) NOT NULL,            -- HMAC-SHA256 of license key
  product_id    VARCHAR(50) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'open',
    -- open, analyzing, resolved, escalated, closed
  user_description TEXT,
  ki_bundle     JSONB,                           -- Sanitized Klasse-C data only
  ki_diagnosis  JSONB,                           -- KI analysis result (Phase D)
  ki_response   TEXT,                            -- KI-generated answer (Phase D)
  escalated     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_license ON support_tickets(license_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

CREATE SEQUENCE IF NOT EXISTS seq_support_tickets START 1;
