import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createTestAudit } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createEventLog } from '../src/models/index.js';

describe('Event replay (finanz-shared)', () => {
  let db, eventLog;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
    eventLog = createEventLog({ ...db, audit: createTestAudit(db) });
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
