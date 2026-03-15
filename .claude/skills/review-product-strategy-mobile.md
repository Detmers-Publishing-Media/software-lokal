---
name: review-product-strategy-mobile
description: Produktstrategie-Review — Desktop + Mobile App, Lizenzmodell, Preisgestaltung, App-Store-Konformität
user_invocable: true
---

# Produktstrategie-Review: Desktop + Mobile App

Du bist ein erfahrener Produktstratege mit Expertise in B2B-SaaS/Desktop-Software, Mobile-App-Monetarisierung und App-Store-Ökonomie. Bewerte die folgende Produktstrategie und gib eine fundierte Empfehlung.

## Ausgangslage

**Nachweis Lokal** ist eine Desktop-App (Electron, Windows/macOS/Linux) für Prüfprotokolle und Checklisten. Zielgruppe: Kleingewerbe in Deutschland (Gastronomen, Handwerker, Kita-Betreiber, Hausverwaltungen).

**Aktuelles Geschäftsmodell:**
- Desktop-App: Kostenlos nutzbar (alle Kernfunktionen)
- Supportvertrag: 59 €/Jahr (Einführungspreis, regulär 99 €/Jahr)
- Vertrieb: Eigene Website + Digistore24
- Kein Cloud-Zwang, alle Daten lokal

**Problem:** Die Desktop-App allein reicht nicht — Prüfungen finden vor Ort statt (Küche, Keller, Dach, Außengelände), nicht am Schreibtisch. Eine mobile Lösung ist ein Muss.

**Bisheriger Versuch:** PWA über lokalen HTTP-Server gescheitert (Browser-Sicherheitseinstellungen, kein HTTPS auf lokaler IP, nicht endanwender-tauglich). Ergebnis: Native App nötig (React Native / Expo).

## Zu bewertende Strategien

### Strategie 1: Companion-App (kostenlos)

Die Mobile App ist eine kostenlose Erweiterung der Desktop-App.

```
Desktop (59 €/Jahr)     →  Mobile App (kostenlos im Store)
Hat den Lizenzkey            Verbindet sich per WLAN mit Desktop
Verwaltet alles              Zeigt Checklisten, sendet Ergebnisse
Erstellt PDFs                Macht Fotos, arbeitet offline
```

- **Kein eigenständiger Nutzen** ohne Desktop
- **Kein Kauf in der App** (Apple/Google-konform)
- **Demo-Modus** mit Beispieldaten für App-Store-Review
- Desktop entscheidet ob Verbindung erlaubt (Lizenzbasis)

**Vorteile:**
- Keine App-Store-Provision
- Ein Preis, ein Key
- Einfachstes Modell

**Nachteile:**
- Kein eigenständiger Vertriebskanal über App Store
- Nutzer muss zuerst Desktop kaufen, dann App installieren
- App-Store-Reviewer könnten "Minimum Functionality" bemängeln

### Strategie 2: Eigenständige App (kostenpflichtig)

Die Mobile App ist ein eigenständiges Produkt im App Store.

```
Desktop (59 €/Jahr)     →  Mobile App (z.B. 4,99 €/Monat via IAP)
Separater Kauf               Eigenständig nutzbar
Kein Zwang                   Eigene SQLite-DB auf dem Handy
                             Optional: Sync mit Desktop
```

- **Eigenständig nutzbar** ohne Desktop
- **In-App-Purchase** (Apple 15%, Google 15%)
- **Eigener Vertriebskanal** (App Store als Akquise)
- Sync mit Desktop als Premium-Feature

**Vorteile:**
- Neue Kunden über App Store (Discovery)
- Mobile-First Nutzer müssen keinen Desktop kaufen
- Eigenständiger Umsatz über App Store

**Nachteile:**
- Apple/Google kassieren 15% (Small Business) oder 30%
- Nutzer zahlt ggf. doppelt (Desktop + Mobile)
- Zwei separate Produkte zu pflegen
- Komplexere Sync-Architektur

### Strategie 3: Freemium App mit Desktop-Sync als Premium

Die Mobile App ist kostenlos nutzbar mit Basis-Funktionen. Desktop-Sync und erweiterte Features kosten extra.

```
Mobile App (kostenlos)        Mobile App (Premium, IAP oder Desktop-Key)
- 3 Checklisten               - Unbegrenzte Checklisten
- Keine PDFs                  - PDF-Export
- Kein Sync                   - Desktop-Sync
- Kein Offline                - Offline-Modus
```

**Vorteile:**
- Niedrigste Einstiegshürde
- Nutzer erlebt den Wert kostenlos
- Conversion zu Premium

**Nachteile:**
- Was genau ist kostenlos vs. Premium?
- Lizenzkey für Premium verstößt gegen Apple Guidelines
- IAP für Premium = Apple/Google-Provision

### Strategie 4: App als kostenpflichtiges Add-on

Die Mobile App kostet einmalig (z.B. 9,99 €) im App Store. Kein Abo, kein IAP.

```
Desktop (59 €/Jahr)     →  Mobile App (9,99 € einmalig im Store)
Separater Kauf               Eigenständig nutzbar
                             Sync mit Desktop inklusive
```

**Vorteile:**
- Einfachster Kauf für den Nutzer (ein Klick im Store)
- Keine Abo-Müdigkeit
- Apple/Google-Provision nur einmal
- Eigenständig nutzbar

**Nachteile:**
- Einmaliger Umsatz statt wiederkehrendem
- Updates müssen kostenlos sein (kein Upgrade-Pricing im App Store)
- Sync-Architektur nötig

### Strategie 5: Alles in der Mobile App (Mobile-First)

Die Desktop-App wird zum Companion, die Mobile App wird das Hauptprodukt.

```
Mobile App (Hauptprodukt)    →  Desktop (kostenloser Companion)
Alle Features                    PDF-Erstellung
Kauf über App Store              Archiv und Backup
5,99 €/Monat IAP                 Sync mit Mobile
```

**Vorteile:**
- Mobile-First = wo die Nutzer sind
- App Store als Hauptvertriebskanal
- Einfacheres Produkt

**Nachteile:**
- Desktop-Kunden verlieren ihr Modell
- Apple/Google kassieren dauerhaft 15-30%
- Abhängigkeit von App Store Policies
- PDF-Erstellung auf Mobile schwierig
- Widerspricht der "lokal, ohne Cloud"-Philosophie

## Bewertungskriterien

Bewerte jede Strategie anhand:

1. **Kundenakquise**: Wie findet der Kunde das Produkt? App Store Discovery vs. Website vs. Empfehlung?
2. **Conversion-Pfad**: Wie viele Schritte von "Interesse" bis "zahlendem Kunden"?
3. **Umsatzpotenzial**: Einmalig vs. wiederkehrend, mit/ohne App-Store-Provision
4. **Technischer Aufwand**: Was muss gebaut werden? Sync, Accounts, Payments?
5. **App-Store-Risiko**: Kann Apple/Google die App ablehnen oder sperren?
6. **Nutzer-Erlebnis**: Wie einfach ist es für einen Imbiss-Betreiber der "Prüfung Handy" googelt?
7. **Langfristige Skalierbarkeit**: Funktioniert das Modell bei 100, 1.000, 10.000 Kunden?
8. **Wettbewerbsposition**: Wie positioniert sich das Modell gegen SafetyCulture (Cloud, 24$/User/Monat) und Lumiform (Cloud, 16$/User/Monat)?

## Zielgruppen-Kontext

Die typischen Kunden sind:
- **Imbiss-Betreiberin** (Türkin, 35, googelt "Hygiene Prüfung App")
- **Elektriker** (Deutscher, 45, braucht DGUV V3 Dokumentation)
- **Kita-Leiterin** (Deutsche, 50, wurde von der BG aufgefordert Spielgeräte zu prüfen)
- **Minigolf-Pächterin** (Deutsche, 40, hat keinen PC vor Ort)

Gemeinsam: Nicht technikaffin, wollen "einfach funktioniert", zahlen ungern Abos, haben kein IT-Budget.

## Markt-Realität

- SafetyCulture: 100.000+ Templates, Cloud, ab 24$/User/Monat, App Store
- Lumiform: Cloud, ab 16$/User/Monat, App Store
- Nachweis Lokal: 35 Templates, lokal, 59€/Jahr, kein App Store (noch)

Die Wettbewerber sind 3-5x teurer und Cloud-basiert. Der Datenschutz-Vorteil (lokal) ist real aber schwer zu kommunizieren.

## Gewünschtes Ergebnis

### 1. Strategie-Empfehlung
Welche der 5 Strategien (oder eine Kombination) ist optimal für:
- Kurzfristig (nächste 6 Monate, Pilotkunde)
- Mittelfristig (6-18 Monate, erste 100 Kunden)
- Langfristig (18+ Monate, Skalierung)

### 2. Preisempfehlung
- Desktop: Bleibt 59/99 € oder Anpassung?
- Mobile: Kostenlos, einmalig, Abo?
- Bundle: Desktop + Mobile zusammen?

### 3. Risikobewertung
Tabelle: Strategie × Risikodimension (App Store, Technik, Markt, Finanzen)

### 4. Go-to-Market
Wie erreicht die Imbiss-Betreiberin die App? Welcher Kanal zuerst?

### 5. Architektur-Empfehlung
Braucht man einen Cloud-Sync-Server oder reicht WLAN-Sync? Was bedeutet das für die "lokal"-Philosophie?

### 6. Konkrete nächste Schritte
Top 5 Maßnahmen priorisiert nach Impact
