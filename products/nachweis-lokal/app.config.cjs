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

  registerIpcHandlers: ({ ipcMain, app, getDb }) => {
    const { startServer, stopServer, getStatus, setInspection } = require('./electron/mobile-server.cjs');
    const { generateQR } = require('./electron/mobile-qr.cjs');
    const mobilePath = path.join(__dirname, 'mobile');

    ipcMain.handle('mobile:start', async (_event, inspectionId) => {
      const result = await startServer({
        getDb,
        mobilePath,
        onResultUpdate: (data) => {
          try {
            const { BrowserWindow } = require('electron');
            const windows = BrowserWindow.getAllWindows();
            if (windows[0]) windows[0].webContents.send('mobile:resultUpdated', data);
          } catch (_) {}
        },
      });
      setInspection(inspectionId);
      const qr = generateQR(result.url + '/inspect/' + inspectionId + '?token=' + result.token);
      return { ...result, qrMatrix: qr.matrix, inspectionId };
    });

    ipcMain.handle('mobile:stop', async () => {
      stopServer();
      return { ok: true };
    });

    ipcMain.handle('mobile:getStatus', () => {
      return getStatus();
    });
  },
};
