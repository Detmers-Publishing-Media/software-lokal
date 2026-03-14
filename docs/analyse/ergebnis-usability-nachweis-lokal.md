# Usability-Analyse: Nachweis Lokal v0.4.0

**Datum:** 2026-03-14
**Reviewer:** Unabhaengiger UX-Review (B2B-Desktop-Software)
**Gegenstand:** Desktop-App "Nachweis Lokal" fuer Pruefungsdokumentation

---

## 1. Mitbewerber-Analyse

### 1.1 Uebersicht Wettbewerber

| Anbieter | Typ | Preis | Ersteinrichtung | Navigation | Wiedereinstieg |
|---|---|---|---|---|---|
| **Nachweis Lokal** | Desktop (Electron) | 39 EUR/Jahr | 4-Schritte-Wizard | Workflow-Sidebar | Dashboard + Ampel |
| **Wartungsplaner (Hoppe)** | Desktop (Windows) | 195 EUR einmalig | Kein Wizard, manuelle Einrichtung | Klassisches Windows-Menue | Kalender + E-Mail-Erinnerung |
| **SafetyCulture (iAuditor)** | Cloud + Mobile | ab 24 USD/Monat/User | Gefuehrtes Onboarding, Template-Bibliothek | Mobile-first, Tab-Navigation | Startseite konfigurierbar |
| **Lumiform** | Cloud + App | ab 16 EUR/Monat/User | 14-Tage-Trial, Vorlagen-Browser | Web-Dashboard, linke Sidebar | Dashboard mit offenen Aufgaben |
| **firstaudit** | Cloud + App | auf Anfrage (gewerblich) | Drag-and-Drop-Designer | Web-Backend + Mobile-App | Echtzeit-Dashboard, KPIs |
| **GoAudits** | Cloud + Mobile | ab 10 USD/Monat/User | Kostenlose Checklisten-Einrichtung durch Team | Tab-basiert, mobil-optimiert | Branded Reports, Trend-Analyse |
| **Checkbuster** | Cloud + Mobile | ab 25 EUR/Monat/User | Vorlagen-Import, Templates | App-zentriert | Aufgaben-Management |
| **Fluix** | Cloud + Mobile | ab 20 USD/Monat/User | 14-Tage-Trial | Workflow-basiert | Task-Scheduling, Versionskontrolle |
| **Checkware** | Cloud + Mobile | auf Anfrage | Designer fuer eigene Formulare | Plattformunabhaengig, Web | Workflow-Weiterleitung |

### 1.2 Detailbewertung der wichtigsten Wettbewerber

**Wartungsplaner (Hoppe Unternehmensberatung)** — Der direkteste Vergleich

Der Wartungsplaner ist der einzige echte Desktop-Konkurrent im deutschsprachigen Raum. Die Software richtet sich an Betriebe mit Pruefpflichten und bietet Kalenderansicht, automatische E-Mail-Erinnerungen und ein Dashboard mit ueberfaelligen Aufgaben. Die Oberflaeche wirkt allerdings wie eine klassische Windows-Anwendung aus den 2010er-Jahren: dichte Menues, kleine Schrift, viele Tabellen. Es gibt keinen Einrichtungsassistenten — der Nutzer muss sich durch Handbuch-PDFs arbeiten. Die Begriffssprache ist technisch: "Betriebsmittel", "Pruefobjekte", "Inventar". Der Preis von 195 EUR einmalig (ohne Updates) ist hoeher als Nachweis Lokal, bietet dafuer aber keine laufenden Kosten. Die Staerke liegt in der DIN-EN-ISO-9001-Konformitaet und der Marktpraesenz. Die Schwaeche: fuer Gelegenheitsnutzer wie Hausmeister oder Vereinsvorsitzende ist die Software zu komplex und nicht selbsterklaerend.

**SafetyCulture (iAuditor)** — Der Marktfuehrer

SafetyCulture dominiert den internationalen Markt mit ueber 50.000 taeglichen Nutzungen in 85 Laendern. Die Staerke liegt im Onboarding: direkt nach der Anmeldung wird ein erster Inspektionsbogen erstellt — per KI-gestuetztem Builder, Dokument-Upload oder Template-Bibliothek. Die Startseite ist konfigurierbar (anstehende Termine, Inspektionen oder Vorlagen). Die Benennung verwendet "Inspections", "Templates", "Actions" — international verstaendlich, aber fuer die deutsche Zielgruppe abstrakt. Der Preis ab 24 USD/Monat/User macht es fuer Einzelnutzer in kleinen Organisationen unattraktiv (288 USD/Jahr vs. 39 EUR/Jahr). Die Schwaeche fuer die Nachweis-Lokal-Zielgruppe: Cloud-Pflicht, englische Oberflaeche, auf Teams ausgelegt.

**Lumiform** — Der staerkste Feature-Vergleich

Lumiform bietet eine umfangreiche Vorlagen-Bibliothek, Offline-Faehigkeit und die Moeglichkeit, unfertige Formulare als Entwurf zu speichern. Die Navigation verwendet eine linke Sidebar mit Dashboard, Vorlagen, Inspektionen und Aktionen. Der Begriff "Inspektion" statt "Pruefung" ist international, aber im deutschsprachigen Raum weniger gaengig als "Pruefung" oder "Checkliste". Der Preis ab 16 EUR/Monat/User (ca. 192 EUR/Jahr) ist deutlich teurer als Nachweis Lokal, allerdings unbegrenzte Vorlagen sind kostenlos nutzbar. 50% Rabatt fuer gemeinnuetzige Organisationen ist ein interessantes Detail. Die Schwaeche: Cloud-basiert, kein echter Offline-Desktop-Modus, auf Mobile optimiert.

**GoAudits** — Bestes Onboarding im Vergleich

GoAudits sticht durch kostenlosen Setup-Service hervor: Das Team digitalisiert bestehende Papier-Checklisten fuer den Kunden. Nutzer berichten, dass neue Mitarbeiter in Minuten eingearbeitet werden koennen. Der Preis ab 10 USD/Monat/User ist fuer SaaS-Verhaeltnisse guenstig. Die 60-Tage-Geld-zurueck-Garantie senkt die Einstiegshuerde. Fuer Nachweis Lokal relevant: GoAudits beweist, dass gutes Onboarding ein entscheidender Wettbewerbsvorteil ist.

### 1.3 Begriffswahl im Wettbewerbervergleich

| Begriff | Verwendet von | Zielgruppen-Verstaendlichkeit |
|---|---|---|
| Pruefung | Hoppe, DGUV-Kontext | Hoch — gaengiger deutscher Fachbegriff |
| Inspektion | Lumiform, SafetyCulture (DE) | Mittel — eher behoerdlich/technisch |
| Audit | firstaudit, SafetyCulture | Niedrig — klingt nach Wirtschaftspruefer |
| Checkliste | Checkware, Checkbuster | Sehr hoch — jeder versteht es sofort |
| Nachweis | Nachweis Lokal | Hoch — ergebnisorientiert, greifbar |

**Fazit Benennung:** "Pruefung" und "Checkliste" sind die verstaendlichsten Begriffe fuer die Zielgruppe. "Nachweis" als Produktname ist stark, weil er das Ergebnis betont — nicht den Prozess. Die interne Nutzung von "Pruefung" ist korrekt und zielgruppengerecht.

---

## 2. Ersteinrichtung (First-Run-Wizard) — Detailanalyse

### 2.1 Bewertung des aktuellen 4-Schritte-Wizards

**Schritt 1: Organisation** — Sinnvoll, aber zu frueh fuer den emotionalen Einstieg. Der Nutzer oeffnet die App zum ersten Mal und soll sofort Adressdaten eingeben. Das fuehlt sich nach Buerokratie an, nicht nach Nutzen. Die meisten Wettbewerber zeigen zuerst, was die App kann.

**Schritt 2: Pruefer anlegen** — Begrifflich korrekt, aber fuer Einzelnutzer verwirrend. Ein Hausmeister, der selbst prueft, fragt sich: "Muss ich mich als Pruefer anlegen? Warum?" Der Begriff "Qualifikation" kann abschrecken.

**Schritt 3: Vorlagen auswaehlen** — Der staerkste Schritt. 15 fertige Vorlagen geben sofort einen Aha-Moment: "Brandschutz, Spielgeraete — das brauche ich ja!" Dieser Schritt sollte frueher kommen.

**Schritt 4: Erstes Objekt anlegen** — Logisch, aber ohne Kontext. Was ist ein "Objekt"? Ein Geraet? Ein Raum? Ein Gebaeude? Der Begriff ist zu abstrakt.

### 2.2 Vergleich mit Wettbewerbern

SafetyCulture zeigt sofort nach der Anmeldung den Template-Browser und laesst den Nutzer direkt eine erste Inspektion starten. GoAudits bietet an, bestehende Papier-Checklisten zu digitalisieren. Lumiform stellt unbegrenzt Vorlagen bereit, die sofort nutzbar sind. Der gemeinsame Nenner: **Erfolg zuerst, Verwaltung spaeter**.

### 2.3 Hauptprobleme

1. **Kein Willkommens-Moment**: Es fehlt ein kurzer Satz, der erklaert, was die App macht und warum sie hilft.
2. **Verwaltung vor Nutzen**: Organisation und Pruefer sind Verwaltungsaufgaben. Der Nutzer will aber zuerst sehen, dass die App sein Problem loest.
3. **Abstrakte Begriffe**: "Objekt" und "Pruefer" sind intern logisch, aber nicht selbsterklaerend.
4. **Fehlende Verbindung zum Workflow**: Nach dem Wizard ist unklar, was der naechste Schritt ist.

### 2.4 Konkreter Verbesserungsvorschlag

```
VORHER (aktuell):                    NACHHER (Empfehlung):

Schritt 1: Organisation              Schritt 1: Willkommen
Schritt 2: Pruefer                   "Nachweis Lokal dokumentiert Ihre
Schritt 3: Vorlagen                   Pruefungen — rechtssicher, ohne
Schritt 4: Objekt                     Cloud, direkt auf Ihrem Rechner."
                                      [Weiter]

                                     Schritt 2: Was pruefen Sie?
                                      15 Vorlagen als Kacheln:
                                      [x] Brandschutz
                                      [x] Spielgeraete
                                      [ ] Elektro
                                      [ ] Leitern & Tritte
                                      ...
                                      "Sie koennen spaeter weitere
                                       hinzufuegen."
                                      [Weiter]

                                     Schritt 3: Wo pruefen Sie?
                                      "Geben Sie Ihr erstes Geraet,
                                       Ihren ersten Raum oder Ihre
                                       erste Anlage ein."
                                      Bezeichnung: [Feuerloescher EG ]
                                      Standort:    [Erdgeschoss Flur ]
                                      "Weitere koennen Sie jederzeit
                                       hinzufuegen."
                                      [Weiter]

                                     Schritt 4: Ihre Daten (optional)
                                      "Fuer den Briefkopf auf Ihren
                                       Pruefprotokollen:"
                                      Organisation: [          ]
                                      Ihr Name:     [          ]
                                      [Ueberspringen] [Fertig]

                                     → Dashboard mit Hinweis:
                                      "Ihre erste Pruefung wartet!
                                       Klicken Sie auf 'Pruefungen',
                                       um zu starten."
```

**Wesentliche Aenderungen:**
- Willkommens-Schritt statt kaltem Formular-Start
- Vorlagen zuerst (Aha-Moment: "Das ist relevant fuer mich")
- "Objekt" ersetzt durch kontextuelle Frage "Wo pruefen Sie?"
- Organisationsdaten optional und am Ende
- Pruefer-Anlage komplett aus dem Wizard entfernt (wird beim ersten Pruefvorgang abgefragt)
- Nach dem Wizard: klarer Call-to-Action auf dem Dashboard

---

## 3. Navigation und Benennung — Detailanalyse

### 3.1 Bewertung der aktuellen Sidebar

```
Dashboard                    ← Gut, universell verstaendlich
─────────────────
VORBEREITEN                  ← Zu abstrakt fuer Gelegenheitsnutzer
  Vorlagen                   ← Fachbegriff, nicht sofort klar
  Objekte                    ← Zu generisch, was ist ein "Objekt"?
─────────────────
PRUEFEN                      ← Gut, handlungsorientiert
  Pruefungen                 ← Klar und verstaendlich
─────────────────
NACHVERFOLGEN                ← Gut, aber selten genutzter Bereich
  Maengel                    ← Klar und verstaendlich
─────────────────
  Einstellungen              ← Standard
  Support                    ← Gut, niedrigschwellig
```

### 3.2 Problemanalyse

**Gruppenheader "VORBEREITEN / PRUEFEN / NACHVERFOLGEN":** Die Workflow-Logik ist konzeptionell sauber, aber fuer Gelegenheitsnutzer zu abstrakt. Ein Hausmeister, der nach 3 Monaten die App oeffnet, denkt nicht in Workflow-Phasen. Er denkt: "Ich muss den Feuerloescher pruefen" oder "Was steht als naechstes an?" Die Header erzwingen ein mentales Modell, das der Nutzer erst lernen muss.

**"Vorlagen":** Der Begriff suggeriert etwas Vorgefertigtes zum Ausfuellen — das ist korrekt, aber nicht intuitiv. Wettbewerber verwenden "Checklisten" (Checkware, Lumiform) oder "Templates" (SafetyCulture). "Checklisten" waere fuer die Zielgruppe sofort verstaendlich.

**"Objekte":** Der abstrakteste Begriff in der Navigation. Ein Hausmeister denkt in "Geraeten", "Raeumen" oder "Anlagen" — nicht in "Objekten". SafetyCulture verwendet "Assets", Hoppe verwendet "Betriebsmittel" oder "Inventar". Fuer die deutsche Zielgruppe waere "Geraete & Raeume" konkreter.

### 3.3 Vergleich mit Wettbewerbern

| App | Hauptnavigation |
|---|---|
| SafetyCulture | Home, Inspections, Templates, Actions, Schedule |
| Lumiform | Dashboard, Vorlagen, Inspektionen, Aktionen, Standorte |
| Hoppe Wartungsplaner | Erfassen, Planen, Auswerten, Stammdaten |
| GoAudits | Dashboard, Audits, Templates, Issues, Reports |
| Nachweis Lokal | Dashboard, Vorlagen, Objekte, Pruefungen, Maengel |

**Auffaellig:** Kein Wettbewerber verwendet Gruppenheader mit Workflow-Phasen. Alle setzen auf flache Listen mit selbsterklaerenden Begriffen. Die Gruppenheader in Nachweis Lokal sind ein Alleinstellungsmerkmal, das aber die Einstiegshuerde erhoeht.

### 3.4 Konkreter Verbesserungsvorschlag

```
VORHER:                          NACHHER (Empfehlung A):

Dashboard                        Dashboard
─────────────                    ─────────────
VORBEREITEN                      Checklisten
  Vorlagen                       Geraete & Raeume
  Objekte                        Pruefungen
─────────────                    Maengel
PRUEFEN                          ─────────────
  Pruefungen                     Einstellungen
─────────────                    Hilfe
NACHVERFOLGEN
  Maengel
─────────────
  Einstellungen
  Support


                                 NACHHER (Empfehlung B — Kompromiss):

                                 Dashboard
                                 ─────────────
                                 EINRICHTEN
                                   Checklisten
                                   Geraete & Raeume
                                 ─────────────
                                 DURCHFUEHREN
                                   Pruefungen
                                   Maengel
                                 ─────────────
                                   Einstellungen
                                   Hilfe
```

**Empfehlung A** (bevorzugt): Flache Liste ohne Gruppenheader. Weniger kognitiver Aufwand, schnellerer Zugriff. Der Workflow ergibt sich aus der Reihenfolge der Eintraege.

**Empfehlung B** (Kompromiss): Gruppenheader beibehalten, aber mit alltagsnaeheren Begriffen. "EINRICHTEN" statt "VORBEREITEN" ist handlungsnaeher. "DURCHFUEHREN" statt "PRUEFEN" und "NACHVERFOLGEN" zusammengefasst, weil Maengel direkt aus Pruefungen entstehen.

**Kernpunkt beider Empfehlungen:**
- "Vorlagen" → "Checklisten" (hoechste Verstaendlichkeit laut Wettbewerbervergleich)
- "Objekte" → "Geraete & Raeume" (konkret statt abstrakt)
- "Support" → "Hilfe" (kuerzerer, gebraeuchlicherer Begriff)

---

## 4. Wiedereinstieg nach Wochen/Monaten

### 4.1 Bewertung des aktuellen Zustands

Das Dashboard von Nachweis Lokal bietet bereits gute Grundlagen:
- Faelligkeits-Ampel (gruen/gelb/rot)
- Statistiken zu offenen und abgeschlossenen Pruefungen
- Warnbanner fuer ueberfaellige Pruefungen
- Offene Maengel auf einen Blick

Das ist solide und besser als bei Hoppe (reine Tabellenansicht) oder Checkware (kein zentrales Dashboard). Aber es gibt Luecken.

### 4.2 Identifizierte Schwaechen

**Problem 1: Kein konkreter Handlungsaufruf.** Die Ampel zeigt "3 Pruefungen ueberfaellig", aber der Nutzer muss selbst herausfinden, welche das sind und wie er dorthin navigiert. SafetyCulture zeigt auf der Startseite direkt die naechsten anstehenden Aufgaben als klickbare Liste.

**Problem 2: Kein "Zuletzt bearbeitet"-Bereich.** Nach 3 Monaten Pause will der Nutzer wissen: "Wo war ich stehen geblieben?" Eine Liste der letzten 3-5 Aktivitaeten (letzte Pruefung, letzter Mangel, letzte Aenderung) fehlt.

**Problem 3: Kein kontextueller Hinweis.** Wenn ein Nutzer die App nach langer Pause oeffnet, waere ein sanfter Hinweis hilfreich: "Sie haben 3 ueberfaellige Pruefungen. Die dringendste: Feuerloescher EG (faellig seit 14 Tagen)."

**Problem 4: Der Workflow ist nicht sichtbar.** Der Dreiklang Vorlage → Objekt → Pruefung ist nirgends erklaert. Ein Gelegenheitsnutzer muss sich das Modell jedes Mal neu erarbeiten.

### 4.3 Was die Wettbewerber besser machen

- **SafetyCulture:** Startseite zeigt die naechsten anstehenden Inspektionen als klickbare Karten. Ein Klick startet die Inspektion direkt. Kein Umweg ueber Navigation.
- **Lumiform:** Dashboard mit "Offene Aufgaben" als erste Ansicht. Rote Badges an ueberfaelligen Items.
- **GoAudits:** Historische Trend-Analyse zeigt, ob sich die Qualitaet verbessert oder verschlechtert — motiviert zur Weiterarbeit.
- **Hoppe:** Automatische E-Mail-Erinnerungen (bei Nachweis Lokal als Desktop-App nicht moeglich, aber System-Benachrichtigungen waeren denkbar).

### 4.4 Konkreter Verbesserungsvorschlag

```
DASHBOARD — Empfohlene Struktur:

+--------------------------------------------------+
|  NACHWEIS LOKAL — Dashboard                       |
+--------------------------------------------------+
|                                                    |
|  !! 3 Pruefungen ueberfaellig                     |
|  +----------------------------------------------+ |
|  | Feuerloescher EG    | faellig seit 14 Tagen  | |
|  | Elektropruefung B1  | faellig seit 7 Tagen   | |
|  | Notbeleuchtung      | faellig seit 3 Tagen   | |
|  +----------------------------------------------+ |
|  [Jetzt pruefen →]                                |
|                                                    |
|  Naechste Pruefungen                               |
|  +----------------------------------------------+ |
|  | Spielgeraete Hof    | in 12 Tagen            | |
|  | Leitern Werkstatt   | in 28 Tagen            | |
|  +----------------------------------------------+ |
|                                                    |
|  Offene Maengel: 2                                 |
|  +----------------------------------------------+ |
|  | Feuerloescher Keller - Druck zu niedrig       | |
|  | Notausgang Sued - Schild fehlt                | |
|  +----------------------------------------------+ |
|                                                    |
|  Zuletzt bearbeitet                                |
|  +----------------------------------------------+ |
|  | Brandschutz Halle — abgeschlossen 12.12.2025 | |
|  | Spielgeraete Hof — abgeschlossen 15.11.2025  | |
|  +----------------------------------------------+ |
|                                                    |
|  Statistik: 12 Pruefungen 2025 | 2 Maengel offen  |
+--------------------------------------------------+
```

**Kernprinzip:** Das Dashboard beantwortet drei Fragen in unter 10 Sekunden:
1. **Was ist dringend?** (Ueberfaellige Pruefungen, rot hervorgehoben)
2. **Was kommt als naechstes?** (Naechste Faelligkeiten)
3. **Was war zuletzt?** (Letzte Aktivitaeten als Orientierung)

Der Button "Jetzt pruefen" fuehrt direkt zur dringendsten Pruefung — kein Umweg ueber Navigation.

---

## 5. Gesamtbewertung

### 5.1 Usability-Scores

| Kriterium | Score (1-10) | Begruendung |
|---|---|---|
| **Ersteinrichtung** | 6/10 | Wizard vorhanden (besser als Hoppe), aber Reihenfolge und Begriffe suboptimal |
| **Navigation** | 6/10 | Workflow-Logik ist durchdacht, aber Gruppenheader und Begriffe zu abstrakt |
| **Benennung** | 5/10 | "Pruefung" und "Maengel" sind gut, "Objekte" und "Vorlagen" sind Schwachstellen |
| **Wiedereinstieg** | 7/10 | Ampel und Warnbanner sind solide, aber es fehlt der konkrete Handlungsaufruf |
| **Gesamteindruck** | 7/10 | Funktional vollstaendig, Workflow-Abdeckung besser als die meisten Wettbewerber, Usability-Feinschliff noetig |

### 5.2 Top 3 Staerken gegenueber Wettbewerbern

1. **Preis-Leistungs-Verhaeltnis:** 39 EUR/Jahr vs. 192-300 EUR/Jahr bei Cloud-Wettbewerbern. Fuer Vereine und Kleinbetriebe ist das ein entscheidender Vorteil. Hoppe ist mit 195 EUR einmalig preislich vergleichbar, bietet aber keine Vorlagen-Bibliothek und keinen modernen Wizard.

2. **Datensouveraenitaet ohne Kompromisse:** Kein Cloud-Konto, kein Login, keine Daten auf fremden Servern. Fuer sicherheitsbewusste Organisationen (Kitas, Pflegeeinrichtungen, oeffentliche Einrichtungen) ist das ein echtes Kaufargument, das kein SaaS-Wettbewerber bieten kann.

3. **Revisionssicheres Event-Log mit HMAC-SHA256:** Kein anderer Wettbewerber im Segment bietet kryptographische Integritaetssicherung auf Desktop-Ebene. Fuer Organisationen, die gegenueber Behoerden oder Versicherungen Nachweispflichten haben, ist das ein Alleinstellungsmerkmal.

### 5.3 Top 5 Schwaechen / Verbesserungspotenziale (priorisiert)

| Prio | Schwaeche | Impact | Aufwand |
|---|---|---|---|
| 1 | **"Objekte" als Begriff** — zu abstrakt, erzeugt Unsicherheit | Hoch — betrifft jeden neuen Nutzer | Gering (Umbenennung) |
| 2 | **Dashboard ohne Handlungsaufruf** — zeigt Status, aber nicht was zu tun ist | Hoch — betrifft jeden Wiedereinstieg | Mittel (UI-Erweiterung) |
| 3 | **Wizard-Reihenfolge** — Verwaltung vor Nutzen senkt Ersteinrichtungs-Motivation | Hoch — betrifft jeden Erstnutzer | Mittel (Umstrukturierung) |
| 4 | **"Vorlagen" als Begriff** — weniger intuitiv als "Checklisten" | Mittel — erfordert kurzes Nachdenken | Gering (Umbenennung) |
| 5 | **Kein "Zuletzt bearbeitet"** — Wiedereinstieg nach Pause erfordert Suche | Mittel — betrifft Gelegenheitsnutzer | Gering (DB-Query + UI-Sektion) |

### 5.4 Quick Wins (hoher Nutzen, geringer Aufwand)

1. **"Objekte" umbenennen in "Geraete & Raeume"** — Eine Textaenderung an ca. 10 Stellen. Sofortiger Verstaendlichkeitsgewinn. Kein Datenbankumbau noetig, nur UI-Labels.

2. **"Vorlagen" umbenennen in "Checklisten"** — Gleicher Aufwand, gleicher Effekt. "Checkliste" ist der meistverstandene Begriff im gesamten Wettbewerbsfeld.

3. **Dashboard: Klickbare Liste der ueberfaelligen Pruefungen** — Statt nur einer Zahl ("3 ueberfaellig") die konkreten Pruefungen mit Objekt und Faelligkeitsdatum auflisten. Ein Klick fuehrt direkt zur Pruefung.

4. **Dashboard: "Zuletzt bearbeitet"-Sektion** — Die letzten 3-5 Aktivitaeten anzeigen. Einfache Datenbankabfrage nach letztem Aenderungsdatum.

5. **Wizard Schritt 1: Willkommenstext** — Vor dem Organisations-Formular einen kurzen Erklaertext einfuegen. Kein neuer Schritt, nur ein zusaetzlicher Absatz mit 2-3 Saetzen.

### 5.5 Strategische Empfehlung fuer v0.5.0

**Fokus: "30-Sekunden-Wiedereinstieg"**

Die zentrale Herausforderung fuer Nachweis Lokal ist nicht der Funktionsumfang — der ist bereits staerker als bei den meisten Wettbewerbern im Preissegment. Die Herausforderung ist, dass Gelegenheitsnutzer nach Wochen oder Monaten Pause sofort produktiv sein muessen.

**Empfohlene Massnahmen fuer v0.5.0:**

1. **Dashboard-Redesign** mit drei Zonen: "Dringend" (ueberfaellige Pruefungen), "Demnaechst" (naechste Faelligkeiten), "Zuletzt" (letzte Aktivitaeten). Jede Zone ist klickbar und fuehrt direkt zur Aktion.

2. **Begriffs-Refactoring** in der gesamten UI: "Objekte" → "Geraete & Raeume", "Vorlagen" → "Checklisten". Die Gruppenheader entweder entfernen (Empfehlung A) oder vereinfachen (Empfehlung B).

3. **Wizard-Neuordnung**: Willkommen → Checklisten auswaehlen → Erstes Geraet → Organisation (optional). Pruefer-Anlage aus dem Wizard entfernen und bei der ersten Pruefungsdurchfuehrung abfragen.

4. **System-Benachrichtigungen**: Als Desktop-App kann Nachweis Lokal Betriebssystem-Benachrichtigungen nutzen ("Pruefung Feuerloescher EG ist seit 3 Tagen ueberfaellig"). Dies waere ein Feature, das keine SaaS-App ohne Installation bieten kann — ein weiteres Argument fuer die Desktop-Architektur.

5. **Kontexthilfe statt Handbuch**: An kritischen Stellen (Pruefung anlegen, Mangel dokumentieren) kurze Inline-Hinweise: "Waehlen Sie eine Checkliste und ein Geraet, um eine Pruefung zu starten." Keine Popups, keine Tooltips — direkt im UI-Flow sichtbar.

**Nicht empfohlen fuer v0.5.0:** Neue Features wie Digistore24-Integration oder Lizenz-Lifecycle sollten erst nach dem Usability-Refactoring kommen. Ein Nutzer, der die App in den ersten 5 Minuten nicht versteht, wird nie eine Lizenz kaufen.

---

## Quellen

- [Wartungsplaner Hoppe — Prüfmanager](https://www.wartungsplaner.de/details/Pruefmanager.htm)
- [Wartungsplaner Hoppe — Hauptseite](https://www.hoppe-net.de/Wartungsplaner.htm)
- [SafetyCulture iAuditor](https://safetyculture.com/iauditor)
- [SafetyCulture Pricing](https://safetyculture.com/pricing)
- [SafetyCulture GetApp Review 2026](https://www.getapp.com/operations-management-software/a/iauditor/)
- [Lumiform Pricing](https://lumiformapp.com/pricing)
- [Lumiform GetApp Review 2026](https://www.getapp.com/operations-management-software/a/lumiform/)
- [firstaudit — Digitale Prüfprotokolle](https://www.firstaudit.de/digitale-pruefprotokolle/)
- [firstaudit Preise](https://www.firstaudit.de/preise/)
- [GoAudits Pricing](https://goaudits.com/pricing/)
- [GoAudits GetApp Review 2026](https://www.getapp.com/operations-management-software/a/goaudits/)
- [Checkbuster Capterra 2026](https://www.capterra.com/p/161048/Checkbuster/)
- [Fluix Pricing](https://fluix.io)
- [Fluix Capterra 2026](https://www.capterra.com/p/141488/Document-Workflow-Software/)
- [Checkware](https://www.checkware.net/)
