// Prouve que les tests mordent : on abîme une règle à la fois dans js/coeur.js,
// et la suite doit échouer à chaque fois. Un test qui ne tombe jamais ne prouve rien.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FICHIER = new URL('../js/coeur.js', import.meta.url);
const origine = readFileSync(FICHIER, 'utf8');

const DEFAUTS = [
  ['un trophée retiré compte encore', 'const vivant = (x) => !x.supprimeLe;', 'const vivant = (x) => true;'],
  ['« pas de rappel » est ignoré', 't.rappel !== false', 'true'],
  ['le platine prend la première catégorie couverte', 'moments[0] > dernier', 'moments[0] < dernier || !dernier'],
  ['hausse et baisse inversées', '(a > b ? hausse : baisse)', '(a < b ? hausse : baisse)'],
  ['la tendance ne monte jamais', 'if (ecart >= seuil)', 'if (ecart >= 99)'],
  ['un mois sauté est comblé', 'connus.get(m) ?? null', 'connus.get(m) ?? 3'],
  ['les années vides disparaissent du parcours', 'for (let a = debut; a <= fin; a += 1) {', 'for (let a = debut; a <= fin; a += 1) { if (!datees.some((e) => e.annee === a)) continue;'],
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
