const CACHE_NAME = 'barberpro-v1';
const urlsToCache = [
  './barbearia-saas.html',
  './index.html',
  './style.css',
  './landing.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Cache virou network-first para evitar dores de cabeça em dev,
// mas permitindo loading em slow 3G e PWA prompt installation
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
