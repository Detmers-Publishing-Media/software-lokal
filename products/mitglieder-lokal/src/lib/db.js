import { query, execute } from '@codefabrik/app-shared/db';
import { computeHmac } from '@codefabrik/shared/crypto';

const MIGRATION_SQL = [
  `CREATE TABLE IF NOT EXISTS fee_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'jaehrlich'
      CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `INSERT OR IGNORE INTO fee_classes (id, name, amount_cents, interval) VALUES
    (1, 'Vollmitglied', 6000, 'jaehrlich'),
    (2, 'Ermaessigt', 3000, 'jaehrlich'),
    (3, 'Ehrenmitglied', 0, 'jaehrlich'),
    (4, 'Foerdermitglied', 12000, 'jaehrlich')`,
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    street TEXT,
    zip TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    birth_date TEXT,
    entry_date TEXT NOT NULL DEFAULT (date('now')),
    exit_date TEXT,
    exit_reason TEXT,
    status TEXT NOT NULL DEFAULT 'aktiv'
      CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
    fee_class_id INTEGER REFERENCES fee_classes(id),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

// Migration 002: DSGVO consent columns (ALTERs wrapped in try/catch — SQLite has no IF NOT EXISTS for ALTER)
const DSGVO_COLUMNS = [
  'consent_phone', 'consent_email', 'consent_photo_internal',
  'consent_photo_public', 'consent_withdrawn_at',
];

// Migration 003: Club profile singleton
const CLUB_PROFILE_SQL = [
  `CREATE TABLE IF NOT EXISTS club_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    street TEXT DEFAULT '',
    zip TEXT DEFAULT '',
    city TEXT DEFAULT '',
    register_court TEXT DEFAULT '',
    register_number TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    iban TEXT DEFAULT '',
    bic TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    chairman TEXT DEFAULT '',
    logo_path TEXT DEFAULT ''
  )`,
  `INSERT OR IGNORE INTO club_profile (id) VALUES (1)`,
];

// Migration 004: Event-Log + Schema meta
const EVENT_LOG_SQL = [
  `CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,
    timestamp   TEXT NOT NULL,
    actor       TEXT NOT NULL DEFAULT 'app',
    version     INTEGER NOT NULL DEFAULT 1,
    data        TEXT NOT NULL,
    hash        TEXT NOT NULL,
    prev_hash   TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`,
  `CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL,
    last_migration TEXT,
    event_replay_at TEXT
  )`,
];

// Migration 005: Fee payments
const FEE_PAYMENTS_SQL = [
  `CREATE TABLE IF NOT EXISTS fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'ueberweisung'
      CHECK (payment_method IN ('bar', 'ueberweisung')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_fee_payments_member_year ON fee_payments(member_id, year)`,
];

export async function initDb() {
  // DB is opened in main process — IPC calls work immediately
  for (const sql of MIGRATION_SQL) {
    await execute(sql);
  }
  // Migration 002: DSGVO consent columns
  for (const col of DSGVO_COLUMNS) {
    try { await execute(`ALTER TABLE members ADD COLUMN ${col} TEXT`); } catch (_) { /* already exists */ }
  }
  // Migration 003: Club profile
  for (const sql of CLUB_PROFILE_SQL) {
    await execute(sql);
  }
  // Migration 004: Event-Log + Schema meta
  for (const sql of EVENT_LOG_SQL) {
    await execute(sql);
  }
  // Migration 005: Fee payments
  for (const sql of FEE_PAYMENTS_SQL) {
    await execute(sql);
  }
  await execute(
    `INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version, last_migration) VALUES (1, 4, '0.4.0', datetime('now'))`
  );
  await appendEvent('AppGestartet', { version: '0.4.0', schema_version: 4 });
}

export async function getMembers() {
  return query(`
    SELECT m.*, fc.name as fee_class_name
    FROM members m
    LEFT JOIN fee_classes fc ON m.fee_class_id = fc.id
    ORDER BY m.last_name, m.first_name
  `);
}

export async function getMember(id) {
  const rows = await query('SELECT * FROM members WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function getNextMemberNumber() {
  const rows = await query("SELECT member_number FROM members ORDER BY CAST(member_number AS INTEGER) DESC LIMIT 1");
  if (rows.length === 0) return '1001';
  return String(parseInt(rows[0].member_number, 10) + 1);
}

export async function saveMember(member) {
  if (member.id) {
    await execute(`
      UPDATE members SET
        first_name = ?, last_name = ?, street = ?, zip = ?, city = ?,
        phone = ?, email = ?, birth_date = ?, entry_date = ?, exit_date = ?,
        exit_reason = ?, status = ?, fee_class_id = ?, notes = ?,
        consent_phone = ?, consent_email = ?, consent_photo_internal = ?,
        consent_photo_public = ?, consent_withdrawn_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      member.first_name, member.last_name, member.street, member.zip, member.city,
      member.phone, member.email, member.birth_date, member.entry_date, member.exit_date,
      member.exit_reason, member.status, member.fee_class_id, member.notes,
      member.consent_phone ?? null, member.consent_email ?? null,
      member.consent_photo_internal ?? null, member.consent_photo_public ?? null,
      member.consent_withdrawn_at ?? null,
      member.id,
    ]);
    await appendEvent('MitgliedGeaendert', { ...member });
    return member.id;
  } else {
    const number = await getNextMemberNumber();
    const result = await execute(`
      INSERT INTO members (member_number, first_name, last_name, street, zip, city,
        phone, email, birth_date, entry_date, exit_date, exit_reason, status,
        fee_class_id, notes, consent_phone, consent_email, consent_photo_internal,
        consent_photo_public, consent_withdrawn_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      number, member.first_name, member.last_name, member.street, member.zip, member.city,
      member.phone, member.email, member.birth_date, member.entry_date, member.exit_date,
      member.exit_reason, member.status, member.fee_class_id, member.notes,
      member.consent_phone ?? null, member.consent_email ?? null,
      member.consent_photo_internal ?? null, member.consent_photo_public ?? null,
      member.consent_withdrawn_at ?? null,
    ]);
    await appendEvent('MitgliedAngelegt', { id: result.lastInsertId, member_number: number, ...member });
    return result.lastInsertId;
  }
}

export async function deleteMember(id) {
  const member = await getMember(id);
  await execute('DELETE FROM members WHERE id = ?', [id]);
  await appendEvent('MitgliedGeloescht', { id, member_number: member?.member_number });
}

export async function getFeeClasses() {
  return query('SELECT * FROM fee_classes WHERE active = 1 ORDER BY name');
}

export async function saveFeeClass(fc) {
  if (fc.id) {
    await execute(
      'UPDATE fee_classes SET name = ?, amount_cents = ?, interval = ?, active = ? WHERE id = ?',
      [fc.name, fc.amount_cents, fc.interval, fc.active, fc.id]
    );
    await appendEvent('BeitragsklasseGeaendert', { ...fc });
  } else {
    const result = await execute(
      'INSERT INTO fee_classes (name, amount_cents, interval) VALUES (?, ?, ?)',
      [fc.name, fc.amount_cents, fc.interval]
    );
    await appendEvent('BeitragsklasseAngelegt', { id: result.lastInsertId, ...fc });
  }
}

export async function getClubProfile() {
  const rows = await query('SELECT * FROM club_profile WHERE id = 1');
  return rows[0] ?? null;
}

export async function saveClubProfile(profile) {
  await execute(`
    UPDATE club_profile SET
      name = ?, street = ?, zip = ?, city = ?,
      register_court = ?, register_number = ?, tax_id = ?,
      iban = ?, bic = ?, bank_name = ?,
      contact_email = ?, contact_phone = ?, chairman = ?, logo_path = ?
    WHERE id = 1
  `, [
    profile.name, profile.street, profile.zip, profile.city,
    profile.register_court, profile.register_number, profile.tax_id,
    profile.iban, profile.bic, profile.bank_name,
    profile.contact_email, profile.contact_phone, profile.chairman, profile.logo_path,
  ]);
  await appendEvent('VereinsprofilGespeichert', { ...profile });
}

export async function getActiveMemberCount() {
  const rows = await query(
    "SELECT COUNT(*) as count FROM members WHERE status NOT IN ('ausgetreten', 'verstorben')"
  );
  return rows[0]?.count ?? 0;
}

// --- Payments ---

export async function savePayment(payment) {
  if (payment.id) {
    await execute(`
      UPDATE fee_payments SET
        member_id = ?, year = ?, amount_cents = ?, paid_date = ?,
        payment_method = ?, notes = ?
      WHERE id = ?
    `, [
      payment.member_id, payment.year, payment.amount_cents, payment.paid_date,
      payment.payment_method, payment.notes ?? null, payment.id,
    ]);
    await appendEvent('BeitragGeaendert', { ...payment });
    return payment.id;
  } else {
    const result = await execute(`
      INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      payment.member_id, payment.year, payment.amount_cents, payment.paid_date,
      payment.payment_method, payment.notes ?? null,
    ]);
    await appendEvent('BeitragGezahlt', { id: result.lastInsertId, ...payment });
    return result.lastInsertId;
  }
}

export async function deletePayment(id) {
  const rows = await query('SELECT * FROM fee_payments WHERE id = ?', [id]);
  const payment = rows[0] ?? null;
  await execute('DELETE FROM fee_payments WHERE id = ?', [id]);
  await appendEvent('BeitragGeloescht', { id, ...payment });
}

export async function getPaymentsByMember(memberId, year) {
  if (year) {
    return query(
      'SELECT * FROM fee_payments WHERE member_id = ? AND year = ? ORDER BY paid_date DESC',
      [memberId, year]
    );
  }
  return query(
    'SELECT * FROM fee_payments WHERE member_id = ? ORDER BY year DESC, paid_date DESC',
    [memberId]
  );
}

export async function getAnnualOverview(year) {
  return query(`
    SELECT
      m.id, m.member_number, m.first_name, m.last_name, m.status,
      fc.name as fee_class_name, fc.amount_cents, fc.interval,
      COALESCE(p.paid_cents, 0) as paid_cents
    FROM members m
    LEFT JOIN fee_classes fc ON m.fee_class_id = fc.id
    LEFT JOIN (
      SELECT member_id, SUM(amount_cents) as paid_cents
      FROM fee_payments WHERE year = ?
      GROUP BY member_id
    ) p ON m.id = p.member_id
    WHERE m.status IN ('aktiv', 'passiv')
    ORDER BY m.last_name, m.first_name
  `, [year]);
}

export async function getOverdueMembers(year) {
  const overview = await getAnnualOverview(year);
  return overview.filter(m => {
    const expected = annualCents(m.amount_cents, m.interval);
    return expected > 0 && m.paid_cents < expected;
  });
}

function annualCents(amountCents, interval) {
  if (!amountCents) return 0;
  switch (interval) {
    case 'monatlich': return amountCents * 12;
    case 'vierteljaehrlich': return amountCents * 4;
    case 'halbjaehrlich': return amountCents * 2;
    case 'jaehrlich': return amountCents;
    default: return amountCents;
  }
}

// --- Event-Log ---

export async function appendEvent(type, data, actor = 'app') {
  const prev = await query('SELECT id, hash FROM events ORDER BY id DESC LIMIT 1');
  const prevHash = prev[0]?.hash ?? '0';
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
  const hash = await computeHmac(message);

  await execute(
    'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)',
    [type, timestamp, actor, dataJson, hash, prevHash]
  );
}

export async function verifyChain(limit = 100) {
  const events = await query('SELECT * FROM events ORDER BY id DESC LIMIT ?', [limit]);
  events.reverse();
  const errors = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const expectedPrev = i === 0 ? e.prev_hash : events[i - 1].hash;
    if (i > 0 && e.prev_hash !== expectedPrev) {
      errors.push({ event_id: e.id, error: 'prev_hash mismatch' });
    }
    const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
    const expectedHash = await computeHmac(message);
    if (e.hash !== expectedHash) {
      errors.push({ event_id: e.id, error: 'hash mismatch' });
    }
  }
  return { valid: errors.length === 0, errors, checked: events.length };
}
