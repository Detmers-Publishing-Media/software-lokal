# Produktidee: NachweisSimple

*Stand: 2026-03-06*
*Status: Idee / Bewertung*

---

## Kurzidee

Ein lokales Tool fuer Pruefprotokolle, Checklisten, Nachweise und Historie.

Es hilft kleinen Organisationen, Dienstleistern oder Fachanwendern dabei,
wiederkehrende Pruefungen und dokumentationspflichtige Ablaeufe einfach,
nachvollziehbar und exportierbar festzuhalten.

---

## Zielgruppe

Geeignet fuer kleine Organisationen und Einzelanwender, die:

- wiederkehrende Pruefungen oder Kontrollen dokumentieren muessen
- PDF-Nachweise oder Ablagen brauchen
- keine grosse Kollaborationsplattform wollen
- lokal oder self-hosted arbeiten moechten

Moegliche fruehe Zielgruppen:

- kleine Vereine
- kleine Dienstleister
- kleine Bueros
- Ehrenamtsstrukturen
- Fachanwender mit Dokumentationspflichten

---

## Kernprozess

1. Prueftyp oder Vorlage auswaehlen
2. Pruefung / Check durchfuehren
3. Status, Hinweise, Datum, Verantwortliche erfassen
4. Ergebnis speichern
5. PDF-Nachweis oder Export erzeugen
6. Historie spaeter wiederfinden

Der Kernprozess ist regelmaessig, nachvollziehbar und standardisierbar.

---

## Muss-Funktionen (Version 1)

- Vorlagen fuer Pruef- oder Checklisten
- Erfassen einzelner Pruefungen / Durchlaeufe
- Status je Punkt oder Gesamtstatus
- Freitext-Hinweise / Bemerkungen
- Datum / Verantwortliche Person
- Historie je Objekt / Vorgang
- PDF-Protokoll
- CSV-Export
- einfache Suche / Filter

---

## Bewusst nicht in Version 1

- Mehrbenutzer-Workflows
- E-Mail-Versand
- Eskalationslogik
- mobile Aussendienst-App
- komplexe Rollenmodelle
- externe Integrationen
- Kundenportal
- Signatur-Workflows

---

## Plattformanteil

**Sehr hoch**

NachweisSimple passt stark auf den bestehenden Plattformkern:

- SQLite
- Audit-Log / Historie
- PDF
- CSV
- lokale Datenhaltung
- Listen / Filter
- einfache CRUD-Strukturen
- Templates

Fast ein Idealprodukt fuer Wiederverwendung.

---

## Monetarisierungschance

**Mittel bis hoch**

- Bedarf ist real, aber Zielgruppe muss sauber zugespitzt werden
- Bei 1-2 konkreten Branchenfaellen wird daraus schnell greifbarer Nutzen:
  Nachweise sauber dokumentieren, PDFs ablegen, Historie nachvollziehen,
  keine Excel-/Papierinseln mehr
- Spaeter in Varianten ausdifferenzierbar

---

## Strategischer Wert fuer Code-Fabrik

**Sehr hoch**

Das Produkt ist ein horizontaler Plattformverstaerker. Es staerkt:

- Audit-Log
- PDF-Engine
- Vorlagenlogik
- Historienansicht
- Nachweis-Exports
- standardisierte Dokumentationsmuster

Das hilft spaeter auch Vereins- und Finanzprodukten.

---

## Risiko

Hauptrisiko: Unschaerfe.

"Nachweise" kann sehr vieles heissen. Deshalb muss die erste Version
sehr konkret formuliert werden, zum Beispiel:

- Pruefprotokolle
- wiederkehrende Checklisten
- dokumentierte Kontrollen
- Nachweis-PDFs

Nicht "alles rund um Compliance".

---

## Empfehlung (externer Review)

NachweisSimple sollte vor TeilnehmerSimple priorisiert werden:

- klarerer Plattformgewinn
- staerkerer Fit zu Audit- und Nachweisdenken
- geringeres Risiko, in Kommunikationsfunktionen abzudriften
- vielseitiger einsetzbar
- besser als horizontaler Baustein fuer mehrere Produktlinien
