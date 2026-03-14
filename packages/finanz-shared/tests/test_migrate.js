import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/test-db.js';
import { createSchema } from '../src/db/index.js';
import { migrateWithBackup, getSchemaVersion, getFreeSpace } from '../src/db/migrate.js';

/**
 * Helper: set up a DB with schema at a specific version.
 */
async function setupDbAtVersion(db, version) {
  await createSchema(db.execute, {}, { product_id: 'test', app_version: '0.1.0' });
  db.execute(`UPDATE _schema_meta SET schema_version = ${version} WHERE id = 1`);
}

describe('getSchemaVersion', () => {
  let db;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it('returns 0 when _schema_meta does not exist', async () => {
    const version = await getSchemaVersion(db.query);
    assert.equal(version, 0);
  });

  it('returns current version from _schema_meta', async () => {
    await setupDbAtVersion(db, 3);
    const version = await getSchemaVersion(db.query);
    assert.equal(version, 3);
  });
});

describe('migrateWithBackup', () => {
  let db;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it('skips migration if already at target version', async () => {
    await setupDbAtVersion(db, 5);

    const result = await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => ({ ok: true, path: '/fake/backup.db' }),
      },
      {
        targetVersion: 5,
        appVersion: '0.5.0',
        migrateFn: () => { throw new Error('should not be called'); },
      }
    );

    assert.equal(result.ok, true);
    assert.equal(result.fromVersion, 5);
    assert.equal(result.toVersion, 5);
  });

  it('skips migration if ahead of target version', async () => {
    await setupDbAtVersion(db, 7);

    const result = await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => ({ ok: true }),
      },
      {
        targetVersion: 5,
        appVersion: '0.5.0',
        migrateFn: () => { throw new Error('should not be called'); },
      }
    );

    assert.equal(result.ok, true);
    assert.equal(result.fromVersion, 7);
  });

  it('creates backup before migration and migrates successfully', async () => {
    await setupDbAtVersion(db, 1);

    let backupCalled = false;
    const result = await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => {
          backupCalled = true;
          return { ok: true, path: '/fake/backup.db' };
        },
      },
      {
        targetVersion: 2,
        appVersion: '0.2.0',
        migrateFn: async (exec) => {
          await exec('CREATE TABLE IF NOT EXISTS new_feature (id INTEGER PRIMARY KEY, name TEXT)');
        },
      }
    );

    assert.equal(backupCalled, true, 'Backup must be called before migration');
    assert.equal(result.ok, true);
    assert.equal(result.fromVersion, 1);
    assert.equal(result.toVersion, 2);
    assert.equal(result.backupPath, '/fake/backup.db');

    // Verify schema version was updated
    const version = await getSchemaVersion(db.query);
    assert.equal(version, 2);

    // Verify new table exists
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='new_feature'");
    assert.equal(tables.length, 1);
  });

  it('does not migrate if backup fails', async () => {
    await setupDbAtVersion(db, 1);

    let migrateCalled = false;
    const result = await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => ({ ok: false, error: 'Disk full' }),
      },
      {
        targetVersion: 2,
        appVersion: '0.2.0',
        migrateFn: async () => {
          migrateCalled = true;
        },
      }
    );

    assert.equal(result.ok, false);
    assert.equal(migrateCalled, false, 'Migration must NOT run when backup fails');
    assert.match(result.error, /BACKUP_FAILED/);

    // Schema version unchanged
    const version = await getSchemaVersion(db.query);
    assert.equal(version, 1);
  });

  it('rolls back on migration error and preserves data', async () => {
    await setupDbAtVersion(db, 1);
    // Insert test data
    db.execute("INSERT INTO person (person_number, first_name, last_name) VALUES ('P001', 'Hans', 'Mueller')");

    const result = await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => ({ ok: true, path: '/fake/backup.db' }),
      },
      {
        targetVersion: 2,
        appVersion: '0.2.0',
        migrateFn: async (exec) => {
          // DDL that succeeds
          await exec('CREATE TABLE IF NOT EXISTS temp_table (id INTEGER PRIMARY KEY)');
          // Then fail
          throw new Error('Simulated migration failure');
        },
      }
    );

    assert.equal(result.ok, false);
    assert.match(result.error, /MIGRATION_FAILED/);
    assert.equal(result.backupPath, '/fake/backup.db');

    // Schema version unchanged
    const version = await getSchemaVersion(db.query);
    assert.equal(version, 1);

    // Original data preserved
    const rows = db.query("SELECT first_name FROM person WHERE person_number = 'P001'");
    assert.equal(rows[0].first_name, 'Hans');
  });

  it('updates app_version in _schema_meta after migration', async () => {
    await setupDbAtVersion(db, 1);

    await migrateWithBackup(
      {
        queryFn: db.query,
        executeFn: db.execute,
        createBackup: () => ({ ok: true }),
      },
      {
        targetVersion: 3,
        appVersion: '0.3.0',
        migrateFn: async () => {},
      }
    );

    const meta = db.query('SELECT app_version, schema_version FROM _schema_meta WHERE id = 1');
    assert.equal(meta[0].schema_version, 3);
    assert.equal(meta[0].app_version, '0.3.0');
  });
});

describe('getFreeSpace', () => {
  it('returns a number or null, never throws', () => {
    const space = getFreeSpace('/tmp');
    assert.ok(space === null || typeof space === 'number');
    if (typeof space === 'number') {
      assert.ok(space > 0);
    }
  });

  it('returns null for non-existent path', () => {
    const space = getFreeSpace('/nonexistent/path/that/does/not/exist/file.db');
    assert.ok(space === null || typeof space === 'number');
  });
});
