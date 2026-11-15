// Télécharge les polices dans polices/ pour que la page n'appelle aucun serveur tiers.
// Sous-ensemble latin seulement (il contient « œ »). À relancer si on change de police.
import { writeFile } from 'node:fs/promises';

const CSS = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=Roboto+Flex:wdth,wght@25..151,100..1000&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const NOMS = { 'Big Shoulders Display': 'big-shoulders-900.woff2', 'Roboto Flex': 'roboto-flex.woff2' };

const css = await (await fetch(CSS, { headers: { 'user-agent': UA } })).text();
const blocs = [...css.matchAll(/\/\* latin \*\/\s*@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
let faits = 0;
for (const bloc of blocs) {
  const famille = bloc.match(/font-family:\s*'([^']+)'/)?.[1];
  const url = bloc.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!NOMS[famille] || !url) continue;
  const octets = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(new URL(`../polices/${NOMS[famille]}`, import.meta.url), octets);
  console.log(`${NOMS[famille]} : ${Math.round(octets.length / 1024)} Ko`);
  faits += 1;
}
if (faits !== Object.keys(NOMS).length) { console.error(`${faits} polices sur ${Object.keys(NOMS).length}`); process.exit(1); }
