/**
 * Transaction model — income and expenses.
 * Income can be auto-created from paid invoices.
 * Transactions are never deleted, only cancelled (Storno).
 */

export function createTransactionModel({ query, execute, eventLog }) {
  async function getAll(filters = {}) {
    let sql = 'SELECT t.*, c.name as category_name, c.code as category_code FROM "transaction" t LEFT JOIN category c ON t.category_id = c.id';
    const conditions = [];
    const params = [];

    if (filters.type) {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }
    if (filters.year) {
      conditions.push("strftime('%Y', t.date) = ?");
      params.push(String(filters.year));
    }
    if (filters.month) {
      conditions.push("strftime('%m', t.date) = ?");
      params.push(String(filters.month).padStart(2, '0'));
    }
    if (filters.category_id) {
      conditions.push('t.category_id = ?');
      params.push(filters.category_id);
    }
    if (!filters.include_cancelled) {
      conditions.push('t.cancelled = 0');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY t.date DESC, t.id DESC';
    return query(sql, params);
  }

  async function getById(id) {
    const rows = await query('SELECT * FROM "transaction" WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async function save(tx) {
    const taxCents = tx.tax_cents ?? Math.round((tx.amount_cents ?? 0) * (tx.tax_rate ?? 0) / 10000);

    if (tx.id) {
      await execute(`
        UPDATE "transaction" SET
          type = ?, date = ?, amount_cents = ?, tax_rate = ?, tax_cents = ?,
          description = ?, category_id = ?, invoice_id = ?, receipt_path = ?
        WHERE id = ? AND cancelled = 0
      `, [
        tx.type, tx.date, tx.amount_cents, tx.tax_rate ?? 0, taxCents,
        tx.description ?? '', tx.category_id ?? null,
        tx.invoice_id ?? null, tx.receipt_path ?? '',
        tx.id,
      ]);
      await eventLog.append('BuchungGeaendert', { id: tx.id, type: tx.type, amount_cents: tx.amount_cents });
      return tx.id;
    }

    const result = await execute(`
      INSERT INTO "transaction" (type, date, amount_cents, tax_rate, tax_cents,
        description, category_id, invoice_id, receipt_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tx.type, tx.date, tx.amount_cents, tx.tax_rate ?? 0, taxCents,
      tx.description ?? '', tx.category_id ?? null,
      tx.invoice_id ?? null, tx.receipt_path ?? '',
    ]);
    const id = result.lastInsertRowid ?? result.lastInsertId ?? result.changes;
    await eventLog.append('BuchungErfasst', { id, type: tx.type, amount_cents: tx.amount_cents });
    return id;
  }

  async function cancel(id) {
    const tx = await getById(id);
    if (!tx) throw new Error(`Transaction ${id} not found`);
    if (tx.cancelled) throw new Error(`Transaction ${id} already cancelled`);

    // Mark as cancelled
    await execute('UPDATE "transaction" SET cancelled = 1 WHERE id = ?', [id]);

    // Create reversal entry
    const result = await execute(`
      INSERT INTO "transaction" (type, date, amount_cents, tax_rate, tax_cents,
        description, category_id, cancel_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tx.type, new Date().toISOString().slice(0, 10),
      -tx.amount_cents, tx.tax_rate, -tx.tax_cents,
      `Storno: ${tx.description}`, tx.category_id, id,
    ]);
    const cancelId = result.lastInsertRowid ?? result.lastInsertId ?? result.changes;
    await eventLog.append('BuchungStorniert', { id, cancel_id: cancelId });
    return cancelId;
  }

  async function createFromInvoice(invoice) {
    return save({
      type: 'income',
      date: invoice.paid_date ?? new Date().toISOString().slice(0, 10),
      amount_cents: invoice.total_cents,
      tax_rate: 0,
      tax_cents: invoice.tax_cents,
      description: `Rechnung ${invoice.invoice_number}`,
      invoice_id: invoice.id,
    });
  }

  return { getAll, getById, save, cancel, createFromInvoice };
}
