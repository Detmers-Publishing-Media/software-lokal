# Mehrbenutzerbetrieb — Konzept

Stand: 2026-03-05
Status: Fruehe Konzeptphase (v2.0+)

---

## Kontext

MitgliederSimple ist aktuell eine lokale Single-User-App (Tauri + SQLite).
Vereine haben typischerweise 3-5 Vorstandsmitglieder die Mitgliederdaten pflegen.
Ziel: Mehrere Anwender koennen dieselbe Vereinsdatenbank bearbeiten.

---

## Architektur-Entscheidung: Sync statt Zentralserver

Jeder User behaelt eine lokale SQLite-DB. Aenderungen werden ueber einen
Sync-Server (PostgreSQL) zwischen den Instanzen ausgetauscht.

```
User A (Laptop)          Sync-Server           User B (Desktop)
  SQLite               ←→  PostgreSQL  ←→       SQLite
  Tauri-App (offline)      (Cloud)             Tauri-App (offline)
```

### Vorteile

- Desktop-App bleibt bestehen (Tauri + Svelte)
- Funktioniert offline — sync wenn online
- Event-Log (bereits vorhanden) dient als Sync-Basis
- Kein Web-UI noetig (aber moeglich als Ergaenzung)

### Alternativen (verworfen)

- **Zentraler Server + API**: Zu hoher Aufwand, Offline-Verlust
- **Shared SQLite via Cloud-Ordner**: Gleichzeitiges Schreiben zerstoert DB
- **Volle CRDTs (cr-sqlite)**: Overengineered fuer 3-5 User im Verein

---

## Konfliktloesung

### Feld-Level-Merge (Standardfall)

Verschiedene Felder am gleichen Datensatz → kein Konflikt:

```
User A: Aendert TELEFON von Mitglied 42
User B: Aendert EMAIL von Mitglied 42
→ Beide Aenderungen uebernommen, kein Konflikt
```

### Echter Konflikt (gleiches Feld, gleiches Mitglied)

Erkennbar am Event-Log — zwei Events mit gleichem `old`-Wert:

```
Event 47: {user: "Maria",  member: 42, field: "phone",
           old: "0171-111", new: "0171-222", t: 10:00}
Event 48: {user: "Thomas", member: 42, field: "phone",
           old: "0171-111", new: "0171-333", t: 10:05}
```

Gleiches `old` + verschiedenes `new` → verzweigte Aenderung → Konflikt-Dialog:

```
Konflikt bei Mitglied Mueller, Telefon:
  Maria sagt:  0171-222 (geaendert 10:00)
  Thomas sagt: 0171-333 (geaendert 10:05)
  [Maria uebernehmen] [Thomas uebernehmen]
```

### Kein Datenverlust

Beide Versionen bleiben im Event-Log. Die Hash-Kette (HMAC) sichert ab,
dass niemand Events nachtraeglich manipuliert — wichtig bei verteiltem Sync.

---

## Benutzeridentifikation

### Minimaler Ansatz: Lokaler Anzeigename

Kein Login-System, kein Passwort. Beim ersten App-Start:

```
"Wie heissen Sie? [Name fuer Aenderungsprotokoll]"
→ Speichert "Maria Schmidt" lokal in app_settings
→ Jedes Event bekommt: user: "Maria Schmidt"
```

Aenderbar ueber Einstellungen. Kein Server-Account noetig.

### DSGVO: Einmaliger Hinweis

Beim ersten Start, nach Namenseingabe:

```
"Ihr Name wird im Aenderungsprotokoll gespeichert und ist
fuer andere Nutzer dieser Vereinsdatenbank sichtbar."
[Einverstanden]
```

Rechtsgrundlage: **Berechtigtes Interesse** (Art. 6 Abs. 1 lit. f DSGVO).
Der Verein muss nachvollziehen koennen wer Daten geaendert hat.
Keine formelle Einwilligung (Art. 7) noetig, solange der Name nur fuer
das Aenderungsprotokoll verwendet wird.

Zustimmung wird in `app_settings` gespeichert (Timestamp + Version).

---

## DSGVO-Funktionen im Tool

### Auskunftspflicht (Art. 15 DSGVO)

Jedes Vereinsmitglied hat das Recht zu erfahren, welche Daten ueber es
gespeichert sind. Das Tool braucht eine **Datenauskunft-Funktion**.

#### Funktion: "Gespeicherte Daten anzeigen / exportieren"

Erreichbar ueber: Mitglied-Detailansicht → "Datenauskunft (DSGVO)"

Erzeugt einen Bericht (PDF oder Bildschirm) mit:

1. **Stammdaten** — Alle gespeicherten Felder des Mitglieds
   (Name, Adresse, Telefon, E-Mail, Geburtsdatum, Eintrittsdatum etc.)
2. **Aenderungsprotokoll** — Alle Events die dieses Mitglied betreffen
   (wer hat wann was geaendert)
3. **Beitraege** — Beitragsverlauf (ab v0.4)
4. **Verarbeitungszweck** — Standardtext: "Mitgliederverwaltung gemaess
   Vereinssatzung, Beitragsverwaltung, Kommunikation"
5. **Speicherdauer** — "Bis [Austritt + gesetzliche Aufbewahrungsfrist]
   oder auf Verlangen des Mitglieds"
6. **Empfaenger** — "Keine Weitergabe an Dritte" (oder Liste falls doch)

#### Export-Format

- **PDF** — fuer Aushaendigung an das Mitglied (bevorzugt)
- **JSON** — maschinenlesbar (Art. 20 DSGVO, Recht auf Datenportabilitaet)

### Recht auf Loeschung (Art. 17 DSGVO)

Mitglied verlangt Loeschung → Tool muss Daten loeschen koennen.

**Aber:** Steuerrechtliche Aufbewahrungspflichten (6-10 Jahre) fuer
Beitragsdaten. Loesung:

1. **Personenbezogene Daten loeschen** (Name, Adresse, Kontakt)
2. **Beitragsdaten anonymisieren** (Name → "Geloeschtes Mitglied #42")
3. **Event-Log**: Events bleiben (Hash-Kette), aber personenbezogene
   Felder werden redacted: `name: "[GELOESCHT]"`

### Recht auf Berichtigung (Art. 16 DSGVO)

Bereits durch normale Bearbeitungsfunktion abgedeckt.
Event-Log dokumentiert die Korrektur automatisch.

### Datenportabilitaet (Art. 20 DSGVO)

JSON-Export aller Daten eines Mitglieds (siehe Auskunftsfunktion).
Ermoeglicht Umzug zu anderem Vereinstool.

---

## Uebersicht: DSGVO-Funktionen

| DSGVO-Recht | Artikel | Funktion im Tool | Prioritaet |
|-------------|---------|------------------|------------|
| Auskunft | Art. 15 | "Datenauskunft" Button → PDF/JSON | Hoch (vor v1.0) |
| Loeschung | Art. 17 | "Mitglied loeschen" mit Anonymisierung | Hoch (vor v1.0) |
| Berichtigung | Art. 16 | Normale Bearbeitung (existiert) | Erledigt |
| Datenportabilitaet | Art. 20 | JSON-Export pro Mitglied | Mittel |
| Einschraenkung | Art. 18 | "Mitglied sperren" (Daten behalten, nicht nutzen) | Niedrig |

---

## Mandantentrennung auf dem Sync-Server (RLS)

Wenn mehrere Vereine denselben Sync-Server nutzen, muss sichergestellt sein
dass Verein A nur seine eigenen Daten sieht.

**Row Level Security (PostgreSQL):**

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY verein_isolation ON members
  FOR ALL
  USING (verein_id = current_setting('app.verein_id')::int);
```

Selbst bei einem Bug im Sync-Code kann Verein A nicht auf Daten von
Verein B zugreifen — die Datenbank erzwingt die Trennung.

---

## Arbeitspakete (grobe Schaetzung)

### Sofort (vor v1.0, auch ohne Mehrbenutzerbetrieb)

- **DSGVO-Auskunft**: PDF-Export pro Mitglied (Art. 15)
- **DSGVO-Loeschung**: Anonymisierung mit Aufbewahrungsfrist (Art. 17)

### Spaeter (v2.0+, Mehrbenutzerbetrieb)

1. Benutzeridentifikation (lokaler Anzeigename + DSGVO-Hinweis)
2. Event-Log um `user`-Feld erweitern
3. Sync-Server aufsetzen (PostgreSQL + API)
4. Sync-Protokoll (Event-Austausch zwischen Instanzen)
5. Feld-Level-Merge + Konflikt-Dialog
6. RLS auf Sync-Server (Mandantentrennung)
7. Online/Offline-UX (Sync-Status, Konflikte anzeigen)

---

## Offene Fragen

1. Sync-Server: Eigener Server pro Verein, oder Multi-Tenant (ein Server fuer alle)?
2. Auth fuer Sync: Lizenzkey als Identifikation, oder separates Login?
3. Aufbewahrungsfristen: 6 oder 10 Jahre fuer Beitragsdaten? (Steuerberater fragen)
4. Event-Log Redaction: Wie Hash-Kette beibehalten wenn Felder redacted werden?
   (Loesung: Redaction als eigenes Event, Original-Hash bleibt verifizierbar)
