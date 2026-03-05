# Mehrsitz-Lizenzen — Implementierungsplan

Stand: Maerz 2026 | Ansatz A (N separate Keys pro Kauf) | MVP

---

## 1. Entscheidungen (Zusammenfassung)

| Thema | Entscheidung |
|-------|-------------|
| Grundansatz | **Ansatz A** — N separate Keys pro Kauf |
| Seat-Anzahl | Separate Digistore24-Produkte pro Stufe |
| Admin-Rolle | Gestrichen fuer MVP (jeder Key ist unabhaengig) |
| Key-Format | Neues CF-Format mit Rueckwaertskompatibilitaet |
| Recovery | `order_id` reicht (kein Recovery Secret) |
| Key-Uebergabe UX | Leichte Erinnerung, "Nicht mehr anzeigen" wenn erledigt |
| Enforcement | Soft (Trust + Audit), kein harter Seat-Count offline |
| Personenbezogene Daten | Rueckbau als Teil des Umbaus |

---

## 2. Key-Format

### Neues CF-Format

```
CF-B05-A7K9M2X4-3F
│  │   │         │
│  │   │         └── Checksum (2 Hex-Zeichen, gegen Tippfehler)
│  │   └──────────── Zufallsteil (8 alphanumerisch)
│  └──────────────── Bundle-ID (z.B. B05 = Vereins-Bundle)
└─────────────────── Code-Fabrik Praefix
```

### Rueckwaertskompatibilitaet

Alte UUID-Keys (`XXXX-XXXX-XXXX-XXXX`) bleiben gueltig. Die Shared Library
(`@codefabrik/shared/license`) muss beide Formate validieren:

```javascript
// Alt: XXXX-XXXX-XXXX-XXXX (UUID-basiert, 16 alphanumerisch)
const LEGACY_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Neu: CF-BXX-XXXXXXXX-XX
const CF_PATTERN = /^CF-[A-Z]\d{2}-[A-Z0-9]{8}-[A-F0-9]{2}$/;

export function validateLicenseFormat(key) {
  const upper = key?.toUpperCase();
  return LEGACY_PATTERN.test(upper) || CF_PATTERN.test(upper);
}
```

---

## 3. Digistore24-Integration: Seat-Counts

Separate Digistore24-Produkte pro Stufe. Das Portal mappt `product_id` auf
`seat_count` — kein Quantity-Feld, kein URL-Parameter.

| Digistore24-Produkt | Portal product_id | seat_count |
|---------------------|-------------------|------------|
| MitgliederSimple 1-Platz | mitglieder-simple-1 | 1 |
| MitgliederSimple 5-Platz | mitglieder-simple-5 | 5 |
| MitgliederSimple 10-Platz | mitglieder-simple-10 | 10 |
| Finanz-Rechner | finanz-rechner | 1 |

Das Mapping wird in der `products`-Tabelle gespeichert (neue Spalte `seat_count`).

---

## 4. DB-Schema (Soll-Zustand)

### Neue Tabelle: `orders`

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL UNIQUE,  -- Digistore24 order_id
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  seat_count INTEGER NOT NULL DEFAULT 1,
  transaction_id VARCHAR(100),
  source VARCHAR(20) DEFAULT 'digistore',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_orders_order_id ON orders(order_id);
```

### Neue Tabelle: `seats`

```sql
CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  order_ref INTEGER NOT NULL REFERENCES orders(id),
  seat_key VARCHAR(30) NOT NULL UNIQUE,   -- CF-Format oder UUID
  seat_index INTEGER NOT NULL,            -- 1..N
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT uq_order_seat UNIQUE (order_ref, seat_index)
);
CREATE INDEX idx_seats_seat_key ON seats(seat_key);
CREATE INDEX idx_seats_order_ref ON seats(order_ref);
```

### Spalte in `products`

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 1;
```

### Aenderungen an `licenses`

Die bestehende `licenses`-Tabelle bleibt fuer Legacy-Keys bestehen.
Neue Mehrsitz-Keys werden in `orders` + `seats` gespeichert.
Langfristig migrieren alle Keys auf das neue Schema.

### Migration bestehender Daten

```sql
-- Personenbezogene Daten entfernen
ALTER TABLE licenses ALTER COLUMN customer_email DROP NOT NULL;
UPDATE licenses SET customer_email = NULL, customer_name = NULL;

-- Bestehende Lizenzen als 1-Seat-Orders in neues Schema uebernehmen (optional, spaeter)
```

### IPN-Audit-Log: Personenbezogene Daten redacten

```sql
-- Bestehende Eintraege bereinigen
UPDATE digistore_ipn_log
SET payload = payload
  - 'email'
  - 'buyer_email'
  - 'buyer_first_name'
  - 'buyer_last_name'
WHERE payload ? 'email' OR payload ? 'buyer_email';
```

Neue IPN-Eintraege: Vor dem Speichern die personenbezogenen Felder aus dem
`payload`-JSONB entfernen.

---

## 5. API-Aenderungen

### IPN-Handler (`POST /api/digistore-ipn`)

Aktuell: 1 Key pro `on_payment`.
Neu: N Keys pro `on_payment` basierend auf `product_id → seat_count`.

```javascript
case 'on_payment': {
  const seatCount = await getSeatCountForProduct(req.body.product_id);
  await license.activateMultiSeatFromIPN({
    order_id: orderId,
    product_id: req.body.product_id,
    payment_id: req.body.payment_id,
    seat_count: seatCount,
  });
  // buyer_email und buyer_name werden NICHT mehr gespeichert
  await logIPN(event, orderId, null, redactPayload(req.body), 'success', null);
  break;
}
```

### Neue Funktion: `activateMultiSeatFromIPN`

```javascript
async function activateMultiSeatFromIPN({ order_id, product_id, payment_id, seat_count }) {
  // 1. Order anlegen (idempotent)
  const { rows } = await pool.query(`
    INSERT INTO orders (order_id, product_id, seat_count, transaction_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (order_id) DO UPDATE SET status = 'active'
    RETURNING id
  `, [order_id, product_id, seat_count, payment_id]);
  const orderRef = rows[0].id;

  // 2. N Seat-Keys generieren
  for (let i = 1; i <= seat_count; i++) {
    const seatKey = generateCFKey(product_id);
    await pool.query(`
      INSERT INTO seats (order_ref, seat_key, seat_index)
      VALUES ($1, $2, $3)
      ON CONFLICT (order_ref, seat_index) DO NOTHING
    `, [orderRef, seatKey, i]);
  }
}
```

### Neue Funktion: `redactPayload`

```javascript
function redactPayload(body) {
  const redacted = { ...body };
  delete redacted.email;
  delete redacted.buyer_email;
  delete redacted.buyer_first_name;
  delete redacted.buyer_last_name;
  return redacted;
}
```

### Revoke/Expire auf Seat-Ebene

```javascript
async function revokeByOrderId(orderId) {
  // Alle Seats der Order revoken
  await pool.query(`
    UPDATE seats SET status = 'revoked', revoked_at = NOW()
    WHERE order_ref = (SELECT id FROM orders WHERE order_id = $1)
      AND status = 'active'
  `, [orderId]);
  await pool.query(`
    UPDATE orders SET status = 'revoked', revoked_at = NOW()
    WHERE order_id = $1 AND status = 'active'
  `, [orderId]);
}
```

### Neue Endpoints

| Endpoint | Zweck |
|----------|-------|
| `GET /license-pack/:order_id` | Danke-Seite: zeigt alle N Keys einer Bestellung |
| `GET /recover` | Recovery-Seite: Eingabefeld fuer `order_id` |
| `GET /api/license-pack/:order_id` | API: JSON mit allen Seat-Keys einer Bestellung |
| `GET /api/license-pack/:order_id/pdf` | PDF-Download mit allen Keys |

### Lizenz-Validierung (`GET /api/license/:key`)

Muss beide Schemata pruefen:

```javascript
async function validateLicense(key) {
  // 1. Neues Schema (seats)
  const seat = await pool.query(`
    SELECT s.*, o.product_id, p.name AS product_name, p.forgejo_repo
    FROM seats s
    JOIN orders o ON s.order_ref = o.id
    JOIN products p ON o.product_id = p.id
    WHERE s.seat_key = $1 AND s.status = 'active'
      AND o.status = 'active'
      AND (o.expires_at IS NULL OR o.expires_at > NOW())
  `, [key]);
  if (seat.rows[0]) return seat.rows[0];

  // 2. Legacy-Schema (licenses)
  const legacy = await pool.query(`
    SELECT l.*, p.name AS product_name, p.forgejo_repo
    FROM licenses l
    JOIN products p ON l.product_id = p.id
    WHERE l.license_key = $1 AND l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
  `, [key]);
  return legacy.rows[0] || null;
}
```

---

## 6. Shared Library (`@codefabrik/shared/license`)

### Neue Funktionen

```javascript
// CF-Key generieren (serverseitig, im Portal)
export function generateCFKey(productId) {
  const bundleCode = deriveBundleCode(productId); // z.B. "B05"
  const random = generateRandomAlphanumeric(8);
  const raw = `CF-${bundleCode}-${random}`;
  const checksum = computeChecksum(raw);
  return `${raw}-${checksum}`;
}

// Checksum berechnen (2 Hex-Zeichen)
function computeChecksum(raw) {
  let sum = 0;
  for (const c of raw.replace(/-/g, '')) {
    sum = (sum * 31 + c.charCodeAt(0)) & 0xFF;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

// Beide Formate validieren (clientseitig, in der App)
export function validateLicenseFormat(key) {
  const upper = key?.toUpperCase();
  if (LEGACY_PATTERN.test(upper)) return true;
  if (!CF_PATTERN.test(upper)) return false;
  // Checksum pruefen
  const parts = upper.split('-');
  const raw = parts.slice(0, 3).join('-');
  return parts[3] === computeChecksum(raw);
}

// Normalisierung (beide Formate)
export function normalizeLicenseKey(key) {
  const upper = key?.toUpperCase().trim() ?? '';
  if (upper.startsWith('CF-')) return upper; // CF-Format: keine Transformation
  // Legacy: bisherige Logik
  return upper.replace(/[^A-Z0-9]/g, '').replace(/(.{4})/g, '$1-').slice(0, 19);
}
```

---

## 7. Desktop-App-Integration

Beide Produkte muessen das neue CF-Key-Format akzeptieren und Lizenzen aktivieren koennen.
Da `@codefabrik/shared/license` die Validierung uebernimmt (AP-2), profitieren beide Apps
automatisch — aber die Integrationstiefe unterscheidet sich stark.

### Finanz-Rechner (v0.1) — Anpassung

Ist-Zustand: Volle Lizenz-Aktivierung via `localStorage`, nutzt `@codefabrik/shared/license`.

Aenderungen:
- Fehlermeldung aktualisieren: `'Ungueltiges Format (XXXX-XXXX-XXXX-XXXX)'` →
  `'Ungueltiges Format'` (beide Formate gelten)
- `activateLicense()` akzeptiert automatisch CF-Format (da `validateLicenseFormat`
  aus Shared Library kommt → keine Code-Aenderung noetig ausser Fehlermeldung)
- Tests erweitern: CF-Key als gueltig validieren

```javascript
// products/finanz-rechner/src/lib/license.js — Aenderung
export function activateLicense(key) {
  const normalized = normalizeLicenseKey(key);
  if (!validateLicenseFormat(normalized)) {
    return { valid: false, error: 'Ungueltiges Lizenzschluessel-Format' };
    //                               ^^^ Format-neutral, nicht mehr "XXXX-XXXX-..."
  }
  // ... Rest bleibt gleich
}
```

### MitgliederSimple (v0.4) — Neue Funktion

Ist-Zustand: Nur Probe-Limit (30 Mitglieder), `hasLicenseKey()` gibt immer `false` zurueck.
Keine Lizenz-Aktivierung, keine UI dafuer.

Aenderungen:

**1. `license.js` — Lizenz-Aktivierung einbauen:**

```javascript
// products/mitglieder-simple/src/lib/license.js
import { validateLicenseFormat, normalizeLicenseKey } from '@codefabrik/vereins-shared/license';
import { getActiveMemberCount } from './db.js';

const PROBE_LIMIT = 30;
let _licenseKey = null;

export async function checkMemberLimit() {
  if (_licenseKey) return { allowed: true, count: 0, limit: Infinity };
  const count = await getActiveMemberCount();
  return { allowed: count < PROBE_LIMIT, count, limit: PROBE_LIMIT };
}

export function hasLicenseKey() {
  return _licenseKey !== null;
}

export function activateLicense(key) {
  const normalized = normalizeLicenseKey(key);
  if (!validateLicenseFormat(normalized)) {
    return { valid: false, error: 'Ungueltiges Lizenzschluessel-Format' };
  }
  _licenseKey = normalized;
  try {
    localStorage.setItem('mitglieder-simple-license', normalized);
  } catch (_) { /* Tauri: localStorage evtl. nicht verfuegbar */ }
  return { valid: true };
}

export function loadStoredLicense() {
  try {
    const stored = localStorage.getItem('mitglieder-simple-license');
    if (stored && validateLicenseFormat(stored)) {
      _licenseKey = stored;
    }
  } catch (_) { /* */ }
}
```

**2. `Settings.svelte` — Lizenz-Aktivierung UI:**

- Neuer Abschnitt "Lizenz" in den Einstellungen
- Eingabefeld fuer Key + "Aktivieren"-Button
- Status-Anzeige: "Probe-Version (max. 30 Mitglieder)" oder "Lizenziert"
- Bei Fehler: Fehlermeldung unter dem Eingabefeld

**3. `App.svelte` — Lizenz laden bei Start:**

- `loadStoredLicense()` beim App-Start aufrufen
- Wenn lizenziert: Probe-Limit-Check ueberspringen
- Settings-Seite erhaelt Callback `onLicenseChange` (wie beim Finanz-Rechner)

**4. Speicherort:**

- v0.4 MVP: `localStorage` (wie Finanz-Rechner, einfachste Loesung)
- Spaeter (v0.5+): In `_schema_meta` oder eigene `license`-Tabelle in SQLite
  (besser fuer Tauri, da localStorage in WebView instabil sein kann)

---

## 8. Key-Uebergabe UX

### Danke-Seite (Custom Thank-you-Page von Digistore24)

Digistore24 leitet nach Kauf auf `https://portal.codefabrik.app/license-pack/:order_id`.

Inhalt:
- Ueberschrift: "Deine Lizenzschluessel"
- Tabelle mit allen N Keys (nummeriert: Platz 1, Platz 2, ...)
- Gelber Hinweis-Banner:
  > "Speichere deine Lizenzschluessel als PDF — wie einen Hausschluessel.
  > Wer den Schluessel hat, kann die Software nutzen."
- Button: "Als PDF speichern"
- Checkbox: "Erledigt — nicht mehr anzeigen" (Banner verschwindet)
- Bestellnummer sichtbar (fuer Recovery)

### PDF-Inhalt

- Produktname, Kaufdatum, Bestellnummer
- Alle N Keys (nummeriert)
- Warntext: "Behandle diese Keys wie Passwoerter"
- Kurzanleitung: "So aktivierst du die Software"
- Kein Name, keine E-Mail (Datensparsamkeit)

### Recovery-Seite

`https://portal.codefabrik.app/recover`

- Eingabefeld: "Bestellnummer eingeben"
- Zeigt die Keys erneut an (gleiche Ansicht wie Danke-Seite)
- Gleicher PDF-Download

### Recovery-Kette (3 Stufen)

1. **Danke-Seite** — Keys drucken / als PDF speichern
2. **Recovery-Seite** — `order_id` eingeben → Keys erneut angezeigt
3. **Manueller Support** — Kunde kontaktiert Code-Fabrik, Verifikation ueber Digistore24

---

## 9. Rueckbau personenbezogener Daten

### Problem

Portal-DB speichert `customer_email` (NOT NULL) und `customer_name` —
wird nirgends genutzt, widerspricht dem Versprechen "Datensparsamkeit".

### Massnahmen

1. **`customer_email`**: Spalte auf nullable setzen, bestehende Werte auf NULL
2. **`customer_name`**: Bestehende Werte auf NULL setzen
3. **IPN-Handler**: `buyer_email` + `buyer_name` nicht mehr an DB weitergeben
4. **IPN-Audit-Log**: Personenbezogene Felder vor Speicherung aus `payload` entfernen
5. **Bestehende IPN-Logs**: Personenbezogene Felder aus `payload`-JSONB bereinigen
6. **Tests**: Referenzen auf `customer_email` anpassen

### Zeitpunkt

Teil des Mehrsitz-Umbaus (nicht vorher, um bestehende Funktionalitaet nicht zu brechen).

---

## 10. Arbeitspakete

Jedes Paket ist einzeln testbar. Reihenfolge ist verbindlich.
AP-1 bis AP-6 = Portal-Seite, AP-7/AP-8 = Desktop-Apps, AP-9/AP-10 = Abschluss.

### AP-1: DB-Schema erweitern (Portal)

- Neue Tabellen `orders` + `seats` anlegen (Migration `migrate-v070.sql`)
- Spalte `seat_count` in `products`
- Bestehende `licenses`-Tabelle bleibt unveraendert
- **Test**: Tabellen existieren, Constraints greifen

### AP-2: CF-Key-Format in Shared Library

- `generateCFKey(productId)` implementieren
- `validateLicenseFormat(key)` fuer beide Formate
- `normalizeLicenseKey(key)` fuer beide Formate
- `computeChecksum(raw)` als interne Hilfsfunktion
- **Dateien**: `products/shared/src/license/index.js`
- **Test**: Unit-Tests fuer Generierung, Validierung, Checksum, Normalisierung

### AP-3: IPN-Handler fuer N-Key-Generierung (Portal)

- `activateMultiSeatFromIPN()` implementieren
- `redactPayload()` fuer IPN-Audit-Log
- Seat-Count aus `products.seat_count` lesen
- Revoke/Expire auf Seat-Ebene
- Legacy-Pfad (`activateFromIPN`) bleibt fuer bestehende Einzelplatz-Keys
- **Dateien**: `portal/src/services/license.js`, `portal/src/routes/api-digistore-ipn.js`
- **Test**: IPN mit verschiedenen Seat-Counts, Idempotenz, Revoke

### AP-4: Lizenz-Validierung dual-path (Portal)

- `validateLicense(key)` prueft erst `seats`, dann `licenses`
- Beide Schemata gleichzeitig aktiv
- **Dateien**: `portal/src/services/license.js`
- **Test**: Validierung fuer Legacy-Keys und neue CF-Keys

### AP-5: License-Pack-Seite + Recovery (Portal)

- `GET /license-pack/:order_id` — rendert alle Keys
- `GET /recover` — Eingabefeld fuer order_id
- `GET /api/license-pack/:order_id` — JSON-API
- Gelber Banner mit "Erledigt"-Checkbox
- **Test**: Seite zeigt N Keys, Recovery funktioniert

### AP-6: PDF-Download (Portal)

- `GET /api/license-pack/:order_id/pdf` — PDF mit allen Keys
- Inhalt: Produktname, Datum, Bestellnummer, N Keys, Warntext, Kurzanleitung
- **Test**: PDF wird generiert, enthaelt korrekte Daten

### AP-7: Finanz-Rechner CF-Format-Support

- Fehlermeldung in `activateLicense()` format-neutral machen
- Tests erweitern: CF-Key als gueltig validieren
- **Dateien**: `products/finanz-rechner/src/lib/license.js`,
  `products/finanz-rechner/tests/test_license.js`
- **Test**: Bestehende Tests gruen + neuer Test mit CF-Key
- **Aufwand**: Klein (Shared Library macht die eigentliche Arbeit)

### AP-8: MitgliederSimple Lizenz-Aktivierung

- `license.js`: `activateLicense()`, `loadStoredLicense()` einbauen (siehe Abschnitt 7)
- `hasLicenseKey()` an `_licenseKey` koppeln (nicht mehr hardcoded `false`)
- `checkMemberLimit()`: Probe-Limit ueberspringen wenn lizenziert
- `Settings.svelte`: Lizenz-Abschnitt mit Eingabefeld + Status-Anzeige
- `App.svelte`: `loadStoredLicense()` beim Start, `onLicenseChange`-Callback
- Speicherort: `localStorage` (MVP), spaeter SQLite
- **Dateien**: `products/mitglieder-simple/src/lib/license.js`,
  `products/mitglieder-simple/src/routes/Settings.svelte`,
  `products/mitglieder-simple/src/App.svelte`
- **Test**: Unit-Tests fuer Aktivierung + Probe-Limit-Bypass,
  Smoke-Test: Key eingeben → Limit aufgehoben

### AP-9: Rueckbau personenbezogener Daten (Portal)

- `customer_email` nullable setzen + bestehende Werte NULL
- `customer_name` bestehende Werte NULL
- IPN-Handler: keine personenbezogenen Daten mehr speichern
- IPN-Audit-Log: bestehende Payloads bereinigen
- Tests anpassen
- **Test**: Keine personenbezogenen Daten in DB, IPN funktioniert weiterhin

### AP-10: Digistore24-Produkte einrichten

- Neue Produkte in Digistore24 anlegen (1-Platz, 5-Platz, 10-Platz)
- `products`-Tabelle seeden mit Seat-Counts
- Custom Thank-you-URL konfigurieren
- **Test**: Smoke-Test mit Test-IPN

---

## Anhang A: Urspruengliches Review-Dokument

<details>
<summary>Review-Prompt + Ergebnis (Maerz 2026) — aufklappen</summary>

### A.1 Aufgabe an den Reviewer

Wir entwickeln ein Lizenzmodell fuer Desktop-Software (Tauri + Svelte + SQLite,
offline-first). Bitte pruefe unser Vorhaben auf gaengige Praxis, Risiken und
Machbarkeit — insbesondere unter den harten Rahmenbedingungen (kein E-Mail,
kein Account, Digistore24 als einziger Zahlungsanbieter).

### A.2 Was wir bauen

Code-Fabrik verkauft fokussierte Desktop-Tools fuer Vereine und Versicherungsmakler.
Jedes Tool ist eine lokale App (Tauri/Rust + Svelte + SQLite), die offline funktioniert.

**Aktuelle Produkte:**

| Produkt | Zielgruppe | Preis |
|---------|-----------|-------|
| MitgliederSimple | Vereine (Kassenwart) | 29-169 EUR/Jahr (nach Stufe) |
| Finanz-Rechner | Versicherungsmakler | 39 EUR einmalig |

**Aktuelles Lizenzmodell (Einzelplatz):**

```
Kauf bei Digistore24
  → IPN-Webhook an unser Portal
  → Portal generiert UUID-Lizenzkey (XXXX-XXXX-XXXX-XXXX)
  → Kunde laedt App + Key bei Digistore24 runter
  → App speichert Key lokal (localStorage / SQLite)
  → Kein Online-Check noetig (offline-first, 30 Tage ohne Internet)
```

**Problem: Kunde kauft 5 Arbeitsplaetze.**

### A.3 Harte Rahmenbedingungen

**Strict No-Email:**
- Wir senden KEINE E-Mails. Niemals. Kein Newsletter, kein Passwort-Reset.
- Grund: Datensparsamkeit als Verkaufsargument
  ("Lizenz = Sendungsnummer, nicht Identitaet")
- Code-Fabrik speichert: Key, Bundle-ID, Timestamps. KEINE Namen, Adressen, E-Mails.

**Kein Account:**
- Kein Login, kein Passwort, keine Benutzerverwaltung auf Portal-Seite.
- Der Lizenzkey IST die Identitaet.

**Offline-First:**
- Apps muessen ohne Internet funktionieren (30 Tage laut Spec).
- Kein "Phone Home", kein Session-Tracking, kein Heartbeat.

**Digistore24 als einziger Kanal:**
- Alle Kaeufe laufen ueber Digistore24.
- Digistore24 hat KEINE native Multi-Seat-Logik.

### A.4 Drei bewertete Ansaetze

**Ansatz A: N separate Lizenzkeys pro Kauf** (GEWAEHLT)

```
Kunde kauft "5-Platz-Lizenz" bei Digistore24
  → IPN-Webhook an Portal
  → Portal generiert 5 separate Keys
  → Alle 5 Keys auf Danke-Seite / Portal
  → Kunde verteilt Keys manuell
  → Jede Installation = 1 Key, voellig unabhaengig
```

**Ansatz B: 1 Master-Key + lokale Benutzerverwaltung** (VERWORFEN)
- Zu komplex, widerspricht "kein Account"
- Seat-Count offline nicht erzwingbar

**Ansatz C: Hybrid** (SPAETERES UPGRADE)
- Master-Key + Aktivierungscodes
- Erst sinnvoll wenn Admin-Features gebraucht werden

### A.5 Review-Ergebnis

**Empfehlung: Ansatz A als MVP.**
- Einziger Ansatz der "kein Account / offline / kein Seat-Server" konsequent erfuellt
- Einfach implementierbar
- Spaeter ausbaubar Richtung C

### A.6 Identifizierte Risiken

1. **Personenbezogene Daten in Portal-DB (KRITISCH)** — `customer_email` (NOT NULL)
   und `customer_name` widersprechen "Strict No-Email" → Rueckbau in AP-9
2. **Revoke funktioniert offline nicht** — bewusst akzeptiertes Geschaeftsrisiko
3. **Thank-you-Page = Single Point of Failure** — Recovery per `order_id` als Absicherung
4. **Key-Leaks** — nicht boesartig, sondern durch Vereins-Organisation →
   Soft-Enforcement + Seat-Rotation als spaeteres Upgrade
5. **Offline-Seat-Enforcement erzeugt Supportlast** — Trust + Audit statt harter Enforcement

### A.7 Quellen (Review-Recherche)

- [JetBrains Offline-Aktivierung](https://sales.jetbrains.com/hc/en-gb/articles/360016995379)
- [JetBrains Floating Licenses](https://www.jetbrains.com/help/ide-services/floating-licenses.html)
- [Sublime Text Sales FAQ](https://www.sublimehq.com/sales_faq)
- [Digistore24: Lizenzkeys liefern](https://help.digistore24.com/hc/en-us/articles/23901096742161)
- [Digistore24: Key Generator](https://www.digistore24.com/download/licensekey/examples/licensekey/singlekeygenerator.php)
- [Digistore24: Kundendaten Danke-Seite](https://help.digistore24.com/hc/en-us/articles/23901139460881)
- [Digistore24: Thank-you-Page Key](https://help.digistore24.com/hc/en-us/articles/23697503850001)

</details>

---

## Anhang B: Technischer Ist-Zustand (zum Zeitpunkt der Planung)

<details>
<summary>Bestehendes Schema + Code — aufklappen</summary>

### B.1 Portal-DB (PostgreSQL, `init.sql`)

```sql
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id VARCHAR(50) NOT NULL REFERENCES products(id),
  customer_email VARCHAR(300) NOT NULL,
  customer_name VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  order_id VARCHAR(100) UNIQUE,
  transaction_id VARCHAR(100),
  source VARCHAR(20) DEFAULT 'portal',
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT uq_license_key UNIQUE (license_key)
);
```

### B.2 Portal License-Service (`portal/src/services/license.js`)

```javascript
async function activateFromIPN({ order_id, license_key, product_id,
                                  buyer_email, buyer_name, payment_id }) {
  await pool.query(`
    INSERT INTO licenses (license_key, product_id, customer_email, customer_name,
                          order_id, transaction_id, source, status, activated_at, issued_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'digistore', 'active', NOW(), NOW())
    ON CONFLICT (order_id) DO UPDATE SET
      status = 'active', activated_at = NOW()
  `, [license_key, product_id, buyer_email, buyer_name, order_id, payment_id]);
}
```

### B.3 Shared Library (`products/shared/src/license/index.js`)

```javascript
const LICENSE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function validateLicenseFormat(key) {
  return LICENSE_PATTERN.test(key?.toUpperCase());
}

export function normalizeLicenseKey(key) {
  return key?.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})/g, '$1-').slice(0, 19) ?? '';
}
```

### B.4 IPN-Handler (`portal/src/routes/api-digistore-ipn.js`)

| Event | Aktion |
|-------|--------|
| on_payment | Lizenz aktivieren (1 Key pro Bestellung) |
| on_refund | Lizenz widerrufen |
| on_chargeback | Lizenz widerrufen |
| on_rebill_cancelled | Ablaufdatum setzen |
| on_payment_missed | Nur loggen |

</details>
