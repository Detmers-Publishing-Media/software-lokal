/**
 * @typedef {Object} Member
 * @property {number} id
 * @property {string} member_number
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} [street]
 * @property {string} [zip]
 * @property {string} [city]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [birth_date]
 * @property {string} entry_date
 * @property {string} [exit_date]
 * @property {string} [exit_reason]
 * @property {'aktiv'|'passiv'|'ausgetreten'|'verstorben'} status
 * @property {number} [fee_class_id]
 * @property {string} [notes]
 * @property {string} [consent_phone] - ISO date or null
 * @property {string} [consent_email] - ISO date or null
 * @property {string} [consent_photo_internal] - ISO date or null
 * @property {string} [consent_photo_public] - ISO date or null
 * @property {string} [consent_withdrawn_at] - ISO date or null
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} FeeClass
 * @property {number} id
 * @property {string} name
 * @property {number} amount_cents
 * @property {'monatlich'|'vierteljaehrlich'|'halbjaehrlich'|'jaehrlich'} interval
 * @property {number} active
 */

/**
 * @typedef {Object} ClubProfile
 * @property {number} id
 * @property {string} name
 * @property {string} [street]
 * @property {string} [zip]
 * @property {string} [city]
 * @property {string} [register_court]
 * @property {string} [register_number]
 * @property {string} [tax_id]
 * @property {string} [iban]
 * @property {string} [bic]
 * @property {string} [bank_name]
 * @property {string} [contact_email]
 * @property {string} [contact_phone]
 * @property {string} [chairman]
 * @property {string} [logo_path]
 */

/**
 * @typedef {Object} Payment
 * @property {number} id
 * @property {number} member_id
 * @property {number} year
 * @property {number} amount_cents
 * @property {string} paid_date
 * @property {'bar'|'ueberweisung'} payment_method
 * @property {string} [notes]
 * @property {string} created_at
 */

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bar', label: 'Bar' },
  { value: 'ueberweisung', label: 'Ueberweisung' },
];

/**
 * Calculate annual amount from interval-based amount.
 * @param {number} amountCents - Amount in cents per interval
 * @param {'monatlich'|'vierteljaehrlich'|'halbjaehrlich'|'jaehrlich'} interval
 * @returns {number} Annual amount in cents
 */
export function annualAmountCents(amountCents, interval) {
  switch (interval) {
    case 'monatlich': return amountCents * 12;
    case 'vierteljaehrlich': return amountCents * 4;
    case 'halbjaehrlich': return amountCents * 2;
    case 'jaehrlich': return amountCents;
    default: return amountCents;
  }
}

export const STATUS_OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'passiv', label: 'Passiv' },
  { value: 'ausgetreten', label: 'Ausgetreten' },
  { value: 'verstorben', label: 'Verstorben' },
];
