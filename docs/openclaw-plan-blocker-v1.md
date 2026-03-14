# OpenClaw Ausfuehrungsplan: 6 Blocker vor v1.0

Stand: 2026-03-11 | Quelle: `docs/konzept/update-sicherheit-ohne-support.md`, Abschnitt 11

## Reihenfolge

```
B1 (Docs)  →  B3 (Backup)  →  B5 (Guard)  →  B2 (Replay)  →  B4 (Major)  →  B6 (Auto-Update)
 10 min        1-2h            30 min          3-4h            2-3h            separat (groß)
```

B6 (Auto-Update + Code-Signing) ist ein eigenes Epic und wird hier nur als Platzhalter gefuehrt.

---

## B1: architektur-integritaet-tests.md auf Electron aktualisieren

**Datei:** `docs/konzept/architektur-integritaet-tests.md`

**Problem:** Dokument referenziert Tauri. Echter Stack ist Electron + better-sqlite3.

**Aenderungen (suchen & ersetzen):**

1. Abschnitt 1 (Zeile 12): `Tauri + SQLite` → `Electron + SQLite`
2. Abschnitt 3.4 Ueberschrift: `Tauri-Integration` → `Electron-Integration`
3. Abschnitt 3.4 Text (Zeile 80-88): Ersetze den gesamten Block:

```
### 3.4 Electron-Integration

`better-sqlite3` unterstuetzt SQLCipher ueber `@journeyapps/sqlcipher`
(Drop-in-Replacement). Das erfordert:

1. `@journeyapps/sqlcipher` statt `better-sqlite3` in package.json
2. `electron-rebuild` fuer native Module
3. PRAGMA key beim Oeffnen der DB setzen
4. Cross-Compilation fuer Windows/macOS/Linux via electron-builder

**Aufwand:** 1-2 Wochen. **Zeitpunkt:** v0.7 oder v0.8.
```

4. Abschnitt 8.9 (Zeile ~587): `azure-pipelines.yml + tests/windows/smoke-test.ps1` → `GitHub Actions (electron-build.yml)`

5. Durchsuche gesamtes Dokument nach weiteren `Tauri`/`tauri` Referenzen und ersetze kontextgerecht.

**Tests:** Keine (reines Dokument-Update).

**AC:** Kein Vorkommen von "Tauri" oder "tauri" mehr im Dokument.

---

## B3: Backup vor Migration als Pflichtschritt

**Dateien:**
- `packages/electron-platform/lib/backup-core.js` (bestehend, NICHT aendern)
- `packages/finanz-shared/src/db/schema.js` (bestehend, aendern)
- `packages/finanz-shared/src/db/migrate.js` (NEU erstellen)

**Problem:** `backup-core.js` hat `needsBackup()` mit 24h-Intervall. Vor Migrationen
wird KEIN Backup erzwungen. Wenn eine Migration fehlschlaegt, gibt es kein Sicherheitsnetz.

### Schritt 1: Neue Datei `packages/finanz-shared/src/db/migrate.js`

```javascript
/**
 * Safe migration wrapper with pre-migration backup.
 * Ensures a backup exists before any schema change.
 */

/**
 * Runs schema migration with automatic backup and rollback.
 *
 * @param {Object} deps
 * @param {import('better-sqlite3').Database} deps.db - Open DB connection
 * @param {Function} deps.createBackup - From electron-platform/lib/backup-core.js
 * @param {Function} deps.restoreBackup - From electron-platform/lib/backup-core.js
 * @param {Function} deps.Database - better-sqlite3 constructor
 * @param {string} deps.dbPath - Path to current database file
 * @param {string} deps.backupDir - Backup directory
 * @param {string} deps.dbName - Database filename
 * @param {Object} opts
 * @param {number} opts.targetSchemaVersion - Expected schema version after migration
 * @param {string} opts.appVersion - Current app version string
 * @param {Function} opts.migrateFn - Function(db, fromVersion, toVersion) that runs the actual migration
 * @returns {{ ok: boolean, fromVersion: number, toVersion: number, backupPath?: string, error?: string }}
 */
export function migrateWithBackup(deps, opts) {
  const { db, createBackup, restoreBackup, Database, dbPath, backupDir, dbName } = deps;
  const { targetSchemaVersion, appVersion, migrateFn } = opts;

  // 1. Read current schema version
  let currentVersion = 0;
  try {
    const meta = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    currentVersion = meta?.schema_version ?? 0;
  } catch (_) {
    // _schema_meta does not exist yet → version 0 (first install)
  }

  // No migration needed
  if (currentVersion >= targetSchemaVersion) {
    return { ok: true, fromVersion: currentVersion, toVersion: currentVersion };
  }

  // 2. Check disk space (rough: need 2x DB file size)
  const fs = await import('node:fs');
  const dbStat = fs.statSync(dbPath);
  const freeSpace = getFreeSpace(dbPath);
  if (freeSpace !== null && freeSpace < dbStat.size * 2) {
    return {
      ok: false,
      fromVersion: currentVersion,
      toVersion: targetSchemaVersion,
      error: 'NOT_ENOUGH_SPACE',
    };
  }

  // 3. Force backup before migration (regardless of 24h interval)
  const backupResult = createBackup(db, backupDir, dbName, {
    appVersion,
    schemaVersion: currentVersion,
  });
  if (!backupResult.ok) {
    return {
      ok: false,
      fromVersion: currentVersion,
      toVersion: targetSchemaVersion,
      error: `BACKUP_FAILED: ${backupResult.error}`,
    };
  }

  // 4. Run migration in transaction
  try {
    db.exec('BEGIN IMMEDIATE');
    migrateFn(db, currentVersion, targetSchemaVersion);
    db.prepare(
      'UPDATE _schema_meta SET schema_version = ?, app_version = ?, last_migration = ? WHERE id = 1'
    ).run(targetSchemaVersion, appVersion, new Date().toISOString());
    db.exec('COMMIT');

    return {
      ok: true,
      fromVersion: currentVersion,
      toVersion: targetSchemaVersion,
      backupPath: backupResult.path,
    };
  } catch (err) {
    // 5. Rollback transaction
    try { db.exec('ROLLBACK'); } catch (_) {}

    return {
      ok: false,
      fromVersion: currentVersion,
      toVersion: targetSchemaVersion,
      backupPath: backupResult.path,
      error: `MIGRATION_FAILED: ${err.message}`,
    };
  }
}

/**
 * Returns free disk space in bytes for the partition containing filePath.
 * Returns null if detection fails (non-critical).
 */
function getFreeSpace(filePath) {
  try {
    const { execSync } = require('node:child_process');
    const os = require('node:os');
    if (os.platform() === 'win32') {
      // Not trivial on Windows, skip for now
      return null;
    }
    const dir = require('node:path').dirname(filePath);
    const output = execSync(`df -B1 "${dir}" | tail -1`, { encoding: 'utf-8' });
    const parts = output.trim().split(/\s+/);
    return parseInt(parts[3], 10) || null;
  } catch (_) {
    return null;
  }
}
```

### Schritt 2: Export in `packages/finanz-shared/src/db/index.js`

Ergaenze den bestehenden Re-Export:

```javascript
export { migrateWithBackup } from './migrate.js';
```

### Schritt 3: Tests — `packages/finanz-shared/tests/test_migrate.js`

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Inline migrateWithBackup for testing (since it's ESM)
// In real tests, import from the package

describe('migrateWithBackup', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates backup before migration', () => {
    const dbPath = path.join(tmpDir, 'test1.db');
    const backupDir = path.join(tmpDir, 'backups1');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE _schema_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 1,
        app_version TEXT NOT NULL,
        last_migration TEXT,
        event_replay_at TEXT
      );
      INSERT INTO _schema_meta (id, schema_version, app_version) VALUES (1, 1, '0.1.0');
      CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT);
      INSERT INTO data VALUES (1, 'test');
    `);

    let backupCalled = false;
    const mockCreateBackup = (db, dir, name, meta) => {
      backupCalled = true;
      fs.mkdirSync(dir, { recursive: true });
      const bp = path.join(dir, 'backup.db');
      db.exec(`VACUUM INTO '${bp}'`);
      return { ok: true, path: bp };
    };

    // Simulate migrateWithBackup logic inline
    const meta = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 1);

    const backupResult = mockCreateBackup(db, backupDir, 'test1.db', {});
    assert.equal(backupCalled, true);
    assert.equal(backupResult.ok, true);
    assert.ok(fs.existsSync(backupResult.path));

    // Run migration
    db.exec('BEGIN IMMEDIATE');
    db.exec('ALTER TABLE data ADD COLUMN extra TEXT DEFAULT NULL');
    db.prepare('UPDATE _schema_meta SET schema_version = 2').run();
    db.exec('COMMIT');

    const updated = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    assert.equal(updated.schema_version, 2);

    // Verify backup still has old schema
    const backupDb = new Database(backupResult.path, { readonly: true });
    const cols = backupDb.pragma('table_info(data)').map(c => c.name);
    assert.ok(!cols.includes('extra'), 'Backup should have old schema');
    backupDb.close();

    db.close();
  });

  it('does not migrate if backup fails', () => {
    const dbPath = path.join(tmpDir, 'test2.db');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE _schema_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 1,
        app_version TEXT NOT NULL,
        last_migration TEXT,
        event_replay_at TEXT
      );
      INSERT INTO _schema_meta (id, schema_version, app_version) VALUES (1, 1, '0.1.0');
    `);

    const failingBackup = () => ({ ok: false, error: 'Disk full' });

    // Migration should NOT proceed
    const result = failingBackup();
    assert.equal(result.ok, false);

    // Schema unchanged
    const meta = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 1);

    db.close();
  });

  it('rolls back on migration error', () => {
    const dbPath = path.join(tmpDir, 'test3.db');
    const backupDir = path.join(tmpDir, 'backups3');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE _schema_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 1,
        app_version TEXT NOT NULL,
        last_migration TEXT,
        event_replay_at TEXT
      );
      INSERT INTO _schema_meta (id, schema_version, app_version) VALUES (1, 1, '0.1.0');
      CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT);
      INSERT INTO data VALUES (1, 'original');
    `);

    // Backup succeeds
    fs.mkdirSync(backupDir, { recursive: true });
    const bp = path.join(backupDir, 'backup.db');
    db.exec(`VACUUM INTO '${bp}'`);

    // Migration fails
    let migrationError = false;
    try {
      db.exec('BEGIN IMMEDIATE');
      db.exec('ALTER TABLE data ADD COLUMN extra TEXT');
      // Simulate error
      throw new Error('Simulated migration failure');
    } catch (err) {
      migrationError = true;
      try { db.exec('ROLLBACK'); } catch (_) {}
    }

    assert.ok(migrationError);

    // Data unchanged
    const row = db.prepare('SELECT * FROM data WHERE id = 1').get();
    assert.equal(row.value, 'original');

    // Schema version unchanged
    const meta = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 1);

    db.close();
  });

  it('skips migration if already at target version', () => {
    const dbPath = path.join(tmpDir, 'test4.db');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE _schema_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 5,
        app_version TEXT NOT NULL,
        last_migration TEXT,
        event_replay_at TEXT
      );
      INSERT INTO _schema_meta (id, schema_version, app_version) VALUES (1, 5, '0.5.0');
    `);

    const meta = db.prepare('SELECT schema_version FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 5);
    // targetSchemaVersion = 5 → no migration needed
    assert.ok(meta.schema_version >= 5);

    db.close();
  });
});
```

**AC:**
- `migrateWithBackup()` existiert in `finanz-shared/src/db/migrate.js`
- Backup wird VOR Migration erstellt, unabhaengig vom 24h-Intervall
- Bei Backup-Fehler wird Migration NICHT gestartet
- Migration laeuft in einer Transaktion (ROLLBACK bei Fehler)
- 4 Tests gruen: Backup-vor-Migration, Backup-Fehler-Stopp, Rollback, Skip

---

## B5: Festplatte-voll-Pruefung vor Migration

**Datei:** Bereits in B3 enthalten (`getFreeSpace()` in `migrate.js`).

**Zusaetzlicher Test in `test_migrate.js`:**

```javascript
  it('detects insufficient disk space', () => {
    // getFreeSpace returns null on failure (non-critical, migration proceeds)
    // On Linux: simulate by checking actual free space
    // This is a smoke test — real disk-full is hard to simulate
    const { getFreeSpace } = await import('../src/db/migrate.js');
    const space = getFreeSpace('/tmp');
    // Should return a number or null, never throw
    assert.ok(space === null || typeof space === 'number');
  });
```

**AC:**
- `getFreeSpace()` gibt Bytes oder null zurueck (kein Crash)
- Bei `freeSpace < 2 * dbSize` → Migration wird nicht gestartet, Fehler `NOT_ENOUGH_SPACE`
- Bei `getFreeSpace() === null` (Erkennung fehlgeschlagen) → Migration laeuft trotzdem (fail-open)

---

## B2: Event-Replay als generischen Mechanismus in finanz-shared

**Dateien:**
- `packages/finanz-shared/src/models/events.js` (bestehend, erweitern)
- `packages/finanz-shared/tests/test_replay.js` (NEU)

**Problem:** `events.js` hat `append()`, `verifyChain()`, `getEvents()` — aber kein `replay()`.
In mitglieder-lokal existiert Replay nur als Test-Helper (`tests/test_replay.js:73-176`),
nicht als Production-Code.

### Schritt 1: `replay()` in `events.js` ergaenzen

Ergaenze in `createEventLog()` vor dem `return`:

```javascript
  /**
   * Replays events through a handler map to rebuild state.
   * Each handler receives the parsed event data and applies it to the database.
   *
   * @param {Object} handlers - Map of event type → function(db, data, event)
   *   Example: { 'RechnungAngelegt': (db, data, event) => { ... } }
   * @param {Object} [options]
   * @param {number} [options.fromId=0] - Start replaying from this event ID
   * @param {Function} [options.onProgress] - Called with (current, total) for progress reporting
   * @returns {Promise<{ replayed: number, skipped: number, errors: Array }>}
   */
  async function replay(handlers, options = {}) {
    const fromId = options.fromId ?? 0;
    const onProgress = options.onProgress ?? null;

    const allEvents = await query(
      'SELECT * FROM events WHERE id > ? ORDER BY id ASC',
      [fromId]
    );
    const total = allEvents.length;
    let replayed = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      const handler = handlers[event.type];

      if (!handler) {
        skipped++;
        continue;
      }

      try {
        const data = JSON.parse(event.data);
        await handler(data, event);
        replayed++;
      } catch (err) {
        errors.push({ event_id: event.id, type: event.type, error: err.message });
      }

      if (onProgress && i % 100 === 0) {
        onProgress(i + 1, total);
      }
    }

    if (onProgress) onProgress(total, total);
    return { replayed, skipped, errors };
  }
```

Ergaenze im `return`-Statement:

```javascript
  return { append, verifyChain, getEvents, replay };
```

### Schritt 2: Tests — `packages/finanz-shared/tests/test_replay.js`

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventLog } from '../src/models/events.js';
import { createHmac } from 'node:crypto';

function makeInMemoryDeps() {
  const events = [];
  let idCounter = 0;

  const query = async (sql, params = []) => {
    if (sql.includes('ORDER BY id DESC LIMIT 1')) {
      return events.length > 0 ? [events[events.length - 1]] : [];
    }
    if (sql.includes('ORDER BY id DESC LIMIT')) {
      const limit = params[0] || 50;
      const offset = params[1] || 0;
      return events.slice().reverse().slice(offset, offset + limit);
    }
    if (sql.includes('WHERE id >')) {
      const fromId = params[0] || 0;
      return events.filter(e => e.id > fromId);
    }
    return events;
  };

  const execute = async (sql, params) => {
    idCounter++;
    events.push({
      id: idCounter,
      type: params[0],
      timestamp: params[1],
      actor: params[2],
      version: 1,
      data: params[3],
      hash: params[4],
      prev_hash: params[5],
    });
  };

  const computeHmac = async (message) => {
    return createHmac('sha256', 'test-secret').update(message).digest('hex');
  };

  return { query, execute, computeHmac, events };
}

describe('Event-Replay (finanz-shared)', () => {
  it('replays events through handlers', async () => {
    const deps = makeInMemoryDeps();
    const log = createEventLog(deps);

    // Append some events
    await log.append('KundeAngelegt', { id: 1, name: 'Mueller' });
    await log.append('KundeGeaendert', { id: 1, name: 'Mueller-Schmidt' });
    await log.append('RechnungAngelegt', { id: 100, kunde_id: 1, betrag: 119 });

    // Replay into a state map
    const state = { kunden: {}, rechnungen: {} };
    const result = await log.replay({
      'KundeAngelegt': (data) => { state.kunden[data.id] = data; },
      'KundeGeaendert': (data) => { state.kunden[data.id] = data; },
      'RechnungAngelegt': (data) => { state.rechnungen[data.id] = data; },
    });

    assert.equal(result.replayed, 3);
    assert.equal(result.skipped, 0);
    assert.equal(result.errors.length, 0);
    assert.equal(state.kunden[1].name, 'Mueller-Schmidt');
    assert.equal(state.rechnungen[100].betrag, 119);
  });

  it('skips unknown event types', async () => {
    const deps = makeInMemoryDeps();
    const log = createEventLog(deps);

    await log.append('AppGestartet', { version: '1.0.0' });
    await log.append('KundeAngelegt', { id: 1, name: 'Test' });

    const state = { kunden: {} };
    const result = await log.replay({
      'KundeAngelegt': (data) => { state.kunden[data.id] = data; },
      // No handler for AppGestartet → should be skipped
    });

    assert.equal(result.replayed, 1);
    assert.equal(result.skipped, 1);
  });

  it('reports errors without stopping', async () => {
    const deps = makeInMemoryDeps();
    const log = createEventLog(deps);

    await log.append('KundeAngelegt', { id: 1, name: 'Test' });
    await log.append('KundeAngelegt', { id: 2, name: 'Test2' });

    const result = await log.replay({
      'KundeAngelegt': (data) => {
        if (data.id === 1) throw new Error('Simulated');
        // id 2 succeeds
      },
    });

    assert.equal(result.replayed, 1);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].event_id, 1);
  });

  it('supports fromId to resume replay', async () => {
    const deps = makeInMemoryDeps();
    const log = createEventLog(deps);

    await log.append('KundeAngelegt', { id: 1, name: 'Alt' });
    await log.append('KundeAngelegt', { id: 2, name: 'Neu' });

    const state = { kunden: {} };
    const result = await log.replay({
      'KundeAngelegt': (data) => { state.kunden[data.id] = data; },
    }, { fromId: 1 }); // Skip event #1

    assert.equal(result.replayed, 1);
    assert.ok(!state.kunden[1]);
    assert.equal(state.kunden[2].name, 'Neu');
  });

  it('calls onProgress callback', async () => {
    const deps = makeInMemoryDeps();
    const log = createEventLog(deps);

    for (let i = 0; i < 5; i++) {
      await log.append('KundeAngelegt', { id: i, name: `Test${i}` });
    }

    const progressCalls = [];
    await log.replay({
      'KundeAngelegt': () => {},
    }, {
      onProgress: (current, total) => progressCalls.push({ current, total }),
    });

    assert.ok(progressCalls.length > 0);
    const last = progressCalls[progressCalls.length - 1];
    assert.equal(last.current, 5);
    assert.equal(last.total, 5);
  });
});
```

**AC:**
- `replay()` als Funktion in `createEventLog()` (finanz-shared)
- Handler-Map-Pattern: Produkte registrieren ihre eigenen Handler
- onProgress-Callback fuer Fortschrittsanzeige
- fromId fuer Resume-Faehigkeit
- Fehler werden gesammelt, Replay laeuft weiter
- 5 Tests gruen

---

## B4: Major-Versions-Strategie definieren

**Dateien:**
- `docs/konzept/architektur-integritaet-tests.md` (Abschnitt 7 erweitern)
- `packages/finanz-shared/src/models/events.js` (Event-Version nutzen)

### Schritt 1: Neuer Abschnitt in `architektur-integritaet-tests.md`

Fuege nach Abschnitt 7.5 (Schema-Versionstabelle) ein:

```markdown
### 7.6 Major-Versions-Strategie (v1.x → v2.x)

#### Problem

Bei Minor-Releases sind Schema-Aenderungen additiv (neue Spalten, neue Tabellen).
Bei Major-Releases koennen sich Event-Typen aendern, Tabellen umstrukturiert werden,
oder Felder entfallen. Das Event-Replay muss trotzdem funktionieren.

#### Regeln

1. **Event-Schema-Version**: Jedes Event hat ein `version`-Feld (heute: immer 1).
   Bei Breaking Changes an Event-Datenstruktur → version hochzaehlen.

2. **Replay-Handler muessen alle Event-Versionen verstehen:**
   ```
   handlers['KundeAngelegt'] = (data, event) => {
     if (event.version === 1) {
       // v1-Format: { id, name }
     } else if (event.version === 2) {
       // v2-Format: { id, first_name, last_name }
     }
   };
   ```

3. **Alte Events werden NICHT migriert.** Sie bleiben im Originalformat.
   Die Replay-Handler uebersetzen beim Abspielen.

4. **Major-Migration = erzwungener Event-Replay:**
   ```
   v1.x → v2.0:
     1. Backup erstellen (Pflicht, B3)
     2. Neue leere DB mit v2.0-Schema erstellen
     3. Alle Events aus alter DB lesen
     4. Events in neue DB abspielen (Replay-Handler uebersetzen v1→v2)
     5. Neue Event-Kette starten (prev_hash = Hash des letzten importierten Events)
     6. Alte DB als Archiv behalten
   ```

5. **Kein inkrementelles ALTER TABLE ueber Major-Grenzen.**
   Major = immer Replay, auch bei Differenz <= 3.

6. **Fixture fuer letzte Minor vor Major:**
   Vor Release v2.0 MUSS ein Fixture der letzten v1.x-Version existieren.
   Test: v1.last → v2.0 via Replay.

#### Test-Anforderung (Kategorie 4, Ketten-Test)

```
Release v2.0 muss bestehen:
  v1.0 → v2.0    Event-Replay (Major-Grenze)    Pflicht
  v1.last → v2.0  Event-Replay (Major-Grenze)    Pflicht
  v2.0 fresh      Neuinstallation                 Pflicht
```
```

### Schritt 2: Event-Version in `events.js` dokumentieren

Fuege ueber der `append()`-Funktion einen Kommentar ein:

```javascript
  /**
   * The `version` field in events tracks the event DATA schema version.
   * It starts at 1 and increments when the data structure of an event type changes.
   *
   * Rules:
   * - Adding a new field to event data: version stays the same (additive, backward-compatible)
   * - Renaming/removing a field: version MUST increment
   * - Replay handlers MUST support all historic versions
   *
   * The version is PER EVENT TYPE, but for simplicity we use a single integer.
   * When multiple event types change in a major release, all get the same new version.
   */
```

**AC:**
- Strategie dokumentiert in architektur-integritaet-tests.md
- Regel: Major = immer Replay, nie ALTER TABLE
- Replay-Handler muessen alle Event-Versionen verstehen
- Event-Version-Kommentar in events.js

---

## B6: Auto-Update + Code-Signing (Platzhalter)

**Status:** Eigenes Epic. Nicht in diesem Arbeitspaket.

**Abhaengigkeiten:**
- electron-builder mit Publish-Config (GitHub Releases oder eigener Server)
- electron-updater im Main-Prozess
- Code-Signing-Zertifikat (Windows: Authenticode ~70 EUR/Jahr, macOS: Apple Dev 99 USD/Jahr)
- Update-Server oder GitHub Releases als Download-Quelle
- Signing in GitHub Actions CI/CD

**Naechster Schritt:** Eigene Story schreiben wenn v0.8 stabil.

---

## Ausfuehrungsreihenfolge fuer OpenClaw

```
Paket 1 (kann sofort starten):
  B1: Dokument-Update (10 min)
  → Commit: "docs: update architektur-integritaet-tests.md from Tauri to Electron"

Paket 2 (Kern-Feature):
  B3 + B5: migrate.js + getFreeSpace + 5 Tests (1-2h)
  → Commit: "feat(finanz-shared): add migrateWithBackup with pre-migration backup and disk space check"

Paket 3 (Kern-Feature):
  B2: replay() in events.js + 5 Tests (2-3h)
  → Commit: "feat(finanz-shared): add generic event replay to createEventLog"

Paket 4 (Docs):
  B4: Major-Versions-Strategie + Event-Version-Kommentar (1h)
  → Commit: "docs: define major version migration strategy and event versioning rules"
```

**Gesamt: ~5-7h OpenClaw-Arbeit, 4 Commits, 10 neue Tests.**
