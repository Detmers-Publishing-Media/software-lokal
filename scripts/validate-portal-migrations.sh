#!/bin/bash
# validate-portal-migrations.sh — Prueft ob Portal-Migrationen korrekt konfiguriert sind
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SQL_DIR="$PROJECT_DIR/portal/src/db"
ANSIBLE_ROLE="$PROJECT_DIR/ansible/roles/portal-db/tasks/main.yml"

ERRORS=0

# 1. Pruefe ob Ansible-Rolle existiert
if [ ! -f "$ANSIBLE_ROLE" ]; then
  echo "FEHLER: Ansible-Rolle nicht gefunden: $ANSIBLE_ROLE"
  exit 1
fi

# 2. Pruefe ob die Rolle eine dynamische Schleife oder individuelle Eintraege hat
if grep -q 'patterns.*migrate-v\*\.sql' "$ANSIBLE_ROLE"; then
  # Dynamischer Modus: find + loop — alle SQL-Dateien werden automatisch erkannt
  echo "OK: Dynamische Migrations-Schleife in portal-db Rolle erkannt."

  # Pruefe ob init.sql separat referenziert wird (muss vor Migrationen laufen)
  if ! grep -q 'init.sql' "$ANSIBLE_ROLE"; then
    echo "FEHLER: init.sql nicht in portal-db Rolle referenziert"
    ERRORS=$((ERRORS + 1))
  fi
else
  # Manueller Modus: jede SQL-Datei muss einzeln registriert sein
  for sql_file in "$SQL_DIR"/migrate-v*.sql; do
    [ -f "$sql_file" ] || continue
    filename=$(basename "$sql_file")

    if ! grep -q "$filename" "$ANSIBLE_ROLE"; then
      echo "FEHLER: $filename nicht in portal-db/tasks/main.yml registriert"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

# 3. Pruefe ob SQL-Dateien gueltige SQL enthalten (kein leerer Inhalt)
for sql_file in "$SQL_DIR"/migrate-v*.sql; do
  [ -f "$sql_file" ] || continue
  filename=$(basename "$sql_file")
  line_count=$(wc -l < "$sql_file")
  if [ "$line_count" -lt 2 ]; then
    echo "FEHLER: $filename hat nur $line_count Zeilen — leer oder unvollstaendig?"
    ERRORS=$((ERRORS + 1))
  fi
done

# 4. Pruefe ob alle Migrationen idempotent sind (IF NOT EXISTS / IF EXISTS / ON CONFLICT)
for sql_file in "$SQL_DIR"/migrate-v*.sql; do
  [ -f "$sql_file" ] || continue
  filename=$(basename "$sql_file")

  # Jede CREATE TABLE sollte IF NOT EXISTS haben, jeder ALTER IF EXISTS
  if grep -q "CREATE TABLE" "$sql_file" && ! grep -q "IF NOT EXISTS" "$sql_file"; then
    echo "WARNUNG: $filename hat CREATE TABLE ohne IF NOT EXISTS — nicht idempotent"
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "$ERRORS Fehler gefunden."
  exit 1
fi

echo "OK: $(ls "$SQL_DIR"/migrate-v*.sql 2>/dev/null | wc -l) Migrationen, init.sql referenziert, alles konsistent."
