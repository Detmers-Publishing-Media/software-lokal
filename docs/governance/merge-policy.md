# Code-Fabrik — Merge-Policy

*Status: Verbindlich*
*Stand: 2026-03-07*
*Bezug: review-ergebnis-entwicklungsprozess.md*

---

## Zwei Prozesspfade

### Fast Lane

**Gilt fuer:** `product-fast`, kleine `shared-pattern`, harmlose `docs-governance`

| Eigenschaft | Wert |
|---|---|
| Auto-Merge | Erlaubt |
| Force-Approve | Erlaubt |
| Review | KI-Review reicht |
| Founder Gate | Nicht erforderlich |

### Slow Lane

**Gilt fuer:** `platform-core`, `support-runtime`, `infra-factory`, migrationsrelevante `shared-pattern`

| Eigenschaft | Wert |
|---|---|
| Auto-Merge | Verboten |
| Force-Approve | Verboten |
| Review | KI-Review + Founder Gate |
| Founder Gate | Pflicht |

---

## Story-Klassifikation

Jede Story MUSS einen der Typen aus `docs/governance/story-types.yml` tragen.
Die vollstaendige Liste mit Default-Lanes und Regeln ist dort definiert (Single Source of Truth).

**Zusammenfassung:**
- `product-fast`, `shared-pattern` → Default: Fast Lane
- `platform-core`, `support-runtime`, `infra-factory`, `docs-governance` → Default: Slow Lane
- `shared-pattern` wird `slow` wenn migrationsrelevant oder von >2 Produkten genutzt
- `docs-governance` bei Tippfehlern kann `fast` sein

---

## Platform Gate

Pflichtfragen vor jeder Story mit `platform_impact != none`:

1. Warum Plattformcode und nicht Produktcode?
2. Welche Produkte profitieren?
3. Welche Schicht wird geaendert?
4. Was bleibt bewusst produktspezifisch?
5. Welche Risiken fuer andere Produkte?

Die Antworten werden in der Story-YAML unter `platform_rationale`,
`reused_by_products` und `non_goals` dokumentiert.

---

## Founder Gate

Pflicht bei Aenderungen an geschuetzten Pfaden (siehe `protected-paths.yml`):

- `packages/electron-platform/lib/*`
- `packages/electron-platform/ipc/*`
- `preload.cjs`
- Migrations-/Backup-Kern
- Support-Bundle/Sanitizer/Fehlercodes
- Poller/Automation/Installation
- Root-CLAUDE.md
- Verbindliche Architektur-Doku

### Ablauf

1. Story wird als `founder_gate_required: true` markiert
2. KI-Review findet statt (wie bei allen Stories)
3. **Zusaetzlich:** PO prueft und gibt explizit frei
4. Erst nach PO-Freigabe darf gemergt werden

---

## Force-Approve

| Erlaubt | Verboten |
|---|---|
| `product-fast` | `platform-core` |
| Kleine Doku-Korrekturen | `support-runtime` |
| | `infra-factory` |
| | Migrationsrelevante `shared-pattern` |

---

## CI-Durchsetzung

Das Script `scripts/validate-story-governance.mjs` prueft automatisch:

1. Story-YAML hat alle Pflichtfelder
2. `story_type` ist ein gueltiger Wert
3. Lane passt zum Story-Typ
4. Geschuetzte Pfade erzwingen `slow` Lane
5. Import-Grenzen werden eingehalten

Bei Verletzung schlaegt die CI fehl.

---

## Import-Grenzen

| Regel | Beschreibung |
|---|---|
| Plattform → Produkt | Plattformcode darf keine Produkte importieren |
| Renderer → Node | Renderer darf kein `better-sqlite3` importieren |
| Renderer → Electron | Renderer darf keine direkten Electron Low-Level APIs nutzen |
| Shared → Produkt | Shared-Packages duerfen keine Produkte importieren |
| Testbare Kernlogik → Electron | Testbare Kernlogik darf kein Electron importieren |
| Produkt → Produkt | Produkte duerfen keine anderen Produkte importieren |

---

## Dokumenten-Klassifikation

| Typ | Beispiele | Aenderungsregeln |
|---|---|---|
| **Verbindlich** | Architekturpflichten, Root-CLAUDE.md, Testpflichten, PII-Regeln | Slow Lane + Founder Gate |
| **Planend** | Roadmaps, Umsetzungsplaene, naechste Schritte | Fast Lane |
| **Historisch** | Review-Protokolle, alte Bewertungen | Fast Lane |
