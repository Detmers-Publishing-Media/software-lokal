#!/bin/bash
# validate-ansible-roles.sh — Findet Ansible-Rollen die in keinem Playbook referenziert werden
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANSIBLE_DIR="$SCRIPT_DIR/../ansible"
EXIT_CODE=0

for role_dir in "$ANSIBLE_DIR"/roles/*/; do
    role_name=$(basename "$role_dir")
    if ! grep -rq "$role_name" "$ANSIBLE_DIR/playbooks/" 2>/dev/null; then
        echo "WARNUNG: Ungenutzte Rolle: ansible/roles/$role_name/"
        EXIT_CODE=1
    fi
done

if [ "$EXIT_CODE" -eq 0 ]; then
    echo "OK: Alle Ansible-Rollen sind in Playbooks referenziert."
fi

exit $EXIT_CODE
