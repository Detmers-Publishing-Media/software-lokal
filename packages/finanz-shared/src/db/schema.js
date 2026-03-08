/**
 * Feature-aware schema creation for finanz-shared.
 * Only creates tables for activated features.
 */

// --- Core tables (always created) ---

const SCHEMA_PROFILE = `
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  street TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  city TEXT DEFAULT '',
  tax_id TEXT DEFAULT '',
  vat_id TEXT DEFAULT '',
  iban TEXT DEFAULT '',
  bic TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  representative TEXT DEFAULT '',
  logo_path TEXT DEFAULT '',
  is_small_business INTEGER NOT NULL DEFAULT 0,
  default_tax_rate INTEGER NOT NULL DEFAULT 1900,
  invoice_prefix TEXT NOT NULL DEFAULT 'RE',
  invoice_number_mode TEXT NOT NULL DEFAULT 'yearly' CHECK (invoice_number_mode IN ('yearly', 'continuous')),
  invoice_next_number INTEGER NOT NULL DEFAULT 1,
  register_court TEXT DEFAULT '',
  register_number TEXT DEFAULT '',
  exemption_notice TEXT DEFAULT ''
)`;

const SCHEMA_PROFILE_SEED = `INSERT OR IGNORE INTO profile (id) VALUES (1)`;

const SCHEMA_PERSON = `
CREATE TABLE IF NOT EXISTS person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'customer'
    CHECK (type IN ('customer', 'member')),
  company TEXT DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  street TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT 'DE',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  vat_id TEXT DEFAULT '',
  is_b2b INTEGER NOT NULL DEFAULT 0,
  birth_date TEXT,
  entry_date TEXT,
  exit_date TEXT,
  exit_reason TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'deleted')),
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_PERSON_GROUP = `
CREATE TABLE IF NOT EXISTS person_group (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
)`;

const SCHEMA_PERSON_GROUP_M = `
CREATE TABLE IF NOT EXISTS person_group_m (
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES person_group(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, group_id)
)`;

const SCHEMA_TRANSACTION = `
CREATE TABLE IF NOT EXISTS "transaction" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  tax_rate INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES category(id),
  invoice_id INTEGER,
  receipt_path TEXT DEFAULT '',
  cancelled INTEGER NOT NULL DEFAULT 0,
  cancel_ref INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_CATEGORY = `
CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  euer_line TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
)`;

const SCHEMA_DOCUMENT = `
CREATE TABLE IF NOT EXISTS document (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  ref_type TEXT,
  ref_id INTEGER,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_EVENTS = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'app',
  version INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  hash TEXT NOT NULL,
  prev_hash TEXT NOT NULL
)`;

const SCHEMA_EVENTS_IDX = `CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`;

const SCHEMA_META = `
CREATE TABLE IF NOT EXISTS _schema_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  product_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  app_version TEXT NOT NULL,
  last_migration TEXT,
  event_replay_at TEXT
)`;

// --- Invoice tables (feature: invoices) ---

const SCHEMA_INVOICE = `
CREATE TABLE IF NOT EXISTS invoice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  person_id INTEGER NOT NULL REFERENCES person(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date TEXT NOT NULL DEFAULT (date('now')),
  due_date TEXT,
  paid_date TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  is_zugferd INTEGER NOT NULL DEFAULT 0,
  cancel_ref INTEGER,
  template_of INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_INVOICE_ITEM = `
CREATE TABLE IF NOT EXISTS invoice_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Stueck',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate INTEGER NOT NULL DEFAULT 1900,
  line_total_cents INTEGER NOT NULL DEFAULT 0
)`;

const SCHEMA_INVOICE_IDX = `CREATE INDEX IF NOT EXISTS idx_invoice_person ON invoice(person_id)`;

// --- Fee tables (feature: fees) ---

const SCHEMA_FEE_CLASS = `
CREATE TABLE IF NOT EXISTS fee_class (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'jaehrlich'
    CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
  active INTEGER NOT NULL DEFAULT 1
)`;

const SCHEMA_PAYMENT = `
CREATE TABLE IF NOT EXISTS payment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  paid_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'ueberweisung'
    CHECK (payment_method IN ('bar', 'ueberweisung')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_PAYMENT_IDX = `CREATE INDEX IF NOT EXISTS idx_payment_person_year ON payment(person_id, year)`;

// --- Donation tables (feature: donations) ---

const SCHEMA_DONATION = `
CREATE TABLE IF NOT EXISTS donation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL REFERENCES person(id),
  amount_cents INTEGER NOT NULL,
  donation_date TEXT NOT NULL,
  purpose TEXT DEFAULT '',
  receipt_issued INTEGER NOT NULL DEFAULT 0,
  receipt_date TEXT,
  receipt_number TEXT,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

// --- Assembly tables (feature: assembly) ---

const SCHEMA_ASSEMBLY = `
CREATE TABLE IF NOT EXISTS assembly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  assembly_date TEXT NOT NULL,
  location TEXT DEFAULT '',
  total_members INTEGER NOT NULL DEFAULT 0,
  quorum_required INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const SCHEMA_ASSEMBLY_ITEM = `
CREATE TABLE IF NOT EXISTS assembly_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assembly_id INTEGER NOT NULL REFERENCES assembly(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  vote_yes INTEGER DEFAULT 0,
  vote_no INTEGER DEFAULT 0,
  vote_abstain INTEGER DEFAULT 0,
  result TEXT DEFAULT ''
)`;

const SCHEMA_ATTENDANCE = `
CREATE TABLE IF NOT EXISTS attendance (
  assembly_id INTEGER NOT NULL REFERENCES assembly(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  present INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (assembly_id, person_id)
)`;

/**
 * Create schema based on product features.
 * @param {Function} exec — executes SQL (async or sync)
 * @param {Object} features — feature flags from product.config.js
 * @param {Object} meta — { product_id, app_version }
 */
export async function createSchema(exec, features, meta) {
  // Core tables (always)
  await exec(SCHEMA_PROFILE);
  await exec(SCHEMA_PROFILE_SEED);
  await exec(SCHEMA_PERSON);
  await exec(SCHEMA_PERSON_GROUP);
  await exec(SCHEMA_PERSON_GROUP_M);
  await exec(SCHEMA_TRANSACTION);
  await exec(SCHEMA_CATEGORY);
  await exec(SCHEMA_DOCUMENT);
  await exec(SCHEMA_EVENTS);
  await exec(SCHEMA_EVENTS_IDX);
  await exec(SCHEMA_META);

  // Feature-dependent
  if (features.invoices) {
    await exec(SCHEMA_INVOICE);
    await exec(SCHEMA_INVOICE_ITEM);
    await exec(SCHEMA_INVOICE_IDX);
  }
  if (features.fees) {
    await exec(SCHEMA_FEE_CLASS);
    await exec(SCHEMA_PAYMENT);
    await exec(SCHEMA_PAYMENT_IDX);
  }
  if (features.donations) {
    await exec(SCHEMA_DONATION);
  }
  if (features.assembly) {
    await exec(SCHEMA_ASSEMBLY);
    await exec(SCHEMA_ASSEMBLY_ITEM);
    await exec(SCHEMA_ATTENDANCE);
  }

  // Schema meta
  await exec(
    `INSERT OR REPLACE INTO _schema_meta (id, product_id, schema_version, app_version, last_migration)
     VALUES (1, '${meta.product_id}', 1, '${meta.app_version}', datetime('now'))`
  );
}

export const SCHEMA_VERSION = 1;
