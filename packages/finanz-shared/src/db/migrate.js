/**
 * Safe migration wrapper with pre-migration backup and disk space check.
 * Ensures a backup exists before any schema change.
 *
 * This module provides the migration logic. The actual backup/restore
 * functions are injected as dependencies (from electron-platform).
 */

import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { dirname } from 'node:path';
import { platform } from 'node:os';

/**
 * Returns free disk space in bytes for the partition containing filePath.
 * Returns null if detection fails (non-critical, migration proceeds).
 *
 * @param {string} filePath - Any file on the target partition
 * @returns {number|null}
 */
export function getFreeSpace(filePath) {
  try {
    if (platform() === 'win32') {
      const dir = dirname(filePath);
      const output = execSync(
        `powershell -NoProfile -Command "(Get-PSDrive -Name (Split-Path -Qualifier '${dir.replace(/'/g, "''")}').TrimEnd(':')).Free"`,
        { encoding: 'utf-8', timeout: 5000 }
      );
      const bytes = parseInt(output.trim(), 10);
      return Number.isFinite(bytes) ? bytes : null;
    }
    const dir = dirname(filePath);
    const output = execSync(`df -B1 "${dir}" | tail -1`, {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const parts = output.trim().split(/\s+/);
    const bytes = parseInt(parts[3], 10);
    return Number.isFinite(bytes) ? bytes : null;
  } catch (_) {
    return null;
  }
}

/**
 * Reads the current schema version from _schema_meta.
 * Returns 0 if the table does not exist (fresh install).
 *
 * @param {Function} queryFn - query(sql, params) → rows
 * @returns {Promise<number>}
 */
export async function getSchemaVersion(queryFn) {
  try {
    const rows = await queryFn('SELECT schema_version FROM _schema_meta WHERE id = 1');
    return rows[0]?.schema_version ?? 0;
  } catch (_) {
    return 0;
  }
}

/**
 * Runs schema migration with automatic backup and rollback.
 *
 * @param {Object} deps - External dependencies (injected)
 * @param {Function} deps.queryFn - query(sql, params) → rows
 * @param {Function} deps.executeFn - execute(sql, params) → result
 * @param {Function} deps.createBackup - () => { ok, path?, error? }  (pre-bound to correct db/dir)
 * @param {string} [deps.dbPath] - Path to DB file (for disk space check, optional)
 * @param {Object} opts
 * @param {number} opts.targetVersion - Expected schema version after migration
 * @param {string} opts.appVersion - Current app version string
 * @param {Function} opts.migrateFn - (executeFn, fromVersion, toVersion) => void — runs the actual DDL
 * @returns {Promise<{ ok: boolean, fromVersion: number, toVersion: number, backupPath?: string, error?: string }>}
 */
export async function migrateWithBackup(deps, opts) {
  const { queryFn, executeFn, createBackup, dbPath } = deps;
  const { targetVersion, appVersion, migrateFn } = opts;

  // 1. Read current schema version
  const currentVersion = await getSchemaVersion(queryFn);

  // No migration needed
  if (currentVersion >= targetVersion) {
    return { ok: true, fromVersion: currentVersion, toVersion: currentVersion };
  }

  // 2. Check disk space (if dbPath provided)
  if (dbPath) {
    try {
      const dbSize = statSync(dbPath).size;
      const freeSpace = getFreeSpace(dbPath);
      if (freeSpace !== null && freeSpace < dbSize * 2) {
        return {
          ok: false,
          fromVersion: currentVersion,
          toVersion: targetVersion,
          error: 'NOT_ENOUGH_SPACE',
        };
      }
    } catch (_) {
      // stat failed (e.g. in-memory DB) — skip check
    }
  }

  // 3. Force backup before migration
  const backupResult = createBackup();
  if (!backupResult.ok) {
    return {
      ok: false,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      error: `BACKUP_FAILED: ${backupResult.error}`,
    };
  }

  // 4. Run migration
  try {
    await executeFn('BEGIN IMMEDIATE');
    await migrateFn(executeFn, currentVersion, targetVersion);
    await executeFn(
      `UPDATE _schema_meta SET schema_version = ${targetVersion}, app_version = '${appVersion}', last_migration = datetime('now') WHERE id = 1`
    );
    await executeFn('COMMIT');

    return {
      ok: true,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      backupPath: backupResult.path,
    };
  } catch (err) {
    // 5. Rollback transaction
    try {
      await executeFn('ROLLBACK');
    } catch (_) {}

    return {
      ok: false,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      backupPath: backupResult.path,
      error: `MIGRATION_FAILED: ${err.message}`,
    };
  }
}
