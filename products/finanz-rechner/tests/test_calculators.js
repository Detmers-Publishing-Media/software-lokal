import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcBeitragsAnpassung,
  calcStornoHaftung,
  calcRatenzuschlag,
  calcCourtagenBarwert,
  calcSpartenDeckung,
} from '../src/lib/calculators.js';

// ── BeitragsAnpassungsRechner ──────────────────────────────────────

describe('calcBeitragsAnpassung', () => {
  it('calculates basic premium increase', () => {
    const r = calcBeitragsAnpassung({ oldPremium: 100, newPremium: 110 });
    assert.equal(r.diffAbsolute, 10);
    assert.equal(r.diffPercent, 10);
    assert.equal(r.fiveYearCost, 50);
  });

  it('flags Sonderkuendigung when increase > 10%', () => {
    const r = calcBeitragsAnpassung({ oldPremium: 100, newPremium: 115 });
    assert.equal(r.sonderkuendigung, true);
  });

  it('no Sonderkuendigung when increase <= 10%', () => {
    const r = calcBeitragsAnpassung({ oldPremium: 100, newPremium: 110 });
    assert.equal(r.sonderkuendigung, false);
  });

  it('handles zero input (0 to 0)', () => {
    const r = calcBeitragsAnpassung({ oldPremium: 0, newPremium: 0 });
    assert.equal(r.diffAbsolute, 0);
    assert.equal(r.diffPercent, 0);
    assert.equal(r.fiveYearCost, 0);
    assert.equal(r.sonderkuendigung, false);
  });

  it('handles premium decrease (negative adjustment)', () => {
    const r = calcBeitragsAnpassung({ oldPremium: 200, newPremium: 180 });
    assert.equal(r.diffAbsolute, -20);
    assert.equal(r.diffPercent, -10);
    assert.equal(r.fiveYearCost, -100);
    assert.equal(r.sonderkuendigung, false);
  });
});

// ── StornoHaftungsRechner ──────────────────────────────────────────

describe('calcStornoHaftung', () => {
  it('calculates basic repayment risk', () => {
    // Set vertragsBeginn 24 months ago → 16 remaining of 40
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 24);
    const r = calcStornoHaftung({
      courtage: 3100,
      haftungsMonate: 40,
      vertragsBeginn: start.toISOString().slice(0, 10),
    });
    // ~16 remaining months → ~3100 * 16/40 = 1240
    assert.ok(r.rueckzahlungHeute > 1100);
    assert.ok(r.rueckzahlungHeute < 1400);
    assert.ok(r.restMonate >= 15 && r.restMonate <= 17);
  });

  it('returns 0 when liability period has expired', () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 5);
    const r = calcStornoHaftung({
      courtage: 3100,
      haftungsMonate: 40,
      vertragsBeginn: start.toISOString().slice(0, 10),
    });
    assert.equal(r.rueckzahlungHeute, 0);
    assert.equal(r.restMonate, 0);
  });

  it('monthly development has 12 entries', () => {
    const r = calcStornoHaftung({
      courtage: 1000,
      haftungsMonate: 24,
      vertragsBeginn: new Date().toISOString().slice(0, 10),
    });
    assert.equal(r.monatlicheEntwicklung.length, 12);
  });

  it('each subsequent month has lower or equal repayment', () => {
    const r = calcStornoHaftung({
      courtage: 5000,
      haftungsMonate: 60,
      vertragsBeginn: new Date().toISOString().slice(0, 10),
    });
    for (let i = 1; i < r.monatlicheEntwicklung.length; i++) {
      assert.ok(r.monatlicheEntwicklung[i].betrag <= r.monatlicheEntwicklung[i - 1].betrag);
    }
  });
});

// ── RatenzuschlagRechner ───────────────────────────────────────────

describe('calcRatenzuschlag', () => {
  it('calculates basic surcharge', () => {
    const r = calcRatenzuschlag({ jahresPraemie: 1200, ratenzuschlagProzent: 5 });
    assert.equal(r.summeMonatlich, 1260);
    assert.equal(r.mehrkosten, 60);
    assert.equal(r.monatlich, 105);
  });

  it('no surcharge when 0%', () => {
    const r = calcRatenzuschlag({ jahresPraemie: 1200, ratenzuschlagProzent: 0 });
    assert.equal(r.summeMonatlich, 1200);
    assert.equal(r.mehrkosten, 0);
    assert.equal(r.monatlich, 100);
  });

  it('monthly = annual * (1 + surcharge%) / 12', () => {
    const r = calcRatenzuschlag({ jahresPraemie: 960, ratenzuschlagProzent: 8 });
    const expected = Math.round(960 * 1.08 / 12 * 100) / 100;
    assert.equal(r.monatlich, expected);
  });
});

// ── CourtagenBarwertRechner ────────────────────────────────────────

describe('calcCourtagenBarwert', () => {
  it('single division, factor 3', () => {
    const r = calcCourtagenBarwert({
      sparten: [{ name: 'KFZ', jahresCourtage: 10000 }],
      faktor: 3,
    });
    assert.equal(r.spartenWerte[0].barwert, 30000);
    assert.equal(r.gesamtBarwert, 30000);
  });

  it('multiple divisions, total is sum', () => {
    const r = calcCourtagenBarwert({
      sparten: [
        { name: 'KFZ', jahresCourtage: 10000 },
        { name: 'Hausrat', jahresCourtage: 5000 },
        { name: 'Leben', jahresCourtage: 3000 },
      ],
      faktor: 2,
    });
    assert.equal(r.gesamtBarwert, 36000);
    assert.equal(r.spartenWerte.length, 3);
  });

  it('factor 4 is double of factor 2', () => {
    const input = {
      sparten: [{ name: 'KFZ', jahresCourtage: 8000 }],
    };
    const r2 = calcCourtagenBarwert({ ...input, faktor: 2 });
    const r4 = calcCourtagenBarwert({ ...input, faktor: 4 });
    assert.equal(r4.gesamtBarwert, r2.gesamtBarwert * 2);
  });
});

// ── SpartenDeckungsGrad ────────────────────────────────────────────

describe('calcSpartenDeckung', () => {
  it('all 8 present = 100%', () => {
    const all = [
      'Privathaftpflicht', 'Hausrat', 'Wohngebaeude', 'KFZ',
      'Rechtsschutz', 'Unfall', 'Berufsunfaehigkeit', 'Risikoleben',
    ];
    const r = calcSpartenDeckung({ vorhandeneSparten: all });
    assert.equal(r.deckungsgrad, 100);
    assert.equal(r.fehlend.length, 0);
    assert.equal(r.vorhanden.length, 8);
  });

  it('none present = 0%', () => {
    const r = calcSpartenDeckung({ vorhandeneSparten: [] });
    assert.equal(r.deckungsgrad, 0);
    assert.equal(r.fehlend.length, 8);
    assert.equal(r.vorhanden.length, 0);
  });

  it('5 of 8 = 62.5%', () => {
    const r = calcSpartenDeckung({
      vorhandeneSparten: ['Privathaftpflicht', 'Hausrat', 'KFZ', 'Unfall', 'Risikoleben'],
    });
    assert.equal(r.deckungsgrad, 62.5);
    assert.equal(r.vorhanden.length, 5);
    assert.equal(r.fehlend.length, 3);
  });

  it('unknown division is ignored', () => {
    const r = calcSpartenDeckung({
      vorhandeneSparten: ['Privathaftpflicht', 'Cyberschutz'],
    });
    assert.equal(r.vorhanden.length, 1);
    assert.equal(r.deckungsgrad, 12.5);
  });
});
