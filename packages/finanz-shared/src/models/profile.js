/**
 * Business/Club profile — singleton table.
 */

export function createProfileModel({ query, execute, eventLog }) {
  async function get() {
    const rows = await query('SELECT * FROM profile WHERE id = 1');
    return rows[0] ?? null;
  }

  async function save(profile) {
    await execute(`
      UPDATE profile SET
        name = ?, street = ?, zip = ?, city = ?,
        tax_id = ?, vat_id = ?,
        iban = ?, bic = ?, bank_name = ?,
        contact_email = ?, contact_phone = ?,
        representative = ?, logo_path = ?,
        is_small_business = ?, default_tax_rate = ?,
        invoice_prefix = ?, invoice_number_mode = ?, invoice_next_number = ?,
        register_court = ?, register_number = ?,
        exemption_notice = ?
      WHERE id = 1
    `, [
      profile.name ?? '', profile.street ?? '', profile.zip ?? '', profile.city ?? '',
      profile.tax_id ?? '', profile.vat_id ?? '',
      profile.iban ?? '', profile.bic ?? '', profile.bank_name ?? '',
      profile.contact_email ?? '', profile.contact_phone ?? '',
      profile.representative ?? '', profile.logo_path ?? '',
      profile.is_small_business ? 1 : 0, profile.default_tax_rate ?? 1900,
      profile.invoice_prefix ?? 'RE', profile.invoice_number_mode ?? 'yearly', profile.invoice_next_number ?? 1,
      profile.register_court ?? '', profile.register_number ?? '',
      profile.exemption_notice ?? '',
    ]);
    await eventLog.append('ProfilGespeichert', { ...profile });
  }

  return { get, save };
}
