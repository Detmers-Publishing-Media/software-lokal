const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const Database = require('better-sqlite3');
const ExcelJS = require('exceljs');
const fs = require('node:fs');

let mainWindow;
let db;

const DB_PATH = path.join(app.getPath('userData'), 'berater-lokal.db');

function initDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = `
    CREATE TABLE IF NOT EXISTS _schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kunden (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anrede TEXT,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      geburtsdatum TEXT,
      familienstand TEXT CHECK(familienstand IN ('ledig','verheiratet','geschieden','verwitwet')),
      beruf TEXT,
      beruf_status TEXT CHECK(beruf_status IN ('angestellt','selbstaendig','verbeamtet','student','azubi','rentner')),
      arbeitgeber TEXT,
      branche TEXT,
      raucher INTEGER DEFAULT 0,
      groesse_cm INTEGER,
      gewicht_kg REAL,
      vorerkrankungen TEXT,
      medikamente TEXT,
      notizen TEXT,
      partner_id INTEGER REFERENCES kunden(id),
      erstellt_am TEXT DEFAULT (datetime('now')),
      aktualisiert_am TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kinder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      geburtsdatum TEXT,
      im_haushalt INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS einnahmen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      typ TEXT NOT NULL,
      bezeichnung TEXT,
      betrag REAL NOT NULL,
      periode TEXT DEFAULT 'monatlich',
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS ausgaben (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      kategorie TEXT NOT NULL,
      bezeichnung TEXT,
      betrag REAL NOT NULL,
      periode TEXT DEFAULT 'monatlich',
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS policen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      sparte TEXT NOT NULL,
      versicherer TEXT,
      tarifname TEXT,
      vertragsnummer TEXT,
      versicherungssumme REAL,
      leistung_text TEXT,
      beitrag_monatlich REAL,
      selbstbeteiligung REAL DEFAULT 0,
      vertragsbeginn TEXT,
      laufzeit_bis TEXT,
      kuendigungsfrist TEXT,
      dynamik INTEGER DEFAULT 0,
      dynamik_prozent REAL,
      letzte_pruefung TEXT,
      bewertung TEXT CHECK(bewertung IN ('gruen','gelb','rot')),
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS vermoegen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      typ TEXT NOT NULL,
      bezeichnung TEXT,
      aktueller_wert REAL,
      monatl_sparrate REAL DEFAULT 0,
      rendite_pa REAL,
      verfuegbarkeit TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS verbindlichkeiten (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      typ TEXT NOT NULL,
      bezeichnung TEXT,
      restschuld REAL,
      zinssatz REAL,
      zinsbindung_bis TEXT,
      monatl_rate REAL,
      sondertilgung_moeglich INTEGER DEFAULT 0,
      sondertilgung_prozent REAL,
      laufzeit_bis TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS altersvorsorge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      typ TEXT NOT NULL,
      anbieter TEXT,
      monatl_beitrag REAL,
      aktueller_stand REAL,
      prognostizierte_rente REAL,
      rentenbeginn TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS konditionen_versicherung (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      versicherer TEXT NOT NULL,
      sparte TEXT NOT NULL,
      tarifname TEXT,
      gueltig_ab TEXT,
      gueltig_bis TEXT,
      alter_von INTEGER,
      alter_bis INTEGER,
      beitrag_monatlich REAL,
      versicherungssumme REAL,
      leistung_text TEXT,
      selbstbeteiligung REAL,
      berufsgruppe TEXT,
      rating TEXT,
      courtage_ap TEXT,
      courtage_bp TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS konditionen_darlehen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kreditgeber TEXT NOT NULL,
      produktname TEXT,
      gueltig_ab TEXT,
      gueltig_bis TEXT,
      sollzins REAL,
      effektivzins REAL,
      zinsbindung_jahre INTEGER,
      sondertilgung_prozent REAL,
      bereitstellungszinsfrei_monate INTEGER,
      kfw_kompatibel INTEGER DEFAULT 0,
      min_eigenkapital_prozent REAL,
      provision TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actor TEXT DEFAULT 'app',
      version INTEGER DEFAULT 1,
      data TEXT,
      hash TEXT NOT NULL,
      prev_hash TEXT NOT NULL
    );
  `;

  for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    db.exec(stmt + ';');
  }

  const meta = db.prepare('SELECT value FROM _schema_meta WHERE key = ?').get('version');
  if (!meta) {
    db.prepare('INSERT INTO _schema_meta (key, value) VALUES (?, ?)').run('version', '0.1.0');
  }
}

function registerIpcHandlers() {
  ipcMain.handle('db:query', (_event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    } catch (err) {
      console.error('db:query error:', err.message);
      return [];
    }
  });

  ipcMain.handle('db:execute', (_event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
      console.error('db:execute error:', err.message);
      return { lastInsertRowid: 0, changes: 0, error: err.message };
    }
  });

  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      ...options,
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
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
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Berater Lokal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (db) db.close();
  app.quit();
});
