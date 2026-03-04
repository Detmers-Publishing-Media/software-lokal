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

export const STATUS_OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'passiv', label: 'Passiv' },
  { value: 'ausgetreten', label: 'Ausgetreten' },
  { value: 'verstorben', label: 'Verstorben' },
];
