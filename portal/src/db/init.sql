-- Portal DB Schema v0.5.5

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  forgejo_repo VARCHAR(200),
  digistore_product_id VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  customer_email VARCHAR(300) NOT NULL,
  customer_name VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  order_id VARCHAR(100) UNIQUE,
  transaction_id VARCHAR(100),
  source VARCHAR(20) DEFAULT 'portal',
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT uq_license_key UNIQUE (license_key)
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses (license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses (customer_email);

CREATE TABLE IF NOT EXISTS support_cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(20) NOT NULL,
  license_id INTEGER NOT NULL REFERENCES licenses(id),
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'bug',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  priority VARCHAR(10) DEFAULT 'normal',
  pipeline_object_id VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT uq_case_number UNIQUE (case_number)
);

CREATE INDEX IF NOT EXISTS idx_cases_license ON support_cases (license_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON support_cases (status);

CREATE TABLE IF NOT EXISTS ideas (
  id SERIAL PRIMARY KEY,
  idea_number VARCHAR(20) NOT NULL,
  license_id INTEGER NOT NULL REFERENCES licenses(id),
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'new_product',
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  pipeline_object_id VARCHAR(50),
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_idea_number UNIQUE (idea_number)
);

CREATE INDEX IF NOT EXISTS idx_ideas_license ON ideas (license_id);

CREATE TABLE IF NOT EXISTS feature_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(20) NOT NULL,
  license_id INTEGER NOT NULL REFERENCES licenses(id),
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  priority VARCHAR(10) DEFAULT 'normal',
  pipeline_object_id VARCHAR(50),
  target_version VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  CONSTRAINT uq_request_number UNIQUE (request_number)
);

CREATE INDEX IF NOT EXISTS idx_requests_license ON feature_requests (license_id);

CREATE TABLE IF NOT EXISTS dispatch_queue (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(20) NOT NULL,
  source_id INTEGER NOT NULL,
  yaml_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  prod_was_sleeping BOOLEAN DEFAULT false,
  prod_started_at TIMESTAMPTZ,
  prod_ready_at TIMESTAMPTZ,
  pushed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON dispatch_queue (status)
  WHERE status IN ('queued', 'dispatching');

CREATE TABLE IF NOT EXISTS prod_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  server_uuid VARCHAR(100),
  server_ip VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  last_ready_check TIMESTAMPTZ,
  last_ready_result BOOLEAN,
  last_ready_version VARCHAR(20),
  uptime_since TIMESTAMPTZ,
  nightstop_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO prod_status (status) VALUES ('unknown') ON CONFLICT DO NOTHING;

CREATE SEQUENCE IF NOT EXISTS seq_support_cases START 1;
CREATE SEQUENCE IF NOT EXISTS seq_ideas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_feature_requests START 1;

-- IPN Audit-Log (v0.5.0)
CREATE TABLE IF NOT EXISTS digistore_ipn_log (
    id            SERIAL PRIMARY KEY,
    event_type    VARCHAR(50) NOT NULL,
    order_id      VARCHAR(100),
    license_key   VARCHAR(50),
    payload       JSONB,
    processed_at  TIMESTAMPTZ DEFAULT NOW(),
    result        VARCHAR(20) NOT NULL,
    error_msg     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ipn_log_order ON digistore_ipn_log(order_id);

-- Produkt-Texte (v0.5.5)
CREATE TABLE IF NOT EXISTS product_texts (
    id          SERIAL PRIMARY KEY,
    product_id  VARCHAR(50) NOT NULL REFERENCES products(id),
    text_type   VARCHAR(30) NOT NULL,
    content     TEXT NOT NULL,
    locale      VARCHAR(10) NOT NULL DEFAULT 'de',
    version     VARCHAR(20),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_text UNIQUE (product_id, text_type, locale)
);
CREATE INDEX IF NOT EXISTS idx_product_texts_product ON product_texts (product_id);

-- Initiales Produkt
INSERT INTO products (id, name, description, price_cents, status, forgejo_repo)
VALUES ('factory-gateway', 'Factory Gateway', 'API-Gateway fuer die Code-Fabrik', 0, 'active', 'factory/factory-gateway')
ON CONFLICT (id) DO NOTHING;

-- mitglieder-simple (v0.5.6)
INSERT INTO products (id, name, description, price_cents, status, forgejo_repo)
VALUES (
  'mitglieder-simple',
  'MitgliederSimple',
  'Mitgliederverwaltung fuer Vereine — einfach, offline, DSGVO-konform',
  4900,
  'active',
  'factory/mitglieder-simple'
) ON CONFLICT (id) DO NOTHING;
