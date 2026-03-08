# Review-Prompt: Produktstrategie Mitglieder Lokal

## Kontext für den Reviewer

Du bist ein erfahrener Produktstratege für Desktop-Software im deutschsprachigen Vereinsumfeld.
Du reviewst die Feature-Übersicht und Produktstrategie von **Mitglieder Lokal** — einer lokalen
Desktop-Vereinsverwaltung (Electron + Svelte 5 + SQLite, GPL-3.0, 29 EUR/Jahr).

Lies folgende Dokumente als Grundlage (alle im selben Repository):

1. **Feature-Übersicht & Wettbewerbsvergleich**: `products/mitglieder-lokal/docs/feature-uebersicht.md`
2. **Produktspezifikation (5-Stufen-Roadmap)**: `products/mitglieder-lokal/docs/produktspec.md`
3. **Gesamtkonzept Code-Fabrik**: `docs/konzept/gesamtkonzept-v3.md`
4. **Electron-Plattform-Architektur**: `docs/konzept/electron-plattform-architektur.md`
5. **Architektur Integrität & Tests**: `docs/konzept/architektur-integritaet-tests.md`
6. **Mehrbenutzerbetrieb (Entwurf)**: `docs/konzept/mehrbenutzerbetrieb.md`
7. **Roadmap**: `docs/roadmap/ROADMAP-v0.6.md`

---

## Aufgabenstellung

### Teil 1: Feature-Review gegen Architektur und Zielgruppe

Prüfe die Feature-Übersicht (Abschnitte 1.1–1.8) gegen folgende Kriterien:

- **Architektur-Fit**: Sind alle geplanten Features mit der bestehenden Electron + SQLite + Event-Log-Architektur umsetzbar, ohne die Architektur zu verbiegen?
- **Zielgruppen-Fit**: Die Zielgruppe sind kleine Vereine (20–500 Mitglieder) mit ehrenamtlichem Vorstand. Typischerweise verwaltet **eine einzelne Person** (Schriftführer oder Vorsitzender) die Mitgliederdaten. Gibt es Features, die für diese Zielgruppe überdimensioniert sind?
- **Alleinstellungsmerkmale**: Sind Ehrenamtsstunden und Versammlungsprotokoll tatsächlich tragfähige Differenzierungsmerkmale, oder sind das Nischenfeatures die kaum genutzt werden?
- **Bewusste Lücken**: Sind die unter 1.8 aufgelisteten Ausschlüsse strategisch klug, oder fehlt etwas, das die Zielgruppe dringend braucht?

### Teil 2: Strategische Kernfrage — Mehrplatzbetrieb

Im Repository existiert ein Entwurf für Mehrbenutzerbetrieb (`docs/konzept/mehrbenutzerbetrieb.md`).
Das Konzept sieht Local-First-Sync vor: Jeder Nutzer hat eine lokale SQLite-DB, Events werden
über einen Sync-Server (PostgreSQL) ausgetauscht, Konflikte auf Feldebene aufgelöst.

**Die zentrale Frage ist nicht "wie", sondern "ob".**

Diskutiere kritisch:

**Argumente GEGEN Mehrplatzbetrieb:**
- Bei kleinen Vereinen verwaltet typischerweise eine Person die Daten — braucht man da überhaupt Mehrplatz?
- Die vier Kernversprechen sind: Keine Cloud, keine Abhängigkeit, kein Kontakt nötig, kein Geheimnis. Ein Sync-Server widerspricht "Keine Cloud".
- Conflict Resolution bei SEPA-Mandaten, DSGVO-Löschungen und der Event-Log-Hash-Kette ist extrem komplex. Lohnt sich das für 29 EUR/Jahr?
- Komplexitätsexplosion: SQLCipher + Event-Log + Hash-Kette + Sync + Conflict-UI + RLS — das ist Architektur für ein Enterprise-Produkt, nicht für ein 29-EUR-Tool.
- Jede Sync-Funktion ist eine neue Fehlerquelle (Netzwerk, Konflikte, Datenverlust-Risiko). Ein kleiner Verein hat keinen Admin, der das debuggt.

**Argumente FÜR Mehrplatzbetrieb:**
- Manche Vereine haben Arbeitsteilung: Schatzmeister pflegt Beiträge, Schriftführer pflegt Mitglieder.
- Vereinsübergabe (Vorstandswechsel) ist ein realer Pain Point — wie kommt der neue Vorstand an die Daten?
- Ohne Mehrplatz ist "USB-Stick weitergeben" oder "Cloud-Ordner mit SQLite-Datei" die Realität — das ist fragil.

**Bitte bewerte:**

1. Ist Mehrplatzbetrieb für die definierte Zielgruppe (20–500 Mitglieder, ehrenamtlich, eine Verwaltungsperson) ein echtes Kundenbedürfnis oder Over-Engineering?
2. Falls ja — gibt es eine einfachere Alternative als Local-First-Sync? Z.B.:
   - **Einfacher Dateiexport/-import** (DB-Datei kopieren + Übergabe-Assistent)
   - **Read-Only-Zweitinstanz** (Schatzmeister sieht, Schriftführer schreibt)
   - **Backup-basierte Übergabe** (automatisches Backup → Cloud-Ordner → zweiter Rechner öffnet Backup)
   - **Gar nichts** — das Problem mit USB-Stick/Cloud-Ordner ist gut genug für kleine Vereine
3. Falls Mehrplatz gebaut werden soll — ab welcher Version? Oder ist das ein separates Produkt / Preistier (z.B. 79 EUR/Jahr für Mehrplatzlizenz)?

### Teil 2b: Alternativ-Szenario — "WebConnect als Datensicherung mit Nebeneffekt-Mehrplatz"

Statt Full-Sync gibt es einen pragmatischeren Ansatz, der aus der bestehenden Backup-Architektur
heraus wächst:

**Grundidee:**
- Nutzer A (Hauptnutzer) arbeitet lokal, wie bisher.
- Wenn A fertig ist, gibt A den aktuellen Datenstand über "WebConnect" frei (= verschlüsseltes Backup auf einen einfachen Sync-Endpunkt, z.B. Portal oder WebDAV).
- Nutzer B (Schatzmeister, zweiter Vorstand) kann diesen Stand auf seinem Rechner abrufen und damit arbeiten.
- Das Feature wird primär als **Datensicherung** vermarktet — Mehrplatz ist der Nebeneffekt.

**Das passt zur bestehenden Architektur:**
- Backup-Core existiert bereits (VACUUM INTO, Rotation, Validierung).
- SQLCipher-verschlüsselte DB-Datei ist portabel.
- Event-Log mit Hash-Kette ermöglicht Integritätsprüfung nach dem Abruf.

**Das Kernproblem: Inkonsistenz durch veraltete Datenstände.**

Szenario: A gibt Stand von Montag frei. B arbeitet Dienstag auf diesem Stand weiter.
A arbeitet ebenfalls Dienstag weiter. Mittwoch haben beide divergierende Datenbestände.

Mögliche Lösungsansätze — bitte bewerte jeden:

1. **Exklusiv-Lock ("Staffelstab-Prinzip")**
   - Nur wer den aktuellsten Stand hat, darf schreiben.
   - Beim Abruf eines Stands wird die Quelle als "read-only" markiert, bis der Stand zurückgegeben wird.
   - Einfach, aber blockierend: Wenn B den Staffelstab hat und im Urlaub ist, steht A still.
   - Braucht Notfall-Override ("Staffelstab zurückholen"), was das Lock-Konzept wieder aufweicht.

2. **Versions-Check beim Freigeben ("Optimistic Locking")**
   - Jeder Stand hat eine Versionsnummer (= letzter Event-Hash oder Schema-Version).
   - Beim Hochladen prüft das System: "Basiert dein Stand auf der letzten freigegebenen Version?"
   - Falls nein → Warnung: "Es gibt einen neueren Stand. Zuerst abrufen, dann weiterarbeiten."
   - Kein Merge, kein Conflict-Resolution — einfach: "Einer gewinnt, der andere muss neu laden."
   - Datenverlust-Risiko: B's Änderungen sind weg, wenn B nicht vorher exportiert hat.

3. **Append-Only-Event-Merge (nutzt das vorhandene Event-Log)**
   - Statt die ganze DB zu tauschen, werden nur neue Events seit der letzten Synchronisation ausgetauscht.
   - Events sind append-only und enthalten vollständige Snapshots → Merge ist deterministisch.
   - Konflikte: Zwei Events auf derselben Entity mit unterschiedlicher Basis → Konflikt-Dialog.
   - Deutlich komplexer, aber die Event-Log-Architektur ist genau dafür designed.
   - Frage: Rechtfertigt die Zielgruppe (kleine Vereine, eine Verwaltungsperson) diesen Aufwand?

4. **Gar kein Mehrplatz-Schreibzugriff**
   - WebConnect = reine Datensicherung + Read-Only-Abruf für Zweitnutzer.
   - B kann den Stand einsehen, PDFs drucken, Beitragsübersichten prüfen — aber nicht schreiben.
   - Schreibrecht bleibt exklusiv beim Hauptnutzer.
   - Für Vorstandswechsel: A exportiert, B importiert → B wird neuer Hauptnutzer.
   - Einfachste Lösung. Frage: Reicht das für 90% der Vereine?

**Bitte bewerte:**
- Welcher Ansatz passt am besten zur Zielgruppe und zum 29-EUR-Preispunkt?
- Ist "Datensicherung mit Read-Only-Zweitnutzer" (Ansatz 4) für v1.0 ausreichend?
- Falls ein Schreibzugriff für Zweitnutzer nötig ist: Staffelstab (1) oder Optimistic Locking (2)?
- Ist Ansatz 3 (Event-Merge) die richtige Langfrist-Architektur für v2.0, oder ist das Over-Engineering für die Zielgruppe?

### Teil 3: Release-Priorisierung

Gegeben den aktuellen Stand (v0.5.0, 74 Tests, Mitglieder-CRUD + Beiträge + PDF funktionieren):

1. **Welche Features aus der Übersicht haben den höchsten ROI** für den ersten zahlenden Kunden?
2. **Was kann auf v2.0+ verschoben werden** ohne die Wettbewerbsfähigkeit zu gefährden?
3. **Gibt es ein "v1.0-Minimal"** das kleiner ist als die Feature-Übersicht, aber trotzdem als vollwertiges Produkt verkaufbar ist?

### Teil 4: Preismodell-Validierung

- 29 EUR/Jahr unbegrenzt — ist das nachhaltig bei der Zielgruppe?
- Macht eine Staffelung Sinn (z.B. kostenlos bis 30 Mitglieder, 29 EUR ab 31)?
- Oder ist der Einheitspreis gerade die Stärke (Einfachheit, Vertrauen, kein Upselling)?

---

## Erwartetes Ergebnis

Liefere ein strukturiertes Review-Dokument mit:

1. **Feature-Bewertung**: Tabelle mit Ampel (grün/gelb/rot) pro Feature-Block (1.1–1.6)
2. **Strategieempfehlung Mehrplatz**: Klare Empfehlung mit Begründung (bauen / nicht bauen / einfache Alternative)
3. **Release-Schnitt v1.0**: Vorschlag welche Features rein müssen und welche nicht
4. **Preismodell-Feedback**: Bestätigung oder Alternative
5. **Top-3-Risiken**: Was kann schiefgehen, was wurde übersehen?

Schreibe auf Deutsch. Sei direkt und meinungsstark — kein Berater-Sprech, sondern klare Empfehlungen.
