const crypto = require('crypto');

// Digistore24 SHA-512 Signaturpruefung
// Algorithmus: Keys sortieren (ohne sha_sign), leere Werte skippen,
// key=value + passphrase konkatenieren, SHA-512, Uppercase
function verifySignature(params, passphrase) {
  const receivedSign = params.sha_sign;
  if (!receivedSign) return false;

  const keys = Object.keys(params)
    .filter(k => k !== 'sha_sign')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  let shaString = '';
  for (const key of keys) {
    const value = params[key];
    if (value === '' || value === undefined || value === null) continue;
    shaString += key + '=' + value + passphrase;
  }

  const computed = crypto.createHash('sha512').update(shaString).digest('hex').toUpperCase();
  return computed === receivedSign.toUpperCase();
}

module.exports = { verifySignature };
