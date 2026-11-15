// Règles pures de Repas, sans page : testées par tests/coeur.test.js.
// Aucun chiffre n'est calculé ici à partir de rien : les macros viennent du plan, que
// repas/tools/semaine.mjs calcule avec le Fichier canadien sur les éléments nutritifs.

export const MACROS = [['kcal', 'Calories', ''], ['p', 'Protéines', ' g'], ['g', 'Glucides', ' g'], ['l', 'Lipides', ' g'], ['f', 'Fibres', ' g']];

export function somme(repas) {
  const t = { kcal: 0, p: 0, g: 0, l: 0, f: 0 };
  for (const r of repas) for (const [k] of MACROS) t[k] += r[k] || 0;
  return t;
}

/* Ce qu'il reste à la journée pour le petit-déjeuner et les collations. Un reste négatif ne
   devient pas « 0 g » : il dit de combien les repas dépassent déjà. */
export function reste(total, objectif) {
  const nom = { kcal: '', p: 'protéines', g: 'glucides', l: 'lipides', f: 'fibres' };
  const u = { kcal: ' kcal', p: ' g', g: ' g', l: ' g', f: ' g' };
  return MACROS.map(([k]) => {
    const d = Math.round(objectif[k] - total[k]);
    return `${nom[k] ? nom[k] + ' ' : ''}${d >= 0 ? d : `déjà dépassés de ${-d}`}${u[k]}`.trim();
  });
}

/* 2,25 → « 2 ¼ » ; 0,67 → « ⅔ » ; sinon un décimal à la française. */
export function fraction(x) {
  const e = Math.floor(x + 1e-6), r = x - e;
  const Q = [[0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1 / 3, '⅓'], [2 / 3, '⅔']];
  if (r < 0.02) return String(e);
  const q = Q.find(([v]) => Math.abs(r - v) < 0.02);
  return q ? (e ? `${e} ${q[1]}` : q[1]) : String(Math.round(x * 10) / 10).replace('.', ',');
}

/* L'état de la semaine (repas cuisinés, courses prises), gardé dans le téléphone sous une clé
   par semaine : une nouvelle semaine repart de zéro sans effacer l'ancienne. Les clés ne se
   renomment jamais. */
export const cleEtat = (semaine) => `repas:etat:${semaine}`;
export function lireEtat(stockage, semaine) {
  try {
    const d = JSON.parse(stockage.getItem(cleEtat(semaine)) || '{}');
    return { cuisines: { ...(d.cuisines || {}) }, pris: { ...(d.pris || {}) } };
  } catch {
    return { cuisines: {}, pris: {} };
  }
}
export function ecrireEtat(stockage, semaine, etat) {
  try { stockage.setItem(cleEtat(semaine), JSON.stringify(etat)); return true; } catch { return false; }
}

/* Le jour à montrer : aujourd'hui s'il est dans la semaine, sinon le premier jour. */
export function jourParDefaut(jours, aujourdhui) {
  return (jours.find((j) => j.date === aujourdhui) || jours[0] || {}).date;
}

/* Date du téléphone, et non UTC : à Montréal le soir, toISOString() donne déjà le lendemain. */
export const dateLocale = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
