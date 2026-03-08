# Mitglieder Lokal — Feature-Übersicht & Wettbewerbsvergleich

Stand: März 2026

## 1. Feature-Übersicht Mitglieder Lokal

Der Mindest-Funktionsumfang für Version 1.0, der Mitglieder Lokal als vollwertiges
Vereinswerkzeug konkurrenzfähig macht.

### 1.1 Mitgliederverwaltung (Kern)

- **Mitglieder-CRUD**: Anlegen, bearbeiten, (de-)aktivieren, durchsuchen
- **Gruppen / Abteilungen**: Mitglieder organisieren (Vorstand, Jugend, Abteilung A/B)
- **Flexible Felder**: Frei definierbare Zusatzfelder pro Verein
- **Suche & Filter**: Volltextsuche, Filter nach Gruppe, Status, Beitragsstufe
- **CSV-Import/Export**: Datenübernahme aus Excel, Export für Weiterverarbeitung
- **PDF-Mitgliederliste**: Druckbare Liste mit konfigurierbaren Spalten
- **DSGVO**: Löschfunktion, Einwilligungsvermerk, Audit-Log

### 1.2 Beiträge & SEPA

- **Beitragsstufen**: Verschiedene Beiträge (Voll, Ermäßigt, Familie, Jugend, Ehrenmitglied)
- **Beitragsabrechnung**: Jahres-/Halbjahres-/Quartalsabrechnung pro Mitglied
- **SEPA-XML-Erzeugung**: pain.008 Lastschriftdatei für Bankupload, inkl. Mandatsreferenz
- **Beitragsbescheinigung**: PDF-Bescheinigung pro Mitglied für Steuer/Arbeitgeber

### 1.3 Finanzübersicht

> Hinweis: Kein GoBD-pflichtiges Kassenbuch, sondern eine Einnahmen-Ausgaben-Übersicht
> als Dokumentationswerkzeug für den Schatzmeister und die Kassenprüfer.

- **Einnahmen/Ausgaben erfassen**: Datum, Betrag, Kategorie, Beschreibung, Belegnummer
- **Kategorien**: Ideeller Bereich, Wirtschaftl. Geschäftsbetrieb, Vermögensverwaltung
- **Jahresabschluss-PDF**: Zusammenfassung für Mitgliederversammlung und Kassenprüfer
- **Saldo-Übersicht**: Aktueller Kontostand, Monatsübersicht
- **Storno statt Löschen**: Einträge werden storniert, nie gelöscht (Audit-Log)

### 1.4 Zuwendungsbestätigungen / Spendenbescheinigungen

- **Spender-Erfassung**: Name, Adresse, Betrag, Datum, Spendenzweck
- **Amtliches Muster**: PDF nach BMF-Vorgabe (Geldzuwendung / Sachzuwendung)
- **Sammel-PDF**: Alle Bescheinigungen eines Jahres in einem Dokument
- **Vereinsdaten**: Steuernummer, Freistellungsbescheid-Datum, Vereinsname konfigurierbar

### 1.5 Ehrenamtsstunden

- **Stunden erfassen**: Person, Datum, Stunden, Tätigkeit, Kategorie
- **Schnellerfassung**: Mehrere Personen × gleiche Stunden für einen Termin
- **Jahresübersicht**: Summe pro Person, Aufschlüsselung nach Kategorie
- **PDF-Bescheinigung**: Jahresbescheinigung für Finanzamt (§3 Nr. 26/26a EStG)
- **Sammel-PDF**: Alle Bescheinigungen eines Jahres

### 1.6 Versammlungsprotokoll

- **Versammlung anlegen**: Datum, Ort, Art (ordentlich/außerordentlich)
- **Tagesordnung**: TOP-Liste mit Nummerierung
- **Anwesenheitsliste**: Mitglieder abhaken, Stimmberechtigte zählen
- **Abstimmungen**: Ja/Nein/Enthaltung pro TOP, Ergebnis dokumentieren
- **Beschlüsse**: Beschlusstext mit Ergebnis, durchsuchbares Beschlussarchiv
- **PDF-Niederschrift**: Vollständiges Protokoll mit Anwesenheit und Beschlüssen

### 1.7 Plattform & Technisch

- **Lokal/Offline**: Alle Daten auf dem eigenen Rechner, keine Cloud
- **Windows + macOS + Linux**: Native Installer (.exe / .dmg / .AppImage)
- **Open Source**: GPL-3.0, öffentliches Repository ab v1.0
- **1-Klick-Installation**: Kein Java, kein Framework, kein Plugin-System
- **SQLite**: Eine Datei, einfach zu sichern (USB-Stick, Cloud-Ordner)
- **Audit-Log**: Alle Änderungen protokolliert mit Zeitstempel
- **Jahres-Lizenz**: 39 EUR/Jahr, unbegrenzte Mitglieder

### 1.8 Bewusst nicht enthalten

- Keine E-Mail / Newsletter (Vereine nutzen WhatsApp/Signal/E-Mail)
- Kein Website-Baukasten (Vereine nutzen WordPress/Jimdo)
- Keine Mobile App (Desktop-Tool für den Vorstand)
- Kein SKR42 / DATEV (für kleine Vereine irrelevant)
- Keine Online-Mitgliedsanträge (setzt Cloud voraus)
- Keine Rechnungen/Mahnungen (Steuerberater/Lexware)
- Keine GoBD-Zertifizierung (nicht anwendbar auf Einnahmen-Ausgaben-Übersicht)

---

## 2. Wettbewerbsvergleich

Vergleich von Mitglieder Lokal mit den sechs relevantesten Wettbewerbern im DACH-Raum.

### 2.1 Produktübersicht

| | Mitglieder Lokal | ClubDesk Free | WISO Mein Verein XS | JVerein / openJVerein | MTH Vereins-Manager | Vereinsplaner Basis |
|---|---|---|---|---|---|---|
| **Typ** | Desktop | Cloud | Cloud | Desktop | Desktop | Cloud + App |
| **Preis/Jahr** | 39 EUR | 0 EUR | 120 EUR | 0 EUR | 160 EUR | 0 EUR |
| **Mitglieder-Limit** | Unbegrenzt | 50 | 30 | Unbegrenzt | 250 | Unbegrenzt |
| **OS** | Win/Mac/Lin | Web | Web + App | Win/Mac/Lin | Windows | Web + App |
| **Open Source** | GPL-3 | Nein | Nein | GPL | Nein | Nein |
| **Daten lokal** | Ja | Nein | Nein | Ja | Ja | Nein |

### 2.2 Feature-Vergleich im Detail

Legende: Y = Enthalten, N = Nicht enthalten, ~ = Eingeschränkt

#### Mitgliederverwaltung

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Mitglieder-CRUD | Y | Y | Y | Y | Y | Y |
| Gruppen/Abteilungen | Y | Y | Y | Y | Y | Y |
| Suche & Filter | Y | Y | Y | Y | Y | Y |
| CSV-Import/Export | Y | Y | Y | Y | Y | Y |
| PDF-Mitgliederliste | Y | Y | Y | Y | Y | Y |
| DSGVO-Funktionen | Y | Y | Y | Y | ~ | Y |

#### Finanzen & Beiträge

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Beitragsstufen | Y | Y | ~ | Y | Y | N |
| Beitragsabrechnung | Y | Y | ~ | Y | Y | N |
| SEPA-XML (pain.008) | Y | Y | ~ | Y | Y | N |
| Finanzübersicht / EAÜ | Y | Y | ~ | Y | Y | N |
| SKR42-Kontenrahmen | N | N | Y | N | Y | N |
| DATEV-Export | N | N | Y | N | Y | N |
| Rechnungen/Mahnungen | N | Y | Y | Y | Y | N |

#### Spenden & Bescheinigungen

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Spendenverwaltung | Y | bald | Y | Y | Y | N |
| Zuwendungsbestätigung | Y | bald | Y | Y | Y | N |
| Sammel-PDF Spenden | Y | N | N | Y | Y | N |

#### Ehrenamt & Versammlung

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Ehrenamtsstunden | Y | N | N | N | N | N |
| Jahresbescheinigung FA | Y | N | N | N | N | N |
| Versammlungsprotokoll | Y | N | N | N | N | N |
| TOP-Liste & Abstimmung | Y | N | N | N | N | N |
| Beschlussarchiv | Y | N | N | N | N | N |

#### Kommunikation & Web

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| E-Mail-Versand | N | Y | Y | N | Y | N |
| Website-Baukasten | N | Y | Y | N | N | N |
| Mobile App | N | N | Y | N | N | Y |
| Online-Mitgliedsanträge | N | Y | Y | N | N | N |
| Terminverwaltung | N | Y | Y | N | Y | Y |

#### Plattform & Betrieb

| Funktion | Mitgl. Lokal | ClubDesk F | WISO XS | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Offline-fähig | Y | N | N | Y | Y | N |
| Windows nativ | Y | Web | Web | Java | Y | Web |
| macOS nativ | Y | Web | Web | Java | N | Web |
| Linux nativ | Y | Web | Web | Java | N | Web |
| Open Source | Y | N | N | Y | N | N |
| 1-Klick-Installation | Y | Web | Web | N | Y | Web |
| Daten lokal/DSGVO | Y | N | N | Y | Y | N |

---

## 3. Preisvergleich nach Vereinsgröße

Jährliche Kosten in EUR. Mitglieder Lokal hat einen Einheitspreis unabhängig von der Mitgliederzahl.

| Mitglieder | Mitglieder Lokal | ClubDesk | WISO Mein Verein | JVerein | MTH | Vereinsplaner |
|---|---|---|---|---|---|---|
| Bis 30 | 39 | 0 | 120 | 0 | 160 | 0 |
| Bis 50 | 39 | 0 | 120 | 0 | 160 | 0 |
| Bis 100 | 39 | 120 | 240 | 0 | 160 | 99 |
| Bis 250 | 39 | 192 | 420 | 0 | 160 | 147 |
| Bis 500 | 39 | 336 | 420 | 0 | Anfrage | 147 |

---

## 4. Positionierung

### Alleinstellungsmerkmale Mitglieder Lokal

| Merkmal | Warum relevant |
|---|---|
| **Ehrenamtsstunden + Bescheinigung** | Kein anderes Produkt bietet das. Jeder gemeinnützige Verein braucht es im Januar. Allein dieses Feature rechtfertigt 39 EUR/Jahr. |
| **Versammlungsprotokoll** | Kein Wettbewerber hat TOP-Liste + Anwesenheit + Abstimmung + Beschluss-PDF. Jeder Verein muss jährlich protokollieren. |
| **39 EUR/Jahr — unbegrenzt** | Kein Mitglieder-Limit. ClubDesk staffelt ab 50, WISO ab 30. Bei 200 Mitgliedern: 39 EUR vs. 192 EUR (ClubDesk) vs. 420 EUR (WISO). |
| **Lokal + Modern + macOS** | JVerein ist lokal aber altbacken (Java). MTH ist lokal aber nur Windows. ClubDesk ist modern aber Cloud. Mitglieder Lokal ist das einzige moderne, lokale Desktop-Tool für Windows, macOS UND Linux. |
| **Open Source (GPL-3)** | Code einsehbar, keine Abhängigkeit. Verein kann bei Bedarf selbst anpassen oder von Community profitieren. Vertrauenssignal für datensensible Vereine. |

### Funktionale Lücken (bewusst akzeptiert)

| Fehlt | Warum akzeptabel |
|---|---|
| **E-Mail / Newsletter** | Vereine kommunizieren über WhatsApp, Signal oder ihren E-Mail-Client. Ein eingebauter E-Mail-Versand würde Cloud-Infrastruktur (SMTP) erfordern — widerspricht dem Offline-Prinzip. |
| **Website-Baukasten** | Andere Nische. WordPress, Jimdo, Google Sites sind kostenlos und besser. Kein Vereinsvorstand wählt seine Verwaltungssoftware nach dem Website-Baukasten. |
| **Mobile App** | Desktop-Tool für den Vorstand, nicht für jedes Mitglied. Die 2–3 Personen, die den Verein verwalten, sitzen am Schreibtisch. |
| **SKR42 / DATEV** | Nur für Vereine mit Steuerberater relevant. Diese nutzen ohnehin WISO oder dedizierte Buchhaltungssoftware. Kleine Vereine brauchen eine Einnahmen-Ausgaben-Übersicht, keinen Kontenrahmen. |
| **Online-Mitgliedsanträge** | Setzt Cloud voraus. Vereine mit Bedarf nutzen Google Forms oder Vereinsplaner zusätzlich. |

### Zielkunde

Mitglieder Lokal ist ideal für Vereine, die folgende Kriterien erfüllen:

- 20–500 Mitglieder (Sweet Spot: 50–250)
- Ehrenamtlicher Vorstand ohne IT-Budget
- Datenschutz-Bewusstsein (keine Cloud gewünscht)
- Windows, macOS oder Linux im Einsatz
- Bisher Excel, Word-Vorlagen oder Papier-Aktenordner
- Schweizer Vereine (hoher macOS-Anteil, Datensensibilität)

**Nicht ideal für:** Große Sportvereine mit Bedarf an Mannschaftsverwaltung und App-Kommunikation
(besser: SportMember, Vereinsplaner). Vereine mit Steuerberater-Anbindung (besser: WISO, MTH).
Vereine die primär eine Website brauchen (besser: ClubDesk).
