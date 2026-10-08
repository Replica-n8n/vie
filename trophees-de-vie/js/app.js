// La page : elle lit la base, dessine le tableau de bord et ouvre les trois volets
// (ajouter, faire le point, tout voir). Les règles sont dans coeur.js, rien n'est
// calculé ici.

// Le numéro suit celui d'index.html : Pages garde un fichier dix minutes, et sans lui
// un nouvel app.js pourrait charger une ancienne configuration.
import { ouvrir, demanderPersistance } from './stockage.js?v=2';
import { NIVEAUX, PASSAGES, SCENES, AXES } from './config/vie.js?v=2';
import { DOMAINES, METEOS, ELANS, MOIS, JOURS } from './config/domaines.js?v=2';
import { comptes, parAxe, hautsFaits, ruban, souvenirDuJour, dernierPoint, pointDavant, phraseRoue } from './coeur.js?v=2';

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
function lune(niveau, grande) {
  const s = el('span', `m ${niveau}${grande ? ' g' : ''}`);
  s.setAttribute('aria-hidden', 'true');
  return s;
}
const pluriel = (n, mots) => `${n} ${mots[n > 1 ? 1 : 0]}`;

const etat = { base: null, moments: [], points: [] };

async function charger() {
  etat.moments = await etat.base.tout('moments');
  etat.points = await etat.base.tout('points');
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
  if (!etat.moments.length) {
    sv.append(el('p', 'k', 'Ta page t’attend'), el('p', 't', 'Raconte ta vie en cinq minutes'));
    const b = bouton('btn main', 'Commencer');
    b.addEventListener('click', ouvrirAjout);
    sv.append(b);
    return;
  }
  const s = souvenirDuJour(etat.moments, jourLocal());
  if (!s) {
    sv.append(el('p', 'k', 'Ta vie'), el('p', 't', pluriel(etat.moments.length, ['moment', 'moments'])));
    return;
  }
  const quand = s.ans == null ? 'Tu te souviens ?'
    : s.ans === 0 ? 'Cette année'
      : `Il y a ${s.ans} an${s.ans > 1 ? 's' : ''}${s.anniversaire ? ' aujourd’hui' : ''}`;
  sv.append(el('p', 'k', quand), el('p', 't', s.moment.titre));
  if (s.moment.note) sv.append(el('p', 'q', `« ${s.moment.note} »`));
}

function dessinerChiffres() {
  const ax = $('axes');
  ax.textContent = '';
  const c = comptes(etat.moments, NIVEAUX);
  const total = el('div', 'cell');
  total.append(el('span', 'num', String(c.total)), el('span', 'n', c.total > 1 ? 'moments' : 'moment'));
  // Une seule ligne courte sous le total : une de plus et la page ne tient plus sur
  // un petit écran. La durée n'y est pas, le ruban la montre déjà.
  const passages = etat.moments.filter((m) => m.genre === 'passage').length;
  if (passages) total.append(el('span', 'petit', `dont ${pluriel(passages, ['passage', 'passages'])}`));
  const leg = el('span', 'leg');
  for (const n of [...NIVEAUX].reverse()) {
    if (!c[n.id]) continue; // un niveau à zéro n'a rien à dire
    const i = el('span');
    i.append(lune(n.id), pluriel(c[n.id], n.mots));
    leg.append(i);
  }
  total.append(leg);
  ax.append(total);
  // Chaque axe est un bouton : il ouvre ses propositions. Vide, il montre un « + »
  // plutôt qu'un zéro, parce qu'un axe pas encore rempli n'est pas un échec.
  for (const a of parAxe(etat.moments, AXES)) {
    const d = bouton('cell axe');
    const pts = el('span', 'pts');
    for (const m of a.moments) pts.append(lune(m.niveau));
    const vide = !a.moments.length;
    d.append(el('span', `num${vide ? ' plus' : ''}`, vide ? '+' : String(a.moments.length)), el('span', 'n', a.nom), pts);
    d.setAttribute('aria-label', vide ? `${a.nom} : ajouter` : `${a.nom} : ${pluriel(a.moments.length, ['moment', 'moments'])}, ajouter`);
    d.addEventListener('click', () => ouvrirAxe(a));
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
    for (const m of a.moments) col.append(lune(m.niveau));
    rb.append(col);
  }
  if (vie.debut == null) { lb.append(el('span', null, String(an()))); return; }
  const fin = vie.annees.at(-1).annee;
  const reperes = fin - vie.debut >= 4 ? [vie.debut, Math.round((vie.debut + fin) / 2), fin] : fin > vie.debut ? [vie.debut, fin] : [fin];
  for (const a of reperes) lb.append(el('span', null, String(a)));
}

function dessinerHautsFaits() {
  const f = $('feats');
  f.textContent = '';
  const hauts = hautsFaits(etat.moments);
  for (const m of hauts) {
    const li = el('li');
    const d = el('div');
    d.append(el('strong', null, m.titre), el('span', 'petit', m.annee ? String(m.annee) : 'un jour'));
    li.append(lune(m.niveau, true), d);
    f.append(li);
  }
  $('feats-vide').hidden = hauts.length > 0;
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
  const vie = ruban(etat.moments, an());
  heure();
  dessinerSouvenir();
  dessinerChiffres();
  dessinerRuban(vie);
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

const anneeValide = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1900 && n <= an() ? n : null; };

function legende(corps) {
  const l = el('p', 'leg');
  for (const n of NIVEAUX) { const i = el('span'); i.append(lune(n.id), n.nom.toLowerCase()); l.append(i); }
  corps.append(l);
}

// Une question : quelques mots, l'année, et à quel point c'était dur.
function question(corps, id, texte, reponse, { aide, sansNiveau } = {}) {
  const q = el('div', 'q');
  const lb = el('label', null, texte);
  const ligne = el('div', 'ligne');
  const mots = el('input', 'field');
  const annee = el('input', 'field an-in');
  mots.type = 'text'; mots.id = `q-${id}`; mots.maxLength = 120; mots.placeholder = 'En quelques mots'; mots.value = reponse.titre ?? '';
  mots.addEventListener('input', () => { reponse.titre = mots.value; });
  lb.htmlFor = mots.id;
  annee.type = 'number'; annee.inputMode = 'numeric'; annee.id = `a-${id}`; annee.placeholder = 'Année'; annee.value = reponse.annee ?? '';
  annee.setAttribute('aria-label', 'Année, facultative');
  annee.addEventListener('input', () => { reponse.annee = annee.value; });
  q.append(lb);
  if (aide) q.append(el('span', 'aide', aide));
  ligne.append(mots, annee);
  if (!sansNiveau) ligne.append(lunes(`n-${id}`, reponse));
  q.append(ligne);
  corps.append(q);
}

// Les trois lunes : à quel point c'était dur.
function lunes(id, reponse) {
  const niv = el('div', 'niv');
  niv.setAttribute('role', 'group');
  niv.setAttribute('aria-label', 'À quel point c’était dur');
  for (const n of NIVEAUX) {
    const b = bouton(null, null, reponse.niveau === n.id);
    b.id = `${id}-${n.id}`; b.title = n.nom; b.setAttribute('aria-label', n.nom);
    b.append(lune(n.id));
    b.addEventListener('click', () => { reponse.niveau = n.id; for (const o of niv.children) o.setAttribute('aria-pressed', String(o === b)); });
    niv.append(b);
  }
  return niv;
}

// Des propositions à toucher. Une proposition cochée demande l'année et le niveau,
// sur place ; une proposition déjà dans la vie reste cochée et ne se recoche pas.
function puces(corps, propositions, coches, deja, niveauDefaut = 'cap') {
  const c = el('div', 'chips');
  const dessinerUne = (p) => {
    const boite = el('div', 'puce');
    const fait = deja.has(p.id);
    const reponse = coches.get(p.id);
    const b = bouton('puce-t', p.titre, fait || Boolean(reponse));
    b.id = `pu-${p.id}`;
    if (fait) { b.disabled = true; b.title = 'Déjà dans ta vie'; }
    boite.append(b);
    if (fait || reponse) boite.classList.add('on');
    if (reponse) {
      const a = el('input');
      a.type = 'number'; a.inputMode = 'numeric'; a.placeholder = 'Année'; a.id = `an-${p.id}`; a.value = reponse.annee;
      a.setAttribute('aria-label', `Année de : ${p.titre}`);
      a.addEventListener('input', () => { reponse.annee = a.value; });
      boite.append(a, lunes(`nv-${p.id}`, reponse));
    }
    b.addEventListener('click', () => {
      if (coches.has(p.id)) coches.delete(p.id); else coches.set(p.id, { annee: '', niveau: niveauDefaut });
      const neuve = dessinerUne(p);
      boite.replaceWith(neuve);
      (neuve.querySelector('input') ?? neuve.querySelector('button')).focus();
    });
    return boite;
  };
  for (const p of propositions) c.append(dessinerUne(p));
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

const moment = (genre, cle, r, suite = {}) => ({
  genre, passage: genre === 'passage' ? cle : null, scene: genre === 'scene' ? cle : null, axe: genre === 'axe' ? cle : null, proposition: null,
  titre: r.titre.trim(), niveau: r.niveau, annee: anneeValide(r.annee), date: null, note: '', hautFait: false, rappel: true, ...suite,
});
const rempli = (r) => (r.titre ?? '').trim().length > 0;

// ---------- Ajouter : tout se touche, rien ne s'écrit sauf si on le veut ----------

// Ce qui est déjà dans la vie, par identifiant de passage ou de proposition.
const dejaVecus = () => new Set(etat.moments.flatMap((m) => [m.passage, m.proposition]).filter(Boolean));

// Les moments à écrire à partir de ce qui est coché.
function momentsCoches(coches) {
  const nouveaux = [];
  for (const p of PASSAGES) if (coches.has(p.id)) nouveaux.push(moment('passage', p.id, { titre: p.titre, ...coches.get(p.id) }));
  for (const a of AXES) for (const p of a.propositions) if (coches.has(p.id)) nouveaux.push(moment('axe', a.id, { titre: p.titre, ...coches.get(p.id) }, { proposition: p.id }));
  return nouveaux;
}

async function enregistrer(nouveaux) {
  for (const m of nouveaux) await etat.base.ecrire('moments', m);
  fermerVolet();
  if (!nouveaux.length) return;
  await rafraichir();
  demanderPersistance();
  annoncer(nouveaux.length > 1 ? `${nouveaux.length} moments ajoutés` : 'Moment ajouté', `${pluriel(etat.moments.length, ['moment', 'moments'])} en tout`);
}

function ouvrirAjout() {
  const deja = dejaVecus();
  const coches = new Map(); // identifiant → { annee, niveau }
  const autre = { niveau: 'cap' };
  const scenes = SCENES.map(() => ({ niveau: 'montagne' }));

  ouvrirVolet('add', [
    { label: 'Ta vie', titre: 'Lesquels de ces passages as-tu vécus ?', dessiner(corps) {
      legende(corps);
      puces(corps, PASSAGES, coches, deja);
      question(corps, 'autre', 'Un autre passage qui a compté ?', autre);
    } },
    { label: 'Ta vie', titre: 'Et ça, tu l’as déjà fait ?', dessiner(corps) {
      legende(corps);
      for (const a of AXES) {
        const g = el('div', 'groupe');
        g.append(el('h3', 'lab', a.nom));
        puces(g, a.propositions, coches, deja);
        corps.append(g);
      }
    } },
    { label: 'Ta vie', titre: 'Si tu veux aller plus loin', dessiner(corps) {
      corps.append(el('p', 'aide', 'Trois questions plus personnelles. Tu peux tout passer.'));
      SCENES.forEach((sc, i) => question(corps, `s-${sc.id}`, sc.question, scenes[i]));
    } },
  ], 'Ajouter à ma vie', async () => {
    const nouveaux = momentsCoches(coches);
    if (rempli(autre)) nouveaux.push(moment('passage', null, autre));
    SCENES.forEach((sc, i) => { if (rempli(scenes[i])) nouveaux.push(moment('scene', sc.id, scenes[i], { rappel: !sc.discret })); });
    await enregistrer(nouveaux);
  });
}

// Un axe seul, ouvert depuis sa tuile.
function ouvrirAxe(a) {
  const coches = new Map();
  const libre = { niveau: 'cap' };
  ouvrirVolet('add', [{ label: 'Ta vie', titre: a.nom, dessiner(corps) {
    legende(corps);
    puces(corps, a.propositions, coches, dejaVecus());
    question(corps, `x-${a.id}`, a.question, libre);
  } }], 'Ajouter à ma vie', async () => {
    const nouveaux = momentsCoches(coches);
    if (rempli(libre)) nouveaux.push(moment('axe', a.id, libre));
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
  const fierte = {};

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
    { label: 'Le point du mois', titre: 'Deux dernières choses', dessiner(corps) {
      const d = el('div', 'q');
      d.append(el('label', null, 'Tu as de l’élan, en ce moment ?'));
      choix(d, ELANS, elan, (i) => { elan = i; }, true);
      corps.append(d);
      question(corps, 'fierte', 'Une chose dont tu es contente ce mois-ci ?', fierte, { aide: 'Elle rejoindra ta vie.', sansNiveau: true });
    } },
  ], 'Enregistrer mon point', async () => {
    const roue = Object.fromEntries(DOMAINES.map((d, i) => [d.id, vals[i]]));
    const existant = etat.points.find((p) => p.mois === mois);
    await etat.base.ecrire('points', { ...existant, mois, roue, meteo, elan });
    if (rempli(fierte)) await etat.base.ecrire('moments', moment('axe', 'bonheur', { ...fierte, niveau: 'effort', annee: fierte.annee || an() }));
    fermerVolet();
    await rafraichir();
    demanderPersistance();
    annoncer('C’est noté', 'Ta page est à jour');
  });
}

// ---------- Tout voir : le parcours complet, où l'on corrige ----------

function ouvrirParcours() {
  ouvrirVolet('add', [{ label: pluriel(etat.moments.length, ['moment', 'moments']), titre: 'Tout ton parcours', dessiner: function rendu(corps) {
    corps.textContent = '';
    $('dlg-step').textContent = pluriel(etat.moments.length, ['moment', 'moments']);
    if (!etat.moments.length) { corps.append(el('p', 'aide', 'Rien de noté pour l’instant.')); return; }
    const vie = ruban(etat.moments, an());
    const blocs = [...vie.annees].reverse().filter((a) => a.moments.length).map((a) => [String(a.annee), [...a.moments].reverse()]);
    if (vie.sansDate.length) blocs.push(['Un jour', vie.sansDate]);
    for (const [titre, moments] of blocs) {
      const s = el('div', 'annee');
      const ul = el('ul');
      for (const m of moments) {
        const li = el('li');
        const d = el('div');
        const acts = el('div', 'acts');
        const haut = bouton('mini', 'Haut fait', Boolean(m.hautFait));
        const modifier = bouton('mini', 'Modifier');
        const retirer = bouton('mini', 'Retirer');
        haut.addEventListener('click', async () => {
          if (!m.hautFait && hautsFaits(etat.moments).length >= 3) { annoncer('Trois hauts faits au plus', 'Retires-en un d’abord'); return; }
          await etat.base.ecrire('moments', { ...m, hautFait: !m.hautFait });
          await rafraichir(); rendu(corps);
        });
        modifier.addEventListener('click', () => ouvrirEdition(m));
        retirer.addEventListener('click', async () => {
          await etat.base.retirer('moments', m.id);
          await rafraichir(); rendu(corps);
          annoncer('Moment retiré', m.titre, { texte: 'Annuler', faire: async () => { await etat.base.remettre('moments', m.id); await rafraichir(); if (flux) rendu(corps); } });
        });
        acts.append(haut, modifier, retirer);
        d.append(el('strong', null, m.titre));
        if (m.note) d.append(el('span', 'petit', `« ${m.note} »`));
        d.append(acts);
        li.append(lune(m.niveau), d);
        ul.append(li);
      }
      s.append(el('b', null, titre), ul);
      corps.append(s);
    }
  } }], 'Fermer', async () => fermerVolet());
}

function ouvrirEdition(m) {
  const r = { titre: m.titre, annee: m.annee ?? '', niveau: m.niveau, note: m.note ?? '' };
  ouvrirVolet('add', [{ label: 'Corriger', titre: 'Ce moment, tel que tu le vois', dessiner(corps) {
    legende(corps);
    question(corps, 'edit', 'En quelques mots', r);
    const q = el('div', 'q');
    const lb = el('label', null, 'Un souvenir de ce jour-là ?');
    const note = el('input', 'field');
    note.type = 'text'; note.id = 'q-note'; note.maxLength = 200; note.placeholder = 'Une phrase, si tu veux'; note.value = r.note;
    note.addEventListener('input', () => { r.note = note.value; });
    lb.htmlFor = note.id;
    q.append(lb, note);
    corps.append(q);
  } }], 'Enregistrer', async () => {
    if (rempli(r)) await etat.base.ecrire('moments', { ...m, titre: r.titre.trim(), annee: anneeValide(r.annee), niveau: r.niveau, note: r.note.trim() });
    await rafraichir();
    ouvrirParcours();
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
