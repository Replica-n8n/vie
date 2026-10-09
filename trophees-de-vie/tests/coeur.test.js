import test from 'node:test';
import assert from 'node:assert/strict';

import { NIVEAUX, CATEGORIES, REUSSITES, ALIAS, CATALOGUE, BADGE_TOUT } from '../js/config/vie.js';
import { DOMAINES, METEOS, ELANS } from '../js/config/domaines.js';
import { MOMENTS, POINTS, NAISSANCE } from './exemple.js';
import {
  SEUILS, definition, rarete, medaille, top, lire, dejaFaites, comptes, parCategorie, hautsFaits, plusRares, badges, ruban, decennies, souvenirDuJour,
  decalerMois, dernierPoint, pointDavant, ecartsRoue, phraseRoue,
} from '../js/coeur.js';

const AUJOURDHUI = '2026-10-05';
const MOIS = '2026-10';
const VUS = lire(MOMENTS, CATALOGUE, NAISSANCE);
const vu = (id, liste = VUS) => liste.find((t) => t.id === id);

// ---------- La configuration tient debout ----------

test('la configuration : trois médailles, six catégories, des réussites sans doublon', () => {
  assert.deepEqual(NIVEAUX.map((n) => n.id), ['bronze', 'argent', 'or']);
  assert.equal(CATEGORIES.length, 6);
  for (const groupe of [REUSSITES, CATEGORIES, NIVEAUX, DOMAINES]) {
    const ids = groupe.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `identifiant en double dans ${ids}`);
  }
  const categories = CATEGORIES.map((c) => c.id);
  for (const r of REUSSITES) assert.ok(categories.includes(r.categorie), `catégorie inconnue pour ${r.id}`);
  for (const c of CATEGORIES) {
    const n = REUSSITES.filter((r) => r.categorie === c.id).length;
    assert.ok(n >= 4 && n <= 7, `${c.id} : ${n} réussites`);
  }
  assert.equal(DOMAINES.length, 8);
  assert.equal(METEOS.length, 5);
  assert.equal(ELANS.length, 3);
});

test('chaque réussite a soit un chiffre, soit une médaille proposée, jamais les deux ni aucun', () => {
  const medailles = NIVEAUX.map((n) => n.id);
  for (const r of REUSSITES) {
    const chiffre = r.rarete != null || Boolean(r.parAge);
    assert.notEqual(chiffre, r.defaut != null, r.id);
    if (r.defaut) assert.ok(medailles.includes(r.defaut), r.id);
    for (const part of [r.rarete, ...(r.parAge ?? []).map((t) => t.part)].filter((p) => p != null)) {
      assert.ok(part > 0 && part < 1, `${r.id} : ${part} n’est pas une part`);
    }
    if (r.parAge) assert.equal(r.parAge.at(-1).avant, undefined, `${r.id} : la dernière tranche sert à l’âge inconnu`);
  }
});

test('les anciens identifiants pointent vers des réussites qui existent', () => {
  const ids = REUSSITES.map((r) => r.id);
  for (const [ancien, nouveau] of Object.entries(ALIAS)) {
    assert.ok(ids.includes(nouveau), `${ancien} → ${nouveau}`);
    assert.ok(!ids.includes(ancien), `${ancien} est à la fois un alias et une réussite`);
  }
});

test('la configuration : des textes neutres, pour tout le monde', () => {
  const textes = [...CATEGORIES.flatMap((c) => [c.nom, c.badge]), ...REUSSITES.map((r) => r.titre), BADGE_TOUT];
  for (const texte of textes) assert.ok(!/(seule?|amoureu(x|se)|née?|ancrée?|S+(euse|eur|trice))/i.test(texte), `texte genré : « ${texte} »`);
});

test('la configuration : aucun tiret long, aucun mot médical', () => {
  const textes = [...NIVEAUX, ...CATEGORIES, ...REUSSITES, ...DOMAINES].flatMap((x) => [x.titre, x.nom].filter(Boolean)).concat(METEOS, ELANS);
  for (const texte of textes) {
    assert.ok(!/[–—]/.test(texte), `tiret dans « ${texte} »`);
    assert.ok(!/dépress|anxi|troubl|diagnos|patholog|symptôm|thérap/i.test(texte), `mot médical dans « ${texte} »`);
  }
});

// ---------- Rareté et médaille ----------

test('la rareté fixe la médaille : or jusqu’à un sur cinq, argent jusqu’à un sur deux', () => {
  assert.deepEqual(SEUILS, { or: 0.2, argent: 0.5 });
  assert.equal(medaille(0.2, {}, null), 'or');
  assert.equal(medaille(0.21, {}, null), 'argent');
  assert.equal(medaille(0.5, {}, null), 'argent');
  assert.equal(medaille(0.51, {}, null), 'bronze');
});

test('avec un chiffre, la médaille choisie à la main ne compte pas', () => {
  // la licence est notée « argent » dans l'exemple, le master aussi : seul le chiffre décide
  assert.equal(vu('licence').niveau, 'argent');
  assert.equal(vu('master').niveau, 'or');
  assert.equal(lire([{ id: 'x', reussite: 'master', titre: 'Master', niveau: 'bronze', annee: 2015 }], CATALOGUE)[0].niveau, 'or');
});

test('sans chiffre : la médaille choisie, sinon celle proposée', () => {
  assert.equal(vu('semi').niveau, 'or');
  assert.equal(vu('bac').niveau, 'bronze');
  const sansChoix = lire([{ id: 'x', reussite: 'marathon', titre: 'Marathon', annee: 2020 }, { id: 'y', reussite: null, titre: 'Libre', annee: 2020 }], CATALOGUE);
  assert.equal(sansChoix[0].niveau, 'or');
  assert.equal(sansChoix[1].niveau, 'argent');
});

test('« Top N % » n’est donné qu’à l’or qui a un chiffre', () => {
  assert.equal(vu('master').top, 'Top 16 %');
  assert.equal(vu('montreal').top, 'Top 4 %');
  assert.equal(vu('licence').top, null, 'argent : pas de chiffre affiché');
  assert.equal(vu('semi').top, null, 'or choisi à la main : pas de chiffre inventé');
  assert.equal(top(0.012), 'Top 1 %');
  assert.equal(top(0.001), 'Top 1 %', 'jamais « Top 0 % »');
});

test('acheter son logement : la médaille dépend de l’âge au moment de l’achat', () => {
  const achat = (annee) => lire([{ id: 'a', reussite: 'proprietaire', titre: 'Achat', annee }], CATALOGUE, NAISSANCE)[0];
  assert.equal(achat(2021).niveau, 'or'); // 29 ans
  assert.equal(achat(2021).top, 'Top 17 %');
  assert.equal(achat(2022).niveau, 'argent'); // 30 ans
  assert.equal(achat(2031).niveau, 'argent'); // 39 ans
  assert.equal(achat(2032).niveau, 'bronze'); // 40 ans
  assert.equal(vu('achat').niveau, 'or');
});

test('sans année de naissance ou sans année d’achat, on prend le chiffre tous âges', () => {
  const def = REUSSITES.find((x) => x.id === 'proprietaire');
  assert.equal(rarete({ annee: 2021 }, def, null), 0.57);
  assert.equal(rarete({ annee: null }, def, NAISSANCE), 0.57);
  assert.equal(lire(MOMENTS, CATALOGUE, null).find((t) => t.id === 'achat').niveau, 'bronze');
});

test('les moments des versions 1 et 2 restent lisibles', () => {
  assert.equal(vu('confinement').niveau, 'argent', '« cap » se lit argent');
  const anciens = lire([{ id: 'm', titre: 'x', niveau: 'montagne', annee: 2020 }, { id: 'e', titre: 'y', niveau: 'effort', annee: 2020 }], CATALOGUE);
  assert.deepEqual(anciens.map((t) => t.niveau), ['or', 'bronze'], '« montagne » se lit or, « effort » bronze');
  assert.equal(vu('confinement').categorie, null);
  // un moment gardé sous un ancien identifiant est lu comme la réussite d'aujourd'hui
  assert.equal(definition(MOMENTS.find((m) => m.id === 'compte'), CATALOGUE).id, 'a-mon-compte');
  assert.equal(vu('compte').niveau, 'or');
  assert.equal(vu('compte').top, 'Top 13 %');
  assert.equal(vu('compte').categorie, 'travailler');
  const v1 = lire([{ id: 'p', genre: 'passage', passage: 'diplome', titre: 'Un diplôme', niveau: 'cap', annee: 2011 }], CATALOGUE)[0];
  assert.equal(v1.categorie, 'apprendre');
  assert.equal(v1.niveau, 'argent');
});

test('une réussite déjà faite se reconnaît, même sous son ancien identifiant', () => {
  const faites = dejaFaites(MOMENTS, CATALOGUE);
  assert.ok(faites.has('master') && faites.has('a-mon-compte') && !faites.has('doctorat'));
  const retire = MOMENTS.map((m) => (m.id === 'master' ? { ...m, supprimeLe: 'x' } : m));
  assert.ok(!dejaFaites(retire, CATALOGUE).has('master'), 'retirée, elle peut se recocher');
});

// ---------- En chiffres ----------

test('les comptes de l’exemple : 21 trophées, 5 en or, 8 en argent, 8 en bronze', () => {
  assert.deepEqual(comptes(VUS), { total: 21, or: 5, argent: 8, bronze: 8 });
});

test('un moment retiré ne compte plus, nulle part', () => {
  const sans = lire(MOMENTS.map((m) => (m.id === 'master' ? { ...m, supprimeLe: '2026-10-01T00:00:00Z' } : m)), CATALOGUE, NAISSANCE);
  assert.equal(comptes(sans).total, 20);
  assert.equal(comptes(sans).or, 4);
  assert.deepEqual(hautsFaits(sans).map((t) => t.id), ['montreal', 'achat']);
  assert.ok(ruban(sans, 2026).annees.every((a) => a.trophees.every((t) => t.id !== 'master')));
});

test('les six catégories de l’exemple, dans l’ordre du temps', () => {
  const cats = parCategorie(VUS, CATEGORIES);
  assert.deepEqual(cats.map((c) => [c.id, c.trophees.length]), [['apprendre', 4], ['travailler', 4], ['installer', 3], ['partir', 2], ['aimer', 2], ['depasser', 5]]);
  assert.deepEqual(cats[5].trophees.map((t) => t.id), ['nager', 'dix-km', 'photos', 'semi', 'potager']);
});

test('une catégorie choisie à la main passe avant celle de la réussite', () => {
  const deplace = lire([{ id: 'x', reussite: 'master', categorie: 'travailler', titre: 'Master', annee: 2015 }], CATALOGUE)[0];
  assert.equal(deplace.categorie, 'travailler');
});

test('les hauts faits : trois au plus, les plus anciens d’abord', () => {
  assert.deepEqual(hautsFaits(VUS).map((t) => t.id), ['master', 'montreal', 'achat']);
  assert.equal(hautsFaits(VUS.map((t) => ({ ...t, hautFait: true }))).length, 3);
});

test('les trophées à nommer d’abord : l’or le plus rare en tête', () => {
  assert.deepEqual(plusRares(VUS).map((t) => t.id), ['montreal', 'compte', 'master']);
  assert.deepEqual(plusRares(VUS, 5).map((t) => t.id), ['montreal', 'compte', 'master', 'achat', 'semi'], 'un or sans chiffre passe après ceux qui en ont un');
  const bronzes = [{ id: 'a', niveau: 'bronze', part: null, annee: 2010 }, { id: 'b', niveau: 'bronze', part: null, annee: 2020 }];
  assert.deepEqual(plusRares(bronzes).map((t) => t.id), ['b', 'a'], 'à médaille égale, le plus récent d’abord');
  assert.deepEqual(plusRares([]), []);
});

test('les badges : trois trophées dans une catégorie, ou un dans chacune', () => {
  for (const c of CATEGORIES) assert.ok(c.badge, `pas de badge pour ${c.id}`);
  // l'exemple compte 4, 4, 3, 2, 2 et 5 trophées par catégorie
  assert.deepEqual(badges(VUS, CATEGORIES, BADGE_TOUT).map((b) => b.id), ['apprendre', 'travailler', 'installer', 'depasser', 'tout']);
  assert.equal(badges(VUS, CATEGORIES, BADGE_TOUT).at(-1).nom, 'Touche-à-tout');
  const sansAimer = VUS.filter((t) => t.categorie !== 'aimer');
  assert.ok(!badges(sansAimer, CATEGORIES, BADGE_TOUT).some((b) => b.id === 'tout'), 'une catégorie vide : pas de Touche-à-tout');
  const deux = VUS.filter((t) => t.categorie === 'partir');
  assert.deepEqual(badges(deux, CATEGORIES, BADGE_TOUT), [], 'deux trophées ne suffisent pas');
  assert.deepEqual(badges([], CATEGORIES, BADGE_TOUT), []);
});

// ---------- Ruban ----------

test('le ruban de l’exemple : de 2009 à 2026, années vides gardées', () => {
  const { debut, annees, sansDate } = ruban(VUS, 2026);
  assert.equal(debut, 2009);
  assert.equal(annees.length, 18);
  assert.equal(annees.at(-1).annee, 2026);
  assert.equal(annees.find((a) => a.annee === 2011).trophees.length, 0);
  assert.equal(annees.find((a) => a.annee === 2025).trophees.length, 3);
  assert.equal(sansDate.length, 0);
});

test('un trophée sans année va dans « Un jour », pas dans le ruban', () => {
  const avec = lire([...MOMENTS, { id: 'x', reussite: null, titre: 'Un jour', niveau: 'argent', annee: null, date: null }], CATALOGUE, NAISSANCE);
  const { annees, sansDate } = ruban(avec, 2026);
  assert.deepEqual(sansDate.map((t) => t.id), ['x']);
  assert.ok(annees.every((a) => a.trophees.every((t) => t.id !== 'x')));
});

test('une vie sans rien de noté donne une page vide, sans erreur', () => {
  assert.deepEqual(ruban([], 2026), { debut: null, annees: [], sansDate: [] });
  assert.deepEqual(comptes([]), { total: 0, or: 0, argent: 0, bronze: 0 });
  assert.equal(souvenirDuJour([], AUJOURDHUI), null);
  assert.deepEqual(lire([], CATALOGUE), []);
});

test('les âges sous le ruban : une tranche par dizaine, comptée en années', () => {
  assert.deepEqual(decennies(2009, 2026, NAISSANCE), [
    { tranche: 10, nom: 'l’adolescence', annees: 3 },
    { tranche: 20, nom: 'la vingtaine', annees: 10 },
    { tranche: 30, nom: 'la trentaine', annees: 5 },
  ]);
  assert.equal(decennies(2009, 2026, NAISSANCE).reduce((n, d) => n + d.annees, 0), 18, 'chaque année du ruban est couverte une fois');
  assert.deepEqual(decennies(1990, 1992, 1992).map((d) => d.nom), ['l’enfance'], 'avant la naissance, on reste dans l’enfance');
  assert.equal(decennies(2062, 2062, 1992)[0].nom, 'les 70 ans');
});

test('un trophée au titre général est « à préciser », un trophée précisé rappelle sa réussite', () => {
  assert.equal(vu('permis').aPreciser, true);
  assert.equal(vu('permis').modele, null);
  assert.equal(vu('licence').aPreciser, false);
  assert.equal(vu('licence').modele, 'Un diplôme du supérieur');
  assert.equal(vu('bac').aPreciser, false, 'écrit à la main : rien à préciser');
  assert.equal(vu('bac').modele, null);
  const v1 = lire([{ id: 'p', genre: 'passage', passage: 'diplome', titre: 'Un diplôme', niveau: 'cap', annee: 2011 }], CATALOGUE)[0];
  assert.equal(v1.aPreciser, true, 'le titre de la version 1 est reconnu comme général');
});

// ---------- Souvenir du jour ----------

test('le souvenir du jour : l’anniversaire du semi-marathon, il y a 2 ans', () => {
  const s = souvenirDuJour(VUS, AUJOURDHUI);
  assert.equal(s.trophee.id, 'semi');
  assert.equal(s.ans, 2);
  assert.equal(s.anniversaire, true);
});

test('sans anniversaire, un trophée au hasard, le même toute la journée, avec son âge', () => {
  const a = souvenirDuJour(VUS, '2026-10-06');
  const b = souvenirDuJour(VUS, '2026-10-06');
  assert.equal(a.anniversaire, false);
  assert.equal(a.trophee.id, b.trophee.id);
  assert.equal(a.ans, 2026 - a.trophee.annee);
});

test('le tirage du souvenir penche vers l’or, la note et ce qui est précisé', () => {
  const banal = { id: 'a', titre: 'Premier emploi', niveau: 'bronze', aPreciser: true, annee: 2010 };
  const beau = { id: 'b', titre: 'Mon marathon', niveau: 'or', note: 'Sous la pluie.', aPreciser: false, annee: 2020 };
  // à poids égaux, un tirage de 0,2 tomberait sur le premier ; ici le second pèse six fois plus
  assert.equal(souvenirDuJour([banal, beau], '2026-06-01', 0.2).trophee.id, 'b');
  assert.equal(souvenirDuJour([banal, beau], '2026-06-01', 0.1).trophee.id, 'a', 'le banal reste possible');
  assert.equal(souvenirDuJour([banal, beau], '2026-06-01', 1).trophee.id, 'b', 'un tirage à 1 ne sort pas de la liste');
});

test('un trophée marqué « pas de rappel » ne ressort jamais', () => {
  for (let i = 0; i <= 50; i += 1) assert.notEqual(souvenirDuJour(VUS, '2026-01-01', i / 50).trophee.rappel, false);
});

// ---------- Carte de vie ----------

test('décaler un mois passe les années dans les deux sens', () => {
  assert.equal(decalerMois('2026-01', -1), '2025-12');
  assert.equal(decalerMois('2025-12', 1), '2026-01');
  assert.equal(decalerMois('2026-09', -3), '2026-06');
});

test('la carte se compare au point d’il y a 3 mois', () => {
  const actuel = dernierPoint(POINTS, MOIS);
  const avant = pointDavant(POINTS, actuel);
  assert.equal(actuel.mois, '2026-09');
  assert.equal(avant.mois, '2026-06');
  assert.deepEqual(ecartsRoue(actuel, avant, DOMAINES).hausse.map((h) => [h.id, h.ecart]), [['amour', 2], ['sante', 1], ['proches', 1], ['cadre', 1]]);
  assert.equal(phraseRoue(actuel, avant, DOMAINES), 'Amour, Santé, Proches et Cadre de vie montent depuis juin. Le reste tient bon.');
});

test('un mois sauté : on compare au point le plus récent avant, pas à rien', () => {
  const troues = POINTS.filter((p) => p.mois !== '2026-06');
  assert.equal(pointDavant(troues, dernierPoint(troues, MOIS)).mois, '2026-05');
});

test('un seul point : pas de comparaison', () => {
  const seul = [POINTS.at(-1)];
  const actuel = dernierPoint(seul, MOIS);
  assert.equal(pointDavant(seul, actuel), null);
  assert.equal(phraseRoue(actuel, null, DOMAINES), 'Premier point posé.');
  assert.equal(dernierPoint([], MOIS), null);
});

test('ce qui baisse est dit sans jugement', () => {
  const avant = { mois: '2026-06', roue: { sante: 7, travail: 8, amour: 5 } };
  const actuel = { mois: '2026-09', roue: { sante: 7, travail: 6 } };
  assert.equal(phraseRoue(actuel, avant, DOMAINES), 'Travail est plus difficile en ce moment.');
  assert.equal(phraseRoue(avant, avant, DOMAINES), 'Tout tient bon depuis juin.');
});
