#!/bin/bash
# control.sh — Lokales Kontrollzentrum ("Code-Fabrik im Koffer")
# Portabel: USB-Stick oder lokaler Ordner, kein Docker noetig (ausser fuer Install)
#
# Funktionen:
#   1) Install / Update    → delegiert an install.sh (braucht Docker)
#   2) Monitoring          → SSH Health-Checks (kein Docker)
#   3) Test-Key erstellen  → Portal Admin-API (kein Docker)
#   4) Sichern             → delegiert an install.sh (braucht Docker)
#
# Voraussetzungen:
#   - SSH-Key (~/.ssh/codefabrik_deploy oder aus Env-Datei)
#   - Portal-IP + PROD-IP (aus .server-env/.portal-env oder manuell)
#   - ADMIN_TOKEN (aus .tokens-env oder manuell)
#   - Fuer Install/Sichern: Docker + install.sh im selben Verzeichnis
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_SH="$SCRIPT_DIR/install.sh"

# --- Farben (nur wenn Terminal) ---
if [ -t 1 ]; then
    GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
    CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
else
    GREEN=''; RED=''; YELLOW=''; CYAN=''; BOLD=''; NC=''
fi

# --- Hilfsfunktionen ---
die() { echo -e "${RED}FEHLER: $*${NC}" >&2; exit 1; }
info() { echo -e "${CYAN}$*${NC}"; }
ok() { echo -e "${GREEN}  OK: $*${NC}"; }
warn() { echo -e "${YELLOW}  WARN: $*${NC}"; }

# --- Konfiguration laden ---
# Suche Env-Dateien: aktuelles Verzeichnis, dann Elternverzeichnis, dann /dev/shm/codefabrik-secrets/output
ENV_SEARCH_PATHS=(
    "$SCRIPT_DIR"
    "$SCRIPT_DIR/.."
    "/dev/shm/codefabrik-secrets/output"
)

PROD_IP=""
PORTAL_IP=""
ADMIN_TOKEN=""
SSH_KEY="${SSH_KEY:-$HOME/.ssh/codefabrik_deploy}"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o IdentitiesOnly=yes"

load_env() {
    for search_dir in "${ENV_SEARCH_PATHS[@]}"; do
        # Server-IP (PROD)
        if [ -z "$PROD_IP" ] && [ -f "$search_dir/.server-env" ]; then
            PROD_IP=$(grep -m1 'SERVER_IP=' "$search_dir/.server-env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]') || true
        fi
        # Portal-IP
        if [ -z "$PORTAL_IP" ] && [ -f "$search_dir/.portal-env" ]; then
            PORTAL_IP=$(grep -m1 'PORTAL_IP=' "$search_dir/.portal-env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]') || true
        fi
        # Admin-Token
        if [ -z "$ADMIN_TOKEN" ] && [ -f "$search_dir/.tokens-env" ]; then
            ADMIN_TOKEN=$(grep -m1 'ADMIN_TOKEN=' "$search_dir/.tokens-env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]') || true
        fi
        # SSH-Key (alternative location)
        if [ ! -f "$SSH_KEY" ] && [ -f "$search_dir/deploy_key" ]; then
            SSH_KEY="$search_dir/deploy_key"
        fi
    done

    # Fallback: Env-Variablen
    PROD_IP="${PROD_IP:-${CF_PROD_IP:-}}"
    PORTAL_IP="${PORTAL_IP:-${CF_PORTAL_IP:-}}"
    ADMIN_TOKEN="${ADMIN_TOKEN:-${CF_ADMIN_TOKEN:-}}"
}

require_ssh() {
    [ -f "$SSH_KEY" ] || die "SSH-Key nicht gefunden: $SSH_KEY"
}

require_prod_ip() {
    if [ -z "$PROD_IP" ]; then
        read -rp "PROD Server-IP: " PROD_IP
        [ -n "$PROD_IP" ] || die "PROD-IP erforderlich"
    fi
}

require_portal_ip() {
    if [ -z "$PORTAL_IP" ]; then
        read -rp "Portal Server-IP: " PORTAL_IP
        [ -n "$PORTAL_IP" ] || die "Portal-IP erforderlich"
    fi
}

require_admin_token() {
    if [ -z "$ADMIN_TOKEN" ]; then
        read -rsp "ADMIN_TOKEN: " ADMIN_TOKEN
        echo
        [ -n "$ADMIN_TOKEN" ] || die "ADMIN_TOKEN erforderlich"
    fi
}

ssh_prod() {
    ssh -i "$SSH_KEY" $SSH_OPTS "root@${PROD_IP}" "$@"
}

ssh_portal() {
    ssh -i "$SSH_KEY" $SSH_OPTS "root@${PORTAL_IP}" "$@"
}

# ============================================================
# [1] Install / Update — delegiert an install.sh
# ============================================================
run_install() {
    [ -f "$INSTALL_SH" ] || die "install.sh nicht gefunden: $INSTALL_SH"
    info "Starte install.sh install..."
    bash "$INSTALL_SH" install
}

# ============================================================
# [2] Monitoring — SSH Health-Checks
# ============================================================
run_monitoring() {
    require_ssh

    echo ""
    echo -e "${BOLD}=== Code-Fabrik Monitoring ===${NC}"
    echo ""

    # --- PROD Server ---
    if [ -n "$PROD_IP" ]; then
        echo -e "${BOLD}--- PROD ($PROD_IP) ---${NC}"

        # Container-Status
        info "Container:"
        ssh_prod 'docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null' || warn "Keine Verbindung"

        # Disk
        info "Disk:"
        ssh_prod 'df -h / --output=pcent,avail 2>/dev/null | tail -1 | xargs printf "  Belegt: %s, Frei: %s\n"' || warn "Nicht erreichbar"

        # Poller-Status
        info "Poller:"
        ssh_prod 'systemctl is-active openclaw-poller.timer 2>/dev/null && echo "  Timer: aktiv" || echo "  Timer: inaktiv"' 2>/dev/null || warn "Nicht erreichbar"

        # Gateway Health
        info "Gateway:"
        local gw_status
        gw_status=$(ssh_prod 'curl -sf http://localhost:3100/health 2>/dev/null' || echo '{"error":"nicht erreichbar"}')
        echo "  $gw_status"

        echo ""
    else
        warn "PROD-IP nicht konfiguriert — ueberspringe"
        echo ""
    fi

    # --- Portal Server ---
    if [ -n "$PORTAL_IP" ]; then
        echo -e "${BOLD}--- Portal ($PORTAL_IP) ---${NC}"

        # Container-Status
        info "Container:"
        ssh_portal 'docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null' || warn "Keine Verbindung"

        # Disk
        info "Disk:"
        ssh_portal 'df -h / --output=pcent,avail 2>/dev/null | tail -1 | xargs printf "  Belegt: %s, Frei: %s\n"' || warn "Nicht erreichbar"

        # Portal Health
        info "Portal Health:"
        local portal_status
        portal_status=$(ssh_portal 'curl -sf http://localhost:3200/api/status 2>/dev/null' || echo '{"error":"nicht erreichbar"}')
        echo "  $portal_status"

        # DB-Verbindung
        info "Datenbank:"
        ssh_portal 'docker exec portal-db pg_isready -U portal 2>/dev/null && echo "  Verbindung: OK" || echo "  Verbindung: FEHLER"' 2>/dev/null || warn "Nicht erreichbar"

        # Watchdog
        info "Watchdog:"
        ssh_portal 'systemctl is-active codefabrik-watchdog.timer 2>/dev/null && echo "  Timer: aktiv" || echo "  Timer: inaktiv"' 2>/dev/null || warn "Nicht erreichbar"

        # Letzte Tickets
        info "Support-Tickets:"
        ssh_portal 'docker exec portal-db psql -U portal -d portal -t -c "SELECT status, count(*) FROM support_tickets GROUP BY status ORDER BY status" 2>/dev/null || echo "  Keine Daten"' 2>/dev/null || warn "Nicht erreichbar"

        echo ""
    else
        warn "Portal-IP nicht konfiguriert — ueberspringe"
        echo ""
    fi
}

# ============================================================
# [3] Test-Key erstellen — Portal Admin-API
# ============================================================
run_trial_key() {
    require_portal_ip
    require_admin_token

    echo ""
    echo -e "${BOLD}=== Test-Key erstellen ===${NC}"
    echo ""
    echo "  1) Mitglieder Lokal  (CFTM)"
    echo "  2) FinanzRechner     (CFTR)"
    echo "  3) Rechnung Lokal    (CFTL)"
    echo ""
    read -rp "Produkt [1/2/3]: " product_choice

    local product_id
    case "$product_choice" in
        1) product_id="mitglieder-lokal" ;;
        2) product_id="finanz-rechner" ;;
        3) product_id="rechnung-lokal" ;;
        *) die "Ungueltige Auswahl" ;;
    esac

    local note=""
    read -rp "Notiz (optional, z.B. Pilotkunde Name): " note

    info "Erstelle Trial-Key fuer $product_id..."

    local body
    if [ -n "$note" ]; then
        body=$(printf '{"productId":"%s","note":"%s"}' "$product_id" "$note")
    else
        body=$(printf '{"productId":"%s"}' "$product_id")
    fi

    local response
    response=$(curl -sf \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$body" \
        "http://${PORTAL_IP}:3200/api/admin/trial-key" 2>&1) || {
        die "API-Aufruf fehlgeschlagen. Portal erreichbar? Token korrekt?\n  Response: $response"
    }

    # Parse response
    local license_key expires_at
    license_key=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)['licenseKey'])" 2>/dev/null) || die "Unerwartete Antwort: $response"
    expires_at=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)['expiresAt'])" 2>/dev/null) || true

    echo ""
    echo -e "${GREEN}=== Trial-Key erstellt ===${NC}"
    echo ""
    echo -e "  Key:      ${BOLD}$license_key${NC}"
    echo "  Produkt:  $product_id"
    echo "  Gueltig:  30 Tage (bis $expires_at)"
    [ -n "$note" ] && echo "  Notiz:    $note"
    echo ""

    # Zwischenablage (optional)
    if command -v xclip &>/dev/null; then
        echo -n "$license_key" | xclip -selection clipboard 2>/dev/null && ok "In Zwischenablage kopiert"
    elif command -v xsel &>/dev/null; then
        echo -n "$license_key" | xsel --clipboard 2>/dev/null && ok "In Zwischenablage kopiert"
    elif command -v wl-copy &>/dev/null; then
        echo -n "$license_key" | wl-copy 2>/dev/null && ok "In Zwischenablage kopiert"
    fi
}

# ============================================================
# [4] Sichern — delegiert an install.sh
# ============================================================
run_sichern() {
    [ -f "$INSTALL_SH" ] || die "install.sh nicht gefunden: $INSTALL_SH"
    info "Starte install.sh sichern..."
    bash "$INSTALL_SH" sichern
}

# ============================================================
# [6] Teardown — Alle codefabrik-Server loeschen via UpCloud API
# ============================================================
run_teardown() {
    [ -f "$INSTALL_SH" ] || die "install.sh nicht gefunden: $INSTALL_SH"
    echo ""
    echo -e "${RED}${BOLD}=== NUKE ===${NC}"
    echo -e "${RED}Findet und loescht alle codefabrik-Server in UpCloud.${NC}"
    echo -e "${RED}Managed PostgreSQL bleibt erhalten.${NC}"
    echo ""
    info "Starte install.sh nuke..."
    bash "$INSTALL_SH" nuke
}

# ============================================================
# [5] Backup — Commit + Bundle + Tarball in Backup-Verzeichnis
# ============================================================
BACKUP_DIR="${CF_BACKUP_DIR:-$HOME/bkp-fabrik-im-koffer}"

run_backup() {
    local repo_dir="$SCRIPT_DIR/.."
    local version
    version=$(cat "$repo_dir/VERSION" 2>/dev/null | tr -d '[:space:]') || version="unknown"

    echo ""
    echo -e "${BOLD}=== Backup (v${version}) ===${NC}"
    echo ""

    # Repo-Verzeichnis pruefen
    [ -d "$repo_dir/.git" ] || die "Kein Git-Repo: $repo_dir"

    # Backup-Verzeichnis
    mkdir -p "$BACKUP_DIR"

    # --- Schritt 1: Uncommittete Aenderungen committen ---
    info "Pruefe uncommittete Aenderungen..."
    local changes
    changes=$(git -C "$repo_dir" status --porcelain 2>/dev/null | wc -l)

    if [ "$changes" -gt 0 ]; then
        echo "  $changes geaenderte Dateien"
        read -rp "Commit-Nachricht [v${version}: Sicherung]: " commit_msg
        commit_msg="${commit_msg:-v${version}: Sicherung}"

        git -C "$repo_dir" add -A
        git -C "$repo_dir" commit -m "$commit_msg"
        ok "Commit erstellt"
    else
        ok "Working Directory sauber — kein Commit noetig"
    fi

    # --- Schritt 2: Push nach Forgejo (optional) ---
    local remote_url
    remote_url=$(git -C "$repo_dir" remote get-url origin 2>/dev/null) || true

    if [ -n "$remote_url" ]; then
        info "Push nach Forgejo..."
        if git -C "$repo_dir" push origin main 2>&1; then
            ok "Push erfolgreich"
        else
            warn "Push fehlgeschlagen (Server nicht erreichbar?) — fahre mit lokalem Backup fort"
        fi
    else
        warn "Kein Remote 'origin' — ueberspringe Push"
    fi

    # --- Schritt 3: Git-Bundle (komplette Historie) ---
    local bundle_file="$BACKUP_DIR/code-fabrik-v${version}.bundle"
    info "Git-Bundle erstellen..."
    git -C "$repo_dir" bundle create "$bundle_file" --all 2>&1
    ok "Bundle: $bundle_file ($(du -h "$bundle_file" | cut -f1))"

    # Verifizieren
    git -C "$repo_dir" bundle verify "$bundle_file" >/dev/null 2>&1 && ok "Bundle verifiziert" || warn "Bundle-Verifikation fehlgeschlagen"

    # --- Schritt 4: Tarball (ohne .git, fuer schnellen Deploy) ---
    info "Tarball erstellen..."
    local build_script="$SCRIPT_DIR/build-installer.sh"
    if [ -f "$build_script" ]; then
        bash "$build_script" >/dev/null 2>&1
        # Kopiere dist/ Inhalte ins Backup
        cp "$repo_dir/dist/control.sh" "$BACKUP_DIR/" 2>/dev/null || true
        cp "$repo_dir/dist/install.sh" "$BACKUP_DIR/" 2>/dev/null || true
        cp "$repo_dir/dist/codefabrik-v${version}.tar.gz" "$BACKUP_DIR/" 2>/dev/null || true
        ln -sf "codefabrik-v${version}.tar.gz" "$BACKUP_DIR/codefabrik.tar.gz" 2>/dev/null || true
        ok "Tarball + Scripts kopiert"
    else
        warn "build-installer.sh nicht gefunden — nur Bundle erstellt"
    fi

    # --- Zusammenfassung ---
    echo ""
    echo -e "${GREEN}=== Backup abgeschlossen ===${NC}"
    echo ""
    echo "  Verzeichnis: $BACKUP_DIR"
    echo ""
    ls -lh "$BACKUP_DIR/" 2>/dev/null | grep -v '^total' | while read -r line; do
        echo "  $line"
    done
    echo ""
    echo "  Wiederherstellen aus Bundle:"
    echo "    git clone $bundle_file code-fabrik"
    echo ""
    echo "  Wiederherstellen aus Tarball (ohne Historie):"
    echo "    tar xzf codefabrik-v${version}.tar.gz"
    echo ""
}

# ============================================================
# Konfiguration anzeigen
# ============================================================
run_config() {
    echo ""
    echo -e "${BOLD}=== Konfiguration ===${NC}"
    echo "  PROD-IP:      ${PROD_IP:-nicht gesetzt}"
    echo "  Portal-IP:    ${PORTAL_IP:-nicht gesetzt}"
    echo "  SSH-Key:      $SSH_KEY $([ -f "$SSH_KEY" ] && echo '(vorhanden)' || echo '(FEHLT)')"
    echo "  ADMIN_TOKEN:  $([ -n "$ADMIN_TOKEN" ] && echo '***gesetzt***' || echo 'nicht gesetzt')"
    echo "  install.sh:   $INSTALL_SH $([ -f "$INSTALL_SH" ] && echo '(vorhanden)' || echo '(FEHLT)')"
    echo ""

    echo "  Env-Suchpfade:"
    for p in "${ENV_SEARCH_PATHS[@]}"; do
        local found=0
        for f in .server-env .portal-env .tokens-env; do
            [ -f "$p/$f" ] && found=1
        done
        if [ "$found" -eq 1 ]; then
            echo -e "    ${GREEN}$p${NC} (Dateien gefunden)"
        else
            echo "    $p"
        fi
    done
    echo ""
}

# ============================================================
# Hauptmenue
# ============================================================
show_menu() {
    echo "" >&2
    echo -e "${BOLD}=== Code-Fabrik Kontrollzentrum ===${NC}" >&2
    echo "" >&2
    echo "  1) Install / Update     Infrastruktur installieren oder aktualisieren" >&2
    echo "  2) Monitoring           Server-Status pruefen (PROD + Portal)" >&2
    echo "  3) Test-Key erstellen   30-Tage Trial-Key fuer Pilotkunden" >&2
    echo "  4) Sichern              Nach Forgejo committen + Tarball bauen" >&2
    echo "  5) Backup               Commit + Git-Bundle + Tarball lokal sichern" >&2
    echo "  6) Nuke                 Alle codefabrik-Server loeschen (UpCloud API)" >&2
    echo "" >&2
    echo "  c) Konfiguration        Aktuelle Einstellungen anzeigen" >&2
    echo "  q) Beenden" >&2
    echo "" >&2
    read -rp "Auswahl: " choice
    echo "$choice"
}

# === MAIN ===
ACTION="${1:-}"

# Lade Konfiguration (kein Preflight noetig — kein Docker/KeePass)
load_env

if [ -n "$ACTION" ]; then
    # Direkt-Modus: ./control.sh monitoring
    case "$ACTION" in
        1|install)      run_install "${@:2}" ;;
        2|monitoring)   run_monitoring ;;
        3|trial-key)    run_trial_key ;;
        4|sichern)      run_sichern ;;
        5|backup)       run_backup ;;
        6|teardown)     run_teardown ;;
        config)         run_config ;;
        *)              die "Unbekannte Aktion: $ACTION (install|monitoring|trial-key|sichern|backup|teardown|config)" ;;
    esac
else
    echo ""
    echo -e "${BOLD}Code-Fabrik im Koffer${NC} — v$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || cat "$SCRIPT_DIR/../VERSION" 2>/dev/null || echo '?')"

    # Interaktiver Modus
    while true; do
        choice=$(show_menu)
        case "$choice" in
            q|Q)    echo "Tschuess."; break ;;
            1)      run_install ;;
            2)      run_monitoring ;;
            3)      run_trial_key ;;
            4)      run_sichern ;;
            5)      run_backup ;;
            6)      run_teardown ;;
            c|C)    run_config ;;
            *)      echo "Ungueltige Auswahl" ;;
        esac
    done
fi
