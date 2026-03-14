const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');

// Set ADMIN_TOKEN before loading routes (admin-auth reads it at require time)
process.env.ADMIN_TOKEN = 'test-admin-secret';

// ---- Mocks ----

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

// license-keygen is pure, no need to mock
// But license.js uses pool, which is already mocked

const express = require('express');
const licenseRoute = require('../../src/routes/api-license');

describe('api-license', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(licenseRoute);
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockPool.reset();
    if (licenseRoute._resetTrialRate) licenseRoute._resetTrialRate();
  });

  describe('POST /api/license/validate', () => {
    it('returns missing_key when no licenseKey', async () => {
      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'missing_key');
    });

    it('returns unknown for non-existent key', async () => {
      // validateForApp queries licenses + products
      mockPool.mockResult({ rows: [], rowCount: 0 });

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'CFML-XXXX-YYYY-ZZZZ-WWWW' }),
      });
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'unknown');
    });

    it('returns active for valid license', async () => {
      // First query: SELECT license
      mockPool.mockResults([
        {
          rows: [{
            id: 1,
            license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
            product_id: 'mitglieder-lokal',
            product_name: 'MitgliederSimple',
            status: 'active',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }],
          rowCount: 1,
        },
        // Second query: UPDATE validation tracking
        { rows: [], rowCount: 1 },
      ]);

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS',
          productId: 'mitglieder-lokal',
        }),
      });
      const data = await res.json();
      assert.equal(data.valid, true);
      assert.equal(data.status, 'active');
      assert.equal(data.productId, 'mitglieder-lokal');
      assert.ok(Array.isArray(data.features));
      assert.ok(data.features.includes('support'));
    });

    it('returns wrong_product for mismatched product', async () => {
      mockPool.mockResult({
        rows: [{
          id: 1,
          license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
          product_id: 'mitglieder-lokal',
          status: 'active',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS',
          productId: 'finanz-rechner',
        }),
      });
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'wrong_product');
    });

    it('returns revoked for revoked license', async () => {
      mockPool.mockResult({
        rows: [{
          id: 1,
          license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
          product_id: 'mitglieder-lokal',
          status: 'revoked',
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS' }),
      });
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'revoked');
    });

    it('returns expired for expired license', async () => {
      mockPool.mockResult({
        rows: [{
          id: 1,
          license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
          product_id: 'mitglieder-lokal',
          status: 'active',
          expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS' }),
      });
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'expired');
    });

    it('updates validation tracking on success', async () => {
      mockPool.mockResults([
        {
          rows: [{
            id: 42,
            license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
            product_id: 'mitglieder-lokal',
            status: 'active',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }],
          rowCount: 1,
        },
        { rows: [], rowCount: 1 },
      ]);

      await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS' }),
      });

      // Second call should be the UPDATE for validation tracking
      assert.equal(mockPool._calls.length, 2);
      assert.ok(mockPool._calls[1].sql.includes('validation_count'));
      assert.ok(mockPool._calls[1].sql.includes('last_validated_at'));
    });
  });

  describe('POST /api/admin/trial-key', () => {
    it('returns 401 without admin token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/trial-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'mitglieder-lokal' }),
      });
      assert.equal(res.status, 401);
    });

    it('returns 401 with wrong token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/trial-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wrong-token',
        },
        body: JSON.stringify({ productId: 'mitglieder-lokal' }),
      });
      assert.equal(res.status, 401);
    });

    it('returns 400 for invalid productId', async () => {
      const res = await fetch(`${baseUrl}/api/admin/trial-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-secret',
        },
        body: JSON.stringify({ productId: 'unknown-product' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.validProducts);
    });

    it('creates trial key for mitglieder-lokal', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      mockPool.mockResult({
        rows: [{
          license_key: 'CFTM-ABCD-EFGH-JKMN-PQ12',
          product_id: 'mitglieder-lokal',
          expires_at: expiresAt,
          source: 'manual',
          note: 'Test',
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/admin/trial-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-secret',
        },
        body: JSON.stringify({ productId: 'mitglieder-lokal', note: 'Test' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.productId, 'mitglieder-lokal');
      assert.equal(data.source, 'manual');
      assert.equal(data.note, 'Test');
      assert.ok(data.licenseKey);
      assert.ok(data.expiresAt);
    });

    it('creates trial key for finanz-rechner', async () => {
      mockPool.mockResult({
        rows: [{
          license_key: 'CFTR-WXYZ-ABCD-EFGH-JK34',
          product_id: 'finanz-rechner',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'manual',
          note: null,
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/admin/trial-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-secret',
        },
        body: JSON.stringify({ productId: 'finanz-rechner' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.productId, 'finanz-rechner');
    });
  });

  describe('POST /api/license/validate with instanceId', () => {
    it('passes instanceId to validateForApp', async () => {
      mockPool.mockResults([
        { rows: [{ id: 1, license_key: 'CFML-ABCD-EFGH-JKMN-PQRS', product_id: 'mitglieder-lokal', status: 'active', expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }], rowCount: 1 },
        { rows: [], rowCount: 0 }, // DELETE stale
        { rows: [], rowCount: 1 }, // INSERT instance
        { rows: [{ cnt: '1' }], rowCount: 1 }, // COUNT
        { rows: [], rowCount: 1 }, // UPDATE tracking
      ]);

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS',
          productId: 'mitglieder-lokal',
          instanceId: 'test-instance-uuid',
        }),
      });
      const data = await res.json();
      assert.equal(data.valid, true);
    });

    it('returns instance_limit_exceeded', async () => {
      mockPool.mockResults([
        { rows: [{ id: 1, license_key: 'CFML-ABCD-EFGH-JKMN-PQRS', product_id: 'mitglieder-lokal', status: 'active', expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }], rowCount: 1 },
        { rows: [], rowCount: 0 }, // DELETE stale
        { rows: [], rowCount: 1 }, // INSERT instance
        { rows: [{ cnt: '4' }], rowCount: 1 }, // COUNT > 3
        { rows: [], rowCount: 1 }, // DELETE newly inserted
      ]);

      const res = await fetch(`${baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'CFML-ABCD-EFGH-JKMN-PQRS',
          instanceId: 'fourth-instance',
        }),
      });
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'instance_limit_exceeded');
    });
  });

  describe('POST /api/license/trial', () => {
    it('returns 400 for missing productId', async () => {
      const res = await fetch(`${baseUrl}/api/license/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });

    it('returns 400 for invalid product', async () => {
      const res = await fetch(`${baseUrl}/api/license/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'unknown' }),
      });
      assert.equal(res.status, 400);
    });

    it('creates trial key for valid product', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      mockPool.mockResult({
        rows: [{
          license_key: 'CFTM-AUTO-TEST-ABCD-EF12',
          product_id: 'mitglieder-lokal',
          expires_at: expiresAt,
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'mitglieder-lokal' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.licenseKey);
      assert.equal(data.productId, 'mitglieder-lokal');
      assert.ok(data.expiresAt);
    });

    it('creates trial key for berater-lokal', async () => {
      mockPool.mockResult({
        rows: [{
          license_key: 'CFTB-AUTO-TEST-ABCD-EF12',
          product_id: 'berater-lokal',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'berater-lokal' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.productId, 'berater-lokal');
    });
  });

  describe('GET /api/license/recover', () => {
    it('returns found: false for missing orderId', async () => {
      const res = await fetch(`${baseUrl}/api/license/recover`);
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.found, false);
    });

    it('returns found: false for unknown order', async () => {
      mockPool.mockResult({ rows: [], rowCount: 0 });

      const res = await fetch(`${baseUrl}/api/license/recover?orderId=UNKNOWN`);
      const data = await res.json();
      assert.equal(data.found, false);
    });

    it('returns masked key for known order', async () => {
      mockPool.mockResult({
        rows: [{
          license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
          product_id: 'mitglieder-lokal',
          status: 'active',
          expires_at: '2027-03-07T00:00:00Z',
        }],
        rowCount: 1,
      });

      const res = await fetch(`${baseUrl}/api/license/recover?orderId=ORD-123`);
      const data = await res.json();
      assert.equal(data.found, true);
      assert.equal(data.productId, 'mitglieder-lokal');
      assert.equal(data.status, 'active');
      // Key should be masked
      assert.ok(data.licenseKey.includes('****'), `Key should be masked: ${data.licenseKey}`);
      // Full key should also be present
      assert.equal(data.licenseKeyFull, 'CFML-ABCD-EFGH-JKMN-PQRS');
    });
  });
});
