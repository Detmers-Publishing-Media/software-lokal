# State — Arbeitsgedächtnis

## Aktuelle Version
- Nachweis Lokal: v0.7.4 (auf Portal, alle Features deployed)
- Öffentliches Repo: github.com/detmerspublish/nachweis-lokal (GPL-3.0)
- tamper-evident-log: v0.1.0 (auf npm)

## Session 2026-03-14 bis 2026-03-15

### Umgesetzt (Nachweis Lokal v0.3.0 → v0.7.4)

**Architektur:**
- Workflow-orientierte Sidebar (Gruppenheader)
- tamper-evident-log in alle 4 DB-Produkte integriert (E2E verifiziert)
- Einrichtungsassistent (5-Schritte-Wizard mit Demo-Prüfung)
- Mobile HTTP-Server (WLAN, Token-Auth) — vorerst deaktiviert (PWA nicht endanwender-tauglich)
- KI-Assistent (Keyword-Classifier + Spracheingabe + Prompt-Export)
- Branchenfilter (8 Branchen, 36 Checklisten zugeordnet)
- Glossar-Komponente (15 Fachbegriffe in B1-Deutsch)
- Zweisprachige Untertitel (Türkisch + Englisch)
- Compliance-Rate auf Dashboard
- Fortschrittsbalken + Erfolgsmeldung bei Prüfung
- Prüfung = Wizard (✕ betrifft mich nicht, Finalize-Schritt)
- Inline Geräte/Räume/Prüfer anlegen
- Dashboard Quick-Start
- 7 Quick Wins (Zurück-Button, ARIA, Focus, Kontrast, min-height)

**Monetarisierung (Strategiewechsel):**
- "Supportvertrag" → "Nachweis Lokal Business"
- Preis: 89 €/Jahr brutto (Early-Adopter: 69 €, erste 50 Kunden)
- Vorlagen-Split: 5 Basis (CC-BY-SA) kostenlos, 31 Business (proprietär) mit Lizenz
- Lock-UI + Business-Badge für Business-Vorlagen
- Positionierung: "WISO Steuer für Betriebsprüfungen"
- Landing Page + Download-Seite komplett überarbeitet

**Infrastruktur:**
- YubiKeys eingerichtet (Tuxedo OS, GitHub 2FA, npm 2FA)
- Portal deployed (neue Endpoints, Landing Page, Download-Seite)
- Changelog-System im Portal
- Digistore24 Dankeseite konfiguriert
- Öffentliches GitHub-Repo erstellt (GPL-3.0, Code Signing Policy)
- Rechnung Lokal Build-Fehler gefixt
- Berater Lokal Umlaute gefixt

**Andere Produkte:**
- Rechnung Lokal: Sidebar + Settings + SupportHub + Wizard + CSS
- Berater Lokal: Deutsche Umlaute
- Shared Components: SupportView Feedback, LicenseSection, FeatureRequestView

### Entscheidungen
- Mobile PWA über HTTP gescheitert → Native App (React Native/Expo) als v0.9.0
- Vorlagen sind Inhalt (nicht Code) → proprietäre Lizenz, nicht GPL
- Business-Vorlagen NICHT im signierten OSS-Installer (SignPath-Kompatibilität)
- Code Signing: SSL.com eSigner + Apple Developer (~408$/Jahr)
- Companion-App-Modell für Mobile (Apple-konform, kein IAP nötig)
- Kein E-Mail-Marketing (Code-Fabrik-Prinzip)
- Vertikaler Keil: Gastronomie zuerst, dann Kita

### Offene Stories
- FEAT-017: Wizard = Nutzung (in_progress, weiteres Polishing)
- FEAT-018: Native Mobile App (inbox, XL, v0.9.0)
- FEAT-019: KI-Modell-Training für Checklisten (inbox, XL)
- SEC-001: Mobile Server Härtung (parkiert — Mobile deaktiviert)

### Offene Infrastruktur
- Code Signing beantragen (SSL.com eSigner + Apple Developer)
- Cloudflare + Digistore24 2FA
- GitHub Security Keys (3 YubiKeys registrieren)
- KeePass YubiKey Challenge-Response
- Business-Vorlagen aus öffentlichem Repo entfernen
- Template-Download-Mechanismus implementieren

### Review-Prompts erstellt
- /review-zielgruppe — Zielgruppen-UX-Review
- /review-usability-benchmark — Wettbewerber + Best-Practice-Onboarding
- /review-security — Security Audit
- /review-appstore-compliance — App Store Konformität
- /review-product-strategy-mobile — Produktstrategie Desktop + Mobile
- /review-gtm-pricing — Go-to-Market und Preisstrategie
- docs/review-signpath-compliance.md — SignPath Foundation Compliance
- docs/review-code-signing-certificate.md — Code Signing Zertifikat-Optionen
- docs/review-code-signing-decision.md — SSL.com Entscheidungs-Review
- docs/review-gtm-pricing.md — Vollständiger GTM-Prompt

### Nächste Schritte (v0.8.0)
1. Code Signing beantragen (SSL.com + Apple)
2. Business-Vorlagen aus öffentlichem Repo entfernen
3. Template-Download-Mechanismus implementieren
4. 5 Pilotkunden onboarden (Gastro-Fokus)
5. Gastro-Landingpage erstellen
6. Digistore24 E2E-Testkauf
7. v0.8.0 Release
