# Code Signing für Code-Fabrik — Entscheidung

## Stand: März 2026

### Windows
- SSL.com OV Code Signing Zertifikat (129 $/Jahr)
- FIPS-YubiKey (einmalig ~70 $)
- Lokales Signieren mit signtool.exe
- Ein Zertifikat für alle 4 Produkte

### macOS
- Apple Developer Program (99 $/Jahr)
- Automatisch in GitHub Actions (nach einmaliger .p12-Einrichtung)

### Linux
- GPG-Signatur (kostenlos)

### Kosten
- Jahr 1: ~298 $ (~275 €)
- Ab Jahr 2: ~228 $ (~210 €)

### SmartScreen
- Gelbe Warnung in den ersten Wochen (seit März 2024 auch bei EV)
- Reputation baut sich über Downloads auf
- Pilotkunden persönlich briefen

### Workflow
- macOS + Linux: Automatisch in GitHub Actions
- Windows: Manuell lokal (YubiKey einstecken, signieren, hochladen, ~20 Min/Release)

### Zukunft
- Azure Trusted Signing evaluieren wenn CI-Automatisierung für Windows nötig wird
- SignPath Foundation wenn Repo Reputation hat (3+ Monate)
