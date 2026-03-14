# Produktstrategie Nachweis Lokal — Zielgruppe, Bedarf, Pricing

**Datum:** 2026-03-14
**Kontext:** Strategische Analyse fuer Produktausrichtung und Preisfindung

---

## 1. Kernzielgruppe

### Primaere Zielgruppe: "Der Verantwortliche ohne IT-Abteilung"

Das sind Menschen, die **nebenbei** fuer Pruefungen zustaendig sind — es ist nicht ihr Hauptjob, aber sie haften persoenlich.

| Segment | Anzahl DE | Pruefpflichten | Heutiger Zustand |
|---|---|---|---|
| **Handwerksbetriebe** (1-20 MA) | ~800.000 | Elektro (DGUV V3), Leitern, Maschinen, Fahrzeuge | Excel + Aktenordner |
| **Kitas** | 61.000 | Spielgeraete (DIN EN 1176), Brandschutz, Elektro | Papier-Checklisten |
| **Vereine mit Infrastruktur** | ~200.000 | Sportstaetten, Spielplaetze, Vereinsheim | Nichts oder Excel |
| **Schulen** | 32.700 | Turngeraete, Werkraeume, Labore, Spielplaetze | Papier, kommunale Vorgaben |
| **Hausmeisterdienste / FM-Klein** | ~30.000 | Alles (fuer Kunden dokumentieren) | Excel-Vorlagen |
| **Pflegeheime** | 11.600 | Medizintechnik, Brandschutz, Aufzuege, Hygiene | Teils Software, teils Papier |

**Adressierbarer Markt: ~1,1 Mio. Organisationen** die Pruefpflichten haben und mit hoher Wahrscheinlichkeit Papier/Excel nutzen.

### Persona: "Thorsten, der Hausmeister"

- 48 Jahre, Hausmeister an einer Grundschule
- Zustaendig fuer Gebaeudetechnik, Spielgeraetepruefung, Brandschutz
- Prueft Spielgeraete woechentlich (visuell), monatlich (operativ), jaehrlich (Hauptinspektion)
- Feuerloescher alle 2 Jahre, Elektro alle 4 Jahre, Leitern jaehrlich
- Dokumentiert auf Papier-Vordrucken, sammelt in einem Ordner
- Sein Problem: Der Ordner ist voll, der Traeger fragt nach Nachweisen, er weiss nicht was wann dran ist
- **Er will kein "System einrichten" — er will den Zettel loswerden**

### Persona: "Sandra, die Kita-Leitung"

- 38 Jahre, leitet eine Kita mit 60 Kindern
- Verantwortlich fuer Spielgeraete-Sicherheit, Brandschutz, Hygiene
- Hat die Pruefpflicht delegiert bekommen, aber keine Schulung
- Nutzt Excel-Vorlagen aus dem Internet, druckt sie aus, laesst unterschreiben
- Ihr Problem: Nach dem Unfall auf dem Nachbar-Spielplatz will der Traeger lueckenlose Nachweise
- **Sie will Sicherheit, dass sie nichts vergisst — und einen Beweis, dass sie alles getan hat**

### Persona: "Markus, der Elektrikermeister"

- 52 Jahre, fuehrt einen Elektrobetrieb mit 6 Mitarbeitern
- Muss DGUV V3 Pruefungen dokumentieren (eigene Geraete + Kundengeraete)
- Nutzt aktuell eine Excel-Tabelle mit 200+ Zeilen
- Sein Problem: Die BG fragt bei der Betriebspruefung nach, Excel reicht nicht mehr
- **Er will eine saubere Dokumentation, die bei der BG-Pruefung besteht**

---

## 2. Was brauchen sie WIRKLICH?

### Must-Have (ohne diese Features kauft niemand)

| Feature | Warum | Nachweis Lokal |
|---|---|---|
| Fertige Checklisten fuer ihre Branche | Nutzer will nicht selbst Pruefpunkte erfinden | ✓ 15 Vorlagen |
| Geraete/Raeume verwalten | "Was haben wir alles, was muss geprueft werden?" | ✓ Objektverwaltung |
| Pruefung durchfuehren (Checkliste abhaken) | Der Kernvorgang — muss in 2 Minuten erledigt sein | ✓ Interaktive Checkliste |
| PDF-Protokoll erzeugen | Nachweis fuer Ordner, Traeger, Versicherung, BG | ✓ PDF mit Briefkopf |
| Erinnerung an faellige Pruefungen | DAS Kernproblem: "Was ist dran?" | ✓ Dashboard + Ampel |
| Maengel dokumentieren mit Fotos | Beweissicherung + Nachverfolgung | ✓ Fotos + Maengeltracking |

### Nice-to-Have (differenziert, aber kein Kaufgrund)

| Feature | Status | Bewertung |
|---|---|---|
| Wiederkehrende Pruefungen (auto. Folge) | ✓ vorhanden | Gut — spart Arbeit |
| Sammel-PDF | ✓ vorhanden | Gut — fuer Traeger/BG |
| QR-Code auf PDF | ✓ vorhanden | Nett, aber kein Kaufgrund |
| CSV-Import/Export | ✓ vorhanden | Fuer Migration wichtig |
| Vorlagen duplizieren | ✓ vorhanden | Convenience |
| Prueferverwaltung | ✓ vorhanden | Nur relevant ab 2+ Pruefer |

### Overengineering-Risiko (nicht hinzufuegen)

| Feature | Warum NICHT |
|---|---|
| Mehrbenutzerbetrieb / Sync | Zielgruppe ist Single-User, Komplexitaetsexplosion |
| Kalender-Integration | Scope Creep, OS-abhaengig, Wartungshoelle |
| E-Mail-Erinnerungen | "Strict no-email" + Desktop-App |
| KI-generierte Checklisten | Gimmick, kein Vertrauen bei sicherheitsrelevanten Pruefungen |
| ERP-Integration | Falsche Zielgruppe |
| Mandantenfaehigkeit | Nur fuer Dienstleister relevant, eigenes Produkt |

### Was FEHLT fuer die Zielgruppe? (v0.5.0 Kandidaten)

| Feature | Impact | Aufwand | Begruendung |
|---|---|---|---|
| **System-Benachrichtigungen** | Hoch | Mittel | Desktop-Vorteil: OS-Notification "Feuerloescher EG faellig" |
| **Mehr Branchen-Vorlagen** (30-50) | Hoch | Gering | Jede neue Vorlage = neue Zielgruppe angesprochen |
| **Schnellpruefung vom Dashboard** | Hoch | Mittel | "Jetzt pruefen" → direkt zur Checkliste, kein Umweg |
| **Jahresplan / Pruefkalender** | Mittel | Mittel | Uebersicht: Was ist wann dran im ganzen Jahr? |
| **Druck-optimierte Leerformulare** | Mittel | Gering | Fuer den Uebergang: Checkliste drucken, draussen abhaken, danach digital nachtragen |

---

## 3. Pricing-Strategie

### Das Spannungsfeld

```
Zu billig (< 20 EUR/Jahr)          Zu teuer (> 100 EUR/Jahr)
├─ Zieht "Schnäppchenjäger"        ├─ Erwartung: Telefonsupport
├─ Hoher Support pro EUR Umsatz    ├─ Erwartung: Onboarding
├─ Keine Wertschaetzung            ├─ Vergleich mit Profi-Tools
├─ Kannibalisiert Gratisversion    ├─ Budgetfreigabe noetig
└─ Nicht nachhaltig                └─ Churn bei Enttaeuschung

         Sweet Spot: 39-69 EUR/Jahr
         ├─ Unter der "muss ich fragen"-Schwelle
         ├─ Ernsthafte Kunden (lesen Doku)
         ├─ Finanziert 48h-Ticket-Support
         └─ "Weniger als eine Handwerkerstunde"
```

### Preisvergleich im Markt

| Loesung | Preis | Modell | Zielgruppe |
|---|---|---|---|
| **Papier + Aktenordner** | 0 EUR | — | Alle (Status quo) |
| **Excel-Vorlagen (Internet)** | 0 EUR | — | DIY |
| **Nachweis Lokal** | **39 EUR/Jahr** | Servicepaket | Kleine Org. |
| **Hoppe Wartungsplaner** | 195 EUR einmalig | Kauflizenz | KMU |
| **Lumiform** | 192 EUR/Jahr/User | SaaS | KMU + Teams |
| **SafetyCulture** | 288 USD/Jahr/User | SaaS | Enterprise |
| **GoAudits** | 120 USD/Jahr/User | SaaS | KMU + Teams |

### Warum 39 EUR/Jahr der richtige Preis ist

**1. "Weniger als eine Handwerkerstunde"**
Ein Elektriker berechnet 60-80 EUR/Stunde. Die Software kostet weniger als eine halbe Stunde. Wenn sie auch nur eine vergessene Pruefung verhindert (Bussgeld: ab 5.000 EUR), hat sie sich 100x bezahlt.

**2. Unter der Freigabeschwelle**
Betraege unter 50 EUR werden in den meisten Organisationen nicht genehmigungspflichtig. Der Hausmeister kann das aus der Portokasse bezahlen, die Kita-Leitung aus dem Sachmittelbudget.

**3. Support-Hoelle vermeiden**
Bei 39 EUR/Jahr erwarten Kunden:
- Funktionierende Software ✓
- Fertige Installer ✓
- Gelegentliche Updates ✓
- Ticket bei echten Problemen (48h) ✓

Sie erwarten NICHT:
- Telefonsupport ✗
- Einrichtungshilfe ✗
- Individuelle Anpassungen ✗
- Schulungen ✗

Das ist genau das, was das Servicepaket bietet. Der Preis setzt die richtige Erwartungshaltung.

**4. Kein Preisdruck nach oben**
Die Software ist GPL-3.0. Wer technisch versiert ist, kann sie selbst bauen. Das Servicepaket verkauft Bequemlichkeit, nicht Funktionen. Das eliminiert "ich zahle so viel und es fehlt Feature X"-Beschwerden.

### Preisalternative: 49 EUR/Jahr

Erwaegung fuer spaetere Versionen (ab v1.0 oder bei 30+ Vorlagen):

| | 39 EUR/Jahr | 49 EUR/Jahr |
|---|---|---|
| Monatlich | 3,25 EUR | 4,08 EUR |
| Psychologie | "Unter 40" | "Unter 50" |
| Noch no-brainer? | Ja | Ja |
| Mehrumsatz bei 1.000 Kunden | — | +10.000 EUR/Jahr |
| Risiko | — | Minimal |

**Empfehlung:** Bei 39 EUR bleiben bis v1.0 oder bis 500+ zahlende Kunden. Dann auf 49 EUR erhoehen fuer Neukunden (Bestandskunden bleiben bei 39 EUR). Die 10 EUR Differenz machen bei 1.000 Kunden 10.000 EUR/Jahr aus — bei null zusaetzlichem Support-Aufwand.

---

## 4. No-Brainer-Formel

Ein Kauf wird zum No-Brainer wenn:

```
Wahrgenommener Wert > 10x Preis
UND
Risiko ≈ 0
UND
Aufwand (Kauf + Einrichtung) < 10 Minuten
```

### Wahrgenommener Wert

| Szenario | Wert | Faktor vs. 39 EUR |
|---|---|---|
| Eine vergessene Pruefung → Bussgeld | 5.000+ EUR | 128x |
| Versicherung verweigert Leistung nach Unfall | 50.000+ EUR | 1.282x |
| 2 Stunden/Quartal gespart vs. Papier | ~400 EUR/Jahr | 10x |
| Seelenfrieden ("alles dokumentiert") | Unbezahlbar | ∞ |

### Risiko minimieren

- ✓ **Open Source (GPL-3.0):** "Meine Daten gehoeren mir, die Software auch"
- ✓ **Kein Abo-Lock-in:** Servicepaket abgelaufen? Software laeuft weiter, nur Downloads + Support fallen weg
- ✓ **Kein Cloud-Risiko:** Anbieter geht pleite? Egal, Daten lokal
- ✓ **Probe-Modus:** 10 Vorlagen kostenlos, ohne Zeitlimit
- ✗ **Fehlt: Geld-zurueck-Garantie** — Empfehlung: 30 Tage, kein Risiko

### Aufwand minimieren (Ersteinrichtung)

**Aktuell:** Download → Installer → Wizard (4 Schritte) → erste Pruefung = **~10 Minuten** ✓

**Optimiert (nach Usability-Refactoring):**
Download → Installer → Wizard (3 Schritte: Checklisten → Geraet → fertig) → "Jetzt pruefen" auf Dashboard = **~5 Minuten** ← Ziel

---

## 5. Zusammenfassung: Produktvision

### Kern-Positionierung

> **Nachweis Lokal ersetzt den Aktenordner — nicht die Fachsoftware.**

Es konkurriert nicht mit Hoppe (195 EUR, komplexes Pruefmanagement) oder SafetyCulture (288 USD/Jahr, Enterprise). Es konkurriert mit **Papier, Excel und "machen wir naechste Woche"**.

### Der eine Satz, der verkauft

> "Pruefungen dokumentieren, Fristen im Blick, Nachweise auf Knopfdruck — lokal auf Ihrem Rechner, fuer 39 EUR im Jahr."

### Minimal Viable Product fuer v1.0

| Bereich | Umfang |
|---|---|
| Vorlagen-Bibliothek | 30-50 branchenspezifische Checklisten |
| Workflow | Checkliste waehlen → Geraet zuordnen → pruefen → PDF |
| Dashboard | Ueberfaellige + naechste Pruefungen als klickbare Liste |
| Benennung | "Checklisten", "Geraete & Raeume", "Pruefungen", "Maengel" |
| Einrichtung | 3 Schritte, erste Pruefung in unter 5 Minuten |
| Benachrichtigung | System-Notification bei faelligen Pruefungen |
| Preis | 39 EUR/Jahr (Servicepaket) |
| Probe | 10 Checklisten, kein Zeitlimit |
| Support | Ticket (48h), kein Telefon, kein Onboarding |

### Was NICHT in v1.0 gehoert

- Mehrbenutzer / Sync
- Kalender-Integration
- KI-Features
- ERP-Anbindung
- Mobile App
- Mandanten

---

## Quellen

- [DGUV Pruefpflichten (arsipa.de)](https://arsipa.de/pruefungen/)
- [Bussgeld ArbSchG (bgv-a3-pruefung.de)](https://bgv-a3-pruefung.de/das-nichteinhalten-der-dguv-vorschrift-3-ist-eine-straftat/)
- [KMU Digitalisierung Hemmnisse (softwarepartner.net)](https://www.softwarepartner.net/blog/digitale-transformation-kmu-herausforderungen-loesungsansaetze)
- [Handwerkszahlen (zdh.de)](https://www.zdh.de/daten-und-fakten/kennzahlen-des-handwerks/)
- [Kita-Statistik (destatis.de)](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Soziales/Kindertagesbetreuung/_inhalt.html)
- [Vereinszahlen (bvve.de)](https://bundesverband.bvve.de/vereine-in-deutschland/)
- [Wartungsplaner Hoppe Preise](https://www.wartungsplaner.de/Bestellen-Wartungsplaner-Instandhaltungssoftware.htm)
- [Pricing Micro-SaaS (getmonetizely.com)](https://www.getmonetizely.com/articles/pricing-for-micro-saas-small-product-big-revenue-strategies)
