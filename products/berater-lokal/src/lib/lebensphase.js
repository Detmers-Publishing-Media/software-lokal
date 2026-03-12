/**
 * Berechnet die Lebensphase eines Kunden basierend auf Alter, Kindern, Eigentum und Verbindlichkeiten.
 */
export function berechneLebensphase(kunde, kinder = [], vermoegen = [], verbindlichkeiten = []) {
  const alter = berechneAlter(kunde.geburtsdatum);
  if (alter === null) return 'Unbekannt';

  const hatKinder = kinder.length > 0;
  const kinderImHaushalt = kinder.filter(k => k.im_haushalt);
  const juengstesKindAlter = kinderImHaushalt.length > 0
    ? Math.min(...kinderImHaushalt.map(k => berechneAlter(k.geburtsdatum) ?? 99))
    : null;
  const hatEigentum = vermoegen.some(v => v.typ === 'immobilie_selbst');
  const hatHypothekenkredit = verbindlichkeiten.some(v => v.typ === 'immobilienkredit');
  const istRentner = kunde.beruf_status === 'rentner';

  if (istRentner || alter >= 63) return 'Ruhestand';
  if (alter >= 55) return 'Vorruhestand';
  if (hatKinder && kinderImHaushalt.length === 0) return 'Empty Nester';
  if (hatEigentum && hatHypothekenkredit) return 'Eigenheim-Phase';
  if (hatKinder && juengstesKindAlter !== null && juengstesKindAlter >= 6) return 'Etablierte Familie';
  if (hatKinder && juengstesKindAlter !== null && juengstesKindAlter < 6) return 'Junge Familie';
  if (alter < 30 && !hatKinder && !hatEigentum) return 'Berufseinsteiger';
  if (alter < 30) return 'Berufseinsteiger';

  return 'Etabliert';
}

export function berechneAlter(geburtsdatum) {
  if (!geburtsdatum) return null;
  const geb = new Date(geburtsdatum);
  if (isNaN(geb.getTime())) return null;
  const heute = new Date();
  let alter = heute.getFullYear() - geb.getFullYear();
  const monatsDiff = heute.getMonth() - geb.getMonth();
  if (monatsDiff < 0 || (monatsDiff === 0 && heute.getDate() < geb.getDate())) {
    alter--;
  }
  return alter;
}

export function getLebensphaseColor(phase) {
  const colors = {
    'Berufseinsteiger': '#3182ce',
    'Junge Familie': '#38a169',
    'Etablierte Familie': '#2f855a',
    'Eigenheim-Phase': '#d69e2e',
    'Etabliert': '#718096',
    'Empty Nester': '#805ad5',
    'Vorruhestand': '#dd6b20',
    'Ruhestand': '#e53e3e',
    'Unbekannt': '#a0aec0',
  };
  return colors[phase] || '#a0aec0';
}
