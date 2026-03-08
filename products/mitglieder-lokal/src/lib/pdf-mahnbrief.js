import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

const STUFE_CONFIG = {
  1: {
    betreff: 'Zahlungserinnerung',
    frist: '14 Tagen',
    text: (name, betrag, year, fristDatum) =>
      `Sehr geehrte/r ${name},\n\n` +
      `bei der Durchsicht unserer Unterlagen haben wir festgestellt, dass Ihr Mitgliedsbeitrag ` +
      `fuer das Jahr ${year} in Hoehe von ${betrag} EUR noch nicht bei uns eingegangen ist.\n\n` +
      `Wir bitten Sie freundlich, den offenen Betrag bis zum ${fristDatum} auf das unten angegebene ` +
      `Konto zu ueberweisen.\n\n` +
      `Sollte sich Ihre Zahlung mit diesem Schreiben gekreuzt haben, betrachten Sie diese ` +
      `Erinnerung bitte als gegenstandslos.`,
  },
  2: {
    betreff: '1. Mahnung',
    frist: '14 Tagen',
    text: (name, betrag, year, fristDatum) =>
      `Sehr geehrte/r ${name},\n\n` +
      `leider konnten wir trotz unserer Zahlungserinnerung keinen Eingang Ihres Mitgliedsbeitrags ` +
      `fuer das Jahr ${year} in Hoehe von ${betrag} EUR feststellen.\n\n` +
      `Wir bitten Sie dringend, den ausstehenden Betrag bis zum ${fristDatum} auf das unten ` +
      `angegebene Konto zu ueberweisen.\n\n` +
      `Bitte beachten Sie, dass bei weiterem Zahlungsverzug weitere Massnahmen eingeleitet ` +
      `werden koennen.`,
  },
  3: {
    betreff: '2. Mahnung — Letzte Aufforderung',
    frist: '7 Tagen',
    text: (name, betrag, year, fristDatum) =>
      `Sehr geehrte/r ${name},\n\n` +
      `trotz unserer bisherigen Schreiben ist Ihr Mitgliedsbeitrag fuer das Jahr ${year} ` +
      `in Hoehe von ${betrag} EUR weiterhin offen.\n\n` +
      `Wir fordern Sie hiermit letztmalig auf, den ausstehenden Betrag bis zum ` +
      `${fristDatum} zu begleichen.\n\n` +
      `Sollte bis zu diesem Datum kein Zahlungseingang vorliegen, behalten wir uns vor, ` +
      `den Vorstand ueber den Sachverhalt zu informieren und gegebenenfalls weitere ` +
      `vereinsrechtliche Schritte einzuleiten.`,
  },
};

/**
 * Generate a dunning letter PDF.
 * @param {Object} member - Member data (first_name, last_name, street, zip, city)
 * @param {Object} clubProfile - Club profile for letterhead
 * @param {number} year - Fee year
 * @param {number} outstandingCents - Outstanding amount in cents
 * @param {1|2|3} stufe - Dunning level
 * @param {boolean} isProbe - Trial watermark
 */
export function generateMahnbrief(member, clubProfile, year, outstandingCents, stufe, isProbe) {
  const config = STUFE_CONFIG[stufe] ?? STUFE_CONFIG[1];
  const today = new Date();
  const todayStr = today.toLocaleDateString('de-DE');
  const fristTage = stufe === 3 ? 7 : 14;
  const fristDate = new Date(today.getTime() + fristTage * 86400000);
  const fristStr = fristDate.toLocaleDateString('de-DE');
  const betrag = (outstandingCents / 100).toFixed(2);
  const memberName = `${member.first_name} ${member.last_name}`;

  const brieftext = config.text(memberName, betrag, year, fristStr);

  // Club letterhead
  const headerLines = [];
  if (clubProfile?.name) {
    headerLines.push({ text: clubProfile.name, fontSize: 14, bold: true, margin: [0, 0, 0, 2] });
    const addr = [clubProfile.street, [clubProfile.zip, clubProfile.city].filter(Boolean).join(' ')].filter(Boolean);
    if (addr.length) {
      headerLines.push({ text: addr.join(', '), fontSize: 9, color: '#666', margin: [0, 0, 0, 0] });
    }
    const contact = [clubProfile.contact_email, clubProfile.contact_phone].filter(Boolean);
    if (contact.length) {
      headerLines.push({ text: contact.join(' | '), fontSize: 9, color: '#666', margin: [0, 0, 0, 12] });
    }
  }

  // Recipient address
  const recipientLines = [
    `${member.first_name} ${member.last_name}`,
    member.street,
    [member.zip, member.city].filter(Boolean).join(' '),
  ].filter(Boolean);

  // Bank info
  const bankLines = [];
  if (clubProfile?.iban) {
    bankLines.push({ text: 'Bankverbindung:', bold: true, fontSize: 9, margin: [0, 12, 0, 2] });
    bankLines.push({ text: `IBAN: ${clubProfile.iban}`, fontSize: 9 });
    if (clubProfile.bic) bankLines.push({ text: `BIC: ${clubProfile.bic}`, fontSize: 9 });
    if (clubProfile.bank_name) bankLines.push({ text: clubProfile.bank_name, fontSize: 9 });
    bankLines.push({ text: `Verwendungszweck: Mitgliedsbeitrag ${year} / ${member.member_number ?? ''}`, fontSize: 9, margin: [0, 2, 0, 0] });
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [60, 60, 60, 80],
    content: [
      ...headerLines,
      { text: recipientLines.join('\n'), fontSize: 10, margin: [0, 24, 0, 24] },
      { text: `${clubProfile?.city ?? ''}, ${todayStr}`, fontSize: 10, alignment: 'right', margin: [0, 0, 0, 16] },
      { text: config.betreff, fontSize: 12, bold: true, margin: [0, 0, 0, 12] },
      { text: brieftext, fontSize: 10, lineHeight: 1.4 },
      ...bankLines,
      { text: '\n\nMit freundlichen Gruessen', fontSize: 10, margin: [0, 16, 0, 4] },
      { text: clubProfile?.chairman ?? 'Der Vorstand', fontSize: 10 },
      { text: clubProfile?.name ?? '', fontSize: 9, color: '#666' },
    ],
    footer: isProbe ? {
      text: 'Erstellt mit Probe-Version — codefabrik.de',
      fontSize: 7, color: '#999', alignment: 'center', margin: [0, 20, 0, 0],
    } : undefined,
  };

  pdfMake.createPdf(docDefinition).open();
}
