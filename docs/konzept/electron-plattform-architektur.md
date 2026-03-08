# Code-Fabrik — Electron-Plattform-Architektur

*Stand: 2026-03-06*
*Status: REVIEW v6 — ergaenzt um DSGVO-sichere KI-Support-Architektur (Sanitizer, Split-Bundle, Datenklassen)*
*Referenz: architektur-integritaet-tests.md (verbindliches Integritaets-Konzept)*
*Referenz: support-betriebsmodell.md (verbindliches Support-Betriebsmodell)*
*Referenz: ki-support-architektur-dsgvo.md (verbindliche DSGVO-sichere KI-Support-Architektur)*

---

## 1. Ausgangslage

### Was existiert heute

```
products/
  shared/                         @codefabrik/shared (produktuebergreifend)
    src/license/index.js            validateLicenseFormat, normalizeLicenseKey

  mitglieder-lokal/
    app-shared/               @codefabrik/app-shared (eingebettet)
      src/db/index.js               openDb, query, execute, migrate (Tauri-spezifisch)
      src/components/               DataTable, SearchBar, ExportButton (Svelte)
      src/license/                  Re-Export aus @codefabrik/shared
    src/lib/
      db.js                         370 Zeilen Fach-CRUD + Migrationen + Event-Log
      crypto.js                     HMAC-SHA256 (Web Crypto API, framework-unabhaengig)
      pdf.js                        PDF-Basisfunktion (pdfmake)
      pdf-lists.js                  5 produktspezifische PDF-Listen
      pdf-mahnbrief.js              Mahnbriefe (3 Stufen)
      csv.js                        CSV-Export (Semikolon, BOM)
      license.js                    Probe-Limit (30 Mitglieder)
      stores/                       Svelte Stores (navigation, members)
    src/routes/                     6 Svelte-Seiten
    src-tauri/                      Rust Main Process (wird entfernt)
    tests/                          74 Tests (laufen bereits in Node.js)

  finanz-rechner/
    shared/                       @codefabrik/shared (Kopie, eingebettet)
    src/lib/
      license.js                    Importiert aus @codefabrik/shared/license
    src-tauri/                      Rust Main Process (wird entfernt)
```

### Probleme mit dem aktuellen Aufbau

1. **Tauri funktioniert nicht auf Windows 10** — Show-Stopper (siehe desktop-framework-review.md)
2. **app-shared ist eingebettet** — Aenderungen muessen manuell kopiert werden
3. **shared existiert doppelt** — einmal unter products/shared, einmal als Kopie in finanz-rechner/shared
4. **DB-Schicht ist Tauri-spezifisch** — @tauri-apps/plugin-sql, nicht wiederverwendbar
5. **Kein geteilter Electron-Boilerplate** — bei 20 Produkten waere das 20x Copy-Paste

### Verbindliche Vorgaben

Diese Architektur muss kompatibel sein mit dem bestehenden Integritaets-Konzept
(`docs/konzept/architektur-integritaet-tests.md`). Insbesondere:

- **`_schema_meta`-Tabelle** als einziges Schema-Versionierungs-System
- **Event-Log mit HMAC-Hash-Kette** (append-only, Snapshot-Events)
- **Lokales Backup** automatisch bei App-Start (wenn > 24h alt)
- **Backup vor jeder Migration** (Pflicht)
- **Maximal 3 Versionen inkrementell**, danach Event-Replay erzwungen
- **7 Testkategorien** muessen alle bestehen vor Release
- **Fixture pro Minor-Release** (nie loeschen)

---

## 2. Ziel-Architektur

### Verzeichnisstruktur

```
code-fabrik/
  pnpm-workspace.yaml              Monorepo-Konfiguration
  packages/
    electron-platform/            @codefabrik/electron-platform
      package.json
      main.js                       createApp() — startet Electron mit Produkt-Config
      preload.cjs                   contextBridge: DB, Dialog, FS, Backup, Update, Support
      lib/
        db-core.js                  Reine DB-Logik (testbar ohne Electron)
        backup-core.js              Reine Backup-Logik (testbar ohne Electron)
        logger.js                   File-Logger mit Rotation (testbar ohne Electron)
        health.js                   DB + Installations-Integritaetspruefung (testbar)
        support-bundle.js           Diagnosedaten-Export (testbar ohne Electron)
        support-sanitizer.js        Sanitizing Engine: PII entfernen, Pfade normalisieren, Log-Signaturen
        recovery.js                 DB-Repair, Lock-Recovery (testbar ohne Electron)
      ipc/
        db.js                       IPC-Handler → ruft db-core.js auf
        backup.js                   IPC-Handler → ruft backup-core.js auf
        dialog.js                   Datei-oeffnen/speichern via electron.dialog
        fs.js                       Dateisystem-Operationen (Logo kopieren etc.)
        update.js                   Auto-Update mit Rollback (electron-updater)
        support.js                  Support-Bundle + App-Info + Recovery-Center IPC

    shared/                       @codefabrik/shared (erweitert)
      package.json
      src/
        db/index.js                 Renderer-seitige DB-Funktionen (mit injizierbarem Backend)
        audit-log/index.js          appendEvent(), verifyChain() (aus db.js extrahiert)
        crypto/index.js             computeHmac() (aus crypto.js, unveraendert)
        csv/index.js                generateCsv(), downloadCsv() (aus csv.js, unveraendert)
        license/index.js            validateLicenseFormat() (existiert bereits)

    app-shared/               @codefabrik/app-shared
      package.json
      src/
        components/                 DataTable, SearchBar, ExportButton (unveraendert)

  products/
    mitglieder-lokal/
      package.json                  Deps: @codefabrik/electron-platform, shared, app-shared
      app.config.js                 { name, dbName, windowTitle, width, height, icon }
      src/
        lib/
          db.js                     Nur Fach-CRUD + Migrationen (importiert aus @codefabrik/shared/db)
          pdf.js                    PDF-Basisfunktion (unveraendert)
          pdf-lists.js              Produktspezifisch (unveraendert)
          pdf-mahnbrief.js          Produktspezifisch (unveraendert)
          license.js                Probe-Limit (importiert aus @codefabrik/shared/license)
          stores/                   Svelte Stores (unveraendert)
        routes/                     6 Svelte-Seiten (unveraendert)
      tests/                        74 Tests (unveraendert)

    finanz-rechner/
      package.json
      app.config.js
      src/
        ...nur Fachlogik + UI
```

### Wesentlicher Unterschied

Die Plattform trennt **IPC-Handler** von **testbarer Kernlogik**:

```
ipc/db.js           → duenne IPC-Schicht, ruft lib/db-core.js auf
ipc/backup.js       → duenne IPC-Schicht, ruft lib/backup-core.js auf
ipc/support.js      → duenne IPC-Schicht, ruft lib/support-bundle.js + lib/recovery.js auf
lib/db-core.js      → reine Logik: openDb, migrate, query, execute (testbar)
lib/backup-core.js  → reine Logik: createBackup, validateBackup, rotate (testbar)
lib/logger.js       → reine Logik: File-Logger mit Rotation (testbar)
lib/health.js       → reine Logik: DB + Installations-Integritaetspruefung (testbar)
lib/recovery.js     → reine Logik: DB-Repair, Lock-Recovery (testbar)
lib/support-bundle.js → reine Logik: Diagnosedaten sammeln (testbar)
```

### Was wohin wandert

| Datei heute | Ziel-Paket | Aenderung |
|---|---|---|
| `app-shared/src/db/index.js` | `packages/shared/src/db/` | Tauri → injizierbares Backend (IPC oder Mock) |
| `src/lib/crypto.js` | `packages/shared/src/crypto/` | Unveraendert |
| `src/lib/csv.js` | `packages/shared/src/csv/` | Unveraendert |
| `src/lib/license.js` | Bleibt im Produkt | Importiert getActiveMemberCount aus eigenem db.js |
| `products/shared/src/license/` | `packages/shared/src/license/` | Unveraendert |
| `app-shared/src/components/` | `packages/app-shared/src/components/` | Unveraendert |
| `src-tauri/` | Geloescht | Durch electron-platform ersetzt |
| `src/lib/db.js` | Bleibt im Produkt | appendEvent/verifyChain → Import aus shared/audit-log |
| `src/lib/pdf.js` | Bleibt im Produkt | Koennte spaeter nach shared, aber nicht jetzt |

---

## 3. Datenintegritaet und Sicherheit

Dieses Kapitel ist das Herzstueck der Architektur. Es setzt die Vorgaben aus
`architektur-integritaet-tests.md` im Electron-Kontext um.

### 3.1 Grundsatz

> Die Daten des Nutzers sind das Wertvollste im System.
> Jede Architekturentscheidung wird zuerst daran gemessen,
> ob sie die Integritaet der Daten schuetzt.

Das bedeutet konkret:
- **Kein Datenverlust bei Updates** — Backup vor jeder Migration, Transaktion fuer Migration
- **Kein Zwischenzustand** — Migration ist atomar: alles oder nichts
- **Kein stiller Fehler** — jeder Fehler wird erkannt, gemeldet, protokolliert
- **Jede Aenderung nachvollziehbar** — Event-Log mit Hash-Kette
- **Wiederherstellung immer moeglich** — Backup + Event-Replay als Fallback

### 3.2 Schema-Versionierung: `_schema_meta` (einziges System)

```sql
CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 0,
    app_version TEXT NOT NULL DEFAULT '0.0.0',
    last_migration TEXT,
    event_replay_at TEXT
);
INSERT OR IGNORE INTO _schema_meta (id, schema_version, app_version)
  VALUES (1, 0, '0.0.0');
```

### 3.3 Migrations-Ablauf (Alles-oder-Nichts)

```
App startet
  → Single-Instance-Lock pruefen
  → Logging initialisieren
  → App-Selbsttest (kritische Dateien vorhanden?)
  → Safe-Mode pruefen (--safe-mode?)
  → userData beschreibbar? Speicherplatz ausreichend?
  → Cloud-Sync / Netzlaufwerk erkennen
  → DB oeffnen (mit Lock-Recovery bei SQLITE_BUSY)
  → DB-Health-Check (PRAGMA integrity_check)
  → Backup erstellen (falls > 24h oder Migration ansteht)
  → _schema_meta lesen
  → Schema-Version vergleichen

  Fall 1: DB-Version == App-Version → weiter, alles gut
  Fall 2: DB-Version > App-Version  → STOP: "Bitte aktualisieren Sie die Software"
  Fall 3: Differenz <= 3            → Backup + inkrementelle Migration (1 Transaktion)
  Fall 4: Differenz > 3             → Backup + Event-Replay erzwungen
  Fall 5: Leere DB                  → Vollstaendige Initialisierung
```

**Entscheidend: EINE Transaktion fuer ALLE Migrationsschritte.**
Wenn Schritt 3 von 5 fehlschlaegt, wird alles zurueckgerollt. Die DB bleibt im
alten, konsistenten Zustand. Das Backup existiert als zusaetzliches Sicherheitsnetz.

### 3.4 Backup vor Migration (Pflicht)

```
1. Freien Speicherplatz pruefen (>= 2x DB-Groesse)
2. Backup erstellen
3. Backup validieren (oeffnen + integrity_check)
4. Erst DANN: Migration ausfuehren
5. Wenn Migration fehlschlaegt: Recovery-Dialog anbieten
```

### 3.5 Event-Log-Kompatibilitaet

Unveraendert: append-only, HMAC-SHA256 Hash-Kette, Snapshot-Events.
`appendEvent()` und `verifyChain()` leben in `@codefabrik/shared/audit-log`.

Migrationen erzeugen ein `MigrationAusgefuehrt`-Event:
```javascript
{ type: 'MigrationAusgefuehrt', data: { von_version: 3, nach_version: 5, methode: 'inkrementell' } }
```

### 3.6 SQLCipher-Vorbereitung

Phase 1 nutzt plain better-sqlite3. Platzhalter fuer SQLCipher in `openDb()`:
```javascript
// SQLCipher (Phase 2): PRAGMA key hier einsetzen
// if (options.encryptionKey) {
//   db.pragma(`key = '${options.encryptionKey}'`);
// }
```
Drop-in-Replacement: `better-sqlite3-multiple-ciphers`.

---

## 4. Betriebsstabilitaet (Unhappy Path)

**Grundsatz:** Die Architektur muss den Unhappy Path genauso sauber beschreiben
wie den Happy Path. Der Unterschied zwischen guter und wirklich verlaesslicher
Software liegt in der Frage: *Wie verhaelt sich die App im kaputten Zustand?
Wie kommt der Nutzer ohne Technikkenntnisse wieder heraus?*

### 4.1 Single-Instance-Lock

```javascript
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); return; }

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
```

### 4.2 Logging-Infrastruktur

**lib/logger.js (testbar ohne Electron):**

```javascript
import fs from 'node:fs';
import path from 'node:path';

const LOG_LEVELS = { critical: 0, error: 1, warn: 2, info: 3, debug: 4 };
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5 MB
const MAX_FILES = 5;

let logDir = null;
let logLevel = LOG_LEVELS.info;

export function initLogger(dir, level = 'info') {
  logDir = dir;
  logLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  fs.mkdirSync(logDir, { recursive: true });
}

export function log(level, component, message, data = null) {
  if (LOG_LEVELS[level] > logLevel) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...(data ? { data } : {}),
  };

  const line = JSON.stringify(entry) + '\n';

  if (process.env.NODE_ENV === 'development') {
    process.stdout.write(`[${level.toUpperCase()}] ${component}: ${message}\n`);
  }

  if (!logDir) return;
  const logFile = path.join(logDir, 'app.log');

  try {
    fs.appendFileSync(logFile, line);
    rotateIfNeeded(logFile);
  } catch (_) {
    // Logging darf nie die App zum Absturz bringen
  }
}

function rotateIfNeeded(logFile) {
  try {
    const stat = fs.statSync(logFile);
    if (stat.size < MAX_FILE_SIZE) return;
    for (let i = MAX_FILES - 1; i >= 1; i--) {
      const from = path.join(logDir, `app.${i}.log`);
      const to = path.join(logDir, `app.${i + 1}.log`);
      if (fs.existsSync(from)) {
        if (i + 1 >= MAX_FILES) fs.unlinkSync(from);
        else fs.renameSync(from, to);
      }
    }
    fs.renameSync(logFile, path.join(logDir, 'app.1.log'));
  } catch (_) {}
}

export const logCritical = (comp, msg, data) => log('critical', comp, msg, data);
export const logError = (comp, msg, data) => log('error', comp, msg, data);

// --- Error-Code-Tagging (Integration mit Support-Modell) ---

/**
 * Loggt einen Fehler mit CF-Fehlercode. Alle logError-Aufrufe die einem
 * bekannten Fehlerszenario entsprechen, MUESSEN diese Funktion verwenden.
 * Ermoeglicht: Log-Filterung nach Code, automatische recentErrors im Bundle.
 */
export function logCodedError(component, errorCode, message, data = null) {
  log(ERROR_CODES[errorCode]?.severity || 'error', component, message, {
    ...data,
    errorCode,
  });

  // Kritische/Error-Fehler persistent speichern fuer case-summary
  if (['critical', 'error'].includes(ERROR_CODES[errorCode]?.severity)) {
    persistLastError(errorCode, message);
  }
}

/**
 * Speichert den letzten kritischen Fehler in userData/last-error.json.
 * Ueberlebt App-Crashes — wird beim naechsten Start ins Support-Bundle aufgenommen.
 */
function persistLastError(errorCode, message) {
  if (!logDir) return;
  const lastErrorPath = path.join(path.dirname(logDir), 'last-error.json');
  try {
    fs.writeFileSync(lastErrorPath, JSON.stringify({
      code: errorCode,
      timestamp: new Date().toISOString(),
      message,
    }));
  } catch (_) {}
}

import { ERROR_CODES } from './error-codes.js';
export const logWarn = (comp, msg, data) => log('warn', comp, msg, data);
export const logInfo = (comp, msg, data) => log('info', comp, msg, data);
export const logDebug = (comp, msg, data) => log('debug', comp, msg, data);
```

**Log-Levels:**

| Level | Bedeutung | Beispiele |
|---|---|---|
| CRITICAL | App kann nicht weiterlaufen | DB nicht oeffenbar, userData nicht beschreibbar |
| ERROR | Operation fehlgeschlagen, App laeuft weiter | Migration fehlgeschlagen, Backup fehlgeschlagen |
| WARN | Potentielles Problem erkannt | Cloud-Sync erkannt, WAL ungewoehnlich gross |
| INFO | Normaler Betrieb | App gestartet, Backup erstellt, Migration erfolgreich |
| DEBUG | Detailinfos fuer Entwicklung | SQL-Statements, IPC-Aufrufe |

**Crash-Reporting:**
```javascript
process.on('uncaughtException', (err) => {
  logCritical('crash', 'Unbehandelte Exception', {
    message: err.message, stack: err.stack,
  });
  dialog.showErrorBox(
    'Unerwarteter Fehler',
    'Die Anwendung hat einen unerwarteten Fehler festgestellt.\n\n' +
    'Bitte exportieren Sie die Diagnosedaten\n(Hilfe → Diagnosedaten exportieren)\n\n' +
    `Technisch: ${err.message}`
  );
});

process.on('unhandledRejection', (reason) => {
  logCritical('crash', 'Unbehandelte Promise-Rejection', {
    message: reason?.message || String(reason), stack: reason?.stack,
  });
});
```

**Renderer-Fehler erfassen:**
```javascript
// preload.cjs
logRendererError: (error) => ipcRenderer.invoke('log:rendererError', error),
```

### 4.3 App-Selbsttest beim Start

**Problem:** Virenscanner, defektes Update oder manuelles Loeschen koennen
zentrale App-Dateien entfernen. Die App startet dann nicht oder crasht kryptisch.

**Loesung:** Beim Start pruefen ob kritische Dateien vorhanden sind.

```javascript
// In lib/health.js
export function checkInstallIntegrity(appPath) {
  const criticalFiles = [
    'preload.cjs',
    'dist/index.html',
  ];

  const missing = [];
  for (const file of criticalFiles) {
    const fullPath = path.join(appPath, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      message: 'Die Installation scheint beschaedigt zu sein. ' +
        'Fehlende Dateien: ' + missing.join(', ') + '. ' +
        'Bitte fuehren Sie eine Reparaturinstallation durch.',
    };
  }
  return { ok: true };
}
```

### 4.4 Safe Mode

**Zweck:** Start im abgesicherten Modus wenn die App im Normalzustand nicht
funktioniert. Ermoeglicht Diagnose, Backup-Export und Recovery ohne dass
Migrationen oder Renderer-Scripts Probleme verursachen.

**Aktivierung:** `--safe-mode` Kommandozeilenparameter oder automatisch nach
erkanntem Crash beim letzten Start.

**Verhalten im Safe Mode:**
- Keine Schema-Migration
- DB wird read-only geoeffnet (soweit moeglich)
- Minimales UI: nur Recovery-Center (Diagnose, Backup, Export, Restore)
- Kein Auto-Update
- Kein Renderer-JavaScript ausser Recovery-UI

```javascript
// In main.js
const safeMode = process.argv.includes('--safe-mode') || detectPreviousCrash();

function detectPreviousCrash() {
  // Crash-Marker: Datei wird beim Start geschrieben, beim sauberen Shutdown geloescht
  const markerPath = path.join(app.getPath('userData'), '.startup-marker');
  if (fs.existsSync(markerPath)) {
    logWarn('app', 'Crash beim letzten Start erkannt — Safe Mode aktiviert');
    return true;
  }
  return false;
}

// Beim Start: Marker setzen
fs.writeFileSync(markerPath, new Date().toISOString());

// Bei sauberem Shutdown: Marker loeschen
app.on('before-quit', () => {
  try { fs.unlinkSync(markerPath); } catch (_) {}
});
```

**Safe Mode im Renderer:**
```javascript
// preload.cjs
isSafeMode: () => ipcRenderer.invoke('app:isSafeMode'),
```

### 4.5 DB-Health-Check beim Start

**lib/health.js:**

```javascript
import { logInfo, logError, logWarn } from './logger.js';

export function checkDbIntegrity(db) {
  try {
    const result = db.pragma('integrity_check');
    const ok = result.length === 1 && result[0].integrity_check === 'ok';

    if (ok) {
      logInfo('health', 'DB-Integritaetspruefung bestanden');
      return { ok: true, message: 'Datenbank ist in Ordnung.' };
    }

    const details = result.map(r => r.integrity_check).join('\n');
    logError('health', 'DB-Integritaetspruefung fehlgeschlagen', { details });
    return { ok: false, message: 'Die Datenbank weist Inkonsistenzen auf.', details };
  } catch (err) {
    logError('health', 'Integritaetspruefung nicht ausfuehrbar', { error: err.message });
    return { ok: false, message: `Pruefung fehlgeschlagen: ${err.message}` };
  }
}

export function checkWritable(dirPath) {
  const testFile = path.join(dirPath, '.write-test');
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: `Verzeichnis nicht beschreibbar: ${err.message}` };
  }
}

export function checkDiskSpace(dirPath, requiredBytes) {
  try {
    const stats = fs.statfsSync(dirPath);
    const freeBytes = stats.bavail * stats.bsize;
    const freeMB = Math.round(freeBytes / 1024 / 1024);

    if (freeBytes < requiredBytes) {
      return {
        ok: false,
        freeMB,
        message: `Nur ${freeMB} MB frei. Mindestens ${Math.round(requiredBytes / 1024 / 1024)} MB benoetigt.`,
      };
    }
    if (freeBytes < 1024 * 1024 * 1024) { // < 1 GB
      return { ok: true, warning: true, freeMB, message: `Wenig Speicherplatz: ${freeMB} MB frei.` };
    }
    return { ok: true, freeMB };
  } catch (_) {
    return { ok: true }; // Im Zweifel weitermachen
  }
}

export function checkStorageRisks(dbPath) {
  const lower = dbPath.toLowerCase();
  const risks = [];

  // Cloud-Sync-Erkennung
  const cloudServices = ['onedrive', 'dropbox', 'google drive', 'icloud'];
  const cloudMatch = cloudServices.find(s => lower.includes(s));
  if (cloudMatch) {
    risks.push({
      type: 'cloud-sync',
      service: cloudMatch,
      severity: 'high',
      message: `Datenbank liegt in ${cloudMatch}-Ordner. ` +
        'Cloud-Synchronisation kann zu Datenverlust fuehren.',
    });
  }

  // Netzlaufwerk-Erkennung
  if (lower.startsWith('\\\\') || lower.startsWith('//')) {
    risks.push({
      type: 'network-path',
      severity: 'high',
      message: 'Datenbank liegt auf einem Netzlaufwerk. ' +
        'SQLite auf Netzlaufwerken ist nicht zuverlaessig und kann zu Korruption fuehren.',
    });
  }

  // Windows UNC-Pfade
  if (process.platform === 'win32' && /^[A-Z]:\\/i.test(dbPath)) {
    // Normaler lokaler Pfad — OK
  }

  return risks;
}
```

### 4.6 DB-Lock-Recovery

**Problem:** Nach App-Crash kann `SQLITE_BUSY` bestehen bleiben.

**lib/recovery.js:**

```javascript
import fs from 'node:fs';
import { logInfo, logWarn, logError } from './logger.js';

/**
 * Versucht eine gesperrte DB zu oeffnen mit Retry und WAL-Cleanup.
 */
export function openDbWithRetry(Database, dbPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('busy_timeout = 5000'); // 5 Sekunden warten bei Lock
      logInfo('recovery', `DB geoeffnet (Versuch ${attempt})`);
      return db;
    } catch (err) {
      logWarn('recovery', `DB-Oeffnung fehlgeschlagen (Versuch ${attempt}/${maxRetries})`, {
        error: err.message,
      });

      if (attempt < maxRetries) {
        // WAL/SHM aufraeeumen wenn moeglich
        cleanupStaleLocks(dbPath);
        // Kurz warten
        const waitMs = attempt * 2000;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
      } else {
        throw err;
      }
    }
  }
}

function cleanupStaleLocks(dbPath) {
  // Nur aufraeeumen wenn kein anderer Prozess die DB haelt
  // WAL/SHM loeschen ist sicher wenn kein Prozess die DB offen hat
  for (const ext of ['-wal', '-shm']) {
    const lockFile = dbPath + ext;
    if (fs.existsSync(lockFile)) {
      try {
        const stat = fs.statSync(lockFile);
        const ageMs = Date.now() - stat.mtimeMs;
        // Nur loeschen wenn aelter als 30 Sekunden (kein aktiver Prozess)
        if (ageMs > 30_000) {
          fs.unlinkSync(lockFile);
          logInfo('recovery', `Veraltete Lock-Datei entfernt: ${ext}`);
        }
      } catch (_) {}
    }
  }
}

/**
 * Versucht eine beschaedigte DB zu reparieren.
 *
 * Strategie (in Reihenfolge):
 * 1. PRAGMA integrity_check — vielleicht ist sie gar nicht kaputt
 * 2. .recover Equivalent — Daten aus korrupter DB retten
 * 3. VACUUM INTO — Daten in neue saubere DB kopieren
 * 4. Backup wiederherstellen — letzter Ausweg
 */
export function attemptDbRepair(Database, dbPath, backupDir, dbName) {
  const results = [];

  // Schritt 1: Nochmal pruefen
  try {
    const db = new Database(dbPath, { readonly: true });
    const check = db.pragma('integrity_check');
    db.close();
    if (check.length === 1 && check[0].integrity_check === 'ok') {
      results.push({ step: 'integrity_check', success: true, message: 'DB ist doch OK.' });
      return { repaired: true, results };
    }
    results.push({ step: 'integrity_check', success: false, message: 'DB ist beschaedigt.' });
  } catch (err) {
    results.push({ step: 'integrity_check', success: false, message: err.message });
  }

  // Schritt 2: VACUUM INTO neue Datei (rettet lesbare Daten)
  const repairedPath = dbPath + '.repaired';
  try {
    const db = new Database(dbPath, { readonly: true });
    db.exec(`VACUUM INTO '${repairedPath.replace(/'/g, "''")}'`);
    db.close();

    // Reparierte DB pruefen
    const repaired = new Database(repairedPath, { readonly: true });
    const check = repaired.pragma('integrity_check');
    repaired.close();

    if (check.length === 1 && check[0].integrity_check === 'ok') {
      // Reparierte DB als neue Haupt-DB einsetzen
      const backupOfCorrupt = dbPath + '.corrupt';
      fs.renameSync(dbPath, backupOfCorrupt);
      fs.renameSync(repairedPath, dbPath);
      logInfo('recovery', 'DB erfolgreich repariert via VACUUM INTO');
      results.push({ step: 'vacuum_repair', success: true });
      return { repaired: true, results, corruptBackup: backupOfCorrupt };
    }
    results.push({ step: 'vacuum_repair', success: false, message: 'Reparierte DB auch inkonsistent.' });
  } catch (err) {
    results.push({ step: 'vacuum_repair', success: false, message: err.message });
  }

  // Schritt 3: Backup wiederherstellen
  try {
    if (fs.existsSync(repairedPath)) fs.unlinkSync(repairedPath);
  } catch (_) {}

  results.push({
    step: 'backup_required',
    success: false,
    message: 'Automatische Reparatur fehlgeschlagen. Backup-Wiederherstellung empfohlen.',
  });

  return { repaired: false, results };
}
```

### 4.7 Zentrales Fehlercode-System

**Verbindung zum Support-Modell:** Das Fehlercodesystem ist die Bruecke zwischen
Produkt und KI-gestuetztem Support (siehe `support-betriebsmodell.md`). Codes werden
konsistent in Dialogen, Logs, Support-Bundle und KI-Prompts verwendet.

**lib/error-codes.js (zentrale Definition in electron-platform):**

```javascript
export const ERROR_CODES = {
  // --- Datenbank ---
  'CF-DB-001': {
    category: 'db', severity: 'error',
    title: 'Datenbank gesperrt',
    userMessage: 'Die Datenbank wird von einem anderen Programm verwendet.',
    action: 'Bitte schliessen Sie andere Programme und versuchen Sie es erneut.',
    escalate: false,
  },
  'CF-DB-002': {
    category: 'db', severity: 'critical',
    title: 'Integritaetspruefung fehlgeschlagen',
    userMessage: 'Die Datenbank weist Inkonsistenzen auf.',
    action: 'Moechten Sie eine automatische Reparatur versuchen oder das letzte Backup wiederherstellen?',
    escalate: true,
  },
  'CF-DB-003': {
    category: 'db', severity: 'critical',
    title: 'Datenbank nicht lesbar',
    userMessage: 'Die Datenbankdatei kann nicht gelesen werden.',
    action: 'Bitte pruefen Sie die Dateiberechtigungen oder stellen Sie ein Backup wieder her.',
    escalate: true,
  },
  'CF-DB-004': {
    category: 'db', severity: 'error',
    title: 'Datenbank fehlt',
    userMessage: 'Die Datenbankdatei wurde nicht gefunden.',
    action: 'Moechten Sie ein Backup wiederherstellen oder eine neue Datenbank anlegen?',
    escalate: false,
  },
  'CF-DB-005': {
    category: 'db', severity: 'error',
    title: 'Datenbank neuer als App',
    userMessage: 'Diese Datenbank wurde mit einer neueren Version erstellt.',
    action: 'Bitte aktualisieren Sie die Software auf die aktuelle Version.',
    escalate: false,
  },

  // --- Backup ---
  'CF-BKP-001': {
    category: 'backup', severity: 'error',
    title: 'Automatisches Backup fehlgeschlagen',
    userMessage: 'Das automatische Backup konnte nicht erstellt werden.',
    action: 'Bitte pruefen Sie den verfuegbaren Speicherplatz.',
    escalate: false,
  },
  'CF-BKP-002': {
    category: 'backup', severity: 'critical',
    title: 'Wiederherstellung fehlgeschlagen',
    userMessage: 'Das Backup konnte nicht wiederhergestellt werden.',
    action: 'Bitte exportieren Sie die Diagnosedaten und wenden Sie sich an den Support.',
    escalate: true,
  },
  'CF-BKP-003': {
    category: 'backup', severity: 'error',
    title: 'Kein gueltiges Backup gefunden',
    userMessage: 'Es wurde kein gueltiges Backup gefunden.',
    action: 'Erstellen Sie ein manuelles Backup ueber das Hilfe-Menue.',
    escalate: false,
  },

  // --- Migration ---
  'CF-MIG-001': {
    category: 'migration', severity: 'critical',
    title: 'Migration fehlgeschlagen',
    userMessage: 'Die Datenbank-Aktualisierung konnte nicht abgeschlossen werden.',
    action: 'Ihre Daten sind sicher — das automatische Backup wurde vorher erstellt. Bitte wenden Sie sich an den Support.',
    escalate: true,
  },
  'CF-MIG-002': {
    category: 'migration', severity: 'info',
    title: 'Event-Replay erforderlich',
    userMessage: 'Die Datenbank muss neu aufgebaut werden (grosser Versionssprung).',
    action: 'Dieser Vorgang kann einige Minuten dauern. Bitte nicht beenden.',
    escalate: false,
  },
  'CF-MIG-003': {
    category: 'migration', severity: 'critical',
    title: 'Migration unterbrochen',
    userMessage: 'Die Datenbank-Aktualisierung wurde unterbrochen.',
    action: 'Die Anwendung startet im abgesicherten Modus. Bitte stellen Sie das Backup wieder her.',
    escalate: true,
  },

  // --- Update ---
  'CF-UPD-001': {
    category: 'update', severity: 'warn',
    title: 'Updatepruefung fehlgeschlagen',
    userMessage: 'Die Pruefung auf Updates konnte nicht durchgefuehrt werden.',
    action: 'Bitte pruefen Sie Ihre Internetverbindung.',
    escalate: false,
  },
  'CF-UPD-002': {
    category: 'update', severity: 'error',
    title: 'Updateinstallation fehlgeschlagen',
    userMessage: 'Das Update konnte nicht installiert werden.',
    action: 'Bitte versuchen Sie es spaeter erneut oder laden Sie das Update manuell herunter.',
    escalate: false,
  },
  'CF-UPD-003': {
    category: 'update', severity: 'critical',
    title: 'Signatur-/Vertrauensproblem',
    userMessage: 'Die Signatur des Updates konnte nicht verifiziert werden.',
    action: 'Das Update wurde aus Sicherheitsgruenden nicht installiert. Bitte wenden Sie sich an den Support.',
    escalate: true,
  },

  // --- System ---
  'CF-SYS-001': {
    category: 'system', severity: 'critical',
    title: 'Datenordner nicht beschreibbar',
    userMessage: 'Der Datenordner ist nicht beschreibbar.',
    action: 'Bitte pruefen Sie die Ordner-Berechtigungen.',
    escalate: false,
  },
  'CF-SYS-002': {
    category: 'system', severity: 'error',
    title: 'Speicherplatz zu gering',
    userMessage: 'Nicht genuegend Speicherplatz auf dem Laufwerk.',
    action: 'Bitte schaffen Sie Speicherplatz frei.',
    escalate: false,
  },
  'CF-SYS-003': {
    category: 'system', severity: 'warn',
    title: 'Cloud-Sync-Risiko erkannt',
    userMessage: 'Die Datenbank liegt in einem Cloud-synchronisierten Ordner.',
    action: 'Empfehlung: Datenbank in einen lokalen Ordner verschieben.',
    escalate: false,
  },
  'CF-SYS-004': {
    category: 'system', severity: 'critical',
    title: 'Installationsdateien unvollstaendig',
    userMessage: 'Die Installation scheint beschaedigt zu sein.',
    action: 'Bitte fuehren Sie eine Reparaturinstallation durch.',
    escalate: false,
  },

  // --- Renderer/UI ---
  'CF-UI-001': {
    category: 'ui', severity: 'error',
    title: 'Oberflaeche konnte nicht geladen werden',
    userMessage: 'Die Benutzeroberflaeche konnte nicht geladen werden.',
    action: 'Bitte starten Sie die Anwendung im abgesicherten Modus (Hilfe → Diagnose).',
    escalate: false,
  },
  'CF-UI-002': {
    category: 'ui', severity: 'error',
    title: 'Unerwarteter Renderer-Fehler',
    userMessage: 'Ein unerwarteter Anzeigefehler ist aufgetreten.',
    action: 'Bitte exportieren Sie die Diagnosedaten und starten Sie die Anwendung neu.',
    escalate: false,
  },
};

/**
 * Zeigt einen Fehlerdialog basierend auf dem Fehlercode.
 * Wird von allen IPC-Handlern und dem Startup-Flow verwendet.
 */
export function getErrorInfo(code) {
  return ERROR_CODES[code] || {
    category: 'unknown', severity: 'error',
    title: 'Unbekannter Fehler',
    userMessage: 'Ein unerwarteter Fehler ist aufgetreten.',
    action: 'Bitte exportieren Sie die Diagnosedaten und wenden Sie sich an den Support.',
    escalate: true,
  };
}

/**
 * Formatiert einen Fehler fuer den nativen Dialog.
 */
export function formatErrorDialog(code, technicalDetail = null) {
  const info = getErrorInfo(code);
  let message = `${info.userMessage}\n\n${info.action}`;
  message += `\n\n[${code}]`;
  if (technicalDetail) {
    message += `\nTechnisch: ${technicalDetail}`;
  }
  return { title: info.title, message };
}

/**
 * Formatiert die Kompakt-Info fuer "Technische Infos kopieren" (2 Zeilen, vorlesbar).
 */
export function formatCompactInfo(appName, appVersion, os, schemaVersion, code, backupDate, dbSizeMB, diskFreeMB) {
  const line1 = `${appName} ${appVersion} | ${os} | Schema v${schemaVersion} | ${code || 'kein Fehler'}`;
  const line2 = `Backup: ${backupDate || 'keins'} | DB: ${dbSizeMB} MB | Platte: ${diskFreeMB} MB frei`;
  return `${line1}\n${line2}`;
}
```

**Verwendung in IPC-Handlern:**
```javascript
import { getErrorInfo, formatErrorDialog } from '../lib/error-codes.js';

// Statt freier Fehlertexte:
const { title, message } = formatErrorDialog('CF-DB-001', err.message);
dialog.showErrorBox(title, message);
```

**Grundsatz:** Jede Fehlermeldung die der Nutzer sieht, enthaelt:
1. Was ist passiert (in Alltagssprache)
2. Was der Nutzer tun kann
3. Den Fehlercode (z.B. `[CF-DB-002]`)
4. Hinweis auf Diagnosedaten bei kritischen Fehlern

### 4.8 Fortschrittsanzeige bei Migrationen

```javascript
// Fortschritts-Event an Renderer
const sendProgress = (step, total, description) => {
  if (win) win.webContents.send('migration:progress', { step, total, description });
};

sendProgress(0, total, 'Backup wird erstellt...');
// ... Backup ...
sendProgress(1, total, 'Datenbank wird aktualisiert... Bitte nicht beenden.');
// ... Migration ...
```

App waehrend Migration im Sperrzustand — kein Schliessen moeglich.
Unmissverstaendlicher Text: "Ihre Daten werden gerade sicher aktualisiert."

**Nach Crash waehrend Migration:** Beim naechsten Start erkennt der Startup-Marker
(siehe 4.4) den unvollstaendigen Shutdown → Safe Mode → Recovery-Dialog.

### 4.9 Periodische WAL-Checkpoints

```javascript
// Alle 5 Minuten PASSIVE (blockiert nicht)
const walInterval = setInterval(() => {
  try {
    const db = getDb();
    db.pragma('wal_checkpoint(PASSIVE)');

    // WAL-Groesse ueberwachen
    const walPath = dbPath + '-wal';
    if (fs.existsSync(walPath)) {
      const walSize = fs.statSync(walPath).size;
      if (walSize > 100 * 1024 * 1024) { // > 100 MB
        logWarn('db', 'WAL ungewoehnlich gross', { walSizeMB: Math.round(walSize / 1024 / 1024) });
      }
    }
  } catch (_) {}
}, 5 * 60 * 1000);

// Bei Shutdown: TRUNCATE (raeumt WAL komplett auf)
app.on('before-quit', () => {
  clearInterval(walInterval);
  closeDb(); // macht TRUNCATE-Checkpoint
});
```

### 4.10 Ressourcenlimits

```javascript
// In lib/health.js
export function checkResourceLimits(dbPath) {
  const warnings = [];

  // DB-Groesse
  try {
    const dbSize = fs.statSync(dbPath).size;
    const dbSizeMB = Math.round(dbSize / 1024 / 1024);
    if (dbSizeMB > 500) {
      warnings.push({ type: 'db-size', message: `DB ist ${dbSizeMB} MB gross.`, severity: 'warn' });
    }
  } catch (_) {}

  // WAL-Groesse
  try {
    const walPath = dbPath + '-wal';
    if (fs.existsSync(walPath)) {
      const walSize = fs.statSync(walPath).size;
      const walSizeMB = Math.round(walSize / 1024 / 1024);
      if (walSizeMB > 100) {
        warnings.push({ type: 'wal-size', message: `WAL ist ${walSizeMB} MB gross.`, severity: 'warn' });
      }
    }
  } catch (_) {}

  // Freier Speicherplatz
  try {
    const stats = fs.statfsSync(path.dirname(dbPath));
    const freeMB = Math.round((stats.bavail * stats.bsize) / 1024 / 1024);
    if (freeMB < 300) {
      warnings.push({ type: 'disk-low', message: `Nur ${freeMB} MB frei.`, severity: 'critical' });
    } else if (freeMB < 1024) {
      warnings.push({ type: 'disk-low', message: `Wenig Speicher: ${freeMB} MB frei.`, severity: 'warn' });
    }
  } catch (_) {}

  return warnings;
}
```

### 4.11 Renderer-Timeout und Fallback-Fehlerseite

**Problem:** Wenn der Renderer nicht laedt, sieht der Nutzer ein weisses Fenster.

```javascript
// In main.js — nach Fenster-Erstellung
const rendererTimeout = setTimeout(() => {
  logError('app', 'Renderer hat nicht innerhalb von 15 Sekunden geantwortet');
  // Fallback-Fehlerseite laden
  mainWindow.loadFile(path.join(__dirname, 'error.html'));
}, 15_000);

// Renderer meldet sich bereit (im preload/renderer)
ipcMain.handle('app:rendererReady', () => {
  clearTimeout(rendererTimeout);
  logInfo('app', 'Renderer bereit');
});
```

`error.html` ist eine einfache statische Seite mit:
- "Die Anwendung konnte nicht vollstaendig geladen werden."
- Button: "Diagnosedaten exportieren"
- Button: "Im abgesicherten Modus starten"
- Keine externen Abhaengigkeiten (inline CSS/JS)

### 4.12 Splash-Screen bei langsamen Starts

**Problem:** Bei kaltem Start, grosser DB oder langsamer Festplatte sieht der Nutzer
mehrere Sekunden nichts. Erneuter Doppelklick-Versuch.

```javascript
// Sofort nach app.whenReady():
const splash = new BrowserWindow({
  width: 400, height: 200,
  frame: false, alwaysOnTop: true,
  webPreferences: { nodeIntegration: false, contextIsolation: true },
});
splash.loadFile(path.join(__dirname, 'splash.html'));

// Nach erfolgreichem Start:
mainWindow.once('ready-to-show', () => {
  splash.close();
  mainWindow.show();
});
```

`splash.html`: Produktname + "Anwendung wird gestartet..." — keine Abhaengigkeiten.

---

## 5. Support-Infrastruktur

### 5.1 Recovery-Center

**Zweck:** Zentraler Diagnose- und Recovery-Bereich im Menue "Hilfe → Diagnose".
Macht aus Katastrophen einen gefuehrten Prozess.

**Funktionen:**

| Aktion | Beschreibung |
|---|---|
| Datenbank pruefen | `PRAGMA integrity_check` ausfuehren und Ergebnis anzeigen |
| Datenbank reparieren | Automatische Reparatur versuchen (VACUUM INTO, dann Backup) |
| Backup erstellen | Manuelles Backup jetzt erstellen |
| Backup wiederherstellen | Liste aller Backups mit Datum, Groesse und Validierungsstatus |
| Diagnosedaten exportieren | Support-Bundle als ZIP (ohne Kundendaten) |
| Technische Infos | Version, DB-Pfad, Schema, letztes Backup, Speicherplatz |
| Logs anzeigen | Letzte Log-Eintraege (gefiltert nach Severity) |

**Recovery-Center ist auch im Safe Mode verfuegbar** — das ist sein primaerer Zweck.

**IPC-Handler in ipc/support.js:**
```javascript
ipcMain.handle('recovery:checkDb', () => {
  return checkDbIntegrity(getDb());
});

ipcMain.handle('recovery:repairDb', () => {
  closeDb();
  const result = attemptDbRepair(Database, dbPath, backupDir, config.dbName);
  if (result.repaired) openDb(dbPath);
  return result;
});

ipcMain.handle('recovery:getStatus', () => {
  const db = getDb();
  const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
  const backups = listBackups(backupDir, config.dbName);
  const resources = checkResourceLimits(dbPath);
  const risks = checkStorageRisks(dbPath);

  return {
    schemaVersion: meta?.schema_version,
    appVersion: meta?.app_version,
    lastMigration: meta?.last_migration,
    backupCount: backups.length,
    lastBackup: backups[0]?.mtime || null,
    dbSizeBytes: fs.statSync(dbPath).size,
    resources,
    risks,
  };
});
```

### 5.2 Support-Bundle-Export

**lib/support-bundle.js:**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { checkDbIntegrity } from './health.js';

export function collectDiagnostics(params) {
  const files = [];

  // 1. System-Info (KEINE Kundendaten)
  const systemInfo = {
    app: params.appName,
    version: params.appVersion,
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    os: `${os.platform()} ${os.release()} (${os.arch()})`,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    userDataPath: params.userDataPath,
    dbPath: params.dbPath,
    safeMode: params.safeMode || false,
    timestamp: new Date().toISOString(),
  };

  // Speicherplatz und DB-Groesse
  try {
    const stats = fs.statfsSync(path.dirname(params.dbPath));
    systemInfo.diskFreeMB = Math.round((stats.bavail * stats.bsize) / 1024 / 1024);
  } catch (_) {}
  try {
    systemInfo.dbSizeMB = Math.round(fs.statSync(params.dbPath).size / 1024 / 1024 * 100) / 100;
  } catch (_) {}

  // WAL-Groesse
  try {
    const walPath = params.dbPath + '-wal';
    if (fs.existsSync(walPath)) {
      systemInfo.walSizeMB = Math.round(fs.statSync(walPath).size / 1024 / 1024 * 100) / 100;
    }
  } catch (_) {}

  files.push({ name: 'system-info.json', content: JSON.stringify(systemInfo, null, 2) });

  // 2. DB-Integritaetspruefung
  try {
    const integrity = checkDbIntegrity(params.db);
    files.push({ name: 'integrity-check.json', content: JSON.stringify(integrity, null, 2) });
  } catch (_) {}

  // 3. Schema-Version
  try {
    const meta = params.db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    files.push({ name: 'schema-meta.json', content: JSON.stringify(meta, null, 2) });
  } catch (_) {}

  // 4. Log-Dateien (die letzten 2, max 500 KB pro Datei)
  try {
    const logFiles = fs.readdirSync(params.logDir)
      .filter(f => f.startsWith('app') && f.endsWith('.log'))
      .sort().slice(0, 2);
    for (const f of logFiles) {
      const content = fs.readFileSync(path.join(params.logDir, f), 'utf-8');
      files.push({ name: f, content: content.slice(-500 * 1024) });
    }
  } catch (_) {}

  // 5. Backup-Uebersicht (nur Metadaten, keine Inhalte)
  try {
    const backups = fs.readdirSync(params.backupDir)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const stat = fs.statSync(path.join(params.backupDir, f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      });
    files.push({ name: 'backups.json', content: JSON.stringify(backups, null, 2) });
  } catch (_) {}

  // 6. Update-Status (falls vorhanden)
  try {
    const updateState = path.join(params.userDataPath, 'update-state.json');
    if (fs.existsSync(updateState)) {
      files.push({ name: 'update-state.json', content: fs.readFileSync(updateState, 'utf-8') });
    }
  } catch (_) {}

  // 7. Storage-Risiken
  try {
    const risks = require('./health.js').checkStorageRisks(params.dbPath);
    if (risks.length > 0) {
      files.push({ name: 'storage-risks.json', content: JSON.stringify(risks, null, 2) });
    }
  } catch (_) {}

  // 8. Letzter bekannter Fehler (ueberlebt Crashes)
  let lastError = null;
  try {
    const lastErrorPath = path.join(params.userDataPath, 'last-error.json');
    if (fs.existsSync(lastErrorPath)) {
      lastError = JSON.parse(fs.readFileSync(lastErrorPath, 'utf-8'));
      files.push({ name: 'last-error.json', content: JSON.stringify(lastError, null, 2) });
    }
  } catch (_) {}

  // 9. Letzte Fehler aus dem Log extrahieren (nur Codes + Timestamps)
  let recentErrors = [];
  try {
    const logFile = path.join(params.logDir, 'app.log');
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf-8');
      const lines = logContent.trim().split('\n').slice(-500); // Letzte 500 Zeilen
      recentErrors = lines
        .map(line => { try { return JSON.parse(line); } catch (_) { return null; } })
        .filter(entry => entry?.data?.errorCode)
        .slice(-10) // Letzte 10 Fehler mit Code
        .map(entry => ({
          code: entry.data.errorCode,
          timestamp: entry.ts,
          component: entry.component,
        }));
    }
  } catch (_) {}

  // 10. case-summary.json — maschinenlesbar fuer KI-Analyse
  // Dies ist die Datei die die KI als ERSTES liest.
  const caseSummary = {
    product: params.appName,
    version: params.appVersion,
    schemaVersion: null,
    os: `${os.platform()} ${os.release()} (${os.arch()})`,
    safeMode: params.safeMode || false,

    // Aktiver Fehlerzustand
    activeErrors: lastError ? [lastError] : [],

    // Letzte Fehler aus dem Log (nur Codes + Timestamps)
    recentErrors,

    // Zustandsindikatoren
    dbIntegrity: 'unknown',
    lastBackup: null,
    backupAge: 'unknown',
    diskFreePercent: null,
    walSizeMB: null,
    updateStatus: 'unknown',

    // Risikoflags (direkt auswertbar)
    risks: {
      dataLoss: false,
      cloudSync: false,
      networkDrive: false,
      diskLow: false,
      staleBackup: false,
    },
  };

  // Zustandsindikatoren befuellen
  try {
    const meta = params.db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    caseSummary.schemaVersion = meta?.schema_version;
  } catch (_) {}

  try {
    const integrity = checkDbIntegrity(params.db);
    caseSummary.dbIntegrity = integrity.ok ? 'ok' : 'failed';
    caseSummary.risks.dataLoss = !integrity.ok;
  } catch (_) {}

  try {
    const backups = fs.readdirSync(params.backupDir)
      .filter(f => f.endsWith('.db'))
      .map(f => fs.statSync(path.join(params.backupDir, f)).mtime)
      .sort((a, b) => b - a);
    if (backups.length > 0) {
      caseSummary.lastBackup = backups[0].toISOString();
      const ageHours = (Date.now() - backups[0].getTime()) / (1000 * 60 * 60);
      caseSummary.backupAge = ageHours < 24 ? 'recent'
        : ageHours < 168 ? 'over_24h' : 'over_7d';
      caseSummary.risks.staleBackup = ageHours > 24;
    } else {
      caseSummary.backupAge = 'none';
      caseSummary.risks.staleBackup = true;
    }
  } catch (_) {}

  try {
    const stats = fs.statfsSync(path.dirname(params.dbPath));
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bavail * stats.bsize;
    caseSummary.diskFreePercent = Math.round((freeBytes / totalBytes) * 100);
    caseSummary.risks.diskLow = caseSummary.diskFreePercent < 15;
  } catch (_) {}

  try {
    const walPath = params.dbPath + '-wal';
    if (fs.existsSync(walPath)) {
      caseSummary.walSizeMB = Math.round(fs.statSync(walPath).size / 1024 / 1024 * 100) / 100;
    }
  } catch (_) {}

  try {
    const updateStatePath = path.join(params.userDataPath, 'update-state.json');
    if (fs.existsSync(updateStatePath)) {
      const us = JSON.parse(fs.readFileSync(updateStatePath, 'utf-8'));
      caseSummary.updateStatus = us.status || 'unknown';
    } else {
      caseSummary.updateStatus = 'current';
    }
  } catch (_) {}

  // Storage-Risiken in Summary eintragen
  try {
    const { checkStorageRisks } = require('./health.js');
    const storageRisks = checkStorageRisks(params.dbPath);
    for (const r of storageRisks) {
      if (r.type === 'cloud-sync') caseSummary.risks.cloudSync = true;
      if (r.type === 'network-path') caseSummary.risks.networkDrive = true;
    }
  } catch (_) {}

  files.push({ name: 'case-summary.json', content: JSON.stringify(caseSummary, null, 2) });

  return { files };
}
```

#### Split-Bundle-Konzept (siehe ki-support-architektur-dsgvo.md)

Das Support-Bundle wird in zwei Varianten erzeugt:

**A. Lokales Vollbundle** — Nur auf dem Kundensystem, nie automatisch extern.
Enthaelt vollstaendige Logs, lokale Diagnose, Health-Check-Details, Recovery-Daten.

**B. KI-Support-Bundle** — Cloud-tauglich, bewusst klein, DSGVO-konform.
Enthaelt nur: `case-summary.json`, `diagnosis.md`, `log-signatures.json`,
`risk-assessment.json`, `recovery-options.json`.

Die Trennung erfolgt durch `lib/support-sanitizer.js` (Pflichtmodul):
- Klasse-A-Daten (personenbezogen): nie exportiert
- Klasse-B-Daten (Rohlogs, SQL): nur lokal analysiert
- Klasse-C-Daten (Fehlercodes, Versionen, Risiken): nach Sanitizing cloud-faehig

```javascript
// lib/support-sanitizer.js — Kern-API (Entwurf)
export function sanitizePath(rawPath) { /* <USER_PATH>/<CLOUD_SYNC_FOLDER>/file.db */ }
export function sanitizeLogEntry(entry) { /* Muster statt Rohtext */ }
export function extractLogSignatures(logEntries) { /* ['startup_ok', 'db_open_ok', ...] */ }
export function createKiBundle(fullBundle) { /* Klasse-C-only Bundle */ }
```

**"Technische Infos kopieren"-Button:** Kompaktformat fuer telefonischen Support
(2 Zeilen, vorlesbar). Verwendet `formatCompactInfo()` aus `error-codes.js`:

```
MitgliederSimple 0.5.0 | Win10-19045 | Schema v7 | CF-DB-002
Backup: 2026-04-14 | DB: 12.3 MB | Platte: 2.1 GB frei
```

Kopiert in die Zwischenablage. Der Kunde kann die zwei Zeilen vorlesen — der Support
(Mensch oder KI) erkennt sofort Produkt, Version, Fehlercode und Zustand.
in die Zwischenablage — fuer Nutzer die telefonisch Support anfragen.

### 5.3 "Ueber diese App"-Dialog

Version, Build-Datum, Lizenzstatus, DB-Pfad, DB-Groesse, Speicherort-Status,
letztes Backup (Datum/Groesse), Betriebssystem.

Spart 2 Minuten pro Support-Fall.

### 5.4 Fehlertexte in Nutzersprache

Alle Fehlermeldungen auf Deutsch. Technische Details nur im Log.

Dialog: "Die Datenbank konnte nicht geoeffnet werden. [ERR-DB-001]"
Log: `{ level: "error", component: "db", error: "SQLITE_BUSY", errorId: "ERR-DB-001" }`

---

## 6. Backup, Restore und Datenexport

### 6.1 Automatisches Backup

- Bei jedem App-Start, wenn letztes Backup > 24h alt
- Vor jeder Schema-Migration (Pflicht)
- Nutzt SQLite Online-Backup API (`db.backup()`)
- Gespeichert unter `userData/backups/`
- Rotation: konfigurierbar (Default: 7 taeglich, 4 woechentlich, 12 monatlich)

### 6.2 Backup-Validierung

**Nicht nur Dateigroesse > 0, sondern echte Validierung:**

```javascript
// In lib/backup-core.js
export function validateBackup(Database, backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { valid: false, reason: 'Datei nicht gefunden' };
    }

    const stat = fs.statSync(backupPath);
    if (stat.size === 0) {
      return { valid: false, reason: 'Datei ist leer' };
    }

    // Backup oeffnen und Integritaet pruefen
    const db = new Database(backupPath, { readonly: true });
    const check = db.pragma('integrity_check');
    const ok = check.length === 1 && check[0].integrity_check === 'ok';

    // Schema-Version lesen
    let meta = null;
    try {
      meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    } catch (_) {}

    db.close();

    return {
      valid: ok,
      size: stat.size,
      schemaVersion: meta?.schema_version,
      appVersion: meta?.app_version,
      reason: ok ? 'OK' : 'Integritaetspruefung fehlgeschlagen',
    };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}
```

**Backup-Metadaten:** Jedes Backup speichert zusaetzlich eine `.meta.json`:
```json
{
  "appVersion": "0.4.0",
  "schemaVersion": 5,
  "timestamp": "2026-03-06T14:30:00Z",
  "validated": true,
  "dbSizeBytes": 1048576
}
```

**In Backup-Liste anzeigen:** "geprueft" / "ungeprueft" je Backup.

### 6.3 Manuelles Backup und Restore

**Menue "Daten sichern":** Export an frei waehlbaren Ort.
**Menue "Daten wiederherstellen":** Liste mit Validierungsstatus.

**Restore-Ablauf:**
1. Immer zuerst Backup der aktuellen DB erstellen
2. Validierung des gewaehlten Backups (oeffnen + integrity_check)
3. Versionskompatibilitaet pruefen (Schema-Version im Backup)
4. Restore durchfuehren (WAL/SHM loeschen)
5. DB oeffnen + erneuter Health-Check
6. Abschlussbericht: erfolgreich / fehlgeschlagen / Support-Export anbieten

### 6.4 Datenexport / Umzug auf neuen Rechner

Export erzeugt Verzeichnis mit:
- DB-Datei (vollstaendig)
- Logo-Dateien (falls vorhanden)
- `export-meta.json` (App-Version, Schema-Version, Exportdatum)

Import auf neuem Rechner:
- App starten → "Vorhandene Daten importieren?" beim Erststart
- Versionskompatibilitaet pruefen
- DB + Dateien kopieren
- Health-Check nach Import

### 6.5 DB-Export (Datensouveraenitaet)

Separater Export der reinen DB-Datei — "Ihre Daten gehoeren Ihnen".

---

## 7. Code-Signierung und Distribution

### 7.1 EV Code Signing via Cloud HSM

**Geplant:** Extended Validation Certificate mit Cloud HSM.
Private Key verlaesst nie das HSM. CI/CD-faehig.

**Vorteile Cloud HSM:**
- Kein physischer USB-Token (Verlust-Risiko, Einzel-Rechner-Bindung)
- CI/CD-faehig (Signierung in Build-Pipeline)
- Audit-Log aller Signierungen
- Skaliert auf mehrere Produkte

**Anbieter (Stand 2026):** SSL.com eSigner, DigiCert KeyLocker, SignPath.io

### 7.2 SmartScreen-Reputation

Unsignierter Installer → "Unbekannter Herausgeber" → 10-30% Abbruch.
EV Certificate eliminiert das nach kurzer Aufbauphase.

### 7.3 Installer-Repair (NSIS)

**Problem:** Beschaedigte Installation (DLL geloescht, AV-Quarantaene, Update abgebrochen).

**Loesung:** NSIS Installer bietet drei Modi:
1. **Installieren** — Neuinstallation
2. **Reparieren** — Alle App-Dateien neu schreiben, Daten behalten
3. **Deinstallieren** — mit Daten-Option (siehe 7.5)

```nsis
; In electron-builder custom NSIS script
!define MUI_COMPONENTSPAGE_NODESC
!insertmacro MUI_PAGE_COMPONENTS

Section "Reparieren" SEC_REPAIR
  ; Alle App-Dateien ueberschreiben
  ; userData/backups/ und userData/*.db NICHT anfassen
  SetOverwrite on
  ; ... normale Installation ...
SectionEnd
```

### 7.4 Installer-Logs

NSIS Installer schreibt Log unter `%TEMP%\MitgliederSimple-Setup.log`.
Enthaelt: installierte Dateien, Fehler, Warnungen.
Wird vom Support-Bundle erfasst (falls vorhanden).

### 7.5 Deinstallation mit Datenbereinigung

- "Nur Software entfernen" (Default) — Daten bleiben in `userData`
- "Software und alle Daten entfernen" — loescht auch `userData`

Default schuetzt vor versehentlichem Datenverlust.

---

## 8. Auto-Update mit Rollback

### 8.1 Architektur

`electron-updater` gegen statischen Fileserver. Essentiell fuer Support-Abo (29 EUR/Jahr).

**Ablauf:**
1. App prueft beim Start auf Updates (nach 10s Verzoegerung)
2. Download im Hintergrund
3. Nutzer entscheidet: "Jetzt" oder "Beim naechsten Start"
4. Kein erzwungener Restart

### 8.2 Update-Rollback

**Problem:** Update auf Version N+1 installiert, App startet nicht.
Ohne Rollback sitzt der Nutzer fest.

**Strategie: Persistenter Update-Status**

```javascript
// Update-Status-Datei: userData/update-state.json
{
  "previousVersion": "0.4.0",
  "currentVersion": "0.5.0",
  "updateDate": "2026-03-06T14:30:00Z",
  "status": "installed",  // "downloading" | "installed" | "verified" | "rolled-back"
  "previousInstallerPath": null  // Pfad zum vorherigen Installer (falls gespeichert)
}
```

**Rollback-Mechanismus:**

```javascript
// In main.js — nach Update
function checkUpdateHealth() {
  const statePath = path.join(app.getPath('userData'), 'update-state.json');
  if (!fs.existsSync(statePath)) return;

  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

  if (state.status === 'installed') {
    // Erstes Start nach Update — als "verified" markieren wenn alles gut laeuft
    // Wird nach 60 Sekunden erfolgreichem Betrieb auf "verified" gesetzt
    setTimeout(() => {
      state.status = 'verified';
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      logInfo('update', 'Update als stabil verifiziert', { version: state.currentVersion });
    }, 60_000);
  }
}
```

**Bei Crash nach Update:**
1. Safe Mode erkennt Crash (startup-marker)
2. Update-State zeigt `status: "installed"` (nicht "verified")
3. Recovery-Center bietet an: "Letzte stabile Version wiederherstellen"
4. Rollback: Vorheriges Backup der DB + Hinweis "Bitte installieren Sie Version X.Y.Z erneut"

**Fuer vollstaendigen App-Rollback (spaeter):**
Vorherige Installer-Version lokal behalten (`userData/previous-installer/`).
Bei Rollback: Installer der Vorversion automatisch starten.

### 8.3 Update-Server

Statischer Fileserver mit:
```
/updates/
  latest.yml
  MitgliederSimple-Setup-0.5.0.exe
  MitgliederSimple-Setup-0.5.0.exe.blockmap
```

### 8.4 Sicherheit bei Updates

- Installer ist Code-signiert (EV Certificate)
- `electron-updater` prueft Signatur automatisch
- Backup vor Migration nach Update (automatisch)
- Nutzer kann Update verschieben

---

## 9. Paket-Details

### @codefabrik/electron-platform

**app.config.js (pro Produkt):**
```javascript
export default {
  name: 'MitgliederSimple',
  dbName: 'mitglieder.db',
  windowTitle: 'MitgliederSimple — Mitgliederverwaltung',
  width: 1024,
  height: 768,
  identifier: 'de.detmers-publish.mitglieder-lokal',
  autoUpdate: false,
  updateUrl: null,
  backupRotation: {
    daily: 7,
    weekly: 4,
    monthly: 12,
  },
};
```

**main.js (Plattform) — vollstaendige Startup-Sequenz:**
```javascript
import { app, BrowserWindow, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { initLogger, logInfo, logError, logWarn, logCritical } from './lib/logger.js';
import { checkWritable, checkDiskSpace, checkStorageRisks,
         checkInstallIntegrity, checkDbIntegrity, checkResourceLimits } from './lib/health.js';
import { openDbWithRetry, attemptDbRepair } from './lib/recovery.js';
import { createBackup, isBackupNeeded, validateBackup } from './lib/backup-core.js';
import { registerDbHandlers } from './ipc/db.js';
import { registerBackupHandlers } from './ipc/backup.js';
import { registerDialogHandlers } from './ipc/dialog.js';
import { registerFsHandlers } from './ipc/fs.js';
import { registerUpdateHandlers } from './ipc/update.js';
import { registerSupportHandlers } from './ipc/support.js';

export function createApp(config) {
  // 1. Single-Instance-Lock
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) { app.quit(); return; }

  let mainWindow = null;
  const safeMode = process.argv.includes('--safe-mode');

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Crash-Handler (frueh registrieren)
  process.on('uncaughtException', (err) => {
    logCritical('crash', 'Unbehandelte Exception', { message: err.message, stack: err.stack });
    dialog.showErrorBox('Unerwarteter Fehler',
      `Die Anwendung hat einen Fehler festgestellt.\n\n` +
      `Bitte exportieren Sie die Diagnosedaten (Hilfe → Diagnose).\n\n` +
      `[ERR-APP-001] ${err.message}`);
  });
  process.on('unhandledRejection', (reason) => {
    logCritical('crash', 'Unbehandelte Promise-Rejection', {
      message: reason?.message || String(reason), stack: reason?.stack });
  });

  app.whenReady().then(() => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, config.dbName);
    const logDir = path.join(userDataPath, 'logs');
    const backupDir = path.join(userDataPath, 'backups');
    const markerPath = path.join(userDataPath, '.startup-marker');

    // 2. Logger initialisieren
    initLogger(logDir);
    logInfo('app', `${config.name} v${app.getVersion()} gestartet`, {
      platform: `${process.platform} ${process.arch}`,
      electron: process.versions.electron,
      safeMode,
    });

    // 3. Crash-Erkennung (vorheriger Start nicht sauber beendet?)
    const previousCrash = fs.existsSync(markerPath);
    if (previousCrash && !safeMode) {
      logWarn('app', 'Vorheriger Start nicht sauber beendet — Safe Mode empfohlen');
    }
    fs.writeFileSync(markerPath, new Date().toISOString());

    // 4. App-Selbsttest
    const installCheck = checkInstallIntegrity(app.getAppPath());
    if (!installCheck.ok) {
      logCritical('health', 'Installation beschaedigt', { missing: installCheck.missing });
      dialog.showErrorBox('Installation beschaedigt', installCheck.message +
        '\n\n[ERR-INST-001] Bitte fuehren Sie eine Reparaturinstallation durch.');
      app.quit();
      return;
    }

    // 5. userData beschreibbar?
    const writable = checkWritable(userDataPath);
    if (!writable.ok) {
      logCritical('health', 'userData nicht beschreibbar');
      dialog.showErrorBox('Anwendung kann nicht gestartet werden',
        `[ERR-FS-001] ${writable.message}`);
      app.quit();
      return;
    }

    // 6. Speicherplatz
    const disk = checkDiskSpace(userDataPath, 300 * 1024 * 1024); // 300 MB minimum
    if (!disk.ok) {
      dialog.showErrorBox('Nicht genuegend Speicherplatz',
        `[ERR-FS-002] ${disk.message}`);
      app.quit();
      return;
    }
    if (disk.warning) {
      logWarn('health', disk.message);
    }

    // 7. Storage-Risiken (Cloud-Sync, Netzlaufwerk)
    const risks = checkStorageRisks(dbPath);
    for (const risk of risks) {
      logWarn('health', risk.message, { type: risk.type });
      if (risk.severity === 'high') {
        dialog.showMessageBoxSync({
          type: 'warning', title: 'Hinweis zur Datensicherheit',
          message: risk.message + '\n\nEmpfehlung: Datenbank in einen lokalen Ordner verschieben.',
          buttons: ['Verstanden'],
        });
      }
    }

    // 8. DB oeffnen (mit Lock-Recovery)
    let db;
    try {
      db = openDbWithRetry(Database, dbPath);
    } catch (err) {
      logCritical('db', 'DB nicht oeffenbar', { error: err.message });
      const choice = dialog.showMessageBoxSync({
        type: 'error', title: 'Datenbankfehler',
        message: `Die Datenbank konnte nicht geoeffnet werden.\n\n[ERR-DB-001] ${err.message}`,
        buttons: ['Reparatur versuchen', 'Im abgesicherten Modus starten', 'Beenden'],
        defaultId: 0, cancelId: 2,
      });
      if (choice === 0) {
        const repair = attemptDbRepair(Database, dbPath, backupDir, config.dbName);
        if (repair.repaired) {
          db = openDbWithRetry(Database, dbPath);
        } else {
          dialog.showErrorBox('Reparatur fehlgeschlagen',
            'Automatische Reparatur nicht moeglich. Bitte starten Sie im abgesicherten Modus.');
          app.quit();
          return;
        }
      } else if (choice === 1) {
        // Safe Mode — weiter ohne DB
      } else {
        app.quit();
        return;
      }
    }

    // 9. Health-Check
    if (db && !safeMode) {
      const health = checkDbIntegrity(db);
      if (!health.ok) {
        logError('health', 'Integritaetspruefung fehlgeschlagen');
        const choice = dialog.showMessageBoxSync({
          type: 'error', title: 'Datenbankproblem erkannt',
          message: 'Die Datenbank weist Inkonsistenzen auf.\n\n' +
            'Empfehlung: Automatische Reparatur versuchen.',
          buttons: ['Reparatur versuchen', 'Backup wiederherstellen', 'Trotzdem starten', 'Beenden'],
          defaultId: 0, cancelId: 3,
        });
        if (choice === 0) {
          db.close();
          const repair = attemptDbRepair(Database, dbPath, backupDir, config.dbName);
          if (repair.repaired) db = openDbWithRetry(Database, dbPath);
        }
        if (choice === 3) { app.quit(); return; }
      }

      // Ressourcenlimits
      const warnings = checkResourceLimits(dbPath);
      for (const w of warnings) { logWarn('health', w.message, { type: w.type }); }
    }

    // 10. Automatisches Backup
    if (db && !safeMode && isBackupNeeded(backupDir, config.dbName)) {
      try {
        const backup = createBackup(db, backupDir, config.dbName);
        logInfo('backup', 'Automatisches Backup erstellt', { path: backup.path, size: backup.size });
      } catch (err) {
        logWarn('backup', 'Automatisches Backup fehlgeschlagen', { error: err.message });
      }
    }

    // 11. IPC-Handler registrieren
    registerDbHandlers(config, db);
    registerBackupHandlers(config);
    registerDialogHandlers();
    registerFsHandlers();
    registerUpdateHandlers(config);
    registerSupportHandlers(config);

    // 12. Splash-Screen
    const splash = new BrowserWindow({
      width: 400, height: 200, frame: false, alwaysOnTop: true, show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    splash.loadFile(path.join(__dirname, 'splash.html'));

    // 13. Hauptfenster
    mainWindow = new BrowserWindow({
      width: config.width, height: config.height, title: config.windowTitle,
      show: false, // Erst zeigen wenn bereit
      webPreferences: {
        preload: new URL('./preload.cjs', import.meta.url).pathname,
        contextIsolation: true, nodeIntegration: false,
      },
    });

    // Renderer-Timeout
    const rendererTimeout = setTimeout(() => {
      logError('app', 'Renderer-Timeout (15s)');
      splash.close();
      mainWindow.loadFile(path.join(__dirname, 'error.html'));
      mainWindow.show();
    }, 15_000);

    ipcMain.handle('app:rendererReady', () => {
      clearTimeout(rendererTimeout);
      splash.close();
      mainWindow.show();
      logInfo('app', 'Renderer bereit');
    });

    ipcMain.handle('app:isSafeMode', () => safeMode || previousCrash);

    if (safeMode || previousCrash) {
      mainWindow.loadFile(path.join(__dirname, 'recovery.html'));
      splash.close();
      mainWindow.show();
    } else if (process.argv.includes('--dev')) {
      splash.close();
      mainWindow.loadURL('http://localhost:1420');
      mainWindow.show();
    } else {
      mainWindow.loadFile('dist/index.html');
    }

    logInfo('app', 'Startup-Sequenz abgeschlossen');
  });

  app.on('before-quit', () => {
    // Startup-Marker loeschen (sauberer Shutdown)
    try { fs.unlinkSync(path.join(app.getPath('userData'), '.startup-marker')); } catch (_) {}
    logInfo('app', 'Sauberes Herunterfahren');
  });

  app.on('window-all-closed', () => app.quit());
}
```

**preload.cjs:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Datenbank ---
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbExecute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  dbMigrate: (schemaVersion, appVersion, migrations) =>
    ipcRenderer.invoke('db:migrate', schemaVersion, appVersion, migrations),

  // --- Backup ---
  backupCreate: () => ipcRenderer.invoke('backup:create'),
  backupList: () => ipcRenderer.invoke('backup:list'),
  backupRestore: (backupPath) => ipcRenderer.invoke('backup:restore', backupPath),
  exportDb: (targetPath) => ipcRenderer.invoke('backup:exportDb', targetPath),
  exportUserData: (targetPath) => ipcRenderer.invoke('backup:exportUserData', targetPath),
  importUserData: (archivePath) => ipcRenderer.invoke('backup:importUserData', archivePath),

  // --- Dialoge ---
  openFileDialog: (opts) => ipcRenderer.invoke('dialog:openFile', opts),
  saveFileDialog: (opts) => ipcRenderer.invoke('dialog:saveFile', opts),

  // --- Dateisystem ---
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),

  // --- Recovery-Center ---
  recoveryCheckDb: () => ipcRenderer.invoke('recovery:checkDb'),
  recoveryRepairDb: () => ipcRenderer.invoke('recovery:repairDb'),
  recoveryGetStatus: () => ipcRenderer.invoke('recovery:getStatus'),

  // --- App-Info und Support ---
  getAppInfo: () => ipcRenderer.invoke('support:getAppInfo'),
  exportSupportBundle: (targetPath) => ipcRenderer.invoke('support:exportBundle', targetPath),

  // --- Logging (Renderer → Main) ---
  logRendererError: (error) => ipcRenderer.invoke('log:rendererError', error),

  // --- App-Status ---
  rendererReady: () => ipcRenderer.invoke('app:rendererReady'),
  isSafeMode: () => ipcRenderer.invoke('app:isSafeMode'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  // --- Auto-Update ---
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  onUpdateAvailable: (cb) => { ipcRenderer.on('update:available', (_e, info) => cb(info)); },
  onUpdateDownloaded: (cb) => { ipcRenderer.on('update:downloaded', (_e, info) => cb(info)); },
  installUpdate: () => ipcRenderer.invoke('update:install'),

  // --- Migration Fortschritt ---
  onMigrationProgress: (cb) => { ipcRenderer.on('migration:progress', (_e, p) => cb(p)); },
});
```

**lib/db-core.js (testbare Kernlogik):**

```javascript
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

let db = null;

export function openDb(dbPath, options = {}) {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);

    // SQLCipher (Phase 2)
    // if (options.encryptionKey) { db.pragma(`key = '${options.encryptionKey}'`); }

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

export function closeDb() {
  if (db) {
    try { db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch (_) {}
    db = null;
  }
}

export function getDb() {
  if (!db) throw new Error('DB nicht geoeffnet. Rufe openDb() auf.');
  return db;
}

export function setDb(instance) { db = instance; }

export function dbQuery(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

export function dbExecute(sql, params = []) {
  const r = getDb().prepare(sql).run(...params);
  return { lastInsertId: Number(r.lastInsertRowid), rowsAffected: r.changes };
}

export function dbMigrate(targetSchemaVersion, appVersion, migrations, backupVerified) {
  const conn = getDb();

  conn.exec(`CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 0,
    app_version TEXT NOT NULL DEFAULT '0.0.0',
    last_migration TEXT,
    event_replay_at TEXT
  )`);
  conn.exec(`INSERT OR IGNORE INTO _schema_meta (id, schema_version, app_version)
    VALUES (1, 0, '0.0.0')`);

  const meta = conn.prepare('SELECT schema_version, app_version FROM _schema_meta WHERE id = 1').get();
  const dbVersion = meta.schema_version;

  if (dbVersion === targetSchemaVersion) {
    return { status: 'current', version: dbVersion };
  }

  if (dbVersion > targetSchemaVersion) {
    throw new Error(
      `Die Datenbank (Schema v${dbVersion}) ist neuer als die App (Schema v${targetSchemaVersion}). ` +
      `Bitte aktualisieren Sie die Software.`);
  }

  const gap = targetSchemaVersion - dbVersion;

  if (gap > 3) {
    return {
      status: 'replay_required', from: dbVersion, to: targetSchemaVersion,
      message: `Versionssprung ${dbVersion} → ${targetSchemaVersion} (${gap} Versionen). Event-Replay wird ausgefuehrt.`
    };
  }

  if (!backupVerified) {
    throw new Error('Migration ohne verifiziertes Backup nicht erlaubt.');
  }

  const pending = migrations
    .filter(m => m.version > dbVersion && m.version <= targetSchemaVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    conn.prepare(`UPDATE _schema_meta SET schema_version = ?, app_version = ?,
      last_migration = datetime('now') WHERE id = 1`).run(targetSchemaVersion, appVersion);
    return { status: 'migrated', from: dbVersion, to: targetSchemaVersion, steps: 0 };
  }

  const tx = conn.transaction(() => {
    for (const migration of pending) {
      for (const stmt of migration.statements) { conn.exec(stmt); }
    }
    conn.prepare(`UPDATE _schema_meta SET schema_version = ?, app_version = ?,
      last_migration = datetime('now') WHERE id = 1`).run(targetSchemaVersion, appVersion);
  });
  tx();

  return { status: 'migrated', from: dbVersion, to: targetSchemaVersion, steps: pending.length };
}
```

### @codefabrik/shared

```json
{
  "exports": {
    "./license": "./src/license/index.js",
    "./db": "./src/db/index.js",
    "./audit-log": "./src/audit-log/index.js",
    "./crypto": "./src/crypto/index.js",
    "./csv": "./src/csv/index.js"
  }
}
```

**src/db/index.js (injizierbares Backend):**
```javascript
let backend = null;

export function setBackend(b) { backend = b; }

function getBackend() {
  if (!backend) {
    if (typeof window !== 'undefined' && window.electronAPI) {
      backend = window.electronAPI;
    } else {
      throw new Error('DB backend nicht initialisiert. Rufe setBackend() auf.');
    }
  }
  return backend;
}

export async function openDb() { /* No-op: DB lebt im Main Process */ }
export async function query(sql, params = []) { return getBackend().dbQuery(sql, params); }
export async function execute(sql, params = []) { return getBackend().dbExecute(sql, params); }
export async function migrate(schemaVersion, appVersion, migrations) {
  return getBackend().dbMigrate(schemaVersion, appVersion, migrations);
}
```

**Produkt-Einstiegspunkt (2 Zeilen):**
```javascript
import { createApp } from '@codefabrik/electron-platform';
import config from './app.config.js';
createApp(config);
```

---

## 10. Migration: Was aendert sich im Produkt?

### Dateien die NICHT geaendert werden

- `src/routes/*.svelte` (ausser Settings.svelte)
- `src/lib/pdf.js`, `pdf-lists.js`, `pdf-mahnbrief.js`
- `src/lib/stores/*.js`

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/lib/db.js` | Imports aus `@codefabrik/shared/db` + `shared/audit-log` |
| `src/lib/db.js` | Migrationen als exportiertes Array |
| `src/lib/crypto.js` | Geloescht (lebt in shared/crypto) |
| `src/lib/csv.js` | Geloescht (lebt in shared/csv) |
| `src/routes/Settings.svelte` | Tauri → window.electronAPI |
| `src/App.svelte` | `setBackend()` + `migrate()` + `rendererReady()` |
| `package.json` | workspace-Deps |
| `tests/helpers/mock-sql.js` | `createMockBackend()` |

### Neue Dateien

| Datei | Zweck |
|---|---|
| `app.config.js` | Produkt-Konfiguration |
| `electron-main.js` | Einstiegspunkt (2 Zeilen) |
| `electron-builder.yml` | Build-Konfiguration |

### Geloeschte Dateien

| Datei | Grund |
|---|---|
| `src-tauri/` | Durch electron-platform ersetzt |
| `app-shared/` (eingebettet) | Wird Paket unter packages/ |

---

## 11. pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'products/*'
```

```json
{
  "name": "@codefabrik/mitglieder-lokal",
  "dependencies": {
    "@codefabrik/electron-platform": "workspace:*",
    "@codefabrik/shared": "workspace:*",
    "@codefabrik/app-shared": "workspace:*",
    "pdfmake": "^0.2.0"
  }
}
```

---

## 12. Build + CI/CD

```yaml
name: Build & Test
on: [push, pull_request]

jobs:
  test-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r run test

  build-windows:
    needs: test-linux
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: cd products/mitglieder-lokal && pnpm electron:build
```

---

## 13. Reihenfolge der Umsetzung

### Phase 1: Monorepo + Plattform-Kern

1. `pnpm-workspace.yaml`
2. `packages/shared/` — db (setBackend), audit-log, crypto, csv
3. `packages/electron-platform/` — Main, Preload, alle lib/-Module, alle IPC-Handler
4. `packages/app-shared/` — Svelte-Components
5. Plattform-Tests: db-core, backup-core, logger, health, recovery, support-bundle

### Phase 2: MitgliederSimple umbauen

6. `package.json` auf workspace-Deps
7. Imports anpassen
8. `app.config.js` + `electron-main.js`
9. `setBackend()` + `rendererReady()` in App.svelte
10. Tests (alle 74 muessen bestehen)
11. `src-tauri/` entfernen

### Phase 3: Betriebsstabilitaet + Build

12. `electron-builder.yml` + Icons
13. Splash-Screen, Error-Page, Recovery-Page
14. Recovery-Center UI (Hilfe → Diagnose)
15. Safe Mode (`--safe-mode` + Crash-Erkennung)
16. "Ueber diese App"-Dialog
17. Lokal testen: alle Startup-Sequenz-Schritte
18. Windows-Installer bauen + auf Windows 10 testen
19. NSIS Reparaturinstallation
20. Installer-Logs

### Phase 4: Code-Signierung + Auto-Update

21. EV Certificate kaufen (Cloud HSM)
22. Signierung in CI/CD
23. Update-Server (statischer Fileserver)
24. `electron-updater` aktivieren
25. Update-Rollback-Mechanismus
26. Datenexport/Umzug-Feature
27. Signierte Installer auf Zielrechnern testen

### Phase 5: Finanz-Rechner umbauen

28. Gleiche Plattform, eigene `app.config.js` + Fachlogik

### Phase 6: SQLCipher + Erster-Start-Assistent

29. SQLCipher via `better-sqlite3-multiple-ciphers`
30. Schluessel im OS-Keystore
31. Erster-Start-Assistent
32. Optional: Opt-in Telemetrie (DSGVO-konform)

---

## 14. Entschiedene Fragen

| Frage | Entscheidung | Begruendung |
|---|---|---|
| Schema-Versionierung | `_schema_meta` (einziges System) | Kompatibilitaet mit bestehendem Code |
| Migrations-Transaktion | Eine Transaktion fuer alle Schritte | Alles oder nichts |
| Backup vor Migration | Pflicht, mit Validierung | Migration verweigert ohne verifiziertes Backup |
| DB neuer als App | Harter Stopp | Kein Downgrade |
| >3 Versionssprung | Replay-Signal | Event-Replay erzwungen |
| Backup bei App-Start | Automatisch wenn > 24h | Integritaets-Konzept |
| Backup-Validierung | Oeffnen + integrity_check + Metadaten | Nicht nur Groesse > 0 |
| DB-Export | `backup:exportDb` | Datensouveraenitaet |
| Testbare Kernlogik | Alle lib/-Module ohne Electron | IPC = duenne Schicht |
| Single-Instance-Lock | Pflicht | Verhindert DB-Korruption |
| Logging | JSON, 5 Levels, 5MB Rotation, 5 Dateien | Ohne Logs kein Support |
| Log-Levels | CRITICAL, ERROR, WARN, INFO, DEBUG | Filterbar, analysierbar |
| Crash-Reporting | Exception → Log + Dialog + Fehler-ID | Nie weisses Fenster |
| DB-Health-Check | integrity_check beim Start | Fruehe Erkennung |
| DB-Lock-Recovery | Retry mit Backoff + WAL-Cleanup | Crash-Resilienz |
| DB-Repair | VACUUM INTO → neuer integrity_check → Backup als Fallback | Automatische Reparatur |
| Safe Mode | `--safe-mode` + automatisch nach Crash | Recovery ohne Risiko |
| Recovery-Center | Hilfe → Diagnose (auch im Safe Mode) | Gefuehrter Recovery-Prozess |
| Cloud-Sync-Warnung | Erkennung + Dialog | OneDrive/Dropbox = Korruptionsrisiko |
| Netzlaufwerk-Warnung | UNC-Path-Erkennung + Dialog | SQLite auf SMB = gefaehrlich |
| Fehlermeldungen | Deutsch, Handlungsempfehlung, Fehler-ID | Technisches nur im Log |
| Support-Bundle | ZIP ohne Kundendaten + Update-Status + Risiken | Reduziert Support-Schleifen |
| Fortschrittsanzeige | IPC-Event + Sperrzustand | Nutzer beendet nicht waehrend Migration |
| Splash-Screen | Sofort nach Start | Kein "passiert nichts"-Effekt |
| Renderer-Timeout | 15s → error.html Fallback | Nie weisses Fenster |
| App-Selbsttest | Kritische Dateien beim Start pruefen | Virenscanner-/Update-Schutz |
| WAL-Checkpoints | 5min PASSIVE + Shutdown TRUNCATE | Kein WAL-Wachstum |
| Ressourcenlimits | DB-Groesse, WAL-Groesse, Speicherplatz | Fruehe Warnung |
| Code-Signierung | EV Certificate via Cloud HSM | CI/CD-faehig, SmartScreen |
| Installer-Repair | NSIS Reparaturmodus | Beschaedigte Installation behebbar |
| Installer-Logs | `%TEMP%/Setup.log` + ins Support-Bundle | Installationsprobleme diagnostizierbar |
| Auto-Update | electron-updater + statischer Fileserver | Support-Abo-Modell |
| Update-Rollback | Status-Tracking + Verify-Timer + Backup | Defektes Update reparierbar |
| Deinstallation | "Nur Software" (Default) oder "mit Daten" | Schutz vor Datenverlust |
| Datenexport/Umzug | DB + Logos + Metadaten | Haeufiges Support-Szenario |
| pnpm Workspace | `workspace:*` | electron-builder kompatibel |
| Monorepo | Ein Repo fuer alles | Ein Commit fuer Querschnittsaenderungen |
| Fehlercode-System | CF-Codes in lib/error-codes.js, konsistent in Dialog + Log + Bundle | Support-Modell-Integration |
| case-summary.json | Automatisch im Support-Bundle, KI liest zuerst | Maschinenlesbar fuer KI-Analyse |
| Error-Code-Tagging | `logCodedError()` mit CF-Code in jedem Log-Eintrag | Filterbar, analysierbar |
| last-error.json | Persistiert bei CRITICAL/ERROR, ueberlebt Crashes | Fehlerkontext fuer Bundle |
| "Technische Infos kopieren" | 2 Zeilen Kompaktformat mit CF-Code | Vorlesbar bei Telefon-Support |
| Support-Datenklassen | A (nie export), B (lokal), C (cloud nach Sanitizing) | DSGVO-Pflicht |
| Split-Bundle | Lokales Vollbundle + KI-Support-Bundle (nur Klasse C) | Datensparsamkeit |
| Sanitizing Engine | `lib/support-sanitizer.js` als Pflichtmodul | PII nie an Cloud-KI |
| Lizenzkey-Uebertragung | Nur HMAC-SHA256-Hash oder interne Fall-ID | Nie Klartext an Cloud |
| Zwei-Ebenen-KI | Ebene 1 lokal (Vollzugriff), Ebene 2 Cloud (nur sanitisiert) | DSGVO + Diagnosequalitaet |
| Predictive Health Monitor | Lokal im Produkt, keine Cloud noetig | Proaktive Warnung |

---

## 15. Architektur-Diagramm

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          Electron Main Process                                 │
│                                                                                │
│  Startup-Sequenz:                                                              │
│  Lock → Logger → Crash-Check → Selbsttest → Beschreibbar? →                  │
│  Speicherplatz? → Storage-Risiken → DB oeffnen (Retry) →                     │
│  Health-Check → (Repair?) → Backup → Migration → Fenster                     │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  lib/ (testbar ohne Electron)                                            │  │
│  │                                                                          │  │
│  │  db-core.js          backup-core.js       logger.js                      │  │
│  │  openDb, closeDb     createBackup         initLogger, log                │  │
│  │  dbQuery, dbExecute  validateBackup       5 Levels (CRITICAL..DEBUG)     │  │
│  │  dbMigrate           listBackups          JSON + Rotation                │  │
│  │  (_schema_meta,      rotateBackups                                       │  │
│  │   1 Transaktion,     isBackupNeeded       health.js                      │  │
│  │   Backup-Pflicht,                         checkDbIntegrity               │  │
│  │   Replay-Signal)     recovery.js          checkWritable                  │  │
│  │                      openDbWithRetry      checkDiskSpace                 │  │
│  │                      attemptDbRepair      checkStorageRisks              │  │
│  │                      (VACUUM INTO,        checkInstallIntegrity          │  │
│  │                       Backup-Fallback)    checkResourceLimits            │  │
│  │                                                                          │  │
│  │  support-bundle.js       support-sanitizer.js    error-codes.js           │  │
│  │  collectDiagnostics     sanitizePath             CF-Codes, getErrorInfo  │  │
│  │  (Vollbundle lokal)     extractLogSignatures     formatErrorDialog       │  │
│  │                         createKiBundle           logCodedError           │  │
│  │                         (Klasse-C-only)          formatCompactInfo       │  │
│  └──────────┬────────────────────────┬─────────────────────┬────────────────┘  │
│             │                        │                     │                    │
│  ┌──────────▼───────┐  ┌────────────▼────────┐  ┌────────▼─────────────────┐  │
│  │  ipc/db.js        │  │  ipc/backup.js       │  │  ipc/support.js          │  │
│  │  + Health-Check   │  │  + Validierung       │  │  + Recovery-Center       │  │
│  │  + Logging        │  │  + Datenexport       │  │  + Support-Bundle        │  │
│  │  + WAL-Checkpts   │  │  + Rechnerumzug      │  │  + App-Info              │  │
│  │  + Fehler-IDs     │  │  + Metadaten         │  │                          │  │
│  │                   │  │                      │  │  ipc/update.js           │  │
│  │  ipc/dialog.js    │  │                      │  │  + electron-updater      │  │
│  │  ipc/fs.js        │  │                      │  │  + Rollback-Status       │  │
│  └─────────┬─────────┘  └────────────┬─────────┘  └────────┬────────────────┘  │
│            └──────────────┬──────────┘──────────────────────┘                   │
│                           │                                                     │
│  Single-Instance       preload.cjs                        Safe Mode            │
│  Crash-Handler         contextBridge                      Startup-Marker       │
│  Splash-Screen         electronAPI {...}                  Renderer-Timeout     │
│                                                                                │
└───────────────────────────┼────────────────────────────────────────────────────┘
                            │ IPC (invoke/handle)
┌───────────────────────────┼────────────────────────────────────────────────────┐
│                           ▼           Renderer Process                          │
│                                                                                │
│  ┌──────────────────────────────────────────┐                                  │
│  │  @codefabrik/shared/db + audit-log       │                                  │
│  │  setBackend(window.electronAPI)          │                                  │
│  └──────────────────┬───────────────────────┘                                  │
│                     │                                                           │
│  ┌──────────────────▼───────────────────────┐                                  │
│  │  Produkt-Code (Svelte 5)                  │                                  │
│  │  db.js, routes/, pdf, csv, stores         │                                  │
│  └──────────────────┬───────────────────────┘                                  │
│                     │                                                           │
│  ┌──────────────────▼───────────────────────┐                                  │
│  │  Plattform-UI-Elemente:                   │                                  │
│  │  - Recovery-Center (Hilfe → Diagnose)    │                                  │
│  │  - "Ueber diese App"-Dialog              │                                  │
│  │  - Backup/Restore-Dialog                 │                                  │
│  │  - Datenexport/Import                    │                                  │
│  │  - Support-Bundle-Export                 │                                  │
│  │  - Update-Benachrichtigung               │                                  │
│  │  - Migrations-Fortschritt                │                                  │
│  │  - error.html (Fallback)                 │                                  │
│  │  - recovery.html (Safe Mode)             │                                  │
│  └───────────────────────────────────────────┘                                  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Abgleich mit Integritaets-Konzept

| Anforderung | Umsetzung | Status |
|---|---|---|
| `_schema_meta` | Einziges System in db-core.js | Kompatibel |
| Migration <= 3 inkrementell | Eine Transaktion | Kompatibel |
| Migration > 3 → Replay | `replay_required` Signal | Kompatibel |
| DB neuer → Stopp | Error mit Nutzer-Meldung | Kompatibel |
| Backup bei Start (> 24h) | isBackupNeeded + createBackup | Kompatibel |
| Backup vor Migration | Pflicht + Validierung | Kompatibel |
| Backup-Rotation | Konfigurierbar | Kompatibel |
| Backup-Wiederherstellung | restore + Sicherheitskopie + Health-Check | Kompatibel |
| Event-Log append-only | shared/audit-log | Kompatibel |
| HMAC-Hash-Kette | shared/crypto | Kompatibel |
| SQLCipher | Platzhalter in openDb() | Vorbereitet |
| 7 Testkategorien | Produkt + Plattform-Tests | Kompatibel |
| Fixtures pro Release | Pipeline bleibt | Kompatibel |
| Code-Signing | EV via Cloud HSM | Geplant |
| WAL-Modus | Pragma + periodische Checkpoints | Kompatibel |

---

## 17. Abgleich mit externen Reviews

### Review 1: Grundarchitektur (adressiert in v3)

| Befund | Status |
|---|---|
| Kein Logging | lib/logger.js mit 5 Levels + Rotation |
| Kein Fehler-Recovery bei DB | Health-Check + Fehlerdialoge |
| Kein Backup/Restore | Automatisch + manuell + Datenexport |
| Keine Code-Signierung | Cloud HSM geplant |
| Kein Datenexport/Umzug | Export/Import mit Metadaten |
| OneDrive/Cloud-Sync | Erkennung + Warnung |
| Mehrfachstart | Single-Instance-Lock |
| Fehlende Version-Info | "Ueber diese App" |

### Review 2: Katastrophenfestigkeit (adressiert in v4)

| Befund | Status |
|---|---|
| Installer-Recovery | NSIS Reparaturmodus + Installer-Logs |
| Update-Rollback | Status-Tracking + Verify-Timer |
| Safe Mode | `--safe-mode` + automatisch nach Crash |
| DB-Repair | VACUUM INTO + Backup-Fallback |
| Recovery-UI | Recovery-Center unter Hilfe → Diagnose |
| Netzlaufwerk-Erkennung | UNC-Path-Check in health.js |
| DB-Lock-Recovery | Retry mit Backoff + WAL-Cleanup |
| Ressourcenlimits | DB/WAL-Groesse + Speicherplatz-Warnung |
| Strukturierte Log-Levels | 5 Levels: CRITICAL..DEBUG |
| Backup-Validierung | Oeffnen + integrity_check + Metadaten |
| Renderer-Timeout | 15s → error.html Fallback |
| App-Selbsttest | Kritische Dateien beim Start pruefen |
| Splash-Screen | Sofort nach Start |
| Fehlercode-System | CF-Codes in error-codes.js, konsistent in Dialog + Log + Bundle |

### Review 3: KI-Support-Integration (adressiert in v5)

| Befund | Status |
|---|---|
| Fehlercode-System fehlt als Datenstruktur | `lib/error-codes.js` mit CF-Codes, getErrorInfo(), formatErrorDialog() |
| Support-Bundle braucht case-summary.json | Automatisch generiert in collectDiagnostics() — KI liest diese Datei zuerst |
| Logger braucht Error-Code-Tagging | `logCodedError()` mit errorCode-Feld in jedem Log-Eintrag |
| Kein letzter Fehler der Sessions ueberlebt | `last-error.json` in userData, persistiert bei CRITICAL/ERROR |
| "Technische Infos kopieren" Format undefiniert | `formatCompactInfo()` — 2 Zeilen, vorlesbar, mit CF-Code |

**Kette geschlossen:** Fehler entsteht → wird mit CF-Code getaggt → wird geloggt →
landet im Bundle mit case-summary → KI liest Summary → klassifiziert →
antwortet oder eskaliert.

### Review 4: DSGVO-sichere KI-Support-Architektur (adressiert in v6)

| Befund | Status |
|---|---|
| Keine Datenklassifikation fuer Support-Export | 3 Klassen: A (nie), B (lokal), C (cloud nach Sanitizing) |
| Support-Bundle enthielt potentiell PII | Split-Bundle: Vollbundle lokal, KI-Bundle nur Klasse C |
| Keine Sanitizing-Engine | `lib/support-sanitizer.js` als Pflichtmodul |
| Lizenzkeys koennten im Klartext an Cloud gelangen | Nur HMAC-SHA256-Hash oder interne Fall-ID |
| Keine Trennung lokale/Cloud-KI | Zwei-Ebenen-Modell: lokal (Ollama) + Cloud (sanitisiert) |
| Kein Predictive Health Monitor | Lokal im Produkt, proaktive Warnung ohne Cloud |
| Keine log-signatures.json | Muster statt Rohlogs fuer Cloud-Analyse |

**Leitprinzip:** Nicht die KI entscheidet welche Daten noetig sind, sondern die
Produktarchitektur legt vorab fest, welche minimalen bereinigten Diagnoseinformationen
ueberhaupt exportierbar sind.

Vollstaendige Spezifikation: siehe `ki-support-architektur-dsgvo.md`.

---

## 18. Chaos-Testmatrix

Die 15 haeufigsten Desktop-Software-Katastrophen beim Kunden.
Jedes Szenario ist ein Testfall — kein Release ohne bestandene Chaos-Tests.

| # | Katastrophe | Erwartetes Verhalten | Mechanismus | Testfall | Release-Kriterium |
|---|---|---|---|---|---|
| 1 | **Doppelklick** — Nutzer startet App zweimal | Zweiter Prozess beendet sich, erstes Fenster kommt in Vordergrund | `requestSingleInstanceLock()` + `second-instance` Event | Zwei Prozesse starten, nur einer laeuft | Muss bestehen |
| 2 | **OneDrive-Ordner** — DB in synchronisiertem Pfad | Warndialog beim Start | `checkStorageRisks()` | DB in `~/OneDrive/` platzieren, App starten | Muss bestehen |
| 3 | **Virenscanner** — EXE/DLL in Quarantaene | App-Selbsttest erkennt fehlende Dateien, Reparatur-Hinweis | `checkInstallIntegrity()` | preload.cjs loeschen, App starten | Muss bestehen |
| 4 | **DB korrupt** — Stromausfall waehrend Schreibvorgang | Health-Check erkennt, Reparatur angeboten, Backup als Fallback | `checkDbIntegrity()` + `attemptDbRepair()` | Korrupte DB platzieren, App starten | Muss bestehen |
| 5 | **Festplatte voll** — Kein Schreibplatz mehr | Warnung vor Backup/Migration, kein stiller Fehler | `checkDiskSpace()` vor Backup/Migration | Partition mit < 300 MB testen | Muss bestehen |
| 6 | **Update bricht ab** — AV blockiert, Strom weg | Update-Status "installed" aber nicht "verified", Safe Mode beim naechsten Start | `update-state.json` + Crash-Marker | Update simulieren, Prozess killen | Muss bestehen |
| 7 | **Migration — Nutzer beendet App** — Panik bei langer Migration | Fortschrittsanzeige verhindert Panik, nach Crash: Safe Mode + Recovery | Sperrzustand + Startup-Marker | Migration starten, Prozess killen, neu starten | Muss bestehen |
| 8 | **Weisses Fenster** — Renderer laedt nicht | Nach 15s Fallback auf error.html mit Diagnose-Button | Renderer-Timeout + error.html | dist/index.html loeschen, App starten | Muss bestehen |
| 9 | **userData nicht beschreibbar** — Berechtigungsproblem | Klarer Dialog mit Pfadangabe | `checkWritable()` | Ordner auf read-only setzen, App starten | Muss bestehen |
| 10 | **DB fehlt** — Geloescht, verschoben, AV-Quarantaene | Dialog: "Backup wiederherstellen oder neue DB?" — nie still neue DB anlegen | ENOENT-Check + Backup-Prüfung | DB-Datei loeschen, App starten | Muss bestehen |
| 11 | **Backup unbrauchbar** — Korrupte Backup-Datei | Validierung erkennt Problem, Backup als "ungueltig" markiert | `validateBackup()` | Korruptes Backup in Backup-Ordner, Restore versuchen | Muss bestehen |
| 12 | **Restore schlaegt fehl** — Inkompatible Version | Versions-Check vor Restore, Sicherheitskopie bleibt erhalten | Schema-Vergleich + Safety-Copy | Backup mit hoeherem Schema importieren | Muss bestehen |
| 13 | **WAL waechst** — 100+ MB nach Langzeitbetrieb | Periodischer Checkpoint, Warnung bei ungewoehnlicher Groesse | 5min PASSIVE + Groessen-Check | 10.000 Schreiboperationen, WAL pruefen | Muss bestehen |
| 14 | **"Es geht nicht"** — Kunde ruft an | Support-Bundle in einem Klick, Fehler-ID in jedem Dialog | Support-Bundle + ERR-IDs | Bundle exportieren, pruefen: keine Kundendaten, alle Infos vorhanden | Muss bestehen |
| 15 | **Installation beschaedigt** — Update-Reste, geloeschte Dateien | App-Selbsttest + Reparaturinstallation | `checkInstallIntegrity()` + NSIS Repair | Dateien manuell loeschen, Reparatur ausfuehren | Muss bestehen |

### Zusaetzliche Chaos-Tests (erweiterbar)

| Szenario | Erwartetes Verhalten |
|---|---|
| DB auf Netzlaufwerk (SMB/UNC) | Warnung beim Start |
| DB gesperrt (anderer Prozess) | Retry 3x, dann Dialog mit Hinweis |
| Migration mit 2.000+ Datensaetzen | Fortschrittsanzeige, < 30 Sekunden |
| Safe Mode manuell starten | Nur Recovery-Center, keine Migration |
| Safe Mode automatisch nach Crash | Startup-Marker erkannt, Recovery-UI |
| Speicherplatz < 1 GB | Warnung im Log |
| Speicherplatz < 300 MB | Abbruch mit Dialog |
| DB > 500 MB | Warnung im Log |
| Backup-Ordner > 2 GB | Rotation raeumt auf |
| Update verfuegbar, Nutzer lehnt ab | Kein erzwungener Restart |
