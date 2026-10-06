// Ce que la page sait d'une vie : les niveaux, les passages, les scènes, les cinq axes.
// C'est LE fichier à modifier pour reformuler une question ou ajouter un passage.
//
// Rien ici n'est une liste à compléter. Un passage non vécu n'apparaît nulle part
// sur la page : il n'existe que comme proposition dans le formulaire.

// À quel point c'était dur pour soi. Sur la page : un anneau, une demi-lune, une pleine lune.
export const NIVEAUX = [
  { id: 'effort', nom: 'Un effort', mots: ['effort', 'efforts'] },
  { id: 'cap', nom: 'Un cap', mots: ['cap', 'caps'] },
  { id: 'montagne', nom: 'Une montagne', mots: ['montagne', 'montagnes'] },
];

// Les grandes étapes qu'une vie compte, d'après le « script de vie » de Berntsen
// et Rubin (2004). Ce sont des passages, pas des durées ni des répétitions.
// « Mon premier chez-moi » vient d'elle, pas de l'étude.
export const PASSAGES = [
  { id: 'quitter-maison', titre: 'Quitter la maison' },
  { id: 'premier-argent', titre: 'Mon premier argent gagné' },
  { id: 'diplome', titre: 'Un diplôme' },
  { id: 'premier-emploi', titre: 'Premier emploi' },
  { id: 'trouver-voie', titre: 'Trouver ma voie' },
  { id: 'tomber-amoureuse', titre: 'Tomber amoureuse' },
  { id: 'mariage', titre: 'Me marier' },
  { id: 'enfant', titre: 'Avoir un enfant' },
  { id: 'grand-voyage', titre: 'Un grand voyage' },
  { id: 'grande-reussite', titre: 'Une grande réussite' },
  { id: 'premier-chez-moi', titre: 'Mon premier chez-moi' },
];

// Trois scènes qui portent un récit de vie (entretien de McAdams).
// `discret` : ne ressort pas en souvenir du jour tant qu'on ne l'a pas demandé.
export const SCENES = [
  { id: 'beau', question: 'Ton plus beau moment ?' },
  { id: 'tournant', question: 'Un tournant dans ta vie ?' },
  { id: 'dur', question: 'Le plus dur que tu as traversé ?', facultatif: true, discret: true },
];

// Les cinq regrets recueillis par Bronnie Ware auprès de personnes en fin de vie,
// retournés en ce qu'on a déjà fait. C'est un témoignage, pas une étude.
export const AXES = [
  { id: 'vivre', nom: 'Vivre ma vie à moi', question: 'Un choix fait pour toi, contre ce qu’on attendait de toi ?' },
  { id: 'hors', nom: 'Vivre hors du travail', question: 'Un moment où ta vie est passée avant le travail ?' },
  { id: 'dire', nom: 'Dire ce que je ressens', question: 'Une chose difficile que tu as osé dire à quelqu’un ?' },
  { id: 'amis', nom: 'Garder mes amis', question: 'Une amitié que tu as su garder ?' },
  { id: 'bonheur', nom: 'M’autoriser le bonheur', question: 'Une chose que tu t’es autorisée, juste pour le plaisir ?' },
];
