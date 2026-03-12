/**
 * @typedef {Object} Kunde
 * @property {number} id
 * @property {string} anrede
 * @property {string} vorname
 * @property {string} nachname
 * @property {string} geburtsdatum
 * @property {string} familienstand
 * @property {string} beruf
 * @property {string} beruf_status
 * @property {string} arbeitgeber
 * @property {string} branche
 * @property {number} raucher
 * @property {number} groesse_cm
 * @property {number} gewicht_kg
 * @property {string} vorerkrankungen
 * @property {string} medikamente
 * @property {string} notizen
 * @property {number} partner_id
 */

export const ANREDE_OPTIONS = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
];

export const FAMILIENSTAND_OPTIONS = [
  { value: 'ledig', label: 'Ledig' },
  { value: 'verheiratet', label: 'Verheiratet' },
  { value: 'geschieden', label: 'Geschieden' },
  { value: 'verwitwet', label: 'Verwitwet' },
];

export const BERUF_STATUS_OPTIONS = [
  { value: 'angestellt', label: 'Angestellt' },
  { value: 'selbstaendig', label: 'Selbstaendig' },
  { value: 'verbeamtet', label: 'Verbeamtet' },
  { value: 'student', label: 'Student/in' },
  { value: 'azubi', label: 'Auszubildende/r' },
  { value: 'rentner', label: 'Rentner/in' },
];

export const SPARTEN = [
  'Privathaftpflicht', 'Hausrat', 'Wohngebaeude', 'BU', 'Risikoleben',
  'Kfz-Haftpflicht', 'Kfz-Kasko', 'Rechtsschutz', 'Unfallversicherung',
  'Zahnzusatz', 'Pflegezusatz', 'KV (GKV)', 'KV (PKV)', 'KV-Zusatz',
  'Tierhalterhaftpflicht', 'Gewerblich', 'Sonstige',
];

export const EINNAHMEN_TYPEN = [
  { value: 'brutto', label: 'Bruttoeinkommen' },
  { value: 'netto', label: 'Nettoeinkommen' },
  { value: 'sonderzahlung', label: 'Sonderzahlung (Urlaubs-/Weihnachtsgeld)' },
  { value: 'mieteinnahmen', label: 'Mieteinnahmen' },
  { value: 'kapitalertraege', label: 'Kapitalertraege' },
  { value: 'kindergeld', label: 'Kindergeld' },
  { value: 'unterhalt', label: 'Unterhalt (Eingang)' },
  { value: 'sonstige', label: 'Sonstige Einnahmen' },
];

export const AUSGABEN_KATEGORIEN = [
  { value: 'miete', label: 'Miete' },
  { value: 'kreditrate', label: 'Kreditrate (Eigenheim)' },
  { value: 'nebenkosten', label: 'Nebenkosten' },
  { value: 'strom', label: 'Strom' },
  { value: 'internet', label: 'Internet / Telefon / Mobilfunk' },
  { value: 'lebensmittel', label: 'Lebensmittel' },
  { value: 'kleidung', label: 'Kleidung' },
  { value: 'kinder', label: 'Kinder (Kita, Schule, etc.)' },
  { value: 'auto_rate', label: 'Auto - Rate/Leasing' },
  { value: 'auto_versicherung', label: 'Auto - Versicherung' },
  { value: 'auto_kraftstoff', label: 'Auto - Kraftstoff/Wartung' },
  { value: 'freizeit', label: 'Freizeit / Hobbys' },
  { value: 'urlaub', label: 'Urlaub (monatl. Ruecklage)' },
  { value: 'sonstige', label: 'Sonstige Ausgaben' },
];

export const VERMOEGEN_TYPEN = [
  { value: 'tagesgeld', label: 'Tagesgeld' },
  { value: 'festgeld', label: 'Festgeld' },
  { value: 'depot_etf', label: 'Depot / ETF' },
  { value: 'depot_aktien', label: 'Depot / Aktien' },
  { value: 'depot_fonds', label: 'Depot / Fonds' },
  { value: 'bausparer', label: 'Bausparvertrag' },
  { value: 'immobilie_selbst', label: 'Immobilie (selbstgenutzt)' },
  { value: 'immobilie_vermietet', label: 'Immobilie (vermietet)' },
  { value: 'sonstige', label: 'Sonstiges' },
];

export const VERBINDLICHKEITEN_TYPEN = [
  { value: 'immobilienkredit', label: 'Immobilienkredit' },
  { value: 'autokredit', label: 'Autokredit' },
  { value: 'privatkredit', label: 'Privatkredit / Ratenkredit' },
  { value: 'studienkredit', label: 'Studienkredit' },
  { value: 'dispokredit', label: 'Dispositionskredit' },
  { value: 'sonstige', label: 'Sonstiges' },
];

export const ALTERSVORSORGE_TYPEN = [
  { value: 'gesetzliche_rente', label: 'Gesetzliche Rente' },
  { value: 'riester', label: 'Riester-Rente' },
  { value: 'ruerup', label: 'Ruerup / Basisrente' },
  { value: 'bav', label: 'Betriebliche AV' },
  { value: 'private_rv', label: 'Private Rentenversicherung' },
  { value: 'kapital_lv', label: 'Kapitallebensversicherung' },
  { value: 'etf_sparplan', label: 'ETF-/Fondssparplan (Altersvorsorge)' },
  { value: 'sonstige', label: 'Sonstiges' },
];

export const BEWERTUNG_OPTIONS = [
  { value: 'gruen', label: 'Gut', color: '#38a169' },
  { value: 'gelb', label: 'Pruefen', color: '#d69e2e' },
  { value: 'rot', label: 'Handlungsbedarf', color: '#e53e3e' },
];
