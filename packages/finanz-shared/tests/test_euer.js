import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createTestAudit } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createModels } from '../src/models/index.js';
import { seedCategories, EUER_CATEGORIES, annualSummary, monthlySummary, runningSaldo } from '../src/euer/index.js';

describe('EUeR categories', () => {
  let db;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
  });

  afterEach(() => db.close());

  it('has income and expense categories', () => {
    const income = EUER_CATEGORIES.filter(c => c.type === 'income');
    const expense = EUER_CATEGORIES.filter(c => c.type === 'expense');
    assert.ok(income.length >= 3, 'at least 3 income categories');
    assert.ok(expense.length >= 15, 'at least 15 expense categories');
  });

  it('seeds categories into database', async () => {
    await seedCategories(db.execute, db.query);

    const rows = db.query('SELECT * FROM category ORDER BY sort_order');
    assert.equal(rows.length, EUER_CATEGORIES.length);
    assert.equal(rows[0].code, 'E-01');
  });

  it('is idempotent (double-seed does not duplicate)', async () => {
    await seedCategories(db.execute, db.query);
    await seedCategories(db.execute, db.query);

    const rows = db.query('SELECT * FROM category');
    assert.equal(rows.length, EUER_CATEGORIES.length);
  });
});

describe('EUeR summary', () => {
  let db, models;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
    models = createModels({ ...db, audit: createTestAudit(db) }, {});
    await seedCategories(db.execute, db.query);
  });

  afterEach(() => db.close());

  it('calculates annual summary', async () => {
    const cats = db.query("SELECT * FROM category WHERE code IN ('E-01', 'A-01')");
    const incomeCat = cats.find(c => c.code === 'E-01');
    const expenseCat = cats.find(c => c.code === 'A-01');

    await models.transaction.save({ type: 'income', date: '2026-01-15', amount_cents: 50000, category_id: incomeCat.id });
    await models.transaction.save({ type: 'income', date: '2026-06-20', amount_cents: 30000, category_id: incomeCat.id });
    await models.transaction.save({ type: 'expense', date: '2026-03-10', amount_cents: 10000, category_id: expenseCat.id });

    const summary = await annualSummary(db.query, 2026);
    assert.equal(summary.year, 2026);
    assert.equal(summary.income_cents, 80000);
    assert.equal(summary.expense_cents, 10000);
    assert.equal(summary.profit_cents, 70000);
    assert.ok(summary.categories.length >= 2);
  });

  it('calculates monthly summary', async () => {
    await models.transaction.save({ type: 'income', date: '2026-01-15', amount_cents: 50000 });
    await models.transaction.save({ type: 'expense', date: '2026-01-20', amount_cents: 10000 });
    await models.transaction.save({ type: 'income', date: '2026-03-10', amount_cents: 30000 });

    const months = await monthlySummary(db.query, 2026);
    assert.equal(months.length, 12);
    assert.equal(months[0].income_cents, 50000); // January
    assert.equal(months[0].expense_cents, 10000);
    assert.equal(months[0].saldo_cents, 40000);
    assert.equal(months[2].income_cents, 30000); // March
  });

  it('calculates running saldo', async () => {
    await models.transaction.save({ type: 'income', date: '2026-01-15', amount_cents: 100000 });
    await models.transaction.save({ type: 'expense', date: '2026-02-10', amount_cents: 25000 });
    await models.transaction.save({ type: 'expense', date: '2026-06-01', amount_cents: 15000 });

    const saldo = await runningSaldo(db.query, '2026-03-31');
    assert.equal(saldo.income_cents, 100000);
    assert.equal(saldo.expense_cents, 25000);
    assert.equal(saldo.saldo_cents, 75000);
  });

  it('excludes cancelled transactions from summary', async () => {
    const id = await models.transaction.save({ type: 'income', date: '2026-01-15', amount_cents: 50000 });
    await models.transaction.cancel(id);

    const summary = await annualSummary(db.query, 2026);
    // Original is cancelled=1 (excluded), reversal has negative amount (included)
    // Net effect: only the reversal entry with -50000 remains
    assert.ok(summary.income_cents <= 0, 'cancelled income should not count as positive');
  });
});
