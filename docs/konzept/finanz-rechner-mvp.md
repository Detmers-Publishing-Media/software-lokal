# Finanz-Rechner MVP — Bundle B-24 Starterpaket

*Vorgemerkt fuer Release v0.6.3*
*Stand: 2026-03-04*

---

## 1. Uebersicht

5 risikofreie Rechner-Tools fuer Mehrsparten-Versicherungsmakler. Kein CRM, kein Verwaltungssystem, keine Beratungssoftware. Jeder Rechner loest genau ein konkretes Problem das heute mit Taschenrechner oder Excel geloest wird — strukturierter, nachvollziehbarer und mit druckbarem Ergebnis.

### Warum Rechner zuerst?

1. **Null Beratungshaftung** — der Rechner rechnet, der Makler beraet
2. **Transparenz ist einfach** — man kann exakt zeigen welche Formel verwendet wird
3. **Schnell entwickelt** — viele in 2-3 Tagen lauffaehig
4. **Kein DSGVO-Risiko** — keine personenbezogenen Daten
5. **Tech-Proof** — testet die gesamte Pipeline (Entwicklung → Release → Portal → Key → Download)

---

## 2. Die 5 Rechner im Detail

### 2.1 BeitragsAnpassungsRechner

**Was er rechnet:**
Versicherer erhoeht Praemie von X auf Y. Der Rechner zeigt:
- Erhoehung absolut: Y - X = Z EUR/Jahr
- Erhoehung prozentual: (Y - X) / X × 100
- Mehrkosten ueber 5 Jahre: Z × 5
- Sonderkuendigungsrecht: Ja/Nein (abhaengig von Erhoehung > 10%)

Fuer den Mehrsparten-Makler besonders relevant — Beitragsanpassungen kommen bei KFZ, Hausrat und Kranken regelmaessig. Er tippt die Zahlen ein und hat sofort das Gespraech mit dem Kunden vorbereitet.

**Transparenz-Box:**
> Dieser Rechner addiert Beitragsunterschiede. Er empfiehlt keine Handlung. Die Entscheidung ob ein Wechsel sinnvoll ist liegt beim Berater.

**Aufwand:** 3 Tage
**Haftungs-Ampel:** 🟢 GRUEN

### 2.2 StornoHaftungsRechner

**Was er rechnet:**
```
Abschluss-Courtage × (verbleibende Haftungsmonate / Gesamt-Haftungsmonate)
= Rueckzahlungsbetrag heute
```

Der Makler gibt ein: Courtage bei Abschluss, Haftungszeit in Monaten, Vertragsbeginn. Der Rechner zeigt tagesgenau: Wie viel muesste heute zurueckgezahlt werden? Wie entwickelt sich das ueber die naechsten 12 Monate? Kleine Grafik: Rueckzahlungsrisiko sinkt mit jedem Monat.

**Warum kein Haftungsrisiko:** Er berechnet ausschliesslich die Rueckzahlungsverpflichtung des Maklers gegenueber dem Versicherer — das ist reine Mathematik, kein Kundenbezug.

**Transparenz-Box:**
> Formel: Courtage × (RestMonate / GesamtMonate). Dieser Rechner zeigt eine rechnerische Schaetzung. Massgeblich ist die tatsaechliche Courtagevereinbarung mit dem Versicherer.

**Aufwand:** 4 Tage
**Haftungs-Ampel:** 🟢 GRUEN

### 2.3 RatenzuschlagRechner

**Was er rechnet:**
```
Jahrespraemie / 12 × 12 = theoretisch gleich
Aber: Jahrespraemie × 1,06 (z.B.) = tatsaechliche monatliche Summe
Ratenzuschlag absolut = Differenz
Ratenzuschlag prozentual auf Jahresbasis
```

Zeigt dem Kunden im Gespraech: "Monatliche Zahlung kostet Sie X EUR mehr pro Jahr als Jahreszahlung." Simpel, aber im Kundengespraech taeglich nuetzlich.

**Transparenz-Box:**
> Differenz zwischen Jahreszahlung und Summe der Monatsbeitraege. Keine Empfehlung zur Zahlweise.

**Aufwand:** 2 Tage
**Haftungs-Ampel:** 🟢 GRUEN

### 2.4 CourtagenBarwertRechner

**Was er rechnet:**
```
Jaehrliche Bestandscourtage × Faktor (marktueblich 2-4)
= Bestandsbewertung (Barwert)
```

Eingabe: Courtage-Summe pro Jahr je Sparte, gewaehlter Faktor. Ausgabe: Gesamtbewertung mit Sparten-Aufschluesselung. Nuetzlich fuer Nachfolgeplanung, Bankgespraeche, Poolanbindungs-Verhandlungen.

**Transparenz-Box:**
> Formel: Jahrescourtage × Faktor. Der Faktor ist marktueblich aber nicht normiert. Dieser Rechner liefert eine Orientierungsgroesse, keine verbindliche Unternehmensbewertung.

**Aufwand:** 3 Tage
**Haftungs-Ampel:** 🟢 GRUEN

### 2.5 SpartenDeckungsGrad

**Was er rechnet:**
Kein Rechenwerk im engeren Sinne, eher ein strukturierter Spiegel — aber vollstaendig haftungsfrei weil er nur zaehlt:
- Eingabe: Welche Sparten hat Kunde X? (Checkboxen)
- Ausgabe: X von 8 Basis-Sparten vorhanden. Nicht vorhanden: [Liste]

**Warum kein Haftungsrisiko:** Er empfiehlt nichts. Er zaehlt nur was da ist und was nicht da ist — wie eine Checkliste. Was der Makler daraus macht ist seine professionelle Entscheidung.

**Transparenz-Box:**
> Dieses Tool zeigt welche Sparten erfasst sind. Es bewertet weder den Bedarf noch die Notwendigkeit einer Absicherung. Bedarfsanalyse und Empfehlung obliegen dem Berater.

**Aufwand:** 4 Tage
**Haftungs-Ampel:** 🟢 GRUEN (mit 🟡 Disclaimer-Pflicht wegen impliziter "Luecken"-Anzeige)

---

## 3. Transparenz-Box Designprinzip

Die Transparenz-Box ist kein Kleingedrucktes, sondern steht direkt neben dem Ergebnis:

```
┌──────────────────────────────────────────────┐
│  Ergebnis: 1.240 EUR Rueckzahlungsrisiko     │
│                                               │
│  📐 Was dieser Rechner tut:                  │
│  Courtage × (RestMonate / GesamtMonate)       │
│                                               │
│  Was er NICHT tut:                            │
│  Er bewertet nicht ob eine Kuendigung         │
│  verhindert werden sollte.                    │
└──────────────────────────────────────────────┘
```

Das ist gleichzeitig ein Verkaufsargument: Der Makler kann dem Kunden zeigen "schau, hier ist die genaue Formel" — das schafft Vertrauen, nicht Misstrauen.

Konkretes Beispiel mit echten Zahlen:
```
┌──────────────────────────────────────────────┐
│  Ergebnis: 1.240 EUR Rueckzahlungsrisiko     │
│                                               │
│  📐 Formel:                                  │
│  3.100 EUR × (16 / 40 Monate) = 1.240 EUR   │
│                                               │
│  ⚠️  Dieser Rechner schaetzt auf Basis       │
│  deiner Eingaben. Massgeblich ist deine       │
│  Courtagevereinbarung mit dem Versicherer.    │
└──────────────────────────────────────────────┘
```

---

## 4. Empfohlene Startreihenfolge

| # | Rechner | Aufwand | Warum zuerst? |
|---|---------|---------|---------------|
| 1 | BeitragsAnpassungsRechner | 3 Tage | Taeglich gebraucht, triviale Formel, sofort deploybar |
| 2 | StornoHaftungsRechner | 4 Tage | Hoher persoenlicher Nutzen fuer den Makler selbst |
| 3 | RatenzuschlagRechner | 2 Tage | Kundengespraech-Tool, sehr einfach |
| 4 | CourtagenBarwertRechner | 3 Tage | Differenziert, kaum Konkurrenz |
| 5 | SpartenDeckungsGrad | 4 Tage | Bruecke zu spaeteren Bestandstools |

**Gesamtaufwand:** ca. 3 Wochen (16 Arbeitstage)

---

## 5. Finanzberater-Perspektive: Was bekommt er, was nicht

### Was du bekommst

Fuenf Rechenhelfer fuer deinen Arbeitsalltag. Kein CRM, kein Verwaltungssystem, keine Datenbank. Jeder Rechner loest genau ein konkretes Problem das du heute wahrscheinlich mit dem Taschenrechner oder einer Excel-Zelle loest — nur strukturierter, nachvollziehbarer und mit einem druckbaren Ergebnis.

**BeitragsAnpassungsRechner:**
Du tippst die alte und neue Praemie ein. Der Rechner zeigt dir sofort: wie viel teurer in Euro, wie viel teurer in Prozent, wie viel das ueber 5 Jahre ausmacht, und ob die Erhoehung so gross ist dass ein Sonderkuendigungsrecht entstehen koennte (Schwellenwert >10% als Orientierung). Du kannst das Ergebnis als PDF ausdrucken und dem Kunden hinlegen.

Du bekommst nicht: Der Rechner sagt dir nicht ob du wechseln sollst. Er bewertet nicht ob die neue Praemie marktueblich ist. Er vergleicht keine anderen Anbieter.

**StornoHaftungsRechner:**
Du gibst ein: die Abschluss-Courtage, die vereinbarte Haftungszeit in Monaten, und das Vertragsdatum. Der Rechner zeigt dir auf den Tag genau wie viel du heute zurueckzahlen muesstest wenn der Vertrag storniert wird. Dazu eine kleine Grafik die zeigt wie dieses Risiko Monat fuer Monat sinkt.

Du bekommst nicht: Der Rechner kennt nicht die genauen Bedingungen deiner Courtagevereinbarung mit dem jeweiligen Versicherer. Er beruecksichtigt keine Sonderregelungen bei Poolanbindungen. Im Streitfall gilt der Vertrag, nicht der Rechner.

**RatenzuschlagRechner:**
Du gibst Jahrespraemie und Zahlweise ein. Der Rechner zeigt: Was kostet monatliche Zahlung im Jahr mehr als jaehrliche? Schnell, simpel, im Kundengespraech auf dem Laptop zeigbar.

Du bekommst nicht: Keine Empfehlung welche Zahlweise besser ist.

**CourtagenBarwertRechner:**
Du gibst deine jaehrliche Bestandscourtage ein. Du waehlst einen Bewertungsfaktor (Schieberegler von 2 bis 4). Der Rechner zeigt: Ungefaehrer Marktwert deines Bestands heute.

Du bekommst nicht: Keine verbindliche Unternehmensbewertung. Qualitative Faktoren (Kundenaltersstruktur, Stornoquote, Spartenmix) fliessen nicht ein.

**SpartenDeckungsGrad:**
Du setzt Haekchen: Welche Sparten betreust du bereits? Der Rechner zaehlt: X von 8 Basissparten vorhanden. Praktisch vor dem Jahresgespraech.

Du bekommst nicht: Keine Bedarfsanalyse. Die Liste fehlender Sparten ist keine To-Do-Liste, sondern ein Gespraechseinstieg.

### Zusammenfassung: Bekommst du / Bekommst du nicht

| Bekommst du | Bekommst du nicht |
|-------------|-------------------|
| Courtage-Rueckzahlungsrisiko in EUR | Vertragsauslegung |
| Praemien-Differenz, Prozent, Mehrkosten | Marktvergleich |
| Zahlweise-Ratenzuschlag exakt | Empfehlung was besser ist |
| Bestands-Orientierungswert Barwert | Verbindliche Bewertung |
| Sparten-Uebersicht was vorhanden ist | Bedarfsanalyse |
| Generell: Transparente Mathematik | Beratung, Empfehlung, Haftung |

### Was diese Software grundsaetzlich nicht ist

- **Keine Beratungssoftware.** Sie analysiert keine Kundenbeduerfnisse, erstellt keine Bedarfsanalysen, gibt keine Produktempfehlungen und ersetzt keine qualifizierte Beratung nach § 61 VVG.
- **Kein CRM.** Kundenstammdaten, Vertragshistorien und Dokumente werden in dieser ersten Version nicht verwaltet — bewusst, weil dort die DSGVO-Anforderungen deutlich hoeher sind.
- **Keine Compliance-Software.** Die Rechner unterstuetzen den Arbeitsalltag, ersetzen aber nicht die regulatorischen Pflichten nach VersVermV, IDD oder GwG.

### Der Wert

> Der Wert liegt nicht darin dass die Software klueger ist als du. Der Wert liegt darin
> dass du in 30 Sekunden eine saubere Zahl auf dem Tisch hast — statt 3 Minuten im
> Taschenrechner oder einer Excel die du vor 2 Jahren gebaut hast und heute nicht mehr
> ganz verstehst.

---

## 6. MVP-Strategie: Open Source + Service-Abo

### Grundprinzip: Software frei, Service bezahlt

Alle 5 Rechner sind vollstaendig funktionsfaehig, Open Source (GPL 3.0) und kostenlos auf GitHub verfuegbar. Jeder Rechner lebt in einem eigenen Repository und kann einzeln heruntergeladen, kompiliert und genutzt werden — inkl. PDF-Export.

Das bezahlte Produkt ist die **Finanz-Rechner-Toolbox**: eine integrierte App die alle Rechner unter einer Oberflaeche buendelt und Service-Features mitbringt die ueber den reinen Rechner hinausgehen.

### Warum Open Source?

- **Vertrauen**: Makler koennen den Quellcode pruefen — wichtig bei Finanz-Tools
- **Kein Risiko fuer den Nutzer**: Die Software gehoert ihm, nicht uns
- **Community-Effekte**: Bug-Reports, Feature-Requests, evtl. Contributions
- **Differenzierung**: Nicht die Software ist das Produkt, sondern der Service drumherum
- **Kein Kopierschutz-Aufwand**: Keine Lizenzpruefung, kein DRM, kein Wasserzeichen

### Community-Version (GitHub, GPL 3.0)

Jeder Rechner als eigenes GitHub-Repository:

| Repository | Inhalt |
|-----------|--------|
| `finanz-rechner-beitragsanpassung` | BeitragsAnpassungsRechner |
| `finanz-rechner-stornohaftung` | StornoHaftungsRechner |
| `finanz-rechner-ratenzuschlag` | RatenzuschlagRechner |
| `finanz-rechner-courtagen-barwert` | CourtagenBarwertRechner |
| `finanz-rechner-spartendeckung` | SpartenDeckungsGrad |

**Was jeder Community-Nutzer bekommt:**
- Vollstaendige Funktionalitaet des jeweiligen Rechners
- PDF-Export
- Transparenz-Box mit Formeln
- Disclaimer
- Quellcode zum Selbstkompilieren
- GitHub Releases (vorkompilierte Binaries)

### Finanz-Rechner-Toolbox (bezahlt, mit Key)

Die Toolbox ist das integrierte Produkt fuer Makler die keine Lust haben 5 einzelne Tools zu verwalten:

| Feature | Community (GitHub) | Toolbox (mit Key) |
|---------|-------------------|-------------------|
| Alle 5 Rechner | Einzeln, je ein Repo | Integriert in einer App |
| PDF-Export | Ja | Ja |
| Fertige Installer (EXE/DMG) | Nein (selbst kompilieren oder GitHub Release) | Ja |
| Update-Checker | Nein | Ja (neue Rechner automatisch) |
| Gebrandete PDFs (Makler-Logo) | Nein | Ja |
| Support via Portal (48h) | Nein (nur GitHub Issues) | Ja |
| Feature-Voting | Nein | Ja |
| Report-Vorlagen | Nein | Ja |

### Preismodell

```
Community (GitHub, GPL 3.0):
  Alle 5 Rechner einzeln als GitHub-Repos
  Vollstaendige Funktionalitaet inkl. PDF-Export
  Selbst kompilieren oder GitHub Release

Finanz-Toolbox (mit Key):
  39 EUR Einmalkauf oder 29 EUR/Jahr Abo
  Alle Rechner in einer integrierten App
  Fertige Installer (EXE/DMG)
  Update-Checker + neue Rechner automatisch
  Gebrandete PDFs (Makler-Logo)
  Support via Portal (48h)
  Feature-Voting
```

### MVP-Checkliste

**Muss fertig sein vor dem ersten Key-Verkauf:**
- [ ] Alle 5 Rechner lauffaehig
- [ ] PDF-Export funktioniert
- [ ] GitHub-Repos angelegt (GPL 3.0)
- [ ] Toolbox-App: alle Rechner integriert
- [ ] Portal: Kauf → Key → Download funktioniert
- [ ] Installer (mind. EXE) funktioniert
- [ ] Impressum + Datenschutzerklaerung
- [ ] Disclaimer in jedem Rechner sichtbar

**Kann spaeter:**
- [ ] Eingaben speichern
- [ ] Gebrandete PDFs (Makler-Logo)
- [ ] Update-Checker
- [ ] Feature-Voting im Portal
- [ ] Report-Vorlagen
- [ ] DMG-Installer (macOS)

### Aufwand bis zum ersten verkaufbaren Key

- 5 Rechner: ~3 Wochen
- PDF-Export: ~3 Tage
- Toolbox-Integration (eine App, alle Rechner): ~3 Tage
- GitHub-Repos + GPL 3.0 Lizenz: ~1 Tag
- Portal-Integration (Kauf → Key → Download): existiert bereits
- Installer (EXE): ~2 Tage
- **Realistisch: 4-5 Wochen bis zum ersten zahlenden Kunden**

### Break-Even Kalkulation

```
Entwicklung (einmalig):     ~5 Wochen (200h bei 20h/Woche x2)
Preis Toolbox:              39 EUR Einmalkauf oder 29 EUR/Jahr

Bei 50 EUR/h Opportunitaetskosten = 10.000 EUR Invest
→ Break-Even bei 257 Einmalkaeufern (oder 345 Jahres-Abos)

Realistisch in 12 Monaten:
  0,1% von ~230.000 Vermittlern = 230 Kunden
  Mix 60/40 (Einmalkauf/Abo):
    138 × 39 EUR = 5.382 EUR
    92 × 29 EUR  = 2.668 EUR
    Summe Jahr 1 = 8.050 EUR

  Jahr 2 (Abo-Erneuerungen + Neukunden):
    ~150 Abo-Kunden × 29 EUR = 4.350 EUR + Neukunden

Solo kein grosses Geschaeft — aber als Fundament fuer B-21/B-23:
Wer die Rechner kennt und schaetzt kauft spaeter die Suite.
Open Source baut Vertrauen auf das spaeter in Umsatz konvertiert.
```

---

## 7. Zusaetzlicher Rechner (Reserve)

### HaftpflichtSchadenRueckstellungsRechner

**Was er rechnet:**
Fuer Gewerbekunden — welche Rueckstellung bei einem Haftpflichtschaden bis zur Regulierung?
```
Selbstbehalt + geschaetzte Vorleistung × Wahrscheinlichkeit = Rueckstellung
```

Eingabe: Selbstbehalt, erwartete Regulierungsdauer, Branche (Pauschale). Rein rechnerisch, keine Bewertung ob die Versicherungssumme ausreicht.

**Transparenz-Box:**
> Pauschale Schaetzformel auf Basis von Branchendurchschnittswerten. Keine Schadenbewertung, keine Deckungsaussage.

**Aufwand:** 3 Tage
**Haftungs-Ampel:** 🟡 GELB (Disclaimer-Pflicht wegen "Schaetzung")

**Status:** Reserve-Tool. Wird nach MVP-Feedback evaluiert ob es in die erste Version aufgenommen wird oder in Stufe 2 kommt.
