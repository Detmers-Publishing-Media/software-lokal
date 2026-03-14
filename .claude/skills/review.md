---
name: review
description: Session-Ende Review — state.md aktualisieren, CLAUDE.md pruefen, Story-Status abgleichen
user_invocable: true
---

# Review: Session-Ende

Fuehre ein strukturiertes Session-Review durch:

## 1. state.md aktualisieren

Lies `state.md` und aktualisiere sie:

- **Letzte Session**: Heutiges Datum, was wurde abgeschlossen
- **Angefasste Dateien**: Ermittle via `git diff --name-only` (staged + unstaged) und `git diff --cached --name-only`
- **Entscheidungen**: Architekturentscheidungen aus dieser Session hinzufuegen (nur nicht-triviale)
- **Offene Fragen**: Was ist unklar oder braucht PO-Input?
- **Naechste Schritte**: Konkrete ToDos fuer die naechste Session

## 2. CLAUDE.md pruefen

Pruefe ob Aenderungen dieser Session Updates erfordern:

- **Root-CLAUDE.md**: Tech-Stack geaendert? Testzahlen geaendert? Neues Package?
- **Produkt-CLAUDE.md**: Neue Routes, Libs, Components, Features? Version hochgezaehlt?
- Wenn Updates noetig: auflisten, aber NICHT automatisch aendern (PO entscheidet)

## 3. Story-Status abgleichen

Lies `.stories/current.yml`:

- Sind alle `acceptance_criteria` erfuellt? → Status-Empfehlung geben
- Stimmen `affected_files` mit den tatsaechlich geaenderten Dateien ueberein?
- Wenn Story done: Hinweis dass neue Story gewaehlt werden muss

## 4. Konsistenz-Check

- `VERSION` vs. `package.json`-Versionen: passen sie zusammen?
- `spec.yml`-Versionen vs. `package.json`: konsistent?
- Neue Dateien die in `.gitignore` fehlen?

## Ausgabe

Aktualisiere `state.md` direkt. Fuer alle anderen Dateien: Liste ausgeben mit konkreten Aenderungsvorschlaegen, die der PO bestaetigen kann.
