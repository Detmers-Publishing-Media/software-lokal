#!/bin/bash
# release.sh — Tarball, Versionierung, Sichern
# Sourced by install.sh. Requires common.sh, secrets.sh, docker.sh.

# --- Version lesen ---
get_version() {
    local version_file="$SHM_WORKSPACE/VERSION"
    if [ -f "$version_file" ]; then
        cat "$version_file" | tr -d '[:space:]'
    else
        echo "0.0.0"
    fi
}

# --- Patch-Version hochzaehlen ---
bump_patch() {
    local version="$1"
    local major minor patch
    major="$(echo "$version" | cut -d. -f1)"
    minor="$(echo "$version" | cut -d. -f2)"
    patch="$(echo "$version" | cut -d. -f3)"
    patch=$((patch + 1))
    echo "${major}.${minor}.${patch}"
}

# --- Tarball neu bauen ---
rebuild_tarball() {
    echo ""
    echo "=== Tarball neu bauen ==="
    local target_dir version tarball_name
    target_dir="$(dirname "$TARBALL")"
    version="$(get_version)"
    tarball_name="codefabrik-v${version}.tar.gz"

    tar czf "$target_dir/$tarball_name" \
        -C "$SHM_WORKSPACE" \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='target' \
        --exclude='*.log' \
        --exclude='*.pid' \
        --exclude='*.zip' \
        --exclude='.server-env' \
        --exclude='.tokens-env' \
        --exclude='.factory-passwords.env' \
        --exclude='.portal-env' \
        --exclude='.portal-passwords.env' \
        --exclude='.portal-smoke-results.env' \
        --exclude='vault.yml' \
        --exclude='vault.kdbx' \
        --exclude='*.sqlite-shm' \
        --exclude='*.sqlite-wal' \
        .

    # Symlink codefabrik.tar.gz -> aktuellen Release
    ln -sf "$tarball_name" "$target_dir/codefabrik.tar.gz"

    # install.sh auch aktualisieren
    local src_install="$SHM_WORKSPACE/scripts/install.sh"
    if [ -f "$src_install" ]; then
        cp "$src_install" "$target_dir/install.sh"
        chmod +x "$target_dir/install.sh"
    fi

    echo "Tarball: $target_dir/$tarball_name ($(du -h "$target_dir/$tarball_name" | cut -f1))"
}

# --- Sichern: Version bumpen, nach Forgejo committen, Tarball neu bauen ---
run_sichern() {
    echo ""
    echo "=== Sichern ==="

    # Server-IP und Forgejo-Token aus Output laden
    local server_ip forgejo_token
    if [ -f "$SHM_OUTPUT/.server-env" ]; then
        server_ip=$(grep SERVER_IP "$SHM_OUTPUT/.server-env" | cut -d= -f2)
    fi
    if [ -f "$SHM_OUTPUT/.tokens-env" ]; then
        forgejo_token=$(grep FORGEJO_API_TOKEN "$SHM_OUTPUT/.tokens-env" | cut -d= -f2)
    fi

    if [ -z "${server_ip:-}" ] || [ -z "${forgejo_token:-}" ]; then
        echo "FEHLER: Server-IP oder Forgejo-Token nicht verfuegbar."
        echo "  Zuerst 'install' oder 'status' ausfuehren."
        return 1
    fi

    # Version bumpen
    local old_version new_version
    old_version="$(get_version)"
    new_version="$(bump_patch "$old_version")"
    echo "Version: v${old_version} -> v${new_version}"
    echo "$new_version" > "$SHM_WORKSPACE/VERSION"

    # Commit-Nachricht abfragen
    read -rp "Beschreibung (fuer Release-Eintrag): " release_desc
    release_desc="${release_desc:-Sicherung}"
    local commit_msg="v${new_version}: ${release_desc}"

    # Release-Eintrag in RELEASES.md hinzufuegen
    local releases_file="$SHM_WORKSPACE/docs/roadmap/RELEASES.md"
    if [ -f "$releases_file" ]; then
        local today
        today="$(date +%Y-%m-%d)"
        # Neue Zeile nach der Tabellen-Header-Zeile einfuegen (nach der letzten |...| Zeile)
        # Suche die letzte Zeile die mit | anfaengt und fuege danach ein
        local last_row
        last_row=$(grep -n '^|' "$releases_file" | tail -1 | cut -d: -f1)
        if [ -n "$last_row" ]; then
            sed -i "${last_row}a\\| v${new_version} | Sicherung | ${release_desc} | Done |" "$releases_file"
        fi
        # Stand-Datum aktualisieren
        sed -i "s/^Stand: .*/Stand: ${today}/" "$releases_file"
    fi

    # Push via SSH auf den Server (Forgejo laeuft auf localhost:3000)
    echo "Aenderungen nach Forgejo pushen..."
    ssh -i "$SHM_SECRETS/deploy_key" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new \
        "root@${server_ip}" bash -s -- "$forgejo_token" "$commit_msg" << 'SSHEOF'
set -euo pipefail
FORGEJO_TOKEN="$1"
COMMIT_MSG="$2"
REPO_DIR="/tmp/infra-sichern"
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

# Repo klonen falls noetig
if [ ! -d "$REPO_DIR/.git" ]; then
    git clone "http://factory-admin:${FORGEJO_TOKEN}@localhost:3000/factory/infra-local.git" "$REPO_DIR"
else
    cd "$REPO_DIR" && git pull origin main
fi
SSHEOF

    # Lokale Dateien auf den Server kopieren und committen
    echo "Dateien synchronisieren..."
    rsync -az --delete \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='node_modules' \
        --exclude='target' \
        --exclude='__pycache__' \
        --exclude='.server-env' \
        --exclude='.tokens-env' \
        --exclude='.factory-passwords.env' \
        --exclude='.portal-env' \
        --exclude='.portal-passwords.env' \
        --exclude='.portal-smoke-results.env' \
        --exclude='vault.yml' \
        --exclude='vault.kdbx' \
        --exclude='*.log' \
        --exclude='*.pid' \
        --exclude='*.zip' \
        --exclude='*.sqlite-shm' \
        --exclude='*.sqlite-wal' \
        -e "ssh -i $SHM_SECRETS/deploy_key -o IdentitiesOnly=yes" \
        "$SHM_WORKSPACE/" "root@${server_ip}:/tmp/infra-sichern/"

    ssh -i "$SHM_SECRETS/deploy_key" -o IdentitiesOnly=yes \
        "root@${server_ip}" bash -s -- "$commit_msg" << 'SSHEOF'
set -euo pipefail
COMMIT_MSG="$1"
cd /tmp/infra-sichern
git config --global --add safe.directory /tmp/infra-sichern
git config user.email "installer@codefabrik.local"
git config user.name "Code-Fabrik Installer"
git add -A
if git diff --cached --quiet; then
    echo "Keine Aenderungen — nichts zu committen."
else
    git commit -m "$COMMIT_MSG"
    git push origin main
    echo "Gesichert: $(git log --oneline -1)"
fi
SSHEOF

    echo ""

    # Tarball neu bauen
    rebuild_tarball
}
