// La liste des trophées proposés. C'est LE fichier à modifier pour en ajouter,
// en retirer ou en reformuler : rien d'autre ne dépend de leur nombre.
//
// Un trophée proposé n'est jamais affiché « verrouillé ». Il n'apparaît que dans
// les formulaires, comme une suggestion, et son niveau n'est qu'une proposition :
// c'est la personne qui dit à quel point c'était dur pour elle.

/** @typedef {'bronze'|'argent'|'or'} Niveau */

export const NIVEAUX = /** @type {const} */ (['bronze', 'argent', 'or']);

// Les mots du formulaire pour chaque niveau.
export const EFFORTS = { bronze: 'Un effort', argent: 'Un cap', or: 'Une montagne' };

export const CATEGORIES = [
  { id: 'aventure', nom: 'Aventure', question: 'Où es-tu allée ?' },
  { id: 'savoir', nom: 'Savoir', question: 'Qu’as-tu appris ?' },
  { id: 'corps', nom: 'Corps', question: 'Qu’a fait ton corps ?' },
  { id: 'liens', nom: 'Liens', question: 'Qui compte pour toi ?' },
  { id: 'creation', nom: 'Création', question: 'Qu’as-tu fabriqué ?' },
  { id: 'autonomie', nom: 'Autonomie', question: 'Qu’as-tu fait par toi-même ?' },
  // discret : pas de fanfare au déblocage, et pas de rappel en souvenir du jour
  // tant que la personne ne l'a pas demandé.
  { id: 'resilience', nom: 'Résilience', question: 'De quoi t’es-tu relevée ?', discret: true },
];

/** @type {{id:string, titre:string, categorie:string, niveau:Niveau}[]} */
export const TROPHEES = [
  { id: 'partir-seule', titre: 'Partir seule', categorie: 'aventure', niveau: 'argent' },
  { id: 'vivre-etranger', titre: 'Vivre à l’étranger', categorie: 'aventure', niveau: 'or' },
  { id: 'belle-etoile', titre: 'Dormir à la belle étoile', categorie: 'aventure', niveau: 'bronze' },
  { id: 'premier-avion', titre: 'Prendre l’avion pour la première fois', categorie: 'aventure', niveau: 'bronze' },
  { id: 'voyage-reve', titre: 'Faire le voyage dont je rêvais', categorie: 'aventure', niveau: 'argent' },

  { id: 'diplome', titre: 'Un diplôme', categorie: 'savoir', niveau: 'argent' },
  { id: 'langue', titre: 'Apprendre une langue', categorie: 'savoir', niveau: 'argent' },
  { id: 'metier-seule', titre: 'Me former seule à un métier', categorie: 'savoir', niveau: 'or' },
  { id: 'livre-autre-langue', titre: 'Lire un livre dans une autre langue', categorie: 'savoir', niveau: 'bronze' },
  { id: 'reprendre-etudes', titre: 'Reprendre des études', categorie: 'savoir', niveau: 'or' },

  { id: 'nager', titre: 'Apprendre à nager', categorie: 'corps', niveau: 'bronze' },
  { id: 'dix-km', titre: 'Courir 10 km', categorie: 'corps', niveau: 'bronze' },
  { id: 'arreter-fumer', titre: 'Arrêter de fumer', categorie: 'corps', niveau: 'or' },
  { id: 'reprendre-sport', titre: 'Reprendre le sport après une longue pause', categorie: 'corps', niveau: 'argent' },
  { id: 'sante-en-main', titre: 'Prendre ma santé en main', categorie: 'corps', niveau: 'argent' },

  { id: 'etre-la', titre: 'Être là dans un moment dur', categorie: 'liens', niveau: 'argent' },
  { id: 'reconcilier', titre: 'Me réconcilier', categorie: 'liens', niveau: 'argent' },
  { id: 'parent-marraine', titre: 'Devenir parent, marraine ou parrain', categorie: 'liens', niveau: 'argent' },
  { id: 'amitie-distance', titre: 'Garder une amitié à distance', categorie: 'liens', niveau: 'bronze' },
  { id: 'soin-proche', titre: 'Prendre soin d’un proche', categorie: 'liens', niveau: 'or' },

  { id: 'montrer', titre: 'Montrer ce que je crée', categorie: 'creation', niveau: 'argent' },
  { id: 'finir-projet', titre: 'Finir un projet commencé', categorie: 'creation', niveau: 'bronze' },
  { id: 'cuisiner-dix', titre: 'Cuisiner pour dix personnes', categorie: 'creation', niveau: 'bronze' },
  { id: 'construire', titre: 'Construire quelque chose de mes mains', categorie: 'creation', niveau: 'argent' },

  { id: 'permis', titre: 'Permis de conduire', categorie: 'autonomie', niveau: 'bronze' },
  { id: 'premier-logement', titre: 'Premier logement', categorie: 'autonomie', niveau: 'argent' },
  { id: 'premier-salaire', titre: 'Premier salaire', categorie: 'autonomie', niveau: 'bronze' },
  { id: 'changer-metier', titre: 'Changer de métier', categorie: 'autonomie', niveau: 'or' },
  { id: 'epargne', titre: 'Mettre de l’argent de côté', categorie: 'autonomie', niveau: 'argent' },
  { id: 'tenir-foyer', titre: 'Faire tourner un foyer', categorie: 'autonomie', niveau: 'argent' },

  { id: 'demander-aide', titre: 'Demander de l’aide', categorie: 'resilience', niveau: 'argent' },
  { id: 'rupture', titre: 'Me relever d’une rupture', categorie: 'resilience', niveau: 'or' },
  { id: 'deuil', titre: 'Traverser un deuil', categorie: 'resilience', niveau: 'or' },
  { id: 'rebondir', titre: 'Rebondir après un échec', categorie: 'resilience', niveau: 'argent' },
  { id: 'periode-difficile', titre: 'Tenir dans une période difficile', categorie: 'resilience', niveau: 'argent' },
];

// Les compteurs n'ont pas de paliers : ils affichent leur nombre.
// `passage` nomme une étape dans le parcours (« 10e pays visité : le Japon »).
export const COMPTEURS = [
  { id: 'pays', nom: 'pays visités', titre: 'Pays visités', categorie: 'aventure', passage: 'pays visité' },
  { id: 'livres', nom: 'livres lus', titre: 'Livres lus', categorie: 'savoir', passage: 'livre lu' },
  { id: 'amities', nom: 'amitiés de plus de 10 ans', titre: 'Amitiés de plus de 10 ans', categorie: 'liens', passage: 'amitié de plus de 10 ans' },
];

// Le seul platine : au moins un trophée dans chaque catégorie. Il est calculé,
// jamais stocké, et ne se montre que le jour où il tombe.
export const PLATINE = { id: 'touche-a-tout', titre: 'Touche-à-tout', detail: 'Un trophée dans chaque catégorie' };
