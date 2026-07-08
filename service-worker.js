const CACHE_NAME = 'arfutility-v9';
const ASSETS_TO_CACHE = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'manifest.json',
  'Logo.png/Logo.png'
];

// Install Service Worker dan lakukan Caching Asset Utama
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Memaksa service worker baru untuk aktif segera
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivasi dan Pembersihan Cache Lama jika ada Update
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Mengambil kendali atas semua client segera
    })
  );
});

// Strategi Network First falling back to Cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});