/* =========================================================================
   À deux · cœur logique

   Tout ce qui se calcule vit ici, sans DOM ni localStorage, pour que
   `test-coeur.js` puisse l'exercer sous Node. Le rendu est ailleurs.

   Les dates sont des chaînes « AAAA-MM-JJ » et le restent. Une `Date` ne
   sert que le temps d'un calcul, jamais au stockage.
   ========================================================================= */

(function (racine) {

  /* ----------------------------------------------------------- les dates */

  /* `new Date('2026-01-01')` est interprété en UTC : à Montréal cela donne
     le 31 décembre à 19 h, et toute date reconstruite recule d'un jour la
     moitié de l'année. On construit donc composant par composant, en heure
     locale, et on relit de même. Même piège que love-money, même parade. */
  function depuisTexte(texte) {
    const [a, m, j] = texte.split('-').map(Number);
    return new Date(a, m - 1, j);
  }

  function versTexte(date) {
    const deux = n => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + deux(date.getMonth() + 1) + '-' + deux(date.getDate());
  }

  function aujourdHui() { return versTexte(new Date()); }

  /* Nombre de jours entiers entre deux dates. On compare des minuits locaux :
     un changement d'heure ajouterait sinon une heure et ferait tomber un
     arrondi du mauvais côté. */
  const JOUR = 86400000;
  function joursEntre(depuis, jusqu) {
    return Math.round((depuisTexte(jusqu) - depuisTexte(depuis)) / JOUR);
  }

  /* Décaler d'un nombre de mois sans déborder. Le 31 janvier plus un mois
     donnerait le 3 mars, parce que `new Date(2026, 1, 31)` glisse en
     silence : on ramène au dernier jour du mois, comme `ajouterUnAn` le
     fait dans love-money. La règle des six mois de la tranche 3 s'appuiera
     dessus, et elle est testée dès maintenant pour ne pas la découvrir
     cassée ce jour-là. */
  function ajouterMois(texte, nombre) {
    const [a, m, j] = texte.split('-').map(Number);
    const cible = (m - 1) + nombre;
    const annee = a + Math.floor(cible / 12);
    const mois = ((cible % 12) + 12) % 12;
    const dernierJour = new Date(annee, mois + 1, 0).getDate();
    return versTexte(new Date(annee, mois, Math.min(j, dernierJour)));
  }

  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function formaterDate(texte) {
    const [a, m, j] = texte.split('-').map(Number);
    return j + ' ' + MOIS[m - 1] + ' ' + a;
  }

  /* -------------------------------------------------------- les langages */

  /* Les cinq langages de Gary Chapman, nommés et rien de plus. On ne copie
     pas son questionnaire, qui est protégé et dont la validité mesurée est
     faible : l'app ENREGISTRE une réponse, elle ne la déduit pas. */
  const LANGAGES = [
    { id: 'paroles',  nom: 'Paroles valorisantes', court: 'Paroles' },
    { id: 'moments',  nom: 'Moments de qualité',   court: 'Moments' },
    { id: 'cadeaux',  nom: 'Cadeaux',              court: 'Cadeaux' },
    { id: 'services', nom: 'Services rendus',      court: 'Services' },
    { id: 'toucher',  nom: 'Toucher physique',     court: 'Toucher' }
  ];

  const PAR_ID = {};
  LANGAGES.forEach(l => { PAR_ID[l.id] = l; });

  function estLangage(id) { return Object.prototype.hasOwnProperty.call(PAR_ID, id); }
  function nomLangage(id) { return estLangage(id) ? PAR_ID[id].nom : ''; }
  function nomCourt(id) { return estLangage(id) ? PAR_ID[id].court : ''; }

  /* --------------------------------------------------------- les profils */

  const NOM_MAX = 18;

  /* Un profil relu peut venir d'une version plus ancienne, ou d'un
     localStorage édité à la main. Tout ce qui n'est pas reconnu redevient
     `null` plutôt que de traverser l'app et de casser un filtre bien plus
     loin, sans rapport apparent avec sa cause.

     Le secondaire ne peut pas égaler le principal : deux appuis rapides sur
     la même ligne le produiraient, et la carte d'accueil afficherait alors
     deux fois la même chose sans rien dire de plus. */
  function normaliserProfil(brut, nomDefaut) {
    const src = (brut && typeof brut === 'object') ? brut : {};
    let nom = typeof src.nom === 'string' ? src.nom.trim().slice(0, NOM_MAX) : '';
    if (!nom) nom = nomDefaut;

    const principal = estLangage(src.principal) ? src.principal : null;
    let secondaire = estLangage(src.secondaire) ? src.secondaire : null;
    if (secondaire && secondaire === principal) secondaire = null;

    /* Un secondaire sans principal n'existe pas : on le promeut plutôt que
       de garder un profil à moitié rempli, illisible sur l'accueil. */
    if (!principal && secondaire) return { nom, principal: secondaire, secondaire: null };

    return { nom, principal, secondaire };
  }

  function profilComplet(p) { return !!(p && p.principal); }

  /* Ce qu'on lit sur la carte d'accueil, sans avoir rien touché. */
  function resumeProfil(p) {
    if (!p || !p.principal) return '';
    return p.secondaire
      ? nomLangage(p.principal) + ' · ' + nomLangage(p.secondaire)
      : nomLangage(p.principal);
  }

  /* ------------------------------------------------------------ les idées */

  /* Les idées sont ÉCRITES PAR ELLE, et rien d'autre. Un corpus embarqué a
     été essayé puis retiré le 2026-10-01 : dix idées ont suffi à montrer
     qu'un catalogue écrit d'avance est générique, quel que soit son nombre.

     Une idée porte le palier auquel elle convient, pour qu'un voyage en
     Gaspésie ne remonte pas un mardi soir. Ce sont les trois paliers de la
     règle des 7-7-7, déjà le vocabulaire de l'app. */
  const PALIERS = [
    { id: 'soiree',   nom: 'Soirée' },
    { id: 'nuit',     nom: 'Nuit' },
    { id: 'vacances', nom: 'Vacances' }
  ];

  const PALIER_DEFAUT = 'soiree';
  const TEXTE_MAX = 80;

  function estPalier(id) { return PALIERS.some(p => p.id === id); }
  function nomPalier(id) {
    const p = PALIERS.find(x => x.id === id);
    return p ? p.nom : '';
  }

  /* Une idée relue peut venir d'une version plus ancienne, ou d'un
     localStorage édité à la main. Ce qui ne tient pas debout est écarté à la
     relecture plutôt que de traverser l'app et de casser un rendu plus loin.

     Le texte est rogné et plafonné : une idée tient sur une ligne de
     téléphone, et un texte sans fin casserait la ligne de la liste. */
  function normaliserIdee(brut) {
    if (!brut || typeof brut !== 'object') return null;
    if (!brut.id || typeof brut.id !== 'string') return null;
    if (typeof brut.texte !== 'string') return null;
    const texte = brut.texte.trim().slice(0, TEXTE_MAX);
    if (!texte) return null;
    return {
      id: String(brut.id),
      texte,
      palier: estPalier(brut.palier) ? brut.palier : PALIER_DEFAUT
    };
  }

  /* ------------------------------------------------------------- export */

  const API = {
    depuisTexte, versTexte, aujourdHui, joursEntre, ajouterMois, formaterDate,
    LANGAGES, estLangage, nomLangage, nomCourt,
    normaliserProfil, profilComplet, resumeProfil,
    PALIERS, PALIER_DEFAUT, TEXTE_MAX, estPalier, nomPalier, normaliserIdee
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else racine.COEUR = API;

})(typeof globalThis !== 'undefined' ? globalThis : this);
