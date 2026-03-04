const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');

// ---- Mocks in Module-Cache injizieren ----

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

// License-Service Mock (wird von api-buy benoetigt)
const mockLicense = {
  createLicense: async () => ({ license_key: 'LK-MOCK' }),
  validateLicense: async () => null,
};
const licensePath = require.resolve('../../src/services/license');
require.cache[licensePath] = {
  id: licensePath, filename: licensePath, loaded: true,
  exports: mockLicense,
};

// Forgejo-Service Mock
const mockForgejo = { getLatestRelease: async () => null };
const forgejoPath = require.resolve('../../src/services/forgejo');
require.cache[forgejoPath] = {
  id: forgejoPath, filename: forgejoPath, loaded: true,
  exports: mockForgejo,
};

// Digistore24 API Mock
const digistoreCalls = [];
const mockDigistore = {
  createProduct: async (params) => {
    digistoreCalls.push(params);
    if (mockDigistore._shouldFail) {
      throw new Error('Digistore24: API-Fehler simuliert');
    }
    return mockDigistore._productId || 'DS-12345';
  },
  getGlobalSettings: async () => ({}),
  _shouldFail: false,
  _productId: null,
};
const digistorePath = require.resolve('../../src/services/digistore-api');
require.cache[digistorePath] = {
  id: digistorePath, filename: digistorePath, loaded: true,
  exports: mockDigistore,
};

// ADMIN_TOKEN setzen
process.env.ADMIN_TOKEN = 'test-admin-secret';

const express = require('express');
const router = require('../../src/routes/api-buy');

describe('Admin: POST /api/products', () => {
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
    digistoreCalls.length = 0;
    mockDigistore._shouldFail = false;
    mockDigistore._productId = null;
  });

  it('1: POST ohne ADMIN_TOKEN → 401', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test', name: 'Test' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  it('2: POST mit ADMIN_TOKEN, gueltige Daten → 201', async () => {
    // 1. Duplikat-Check: kein Treffer
    // 2. INSERT: neues Produkt
    // 3. UPDATE: digistore_product_id setzen
    mockPool.mockResults([
      { rows: [], rowCount: 0 },
      { rows: [{
        id: 'test-gutschein',
        name: 'Kostenloser Gutschein',
        description: 'Download + Support',
        price_cents: 0,
        status: 'active',
        forgejo_repo: null,
        digistore_product_id: null,
        created_at: '2026-03-03T00:00:00Z',
        updated_at: '2026-03-03T00:00:00Z',
      }], rowCount: 1 },
      { rows: [], rowCount: 1 },
    ]);

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-secret',
      },
      body: JSON.stringify({
        id: 'test-gutschein',
        name: 'Kostenloser Gutschein',
        description: 'Download + Support',
        price_cents: 0,
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.id, 'test-gutschein');
    assert.equal(data.digistore_product_id, 'DS-12345');
    assert.equal(digistoreCalls.length, 1);
    assert.equal(digistoreCalls[0].name, 'Kostenloser Gutschein');
  });

  it('3: POST ohne name → 400', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-secret',
      },
      body: JSON.stringify({ id: 'test-no-name' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Pflicht'));
  });

  it('4: POST duplikat id → 409', async () => {
    mockPool.mockResult({ rows: [{ id: 'existing-product' }], rowCount: 1 });

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-secret',
      },
      body: JSON.stringify({ id: 'existing-product', name: 'Duplikat' }),
    });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes('existiert bereits'));
  });

  it('5: Digistore24 API-Fehler → 201 mit sync_error', async () => {
    mockDigistore._shouldFail = true;
    mockPool.mockResults([
      { rows: [], rowCount: 0 },
      { rows: [{
        id: 'sync-fail-product',
        name: 'Sync Fail',
        description: null,
        price_cents: 0,
        status: 'active',
        forgejo_repo: null,
        digistore_product_id: null,
        created_at: '2026-03-03T00:00:00Z',
        updated_at: '2026-03-03T00:00:00Z',
      }], rowCount: 1 },
    ]);

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-secret',
      },
      body: JSON.stringify({ id: 'sync-fail-product', name: 'Sync Fail' }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.id, 'sync-fail-product');
    assert.equal(data.digistore_product_id, null);
    assert.ok(data.digistore_sync_error.includes('API-Fehler'));
  });
});
