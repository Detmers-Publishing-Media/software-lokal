# Migrations-Checkliste

Template fuer Technologie-Wechsel (Framework, Build-Tool, Runtime etc.).
Kopieren und als eigene Story abarbeiten.

## Vorlage: Migration [VON] → [NACH]

### Code

- [ ] Keine Imports des alten Frameworks in `src/` (alle Produkte)
- [ ] Keine Imports in `packages/` (shared, vereins-shared, electron-platform)
- [ ] Keine Imports in `tests/`
- [ ] `grep -rn "ALTER_FRAMEWORK" . --include="*.js" --include="*.svelte"` liefert 0 Treffer

### Dependencies

- [ ] `package.json`: Alte Dependencies entfernt (alle Workspaces)
- [ ] `peerDependencies`: Alte Eintraege entfernt
- [ ] `pnpm install` laeuft fehlerfrei
- [ ] `pnpm lint:unused` meldet keine neuen Warnungen

### Infrastruktur

- [ ] Ansible-Rollen: Alte Build-Toolchain entfernt oder aus Playbooks ausgetragen
- [ ] `pnpm lint:ansible` meldet keine verwaisten Rollen
- [ ] Docker-Compose: Keine alten Services/Volumes
- [ ] CI/CD Workflows: Alte Build-Steps entfernt

### Dokumentation

- [ ] `CLAUDE.md` Tech-Stack aktualisiert
- [ ] Produkt-`CLAUDE.md` aktualisiert (alle betroffenen Produkte)
- [ ] `spec.yml` aller betroffenen Produkte aktualisiert
- [ ] `bundles.json` tech-Feld aktualisiert
- [ ] `.gitignore`: Alte Build-Artefakte entfernt

### Abnahme

- [ ] `grep -rn "ALTER_FRAMEWORK" . --include="*.js" --include="*.svelte" --include="*.yml" --include="*.json" | grep -v node_modules | grep -v docs/konzept/` liefert 0 Treffer
- [ ] `pnpm lint:unused` — 0 Warnungen
- [ ] `pnpm lint:ansible` — 0 Warnungen
- [ ] `CLAUDE.md` erwaehnt das alte Framework nicht mehr (ausser in historischen Referenzen)

## Hinweise

- Historische Dokumente (`docs/konzept/`) muessen nicht bereinigt werden
- Die Checkliste wird als eigene Story erstellt, nicht als AC in der Migrations-Story
- Bei Unsicherheit: `grep` ist das beste Werkzeug
