// Essai de bout en bout de la vraie page, dans Chromium : page vide, les volets,
// la persistance, les corrections, la sauvegarde, une base écrite par les versions
// précédentes, puis une vie d'exemple pour les tailles d'écran, les contrastes mesurés
// sur les pixels et les captures.
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
const BASES = ['essai-page', 'essai-page-2', 'essai-exemple', 'essai-ancien'];
const AN = new Date().getFullYear();

let echecs = 0;
const verifier = (nom, ok, detail = '') => { if (!ok) echecs += 1; console.log(`${ok ? 'ok   ' : 'ÉCHEC'} ${nom}${ok ? '' : ` → ${detail}`}`); };

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await contexte.newPage();
page.setDefaultTimeout(10000);
const erreurs = [];
const dehors = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('request', (q) => { if (!q.url().startsWith(ORIGINE) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) dehors.push(q.url()); });

const ouvrirPage = async (base) => { await page.goto(`${ORIGINE}/index.html?base=${base}`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); };
// Effacer une base depuis la page qui l'a ouverte attendrait pour toujours : on part d'une page qui n'ouvre rien.
const effacer = async () => { await page.goto(`${ORIGINE}/icone.svg`); await page.evaluate((ns) => Promise.all(ns.map((n) => new Promise((ok) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = () => ok(); }))), BASES); };
// Le volet se ferme avant que la page soit redessinée : on attend l'annonce, qui vient en dernier.
const annonce = (texte) => page.waitForFunction((t) => document.querySelector('#toast.on')?.textContent.includes(t), texte);
const nombres = () => page.$$eval('#bl-total .num, .cell .nb', (xs) => xs.map((x) => x.textContent).join('/'));
const texte = (sel) => page.textContent(sel).then((t) => t.replace(/\s+/g, ' ').trim());
const unEcran = () => page.evaluate(() => ({
  v: document.documentElement.scrollHeight > innerHeight, h: document.documentElement.scrollWidth > innerWidth,
  coupes: [...document.querySelectorAll('.p,.cell')].filter((x) => x.scrollHeight > x.clientHeight + 1 || x.scrollWidth > x.clientWidth + 1).map((x) => x.className),
  petits: [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && parseFloat(getComputedStyle(x).fontSize) < 14 && x.getClientRects().length).length,
}));

try {
  // ---------- Page vide ----------
  await effacer();
  await ouvrirPage('essai-page');
  verifier('la page vide invite à commencer', (await texte('#sv')).includes('Tout ce que tu as déjà fait'));
  verifier('la page vide invite sur chaque catégorie au lieu d’afficher zéro', (await nombres()) === '0/+/+/+/+/+/+' && await page.isHidden('.bl'), await nombres());
  let e = await unEcran();
  verifier('la page vide tient sur un écran', !e.v && !e.h && !e.coupes.length, JSON.stringify(e));
  await page.screenshot({ path: join(CAPTURES, 'vide.png') });

  // ---------- Ajouter : deux écrans, tout se touche ----------
  await page.click('#sv .btn');
  verifier('« Commencer » ouvre le formulaire, trois catégories par écran', await page.isVisible('.dlg') && (await page.$$('.dlg .groupe')).length === 3);
  verifier('le titre dit qu’on peut tout cocher', (await texte('#dlg-t')) === 'Coche tout ce que tu as déjà fait');
  await page.fill('#naissance', '1992');
  await page.click('#pu-master'); await page.fill('#an-master', '2015');
  verifier('l’année est annoncée comme facultative', (await page.getAttribute('#an-master', 'placeholder')) === 'Année (facultatif)');
  await page.click('#pu-proprietaire'); await page.fill('#an-proprietaire', '2021');
  await page.click('#pu-premier-emploi'); await page.fill('#an-premier-emploi', '2015');
  verifier('une réussite cochée ne demande aucune médaille', (await page.$$('.dlg .puce .niv')).length === 0);
  verifier('l’en-tête compte ce qui est coché', (await texte('#dlg-step')) === 'Ta vie · 1 sur 2 · 3 cochées', await texte('#dlg-step'));
  await page.click('#pu-langues-2');
  verifier('ce qui n’est pas un événement ne demande pas d’année', !(await page.$('#an-langues-2')) && (await page.getAttribute('#pu-langues-2', 'aria-pressed')) === 'true');
  await page.click('#pu-langues-2');
  await page.click('#pu-trouver-voie'); await page.click('#pu-trouver-voie');
  verifier('décocher une réussite la referme', !(await page.$('#an-trouver-voie')) && (await page.getAttribute('#pu-trouver-voie', 'aria-pressed')) === 'false');
  await page.screenshot({ path: join(CAPTURES, 'ajouter-1.png') });
  await page.click('#dlg-next');
  await page.click('#pu-vivre-etranger'); await page.fill('#an-vivre-etranger', '3000');
  await page.click('#pu-marathon'); await page.fill('#an-marathon', '2008');
  await page.click('#pu-enfant'); await page.fill('#de-enfant', 'La naissance de Lou');
  verifier('« Me relever d’un coup dur » n’est plus proposé', !(await page.$('#pu-rebondir')));
  await page.screenshot({ path: join(CAPTURES, 'ajouter-2.png') });
  await page.click('#dlg-next');
  await page.waitForFunction(() => document.querySelector('#dlg-t')?.textContent === 'C’est ta vie jusqu’ici' && !document.getElementById('scrim').hidden);
  verifier('le formulaire se conclut : le compte, les médailles, et quoi faire ensuite', (await texte('.bilan')).replace(/ /g, '') === '6trophées4enor2enbronzeTouche-à-tout' && (await texte('#dlg-step')) === '6 trophées ajoutés' && (await texte('.dlg .aide')).includes('Reviens-y'), `${await texte('.bilan')} | ${await texte('#dlg-step')}`);
  await page.screenshot({ path: join(CAPTURES, 'bilan.png') });
  await page.click('#dlg-next');
  verifier('« Voir ma page » referme', await page.isHidden('.dlg'));
  verifier('six trophées ajoutés : le total et les catégories suivent', (await nombres()) === '6/1/1/1/1/1/1', await nombres());
  verifier('la légende compte les médailles : la rareté décide, sinon le choix', (await texte('.leg')).replace(/ /g, '') === '4enor2enbronze', await texte('.leg'));
  verifier('acheté à 29 ans : en or, grâce à l’année de naissance', (await page.$$('#axes .cell:nth-child(3) .m.or')).length === 1);
  verifier('le ruban montre les âges : adolescence, vingtaine, trentaine', (await page.$$eval('#ages span', (xs) => xs.map((x) => x.textContent).join('|'))) === 'l’adolescence|la vingtaine', await page.$$eval('#ages span', (xs) => xs.map((x) => x.textContent).join('|')));
  verifier('une année impossible est ignorée, et le ruban s’arrête au dernier trophée (2008 à 2021)', (await page.$$('#ruban .an')).length === 14, String((await page.$$('#ruban .an')).length));
  verifier('chaque tuile nomme ses réussites', (await texte('.cell.axe >> nth=0')).includes('Un master') && (await texte('.cell.axe >> nth=2')).includes('Acheter mon logement') && (await texte('.cell.axe >> nth=4')).includes('La naissance de Lou'), await texte('#axes'));
  verifier('un trophée dans chaque catégorie : le badge Touche-à-tout', (await texte('#bl-total')).includes('Touche-à-tout'));
  verifier('sans rien d’épinglé, les plus rares tiennent lieu de hauts faits', (await texte('#hf-t')) === 'Tes plus rares' && (await page.$$('#feats li')).length === 3 && (await texte('#feats li >> nth=0')).includes('Vivre dans un autre pays'), await texte('.bl'));

  // ---------- Persistance ----------
  await ouvrirPage('essai-page');
  verifier('après rechargement, tout est encore là', (await nombres()) === '6/1/1/1/1/1/1', await nombres());
  await page.click('#btn-add');
  verifier('l’année de naissance est gardée', (await page.inputValue('#naissance')) === '1992');
  verifier('une réussite déjà faite ne se recoche pas', await page.isDisabled('#pu-master') && !(await page.isDisabled('#pu-doctorat')));
  await page.keyboard.press('Escape');
  verifier('Échap ferme le volet', await page.isHidden('.dlg'));

  // ---------- Une tuile ouvre sa catégorie ----------
  await page.click('.cell.axe >> nth=0');
  verifier('la tuile « Apprendre » ouvre ses réussites', (await texte('#dlg-t')) === 'Apprendre' && (await page.$$('.dlg .puce')).length === 6);
  verifier('là où l’on choisit encore la médaille, chaque coupe porte son nom', (await texte('#n-libre-bronze')) === 'Bronze' && (await texte('#n-libre-or')) === 'Or');
  await page.click('#pu-diplome'); await page.fill('#an-diplome', '2013');
  await page.fill('#q-libre', 'Le bac'); await page.fill('#a-libre', '2010'); await page.click('#n-libre-bronze');
  await page.screenshot({ path: join(CAPTURES, 'categorie.png') });
  await page.click('#dlg-next'); await annonce('2 trophées ajoutés');
  verifier('une réussite écrite à la main entre dans la catégorie de la tuile', (await nombres()) === '8/3/1/1/1/1/1', await nombres());
  // Depuis sa tuile, un trophée déjà enregistré se rouvre, se retire, et se remet.
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  await page.click('.cell.axe >> nth=0');
  verifier('dans la tuile, les trophées déjà enregistrés proposent « modifier »', (await texte('#pu-master')).includes('modifier') && (await texte('.dlg-body')).includes('Le bac'));
  await page.click('#pu-master');
  verifier('toucher un trophée enregistré ouvre sa fiche', (await page.inputValue('#q-edit')) === 'Un master' && Boolean(await page.$('#retirer')));
  await page.click('#retirer');
  await annonce('Trophée retiré');
  verifier('« Retirer ce trophée » l’enlève de la page', (await nombres()) === '7/2/1/1/1/1/1' && (await page.isHidden('.dlg')), await nombres());
  await page.click('#toast button');
  await page.waitForFunction(() => document.querySelector('#bl-total .num')?.textContent === '8');
  verifier('« Annuler » le remet', (await nombres()) === '8/3/1/1/1/1/1', await nombres());
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  verifier('un diplôme du supérieur est en argent', (await page.$$('#axes .cell:nth-child(1) .m.argent')).length === 1);
  verifier('trois trophées dans « Apprendre » : le badge « Tête bien faite »', (await texte('.cell.axe >> nth=0 >> .badge')) === 'Tête bien faite');

  // ---------- Faire le point ----------
  verifier('sans point, la page le dit', (await texte('#temps')) === 'Pas encore de point');
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  await page.click('#btn-point');
  await page.$eval('#sl-sante', (c) => { c.value = 9; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.screenshot({ path: join(CAPTURES, 'point-1.png') });
  await page.click('#dlg-next'); await page.click('.opt:has-text("Grand soleil")');
  await page.click('#dlg-next'); await page.click('.opt:has-text("Oui")');
  await page.click('#dlg-next'); await annonce('C’est noté');
  verifier('le point s’affiche : météo, carte, phrase', (await texte('#temps')) === 'Grand soleil' && (await texte('#stats')).includes('Santé 9') && (await page.getAttribute('.cv', 'title')) === 'Premier point posé.', `${await texte('#temps')} | ${await page.getAttribute('.cv', 'title')}`);
  verifier('le ciel ne change pas avec la météo', (await page.getAttribute('html', 'data-meteo')) === null);
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  await page.click('#btn-point');
  verifier('refaire le point repart du dernier', (await page.inputValue('#sl-sante')) === '9');
  await page.click('#dlg-next'); await page.click('.opt:has-text("Orageux")'); await page.click('#dlg-next'); await page.click('#dlg-next');
  await annonce('C’est noté');
  const nbPoints = await page.evaluate(async () => { const { ouvrir } = await import('/js/stockage.js'); const b = await ouvrir('essai-page'); const n = (await b.tout('points')).length; b.fermer(); return n; });
  verifier('deux points le même mois n’en font qu’un', nbPoints === 1 && (await texte('#temps')) === 'Orageux', `${nbPoints} point(s)`);

  // ---------- Tout voir ----------
  await page.click('#btn-parcours');
  verifier('le parcours liste les huit trophées', (await page.$$('.annee li')).length === 8);
  verifier('une réussite précisée à la saisie porte sa précision', (await texte('.dlg-body')).includes('La naissance de Lou') && !(await texte('.dlg-body')).includes('Avoir un enfant'));
  verifier('le trophée sans année est rangé dans « Un jour »', (await texte('.annee:last-child')).includes('Un jour') && (await texte('.annee:last-child')).includes('Vivre dans un autre pays'));
  verifier('« Top N % » se lit sur l’or qui a un chiffre, et seulement là', (await texte('.annee li:has-text("Un master")')).includes('Top 16 %') && (await texte('.annee li:has-text("Acheter mon logement")')).includes('Top 17 %') && !(await texte('.annee li:has-text("Un diplôme du supérieur")')).includes('Top') && !(await texte('.annee li:has-text("Courir un marathon")')).includes('Top'));
  await page.screenshot({ path: join(CAPTURES, 'parcours.png') });
  // Chaque geste écrit dans la base puis redessine : on attend que l'écran ait suivi avant le geste suivant.
  for (let i = 0; i < 3; i += 1) {
    await page.click(`.annee li >> nth=${i} >> .mini:has-text("Haut fait")`);
    await page.waitForFunction((n) => document.querySelectorAll('#feats li').length === n, i + 1);
  }
  await page.click('.annee li >> nth=3 >> .mini:has-text("Haut fait")');
  await annonce('Trois hauts faits au plus');
  verifier('trois hauts faits au plus', (await page.$$('#feats li')).length === 3 && (await page.$$('.mini[aria-pressed="true"]')).length === 3);
  await page.click('.annee li:has-text("Le bac") .mini:has-text("Modifier")');
  verifier('une réussite écrite à la main se corrige : médaille et catégorie', Boolean(await page.$('#n-edit-or')) && (await page.$$('.dlg .opts .opt')).length === 6);
  await page.fill('#q-edit', 'Mon bac, mention bien'); await page.click('#n-edit-argent'); await page.click('.dlg .opt:has-text("Se dépasser")'); await page.fill('#q-note', 'Le jour des résultats.');
  await page.click('#dlg-next'); await page.waitForSelector('.annee');
  verifier('la correction s’enregistre et se voit', (await texte('.dlg-body')).includes('Mon bac, mention bien') && (await texte('.dlg-body')).includes('Le jour des résultats.') && (await page.$$('.annee li:has-text("Mon bac, mention bien") .m.argent')).length === 1 && (await nombres()) === '8/2/1/1/1/1/2', await nombres());
  await page.click('.annee li:has-text("Un master") .mini:has-text("Modifier")');
  verifier('avec un chiffre, la médaille ne se choisit pas', !(await page.$('#n-edit-or')) && (await page.$$('.dlg .opts .opt')).length === 0);
  await page.click('#dlg-next'); await page.waitForSelector('.annee');
  await page.click('.annee li:has-text("Premier emploi") .mini:has-text("Retirer")');
  await annonce('Trophée retiré');
  verifier('retirer enlève le trophée partout', (await page.$$('.annee li')).length === 7 && (await nombres()).startsWith('7/'), await nombres());
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
  verifier('la sauvegarde contient la vie et l’année de naissance', contenu.format === 'trophees-de-vie' && contenu.magasins.moments.length === 8 && contenu.magasins.points.length === 1 && contenu.magasins.reglages.some((x) => x.cle === 'naissance' && x.valeur === 1992), telechargement.suggestedFilename());
  await ouvrirPage('essai-page-2');
  await page.click('#btn-sauvegarde');
  await page.setInputFiles('#fichier', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('pas du json') });
  await page.waitForFunction(() => document.querySelector('.alerte')?.textContent);
  verifier('un fichier illisible est refusé avec une phrase', (await texte('.alerte')) === 'Ce fichier n’est pas lisible.', await texte('.alerte'));
  await page.setInputFiles('#fichier', fichier);
  await annonce('Sauvegarde reprise');
  verifier('la sauvegarde se reprend ailleurs, à l’identique', (await nombres()) === '8/2/1/1/1/1/2' && (await texte('#temps')) === 'Orageux' && (await page.$$('#feats li')).length === 3 && (await page.$$('#axes .cell:nth-child(3) .m.or')).length === 1, await nombres());

  // ---------- Une base écrite par les versions 1 et 2 ----------
  await page.goto(`${ORIGINE}/icone.svg`);
  await page.evaluate(async () => {
    const { ouvrir } = await import('/js/stockage.js');
    const b = await ouvrir('essai-ancien');
    const v1 = (passage, titre, annee) => b.ecrire('moments', { genre: 'passage', passage, scene: null, axe: null, titre, niveau: 'cap', annee, date: null, note: '', hautFait: false, rappel: true });
    await v1('quitter-maison', 'Quitter la maison', 2008); await v1('diplome', 'Un diplôme', 2011); await v1('premier-argent', 'Mon premier argent gagné', 2011);
    await v1('premier-emploi', 'Premier emploi', 2015); await v1('premier-chez-moi', 'Mon premier chez-moi', 2016); await v1('grand-voyage', 'Un grand voyage', 2018);
    await b.ecrire('moments', { genre: 'axe', passage: null, scene: null, axe: 'hors', proposition: 'hors-vacances', titre: 'Prendre de vraies vacances', niveau: 'montagne', annee: 2022, date: null });
    await b.ecrire('moments', { genre: 'axe', passage: null, scene: null, axe: 'vivre', proposition: 'vivre-ailleurs', titre: 'Partir vivre ailleurs', niveau: 'effort', annee: 2018, date: null });
    b.fermer();
  });
  await ouvrirPage('essai-ancien');
  verifier('ses six passages de la version 1 se rangent dans les catégories', (await nombres()) === '8/1/2/2/2/+/+', await nombres());
  verifier('sans année de naissance, le ruban propose de la donner', (await texte('#ages')) === 'Situer mes trophées à mon âge');
  await page.click('#ages');
  await page.fill('#naissance', '1990'); await page.click('#dlg-next'); await annonce('C’est noté');
  verifier('l’année de naissance se donne depuis le ruban, et les âges apparaissent', (await page.$$eval('#ages span', (xs) => xs.map((x) => x.textContent).filter(Boolean).join('|'))) === 'la vingtaine|la trentaine' && (await page.$$('#ages span')).length === 3, await texte('#ages'));
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  // Le souvenir est tiré au sort selon le jour : on cherche un jour où il tombe sur un titre général.
  for (let j = 1; j <= 28; j += 1) {
    await page.goto(`${ORIGINE}/index.html?base=essai-ancien&jour=2026-03-${String(j).padStart(2, '0')}`, { waitUntil: 'networkidle' });
    if (await page.$('#preciser')) break;
  }
  verifier('le bandeau propose de préciser un trophée au titre général', (await texte('#preciser')) === 'Préciser lequel');
  const general = await texte('#sv .t');
  await page.click('#preciser');
  verifier('« Préciser lequel » ouvre ce trophée', (await page.inputValue('#q-edit')) === general, await page.inputValue('#q-edit'));
  await page.fill('#q-edit', 'Mon précisé à moi'); await page.click('#dlg-next'); await annonce('C’est noté');
  verifier('précisé, le bandeau rappelle la réussite et ne propose plus rien', (await texte('#sv .t')) === 'Mon précisé à moi' && !(await page.$('#preciser')) && (await page.isHidden('.dlg')), await texte('#sv'));
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  verifier('ce qui venait des anciens axes garde sa médaille ou prend celle de sa rareté', (await texte('.leg')).replace(/ /g, '') === '2enor6enargent', await texte('.leg'));
  await page.click('#btn-add');
  verifier('ses anciens passages restent cochés', await page.isDisabled('#pu-diplome') && await page.isDisabled('#pu-premier-emploi'));
  await page.click('#dlg-next');
  verifier('une ancienne proposition est reconnue sous son nouveau nom', await page.isDisabled('#pu-vivre-etranger'));
  await page.keyboard.press('Escape');
  await page.click('#btn-parcours');
  await page.click('.annee li:has-text("Prendre de vraies vacances") .mini:has-text("Modifier")');
  verifier('une ancienne réponse sans catégorie peut être rangée à la main', (await page.$$('.dlg .opts .opt')).length === 6);
  await page.click('.dlg .opt:has-text("Partir")'); await page.click('#dlg-next'); await page.waitForSelector('.annee');
  await page.click('#dlg-next');
  verifier('rangée, elle entre dans sa tuile', (await nombres()) === '8/1/2/2/3/+/+', await nombres());
  verifier('trois trophées dans « Partir » : le badge « Globe-trotter »', (await texte('.cell.axe >> nth=3 >> .badge')) === 'Globe-trotter');
  await page.screenshot({ path: join(CAPTURES, 'ancienne-base.png') });

  // ---------- Les couleurs se choisissent et se gardent ----------
  await page.waitForFunction(() => !document.querySelector('#toast.on'));
  await page.click('#btn-ciel');
  verifier('cinq jeux de couleurs sont proposés', (await page.$$('.dlg .opt')).length === 5 && (await page.getAttribute('.dlg .opt >> nth=0', 'aria-pressed')) === 'true');
  await page.click('.dlg .opt:has-text("Aurore")');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-ciel') === 'aurore');
  await page.screenshot({ path: join(CAPTURES, 'couleurs.png') });
  await page.click('#dlg-next');
  await ouvrirPage('essai-ancien');
  verifier('la couleur choisie est gardée après rechargement', (await page.getAttribute('html', 'data-ciel')) === 'aurore');
  await ouvrirPage('essai-page');
  verifier('la couleur appartient à sa base : une autre page garde la mer', (await page.getAttribute('html', 'data-ciel')) === null);

  // ---------- Une vie d'exemple : tailles, contrastes, captures ----------
  await page.goto(`${ORIGINE}/icone.svg`);
  await page.evaluate(async () => {
    const { ouvrir } = await import('/js/stockage.js');
    const { MOMENTS, POINTS, NAISSANCE } = await import('/tests/exemple.js');
    const b = await ouvrir('essai-exemple');
    const an = new Date(); const mois = (n) => { const t = an.getFullYear() * 12 + an.getMonth() - n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
    const jour = `${String(an.getMonth() + 1).padStart(2, '0')}-${String(an.getDate()).padStart(2, '0')}`;
    for (const m of MOMENTS) await b.ecrire('moments', m.id === 'semi' ? { ...m, date: `${an.getFullYear() - 2}-${jour}`, annee: an.getFullYear() - 2 } : m);
    for (const [i, p] of POINTS.entries()) await b.ecrire('points', { ...p, mois: mois([4, 3, 1, 0][i]) });
    await b.regler('naissance', NAISSANCE);
    b.fermer();
  });
  for (const [w, h] of [[1280, 720], [1920, 1080], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    // Le souvenir change de hauteur selon le jour (note, lien « Préciser lequel ») : la page
    // doit tenir pour chacun. Un seul souvenir essayé avait laissé passer un débordement.
    e = { v: false, h: false, coupes: [], petits: 0 };
    for (const jour of ['2026-01-03', '2026-02-11', '2026-03-19', '2026-04-27', '2026-06-05', '2026-07-14', '2026-08-22', '2026-11-30']) {
      await page.goto(`${ORIGINE}/index.html?base=essai-exemple&jour=${jour}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const x = await unEcran();
      if (x.v || x.h || x.coupes.length || x.petits) e = { ...x, jour, souvenir: await texte('#sv') };
    }
    await ouvrirPage('essai-exemple');
    const auJour = await unEcran();
    if (auJour.v || auJour.h || auJour.coupes.length || auJour.petits) e = auJour;
    verifier(`une vie remplie tient sur un écran en ${w} × ${h}, sans texte sous 14 px`, !e.v && !e.h && !e.coupes.length && !e.petits, JSON.stringify(e));
  }
  // Les blocs des trois rangées tombent sur les mêmes lignes verticales, aux trois tailles.
  for (const [w, h] of [[1280, 720], [1920, 1080], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await ouvrirPage('essai-exemple');
    const ecarts = await page.evaluate(() => {
      const r = (q) => document.querySelector(q).getBoundingClientRect();
      const t = [...document.querySelectorAll('#axes > .cell')].map((x) => x.getBoundingClientRect());
      return [r('.bl').left - t[0].left, r('.bl').right - t[1].right, r('.sv').left - t[2].left, r('.sv').right - t[2].right, r('.rb').left - t[3].left, r('.rb').right - t[4].right, r('.cv').left - t[5].left, r('.cv').right - t[5].right, t[0].width - t[2].width].map((x) => Math.round(x * 10) / 10);
    });
    verifier(`les blocs sont alignés sur trois colonnes égales en ${w} × ${h}`, ecarts.every((x) => Math.abs(x) < 1), JSON.stringify(ecarts));
  }
  verifier('chaque tuile porte son pictogramme, et le ruban montre un jeton par trophée daté', (await page.$$('#axes .cat-t .pi')).length === 6 && (await page.$$('#ruban .jeton')).length === 21 && (await page.$$('#ruban .jeton .pi-partir')).length === 2, String((await page.$$('#ruban .jeton')).length));
  verifier('la vie d’exemple : 21 trophées dans six catégories', (await nombres()) === '21/4/4/3/2/2/5', await nombres());
  verifier('le souvenir du jour est l’anniversaire', (await texte('#sv')).includes('Il y a 2 ans aujourd’hui') && (await texte('#sv')).includes('semi-marathon'), await texte('#sv'));
  verifier('les hauts faits disent leur rareté', (await texte('#feats')).includes('Top 16 %') && (await texte('#feats')).includes('Top 4 %') && (await texte('#feats')).includes('Top 17 %'), await texte('#feats'));
  verifier('la carte se compare au point d’il y a trois mois', (await page.getAttribute('.cv', 'title')).startsWith('Amour, Santé, Proches et Cadre de vie montent depuis'), await page.getAttribute('.cv', 'title'));
  await page.screenshot({ path: join(CAPTURES, 'page.png') });

  // Contrastes : on rend le texte transparent, on relève le fond sous chaque texte, ciel le plus clair.
  await page.evaluate(() => document.documentElement.setAttribute('data-meteo', '5'));
  for (const ciel of ['mer', 'lagon', 'jardin', 'aurore', 'soleil']) {
  await page.evaluate((c) => { if (c === 'mer') document.documentElement.removeAttribute('data-ciel'); else document.documentElement.setAttribute('data-ciel', c); }, ciel);
  const cibles = ['#today', 'h1', '.sv .k', '.sv .t', '.sv .q', '#bl-total .num', '#bl-total .n', '#stats li', '#feats-vide', '.cat-n', '.nb', '.nomme', '.reste', '.badge', '.ages span', '.leg span', '.lab', '.lien', '.ans span', '.temps', '.bl strong', '.bl li .petit', '#btn-point'];
  const zones = await page.evaluate((sels) => sels.flatMap((sel) => [...document.querySelectorAll(sel)].map((x) => { const r = document.createRange(); r.selectNodeContents(x); const b = r.getBoundingClientRect(); return { sel, x: b.left, y: b.top, w: b.width, h: b.height, c: getComputedStyle(x).color, gros: parseFloat(getComputedStyle(x).fontSize) >= 24 }; })).filter((z) => z.w > 2), cibles);
  const radarTextes = await page.$$eval('#radar text', (ts) => ts.map((t) => { const b = t.getBoundingClientRect(); return { sel: 'radar', x: b.left, y: b.top, w: b.width, h: b.height, c: getComputedStyle(t).fill, gros: false }; }));
  // Les coupes aussi doivent se détacher du fond : 3:1, comme tout dessin qui porte un sens.
  const coupes = await page.$$eval('.page .m', (ms) => ms.map((m) => { const b = m.getBoundingClientRect(); return { sel: `coupe ${m.className.replace('m ', '')}`, x: b.left, y: b.top, w: b.width, h: b.height, c: getComputedStyle(m).backgroundColor, gros: true }; }));
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
      const d = cx.getImageData(Math.max(0, Math.floor(z.x)), Math.max(0, Math.floor(z.y)), Math.max(1, Math.floor(z.w)), Math.max(1, Math.floor(z.h))).data;
      let pire = 99;
      for (let i = 0; i < d.length; i += 4) { const lf = lum(d[i], d[i + 1], d[i + 2]); pire = Math.min(pire, (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05)); }
      return { sel: z.sel, pire, seuil: z.gros ? 3 : 4.5 };
    });
  }, { capture, zones: [...zones, ...radarTextes, ...coupes] });
  // Le pictogramme sombre doit se lire sur chacun des trois métaux.
  const jetons = await page.evaluate(() => {
    const canal = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).map(Number); return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b); };
    return [...document.querySelectorAll('#ruban .jeton')].map((j) => { const a = lum(getComputedStyle(j).backgroundColor), b = lum(getComputedStyle(j.firstElementChild).backgroundColor); return { sel: `pictogramme sur ${j.className.split(' ')[1]}`, pire: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), seuil: 3 }; });
  });
  mesures.push(...jetons);
  const bas = mesures.filter((x) => x.pire < x.seuil).map((x) => `${x.sel} ${x.pire.toFixed(2)}`);
  const plusBas = mesures.reduce((a, b) => (b.pire / b.seuil < a.pire / a.seuil ? b : a));
  verifier(`les contrastes tiennent sur les pixels en « ${ciel} » (le plus juste : ${plusBas.sel} à ${plusBas.pire.toFixed(2)})`, !bas.length, [...new Set(bas)].join(' ; '));
  }
  await page.evaluate(() => document.documentElement.removeAttribute('data-ciel'));

  await page.setViewportSize({ width: 400, height: 800 });
  await ouvrirPage('essai-exemple');
  verifier('sur un écran étroit la page défile sans déborder en largeur', !(await unEcran()).h);

  verifier('aucune requête ne sort de la page', !dehors.length, dehors.join(', '));
  verifier('aucune erreur de script', !erreurs.length, erreurs.join(' | '));
  await effacer();
} catch (erreur) {
  verifier('l’essai va au bout', false, erreur.stack || erreur);
} finally {
  await navigateur.close();
  serveur.close();
}
console.log(echecs ? `${echecs} échec(s)` : 'la page tient');
process.exit(echecs ? 1 : 0);
