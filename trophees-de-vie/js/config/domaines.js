// Ce que mesure « Faire le point » : la carte de vie, la météo, trois questions.

// Les huit domaines de la carte de vie, notés de 1 à 10, dans l'ordre du radar
// (le premier est en haut, puis dans le sens des aiguilles d'une montre).
export const DOMAINES = [
  { id: 'sante', nom: 'Santé', abrege: 'SAN' },
  { id: 'travail', nom: 'Travail', abrege: 'TRA' },
  { id: 'argent', nom: 'Argent', abrege: 'ARG' },
  { id: 'amour', nom: 'Amour', abrege: 'AMO' },
  { id: 'proches', nom: 'Proches', abrege: 'PRO' },
  { id: 'loisirs', nom: 'Loisirs', abrege: 'LOI' },
  { id: 'evolution', nom: 'Évolution perso', abrege: 'ÉVO' },
  { id: 'cadre', nom: 'Cadre de vie', abrege: 'CAD' },
];

// La météo intérieure, de 1 à 5. Toujours affichée en mots, jamais en chiffre.
export const METEOS = ['Orageux', 'Nuageux', 'Variable', 'Éclaircies', 'Grand soleil'];

// Trois questions maison, réponses de 0 à 2. Elles ne s'affichent qu'en tendance.
export const QUESTIONS = [
  { id: 'satisfaction', nom: 'Satisfaction', question: 'Ta vie te convient, en ce moment ?' },
  { id: 'sens', nom: 'Sens', question: 'Ce que tu fais a du sens pour toi ?' },
  { id: 'energie', nom: 'Énergie', question: 'Tu as de l’élan ?' },
];
export const REPONSES = ['Pas trop', 'Ça va', 'Oui'];

export const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
