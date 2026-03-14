# Recherche-Prompt: DMS fuer regulatorische Pflichten bei Finanzdienstleistern

*Stand: 12. Maerz 2026*
*Zweck: Unbeaufsichtigte Recherche ohne Rueckfragen*

---

## Auftrag

Du bist ein Analyst fuer regulatorische IT-Loesungen im Finanzdienstleistungssektor (Deutschland/EU).
Recherchiere gruendlich und erstelle einen strukturierten Bericht.

Speichere das Ergebnis als: `docs/konzept/recherche-ergebnis-dms-finanzdienstleister.md`

Lies vorher diese Kontextdokumente:
- `docs/konzept/audit-log-npm-marktrecherche.md` (regulatorischer Kontext NIS2, DORA, GoBD)
- `docs/konzept/audit-log-npm-bewertung.md` (strategische Bewertung audit-chain)
- `docs/konzept/gesamtkonzept-v4.md` (Code-Fabrik Gesamtstrategie)
- `CLAUDE.md` (Monorepo-Struktur, Tech-Stack)

---

## Hintergrund

Ein Finanzdienstleister (Versicherungsmakler, unabhaengiger Finanzberater, Vermittler nach §34d/f/h/i GewO)
unterliegt umfangreichen regulatorischen Dokumentationspflichten:

- **IDD (Insurance Distribution Directive)**: Beratungsdokumentation, Wuensche-und-Beduerfnisse-Analyse
- **MiFID II**: Geeignetheitspruefung, Kostentransparenz, Best Execution
- **DSGVO**: Verarbeitungsverzeichnis, Einwilligungen, Loeschkonzept, Auskunftspflicht
- **GwG (Geldwaeschegesetz)**: KYC-Dokumentation, Verdachtsmeldungen, Risikoanalyse
- **DORA**: IKT-Risikomanagement, Incident-Management, Audit-Logs
- **GoBD**: Unveraenderbarkeit, Nachvollziehbarkeit, Zeitgerechtheit
- **BaFin-Rundschreiben**: MaComp, MaRisk (fuer groessere Haeuser)
- **Taetigkeitsregister (DIHK)**: §34d-Registrierung, Weiterbilungsnachweise

Die Hypothese: Ein Self-Hosted Git-basiertes System (Forgejo, Gitea, GitLab CE) koennte als
revisionssicheres Dokumentenmanagementsystem dienen, weil Git von Natur aus:
- Jede Aenderung versioniert (wer, wann, was)
- Hash-Ketten fuer Integritaet nutzt (SHA-1/SHA-256)
- Branches fuer Workflows ermoeglicht (Entwurf → Pruefung → Freigabe)
- Merge Requests als Vier-Augen-Prinzip abbilden kann
- Self-Hosted keine Cloud-Abhaengigkeit erzeugt

---

## Recherche-Aufgaben

### 1. Git als DMS — Existierende Praxis

Recherchiere ob und wie Git/Gitea/Forgejo/GitLab bereits als DMS eingesetzt werden:

- Gibt es Unternehmen oder Projekte, die Git-basierte Systeme als regulatorisches DMS nutzen?
- Gibt es Blog-Posts, Fachartikel, Konferenzvortraege zu "Git as document management"?
- Gibt es Forgejo/Gitea-Plugins oder -Erweiterungen fuer Dokumentenmanagement?
- Wie wird Git in regulierten Branchen (Pharma, Medizintechnik, Finanz) fuer Dokumentation genutzt?
  - Besonders: FDA 21 CFR Part 11 (elektronische Aufzeichnungen) — gibt es Parallelen?
- Was sagen Auditoren/Wirtschaftspruefer zu Git als Audit-Trail?

### 2. Regulatorische Anforderungen — Mapping

Erstelle eine Matrix: Welche regulatorischen Anforderungen kann ein Git-basiertes DMS abdecken?

| Anforderung | Regulierung | Git-Feature | Abdeckung | Luecke |
|---|---|---|---|---|
| Versionierung | GoBD | git log | ? | ? |
| Unveraenderbarkeit | GoBD | SHA-Hash | ? | ? |
| Vier-Augen-Prinzip | MaRisk/MaComp | Merge Request | ? | ? |
| Zugriffskontrolle | DSGVO | Repo-Permissions | ? | ? |
| Aufbewahrungsfristen | GoBD/HGB | ? | ? | ? |
| Loeschkonzept | DSGVO | ? | ? | ? |
| Volltextsuche | Praxis | ? | ? | ? |
| Signatur | eIDAS/GoBD | GPG-Signatur | ? | ? |
| Zeitstempel | GoBD | Commit-Timestamp | ? | ? |
| Audit-Trail | DORA/NIS2 | git log --all | ? | ? |

### 3. Bestehende DMS-Loesungen fuer Finanzdienstleister

Recherchiere die gaengigen DMS-Loesungen die Finanzdienstleister heute nutzen:

**Branchenspezifisch:**
- Gibt es DMS speziell fuer Versicherungsmakler / §34d-Vermittler?
- Welche Maklerverwaltungsprogramme (MVP) haben integriertes DMS? (z.B. Ameise, VEMA, Thinksurance, Blau Direkt, Hypo Portal, iS2, Keasy)
- Was kosten diese Loesungen? (pro User/Monat, Setup-Gebuehren)

**Generische DMS mit Compliance-Fokus:**
- ELO, Docuware, d.velop, ecoDMS, Amagno, Alfresco, Mayan EDMS
- Open-Source-Alternativen: Paperless-ngx, Mayan EDMS, OpenKM, Nuxeo
- Welche davon sind GoBD-zertifiziert oder haben GoBD-Verfahrensdokumentation?

**Cloud vs. Self-Hosted:**
- Welche DMS bieten Self-Hosted/On-Premise? (relevant wegen DORA: IKT-Drittanbieter-Risiko)
- Was sagen BaFin/DORA zur Cloud-Nutzung fuer regulatorische Dokumente?

### 4. Git-DMS vs. klassisches DMS — Staerken/Schwaechen

Erstelle einen ehrlichen Vergleich:

| Kriterium | Git-DMS (Forgejo) | Klassisches DMS (ELO/Docuware) | Bewertung |
|---|---|---|---|
| Versionierung | Natuerlich | Ja | ? |
| Integritaet | SHA-Hash (kryptographisch) | Datenbankbasiert | ? |
| Workflow | Merge Requests | Workflow-Engine | ? |
| Volltextsuche | Eingeschraenkt (Code-Suche) | Stark (OCR, Metadaten) | ? |
| Binaere Dateien (PDF, Scans) | Schlecht (Blob-Handling) | Gut | ? |
| OCR / Texterkennung | Nein | Oft integriert | ? |
| Aufbewahrungsfristen | Manuell | Automatisiert | ? |
| Benutzerfreundlichkeit | Entwickler-UI | Business-UI | ? |
| Kosten | Gering (Self-Hosted) | Hoch (Lizenz + Wartung) | ? |
| GoBD-Konformitaet | Nicht zertifiziert | Oft zertifiziert | ? |
| Audit-Trail | Git-Log (maechtig) | Proprietaer | ? |
| DSGVO-Loeschung | Problematisch (git history) | Unterstuetzt | ? |
| Signatur | GPG-Commits | Qualifizierte eSignatur | ? |

### 5. Hybrid-Ansatz — Git + audit-chain

Untersuche ob ein Hybrid-Modell sinnvoll waere:

- Forgejo als Basis-DMS (Versionierung, Workflow, Zugriffskontrolle)
- `audit-chain` als zusaetzliche Integritaetsschicht (HMAC-SHA256 ueber Dokument-Metadaten)
- Paperless-ngx oder Mayan EDMS fuer OCR/Scan-Verarbeitung, Forgejo fuer Freigabe-Workflow
- Gibt es Beispiele fuer solche Hybrid-Architekturen?

### 6. Marktchance bewerten

- Gibt es eine Zielgruppe die ein Git-basiertes DMS fuer regulatorische Zwecke kaufen wuerde?
- Wie gross ist der Markt fuer DMS bei Finanzdienstleistern in DACH?
- Waere das ein eigenstaendiges Produkt oder ein Feature fuer bestehende Code-Fabrik-Produkte?
- Passt es zur Code-Fabrik-Strategie (lokal, kein Cloud-Zwang, pruefbar)?
- Wuerde ein Finanzdienstleister mit Git-UI arbeiten oder braucht er eine Abstraktion darueber?

### 7. Konkrete Beispiele und Referenzen

Suche gezielt nach:

- **"Git as document management system"** — Blog-Posts, Diskussionen
- **"Forgejo DMS"** oder **"Gitea document management"** — Plugins, Erweiterungen
- **"Git compliance documentation"** — regulierte Branchen
- **"revisionssicheres Archiv Git"** — deutschsprachige Quellen
- **"GoBD Git"** oder **"GoBD Versionierung"** — Fachartikel
- **"DORA Dokumentenmanagement"** — Anforderungen
- **"Versicherungsmakler DMS"** — Branchenloesungen
- **"§34d Dokumentation Software"** — spezifische Loesungen
- **"FDA 21 CFR Part 11 Git"** — Parallelen aus Pharma/Medtech
- **Hacker News / Reddit**: "git for documents", "git based wiki compliance"

---

## Ausgabeformat

Erstelle den Bericht als `docs/konzept/recherche-ergebnis-dms-finanzdienstleister.md` mit:

1. **Executive Summary** (5-10 Saetze)
2. **Git als DMS — Stand der Praxis** (mit Quellen und Links)
3. **Regulatorisches Mapping** (Matrix wie oben, ausgefuellt)
4. **Wettbewerbsanalyse DMS-Markt** (Branchenloesungen + generisch + Open Source)
5. **Git-DMS vs. Klassisch** (ehrlicher Vergleich mit Bewertung)
6. **Hybrid-Modell** (Machbarkeit und Architekturskizze)
7. **Marktchance und Empfehlung** (Go/No-Go mit Begruendung)
8. **Quellen** (alle URLs)

Jede Behauptung mit Quelle belegen. Wenn keine Quelle findbar: explizit als "nicht verifiziert" markieren.
Keine Vermutungen als Fakten darstellen.

---

## Wichtige Hinweise

- **Sprache:** Deutsch (Bericht), Englisch (Suchbegriffe wo noetig)
- **Keine Nachfragen stellen** — bei Unklarheiten die wahrscheinlichste Interpretation waehlen und Annahme dokumentieren
- **Ehrlich bewerten** — wenn Git als DMS fuer Finanzdienstleister Unsinn ist, das klar sagen
- **Quellen pruefen** — npm Registry, GitHub, offizielle Seiten der DMS-Anbieter, BaFin, BMF
- **Zeitlimit:** Max 30 Minuten Recherche, dann Ergebnis schreiben
