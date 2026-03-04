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

// License-Service Mock
const mockLicense = {
  validateLicense: async (key) => mockLicense._result,
  createLicense: async () => ({}),
  _result: null,
};
const licensePath = require.resolve('../../src/services/license');
require.cache[licensePath] = {
  id: licensePath, filename: licensePath, loaded: true,
  exports: mockLicense,
};

// Forgejo-Service Mock
const mockForgejo = {
  getLatestRelease: async () => mockForgejo._releaseResult,
  _releaseResult: null,
};
const forgejoPath = require.resolve('../../src/services/forgejo');
require.cache[forgejoPath] = {
  id: forgejoPath, filename: forgejoPath, loaded: true,
  exports: mockForgejo,
};

const express = require('express');
const router = require('../../src/routes/api-buy');

describe('Download Page — GET /api/license/:key', () => {
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
    mockLicense._result = null;
    mockForgejo._releaseResult = null;
  });

  it('1: gueltige Lizenz → 200, Produkt + Version + Download-URL', async () => {
    mockLicense._result = {
      license_key: 'LK-TEST-001',
      product_id: 'factory-gateway',
      product_name: 'Factory Gateway',
      forgejo_repo: 'factory/factory-gateway',
      issued_at: '2026-01-01T00:00:00Z',
      expires_at: null,
    };
    mockPool.mockResult({ rows: [{ description: 'API-Gateway fuer die Code-Fabrik' }], rowCount: 1 });
    mockForgejo._releaseResult = { tag_name: 'v1.2.0' };

    const res = await fetch(`${baseUrl}/api/license/LK-TEST-001`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.license_key, 'LK-TEST-001');
    assert.equal(data.status, 'active');
    assert.equal(data.product.id, 'factory-gateway');
    assert.equal(data.product.name, 'Factory Gateway');
    assert.equal(data.product.description, 'API-Gateway fuer die Code-Fabrik');
    assert.equal(data.latest_version, 'v1.2.0');
    assert.equal(data.download_url, '/api/download/factory-gateway?key=LK-TEST-001');
  });

  it('2: gueltige Lizenz ohne forgejo_repo → 200, download_url = null', async () => {
    mockLicense._result = {
      license_key: 'LK-ADDON-001',
      product_id: 'test-addon',
      product_name: 'Test Addon',
      forgejo_repo: null,
      issued_at: '2026-02-01T00:00:00Z',
      expires_at: null,
    };
    mockPool.mockResult({ rows: [{ description: 'Kostenpflichtiges Modul' }], rowCount: 1 });

    const res = await fetch(`${baseUrl}/api/license/LK-ADDON-001`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.download_url, null);
    assert.equal(data.latest_version, null);
    assert.equal(data.product.name, 'Test Addon');
  });

  it('3: ungueltige Lizenz → 403', async () => {
    mockLicense._result = null;
    const res = await fetch(`${baseUrl}/api/license/INVALID-KEY`);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('ungueltig'));
  });

  it('4: revoked Lizenz → 403 (validateLicense gibt null zurueck)', async () => {
    // validateLicense prueft status='active', revoked Keys geben null
    mockLicense._result = null;
    const res = await fetch(`${baseUrl}/api/license/REVOKED-KEY`);
    assert.equal(res.status, 403);
  });

  it('5: abgelaufene Lizenz → 403 (validateLicense gibt null zurueck)', async () => {
    // validateLicense prueft expires_at > NOW(), abgelaufene Keys geben null
    mockLicense._result = null;
    const res = await fetch(`${baseUrl}/api/license/EXPIRED-KEY`);
    assert.equal(res.status, 403);
  });

  it('6: Response enthaelt issued_at und expires_at', async () => {
    mockLicense._result = {
      license_key: 'LK-DATES',
      product_id: 'factory-gateway',
      product_name: 'Factory Gateway',
      forgejo_repo: null,
      issued_at: '2026-01-15T10:30:00Z',
      expires_at: '2027-01-15T10:30:00Z',
    };
    mockPool.mockResult({ rows: [{ description: '' }], rowCount: 1 });

    const res = await fetch(`${baseUrl}/api/license/LK-DATES`);
    const data = await res.json();
    assert.equal(data.issued_at, '2026-01-15T10:30:00Z');
    assert.equal(data.expires_at, '2027-01-15T10:30:00Z');
  });

  it('7: latest_version aus Forgejo Release', async () => {
    mockLicense._result = {
      license_key: 'LK-VER',
      product_id: 'factory-gateway',
      product_name: 'Factory Gateway',
      forgejo_repo: 'factory/factory-gateway',
      issued_at: '2026-01-01T00:00:00Z',
      expires_at: null,
    };
    mockPool.mockResult({ rows: [{ description: '' }], rowCount: 1 });
    mockForgejo._releaseResult = { tag_name: 'v2.0.0-beta' };

    const res = await fetch(`${baseUrl}/api/license/LK-VER`);
    const data = await res.json();
    assert.equal(data.latest_version, 'v2.0.0-beta');
  });

  it('8: ohne Forgejo Release → latest_version = null', async () => {
    mockLicense._result = {
      license_key: 'LK-NOREL',
      product_id: 'factory-gateway',
      product_name: 'Factory Gateway',
      forgejo_repo: 'factory/factory-gateway',
      issued_at: '2026-01-01T00:00:00Z',
      expires_at: null,
    };
    mockPool.mockResult({ rows: [{ description: '' }], rowCount: 1 });
    mockForgejo._releaseResult = null;

    const res = await fetch(`${baseUrl}/api/license/LK-NOREL`);
    const data = await res.json();
    assert.equal(data.latest_version, null);
    assert.ok(data.download_url, 'download_url sollte trotzdem gesetzt sein');
  });
});
