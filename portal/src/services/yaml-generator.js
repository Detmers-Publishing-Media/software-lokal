const yaml = require('js-yaml');

function generateSupportYaml(supportCase, license) {
  const typeId = supportCase.category === 'feature'
    ? supportCase.case_number.replace('SUP-', 'STORY-')
    : supportCase.case_number.replace('SUP-', 'BUG-');
  const type = supportCase.category === 'feature' ? 'story' : 'bug';

  return yaml.dump({
    id: typeId,
    type,
    title: `${supportCase.case_number}: ${supportCase.title}`,
    beschreibung: [
      `Kundenmeldung (Lizenz: ${license.product_id}):`,
      supportCase.description
    ].join('\n'),
    akzeptanzkriterien: [
      'Problem ist behoben',
      'Test existiert'
    ],
    produkt: license.product_id,
    prioritaet: supportCase.priority || 'normal',
    quelle: 'portal',
    portal_ref: supportCase.case_number,
    adr_refs: []
  }, { lineWidth: -1 });
}

function generateRequestYaml(request, license) {
  return yaml.dump({
    id: request.request_number.replace('REQ-', 'STORY-'),
    type: 'story',
    title: `${request.request_number}: ${request.title}`,
    beschreibung: [
      `Kundenanforderung (Lizenz: ${license.product_id}):`,
      request.description
    ].join('\n'),
    akzeptanzkriterien: [
      'Feature ist implementiert',
      'Test existiert'
    ],
    produkt: license.product_id,
    prioritaet: request.priority || 'normal',
    quelle: 'portal',
    portal_ref: request.request_number,
    adr_refs: []
  }, { lineWidth: -1 });
}

function generateIdeaYaml(idea, license) {
  return yaml.dump({
    id: idea.idea_number,
    type: 'idea',
    title: `${idea.idea_number}: ${idea.title}`,
    beschreibung: [
      `Kundenidee (Lizenz: ${license.product_id}):`,
      idea.description
    ].join('\n'),
    produkt: license.product_id,
    kategorie: idea.category || 'new_product',
    quelle: 'portal',
    portal_ref: idea.idea_number
  }, { lineWidth: -1 });
}

module.exports = { generateSupportYaml, generateRequestYaml, generateIdeaYaml };
