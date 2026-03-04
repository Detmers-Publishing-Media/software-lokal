import { query, execute, openDb } from '@codefabrik/vereins-shared/db';

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

export async function initDb() {
  await openDb();
  for (const sql of MIGRATION_SQL) {
    await execute(sql);
  }
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
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      member.first_name, member.last_name, member.street, member.zip, member.city,
      member.phone, member.email, member.birth_date, member.entry_date, member.exit_date,
      member.exit_reason, member.status, member.fee_class_id, member.notes,
      member.id,
    ]);
    return member.id;
  } else {
    const number = await getNextMemberNumber();
    const result = await execute(`
      INSERT INTO members (member_number, first_name, last_name, street, zip, city,
        phone, email, birth_date, entry_date, exit_date, exit_reason, status,
        fee_class_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      number, member.first_name, member.last_name, member.street, member.zip, member.city,
      member.phone, member.email, member.birth_date, member.entry_date, member.exit_date,
      member.exit_reason, member.status, member.fee_class_id, member.notes,
    ]);
    return result.lastInsertId;
  }
}

export async function deleteMember(id) {
  await execute('DELETE FROM members WHERE id = ?', [id]);
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
  } else {
    await execute(
      'INSERT INTO fee_classes (name, amount_cents, interval) VALUES (?, ?, ?)',
      [fc.name, fc.amount_cents, fc.interval]
    );
  }
}
