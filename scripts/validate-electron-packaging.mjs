#!/usr/bin/env node

/**
 * Post-build validation for Electron packaging.
 *
 * Checks that the built app contains all required files:
 * - JS entry points (electron/main.cjs, dist/index.html, etc.)
 * - Workspace packages (@codefabrik/*)
 * - Native addons (better-sqlite3)
 *
 * Uses `npx asar list` to inspect asar archives (no direct dependency needed).
 * Native addons are checked in app.asar.unpacked.
 *
 * Usage:
 *   node scripts/validate-electron-packaging.mjs <product-dir>
 *
 * Exit code 0 = all checks passed, 1 = missing files detected.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const productDir = process.argv[2];
if (!productDir) {
  console.error('Usage: node validate-electron-packaging.mjs <product-dir>');
  process.exit(1);
}

const absProductDir = resolve(productDir);
const releaseDir = join(absProductDir, 'release');

// Find the platform-specific resources directory
function findResourcesDir() {
  if (!existsSync(releaseDir)) return null;

  const candidates = [
    'linux-unpacked/resources',
    'win-unpacked/resources',
    'mac/resources',
    'mac-arm64/resources',
  ];

  // macOS .app bundles
  try {
    const entries = readdirSync(releaseDir);
    for (const entry of entries) {
      if (entry.endsWith('.app')) {
        candidates.push(`${entry}/Contents/Resources`);
      }
      if (entry.startsWith('mac')) {
        try {
          for (const sub of readdirSync(join(releaseDir, entry))) {
            if (sub.endsWith('.app')) {
              candidates.push(`${entry}/${sub}/Contents/Resources`);
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  for (const c of candidates) {
    const full = join(releaseDir, c);
    if (existsSync(full)) return full;
  }
  return null;
}

// Categorize required paths
function getRequiredPaths() {
  const pkgPath = join(absProductDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies || {};

  // Regular files (in asar or app/ directory)
  const regular = ['electron/main.cjs', 'dist/index.html'];
  if (existsSync(join(absProductDir, 'app.config.cjs'))) regular.push('app.config.cjs');
  if (existsSync(join(absProductDir, 'electron/preload.cjs'))) regular.push('electron/preload.cjs');

  for (const dep of Object.keys(deps)) {
    if (dep.startsWith('@codefabrik/')) {
      regular.push(`node_modules/${dep}/package.json`);
    }
  }

  // Native addons (in app.asar.unpacked)
  const native = [];
  const nativePackages = ['better-sqlite3', 'better-sqlite3-multiple-ciphers'];
  for (const np of nativePackages) {
    if (deps[np]) native.push(`node_modules/${np}/package.json`);
  }

  return { regular, native };
}

// List asar contents via npx
function listAsarEntries(asarPath) {
  try {
    const output = execSync(`npx --yes @electron/asar list "${asarPath}"`, {
      encoding: 'utf-8',
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').map(l => l.trim().replace(/\\/g, '/'));
  } catch (err) {
    console.error(`WARNING: npx asar list failed: ${err.message}`);
    return null;
  }
}

// Check paths against asar entry list
function checkAsar(entries, paths) {
  const found = [];
  const missing = [];
  for (const p of paths) {
    const normalized = '/' + p.replace(/\\/g, '/');
    if (entries.some(e => e === normalized || e.startsWith(normalized + '/'))) {
      found.push(p);
    } else {
      missing.push(p);
    }
  }
  return { found, missing };
}

// Check files in unpacked directory
function checkDir(dir, paths) {
  const found = [];
  const missing = [];
  for (const p of paths) {
    if (existsSync(join(dir, p))) {
      found.push(p);
    } else {
      missing.push(p);
    }
  }
  return { found, missing };
}

// --- Main ---
console.log(`\nValidating Electron packaging for: ${productDir}`);
console.log(`Release directory: ${releaseDir}\n`);

if (!existsSync(releaseDir)) {
  console.error('ERROR: Release directory does not exist.');
  process.exit(1);
}

const resourcesDir = findResourcesDir();
if (!resourcesDir) {
  console.error('ERROR: No platform resources directory found in release/');
  console.error('Contents:', readdirSync(releaseDir).join(', '));
  process.exit(1);
}

const asarPath = join(resourcesDir, 'app.asar');
const unpackedPath = join(resourcesDir, 'app.asar.unpacked');
const appPath = join(resourcesDir, 'app');
const hasAsar = existsSync(asarPath);
const hasUnpacked = existsSync(unpackedPath);
const hasAppDir = existsSync(appPath);

console.log(`Resources: ${resourcesDir}`);
console.log(`  app.asar: ${hasAsar ? 'yes' : 'no'}`);
console.log(`  app.asar.unpacked: ${hasUnpacked ? 'yes' : 'no'}`);
console.log(`  app/: ${hasAppDir ? 'yes' : 'no'}\n`);

const { regular, native } = getRequiredPaths();
const allFound = [];
const allMissing = [];

// Check regular files in asar or app/ directory
if (hasAsar) {
  const entries = listAsarEntries(asarPath);
  if (entries) {
    const result = checkAsar(entries, regular);
    allFound.push(...result.found);
    allMissing.push(...result.missing);
  } else if (hasAppDir) {
    // Fallback to app/ directory
    const result = checkDir(appPath, regular);
    allFound.push(...result.found);
    allMissing.push(...result.missing);
  } else {
    console.error('ERROR: Could not read asar and no app/ directory found.');
    allMissing.push(...regular);
  }
} else if (hasAppDir) {
  const result = checkDir(appPath, regular);
  allFound.push(...result.found);
  allMissing.push(...result.missing);
} else {
  console.error('ERROR: Neither app.asar nor app/ directory found.');
  process.exit(1);
}

// Check native addons in app.asar.unpacked
if (native.length > 0) {
  if (hasUnpacked) {
    const result = checkDir(unpackedPath, native);
    allFound.push(...result.found);
    allMissing.push(...result.missing);
  } else if (hasAppDir) {
    const result = checkDir(appPath, native);
    allFound.push(...result.found);
    allMissing.push(...result.missing);
  } else {
    allMissing.push(...native);
  }
}

// Report
for (const f of allFound) console.log(`  OK  ${f}`);
for (const m of allMissing) console.log(`  MISSING  ${m}`);

console.log(`\n${allFound.length} found, ${allMissing.length} missing\n`);

if (allMissing.length > 0) {
  console.error('PACKAGING VALIDATION FAILED');
  console.error('Check build.files in package.json.\n');
  process.exit(1);
} else {
  console.log('Packaging validation passed.\n');
}
