/**
 * 5 Finanzrechner als reine Funktionen.
 * Input-Objekt → Result-Objekt, kein Seiteneffekt.
 */

/**
 * BeitragsAnpassungsRechner
 * @param {{ oldPremium: number, newPremium: number }} input
 * @returns {{ diffAbsolute: number, diffPercent: number, fiveYearCost: number, sonderkuendigung: boolean }}
 */
export function calcBeitragsAnpassung({ oldPremium, newPremium }) {
  const diffAbsolute = newPremium - oldPremium;
  const diffPercent = oldPremium > 0 ? (diffAbsolute / oldPremium) * 100 : 0;
  const fiveYearCost = diffAbsolute * 5;
  const sonderkuendigung = diffPercent > 10;
  return { diffAbsolute, diffPercent, fiveYearCost, sonderkuendigung };
}

/**
 * StornoHaftungsRechner
 * @param {{ courtage: number, haftungsMonate: number, vertragsBeginn: string }} input
 * @returns {{ rueckzahlungHeute: number, restMonate: number, monatlicheEntwicklung: Array<{monat: number, betrag: number}> }}
 */
export function calcStornoHaftung({ courtage, haftungsMonate, vertragsBeginn }) {
  const start = new Date(vertragsBeginn);
  const now = new Date();
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedMonate = Math.max(0, Math.floor(elapsedMs / (30.44 * 24 * 60 * 60 * 1000)));
  const restMonate = Math.max(0, haftungsMonate - elapsedMonate);

  const rueckzahlungHeute = haftungsMonate > 0
    ? Math.round(courtage * (restMonate / haftungsMonate) * 100) / 100
    : 0;

  // Monthly development: show next 12 months
  const monatlicheEntwicklung = [];
  for (let m = 0; m < 12; m++) {
    const futureRest = Math.max(0, restMonate - m);
    const betrag = haftungsMonate > 0
      ? Math.round(courtage * (futureRest / haftungsMonate) * 100) / 100
      : 0;
    monatlicheEntwicklung.push({ monat: m, betrag });
  }

  return { rueckzahlungHeute, restMonate, monatlicheEntwicklung };
}

/**
 * RatenzuschlagRechner
 * @param {{ jahresPraemie: number, ratenzuschlagProzent: number }} input
 * @returns {{ monatlich: number, summeMonatlich: number, mehrkosten: number, mehrkostenProzent: number }}
 */
export function calcRatenzuschlag({ jahresPraemie, ratenzuschlagProzent }) {
  const faktor = 1 + ratenzuschlagProzent / 100;
  const summeMonatlich = Math.round(jahresPraemie * faktor * 100) / 100;
  const monatlich = Math.round(summeMonatlich / 12 * 100) / 100;
  const mehrkosten = Math.round((summeMonatlich - jahresPraemie) * 100) / 100;
  const mehrkostenProzent = ratenzuschlagProzent;
  return { monatlich, summeMonatlich, mehrkosten, mehrkostenProzent };
}

/**
 * CourtagenBarwertRechner
 * @param {{ sparten: Array<{name: string, jahresCourtage: number}>, faktor: number }} input
 * @returns {{ spartenWerte: Array<{name: string, barwert: number}>, gesamtBarwert: number }}
 */
export function calcCourtagenBarwert({ sparten, faktor }) {
  const spartenWerte = sparten.map(s => ({
    name: s.name,
    barwert: Math.round(s.jahresCourtage * faktor * 100) / 100,
  }));
  const gesamtBarwert = Math.round(
    spartenWerte.reduce((sum, s) => sum + s.barwert, 0) * 100
  ) / 100;
  return { spartenWerte, gesamtBarwert };
}

/**
 * SpartenDeckungsGrad
 * @param {{ vorhandeneSparten: string[] }} input
 * @returns {{ vorhanden: string[], fehlend: string[], deckungsgrad: number, basisSparten: string[] }}
 */
export function calcSpartenDeckung({ vorhandeneSparten }) {
  const basisSparten = [
    'Privathaftpflicht',
    'Hausrat',
    'Wohngebaeude',
    'KFZ',
    'Rechtsschutz',
    'Unfall',
    'Berufsunfaehigkeit',
    'Risikoleben',
  ];
  const vorhanden = basisSparten.filter(s => vorhandeneSparten.includes(s));
  const fehlend = basisSparten.filter(s => !vorhandeneSparten.includes(s));
  const deckungsgrad = basisSparten.length > 0
    ? Math.round((vorhanden.length / basisSparten.length) * 1000) / 10
    : 0;
  return { vorhanden, fehlend, deckungsgrad, basisSparten };
}
