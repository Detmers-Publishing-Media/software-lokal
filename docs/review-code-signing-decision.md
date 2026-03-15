# Review: Code Signing Entscheidung — SSL.com eSigner + Apple Developer Program

## Auftrag

Bewerte den folgenden konkreten Vorschlag für Code Signing und gib eine Empfehlung ob es der richtige Ansatz ist oder ob eine bessere Alternative übersehen wurde.

## Der Vorschlag

| Komponente | Anbieter | Kosten/Jahr | Zweck |
|-----------|----------|-------------|-------|
| OV Code Signing Zertifikat | SSL.com | 129 $ | Windows-Installer signieren |
| eSigner Cloud-Signing | SSL.com (Tier 1) | 180 $ (15$/Monat) | Cloud-HSM, kein physischer Token nötig |
| Apple Developer Program | Apple | 99 $ | macOS Notarization + Signierung |
| **Gesamt** | | **408 $/Jahr (~380 €)** | Windows + macOS signiert |

### Warum dieser Vorschlag

- **Kein FIPS-YubiKey nötig** — eSigner nutzt Cloud-HSM bei SSL.com
- **CI/CD-kompatibel** — GitHub Actions Integration vorhanden
- **Sofort verfügbar** — keine Wartezeit, keine Bewerbung
- **Weltweit verfügbar** — auch für Einzelunternehmer in Deutschland
- **Ein Zertifikat für alle Produkte** — 4 Electron-Apps unter einem Zertifikat

### Verworfene Alternativen

| Alternative | Warum verworfen |
|------------|-----------------|
| SignPath Foundation (kostenlos) | Repo zu frisch (1 Tag), proprietäre Vorlagen im Installer müssten erst entfernt werden, Bewerbung dauert Monate |
| Azure Trusted Signing (120$/Jahr) | Für EU-Einzelpersonen aktuell nicht verfügbar ("coming soon") |
| Eigener FIPS-YubiKey + Sectigo | Physischer Token passt nicht in GitHub Actions CI-Pipeline |
| Certum Open Source | Nur für OSS, proprietäre Komponenten problematisch |
| Kein Code Signing | SmartScreen-Warnung auf Windows, Gatekeeper blockiert auf macOS — Endanwender brechen ab |

## Kontext

### Unternehmen
- Detmers Publishing & Media, Einzelunternehmen, Deutschland
- Nebenberuflich, Gründungsphase
- 4 Electron-Desktop-Apps (GPL-3.0)
- Vertrieb: Eigene Website + Digistore24

### Produkte die signiert werden sollen
1. Nachweis Lokal — Prüfprotokolle (Hauptprodukt, Launch steht bevor)
2. Rechnung Lokal — Rechnungsstellung
3. Mitglieder Lokal — Vereinsverwaltung
4. FinanzRechner — Versicherungsrechner

### Vorhandene Hardware
- 3× YubiKey 5C NFC (Standard, NICHT FIPS) — für MFA, nicht für Code Signing
- Kein FIPS-Token vorhanden

### Build-Pipeline
- GitHub Actions
- electron-builder (Windows .exe NSIS, macOS .dmg, Linux .AppImage)
- Artefakte per SCP auf eigenen Server

### Geschäftsmodell
- Software: GPL-3.0, vollständig kostenlos
- Monetarisierung: "Nachweis Lokal Business" (89 €/Jahr) — kuratierte Vorlagen, offizielle Installer, Updates, Support
- Die signierten Installer sind Teil des Wertangebots ("offizielle, vertrauenswürdige Installer")

## Fragen an den Reviewer

### 1. Ist SSL.com eSigner die richtige Wahl?

- Gibt es günstigere Anbieter mit vergleichbarem Angebot (Cloud-HSM + CI-Integration)?
- Ist SSL.com als CA vertrauenswürdig und etabliert?
- Gibt es bekannte Probleme mit SSL.com eSigner?
- Funktioniert eSigner zuverlässig mit electron-builder + GitHub Actions?
- Wie ist der Support bei SSL.com?

### 2. OV vs. IV (Individual Validation)

- Als Einzelunternehmer: Bekomme ich ein OV-Zertifikat (auf Firmenname) oder nur IV (auf Personenname)?
- Was brauche ich als Nachweis? (Gewerbeanmeldung, Personalausweis, D-U-N-S?)
- Was sieht der Windows-Nutzer: "Lars Detmers" oder "Detmers Publishing & Media"?
- Welches ist für die Zielgruppe vertrauenswürdiger?

### 3. SmartScreen-Reputation

- Wie lange dauert es realistisch bis die SmartScreen-Warnung verschwindet?
- Beeinflusst die Anzahl der Downloads die Reputation?
- Ist die Warnung ein "gelber Hinweis" oder ein "roter Block"?
- Können Pilotkunden die Software trotzdem installieren (mit Extra-Klick)?
- Gibt es einen Unterschied zwischen OV und IV bei SmartScreen?

### 4. Apple Developer Program für Einzelunternehmer

- Brauche ich eine D-U-N-S-Nummer als Einzelunternehmer?
- Oder kann ich mich als Individual enrollen?
- Wie lange dauert die Enrollment-Prüfung?
- Funktioniert macOS Notarization mit electron-builder?
- Zeigt macOS "Lars Detmers" oder "Detmers Publishing & Media" an?

### 5. GitHub Actions Integration

- Wie speichert man die SSL.com Credentials sicher in GitHub Secrets?
- Gibt es eine offizielle GitHub Action von SSL.com?
- Wie sieht der Workflow aus (Build → Sign → Upload)?
- Kann man Windows und macOS in derselben Pipeline signieren?
- Timeout/Rate-Limits bei eSigner Tier 1 (20 Signings/Monat)?
- Wir bauen 4 Produkte × 3 Plattformen = 12 Builds pro Release. Reichen 20 Signings?

### 6. Linux (.AppImage)

- Braucht AppImage ein Code-Signing-Zertifikat?
- Oder reicht GPG-Signatur?
- Zeigt Linux eine Warnung bei unsignierten AppImages?
- Lohnt sich Code Signing für Linux überhaupt bei der Zielgruppe?

### 7. Timing

- Wie schnell kann ich nach der Bestellung signierte Installer haben?
- Validierungsdauer für OV/IV bei SSL.com?
- Gibt es eine Testphase (die 30 Tage kostenlos)?
- Kann ich in der Testphase schon "echte" signierte Installer bauen?

### 8. Versteckte Kosten

- Gibt es Kosten die ich übersehe?
- Renewal-Kosten — gleich oder teurer?
- Kosten für zusätzliche Credentials (wenn ich einen zweiten Entwickler hinzufüge)?
- Kosten für Timestamp-Server?
- Kosten für Revocation/Reissue?

### 9. Azure Trusted Signing als Zukunftsoption

- Wann wird Azure Trusted Signing für EU-Einzelpersonen verfügbar?
- Lohnt sich das Warten?
- Kann man später von SSL.com zu Azure wechseln?
- Hat Azure Trusted Signing einen SmartScreen-Vorteil (Microsoft-eigener Dienst)?

## Gewünschtes Ergebnis

### 1. Go/No-Go
Ist der Vorschlag (SSL.com eSigner + Apple Developer) der richtige Ansatz? Ja/Nein mit Begründung.

### 2. Bessere Alternative?
Falls nein — was wäre besser?

### 3. Konkrete nächste Schritte
Exakte Reihenfolge: Was zuerst beantragen, welche Dokumente, wie lange warten.

### 4. Kostenvalidierung
Stimmen die 408$/Jahr oder gibt es versteckte Kosten?

### 5. Risiken
Was kann schiefgehen bei SSL.com eSigner + Apple Developer Program?
