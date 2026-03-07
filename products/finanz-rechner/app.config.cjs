const path = require('node:path');

module.exports = {
  name: 'FinanzRechner Lokal',
  identifier: 'de.detmers-publish.finanzrechner-lokal',
  windowTitle: 'FinanzRechner Lokal — Finanzrechner fuer Versicherungsmakler',
  width: 1024,
  height: 768,
  dbName: null,
  encryption: false,
  iconPath: path.join(__dirname, 'assets', 'icons', '128x128.png'),
  distPath: path.join(__dirname, 'dist', 'index.html'),
  licensePrefix: 'CFFR',
  portalUrl: null,
  autoUpdate: false,
  updateUrl: null,
};
