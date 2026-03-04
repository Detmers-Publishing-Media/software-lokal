// Testprodukte — spiegeln init.sql-Schema wider
const PRODUCTS = {
  'factory-gateway': {
    id: 'factory-gateway',
    name: 'Factory Gateway',
    description: 'API-Gateway fuer die Code-Fabrik',
    price_cents: 0,
    status: 'active',
    forgejo_repo: 'factory/factory-gateway',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  'test-addon': {
    id: 'test-addon',
    name: 'Test Addon',
    description: 'Kostenpflichtiges Zusatzmodul',
    price_cents: 4900,
    status: 'active',
    forgejo_repo: null,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
};

// Inaktives Produkt fuer Negativtests
const INACTIVE_PRODUCT = {
  id: 'archived-tool',
  name: 'Archived Tool',
  description: 'Nicht mehr verfuegbar',
  price_cents: 1900,
  status: 'inactive',
  forgejo_repo: null,
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-12-01T00:00:00Z',
};

function allActiveProducts() {
  return Object.values(PRODUCTS);
}

function productById(id) {
  return PRODUCTS[id] || null;
}

module.exports = { PRODUCTS, INACTIVE_PRODUCT, allActiveProducts, productById };
