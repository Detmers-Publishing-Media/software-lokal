const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifySignature } = require('../../src/services/digistore-verify');

// Hilfsfunktion: gueltige Signatur fuer gegebene Params + Passphrase berechnen
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

describe('verifySignature', () => {
  const passphrase = 'test-secret-passphrase';

  it('1: gueltige Signatur → true', () => {
    const params = { event: 'on_payment', order_id: 'ABC123' };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, passphrase), true);
  });

  it('2: falsche Signatur → false', () => {
    const params = { event: 'on_payment', order_id: 'ABC123', sha_sign: 'DEADBEEF' };
    assert.equal(verifySignature(params, passphrase), false);
  });

  it('3: fehlende sha_sign → false', () => {
    const params = { event: 'on_payment', order_id: 'ABC123' };
    assert.equal(verifySignature(params, passphrase), false);
  });

  it('4: leere Werte werden uebersprungen → true', () => {
    const params = { event: 'on_payment', order_id: 'ABC123', empty_field: '' };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, passphrase), true);
  });

  it('5: null/undefined Werte uebersprungen → true', () => {
    const params = { event: 'on_payment', order_id: 'ABC123', null_field: null, undef_field: undefined };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, passphrase), true);
  });

  it('6: case-insensitive Key-Sortierung → true', () => {
    const params = { Alpha: 'a', beta: 'b', Charlie: 'c' };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, passphrase), true);
  });

  it('7: realistischer Digistore24-Payload → true', () => {
    const params = {
      event: 'on_payment',
      order_id: 'D12345678',
      product_id: 'PROD001',
      email: 'buyer@example.com',
      buyer_first_name: 'Max',
      buyer_last_name: 'Mustermann',
      license_key: 'LK-ABCDEF-123456',
      payment_id: 'PAY-999',
      transaction_amount: '49.00',
      transaction_currency: 'EUR',
    };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, passphrase), true);
  });

  it('8: falsche Passphrase → false', () => {
    const params = { event: 'on_payment', order_id: 'ABC123' };
    params.sha_sign = computeSignature(params, passphrase);
    assert.equal(verifySignature(params, 'wrong-passphrase'), false);
  });
});
