#!/usr/bin/env node

/**
 * validate-story-governance.mjs — CI Guardrail Script
 *
 * Validates story YAML against governance rules:
 * 1. Required fields present
 * 2. Valid story_type
 * 3. Lane matches story_type
 * 4. Protected paths enforce slow lane
 * 5. Import boundaries respected
 *
 * Usage:
 *   node scripts/validate-story-governance.mjs [--story path/to/story.yml] [--changed-files file1 file2 ...]
 *   node scripts/validate-story-governance.mjs --check-imports
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = validation errors found
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

// --- Story Types (loaded from story-types.yml) ---

function loadStoryTypes(rootDir) {
  const typesFile = join(rootDir, 'docs/governance/story-types.yml');
  if (!existsSync(typesFile)) {
    console.error('FATAL: docs/governance/story-types.yml not found');
    process.exit(1);
  }
  const text = readFileSync(typesFile, 'utf-8');
  const types = {};
  let currentType = null;
  let inTypes = false;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;

    if (line === 'types:') { inTypes = true; continue; }
    if (!inTypes) continue;

    // Type name (2 spaces indent)
    const typeMatch = line.match(/^  ([\w-]+):\s*$/);
    if (typeMatch) {
      currentType = typeMatch[1];
      types[currentType] = {};
      continue;
    }

    // Type property (4 spaces indent)
    if (currentType) {
      const kvMatch = line.match(/^\s{4}(\w[\w_]*):\s*(.+)$/);
      if (kvMatch) {
        let val = kvMatch[2].trim().replace(/^"|"$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        types[currentType][kvMatch[1]] = val;
      }
    }
  }

  const valid = Object.keys(types);
  const slowLane = valid.filter(t => types[t].default_lane === 'slow');
  const noForceApprove = valid.filter(t => types[t].force_approve_allowed === false);

  return { types, valid, slowLane, noForceApprove };
}

// --- Constants ---

const REQUIRED_FIELDS = [
  'id',
  'title',
  'status',
  'story_type',
  'lane',
  'platform_impact',
  'founder_gate_required',
  'force_approve_allowed',
  'auto_merge_allowed',
];

const PLATFORM_GATE_FIELDS = [
  'platform_rationale',
  'reused_by_products',
];

// --- YAML Parser (minimal, no dependencies) ---

function parseSimpleYaml(text) {
  const result = {};
  let currentKey = null;
  let currentList = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');

    // Skip comments and empty lines
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;

    // List item
    const listMatch = line.match(/^\s+-\s+"?([^"]*)"?\s*$/);
    if (listMatch && currentList !== null) {
      result[currentList].push(listMatch[1].replace(/^"|"$/g, ''));
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const [, key, rawVal] = kvMatch;
      const val = rawVal.trim().replace(/^"|"$/g, '');

      if (val === '' || val === '|') {
        // Could be a list or multiline — check next lines
        currentKey = key;
        currentList = null;
        result[key] = val === '|' ? '' : [];
        if (val !== '|') currentList = key;
        continue;
      }

      // Boolean
      if (val === 'true') { result[key] = true; currentList = null; continue; }
      if (val === 'false') { result[key] = false; currentList = null; continue; }

      // Array on same line: [a, b]
      if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1);
        result[key] = inner
          ? inner.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
          : [];
        currentList = null;
        continue;
      }

      result[key] = val;
      currentList = null;
      continue;
    }

    // Multiline continuation
    if (currentKey && result[currentKey] !== undefined && typeof result[currentKey] === 'string') {
      result[currentKey] += line.trim() + '\n';
    }
  }

  return result;
}

// --- Protected Paths ---

function loadProtectedPaths(rootDir) {
  const pathsFile = join(rootDir, 'docs/governance/protected-paths.yml');
  if (!existsSync(pathsFile)) return { patterns: [], importRules: [] };

  const text = readFileSync(pathsFile, 'utf-8');
  const patterns = [];
  const importRules = [];

  let inProtectedPaths = false;
  let inImportRules = false;
  let currentRule = null;
  let inForbiddenImports = false;
  let inExceptions = false;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');

    if (line.startsWith('protected_paths:')) { inProtectedPaths = true; inImportRules = false; continue; }
    if (line.startsWith('import_rules:')) { inImportRules = true; inProtectedPaths = false; continue; }

    if (inProtectedPaths) {
      const patternMatch = line.match(/^\s+-\s+pattern:\s+"(.+)"/);
      if (patternMatch) patterns.push(patternMatch[1]);
    }

    if (inImportRules) {
      if (/^\s+-\s+name:/.test(line)) {
        if (currentRule) importRules.push(currentRule);
        currentRule = { name: '', sourcePattern: '', forbiddenImports: [], exceptions: [] };
        currentRule.name = line.match(/name:\s+"(.+)"/)?.[1] || '';
        inForbiddenImports = false;
        inExceptions = false;
        continue;
      }
      if (currentRule) {
        const srcMatch = line.match(/source_pattern:\s+"(.+)"/);
        if (srcMatch) { currentRule.sourcePattern = srcMatch[1]; continue; }
        if (/forbidden_imports:/.test(line)) { inForbiddenImports = true; inExceptions = false; continue; }
        if (/exceptions:/.test(line)) { inExceptions = true; inForbiddenImports = false; continue; }
        const itemMatch = line.match(/^\s+-\s+"(.+)"/);
        if (itemMatch) {
          if (inForbiddenImports) currentRule.forbiddenImports.push(itemMatch[1]);
          if (inExceptions) currentRule.exceptions.push(itemMatch[1]);
        }
      }
    }
  }
  if (currentRule) importRules.push(currentRule);

  return { patterns, importRules };
}

function matchesProtectedPath(filePath, patterns) {
  for (const pattern of patterns) {
    // Convert glob pattern to regex
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '<<GLOBSTAR>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<GLOBSTAR>>/g, '.*');
    if (new RegExp(`^${regexStr}$`).test(filePath) ||
        new RegExp(`^${regexStr}$`).test(filePath.replace(/^\//, ''))) {
      return pattern;
    }
  }
  return null;
}

// --- Validation ---

function validateStory(storyPath, changedFiles, rootDir, storyTypeConfig) {
  const { valid: VALID_STORY_TYPES, slowLane: SLOW_LANE_TYPES, noForceApprove: NO_FORCE_APPROVE_TYPES } = storyTypeConfig;
  const errors = [];
  const warnings = [];

  if (!existsSync(storyPath)) {
    errors.push(`Story file not found: ${storyPath}`);
    return { errors, warnings };
  }

  const story = parseSimpleYaml(readFileSync(storyPath, 'utf-8'));

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (story[field] === undefined || story[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 2. Valid story_type
  if (story.story_type && !VALID_STORY_TYPES.includes(story.story_type)) {
    errors.push(`Invalid story_type: "${story.story_type}". Valid: ${VALID_STORY_TYPES.join(', ')}`);
  }

  // 3. Lane matches story_type
  if (SLOW_LANE_TYPES.includes(story.story_type) && story.lane !== 'slow') {
    errors.push(`story_type "${story.story_type}" requires lane "slow", got "${story.lane}"`);
  }

  // 4. Force-approve consistency
  if (NO_FORCE_APPROVE_TYPES.includes(story.story_type) && story.force_approve_allowed === true) {
    errors.push(`story_type "${story.story_type}" must have force_approve_allowed: false`);
  }

  // 5. Auto-merge consistency
  if (story.lane === 'slow' && story.auto_merge_allowed === true) {
    errors.push(`lane "slow" must have auto_merge_allowed: false`);
  }

  // 6. Platform Gate fields when platform_impact != none
  if (story.platform_impact && story.platform_impact !== 'none') {
    for (const field of PLATFORM_GATE_FIELDS) {
      if (!story[field] || (Array.isArray(story[field]) && story[field].length === 0) ||
          (typeof story[field] === 'string' && story[field].trim() === '')) {
        errors.push(`platform_impact "${story.platform_impact}" requires field: ${field}`);
      }
    }
  }

  // 7. Founder gate with slow lane
  if (story.lane === 'slow' && story.founder_gate_required !== true) {
    warnings.push(`lane "slow" typically requires founder_gate_required: true`);
  }

  // 8. Protected paths check
  if (changedFiles.length > 0) {
    const { patterns } = loadProtectedPaths(rootDir);
    for (const file of changedFiles) {
      const matched = matchesProtectedPath(file, patterns);
      if (matched) {
        if (story.lane !== 'slow') {
          errors.push(`Changed file "${file}" matches protected path "${matched}" — requires lane "slow"`);
        }
        if (story.founder_gate_required !== true) {
          errors.push(`Changed file "${file}" matches protected path "${matched}" — requires founder_gate_required: true`);
        }
      }
    }
  }

  return { errors, warnings };
}

// --- Import Boundary Check ---

function checkImportBoundaries(rootDir) {
  const { importRules } = loadProtectedPaths(rootDir);
  const errors = [];

  for (const rule of importRules) {
    // Find matching source files
    let sourceFiles = [];
    try {
      const pattern = join(rootDir, rule.sourcePattern);
      // Use simple find via shell since globSync may not be available
      const cmd = `find ${rootDir} -path "${join(rootDir, rule.sourcePattern.replace(/\{[^}]+\}/g, '*'))}" -type f 2>/dev/null || true`;
      const result = execSync(cmd, { encoding: 'utf-8' }).trim();
      if (result) sourceFiles = result.split('\n');
    } catch {
      continue;
    }

    for (const file of sourceFiles) {
      const relPath = file.replace(rootDir + '/', '');

      // Skip exceptions
      if (rule.exceptions?.some(exc => relPath === exc)) continue;

      let content;
      try {
        content = readFileSync(file, 'utf-8');
      } catch {
        continue;
      }

      for (const forbidden of rule.forbiddenImports) {
        const escaped = escapeRegex(forbidden);
        // Match static import/require statements
        const staticRegex = new RegExp(
          `(?:import\\s.*from\\s+['"]|require\\s*\\(\\s*['"])${escaped}`,
          'gm'
        );
        // Match dynamic import()
        const dynamicRegex = new RegExp(
          `import\\s*\\(\\s*['"]${escaped}`,
          'gm'
        );
        if (staticRegex.test(content) || dynamicRegex.test(content)) {
          errors.push(`[${rule.name}] "${relPath}" imports forbidden "${forbidden}"`);
        }
      }
    }
  }

  return errors;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  const scriptDir = new URL('.', import.meta.url).pathname;
  const rootDir = resolve(scriptDir, '..');

  let storyPath = join(rootDir, '.stories/current.yml');
  let changedFiles = [];
  let checkImports = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--story' && args[i + 1]) {
      storyPath = resolve(args[++i]);
    } else if (args[i] === '--changed-files') {
      changedFiles = args.slice(i + 1);
      break;
    } else if (args[i] === '--check-imports') {
      checkImports = true;
    }
  }

  let hasErrors = false;

  // Load story types from YAML
  const storyTypeConfig = loadStoryTypes(rootDir);
  console.log(`  Loaded ${storyTypeConfig.valid.length} story types from story-types.yml`);

  // Story validation
  if (!checkImports) {
    console.log(`\n--- Story Governance Check ---`);
    console.log(`Story: ${storyPath}`);

    const { errors, warnings } = validateStory(storyPath, changedFiles, rootDir, storyTypeConfig);

    for (const w of warnings) console.log(`  WARN: ${w}`);
    for (const e of errors) console.log(`  ERROR: ${e}`);

    if (errors.length === 0) {
      console.log(`  OK: All governance checks passed.`);
    } else {
      hasErrors = true;
    }
    console.log('');
  }

  // Import boundary check
  if (checkImports || !checkImports) {
    console.log(`--- Import Boundary Check ---`);
    const importErrors = checkImportBoundaries(rootDir);

    for (const e of importErrors) console.log(`  ERROR: ${e}`);

    if (importErrors.length === 0) {
      console.log(`  OK: No import boundary violations.`);
    } else {
      hasErrors = true;
    }
    console.log('');
  }

  process.exit(hasErrors ? 1 : 0);
}

main();
