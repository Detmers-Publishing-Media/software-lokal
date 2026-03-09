# Digistore24 IPN — E2E Test-Runbook

## Voraussetzungen

- Portal + PROD Server laufen
- DNS-Eintrag `digistore.detmers-publish.de` zeigt auf Portal-IP
- Caddy hat Let's Encrypt Zertifikat fuer `digistore.detmers-publish.de`
- `DIGISTORE_IPN_PASSPHRASE` ist in Portal .env gesetzt
- IPN-URL in Digistore24: `https://digistore.detmers-publish.de/api/digistore-ipn`

## 1. IPN-Endpoint erreichbar?

```bash
# Muss 404 liefern (GET ist nicht registriert, nur POST)
curl -s https://digistore.detmers-publish.de/

# Muss "OK" liefern (ohne gueltige Signatur wird trotzdem 200 geantwortet)
curl -s -X POST https://digistore.detmers-publish.de/api/digistore-ipn \
  -d "event=test&sha_sign=invalid"
```

## 2. Signaturpruefung testen

```bash
# Ungueltige Signatur → wird im Log als invalid_signature erfasst
ssh -i ~/.ssh/codefabrik_deploy root@PORTAL_IP \
  docker exec portal-db psql -U portal -d portal -c \
  "SELECT * FROM digistore_ipn_log ORDER BY id DESC LIMIT 5;"
```

Erwartet: Ein Eintrag mit `result = 'invalid_signature'`.

## 3. Testkauf in Digistore24

1. Digistore24 Dashboard oeffnen
2. Produkt "Test-Produkt Detmers-Publish.de" → Testbestellung ausloesen
3. Warten bis IPN-Notification gesendet wurde (Dashboard → IPN-Log)

## 4. IPN-Log pruefen

```bash
ssh -i ~/.ssh/codefabrik_deploy root@PORTAL_IP \
  docker exec portal-db psql -U portal -d portal -c \
  "SELECT id, event_type, order_id, result, error_msg, processed_at
   FROM digistore_ipn_log ORDER BY id DESC LIMIT 5;"
```

Erwartet: Eintrag mit `event_type = 'on_payment'`, `result = 'success'`.

## 5. Lizenz pruefen

```bash
ssh -i ~/.ssh/codefabrik_deploy root@PORTAL_IP \
  docker exec portal-db psql -U portal -d portal -c \
  "SELECT license_key, product_id, status, source, order_id, activated_at
   FROM licenses WHERE source = 'digistore' ORDER BY id DESC LIMIT 5;"
```

Erwartet: Lizenz mit `status = 'active'`, `source = 'digistore'`.

## 6. Lizenz-Download testen

```bash
# LICENSE_KEY aus Schritt 5 einsetzen
# Schritt 1: Download-Token holen (Key wird per POST gesendet, nie in URL)
TOKEN=$(curl -s -X POST "https://portal.detmers-publish.de/api/download-token" \
  -H "Content-Type: application/json" \
  -d '{"key":"LICENSE_KEY"}' | jq -r '.token')

# Schritt 2: Download mit Token
curl -sI "https://portal.detmers-publish.de/api/download/PRODUCT_ID/linux?token=$TOKEN"
```

Erwartet: HTTP 200 mit Datei-Download (oder 404 falls kein Release existiert).

## 7. Storno testen

1. In Digistore24: Testbestellung stornieren (Refund)
2. Warten auf IPN-Notification

```bash
# IPN-Log: on_refund mit result=success
ssh -i ~/.ssh/codefabrik_deploy root@PORTAL_IP \
  docker exec portal-db psql -U portal -d portal -c \
  "SELECT id, event_type, order_id, result FROM digistore_ipn_log
   WHERE event_type IN ('on_refund', 'on_chargeback') ORDER BY id DESC LIMIT 5;"

# Lizenz muss jetzt revoked sein
ssh -i ~/.ssh/codefabrik_deploy root@PORTAL_IP \
  docker exec portal-db psql -U portal -d portal -c \
  "SELECT license_key, status, revoked_at FROM licenses
   WHERE source = 'digistore' ORDER BY id DESC LIMIT 5;"
```

Erwartet: `status = 'revoked'`, `revoked_at` ist gesetzt.

## 8. Zugang nach Storno pruefen

```bash
# Gleicher Key wie in Schritt 6 — Token-Anfrage muss jetzt scheitern
curl -s -X POST "https://portal.detmers-publish.de/api/download-token" \
  -H "Content-Type: application/json" \
  -d '{"key":"LICENSE_KEY"}'
```

Erwartet: HTTP 403 `{"error":"Ungueltiger Lizenzkey"}`.

## 9. Idempotenz pruefen

Gleiche IPN-Notification nochmal senden (falls moeglich ueber Digistore24 "Retry").
DB-Zustand darf sich nicht aendern (ON CONFLICT verhindert Duplikate).

## Troubleshooting

| Problem | Pruefung |
|---------|----------|
| IPN kommt nicht an | DNS pruefen: `dig digistore.detmers-publish.de` → Portal-IP? |
| SSL-Fehler | Caddy-Logs: `docker logs portal-caddy` |
| Signatur ungueltig | DIGISTORE_IPN_PASSPHRASE pruefen (muss mit Digistore24-Einstellung uebereinstimmen) |
| Lizenz nicht angelegt | `docker logs portal-app` auf Fehler pruefen |
| DB-Verbindung | `docker exec portal-db pg_isready -U portal` |
