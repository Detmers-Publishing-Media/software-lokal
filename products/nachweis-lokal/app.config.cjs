const path = require('node:path');

module.exports = {
  name: 'Nachweis Lokal',
  identifier: 'de.detmers-publish.nachweis-lokal',
  productId: 'nachweis-lokal',
  windowTitle: 'Nachweis Lokal — Pruefprotokolle & Checklisten',
  width: 1024,
  height: 768,
  dbName: 'nachweis.db',
  encryption: false,
  iconPath: path.join(__dirname, 'assets', 'icons', '128x128.png'),
  preloadPath: path.join(__dirname, 'node_modules', '@codefabrik', 'electron-platform', 'preload.cjs'),
  distPath: path.join(__dirname, 'dist', 'index.html'),
  licensePrefix: 'CFNW',
  portalUrl: 'https://portal.detmers-publish.de',
  autoUpdate: false,
  updateUrl: null,
};
