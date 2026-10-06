// Les règles de l'app, sans écran ni stockage : tout ce qui se calcule à partir
// des trophées et des points du mois. Chaque fonction reçoit ses données et la
// date du jour en argument, pour pouvoir être essayée à n'importe quelle date.
//
// Formats : une date est 'AAAA-MM-JJ', un mois est 'AAAA-MM'.

import { MOIS } from './config/domaines.js';

/**
 * @typedef {object} Trophee
 * @property {string} id
 * @property {string|null} defId      le trophée proposé d'origine, ou null si perso
 * @property {string} titre
 * @property {string} categorie
 * @property {'bronze'|'argent'|'or'} niveau
 * @property {number|null} annee      facultative : sans elle, le trophée va dans « Un jour »
 * @property {string|null} date       'AAAA-MM-JJ', seulement si le jour est connu
 * @property {string} [note]
 * @property {string[]} [personnes]
 * @property {string|null} [photoId]
 * @property {boolean} [hautFait]
 * @property {boolean} [rappel]       false : ne ressort jamais en souvenir du jour
 * @property {string|null} [supprimeLe]
 *
 * @typedef {object} Passage          une étape d'un compteur (« 10e pays visité : le Japon »)
 * @property {string} id
 * @property {string} compteur
 * @property {number} rang
 * @property {string} [nom]
 * @property {number|null} annee
 * @property {string|null} date
 *
 * @typedef {object} Point            un « point du mois »
 * @property {string} mois            'AAAA-MM'
 * @property {Record<string, number>} roue   1 à 10 par domaine ; un domaine passé est absent
 * @property {number} meteo           1 à 5
 * @property {number} satisfaction    0 à 2
 * @property {number} sens
 * @property {number} energie
 */

const vivant = (x) => !x.supprimeLe;
const vivants = (liste) => liste.filter(vivant);

// ---------- Vitrine ----------

/** Les catégories où il y a au moins un trophée, dans l'ordre de la configuration. */
export function categoriesCouvertes(trophees, categories) {
  const vues = new Set(vivants(trophees).map((t) => t.categorie));
  return categories.filter((c) => vues.has(c.id)).map((c) => c.id);
}

// Le moment d'un trophée, comparable par ordre alphabétique. Une année seule se
// range avant tous les jours de cette année.
const moment = (t) => t.date ?? (t.annee ? `${t.annee}-00-00` : null);

/**
 * Le platine tombe quand chaque catégorie a son trophée. Il est daté du jour où
 * la dernière catégorie a été couverte ; si l'une d'elles n'a aucun trophée daté,
 * il reste sans date.
 * @returns {{annee:number|null, date:string|null}|null}
 */
export function platine(trophees, categories) {
  const actifs = vivants(trophees);
  let dernier = '';
  let datable = true;
  for (const c of categories) {
    const siens = actifs.filter((t) => t.categorie === c.id);
    if (!siens.length) return null;
    const moments = siens.map(moment).filter(Boolean).sort();
    if (!moments.length) datable = false;
    else if (moments[0] > dernier) dernier = moments[0];
  }
  if (!datable) return { annee: null, date: null };
  return { annee: Number(dernier.slice(0, 4)), date: dernier.endsWith('-00-00') ? null : dernier };
}

/** Le nombre de trophées par médaille. Le platine vaut 0 ou 1. */
export function vitrine(trophees, categories) {
  const v = { bronze: 0, argent: 0, or: 0, platine: 0 };
  for (const t of vivants(trophees)) v[t.niveau] += 1;
  if (platine(trophees, categories)) v.platine = 1;
  return v;
}

export const hautsFaits = (trophees) => vivants(trophees).filter((t) => t.hautFait).slice(0, 3);

// ---------- Souvenir du jour ----------

// Un tirage qui ne change pas de la journée : le même souvenir du matin au soir.
function tirageDuJour(jour) {
  let h = 2166136261;
  for (const c of jour) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Un trophée dont c'est l'anniversaire aujourd'hui, sinon un trophée au hasard.
 * Les trophées marqués `rappel: false` ne ressortent jamais.
 * @returns {{trophee:Trophee, ans:number|null}|null}
 */
export function souvenirDuJour(trophees, aujourdhui, tirage = tirageDuJour(aujourdhui)) {
  const candidats = vivants(trophees).filter((t) => t.rappel !== false);
  if (!candidats.length) return null;
  const anniversaires = candidats
    .filter((t) => t.date && t.date.slice(5) === aujourdhui.slice(5) && t.date < aujourdhui)
    .sort((a, b) => Number(Boolean(b.note)) - Number(Boolean(a.note)) || a.date.localeCompare(b.date));
  if (anniversaires.length) {
    const t = anniversaires[0];
    return { trophee: t, ans: Number(aujourdhui.slice(0, 4)) - Number(t.date.slice(0, 4)) };
  }
  return { trophee: candidats[Math.min(candidats.length - 1, Math.floor(tirage * candidats.length))], ans: null };
}

// ---------- Parcours ----------

/**
 * Toutes les années, de la première à `anneeFin`, avec ce qui s'y est passé.
 * Les années vides sont gardées : le ruban les montre. Ce qui n'a pas d'année
 * va dans `sansDate`.
 */
export function parcours(trophees, passages, anneeFin, categories = [], defPlatine = null) {
  const entrees = [
    ...vivants(trophees).map((t) => ({ ...t, genre: 'trophee' })),
    ...vivants(passages).map((p) => ({ ...p, genre: 'passage' })),
  ];
  const p = defPlatine && platine(trophees, categories);
  if (p) entrees.push({ ...defPlatine, ...p, niveau: 'platine', genre: 'platine' });

  const datees = entrees.filter((e) => e.annee);
  const sansDate = entrees.filter((e) => !e.annee);
  if (!datees.length) return { annees: [], sansDate };
  const debut = Math.min(...datees.map((e) => e.annee));
  const fin = Math.max(anneeFin, ...datees.map((e) => e.annee));
  const annees = [];
  for (let a = debut; a <= fin; a += 1) {
    annees.push({
      annee: a,
      entrees: datees.filter((e) => e.annee === a).sort((x, y) => moment(x).localeCompare(moment(y))),
    });
  }
  return { annees, sansDate };
}

// ---------- Carte de vie ----------

/** 'AAAA-MM' décalé de n mois (n peut être négatif). */
export function decalerMois(mois, n) {
  const total = Number(mois.slice(0, 4)) * 12 + Number(mois.slice(5, 7)) - 1 + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

const parMois = (points) => [...points].sort((a, b) => a.mois.localeCompare(b.mois));

/** Le dernier point posé, jusqu'à `mois` compris. */
export function dernierPoint(points, mois) {
  return parMois(points).filter((p) => p.mois <= mois).pop() ?? null;
}

/**
 * Le point à comparer : celui d'il y a 3 mois, ou à défaut le plus récent avant.
 * Rien si le seul point connu est le point actuel.
 */
export function pointDavant(points, actuel, ecart = 3) {
  if (!actuel) return null;
  return dernierPoint(points, decalerMois(actuel.mois, -ecart));
}

/** Ce qui monte et ce qui descend entre deux points, du plus grand écart au plus petit. */
export function ecartsRoue(actuel, avant, domaines) {
  const hausse = [];
  const baisse = [];
  if (!actuel || !avant) return { hausse, baisse };
  for (const d of domaines) {
    const a = actuel.roue[d.id];
    const b = avant.roue[d.id];
    if (a == null || b == null || a === b) continue;
    (a > b ? hausse : baisse).push({ id: d.id, nom: d.nom, ecart: a - b });
  }
  hausse.sort((x, y) => y.ecart - x.ecart);
  baisse.sort((x, y) => x.ecart - y.ecart);
  return { hausse, baisse };
}

const liste = (noms) => (noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}` : noms[0]);

/** La phrase sous la carte. Ce qui baisse est dit sans jugement. */
export function phraseRoue(actuel, avant, domaines) {
  if (!actuel) return '';
  if (!avant) return 'Premier point posé.';
  const { hausse, baisse } = ecartsRoue(actuel, avant, domaines);
  const depuis = `depuis ${MOIS[Number(avant.mois.slice(5, 7)) - 1]}`;
  if (!hausse.length && !baisse.length) return `Tout tient bon ${depuis}.`;
  const phrases = [];
  if (hausse.length) {
    const noms = hausse.map((h) => h.nom);
    phrases.push(`${liste(noms)} ${noms.length > 1 ? 'montent' : 'monte'} ${depuis}.`);
  }
  if (baisse.length) {
    const noms = baisse.map((b) => b.nom);
    phrases.push(`${liste(noms)} ${noms.length > 1 ? 'sont' : 'est'} plus difficile${noms.length > 1 ? 's' : ''} en ce moment.`);
  } else {
    phrases.push('Le reste tient bon.');
  }
  return phrases.join(' ');
}

// ---------- Météo et tendances ----------

/** Les `n` derniers mois jusqu'à `mois`, un mois sauté restant un trou (null). */
export function courbeMeteo(points, mois, n = 12) {
  const connus = new Map(points.map((p) => [p.mois, p.meteo]));
  const courbe = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const m = decalerMois(mois, -i);
    courbe.push({ mois: m, meteo: connus.get(m) ?? null });
  }
  return courbe;
}

const moyenne = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

/**
 * La tendance d'une question : les 3 derniers mois contre les 3 d'avant.
 * @returns {'hausse'|'stable'|'baisse'|null} null tant qu'il n'y a rien à comparer
 */
export function tendance(points, cle, mois, seuil = 0.34) {
  const valeurs = (debut, fin) => points
    .filter((p) => p.mois >= decalerMois(mois, debut) && p.mois <= decalerMois(mois, fin) && p[cle] != null)
    .map((p) => p[cle]);
  const recents = valeurs(-2, 0);
  const anciens = valeurs(-5, -3);
  if (!recents.length || !anciens.length) return null;
  const ecart = moyenne(recents) - moyenne(anciens);
  if (ecart >= seuil) return 'hausse';
  if (ecart <= -seuil) return 'baisse';
  return 'stable';
}

// Jamais un score : seulement des mots.
export const MOTS_TENDANCE = { hausse: 'En hausse', stable: 'Stable', baisse: 'Un peu basse' };
