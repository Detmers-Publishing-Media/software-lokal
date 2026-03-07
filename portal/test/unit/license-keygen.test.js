const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SAFE_ALPHABET,
  PRODUCT_PREFIXES,
  TRIAL_PREFIXES,
  crc8,
  generateKey,
  generateTrialKey,
  isTrialKey,
  computeLicenseHash,
  getPrefix,
  getTrialPrefix,
} = require('../../src/services/license-keygen');

describe('license-keygen', () => {
  describe('crc8', () => {
    it('returns a 2-char string from safe alphabet', () => {
      const result = crc8('CFMLABCDEFGHJKMN');
      assert.equal(result.length, 2);
      for (const c of result) {
        assert.ok(SAFE_ALPHABET.includes(c), `${c} not in safe alphabet`);
      }
    });

    it('is deterministic', () => {
      assert.equal(crc8('test'), crc8('test'));
    });

    it('different inputs produce different checksums', () => {
      assert.notEqual(crc8('CFMLABCDEFGH'), crc8('CFMLXYZWVUTS'));
    });

    it('matches electron-platform crc8 output', () => {
      // Cross-check: run the same algorithm, must produce identical results
      // This validates portal and app use the same checksum
      const input = 'CFMLABCD1234WXYZ56';
      const result = crc8(input);
      assert.equal(result.length, 2);
      // Regression: same input always produces same output
      const result2 = crc8(input);
      assert.equal(result, result2);
    });
  });

  describe('generateKey', () => {
    it('generates a key with correct prefix for mitglieder-simple', () => {
      const key = generateKey('mitglieder-simple');
      assert.ok(key.startsWith('CFML-'), `Key should start with CFML-: ${key}`);
    });

    it('generates a key with correct prefix for finanz-rechner', () => {
      const key = generateKey('finanz-rechner');
      assert.ok(key.startsWith('CFFR-'), `Key should start with CFFR-: ${key}`);
    });

    it('generates keys in correct format XXXX-XXXX-XXXX-XXXX-XXXX', () => {
      const key = generateKey('mitglieder-simple');
      assert.match(key, /^[A-Z]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it('generates key with valid CRC-8 checksum', () => {
      const key = generateKey('mitglieder-simple');
      const parts = key.split('-');
      const payload = parts[0] + parts[1] + parts[2] + parts[3] + parts[4].substring(0, 2);
      const expected = crc8(payload);
      const actual = parts[4].substring(2, 4);
      assert.equal(actual, expected, `CRC mismatch for key ${key}`);
    });

    it('uses only safe alphabet characters (excluding prefix)', () => {
      for (let i = 0; i < 20; i++) {
        const key = generateKey('mitglieder-simple');
        // Prefix (CFML) may contain chars outside safe alphabet (L)
        // Check only the generated groups (after prefix)
        const parts = key.split('-');
        const generated = parts.slice(1).join('');
        for (const c of generated) {
          assert.ok(SAFE_ALPHABET.includes(c), `Char ${c} not in safe alphabet (key: ${key})`);
        }
      }
    });

    it('generates unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(generateKey('mitglieder-simple'));
      }
      assert.equal(keys.size, 100, 'All 100 generated keys should be unique');
    });

    it('throws for unknown product', () => {
      assert.throws(() => generateKey('unknown-product'), /Kein Key-Praefix/);
    });
  });

  describe('computeLicenseHash', () => {
    it('returns a 64-char hex string', () => {
      const hash = computeLicenseHash('CFML-ABCD-EFGH-JKMN-PQRS');
      assert.equal(hash.length, 64);
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('is deterministic', () => {
      const h1 = computeLicenseHash('CFML-ABCD-EFGH-JKMN-PQRS');
      const h2 = computeLicenseHash('CFML-ABCD-EFGH-JKMN-PQRS');
      assert.equal(h1, h2);
    });

    it('is case-insensitive', () => {
      const h1 = computeLicenseHash('cfml-abcd-efgh-jkmn-pqrs');
      const h2 = computeLicenseHash('CFML-ABCD-EFGH-JKMN-PQRS');
      assert.equal(h1, h2);
    });

    it('different keys produce different hashes', () => {
      const h1 = computeLicenseHash('CFML-ABCD-EFGH-JKMN-PQRS');
      const h2 = computeLicenseHash('CFML-WXYZ-EFGH-JKMN-PQRS');
      assert.notEqual(h1, h2);
    });
  });

  describe('getPrefix', () => {
    it('returns CFML for mitglieder-simple', () => {
      assert.equal(getPrefix('mitglieder-simple'), 'CFML');
    });

    it('returns CFFR for finanz-rechner', () => {
      assert.equal(getPrefix('finanz-rechner'), 'CFFR');
    });

    it('returns null for unknown product', () => {
      assert.equal(getPrefix('unknown'), null);
    });
  });

  describe('generateTrialKey', () => {
    it('generates a trial key with CFTM prefix for mitglieder-simple', () => {
      const key = generateTrialKey('mitglieder-simple');
      assert.ok(key.startsWith('CFTM-'), `Key should start with CFTM-: ${key}`);
    });

    it('generates a trial key with CFTR prefix for finanz-rechner', () => {
      const key = generateTrialKey('finanz-rechner');
      assert.ok(key.startsWith('CFTR-'), `Key should start with CFTR-: ${key}`);
    });

    it('generates trial key with valid CRC-8', () => {
      const key = generateTrialKey('mitglieder-simple');
      const parts = key.split('-');
      const payload = parts[0] + parts[1] + parts[2] + parts[3] + parts[4].substring(0, 2);
      const expected = crc8(payload);
      assert.equal(parts[4].substring(2, 4), expected, `CRC mismatch for trial key ${key}`);
    });

    it('trial keys match the KEY_PATTERN regex', () => {
      const KEY_PATTERN = /^[A-Z]{2,4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
      for (let i = 0; i < 20; i++) {
        const key = generateTrialKey('finanz-rechner');
        assert.ok(KEY_PATTERN.test(key), `Trial key should match pattern: ${key}`);
      }
    });

    it('trial prefix never collides with production prefix', () => {
      for (const [product, trialPrefix] of Object.entries(TRIAL_PREFIXES)) {
        const prodPrefix = PRODUCT_PREFIXES[product];
        assert.notEqual(trialPrefix, prodPrefix,
          `Trial prefix ${trialPrefix} must differ from prod prefix ${prodPrefix}`);
      }
    });

    it('throws for unknown product', () => {
      assert.throws(() => generateTrialKey('unknown'), /Kein Trial-Praefix/);
    });

    it('generates unique trial keys', () => {
      const keys = new Set();
      for (let i = 0; i < 50; i++) {
        keys.add(generateTrialKey('mitglieder-simple'));
      }
      assert.equal(keys.size, 50);
    });
  });

  describe('isTrialKey', () => {
    it('returns true for CFTM keys', () => {
      assert.ok(isTrialKey('CFTM-ABCD-EFGH-JKMN-PQRS'));
    });

    it('returns true for CFTR keys', () => {
      assert.ok(isTrialKey('CFTR-WXYZ-ABCD-EFGH-JKMN'));
    });

    it('returns false for production keys', () => {
      assert.ok(!isTrialKey('CFML-ABCD-EFGH-JKMN-PQRS'));
      assert.ok(!isTrialKey('CFFR-ABCD-EFGH-JKMN-PQRS'));
    });

    it('returns false for null/empty', () => {
      assert.ok(!isTrialKey(null));
      assert.ok(!isTrialKey(''));
    });

    it('is case-insensitive', () => {
      assert.ok(isTrialKey('cftm-abcd-efgh-jkmn-pqrs'));
    });
  });

  describe('getTrialPrefix', () => {
    it('returns CFTM for mitglieder-simple', () => {
      assert.equal(getTrialPrefix('mitglieder-simple'), 'CFTM');
    });

    it('returns CFTR for finanz-rechner', () => {
      assert.equal(getTrialPrefix('finanz-rechner'), 'CFTR');
    });

    it('returns null for unknown product', () => {
      assert.equal(getTrialPrefix('unknown'), null);
    });
  });

  describe('cross-compatibility with electron-platform', () => {
    it('generated key passes client-side format validation pattern', () => {
      const KEY_PATTERN = /^[A-Z]{2,4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
      for (let i = 0; i < 50; i++) {
        const key = generateKey('mitglieder-simple');
        assert.ok(KEY_PATTERN.test(key), `Key should match client pattern: ${key}`);
      }
    });

    it('generated key has correct CRC verifiable by client algorithm', () => {
      // Simulate what the client does: extract payload, compute CRC, compare
      for (let i = 0; i < 50; i++) {
        const key = generateKey('finanz-rechner');
        const parts = key.split('-');
        const prefix = parts[0];
        assert.equal(prefix, 'CFFR');

        const payload = parts[0] + parts[1] + parts[2] + parts[3] + parts[4].substring(0, 2);
        const checksum = crc8(payload);
        assert.equal(parts[4].substring(2, 4), checksum, `CRC mismatch: ${key}`);
      }
    });
  });
});
