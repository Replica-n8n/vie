// Essaie js/stockage.js dans un vrai Chromium : IndexedDB n'existe pas dans Node.
// Sert le dépôt sur un port libre, ouvre tests/stockage.html et lit ses contrôles.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const serveur = createServer(async (requete, reponse) => {
  try {
    const chemin = normalize(decodeURIComponent(new URL(requete.url, 'http://x').pathname));
    const contenu = await readFile(join(RACINE, chemin));
    reponse.writeHead(200, { 'content-type': TYPES[extname(chemin)] ?? 'application/octet-stream' }).end(contenu);
  } catch {
    reponse.writeHead(404).end();
  }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const { port } = serveur.address();

const navigateur = await chromium.launch();
let echecs = 1;
try {
  const page = await navigateur.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/tests/stockage.html`);
  await page.waitForFunction(() => window.resultat, null, { timeout: 20000 });
  const controles = await page.evaluate(() => window.resultat);
  for (const c of controles) console.log(`${c.ok ? 'ok   ' : 'ÉCHEC'} ${c.nom}${c.ok ? '' : ` → ${c.detail}`}`);
  for (const e of erreurs) console.log(`ERREUR DE PAGE ${e}`);
  echecs = controles.filter((c) => !c.ok).length + erreurs.length;
  console.log(echecs ? `${echecs} échec(s)` : 'le stockage tient');
} finally {
  await navigateur.close();
  serveur.close();
}
process.exit(echecs ? 1 : 0);
