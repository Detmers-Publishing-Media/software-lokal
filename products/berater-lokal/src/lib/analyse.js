/**
 * Lueckenanalyse — prueft alle relevanten Absicherungs- und Vorsorgebereiche.
 * Gibt ein Array von Analyse-Ergebnissen mit Ampel-Status zurueck.
 */

export function analysiere(kunde, { einnahmen, ausgaben, policen, vermoegen, verbindlichkeiten, altersvorsorge, kinder }) {
  const ergebnisse = [];

  const nettoMonatlich = einnahmen
    .filter(e => e.typ === 'netto' && e.periode === 'monatlich')
    .reduce((s, e) => s + (e.betrag || 0), 0);

  const ausgabenMonatlich = ausgaben
    .filter(a => a.periode === 'monatlich')
    .reduce((s, a) => s + (a.betrag || 0), 0);

  const hatKinder = kinder.length > 0;
  const hatImmobilienkredit = verbindlichkeiten.some(v => v.typ === 'immobilienkredit');
  const restschuld = verbindlichkeiten
    .filter(v => v.typ === 'immobilienkredit')
    .reduce((s, v) => s + (v.restschuld || 0), 0);
  const hatEigentum = vermoegen.some(v => v.typ === 'immobilie_selbst');

  // 1. BU
  const buPolicen = policen.filter(p => p.sparte === 'BU');
  const buLeistung = buPolicen.reduce((s, p) => s + (p.versicherungssumme || 0), 0);
  const buSoll = Math.round(nettoMonatlich * 0.75);

  if (buPolicen.length === 0) {
    ergebnisse.push({ risiko: 'Berufsunfaehigkeit (BU)', ist: 'Fehlt', soll: fmt(buSoll) + ' EUR/Monat', status: 'rot' });
  } else if (buLeistung < buSoll) {
    ergebnisse.push({ risiko: 'Berufsunfaehigkeit (BU)', ist: fmt(buLeistung) + ' EUR', soll: fmt(buSoll) + ' EUR/Monat', status: 'gelb' });
  } else {
    ergebnisse.push({ risiko: 'Berufsunfaehigkeit (BU)', ist: fmt(buLeistung) + ' EUR', soll: fmt(buSoll) + ' EUR/Monat', status: 'gruen' });
  }

  // 2. PHV
  const phvPolicen = policen.filter(p => p.sparte === 'Privathaftpflicht');
  if (phvPolicen.length === 0) {
    ergebnisse.push({ risiko: 'Privathaftpflicht', ist: 'Fehlt', soll: 'Mind. 10 Mio EUR', status: 'rot' });
  } else {
    const vs = phvPolicen[0].versicherungssumme || 0;
    ergebnisse.push({
      risiko: 'Privathaftpflicht',
      ist: fmt(vs) + ' EUR',
      soll: 'Mind. 10 Mio EUR',
      status: vs >= 10_000_000 ? 'gruen' : 'gelb',
    });
  }

  // 3. Risikoleben
  if (hatKinder || hatImmobilienkredit) {
    const rlvPolicen = policen.filter(p => p.sparte === 'Risikoleben');
    const rlvSumme = rlvPolicen.reduce((s, p) => s + (p.versicherungssumme || 0), 0);
    const rlvSoll = restschuld + (nettoMonatlich * 12 * 3);

    if (rlvPolicen.length === 0) {
      ergebnisse.push({ risiko: 'Risikolebensversicherung', ist: 'Fehlt', soll: fmt(rlvSoll) + ' EUR', status: 'rot' });
    } else if (rlvSumme < rlvSoll) {
      ergebnisse.push({ risiko: 'Risikolebensversicherung', ist: fmt(rlvSumme) + ' EUR', soll: fmt(rlvSoll) + ' EUR', status: 'gelb' });
    } else {
      ergebnisse.push({ risiko: 'Risikolebensversicherung', ist: fmt(rlvSumme) + ' EUR', soll: fmt(rlvSoll) + ' EUR', status: 'gruen' });
    }
  }

  // 4. Wohngebaeude
  if (hatEigentum) {
    const wgPolicen = policen.filter(p => p.sparte === 'Wohngebaeude');
    if (wgPolicen.length === 0) {
      ergebnisse.push({ risiko: 'Wohngebaeudeversicherung', ist: 'Fehlt', soll: 'Erforderlich bei Eigentum', status: 'rot' });
    } else {
      ergebnisse.push({ risiko: 'Wohngebaeudeversicherung', ist: 'Vorhanden', soll: 'Elementar pruefen', status: 'gelb' });
    }
  }

  // 5. Rentenluecke
  const haushaltNetto = nettoMonatlich;
  const bedarfAlter = Math.round(haushaltNetto * 0.8);
  const vorsorgeRente = altersvorsorge.reduce((s, a) => s + (a.prognostizierte_rente || 0), 0);
  const rentenluecke = bedarfAlter - vorsorgeRente;

  if (rentenluecke > 500) {
    ergebnisse.push({ risiko: 'Rentenluecke', ist: fmt(vorsorgeRente) + ' EUR/Monat', soll: fmt(bedarfAlter) + ' EUR/Monat (80%)', status: 'rot', luecke: rentenluecke });
  } else if (rentenluecke > 0) {
    ergebnisse.push({ risiko: 'Rentenluecke', ist: fmt(vorsorgeRente) + ' EUR/Monat', soll: fmt(bedarfAlter) + ' EUR/Monat (80%)', status: 'gelb', luecke: rentenluecke });
  } else {
    ergebnisse.push({ risiko: 'Rentenluecke', ist: fmt(vorsorgeRente) + ' EUR/Monat', soll: fmt(bedarfAlter) + ' EUR/Monat (80%)', status: 'gruen', luecke: 0 });
  }

  // 6. Notgroschen
  const liquide = vermoegen
    .filter(v => ['tagesgeld', 'festgeld'].includes(v.typ))
    .reduce((s, v) => s + (v.aktueller_wert || 0), 0);
  const notgroschenSoll = ausgabenMonatlich * 3;

  if (liquide < notgroschenSoll && notgroschenSoll > 0) {
    ergebnisse.push({
      risiko: 'Notgroschen (3 Monate)',
      ist: fmt(liquide) + ' EUR',
      soll: fmt(notgroschenSoll) + ' EUR',
      status: liquide < notgroschenSoll * 0.5 ? 'rot' : 'gelb',
    });
  } else if (notgroschenSoll > 0) {
    ergebnisse.push({ risiko: 'Notgroschen (3 Monate)', ist: fmt(liquide) + ' EUR', soll: fmt(notgroschenSoll) + ' EUR', status: 'gruen' });
  }

  // 7. Krankenversicherung
  const kvPolicen = policen.filter(p => ['KV (GKV)', 'KV (PKV)'].includes(p.sparte));
  if (kvPolicen.length === 0) {
    ergebnisse.push({ risiko: 'Krankenversicherung', ist: 'Nicht erfasst', soll: 'GKV oder PKV', status: 'gelb' });
  } else {
    ergebnisse.push({ risiko: 'Krankenversicherung', ist: kvPolicen[0].sparte, soll: 'Vorhanden', status: 'gruen' });
  }

  return ergebnisse;
}

function fmt(n) {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n);
}

export function countByStatus(ergebnisse) {
  return {
    rot: ergebnisse.filter(e => e.status === 'rot').length,
    gelb: ergebnisse.filter(e => e.status === 'gelb').length,
    gruen: ergebnisse.filter(e => e.status === 'gruen').length,
  };
}
