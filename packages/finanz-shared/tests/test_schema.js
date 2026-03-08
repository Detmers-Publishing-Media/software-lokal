import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/test-db.js';
import { createSchema, SCHEMA_VERSION } from '../src/db/index.js';

describe('Schema creation', () => {
  let db;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it('creates core tables for minimal feature set', async () => {
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('profile'), 'profile table exists');
    assert.ok(tables.includes('person'), 'person table exists');
    assert.ok(tables.includes('person_group'), 'person_group table exists');
    assert.ok(tables.includes('transaction'), 'transaction table exists');
    assert.ok(tables.includes('category'), 'category table exists');
    assert.ok(tables.includes('document'), 'document table exists');
    assert.ok(tables.includes('events'), 'events table exists');
    assert.ok(tables.includes('_schema_meta'), '_schema_meta table exists');
  });

  it('does NOT create invoice tables without feature flag', async () => {
    await createSchema(db.execute, { invoices: false }, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(!tables.includes('invoice'), 'invoice table NOT created');
    assert.ok(!tables.includes('invoice_item'), 'invoice_item table NOT created');
  });

  it('creates invoice tables with feature flag', async () => {
    await createSchema(db.execute, { invoices: true }, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('invoice'), 'invoice table created');
    assert.ok(tables.includes('invoice_item'), 'invoice_item table created');
  });

  it('creates fee tables with feature flag', async () => {
    await createSchema(db.execute, { fees: true }, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('fee_class'), 'fee_class table created');
    assert.ok(tables.includes('payment'), 'payment table created');
  });

  it('creates donation table with feature flag', async () => {
    await createSchema(db.execute, { donations: true }, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('donation'), 'donation table created');
  });

  it('creates assembly tables with feature flag', async () => {
    await createSchema(db.execute, { assembly: true }, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('assembly'), 'assembly table created');
    assert.ok(tables.includes('assembly_item'), 'assembly_item table created');
    assert.ok(tables.includes('attendance'), 'attendance table created');
  });

  it('creates all tables for Rechnung Lokal feature set', async () => {
    const rechnungFeatures = { invoices: true, customers: true, euer: true, zugferd: true };
    await createSchema(db.execute, rechnungFeatures, { product_id: 'rechnung-lokal', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('invoice'), 'invoice table');
    assert.ok(tables.includes('invoice_item'), 'invoice_item table');
    assert.ok(!tables.includes('fee_class'), 'NO fee_class table');
    assert.ok(!tables.includes('donation'), 'NO donation table');
  });

  it('creates all tables for Mitglieder Lokal feature set', async () => {
    const mitgliederFeatures = { members: true, fees: true, donations: true, assembly: true, euer: true };
    await createSchema(db.execute, mitgliederFeatures, { product_id: 'mitglieder-lokal', app_version: '0.1.0' });

    const tables = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).map(r => r.name);

    assert.ok(tables.includes('fee_class'), 'fee_class table');
    assert.ok(tables.includes('payment'), 'payment table');
    assert.ok(tables.includes('donation'), 'donation table');
    assert.ok(tables.includes('assembly'), 'assembly table');
    assert.ok(!tables.includes('invoice'), 'NO invoice table');
  });

  it('writes schema meta with product_id', async () => {
    await createSchema(db.execute, {}, { product_id: 'rechnung-lokal', app_version: '1.0.0' });

    const meta = db.query('SELECT * FROM _schema_meta WHERE id = 1');
    assert.equal(meta.length, 1);
    assert.equal(meta[0].product_id, 'rechnung-lokal');
    assert.equal(meta[0].schema_version, SCHEMA_VERSION);
    assert.equal(meta[0].app_version, '1.0.0');
  });

  it('profile has singleton constraint', async () => {
    await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });

    const profile = db.query('SELECT * FROM profile WHERE id = 1');
    assert.equal(profile.length, 1, 'profile row seeded');

    assert.throws(() => {
      db.execute("INSERT INTO profile (id) VALUES (2)");
    }, 'cannot insert profile with id != 1');
  });

  it('is idempotent (can run twice)', async () => {
    const features = { invoices: true, fees: true };
    await createSchema(db.execute, features, { product_id: 'test', app_version: '0.1.0' });
    await createSchema(db.execute, features, { product_id: 'test', app_version: '0.1.0' });

    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'");
    assert.ok(tables.length > 0, 'tables exist after double creation');
  });
});
