// Une vie d'exemple, anonyme, qui ne sert qu'aux essais et aux captures.
// Elle n'est jamais chargée par la page.

const m = (id, genre, cle, titre, niveau, annee, suite = {}) => ({
  id, genre, passage: genre === 'passage' ? cle : null, scene: genre === 'scene' ? cle : null, axe: genre === 'axe' ? cle : null,
  titre, niveau, annee, date: null, ...suite,
});

export const MOMENTS = [
  m('argent', 'passage', 'premier-argent', 'Mon premier argent gagné', 'effort', 2009),
  m('bac', 'passage', 'diplome', 'Le bac', 'effort', 2010),
  m('permis', 'passage', null, 'Permis de conduire', 'cap', 2010),
  m('lisbonne', 'axe', 'vivre', 'Partir seule à Lisbonne', 'cap', 2012),
  m('licence', 'passage', null, 'Licence', 'cap', 2014),
  m('master', 'passage', null, 'Master en urbanisme', 'montagne', 2015, { hautFait: true }),
  m('emploi', 'passage', 'premier-emploi', 'Premier emploi', 'effort', 2015),
  m('chez-moi', 'passage', 'premier-chez-moi', 'Mon premier chez-moi', 'cap', 2017),
  m('montreal', 'axe', 'vivre', 'Six mois à Montréal', 'montagne', 2018, { hautFait: true }),
  m('nager', 'axe', 'hors', 'Apprendre à nager', 'cap', 2019),
  m('confinement', 'scene', 'dur', 'Tenir pendant le confinement', 'cap', 2020, { rappel: false }),
  m('epargne', 'passage', null, 'Épargne de secours', 'cap', 2020),
  m('aide', 'axe', 'dire', 'Demander de l’aide', 'cap', 2021),
  m('partir', 'axe', 'dire', 'Dire que je partais', 'montagne', 2021, { hautFait: true }),
  m('dix-km', 'axe', 'hors', 'Premier 10 km', 'effort', 2022),
  m('photos', 'axe', 'bonheur', 'Exposer mes photos', 'cap', 2022),
  m('marraine', 'axe', 'amis', 'Devenir marraine', 'cap', 2023),
  m('semi', 'axe', 'hors', 'Mon premier semi-marathon', 'montagne', 2024, { date: '2024-10-05', note: 'J’ai cru abandonner au 15e kilomètre. 2 h 07 à l’arrivée.' }),
  m('amitie', 'axe', 'amis', 'Vingt ans d’une même amitié', 'cap', 2025),
  m('japon', 'axe', 'bonheur', 'M’offrir le Japon', 'effort', 2025),
  m('metier', 'axe', 'vivre', 'Changer de métier', 'montagne', 2025),
  m('potager', 'axe', 'hors', 'Finir mon potager', 'effort', 2026),
];

const roue = (sante, travail, argent, amour, proches, loisirs, evolution, cadre) => ({ sante, travail, argent, amour, proches, loisirs, evolution, cadre });

export const POINTS = [
  { mois: '2026-05', roue: roue(6, 8, 5, 4, 7, 6, 7, 6), meteo: 4, elan: 1 },
  { mois: '2026-06', roue: roue(6, 8, 5, 4, 7, 6, 7, 6), meteo: 4, elan: 1 },
  { mois: '2026-08', roue: roue(6, 8, 5, 5, 8, 6, 7, 6), meteo: 5, elan: 2 },
  { mois: '2026-09', roue: roue(7, 8, 5, 6, 8, 6, 7, 7), meteo: 4, elan: 1 },
];
