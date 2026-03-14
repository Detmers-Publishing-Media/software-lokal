# Produktstrategie Lokal-Tools

Stand: Maerz 2026 (aktualisiert 2026-03-12)
*Reframing: "Support-Abo" → "Servicepaket", Support-Erwartung konkretisiert (Dreistufenmodell)*

---

## 1. Zweck

Dieses Dokument ist die verbindliche Leitlinie fuer alle Desktop-Produkte der Code-Fabrik.
Es definiert die gemeinsame Basis fuer Produktentscheidungen, Architektur, Preis,
Erwartungsmanagement und Kommunikation.

---

## 2. Die Produkte

### Nachweis Lokal (NEU — Prioritaet 1)

**Pruefprotokolle, Checklisten und Nachweise lokal dokumentieren — einfach,
nachvollziehbar und ohne SaaS-Zwang.**

- Zielgruppe: Kleine Betriebe, Vereine, Dienstleister, Ehrenamtsstrukturen mit Dokumentationspflichten
- Typischer Nutzer: Sicherheitsbeauftragter, Hausmeister, Vereinsvorstand — eine Person dokumentiert
- Marktluecke: SafetyCulture/Lumiform sind Cloud-Plattformen, Jotform ist ein generischer Form-Builder. Kein lokales, privacy-first Nachweis-Tool existiert.
- Differenzierung: audit-chain (HMAC-SHA256 Hash-Kette) als sichtbares Kernversprechen — nicht nur Unterbau, sondern Produktkern
- Strategischer Wert: Hoechster Plattformverstaerker (5 neue Bausteine), Quernutzen in 3+ Bundles

### Rechnung Lokal

**Einfache Rechnungsstellung mit E-Rechnung (ZUGFeRD) und Einnahmen-Ausgaben-Uebersicht
fuer Nebenberufler und Kleinunternehmer — lokal, ohne Cloud, ohne Buchhaltungskomplexitaet.**

- Zielgruppe: Nebenberufler, Kleinunternehmer (§19 UStG), Kleingewerbetreibende
- Typischer Nutzer: Kursleiter, Coach, Berater — eine Person, 2-50 Rechnungen/Monat
- Marktluecke: Kein lokales, guenstiges Rechnungstool mit E-Rechnung existiert
- Markttreiber: E-Rechnungspflicht ab 01.01.2028 fuer alle B2B-Rechnungen

### Mitglieder Lokal

**Einfache Vereinsverwaltung fuer kleine und mittlere Vereine — Mitglieder, Sparten, Beitraege
und Standarddokumente lokal verwalten, ohne Cloud und ohne IT-Aufwand.**

- Zielgruppe: Kleine Vereine (30-250 Mitglieder), ehrenamtlich organisiert
- Typischer Nutzer: Schriftfuehrer oder Vorsitzender — eine Person pflegt die Daten
- Marktluecke: Kein modernes, lokales Desktop-Tool fuer Win/Mac/Linux
- Differenzierung: Spendenbescheinigungen, Ehrenamtsstunden, Versammlungsprotokoll

### FinanzRechner Lokal

**Versicherungsmathematische Rechner fuer Makler — kein DB, kein Event-Log.**

- Zielgruppe: Versicherungsmakler
- Status: v0.2.0 fertig, 5 Rechner, 23 Tests

### Warum mehrere Produkte auf einer Basis

Alle Produkte teilen sich:

- dieselbe Desktop-Plattform (Electron + Svelte 5 + SQLite)
- dasselbe Geschaeftsmodell (Open Source + Servicepaket)
- dieselben Kernversprechen (lokal, einfach, offen, produktisiert)
- ueberlappende Funktionen (PDF-Erzeugung, Listen, Filter, Audit-Log)

Was sie unterscheidet, sind aktivierte Feature-Module, Labels und Templates — nicht die Codebasis.

---

## 3. Entwicklungsreihenfolge

```
Phase 1: finanz-shared Package (DONE)
         → Gemeinsames Datenmodell, Models, EUeR-Logik, Tests
         → audit-chain npm-Paket (DONE, v0.1.0 publish-ready)

Phase 2: Nachweis Lokal v1.0 (NEU — naechster Schritt)
         → Beweist: audit-chain als sichtbares Produktversprechen
         → Beweist: Vorlagen-Engine, Pruefprotokoll-Modul, Faelligkeits-Tracker
         → Liefert: 5 neue Plattform-Bausteine fuer alle kuenftigen Produkte
         → Kleiner Scope, schneller erstes Produkt am Markt

Phase 3: Rechnung Lokal v1.0
         → Nutzt: finanz-shared + Plattform-Bausteine aus Nachweis Lokal
         → Beweist: ZUGFeRD, EUeR, Feature-Flags
         → Zeitdruck: E-Rechnungspflicht 2028

Phase 4: Mitglieder Lokal v2.0 (Neubau auf Shared-Architektur)
         → Nutzt: dasselbe Datenmodell, dieselben Finanz-Komponenten
         → Ergaenzt: Mitgliederverwaltung, Sparten, Spendenbescheinigungen
         → Migration bestehender v0.5.0-Datenbanken

Phase 5: Weitere Produkte / Bundle-Erweiterungen
         → Teilnehmer Lokal, Immobilien Lokal, Handwerk Lokal
         → Neue Produkte durch Feature-Aktivierung + bestehende Bausteine
```

**Nachweis Lokal zuerst**, weil:

- Kleinster Scope (kein Finanz-Spezialwissen, keine Regulatorik wie ZUGFeRD/EUeR)
- audit-chain wird zum sichtbaren Kernversprechen statt nur Unterbau
- 5 neue Plattform-Bausteine die ALLE kuenftigen Produkte staerken
- Quernutzen in 3+ Bundles (Handwerk, Kommunal, Immobilien)
- Schnellster Weg zum ersten verkaufbaren Produkt
- Mitglieder Lokal v0.5.0 + Rechnung Lokal Architektur existieren bereits und koennen Kunden bedienen

**Rechnung Lokal danach**, weil:

- E-Rechnungspflicht 2028 erzeugt konkreten Handlungsdruck
- Nutzt die in Phase 2 bewiesenen Plattform-Bausteine
- ZUGFeRD/EUeR erfordert mehr Regulatorik-Arbeit

---

## 4. Gemeinsame Kernversprechen

### 4.1 Lokal statt Cloud

Alle Daten bleiben auf dem eigenen Rechner. Kein API-Call waehrend der Nutzung.
Kein Telemetrie, kein Tracking, kein Account.

### 4.2 Einfach statt ueberladen

Die Software deckt die haeufigsten Aufgaben der jeweiligen Zielgruppe ab,
ohne in ein komplexes ERP- oder Compliance-System zu kippen.

### 4.3 Offen statt Blackbox

Der Code ist Open Source (GPL-3.0). Daten bleiben exportierbar. Kein Lock-in.
Jeder Kassenpruefer, jeder Steuerberater, jeder IT-Dienstleister kann reinschauen.

### 4.4 Nachvollziehbar statt ueberschreibbar

Jede Aenderung wird in einer kryptographisch gesicherten Hash-Kette dokumentiert
(audit-chain, HMAC-SHA256). Nachweise sind glaubwuerdig, weil Manipulationen
sofort erkennbar sind.

### 4.5 Service statt Gating

Bezahlt wird nicht fuer freigeschaltete Funktionen, sondern fuer fertige Installer,
Updates, Vorlagen und Servicezugang. Alle lokalen Kernfunktionen bleiben frei nutzbar.

### 4.6 Produktisiert statt betreuungsintensiv

Probleme werden durch klare Dialoge, Fehlercodes, Diagnosefunktionen, Backup-Mechanismen
und verstaendliche Hinweise geloest — nicht durch individuelle Betreuung.

---

## 5. Gemeinsames Geschaeftsmodell

### 5.1 Open Source plus Servicepaket

**Die Software ist Open Source. Das bezahlte Angebot ist das Servicepaket.**

**39 EUR pro Jahr** pro Organisation bzw. pro Unternehmen.

Kein Mitglieder-Limit, kein Rechnungs-Limit, kein Nachweis-Limit,
keine Funktionsstaffel, keine kuenstliche Verknappung.

### 5.2 Das Servicepaket enthaelt

**Bequemlichkeit (Hauptwert):**
- Fertige lauffaehige Installationsdateien (.exe / .dmg / .AppImage)
- Zugriff auf stabile Releases im Download-Portal
- Update-Hinweise und Update-Service

**Inhalte (skaliert ohne Zeitaufwand):**
- Branchenspezifische Vorlagen-Pakete
- Professionelle PDF-Ausgaben mit eigenem Logo
- Feature-Requests mit Stimmrecht

**Sicherheitsnetz (selten noetig):**
- Diagnose- und Wiederherstellungsfunktionen
- Technische Hilfe bei echten Blockern (Ticket, 48h)

### 5.3 Das Servicepaket enthaelt ausdruecklich nicht

- Telefon-Support
- Individuelle Einrichtung oder Datenmigration
- Schulungen
- Steuer-, Rechts-, Vereins- oder Buchhaltungsberatung
- Sonderprogrammierung
- Garantie, dass jede Sonderlogik abgebildet wird

### 5.4 Was wir bewusst nicht tun

- Keine kostenlose Light-Version mit kuenstlichen Sperren
- Keine Preisstaffel
- Keine versteckten Zusatzmodule
- Kein Upselling

---

## 6. Zielgruppen im Detail

### 6.1 Nachweis Lokal

**Primaer:** Kleine Teams und Einzelverantwortliche mit Dokumentationspflichten:

- Sicherheitsbeauftragte in Kleinbetrieben
- Hausmeister / Facility-Verantwortliche
- Vereinsvorstande (Geraetepruefungen, Unterweisungen)
- Kleine Vermieter (Uebergabeprotokolle, Rauchmelder)
- Ehrenamtliche (Feuerwehr, THW, Jugendarbeit)
- Handwerker (Wartungs-/Pruefprotokolle)

**Nicht-Zielgruppe:**

- Unternehmen die standortuebergreifende Operations-Plattformen brauchen
- Teams die Echtzeit-Kollaboration und Dashboards erwarten
- Nutzer die einen generischen No-Code-Form-Builder suchen

### 6.2 Rechnung Lokal

**Primaer:** Nebenberufler und Kleinunternehmer mit einfachen Verhaeltnissen:

- Kursleiter, Coaches, Berater, Freelancer, Therapeuten
- Kleinunternehmer nach §19 UStG
- 2-50 Rechnungen pro Monat
- Bisher Word/Excel oder gar nichts
- Steuererklaerung selbst via ELSTER, kein Steuerberater

**Nicht-Zielgruppe:**

- Unternehmen mit komplexer Buchhaltung oder DATEV-Erwartung
- Unternehmen mit Warenwirtschaft, Lager, Bestellwesen
- Teams die gleichzeitig Rechnungen schreiben

### 6.3 Mitglieder Lokal

**Primaer:** Kleine bis mittlere Vereine mit 30-250 Mitgliedern:

- Ehrenamtlich organisiert
- Eine Hauptperson fuer die Verwaltung
- Bisher Excel, Papier oder unuebersichtliche Einzelloesungen
- Keine Cloud gewuenscht
- Einfache bis moderate Mehrspartenstruktur

**Nicht-Zielgruppe:**

- Vereine mit stark arbeitsteiligem Vorstand und gleichzeitiger Datenpflege
- Vereine mit komplexer Buchhaltung oder DATEV-Erwartung
- Vereine die App, Mitgliederportal oder integrierten Mailversand erwarten

---

## 7. Erwartungsmanagement

### 7.1 Was die Produkte sind

Lokale Organisationswerkzeuge fuer typische Aufgaben der jeweiligen Zielgruppe.

### 7.2 Was die Produkte nicht sind

- **Keine Cloud-Plattform**
- **Keine Team-Kollaborationssoftware**
- **Keine vollwertige Finanzbuchhaltung** (keine doppelte Buchfuehrung, kein SKR03/04)
- **Kein DATEV-System**
- **Kein ERP-System** (keine Warenwirtschaft, kein Lager)
- **Keine Operations-/Compliance-Plattform** (kein SafetyCulture/Lumiform-Ersatz)
- **Kein App-Oekosystem**
- **Kein Ersatz fuer Steuer-, Rechts- oder Fachberatung**

### 7.3 Support-Erwartung

**Grundsatz:** Support ist das Sicherheitsnetz, nicht das Produkt.
Der Hauptwert des Servicepakets ist Bequemlichkeit (Installer, Updates)
und Inhalte (Vorlagen). Nicht persoenliche Betreuung.

**Dreistufige Problemloesung (Deflection by Design):**

| Stufe | Was passiert | Aufwand |
|-------|-------------|---------|
| 1. Selbstdiagnose | Integritaetspruefung, Fehlercodes, Diagnose-Bundle, In-App-Hinweise | Null (eingebaut) |
| 2. Wissensdatenbank | FAQ, Fehlerkatalog, Video-Anleitungen (einmalig erstellen) | Einmal |
| 3. Ticket (48h) | Asynchron, Diagnose-Bundle vorausgefuellt, kein Echtzeit-Kanal | Gebatcht |

**Kein Chat. Kein Telefon. Keine Echtzeit.** Das ist keine Einschraenkung —
das ist das Modell. Bei 39 EUR/Jahr ist asynchroner Support mit 48h-Antwortzeit
voellig angemessen und muss auf der Verkaufsseite glasklar stehen.

**Support-Scope:**

Abgedeckt:
- Installation und Updates
- Fehler in der Software (Bugs)
- Datenwiederherstellung (Backup)

Nicht abgedeckt:
- "Wie funktioniert Feature X?" → Doku / Videos
- Individuelle Einrichtung oder Datenmigration
- Schulungen
- Steuer-, Rechts-, Vereins- oder Buchhaltungsberatung
- Sonderprogrammierung
- Notfall-SLA

**Batch-Processing:** Tickets werden nicht reaktiv bearbeitet, sondern in
festen Zeitbloecken (z.B. 2h pro Woche). Das 48h-SLA gibt diesen Puffer.

**KI-Triage:** Diagnose-Bundle automatisch auswerten und dem Ticket eine
Kategorie + Loesungsvorschlag anhaengen — bevor der Mensch es sieht.
Aber nicht als "KI-Support-Chat" verkaufen, der Eskalationserwartungen weckt.

---

## 8. Produktprinzipien fuer die Entwicklung

Jedes neue Feature muss an diesen Fragen bestehen:

1. **Loest es ein haeufiges Problem der Hauptzielgruppe?**
2. **Ist es ohne Schulung verstaendlich?**
3. **Passt es zur lokalen Single-User-Grundidee?**
4. **Reduziert oder erhoeht es Supportaufwand?**
5. **Erzeugt es gefaehrliche Erwartungen in Richtung Buchhaltung, Kollaboration oder Beratung?**
6. **Laesst es sich stabil testen und klar begrenzen?**
7. **Gehoert es in den Shared-Kern oder ist es produktspezifisch?**

Wenn ein Feature diese Fragen nicht sauber besteht, kommt es nicht in v1.

---

## 9. Featurestrategie Nachweis Lokal

### 9.1 Kern v1.0

#### A. Pruefvorlagen / Checklisten

- Vorlagen anlegen und verwalten (CRUD)
- Pflichtfelder, Abschnitte, Bewertung/Status
- Feldtypen: Ja/Nein, Text, Datum, Zahl
- Vorlagen kopieren und anpassen

#### B. Nachweis-Erfassung

- Pruefung aus Vorlage starten
- Foto-Referenzen anhaengen
- Unterschriftsfeld (optional)
- Notizen, Zeitstempel, verantwortliche Person
- Status: offen → geprueft → bestanden/bemaengelt

#### C. Pruefprotokoll / Bericht

- Aus jeder Pruefung automatisch ein PDF-Bericht
- Sammel-PDF fuer Zeitraeume
- Druckansicht
- CSV-Export

#### D. Faelligkeits-Tracker

- Naechste Pruefung / naechster Termin
- Uebersicht faelliger und ueberfaelliger Pruefungen
- Filter nach Objekt, Typ, Status

#### E. Nachvollziehbare Historie

- Aenderungen sichtbar (Timeline pro Objekt)
- Keine stillen Ueberschreibungen
- audit-chain im Hintergrund (HMAC-SHA256 Hash-Kette)
- Verifikation der Kette auf Knopfdruck

#### F. Betriebssicherheit

- Backup / Wiederherstellung
- Datenexport (CSV, JSON)
- Diagnosepaket
- Lizenz-System (39 EUR/Jahr Servicepaket)

### 9.2 Bewusst nicht in v1

- Mehrbenutzer-Workflows
- E-Mail-Versand / Benachrichtigungen
- Eskalationslogik / CAPA
- Mobile Aussendienst-App
- Komplexe Rollenmodelle
- Externe Integrationen (API, Webhooks)
- Kundenportal / Dashboard
- Signatur-Workflows (digitale Signaturen mit Zertifikat)

### 9.3 Beste Einstiegs-Use-Cases

1. **Wartungs- und Pruefprotokolle** (Geraete, Anlagen, Fahrzeuge)
2. **Uebergaben und Abnahmen** (Wohnungen, Raeume, Arbeitsplaetze)
3. **Hygiene-, Sicherheits- oder Routine-Checklisten** (HACCP, Arbeitsschutz, Brandschutz)

### 9.4 Neue Plattform-Bausteine

| Baustein | Wiederverwendung |
|----------|-----------------|
| Vorlagen-Engine | Rechnung Lokal (Rechnungsvorlagen), Mitglieder Lokal (Versammlungsvorlagen) |
| Pruefprotokoll-Modul | Handwerk-Bundle, Kommunal-Bundle, Agrar-Bundle |
| Faelligkeits-/Fristen-Tracker | Alle Produkte mit wiederkehrenden Terminen |
| Status-Workflow-Engine | Alle Produkte mit Vorgangsbearbeitung |
| Timeline-/Historien-Ansicht | Alle Produkte mit Audit-Log |

---

## 10. Featurestrategie Rechnung Lokal

### 10.1 Kern v1.0

#### A. Rechnungsstellung

- Rechnung erstellen (Positionen, Einzelpreis, Menge, Summe)
- Pflichtangaben nach §14 UStG automatisch befuellt
- Kleinunternehmer-Regelung (§19 UStG) als Profil-Einstellung
- Rechnungsnummern fortlaufend, konfigurierbar
- Kunde anlegen / aus Liste waehlen
- Wiederkehrende Rechnungen (Vorlage → Klick → neue Rechnung)
- Storno-Rechnung (Gutschrift) statt Loeschen
- **ZUGFeRD-Export (PDF/A-3 + eingebettetes XML nach EN 16931)**
- Einfacher PDF-Export (fuer B2C)

#### B. Kundenverwaltung (schlank)

- Kunde: Name, Firma, Anschrift, USt-IdNr., Kontakt
- Suche und Filter
- Kennzeichnung B2B / B2C

#### C. Einnahmen-Ausgaben-Uebersicht (EUeR)

- Einnahmen automatisch aus Rechnungen (wenn als bezahlt markiert)
- Ausgaben manuell erfassen (Datum, Betrag, Kategorie, Beleg)
- Kategorien nach Anlage EUeR (BMF-Standard)
- Jahresuebersicht mit Summen pro Kategorie
- Monatsuebersicht / Saldo
- Storno statt Loeschen
- Jahresabschluss-PDF

#### D. Geschaeftsprofil

- Firmenname / Name, Anschrift, Steuernummer
- Bankverbindung, Logo / Briefkopf
- Kleinunternehmer ja/nein, Standard-Steuersatz

#### E. Betriebssicherheit

- Backup / Wiederherstellung
- Datenexport (CSV, JSON)
- Audit-Log (Event-Log mit Hash-Kette)
- Diagnosepaket
- 10-Jahres-Aufbewahrungshinweis

### 10.2 Bewusst nicht in v1

- Kein ELSTER-Direktexport
- Keine Angebote / Auftragsbestaetigungen
- Keine automatischen Mahnungen
- Kein Kassenbuch, kein DATEV-Export
- Keine Warenwirtschaft
- Keine Umsatzsteuervoranmeldung

### 10.3 Regulatorisch verpflichtend

| Anforderung | Umsetzung |
|---|---|
| Pflichtangaben §14 UStG | Profil-Felder + automatische Befuellung |
| Kleinunternehmer §19 UStG | Profil-Einstellung, Hinweistext auf Rechnung |
| Fortlaufende Rechnungsnummern | Auto-Increment, konfigurierbar |
| ZUGFeRD (E-Rechnung) | PDF/A-3 + EN 16931 XML, ab v1.0 Pflicht |
| Aufbewahrung 10 Jahre | Storno statt Loeschen, kein automatisches Loeschen |
| GoBD-Prozessunterstuetzung | Event-Log, Hash-Kette, Unveraenderbarkeit |
| Haftungsausschluss | "Organisatorisches Hilfsmittel, ersetzt keine Steuerberatung" |

---

## 11. Featurestrategie Mitglieder Lokal

### 11.1 Kern v1.0 (= v2.0 auf Shared-Architektur)

#### A. Mitgliederverwaltung

- Mitglied anlegen, bearbeiten, deaktivieren
- Suche und Filter
- Status und Eintritt/Austritt
- Gruppen / Abteilungen / Sparten (Mitglied kann mehreren zugeordnet sein)
- CSV-Import und CSV-Export
- PDF-Mitgliederlisten, Filter nach Sparte
- DSGVO-Basisfunktionen (Loeschung, Einwilligung, Audit-Log)

#### B. Beitraege in schlanker Form

- Beitragsklassen
- Soll-/Ist-Status
- Manuelle Zahlungserfassung
- Jahresuebersicht
- Einfache Mahn- oder Hinweisdokumente als PDF

#### C. Einnahmen-Ausgaben-Uebersicht

- Aus finanz-shared: dieselbe EUeR-Logik wie Rechnung Lokal
- Kategorien: Ideeller Bereich, Wirtschaftl. Geschaeftsbetrieb, Vermoegensverwaltung
- Jahresabschluss-PDF fuer Kassenpruefer
- Storno statt Loeschen

#### D. Spenden / Bescheinigungen

- Spenderdaten verwalten
- Zuwendungsbestaetigungen nach BMF-Muster (PDF)
- Sammel-PDF pro Jahr

#### E. Betriebssicherheit

- Aus electron-platform: Backup, Wiederherstellung, Diagnosepaket
- Datenexport, Umzugs-/Uebergabehilfe

### 11.2 Bewusst nicht im Kern

- Echter Mehrplatzbetrieb / Live-Sync
- SEPA-XML-Erzeugung (nur bei klarer Nachfrage)
- DATEV, GoBD-Zertifizierung
- E-Mail-Versand, Mobile App
- Online-Mitgliedsantraege, Multi-Mandanten

---

## 12. Shared-Architektur

### 12.1 Grundprinzip

Produkte sind **Konfigurationen eines gemeinsamen Kerns**, nicht eigene Codebasen.

Sie unterscheiden sich in:

- Welche Feature-Module aktiviert sind
- Welche Views / Routes sichtbar sind
- Welche Templates / PDF-Ausgaben verfuegbar sind
- Welche Begriffe in der UI verwendet werden

Sie teilen sich:

- Das Datenmodell
- Die Geschaeftslogik (Personen-CRUD, Zahlungen, EUeR)
- Die Komponenten (DataTable, SearchBar, Export, PDF-Engine)
- Die Plattform (Electron, Backup, License, Support, Update)
- audit-chain (Hash-Kette fuer alle Produkte mit DB)

### 12.2 Package-Struktur

```
packages/
  electron-platform/        (existiert) Electron Main-Prozess
  shared/                   (existiert) Crypto, CSV, License
  app-shared/               (existiert) Svelte 5 Shared Components
  ui-shared/                (existiert) Generische UI-Komponenten
  finanz-shared/            (existiert) Shared Finanz-Kern
  audit-chain/              (existiert) npm-Paket, publish-ready v0.1.0

products/
  nachweis-lokal/            (NEU) Nachweis Lokal
  rechnung-lokal/            (existiert) Rechnung Lokal
  mitglieder-lokal/          (existiert) Mitglieder Lokal v0.5.0
  finanz-rechner/            (existiert) FinanzRechner Lokal v0.2.0
```

### 12.3 Feature-Flags per Produktkonfiguration

```js
// Nachweis Lokal
{
  features: {
    inspections: true, templates: true, deadlines: true,
    invoices: false, customers: false, euer: false, zugferd: false,
    members: false, departments: false, fees: false,
    donations: false, assembly: false
  },
  labels: { person: 'Verantwortlicher', profile: 'Organisationsprofil' }
}

// Rechnung Lokal
{
  features: {
    inspections: false, templates: false, deadlines: false,
    invoices: true, customers: true, euer: true, zugferd: true,
    members: false, departments: false, fees: false,
    donations: false, assembly: false
  },
  labels: { person: 'Kunde', personPlural: 'Kunden', profile: 'Geschaeftsprofil' }
}

// Mitglieder Lokal
{
  features: {
    inspections: false, templates: false, deadlines: false,
    invoices: false, customers: false, euer: true, zugferd: false,
    members: true, departments: true, fees: true,
    donations: true, assembly: true
  },
  labels: { person: 'Mitglied', personPlural: 'Mitglieder', profile: 'Vereinsprofil' }
}
```

---

## 13. Leitlinie Mehrplatz / Zusammenarbeit

### Grundsatz

Alle Produkte sind **Single-User-Desktop-Apps**.

### Was wir priorisieren

- Saubere Backups
- Einfache Datenuebergabe (Vorstandswechsel, Rechner-Umzug)
- Wiederherstellung
- Datenexport in offenen Formaten

### Was wir vorerst nicht versprechen

- Gleichzeitiges Bearbeiten durch mehrere Personen
- Konfliktfreies Live-Sync
- Cloud-gestuetzte Teamarbeit

---

## 14. Feature-Roadmap

### Phase 1: finanz-shared + audit-chain (DONE)

- Gemeinsames Datenmodell, Models, EUeR-Logik, Tests
- audit-chain npm-Paket (38 Tests, publish-ready)

### Phase 2: Nachweis Lokal v1.0 (NAECHSTER SCHRITT)

- Pruefvorlagen / Checklisten
- Nachweis-Erfassung mit Foto + Unterschrift
- PDF-Pruefprotokolle
- Faelligkeits-Tracker
- audit-chain als sichtbares Kernversprechen
- Installer + Produkttexte + Portal-Eintrag

### Phase 3: Rechnung Lokal v1.0

- Rechnungsstellung + ZUGFeRD
- EUeR-Uebersicht
- Kundenverwaltung
- PDF/CSV + Backup

### Phase 4: Stabilitaet (alle Produkte)

- Bessere Validierung und Hilfetexte
- Recovery-Center und Diagnosepakete
- Import-Assistenten
- Mehr Standardvorlagen

### Phase 5: Mitglieder Lokal v2.0 auf Shared-Architektur

- Neubau auf finanz-shared
- Migration bestehender v0.5.0-Datenbanken
- Spendenbescheinigungen, Sparten, Beitraege

### Phase 6: Bundle-Erweiterungen (bei Nachfrage)

- Teilnehmer Lokal
- Immobilien Lokal (aus Bundle B1)
- Handwerk Lokal (aus Bundle B2)
- Weitere Produkte durch Feature-Aktivierung

### Nicht als Standardziel

- Komplexer Mehrplatz-Sync
- ELSTER-Direktexport (ERiC-SDK)
- DATEV-Export
- Umsatzsteuervoranmeldung
- Cloud-Zentralserver
- Operations-/Compliance-Plattform

---

## 15. Harte Produktentscheidungen

Wenn "mehr Features" gegen "weniger Supportaufwand" steht → **weniger Supportaufwand**.

Wenn "groessere Zielgruppe" gegen "klarere Positionierung" steht → **klarere Positionierung**.

Wenn "technisch elegant" gegen "einfach erklaerbar" steht → **einfach erklaerbar**.

Wenn "produktspezifischer Code" gegen "Shared-Kern" steht → **Shared-Kern**, sofern das Feature in mindestens zwei Produkten sinnvoll ist.

---

## 16. Kommunikation

### 16.1 Gemeinsame Dachmarke

Alle Produkte sind **"Lokal-Tools"** der Code-Fabrik. Sie teilen:

- Dasselbe Vertrauensversprechen (lokal, offen, fair, nachvollziehbar)
- Denselben Preis (39 EUR/Jahr)
- Dasselbe Geschaeftsmodell (Open Source + Servicepaket)
- Dasselbe Portal fuer Downloads, Support und Updates

### 16.2 Nachweis Lokal — Kernbotschaft

**Nachweise, die bleiben. Pruefprotokolle, Checklisten und Belege lokal dokumentieren —
einfach, nachvollziehbar und ohne Cloud-Zwang.**

### 16.3 Rechnung Lokal — Kernbotschaft

**Rechnungen schreiben, E-Rechnung erzeugen, Einnahmen und Ausgaben im Blick —
ohne Cloud-Zwang und ohne Buchhaltungssoftware.**

### 16.4 Mitglieder Lokal — Kernbotschaft

**Mitglieder, Sparten, Beitraege und Standarddokumente lokal verwalten —
offen, nachvollziehbar und ohne aufgeblaehte SaaS-Plattform.**

### 16.5 Was auf Verkaufsseiten klar gesagt werden muss (alle Produkte)

- Open Source, aber das kostenpflichtige Angebot ist das Servicepaket
- Lokal und cloudfrei
- Fuer einfache bis mittlere Anforderungen
- Keine kuenstlichen Feature-Sperren
- Keine Telefonhotline, kein individuelles Consulting
- Keine Steuer-, Rechts- oder Buchhaltungsberatung
- Kein gleichzeitiger Mehrplatzbetrieb
- Organisatorisches Hilfsmittel, ersetzt keine Fachberatung

---

## 17. Risiken

| Risiko | Betrifft | Eintritt | Gegenmassnahme |
|---|---|---|---|
| Nachweis-Scope wird zu breit ("alles dokumentieren") | Nachweis | Hoch | 3 konkrete Use-Cases als Gate |
| ZUGFeRD komplexer als erwartet | Rechnung | Mittel | Library evaluieren, offizielle Testdaten |
| Shared-Datenmodell passt nicht fuer alle Produkte | Alle | Niedrig | Nachweis Lokal und Rechnung Lokal zuerst beweisen |
| Migration Mitglieder v0.5.0 → neues Schema | Mitglieder | Niedrig | Backup vor Migration, Fixture-Tests |
| SafetyCulture/Lumiform bieten Free-Tier an | Nachweis | Mittel | Differenzierung: lokal, keine Cloud, kein Account |
| Nebenberufler gehen zu lexoffice | Rechnung | Hoch | Akzeptiertes Risiko, organisches Wachstum |
| Feature-Creep | Alle | Hoch | Diese Leitlinie als Gate |
| Kein Umsatz in den ersten 6 Monaten | Alle | Hoch | Nebenerwerb, kein Kostendruck |

---

## 18. Kurzfassung fuer interne Entscheidungen

**Drei Produkte, ein Kern. Nachweis Lokal zuerst.**

**Nachweis Lokal:** Pruefprotokolle + Checklisten + Nachweise fuer kleine Teams. Kommt zuerst — audit-chain als sichtbares Kernversprechen, 5 neue Plattform-Bausteine.

**Rechnung Lokal:** Rechnungen + EUeR + ZUGFeRD fuer Nebenberufler. Kommt danach — E-Rechnungspflicht 2028 als Markttreiber.

**Mitglieder Lokal:** Mitglieder + Sparten + Beitraege + Spendenbescheinigungen fuer Vereine. Kommt als Neubau auf der bewiesenen Architektur.

**Preis:** 39 EUR/Jahr pro Produkt.

**Architektur:** Shared-Kern, Feature-Flags per Produktkonfiguration, audit-chain als gemeinsame Integritaetsschicht. Produkte unterscheiden sich in Labels, Views und aktivierten Modulen.

**Nicht-Kern:** Mehrplatz-Sync, Buchhaltung, DATEV, App, Mailversand, Cloud, Operations-Plattform.

**Prinzip:** Lieber kleiner, stabiler und klarer als breiter, lauter und supportintensiver.

**Positionierung:** "Dokumentieren statt suchen. Belegen statt behaupten. Lokal arbeiten statt SaaS-Abhaengigkeit."
