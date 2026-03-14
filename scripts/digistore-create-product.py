#!/usr/bin/env /tmp/seed-venv/bin/python
"""digistore-create-product.py — Neues Produkt in Digistore24 anlegen via API.

Liest den API-Key aus KeePass, ruft die Digistore24 API auf und gibt
die neue Produkt-ID zurueck.

Nutzung:
    python digistore-create-product.py                  # Produkt interaktiv auswaehlen
    python digistore-create-product.py nachweis-lokal   # Produkt direkt angeben
    python digistore-create-product.py --list           # Verfuegbare Produkte anzeigen

Voraussetzung: /tmp/seed-venv mit pykeepass
    python3 -m venv /tmp/seed-venv && /tmp/seed-venv/bin/pip install pykeepass

KeePass-Eintrag: "digistore-api-key" in Studio Ops/00-Vault/Code-Fabrik/
API-Rechte: Vollzugriff (nicht "Entwickler")
Auth: Header-basiert (X-DS-API-KEY), nicht URL-basiert
"""

import getpass
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

from pykeepass import PyKeePass

# --- Konfiguration ---

DB_PATH = "/home/ldetmers/seafile/ipe-security/Code-Fabrik-V1-0.kdbx"
GROUP_PATH = ["Studio Ops", "00-Vault", "Code-Fabrik"]
API_KEY_ENTRY = "digistore-api-key"

BASE_URL = "https://www.digistore24.com/api/call"
IPN_URL = "https://digistore.detmers-publish.de/api/digistore-ipn"

# --- Produktkatalog ---
# Neue Produkte hier eintragen. Key = CLI-Argument.
# product_type_id: 1 = Software

PRODUCTS = {
    "mitglieder-lokal": {
        "name_de": "Mitglieder Lokal — Servicepaket",
        "product_type_id": "1",
        "description_de": (
            "Lokale Vereinsverwaltung: Mitglieder, Beitraege, Mahnbriefe, "
            "DSGVO-Funktionen. Servicepaket mit Installer, Updates und Support. "
            "39 EUR/Jahr."
        ),
        "bundle": "B-05-verein-ehrenamt",
        "digistore_id": None,  # TODO: ID nach Anlage eintragen
    },
    "rechnung-lokal": {
        "name_de": "Rechnung Lokal — Servicepaket",
        "product_type_id": "1",
        "description_de": (
            "Lokale Rechnungsstellung mit E-Rechnung (ZUGFeRD), EUeR und "
            "Kundenverwaltung. Servicepaket mit Installer, Updates und Support. "
            "39 EUR/Jahr."
        ),
        "bundle": "B-07-rechnung",
        "digistore_id": None,  # TODO: ID nach Anlage eintragen
    },
    "finanz-rechner": {
        "name_de": "FinanzRechner Lokal — Servicepaket",
        "product_type_id": "1",
        "description_de": (
            "5 Versicherungsrechner fuer Makler: Ratenzuschlag, SpartenDeckung, "
            "BeitragsAnpassung, StornoHaftung, CourtagenBarwert. "
            "Servicepaket mit Installer, Updates und Support. 39 EUR/Jahr."
        ),
        "bundle": "B-24-finanz-rechner",
        "digistore_id": None,  # TODO: ID nach Anlage eintragen
    },
    "nachweis-lokal": {
        "name_de": "Nachweis Lokal — Servicepaket",
        "product_type_id": "1",
        "description_de": (
            "Lokales Desktop-Tool fuer Pruefprotokolle, Checklisten und Nachweise. "
            "Servicepaket mit Installer, Updates, Templates und Support. "
            "39 EUR/Jahr."
        ),
        "bundle": "B-08-nachweis",
        "digistore_id": "675654",
    },
    "test-produkt": {
        "name_de": "Test-Produkt Detmers-Publish.de",
        "product_type_id": "1",
        "description_de": "Testprodukt fuer IPN- und Lizenz-Tests.",
        "bundle": None,
        "digistore_id": None,  # Erstes Testprodukt wurde manuell angelegt
    },
}


def get_api_key(kp):
    """API-Key aus KeePass lesen."""
    parent = kp.root_group
    for name in GROUP_PATH:
        parent = kp.find_groups(name=name, group=parent, first=True)
        if parent is None:
            print(f"FEHLER: Gruppe '{name}' nicht gefunden", file=sys.stderr)
            sys.exit(1)

    entry = kp.find_entries(title=API_KEY_ENTRY, group=parent, first=True)
    if entry is None:
        print(f"FEHLER: Eintrag '{API_KEY_ENTRY}' nicht gefunden.", file=sys.stderr)
        print("Vorhandene Eintraege in der Gruppe:", file=sys.stderr)
        for e in parent.entries:
            print(f"  - {e.title}", file=sys.stderr)
        sys.exit(1)

    return entry.password


def digistore_api(api_key, function, params=None):
    """Digistore24 API aufrufen (Header-Auth, data[]-Prefix)."""
    url = f"{BASE_URL}/{function}/json"
    prefixed = {f"data[{k}]": v for k, v in (params or {}).items()}
    data = urllib.parse.urlencode(prefixed).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "X-DS-API-KEY": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            err = json.loads(body)
            msg = err.get("message", body.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            msg = body.decode()
        print(f"FEHLER: HTTP {e.code}: {msg}", file=sys.stderr)
        sys.exit(1)

    result = json.loads(body)
    if not result.get("result") or result["result"] == "error":
        msg = result.get("message") or result.get("error") or "Unbekannter Fehler"
        print(f"FEHLER: Digistore24 API: {msg}", file=sys.stderr)
        sys.exit(1)

    return result.get("data", result)


def list_products():
    """Verfuegbare Produkte anzeigen."""
    print("Verfuegbare Produkte:\n")
    for key, prod in PRODUCTS.items():
        status = f"(Digistore-ID: {prod['digistore_id']})" if prod["digistore_id"] else "(noch nicht angelegt)"
        print(f"  {key:20s}  {prod['name_de']:40s}  {status}")
    print(f"\nNutzung: {sys.argv[0]} <produkt-key>")


def select_product():
    """Produkt interaktiv auswaehlen."""
    available = {k: v for k, v in PRODUCTS.items() if not v["digistore_id"]}
    if not available:
        print("Alle Produkte wurden bereits angelegt.")
        list_products()
        sys.exit(0)

    print("Noch nicht angelegte Produkte:\n")
    keys = list(available.keys())
    for i, key in enumerate(keys, 1):
        print(f"  {i}. {key:20s}  {available[key]['name_de']}")

    print()
    choice = input(f"Auswahl (1-{len(keys)}): ").strip()
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(keys):
            return keys[idx]
    except ValueError:
        if choice in available:
            return choice

    print("Ungueltige Auswahl.", file=sys.stderr)
    sys.exit(1)


def main():
    # CLI-Argumente
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in ("--list", "-l"):
            list_products()
            return
        if arg in ("--help", "-h"):
            print(__doc__)
            return
        if arg not in PRODUCTS:
            print(f"FEHLER: Unbekanntes Produkt '{arg}'", file=sys.stderr)
            list_products()
            sys.exit(1)
        product_key = arg
    else:
        product_key = select_product()

    product = PRODUCTS[product_key]

    if product["digistore_id"]:
        print(f"Produkt '{product_key}' wurde bereits angelegt (ID: {product['digistore_id']}).")
        print(f"Dashboard: https://www.digistore24.com/product/{product['digistore_id']}")
        print("\nNochmal anlegen? Das erzeugt ein Duplikat.")
        if input("Fortfahren? (j/N): ").strip().lower() != "j":
            return

    print(f"\n=== Digistore24 — Produkt anlegen ===\n")
    print(f"Produkt:       {product['name_de']}")
    print(f"Beschreibung:  {product['description_de']}")
    if product.get("bundle"):
        print(f"Bundle:        {product['bundle']}")
    print()

    # KeePass oeffnen
    db_pass = getpass.getpass("KeePass Master-Passwort: ")
    try:
        kp = PyKeePass(DB_PATH, password=db_pass)
    except Exception as e:
        print(f"FEHLER: KeePass: {e}", file=sys.stderr)
        sys.exit(1)

    api_key = get_api_key(kp)
    print(f"API-Key geladen (****{api_key[-4:]})\n")

    # API-Parameter (nur was Digistore braucht)
    api_params = {
        "name_de": product["name_de"],
        "product_type_id": product["product_type_id"],
    }
    if product.get("description_de"):
        api_params["description_de"] = product["description_de"]

    print("Erstelle Produkt...")
    result = digistore_api(api_key, "createProduct", api_params)

    product_id = result.get("product_id") or result.get("id")
    print(f"\nErfolg! Produkt-ID: {product_id}")
    print(f"Dashboard: https://www.digistore24.com/product/{product_id}")
    print()
    print("Naechste Schritte:")
    print(f"  1. digistore_id in diesem Script aktualisieren: \"{product_key}\": ... \"digistore_id\": \"{product_id}\"")
    print(f"  2. Im Dashboard: Tab 'Liefern' -> IPN konfigurieren")
    print(f"     IPN-URL: {IPN_URL}")
    print(f"  3. Preis auf 39 EUR/Jahr setzen (Abo)")
    print(f"  4. Testbestellung ausloesen")


if __name__ == "__main__":
    main()
