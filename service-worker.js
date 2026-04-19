const CACHE_NAME = 'routine-cache-v3';

const urlsToCache = [
  './404.html',
  './index.html',
  './jour_lundi.html',
  './jour_mardi.html',
  './jour_mercredi.html',
  './jour_jeudi.html',
  './jour_vendredi.html',
  './jour_samedi.html',
  './jour_dimanche.html',
  './muscu_lundi.html',
  './muscu_mardi.html',
  './muscu_vendredi.html',
  './muscu_samedi.html',
  './soin_lundi.html',
  './soin_mardi.html',
  './soin_mercredi.html',
  './soin_jeudi.html',
  './soin_vendredi.html',
  './soin_samedi.html',
  './soin_dimanche.html',
  './style.css',
  './muscu.js',
  './manifest.json',
  'icons/icon-512.png',
  'icons/icon-192.png'
];

// 🔧 Installation
self.addEventListener('install', event => {
  self.skipWaiting(); // force la mise à jour immédiate

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 🔧 Activation (supprime anciens caches)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim(); // prend le contrôle direct
});

// 🔧 Fetch (réseau d'abord, puis cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
