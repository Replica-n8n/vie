// Repas : la semaine (14 repas), les courses et les fiches de recettes.
// Le plan vient de plan.json, déposé chaque semaine par repas/tools/semaine.mjs ; les cases
// cochées restent dans le téléphone (localStorage, une clé par semaine).
import { MACROS, somme, reste, fraction, lireEtat, ecrireEtat, jourParDefaut, dateLocale } from './coeur.js?v=2';

const S = { plan: null, etat: { cuisines: {}, pris: {} }, jour: null, vue: 'jour' };
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ALIMENTS = ['courge', 'betterave', 'epinard', 'saumon', 'ble', 'tomate'];
const COULEUR = { kcal: 'var(--accent)', p: 'var(--p)', g: 'var(--g)', l: 'var(--l)', f: 'var(--f)' };
const CHECK = (c, s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
let FESTON = '';
for (let i = 0; i <= 360; i += 3) { const a = (i * Math.PI) / 180, r = 34 + 3.4 * Math.cos(12 * a); FESTON += `${i ? 'L' : 'M'}${(38 + r * Math.cos(a)).toFixed(2)} ${(38 + r * Math.sin(a)).toFixed(2)}`; }
const biscuit = () => `<svg class="cookie" width="76" height="76" viewBox="0 0 76 76" aria-hidden="true"><path d="${FESTON}Z" fill="var(--action)"/><g transform="translate(24 24)">${CHECK('var(--surAction)')}</g></svg>`;
// Une classe par aliment, pas d'attribut style : la règle de sécurité (CSP) bloque les styles en ligne.
const teinte = (ing) => (ALIMENTS.includes(ing) ? `al-${ing}` : '');
const court = (r) => String(r.titre).split(',')[0];
const detail = (r) => String(r.titre).split(',').slice(1).join(',').trim();
const repasDu = (date) => (S.plan?.repas || []).filter((r) => r.date === date);

function vague(v, coul) {
  const w = 200, fin = Math.max(0, Math.round(w * Math.min(1, v))); let d = 'M2 6';
  for (let x = 2; x <= fin; x += 2) d += ` L${x} ${(6 + 3 * Math.sin(x / 4)).toFixed(2)}`;
  return `<svg viewBox="0 0 ${w} 12" preserveAspectRatio="none" aria-hidden="true"><path d="M${Math.min(fin + 6, w - 2)} 6 H${w - 2}" stroke="var(--carte2)" stroke-width="4" stroke-linecap="round"/>${fin > 2 ? `<path d="${d}" stroke="${coul}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : ''}</svg>`;
}
const barres = (t, o) => MACROS.map(([k, nom, u]) => `<div class="lg"><span>${nom}</span>${vague(t[k] / o[k], COULEUR[k])}<span class="v num">${Math.round(t[k])} / ${o[k]}${u}</span></div>`).join('');

/* Les objectifs de la JOURNÉE (2 200 kcal) : les deux repas en couvrent une part, le reste va au
   petit-déjeuner et aux collations, chiffré macro par macro. */
function journee(t, titre) {
  const oj = S.plan.objectifJour, r = reste(t, oj);
  return `<section class="bloc"><h3>${titre}</h3>${barres(t, oj)}
    <p class="note">Ces barres comptent le déjeuner et le dîner. Reste pour le petit-déjeuner et les collations : <b class="num">${r[0]}</b>, ${r.slice(1).join(', ')}.</p></section>`;
}

function annoncer(t) { const a = $('annonce'); a.textContent = ''; setTimeout(() => (a.textContent = t), 50); }
function montrer(msg) { $('alerte').hidden = !msg; $('alerte').textContent = msg || ''; }

function rendre() {
  for (const b of document.querySelectorAll('.nav button')) b.setAttribute('aria-pressed', String(b.dataset.vue === S.vue));
  const v = $('vue');
  if (!S.plan) return;
  const jours = S.plan.jours || [];
  if (!S.jour || !jours.some((j) => j.date === S.jour)) S.jour = jourParDefaut(jours, dateLocale());
  /* Le contenu est redessiné à chaque changement : on rend le focus au même contrôle. */
  const f = document.activeElement;
  const cle = f?.dataset?.cuire ? `[data-cuire="${CSS.escape(f.dataset.cuire)}"]` : f?.dataset?.pris ? `[data-pris="${CSS.escape(f.dataset.pris)}"]` : null;
  if (S.vue === 'jour') vueJour(v, jours); else if (S.vue === 'semaine') vueSemaine(v, jours); else vueCourses(v);
  if (cle) document.querySelector(cle)?.focus();
}

function vueJour(v, jours) {
  const j = jours.find((x) => x.date === S.jour) || {}, rs = repasDu(S.jour);
  const faits = rs.filter((r) => S.etat.cuisines[r.id]).length;
  $('titre').textContent = j.nom || 'Repas';
  $('sous').textContent = `${Number((S.jour || '').slice(8))} ${S.plan.mois || ''} · ${faits} sur ${rs.length} cuisiné${faits > 1 ? 's' : ''}`;
  const bande = jours.map((x) => { const r2 = repasDu(x.date);
    return `<button type="button" class="j" data-jour="${x.date}" aria-pressed="${x.date === S.jour}" aria-label="${esc(x.nom)}, ${r2.filter((r) => S.etat.cuisines[r.id]).length} sur ${r2.length} cuisinés">${esc(x.nom[0])}<span class="pts">${r2.map((r) => `<i class="${S.etat.cuisines[r.id] ? 'ok' : ''}"></i>`).join('')}</span></button>`; }).join('');
  const mt = (S.plan.meteo || []).find((x) => x.date === S.jour);
  const ciel = mt ? `<p class="meteo">${Math.round(mt.max)} °C à Montréal, normale ${Math.round(mt.normale)} °C${mt.pluie >= 5 ? ' · pluie' : ''}</p>` : '';
  v.innerHTML = `<div class="jours" role="group" aria-label="Jours de la semaine">${bande}</div>${ciel}${rs.map(plat).join('')}${journee(somme(rs), 'Ta journée, par personne')}`;
}

function plat(r) {
  const fait = !!S.etat.cuisines[r.id];
  // Le féculent suggéré par la recette, pesé cuit, pour viser les calories et les glucides du repas.
  const fec = r.accompagnement ? `avec ${r.accompagnement.g} g de ${r.accompagnement.nom.replace(/\s*\(.*\)$/, '')} cuit` : '';
  const extra = [r.part ? `${fraction(r.part)} portions par assiette` : '', fec, r.facteur ? `recette × ${fraction(r.facteur)}` : '', r.double ? `en double : ${esc(r.double)}` : '', r.restesDe ? `restes de ${esc(r.restesDe)}` : ''].filter(Boolean);
  const meta = [esc(detail(r)), ...extra, `${esc(r.temps)} min`].filter(Boolean).join(' · ');
  return `<article class="plat ${teinte(r.ing)}"><span class="puce">${esc(r.moment)}</span><h2>${esc(court(r))}</h2>
    <span class="meta">${meta}</span>
    ${r.manques?.length ? `<span class="meta manque">Non compté dans les chiffres : ${r.manques.map(esc).join(', ')}</span>` : ''}
    ${r.cuisson && S.plan.recettes?.[r.cuisson] ? `<button type="button" class="ouvrir" data-fiche="${esc(r.cuisson)}">Voir la recette</button>` : ''}
    <div class="act"><button type="button" class="cuire ${fait ? 'fait' : ''}" data-cuire="${esc(r.id)}" aria-pressed="${fait}" aria-label="${fait ? 'Cuisiné. Toucher pour annuler' : 'Marquer cuisiné'}">${fait ? biscuit() : 'Cuisiné'}</button></div></article>`;
}

function vueSemaine(v, jours) {
  $('titre').textContent = 'Semaine';
  const n = S.plan.repas.filter((r) => S.etat.cuisines[r.id]).length;
  $('sous').textContent = `${S.plan.libelle || ''} · ${n} sur ${S.plan.repas.length} cuisinés`;
  const auj = dateLocale();
  const lignes = jours.map((j) => `<div class="ligne ${j.date === auj ? 'auj' : ''}"><span class="jr">${esc(j.nom.slice(0, 3))}</span>${repasDu(j.date).map((r) =>
    `<button type="button" class="mini ${teinte(r.ing)}" data-jour="${j.date}" data-va="jour" aria-label="${esc(j.nom)} ${esc(r.moment)} : ${esc(court(r))}"><b>${esc(court(r))}</b><small>${esc(r.temps)} min</small>${S.etat.cuisines[r.id] ? `<span class="ok">${CHECK('var(--surAction)', 13)}</span>` : ''}</button>`).join('')}</div>`).join('');
  const nb = jours.length || 1, tot = somme(S.plan.repas), moy = {};
  for (const [k] of MACROS) moy[k] = Math.round(tot[k] / nb);
  /* Un plat compte une fois, même cuisiné avant la semaine. */
  const vus = new Set(), src = {};
  for (const r of S.plan.repas) if (r.proteine && !vus.has(r.titre)) { vus.add(r.titre); src[r.proteine] = (src[r.proteine] || 0) + 1; }
  v.innerHTML = `<div class="sem">${lignes}</div>${journee(moy, 'Moyenne par jour, par personne')}
    <section class="bloc"><h3>Variété des protéines</h3><div class="puces">${Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, x]) => `<span>${esc(k)} <b class="num">×${x}</b></span>`).join('')}</div></section>`;
}

function vueCourses(v) {
  const c = S.plan.courses || [], aPrendre = c.filter((a) => !a.enStock), restant = aPrendre.filter((a) => !S.etat.pris[a.id]).length;
  $('titre').textContent = 'Courses';
  $('sous').textContent = `${restant} article${restant > 1 ? 's' : ''} à prendre${S.plan.stockConnu ? ' · ton inventaire est déduit' : ''}`;
  const rayons = [...new Set(aPrendre.map((a) => a.rayon))];
  v.innerHTML = `<section class="bloc">${rayons.map((ray) => `<div class="rayon">${esc(ray)}</div>` + aPrendre.filter((a) => a.rayon === ray).map((a) => {
      const p = !!S.etat.pris[a.id];
      return `<button type="button" class="article" data-pris="${esc(a.id)}" aria-pressed="${p}"><span class="case" aria-hidden="true">${p ? CHECK('var(--surAction)', 18) : ''}</span><span class="nom"><b>${esc(a.nom)}</b>${a.stock ? `<small>${esc(a.stock)}</small>` : ''}</span><span class="qte">${esc(a.qte)}</span></button>`; }).join('')).join('')}
    ${c.some((a) => a.enStock) ? `<div class="rayon">Déjà à la maison</div>${c.filter((a) => a.enStock).map((a) => `<div class="stock"><span>${esc(a.nom)}<small>${esc(a.stock || '')}</small></span><span>${esc(a.qte)}</span></div>`).join('')}` : ''}
    <p class="note">${S.plan.stockConnu ? 'Les quantités tiennent compte de ton inventaire. « Vérifie » : tu en as, mais je ne sais pas combien.' : 'Tout est listé : ton inventaire n’est pas encore connu.'}</p></section>`;
}

// ---------- La fiche de recette ----------

let ouvreur = null; // le bouton qui a ouvert la fiche reprend le focus à la fermeture
function ouvrirFiche(cid, bouton) {
  const r = S.plan.recettes?.[cid]; if (!r) return;
  ouvreur = bouton || null;
  const fiche = $('fiche');
  const lignes = r.ingredients.map((i) => `${i.section ? `<li class="sec">${esc(i.section)}</li>` : ''}<li><b>${esc(i.qte)}</b><span>${esc(i.texte)}${i.nonCompte ? ' <span class="nc">(non compté)</span>' : ''}</span></li>`).join('');
  fiche.innerHTML = `<div class="page">
    <div class="haut"><span class="sous">${r.facteur && r.facteur !== 1 ? `Recette × ${fraction(r.facteur)}` : 'Recette telle quelle'} · ${esc(r.temps)} min</span><button type="button" class="fermer" data-fermer>Fermer</button></div>
    <h2 id="fiche-titre">${esc(r.nom)}</h2>
    <p class="sous">À cuisiner : ${esc(r.quand)}</p>
    <section class="bloc"><h3>Ingrédients, quantités de la semaine</h3><ul class="ing">${lignes}</ul>
      <p class="note">À gauche, ce qu’il faut pour la semaine ; à droite, la ligne de la recette d’origine.</p></section>
    <section class="bloc"><h3>Étapes</h3><ol class="etapes">${r.etapes.map((e) => `<li>${esc(e)}</li>`).join('')}</ol>
      ${r.notes ? `<p class="note">${esc(r.notes)}</p>` : ''}</section>
    <p class="sous"><a href="${esc(r.lien)}" target="_blank" rel="noopener">Recette d’origine</a></p></div>`;
  fiche.hidden = false; fiche.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  history.pushState({ fiche: cid }, '');
  fiche.querySelector('[data-fermer]').focus();
}
function fermerFiche() {
  const fiche = $('fiche'); if (fiche.hidden) return;
  fiche.hidden = true; document.body.style.overflow = '';
  if (ouvreur?.isConnected) ouvreur.focus();
}
addEventListener('popstate', fermerFiche); // le geste retour d'Android ferme la fiche

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-fermer]')) { history.back(); return; }
  const fi = e.target.closest('[data-fiche]');
  if (fi) { ouvrirFiche(fi.dataset.fiche, fi); return; }
  const nav = e.target.closest('[data-vue]');
  if (nav) { S.vue = nav.dataset.vue; rendre(); scrollTo(0, 0); return; }
  const j = e.target.closest('[data-jour]');
  if (j) { S.jour = j.dataset.jour; if (j.dataset.va) { S.vue = 'jour'; scrollTo(0, 0); } rendre(); return; }
  const c = e.target.closest('[data-cuire]');
  if (c) {
    const id = c.dataset.cuire, val = !S.etat.cuisines[id];
    S.etat.cuisines = { ...S.etat.cuisines, [id]: val };
    if (val) navigator.vibrate?.(20);
    garder(); rendre(); annoncer(val ? 'Repas marqué cuisiné' : 'Repas remis à faire');
    return;
  }
  const p = e.target.closest('[data-pris]');
  if (p) { const id = p.dataset.pris; S.etat.pris = { ...S.etat.pris, [id]: !S.etat.pris[id] }; garder(); rendre(); }
});
function garder() {
  if (!ecrireEtat(localStorage, S.plan.semaine, S.etat)) montrer('Ce téléphone refuse de garder les cases : elles seront perdues en fermant.');
}

// ---------- Le plan ----------

async function charger() {
  try {
    const rep = await fetch('plan.json', { cache: 'no-cache' });
    if (!rep.ok) throw new Error(rep.status);
    S.plan = await rep.json();
    S.etat = lireEtat(localStorage, S.plan.semaine);
    montrer('');
    rendre();
  } catch {
    $('sous').textContent = 'Le planning ne se charge pas. Vérifie la connexion, puis rouvre l’app.';
  }
}
charger();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !S.plan) charger(); });

// ---------- Installer ----------

// Visible tant que l'app n'est pas installée. Sans invite du navigateur, il explique le chemin.
let invite = null;
const installee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
$('installer').hidden = installee();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invite = e; });
addEventListener('appinstalled', () => { invite = null; $('installer').hidden = true; });
$('installer').addEventListener('click', async () => {
  if (invite) { invite.prompt(); await invite.userChoice; invite = null; return; }
  montrer('Sur Android : menu ⋮ du navigateur, puis « Ajouter à l’écran d’accueil ». Sur iPhone : Partager, puis « Sur l’écran d’accueil ».');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // Hors ligne, update() échoue : sans réseau il n'y a rien à mettre à jour, on se tait.
    const maj = () => reg.update().catch(() => {});
    maj();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maj(); });
  }).catch(() => {});
}
