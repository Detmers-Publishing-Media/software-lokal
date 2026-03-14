const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');

// Set ADMIN_TOKEN before loading routes
process.env.ADMIN_TOKEN = 'test-admin-secret';

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

const express = require('express');
const adminRoute = require('../../src/routes/api-admin-dashboard');

describe('api-admin-dashboard', () => {
  let server;
  let baseUrl;
  const authHeader = { Authorization: 'Bearer test-admin-secret' };

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(adminRoute);
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
  });

  // --- Auth ---

  describe('authentication', () => {
    it('rejects requests without token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`);
      assert.equal(res.status, 401);
    });

    it('rejects requests with wrong token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: 'Bearer wrong-token' },
      });
      assert.equal(res.status, 401);
    });

    it('accepts Bearer token', async () => {
      mockPool.mockResults([
        { rows: [{ open: '2', analyzing: '1', resolved: '5', total: '8' }] },
        { rows: [{ submitted: '3', planned: '1', in_progress: '0', released: '2', declined: '0', total: '6' }] },
        { rows: [{ active: '10', trial: '3', paid: '7', total: '10' }] },
      ]);
      const res = await fetch(`${baseUrl}/api/admin/stats`, { headers: authHeader });
      assert.equal(res.status, 200);
    });

    it('accepts query param token', async () => {
      mockPool.mockResults([
        { rows: [{ open: '0', analyzing: '0', resolved: '0', total: '0' }] },
        { rows: [{ submitted: '0', planned: '0', in_progress: '0', released: '0', declined: '0', total: '0' }] },
        { rows: [{ active: '0', trial: '0', paid: '0', total: '0' }] },
      ]);
      const res = await fetch(`${baseUrl}/api/admin/stats?admin_token=test-admin-secret`);
      assert.equal(res.status, 200);
    });
  });

  // --- Stats ---

  describe('GET /api/admin/stats', () => {
    it('returns dashboard stats', async () => {
      mockPool.mockResults([
        { rows: [{ open: '2', analyzing: '1', resolved: '5', total: '8' }] },
        { rows: [{ submitted: '3', planned: '1', in_progress: '0', released: '2', declined: '0', total: '6' }] },
        { rows: [{ active: '10', trial: '3', paid: '7', total: '10' }] },
      ]);
      const res = await fetch(`${baseUrl}/api/admin/stats`, { headers: authHeader });
      const data = await res.json();
      assert.equal(data.tickets.open, '2');
      assert.equal(data.requests.submitted, '3');
      assert.equal(data.licenses.active, '10');
    });
  });

  // --- Tickets ---

  describe('GET /api/admin/tickets', () => {
    it('returns ticket list', async () => {
      mockPool.mockResult({
        rows: [
          { id: 1, ticket_ref: 'CF-2026-03-13-00001', status: 'open', product_id: 'berater-lokal' },
          { id: 2, ticket_ref: 'CF-2026-03-13-00002', status: 'analyzing', product_id: 'nachweis-lokal' },
        ],
      });
      const res = await fetch(`${baseUrl}/api/admin/tickets`, { headers: authHeader });
      const data = await res.json();
      assert.equal(data.length, 2);
      assert.equal(data[0].ticket_ref, 'CF-2026-03-13-00001');
    });

    it('filters by status', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'open' }] });
      const res = await fetch(`${baseUrl}/api/admin/tickets?status=open`, { headers: authHeader });
      assert.equal(res.status, 200);
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('t.status = $1'));
      assert.deepEqual(call.params, ['open']);
    });

    it('filters by product_id', async () => {
      mockPool.mockResult({ rows: [] });
      const res = await fetch(`${baseUrl}/api/admin/tickets?product_id=berater-lokal`, { headers: authHeader });
      assert.equal(res.status, 200);
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('t.product_id = $1'));
      assert.deepEqual(call.params, ['berater-lokal']);
    });
  });

  describe('GET /api/admin/tickets/:id', () => {
    it('returns single ticket', async () => {
      mockPool.mockResult({ rows: [{ id: 42, ticket_ref: 'CF-2026-03-13-00042', status: 'open' }] });
      const res = await fetch(`${baseUrl}/api/admin/tickets/42`, { headers: authHeader });
      const data = await res.json();
      assert.equal(data.id, 42);
    });

    it('returns 404 for unknown ticket', async () => {
      mockPool.mockResult({ rows: [] });
      const res = await fetch(`${baseUrl}/api/admin/tickets/999`, { headers: authHeader });
      assert.equal(res.status, 404);
    });
  });

  describe('PATCH /api/admin/tickets/:id', () => {
    it('updates ticket status', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'analyzing' }] });
      const res = await fetch(`${baseUrl}/api/admin/tickets/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'analyzing' }),
      });
      const data = await res.json();
      assert.equal(data.status, 'analyzing');
    });

    it('sets resolved_at when resolving', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'resolved' }] });
      await fetch(`${baseUrl}/api/admin/tickets/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('resolved_at = NOW()'));
    });

    it('rejects empty update', async () => {
      const res = await fetch(`${baseUrl}/api/admin/tickets/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  // --- Feature Requests ---

  describe('GET /api/admin/requests', () => {
    it('returns request list sorted by votes', async () => {
      mockPool.mockResult({
        rows: [
          { id: 1, title: 'Dark Mode', votes: 12, status: 'submitted' },
          { id: 2, title: 'Export PDF', votes: 5, status: 'planned' },
        ],
      });
      const res = await fetch(`${baseUrl}/api/admin/requests`, { headers: authHeader });
      const data = await res.json();
      assert.equal(data.length, 2);
      assert.equal(data[0].title, 'Dark Mode');
    });

    it('filters by status and product_id', async () => {
      mockPool.mockResult({ rows: [] });
      const res = await fetch(
        `${baseUrl}/api/admin/requests?status=planned&product_id=nachweis-lokal`,
        { headers: authHeader }
      );
      assert.equal(res.status, 200);
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('r.status = $1'));
      assert.ok(call.sql.includes('r.product_id = $2'));
    });
  });

  describe('PATCH /api/admin/requests/:id', () => {
    it('updates request status and target_version', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'planned', target_version: 'v0.3.0' }] });
      const res = await fetch(`${baseUrl}/api/admin/requests/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'planned', target_version: 'v0.3.0' }),
      });
      const data = await res.json();
      assert.equal(data.status, 'planned');
    });

    it('sets released_at when releasing', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'released' }] });
      await fetch(`${baseUrl}/api/admin/requests/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'released' }),
      });
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('released_at = NOW()'));
    });

    it('declines with reason', async () => {
      mockPool.mockResult({ rows: [{ id: 1, status: 'declined', decline_reason: 'Out of scope' }] });
      const res = await fetch(`${baseUrl}/api/admin/requests/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined', decline_reason: 'Out of scope' }),
      });
      assert.equal(res.status, 200);
    });

    it('rejects empty update', async () => {
      const res = await fetch(`${baseUrl}/api/admin/requests/1`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  // --- Licenses ---

  describe('GET /api/admin/licenses', () => {
    it('returns license list with instance count', async () => {
      mockPool.mockResult({
        rows: [
          { id: 1, license_key: 'CFNW-AAAA-BBBB-CCCC-DDEE', product_id: 'nachweis-lokal', status: 'active', instance_count: '2' },
        ],
      });
      const res = await fetch(`${baseUrl}/api/admin/licenses`, { headers: authHeader });
      const data = await res.json();
      assert.equal(data.length, 1);
      assert.equal(data[0].instance_count, '2');
    });

    it('filters by status', async () => {
      mockPool.mockResult({ rows: [] });
      await fetch(`${baseUrl}/api/admin/licenses?status=active`, { headers: authHeader });
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('l.status = $1'));
    });

    it('filters by source', async () => {
      mockPool.mockResult({ rows: [] });
      await fetch(`${baseUrl}/api/admin/licenses?source=auto-trial`, { headers: authHeader });
      const call = mockPool._calls[0];
      assert.ok(call.sql.includes('l.source = $1'));
    });
  });
});
