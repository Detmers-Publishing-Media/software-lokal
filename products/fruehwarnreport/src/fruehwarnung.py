#!/usr/bin/env python3
"""
fruehwarnung.py — Frühwarnreport Zinsbindungen
===============================================
Erstellt aus einer Vertrags-CSV einen internen Frühwarn- und
Prioritätenreport für auslaufende Zinsbindungen.

Lokale Verarbeitung — keine Internetverbindung — keine Empfehlung.
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

# ── Versionsinformation ──────────────────────────────────────────────────────

VERSION       = "1.0.0"
TOOL_NAME     = "Frühwarnreport Zinsbindungen"
TOOL_SUBTITLE = "Interner Statusreport zur Priorisierung"

# ── Warnstufen ───────────────────────────────────────────────────────────────

WARNSTUFEN = {
    "ÜBERFÄLLIG": {"farbe_css": "background:#8B0000;color:white",  "sortkey": 0},
    "KRITISCH":   {"farbe_css": "background:#dc3545;color:white",  "sortkey": 1},
    "WARNUNG":    {"farbe_css": "background:#fd7e14;color:white",  "sortkey": 2},
    "HINWEIS":    {"farbe_css": "background:#ffc107;color:#333",   "sortkey": 3},
    "OK":         {"farbe_css": "background:#28a745;color:white",  "sortkey": 4},
    "DATENFEHLER":{"farbe_css": "background:#adb5bd;color:#333",   "sortkey": 5},
}

WARNSTUFE_LABEL = {
    "ÜBERFÄLLIG": "ÜBERFÄLLIG",
    "KRITISCH":   "KRITISCH",
    "WARNUNG":    "WARNUNG",
    "HINWEIS":    "HINWEIS",
    "OK":         "OK",
    "DATENFEHLER":"DATENFEHLER",
}

# ── Standardkonfiguration ─────────────────────────────────────────────────────

DEFAULT_CONFIG = {
    "schwellenwerte": {
        "kritisch_tage": 90,
        "warnung_tage":  180,
        "hinweis_tage":  365,
    },
    "pflichtfelder":    ["kunden_nr", "kunden_name", "zinsbindungsende"],
    "datums_formate":   ["%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"],
}


# ══════════════════════════════════════════════════════════════════════════════
# Ausgabe-Funktionen
# ══════════════════════════════════════════════════════════════════════════════

def print_pitch():
    """Startbanner mit Pitch anzeigen."""
    trennlinie = "=" * 62
    print(f"""
{trennlinie}
  {TOOL_NAME}
  {TOOL_SUBTITLE}  |  Version {VERSION}
{trennlinie}

  WAS DIESES TOOL TUT
  -------------------
  Dieses Programm liest eine Vertrags-CSV mit Zinsbindungsdaten
  und erstellt daraus einen internen Frühwarn- und Prioritätenreport.

  Es berechnet automatisch:
    - Warnstufen je Vertrag (Überfällig / Kritisch / Warnung / Hinweis / OK)
    - Datenqualitätsprobleme (fehlende Felder, unplausible Datumsangaben)

  Ausgabe-Dateien:
    - fruehwarnung_output.csv   Gesamtliste mit Warnstufen
    - fehlerliste.csv           Datensätze mit Datenfehlern
    - report.html               Übersichtsbericht (im Browser öffnen)

  FÜR WEN IST DIESES TOOL?
  ------------------------
  Für Finanzierungsvermittler und Makler zur internen
  Gesprächsvorbereitung und Priorisierung von Kundenkontakten.
  Kein Endkundenprodukt.

  WAS DIESES TOOL NICHT TUT
  -------------------------
  - Keine Produktempfehlung
  - Keine Anlage- oder Finanzierungsberatung
  - Keine Internetverbindung / kein Daten-Upload
  - Keine KI-Verarbeitung zur Laufzeit

  DATENSCHUTZ
  -----------
  Alle Daten werden ausschließlich lokal auf Ihrem PC verarbeitet.
  Es erfolgt kein Upload und keine Übertragung an Dritte.

{trennlinie}
""")


def print_short_help():
    """Kurze deutschsprachige Anwenderhilfe anzeigen."""
    print("""
  SO VERWENDEN SIE DAS TOOL
  --------------------------

  Schritt 1: CSV-Datei vorbereiten
    Pflichtfelder: kunden_nr, kunden_name, zinsbindungsende
    Optionale Felder: vertrags_nr, darlehensbetrag, zinssatz, bankname, notizen
    Format: Semikolon- oder Komma-getrennt, UTF-8, erste Zeile = Spaltennamen

  Schritt 2: Tool starten
    EXE:    fruehwarnung.exe --input "C:\\Daten\\vertraege.csv" --outdir "C:\\Daten\\output"
    Python: python fruehwarnung.py  --input vertraege.csv  --outdir output

  Schritt 3: Ausgabedateien öffnen
    - fruehwarnung_output.csv  Gesamtliste mit Warnstufe und verbleibenden Tagen
    - fehlerliste.csv          Datensätze mit Datenqualitätsproblemen
    - report.html              Übersichtsbericht (Doppelklick zum Öffnen im Browser)

  Stichtag angeben (optional, Standard = heutiges Datum):
    --stichtag 2026-03-31

  Hinweis:
    Der Report dient ausschließlich der internen Gesprächsvorbereitung.
    Keine Empfehlung. Keine Beratung.
""")


def print_example():
    """Beispielaufruf anzeigen."""
    print("""
  BEISPIELAUFRUF
  --------------

  Windows EXE:
    fruehwarnung.exe --input "C:\\Daten\\vertraege.csv" --outdir "C:\\Daten\\output" --stichtag 2026-02-20

  Python:
    python fruehwarnung.py --input sample_data/vertraege_test.csv --outdir sample_output

  Mit eigener Konfigurationsdatei:
    fruehwarnung.exe --input vertraege.csv --outdir output --config config.json

  Demo-Start (Doppelklick):
    start_demo.bat

  ERWARTETE AUSGABEDATEIEN
  ------------------------
    fruehwarnung_output.csv   Alle Verträge mit Warnstufe, Tagen bis Ablauf, Datenhinweisen
    fehlerliste.csv           Datensätze mit fehlenden Pflichtfeldern oder Datumsfehlern
    report.html               Interaktiver Übersichtsbericht (im Browser öffnen)
""")


def print_completion_message(outdir: str, filepaths: dict):
    """Abschlussmeldung nach erfolgreicher Verarbeitung."""
    print()
    print("=" * 62)
    print("  Verarbeitung abgeschlossen.")
    print("=" * 62)
    print()
    print("  Ausgabedateien:")
    for name, path in filepaths.items():
        marker = "[OK]" if os.path.isfile(path) else "[!]"
        print(f"    {marker}  {path}")
    print()
    print("  Hinweis:")
    print("  Der HTML-Report ist ein interner Status- und")
    print("  Prioritätenreport zur Gesprächsvorbereitung.")
    print("  Keine Empfehlung. Lokale Verarbeitung.")
    print()
    print("  Öffnen Sie report.html im Browser zur Ansicht.")
    print()


# ══════════════════════════════════════════════════════════════════════════════
# Interaktiver Modus
# ══════════════════════════════════════════════════════════════════════════════

def interactive_mode():
    """Interaktiver Eingabemodus (startet bei Doppelklick / ohne Parameter)."""
    print_pitch()
    print_short_help()
    print("─" * 62)
    print("  INTERAKTIVER MODUS")
    print("  Bitte geben Sie die folgenden Angaben ein.")
    print("  (Enter = Standardwert übernehmen, Pfade ohne Anführungszeichen)")
    print("─" * 62)
    print()

    # ── Eingabe-CSV ──
    input_path = ""
    while not input_path:
        raw = input("  Pfad zur Eingabe-CSV: ").strip().strip('"').strip("'")
        if not raw:
            print("  Bitte geben Sie einen Dateipfad an.")
            continue
        if not os.path.isfile(raw):
            print(f"  Datei nicht gefunden: {raw}")
            print("  Bitte Pfad prüfen und erneut eingeben.")
            continue
        input_path = raw

    # ── Ausgabeordner ──
    today_str    = date.today().strftime("%Y-%m-%d")
    default_out  = os.path.join(os.path.dirname(os.path.abspath(input_path)), f"output_{today_str}")
    raw = input(f"  Ausgabeordner [{default_out}]: ").strip().strip('"').strip("'")
    outdir = raw if raw else default_out

    # ── Stichtag ──
    raw = input(f"  Stichtag (JJJJ-MM-TT) [{today_str}]: ").strip()
    stichtag_str = raw if raw else today_str

    # ── Config ──
    raw = input("  Konfigurationsdatei (leer = Standardwerte): ").strip().strip('"').strip("'")
    config_path = None
    if raw:
        if os.path.isfile(raw):
            config_path = raw
        else:
            print(f"  Konfigurationsdatei nicht gefunden: {raw}  =>  Standardwerte werden verwendet.")

    print()
    print("─" * 62)
    print("  Verarbeitung wird gestartet ...")
    print("─" * 62)

    run_processing(
        input_path=input_path,
        outdir=outdir,
        stichtag_str=stichtag_str,
        config_path=config_path,
    )

    print()
    input("  Drücken Sie Enter zum Beenden.")


# ══════════════════════════════════════════════════════════════════════════════
# Konfiguration
# ══════════════════════════════════════════════════════════════════════════════

def load_config(config_path=None) -> dict:
    """Lädt Konfiguration. Fällt auf Standardwerte zurück."""
    import copy
    config = copy.deepcopy(DEFAULT_CONFIG)
    if not config_path or not os.path.isfile(config_path):
        return config
    try:
        with open(config_path, encoding="utf-8") as f:
            user = json.load(f)
        if "schwellenwerte" in user:
            config["schwellenwerte"].update(user["schwellenwerte"])
        if "pflichtfelder" in user:
            config["pflichtfelder"] = user["pflichtfelder"]
        if "datums_formate" in user:
            config["datums_formate"] = user["datums_formate"]
    except (json.JSONDecodeError, IOError) as e:
        print(f"  Konfigurationsdatei konnte nicht gelesen werden: {e}")
        print("  Standardwerte werden verwendet.")
    return config


# ══════════════════════════════════════════════════════════════════════════════
# Datenverarbeitung
# ══════════════════════════════════════════════════════════════════════════════

def parse_date(value: str, formate: list):
    """Datum in verschiedenen Formaten parsen. Gibt (date|None, fehler|None) zurück."""
    if not value or not value.strip():
        return None, "Datum fehlt"
    v = value.strip()
    for fmt in formate:
        try:
            return datetime.strptime(v, fmt).date(), None
        except ValueError:
            continue
    return None, f"Datum nicht erkannt: {v!r}"


def validate_row(row: dict, pflichtfelder: list, datums_formate: list):
    """Prüft Datensatz auf Qualitätsprobleme. Gibt (zbe_datum, fehler_liste) zurück."""
    fehler = []

    # Pflichtfelder prüfen
    for feld in pflichtfelder:
        if not str(row.get(feld, "")).strip():
            fehler.append(f"Pflichtfeld fehlt: {feld!r}")

    # Zinsbindungsende parsen und prüfen
    zbe_raw   = str(row.get("zinsbindungsende", "")).strip()
    zbe_datum = None
    if zbe_raw:
        zbe_datum, parse_fehler = parse_date(zbe_raw, datums_formate)
        if parse_fehler:
            fehler.append(f"Zinsbindungsende: {parse_fehler}")
        elif zbe_datum:
            if zbe_datum.year < 1990:
                fehler.append(f"Zinsbindungsende unplausibel früh (Jahr {zbe_datum.year})")
            elif zbe_datum.year > 2100:
                fehler.append(f"Zinsbindungsende unplausibel spät (Jahr {zbe_datum.year})")

    # Darlehensbetrag (optional, aber wenn vorhanden: numerisch prüfen)
    betrag_raw = str(row.get("darlehensbetrag", "")).strip()
    if betrag_raw:
        betrag_clean = betrag_raw.replace(".", "").replace(",", ".")
        try:
            val = float(betrag_clean)
            if val < 0:
                fehler.append(f"Darlehensbetrag negativ: {betrag_raw!r}")
        except ValueError:
            fehler.append(f"Darlehensbetrag nicht numerisch: {betrag_raw!r}")

    return zbe_datum, fehler


def berechne_warnstufe(zbe_datum, stichtag: date, schwellenwerte: dict, hat_kritischen_fehler: bool):
    """Warnstufe und Tage bis Ablauf berechnen."""
    if hat_kritischen_fehler or zbe_datum is None:
        return "DATENFEHLER", None
    tage = (zbe_datum - stichtag).days
    if tage < 0:
        return "ÜBERFÄLLIG", tage
    elif tage <= schwellenwerte["kritisch_tage"]:
        return "KRITISCH", tage
    elif tage <= schwellenwerte["warnung_tage"]:
        return "WARNUNG", tage
    elif tage <= schwellenwerte["hinweis_tage"]:
        return "HINWEIS", tage
    else:
        return "OK", tage


def read_csv(path: str) -> list:
    """CSV einlesen. Erkennt Semikolon oder Komma als Trennzeichen automatisch."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        sample = f.read(8192)
    delimiter = ";" if sample.count(";") >= sample.count(",") else ","
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            normalized = {
                k.strip().lower().replace(" ", "_"): str(v).strip()
                for k, v in row.items()
                if k is not None
            }
            rows.append(normalized)
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# Ausgabe-Dateien
# ══════════════════════════════════════════════════════════════════════════════

def write_output_csv(rows_out: list, path: str):
    """Ausgabe-CSV mit Warnstufen schreiben."""
    if not rows_out:
        return
    fieldnames = list(rows_out[0].keys())
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        writer.writerows(rows_out)


def write_error_csv(errors: list, path: str):
    """Fehlerliste-CSV schreiben."""
    fields = ["zeile", "kunden_nr", "kunden_name", "vertrags_nr", "fehler"]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter=";")
        writer.writeheader()
        if errors:
            writer.writerows(errors)


def write_html_report(rows_out: list, errors: list, path: str, stichtag: date):
    """HTML-Übersichtsbericht erstellen."""

    erzeugt_am   = datetime.now().strftime("%d.%m.%Y %H:%M")
    stichtag_fmt = stichtag.strftime("%d.%m.%Y")
    total        = len(rows_out)

    # Statistik
    stats = {ws: sum(1 for r in rows_out if r.get("warnstufe") == ws) for ws in WARNSTUFEN}

    # Tabelle sortiert nach Dringlichkeit
    sort_order  = {ws: info["sortkey"] for ws, info in WARNSTUFEN.items()}
    rows_sorted = sorted(rows_out, key=lambda r: sort_order.get(r.get("warnstufe", "OK"), 9))

    def fmt_tage(val):
        if val is None or val == "":
            return "—"
        try:
            t = int(val)
            if t < 0:
                return f"{abs(t)}&nbsp;Tage&nbsp;überfällig"
            elif t == 0:
                return "heute"
            return f"in&nbsp;{t}&nbsp;Tagen"
        except (ValueError, TypeError):
            return str(val)

    def fmt_betrag(val):
        if not val:
            return ""
        try:
            f = float(str(val).replace(".", "").replace(",", "."))
            s = f"{f:,.0f}".replace(",", ".")
            return f"{s}&nbsp;€"
        except (ValueError, TypeError):
            return val

    def row_html(r):
        ws    = r.get("warnstufe", "")
        css   = WARNSTUFEN.get(ws, {}).get("farbe_css", "")
        label = WARNSTUFE_LABEL.get(ws, ws)
        return (
            f"<tr>"
            f"<td>{r.get('kunden_nr','')}</td>"
            f"<td>{r.get('kunden_name','')}</td>"
            f"<td>{r.get('vertrags_nr','')}</td>"
            f"<td>{r.get('zinsbindungsende','')}</td>"
            f"<td>{fmt_tage(r.get('tage_bis_ende',''))}</td>"
            f"<td>{fmt_betrag(r.get('darlehensbetrag',''))}</td>"
            f"<td>{r.get('zinssatz','')}</td>"
            f"<td>{r.get('bankname','')}</td>"
            f"<td><span style='padding:2px 8px;border-radius:4px;font-size:.82em;"
            f"font-weight:bold;white-space:nowrap;{css}'>{label}</span></td>"
            f"<td style='font-size:.8em;color:#666'>{r.get('dq_hinweis','')}</td>"
            f"</tr>"
        )

    def err_html(e):
        return (
            f"<tr>"
            f"<td>{e.get('zeile','')}</td>"
            f"<td>{e.get('kunden_nr','')}</td>"
            f"<td>{e.get('kunden_name','')}</td>"
            f"<td>{e.get('vertrags_nr','')}</td>"
            f"<td style='color:#c0392b'>{e.get('fehler','')}</td>"
            f"</tr>"
        )

    table_rows = "\n".join(row_html(r) for r in rows_sorted)
    err_rows   = (
        "\n".join(err_html(e) for e in errors)
        if errors
        else "<tr><td colspan='5' style='color:#28a745;padding:12px'>&#10003; Keine Datenfehler gefunden</td></tr>"
    )

    stat_html = ""
    for ws in WARNSTUFEN:
        count = stats.get(ws, 0)
        if count == 0:
            continue
        css   = WARNSTUFEN[ws]["farbe_css"]
        label = WARNSTUFE_LABEL[ws]
        stat_html += (
            f"<span style='display:inline-block;margin:3px 6px 3px 0;"
            f"padding:5px 14px;border-radius:5px;{css};"
            f"font-weight:bold;font-size:.9em'>{label}: {count}</span>"
        )

    html = f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Frühwarnreport Zinsbindungen</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
          background:#f4f4f8;color:#333;font-size:14px}}
    .hdr{{background:#1a1a2e;color:#fff;padding:14px 24px}}
    .hdr h1{{font-size:1.2em;margin-bottom:3px}}
    .hdr .meta{{font-size:.82em;color:#a0a0b8}}
    .hinweis{{background:#fff8e1;border-left:4px solid #ffc107;
              padding:10px 16px;margin:14px 24px;font-size:.88em;line-height:1.5}}
    .hinweis strong{{color:#333}}
    .wrap{{padding:0 24px 32px}}
    .box{{background:#fff;border-radius:6px;padding:14px 16px;
          margin:14px 0;box-shadow:0 1px 3px rgba(0,0,0,.09)}}
    .box-title{{font-size:.82em;font-weight:600;color:#666;
                text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}}
    table{{width:100%;border-collapse:collapse;background:#fff;
           border-radius:6px;overflow:hidden;
           box-shadow:0 1px 3px rgba(0,0,0,.09);margin:6px 0 14px}}
    th{{background:#1a1a2e;color:#fff;padding:9px 8px;
        text-align:left;font-size:.8em;white-space:nowrap}}
    td{{padding:7px 8px;border-bottom:1px solid #eef;vertical-align:top}}
    tr:hover td{{background:#f8f9fc}}
    .sec{{font-size:.9em;font-weight:600;color:#333;margin:18px 0 6px}}
    .foot{{font-size:.78em;color:#aaa;text-align:center;
           padding:14px;margin-top:12px;border-top:1px solid #eee}}
  </style>
</head>
<body>
  <div class="hdr">
    <h1>Frühwarnreport Zinsbindungen &mdash; Interner Statusreport</h1>
    <div class="meta">
      Stichtag: {stichtag_fmt} &nbsp;&middot;&nbsp;
      Erzeugt: {erzeugt_am} &nbsp;&middot;&nbsp;
      Datensätze: {total}
    </div>
  </div>

  <div class="hinweis">
    <strong>Interner Statusreport zur Frühwarnung und Priorisierung</strong><br>
    Lokale Verarbeitung &mdash; keine Internetverbindung &mdash;
    <strong>keine Empfehlung</strong>.<br>
    Dieser Report dient ausschließlich der internen Gesprächsvorbereitung und Priorisierung.
  </div>

  <div class="wrap">

    <div class="box">
      <div class="box-title">Zusammenfassung nach Warnstufe</div>
      {stat_html}
    </div>

    <div class="sec">Alle Verträge (sortiert nach Dringlichkeit)</div>
    <table>
      <thead>
        <tr>
          <th>Kunden-Nr.</th><th>Kundenname</th><th>Vertrags-Nr.</th>
          <th>Zinsbindungsende</th><th>Verbleibend</th>
          <th>Darlehensbetrag</th><th>Zinssatz</th><th>Bank</th>
          <th>Warnstufe</th><th>Datenhinweis</th>
        </tr>
      </thead>
      <tbody>
        {table_rows}
      </tbody>
    </table>

    <div class="sec">Datenqualitätsprobleme</div>
    <table>
      <thead>
        <tr>
          <th>Zeile</th><th>Kunden-Nr.</th><th>Kundenname</th>
          <th>Vertrags-Nr.</th><th>Problem</th>
        </tr>
      </thead>
      <tbody>
        {err_rows}
      </tbody>
    </table>

  </div>

  <div class="foot">
    {TOOL_NAME} v{VERSION} &mdash; Interner Statusreport &mdash;
    Lokale Verarbeitung &mdash; Keine Empfehlung
  </div>
</body>
</html>"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)


# ══════════════════════════════════════════════════════════════════════════════
# Haupt-Verarbeitungslogik
# ══════════════════════════════════════════════════════════════════════════════

def run_processing(input_path: str, outdir: str, stichtag_str: str, config_path=None):
    """Vollständige Verarbeitung: Einlesen → Prüfen → Berechnen → Ausgabe."""

    # Stichtag parsen
    stichtag = None
    for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"]:
        try:
            stichtag = datetime.strptime(stichtag_str, fmt).date()
            break
        except ValueError:
            continue
    if stichtag is None:
        print(f"  Stichtag ungültig: {stichtag_str!r}")
        print("  Erwartet: YYYY-MM-DD oder TT.MM.JJJJ")
        sys.exit(1)

    config        = load_config(config_path)
    schwellenwerte = config["schwellenwerte"]
    pflichtfelder  = config["pflichtfelder"]
    datums_formate = config["datums_formate"]

    os.makedirs(outdir, exist_ok=True)

    print(f"  Eingabe:  {input_path}")
    print(f"  Ausgabe:  {outdir}")
    print(f"  Stichtag: {stichtag.strftime('%d.%m.%Y')}")
    print()

    try:
        rows = read_csv(input_path)
    except (IOError, csv.Error) as e:
        print(f"  CSV konnte nicht gelesen werden: {e}")
        sys.exit(1)

    print(f"  {len(rows)} Datensatz/Datensätze geladen.")
    print()

    rows_out = []
    errors   = []

    for i, row in enumerate(rows, start=2):   # Zeile 2 = erste Datenzeile (1 = Header)
        zbe_datum, fehler = validate_row(row, pflichtfelder, datums_formate)

        # Kritische Fehler (blockieren Warnstufen-Berechnung)
        kritisch = [f for f in fehler
                    if "Pflichtfeld" in f or "Zinsbindungsende" in f or "unplausibel" in f]

        warnstufe, tage = berechne_warnstufe(zbe_datum, stichtag, schwellenwerte, bool(kritisch))

        row_out = dict(row)
        row_out["warnstufe"]    = warnstufe
        row_out["tage_bis_ende"] = str(tage) if tage is not None else ""
        row_out["dq_hinweis"]   = "; ".join(fehler) if fehler else ""
        rows_out.append(row_out)

        if kritisch:
            errors.append({
                "zeile":       i,
                "kunden_nr":   row.get("kunden_nr", ""),
                "kunden_name": row.get("kunden_name", ""),
                "vertrags_nr": row.get("vertrags_nr", ""),
                "fehler":      "; ".join(kritisch),
            })

    # Ausgabepfade
    out_csv  = os.path.join(outdir, "fruehwarnung_output.csv")
    err_csv  = os.path.join(outdir, "fehlerliste.csv")
    out_html = os.path.join(outdir, "report.html")

    write_output_csv(rows_out, out_csv)
    write_error_csv(errors,    err_csv)
    write_html_report(rows_out, errors, out_html, stichtag)

    # Konsolen-Statistik
    print("  Ergebnis:")
    for ws in WARNSTUFEN:
        count = sum(1 for r in rows_out if r.get("warnstufe") == ws)
        if count > 0:
            print(f"    {ws:<15s}: {count}")

    print_completion_message(outdir, {
        "fruehwarnung_output.csv": out_csv,
        "fehlerliste.csv":         err_csv,
        "report.html":             out_html,
    })


# ══════════════════════════════════════════════════════════════════════════════
# CLI-Einstiegspunkt
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        prog="fruehwarnung",
        description="Frühwarnreport Zinsbindungen — Interner Statusreport",
        add_help=True,
    )
    parser.add_argument("--input",
                        help="Pfad zur Eingabe-CSV")
    parser.add_argument("--outdir",
                        help="Pfad zum Ausgabeordner")
    parser.add_argument("--stichtag",
                        default=date.today().strftime("%Y-%m-%d"),
                        help="Stichtag (YYYY-MM-DD oder TT.MM.JJJJ). Standard: heute")
    parser.add_argument("--config",
                        help="Pfad zur Konfigurationsdatei (JSON, optional)")
    parser.add_argument("--pitch",
                        action="store_true",
                        help="Pitch und Kurzanleitung anzeigen, dann beenden")
    parser.add_argument("--hilfe-kurz",
                        dest="hilfe_kurz",
                        action="store_true",
                        help="Deutschsprachige Anwenderhilfe anzeigen, dann beenden")
    parser.add_argument("--beispiel",
                        action="store_true",
                        help="Beispielaufruf und Ausgabedateien anzeigen, dann beenden")

    args = parser.parse_args()

    if args.pitch:
        print_pitch()
        sys.exit(0)

    if args.hilfe_kurz:
        print_pitch()
        print_short_help()
        sys.exit(0)

    if args.beispiel:
        print_example()
        sys.exit(0)

    # Kein --input und kein --outdir → Interaktiver Modus
    if not args.input and not args.outdir:
        interactive_mode()
        return

    # CLI-Modus: Pflichtparameter prüfen
    if not args.input:
        parser.error("--input ist erforderlich (Pfad zur CSV-Datei).")
    if not args.outdir:
        parser.error("--outdir ist erforderlich (Ausgabeordner).")
    if not os.path.isfile(args.input):
        print(f"  Eingabedatei nicht gefunden: {args.input}")
        sys.exit(1)

    print_pitch()
    run_processing(
        input_path=args.input,
        outdir=args.outdir,
        stichtag_str=args.stichtag,
        config_path=args.config,
    )


if __name__ == "__main__":
    main()
