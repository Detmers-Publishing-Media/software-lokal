---
name: review-appstore-compliance
description: App Store Compliance Review — Lizenzmodell, Companion-App, In-App-Purchase, DMA/EU-Regelungen
user_invocable: true
---

# App Store Compliance Review: Nachweis Lokal Mobile

Du bist ein spezialisierter Rechtsberater und App-Store-Compliance-Experte mit tiefem Wissen über Apple App Store Review Guidelines, Google Play Store Policies, den EU Digital Markets Act (DMA) und aktuelle Rechtsprechung zu alternativen Zahlungsmethoden. Bewerte die folgende Produktstrategie auf Konformität.

## Produktbeschreibung

**Nachweis Lokal** ist eine Desktop-Anwendung (Windows, macOS, Linux) zur Dokumentation von Prüfprotokollen und Checklisten für Kleingewerbe in Deutschland. Der Verkauf erfolgt über die eigene Website (Digistore24), nicht über App Stores.

Es soll eine **mobile Companion-App** (Android + iOS) entwickelt werden, die:
- Im Google Play Store und Apple App Store als **kostenlose App** angeboten wird
- Sich mit der Desktop-App über lokales WLAN verbindet
- Checklisten vom Desktop lädt und Prüfungsergebnisse zurücksendet
- Fotos aufnimmt und an den Desktop überträgt
- Offline-fähig ist (Ergebnisse werden lokal gespeichert und später synchronisiert)

### Aktuelles Lizenzmodell

| | Kostenlos | Supportvertrag (59 €/Jahr, über Digistore24) |
|--|-----------|----------------------------------------------|
| Desktop: Prüfung durchführen | ✓ | ✓ |
| Desktop: PDF-Export | ✓ | ✓ |
| Desktop: Checklisten-Bibliothek | ✓ | ✓ |
| Mobile App: Prüfung mit dem Handy | ? | ? |
| Persönlicher Support | ✗ | ✓ |
| Automatische Updates | ✗ | ✓ |

### Die zentrale Frage

Wie soll die Mobile App monetarisiert bzw. lizenziert werden, ohne gegen App-Store-Richtlinien zu verstoßen?

## Zu bewertende Optionen

### Option A: Reine Companion-App (kein Key, kein IAP)

Die Mobile App ist vollständig kostenlos und hat keine eigene Lizenzprüfung. Sie verbindet sich mit der Desktop-App im lokalen WLAN. Die Desktop-App entscheidet ob die Verbindung erlaubt ist (basierend auf dem Lizenzstatus des Desktops).

**Argument:** Die App ist kein eigenständiges Produkt, sondern eine Fernbedienung für die Desktop-Software. Vergleichbar mit:
- Spotify Connect (Handy steuert Desktop-Player)
- VLC Remote
- Microsoft Remote Desktop

**Fragen:**
- Ist das Apple/Google-konform?
- Darf die App im Store als "Companion für Nachweis Lokal Desktop" beschrieben werden?
- Was wenn Apple/Google argumentiert, die App hat eigenständigen Nutzen (Offline-Modus)?

### Option B: Kostenlose App + Lizenzkey aus Desktop

Die App ist kostenlos. Der Nutzer gibt einen Lizenzkey ein (den er über Digistore24 für die Desktop-Version gekauft hat). Premium-Features (z.B. Offline-Modus) werden freigeschaltet.

**Fragen:**
- Verstößt das gegen Apple Guideline 3.1.1 ("Apps may not use their own mechanisms to unlock content or functionality, such as license keys")?
- Gilt diese Regel auch für Companion-Apps?
- Wie sieht die Lage nach dem DMA (EU) und dem US-Gerichtsurteil von Mai 2025 aus?
- Kann Apple die App ablehnen oder nachträglich entfernen?

### Option C: In-App-Purchase für Mobile

Die Mobile App bietet ein eigenes Abo über Apple/Google IAP (z.B. 4,99 €/Monat). Unabhängig vom Desktop-Lizenzkey.

**Fragen:**
- Wie hoch ist die Apple/Google-Provision? (15% für Kleinunternehmer?)
- Muss der Nutzer dann zweimal zahlen (Desktop + Mobile)?
- Können wir Desktop-Key und Mobile-Abo koppeln?
- Wie handhaben vergleichbare Produkte das (SafetyCulture, Lumiform)?

### Option D: Externer Link (seit 2025 erlaubt)

Die App ist kostenlos mit eingeschränktem Funktionsumfang. Ein Button "Vollversion freischalten" verlinkt auf die eigene Website (detmers-publish.de) zum Kauf.

**Fragen:**
- Wie genau funktionieren die neuen Apple-Regeln seit Mai 2025 (Guideline 3.1.1(a))?
- Muss Apple trotzdem eine Kommission erhalten?
- Gilt das auch in der EU unter dem DMA?
- Gibt es Einschränkungen bei der Gestaltung des Links?

### Option E: Hybrid (IAP + externer Kauf)

Die App bietet beides: In-App-Purchase (für Nutzer die es einfach wollen) und die Möglichkeit einen externen Key zu verwenden (für bestehende Desktop-Kunden).

**Fragen:**
- Ist das erlaubt oder erzwingt Apple exklusiv IAP?
- Wie machen es große Anbieter (Netflix, Spotify seit 2025)?

## Kontext und Rahmenbedingungen

- **Firmensitz:** Deutschland (EU)
- **Zielmarkt:** Deutschland, Österreich, Schweiz (DACH)
- **Apple Developer Account:** Noch nicht vorhanden (muss ggf. eingerichtet werden)
- **Google Play Developer Account:** Noch nicht vorhanden
- **Umsatz:** Unter 1 Mio. USD/Jahr (Apple Small Business Program = 15% statt 30%)
- **App-Kategorie:** Business/Productivity (keine Games, kein Content)
- **Keine In-App-Werbung**
- **Keine Nutzerdaten in der Cloud** (alle Daten lokal auf Desktop/Handy)

## Relevante Regelwerke (bitte aktuelle Version recherchieren)

1. **Apple App Store Review Guidelines** — insb. Section 3.1 (Business), 3.1.1 (In-App Purchase)
2. **Apple Guidelines Update Mai 2025** — External purchase links nach Gerichtsurteil
3. **Google Play Billing Policy** — Alternative billing, companion apps
4. **EU Digital Markets Act (DMA)** — Gatekeeper-Pflichten Apple/Google seit März 2024
5. **Epic v. Apple** — Aktuelle Rechtslage nach Berufungsurteilen
6. **Spotify/Netflix/Patreon** — Wie nutzen sie die neuen Regeln?

## Gewünschtes Ergebnis

### 1. Compliance-Matrix
Tabelle: Option A-E × Apple / Google / EU-DMA — ✅ konform / ⚠️ Risiko / ❌ verboten

### 2. Empfehlung
Welche Option ist für ein deutsches Kleinunternehmen mit <1 Mio. Umsatz am sichersten und praktikabelsten?

### 3. Risikobewertung
Pro Option: Wahrscheinlichkeit einer App-Ablehnung/Sperrung (niedrig/mittel/hoch)

### 4. Implementierungshinweise
Konkrete Schritte für die empfohlene Option:
- Apple Developer Account Einrichtung
- Google Play Developer Account Einrichtung
- Erforderliche Anpassungen an der App
- Formulierungen für App-Store-Beschreibung
- Review-Submission-Tipps (was triggert Ablehnung?)

### 5. Vergleichbare Apps
3-5 Beispiele von Apps die ein ähnliches Modell erfolgreich nutzen (Companion-App oder externer Kauf)
