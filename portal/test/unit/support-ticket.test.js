const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');

// ---- Mocks ----
const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

const express = require('express');
const ticketRoute = require('../../src/routes/api-support-ticket');

const VALID_HASH = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';

describe('api-support-ticket', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(ticketRoute);
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
  });

  // Helper: mock validateByHash to succeed
  function mockValidLicense() {
    return {
      id: 1,
      license_hash: VALID_HASH,
      product_id: 'mitglieder-simple',
      product_name: 'Mitglieder lokal',
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
    };
  }

  describe('POST /api/support/ticket', () => {
    it('returns 400 without licenseHash', async () => {
      const res = await fetch(`${baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });

    it('returns 403 for invalid license hash', async () => {
      mockPool.mockResult({ rows: [], rowCount: 0 });

      const res = await fetch(`${baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseHash: 'invalid' }),
      });
      assert.equal(res.status, 403);
    });

    it('creates ticket for valid license', async () => {
      mockPool.mockResults([
        // validateByHash
        { rows: [mockValidLicense()], rowCount: 1 },
        // nextval
        { rows: [{ nextval: 42 }], rowCount: 1 },
        // INSERT
        {
          rows: [{
            ticket_ref: 'CF-2026-03-07-00042',
            status: 'open',
            created_at: new Date().toISOString(),
          }],
          rowCount: 1,
        },
      ]);

      const res = await fetch(`${baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseHash: VALID_HASH,
          productId: 'mitglieder-simple',
          userDescription: 'DB laesst sich nicht oeffnen',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.ticketRef);
      assert.equal(data.status, 'open');
    });

    it('accepts kiBundle', async () => {
      mockPool.mockResults([
        { rows: [mockValidLicense()], rowCount: 1 },
        { rows: [{ nextval: 43 }], rowCount: 1 },
        {
          rows: [{
            ticket_ref: 'CF-2026-03-07-00043',
            status: 'open',
            created_at: new Date().toISOString(),
          }],
          rowCount: 1,
        },
      ]);

      const kiBundle = {
        files: [
          { name: 'case-summary.json', content: '{"product":"Test"}' },
          { name: 'log-signatures.json', content: '[]' },
        ],
      };

      const res = await fetch(`${baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseHash: VALID_HASH,
          kiBundle,
        }),
      });

      assert.equal(res.status, 201);
      // Check that ki_bundle was passed to the INSERT
      const insertCall = mockPool._calls.find(c => c.sql.includes('INSERT INTO support_tickets'));
      assert.ok(insertCall);
      // ki_bundle is the 5th parameter
      assert.ok(insertCall.params[4]);
    });
  });

  describe('GET /api/support/tickets', () => {
    it('returns 400 without licenseHash', async () => {
      const res = await fetch(`${baseUrl}/api/support/tickets`);
      assert.equal(res.status, 400);
    });

    it('returns 403 for invalid license', async () => {
      mockPool.mockResult({ rows: [], rowCount: 0 });

      const res = await fetch(`${baseUrl}/api/support/tickets?licenseHash=invalid`);
      assert.equal(res.status, 403);
    });

    it('returns tickets for valid license', async () => {
      mockPool.mockResults([
        // validateByHash
        { rows: [mockValidLicense()], rowCount: 1 },
        // SELECT tickets
        {
          rows: [
            { ticket_ref: 'CF-2026-03-07-00001', product_id: 'mitglieder-simple', status: 'open' },
            { ticket_ref: 'CF-2026-03-06-00001', product_id: 'mitglieder-simple', status: 'resolved' },
          ],
          rowCount: 2,
        },
      ]);

      const res = await fetch(`${baseUrl}/api/support/tickets?licenseHash=${VALID_HASH}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.length, 2);
      assert.equal(data[0].ticket_ref, 'CF-2026-03-07-00001');
    });

    it('filters by status', async () => {
      mockPool.mockResults([
        { rows: [mockValidLicense()], rowCount: 1 },
        { rows: [], rowCount: 0 },
      ]);

      const res = await fetch(`${baseUrl}/api/support/tickets?licenseHash=${VALID_HASH}&status=open`);
      assert.equal(res.status, 200);

      // Check that status filter was applied in query
      const selectCall = mockPool._calls.find(c => c.sql.includes('support_tickets'));
      assert.ok(selectCall);
      assert.ok(selectCall.sql.includes('ANY'));
    });
  });

  describe('GET /api/support/ticket/:ticketRef', () => {
    it('returns 400 without licenseHash', async () => {
      const res = await fetch(`${baseUrl}/api/support/ticket/CF-2026-03-07-00001`);
      assert.equal(res.status, 400);
    });

    it('returns 404 for non-existent ticket', async () => {
      mockPool.mockResults([
        { rows: [mockValidLicense()], rowCount: 1 },
        { rows: [], rowCount: 0 },
      ]);

      const res = await fetch(`${baseUrl}/api/support/ticket/CF-NOPE?licenseHash=${VALID_HASH}`);
      assert.equal(res.status, 404);
    });

    it('returns ticket detail', async () => {
      const ticket = {
        ticket_ref: 'CF-2026-03-07-00001',
        product_id: 'mitglieder-simple',
        status: 'resolved',
        user_description: 'Problem',
        ki_response: 'Loesung gefunden',
        escalated: false,
        created_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      };

      mockPool.mockResults([
        { rows: [mockValidLicense()], rowCount: 1 },
        { rows: [ticket], rowCount: 1 },
      ]);

      const res = await fetch(`${baseUrl}/api/support/ticket/CF-2026-03-07-00001?licenseHash=${VALID_HASH}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ticket_ref, 'CF-2026-03-07-00001');
      assert.equal(data.ki_response, 'Loesung gefunden');
    });
  });
});
