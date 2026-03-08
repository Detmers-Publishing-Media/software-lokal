# Produktstrategie Lokal-Tools — Rechnung Lokal & Mitglieder Lokal

Stand: März 2026

---

## 1. Zweck

Dieses Dokument ist die verbindliche Leitlinie für beide Desktop-Produkte der Code-Fabrik:
**Rechnung Lokal** und **Mitglieder Lokal**. Es ersetzt die produktspezifischen Einzelstrategien
und definiert die gemeinsame Basis für Produktentscheidungen, Architektur, Preis,
Erwartungsmanagement und Kommunikation.

---

## 2. Die zwei Produkte

### Rechnung Lokal

**Einfache Rechnungsstellung mit E-Rechnung (ZUGFeRD) und Einnahmen-Ausgaben-Übersicht
für Nebenberufler und Kleinunternehmer — lokal, ohne Cloud, ohne Buchhaltungskomplexität.**

- Zielgruppe: Nebenberufler, Kleinunternehmer (§19 UStG), Kleingewerbetreibende
- Typischer Nutzer: Kursleiter, Coach, Berater — eine Person, 2–50 Rechnungen/Monat
- Marktlücke: Kein lokales, günstiges Rechnungstool mit E-Rechnung existiert
- Markttreiber: E-Rechnungspflicht ab 01.01.2028 für alle B2B-Rechnungen

### Mitglieder Lokal

**Einfache Vereinsverwaltung für kleine und mittlere Vereine — Mitglieder, Sparten, Beiträge
und Standarddokumente lokal verwalten, ohne Cloud und ohne IT-Aufwand.**

- Zielgruppe: Kleine Vereine (30–250 Mitglieder), ehrenamtlich organisiert
- Typischer Nutzer: Schriftführer oder Vorsitzender — eine Person pflegt die Daten
- Marktlücke: Kein modernes, lokales Desktop-Tool für Win/Mac/Linux
- Differenzierung: Spendenbescheinigungen, Ehrenamtsstunden, Versammlungsprotokoll

### Warum zwei Produkte auf einer Basis

Beide Produkte teilen sich:

- dieselbe Desktop-Plattform (Electron + Svelte 5 + SQLite)
- dasselbe Geschäftsmodell (Open Source + Servicepaket)
- dieselben Kernversprechen (lokal, einfach, offen, produktisiert)
- überlappende Funktionen (Einnahmen-Ausgaben-Übersicht, PDF-Erzeugung, Profilverwaltung)

Was sie unterscheidet, sind aktivierte Feature-Module, Labels und Templates — nicht die Codebasis.

---

## 3. Entwicklungsreihenfolge

```
Phase 1: finanz-shared Package
         → Gemeinsames Datenmodell, Models, EÜR-Logik, PDF-Engine, Tests

Phase 2: Rechnung Lokal v1.0
         → Beweist: Shared-Architektur, ZUGFeRD, EÜR, Feature-Flags
         → Erster zahlender Kunde vor E-Rechnungspflicht 2028

Phase 3: Mitglieder Lokal v2.0 (Neubau auf Shared-Architektur)
         → Nutzt: dasselbe Datenmodell, dieselben Finanz-Komponenten
         → Ergänzt: Mitgliederverwaltung, Sparten, Spendenbescheinigungen
         → Migration bestehender v0.5.0-Datenbanken

Phase 4: Weitere Produkte
         → Neue Produkte durch Feature-Aktivierung, nicht neuen Code
```

**Rechnung Lokal zuerst**, weil:

- Kleinerer Scope (kein DSGVO-Spezialfall, keine Sparten, keine SEPA)
- E-Rechnungspflicht erzeugt konkreten Handlungsdruck ab 2028
- Validiert die Shared-Architektur mit einem echten Produkt
- Mitglieder Lokal v0.5.0 existiert bereits und kann Kunden bedienen, während die neue Architektur reift

---

## 4. Gemeinsame Kernversprechen

### 4.1 Lokal statt Cloud

Alle Daten bleiben auf dem eigenen Rechner. Kein API-Call während der Nutzung.
Kein Telemetrie, kein Tracking, kein Account.

### 4.2 Einfach statt überladen

Die Software deckt die häufigsten Aufgaben der jeweiligen Zielgruppe ab,
ohne in ein komplexes ERP- oder Buchhaltungssystem zu kippen.

### 4.3 Offen statt Blackbox

Der Code ist Open Source (GPL-3.0). Daten bleiben exportierbar. Kein Lock-in.
Jeder Kassenprüfer, jeder Steuerberater, jeder IT-Dienstleister kann reinschauen.

### 4.4 Service statt Gating

Bezahlt wird nicht für freigeschaltete Funktionen, sondern für fertige Installer,
Updates, Vorlagen und Servicezugang. Alle lokalen Kernfunktionen bleiben frei nutzbar.

### 4.5 Produktisiert statt betreuungsintensiv

Probleme werden durch klare Dialoge, Fehlercodes, Diagnosefunktionen, Backup-Mechanismen
und verständliche Hinweise gelöst — nicht durch individuelle Betreuung.

---

## 5. Gemeinsames Geschäftsmodell

### 5.1 Open Source plus Servicepaket

**Die Software ist Open Source. Das bezahlte Angebot ist das Servicepaket.**

**39 EUR pro Jahr** pro Verein bzw. pro Unternehmen.

Kein Mitglieder-Limit, kein Rechnungs-Limit, keine Funktionsstaffel, keine künstliche Verknappung.

### 5.2 Das Servicepaket enthält

- Fertige lauffähige Installationsdateien (.exe / .dmg / .AppImage)
- Zugriff auf stabile Releases
- Update-Hinweise und Update-Service
- Vorlagen und professionelle PDF-Ausgaben
- Diagnose- und Wiederherstellungsfunktionen
- Zugriff auf Portal / Downloadbereich
- Priorisierte Hilfe bei echten Blockern

### 5.3 Das Servicepaket enthält ausdrücklich nicht

- Telefon-Support
- Individuelle Einrichtung oder Datenmigration
- Schulungen
- Steuer-, Rechts-, Vereins- oder Buchhaltungsberatung
- Sonderprogrammierung
- Garantie, dass jede Sonderlogik abgebildet wird

### 5.4 Was wir bewusst nicht tun

- Keine kostenlose Light-Version mit künstlichen Sperren
- Keine Preisstaffel
- Keine versteckten Zusatzmodule
- Kein Upselling

---

## 6. Zielgruppen im Detail

### 6.1 Rechnung Lokal

**Primär:** Nebenberufler und Kleinunternehmer mit einfachen Verhältnissen:

- Kursleiter, Coaches, Berater, Freelancer, Therapeuten
- Kleinunternehmer nach §19 UStG
- 2–50 Rechnungen pro Monat
- Bisher Word/Excel oder gar nichts
- Steuererklärung selbst via ELSTER, kein Steuerberater

**Nicht-Zielgruppe:**

- Unternehmen mit komplexer Buchhaltung oder DATEV-Erwartung
- Unternehmen mit Warenwirtschaft, Lager, Bestellwesen
- Teams die gleichzeitig Rechnungen schreiben

### 6.2 Mitglieder Lokal

**Primär:** Kleine bis mittlere Vereine mit 30–250 Mitgliedern:

- Ehrenamtlich organisiert
- Eine Hauptperson für die Verwaltung
- Bisher Excel, Papier oder unübersichtliche Einzellösungen
- Keine Cloud gewünscht
- Einfache bis moderate Mehrspartenstruktur

**Sekundär:** Vereine bis ca. 500 Mitglieder, solange die Abläufe einfach bleiben.

**Nicht-Zielgruppe:**

- Vereine mit stark arbeitsteiligem Vorstand und gleichzeitiger Datenpflege
- Vereine mit stark autonomen Sparten, getrennten Kassen
- Vereine mit komplexer Buchhaltung oder DATEV-Erwartung
- Vereine die App, Mitgliederportal oder integrierten Mailversand erwarten

---

## 7. Erwartungsmanagement

### 7.1 Was die Produkte sind

Lokale Organisationswerkzeuge für typische Aufgaben der jeweiligen Zielgruppe.

### 7.2 Was die Produkte nicht sind

- **Keine Cloud-Plattform**
- **Keine Team-Kollaborationssoftware**
- **Keine vollwertige Finanzbuchhaltung** (keine doppelte Buchführung, kein SKR03/04)
- **Kein DATEV-System**
- **Kein ERP-System** (keine Warenwirtschaft, kein Lager)
- **Kein App-Ökosystem**
- **Kein Ersatz für Steuer-, Rechts- oder Fachberatung**

### 7.3 Support-Erwartung

Der Service ist bewusst standardisiert. Wir helfen bei Installation, Updates,
Nutzung der vorgesehenen Funktionen, Diagnose bei reproduzierbaren Fehlern
und Wiederherstellung im Rahmen der eingebauten Mechanismen.

Wir übernehmen nicht: individuelle Fachberatung, manuelle Datenpflege,
Sonderimporte, spontane Feature-Zusagen, Notfall-SLA oder Echtzeit-Support.

---

## 8. Produktprinzipien für die Entwicklung

Jedes neue Feature muss an diesen Fragen bestehen:

1. **Löst es ein häufiges Problem der Hauptzielgruppe?**
2. **Ist es ohne Schulung verständlich?**
3. **Passt es zur lokalen Single-User-Grundidee?**
4. **Reduziert oder erhöht es Supportaufwand?**
5. **Erzeugt es gefährliche Erwartungen in Richtung Buchhaltung, Kollaboration oder Beratung?**
6. **Lässt es sich stabil testen und klar begrenzen?**
7. **Gehört es in den Shared-Kern oder ist es produktspezifisch?**

Wenn ein Feature diese Fragen nicht sauber besteht, kommt es nicht in v1.

---

## 9. Featurestrategie Rechnung Lokal

### 9.1 Kern v1.0

#### A. Rechnungsstellung

- Rechnung erstellen (Positionen, Einzelpreis, Menge, Summe)
- Pflichtangaben nach §14 UStG automatisch befüllt
- Kleinunternehmer-Regelung (§19 UStG) als Profil-Einstellung
- Rechnungsnummern fortlaufend, konfigurierbar
- Kunde anlegen / aus Liste wählen
- Wiederkehrende Rechnungen (Vorlage → Klick → neue Rechnung)
- Storno-Rechnung (Gutschrift) statt Löschen
- **ZUGFeRD-Export (PDF/A-3 + eingebettetes XML nach EN 16931)**
- Einfacher PDF-Export (für B2C)

#### B. Kundenverwaltung (schlank)

- Kunde: Name, Firma, Anschrift, USt-IdNr., Kontakt
- Suche und Filter
- Kennzeichnung B2B / B2C

#### C. Einnahmen-Ausgaben-Übersicht (EÜR)

- Einnahmen automatisch aus Rechnungen (wenn als bezahlt markiert)
- Ausgaben manuell erfassen (Datum, Betrag, Kategorie, Beleg)
- Kategorien nach Anlage EÜR (BMF-Standard)
- Jahresübersicht mit Summen pro Kategorie
- Monatsübersicht / Saldo
- Storno statt Löschen
- Jahresabschluss-PDF

#### D. Geschäftsprofil

- Firmenname / Name, Anschrift, Steuernummer
- Bankverbindung, Logo / Briefkopf
- Kleinunternehmer ja/nein, Standard-Steuersatz

#### E. Betriebssicherheit

- Backup / Wiederherstellung
- Datenexport (CSV, JSON)
- Audit-Log (Event-Log mit Hash-Kette)
- Diagnosepaket
- 10-Jahres-Aufbewahrungshinweis

### 9.2 Bewusst nicht in v1

- Kein ELSTER-Direktexport
- Keine Angebote / Auftragsbestätigungen
- Keine automatischen Mahnungen
- Kein Kassenbuch, kein DATEV-Export
- Keine Warenwirtschaft
- Keine Umsatzsteuervoranmeldung

### 9.3 Regulatorisch verpflichtend

| Anforderung | Umsetzung |
|---|---|
| Pflichtangaben §14 UStG | Profil-Felder + automatische Befüllung |
| Kleinunternehmer §19 UStG | Profil-Einstellung, Hinweistext auf Rechnung |
| Fortlaufende Rechnungsnummern | Auto-Increment, konfigurierbar |
| ZUGFeRD (E-Rechnung) | PDF/A-3 + EN 16931 XML, ab v1.0 Pflicht |
| Aufbewahrung 10 Jahre | Storno statt Löschen, kein automatisches Löschen |
| GoBD-Prozessunterstützung | Event-Log, Hash-Kette, Unveränderbarkeit |
| Haftungsausschluss | „Organisatorisches Hilfsmittel, ersetzt keine Steuerberatung" |

---

## 10. Featurestrategie Mitglieder Lokal

### 10.1 Kern v1.0 (= v2.0 auf Shared-Architektur)

#### A. Mitgliederverwaltung

- Mitglied anlegen, bearbeiten, deaktivieren
- Suche und Filter
- Status und Eintritt/Austritt
- Gruppen / Abteilungen / Sparten (Mitglied kann mehreren zugeordnet sein)
- Optionale Hauptsparte
- CSV-Import und CSV-Export
- PDF-Mitgliederlisten, Filter nach Sparte
- DSGVO-Basisfunktionen (Löschung, Einwilligung, Audit-Log)

#### B. Beiträge in schlanker Form

- Beitragsklassen
- Soll-/Ist-Status
- Manuelle Zahlungserfassung
- Jahresübersicht
- Einfache Mahn- oder Hinweisdokumente als PDF

#### C. Einnahmen-Ausgaben-Übersicht

- Aus finanz-shared: dieselbe EÜR-Logik wie Rechnung Lokal
- Kategorien: Ideeller Bereich, Wirtschaftl. Geschäftsbetrieb, Vermögensverwaltung
- Jahresabschluss-PDF für Kassenprüfer
- Storno statt Löschen

#### D. Spenden / Bescheinigungen

- Spenderdaten verwalten
- Zuwendungsbestätigungen nach BMF-Muster (PDF)
- Sammel-PDF pro Jahr
- Vereinsdaten / Briefkopf / Freistellungsbescheid

#### E. Betriebssicherheit

- Aus electron-platform: Backup, Wiederherstellung, Diagnosepaket
- Datenexport, Umzugs-/Übergabehilfe

### 10.2 Optional in v1 (wenn stabil)

#### F. Versammlung schlank

- Versammlung anlegen, Anwesenheitsliste, Quorum-Anzeige
- Einfache Protokollvorlage / PDF

### 10.3 Bewusst nicht im Kern

- Echter Mehrplatzbetrieb / Live-Sync
- Flexible Felder als Baukastensystem
- SEPA-XML-Erzeugung (nur bei klarer Nachfrage und robuster Implementierung)
- DATEV, GoBD-Zertifizierung
- E-Mail-Versand, Website-Baukasten, Mobile App
- Online-Mitgliedsanträge, Multi-Mandanten
- Komplexe Mehrspartenlogik mit getrennten Kassen

---

## 11. Shared-Finanz-Architektur

### 11.1 Grundprinzip

Produkte sind **Konfigurationen eines gemeinsamen Kerns**, nicht eigene Codebasen.

Sie unterscheiden sich in:

- Welche Feature-Module aktiviert sind
- Welche Views / Routes sichtbar sind
- Welche Templates / PDF-Ausgaben verfügbar sind
- Welche Begriffe in der UI verwendet werden

Sie teilen sich:

- Das Datenmodell
- Die Geschäftslogik (EÜR, Zahlungen, Personen-CRUD)
- Die Komponenten (DataTable, SearchBar, Export, PDF-Engine)
- Die Plattform (Electron, Backup, License, Support, Update)

### 11.2 Package-Struktur

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
        person.js           Kunden/Mitglieder-CRUD + Events
        transaction.js      Einnahmen/Ausgaben + Events
        category.js         EÜR-Kategorien
        fee-class.js        Beitragsklassen (nur Vereins-Produkte)
      pdf/
        invoice-pdf.js      Rechnungs-PDF
        zugferd.js          ZUGFeRD XML + PDF/A-3
        euer-pdf.js         EÜR-Jahresabschluss
        receipt-pdf.js      Spendenbescheinigung (nur Vereins-Produkte)
        list-pdf.js         Listen-PDF
      euer/
        categories.js       Anlage-EÜR-Kategorien (BMF)
        summary.js          Jahresberechnung, Monatsübersicht, Saldo

  ui-shared/                (NEU) Svelte 5 Shared Views
    src/components/
      InvoiceForm.svelte
      InvoiceList.svelte
      TransactionForm.svelte
      TransactionList.svelte
      PersonForm.svelte
      PersonList.svelte
      EuerDashboard.svelte
      ProfileForm.svelte

products/
  rechnung-simple/          Rechnung Lokal (product.config.js + produkt-spezifische Views)
  mitglieder-lokal/        Mitglieder Lokal (product.config.js + produkt-spezifische Views)
```

### 11.3 Feature-Flags per Produktkonfiguration

```js
// Rechnung Lokal
{
  features: {
    invoices: true, customers: true, euer: true, zugferd: true,
    members: false, departments: false, fees: false,
    donations: false, assembly: false
  },
  labels: { person: 'Kunde', personPlural: 'Kunden', profile: 'Geschäftsprofil' }
}

// Mitglieder Lokal
{
  features: {
    invoices: false, customers: false, euer: true, zugferd: false,
    members: true, departments: true, fees: true,
    donations: true, assembly: true
  },
  labels: { person: 'Mitglied', personPlural: 'Mitglieder', profile: 'Vereinsprofil' }
}
```

### 11.4 Gemeinsames Datenmodell

```
Shared-Kern (immer):          Nur Rechnungsprodukte:    Nur Vereinsprodukte:
  profile                       invoice                   fee_class
  person                        invoice_item              payment
  person_group                                            donation
  person_group_m                                          assembly
  transaction                                             assembly_item
  category                                                attendance
  document
  events
  _schema_meta
```

Schema wird Feature-aware erzeugt: Nur Tabellen für aktivierte Features werden angelegt.
Migrationen sind ebenfalls Feature-aware.

---

## 12. Leitlinie Mehrplatz / Zusammenarbeit

### Grundsatz

Beide Produkte sind **Single-User-Desktop-Apps**.

### Was wir priorisieren

- Saubere Backups
- Einfache Datenübergabe (Vorstandswechsel, Rechner-Umzug)
- Wiederherstellung
- Datenexport in offenen Formaten

### Was wir vorerst nicht versprechen

- Gleichzeitiges Bearbeiten durch mehrere Personen
- Konfliktfreies Live-Sync
- Cloud-gestützte Teamarbeit

### Kommunikation

> Die Software ist für Einzelnutzer gedacht — eine Person pflegt die Daten.
> Für Übergaben und Absicherung gibt es Export-, Backup- und Wiederherstellungsfunktionen.

---

## 13. Feature-Roadmap (beide Produkte)

### Phase 1: Rechnung Lokal kaufbar machen

- Rechnungsstellung + ZUGFeRD
- EÜR-Übersicht
- Kundenverwaltung
- PDF/CSV
- Backup/Wiederherstellung
- Installer + Produkttexte

### Phase 2: Selbsthilfe und Stabilität (beide Produkte)

- Bessere Validierung und Hilfetexte
- Recovery-Center und Diagnosepakete
- Import-Assistenten
- Mehr Standardvorlagen

### Phase 3: Mitglieder Lokal v2.0 auf Shared-Architektur

- Neubau auf finanz-shared
- Migration bestehender v0.5.0-Datenbanken
- Spendenbescheinigungen, Sparten, Beiträge
- Optional: Versammlungsprotokoll

### Phase 4: Nützliche Erweiterungen (bei klarer Nachfrage)

Rechnung Lokal:

- XRechnung (für Behörden-Rechnungen)
- Angebote / Auftragsbestätigungen
- Wiederkehrende Rechnungen mit automatischer Erzeugung

Mitglieder Lokal:

- Ehrenamtsstunden (falls Referenzkunden es wollen)
- SEPA (nur bei robuster Implementierung)
- Datensicherung mit Freigabe / Übergabe-Funktion

### Nicht als Standardziel

- Komplexer Mehrplatz-Sync
- ELSTER-Direktexport (ERiC-SDK)
- DATEV-Export
- Umsatzsteuervoranmeldung
- Cloud-Zentralserver

---

## 14. Harte Produktentscheidungen

Wenn „mehr Features" gegen „weniger Supportaufwand" steht → **weniger Supportaufwand**.

Wenn „größere Zielgruppe" gegen „klarere Positionierung" steht → **klarere Positionierung**.

Wenn „technisch elegant" gegen „einfach erklärbar" steht → **einfach erklärbar**.

Wenn „produktspezifischer Code" gegen „Shared-Kern" steht → **Shared-Kern**, sofern das Feature in mindestens zwei Produkten sinnvoll ist.

---

## 15. Kommunikation

### 15.1 Gemeinsame Dachmarke

Beide Produkte sind **„Lokal-Tools"** der Code-Fabrik. Sie teilen:

- Dasselbe Vertrauensversprechen (lokal, offen, fair)
- Denselben Preis (39 EUR/Jahr)
- Dasselbe Geschäftsmodell (Open Source + Servicepaket)
- Dasselbe Portal für Downloads, Support und Updates

### 15.2 Rechnung Lokal — Kernbotschaft

**Rechnungen schreiben, E-Rechnung erzeugen, Einnahmen und Ausgaben im Blick —
ohne Cloud-Zwang und ohne Buchhaltungssoftware.**

### 15.3 Mitglieder Lokal — Kernbotschaft

**Mitglieder, Sparten, Beiträge und Standarddokumente lokal verwalten —
offen, nachvollziehbar und ohne aufgeblähte SaaS-Plattform.**

### 15.4 Was auf Verkaufsseiten klar gesagt werden muss (beide Produkte)

- Open Source, aber das kostenpflichtige Angebot ist das Servicepaket
- Lokal und cloudfrei
- Für einfache bis mittlere Anforderungen
- Keine künstlichen Feature-Sperren
- Keine Telefonhotline, kein individuelles Consulting
- Keine Steuer-, Rechts- oder Buchhaltungsberatung
- Kein gleichzeitiger Mehrplatzbetrieb
- Organisatorisches Hilfsmittel, ersetzt keine Fachberatung

### 15.5 Gemeinsame FAQ

#### Warum kostet das Produkt Geld, wenn es Open Source ist?

Der Quellcode ist offen. Das kostenpflichtige Angebot finanziert fertige Installationsdateien,
stabile Releases, Updates, Vorlagen und den standardisierten Servicezugang.

#### Ist das eine Cloud-Lösung?

Nein. Die Daten bleiben lokal auf Ihrem Rechner.

#### Können mehrere Personen gleichzeitig arbeiten?

Nicht als Standardfunktion. Die Produkte sind für Einzelnutzer gedacht.

#### Ist das eine Buchhaltungssoftware?

Nein. Die Produkte sind Organisationswerkzeuge, keine vollwertige Buchhaltung oder DATEV-Lösung.

#### Welche Hilfe ist im Servicepaket enthalten?

Hilfe bei Installation, Updates und reproduzierbaren Problemen. Nicht enthalten sind
individuelle Beratung, manuelle Datenpflege oder Sonderprogrammierung.

---

## 16. Risiken

| Risiko | Betrifft | Eintritt | Gegenmaßnahme |
|---|---|---|---|
| ZUGFeRD komplexer als erwartet | Rechnung | Mittel | Library evaluieren, offizielle Testdaten nutzen |
| Shared-Datenmodell passt nicht für beide | Beide | Niedrig | Rechnung Lokal zuerst beweisen |
| Migration Mitglieder v0.5.0 → neues Schema bricht Daten | Mitglieder | Niedrig | Backup vor Migration, Fixture-Tests |
| Nebenberufler gehen zu lexoffice statt zu uns | Rechnung | Hoch | Akzeptiertes Risiko, organisches Wachstum |
| Feature-Creep in Richtung Buchhaltung | Beide | Hoch | Diese Leitlinie als Gate |
| Kein Umsatz in den ersten 6 Monaten | Beide | Hoch | Nebenerwerb, kein Kostendruck |

---

## 17. Kurzfassung für interne Entscheidungen

**Zwei Produkte, ein Kern.**

**Rechnung Lokal:** Rechnungen + EÜR + ZUGFeRD für Nebenberufler. Kommt zuerst.

**Mitglieder Lokal:** Mitglieder + Sparten + Beiträge + Spendenbescheinigungen für Vereine. Kommt als Neubau auf der bewiesenen Architektur.

**Preis:** 39 EUR/Jahr pro Produkt.

**Architektur:** Shared-Kern (finanz-shared), Feature-Flags per Produktkonfiguration. Produkte unterscheiden sich in Labels, Views und aktivierten Modulen — nicht im Datenmodell.

**Nicht-Kern:** Mehrplatz-Sync, Buchhaltung, DATEV, App, Mailversand, Cloud.

**Prinzip:** Lieber kleiner, stabiler und klarer als breiter, lauter und supportintensiver.
