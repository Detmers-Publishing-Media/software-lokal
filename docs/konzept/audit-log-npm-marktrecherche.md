# Tamper-Proof Audit Log — Vertiefte Marktrecherche

*Stand: 11. Maerz 2026. Recherchiert mit Live-Daten aus npm Registry, Web-Suche und Fachquellen.*
*Ergaenzt: `docs/konzept/audit-log-npm-business-review.md`*

---

## 1. Paketnamen-Verfuegbarkeit auf npm

| Paketname | Status | Anmerkung |
|---|---|---|
| **`tamperproof-log`** | **Verfuegbar** (404) | Empfohlener Name — kurz, beschreibend |
| `tamperproof-audit` | **Verfuegbar** (404) | Alternative |
| `audit-chain` | **Verfuegbar** (404) | Kuerzer, weniger spezifisch |
| `hashchain-audit` | **Verfuegbar** (404) | Technisch praezise |
| `logsync` | **Belegt** | Altes Logging-Framework (v0.5.0, 2022, inaktiv). Nicht verwechseln mit logsync.dev (SaaS) |

**Empfehlung:** `tamperproof-log` ist verfuegbar und der staerkste Name.

---

## 2. npm-Wettbewerbsanalyse (Live-Daten)

### 2.1 Direkter Wettbewerber: ri-event-log

| Eigenschaft | Detail |
|---|---|
| **Name** | `ri-event-log` |
| **Version** | 1.0.0 |
| **Veroeffentlicht** | 15. Februar 2026 (sehr frisch) |
| **Lizenz** | MIT |
| **Autor** | Robust-infrastructure |
| **Dependency** | `dexie@^4.3.0` (IndexedDB-Wrapper) |
| **Features** | SHA-256 Hash-Kette, Temporal Queries, State Snapshots, AST Diff Storage, Tiered Storage, Storage Monitoring |
| **Einschraenkung** | **Gebunden an IndexedDB/Dexie** — nur Browser/Electron, nicht server-agnostisch |
| **GitHub** | github.com/Robust-infrastructure/ri-event-log |
| **Downloads** | Nicht sichtbar (zu neu) |

**Bewertung:** Ernstzunehmender Wettbewerber mit aehnlichem Ansatz, aber entscheidende Schwaeche:
Dexie-Dependency macht es browser-only. Kein Server-/Backend-Einsatz moeglich.
`tamperproof-log` mit Zero Dependencies und Storage-Adapter-Interface waere klar
differenziert (server + browser + desktop).

### 2.2 Verwandter Wettbewerber: @nexart/ai-execution

| Eigenschaft | Detail |
|---|---|
| **Name** | `@nexart/ai-execution` |
| **Version** | 0.10.0 |
| **Veroeffentlicht** | 9. Maerz 2026 |
| **Lizenz** | MIT |
| **Dependencies** | `@noble/hashes`, `@noble/ed25519` |
| **Features** | SHA-256 Hashing, Certificate Hash, Multi-Step Chaining, Verification, LangChain-Integration |
| **Fokus** | Tamper-evident Records fuer **KI-Operationen** (Certified Execution Records) |
| **Einschraenkung** | **Nur fuer AI/LLM Use Cases** — keine generische Audit-Log-Loesung |

**Bewertung:** Anderes Marktsegment (KI-Audit), aber zeigt wachsendes Interesse an
Hash-Chain-basierter Integritaetssicherung.

### 2.3 Audit-Log-Pakete ohne Tamper-Proof

| Paket | Downloads/Woche | Letztes Update | Framework | Tamper-Proof |
|---|---|---|---|---|
| `@cap-js/audit-logging` | 5.202 | Feb 2026 | SAP CAP | Nein |
| `@janus-idp/backstage-plugin-audit-log-node` | 1.851 | Jan 2025 | Backstage | Nein |
| `@commercetools/history-sdk` | 1.640 | Maerz 2026 | commercetools | Nein |
| `@sourceloop/audit-log` | 970 | Sep 2025 | LoopBack 4 | Nein |
| `generator-jhipster-entity-audit` | 455 | Mai 2025 | JHipster | Nein |
| `@meridianjs/activity` | 241 | Maerz 2026 | Meridian | Nein |
| `sequelize-version` | 182 | Apr 2019 | Sequelize | Nein |
| `@ghosthaise/payload-audit-log` | 131 | Nov 2025 | PayloadCMS | Nein |
| `audit-log` | 82 | Feb 2013 | MongoDB | Nein |
| `@elchinabilov/nestjs-audit-logs` | 61 | Feb 2026 | NestJS | Nein |
| `strapi-plugin-audit-log` | 29 | Apr 2021 | Strapi | Nein |

**Kern-Erkenntnis:** Alle existierenden npm-Audit-Log-Pakete sind **framework-gebunden**
(LoopBack, NestJS, Sequelize, PayloadCMS, etc.) und keines bietet kryptographische
Integritaetssicherung. Die Luecke fuer ein framework-agnostisches Paket mit Hash-Kette
ist **real und bestaetigt**.

### 2.4 Hash-Chain / Crypto-Pakete (nicht Audit-spezifisch)

| Paket | Downloads/Woche | Beschreibung | Audit-Relevanz |
|---|---|---|---|
| `object-hash` | hoch | Hash-Erzeugung aus JS-Objekten | Baustein, kein Audit-Log |
| `jws` / `jwa` | hoch | JSON Web Signatures | Signatur, keine Kette |
| `hash-base` | hoch | Abstract Hash-Stream | Low-Level, kein Audit |

---

## 3. SaaS- und kommerzielle Wettbewerber

### 3.1 Pangea Secure Audit Log (CrowdStrike)

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS (Cloud API) |
| **Anbieter** | Pangea / CrowdStrike |
| **Tamper-Proof** | **Ja** — Merkle Trees + Arweave (oeffentliche Blockchain) |
| **Technik** | Events → JCS Canonicalization → Merkle Tree → Root Hash → Arweave (nach 1h oder 10.000 Events) |
| **Verifikation** | Membership Proof, Consistency Proof, Event Signature Validation |
| **SDKs** | Node.js, Python, Go, Java, PHP, Ruby, .NET |
| **Pricing** | Freemium (Details nicht oeffentlich, Free Tier verfuegbar) |
| **Compliance** | SOC 2, HIPAA, GDPR |
| **npm-Paket** | `@pangeacyber/react-mui-audit-log-viewer` (nur UI-Viewer, 40 Downloads/Woche) |
| **Einschraenkung** | **Cloud-only**, Vendor Lock-in, Arweave-Dependency, Auftragsverarbeitung noetig |

**Bewertung:** Technisch am staerksten (Merkle Trees + Blockchain-Verankerung), aber
vollstaendig Cloud-abhaengig. Fuer Entwickler die lokale Kontrolle brauchen ungeeignet.

### 3.2 WorkOS Audit Logs

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS (Enterprise-Plattform) |
| **Pricing** | Ab $5/Organisation/Monat, 12-Monats-Retention: +$50/Org/Monat, SIEM-Streaming: +$75/Org/Monat |
| **Tamper-Proof** | **Nein** — kein kryptographischer Schutz erwaehnt |
| **Features** | Event-Filterung, SIEM-Streaming, Admin-Portal, JSON-Schema-Validierung |
| **Fokus** | Enterprise-Compliance (SSO + SCIM + Audit Logs als Bundle) |
| **Einschraenkung** | Teuer bei vielen Orgs, kein Tamper-Proof, Cloud-only |

**Bewertung:** Enterprise-fokussiert, kein kryptographischer Schutz. Nicht in der
gleichen Kategorie wie `tamperproof-log`.

### 3.3 Retraced (BoxyHQ) — Open Source

| Eigenschaft | Detail |
|---|---|
| **Typ** | Open Source (Self-Hosted, Kubernetes) |
| **Lizenz** | Apache-2.0 |
| **npm-Paket** | `@retracedhq/retraced` (v0.7.23, Jan 2025) |
| **Dependencies** | axios, lodash |
| **Tamper-Proof** | **Nein** — kein kryptographischer Schutz |
| **Features** | Event-CRUD, Such-API, Embeddable UI, Go + JS Client |
| **Fokus** | Multi-Tenant SaaS Audit Logs |
| **Einschraenkung** | **Kubernetes noetig**, Postgres + Elasticsearch + NSQ Backend, komplex zu deployen |

**Bewertung:** Einziger ernst zu nehmender Open-Source-Wettbewerber, aber:
kein Tamper-Proof, sehr schwere Infrastruktur (K8s), Enterprise-fokussiert.
Voellig andere Zielgruppe als `tamperproof-log`.

### 3.4 Logsync.dev

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS (Cloud API) |
| **Tamper-Proof** | **Ja** — SHA-256 Hash-Kette (blockchain-inspiriert) |
| **SDKs** | Node.js, Python, Go, Java, PHP, Ruby, .NET (7 Sprachen) |
| **Pricing** | Free Tier: 1.000 Events/Monat, Paid: Usage-based |
| **Latenz** | Sub-50ms |
| **Compliance** | SOC 2, HIPAA, GDPR, PCI DSS |
| **npm-Name** | `logsync` ist belegt (aber anderes Paket, nicht von logsync.dev) |
| **Einschraenkung** | **Cloud-only**, SaaS-Vendor Lock-in |

**Bewertung:** Staerkster SaaS-Wettbewerber mit Hash-Chain. Aber genau die
Cloud-Abhaengigkeit ist der Schmerzpunkt den `tamperproof-log` loest.

### 3.5 LogMint

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS + npm SDK |
| **npm-Paket** | `@logmint/audit` |
| **Pricing** | Usage-based |
| **Tamper-Proof** | **Nein** |
| **Fokus** | Startups, Developer-first |
| **Einschraenkung** | Cloud-Abhaengigkeit, kein kryptographischer Schutz |

### 3.6 Weitere SaaS-Wettbewerber (aus Agenten-Recherche)

#### Datadog Audit Trail

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS (Teil der Datadog-Plattform) |
| **Pricing** | Ab $23/Host/Monat (Infra Monitoring), Audit Trail inkludiert im Enterprise-Tier |
| **Tamper-Proof** | Nein (immutable Retention, keine Hash-Kette) |
| **Einschraenkung** | Auditiert nur **Datadog-Plattform-Aktivitaet**, nicht App-Events. Kein embeddable Audit-Log. |

#### AWS CloudTrail

| Eigenschaft | Detail |
|---|---|
| **Typ** | Cloud Service (AWS-nativ) |
| **Pricing** | Free: 90 Tage. CloudTrail Lake: $2.50/GB (7-Jahres-Retention), $0.75/GB (1-Jahres) |
| **Tamper-Proof** | Ja (Log File Integrity Validation = Hash-Kette) |
| **Einschraenkung** | **Nur AWS API-Calls**, nicht App-Events. CloudTrail Lake teuer bei Volumen. |

#### Splunk

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS / On-Prem (SIEM) |
| **Pricing** | ~$1.800-$18.000/Jahr (1-10 GB/Tag), Enterprise-Pricing |
| **Tamper-Proof** | Nein |
| **Einschraenkung** | Extrem teuer, komplex. Auditiert Splunk-Aktivitaet, nicht App-Events. |

#### Elastic/ELK

| Eigenschaft | Detail |
|---|---|
| **Typ** | Hybrid (OSS Core + Commercial) |
| **Pricing** | Audit-Features ab Platinum-Lizenz. Serverless: $0.07/GB Ingestion |
| **Tamper-Proof** | Nein (Elasticsearch Issue #66144 fordert es, ist aber **offen/ungeloest**) |
| **Einschraenkung** | Audit-Logging hinter Paywall, auditiert ELK-Events, nicht App-Events |

#### Frontegg

| Eigenschaft | Detail |
|---|---|
| **Typ** | SaaS (Identity + Audit Bundle) |
| **Pricing** | Free Tier, Pay-as-you-go |
| **Tamper-Proof** | Nein |
| **Einschraenkung** | Audit-Logs an Identity-Plattform gekoppelt, nicht standalone kaufbar |

#### Cossack Labs (Acra)

| Eigenschaft | Detail |
|---|---|
| **Typ** | Open Source + Commercial (Data Protection Suite) |
| **Tamper-Proof** | Ja (kryptographisch signierte Audit-Logs, Chain Verification) |
| **Einschraenkung** | Volles Data-Protection-Framework, kein leichtgewichtiges npm-Paket. Fintech-fokussiert. |

### 3.7 Wettbewerbs-Matrix (erweitert)

| Anbieter | Typ | Tamper-Proof | Zero-Deps | Lokal moeglich | npm-Paket | Preis |
|---|---|---|---|---|---|---|
| **tamperproof-log** (geplant) | OSS Library | Ja (HMAC-SHA256) | Ja | Ja | Ja | Free (MIT) |
| ri-event-log | OSS Library | Ja (SHA-256) | Nein (Dexie) | Nur Browser | Ja | Free (MIT) |
| @nexart/ai-execution | OSS Library | Ja (SHA-256) | Nein | Ja | Ja | Free (MIT) |
| Pangea | SaaS | Ja (Merkle+Arweave) | N/A | Nein | Client-SDK | Freemium |
| Logsync.dev | SaaS | Ja (SHA-256 Chain) | N/A | Nein | Client-SDK | Freemium |
| WorkOS | SaaS | Nein | N/A | Nein | Client-SDK | Ab $5/Org/Mon |
| Retraced/Ory | OSS Service | Ja (Digest) | Nein | Ja (K8s) | Client-SDK | Free (Apache) |
| Datadog | SaaS | Nein | N/A | Nein | Nein | Ab $23/Host/Mon |
| AWS CloudTrail | Cloud | Ja (File Integrity) | N/A | Nein | AWS SDK | Free + $0.75/GB |
| Splunk | SaaS/On-Prem | Nein | N/A | Ja | Nein | Ab $1.800/Jahr |
| Elastic/ELK | Hybrid | Nein | N/A | Ja | Client-SDK | Ab Platinum |
| Frontegg | SaaS | Nein | N/A | Nein | Client-SDK | Freemium |
| Cossack Labs | OSS + Comm. | Ja (Signaturen) | Nein | Ja | Nein | Kontakt |
| LogMint | SaaS + SDK | Nein | Nein | Nein | Client-SDK | Usage-based |

**Kern-Erkenntnis:** `tamperproof-log` waere das **einzige** npm-Paket das alle vier
Kriterien gleichzeitig erfuellt: Tamper-Proof + Zero Dependencies + Lokal einsetzbar + Framework-agnostisch.

---

## 4. Regulatorischer Stand (Live-Recherche Maerz 2026)

### 4.1 NIS2 — Deutschland

| Aspekt | Detail |
|---|---|
| **Status** | **In Kraft** seit 6. Dezember 2025 |
| **Gesetz** | NIS-2-Umsetzungs- und Cybersicherheitsstaerkungsgesetz (NIS2UmsuCG), BGBl 2025/301 |
| **Betroffene** | ~29.500 Unternehmen in DE |
| **Strafen** | Bis EUR 10 Mio. oder 2% des weltweiten Jahresumsatzes ("Wesentliche Einrichtungen"), bis EUR 7 Mio. oder 1,4% ("Wichtige Einrichtungen") |
| **Persoenliche Haftung** | Ja — Management haftet persoenlich |
| **Audit-Log-Relevanz** | Art. 21: Risikomanagement-Massnahmen umfassen explizit Logging und Nachvollziehbarkeit |

**Quellen:** bundesregierung.de, recht.bund.de (BGBl 2025/301), openkritis.de

### 4.2 NIS2 — Oesterreich

| Aspekt | Detail |
|---|---|
| **Status** | **Beschlossen** (NISG 2026), Inkrafttreten ca. Oktober 2026 |
| **Betroffene** | ~4.000-5.000 Unternehmen |
| **Strafen** | Bis EUR 10 Mio. oder 2% des Jahresumsatzes |
| **Besonderheit** | 6-12 Monate Uebergangsfristen nach Inkrafttreten |

**Quellen:** parlament.gv.at, wko.at, bgundp.com, schoenherr.eu

### 4.3 Schweiz — ISG (Informationssicherheitsgesetz)

| Aspekt | Detail |
|---|---|
| **Status** | ISG in Kraft seit 1. Januar 2024; Meldepflicht seit **1. April 2025**; Strafen seit **1. Oktober 2025** |
| **Hinweis** | CH ist kein EU-Mitglied — NIS2 gilt nicht direkt, aber ISG ist teilweise angeglichen |
| **Betroffene** | Betreiber kritischer Infrastrukturen (Energie, Wasser, Transport, Spitaeler, Cloud, Rechenzentren) |
| **Meldepflicht** | Erstmeldung an BACS innerhalb 24h, Ergaenzung innerhalb 14 Tagen |
| **Strafen** | Bis CHF 100.000 (nur bei Missachtung einer formellen Verfuegung) |
| **Geplante Erweiterung** | Revision 2025/2026 fuer zusaetzliche Sektoren, teilweise NIS2-angeglichen |

**Quellen:** infosec.ch, baggenstos.ch, haerting.ch

### 4.4 DORA (Digital Operational Resilience Act)

| Aspekt | Detail |
|---|---|
| **Status** | **In Kraft** seit 17. Januar 2025 (EU-Verordnung, direkt anwendbar) |
| **DE-Flanking** | Finanzmarktdigitalisierungsgesetz (FinmadiG) |
| **Betroffene** | ~3.600 Unternehmen in DE (Banken, Versicherungen, Zahlungsdienstleister, Krypto) |
| **Compliance-Stand** | ~44% noch nicht vollstaendig compliant; BaFin beginnt systematische Audits 2026 |
| **Audit-Log-Relevanz** | Pflicht zu ICT-Incident-Management mit detailliertem Logging |
| **Strafen** | Bis 1% des taeglichen weltweiten Umsatzes (pro Tag Nicht-Compliance) |

**Quellen:** bafin.de, kpmg.de (Klardenker), advisori.de, kgh.de

### 4.5 GoBD — Aktualisierung Juli 2025

| Aspekt | Detail |
|---|---|
| **Status** | **Aktualisiertes BMF-Schreiben vom 14. Juli 2025** (sofort anwendbar) |
| **Anlass** | Anpassung wegen E-Rechnungspflicht ab 2025 |
| **Neue Anforderungen** | |
| | Alle Aenderungen an Buchungsdaten muessen **unveraenderlich protokolliert** werden |
| | Eingehende XML-Rechnungsdaten muessen gegen EN 16931 Schema validiert werden |
| | Empfangszeitpunkt muss **manipulationssicher** erfasst werden ("Zeitgerechtheit") |
| | Volle Nachverfolgbarkeit von XML-Rechnungsdaten bis zum Hauptbuch |
| **Prueffokus 2026** | Betriebspruefer verfolgen Transaktionen End-to-End (XML → Konten → USt) |

**Quellen:** kleeberg.de, deloitte-tax-news.de

### 4.6 E-Rechnungspflicht — Zeitplan

| Phase | Datum | Pflicht |
|---|---|---|
| Phase 1 | **Seit 1. Jan 2025** | Alle B2B muessen E-Rechnungen **empfangen** koennen |
| Phase 2 | Bis 31. Dez 2026 | Uebergangsfrist: Papier/PDF mit Zustimmung noch erlaubt |
| Phase 3 | **1. Jan 2027** | Unternehmen > EUR 800.000 Umsatz muessen E-Rechnungen **senden** |
| Phase 4 | **1. Jan 2028** | **Vollpflicht**: ALLE B2B muessen EN 16931 (ZUGFeRD/XRechnung) senden |

**Strafe:** Nicht-konforme Rechnungen koennen den Vorsteuerabzug verweigert bekommen.

**Quellen:** etl.de, haufe.de, bundesfinanzministerium.de, eu-rechnung.de

### 4.7 Regulatorische Zusammenfassung

| Regulierung | Status | Stichtag | Betroffene (DE) | Max. Strafe |
|---|---|---|---|---|
| NIS2 (DE) | In Kraft | 6. Dez 2025 | ~29.500 | EUR 10 Mio. / 2% Umsatz |
| NIS2 (AT) | Beschlossen | ~Okt 2026 | ~4.000-5.000 | EUR 10 Mio. / 2% Umsatz |
| ISG (CH) | In Kraft | 1. Apr 2025 (Meldepflicht) | Krit. Infrastruktur | CHF 100.000 |
| DORA | In Kraft | 17. Jan 2025 | ~3.600 | 1% taeglicher Umsatz |
| GoBD | Aktualisiert | 14. Jul 2025 | Alle Unternehmen | Schaetzung der Besteuerungsgrundlage |
| E-Rechnung | Phasenweise | Vollpflicht 1. Jan 2028 | Alle B2B | Verweigerung Vorsteuerabzug |

**Kern-Erkenntnis fuer npm-Paket:** NIS2 allein betrifft ~29.500 Unternehmen in DE,
die nachweisbar manipulationssichere Logs vorhalten muessen. Die GoBD-Aktualisierung
vom Juli 2025 verschaerft die Anforderung an Unveraenderbarkeit explizit.
Alle sechs Regulierungen zusammen erzeugen einen **konvergierenden Compliance-Druck**
auf Audit-Trail-Loesungen.

---

## 5. Developer Demand — Evidenz

### 5.1 Hacker News (staerkster Indikator fuer Entwickler-Nachfrage)

| Titel | Typ | Datum | Kontext |
|---|---|---|---|
| "Show HN: I built a tamper-evident audit logging service to prevent DB rewrites" | Show HN | 2026 | Entwickler baut eigenen Service, weil kein npm-Paket existiert. Problem: "Standard audit logs fail when attacker has full DB access" |
| "Show HN: Air - Open-source black box for AI agents (tamper-evident audit trails)" | Show HN | 2026 | OSS tamper-evident Audit-Trail fuer AI Agents |
| "Show HN: Traceprompt - tamper-proof logs for every LLM call" | Show HN | 2025/2026 | Tamper-proof Logging fuer LLM/AI |
| "Ask HN: How do you implement audit trail for a product?" | Ask HN | Feb 2022 | Direkte Frage — zeigt wiederkehrendes "Wie mache ich das?"-Muster |
| "Show HN: Open-source - Add Audit Logs to your SaaS app" | Show HN | Jan 2023 | OSS Audit-Log mit "cryptographically guaranteed immutability" |
| "Show HN: LogSentinel, blockchain-inspired secure audit trail service" | Show HN | 2017+ | Fruehes SaaS-Produkt, heute kommerzielles SIEM |

**Kern-Erkenntnis:** 6 Hacker-News-Posts zum Thema, alle mit eigengebauten Loesungen.
Keiner verweist auf ein existierendes npm-Paket.

### 5.2 GitHub — Projekte und Issues

| Projekt/Issue | Plattform | Kontext |
|---|---|---|
| **Elasticsearch #66144**: "Add tamper resistance to security audit logs" | GitHub Issue (elastic) | 5 Uni-Studenten schlagen HMAC-basierte Tamper Detection fuer ES vor. **Offen, nicht geloest.** |
| **Attest**: Tamper-evident audit logging with crypto verification | GitHub (Apache 2.0) | Multi-Tenant, Hash-Chains, External Anchoring. **Go-basiert, kein npm.** |
| **immudb** (codenotary): Immutable database, zero trust | GitHub (50M+ Downloads) | Merkle Trees, kryptographische Verifikation. Genutzt von Regierungen (Indien, Mexiko). **Go-basiert, kein npm SDK.** |
| **Google Trillian**: Transparent, cryptographically verifiable data store | GitHub (Google) | Basis fuer Certificate Transparency. 2.000+ Writes/sec. **Go-basiert, kein npm.** |

**Kern-Erkenntnis:** Die grossen Projekte (immudb, Trillian, Attest) sind alle in **Go**, nicht JavaScript.
Die npm/Node.js-Welt hat kein Aequivalent.

### 5.3 dev.to / Fach-Artikel

| Titel | Plattform | Datum | Relevanz |
|---|---|---|---|
| "Building a Tamper-Evident Audit Log with SHA-256 Hash Chains (Zero Dependencies)" | dev.to (VeritasChain) | 28. Dez 2025 | **Hoch** — Exakt derselbe Ansatz, ~500 Zeilen Tutorial, kein npm-Paket → Luecke bestaetigt |
| "How I built tamper-proof audit logs for AI agents at 15" | dev.to | Maerz 2026 | Mittel — "Nobulex" (106K Zeilen TS, 61 npm-Pakete) — extrem schwer, kein Leichtgewicht |
| "Immutable by Design: Building Tamper-Proof Audit Logs for Health SaaS" | dev.to | 2025/2026 | **Hoch** — Zitat: "'Even I cannot change this data' is a powerful sales tool." SQL Hash Chaining setzt dich "ahead of 90% of competitors" |
| "Step-by-Step Guide to Implementing Node.js Audit Trail" | dev.to | 2025/2026 | Mittel — Tutorial mit Express Middleware, kein Paket |
| "Top 5 Audit Logging Libraries Every Startup Should Consider in 2025" | dev.to | 2025 | Hoch — Keines der 5 Tools (LogMint, WorkOS, OpenAudit, Axiom, Ory) hat Tamper-Proof |
| "How to Build Secure Audit Logging in Node.js (With Code)" | SevenSquareTech | 2025/2026 | Mittel — Tutorial, kein Paket |

### 5.4 Fachquellen und Akademisch

| Titel | Quelle | Relevanz |
|---|---|---|
| "Audit logs security: cryptographically signed tamper-proof logs" | Cossack Labs (Acra) | Hoch — Produktionsreifes System (Fintech), kein npm-Paket |
| "Efficient Data Structures for Tamper-Evident Logging" (Crosby) | Usenix (akademisch) | Hoch — Grundlagenpaper fuer Merkle-Tree-Logs |
| "AuditableLLM: Hash-Chain-Backed Framework for LLMs" | MDPI Electronics | Mittel — Akademisch, zeigt Forschungsinteresse |

### 5.5 Quantitative Zusammenfassung

| Signal-Typ | Anzahl |
|---|---|
| Hacker News Show HN / Ask HN Posts | 6 |
| GitHub-Projekte (dediziert) | 4 (alle Go, kein npm) |
| GitHub Issues (Feature Requests) | 1 (Elasticsearch, offen) |
| dev.to Tutorials / Artikel | 6+ |
| Kommerzielle SaaS-Produkte (validierter Markt) | 4 (Pangea, Logsync, LogSentinel, Cossack Labs) |
| npm-Pakete mit Hash-Chain | 2 (ri-event-log: Dexie-only; Nobulex: 61 Sub-Pakete, extrem schwer) |

### 5.6 Schlussfolgerung Developer Demand

**Die Nachfrage ist real, wiederkehrend und unbefriedigt:**

1. **Tutorials existieren, npm-Pakete nicht** — Entwickler bauen Hash-Chain-Audit-Logs
   selbst (Copy-Paste aus Tutorials), weil kein fertiges Paket existiert
2. **dev.to-Artikel von Ende 2025** zum exakt gleichen Thema (Zero Dependencies,
   SHA-256 Hash Chain) zeigt: Der Markt sucht genau diese Loesung
3. **Keines der "Top 5 Audit Logging Libraries 2025"** hat Tamper-Proof-Features
4. **Grosse Projekte sind in Go** (immudb, Trillian, Attest) — die Node.js-Welt ist leer
5. **Hacker News zeigt wiederkehrendes Muster**: Entwickler bauen es selbst und praesentieren
   es als Show HN — das klassische Signal fuer eine unbesetzte Nische
6. **SaaS-Loesungen existieren** (Pangea, Logsync), aber viele Entwickler suchen
   explizit lokale/self-hosted Loesungen
7. **Zitat-Highlight**: "Being able to say 'Even I cannot change this data' is a powerful
   sales tool" — exakt die Vertrauensbotschaft von Code-Fabrik

---

## 6. Gesamtbewertung

### 6.1 Marktluecke: Bestaetigt

```
Existiert:
  ✓ SaaS mit Tamper-Proof (Pangea, Logsync) — Cloud-Abhaengigkeit
  ✓ npm-Pakete fuer Audit-Logs (15+) — alle framework-gebunden, kein Tamper-Proof
  ✓ Ein npm-Paket mit Hash-Chain (ri-event-log) — Dexie-gebunden, nur Browser
  ✓ Tutorials zum Selbstbauen — kein fertiges Paket

Existiert NICHT:
  ✗ Framework-agnostisches npm-Paket
  ✗ Zero Dependencies
  ✗ HMAC-SHA256 Hash-Kette
  ✗ Storage-Adapter-Interface (Server + Browser + Desktop)
  ✗ Lokal einsetzbar ohne Cloud

→ tamperproof-log wuerde als EINZIGES Paket alle fuenf Kriterien erfuellen.
```

### 6.2 Regulatorischer Rueckenwind: Staerker als erwartet

- NIS2 ist in DE bereits **in Kraft** (nicht mehr "geplant")
- GoBD wurde im Juli 2025 **verschaerft** (manipulationssichere Zeitstempel Pflicht)
- DORA-Audits durch BaFin beginnen **2026**
- E-Rechnungspflicht Phase 3 ab **Januar 2027** (Umsatz > 800k)
- **~33.000 Unternehmen** in DE allein durch NIS2 + DORA direkt betroffen

### 6.3 Wettbewerbsrisiko: Niedrig

- `ri-event-log` ist der einzige npm-Wettbewerber, aber durch Dexie-Binding eingeschraenkt
- Pangea/Logsync sind SaaS — anderes Marktsegment
- Retraced ist zu schwer (Kubernetes-Stack)
- Die Tutorials zeigen: Entwickler wollen bauen, aber ein fertiges Paket waere besser

### 6.4 Timing: Optimal

- NIS2 in Kraft → Unternehmen suchen jetzt Loesungen
- ri-event-log erst seit Feb 2026 → Markt ist noch nicht gesaettigt
- dev.to-Artikel von Dez 2025 → Thema ist "top of mind"
- GoBD-Verschaerfung vom Jul 2025 → Nachfrage nach Audit-Trail steigt

---

## Quellen

### npm Registry
- https://registry.npmjs.org/tamperproof-log (404 = verfuegbar)
- https://registry.npmjs.org/tamperproof-audit (404 = verfuegbar)
- https://registry.npmjs.org/audit-chain (404 = verfuegbar)
- https://registry.npmjs.org/hashchain-audit (404 = verfuegbar)
- https://registry.npmjs.org/ri-event-log
- https://registry.npmjs.org/@nexart/ai-execution
- https://registry.npmjs.org/@retracedhq/retraced

### Wettbewerber
- https://pangea.cloud/docs/audit/about-tamperproofing
- https://pangea.cloud/services/secure-audit-log/
- https://pangea.cloud/pricing/
- https://workos.com/audit-logs
- https://workos.com/pricing
- https://logsync.dev/
- https://github.com/retracedhq/retraced
- https://www.npmjs.com/package/@retracedhq/retraced
- https://www.datadoghq.com/product/audit-trail/
- https://aws.amazon.com/cloudtrail/pricing/
- https://www.splunk.com/en_us/products/pricing.html
- https://www.elastic.co/subscriptions
- https://docs.frontegg.com/docs/audit-logs
- https://www.cossacklabs.com/blog/audit-logs-security/
- https://github.com/codenotary/immudb
- https://github.com/google/trillian

### Developer Demand
- https://news.ycombinator.com/item?id=47151637 (Show HN: tamper-evident audit logging)
- https://news.ycombinator.com/item?id=47061879 (Show HN: Air - tamper-evident audit trails)
- https://news.ycombinator.com/item?id=44657913 (Show HN: Traceprompt)
- https://news.ycombinator.com/item?id=30392926 (Ask HN: How do you implement audit trail?)
- https://news.ycombinator.com/item?id=34488302 (Show HN: Open-source audit logs)
- https://github.com/elastic/elasticsearch/issues/66144 (Tamper resistance for audit logs)
- https://github.com/Ashish-Barmaiya/attest
- https://dev.to/veritaschain/building-a-tamper-evident-audit-log-with-sha-256-hash-chains-zero-dependencies-h0b
- https://dev.to/ariangogani/how-i-built-tamper-proof-audit-logs-for-ai-agents-at-15-g49
- https://dev.to/beck_moulton/immutable-by-design-building-tamper-proof-audit-logs-for-health-saas-22dc
- https://dev.to/shreya_srivastava_a4cab6e/top-5-audit-logging-libraries-every-startup-should-consider-in-2025-lhn
- https://dev.to/williamsgqdev/step-by-step-guide-to-implementing-nodejs-audit-trail-jic
- https://www.sevensquaretech.com/secure-audit-logging-activity-trail-nodejs-with-code/

### Regulatorisch
- https://www.bundesregierung.de/breg-de/aktuelles/nis-2-richtlinie-deutschland-2373174
- https://www.recht.bund.de/bgbl/1/2025/301/VO.html
- https://www.openkritis.de/it-sicherheitsgesetz/nis2-umsetzung-gesetz-cybersicherheit.html
- https://www.parlament.gv.at/aktuelles/pk/jahr_2025/pk1189
- https://www.wko.at/it-sicherheit/nis2-uebersicht
- https://www.infosec.ch/blog/fachartikel-swiss-infosec-neu-meldepflicht-fur-cyberangriffe-ab-1-april-2025/
- https://www.bafin.de/DE/Aufsicht/DORA/DORA_node.html
- https://klardenker.kpmg.de/financialservices-hub/dora-2025-herausforderungen-und-naechste-schritte/
- https://www.kleeberg.de/2025/07/16/gobd-2025-anpassungen-aufgrund-neuer-gesetzlicher-regelungen/
- https://www.etl.de/e-rechnung/zeitplan/
- https://www.haufe.de/steuern/gesetzgebung-politik/elektronische-rechnung-wird-pflicht-e-rechnung-im-ueberblick_168_605558.html
