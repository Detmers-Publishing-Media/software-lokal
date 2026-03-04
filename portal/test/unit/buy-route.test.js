const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');
const { PRODUCTS, INACTIVE_PRODUCT, allActiveProducts } = require('../fixtures/products');

// ---- Mocks in Module-Cache injizieren ----

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

// License-Service Mock
const licenseCalls = [];
const mockLicense = {
  createLicense: async (productId, email, name) => {
    const lic = { license_key: 'LK-GENERATED-001', product_id: productId, customer_email: email, customer_name: name };
    licenseCalls.push({ fn: 'createLicense', ...lic });
    return lic;
  },
  validateLicense: async (key) => {
    licenseCalls.push({ fn: 'validateLicense', key });
    return mockLicense._validateResult;
  },
  _validateResult: null,
};
const licensePath = require.resolve('../../src/services/license');
require.cache[licensePath] = {
  id: licensePath, filename: licensePath, loaded: true,
  exports: mockLicense,
};

// Forgejo-Service Mock
const mockForgejo = {
  getLatestRelease: async (repo) => {
    return mockForgejo._releaseResult;
  },
  _releaseResult: null,
};
const forgejoPath = require.resolve('../../src/services/forgejo');
require.cache[forgejoPath] = {
  id: forgejoPath, filename: forgejoPath, loaded: true,
  exports: mockForgejo,
};

const express = require('express');
const router = require('../../src/routes/api-buy');

describe('Buy Route (Testprodukte)', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(router);
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockPool.reset();
    licenseCalls.length = 0;
    mockLicense._validateResult = null;
    mockForgejo._releaseResult = null;
  });

  it('1: GET /api/products → gibt Testprodukte zurueck', async () => {
    mockPool.mockResult({ rows: allActiveProducts(), rowCount: 2 });
    const res = await fetch(`${baseUrl}/api/products`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 2);
    assert.equal(data[0].id, 'factory-gateway');
    assert.equal(data[1].id, 'test-addon');
  });

  it('2: GET /api/products/:id → einzelnes Produkt', async () => {
    const gw = PRODUCTS['factory-gateway'];
    mockPool.mockResult({ rows: [gw], rowCount: 1 });
    mockForgejo._releaseResult = { tag_name: 'v1.2.0' };
    const res = await fetch(`${baseUrl}/api/products/factory-gateway`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, 'factory-gateway');
    assert.equal(data.latest_version, 'v1.2.0');
  });

  it('3: GET /api/products/nonexistent → 404', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const res = await fetch(`${baseUrl}/api/products/nonexistent`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.ok(data.error.includes('nicht gefunden'));
  });

  it('4: POST /api/buy (gueltig) → 201, license_key + product', async () => {
    const gw = PRODUCTS['factory-gateway'];
    mockPool.mockResult({ rows: [gw], rowCount: 1 });
    const res = await fetch(`${baseUrl}/api/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: 'factory-gateway', customer_email: 'buyer@example.com' }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.license_key, 'LK-GENERATED-001');
    assert.equal(data.product.id, 'factory-gateway');
    assert.equal(data.product.name, 'Factory Gateway');
    assert.ok(data.download_url, 'download_url erwartet fuer Produkt mit forgejo_repo');
  });

  it('5: POST /api/buy ohne product_id → 400', async () => {
    const res = await fetch(`${baseUrl}/api/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_email: 'buyer@example.com' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Pflicht'));
  });

  it('6: POST /api/buy ohne email → 400', async () => {
    const res = await fetch(`${baseUrl}/api/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: 'factory-gateway' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Pflicht'));
  });

  it('7: POST /api/buy mit inaktivem Produkt → 404', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const res = await fetch(`${baseUrl}/api/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: 'archived-tool', customer_email: 'buyer@example.com' }),
    });
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.ok(data.error.includes('nicht aktiv'));
  });

  it('8: GET /api/download ohne key → 400', async () => {
    const res = await fetch(`${baseUrl}/api/download/factory-gateway`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('key'));
  });
});
