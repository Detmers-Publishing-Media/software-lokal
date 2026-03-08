/**
 * EUeR category model — maps to Anlage EUER lines.
 */

export function createCategoryModel({ query, execute }) {
  async function getAll(type) {
    if (type) {
      return query('SELECT * FROM category WHERE type = ? AND active = 1 ORDER BY sort_order, name', [type]);
    }
    return query('SELECT * FROM category WHERE active = 1 ORDER BY type, sort_order, name');
  }

  async function getById(id) {
    const rows = await query('SELECT * FROM category WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async function save(cat) {
    if (cat.id) {
      await execute(
        'UPDATE category SET code = ?, name = ?, type = ?, euer_line = ?, sort_order = ?, active = ? WHERE id = ?',
        [cat.code, cat.name, cat.type, cat.euer_line ?? '', cat.sort_order ?? 0, cat.active ?? 1, cat.id]
      );
      return cat.id;
    }
    const result = await execute(
      'INSERT INTO category (code, name, type, euer_line, sort_order) VALUES (?, ?, ?, ?, ?)',
      [cat.code, cat.name, cat.type, cat.euer_line ?? '', cat.sort_order ?? 0]
    );
    return result.lastInsertRowid ?? result.lastInsertId ?? result.changes;
  }

  return { getAll, getById, save };
}
