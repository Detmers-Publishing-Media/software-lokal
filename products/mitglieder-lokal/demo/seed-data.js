/**
 * Seed data for demo recording.
 * Inserts 5 test members + club profile + fee payments into the demo DB.
 */

import { execute, query } from './browser-db-mock.js';

const MEMBERS = [
  {
    member_number: '1001', first_name: 'Hans', last_name: 'Mueller',
    street: 'Hauptstr. 12', zip: '30159', city: 'Hannover',
    phone: '0511-9876543', email: 'hans.mueller@example.de',
    birth_date: '1965-03-15', entry_date: '2018-01-01',
    status: 'aktiv', fee_class_id: 1, notes: null,
    consent_phone: '2024-01-15', consent_email: null,
    consent_photo_internal: null, consent_photo_public: null,
  },
  {
    member_number: '1002', first_name: 'Petra', last_name: 'Schmidt',
    street: 'Gartenweg 5', zip: '30161', city: 'Hannover',
    phone: '0511-1234567', email: 'petra.schmidt@example.de',
    birth_date: '1988-07-22', entry_date: '2020-04-01',
    status: 'aktiv', fee_class_id: 2, notes: null,
    consent_phone: '2024-04-01', consent_email: '2024-04-01',
    consent_photo_internal: null, consent_photo_public: null,
  },
  {
    member_number: '1003', first_name: 'Klaus', last_name: 'Wagner',
    street: 'Lindenallee 3', zip: '30163', city: 'Hannover',
    phone: null, email: 'klaus.wagner@example.de',
    birth_date: '1952-11-08', entry_date: '1995-06-15',
    status: 'aktiv', fee_class_id: 3, notes: 'Gruendungsmitglied',
    consent_phone: null, consent_email: '2024-01-01',
    consent_photo_internal: '2024-01-01', consent_photo_public: null,
  },
  {
    member_number: '1004', first_name: 'Maria', last_name: 'Fischer',
    street: 'Am Markt 8', zip: '30165', city: 'Hannover',
    phone: '0511-5555555', email: null,
    birth_date: '1975-12-01', entry_date: '2022-09-01',
    status: 'aktiv', fee_class_id: 1, notes: null,
    consent_phone: '2024-09-01', consent_email: null,
    consent_photo_internal: null, consent_photo_public: null,
  },
  {
    member_number: '1005', first_name: 'Thomas', last_name: 'Bauer',
    street: 'Waldstr. 22', zip: '30167', city: 'Hannover',
    phone: '0511-7777777', email: 'thomas.bauer@example.de',
    birth_date: '1990-05-30', entry_date: '2023-01-15',
    status: 'aktiv', fee_class_id: 4, notes: null,
    consent_phone: null, consent_email: '2024-01-15',
    consent_photo_internal: null, consent_photo_public: null,
  },
];

const CLUB_PROFILE = {
  name: 'Turnverein Hannover 1880 e.V.',
  street: 'Sportplatzweg 1',
  zip: '30159',
  city: 'Hannover',
  register_court: 'Amtsgericht Hannover',
  register_number: 'VR 12345',
  tax_id: '27/123/45678',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
  bank_name: 'Commerzbank Hannover',
  contact_email: 'vorstand@tv-hannover.de',
  contact_phone: '0511-8888888',
  chairman: 'Dr. Sabine Meier',
  logo_path: '',
};

const FEE_CLASS_JUGEND = {
  name: 'Jugend',
  amount_cents: 1500,
  interval: 'jaehrlich',
};

// Payments for the current year
const PAYMENTS = [
  // Mueller: fully paid (Vollmitglied = 60 EUR)
  { member_id: 1, year: 2026, amount_cents: 6000, paid_date: '2026-01-15', payment_method: 'ueberweisung', notes: 'Jahresbeitrag 2026' },
  // Schmidt: partially paid (Ermaessigt = 30 EUR, paid 15)
  { member_id: 2, year: 2026, amount_cents: 1500, paid_date: '2026-02-01', payment_method: 'bar', notes: 'Teilzahlung' },
  // Wagner: Ehrenmitglied — exempt, no payment needed
  // Fischer: open (Vollmitglied = 60 EUR, no payment)
  // Bauer: Foerdermitglied = 120 EUR, no payment yet
];

export async function seedDemoData() {
  // Insert additional fee class "Jugend"
  await execute(
    'INSERT INTO fee_classes (name, amount_cents, interval) VALUES (?, ?, ?)',
    [FEE_CLASS_JUGEND.name, FEE_CLASS_JUGEND.amount_cents, FEE_CLASS_JUGEND.interval]
  );

  // Insert members
  for (const m of MEMBERS) {
    await execute(`
      INSERT INTO members (
        member_number, first_name, last_name, street, zip, city,
        phone, email, birth_date, entry_date, status, fee_class_id, notes,
        consent_phone, consent_email, consent_photo_internal, consent_photo_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      m.member_number, m.first_name, m.last_name, m.street, m.zip, m.city,
      m.phone, m.email, m.birth_date, m.entry_date, m.status, m.fee_class_id, m.notes,
      m.consent_phone, m.consent_email, m.consent_photo_internal, m.consent_photo_public,
    ]);
  }

  // Club profile
  const p = CLUB_PROFILE;
  await execute(`
    UPDATE club_profile SET
      name = ?, street = ?, zip = ?, city = ?,
      register_court = ?, register_number = ?, tax_id = ?,
      iban = ?, bic = ?, bank_name = ?,
      contact_email = ?, contact_phone = ?, chairman = ?, logo_path = ?
    WHERE id = 1
  `, [
    p.name, p.street, p.zip, p.city,
    p.register_court, p.register_number, p.tax_id,
    p.iban, p.bic, p.bank_name,
    p.contact_email, p.contact_phone, p.chairman, p.logo_path,
  ]);

  // Payments
  for (const pay of PAYMENTS) {
    await execute(`
      INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [pay.member_id, pay.year, pay.amount_cents, pay.paid_date, pay.payment_method, pay.notes]);
  }

  console.log(`Demo seed: ${MEMBERS.length} members, ${PAYMENTS.length} payments, club profile set.`);
}
