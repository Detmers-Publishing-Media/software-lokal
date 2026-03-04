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
  activateFromIPN: async (data) => { licenseCalls.push({ fn: 'activateFromIPN', data }); },
  revokeByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'revokeByOrderId', orderId });
    return mockLicense._revokeResult || { rows: [{ license_key: 'LK-M' }], rowCount: 1 };
  },
  expireByOrderId: async (orderId) => {
    licenseCalls.push({ fn: 'expireByOrderId', orderId });
    return mockLicense._expireResult || { rows: [{ license_key: 'LK-M' }], rowCount: 1 };
  },
  _revokeResult: null,
  _expireResult: null,
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
    mockLicense._expireResult = null;
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

  it('3: on_payment → activateFromIPN aufgerufen', async () => {
    const res = await postIPN(makePayload());
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'activateFromIPN');
    assert.equal(licenseCalls[0].data.order_id, 'ORD-123');
    assert.equal(licenseCalls[0].data.license_key, 'LK-ABC');
  });

  it('4: on_payment ohne license_key → UUID generiert', async () => {
    const res = await postIPN(makePayload({ license_key: '' }));
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    // license_key sollte eine UUID sein (da leerer Key im Payload)
    const key = licenseCalls[0].data.license_key;
    assert.ok(key, 'license_key sollte nicht leer sein');
    assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
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

  it('7: on_rebill_cancelled → expireByOrderId aufgerufen', async () => {
    const res = await postIPN(makePayload({ event: 'on_rebill_cancelled' }));
    assert.equal(await res.text(), 'OK');
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'expireByOrderId');
    assert.equal(licenseCalls[0].orderId, 'ORD-123');
  });

  it('8: log-only Events → nur geloggt, kein License-Aufruf', async () => {
    for (const event of ['on_payment_missed', 'on_rebill_resumed', 'last_paid_day']) {
      mockPool.reset();
      licenseCalls.length = 0;
      const res = await postIPN(makePayload({ event }));
      assert.equal(await res.text(), 'OK');
      assert.equal(licenseCalls.length, 0, `${event}: kein License-Aufruf erwartet`);
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
    assert.equal(licenseCalls.length, 1);
    assert.equal(licenseCalls[0].fn, 'activateFromIPN');
    assert.equal(licenseCalls[0].data.order_id, 'ORD-123');
  });
});
