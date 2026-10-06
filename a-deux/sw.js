/* =========================================================================
   À deux · service worker

   LE NUMÉRO DE VERSION NE VIT QU'ICI.
   Changer VERSION suffit à invalider tout le cache : le nom du cache en
   dérive et l'ancien est supprimé à l'activation. Aucun paramètre ?v=... à
   répercuter dans le HTML, le CSS ou les modules.
   ========================================================================= */

const VERSION = '0.2.0';
/* Toutes nos apps partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage. Le nom porte l'app et sa portée, et l'activation ne supprime
   QUE ces caches-là : avant, chaque mise à jour effaçait le hors ligne des
   autres apps (GVT, La Cour, les jeux...). */
const PREFIXE = 'adeux:' + new URL(self.registration.scope).pathname + ':';
const SHELL = PREFIXE + VERSION;
const ANCIEN = 'ad-shell-';

const FILES = [
  './',
  './index.html',
  './css/app.css',
  './js/coeur.js',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  /* `cache: 'reload'` est indispensable : sans lui, addAll() passe par le
     cache HTTP du navigateur et peut remplir un cache tout neuf avec les
     ANCIENS fichiers. On obtient un cache nommé 0.2.0 contenant du 0.1.0, et
     une mise à jour qui ne met rien à jour.

     ⚠️ ET ÇA NE SUFFIT PAS : `reload` contourne le cache du TÉLÉPHONE, pas
     celui des serveurs relais de GitHub Pages, qui gardent chaque fichier
     jusqu'à 10 minutes après une publication. Installé dans ces 10 minutes,
     le nouveau service worker rangeait l'ANCIEN fichier dans le cache de la
     NOUVELLE version, et le servait cache d'abord jusqu'à la version
     suivante, sans aucune erreur (vécu sur le Chevalier le 2026-09-17). On
     demande donc chaque fichier avec la VERSION dans son adresse : pour les
     relais c'est une adresse jamais vue, ils vont la chercher à la source.
     On le range sous son nom propre. */
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.all(FILES.map(f =>
        fetch(new Request(f + '?v=' + encodeURIComponent(VERSION), { cache: 'reload' })).then(res => {
          if (!res.ok) throw new Error(f + ' : ' + res.status);
          return c.put(f, res);
        }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => (k.startsWith(PREFIXE) && k !== SHELL) || k.startsWith(ANCIEN))
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  /* Navigation : le réseau d'abord si disponible, sinon la coquille.
     `no-cache` revalide le HTML : Pages le garde 10 minutes en cache HTTP, et
     un ancien index.html pouvait sinon partir avec le nouveau JavaScript. */
  if (req.mode === 'navigate') {
    const coquille = () => caches.open(SHELL).then(c => c.match('./index.html'));
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => res.ok ? res : coquille().then(hit => hit || res))
        .catch(coquille)
    );
    return;
  }

  /* Les URL à paramètre ne sont pas mises en cache : l'app n'en demande
     jamais, mais les outils de contrôle importent `audit.js?t=<horodatage>`
     à chaque passage, et chaque import laisserait une entrée de plus dans un
     cache que rien ne purge avant le changement de VERSION.

     `res.ok` est tout aussi indispensable : sans lui, un 404 finit en cache
     et est resservi indéfiniment, y compris pour un fichier ajouté plus
     tard. */
  const jetable = new URL(req.url).search !== '';

  /* On cherche dans NOTRE cache seulement : un `caches.match` sans nom
     pouvait rendre le fichier d'une autre version ou d'une autre app. */
  e.respondWith(
    caches.open(SHELL).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && !jetable) c.put(req, res.clone()).catch(() => {});
      return res;
    })))
  );
});
