# Test-Konventionen (Phase 0)

## Verzeichnisstruktur

```
produkt-{name}/
├── src/                         Quellcode
├── tests/                       Phase 0 Tests (Linux, immer)
│   ├── test_*.py                pytest
│   ├── *.Tests.ps1              Pester (pwsh)
│   ├── test_*.sh                bats
│   ├── fixtures/                Statische Testdaten, committet
│   │   ├── valid_input.csv
│   │   └── expected_output.html
│   └── windows/                 Phase 1+2 (Azure, nur wenn noetig)
│       └── .gitkeep
├── test-results/                Generiert, NICHT committet
├── sample_data/                 Beispieldaten fuer CLI-Aufruf
├── requirements.txt             Python-Abhaengigkeiten
├── package.json                 Node.js (falls zutreffend)
└── .gitignore                   Enthaelt test-results/
```

## Regeln

1. **tests/ = Linux (Phase 0, immer, 0 EUR)**
   - pytest, npm test, bats, Pester (pwsh)
   - Laeuft auf dem Forgejo Runner (host-Modus auf PROD)
   - `--ignore=tests/windows` in allen Phase-0-Workflows

2. **tests/windows/ = Azure (Phase 1+2, nur wenn noetig)**
   - VBA-Makros, COM-Automation, Windows-Registry
   - Wird von Phase 0 explizit ignoriert
   - Kommt erst mit ADR-009 (dedizierter Test-Server)

3. **tests/fixtures/ = Statische Testdaten**
   - CSV, JSON, HTML-Referenzdateien
   - Committet ins Repository
   - Kein generierter Output hier

4. **test-results/ = Generierter Output**
   - JUnit-XML, Coverage-Reports
   - In .gitignore, wird NICHT committet

## Workflow (auto-test.yml)

Der Workflow erkennt automatisch welche Test-Runner noetig sind:

| Bedingung | Job | Runner |
|---|---|---|
| requirements.txt oder pyproject.toml vorhanden | test-python | pytest + Coverage |
| package.json vorhanden | test-node | npm test |
| tests/test_*.sh vorhanden | test-bash | bats |

## Coverage

- Python: `--cov-fail-under=70` (Minimum 70% Zeilenabdeckung)
- Node.js: je nach Projekt (npm test Script entscheidet)

## Entscheidungsbaum: Phase 0 oder Phase 1+2?

```
Script nutzt win32com, pywin32 oder COM-Automation?
  -> Ja -> Phase 1+2
  -> Nein:

Muss ein VBA-Makro AUSGEFUEHRT werden (nicht nur gelesen)?
  -> Ja -> Phase 1+2
  -> Nein:

Nutzt Windows-Registry, WMI, .NET Framework?
  -> Ja -> Phase 1+2
  -> Nein:

Hardcoded Windows-Pfade (C:\...)?
  -> Refactorbar -> Refactorn (pathlib), dann Phase 0
  -> Nicht refactorbar -> Phase 1+2
  -> Nein:

-> Phase 0
```

Wenn ein Script refactored werden KANN um ohne Windows-APIs
auszukommen, ist das IMMER bevorzugt.

## Referenz-Produkt

`products/fruehwarnreport/` — Python, 730 Zeilen, 24 pytest-Tests.
CSV -> HTML Report ohne Windows-APIs. Zeigt das vollstaendige Pattern.
