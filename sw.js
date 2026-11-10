/* BoostArtisan — la page de l'espace gardée dans le téléphone (chantier 28, 10 nov. 2026).
   Ce programme de fond ne garde QUE la page elle-même : aucune donnée de client, aucun lien (le lien du client est après le « # », il n'arrive jamais ici).
   La page s'ouvre tout de suite depuis le téléphone, puis se met à jour en arrière-plan pour la prochaine visite. */
var V = 'espace-v1';
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.add(new Request('/index.html', { cache: 'reload' })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;   /* le tableau n'est jamais gardé ici */
  if (r.mode !== 'navigate') return;
  e.respondWith(caches.open(V).then(function (c) {
    return c.match('/index.html').then(function (garde) {
      var frais = fetch(new Request('/index.html', { cache: 'no-store' })).then(function (rep) { if (rep && rep.ok) return c.put('/index.html', rep.clone()).then(function () { return rep; }); return rep; });
      if (garde) { e.waitUntil(frais.catch(function () { })); return garde; }
      return frais;
    });
  }));
});
