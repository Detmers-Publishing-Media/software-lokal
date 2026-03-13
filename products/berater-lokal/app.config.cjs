const path = require('node:path');
const ExcelJS = require('exceljs');

module.exports = {
  name: 'Berater Lokal',
  identifier: 'de.detmers-publish.berater-lokal',
  windowTitle: 'Berater Lokal — Ganzheitliche Beratungssoftware',
  width: 1280,
  height: 900,
  minWidth: 1024,
  minHeight: 700,
  dbName: 'berater-lokal.db',
  encryption: false,
  iconPath: path.join(__dirname, 'assets', 'icons', '128x128.png'),
  preloadPath: path.join(__dirname, 'electron', 'preload.cjs'),
  distPath: path.join(__dirname, 'dist', 'index.html'),
  licensePrefix: 'CFBL',
  portalUrl: 'https://portal.detmers-publish.de',
  autoUpdate: false,
  updateUrl: null,

  registerIpcHandlers({ ipcMain, app, dialog }) {
    ipcMain.handle('dialog:saveFile', async (_event, options) => {
      const result = await dialog.showSaveDialog(options);
      return result.canceled ? null : result.filePath;
    });

    ipcMain.handle('excel:parse', async (_event, filePath) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const sheets = [];

        workbook.eachSheet((worksheet) => {
          const rows = [];
          const headers = [];

          worksheet.eachRow((row, rowNumber) => {
            const values = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              values[colNumber - 1] = cell.value;
            });

            if (rowNumber === 1) {
              for (let i = 0; i < values.length; i++) {
                headers[i] = String(values[i] || `Spalte_${i + 1}`).trim();
              }
            } else {
              const obj = {};
              for (let i = 0; i < headers.length; i++) {
                obj[headers[i]] = values[i] ?? null;
              }
              rows.push(obj);
            }
          });

          sheets.push({ name: worksheet.name, headers, rows });
        });

        return sheets;
      } catch (err) {
        console.error('excel:parse error:', err.message);
        return { error: err.message };
      }
    });

    ipcMain.handle('excel:export', async (_event, { filePath, sheets }) => {
      try {
        const workbook = new ExcelJS.Workbook();

        for (const sheet of sheets) {
          const ws = workbook.addWorksheet(sheet.name);
          if (sheet.columns) {
            ws.columns = sheet.columns;
          }
          if (sheet.headers) {
            ws.addRow(sheet.headers);
            const headerRow = ws.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
          }
          for (const row of sheet.rows) {
            ws.addRow(Array.isArray(row) ? row : sheet.headers.map(h => row[h] ?? ''));
          }
        }

        await workbook.xlsx.writeFile(filePath);
        return { success: true };
      } catch (err) {
        return { error: err.message };
      }
    });
  },
};
