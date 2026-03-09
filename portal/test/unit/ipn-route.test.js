const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const path = require('path');
const { createMockPool } = require('../helpers/mock-pool');

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
  resolveProductId: async (pid) => {
    licenseCalls.push({ fn: 'resolveProductId', pid });
    return pid; // pass-through for tests
  },
  activateFromIPN: async (data) => {
    licenseCalls.push({ fn: 'activateFromIPN', data });
    return { existing: false, licenseKey: 'CFML-TEST-KEY1-KEY2-KE34' };
  },
  revokeByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'revokeByOrderId', orderId });
    return mockLicense._revokeResult || { rows: [{ license_key: 'LK-M' }], rowCount: 1 };
  },
  cancelByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'cancelByOrderId', orderId });
    return mockLicense._cancelResult || { rows: [{ license_key: 'LK-M' }], rowCount: 1 };
  },
  resumeByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'resumeByOrderId', orderId });
    return mockLicense._resumeResult || { rows: [{ license_key: 'LK-M' }], rowCount: 1 };
  },
  _revokeResult: null,
  _cancelResult: null,
  _resumeResult: null,
};
const licensePath = require.resolve('../../src/services/license');
require.cache[licensePath] = {
  id: licensePath, filename: licensePath, loaded: true,
  exports: mockLicense,
};

// verifySignature Mock — standardmaessig true, steuerbar via _returnValue
let verifyReturnValue = true;
const verifyPath = require.resolve('../../src/services/digistore-verify');
require.cache[verifyPath] = {
  id: verifyPath, filename: verifyPath, loaded: true,
  exports: {
    verifySignature: () => verifyReturnValue,
  },
};

// Jetzt Route laden (nutzt gemockte Module)
const express = require('express');
const router = require('../../src/routes/api-digistore-ipn');

const PASSPHRASE = 'test-secret';

function makePayload(overrides = {}) {
  return {
    event: 'on_payment',
    order_id: 'ORD-123',
    license_key: 'LK-ABC',
    product_id: 'PROD-1',
    email: 'test@example.com',
    buyer_first_name: 'Max',
    buyer_last_name: 'Mustermann',
    payment_id: 'PAY-1',
    sha_sign: 'VALID',
    ...overrides,
  };
}

describe('IPN Route Handler', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
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
    licenseCalls.length = 0;
    verifyReturnValue = true;
    mockLicense._revokeResult = null;
    mockLicense._cancelResult = null;
    mockLicense._resumeResult = null;
    process.env.DIGISTORE_IPN_PASSPHRASE = PASSPHRASE;
  });

  async function postIPN(body, contentType = 'application/json') {
    const opts = {
      method: 'POST',
      headers: {},
    };
    if (contentType === 'application/x-www-form-urlencoded') {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = new URLSearchParams(body).toString();
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(`${baseUrl}/api/digistore-ipn`, opts);
  }

  it('1: fehlende Passphrase → "OK", kein DB-Aufruf', async () => {
    delete process.env.DIGISTORE_IPN_PASSPHRASE;
    const res = await postIPN(makePayload());
    assert.equal(await res.text(), 'OK');
    assert.equal(mockPool._calls.length, 0);
    assert.equal(licenseCalls.length, 0);
  });

  it('2: ungueltige Signatur → "OK", logIPN mit invalid_signature', async () => {
    verifyReturnValue = false;
    const res = await postIPN(makePayload());
    assert.equal(await res.text(), 'OK');
    assert.equal(mockPool._calls.length, 1);
    assert.ok(mockPool._calls[0].sql.includes('digistore_ipn_log'));
    assert.equal(mockPool._calls[0].params[4], 'invalid_signature');
  });

  it('3: on_payment → resolveProductId + activateFromIPN aufgerufen', async () => {
    const res = await postIPN(makePayload());
    assert.equal(await res.text(), 'OK');
    // resolveProductId + activateFromIPN
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    assert.equal(activateCall.data.order_id, 'ORD-123');
    assert.equal(activateCall.data.product_id, 'PROD-1');
  });

  it('4: on_payment → Key wird vom Service generiert (nicht aus Payload)', async () => {
    const res = await postIPN(makePayload({ license_key: '' }));
    assert.equal(await res.text(), 'OK');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    // Key is no longer passed from payload — service generates it
    assert.equal(activateCall.data.order_id, 'ORD-123');
  });

  it('5: on_refund → revokeByOrderId aufgerufen', async () => {
    const res = await postIPN(makePayload({ event: 'on_refund' }));
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'revokeByOrderId');
    assert.equal(licenseCalls[0].orderId, 'ORD-123');
  });

  it('6: on_chargeback → revokeByOrderId aufgerufen', async () => {
    const res = await postIPN(makePayload({ event: 'on_chargeback' }));
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'revokeByOrderId');
  });

  it('7: on_rebill_cancelled → cancelByOrderId aufgerufen (kein sofortiger Ablauf)', async () => {
    const res = await postIPN(makePayload({ event: 'on_rebill_cancelled' }));
    assert.equal(await res.text(), 'OK');
    const cancelCall = licenseCalls.find(c => c.fn === 'cancelByOrderId');
    assert.ok(cancelCall, 'cancelByOrderId should be called');
    assert.equal(cancelCall.orderId, 'ORD-123');
  });

  it('7b: on_rebill_resumed → resumeByOrderId aufgerufen', async () => {
    const res = await postIPN(makePayload({ event: 'on_rebill_resumed' }));
    assert.equal(await res.text(), 'OK');
    const resumeCall = licenseCalls.find(c => c.fn === 'resumeByOrderId');
    assert.ok(resumeCall, 'resumeByOrderId should be called');
    assert.equal(resumeCall.orderId, 'ORD-123');
  });

  it('8: log-only Events → nur geloggt, kein License-Aufruf', async () => {
    for (const event of ['on_payment_missed', 'last_paid_day']) {
      mockPool.reset();
      licenseCalls.length = 0;
      const res = await postIPN(makePayload({ event }));
      assert.equal(await res.text(), 'OK');
      // Only resolveProductId is NOT called for log-only events
      const licenseModifyCalls = licenseCalls.filter(c =>
        !['resolveProductId'].includes(c.fn));
      assert.equal(licenseModifyCalls.length, 0, `${event}: kein License-Aufruf erwartet`);
      // logIPN wird aufgerufen mit 'logged'
      assert.ok(mockPool._calls.some(c => c.params[4] === 'logged'), `${event}: logged erwartet`);
    }
  });

  it('9: unbekannter Event-Typ → skipped', async () => {
    const res = await postIPN(makePayload({ event: 'on_some_new_event' }));
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 0);
    assert.ok(mockPool._calls.some(c => c.params[4] === 'skipped'));
  });

  it('10: Service wirft Error → "OK", logIPN mit failed', async () => {
    // activateFromIPN soll werfen
    const origActivate = mockLicense.activateFromIPN;
    mockLicense.activateFromIPN = async () => { throw new Error('DB connection lost'); };
    const res = await postIPN(makePayload());
    assert.equal(await res.text(), 'OK');
    assert.ok(mockPool._calls.some(c => c.params[4] === 'failed'));
    assert.ok(mockPool._calls.some(c => c.params[5] === 'DB connection lost'));
    mockLicense.activateFromIPN = origActivate;
  });

  it('11: Content-Type application/x-www-form-urlencoded korrekt geparst', async () => {
    const res = await postIPN(makePayload(), 'application/x-www-form-urlencoded');
    assert.equal(await res.text(), 'OK');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    assert.equal(activateCall.data.order_id, 'ORD-123');
  });
});

describe('License Delivery Endpoint — POST /api/digistore-license', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
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
    verifyReturnValue = true;
    process.env.DIGISTORE_IPN_PASSPHRASE = PASSPHRASE;
  });

  async function postDelivery(body) {
    return fetch(`${baseUrl}/api/digistore-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('12: ungueltige Signatur + keine Lizenz → erstellt trotzdem (Delivery vor IPN)', async () => {
    verifyReturnValue = false;
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const res = await postDelivery(makePayload());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.license_key, 'CFML-TEST-KEY1-KEY2-KE34');
  });

  it('13: ungueltige Signatur + bestehende Lizenz → gibt Key zurueck (Fallback)', async () => {
    verifyReturnValue = false;
    mockPool.mockResult({ rows: [{ license_key: 'CFRL-FALL-BACK-1234-AB12' }], rowCount: 1 });
    const res = await postDelivery(makePayload());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.license_key, 'CFRL-FALL-BACK-1234-AB12');
  });

  it('14: fehlende order_id → 400', async () => {
    const res = await postDelivery({ sha_sign: 'X' });
    assert.equal(res.status, 400);
  });

  it('15: gueltige Signatur + bestehende Lizenz → gibt Key zurueck', async () => {
    mockPool.mockResult({ rows: [{ license_key: 'CFML-EXIST-1234-5678-AB12' }], rowCount: 1 });
    const res = await postDelivery(makePayload());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.license_key, 'CFML-EXIST-1234-5678-AB12');
  });

  it('16: gueltige Signatur + keine Lizenz → erstellt neue und gibt Key zurueck', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const res = await postDelivery(makePayload());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.license_key, 'CFML-TEST-KEY1-KEY2-KE34');
    const activateCall = licenseCalls.find(c => c.fn === 'activateFromIPN');
    assert.ok(activateCall, 'activateFromIPN should be called');
    assert.equal(activateCall.data.order_id, 'ORD-123');
  });

  it('17: Service-Fehler → 500', async () => {
    mockPool.mockResult({ rows: [], rowCount: 0 });
    const origActivate = mockLicense.activateFromIPN;
    mockLicense.activateFromIPN = async () => { throw new Error('DB down'); };
    const res = await postDelivery(makePayload());
    assert.equal(res.status, 500);
    mockLicense.activateFromIPN = origActivate;
  });
});
