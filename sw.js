const CACHE_NAME = 'cg-2026-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
  // + dodaj ikony i dźwięki, jeżeli chcesz offline audio:
  // './assets/audio/synthwave.mp3',
  // './assets/audio/correct.wav',
  // './assets/audio/wrong.wav',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r=>{
      const copy = r.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
      return r;
    }))
  );
});
