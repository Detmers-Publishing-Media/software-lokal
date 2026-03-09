# Review-Prompt: Bug-Bounty-Scanning als Geschaeftsidee

## Kontext

Bewerte die Geschaeftsidee "Automatisiertes Bug-Bounty-Scanning" unter Nutzung
der bestehenden Code-Fabrik-Infrastruktur. Fokus: Inwieweit koennen
NICHT-STANDARD-Schwachstellen identifiziert werden (also ueber Standard-Nuclei-
Templates hinaus)?

## Bestehende Faehigkeiten (Code-Fabrik Stack)

### Infrastruktur-Automation
- UpCloud API: Server in Minuten provisionieren + teardown (scripts/lib/upcloud.sh)
- Ansible: 26 Rollen, 11 Playbooks, vollstaendige IaC-Pipeline
- Docker Compose Orchestrierung
- Systemd-Timer-Pattern: Poller (30s), Watchdog (5min), Nightstop

### API-Integration-Erfahrung
- UpCloud REST API (CRUD Server, Start/Stop, Status-Polling)
- Cloudflare API (DNS Records, Zone Management, SSL/TLS)
- Forgejo API (Repository-Operationen, Content-Push)
- Digistore24 IPN (Webhook-Verifikation, SHA-512 Signaturpruefung)
- GitHub Actions (CI/CD Workflows, Artifact Management)

### Monitoring & Health-Checks
- Gateway: /health, /ready, /metrics Endpoints
- Watchdog: PROD-Status-Polling mit Timeout-Handling
- Smoke-Tests: 13-Komponenten-Validierung nach Deployment
- Pipeline-Metriken in PostgreSQL (Timing, Stages, Review-Iterationen)

### Security-relevante Patterns (bereits implementiert)
- HMAC-SHA256 Ticket-Authentifizierung
- SHA-512 IPN-Signaturverifikation
- Bearer-Token-Auth fuer Admin-Endpoints
- Rate-Limiting (5/h/IP auf License-Recovery)
- CRC-8 Checksummen (License-Keys)
- Vault-verschluesselte Credentials (AES256)
- /dev/shm fuer transiente Secrets

### Eigene Schwachstellen (beim Review gefunden)
Diese nicht-trivialen Findings im EIGENEN Stack zeigen, welche Art von
Schwachstellen der Stack auch bei ANDEREN finden koennte:

1. **Dispatcher Auto-Wake ohne Autorisierung**: Queue-Eintrag genuegt um
   PROD-Server zu starten → Kosteneskalation (dispatcher.js:82-108)
2. **Admin-Auth als einfacher String-Vergleich**: Kein Timing-Safe-Compare
   (middleware/admin-auth.js:6)
3. **IPN-Handler antwortet immer OK**: Kein Feedback-Unterschied bei
   fehlgeschlagener Signaturpruefung (api-digistore-ipn.js:24-26)
4. **License-CRC schwach**: 1/256 False-Positive-Rate, vorhersagbares
   Alphabet (license-keygen.js)
5. **Forgejo ohne Commit-Signing**: Einzelner API-Token fuer alle Pushes
6. **Container laufen als root**: Kein User-Namespace-Mapping
7. **DB-Credentials in Docker-Mounts**: .env-Dateien im Container lesbar
8. **Kein Mutual-TLS zwischen Services**: Docker-Netzwerk als Trust-Boundary
9. **Watchdog ohne Rate-Limiting**: Unbegrenzte /ready-Calls an PROD
10. **API-Token in Bash-Prozesshistorie**: UpCloud-Token in ps aux sichtbar

---

## Bewertungsfragen

### A. Technische Machbarkeit

1. **Scanning-Infrastruktur on-demand**:
   Der Stack kann Server per API in Minuten hochfahren und wieder abbauen.
   - Wie effektiv ist ein Modell "Scanner-Server pro Target hochfahren,
     scannen, Ergebnisse sichern, Server loeschen"?
   - Vorteil: Frische IP pro Scan (kein IP-Blacklisting)
   - Vorteil: Keine persistente Infrastruktur (Kosten nur bei Nutzung)
   - Nachteil: Provisionierungs-Overhead (2-5 Min pro Server)
   - Ist das ein echter Wettbewerbsvorteil gegenueber statischen VPS-Scannern?

2. **Nicht-Standard-Schwachstellen durch API-Kompetenz**:
   Der Stack hat Erfahrung mit REST-API-Integration (UpCloud, Cloudflare,
   Forgejo, Digistore24). Diese Erfahrung koennte genutzt werden fuer:
   - Automatisierte API-Sicherheitspruefung (BOLA, BFLA, Mass Assignment)
   - Webhook-Signatur-Bypass-Tests (analog Digistore-IPN-Erfahrung)
   - OAuth/Bearer-Token-Missbrauch-Erkennung
   - Rate-Limit-Bypass-Tests
   - Ist das ein realistischer Edge gegenueber Standard-Nuclei-Scans?

3. **Business-Logic-Schwachstellen erkennen**:
   Die eigenen Findings (Auto-Wake, License-CRC, IPN-OK-Response) sind
   BUSINESS-LOGIC-Bugs — keine CVEs. Standard-Scanner finden diese NICHT.
   - Kann man Templates/Heuristiken entwickeln die aehnliche Patterns
     bei anderen Targets erkennen?
   - Z.B.: "Endpoint antwortet immer 200 OK unabhaengig vom Input"
   - Z.B.: "Admin-Funktion nur durch einfachen Header geschuetzt"
   - Z.B.: "Webhook akzeptiert Replay-Attacken"
   - Wie gross ist der Markt fuer Business-Logic-Testing?

4. **Kombination: Recon + API-Fuzzing + Logic-Tests**:
   - Subfinder/httpx (Recon) → eigene API-Fuzzing-Suite → Custom
     Business-Logic-Checks: Ist das ein differenziertes Produkt?
   - Vergleich zu bestehenden Tools: Burp Suite, OWASP ZAP, Nuclei,
     Caido — wo ist die Luecke?

### B. Erwartungswert-Analyse

5. **Asymmetrisches Payoff-Profil validieren**:
   - Kosten pro Scan-Durchlauf: VPS (~0,01-0,05 EUR auf UpCloud DEV-Plan
     fuer 30 Min), Gas/API: 0 EUR → Gesamtkosten <0,10 EUR pro Target
   - Bounty bei Fund: 500-10.000 EUR (Median auf HackerOne)
   - Benoetigte Trefferquote fuer Break-Even:
     Bei 0,10 EUR/Scan und 500 EUR Bounty: 1 Treffer pro 5.000 Scans
   - Ist 1:5.000 realistisch mit Custom-Templates?
   - Wie viele Targets kann man pro Tag scannen?

6. **Skalierungsrechnung**:
   - 500 EUR Budget = ~5.000 VPS-Minuten auf UpCloud DEV-Plan
   - Bei 30 Min/Scan = ~166 Targets scannbar
   - Bei 1% Trefferquote = 1-2 Findings
   - Bei 500 EUR Median-Bounty = 500-1.000 EUR Return
   - Stimmt diese Rechnung? Wo sind die versteckten Kosten?

### C. Wettbewerbsanalyse

7. **Differenzierung gegenueber professionellen Bug-Bounty-Jägern**:
   - Vidoc Security: 120k EUR/Jahr durch Automation — was machen die anders?
   - ProjectDiscovery (Nuclei-Ersteller): Welche Premium-Features bieten sie?
   - Wie viele automatisierte Scanner konkurrieren bereits auf HackerOne?
   - Ist der Markt uebersaettigt fuer Standard-Scans?

8. **Nischen-Vorteil durch Infrastruktur-Wissen**:
   - Der Stack hat tiefes Wissen ueber: Ansible-Deployments, Docker-Compose,
     Caddy/Nginx-Konfigurationen, systemd-Timer, PostgreSQL, Forgejo/Gitea
   - Gibt es Bug-Bounty-Programme die genau diese Technologien einsetzen?
   - Waere "Spezialisierung auf Self-Hosted-Infrastruktur-Targets" ein
     verteidigbarer Nischen-Vorteil?

### D. Nicht-Standard-Schwachstellen-Katalog

9. **Welche Schwachstellen-Klassen kann der Stack realistisch finden?**

   Bewerte jede Klasse auf einer Skala: [Unrealistisch / Moeglich / Gut / Exzellent]

   | Schwachstellen-Klasse | Standard-Tools | Code-Fabrik-Vorteil |
   |----------------------|----------------|---------------------|
   | Bekannte CVEs (z.B. Log4Shell) | Nuclei reicht | Kein Vorteil |
   | Fehlkonfigurationen (offene Admin-Panels) | Nuclei reicht | Kein Vorteil |
   | API-Sicherheit (BOLA, BFLA, Mass Assignment) | Teilweise (Burp/ZAP) | ? |
   | Webhook-Signatur-Bypass | Kaum automatisiert | ? |
   | Business-Logic-Fehler (Auto-Wake-Pattern) | Nicht automatisierbar | ? |
   | Rate-Limit-Bypass | Teilweise | ? |
   | Timing-Angriffe (String-Compare) | Spezialisiert | ? |
   | Container-Escape / Docker-Misconfig | Teilweise (Trivy) | ? |
   | CI/CD-Pipeline-Angriffe (Forgejo/GitHub Actions) | Kaum | ? |
   | DNS-Misconfiguration (Subdomain Takeover) | Nuclei reicht | ? |
   | Secret-Leakage in Git/Logs/Env | Teilweise (TruffleHog) | ? |
   | Replay-Attacken auf Webhooks | Kaum automatisiert | ? |
   | Privilege-Escalation via Queue/Dispatcher | Nicht automatisierbar | ? |

10. **Koennen die eigenen Findings generalisiert werden?**
    Fuer jedes der 10 eigenen Findings (siehe oben): Kann daraus ein
    wiederverwendbares Detection-Template werden, das bei ANDEREN Targets
    aehnliche Schwachstellen findet?

### E. Risikobewertung

11. **Rechtliche Risiken in Deutschland**:
    - Bug-Bounty = explizite Einladung zum Testen (legal)
    - Was passiert bei versehentlichem Out-of-Scope-Scan?
    - Haftungsrisiken bei False-Positive-Reports?
    - StGB §202a/b/c (Computerbetrug, Ausspähen von Daten) — wo ist die Grenze?

12. **Reputationsrisiken**:
    - Automated Reports mit niedriger Qualitaet → Account-Sperrung auf HackerOne?
    - "Spray and Pray" wird von Programmen nicht geschaetzt
    - Wie balanciert man Quantitaet (Automation) vs. Qualitaet (manuelle Triage)?

### F. Go/No-Go-Entscheidung

13. **Zusammenfassende Bewertung**:
    - Ist der Edge durch Infrastruktur-Automation + API-Kompetenz + Business-
      Logic-Erfahrung GROSS GENUG, um gegen professionelle Bug-Bounty-Jaeger
      und deren Tools zu bestehen?
    - Oder ist der realistische Outcome: "Standard-Findings die Profis
      schneller finden, und Business-Logic-Bugs die sich nicht skalierbar
      automatisieren lassen"?
    - Klare Empfehlung: Go / No-Go / Pivot (und wohin?)

---

## Erwartetes Output-Format

1. Bewertungstabelle (Frage 1-13, je mit Score 1-10 und Begruendung)
2. SWOT-Analyse (Staerken, Schwaechen, Chancen, Risiken)
3. Realistische 90-Tage-Projektion (Kosten, erwartete Findings, erwarteter Ertrag)
4. Go/No-Go mit Begruendung
5. Falls Go: Konkreter 30-Tage-Startplan
6. Falls No-Go: Alternative Verwendung der identifizierten Faehigkeiten
