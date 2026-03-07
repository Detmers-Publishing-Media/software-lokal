const https = require('node:https');
const http = require('node:http');
const path = require('node:path');
const {
  validateKeyFormat,
  computeLicenseHash,
  readLicenseCache,
  writeLicenseCache,
  removeLicenseCache,
  getLicenseStatus,
  needsRevalidation,
} = require('../lib/license-client.js');
const { logInfo, logWarn } = require('../lib/logger.js');

/**
 * Registers license-related IPC handlers.
 *
 * @param {Object} deps
 * @param {Electron.IpcMain} deps.ipcMain
 * @param {Electron.App} deps.app
 * @param {Object} deps.config - Product config (needs: identifier, licensePrefix, portalUrl)
 */
function registerLicenseHandlers({ ipcMain, app, config }) {
  const userDataPath = app.getPath('userData');
  const prefix = config.licensePrefix || 'CF';
  const portalUrl = config.portalUrl || null;

  let safeStorage = null;
  try {
    safeStorage = require('electron').safeStorage;
  } catch (_) {}

  // Enter a new license key
  ipcMain.handle('license:enterKey', async (_event, key) => {
    // Step 1: Offline format check
    const formatCheck = validateKeyFormat(key, prefix);
    if (!formatCheck.valid) {
      return { ok: false, reason: formatCheck.reason };
    }

    // Step 2: Online validation (if portal URL configured)
    let validationResult = {
      valid: true,
      status: 'active',
      features: ['support', 'updates'],
      expiresAt: null,
    };

    if (portalUrl) {
      try {
        validationResult = await validateOnline(portalUrl, key, config.identifier);
        if (!validationResult.valid) {
          return { ok: false, reason: validationResult.reason || 'Server-Validierung fehlgeschlagen' };
        }
      } catch (err) {
        logWarn('license', 'Online-Validierung fehlgeschlagen, akzeptiere offline', { error: err.message });
        // Accept key offline — will be validated later
      }
    }

    // Step 3: Store encrypted key + validation cache
    writeLicenseCache(safeStorage, userDataPath, key, config.identifier, validationResult);
    logInfo('license', 'Lizenzkey hinterlegt');

    return {
      ok: true,
      status: getLicenseStatus(validationResult),
    };
  });

  // Get current license status
  ipcMain.handle('license:getStatus', () => {
    const cache = readLicenseCache(safeStorage, userDataPath);
    if (!cache.licenseKey) {
      return { hasLicense: false, active: false, reason: 'no_license', features: [] };
    }

    const status = getLicenseStatus(cache.lastValidation);
    return {
      hasLicense: true,
      ...status,
      expiresAt: cache.lastValidation?.expiresAt || null,
      needsRevalidation: needsRevalidation(cache.lastValidation),
    };
  });

  // Remove license key
  ipcMain.handle('license:removeKey', () => {
    removeLicenseCache(userDataPath);
    return { ok: true };
  });

  // Get license hash (for support ticket submission)
  ipcMain.handle('license:getHash', () => {
    const cache = readLicenseCache(safeStorage, userDataPath);
    if (!cache.licenseKey) return null;
    return computeLicenseHash(cache.licenseKey);
  });

  // Background re-validation (called by renderer periodically)
  ipcMain.handle('license:revalidate', async () => {
    if (!portalUrl) return { ok: false, reason: 'no_portal' };

    const cache = readLicenseCache(safeStorage, userDataPath);
    if (!cache.licenseKey) return { ok: false, reason: 'no_license' };

    try {
      const result = await validateOnline(portalUrl, cache.licenseKey, config.identifier);
      writeLicenseCache(safeStorage, userDataPath, cache.licenseKey, config.identifier, result);
      return { ok: true, status: getLicenseStatus(result) };
    } catch (err) {
      logWarn('license', 'Re-Validierung fehlgeschlagen', { error: err.message });
      return { ok: false, reason: err.message };
    }
  });

  logInfo('ipc', 'License-Handler registriert');
}

/**
 * Validates a license key against the portal API.
 *
 * @param {string} portalUrl - Portal base URL
 * @param {string} licenseKey - The license key
 * @param {string} productId - Product identifier
 * @returns {Promise<Object>} Validation result
 */
function validateOnline(portalUrl, licenseKey, productId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      licenseKey: licenseKey.toUpperCase().trim(),
      productId,
    });

    const url = new URL('/api/license/validate', portalUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (_) {
          reject(new Error('Ungueltige Antwort vom Server'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Zeitueberschreitung'));
    });

    req.write(body);
    req.end();
  });
}

module.exports = { registerLicenseHandlers };
