# Code-Fabrik — Release-Historie

Stand: 2026-03-07

---

## Releases

| Version | Name | Beschreibung | Status |
|---------|------|-------------|--------|
| v0.3.0 | Basis-Infrastruktur | UpCloud Server + Forgejo + Gateway (OpenClaw) | Done |
| v0.3.1 | Cloud-Init Fix | DEV-Plan Parameter (`DEV-1xCPU-4GB`, `hdd`, `40GB`, `metadata: "yes"`) | Done |
| v0.4.0 | Konzept | Architektur-Entscheidungen, ADRs | Done |
| v0.4.1 | Portal "Pfoertner" | Portal mit 4 Flows: Buy, Support, Ideas, Requests | Done |
| v0.4.2 | Nachtwache | Nacht-Stopp, Poller Retry-Logik, Metriken | Done |
| v0.5.0 | Kassenschluss | Digistore24 IPN-Integration, Lizenzkey-Lifecycle | Done |
| v0.5.5 | Produkttexte | Text-Generator aus spec.yml, YAML-Generator | Done |
| v0.5.6 | Testkauf-Flow | MitgliederSimple Seed, Forgejo Release, Download-Seite | Done |
| v0.5.7 | Kompass | Gesamtkonzept, Roadmap, naechste Schritte (Dokumentation) | Done |
| v0.6.0 | Mitglieder | MitgliederSimple v0.1 (CRUD + CSV-Export) | Done |
| — | MitgliederSimple v0.3 "Protokoll" | Event-Log, Hash-Kette, Schema-Meta, 7 Testkategorien | Done |
| — | MitgliederSimple v0.4 "Beitrag" | Beitragsverwaltung, Zahlungen, Mahnbriefe | Done |
| v0.6.3 | Taschenrechner | Finanz-Rechner v0.1.0 — 5 Makler-Rechner (Bundle B-24) | Done |
| v0.6.4 | Fabrik im Koffer | Versioned Tarballs, Sichern-Funktion, install.sh Ueberarbeitung | Done |
| v0.6.5 | Lizenzstrategie | GPL 3.0 + Support-Abo, Dokument-Ueberarbeitung | Done |
| v0.6.6 | GitHub CI | Private Repos + GitHub Actions Workflows, Code gepusht | Done |
| v0.6.7 | Prozessmodell v2 | Governance-Gates im Poller, story-types.yml, CI-Guardrails, Cross-Import-Regel | Done |
| v0.7.0 | Lizenz & Support | Digistore IPN + CFML-Keys, Support-Tickets (HMAC), Trial-Keys (CFTM/CFTR), control.sh Kontrollzentrum, LicenseSection + SupportView UI | Done |
| v0.8.0 | Hygiene | Tauri-Remnants bereinigt, Nuke-before-Install, knip + Ansible-Lint, Migrations-Checkliste, CLAUDE.md-Pflege-Regeln | Done |

---

## Infrastruktur-Stand (v0.7.0)

### PROD-Server (UpCloud)
- **UUID:** `00dbbeb7-0f85-4303-aaa1-c509336890d4`
- **Plan:** DEV-1xCPU-4GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@<IP aus .server-env>`
- **Dienste:** Forgejo (:3000), Gateway (:3100), Poller (systemd Timer 30s), Nightstop
- **Governance:** story-types.yml + protected-paths.yml + validate-story-governance.mjs auf Server

### Portal-Server (UpCloud)
- **Plan:** DEV-1xCPU-1GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@<IP aus .portal-env>`
- **Dienste:** Portal-App, Dispatcher, Portal-DB (PostgreSQL), Caddy, Watchdog (5min Timer)
- **Hinweis:** Portal-Server wird bei jedem Install neu erstellt (IP aendert sich)

### DNS (Cloudflare)
- Zone: `detmers-publish.de`
- Subdomains: `git-codefabrik`, `gateway-codefabrik`, `portal-codefabrik`

### Deployment
- **Kontrollzentrum:** `scripts/control.sh` — Monitoring, Trial-Keys, delegiert Install/Sichern
- **Installer:** `dist/install.sh` + `dist/codefabrik-v0.7.0.tar.gz` + KeePass-DB
- **Ansible:** 5-Phasen `install.yml` (PROD mit Update-Modus), 7-Phasen `install-portal.yml` (Portal)
- **Secrets:** KeePass (`Code-Fabrik-V1-0.kdbx`) → /dev/shm → Docker → Ansible
- **Teardown:** `teardown.yml` (PROD), `teardown-portal.yml` (Portal)
- **CI/CD:** GitHub Actions (Private Repos im Team-Plan), Forgejo fuer interne Infra + Governance-Validierung

### GitHub Organisation (ab v0.6.6)
- **Org:** `Detmers-Publishing-Media` (Team-Plan)
- **Account:** `detmerspublish`
- **Repos (privat bis v1.0):**
  - `Detmers-Publishing-Media/mitglieder-simple` — v0.4.0 gepusht
  - `Detmers-Publishing-Media/finanz-rechner` — v0.1.0 gepusht
- **CI/CD:** GitHub Actions Workflows (`build-windows.yml`) in beiden Repos
- **Auth:** GitHub CLI (`gh`) + Classic PAT (`github-push-token`, Scopes: `repo`, `read:org`)

### Produkte
- **fruehwarnreport** (Python) — Referenz-Implementierung, 24 pytest Tests
- **mitglieder-simple** (Svelte 5 + Tauri) — v0.5.0, Support-UI + LicenseSection, auf GitHub
- **finanz-rechner** (Svelte 5 + Tauri) — v0.2.0, Support-UI + LicenseSection, auf GitHub
- **vereins-shared** (Shared Library) — DataTable, SearchBar, ExportButton, LicenseSection, SupportView

### Externe Dienste
- **Digistore24:** Testprodukt konfiguriert, IPN-Anbindung `detmers-publish-dev`
- **UpCloud:** Managed PostgreSQL 16 (de-fra1)
- **Cloudflare:** SSL Full (Strict), Origin CA Wildcard

### Bekannte Luecken
- **Seed-Products fehlerhaft:** `ansible.builtin.copy` bricht bei grossen Produktverzeichnissen ab (node_modules). Workaround: manuell oder rsync.
- **Managed PostgreSQL wird nicht abgerissen:** Teardown loescht nur Server, nicht die DB.
- **Kein DB-Backup im Installer:** Vor Teardown/Umzug muss DB manuell gesichert werden.
- **Kein DB-Restore:** Nach Neuinstallation keine automatische Wiederherstellung.
- **Pipeline Smoke-Test Timeout:** STORY-000099 wird nicht innerhalb 10 Min verarbeitet (kein Blocker, nur Timeout im Test).
