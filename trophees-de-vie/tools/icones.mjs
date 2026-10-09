// Dessine les icônes de l'app : une coupe dorée sur le coucher de soleil. Lancer : npm run icones
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const COUPE = 'M6 3h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A6 6 0 0 1 7.3 12H7a4 4 0 0 1-4-4V5h3V3zM5 7v1a2 2 0 0 0 1 1.7V7H5zm14 0h-1v2.7A2 2 0 0 0 19 8V7z';
// Android rogne jusqu'à 20 % de chaque bord d'une icône « maskable » : la coupe y est plus petite.
const page = (taille, part) => `<!doctype html><style>html,body{margin:0}body{width:${taille}px;height:${taille}px;display:grid;place-items:center;background:linear-gradient(155deg,#1E4C78 0%,#2F719A 46%,#F2A680 100%)}svg{width:${Math.round(taille * part)}px;height:${Math.round(taille * part)}px}</style><svg viewBox="0 0 24 24"><path fill="#F2C261" fill-rule="evenodd" d="${COUPE}"/></svg>`;

mkdirSync('icons', { recursive: true });
const navigateur = await chromium.launch();
for (const [nom, taille, part] of [['icone-192', 192, 0.62], ['icone-512', 512, 0.62], ['icone-maskable-512', 512, 0.46]]) {
  const p = await navigateur.newPage({ viewport: { width: taille, height: taille } });
  await p.setContent(page(taille, part));
  await p.screenshot({ path: `icons/${nom}.png` });
  await p.close();
  console.log(nom);
}
await navigateur.close();
