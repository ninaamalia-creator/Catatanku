// CATATANKU versi web. Struktur data Firestore & enkripsi sama dengan versi APK.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy,
  onSnapshot, serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import * as K from './kripto.js';

// ------------------------------------------------------------ Firebase ---
const firebaseConfig = {
  apiKey: 'AIzaSyCVYG33lv_FZRUeoQD3ihUIcfWPCcS4q9A',
  authDomain: 'catatanku-8e11c.firebaseapp.com',
  projectId: 'catatanku-8e11c',
  storageBucket: 'catatanku-8e11c.firebasestorage.app',
  messagingSenderId: '851208868214',
  appId: '1:851208868214:web:5c2464111554e07cfeaa57',
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try {
  // Penyimpanan offline: catatan tetap bisa dibuka/diubah tanpa internet.
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  db = initializeFirestore(fbApp, {});
}

// --------------------------------------------------------------- Utilitas ---
const $ = (s) => document.querySelector(s);
const IKON = {
  kembali: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  tambah: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  panah: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  cari: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  tutup: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  pengaturan: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  hapus: 'M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z',
  mata: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  salin: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  keluar: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  kunci: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
};
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IKON[n]}"/></svg>`;
document.querySelectorAll('[data-ic]').forEach((el) => { el.innerHTML = svg(el.dataset.ic); });

let toastT;
function pesan(teks, galat = false) {
  const t = $('#toast');
  t.textContent = teks;
  t.className = 'toast show' + (galat ? ' err' : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.className = 'toast'; }, 3200);
}

function dialog({ judul, isi, ok = 'OK', batal = 'BATAL', bahaya = false }) {
  return new Promise((selesai) => {
    $('#dlg-judul').textContent = judul;
    const wadah = $('#dlg-isi');
    wadah.replaceChildren(typeof isi === 'string' ? document.createTextNode(isi) : isi);
    const okB = $('#dlg-ok');
    const bB = $('#dlg-batal');
    okB.textContent = ok;
    okB.classList.toggle('danger', bahaya);
    bB.hidden = !batal;
    bB.textContent = batal || '';
    $('#dlg').hidden = false;
    const tutup = (v) => {
      $('#dlg').hidden = true;
      okB.onclick = bB.onclick = null;
      selesai(v);
    };
    okB.onclick = () => tutup(true);
    bB.onclick = () => tutup(false);
  });
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function formatTanggal(d) {
  const dua = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${dua(d.getHours())}.${dua(d.getMinutes())}`;
}

/** Menampilkan teks dengan alamat website yang bisa diklik (hanya http/https). */
function tampilkanDenganTautan(el, teks) {
  el.replaceChildren();
  const re = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
  let akhir = 0;
  let m;
  while ((m = re.exec(teks))) {
    const url = m[0].replace(/[.,;:!?)\]]+$/, '');
    el.append(teks.slice(akhir, m.index));
    const a = document.createElement('a');
    a.href = /^https?:\/\//i.test(url) ? url : 'https://' + url;
    a.textContent = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    el.append(a);
    akhir = m.index + url.length;
    re.lastIndex = akhir;
  }
  el.append(teks.slice(akhir));
}

function denganBatasWaktu(janji, ms) {
  janji.catch((e) => console.warn('Sinkronisasi tertunda gagal:', e));
  return Promise.race([janji, new Promise((r) => setTimeout(r, ms))]);
}

const pesanUmum = (e) => (e && e.code && String(e.code).includes('unavailable')) || !navigator.onLine
  ? 'Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.'
  : 'Terjadi kesalahan: ' + (e && e.message ? e.message : e);

// ------------------------------------------------------------- Status ---
const S = {
  tahap: 'memuat', uid: null, email: '',
  dek: null, kunci: null, dekPulih: null,
  catatan: [], dimuat: false, galatDaftar: false, cache: new Map(), seq: 0, unsub: null,
  cari: '', idAktif: null, ditinggal: null,
};
let layar = '';
let modePin = '';

function tampil(id) {
  document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== id; });
  layar = id;
  $('#menu').hidden = true;
  window.scrollTo(0, 0);
}
function buka(id) { history.pushState({ l: id }, ''); tampil(id); }
const kembali = () => history.back();
document.querySelectorAll('[data-kembali]').forEach((b) => { b.onclick = kembali; });

// ------------------------------------------------------- Brankas kunci ---
const refUser = () => doc(db, 'users', S.uid);
const kolCatatan = () => collection(db, 'users', S.uid, 'notes');
const aadPin = () => `catatanku:dek:pin:${S.uid}`;
const aadPulih = () => `catatanku:dek:rec:${S.uid}`;
const aadCatatan = (id, f) => `catatanku:note:${S.uid}:${id}:${f}`;

async function brankasBuat(pin) {
  const dek = K.acak(32);
  const pinSalt = K.acak(16);
  const recSalt = K.acak(16);
  const kode = K.buatKodePemulihan();
  const [kp, kr] = await Promise.all([
    K.turunkanKunci(pin, pinSalt, K.ITERASI),
    K.turunkanKunci(K.normalisasiKode(kode), recSalt, K.ITERASI),
  ]);
  const pinWrap = await K.enkripsi(kp, dek, aadPin());
  const recWrap = await K.enkripsi(kr, dek, aadPulih());
  K.hapus(kp); K.hapus(kr);
  await denganBatasWaktu(setDoc(refUser(), {
    v: 1,
    kdf: {
      alg: 'PBKDF2-HMAC-SHA256', pinIter: K.ITERASI, recIter: K.ITERASI,
      pinSalt: K.b64e(pinSalt), recSalt: K.b64e(recSalt),
    },
    pinWrap: K.b64e(pinWrap),
    recoveryWrap: K.b64e(recWrap),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }), 8000);
  return { dek, kode };
}

async function brankasBuka(rahasia, jenis) {
  const snap = await getDoc(refUser());
  const d = snap.data();
  if (!d) throw new Error('Data PIN tidak ditemukan.');
  const pin = jenis === 'pin';
  const k = await K.turunkanKunci(
    pin ? rahasia : K.normalisasiKode(rahasia),
    K.b64d(pin ? d.kdf.pinSalt : d.kdf.recSalt),
    pin ? d.kdf.pinIter : d.kdf.recIter);
  try {
    return await K.dekripsi(k, K.b64d(pin ? d.pinWrap : d.recoveryWrap), pin ? aadPin() : aadPulih());
  } finally {
    K.hapus(k);
  }
}

async function brankasGantiPin(dek, pinBaru) {
  const salt = K.acak(16);
  const k = await K.turunkanKunci(pinBaru, salt, K.ITERASI);
  const wrap = await K.enkripsi(k, dek, aadPin());
  K.hapus(k);
  await denganBatasWaktu(updateDoc(refUser(), {
    'kdf.pinSalt': K.b64e(salt),
    'kdf.pinIter': K.ITERASI,
    pinWrap: K.b64e(wrap),
    updatedAt: serverTimestamp(),
  }), 8000);
}

// ------------------------------------------- Pembatas percobaan salah ---
const BATAS = 5;
function sisaKunci() {
  const sampai = Number(localStorage.getItem('pin_kunci_sampai') || 0);
  const sisa = sampai - Date.now();
  if (sisa <= 0) return null;
  const detik = Math.ceil(sisa / 1000);
  return detik >= 60
    ? `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(detik / 60)} menit.`
    : `Terlalu banyak percobaan. Coba lagi dalam ${detik} detik.`;
}
function catatGagal(awal) {
  const gagal = Number(localStorage.getItem('pin_gagal') || 0) + 1;
  localStorage.setItem('pin_gagal', String(gagal));
  if (gagal >= BATAS) {
    const detik = Math.min(30 * 2 ** Math.min(gagal - BATAS, 10), 15 * 60);
    localStorage.setItem('pin_kunci_sampai', String(Date.now() + detik * 1000));
    return sisaKunci() || awal;
  }
  return `${awal} Sisa ${BATAS - gagal} percobaan.`;
}
function resetGagal() {
  localStorage.removeItem('pin_gagal');
  localStorage.removeItem('pin_kunci_sampai');
}

// ----------------------------------------------------------- Papan PIN ---
const pin = { nilai: '', sibuk: false, cfg: null };
const titik = [...document.querySelectorAll('#pin-dots b')];

function papanPin(cfg) {
  pin.cfg = cfg; pin.nilai = ''; pin.sibuk = false;
  $('#pin-judul').textContent = cfg.judul;
  $('#pin-ket').textContent = cfg.ket || '';
  $('#pin-bar').hidden = !cfg.bar;
  $('#pin-bar-judul').textContent = cfg.bar || '';
  $('#pin-logo').hidden = !!cfg.bar;
  for (const [id, b] of [['#pin-bawah1', cfg.bawah1], ['#pin-bawah2', cfg.bawah2]]) {
    const el = $(id);
    el.hidden = !b;
    if (b) { el.textContent = b.teks; el.onclick = b.aksi; }
  }
  aturPesanPin('');
}
function aturPesanPin(t) {
  const el = $('#pin-pesan');
  if (pin.sibuk) el.innerHTML = '<div class="spinner"></div>';
  else el.textContent = t;
  titik.forEach((b, i) => b.classList.toggle('on', i < pin.nilai.length));
  $('#pin-dots').classList.toggle('err', !!t && !pin.sibuk);
}
async function tekanPin(d) {
  if (layar !== 'scr-pin' || pin.sibuk || pin.nilai.length >= 6 || !$('#dlg').hidden) return;
  pin.nilai += d;
  aturPesanPin('');
  if (pin.nilai.length < 6) return;
  const cfg = pin.cfg;
  const nilai = pin.nilai;
  pin.sibuk = true;
  aturPesanPin('');
  let galat = null;
  try { galat = await cfg.selesai(nilai); } catch (e) { galat = pesanUmum(e); }
  if (pin.cfg !== cfg) return; // sudah pindah ke tahap lain
  pin.sibuk = false;
  pin.nilai = '';
  if (galat && navigator.vibrate) navigator.vibrate(120);
  aturPesanPin(galat || '');
}
function hapusPin() {
  if (pin.sibuk || !pin.nilai) return;
  pin.nilai = pin.nilai.slice(0, -1);
  aturPesanPin('');
}
document.querySelectorAll('#keypad [data-d]').forEach((b) => { b.onclick = () => tekanPin(b.dataset.d); });
$('#pin-hapus').onclick = hapusPin;
$('#pin-kembali').onclick = kembali;
document.addEventListener('keydown', (e) => {
  if (layar !== 'scr-pin') return;
  if (/^[0-9]$/.test(e.key)) tekanPin(e.key);
  else if (e.key === 'Backspace') hapusPin();
});

// ------------------------------------------------ Alur PIN & pemulihan ---
function alurBuatPin(mode) { // 'awal' | 'pulih'
  modePin = mode === 'awal' ? 'buat' : 'pulih';
  const bar = mode === 'pulih' ? 'Atur PIN Baru' : null;
  const tahapBuat = () => papanPin({
    bar,
    judul: mode === 'awal' ? 'Buat PIN 6 digit' : 'Buat PIN baru',
    ket: 'PIN digunakan untuk membuka CATATANKU.',
    selesai: async (p) => {
      if (K.pinLemah(p)) return 'PIN terlalu mudah ditebak. Gunakan kombinasi lain.';
      tahapKonfirmasi(p);
      return null;
    },
  });
  const tahapKonfirmasi = (pertama) => papanPin({
    bar,
    judul: 'Masukkan ulang PIN',
    ket: 'Untuk konfirmasi.',
    selesai: async (p) => {
      if (p !== pertama) {
        pesan('PIN tidak sama. Silakan ulangi.', true);
        tahapBuat();
        return null;
      }
      if (mode === 'awal') {
        try {
          const { dek, kode } = await brankasBuat(p);
          S.dek = dek;
          tampilkanKode(kode);
          return null;
        } catch (e) {
          return 'Gagal menyimpan PIN. ' + pesanUmum(e);
        }
      }
      await brankasGantiPin(S.dekPulih, p);
      resetGagal();
      const dek = S.dekPulih;
      S.dekPulih = null;
      pesan('PIN baru berhasil disimpan.');
      await terbuka(dek);
      return null;
    },
  });
  tampil('scr-pin');
  tahapBuat();
}

function tampilkanKode(kode) {
  $('#kode-teks').textContent = kode;
  $('#kode-cek').checked = false;
  $('#kode-lanjut').disabled = true;
  tampil('scr-kode');
}
$('#kode-cek').onchange = (e) => { $('#kode-lanjut').disabled = !e.target.checked; };
$('#kode-salin').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('#kode-teks').textContent);
    pesan('Kode pemulihan disalin.');
  } catch {
    pesan('Tidak dapat menyalin. Tulis kode secara manual.', true);
  }
};
$('#kode-lanjut').onclick = async () => {
  $('#kode-teks').textContent = '';
  pesan('Selamat datang di CATATANKU.');
  await terbuka(S.dek);
};

function tampilKunci() {
  modePin = 'kunci';
  tampil('scr-pin');
  papanPin({
    judul: 'Masukkan PIN',
    ket: S.email,
    bawah1: { teks: 'Lupa PIN?', aksi: () => { $('#pulih-kode').value = ''; buka('scr-pulih'); } },
    bawah2: {
      teks: 'Keluar dari akun',
      aksi: async () => {
        if (await dialog({ judul: 'Keluar dari akun?', isi: 'Anda perlu masuk kembali dengan email dan kata sandi.', ok: 'KELUAR' })) {
          signOut(auth);
        }
      },
    },
    selesai: async (p) => {
      const terkunci = sisaKunci();
      if (terkunci) { pesan(terkunci, true); return terkunci; }
      try {
        const dek = await brankasBuka(p, 'pin');
        resetGagal();
        await terbuka(dek);
        return null;
      } catch (e) {
        const g = e instanceof K.RahasiaSalah ? catatGagal('PIN salah.') : pesanUmum(e);
        pesan(g, true);
        return g;
      }
    },
  });
}

$('#pulih-lanjut').onclick = async () => {
  const kode = $('#pulih-kode').value;
  const terkunci = sisaKunci();
  if (terkunci) return pesan(terkunci, true);
  if (K.normalisasiKode(kode).length !== 20) return pesan('Kode pemulihan harus 20 karakter.', true);
  const btn = $('#pulih-lanjut');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    S.dekPulih = await brankasBuka(kode, 'pulih');
    resetGagal();
    alurBuatPin('pulih');
  } catch (e) {
    pesan(e instanceof K.RahasiaSalah ? catatGagal('Kode pemulihan salah.') : pesanUmum(e), true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'LANJUTKAN';
  }
};

function alurGantiPin() {
  modePin = 'ganti';
  const bar = 'Ganti PIN';
  const lama = () => papanPin({
    bar, judul: 'Masukkan PIN lama',
    selesai: async (p) => {
      const terkunci = sisaKunci();
      if (terkunci) return terkunci;
      try {
        K.hapus(await brankasBuka(p, 'pin'));
        resetGagal();
        baru();
        return null;
      } catch (e) {
        return e instanceof K.RahasiaSalah ? catatGagal('PIN lama salah.') : pesanUmum(e);
      }
    },
  });
  const baru = () => papanPin({
    bar, judul: 'Masukkan PIN baru', ket: '6 digit angka',
    selesai: async (p) => {
      if (K.pinLemah(p)) return 'PIN terlalu mudah ditebak. Gunakan kombinasi lain.';
      konfirmasi(p);
      return null;
    },
  });
  const konfirmasi = (pertama) => papanPin({
    bar, judul: 'Ulangi PIN baru', ket: 'Untuk konfirmasi',
    selesai: async (p) => {
      if (p !== pertama) { pesan('PIN tidak sama. Silakan ulangi.', true); baru(); return null; }
      await brankasGantiPin(S.dek, p);
      pesan('PIN berhasil diganti.');
      kembali();
      return null;
    },
  });
  buka('scr-pin');
  lama();
}

// ------------------------------------------------------- Buka & kunci ---
async function terbuka(dek) {
  S.dek = dek;
  S.kunci = await K.kunciAes(dek);
  S.tahap = 'terbuka';
  S.dimuat = false;
  S.galatDaftar = false;
  const seq = ++S.seq;
  S.unsub = onSnapshot(query(kolCatatan(), orderBy('updatedAt', 'desc')), async (snap) => {
    const hasil = [];
    for (const d of snap.docs) hasil.push(await uraikan(d.id, d.data()));
    if (seq !== S.seq) return;
    S.catatan = hasil;
    S.dimuat = true;
    S.galatDaftar = false;
    gambarDaftar();
    if (layar === 'scr-detail') gambarDetail();
  }, (e) => {
    console.error(e);
    S.galatDaftar = true;
    gambarDaftar();
  });
  tampilBeranda();
}

function bersihkan() {
  if (S.unsub) S.unsub();
  S.unsub = null;
  S.seq++;
  K.hapus(S.dek); K.hapus(S.dekPulih);
  S.dek = S.dekPulih = S.kunci = null;
  S.catatan = [];
  S.cache.clear();
  S.idAktif = null;
  S.dimuat = false;
}

function kunciAplikasi() {
  if (S.tahap !== 'terbuka') return;
  bersihkan();
  S.tahap = 'terkunci';
  tampilKunci();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { S.ditinggal ??= Date.now(); return; }
  const t = S.ditinggal;
  S.ditinggal = null;
  if (t && Date.now() - t >= 60000) kunciAplikasi();
});

// ------------------------------------------------------------ Catatan ---
async function uraikan(id, d) {
  const ts = d.updatedAt instanceof Timestamp ? d.updatedAt : Timestamp.now();
  const versi = `${ts.seconds}:${ts.nanoseconds}`;
  const c = S.cache.get(id);
  if (c && c.versi === versi) return c.catatan;
  let catatan;
  try {
    catatan = {
      id,
      judul: await K.dekripsiTeks(S.kunci, d.t, aadCatatan(id, 't')),
      isi: await K.dekripsiTeks(S.kunci, d.b, aadCatatan(id, 'b')),
      dibuat: d.createdAt instanceof Timestamp ? d.createdAt : ts,
      diperbarui: ts,
    };
  } catch {
    catatan = {
      id, judul: '(Catatan tidak dapat dibuka)',
      isi: 'Data catatan ini rusak atau tidak dapat didekripsi.',
      dibuat: ts, diperbarui: ts, rusak: true,
    };
  }
  S.cache.set(id, { versi, catatan });
  return catatan;
}

function tampilBeranda() {
  modePin = '';
  tampil('scr-beranda');
  gambarDaftar();
}

function gambarDaftar() {
  const ul = $('#list');
  const kosong = $('#kosong');
  ul.replaceChildren();
  const tampilKosong = (t) => { kosong.textContent = t; kosong.hidden = false; };
  kosong.hidden = true;
  if (S.galatDaftar) return tampilKosong('Gagal memuat catatan. Periksa koneksi internet.');
  if (!S.dimuat) return tampilKosong('Memuat catatan...');
  if (!S.catatan.length) return tampilKosong('Belum ada catatan.\nKetuk tombol + untuk menambah.');
  const k = S.cari.trim().toLowerCase();
  const daftar = k
    ? S.catatan.filter((n) => n.judul.toLowerCase().includes(k) || n.isi.toLowerCase().includes(k))
    : S.catatan;
  if (!daftar.length) return tampilKosong('Catatan tidak ditemukan.');
  for (const n of daftar) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'row';
    const span = document.createElement('span');
    span.textContent = n.judul;
    if (n.rusak) span.className = 'rusak';
    b.append(span);
    b.insertAdjacentHTML('beforeend', svg('panah'));
    b.onclick = () => bukaDetail(n.id);
    li.append(b);
    ul.append(li);
  }
}

$('#cari').oninput = (e) => {
  S.cari = e.target.value;
  $('#cari-hapus').hidden = !S.cari;
  gambarDaftar();
};
$('#cari-hapus').onclick = () => {
  $('#cari').value = '';
  S.cari = '';
  $('#cari-hapus').hidden = true;
  gambarDaftar();
};

function bukaDetail(id) {
  S.idAktif = id;
  buka('scr-detail');
  gambarDetail();
}

function gambarDetail() {
  if (!S.idAktif) return;
  const n = S.catatan.find((c) => c.id === S.idAktif);
  if (!n) { // dihapus dari perangkat lain
    S.idAktif = null;
    if (layar === 'scr-detail') kembali();
    return;
  }
  $('#det-judul').textContent = n.judul;
  $('#det-tgl').textContent = 'Diperbarui ' + formatTanggal(n.diperbarui.toDate());
  const isi = $('#det-isi');
  if (n.isi) { tampilkanDenganTautan(isi, n.isi); isi.classList.remove('muted'); }
  else { isi.textContent = '(Tidak ada isi)'; isi.classList.add('muted'); }
  $('#det-edit').disabled = !!n.rusak;
}

$('#det-edit').onclick = () => {
  const n = S.catatan.find((c) => c.id === S.idAktif);
  if (n) bukaEditor(n);
};
$('#det-hapus').onclick = async () => {
  const n = S.catatan.find((c) => c.id === S.idAktif);
  if (!n) return;
  const ya = await dialog({ judul: 'Hapus catatan?', isi: `"${n.judul}" akan dihapus permanen.`, ok: 'HAPUS', bahaya: true });
  if (!ya) return;
  S.idAktif = null;
  S.cache.delete(n.id);
  deleteDoc(doc(kolCatatan(), n.id)).catch((e) => pesan('Gagal menghapus catatan di server: ' + e.message, true));
  pesan('Catatan berhasil dihapus.');
  kembali();
};

// ------------------------------------------------------------- Editor ---
const editor = { catatan: null, keDetail: false, awalJudul: '', awalIsi: '' };
const editorBerubah = () => $('#ed-judul').value !== editor.awalJudul || $('#ed-isi').value !== editor.awalIsi;

function bukaEditor(catatan) {
  editor.catatan = catatan;
  editor.keDetail = !!catatan;
  editor.awalJudul = catatan ? catatan.judul : '';
  editor.awalIsi = catatan ? catatan.isi : '';
  $('#ed-bar').textContent = catatan ? 'Edit Catatan' : 'Tambah Catatan';
  $('#ed-judul').value = editor.awalJudul;
  $('#ed-isi').value = editor.awalIsi;
  buka('scr-editor');
  if (!catatan) setTimeout(() => $('#ed-judul').focus(), 50);
}

$('#fab').onclick = () => bukaEditor(null);

$('#ed-simpan').onclick = async () => {
  const judul = $('#ed-judul').value.trim();
  const isi = $('#ed-isi').value;
  if (!judul && !isi.trim()) return pesan('Catatan masih kosong.', true);
  const btn = $('#ed-simpan');
  btn.disabled = true;
  try {
    const lama = editor.catatan;
    const ref = lama ? doc(kolCatatan(), lama.id) : doc(kolCatatan());
    const t = await K.enkripsiTeks(S.kunci, judul || 'Tanpa judul', aadCatatan(ref.id, 't'));
    const b = await K.enkripsiTeks(S.kunci, isi, aadCatatan(ref.id, 'b'));
    if (b.length >= 1000000) throw new Error('Catatan terlalu panjang.');
    const sekarang = Timestamp.now();
    // Tidak menunggu server: tersimpan lokal dulu, disinkronkan otomatis.
    setDoc(ref, { v: 1, t, b, createdAt: lama ? lama.dibuat : sekarang, updatedAt: sekarang })
      .catch((e) => pesan('Gagal menyinkronkan catatan ke server: ' + e.message, true));
    pesan('Catatan berhasil disimpan.');
    editor.awalJudul = $('#ed-judul').value;
    editor.awalIsi = $('#ed-isi').value;
    kembali();
  } catch (e) {
    pesan('Gagal menyimpan catatan: ' + e.message, true);
  } finally {
    btn.disabled = false;
  }
};

// -------------------------------------------------- Tombol kembali HP ---
window.addEventListener('popstate', async () => {
  if (!$('#dlg').hidden) $('#dlg-batal').click();
  switch (layar) {
    case 'scr-editor':
      if (editorBerubah()) {
        history.pushState({ l: 'scr-editor' }, '');
        const buang = await dialog({
          judul: 'Batalkan perubahan?', isi: 'Perubahan yang belum disimpan akan hilang.',
          ok: 'BUANG', batal: 'LANJUT MENULIS',
        });
        if (buang) {
          editor.awalJudul = $('#ed-judul').value;
          editor.awalIsi = $('#ed-isi').value;
          kembali();
        }
        return;
      }
      if (editor.keDetail && S.idAktif) { tampil('scr-detail'); gambarDetail(); } else tampilBeranda();
      return;
    case 'scr-detail':
      S.idAktif = null;
      tampilBeranda();
      return;
    case 'scr-pulih':
      tampilKunci();
      return;
    case 'scr-pin':
      if (modePin === 'ganti') tampilBeranda();
      else if (modePin === 'pulih') { K.hapus(S.dekPulih); S.dekPulih = null; tampilKunci(); }
      return;
    default:
  }
});

// ------------------------------------------------------- Pengaturan ---
$('#btn-menu').onclick = (e) => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', (e) => {
  if (!$('#menu').hidden && !$('#menu').contains(e.target)) $('#menu').hidden = true;
});
$('#menu-pin').onclick = () => { $('#menu').hidden = true; alurGantiPin(); };
$('#menu-info').onclick = () => {
  $('#menu').hidden = true;
  const box = document.createElement('div');
  const p = (t, gaya = '') => {
    const el = document.createElement('p');
    el.textContent = t;
    el.style.cssText = 'margin:0 0 10px;' + gaya;
    box.append(el);
  };
  p('Versi 1.0.0 (web)', 'color:var(--teks2)');
  p('Aplikasi catatan pribadi sederhana dengan penyimpanan online Firebase dan sinkronisasi otomatis.');
  p('• Judul dan isi catatan dienkripsi AES-256-GCM di perangkat sebelum dikirim ke server.\n'
    + '• PIN tidak pernah disimpan; kunci diturunkan dengan PBKDF2-HMAC-SHA256.\n'
    + '• Catatan dapat dibuka tanpa internet dan disinkronkan saat online.',
  'white-space:pre-line;font-size:14px;color:var(--teks2)');
  p('Akun: ' + S.email, 'font-size:14px;color:var(--teks2)');
  dialog({ judul: 'CATATANKU', isi: box, ok: 'TUTUP', batal: null });
};
$('#menu-keluar').onclick = async () => {
  $('#menu').hidden = true;
  const ya = await dialog({
    judul: 'Keluar aplikasi?',
    isi: 'Aplikasi akan dikunci. Catatan tetap tersimpan.',
    ok: 'KELUAR',
  });
  if (!ya) return;
  kunciAplikasi();
  window.close(); // hanya berlaku bila dibuka sebagai aplikasi terpasang
};

// ------------------------------------------------------- Masuk / Daftar ---
let modeDaftar = false;
function aturModeAuth() {
  $('#auth-sub').textContent = modeDaftar ? 'Buat akun baru' : 'Masuk ke akun Anda';
  $('#auth-kirim').textContent = modeDaftar ? 'DAFTAR' : 'MASUK';
  $('#auth-ganti').textContent = modeDaftar ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
  $('#auth-sandi2').hidden = !modeDaftar;
  $('#auth-lupa').hidden = modeDaftar;
  $('#auth-sandi').autocomplete = modeDaftar ? 'new-password' : 'current-password';
}
$('#auth-ganti').onclick = () => { modeDaftar = !modeDaftar; aturModeAuth(); };
$('#auth-mata').onclick = () => {
  const t = $('#auth-sandi').type === 'password' ? 'text' : 'password';
  $('#auth-sandi').type = t;
  $('#auth-sandi2').type = t;
};

function pesanAuth(e) {
  switch ((e.code || '').replace('auth/', '')) {
    case 'invalid-email': return 'Format email tidak valid.';
    case 'user-disabled': return 'Akun ini dinonaktifkan.';
    case 'user-not-found':
    case 'wrong-password':
    case 'invalid-credential':
    case 'invalid-login-credentials': return 'Email atau kata sandi salah.';
    case 'email-already-in-use': return 'Email sudah terdaftar. Silakan masuk.';
    case 'weak-password': return 'Kata sandi terlalu lemah (minimal 6 karakter).';
    case 'network-request-failed': return 'Tidak ada koneksi internet.';
    case 'too-many-requests': return 'Terlalu banyak percobaan. Coba lagi nanti.';
    case 'operation-not-allowed': return 'Login email belum diaktifkan di Firebase Console.';
    case 'unauthorized-domain': return 'Domain ini belum diizinkan di Firebase Authentication.';
    default: return 'Gagal: ' + (e.message || e.code);
  }
}

$('#auth-form').onsubmit = async (ev) => {
  ev.preventDefault();
  const email = $('#auth-email').value.trim();
  const sandi = $('#auth-sandi').value;
  if (!email.includes('@')) return pesan('Masukkan email yang valid.', true);
  if (sandi.length < 6) return pesan('Kata sandi minimal 6 karakter.', true);
  if (modeDaftar && sandi !== $('#auth-sandi2').value) return pesan('Kata sandi tidak sama.', true);
  const btn = $('#auth-kirim');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    if (modeDaftar) await createUserWithEmailAndPassword(auth, email, sandi);
    else await signInWithEmailAndPassword(auth, email, sandi);
    $('#auth-sandi').value = '';
    $('#auth-sandi2').value = '';
  } catch (e) {
    pesan(pesanAuth(e), true);
  } finally {
    btn.disabled = false;
    aturModeAuth();
  }
};

$('#auth-lupa').onclick = async () => {
  const email = $('#auth-email').value.trim();
  if (!email.includes('@')) return pesan('Isi email Anda terlebih dahulu.', true);
  try {
    await sendPasswordResetEmail(auth, email);
    pesan('Tautan atur ulang kata sandi telah dikirim ke ' + email + '.');
  } catch (e) {
    pesan(pesanAuth(e), true);
  }
};

// ------------------------------------------------------------ Mulai ---
async function periksaBrankas() {
  S.tahap = 'memuat';
  tampil('scr-memuat');
  try {
    const snap = await getDoc(refUser());
    const d = snap.data();
    if (d && typeof d.pinWrap === 'string') {
      S.tahap = 'terkunci';
      tampilKunci();
    } else {
      S.tahap = 'buatPin';
      alurBuatPin('awal');
    }
  } catch (e) {
    console.error(e);
    S.tahap = 'galat';
    $('#galat-pesan').textContent = String(e.code || '').includes('permission')
      ? 'Akses ditolak oleh server. Pastikan aturan Firestore (firestore.rules) sudah dipasang.'
      : 'Tidak dapat memuat data akun. Periksa koneksi internet lalu coba lagi.';
    tampil('scr-galat');
  }
}
$('#galat-ulang').onclick = periksaBrankas;

onAuthStateChanged(auth, async (user) => {
  if (user && user.uid === S.uid && S.tahap !== 'galat') return;
  bersihkan();
  S.uid = user ? user.uid : null;
  S.email = user ? user.email || '' : '';
  if (!user) {
    S.tahap = 'masuk';
    modeDaftar = false;
    aturModeAuth();
    tampil('scr-auth');
    return;
  }
  await periksaBrankas();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
