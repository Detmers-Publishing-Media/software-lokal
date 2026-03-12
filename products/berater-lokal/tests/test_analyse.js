import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analysiere, countByStatus } from '../src/lib/analyse.js';

describe('Lueckenanalyse', () => {
  const baseKunde = { geburtsdatum: '1985-01-15', familienstand: 'ledig', beruf_status: 'angestellt' };

  it('BU fehlt → rot', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [{ typ: 'netto', betrag: 3500, periode: 'monatlich' }],
      ausgaben: [], policen: [], vermoegen: [], verbindlichkeiten: [], altersvorsorge: [], kinder: [],
    });
    const bu = ergebnisse.find(e => e.risiko.includes('BU'));
    assert.ok(bu);
    assert.equal(bu.status, 'rot');
    assert.equal(bu.ist, 'Fehlt');
  });

  it('BU vorhanden aber zu niedrig → gelb', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [{ typ: 'netto', betrag: 3500, periode: 'monatlich' }],
      ausgaben: [], vermoegen: [], verbindlichkeiten: [], altersvorsorge: [], kinder: [],
      policen: [{ sparte: 'BU', versicherungssumme: 1000 }],
    });
    const bu = ergebnisse.find(e => e.risiko.includes('BU'));
    assert.equal(bu.status, 'gelb');
  });

  it('BU ausreichend → gruen', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [{ typ: 'netto', betrag: 3500, periode: 'monatlich' }],
      ausgaben: [], vermoegen: [], verbindlichkeiten: [], altersvorsorge: [], kinder: [],
      policen: [{ sparte: 'BU', versicherungssumme: 3000 }],
    });
    const bu = ergebnisse.find(e => e.risiko.includes('BU'));
    assert.equal(bu.status, 'gruen');
  });

  it('PHV fehlt → rot', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [], ausgaben: [], policen: [], vermoegen: [],
      verbindlichkeiten: [], altersvorsorge: [], kinder: [],
    });
    const phv = ergebnisse.find(e => e.risiko.includes('Privathaftpflicht'));
    assert.ok(phv);
    assert.equal(phv.status, 'rot');
  });

  it('PHV mit 10 Mio → gruen', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [], ausgaben: [], vermoegen: [], verbindlichkeiten: [], altersvorsorge: [], kinder: [],
      policen: [{ sparte: 'Privathaftpflicht', versicherungssumme: 10_000_000 }],
    });
    const phv = ergebnisse.find(e => e.risiko.includes('Privathaftpflicht'));
    assert.equal(phv.status, 'gruen');
  });

  it('Risikoleben bei Kindern fehlt → rot', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [{ typ: 'netto', betrag: 3500, periode: 'monatlich' }],
      ausgaben: [], policen: [], vermoegen: [], verbindlichkeiten: [],
      altersvorsorge: [], kinder: [{ name: 'Lisa' }],
    });
    const rlv = ergebnisse.find(e => e.risiko.includes('Risikoleben'));
    assert.ok(rlv);
    assert.equal(rlv.status, 'rot');
  });

  it('Rentenluecke > 500 → rot', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [{ typ: 'netto', betrag: 3500, periode: 'monatlich' }],
      ausgaben: [], policen: [], vermoegen: [], verbindlichkeiten: [],
      altersvorsorge: [{ prognostizierte_rente: 800 }], kinder: [],
    });
    const rl = ergebnisse.find(e => e.risiko.includes('Rentenluecke'));
    assert.ok(rl);
    assert.equal(rl.status, 'rot');
  });

  it('Notgroschen ausreichend → gruen', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [], policen: [], verbindlichkeiten: [], altersvorsorge: [], kinder: [],
      ausgaben: [{ kategorie: 'miete', betrag: 1000, periode: 'monatlich' }],
      vermoegen: [{ typ: 'tagesgeld', aktueller_wert: 5000 }],
    });
    const ng = ergebnisse.find(e => e.risiko.includes('Notgroschen'));
    assert.ok(ng);
    assert.equal(ng.status, 'gruen');
  });

  it('KV fehlt → gelb', () => {
    const ergebnisse = analysiere(baseKunde, {
      einnahmen: [], ausgaben: [], policen: [], vermoegen: [],
      verbindlichkeiten: [], altersvorsorge: [], kinder: [],
    });
    const kv = ergebnisse.find(e => e.risiko.includes('Krankenversicherung'));
    assert.ok(kv);
    assert.equal(kv.status, 'gelb');
  });

  it('countByStatus zaehlt korrekt', () => {
    const ergebnisse = [
      { status: 'rot' }, { status: 'rot' },
      { status: 'gelb' },
      { status: 'gruen' }, { status: 'gruen' }, { status: 'gruen' },
    ];
    const result = countByStatus(ergebnisse);
    assert.equal(result.rot, 2);
    assert.equal(result.gelb, 1);
    assert.equal(result.gruen, 3);
  });
});
