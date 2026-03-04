import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeHmac } from '../src/lib/crypto.js';

describe('computeHmac', () => {
  it('erzeugt deterministisches Ergebnis', async () => {
    const hash = await computeHmac('test-input');
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64); // SHA-256 = 32 bytes = 64 hex chars
  });

  it('gleiche Eingabe = gleicher Hash', async () => {
    const hash1 = await computeHmac('identical-message');
    const hash2 = await computeHmac('identical-message');
    assert.equal(hash1, hash2);
  });

  it('andere Eingabe = anderer Hash', async () => {
    const hash1 = await computeHmac('message-a');
    const hash2 = await computeHmac('message-b');
    assert.notEqual(hash1, hash2);
  });
});
