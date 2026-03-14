import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createTestAudit } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createModels } from '../src/models/index.js';
import { seedCategories } from '../src/euer/index.js';

describe('Transaction model', () => {
  let db, models;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, { invoices: true }, { product_id: 'test', app_version: '0.1.0' });
    models = createModels({ ...db, audit: createTestAudit(db) }, { invoices: true });
    await seedCategories(db.execute, db.query);
  });

  afterEach(() => db.close());

  it('creates an income transaction', async () => {
    const id = await models.transaction.save({
      type: 'income', date: '2026-03-01',
      amount_cents: 50000, description: 'Beratung Maerz',
    });

    assert.ok(id > 0);
    const tx = await models.transaction.getById(id);
    assert.equal(tx.type, 'income');
    assert.equal(tx.amount_cents, 50000);
  });

  it('creates an expense with category', async () => {
    const cats = await models.category.getAll('expense');
    const softwareCat = cats.find(c => c.code === 'A-14');

    const id = await models.transaction.save({
      type: 'expense', date: '2026-03-05',
      amount_cents: 2900, description: 'Domain-Gebuehr',
      category_id: softwareCat.id,
    });

    const all = await models.transaction.getAll({ type: 'expense' });
    assert.equal(all.length, 1);
    assert.equal(all[0].category_name, 'Software / Lizenzen');
  });

  it('cancels a transaction (Storno)', async () => {
    const id = await models.transaction.save({
      type: 'income', date: '2026-03-01',
      amount_cents: 10000, description: 'Fehlbuchung',
    });

    const cancelId = await models.transaction.cancel(id);
    assert.ok(cancelId > 0);

    const original = await models.transaction.getById(id);
    assert.equal(original.cancelled, 1);

    const reversal = await models.transaction.getById(cancelId);
    assert.equal(reversal.amount_cents, -10000);
    assert.ok(reversal.description.includes('Storno'));
  });

  it('cannot cancel an already cancelled transaction', async () => {
    const id = await models.transaction.save({
      type: 'expense', date: '2026-03-01', amount_cents: 5000,
    });
    await models.transaction.cancel(id);

    await assert.rejects(
      () => models.transaction.cancel(id),
      /already cancelled/,
    );
  });

  it('filters by year and month', async () => {
    await models.transaction.save({ type: 'income', date: '2026-01-15', amount_cents: 1000 });
    await models.transaction.save({ type: 'income', date: '2026-03-10', amount_cents: 2000 });
    await models.transaction.save({ type: 'income', date: '2025-12-01', amount_cents: 3000 });

    const y2026 = await models.transaction.getAll({ year: 2026 });
    assert.equal(y2026.length, 2);

    const march = await models.transaction.getAll({ year: 2026, month: 3 });
    assert.equal(march.length, 1);
    assert.equal(march[0].amount_cents, 2000);
  });

  it('excludes cancelled transactions by default', async () => {
    const id = await models.transaction.save({ type: 'income', date: '2026-03-01', amount_cents: 5000 });
    await models.transaction.cancel(id);

    const normal = await models.transaction.getAll();
    // Only the reversal entry (not cancelled), original is cancelled
    assert.equal(normal.length, 1);

    const all = await models.transaction.getAll({ include_cancelled: true });
    assert.equal(all.length, 2);
  });
});
