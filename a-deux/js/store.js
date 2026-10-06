/* =========================================================================
   À deux · stockage

   localStorage, rien d'autre. Aucun compte, aucun serveur, aucune requête :
   ce que deux personnes se disent ne sort pas du téléphone.

   Toute donnée relue repasse par `COEUR.normaliserProfil`, qui est pur et
   testé sous Node. Ce fichier ne décide rien, il range et il relit.
   ========================================================================= */

(function (racine) {

  const C = racine.COEUR;

  const CLES = { moi: 'ad.moi', autre: 'ad.autre', idees: 'ad.idees' };

  /* Les noms par défaut sont visibles tels quels sur l'accueil tant que rien
     n'a été saisi. « L'autre » plutôt qu'un prénom inventé : l'app ne fait
     semblant de connaître personne. */
  const DEFAUTS = { moi: 'Moi', autre: 'L’autre' };

  function lire(cle, defaut) {
    try {
      const brut = localStorage.getItem(cle);
      return brut === null ? defaut : JSON.parse(brut);
    } catch { return defaut; }
  }

  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; }
    catch { return false; }
  }

  const STORE = {

    /* `qui` vaut 'moi' ou 'autre'. Deux profils, jamais plus : une synchro à
       deux appareils demanderait un serveur, et c'est une autre app. */
    profil(qui) {
      return C.normaliserProfil(lire(CLES[qui], null), DEFAUTS[qui]);
    },

    profils() {
      return { moi: this.profil('moi'), autre: this.profil('autre') };
    },

    /* Renvoie le profil tel qu'il a été RANGÉ, pas tel qu'il a été demandé :
       l'appelant redessine avec ce qui est réellement en mémoire, et un
       secondaire refusé se voit tout de suite à l'écran.

       ⚠️ Renvoie `null` si l'écriture a ÉCHOUÉ. Un navigateur qui bloque les
       données de site fait lever `setItem`, et sans ce retour l'app annonçait
       « Moments de qualité » alors que rien n'était rangé : l'appui ne
       changeait rien, la coche restait vide, et aucun mot ne le disait.
       Mesuré, pas supposé. */
    enregistrerProfil(qui, brut) {
      const propre = C.normaliserProfil(brut, DEFAUTS[qui]);
      return ecrire(CLES[qui], propre) ? propre : null;
    },

    /* Rien n'a encore été choisi : l'accueil le dit autrement. */
    vierge() {
      const p = this.profils();
      return !C.profilComplet(p.moi) && !C.profilComplet(p.autre);
    },

    /* ------------------------------------------------------------ idées */

    /* Un identifiant qui ne dépend pas de l'horloge seule : deux idées
       ajoutées dans la même milliseconde auraient sinon le même, et la
       seconde écraserait la première. Repris de love-money. */
    identifiant() {
      return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    },

    idees() {
      const brut = lire(CLES.idees, []);
      return Array.isArray(brut) ? brut.map(C.normaliserIdee).filter(Boolean) : [];
    },

    /* Les plus récentes d'abord : c'est l'ordre de la liste et celui des
       trois montrées sur l'accueil. On range donc en tête. */
    ajouterIdee(texte, palier) {
      const propre = C.normaliserIdee({ id: this.identifiant(), texte, palier });
      if (!propre) return null;
      const toutes = this.idees();
      toutes.unshift(propre);
      return ecrire(CLES.idees, toutes) ? propre : null;
    },

    modifierIdee(id, texte, palier) {
      const toutes = this.idees();
      const i = toutes.findIndex(x => x.id === id);
      if (i < 0) return null;
      const propre = C.normaliserIdee({ id, texte, palier });
      if (!propre) return null;
      toutes[i] = propre;
      return ecrire(CLES.idees, toutes) ? propre : null;
    },

    /* Renvoie `false` si rien n'a été écrit : sans ce retour, une suppression
       refusée par le navigateur laisserait l'idée à l'écran sans un mot. */
    supprimerIdee(id) {
      const restantes = this.idees().filter(x => x.id !== id);
      return ecrire(CLES.idees, restantes);
    },

    effacerTout() {
      try {
        localStorage.removeItem(CLES.moi);
        localStorage.removeItem(CLES.autre);
        return true;
      } catch { return false; }
    }
  };

  racine.STORE = STORE;

})(typeof globalThis !== 'undefined' ? globalThis : this);
