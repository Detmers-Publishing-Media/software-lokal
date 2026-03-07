const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');
const { TEST_PASSPHRASE, makeSignedPayload, PAYMENT_GATEWAY, PAYMENT_ADDON, REFUND, CHARGEBACK, CANCEL } = require('../fixtures/ipn-payloads');

// ---- Mocks in Module-Cache injizieren ----

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

// License-Service Mock mit aufrufbarem Tracking
const licenseCalls = [];
const mockLicense = {
  resolveProductId: async (pid) => {
    licenseCalls.push({ fn: 'resolveProductId', pid });
    return pid;
  },
  activateFromIPN: async (data) => {
    licenseCalls.push({ fn: 'activateFromIPN', data });
    return { existing: false, licenseKey: 'CFML-TEST-KEY1-KEY2-KE34' };
  },
  revokeByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'revokeByOrderId', orderId });
    return { rows: [{ license_key: 'LK-REVOKED' }], rowCount: 1 };
  },
  cancelByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'cancelByOrderId', orderId });
    return { rows: [{ license_key: 'LK-CANCELLED' }], rowCount: 1 };
  },
  resumeByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'resumeByOrderId', orderId });
    return { rows: [{ license_key: 'LK-RESUMED' }], rowCount: 1 };
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

// verifySignature — echte Pruefung mit Test-Passphrase
const { verifySignature } = require('../../src/services/digistore-verify');
const verifyPath = require.resolve('../../src/services/digistore-verify');
require.cache[verifyPath] = {
  id: verifyPath, filename: verifyPath, loaded: true,
  exports: { verifySignature },
};

const express = require('express');
const ipnRouter = require('../../src/routes/api-digistore-ipn');

describe('Order Lifecycle (IPN-basiert)', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.DIGISTORE_IPN_PASSPHRASE = TEST_PASSPHRASE;
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(ipnRouter);
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.DIGISTORE_IPN_PASSPHRASE;
  });

  beforeEach(() => {
    mockPool.reset();
    licenseCalls.length = 0;
    mockLicense._validateResult = null;
  });

  async function postIPN(payload) {
    return fetch(`${baseUrl}/api/digistore-ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  it('1: on_payment → Lizenz fuer factory-gateway erstellt', async () => {
    const res = await postIPN(PAYMENT_GATEWAY);
    assert.equal(await res.text(), 'OK');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    assert.equal(activateCall.data.product_id, 'factory-gateway');
    assert.equal(activateCall.data.order_id, 'ORD-GW-001');
  });

  it('2: on_payment zweites Produkt → eigene Lizenz', async () => {
    const res = await postIPN(PAYMENT_ADDON);
    assert.equal(await res.text(), 'OK');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    assert.equal(activateCall.data.product_id, 'test-addon');
    assert.equal(activateCall.data.buyer_email, 'addon-buyer@example.com');
  });

  it('3: on_payment Idempotenz → doppelter IPN, keine Fehler', async () => {
    const res1 = await postIPN(PAYMENT_GATEWAY);
    assert.equal(await res1.text(), 'OK');
    const res2 = await postIPN(PAYMENT_GATEWAY);
    assert.equal(await res2.text(), 'OK');
    // Beide Aufrufe sollten activateFromIPN ausloesen (ON CONFLICT im Service)
    const activations = licenseCalls.filter(c => c.fn === 'activateFromIPN');
    assert.equal(activations.length, 2);
  });

  it('4: on_refund → Lizenz revoked', async () => {
    const res = await postIPN(REFUND);
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'revokeByOrderId');
    assert.equal(licenseCalls[0].orderId, 'ORD-GW-001');
  });

  it('5: on_chargeback → Lizenz revoked', async () => {
    const res = await postIPN(CHARGEBACK);
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'revokeByOrderId');
    assert.equal(licenseCalls[0].orderId, 'ORD-ADDON-001');
  });

  it('6: on_rebill_cancelled → cancelByOrderId (kein sofortiger Ablauf)', async () => {
    const res = await postIPN(CANCEL);
    assert.equal(await res.text(), 'OK');
    const cancelCall = licenseCalls.find(c => c.fn === 'cancelByOrderId');
    assert.ok(cancelCall, 'cancelByOrderId should be called');
    assert.equal(cancelCall.orderId, 'ORD-GW-001');
  });

  it('7: Lifecycle: Bezahlung → Erstattung → Lizenz revoked', async () => {
    // Schritt 1: Bezahlung
    await postIPN(PAYMENT_GATEWAY);
    assert.ok(licenseCalls.some(c => c.fn === 'activateFromIPN'));

    // Schritt 2: Erstattung
    await postIPN(REFUND);
    const revokeCall = licenseCalls.find(c => c.fn === 'revokeByOrderId');
    assert.ok(revokeCall);
    assert.equal(revokeCall.orderId, 'ORD-GW-001');

    // IPN-Log: 2x logIPN (payment success + refund success)
    const logCalls = mockPool._calls.filter(c => c.sql.includes('digistore_ipn_log'));
    assert.equal(logCalls.length, 2);
  });

  it('8: Lifecycle: Bezahlung → Kuendigung → auto_renew false', async () => {
    // Schritt 1: Bezahlung
    await postIPN(PAYMENT_ADDON);
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall);

    // Schritt 2: Kuendigung (gleiche Order) — kein sofortiger Ablauf
    const cancelAddon = makeSignedPayload('on_rebill_cancelled', {
      order_id: 'ORD-ADDON-001',
      product_id: 'test-addon',
      license_key: 'LK-ADDON-001',
      payment_id: 'PAY-ADDON-001',
    });
    await postIPN(cancelAddon);
    const cancelCall = licenseCalls.find(c => c.fn === 'cancelByOrderId');
    assert.ok(cancelCall);
    assert.equal(cancelCall.orderId, 'ORD-ADDON-001');
  });

  it('9: Mehrere Produkte, unterschiedliche Bestellungen parallel', async () => {
    const [res1, res2] = await Promise.all([
      postIPN(PAYMENT_GATEWAY),
      postIPN(PAYMENT_ADDON),
    ]);
    assert.equal(await res1.text(), 'OK');
    assert.equal(await res2.text(), 'OK');
    const activations = licenseCalls.filter(c => c.fn === 'activateFromIPN');
    assert.equal(activations.length, 2);
    const productIds = activations.map(a => a.data.product_id).sort();
    assert.deepEqual(productIds, ['factory-gateway', 'test-addon']);
  });

  it('10: Payment → Key wird vom Service generiert (nicht aus Payload)', async () => {
    const payload = makeSignedPayload('on_payment', {
      order_id: 'ORD-NOLICENSE-001',
      product_id: 'factory-gateway',
      license_key: '',
      payment_id: 'PAY-NOLICENSE-001',
    });
    const res = await postIPN(payload);
    assert.equal(await res.text(), 'OK');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    // Key is generated by service, not passed from payload
    assert.equal(activateCall.data.order_id, 'ORD-NOLICENSE-001');
  });
});
