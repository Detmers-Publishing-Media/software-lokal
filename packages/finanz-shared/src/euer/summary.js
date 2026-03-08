/**
 * EUeR summary calculations — year overview, month overview, saldo.
 */

/**
 * Calculate annual summary grouped by category.
 * @param {Function} query — DB query function
 * @param {number} year — fiscal year
 * @returns {{ income, expenses, categories, profit }}
 */
export async function annualSummary(query, year) {
  const rows = await query(`
    SELECT
      c.id as category_id, c.code, c.name as category_name,
      c.type as category_type, c.euer_line,
      SUM(t.amount_cents) as total_cents,
      SUM(t.tax_cents) as total_tax_cents,
      COUNT(t.id) as tx_count
    FROM "transaction" t
    LEFT JOIN category c ON t.category_id = c.id
    WHERE strftime('%Y', t.date) = ?
      AND t.cancelled = 0
    GROUP BY c.id
    ORDER BY c.type, c.sort_order
  `, [String(year)]);

  let totalIncome = 0;
  let totalExpenses = 0;
  const categories = [];

  for (const row of rows) {
    const entry = {
      category_id: row.category_id,
      code: row.code ?? 'OHNE',
      name: row.category_name ?? 'Ohne Kategorie',
      type: row.category_type ?? 'expense',
      euer_line: row.euer_line ?? '',
      total_cents: row.total_cents,
      total_tax_cents: row.total_tax_cents,
      tx_count: row.tx_count,
    };
    categories.push(entry);

    if (entry.type === 'income') {
      totalIncome += entry.total_cents;
    } else {
      totalExpenses += Math.abs(entry.total_cents);
    }
  }

  return {
    year,
    income_cents: totalIncome,
    expense_cents: totalExpenses,
    profit_cents: totalIncome - totalExpenses,
    categories,
  };
}

/**
 * Calculate monthly overview for a year.
 * @param {Function} query — DB query function
 * @param {number} year — fiscal year
 * @returns {Array<{ month, income_cents, expense_cents, saldo_cents }>}
 */
export async function monthlySummary(query, year) {
  const rows = await query(`
    SELECT
      CAST(strftime('%m', t.date) AS INTEGER) as month,
      t.type,
      SUM(t.amount_cents) as total_cents
    FROM "transaction" t
    WHERE strftime('%Y', t.date) = ?
      AND t.cancelled = 0
    GROUP BY month, t.type
    ORDER BY month
  `, [String(year)]);

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const income = rows.find(r => r.month === m && r.type === 'income');
    const expense = rows.find(r => r.month === m && r.type === 'expense');
    const incomeCents = income?.total_cents ?? 0;
    const expenseCents = Math.abs(expense?.total_cents ?? 0);
    months.push({
      month: m,
      income_cents: incomeCents,
      expense_cents: expenseCents,
      saldo_cents: incomeCents - expenseCents,
    });
  }
  return months;
}

/**
 * Running saldo up to a given date.
 * @param {Function} query — DB query function
 * @param {string} [upToDate] — ISO date string, defaults to today
 * @returns {{ income_cents, expense_cents, saldo_cents }}
 */
export async function runningSaldo(query, upToDate) {
  const date = upToDate ?? new Date().toISOString().slice(0, 10);
  const rows = await query(`
    SELECT type, SUM(amount_cents) as total
    FROM "transaction"
    WHERE date <= ? AND cancelled = 0
    GROUP BY type
  `, [date]);

  const income = rows.find(r => r.type === 'income')?.total ?? 0;
  const expense = Math.abs(rows.find(r => r.type === 'expense')?.total ?? 0);
  return { income_cents: income, expense_cents: expense, saldo_cents: income - expense };
}
