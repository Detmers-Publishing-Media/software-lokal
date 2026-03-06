# Mitgliederverwaltung fuer Vereine — Produktspezifikation & Release-Planung

*Version 1.0 | 2026*
*Vertraulich — Internes Planungsdokument*

---

## 1. Produkt-Vision

Die Vereins-Mitgliederverwaltung von Code-Fabrik ist eine lokal installierte Desktop-Software fuer kleine bis mittelgrosse Vereine. Sie ersetzt Excel-Tabellen und Karteikarten durch eine strukturierte, DSGVO-konforme Loesung — ohne Cloud-Zwang, ohne Abo-Falle fuer Basisnutzer, ohne unnoetige Komplexitaet.

Das Produkt ist als Stufen-Modell konzipiert: Jede Stufe ist in sich vollstaendig nutzbar. Der Verein zahlt nur fuer das was er wirklich braucht — und waechst mit der Software wenn Anforderungen steigen.

### 1.1 Zielgruppe

- Foerdervereine, Dorfgemeinschaften, Elternbeiraete (Stufe 1-2)
- Sportvereine, Kulturvereine mit Beitragseinzug (Stufe 3)
- Multi-Sparten-Vereine mit komplexer Struktur (Stufe 4)
- Grosse Vereine mit aktiver Satzungspflege und Vorstandshaftung (Stufe 5 Premium)

### 1.2 Abgrenzung

- Kein E-Mail-Versand aus der Software (Strict No Email — Plugin uebergibt ans Mailprogramm)
- Kein Online-Banking / Kontozugriff (SEPA-XML-Export fuer manuellen Upload ins Bankportal)
- Keine Gesundheitsdaten (auch nicht fuer Sportvereine mit Arztattesten — separates Modul)
- Keine Beratungsfunktion, kein Scoring, keine automatischen Empfehlungen

---

## 2. Produkt-Stufen im Ueberblick

Das Stufen-Modell folgt dem Prinzip: Jede Stufe baut additiv auf der vorherigen auf. Kein Feature wird beim Upgrade entfernt oder veraendert. Kundendaten bleiben bei jedem Upgrade vollstaendig erhalten.

### 2.1 Stufe 1 — Papier

Stufe 1 liefert alle Funktionen die ein kleiner Verein taeglich braucht: Mitglieder erfassen, Listen drucken, Beitraege manuell ueberwachen und Spendenquittungen ausstellen. Keine Technik-Voraussetzungen ausser einem Windows- oder Mac-Rechner.

- Mitgliederstammdaten vollstaendig (Name, Adresse, Geburtsdatum, Status, Beitragsklasse)
- Alle Listen als druckfertige PDFs (Mitglieder, Telefon, Geburtstag, Jubilare, Mahnliste)
- Beitragsueberwachung manuell: Zahlung erfassen, Jahresuebersicht, Mahnbriefe PDF
- Spendenquittungen (Einzel + Jahres-Sammel) nach amtlichem Muster
- Teilnahmeliste Hauptversammlung mit Quorum-Pruefung
- DSGVO-Einwilligungen erfassen und dokumentieren
- Vereinsprofil / Briefkopf (Name, Logo, IBAN, Freistellungsbescheid)

**Was Stufe 1 nicht hat:** E-Mail-Export, SEPA-Lastschrift, Statistik-Grafiken, mehrere Sparten.

### 2.2 Stufe 2 — Kommunikation

Das Kommunikations-Plugin exportiert einwilligungsgefilterte Kontaktlisten ans Mailprogramm des Vereins. Die Software versendet selbst keine E-Mails — sie uebergibt die gepruefte Empfaengerliste.

- CSV-Export fuer Outlook, Thunderbird, Apple Mail (gefiltert nach Einwilligung)
- VCF-Export (vCard) fuer Einzelkontakte
- Vor dem Export: Anzeige wie viele Mitglieder exportiert werden und wie viele nicht
- Etiketten-Druck (Avery A4-Format) fuer Briefversand
- Serienbrief-Export (Word-kompatibel) fuer individuelle Anschreiben
- Kommunikations-Log: Wann wurde welche Gruppe kontaktiert?

### 2.3 Stufe 3 — Einzug

Das SEPA-Plugin generiert eine standardkonforme XML-Datei (pain.008.003.02) die der Kassenwart manuell in sein Bankportal hochlaedt. Kein Kontozugriff, keine Banking-Regulatorik, keine geteilten Zugangsdaten.

- SEPA-Mandate erfassen (IBAN, Mandatsreferenz automatisch, Mandatsdatum)
- Einzugs-Lauf vorbereiten: Vorschau, Ausnahmen, Sonderposten
- Vorlaufzeit-Rechner (SEPA-Frist: 5 Tage Erst-, 2 Tage Folgelastschrift)
- SEPA-XML generieren → Datei ins Bankportal hochladen
- Einzug bestaetigen: Status automatisch auf 'bezahlt' setzen
- Ruecklast-Verwaltung: Mandat zuruecksetzen, Brief generieren

### 2.4 Stufe 4 — Komplett

- Multi-Sparten: Unbegrenzte Sparten, Mitglied in mehreren Sparten gleichzeitig
- Beitragssaetze pro Sparte separat — SEPA-Einzug summiert automatisch
- Statistik-Modul: Mitgliederentwicklung, Altersstruktur, Beitragseinnahmen (Grafiken)
- PDF-Export Jahresbericht fuer Hauptversammlung
- Warteliste mit Datum und Prioritaet
- Funktionstraeger verwalten (Vorstand, Kassenwart, Ausschuesse mit Amtszeiten)
- Beschluss-Protokoll Vorlage + Archiv
- Ehrungshistorie (wer hat welche Auszeichnung wann erhalten)

### 2.5 Stufe 5 — Premium (Satzungsverwaltung)

Stufe 5 hebt die Satzungsverwaltung von einem Dokumentenarchiv auf eine aktive Steuerungsebene. Die Software kennt das Regelwerk des Vereins und wendet es automatisch an.

- Satzungs-Versionierung: Alle historischen Versionen mit Status und PDF
- Satzungs-Parameter aktiv: Einberufungsfristen, Quorum, Mehrheiten, Amtszeiten — steuern andere Module
- Satzungs-Aenderungs-Workflow: Schritt-fuer-Schritt durch Registergericht + Finanzamt
- Mehrheits-Pruefung: Bei Beschluessen automatisch angezeigt ob Satzungs-Mehrheit erreicht
- Konflikterkennung: Ueberfaellige Amtszeiten, fehlende Kassenpruefungen, ungueltige Kuendigungstermine
- Checkliste Registergericht: Welche Dokumente muessen eingereicht werden?

---

## 3. Produktvergleich — Feature-Uebersicht

| Funktion | Stufe 1 Papier | Stufe 2 Komm. | Stufe 3 Einzug | Stufe 4 Komplett | Stufe 5 Premium |
|----------|:-:|:-:|:-:|:-:|:-:|
| **MITGLIEDERSTAMMDATEN** | | | | | |
| Mitglieder erfassen & bearbeiten | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mitgliedsnummer automatisch | ✓ | ✓ | ✓ | ✓ | ✓ |
| Beitragsklassen definieren | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ein- und Austritte verwalten | ✓ | ✓ | ✓ | ✓ | ✓ |
| Status (Aktiv/Ruhend/Ehrenmitglied) | ✓ | ✓ | ✓ | ✓ | ✓ |
| SEPA-Mandate & IBAN | – | – | ✓ | ✓ | ✓ |
| Mehrere Sparten je Mitglied | – | – | – | ✓ | ✓ |
| Warteliste | – | – | – | ✓ | ✓ |
| **DSGVO & EINWILLIGUNGEN** | | | | | |
| Einwilligung Telefon | ✓ | ✓ | ✓ | ✓ | ✓ |
| Einwilligung E-Mail | ✓ | ✓ | ✓ | ✓ | ✓ |
| Einwilligung Foto (intern) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Einwilligung Foto (oeffentlich) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Widerruf mit Datum dokumentieren | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hinweis bei Exporten (Filter) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Datenauskunft PDF/JSON (Art. 15) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mitglied loeschen/anonymisieren (Art. 17) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Faellige Loeschungen anzeigen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Datenportabilitaet JSON (Art. 20) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **LISTEN & DRUCKEN** | | | | | |
| Mitgliederliste (komplett/gefiltert) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Telefonliste (mit Einwilligung) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Geburtstagsliste | ✓ | ✓ | ✓ | ✓ | ✓ |
| Jubilare des Jahres | ✓ | ✓ | ✓ | ✓ | ✓ |
| Beitragsuebersicht (bezahlt/offen) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mahnliste | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teilnahmeliste Hauptversammlung | ✓ | ✓ | ✓ | ✓ | ✓ |
| Anwesenheitsliste Veranstaltungen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Etiketten-Druck (Avery A4) | – | ✓ | ✓ | ✓ | ✓ |
| Serienbrief-Export (Word) | – | ✓ | ✓ | ✓ | ✓ |
| **BEITRAGSUEBERWACHUNG** | | | | | |
| Zahlung manuell erfassen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bar / Ueberweisung unterscheiden | ✓ | ✓ | ✓ | ✓ | ✓ |
| Jahresuebersicht bezahlt/offen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mahnbriefe PDF (3 Stufen) | ✓ | ✓ | ✓ | ✓ | ✓ |
| SEPA-Einzug mit Bestaetigung | – | – | ✓ | ✓ | ✓ |
| Ruecklast-Verwaltung | – | – | ✓ | ✓ | ✓ |
| **KOMMUNIKATION PLUGIN** | | | | | |
| CSV-Export (Outlook/Thunderbird) | – | ✓ | ✓ | ✓ | ✓ |
| VCF-Export (vCard) | – | ✓ | ✓ | ✓ | ✓ |
| Filter nach Einwilligung | – | ✓ | ✓ | ✓ | ✓ |
| Anzahl-Anzeige vor Export | – | ✓ | ✓ | ✓ | ✓ |
| Kommunikations-Log | – | ✓ | ✓ | ✓ | ✓ |
| **SEPA PLUGIN** | | | | | |
| SEPA-Mandate erfassen | – | – | ✓ | ✓ | ✓ |
| Mandatsreferenz automatisch | – | – | ✓ | ✓ | ✓ |
| Einzugs-Lauf vorbereiten | – | – | ✓ | ✓ | ✓ |
| SEPA-XML generieren (pain.008) | – | – | ✓ | ✓ | ✓ |
| Vorlaufzeit-Rechner | – | – | ✓ | ✓ | ✓ |
| Ruecklastschrift-Brief PDF | – | – | ✓ | ✓ | ✓ |
| **SPENDENQUITTUNG** | | | | | |
| Einzel-Spendenquittung PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| Jahres-Sammelquittung PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fortlaufende Nummerierung | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sachspenden-Quittung | ✓ | ✓ | ✓ | ✓ | ✓ |
| **VERSAMMLUNG** | | | | | |
| Teilnahmeliste generieren | ✓ | ✓ | ✓ | ✓ | ✓ |
| Quorum-Pruefung (manuell) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Beschluss-Protokoll Vorlage | – | – | – | ✓ | ✓ |
| Quorum aus Satzung automatisch | – | – | – | – | ✓ |
| Mehrheits-Pruefung automatisch | – | – | – | – | ✓ |
| **STATISTIK & AUSWERTUNG** | | | | | |
| Mitgliederentwicklung (Grafik) | – | – | – | ✓ | ✓ |
| Altersstruktur (Diagramm) | – | – | – | ✓ | ✓ |
| Beitragseinnahmen Jahresverlauf | – | – | – | ✓ | ✓ |
| Export PDF fuer Jahresbericht | – | – | – | ✓ | ✓ |
| Spartenzugehoerigkeit auswerten | – | – | – | ✓ | ✓ |
| **VEREINSPROFIL & ORGANISATION** | | | | | |
| Vereinsbasisdaten / Briefkopf | ✓ | ✓ | ✓ | ✓ | ✓ |
| Logo hinterlegen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Freistellungsbescheid ablegen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Funktionstraeger verwalten | – | – | – | ✓ | ✓ |
| Amtszeit-Erinnerungen | – | – | – | ✓ | ✓ |
| Ehrungshistorie | – | – | – | ✓ | ✓ |
| **PREMIUM: SATZUNGSVERWALTUNG** | | | | | |
| Satzungs-Parameter aktiv | – | – | – | – | ✓ |
| Satzungs-Versionierung | – | – | – | – | ✓ |
| Aenderungs-Workflow (Registergericht) | – | – | – | – | ✓ |
| Einberufungsfristen aus Satzung | – | – | – | – | ✓ |
| Kuendigungsfristen aus Satzung | – | – | – | – | ✓ |
| Amtszeiten aus Satzung | – | – | – | – | ✓ |
| Beitragsfaelligkeit aus Satzung | – | – | – | – | ✓ |
| Konflikterkennung | – | – | – | – | ✓ |
| Checkliste Finanzamt / IHK | – | – | – | – | ✓ |

---

## 4. Lizenz- & Preismodell

Alle Preise gelten pro Jahr inklusive Updates und Bugfixes. Support ist in allen bezahlten Stufen enthalten. Upgrades sind jederzeit moeglich, Downgrades zum naechsten Verlaengerungsdatum.

### 4.1 Jahrespreise je Stufe

| Mitgliederzahl | Stufe 1 Papier | Stufe 2 Komm. | Stufe 3 Einzug | Stufe 4 Komplett | Stufe 5 Premium |
|----------------|:-:|:-:|:-:|:-:|:-:|
| bis 100 Mitglieder | 29 EUR/J. | 39 EUR/J. | 59 EUR/J. | 79 EUR/J. | 109 EUR/J. |
| bis 300 Mitglieder | 49 EUR/J. | 59 EUR/J. | 89 EUR/J. | 119 EUR/J. | 159 EUR/J. |
| unbegrenzt | 69 EUR/J. | 89 EUR/J. | 129 EUR/J. | 169 EUR/J. | 219 EUR/J. |

### 4.2 Upgrade-Pfad

| Upgrade | Was passiert mit den Daten | Was wird freigeschaltet |
|---------|---------------------------|------------------------|
| Stufe 1 → 2 | Keine Migration noetig | Plugin wird freigeschaltet, Einwilligungen sofort genutzt |
| Stufe 2 → 3 | Keine Migration noetig | SEPA-Felder erscheinen, IBANs nach und nach ergaenzen |
| Stufe 3 → 4 | Keine Migration noetig | Zweite Sparte anlegen, Mitglieder zuordnen |
| Stufe 4 → 5 | Keine Migration noetig | Satzung hinterlegen, Parameter aktivieren — sofort aktiv |

### 4.3 Probe-Lizenz

- Kostenlose Probe-Lizenz: Stufe 1 mit bis zu 30 Mitgliedern — zeitlich unbegrenzt
- Keine Kreditkarte noetig, kein Ablaufdatum
- Wasserzeichen auf PDF-Ausdrucken: "Erstellt mit Probe-Version — codefabrik.de"
- Upgrade auf Vollversion jederzeit: Daten bleiben vollstaendig erhalten

### 4.4 Positionierung

Wer seine Mitgliederdaten einmal eingepflegt hat wechselt nicht mehr — das ist der staerkste Retentions-Faktor dieser Software-Kategorie. Der niedrige Einstiegspreis (29 EUR/Jahr) senkt die Huerde fuer den ersten Kauf. Der natuerliche Wachstumspfad (Kommunikation → Einzug → Komplett → Premium) erzeugt wiederkehrenden Umsatz ohne aggressives Upselling.

---

## 5. Datenmodell

Das Datenmodell ist von Anfang an multi-sparten-faehig ausgelegt — auch wenn Stufe 1 nur eine Sparte nutzt. Eine spaetere Erweiterung erfordert keine Datenmigration.

### 5.1 Mandanten-Prinzip

Jede Installation verwaltet genau einen Verein (Mandant). Eine Instanz = ein Verein. Fuer Dachverbaende mit mehreren Untervereinen sind separate Installationen vorgesehen — Multi-Mandanten ist nicht Teil dieser Produktlinie.

### 5.2 Entitaeten

| Entitaet | Wichtige Felder | Hinweis |
|----------|----------------|---------|
| Verein (Mandant) | Name, Sitz, VR-Nr., Glaeubiger-ID, Logo, Freistellungsbescheid | Einmalig hinterlegen, ueberall verwendet |
| Sparten | Name, Beitragssaetze pro Klasse, Status | 1..n pro Verein — Multi-Sparten ab Stufe 4 |
| Mitglied | Name, Adresse, Geburtsdatum, Eintritt, Status, Mitgliedsnummer | Zentrale Entitaet, verknuepft mit allen anderen |
| Mitgliedschaft | Mitglied-ID, Sparten-ID, Beitragsklasse, Beginn, Ende | n:m Verknuepfung Mitglied ↔ Sparte |
| Einwilligungen | Typ, Erteilt-Datum, Widerrufen-Datum, Kanal | Pro Mitglied mehrere, je Typ separat |
| SEPA-Mandat | IBAN, BIC, Mandatsreferenz, Mandatsdatum, Typ, Status | Ab Stufe 3, Erst-/Folgelastschrift |
| Zahlung | Betrag, Datum, Typ (Bar/SEPA/Ueberweisung), Status, Kassierer | Beitragsueberwachung |
| Spendenquittung | Quittungsnummer, Betrag, Datum, Sachspende J/N, Zweck | Fortlaufend nummeriert |
| Versammlung | Datum, Ort, Art, Anwesende, Beschluesse, Quorum-Ergebnis | Verknuepft mit Mitgliederliste |
| Satzungs-Version | Version, Datum, Paragraphen, Status, PDF, Parameter-JSON | Ab Stufe 5 aktiv genutzt |
| Funktionstraeger | Mitglied-ID, Funktion, Amtsbeginn, Amtsende, Vollmacht | Ab Stufe 4 |

---

## 6. DSGVO-Einordnung

Die Software ist als lokal-first Anwendung konzipiert. Alle Daten verbleiben auf dem Rechner des Vereins. Kein Cloud-Sync, kein Tracking, keine Telemetrie.

### 6.1 Pflichten des Vereins

- Verzeichnis der Verarbeitungstaetigkeiten (Art. 30 DSGVO) — Vorlage in der Software enthalten
- Technisch-organisatorische Massnahmen (Art. 32 DSGVO) — Checkliste in der Software
- Datenschutzerklaerung fuer Mitglieder — Vorlage in der Software enthalten
- Loeschkonzept umsetzen — Software zeigt faellige Loeschungen an
- Einwilligungen dokumentieren — vollstaendig in der Software abgebildet

### 6.2 Aufbewahrungsfristen

| Datenart | Rechtsgrundlage | Aufbewahrung | Besonderheit |
|----------|----------------|-------------|-------------|
| Stammdaten (Name, Adresse) | Art. 6 I lit. b DSGVO | Dauer Mitgliedschaft + 3 Jahre | Loeschkonzept erforderlich |
| SEPA-Mandate | Art. 6 I lit. b DSGVO | 3 Jahre nach Widerruf | Original-Unterschrift aufbewahren |
| Kommunikation (E-Mail, Tel.) | Einwilligung Art. 6 I lit. a | Bis Widerruf | Widerruf jederzeit moeglich |
| Fotos (intern) | Einwilligung Art. 6 I lit. a | Bis Widerruf | Separat von oeffentl. Einwilligung |
| Fotos (oeffentlich) | Einwilligung Art. 6 I lit. a | Bis Widerruf | Eigenstaendige Einwilligung noetig |
| Spendenquittungen | Art. 6 I lit. c DSGVO | 10 Jahre (Steuerrecht) | Freistellungsbescheid Voraussetzung |
| Zahlungsdaten | Art. 6 I lit. b DSGVO | 10 Jahre (HGB) | Buchungsbelege |
| Gesundheitsdaten | NICHT GESPEICHERT | - | Keine Gesundheitsdaten in dieser Software |

### 6.3 DSGVO-Funktionen im Tool

Die folgenden Funktionen muessen im Tool implementiert sein, um die Betroffenenrechte
der DSGVO abzubilden. **Auskunft und Loeschung sind Pflicht vor dem ersten Kunden.**

#### 6.3.1 Datenauskunft (Art. 15 DSGVO)

Jedes Vereinsmitglied hat das Recht zu erfahren, welche Daten ueber es gespeichert sind.

**Funktion:** Mitglied-Detailansicht → Button "Datenauskunft (DSGVO)"

Erzeugt einen Bericht (PDF oder Bildschirm) mit:

1. **Stammdaten** — Alle gespeicherten Felder (Name, Adresse, Kontakt, Geburtsdatum etc.)
2. **Aenderungsprotokoll** — Alle Events die dieses Mitglied betreffen
   (wer hat wann was geaendert)
3. **Beitraege** — Beitragsverlauf mit Zahlungsstatus
4. **Einwilligungen** — Erteilte und widerrufene Einwilligungen mit Datum
5. **SEPA-Mandate** — Falls vorhanden (ab Stufe 3)
6. **Verarbeitungszweck** — Standardtext: "Mitgliederverwaltung gemaess
   Vereinssatzung, Beitragsverwaltung, Kommunikation"
7. **Speicherdauer** — "Bis Austritt + gesetzliche Aufbewahrungsfrist (3-10 Jahre)
   oder auf Verlangen des Mitglieds"
8. **Empfaenger** — "Keine Weitergabe an Dritte" (oder Liste falls konfiguriert)

**Export-Formate:**
- **PDF** — fuer Aushaendigung an das Mitglied (bevorzugt)
- **JSON** — maschinenlesbar (Art. 20 DSGVO, Datenportabilitaet)

#### 6.3.2 Recht auf Loeschung (Art. 17 DSGVO)

Mitglied verlangt Loeschung aller personenbezogenen Daten.

**Funktion:** Mitglied-Detailansicht → "Mitglied loeschen (DSGVO)"

Ablauf:
1. **Pruefung Aufbewahrungspflichten** — Tool prüft ob steuerrechtliche Fristen
   (6-10 Jahre fuer Beitrags-/Zahlungsdaten) noch laufen
2. **Personenbezogene Daten loeschen** — Name, Adresse, Kontaktdaten, Geburtsdatum
3. **Finanzdaten anonymisieren** — Name → "Geloeschtes Mitglied #42",
   Beitrags- und Zahlungsdaten bleiben fuer Steuerrecht erhalten
4. **Event-Log redacten** — Personenbezogene Felder in Events ersetzen durch
   "[GELOESCHT]". Redaction wird als eigenes Event protokolliert.
   Original-Hash-Kette bleibt verifizierbar (Redaction-Event referenziert
   Original-Hash, ersetzt ihn nicht)
5. **Einwilligungen loeschen** — Alle Einwilligungsdaten entfernen
6. **SEPA-Mandate loeschen** — IBAN und Mandatsdaten entfernen

**Sicherheitsabfrage:** "Achtung: Diese Aktion kann nicht rueckgaengig gemacht werden.
Personenbezogene Daten werden unwiderruflich geloescht. Finanzdaten werden anonymisiert
und bleiben fuer die steuerrechtliche Aufbewahrungsfrist erhalten."

#### 6.3.3 Datenportabilitaet (Art. 20 DSGVO)

JSON-Export aller Daten eines Mitglieds. Ermoeglicht Umzug zu anderem Vereinstool.
Abgedeckt durch den JSON-Export der Auskunftsfunktion (6.3.1).

#### 6.3.4 Recht auf Berichtigung (Art. 16 DSGVO)

Abgedeckt durch die normale Bearbeitungsfunktion. Event-Log dokumentiert
die Korrektur automatisch.

#### 6.3.5 Faellige Loeschungen anzeigen

**Funktion:** Dashboard-Widget "DSGVO: Faellige Loeschungen"

Zeigt Mitglieder an, deren Aufbewahrungsfrist abgelaufen ist:
- Ausgetreten + 3 Jahre (Stammdaten)
- Letzter Zahlungsvorgang + 10 Jahre (Finanzdaten)

Der Verein wird erinnert, die Loeschung durchzufuehren — die Software
loescht nicht automatisch.

### 6.4 Disclaimer

Diese Software ist ein organisatorisches Hilfsmittel. Sie ersetzt keine Rechts- oder Datenschutzberatung. Der Verein ist fuer die ordnungsgemaesse Umsetzung der DSGVO-Pflichten selbst verantwortlich. Bei Unsicherheiten empfehlen wir die Beratung durch einen Datenschutzbeauftragten oder Rechtsanwalt.

---

## 7. Release-Planung & MVP-Definition

### 7.1 Sprint-Planung

| Sprint | Stufe | Aufwand | Inhalt |
|--------|-------|---------|--------|
| Sprint 1 | Stufe 1 | 3 Wochen | Stammdaten, Listen, Beitragsueberwachung manuell, Spendenquittung, Teilnahmeliste |
| Sprint 2 | Stufe 2 | 1 Woche | CSV/VCF-Export, Einwilligungs-Filter, Etiketten, Serienbrief-Liste |
| Sprint 3 | Stufe 3 | 2 Wochen | SEPA-Mandatsverwaltung, XML-Export pain.008, Ruecklast-Workflow |
| Sprint 4 | Stufe 4 | 2 Wochen | Multi-Sparten, Statistik-Modul, Funktionstraeger, Beschluss-Protokoll |
| Sprint 5 | Stufe 5 | 3 Wochen | Satzungsverwaltung, Versionierung, Konflikterkennung, aktive Steuerungslogik |

### 7.2 MVP-Kriterien Stufe 1

Folgende Punkte muessen vor dem ersten Verkauf erfuellt sein:

- Mitgliederstammdaten vollstaendig erfassbar
- Alle Pflicht-Listen als druckfertige PDFs generierbar
- Spendenquittung (Einzel + Sammel) nach amtlichem Muster
- Teilnahmeliste Hauptversammlung mit Quorum-Anzeige
- DSGVO-Einwilligungen erfassbar und beim Druck gefiltert
- Probe-Lizenz (bis 30 Mitglieder) und Vollversion (Lizenzpruefung) funktionsfaehig
- Portal-Integration: Kauf → Key → Download durchgetestet
- Impressum, Datenschutzerklaerung, Disclaimer in Software sichtbar
- DSGVO-Datenauskunft (Art. 15): PDF-Export aller Daten eines Mitglieds
- DSGVO-Loeschung (Art. 17): Mitglied loeschen mit Anonymisierung der Finanzdaten
- DSGVO-Faellige Loeschungen: Dashboard-Widget zeigt abgelaufene Aufbewahrungsfristen

### 7.3 Nicht im MVP (spaetere Versionen)

- Statistik-Grafiken (Stufe 4 — Sprint 4)
- Satzungsverwaltung aktiv (Stufe 5 — Sprint 5)
- MT940-Import (Kontoauszug-Datei — v2.0)
- Mitglieder-Self-Service-Portal (v2.0)
- Mobile App (v3.0)

### 7.4 Technische Voraussetzungen

- Windows 10/11 oder macOS 12+
- Lokale SQLite-Datenbank (kein Server noetig)
- PDF-Generierung lokal (keine Cloud-Abhaengigkeit)
- SEPA-XML-Export: pain.008.003.02 (Bankstandard Deutschland/SEPA-Raum)
- Lizenzpruefung: Online beim Start (einmalig, Offline-Modus nach 30 Tagen moeglich)

---

## 8. Offene Punkte & Entscheidungen

### 8.1 Zu entscheiden

- Plattform: Electron (cross-platform) oder .NET/WPF (Windows-only)? — Betrifft Entwicklungsaufwand und macOS-Support
- Probe-Lizenz: 30 Mitglieder oder zeitlich befristet (60 Tage)? — Empfehlung: Mitglieder-Limit ist benutzerfreundlicher
- Einzelkauf einzelner Stufen-Upgrades oder nur Jahres-Abo? — Empfehlung: Jahres-Abo (Updates bei SEPA-Formaten wichtig)
- Erstes Pilotprodukt: Foerderverein aus bekanntem Umfeld als Beta-Tester?

### 8.2 Bewusste Nicht-Entscheidungen (vorerst)

- Multi-Mandanten (Dachverband): Nicht in dieser Produktlinie
- Online-Banking-Anbindung (PSD2): Regulatorisch komplex, kein MVP-Thema
- Vereins-App fuer Mitglieder: Erst nach Marktvalidierung der Desktop-Version
- DATEV-Schnittstelle: Auf Nachfrage evaluieren
