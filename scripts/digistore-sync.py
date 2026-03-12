#!/usr/bin/env python3
"""
digistore-sync.py — Digistore24 Produktverwaltung via API

Aufruf:
  python scripts/digistore-sync.py list                          # Alle Produkte auflisten
  python scripts/digistore-sync.py get <product_id>              # Einzelnes Produkt anzeigen
  python scripts/digistore-sync.py setup <digistore.yml>         # Komplett-Setup (create/update + IPN + Zahlungsplan)
  python scripts/digistore-sync.py create <digistore.yml>        # Neues Produkt anlegen
  python scripts/digistore-sync.py update <digistore.yml>        # Produkt aktualisieren (Name, Beschreibung)
  python scripts/digistore-sync.py ipn <digistore.yml>           # IPN-Webhook konfigurieren
  python scripts/digistore-sync.py payment-plan <digistore.yml>  # Zahlungsplan erstellen
  python scripts/digistore-sync.py settings                      # Globale Einstellungen (product_type_ids)
  python scripts/digistore-sync.py debug <function>              # Beliebige API-Funktion aufrufen

Konfiguration pro Produkt: products/<name>/digistore.yml
Liest API-Key aus KeePass: Studio Ops/00-Vault/Code-Fabrik/digistore-api-key
"""

import getpass, json, os, sys, urllib.request, urllib.parse, urllib.error

# --- KeePass ---
DB_PATH = os.path.expanduser("~/seafile/ipe-security/Code-Fabrik-V1-0.kdbx")
GROUP_PATH = ["Studio Ops", "00-Vault", "Code-Fabrik"]

def load_api_key():
    try:
        from pykeepass import PyKeePass
    except ImportError:
        print("FEHLER: pykeepass nicht installiert.")
        print("  pip install pykeepass  (oder /tmp/seed-venv/bin/pip install pykeepass)")
        sys.exit(1)

    if not os.path.exists(DB_PATH):
        print(f"FEHLER: KeePass-DB nicht gefunden: {DB_PATH}")
        sys.exit(1)

    pw = getpass.getpass("KeePass Master-Passwort: ")
    kp = PyKeePass(DB_PATH, password=pw)
    parent = kp.root_group
    for name in GROUP_PATH:
        parent = kp.find_groups(name=name, group=parent, first=True)
        if not parent:
            print(f"FEHLER: KeePass-Gruppe '{name}' nicht gefunden")
            sys.exit(1)
    entry = kp.find_entries(title="digistore-api-key", group=parent, first=True)
    if not entry or not entry.password:
        print("FEHLER: KeePass-Eintrag 'digistore-api-key' nicht gefunden oder leer")
        sys.exit(1)
    return entry.password


# --- API ---
BASE_URL = "https://www.digistore24.com/api/call"

def api_call(api_key, function, params=None, raw_params=False):
    """Digistore24 API-Aufruf.

    params: Dict mit Parametern
    raw_params: False = data[key]=value Format, True = key=value direkt
    """
    url = f"{BASE_URL}/{function}/json"

    post_data = {}
    if params:
        if raw_params:
            post_data = {k: v for k, v in params.items()}
        else:
            for k, v in params.items():
                post_data[f"data[{k}]"] = v

    data = urllib.parse.urlencode(post_data).encode() if post_data else b""

    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "X-DS-API-KEY": api_key,
        "Accept": "application/json",
    }, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
            if body.get("result") != "success":
                print(f"API-Fehler: {body.get('message', json.dumps(body, indent=2))}")
                return None
            return body.get("data", {})
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        try:
            err_json = json.loads(err_body)
            print(f"HTTP {e.code}: {err_json.get('message', err_body[:500])}")
        except json.JSONDecodeError:
            print(f"HTTP {e.code}: {err_body[:500]}")
        return None


# --- Digistore YAML Parser ---
def parse_digistore_yml(path):
    """Liest digistore.yml mit allen Produktkonfigurations-Feldern."""
    import re
    with open(path, 'r') as f:
        text = f.read()

    def get_value(key):
        m = re.search(rf'^{key}:\s*["\']?(.+?)["\']?\s*$', text, re.MULTILINE)
        return m.group(1).strip() if m else None

    def get_block(key):
        """Holt einen mehrzeiligen Block (eingerueckter Text nach key: |)."""
        pattern = rf'^{key}:\s*\|?\s*\n((?:\s{{2,}}.*\n)*)'
        m = re.search(pattern, text, re.MULTILINE)
        if m:
            lines = m.group(1).strip().split('\n')
            return ' '.join(l.strip() for l in lines)
        return None

    return {
        'product_id': get_value('product_id'),
        'name': get_value('name'),
        'tagline': get_value('tagline') or '',
        'description_short': get_value('description_short') or '',
        'description_long': get_block('description_long') or '',
        'price': get_value('price') or '39.00',
        'currency': get_value('currency') or 'EUR',
        'thankyou_url': get_value('thankyou_url') or 'https://portal.detmers-publish.de/danke',
    }


# --- Kommandos ---

def cmd_list(api_key):
    """Alle Produkte auflisten."""
    data = api_call(api_key, "listProducts")
    if data is None:
        return

    products = []
    if isinstance(data, dict) and "products" in data:
        products = data["products"]
    elif isinstance(data, list):
        products = data
    else:
        print(f"Antwort-Typ: {type(data)}")
        print(json.dumps(data, indent=2, ensure_ascii=False)[:3000])
        return

    if not products:
        print("Keine Produkte gefunden.")
        return

    print(f"{'ID':<12} {'Name':<40} {'Preis':<10}")
    print("-" * 62)
    for p in products:
        pid = p.get("id") or p.get("product_id", "?")
        name = p.get("name") or p.get("name_de") or p.get("name_intern", "?")
        price = p.get("price_formatted") or p.get("price", "?")
        print(f"{pid:<12} {name:<40} {price:<10}")

    print(f"\nGesamt: {len(products)} Produkte")


def cmd_get(api_key, product_id):
    """Einzelnes Produkt anzeigen."""
    data = api_call(api_key, "getProduct", {"product_id": str(product_id)}, raw_params=True)
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_settings(api_key):
    """Globale Einstellungen (product_type_ids etc.)."""
    data = api_call(api_key, "getGlobalSettings")
    if data:
        if "product_types" in data:
            print("=== Produkt-Typen ===")
            for pt in data["product_types"]:
                ptid = pt.get("id", "?")
                name = pt.get("name") or pt.get("name_de", "?")
                print(f"  {ptid}: {name}")
        else:
            print(json.dumps(data, indent=2, ensure_ascii=False)[:5000])


def cmd_create(api_key, spec):
    """Neues Produkt anlegen."""
    if not spec['name']:
        print("FEHLER: Kein 'name' in digistore.yml")
        return None

    print("Ermittle Produkt-Typen...")
    settings = api_call(api_key, "getGlobalSettings")
    software_type_id = None
    if settings and "product_types" in settings:
        for pt in settings["product_types"]:
            name = (pt.get("name") or pt.get("name_de") or "").lower()
            if "software" in name or "digital" in name:
                software_type_id = pt.get("id")
                print(f"  Verwende Typ: {pt.get('name', name)} (ID: {software_type_id})")
                break
    if not software_type_id:
        print("WARNUNG: Kein Software-Produkttyp gefunden. Verwende Typ 1.")
        software_type_id = "1"

    description = spec.get('description_long') or spec.get('description_short') or spec.get('tagline', '')
    params = {
        "product_type_id": str(software_type_id),
        "name_de": spec['name'],
        "name_intern": spec['name'].lower().replace(' ', '-'),
        "description_de": description,
        "approval_status": "new",
    }

    print(f"\nErstelle Produkt: {spec['name']}")
    print(f"  Typ-ID: {software_type_id}")
    print(f"  Beschreibung: {description[:80]}...")

    data = api_call(api_key, "createProduct", params, raw_params=True)
    if data:
        pid = data.get("product_id") or data.get("id")
        print(f"\nProdukt erstellt! ID: {pid}")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return pid
    return None


def cmd_update(api_key, spec):
    """Produkt aktualisieren (Name, Beschreibung)."""
    product_id = spec.get('product_id')
    if not product_id:
        print("FEHLER: Kein 'product_id' in digistore.yml")
        return

    description = spec.get('description_long') or spec.get('description_short') or ''
    thankyou_url = spec.get('thankyou_url', '')
    post_data = {"product_id": str(product_id)}
    if spec.get('name'):
        post_data["data[name_de]"] = spec['name']
    if description:
        post_data["data[description_de]"] = description
    if thankyou_url:
        post_data["data[thankyou_url]"] = thankyou_url

    print(f"Aktualisiere Produkt {product_id}:")
    if spec.get('name'):
        print(f"  name_de: {spec['name']}")
    if description:
        print(f"  description_de: {description[:80]}...")
    if thankyou_url:
        print(f"  thankyou_url: {thankyou_url}")

    data = api_call(api_key, "updateProduct", post_data, raw_params=True)
    if data:
        print("\nProdukt aktualisiert!")
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_ipn(api_key, spec):
    """IPN-Webhook konfigurieren."""
    product_id = spec.get('product_id')
    if not product_id:
        print("FEHLER: Kein 'product_id' in digistore.yml")
        return

    ipn_url = "https://portal.detmers-publish.de/api/digistore-ipn"
    params = {
        "ipn_url": ipn_url,
        "name": "code-fabrik-portal",
        "product_ids": str(product_id),
        "transactions": "payment,refund,chargeback,payment_missed,rebill_cancelled,rebill_resumed,last_paid_day",
        "timing": "before_thankyou",
    }

    print(f"Konfiguriere IPN fuer Produkt {product_id}:")
    print(f"  URL: {ipn_url}")
    print(f"  Events: {params['transactions']}")

    data = api_call(api_key, "ipnSetup", params, raw_params=True)
    if data:
        print("\nIPN konfiguriert!")
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_payment_plan(api_key, spec):
    """Zahlungsplan erstellen (Einmalzahlung)."""
    product_id = spec.get('product_id')
    if not product_id:
        print("FEHLER: Kein 'product_id' in digistore.yml")
        return

    price = spec.get('price', '39.00')
    currency = spec.get('currency', 'EUR')
    thankyou_url = spec.get('thankyou_url', 'https://portal.detmers-publish.de/danke')

    post_data = {
        "product_id": str(product_id),
        "data[first_amount]": str(price),
        "data[number_of_installments]": "1",
        "data[currency]": currency,
    }

    print(f"Erstelle Zahlungsplan fuer Produkt {product_id}:")
    print(f"  Einmalzahlung: {price} {currency}")

    data = api_call(api_key, "createPaymentPlan", post_data, raw_params=True)
    if data:
        print("\nZahlungsplan erstellt!")
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_setup(api_key, spec):
    """Komplett-Setup: Produkt anlegen/aktualisieren + IPN + Zahlungsplan."""
    product_id = spec.get('product_id')

    if product_id:
        print(f"=== Produkt {product_id} aktualisieren ===\n")
        cmd_update(api_key, spec)
    else:
        print("=== Neues Produkt anlegen ===\n")
        product_id = cmd_create(api_key, spec)
        if not product_id:
            print("\nABBRUCH: Produkt konnte nicht erstellt werden.")
            return
        spec['product_id'] = str(product_id)
        print(f"\n  HINWEIS: product_id: {product_id} in digistore.yml eintragen!\n")

    print(f"\n=== IPN konfigurieren ===\n")
    cmd_ipn(api_key, spec)

    print(f"\n=== Zahlungsplan erstellen ===\n")
    cmd_payment_plan(api_key, spec)

    print(f"\n=== Setup abgeschlossen fuer Produkt {product_id} ===")


def cmd_debug(api_key, function):
    """Beliebige API-Funktion aufrufen (ohne Parameter)."""
    print(f"Rufe {function}() auf...\n")
    data = api_call(api_key, function)
    if data is not None:
        print(json.dumps(data, indent=2, ensure_ascii=False)[:5000])


# --- Main ---

def usage():
    print(__doc__)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        usage()

    cmd = sys.argv[1]
    api_key = load_api_key()
    print()

    # Befehle die eine digistore.yml brauchen
    yml_commands = {"setup", "create", "update", "ipn", "payment-plan"}

    if cmd in yml_commands:
        if len(sys.argv) < 3:
            print(f"FEHLER: {cmd} braucht eine digistore.yml als Argument")
            print(f"  Beispiel: python scripts/digistore-sync.py {cmd} products/nachweis-lokal/digistore.yml")
            sys.exit(1)
        spec = parse_digistore_yml(sys.argv[2])

        if cmd == "setup":
            cmd_setup(api_key, spec)
        elif cmd == "create":
            cmd_create(api_key, spec)
        elif cmd == "update":
            cmd_update(api_key, spec)
        elif cmd == "ipn":
            cmd_ipn(api_key, spec)
        elif cmd == "payment-plan":
            cmd_payment_plan(api_key, spec)

    elif cmd == "list":
        cmd_list(api_key)
    elif cmd == "get" and len(sys.argv) >= 3:
        cmd_get(api_key, sys.argv[2])
    elif cmd == "settings":
        cmd_settings(api_key)
    elif cmd == "debug" and len(sys.argv) >= 3:
        cmd_debug(api_key, sys.argv[2])
    else:
        usage()
