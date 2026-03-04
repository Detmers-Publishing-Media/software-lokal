const pool = require('../db/pool');

function generateDescription(spec) {
  const d = spec.description || {};
  return JSON.stringify({
    short: d.short || '',
    long: d.long || '',
    target_audience: d.target_audience || ''
  });
}

function generateBenefits(spec) {
  const benefits = (spec.description && spec.description.benefits) || [];
  return JSON.stringify(benefits);
}

function generateFeatures(spec) {
  const features = (spec.features || []).map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    status: f.status || 'planned'
  }));
  return JSON.stringify(features);
}

function generateFaq(spec) {
  const faq = (spec.faq || []).map(f => ({
    question: f.question,
    answer: f.answer
  }));
  return JSON.stringify(faq);
}

function generateInstallation(spec) {
  const inst = spec.installation || {};
  return JSON.stringify({
    prerequisites: inst.prerequisites || [],
    steps: inst.steps || [],
    notes: inst.notes || ''
  });
}

function generateReleaseNotes(spec) {
  return JSON.stringify({
    version: spec.version || '0.0.0',
    name: spec.name || '',
    date: new Date().toISOString().split('T')[0]
  });
}

function generateDigistore(spec) {
  const d = spec.description || {};
  const pricing = spec.pricing || {};
  const benefits = (d.benefits || []).map(b => `<li>${b}</li>`).join('\n    ');
  const includes = (pricing.includes || []).map(i => `<li>${i}</li>`).join('\n    ');

  const html = `<h2>${spec.name || spec.product_id}</h2>
<p>${d.short || ''}</p>
<p>${(d.long || '').trim()}</p>
<h3>Vorteile</h3>
<ul>
    ${benefits}
</ul>
<h3>Im Kauf enthalten</h3>
<ul>
    ${includes}
</ul>`;
  return html;
}

const TEXT_TYPES = ['description', 'benefits', 'features', 'faq', 'installation', 'release_notes', 'digistore'];

const generators = {
  description: generateDescription,
  benefits: generateBenefits,
  features: generateFeatures,
  faq: generateFaq,
  installation: generateInstallation,
  release_notes: generateReleaseNotes,
  digistore: generateDigistore
};

async function generateAllTexts(spec, locale = 'de') {
  const productId = spec.product_id;
  const version = spec.version || null;

  for (const type of TEXT_TYPES) {
    const content = generators[type](spec);
    await pool.query(`
      INSERT INTO product_texts (product_id, text_type, content, locale, version, generated_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT ON CONSTRAINT uq_product_text
      DO UPDATE SET content = $3, version = $5, updated_at = NOW()
    `, [productId, type, content, locale, version]);
  }
}

async function getTexts(productId, locale = 'de') {
  const { rows } = await pool.query(
    'SELECT text_type, content, version, updated_at FROM product_texts WHERE product_id = $1 AND locale = $2',
    [productId, locale]
  );
  const result = {};
  for (const row of rows) {
    result[row.text_type] = {
      content: row.content,
      version: row.version,
      updated_at: row.updated_at
    };
  }
  return result;
}

module.exports = {
  generateDescription,
  generateBenefits,
  generateFeatures,
  generateFaq,
  generateInstallation,
  generateReleaseNotes,
  generateDigistore,
  generateAllTexts,
  getTexts,
  TEXT_TYPES
};
