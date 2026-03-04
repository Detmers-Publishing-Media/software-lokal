const APP_SECRET = 'codefabrik-vereins-v1'; // Replaced by DB key in v0.4 (SQLCipher)

// Works in both Tauri WebView (globalThis.crypto) and Node.js 18+ (node:crypto)
const webcrypto = globalThis.crypto ?? (await import('node:crypto')).webcrypto;

export async function computeHmac(message) {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    'raw', enc.encode(APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await webcrypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
