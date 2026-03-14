# Prompt: Selbstverbessernder Prozessaufbau fuer Kleinunternehmen in der Finanzbranche

## Kontext

Ein kleines Unternehmen (2-3 Personen) in der Finanzbranche verwaltet
Kunden- und Gesundheitsdaten (besondere Kategorien nach Art. 9 DSGVO).
Aktuelle Prozesse sind unbekannt.

Ziel: Ein Prozesssystem das **klein startet**, sich durch eingebaute
Review-Schleifen **stetig selbst verbessert**, und schrittweise
professionalisiert — ohne Ueberforderung des kleinen Teams.

## Inspirationsquelle: Scrumban als einfaches Arbeits- und Prozesssteuerungssystem

Statt komplexer Toolchains soll ein **Scrumban-Board** das zentrale Werkzeug
sein, um Tagesgeschaeft, Prozessverbesserung und DSGVO-Compliance zu steuern.

### Warum Scrumban (nicht Scrum, nicht reines Kanban)?

- **Kanban-Basis**: Arbeit visualisieren, WIP-Limits, Pull-Prinzip
  → passt zu Finanzberatung (Kundenfaelle kommen laufend rein)
- **Scrum-Elemente**: Feste Review/Retro-Zyklen (2 Wochen) fuer
  kontinuierliche Verbesserung → liefert den Inspect-&-Adapt-Rhythmus
- **Kein Sprint-Commitment**: Keine Story Points, kein Velocity-Tracking
  → realistisch fuer 2-3 Personen ohne Agile-Erfahrung

### Scrumban-Board-Struktur fuer Finanzberatung

```
| Inbox | Heute | In Arbeit (max 3/Person) | Vier-Augen | Erledigt | Verbesserung |
|-------|-------|--------------------------|------------|----------|-------------|
```

- **Inbox**: Neue Kundenfaelle, Aufgaben, Post, Anfragen
- **Heute**: Was heute erledigt werden soll (taeglich morgens ziehen)
- **In Arbeit**: Aktive Bearbeitung (WIP-Limit: max 3 pro Person)
- **Vier-Augen**: Wartet auf Pruefung durch zweite Person (Slow Lane)
- **Erledigt**: Fertig + geprueft
- **Verbesserung**: Prozessverbesserungen aus Retrospektiven (max 1 aktiv)

### Kartentypen (farbcodiert)

| Farbe | Typ | Beispiel |
|-------|-----|----------|
| Weiss | Tagesgeschaeft (Fast Lane) | Termin vereinbaren, Brief versenden |
| Gelb | Kundenfall (Slow Lane) | Neukunde anlegen, Vertrag aendern |
| Rot | DSGVO/Compliance | Loeschfrist pruefen, VVT aktualisieren |
| Gruen | Verbesserung | Neuer Prozessschritt, Checkliste anpassen |
| Blau | Wiederkehrend | Backup pruefen, Wochen-Review |

### Regeln

1. **Taeglich**: Jeder zieht morgens Karten in "Heute" (max 5)
2. **Gelbe/Rote Karten** gehen IMMER durch "Vier-Augen" vor "Erledigt"
3. **Weisse Karten** duerfen direkt nach "Erledigt" (Fast Lane)
4. **Verbesserungs-Spalte**: Max 1 aktive gruene Karte gleichzeitig
5. **Freitag**: Erledigt-Spalte leeren, Wochen-Review (30 Min)
6. **Alle 2 Wochen**: Retrospektive (30 Min) → neue gruene Karte

Recherchiere: Welche einfachen, DSGVO-konformen Tools eignen sich als
Scrumban-Board fuer 2-3 Personen? Physisch (Whiteboard), lokal (Desktop-App),
oder datenschutzkonform gehostet? Vergleiche mit Papier-Loesung.
Suche: "Scrumban Kleinunternehmen", "Scrumban vs Kanban kleine Teams",
"Scrumban Board Tool lokal", "Scrumban Finanzbranche"

Die folgenden Patterns haben sich in einem Ein-Personen-Software-Betrieb
bewaehrt und sollen auf die Finanzbranche uebertragen werden:

### Pattern 1: Zwei Geschwindigkeiten (Fast Lane / Slow Lane)
- **Fast Lane**: Aenderungen ohne Risiko (Tagesgeschaeft, Routineaufgaben)
  → schnell, wenig Kontrolle
- **Slow Lane**: Aenderungen mit Risiko (Kundendaten, Vertraege, Compliance)
  → Review-Pflicht, Vier-Augen-Prinzip

### Pattern 2: Geschuetzte Pfade (Founder Gate)
- Bestimmte Bereiche duerfen nur nach expliziter Freigabe geaendert werden
- Z.B.: Datenschutzerklaerung, Kundenvertraege, Zugriffsrechte, Backup-Prozess

### Pattern 3: Append-Only Event-Log (Manipulationssicher)
- Jede relevante Aktion wird protokolliert (wer, was, wann)
- Log ist nicht loeschbar, nicht aenderbar (Hash-Kette)
- Dient als Nachweis gegenueber Aufsicht und bei Datenschutz-Audits

### Pattern 4: 7-Stufen-Tests (angepasst)
- Nicht Software-Tests, sondern Prozess-Checks:
  Funktioniert der Prozess? Sind die Daten korrekt? Ist die Dokumentation
  aktuell? Ist der Datenschutz eingehalten?

### Pattern 5: Inspect & Adapt (Retrospektive)
- Regelmaessige Ueberpruefung: Was lief gut? Was lief schlecht?
- Prozessanpassung als fester Bestandteil, nicht als Sonderprojekt

### Pattern 6: Tarball-Prinzip (Reproduzierbarkeit)
- Jeder Zustand ist wiederherstellbar
- Dokumentation ist so vollstaendig, dass ein neuer Mitarbeiter
  ohne muendliche Erklaerung starten kann

## Rahmenbedingungen

- **Team**: 2-3 Personen, keine IT-Spezialisten
- **Branche**: Finanzdienstleistung (Versicherung, Finanzberatung, oder aehnlich)
- **Daten**: Kundenstammdaten, Vertragsdaten, Gesundheitsdaten (Art. 9 DSGVO)
- **Budget**: Minimal (Open Source, kostenlose oder guenstige Tools)
- **Keine eigene Software-Entwicklung in Stufe 1** — es wird vorhandene
  Software genutzt, kein VPS, kein eigener Server
- **Stufe 2 (spaeter)**: Eigene Analyse-Tools, eigener Server, Automatisierung

## Ausbaustufen

### Stufe 1: Fundament (Monat 1-3) — NUR vorhandene Tools

In dieser Stufe wird KEINE eigene Software erstellt. Es werden
ausschliesslich vorhandene Tools genutzt (lokal installiert, keine Cloud
fuer Kundendaten). Ziel: Strukturierte Arbeit + DSGVO-Grundschutz.

### Stufe 2: Analyse & Automatisierung (Monat 4-6)

Erste eigene Analyse-Tools (lokal, Desktop), eigener Server fuer
nicht-personenbezogene Daten, Automatisierung von Routineaufgaben.

### Stufe 3: Skalierung (ab Monat 7)

Vollstaendige Infrastruktur, ggf. eigene Software fuer Kundenverwaltung,
automatisierte Compliance-Checks.

---

## Recherche- und Planungsaufgaben

### Kategorie A: Datenschutz-Grundlagen (DSGVO Art. 9)

1. **Verzeichnis von Verarbeitungstaetigkeiten (VVT)**
   - Art. 30 DSGVO: Pflicht fuer JEDES Unternehmen das Gesundheitsdaten
     verarbeitet (keine Ausnahme fuer Kleinunternehmen)
   - Welche kostenlosen VVT-Vorlagen gibt es speziell fuer Finanzberater?
   - Wie detailliert muss das VVT bei 2-3 Personen sein?
   - Suche: "Verzeichnis Verarbeitungstaetigkeiten Vorlage Finanzberater",
     "VVT DSGVO Kleinunternehmen kostenlos", "Art 30 DSGVO Finanzbranche"

2. **Technisch-Organisatorische Massnahmen (TOM)**
   - Art. 32 DSGVO: Angemessene Sicherheit fuer Gesundheitsdaten
   - Welche TOMs sind fuer ein 2-3-Personen-Buero REALISTISCH umsetzbar?
   - Was ist das Minimum das ein Datenschutzauditor akzeptiert?
   - Suche: "TOM DSGVO Kleinunternehmen Finanzbranche", "technisch
     organisatorische Massnahmen kleine Firma", "DSGVO Audit Finanzberater"

3. **Datenschutz-Folgenabschaetzung (DSFA)**
   - Art. 35 DSGVO: Pflicht bei Gesundheitsdaten?
   - Wann ist eine DSFA bei einem Finanzberater mit 2-3 Personen
     tatsaechlich erforderlich?
   - Suche: "DSFA Pflicht Gesundheitsdaten Finanzberater",
     "Datenschutzfolgenabschaetzung Kleinunternehmen", "Art 35 DSGVO
     Blacklist Aufsichtsbehoerde"

4. **Externer Datenschutzbeauftragter**
   - Ab wann Pflicht? (in der Regel ab 20 Personen, ABER: bei
     Kerntaetigkeit mit besonderen Kategorien ggf. frueher)
   - Was kostet ein externer DSB fuer ein Kleinunternehmen?
   - Suche: "externer Datenschutzbeauftragter Kosten Kleinunternehmen",
     "DSB Pflicht Gesundheitsdaten unter 20 Mitarbeiter", "DSB
     Finanzberater Pflicht"

### Kategorie B: Tool-Auswahl Stufe 1 (lokal, keine Cloud fuer Kundendaten)

5. **Kundenverwaltung / CRM (lokal, DSGVO-konform)**
   - Welche lokalen CRM-Tools gibt es die KEINE Cloud brauchen?
   - Anforderung: Verschluesselung, Zugriffskontrolle, Loeschkonzept
   - Suche: "CRM Software lokal installiert DSGVO", "Kundenverwaltung
     ohne Cloud Finanzberater", "offline CRM open source"

6. **Dokumentenmanagement (DMS) fuer Vertraege und Gesundheitsdaten**
   - Lokal, verschluesselt, versioniert, mit Zugriffsprotokoll
   - Suche: "DMS lokal installiert DSGVO Gesundheitsdaten",
     "Dokumentenmanagement open source verschluesselt", "Vertraege
     verwalten Software lokal"

7. **Verschluesselte Kommunikation**
   - Kunden schicken Gesundheitsdaten per Email? → Problem!
   - Alternativen: Verschluesseltes Portal, Signal, Threema Work, Cryptshare
   - Was ist fuer Endkunden zumutbar?
   - Suche: "verschluesselte Kommunikation Kunden Finanzberater DSGVO",
     "sichere Datenuebertragung Gesundheitsdaten", "Alternative zu Email
     Kundendaten"

8. **Aufgaben- und Projektmanagement (lokal)**
   - Kanban-Board / Task-Tracking fuer 2-3 Personen
   - Anforderung: Lokal oder self-hosted, keine Kundendaten in der Cloud
   - Suche: "Kanban Board lokal installiert", "Projektmanagement offline
     Kleinunternehmen", "Aufgabenverwaltung self-hosted open source"

9. **Backup und Disaster Recovery**
   - Verschluesselte Backups, getestet, dokumentiert
   - 3-2-1-Regel fuer ein kleines Buero realistisch umsetzen
   - Suche: "Backup Strategie Kleinunternehmen DSGVO", "verschluesseltes
     Backup Gesundheitsdaten", "3-2-1 Backup kleine Firma"

10. **Analyse-Software fuer Kundendaten (Stufe 1: bestehende Tools)**
    - Excel/LibreOffice Calc mit Makros? Zu unsicher fuer Gesundheitsdaten?
    - Python lokal (Jupyter Notebook) mit verschluesselter DB?
    - R Studio fuer statistische Auswertungen?
    - Anforderung: Daten verlassen nie den Rechner, Ergebnisse anonymisiert
    - Suche: "Datenanalyse Gesundheitsdaten lokal DSGVO", "Python
      Kundendaten Analyse verschluesselt", "LibreOffice Makros
      Datenschutz Risiko"

### Kategorie C: Prozessaufbau (Inspect & Adapt)

11. **Sprint-Rhythmus fuer Nicht-IT-Teams**
    - 1-Wochen oder 2-Wochen-Zyklen fuer ein Finanzberatungsteam?
    - Was ist ein "Sprint" in der Finanzberatung? (Nicht: Features bauen,
      sondern: Kundenfaelle bearbeiten, Prozesse verbessern)
    - Suche: "agile Methoden Finanzbranche", "Scrum fuer Nicht-IT-Teams",
      "Inspect Adapt Kleinunternehmen", "Kanban Finanzberatung"

12. **Review-Stufen (angepasst aus Code-Fabrik)**

    | Code-Fabrik Pattern | Uebertragung Finanzbranche |
    |---------------------|---------------------------|
    | Fast Lane (Auto-Merge) | Routineaufgaben: Terminvereinbarung, Standard-Korrespondenz → kein Vier-Augen |
    | Slow Lane (Founder Gate) | Vertragsaenderungen, Gesundheitsdaten-Verarbeitung, neue Kunden anlegen → Vier-Augen-Prinzip |
    | Smoke-Test | Checkliste vor Vertragsabschluss: Alle Unterlagen da? DSGVO-Einwilligung vorhanden? |
    | Deep-Smoke | Quartals-Audit: Stichprobe Kundendaten, Loeschfristen eingehalten? Berechtigungen aktuell? |

    - Wie granular muessen Review-Stufen bei 2-3 Personen sein?
    - Ab welcher Teamgroesse lohnt sich Vier-Augen wirklich?
    - Suche: "Vier-Augen-Prinzip Kleinunternehmen praktikabel",
      "Qualitaetssicherung kleines Team Finanzberatung"

13. **Retrospektive (Inspect & Adapt Zyklus)**
    - Frequenz: Woechentlich (15 Min) oder monatlich (60 Min)?
    - Format: Was funktioniert fuer 2-3 Personen ohne Moderator?
    - Ergebnis: Maximal 1-2 Verbesserungsmassnahmen pro Zyklus
    - Wie stellt man sicher dass Massnahmen umgesetzt werden?
    - Suche: "Retrospektive kleines Team ohne Scrum Master",
      "Inspect Adapt Praxis Kleinunternehmen", "kontinuierliche
      Verbesserung KVP 2-3 Personen"

14. **Checklisten als "Tests" (Prozess-Qualitaetssicherung)**

    Analogie zu Software-Tests:

    | Software-Test | Prozess-Aequivalent |
    |---------------|---------------------|
    | Unit-Test | Einzelpruefung: Ist die DSGVO-Einwilligung unterschrieben? |
    | Integration-Test | Prozess-Check: Laeuft der Onboarding-Prozess komplett durch? |
    | Migrations-Test | Aenderungs-Check: Funktioniert der neue Prozess mit Altdaten? |
    | Ketten-Test | Quartals-Audit: Stimmen alle Schritte noch ueberein? |
    | Replay-Test | Kann ein neuer Mitarbeiter den Prozess ohne muendliche Anleitung durchfuehren? |
    | Integritaets-Test | Stichprobe: Wurden Loeschfristen eingehalten? Berechtigungen aktuell? |
    | Smoke-Test | Taeglich: Laeuft alles? Backup gelaufen? Kalender synchron? |

    - Welche Checklisten sind fuer einen Finanzberater PFLICHT?
    - Suche: "Checkliste Compliance Finanzberater", "Qualitaetsmanagement
      Checklisten Kleinunternehmen", "IDD Dokumentation Checkliste"

### Kategorie D: Datensicherheit im Alltag

15. **Endgeraete-Sicherheit (2-3 Arbeitsplaetze)**
    - Festplattenverschluesselung (BitLocker/LUKS) — Pflicht bei
      Gesundheitsdaten?
    - Passwort-Manager fuer das Team (KeePass, Bitwarden self-hosted?)
    - 2-Faktor-Authentifizierung fuer alle Dienste
    - Suche: "Endgeraete Sicherheit Finanzberater DSGVO", "BitLocker
      Pflicht Gesundheitsdaten", "Passwort Manager Kleinunternehmen"

16. **Zugriffskonzept (wer darf was sehen?)**
    - Bei 2-3 Personen: Braucht man wirklich ein Rollenkonzept?
    - Minimum: Nicht jeder sieht alles (Praktikant ≠ Inhaber)
    - Protokollierung: Wer hat wann auf welche Akte zugegriffen?
    - Suche: "Berechtigungskonzept Kleinunternehmen DSGVO",
      "Zugriffsprotokoll Gesundheitsdaten", "Need-to-Know
      Finanzberatung"

17. **Loeschkonzept (Art. 17 DSGVO)**
    - Wann muessen Kundendaten geloescht werden?
    - Aufbewahrungsfristen Finanzbranche vs. Loeschpflicht DSGVO
    - Konflikt: Handelsrecht (10 Jahre) vs. DSGVO (so kurz wie moeglich)
    - Wie automatisiert man Loeschfristen mit einfachen Mitteln?
    - Suche: "Loeschkonzept DSGVO Finanzberater", "Aufbewahrungsfristen
      Versicherungsvermittler", "automatische Loeschfristen Software"

### Kategorie E: Protokollierung und Nachweisbarkeit

18. **Audit-Trail (analog Event-Log)**
    - Jede Aenderung an Kundendaten protokollieren (wer, was, wann)
    - Bei 2-3 Personen: Reicht ein Excel/Logbuch oder braucht man Software?
    - Manipulationssicherheit: Hash-Kette realistisch fuer Nicht-IT?
    - Suche: "Audit Trail DSGVO Kleinunternehmen", "Aenderungsprotokoll
      Kundendaten Finanzberater", "manipulationssichere Dokumentation
      einfach"

19. **Datenschutz-Vorfaelle dokumentieren (Art. 33 DSGVO)**
    - 72-Stunden-Meldefrist — wie stellt man sicher dass das klappt?
    - Vorfall-Template: Was muss dokumentiert werden?
    - Suche: "Datenschutzvorfall melden Vorlage", "Art 33 DSGVO
      Meldepflicht Finanzberater", "Data Breach Notification Template
      deutsch"

20. **Nachweis der Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO)**
    - Der Verantwortliche muss NACHWEISEN koennen dass er DSGVO einhält
    - Welche Dokumente/Nachweise braucht ein Finanzberater konkret?
    - Suche: "Rechenschaftspflicht DSGVO Nachweis Finanzberater",
      "Accountability DSGVO Kleinunternehmen", "DSGVO Dokumentation
      Pflicht Finanzbranche"

### Kategorie F: Selbstverbesserungs-Mechanismus

21. **Metriken fuer Prozessqualitaet (ohne IT-Overhead)**
    - Was misst ein 2-3-Personen-Team realistisch?
    - Vorschlag: 3-5 einfache Kennzahlen pro Monat
      - Anzahl offener Kundenfaelle (Durchlaufzeit?)
      - Anzahl Datenschutz-Checklisten ausgefuellt vs. vergessen
      - Anzahl Review-Schleifen (Vier-Augen) durchgefuehrt
      - Backup-Erfolgsrate
      - Kundenzufriedenheit (1 Frage nach Abschluss)
    - Suche: "KPI Finanzberatung Kleinunternehmen", "Kennzahlen
      Qualitaetsmanagement kleine Firma", "Prozessmetriken ohne
      Overhead"

22. **Verbesserungs-Backlog (analog Kanban-Board)**
    - Jede Retrospektive erzeugt 1-2 Verbesserungsideen
    - Diese werden priorisiert (MoSCoW oder einfacher: Machen/Spaeter/Nie)
    - Pro Sprint wird MAXIMAL 1 Verbesserung umgesetzt
    - Suche: "kontinuierliche Verbesserung Backlog Kleinunternehmen",
      "KVP kleines Team praktisch", "Verbesserungsvorschlaege umsetzen
      2-3 Personen"

23. **Eskalationsstufen (wann wird es ernst?)**
    - Stufe 1: Prozess-Abweichung → naechste Retrospektive besprechen
    - Stufe 2: DSGVO-Risiko identifiziert → sofort handeln (max. 48h)
    - Stufe 3: Datenschutzvorfall → 72h Meldepflicht, Notfallplan
    - Suche: "Eskalationsstufen Datenschutz Kleinunternehmen",
      "Notfallplan DSGVO Finanzberater", "Incident Response Plan
      kleine Firma"

### Kategorie G: Uebergang zu Stufe 2 (Kriterien)

24. **Wann ist das Team bereit fuer eigene Software/Server?**
    - Voraussetzungen:
      - VVT ist vollstaendig und aktuell
      - TOMs sind dokumentiert und gelebt (nicht nur auf Papier)
      - Mindestens 3 Retrospektiven durchgefuehrt mit messbaren
        Verbesserungen
      - Backup-Prozess funktioniert zuverlaessig (3 Monate Track Record)
      - Loeschkonzept ist implementiert
      - Team kann Datenschutzvorfall-Prozess im Schlaf
    - Suche: "Reifegradmodell Datenschutz Kleinunternehmen",
      "DSGVO Readiness Assessment", "Datenschutz Maturity Model
      KMU"

---

## Output-Format

### Fuer JEDE Aufgabe (1-24):

1. **Ist-Zustand typisches Kleinunternehmen** (was machen die meisten
   NICHT, obwohl sie muessten?)
2. **Gesetzliche Pflicht oder Best Practice?** (Muss/Soll/Kann)
3. **Konkrete Tool-/Vorlagen-Empfehlung** (Name, kostenlos/Preis,
   lokal/Cloud)
4. **Aufwand fuer Ersteinrichtung** (Stunden)
5. **Laufender Aufwand** (Minuten pro Woche)
6. **Risiko bei Nicht-Umsetzung** (Bussgeld, Reputationsschaden,
   Datenverlust)
7. **Passt zu Stufe 1?** (Ja/Nein, wenn Nein: welche Stufe?)

### Ergebnis-Tabellen

#### Pflicht-Matrix
| # | Massnahme | Pflicht? | Stufe | Aufwand Setup | Aufwand/Woche | Bussgeld-Risiko |

#### 30-Tage-Startplan (Stufe 1)
| Woche | Massnahme | Verantwortlich | Erledigt? | Review durch |

#### Tool-Empfehlungen (Stufe 1)
| Bereich | Tool | Kosten | Lokal/Cloud | DSGVO-konform? |

#### Inspect-&-Adapt-Kalender
| Frequenz | Aktivitaet | Dauer | Teilnehmer | Output |
| Taeglich | Stand-up (was steht an, was blockiert) | 10 Min | Alle | — |
| Woechentlich | Review offene Faelle + Checklisten | 30 Min | Alle | Statusliste |
| 2-Woechentlich | Retrospektive (was verbessern) | 30 Min | Alle | 1-2 Massnahmen |
| Monatlich | Metriken-Review + Backlog-Priorisierung | 60 Min | Alle | Dashboard |
| Quartalsweise | Deep-Audit (Stichprobe Datenschutz) | 2 Std | Inhaber + ggf. DSB | Audit-Bericht |

### Checklisten-Vorlagen

Erstelle konkrete, sofort nutzbare Checklisten fuer:
1. **Neukunden-Onboarding** (DSGVO-Einwilligung, Datenerfassung,
   Vertrag, Zugriffsrechte)
2. **Taeglich** (Backup, offene Aufgaben, Fristen)
3. **Woechentlich** (Review, ausstehende Unterschriften, Loeschfristen)
4. **Quartals-Audit** (Stichprobe 5 Kundendaten, Berechtigungen,
   Loeschfristen, TOMs)

### Uebergangs-Checkliste Stufe 1 → Stufe 2
- [ ] VVT vollstaendig
- [ ] TOMs dokumentiert UND gelebt
- [ ] 3+ Retrospektiven mit Ergebnissen
- [ ] Backup 3 Monate zuverlaessig
- [ ] Loeschkonzept implementiert
- [ ] Notfallplan getestet
- [ ] Alle Mitarbeiter geschult

---

## Wichtige Hinweise fuer den Reviewer

- **DSGVO ist kein Projekt, sondern ein laufender Prozess** — der Prompt
  muss das widerspiegeln (Inspect & Adapt, nicht "einmal einrichten und
  vergessen")
- **Gesundheitsdaten sind BESONDERE KATEGORIEN** (Art. 9 DSGVO) — das
  erfordert hoehere Schutzstandards als normale Kundendaten
- **Finanzbranche hat ZUSAETZLICHE Regulierung** (IDD, MiFID II,
  GwG, KWG je nach Taetigkeitsfeld) — bitte identifizieren was
  relevant ist
- **Pragmatismus vor Perfektion** — ein 2-3-Personen-Team kann nicht
  ISO 27001 implementieren, aber es kann die DSGVO-Pflichten erfuellen
- **Kein Cloud-Zwang** — die Kundendaten muessen lokal bleiben, Cloud
  nur fuer nicht-personenbezogene Daten (z.B. anonymisierte Auswertungen)
- **Brutale Ehrlichkeit**: Was davon ist realistisch fuer ein kleines
  Team ohne IT-Hintergrund? Was ist Wunschdenken?
