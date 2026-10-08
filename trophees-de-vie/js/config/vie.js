// Ce que la page sait d'une vie : les médailles, les catégories, les réussites
// proposées et leur rareté. C'est LE fichier à modifier pour ajouter une réussite
// ou corriger un chiffre.
//
// Rien ici n'est une liste à compléter. Une réussite non cochée n'apparaît nulle
// part sur la page : elle n'existe que comme proposition dans le formulaire.

// La médaille vient de la rareté quand un chiffre existe : sinon on la choisit.
export const NIVEAUX = [
  { id: 'bronze', nom: 'Bronze' },
  { id: 'argent', nom: 'Argent' },
  { id: 'or', nom: 'Or' },
];

export const CATEGORIES = [
  { id: 'apprendre', nom: 'Apprendre' },
  { id: 'travailler', nom: 'Travailler' },
  { id: 'installer', nom: 'S’installer' },
  { id: 'partir', nom: 'Partir' },
  { id: 'aimer', nom: 'Aimer' },
  { id: 'depasser', nom: 'Se dépasser' },
];

// `rarete` : la part des adultes qui l'ont fait, entre 0 et 1. La page n'affiche
// que « Top N % », et seulement pour l'or : la source reste ici, pas à l'écran.
// `parAge` : la même part selon l'âge au moment de la réussite (il faut l'année de
// naissance) ; la dernière tranche sert quand l'âge est inconnu.
// `defaut` : la médaille proposée quand aucun chiffre fiable n'existe.
//
// ⚠️ Les chiffres ne viennent pas tous de la même population (OCDE, Union
// européenne, France, monde) : elle a demandé l'OCDE, et on a pris le meilleur
// chiffre disponible quand l'OCDE ne publie rien. Chaque source est notée.
// ⚠️ Un identifiant ne se renomme jamais : les moments gardés le portent.
export const REUSSITES = [
  // OCDE, Regards sur l'éducation 2025 : 41,2 % des 25-64 ans ont un diplôme du supérieur.
  { id: 'diplome', titre: 'Un diplôme du supérieur', categorie: 'apprendre', rarete: 0.41 },
  // OCDE, Regards sur l'éducation 2025 (notes par pays) : 16 % des 25-34 ans ont un master.
  { id: 'master', titre: 'Un master', categorie: 'apprendre', rarete: 0.16 },
  // OCDE, Education GPS : 1,2 % des 25-64 ans ont un doctorat (2024).
  { id: 'doctorat', titre: 'Un doctorat', categorie: 'apprendre', rarete: 0.012 },
  // Eurobaromètre spécial 540 (2024), Union européenne : 28 % tiennent une
  // conversation dans deux langues étrangères, 11 % dans trois.
  { id: 'langues-2', titre: 'Parler deux langues étrangères', categorie: 'apprendre', rarete: 0.28 },
  { id: 'langues-3', titre: 'Parler trois langues étrangères', categorie: 'apprendre', rarete: 0.11 },
  { id: 'reprendre-etudes', titre: 'Reprendre des études', categorie: 'apprendre', defaut: 'argent' },

  { id: 'premier-argent', titre: 'Mon premier argent gagné', categorie: 'travailler', defaut: 'bronze' },
  { id: 'premier-emploi', titre: 'Premier emploi', categorie: 'travailler', defaut: 'bronze' },
  { id: 'trouver-voie', titre: 'Trouver ma voie', categorie: 'travailler', defaut: 'argent' },
  { id: 'changer-metier', titre: 'Changer de métier', categorie: 'travailler', defaut: 'argent' },
  // OCDE, « The job quality of self-employment in Europe » (2025) : 13 % des
  // personnes en emploi sont à leur compte, en Europe, en 2021.
  { id: 'a-mon-compte', titre: 'Me mettre à mon compte', categorie: 'travailler', rarete: 0.13 },
  { id: 'grande-reussite', titre: 'Une grande réussite', categorie: 'travailler', defaut: 'argent' },

  { id: 'quitter-maison', titre: 'Quitter la maison', categorie: 'installer', defaut: 'bronze' },
  // Insee, enquête Transports et déplacements, citée par l'INJEP : 76 % des femmes
  // et 91 % des hommes adultes ont le permis en France. Courant, donc bronze.
  { id: 'permis', titre: 'Permis de conduire', categorie: 'installer', defaut: 'bronze' },
  { id: 'premier-chez-moi', titre: 'Mon premier chez-moi', categorie: 'installer', defaut: 'bronze' },
  // Insee, début 2024, France : 17,2 % des ménages de moins de 30 ans possèdent leur
  // résidence principale, 47,7 % des 30-39 ans, 57,2 % de l'ensemble des ménages.
  { id: 'proprietaire', titre: 'Acheter mon logement', categorie: 'installer', parAge: [{ avant: 30, part: 0.17 }, { avant: 40, part: 0.48 }, { part: 0.57 }] },
  { id: 'epargne', titre: 'Mettre de l’argent de côté', categorie: 'installer', defaut: 'bronze' },

  { id: 'grand-voyage', titre: 'Un grand voyage', categorie: 'partir', defaut: 'argent' },
  { id: 'voyager-seule', titre: 'Voyager seule', categorie: 'partir', defaut: 'argent' },
  // ONU, 2024 : 3,7 % de la population mondiale vit hors de son pays de naissance.
  { id: 'vivre-etranger', titre: 'Vivre dans un autre pays', categorie: 'partir', rarete: 0.037 },
  { id: 'etudier-etranger', titre: 'Étudier à l’étranger', categorie: 'partir', defaut: 'argent' },

  { id: 'tomber-amoureuse', titre: 'Tomber amoureuse', categorie: 'aimer', defaut: 'bronze' },
  { id: 'mariage', titre: 'Me marier', categorie: 'aimer', defaut: 'bronze' },
  { id: 'enfant', titre: 'Avoir un enfant', categorie: 'aimer', defaut: 'bronze' },
  { id: 'amis-longue-date', titre: 'Garder une amitié de longue date', categorie: 'aimer', defaut: 'argent' },
  { id: 'amis-etre-la', titre: 'Être là pour un proche dans un moment dur', categorie: 'aimer', defaut: 'argent' },

  { id: 'nager', titre: 'Apprendre à nager', categorie: 'depasser', defaut: 'bronze' },
  { id: 'dix-km', titre: 'Courir 10 km', categorie: 'depasser', defaut: 'bronze' },
  // Aucune statistique officielle : des estimations de blogs seulement. Pas de chiffre affiché.
  { id: 'marathon', titre: 'Courir un marathon', categorie: 'depasser', defaut: 'or' },
  { id: 'arreter-fumer', titre: 'Arrêter de fumer', categorie: 'depasser', defaut: 'argent' },
  { id: 'creer', titre: 'Montrer ce que je crée', categorie: 'depasser', defaut: 'argent' },
  { id: 'rebondir', titre: 'Me relever d’un coup dur', categorie: 'depasser', defaut: 'argent' },
];

// Les propositions de la version 2 qui disaient la même chose sous un autre nom.
// Un moment gardé avec l'ancien identifiant est lu comme la réussite d'aujourd'hui.
export const ALIAS = {
  'vivre-ailleurs': 'vivre-etranger',
  'vivre-changer-voie': 'changer-metier',
  'vivre-mon-compte': 'a-mon-compte',
  'vivre-etudes': 'reprendre-etudes',
};

export const CATALOGUE = { reussites: REUSSITES, alias: ALIAS };
