import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { computeHmac } from '@codefabrik/shared/crypto';

// In-memory store simulating the events table for unit tests
let events = [];
let executeCalls = [];

function resetStore() {
  events = [];
  executeCalls = [];
}

// Standalone appendEvent reimplementation using the in-memory store
// (mirrors db.js logic without requiring Tauri SQL plugin)
async function appendEvent(type, data, actor = 'app') {
  const prevHash = events.length > 0 ? events[events.length - 1].hash : '0';
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
  const hash = await computeHmac(message);

  const event = {
    id: events.length + 1,
    type,
    timestamp,
    actor,
    version: 1,
    data: dataJson,
    hash,
    prev_hash: prevHash,
  };
  events.push(event);
  executeCalls.push({
    sql: 'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)',
    params: [type, timestamp, actor, dataJson, hash, prevHash],
  });
  return event;
}

describe('appendEvent', () => {
  beforeEach(() => resetStore());

  it('schreibt INSERT in events-Tabelle', async () => {
    await appendEvent('TestEvent', { foo: 'bar' });
    assert.equal(executeCalls.length, 1);
    assert.ok(executeCalls[0].sql.includes('INSERT INTO events'));
    assert.equal(events.length, 1);
  });

  it('berechnet korrekten HMAC', async () => {
    const event = await appendEvent('TestEvent', { x: 1 });
    const message = `TestEvent|${event.timestamp}|${event.data}|0`;
    const expectedHash = await computeHmac(message);
    assert.equal(event.hash, expectedHash);
  });

  it('verkettet prev_hash korrekt', async () => {
    const e1 = await appendEvent('Event1', { a: 1 });
    const e2 = await appendEvent('Event2', { b: 2 });
    assert.equal(e1.prev_hash, '0');
    assert.equal(e2.prev_hash, e1.hash);
  });

  it('speichert vollstaendigen Snapshot als JSON', async () => {
    const snapshot = { id: 1, first_name: 'Hans', last_name: 'Mueller', status: 'aktiv' };
    const event = await appendEvent('MitgliedAngelegt', snapshot);
    const parsed = JSON.parse(event.data);
    assert.deepEqual(parsed, snapshot);
  });
});
