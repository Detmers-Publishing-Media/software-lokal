# Code-Fabrik — Umsetzungsplan Electron-Plattform

*Stand: 2026-03-06*
*Bezug: electron-plattform-architektur.md (v6), architektur-integritaet-tests.md*
*Workflow: Claude Code plant und reviewt, OpenClaw fuehrt aus*

---

## Uebersicht

### Ausgangszustand

```
products/mitglieder-lokal/
  package.json              Tauri v2 + Svelte 5, Version 0.4.0
  src/lib/db.js             370 Zeilen: 20 Funktionen, 5 Migrationen, Event-Log
  src/lib/crypto.js         computeHmac (Web Crypto API)
  src/lib/pdf.js            generatePdf (pdfmake)
  src/lib/pdf-lists.js      5 PDF-Listen
  src/lib/pdf-mahnbrief.js  Mahnbriefe (3 Stufen)
  src/lib/csv.js            generateCsv, downloadCsv
  src/lib/license.js        checkMemberLimit, hasLicenseKey
  src/routes/               6 Svelte-Seiten
  app-shared/           @codefabrik/app-shared (eingebettet, Tauri-spezifisch)
  shared/                   @codefabrik/shared (eingebettet)
  src-tauri/                Rust Main Process (5 SQL-Migrationen)
  tests/                    11 Dateien, 74 Tests, 7 Kategorien
```

### Zielzustand

```
pnpm-workspace.yaml
packages/
  shared/                   @codefabrik/shared (db mit setBackend, audit-log, crypto, csv, license)
  electron-platform/        @codefabrik/electron-platform (Main, Preload, lib/*, ipc/*)
  app-shared/           @codefabrik/app-shared (Svelte Components)
products/
  mitglieder-lokal/        electron-main.js + app.config.js + Fachlogik
```

### Phasen

| Phase | Inhalt | Arbeitspakete |
|---|---|---|
| 1 | Monorepo + Plattform-Kern | AP-01 bis AP-08 |
| 2 | MitgliederSimple umbauen | AP-09 bis AP-14 |
| 3 | Betriebsstabilitaet + Build | AP-15 bis AP-22 |
| 4 | Code-Signierung + Auto-Update | AP-23 bis AP-27 |
| 5 | DSGVO-sichere KI-Support-Features | AP-28 bis AP-31 |
| 6 | SQLCipher + Erster-Start-Assistent | AP-32 bis AP-34 |

---

## Phase 1: Monorepo + Plattform-Kern

### AP-01: Monorepo-Grundstruktur

**Ziel:** pnpm-Workspace mit leeren Package-Huelsen.

**Dateien (neu):**

1. `/pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
  - 'products/*'
```

2. `/packages/shared/package.json`
```json
{
  "name": "@codefabrik/shared",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./license": "./src/license/index.js",
    "./db": "./src/db/index.js",
    "./audit-log": "./src/audit-log/index.js",
    "./crypto": "./src/crypto/index.js",
    "./csv": "./src/csv/index.js"
  }
}
```

3. `/packages/electron-platform/package.json`
```json
{
  "name": "@codefabrik/electron-platform",
  "version": "0.1.0",
  "type": "module",
  "main": "main.js",
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "electron-updater": "^6.0.0"
  },
  "peerDependencies": {
    "electron": ">=28.0.0"
  }
}
```

4. `/packages/app-shared/package.json`
```json
{
  "name": "@codefabrik/app-shared",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./components": "./src/components/index.js"
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  }
}
```

**Verifikation:**
- `pnpm install` laeuft ohne Fehler
- `pnpm ls -r` zeigt alle 4 Packages (shared, electron-platform, app-shared, mitglieder-lokal)

---

### AP-02: packages/shared — DB-Abstraktionsschicht mit setBackend

**Ziel:** Injizierbares DB-Backend, das in Electron (IPC) und Tests (Mock) funktioniert.

**Dateien (neu):**

1. `packages/shared/src/db/index.js`
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

**Verifikation:**
- Unit-Test: setBackend mit Mock, query/execute aufrufen → Mock wird korrekt gerufen
- Import `from '@codefabrik/shared/db'` funktioniert

---

### AP-03: packages/shared — Audit-Log, Crypto, CSV, License

**Ziel:** Bestehende Module aus mitglieder-lokal extrahieren und in shared ablegen.

**Dateien (neu, Inhalte aus bestehendem Code kopieren):**

1. `packages/shared/src/audit-log/index.js`
   - Quelle: `appendEvent()` und `verifyChain()` aus `products/mitglieder-lokal/src/lib/db.js` (Zeilen mit Event-Logik)
   - Aenderung: Import von `query`/`execute` aus `../db/index.js` statt direkt
   - Exportiert: `appendEvent(type, data, actor)`, `verifyChain(limit)`

2. `packages/shared/src/crypto/index.js`
   - Quelle: `products/mitglieder-lokal/src/lib/crypto.js` (1:1 Kopie)
   - Exportiert: `computeHmac(message)`

3. `packages/shared/src/csv/index.js`
   - Quelle: `products/mitglieder-lokal/src/lib/csv.js` (1:1 Kopie)
   - Exportiert: `generateCsv(rows, columns)`, `downloadCsv(csvString, filename)`

4. `packages/shared/src/license/index.js`
   - Quelle: `products/mitglieder-lokal/shared/src/license/index.js` (1:1 Kopie)
   - Exportiert: `validateLicenseFormat(key)`, `normalizeLicenseKey(key)`

**Verifikation:**
- Bestehende Tests aus mitglieder-lokal fuer crypto, csv, license laufen gegen die neuen Pfade
- `appendEvent` + `verifyChain` Tests bestehen mit Mock-Backend

---

### AP-04: packages/electron-platform — lib/logger.js

**Ziel:** Logging-System mit 5 Levels, JSON-Format, Rotation, Error-Code-Tagging.

**Datei (neu):** `packages/electron-platform/lib/logger.js`
- Vollstaendiger Code: siehe Architektur Sektion 4.2
- Enthaelt: `initLogger`, `log`, `logCritical/Error/Warn/Info/Debug`, `logCodedError`, `persistLastError`
- Import von `ERROR_CODES` aus `./error-codes.js`

**Verifikation:**
```
- initLogger erstellt Verzeichnis
- log schreibt JSON-Zeile in app.log
- Rotation bei > 5 MB (5 Dateien)
- logCodedError schreibt errorCode ins data-Feld
- persistLastError schreibt last-error.json
- Log-Level-Filter funktioniert (debug wird bei level=info nicht geschrieben)
```

---

### AP-05: packages/electron-platform — lib/error-codes.js

**Ziel:** Zentrales Fehlercode-System mit CF-Codes.

**Datei (neu):** `packages/electron-platform/lib/error-codes.js`
- Vollstaendiger Code: siehe Architektur Sektion 4.7
- 20 Fehlercodes: CF-DB-001..005, CF-BKP-001..003, CF-MIG-001..003, CF-UPD-001..003, CF-SYS-001..004, CF-UI-001..002
- Exportiert: `ERROR_CODES`, `getErrorInfo(code)`, `formatErrorDialog(code, detail)`, `formatCompactInfo(...)`

**Verifikation:**
```
- getErrorInfo('CF-DB-001') liefert korrektes Objekt
- getErrorInfo('UNBEKANNT') liefert Fallback
- formatErrorDialog('CF-DB-002') enthaelt Code im Text
- formatCompactInfo liefert 2-Zeilen-String
```

---

### AP-06: packages/electron-platform — lib/health.js + lib/recovery.js

**Ziel:** Gesundheitspruefungen und Recovery-Logik.

**Dateien (neu):**

1. `packages/electron-platform/lib/health.js`
   - Vollstaendiger Code: siehe Architektur Sektion 4.5 + 4.10
   - Exportiert: `checkDbIntegrity(db)`, `checkWritable(dirPath)`, `checkDiskSpace(dirPath, requiredBytes)`, `checkStorageRisks(dbPath)`, `checkInstallIntegrity(appPath)`, `checkResourceLimits(dbPath)`

2. `packages/electron-platform/lib/recovery.js`
   - Vollstaendiger Code: siehe Architektur Sektion 4.6
   - Exportiert: `openDbWithRetry(Database, dbPath, maxRetries)`, `attemptDbRepair(Database, dbPath, backupDir, dbName)`

**Verifikation:**
```
- checkDbIntegrity: OK bei gesunder DB, Fehler bei korrupter DB
- checkWritable: OK bei beschreibbarem Ordner, Fehler bei read-only
- checkDiskSpace: OK bei genuegend Platz, Fehler bei < 300 MB
- checkStorageRisks: Erkennt OneDrive/Dropbox/UNC-Pfade
- checkInstallIntegrity: Erkennt fehlende preload.cjs
- checkResourceLimits: Warnt bei DB > 500 MB, WAL > 100 MB
- openDbWithRetry: 3 Versuche, dann Fehler
- attemptDbRepair: VACUUM INTO → neue DB, Backup-Fallback
```

---

### AP-07: packages/electron-platform — lib/db-core.js + lib/backup-core.js

**Ziel:** Datenbank-Kern und Backup-System.

**Dateien (neu):**

1. `packages/electron-platform/lib/db-core.js`
   - Vollstaendiger Code: siehe Architektur Sektion 9 (db-core.js)
   - Exportiert: `openDb(dbPath, options)`, `closeDb()`, `getDb()`, `setDb(instance)`, `dbQuery(sql, params)`, `dbExecute(sql, params)`, `dbMigrate(targetSchemaVersion, appVersion, migrations, backupVerified)`
   - Enthaelt: _schema_meta Tabelle, Versionsvergleich, Replay-Signal bei > 3 Versionen, Backup-Pflicht vor Migration

2. `packages/electron-platform/lib/backup-core.js`
   - Enthaelt: `createBackup(db, backupDir, dbName)`, `validateBackup(Database, backupPath)`, `listBackups(backupDir, dbName)`, `rotateBackups(backupDir, config)`, `isBackupNeeded(backupDir, dbName, maxAgeMs)`
   - validateBackup: oeffnen + integrity_check + _schema_meta lesen
   - Backup-Dateiname: `{dbName}_YYYY-MM-DD_HH-mm.db`
   - Rotation: 7 taeglich, 4 woechentlich, 12 monatlich

**Verifikation:**
```
- openDb erstellt DB mit WAL + foreign_keys
- closeDb macht TRUNCATE-Checkpoint
- dbMigrate: current → 'current', older ≤ 3 → inkrementell, older > 3 → 'replay_required', newer → Error
- dbMigrate ohne Backup → Error
- createBackup erstellt Datei + Metadaten
- validateBackup: OK bei gueltiger DB, Fehler bei korrupter
- isBackupNeeded: true wenn > 24h, false wenn frisch
- rotateBackups behaelt korrektes Set
```

---

### AP-08: packages/electron-platform — lib/support-bundle.js

**Ziel:** Diagnosedaten-Export mit case-summary.json.

**Datei (neu):** `packages/electron-platform/lib/support-bundle.js`
- Vollstaendiger Code: siehe Architektur Sektion 5.2
- Exportiert: `collectDiagnostics(params)`
- Erzeugt: system-info.json, integrity-check.json, schema-meta.json, Log-Dateien, backups.json, update-state.json, storage-risks.json, last-error.json, case-summary.json

**Verifikation:**
```
- collectDiagnostics liefert files-Array mit mindestens system-info.json + case-summary.json
- case-summary.json enthaelt: product, version, schemaVersion, risks, activeErrors, recentErrors
- Keine Kundendaten (Namen, Adressen) in irgendeiner Datei
- Fehlercodes aus Logs korrekt extrahiert
```

---

## Phase 2: MitgliederSimple umbauen

### AP-09: package.json auf Workspace-Dependencies umstellen

**Ziel:** Tauri-Dependencies entfernen, Electron + Workspace-Refs einsetzen.

**Datei (aendern):** `products/mitglieder-lokal/package.json`

Entfernen:
- `@tauri-apps/api`
- `@tauri-apps/plugin-dialog`
- `@tauri-apps/plugin-fs`
- `@tauri-apps/plugin-sql`
- `@tauri-apps/cli` (devDeps)
- Lokale `file:` Referenz auf app-shared und shared

Hinzufuegen:
```json
{
  "dependencies": {
    "@codefabrik/electron-platform": "workspace:*",
    "@codefabrik/shared": "workspace:*",
    "@codefabrik/app-shared": "workspace:*",
    "pdfmake": "^0.2.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "better-sqlite3": "^11.0.0",
    "svelte": "^5.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

**Verifikation:**
- `pnpm install` laeuft ohne Fehler
- Keine Tauri-Referenzen mehr in package.json

---

### AP-10: Imports in src/lib/db.js anpassen

**Ziel:** db.js nutzt `@codefabrik/shared/db` statt `@tauri-apps/plugin-sql`.

**Datei (aendern):** `products/mitglieder-lokal/src/lib/db.js`

Aenderungen:
1. Import-Zeilen aendern:
   - Alt: `import { query, execute } from '@codefabrik/app-shared/db'`
   - Neu: `import { query, execute } from '@codefabrik/shared/db'`
2. `appendEvent` und `verifyChain` entfernen (jetzt in `@codefabrik/shared/audit-log`)
3. Stattdessen importieren: `import { appendEvent, verifyChain } from '@codefabrik/shared/audit-log'`
4. `computeHmac` Import aendern: `import { computeHmac } from '@codefabrik/shared/crypto'`
5. Migration-SQL bleibt in db.js (produktspezifisch), aber Aufruf geht ueber `migrate()` aus shared/db

**WICHTIG:** Die 20 Fach-Funktionen (getMembers, saveMember, etc.) bleiben in db.js — nur die Infrastruktur-Imports aendern.

**Verifikation:**
- Alle 20 exportierten Funktionen weiterhin vorhanden
- Imports aufloesbar

---

### AP-11: Imports in allen anderen src/lib/*.js anpassen

**Ziel:** Alle Imports auf Workspace-Packages umstellen.

**Dateien (aendern):**

1. `src/lib/csv.js` → Entfernen, importiert jetzt aus `@codefabrik/shared/csv`
   - Oder: Re-Export: `export { generateCsv, downloadCsv } from '@codefabrik/shared/csv'`

2. `src/lib/crypto.js` → Entfernen, importiert aus `@codefabrik/shared/crypto`

3. `src/lib/license.js` → Import aendern:
   - `import { validateLicenseFormat } from '@codefabrik/shared/license'`

4. `src/lib/pdf.js`, `pdf-lists.js`, `pdf-mahnbrief.js` → Bleiben unveraendert (produktspezifisch, kein Tauri-Import)

5. `src/routes/*.svelte` → Imports anpassen wo noetig:
   - DB-Aufrufe: bereits ueber db.js abstrahiert, kein direkter Tauri-Import
   - Components: `from '@codefabrik/app-shared/components'`

**Verifikation:**
- `grep -r '@tauri-apps' src/` liefert keine Treffer mehr
- `grep -r 'app-shared/db' src/` liefert keine Treffer mehr (nur noch shared/db)

---

### AP-12: app.config.js + electron-main.js erstellen

**Ziel:** Produkt-Einstiegspunkt fuer Electron.

**Dateien (neu):**

1. `products/mitglieder-lokal/app.config.js`
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

2. `products/mitglieder-lokal/electron-main.js`
```javascript
import { createApp } from '@codefabrik/electron-platform';
import config from './app.config.js';
createApp(config);
```

**Verifikation:**
- Import aufloesbar
- Config-Objekt hat alle Pflichtfelder

---

### AP-13: setBackend + rendererReady in App.svelte

**Ziel:** Electron-IPC-Backend beim App-Start injizieren.

**Datei (aendern):** `products/mitglieder-lokal/src/App.svelte`

Aenderungen am Anfang des Script-Blocks:
```javascript
import { setBackend } from '@codefabrik/shared/db';
import { onMount } from 'svelte';

onMount(() => {
  if (window.electronAPI) {
    setBackend(window.electronAPI);
    window.electronAPI.rendererReady();
  }
});
```

**Verifikation:**
- App startet in Electron ohne Fehler
- DB-Operationen funktionieren ueber IPC

---

### AP-14: Tests anpassen + src-tauri entfernen

**Ziel:** Alle 74 Tests laufen gegen neue Package-Struktur.

**Dateien (aendern):**

1. `tests/helpers/mock-sql.js` → Anpassen an `setBackend`-Pattern:
```javascript
import { setBackend } from '@codefabrik/shared/db';
import Database from 'better-sqlite3';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const backend = {
    dbQuery: (sql, params = []) => db.prepare(sql).all(...params),
    dbExecute: (sql, params = []) => {
      const r = db.prepare(sql).run(...params);
      return { lastInsertId: Number(r.lastInsertRowid), rowsAffected: r.changes };
    },
    dbMigrate: () => ({ status: 'current' }),
  };

  setBackend(backend);
  return db;
}
```

2. Alle `tests/test_*.js` — Import-Pfade anpassen wo noetig

3. `tests/create-fixture.js` — Import-Pfade anpassen

**Dateien (loeschen):**
- `products/mitglieder-lokal/src-tauri/` (gesamter Ordner)
- `products/mitglieder-lokal/shared/` (jetzt in packages/shared)
- `products/mitglieder-lokal/app-shared/` (jetzt in packages/app-shared)

**Verifikation:**
```bash
cd products/mitglieder-lokal && pnpm test
# Alle 74 Tests muessen bestehen
# Kein Test darf @tauri-apps importieren
```

---

## Phase 3: Betriebsstabilitaet + Build

### AP-15: packages/electron-platform — main.js (createApp)

**Ziel:** Vollstaendige Startup-Sequenz als wiederverwendbare Funktion.

**Datei (neu):** `packages/electron-platform/main.js`
- Vollstaendiger Code: siehe Architektur Sektion 9 (createApp)
- 13 Schritte: Lock → Logger → Crash-Check → Selbsttest → Beschreibbar → Speicherplatz → Storage-Risiken → DB oeffnen → Health-Check → Backup → IPC → Splash → Fenster
- Exportiert: `createApp(config)`

**Verifikation:**
- App startet mit `electron electron-main.js`
- Startup-Log zeigt alle Schritte
- Zweiter Start wird blockiert (Single-Instance)
- Crash-Marker wird geschrieben und bei sauberem Shutdown geloescht

---

### AP-16: packages/electron-platform — preload.cjs

**Ziel:** contextBridge mit allen IPC-Methoden.

**Datei (neu):** `packages/electron-platform/preload.cjs`
- Vollstaendiger Code: siehe Architektur Sektion 9 (preload.cjs)
- 25+ Methoden: dbQuery, dbExecute, dbMigrate, backup*, recovery*, support*, update*, app*, log*

**Verifikation:**
- `window.electronAPI` im Renderer verfuegbar
- Alle Methoden aufrufbar (invoke → Main Process)

---

### AP-17: packages/electron-platform — IPC-Handler

**Ziel:** Alle IPC-Handler als separate Module.

**Dateien (neu):**

1. `packages/electron-platform/ipc/db.js` — registerDbHandlers(config, db)
   - db:query, db:execute, db:migrate
   - WAL-Checkpoint-Interval (5 min)

2. `packages/electron-platform/ipc/backup.js` — registerBackupHandlers(config)
   - backup:create, backup:list, backup:restore, backup:exportDb, backup:exportUserData, backup:importUserData

3. `packages/electron-platform/ipc/dialog.js` — registerDialogHandlers()
   - dialog:openFile, dialog:saveFile

4. `packages/electron-platform/ipc/fs.js` — registerFsHandlers()
   - fs:readFile, fs:writeFile, fs:copyFile

5. `packages/electron-platform/ipc/update.js` — registerUpdateHandlers(config)
   - update:check, update:install
   - update-state.json Management

6. `packages/electron-platform/ipc/support.js` — registerSupportHandlers(config)
   - support:getAppInfo, support:exportBundle
   - recovery:checkDb, recovery:repairDb, recovery:getStatus
   - log:rendererError

**Verifikation:**
- Jeder Handler antwortet korrekt auf invoke
- Fehler in Handlern werden abgefangen und geloggt

---

### AP-18: Static Files (Splash, Error, Recovery)

**Ziel:** HTML-Seiten fuer Splash-Screen, Error-Fallback und Recovery-Center.

**Dateien (neu):**

1. `packages/electron-platform/static/splash.html`
   - Minimale Seite mit Logo/Name + "Wird geladen..."
   - Kein JS noetig, reines HTML+CSS

2. `packages/electron-platform/static/error.html`
   - "Die Anwendung konnte nicht geladen werden"
   - Button: "Diagnosedaten exportieren" (ruft electronAPI.exportSupportBundle)
   - Button: "Im abgesicherten Modus starten" (ruft electronAPI.restartSafeMode)

3. `packages/electron-platform/static/recovery.html`
   - Recovery-Center UI mit 7 Aktionen:
     1. DB-Pruefung starten
     2. DB-Reparatur
     3. Backup wiederherstellen
     4. Backup erstellen
     5. Diagnosedaten exportieren
     6. Technische Infos kopieren
     7. App normal starten
   - Muss auch im Safe Mode funktionieren (kein Svelte, reines HTML+JS)

**Verifikation:**
- splash.html laesst sich im BrowserWindow laden
- error.html zeigt Buttons, electronAPI-Aufrufe funktionieren
- recovery.html zeigt alle 7 Aktionen, jede funktioniert

---

### AP-19: vite.config.js fuer Electron anpassen

**Ziel:** Vite-Config fuer Electron statt Tauri.

**Datei (aendern):** `products/mitglieder-lokal/vite.config.js`

Aenderungen:
- `envPrefix` entfernen (kein TAURI_ mehr)
- `target` auf `chrome128` (Electron Chromium)
- Dev-Server Port bleibt 1420
- Build-Output bleibt `dist/`

**Verifikation:**
- `pnpm dev` startet Vite ohne Fehler
- `pnpm build` erzeugt dist/index.html

---

### AP-20: electron-builder.yml + Icons

**Ziel:** Windows-Installer-Konfiguration.

**Dateien (neu):**

1. `products/mitglieder-lokal/electron-builder.yml`
```yaml
appId: de.detmers-publish.mitglieder-lokal
productName: MitgliederSimple
directories:
  output: release
  buildResources: build
files:
  - dist/**/*
  - electron-main.js
  - app.config.js
  - node_modules/@codefabrik/**/*
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  installerIcon: build/icon.ico
  include: build/installer.nsh
```

2. `products/mitglieder-lokal/build/installer.nsh` — NSIS Reparaturmodus
3. Icons aus `src-tauri/icons/` nach `build/` kopieren (vor AP-14 Loeschung)

**Verifikation:**
- `pnpm electron:build` erzeugt .exe-Installer in release/
- Installer startet auf Windows 10

---

### AP-21: npm-Scripts fuer Electron

**Ziel:** Entwicklungs- und Build-Scripts.

**Datei (aendern):** `products/mitglieder-lokal/package.json` (scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"electron electron-main.js --dev\"",
    "electron:build": "vite build && electron-builder",
    "test": "node --test tests/test_*.js",
    "preview": "vite preview"
  }
}
```

**Verifikation:**
- `pnpm dev` startet Vite
- `pnpm electron:dev` startet Vite + Electron
- `pnpm electron:build` baut Installer

---

### AP-22: Plattform-Tests

**Ziel:** Tests fuer alle lib/-Module der Plattform.

**Dateien (neu):** `packages/electron-platform/tests/`

1. `test_logger.js` — initLogger, log, Rotation, logCodedError, persistLastError
2. `test_error_codes.js` — getErrorInfo, formatErrorDialog, formatCompactInfo
3. `test_health.js` — checkDbIntegrity, checkWritable, checkDiskSpace, checkStorageRisks, checkInstallIntegrity, checkResourceLimits
4. `test_recovery.js` — openDbWithRetry, attemptDbRepair
5. `test_db_core.js` — openDb, closeDb, dbQuery, dbExecute, dbMigrate (alle Faelle)
6. `test_backup_core.js` — createBackup, validateBackup, listBackups, rotateBackups, isBackupNeeded
7. `test_support_bundle.js` — collectDiagnostics (Vollstaendigkeit, keine PII)

**Verifikation:**
```bash
cd packages/electron-platform && pnpm test
# Alle Plattform-Tests muessen bestehen
```

---

## Phase 4: Code-Signierung + Auto-Update

### AP-23: EV Certificate kaufen (Cloud HSM)

**Ziel:** Code-Signing-Zertifikat fuer Windows-Installer.

**Aufgabe (manuell, PO):**
- EV Code Signing Certificate bei einem Anbieter kaufen (z.B. Certum, Sectigo)
- Cloud HSM waehlen (z.B. Azure Key Vault, AWS CloudHSM, DigiCert KeyLocker)
- Credentials in KeePass ablegen

**Ergebnis:**
- Zertifikat in Cloud HSM bereit
- Signatur-Credentials in KeePass

---

### AP-24: Code-Signierung in CI/CD

**Ziel:** Automatische Signierung im Build-Prozess.

**Dateien (aendern):**

1. `products/mitglieder-lokal/electron-builder.yml` — win.sign Konfiguration
2. CI/CD Pipeline — Signierung als Schritt nach dem Build

**Verifikation:**
- Signierter Installer hat gueltiges Authenticode-Zertifikat
- Windows SmartScreen blockiert nicht

---

### AP-25: Update-Server

**Ziel:** Statischer Fileserver fuer Auto-Updates.

**Aufgabe:**
- Statischer Fileserver (S3, CDN oder eigener Server)
- Releases als `latest.yml` + `.exe` + `.blockmap`
- electron-updater Konfiguration in app.config.js

**Verifikation:**
- `electron-updater` findet neue Version
- Download + Verifikation funktioniert

---

### AP-26: Update-Rollback-Mechanismus

**Ziel:** Automatischer Rollback bei fehlerhaftem Update.

**Implementierung:**
- `update-state.json` Management (bereits in IPC-Handler AP-17)
- 60s Verify-Timer: Status "installed" → "verified"
- Safe Mode bei unverifiedem Update
- Rollback-UI im Recovery-Center

**Verifikation:**
- Update installieren → App startet → nach 60s: Status "verified"
- Update installieren → App crasht → naechster Start: Safe Mode + Rollback-Option

---

### AP-27: Datenexport/Umzug-Feature

**Ziel:** Vollstaendiger Export fuer Rechnerwechsel.

**Implementierung:**
- `backup:exportUserData` — ZIP mit DB + Logos + Metadaten
- `backup:importUserData` — ZIP entpacken + Health-Check + Restore
- UI im Recovery-Center

**Verifikation:**
- Export auf Rechner A → Import auf Rechner B → alle Daten vorhanden
- Import mit inkompatiblem Schema → Fehlermeldung

---

## Phase 5: DSGVO-sichere KI-Support-Features

### AP-28: lib/support-sanitizer.js

**Ziel:** Sanitizing Engine fuer DSGVO-konforme Cloud-Exports.

**Datei (neu):** `packages/electron-platform/lib/support-sanitizer.js`

Exportiert:
- `sanitizePath(rawPath)` — `<USER_PATH>/<CLOUD_SYNC_FOLDER>/file.db`
- `sanitizeLogEntry(entry)` — Muster statt Rohtext
- `extractLogSignatures(logEntries)` — `['startup_ok', 'db_open_ok', ...]`
- `createKiBundle(fullBundle)` — Klasse-C-only Bundle mit:
  - case-summary.json
  - diagnosis.md
  - log-signatures.json
  - risk-assessment.json
  - recovery-options.json

**Verifikation:**
```
- sanitizePath entfernt Benutzernamen aus Pfaden
- sanitizePath erkennt OneDrive/Dropbox als <CLOUD_SYNC_FOLDER>
- sanitizeLogEntry entfernt E-Mails, Telefonnummern, Namen
- extractLogSignatures liefert Array von Pattern-Strings
- createKiBundle enthaelt keine Klasse-A- oder Klasse-B-Daten
- createKiBundle enthaelt keinen Klartext-Lizenzschluessel
```

---

### AP-29: Split-Bundle in Support-Bundle integrieren

**Ziel:** collectDiagnostics erzeugt zwei Bundle-Varianten.

**Datei (aendern):** `packages/electron-platform/lib/support-bundle.js`

Aenderungen:
- `collectDiagnostics` liefert `{ localBundle, kiBundle }`
- `localBundle` = bisheriges Vollbundle
- `kiBundle` = Ergebnis von `createKiBundle(localBundle)`
- UI bietet zwei Export-Optionen: "Vollstaendige Diagnose" und "KI-Support-Paket"

**Verifikation:**
- localBundle enthaelt alle bisherigen Dateien
- kiBundle enthaelt nur: case-summary.json, diagnosis.md, log-signatures.json, risk-assessment.json, recovery-options.json
- Kein PII im kiBundle

---

### AP-30: Predictive Health Monitor

**Ziel:** Proaktive Warnungen im Produkt, rein lokal.

**Datei (neu):** `packages/electron-platform/lib/health-monitor.js`

Exportiert:
- `runHealthMonitor(db, dbPath, backupDir)` — Prueft periodisch:
  - Backup zu alt (> 24h → Warnung)
  - Speicherplatz knapp (< 1 GB → Warnung)
  - WAL zu gross (> 50 MB → Checkpoint erzwingen)
  - Cloud-Sync-Risiko (bei jedem Start)
  - DB-Groesse (> 200 MB → Warnung)

**Integration:** Aufruf in createApp nach Startup-Sequenz, danach alle 30 Minuten.

**Verifikation:**
- Monitor erkennt altes Backup und loggt Warnung
- Monitor erkennt vollen Speicher
- Keine Cloud-Kommunikation

---

### AP-31: Test-Suite fuer Sanitizer + Split-Bundle

**Ziel:** Tests garantieren DSGVO-Konformitaet.

**Dateien (neu):**

1. `packages/electron-platform/tests/test_sanitizer.js`
   - Pfad-Sanitizing (Windows, macOS, Linux)
   - PII-Erkennung in Log-Eintraegen
   - Log-Signaturen-Extraktion
   - Klasse-A-Daten nie im Output

2. `packages/electron-platform/tests/test_split_bundle.js`
   - kiBundle enthaelt nur Klasse-C-Daten
   - Kein Rohlog im kiBundle
   - Kein Klartext-Lizenzschluessel
   - case-summary.json vollstaendig

**Verifikation:**
```bash
cd packages/electron-platform && pnpm test
# Alle Tests inklusive Sanitizer + Split-Bundle bestehen
```

---

## Phase 6: SQLCipher + Erster-Start-Assistent

### AP-32: SQLCipher via better-sqlite3-multiple-ciphers

**Ziel:** DB-Verschluesselung mit AES-256.

**Aenderungen:**
- Dependency: `better-sqlite3` → `better-sqlite3-multiple-ciphers`
- `openDb` in db-core.js: `PRAGMA key` nach dem Oeffnen
- Schluessel aus OS-Keystore (Windows: Credential Manager, Linux: libsecret)
- Neues Modul: `lib/keystore.js` — `getDbKey()`, `setDbKey(key)`

**Verifikation:**
- Verschluesselte DB nicht mit normalem DB-Browser oeffenbar
- Oeffnen mit korrektem Key → Daten lesbar
- Oeffnen ohne Key → "not a database"

---

### AP-33: Erster-Start-Assistent

**Ziel:** Gefuehrter Ablauf beim allerersten Start.

**Implementierung:**
- Erkennung: `_schema_meta` existiert nicht → erster Start
- Assistent: Vereinsname, Adresse, erste Beitragsklassen
- Optional: CSV-Import aus bestehendem System
- Ergebnis: Initialisierte DB mit Grunddaten

**Verifikation:**
- Frische Installation → Assistent erscheint
- Nach Assistent: DB initialisiert, Vereinsprofil gespeichert
- Zweiter Start: Kein Assistent

---

### AP-34: Opt-in Telemetrie (optional)

**Ziel:** Anonyme Nutzungsstatistiken, nur mit expliziter Zustimmung.

**Aufgabe:** Entscheidung ob umgesetzt. Wenn ja:
- Nur aggregierte, anonyme Daten (Anzahl Starts, OS, Version)
- Opt-in im Erster-Start-Assistent
- Jederzeit abschaltbar
- DSGVO-konform (keine PII)

**Status:** Entscheidung offen, niedrige Prioritaet.

---

## Abhaengigkeiten zwischen Arbeitspaketen

```
AP-01 ──→ AP-02 ──→ AP-03 ──→ AP-09 ──→ AP-10 ──→ AP-11 ──→ AP-13 ──→ AP-14
  │         │                                                              │
  │         └──→ AP-04 ──→ AP-05 ──→ AP-06 ──→ AP-07 ──→ AP-08 ──→ AP-22 │
  │                                                                        │
  └──→ AP-12                                                               │
                                                                           ▼
AP-15 ←── (benoetigt AP-04..08 + AP-16..17)                        AP-14 fertig
  │                                                                    │
  ▼                                                                    ▼
AP-16 ──→ AP-17 ──→ AP-18 ──→ AP-19 ──→ AP-20 ──→ AP-21         Phase 2 done
                                                    │
                                                    ▼
                                              AP-22 (Tests)
                                                    │
                                                    ▼
                                              Phase 3 done
                                                    │
                            ┌───────────────────────┤
                            ▼                       ▼
                      AP-23 (manuell)          AP-28 ──→ AP-29 ──→ AP-30 ──→ AP-31
                            │                                                  │
                            ▼                                                  ▼
                      AP-24 ──→ AP-25 ──→ AP-26 ──→ AP-27               Phase 5 done
                                                    │
                                                    ▼
                                              Phase 4 done
                                                    │
                                                    ▼
                                        AP-32 ──→ AP-33 ──→ AP-34
                                                              │
                                                              ▼
                                                        Phase 6 done
```

Phase 4 und Phase 5 sind unabhaengig voneinander und koennen parallel bearbeitet werden.

---

## Release-Gates

### Nach Phase 2: Internes Alpha

- [ ] Alle 74 bestehenden Tests bestehen
- [ ] Kein Tauri-Import mehr im Code
- [ ] App startet in Electron auf Linux
- [ ] Grundlegende CRUD-Operationen funktionieren
- [ ] Event-Log mit HMAC-Kette intakt

### Nach Phase 3: Internes Beta

- [ ] App startet auf Windows 10
- [ ] Installer (.exe) funktioniert
- [ ] Safe Mode + Recovery-Center funktionsfaehig
- [ ] Alle 15 Chaos-Szenarien getestet
- [ ] Support-Bundle-Export funktioniert
- [ ] Plattform-Tests bestehen

### Nach Phase 4: Release Candidate

- [ ] Signierter Installer (kein SmartScreen-Block)
- [ ] Auto-Update funktioniert
- [ ] Update-Rollback getestet
- [ ] Datenexport/Umzug getestet

### Nach Phase 5: KI-Support-Ready

- [ ] Sanitizer-Tests bestehen (kein PII-Leak)
- [ ] Split-Bundle funktioniert
- [ ] Predictive Health Monitor aktiv
- [ ] DSGVO-Konformitaet geprueft

### Nach Phase 6: v1.0

- [ ] SQLCipher aktiv
- [ ] Alle 7 Testkategorien bestehen
- [ ] Erster-Start-Assistent getestet
- [ ] Fixture fuer aktuelle Version committed

---

## Fixture-Pflicht

Bei jedem Release einer neuen Minor-Version:

1. `tests/create-fixture.js` ausfuehren
2. Neues Fixture unter `tests/fixtures/db_vX.Y.Z.sqlite` committen
3. Alte Fixtures NIEMALS loeschen
4. Migrationstests muessen alle Fixtures migrieren koennen

---

## Hinweise fuer OpenClaw

- Jedes AP ist ein einzelnes Arbeitspaket. Nicht mehrere APs in einem Durchgang.
- Nach jedem AP: `pnpm test` im betroffenen Package ausfuehren.
- Keine Abkuerzungen bei Tests — alle muessen bestehen bevor das naechste AP beginnt.
- Code-Sprache: Englisch (Variablen, Funktionen, Kommentare). UI-Texte: Deutsch.
- Umlaute in Code als ae/oe/ue, echte Umlaute nur in UI-Strings.
- Kein Over-Engineering. Code genau wie in der Architektur spezifiziert.
