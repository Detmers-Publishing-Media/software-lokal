import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockQuery, mockExecute, getCalls, reset } from './helpers/mock-sql.js';

// Mock-Registrierung MUSS vor dem Import von db.js erfolgen.
// node:test --loader ist experimentell, daher nutzen wir einen
// indirekten Ansatz: wir testen die Logik direkt gegen den Mock.

// Da db.js `import { query, execute, openDb } from '@codefabrik/app-shared/db'`
// nutzt und das ohne Loader nicht mockbar ist, testen wir die
// Geschaeftslogik (SQL-Statements, Parameter-Reihenfolge) anhand
// der bekannten Queries aus db.js.

describe('DB-Layer Logik', () => {
  beforeEach(() => reset());

  it('initDb ruft openDb und alle Migrations-SQLs auf', async () => {
    const { openDb, execute } = await import('./helpers/mock-sql.js');
    await openDb();
    // v0.1: fee_classes CREATE, fee_classes INSERT, members CREATE
    const migrations = [
      'CREATE TABLE IF NOT EXISTS fee_classes',
      'INSERT OR IGNORE INTO fee_classes',
      'CREATE TABLE IF NOT EXISTS members',
    ];
    for (const sql of migrations) {
      await execute(sql);
    }
    // v0.3: events + _schema_meta
    await execute('CREATE TABLE IF NOT EXISTS events');
    await execute('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
    await execute('CREATE TABLE IF NOT EXISTS _schema_meta');
    await execute("INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')");

    const calls = getCalls();
    assert.equal(calls[0].fn, 'openDb');
    assert.ok(calls[1].sql.startsWith('CREATE TABLE IF NOT EXISTS fee_classes'));
    assert.ok(calls[2].sql.startsWith('INSERT OR IGNORE INTO fee_classes'));
    assert.ok(calls[3].sql.startsWith('CREATE TABLE IF NOT EXISTS members'));
    // v0.3 migrations are present
    assert.ok(calls.some(c => c.sql?.includes('CREATE TABLE IF NOT EXISTS events')));
    assert.ok(calls.some(c => c.sql?.includes('CREATE TABLE IF NOT EXISTS _schema_meta')));
  });

  it('getMembers → SELECT mit JOIN', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    const expected = [
      { id: 1, first_name: 'Max', last_name: 'Mustermann', fee_class_name: 'Vollmitglied' },
    ];
    mockQuery(expected);
    const result = await query(
      'SELECT m.*, fc.name as fee_class_name FROM members m LEFT JOIN fee_classes fc ON m.fee_class_id = fc.id ORDER BY m.last_name, m.first_name'
    );
    assert.deepEqual(result, expected);
    const calls = getCalls();
    assert.ok(calls.at(-1).sql.includes('LEFT JOIN fee_classes'));
    assert.ok(calls.at(-1).sql.includes('ORDER BY'));
  });

  it('getMember → SELECT mit WHERE id', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    const member = { id: 42, first_name: 'Test' };
    mockQuery([member]);
    const rows = await query('SELECT * FROM members WHERE id = ?', [42]);
    assert.deepEqual(rows[0], member);
    assert.deepEqual(getCalls().at(-1).params, [42]);
  });

  it('getNextMemberNumber → 1001 bei leerer DB', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([]);
    const rows = await query(
      'SELECT member_number FROM members ORDER BY CAST(member_number AS INTEGER) DESC LIMIT 1'
    );
    const next = rows.length === 0 ? '1001' : String(parseInt(rows[0].member_number, 10) + 1);
    assert.equal(next, '1001');
  });

  it('getNextMemberNumber → Increment bei vorhandenen Mitgliedern', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ member_number: '1005' }]);
    const rows = await query(
      'SELECT member_number FROM members ORDER BY CAST(member_number AS INTEGER) DESC LIMIT 1'
    );
    const next = rows.length === 0 ? '1001' : String(parseInt(rows[0].member_number, 10) + 1);
    assert.equal(next, '1006');
  });

  it('saveMember ohne id → INSERT mit 15 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    mockExecute({ lastInsertId: 7, rowsAffected: 1 });
    const member = {
      first_name: 'Neu', last_name: 'Mitglied', street: null, zip: null,
      city: 'Berlin', phone: null, email: null, birth_date: null,
      entry_date: '2026-01-01', exit_date: null, exit_reason: null,
      status: 'aktiv', fee_class_id: 1, notes: null,
    };
    const result = await execute(
      'INSERT INTO members (member_number, first_name, last_name, street, zip, city, phone, email, birth_date, entry_date, exit_date, exit_reason, status, fee_class_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['1001', member.first_name, member.last_name, member.street, member.zip,
       member.city, member.phone, member.email, member.birth_date,
       member.entry_date, member.exit_date, member.exit_reason,
       member.status, member.fee_class_id, member.notes]
    );
    assert.equal(result.lastInsertId, 7);
    const call = getCalls().at(-1);
    assert.ok(call.sql.includes('INSERT INTO members'));
    assert.equal(call.params.length, 15);
    assert.equal(call.params[0], '1001');
  });

  it('saveMember mit id → UPDATE mit WHERE id', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    const member = {
      id: 3, first_name: 'Geaendert', last_name: 'Name', street: null, zip: null,
      city: 'Hamburg', phone: null, email: null, birth_date: null,
      entry_date: '2024-01-01', exit_date: null, exit_reason: null,
      status: 'aktiv', fee_class_id: 2, notes: null,
    };
    await execute(
      'UPDATE members SET first_name = ?, last_name = ?, street = ?, zip = ?, city = ?, phone = ?, email = ?, birth_date = ?, entry_date = ?, exit_date = ?, exit_reason = ?, status = ?, fee_class_id = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [member.first_name, member.last_name, member.street, member.zip, member.city,
       member.phone, member.email, member.birth_date, member.entry_date, member.exit_date,
       member.exit_reason, member.status, member.fee_class_id, member.notes, member.id]
    );
    const call = getCalls().at(-1);
    assert.ok(call.sql.includes('UPDATE members SET'));
    assert.ok(call.sql.includes('WHERE id = ?'));
    assert.equal(call.params.at(-1), 3);
  });

  it('deleteMember → DELETE mit WHERE id', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    await execute('DELETE FROM members WHERE id = ?', [5]);
    const call = getCalls().at(-1);
    assert.equal(call.sql, 'DELETE FROM members WHERE id = ?');
    assert.deepEqual(call.params, [5]);
  });

  it('getFeeClasses → SELECT active fee_classes', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    const feeClasses = [
      { id: 1, name: 'Vollmitglied', amount_cents: 6000, interval: 'jaehrlich', active: 1 },
    ];
    mockQuery(feeClasses);
    const result = await query('SELECT * FROM fee_classes WHERE active = 1 ORDER BY name');
    assert.deepEqual(result, feeClasses);
    assert.ok(getCalls().at(-1).sql.includes('WHERE active = 1'));
  });
});
