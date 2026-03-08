import { getActiveMemberCount } from './db.js';

const PROBE_LIMIT = 30;

/**
 * Check whether the member limit for the trial version is reached.
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkMemberLimit() {
  const count = await getActiveMemberCount();
  return { allowed: count < PROBE_LIMIT, count, limit: PROBE_LIMIT };
}

/**
 * @returns {boolean} true if a valid license key is present (always false in v0.2)
 */
export function hasLicenseKey() {
  return false;
}
