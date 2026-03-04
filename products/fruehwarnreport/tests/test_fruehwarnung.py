#!/usr/bin/env python3
"""
test_fruehwarnung.py -- Unittest-Suite fuer fruehwarnung.py
===========================================================
Testfaelle TC-01 bis TC-20

Stichtag fuer alle Tests: STICHTAG-Konstante (Zeile ~21).
Alle abgeleiteten Daten werden relativ zu STICHTAG berechnet (timedelta),
damit ein Wechsel des Stichtags konsistent in alle Tests propagiert.
Schwellenwerte (Standard): KRITISCH <= 90d, WARNUNG <= 180d, HINWEIS <= 365d
"""

import sys
import os
import unittest
import tempfile
from datetime import date, timedelta

# fruehwarnung.py aus src/ importieren
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
import fruehwarnung as fw

STICHTAG    = date(2026, 3, 10)
DEFAULT_SW  = fw.DEFAULT_CONFIG["schwellenwerte"]
DEFAULT_FMT = fw.DEFAULT_CONFIG["datums_formate"]
DEFAULT_PF  = fw.DEFAULT_CONFIG["pflichtfelder"]
SAMPLE_CSV  = os.path.join(os.path.dirname(__file__), "..", "sample_data", "vertraege_test.csv")
SAMPLE_CFG  = os.path.join(os.path.dirname(__file__), "..", "sample_data", "config.json")


# ==============================================================================
# TC-07, TC-08, TC-09, TC-10: Datums-Parsing
# ==============================================================================

class TestParseDatum(unittest.TestCase):

    def test_tc07_format_de(self):
        """TC-07: Format DD.MM.YYYY wird korrekt geparst"""
        d, err = fw.parse_date("31.12.2025", DEFAULT_FMT)
        self.assertEqual(d, date(2025, 12, 31))
        self.assertIsNone(err)

    def test_tc08_format_iso(self):
        """TC-08: Format YYYY-MM-DD wird korrekt geparst"""
        d, err = fw.parse_date("2025-12-31", DEFAULT_FMT)
        self.assertEqual(d, date(2025, 12, 31))
        self.assertIsNone(err)

    def test_tc09_datum_leer(self):
        """TC-09: Leeres Datum ergibt Fehler"""
        d, err = fw.parse_date("", DEFAULT_FMT)
        self.assertIsNone(d)
        self.assertIsNotNone(err)

    def test_tc10_nicht_bekannt(self):
        """TC-10: 'nicht bekannt' ergibt Fehler"""
        d, err = fw.parse_date("nicht bekannt", DEFAULT_FMT)
        self.assertIsNone(d)
        self.assertIsNotNone(err)


# ==============================================================================
# TC-01 bis TC-06: Warnstufen-Berechnung
# ==============================================================================

class TestWarnstufe(unittest.TestCase):

    def test_tc01_ueberfaellig(self):
        """TC-01: Zinsbindungsende 70 Tage vor Stichtag -> UEBERFAELLIG"""
        ws, tage = fw.berechne_warnstufe(STICHTAG - timedelta(days=70), STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "UEBERFAELLIG" if "UEBERFAELLIG" in fw.WARNSTUFEN else "ÜBERFÄLLIG")
        self.assertLess(tage, 0)

    def test_tc01_ueberfaellig_warnstufe(self):
        """TC-01b: Korrekte Warnstufe fuer vergangenes Datum"""
        ws, tage = fw.berechne_warnstufe(STICHTAG - timedelta(days=70), STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, list(fw.WARNSTUFEN.keys())[0])  # UEBERFAELLIG = erster Key

    def test_tc02_stichtag_heute(self):
        """TC-02: Zinsbindungsende = Stichtag (0 Tage) -> KRITISCH"""
        ws, tage = fw.berechne_warnstufe(STICHTAG, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "KRITISCH")
        self.assertEqual(tage, 0)

    def test_tc03_kritisch_30tage(self):
        """TC-03: Zinsbindungsende in 30 Tagen -> KRITISCH"""
        zbe = STICHTAG + timedelta(days=30)
        ws, tage = fw.berechne_warnstufe(zbe, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "KRITISCH")
        self.assertEqual(tage, 30)

    def test_tc04_warnung_120tage(self):
        """TC-04: Zinsbindungsende in 120 Tagen -> WARNUNG"""
        zbe = STICHTAG + timedelta(days=120)
        ws, tage = fw.berechne_warnstufe(zbe, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "WARNUNG")
        self.assertEqual(tage, 120)

    def test_tc05_hinweis_270tage(self):
        """TC-05: Zinsbindungsende in 270 Tagen -> HINWEIS"""
        zbe = STICHTAG + timedelta(days=270)
        ws, tage = fw.berechne_warnstufe(zbe, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "HINWEIS")
        self.assertEqual(tage, 270)

    def test_tc06_ok_400tage(self):
        """TC-06: Zinsbindungsende in 400 Tagen -> OK"""
        zbe = STICHTAG + timedelta(days=400)
        ws, tage = fw.berechne_warnstufe(zbe, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "OK")
        self.assertEqual(tage, 400)

    def test_datenfehler_kein_datum(self):
        """TC-11b: zbe_datum=None -> DATENFEHLER"""
        ws, tage = fw.berechne_warnstufe(None, STICHTAG, DEFAULT_SW, False)
        self.assertEqual(ws, "DATENFEHLER")
        self.assertIsNone(tage)

    def test_datenfehler_kritischer_fehler(self):
        """TC-11c: hat_kritischen_fehler=True -> immer DATENFEHLER"""
        ws, tage = fw.berechne_warnstufe(date(2027, 1, 1), STICHTAG, DEFAULT_SW, True)
        self.assertEqual(ws, "DATENFEHLER")


# ==============================================================================
# TC-11 bis TC-15: Datensatz-Validierung
# ==============================================================================

class TestValidateRow(unittest.TestCase):

    def _row(self, **kwargs):
        base = {
            "kunden_nr":        "T999",
            "kunden_name":      "Test GmbH",
            "zinsbindungsende": "2027-01-01",
        }
        base.update(kwargs)
        return base

    def test_tc11_jahr_2220(self):
        """TC-11: Jahr 2220 -> DATENFEHLER (unplausibel spaet)"""
        row = self._row(zinsbindungsende="2220-01-01")
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertTrue(any("unplausibel" in f for f in fehler))

    def test_tc12_jahr_1989(self):
        """TC-12: Jahr 1989 -> DATENFEHLER (unplausibel frueh)"""
        row = self._row(zinsbindungsende="1989-12-31")
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertTrue(any("unplausibel" in f for f in fehler))

    def test_tc13_fehlt_kunden_nr(self):
        """TC-13: Pflichtfeld kunden_nr fehlt -> Fehler"""
        row = self._row(kunden_nr="")
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertTrue(any("kunden_nr" in f for f in fehler))

    def test_tc14_fehlt_kunden_name(self):
        """TC-14: Pflichtfeld kunden_name fehlt -> Fehler"""
        row = self._row(kunden_name="")
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertTrue(any("kunden_name" in f for f in fehler))

    def test_tc15_fehlt_zinsbindungsende(self):
        """TC-15: Pflichtfeld zinsbindungsende fehlt -> Fehler"""
        row = self._row(zinsbindungsende="")
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertTrue(len(fehler) > 0)

    def test_positiv_kein_fehler(self):
        """Positiv: Valider Datensatz hat keine Fehler"""
        row = self._row()
        _, fehler = fw.validate_row(row, DEFAULT_PF, DEFAULT_FMT)
        self.assertEqual(fehler, [])


# ==============================================================================
# TC-16, TC-17: CSV-Trennzeichen
# ==============================================================================

class TestReadCsv(unittest.TestCase):

    def _write_csv(self, sep, tmpdir):
        path = os.path.join(tmpdir, f"test.csv")
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"kunden_nr{sep}kunden_name{sep}zinsbindungsende\n")
            f.write(f"T001{sep}Test GmbH{sep}2027-01-01\n")
        return path

    def test_tc16_semikolon(self):
        """TC-16: Semikolon-CSV wird korrekt eingelesen"""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = self._write_csv(";", tmpdir)
            rows = fw.read_csv(path)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["kunden_nr"], "T001")

    def test_tc17_komma(self):
        """TC-17: Komma-CSV wird korrekt eingelesen"""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = self._write_csv(",", tmpdir)
            rows = fw.read_csv(path)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["kunden_nr"], "T001")


# ==============================================================================
# TC-18, TC-19, TC-20: Integration und Regression
# ==============================================================================

class TestIntegration(unittest.TestCase):

    def test_tc18_regression_vertraege_test(self):
        """TC-18: Regression - vertraege_test.csv mit Stichtag aus STICHTAG-Konstante"""
        with tempfile.TemporaryDirectory() as outdir:
            fw.run_processing(
                input_path=SAMPLE_CSV,
                outdir=outdir,
                stichtag_str=STICHTAG.strftime("%Y-%m-%d"),
                config_path=SAMPLE_CFG,
            )
            out_csv = os.path.join(outdir, "fruehwarnung_output.csv")
            rows = fw.read_csv(out_csv)
            counts = {}
            for r in rows:
                ws = r.get("warnstufe", "")
                counts[ws] = counts.get(ws, 0) + 1

            ueberfaellig_key = [k for k in fw.WARNSTUFEN if "BERF" in k][0]
            self.assertEqual(counts.get(ueberfaellig_key, 0), 1, "Erwartet: 1 UEBERFAELLIG")
            self.assertEqual(counts.get("KRITISCH",    0), 2, "Erwartet: 2 KRITISCH")
            self.assertEqual(counts.get("WARNUNG",     0), 2, "Erwartet: 2 WARNUNG")
            self.assertEqual(counts.get("HINWEIS",     0), 1, "Erwartet: 1 HINWEIS")
            self.assertEqual(counts.get("OK",          0), 1, "Erwartet: 1 OK")
            self.assertEqual(counts.get("DATENFEHLER", 0), 3, "Erwartet: 3 DATENFEHLER")

    def test_tc19_ausgabedateien_vorhanden(self):
        """TC-19: Alle 3 Ausgabedateien werden nach dem Lauf erstellt"""
        with tempfile.TemporaryDirectory() as outdir:
            fw.run_processing(
                input_path=SAMPLE_CSV,
                outdir=outdir,
                stichtag_str=STICHTAG.strftime("%Y-%m-%d"),
                config_path=SAMPLE_CFG,
            )
            self.assertTrue(os.path.isfile(os.path.join(outdir, "fruehwarnung_output.csv")))
            self.assertTrue(os.path.isfile(os.path.join(outdir, "fehlerliste.csv")))
            self.assertTrue(os.path.isfile(os.path.join(outdir, "report.html")))

    def test_tc20_stichtag_im_html(self):
        """TC-20: Stichtag ist im HTML-Report sichtbar"""
        with tempfile.TemporaryDirectory() as outdir:
            fw.run_processing(
                input_path=SAMPLE_CSV,
                outdir=outdir,
                stichtag_str=STICHTAG.strftime("%Y-%m-%d"),
                config_path=SAMPLE_CFG,
            )
            with open(os.path.join(outdir, "report.html"), encoding="utf-8") as f:
                content = f.read()
            self.assertIn(STICHTAG.strftime("%d.%m.%Y"), content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
