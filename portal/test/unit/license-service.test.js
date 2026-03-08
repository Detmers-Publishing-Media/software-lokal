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

  it('4: activateFromIPN — neuer Key generiert und Insert', async () => {
    // First query: check existing → not found
    mockPool.mockResults([
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 1 },
    ]);
    const result = await license.activateFromIPN({
      order_id: 'ORD-1',
      product_id: 'mitglieder-lokal',
      buyer_email: 'test@example.com',
      buyer_name: 'Test User',
      payment_id: 'PAY-1',
    });
    assert.equal(result.existing, false);
    assert.ok(result.licenseKey.startsWith('CFML-'), 'Key should have CFML prefix');
    // Second call should be INSERT
    assert.ok(mockPool._calls[1].sql.includes('INSERT INTO licenses'));
    assert.ok(mockPool._calls[1].sql.includes('license_hash'));
  });

  it('5: activateFromIPN — bestehende Order → Update statt Insert', async () => {
    // First query: check existing → found
    mockPool.mockResults([
      { rows: [{ id: 1, license_key: 'CFML-ABCD-EFGH-JKMN-PQRS' }], rowCount: 1 },
      { rows: [], rowCount: 1 },
    ]);
    const result = await license.activateFromIPN({
      order_id: 'ORD-1',
      product_id: 'mitglieder-lokal',
      buyer_email: 'test@example.com',
      buyer_name: null,
      payment_id: 'PAY-2',
    });
    assert.equal(result.existing, true);
    assert.equal(result.licenseKey, 'CFML-ABCD-EFGH-JKMN-PQRS');
    // Second call should be UPDATE
    assert.ok(mockPool._calls[1].sql.includes('UPDATE licenses'));
    assert.ok(mockPool._calls[1].sql.includes('INTERVAL'));
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

  it('8: cancelByOrderId — setzt auto_renew auf false', async () => {
    mockPool.mockResult({ rows: [{ license_key: 'LK-Y' }], rowCount: 1 });
    const result = await license.cancelByOrderId('ORD-2');
    assert.equal(result.rowCount, 1);
    assert.ok(mockPool._calls[0].sql.includes('auto_renew'));
    // Should NOT set expires_at = NOW()
    assert.ok(!mockPool._calls[0].sql.includes('expires_at = NOW()'));
  });

  it('9: resumeByOrderId — verlaengert expires_at', async () => {
    mockPool.mockResult({ rows: [{ license_key: 'LK-Z' }], rowCount: 1 });
    const result = await license.resumeByOrderId('ORD-3');
    assert.equal(result.rowCount, 1);
    assert.ok(mockPool._calls[0].sql.includes('INTERVAL'));
    assert.ok(mockPool._calls[0].sql.includes('auto_renew'));
  });

  it('10: createLicense — generiert CFML-Key und gibt Row zurueck', async () => {
    const row = { license_key: 'CFML-GEN1-GEN2-GEN3-GE45', product_id: 'mitglieder-lokal', customer_email: 'e@e.com' };
    mockPool.mockResult({ rows: [row], rowCount: 1 });
    const result = await license.createLicense('mitglieder-lokal', 'e@e.com', 'Name');
    assert.deepEqual(result, row);
    assert.ok(mockPool._calls[0].sql.includes('RETURNING'));
    assert.ok(mockPool._calls[0].sql.includes('license_hash'));
  });

  it('11: validateForApp — unknown key → { valid: false, reason: unknown }', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const result = await license.validateForApp('CFML-XXXX-YYYY-ZZZZ-WWWW', 'mitglieder-lokal');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'unknown');
  });

  it('12: validateForApp — wrong product → { valid: false, reason: wrong_product }', async () => {
    mockPool.mockResult({
      rows: [{
        id: 1, product_id: 'mitglieder-lokal', status: 'active',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      }],
      rowCount: 1,
    });
    const result = await license.validateForApp('CFML-ABCD-EFGH-JKMN-PQRS', 'finanz-rechner');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'wrong_product');
  });

  it('13: validateForApp — active → updates validation_count', async () => {
    mockPool.mockResults([
      {
        rows: [{
          id: 42, product_id: 'mitglieder-lokal', status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        }],
        rowCount: 1,
      },
      { rows: [], rowCount: 1 },
    ]);
    const result = await license.validateForApp('CFML-ABCD-EFGH-JKMN-PQRS', 'mitglieder-lokal');
    assert.equal(result.valid, true);
    assert.equal(result.productId, 'mitglieder-lokal');
    assert.ok(result.features.includes('support'));
    // Validation tracking update
    assert.equal(mockPool._calls.length, 2);
    assert.ok(mockPool._calls[1].sql.includes('validation_count'));
  });

  it('14: recoverByOrderId — not found → null', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const result = await license.recoverByOrderId('NOPE');
    assert.equal(result, null);
  });

  it('15: recoverByOrderId — found → returns masked key', async () => {
    mockPool.mockResult({
      rows: [{
        license_key: 'CFML-ABCD-EFGH-JKMN-PQRS',
        product_id: 'mitglieder-lokal',
        status: 'active',
        expires_at: '2027-03-07T00:00:00Z',
      }],
      rowCount: 1,
    });
    const result = await license.recoverByOrderId('ORD-123');
    assert.equal(result.found, true);
    assert.ok(result.licenseKey.includes('****'), 'Key should be masked');
    assert.equal(result.licenseKeyFull, 'CFML-ABCD-EFGH-JKMN-PQRS');
    assert.equal(result.productId, 'mitglieder-lokal');
  });

  it('16: resolveProductId — direkter Match', async () => {
    mockPool.mockResult({ rows: [{ id: 'mitglieder-lokal' }], rowCount: 1 });
    const result = await license.resolveProductId('mitglieder-lokal');
    assert.equal(result, 'mitglieder-lokal');
  });

  it('17: resolveProductId — Digistore-Mapping', async () => {
    mockPool.mockResults([
      { rows: [], rowCount: 0 },
      { rows: [{ id: 'mitglieder-lokal' }], rowCount: 1 },
    ]);
    const result = await license.resolveProductId('DS-12345');
    assert.equal(result, 'mitglieder-lokal');
  });

  it('18: resolveProductId — nicht gefunden → null', async () => {
    mockPool.mockResults([
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
    ]);
    const result = await license.resolveProductId('UNKNOWN');
    assert.equal(result, null);
  });

  it('19: createTrialLicense — generiert CFTM-Key mit 30 Tagen', async () => {
    const row = {
      license_key: 'CFTM-TEST-ABCD-EFGH-JK12',
      product_id: 'mitglieder-lokal',
      source: 'manual',
      note: 'Pilotkunde Mueller',
    };
    mockPool.mockResult({ rows: [row], rowCount: 1 });
    const result = await license.createTrialLicense('mitglieder-lokal', 'Pilotkunde Mueller');
    assert.deepEqual(result, row);
    // Check INSERT contains correct values
    const sql = mockPool._calls[0].sql;
    assert.ok(sql.includes('INSERT INTO licenses'));
    assert.ok(sql.includes("'manual'"));
    assert.ok(sql.includes('30 days'));
    assert.ok(sql.includes('auto_renew'));
    assert.ok(sql.includes('note'));
    assert.ok(sql.includes('license_hash'));
  });

  it('20: createTrialLicense — Key beginnt mit CFTM', async () => {
    mockPool.mockResult({ rows: [{}], rowCount: 1 });
    await license.createTrialLicense('mitglieder-lokal');
    const params = mockPool._calls[0].params;
    assert.ok(params[0].startsWith('CFTM-'), `Trial key should start with CFTM: ${params[0]}`);
  });

  it('21: createTrialLicense — note ist optional (null)', async () => {
    mockPool.mockResult({ rows: [{}], rowCount: 1 });
    await license.createTrialLicense('mitglieder-lokal');
    const params = mockPool._calls[0].params;
    assert.equal(params[3], null);
  });

  it('22: createTrialLicense — finanz-rechner bekommt CFTR', async () => {
    mockPool.mockResult({ rows: [{}], rowCount: 1 });
    await license.createTrialLicense('finanz-rechner', 'Test');
    const params = mockPool._calls[0].params;
    assert.ok(params[0].startsWith('CFTR-'), `Trial key should start with CFTR: ${params[0]}`);
  });
});
