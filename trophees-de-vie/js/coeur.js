// Les règles de la page, sans écran ni stockage : tout ce qui se calcule à partir
// des moments et des points du mois. Chaque fonction reçoit ses données et la date
// du jour en argument, pour pouvoir être essayée à n'importe quelle date.
//
// Formats : une date est 'AAAA-MM-JJ', un mois est 'AAAA-MM'.

import { MOIS } from './config/domaines.js';

/**
 * @typedef {object} Moment
 * @property {string} id
 * @property {'passage'|'scene'|'axe'} genre
 * @property {string|null} passage    l'identifiant du passage proposé, ou null s'il est écrit à la main
 * @property {string|null} scene
 * @property {string|null} axe        l'un des cinq axes, pour le genre 'axe'
 * @property {string} titre
 * @property {'effort'|'cap'|'montagne'} niveau
 * @property {number|null} annee      facultative : sans elle, le moment va dans « Un jour »
 * @property {string|null} date       'AAAA-MM-JJ', seulement si le jour est connu
 * @property {string} [note]
 * @property {boolean} [hautFait]
 * @property {boolean} [rappel]       false : ne ressort jamais en souvenir du jour
 * @property {string|null} [supprimeLe]
 *
 * @typedef {object} Point            un « point du mois »
 * @property {string} mois            'AAAA-MM'
 * @property {Record<string, number>} roue   1 à 10 par domaine
 * @property {number} meteo           1 à 5
 * @property {number} elan            0 à 2
 */

const vivant = (x) => !x.supprimeLe;
const vivants = (liste) => liste.filter(vivant);

// ---------- En chiffres ----------

/** Le total et le nombre de moments par niveau. */
export function comptes(moments, niveaux) {
  const actifs = vivants(moments);
  const parNiveau = Object.fromEntries(niveaux.map((n) => [n.id, 0]));
  for (const m of actifs) if (m.niveau in parNiveau) parNiveau[m.niveau] += 1;
  return { total: actifs.length, ...parNiveau };
}

/** Les moments de chaque axe, dans l'ordre de la configuration, du plus ancien au plus récent. */
export function parAxe(moments, axes) {
  const actifs = vivants(moments);
  return axes.map((a) => ({ ...a, moments: actifs.filter((m) => m.genre === 'axe' && m.axe === a.id).sort(parTemps) }));
}

export const hautsFaits = (moments) => vivants(moments).filter((m) => m.hautFait).sort(parTemps).slice(0, 3);

// Le moment d'un moment, comparable par ordre alphabétique. Une année seule se
// range avant tous les jours de cette année, et « sans année » à la fin.
const instant = (m) => m.date ?? (m.annee ? `${m.annee}-00-00` : '9999');
function parTemps(a, b) { return instant(a).localeCompare(instant(b)); }

// ---------- Ruban et parcours ----------

/**
 * Toutes les années, de la première à `anneeFin`, avec ce qui s'y est passé.
 * Les années vides sont gardées : le ruban les montre. Ce qui n'a pas d'année
 * va dans `sansDate`.
 */
export function ruban(moments, anneeFin) {
  const actifs = vivants(moments);
  const dates = actifs.filter((m) => m.annee);
  const sansDate = actifs.filter((m) => !m.annee);
  if (!dates.length) return { debut: null, annees: [], sansDate };
  const debut = Math.min(...dates.map((m) => m.annee));
  const fin = Math.max(anneeFin, ...dates.map((m) => m.annee));
  const annees = [];
  for (let a = debut; a <= fin; a += 1) annees.push({ annee: a, moments: dates.filter((m) => m.annee === a).sort(parTemps) });
  return { debut, annees, sansDate };
}

// ---------- Souvenir du jour ----------

// Un tirage qui ne change pas de la journée : le même souvenir du matin au soir.
function tirageDuJour(jour) {
  let h = 2166136261;
  for (const c of jour) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Un moment dont c'est l'anniversaire aujourd'hui, sinon un moment au hasard.
 * Ceux marqués `rappel: false` ne ressortent jamais.
 * @returns {{moment:Moment, ans:number|null, anniversaire:boolean}|null}
 */
export function souvenirDuJour(moments, aujourdhui, tirage = tirageDuJour(aujourdhui)) {
  const candidats = vivants(moments).filter((m) => m.rappel !== false).sort(parTemps);
  if (!candidats.length) return null;
  const an = Number(aujourdhui.slice(0, 4));
  const anniversaires = candidats.filter((m) => m.date && m.date.slice(5) === aujourdhui.slice(5) && m.date < aujourdhui);
  if (anniversaires.length) return { moment: anniversaires[0], ans: an - Number(anniversaires[0].date.slice(0, 4)), anniversaire: true };
  const m = candidats[Math.min(candidats.length - 1, Math.floor(tirage * candidats.length))];
  return { moment: m, ans: m.annee ? an - m.annee : null, anniversaire: false };
}

// ---------- Carte de vie ----------

/** 'AAAA-MM' décalé de n mois (n peut être négatif). */
export function decalerMois(mois, n) {
  const total = Number(mois.slice(0, 4)) * 12 + Number(mois.slice(5, 7)) - 1 + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** Le dernier point posé, jusqu'à `mois` compris. */
export function dernierPoint(points, mois) {
  return [...points].sort((a, b) => a.mois.localeCompare(b.mois)).filter((p) => p.mois <= mois).pop() ?? null;
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
