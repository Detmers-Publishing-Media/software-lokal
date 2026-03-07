# Code-Fabrik — Positionierung: OSS-Geschaeftsmodell-Analyse

*Stand: 2026-03-06*
*Quelle: Externer Review + Gruenderdiskussion*

---

## Einordnung gegen 4 typische OSS-Geschaeftsmodelle

### 1. Open Core

**Muster:** Freier Kern, bezahlt fuer Enterprise-Features (Admin, Security, Compliance, Teams).

**Passt zu Code-Fabrik:** Nur teilweise. Aktuelle Strategie sperrt keine lokalen Features,
sondern monetarisiert ueber Installer, Updates, Support, Templates.

**Bewertung:** Nicht das Primaermodell. Vereine und Makler zahlen ungern fuer "gesperrte Features",
aber eher fuer Bequemlichkeit und Zuverlaessigkeit. Allenfalls sparsam als Zusatz
(z.B. Premium-Templates), nicht als Kernpositionierung.

### 2. Open Source + Enterprise Subscription / Support

**Muster:** Code offen, bezahlt fuer Distribution, Support, Lifecycle, Updates, Know-how.
Beispiele: Red Hat, Nextcloud Enterprise.

**Passt zu Code-Fabrik:** Sehr stark — am besten von allen vier Modellen.

Warum:
- Offene lokale Software
- Geld fuer Installer, Updates, Support, Templates
- Fokus auf "laeuft zuverlaessig"
- Kein kuenstliches Einsperren
- Vertrauen durch lokal-first, SQLite, kein Account, kein Cloud-Zwang

**Unterschied zu Red Hat/Nextcloud:** Nicht Enterprise-Markt, sondern Mikro-/Low-Price-Segment.
"Support-Abo" soll nicht wie Enterprise-Support klingen, sondern wie:
gepruefter Installer, verlaessliche Updates, Hilfe bei Import/Startproblemen, Vorlagen, ruhige Nutzung.

**Bewertung:** Das ist das Kernmodell. Nur in klein, standardisiert und ohne Enterprise-Sprache.

### 3. Open Source + Hosted/SaaS

**Muster:** Code offen, Geld ueber gehostetes Angebot (Komfort, Betrieb, Backups, Multi-User).

**Passt zu Code-Fabrik:** Aktuell kaum.

Warum nicht:
- Nutzenversprechen ist lokal-first
- Keine Cloud-Abhaengigkeit ist Vertrauensvorteil
- Zielgruppen brauchen Einplatz-Tools, nicht gehostete Kollaboration
- SaaS wuerde Support, Datenschutz, Zahlungslogik und Betriebsaufwand erhoehen

**Bewertung:** Nicht der richtige Schwerpunkt. Wuerde das Modell verwaessern.

### 4. Open Source + Services / Consulting / Custom Work

**Muster:** Software offen, Umsatz durch Einfuehrung, Anpassung, Migration, Schulung.

**Passt zu Code-Fabrik:** Nur begrenzt. Punktuell nützlich (Datenimporte, Vorlagenanpassung),
aber als Hauptmodell problematisch:
- Schlecht skalierbar als Solo-Entwickler
- Bindet Zeit statt Produktportfolio aufzubauen
- Niedrige Ticketpreise vertragen keine lange Individualberatung

**Bewertung:** Nur als Nebenkanal, nicht als strategische Basis.

---

## Einordnung Code-Fabrik

Am ehesten: **Open Product + Convenience Subscription**

Oder auf Deutsch: **Offene Fachsoftware + Bezahl-Abo fuer bequeme, verlaessliche Nutzung**

### Staerken

1. Nicht gezwungen, Enterprise-Funktionen zu erfinden
2. Nischen bedienen, die fuer grosse Anbieter zu klein sind
3. Plattform laesst sich auf mehrere Produkte ausrollen
4. Lokal-first ist im DACH-Markt ein echtes Vertrauenssignal

### Risiken

1. 29 EUR/Jahr nur tragfaehig bei extrem standardisiertem Support
2. Oekonomischer Burggraben liegt nicht im Code, sondern in Distribution,
   Dokumentation, Vorlagen, Update-Qualitaet und Vertrauen
3. Zu viel Individualservice macht Modell schnell unprofitabel

---

## Empfohlene Schwerpunkte

### 1. Distribution und Betriebsstabilitaet zuerst
Installer, Updates, Backup/Restore, Import/Export, Datenmigration, robuste PDFs/CSVs.
Fuer das Zielsegment kaufnaeher als technische Raffinesse.

### 2. Templates und fachliche Defaults ausbauen
In diesem Segment oft staerker als Funktionsvergleiche mit grossen Suites.
Gute Vorlagen und richtige Standardwerte sind schwerer zu kopieren als Code.

### 3. Support als standardisiertes Produkt denken
Klarer Leistungsrahmen: Installationshilfe, Updatehilfe, Datenimporthilfe,
bekannte Vorlagen, priorisierte Antworten in realistischen Grenzen.

### 4. Unterversorgte Low-Price-Nischen im DACH-Raum
Bereiche mit: klaren Formularen, Listen, PDFs, Berechnungen, lokaler Datenhaltung,
wenig Integrationsbedarf, schwacher UX bei Altsoftware.

---

## Gruender-Kontext

- Hintergrund: Enterprise Standard Software Customizing fuer Grosskunden
- Ziel: Nicht mehr Zeit gegen Geld tauschen
- Beobachtung: Kleinkunden suchen stabile Produkte
- Validierung: 1-2 kleine Vereine + Kontakte im Finanzsektor
- Hohe Automation wichtig: "Fabrik im Koffer" — Self-Hosting, Bootstrapping,
  automatisch auf 1-2 Hosting-Providern installierbar
- Wer Cloud will, wird nicht zurueckgehalten — Fokus auf die, die lokal bevorzugen

### Strategische Staerke des Gruenders

1. **Versteht produktionsreife Software** — Installierbarkeit, Updates, Migration,
   Backup/Restore, Robustheit (Enterprise-Hintergrund)
2. **Kennt Fachdomaenen** — Vereine und Finanz-/Maklerumfeld (keine sexy Maerkte,
   aber echte Zahlungsbereitschaft fuer Zuverlaessigkeit)
3. **Denkt in Plattformen** — reproduzierbare Installation, Provider-unabhaengig

### Wichtigster strategischer Punkt

Nicht unbemerkt in Dienstleistungsmodell zurueckrutschen.
Gefahr durch: "kleine Sonderlogik", "schnelle Importanpassung", "eine Spezialauswertung".
Genau dort stirbt die Automatisierung.

### Drei Ebenen der Architektur

1. **Produktkern** — Fachlogik, Datenmodell, Regeln, Reports, Templates
2. **Plattformkern** — Lizenz, Update, Migration, Audit-Log, Backup/Restore,
   Import/Export, Konfiguration, Packaging
3. **Betriebs-/Deploymentschicht** — Bootstrap, Self-Hosting, Provider-Setups,
   Secrets, Monitoring, Recovery

### Markthypothese

- Vereinssoftware: gutes Lern- und Referenzfeld
- Finanz-/Makler-Tools: wirtschaftlich staerkere Produktlinie
