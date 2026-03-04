#!/usr/bin/env /tmp/seed-venv/bin/python
"""seed-keepass.py — Secrets aus Dateien + interaktiver Eingabe → KeePass"""

import getpass
import os
import sys

from pykeepass import PyKeePass

DB_PATH = "/home/ldetmers/seafile/ipe-security/Code-Fabrik-V1-0.kdbx"
CODE_FABRIK = os.path.expanduser("~/code-fabrik")
SSH_KEY = os.path.expanduser("~/.ssh/codefabrik_deploy")

GROUP_PATH = ["Studio Ops", "00-Vault", "Code-Fabrik"]
RUNTIME_PATH = GROUP_PATH + ["Runtime"]

# Dateien → Runtime-Gruppe
RUNTIME_FILES = {
    "factory-passwords": ".factory-passwords.env",
    "server-env": ".server-env",
    "tokens-env": ".tokens-env",
    "portal-passwords": ".portal-passwords.env",
    "portal-env": ".portal-env",
}

# API Tokens (Pflicht) — interaktiv abfragen
API_TOKENS = {
    "upcloud-api-token": "UpCloud API Token (ucat_...)",
    "cloudflare-api-token": "Cloudflare API Token",
    "anthropic-api-key": "Anthropic API Key",
}

# Optionale Tokens
OPTIONAL_TOKENS = {
    "ollama-api-key": "Ollama API Key (leer = skip)",
    "ollama-host": "Ollama Host (leer = skip)",
    "ollama-model": "Ollama Model (leer = skip)",
}


def find_or_create_group(kp, path):
    """Gruppe finden oder anlegen."""
    parent = kp.root_group
    for name in path:
        found = kp.find_groups(name=name, group=parent, first=True)
        if found is None:
            found = kp.add_group(parent, name)
        parent = found
    return parent


def add_or_update_entry(kp, group, title, password, username=""):
    """Eintrag anlegen oder aktualisieren."""
    entry = kp.find_entries(title=title, group=group, first=True)
    if entry:
        entry.password = password
        print(f"  UPDATE: {title}")
    else:
        kp.add_entry(group, title, username, password)
        print(f"  ADD: {title}")


def main():
    print("=== Code-Fabrik KeePass Seed ===\n")

    # KeePass oeffnen
    db_pass = getpass.getpass("KeePass Master-Passwort: ")
    try:
        kp = PyKeePass(DB_PATH, password=db_pass)
    except Exception as e:
        print(f"FEHLER: {e}", file=sys.stderr)
        sys.exit(1)

    cf_group = find_or_create_group(kp, GROUP_PATH)
    rt_group = find_or_create_group(kp, RUNTIME_PATH)

    # --- 1. API Tokens (interaktiv) ---
    print("\n--- API Tokens ---")
    for entry_name, prompt in API_TOKENS.items():
        value = getpass.getpass(f"  {prompt}: ")
        if value.strip():
            add_or_update_entry(kp, cf_group, entry_name, value.strip())
        else:
            print(f"  SKIP: {entry_name} (leer)")

    print("\n--- Optionale Tokens ---")
    for entry_name, prompt in OPTIONAL_TOKENS.items():
        value = input(f"  {prompt}: ").strip()
        if value:
            add_or_update_entry(kp, cf_group, entry_name, value)
        else:
            print(f"  SKIP: {entry_name}")

    # --- 2. SSH Keys ---
    print("\n--- SSH Keys ---")
    for suffix, entry_name in [("", "ssh-deploy-key"), (".pub", "ssh-deploy-key-pub")]:
        path = f"{SSH_KEY}{suffix}"
        if os.path.isfile(path):
            with open(path) as f:
                add_or_update_entry(kp, cf_group, entry_name, f.read().rstrip("\n"))
        else:
            print(f"  SKIP: {path} nicht gefunden")

    # --- 3. Runtime Env Files ---
    print("\n--- Runtime Env Files ---")
    for entry_name, filename in RUNTIME_FILES.items():
        filepath = os.path.join(CODE_FABRIK, filename)
        if os.path.isfile(filepath):
            with open(filepath) as f:
                add_or_update_entry(kp, rt_group, entry_name, f.read().rstrip("\n"))
        else:
            print(f"  SKIP: {filepath} nicht gefunden")

    # Speichern
    kp.save()
    print(f"\nGespeichert: {DB_PATH}")
    print("Pruefen: keepassxc-cli ls '{}' '{}'".format(DB_PATH, "/".join(GROUP_PATH)))


if __name__ == "__main__":
    main()
