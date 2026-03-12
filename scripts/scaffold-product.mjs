#!/usr/bin/env node
/**
 * scaffold-product.mjs — Erzeugt alle Boilerplate-Dateien fuer ein neues Produkt
 *
 * Aufruf: node scripts/scaffold-product.mjs products/<name>/spec.yml
 *
 * Generiert aus spec.yml:
 *   - bundles.json Eintrag
 *   - package.json
 *   - app.config.cjs
 *   - electron/main.cjs
 *   - index.html
 *   - vite.config.js
 *   - src/main.js
 *   - .github/workflows/build.yml
 *   - Portal DB-Migration (SQL)
 *   - License-Prefix Registrierung (Patch fuer keygen + client)
 *   - CLAUDE.md Template
 *
 * NICHT generiert (manuell):
 *   - src/App.svelte, routes/, lib/db.js, tests/
 *   - Icons (assets/icons/)
 *   - Forgejo-Repo anlegen
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- YAML-Parser (minimal, fuer spec.yml) ---
function parseSimpleYaml(text) {
  // Genuegt fuer flache + 1-Level verschachtelte YAML. Fuer tiefere Strukturen: npm yaml.
  const lines = text.split('\n');
  const result = {};
  let currentKey = null;
  let currentObj = null;
  let inArray = false;
  let arrayKey = null;
  let arrayItems = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key: value
    const kvMatch = trimmed.match(/^(\w[\w_-]*):\s*(.+)/);
    if (kvMatch && !trimmed.startsWith('  ') && !trimmed.startsWith('-')) {
      if (inArray && arrayKey) {
        result[arrayKey] = arrayItems;
        inArray = false;
        arrayItems = [];
      }
      const [, key, val] = kvMatch;
      result[key] = val.replace(/^["']|["']$/g, '');
      currentKey = key;
      currentObj = null;
      continue;
    }

    // Top-level key: (start of block)
    const blockMatch = trimmed.match(/^(\w[\w_-]*):\s*$/);
    if (blockMatch && !trimmed.startsWith('  ')) {
      if (inArray && arrayKey) {
        result[arrayKey] = arrayItems;
        inArray = false;
        arrayItems = [];
      }
      currentKey = blockMatch[1];
      result[currentKey] = {};
      currentObj = result[currentKey];
      continue;
    }

    // Array item at top level
    if (trimmed.match(/^- /) && currentKey) {
      if (!inArray) {
        inArray = true;
        arrayKey = currentKey;
        arrayItems = [];
      }
      arrayItems.push(trimmed.replace(/^- ["']?|["']?$/g, ''));
      continue;
    }

    // Nested key: value
    if (currentObj && trimmed.startsWith('  ')) {
      const nestedKv = trimmed.match(/^\s+(\w[\w_-]*):\s*(.+)/);
      if (nestedKv) {
        const [, k, v] = nestedKv;
        currentObj[k] = v.replace(/^["']|["']$/g, '');
      }
    }
  }

  if (inArray && arrayKey) {
    result[arrayKey] = arrayItems;
  }

  return result;
}

// --- Hilfsfunktionen ---

function getNextPort() {
  const ports = { 'mitglieder-lokal': 1420, 'finanz-rechner': 1421, 'rechnung-lokal': 1422, 'nachweis-lokal': 1423 };
  return Math.max(...Object.values(ports)) + 1;
}

function deriveLicensePrefix(productId) {
  // CF + 2 Buchstaben aus dem Produktnamen
  const parts = productId.split('-');
  const first = (parts[0] || 'XX')[0].toUpperCase();
  const second = (parts[1] || parts[0] || 'X')[0].toUpperCase();
  return `CF${first}${second}`;
}

function deriveTrialPrefix(productId) {
  const prod = deriveLicensePrefix(productId);
  return `CFT${prod[3]}`;
}

function deriveDbName(productId) {
  return productId.replace(/-lokal$/, '').replace(/-/g, '_') + '.db';
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeIfNew(path, content, force = false) {
  if (existsSync(path) && !force) {
    console.log(`  SKIP: ${path} (existiert bereits)`);
    return false;
  }
  ensureDir(dirname(path));
  writeFileSync(path, content);
  console.log(`  NEU:  ${path}`);
  return true;
}

// --- Hauptlogik ---

const specPath = process.argv[2];
if (!specPath) {
  console.error('Aufruf: node scripts/scaffold-product.mjs products/<name>/spec.yml');
  process.exit(1);
}

const specRaw = readFileSync(resolve(specPath), 'utf-8');
const spec = parseSimpleYaml(specRaw);

const productId = spec.product_id;
const productDir = join(ROOT, 'products', productId);
const name = spec.name || productId;
const version = spec.version || '0.1.0';
const license = spec.license || 'GPL-3.0-only';
const bundleId = (spec.bundles || [])[0] || `B-XX-${productId}`;
const licensePrefix = deriveLicensePrefix(productId);
const trialPrefix = deriveTrialPrefix(productId);
const dbName = deriveDbName(productId);
const port = getNextPort();
const hasDb = spec.tech_stack === 'electron-svelte' && spec.type === 'app';

console.log(`\n=== Scaffold: ${name} (${productId}) ===`);
console.log(`  Bundle:  ${bundleId}`);
console.log(`  Prefix:  ${licensePrefix} / ${trialPrefix}`);
console.log(`  DB:      ${hasDb ? dbName : 'keine'}`);
console.log(`  Port:    ${port}`);
console.log('');

// 1. bundles.json
const bundlesPath = join(ROOT, 'products', 'bundles.json');
if (existsSync(bundlesPath)) {
  const bundles = JSON.parse(readFileSync(bundlesPath, 'utf-8'));
  if (!bundles.products[productId]) {
    bundles.bundles[bundleId] = { name, products: [productId] };
    bundles.products[productId] = {
      bundles: [bundleId],
      type: spec.type || 'app',
      tech: spec.tech_stack || 'electron-svelte',
      forgejo_repo: `factory-admin/${productId}`,
    };
    writeFileSync(bundlesPath, JSON.stringify(bundles, null, 2) + '\n');
    console.log(`  UPDATE: products/bundles.json`);
  } else {
    console.log(`  SKIP:   bundles.json (${productId} existiert bereits)`);
  }
}

// 2. package.json
const deps = {
  '@codefabrik/electron-platform': 'workspace:*',
  '@codefabrik/shared': 'workspace:*',
};
if (hasDb) {
  deps['@codefabrik/app-shared'] = 'workspace:*';
  deps['@codefabrik/ui-shared'] = 'workspace:*';
  deps['better-sqlite3'] = '^11.0.0';
}

writeIfNew(join(productDir, 'package.json'), JSON.stringify({
  name: `@codefabrik/${productId}`,
  version,
  private: true,
  type: 'module',
  license,
  main: 'electron/main.cjs',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    'electron:dev': `concurrently "vite" "wait-on http://localhost:${port} && cross-env VITE_DEV_SERVER_URL=http://localhost:${port} electron ."`,
    'electron:build': 'vite build && electron-builder --publish never',
    test: 'node --test tests/test_*.js',
  },
  dependencies: deps,
  devDependencies: {
    electron: '^33.0.0',
    'electron-builder': '^25.0.0',
    vite: '^6.0.0',
    '@sveltejs/vite-plugin-svelte': '^5.0.0',
    svelte: '^5.0.0',
    concurrently: '^9.0.0',
    'wait-on': '^8.0.0',
    'cross-env': '^7.0.0',
  },
}, null, 2) + '\n');

// 3. app.config.cjs
writeIfNew(join(productDir, 'app.config.cjs'), `module.exports = {
  name: '${name}',
  identifier: 'de.detmers-publish.${productId}',
  windowTitle: '${name}',
  width: 1024,
  height: 768,
  dbName: ${hasDb ? `'${dbName}'` : 'null'},
  licensePrefix: '${licensePrefix}',
  trialPrefix: '${trialPrefix}',
  portalUrl: null,
  autoUpdate: false,
};
`);

// 4. electron/main.cjs
writeIfNew(join(productDir, 'electron', 'main.cjs'), `const config = require('../app.config.cjs');
const { createApp } = require('@codefabrik/electron-platform');
createApp(config);
`);

// 5. index.html
writeIfNew(join(productDir, 'index.html'), `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`);

// 6. vite.config.js
writeIfNew(join(productDir, 'vite.config.js'), `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: ${port},
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
`);

// 7. src/main.js
writeIfNew(join(productDir, 'src', 'main.js'), `import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;

if (import.meta.hot) {
  import.meta.hot.accept();
}
`);

// 8. .github/workflows/build.yml
const workflowYaml = `name: Test + Build (${name})

on:
  workflow_dispatch:
  push:
    tags: ['v*']
    branches: [main]
    paths:
      - 'products/${productId}/**'
      - 'packages/**'

jobs:
  build:
    uses: ./.github/workflows/electron-build.yml
    with:
      product_dir: products/${productId}
      artifact_prefix: ${productId}
    secrets:
      PORTAL_DEPLOY_KEY: \${{ secrets.PORTAL_DEPLOY_KEY }}
      PORTAL_HOST: \${{ secrets.PORTAL_HOST }}

  publish-to-portal:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (fuer Version)
        uses: actions/checkout@v4

      - name: Version ermitteln
        id: version
        run: |
          VERSION=$(node -p "require('./products/${productId}/package.json').version")
          echo "version=v\${VERSION}" >> "\$GITHUB_OUTPUT"
          echo "Product version: v\${VERSION}"

      - name: Linux-Artefakt herunterladen
        uses: actions/download-artifact@v4
        with:
          name: ${productId}-linux
          path: artifacts/linux

      - name: macOS-Artefakt herunterladen
        uses: actions/download-artifact@v4
        with:
          name: ${productId}-macos
          path: artifacts/macos

      - name: Windows-Artefakt herunterladen
        uses: actions/download-artifact@v4
        with:
          name: ${productId}-windows
          path: artifacts/windows

      - name: SSH-Key einrichten
        run: |
          mkdir -p ~/.ssh
          echo "\${{ secrets.PORTAL_DEPLOY_KEY }}" > ~/.ssh/portal_deploy
          chmod 600 ~/.ssh/portal_deploy
          ssh-keyscan -H "\${{ secrets.PORTAL_HOST }}" >> ~/.ssh/known_hosts 2>/dev/null

      - name: Artefakte per SCP zum Portal hochladen
        env:
          PORTAL_HOST: \${{ secrets.PORTAL_HOST }}
          VERSION: \${{ steps.version.outputs.version }}
        run: |
          SSH_OPTS="-i ~/.ssh/portal_deploy -o StrictHostKeyChecking=accept-new"
          REMOTE_BASE="/mnt/downloads/${productId}/\${VERSION}"

          upload_file() {
            local platform="\$1"
            local file="\$2"
            local filename=$(basename "\$file")
            local remote_dir="\${REMOTE_BASE}/\${platform}"
            echo "Uploading \$filename to \$platform..."
            ssh \$SSH_OPTS "root@\${PORTAL_HOST}" "mkdir -p \${remote_dir} && rm -f \${remote_dir}/*"
            scp \$SSH_OPTS "\$file" "root@\${PORTAL_HOST}:\${remote_dir}/\${filename}"
            echo "  OK: \$filename"
          }

          for f in artifacts/linux/*.AppImage; do
            [ -f "\$f" ] && upload_file "linux" "\$f"
          done

          for f in artifacts/macos/*.zip artifacts/macos/*.dmg; do
            [ -f "\$f" ] && upload_file "macos" "\$f"
          done

          for f in artifacts/windows/*.exe; do
            [ -f "\$f" ] && upload_file "windows" "\$f"
          done

          echo "Alle Artefakte per SCP zum Portal hochgeladen."

      - name: SSH-Key aufraeumen
        if: always()
        run: rm -f ~/.ssh/portal_deploy
`;
writeIfNew(join(productDir, '.github', 'workflows', 'build.yml'), workflowYaml);

// 9. Portal DB-Migration (SQL-Datei generieren)
const description = spec.description?.short || spec.tagline || name;
const priceCents = spec.pricing?.price_cents || '3900';

const migrationSql = `-- Migration: Add ${name} product
-- Auto-generated by scaffold-product.mjs

INSERT INTO products (id, name, description, price_cents, status, forgejo_repo, created_at, updated_at)
VALUES (
  '${productId}',
  '${name}',
  '${description.replace(/'/g, "''")}',
  ${priceCents},
  'active',
  'factory-admin/${productId}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
`;

const migrationPath = join(ROOT, 'portal', 'src', 'db', `migrate-scaffold-${productId}.sql`);
writeIfNew(migrationPath, migrationSql);

// 10. License-Prefix Patch-Hinweise
console.log('');
console.log('=== Manuelle Schritte ===');
console.log('');
console.log(`1. License-Prefixes registrieren:`);
console.log(`   portal/src/services/license-keygen.js:`);
console.log(`     PRODUCT_PREFIXES['${productId}'] = '${licensePrefix}';`);
console.log(`     TRIAL_PREFIXES['${productId}'] = '${trialPrefix}';`);
console.log(`   packages/electron-platform/lib/license-client.js:`);
console.log(`     PREFIX_TO_PRODUCT['${licensePrefix}'] = '${productId}';`);
console.log(`     PREFIX_TO_PRODUCT['${trialPrefix}'] = '${productId}';`);
console.log('');
console.log(`2. pnpm-workspace.yaml ergaenzen:`);
console.log(`     - 'products/${productId}'`);
console.log('');
console.log(`3. Forgejo-Repo anlegen: factory-admin/${productId}`);
console.log('');
console.log(`4. Icons erstellen: products/${productId}/assets/icons/`);
console.log(`     - icon.png (512x512)`);
console.log(`     - 128x128.png`);
console.log(`     - icon.ico (16-256px)`);
console.log('');
console.log(`5. Source Code schreiben:`);
console.log(`     - src/App.svelte (Root-Komponente)`);
console.log(`     - src/routes/*.svelte (Views)`);
if (hasDb) {
  console.log(`     - src/lib/db.js (Schema, CRUD, Events)`);
  console.log(`     - src/lib/stores/navigation.js`);
  console.log(`     - tests/test_*.js (7 Kategorien)`);
  console.log(`     - tests/fixtures/db_v${version}.sqlite`);
}
console.log('');
console.log(`6. Migration auf Portal deployen:`);
console.log(`   SSH_ASKPASS="" ssh -i ~/.ssh/codefabrik_deploy root@<PORTAL_IP> \\`);
console.log(`     "docker exec portal-db psql -U portal -d portal" < ${migrationPath}`);
console.log('');
console.log('=== Fertig ===');
console.log(`Generierte Dateien: products/${productId}/`);
