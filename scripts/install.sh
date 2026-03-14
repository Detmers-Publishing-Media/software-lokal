#!/bin/bash
# install.sh — Portabler Installer: KeePass + YubiKey -> Docker -> Ansible
# USB-Stick Layout: install.sh + codefabrik.tar.gz + vault.kdbx
set -euo pipefail

# --- Module laden ---
LIB_DIR="$(cd "$(dirname "$0")/lib" && pwd)"
source "$LIB_DIR/common.sh"
source "$LIB_DIR/secrets.sh"
source "$LIB_DIR/docker.sh"
source "$LIB_DIR/upcloud.sh"
source "$LIB_DIR/release.sh"
source "$LIB_DIR/tunnel.sh"

trap cleanup EXIT INT TERM
log_header

# --- Menue ---
show_menu() {
    echo "" >&2
    echo "=== Code-Fabrik Installer ===" >&2
    echo "" >&2
    echo "  Betriebsmodi:" >&2
    echo "    1) bootstrap      — Neuinstallation (Nuke + PROD + Portal + Seed)" >&2
    echo "    2) upgrade        — PROD + Portal aktualisieren (Server bleibt)" >&2
    echo "    3) reconcile      — Drift korrigieren (idempotent, kein Neustart)" >&2
    echo "    5) teardown       — Alles abreissen (PROD + Portal)" >&2
    echo "" >&2
    echo "  Einzelaktionen:" >&2
    echo "    6) sichern        — Aenderungen nach Forgejo + Tarball neu bauen" >&2
    echo "    7) nuke           — Alle codefabrik-Server loeschen (UpCloud API)" >&2
    echo "    8) fabrik         — PROD Status abfragen" >&2
    echo "    9) status         — Lokalen Docker-Status pruefen" >&2
    echo "   10) rotate-token   — Forgejo API-Token rotieren" >&2
    echo "   11) recover        — Env-Dateien vom Server recovern" >&2
    echo "   12) tunnel         — SSH-Tunnel (AnythingLLM + Forgejo)" >&2
    echo "  q) Beenden" >&2
    echo "" >&2
    read -rp "Auswahl: " choice
    echo "$choice"
}

# --- Betriebsmodi ---
run_bootstrap() {
    echo ""
    echo "=== Modus: BOOTSTRAP ==="
    nuke_all_servers
    run_ansible "playbooks/install.yml" -e ops_mode=bootstrap
    writeback_runtime
    run_ansible "playbooks/install-portal.yml" -e ops_mode=bootstrap
    writeback_runtime
    run_ansible "playbooks/seed-products.yml"
    writeback_runtime
    rebuild_tarball
}

run_upgrade() {
    echo ""
    echo "=== Modus: UPGRADE ==="
    run_ansible "playbooks/upgrade.yml" -e ops_mode=upgrade
    writeback_runtime
    run_ansible "playbooks/upgrade-portal.yml" -e ops_mode=upgrade
    writeback_runtime
}

run_reconcile() {
    echo ""
    echo "=== Modus: RECONCILE ==="
    run_ansible "playbooks/reconcile.yml" -e ops_mode=reconcile
    writeback_runtime
    run_ansible "playbooks/reconcile-portal.yml" -e ops_mode=reconcile
    writeback_runtime
}

run_teardown() {
    echo ""
    echo "=== Modus: TEARDOWN ==="
    run_ansible "playbooks/teardown-portal.yml" -e ops_mode=teardown
    writeback_runtime
    run_ansible "playbooks/teardown.yml" -e ops_mode=teardown
    writeback_runtime
}

# --- Playbook-Mapping (Einzelaktionen) ---
playbook_for() {
    case "$1" in
        8|fabrik)           echo "playbooks/fabrik.yml" ;;
        10|rotate-token)    echo "playbooks/rotate-token.yml" ;;
        11|recover)         echo "playbooks/recover-env.yml" ;;
        12|seed)            echo "playbooks/seed-products.yml" ;;
        *) return 1 ;;
    esac
}

# --- Status-Check ---
run_status() {
    echo ""
    echo "=== Status ==="
    echo "Docker: $(docker info --format '{{.ServerVersion}}' 2>/dev/null || echo 'nicht erreichbar')"
    echo "KeePass-DB: $KEEPASS_DB"
    echo "Tarball: $TARBALL"
    echo "Secrets in RAM: $([ -d "$SHM_SECRETS" ] && echo 'ja' || echo 'nein')"

    for f in .server-env .portal-env .tokens-env; do
        if [ -f "$SHM_OUTPUT/$f" ]; then
            echo "  $f: vorhanden"
        fi
    done
}

# === MAIN ===
ACTION="${1:-}"

# Basis-Preflight: KeePass + curl (immer noetig)
preflight_base
ask_keepass_password
load_secrets

# Leichtgewichtige Aktionen: kein Workspace/Docker noetig
if [ "$ACTION" = "nuke" ]; then
    nuke_all_servers
    exit 0
fi
if [ "$ACTION" = "tunnel" ] || [ "$ACTION" = "12" ]; then
    run_tunnel
    exit 0
fi

# Voller Preflight: Docker + Tarball (fuer alle Ansible-Aktionen)
preflight_full
unpack_workspace
build_docker

if [ -n "$ACTION" ]; then
    # Direkt-Modus: ./install.sh <modus>
    case "$ACTION" in
        1|bootstrap)    run_bootstrap ;;
        2|upgrade)      run_upgrade ;;
        3|reconcile)    run_reconcile ;;
        5|teardown)     run_teardown ;;
        6|sichern)      run_sichern ;;
        12|tunnel)      run_tunnel ;;
        status)         run_status ;;
        *)
            playbook=$(playbook_for "$ACTION") || die "Unbekannte Aktion: $ACTION. Erlaubt: bootstrap, upgrade, reconcile, teardown, sichern, nuke, status"
            run_ansible "$playbook"
            writeback_runtime
            ;;
    esac
else
    # Interaktiver Modus
    while true; do
        choice=$(show_menu)
        case "$choice" in
            q|Q) break ;;
            1|bootstrap)    run_bootstrap ;;
            2|upgrade)      run_upgrade ;;
            3|reconcile)    run_reconcile ;;
            5|teardown)     run_teardown ;;
            6|sichern)      run_sichern ;;
            7|nuke)         nuke_all_servers ;;
            8|fabrik)       run_ansible "playbooks/fabrik.yml"; writeback_runtime ;;
            9|status)       run_status ;;
            10|rotate-token) run_ansible "playbooks/rotate-token.yml"; writeback_runtime ;;
            12|tunnel)      run_tunnel ;;
            *)              echo "Ungueltige Auswahl" ;;
        esac
    done
fi
