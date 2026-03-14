import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createTestAudit } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createEventLog } from '../src/models/index.js';

describe('Event log', () => {
  let db, eventLog;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
    eventLog = createEventLog({ ...db, audit: createTestAudit(db) });
  });

  afterEach(() => db.close());

  it('appends an event', async () => {
    await eventLog.append('TestEvent', { foo: 'bar' });

    const events = await eventLog.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'TestEvent');
    assert.equal(JSON.parse(events[0].data).foo, 'bar');
  });

  it('chains events with prev_hash', async () => {
    await eventLog.append('Event1', { n: 1 });
    await eventLog.append('Event2', { n: 2 });
    await eventLog.append('Event3', { n: 3 });

    const events = await eventLog.getEvents();
    // Events are returned DESC, reverse for chain order
    events.reverse();

    assert.equal(events[0].prev_hash, '0', 'first event has genesis prev_hash');
    assert.equal(events[1].prev_hash, events[0].hash, 'second links to first');
    assert.equal(events[2].prev_hash, events[1].hash, 'third links to second');
  });

  it('verifies a valid chain', async () => {
    await eventLog.append('A', { x: 1 });
    await eventLog.append('B', { x: 2 });
    await eventLog.append('C', { x: 3 });

    const result = await eventLog.verifyChain();
    assert.equal(result.valid, true);
    assert.equal(result.checked, 3);
    assert.equal(result.errors.length, 0);
  });

  it('detects tampered hash', async () => {
    await eventLog.append('A', { x: 1 });
    await eventLog.append('B', { x: 2 });

    // Tamper with event data
    db.execute("UPDATE events SET data = '{\"x\":99}' WHERE id = 1");

    const result = await eventLog.verifyChain();
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.equal(result.errors[0].error, 'hash mismatch');
  });

  it('returns events in descending order', async () => {
    await eventLog.append('First', {});
    await eventLog.append('Second', {});

    const events = await eventLog.getEvents();
    assert.equal(events[0].type, 'Second');
    assert.equal(events[1].type, 'First');
  });

  it('limits returned events', async () => {
    for (let i = 0; i < 10; i++) {
      await eventLog.append('Evt', { i });
    }

    const events = await eventLog.getEvents(3);
    assert.equal(events.length, 3);
  });
});
