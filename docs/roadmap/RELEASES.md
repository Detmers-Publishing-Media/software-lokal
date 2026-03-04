# Code-Fabrik — Release-Historie

Stand: 2026-03-04

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
| v0.5.7 | Kompass | Gesamtkonzept, Roadmap, naechste Schritte (Dokumentation) | **Aktuell** |

---

## Infrastruktur-Stand (v0.5.7)

### PROD-Server (UpCloud)
- **IP:** 212.147.229.108
- **Plan:** DEV-1xCPU-4GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@212.147.229.108`
- **Dienste:** Forgejo (:3000), Gateway (:3100), Poller (systemd Timer 30s), Nightstop

### Portal-Server (UpCloud)
- **IP:** 212.147.229.1
- **Plan:** DEV-1xCPU-1GB, de-fra1
- **SSH:** `ssh -i ~/.ssh/codefabrik_deploy root@212.147.229.1`
- **URL:** http://212.147.229.1:3200
- **Dienste:** Portal-App, Dispatcher, Portal-DB (PostgreSQL), Caddy, Watchdog (5min Timer)

### DNS (Cloudflare)
- Zone: `detmers-publish.de`
- Subdomains: `git-codefabrik`, `gateway-codefabrik`, `portal-codefabrik`

### Deployment
- **Ansible:** 5-Phasen `install.yml` (PROD), 7-Phasen `install-portal.yml` (Portal)
- **Secrets:** KeePass (`Code-Fabrik-V1-0.kdbx`) + `.env`-Dateien auf Servern
- **Teardown:** `teardown.yml` (PROD), `teardown-portal.yml` (Portal)

### Produkte
- **fruehwarnreport** (Python) — Referenz-Implementierung, 24 pytest Tests
- **mitglieder-simple** (SvelteKit + Tauri) — Seeded in Portal-DB
- **vereins-shared** (Tauri Library) — Shared Components

### Externe Dienste
- **Digistore24:** Testprodukt konfiguriert, IPN-Anbindung `detmers-publish-dev`
- **UpCloud:** Managed PostgreSQL 16 (de-fra1)
- **Cloudflare:** SSL Full (Strict), Origin CA Wildcard
