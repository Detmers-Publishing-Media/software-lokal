import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, testHmac } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { createModels } from '../src/models/index.js';

describe('Invoice model', () => {
  let db, models, customerId;

  beforeEach(async () => {
    db = await createTestDb();
    await createSchema(db.execute, { invoices: true }, { product_id: 'rechnung-lokal', app_version: '0.1.0' });
    models = createModels({ ...db, computeHmac: testHmac }, { invoices: true });

    customerId = await models.person.save({
      first_name: 'Test', last_name: 'Kunde', is_b2b: true,
    });
  });

  afterEach(() => db.close());

  const sampleItems = [
    { description: 'Beratung 2h', quantity: 2, unit: 'Stunde', unit_price_cents: 8000, tax_rate: 1900 },
    { description: 'Fahrtkosten', quantity: 1, unit: 'Pauschale', unit_price_cents: 3000, tax_rate: 1900 },
  ];

  it('creates an invoice with items', async () => {
    const id = await models.invoice.save(
      { person_id: customerId, issue_date: '2026-03-01' },
      sampleItems,
    );

    assert.ok(id > 0);
    const inv = await models.invoice.getWithItems(id);
    assert.equal(inv.items.length, 2);
    assert.equal(inv.status, 'draft');
    // 2*8000 + 1*3000 = 19000
    assert.equal(inv.subtotal_cents, 19000);
  });

  it('calculates totals correctly (with tax)', async () => {
    const totals = models.invoice.calculateTotals(sampleItems, false);
    // subtotal: 16000 + 3000 = 19000
    // tax: 16000*0.19 + 3000*0.19 = 3040 + 570 = 3610
    assert.equal(totals.subtotal_cents, 19000);
    assert.equal(totals.tax_cents, 3610);
    assert.equal(totals.total_cents, 22610);
  });

  it('calculates totals correctly (Kleinunternehmer, no tax)', async () => {
    const totals = models.invoice.calculateTotals(sampleItems, true);
    assert.equal(totals.subtotal_cents, 19000);
    assert.equal(totals.tax_cents, 0);
    assert.equal(totals.total_cents, 19000);
  });

  it('generates sequential invoice numbers', async () => {
    const num1 = await models.invoice.nextNumber('RE', 2026);
    assert.equal(num1, 'RE-2026-0001');

    await models.invoice.save(
      { person_id: customerId, invoice_number: 'RE-2026-0001' },
      [sampleItems[0]],
    );

    const num2 = await models.invoice.nextNumber('RE', 2026);
    assert.equal(num2, 'RE-2026-0002');
  });

  it('marks invoice as paid', async () => {
    const id = await models.invoice.save(
      { person_id: customerId, status: 'sent' },
      sampleItems,
    );

    await models.invoice.markPaid(id, '2026-03-15');
    const inv = await models.invoice.getById(id);
    assert.equal(inv.status, 'paid');
    assert.equal(inv.paid_date, '2026-03-15');
  });

  it('cancels an invoice (Storno)', async () => {
    const id = await models.invoice.save(
      { person_id: customerId, status: 'sent' },
      sampleItems,
    );

    await models.invoice.cancel(id);
    const inv = await models.invoice.getById(id);
    assert.equal(inv.status, 'cancelled');
  });

  it('cannot cancel an already cancelled invoice', async () => {
    const id = await models.invoice.save(
      { person_id: customerId, status: 'sent' },
      sampleItems,
    );
    await models.invoice.cancel(id);

    await assert.rejects(
      () => models.invoice.cancel(id),
      /already cancelled/,
    );
  });

  it('creates invoice from template', async () => {
    const templateId = await models.invoice.save(
      { person_id: customerId, status: 'draft' },
      sampleItems,
    );

    const newId = await models.invoice.createFromTemplate(templateId);
    assert.ok(newId !== templateId);

    const newInv = await models.invoice.getWithItems(newId);
    assert.equal(newInv.items.length, 2);
    assert.equal(newInv.status, 'draft');
    assert.equal(newInv.template_of, templateId);
  });

  it('filters invoices by status', async () => {
    await models.invoice.save({ person_id: customerId, status: 'draft' }, sampleItems);
    const sentId = await models.invoice.save({ person_id: customerId, status: 'sent' }, sampleItems);
    await models.invoice.markPaid(sentId);

    const drafts = await models.invoice.getAll({ status: 'draft' });
    assert.equal(drafts.length, 1);

    const paid = await models.invoice.getAll({ status: 'paid' });
    assert.equal(paid.length, 1);
  });

  it('logs events for invoice operations', async () => {
    const id = await models.invoice.save({ person_id: customerId }, sampleItems);
    await models.invoice.markPaid(id, '2026-03-15');

    const events = await models.eventLog.getEvents();
    const types = events.map(e => e.type);
    assert.ok(types.includes('RechnungErstellt'));
    assert.ok(types.includes('RechnungBezahlt'));
  });
});
