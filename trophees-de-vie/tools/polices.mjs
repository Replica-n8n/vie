// Télécharge les polices dans polices/ pour que la page n'appelle aucun serveur tiers.
// Sous-ensemble latin seulement (il contient « œ »). À relancer si on change de police.
import { writeFile } from 'node:fs/promises';

const CSS = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const NOMS = {
  'Bricolage Grotesque|normal|300 800': 'bricolage.woff2',
  'Atkinson Hyperlegible|normal|400': 'atkinson-400.woff2',
  'Atkinson Hyperlegible|normal|700': 'atkinson-700.woff2',
  'Atkinson Hyperlegible|italic|400': 'atkinson-400-italique.woff2',
};

const css = await (await fetch(CSS, { headers: { 'user-agent': UA } })).text();
const blocs = [...css.matchAll(/\/\* latin \*\/\s*@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
let faits = 0;
for (const bloc of blocs) {
  const lire = (cle) => bloc.match(new RegExp(`${cle}:\s*([^;]+);`))?.[1].trim().replace(/'/g, '');
  const cle = `${lire('font-family')}|${lire('font-style')}|${lire('font-weight')}`;
  const url = bloc.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!NOMS[cle] || !url) { console.log('ignoré :', cle); continue; }
  const octets = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(new URL(`../polices/${NOMS[cle]}`, import.meta.url), octets);
  console.log(`${NOMS[cle]} : ${Math.round(octets.length / 1024)} Ko`);
  faits += 1;
}
if (faits !== Object.keys(NOMS).length) { console.error(`${faits} polices sur ${Object.keys(NOMS).length}`); process.exit(1); }
