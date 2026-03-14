# OpenClaw Task: B2 — Event-Replay als generische Funktion

**Prioritaet:** Blocker vor v1.0
**Geschaetzter Aufwand:** 2-3 Stunden
**Commit-Message:** `feat(finanz-shared): add generic event replay to createEventLog`

---

## Kontext

Die Funktion `createEventLog()` in `packages/finanz-shared/src/models/events.js`
hat aktuell drei Funktionen: `append()`, `verifyChain()`, `getEvents()`.

Es fehlt eine generische `replay()`-Funktion, die Events durch Handler-Funktionen
abspielt, um den DB-Zustand aus dem Event-Log neu aufzubauen. Das ist der
Kern-Fallback fuer Migrationen ueber >3 Versionen.

In `products/mitglieder-lokal/tests/test_replay.js` existiert bereits eine
produktspezifische Replay-Implementierung als Test-Helper. Diese soll jetzt als
generischer, paketuebergreifender Mechanismus in `finanz-shared` verankert werden.

---

## Dateien

### Aendern: `packages/finanz-shared/src/models/events.js`

**Aktuelle Datei (45 Zeilen):** Enthält `createEventLog({ query, execute, computeHmac })`.
Gibt Objekt mit `{ append, verifyChain, getEvents }` zurueck.

**Aufgabe:** Eine `replay()`-Funktion hinzufuegen und im Return-Objekt ergaenzen.

#### Position: VOR dem `return`-Statement (Zeile 43), NACH `getEvents()` (Zeile 41)

Fuege folgenden Code ein:

```javascript
  /**
   * Replays events through a handler map to rebuild state.
   * Each handler receives the parsed event data and the raw event row.
   *
   * @param {Object} handlers - Map of event type to handler function.
   *   Key: event type string (e.g. 'KundeAngelegt')
   *   Value: async function(data, event) — data is parsed JSON, event is full row
   *   Events with no matching handler are skipped (counted in result.skipped).
   * @param {Object} [options]
   * @param {number} [options.fromId=0] - Only replay events with id > fromId
   * @param {Function} [options.onProgress] - Called with (current, total) every 100 events
   * @returns {Promise<{ replayed: number, skipped: number, errors: Array<{ event_id: number, type: string, error: string }> }>}
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
        errors.push({
          event_id: event.id,
          type: event.type,
          error: err.message,
        });
      }

      if (onProgress && (i + 1) % 100 === 0) {
        onProgress(i + 1, total);
      }
    }

    if (onProgress && total > 0) {
      onProgress(total, total);
    }

    return { replayed, skipped, errors };
  }
```

#### Aendere das Return-Statement (aktuell Zeile 43):

**Alt:**
```javascript
  return { append, verifyChain, getEvents };
```

**Neu:**
```javascript
  return { append, verifyChain, getEvents, replay };
```

#### Ergaenze einen Kommentar ueber `append()` (aktuell Zeile 7):

**Alt:**
```javascript
  async function append(type, data, actor = 'app') {
```

**Neu:**
```javascript
  /**
   * The `version` field in events tracks the event DATA schema version.
   * It starts at 1 and increments when the data structure of an event type changes.
   * Replay handlers MUST support all historic versions.
   * Adding a new field: version stays the same. Renaming/removing: version MUST increment.
   */
  async function append(type, data, actor = 'app') {
```

---

### Erstellen: `packages/finanz-shared/tests/test_replay.js`

Erstelle diese Datei mit exakt folgendem Inhalt:

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, testHmac } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createEventLog } from '../src/models/index.js';

describe('Event replay (finanz-shared)', () => {
  let db, eventLog;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
    eventLog = createEventLog({ ...db, computeHmac: testHmac });
  });

  afterEach(() => db.close());

  it('replays events through handlers', async () => {
    await eventLog.append('KundeAngelegt', { id: 1, name: 'Mueller' });
    await eventLog.append('KundeGeaendert', { id: 1, name: 'Mueller-Schmidt' });
    await eventLog.append('RechnungAngelegt', { id: 100, kunde_id: 1, betrag: 119 });

    const state = { kunden: {}, rechnungen: {} };
    const result = await eventLog.replay({
      KundeAngelegt: (data) => { state.kunden[data.id] = data; },
      KundeGeaendert: (data) => { state.kunden[data.id] = data; },
      RechnungAngelegt: (data) => { state.rechnungen[data.id] = data; },
    });

    assert.equal(result.replayed, 3);
    assert.equal(result.skipped, 0);
    assert.equal(result.errors.length, 0);
    assert.equal(state.kunden[1].name, 'Mueller-Schmidt');
    assert.equal(state.rechnungen[100].betrag, 119);
  });

  it('skips unknown event types', async () => {
    await eventLog.append('AppGestartet', { version: '1.0.0' });
    await eventLog.append('KundeAngelegt', { id: 1, name: 'Test' });

    const state = { kunden: {} };
    const result = await eventLog.replay({
      KundeAngelegt: (data) => { state.kunden[data.id] = data; },
    });

    assert.equal(result.replayed, 1);
    assert.equal(result.skipped, 1);
    assert.equal(state.kunden[1].name, 'Test');
  });

  it('reports errors without stopping replay', async () => {
    await eventLog.append('KundeAngelegt', { id: 1, name: 'Test1' });
    await eventLog.append('KundeAngelegt', { id: 2, name: 'Test2' });
    await eventLog.append('KundeAngelegt', { id: 3, name: 'Test3' });

    const result = await eventLog.replay({
      KundeAngelegt: (data) => {
        if (data.id === 2) throw new Error('Simulated failure');
      },
    });

    assert.equal(result.replayed, 2);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].type, 'KundeAngelegt');
    assert.match(result.errors[0].error, /Simulated/);
  });

  it('supports fromId to resume partial replay', async () => {
    await eventLog.append('KundeAngelegt', { id: 1, name: 'Alt' });
    await eventLog.append('KundeAngelegt', { id: 2, name: 'Neu' });

    const state = { kunden: {} };
    const result = await eventLog.replay({
      KundeAngelegt: (data) => { state.kunden[data.id] = data; },
    }, { fromId: 1 });

    assert.equal(result.replayed, 1);
    assert.ok(!state.kunden[1], 'Event #1 should be skipped');
    assert.equal(state.kunden[2].name, 'Neu');
  });

  it('calls onProgress callback', async () => {
    for (let i = 0; i < 5; i++) {
      await eventLog.append('Evt', { i });
    }

    const progressCalls = [];
    await eventLog.replay({
      Evt: () => {},
    }, {
      onProgress: (current, total) => progressCalls.push({ current, total }),
    });

    assert.ok(progressCalls.length > 0);
    const last = progressCalls[progressCalls.length - 1];
    assert.equal(last.current, 5);
    assert.equal(last.total, 5);
  });

  it('returns empty result when no events exist', async () => {
    const result = await eventLog.replay({
      KundeAngelegt: () => {},
    });

    assert.equal(result.replayed, 0);
    assert.equal(result.skipped, 0);
    assert.equal(result.errors.length, 0);
  });

  it('passes full event row as second argument to handler', async () => {
    await eventLog.append('KundeAngelegt', { id: 1, name: 'Test' }, 'admin');

    let receivedEvent = null;
    await eventLog.replay({
      KundeAngelegt: (data, event) => { receivedEvent = event; },
    });

    assert.ok(receivedEvent);
    assert.equal(receivedEvent.type, 'KundeAngelegt');
    assert.equal(receivedEvent.actor, 'admin');
    assert.equal(receivedEvent.version, 1);
    assert.ok(receivedEvent.timestamp);
    assert.ok(receivedEvent.hash);
  });
});
```

---

## NICHT aendern

- `packages/finanz-shared/src/models/index.js` — Export bleibt gleich, `createEventLog` wird bereits re-exportiert
- `packages/finanz-shared/tests/test_events.js` — Bestehende Tests nicht anfassen
- Keine anderen Dateien aendern

---

## Pruefung nach Umsetzung

### 1. Alle finanz-shared Tests muessen gruen sein:

```bash
cd ~/code-fabrik
export PATH="$HOME/.local/share/fnm:$PATH" && eval "$(fnm env)" && fnm use 22
node --test packages/finanz-shared/tests/test_*.js
```

**Erwartetes Ergebnis:** Alle Tests bestanden, einschliesslich:
- `test_events.js` — 6 bestehende Tests (unveraendert)
- `test_replay.js` — 7 neue Tests
- `test_migrate.js` — 10 Tests (aus Paket 2)
- `test_schema.js`, `test_person.js`, `test_invoice.js`, `test_transaction.js`, `test_euer.js` — bestehend

### 2. Inhaltspruefung events.js:

```bash
grep -c 'replay' packages/finanz-shared/src/models/events.js
```

**Erwartetes Ergebnis:** Mindestens 3 (Funktionsdefinition, JSDoc, Return-Statement)

### 3. Return-Statement enthaelt replay:

```bash
grep 'return.*replay' packages/finanz-shared/src/models/events.js
```

**Erwartetes Ergebnis:** Zeile mit `{ append, verifyChain, getEvents, replay }`

---

## Akzeptanzkriterien

- [ ] `replay()` ist eine Funktion in `createEventLog()` return-Objekt
- [ ] Handler-Map-Pattern: Produkte registrieren eigene Handler als `{ EventType: fn }` Objekt
- [ ] `onProgress(current, total)` Callback fuer Fortschrittsanzeige
- [ ] `fromId` Parameter fuer Resume-Faehigkeit (nur Events mit id > fromId)
- [ ] Fehler werden gesammelt in `errors[]`, Replay laeuft weiter
- [ ] Unbekannte Event-Typen werden uebersprungen (gezaehlt in `skipped`)
- [ ] Handler erhaelt `(data, event)` — data ist geparstes JSON, event ist volle DB-Zeile
- [ ] Event-Version-Kommentar ueber `append()` erklaert Versionierungsregeln
- [ ] 7 Tests gruen in `test_replay.js`
- [ ] Alle bestehenden Tests bleiben gruen
