# MitgliederSimple — Release-Historie

Stand: 2026-03-04

---

## Releases

| Version | Name | Beschreibung | Status |
|---------|------|-------------|--------|
| v0.1.0 | Basis | CRUD Mitglieder + CSV-Export, Beitragsklassen, PDF-Listen | Done |
| v0.2.0 | DSGVO | DSGVO-Einwilligungen (4 Kategorien mit Datum), Vereinsprofil, Telefonliste/Geburtstagsliste/Jubilarliste | Done |
| v0.3.0 | Protokoll | Event-Log mit HMAC-SHA256 Hash-Kette, Schema-Versionierung, 7 Testkategorien (74 Tests) | Done |
| v0.4.0 | Beitrag | Beitragsverwaltung: Zahlungserfassung, Jahresuebersicht (Soll/Ist), Mahnbriefe (3 Stufen), Beitragsuebersicht PDF | Done |
| v0.5.0 | Tresor | SQLCipher-Verschluesselung, OS-Keystore, automatisches Backup | Geplant |

---

## Funktionsuebersicht (v0.4)

### Mitgliederverwaltung
- Mitglieder anlegen, bearbeiten, loeschen
- Automatische Mitgliedsnummern (fortlaufend ab 1001)
- Status: aktiv, passiv, ausgetreten, verstorben
- Beitragsklassen: Vollmitglied, Ermaessigt, Ehrenmitglied, Foerdermitglied + benutzerdefiniert

### DSGVO
- 4 Einwilligungskategorien: Telefon, E-Mail, Foto intern, Foto oeffentlich
- Einwilligungsdatum wird gespeichert
- Visuelle Badges in Detailansicht

### Beitragsverwaltung (v0.4)
- Jahresuebersicht: Soll/Ist-Vergleich pro Mitglied
- Zahlungserfassung: Betrag, Datum, Zahlungsart (Bar/Ueberweisung)
- Teilzahlungen moeglich
- Status-Badges: bezahlt (gruen), teilweise (gelb), offen (rot), befreit (grau)
- Zahlungshistorie pro Mitglied

### Export & Druck
- CSV-Export (Semikolon, UTF-8 BOM, Excel-kompatibel)
- PDF-Listen: Mitgliederliste, Telefonliste, Geburtstagsliste, Jubilarliste
- PDF Beitragsuebersicht mit Summenzeile
- PDF Mahnbriefe (3 Stufen: Erinnerung, 1. Mahnung, Letzte Aufforderung)

### Integritaet (v0.3)
- Event-Log: Jede Schreiboperation erzeugt ein Event
- HMAC-SHA256 Hash-Kette (append-only, manipulationssicher)
- Schema-Versionierung mit automatischer Migration
- Fixtures fuer jede Version (v0.1, v0.2, v0.3, v0.4)

### Einstellungen
- Vereinsprofil (Name, Adresse, Bankverbindung, Logo)
- Beitragsklassen verwalten
- Probe-Version: 30 Mitglieder kostenlos

---

## Tech-Stack

- **Frontend:** Svelte 5
- **Backend:** Tauri v2 (Rust)
- **Datenbank:** SQLite (ab v0.5: SQLCipher)
- **PDF:** pdfMake
- **Tests:** Node.js native test module + better-sqlite3
