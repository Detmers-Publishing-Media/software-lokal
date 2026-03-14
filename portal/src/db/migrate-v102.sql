-- v1.0.2: Feature Request Erwartungsmanagement
-- decline_reason for transparent rejection communication
ALTER TABLE feature_requests ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- votes counter on feature requests
ALTER TABLE feature_requests ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0;

-- vote tracking table (one vote per license per request)
CREATE TABLE IF NOT EXISTS feature_request_votes (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES feature_requests(id),
  license_id INTEGER NOT NULL REFERENCES licenses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_request_vote UNIQUE (request_id, license_id)
);
