// Dessine les icônes de l'app : le biscuit bleu « Cuisiné » sur le pastel de la courge.
// Lancer : node tools/icones.mjs (Playwright du dossier trophees-de-vie).
import { chromium } from '../../trophees-de-vie/node_modules/playwright/index.mjs';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FESTON = readFileSync(new URL('./feston.txt', import.meta.url), 'utf8');
// Android rogne jusqu'à 20 % de chaque bord d'une icône « maskable » : le biscuit y est plus petit.
const page = (taille, part) => `<!doctype html><style>html,body{margin:0}body{width:${taille}px;height:${taille}px;display:grid;place-items:center;background:#ffd5b4}svg{width:${Math.round(taille * part)}px;height:${Math.round(taille * part)}px}</style><svg viewBox="0 0 76 76"><path d="${FESTON}" fill="#4662cf"/><path d="M27 39l8 8 15-17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

mkdirSync(new URL('../icons', import.meta.url), { recursive: true });
const navigateur = await chromium.launch();
for (const [nom, taille, part] of [['icone-192', 192, 0.8], ['icone-512', 512, 0.8], ['icone-maskable-512', 512, 0.58]]) {
  const p = await navigateur.newPage({ viewport: { width: taille, height: taille } });
  await p.setContent(page(taille, part));
  await p.screenshot({ path: fileURLToPath(new URL(`../icons/${nom}.png`, import.meta.url)) });
  await p.close();
  console.log(nom);
}
await navigateur.close();
