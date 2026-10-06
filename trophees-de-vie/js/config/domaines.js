// Ce que mesure « Faire le point » : la carte de vie, la météo, l'élan.

// Les huit domaines de la carte de vie, notés de 1 à 10, dans l'ordre du radar
// (le premier est en haut, puis dans le sens des aiguilles d'une montre).
export const DOMAINES = [
  { id: 'sante', nom: 'Santé' },
  { id: 'travail', nom: 'Travail' },
  { id: 'argent', nom: 'Argent' },
  { id: 'amour', nom: 'Amour' },
  { id: 'proches', nom: 'Proches' },
  { id: 'loisirs', nom: 'Loisirs' },
  { id: 'evolution', nom: 'Évolution' },
  { id: 'cadre', nom: 'Cadre de vie' },
];

// La météo intérieure, de 1 à 5. Toujours affichée en mots, jamais en chiffre.
export const METEOS = ['Orageux', 'Nuageux', 'Variable', 'Éclaircies', 'Grand soleil'];

// L'élan, de 0 à 2.
export const ELANS = ['Pas trop', 'Ça va', 'Oui'];

export const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
