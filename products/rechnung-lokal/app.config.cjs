const path = require('node:path');

module.exports = {
  name: 'Rechnung Lokal',
  identifier: 'de.detmers-publish.rechnung-lokal',
  windowTitle: 'Rechnung Lokal — Rechnungsstellung',
  version: '0.2.0',
  width: 1100,
  height: 768,
  dbName: 'rechnungen.db',
  encryption: false,
  iconPath: path.join(__dirname, 'assets', 'icons', '128x128.png'),
  preloadPath: path.join(__dirname, 'node_modules', '@codefabrik', 'electron-platform', 'preload.cjs'),
  distPath: path.join(__dirname, 'dist', 'index.html'),
  licensePrefix: 'CFRL',
  portalUrl: 'https://portal.detmers-publish.de',
  autoUpdate: false,
  updateUrl: null,
};
