# Code-Fabrik — KI-gestuetztes Support-Betriebsmodell

*Stand: 2026-03-06*
*Status: Verabschiedet*

---

## 1. Grundprinzip

Support bei Code-Fabrik ist kein individueller Fernwartungsservice, sondern ein
standardisierter Diagnose- und Loesungsprozess.

Der Support soll so aufgebaut sein, dass:
- das Produkt Probleme frueh erkennt,
- die KI Faelle strukturiert einordnet und beantwortet,
- und der Gruender nur bei unklaren, neuen oder riskanten Faellen eingreift.

Kein Fernzugriff auf Kundensysteme.
Keine manuelle Einzelfallanalyse als Standard.
Keine Abhaengigkeit davon, dass der Gruender live verfuegbar ist.

---

## 2. Zielbild

Ein Supportfall soll idealerweise so ablaufen:

**Stufe 1 — Produkt erkennt Problem**

Die App erkennt einen Fehler oder Risikozustand und zeigt:
- verstaendliche Erklaerung
- Fehlercode
- sichere naechste Schritte
- Option "Diagnosedaten exportieren"

**Stufe 2 — Kunde sendet Fall ein**

Der Kunde schickt:
- kurze Problembeschreibung
- Fehlercode
- Support-Bundle
- optional Screenshot

**Stufe 3 — KI analysiert automatisch**

Die KI erstellt:
- Fallzusammenfassung
- Klassifikation
- Risikoabschaetzung
- empfohlene Antwort
- konkrete sichere Handlungsschritte

**Stufe 4 — Automatische oder halbautomatische Antwort**

Bei Standardfaellen geht die Antwort direkt an den Kunden.
Bei Grenzfaellen bekommt der Gruender:
- kompakten Fallbericht
- KI-Einschaetzung
- Vorschlag fuer Antwort
- offene Punkte

---

## 3. Rollenmodell

### Rolle A — Das Produkt

Das Produkt ist die erste Supportinstanz. Es muss:
- Probleme erkennen
- Fehler sauber codieren
- sichere Recovery-Schritte anbieten
- Diagnosedaten strukturiert exportieren
- technische Zustaende sichtbar machen

Das Produkt soll nicht nur "kaputtgehen", sondern diagnostisch sprechen.

### Rolle B — Die KI

Die KI ist die primaere Supportbearbeitung. Sie soll:
- Faelle klassifizieren
- bekannte Muster erkennen
- Logs und Bundle zusammenfassen
- sichere Standardantworten formulieren
- Rueckfragen generieren
- Eskalationen erkennen

Die KI ist nicht der "Reparateur", sondern der strukturierte Fallanalyst
und Antwortgenerator.

### Rolle C — Gruender

Der Gruender ist die letzte Eskalationsstufe, nicht die erste.
Eingriff nur bei:
- unbekannten Fehlerbildern
- moeglichem Produktbug
- Datenintegritaetsrisiko
- fehlenden Standardmassnahmen
- strategisch wichtigen neuen Mustern

Aufgabe: Muster erkennen, Produkt und Supportsystem verbessern,
neue Fehlercodes und Recovery-Flows definieren.

---

## 4. Supportfluss

### Phase 1 — Fehler im Produkt

Jeder kritische Fehler enthaelt:
- Titel in Alltagssprache
- Fehlercode
- kurze Erklaerung
- naechster sicherer Schritt
- "Diagnosedaten exportieren"

Beispiel:
```
Fehlercode: CF-DB-002
Die Datenbank konnte nicht geprueft werden.
Bitte exportieren Sie die Diagnosedaten und senden Sie diese an den Support.
Sie koennen ausserdem das letzte Backup wiederherstellen.
```

### Phase 2 — Ticket-Erzeugung

Kanal: E-Mail, Formular oder Helpdesk-Portal.

Pflichtangaben:
- Produkt
- Version
- Fehlercode (falls vorhanden)
- kurze Beschreibung
- Support-Bundle

Optional:
- Screenshot
- Zeitpunkt des Fehlers
- was unmittelbar davor passiert ist

### Phase 3 — Automatische Vorverarbeitung

Aus dem Bundle extrahiert:
- Produktname, Version, Betriebssystem
- Schema-Version
- Fehlercode
- DB-Integritaetsstatus
- letzter Backup-Zeitpunkt
- Update-Status
- freie Platte
- relevante Logs
- Risikomarker

### Phase 4 — KI-Auswertung

Die KI beantwortet intern fuenf Fragen:
1. Welcher Problemtyp liegt vor?
2. Ist Datenverlust-Risiko erkennbar?
3. Gibt es einen bekannten Standardpfad?
4. Welche Schritte sind fuer den Kunden sicher?
5. Muss der Fall eskalieren?

### Phase 5 — Antwort

**Standardfall:** KI kann direkt antworten.
**Grenzfall:** KI erzeugt Kurzdiagnose, moegliche Ursachen, empfohlene Antwort,
offene Unsicherheiten, Eskalationsempfehlung. Gruender entscheidet.

---

## 5. Fehlercodesystem

Festes, kleines, stabiles Codesystem.

### Datenbank

| Code | Bedeutung |
|---|---|
| CF-DB-001 | Datenbank gesperrt |
| CF-DB-002 | Integritaetspruefung fehlgeschlagen |
| CF-DB-003 | Datenbank nicht lesbar |
| CF-DB-004 | Datenbank fehlt |
| CF-DB-005 | Datenbank neuer als App |

### Backup

| Code | Bedeutung |
|---|---|
| CF-BKP-001 | Automatisches Backup fehlgeschlagen |
| CF-BKP-002 | Restore fehlgeschlagen |
| CF-BKP-003 | Kein gueltiges Backup gefunden |

### Migration

| Code | Bedeutung |
|---|---|
| CF-MIG-001 | Migration fehlgeschlagen |
| CF-MIG-002 | Replay erforderlich |
| CF-MIG-003 | Migration unterbrochen |

### Update

| Code | Bedeutung |
|---|---|
| CF-UPD-001 | Updatepruefung fehlgeschlagen |
| CF-UPD-002 | Updateinstallation fehlgeschlagen |
| CF-UPD-003 | Signatur-/Vertrauensproblem |

### System

| Code | Bedeutung |
|---|---|
| CF-SYS-001 | Datenordner nicht beschreibbar |
| CF-SYS-002 | Speicherplatz zu gering |
| CF-SYS-003 | Cloud-Sync-Risiko erkannt |
| CF-SYS-004 | Installationsdateien unvollstaendig |

### Renderer/UI

| Code | Bedeutung |
|---|---|
| CF-UI-001 | Oberflaeche konnte nicht geladen werden |
| CF-UI-002 | Unerwarteter Renderer-Fehler |

Diese Codes gehoeren in:
- Fehlerdialoge
- Logs
- Support-Bundle
- Hilfeartikel
- KI-Prompts

---

## 6. Eskalationsregeln

### Nicht eskalieren — KI darf direkt antworten

Voraussetzungen:
- Bekannter Fehlercode
- Vollstaendiges Support-Bundle
- Klare Standardmassnahme
- Kein offensichtliches Datenverlust-Risiko

Beispiele: DB gesperrt, Datenordner nicht beschreibbar, Cloud-Sync-Warnung,
Updatepruefung fehlgeschlagen, Backup aelter als 24h.

### Eskalieren — KI soll an Gruender uebergeben

- Unbekannter Fehlercode
- Integritaetsfehler ohne klaren Recovery-Pfad
- Restore fehlgeschlagen
- Widersprüüchliche Diagnosedaten
- Moeglicher Produktbug
- Migrationsfehler nach Release
- Mehrere aehnliche Faelle in kurzer Zeit

### Sofort priorisieren

- Datenverlustverdacht
- Beschaedigte Datenbank
- Wiederholter Crash beim Start
- Fehlgeschlagenes Update nach Release
- Fehler in mehreren Kundenfaellen gleichzeitig

---

## 7. Supportantworten: erlaubte und nicht erlaubte Massnahmen

### Erlaubt

Die KI darf:
- erklaeren
- strukturieren
- bekannte Ursachen benennen
- sichere Standardschritte geben
- Hilfeartikel referenzieren
- Diagnoseexport anleiten
- Safe-Mode anleiten
- Restore aus Standardmenue anleiten

### Nicht erlaubt

Die KI darf nicht:
- freie SQL-Befehle an Kunden geben
- manuelle Dateioperationen in kritischen Systemordnern improvisieren
- Registry-Eingriffe anleiten (ausser bewusst dokumentiert)
- Integritaetsfehler bagatellisieren
- Restore ohne Pruefung empfehlen
- riskante Schritte ohne Backup vorschlagen

---

## 8. Minimale Tool-Landschaft

### Produktseite

- Fehlercode-Anzeige
- Support-Bundle-Export
- "Technische Infos kopieren"
- Hilfe-Menue / Recovery-Center
- Safe Mode

### Eingangsseite

- E-Mail-Postfach oder Formular
- Klare Pflichtfelder
- Upload fuer Bundle

### KI-Seite

Interner Workflow:
- Bundle lesen
- Fall zusammenfassen
- Fehlercode zuordnen
- Standardantwort erzeugen
- Eskalationsflag setzen

### Wissensbasis

- Fehlercode-Katalog
- Recovery-Anleitungen
- Supportregeln
- Produktversionen / Migrationswissen
- Bekannte Bugs / bekannte Workarounds

---

## 9. Interne KI-Prompts

### Prompt 1 — Bundle analysieren

"Analysiere dieses Support-Bundle. Bestimme Problemtyp, Risiko fuer Datenintegritaet,
wahrscheinlichste Ursache, sichere naechste Schritte und ob der Fall eskaliert werden muss."

### Prompt 2 — Kundenantwort schreiben

"Schreibe eine ruhige, verstaendliche Antwort an einen nicht-technischen Kunden.
Verwende keine unnoetige Techniksprache. Nenne nur sichere Handlungsschritte."

### Prompt 3 — Fehlercode zuordnen

"Ordne diesen Fall einem bestehenden Fehlercode zu. Wenn keiner passt,
schlage einen neuen vor und begruende kurz."

### Prompt 4 — Muster erkennen

"Vergleiche diese neuen Supportfaelle mit frueheren Faellen. Gibt es wiederkehrende
Muster, die als Produktverbesserung, Diagnoseverbesserung oder neuer Hilfeartikel
umgesetzt werden sollten?"

### Prompt 5 — Eskalationshilfe

"Fasse diesen Fall so zusammen, dass der Gruender in 2 Minuten entscheiden kann,
ob Produktbug, Bedienproblem oder Recovery-Fall vorliegt."

---

## 10. Supportmetriken

- Anteil Faelle mit vollstaendigem Bundle
- Anteil Faelle, die KI direkt beantworten kann
- Anteil eskalierter Faelle
- Haeufigste Fehlercodes
- Haeufigste Eskalationsgruende
- Mittlere Zahl der Nachrichten pro Fall
- Zahl der Faelle, aus denen ein Produkt- oder Doku-Change entsteht

Ziel: wenig manuelle Reibung, klare Muster, stetig sinkende Gruenderlast.

---

## 11. Produktanforderungen aus dem Supportmodell

1. **Selbstdiagnose** — App erfasst und exportiert technische Zustaende
2. **Sichere Standardmassnahmen** — Klar definierte Recovery-Pfade
3. **Stabile Begriffe** — Fehlercodes, Menuenamen, Hilfetexte, Statusbegriffe konsistent

KI-Support scheitert oft nicht an der KI, sondern an inkonsistenten Produkten.

---

## 12. Leitregeln fuer den Gruender

**Regel 1:** Kein Supportfall ohne Musterlernen.
Jeder manuelle Fall fuehrt zu mindestens einem Ergebnis:
neuer Fehlercode, bessere Diagnose, neuer Hilfeartikel, bessere Recovery-UI,
neues Support-Bundle-Feld.

**Regel 2:** Keine Fernwartung als Standard.
Wenn ein Fall nur per Fernzugriff loesbar waere, fehlt ein Produkt- oder Diagnosebaustein.

**Regel 3:** Der Supportprozess ist Teil des Produkts. Nicht externes Anhaengsel.

**Regel 4:** Du bearbeitest nur Grenzfaelle.
Alles andere muss auf Dauer Produkt + KI uebernehmen.

---

## 13. Kompakter Zielprozess

1. App zeigt Fehlercode und Export-Button
2. Kunde sendet Bundle und Kurzbeschreibung
3. KI analysiert und klassifiziert
4. KI antwortet mit sicherem Standardpfad
5. Nur unklare oder riskante Faelle gehen an Gruender
6. Gruender verbessert Produkt oder Wissensbasis
7. Der naechste aehnliche Fall laeuft automatischer

---

## 14. Code-Fabrik-Supportphilosophie

> Code-Fabrik-Support basiert nicht auf Fernzugriff und individueller Fehlersuche,
> sondern auf standardisierten Diagnosepfaden, maschinenlesbaren Supportdaten und
> KI-gestuetzter Fallbearbeitung. Der Gruender greift nur dort ein, wo neue Muster,
> echte Produktfehler oder erhoehte Datenrisiken vorliegen.
