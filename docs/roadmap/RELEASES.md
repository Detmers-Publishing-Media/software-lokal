# Code-Fabrik — Release-Historie

Stand: 2026-03-06

---

## Releases

| Version | Name | Beschreibung | Status |
|---------|------|-------------|--------|
| v0.3.0 | Basis-Infrastruktur | UpCloud Server + Forgejo + Gateway (OpenClaw) | Done |
| v0.3.1 | Cloud-Init Fix | DEV-Plan Parameter (`DEV-1xCPU-4GB`, `hdd`, `40GB`, `metadata: "yes"`) | Done |
| v0.4.0 | Konzept | Architektur-Entscheidungen, ADRs | Done |
| v0.4.1 | Portal "Pfoertner" | Portal mit 4 Flows: Buy, Support, Ideas, Requests | Done |
| v0.4.2 | Nachtwache | Nacht-Stopp, Poller Retry-Logik, Metriken | Spec vorhanden, teilw. impl. |
| v0.5.0 | Kassenschluss | Digistore24 IPN-Integration, Lizenzkey-Lifecycle | Done |
| v0.5.5 | Produkttexte | Text-Generator aus spec.yml, YAML-Generator | Done |
| v0.5.6 | Testkauf-Flow | MitgliederSimple Seed, Forgejo Release, Download-Seite | Done |
| v0.5.7 | Kompass | Gesamtkonzept, Roadmap, naechste Schritte (Dokumentation) | Done |
| v0.6.0 | Mitglieder | MitgliederSimple v0.1 (CRUD + CSV-Export) | Done |
| v0.6.1 | Mitglieder v0.2 | MitgliederSimple nach Referenzkunden-Feedback | Geplant |
| v0.6.2 | Pruefstand | GitHub Actions + EXE-Erstellung | **Aktuell** |
| — | MitgliederSimple v0.3 "Protokoll" | Event-Log, Hash-Kette, Schema-Meta, 7 Testkategorien | Done |
| — | MitgliederSimple v0.4 "Beitrag" | Beitragsverwaltung, Zahlungen, Mahnbriefe | Done |
| v0.6.3 | Taschenrechner | Finanz-Rechner v0.1.0 — 5 Makler-Rechner (Bundle B-24) | **Aktuell** |
| v0.6.4 | Fabrik im Koffer | Versioned Tarballs, Sichern-Funktion, install.sh Ueberarbeitung | Done |
| v0.6.5 | Lizenzstrategie | GPL 3.0 + Support-Abo, Dokument-Ueberarbeitung | Done |
| v0.6.6 | GitHub CI | Private Repos + GitHub Actions Workflows, Code gepusht | Done |

---

## Infrastruktur-Stand (v0.6.0)

### PROD-Server (UpCloud)
- **IP:** 212.147.231.41
- **Plan:** DEV-1xCPU-4GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@212.147.231.41`
- **Dienste:** Forgejo (:3000), Gateway (:3100), Poller (systemd Timer 30s), Nightstop

### Portal-Server (UpCloud)
- **IP:** 212.147.229.1
- **Plan:** DEV-1xCPU-1GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@212.147.229.1`
- **URL:** http://212.147.229.1:3200
- **Dienste:** Portal-App, Dispatcher, Portal-DB (PostgreSQL), Caddy, Watchdog (5min Timer)
- **Hinweis:** Portal-Server muss ggf. nach Teardown neu erstellt werden

### DNS (Cloudflare)
- Zone: `detmers-publish.de`
- Subdomains: `git-codefabrik`, `gateway-codefabrik`, `portal-codefabrik`

### Deployment
- **Ansible:** 5-Phasen `install.yml` (PROD), 7-Phasen `install-portal.yml` (Portal)
- **Secrets:** KeePass (`Code-Fabrik-V1-0.kdbx`) + `.env`-Dateien auf Servern
- **Teardown:** `teardown.yml` (PROD), `teardown-portal.yml` (Portal)
- **CI/CD:** GitHub Actions (Private Repos im Team-Plan, ab v1.0 kostenlos), Forgejo fuer interne Infra

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
- **mitglieder-simple** (SvelteKit + Tauri) — Seeded in Portal-DB, auf GitHub
- **finanz-rechner** (SvelteKit + Tauri) — 5 Makler-Rechner, auf GitHub
- **vereins-shared** (Tauri Library) — Shared Components

### Externe Dienste
- **Digistore24:** Testprodukt konfiguriert, IPN-Anbindung `detmers-publish-dev`
- **UpCloud:** Managed PostgreSQL 16 (de-fra1)
- **Cloudflare:** SSL Full (Strict), Origin CA Wildcard

### Bekannte Luecken
- **Managed PostgreSQL wird nicht abgerissen:** Teardown loescht nur Server, nicht die DB.
  → TODO: Optionaler Task mit Sicherheitsabfrage
- **Kein DB-Backup im Installer:** Vor Teardown/Umzug muss DB manuell gesichert werden.
  → TODO: `backup`-Playbook + Menue-Option (pg_dump → USB-Stick)
- **Kein DB-Restore:** Nach Neuinstallation keine automatische Wiederherstellung.
  → TODO: `restore`-Playbook das Dumps aus `/output/backup/` einspielt
- **Website offline bei Neuaufbau:** Install reisst alles ab inkl. Portal/Website.
  → TODO: Separater Website-Server der beim Neuaufbau stehen bleibt
- Siehe `docs/konzept/fabrik-im-koffer.md` fuer Details
