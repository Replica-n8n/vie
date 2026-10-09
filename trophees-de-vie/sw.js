// Service worker de Trophées de vie : la page s'ouvre hors ligne une fois installée.
// VERSION suit le ?v= d'index.html et de js/app.js : les monter ensemble.
const VERSION = 16;

const CACHE = `trophees-de-vie:app:v${VERSION}`;
const PREFIXE = 'trophees-de-vie:app:';

// Chaque fichier est demandé avec ?v= dès l'installation : sans ça, un service worker
// installé juste après une mise en ligne range l'ANCIEN fichier que GitHub Pages sert
// encore dix minutes, et la page reste vieille pour de bon.
const FICHIERS = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/coeur.js', 'js/stockage.js', 'js/config/vie.js', 'js/config/domaines.js',
  'polices/bricolage.woff2', 'polices/atkinson-400.woff2', 'polices/atkinson-700.woff2', 'polices/atkinson-400-italique.woff2',
  'manifest.webmanifest', 'icone.svg', 'icons/icone-192.png', 'icons/icone-512.png', 'icons/icone-maskable-512.png',
].map((chemin) => `${chemin}?v=${VERSION}`);

self.addEventListener('install', (evenement) => {
  evenement.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(FICHIERS.map(async (adresse) => {
      const reponse = await fetch(adresse, { cache: 'reload' });
      if (!reponse.ok) throw new Error(`${adresse} : ${reponse.status}`);
      await cache.put(adresse, reponse);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil((async () => {
    // Toutes nos apps partagent la même origine : ne supprimer QUE ses propres caches.
    const noms = await caches.keys();
    await Promise.all(noms.filter((nom) => nom.startsWith(PREFIXE) && nom !== CACHE).map((nom) => caches.delete(nom)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;
  const adresse = new URL(requete.url);
  if (adresse.origin !== self.location.origin) return;

  // La navigation passe par le réseau, sans cache intermédiaire. Hors ligne, la page rangée.
  if (requete.mode === 'navigate') {
    evenement.respondWith((async () => {
      try {
        return await fetch(requete.url, { cache: 'no-cache' });
      } catch {
        return (await caches.open(CACHE)).match(`index.html?v=${VERSION}`);
      }
    })());
    return;
  }

  evenement.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const exact = await cache.match(requete);
    if (exact) return exact;
    // Une page plus récente que ce service worker demande « fichier?v=17 » : il ne faut
    // surtout pas lui rendre le fichier de la version 16. Le réseau d'abord, et le
    // fichier rangé seulement si le réseau manque.
    const autreVersion = adresse.searchParams.has('v') && adresse.searchParams.get('v') !== String(VERSION);
    if (!autreVersion) {
      const proche = await cache.match(requete, { ignoreSearch: true });
      if (proche) return proche;
    }
    try {
      return await fetch(requete);
    } catch (erreur) {
      const secours = await cache.match(requete, { ignoreSearch: true });
      if (secours) return secours;
      throw erreur;
    }
  })());
});
