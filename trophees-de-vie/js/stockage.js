// Tout ce qui est gardé vit ici, dans IndexedDB, sur l'appareil. Aucun serveur.
//
// Prévu pour une synchronisation future sans rien construire maintenant : chaque
// enregistrement porte un identifiant tiré au hasard, l'instant de sa création et
// de sa dernière modification, et son auteur. Une suppression est une MARQUE
// (`supprimeLe`), jamais un effacement : sinon elle ne pourrait pas se propager.

export const SCHEMA = 1;
export const BASE = 'trophees-de-vie';
export const FORMAT = 'trophees-de-vie';

// magasin → clé
const MAGASINS = { moments: 'id', points: 'mois', photos: 'id', reglages: 'cle' };

/** Un identifiant au hasard. `randomUUID` n'existe pas hors contexte sécurisé. */
export function idUnique() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const octets = crypto.getRandomValues(new Uint8Array(16));
  return [...octets].map((o) => o.toString(16).padStart(2, '0')).join('');
}

const promesse = (requete) => new Promise((ok, ko) => {
  requete.onsuccess = () => ok(requete.result);
  requete.onerror = () => ko(requete.error);
});
const finie = (transaction) => new Promise((ok, ko) => {
  transaction.oncomplete = () => ok();
  transaction.onerror = () => ko(transaction.error);
  transaction.onabort = () => ko(transaction.error);
});

const versTexte = (blob) => new Promise((ok, ko) => {
  const lecteur = new FileReader();
  lecteur.onload = () => ok(lecteur.result);
  lecteur.onerror = () => ko(lecteur.error);
  lecteur.readAsDataURL(blob);
});
const versBlob = async (texte) => (await fetch(texte)).blob();

/**
 * Ouvre la base et rend les quelques gestes dont l'app a besoin.
 * @param {string} nom  le nom de la base ; les essais en ouvrent d'autres pour ne pas toucher aux vraies données
 */
export async function ouvrir(nom = BASE, { maintenant = () => new Date().toISOString() } = {}) {
  const ouverture = indexedDB.open(nom, SCHEMA);
  ouverture.onupgradeneeded = () => {
    const db = ouverture.result;
    for (const [magasin, cle] of Object.entries(MAGASINS)) {
      if (!db.objectStoreNames.contains(magasin)) db.createObjectStore(magasin, { keyPath: cle });
    }
  };
  const db = await promesse(ouverture);
  const magasin = (m, mode = 'readonly') => db.transaction(m, mode).objectStore(m);

  // L'auteur identifie cet appareil. Il est tiré une fois, au premier lancement.
  let auteur = (await promesse(magasin('reglages').get('auteur')))?.valeur;
  if (!auteur) {
    auteur = idUnique();
    await promesse(magasin('reglages', 'readwrite').put({ cle: 'auteur', valeur: auteur }));
  }

  const api = {
    nom,
    auteur,

    /** Tout un magasin, sans ce qui est marqué supprimé. */
    async tout(m, { avecSupprimes = false } = {}) {
      const lignes = await promesse(magasin(m).getAll());
      return avecSupprimes ? lignes : lignes.filter((l) => !l.supprimeLe);
    },

    lire: (m, cle) => promesse(magasin(m).get(cle)).then((l) => l ?? null),

    /** Crée ou remplace un enregistrement, et l'horodate. */
    async ecrire(m, objet) {
      const cle = MAGASINS[m];
      const instant = maintenant();
      const ligne = { ...objet, [cle]: objet[cle] ?? idUnique(), creeLe: objet.creeLe ?? instant, modifieLe: instant, auteur: objet.auteur ?? auteur };
      await promesse(magasin(m, 'readwrite').put(ligne));
      return ligne;
    },

    /** Marque un enregistrement comme supprimé, sans l'effacer. */
    async retirer(m, cle) {
      const ligne = await api.lire(m, cle);
      if (!ligne) return null;
      return api.ecrire(m, { ...ligne, supprimeLe: maintenant() });
    },

    /** Annule une suppression. */
    async remettre(m, cle) {
      const ligne = await api.lire(m, cle);
      if (!ligne) return null;
      return api.ecrire(m, { ...ligne, supprimeLe: null });
    },

    reglage: (cle, defaut = null) => promesse(magasin('reglages').get(cle)).then((l) => l?.valeur ?? defaut),
    regler: (cle, valeur) => promesse(magasin('reglages', 'readwrite').put({ cle, valeur, modifieLe: maintenant() })),

    /** Tout le contenu, photos comprises, sous une forme qui s'écrit dans un fichier. */
    async exporter() {
      const magasins = {};
      for (const m of Object.keys(MAGASINS)) {
        const lignes = await promesse(magasin(m).getAll());
        magasins[m] = m === 'photos'
          ? await Promise.all(lignes.map(async (p) => ({ ...p, donnees: await versTexte(p.donnees) })))
          : lignes;
      }
      return { format: FORMAT, schema: SCHEMA, exporteLe: maintenant(), magasins };
    },

    /**
     * Reprend une sauvegarde. Quand un enregistrement existe des deux côtés, le
     * plus récemment modifié gagne : importer deux fois ne casse rien.
     * @returns {Promise<number>} le nombre d'enregistrements écrits
     */
    async importer(sauvegarde) {
      if (sauvegarde?.format !== FORMAT) throw new Error('Ce fichier n’est pas une sauvegarde de Trophées de vie.');
      if (!(sauvegarde.schema <= SCHEMA)) throw new Error('Cette sauvegarde vient d’une version plus récente de l’app.');
      let ecrits = 0;
      for (const [m, cle] of Object.entries(MAGASINS)) {
        let lignes = sauvegarde.magasins?.[m] ?? [];
        if (m === 'photos') lignes = await Promise.all(lignes.map(async (p) => ({ ...p, donnees: await versBlob(p.donnees) })));
        const actuelles = new Map((await promesse(magasin(m).getAll())).map((l) => [l[cle], l]));
        const transaction = db.transaction(m, 'readwrite');
        for (const ligne of lignes) {
          // l'identité de l'appareil ne s'importe pas
          if (m === 'reglages' && ligne.cle === 'auteur') continue;
          const ici = actuelles.get(ligne[cle]);
          // sans date des deux côtés, on garde ce qui est déjà là
          if (ici && (!ligne.modifieLe || (ici.modifieLe && ici.modifieLe >= ligne.modifieLe))) continue;
          transaction.objectStore(m).put(ligne);
          ecrits += 1;
        }
        await finie(transaction);
      }
      return ecrits;
    },

    fermer: () => db.close(),
  };
  return api;
}

/** Efface une base entière. Sert aux essais, jamais aux vraies données sans le demander. */
export const effacer = (nom) => promesse(indexedDB.deleteDatabase(nom));

/** Demande au navigateur de ne pas purger les données quand la place manque. */
export async function demanderPersistance() {
  if (!navigator.storage?.persist) return false;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}
