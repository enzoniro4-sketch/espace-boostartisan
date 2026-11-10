/* BoostArtisan — le programme de fond de la page de l'espace (chantier 28 « espace fini », 10 nov. 2026).
   Il ne garde QUE la page elle-même : aucune donnée de client, rien de ce qui vient du tableau ou du guichet.
   RÉSEAU D'ABORD : chaque ouverture demande la page en ligne, donc jamais une ancienne version à l'écran après une publication.
   La page gardée ne sert que sans réseau, ou si le réseau met plus de 2,5 s (la page neuve est alors rangée pour la suite).
   ⚠ Ne pas changer le nom V sans raison : un nom neuf recharge d'office les pages ouvertes (c'est ce qui fait passer l'ancienne page v1 à celle-ci). */
var V = 'espace-v2', DELAI = 2500;
self.addEventListener('install', function (e) { e.waitUntil(self.skipWaiting()); });
/* Un ancien programme de fond servait la page gardée d'abord : les pages ouvertes avec lui sont rechargées une fois, tout de suite.
   Jamais attendu dans « activate » : la page rechargée a besoin de ce programme ACTIF pour être servie (attendre ici = tout bloquer 5 minutes). */
function rechargerLesPages() {
  self.clients.matchAll({ type: 'window' }).then(function (cs) {
    cs.forEach(function (c) {
      try { var u = String(c.url || ''), i = u.indexOf('#'); if (i < 0 || !/[#&]j=/.test(u.slice(i))) return; c.navigate(u.slice(0, i).replace(/\?.*$/, '') + '?maj=' + Date.now() + u.slice(i)).catch(function () { }); } catch (x) { }
    });
  }).catch(function () { });
}
var AVANT = false;
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    var vieux = ks.filter(function (k) { return k !== V; }); AVANT = vieux.length > 0;
    return Promise.all(vieux.map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    caches.open(V).then(function (c) { return c.add(new Request('/index.html', { cache: 'reload' })); }).catch(function () { });   /* la page gardée pour le hors réseau : sans attendre */
    if (AVANT) setTimeout(rechargerLesPages, 50);
  }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || r.mode !== 'navigate') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  var ouvert = caches.open(V);
  var frais = ouvert.then(function (c) { return fetch(new Request('/index.html', { cache: 'no-store' })).then(function (rep) { if (rep && rep.ok) return c.put('/index.html', rep.clone()).catch(function () { }).then(function () { return rep; }); throw new Error('http'); }); });
  var garde = ouvert.then(function (c) { return c.match('/index.html'); });
  var secours = frais.catch(function () { return garde.then(function (g) { if (g) return g; throw new Error('hors réseau'); }); });
  var tard = new Promise(function (res) { setTimeout(function () { garde.then(function (g) { if (g) res(g); }); }, DELAI); });
  e.respondWith(Promise.race([secours, tard]));
  e.waitUntil(frais.catch(function () { }));   /* même si la page gardée a été servie (réseau lent), la neuve finit d'arriver et est rangée */
});
