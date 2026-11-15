// Service worker de Repas : l'app s'ouvre hors ligne une fois installée.
// VERSION suit le ?v= d'index.html et de js/app.js : les monter ensemble (voir CLAUDE.md).
const VERSION = 1;

const CACHE = `repas:app:v${VERSION}`;
const PREFIXE = 'repas:app:';

// Chaque fichier est demandé avec ?v= dès l'installation : sans ça, un service worker installé
// juste après une mise en ligne range l'ANCIEN fichier que GitHub Pages sert encore dix minutes.
const FICHIERS = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/coeur.js',
  'polices/big-shoulders-900.woff2', 'polices/roboto-flex.woff2',
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

  // La page et le plan de la semaine passent par le réseau : le plan change chaque semaine.
  // Hors ligne, la dernière copie rangée.
  const plan = adresse.pathname.endsWith('/plan.json');
  if (requete.mode === 'navigate' || plan) {
    evenement.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const reponse = await fetch(requete.url, { cache: 'no-cache' });
        if (plan && reponse.ok) await cache.put('plan.json', reponse.clone());
        return reponse;
      } catch {
        return (await cache.match(plan ? 'plan.json' : `index.html?v=${VERSION}`)) || Response.error();
      }
    })());
    return;
  }

  evenement.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const exact = await cache.match(requete);
    if (exact) return exact;
    // Une page plus récente demande « fichier?v=2 » : ne surtout pas lui rendre la version 1.
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
