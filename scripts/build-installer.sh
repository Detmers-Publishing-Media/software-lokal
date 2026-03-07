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

mkdir -p "$DIST_DIR"

# Tarball erstellen: komplettes Repo ohne Secrets, temporaere Dateien und Build-Artefakte
echo "Tarball erstellen..."
tar czf "$DIST_DIR/$TARBALL_NAME" \
    -C "$PROJECT_DIR" \
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

# Symlink codefabrik.tar.gz → aktuellen Release (damit install.sh ihn findet)
ln -sf "$TARBALL_NAME" "$DIST_DIR/codefabrik.tar.gz"

# install.sh + control.sh kopieren
cp "$SCRIPT_DIR/install.sh" "$DIST_DIR/install.sh"
cp "$SCRIPT_DIR/control.sh" "$DIST_DIR/control.sh"
chmod +x "$DIST_DIR/install.sh" "$DIST_DIR/control.sh"

echo ""
echo "Fertig:"
echo "  $DIST_DIR/control.sh"
echo "  $DIST_DIR/install.sh"
echo "  $DIST_DIR/$TARBALL_NAME ($(du -h "$DIST_DIR/$TARBALL_NAME" | cut -f1))"
echo "  $DIST_DIR/codefabrik.tar.gz → $TARBALL_NAME"
echo ""
echo "Fabrik im Koffer (v${VERSION}):"
echo "  control.sh + install.sh + $TARBALL_NAME + vault.kdbx = kompletter Neuaufbau"
