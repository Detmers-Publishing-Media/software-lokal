# Recherche-Prompt: Echte Schmerzpunkte von Versicherungsmaklern

*Stand: 12. Maerz 2026*
*Zweck: Unbeaufsichtigte Recherche ohne Rueckfragen*

---

## Auftrag

Du bist ein Marktanalyst fuer Software-Produkte im Versicherungsvermittler-Markt (Deutschland).
Recherchiere gruendlich die echten, alltaeglichen Schmerzpunkte von Versicherungsmaklern (§34d GewO)
und bewerte, welche davon durch Desktop-Software adressierbar sind.

Speichere das Ergebnis als: `docs/konzept/recherche-ergebnis-schmerzpunkte-makler.md`

Lies vorher diese Kontextdokumente:
- `docs/konzept/produktidee-nachweis-lokal.md` (Nachweis Lokal Konzept)
- `docs/konzept/gesamtkonzept-v4.md` (Code-Fabrik Gesamtstrategie)
- `CLAUDE.md` (Monorepo-Struktur, Tech-Stack)

---

## Hintergrund

Code-Fabrik baut fokussierte Desktop-Tools fuer kleine Unternehmen (Electron + Svelte 5 + SQLite).
Bestehende Produkte: Mitglieder Lokal (Vereine), Rechnung Lokal (Rechnungsstellung), FinanzRechner lokal (Versicherungsrechner).

Die Hypothese: Versicherungsmakler (§34d GewO) haben regulatorische und administrative
Schmerzpunkte, die durch ein fokussiertes Desktop-Tool adressiert werden koennten — ohne
Cloud-Zwang, ohne Abo-Falle, ohne Abhaengigkeit von Maklerpools.

Zielgruppe: Einzelmakler und kleine Maklerbueros (1-5 Mitarbeiter), die NICHT an einen
Maklerpool gebunden sind oder deren Pool keine ausreichende Tool-Unterstuetzung bietet.

---

## Recherche-Aufgaben

### 1. Schmerzpunkte identifizieren und quantifizieren

Recherchiere die groessten alltaeglichen Probleme von Versicherungsmaklern:

**Regulatorisch:**
- IDD-Beratungsdokumentation (Wuensche-und-Beduerfnisse, Geeignetheitspruefung)
- DSGVO-Nachweise (Verarbeitungsverzeichnis, Einwilligungen, Loeschkonzept)
- Beschwerdemanagement (§17 VersVermV)
- GwG/KYC-Dokumentation
- IDD-Weiterbildungsnachweise (15h/Jahr)
- GoBD-konforme Archivierung

**Operativ:**
- Verwaltungsaufwand / Buerokratie (wie viel Zeit pro Woche?)
- Bestandsuebertragung (Dauer, Fehleranfaelligkeit)
- Software-Fragmentierung (wie viele Tools? Medienbrueche?)
- Courtage-/Provisionskontrolle (Stornohaftung, Verprobung)
- Nachfolgeplanung / Bestandsbewertung

Fuer jeden Punkt:
- Konkrete Zahlen/Statistiken (mit Quelle)
- Zitate von Maklern oder Branchenverbaenden
- Existierende Software-Loesungen
- Schmerz-Bewertung (1-5)
- Loesungsreife: gut geloest / teilweise geloest / ungeloest

### 2. Markt- und Zielgruppenanalyse

- Wie viele Versicherungsmakler gibt es in Deutschland? (DIHK-Register)
- Wie ist die Groessenverteilung? (Einzelmakler vs. Bueros)
- Durchschnittsalter und Nachfolge-Problematik?
- Wie viele sind NICHT an einen Maklerpool gebunden?
- Welche MVP (Maklerverwaltungsprogramme) dominieren den Markt?
- Was kosten die gaengigen MVPs? (pro User/Monat)

### 3. Bestehende Loesungen bewerten

Fuer jeden identifizierten Schmerzpunkt:
- Welche spezialisierten Tools gibt es?
- Sind diese in MVPs integriert oder standalone?
- Was kosten sie?
- Wo sind die Luecken?

### 4. Code-Fabrik Fit-Analyse

Bewerte fuer jeden Schmerzpunkt:
- Passt ein Desktop-Tool (offline-faehig, lokal, kein Cloud-Zwang)?
- Ist es mit Electron + SQLite umsetzbar?
- Gibt es einen Wettbewerbsvorteil gegenueber bestehenden Loesungen?
- Passt es zur Code-Fabrik-Strategie (39 EUR/Jahr, fokussiert, pruefbar)?
- Welche bestehenden Packages koennten wiederverwendet werden? (audit-chain, finanz-shared)

### 5. Produktempfehlung

Basierend auf der Analyse:
- Welche 1-3 Schmerzpunkte sind am besten durch Code-Fabrik adressierbar?
- Wie wuerde ein MVP aussehen? (Kernfunktionen, Scope)
- Geschaetzter Entwicklungsaufwand (T-Shirt: S/M/L/XL)
- Realistische Marktchance (Zielgruppe * Conversion * Preis)
- Go/No-Go Empfehlung mit Begruendung

---

## Suchbegriffe

- "Versicherungsmakler Buerokratie Zeitaufwand"
- "IDD Dokumentationspflicht Aufwand Makler"
- "Versicherungsmakler Software Vergleich"
- "Maklerverwaltungsprogramm Kosten"
- "Bestandsuebertragung Versicherungsmakler Probleme"
- "§34d Dokumentation Pflichten"
- "Versicherungsmakler Nachfolge Statistik"
- "DSGVO Versicherungsmakler Umsetzung"
- "Beschwerdemanagement §17 VersVermV Software"
- "Stornohaftung Versicherungsmakler Tools"
- "BFV Regulatorik Studie"
- "AssCompact Maklerstudie"

---

## Ausgabeformat

Erstelle den Bericht als `docs/konzept/recherche-ergebnis-schmerzpunkte-makler.md` mit:

1. **Executive Summary** (5-10 Saetze)
2. **Markt-Ueberblick** (Zahlen zur Zielgruppe)
3. **Schmerzpunkte-Ranking** (Matrix mit Bewertung)
4. **Detail-Analyse Top-5** (je 1 Seite mit Zahlen, Loesungen, Luecken)
5. **Wettbewerbslandschaft** (MVPs, Spezial-Tools, Kosten)
6. **Code-Fabrik Fit-Analyse** (pro Schmerzpunkt)
7. **Produktempfehlung** (konkreter MVP-Vorschlag)
8. **Quellen** (alle URLs)

Jede Behauptung mit Quelle belegen. Wenn keine Quelle findbar: explizit als "nicht verifiziert" markieren.

---

## Wichtige Hinweise

- **Sprache:** Deutsch (Bericht), Englisch (Suchbegriffe wo noetig)
- **Keine Nachfragen stellen** — bei Unklarheiten die wahrscheinlichste Interpretation waehlen
- **Ehrlich bewerten** — wenn kein Produkt sinnvoll ist, das klar sagen
- **Fokus auf Einzelmakler/Kleinbueros** — nicht auf Grossmakler oder Pools
- **Zeitlimit:** Max 30 Minuten Recherche, dann Ergebnis schreiben
