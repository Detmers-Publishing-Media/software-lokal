# PLAT-047: Ideen und Anforderungen zusammenfuehren

**Typ:** Story
**Prio:** P3
**Status:** Inbox
**Produkt:** Portal
**Abhaengigkeiten:** AnythingLLM muss laufen (OpenClaw-Umsetzung)

## Ziel

Die zwei getrennten Portal-Seiten "Ideen" (`/api/ideas`) und "Anforderungen" (`/api/requests`) zu einer einzigen Seite zusammenfuehren. Aus Nutzersicht ist die Unterscheidung kuenstlich — beides sind Wuensche, nur mit unterschiedlichem Bezug.

## Fachliche Beschreibung

Ein Nutzer mit gueltigem Lizenz-Key kann:

1. **Anforderung** einreichen — Wunsch zu einer Anwendung, die er selbst lizenziert hat
   - Produkt-Auswahl aus den eigenen lizenzierten Anwendungen (Dropdown)
2. **Idee** einreichen — Vorschlag fuer eine voellig neue Anwendung
   - Kein Produktbezug, nur Titel + Beschreibung

Voraussetzung fuer beide: Mindestens ein gueltiger Lizenz-Key (egal welches Produkt).

## Akzeptanzkriterien

1. [ ] Ein einziges Formular mit Auswahlfeld "Typ" (Anforderung / Idee)
2. [ ] Bei "Anforderung": Dropdown mit lizenzierten Produkten des Nutzers
3. [ ] Bei "Idee": Kein Produkt-Dropdown, nur Titel + Beschreibung
4. [ ] Beide Typen haben gleiche Felder: Titel, Beschreibung, optional Prioritaet
5. [ ] Nur Nutzer mit mindestens einem gueltigen Lizenz-Key koennen einreichen
6. [ ] Bestehende `/api/ideas` und `/api/requests` Endpunkte werden zu einem Endpunkt zusammengefuehrt (oder Facade)
7. [ ] Bestandsdaten (bestehende Ideen/Anforderungen) werden migriert

## Scope IN

- Neuer vereinheitlichter API-Endpunkt
- Frontend-Formular mit Typ-Auswahl
- Lizenz-Validierung (mindestens ein Key)
- Produkt-Zuordnung bei Anforderungen
- DB-Migration (bestehende Daten zusammenfuehren)

## Scope OUT

- Voting/Ranking von Ideen
- Statusverfolgung fuer Nutzer
- Admin-UI zur Verwaltung
- Benachrichtigungen

## Technische Hinweise

- Portal-Tabellen `ideas` und `requests` → zusammenfuehren zu `suggestions` (o.ae.) mit `type`-Spalte
- Lizenz-Validierung: `/api/license/validate` intern aufrufen oder Lizenz-Key im Request mitsenden
- Produkt-Liste: Aus `products`-Tabelle, gefiltert auf lizenzierte Produkte des Nutzers

## Umsetzung

Geplant mit OpenClaw (AnythingLLM als Wissensbasis fuer Kontext).
