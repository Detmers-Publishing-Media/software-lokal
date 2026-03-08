/**
 * Integration tests for Rechnung Lokal product.
 * Validates that product.config features work with finanz-shared kernel.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, testHmac } from '../../../packages/finanz-shared/tests/helpers/test-db.js';
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
      { query: db.query, execute: db.execute, computeHmac: testHmac },
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
      { query: db.query, execute: db.execute, computeHmac: testHmac },
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
      { query: db.query, execute: db.execute, computeHmac: testHmac },
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
