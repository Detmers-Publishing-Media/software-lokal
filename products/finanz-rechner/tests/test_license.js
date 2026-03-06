import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCalculatorFree,
  canAccess,
  hasLicense,
  activateLicense,
  _resetLicense,
} from '../src/lib/license.js';

describe('license', () => {
  beforeEach(() => {
    _resetLicense();
  });

  it('beitragsanpassung is free', () => {
    assert.equal(isCalculatorFree('beitragsanpassung'), true);
  });

  it('ratenzuschlag is free', () => {
    assert.equal(isCalculatorFree('ratenzuschlag'), true);
  });

  it('stornohaftung is not free', () => {
    assert.equal(isCalculatorFree('stornohaftung'), false);
  });

  it('canAccess returns true for free calculator without license', () => {
    assert.equal(canAccess('ratenzuschlag'), true);
  });

  it('canAccess returns false for paid calculator without license', () => {
    assert.equal(canAccess('courtagenbarwert'), false);
  });

  it('canAccess returns true for paid calculator after activation', () => {
    const result = activateLicense('ABCD-1234-EFGH-5678');
    assert.equal(result.valid, true);
    assert.equal(hasLicense(), true);
    assert.equal(canAccess('courtagenbarwert'), true);
    assert.equal(canAccess('stornohaftung'), true);
    assert.equal(canAccess('spartendeckung'), true);
  });

  it('activateLicense rejects invalid key', () => {
    const result = activateLicense('ungueltig');
    assert.equal(result.valid, false);
    assert.equal(hasLicense(), false);
  });
});
