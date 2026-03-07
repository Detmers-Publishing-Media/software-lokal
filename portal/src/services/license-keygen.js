const crypto = require('crypto');

// Must match electron-platform/lib/license-client.js exactly
const SAFE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const HMAC_PEPPER = 'codefabrik-support-v1';

// Product prefix mapping (Code-Fabrik convention: CF + 2-char product code)
const PRODUCT_PREFIXES = {
  'mitglieder-simple': 'CFML',
  'finanz-rechner': 'CFFR',
};

// Trial key prefixes — must never collide with production prefixes
const TRIAL_PREFIXES = {
  'mitglieder-simple': 'CFTM',
  'finanz-rechner': 'CFTR',
};

/**
 * CRC-8 checksum (polynomial 0x07).
 * Returns 2 chars from SAFE_ALPHABET.
 * Must produce identical output to electron-platform/lib/license-client.js:crc8().
 */
function crc8(str) {
  let crc = 0;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x80) {
        crc = ((crc << 1) ^ 0x07) & 0xFF;
      } else {
        crc = (crc << 1) & 0xFF;
      }
    }
  }
  const c1 = SAFE_ALPHABET[crc % SAFE_ALPHABET.length];
  const c2 = SAFE_ALPHABET[Math.floor(crc / SAFE_ALPHABET.length) % SAFE_ALPHABET.length];
  return c1 + c2;
}

/**
 * Generates a license key in CFML-XXXX-XXXX-XXXX-XXXX format.
 * Last 2 chars of final group = CRC-8 checksum.
 *
 * @param {string} productId - Internal product ID (e.g. 'mitglieder-simple')
 * @returns {string} License key
 */
function generateKey(productId) {
  const prefix = PRODUCT_PREFIXES[productId];
  if (!prefix) {
    throw new Error(`Kein Key-Praefix fuer Produkt: ${productId}`);
  }

  const randomChar = () => SAFE_ALPHABET[crypto.randomInt(SAFE_ALPHABET.length)];
  const g1 = Array.from({ length: 4 }, randomChar).join('');
  const g2 = Array.from({ length: 4 }, randomChar).join('');
  const g3 = Array.from({ length: 4 }, randomChar).join('');
  const g4first2 = Array.from({ length: 2 }, randomChar).join('');

  const payload = prefix + g1 + g2 + g3 + g4first2;
  const checksum = crc8(payload);

  return `${prefix}-${g1}-${g2}-${g3}-${g4first2}${checksum}`;
}

/**
 * HMAC-SHA256 hash of a license key.
 * Used for ticket correlation without exposing the key.
 * Must produce identical output to electron-platform/lib/license-client.js:computeLicenseHash().
 */
function computeLicenseHash(licenseKey) {
  return crypto.createHmac('sha256', HMAC_PEPPER)
    .update(licenseKey.toUpperCase().trim())
    .digest('hex');
}

/**
 * Generates a trial license key in CFTM-XXXX-XXXX-XXXX-XXXX format.
 * Same algorithm as generateKey but with trial prefix.
 *
 * @param {string} productId - Internal product ID
 * @returns {string} Trial license key
 */
function generateTrialKey(productId) {
  const prefix = TRIAL_PREFIXES[productId];
  if (!prefix) {
    throw new Error(`Kein Trial-Praefix fuer Produkt: ${productId}`);
  }

  const randomChar = () => SAFE_ALPHABET[crypto.randomInt(SAFE_ALPHABET.length)];
  const g1 = Array.from({ length: 4 }, randomChar).join('');
  const g2 = Array.from({ length: 4 }, randomChar).join('');
  const g3 = Array.from({ length: 4 }, randomChar).join('');
  const g4first2 = Array.from({ length: 2 }, randomChar).join('');

  const payload = prefix + g1 + g2 + g3 + g4first2;
  const checksum = crc8(payload);

  return `${prefix}-${g1}-${g2}-${g3}-${g4first2}${checksum}`;
}

/**
 * Checks if a key is a trial key (prefix starts with CFT).
 */
function isTrialKey(key) {
  if (!key || typeof key !== 'string') return false;
  return key.toUpperCase().startsWith('CFT');
}

/**
 * Returns the product prefix for a given product ID, or null.
 */
function getPrefix(productId) {
  return PRODUCT_PREFIXES[productId] || null;
}

function getTrialPrefix(productId) {
  return TRIAL_PREFIXES[productId] || null;
}

module.exports = {
  SAFE_ALPHABET,
  PRODUCT_PREFIXES,
  TRIAL_PREFIXES,
  HMAC_PEPPER,
  crc8,
  generateKey,
  generateTrialKey,
  isTrialKey,
  computeLicenseHash,
  getPrefix,
  getTrialPrefix,
};
