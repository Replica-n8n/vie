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
//
// `propositions` : des choses concrètes à toucher, sans rien écrire. Elles sont de
// nous, pas d'une étude : elles déclinent chaque regret en gestes reconnaissables.
// Sans elles, seules des questions ouvertes et intimes remplissaient les axes, et
// la page restait aux cinq sixièmes vide (constaté sur sa vraie page, 2026-10-08).
// Un identifiant de proposition ne se renomme jamais : les moments gardés le portent.
export const AXES = [
  { id: 'vivre', nom: 'Vivre ma vie à moi', question: 'Un autre choix fait pour toi ?', propositions: [
    { id: 'vivre-changer-voie', titre: 'Changer de voie' },
    { id: 'vivre-ailleurs', titre: 'Partir vivre ailleurs' },
    { id: 'vivre-seule', titre: 'Vivre seule' },
    { id: 'vivre-dire-non', titre: 'Dire non à ce qu’on attendait de moi' },
    { id: 'vivre-mon-compte', titre: 'Me lancer à mon compte' },
    { id: 'vivre-etudes', titre: 'Reprendre des études' },
  ] },
  { id: 'hors', nom: 'Vivre hors du travail', question: 'Un autre moment où ta vie est passée avant le travail ?', propositions: [
    { id: 'hors-vacances', titre: 'Prendre de vraies vacances' },
    { id: 'hors-passion', titre: 'Tenir un sport ou une passion' },
    { id: 'hors-refuser', titre: 'Refuser des heures en plus' },
    { id: 'hors-conge', titre: 'Prendre un congé pour moi' },
    { id: 'hors-apprendre', titre: 'Apprendre quelque chose pour le plaisir' },
    { id: 'hors-les-miens', titre: 'Choisir les miens plutôt que le travail' },
  ] },
  { id: 'dire', nom: 'Dire ce que je ressens', question: 'Autre chose que tu as osé dire ?', propositions: [
    { id: 'dire-je-taime', titre: 'Dire je t’aime' },
    { id: 'dire-aide', titre: 'Demander de l’aide' },
    { id: 'dire-excuses', titre: 'M’excuser' },
    { id: 'dire-limite', titre: 'Poser une limite' },
    { id: 'dire-ca-ne-va-pas', titre: 'Dire ce qui n’allait pas' },
    { id: 'dire-merci', titre: 'Remercier quelqu’un qui a compté' },
  ] },
  { id: 'amis', nom: 'Garder mes amis', question: 'Une autre amitié que tu as su garder ?', propositions: [
    { id: 'amis-longue-date', titre: 'Garder une amitié de longue date' },
    { id: 'amis-retrouver', titre: 'Retrouver un ami perdu de vue' },
    { id: 'amis-etre-la', titre: 'Être là pour un ami dans un moment dur' },
    { id: 'amis-premier-pas', titre: 'Faire le premier pas' },
    { id: 'amis-distance', titre: 'Traverser la distance pour voir un ami' },
    { id: 'amis-temoin', titre: 'Être témoin, marraine ou parrain' },
  ] },
  { id: 'bonheur', nom: 'M’autoriser le bonheur', question: 'Autre chose que tu t’es autorisée ?', propositions: [
    { id: 'bonheur-cadeau', titre: 'M’offrir quelque chose dont je rêvais' },
    { id: 'bonheur-feter', titre: 'Fêter une réussite' },
    { id: 'bonheur-voyage', titre: 'Voyager rien que pour le plaisir' },
    { id: 'bonheur-temps', titre: 'Prendre du temps pour moi sans culpabiliser' },
    { id: 'bonheur-reve', titre: 'Réaliser un rêve d’enfant' },
    { id: 'bonheur-oser', titre: 'Oser quelque chose de fou' },
  ] },
];
