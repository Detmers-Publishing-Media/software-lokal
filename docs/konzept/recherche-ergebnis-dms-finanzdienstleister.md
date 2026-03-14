# DMS fuer Finanzdienstleister — Recherche-Ergebnis

*Stand: 12. Maerz 2026*
*Basis: recherche-prompt-dms-finanzdienstleister.md*

---

## 1. Executive Summary

Git-basierte Systeme (Forgejo, Gitea, GitLab) werden in regulierten Branchen bereits
fuer Software-Dokumentation eingesetzt — insbesondere in der Medizintechnik (FDA 21 CFR Part 11,
IEC 62304) mit nachweisbarem Erfolg bei FDA-Einreichungen. Fuer **allgemeines Dokumentenmanagement
bei Finanzdienstleistern** gibt es jedoch **keine dokumentierte Praxis** und erhebliche
strukturelle Luecken (binaere Dateien, OCR, DSGVO-Loeschung, Benutzerfreundlichkeit).

Der Markt fuer DMS bei Finanzdienstleistern in Deutschland ist gut besetzt: Branchenloesungen
(Ameise, Keasy, iS2) decken Makler-spezifische Anforderungen ab, generische DMS (ELO, DocuWare,
d.velop) bieten GoBD-zertifizierte Archivierung, Open-Source-Alternativen (Paperless-ngx) sind
nicht GoBD-konform.

Ein **Hybrid-Ansatz** (Forgejo fuer Richtlinien-Versionierung + klassisches DMS fuer Belege)
ist denkbar, aber die Zielgruppe (Versicherungsmakler, §34d-Vermittler) wuerde mit einer
Git-Oberflaeche nicht arbeiten. Eine brauchbare Loesung wuerde eine **komplette Abstraktion**
ueber Git erfordern — im Grunde ein eigenes DMS mit Git als Backend.

**Empfehlung: Kein eigenstaendiges Produkt.** Die Idee hat Substanz als internes Tool fuer
Code-Fabrik selbst (Richtlinien-Management, Compliance-Dokumentation), aber nicht als
Kundenprodukt fuer Finanzdienstleister.

---

## 2. Git als DMS — Stand der Praxis

### 2.1 Medizintechnik und Pharma (staerkste Evidenz)

Git wird in FDA-regulierten Umgebungen **aktiv und erfolgreich** als Audit-Trail
fuer Software-Dokumentation eingesetzt:

**Konkrete Fallstudien** (Quelle: IntuitionLabs):

| Unternehmen | Regulierung | Git-Einsatz | Ergebnis |
|---|---|---|---|
| Acme HealthTech | FDA 510(k) | GitFlow + Branch Protection + Merge-Review als elektronische Signatur | FDA-Pruefung bestanden, Reviewer lobten "well organized and traceable" |
| PharmaCo | IND Clinical Data | GPG-signierte Commits + Zwei-Personen-Review = Dual-Signature Document Control | FDA akzeptierte ohne zusaetzliche Software-Audit-Anforderungen |
| MediSoft | De Novo SaMD | Software Version History aus Git-Logs generiert, Commit-IDs als Traceability-Referenz | Auditor hob Git-Audit-Trail als vorbildlich hervor |

**RDM (Regulatory Documentation Manager)** — Open-Source-Tool (github.com/innolitics/rdm):
- Markdown-Templates + Python-Scripts fuer IEC 62304, FDA 510(k), ISO 14971
- Dokumentation wird neben Code in Git versioniert
- Git-Hooks fuegen Issue-Nummern automatisch in Commit-Messages ein
- Traceability-Matrices werden aus gespeicherten Daten generiert

**GitLab fuer ISO 13485:2016** — GitLab vermarktet aktiv seine Eignung fuer
Medizinprodukte-Dokumentation: Merge-Request-Approvals als Document-Control-Workflow,
Wiki als Dokumentationssystem, vollstaendige Aenderungshistorie.

**gittuf** (OpenSSF-Projekt) — Zusaetzliche Sicherheitsschicht fuer Git:
- Merkle-Tree-basierter Reference State Record (RSL)
- Append-only Log aller Aenderungen
- Granulare Berechtigungen fuer Branches, Tags, Dateien
- GPG/SSH/OIDC-Signierung
- Rueckwaertskompatibel mit existierenden Repositories

### 2.2 Rechtswesen und oeffentlicher Sektor

- **Open Law Library**: DC Code wird per Git verwaltet, Publikationsprozess von Monaten auf ~1 Woche verkuerzt
- **Gesetzesentwuerfe**: Einzelne Regierungen experimentieren mit Git fuer Gesetzestexte (versionierte Aenderungen, Pull Requests als Aenderungsantraege)

### 2.3 Finanzdienstleister

**Keine dokumentierte Praxis gefunden.** Es gibt:
- Keine Blog-Posts zu "Git DMS Versicherungsmakler" oder "Git Finanzdienstleister"
- Keine Forgejo/Gitea-Plugins fuer Dokumentenmanagement
- Keine Konferenzvortraege zum Thema
- Keine Diskussionen auf Hacker News oder Reddit

**Fazit:** Git als DMS existiert in der Praxis nur fuer **Software-Dokumentation** in
regulierten Branchen, nicht fuer allgemeines Dokumentenmanagement.

---

## 3. Regulatorisches Mapping

### 3.1 Anforderungen vs. Git-Features

| Anforderung | Regulierung | Git-Feature | Abdeckung | Luecke |
|---|---|---|---|---|
| Versionierung | GoBD | `git log` mit Autor, Timestamp, Diff | **Voll** | Keine |
| Unveraenderbarkeit | GoBD | SHA-Hash-Kette (jeder Commit kryptographisch verkettet) | **Stark** | Rebase/Force-Push muss deaktiviert werden (Forgejo: Branch Protection) |
| Vier-Augen-Prinzip | MaRisk/MaComp | Merge Request mit Required Reviewers | **Voll** | Konfiguration noetig (Forgejo unterstuetzt Protected Branches) |
| Zugriffskontrolle | DSGVO | Repo-Permissions (Owner/Admin/Write/Read) | **Ausreichend** | Keine feingranulare Ordner-Berechtigung (nur Repo-Ebene) |
| Aufbewahrungsfristen | GoBD (10 Jahre), HGB | Branch/Tag-basiert moeglich | **Schwach** | Keine automatische Fristenverwaltung, keine Warnung bei Ablauf |
| Loeschkonzept | DSGVO Art. 17 | `git filter-branch` / BFG Repo-Cleaner | **Problematisch** | Git ist **per Design unveraenderlich**. Loeschung erfordert History-Rewrite, bricht alle Hashes, ist technisch moeglich aber zerstoert den Audit-Trail. **Fundamentaler Konflikt zwischen GoBD (Unveraenderbarkeit) und DSGVO (Loeschung).** |
| Volltextsuche | Praxis | Forgejo Code-Suche | **Schwach** | Nur Textdateien. Keine OCR, keine Metadaten-Suche, kein Fuzzy-Search. |
| Signatur | eIDAS/GoBD | GPG-signierte Commits/Tags | **Gut** | Keine qualifizierte elektronische Signatur (QES) im Sinne von eIDAS. GPG reicht fuer GoBD, nicht fuer eIDAS-Stufe "qualifiziert". |
| Zeitstempel | GoBD | Commit-Timestamp | **Ausreichend** | Nicht manipulationssicher (Autor kann Timestamp faelschen). Server-seitige Timestamps bei Forgejo moeglich (Push-Zeitpunkt), aber nicht im Commit selbst. |
| Audit-Trail | DORA/NIS2 | `git log --all --oneline` + Forgejo Activity Log | **Stark** | Sehr detailliert. Wer hat wann was geaendert, mit Diff. Uebertrifft die meisten DMS. |
| Binaere Dateien | Praxis | Git LFS (Large File Storage) | **Maessig** | Funktioniert, aber kein Diff fuer PDFs/Scans. Vergisst man LFS, blaehen Binaerdateien das Repo auf. |

### 3.2 DORA-spezifische Dokumentationsanforderungen

DORA verlangt umfangreiche Dokumentation (Quelle: BaFin Fachartikel Dez 2024, grc-factory.com):

| Dokumenttyp | Git-tauglich? | Begruendung |
|---|---|---|
| IKT-Governance-Konzept | **Ja** | Textdokument, profitiert von Versionierung |
| IKT-Risikomanagement-Framework | **Ja** | Strukturiertes Dokument mit regelmaessigen Updates |
| Asset-Inventare | **Bedingt** | Besser in DB/Spreadsheet, aber YAML/CSV in Git moeglich |
| Incident-Response-Plaene | **Ja** | Textdokument, Aenderungen muessen nachvollziehbar sein |
| Drittparteienstrategie | **Ja** | Textdokument |
| Informationsregister (Art. 28) | **Bedingt** | Strukturierte Daten, BaFin erwartet spezifisches Format |
| Vertragsdokumente | **Nein** | PDFs, Scans — Git nicht geeignet |
| Meldeprozesse/Formulare | **Bedingt** | Templates in Markdown moeglich, ausgefuellte Formulare als PDF nicht |

**Ergebnis:** Etwa 50% der DORA-Dokumentation waere Git-tauglich (Richtlinien, Konzepte, Plaene).
Die andere Haelfte (Vertraege, Formulare, Nachweise) besteht aus Binaerdateien und ist fuer Git ungeeignet.

---

## 4. Wettbewerbsanalyse DMS-Markt

### 4.1 Branchenspezifische Loesungen (Versicherungsmakler)

Es gibt ca. **70 Maklerverwaltungsprogramme (MVP)** in Deutschland (Quelle: maklerkonzepte.com):

| Loesung | Anbieter/Pool | Typ | DMS integriert | Preis (ca.) |
|---|---|---|---|---|
| **Ameise** | Blau Direkt | Cloud-MVP | Ja (Dokumentenablage, BiPRO-Abruf) | Pool-abhaengig, oft 50% Rabatt ueber Pool |
| **Keasy** | vfm-Gruppe | Cloud-MVP | Ja (BiPRO, digitale Signatur, Kundenportal) | Pool-abhaengig |
| **iS2** (Ameise pro) | iS2 Software | On-Prem/Cloud | Ja (GDV-konform) | Ab ca. 50 EUR/Monat/User |
| **AMS** | Assfinet | Cloud-MVP | Ja | Pool-abhaengig |
| **VEMA-Bestandsverwaltung** | VEMA | Cloud | Ja | Pool-Mitgliedschaft |

**Charakteristik:** Diese Systeme sind tief in das Makler-Oekosystem integriert:
BiPRO-Schnittstellen (automatischer Dokumentenabruf von Versicherern), GDV-Datenaustausch,
Courtage-Abrechnung, Kundenportal, DSGVO-Einwilligungsverwaltung. Ein Git-basiertes System
kann das nicht ansatzweise leisten.

### 4.2 Generische DMS mit GoBD-Fokus

| Loesung | Typ | GoBD-konform | Preis (ca.) | Staerke |
|---|---|---|---|---|
| **ELO** | On-Prem/Cloud | Ja (zertifiziert) | Ab 29 EUR/Monat (mit DATEV) | DATEV-Integration, Finanzwesen |
| **DocuWare** | Cloud/On-Prem | Ja | Ab 35 EUR/User/Monat | Revisionssichere Archivierung, Workflow-Engine |
| **d.velop** | Cloud | Ja | 27-55 EUR/User/Monat | Versicherungs-Branchenloesung |
| **ecoDMS** | On-Prem | Ja | 89-149 EUR einmalig/User | Guenstig, Self-Hosted |
| **nscale** (Ceyoniq) | On-Prem/Cloud | Ja | Enterprise-Pricing | Speziell fuer Versicherer |
| **Amagno** | Cloud | Ja | Ab 25 EUR/User/Monat | KI-Klassifikation |
| **bitfarm-Archiv** | On-Prem | Ja (Open Source Edition) | Free (Community) / Enterprise | Open Source Core |

### 4.3 Open-Source DMS

| Loesung | Lizenz | GoBD-konform | OCR | Self-Hosted | Bewertung fuer Finanzdienstleister |
|---|---|---|---|---|---|
| **Paperless-ngx** | GPL-3.0 | **Nein** (kein Loeschungsschutz, unzureichendes Audit-Log). Community-Fork `paperless-ngx-gobd` existiert mit django-auditlog, aber nicht offiziell. Ein Steuerpruefer erteilte informelle Genehmigung, aber schriftlich verweigert. | Ja (Tesseract) | Ja | Beliebt fuer Privatpersonen, **nicht fuer regulierte Finanzdienstleister** |
| **Mayan EDMS** | Apache 2.0 | Nicht zertifiziert | Ja | Ja | Funktionsreich, aber komplex. Kein Fokus auf deutsche Regulierung. |
| **OpenKM** | GPL-2.0 | Nicht zertifiziert | Ja | Ja | Community-Edition eingeschraenkt |
| **bitfarm-Archiv** | GPL-3.0 (Community) | Ja (Enterprise) | Ja | Ja | **Einzige Open-Source-Loesung mit GoBD-Zertifizierung** (Enterprise-Version) |

### 4.4 Marktgroesse

- **Globaler DMS-Markt:** ~7,16 Mrd. USD (2025), Prognose ~24,91 Mrd. USD (2034), CAGR 14,86% (Quelle: Mordor Intelligence)
- **DACH-spezifisch:** Keine isolierten Zahlen verfuegbar, aber Deutschland ist mit ~80.000 Versicherungsmaklern und ~38.000 Finanzanlagenvermittlern (§34f) ein grosser Markt
- **Cloud vs. On-Prem:** Trend geht zu Cloud, aber DORA erzeugt Gegendruck bei Finanzdienstleistern (IKT-Drittanbieter-Risiko)

---

## 5. Git-DMS vs. Klassisches DMS — Ehrlicher Vergleich

| Kriterium | Git-DMS (Forgejo) | Klassisches DMS (ELO/DocuWare) | Gewinner |
|---|---|---|---|
| **Versionierung** | Natuerlich, jede Aenderung als Commit mit Diff | Ja, aber oft nur "neue Version hochladen" ohne Diff | **Git** |
| **Integritaet** | SHA-256 Hash-Kette (kryptographisch, manipulationssicher) | Datenbankbasiert (Anbieter-abhaengig, selten kryptographisch) | **Git** |
| **Audit-Trail** | Extrem detailliert: Wer, Wann, Was (Zeilengenau), mit kryptographischem Beweis | Vorhanden, aber Tiefe variiert. Oft nur "Dokument geaendert von X". | **Git** |
| **Workflow** | Merge Requests, Branch Protection, Required Reviews | Dedizierte Workflow-Engine (mehrstufig, bedingt, mit Eskalation) | **DMS** |
| **Volltextsuche** | Nur Plaintext-Dateien. Kein OCR. Keine Metadaten. | Stark: OCR, Metadaten, Fuzzy-Search, facettierte Suche | **DMS** (deutlich) |
| **Binaere Dateien** | Schlecht. Git LFS moeglich, aber kein Diff, kein Preview, kein OCR. | Gut: PDF-Viewer, Scan-Import, Thumbnail-Preview, Annotation | **DMS** (deutlich) |
| **OCR / Texterkennung** | Nein | Oft integriert (Tesseract, ABBYY) | **DMS** |
| **Aufbewahrungsfristen** | Manuell (keine automatische Fristenverwaltung) | Automatisiert (Retention Policies, Warnung, Auto-Archivierung) | **DMS** |
| **DSGVO-Loeschung** | **Fundamental problematisch.** Git-History ist unveraenderlich. Loeschung erfordert History-Rewrite, bricht Integritaet. | Unterstuetzt (Dokument loeschen, Audit-Log behalten) | **DMS** (deutlich) |
| **Benutzerfreundlichkeit** | Entwickler-UI (Commit, Branch, Merge Request) | Business-UI (Drag & Drop, Ordnerstruktur, Suche) | **DMS** (deutlich) |
| **Kosten** | Gering (Self-Hosted, keine Lizenz) | Hoch (27-55 EUR/User/Monat oder Kauflizenz) | **Git** |
| **GoBD-Konformitaet** | Nicht zertifiziert. Technisch moeglich, aber kein Anbieter hat es durchzertifiziert. | Oft zertifiziert (ELO, DocuWare, ecoDMS, bitfarm) | **DMS** |
| **Signatur** | GPG-signierte Commits (fortgeschrittene eSignatur) | Qualifizierte eSignatur (eIDAS-konform) moeglich | **DMS** |
| **Branchenintegration** | Keine (kein BiPRO, kein GDV, kein DATEV) | Oft vorhanden (DATEV, BiPRO, ERP-Anbindung) | **DMS** (deutlich) |

**Score: Git 3 — DMS 8 — Unentschieden 0**

Git gewinnt bei Versionierung, Integritaet/Audit-Trail und Kosten.
DMS gewinnt bei allem anderen — insbesondere bei den fuer Finanzdienstleister
kritischen Punkten: binaere Dateien, OCR, DSGVO-Loeschung, Benutzerfreundlichkeit,
Branchenintegration, GoBD-Zertifizierung.

---

## 6. Hybrid-Modell — Machbarkeit

### 6.1 Architekturskizze

```
                    ┌─────────────────────────────────┐
                    │         Business-UI              │
                    │  (Web-App, kein Git sichtbar)    │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │       API-Layer                   │
                    │  (Abstraktion ueber Git + DMS)    │
                    └──────┬──────────┬───────────────┘
                           │          │
              ┌────────────▼──┐  ┌────▼──────────────┐
              │   Forgejo     │  │  Paperless-ngx     │
              │ (Git-Backend) │  │  (Scan/OCR/PDF)    │
              │               │  │                    │
              │ Richtlinien   │  │ Vertraege          │
              │ Konzepte      │  │ Scans              │
              │ Policies      │  │ Rechnungen         │
              │ Checklisten   │  │ Korrespondenz      │
              └───────┬───────┘  └────────┬───────────┘
                      │                   │
              ┌───────▼───────────────────▼───────────┐
              │          audit-chain                    │
              │  (HMAC-SHA256 ueber Dokument-Metadaten │
              │   beider Systeme)                      │
              └────────────────────────────────────────┘
```

### 6.2 Was der Hybrid leisten koennte

| Funktion | Forgejo | Paperless-ngx | audit-chain |
|---|---|---|---|
| Richtlinien versionieren | ✓ (Markdown, Merge Requests) | | |
| Scans/PDFs archivieren | | ✓ (OCR, Tags, Suche) | |
| Freigabe-Workflow | ✓ (Merge Request + Review) | | |
| Manipulationssicherer Audit-Trail | ✓ (Git-Hashes) | | ✓ (HMAC-Kette ueber beide Systeme) |
| Aufbewahrungsfristen | | ✓ (Custom Fields) | |
| Volltextsuche | ✓ (Plaintext) | ✓ (OCR-Text) | |

### 6.3 Bewertung

**Technisch machbar, aber:**

1. **Hoher Entwicklungsaufwand:** Die Business-UI ist das groesste Stueck Arbeit. Kein Endnutzer soll Git sehen. Das bedeutet: Eigene Web-App mit Drag & Drop, Ordnerstruktur, Suchmaske, Freigabe-Buttons — die intern Git-Commits und Paperless-API-Calls macht. Das ist im Grunde ein **komplettes DMS neu bauen** mit Git als Storage-Backend.

2. **DSGVO-Loeschung bleibt ungeloest:** Der fundamentale Konflikt zwischen Git-Unveraenderlichkeit und DSGVO Art. 17 betrifft personenbezogene Daten in Richtlinien-Texten (z.B. Zustaendigkeiten, Ansprechpartner). Entweder: Keine personenbezogenen Daten in Git speichern (unrealistisch fuer Compliance-Dokumente), oder History-Rewrites akzeptieren (bricht Integritaet).

3. **Kein Markt-Pull:** Die Zielgruppe (Versicherungsmakler, §34d-Vermittler) kennt und nutzt ihre MVPs (Ameise, Keasy, AMS). Diese Systeme haben integriertes DMS. Ein Makler hat keinen Grund, ein separates DMS zu kaufen — schon gar nicht eines das auf Git basiert.

4. **Zwei Systeme statt einem:** Der Hybrid verdoppelt die Administrationskosten. Forgejo + Paperless-ngx + API-Layer + Business-UI + audit-chain = fuenf Komponenten statt einer DMS-Installation.

---

## 7. Marktchance und Empfehlung

### 7.1 Zielgruppen-Analyse

| Zielgruppe | Interesse an Git-DMS | Begruendung |
|---|---|---|
| Versicherungsmakler (§34d) | **Keins** | Nutzen MVPs mit integriertem DMS. Kein technisches Verstaendnis fuer Git. |
| Finanzanlagenvermittler (§34f) | **Keins** | Gleiche Situation. |
| IT-Abteilung mittelgrosser Versicherer | **Gering** | Haben bereits ELO/DocuWare/nscale. Kein Anreiz zum Wechsel. |
| Compliance-Abteilung (DORA) | **Moeglich** | DORA-Richtlinien versionieren, Vier-Augen-Freigabe, Audit-Trail. Aber nur fuer ~50% der Dokumente (Text, nicht binaer). |
| Code-Fabrik selbst | **Ja** | Eigene Compliance-Dokumentation (CLAUDE.md, Governance, ADRs, Runbooks) ist bereits in Git. audit-chain koennte zusaetzliche Integritaet liefern. |
| Open-Source-Community | **Nische** | Entwickler die Git sowieso nutzen und Compliance-Dokumentation automatisieren wollen. |

### 7.2 Strategische Bewertung

| Kriterium | Bewertung |
|---|---|
| Marktluecke | **Nein** — DMS-Markt ist gesaettigt. 70+ MVPs, 10+ generische DMS, Open-Source-Alternativen vorhanden. |
| Technische Differenzierung | **Ja** — Kryptographischer Audit-Trail (Git + audit-chain) ist staerker als jedes klassische DMS. Aber Differenzierung allein reicht nicht. |
| Zielgruppen-Fit | **Nein** — Finanzdienstleister arbeiten nicht mit Git-UIs. Eine Abstraktion waere ein komplett neues DMS. |
| Code-Fabrik-Strategie-Fit | **Teilweise** — Passt zu "Kein Geheimnis" und "Keine Cloud", aber Code-Fabrik baut Desktop-Tools, keine Web-Apps. |
| Aufwand vs. Nutzen | **Negativ** — Ein brauchbares Produkt wuerde Monate Entwicklung erfordern (Business-UI, OCR-Integration, DSGVO-Loeschkonzept, GoBD-Zertifizierung). |
| DSGVO-Kompatibilitaet | **Fundamental problematisch** — Git-Unveraenderlichkeit kollidiert mit Loeschrecht. |

### 7.3 Was stattdessen Sinn machen wuerde

**Fuer Code-Fabrik intern:**

1. **DORA-Richtlinien-Template-Paket:** Markdown-Templates fuer die ~15 DORA-Dokument-Typen (IKT-Governance, Risiko-Framework, Incident-Response, etc.), versioniert in Git. Nicht als Produkt, sondern als Open-Source-Ressource. Kein Code noetig.

2. **audit-chain + Forgejo Integration:** Ein Forgejo-Webhook der bei jedem Push ein audit-chain-Event schreibt (Repo, Commit-Hash, Autor, Timestamp). Damit haette man eine zusaetzliche HMAC-gesicherte Kette ueber allen Forgejo-Aktivitaeten. Aufwand: ~1-2 Tage. Wert: Intern nuetzlich, demonstriert audit-chain in Praxis.

3. **Nachweis Lokal als Pruefprotokoll-Tool:** Das bereits existierende Nachweis Lokal (Pruefprotokolle, Checklisten) ist naeher an dem was Finanzdienstleister brauchen als ein Git-DMS. DORA-Checklisten als Templates in Nachweis Lokal waeren ein konkreter, verkaufbarer Mehrwert.

### 7.4 Go/No-Go

| Variante | Empfehlung |
|---|---|
| Git-DMS als eigenstaendiges Produkt fuer Finanzdienstleister | **No-Go.** Kein Markt-Pull, DSGVO-Konflikt, hoher Aufwand, gesaettigter Markt. |
| Hybrid-Modell (Forgejo + Paperless-ngx + UI) | **No-Go.** Zu komplex, verdoppelt Administration, Business-UI waere ein eigenes Produkt. |
| DORA-Richtlinien-Templates (Open Source) | **Go, niedrige Prioritaet.** Geringer Aufwand, SEO-Wert, Community-Beitrag. Aber kein Umsatzpotenzial. |
| audit-chain Forgejo-Webhook | **Go.** 1-2 Tage Aufwand, demonstriert audit-chain in Praxis, intern nuetzlich. |
| DORA-Checklisten in Nachweis Lokal | **Erwaegen.** Passt zum bestehenden Produkt, konkreter Kundennutzen. Separate Bewertung noetig. |

---

## 8. Quellen

### Git als DMS / Compliance

- [Git Version Control for FDA and IEC 62304 Compliance (IntuitionLabs)](https://intuitionlabs.ai/articles/git-workflows-fda-compliance)
- [RDM: Regulatory Documentation Manager (GitHub)](https://github.com/innolitics/rdm)
- [Meeting ISO 13485:2016 Requirements with GitLab](https://about.gitlab.com/solutions/iso-13485/)
- [gittuf: A Security Layer for Git Repositories (OpenSSF)](https://openssf.org/blog/2024/01/18/introducing-gittuf-a-security-layer-for-git-repositories/)
- [gittuf Design Documentation](https://gittuf.dev/documentation/developers/design)
- [GitHub Document Management (TechnicalWriterHQ)](https://technicalwriterhq.com/documentation/document-management/github-document-management/)
- [Ensuring Compliance in Developer Workflows (GitHub Blog)](https://github.blog/enterprise-software/governance-and-compliance/ensuring-compliance-in-developer-workflows/)
- [Introducing Traceability in GitHub for Medical Software Development (ResearchGate)](https://www.researchgate.net/publication/355583075_Introducing_Traceability_in_GitHub_for_Medical_Software_Development)

### DORA-Dokumentationsanforderungen

- [BaFin: DORA-Dokumentationsanforderungen leicht(er) gemacht (Dez 2024)](https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Fachartikel/2024/fa_241217_DORA_Dokumentationsanforderungen.html)
- [DORA-Dokumentationsanforderungen – Leitfaden (GRC Factory)](https://grc-factory.com/dora-dokumentationsanforderungen-leitfaden-fuer-compliance-manager-und-wirtschaftspruefer)
- [BaFin: Cloud-Dienstleister als kritische IKT-Drittdienstleister](https://www.bafin.de/SharedDocs/FAQs/DE/DORA/Ueberwachungsrahmen_IKT_Drittdienstleister/07.html)
- [BaFin: DORA-Workshop Informationsregister 2026](https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Meldung/2026/neu/meldung_2026_02_04_dora_workshop_einreichung_informationsregister.html)
- [DORA-Anforderungen im Fokus (S+P Compliance)](https://sp-compliance.com/dora-anforderungen-im-fokus/)

### GoBD und Revisionssicherheit

- [Revisionssicher archivieren: GoBD einfach erklaert (css.de)](https://www.css.de/blog/revisionssicher-archivieren-gobd-einfach-erkl%C3%A4rt)
- [Revisionssicherheit (agorum)](https://www.agorum.com/blog/was-bedeutet-revisionssicher)
- [GoBD und Revisionssicherheit (open3a)](https://www.open3a.de/2018/07/revisionssicherheit-und-gobd)
- [Revisionssichere Archivierung (bitfarm-Archiv)](https://www.bitfarm-archiv.com/document-management/glossary/audit-proof-archiving.html)

### DMS-Anbieter

- [d.velop Branchenloesung Versicherungen](https://www.d-velop.de/branchen/versicherungen)
- [Schwindt: DMS fuer Versicherer & Finanzdienstleister](https://schwindt.de/dms-branche-versicherungen-finanzen/)
- [nscale fuer Versicherer (Ceyoniq)](https://ceyoniq.com/2026/01/30/versicherer-unter-druck-wie-digitales-dokumentenmanagement-mit-nscale-unternehmen-zukunftssicher-macht/)
- [DocuWare fuer Financial Services](https://start.docuware.com/document-management-software-for-financial-services-from-docuware)
- [DMS-Mittelstandspakete Uebersicht (ECMguide)](https://www.ecmguide.de/dms/uebersicht-zu-dms-mittelstandspaketen-21701.aspx)
- [DMS Vergleich (sc synergy)](https://scsynergy.com/wissen/blog/dms-vergleich/)
- [DMS fuer Kleinunternehmen (systemhaus.com)](https://systemhaus.com/dms-software-die-besten-dms-fuer-kleinunternehmen-loesungen-fuer-effizientes-arbeiten)

### Maklerverwaltungsprogramme

- [Ameise MVP (Blau Direkt)](https://www.blaudirekt.de/mvp/)
- [Keasy MVP (vfm)](https://www.keasy.de/)
- [Maklerkonzepte: Marktplatz MVP](https://maklerkonzepte.com/directory-marktplatz/categories/maklerverwaltungsprogramm/)

### Open-Source DMS

- [Paperless-ngx](https://docs.paperless-ngx.com/)
- [Paperless-ngx GoBD Discussion (GitHub #1880)](https://github.com/paperless-ngx/paperless-ngx/discussions/1880)
- [Paperless-ngx GoBD Best Practices (GitHub #10379)](https://github.com/paperless-ngx/paperless-ngx/discussions/10379)
- [10 Best Open Source EDMS 2025 (FormKIQ)](https://formkiq.com/blog/the-state-of-edms/the-ten-best-open-source-edms-in-2025/)

### DSGVO und Git

- [BfDI: Recht auf Loeschung (Art. 17 DSGVO)](https://www.bfdi.bund.de/DE/Buerger/Inhalte/Allgemein/Betroffenenrechte/Betroffenenrechte_L%C3%B6schung_Vergessenwerden.html)
- [HN: Git and GDPR — data subjects do not have right to erasure](https://news.ycombinator.com/item?id=16509755)

### Marktdaten

- [DMS-Markt global (Mordor Intelligence)](https://www.mordorintelligence.com/de/industry-reports/document-management-systems-market)
- [DMS-Marktuebersicht (Zoeller & Partner)](https://zoeller.de/ecm-knowhow/dms-marktuebersicht/)

### FDA / 21 CFR Part 11

- [FDA Part 11 Guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)
- [21 CFR Part 11 IT Compliance Guide (IntuitionLabs)](https://intuitionlabs.ai/articles/21-cfr-part-11-it-compliance-guide)
