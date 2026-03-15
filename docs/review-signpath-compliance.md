# Review: SignPath Foundation Compliance für Nachweis Lokal

## Auftrag

Bewerte ob das Open-Source-Projekt "Nachweis Lokal" die Bedingungen der SignPath Foundation für ein kostenloses Code-Signing-Zertifikat erfüllt. Identifiziere Lücken und gib konkrete Empfehlungen.

## SignPath Foundation Terms

Vollständige Bedingungen: https://signpath.org/terms.html

### Kernanforderungen (zusammengefasst)

1. **OSI-approved Open Source License** — keine kommerzielle Dual-Lizenzierung
2. **Öffentliches Repository** — auf GitHub oder GitLab
3. **Maintained** — aktiv gepflegt, verifiable reputation
4. **Released** — veröffentlichte Releases mit Dokumentation
5. **Code Signing Policy** auf der Projekt-Homepage mit:
   - Satz: "Free code signing provided by SignPath.io, certificate by SignPath Foundation"
   - Teamrollen und deren Mitglieder
   - Privacy Policy oder No-Transfer-Hinweis
6. **MFA** für alle Teammitglieder mit GitHub/SignPath-Zugriff
7. **CI/CD-Integration** — Builds müssen über die CI-Pipeline laufen
8. **Manuelle Freigabe** — jede Signieranforderung muss manuell genehmigt werden
9. **Keine proprietären Komponenten** im signierten Paket
10. **Keine Malware, keine Adware, keine Bundleware**

## Unser Projekt

### Öffentliches Repository

- **URL**: https://github.com/detmerspublish/nachweis-lokal
- **Lizenz**: GPL-3.0
- **Commits**: Aktuell wenige (frisch veröffentlicht)
- **Stars/Forks**: 0 (neu)
- **README**: Vorhanden mit Features, Build-Anleitung, Code Signing Policy
- **Tags**: v0.7.4

### Was im Repository liegt

| Komponente | Lizenz | Im signierten Installer? |
|-----------|--------|--------------------------|
| Anwendungscode (Electron/Svelte/SQLite) | GPL-3.0 | Ja |
| electron-platform (Shared Package) | GPL-3.0 | Ja |
| app-shared (Shared Components) | GPL-3.0 | Ja |
| ui-shared (UI Components) | GPL-3.0 | Ja |
| shared (Crypto, CSV, License Utils) | GPL-3.0 | Ja |
| tamper-evident-log (Hash-Kette) | MIT | Ja |
| 5 Basis-Checklisten (Brandschutz, Erste-Hilfe, Leitern, Unterweisung, Fluchtweg) | CC-BY-SA 4.0 | Ja |
| 31 kuratierte Branchenvorlagen | **Proprietär** | **?** |
| Tests, Fixtures | GPL-3.0 | Nein |

### Das Geschäftsmodell

Die Software ist GPL-3.0 und vollständig funktionsfähig ohne Bezahlung. Monetarisiert wird über:

**Nachweis Lokal Business** (89 €/Jahr brutto):
- 35+ kuratierte Branchenvorlagen (proprietäre Lizenz, nicht GPL)
- Offizielle signierte Installer
- Automatische Updates (12 Monate)
- Persönlicher Support
- Gehosteter KI-Service-Endpoint (geplant)

**Kostenlose Version:**
- Voller Softwarefunktionsumfang (GPL-3.0)
- 5 Basis-Checklisten (CC-BY-SA 4.0)
- Eigene Checklisten erstellen (unbegrenzt)
- Community-Support (GitHub Issues)

### Das potenzielle Problem

Die 31 Business-Vorlagen liegen aktuell in derselben Datei (`template-library.json`) wie die 5 Basis-Vorlagen. Im Code sind sie mit `"tier": "business"` markiert und werden per Lizenz-Check in der UI gesperrt. Aber:

- Sie sind im Quellcode sichtbar (öffentliches Repo)
- Sie könnten technisch im kompilierten Installer enthalten sein
- Die Frage ist: Zählt das als "proprietäre Komponente im signierten Paket"?

### Mögliche Lösungen für das Vorlagen-Problem

**Option A: Business-Vorlagen aus dem öffentlichen Repo entfernen**
- Nur die 5 Basis-Vorlagen in `template-library.json`
- Business-Vorlagen werden separat heruntergeladen (nach Lizenz-Check)
- Pro: Klar GPL-konform, keine proprietären Inhalte im Installer
- Contra: Architektur-Umbau nötig (Template-Download-Mechanismus)

**Option B: Alle Vorlagen unter CC-BY-SA lizenzieren**
- Dann sind sie Open Source und dürfen im signierten Paket sein
- Pro: Einfachster Weg, kein Code-Umbau
- Contra: Verliert die Monetarisierungsgrenze (jeder kann die Vorlagen forken)

**Option C: Vorlagen als "Daten" behandeln, nicht als "Software"**
- Argument: Die Vorlagen sind Inhalte (wie Wikipedia-Artikel), nicht Code
- GPL betrifft Software, nicht Daten die die Software verarbeitet
- Pro: Juristisch möglicherweise haltbar (WordPress-Themes-Analogie)
- Contra: SignPath könnte das anders sehen

**Option D: Zwei separate Installer bauen**
- Community-Installer (signiert, nur Basis-Vorlagen) — für SignPath
- Business-Installer (nicht SignPath-signiert, eigenes Zertifikat) — mit allen Vorlagen
- Pro: Klare Trennung
- Contra: Zwei Build-Pipelines, verwirrend für Nutzer

### Code Signing Policy (aktuell im README)

```
## Code Signing Policy

Free code signing provided by SignPath.io, certificate by SignPath Foundation.

### Team Roles
| Role | Member | GitHub |
|------|--------|--------|
| Author / Committer | Lars Detmers | @detmerspublish |
| Reviewer | Lars Detmers | @detmerspublish |
| Approver (Release Signing) | Lars Detmers | @detmerspublish |

All team members with repository and SignPath access use MFA.

### Open Source Compliance
All code in the signed packages is licensed under GPL-3.0.
The curated business templates (proprietary) are NOT included
in the signed open-source installer.

### Privacy
Nachweis Lokal does not collect, transmit, or store any personal data
on external servers. No telemetry, no analytics, no tracking.
```

### CI/CD Pipeline (aktuell)

- GitHub Actions Workflow: `.github/workflows/build.yml`
- Trigger: Push auf main (Path-Filter) oder workflow_dispatch
- Build: pnpm install → vite build → electron-builder
- Plattformen: Windows (.exe), macOS (.dmg), Linux (.AppImage)
- Upload: Artefakte auf Portal-Server per SCP
- **Signierung: Noch nicht implementiert** (das ist der Zweck der SignPath-Beantragung)

### Einmann-Projekt

Das Projekt wird von einer Person entwickelt (Lars Detmers, nebenberuflich). Alle drei Rollen (Author, Reviewer, Approver) sind dieselbe Person. SignPath Terms sagen nicht explizit, dass verschiedene Personen nötig sind, aber es könnte als schwache Governance interpretiert werden.

## Fragen an den Reviewer

### 1. Proprietäre Vorlagen im signierten Paket

Sind die 31 Business-Vorlagen (proprietäre Lizenz) ein Problem für die SignPath Foundation?

- Sie sind "Daten/Inhalte", nicht "Code"
- Sie sind im Quellcode sichtbar (öffentliches Repo)
- Sie sind im kompilierten Installer enthalten
- Sie werden per UI-Lock gesperrt (nicht per Code-Verschlüsselung)

Welche der Optionen A-D ist die sicherste?

### 2. GPL-3.0 + Kommerzielles Angebot

SignPath verlangt "no commercial dual-licensing". Unser Modell ist:
- Software: GPL-3.0 (keine Einschränkung)
- Vorlagen: Proprietär (Monetarisierung)
- Installer: Signiert (Komfort-Argument)
- Support: Bezahlt

Ist das "commercial dual-licensing" oder "Open Source + Services"?

### 3. Frisches Repo ohne Reputation

Das Repo wurde gerade erst erstellt (1 Tag alt, wenige Commits, 0 Stars). SignPath verlangt "maintained" und "verifiable reputation".

- Ist das ein Ablehnungsgrund?
- Wie lange sollte man warten bevor man beantragt?
- Hilft es wenn das private Monorepo eine längere Git-History hat?

### 4. Einmann-Governance

Alle Rollen (Author, Reviewer, Approver) sind dieselbe Person.

- Ist das ein Problem für SignPath?
- Was wäre die minimale Governance-Struktur?

### 5. Electron-App-Spezifika

Electron-Apps bündeln Chromium + Node.js + App-Code in einem großen Installer (~150 MB).

- Hat SignPath Erfahrung mit Electron-Apps?
- Gibt es bekannte Probleme bei der Signierung?

### 6. Alternative: Eigenes Zertifikat kaufen

Wenn SignPath Foundation nicht klappt — was kostet ein eigenes Code-Signing-Zertifikat?
- EV Code Signing (Sectigo, DigiCert): ~300-500 €/Jahr
- Standard Code Signing: ~100-200 €/Jahr
- Reicht ein Standard-Zertifikat für SmartScreen-Trust?
- Braucht man EV für sofortigen SmartScreen-Trust?

## Gewünschtes Ergebnis

### 1. Compliance-Bewertung
Ampel pro SignPath-Anforderung: ✅ konform / ⚠️ unklar / ❌ nicht konform

### 2. Empfehlung
SignPath Foundation beantragen oder eigenes Zertifikat kaufen?

### 3. Wenn SignPath: Konkrete Maßnahmen
Was muss am Repo, an der Policy, am Build geändert werden?

### 4. Wenn eigenes Zertifikat: Anbieterempfehlung
Welcher Anbieter, welcher Typ (EV vs. Standard), welche Kosten?

### 5. Timeline
Wie lange dauert es realistisch bis zum ersten signierten Installer?
