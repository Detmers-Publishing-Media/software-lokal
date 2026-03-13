#!/usr/bin/env node

/**
 * Post-build validation for Electron packaging.
 *
 * Checks that the unpacked build directory contains all required files
 * (workspace packages, native addons, electron entry points).
 *
 * Usage:
 *   node scripts/validate-electron-packaging.mjs <product-dir>
 *
 * Example:
 *   node scripts/validate-electron-packaging.mjs products/berater-lokal
 *
 * Exit code 0 = all checks passed, 1 = missing files detected.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const productDir = process.argv[2];
if (!productDir) {
  console.error('Usage: node validate-electron-packaging.mjs <product-dir>');
  process.exit(1);
}

const absProductDir = resolve(productDir);
const releaseDir = join(absProductDir, 'release');

// Detect platform-specific unpacked directory
function findUnpackedDir() {
  if (!existsSync(releaseDir)) {
    return null;
  }

  const candidates = [
    'linux-unpacked/resources/app',
    'linux-unpacked/resources/app.asar.unpacked',
    'win-unpacked/resources/app',
    'win-unpacked/resources/app.asar.unpacked',
    'mac/resources/app',
    'mac-arm64/resources/app',
  ];

  // Also check for .app bundles on macOS
  try {
    const entries = readdirSync(releaseDir);
    for (const entry of entries) {
      if (entry.endsWith('.app')) {
        candidates.push(`${entry}/Contents/Resources/app`);
        candidates.push(`${entry}/Contents/Resources/app.asar.unpacked`);
      }
      // mac-arm64 might contain .app
      const subDir = join(releaseDir, entry);
      if (existsSync(subDir) && entry.startsWith('mac')) {
        try {
          const subEntries = readdirSync(subDir);
          for (const sub of subEntries) {
            if (sub.endsWith('.app')) {
              candidates.push(`${entry}/${sub}/Contents/Resources/app`);
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  for (const candidate of candidates) {
    const full = join(releaseDir, candidate);
    if (existsSync(full)) {
      return full;
    }
  }

  return null;
}

// Also try asar listing if unpacked dir not found
function findAsarFile() {
  const candidates = [
    'linux-unpacked/resources/app.asar',
    'win-unpacked/resources/app.asar',
    'mac/resources/app.asar',
    'mac-arm64/resources/app.asar',
  ];

  try {
    const entries = readdirSync(releaseDir);
    for (const entry of entries) {
      if (entry.endsWith('.app')) {
        candidates.push(`${entry}/Contents/Resources/app.asar`);
      }
      if (entry.startsWith('mac')) {
        try {
          const subEntries = readdirSync(join(releaseDir, entry));
          for (const sub of subEntries) {
            if (sub.endsWith('.app')) {
              candidates.push(`${entry}/${sub}/Contents/Resources/app.asar`);
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  for (const candidate of candidates) {
    const full = join(releaseDir, candidate);
    if (existsSync(full)) {
      return full;
    }
  }
  return null;
}

// Read required files from package.json build.files + detect dependencies
function getRequiredPaths() {
  const pkgPath = join(absProductDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  // Always required for electron-platform products
  const required = [
    'electron/main.cjs',
    'dist/index.html',
  ];

  // Check for app.config.cjs
  if (existsSync(join(absProductDir, 'app.config.cjs'))) {
    required.push('app.config.cjs');
  }

  // Check for custom preload
  if (existsSync(join(absProductDir, 'electron/preload.cjs'))) {
    required.push('electron/preload.cjs');
  }

  // Check workspace dependencies
  const deps = pkg.dependencies || {};
  for (const dep of Object.keys(deps)) {
    if (dep.startsWith('@codefabrik/')) {
      // At least the package.json must exist
      required.push(`node_modules/${dep}/package.json`);
    }
  }

  // Check for native addons
  const nativePackages = ['better-sqlite3', 'better-sqlite3-multiple-ciphers'];
  for (const native of nativePackages) {
    if (deps[native]) {
      required.push(`node_modules/${native}/package.json`);
    }
  }

  return required;
}

// Main
console.log(`\nValidating Electron packaging for: ${productDir}`);
console.log(`Release directory: ${releaseDir}\n`);

if (!existsSync(releaseDir)) {
  console.error('ERROR: Release directory does not exist. Was electron-builder run?');
  process.exit(1);
}

const unpackedDir = findUnpackedDir();
const asarFile = findAsarFile();

if (!unpackedDir && !asarFile) {
  console.error('ERROR: No unpacked directory or asar file found in release/');
  console.error('Contents:', readdirSync(releaseDir).join(', '));
  process.exit(1);
}

const requiredPaths = getRequiredPaths();
const missing = [];
const found = [];

if (unpackedDir) {
  console.log(`Checking unpacked directory: ${unpackedDir}\n`);

  for (const reqPath of requiredPaths) {
    const full = join(unpackedDir, reqPath);
    if (existsSync(full)) {
      found.push(reqPath);
    } else {
      missing.push(reqPath);
    }
  }
} else if (asarFile) {
  // Use @electron/asar to list contents
  console.log(`Checking asar archive: ${asarFile}\n`);

  try {
    const { listPackage } = await import('@electron/asar');
    const entries = listPackage(asarFile);

    for (const reqPath of requiredPaths) {
      const normalized = '/' + reqPath.replace(/\\/g, '/');
      if (entries.some(e => e === normalized || e.startsWith(normalized + '/'))) {
        found.push(reqPath);
      } else {
        missing.push(reqPath);
      }
    }
  } catch (err) {
    console.error(`WARNING: Could not read asar file: ${err.message}`);
    console.error('Install @electron/asar to enable asar validation.');
    process.exit(1);
  }
}

// Report
for (const f of found) {
  console.log(`  OK  ${f}`);
}
for (const m of missing) {
  console.log(`  MISSING  ${m}`);
}

console.log(`\n${found.length} found, ${missing.length} missing\n`);

if (missing.length > 0) {
  console.error('PACKAGING VALIDATION FAILED');
  console.error('These files are missing from the built app.');
  console.error('Check build.files in package.json.\n');
  process.exit(1);
} else {
  console.log('Packaging validation passed.\n');
}
