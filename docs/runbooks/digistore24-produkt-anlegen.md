# Digistore24 — Neues Produkt anlegen

## Uebersicht

Jedes Code-Fabrik-Produkt braucht ein Digistore24-Produkt fuer den Verkauf des Servicepakets (39 EUR/Jahr).
Das Script `scripts/digistore-create-product.py` automatisiert die Anlage ueber die Digistore24 API.

## Voraussetzungen

1. **KeePass-Eintrag** `digistore-api-key` in `Studio Ops/00-Vault/Code-Fabrik/`
2. **API-Rechte**: Vollzugriff (nicht "Entwickler") — Digistore24 Dashboard → Einstellungen → API/IPN
3. **Python-venv** mit pykeepass:
   ```bash
   python3 -m venv /tmp/seed-venv && /tmp/seed-venv/bin/pip install pykeepass
   ```

## Nutzung

```bash
# Verfuegbare Produkte anzeigen
/tmp/seed-venv/bin/python scripts/digistore-create-product.py --list

# Produkt direkt angeben
/tmp/seed-venv/bin/python scripts/digistore-create-product.py nachweis-lokal

# Interaktiv auswaehlen (zeigt nur noch nicht angelegte Produkte)
/tmp/seed-venv/bin/python scripts/digistore-create-product.py
```

## Neues Produkt zum Katalog hinzufuegen

In `scripts/digistore-create-product.py` im Dict `PRODUCTS` einen neuen Eintrag ergaenzen:

```python
"mein-produkt": {
    "name_de": "Mein Produkt — Servicepaket",
    "product_type_id": "1",  # 1 = Software
    "description_de": "Beschreibung fuer Digistore24-Produktseite. 39 EUR/Jahr.",
    "bundle": "B-XX-mein-bundle",  # Bundle-ID aus bundles.json
    "digistore_id": None,  # Wird nach Anlage eingetragen
},
```

## Nach der Anlage

1. **`digistore_id` im Script eintragen** — verhindert versehentliche Duplikate
2. **Digistore24 Dashboard konfigurieren:**

   | Einstellung | Wert |
   |-------------|------|
   | Tab "Liefern" → IPN-URL | `https://digistore.detmers-publish.de/api/digistore-ipn` |
   | IPN-Kennwort | Aus KeePass: `digistore-ipn-passphrase` |
   | IPN-Events | Zahlung, Rueckgabe, Ruecklastschrift, Abo gekuendigt, Abo wieder aufgenommen, Bezahlte Zeit zu Ende |
   | "Letzter bezahlter Tag" ueberspringen | Ja |
   | Request-Methode | POST |
   | Call bei Fehlern wiederholen | Ja |
   | Preis | 39 EUR/Jahr (Abo) |

3. **Testbestellung ausloesen** — siehe `docs/runbooks/digistore24-test.md`

## Digistore24 API — Technische Details

- **Auth**: Header `X-DS-API-KEY` (URL-basierte Auth ist deaktiviert)
- **URL-Format**: `https://www.digistore24.com/api/call/{function}/json`
- **Parameter**: `data[key]=value` (nicht `key=value`)
- **API-Doku**: https://dev.digistore24.com

## Angelegte Produkte

| Produkt | Bundle | Digistore-ID | Status |
|---------|--------|:---:|--------|
| Test-Produkt | — | (manuell) | Testprodukt |
| Nachweis Lokal | B-08-nachweis | 675654 | Angelegt 2026-03-11 |
| Mitglieder Lokal | B-05-verein-ehrenamt | — | Noch nicht angelegt |
| Rechnung Lokal | B-07-rechnung | — | Noch nicht angelegt |
| FinanzRechner Lokal | B-24-finanz-rechner | — | Noch nicht angelegt |

## Troubleshooting

| Problem | Loesung |
|---------|---------|
| `API-Berechtigung: Entwickler` | Dashboard → API/IPN → Key auf "Vollzugriff" aendern |
| `authentication via URL no longer supported` | Script nutzt Header-Auth — alte Version? `git pull` |
| `Please give a product name` | Parameter muessen als `data[name_de]` gesendet werden |
| `pykeepass` nicht gefunden | `python3 -m venv /tmp/seed-venv && /tmp/seed-venv/bin/pip install pykeepass` |
| KeePass-Eintrag fehlt | `digistore-api-key` in `Studio Ops/00-Vault/Code-Fabrik/` anlegen |
