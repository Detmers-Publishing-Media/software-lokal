const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');
const path = require('path');

// Pool-Mock ins Module-Cache injizieren, BEVOR license.js geladen wird
const poolPath = path.resolve(__dirname, '../../src/db/pool.js');
const mockPool = createMockPool();
require.cache[require.resolve(poolPath)] = {
  id: poolPath,
  filename: poolPath,
  loaded: true,
  exports: mockPool,
};

const license = require('../../src/services/license');

describe('license-service', () => {
  beforeEach(() => {
    mockPool.reset();
  });

  it('1: validateLicense — aktive Lizenz → Objekt', async () => {
    const row = { license_key: 'LK-123', status: 'active', product_name: 'Test' };
    mockPool.mockResult({ rows: [row], rowCount: 1 });
    const result = await license.validateLicense('LK-123');
    assert.deepEqual(result, row);
  });

  it('2: validateLicense — nicht gefunden → null', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const result = await license.validateLicense('INVALID');
    assert.equal(result, null);
  });

  it('3: validateLicense — Query enthaelt expires_at-Pruefung', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    await license.validateLicense('LK-123');
    assert.equal(mockPool._calls.length, 1);
    assert.ok(mockPool._calls[0].sql.includes('expires_at'));
    assert.ok(mockPool._calls[0].sql.includes('NOW()'));
  });

  it('4: activateFromIPN — erfolgreicher Insert', async () => {
    mockPool.mockResult({ rows: [], rowCount: 1 });
    await license.activateFromIPN({
      order_id: 'ORD-1',
      license_key: 'LK-NEW',
      product_id: 'PROD-1',
      buyer_email: 'test@example.com',
      buyer_name: 'Test User',
      payment_id: 'PAY-1',
    });
    assert.equal(mockPool._calls.length, 1);
    assert.ok(mockPool._calls[0].sql.includes('INSERT INTO licenses'));
    assert.deepEqual(mockPool._calls[0].params, [
      'LK-NEW', 'PROD-1', 'test@example.com', 'Test User', 'ORD-1', 'PAY-1',
    ]);
  });

  it('5: activateFromIPN — Query enthaelt ON CONFLICT (Idempotenz)', async () => {
    mockPool.mockResult({ rows: [], rowCount: 1 });
    await license.activateFromIPN({
      order_id: 'ORD-1', license_key: 'LK-1', product_id: 'P',
      buyer_email: 'e@e.com', buyer_name: null, payment_id: 'PAY',
    });
    assert.ok(mockPool._calls[0].sql.includes('ON CONFLICT'));
    assert.ok(mockPool._calls[0].sql.includes('order_id'));
  });

  it('6: revokeByOrderId — existierende Order → rowCount 1', async () => {
    mockPool.mockResult({ rows: [{ license_key: 'LK-X' }], rowCount: 1 });
    const result = await license.revokeByOrderId('ORD-1');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].license_key, 'LK-X');
  });

  it('7: revokeByOrderId — nicht-existierende Order → rowCount 0', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const result = await license.revokeByOrderId('NOPE');
    assert.equal(result.rowCount, 0);
  });

  it('8: expireByOrderId — existierende Order → rowCount 1', async () => {
    mockPool.mockResult({ rows: [{ license_key: 'LK-Y' }], rowCount: 1 });
    const result = await license.expireByOrderId('ORD-2');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].license_key, 'LK-Y');
  });

  it('9: expireByOrderId — nicht-existierende Order → rowCount 0', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const result = await license.expireByOrderId('NOPE');
    assert.equal(result.rowCount, 0);
  });

  it('10: createLicense — gibt erstes Row zurueck', async () => {
    const row = { license_key: 'LK-GEN', product_id: 'P1', customer_email: 'e@e.com' };
    mockPool.mockResult({ rows: [row], rowCount: 1 });
    const result = await license.createLicense('P1', 'e@e.com', 'Name');
    assert.deepEqual(result, row);
    assert.ok(mockPool._calls[0].sql.includes('RETURNING'));
  });
});
