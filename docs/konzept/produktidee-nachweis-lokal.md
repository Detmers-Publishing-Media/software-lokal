# Produktidee: Nachweis Lokal

*Stand: 2026-03-11*
*Status: Idee / Bewertung*
*Umbenannt von: NachweisSimple → Nachweis Lokal (Namenskonvention: "[Funktion] Lokal")*

---

## Kurzidee

Ein lokales Desktop-Tool fuer Pruefprotokolle, Checklisten, Nachweise und Historie.

Es hilft kleinen Organisationen, Dienstleistern oder Fachanwendern dabei,
wiederkehrende Pruefungen und dokumentationspflichtige Ablaeufe einfach,
nachvollziehbar und exportierbar festzuhalten.

**Kernbotschaft:** Pruefungen dokumentieren, Nachweise erzeugen, Historie nachvollziehen —
lokal, offen und ohne aufgeblaehte Compliance-Plattform.

---

## Zielgruppe

Geeignet fuer kleine Organisationen und Einzelanwender, die:

- wiederkehrende Pruefungen oder Kontrollen dokumentieren muessen
- PDF-Nachweise oder Ablagen brauchen
- keine grosse Kollaborationsplattform wollen
- lokal arbeiten moechten (keine Cloud, kein Account)

Moegliche fruehe Zielgruppen:

- kleine Vereine (Geraetepruefungen, Sicherheitsunterweisungen)
- kleine Dienstleister (Wartungsprotokolle, Kundennachweise)
- kleine Bueros (wiederkehrende Kontrollen, Checklisten)
- Ehrenamtsstrukturen (Feuerwehr-Unterweisungen, Spielplatzpruefungen)
- Fachanwender mit Dokumentationspflichten (DGUV, Arbeitsschutz)

---

## Kernprozess

1. Prueftyp oder Vorlage auswaehlen
2. Pruefung / Check durchfuehren
3. Status, Hinweise, Datum, Verantwortliche erfassen
4. Ergebnis speichern (mit Audit-Trail)
5. PDF-Nachweis oder CSV-Export erzeugen
6. Historie spaeter wiederfinden und pruefen

Der Kernprozess ist regelmaessig, nachvollziehbar und standardisierbar.

---

## Muss-Funktionen (Version 1)

- Vorlagen fuer Pruef- oder Checklisten (CRUD)
- Erfassen einzelner Pruefungen / Durchlaeufe
- Status je Punkt oder Gesamtstatus
- Freitext-Hinweise / Bemerkungen
- Datum / Verantwortliche Person
- Faelligkeitsanzeige (naechste Pruefung)
- Historie je Objekt / Vorgang
- PDF-Protokoll (einzeln und Sammel-PDF)
- CSV-Export
- einfache Suche / Filter

---

## Bewusst nicht in Version 1

- Mehrbenutzer-Workflows
- E-Mail-Versand / Benachrichtigungen
- Eskalationslogik
- mobile Aussendienst-App
- komplexe Rollenmodelle
- externe Integrationen
- Kundenportal
- Signatur-Workflows (digitale Unterschriften)

---

## Plattformanteil

**Sehr hoch**

Nachweis Lokal passt stark auf den bestehenden Plattformkern:

- SQLite (lokal, verschluesselt)
- audit-chain (HMAC-SHA256 Hash-Kette fuer Nachvollziehbarkeit)
- PDF-Engine (pdfmake)
- CSV-Export
- lokale Datenhaltung
- Listen / Filter (DataTable, SearchBar)
- einfache CRUD-Strukturen
- Templates / Vorlagenlogik
- Backup / Wiederherstellung
- Lizenz-System (39 EUR/Jahr Servicepaket)

Fast ein Idealprodukt fuer Wiederverwendung.

---

## Neue Plattform-Bausteine (staerkt andere Produkte)

| Baustein | Nutzen fuer andere Produkte |
|----------|---------------------------|
| Vorlagen-Engine (Checklisten-Templates) | Mitglieder Lokal (Versammlungsvorlagen), Rechnung Lokal (Rechnungsvorlagen) |
| Pruefprotokoll-Modul | Handwerk-Bundle, Kommunal-Bundle, Agrar-Bundle |
| Faelligkeits-/Fristen-Tracker | Alle Produkte mit wiederkehrenden Terminen |
| Status-Workflow (offen → geprueft → bestanden/bemaengelt) | MaengelTracker, WartungsplanKalender |
| Historien-Ansicht (Timeline pro Objekt) | Alle Produkte mit Audit-Log |

---

## Monetarisierungschance

**Mittel bis hoch**

- Bedarf ist real, aber Zielgruppe muss sauber zugespitzt werden
- Bei 1-2 konkreten Branchenfaellen wird daraus schnell greifbarer Nutzen:
  Nachweise sauber dokumentieren, PDFs ablegen, Historie nachvollziehen,
  keine Excel-/Papierinseln mehr
- Spaeter in Branchenvarianten ausdifferenzierbar (Feuerwehr-Edition, Vermieter-Edition)
- 39 EUR/Jahr Servicepaket (gleicher Preis wie alle Lokal-Tools)

---

## Strategischer Wert fuer Code-Fabrik

**Sehr hoch**

Das Produkt ist ein horizontaler Plattformverstaerker. Es staerkt:

- audit-chain (npm-Paket bekommt ein weiteres "Used in Production"-Produkt)
- PDF-Engine
- Vorlagenlogik
- Historienansicht / Timeline
- Nachweis-Exports
- standardisierte Dokumentationsmuster
- Pruefprotokoll-Baustein (wiederverwendbar in 3+ Bundles)

---

## Risiko

Hauptrisiko: Unschaerfe.

"Nachweise" kann sehr vieles heissen. Deshalb muss die erste Version
sehr konkret formuliert werden, zum Beispiel:

- Pruefprotokolle (Geraete, Anlagen, Sicherheit)
- wiederkehrende Checklisten
- dokumentierte Kontrollen
- Nachweis-PDFs mit Audit-Trail

Nicht "alles rund um Compliance".

---

## Empfehlung

Nachweis Lokal sollte vor Teilnehmer Lokal priorisiert werden:

- klarerer Plattformgewinn (5 neue Bausteine)
- staerkerer Fit zu audit-chain und Nachweisdenken
- geringeres Risiko, in Kommunikationsfunktionen abzudriften
- vielseitiger einsetzbar (Quernutzen in 3+ Bundles)
- besser als horizontaler Baustein fuer mehrere Produktlinien

---

## Einordnung in die Produktfamilie

```
Bestehend:
  Rechnung Lokal       — Rechnungen + EUeR + ZUGFeRD (Nebenberufler)
  Mitglieder Lokal     — Vereinsverwaltung (Vereine 30-250 Mitglieder)
  FinanzRechner Lokal  — Versicherungsrechner (Makler)

Naechste Stufe:
  Nachweis Lokal       — Pruefprotokolle + Checklisten + Nachweise ← DIESES PRODUKT
  Teilnehmer Lokal     — Teilnehmer-/Gruppen-/Kursverwaltung

Spaeter (Bundle-Erweiterungen):
  Immobilien Lokal     — WEG/Vermieter (aus Bundle B1)
  Handwerk Lokal       — Dokumentation + Kalkulation (aus Bundle B2)
```
