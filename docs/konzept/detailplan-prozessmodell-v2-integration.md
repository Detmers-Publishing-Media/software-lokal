# Code-Fabrik — Detailplan: Prozessmodell v2 Integration

*Stand: 2026-03-07*
*Status: Planend*
*Bezug: review-prompt-prozessmodell-v2.md (Review-Ergebnisse)*

---

## Uebersicht

Drei Arbeitspakete aus dem Review des Prozessmodells v2:

| # | Arbeitspaket | Story-ID | Typ | Lane | Aufwand |
|---|---|---|---|---|---|
| 1 | Pipeline-Integration (Governance in Poller + CI) | PLAT-049 | infra-factory | slow | L |
| 2 | Single Source of Truth (Story-Typen + Konsistenz) | PLAT-050 | docs-governance | slow | M |
| 3 | Produkt-Kreuzimport-Regel | PLAT-051 | docs-governance | slow | S |

Reihenfolge: PLAT-050 → PLAT-051 → PLAT-049
(Erst die Datenquelle bereinigen, dann neue Regel, dann Pipeline-Einbindung)

---

## PLAT-050: Single Source of Truth fuer Story-Typen

### Ziel

Story-Typen, Lane-Zuordnungen und Force-Approve-Regeln an genau EINER Stelle definieren.
Alle anderen Artefakte referenzieren oder lesen diese Quelle.

### Problem

Aktuell sind die 6 Story-Typen und ihre Regeln an 4 Stellen definiert:

1. `docs/governance/merge-policy.md` (Prosa-Tabelle)
2. `scripts/validate-story-governance.mjs` (JS-Konstanten, Z.28-47)
3. `.stories/story.template.yml` (YAML-Kommentare)
4. `CLAUDE.md` (Markdown-Tabelle, Z.125-132)

### Loesung

Neue Datei `docs/governance/story-types.yml` als Single Source of Truth.
CI-Script liest diese Datei. Merge-Policy und CLAUDE.md verweisen darauf.

### Neue Datei: `docs/governance/story-types.yml`

```yaml
# Code-Fabrik — Story-Typen (Single Source of Truth)
# Wird von validate-story-governance.mjs gelesen.
# Aenderungen hier gelten automatisch fuer CI.
#
# Status: Verbindlich
# Stand: 2026-03-07

types:
  product-fast:
    description: "Reine Produktfeatures, UI, Fachlogik"
    default_lane: "fast"
    force_approve_allowed: true
    auto_merge_allowed: true
    founder_gate_required: false

  shared-pattern:
    description: "Wiederverwendbare Module in packages/shared"
    default_lane: "fast"
    force_approve_allowed: true
    auto_merge_allowed: true
    founder_gate_required: false
    notes: "slow wenn migrationsrelevant oder von >2 Produkten genutzt"

  platform-core:
    description: "Aenderungen am Plattformkern"
    default_lane: "slow"
    force_approve_allowed: false
    auto_merge_allowed: false
    founder_gate_required: true

  support-runtime:
    description: "Diagnose, Recovery, Support, Fehlercodes"
    default_lane: "slow"
    force_approve_allowed: false
    auto_merge_allowed: false
    founder_gate_required: true

  infra-factory:
    description: "CI, Automation, Poller, Ansible, Fabrik-im-Koffer"
    default_lane: "slow"
    force_approve_allowed: false
    auto_merge_allowed: false
    founder_gate_required: true

  docs-governance:
    description: "Verbindliche Architektur- oder Prozessdoku"
    default_lane: "slow"
    force_approve_allowed: false
    auto_merge_allowed: false
    founder_gate_required: true
    notes: "Reine Tippfehler-Korrekturen koennen fast sein"
```

### Aenderung: `scripts/validate-story-governance.mjs`

Die hartcodierten Konstanten durch Laden aus `story-types.yml` ersetzen:

```javascript
// VORHER (Z.28-47):
const VALID_STORY_TYPES = ['product-fast', ...];
const SLOW_LANE_TYPES = ['platform-core', ...];
const NO_FORCE_APPROVE_TYPES = ['platform-core', ...];

// NACHHER:
function loadStoryTypes(rootDir) {
  const typesFile = join(rootDir, 'docs/governance/story-types.yml');
  if (!existsSync(typesFile)) {
    console.error('FATAL: docs/governance/story-types.yml not found');
    process.exit(1);
  }
  const text = readFileSync(typesFile, 'utf-8');
  const types = {};
  let currentType = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;

    // Top-level type name (2 spaces indent under types:)
    const typeMatch = line.match(/^  ([\w-]+):$/);
    if (typeMatch) {
      currentType = typeMatch[1];
      types[currentType] = {};
      continue;
    }

    if (currentType) {
      const kvMatch = line.match(/^\s{4}(\w[\w_]*):\s*(.+)$/);
      if (kvMatch) {
        let val = kvMatch[2].trim().replace(/^"|"$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        types[currentType][kvMatch[1]] = val;
      }
    }
  }

  const valid = Object.keys(types);
  const slowLane = valid.filter(t => types[t].default_lane === 'slow');
  const noForceApprove = valid.filter(t => types[t].force_approve_allowed === false);

  return { types, valid, slowLane, noForceApprove };
}
```

Aufruf in `main()`:

```javascript
const { types, valid, slowLane, noForceApprove } = loadStoryTypes(rootDir);
// Ersetze VALID_STORY_TYPES, SLOW_LANE_TYPES, NO_FORCE_APPROVE_TYPES
```

### Aenderung: `docs/governance/merge-policy.md`

Tabelle "6 Story-Typen" ersetzen durch Verweis:

```markdown
## Story-Klassifikation

Jede Story MUSS einen der Typen aus `docs/governance/story-types.yml` tragen.
Die vollstaendige Liste mit Default-Lanes und Regeln ist dort definiert.

**Zusammenfassung:**
- `product-fast`, `shared-pattern` → Default: Fast Lane
- `platform-core`, `support-runtime`, `infra-factory`, `docs-governance` → Default: Slow Lane
- Details und Ausnahmen: siehe `story-types.yml`
```

### Aenderung: `CLAUDE.md`

Tabelle ersetzen durch:

```markdown
### Story-Klassifikation

Jede Story MUSS einen `story_type` und eine `lane` haben.
Die vollstaendige Typ-Definition steht in `docs/governance/story-types.yml`.

**Kurzfassung:** `product-fast` und `shared-pattern` sind Fast Lane.
Alles andere ist Slow Lane mit Founder Gate.
```

### Aenderung: `.stories/story.template.yml`

Kommentar ergaenzen:

```yaml
story_type: ""
# Erlaubte Werte: siehe docs/governance/story-types.yml
# Kurzfassung: product-fast, shared-pattern, platform-core,
#   support-runtime, infra-factory, docs-governance
```

### Verifikation

```bash
# CI-Script muss weiterhin korrekt validieren:
node scripts/validate-story-governance.mjs
# → OK: All governance checks passed.

# Neuen Typ in story-types.yml hinzufuegen → CI erkennt ihn automatisch
# Typ aus story-types.yml entfernen → CI blockiert Stories mit dem Typ
```

### Akzeptanzkriterien

1. `docs/governance/story-types.yml` existiert mit allen 6 Typen
2. `validate-story-governance.mjs` liest Typen aus YAML statt aus Konstanten
3. CI-Validierung funktioniert wie vorher (gleiche Testergebnisse)
4. merge-policy.md verweist auf story-types.yml
5. CLAUDE.md verweist auf story-types.yml
6. story.template.yml verweist auf story-types.yml

---

## PLAT-051: Produkt-Kreuzimport-Regel

### Ziel

Verhindern dass Produkt A Code aus Produkt B importiert.
Bei 20 Produkten wuerde das zu einem Abhaengigkeits-Spaghetti fuehren.

### Aenderung: `docs/governance/protected-paths.yml`

Neue Import-Regel nach den bestehenden 4 Regeln:

```yaml
  - name: "product-no-cross-imports"
    description: "Produkte duerfen keine anderen Produkte importieren"
    source_pattern: "products/**/*.{js,ts,svelte,mjs}"
    forbidden_imports:
      - "../products/"
      - "../../products/"
      - "products/"
      - "@codefabrik/mitglieder"
      - "@codefabrik/kassenbuch"
      - "@codefabrik/finanzrechner"
    exceptions: []
```

**Hinweis:** Die `@codefabrik/*`-Eintraege decken den Fall ab, dass Produkte
als npm-Packages referenziert werden. Die Liste muss bei neuen Produkten
erweitert werden. Alternativ: Regex-Match auf `@codefabrik/` + Pruefung
ob der Import-Name einem Produkt entspricht.

### Aenderung: `scripts/validate-story-governance.mjs`

Die Import-Regex-Pruefung erweitern fuer relative Pfade mit `../`:

```javascript
// In checkImportBoundaries(), nach dem bestehenden importRegex:
// Zusaetzlich dynamische Imports pruefen:
const dynamicImportRegex = new RegExp(
  `import\\s*\\(\\s*['"]${escapeRegex(forbidden)}`,
  'gm'
);
if (dynamicImportRegex.test(content)) {
  errors.push(`[${rule.name}] "${relPath}" dynamically imports forbidden "${forbidden}"`);
}
```

### Aenderung: `docs/governance/merge-policy.md`

Import-Grenzen-Tabelle ergaenzen:

```markdown
| Produkt → Produkt | Produkte duerfen keine anderen Produkte importieren |
```

### Verifikation

```bash
# Testdatei erstellen:
mkdir -p /tmp/test-cross/products/app-a/src
echo 'import { foo } from "../../products/app-b/src/lib.js"' > /tmp/test-cross/products/app-a/src/main.js
# → CI muss ERROR melden

node scripts/validate-story-governance.mjs --check-imports
```

### Akzeptanzkriterien

1. `product-no-cross-imports` Regel in protected-paths.yml
2. CI erkennt Kreuzimporte (statisch + dynamisch)
3. merge-policy.md aktualisiert
4. CLAUDE.md Import-Grenzen-Liste aktualisiert

---

## PLAT-049: Pipeline-Integration

### Ziel

Die Governance-Regeln werden von der Pipeline automatisch durchgesetzt.
Der Poller liest Story-Typ und Lane, steuert Auto-Merge und Force-Approve,
und fuehrt das CI-Script als Gate aus.

### Voraussetzung

- PLAT-050 (Single Source of Truth) muss fertig sein
- PLAT-051 (Kreuzimport-Regel) muss fertig sein

### Uebersicht der Aenderungen

```
openclaw-poller.sh.j2 (Hauptscript, 608 Zeilen)
├── Phase 1 DISPATCH: Story-Typ + Lane aus YAML lesen, validieren
├── Phase 2 BRIDGE:   Lane-Info in _task.md aufnehmen
├── Phase 3b REVIEW:  Force-Approve blockieren bei force_approve_allowed=false
├── Phase 4 PR-CHECK: Auto-Merge nur bei auto_merge_allowed=true
└── NEU Phase 4b:     validate-story-governance.mjs als Gate

validate-story-governance.mjs
└── Auf PROD-Server deployen (in OpenClaw-Container oder als separates Script)

Forgejo Actions Workflow
└── validate-governance.yml — laeuft bei jedem PR
```

### Teilpaket 1: Story-Metadaten im Poller lesen

**Datei:** `ansible/roles/poller/templates/openclaw-poller.sh.j2`

Neue Hilfsfunktion nach `log_poller_event()` (nach Z.130):

```bash
# ─── Story-Governance-Felder lesen ───────────────────────────────────────────
read_story_field() {
  local story_file="$1"
  local field="$2"
  local value
  value=$(grep "^${field}:" "$story_file" 2>/dev/null | head -1 | \
    sed "s/^${field}:\s*//" | tr -d '"'"'" | tr -d '[:space:]')
  echo "$value"
}

read_story_governance() {
  local story_file="$1"
  STORY_TYPE=$(read_story_field "$story_file" "story_type")
  STORY_LANE=$(read_story_field "$story_file" "lane")
  FORCE_APPROVE=$(read_story_field "$story_file" "force_approve_allowed")
  AUTO_MERGE=$(read_story_field "$story_file" "auto_merge_allowed")
  FOUNDER_GATE=$(read_story_field "$story_file" "founder_gate_required")

  # Defaults fuer Stories ohne Governance-Felder (Abwaertskompatibilitaet)
  [ -z "$STORY_TYPE" ] && STORY_TYPE="product-fast"
  [ -z "$STORY_LANE" ] && STORY_LANE="fast"
  [ -z "$FORCE_APPROVE" ] && FORCE_APPROVE="true"
  [ -z "$AUTO_MERGE" ] && AUTO_MERGE="true"
  [ -z "$FOUNDER_GATE" ] && FOUNDER_GATE="false"
}
```

### Teilpaket 2: Phase 1 DISPATCH — Governance-Validierung

**Datei:** `ansible/roles/poller/templates/openclaw-poller.sh.j2`

In der Dispatch-Schleife (nach Z.182, nach dem Lesen des Produkt-Felds):

```bash
  # Governance-Felder lesen
  read_story_governance "$story_file"
  log "dispatch: $story_id — type=$STORY_TYPE lane=$STORY_LANE founder_gate=$FOUNDER_GATE"

  # Einfache Validierung: Slow-Lane-Typen muessen lane=slow haben
  case "$STORY_TYPE" in
    platform-core|support-runtime|infra-factory)
      if [ "$STORY_LANE" != "slow" ]; then
        log "dispatch: FEHLER: $story_id hat story_type=$STORY_TYPE aber lane=$STORY_LANE (muss slow sein)"
        update_poller_state "$story_id" "governance-error"
        log_poller_event "$story_id" "governance_error" "story_type=$STORY_TYPE erfordert lane=slow"
        # Story nicht verschieben — bleibt in Inbox als Fehler
        continue
      fi
      ;;
  esac

  # Lane in Metrik speichern
  record_metric "$story_id" "story_type" "'$STORY_TYPE'"
  record_metric "$story_id" "lane" "'$STORY_LANE'"
```

### Teilpaket 3: Phase 2 BRIDGE — Lane-Info in _task.md

**Datei:** `ansible/roles/poller/templates/openclaw-poller.sh.j2`

In der _task.md-Erzeugung (Z.255-271), Metadaten-Block erweitern:

```bash
        # Governance-Felder lesen
        read_story_governance "$WORK_DIR/process/work/04-in-progress/$story_id.yml"

        cat > "_task.md" << TASKEOF
# Task: $story_id

## Titel
$story_title

## Beschreibung
$(cat "$WORK_DIR/process/work/04-in-progress/$story_id.yml" | grep -A20 '^beschreibung:' | tail -n +2 | grep '  ' | sed 's/^  //' || echo "Implementiere die Story gemaess Akzeptanzkriterien.")

## Akzeptanzkriterien
$AKZEPTANZKRITERIEN

## Metadaten
- Story-ID: $story_id
- Branch: $BRANCH_NAME
- Version: v$FACTORY_VERSION
- Story-Typ: $STORY_TYPE
- Lane: $STORY_LANE
- Founder Gate: $FOUNDER_GATE
TASKEOF
```

### Teilpaket 4: Phase 3b REVIEW — Force-Approve blockieren

**Datei:** `ansible/roles/poller/templates/openclaw-poller.sh.j2`

Die Force-Approve-Logik (Z.422-433) aendern:

```bash
  # Review-Iterationen pruefen
  REVIEW_ITERS=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c \
    "SELECT COALESCE(review_iterations, 0) FROM pipeline_metrics WHERE object_id='$story_id'" 2>/dev/null | tr -d '[:space:]')
  REVIEW_ITERS=${REVIEW_ITERS:-0}

  # Governance-Felder lesen
  read_story_governance "$story_file"

  if [ "$REVIEW_ITERS" -ge "{{ max_review_iterations }}" ]; then
    if [ "$FORCE_APPROVE" = "false" ]; then
      # Slow Lane: Force-Approve VERBOTEN → Story blockieren
      log "review: $story_id — Max-Iterationen erreicht, aber force_approve_allowed=false → BLOCKIERT"
      update_poller_state "$story_id" "blocked-needs-po"
      record_metric "$story_id" "blocked_at"
      record_metric "$story_id" "blocked_reason" "'force-approve-denied'"
      log_poller_event "$story_id" "blocked" "Max-Iterationen, force_approve nicht erlaubt (lane=$STORY_LANE)"

      # Story in needs-po verschieben
      cd "$WORK_DIR/process"
      BLOCKED_DIR="work/09-blocked/needs-po"
      mkdir -p "$BLOCKED_DIR"
      if [ -f "work/04-in-progress/$story_id.yml" ]; then
        git mv "work/04-in-progress/$story_id.yml" "$BLOCKED_DIR/$story_id.yml" 2>/dev/null || \
          mv "work/04-in-progress/$story_id.yml" "$BLOCKED_DIR/$story_id.yml"
        git add -A
        git commit -m "review: $story_id blockiert — Founder Gate erforderlich" 2>/dev/null || true
        git push origin main --quiet 2>/dev/null || true
      fi
    else
      # Fast Lane: Force-Approve erlaubt
      log "review: $story_id — Max-Iterationen ({{ max_review_iterations }}) erreicht → force-approve"
      update_poller_state "$story_id" "reviewed" "$BRANCH_NAME"
      record_metric "$story_id" "review_verdict" "'force-approved'"
      record_metric "$story_id" "review_completed_at"
      log_poller_event "$story_id" "force_approved" "Max-Iterationen erreicht ($REVIEW_ITERS)"
    fi
    continue
  fi
```

### Teilpaket 5: Phase 4 PR-CHECK — Auto-Merge steuern

**Datei:** `ansible/roles/poller/templates/openclaw-poller.sh.j2`

Nach der PR-Erstellung (Z.591-596), Auto-Merge-Logik:

```bash
  PR_NUMBER=$(echo "$PR_RESULT" | jq -r '.number // "?"' 2>/dev/null)
  if [ "$PR_NUMBER" != "?" ] && [ -n "$PR_NUMBER" ]; then
    log "pr-check: $story_id → PR #$PR_NUMBER erstellt"
    update_poller_state "$story_id" "pr_created" "$BRANCH_NAME"
    record_metric "$story_id" "pr_created_at"
    log_poller_event "$story_id" "pr_created" "PR #$PR_NUMBER"

    # Governance-Felder lesen
    read_story_governance "$story_file"

    if [ "$AUTO_MERGE" = "true" ]; then
      # Fast Lane: Auto-Merge aktivieren
      log "pr-check: $story_id — Auto-Merge aktiviert (lane=$STORY_LANE)"

      # Forgejo Auto-Merge via API
      forgejo_api \
        -X POST \
        "$FORGEJO_URL/api/v1/repos/$FORGEJO_ORG/$story_produkt/pulls/$PR_NUMBER/merge" \
        -d '{"Do": "merge", "merge_message_field": "'"$story_id"': Auto-Merge (Fast Lane)"}' \
        2>/dev/null || log "pr-check: Auto-Merge fehlgeschlagen fuer PR #$PR_NUMBER"

      # Story nach done verschieben
      cd "$WORK_DIR/process"
      DONE_DIR="work/08-done"
      mkdir -p "$DONE_DIR"
      if [ -f "work/04-in-progress/$story_id.yml" ]; then
        git mv "work/04-in-progress/$story_id.yml" "$DONE_DIR/$story_id.yml" 2>/dev/null || \
          mv "work/04-in-progress/$story_id.yml" "$DONE_DIR/$story_id.yml"
        git add -A
        git commit -m "done: $story_id (Auto-Merge, Fast Lane)" 2>/dev/null || true
        git push origin main --quiet 2>/dev/null || true
      fi
      update_poller_state "$story_id" "done" "$BRANCH_NAME"
      record_metric "$story_id" "completed_at"
      log_poller_event "$story_id" "done" "Auto-Merge PR #$PR_NUMBER"
    else
      # Slow Lane: PR erstellt, wartet auf Founder Gate
      log "pr-check: $story_id — Slow Lane, PR #$PR_NUMBER wartet auf Founder Gate"

      # Label setzen
      forgejo_api \
        -X POST \
        "$FORGEJO_URL/api/v1/repos/$FORGEJO_ORG/$story_produkt/labels" \
        -d '{"name": "awaiting-founder-gate", "color": "#e11d48"}' \
        2>/dev/null || true

      forgejo_api \
        -X POST \
        "$FORGEJO_URL/api/v1/repos/$FORGEJO_ORG/$story_produkt/issues/$PR_NUMBER/labels" \
        -d '{"labels": ["awaiting-founder-gate"]}' \
        2>/dev/null || true

      log_poller_event "$story_id" "awaiting_founder_gate" "PR #$PR_NUMBER wartet auf PO"
    fi
  fi
```

### Teilpaket 6: Forgejo Actions Workflow fuer Governance-CI

**Neue Datei:** `.forgejo/workflows/validate-governance.yml`

Dieser Workflow laeuft bei jedem PR und validiert die Governance-Regeln.

```yaml
name: Governance Validation
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fuer git diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Get changed files
        id: changed
        run: |
          CHANGED=$(git diff --name-only origin/main...HEAD | tr '\n' ' ')
          echo "files=$CHANGED" >> "$GITHUB_OUTPUT"

      - name: Validate Story Governance
        run: |
          node scripts/validate-story-governance.mjs \
            --changed-files ${{ steps.changed.outputs.files }}

      - name: Check Import Boundaries
        run: |
          node scripts/validate-story-governance.mjs --check-imports
```

### Teilpaket 7: validate-story-governance.mjs auf PROD deployen

**Datei:** `ansible/roles/poller/tasks/main.yml`

Ergaenzen (nach dem bestehenden Template-Task):

```yaml
- name: Deploy governance validation script
  copy:
    src: "{{ playbook_dir }}/../scripts/validate-story-governance.mjs"
    dest: /opt/codefabrik/validate-story-governance.mjs
    mode: '0755'

- name: Deploy governance config files
  copy:
    src: "{{ item.src }}"
    dest: "/opt/codefabrik/{{ item.dest }}"
    mode: '0644'
  loop:
    - src: "{{ playbook_dir }}/../docs/governance/story-types.yml"
      dest: docs/governance/story-types.yml
    - src: "{{ playbook_dir }}/../docs/governance/protected-paths.yml"
      dest: docs/governance/protected-paths.yml
```

### Teilpaket 8: DB-Schema-Erweiterung

Neue Spalten in `pipeline_metrics` fuer Governance-Tracking:

```sql
ALTER TABLE pipeline_metrics
  ADD COLUMN IF NOT EXISTS story_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS lane VARCHAR(10),
  ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(100);
```

**Datei:** `ansible/roles/postgres/tasks/main.yml`

Neuen Task ergaenzen (nach den bestehenden CREATE TABLE Statements):

```yaml
- name: Add governance columns to pipeline_metrics
  community.postgresql.postgresql_query:
    db: forgejo
    login_user: forgejo
    query: |
      ALTER TABLE pipeline_metrics
        ADD COLUMN IF NOT EXISTS story_type VARCHAR(30),
        ADD COLUMN IF NOT EXISTS lane VARCHAR(10),
        ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(100);
```

### Teilpaket 9: Gateway /metrics erweitern

**Datei:** `ansible/roles/gateway/tasks/main.yml` (bzw. gateway.js Template)

Im `/metrics`-Endpoint:

```javascript
// Governance-Metriken ergaenzen
const govMetrics = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE lane = 'fast') as fast_lane_count,
    COUNT(*) FILTER (WHERE lane = 'slow') as slow_lane_count,
    COUNT(*) FILTER (WHERE blocked_reason IS NOT NULL) as blocked_count,
    COUNT(*) FILTER (WHERE blocked_reason = 'force-approve-denied') as force_approve_denied_count
  FROM pipeline_metrics
  WHERE dispatched_at > NOW() - INTERVAL '30 days'
`);

// In Response aufnehmen:
governance: {
  fast_lane_total: govMetrics.rows[0].fast_lane_count,
  slow_lane_total: govMetrics.rows[0].slow_lane_count,
  blocked_total: govMetrics.rows[0].blocked_count,
  force_approve_denied: govMetrics.rows[0].force_approve_denied_count
}
```

---

## Zusammenfassung: Alle geaenderten Dateien

### PLAT-050 (Single Source of Truth)

| Datei | Aktion | Beschreibung |
|---|---|---|
| `docs/governance/story-types.yml` | NEU | 6 Story-Typen als YAML |
| `scripts/validate-story-governance.mjs` | AENDERN | Typen aus YAML laden statt Konstanten |
| `docs/governance/merge-policy.md` | AENDERN | Verweis auf story-types.yml |
| `CLAUDE.md` | AENDERN | Verweis auf story-types.yml |
| `.stories/story.template.yml` | AENDERN | Verweis auf story-types.yml |
| `docs/governance/README.md` | AENDERN | story-types.yml in Tabelle aufnehmen |

### PLAT-051 (Kreuzimport-Regel)

| Datei | Aktion | Beschreibung |
|---|---|---|
| `docs/governance/protected-paths.yml` | AENDERN | Neue Import-Regel |
| `scripts/validate-story-governance.mjs` | AENDERN | Dynamische Imports pruefen |
| `docs/governance/merge-policy.md` | AENDERN | Tabelle ergaenzen |
| `CLAUDE.md` | AENDERN | Import-Grenzen-Liste ergaenzen |

### PLAT-049 (Pipeline-Integration)

| Datei | Aktion | Beschreibung |
|---|---|---|
| `ansible/roles/poller/templates/openclaw-poller.sh.j2` | AENDERN | 5 Teilpakete (Governance lesen, Dispatch-Validierung, Force-Approve blockieren, Auto-Merge steuern, _task.md) |
| `.forgejo/workflows/validate-governance.yml` | NEU | CI-Workflow fuer PRs |
| `ansible/roles/poller/tasks/main.yml` | AENDERN | Script + Config auf Server deployen |
| `ansible/roles/postgres/tasks/main.yml` | AENDERN | DB-Schema erweitern |
| `ansible/roles/gateway/tasks/main.yml` | AENDERN | /metrics erweitern |

---

## Rollback-Strategie

Alle drei Stories sind Slow Lane mit Founder Gate. Bei Problemen:

1. **PLAT-050 Rollback:** story-types.yml loeschen, Konstanten in validate-script wiederherstellen.
   Kein Datenverlust, kein Pipeline-Impact.

2. **PLAT-051 Rollback:** Import-Regel aus protected-paths.yml entfernen.
   Kein Datenverlust, CI wird weniger streng.

3. **PLAT-049 Rollback:** Poller-Script auf vorherige Version zuruecksetzen
   (Ansible re-deploy mit altem Template). Die Governance-Dateien bleiben bestehen,
   werden nur nicht mehr automatisch durchgesetzt.
   **Kritisch:** DB-Schema-Aenderung ist vorwaertskompatibel (ADD COLUMN IF NOT EXISTS),
   kein Rollback noetig.

---

## Testplan

### PLAT-050

1. `node scripts/validate-story-governance.mjs` → OK (wie vorher)
2. Neuen Typ in story-types.yml ergaenzen → Story mit neuem Typ wird akzeptiert
3. Typ aus story-types.yml entfernen → Story mit entferntem Typ wird abgelehnt
4. story-types.yml loeschen → Script bricht mit FATAL ab

### PLAT-051

1. Test-Datei mit Kreuzimport → CI meldet ERROR
2. Test-Datei mit dynamischem Kreuzimport `import()` → CI meldet ERROR
3. Produkt importiert eigene Dateien → Kein Fehler
4. Produkt importiert `@codefabrik/vereins-shared` → Kein Fehler

### PLAT-049

1. Story mit `lane: slow` + `story_type: product-fast` → Dispatch-Fehler (governance-error)
2. Story mit `lane: fast` → Auto-Merge nach Review
3. Story mit `lane: slow` + max Iterationen → Story blockiert in needs-po
4. Story mit `lane: slow` + APPROVED → PR erstellt, Label "awaiting-founder-gate"
5. Story ohne Governance-Felder (alt) → Defaults greifen (fast lane)
6. Forgejo PR mit geaenderten geschuetzten Pfaden → CI schlaegt fehl
