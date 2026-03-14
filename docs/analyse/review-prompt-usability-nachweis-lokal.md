# Review-Prompt: Usability-Analyse Nachweis Lokal v0.4.0

## Kontext

Du bist ein unabhaengiger UX-Reviewer mit Erfahrung in B2B-Desktop-Software fuer kleine Organisationen (Vereine, Handwerksbetriebe, Hausmeisterdienste, Kitas, Pflegeeinrichtungen). Du analysierst die Desktop-App **Nachweis Lokal** — ein Tool zur Dokumentation wiederkehrender Pruefungen, Checklisten und Nachweise.

### Wichtige Rahmenbedingungen

1. **Unregelmaessige Nutzung**: Pruefungen werden oft nur quartalsweise, halbjaehrlich oder jaehrlich durchgefuehrt. Nutzer muessen sich nach Wochen oder Monaten Pause sofort wieder zurechtfinden. Die App muss ohne Einarbeitung bedienbar sein.

2. **Zielgruppe**: Hausmeister, Sicherheitsbeauftragte, Vereinsvorsitzende, Kita-Leitungen, Facility Manager — Menschen, die Pruefungen nebenbei erledigen, nicht IT-affine Power-User.

3. **Ersteinrichtung**: Der erste Eindruck entscheidet, ob das Tool genutzt oder verworfen wird. Ein Nutzer, der in den ersten 5 Minuten nicht versteht was er tun soll, kommt nicht wieder.

4. **Lokale Desktop-App**: Electron + Svelte 5 + SQLite. Keine Cloud, kein Login, keine Registrierung. Daten bleiben auf dem Rechner.

---

## Zu analysierendes Produkt

### Navigation (Sidebar)

Die App verwendet eine workflow-orientierte Sidebar mit Gruppenheadern:

```
Dashboard
─────────────────
VORBEREITEN
  Vorlagen
  Objekte
─────────────────
PRUEFEN
  Pruefungen
─────────────────
NACHVERFOLGEN
  Maengel
─────────────────
  Einstellungen
  Support
```

### Einrichtungsassistent (First-Run-Wizard)

4 Schritte beim ersten Start:
1. **Organisation** — Name, Adresse, Verantwortliche Person (fuer PDF-Briefkopf)
2. **Pruefer anlegen** — Name, Rolle, Qualifikation
3. **Vorlagen auswaehlen** — 15 fertige Vorlagen zum Anklicken (Brandschutz, Elektro, Spielgeraete, Leitern, Erste-Hilfe, Regale, UVV-Fahrzeug, PSA, Hygiene, Buero, Unterweisung, IT-Serverraum, Aufzug, Legionellen, Fluchtwege)
4. **Erstes Objekt anlegen** — Bezeichnung, Standort, Kategorie

Jeder Schritt kann uebersprungen werden. Der gesamte Wizard kann uebersprungen werden.

### Kern-Workflow

1. **Vorlage** erstellen oder aus Bibliothek importieren (Pruefpunkte definieren)
2. **Objekt** anlegen (Geraet, Raum, Anlage)
3. **Pruefung** anlegen (Vorlage + Objekt zuordnen)
4. **Pruefung durchfuehren** (interaktive Checkliste: OK / Maengel / N/A je Punkt, Fotos, Zwischenspeichern)
5. **Ergebnis** ansehen, PDF erzeugen, Maengel nachverfolgen

### Features (33 gesamt, v0.4.0)

- Vorlagen-CRUD mit beliebig vielen Pruefpunkten
- Vorlagen-Bibliothek (15 fertige branchenspezifische Vorlagen)
- Vorlagen duplizieren
- Objekt-/Gegenstandsverwaltung mit Pruefhistorie
- Pruefungsverwaltung (anlegen, durchfuehren, abschliessen)
- Interaktive Checkliste (OK/Maengel/N/A, Zwischenspeichern)
- Status-Workflow (offen → bestanden/bemaengelt/abgebrochen)
- Wiederkehrende Pruefungen (automatische Folgepruefung nach Intervall)
- Foto-Anhaenge pro Pruefpunkt
- Dashboard mit Statistiken + Faelligkeits-Ampel + offene Maengel
- Erinnerungen (Warnbanner fuer ueberfaellige/bald faellige Pruefungen)
- Maengeltracking (offen/behoben/verifiziert, Nachpruefung)
- PDF: Pruefprotokoll, Maengelbericht, Pruefungsliste, Sammel-PDF, Fotos eingebettet, QR-Code
- CSV-Export und CSV-Import (Vorlagen)
- Prueferverwaltung mit Autovervollstaendigung
- Organisationsprofil (Briefkopf)
- Revisionssicheres Event-Log (HMAC-SHA256 Hash-Kette)
- Integritaetspruefung sichtbar im UI
- Support-Integration + Feature-Requests + Changelog

---

## Aufgaben

### 1. Mitbewerber-Analyse

Recherchiere und vergleiche die folgenden Wettbewerber im Bereich Pruefprotokolle / Checklisten / Nachweise fuer kleine Organisationen:

**Desktop / On-Premise:**
- Checkware
- Lumiform (hat auch Desktop-Modus)
- SafetyCulture (iAuditor)
- firstaudit
- Pruefmanager (Hoppe Unternehmensberatung)
- e.Checkliste

**Cloud/SaaS (zum Vergleich):**
- SafetyCulture / iAuditor
- Lumiform
- GoAudits
- Checkbuster
- Fluix

Fuer jeden Wettbewerber:
- **Ersteinrichtung**: Wie schnell kommt man zur ersten Pruefung? Wizard? Onboarding?
- **Navigation**: Wie ist die Menuefuehrung aufgebaut? Welche Begriffe werden verwendet?
- **Benennung**: Verwenden sie "Pruefung", "Inspektion", "Audit", "Checkliste"? Was versteht die Zielgruppe am besten?
- **Wiedereinstieg nach Pause**: Gibt es Dashboard, Erinnerungen, "Wo war ich?"-Features?
- **Preismodell**: Was kostet es, und wie verhaelt sich das zu Nachweis Lokal (39 EUR/Jahr)?
- **Staerken/Schwaechen** aus Usability-Sicht

### 2. Ersteinrichtung (First-Run-Wizard) — Detailanalyse

Bewerte den 4-Schritte-Wizard kritisch:

- Ist die Reihenfolge logisch? Wuerde ein Nutzer instinktiv so vorgehen?
- Sind die Begriffe verstaendlich? ("Vorlage", "Objekt", "Pruefer" — versteht ein Hausmeister das sofort?)
- Fehlt etwas Wichtiges? (z.B. Erklaerung was die App macht, Beispiel-Workflow, Hinweis auf Dashboard)
- Ist der Wizard zu lang oder zu kurz?
- Wie schneidet er im Vergleich zu den Wettbewerbern ab?
- **Konkreter Verbesserungsvorschlag**: Wie wuerdest du den Wizard umgestalten?

### 3. Navigation und Benennung — Detailanalyse

Bewerte die Sidebar-Struktur:

- **Gruppenheader** "VORBEREITEN / PRUEFEN / NACHVERFOLGEN" — ist das fuer Gelegenheitsnutzer verstaendlich oder zu abstrakt?
- **Menuebezeichnungen**: "Vorlagen", "Objekte", "Pruefungen", "Maengel" — wuerde die Zielgruppe andere Begriffe erwarten?
- **Informationsarchitektur**: Fehlen Eintraege? Sind Eintraege ueberfluessig? Ist die Hierarchie richtig?
- **Vergleich mit Wettbewerbern**: Welche Benennung verwenden die anderen, und warum?
- **Konkreter Verbesserungsvorschlag**: Wie wuerde deine ideale Sidebar aussehen?

### 4. Wiedereinstieg nach Wochen/Monaten

Die zentrale Usability-Herausforderung: Ein Nutzer oeffnet die App nach 3 Monaten Pause.

- Weiss er sofort, was zu tun ist? Was zeigt das Dashboard?
- Findet er seine letzte Pruefung schnell wieder?
- Versteht er den Workflow (Vorlage → Objekt → Pruefung) noch, oder muss er ihn sich neu erarbeiten?
- Gibt es visuelle Hinweise ("3 Pruefungen ueberfaellig", "Naechste Pruefung: Feuerloescher EG am 15.04.")?
- **Was machen die Wettbewerber besser** beim Wiedereinstieg?
- **Konkreter Verbesserungsvorschlag**: Was wuerdest du aendern, damit der Wiedereinstieg in unter 30 Sekunden gelingt?

### 5. Gesamtbewertung

- **Usability-Score** (1-10) fuer: Ersteinrichtung, Navigation, Benennung, Wiedereinstieg, Gesamteindruck
- **Top 3 Staerken** gegenueber Wettbewerbern
- **Top 5 Schwaechen / Verbesserungspotenziale** (priorisiert nach Impact)
- **Quick Wins** (Aenderungen die mit minimalem Aufwand den groessten Usability-Gewinn bringen)
- **Strategische Empfehlung**: Wo sollte die naechste Version (v0.5.0) den Usability-Fokus setzen?

---

## Ausgabeformat

Strukturiere deine Analyse als Markdown-Dokument mit:
- Ueberschriften fuer jeden Abschnitt
- Tabellen fuer Wettbewerbervergleiche
- Konkrete Beispiele statt abstrakter Aussagen
- Mockup-Vorschlaege fuer Navigation/Wizard als ASCII-Diagramm oder Textbeschreibung
- Priorisierte Handlungsempfehlungen am Ende

## Laenge

Umfassend, aber fokussiert. Erwartete Laenge: 2.000–4.000 Woerter.
