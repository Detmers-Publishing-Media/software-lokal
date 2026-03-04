const crypto = require('crypto');

const TEST_PASSPHRASE = 'test-ipn-secret-v052';

// Signatur berechnen — identisch mit digistore-verify.js Logik
function computeSignature(params, passphrase) {
  const keys = Object.keys(params)
    .filter(k => k !== 'sha_sign')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  let shaString = '';
  for (const key of keys) {
    const value = params[key];
    if (value === '' || value === undefined || value === null) continue;
    shaString += key + '=' + value + passphrase;
  }
  return crypto.createHash('sha512').update(shaString).digest('hex').toUpperCase();
}

// Payload mit gueltig berechneter Signatur erstellen
function makeSignedPayload(event, overrides = {}, passphrase = TEST_PASSPHRASE) {
  const base = {
    event,
    order_id: 'ORD-TEST-001',
    product_id: 'factory-gateway',
    email: 'buyer@example.com',
    buyer_first_name: 'Max',
    buyer_last_name: 'Mustermann',
    license_key: 'LK-TEST-001',
    payment_id: 'PAY-TEST-001',
    transaction_amount: '0.00',
    transaction_currency: 'EUR',
    ...overrides,
  };
  base.sha_sign = computeSignature(base, passphrase);
  return base;
}

// Vordefinierte Payloads
const PAYMENT_GATEWAY = makeSignedPayload('on_payment', {
  order_id: 'ORD-GW-001',
  product_id: 'factory-gateway',
  license_key: 'LK-GW-001',
  payment_id: 'PAY-GW-001',
  transaction_amount: '0.00',
});

const PAYMENT_ADDON = makeSignedPayload('on_payment', {
  order_id: 'ORD-ADDON-001',
  product_id: 'test-addon',
  email: 'addon-buyer@example.com',
  buyer_first_name: 'Lisa',
  buyer_last_name: 'Schmidt',
  license_key: 'LK-ADDON-001',
  payment_id: 'PAY-ADDON-001',
  transaction_amount: '49.00',
});

const REFUND = makeSignedPayload('on_refund', {
  order_id: 'ORD-GW-001',
  product_id: 'factory-gateway',
  license_key: 'LK-GW-001',
  payment_id: 'PAY-GW-001',
});

const CHARGEBACK = makeSignedPayload('on_chargeback', {
  order_id: 'ORD-ADDON-001',
  product_id: 'test-addon',
  license_key: 'LK-ADDON-001',
  payment_id: 'PAY-ADDON-001',
});

const CANCEL = makeSignedPayload('on_rebill_cancelled', {
  order_id: 'ORD-GW-001',
  product_id: 'factory-gateway',
  license_key: 'LK-GW-001',
  payment_id: 'PAY-GW-001',
});

module.exports = {
  TEST_PASSPHRASE,
  computeSignature,
  makeSignedPayload,
  PAYMENT_GATEWAY,
  PAYMENT_ADDON,
  REFUND,
  CHARGEBACK,
  CANCEL,
};
