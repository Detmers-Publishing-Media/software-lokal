import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, testHmac } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createModels } from '../src/models/index.js';

describe('Person model', () => {
  let db, models;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, { invoices: true }, { product_id: 'test', app_version: '0.1.0' });
    models = createModels({ ...db, computeHmac: testHmac }, { invoices: true });
  });

  afterEach(() => db.close());

  it('creates a person with auto-generated number', async () => {
    const id = await models.person.save({
      first_name: 'Max', last_name: 'Mustermann',
      street: 'Musterstr. 1', zip: '12345', city: 'Berlin',
    });

    assert.ok(id > 0, 'returns ID');
    const person = await models.person.getById(id);
    assert.equal(person.first_name, 'Max');
    assert.equal(person.last_name, 'Mustermann');
    assert.ok(person.person_number.startsWith('K'), 'auto number starts with K');
  });

  it('updates an existing person', async () => {
    const id = await models.person.save({ first_name: 'Max', last_name: 'Muster' });
    await models.person.save({ id, first_name: 'Max', last_name: 'Mustermann' });

    const person = await models.person.getById(id);
    assert.equal(person.last_name, 'Mustermann');
  });

  it('lists all active persons', async () => {
    await models.person.save({ first_name: 'Anna', last_name: 'A' });
    await models.person.save({ first_name: 'Bert', last_name: 'B' });

    const all = await models.person.getAll();
    assert.equal(all.length, 2);
    assert.equal(all[0].last_name, 'A'); // sorted
  });

  it('soft-deletes a person (status = deleted)', async () => {
    const id = await models.person.save({ first_name: 'Del', last_name: 'Eted' });
    await models.person.remove(id);

    const person = await models.person.getById(id);
    assert.equal(person.status, 'deleted');

    const all = await models.person.getAll();
    assert.equal(all.length, 0, 'deleted persons not in list');
  });

  it('searches by name', async () => {
    await models.person.save({ first_name: 'Hans', last_name: 'Mueller' });
    await models.person.save({ first_name: 'Anna', last_name: 'Schmidt' });

    const results = await models.person.search('Mueller');
    assert.equal(results.length, 1);
    assert.equal(results[0].first_name, 'Hans');
  });

  it('creates B2B customer with company and VAT ID', async () => {
    const id = await models.person.save({
      company: 'Firma GmbH', first_name: '', last_name: 'Meier',
      vat_id: 'DE123456789', is_b2b: true,
    });

    const person = await models.person.getById(id);
    assert.equal(person.company, 'Firma GmbH');
    assert.equal(person.vat_id, 'DE123456789');
    assert.equal(person.is_b2b, 1);
  });

  it('counts active persons', async () => {
    await models.person.save({ first_name: 'A', last_name: 'A' });
    await models.person.save({ first_name: 'B', last_name: 'B' });
    const id3 = await models.person.save({ first_name: 'C', last_name: 'C' });
    await models.person.remove(id3);

    const count = await models.person.getActiveCount();
    assert.equal(count, 2);
  });

  it('logs events for CRUD operations', async () => {
    const id = await models.person.save({ first_name: 'Event', last_name: 'Test' });
    await models.person.save({ id, first_name: 'Event', last_name: 'Updated' });
    await models.person.remove(id);

    const events = await models.eventLog.getEvents();
    const types = events.map(e => e.type);
    assert.ok(types.includes('PersonAngelegt'));
    assert.ok(types.includes('PersonGeaendert'));
    assert.ok(types.includes('PersonGeloescht'));
  });
});
