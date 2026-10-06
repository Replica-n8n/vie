// Prouve que les tests mordent : on abîme une règle à la fois dans js/coeur.js,
// et la suite doit échouer à chaque fois. Un test qui ne tombe jamais ne prouve rien.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FICHIER = new URL('../js/coeur.js', import.meta.url);
const origine = readFileSync(FICHIER, 'utf8');

const DEFAUTS = [
  ['un moment retiré compte encore', 'const vivant = (x) => !x.supprimeLe;', 'const vivant = (x) => true;'],
  ['« pas de rappel » est ignoré', "filter((m) => m.rappel !== false)", 'filter(() => true)'],
  ['un passage entre dans un axe', "m.genre === 'axe' && m.axe === a.id", 'm.axe === a.id || (m.genre === "passage" && a.id === "vivre")'],
  ['plus de trois hauts faits', '.sort(parTemps).slice(0, 3)', '.sort(parTemps)'],
  ['hausse et baisse inversées', '(a > b ? hausse : baisse)', '(a < b ? hausse : baisse)'],
  ['les années vides disparaissent du ruban', 'for (let a = debut; a <= fin; a += 1) annees.push(', 'for (let a = debut; a <= fin; a += 1) if (dates.some((m) => m.annee === a)) annees.push('],
  ['un moment sans année entre dans le ruban', 'const dates = actifs.filter((m) => m.annee);', 'const dates = actifs.map((m) => ({ ...m, annee: m.annee || anneeFin }));'],
  ['l’anniversaire du jour est ignoré', 'if (anniversaires.length) return', 'if (false) return'],
  ['on compare au point du même mois', 'decalerMois(actuel.mois, -ecart)', 'decalerMois(actuel.mois, 0)'],
];

let rates = 0;
try {
  for (const [nom, avant, apres] of DEFAUTS) {
    if (!origine.includes(avant)) { console.log(`INTROUVABLE  ${nom}`); rates += 1; continue; }
    writeFileSync(FICHIER, origine.replace(avant, apres));
    const { status } = spawnSync(process.execPath, ['--test'], { cwd: new URL('..', import.meta.url), stdio: 'ignore' });
    const attrape = status !== 0;
    if (!attrape) rates += 1;
    console.log(`${attrape ? 'attrapé     ' : 'PASSÉ INAPERÇU'} ${nom}`);
  }
} finally {
  writeFileSync(FICHIER, origine);
}
console.log(rates ? `${rates} défaut(s) non attrapé(s)` : 'tous les défauts sont attrapés');
process.exit(rates ? 1 : 0);
