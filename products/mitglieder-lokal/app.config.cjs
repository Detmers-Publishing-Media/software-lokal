const path = require('node:path');

module.exports = {
  name: 'Mitglieder Lokal',
  identifier: 'de.detmers-publish.mitglieder-lokal',
  productId: 'mitglieder-lokal',
  windowTitle: 'Mitglieder Lokal — Mitgliederverwaltung',
  width: 1024,
  height: 768,
  dbName: 'mitglieder.db',
  encryption: false,
  iconPath: path.join(__dirname, 'assets', 'icons', '128x128.png'),
  preloadPath: path.join(__dirname, 'node_modules', '@codefabrik', 'electron-platform', 'preload.cjs'),
  distPath: path.join(__dirname, 'dist', 'index.html'),
  licensePrefix: 'CFML',
  portalUrl: 'https://portal.detmers-publish.de',
  autoUpdate: false,
  updateUrl: null,
};
