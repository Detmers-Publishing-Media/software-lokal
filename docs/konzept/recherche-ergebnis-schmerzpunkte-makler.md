# Recherche-Ergebnis: Echte Schmerzpunkte von Versicherungsmaklern

*Stand: 12. Maerz 2026*
*Recherche-Prompt: `docs/konzept/recherche-prompt-schmerzpunkte-makler.md`*

---

## 1. Executive Summary

Versicherungsmakler in Deutschland stehen unter massivem Regulierungsdruck: 45,7 % verbringen
einen vollen Arbeitstag pro Woche (6-10 Stunden) mit buerokratischen Aufgaben, 35,8 % haben
wegen des Drucks ans Aufhoeren gedacht (BFV-Studie, 565 Teilnehmer). Die groessten Schmerzpunkte
sind Verwaltungsaufwand/IDD-Dokumentation und Bestandsuebertragung — beides nur teilweise durch
existierende Software geloest. 85 % der Makler haben ihre Nachfolge nicht geregelt bei einem
Durchschnittsalter von 52,4 Jahren. Der Markt fuer Maklerverwaltungsprogramme (MVPs) ist
fragmentiert: ueber 38 verschiedene Tools sind im Einsatz, kein Standard dominiert bei
Einzelmaklern. **Code-Fabrik hat eine realistische Chance im Bereich
"Regulatorischer Nachweis-Assistent"** — ein fokussiertes Tool fuer IDD-Dokumentation,
Weiterbildungsnachweise und Beschwerderegister, das offline funktioniert und nicht an einen
Pool gebunden ist. Courtage-Management und Bestandsuebertragung sind dagegen zu komplex
und zu gut durch MVPs abgedeckt.

---

## 2. Markt-Ueberblick

### Zielgruppe in Zahlen

| Kennzahl | Wert | Quelle |
|----------|------|--------|
| Registrierte Versicherungsmakler (§34d) | ca. 46.500 | DIHK-Register / Statista |
| Davon aktive Maklerbetriebe | ca. 14.000 | Listflix |
| Durchschnittsalter | 52,4 Jahre | procontra "Maklers Lieblinge 2025" |
| Einzelkaempfer (ohne Mitarbeiter) | ca. 50 % | Branchenschaetzung |
| Durchschnittliche Betriebsgroesse | 2-3 Mitarbeiter | Branchenschaetzung |
| Nachfolge nicht geregelt | 85 % | DEMV Blog |
| Aufhoeren wegen Regulierung erwaegt | 35,8 % | BFV/AssCompact-Studie |

### Pool-Bindung

- Grosse Maklerpools (Fonds Finanz, BCA, MAXPOOL, VEMA, blau direkt) bieten integrierte
  Tool-Landschaften, die viele Schmerzpunkte adressieren
- **Geschaetzt 30-40 % der Makler sind NICHT an einen grossen Pool gebunden** (nicht verifiziert)
- Diese Gruppe hat den groessten Bedarf an eigenstaendigen Tools
- Primaere Zielgruppe fuer Code-Fabrik: **4.000-6.000 ungebundene Einzelmakler/Kleinbueros**

---

## 3. Schmerzpunkte-Ranking

| Rang | Schmerzpunkt | Schmerz (1-5) | Loesungsreife | Adressierbar durch Desktop-Tool? |
|------|-------------|---------------|---------------|----------------------------------|
| 1 | Verwaltungsaufwand / IDD-Dokumentation | 5 | teilweise | **Ja** (Dokumenten-Templates + Checklisten) |
| 2 | Bestandsuebertragung | 5 | teilweise | Nein (braucht Versicherer-APIs) |
| 3 | Software-Fragmentierung | 4 | teilweise | Nein (Meta-Problem, kein einzelnes Tool loest das) |
| 4 | Beratungsdokumentation IDD | 4 | teilweise | **Ja** (strukturierte Protokolle + Archiv) |
| 5 | Nachfolge / Bestandsbewertung | 4 | teilweise | Bedingt (Bestandsuebersicht ja, Bewertung braucht Marktdaten) |
| 6 | Courtage / Stornohaftung | 3 | gut | Nein (in MVPs integriert, zu komplex standalone) |
| 7 | DSGVO-Nachweise | 3 | teilweise | **Ja** (Verzeichnisse + Fristen + Loeschprotokoll) |
| 8 | Beschwerdemanagement | 3 | ungeloest | **Ja** (Pflicht nach §17 VersVermV, kaum Tools) |
| 9 | Weiterbildungsnachweise IDD | 2 | gut | **Ja** (einfach, aber Mehrwert gering allein) |
| 10 | GwG/KYC-Dokumentation | 2 | teilweise | Bedingt (nur relevant bei hoeheren Summen) |

---

## 4. Detail-Analyse Top-5

### 4.1 Verwaltungsaufwand / Buerokratie (Schmerz: 5/5)

**Fakten:**
- 45,7 % der Makler: 6-10 Stunden/Woche fuer regulatorische Aufgaben (BFV-Studie)
- 28 % brauchen sogar mehr als 15 Stunden/Woche
- Ueber 60 Minuten pro Kundentermin fuer Dokumentation
- 90 %+ bewerten IDD/MiFID-II-Dokumentation als sehr aufwaendig
- 82,1 % erwarten weitere Zunahme; nur 1,2 % erwarten Entlastung

**Zitat:** "Regulatorische Anforderungen stellen mittlerweile eine existenzbedrohende
Alltagsbelastung dar, insbesondere fuer kleine und mittelstaendische Betriebe" (BFV-Studie)

**Existierende Loesungen:**
- SmartInsurTech SMART ADMIN: Automatisierung, bis 70 % Reduktion Verwaltungsaufwand
- DEMV Professional Works: Integrierte Vorgangssteuerung
- Zeitsprung MVP: Workflow-basiert
- Kosten: 50-150 EUR/Monat (typisch fuer MVP mit Verwaltungsmodul)

**Luecke:** Einzelmakler ohne MVP haben keine strukturierte Loesung. Word-Vorlagen und
Excel-Tabellen dominieren. Die MVPs sind zu teuer und zu umfangreich fuer Einzelkaempfer.

**Code-Fabrik Fit:** Hoch. Ein fokussiertes Tool fuer die haeufigsten regulatorischen
Dokumente (IDD-Protokoll, Bedarfsanalyse, Geeignetheitspruefung) mit Templates und
lokaler Archivierung waere eine echte Alternative zum MVP fuer Einzelmakler.

### 4.2 Bestandsuebertragung (Schmerz: 5/5)

**Fakten:**
- Bearbeitungsdauer bei Versicherern: 2 Monate bis 2 Jahre (blaudirekt Blog)
- Positive Ausnahmen (Allianz, Continentale): 7-10 Tage
- Negative Beispiele (Ergo, HDI, Signal): Monate bis Jahre
- "Papierberge, E-Mail-Ping-Pong und mehrfaches Nachfragen" (WIFO Blog)

**Existierende Loesungen:**
- Makler-Apps mit KI-Policen-Erkennung (Foto → automatischer Import)
- BiPRO/GDV-Standards fuer automatische Uebertragung
- Anbieter: blau direkt, WIFO, Zeitsprung, DEMV

**Code-Fabrik Fit:** Niedrig. Bestandsuebertragung braucht Versicherer-APIs (BiPRO),
Maklervollmachten, und Integration mit Versicherer-Systemen. Das ist kein
Desktop-Tool-Problem, sondern ein Oekosystem-Problem.

### 4.3 Beratungsdokumentation IDD (Schmerz: 4/5)

**Was dokumentiert werden muss:**
- Kundenwuensche und -beduerfnisse (Bedarfsanalyse)
- Besprochene Versicherungen und empfohlene Produkte
- Begruendung der Empfehlung (individuelle Passung)
- Bei Vergleichsrechnern: Hinweis auf eingeschraenkte Marktauswahl
- Bei Anlageprodukten: Geeignetheitserklaerung
- Alles in Textform VOR Vertragsabschluss

**Wie Makler das heute machen:**
- Viele noch mit Word-Vorlagen/PDF-Formularen und manueller Eingabe
- Fortschrittliche: AVERIS (Textbausteine), Smart Consult (Konzeptberatung), bridge (Fonds Finanz)
- Arbeitskreis Beratungsprozesse: kostenlose Mustervorlagen (beratungsprozesse.de)

**Luecke:** Kein guenstiges, unabhaengiges Standalone-Tool fuer strukturierte
Beratungsdokumentation. Entweder teure MVPs oder manuelle Word-Arbeit.

**Code-Fabrik Fit:** Hoch. Strukturierte Beratungsprotokolle mit Textbausteinen,
Kundenakte, und revisionssicherer Archivierung (audit-chain). Passt perfekt zu
Nachweis Lokal als Erweiterung oder eigenes Produkt.

### 4.4 Nachfolge / Bestandsbewertung (Schmerz: 4/5)

**Fakten:**
- Ueber 50 % stehen in den naechsten 10 Jahren vor der Nachfolge
- 85 % haben ihre Nachfolge nicht geregelt (DEMV)
- Nur 10-20 % kennen den tatsaechlichen Wert ihres Bestands (Resultate Institut)
- Empfohlene Vorlaufzeit: mindestens 3 Jahre

**Warum Nachfolgen scheitern:**
- Zu spaete Planung, Notverkaeufe unter Druck
- Kundenverlust nach Uebergabe drueckt den Preis
- Fehlende Dokumentation und Digitalisierung
- "Oft fehlen die grundlegendsten Dinge" (Versicherungswirtschaft-heute)

**Existierende Loesungen:**
- Resultate Institut (Bewertung + Vermittlung)
- Deutsche Versicherungsboerse (Marktplatz)
- vfm, BCA, DEMV (Nachfolge-Services ueber Pools)
- Kein Standard-Tool fuer laufende Bestandsbewertung im Makleralltag

**Code-Fabrik Fit:** Mittel. Eine einfache Bestands-Uebersicht (Kunden, Vertraege,
Courtage-Volumina) waere nuetzlich, aber die eigentliche Bewertung braucht Marktdaten
und Expertise. Eher ein Neben-Feature als ein eigenstaendiges Produkt.

### 4.5 DSGVO-Nachweise + Beschwerdemanagement (Schmerz: 3/5, aber ungeloest)

**DSGVO:**
- 83,4 % der Makler bewerten DSGVO als aufwaendig (BFV-Studie)
- Pflichten: Verarbeitungsverzeichnis, Einwilligungsmanagement, Loeschfristen, Auskunftsrecht
- Viele Makler haben kein strukturiertes Verarbeitungsverzeichnis
- Bussgelder drohen (bis 20 Mio. EUR / 4 % Umsatz), Kontrollen nehmen zu

**Beschwerdemanagement:**
- §17 VersVermV: Jeder §34d-Vermittler MUSS ein Beschwerdeverfahren vorhalten
- Muss dokumentiert, nachvollziehbar und archiviert sein
- Volumen bei Einzelmaklern: 0-5 Beschwerden/Jahr (nicht verifiziert)
- **Kaum spezialisierte Tools** fuer kleine Makler (grosse haben CRM-Module)

**Existierende Loesungen:**
- DSGVO: Datenschutz-Generatoren (z.B. Activemind, Proliance), aber generisch
- Beschwerden: Keine spezialisierten Tools fuer §34d-Einzelmakler identifiziert
- MVPs haben teilweise CRM-basierte Beschwerdeerfassung

**Code-Fabrik Fit:** Hoch fuer das Buendel. Einzeln betrachtet zu duenn (Beschwerden:
0-5/Jahr; DSGVO: einmalige Einrichtung). Aber als **Modul innerhalb eines
Nachweis-Assistenten** sehr sinnvoll — Makler muessen bei Pruefung alle Nachweise
vorlegen koennen.

---

## 5. Wettbewerbslandschaft

### Maklerverwaltungsprogramme (MVPs)

| MVP | Typ | Preis (ca.) | Staerke | Schwaeche |
|-----|-----|-------------|---------|-----------|
| SMART ADMIN | All-in-One | 80-150 EUR/Monat | Umfangreich, Automatisierung | Teuer, komplex |
| AVERIS | MVP | 50-100 EUR/Monat | Beratungsdoku, Textbausteine | Weniger Automatisierung |
| aB-Agenta | MVP | 40-80 EUR/Monat | Provisionsabrechnung | Veraltete UI |
| Keasy (DEMV) | MVP | 0 EUR (Pool) | Kostenlos ueber Pool | Pool-Bindung |
| iS2 Ameise | MVP | 50-100 EUR/Monat | Bestandsverwaltung | Komplexitaet |
| bridge (Fonds Finanz) | Online | 0 EUR (Pool) | End-to-End digital | Pool-Bindung |

*Preise sind Schaetzungen basierend auf oeffentlich verfuegbaren Informationen; nicht alle
Anbieter veroeffentlichen Preise.*

### Spezial-Tools

| Tool | Bereich | Preis | Bewertung |
|------|---------|-------|-----------|
| Arbeitskreis Beratungsprozesse | IDD-Vorlagen | Kostenlos | Gut, aber nur PDFs/Word |
| Datenschutz-Generatoren | DSGVO | 20-50 EUR/Monat | Generisch, nicht makler-spezifisch |
| Fonds Finanz IDD-Tool | Weiterbildung | Kostenlos (Pool) | Pool-gebunden |
| Resultate Institut | Nachfolge | Individuell | Beratung, kein Self-Service |

### Luecke im Markt

**Kein guenstiges, unabhaengiges Standalone-Tool** das folgendes vereint:
- Strukturierte IDD-Beratungsdokumentation (mit Textbausteinen)
- DSGVO-Verarbeitungsverzeichnis + Loeschfristen
- Beschwerderegister nach §17 VersVermV
- Weiterbildungsnachweise IDD (15h/Jahr)
- Revisionssichere lokale Archivierung
- Offline-faehig, kein Cloud-Zwang, kein Pool erforderlich

Die MVPs bieten viel davon, aber:
- Kosten 50-150 EUR/Monat (600-1.800 EUR/Jahr)
- Sind fuer Einzelmakler oft zu komplex
- Erfordern haeufig Pool-Bindung fuer den vollen Funktionsumfang
- Cloud-basiert (Datenhoheit-Bedenken bei DSGVO-sensiblen Daten)

---

## 6. Code-Fabrik Fit-Analyse

| Schmerzpunkt | Desktop-tauglich | Electron+SQLite | Wettbewerbsvorteil | 39 EUR/Jahr passt | Wiederverwendung | Gesamt-Fit |
|-------------|-----------------|-----------------|-------------------|-------------------|------------------|------------|
| IDD-Dokumentation | Ja | Ja | Preis + Offline + Unabhaengigkeit | Ja | audit-chain, finanz-shared | **Hoch** |
| DSGVO-Nachweise | Ja | Ja | Lokal = DSGVO-konform by design | Ja | audit-chain | **Hoch** |
| Beschwerderegister | Ja | Ja | Einziges Standalone-Tool | Ja | audit-chain, nachweis-lokal | **Hoch** |
| Weiterbildung IDD | Ja | Ja | Einfach, als Add-on | Ja | — | Mittel |
| Nachfolge-Uebersicht | Bedingt | Ja | Nicht wirklich | Ja | — | Niedrig |
| Bestandsuebertragung | Nein | — | — | — | — | **Kein Fit** |
| Courtage-Kontrolle | Bedingt | Ja | Nein (MVPs besser) | Ja | finanz-shared | Niedrig |

---

## 7. Produktempfehlung

### Empfehlung: "Nachweis Lokal — Makler-Edition"

**Oder eigenstaendiges Produkt: "Makler-Nachweis" (Arbeitstitel)**

Ein fokussiertes Desktop-Tool fuer regulatorische Nachweispflichten von §34d-Vermittlern.

### Kern-Features (MVP)

1. **IDD-Beratungsprotokoll**
   - Strukturierte Eingabemaske (Kundenwuensche, Beduerfnisse, Empfehlung, Begruendung)
   - Textbausteine fuer gaengige Sparten (Leben, Sach, Kranken, Gewerbe)
   - PDF-Export (fuer Kundenunterschrift)
   - Revisionssichere Archivierung (audit-chain Hash-Kette)

2. **Beschwerderegister (§17 VersVermV)**
   - Erfassung: Datum, Beschwerdefuehrer, Gegenstand, Massnahmen, Ergebnis
   - Fristenueberwachung
   - Jahresbericht-Export (fuer IHK/BaFin bei Pruefung)

3. **DSGVO-Nachweismappe**
   - Verarbeitungsverzeichnis (vorbefuellt fuer typische Makler-Taetigkeiten)
   - Einwilligungs-Tracking (welcher Kunde, wann, wofuer)
   - Loeschfristen-Kalender (automatische Erinnerung)
   - Auskunftsanfragen-Log

4. **Weiterbildungs-Tracker**
   - 15h/Jahr IDD-Pflicht tracken
   - Zertifikate archivieren (Scan/Foto → lokale Ablage)
   - Jahresuebersicht fuer IHK-Nachweis

### Architektur

- **Basis:** Nachweis Lokal Framework (Electron + Svelte 5 + SQLite)
- **Integritaet:** audit-chain (HMAC-SHA256 Hash-Kette ueber alle Eintraege)
- **Bundle:** `B-08-nachweis` (Erweiterung) oder neues Bundle `B-09-makler-nachweis`
- **Wiederverwendung:** electron-platform, app-shared, ui-shared, audit-chain

### Entwicklungsaufwand

| Feature | Aufwand | Abhaengigkeiten |
|---------|---------|-----------------|
| IDD-Beratungsprotokoll | M (2-3 Wochen) | Textbaustein-Engine, PDF-Export |
| Beschwerderegister | S (1 Woche) | CRUD + Fristen |
| DSGVO-Nachweismappe | M (2-3 Wochen) | Vorlagen, Fristen-Engine |
| Weiterbildungs-Tracker | S (1 Woche) | Einfaches CRUD + Datei-Archiv |
| **Gesamt MVP** | **L (6-8 Wochen)** | |

### Marktchance

**Konservative Rechnung:**
- Primaere Zielgruppe: 4.000-6.000 ungebundene Einzelmakler/Kleinbueros
- Erreichbarkeit (ohne Marketing-Budget): 5-10 % in 2 Jahren = 200-600 Nutzer
- Conversion (Probe → Kauf): 10-15 % = 20-90 zahlende Kunden
- Umsatz bei 39 EUR/Jahr: **780-3.510 EUR/Jahr**

**Optimistische Rechnung:**
- Inkl. Pool-Makler die eigenstaendige Tools bevorzugen: 10.000 potenzielle Nutzer
- Erreichbarkeit mit SEO + Fachmagazin-Erwaehnung: 10-15 % = 1.000-1.500
- Conversion: 15-20 % = 150-300 zahlende Kunden
- Umsatz bei 39 EUR/Jahr: **5.850-11.700 EUR/Jahr**

### Go / No-Go

**Bedingt Go — mit klaren Einschraenkungen:**

**Pro:**
- Echte Luecke im Markt (kein guenstiges Standalone-Tool fuer regulatorische Nachweise)
- Hohe Wiederverwendung bestehender Code-Fabrik-Infrastruktur
- Passt perfekt zur Positionierung (lokal, pruefbar, kein Cloud-Zwang)
- audit-chain als USP (kryptographisch nachweisbare Integritaet)
- 39 EUR/Jahr vs. 600-1.800 EUR/Jahr fuer MVPs = starkes Preisargument
- §17 VersVermV Beschwerderegister: quasi kein Wettbewerb fuer Einzelmakler

**Contra:**
- Kleiner Markt (Einzelmakler ohne Pool-Anbindung)
- Umsatzpotenzial begrenzt (realistisch unter 5.000 EUR/Jahr)
- Makler sind keine fruehen Adopter (Durchschnittsalter 52,4)
- Vertriebskanal unklar (kein Budget fuer Fachmagazin-Werbung)
- IDD-Beratungsprotokoll konkurriert mit kostenlosen Mustervorlagen

**Empfehlung:**
Umsetzen als **Erweiterung von Nachweis Lokal** (kein eigenstaendiges Produkt), um
den Entwicklungsaufwand minimal zu halten. Nachweis Lokal bekommt "Branchenpakete" —
das Makler-Paket ist eines davon. So profitiert das Kernprodukt von branchenspezifischen
Templates, ohne dass ein komplett neues Produkt gewartet werden muss.

Prioritaet: **Nach Rechnung Lokal v1.0**, da Rechnung Lokal den groesseren Markt
adressiert (alle Kleinunternehmer, nicht nur Makler).

---

## 8. Quellen

### Studien und Statistiken
- BFV Vermittlerbefragung Regulatorik: https://www.bfv-versicherungsmakler.de/aktuelle-vermittlerbefragung-zur-wachsenden-regulatorik-versicherungsmakler-beklagen-hohen-zeitaufwand-fuer-buerokratische-aufgaben/
- Versicherungsbote — Jeder dritte Makler denkt ans Aufhoeren: https://www.versicherungsbote.de/id/4940209/Jeder-dritte-Makler-denkt-wegen-Regulierungsdruck-ans-Aufhoeren/
- Resultate Institut — 10-20 % kennen Bestandswert: https://www.resultate-institut.de/nur-10-bis-20-prozent-der-makler-kennen-den-tatsaechlichen-wert-ihres-bestands/
- procontra — Durchschnittsmakler 2025: https://www.procontra-online.de/maklerburo/artikel/so-sieht-der-durchschnittsmakler-2025-aus
- Versicherungsbote — Stornohaftung laenger als 5 Jahre: https://www.versicherungsbote.de/id/4911814/Stornohaftung-Viele-Vermittler-haften-laenger-als-fuenf-Jahre/
- Listflix — Versicherungsmakler Statistik: https://listflix.de/statistik/versicherungsmakler/

### Branchenmedien
- Pfefferminzia — Buerokratie-Studie: https://www.pfefferminzia.de/top-thema-assekuranz-der-zukunft/studie-des-bfv-makler-fuerchten-zunehmende-buerokratie/
- Pfefferminzia — Bestandsuebertragungen: https://www.pfefferminzia.de/vertrieb/kolumne-warum-bestandsuebertragungen-nicht-immer-leicht-umzusetzen-sind/2/
- AssCompact — Verzahnung digitaler Tools: https://www.asscompact.de/nachrichten/verzahnung-digitaler-tools-das-taegliche-dilemma-der-makler
- Versicherungswirtschaft-heute — Nachfolge: https://versicherungswirtschaft-heute.de/maerkte-und-vertrieb/2020-01-21/nachfolge-fuer-versicherungsmakler-wie-gelingt-der-unternehmensverkauf/

### Anbieter und Tools
- blaudirekt — Bestandsuebertragung: https://www.blaudirekt.de/blog/2016/08/wie-schnell-muss-ein-versicherer-bestandsuebertragungen-bearbeiten/
- WIFO — Digitaler Makler: https://wifo.com/blog/digitaler-versicherungsmakler-bestandsuebertragung
- wiemakler.de — 38+ Tools: https://www.wiemakler.de/software/
- SmartInsurTech — Digitalisierung: https://www.smartinsurtech.de/digitalisierung-versicherungsmakler/
- SmartInsurTech — Provisionsabrechnung: https://www.smartinsurtech.de/provisionsabrechnung/
- maklerkonzepte.com — Praxisbericht: https://maklerkonzepte.com/provisionsabrechnung-warum-ein-maklerverwaltungsprogramm-unerlaesslich-ist-praxisbericht/
- DEMV — Maklernachfolge: https://www.demv.de/blog/makleralltag/maklernachfolge

### Regulatorik
- Versicherungsmagazin — Beratungspflicht: https://www.versicherungsmagazin.de/lexikon/beratungs-und-dokumentationspflicht-1944711.html
- Arbeitskreis Beratungsprozesse — Downloads: https://www.beratungsprozesse.de/downloads/
- Sachkundegurus — IDD 15 Stunden: https://www.sachkundegurus.de/journal/die-15-stunden-idd-weiterbildungspflicht-im-jahr
- Fonds Finanz — IDD Weiterbildung: https://www.fondsfinanz.de/weiterbildung/idd-weiterbildung

### Hinweise zur Quellenqualitaet
- Alle Quellen sind oeffentlich zugaenglich und stammen von Branchenmedien oder Anbietern
- Die BFV-Studie (565 Teilnehmer) ist die belastbarste Quelle fuer Schmerzpunkt-Quantifizierung
- Marktgroessen-Schaetzungen (Pool-Bindung, Einzelmakler-Anteil) sind teilweise nicht verifiziert
- Preis-Angaben fuer MVPs basieren auf oeffentlich verfuegbaren Informationen und koennen abweichen
