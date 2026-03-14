# Ergebnis: Selbstverbessernder Prozessaufbau fuer Kleinunternehmen in der Finanzbranche

**Erstellt:** 2026-03-10
**Grundlage:** Recherche-Prompt `prompt-prozessaufbau-finanzbranche-dsgvo.md`
**Methode:** Webrecherche zu allen 24 Aufgaben, deutsche Rechtsquellen, aktuelle Daten 2025/2026

---

## Kategorie A: Datenschutz-Grundlagen (DSGVO Art. 9)

### 1. Verzeichnis von Verarbeitungstaetigkeiten (VVT)

**Ist-Zustand:** Die meisten Kleinunternehmen in der Finanzbranche haben kein oder ein unvollstaendiges VVT. Viele kennen die Pflicht nicht oder halten sie fuer eine "Grossunternehmen-Sache".

**Gesetzliche Pflicht:** **MUSS** — Art. 30 DSGVO. Keine Ausnahme fuer Kleinunternehmen bei Verarbeitung von Gesundheitsdaten (Art. 9). Die oft zitierte Ausnahme fuer Unternehmen unter 250 Mitarbeitern greift NICHT, wenn besondere Datenkategorien verarbeitet werden.

**Tool-/Vorlagen-Empfehlung:**
- **Stiftung Datenschutz** (ds-kleinunternehmen.de): Kostenlose Excel-Vorlage, 12-Schritte-Programm, speziell fuer Kleinunternehmen. **Empfehlung Nr. 1.**
- **BfDI Musterformulare** (bfdi.bund.de): Offizielle DSK-Muster, kostenlos, PDF/Word
- **activeMind AG**: Kostenlose Vorlage zum Download
- **DSGVO-Vorlagen.de**: Excel-VVT mit Praxisbeispielen
- Alle lokal, alle kostenlos.

**Aufwand Ersteinrichtung:** 8-16 Stunden (je nach Anzahl Verarbeitungstaetigkeiten, typisch 8-15 Taetigkeiten bei einem Finanzberater)

**Laufender Aufwand:** 15-30 Min/Woche (bei Aenderungen, sonst weniger; Quartals-Review ca. 2 Std)

**Risiko bei Nicht-Umsetzung:** Bussgeld bis 10 Mio. EUR oder 2% des Jahresumsatzes (Art. 83 Abs. 4 DSGVO). Realistisch bei Kleinunternehmen: 5.000-50.000 EUR. Bei Pruefung durch Aufsichtsbehoerde ist fehlendes VVT der erste Befund.

**Passt zu Stufe 1:** **Ja** — Absolut erste Prioritaet.

---

### 2. Technisch-Organisatorische Massnahmen (TOM)

**Ist-Zustand:** Meistens vorhanden in Bruchstuecken (Passwort am Rechner, vielleicht Virenschutz), aber nicht dokumentiert und nicht systematisch. Keine Risikoabwaegung dokumentiert.

**Gesetzliche Pflicht:** **MUSS** — Art. 32 DSGVO. Bei Gesundheitsdaten (Art. 9) sind ERHOEHTE Schutzstandards erforderlich. Die DSGVO schreibt kein fixes Katalog vor, aber die Massnahmen muessen dem Risiko angemessen sein.

**Tool-/Vorlagen-Empfehlung:**
- **Stiftung Datenschutz**: TOM-Checkliste in der Grundausstattung (kostenlos)
- **DSGVO-Vorlagen.de**: TOM-Dokumentationsvorlage (kostenlos)
- **Bitkom Reifegradmodell**: Fuer Selbstbewertung (kostenlos, PDF)

**Minimum-TOMs fuer 2-3 Personen mit Gesundheitsdaten:**

| Bereich | Massnahme | Aufwand |
|---------|-----------|---------|
| Zutrittskontrolle | Buero abschliessbar, Akten im Schrank | Gering |
| Zugangskontrolle | Passwort-Manager (KeePass), Bildschirmsperre | 2 Std Setup |
| Zugriffskontrolle | Getrennte Benutzerkonten, Need-to-Know | 2 Std Setup |
| Verschluesselung | Festplattenverschluesselung (BitLocker/LUKS) | 1 Std Setup |
| Integritaet | Backup mit Pruefung | 4 Std Setup |
| Vertraulichkeit | Verschluesselte Kommunikation | 2 Std Setup |
| Verfuegbarkeit | Backup + getestete Wiederherstellung | 4 Std Setup |
| Belastbarkeit | Virenschutz, Updates | 1 Std Setup |

**Aufwand Ersteinrichtung:** 12-20 Stunden (Dokumentation + Umsetzung)

**Laufender Aufwand:** 30 Min/Woche (Updates, Pruefung, Dokumentation)

**Risiko bei Nicht-Umsetzung:** Bussgeld bis 10 Mio. EUR. Bei Datenverlust von Gesundheitsdaten: zusaetzlich Schadensersatzansprueche betroffener Kunden. Reputationsschaden massiv.

**Passt zu Stufe 1:** **Ja** — Hoechste Prioritaet zusammen mit VVT.

---

### 3. Datenschutz-Folgenabschaetzung (DSFA)

**Ist-Zustand:** Fast kein Kleinunternehmen fuehrt eine DSFA durch. Die meisten wissen nicht einmal, was das ist.

**Gesetzliche Pflicht:** **KOMMT DRAUF AN** — Art. 35 DSGVO:
- DSFA ist Pflicht wenn "voraussichtlich ein hohes Risiko" besteht
- Art. 35 Abs. 3 nennt als Pflichtfall: "umfangreiche Verarbeitung besonderer Kategorien" (Art. 9)
- **Entscheidend:** Ist die Verarbeitung von Gesundheitsdaten bei 2-3 Personen "umfangreich"?
- **Tendenz:** Bei einem kleinen Finanzberater mit 200-500 Kunden: eher NEIN. Die DSK-Blacklists listen vor allem systematische, automatisierte Massenverarbeitungen.
- **ABER:** Wenn 2 der 9 WP-248-Kriterien zutreffen (z.B. "sensible Daten" + "Daten von vulnerablen Personen"), kann DSFA trotzdem Pflicht sein.

**Tool-/Vorlagen-Empfehlung:**
- **PIA (Privacy Impact Assessment)**: Open-Source-Tool der CNIL (franzoesische Behoerde), kostenlos, lokal installierbar
- **DSK Kurzpapier Nr. 5**: Kostenlose Anleitung (PDF)

**Aufwand Ersteinrichtung:** 8-16 Stunden (wenn Pflicht)

**Laufender Aufwand:** 30 Min/Monat (Pruefung ob sich etwas geaendert hat)

**Risiko bei Nicht-Umsetzung:** Bussgeld bis 10 Mio. EUR. Realistisch: Wenn ein Kleinunternehmen unsicher ist, sollte es zumindest eine SCHWELLWERTANALYSE durchfuehren (2-4 Stunden) die dokumentiert, WARUM keine DSFA noetig ist.

**Passt zu Stufe 1:** **Ja (Schwellwertanalyse)** — Die Schwellwertanalyse ist Pflicht. Die volle DSFA vermutlich nicht.

---

### 4. Externer Datenschutzbeauftragter (DSB)

**Ist-Zustand:** Die allermeisten Kleinunternehmen unter 20 Personen haben keinen DSB. Viele glauben, sie braeuchten keinen.

**Gesetzliche Pflicht:** **KOMMT DRAUF AN — ABER WAHRSCHEINLICH MUSS:**
- Grundregel: DSB-Pflicht ab 20 Personen die staendig mit automatisierter Verarbeitung beschaeftigt sind (§ 38 BDSG)
- **ABER:** Unabhaengig von der Mitarbeiterzahl ist ein DSB Pflicht, wenn die Kerntaetigkeit in der "umfangreichen Verarbeitung besonderer Kategorien" (Art. 9) liegt (Art. 37 Abs. 1 lit. c DSGVO)
- **Frage:** Ist die Verarbeitung von Gesundheitsdaten die "Kerntaetigkeit" eines Finanzberaters?
- **Tendenz bei Versicherungsvermittlern:** Gesundheitsdaten werden fuer Risikoprfuefung verarbeitet → das IST Teil der Kerntaetigkeit → DSB wahrscheinlich Pflicht
- **Geplante Aenderung 2025:** Schwelle sollte von 20 auf 50 Mitarbeiter angehoben werden — betrifft aber NICHT die Art.-37-Pflicht bei sensiblen Daten

**Tool-/Vorlagen-Empfehlung:**
- **Externer DSB**: 100-300 EUR/Monat fuer Kleinunternehmen (Pauschal)
- **BvD (Berufsverband der Datenschutzbeauftragten)**: Vermittlung externer DSB
- Stundensatz bei Bedarf: ca. 150-180 EUR/Stunde

**Aufwand Ersteinrichtung:** 4-8 Stunden (DSB auswaehlen, beauftragen, informieren)

**Laufender Aufwand:** 0 Min/Woche (der DSB macht seine Arbeit; Zuarbeit ca. 2 Std/Quartal)

**Risiko bei Nicht-Umsetzung:** Bussgeld bis 10 Mio. EUR. In der Praxis: Aufsichtsbehoerden fragen bei Beschwerden als erstes nach dem DSB. Fehlt er trotz Pflicht, ist das ein sofortiger Verstoss.

**Passt zu Stufe 1:** **Ja** — Abklaerung der Pflicht und ggf. Bestellung sofort. **BRUTAL EHRLICH:** Fuer ein 2-3-Personen-Team mit Gesundheitsdaten ist ein externer DSB die beste Investition. Er bringt Fachwissen mit, das intern nicht vorhanden ist, und kostet weniger als EIN Bussgeld.

---

## Kategorie B: Tool-Auswahl Stufe 1

### 5. Kundenverwaltung / CRM (lokal, DSGVO-konform)

**Ist-Zustand:** Excel-Listen, Outlook-Kontakte, Papierakten, oder branchenspezifische Cloud-CRM (die fuer Gesundheitsdaten problematisch sind).

**Gesetzliche Pflicht:** **SOLL** — Kein CRM ist Pflicht, aber die DSGVO-Anforderungen (Loeschkonzept, Auskunftsrecht, Zugriffskontrolle) sind de facto nur mit einem strukturierten System erfuellbar.

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | Lokal/Cloud | Besonderheiten |
|------|-------|-------------|----------------|
| **SuccessControl CRM** | ab 290 EUR einmalig | Lokal (Windows) | DSGVO-konform, kein Abo, Rechnungsstellung |
| **AG-VIP** (Grutzeck) | ab 399 EUR einmalig | Lokal (Windows) | Explizite DSGVO-Funktionen, Finanzbranche |
| **Monica CRM** | Kostenlos (self-hosted) | Lokal/Self-hosted | Open Source, Beziehungsmanagement |
| **SuiteCRM** | Kostenlos (self-hosted) | Self-hosted | Open Source, voller Funktionsumfang |

**Realistische Empfehlung Stufe 1:** SuccessControl CRM oder AG-VIP. Self-hosted Open-Source-Loesungen wie SuiteCRM erfordern IT-Know-how, das bei 2-3 Personen ohne IT nicht vorhanden ist. **BRUTAL EHRLICH:** In Stufe 1 ist eine gut strukturierte Excel/LibreOffice-Loesung mit Passwortschutz akzeptabel, wenn ein Upgrade auf ein echtes CRM fuer Stufe 2 geplant ist.

**Aufwand Ersteinrichtung:** 8-24 Stunden (je nach Tool)

**Laufender Aufwand:** In den Arbeitsalltag integriert (kein zusaetzlicher Aufwand wenn das Tool genutzt wird)

**Risiko bei Nicht-Umsetzung:** Kein direktes Bussgeld, aber Unmoeglichkeit, Auskunfts- und Loeschpflichten zu erfuellen → indirektes Bussgeldrisiko.

**Passt zu Stufe 1:** **Ja** (strukturierte Loesung, muss nicht perfekt sein)

---

### 6. Dokumentenmanagement (DMS)

**Ist-Zustand:** Ordner auf der Festplatte, vielleicht ein Netzlaufwerk, keine Versionierung, kein Zugriffsprotokoll. Papierakten im Schrank.

**Gesetzliche Pflicht:** **SOLL** — Kein DMS ist Pflicht, aber Versionierung, Zugriffskontrolle und Nachweisbarkeit sind DSGVO-Anforderungen.

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | Lokal/Cloud | Besonderheiten |
|------|-------|-------------|----------------|
| **bitfarm-Archiv DMS** | Kostenlos (GPL-Version) | Lokal | Open Source, DSGVO-konform, revisionssicher |
| **ecoDMS** | ab 89 EUR einmalig | Lokal | Guenstig, einfach, verschluesselt |
| **Docspell** | Kostenlos (self-hosted) | Self-hosted | Open Source, OCR, Tagging |
| **Ordnerstruktur + VeraCrypt** | Kostenlos | Lokal | Minimalloesung, kein echtes DMS |

**Realistische Empfehlung Stufe 1:** **ecoDMS** (89 EUR, einfach zu bedienen, lokal) oder als Minimalloesung: Strukturierte Ordner auf verschluesselter Festplatte mit dokumentierter Namenskonvention. **BRUTAL EHRLICH:** Ein volles DMS ist fuer 2-3 Personen oft Overkill in Stufe 1. Eine saubere Ordnerstruktur mit Zugriffsrechten reicht, wenn sie DOKUMENTIERT ist.

**Aufwand Ersteinrichtung:** 4-8 Stunden (Ordnerstruktur) bzw. 16-24 Stunden (DMS-Software)

**Laufender Aufwand:** 15 Min/Woche (Ablage konsequent nutzen)

**Risiko bei Nicht-Umsetzung:** Kein direktes Bussgeld, aber bei Audit fehlende Nachweisbarkeit. Datenverlust bei unstrukturierter Ablage.

**Passt zu Stufe 1:** **Ja** (Ordnerstruktur + Verschluesselung als Minimum)

---

### 7. Verschluesselte Kommunikation

**Ist-Zustand:** Kunden schicken Gesundheitsdaten per unverschluesselter E-Mail. Finanzberater antwortet per E-Mail mit Anhang. Massiver DSGVO-Verstoss, der taeglich passiert.

**Gesetzliche Pflicht:** **MUSS** — Art. 32 DSGVO fordert "angemessene" Sicherheit. Die DSK-Orientierungshilfe zur E-Mail-Verschluesselung stellt klar: Unverschluesselte E-Mail genuegt bei sensiblen Daten NICHT dem Stand der Technik. Bei Gesundheitsdaten ist Ende-zu-Ende-Verschluesselung oder ein sicherer Austauschkanal Pflicht.

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | Art | Kundenfreundlichkeit |
|------|-------|-----|---------------------|
| **Threema Work** | 3 EUR/Monat/Nutzer | Messenger (E2E) | Hoch (Kunden kennen Messenger) |
| **Signal** | Kostenlos | Messenger (E2E) | Hoch |
| **7-Zip + E-Mail** | Kostenlos | Verschluesselter Anhang | Mittel (Passwort separat uebermitteln) |
| **Cryptshare** | ab 1.500 EUR/Jahr | E-Mail-Verschluesselung | Hoch (Browser-basiert) |
| **S/MIME Zertifikat** | ab 30 EUR/Jahr | E-Mail-Verschluesselung | Niedrig (Kunde braucht auch Zertifikat) |
| **Nextcloud + Freigabelink** | Kostenlos (self-hosted) | Dateifreigabe | Mittel |

**Realistische Empfehlung Stufe 1:** **Threema Work** (3 EUR/Monat/Person) fuer laufende Kommunikation + **verschluesselte ZIP-Dateien (7-Zip, AES-256)** per E-Mail fuer Dokumente mit telefonischer Passwortuebermittlung. **BRUTAL EHRLICH:** S/MIME und PGP scheitern an der Kundenakzeptanz. Kein Kunde installiert sich ein E-Mail-Zertifikat. Threema oder Signal sind realistisch. Fuer groessere Dateien: verschluesselte ZIP + Passwort per Telefon.

**Aufwand Ersteinrichtung:** 2-4 Stunden

**Laufender Aufwand:** 5 Min pro Kommunikationsvorgang (Verschluesselung wird Routine)

**Risiko bei Nicht-Umsetzung:** Bussgeld bei Datenpanne. Gesundheitsdaten per Klartext-E-Mail = Verstoss gegen Art. 32. Realistisch: 5.000-25.000 EUR Bussgeld + Schadensersatz.

**Passt zu Stufe 1:** **Ja** — Sofort umsetzen, einer der wichtigsten Quick Wins.

---

### 8. Aufgaben- und Projektmanagement (lokal)

**Ist-Zustand:** Zettelwirtschaft, Outlook-Kalender, bestenfalls eine gemeinsame To-Do-Liste.

**Gesetzliche Pflicht:** **KANN** — Keine gesetzliche Pflicht, aber essentiell fuer den Inspect-&-Adapt-Prozess.

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | Lokal/Cloud | Besonderheiten |
|------|-------|-------------|----------------|
| **Kanri** | Kostenlos | Lokal (Desktop) | Offline-Kanban, Tauri-App, einfach |
| **Kanboard** | Kostenlos | Self-hosted | Minimalistisch, PHP |
| **Papier-Kanban** | ~20 EUR (Board+Karten) | Physisch | Null IT-Aufwand, sofort nutzbar |
| **Vikunja** | Kostenlos | Self-hosted | Feature-reich, Listen+Kanban |

**Realistische Empfehlung Stufe 1:** **Papier-Kanban-Board** an der Wand (Whiteboard + Post-Its) oder **Kanri** (Desktop-App). **BRUTAL EHRLICH:** Fuer 2-3 Personen im selben Buero ist ein physisches Kanban-Board am Whiteboard die BESTE Loesung. Kein Login, keine Technik, sofort sichtbar. Digital erst ab Stufe 2 wenn Remote-Arbeit noetig wird.

**Aufwand Ersteinrichtung:** 1-2 Stunden

**Laufender Aufwand:** 10 Min/Tag (Board aktualisieren)

**Risiko bei Nicht-Umsetzung:** Kein Bussgeld. Aber ohne Aufgabenmanagement scheitert der gesamte Verbesserungsprozess.

**Passt zu Stufe 1:** **Ja**

---

### 9. Backup und Disaster Recovery

**Ist-Zustand:** Bestenfalls eine externe Festplatte die "ab und zu" angeschlossen wird. Kein Test der Wiederherstellung. Keine Verschluesselung des Backups. Kein Offsite-Backup.

**Gesetzliche Pflicht:** **MUSS** — Art. 32 Abs. 1 lit. c DSGVO: "die Faehigkeit, die Verfuegbarkeit und den Zugang zu personenbezogenen Daten bei einem physischen oder technischen Zwischenfall rasch wiederherzustellen". Backup ist Pflicht bei Gesundheitsdaten.

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | OS | Besonderheiten |
|------|-------|----|----------------|
| **Duplicati** | Kostenlos | Win/Mac/Linux | GUI, AES-256, Zeitplan, Open Source |
| **BorgBackup** | Kostenlos | Linux/Mac | Deduplizierung, Verschluesselung, CLI |
| **VeraCrypt** | Kostenlos | Win/Mac/Linux | Fuer verschluesselte Backup-Medien |
| **Externe SSD** | ab 60 EUR | — | Backup-Medium |
| **Zweite ext. SSD** (Offsite) | ab 60 EUR | — | Offsite-Kopie (zu Hause/Bankschliessfach) |

**3-2-1 Regel fuer ein kleines Buero:**
1. **3 Kopien:** Original + 2 Backups
2. **2 verschiedene Medien:** Interne SSD + externe SSD
3. **1 Offsite:** Eine externe SSD woechentlich mit nach Hause nehmen oder ins Bankschliessfach

**Realistische Empfehlung Stufe 1:** **Duplicati** (kostenlos, GUI, auch fuer Nicht-IT) auf **2 externe SSDs** (je 60-100 EUR). Eine SSD im Buero, eine rotierend Offsite. Verschluesselung mit AES-256 in Duplicati eingebaut. **Monatlicher Wiederherstellungstest!**

**Aufwand Ersteinrichtung:** 4-8 Stunden (Software + Zeitplan + erster Test)

**Laufender Aufwand:** 15 Min/Woche (Backup pruefen, Offsite-Medium tauschen)

**Risiko bei Nicht-Umsetzung:** Totalverlust aller Kundendaten. Bussgeld wegen fehlender Verfuegbarkeit. Existenzbedrohend fuer das Unternehmen.

**Passt zu Stufe 1:** **Ja** — Hoechste Prioritaet.

---

### 10. Analyse-Software fuer Kundendaten

**Ist-Zustand:** Excel mit Makros, Taschenrechner, Papier. Keine systematische Auswertung.

**Gesetzliche Pflicht:** **KANN** — Analyse ist keine Pflicht, aber die Art der Analyse unterliegt der DSGVO (Zweckbindung, Datenminimierung).

**Tool-/Vorlagen-Empfehlung:**

| Tool | Preis | Risiko | Eignung Stufe 1 |
|------|-------|--------|-----------------|
| **LibreOffice Calc** | Kostenlos | Mittel (Makros koennen Daten lecken) | Ja, mit Vorsicht |
| **Python + Jupyter** | Kostenlos | Niedrig (lokal, kontrollierbar) | Nur mit IT-Kenntnissen |
| **R Studio** | Kostenlos | Niedrig (lokal) | Nur mit Statistik-Kenntnissen |

**Realistische Empfehlung Stufe 1:** **LibreOffice Calc** ohne Makros, nur Formeln. Daten auf verschluesselter Festplatte. Ergebnisse anonymisiert (Kennzahlen, keine Einzeldaten). **BRUTAL EHRLICH:** Fuer ein 2-3-Personen-Team ohne IT ist Python/R unrealistisch. LibreOffice Calc mit sauberen Pivot-Tabellen reicht fuer Stufe 1 voellig. Makros vermeiden — sie sind ein Sicherheitsrisiko und schwer zu kontrollieren.

**Aufwand Ersteinrichtung:** 2-4 Stunden (Vorlagen erstellen)

**Laufender Aufwand:** Im Arbeitsalltag integriert

**Risiko bei Nicht-Umsetzung:** Gering (keine Pflicht). Aber ohne Analyse fehlt die Grundlage fuer datengestuetzte Verbesserung.

**Passt zu Stufe 1:** **Ja** (LibreOffice Calc, keine Makros)

---

## Kategorie C: Prozessaufbau (Inspect & Adapt)

### 11. Sprint-Rhythmus fuer Nicht-IT-Teams

**Ist-Zustand:** Kein definierter Arbeitsrhythmus. Tagesgeschaeft dominiert, keine strukturierte Reflexion.

**Gesetzliche Pflicht:** **KANN** — Keine Pflicht, aber Best Practice fuer kontinuierliche Verbesserung.

**Empfehlung:**
- **Kanban statt Scrum** — Finanzberatung hat keinen "Sprint" im klassischen Sinne. Kundenfaelle kommen laufend rein, nicht in 2-Wochen-Paketen.
- **2-Wochen-Zyklus fuer Reviews** — Alle 2 Wochen 30 Minuten: Was ist offen? Was hat funktioniert? Was aendern wir?
- **WIP-Limit:** Maximal 3-5 aktive Kundenfaelle pro Person gleichzeitig

**BRUTAL EHRLICH:** Scrum ist fuer ein 2-3-Personen-Finanzberatungsteam Unsinn. Keine Sprints, keine Story Points, kein Product Owner. Kanban (= Aufgaben visualisieren + begrenzen + durchziehen) passt perfekt. 86% der Finanzunternehmen die agil arbeiten, nutzen Kanban.

**Aufwand Ersteinrichtung:** 2 Stunden (Board aufsetzen, Spalten definieren)

**Laufender Aufwand:** 10 Min/Tag (Board nutzen) + 30 Min/2 Wochen (Review)

**Risiko bei Nicht-Umsetzung:** Kein Bussgeld. Aber ohne Rhythmus keine Verbesserung.

**Passt zu Stufe 1:** **Ja**

---

### 12. Review-Stufen (Vier-Augen-Prinzip)

**Ist-Zustand:** Jeder arbeitet fuer sich. Kein systematisches Vier-Augen-Prinzip, ausser vielleicht bei Vertragsunterschriften.

**Gesetzliche Pflicht:** **SOLL** — IDD fordert Dokumentation der Beratung. GwG fordert Identifizierungspruefung. Vier-Augen bei sensiblen Vorgaengen ist Best Practice und wird von Aufsichtsbehoerden erwartet.

**Uebertragung der Code-Fabrik-Patterns:**

| Code-Fabrik | Finanzberatung | Vier-Augen? |
|-------------|----------------|-------------|
| Fast Lane | Terminvereinbarung, Standardbrief, Ablage | Nein |
| Slow Lane | Neukunden-Anlage, Vertragsaenderung, Gesundheitsdaten-Eingabe | **Ja** |
| Founder Gate | DSGVO-Dokumente, Zugriffsrechte, Loeschung | **Ja (nur Inhaber)** |
| Smoke-Test | Checkliste vor Vertragsabschluss | **Ja** |
| Deep-Smoke | Quartals-Stichprobe | **Ja** |

**BRUTAL EHRLICH:** Bei 2 Personen ist Vier-Augen-Prinzip = alles wird von der anderen Person gecheckt. Bei 3 Personen kann man es differenzieren. Der Aufwand ist real, aber bei Gesundheitsdaten unverzichtbar. **Mindestens:** Neukunden-Onboarding und Vertragsaenderungen immer mit zweiter Person.

**Aufwand Ersteinrichtung:** 2-4 Stunden (Festlegen welche Vorgaenge Vier-Augen brauchen)

**Laufender Aufwand:** 15-30 Min/Fall (bei Vier-Augen-Vorgaengen)

**Risiko bei Nicht-Umsetzung:** Fehler bei Vertraegen/Daten bleiben unentdeckt. Compliance-Risiko.

**Passt zu Stufe 1:** **Ja**

---

### 13. Retrospektive (Inspect & Adapt Zyklus)

**Ist-Zustand:** Keine systematische Reflexion. "Wird schon laufen." Fehler werden ad hoc besprochen, aber nicht systematisch erfasst.

**Gesetzliche Pflicht:** **KANN** — Keine direkte Pflicht, aber Art. 32 Abs. 1 lit. d DSGVO fordert "ein Verfahren zur regelmaessigen Ueberpruefung, Bewertung und Evaluierung der Wirksamkeit der technischen und organisatorischen Massnahmen".

**Empfehlung fuer 2-3 Personen ohne Moderator:**
- **Format:** "Start-Stop-Continue" (Was fangen wir an? Was hoeren wir auf? Was machen wir weiter?)
- **Frequenz:** Alle 2 Wochen, 20-30 Minuten
- **Regel:** Maximal 1-2 Verbesserungsmassnahmen pro Retro
- **Dokumentation:** Ergebnis auf dem Kanban-Board als "Verbesserung"-Karte

**Aufwand Ersteinrichtung:** 1 Stunde (Format festlegen, Termin blocken)

**Laufender Aufwand:** 30 Min/2 Wochen

**Risiko bei Nicht-Umsetzung:** Kein Bussgeld. Aber ohne Retro: kein Lernen, keine Verbesserung, gleiche Fehler wiederholt.

**Passt zu Stufe 1:** **Ja** — Kern des gesamten Konzepts.

---

### 14. Checklisten als "Tests" (Prozess-Qualitaetssicherung)

**Ist-Zustand:** Keine Checklisten. Prozesse sind "im Kopf" der Mitarbeiter. Neue Mitarbeiter lernen durch Zuschauen.

**Gesetzliche Pflicht:** **SOLL** — IDD fordert dokumentierte Beratungsprozesse. DSGVO fordert nachweisbare Prozesse. Checklisten sind der einfachste Weg, beides zu erfuellen.

**Pflicht-Checklisten fuer Finanzberater:**
1. **Beratungsdokumentation** (IDD-Pflicht)
2. **DSGVO-Einwilligung** (DSGVO-Pflicht bei Gesundheitsdaten)
3. **GwG-Identifizierung** (GwG-Pflicht bei Lebensversicherungen)
4. **Onboarding-Checkliste** (Best Practice)
5. **Tages-Checkliste** (Best Practice)
6. **Wochen-/Quartals-Audit** (Art. 32 DSGVO: regelmaessige Ueberpruefung)

**Aufwand Ersteinrichtung:** 4-8 Stunden (Checklisten erstellen)

**Laufender Aufwand:** 5 Min/Checkliste (wird Routine)

**Risiko bei Nicht-Umsetzung:** IDD-Verstoss bei fehlender Beratungsdokumentation (Gewerbeerlaubnis-Risiko!). DSGVO-Verstoss bei fehlender Einwilligung.

**Passt zu Stufe 1:** **Ja** — Checklisten sind das Herzstueck von Stufe 1.

---

## Kategorie D: Datensicherheit im Alltag

### 15. Endgeraete-Sicherheit

**Ist-Zustand:** Windows ohne Verschluesselung, gleiches Passwort ueberall, kein 2FA, veralteter Virenschutz.

**Gesetzliche Pflicht:** **MUSS** — Art. 32 DSGVO. Bei Gesundheitsdaten:
- Festplattenverschluesselung: faktisch Pflicht (Stand der Technik)
- Passwort-Manager: dringend empfohlen
- 2FA: bei Gesundheitsdaten de facto Pflicht

**Tool-/Vorlagen-Empfehlung:**

| Massnahme | Tool | Preis | Aufwand |
|-----------|------|-------|---------|
| Festplattenverschluesselung (Win) | **BitLocker** (Pro) | In Win Pro enthalten | 1 Std |
| Festplattenverschluesselung (Linux) | **LUKS** | Kostenlos | 1 Std |
| Verschluesselte USB-Sticks | **VeraCrypt** | Kostenlos | 30 Min |
| Passwort-Manager | **KeePassXC** | Kostenlos, lokal | 2 Std |
| 2FA | **YubiKey** | ab 25 EUR/Stueck | 1 Std |
| Virenschutz | **Windows Defender** | In Win enthalten | 0 Std |
| Bildschirmsperre | Betriebssystem | Kostenlos | 5 Min |

**BRUTAL EHRLICH:** KeePassXC ist fuer 2-3 Personen perfekt — kostenlos, lokal, keine Cloud. Die Datenbank auf ein geteiltes Netzlaufwerk legen (verschluesselt!). Bitwarden Self-hosted klingt toll, erfordert aber Server-Administration. Fuer Stufe 1: KeePassXC.

**Aufwand Ersteinrichtung:** 4-8 Stunden (alle Geraete)

**Laufender Aufwand:** 10 Min/Woche (Updates installieren)

**Risiko bei Nicht-Umsetzung:** Laptop-Diebstahl = Datenpanne = Meldepflicht + Bussgeld. Ein unverschluesselter Laptop mit Gesundheitsdaten ist ein GAU. Realistisch: 10.000-50.000 EUR Bussgeld.

**Passt zu Stufe 1:** **Ja** — Hoechste Prioritaet.

---

### 16. Zugriffskonzept

**Ist-Zustand:** Alle nutzen denselben PC oder haben Zugriff auf alles. Kein getrenntes Login, keine Dokumentation wer was sehen darf.

**Gesetzliche Pflicht:** **MUSS** — Art. 32 DSGVO + Art. 25 DSGVO (Privacy by Design). Berechtigungskonzept nach Need-to-Know-Prinzip ist Pflicht.

**Minimum fuer 2-3 Personen:**
- **Getrennte Benutzerkonten** auf jedem PC (kein gemeinsames Admin-Konto!)
- **Ordnerberechtigungen:** Nicht jeder sieht alles (z.B. Personalakten nur Inhaber)
- **Dokumentation:** Wer hat Zugriff auf welche Daten? (1 Seite reicht)
- **Passwort-Richtlinie:** Mindestens 12 Zeichen, Passwort-Manager

**Aufwand Ersteinrichtung:** 4-6 Stunden

**Laufender Aufwand:** 15 Min/Monat (Berechtigungen pruefen)

**Risiko bei Nicht-Umsetzung:** Bussgeld. Praktikant sieht Gesundheitsdaten = Need-to-Know-Verstoss.

**Passt zu Stufe 1:** **Ja**

---

### 17. Loeschkonzept

**Ist-Zustand:** Es wird nichts geloescht. Alte Kundenakten stapeln sich. Digitale Daten wachsen ewig.

**Gesetzliche Pflicht:** **MUSS** — Art. 17 DSGVO (Recht auf Loeschung) + Art. 5 Abs. 1 lit. e (Speicherbegrenzung). Ein Loeschkonzept ist PFLICHT.

**Aufbewahrungsfristen Finanzbranche:**

| Datenart | Frist | Rechtsgrundlage |
|----------|-------|-----------------|
| Buchungsbelege | **8 Jahre** (neu seit BEG IV 2025, vorher 10) | HGB § 257, AO § 147 |
| Handelsbriefe | 6 Jahre | HGB § 257 |
| Beratungsdokumentation (IDD) | 5 Jahre | § 62 VVG |
| GwG-Identifizierung | 5 Jahre nach Ende der Geschaeftsbeziehung | § 8 GwG |
| Gesundheitsdaten | So kurz wie moeglich, max. bis Zweckerfuellung | DSGVO Art. 5 |
| DSGVO-Einwilligungen | 3 Jahre nach Widerruf (Beweislast) | DSGVO Art. 7 + BGB § 195 |

**BRUTAL EHRLICH:** Der Konflikt ist real: Steuerrecht sagt "8 Jahre aufbewahren", DSGVO sagt "so kurz wie moeglich". Loesung: Daten die SOWOHL steuerrechtlich relevant als auch personenbezogen sind, werden 8 Jahre aufbewahrt. Danach MUESSEN sie geloescht werden. Ein einfaches Excel mit Loeschfristen pro Datenkategorie reicht fuer Stufe 1.

**Aufwand Ersteinrichtung:** 4-8 Stunden (Fristen definieren, dokumentieren)

**Laufender Aufwand:** 30 Min/Monat (faellige Loeschungen durchfuehren)

**Risiko bei Nicht-Umsetzung:** Bussgeld. In der Praxis eines der haeufigsten Pruefergebnisse bei Datenschutz-Audits.

**Passt zu Stufe 1:** **Ja** — Loeschkonzept dokumentieren, Umsetzung starten.

---

## Kategorie E: Protokollierung und Nachweisbarkeit

### 18. Audit-Trail (analog Event-Log)

**Ist-Zustand:** Keine Protokollierung. Niemand weiss, wer wann welche Kundendaten geaendert hat.

**Gesetzliche Pflicht:** **SOLL** — Nicht explizit in der DSGVO genannt, aber Art. 5 Abs. 2 (Rechenschaftspflicht) und Art. 32 (Integritaet) erfordern de facto eine Nachverfolgbarkeit.

**Tool-/Vorlagen-Empfehlung:**

| Ansatz | Aufwand | Manipulationssicherheit | Eignung Stufe 1 |
|--------|---------|------------------------|-----------------|
| **Excel-Logbuch** | Gering | Niedrig (editierbar) | Ja, als Start |
| **Papier-Logbuch** (gebunden) | Gering | Mittel (Seiten nummeriert) | Ja |
| **DMS mit Audit-Log** | Mittel | Hoch | Stufe 2 |
| **Hash-Kette (Code-Fabrik-Pattern)** | Hoch | Sehr hoch | Stufe 2-3 |

**Realistische Empfehlung Stufe 1:** **Papier-Logbuch** (gebundenes Buch, nummerierte Seiten) fuer sensible Aenderungen. Spalten: Datum, Uhrzeit, Wer, Was, Welcher Kunde, Grund. **BRUTAL EHRLICH:** Eine Hash-Kette ist fuer 2-3 Personen ohne IT unrealistisch. Ein gebundenes Papier-Logbuch ist manipulationssicherer als ein Excel (Seiten koennen nicht herausgerissen werden, ohne dass es auffaellt) und erfordert null IT.

**Aufwand Ersteinrichtung:** 1 Stunde (Logbuch kaufen, Spalten definieren)

**Laufender Aufwand:** 2-5 Min pro relevantem Vorgang

**Risiko bei Nicht-Umsetzung:** Bei Datenschutzvorfall keine Nachverfolgbarkeit. Erschwertes Audit.

**Passt zu Stufe 1:** **Ja** (Papier-Logbuch)

---

### 19. Datenschutz-Vorfaelle dokumentieren (Art. 33 DSGVO)

**Ist-Zustand:** Kein Vorfall-Prozess definiert. Im Ernstfall: Panik, Ad-hoc-Reaktion, Frist verpasst.

**Gesetzliche Pflicht:** **MUSS** — Art. 33 DSGVO: Meldung an Aufsichtsbehoerde innerhalb 72 Stunden. Art. 34: Benachrichtigung der Betroffenen bei hohem Risiko. Dokumentation JEDES Vorfalls intern (auch wenn keine Meldung noetig).

**Vorfall-Template (sofort nutzbar):**

```
DATENSCHUTZVORFALL — Dokumentation
===================================
Datum/Uhrzeit Entdeckung: ____________
Entdeckt durch: ____________
Art des Vorfalls:
  [ ] Datenverlust  [ ] Unbefugter Zugriff  [ ] Fehlversand
  [ ] Diebstahl     [ ] Technischer Fehler   [ ] Sonstiges: ____
Beschreibung: ____________________________________________
Betroffene Datenkategorien:
  [ ] Stammdaten  [ ] Vertragsdaten  [ ] Gesundheitsdaten  [ ] Finanzdaten
Anzahl betroffener Personen: ____________
Risikobewertung:
  [ ] Kein Risiko → Nur interne Dokumentation
  [ ] Risiko → Meldung an Aufsichtsbehoerde (72h!)
  [ ] Hohes Risiko → Meldung + Benachrichtigung Betroffener
Sofortmassnahmen: ____________________________________________
Meldung an Aufsichtsbehoerde:
  Datum: ____________ Aktenzeichen: ____________
Benachrichtigung Betroffener:
  Datum: ____________ Art: ____________
Ursachenanalyse: ____________________________________________
Massnahmen zur Verhinderung: ____________________________________________
```

**Aufwand Ersteinrichtung:** 2-4 Stunden (Template erstellen, Notfallnummern sammeln, Prozess festlegen)

**Laufender Aufwand:** 0 (nur im Vorfall)

**Risiko bei Nicht-Umsetzung:** Bussgeld bis 10 Mio. EUR bei verspaeteter/fehlender Meldung. Frist verpasst = separater Verstoss.

**Passt zu Stufe 1:** **Ja** — Template am Tag 1 erstellen.

---

### 20. Nachweis der Rechenschaftspflicht (Art. 5 Abs. 2)

**Ist-Zustand:** "Wir halten uns an die DSGVO" — aber kein Nachweis. Beweislast liegt beim Verantwortlichen!

**Gesetzliche Pflicht:** **MUSS** — Art. 5 Abs. 2 DSGVO: Der Verantwortliche muss die Einhaltung NACHWEISEN koennen ("Accountability"). Es reicht NICHT, DSGVO-konform zu handeln. Man muss es BEWEISEN koennen.

**Notwendige Dokumente fuer einen Finanzberater:**

| Dokument | Pflicht | Status Stufe 1 |
|----------|---------|----------------|
| VVT | MUSS | Erstellen |
| TOM-Dokumentation | MUSS | Erstellen |
| Datenschutzerklaerung | MUSS | Pruefen/Aktualisieren |
| Einwilligungsformulare | MUSS (bei Art. 9) | Erstellen |
| Auftragsverarbeitungsvertraege (AVV) | MUSS (wenn Dienstleister) | Pruefen |
| Loeschkonzept | MUSS | Erstellen |
| Berechtigungskonzept | MUSS | Erstellen |
| Datenschutzvorfall-Prozess | MUSS | Erstellen |
| Schulungsnachweis | SOLL | Durchfuehren |
| DSFA / Schwellwertanalyse | MUSS | Erstellen |

**Aufwand Ersteinrichtung:** Ist die Summe aller Einzelmassnahmen (ca. 40-80 Stunden gesamt)

**Laufender Aufwand:** 1-2 Std/Monat (Dokumente aktuell halten)

**Risiko bei Nicht-Umsetzung:** Bei JEDER Pruefung oder Beschwerde: Beweislastumkehr. Koennen Sie nicht nachweisen, dass Sie DSGVO-konform handeln, wird der Verstoss VERMUTET.

**Passt zu Stufe 1:** **Ja** — Das IST Stufe 1.

---

## Kategorie F: Selbstverbesserungs-Mechanismus

### 21. Metriken fuer Prozessqualitaet

**Ist-Zustand:** Keine Metriken. "Laeuft doch" als einzige Bewertung.

**Gesetzliche Pflicht:** **KANN** — Keine direkte Pflicht, aber Art. 32 fordert "regelmaessige Ueberpruefung" — ohne Metriken ist das kaum moeglich.

**5 realistische Kennzahlen fuer 2-3 Personen (pro Monat):**

| # | Kennzahl | Messmethode | Ziel |
|---|----------|-------------|------|
| 1 | Checklisten-Quote | Ausgefuellt / Erwartet | 100% |
| 2 | Offene Kundenfaelle | Zaehlen am Monatsende | Sinkend |
| 3 | Backup-Erfolgsrate | Erfolgreiche / Geplante Backups | 100% |
| 4 | Vier-Augen-Quote | Geprueft / Pflichtig | 100% |
| 5 | Verbesserungsmassnahmen umgesetzt | Umgesetzt / Geplant | >50% |

**BRUTAL EHRLICH:** Mehr als 5 Kennzahlen sind fuer 2-3 Personen Zeitverschwendung. Diese 5 kann man in 15 Minuten pro Monat erheben. Keine Software noetig — ein Blatt Papier oder eine LibreOffice-Tabelle reicht.

**Aufwand Ersteinrichtung:** 1-2 Stunden

**Laufender Aufwand:** 15 Min/Monat

**Risiko bei Nicht-Umsetzung:** Kein Bussgeld. Aber ohne Metriken weiss niemand, ob der Prozess funktioniert.

**Passt zu Stufe 1:** **Ja**

---

### 22. Verbesserungs-Backlog

**Ist-Zustand:** Verbesserungsideen werden muendlich geaeussert und sofort vergessen.

**Gesetzliche Pflicht:** **KANN** — Keine Pflicht, aber essenziell fuer KVP.

**Empfehlung:**
- **Verbesserungs-Spalte auf dem Kanban-Board** (physisch oder digital)
- Jede Retro erzeugt 1-2 Karten
- Priorisierung: **Machen / Spaeter / Nie** (einfacher als MoSCoW)
- Pro 2-Wochen-Zyklus wird MAXIMAL 1 Verbesserung umgesetzt
- PDCA-Prinzip: Plan → Do → Check → Act

**Aufwand Ersteinrichtung:** 30 Minuten (Spalte auf dem Board hinzufuegen)

**Laufender Aufwand:** In der Retrospektive enthalten (0 Zusatzaufwand)

**Risiko bei Nicht-Umsetzung:** Kein Bussgeld. Stagnation.

**Passt zu Stufe 1:** **Ja**

---

### 23. Eskalationsstufen

**Ist-Zustand:** Kein Eskalationsprozess. Im Ernstfall: Chaos.

**Gesetzliche Pflicht:** **SOLL** — Art. 33 DSGVO impliziert einen Notfallprozess. Ohne definierte Eskalation wird die 72-Stunden-Frist verpasst.

**Eskalationsstufenmodell:**

| Stufe | Ausloeser | Reaktionszeit | Massnahme | Wer |
|-------|-----------|---------------|-----------|-----|
| **0 — Normal** | Prozessabweichung (z.B. Checkliste vergessen) | Naechste Retro | Auf dem Board notieren | Jeder |
| **1 — Aufmerksamkeit** | Wiederholte Abweichung, potentielles Risiko | 48 Stunden | Sofortige Besprechung, Ursache klaeren | Team |
| **2 — Alarm** | DSGVO-Risiko identifiziert (z.B. Daten unverschluesselt gefunden) | 24 Stunden | Risiko abstellen, dokumentieren, ggf. DSB informieren | Inhaber |
| **3 — Notfall** | Datenschutzvorfall (Verlust, Leak, Hack) | SOFORT | Sofortmassnahmen, Vorfall-Template ausfuellen, 72h-Frist laeuft | Inhaber + DSB |

**Notfall-Telefonnummern (sofort erfassen!):**
- Externer DSB: ____________
- Zustaendige Aufsichtsbehoerde: ____________ (Landesdatenschutzbehoerde)
- IT-Dienstleister: ____________
- Versicherung (Cyber-Police, falls vorhanden): ____________

**Aufwand Ersteinrichtung:** 2-4 Stunden

**Laufender Aufwand:** 0 (nur im Ernstfall)

**Risiko bei Nicht-Umsetzung:** 72-Stunden-Frist wird verpasst → separater DSGVO-Verstoss.

**Passt zu Stufe 1:** **Ja** — Am Tag 1 definieren.

---

## Kategorie G: Uebergang zu Stufe 2

### 24. Reifegrad-Bewertung: Wann ist das Team bereit?

**Ist-Zustand:** Kein Reifegradmodell. Keine Selbstbewertung.

**Gesetzliche Pflicht:** **KANN** — Keine Pflicht, aber das Bitkom-Reifegradmodell bietet einen anerkannten Rahmen.

**Reifegradstufen (angelehnt an Bitkom-Modell):**

| Stufe | Beschreibung | Entspricht |
|-------|-------------|------------|
| 0 — Nicht vorhanden | Keine DSGVO-Massnahmen | Ausgangszustand |
| 1 — Initial | Grundlegende Massnahmen, dokumentiert aber nicht gelebt | Stufe 1 Start |
| 2 — Wiederholbar | Massnahmen werden regelmaessig durchgefuehrt | Stufe 1 Ende |
| 3 — Definiert | Prozesse standardisiert, messbar, verbessert | Stufe 2 Start |
| 4 — Gesteuert | Datengestuetzte Steuerung, Metriken | Stufe 2 Ende |
| 5 — Optimierend | Kontinuierliche Verbesserung etabliert | Stufe 3 |

**Aufwand:** 2-4 Stunden (quartalsweise Selbstbewertung)

**Passt zu Stufe 1:** **Ja** (erste Bewertung als Baseline)

---

## Ergebnis-Tabellen

### Pflicht-Matrix (alle 24 Massnahmen)

| # | Massnahme | Pflicht? | Stufe | Aufwand Setup | Aufwand/Woche | Bussgeld-Risiko |
|---|-----------|----------|-------|---------------|---------------|-----------------|
| 1 | VVT | **MUSS** | 1 | 8-16 Std | 15-30 Min | Bis 10 Mio EUR |
| 2 | TOMs | **MUSS** | 1 | 12-20 Std | 30 Min | Bis 10 Mio EUR |
| 3 | DSFA/Schwellwert | **MUSS*** | 1 | 2-4 Std | 30 Min/Monat | Bis 10 Mio EUR |
| 4 | Ext. DSB | **MUSS*** | 1 | 4-8 Std | 0 (extern) | Bis 10 Mio EUR |
| 5 | CRM lokal | SOLL | 1 | 8-24 Std | 0 (integriert) | Indirekt |
| 6 | DMS | SOLL | 1-2 | 4-24 Std | 15 Min | Indirekt |
| 7 | Verschl. Kommunikation | **MUSS** | 1 | 2-4 Std | 5 Min/Vorgang | 5.000-25.000 EUR |
| 8 | Kanban-Board | KANN | 1 | 1-2 Std | 10 Min/Tag | Keins |
| 9 | Backup | **MUSS** | 1 | 4-8 Std | 15 Min | Existenzbedrohend |
| 10 | Analyse-Software | KANN | 1-2 | 2-4 Std | 0 (integriert) | Gering |
| 11 | Sprint-Rhythmus | KANN | 1 | 2 Std | 30 Min/2 Wo | Keins |
| 12 | Review-Stufen | SOLL | 1 | 2-4 Std | 15-30 Min/Fall | Compliance |
| 13 | Retrospektive | KANN** | 1 | 1 Std | 30 Min/2 Wo | Keins |
| 14 | Checklisten | SOLL | 1 | 4-8 Std | 5 Min/Checkliste | IDD-Verstoss |
| 15 | Endgeraete-Sicherheit | **MUSS** | 1 | 4-8 Std | 10 Min | 10.000-50.000 EUR |
| 16 | Zugriffskonzept | **MUSS** | 1 | 4-6 Std | 15 Min/Monat | Bussgeld |
| 17 | Loeschkonzept | **MUSS** | 1 | 4-8 Std | 30 Min/Monat | Haeufiger Befund |
| 18 | Audit-Trail | SOLL | 1 | 1 Std | 2-5 Min/Vorgang | Indirekt |
| 19 | Vorfall-Prozess | **MUSS** | 1 | 2-4 Std | 0 (nur Vorfall) | Bis 10 Mio EUR |
| 20 | Rechenschaftspflicht | **MUSS** | 1 | Summe aller | 1-2 Std/Monat | Beweislastumkehr |
| 21 | Metriken | KANN** | 1 | 1-2 Std | 15 Min/Monat | Keins |
| 22 | Verbesserungs-Backlog | KANN | 1 | 30 Min | 0 (in Retro) | Keins |
| 23 | Eskalationsstufen | SOLL | 1 | 2-4 Std | 0 (nur Vorfall) | 72h-Frist |
| 24 | Reifegrad-Bewertung | KANN | 1 | 2-4 Std | 2 Std/Quartal | Keins |

*\* MUSS\*: Pflicht abhaengig von konkreter Taetigkeitsart und Umfang*
*\*\* KANN\*\*: Keine direkte Pflicht, aber de facto noetig um Art. 32 zu erfuellen*

**Gesamtaufwand Ersteinrichtung Stufe 1: ca. 60-120 Arbeitsstunden (3-6 Wochen bei 50% Tagesgeschaeft)**

---

### 30-Tage-Startplan (Stufe 1)

| Woche | Tag | Massnahme | Verantwortlich | Erledigt? | Review durch |
|-------|-----|-----------|----------------|-----------|-------------|
| **1** | 1-2 | Endgeraete-Sicherheit: BitLocker/LUKS aktivieren, KeePassXC einrichten, Bildschirmsperre | Inhaber | [ ] | Alle |
| **1** | 2-3 | Backup einrichten: Duplicati + 2 ext. SSDs, erster Testlauf | Inhaber | [ ] | Alle |
| **1** | 3-4 | Verschluesselte Kommunikation: Threema Work installieren, Kunden informieren | Inhaber | [ ] | Alle |
| **1** | 5 | Datenschutzvorfall-Template erstellen, Notfallnummern sammeln | Inhaber | [ ] | DSB |
| **2** | 1-3 | VVT erstellen (Stiftung Datenschutz Vorlage) | Inhaber | [ ] | DSB |
| **2** | 3-5 | TOM dokumentieren (IST-Zustand + Soll) | Inhaber | [ ] | DSB |
| **2** | 5 | Externen DSB recherchieren und beauftragen (wenn Pflicht) | Inhaber | [ ] | — |
| **3** | 1-2 | Zugriffskonzept: Getrennte Benutzerkonten, Berechtigungen dokumentieren | Inhaber | [ ] | Alle |
| **3** | 2-3 | Loeschkonzept dokumentieren (Fristen-Tabelle) | Inhaber | [ ] | DSB |
| **3** | 3-4 | Checklisten erstellen: Onboarding, Taeglich, Woechentlich | Inhaber | [ ] | Alle |
| **3** | 5 | Schwellwertanalyse DSFA durchfuehren | Inhaber | [ ] | DSB |
| **4** | 1 | Kanban-Board aufsetzen (physisch) | Team | [ ] | Alle |
| **4** | 2 | Eskalationsstufen definieren, aushaengen | Inhaber | [ ] | DSB |
| **4** | 3 | Papier-Logbuch starten (Audit-Trail) | Team | [ ] | Inhaber |
| **4** | 4 | Erste Retrospektive durchfuehren | Team | [ ] | Alle |
| **4** | 5 | Erste Reifegrad-Selbstbewertung (Baseline) | Inhaber | [ ] | DSB |

---

### Tool-Empfehlungen (Stufe 1)

| Bereich | Tool | Kosten | Lokal/Cloud | DSGVO-konform? |
|---------|------|--------|-------------|----------------|
| VVT | Stiftung Datenschutz Excel-Vorlage | Kostenlos | Lokal | Ja |
| TOM-Doku | DSGVO-Vorlagen.de Vorlage | Kostenlos | Lokal | Ja |
| DSFA | DSK Kurzpapier Nr. 5 (Anleitung) | Kostenlos | Lokal | Ja |
| Passwort-Manager | **KeePassXC** | Kostenlos | Lokal | Ja |
| Festplatten-Verschl. | **BitLocker** (Win Pro) / **LUKS** (Linux) | Kostenlos | Lokal | Ja |
| USB-Verschl. | **VeraCrypt** | Kostenlos | Lokal | Ja |
| Backup | **Duplicati** | Kostenlos | Lokal | Ja |
| Messenger | **Threema Work** | 3 EUR/Monat/Person | Cloud (E2E, CH-Server) | Ja |
| Datei-Verschl. | **7-Zip** (AES-256) | Kostenlos | Lokal | Ja |
| Tabellenkalkulation | **LibreOffice Calc** | Kostenlos | Lokal | Ja |
| Kanban | **Whiteboard + Post-Its** | ~20 EUR | Physisch | Ja |
| Virenschutz | **Windows Defender** | In Windows enthalten | Lokal | Ja |
| 2FA | **YubiKey 5 NFC** | 25-55 EUR/Stueck | Lokal | Ja |
| DMS (optional) | **ecoDMS** | 89 EUR einmalig | Lokal | Ja |
| CRM (optional) | **SuccessControl CRM** | ab 290 EUR einmalig | Lokal | Ja |

**Gesamtkosten Stufe 1 (Minimum):** ca. 100-200 EUR (2x ext. SSD + Threema Work + ggf. YubiKeys)
**Gesamtkosten Stufe 1 (Komfort):** ca. 500-800 EUR (+ ecoDMS + CRM)
**Laufende Kosten:** ca. 6-9 EUR/Monat (Threema Work) + 100-300 EUR/Monat (ext. DSB, wenn Pflicht)

---

### Inspect-&-Adapt-Kalender

| Frequenz | Aktivitaet | Dauer | Teilnehmer | Output |
|----------|-----------|-------|------------|--------|
| **Taeglich** | Stand-up: Was steht an? Was blockiert? | 10 Min | Alle | — |
| **Taeglich** | Tages-Checkliste abarbeiten | 5 Min | Jeder | Checkliste ausgefuellt |
| **Woechentlich** | Review: Offene Faelle, Fristen, Backup-Status | 30 Min | Alle | Statusliste |
| **Alle 2 Wochen** | Retrospektive: Was verbessern? | 30 Min | Alle | 1-2 Massnahmen |
| **Monatlich** | Metriken erheben + Backlog priorisieren | 30 Min | Inhaber | 5 Kennzahlen |
| **Monatlich** | Loeschfristen pruefen | 30 Min | Inhaber | Loeschprotokoll |
| **Quartalsweise** | Deep-Audit: 5 Kundenakten stichprobenartig pruefen | 2 Std | Inhaber + DSB | Audit-Bericht |
| **Quartalsweise** | Reifegrad-Selbstbewertung | 1 Std | Inhaber | Reifegrad-Score |
| **Halbjaehrlich** | VVT + TOM komplett reviewen | 2-4 Std | Inhaber + DSB | Aktualisierte Dokumente |
| **Jaehrlich** | Datenschutzschulung (alle Mitarbeiter) | 2 Std | Alle | Schulungsnachweis |

---

### Checklisten-Vorlagen

#### Checkliste 1: Neukunden-Onboarding

```
NEUKUNDEN-ONBOARDING — Checkliste
===================================
Datum: ____________  Kunde: ____________  Bearbeiter: ____________

DSGVO & Compliance:
[ ] Datenschutzerklaerung ausgehaendigt
[ ] DSGVO-Einwilligung fuer Gesundheitsdaten unterschrieben (Art. 9 Abs. 2 lit. a)
[ ] Zweck der Datenverarbeitung erklaert und dokumentiert
[ ] Widerrufsrecht erklaert
[ ] Kopie der Einwilligung an Kunden

GwG (bei Lebensversicherungen):
[ ] Identitaet festgestellt (Ausweiskopie / Personalausweis-Nr.)
[ ] PEP-Pruefung durchgefuehrt (politisch exponierte Person)
[ ] Wirtschaftlich Berechtigter ermittelt
[ ] GwG-Dokumentation abgelegt

IDD-Dokumentation:
[ ] Wuensche und Beduerfnisse erfasst
[ ] Beratungsanlass dokumentiert
[ ] Produktempfehlung begruendet
[ ] Beratungsprotokoll unterschrieben
[ ] Kosteninformation ausgehaendigt

System:
[ ] Kunde im CRM/in der Kundenliste angelegt
[ ] Dokumente verschluesselt abgelegt
[ ] Zugriffsrechte geprueft (Need-to-Know)
[ ] Loeschfrist eingetragen

Vier-Augen-Pruefung:
[ ] Gegenzeichnung durch: ____________ Datum: ____________
```

#### Checkliste 2: Taeglich

```
TAGES-CHECKLISTE
===================================
Datum: ____________  Bearbeiter: ____________

Morgens:
[ ] Bildschirmsperre aktiv? (bei allen Geraeten)
[ ] Backup letzte Nacht erfolgreich? (Duplicati-Log pruefen)
[ ] Buero/Schraenke abgeschlossen? (nach Feierabend gestern)
[ ] Offene Fristen pruefen (Termine, Abgaben, Kuendigungen)

Tagsblaufer:
[ ] Gesundheitsdaten NUR verschluesselt empfangen/senden
[ ] Checklisten fuer heutige Kundentermine vorbereitet
[ ] Papier-Logbuch gefuehrt (bei relevanten Aenderungen)

Abends:
[ ] Bildschirm gesperrt / PC heruntergefahren
[ ] Sensible Papiere im Schrank/Safe eingeschlossen
[ ] Buero abgeschlossen
```

#### Checkliste 3: Woechentlich

```
WOCHEN-CHECKLISTE
===================================
Woche: ____________  Bearbeiter: ____________

Backup:
[ ] 5 taegliche Backups erfolgreich? (Mo-Fr)
[ ] Offsite-Medium getauscht? (externe SSD mitnehmen/bringen)
[ ] Wiederherstellungstest diesen Monat schon gemacht?

Kundendaten:
[ ] Ausstehende Einwilligungen nachgefasst
[ ] Offene Kundenfaelle gezaehlt: ____
[ ] Faellige Loeschungen geprueft

Kommunikation:
[ ] Unverschluesselte E-Mails mit Kundendaten? → Sofort abstellen
[ ] Threema-Nachrichten beantwortet

Kanban-Board:
[ ] Erledigte Aufgaben verschoben
[ ] Neue Aufgaben erfasst
[ ] WIP-Limit eingehalten?

Sicherheit:
[ ] Software-Updates installiert (OS, Browser, Office)
[ ] Passwort-Manager-DB gesichert

Review (jeden Freitag, 30 Min):
[ ] Was lief gut diese Woche?
[ ] Was muss naechste Woche besser laufen?
[ ] Vier-Augen-Pruefungen alle durchgefuehrt?
```

#### Checkliste 4: Quartals-Audit

```
QUARTALS-AUDIT — Deep Smoke Test
===================================
Quartal: ____________  Datum: ____________  Pruefer: ____________ + ____________

1. Stichprobe Kundendaten (5 zufaellige Kunden):
   Kunde 1: ____________
   [ ] DSGVO-Einwilligung vorhanden und aktuell?
   [ ] Daten korrekt und vollstaendig?
   [ ] Loeschfrist eingetragen?
   [ ] Zugriffsrechte angemessen?
   [ ] Beratungsdokumentation vollstaendig?

   Kunde 2: ____________
   [ ] ... (gleiche Pruefpunkte)

   Kunde 3-5: (analog)

2. Berechtigungen:
   [ ] Alle Benutzerkonten noch aktiv und berechtigt?
   [ ] Ehemalige Mitarbeiter entfernt?
   [ ] Passwort-Aenderungen durchgefuehrt? (mind. 1x/Jahr)

3. Loeschfristen:
   [ ] Faellige Loeschungen durchgefuehrt?
   [ ] Loeschprotokoll gefuehrt?

4. TOMs:
   [ ] Festplattenverschluesselung aktiv auf allen Geraeten?
   [ ] Virenschutz aktuell?
   [ ] Backup-Protokoll vollstaendig?
   [ ] Letzter Wiederherstellungstest: ____________ (max. 3 Monate her)

5. Dokumente:
   [ ] VVT aktuell? Letzte Aenderung: ____________
   [ ] TOM-Dokumentation aktuell?
   [ ] Datenschutzerklaerung aktuell?
   [ ] Loeschkonzept aktuell?

6. Vorfaelle:
   [ ] Datenschutzvorfaelle im Quartal: ____
   [ ] Alle korrekt dokumentiert?
   [ ] Massnahmen umgesetzt?

7. Verbesserung:
   [ ] Retrospektiven durchgefuehrt: ____ (Soll: 6-7)
   [ ] Verbesserungsmassnahmen umgesetzt: ____ von ____
   [ ] Metriken erhoben: ____ Monate (Soll: 3)

Gesamtbewertung:
[ ] Alles in Ordnung — weiter so
[ ] Maengel gefunden — Massnahmen festgelegt (siehe Rueckseite)
[ ] Kritische Maengel — Sofortmassnahmen erforderlich

Unterschrift Pruefer 1: ____________  Datum: ____________
Unterschrift Pruefer 2: ____________  Datum: ____________
```

---

### Uebergangs-Checkliste Stufe 1 → Stufe 2

Das Team ist bereit fuer eigene Software/Server wenn ALLE folgenden Kriterien erfuellt sind:

```
REIFEGRADPRUEFUNG — Uebergang Stufe 1 → Stufe 2
====================================================
Datum der Pruefung: ____________

Datenschutz-Grundlagen:
[ ] VVT vollstaendig und aktuell (letzte Pruefung < 3 Monate)
[ ] TOMs dokumentiert UND gelebt (nicht nur auf Papier)
[ ] Schwellwertanalyse/DSFA durchgefuehrt
[ ] Externer DSB beauftragt (wenn Pflicht)
[ ] Alle Mitarbeiter datenschutzgeschult (Nachweis vorhanden)

Prozesse:
[ ] Mindestens 6 Retrospektiven durchgefuehrt mit dokumentierten Ergebnissen
[ ] Mindestens 3 Verbesserungsmassnahmen nachweislich umgesetzt
[ ] Checklisten werden konsequent genutzt (Quote > 90%)
[ ] Vier-Augen-Prinzip bei sensiblen Vorgaengen gelebt

Technik:
[ ] Backup-Prozess laeuft zuverlaessig seit 3+ Monaten (Track Record)
[ ] Mindestens 3 erfolgreiche Wiederherstellungstests dokumentiert
[ ] Alle Geraete verschluesselt
[ ] Passwort-Manager im Einsatz
[ ] Verschluesselte Kommunikation etabliert

Dokumentation:
[ ] Loeschkonzept implementiert UND mindestens 1x Loeschung durchgefuehrt
[ ] Notfallplan getestet (Trockenubung Datenschutzvorfall)
[ ] Berechtigungskonzept dokumentiert und aktuell
[ ] Metriken werden seit 3+ Monaten erhoben

Ergebnis:
[ ] ALLE Punkte erfuellt → Stufe 2 kann beginnen
[ ] Nicht alle erfuellt → Stufe 1 fortsetzen, fehlende Punkte nacharbeiten

Unterschrift Inhaber: ____________  Datum: ____________
Unterschrift DSB: ____________  Datum: ____________
```

---

### Zusaetzliche Regulierung: Was ist relevant?

| Regulierung | Relevant fuer | Pflichten | Bussgeld |
|-------------|---------------|-----------|----------|
| **IDD** (Insurance Distribution Directive / VersVermV) | Versicherungsvermittler, -makler, -berater | Beratungsdokumentation, 15 Std/Jahr Weiterbildung, Verguetungstransparenz, Wohlverhaltensregeln | Gewerbeerlaubnis-Entzug |
| **GwG** (Geldwaeschegesetz) | Bei Lebensversicherungen, Finanzanlagenvermittlung | Kundenidentifizierung (KYC), PEP-Pruefung, Verdachtsmeldungen (seit 10/2025 nur noch digital), Aufbewahrung 5 Jahre, Risikoanalyse | Bis 1 Mio EUR oder 10% des Umsatzes |
| **MiFID II** | Nur bei Wertpapierberatung / Finanzanlagenvermittlung (§ 34f GewO) | Geeignetheitspruefung, Kosteninformation, Aufzeichnungspflichten | BaFin-Massnahmen |
| **KWG** (Kreditwesengesetz) | Nur bei Bankgeschaeften / Finanzdienstleistungen mit BaFin-Lizenz | Normalerweise NICHT relevant fuer kleine Versicherungsvermittler | — |
| **GewO** (Gewerbeordnung §§ 34d/f) | Alle Versicherungsvermittler / Finanzanlagenvermittler | Erlaubnispflicht, Registrierung, Berufshaftpflicht | Bussgeld + Erlaubnisentzug |
| **VVG** (Versicherungsvertragsgesetz) | Versicherungsvermittler | Informations- und Beratungspflichten, Dokumentation | Schadensersatz |

**Fazit Zusatzregulierung:**
- **IDD + GwG sind fuer Versicherungsvermittler zwingend** — die Checklisten muessen diese Pflichten abbilden
- **MiFID II nur relevant bei Wertpapieren/Finanzanlagen** (§ 34f GewO)
- **KWG ist fuer kleine Finanzberater normalerweise NICHT relevant** (keine BaFin-Lizenz)
- **Die IDD-Weiterbildungspflicht (15 Std/Jahr) wird von der IHK stichprobenartig geprueft!** Nachweise 5 Jahre aufbewahren.
- **GwG-Neuerung 2025:** Verdachtsmeldungen muessen seit Oktober 2025 vollstaendig digital und standardisiert erfolgen (GwGMeldV)

---

## Brutale Ehrlichkeits-Sektion: Was ist realistisch?

### Realistisch in Stufe 1 (2-3 Personen ohne IT):
1. VVT mit Excel-Vorlage erstellen
2. TOMs dokumentieren (das meiste existiert schon, nur nicht aufgeschrieben)
3. KeePassXC + BitLocker einrichten
4. Duplicati-Backup mit 2 SSDs
5. Threema Work installieren
6. Papier-Kanban-Board + Papier-Logbuch
7. Checklisten auf Papier oder LibreOffice
8. Externen DSB beauftragen (der hilft bei allem anderen)
9. 2-woechentliche Retrospektive (30 Min)
10. Monatlich 5 Kennzahlen erheben

### Unrealistisch in Stufe 1:
1. Self-hosted DMS (erfordert Server-Administration)
2. Hash-Kette / manipulationssicherer Audit-Trail (erfordert Programmierung)
3. Python/R Datenanalyse (erfordert Programmierkenntnisse)
4. Automatisierte Loeschfristen (erfordert Software-Entwicklung)
5. ISO 27001 oder vergleichbare Zertifizierung
6. Eigener Server / VPS
7. Self-hosted Kanban (Kanboard, WeKan etc.)

### Der wichtigste einzelne Schritt:
**Einen externen DSB beauftragen.** Fuer 100-300 EUR/Monat bekommt man Expertise, die intern nicht vorhanden ist. Der DSB hilft beim VVT, bei den TOMs, bei der Schwellwertanalyse, und ist im Notfall erreichbar. Das ist die beste Investition, die ein Kleinunternehmen mit Gesundheitsdaten machen kann.

---

## Quellen

### DSGVO & Datenschutz
- [Stiftung Datenschutz — Kleinunternehmen](https://stiftungdatenschutz.org/kleinunternehmen)
- [DS Kleinunternehmen — Arbeitshilfen](https://ds-kleinunternehmen.de/arbeitshilfen)
- [BfDI — VVT Hinweise und Muster](https://www.bfdi.bund.de/DE/Fachthemen/Inhalte/Allgemein/Verzeichnis-Verarbeitungstaetigkeiten.html)
- [activeMind — VVT Muster](https://www.activemind.de/downloads/verzeichnis-verarbeitungstaetigkeiten-verantwortlicher/)
- [DSGVO-Vorlagen.de — TOM](https://dsgvo-vorlagen.de/tom-nach-dsgvo-richtig-dokumentieren)
- [Dr. Datenschutz — TOM](https://www.dr-datenschutz.de/was-sind-technisch-und-organisatorische-massnahmen-tom/)
- [Dr. Datenschutz — DSFA](https://www.dr-datenschutz.de/verzeichnis-von-verarbeitungstaetigkeiten-pflicht-mit-ausnahmen/)
- [DSK Kurzpapier Nr. 5 — DSFA](https://www.datenschutzkonferenz-online.de/media/kp/dsk_kpnr_5.pdf)
- [LfD Niedersachsen — DSFA Muss-Listen](https://www.lfd.niedersachsen.de/dsgvo/liste_von_verarbeitungsvorgangen_nach_art_35_abs_4_ds_gvo/muss-listen-zur-datenschutz-folgenabschatzung-179663.html)

### DSB & Kosten
- [Datenbeschuetzerin — DSB Pflicht 2025](https://regina-stoiber.com/2025/06/13/datenschutzbeauftragter-pflicht-2025/)
- [BvD — Externer DSB Kosten](https://www.bvdnet.de/de/externer-datenschutzbeauftragter-kosten/)
- [keyed.de — DSB Kosten](https://keyed.de/blog/datenschutzbeauftragter-kosten/)

### Verschluesselung & Kommunikation
- [DSK Orientierungshilfe E-Mail-Verschluesselung](https://www.datenschutzkonferenz-online.de/media/oh/20210616_orientierungshilfe_e_mail_verschluesselung.pdf)
- [SEC4YOU — BitLocker DSGVO](https://www.sec4you.com/bitlocker-endpoint-encryption-as-defined-by-the-dsgvo/)
- [Threema Work — DSGVO-konformer Messenger](https://threema.com/en/use-cases/gdpr-compliant-messenger)

### Backup
- [Impossible Cloud — Backup-Strategie 2025](https://www.impossiblecloud.com/de-de/magazine/backup-strategie-deutsch-new)
- [Grass-Merkur — 3-2-1 Backup-Regel](https://www.grass-merkur.de/die-3-2-1-backup-regel/)

### IDD & GwG
- [IDD Praxis-Guide 2025](https://www.insurmagic.de/blog/idd-2025-insurance-distribution-directive-praxis-guide)
- [DEMV — IDD](https://www.demv.de/blog/makleralltag/idd)
- [AfW/VOTUM — GwG Arbeitshilfen](https://www.bundesverband-finanzdienstleistung.de/gwg-arbeitshilfe/)
- [IHK Frankfurt — GwG Handlungspflichten](https://www.frankfurt-main.ihk.de/standortpolitik/finanzplatz-frankfurt/geldwaeschegesetz-handlungspflichten-fuer-unternehmen)

### Berechtigungskonzept & Loeschkonzept
- [Proliance — Berechtigungskonzept](https://www.proliance.ai/blog/berechtigungskonzept)
- [Roedl & Partner — Need-to-Know](https://www.roedl.de/themen/newsletter-gesundheits-sozialwirtschaft/2023/11/berechtigungskonzept-need-to-know-prinzip)
- [Hamburger Software — Loeschkonzept KMU](https://www.hamburger-software.de/blog/artikel/dsgvo-konformes-loeschkonzept-erstellen-darauf-muessen-kmu-achten)
- [Dr. Datenschutz — BEG IV neue Aufbewahrungsfristen](https://www.dr-datenschutz.de/das-beg-iv-weniger-buerokratie-und-neue-aufbewahrungsfristen/)

### Reifegradmodell
- [Dr. Datenschutz — Reifegrade und Kennzahlen](https://www.dr-datenschutz.de/datenschutz-messbar-machen-reifegrade-und-kennzahlen/)
- [Bitkom — Datenschutz-Reifegradmodell](https://www.bitkom.org/Bitkom/Publikationen/Datenschutz-Reifegradmodell-technisch-organisatorische-Massnahmen-Auftragsverarbeitung)

### Agile Methoden
- [IT Finanzmagazin — 70% nutzen Scrum/Kanban](https://www.it-finanzmagazin.de/70-prozent-der-banken-und-versicherer-entwickeln-mit-agilen-it-methoden-wie-scrum-oder-kanban-35438/)
- [Horvath — Effizienzsteigerung durch agile Methoden](https://www.horvath-partners.com/en/press/detail/agile-arbeitsweisen-steigern-die-effizienz-um-bis-zu-zwoelf-prozent)

### Datenschutzvorfall
- [Art. 33 DSGVO — dejure.org](https://dejure.org/gesetze/DSGVO/33.html)
- [isico — Meldung Datenschutzvorfall Leitfaden](https://www.isico.de/blog/meldung-datenschutzvorfall)
- [BSI — Leitfaden Reaktion auf IT-Sicherheitsvorfaelle](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/CSN/Leitfaden_VP_VE.pdf)

### Tools
- [Kanboard](https://kanboard.org/)
- [Kanri — Offline Kanban Desktop App](https://github.com/kanriapp/kanri)
- [Duplicati — Open Source Backup](https://www.duplicati.com)
- [KeePassXC](https://keepassxc.org/)
- [VeraCrypt](https://www.veracrypt.fr/)
- [ecoDMS](https://www.ecodms.de/)
- [SuccessControl CRM](https://www.successcontrol.de/)
- [bitfarm-Archiv DMS](https://www.bitfarm-archiv.de/)
