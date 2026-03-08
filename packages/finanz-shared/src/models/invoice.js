/**
 * Invoice model — create, update, cancel invoices.
 * Invoices are never deleted, only cancelled (Storno).
 */

export function createInvoiceModel({ query, execute, eventLog }) {
  async function getAll(filters = {}) {
    let sql = 'SELECT i.*, p.first_name, p.last_name, p.company FROM invoice i LEFT JOIN person p ON i.person_id = p.id';
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('i.status = ?');
      params.push(filters.status);
    }
    if (filters.person_id) {
      conditions.push('i.person_id = ?');
      params.push(filters.person_id);
    }
    if (filters.year) {
      conditions.push("strftime('%Y', i.issue_date) = ?");
      params.push(String(filters.year));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY i.issue_date DESC, i.id DESC';
    return query(sql, params);
  }

  async function getById(id) {
    const rows = await query('SELECT * FROM invoice WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async function getItems(invoiceId) {
    return query('SELECT * FROM invoice_item WHERE invoice_id = ? ORDER BY position', [invoiceId]);
  }

  async function getWithItems(id) {
    const invoice = await getById(id);
    if (!invoice) return null;
    invoice.items = await getItems(id);
    return invoice;
  }

  function calculateTotals(items, isSmallBusiness) {
    let subtotal = 0;
    let taxTotal = 0;
    for (const item of items) {
      const lineTotal = Math.round(item.quantity * item.unit_price_cents);
      subtotal += lineTotal;
      if (!isSmallBusiness) {
        taxTotal += Math.round(lineTotal * (item.tax_rate ?? 1900) / 10000);
      }
    }
    return { subtotal_cents: subtotal, tax_cents: taxTotal, total_cents: subtotal + taxTotal };
  }

  async function nextNumber(prefix = 'RE', year, mode = 'yearly') {
    const y = year ?? new Date().getFullYear();

    if (mode === 'continuous') {
      // Continuous: find highest number across all years
      const pattern = `${prefix}-%`;
      const rows = await query(
        "SELECT invoice_number FROM invoice WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1",
        [pattern]
      );
      if (rows.length === 0) return `${prefix}-${y}-0001`;
      const last = rows[0].invoice_number;
      const seq = parseInt(last.split('-').pop(), 10);
      return `${prefix}-${y}-${String(seq + 1).padStart(4, '0')}`;
    }

    // Yearly: reset counter per year (default)
    const pattern = `${prefix}-${y}-%`;
    const rows = await query(
      "SELECT invoice_number FROM invoice WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1",
      [pattern]
    );
    if (rows.length === 0) return `${prefix}-${y}-0001`;
    const last = rows[0].invoice_number;
    const seq = parseInt(last.split('-').pop(), 10);
    return `${prefix}-${y}-${String(seq + 1).padStart(4, '0')}`;
  }

  async function save(invoice, items, isSmallBusiness = false) {
    const totals = calculateTotals(items, isSmallBusiness);

    if (invoice.id) {
      await execute(`
        UPDATE invoice SET
          person_id = ?, status = ?, issue_date = ?, due_date = ?, paid_date = ?,
          subtotal_cents = ?, tax_cents = ?, total_cents = ?,
          notes = ?, is_zugferd = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [
        invoice.person_id, invoice.status ?? 'draft',
        invoice.issue_date, invoice.due_date ?? null, invoice.paid_date ?? null,
        totals.subtotal_cents, totals.tax_cents, totals.total_cents,
        invoice.notes ?? '', invoice.is_zugferd ? 1 : 0,
        invoice.id,
      ]);
      // Replace items
      await execute('DELETE FROM invoice_item WHERE invoice_id = ?', [invoice.id]);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineTotal = Math.round(item.quantity * item.unit_price_cents);
        await execute(`
          INSERT INTO invoice_item (invoice_id, position, description, quantity, unit, unit_price_cents, tax_rate, line_total_cents)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [invoice.id, i + 1, item.description, item.quantity, item.unit ?? 'Stueck', item.unit_price_cents, item.tax_rate ?? 1900, lineTotal]);
      }
      await eventLog.append('RechnungGeaendert', { id: invoice.id, ...totals });
      return invoice.id;
    }

    const invoiceNumber = invoice.invoice_number || await nextNumber(invoice.prefix, invoice.year, invoice.number_mode);
    const result = await execute(`
      INSERT INTO invoice (invoice_number, person_id, status, issue_date, due_date,
        subtotal_cents, tax_cents, total_cents, notes, is_zugferd, template_of)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber, invoice.person_id, invoice.status ?? 'draft',
      invoice.issue_date ?? new Date().toISOString().slice(0, 10),
      invoice.due_date ?? null,
      totals.subtotal_cents, totals.tax_cents, totals.total_cents,
      invoice.notes ?? '', invoice.is_zugferd ? 1 : 0,
      invoice.template_of ?? null,
    ]);
    const id = result.lastInsertRowid ?? result.lastInsertId ?? result.changes;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineTotal = Math.round(item.quantity * item.unit_price_cents);
      await execute(`
        INSERT INTO invoice_item (invoice_id, position, description, quantity, unit, unit_price_cents, tax_rate, line_total_cents)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, i + 1, item.description, item.quantity, item.unit ?? 'Stueck', item.unit_price_cents, item.tax_rate ?? 1900, lineTotal]);
    }

    await eventLog.append('RechnungErstellt', { id, invoice_number: invoiceNumber, ...totals });
    return id;
  }

  async function cancel(id) {
    const invoice = await getById(id);
    if (!invoice) throw new Error(`Invoice ${id} not found`);
    if (invoice.status === 'cancelled') throw new Error(`Invoice ${id} already cancelled`);

    await execute(
      "UPDATE invoice SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?",
      [id]
    );

    // Create negative transaction if income existed
    await eventLog.append('RechnungStorniert', { id, invoice_number: invoice.invoice_number });
  }

  async function markPaid(id, paidDate) {
    const date = paidDate ?? new Date().toISOString().slice(0, 10);
    await execute(
      "UPDATE invoice SET status = 'paid', paid_date = ?, updated_at = datetime('now') WHERE id = ?",
      [date, id]
    );
    const invoice = await getById(id);
    await eventLog.append('RechnungBezahlt', { id, invoice_number: invoice.invoice_number, paid_date: date });
  }

  async function createFromTemplate(templateId) {
    const template = await getWithItems(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const { id: _id, invoice_number: _num, status: _s, paid_date: _pd, created_at: _ca, updated_at: _ua, items, ...data } = template;
    const newInvoice = { ...data, status: 'draft', template_of: templateId };
    const newItems = items.map(({ id: _iid, invoice_id: _iinv, ...item }) => item);
    return save(newInvoice, newItems);
  }

  return { getAll, getById, getItems, getWithItems, nextNumber, save, cancel, markPaid, createFromTemplate, calculateTotals };
}
