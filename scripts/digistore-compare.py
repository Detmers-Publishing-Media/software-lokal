#!/usr/bin/env python3
"""Vergleicht zwei Digistore24-Produkte."""
import getpass, json, sys, urllib.request, urllib.parse, urllib.error
from pykeepass import PyKeePass

DB_PATH = "/home/ldetmers/seafile/ipe-security/Code-Fabrik-V1-0.kdbx"
GROUP_PATH = ["Studio Ops", "00-Vault", "Code-Fabrik"]
BASE_URL = "https://www.digistore24.com/api/call"

def get_api_key(kp):
    parent = kp.root_group
    for name in GROUP_PATH:
        parent = kp.find_groups(name=name, group=parent, first=True)
    entry = kp.find_entries(title="digistore-api-key", group=parent, first=True)
    return entry.password

def api_call(api_key, function, params=None):
    url = f"{BASE_URL}/{function}/json"
    data = urllib.parse.urlencode(params or {}).encode() if params else None
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "X-DS-API-KEY": api_key,
    }, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
            if body.get("result") != "success":
                print(f"  API-Fehler: {body.get('message', body)}")
            return body.get("data", {})
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code}: {err_body[:500]}")
        return {}

db_pass = getpass.getpass("KeePass Master-Passwort: ")
kp = PyKeePass(DB_PATH, password=db_pass)
api_key = get_api_key(kp)
print(f"API-Key geladen.\n")

# Erst alle Produkte listen um die IDs zu finden
print("=== Alle Produkte abrufen ===\n")
products = api_call(api_key, "listProducts")

if isinstance(products, dict) and "products" in products:
    product_list = products["products"]
elif isinstance(products, list):
    product_list = products
else:
    print(f"Antwort-Typ: {type(products)}")
    print(json.dumps(products, indent=2, ensure_ascii=False)[:2000])
    product_list = []

for p in product_list:
    pid = p.get("id") or p.get("product_id", "?")
    name = p.get("name") or p.get("name_de", "?")
    print(f"  ID: {pid}  — {name}")

print(f"\nGesamt: {len(product_list)} Produkte\n")

# Details fuer jedes Produkt
for p in product_list:
    pid = p.get("id") or p.get("product_id")
    if not pid:
        continue
    print(f"\n{'='*60}")
    print(f"=== Produkt {pid} ===")
    print(f"{'='*60}")
    try:
        detail = api_call(api_key, "getProduct", {"product_id": str(pid)})
        print(json.dumps(detail, indent=2, ensure_ascii=False)[:3000])
    except Exception as e:
        print(f"Fehler: {e}")
