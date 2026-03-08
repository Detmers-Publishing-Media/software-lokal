/**
 * Person model — "Kunde" in Rechnung Lokal, "Mitglied" in Mitglieder Lokal.
 */

export function createPersonModel({ query, execute, eventLog }) {
  async function getAll() {
    return query(`
      SELECT * FROM person
      WHERE status != 'deleted'
      ORDER BY last_name, first_name, company
    `);
  }

  async function getById(id) {
    const rows = await query('SELECT * FROM person WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async function search(term) {
    const like = `%${term}%`;
    return query(`
      SELECT * FROM person
      WHERE status != 'deleted'
        AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR person_number LIKE ?)
      ORDER BY last_name, first_name
    `, [like, like, like, like]);
  }

  async function getNextNumber(prefix = 'K') {
    const rows = await query(
      "SELECT person_number FROM person ORDER BY CAST(REPLACE(person_number, ?, '') AS INTEGER) DESC LIMIT 1",
      [prefix]
    );
    if (rows.length === 0) return `${prefix}1001`;
    const num = parseInt(rows[0].person_number.replace(prefix, ''), 10);
    return `${prefix}${num + 1}`;
  }

  async function save(person) {
    if (person.id) {
      await execute(`
        UPDATE person SET
          company = ?, first_name = ?, last_name = ?,
          street = ?, zip = ?, city = ?, country = ?,
          phone = ?, email = ?, vat_id = ?, is_b2b = ?,
          birth_date = ?, entry_date = ?, exit_date = ?, exit_reason = ?,
          status = ?, notes = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [
        person.company ?? '', person.first_name ?? '', person.last_name ?? '',
        person.street ?? '', person.zip ?? '', person.city ?? '', person.country ?? 'DE',
        person.phone ?? '', person.email ?? '', person.vat_id ?? '', person.is_b2b ? 1 : 0,
        person.birth_date ?? null, person.entry_date ?? null,
        person.exit_date ?? null, person.exit_reason ?? null,
        person.status ?? 'active', person.notes ?? '',
        person.id,
      ]);
      await eventLog.append('PersonGeaendert', { ...person });
      return person.id;
    }

    const number = person.person_number || await getNextNumber();
    const result = await execute(`
      INSERT INTO person (
        person_number, type, company, first_name, last_name,
        street, zip, city, country,
        phone, email, vat_id, is_b2b,
        birth_date, entry_date, exit_date, exit_reason,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      number, person.type ?? 'customer',
      person.company ?? '', person.first_name ?? '', person.last_name ?? '',
      person.street ?? '', person.zip ?? '', person.city ?? '', person.country ?? 'DE',
      person.phone ?? '', person.email ?? '', person.vat_id ?? '', person.is_b2b ? 1 : 0,
      person.birth_date ?? null, person.entry_date ?? null,
      person.exit_date ?? null, person.exit_reason ?? null,
      person.status ?? 'active', person.notes ?? '',
    ]);
    const id = result.lastInsertRowid ?? result.lastInsertId ?? result.changes;
    await eventLog.append('PersonAngelegt', { id, person_number: number, ...person });
    return id;
  }

  async function remove(id) {
    const person = await getById(id);
    await execute("UPDATE person SET status = 'deleted', updated_at = datetime('now') WHERE id = ?", [id]);
    await eventLog.append('PersonGeloescht', { id, person_number: person?.person_number });
  }

  async function getActiveCount() {
    const rows = await query("SELECT COUNT(*) as count FROM person WHERE status = 'active'");
    return rows[0]?.count ?? 0;
  }

  return { getAll, getById, search, getNextNumber, save, remove, getActiveCount };
}
