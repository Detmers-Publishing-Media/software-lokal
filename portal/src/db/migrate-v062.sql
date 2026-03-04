-- Migration v0.6.2: test_reports Tabelle fuer oeffentliche Testberichte

CREATE TABLE IF NOT EXISTS test_reports (
    id              SERIAL PRIMARY KEY,
    product_id      VARCHAR(50) NOT NULL,
    platform        VARCHAR(20) NOT NULL,
    version         VARCHAR(20),
    total_tests     INTEGER NOT NULL DEFAULT 0,
    passed_tests    INTEGER NOT NULL DEFAULT 0,
    failed_tests    INTEGER NOT NULL DEFAULT 0,
    test_details    JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
