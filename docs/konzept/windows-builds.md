# Windows-Builds: GitHub Actions

Stand: 2026-03-05
Status: Entscheidung getroffen — Umsetzung steht bevor

---

## Kontext

Entscheidung (Maerz 2026): **GitHub Actions** fuer Windows-Builds (Tauri EXE/MSI).
Ersetzt fruehere Plaene mit CircleCI, Azure DevOps und AppVeyor.

Ziel: Windows-EXE-Erstellung fuer Tauri-Apps (MitgliederSimple, Finanz-Rechner).
Lizenzmodell: GPL (verzoegertes Open Source) — Code ist public auf GitHub.

---

## Warum GitHub Actions

### Evaluierte Alternativen

| Kriterium | GitHub Actions | AppVeyor | CircleCI | Azure Pipelines |
|-----------|---------------|----------|----------|-----------------|
| Preis (public) | **$0, unbegrenzt** | $0 (1 Job) | $0 (begrenzt) | $0 (begrenzt) |
| Preis (privat) | 2000 Min/Monat frei | $25/Monat | ~$30/Monat | $40/Monat |
| Windows-Runner | Ja | Ja | Ja | Ja |
| Mirror noetig | Nein (Code ist auf GitHub) | Nein (Forgejo nativ) | Ja (GitHub-Mirror) | Ja (Azure Repos) |
| Separater Service | Nein (alles GitHub) | Ja | Ja | Ja |

### Entscheidende Vorteile

1. **Alles an einem Ort**: Code + CI/CD + Releases auf GitHub. Kein separater Service.
2. **Komplett kostenlos**: Unbegrenzte Build-Minuten fuer oeffentliche Repos.
3. **Kein Mirror-Overhead**: Code liegt direkt auf GitHub (public, GPL).
4. **GitHub Releases als Distribution**: Digistore Download-Link zeigt auf Release Asset.

---

## Zwei-Repo-Strategie: Forgejo + GitHub

### Ueberblick

```
Forgejo (intern, privat)              GitHub (oeffentlich, GPL)
────────────────────────              ─────────────────────────
factory/mitglieder-simple             Detmers-Publishing-Media/mitglieder-simple
  - CI/CD Entwicklung                   - Release-Code
  - Interne Branches                    - GitHub Actions → Windows EXE
  - Experimente                         - Community-Zugang
  - Forgejo Actions (Linux-Tests)       - Digistore Download-Quelle
```

### Flow

```
Forgejo (Entwicklung)
  ↓  Release fertig, getestet
release-push.sh (gezielter Push nach GitHub)
  ↓
GitHub (public, GPL)
  ↓  GitHub Actions triggert automatisch
Windows VM baut EXE + MSI (kostenlos)
  ↓
GitHub Release → EXE als Asset angehaengt
  ↓
Digistore-Kunde → Download-Link auf GitHub Release
Community → klont von GitHub, kompiliert selbst
```

### Was auf GitHub landet, was nicht

| Was | GitHub | Forgejo |
|-----|--------|---------|
| Produktionscode (src/) | Ja | Ja |
| Tests (tests/) | Ja | Ja |
| CHANGELOG, README, LICENSE | Ja | Ja |
| `.github/workflows/` | Ja | Ja |
| `appveyor.yml` / `.forgejo/` | Nein | Ja |
| Interne Infra-Scripts | Nein | Ja |
| Work-in-Progress Branches | Nein | Ja |
| Portal-Code, Ansible | Nein | Ja |

### Verzoegertes Open Source

Optional: immer eine Version zurueck veroeffentlichen.

- v1.0 verkaufen als Binary (Digistore)
- Gleichzeitig v0.9 Source auf GitHub veroeffentlichen
- Community ist eine Version hinter zahlenden Kunden
- GPL-konform solange Source irgendwann veroeffentlicht wird

---

## GitHub-Account-Struktur

```
github.com/detmerspublish                              ← Persoenlicher Account
github.com/Detmers-Publishing-Media/                    ← Organisation
  Detmers-Publishing-Media/mitglieder-simple            ← Public, GPL-3.0
  Detmers-Publishing-Media/finanz-rechner               ← Public, GPL-3.0
```

- `detmerspublish` als Owner der Org `Detmers-Publishing-Media`
- Produkt-Repos public unter der Org (GPL-3.0)
- Spaeter Contributor hinzufuegen falls noetig

---

## Build-Konfiguration: GitHub Actions

### SQLCipher auf Windows

`bundled-sqlcipher-vendored-openssl` in rusqlite kompiliert SQLCipher + OpenSSL
vollstaendig aus dem Source mit rein. Kein vcpkg, kein externes OpenSSL.

In `Cargo.toml`:
```toml
[dependencies]
rusqlite = { version = "0.32", features = ["bundled-sqlcipher-vendored-openssl"] }
```

### `.github/workflows/build-windows.yml`

```yaml
name: Windows Build

on:
  push:
    tags:
      - 'v*'
    branches:
      - main

permissions:
  contents: write  # fuer Release-Upload

env:
  RUST_BACKTRACE: 1

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Rust Cache
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Install WebView2
        shell: powershell
        run: |
          choco install webview2-runtime -y --no-progress

      - name: Install dependencies
        run: pnpm install

      - name: Build Tauri App
        run: pnpm tauri build

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/msi/*.msi

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/msi/*.msi
          generate_release_notes: true
```

### Build-Zeiten (geschaetzt)

- **Erster Build** (ohne Cache): ~20-25 Minuten (Rust + SQLCipher Kompilierung)
- **Folge-Builds** (mit Rust-Cache): ~8-12 Minuten
- **Limit**: Keins fuer public Repos

---

## Release-Push: Forgejo → GitHub

### Script: `scripts/release-to-github.sh`

```bash
#!/bin/bash
# Gezielter Push eines Release-Tags nach GitHub
# Verwendung: ./release-to-github.sh v0.4.2
set -euo pipefail

TAG="${1:?Verwendung: $0 <tag>}"
GITHUB_REMOTE="github"

# Pruefen ob Remote existiert
if ! git remote get-url "$GITHUB_REMOTE" &>/dev/null; then
    echo "GitHub Remote '$GITHUB_REMOTE' nicht konfiguriert."
    echo "Einmalig einrichten:"
    echo "  git remote add github git@github.com:Detmers-Publishing-Media/mitglieder-simple.git"
    exit 1
fi

# Tag + zugehoeriger Commit pushen
git push "$GITHUB_REMOTE" "$TAG"
git push "$GITHUB_REMOTE" main

echo "Tag $TAG nach GitHub gepusht."
echo "GitHub Actions baut jetzt automatisch die Windows-EXE."
```

### Einmalige Einrichtung pro Produkt-Repo (Forgejo)

```bash
# GitHub als zusaetzliches Remote hinzufuegen
git remote add github git@github.com:Detmers-Publishing-Media/mitglieder-simple.git
```

---

## Umsetzungsplan

### Voraussetzungen

- [x] GitHub Org `Detmers-Publishing-Media` erstellt (unter `detmerspublish`)
- [x] Repo `Detmers-Publishing-Media/mitglieder-simple` erstellt (public, GPL-3.0)
- [x] Repo `Detmers-Publishing-Media/finanz-rechner` erstellt (public, GPL-3.0)
- [ ] SSH-Key oder Token fuer Push von Forgejo nach GitHub

### Schritt 1: GitHub-Repo einrichten

1. ~~GitHub Org + Repos erstellen~~ — erledigt
2. In Forgejo: `git remote add github git@github.com:Detmers-Publishing-Media/mitglieder-simple.git`

### Schritt 2: Workflow ins Repo

1. `.github/workflows/build-windows.yml` erstellen (siehe Config oben)
2. `Cargo.toml` pruefen: `bundled-sqlcipher-vendored-openssl` Feature aktiv
3. Push nach GitHub → Actions triggert automatisch

### Schritt 3: Erster Test

1. Build in GitHub Actions verfolgen (Tab "Actions" im Repo)
2. Logs pruefen: Rust-Cache, pnpm install, Tauri-Build

Erfolgskriterien:
- [ ] GitHub Actions startet auf `windows-latest`
- [ ] Rust + Node + pnpm korrekt installiert
- [ ] `pnpm tauri build` erzeugt `.exe` / `.msi`
- [ ] Artefakt als Download im Actions-Run verfuegbar
- [ ] Bei Tag-Push: GitHub Release mit EXE/MSI als Assets

### Schritt 4: Digistore-Integration

Download-Link in Digistore auf GitHub Release Asset zeigen:
```
https://github.com/Detmers-Publishing-Media/mitglieder-simple/releases/latest/download/MitgliederSimple_x64-setup.exe
```

### Schritt 5: Zweites Produkt (Finanz-Rechner)

Gleiche Struktur: `Detmers-Publishing-Media/finanz-rechner`, gleicher Workflow (angepasste Namen).

---

## GPL + KI-Code: Lizenzstrategie

### Warum GPL

1. **Urheberrecht bei KI-Code ungeklaert**: In Deutschland entsteht Urheberrecht nur
   durch menschliche Schoepfung. KI-generierter Code hat moeglicherweise keinen
   Urheberrechtsschutz. Bei GPL ist das egal — der Schutz basiert nicht auf
   Code-Exklusivitaet, sondern auf dem Service-Geschaeftsmodell.
2. **Transparenz**: Offener Code bei KI-Generierung schafft Vertrauen. Community kann
   Qualitaet pruefen und Sicherheitsluecken finden.
3. **Haftungsreduktion**: Offener Code → Fehler werden schneller gefunden.
   Bei proprietaerem KI-Code traegt man das Qualitaetsrisiko alleine.

### Geschaeftsmodell

- **Binary-Verkauf** ueber Digistore (Convenience — fertige EXE, kein Kompilieren)
- **Support-Vertrag** als eigenstaendiges Produkt
- **Quellcode** frei verfuegbar (GPL) — jeder kann selbst kompilieren
- **Wert**: Service + Integration + Support, nicht Code-Exklusivitaet

---

## Rechtliche TODOs (vor erstem Kunden)

| Thema | Dringlichkeit | Status |
|-------|---------------|--------|
| Arbeitsvertrag pruefen (Nebentaetigkeitsklausel) | Sofort | Offen |
| Impressum (Name, Adresse, E-Mail) | Vor Website-Launch | Offen |
| Datenschutzerklaerung (minimal, keine eigene Datenerhebung) | Vor Website-Launch | Offen |
| GPL-Compliance (Lizenzhinweise Drittanbieter) | Einmalig | Offen |
| AGBs mit Haftungsbegrenzung | Vor erstem Kunden | Offen |
| Steuer / Kleinunternehmer | Mit Steuerberater | Offen |

**Digistore uebernimmt**: Zahlungsabwicklung, Rechnungsstellung, Umsatzsteuer EU (OSS),
Widerrufsrecht, Kundendaten-Verwaltung (DSGVO fuer Kaufprozess).

---

## Secrets

| Secret | Wo gespeichert | Zweck |
|--------|----------------|-------|
| GitHub SSH-Key oder PAT | KeePass + Forgejo-Server | Push von Forgejo nach GitHub |

Keine weiteren Secrets noetig. GitHub Actions hat vollen Zugriff auf das eigene Repo.
Bisherige CI-Tokens (`circleci-api-token`, AppVeyor) koennen aus KeePass entfernt werden.

---

## Bekannte Risiken

- **WebView2 Build-Tools**: `webview2-com-sys` braucht VS C++ Build Tools.
  `windows-latest` Image hat Visual Studio vorinstalliert — sollte funktionieren.
- **Build-Dauer**: Erster Build ~20-25 Min. Mit `Swatinem/rust-cache` ~8-12 Min.
- **GitHub-Abhaengigkeit**: Code + CI + Releases bei einem Anbieter.
  Mitigiert durch Forgejo als interne Source-of-Truth.

---

## Historie

- **Maerz 2026 (frueh)**: Azure Pipelines mit Azure Repos Mirror getestet.
  Mirror-Overhead und Preis ($40/Monat) sprachen dagegen.
- **Maerz 2026 (mitte)**: CircleCI evaluiert → VCS-Anbindung noetig → GitHub-Mirror.
  AppVeyor als guenstigere Alternative mit Forgejo-direkt identifiziert.
- **Maerz 2026 (aktuell)**: GitHub Actions gewaehlt. Code geht ohnehin als GPL
  auf GitHub → Actions ist kostenlos, unbegrenzt, kein separater Service.
  AppVeyor und CircleCI gestrichen.
