# Tamper-Proof Audit Log — npm-Paket: Marktanalyse & Business Review

*Stand: Maerz 2026. Erstellt als Entscheidungsgrundlage fuer externen Review.*
*Quellen: FEAT-008, Gesamtkonzept v4, Produktstrategie Lokal-Tools, finanz-shared Codebase.*

---

## 0. Kontext-Dokumente (bitte zuerst lesen)

Dieses Dokument referenziert die folgenden Dateien aus dem Code-Fabrik-Monorepo.
Fuer einen vollstaendigen Review sollten diese zusaetzlich gelesen werden:

### Pflicht (fuer Verstaendnis dieses Dokuments)

| Datei | Inhalt |
|---|---|
| `.stories/FEAT-008-audit-log-npm-oss.yml` | Story-Definition: Scope, Acceptance Criteria, Non-Goals, manuelle Schritte |
| `packages/finanz-shared/src/models/events.js` | Bestehende Hash-Ketten-Implementierung (44 Zeilen, das zu extrahierende Original) |
| `docs/konzept/gesamtkonzept-v4.md` | Gesamtstrategie Code-Fabrik: 4 Versprechen, Geschaeftsmodell, Go-to-Market, Risiken |
| `docs/produktstrategie-lokal-tools.md` | Produktstrategie beider Desktop-Produkte: Zielgruppen, Features, Shared-Architektur, Preise |

### Empfohlen (fuer tieferes Verstaendnis)

| Datei | Inhalt |
|---|---|
| `docs/konzept/produktkonzept-rechnung-lokal.md` | Rechnung Lokal Konzept: ZUGFeRD, EUeR, regulatorische Anforderungen (GoBD) |
| `docs/konzept/architektur-integritaet-tests.md` | Architektur-Pflicht: Event-Log, Hash-Kette, 7 Testkategorien, Schema-Versionierung |
| `docs/roadmap/ROADMAP-v0.6.md` | Roadmap v0.6 bis v1.0: Zeitplan, Abhaengigkeiten, offene Entscheidungen |
| `packages/finanz-shared/tests/` | Tests fuer Event-Log (Ketten, Replay, Integritaet) — zeigt Testabdeckung und Reifegrad |
| `CLAUDE.md` (Root) | Monorepo-Struktur, Tech-Stack, Packages, Governance, Test-Pflicht |

### Optional (Hintergrund)

| Datei | Inhalt |
|---|---|
| `products/mitglieder-lokal/docs/produktspec.md` | Mitglieder Lokal Spec — erstes Produkt das die Hash-Kette produktiv nutzt |
| `products/mitglieder-lokal/docs/feature-uebersicht.md` | Wettbewerbsvergleich Vereinsverwaltung — zeigt Marktpositionierung |
| `docs/konzept/electron-plattform-architektur.md` | Electron-Plattform: Backup, License, Support, Recovery |
| `products/bundles.json` | Bundle-Registry — zeigt Produktstruktur und Pricing |

---

## 1. Executive Summary

Code-Fabrik plant die Extraktion seiner intern genutzten HMAC-SHA256-Hash-Ketten-Logik
als eigenstaendiges, oeffentliches npm-Paket. Ziel ist ein framework-agnostisches Audit-Log
fuer Node.js-Entwickler, die Compliance-Anforderungen (SOC2, NIS2, ISO 27001, GDPR)
mit minimalem Aufwand erfuellen muessen.

**Kernthese:** Es gibt kein aktiv gepflegtes, framework-agnostisches npm-Paket fuer
manipulationssichere Audit-Logs mit kryptographischer Hash-Kette. Die bestehenden
Alternativen sind entweder tot, framework-gebunden oder nur als SaaS verfuegbar.

**Strategischer Zweck:** Das Paket dient primaer als Vertrauensanker fuer die
Code-Fabrik-Produkte. Es macht die Integritaetslogik unabhaengig pruefbar, oeffentlich
testbar und durch die Open-Source-Community validierbar. Sekundaer entsteht ein
eigenstaendiges Produkt mit Open-Core-Monetarisierungspotenzial.

---

## 2. Ausgangslage: Was existiert

### 2.1 Bestehende Implementierung (finanz-shared)

Die Hash-Ketten-Logik laeuft seit v0.3.0 produktiv in Mitglieder Lokal und wird
in Rechnung Lokal uebernommen. Sie ist der zentrale Baustein fuer die
GoBD-Prozessunterstuetzung und die Integritaetspruefung aller Schreiboperationen.

**Datei:** `packages/finanz-shared/src/models/events.js` (44 Zeilen)

**Funktionsumfang:**

| Funktion | Beschreibung |
|---|---|
| `append(type, data, actor)` | Event mit HMAC-SHA256-Hash an Kette anhaengen |
| `verifyChain(limit)` | Kette verifizieren, Manipulationen erkennen |
| `getEvents(limit, offset)` | Events paginiert abrufen |

**Technisches Prinzip:**

```
Event N:
  message  = type | timestamp | JSON(data) | hash(N-1)
  hash     = HMAC-SHA256(message, secret)
  prev_hash = hash(N-1)

Verifikation:
  Fuer jedes Event: hash == HMAC-SHA256(message, secret) UND prev_hash == hash(N-1)
  → Jede Aenderung an einem Event bricht die Kette ab diesem Punkt
```

**Dependency-Injection:** Die Implementierung erhaelt `query`, `execute` und `computeHmac`
als Abhaengigkeiten — sie ist bereits heute nicht an SQLite oder eine spezifische
Crypto-Implementierung gebunden.

### 2.2 Testabdeckung

Die Hash-Kette wird in den Code-Fabrik-Produkten durch 3 von 7 Testkategorien abgedeckt:

| Kategorie | Was getestet wird |
|---|---|
| **Ketten-Tests** | Migration v0.1 → v0.2 → ... → aktuell, Kette bleibt valide |
| **Replay-Tests** | Zustand aus Events rekonstruiert = normaler Zustand |
| **Integritaets-Tests** | Manipulation eines Events wird erkannt |

Aktuell 48 Tests in finanz-shared, davon ca. 15 direkt auf Event-Log bezogen.

### 2.3 Reifegrad-Einschaetzung

| Kriterium | Status |
|---|---|
| Algorithmus bewaehrt | Ja (HMAC-SHA256 ist Industriestandard) |
| Produktiveinsatz | Ja (Mitglieder Lokal v0.5.0, Rechnung Lokal v0.1.0) |
| Framework-Unabhaengigkeit | Teilweise (DI vorhanden, aber API noch auf interne Nutzung zugeschnitten) |
| TypeScript-Support | Nein (reines JavaScript, keine .d.ts) |
| Dokumentation | Nur intern (deutsch, in Architektur-Docs) |
| Storage-Adapter | Nein (wird per DI geloest, aber kein formales Interface) |
| Englische API | Nein |

**Geschaetzter Aufwand fuer Extraktion:** Effort L (FEAT-008 Schaetzung) — 2-3 Wochen
fuer Clean-Room-Extraktion, TypeScript Declarations, englische Docs, Storage-Adapter,
CI/CD und npm-Publish-Setup.

---

## 3. Marktanalyse

### 3.1 Regulatorischer Kontext (Nachfragetreiber)

Vier regulatorische Entwicklungen treiben die Nachfrage nach manipulationssicheren
Audit-Logs in den naechsten 12-24 Monaten:

| Regulierung | Deadline | Betroffene | Relevanz fuer npm-Paket |
|---|---|---|---|
| **NIS2 (EU)** | Umsetzungsfrist laeuft (2024 verpasst, nationale Gesetze in Arbeit) | ~160.000 Unternehmen in DE | Audit-Logs sind explizite Anforderung in Art. 21 |
| **DORA (EU)** | Januar 2025 (in Kraft) | Finanzsektor + IKT-Dienstleister | IKT-Risikomanagement verlangt nachvollziehbare Logs |
| **GDPR Art. 30** | Bereits in Kraft | Alle Unternehmen mit EU-Daten | Verarbeitungsverzeichnis + Nachvollziehbarkeit |
| **GoBD (DE)** | Bereits in Kraft | Alle Unternehmen in DE | Unveraenderbarkeit + Nachvollziehbarkeit bei digitaler Buchfuehrung |
| **SOC 2 Type II** | Kontinuierlich | SaaS-Anbieter weltweit | Audit-Trail ist Kernbestandteil der CC-Kriterien |
| **ISO 27001:2022** | Ab Oktober 2025 Pflicht fuer Neuzertifizierungen | Unternehmen mit Zertifizierungsbedarf | A.8.15 Logging, A.8.17 Clock Synchronization |

**Kern-Einsicht:** Die regulatorische Dichte nimmt zu, nicht ab. Entwickler stehen
zunehmend vor der Anforderung "nachweislich manipulationssichere Logs" — ohne ein
einfaches npm-Paket, das diese Anforderung mit wenigen Zeilen Code erfuellt.

### 3.2 Wettbewerbsanalyse: npm-Oekosystem

**Methodik:** Suche nach npm-Paketen fuer audit-log, tamper-proof, hash-chain,
immutable-log, event-sourcing, integrity-log. Bewertung nach: Aktivitaet,
Downloads, Framework-Abhaengigkeit, Manipulationsschutz.

#### Direkte Wettbewerber (Tamper-Proof Audit Log)

| Paket | npm Downloads/Woche | Letztes Update | Manipulationsschutz | Framework | Bewertung |
|---|---|---|---|---|---|
| `audit-log` | <100 | >2 Jahre | Nein (nur CRUD) | MongoDB | Tot, nur MongoDB |
| `node-audit-log` | <50 | >3 Jahre | Nein | Express | Tot |
| `auditlog` | <50 | >4 Jahre | Nein | - | Tot |
| `immutable-log` | Nicht gefunden | - | - | - | Existiert nicht |
| `tamperproof-log` | Nicht gefunden | - | - | - | Name verfuegbar |
| `hash-chain` | <100 | >2 Jahre | Ja (Basis) | - | Nur Chain, kein Audit-Log |

**Ergebnis:** Kein aktiv gepflegtes npm-Paket bietet HMAC-basiertes Tamper-Proof
Audit-Logging als framework-agnostische Loesung.

#### Indirekte Wettbewerber (Event Sourcing / CQRS)

| Paket | npm Downloads/Woche | Fokus | Tamper-Proof | Bewertung |
|---|---|---|---|---|
| `eventstore-client` | ~2.000 | EventStoreDB Client | Nein (Datenbank-Feature) | Erfordert EventStoreDB |
| `@nestjs/cqrs` | ~80.000 | NestJS CQRS | Nein | NestJS-exklusiv |
| `event-sourcing` | <200 | ES-Pattern | Nein | Keine Hash-Kette |

**Ergebnis:** Event-Sourcing-Libraries implementieren das Append-Only-Pattern,
aber keine kryptographische Integritaetssicherung.

#### SaaS-Wettbewerber (nicht npm, aber relevant)

| Anbieter | Typ | Preis | Tamper-Proof | Bewertung |
|---|---|---|---|---|
| **Datadog Audit Trail** | SaaS | Ab ~$15/Host/Monat | Plattform-Feature | Teuer, Cloud-Abhaengigkeit |
| **Splunk** | SaaS/On-Prem | Enterprise-Pricing | Optional | Overkill fuer Audit-Log |
| **AWS CloudTrail** | SaaS | Pay-per-Use | Ja (AWS-intern) | Nur fuer AWS |
| **Immuta** | SaaS | Enterprise | Ja | Data Governance, nicht Audit-Log |
| **Pangea Audit Log** | API/SaaS | Freemium | Ja (Arweave-basiert) | Cloud-Abhaengigkeit |

**Kern-Einsicht:** SaaS-Loesungen existieren, aber sie widersprechen dem Kernbedarf
vieler Entwickler: lokale Kontrolle, keine Cloud-Abhaengigkeit, keine Vendor-Lock-in.
Genau hier liegt die Luecke.

### 3.3 Zielgruppen-Segmentierung

#### Primaere Zielgruppe: Node.js-Backend-Entwickler mit Compliance-Bedarf

- **Profil:** Entwickler in Startups und KMU, die SOC2/NIS2/GDPR erfuellen muessen
- **Schmerzpunkt:** "Wir brauchen einen Audit-Trail, aber keine eigene Blockchain"
- **Entscheidungskriterium:** Zero Dependencies, einfache API, nachweisbare Integritaet
- **Geschaetzte Groesse:** ~500.000 Node.js-Entwickler in EU + US mit Compliance-Projekten

#### Sekundaere Zielgruppe: Open-Source-Entwickler mit Integritaetsbedarf

- **Profil:** Entwickler von Desktop-Apps, CLI-Tools, lokalen Datenbanken
- **Schmerzpunkt:** "Nutzer muessen verifizieren koennen, dass Daten nicht manipuliert wurden"
- **Entscheidungskriterium:** Kein Server noetig, funktioniert lokal
- **Geschaetzte Groesse:** ~100.000 Entwickler

#### Tertiaere Zielgruppe: Fintech- und Healthtech-Entwickler

- **Profil:** Regulierte Branchen mit hohen Anforderungen an Datenintegritaet
- **Schmerzpunkt:** Regulatorische Audits fordern nachweisbare Unveraenderbarkeit
- **Entscheidungskriterium:** Pruefbarkeit durch externe Auditoren
- **Geschaetzte Groesse:** ~50.000 Entwickler

### 3.4 Marktgroesse und Wachstum

#### TAM (Total Addressable Market)

- npm hat ~17 Millionen aktive Entwickler (Stand 2025)
- Node.js-Backend-Entwickler: ~6 Millionen
- Davon mit Compliance-Relevanz: ~1 Million
- **TAM: ~1 Million potenzielle Nutzer**

#### SAM (Serviceable Addressable Market)

- Entwickler die aktiv nach Audit-Log-Loesungen suchen: ~100.000
- Davon bereit fuer npm-Paket (vs. SaaS): ~30.000
- **SAM: ~30.000 potenzielle Nutzer**

#### SOM (Serviceable Obtainable Market)

- Realistisch erreichbar in 12 Monaten mit organischem Wachstum: 500-2.000 Nutzer
- Davon Pro-Upgrade (bei spaeterer Monetarisierung): 2-5%
- **SOM: 500-2.000 aktive Nutzer im ersten Jahr**

### 3.5 Suchvolumen-Indikatoren (qualitativ)

| Suchbegriff | Plattform | Indikator |
|---|---|---|
| "audit log npm" | Google | Regelmaessige Suchanfragen, keine dominante Loesung |
| "tamper proof log node" | Google | Wenige Ergebnisse, meist Blockchain-bezogen |
| "immutable audit trail" | StackOverflow | Wiederkehrende Fragen, keine Standardantwort |
| "NIS2 audit log" | Google | Steigend seit 2024 |
| "SOC2 audit trail implementation" | Google | Stabil hoch |
| "hash chain audit log" | Google/npm | Kaum relevante npm-Ergebnisse |

---

## 4. Strategischer Zweck: Vertrauensbildung

### 4.1 Das Vertrauensproblem

Code-Fabrik verkauft Desktop-Tools fuer sensible Bereiche:
- Rechnungsstellung (Rechnung Lokal) — regulatorisch relevant (GoBD, E-Rechnung)
- Vereinsverwaltung (Mitglieder Lokal) — personenbezogene Daten (DSGVO)
- Finanzrechner (FinanzRechner Lokal) — Beratungshaftung

**Kernfrage des Kunden:** "Kann ich diesem Tool vertrauen?"

Die vier Versprechen von Code-Fabrik ("Kein Geheimnis", "Keine Cloud", "Kein Kaefig",
"Kein Kontakt noetig") sind starke Botschaften — aber sie brauchen technische Beweise.

### 4.2 Das npm-Paket als Vertrauensbeweis

Das Audit-Log-Paket macht den kritischsten Baustein der Code-Fabrik-Architektur
oeffentlich pruefbar:

| Versprechen | Wie das npm-Paket es stuetzt |
|---|---|
| **"Kein Geheimnis"** | Die Integritaetslogik ist nicht in einem proprietaeren Produkt versteckt, sondern als eigenstaendiges, getestetes, oeffentliches Paket verfuegbar |
| **"Nachpruefbar"** | Jeder Kassenpruefer oder IT-Dienstleister kann die Hash-Kette unabhaengig verifizieren — mit dem gleichen Code, den das Produkt verwendet |
| **GoBD-Prozessunterstuetzung** | Die Unveraenderbarkeit der Buchungsdaten ist kryptographisch beweisbar, nicht nur behauptet |
| **Open Source Glaubwuerdigkeit** | Ein oeffentliches npm-Paket mit CI, Tests und Community-Beteiligung hat eine andere Glaubwuerdigkeit als "der Code ist irgendwo auf GitHub" |

### 4.3 Vertrauenskette (Trust Chain)

```
npm-Paket (oeffentlich, getestet, Community-validiert)
  ↓ wird verwendet von
finanz-shared (internes Package, gleicher Code)
  ↓ wird verwendet von
Rechnung Lokal / Mitglieder Lokal (Kundenprodukte)
  ↓ schuetzt
Kundendaten (Rechnungen, Mitglieder, Transaktionen)
```

**Der Kunde muss nicht dem Produkt vertrauen — er kann die Integritaetslogik
unabhaengig pruefen.** Das ist ein einzigartiges Differenzierungsmerkmal gegenueber
lexoffice, SevDesk und allen anderen Wettbewerbern in den Zielmaerkten von Code-Fabrik.

### 4.4 Kommunikationsstrategie

Auf den Produktseiten von Code-Fabrik:

> "Die Integritaet Ihrer Daten wird durch eine kryptographische Hash-Kette gesichert.
> Die gleiche Technologie ist als Open-Source-Paket auf npm verfuegbar und wird von
> [Anzahl] Entwicklern weltweit eingesetzt und geprueft."

Auf der npm-README:

> "Used in production by Code-Fabrik desktop tools to protect financial records
> and membership data for German businesses and nonprofits."

---

## 5. Produktdefinition: npm-Paket

### 5.1 Paketname und Scope

**Praeferred:** `tamperproof-log` (kein Scope, maximale Auffindbarkeit)
**Alternative:** `@detmers/audit-log` (Scope, Markenbildung)
**Fallback:** `hashchain-audit` oder `audit-chain`

**Empfehlung:** `tamperproof-log` — kurz, beschreibend, kein Scope-Overhead fuer Erstnutzer.

### 5.2 API-Design (Ziel)

```js
import { createAuditLog, InMemoryStore } from 'tamperproof-log';

// Minimales Setup (3 Zeilen)
const store = new InMemoryStore();
const log = createAuditLog({ store });

// Event anhaengen
await log.append('user.created', { id: 1, name: 'Alice' });
await log.append('user.updated', { id: 1, name: 'Bob' });

// Kette verifizieren
const result = await log.verify();
// { valid: true, checked: 2, errors: [] }

// Events abrufen
const events = await log.getEvents({ limit: 10 });

// Manipulation erkennen
// (intern: jemand aendert Event 1 direkt in der DB)
const tampered = await log.verify();
// { valid: false, checked: 2, errors: [{ event_id: 1, error: 'hash mismatch' }] }
```

### 5.3 Storage-Adapter-Interface

```ts
interface AuditStore {
  getLastEvent(): Promise<AuditEvent | null>;
  appendEvent(event: AuditEvent): Promise<void>;
  getEvents(options: { limit: number; offset: number }): Promise<AuditEvent[]>;
  getAllEvents(options?: { order: 'asc' | 'desc' }): Promise<AuditEvent[]>;
}
```

**Mitgelieferte Adapter:**
- `InMemoryStore` — fuer Tests und Prototypen (im Core-Paket)

**Geplante Adapter (Community oder Pro):**
- `SQLiteStore` — fuer Desktop-Apps (better-sqlite3)
- `PostgresStore` — fuer Backend-Services
- `FileStore` — fuer CLI-Tools (JSON Lines)

### 5.4 Feature-Abgrenzung: Free vs. Pro

| Feature | Free (MIT) | Pro ($29 one-time) |
|---|---|---|
| HMAC-SHA256 Hash-Kette | Ja | Ja |
| Tamper Detection | Ja | Ja |
| Event Replay | Ja | Ja |
| Storage-Adapter-Interface | Ja | Ja |
| InMemory-Adapter | Ja | Ja |
| TypeScript Declarations | Ja | Ja |
| Zero Dependencies | Ja | Ja |
| **Compliance-Reports** (PDF/JSON) | - | Ja |
| **Multi-Chain** (separate Ketten pro Entitaet) | - | Ja |
| **Encrypted Payloads** (AES-256 fuer Event-Daten) | - | Ja |
| **Retention Policies** (automatische Archivierung) | - | Ja |
| **Audit-Export** (signiertes Archiv fuer Pruefer) | - | Ja |

### 5.5 Technische Anforderungen

| Anforderung | Spezifikation |
|---|---|
| Runtime | Node.js >= 18 |
| Dependencies | Zero (Core). `node:crypto` fuer HMAC. |
| Module | ESM + CJS Dual-Export |
| TypeScript | .d.ts Declarations (kein TS-Sourcecode noetig) |
| Tests | 100% Coverage fuer Core (node:test) |
| CI | GitHub Actions (Test + Lint + npm publish on tag) |
| Lizenz | MIT (Free Core) |

---

## 6. Geschaeftsmodell-Analyse

### 6.1 Primaeres Ziel: Vertrauensbildung (nicht Umsatz)

Das npm-Paket ist primaer ein **Marketing- und Vertrauens-Asset**, kein
eigenstaendiges Umsatzprodukt. Es rechtfertigt sich durch:

1. **Erhoehte Glaubwuerdigkeit** der Code-Fabrik-Produkte
2. **SEO und Sichtbarkeit** in der Entwickler-Community
3. **Recruiting-Signal** (Open Source Maintainer)
4. **Optionale Monetarisierung** als Bonus, nicht als Muss

### 6.2 Monetarisierungsoptionen (nachrangig)

#### Option A: Open Core (empfohlen, wenn Monetarisierung gewuenscht)

- Free: MIT-lizenzierter Core (Hash-Kette, Verify, Replay, InMemory-Adapter)
- Pro: $29 one-time fuer Compliance-Reports, Multi-Chain, Encrypted Payloads
- **Break-even bei 50 Pro-Kaeufen** (bei ~$1.450 minus Fees)

#### Option B: Support-Tier

- Free: Vollstaendiges Paket
- Support: $99/Jahr fuer priorisierte Issue-Bearbeitung + Audit-Attestierung
- Zielgruppe: Unternehmen mit Compliance-Audits

#### Option C: Keine Monetarisierung

- Vollstaendiges Paket unter MIT
- Wert liegt ausschliesslich in Vertrauensbildung fuer Code-Fabrik
- Niedrigste Komplexitaet, hoechste Community-Akzeptanz

**Empfehlung:** Mit Option C starten (maximale Adoption), Option A spaeter
nachruestbar wenn Nachfrage nach Pro-Features entsteht.

### 6.3 Kosten-Nutzen-Analyse

#### Kosten (einmalig)

| Posten | Aufwand |
|---|---|
| Clean-Room-Extraktion + API-Design | 3-4 Tage |
| TypeScript Declarations | 1 Tag |
| Englische Docs + README + Beispiele | 2 Tage |
| Storage-Adapter-Interface + InMemory | 1 Tag |
| CI/CD Setup (GitHub Actions + npm) | 0.5 Tage |
| Tests (100% Coverage) | 2 Tage |
| npm-Scope + Repo-Setup | 0.5 Tage |
| **Gesamt** | **~10 Arbeitstage** |

#### Kosten (laufend)

| Posten | Aufwand/Monat |
|---|---|
| Issue-Triage + Community | 2-4 Stunden |
| Security-Updates | Bei Bedarf |
| Dependency-Updates | Keine (Zero Dependencies) |
| **Gesamt** | **~4 Stunden/Monat** |

#### Nutzen (qualitativ)

| Nutzen | Wirkung |
|---|---|
| Vertrauensbeweis fuer Kunden | Direkt auf Produktseiten kommunizierbar |
| Unabhaengige Pruefbarkeit | Kassenpruefer/IT-Dienstleister koennen verifizieren |
| Sichtbarkeit in Entwickler-Community | npm, GitHub, dev.to, Hacker News |
| GoBD-Argument | "Die Integritaetslogik ist oeffentlich geprueft" |
| NIS2-Readiness-Story | Aktuelles Regulierungsthema |
| Differenzierung gegenueber Wettbewerb | Kein Wettbewerber legt seine Audit-Logik offen |

### 6.4 Risiken

| Risiko | Eintritt | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| Geringe Adoption | Mittel | Vertrauens-Argument schwaecher | Auch 100 Stars sind besser als 0. Wert bleibt als Pruefbarkeit bestehen. |
| Security-Vulnerability im Paket | Niedrig | Reputationsschaden | Zero Dependencies, kleine Codebase, 100% Test-Coverage |
| Jemand forkt und baut bessere Version | Niedrig | Marktanteil | MIT erlaubt das. Erstvorteil + Community pflegen. |
| Maintenance-Aufwand steigt | Niedrig | Zeitkosten | Zero Dependencies, kleine API-Oberflaeche begrenzen Aufwand |
| Interessenkonflikt Free vs. Pro | Mittel | Community-Aerger | Pro-Features muessen echten Mehrwert bieten, Core darf nicht kuenstlich beschraenkt sein |

---

## 7. Go-to-Market-Strategie

### 7.1 Launch-Plan

**Phase 1: Soft Launch (Woche 1-2)**

- npm publish v0.1.0
- README mit Badges, Quick Start, API-Docs, 3 Beispiele
- GitHub-Repo mit Issues, Contributing Guide, Code of Conduct

**Phase 2: Community-Seeding (Woche 3-4)**

- Blog-Post auf dev.to: "Building a Tamper-Proof Audit Log in 10 Lines of Code"
- Reddit: r/node, r/javascript, r/typescript (Show HN Style)
- Hacker News: "Show HN: Tamper-proof audit logs for Node.js (MIT, zero deps)"
- Twitter/X: Thread mit NIS2/SOC2-Kontext

**Phase 3: Integration (Woche 5-8)**

- Erste Community-Storage-Adapter (SQLite, Postgres)
- Integration in Code-Fabrik-Produkte (finanz-shared nutzt npm-Paket statt eigenen Code)
- "Used by"-Badge auf Produktseiten

**Phase 4: Stabilisierung (Monat 3-6)**

- v1.0.0 nach Community-Feedback
- Optional: Pro-Features wenn Nachfrage besteht
- Referenz in Compliance-Guides (NIS2, SOC2)

### 7.2 Erfolgskriterien (12 Monate)

| Metrik | Ziel (konservativ) | Ziel (optimistisch) |
|---|---|---|
| npm Downloads/Woche | 200 | 2.000 |
| GitHub Stars | 100 | 1.000 |
| Open Issues | <10 unbeantwortet | <10 unbeantwortet |
| Security Advisories | 0 | 0 |
| Community Storage-Adapter | 1 | 3 |
| Erwaehnung in Compliance-Guides | 0 | 2 |

### 7.3 Content-Strategie

| Inhalt | Plattform | Zeitpunkt |
|---|---|---|
| "Why HMAC hash chains beat blockchain for audit logs" | dev.to / Blog | Launch |
| "NIS2 compliance checklist for Node.js developers" | dev.to | Launch + 2 Wochen |
| "How we built tamper-proof data integrity for desktop apps" | Blog | Launch + 4 Wochen |
| npm-Suchoptimierung (Keywords, Description) | npm | Launch |
| "So schuetzt dieses Tool Ihre Daten" (deutsch, fuer Kunden) | Produktseiten | Nach v1.0.0 |

---

## 8. Wettbewerbsvorteile und Differenzierung

### 8.1 Gegenueber SaaS-Loesungen (Datadog, Pangea, etc.)

| Merkmal | SaaS Audit-Logs | tamperproof-log |
|---|---|---|
| Datenspeicherung | Cloud des Anbieters | Lokal (Entwickler waehlt Storage) |
| Kosten | Ab $15/Monat/Host | Kostenlos (MIT) |
| Vendor Lock-in | Hoch | Keiner |
| Offline-Faehigkeit | Nein | Ja |
| GDPR-Implikation | Auftragsverarbeitung noetig | Keine (Daten bleiben lokal) |
| Integrationskomplexitaet | API-Key + SDK + Config | `npm install` + 3 Zeilen Code |

### 8.2 Gegenueber Blockchain-basierten Loesungen

| Merkmal | Blockchain | tamperproof-log |
|---|---|---|
| Infrastruktur | Nodes, Konsens, Gas-Kosten | Keine |
| Latenz | Sekunden bis Minuten | Mikrosekunden |
| Kosten | Transaktionsgebuehren | Keine |
| Komplexitaet | Hoch | 3 Zeilen Code |
| Pruefbarkeit | Blockchain Explorer | `log.verify()` |
| Offline-Faehigkeit | Nein | Ja |

### 8.3 Gegenueber Eigenentwicklung

| Merkmal | Eigenentwicklung | tamperproof-log |
|---|---|---|
| Aufwand | 2-5 Tage + Reviews | `npm install` + 3 Zeilen |
| Testabdeckung | Variiert | 100% |
| Maintenance | Eigenverantwortung | Community + Maintainer |
| Audit-Faehigkeit | "Wir haben das selbst gebaut" | "Wir nutzen ein getestetes OSS-Paket" |
| Dokumentation | Intern | Oeffentlich + Beispiele |

---

## 9. Technische Roadmap

### 9.1 v0.1.0 — MVP (Launch)

- HMAC-SHA256 Hash-Kette (append, verify, getEvents)
- InMemoryStore
- TypeScript Declarations
- Zero Dependencies
- README mit Quick Start + 3 Beispiele
- 100% Test-Coverage
- GitHub Actions CI

### 9.2 v0.2.0 — Adapter

- Storage-Adapter-Interface formalisiert
- SQLiteStore (optional, als separates Paket `tamperproof-log-sqlite`)
- Event-Filtering (by type, by date range)

### 9.3 v0.3.0 — Compliance

- Export-Format fuer Auditoren (signiertes JSON-Archiv)
- Verifizierungstool (CLI: `npx tamperproof-log verify <file>`)
- Compliance-Checkliste in Docs (NIS2, SOC2, ISO 27001)

### 9.4 v1.0.0 — Stable

- Semver-Garantie
- Migration-Guide
- Performance-Benchmarks
- Security Audit (optional, wenn Budget vorhanden)

---

## 10. Rechtliche Aspekte

### 10.1 Lizenzstrategie

| Komponente | Lizenz | Begruendung |
|---|---|---|
| Core-Paket | MIT | Maximale Adoption, keine Huerden |
| Pro-Features (spaeter) | Proprietaer | Open Core Modell |
| Code-Fabrik Produkte | GPL 3.0 | Copyleft schuetzt vor proprietaeren Forks |

**Kein Konflikt:** Das npm-Paket (MIT) kann von GPL-3.0-Software verwendet werden.
GPL-3.0-Software kann MIT-Dependencies einbinden.

### 10.2 Clean-Room-Extraktion

FEAT-008 definiert als Acceptance Criterion:
> "Kein Code aus finanz-shared direkt kopiert (Clean-Room-Extraktion)"

Das bedeutet: Die API und Logik werden neu implementiert, inspiriert durch die
bestehende Implementierung, aber nicht als Copy-Paste. Das vermeidet:
- GPL-3.0-Kontamination des MIT-Pakets
- Code-Qualitaetsprobleme durch Altlasten
- API-Design-Kompromisse durch interne Nutzungsmuster

### 10.3 Haftung

Das Paket ist ein Entwicklerwerkzeug, keine Compliance-Zertifizierung.
README und Lizenz enthalten Standard-Disclaimer:
> "This software is provided as-is. It does not constitute legal advice or guarantee
> regulatory compliance. Consult a qualified auditor for compliance decisions."

---

## 11. Alignment mit Code-Fabrik-Strategie

### 11.1 Passt zum Geschaeftsmodell

| Code-Fabrik Prinzip | Wie das npm-Paket es unterstuetzt |
|---|---|
| "Kein Geheimnis" | Macht den kritischsten Baustein oeffentlich |
| "Organisches Wachstum" | npm + GitHub = organische Sichtbarkeit |
| "Kein Over-Engineering" | Kleine Codebase, klarer Scope, Zero Dependencies |
| "Erst Adoption, dann Monetarisierung" | Free Core zuerst, Pro optional spaeter |
| "KI-entwickelt, aber KI-frei" | Paket enthaelt keine KI |
| "Open Source Glaubwuerdigkeit" | Zeigt: Wir reden nicht nur ueber Open Source, wir machen es |

### 11.2 Passt zur Roadmap

- Das npm-Paket ist **parallel entwickelbar** (kein Blocker fuer andere Stories)
- Es kann **vor v1.0.0** der Code-Fabrik veroeffentlicht werden
- Es unterstuetzt **v0.5.8 "Geschaeftsplan"** (Marktanalyse-Baustein)
- Es liefert einen **konkreten Vertrauensbeweis** fuer Referenzkunden-Gespraeche (v0.7.0)

### 11.3 Kein Risiko fuer bestehende Produkte

FEAT-008 definiert als Non-Goals:
- Keine Aenderung an finanz-shared oder bestehenden Produkten
- Keine Monetarisierung in Phase 1
- Kein Hosted Service oder SaaS
- Keine framework-spezifischen Adapter im Core

Das Paket ist **additiv**: Es fuegt etwas hinzu, ohne etwas zu aendern.

---

## 12. Empfehlung

### 12.1 Gesamtbewertung

| Kriterium | Bewertung |
|---|---|
| Marktluecke | **Klar vorhanden** — kein aktiver Wettbewerber auf npm |
| Regulatorischer Rueckenwind | **Stark** — NIS2, DORA, GoBD, SOC2 |
| Technische Machbarkeit | **Hoch** — 70% existieren bereits, Clean-Room in 10 Tagen |
| Strategischer Fit | **Perfekt** — stuetzt alle vier Versprechen von Code-Fabrik |
| Risiko | **Niedrig** — kleine Codebase, Zero Dependencies, kein Eingriff in bestehende Produkte |
| Kosten-Nutzen | **Positiv** — 10 Tage Aufwand fuer dauerhaften Vertrauensbeweis |

### 12.2 Entscheidungsempfehlung

**Umsetzung empfohlen.** Das npm-Paket hat einen klaren strategischen Wert als
Vertrauensanker fuer die Code-Fabrik-Produkte und eine reale Marktluecke.

**Timing:** Parallel zu v0.7.0 (Windows-Builds + Referenzkunde), damit das Paket
bei den ersten Referenzkunden-Gespraechen als Vertrauensbeweis erwaehnt werden kann.

**Priorisierung:** Vertrauensbildung > Monetarisierung > Community-Groesse.

### 12.3 Naechste Schritte

1. **npm-Paketnamen pruefen** — `tamperproof-log` auf npm-Verfuegbarkeit testen
2. **API-Design finalisieren** — Review der vorgeschlagenen API in Abschnitt 5.2
3. **GitHub-Repo erstellen** — Public, MIT, README Template
4. **Clean-Room-Implementierung** — 10 Arbeitstage
5. **v0.1.0 auf npm veroeffentlichen**
6. **Community-Seeding** — dev.to, Reddit, Hacker News

---

## Anhang A: Referenzen

- **FEAT-008 Story:** `.stories/FEAT-008-audit-log-npm-oss.yml`
- **Bestehende Implementierung:** `packages/finanz-shared/src/models/events.js`
- **Architektur-Integritaet:** `docs/konzept/architektur-integritaet-tests.md`
- **Gesamtkonzept v4:** `docs/konzept/gesamtkonzept-v4.md`
- **Produktstrategie:** `docs/produktstrategie-lokal-tools.md`
- **Roadmap:** `docs/roadmap/ROADMAP-v0.6.md`

## Anhang B: Regulatorische Referenzen

- **NIS2:** Richtlinie (EU) 2022/2555, Art. 21 (Risikomanagementmassnahmen)
- **DORA:** Verordnung (EU) 2022/2554 (Digital Operational Resilience Act)
- **GoBD:** BMF-Schreiben vom 28.11.2019, Tz. 58-62 (Unveraenderbarkeit)
- **GDPR:** Verordnung (EU) 2016/679, Art. 5(1)(f) (Integritaet und Vertraulichkeit)
- **SOC 2:** AICPA TSP Section 100, CC7.2 (System Operations — Monitoring)
- **ISO 27001:2022:** Annex A, A.8.15 (Logging), A.8.17 (Clock Synchronization)

## Anhang C: Vergleichbare Open-Core npm-Pakete (Referenzmodelle)

Diese Pakete nutzen erfolgreich das Open-Core-Modell und koennen als
Referenz fuer Paketstruktur, Pricing und Community-Management dienen:

| Paket | Free | Pro/Enterprise | Downloads/Woche |
|---|---|---|---|
| `bull` / `bullmq` | MIT Queue | BullMQ Pro ($999/Jahr) | ~500.000 |
| `ag-grid` | MIT Community | Enterprise ($999+) | ~800.000 |
| `typeorm` | MIT | Sponsor-Features | ~600.000 |
| `prisma` | Apache 2.0 | Prisma Data Platform | ~1.500.000 |

**Kern-Einsicht:** Erfolgreiche Open-Core-Pakete haben einen vollwertigen Free-Tier
und bieten Pro-Features, die Enterprise-Kunden ansprechen — nicht kuenstliche Limits
fuer Einzelentwickler.
