# Produktkonzept: Rechnung Lokal & Shared-Finanz-Architektur

Stand: März 2026

---

## 1. Strategische Idee

### Das Problem

Ab 01.01.2028 müssen alle Unternehmen in Deutschland — auch Kleinunternehmer und
Nebenberufler — B2B-Rechnungen als E-Rechnung (ZUGFeRD/XRechnung) versenden.
Millionen Nebenberufler, die bisher Word-/Excel-Rechnungen schreiben, brauchen ein Tool.

Der Markt bietet nur Cloud-SaaS (lexoffice ab 90 EUR/Jahr, SevDesk ab 108 EUR/Jahr).
Ein lokales, einfaches, günstiges Tool existiert nicht.

### Die Chance

**Rechnung Lokal** als erstes Produkt auf einer neuen Shared-Architektur:

- Schneller Markteintritt vor der 2028-Deadline
- Validiert die Shared-Finanz-Architektur mit einem echten Produkt
- Mitglieder Lokal wird anschließend auf derselben Architektur neu aufgebaut
- Zwei Produkte, ein Datenmodell, geteilte Komponenten

### Entwicklungsreihenfolge

```
Phase 1: Rechnung Lokal v1.0
         → beweist: Shared-Datenmodell, EÜR, Rechnungen, ZUGFeRD, PDF

Phase 2: Mitglieder Lokal v2.0 (Neubau auf Shared-Architektur)
         → nutzt: dasselbe Datenmodell, dieselben Finanz-Komponenten
         → ergänzt: Mitgliederverwaltung, Sparten, Spendenbescheinigungen

Phase 3: Weitere Produkte
         → aktivieren Features per Konfiguration statt neuem Code
```

---

## 2. Produkt: Rechnung Lokal

### In einem Satz

**Rechnung Lokal ist ein lokales Rechnungstool für Nebenberufler und Kleinunternehmer, das
E-Rechnungen (ZUGFeRD) erzeugt und eine einfache Einnahmen-Ausgaben-Übersicht für die
Steuererklärung liefert — ohne Cloud, ohne Abo-Falle, ohne Buchhaltungskomplexität.**

### Zielgruppe

- Nebenberufler (Kursleiter, Coaches, Berater, Freelancer)
- Kleinunternehmer nach §19 UStG
- Kleingewerbetreibende mit einfachen Verhältnissen
- 2–50 Rechnungen pro Monat
- Bisher Word/Excel oder gar nichts
- Kein Steuerberater, Steuererklärung selbst via ELSTER

### Nicht-Zielgruppe

- Unternehmen mit komplexer Buchhaltung (→ lexoffice, DATEV)
- Unternehmen mit Warenwirtschaft, Lager, Bestellwesen
- Unternehmen die DATEV-Export oder Steuerberater-Schnittstelle brauchen
- Teams die gleichzeitig Rechnungen schreiben

### Preis

**39 EUR/Jahr** (Servicepaket, wie Mitglieder Lokal)

---

## 3. Features Rechnung Lokal v1.0

### A. Rechnungsstellung (Kern)

- Rechnung erstellen (Positionen, Einzelpreis, Menge, Summe)
- Pflichtangaben nach §14 UStG automatisch befüllt
- Kleinunternehmer-Regelung (§19 UStG) als Profil-Einstellung
- Rechnungsnummern fortlaufend, konfigurierbar (Prefix, Jahreswechsel)
- Kunde anlegen / aus Liste wählen
- Wiederkehrende Rechnungen (Vorlage → Klick → neue Rechnung)
- Storno-Rechnung (Gutschrift) statt Löschen
- **ZUGFeRD-Export (PDF/A-3 + eingebettetes XML)**
- Einfacher PDF-Export (für B2C)

### B. Kundenverwaltung (schlank)

- Kunde: Name, Firma, Anschrift, USt-IdNr., Kontakt
- Suche und Filter
- Kennzeichnung B2B / B2C (bestimmt ob ZUGFeRD-Pflicht)

### C. Einnahmen-Ausgaben-Übersicht (EÜR)

- Einnahmen automatisch aus Rechnungen (wenn als bezahlt markiert)
- Ausgaben manuell erfassen (Datum, Betrag, Kategorie, Beleg)
- Kategorien nach Anlage EÜR (BMF-Standard)
- Jahresübersicht mit Summen pro Kategorie
- Monatsübersicht / Saldo
- Storno statt Löschen (Audit-Trail)
- **Jahresabschluss-PDF** (Zusammenfassung für Steuererklärung / Steuerberater)

### D. Geschäftsprofil

- Firmenname / Name, Anschrift
- Steuernummer, ggf. USt-IdNr.
- Bankverbindung (für Rechnung)
- Logo (für Briefkopf)
- Kleinunternehmer ja/nein
- Standard-Steuersatz

### E. Betriebssicherheit

- Backup / Wiederherstellung (wie Mitglieder Lokal)
- Datenexport (CSV, JSON)
- Audit-Log (Event-Log mit Hash-Kette)
- Diagnosepaket
- Aufbewahrung: 10-Jahres-Hinweis, kein automatisches Löschen

### F. Bewusst nicht in v1

- Kein ELSTER-Direktexport (Nutzer überträgt Summen manuell)
- Keine Angebote / Auftragsbestätigungen
- Keine Mahnungen (einfacher Hinweis im Rechnungsstatus reicht)
- Kein Kassenbuch
- Kein DATEV-Export
- Keine Warenwirtschaft
- Keine Umsatzsteuervoranmeldung

---

## 4. Shared-Finanz-Architektur

### Grundprinzip

Produkte sind keine eigenen Codebasen, sondern **Konfigurationen eines gemeinsamen Kerns**.
Sie unterscheiden sich in:

- welche Feature-Module aktiviert sind
- welche Views / Routes sichtbar sind
- welche Templates / PDF-Ausgaben verfügbar sind
- welche Begriffe in der UI verwendet werden ("Mitglied" vs. "Kunde")

Sie teilen sich:

- das Datenmodell
- die Geschäftslogik (EÜR, Rechnungen, Zahlungen)
- die Komponenten (DataTable, SearchBar, Export, PDF-Engine)
- die Plattform (Electron, Backup, License, Support, Update)

### Package-Struktur (Ziel)

```
packages/
  electron-platform/        (existiert) Electron Main-Prozess
  shared/                   (existiert) Crypto, CSV, License
  app-shared/           (existiert) Svelte 5 Shared Components

  finanz-shared/            (NEU) Shared Finanz-Kern
    src/
      db/
        schema.sql          Gemeinsames Datenmodell
        migrations/         Versionierte Migrationen
      models/
        invoice.js          Rechnungs-CRUD + Events
        customer.js         Kunden-CRUD + Events (→ "Mitglied" in Vereins-Kontext)
        transaction.js      Einnahmen/Ausgaben + Events
        category.js         EÜR-Kategorien
        fee-class.js        Beitragsklassen (nur aktiviert in Vereins-Produkten)
      pdf/
        invoice-pdf.js      Rechnungs-PDF
        zugferd.js          ZUGFeRD XML-Generierung + PDF/A-3 Einbettung
        euer-pdf.js         EÜR-Jahresabschluss
        receipt-pdf.js      Spendenbescheinigung (nur Vereins-Produkte)
        list-pdf.js         Listen-PDF (Mitglieder, Kunden, etc.)
      euer/
        categories.js       Anlage-EÜR-Kategorien (BMF)
        summary.js          Jahresberechnung, Monatsübersicht, Saldo

  ui-shared/                (NEU) Svelte 5 Shared Views
    src/
      components/
        InvoiceForm.svelte
        InvoiceList.svelte
        TransactionForm.svelte
        TransactionList.svelte
        CustomerForm.svelte
        CustomerList.svelte
        EuerDashboard.svelte
        ProfileForm.svelte
```

### Feature-Flags pro Produkt

Jedes Produkt definiert in einer `product.config.js`, welche Module aktiv sind:

```js
// products/rechnung-simple/product.config.js
export default {
  product: 'rechnung-lokal',
  bundle: 'B-07-rechnung',
  prefix: 'CFRL',
  features: {
    invoices: true,          // Rechnungsstellung
    customers: true,         // Kundenverwaltung
    euer: true,              // Einnahmen-Ausgaben-Übersicht
    zugferd: true,           // E-Rechnung (ZUGFeRD)
    members: false,          // Mitgliederverwaltung
    departments: false,      // Sparten/Abteilungen
    fees: false,             // Beitragsklassen
    donations: false,        // Spendenbescheinigungen
    assembly: false,         // Versammlungsprotokoll
    volunteering: false,     // Ehrenamtsstunden
  },
  labels: {
    person: 'Kunde',
    personPlural: 'Kunden',
    profile: 'Geschäftsprofil',
  }
}
```

```js
// products/mitglieder-lokal/product.config.js
export default {
  product: 'mitglieder-lokal',
  bundle: 'B-05-verein-ehrenamt',
  prefix: 'CFML',
  features: {
    invoices: false,         // keine Rechnungsstellung
    customers: false,        // heißt hier "Mitglieder"
    euer: true,              // Finanzübersicht (= EÜR light)
    zugferd: false,          // keine E-Rechnung
    members: true,           // Mitgliederverwaltung
    departments: true,       // Sparten/Abteilungen
    fees: true,              // Beitragsklassen
    donations: true,         // Spendenbescheinigungen
    assembly: true,          // Versammlungsprotokoll (optional)
    volunteering: false,     // Phase 3
  },
  labels: {
    person: 'Mitglied',
    personPlural: 'Mitglieder',
    profile: 'Vereinsprofil',
  }
}
```

### Gemeinsames Datenmodell (Kern-Entitäten)

```
┌─────────────────────────────────────────────────────────┐
│                    Shared Kern                          │
│                                                         │
│  profile          Geschäfts-/Vereinsprofil (Singleton)  │
│  person           Kunde ODER Mitglied (je nach Produkt) │
│  person_group     Abteilung / Kundengruppe              │
│  person_group_m   Zuordnung Person ↔ Gruppe (n:m)       │
│  invoice          Rechnung (nur wenn Feature aktiv)      │
│  invoice_item     Rechnungsposition                      │
│  transaction      Einnahme oder Ausgabe                  │
│  category         EÜR-Kategorie                          │
│  document         Erzeugtes PDF (Referenz + Metadaten)   │
│  events           Append-only Event-Log (Hash-Kette)     │
│  _schema_meta     Schema-Version                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              Nur Vereins-Produkte                       │
│                                                         │
│  fee_class        Beitragsklasse                         │
│  payment          Beitragszahlung                        │
│  donation         Spende + Bescheinigung                 │
│  assembly         Versammlung                            │
│  assembly_item    TOP + Abstimmung                       │
│  attendance       Anwesenheit                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              Nur Rechnungs-Produkte                     │
│                                                         │
│  (keine zusätzlichen Tabellen —                         │
│   invoice + transaction decken alles ab)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Schema-Erzeugung nach Produkt

Die Datenbank wird beim ersten Start erzeugt. Nur die Tabellen, die zum
aktivierten Feature-Set gehören, werden angelegt:

```js
// finanz-shared/src/db/schema.js
export function createSchema(db, features) {
  // Immer: Kern-Tabellen
  db.exec(SCHEMA_PROFILE)
  db.exec(SCHEMA_PERSON)
  db.exec(SCHEMA_PERSON_GROUP)
  db.exec(SCHEMA_TRANSACTION)
  db.exec(SCHEMA_CATEGORY)
  db.exec(SCHEMA_DOCUMENT)
  db.exec(SCHEMA_EVENTS)
  db.exec(SCHEMA_META)

  // Feature-abhängig
  if (features.invoices) {
    db.exec(SCHEMA_INVOICE)
    db.exec(SCHEMA_INVOICE_ITEM)
  }
  if (features.fees) {
    db.exec(SCHEMA_FEE_CLASS)
    db.exec(SCHEMA_PAYMENT)
  }
  if (features.donations) {
    db.exec(SCHEMA_DONATION)
  }
  if (features.assembly) {
    db.exec(SCHEMA_ASSEMBLY)
    db.exec(SCHEMA_ASSEMBLY_ITEM)
    db.exec(SCHEMA_ATTENDANCE)
  }
}
```

### Migration-Strategie

- `_schema_meta` enthält Produkt-ID + Schema-Version
- Migrationen sind ebenfalls Feature-aware: eine Migration für `invoice`-Tabellen
  wird nur ausgeführt, wenn das Feature aktiv ist
- Event-Replay funktioniert produktübergreifend (Events enthalten Entitätstyp)
- Bestehende Mitglieder-Lokal-Datenbanken (v0.5.0) werden per Migration
  ins neue Schema überführt (einmalig, mit Backup davor)

---

## 5. Regulatorische Anforderungen (Rechnung Lokal)

### Muss in v1.0

| Anforderung | Umsetzung |
|---|---|
| Pflichtangaben §14 UStG | Profil-Felder + automatische Befüllung |
| Kleinunternehmer §19 UStG | Profil-Einstellung, Hinweistext auf Rechnung |
| Fortlaufende Rechnungsnummern | Auto-Increment, konfigurierbar |
| ZUGFeRD (E-Rechnung) | PDF/A-3 + EN 16931 XML eingebettet |
| Aufbewahrung 10 Jahre | Kein automatisches Löschen, Storno statt Löschen |
| GoBD-Prozessunterstützung | Event-Log, Hash-Kette, Unveränderbarkeit |
| Haftungsausschluss | Klarer Hinweis: kein Ersatz für Steuerberatung |

### Kann später

| Anforderung | Frühestens |
|---|---|
| XRechnung (reines XML, für Behörden) | v1.1 |
| ELSTER-kompatible Kategorisierung | v1.0 (Kategorien ja, Export nein) |
| ELSTER-Direktexport | v2.0+ (ERiC-SDK, hoher Aufwand) |
| Umsatzsteuervoranmeldung | Nicht geplant |

---

## 6. Abgrenzung: Was Rechnung Lokal NICHT ist

Rechnung Lokal ist:

- **keine Buchhaltungssoftware** (keine doppelte Buchführung, kein SKR03/04)
- **kein DATEV-Ersatz** (kein Export, keine Steuerberater-Schnittstelle)
- **kein ERP-System** (keine Warenwirtschaft, kein Lager, keine Bestellungen)
- **kein Mahnwesen** (Rechnungsstatus ja, automatische Mahnstufen nein)
- **kein Cloud-Service** (alles lokal)

Die Kommunikation muss das von Anfang an klar machen — wie bei Mitglieder Lokal.

---

## 7. Validierungsstrategie

### Rechnung Lokal als Architektur-Beweis

Bevor Mitglieder Lokal auf die neue Architektur migriert wird, muss Rechnung Lokal beweisen:

| Hypothese | Validiert durch |
|---|---|
| Shared-Datenmodell funktioniert produktübergreifend | Rechnung Lokal v1.0 läuft stabil |
| Feature-Flags steuern Schema + UI sauber | Zweites Produkt (Mitglieder Lokal v2.0) nutzt selbes Datenmodell |
| ZUGFeRD-Generierung ist korrekt | Validierung gegen offizielle ZUGFeRD-Testdaten |
| EÜR-Kategorien stimmen mit Anlage EÜR überein | Gegenprüfung mit BMF-Formular |
| Event-Log + Hash-Kette funktioniert mit neuem Schema | Bestehende 7 Testkategorien bestehen |
| Migration von Mitglieder Lokal v0.5.0 → neues Schema | Migrationstests mit Fixtures |

### Reihenfolge

```
1. finanz-shared Package aufsetzen (Datenmodell, Models, Tests)
2. Rechnung Lokal v0.1 (CRUD, PDF, kein ZUGFeRD)
3. Rechnung Lokal v0.5 (ZUGFeRD, EÜR, Profil)
4. Rechnung Lokal v1.0 (stabil, getestet, Installer)
5. Mitglieder Lokal v2.0 (Neubau auf finanz-shared + app-shared)
6. Migration bestehender Mitglieder-Lokal-Daten → neues Schema
```

---

## 8. Risiken

| Risiko | Eintritt | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| ZUGFeRD-Implementierung komplexer als erwartet | Mittel | Verzögerung | Frühzeitig Library evaluieren, Testdaten nutzen |
| Shared-Datenmodell passt nicht für beide Produkte | Niedrig | Architektur-Umbau | Rechnung Lokal zuerst beweisen, dann migrieren |
| Mitglieder-Lokal-Migration bricht bestehende Daten | Niedrig | Datenverlust | Backup vor Migration, Fixture-Tests, Rollback |
| Markt: Nebenberufler gehen trotzdem zu lexoffice | Hoch | Wenig Kunden | Akzeptiertes Risiko, organisches Wachstum |
| Feature-Creep: "Nur noch Mahnungen, nur noch USt-VA..." | Hoch | Fokus-Verlust | Produktstrategie-Leitlinie als Gate |

---

## 9. Zusammenfassung

**Rechnung Lokal** ist das nächste Produkt der Code-Fabrik.

Es dient zwei Zwecken:

1. **Produkt:** Einfaches Rechnungstool für Nebenberufler mit E-Rechnung (ZUGFeRD)
   und EÜR — lokal, günstig, ohne Cloud.

2. **Architektur-Beweis:** Validiert die Shared-Finanz-Architektur (gemeinsames Datenmodell,
   Feature-Flags, geteilte Komponenten), auf der anschließend Mitglieder Lokal v2.0
   neu aufgebaut wird.

**Prinzip:** Produkte sind Konfigurationen eines gemeinsamen Kerns — nicht eigene Codebasen.
Neue Produkte entstehen durch Aktivierung von Feature-Modulen und Anpassung von
Labels und Templates, nicht durch neuen Code.
