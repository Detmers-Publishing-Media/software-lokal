# Tamper-Proof Audit Log — Strategische Bewertung

*Stand: 11. Maerz 2026. Basiert auf audit-log-npm-business-review.md und audit-log-npm-marktrecherche.md.*

---

## 1. Chancen

### 1.1 Vertrauens-Multiplikator (wichtigste Chance)

Das npm-Paket ist kein Umsatzprodukt, sondern ein **Conversion-Hebel** fuer die 39-EUR-Servicepakete:

- "Die Integritaetslogik ist oeffentlich geprueft" → senkt die Kaufhuerde fuer Rechnung Lokal / Mitglieder Lokal
- Kassenpruefer, Steuerberater und IT-Dienstleister koennen die Hash-Kette **unabhaengig verifizieren**
- Kein Wettbewerber (lexoffice, SevDesk, WISO) legt seine Audit-Logik offen
- **Quantifizierung:** Wenn das Paket die Conversion-Rate der Servicepakete um nur 5% erhoeht, ist der ROI bei 10 Tagen Aufwand sofort positiv

### 1.2 SEO und organische Sichtbarkeit

- npm-Pakete ranken gut bei Google fuer technische Suchbegriffe
- "tamper proof audit log node.js" hat keine dominante Loesung
- Jeder npm-Install erhoeht die Sichtbarkeit von "Code-Fabrik" / "Detmers"
- Kostenlose Dauerwerbung in der Entwickler-Community

### 1.3 NIS2-Welle (Timing-Chance)

- ~29.500 Unternehmen in DE muessen **jetzt** Audit-Logs nachweisen (Gesetz seit Dez 2025 in Kraft)
- Viele davon haben Node.js-Backends und suchen npm-Loesungen
- Die GoBD-Verschaerfung (Jul 2025) verlangt explizit **manipulationssichere Zeitstempel**
- **Window of Opportunity:** Der Markt ist noch nicht besetzt — ri-event-log ist erst seit Feb 2026 da und nur Browser-tauglich

### 1.4 Referenz fuer Rechnung Lokal (GoBD-Argument)

- Rechnung Lokal braucht GoBD-Prozessunterstuetzung → Hash-Kette ist Pflicht
- Ein oeffentliches npm-Paket mit 100% Test-Coverage ist ein staerkeres Argument gegenueber Steuerberatern als "wir haben da was internes gebaut"
- **Kommunikation:** "Unsere Integritaetslogik wird von [X] Entwicklern weltweit eingesetzt und geprueft"

---

## 2. Umsatzchancen

### Szenario A: Nur Vertrauensbildung (kein direkter Umsatz)

| Metrik | Wert |
|---|---|
| Direkte Einnahmen | EUR 0 |
| Indirekte Wirkung | +5-15% Conversion-Rate auf Servicepakete |
| Bei 100 Kunden/Jahr x 39 EUR | +EUR 195-585/Jahr Mehrumsatz |
| Bei 500 Kunden/Jahr x 39 EUR | +EUR 975-2.925/Jahr Mehrumsatz |
| Break-even (10 Arbeitstage) | Ab ~5 zusaetzlichen Kunden |

### Szenario B: Open Core (Pro-Features spaeter)

| Metrik | Konservativ | Optimistisch |
|---|---|---|
| npm Downloads/Woche (12 Monate) | 200 | 2.000 |
| Aktive Nutzer | 500 | 5.000 |
| Pro-Upgrade-Rate ($29) | 2% | 5% |
| Pro-Kaeufe im ersten Jahr | 10 | 250 |
| **Direkter Umsatz** | **~EUR 270** | **~EUR 6.750** |

### Szenario C: Consulting/Audit-Attestierung (langfristig)

Falls das Paket Adoption findet, ergibt sich eine Option:
- "Compliance-Audit fuer Ihre tamperproof-log-Integration" als Dienstleistung
- Zielgruppe: NIS2-betroffene Unternehmen die Nachweis fuer Pruefer brauchen
- **Nicht jetzt planen**, aber als Option im Hinterkopf behalten

---

## 3. Risiken

### 3.1 Niedrige Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| Security-Vulnerability | Niedrig | Hoch (Reputationsschaden) | Zero Dependencies, 100% Coverage, kleine Codebase (< 200 Zeilen) |
| Maintenance-Aufwand steigt | Niedrig | Mittel | Zero Dependencies = kaum externe Updates noetig. Kleine API = wenig Issues. |
| GPL-3.0-Kontamination | Niedrig | Hoch | Clean-Room-Extraktion ist als AC definiert. MIT und GPL sind kompatibel. |

### 3.2 Mittlere Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| Geringe Adoption (< 50 Downloads/Woche) | Mittel | Niedrig | Wert bleibt als Pruefbarkeits-Argument bestehen. Auch 20 GitHub-Stars sind besser als "interner Code". |
| ri-event-log baut Dexie-Abhaengigkeit ab | Mittel | Mittel | First-Mover-Vorteil sichern. Unsere API ist einfacher (3 Zeilen vs. Dexie-Setup). |
| Jemand forkt und baut bessere Version | Niedrig-Mittel | Niedrig | MIT erlaubt das. Community pflegen, schnell auf Issues reagieren. |
| Ablenkung vom Kernprodukt (Rechnung Lokal) | Mittel | Mittel | **Zeitlimit: Max 10 Arbeitstage.** Danach Maintenance-only (4h/Monat). |

### 3.3 Hohes Risiko

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| **Overinvestment** — zu viel Zeit in npm-Paket statt in Rechnung Lokal | Mittel-Hoch | Hoch | Klare Regel: v0.1.0 in 10 Tagen, dann zurueck zu Rechnung Lokal. Pro-Features erst bei nachgewiesener Nachfrage. |

---

## 4. Strategische Empfehlung

**Das npm-Paket lohnt sich — aber nur als Nebenprodukt mit hartem Zeitlimit.**

| Aspekt | Empfehlung |
|---|---|
| **Umsetzung** | Ja, parallel zu v0.7.0 |
| **Zeitbudget** | Max 10 Arbeitstage fuer v0.1.0, dann Stopp |
| **Monetarisierung** | Nein (Phase 1). Option C offen halten. |
| **Primaerer Wert** | Vertrauensbeweis fuer Referenzkunden-Gespraeche |
| **Sekundaerer Wert** | SEO + organische Sichtbarkeit |
| **Abbruchkriterium** | Wenn nach 6 Monaten < 50 Downloads/Woche UND kein Referenzkunde es als Vertrauensargument erwaehnt |
| **Erfolgskriterium** | Mindestens 1 Referenzkunde sagt: "Gut, dass die Integritaetslogik oeffentlich pruefbar ist" |

---

## 5. Referenzen

- `docs/konzept/audit-log-npm-business-review.md` — Vollstaendiger Business Review
- `docs/konzept/audit-log-npm-marktrecherche.md` — Vertiefte Marktrecherche mit Live-Daten
- `.stories/FEAT-008-audit-log-npm-oss.yml` — Story-Definition
