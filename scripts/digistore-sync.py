#!/usr/bin/env python3
"""
digistore-sync.py — Digistore24 Produktverwaltung via API

Aufruf:
  python scripts/digistore-sync.py list                     # Alle Produkte auflisten
  python scripts/digistore-sync.py get <product_id>         # Einzelnes Produkt anzeigen
  python scripts/digistore-sync.py create <spec.yml>        # Neues Produkt aus spec.yml anlegen
  python scripts/digistore-sync.py update <pid> <spec.yml>  # Bestehendes Produkt aktualisieren
  python scripts/digistore-sync.py ipn <product_id>         # IPN-Webhook konfigurieren
  python scripts/digistore-sync.py settings                 # Globale Einstellungen (product_type_ids)
  python scripts/digistore-sync.py debug <function>         # Beliebige API-Funktion aufrufen

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


# --- YAML Parser (minimal) ---
def parse_spec_yml(path):
    """Liest spec.yml und extrahiert relevante Felder fuer Digistore24."""
    import re
    with open(path, 'r') as f:
        text = f.read()

    def get_value(key):
        m = re.search(rf'^{key}:\s*["\']?(.+?)["\']?\s*$', text, re.MULTILINE)
        return m.group(1) if m else None

    def get_nested(parent, key):
        pattern = rf'^{parent}:\s*\n(?:.*\n)*?\s+{key}:\s*["\']?(.+?)["\']?\s*$'
        m = re.search(pattern, text, re.MULTILINE)
        return m.group(1) if m else None

    def get_block(key):
        """Holt einen mehrzeiligen Block (eingerueckter Text nach key: |)."""
        pattern = rf'^  {key}:\s*\|?\s*\n((?:\s{{4,}}.*\n)*)'
        m = re.search(pattern, text, re.MULTILINE)
        if m:
            lines = m.group(1).strip().split('\n')
            return ' '.join(l.strip() for l in lines)
        return None

    return {
        'product_id': get_value('product_id'),
        'name': get_value('name'),
        'tagline': get_value('tagline') or '',
        'description_short': get_nested('description', 'short') or '',
        'description_long': get_block('long') or '',
        'price_cents': get_nested('pricing', 'price_cents'),
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
        # Debug: zeige rohe Antwort
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
    # product_id als Top-Level-Parameter (nicht data[product_id])
    data = api_call(api_key, "getProduct", {"product_id": str(product_id)}, raw_params=True)
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_settings(api_key):
    """Globale Einstellungen (product_type_ids etc.)."""
    data = api_call(api_key, "getGlobalSettings")
    if data:
        # Nur relevante Felder anzeigen
        if "product_types" in data:
            print("=== Produkt-Typen ===")
            for pt in data["product_types"]:
                ptid = pt.get("id", "?")
                name = pt.get("name") or pt.get("name_de", "?")
                print(f"  {ptid}: {name}")
        else:
            print(json.dumps(data, indent=2, ensure_ascii=False)[:5000])


def cmd_create(api_key, spec_path):
    """Neues Produkt aus spec.yml anlegen."""
    spec = parse_spec_yml(spec_path)

    if not spec['name']:
        print(f"FEHLER: Kein 'name' in {spec_path}")
        return

    # Erst product_type_id ermitteln
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

    params = {
        "product_type_id": str(software_type_id),
        "name_de": spec['name'],
        "name_intern": spec.get('product_id') or spec['name'].lower().replace(' ', '-'),
        "description_de": spec.get('description_long') or spec.get('description_short') or spec.get('tagline', ''),
        "approval_status": "new",
    }

    print(f"\nErstelle Produkt: {spec['name']}")
    print(f"  Typ-ID: {software_type_id}")
    print(f"  Name intern: {params['name_intern']}")
    print(f"  Beschreibung: {params['description_de'][:80]}...")
    print()

    data = api_call(api_key, "createProduct", params, raw_params=True)
    if data:
        pid = data.get("product_id") or data.get("id")
        print(f"\nProdukt erstellt! ID: {pid}")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return pid
    return None


def cmd_update(api_key, product_id, spec_path):
    """Bestehendes Produkt aus spec.yml aktualisieren."""
    spec = parse_spec_yml(spec_path)

    # product_id als Top-Level-Parameter, Rest als data[key]
    data_params = {}
    if spec.get('name'):
        data_params["name_de"] = spec['name']
    if spec.get('description_long') or spec.get('description_short'):
        data_params["description_de"] = spec.get('description_long') or spec.get('description_short', '')

    print(f"Aktualisiere Produkt {product_id}:")
    for k, v in data_params.items():
        print(f"  {k}: {str(v)[:80]}")

    # Manuell POST body bauen: product_id direkt + Rest als data[key]
    post_data = {"product_id": str(product_id)}
    for k, v in data_params.items():
        post_data[f"data[{k}]"] = v

    data = api_call(api_key, "updateProduct", post_data, raw_params=True)
    if data:
        print("\nProdukt aktualisiert!")
        print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_ipn(api_key, product_id):
    """IPN-Webhook fuer ein Produkt konfigurieren."""
    # IPN-URL und Passphrase aus KeePass lesen
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

    if cmd == "list":
        cmd_list(api_key)
    elif cmd == "get" and len(sys.argv) >= 3:
        cmd_get(api_key, sys.argv[2])
    elif cmd == "create" and len(sys.argv) >= 3:
        cmd_create(api_key, sys.argv[2])
    elif cmd == "update" and len(sys.argv) >= 4:
        cmd_update(api_key, sys.argv[2], sys.argv[3])
    elif cmd == "ipn" and len(sys.argv) >= 3:
        cmd_ipn(api_key, sys.argv[2])
    elif cmd == "settings":
        cmd_settings(api_key)
    elif cmd == "debug" and len(sys.argv) >= 3:
        cmd_debug(api_key, sys.argv[2])
    else:
        usage()
