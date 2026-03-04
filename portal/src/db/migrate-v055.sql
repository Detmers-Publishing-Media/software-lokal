-- Migration v0.5.5: product_texts Tabelle

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
