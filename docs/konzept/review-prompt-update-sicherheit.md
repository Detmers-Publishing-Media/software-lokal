# Review-Prompt: Update-Sicherheit ohne Support

## Auftrag

Pruefe das Konzept `docs/konzept/update-sicherheit-ohne-support.md` gegen
die bestehende Architektur und identifiziere Luecken, Widersprueche und
fehlende Massnahmen.

## Kontext

- Produkte: Desktop-Apps (Electron + SQLite), Zielgruppe Kleinunternehmer/Vereine
- Geschaeftsmodell: 39 EUR/Jahr fuer Updates, kein persoenlicher Support
- Bestehende Architektur: `docs/konzept/architektur-integritaet-tests.md`
- Test-Konventionen: `docs/test-conventions.md`
- Aktuelle Tests: 366 gesamt (electron-platform: 94, mitglieder-lokal: 74,
  finanz-shared: 48, finanz-rechner: 23, portal: 127)

## Pruefkriterien

### 1. Architektur-Konsistenz
- Stimmt das Konzept mit `architektur-integritaet-tests.md` ueberein?
- Gibt es Widersprueche bei Versionsgrenzen, Replay-Trigger, Backup-Verhalten?
- Ist die Testkategorie 8 (Fehlerfall-Tests) kompatibel mit den bestehenden 7?

### 2. Migrations-Zuverlaessigkeit
- Deckt die Migrations-Test-Matrix alle realistischen Upgrade-Pfade ab?
- Was passiert bei MAJOR-Version-Spruengen (v1.x → v2.x)?
- Wie wird mit Schema-Aenderungen umgegangen, die NICHT additiv sind
  (z.B. Spalte umbenannt, Tabelle aufgeteilt)?

### 3. Fehlerszenarien
- Welche Fehler koennen auftreten, die NICHT durch automatisches Backup
  abgefangen werden (z.B. Festplatte voll, Berechtigungsfehler)?
- Ist die Lock-Datei-Strategie bei parallelem Start robust genug?
- Was passiert wenn der Benutzer die App waehrend einer Migration killt?

### 4. Benutzerkommunikation
- Sind die Fehlermeldungen fuer Nicht-Techniker verstaendlich?
- Gibt es Situationen wo "laden Sie die neueste Version herunter" nicht reicht?
- Braucht es eine "Notfall-Kontaktmoeglichkeit" (z.B. GitHub Issue)?

### 5. DSGVO / Datenschutz
- Sind die anonymen Crash-Reports wirklich anonym (keine IP-Speicherung)?
- Braucht das Opt-in fuer Crash-Reports eine Datenschutzerklaerung?
- Wie wird sichergestellt, dass Backup-Dateien nicht unverschluesselt
  auf der Festplatte liegen?

### 6. Geschaeftsmodell-Risiken
- Ist "kein Support" bei 39 EUR/Jahr marktfaehig?
  (Vergleich: Sublime Text, Obsidian, Standard Notes)
- Ab welcher Nutzerzahl wird die Wissensdatenbank nicht mehr ausreichen?
- Gibt es rechtliche Pflichten (Gewaehrleistung, Verbraucherschutz) die
  ein Minimum an Erreichbarkeit erfordern?

### 7. Fehlende Bausteine
- Welche der 11 Abhaengigkeiten (Abschnitt 9) sind kritisch fuer v1.0?
- Was fehlt im Konzept, das andere "No-Support"-Produkte haben?
- Braucht es ein Community-Forum (GitHub Discussions) als Ventil?

## Erwartetes Ergebnis

1. Liste mit Luecken und Widerspruechen (priorisiert: Blocker / Wichtig / Nice-to-have)
2. Konkrete Aenderungsvorschlaege fuer das Konzept
3. Empfehlung: Ist das Modell so umsetzbar oder fehlen kritische Teile?
