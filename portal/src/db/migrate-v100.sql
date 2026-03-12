-- Migration v0.10.0: Add Nachweis Lokal product + product texts
--
-- Changes:
-- 1. New product: nachweis-lokal (Pruefprotokolle und Nachweise)
-- 2. Product texts: description, benefits, features, faq, installation

INSERT INTO products (id, name, description, price_cents, status, forgejo_repo, created_at, updated_at)
VALUES (
  'nachweis-lokal',
  'Nachweis Lokal',
  'Pruefprotokolle dokumentieren, Nachweise erzeugen, Historie nachvollziehen',
  3900,
  'active',
  'factory-admin/nachweis-lokal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Description (long)
INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
VALUES (
  'nachweis-lokal', 'description',
  '["Nachweis Lokal dokumentiert wiederkehrende Pruefungen und Kontrollen lokal auf Ihrem Rechner. Vorlagen definieren, Pruefungen durchfuehren, Ergebnisse protokollieren, PDF-Nachweise erzeugen.", "Keine Cloud, keine monatlichen Kosten, revisionssicher durch Hash-Kette.", "Fuer alle Organisationen mit Dokumentationspflichten: Geraetepruefungen, Sicherheitsunterweisungen, Wartungsprotokolle, Spielplatzkontrollen, Brandschutz-Checks."]',
  'de', '0.1.0', NOW(), NOW()
) ON CONFLICT ON CONSTRAINT uq_product_text DO UPDATE SET content = EXCLUDED.content, version = EXCLUDED.version, updated_at = NOW();

-- Benefits
INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
VALUES (
  'nachweis-lokal', 'benefits',
  '["Alle Daten lokal — keine Cloud", "Pruefvorlagen mit beliebig vielen Pruefpunkten", "Interaktive Pruefungsdurchfuehrung (OK / Maengel / N/A)", "Objekt-/Gegenstandsverwaltung mit Pruefhistorie", "PDF-Pruefprotokolle und Maengelberichte", "Faelligkeits-Dashboard mit Ampellogik", "CSV-Import/Export fuer Vorlagen und Pruefungen", "Revisionssicheres Aenderungsprotokoll (HMAC-SHA256 Hash-Kette)", "Integritaetspruefung im Dashboard sichtbar", "Laeuft auf Windows und Linux"]',
  'de', '0.1.0', NOW(), NOW()
) ON CONFLICT ON CONSTRAINT uq_product_text DO UPDATE SET content = EXCLUDED.content, version = EXCLUDED.version, updated_at = NOW();

-- Features
INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
VALUES (
  'nachweis-lokal', 'features',
  '[{"name":"Pruefvorlagen verwalten","description":"Vorlagen mit beliebig vielen Pruefpunkten anlegen, bearbeiten, deaktivieren","status":"done"},{"name":"Pruefpunkte","description":"Pruefpunkte je Vorlage mit Reihenfolge, Hinweisen und Pflicht-Kennzeichnung","status":"done"},{"name":"Objektverwaltung","description":"Geraete, Raeume, Anlagen mit Standort, Kategorie und Kennung verwalten","status":"done"},{"name":"Pruefhistorie je Objekt","description":"Chronologische Uebersicht aller Pruefungen pro Objekt","status":"done"},{"name":"Pruefungen verwalten","description":"Pruefungen anlegen, einer Vorlage und optional einem Objekt zuordnen","status":"done"},{"name":"Pruefung durchfuehren","description":"Interaktive Checkliste: OK, Maengel oder N/A je Pruefpunkt, Zwischenspeichern moeglich","status":"done"},{"name":"Status-Workflow","description":"Offen → Bestanden/Bemaengelt/Abgebrochen mit automatischer Erkennung","status":"done"},{"name":"Dashboard","description":"Statistiken und Faelligkeitsuebersicht","status":"done"},{"name":"Fristen-Tracker","description":"Automatische Faelligkeitsberechnung mit Ampellogik","status":"done"},{"name":"PDF-Pruefprotokoll","description":"Einzelprotokoll mit Briefkopf, Metadaten und allen Ergebnissen","status":"done"},{"name":"PDF-Maengelbericht","description":"Separates Dokument nur fuer beanstandete Pruefpunkte","status":"done"},{"name":"PDF-Pruefungsliste","description":"Gesamtliste aller Pruefungen als druckfertige PDF","status":"done"},{"name":"CSV-Export","description":"Pruefungen als CSV exportieren (Semikolon, UTF-8 BOM, Excel-kompatibel)","status":"done"},{"name":"CSV-Import Vorlagen","description":"Vorlagen aus Excel/CSV importieren inkl. Pruefpunkte","status":"done"},{"name":"Event-Log","description":"Lueckenloses Aenderungsprotokoll mit HMAC-SHA256 Hash-Kette","status":"done"},{"name":"Integritaetspruefung","description":"Sichtbare Hash-Ketten-Verifikation im UI","status":"done"},{"name":"Organisationsprofil","description":"Name, Adresse und Verantwortliche fuer Briefkopf auf PDFs","status":"done"},{"name":"Lizenz-Verwaltung","description":"Support-Key eingeben, Status pruefen, entfernen","status":"done"},{"name":"Probe-Limit","description":"Maximal 10 aktive Vorlagen ohne Lizenzschluessel","status":"done"},{"name":"Support-Integration","description":"Supportvertrag verwalten, Tickets einreichen, Diagnose-Bundle","status":"done"}]',
  'de', '0.1.0', NOW(), NOW()
) ON CONFLICT ON CONSTRAINT uq_product_text DO UPDATE SET content = EXCLUDED.content, version = EXCLUDED.version, updated_at = NOW();

-- FAQ
INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
VALUES (
  'nachweis-lokal', 'faq',
  '[{"question":"Brauche ich den Servicepaket-Key, um die Software zu nutzen?","answer":"Nein. Die Software ist Open Source (GPL 3.0) und funktioniert komplett ohne Key. Das Servicepaket bietet Ihnen Bequemlichkeit: fertige Installer, Updates, Vorlagen-Pakete und bei echten Problemen technische Hilfe."},{"question":"Was enthaelt das Servicepaket genau?","answer":"Fertige Installationsdateien, Zugang zum Download-Portal, Update-Benachrichtigungen, branchenspezifische Vorlagen-Pakete und ein Ticketsystem fuer technische Probleme. Kein Telefon-Support, keine Schulung, keine individuelle Einrichtung."},{"question":"Wo werden meine Daten gespeichert?","answer":"Lokal auf Ihrem Computer in einer SQLite-Datenbank. Keine Cloud, kein Tracking, kein Account."},{"question":"Was bedeutet die HMAC-SHA256 Hash-Kette?","answer":"Jeder Eintrag im Aenderungsprotokoll ist kryptographisch mit dem vorherigen verkettet. Nachtraegliche Manipulation wird automatisch erkannt."},{"question":"Fuer welche Pruefungen eignet sich das Tool?","answer":"Fuer alle wiederkehrenden Pruefungen: Geraetepruefungen, Sicherheitsunterweisungen, Wartungsprotokolle, Spielplatzkontrollen, Brandschutz-Checks und aehnliche Dokumentationspflichten."},{"question":"Gibt es Telefon-Support?","answer":"Nein. Die Software ist so gebaut, dass Probleme ueber Selbstdiagnose, Fehlermeldungen und die eingebaute Integritaetspruefung geloest werden. Bei echten Blockern hilft das Ticketsystem (Antwort innerhalb 48h)."}]',
  'de', '0.1.0', NOW(), NOW()
) ON CONFLICT ON CONSTRAINT uq_product_text DO UPDATE SET content = EXCLUDED.content, version = EXCLUDED.version, updated_at = NOW();

-- Installation
INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
VALUES (
  'nachweis-lokal', 'installation',
  '{"prerequisites":["Windows 10+ oder Linux (Ubuntu 22.04+)","100 MB freier Festplattenspeicher"],"steps":["Laden Sie die aktuelle Version herunter","Fuehren Sie die Installationsdatei aus","Starten Sie die Anwendung — keine Konfiguration noetig"],"notes":"Die App speichert Daten im Home-Verzeichnis."}',
  'de', '0.1.0', NOW(), NOW()
) ON CONFLICT ON CONSTRAINT uq_product_text DO UPDATE SET content = EXCLUDED.content, version = EXCLUDED.version, updated_at = NOW();
