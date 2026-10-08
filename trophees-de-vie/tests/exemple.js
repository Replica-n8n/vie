// Une vie d'exemple, anonyme, qui ne sert qu'aux essais et aux captures.
// Elle n'est jamais chargée par la page. La personne est née en 1992.

export const NAISSANCE = 1992;

// Une réussite proposée : sa médaille viendra de sa rareté, ou de `niveau` sans chiffre.
const r = (id, reussite, titre, annee, suite = {}) => ({ id, reussite, categorie: null, titre, niveau: 'argent', annee, date: null, ...suite });
// Une réussite écrite à la main : catégorie et médaille choisies.
const libre = (id, categorie, titre, niveau, annee, suite = {}) => ({ id, reussite: null, categorie, titre, niveau, annee, date: null, ...suite });

export const MOMENTS = [
  r('argent', 'premier-argent', 'Mon premier argent gagné', 2009, { niveau: 'bronze' }),
  libre('bac', 'apprendre', 'Le bac', 'bronze', 2010),
  r('permis', 'permis', 'Permis de conduire', 2010, { niveau: 'bronze' }),
  r('lisbonne', 'voyager-seule', 'Partir seule à Lisbonne', 2012),
  r('licence', 'diplome', 'Licence', 2014),
  r('master', 'master', 'Master en urbanisme', 2015, { hautFait: true }),
  r('emploi', 'premier-emploi', 'Premier emploi', 2015, { niveau: 'bronze' }),
  r('chez-moi', 'premier-chez-moi', 'Mon premier chez-moi', 2017, { niveau: 'bronze' }),
  r('montreal', 'vivre-etranger', 'Six mois à Montréal', 2018, { hautFait: true }),
  r('nager', 'nager', 'Apprendre à nager', 2019, { niveau: 'bronze' }),
  r('langues', 'langues-2', 'Parler anglais et espagnol', 2019),
  r('achat', 'proprietaire', 'Acheter mon appartement', 2021, { hautFait: true }), // à 29 ans
  r('dix-km', 'dix-km', 'Premier 10 km', 2022, { niveau: 'bronze' }),
  r('photos', 'creer', 'Exposer mes photos', 2022),
  libre('marraine', 'aimer', 'Devenir marraine', 'argent', 2023),
  libre('semi', 'depasser', 'Mon premier semi-marathon', 'or', 2024, { date: '2024-10-05', note: 'J’ai cru abandonner au 15e kilomètre. 2 h 07 à l’arrivée.' }),
  r('amitie', 'amis-longue-date', 'Vingt ans d’une même amitié', 2025),
  r('metier', 'changer-metier', 'Changer de métier', 2025),
  // Deux moments tels que les versions 1 et 2 les écrivaient : ils doivent rester lisibles.
  { id: 'confinement', genre: 'scene', scene: 'dur', passage: null, axe: null, titre: 'Tenir pendant le confinement', niveau: 'cap', annee: 2020, date: null, rappel: false },
  { id: 'compte', genre: 'axe', axe: 'vivre', passage: null, proposition: 'vivre-mon-compte', titre: 'Me lancer à mon compte', niveau: 'effort', annee: 2025, date: null },
  libre('potager', 'depasser', 'Finir mon potager', 'bronze', 2026),
];

const roue = (sante, travail, argent, amour, proches, loisirs, evolution, cadre) => ({ sante, travail, argent, amour, proches, loisirs, evolution, cadre });

export const POINTS = [
  { mois: '2026-05', roue: roue(6, 8, 5, 4, 7, 6, 7, 6), meteo: 4, elan: 1 },
  { mois: '2026-06', roue: roue(6, 8, 5, 4, 7, 6, 7, 6), meteo: 4, elan: 1 },
  { mois: '2026-08', roue: roue(6, 8, 5, 5, 8, 6, 7, 6), meteo: 5, elan: 2 },
  { mois: '2026-09', roue: roue(7, 8, 5, 6, 8, 6, 7, 7), meteo: 4, elan: 1 },
];
