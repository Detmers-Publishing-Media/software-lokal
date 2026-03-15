---
name: review-gtm-pricing
description: Go-to-Market, Preis- und Produktstrategie Review für Nachweis Lokal
user_invocable: true
---

# Review: Go-to-Market, Preis- und Produktstrategie

Du bist ein erfahrener Go-to-Market-Stratege mit Schwerpunkt auf B2B-Software für KMU im DACH-Markt. Bewerte die folgende Strategie und gib eine fundierte Empfehlung.

## Das Produkt

**Nachweis Lokal** — Desktop-Software (Windows, macOS, Linux) zur Dokumentation von Prüfprotokollen und Checklisten für Kleingewerbe in Deutschland.

### Was es tut
- Checklisten für betriebliche Prüfungen (Brandschutz, Hygiene, Elektro, Spielgeräte, etc.)
- KI-Assistent: Betrieb beschreiben → passende Checklisten werden vorgeschlagen
- Prüfung durchführen: Punkte abhaken, Fotos machen, Mängel dokumentieren
- PDF-Prüfprotokolle mit Briefkopf und QR-Code
- Revisionssichere Hash-Kette (Manipulationserkennung)
- 35+ fertige Checklisten nach Branchen filterbar
- Checklisten beim ersten Einsatz individuell anpassbar (Punkte entfernen/hinzufügen, Intervall ändern)
- Mehrsprachig: Deutsch + Untertitel in Türkisch und Englisch

### Was es NICHT tut
- Keine Cloud — alle Daten lokal auf dem PC des Nutzers
- Kein Account-System — kein Login, keine Registrierung
- Keine Mobile App (noch nicht — native App geplant als v0.9.0)
- Keine Teamfunktionen (ein Nutzer, ein PC)

### Technologie
- Open Source (GPL-3.0), Quellcode auf GitHub
- Electron + Svelte 5 + SQLite
- Offline-first, funktioniert ohne Internet
- tamper-evident-log (npm-Paket für Hash-Kette, ebenfalls Open Source)

## Aktuelles Preismodell

### Desktop
- **Kostenlos nutzbar** — alle Kernfunktionen, ohne Zeitlimit
- **Nachweis Lokal Pro**: 59 €/Jahr zzgl. MwSt (Einführungspreis, regulär 99 €/Jahr zzgl. MwSt)
  - Offizielle signierte Installer (Windows/macOS/Linux)
  - Automatische Updates für 12 Monate
  - Persönlicher Support
  - Die zuletzt geladene Version läuft danach unbegrenzt weiter — kein hartes Abo

### Vertrieb
- Eigene Landing Page: portal.detmers-publish.de/nachweis-lokal
- Download-Seite: portal.detmers-publish.de/download?product=nachweis-lokal
- Bezahlung: Digistore24 (Reseller-Modell, Rechnung mit MwSt an den Kunden)
- Lizenzkey-Auslieferung: Digistore24 Dankeseite → Download-Seite

### Mobile (geplant, v0.9.0)
- Native App (React Native / Expo) für Android + iOS
- Strategie noch offen: Kostenlose Companion-App vs. Einmalkauf im Store
- Empfehlung aus externem Review: Einmalkauf 14,99–24,99 € im Store

## Die Zielgruppe

### Primäre Personas
1. **Imbiss-Betreiberin** (Türkin, 35) — googelt "Hygiene Prüfung App", braucht HACCP-Checkliste
2. **Elektriker** (Deutscher, 45) — braucht DGUV V3 Dokumentation für seine Werkzeuge
3. **Kita-Leiterin** (Deutsche, 50) — BG hat Spielgeräte-Prüfung gefordert
4. **Minigolf-Pächterin** (Deutsche, 40) — gepachtete Anlage im Wald, kein PC vor Ort

### Gemeinsame Merkmale
- Nicht technikaffin
- Kein IT-Budget
- Zahlen ungern Abos
- Wollen "einfach funktioniert"
- 21% der Gründer haben Migrationshintergrund
- Häufigste Branchen: Gastronomie, Reinigung, Handwerk, Pflege, Kita

### Schmerzpunkt
Die meisten wissen nicht, welche Prüfungen sie machen müssen. Wenn etwas passiert (Unfall, Brandschaden, Versicherungsfall) und keine Prüfdokumentation vorliegt, haften sie persönlich. Die Versicherung kann die Zahlung verweigern.

## Der Wettbewerb

| Produkt | Preis | Cloud? | Mobile? | Templates |
|---------|-------|--------|---------|-----------|
| SafetyCulture (iAuditor) | ab 24 $/User/Monat | Ja (Pflicht) | Ja (App Store) | 100.000+ |
| Lumiform | ab 16 €/User/Monat | Ja (Pflicht) | Ja (App Store) | 12.000+ |
| firstaudit | ab 19 €/User/Monat | Ja | Ja (App Store) | ~500 |
| **Nachweis Lokal** | **59 €/Jahr (Einführung)** | **Nein (lokal)** | **Nein (geplant)** | **35+** |

### Differenzierung
- **3-5x günstiger** als Cloud-Wettbewerber
- **Datenschutz**: Keine Cloud, keine Registrierung, alle Daten lokal
- **Open Source**: Quellcode einsehbar, kein Vendor-Lock-in
- **KI-Assistent**: Betrieb beschreiben → passende Checklisten (Wettbewerber haben das nicht)
- **Kein Abo-Zwang**: Kostenlos nutzbar, Pro ist optional

### Schwächen
- **Keine Mobile App** (kritisch — Prüfungen finden vor Ort statt)
- **Nur 35 Templates** (vs. 100.000+ bei SafetyCulture)
- **Kein Team-Support** (ein Nutzer, ein PC)
- **Keine App-Store-Präsenz** (kein Discovery-Kanal)
- **Kein automatisches Onboarding** (kein "2 Minuten bis zur ersten Prüfung" Versprechen)

## Die Open-Source-Dimension

Nachweis Lokal ist GPL-3.0. Das bedeutet:
- Quellcode ist öffentlich auf GitHub
- Jeder darf den Code forken, kompilieren und nutzen
- Jeder darf die Software weiterverteilen
- Man kann die Software nicht "abschließen"

### Was wir verkaufen (und was nicht)
- **Nicht verkauft**: Die Software selbst (die ist frei)
- **Verkauft**: Der offizielle, bequeme und vertrauenswürdige Nutzungsweg
  - Signierte/notarisierte Installer (keine "unbekannte Quelle" Warnung)
  - Getestete Stable Releases (kein "selbst kompilieren")
  - Auto-Updater (kein manueller Download)
  - Persönlicher Support (kein Community-Forum ohne SLA)

### Risiko
- Theoretisch könnte jemand die Software forken und kostenlos als Installer anbieten
- Praktisch tut das niemand, weil: Zielgruppe kann nicht programmieren, Fork-Pflege lohnt nicht für 59 €/Jahr
- Red Hat, WordPress, Nextcloud, GitLab beweisen: Open Source + kommerzieller Service funktioniert

## Zu bewertende Fragen

### 1. Preisgestaltung
- Ist 59 €/Jahr (Einführung) / 99 €/Jahr (regulär) der richtige Preis für die Zielgruppe?
- Sollte es zusätzliche Preisstufen geben (Solo, Team, Enterprise)?
- Ist der Einführungspreis als Strategie sinnvoll oder entwertet er das Produkt?
- Sollte es einen Einmalkauf geben statt/zusätzlich zum Jahresabo?
- Wie positionieren wir "netto" vs. "brutto" für B2B-Kunden?

### 2. Kostenlos vs. Pro — die richtige Grenze
Aktuell ist alles kostenlos nutzbar. Pro bietet nur Installer, Updates, Support.
- Sollten bestimmte Features nur für Pro sein? (z.B. PDF-Export, mehr als 10 Checklisten, Branchenfilter)
- Oder ist "alles kostenlos, Pro = Komfort + Support" das richtige Modell?
- Was sagt die Zielgruppe? Zahlt ein Imbiss-Betreiber 59 €/Jahr für Updates?

### 3. Go-to-Market — wie finden uns Kunden?
- **SEO**: Landingpages pro Branche ("Hygiene-Checkliste Gastronomie", "DGUV V3 Prüfprotokoll")
- **App Store**: Erst mit nativer App möglich (v0.9.0)
- **BG/IHK-Empfehlungen**: Berufsgenossenschaften beraten Gründer
- **Content Marketing**: Blog, YouTube ("Welche Prüfungen muss ich als Gastronom machen?")
- **Pilotkunden**: Direktansprache über Kontakte
- Was ist der effektivste Kanal für die ersten 10, 100, 1.000 Kunden?

### 4. Mobile-Strategie
- Ohne Mobile App verlieren wir die Minigolf-Pächterin (kein PC vor Ort)
- Native App (React Native/Expo) als v0.9.0 geplant
- Preismodell Mobile: Kostenlos (Companion) vs. Einmalkauf (14,99–24,99 €) vs. Abo
- GPL-3.0 und App Store: Potenzielle Konflikte?
- Soll Mobile der Hauptakquise-Kanal werden?

### 5. Naming und Positionierung
- "Nachweis Lokal" — versteht die Zielgruppe den Namen?
- "Pro" — suggeriert das "die kostenlose Version ist unprofessionell"?
- Sollte es "Nachweis Lokal Business" heißen statt "Pro"?
- Wie kommunizieren wir Open Source an Nicht-Techniker? (Oder gar nicht?)

### 6. Nebenberuflicher Start
- Der Gründer startet nebenberuflich — begrenzte Zeit für Support
- Wie begrenzt man Support-Aufwand? ("Antwort in 2-3 Werktagen", KI-gestützter First-Level)
- Welche Zusatzleistungen sind planbar? (Einrichtung: 149 €, Datenmigration: 99 €)
- Ab wann lohnt sich ein Wechsel zu Vollzeit?

### 7. Conversion-Funnel
Bewerte den aktuellen Funnel:
```
Google-Suche "Prüfung dokumentieren"
→ Landing Page (portal.detmers-publish.de/nachweis-lokal)
→ "Kostenlos herunterladen" → Download-Seite
→ Plattform wählen → Download startet
→ Installieren → Wizard → Demo-Prüfung → Eigene Checklisten
→ 30 Tage kostenlos testen (alle Features)
→ Nach 30 Tagen: "Nachweis Lokal Pro" Hinweis
→ Digistore24 Kauf → Lizenzkey → In App eingeben
```
- Wo ist der größte Drop-off?
- Welcher Schritt ist zu kompliziert?
- Was fehlt?

## Gewünschtes Ergebnis

### 1. Bewertung der aktuellen Strategie
Stärken, Schwächen, blinde Flecken. Schonungslos ehrlich.

### 2. Preisempfehlung
Konkreter Preisvorschlag mit Begründung. Einmalkauf, Abo, Freemium-Grenze.

### 3. Go-to-Market-Plan
Top 5 Akquise-Maßnahmen für die ersten 12 Monate, priorisiert nach Impact und Aufwand.

### 4. Conversion-Optimierung
Top 3 Stellen im Funnel die optimiert werden sollten.

### 5. Positionierungs-Statement
Ein Satz der auf die Landing Page gehört und die Zielgruppe sofort anspricht.

### 6. Risiken
Was kann schiefgehen? Wo ist die größte Gefahr?

### 7. Die eine Sache
Wenn du nur EINE Empfehlung geben dürftest — welche wäre das?
