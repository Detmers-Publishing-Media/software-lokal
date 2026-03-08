# 5 Bundles à 25 Tools für Code-Fabrik

## Bundle 1: Immobilienverwaltung & WEG — Lokale Verwaltung von Miet- und Eigentumsobjekten

**Zielgruppe:** Kleine Hausverwaltungen (1-50 Einheiten), WEG-Verwalter im Nebenamt, private Vermieter mit 2-20 Einheiten im DACH-Raum (~300k Akteure)

**Gemeinsamer Kontext:** Alle 25 Tools drehen sich um die Verwaltung, Abrechnung und Dokumentation von Immobilien — Wohnungen, Häuser, Gewerbeeinheiten. Gemeinsame Datenstrukturen: Objekte, Einheiten, Personen (Eigentümer/Mieter), Verträge, Zähler, Kosten.

**Monetarisierung:** Kleine Verwalter nutzen Excel oder teure Software (Haufe PowerHaus ab 500 EUR/Jahr, WISO Vermieter nur Windows). Ein lokales, offenes Tool für 29 EUR/Jahr ist ein Bruchteil der Kosten — und ersetzt den Aktenordner.

**Haftung:** Niedrig — organisatorisches Hilfsmittel. Keine Rechtsberatung, keine verbindliche Abrechnung (Steuerberater bleibt zuständig).

**Marktlücke:** Haufe PowerHaus/Immoware24 sind Cloud + teuer. WISO Vermieter ist Windows-only und geschlossen. Kleine WEG-Verwalter (Ehrenamt!) arbeiten mit Excel und Word-Vorlagen.

| Nr. | Toolname | Einzeiler | Kernprozess | MVP-Scope | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|-------------|-----------|-----------------|----------------|
| 1 | BeschlussArchiv | WEG-Beschlüsse nummeriert erfassen und durchsuchen | Beschluss anlegen → Datum/TOP zuordnen → Text erfassen → durchsuchen → PDF-Export | Beschluss-CRUD + PDF-Beschlusssammlung | SQLite, PDF, Audit-Log, Suche | Nummerierte Dokumentensammlung |
| 2 | HausgeldRechner | Hausgeld pro Einheit nach Verteilerschlüssel berechnen | Kostenarten erfassen → Verteilerschlüssel wählen → Miteigentumsanteile pflegen → berechnen → PDF | Berechnung + PDF-Hausgeldübersicht | SQLite, PDF, CSV-Export | Verteilerschlüssel-Engine |
| 3 | BetriebskostenAbrechnung | Nebenkostenabrechnung nach BetrKV erstellen | Kosten erfassen → Umlageschlüssel zuordnen → Vorauszahlungen abziehen → Abrechnung je Mieter → PDF | Abrechnung + PDF-Brief pro Mieter | SQLite, PDF, CSV-Import | Abrechnungs-Modul (Zeiträume, Schlüssel) |
| 4 | EigentuemerVerzeichnis | Eigentümer mit Anteilen, Kontaktdaten und Historie | Eigentümer anlegen → Einheit zuordnen → MEA pflegen → Änderungshistorie → PDF-Liste | CRUD + PDF-Eigentümerliste | SQLite, PDF, CSV, DSGVO | — |
| 5 | UebergabeProtokoll | Wohnungsübergabe Raum für Raum dokumentieren | Räume anlegen → Zustand je Raum erfassen → Mängel notieren → Zählerstände → PDF-Protokoll | Raumweise Erfassung + PDF | SQLite, PDF | Raum-basierte Checkliste |
| 6 | MaengelTracker | Mängelmeldungen erfassen, Status verfolgen, Handwerker zuordnen | Mangel melden → Einheit/Ort zuordnen → Handwerker zuweisen → Status pflegen → Export | CRUD mit Status-Workflow + CSV-Export | SQLite, CSV, Suche, Filter | Status-Workflow-Engine |
| 7 | RuecklagenRechner | Instandhaltungsrücklage nach Peters'scher Formel berechnen | Gebäudedaten eingeben → Herstellungskosten → Faktor wählen → Rücklage berechnen → PDF | Berechnung + PDF-Empfehlung | SQLite, PDF | Formel-Rechner-Baustein |
| 8 | VersammlungsProtokoll | WEG-Versammlungen protokollieren mit Abstimmungsergebnissen | Versammlung anlegen → TOP-Liste → Anwesenheit → Abstimmungen → Beschlüsse → PDF | Protokoll-CRUD + PDF | SQLite, PDF, Audit-Log | Abstimmungs-Erfassung |
| 9 | MietvertragRegister | Mietverträge mit Laufzeiten und Fristen verwalten | Vertrag anlegen → Mieter/Einheit zuordnen → Konditionen → Fristen-Übersicht → CSV | CRUD + Fristen-Liste | SQLite, CSV, Filter | Vertrags-/Fristenverwaltung |
| 10 | ZaehlerstandErfassung | Zählerstände für Heizung, Wasser, Strom mit Verlauf | Zähler anlegen → Ablesewerte erfassen → Verbrauch berechnen → Verlauf anzeigen → CSV | Erfassung + Verbrauchsanzeige | SQLite, CSV | Zeitreihen-Erfassung |
| 11 | WartungsplanKalender | Wiederkehrende Wartungstermine für Gebäudetechnik planen | Wartungsobjekt anlegen → Intervall setzen → Fälligkeit anzeigen → erledigt markieren → PDF | Fälligkeits-Übersicht + PDF | SQLite, PDF | Wiederkehrende-Termine-Engine |
| 12 | SchluesselBuch | Schlüssel und Transponder ausgeben, zurücknehmen, dokumentieren | Schlüssel anlegen → Person zuordnen → Ausgabe dokumentieren → Rücknahme → PDF-Bestand | CRUD + PDF-Schlüsselliste | SQLite, PDF, Audit-Log | Ausgabe-/Rücknahme-Protokoll |
| 13 | MietspiegelVergleich | Mietpreis gegen lokalen Mietspiegel prüfen (manuelle Eingabe) | Spiegelwerte eingeben → Wohnung zuordnen → Spanne berechnen → Ergebnis → PDF | Vergleichsberechnung + PDF | SQLite, PDF | — |
| 14 | HausordnungGenerator | Hausordnung aus Textbausteinen zusammenstellen | Bausteine wählen → Reihenfolge festlegen → individualisieren → PDF-Hausordnung | Baustein-Auswahl + PDF | SQLite, PDF | Textbaustein-Composer |
| 15 | GrundbuchRegister | Grundbucheinträge, Lasten und Dienstbarkeiten dokumentieren | Eintrag anlegen → Abteilung zuordnen → Lasten erfassen → durchsuchen → PDF | CRUD + PDF-Übersicht | SQLite, PDF, Suche | — |
| 16 | VersicherungsRegister | Gebäudeversicherungen mit Policen und Laufzeiten verwalten | Police anlegen → Objekt zuordnen → Deckung/Prämie → Fälligkeit → CSV-Export | CRUD + Fälligkeitsliste | SQLite, CSV | — |
| 17 | HandwerkerKartei | Handwerker mit Gewerk, Kontakt und Auftragshistorie | Handwerker anlegen → Gewerk zuordnen → Aufträge verknüpfen → bewerten → PDF | CRUD + PDF-Liste | SQLite, PDF, Suche | Kontakt-Kartei-Baustein |
| 18 | MieterhoehungsRechner | Mieterhöhung nach §558 BGB berechnen und Schreiben erzeugen | Aktuelle Miete → Kappungsgrenze → Vergleichsmiete → berechnen → PDF-Schreiben | Berechnung + PDF-Brief | SQLite, PDF | Brief-Generator (Formular→PDF) |
| 19 | BetriebsstromTrenner | Allgemeinstrom vs. Nutzerstrom aufteilen und berechnen | Zählerstände eingeben → Abzugsposten definieren → Restmenge verteilen → PDF | Berechnung + PDF-Aufteilung | SQLite, PDF | — |
| 20 | KautionsVerwalter | Mietkautionen mit Anlageform und Zinsen dokumentieren | Kaution anlegen → Anlageform → Zinsen berechnen → Rückzahlung → PDF-Nachweis | CRUD + Zinsberechnung + PDF | SQLite, PDF | Zinsberechnung-Modul |
| 21 | ModernisierungsRechner | Modernisierungskosten nach §559 BGB auf Mieter umlegen | Kosten erfassen → Instandhaltungsanteil abziehen → Umlage berechnen → PDF | Berechnung + PDF-Erläuterung | SQLite, PDF | — |
| 22 | WirtschaftsplanWEG | Jahreswirtschaftsplan mit Kostenarten für WEG erstellen | Kostenarten pflegen → Plan-Beträge → Verteilung → Einzelwirtschaftsplan → PDF | Planerstellung + PDF | SQLite, PDF, CSV | Plan-/Ist-Vergleich |
| 23 | RauchmelderPruefung | Rauchmelder-Prüfung dokumentieren mit Fälligkeitsanzeige | Melder anlegen → Standort → Prüfung durchführen → nächste Fälligkeit → PDF-Protokoll | Prüf-Erfassung + PDF-Nachweis | SQLite, PDF | Prüfprotokoll-Baustein |
| 24 | HeizkostenVerteiler | Heizkosten nach Fläche und Verbrauch vorverteilen | Gesamtkosten → Grund-/Verbrauchsanteil → Einheiten → Verteilung → PDF | Verteilung + PDF-Abrechnung | SQLite, PDF | — |
| 25 | LeerstandsMelder | Leerstände dokumentieren mit Dauer, Kosten und Maßnahmen | Einheit als leer markieren → Dauer berechnen → Kosten schätzen → Maßnahme → CSV | CRUD + Leerstandsbericht | SQLite, CSV | — |

**Abgrenzung Bundle:** KEINE Buchhaltung/FiBu (→ Steuerberater). KEINE Makler-Funktionen (→ B-21). KEINE Immobilien-Portale/Inserate. KEINE Mieterkommunikation (wäre Cloud/E-Mail). KEINE Hausverwaltungs-Vollsoftware — jedes Tool bleibt fokussiert.

---

## Bundle 2: Handwerk & Gewerke — Dokumentation und Kalkulation für Kleinbetriebe

**Zielgruppe:** Handwerksbetriebe mit 1-20 Mitarbeitern im DACH-Raum (~1M Betriebe), Meisterbetriebe, Soloselbständige Handwerker

**Gemeinsamer Kontext:** Alle Tools dokumentieren oder kalkulieren typische Handwerks-Prozesse: Aufmaß, Kalkulation, Baustelle, Geräte, Personal, Gewährleistung. Gemeinsame Datenstrukturen: Aufträge, Baustellen, Material, Stunden, Geräte.

**Monetarisierung:** Handwerker zahlen für Tools, die ihnen Zettelwirtschaft abnehmen. 29 EUR/Jahr ist günstiger als ein verlorener Stundenzettel. Cross-Selling innerhalb des Bundles ist hoch (wer Aufmaß macht, braucht auch Kalkulation).

**Haftung:** Niedrig — Dokumentation und Kalkulation. Keine statische Berechnung, keine Bauplanung, keine Zertifizierung.

**Marktlücke:** Lexware Handwerk ab 300 EUR/Jahr und Cloud-pflichtig. Plancraft/Craftnote sind Cloud-only und Abo-basiert. Viele Handwerker nutzen Papier-Aufmaßblöcke und Excel-Kalkulationen.

| Nr. | Toolname | Einzeiler | Kernprozess | MVP-Scope | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|-------------|-----------|-----------------|----------------|
| 1 | AufmassRechner | Flächen und Mengen aus Raummaßen berechnen | Raum anlegen → Maße eingeben → Abzüge (Fenster/Türen) → Fläche/Umfang → PDF-Aufmaß | Raumweise Berechnung + PDF | SQLite, PDF | Geometrie-Rechner |
| 2 | MaterialKalkulator | Materialbedarf aus Aufmaß berechnen inkl. Verschnitt | Fläche/Menge eingeben → Material wählen → Verschnittfaktor → Bedarf → PDF-Bestellliste | Berechnung + PDF-Liste | SQLite, PDF | Verschnitt-Berechnung |
| 3 | StundenzettelApp | Arbeitszeiten pro Baustelle und Mitarbeiter erfassen | Mitarbeiter → Baustelle → Datum/Von/Bis → Tätigkeit → Monatsübersicht → CSV | Zeiterfassung + CSV-Export | SQLite, CSV | Zeiterfassungs-Modul |
| 4 | BauTagebuch | Tägliche Einträge pro Baustelle mit Wetter und Fortschritt | Baustelle wählen → Datum → Wetter/Temp → Arbeit/Personal → Besonderheiten → PDF | Tages-Erfassung + PDF-Tagebuch | SQLite, PDF, Audit-Log | Tagesbericht-Struktur |
| 5 | WerkzeugInventar | Werkzeuge und Geräte mit Standort, Prüfdatum, Ausleihe | Gerät anlegen → Standort → Prüfdatum → Ausleihe an MA → Rücknahme → PDF-Inventar | CRUD + PDF-Bestandsliste | SQLite, PDF, Audit-Log | Inventar-Baustein |
| 6 | GeraetePruefProtokoll | DGUV V3 Prüfung elektrischer Betriebsmittel dokumentieren | Gerät wählen → Prüfer → Messwerte → Ergebnis → nächste Fälligkeit → PDF-Protokoll | Prüf-Erfassung + PDF | SQLite, PDF | Prüfprotokoll-Baustein |
| 7 | GefaehrdungsBeurteilung | Gefährdungsbeurteilung pro Tätigkeit erstellen | Tätigkeit → Gefährdungen → Risikobewertung → Maßnahmen → Wirksamkeitsprüfung → PDF | GBU-Erfassung + PDF | SQLite, PDF | Risikomatrix-Widget |
| 8 | AngebotsKalkulator | Angebotspreis aus Stunden und Material kalkulieren | Positionen anlegen → Stunden × Verrechnungssatz → Material → Zuschläge → Angebots-PDF | Kalkulation + PDF-Angebot | SQLite, PDF | Positions-Kalkulation |
| 9 | NachtragsRechner | Nachträge und Zusatzleistungen kalkulieren und dokumentieren | Nachtrag anlegen → Begründung → Kalkulation → Auftraggeber-Referenz → PDF | Kalkulation + PDF-Nachtrag | SQLite, PDF | — |
| 10 | AbnahmeProtokoll | Bauabnahme mit Mängelliste und Fristen dokumentieren | Gewerk wählen → Prüfpunkte → Mängel → Frist → Unterschriften-Feld → PDF | Mängelliste + PDF-Protokoll | SQLite, PDF | — |
| 11 | LieferantenRegister | Lieferanten mit Konditionen, Lieferzeiten und Bewertung | Lieferant anlegen → Gewerk → Konditionen → Bewertung → Bestellhistorie → CSV | CRUD + CSV-Export | SQLite, CSV, Suche | — |
| 12 | RegieZettel | Regiearbeiten (Stunden + Material) vor Ort erfassen | Datum → Mitarbeiter → Stunden → Material → Auftraggeber-Bestätigung → PDF | Erfassung + PDF-Regiebericht | SQLite, PDF | — |
| 13 | GewaehrleistungsTracker | Gewährleistungsfristen pro Auftrag überwachen | Auftrag → Abnahmedatum → Frist (4/5 Jahre) → Ablauf berechnen → Warn-Übersicht | Fristen-CRUD + Fälligkeitsliste | SQLite, CSV | Fristen-Countdown |
| 14 | Fahrtenbuch | Dienstfahrten mit km, Ziel und Zweck dokumentieren | Fahrt anlegen → Datum → Start/Ziel → km-Stand → Zweck → Monatsbericht PDF | Fahrterfassung + PDF-Bericht | SQLite, PDF, CSV | — |
| 15 | BerichtsHeft | Ausbildungsnachweise für Azubis strukturiert erfassen | Woche → Tätigkeiten → Abteilung → Ausbilder → Unterschriftsfeld → PDF | Wochen-Erfassung + PDF | SQLite, PDF | Wochen-Berichts-Modul |
| 16 | UnterweisungsProtokoll | Sicherheitsunterweisungen dokumentieren mit Teilnehmerliste | Thema → Datum → Unterweiser → Teilnehmer abhaken → nächste Fälligkeit → PDF | Unterweisungs-CRUD + PDF | SQLite, PDF | Teilnehmer-Checkliste |
| 17 | SchichtplanEinfach | Einfacher Wochen-/Monatsschichtplan für Kleinbetrieb | Mitarbeiter → Schichttypen → Wochen-Matrix → Konflikte prüfen → PDF-Aushang | Zuordnungs-Matrix + PDF | SQLite, PDF | Matrix-Zuordnung |
| 18 | BaustellenDoku | Foto-Register mit Datum, Beschreibung, Zuordnung zu Bauabschnitt | Foto-Referenz → Beschreibung → Bauabschnitt → Datum → nummeriert → PDF-Doku | Referenz-Erfassung + PDF | SQLite, PDF | Foto-Referenz-Register |
| 19 | KalkulationsSaetze | Stundenverrechnungssätze und Maschinensätze pflegen | Lohngruppe → Zuschläge → Gemeinkosten → Verrechnungssatz berechnen → PDF | Satz-Berechnung + Übersicht | SQLite, PDF | — |
| 20 | LV_Pruefer | Leistungsverzeichnis-Positionen prüfen und eigene Preise eintragen | LV-Position importieren (CSV) → eigene EP eintragen → GP berechnen → Angebots-PDF | CSV-Import + Kalkulation | SQLite, CSV, PDF | LV-Import-Parser |
| 21 | MaengelRuege | Mängelrüge-Schreiben aus Vorlagen erzeugen mit Fristsetzung | Mangel beschreiben → Frist setzen → Adressat → Textbaustein → PDF-Brief | Formular → PDF-Brief | SQLite, PDF | — |
| 22 | SubunternehmerRegister | Nachunternehmer mit Qualifikation und Versicherungsnachweis | NU anlegen → Gewerk → Versicherung/Freistellung → Einsätze → Fälligkeiten → CSV | CRUD + Fälligkeitsübersicht | SQLite, CSV | — |
| 23 | BauabfallNachweis | Entsorgungsnachweise für Bauabfälle dokumentieren | Abfallart (AVV) → Menge → Entsorger → Begleitschein-Nr. → Nachweis-PDF | Erfassung + PDF-Nachweis | SQLite, PDF | — |
| 24 | VOB_FristenRechner | VOB/B-Fristen berechnen (Abnahme, Gewährleistung, Verjährung) | Abnahmedatum → Fristtyp wählen → Fristende berechnen → Kalender-Übersicht → PDF | Fristen-Berechnung + PDF | SQLite, PDF | — |
| 25 | MaschinenTagebuch | Betriebsstunden, Wartung und Prüfungen pro Maschine | Maschine anlegen → Betriebsstunden nachtragen → Wartung dokumentieren → Fälligkeit → PDF | CRUD + Wartungshistorie-PDF | SQLite, PDF, Audit-Log | — |

**Abgrenzung Bundle:** KEINE Buchhaltung/Rechnungsstellung (→ Steuerberater/Lexware). KEINE CAD/Bauplanung. KEINE statische Berechnung. KEINE digitale Bauakte im BIM-Sinne. KEINE Auftragsvermittlung. Kein ERP-Ersatz — jedes Tool bleibt eine fokussierte Funktion.

---

## Bundle 3: Agrar & Grüne Berufe — Dokumentation für Land-, Forst- und Gartenbauwirtschaft

**Zielgruppe:** Landwirtschaftliche Kleinbetriebe, Nebenerwerbslandwirte, Imker, Winzer, Gärtner, Förster, Jäger, Fischer im DACH-Raum (~260k Landwirtschaftsbetriebe + ~150k Imker + ~30k Jagdreviere)

**Gemeinsamer Kontext:** Alle Tools dokumentieren Bewirtschaftung, Ernte, Tierbestand oder Direktvermarktung. Gemeinsame Datenstrukturen: Flächen/Schläge, Kulturen, Tiere, Maßnahmen, Erträge, Zeiträume.

**Monetarisierung:** Viele Dokumentationspflichten (DüV, PflSchG, Cross Compliance) werden mit Papier/Excel erledigt. Professionelle FMIS-Systeme (365FarmNet, NEXT Farming) sind Cloud-basiert und oft überdimensioniert. 29 EUR/Jahr für ein lokales Pflanzenschutz-Tagebuch, das die Prüfung besteht — Sofortwert.

**Haftung:** Niedrig — Dokumentationshilfe, keine Beratung. Das Tool berechnet z.B. Nährstoffbedarf nach DüV-Formel, ersetzt aber nicht die Fachberatung.

**Marktlücke:** 365FarmNet/NEXT Farming sind Cloud-only. Ackerschlag.de ist Cloud. Imker-Apps sind mobil-only. Für Jäger/Förster gibt es kaum Desktop-Tools. Lokale Datenhaltung ist hier ein echtes Verkaufsargument (Betriebsdaten sind sensibel).

| Nr. | Toolname | Einzeiler | Kernprozess | MVP-Scope | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|-------------|-----------|-----------------|----------------|
| 1 | SchlagKartei | Feldstücke mit Fruchtfolge, Düngung und Pflanzenschutz dokumentieren | Schlag anlegen → Kultur zuordnen → Maßnahmen erfassen → Saison-Übersicht → PDF | Schlag-CRUD + Maßnahmen + PDF | SQLite, PDF, Audit-Log | Flächen-Maßnahmen-Modul |
| 2 | DuengeRechner | Nährstoffbedarf nach DüV berechnen | Kultur wählen → Ertragsniveau → Bodenvorrat → Abzüge → Nährstoffbedarf → PDF | Berechnung + PDF-Dokumentation | SQLite, PDF | — |
| 3 | PflanzenschutzBuch | Pflanzenschutzmittel-Anwendungen dokumentieren (PflSchG-Pflicht) | Datum → Schlag → PSM → Aufwandmenge → Indikation → Anwender → PDF-Tagebuch | Erfassung + PDF-Spritztagebuch | SQLite, PDF, Audit-Log | — |
| 4 | ErnteBuch | Erntemengen pro Schlag und Kultur erfassen und vergleichen | Schlag → Kultur → Erntemenge → Feuchtigkeit → Ertrag/ha → Jahresvergleich → CSV | Erfassung + Ertragsvergleich | SQLite, CSV | Jahresvergleichs-Ansicht |
| 5 | TierRegister | Tierbestand mit Zu- und Abgängen dokumentieren | Tier anlegen → Ohrmarke/ID → Zugang/Abgang → Bestandsübersicht → PDF | CRUD + Bestandsliste-PDF | SQLite, PDF | — |
| 6 | FutterRation | Futterrationen berechnen (Energie, Protein, Mineralstoffe) | Tiergruppe → Bedarf → Futtermittel → Menge → Nährstoffbilanz → PDF | Rations-Berechnung + PDF | SQLite, PDF | Nährstoffbilanz-Rechner |
| 7 | HofladenKasse | Hofladen-Verkäufe erfassen (Kassenführungspflicht GoBD) | Artikel → Menge → Preis → Bon-Nr. → Tagesabschluss → PDF-Kassenbericht | Kassenerfassung + PDF-Z-Bon | SQLite, PDF, Audit-Log | Kassenbuch-Modul (GoBD) |
| 8 | StockKarte | Bienenvölker mit Durchsichten, Behandlungen und Honigernte | Volk anlegen → Durchsicht → Varroabehandlung → Ernte → Jahres-PDF | CRUD + Durchsichtsverlauf + PDF | SQLite, PDF | — |
| 9 | HerbstBuch | Lesegut pro Parzelle mit Mostgewicht und Menge dokumentieren | Parzelle → Sorte → Lesedatum → Mostgewicht → Menge → Jahresübersicht → PDF | Erfassung + PDF-Herbstbericht | SQLite, PDF | — |
| 10 | HiebsRegister | Holzeinschlag dokumentieren: Sortimente, Mengen, Erlöse | Abteilung → Baumart → Sortiment → Menge (Fm) → Erlös → Jahresbericht → CSV | Erfassung + CSV-Export | SQLite, CSV | — |
| 11 | StreckenListe | Erlegtes Wild mit Datum, Revier, Wildart und Gewicht dokumentieren | Erlegung → Wildart → Gewicht → Revier → Jagdschein → Jagdjahr-PDF | Erfassung + PDF-Streckenliste | SQLite, PDF | — |
| 12 | SchlepperBuch | Betriebsstunden, Diesel und Wartung pro Maschine dokumentieren | Maschine → Betriebsstunden → Diesel → Wartung → Kosten-Übersicht → CSV | Erfassung + Kostenauswertung | SQLite, CSV | — |
| 13 | WeideBuch | Weideperioden, Besatz und Flächen dokumentieren | Weide → Fläche → Tiergruppe → Auftrieb/Abtrieb → Besatzdichte → PDF | Erfassung + PDF-Weidebuch | SQLite, PDF | — |
| 14 | BodenprobenArchiv | Bodenproben-Ergebnisse erfassen und Trends anzeigen | Schlag → Probedatum → pH/P/K/Mg/Humus → Trend-Anzeige → PDF-Bericht | Erfassung + Trendansicht + PDF | SQLite, PDF | Trend-/Sparkline-Widget |
| 15 | HofPreisliste | Preisliste für Direktvermarktung erstellen (Aushang, Flyer) | Artikel → Preis → Einheit → Saison → Sortierung → PDF-Preisliste/Aushang | CRUD + PDF-Preisliste | SQLite, PDF | Preislisten-Layout |
| 16 | LieferscheinHof | Lieferscheine für Ab-Hof-Verkauf und Gastronomie-Belieferung erstellen | Kunde → Artikel → Menge → Preis → Lieferschein-Nr. → PDF | Lieferschein-CRUD + PDF | SQLite, PDF | Lieferschein-Generator |
| 17 | PachtRegister | Pachtverträge mit Flächen, Laufzeiten und Pachtzins verwalten | Vertrag → Verpächter → Fläche(n) → Pachtzins → Laufzeit → Fristen-PDF | CRUD + Fristenübersicht | SQLite, PDF | — |
| 18 | GewaesserDoku | Abstände und Auflagen an Gewässern dokumentieren (Cross Compliance) | Gewässer → angrenzende Schläge → Abstand → Auflagen → Maßnahmen → PDF | Erfassung + PDF-Nachweis | SQLite, PDF | — |
| 19 | SpritzplanObst | Spritzfolgen für Obstbau planen und dokumentieren | Kultur → Stadium → Mittel → Termin → Wartezeit → Plan-PDF | Planung + Dokumentation + PDF | SQLite, PDF | — |
| 20 | KulturPlan | Kulturen mit Aussaat, Pflanzung, Ernte und Beetbelegung planen | Beet/Fläche → Kultur → Saat/Pflanzung → Ernte → Belegungsplan → PDF | Belegungsplanung + PDF | SQLite, PDF | Belegungs-Matrix |
| 21 | HofInventur | Lagerbestand für Direktvermarktung und Futtermittel erfassen | Artikel → Bestand → Zu-/Abgänge → Inventurstichtag → PDF-Inventurliste | CRUD + PDF-Inventur | SQLite, PDF | Inventur-Modul |
| 22 | ReviergangBuch | Reviergänge mit Beobachtungen, Schäden und Maßnahmen dokumentieren | Reviergang → Route → Beobachtung → Schaden → Maßnahme → PDF-Bericht | Erfassung + PDF | SQLite, PDF | — |
| 23 | FangMeldeBuch | Fangmeldungen und Besatzmaßnahmen für Fischereivereine dokumentieren | Gewässer → Fischart → Menge/Gewicht → Besatz → Jahres-PDF | Erfassung + PDF-Fangstatistik | SQLite, PDF | — |
| 24 | RebschnittDoku | Rebschnittmaßnahmen pro Parzelle und Sorte dokumentieren | Parzelle → Sorte → Maßnahme → Datum → Arbeitsaufwand → PDF | Erfassung + PDF-Dokumentation | SQLite, PDF | — |
| 25 | AlpRegister | Almbewirtschaftung: Auftrieb, Abtrieb, Tierzahlen, Weidepflege | Alp → Auftrieb-Datum → Tierart/Anzahl → Abtrieb → Weidetage → PDF-Alpbericht | Erfassung + PDF-Bericht | SQLite, PDF | — |

**Abgrenzung Bundle:** KEINE Buchhaltung/Steuererklärung. KEINE HI-Tier-Meldungen (amtliches System). KEINE Precision-Farming/GPS-Daten. KEINE Beratung (Pflanzenschutz-Empfehlungen). KEINE Handelsplattform. KEINE Wetteranbindung (wäre Cloud).

---

## Bundle 4: Kommunale Kleinverwaltung & Ehrenamt — Dokumentation für öffentliche und kirchliche Kleinsteinrichtungen

**Zielgruppe:** Freiwillige Feuerwehren (~22.000 in DE), Friedhofsverwaltungen (~30.000), Kirchengemeinden (~25.000 ev. + ~10.000 kath.), Kleingartenvereine (~14.000), Stiftungen (~25.000), Schiedspersonen, Dorfgemeinschaften, Bürgerbusvereine

**Gemeinsamer Kontext:** Alle Tools bedienen ehrenamtliche oder nebenamtliche Verwaltungspositionen in kommunalen, kirchlichen oder gemeinnützigen Einrichtungen. Gemeinsam: geringe IT-Budgets, hohe Dokumentationspflichten, oft eine einzelne Person als "Verwalter".

**Monetarisierung:** Diese Zielgruppen haben minimale IT-Budgets. 29 EUR/Jahr ist realistisch — oft zahlt die Gemeinde/Kirche/der Verein. Der Wert liegt im Ersetzen handschriftlicher Register und Word-Tabellen. Fördergelder können oft für Software genutzt werden.

**Haftung:** Niedrig — reine Dokumentation. Keine hoheitlichen Akte, keine Urkunden mit Rechtswirkung.

**Marktlücke:** Kommunale Software (ARCHIKART, KIM) kostet Tausende und ist für Stadtverwaltungen konzipiert. Für Friedhöfe gibt es friedhof24.de (Cloud). Für Feuerwehr gibt es FLORIX/COBRA (teuer). Kirchengemeinde-Software ist oft veraltet. Kleingarten-Software existiert kaum.

| Nr. | Toolname | Einzeiler | Kernprozess | MVP-Scope | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|-------------|-----------|-----------------|----------------|
| 1 | GrabRegister | Grabstellen mit Nutzungsrechten, Laufzeiten und Belegung verwalten | Grab anlegen → Reihe/Nr. → Nutzungsrecht → Verstorbene → Ablauf → PDF-Register | CRUD + PDF-Gräberliste | SQLite, PDF, Suche | Lageplan-Referenz (Reihe/Nr.) |
| 2 | EinsatzProtokoll | Feuerwehr-Einsätze dokumentieren: Art, Kräfte, Dauer, Maßnahmen | Einsatz → Alarmzeit → Art → Kräfte/Fahrzeuge → Maßnahmen → Dauer → PDF | Einsatz-CRUD + PDF-Bericht | SQLite, PDF, Audit-Log | — |
| 3 | FW_DienstBuch | Feuerwehr-Übungen und Lehrgänge mit Anwesenheit dokumentieren | Termin → Thema → Teilnehmer abhaken → Stunden → Jahresübersicht → PDF | Anwesenheits-Erfassung + PDF | SQLite, PDF | Anwesenheits-Matrix |
| 4 | KirchenBuchRegister | Taufen, Trauungen und Bestattungen als Verwaltungsregister führen | Eintrag → Art → Datum → Beteiligte → Pfarrer → Register-Nr. → PDF | CRUD + PDF-Registerliste | SQLite, PDF, Audit-Log | Laufende Nummern-System |
| 5 | ParzellenBuch | Kleingarten-Parzellen mit Pächtern und Verträgen verwalten | Parzelle → Größe → Pächter → Vertragsbeginn → Pacht → Kündigung → PDF | CRUD + PDF-Parzellenliste | SQLite, PDF, DSGVO | — |
| 6 | StiftungsVermögen | Stiftungsvermögen, Erträge und Verwendungsnachweise dokumentieren | Vermögensposten → Anlageart → Erträge → Verwendung → Jahresbericht-PDF | Erfassung + PDF-Jahresbericht | SQLite, PDF | Vermögens-/Ertrags-Tracking |
| 7 | SchiedsamtsProtokoll | Schlichtungsverfahren dokumentieren: Parteien, Sachverhalt, Ergebnis | Verfahren → Parteien → Sachverhalt → Termine → Vergleich/Scheitern → PDF | CRUD + PDF-Protokoll | SQLite, PDF, DSGVO | — |
| 8 | FundRegister | Fundsachen erfassen mit Fristen und Verwertung (§§ 965 ff. BGB) | Fund → Beschreibung → Fundort → Datum → 6-Monats-Frist → Aushändigung → PDF | CRUD + Fristenübersicht + PDF | SQLite, PDF | — |
| 9 | SpielplatzPruefung | Spielgeräte-Prüfung nach DIN EN 1176 dokumentieren | Spielplatz → Gerät → Prüfpunkte → Mängel → Frist → nächste Prüfung → PDF | Prüf-Checkliste + PDF | SQLite, PDF | — |
| 10 | GewaesserSchau | Gewässerschau dokumentieren: Zustand, Mängel, Maßnahmen | Gewässer → Abschnitt → Zustand → Mängel → Maßnahmen → Verantwortlicher → PDF | Erfassung + PDF-Protokoll | SQLite, PDF | — |
| 11 | DorfChronik | Chronik-Einträge mit Datum, Kategorie und Quellen erfassen | Eintrag → Datum → Kategorie → Beschreibung → Quellen → Chronik-PDF | CRUD + PDF-Chronik | SQLite, PDF, Suche | Chronik-/Timeline-Ansicht |
| 12 | EhrenamtsStunden | Ehrenamtliche Stunden für Übungsleiter-/Ehrenamtspauschale dokumentieren | Person → Datum → Stunden → Tätigkeit → Jahressumme → PDF-Bescheinigung | Erfassung + PDF-Bescheinigung | SQLite, PDF | Stundenbescheinigung |
| 13 | FW_FahrzeugBuch | Feuerwehrfahrzeuge: TÜV, Wartung, Geräteprüfungen, Laufleistung | Fahrzeug → TÜV-Termin → Wartung → Gerätebeladung → Prüffrist → PDF | CRUD + Fälligkeits-PDF | SQLite, PDF | — |
| 14 | GrabGebuehrenRechner | Grabgebühren nach kommunaler Satzung berechnen | Grabart → Nutzungsdauer → Satzungswerte eingeben → Gebühr berechnen → PDF-Bescheid | Berechnung + PDF-Bescheid | SQLite, PDF | Satzungs-Parameter-Modul |
| 15 | GemeinderatProtokoll | Sitzungsprotokolle mit Tagesordnung und Beschlüssen | Sitzung → TOP-Liste → Anwesende → Diskussion → Beschluss → PDF-Niederschrift | Sitzungs-Protokoll + PDF | SQLite, PDF, Audit-Log | — |
| 16 | KGV_Wasserabrechnung | Wasserverbrauch pro Kleingarten-Parzelle abrechnen | Hauptzähler → Einzelzähler → Verbrauch → Kosten/m³ → Abrechnung pro Pächter → PDF | Verbrauchsverteilung + PDF | SQLite, PDF | — |
| 17 | StandVergabe | Volksfest-/Markt-Standflächen und Beschicker verwalten | Fläche → Standnummer → Beschicker → Gewerk → Gebühr → Belegungsplan → PDF | CRUD + PDF-Belegungsplan | SQLite, PDF | — |
| 18 | BuechereiAusleihe | Medienbestand und Ausleihe für Gemeinde-/Schulbücherei | Medium anlegen → Ausleihe → Frist → Rückgabe → Mahnliste → PDF | Ausleihe-CRUD + Mahnliste-PDF | SQLite, PDF | Ausleih-/Rückgabe-Workflow |
| 19 | BrennholzVergabe | Brennholzvergabe: Lose, Bezahlung, Zuteilung dokumentieren | Los → Holzart/Menge → Bewerber → Zuteilung → Bezahlung → PDF-Übersicht | CRUD + PDF-Vergabeliste | SQLite, PDF | — |
| 20 | FW_AtemschutzRegister | Atemschutzgeräteträger: G26-Tauglichkeit, Einsatzbeschränkungen | Person → G26-Datum → Tauglichkeit → Übungsstrecke → Fälligkeit → PDF | CRUD + Fälligkeits-PDF | SQLite, PDF, DSGVO | — |
| 21 | GenossenschaftsRegister | Dorfladen-/Energiegenossenschaft: Mitglieder, Anteile, Schichten | Mitglied → Anteile → Einzahlung → Ehrenamtsschichten → Jahresübersicht → PDF | CRUD + PDF-Mitgliederliste | SQLite, PDF | Anteils-Verwaltung |
| 22 | FoerdermittelTracker | Förderanträge, Bewilligungen und Verwendungsnachweise verwalten | Antrag → Fördergeber → Summe → Bewilligung → Verwendung → Nachweis-PDF | CRUD + PDF-Verwendungsnachweis | SQLite, PDF | Verwendungsnachweis-Modul |
| 23 | FriedhofGiessPlan | Grabpflege-Aufträge und Gießdienste zuordnen und dokumentieren | Grab → Auftraggeber → Leistung → Turnus → Zuständigkeit → Saisonplan-PDF | CRUD + PDF-Plan | SQLite, PDF | — |
| 24 | KirchenmusikInventar | Instrumente und Noten der Kirchengemeinde inventarisieren | Instrument/Noten → Standort → Zustand → Wartung/Stimmung → PDF-Inventar | CRUD + PDF-Bestandsliste | SQLite, PDF | — |
| 25 | BuergerbusFahrten | Fahrtennachweise für ehrenamtliche Bürgerbus-Fahrer dokumentieren | Fahrer → Datum → Route → Fahrgäste → km → Monatsbericht → PDF | Erfassung + PDF-Monatsbericht | SQLite, PDF | — |

**Abgrenzung Bundle:** KEINE hoheitlichen Urkunden (Sterbeurkunde = Standesamt). KEINE Vereinsverwaltung (→ B-05 MitgliederSimple). KEINE Personalverwaltung. KEINE Finanz-/Haushaltsbuchhaltung (→ Kameralistik ist zu komplex). KEINE Software für hauptamtliche Kommunalverwaltung.

---

## Bundle 5: Sachverständige & Gutachter — Dokumentation und Kalkulation für freie Sachverständige

**Zielgruppe:** Freie und öffentlich bestellte Sachverständige, Bausachverständige, KFZ-Gutachter, Immobilienbewerter, Schadensgutachter, Gerichtsgutachter im DACH-Raum (~30.000 öffentlich bestellte + ~50.000 freie SV)

**Gemeinsamer Kontext:** Alle Tools unterstützen den Gutachter-Workflow: Auftragseingang → Ortstermin → Befunderhebung → Berechnung → Gutachten-Erstellung → Abrechnung. Gemeinsame Datenstrukturen: Aufträge, Aktenzeichen, Befunde, Berechnungen, Textbausteine.

**Monetarisierung:** Sachverständige verdienen gut (100-250 EUR/Stunde), haben aber oft chaotische Büroorganisation. Professionelle SV-Software (SV-Office, LapID) kostet 500-2.000 EUR/Jahr. 29 EUR/Jahr für fokussierte Einzel-Tools ist extrem günstig und der Einstieg in die Plattform.

**Haftung:** Mittel — die Tools rechnen und dokumentieren, erstellen aber kein rechtsverbindliches Gutachten. Der SV bleibt für Inhalt und Urteil verantwortlich. Wichtig: Keine "Ergebnis-Empfehlung" einbauen.

**Marktlücke:** SV-Office ist teuer und Windows-only. Viele SV arbeiten mit Word-Vorlagen und Excel. Speziell für den Bau-/Immobilienbereich gibt es kaum bezahlbare Einzeltools. Lokale Datenhaltung ist für Gerichtsgutachten ein Pluspunkt (Vertraulichkeit).

| Nr. | Toolname | Einzeiler | Kernprozess | MVP-Scope | Plattformanteil | Neuer Baustein |
|-----|----------|-----------|-------------|-----------|-----------------|----------------|
| 1 | GutachtenRegister | Gutachten mit Auftragsdaten, Status und Fristen verwalten | Auftrag → Aktenzeichen → Auftraggeber → Frist → Status → Übersicht → CSV | CRUD + Status-Übersicht | SQLite, CSV, Suche | — |
| 2 | BefundBericht | Strukturierten Befundbericht aus Abschnitten zusammenstellen | Abschnitte definieren → Befunde eintragen → Fotos referenzieren → PDF-Bericht | Abschnitt-Editor + PDF | SQLite, PDF | Abschnitt-Composer |
| 3 | FotoProtokoll | Ortstermin-Fotos nummeriert mit Beschreibung und Referenz dokumentieren | Foto-Nr. → Beschreibung → Ort im Objekt → Verweis im Text → PDF-Fotoanhang | Nummerierte Referenzen + PDF | SQLite, PDF | — |
| 4 | HonorarRechner_JVEG | Vergütung nach JVEG für Gerichtsgutachten berechnen | Stunden → Honorargruppe → Auslagen → Fahrtkosten → Gesamthonrar → PDF-Rechnung | Berechnung + PDF | SQLite, PDF | JVEG-Sätze-Tabelle |
| 5 | OrtsteminProtokoll | Ortstermine dokumentieren: Anwesende, Feststellungen, Wetter | Termin → Ort → Anwesende → Feststellungen → Fotos → PDF-Protokoll | Termin-CRUD + PDF | SQLite, PDF | — |
| 6 | SchadenKalkulation | Schadenshöhe berechnen: Zeitwert, Neuwert, Abzüge, Wertminderung | Position → Neuwert → Alter → Abschreibung → Zeitwert → Summe → PDF | Positions-Kalkulation + PDF | SQLite, PDF | Zeitwert-Berechnung |
| 7 | AuftragsEingang | Aufträge chronologisch erfassen mit Fristen und Auftraggeber | Eingang → Datum → Auftraggeber → Gegenstand → Frist → Bestätigung → PDF | CRUD + PDF-Bestätigung | SQLite, PDF | — |
| 8 | GerichtsFristenTracker | Gerichtliche Fristen und Nachfristen überwachen | Aktenzeichen → Fristtyp → Fristende → Erinnerung → Fristverlängerung → PDF | Fristen-CRUD + Warn-Übersicht | SQLite, PDF | — |
| 9 | BeweissicherungsProtokoll | Beweissicherung dokumentieren: Zustand vor Baumaßnahme/Schadensereignis | Objekt → Raum → Zustand → Risse/Schäden → Fotos → Datum → PDF-Protokoll | Raum-Erfassung + PDF | SQLite, PDF, Audit-Log | — |
| 10 | KFZ_BewertungsRechner | Fahrzeugbewertung berechnen: Wiederbeschaffungswert, Restwert, Differenz | Fahrzeugdaten → Basis-Wert → Zu-/Abschläge → Wiederbeschaffung → Rest → PDF | Berechnung + PDF-Bewertung | SQLite, PDF | Zu-/Abschlags-Rechner |
| 11 | ImmobilienWertRechner | Sachwert, Ertragswert oder Vergleichswert berechnen nach ImmoWertV | Verfahren wählen → Eingabewerte → Berechnung → Ergebnis → PDF-Dokumentation | Wertermittlung + PDF | SQLite, PDF | ImmoWertV-Formeln |
| 12 | MaengelKatalog | Mängel kategorisieren: Schweregrad, Ursache, Kosten, Empfehlung | Mangel → Kategorie → Schweregrad → Kosten-Schätzung → Foto-Ref → PDF-Tabelle | CRUD + PDF-Mängelliste | SQLite, PDF | Schweregrad-Kategorisierung |
| 13 | FortbildungsNachweis | Fortbildungsstunden für Kammer-/IHK-Nachweis dokumentieren | Veranstaltung → Datum → Stunden → Anbieter → Zertifikat-Nr. → Jahres-PDF | Erfassung + PDF-Übersicht | SQLite, PDF | — |
| 14 | RechnungsBuch | Ausgangsrechnungen erfassen, offene Posten und Zahlungseingänge | Rechnung → Auftraggeber → Betrag → Fälligkeit → Zahlung → OP-Liste → CSV | CRUD + CSV-OP-Liste | SQLite, CSV | Offene-Posten-Tracking |
| 15 | AktenzeichenVerwalter | Eigene und Gerichtsaktenzeichen zuordnen und durchsuchen | Eigenes Az. → Gerichts-Az. → Versicherungs-Az. → Verknüpfung → Suche | Mehrstufige Az.-Zuordnung + Suche | SQLite, Suche | Aktenzeichen-Mapping |
| 16 | TextbausteinArchiv | Wiederverwendbare Textbausteine für Gutachten verwalten | Baustein → Kategorie → Text → Platzhalter → einfügen → PDF-Vorschau | CRUD + Baustein-Suche | SQLite, Suche | — |
| 17 | VergleichsObjektDB | Vergleichsobjekte und -preise für Wertermittlung sammeln | Objekt → Lage → Fläche → Preis → Datum → Quelle → Vergleichsanalyse → CSV | CRUD + CSV-Export + Filter | SQLite, CSV, Suche | — |
| 18 | ReisekostenAbrechner | Fahrtkosten, Tagegelder und Auslagen für Ortstermine abrechnen | Termin → Fahrt-km → Verpflegungspauschale → Auslagen → Summe → PDF-Abrechnung | Berechnung + PDF | SQLite, PDF | Reisekosten-Pauschalen |
| 19 | SV_SiegelProtokoll | Stempel-/Siegel-Einsatz dokumentieren (Nachweispflicht für ö.b.u.v. SV) | Siegel-Nr. → Verwendung → Gutachten → Datum → lückenlose Liste → PDF | Erfassung + PDF-Nachweis | SQLite, PDF, Audit-Log | — |
| 20 | VersicherungsSchadensBericht | Schadensbericht für Versicherungen strukturiert erstellen | Schadenhergang → Schadenbild → Schadenhöhe → Verursachung → PDF-Bericht | Formular-Editor + PDF | SQLite, PDF | — |
| 21 | BauteilLebensdauer | Bauteil-Restnutzungsdauer und Zeitwert nach BRW-Tabellen berechnen | Bauteil → Gesamtnutzungsdauer → Alter → Modernisierung → Restnutzung → PDF | Berechnung + PDF-Tabelle | SQLite, PDF | Lebensdauer-Tabellen |
| 22 | EnergieausweisErfassung | Gebäudedaten für Energieausweis strukturiert erfassen (ohne Berechnung) | Gebäudetyp → Baujahr → Flächen → Hülle → Heizung → Daten-PDF zum Weiterverarbeiten | Datenerfassung + PDF-Datendossier | SQLite, PDF | — |
| 23 | ElektroPruefProtokoll | Elektrische Anlagen prüfen: Messwerte, Ergebnis, Norm-Referenz dokumentieren | Anlage → Prüfpunkte → Messwerte → Grenzwerte → Ergebnis → PDF-Protokoll | Prüf-Erfassung + PDF | SQLite, PDF | Messwert-Grenzwert-Vergleich |
| 24 | MietspiegelDatenBank | Vergleichsmieten für Mietgutachten erfassen und auswerten | Objekt → Lage → Größe → Miete → Ausstattung → Vergleichsberechnung → PDF | CRUD + Durchschnittsberechnung | SQLite, PDF | — |
| 25 | VerhandlungsNotiz | Gerichtsverhandlungen protokollieren: Aussagen, Beweisanordnungen, Ergebnis | Termin → Gericht → Az. → Anwesende → Kernaussagen → Beweisbeschluss → PDF | Erfassung + PDF-Notiz | SQLite, PDF | — |

**Abgrenzung Bundle:** KEINE rechtsverbindliche Gutachtenerstattung (Tool dokumentiert und rechnet, urteilt nicht). KEINE Textverarbeitung (Gutachtentext wird extern geschrieben, Tools liefern Daten/Berechnungen zu). KEINE medizinischen Gutachten (Art. 9 DSGVO). KEINE Gerichtssoftware. KEINE Sachverständigen-Vermittlung.

---

## Bewertungsmatrix

| Bundle | Plattform-Fit | Zielgruppen-Schärfe | Monetarisierung | Haftungsrisiko (5=niedrig) | Plattform-Verstärkung | Umsetzbarkeit (2 Wo./Tool) | Gesamt |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **B2: Handwerk & Gewerke** | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★★ | **28/30** |
| **B1: Immobilienverwaltung & WEG** | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ | **27/30** |
| **B4: Kommunale Kleinverwaltung** | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★★☆ | ★★★★★ | **25/30** |
| **B5: Sachverständige & Gutachter** | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **25/30** |
| **B3: Agrar & Grüne Berufe** | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★★☆ | **24/30** |

### Begründung der Rangfolge

**B2 Handwerk** führt: Riesige Zielgruppe (1M Betriebe), hohe Zahlungsbereitschaft, viele Bausteine wiederverwendbar (Prüfprotokolle, Zeiterfassung, Kalkulation). Fast jedes Tool ist ein CRUD+PDF-Pattern.

**B1 Immobilien** knapp dahinter: Starke Monetarisierung (Verwalter rechnen professionell), aber WEG-Recht ist komplex — einzelne Tools müssen sorgfältig abgegrenzt werden.

**B4 Kommunal** und **B5 Sachverständige** gleichauf bei 25: Kommunal hat breite aber zahlungsschwache Zielgruppe; SV hat kaufkräftige aber kleine Zielgruppe mit etwas höherem Haftungsrisiko.

**B3 Agrar** solide, aber: Zielgruppe ist heterogen (Imker ≠ Winzer ≠ Ackerbauer), und Dokumentationspflichten ändern sich häufig durch EU-Verordnungen.

---

## Top-10-Liste: Vielversprechendste Einzel-Tools

| Rang | Tool | Bundle | Begründung |
|------|------|--------|------------|
| 1 | **BetriebskostenAbrechnung** | B1 Immobilien | Jeder Vermieter braucht das jährlich, hohe Excel-Abwanderung, starker PDF-Export-Nutzen |
| 2 | **AngebotsKalkulator** | B2 Handwerk | Kernprozess jedes Handwerkers, täglich im Einsatz, sofortiger Nutzwert |
| 3 | **StundenzettelApp** | B2 Handwerk | Massenproblem (Zettelwirtschaft), einfach zu bauen, hohe Plattform-Synergie |
| 4 | **GrabRegister** | B4 Kommunal | ~30.000 Friedhöfe in DE, kaum bezahlbare Software, oft noch Karteikarten |
| 5 | **PflanzenschutzBuch** | B3 Agrar | Gesetzliche Pflicht (PflSchG), jeder Landwirt braucht es, Audit-Log = Revisionssicherheit |
| 6 | **BefundBericht** | B5 SV/Gutachter | Kernprodukt jedes SV, Textbaustein-Composer ist starker Plattform-Baustein |
| 7 | **HonorarRechner_JVEG** | B5 SV/Gutachter | Einfache Berechnung, hoher Nutzwert, öffnet Tür zum Bundle |
| 8 | **EinsatzProtokoll** | B4 Kommunal | 22.000 Feuerwehren, gesetzliche Dokumentationspflicht, emotional wichtig |
| 9 | **UebergabeProtokoll** | B1 Immobilien | Jeder Vermieterwechsel, einfaches CRUD+PDF, sofort verständlich |
| 10 | **HofladenKasse** | B3 Agrar | GoBD-Pflicht für Direktvermarkter, Kassenbuch-Modul wiederverwendbar |

---

## Vollständigkeitsprüfung

1. **Anzahl Bundles:** 5 ✓
2. **Tools pro Bundle:** B1=25, B2=25, B3=25, B4=25, B5=25 ✓
3. **Gesamtzahl Tools:** 125 ✓
4. **Bewertungsmatrix:** 5 Zeilen ✓
5. **Top-10-Liste:** 10 Einträge ✓
