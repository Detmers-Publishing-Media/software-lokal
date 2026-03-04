#!/bin/bash
# install.sh — Portabler Installer: KeePass + YubiKey → Docker → Ansible
# USB-Stick Layout: install.sh + codefabrik.tar.gz + vault.kdbx
set -euo pipefail

# --- Konfiguration ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEEPASS_DB="${KEEPASS_DB:-$SCRIPT_DIR/vault.kdbx}"
TARBALL="${TARBALL:-$SCRIPT_DIR/codefabrik.tar.gz}"
SHM_BASE="/dev/shm/codefabrik-secrets"
SHM_SECRETS="$SHM_BASE/secrets"
SHM_WORKSPACE="$SHM_BASE/workspace"
SHM_OUTPUT="$SHM_BASE/output"
DOCKER_IMAGE="codefabrik-ansible:local"

KEEPASS_GROUP="Studio Ops/00-Vault/Code-Fabrik"
RUNTIME_GROUP="$KEEPASS_GROUP/Runtime"

# KeePass-Eintrag → Ansible-Variable
declare -A SECRET_MAP=(
    [upcloud-api-token]=vault_upcloud_api_token
    [cloudflare-api-token]=vault_cloudflare_api_token
    [anthropic-api-key]=vault_anthropic_api_key
    [ollama-api-key]=vault_ollama_api_key
    [ollama-host]=vault_ollama_host
    [ollama-model]=vault_ollama_model
    [digistore-ipn-passphrase]=vault_digistore_ipn_passphrase
)

# Runtime-Eintraege → Dateinamen
declare -A RUNTIME_MAP=(
    [factory-passwords]=.factory-passwords.env
    [server-env]=.server-env
    [tokens-env]=.tokens-env
    [portal-passwords]=.portal-passwords.env
    [portal-env]=.portal-env
)

# --- Cleanup-Trap ---
cleanup() {
    echo ""
    echo "Secrets aufraeumen..."
    if [ -d "$SHM_BASE" ]; then
        find "$SHM_BASE" -type f -exec shred -u {} \; 2>/dev/null
        rm -rf "$SHM_BASE"
    fi
    echo "Fertig."
}
trap cleanup EXIT INT TERM

# --- Hilfsfunktionen ---
die() { echo "FEHLER: $*" >&2; exit 1; }

check_cmd() {
    for cmd in "$@"; do
        command -v "$cmd" &>/dev/null || die "$cmd nicht installiert"
    done
}

# --- [1] Preflight ---
preflight() {
    echo "=== Preflight ==="
    check_cmd keepassxc-cli python3 docker
    [ -f "$KEEPASS_DB" ] || die "KeePass-DB nicht gefunden: $KEEPASS_DB"
    [ -f "$TARBALL" ] || die "Tarball nicht gefunden: $TARBALL"
    docker info &>/dev/null || die "Docker laeuft nicht"
    echo "OK"
}

# --- [2] KeePass-Passwort abfragen ---
ask_keepass_password() {
    echo ""
    echo "=== KeePass-Passwort ==="
    echo "Passwort eingeben (YubiKey bereithalten):"
    read -rs KEEPASS_PASS
    echo
    export KEEPASS_PASS
}

# --- [3] Secrets aus KeePass laden → /dev/shm ---
load_secrets() {
    echo "=== Secrets laden ==="
    mkdir -p "$SHM_SECRETS" "$SHM_OUTPUT"
    chmod 700 "$SHM_BASE" "$SHM_SECRETS" "$SHM_OUTPUT"

    # KeePass als XML exportieren (1x YubiKey-Touch)
    echo "KeePass-Export (YubiKey beruehren falls noetig)..."
    local xml_file="$SHM_SECRETS/export.xml"
    echo "$KEEPASS_PASS" | keepassxc-cli export "$KEEPASS_DB" -f xml > "$xml_file" 2>/dev/null \
        || die "KeePass-Export fehlgeschlagen (falsches Passwort?)"

    # Python3 parst XML → secrets.yml + SSH-Key
    python3 - "$xml_file" "$SHM_SECRETS" "$KEEPASS_GROUP" "$RUNTIME_GROUP" "$SHM_OUTPUT" << 'PYEOF'
import sys
import xml.etree.ElementTree as ET
import os

xml_file = sys.argv[1]
secrets_dir = sys.argv[2]
group_path = sys.argv[3]
runtime_path = sys.argv[4]
output_dir = sys.argv[5]

# Mapping: KeePass-Eintrag → Ansible-Variable
SECRET_MAP = {
    "upcloud-api-token": "vault_upcloud_api_token",
    "cloudflare-api-token": "vault_cloudflare_api_token",
    "anthropic-api-key": "vault_anthropic_api_key",
    "ollama-api-key": "vault_ollama_api_key",
    "ollama-host": "vault_ollama_host",
    "ollama-model": "vault_ollama_model",
    "digistore-ipn-passphrase": "vault_digistore_ipn_passphrase",
}

# Runtime-Mapping
RUNTIME_MAP = {
    "factory-passwords": ".factory-passwords.env",
    "server-env": ".server-env",
    "tokens-env": ".tokens-env",
    "portal-passwords": ".portal-passwords.env",
    "portal-env": ".portal-env",
}

tree = ET.parse(xml_file)
root = tree.getroot()

def find_group(parent, path_parts):
    """Rekursiv Gruppe im XML finden."""
    if not path_parts:
        return parent
    target = path_parts[0]
    for group in parent.findall("Group"):
        name_el = group.find("Name")
        if name_el is not None and name_el.text == target:
            return find_group(group, path_parts[1:])
    return None

def get_entry_password(group, entry_name):
    """Password-Feld eines Eintrags auslesen."""
    if group is None:
        return None
    for entry in group.findall("Entry"):
        title = None
        password = None
        for string in entry.findall("String"):
            key = string.find("Key")
            value = string.find("Value")
            if key is not None and value is not None:
                if key.text == "Title":
                    title = value.text
                elif key.text == "Password":
                    password = value.text
        if title == entry_name:
            return password
    return None

# Root-Element der DB finden
db_root = root.find(".//Root/Group")
if db_root is None:
    print("FEHLER: Kein Root-Element in KeePass-DB", file=sys.stderr)
    sys.exit(1)

# Code-Fabrik Gruppe finden
group_parts = group_path.split("/")
cf_group = find_group(db_root, group_parts)
if cf_group is None:
    print(f"FEHLER: Gruppe '{group_path}' nicht gefunden", file=sys.stderr)
    sys.exit(1)

# secrets.yml bauen
secrets = {}
for kp_name, ansible_var in SECRET_MAP.items():
    value = get_entry_password(cf_group, kp_name)
    if value:
        secrets[ansible_var] = value
        print(f"  OK: {kp_name} -> {ansible_var}")
    else:
        print(f"  SKIP: {kp_name} (nicht gefunden)")

secrets_file = os.path.join(secrets_dir, "secrets.yml")
with open(secrets_file, "w") as f:
    f.write("---\n")
    for var, val in secrets.items():
        # YAML-safe: Werte in Anfuehrungszeichen
        escaped = val.replace("\\", "\\\\").replace('"', '\\"')
        f.write(f'{var}: "{escaped}"\n')
os.chmod(secrets_file, 0o600)
print(f"  -> {secrets_file}")

# SSH-Key extrahieren
ssh_key = get_entry_password(cf_group, "ssh-deploy-key")
if ssh_key:
    key_file = os.path.join(secrets_dir, "deploy_key")
    with open(key_file, "w") as f:
        f.write(ssh_key)
        if not ssh_key.endswith("\n"):
            f.write("\n")
    os.chmod(key_file, 0o600)
    print(f"  OK: ssh-deploy-key -> {key_file}")

ssh_pub = get_entry_password(cf_group, "ssh-deploy-key-pub")
if ssh_pub:
    pub_file = os.path.join(secrets_dir, "deploy_key.pub")
    with open(pub_file, "w") as f:
        f.write(ssh_pub)
        if not ssh_pub.endswith("\n"):
            f.write("\n")
    os.chmod(pub_file, 0o644)
    print(f"  OK: ssh-deploy-key-pub -> {pub_file}")

# Runtime-Gruppe finden
runtime_parts = runtime_path.split("/")
rt_group = find_group(db_root, runtime_parts)

# Runtime-Dateien laden (falls Reinstall)
if rt_group is not None:
    for kp_name, filename in RUNTIME_MAP.items():
        content = get_entry_password(rt_group, kp_name)
        if content:
            out_file = os.path.join(output_dir, filename)
            with open(out_file, "w") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            os.chmod(out_file, 0o600)
            print(f"  OK: Runtime/{kp_name} -> {out_file}")
else:
    print("  Runtime-Gruppe nicht gefunden (Erstinstallation)")
PYEOF

    # XML sofort shredden
    shred -u "$xml_file"

    # Pruefen ob secrets.yml existiert
    [ -f "$SHM_SECRETS/secrets.yml" ] || die "secrets.yml wurde nicht erstellt"
    [ -f "$SHM_SECRETS/deploy_key" ] || die "SSH-Key wurde nicht extrahiert"

    echo "Secrets geladen."
}

# --- [5] Tarball entpacken ---
unpack_workspace() {
    echo ""
    echo "=== Workspace entpacken ==="
    mkdir -p "$SHM_WORKSPACE"
    tar xzf "$TARBALL" -C "$SHM_WORKSPACE"
    echo "OK: $SHM_WORKSPACE"
}

# --- [6] Docker-Image bauen ---
build_docker() {
    echo ""
    echo "=== Docker-Image bauen ==="
    local dockerfile_dir
    # Dockerfile kann im Tarball oder im Workspace sein
    if [ -f "$SHM_WORKSPACE/ansible/Dockerfile" ]; then
        dockerfile_dir="$SHM_WORKSPACE/ansible"
    elif [ -f "$SHM_WORKSPACE/Dockerfile" ]; then
        dockerfile_dir="$SHM_WORKSPACE"
    else
        die "Dockerfile nicht im Tarball gefunden"
    fi
    docker build -t "$DOCKER_IMAGE" "$dockerfile_dir" --quiet
    echo "OK: $DOCKER_IMAGE"
}

# --- [7] Menue ---
show_menu() {
    echo ""
    echo "=== Code-Fabrik Installer ==="
    echo "  1) install          — PROD installieren"
    echo "  2) install-portal   — Portal installieren"
    echo "  3) teardown         — PROD abreissen"
    echo "  4) teardown-portal  — Portal abreissen"
    echo "  5) status           — Docker + Connectivity pruefen"
    echo "  q) Beenden"
    echo ""
    read -rp "Auswahl: " choice
    echo "$choice"
}

# --- [8] Ansible im Docker ausfuehren ---
run_ansible() {
    local playbook="$1"
    echo ""
    echo "=== Ansible: $playbook ==="

    local ansible_dir="$SHM_WORKSPACE/ansible"
    [ -d "$ansible_dir" ] || ansible_dir="$SHM_WORKSPACE"

    # Portal-Mount vorbereiten
    local portal_mount=()
    local portal_dir="$SHM_WORKSPACE/portal"
    if [ -d "$portal_dir" ]; then
        portal_mount=(-v "$portal_dir:/portal:ro")
    fi

    docker run --rm \
        --network host \
        -v "$ansible_dir:/ansible:ro" \
        -v "$SHM_SECRETS/deploy_key:/root/.ssh/codefabrik_deploy:ro" \
        -v "$SHM_SECRETS/deploy_key.pub:/root/.ssh/codefabrik_deploy.pub:ro" \
        -v "$SHM_SECRETS/secrets.yml:/root/secrets.yml:ro" \
        -v "$SHM_OUTPUT:/output:rw" \
        "${portal_mount[@]}" \
        "$DOCKER_IMAGE" \
        "$playbook" -e @/root/secrets.yml
}

# --- [9] Writeback: Runtime-Secrets → KeePass ---
writeback_runtime() {
    echo ""
    echo "=== Runtime-Secrets in KeePass speichern ==="

    for entry in "${!RUNTIME_MAP[@]}"; do
        local filename="${RUNTIME_MAP[$entry]}"
        local filepath="$SHM_OUTPUT/$filename"
        if [ -f "$filepath" ]; then
            local content
            content=$(cat "$filepath")
            echo "  $filename → $RUNTIME_GROUP/$entry (YubiKey beruehren falls noetig)"
            # Versuche add, bei Fehler edit (Eintrag existiert schon)
            if ! echo "$KEEPASS_PASS" | keepassxc-cli add "$KEEPASS_DB" \
                    "$RUNTIME_GROUP/$entry" --password-prompt --no-password \
                    2>/dev/null <<< "$content"; then
                echo "$KEEPASS_PASS" | keepassxc-cli edit "$KEEPASS_DB" \
                    "$RUNTIME_GROUP/$entry" --password-prompt --no-password \
                    2>/dev/null <<< "$content" || \
                echo "  WARNUNG: Konnte $entry nicht schreiben"
            fi
        fi
    done

    echo "Writeback abgeschlossen."
}

# --- Playbook-Mapping ---
playbook_for() {
    case "$1" in
        1|install)          echo "playbooks/install.yml" ;;
        2|install-portal)   echo "playbooks/install-portal.yml" ;;
        3|teardown)         echo "playbooks/teardown.yml" ;;
        4|teardown-portal)  echo "playbooks/teardown-portal.yml" ;;
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

preflight
ask_keepass_password
load_secrets
unpack_workspace
build_docker

if [ -n "$ACTION" ]; then
    # Direkt-Modus: ./install.sh install
    case "$ACTION" in
        status)
            run_status
            ;;
        *)
            playbook=$(playbook_for "$ACTION") || die "Unbekannte Aktion: $ACTION"
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
            5|status) run_status ;;
            *)
                playbook=$(playbook_for "$choice") || { echo "Ungueltige Auswahl"; continue; }
                run_ansible "$playbook"
                writeback_runtime
                ;;
        esac
    done
fi
