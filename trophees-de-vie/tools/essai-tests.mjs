// Prouve que les tests mordent : on abîme une règle à la fois dans js/coeur.js,
// et la suite doit échouer à chaque fois. Un test qui ne tombe jamais ne prouve rien.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FICHIER = new URL('../js/coeur.js', import.meta.url);
const origine = readFileSync(FICHIER, 'utf8');

const DEFAUTS = [
  ['un moment retiré compte encore', 'const vivant = (x) => !x.supprimeLe;', 'const vivant = (x) => true;'],
  ['« pas de rappel » est ignoré', 'filter((t) => t.rappel !== false)', 'filter(() => true)'],
  ['le seuil de l’or glisse', "part <= SEUILS.or ? 'or'", "part < SEUILS.or ? 'or'"],
  ['la médaille choisie passe avant le chiffre', 'if (part != null) return part <= SEUILS.or', 'if (part != null && !m.niveau) return part <= SEUILS.or'],
  ['« Top » est donné à l’argent aussi', "top: niveau === 'or' && part != null ? top(part) : null", 'top: part != null ? top(part) : null'],
  ['« Top 0 % » devient possible', 'Math.max(1, Math.round(part * 100))', 'Math.round(part * 100)'],
  ['l’âge est ignoré', 'return def.parAge.find((t) => t.avant == null || age < t.avant).part;', 'return def.parAge.at(-1).part;'],
  ['la tranche d’âge est décalée d’un an', 't.avant == null || age < t.avant', 't.avant == null || age <= t.avant'],
  ['les anciens niveaux ne sont plus lus', 'const choisie = ANCIENS[m.niveau] ?? m.niveau;', 'const choisie = m.niveau;'],
  ['les anciens identifiants ne sont plus reconnus', 'const vrai = catalogue.alias[id] ?? id;', 'const vrai = id;'],
  ['la catégorie choisie à la main est ignorée', 'categorie: m.categorie ?? def?.categorie ?? null', 'categorie: def?.categorie ?? m.categorie ?? null'],
  ['les âges sont décalés d’un an', 'Math.floor((a - naissance) / 10) * 10', 'Math.floor((a - naissance + 1) / 10) * 10'],
  ['un trophée précisé est encore « à préciser »', 'm.titre === def.titre || m.titre === def.ancienTitre', 'true'],
  ['plus de trois hauts faits', '.sort(parTemps).slice(0, 3)', '.sort(parTemps)'],
  ['hausse et baisse inversées', '(a > b ? hausse : baisse)', '(a < b ? hausse : baisse)'],
  ['les années vides disparaissent du ruban', 'for (let a = debut; a <= fin; a += 1) annees.push(', 'for (let a = debut; a <= fin; a += 1) if (dates.some((t) => t.annee === a)) annees.push('],
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
