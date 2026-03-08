# Recherche-Prompt: 5 Bundles à 25 Tools fuer Code-Fabrik

*Erstellt: 2026-03-07*
*Zweck: Autonome Recherche ohne Rueckfragen — liefert 5 Themenbundles mit je 25 konkreten Tools (125 Tools gesamt)*

---

## Anweisung

Du bist Produktstratege fuer eine Software-Manufaktur namens "Code-Fabrik". Deine Aufgabe: Identifiziere genau **5 neue Themenbundles** mit je **25 konkreten Tools** (= 125 Tools gesamt), die wir noch NICHT auf dem Radar haben. Jedes Bundle ist ein Themenbereich mit einer gemeinsamen Zielgruppe. Liefere das Ergebnis vollstaendig und ohne Rueckfragen.

### WICHTIG — Mengenregel (nicht verhandelbar)

- Jedes Bundle MUSS exakt **25 verschiedene, eigenstaendige Tools** enthalten.
- Die Tabelle pro Bundle MUSS 25 nummerierte Zeilen haben (Nr. 1 bis 25).
- 5 Bundles × 25 Tools = **125 Tools gesamt**. Weniger ist nicht akzeptabel.
- Kuerze NICHT ab. Schreibe KEINE Platzhalter wie "weitere Tools analog". Jede Zeile ist ein eigenes Tool mit eigenem Namen und eigener Funktion.
- Pruefe am Ende jedes Bundles: Hast du 25 Zeilen? Wenn nein, ergaenze bis 25.
- Pruefe am Ende der gesamten Ausgabe: Hast du 125 Tools? Wenn nein, ist die Ausgabe unvollstaendig.

### Ausgabe-Strategie (wichtig bei langen Antworten)

Die vollstaendige Ausgabe ist lang (125 Tools + Bewertungen). Das ist gewollt. Arbeite die Bundles **nacheinander** ab:
1. Bundle 1 komplett (alle 25 Tools + Abgrenzung)
2. Bundle 2 komplett (alle 25 Tools + Abgrenzung)
3. Bundle 3 komplett (alle 25 Tools + Abgrenzung)
4. Bundle 4 komplett (alle 25 Tools + Abgrenzung)
5. Bundle 5 komplett (alle 25 Tools + Abgrenzung)
6. Bewertungsmatrix + Top-10-Liste

Wenn du an ein Ausgabelimit stoesst, hoere NICHT auf. Mache einfach im naechsten Turn weiter, genau dort wo du aufgehoert hast. Du hast genuegend Turns zur Verfuegung.

---

## Kontext: Was Code-Fabrik ist

Code-Fabrik baut fokussierte Micro-Tools als lokale Desktop-Apps (Electron + Svelte 5 + SQLite) fuer kleine Organisationen und Fachanwender im DACH-Raum. Verkauft wird nicht die Software (GPL 3.0, Open Source), sondern ein Support-Abo (29 EUR/Jahr) mit fertigen Installern, Updates, Support, Templates und gebrandeten PDF-Exporten.

### Plattformkern (bereits gebaut, wiederverwendbar)

Jedes neue Produkt erbt automatisch:
- SQLite-Datenbank (lokal, verschluesselt mit SQLCipher)
- Event-Log mit HMAC-SHA256 Hash-Kette (revisionssicher)
- PDF-Export (pdfmake, Listen, Formulare, Briefe)
- CSV-Import/Export (Semikolon, UTF-8 BOM, Excel-kompatibel)
- Lokales Backup (automatisch, 7d/4w/monatlich Rotation)
- Lizenz-System (3-Stufen-Validierung, Key-basiert, kein Account)
- Support-Integration (Ticket-System, Diagnose-Bundle, DSGVO-konform)
- DSGVO-Funktionen (Datenauskunft, Loeschung, Anonymisierung)
- Electron-Wrapper mit Auto-Update
- Svelte 5 UI-Components (DataTable, SearchBar, ExportButton)

### Vier Versprechen (Markenkern)

1. **Kein Geheimnis** — Code offen, Berechnungen nachpruefbar, Testberichte oeffentlich
2. **Keine Cloud** — Alle Daten lokal, kein Tracking, kein Telemetrie, kein API-Call
3. **Kein Kaefig** — Datenexport in offenen Formaten, GPL 3.0, kein Vendor Lock-in
4. **Kein Kontakt noetig** — Kein Account, kein Login, Key = einzige Identitaet

### Architektur-Einschraenkungen

- **Strict no email**: Tools versenden KEINE E-Mails
- **Kein Cloud-Sync**: Alles lokal (SQLite, Dateien)
- **Keine KI im Tool**: KI-entwickelt, aber KI-frei im Endprodukt
- **Keine Gesundheitsdaten**: Art. 9 DSGVO vermeiden (keine besonderen Kategorien)
- **Keine Beratungsfunktion**: Tools rechnen/dokumentieren, beraten nicht
- **MVP-Regel**: 1 Kernfunktion + Export, max. 2 Wochen Entwicklungszeit

### Ideale Produkteigenschaften

Ein gutes Code-Fabrik-Produkt hat:
- Einen klar umrissenen, wiederkehrenden Kernprozess (erfassen, pruefen, berechnen, drucken, exportieren, dokumentieren)
- Hohen Plattformanteil (nutzt SQLite, PDF, CSV, Audit-Log, Listen/Filter)
- Eine kleine, erreichbare Zielgruppe im DACH-Raum
- Niedrige Haftung (organisatorisches Hilfsmittel, kein Fachberater)
- Monetarisierungspotenzial ueber das Support-Abo-Modell
- Potenzial als horizontaler Plattformverstaerker (staerkt Bausteine fuer andere Produkte)

---

## Was bereits existiert oder geplant ist (NICHT nochmal vorschlagen)

### Fertige Produkte
- **MitgliederSimple** (B-05): Vereins-Mitgliederverwaltung (CRUD, Beitraege, Mahnbriefe, PDF-Listen, DSGVO)
- **FinanzRechner** (B-24): 5 Versicherungsmakler-Rechner (Ratenzuschlag, SpartenDeckung, BeitragsAnpassung, StornoHaftung, CourtagenBarwert)
- **FruehwarnReport**: Python-basierter Fruehwarnbericht (eigenstaendig, nicht Electron)

### Geplante Bundles (aus Gesamtkonzept)
- **B-05 Vereine**: Weitere Vereins-Tools (Spendenquittung, SEPA-Plugin, Kommunikations-Plugin, Multi-Sparten, Statistik, Satzungsverwaltung) — alles in der Produktspec dokumentiert
- **B-24 Finanz-Rechner**: Weitere Makler-Rechner
- **B-21 Makler-Buero**: Organisatorische Tools (Gespraechsnotiz, IDD-Tracker)
- **B-22 Compliance**: Compliance-Checklisten
- **B-01 Arbeitsschutz**: Vorlagen basierend auf DGUV-Vorschriften, ArbSchG (spaeter)

### Bewertete Produktideen (bereits dokumentiert)
- **NachweisSimple**: Pruefprotokolle, Checklisten, Nachweise, Historie (horizontaler Plattformverstaerker)
- **TeilnehmerSimple**: Teilnehmer-, Helfer-, Gruppen-, Kursverwaltung (Ableitung aus Vereinslogik)

---

## Dein Auftrag

Finde genau **5 neue Themenbundles** mit je **25 konkreten Tools** (125 Tools gesamt), die:

1. **Noch nicht oben gelistet sind** (keine Vereins-Tools, keine Finanz-Rechner, kein Arbeitsschutz, kein Makler-Buero, kein NachweisSimple, kein TeilnehmerSimple)
2. **Zum Plattformkern passen** (SQLite, PDF, CSV, Listen, Audit-Log, lokale Datenhaltung)
3. **Eine reale, erreichbare Zielgruppe im DACH-Raum haben** (keine hypothetischen Maerkte)
4. **Niedrige bis mittlere Haftung** haben (organisatorisch, nicht beratend)
5. **Pro Tool mit der MVP-Regel umsetzbar sind** (Kernfunktion + Export in 2 Wochen)
6. **Die Plattform staerken** (neue Bausteine, die auch anderen Produkten helfen)
7. **Als Bundle Sinn ergeben** (gleiche Zielgruppe, gemeinsamer Kontext, Cross-Selling-Potenzial)

## Ausgabeformat

### Pro Bundle:

#### Bundle [Nummer]: [Bundle-Name] — [Einzeiler]

**Zielgruppe:** Wer nutzt das? (konkret, DACH-Raum)
**Gemeinsamer Kontext:** Was verbindet die 25 Tools?
**Monetarisierung:** Warum wuerde diese Zielgruppe 29 EUR/Jahr bezahlen?
**Haftung:** Niedrig/Mittel — Begruendung
**Marktluecke:** Welche bestehenden Loesungen sind zu gross, zu teuer oder zu cloud-lastig?

### Pro Tool (exakt 25 Zeilen pro Bundle — keine Ausnahme):

| Nr. | Toolname | Einzeiler | Kernprozess (3-5 Schritte) | MVP-Scope (1 Funktion + Export) | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|---------------------------|--------------------------------|-----------------|----------------|
| 1   | ...      | ...       | ...                       | ...                            | ...             | ...            |
| 2   | ...      | ...       | ...                       | ...                            | ...             | ...            |
| ... | ...      | ...       | ...                       | ...                            | ...             | ...            |
| 25  | ...      | ...       | ...                       | ...                            | ...             | ...            |

Die Tabelle MUSS durchnummeriert von 1 bis 25 sein. Jede Zeile ein eigenes, unterscheidbares Tool. Keine Zusammenfassungen, keine "etc.", keine Auslassungen.

**Abgrenzung Bundle:** Was gehoert bewusst NICHT rein? (Drift-Risiken benennen)

## Bewertungsmatrix (am Ende)

Erstelle eine Tabelle mit Bewertung (1-5 Sterne) fuer jedes **Bundle** (nicht einzelne Tools):

| Bundle | Plattform-Fit | Zielgruppen-Schaerfe | Monetarisierung | Haftungsrisiko | Plattform-Verstaerkung | Umsetzbarkeit (2 Wo./Tool) | Gesamt |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|

Sortiere die 5 Bundles nach Gesamtbewertung (bestes zuerst).

Zusaetzlich: Erstelle eine **Top-10-Liste** der vielversprechendsten Einzel-Tools ueber alle Bundles hinweg, sortiert nach Potenzial.

---

## Vollstaendigkeitspruefung (am Schluss)

Bevor du die Ausgabe abschliesst, zaehle:
1. Anzahl Bundles: muss = 5
2. Anzahl Tools pro Bundle: muss = 25
3. Gesamtzahl Tools: muss = 125
4. Bewertungsmatrix: muss 5 Zeilen haben
5. Top-10-Liste: muss 10 Eintraege haben

Falls eine Zahl nicht stimmt, ergaenze die fehlenden Eintraege. Liefere KEINE gekuerzte Ausgabe.

---

## Qualitaetskriterien

- Keine generischen "Projektmanagement"- oder "Todo"-Tools
- Keine Tools die es bereits als gute, guenstige Desktop-App gibt
- Keine Tools die Cloud oder Mehrbenutzer zwingend brauchen
- Keine Tools mit Art. 9 DSGVO Daten (Gesundheit, Religion, Biometrie, Gewerkschaft)
- Jedes Produkt muss einen Kernprozess haben, den die Zielgruppe HEUTE mit Excel, Word oder Papier erledigt
- Denke an Nischen: Handwerk, Landwirtschaft, Feuerwehr, Stiftungen, Genossenschaften, freie Berufe, Bildungstraeger, Wohnungseigentuemergemeinschaften, Jagdgenossenschaften, Fischereivereine, Imker, Kleingartenvereine, Schiedsleute, Friedhofsverwalter, Kirchengemeinden, etc.
