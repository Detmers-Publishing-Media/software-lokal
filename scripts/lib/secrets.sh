#!/bin/bash
# secrets.sh — KeePass-Extrakt + Writeback
# Sourced by install.sh. Requires common.sh.

# --- Preflight: KeePass + curl ---
preflight_base() {
    echo "=== Preflight ==="
    check_cmd keepassxc-cli python3 curl

    # KeePass-DB: Pfad abfragen falls nicht gesetzt
    if [ -z "$KEEPASS_DB" ] || [ ! -f "$KEEPASS_DB" ]; then
        echo ""
        read -rp "Pfad zur KeePass-Datenbank (vault.kdbx): " KEEPASS_DB
        [ -f "$KEEPASS_DB" ] || die "KeePass-DB nicht gefunden: $KEEPASS_DB"
    fi
    echo "OK"
}

# --- KeePass-Passwort abfragen ---
ask_keepass_password() {
    echo ""
    echo "=== KeePass-Passwort ==="
    echo "Passwort eingeben (YubiKey bereithalten):"
    read -rs KEEPASS_PASS
    echo
    export KEEPASS_PASS
}

# --- Secrets aus KeePass laden -> /dev/shm ---
load_secrets() {
    echo "=== Secrets laden ==="
    mkdir -p "$SHM_SECRETS" "$SHM_OUTPUT"
    chmod 700 "$SHM_BASE" "$SHM_SECRETS" "$SHM_OUTPUT"

    # KeePass als XML exportieren (1x YubiKey-Touch)
    echo "KeePass-Export (YubiKey beruehren falls noetig)..."
    local xml_file="$SHM_SECRETS/export.xml"
    echo "$KEEPASS_PASS" | keepassxc-cli export "$KEEPASS_DB" -f xml > "$xml_file" 2>/dev/null \
        || die "KeePass-Export fehlgeschlagen (falsches Passwort?)"

    # Python3 parst XML -> secrets.yml + SSH-Key
    python3 - "$xml_file" "$SHM_SECRETS" "$KEEPASS_GROUP" "$RUNTIME_GROUP" "$SHM_OUTPUT" << 'PYEOF'
import sys
import xml.etree.ElementTree as ET
import os

xml_file = sys.argv[1]
secrets_dir = sys.argv[2]
group_path = sys.argv[3]
runtime_path = sys.argv[4]
output_dir = sys.argv[5]

# Mapping: KeePass-Eintrag -> Ansible-Variable
SECRET_MAP = {
    "upcloud-api-token": "vault_upcloud_api_token",
    "cloudflare-api-token": "vault_cloudflare_api_token",
"ollama-api-key": "vault_ollama_api_key",
    "ollama-host": "vault_ollama_host",
    "ollama-model": "vault_ollama_model",
    "digistore-ipn-passphrase": "vault_digistore_ipn_passphrase",
    "cloudflare-origin-ca-cert": "vault_origin_ca_cert",
    "cloudflare-origin-ca-key": "vault_origin_ca_key",
    "github-push-token": "vault_github_push_token",
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
        if "\n" in val:
            # Mehrzeilige Werte (PEM-Certs) als YAML Block Scalar
            f.write(f"{var}: |\n")
            for line in val.splitlines():
                f.write(f"  {line}\n")
        else:
            # Einzeilige Werte in Anfuehrungszeichen
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

# CI Deploy Key extrahieren (fuer GitHub Actions SCP auf Portal)
ci_key = get_entry_password(cf_group, "ci-deploy-key-portal")
if ci_key:
    ci_key_file = os.path.join(secrets_dir, "ci_deploy_key")
    with open(ci_key_file, "w") as f:
        f.write(ci_key)
        if not ci_key.endswith("\n"):
            f.write("\n")
    os.chmod(ci_key_file, 0o600)
    print(f"  OK: ci-deploy-key-portal -> {ci_key_file}")

ci_pub = get_entry_password(cf_group, "ci-deploy-key-portal-pub")
if ci_pub:
    ci_pub_file = os.path.join(secrets_dir, "ci_deploy_key.pub")
    with open(ci_pub_file, "w") as f:
        f.write(ci_pub)
        if not ci_pub.endswith("\n"):
            f.write("\n")
    os.chmod(ci_pub_file, 0o644)
    print(f"  OK: ci-deploy-key-portal-pub -> {ci_pub_file}")

# Runtime-Gruppe finden
runtime_parts = runtime_path.split("/")
rt_group = find_group(db_root, runtime_parts)

# Runtime-Dateien laden (falls Reinstall)
# Writeback speichert Dateien als Base64 (keepassxc-cli -p liest nur 1 Zeile)
import base64

if rt_group is not None:
    for kp_name, filename in RUNTIME_MAP.items():
        content = get_entry_password(rt_group, kp_name)
        if content:
            # Base64-Decode versuchen, Fallback auf Rohinhalt
            try:
                decoded = base64.b64decode(content).decode("utf-8")
            except Exception:
                decoded = content
            out_file = os.path.join(output_dir, filename)
            with open(out_file, "w") as f:
                f.write(decoded)
                if not decoded.endswith("\n"):
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

# --- Writeback: Runtime-Secrets -> KeePass ---
writeback_runtime() {
    echo ""
    echo "=== Runtime-Secrets in KeePass speichern ==="

    for entry in "${!RUNTIME_MAP[@]}"; do
        local filename="${RUNTIME_MAP[$entry]}"
        local filepath="$SHM_OUTPUT/$filename"
        if [ -f "$filepath" ] && [ -r "$filepath" ]; then
            # Base64-Encoding: keepassxc-cli -p liest nur 1 Zeile als Passwort,
            # aber Runtime-Dateien sind mehrzeilig. Base64 macht sie einzeilig.
            local encoded
            encoded=$(base64 -w0 < "$filepath") || { echo "  WARNUNG: $filename nicht lesbar"; continue; }
            echo "  $filename -> $RUNTIME_GROUP/$entry (YubiKey beruehren falls noetig)"
            # Versuche add, bei Fehler edit (Eintrag existiert schon)
            # printf sendet DB-Passwort + Base64-Inhalt ueber eine Pipe (kein stdin-Konflikt)
            if ! printf '%s\n%s' "$KEEPASS_PASS" "$encoded" | keepassxc-cli add "$KEEPASS_DB" \
                    "$RUNTIME_GROUP/$entry" -p 2>/dev/null; then
                printf '%s\n%s' "$KEEPASS_PASS" "$encoded" | keepassxc-cli edit "$KEEPASS_DB" \
                    "$RUNTIME_GROUP/$entry" -p 2>/dev/null || \
                echo "  WARNUNG: Konnte $entry nicht schreiben"
            fi
        fi
    done

    echo "Writeback abgeschlossen."

    # Env-Dateien lokal persistieren + GitHub Secrets aktualisieren
    persist_env_files
    sync_github_secrets
}
