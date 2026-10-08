// La page : elle lit la base, dessine le tableau de bord et ouvre ses volets
// (ajouter, faire le point, tout voir, sauvegarde). Les règles sont dans coeur.js,
// rien n'est calculé ici.

// Le numéro suit celui d'index.html : Pages garde un fichier dix minutes, et sans lui
// un nouvel app.js pourrait charger une ancienne configuration.
import { ouvrir, demanderPersistance } from './stockage.js?v=8';
import { NIVEAUX, CATEGORIES, REUSSITES, CATALOGUE, BADGE_TOUT } from './config/vie.js?v=8';
import { DOMAINES, METEOS, ELANS, MOIS, JOURS } from './config/domaines.js?v=8';
import { lire, definition, rarete, medaille, dejaFaites, comptes, parCategorie, hautsFaits, plusRares, badges, ruban, decennies, souvenirDuJour, dernierPoint, pointDavant, phraseRoue } from './coeur.js?v=8';

const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const deux = (n) => String(n).padStart(2, '0');
const jourLocal = (d = new Date()) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const an = () => new Date().getFullYear();

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function bouton(cls, txt, appuye) {
  const b = el('button', cls, txt);
  b.type = 'button';
  if (appuye != null) b.setAttribute('aria-pressed', String(appuye));
  return b;
}
// Un trophée : la même coupe, dans la couleur de sa médaille.
function coupe(niveau, grande) {
  const s = el('span', `m ${niveau}${grande ? ' g' : ''}`);
  s.setAttribute('aria-hidden', 'true');
  return s;
}
const pluriel = (n, mots) => `${n} ${mots[n > 1 ? 1 : 0]}`;
const trophees = (n) => pluriel(n, ['trophée', 'trophées']);

// `moments` : ce qui est gardé. `vus` : les mêmes, tels que la page les montre.
const etat = { base: null, moments: [], vus: [], points: [], naissance: null };

async function charger() {
  etat.moments = await etat.base.tout('moments');
  etat.points = await etat.base.tout('points');
  etat.naissance = await etat.base.reglage('naissance');
  etat.vus = lire(etat.moments, CATALOGUE, etat.naissance);
}

// ---------- Le tableau de bord ----------

function heure() {
  const d = new Date();
  $('today').textContent = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} · ${deux(d.getHours())} h ${deux(d.getMinutes())}`;
  $('hello').textContent = d.getHours() >= 18 ? 'Bonsoir' : 'Bonjour';
}

function dessinerSouvenir() {
  const sv = $('sv');
  sv.textContent = '';
  if (!etat.vus.length) {
    sv.append(el('p', 'k', 'Ta page t’attend'), el('p', 't', 'Tout ce que tu as déjà fait, en cinq minutes'));
    const b = bouton('btn main', 'Commencer');
    b.addEventListener('click', ouvrirAjout);
    sv.append(b);
    return;
  }
  const s = souvenirDuJour(etat.vus, jourLocal());
  if (!s) {
    sv.append(el('p', 'k', 'Ta vie'), el('p', 't', trophees(etat.vus.length)));
    return;
  }
  const quand = s.ans == null ? 'Tu te souviens ?'
    : s.ans === 0 ? 'Cette année'
      : `Il y a ${s.ans} an${s.ans > 1 ? 's' : ''}${s.anniversaire ? ' aujourd’hui' : ''}`;
  const tete = el('p', 'k');
  tete.append(coupe(s.trophee.niveau), [quand, s.trophee.modele, s.trophee.top].filter(Boolean).join(' · '));
  sv.append(tete, el('p', 't', s.trophee.titre));
  if (s.trophee.note) sv.append(el('p', 'q', `« ${s.trophee.note} »`));
  if (s.trophee.aPreciser) {
    const b = bouton('lien', 'Préciser lequel');
    b.id = 'preciser';
    b.addEventListener('click', () => ouvrirEdition(etat.moments.find((m) => m.id === s.trophee.id), 'page'));
    sv.append(b);
  }
}

function dessinerChiffres() {
  const ax = $('axes');
  ax.textContent = '';
  const c = comptes(etat.vus);
  const gagnes = badges(etat.vus, CATEGORIES, BADGE_TOUT);
  const total = el('div', 'cell');
  total.append(el('span', 'num', String(c.total)), el('span', 'n', c.total > 1 ? 'trophées' : 'trophée'));
  const leg = el('span', 'leg');
  for (const n of [...NIVEAUX].reverse()) {
    if (!c[n.id]) continue; // une médaille à zéro n'a rien à dire
    const i = el('span');
    i.append(coupe(n.id), `${c[n.id]} en ${n.nom.toLowerCase()}`);
    leg.append(i);
  }
  total.append(leg);
  if (gagnes.some((g) => g.id === 'tout')) total.append(el('span', 'badge', BADGE_TOUT));
  ax.append(total);
  // Chaque catégorie NOMME ses réussites, les plus rares d'abord : un bilan se lit, il ne
  // se compte pas (mesuré : la page ne nommait qu'une réussite sur toute une vie). La tuile
  // reste un bouton qui ouvre ses réussites. Vide, elle montre un « + », pas un zéro.
  // Sur un écran bas, deux noms par tuile : la page doit rester sur un écran.
  const montres = innerHeight < 800 ? 2 : 3;
  for (const cat of parCategorie(etat.vus, CATEGORIES)) {
    const d = bouton('cell axe cat');
    const n = cat.trophees.length;
    const tete = el('span', 'cat-t');
    const badge = gagnes.find((g) => g.id === cat.id);
    tete.append(el('span', 'cat-n', cat.nom), el('span', 'nb', n ? String(n) : '+'));
    if (badge) tete.append(el('span', 'badge', badge.nom));
    const liste = el('span', 'cat-l');
    for (const t of plusRares(cat.trophees, montres)) {
      const ligne = el('span', 'cat-i');
      const nom = el('span', 'nomme', t.titre);
      nom.title = t.titre;
      ligne.append(coupe(t.niveau), nom);
      liste.append(ligne);
    }
    d.append(tete, liste);
    if (n > montres) d.append(el('span', 'reste', `et ${n - montres} autre${n - montres > 1 ? 's' : ''}`));
    d.setAttribute('aria-label', n ? `${cat.nom} : ${trophees(n)}${badge ? `, badge ${badge.nom}` : ''}. Ajouter` : `${cat.nom} : ajouter`);
    d.addEventListener('click', () => ouvrirCategorie(cat));
    ax.append(d);
  }
}

function dessinerRuban(vie) {
  const rb = $('ruban');
  const lb = $('ans');
  rb.textContent = '';
  lb.textContent = '';
  for (const a of vie.annees) {
    const col = el('div', 'an');
    for (const t of a.trophees) col.append(coupe(t.niveau));
    rb.append(col);
  }
  if (vie.debut == null) { lb.append(el('span', null, String(an()))); return; }
  const fin = vie.annees.at(-1).annee;
  const reperes = fin - vie.debut >= 4 ? [vie.debut, Math.round((vie.debut + fin) / 2), fin] : fin > vie.debut ? [vie.debut, fin] : [fin];
  for (const a of reperes) lb.append(el('span', null, String(a)));
}

// Sous le ruban, les âges de la vie. Sans année de naissance, la place sert à la demander :
// c'est là qu'on la trouve, et c'est aussi là qu'on la change.
function dessinerAges(vie) {
  $('ages')?.remove();
  if (vie.debut == null) return;
  const b = bouton('ages');
  b.id = 'ages';
  if (!etat.naissance) {
    b.classList.add('lien');
    b.textContent = 'Situer mes trophées à mon âge';
  } else {
    b.title = 'Changer mon année de naissance';
    b.setAttribute('aria-label', `Tes âges, née en ${etat.naissance}. Changer mon année de naissance`);
    for (const d of decennies(vie.debut, vie.annees.at(-1).annee, etat.naissance)) {
      const s = el('span', null, d.annees >= 3 ? d.nom : '');
      s.style.setProperty('--n', d.annees);
      b.append(s);
    }
  }
  b.addEventListener('click', ouvrirNaissance);
  $('ans').after(b);
}

// Tant que rien n'est épinglé, le bloc se remplit seul avec les trophées les plus rares :
// vide, il privait la page de ce qui donne le plus la sensation de bilan.
function dessinerHautsFaits() {
  const f = $('feats');
  f.textContent = '';
  const epingles = hautsFaits(etat.vus);
  const montres = epingles.length ? epingles : plusRares(etat.vus);
  $('hf-t').textContent = epingles.length ? 'Hauts faits' : montres.some((t) => t.niveau === 'or') ? 'Tes plus rares' : montres.length ? 'Tes derniers trophées' : 'Hauts faits';
  for (const t of montres) {
    const li = el('li');
    const d = el('div');
    d.append(el('strong', null, t.titre), el('span', 'petit', [t.annee ? String(t.annee) : 'un jour', t.top].filter(Boolean).join(' · ')));
    li.append(coupe(t.niveau, true), d);
    f.append(li);
  }
  $('feats-vide').hidden = montres.length > 0;
}

function radar(svg, maintenant, avant) {
  const R = 78;
  svg.textContent = '';
  const pt = (i, v) => { const a = (-90 + i * 45) * Math.PI / 180; return [Math.cos(a) * R * v / 10, Math.sin(a) * R * v / 10]; };
  const poly = (vals, cls) => {
    const p = document.createElementNS(NS, 'polygon');
    p.setAttribute('points', vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' '));
    p.setAttribute('class', cls);
    svg.append(p);
  };
  for (const g of [5, 10]) poly(DOMAINES.map(() => g), 'grid');
  if (avant) poly(avant, 'past');
  if (maintenant) poly(maintenant, 'now');
  DOMAINES.forEach((d, i) => {
    const t = document.createElementNS(NS, 'text');
    const l = pt(i, 11.4);
    t.setAttribute('x', l[0].toFixed(1));
    t.setAttribute('y', (l[1] + (i === 0 ? -4 : i === 4 ? 6 : 0)).toFixed(1));
    t.setAttribute('text-anchor', Math.abs(l[0]) < 1 ? 'middle' : l[0] > 0 ? 'start' : 'end');
    t.setAttribute('dominant-baseline', 'middle');
    t.textContent = d.nom;
    if (maintenant) {
      const n = document.createElementNS(NS, 'tspan');
      n.textContent = ` ${maintenant[i]}`;
      t.append(n);
    }
    svg.append(t);
  });
}
const valeurs = (point) => (point ? DOMAINES.map((d) => point.roue[d.id] ?? 5) : null);

function dessinerMoment() {
  const actuel = dernierPoint(etat.points, jourLocal().slice(0, 7));
  const avant = pointDavant(etat.points, actuel);
  radar($('radar'), valeurs(actuel), valeurs(avant));
  if (!actuel) {
    $('temps').textContent = 'Pas encore de point';
    $('synth').textContent = '« Faire le point » prend deux minutes.';
    document.documentElement.removeAttribute('data-meteo');
    return;
  }
  $('temps').textContent = METEOS[actuel.meteo - 1];
  $('synth').textContent = phraseRoue(actuel, avant, DOMAINES);
  document.documentElement.setAttribute('data-meteo', actuel.meteo);
}

function dessiner() {
  heure();
  dessinerSouvenir();
  dessinerChiffres();
  const annees = etat.vus.filter((t) => t.annee).map((t) => t.annee);
  const vie = ruban(etat.vus, annees.length ? Math.max(...annees) : an());
  dessinerRuban(vie);
  dessinerAges(vie);
  dessinerHautsFaits();
  dessinerMoment();
}
async function rafraichir() { await charger(); dessiner(); }

// ---------- Notification ----------

let minuteur;
function annoncer(petit, fort, action) {
  const t = $('toast');
  t.textContent = '';
  const d = el('div');
  d.append(el('small', null, petit), el('strong', null, fort));
  t.append(d);
  if (action) {
    const b = bouton(null, action.texte);
    b.addEventListener('click', async () => { t.classList.remove('on'); await action.faire(); });
    t.append(b);
  }
  t.classList.add('on');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => t.classList.remove('on'), action ? 8000 : 4200);
}

// ---------- Le volet à étapes ----------

let flux = null;
let ouvreur = null;
function ouvrirVolet(genre, etapes, fin, apres) {
  $('scrim').firstElementChild.setAttribute('data-kind', genre);
  if (!flux) ouvreur = document.activeElement;
  flux = { etapes, i: 0, fin, apres };
  $('scrim').hidden = false;
  montrerEtape();
}
function fermerVolet() {
  $('scrim').hidden = true;
  flux = null;
  if (ouvreur?.isConnected) ouvreur.focus();
}
function montrerEtape() {
  const e = flux.etapes[flux.i];
  $('dlg-step').textContent = e.label + (flux.etapes.length > 1 ? ` · ${flux.i + 1} sur ${flux.etapes.length}` : '');
  $('dlg-t').textContent = e.titre;
  const corps = $('dlg-body');
  corps.textContent = '';
  e.dessiner(corps);
  corps.scrollTop = 0;
  $('dlg-back').hidden = flux.i === 0;
  $('dlg-next').textContent = flux.i === flux.etapes.length - 1 ? flux.fin : 'Suivant';
  (corps.querySelector('input,button') ?? $('dlg-next')).focus();
}
$('dlg-next').addEventListener('click', async () => {
  if (flux.i < flux.etapes.length - 1) { flux.i += 1; montrerEtape(); return; }
  const { apres } = flux;
  $('dlg-next').disabled = true; // un deuxième appui écrirait deux fois
  try { if (apres) await apres(); } finally { $('dlg-next').disabled = false; }
});
$('dlg-back').addEventListener('click', () => { flux.i -= 1; montrerEtape(); });
$('dlg-x').addEventListener('click', fermerVolet);
$('scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerVolet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && flux) fermerVolet(); });

// ---------- Les briques des formulaires ----------

const anneeValide = (v) => { const n = Number(v); return v !== '' && v != null && Number.isInteger(n) && n >= 1900 && n <= an() ? n : null; };

function champAnnee(id, valeur, libelle, regler, invite = 'Année') {
  const a = el('input', 'field an-in');
  a.type = 'number'; a.inputMode = 'numeric'; a.id = id; a.placeholder = invite; a.value = valeur ?? '';
  a.setAttribute('aria-label', libelle);
  a.addEventListener('input', () => regler(a.value));
  return a;
}

// Les trois médailles, à choisir quand aucun chiffre ne décide.
function medailles(id, reponse) {
  const niv = el('div', 'niv');
  niv.setAttribute('role', 'group');
  niv.setAttribute('aria-label', 'La médaille que tu lui donnes');
  for (const n of NIVEAUX) {
    const b = bouton(null, null, reponse.niveau === n.id);
    b.id = `${id}-${n.id}`;
    b.append(coupe(n.id), n.nom);
    b.addEventListener('click', () => { reponse.niveau = n.id; for (const o of niv.children) o.setAttribute('aria-pressed', String(o === b)); });
    niv.append(b);
  }
  return niv;
}

// Une question libre : quelques mots, l'année, et la médaille qu'on lui donne.
function question(corps, id, texte, reponse, { aide, sansNiveau } = {}) {
  const q = el('div', 'q');
  const lb = el('label', null, texte);
  const ligne = el('div', 'ligne');
  const mots = el('input', 'field');
  mots.type = 'text'; mots.id = `q-${id}`; mots.maxLength = 120; mots.placeholder = 'En quelques mots'; mots.value = reponse.titre ?? '';
  mots.addEventListener('input', () => { reponse.titre = mots.value; });
  lb.htmlFor = mots.id;
  q.append(lb);
  if (aide) q.append(el('span', 'aide', aide));
  ligne.append(mots, champAnnee(`a-${id}`, reponse.annee, 'Année, facultative', (v) => { reponse.annee = v; }));
  if (!sansNiveau) ligne.append(medailles(`n-${id}`, reponse));
  q.append(ligne);
  corps.append(q);
}

// Des réussites à toucher, autant qu'on veut. Cochée, une réussite ne demande que
// l'année, et seulement si c'est un événement. Sa médaille est celle de sa rareté ou
// celle proposée : elle se change ensuite dans « Tout voir ». Déjà dans la vie, elle
// reste cochée.
function puces(corps, reussites, coches, deja, quandChange) {
  const c = el('div', 'chips');
  const dessinerUne = (r) => {
    const boite = el('div', 'puce');
    const fait = deja.has(r.id);
    const reponse = coches.get(r.id);
    const b = bouton('puce-t', r.titre, fait || Boolean(reponse));
    b.id = `pu-${r.id}`;
    if (fait) { b.disabled = true; b.title = 'Déjà dans ta vie'; }
    boite.append(b);
    if (fait || reponse) boite.classList.add('on');
    if (reponse) {
      const d = el('input', 'detail');
      d.type = 'text'; d.id = `de-${r.id}`; d.maxLength = 80; d.placeholder = 'Lequel ? (facultatif)'; d.value = reponse.detail ?? '';
      d.setAttribute('aria-label', `Précision pour : ${r.titre}, facultative`);
      d.addEventListener('input', () => { reponse.detail = d.value; });
      boite.append(d);
    }
    if (reponse && !r.sansAnnee) boite.append(champAnnee(`an-${r.id}`, reponse.annee, `Année de : ${r.titre}, facultative`, (v) => { reponse.annee = v; }, 'Année (facultatif)'));
    b.addEventListener('click', () => {
      if (coches.has(r.id)) coches.delete(r.id); else coches.set(r.id, { annee: '', detail: '', niveau: r.defaut ?? 'argent' });
      const neuve = dessinerUne(r);
      boite.replaceWith(neuve);
      quandChange?.();
      (neuve.querySelector('input') ?? neuve.querySelector('button')).focus();
    });
    return boite;
  };
  for (const r of reussites) c.append(dessinerUne(r));
  corps.append(c);
}

function choix(corps, libelles, courant, regler, enLigne) {
  const w = el('div', `opts${enLigne ? ' row' : ''}`);
  libelles.forEach((l, i) => {
    const b = bouton('opt', l, i === courant);
    b.addEventListener('click', () => { regler(i); [...w.children].forEach((o, j) => o.setAttribute('aria-pressed', String(j === i))); });
    w.append(b);
  });
  corps.append(w);
}

const moment = (r, suite = {}) => ({
  reussite: null, categorie: null, titre: r.titre.trim(), niveau: r.niveau ?? 'argent', annee: anneeValide(r.annee),
  date: null, note: '', hautFait: false, rappel: true, ...suite,
});
const rempli = (r) => (r.titre ?? '').trim().length > 0;

// ---------- Ajouter : tout se touche, rien ne s'écrit sauf si on le veut ----------

const groupe = (cat) => REUSSITES.filter((r) => r.categorie === cat.id);

// Les moments à écrire à partir de ce qui est coché.
function momentsCoches(coches) {
  return REUSSITES.filter((r) => coches.has(r.id)).map((r) => {
    const c = coches.get(r.id);
    return moment({ ...c, titre: (c.detail ?? '').trim() || r.titre }, { reussite: r.id });
  });
}

// L'année de naissance situe une réussite à l'âge où elle a été faite.
function champNaissance(corps, saisie) {
  const q = el('div', 'q');
  const lb = el('label', null, 'Ton année de naissance');
  const a = champAnnee('naissance', saisie.valeur, 'Ton année de naissance', (v) => { saisie.valeur = v; });
  lb.htmlFor = a.id;
  const ligne = el('div', 'ligne');
  ligne.append(a);
  q.append(lb, el('span', 'aide', 'Elle situe tes réussites à l’âge où tu les as faites.'), ligne);
  corps.append(q);
}

async function enregistrer(nouveaux, naissance, avecBilan = false) {
  for (const m of nouveaux) await etat.base.ecrire('moments', m);
  const neeEn = naissance ? anneeValide(naissance.valeur) : null;
  const change = neeEn != null && neeEn !== etat.naissance;
  if (change) await etat.base.regler('naissance', neeEn);
  fermerVolet();
  if (!nouveaux.length && !change) return;
  await rafraichir();
  demanderPersistance();
  if (nouveaux.length && avecBilan) ouvrirBilan(nouveaux.length);
  else if (nouveaux.length) annoncer(nouveaux.length > 1 ? `${nouveaux.length} trophées ajoutés` : 'Trophée ajouté', `${trophees(etat.vus.length)} en tout`);
  else annoncer('C’est noté', 'Tes trophées sont situés à ton âge');
}

// La clôture du formulaire : ce qu'on vient de poser, et quoi faire ensuite.
function ouvrirBilan(ajoutes) {
  const c = comptes(etat.vus);
  ouvrirVolet('add', [{ label: pluriel(ajoutes, ['trophée ajouté', 'trophées ajoutés']), titre: 'C’est ta vie jusqu’ici', dessiner(corps) {
    const b = el('div', 'bilan');
    const leg = el('span', 'leg');
    for (const n of [...NIVEAUX].reverse()) {
      if (!c[n.id]) continue;
      const i = el('span');
      i.append(coupe(n.id), `${c[n.id]} en ${n.nom.toLowerCase()}`);
      leg.append(i);
    }
    b.append(el('span', 'num', String(c.total)), el('span', 'n', c.total > 1 ? 'trophées' : 'trophée'), leg);
    const gagnes = badges(etat.vus, CATEGORIES, BADGE_TOUT);
    if (gagnes.length) {
      const l = el('span', 'badges');
      for (const g of gagnes) l.append(el('span', 'badge', g.nom));
      b.append(l);
    }
    corps.append(b, el('p', 'aide', 'Ta page est à jour. Reviens-y quand il se passe quelque chose dans ta vie.'));
  } }], 'Voir ma page', async () => fermerVolet());
}

function ouvrirAjout() {
  const deja = dejaFaites(etat.moments, CATALOGUE);
  const coches = new Map(); // identifiant → { annee, niveau }
  const naissance = { valeur: etat.naissance ?? '' };
  const moitie = Math.ceil(CATEGORIES.length / 2);
  const compter = () => { $('dlg-step').textContent = `Ta vie · ${flux.i + 1} sur 2${coches.size ? ` · ${pluriel(coches.size, ['cochée', 'cochées'])}` : ''}`; };
  const ecran = (cats, avecNaissance) => (corps) => {
    if (avecNaissance) champNaissance(corps, naissance);
    for (const cat of cats) {
      const g = el('div', 'groupe');
      g.append(el('h3', 'lab', cat.nom));
      puces(g, groupe(cat), coches, deja, compter);
      corps.append(g);
    }
    compter();
  };
  ouvrirVolet('add', [
    { label: 'Ta vie', titre: 'Coche tout ce que tu as déjà fait', dessiner: ecran(CATEGORIES.slice(0, moitie), true) },
    { label: 'Ta vie', titre: 'Et ça aussi ?', dessiner: ecran(CATEGORIES.slice(moitie), false) },
  ], 'Ajouter à ma vie', () => enregistrer(momentsCoches(coches), naissance, true));
}

// L'année de naissance seule : on y arrive par le ruban.
function ouvrirNaissance() {
  const naissance = { valeur: etat.naissance ?? '' };
  ouvrirVolet('add', [{ label: 'Ta vie', titre: 'Ton âge', dessiner(corps) { champNaissance(corps, naissance); } }], 'Enregistrer', () => enregistrer([], naissance));
}

// Une catégorie seule, ouverte depuis sa tuile.
function ouvrirCategorie(cat) {
  const coches = new Map();
  const libre = { niveau: 'argent' };
  ouvrirVolet('add', [{ label: 'Ta vie', titre: cat.nom, dessiner(corps) {
    puces(corps, groupe(cat), coches, dejaFaites(etat.moments, CATALOGUE));
    question(corps, 'libre', 'Une autre réussite ?', libre, { aide: 'Sans chiffre pour la situer, c’est toi qui choisis sa médaille.' });
  } }], 'Ajouter à ma vie', async () => {
    const nouveaux = momentsCoches(coches);
    if (rempli(libre)) nouveaux.push(moment(libre, { categorie: cat.id }));
    await enregistrer(nouveaux);
  });
}

// ---------- Faire le point ----------

function ouvrirPoint() {
  const mois = jourLocal().slice(0, 7);
  const actuel = dernierPoint(etat.points, mois);
  const vals = valeurs(actuel) ?? DOMAINES.map(() => 5);
  const avant = valeurs(pointDavant(etat.points, actuel?.mois === mois ? actuel : { mois }));
  let meteo = actuel?.meteo ?? 3;
  let elan = actuel?.elan ?? 1;

  ouvrirVolet('point', [
    { label: 'Le point du mois', titre: 'Où en es-tu, domaine par domaine ?', dessiner(corps) {
      const duo = el('div', 'duo');
      const svg = document.createElementNS(NS, 'svg');
      const col = el('div');
      svg.setAttribute('class', 'radar'); svg.setAttribute('viewBox', '-180 -112 360 224'); svg.setAttribute('aria-hidden', 'true');
      const tracer = () => radar(svg, vals, avant);
      DOMAINES.forEach((d, i) => {
        const r = el('div', 'sl');
        const lb = el('label', null, d.nom);
        const curseur = el('input');
        const sortie = el('output', null, String(vals[i]));
        curseur.type = 'range'; curseur.min = 1; curseur.max = 10; curseur.step = 1; curseur.value = vals[i]; curseur.id = `sl-${d.id}`;
        lb.htmlFor = curseur.id;
        curseur.addEventListener('input', () => { vals[i] = Number(curseur.value); sortie.textContent = curseur.value; tracer(); });
        r.append(lb, curseur, sortie);
        col.append(r);
      });
      duo.append(svg, col);
      corps.append(duo);
      tracer();
    } },
    { label: 'Le point du mois', titre: 'Quel temps a-t-il fait en toi, ce mois-ci ?', dessiner(corps) {
      choix(corps, [...METEOS].reverse(), 5 - meteo, (i) => { meteo = 5 - i; });
    } },
    { label: 'Le point du mois', titre: 'Une dernière chose', dessiner(corps) {
      const d = el('div', 'q');
      d.append(el('label', null, 'Tu as de l’élan, en ce moment ?'));
      choix(d, ELANS, elan, (i) => { elan = i; }, true);
      corps.append(d);
    } },
  ], 'Enregistrer mon point', async () => {
    const roue = Object.fromEntries(DOMAINES.map((d, i) => [d.id, vals[i]]));
    const existant = etat.points.find((p) => p.mois === mois);
    await etat.base.ecrire('points', { ...existant, mois, roue, meteo, elan });
    fermerVolet();
    await rafraichir();
    demanderPersistance();
    annoncer('C’est noté', 'Ta page est à jour');
  });
}

// ---------- Tout voir : le parcours complet, où l'on corrige ----------

function ouvrirParcours() {
  ouvrirVolet('add', [{ label: trophees(etat.vus.length), titre: 'Tout ton parcours', dessiner: function rendu(corps) {
    corps.textContent = '';
    $('dlg-step').textContent = trophees(etat.vus.length);
    if (!etat.vus.length) { corps.append(el('p', 'aide', 'Rien de noté pour l’instant.')); return; }
    const vie = ruban(etat.vus, an());
    const blocs = [...vie.annees].reverse().filter((a) => a.trophees.length).map((a) => [String(a.annee), [...a.trophees].reverse()]);
    if (vie.sansDate.length) blocs.push(['Un jour', vie.sansDate]);
    for (const [titre, liste] of blocs) {
      const s = el('div', 'annee');
      const ul = el('ul');
      for (const t of liste) {
        const brut = etat.moments.find((m) => m.id === t.id);
        const li = el('li');
        const d = el('div');
        const acts = el('div', 'acts');
        const haut = bouton('mini', 'Haut fait', Boolean(t.hautFait));
        const modifier = bouton('mini', 'Modifier');
        const retirer = bouton('mini', 'Retirer');
        haut.addEventListener('click', async () => {
          if (!t.hautFait && hautsFaits(etat.vus).length >= 3) { annoncer('Trois hauts faits au plus', 'Retires-en un d’abord'); return; }
          await etat.base.ecrire('moments', { ...brut, hautFait: !t.hautFait });
          await rafraichir(); rendu(corps);
        });
        modifier.addEventListener('click', () => ouvrirEdition(brut));
        retirer.addEventListener('click', async () => {
          await etat.base.retirer('moments', t.id);
          await rafraichir(); rendu(corps);
          annoncer('Trophée retiré', t.titre, { texte: 'Annuler', faire: async () => { await etat.base.remettre('moments', t.id); await rafraichir(); if (flux) rendu(corps); } });
        });
        acts.append(haut, modifier, retirer);
        d.append(el('strong', null, t.titre));
        const details = [t.top, t.note ? `« ${t.note} »` : null].filter(Boolean).join(' · ');
        if (details) d.append(el('span', 'petit', details));
        d.append(acts);
        li.append(coupe(t.niveau), d);
        ul.append(li);
      }
      s.append(el('b', null, titre), ul);
      corps.append(s);
    }
  } }], 'Fermer', async () => fermerVolet());
}

// `retour` : où l'on revient après avoir enregistré, le parcours ou la page.
function ouvrirEdition(m, retour = 'parcours') {
  const def = definition(m, CATALOGUE);
  const part = rarete(m, def, etat.naissance);
  const r = { titre: m.titre, annee: m.annee ?? '', niveau: medaille(part, m, def), note: m.note ?? '', categorie: m.categorie ?? def?.categorie ?? null };
  ouvrirVolet('add', [{ label: 'Corriger', titre: 'Ce trophée, tel que tu le vois', dessiner(corps) {
    // Avec un chiffre, la médaille ne se choisit pas : elle suit la rareté.
    question(corps, 'edit', 'En quelques mots', r, { sansNiveau: part != null, aide: part != null ? 'Sa médaille suit sa rareté.' : null });
    if (!def) {
      const q = el('div', 'q');
      q.append(el('label', null, 'Sa place sur ta page'));
      choix(q, CATEGORIES.map((c) => c.nom), CATEGORIES.findIndex((c) => c.id === r.categorie), (i) => { r.categorie = CATEGORIES[i].id; }, true);
      corps.append(q);
    }
    const q = el('div', 'q');
    const lb = el('label', null, 'Un souvenir de ce jour-là ?');
    const note = el('input', 'field');
    note.type = 'text'; note.id = 'q-note'; note.maxLength = 200; note.placeholder = 'Une phrase, si tu veux'; note.value = r.note;
    note.addEventListener('input', () => { r.note = note.value; });
    lb.htmlFor = note.id;
    q.append(lb, note);
    corps.append(q);
  } }], 'Enregistrer', async () => {
    if (rempli(r)) await etat.base.ecrire('moments', { ...m, titre: r.titre.trim(), annee: anneeValide(r.annee), niveau: r.niveau, note: r.note.trim(), categorie: def ? m.categorie ?? null : r.categorie });
    await rafraichir();
    if (retour === 'page') { fermerVolet(); annoncer('C’est noté', r.titre.trim() || m.titre); } else ouvrirParcours();
  });
}

// ---------- Sauvegarde ----------

function ouvrirSauvegarde() {
  ouvrirVolet('add', [{ label: 'Tes données restent sur cet ordinateur', titre: 'Sauvegarde', dessiner(corps) {
    const sortie = el('div', 'bloc');
    const telecharger = bouton('btn', 'Télécharger ma sauvegarde');
    telecharger.addEventListener('click', async () => {
      const contenu = JSON.stringify(await etat.base.exporter());
      const lien = el('a');
      lien.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
      lien.download = `trophees-de-vie-${jourLocal()}.json`;
      document.body.append(lien); lien.click(); lien.remove();
      setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
      annoncer('Sauvegarde téléchargée', lien.download);
    });
    sortie.append(el('p', 'aide', 'Un fichier à garder ailleurs, au cas où ce navigateur serait vidé.'), telecharger);

    const entree = el('div', 'bloc');
    const lb = el('label', null, 'Reprendre une sauvegarde');
    const fichier = el('input');
    const alerte = el('p', 'alerte');
    alerte.setAttribute('role', 'alert');
    fichier.type = 'file'; fichier.accept = 'application/json,.json'; fichier.id = 'fichier';
    lb.htmlFor = fichier.id; lb.style.fontWeight = '700';
    fichier.addEventListener('change', async () => {
      alerte.textContent = '';
      if (!fichier.files[0]) return;
      try {
        const n = await etat.base.importer(JSON.parse(await fichier.files[0].text()));
        await rafraichir();
        fermerVolet();
        annoncer('Sauvegarde reprise', n ? `${n} élément${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} ou mis à jour` : 'Tout y était déjà');
      } catch (erreur) {
        alerte.textContent = erreur instanceof SyntaxError ? 'Ce fichier n’est pas lisible.' : erreur.message;
      }
    });
    entree.append(lb, fichier, alerte);
    corps.append(sortie, entree);
  } }], 'Fermer', async () => fermerVolet());
}

// ---------- Démarrage ----------

$('btn-add').addEventListener('click', ouvrirAjout);
$('btn-point').addEventListener('click', ouvrirPoint);
$('btn-parcours').addEventListener('click', ouvrirParcours);
$('btn-sauvegarde').addEventListener('click', ouvrirSauvegarde);

heure();
setInterval(heure, 20000);
// Le nombre de noms par tuile dépend de la hauteur de la fenêtre.
let bas = innerHeight < 800;
addEventListener('resize', () => { if ((innerHeight < 800) !== bas && etat.base) { bas = innerHeight < 800; dessinerChiffres(); } });
// Au passage de minuit, le souvenir du jour change sans qu'on recharge la page.
let jourAffiche = jourLocal();
setInterval(() => { if (jourLocal() !== jourAffiche && !flux) { jourAffiche = jourLocal(); dessiner(); } }, 60000);

try {
  // ?base=… n'existe que pour les essais : ils ne touchent jamais à la vraie base.
  etat.base = await ouvrir(new URLSearchParams(location.search).get('base') ?? undefined);
  await rafraichir();
} catch (erreur) {
  console.error(erreur);
  $('sv').append(el('p', 'k', 'Impossible de garder tes données ici'), el('p', 't', 'Ce navigateur refuse le stockage'), el('p', 'q', 'En navigation privée, la page ne peut rien retenir.'));
}
