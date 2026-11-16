// Service worker CATATANKU: membuat tampilan aplikasi tetap bisa dibuka saat offline.
// Data catatan TIDAK di-cache di sini (ditangani penyimpanan offline Firestore).
const CACHE = 'catatanku-v1';
const SHELL = ['./', './index.html', './app.js', './kripto.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    if (u.pathname.startsWith('/__/')) return; // URL khusus Firebase
    // Utamakan jaringan (agar selalu versi terbaru), cadangan dari cache.
    e.respondWith(fetch(r).then((res) => {
      if (res.ok) { const salin = res.clone(); caches.open(CACHE).then((c) => c.put(r, salin)); }
      return res;
    }).catch(() => caches.match(r).then((m) => m || caches.match('./index.html'))));
  } else if (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) {
    // Pustaka Firebase berversi tetap: ambil dari cache bila ada.
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => {
      if (res.ok) { const salin = res.clone(); caches.open(CACHE).then((c) => c.put(r, salin)); }
      return res;
    })));
  }
});
