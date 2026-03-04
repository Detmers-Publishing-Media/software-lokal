const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockPool } = require('../helpers/mock-pool');
const path = require('path');

// Pool-Mock ins Module-Cache injizieren, BEVOR text-generator.js geladen wird
const poolPath = path.resolve(__dirname, '../../src/db/pool.js');
const mockPool = createMockPool();
require.cache[require.resolve(poolPath)] = {
  id: poolPath,
  filename: poolPath,
  loaded: true,
  exports: mockPool,
};

const textGen = require('../../src/services/text-generator');

const sampleSpec = {
  schema_version: 1,
  product_id: 'test-product',
  name: 'TestProduct',
  version: '1.0.0',
  description: {
    short: 'Kurze Beschreibung',
    long: 'Lange Beschreibung mit Details.',
    benefits: ['Vorteil A', 'Vorteil B'],
    target_audience: 'Testgruppe'
  },
  pricing: {
    model: 'einmalkauf',
    price_cents: 2900,
    includes: ['Support', 'Updates']
  },
  features: [
    { id: 'f1', name: 'Feature 1', description: 'Beschreibung 1', status: 'implemented' },
    { id: 'f2', name: 'Feature 2', description: 'Beschreibung 2', status: 'planned' }
  ],
  faq: [
    { question: 'Frage 1?', answer: 'Antwort 1.' },
    { question: 'Frage 2?', answer: 'Antwort 2.' }
  ],
  installation: {
    prerequisites: ['Node.js 18+'],
    steps: ['Schritt 1', 'Schritt 2'],
    notes: 'Hinweis'
  }
};

describe('text-generator', () => {
  beforeEach(() => {
    mockPool.reset();
  });

  it('1: generateDescription — gibt JSON mit short, long, target_audience', () => {
    const result = JSON.parse(textGen.generateDescription(sampleSpec));
    assert.equal(result.short, 'Kurze Beschreibung');
    assert.equal(result.long, 'Lange Beschreibung mit Details.');
    assert.equal(result.target_audience, 'Testgruppe');
  });

  it('2: generateBenefits — gibt Array mit Benefits', () => {
    const result = JSON.parse(textGen.generateBenefits(sampleSpec));
    assert.equal(result.length, 2);
    assert.equal(result[0], 'Vorteil A');
    assert.equal(result[1], 'Vorteil B');
  });

  it('3: generateFeatures — gibt Array mit Features und Status', () => {
    const result = JSON.parse(textGen.generateFeatures(sampleSpec));
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'f1');
    assert.equal(result[0].status, 'implemented');
    assert.equal(result[1].status, 'planned');
  });

  it('4: generateFaq — gibt Array mit Fragen und Antworten', () => {
    const result = JSON.parse(textGen.generateFaq(sampleSpec));
    assert.equal(result.length, 2);
    assert.equal(result[0].question, 'Frage 1?');
    assert.equal(result[1].answer, 'Antwort 2.');
  });

  it('5: generateInstallation — gibt Objekt mit prerequisites, steps, notes', () => {
    const result = JSON.parse(textGen.generateInstallation(sampleSpec));
    assert.deepEqual(result.prerequisites, ['Node.js 18+']);
    assert.deepEqual(result.steps, ['Schritt 1', 'Schritt 2']);
    assert.equal(result.notes, 'Hinweis');
  });

  it('6: generateReleaseNotes — gibt Version und Name', () => {
    const result = JSON.parse(textGen.generateReleaseNotes(sampleSpec));
    assert.equal(result.version, '1.0.0');
    assert.equal(result.name, 'TestProduct');
    assert.ok(result.date);
  });

  it('7: generateDigistore — gibt HTML mit Produktinfos', () => {
    const html = textGen.generateDigistore(sampleSpec);
    assert.ok(html.includes('<h2>TestProduct</h2>'));
    assert.ok(html.includes('Kurze Beschreibung'));
    assert.ok(html.includes('Vorteil A'));
    assert.ok(html.includes('Support'));
  });

  it('8: generateAllTexts — fuehrt 7 Upserts aus', async () => {
    for (let i = 0; i < 7; i++) {
      mockPool.mockResult({ rows: [], rowCount: 1 });
    }
    await textGen.generateAllTexts(sampleSpec, 'de');
    assert.equal(mockPool._calls.length, 7);
    for (const call of mockPool._calls) {
      assert.ok(call.sql.includes('INSERT INTO product_texts'));
      assert.ok(call.sql.includes('ON CONFLICT'));
    }
  });

  it('9: getTexts — liest Texte als Key-Value-Map', async () => {
    mockPool.mockResult({
      rows: [
        { text_type: 'description', content: '{"short":"Test"}', version: '1.0.0', updated_at: '2026-01-01' },
        { text_type: 'faq', content: '[{"question":"Q?"}]', version: '1.0.0', updated_at: '2026-01-01' }
      ],
      rowCount: 2
    });
    const result = await textGen.getTexts('test-product', 'de');
    assert.ok(result.description);
    assert.ok(result.faq);
    assert.equal(result.description.content, '{"short":"Test"}');
    assert.equal(mockPool._calls.length, 1);
    assert.ok(mockPool._calls[0].sql.includes('product_texts'));
  });
});
