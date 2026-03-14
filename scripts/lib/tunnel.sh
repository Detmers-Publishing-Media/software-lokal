#!/bin/bash
# tunnel.sh — SSH-Tunnel zu PROD-Server (AnythingLLM + OpenClaw)
# Sourced by install.sh. Requires common.sh + secrets.sh.

run_tunnel() {
    echo ""
    echo "=== SSH-Tunnel zum PROD-Server ==="

    # Server-IP aus .server-env oder KeePass laden
    local server_ip=""
    if [ -f "$SHM_OUTPUT/.server-env" ]; then
        server_ip=$(grep -oP 'SERVER_IP=\K.*' "$SHM_OUTPUT/.server-env" || true)
    fi
    if [ -z "$server_ip" ]; then
        die "Server-IP nicht gefunden. Zuerst 'reconcile' oder 'bootstrap' ausfuehren."
    fi

    # SSH-Key aus /dev/shm (bereits durch load_secrets extrahiert)
    local ssh_key="$SHM_SECRETS/deploy_key"
    if [ ! -f "$ssh_key" ]; then
        die "SSH-Key nicht gefunden in $ssh_key"
    fi

    echo ""
    echo "  Server:      $server_ip"
    echo ""
    echo "  Tunnel-Ports:"
    echo "    AnythingLLM:  http://localhost:3001  (RAG Wissensbasis)"
    echo "    Forgejo:      http://localhost:3000  (Git Server)"
    echo ""
    echo "  Oeffne die URLs im Browser waehrend der Tunnel laeuft."
    echo "  Beenden mit Ctrl+C."
    echo ""

    ssh -N \
        -L 3001:localhost:3001 \
        -L 3000:localhost:3000 \
        -o StrictHostKeyChecking=accept-new \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -i "$ssh_key" \
        root@"$server_ip"
}
