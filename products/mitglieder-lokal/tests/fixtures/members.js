// Testdaten — spiegeln DB-Schema wider
export const MEMBERS = [
  {
    id: 1, member_number: '1001', first_name: 'Max', last_name: 'Mustermann',
    street: 'Musterstr. 1', zip: '12345', city: 'Berlin', phone: '030-1234567',
    email: 'max@example.de', birth_date: '1990-05-15', entry_date: '2024-01-15',
    exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 1,
    fee_class_name: 'Vollmitglied', notes: null,
    created_at: '2024-01-15T10:00:00', updated_at: '2024-01-15T10:00:00',
  },
  {
    id: 2, member_number: '1002', first_name: 'Erika', last_name: 'Musterfrau',
    street: null, zip: null, city: 'München', phone: null,
    email: 'erika@example.de', birth_date: '1985-11-20', entry_date: '2023-06-01',
    exit_date: null, exit_reason: null, status: 'passiv', fee_class_id: 2,
    fee_class_name: 'Ermaessigt', notes: 'Beitrag reduziert',
    created_at: '2023-06-01T08:00:00', updated_at: '2023-06-01T08:00:00',
  },
  {
    id: 3, member_number: '1003', first_name: 'Hans-Jürgen', last_name: 'Müller-Thürgau',
    street: 'Höhenweg 3', zip: '80331', city: 'München', phone: null,
    email: null, birth_date: null, entry_date: '2022-03-10',
    exit_date: '2025-12-31', exit_reason: 'Umzug', status: 'ausgetreten', fee_class_id: 1,
    fee_class_name: 'Vollmitglied', notes: null,
    created_at: '2022-03-10T12:00:00', updated_at: '2025-12-31T00:00:00',
  },
];

// Sonderfaelle fuer CSV-Export
export const MEMBER_WITH_SEMICOLON = {
  id: 4, member_number: '1004', first_name: 'Anna', last_name: 'Test;Fall',
  street: null, zip: null, city: 'Frankfurt; Main', phone: null,
  email: null, birth_date: null, entry_date: '2025-01-01',
  exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 1,
  fee_class_name: 'Vollmitglied', notes: 'Achtung; Sonderzeichen',
  created_at: '2025-01-01T00:00:00', updated_at: '2025-01-01T00:00:00',
};

export const MEMBER_WITH_QUOTES = {
  id: 5, member_number: '1005', first_name: 'Karl', last_name: 'von "dem" Berg',
  street: null, zip: null, city: 'Köln', phone: null,
  email: null, birth_date: null, entry_date: '2025-02-01',
  exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 3,
  fee_class_name: 'Ehrenmitglied', notes: null,
  created_at: '2025-02-01T00:00:00', updated_at: '2025-02-01T00:00:00',
};
