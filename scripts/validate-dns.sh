#!/bin/bash
# validate-dns.sh — Prueft Cloudflare DNS-Records gegen bekannte Server-IPs
# Findet: Duplikate, verwaiste Records (IP antwortet nicht), Inkonsistenzen
#
# Voraussetzung: CLOUDFLARE_API_TOKEN als Env-Variable oder in Ansible Vault
# Aufruf: ./scripts/validate-dns.sh [--fix]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ZONE_ID="b9525ee2fa8f0e14ce58b1f1b184c597"
ERRORS=0
WARNINGS=0

# --- Token ermitteln ---
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  # Versuche aus KeePass zu lesen
  KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
  if [ -f "$KEEPASS_DB" ] && command -v python3 &>/dev/null; then
    token=$(python3 -c "
import sys, getpass
try:
    from pykeepass import PyKeePass
    pw = getpass.getpass('KeePass Masterpasswort: ')
    kp = PyKeePass('$KEEPASS_DB', password=pw)
    entry = kp.find_entries(title='cloudflare-api-token', first=True)
    if entry:
        print(entry.password)
except Exception as e:
    print('', file=sys.stderr)
" 2>/dev/null || true)
    if [ -n "$token" ]; then
      CLOUDFLARE_API_TOKEN="$token"
    fi
  fi
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "FEHLER: CLOUDFLARE_API_TOKEN nicht gesetzt."
  echo ""
  echo "Optionen:"
  echo "  1. CLOUDFLARE_API_TOKEN=xxx ./scripts/validate-dns.sh"
  echo "  2. KeePass-DB unter $HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx bereitstellen"
  exit 1
fi

echo "=== DNS-Validierung fuer detmers-publish.de ==="
echo ""

# --- Alle A-Records laden ---
RECORDS=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&per_page=100" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

if ! echo "$RECORDS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success']" 2>/dev/null; then
  echo "FEHLER: Cloudflare API-Aufruf fehlgeschlagen"
  echo "$RECORDS" | python3 -m json.tool 2>/dev/null || echo "$RECORDS"
  exit 1
fi

# --- Records parsen ---
echo "$RECORDS" | python3 -c "
import json, sys

data = json.load(sys.stdin)
records = data['result']

# Gruppiere nach Name
by_name = {}
for r in records:
    name = r['name'].replace('.detmers-publish.de', '') if r['name'] != 'detmers-publish.de' else '@'
    by_name.setdefault(name, []).append({
        'id': r['id'],
        'ip': r['content'],
        'proxied': r['proxied'],
        'name': r['name'],
    })

errors = 0
warnings = 0

print(f'Gefunden: {len(records)} A-Records fuer {len(by_name)} Hostnamen')
print()

# 1. Duplikate finden
print('--- Duplikat-Pruefung ---')
for name, entries in sorted(by_name.items()):
    if len(entries) > 1:
        print(f'  DUPLIKAT: {name} hat {len(entries)} A-Records:')
        for e in entries:
            print(f'    - {e[\"ip\"]} (proxied={e[\"proxied\"]}, id={e[\"id\"]})')
        errors += 1
    else:
        e = entries[0]
        print(f'  OK: {name} -> {e[\"ip\"]} (proxied={e[\"proxied\"]})')
print()

# 2. Erreichbarkeit pruefen (TCP-Connect auf Port 22, Timeout 3s)
import socket

print('--- Erreichbarkeits-Pruefung (SSH Port 22, 3s Timeout) ---')
checked_ips = set()
for name, entries in sorted(by_name.items()):
    for e in entries:
        ip = e['ip']
        if ip in checked_ips:
            continue
        checked_ips.add(ip)
        try:
            s = socket.create_connection((ip, 22), timeout=3)
            s.close()
            print(f'  OK: {ip} ({name}) erreichbar')
        except (socket.timeout, ConnectionRefusedError, OSError):
            print(f'  WARNUNG: {ip} ({name}) NICHT erreichbar auf Port 22')
            warnings += 1
print()

# 3. Zusammenfassung
print(f'=== Ergebnis: {errors} Fehler, {warnings} Warnungen ===')
if errors > 0:
    print()
    print('Duplikate muessen manuell im Cloudflare Dashboard geloescht werden.')
    print('Zum Loeschen per API:')
    for name, entries in sorted(by_name.items()):
        if len(entries) > 1:
            for e in entries:
                print(f'  curl -X DELETE \"https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/{e[\"id\"]}\" -H \"Authorization: Bearer \$CLOUDFLARE_API_TOKEN\"')

sys.exit(1 if errors > 0 else 0)
"
