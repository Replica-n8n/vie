// Données fictives pour la démonstration : « Léa, 34 ans ». Elles vivent dans une
// base à part et ne se mélangent jamais aux vraies données.

const t = (id, defId, titre, categorie, niveau, annee, date, suite = {}) => ({
  id: `demo-${id}`, defId, titre, categorie, niveau, annee, date: date ? `${annee}-${date}` : null, ...suite,
});

export const DEMO = {
  reglages: { prenom: 'Léa', naissance: 1992 },

  trophees: [
    t('job-ete', 'premier-salaire', 'Premier job d’été', 'autonomie', 'bronze', 2009, '07-06', { note: 'Deux mois à la boulangerie. Mon premier salaire.' }),
    t('bac', 'diplome', 'Le bac', 'savoir', 'bronze', 2010, '07-02'),
    t('permis', 'permis', 'Permis de conduire', 'autonomie', 'argent', 2010, null, { note: 'Raté deux fois. La troisième, je tremblais encore.' }),
    t('lisbonne', 'partir-seule', 'Premier voyage seule, à Lisbonne', 'aventure', 'argent', 2012, '04-18'),
    t('licence', 'diplome', 'Licence de géographie', 'savoir', 'argent', 2014, null),
    t('master', 'diplome', 'Master en urbanisme', 'savoir', 'or', 2015, '09-25', { hautFait: true, note: 'Le mémoire rendu à 4 h du matin.' }),
    t('emploi', null, 'Premier emploi', 'autonomie', 'bronze', 2015, null),
    t('logement', 'premier-logement', 'Premier logement à moi', 'autonomie', 'argent', 2017, '03-11', { note: 'Trente mètres carrés et un balcon.' }),
    t('montreal', 'vivre-etranger', 'Six mois à Montréal', 'aventure', 'or', 2018, '01-14', { hautFait: true, note: 'Moins 28 le jour de l’arrivée.' }),
    t('nager', 'nager', 'Apprendre à nager, à 27 ans', 'corps', 'argent', 2019, null),
    t('confinement', 'periode-difficile', 'Tenir pendant le confinement', 'resilience', 'argent', 2020, null, { rappel: false }),
    t('epargne', 'epargne', 'Épargne de secours', 'autonomie', 'argent', 2020, '12-01'),
    t('rupture', 'rupture', 'Me relever de ma rupture', 'resilience', 'or', 2021, null, { hautFait: true, rappel: false }),
    t('aide', 'demander-aide', 'Demander de l’aide', 'resilience', 'argent', 2021, '05-20', { rappel: false, note: 'Le coup de fil le plus dur à passer.' }),
    t('dix-km', 'dix-km', 'Premier 10 km', 'corps', 'bronze', 2022, '06-12'),
    t('photos', 'montrer', 'Exposer mes photos', 'creation', 'argent', 2022, '11-05', { personnes: ['Julie', 'Karim'] }),
    t('marraine', 'parent-marraine', 'Marraine de Jeanne', 'liens', 'argent', 2023, '02-19', { personnes: ['Camille', 'Jeanne'] }),
    t('semi', null, 'Mon premier semi-marathon, à Lyon', 'corps', 'or', 2024, '10-03', { note: 'J’ai cru abandonner au 15e km. Maman m’attendait à l’arrivée. 2 h 07.', personnes: ['Maman'] }),
    t('metier', 'changer-metier', 'Changer de métier', 'autonomie', 'or', 2025, '09-01', { note: 'Dix ans dans un bureau, puis le terrain.' }),
    t('potager', 'finir-projet', 'Finir mon potager', 'creation', 'bronze', 2026, '08-22'),
  ],

  compteurs: [
    { id: 'pays', valeur: 10, detail: '3 continents' },
    { id: 'livres', valeur: 31, detail: 'environ 9 000 pages' },
    { id: 'amities', valeur: 3, detail: 'la plus ancienne : 21 ans, Julie' },
  ],

  passages: [
    { id: 'demo-pays-5', compteur: 'pays', rang: 5, nom: 'l’Islande', annee: 2019, date: '2019-08-09' },
    { id: 'demo-pays-10', compteur: 'pays', rang: 10, nom: 'le Japon', annee: 2025, date: '2025-04-22' },
  ],

  // Quatorze mois, d'août 2025 à septembre 2026.
  points: (() => {
    const meteo = [3, 3, 3, 2, 2, 3, 3, 4, 3, 4, 4, 5, 4, 4];
    const avant = { sante: 6, travail: 8, argent: 5, amour: 4, proches: 7, loisirs: 6, evolution: 7, cadre: 6 };
    const milieu = { ...avant, amour: 5, proches: 8 };
    const maintenant = { sante: 7, travail: 8, argent: 5, amour: 6, proches: 8, loisirs: 6, evolution: 7, cadre: 7 };
    return meteo.map((m, i) => {
      const total = 2025 * 12 + 7 + i;
      const mois = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
      const roue = i === 13 ? maintenant : i >= 11 ? milieu : avant;
      return {
        mois, roue: { ...roue }, meteo: m,
        satisfaction: i >= 11 ? 2 : 1, sens: 1, energie: i >= 12 ? 0 : 1,
      };
    });
  })(),
};
