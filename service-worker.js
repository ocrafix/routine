self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('routine-cache-v1').then(cache => {
      return cache.addAll([
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
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
