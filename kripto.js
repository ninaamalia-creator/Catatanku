// Kriptografi CATATANKU (Web Crypto API).
// Format & parameter IDENTIK dengan versi Flutter/APK sehingga satu akun
// dapat dipakai di web dan di APK:
//   - AES-256-GCM, nonce 12 byte, tag 16 byte, disimpan base64(nonce|ciphertext|tag)
//   - PBKDF2-HMAC-SHA256, salt 16 byte, 150.000 iterasi, kunci 256 bit
//   - AAD: "catatanku:dek:pin:<uid>", "catatanku:dek:rec:<uid>",
//          "catatanku:note:<uid>:<noteId>:t|b"

export const ITERASI = 150000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = globalThis.crypto.subtle;
const ALFABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

export class RahasiaSalah extends Error {
  constructor() { super('Rahasia salah'); this.name = 'RahasiaSalah'; }
}

export function acak(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

export function hapus(u8) {
  if (u8) u8.fill(0);
}

export function b64e(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

export function b64d(s) {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

export async function turunkanKunci(rahasia, salt, iterasi) {
  const dasar = await subtle.importKey('raw', enc.encode(rahasia), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterasi }, dasar, 256);
  return new Uint8Array(bits);
}

export function kunciAes(raw) {
  return subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function sebagaiKunci(k) {
  return k instanceof Uint8Array ? kunciAes(k) : k;
}

export async function enkripsi(kunci, data, aad) {
  const k = await sebagaiKunci(kunci);
  const nonce = acak(12);
  const ct = new Uint8Array(await subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: enc.encode(aad), tagLength: 128 }, k, data));
  const out = new Uint8Array(12 + ct.length);
  out.set(nonce, 0);
  out.set(ct, 12);
  return out;
}

export async function dekripsi(kunci, data, aad) {
  if (data.length < 28) throw new RahasiaSalah();
  const k = await sebagaiKunci(kunci);
  try {
    return new Uint8Array(await subtle.decrypt(
      { name: 'AES-GCM', iv: data.subarray(0, 12), additionalData: enc.encode(aad), tagLength: 128 },
      k, data.subarray(12)));
  } catch {
    throw new RahasiaSalah();
  }
}

export async function enkripsiTeks(kunci, teks, aad) {
  return b64e(await enkripsi(kunci, enc.encode(teks), aad));
}

export async function dekripsiTeks(kunci, b64, aad) {
  return dec.decode(await dekripsi(kunci, b64d(b64), aad));
}

/** Kode pemulihan 20 karakter (~98 bit), mis. "K7QX2-MZ9PA-...". */
export function buatKodePemulihan() {
  let s = '';
  while (s.replace(/-/g, '').length < 20) {
    for (const b of acak(32)) {
      if (b >= 240) continue; // tolak agar sebaran merata (240 = 30 x 8)
      const n = s.replace(/-/g, '').length;
      if (n >= 20) break;
      if (n > 0 && n % 5 === 0 && !s.endsWith('-')) s += '-';
      s += ALFABET[b % 30];
    }
  }
  return s;
}

export function normalisasiKode(k) {
  return k.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function pinLemah(p) {
  return /^(\d)\1{5}$/.test(p) || '0123456789'.includes(p) || '9876543210'.includes(p);
}
