// Open Source (GPL-3.0): all features are free.
// Revenue comes from support packages via Digistore24, not feature-gating.

/** @returns {boolean} */
export function hasLicense() {
  return true;
}

/** @returns {boolean} */
export function isCalculatorFree(_calcId) {
  return true;
}

/** @returns {boolean} */
export function canAccess(_calcId) {
  return true;
}

/** @returns {boolean} */
export function canExportPdf() {
  return true;
}

export function activateLicense(_key) {
  return { valid: true };
}

export function loadStoredLicense() {
  // No-op: all features are free
}

/** Reset license state (for testing) */
export function _resetLicense() {
  // No-op
}
