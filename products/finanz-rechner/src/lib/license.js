import { validateLicenseFormat, normalizeLicenseKey } from '@codefabrik/shared/license';

const FREE_CALCULATORS = ['beitragsanpassung', 'ratenzuschlag'];
let _licenseKey = null;

/** @returns {boolean} */
export function hasLicense() {
  return _licenseKey !== null;
}

/** @returns {boolean} */
export function isCalculatorFree(calcId) {
  return FREE_CALCULATORS.includes(calcId);
}

/** @returns {boolean} */
export function canAccess(calcId) {
  return isCalculatorFree(calcId) || hasLicense();
}

/** @returns {boolean} */
export function canExportPdf() {
  return hasLicense();
}

/**
 * @param {string} key
 * @returns {{ valid: boolean, error?: string }}
 */
export function activateLicense(key) {
  const normalized = normalizeLicenseKey(key);
  if (!validateLicenseFormat(normalized)) {
    return { valid: false, error: 'Ungueltiges Format (XXXX-XXXX-XXXX-XXXX)' };
  }
  _licenseKey = normalized;
  try {
    localStorage.setItem('finanz-rechner-license', normalized);
  } catch (_) {
    // localStorage not available in tests
  }
  return { valid: true };
}

export function loadStoredLicense() {
  try {
    const stored = localStorage.getItem('finanz-rechner-license');
    if (stored && validateLicenseFormat(stored)) {
      _licenseKey = stored;
    }
  } catch (_) {
    // localStorage not available in tests
  }
}

/** Reset license state (for testing) */
export function _resetLicense() {
  _licenseKey = null;
}
