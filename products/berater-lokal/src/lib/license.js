import { getKundeCount } from './db.js';

const PROBE_LIMIT = 10;

/**
 * Check whether the customer limit for the trial version is reached.
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkKundenLimit() {
  const count = await getKundeCount();
  return { allowed: count < PROBE_LIMIT, count, limit: PROBE_LIMIT };
}

/**
 * @returns {boolean} true if a valid license key is present (always false in v0.2)
 */
export function hasLicenseKey() {
  return false;
}
