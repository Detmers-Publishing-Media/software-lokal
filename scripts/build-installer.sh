#!/bin/bash
# build-installer.sh — Paketiert das komplette Repo fuer "Fabrik im Koffer"
# Ergebnis: dist/install.sh + dist/codefabrik-vX.Y.Z.tar.gz
# Zusammen mit vault.kdbx reicht das fuer einen kompletten Neuaufbau.
# Jeder Tarball ist ein vollstaendiger Snapshot — beliebiger Release-Stand wiederherstellbar.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

# Version aus VERSION-Datei lesen
VERSION_FILE="$PROJECT_DIR/VERSION"
if [ ! -f "$VERSION_FILE" ]; then
    echo "FEHLER: VERSION-Datei nicht gefunden" >&2
    exit 1
fi
VERSION="$(cat "$VERSION_FILE" | tr -d '[:space:]')"
TARBALL_NAME="codefabrik-v${VERSION}.tar.gz"

echo "=== Code-Fabrik Installer bauen (v${VERSION}) ==="

# Lint-Checks vor dem Build
echo "Lint-Checks..."
if [ -x "$SCRIPT_DIR/validate-portal-migrations.sh" ]; then
    bash "$SCRIPT_DIR/validate-portal-migrations.sh" || { echo "FEHLER: Migrations-Lint fehlgeschlagen. Tarball wird nicht gebaut." >&2; exit 1; }
fi
if [ -x "$SCRIPT_DIR/validate-ansible-roles.sh" ]; then
    bash "$SCRIPT_DIR/validate-ansible-roles.sh" || { echo "FEHLER: Ansible-Roles-Lint fehlgeschlagen. Tarball wird nicht gebaut." >&2; exit 1; }
fi

mkdir -p "$DIST_DIR"

# Tarball erstellen: komplettes Repo ohne Secrets, temporaere Dateien und Build-Artefakte
echo "Tarball erstellen..."
tar czf "$DIST_DIR/$TARBALL_NAME" \
    -C "$PROJECT_DIR" \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='release' \
    --exclude='*-unpacked' \
    --exclude='*.AppImage' \
    --exclude='*.exe' \
    --exclude='*.blockmap' \
    --exclude='*.dmg' \
    --exclude='__pycache__' \
    --exclude='target' \
    --exclude='*.log' \
    --exclude='*.pid' \
    --exclude='*.zip' \
    --exclude='*.tar.gz' \
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

# Symlink codefabrik.tar.gz → aktuellen Release (damit install.sh ihn findet)
ln -sf "$TARBALL_NAME" "$DIST_DIR/codefabrik.tar.gz"

# install.sh + lib/ + control.sh kopieren
cp "$SCRIPT_DIR/install.sh" "$DIST_DIR/install.sh"
mkdir -p "$DIST_DIR/lib"
cp "$SCRIPT_DIR/lib/"*.sh "$DIST_DIR/lib/"
cp "$SCRIPT_DIR/control.sh" "$DIST_DIR/control.sh"
cp "$PROJECT_DIR/VERSION" "$DIST_DIR/VERSION"
chmod +x "$DIST_DIR/install.sh" "$DIST_DIR/control.sh"

# Checksum und Build-Timestamp schreiben
CHECKSUM=$(sha256sum "$DIST_DIR/$TARBALL_NAME" | cut -d' ' -f1)
BUILD_TIME=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "$CHECKSUM  $TARBALL_NAME  $BUILD_TIME  $GIT_COMMIT" > "$DIST_DIR/CHECKSUM"
echo "Checksum: ${CHECKSUM:0:16}... ($BUILD_TIME, git:$GIT_COMMIT)"

echo ""
echo "Fertig:"
echo "  $DIST_DIR/control.sh"
echo "  $DIST_DIR/install.sh"
echo "  $DIST_DIR/$TARBALL_NAME ($(du -h "$DIST_DIR/$TARBALL_NAME" | cut -f1))"
echo "  $DIST_DIR/codefabrik.tar.gz → $TARBALL_NAME"
echo ""
echo "Fabrik im Koffer (v${VERSION}):"
echo "  control.sh + install.sh + $TARBALL_NAME + vault.kdbx = kompletter Neuaufbau"
