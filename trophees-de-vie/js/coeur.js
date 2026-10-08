// Les règles de la page, sans écran ni stockage : tout ce qui se calcule à partir
// des moments et des points du mois. Chaque fonction reçoit ses données et la date
// du jour en argument, pour pouvoir être essayée à n'importe quelle date.
//
// Formats : une date est 'AAAA-MM-JJ', un mois est 'AAAA-MM'.

import { MOIS } from './config/domaines.js';

/**
 * @typedef {object} Moment           ce qui est gardé dans la base
 * @property {string} id
 * @property {string|null} [reussite] l'identifiant de la réussite proposée, ou null si elle est écrite à la main
 * @property {string|null} [passage]  ancien nom du même champ (versions 1 et 2)
 * @property {string|null} [proposition] idem
 * @property {string|null} [categorie] choisie à la main ; sinon celle de la réussite
 * @property {string} titre
 * @property {string} [niveau]        choisi à la main, quand aucun chiffre n'existe
 * @property {number|null} annee      facultative : sans elle, le moment va dans « Un jour »
 * @property {string|null} date       'AAAA-MM-JJ', seulement si le jour est connu
 * @property {string} [note]
 * @property {boolean} [hautFait]
 * @property {boolean} [rappel]       false : ne ressort jamais en souvenir du jour
 * @property {string|null} [supprimeLe]
 *
 * @typedef {Moment & {niveau:'or'|'argent'|'bronze', part:number|null, top:string|null, categorie:string|null, modele:string|null, aPreciser:boolean}} Trophee
 *   un moment tel que la page le montre, après `lire`
 *
 * @typedef {object} Point            un « point du mois »
 * @property {string} mois            'AAAA-MM'
 * @property {Record<string, number>} roue   1 à 10 par domaine
 * @property {number} meteo           1 à 5
 * @property {number} elan            0 à 2
 */

const vivant = (x) => !x.supprimeLe;
const vivants = (liste) => liste.filter(vivant);

// ---------- Rareté et médaille ----------

// Or : au plus un adulte sur cinq l'a fait. Argent : au plus un sur deux.
export const SEUILS = { or: 0.2, argent: 0.5 };

// Les niveaux des versions 1 et 2, lus comme les médailles d'aujourd'hui.
const ANCIENS = { montagne: 'or', cap: 'argent', effort: 'bronze' };

/** La réussite proposée dont vient un moment, ou null s'il est écrit à la main. */
export function definition(m, catalogue) {
  const id = m.reussite ?? m.passage ?? m.proposition;
  if (!id) return null;
  const vrai = catalogue.alias[id] ?? id;
  return catalogue.reussites.find((r) => r.id === vrai) ?? null;
}

/** La part des adultes qui l'ont fait, selon l'âge quand le chiffre en dépend. Null sans chiffre. */
export function rarete(m, def, naissance) {
  if (!def) return null;
  if (def.parAge) {
    const age = naissance && m.annee ? m.annee - naissance : null;
    if (age == null) return def.parAge.at(-1).part;
    return def.parAge.find((t) => t.avant == null || age < t.avant).part;
  }
  return def.rarete ?? null;
}

/** La médaille : la rareté d'abord, sinon le choix de la personne, sinon la proposition. */
export function medaille(part, m, def) {
  if (part != null) return part <= SEUILS.or ? 'or' : part <= SEUILS.argent ? 'argent' : 'bronze';
  const choisie = ANCIENS[m.niveau] ?? m.niveau;
  return ['or', 'argent', 'bronze'].includes(choisie) ? choisie : def?.defaut ?? 'argent';
}

/** « Top 16 % ». Jamais moins que 1, pour ne pas écrire « Top 0 % ». */
export const top = (part) => `Top ${Math.max(1, Math.round(part * 100))} %`;

/**
 * Les moments tels que la page les montre : retirés écartés, médaille et catégorie
 * calculées. Le « Top N % » n'est donné qu'à l'or : pour l'argent et le bronze, le
 * chiffre dirait surtout que c'est courant.
 * @returns {Trophee[]}
 */
export function lire(moments, catalogue, naissance = null) {
  return vivants(moments).map((m) => {
    const def = definition(m, catalogue);
    const part = rarete(m, def, naissance);
    const niveau = medaille(part, m, def);
    // `aPreciser` : le trophée porte encore le titre général de sa réussite (« Un diplôme »,
    // mais lequel ?). `modele` : ce titre général, à rappeler une fois le trophée précisé.
    const aPreciser = Boolean(def) && (m.titre === def.titre || m.titre === def.ancienTitre);
    return {
      ...m, niveau, part, top: niveau === 'or' && part != null ? top(part) : null, categorie: m.categorie ?? def?.categorie ?? null,
      modele: def && !aPreciser ? def.titre : null, aPreciser,
    };
  });
}

/** Les réussites proposées déjà dans la vie, pour ne pas les recocher. */
export function dejaFaites(moments, catalogue) {
  return new Set(vivants(moments).map((m) => definition(m, catalogue)?.id).filter(Boolean));
}

// ---------- En chiffres (sur des trophées déjà lus) ----------

/** Le total et le nombre de trophées par médaille. */
export function comptes(trophees) {
  const c = { total: trophees.length, or: 0, argent: 0, bronze: 0 };
  for (const t of trophees) c[t.niveau] += 1;
  return c;
}

/** Les trophées de chaque catégorie, dans l'ordre de la configuration, du plus ancien au plus récent. */
export function parCategorie(trophees, categories) {
  return categories.map((c) => ({ ...c, trophees: trophees.filter((t) => t.categorie === c.id).sort(parTemps) }));
}

export const hautsFaits = (trophees) => trophees.filter((t) => t.hautFait).sort(parTemps).slice(0, 3);

// Du plus rare au plus courant : l'or d'abord, puis la plus petite part, puis le plus récent.
const RANG = { or: 0, argent: 1, bronze: 2 };
function parValeur(a, b) { return RANG[a.niveau] - RANG[b.niveau] || (a.part ?? 1) - (b.part ?? 1) || (b.annee ?? 0) - (a.annee ?? 0); }

/** Les trophées à nommer en premier : c'est eux que la page écrit en toutes lettres. */
export const plusRares = (trophees, n = 3) => [...trophees].sort(parValeur).slice(0, n);

/**
 * Les badges gagnés : un par catégorie qui compte au moins `seuil` trophées, et
 * `nomTout` (identifiant 'tout') quand chaque catégorie en a au moins un.
 * @returns {{id:string, nom:string}[]}
 */
export function badges(trophees, categories, nomTout, seuil = 3) {
  const combien = (c) => trophees.filter((t) => t.categorie === c.id).length;
  const gagnes = categories.filter((c) => c.badge && combien(c) >= seuil).map((c) => ({ id: c.id, nom: c.badge }));
  if (nomTout && categories.every((c) => combien(c) > 0)) gagnes.push({ id: 'tout', nom: nomTout });
  return gagnes;
}

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
export function ruban(trophees, anneeFin) {
  const dates = trophees.filter((t) => t.annee);
  const sansDate = trophees.filter((t) => !t.annee);
  if (!dates.length) return { debut: null, annees: [], sansDate };
  const debut = Math.min(...dates.map((t) => t.annee));
  const fin = Math.max(anneeFin, ...dates.map((t) => t.annee));
  const annees = [];
  for (let a = debut; a <= fin; a += 1) annees.push({ annee: a, trophees: dates.filter((t) => t.annee === a).sort(parTemps) });
  return { debut, annees, sansDate };
}

// Les âges de la vie sous le ruban : une tranche par dizaine d'années.
const TRANCHES = { 0: 'l’enfance', 10: 'l’adolescence', 20: 'la vingtaine', 30: 'la trentaine', 40: 'la quarantaine', 50: 'la cinquantaine', 60: 'la soixantaine' };

/**
 * Les tranches d'âge traversées de `debut` à `fin`, dans l'ordre, avec le nombre
 * d'années du ruban que chacune couvre.
 * @returns {{tranche:number, nom:string, annees:number}[]}
 */
export function decennies(debut, fin, naissance) {
  const tranches = [];
  for (let a = debut; a <= fin; a += 1) {
    const tranche = Math.max(0, Math.floor((a - naissance) / 10) * 10);
    if (tranches.at(-1)?.tranche === tranche) tranches.at(-1).annees += 1;
    else tranches.push({ tranche, nom: TRANCHES[tranche] ?? `les ${tranche} ans`, annees: 1 });
  }
  return tranches;
}

// ---------- Souvenir du jour ----------

// Un tirage qui ne change pas de la journée : le même souvenir du matin au soir.
function tirageDuJour(jour) {
  let h = 2166136261;
  for (const c of jour) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Un trophée dont c'est l'anniversaire aujourd'hui, sinon un trophée au hasard.
 * Ceux marqués `rappel: false` ne ressortent jamais.
 * @returns {{trophee:Trophee, ans:number|null, anniversaire:boolean}|null}
 */
export function souvenirDuJour(trophees, aujourdhui, tirage = tirageDuJour(aujourdhui)) {
  const candidats = trophees.filter((t) => t.rappel !== false).sort(parTemps);
  if (!candidats.length) return null;
  const an = Number(aujourdhui.slice(0, 4));
  const anniversaires = candidats.filter((t) => t.date && t.date.slice(5) === aujourdhui.slice(5) && t.date < aujourdhui);
  if (anniversaires.length) return { trophee: anniversaires[0], ans: an - Number(anniversaires[0].date.slice(0, 4)), anniversaire: true };
  const t = candidats[Math.min(candidats.length - 1, Math.floor(tirage * candidats.length))];
  return { trophee: t, ans: t.annee ? an - t.annee : null, anniversaire: false };
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
