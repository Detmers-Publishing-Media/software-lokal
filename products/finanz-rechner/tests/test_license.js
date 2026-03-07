import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCalculatorFree,
  canAccess,
  hasLicense,
  canExportPdf,
} from '../src/lib/license.js';

describe('license (open source — all features free)', () => {
  it('all calculators are free', () => {
    assert.equal(isCalculatorFree('beitragsanpassung'), true);
    assert.equal(isCalculatorFree('ratenzuschlag'), true);
    assert.equal(isCalculatorFree('stornohaftung'), true);
    assert.equal(isCalculatorFree('courtagenbarwert'), true);
    assert.equal(isCalculatorFree('spartendeckung'), true);
  });

  it('canAccess returns true for all calculators', () => {
    assert.equal(canAccess('beitragsanpassung'), true);
    assert.equal(canAccess('stornohaftung'), true);
    assert.equal(canAccess('courtagenbarwert'), true);
  });

  it('hasLicense always returns true', () => {
    assert.equal(hasLicense(), true);
  });

  it('PDF export is always available', () => {
    assert.equal(canExportPdf(), true);
  });
});
