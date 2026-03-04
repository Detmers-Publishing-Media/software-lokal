const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');

// ---- Mocks in Module-Cache injizieren ----

const mockPool = createMockPool();
const poolPath = require.resolve('../../src/db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: mockPool,
};

const mockLicense = {
  validateLicense: async (key) => mockLicense._result,
  createLicense: async () => ({}),
  _result: null,
};
const licensePath = require.resolve('../../src/services/license');
require.cache[licensePath] = {
  id: licensePath, filename: licensePath, loaded: true,
  exports: mockLicense,
};

const mockYamlGen = {
  generateIdeaYaml: () => 'mock-yaml',
  generateSupportYaml: () => 'mock-yaml',
  generateRequestYaml: () => 'mock-yaml',
};
const yamlGenPath = require.resolve('../../src/services/yaml-generator');
require.cache[yamlGenPath] = {
  id: yamlGenPath, filename: yamlGenPath, loaded: true,
  exports: mockYamlGen,
};

const express = require('express');
const router = require('../../src/routes/api-ideas');

describe('Ideas mit Lizenzkey — /api/ideas', () => {
  let server;
  let baseUrl;

  const VALID_LICENSE = {
    id: 1,
    license_key: 'LK-TEST-001',
    product_id: 'factory-gateway',
    product_name: 'Factory Gateway',
  };

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(router);
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockPool.reset();
    mockLicense._result = null;
  });

  it('1: POST mit gueltigem Lizenzkey → 201', async () => {
    mockLicense._result = VALID_LICENSE;
    mockPool.mockResults([
      { rows: [{ nextval: '1' }] },
      { rows: [{ id: 1, idea_number: 'IDEA-000001', status: 'submitted', description: 'Test' }] },
      { rows: [], rowCount: 1 },
    ]);

    const res = await fetch(`${baseUrl}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: 'LK-TEST-001',
        title: 'Neue Idee',
        description: 'Beschreibung der Idee',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.idea_number, 'IDEA-000001');
    assert.equal(data.status, 'submitted');
  });

  it('2: POST ohne license_key → 400', async () => {
    const res = await fetch(`${baseUrl}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', description: 'Desc' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('license_key'));
  });

  it('3: POST mit ungueltigem Lizenzkey → 403', async () => {
    mockLicense._result = null;
    const res = await fetch(`${baseUrl}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: 'INVALID',
        title: 'Test',
        description: 'Desc',
      }),
    });
    assert.equal(res.status, 403);
  });

  it('4: GET /api/ideas mit Key → 200, Liste', async () => {
    mockLicense._result = VALID_LICENSE;
    mockPool.mockResult({
      rows: [
        { idea_number: 'IDEA-000001', title: 'Idee A', description: 'Desc', category: 'new_product', status: 'submitted', votes: 3, created_at: '2026-01-01T00:00:00Z' },
      ],
      rowCount: 1,
    });

    const res = await fetch(`${baseUrl}/api/ideas?key=LK-TEST-001`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 1);
    assert.equal(data[0].idea_number, 'IDEA-000001');
  });

  it('5: GET /api/ideas ohne Key → 400', async () => {
    const res = await fetch(`${baseUrl}/api/ideas`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('key'));
  });

  it('6: GET /api/ideas/:idea_number mit Key → 200', async () => {
    mockLicense._result = VALID_LICENSE;
    mockPool.mockResult({
      rows: [{ idea_number: 'IDEA-000001', title: 'Idee A', description: 'Desc', category: 'new_product', status: 'submitted', votes: 5, created_at: '2026-01-01T00:00:00Z' }],
      rowCount: 1,
    });

    const res = await fetch(`${baseUrl}/api/ideas/IDEA-000001?key=LK-TEST-001`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.idea_number, 'IDEA-000001');
    assert.equal(data.votes, 5);
  });

  it('7: POST /api/ideas/:idea_number/vote mit Key → 200', async () => {
    mockLicense._result = VALID_LICENSE;
    mockPool.mockResult({ rows: [], rowCount: 1 });

    const res = await fetch(`${baseUrl}/api/ideas/IDEA-000001/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: 'LK-TEST-001' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.voted, true);
  });

  it('8: POST /api/ideas/:idea_number/vote ohne Key → 400', async () => {
    const res = await fetch(`${baseUrl}/api/ideas/IDEA-000001/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('license_key'));
  });
});
