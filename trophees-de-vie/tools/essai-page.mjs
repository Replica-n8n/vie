// Essai de bout en bout de la vraie page, dans Chromium : page vide, les trois volets,
// la persistance, les corrections, la sauvegarde, puis une vie d'exemple pour les
// tailles d'écran, les contrastes mesurés sur les pixels et les captures.
// Tout se passe dans des bases « essai-… » : la vraie base n'est jamais ouverte.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const CAPTURES = join(RACINE, 'maquettes', 'captures');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serveur = createServer(async (q, r) => {
  try {
    let chemin = normalize(decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (chemin.endsWith('\\') || chemin.endsWith('/')) chemin += 'index.html';
    r.writeHead(200, { 'content-type': TYPES[extname(chemin)] ?? 'application/octet-stream' }).end(await readFile(join(RACINE, chemin)));
  } catch { r.writeHead(404).end(); }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const ORIGINE = `http://127.0.0.1:${serveur.address().port}`;
await mkdir(CAPTURES, { recursive: true });

let echecs = 0;
const verifier = (nom, ok, detail = '') => { if (!ok) echecs += 1; console.log(`${ok ? 'ok   ' : 'ÉCHEC'} ${nom}${ok ? '' : ` → ${detail}`}`); };

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await contexte.newPage();
const erreurs = [];
const dehors = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('request', (q) => { if (!q.url().startsWith(ORIGINE) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) dehors.push(q.url()); });

const ouvrirPage = async (base) => { await page.goto(`${ORIGINE}/index.html?base=${base}`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); };
const effacer = (noms) => page.evaluate((ns) => Promise.all(ns.map((n) => new Promise((ok) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = () => ok(); }))), noms);
// Le volet se ferme avant que la page soit redessinée : on attend l'annonce, qui vient en dernier.
const annonce = (texte) => page.waitForFunction((t) => document.querySelector('#toast.on')?.textContent.includes(t), texte);
const nombres = () => page.$$eval('.cell .num', (xs) => xs.map((x) => x.textContent).join('/'));
const unEcran = () => page.evaluate(() => ({
  v: document.documentElement.scrollHeight > innerHeight, h: document.documentElement.scrollWidth > innerWidth,
  coupes: [...document.querySelectorAll('.p,.cell')].filter((x) => x.scrollHeight > x.clientHeight + 1 || x.scrollWidth > x.clientWidth + 1).map((x) => x.className),
  petits: [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && parseFloat(getComputedStyle(x).fontSize) < 14 && x.getClientRects().length).length,
}));

try {
  // ---------- Page vide ----------
  await page.goto(`${ORIGINE}/tests/stockage.html`);
  await effacer(['essai-page', 'essai-page-2', 'essai-exemple']);
  await ouvrirPage('essai-page');
  verifier('la page vide invite à commencer', (await page.textContent('#sv')).includes('Raconte ta vie en cinq minutes'));
  verifier('la page vide invite sur chaque axe au lieu d’afficher zéro', (await nombres()) === '0/+/+/+/+/+', await nombres());
  let e = await unEcran();
  verifier('la page vide tient sur un écran', !e.v && !e.h && !e.coupes.length, JSON.stringify(e));
  await page.screenshot({ path: join(CAPTURES, 'vide.png') });

  // ---------- Ajouter ----------
  await page.click('#sv .btn');
  verifier('« Commencer » ouvre le formulaire', await page.isVisible('.dlg'));
  verifier('onze passages proposés', (await page.$$('.dlg .puce')).length === 11);
  await page.click('#pu-diplome'); await page.fill('#an-diplome', '2015');
  await page.click('#pu-premier-chez-moi'); await page.click('#nv-premier-chez-moi-montagne');
  await page.fill('#q-autre', 'Permis de conduire'); await page.fill('#a-autre', '2010'); await page.click('#n-autre-effort');
  await page.screenshot({ path: join(CAPTURES, 'ajouter-1.png') });
  await page.click('#dlg-next');
  verifier('trente propositions à toucher, six par axe', (await page.$$('.dlg .puce')).length === 30 && (await page.$$('.dlg .groupe')).length === 5);
  await page.click('#pu-amis-longue-date'); await page.fill('#an-amis-longue-date', '2008'); await page.click('#nv-amis-longue-date-montagne');
  await page.click('#pu-vivre-ailleurs'); await page.fill('#an-vivre-ailleurs', '3000');
  await page.click('#pu-dire-merci'); await page.click('#pu-dire-merci');
  verifier('décocher une proposition la referme', !(await page.$('#an-dire-merci')) && (await page.getAttribute('#pu-dire-merci', 'aria-pressed')) === 'false');
  await page.screenshot({ path: join(CAPTURES, 'ajouter-2.png') });
  await page.click('#dlg-next');
  await page.fill('#q-s-beau', 'Le jour où j’ai eu les clés'); await page.fill('#a-s-beau', '2017');
  await page.screenshot({ path: join(CAPTURES, 'ajouter-3.png') });
  await page.click('#dlg-next');
  await annonce('6 moments ajoutés');
  verifier('six moments ajoutés : le total et les axes suivent', (await nombres()) === '6/1/+/+/1/+', await nombres());
  verifier('le total dit les passages', (await page.textContent('.cell')).includes('dont 3 passages'), await page.textContent('.cell'));
  verifier('la notification annonce le compte', (await page.textContent('#toast')).includes('6 moments ajoutés'), await page.textContent('#toast'));
  verifier('une année impossible est ignorée, le moment va dans « Un jour »', (await page.$$('#ruban .an')).length === new Date().getFullYear() - 2008 + 1);
  verifier('l’amitié est une montagne, en or', (await page.$$('.cell:nth-child(5) .m.montagne')).length === 1);
  verifier('la légende compte les niveaux', (await page.textContent('.leg')).replace(/\s+/g, ' ').includes('3 montagnes') && (await page.textContent('.leg')).includes('1 effort'), await page.textContent('.leg'));

  // ---------- Persistance ----------
  await ouvrirPage('essai-page');
  verifier('après rechargement, tout est encore là', (await nombres()) === '6/1/+/+/1/+', await nombres());
  await page.click('#btn-add');
  verifier('un passage déjà vécu ne se recoche pas', await page.isDisabled('#pu-diplome') && !(await page.isDisabled('#pu-mariage')));
  await page.keyboard.press('Escape');
  verifier('Échap ferme le volet', await page.isHidden('.dlg'));

  // ---------- Une tuile d'axe ouvre ses propositions ----------
  await page.click('.cell.axe >> nth=1');
  verifier('la tuile « Vivre hors du travail » ouvre ses six propositions', (await page.textContent('#dlg-t')) === 'Vivre hors du travail' && (await page.$$('.dlg .puce')).length === 6);
  await page.click('#pu-hors-vacances');
  await page.screenshot({ path: join(CAPTURES, 'axe.png') });
  await page.click('#dlg-next'); await annonce('Moment ajouté');
  verifier('toucher une proposition remplit la tuile', (await nombres()) === '7/1/1/+/1/+', await nombres());
  await page.click('.cell.axe >> nth=3');
  verifier('une proposition déjà faite reste cochée et ne se recoche pas', await page.isDisabled('#pu-amis-longue-date'));
  await page.keyboard.press('Escape');

  // ---------- Faire le point ----------
  verifier('sans point, la page le dit', (await page.textContent('#temps')) === 'Pas encore de point');
  await page.click('#btn-point');
  await page.$eval('#sl-sante', (c) => { c.value = 9; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.screenshot({ path: join(CAPTURES, 'point-1.png') });
  await page.click('#dlg-next'); await page.click('.opt:has-text("Grand soleil")');
  await page.click('#dlg-next'); await page.click('.opt:has-text("Oui")'); await page.fill('#q-fierte', 'Mon balcon fleuri');
  await page.click('#dlg-next'); await annonce('C’est noté');
  verifier('le point s’affiche : météo, carte, phrase', (await page.textContent('#temps')) === 'Grand soleil' && (await page.textContent('#radar')).includes('Santé 9') && (await page.textContent('#synth')) === 'Premier point posé.', `${await page.textContent('#temps')} | ${await page.textContent('#synth')}`);
  verifier('le ciel suit la météo', (await page.getAttribute('html', 'data-meteo')) === '5');
  verifier('la fierté du mois rejoint la vie', (await nombres()) === '8/1/1/+/1/1', await nombres());
  await page.click('#btn-point');
  verifier('refaire le point repart du dernier', (await page.inputValue('#sl-sante')) === '9');
  await page.click('#dlg-next'); await page.click('.opt:has-text("Orageux")'); await page.click('#dlg-next'); await page.waitForFunction(() => !document.querySelector('#toast.on')); await page.click('#dlg-next');
  await annonce('C’est noté');
  const nbPoints = await page.evaluate(async () => { const { ouvrir } = await import('/js/stockage.js'); const b = await ouvrir('essai-page'); const n = (await b.tout('points')).length; b.fermer(); return n; });
  verifier('deux points le même mois n’en font qu’un', nbPoints === 1 && (await page.textContent('#temps')) === 'Orageux' && (await page.getAttribute('html', 'data-meteo')) === '1', `${nbPoints} point(s)`);

  // ---------- Tout voir ----------
  await page.click('#btn-parcours');
  verifier('le parcours liste les huit moments', (await page.$$('.annee li')).length === 8);
  verifier('le moment sans année est rangé dans « Un jour »', (await page.textContent('.annee:last-child')).includes('Un jour') && (await page.textContent('.annee:last-child')).includes('Partir vivre ailleurs'));
  await page.screenshot({ path: join(CAPTURES, 'parcours.png') });
  // Chaque geste écrit dans la base puis redessine : on attend que l'écran ait suivi avant le geste suivant.
  for (let i = 0; i < 3; i += 1) {
    await page.click(`.annee li >> nth=${i} >> .mini:has-text("Haut fait")`);
    await page.waitForFunction((n) => document.querySelectorAll('#feats li').length === n, i + 1);
  }
  await page.click('.annee li >> nth=3 >> .mini:has-text("Haut fait")');
  await annonce('Trois hauts faits au plus');
  verifier('trois hauts faits au plus', (await page.$$('#feats li')).length === 3 && (await page.$$('.mini[aria-pressed="true"]')).length === 3);
  await page.click('.annee li:has-text("Permis de conduire") .mini:has-text("Modifier")');
  await page.fill('#q-edit', 'Mon permis, enfin'); await page.click('#n-edit-montagne'); await page.fill('#q-note', 'À la troisième tentative.');
  await page.click('#dlg-next'); await page.waitForSelector('.annee');
  verifier('une correction s’enregistre et se voit', (await page.textContent('.dlg-body')).includes('Mon permis, enfin') && (await page.textContent('.dlg-body')).includes('À la troisième tentative.') && (await page.$$('.annee li:has-text("Mon permis, enfin") .m.montagne')).length === 1);
  await page.click('.annee li:has-text("Mon balcon fleuri") .mini:has-text("Retirer")');
  await annonce('Moment retiré');
  verifier('retirer enlève le moment partout', (await page.$$('.annee li')).length === 7 && (await nombres()).startsWith('7/'), await nombres());
  await page.click('#toast button');
  await page.waitForFunction(() => document.querySelectorAll('.annee li').length === 8);
  verifier('« Annuler » le remet', (await nombres()).startsWith('8/'), await nombres());
  await page.click('#dlg-next');

  // ---------- Sauvegarde ----------
  await page.click('#btn-sauvegarde');
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.click('.dlg .btn:has-text("Télécharger")')]);
  const fichier = join(CAPTURES, 'sauvegarde-essai.json');
  await telechargement.saveAs(fichier);
  const contenu = JSON.parse(await readFile(fichier, 'utf8'));
  verifier('la sauvegarde contient la vie', contenu.format === 'trophees-de-vie' && contenu.magasins.moments.length === 8 && contenu.magasins.points.length === 1, telechargement.suggestedFilename());
  await ouvrirPage('essai-page-2');
  await page.click('#btn-sauvegarde');
  await page.setInputFiles('#fichier', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('pas du json') });
  await page.waitForFunction(() => document.querySelector('.alerte')?.textContent);
  verifier('un fichier illisible est refusé avec une phrase', (await page.textContent('.alerte')) === 'Ce fichier n’est pas lisible.', await page.textContent('.alerte'));
  await page.setInputFiles('#fichier', fichier);
  await annonce('Sauvegarde reprise');
  verifier('la sauvegarde se reprend ailleurs, à l’identique', (await nombres()) === '8/1/1/+/1/1' && (await page.textContent('#temps')) === 'Orageux' && (await page.$$('#feats li')).length === 3, await nombres());

  // ---------- Une vie d'exemple : tailles, contrastes, captures ----------
  await page.evaluate(async () => {
    const { ouvrir } = await import('/js/stockage.js');
    const { MOMENTS, POINTS } = await import('/tests/exemple.js');
    const b = await ouvrir('essai-exemple');
    const an = new Date(); const mois = (n) => { const t = an.getFullYear() * 12 + an.getMonth() - n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
    const jour = `${String(an.getMonth() + 1).padStart(2, '0')}-${String(an.getDate()).padStart(2, '0')}`;
    for (const m of MOMENTS) await b.ecrire('moments', m.id === 'semi' ? { ...m, date: `${an.getFullYear() - 2}-${jour}`, annee: an.getFullYear() - 2 } : m);
    for (const [i, p] of POINTS.entries()) await b.ecrire('points', { ...p, mois: mois([4, 3, 1, 0][i]) });
    b.fermer();
  });
  for (const [w, h] of [[1280, 720], [1920, 1080], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await ouvrirPage('essai-exemple');
    e = await unEcran();
    verifier(`une vie remplie tient sur un écran en ${w} × ${h}, sans texte sous 14 px`, !e.v && !e.h && !e.coupes.length && !e.petits, JSON.stringify(e));
  }
  verifier('le souvenir du jour est l’anniversaire', (await page.textContent('#sv')).includes('Il y a 2 ans aujourd’hui') && (await page.textContent('#sv')).includes('semi-marathon'), await page.textContent('#sv'));
  verifier('la carte se compare au point d’il y a trois mois', (await page.textContent('#synth')).startsWith('Amour, Santé, Proches et Cadre de vie montent depuis'), await page.textContent('#synth'));
  await page.screenshot({ path: join(CAPTURES, 'page.png') });

  // Contrastes : on rend le texte transparent, on relève le fond sous chaque texte, ciel le plus clair.
  await page.evaluate(() => document.documentElement.setAttribute('data-meteo', '5'));
  const cibles = ['#today', 'h1', '.sv .k', '.sv .t', '.sv .q', '.cell .num', '.cell .n', '.cell .petit', '.leg span', '.lab', '.lien', '.ans span', '.temps', '#synth', '.hf strong', '.hf .petit', '#btn-point'];
  const zones = await page.evaluate((sels) => sels.flatMap((sel) => [...document.querySelectorAll(sel)].map((x) => { const r = document.createRange(); r.selectNodeContents(x); const b = r.getBoundingClientRect(); return { sel, x: b.left, y: b.top, w: b.width, h: b.height, c: getComputedStyle(x).color, gros: parseFloat(getComputedStyle(x).fontSize) >= 24 }; })).filter((z) => z.w > 2), cibles);
  const radarTextes = await page.$$eval('#radar text', (ts) => ts.map((t) => { const b = t.getBoundingClientRect(); return { sel: 'radar', x: b.left, y: b.top, w: b.width, h: b.height, c: getComputedStyle(t).fill, gros: false }; }));
  const style = await page.addStyleTag({ content: '*{color:transparent !important} svg text,svg tspan{fill:transparent !important} .m{visibility:hidden}' });
  const capture = (await page.screenshot()).toString('base64');
  await style.evaluate((n) => n.remove());
  const mesures = await page.evaluate(async ({ capture, zones }) => {
    const img = new Image(); img.src = `data:image/png;base64,${capture}`; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    const canal = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (r, g, b) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
    return zones.map((z) => {
      const [r, g, b] = z.c.match(/[\d.]+/g).map(Number); const lt = lum(r, g, b);
      const d = cx.getImageData(Math.floor(z.x), Math.floor(z.y), Math.max(1, Math.floor(z.w)), Math.max(1, Math.floor(z.h))).data;
      let pire = 99;
      for (let i = 0; i < d.length; i += 4) { const lf = lum(d[i], d[i + 1], d[i + 2]); pire = Math.min(pire, (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05)); }
      return { sel: z.sel, pire, seuil: z.gros ? 3 : 4.5 };
    });
  }, { capture, zones: [...zones, ...radarTextes] });
  const bas = mesures.filter((x) => x.pire < x.seuil).map((x) => `${x.sel} ${x.pire.toFixed(2)}`);
  const plusBas = mesures.reduce((a, b) => (b.pire / b.seuil < a.pire / a.seuil ? b : a));
  verifier(`les contrastes tiennent sur les pixels, ciel le plus clair (le plus juste : ${plusBas.sel} à ${plusBas.pire.toFixed(2)})`, !bas.length, [...new Set(bas)].join(' ; '));

  await page.setViewportSize({ width: 400, height: 800 });
  await ouvrirPage('essai-exemple');
  verifier('sur un écran étroit la page défile sans déborder en largeur', !(await unEcran()).h);

  verifier('aucune requête ne sort de la page', !dehors.length, dehors.join(', '));
  verifier('aucune erreur de script', !erreurs.length, erreurs.join(' | '));
  await effacer(['essai-page', 'essai-page-2', 'essai-exemple']);
} catch (erreur) {
  verifier('l’essai va au bout', false, erreur.stack || erreur);
} finally {
  await navigateur.close();
  serveur.close();
}
console.log(echecs ? `${echecs} échec(s)` : 'la page tient');
process.exit(echecs ? 1 : 0);
