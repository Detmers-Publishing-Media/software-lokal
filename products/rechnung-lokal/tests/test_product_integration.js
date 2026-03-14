/**
 * Integration tests for Rechnung Lokal product.
 * Validates that product.config features work with finanz-shared kernel.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createTestAudit } from '../../../packages/finanz-shared/tests/helpers/test-db.js';
import { createSchema } from '../../../packages/finanz-shared/src/db/schema.js';
import { createModels } from '../../../packages/finanz-shared/src/models/index.js';
import { seedCategories } from '../../../packages/finanz-shared/src/euer/categories.js';
import { annualSummary, monthlySummary } from '../../../packages/finanz-shared/src/euer/summary.js';
import productConfig from '../product.config.js';

describe('Rechnung Lokal — Product Integration', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.1.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );
  });

  after(() => db.close());

  it('creates schema with invoice tables', () => {
    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    ).map(r => r.name);
    assert.ok(tables.includes('invoice'), 'invoice table exists');
    assert.ok(tables.includes('invoice_item'), 'invoice_item table exists');
  });

  it('does NOT create fee/donation/assembly tables', () => {
    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    ).map(r => r.name);
    assert.ok(!tables.includes('fee_class'), 'fee_class should not exist');
    assert.ok(!tables.includes('payment'), 'payment should not exist');
    assert.ok(!tables.includes('donation'), 'donation should not exist');
    assert.ok(!tables.includes('assembly'), 'assembly should not exist');
  });

  it('has invoice model but no fee/donation models', () => {
    assert.ok(models.invoice, 'invoice model exists');
    assert.ok(models.person, 'person model exists');
    assert.ok(models.transaction, 'transaction model exists');
    assert.ok(models.category, 'category model exists');
    assert.ok(models.eventLog, 'eventLog model exists');
    assert.ok(models.profile, 'profile model exists');
  });

  it('product config matches expected values', () => {
    assert.equal(productConfig.product, 'rechnung-lokal');
    assert.equal(productConfig.bundle, 'B-07-rechnung');
    assert.equal(productConfig.prefix, 'CFRL');
    assert.equal(productConfig.labels.person, 'Kunde');
    assert.equal(productConfig.features.invoices, true);
    assert.equal(productConfig.features.fees, false);
  });

  it('seeds EUeR categories', async () => {
    const cats = await models.category.getAll();
    assert.ok(cats.length >= 20, `Expected >= 20 categories, got ${cats.length}`);
    const income = cats.filter(c => c.type === 'income');
    const expense = cats.filter(c => c.type === 'expense');
    assert.ok(income.length >= 4, 'At least 4 income categories');
    assert.ok(expense.length >= 15, 'At least 15 expense categories');
  });
});

describe('Rechnung Lokal — Invoice Workflow', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.1.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );
  });

  after(() => db.close());

  it('creates customer (person)', async () => {
    const id = await models.person.save({
      company: 'Test GmbH',
      type: 'customer',
      email: 'info@test.de',
    });
    assert.ok(id > 0);
    const person = await models.person.getById(id);
    assert.equal(person.company, 'Test GmbH');
    assert.equal(person.type, 'customer');
  });

  it('creates invoice with items', async () => {
    const customerId = await models.person.save({
      company: 'Kunde AG',
      type: 'customer',
    });

    const items = [
      { description: 'Beratung', quantity: 5, unit_price_cents: 10000 },
      { description: 'Fahrtkosten', quantity: 1, unit_price_cents: 5000 },
    ];
    const invoiceId = await models.invoice.save({
      person_id: customerId,
      issue_date: '2026-03-01',
      due_date: '2026-03-15',
      status: 'draft',
      notes: 'Testrechnung',
    }, items);

    assert.ok(invoiceId > 0);
    const inv = await models.invoice.getWithItems(invoiceId);
    assert.equal(inv.person_id, customerId);
    assert.equal(inv.items.length, 2);
    assert.ok(inv.invoice_number.startsWith('RE-'), `Number starts with RE-: ${inv.invoice_number}`);
  });

  it('calculates invoice totals', () => {
    const items = [
      { description: 'Position 1', quantity: 2, unit_price_cents: 10000, tax_rate: 1900 },
      { description: 'Position 2', quantity: 3, unit_price_cents: 5000, tax_rate: 1900 },
    ];

    const totals = models.invoice.calculateTotals(items, true); // Kleinunternehmer = no tax
    // 2 * 100.00 + 3 * 50.00 = 350.00 = 35000 cents
    assert.equal(totals.subtotal_cents, 35000);
    assert.equal(totals.tax_cents, 0); // Kleinunternehmer
    assert.equal(totals.total_cents, 35000);
  });

  it('calculates totals with tax for non-Kleinunternehmer', () => {
    const items = [
      { description: 'Service', quantity: 1, unit_price_cents: 10000, tax_rate: 1900 },
    ];

    const totals = models.invoice.calculateTotals(items, false);
    assert.equal(totals.subtotal_cents, 10000);
    assert.equal(totals.tax_cents, 1900); // 19% of 10000
    assert.equal(totals.total_cents, 11900);
  });

  it('cancels invoice (storno)', async () => {
    const customerId = await models.person.save({ company: 'Storno Test', type: 'customer' });
    const invoiceId = await models.invoice.save({
      person_id: customerId,
      issue_date: '2026-03-01',
      due_date: '2026-03-15',
      status: 'sent',
    }, [
      { description: 'Service', quantity: 1, unit_price_cents: 20000 },
    ]);

    await models.invoice.cancel(invoiceId);
    const inv = await models.invoice.getById(invoiceId);
    assert.equal(inv.status, 'cancelled');
  });

  it('creates invoice from template', async () => {
    const customerId = await models.person.save({ company: 'Template Kunde', type: 'customer' });
    const originalId = await models.invoice.save({
      person_id: customerId,
      issue_date: '2026-01-01',
      due_date: '2026-01-15',
      status: 'paid',
      notes: 'Monatliche Beratung',
    }, [
      { description: 'Beratung Januar', quantity: 10, unit_price_cents: 8000 },
    ]);

    const copyId = await models.invoice.createFromTemplate(originalId);
    assert.ok(copyId > 0);
    assert.notEqual(copyId, originalId);

    const copy = await models.invoice.getWithItems(copyId);
    assert.equal(copy.status, 'draft');
    assert.equal(copy.person_id, customerId);
    assert.equal(copy.items.length, 1);
    assert.equal(copy.items[0].unit_price_cents, 8000);
  });

  it('marks invoice as paid', async () => {
    const customerId = await models.person.save({ company: 'Bezahlt Test', type: 'customer' });
    const invoiceId = await models.invoice.save({
      person_id: customerId,
      issue_date: '2026-03-01',
      due_date: '2026-03-15',
      status: 'sent',
    }, [
      { description: 'Dienstleistung', quantity: 1, unit_price_cents: 50000 },
    ]);

    await models.invoice.markPaid(invoiceId, '2026-03-10');
    const inv = await models.invoice.getById(invoiceId);
    assert.equal(inv.status, 'paid');
    assert.equal(inv.paid_date, '2026-03-10');
  });
});

describe('Rechnung Lokal — EUeR Integration', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.1.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );

    // Create some transactions for EUeR
    const cats = await models.category.getAll();
    const incomeCat = cats.find(c => c.type === 'income');
    const expenseCat = cats.find(c => c.type === 'expense');

    await models.transaction.save({
      date: '2026-01-15',
      description: 'Beratungshonorar',
      amount_cents: 100000,
      type: 'income',
      category_id: incomeCat.id,
    });
    await models.transaction.save({
      date: '2026-02-20',
      description: 'Bueromaterial',
      amount_cents: 5000,
      type: 'expense',
      category_id: expenseCat.id,
    });
    await models.transaction.save({
      date: '2026-03-05',
      description: 'Webdesign-Projekt',
      amount_cents: 250000,
      type: 'income',
      category_id: incomeCat.id,
    });
  });

  after(() => db.close());

  it('annual summary shows correct totals', async () => {
    const summary = await annualSummary(db.query, 2026);
    assert.equal(summary.income_cents, 350000);
    assert.equal(summary.expense_cents, 5000);
    assert.equal(summary.profit_cents, 345000);
    assert.ok(summary.categories.length > 0);
  });

  it('monthly summary shows 3 months with data', async () => {
    const months = await monthlySummary(db.query, 2026);
    assert.equal(months.length, 12);
    const jan = months.find(m => m.month === 1);
    assert.equal(jan.income_cents, 100000);
    const feb = months.find(m => m.month === 2);
    assert.equal(feb.expense_cents, 5000);
    const mar = months.find(m => m.month === 3);
    assert.equal(mar.income_cents, 250000);
  });

  it('event log tracks all operations', async () => {
    const events = await models.eventLog.getEvents();
    assert.ok(events.length >= 3, `Expected >= 3 events, got ${events.length}`);
  });

  it('event log hash chain is valid', async () => {
    const valid = await models.eventLog.verifyChain();
    assert.ok(valid, 'Hash chain should be valid');
  });
});

describe('Rechnung Lokal — Transaction Workflow', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.2.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );
  });

  after(() => db.close());

  it('creates income transaction', async () => {
    const cats = await models.category.getAll();
    const incomeCat = cats.find(c => c.type === 'income');

    const id = await models.transaction.save({
      type: 'income',
      date: '2026-03-01',
      amount_cents: 50000,
      description: 'Beratung',
      category_id: incomeCat.id,
    });
    assert.ok(id > 0);

    const tx = await models.transaction.getById(id);
    assert.equal(tx.type, 'income');
    assert.equal(tx.amount_cents, 50000);
    assert.equal(tx.description, 'Beratung');
  });

  it('creates expense transaction', async () => {
    const cats = await models.category.getAll();
    const expenseCat = cats.find(c => c.type === 'expense');

    const id = await models.transaction.save({
      type: 'expense',
      date: '2026-03-02',
      amount_cents: 3000,
      description: 'Bueromaterial',
      category_id: expenseCat.id,
    });
    assert.ok(id > 0);

    const tx = await models.transaction.getById(id);
    assert.equal(tx.type, 'expense');
    assert.equal(tx.amount_cents, 3000);
  });

  it('lists transactions with filter', async () => {
    const all = await models.transaction.getAll();
    assert.ok(all.length >= 2);

    const incomeOnly = await models.transaction.getAll({ type: 'income' });
    assert.ok(incomeOnly.every(t => t.type === 'income'));

    const expenseOnly = await models.transaction.getAll({ type: 'expense' });
    assert.ok(expenseOnly.every(t => t.type === 'expense'));
  });

  it('cancels transaction with reversal entry', async () => {
    const cats = await models.category.getAll();
    const incomeCat = cats.find(c => c.type === 'income');

    const id = await models.transaction.save({
      type: 'income',
      date: '2026-03-05',
      amount_cents: 20000,
      description: 'Storno-Test',
      category_id: incomeCat.id,
    });

    const cancelId = await models.transaction.cancel(id);
    assert.ok(cancelId > 0);

    const original = await models.transaction.getById(id);
    assert.equal(original.cancelled, 1);

    const reversal = await models.transaction.getById(cancelId);
    assert.equal(reversal.amount_cents, -20000);
    assert.equal(reversal.cancel_ref, id);
  });

  it('excludes cancelled transactions by default', async () => {
    const active = await models.transaction.getAll();
    const withCancelled = await models.transaction.getAll({ include_cancelled: true });
    assert.ok(withCancelled.length > active.length);
  });
});

describe('Rechnung Lokal — Customer Workflow', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.2.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );
  });

  after(() => db.close());

  it('creates customer with auto-number', async () => {
    const id = await models.person.save({
      company: 'Musterfirma GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      type: 'customer',
      email: 'max@musterfirma.de',
      is_b2b: true,
    });
    assert.ok(id > 0);
    const c = await models.person.getById(id);
    assert.ok(c.person_number.startsWith('K'), `Number starts with K: ${c.person_number}`);
    assert.equal(c.is_b2b, 1);
  });

  it('searches customers', async () => {
    await models.person.save({ company: 'Alpha GmbH', type: 'customer' });
    await models.person.save({ company: 'Beta AG', type: 'customer' });

    const results = await models.person.search('Alpha');
    assert.equal(results.length, 1);
    assert.equal(results[0].company, 'Alpha GmbH');
  });

  it('updates customer', async () => {
    const id = await models.person.save({
      company: 'Update Test',
      type: 'customer',
    });

    await models.person.save({
      id,
      company: 'Update Test GmbH',
      city: 'Hamburg',
    });

    const updated = await models.person.getById(id);
    assert.equal(updated.company, 'Update Test GmbH');
    assert.equal(updated.city, 'Hamburg');
  });

  it('soft-deletes customer', async () => {
    const id = await models.person.save({
      company: 'Zu Loeschen',
      type: 'customer',
    });

    await models.person.remove(id);
    const all = await models.person.getAll();
    assert.ok(!all.find(p => p.id === id), 'Deleted customer should not appear in getAll');

    const deleted = await models.person.getById(id);
    assert.equal(deleted.status, 'deleted');
  });

  it('filters invoices by customer', async () => {
    const c1 = await models.person.save({ company: 'Kunde A', type: 'customer' });
    const c2 = await models.person.save({ company: 'Kunde B', type: 'customer' });

    await models.invoice.save({
      person_id: c1, issue_date: '2026-03-01', status: 'draft',
    }, [{ description: 'Service A', quantity: 1, unit_price_cents: 10000 }]);

    await models.invoice.save({
      person_id: c2, issue_date: '2026-03-01', status: 'draft',
    }, [{ description: 'Service B', quantity: 1, unit_price_cents: 20000 }]);

    const invoicesA = await models.invoice.getAll({ person_id: c1 });
    assert.equal(invoicesA.length, 1);
    assert.equal(invoicesA[0].subtotal_cents, 10000);
  });
});

describe('Rechnung Lokal — Invoice Number Generation', () => {
  let db, models;

  before(async () => {
    db = await createTestDb();
    await createSchema(db.execute, productConfig.features, {
      product_id: productConfig.product,
      app_version: '0.2.0',
    });
    await seedCategories(db.execute, db.query);
    models = createModels(
      { query: db.query, execute: db.execute, audit: createTestAudit(db) },
      productConfig.features,
    );
  });

  after(() => db.close());

  it('generates first number as RE-YYYY-0001', async () => {
    const num = await models.invoice.nextNumber('RE', 2026, 'yearly');
    assert.equal(num, 'RE-2026-0001');
  });

  it('increments number after first invoice', async () => {
    const customerId = await models.person.save({ company: 'Num Test', type: 'customer' });
    await models.invoice.save({
      person_id: customerId,
      issue_date: '2026-03-01',
      prefix: 'RE',
      number_mode: 'yearly',
    }, [{ description: 'Test', quantity: 1, unit_price_cents: 1000 }]);

    const next = await models.invoice.nextNumber('RE', 2026, 'yearly');
    assert.equal(next, 'RE-2026-0002');
  });

  it('supports custom prefix', async () => {
    const num = await models.invoice.nextNumber('INV', 2026, 'yearly');
    assert.equal(num, 'INV-2026-0001');
  });

  it('supports continuous numbering mode', async () => {
    const customerId = await models.person.save({ company: 'Cont Test', type: 'customer' });
    await models.invoice.save({
      person_id: customerId,
      issue_date: '2025-12-01',
      prefix: 'X',
      number_mode: 'continuous',
    }, [{ description: 'Test', quantity: 1, unit_price_cents: 1000 }]);

    const next = await models.invoice.nextNumber('X', 2026, 'continuous');
    assert.match(next, /^X-2026-0002$/);
  });
});
