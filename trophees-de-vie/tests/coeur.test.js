import test from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIES, TROPHEES, COMPTEURS, NIVEAUX, PLATINE } from '../js/config/trophees.js';
import { DOMAINES, METEOS, QUESTIONS } from '../js/config/domaines.js';
import { DEMO } from '../js/config/demo.js';
import {
  categoriesCouvertes, platine, vitrine, hautsFaits, souvenirDuJour, parcours,
  decalerMois, dernierPoint, pointDavant, ecartsRoue, phraseRoue, courbeMeteo, tendance,
} from '../js/coeur.js';

const AUJOURDHUI = '2026-10-03';
const MOIS = '2026-09';

// ---------- La configuration tient debout ----------

test('la configuration : 7 catégories, une trentaine de trophées, tous valides', () => {
  assert.equal(CATEGORIES.length, 7);
  assert.ok(TROPHEES.length >= 28 && TROPHEES.length <= 40, `${TROPHEES.length} trophées`);
  const ids = new Set();
  const categories = new Set(CATEGORIES.map((c) => c.id));
  for (const t of [...TROPHEES, ...COMPTEURS]) {
    assert.ok(!ids.has(t.id), `identifiant en double : ${t.id}`);
    ids.add(t.id);
    assert.ok(categories.has(t.categorie), `catégorie inconnue pour ${t.id}`);
  }
  for (const t of TROPHEES) assert.ok(NIVEAUX.includes(t.niveau), `niveau inconnu pour ${t.id}`);
  for (const c of CATEGORIES) assert.ok(TROPHEES.some((t) => t.categorie === c.id), `aucune proposition en ${c.id}`);
});

test('la configuration : aucun tiret cadratin, aucun mot médical', () => {
  const textes = [...CATEGORIES, ...TROPHEES, ...COMPTEURS, ...DOMAINES, ...QUESTIONS]
    .flatMap((x) => [x.titre, x.nom, x.question].filter(Boolean)).concat(METEOS);
  for (const texte of textes) {
    assert.ok(!/[–—]/.test(texte), `tiret dans « ${texte} »`);
    assert.ok(!/dépress|anxi|troubl|diagnos|patholog|symptôm|thérap/i.test(texte), `mot médical dans « ${texte} »`);
  }
});

test('la démonstration : chaque trophée pointe vers une catégorie et une proposition qui existent', () => {
  const categories = new Set(CATEGORIES.map((c) => c.id));
  const propositions = new Set(TROPHEES.map((t) => t.id));
  for (const t of DEMO.trophees) {
    assert.ok(categories.has(t.categorie), t.id);
    assert.ok(t.defId === null || propositions.has(t.defId), `${t.id} → ${t.defId}`);
  }
  const domaines = DOMAINES.map((d) => d.id).sort();
  for (const p of DEMO.points) assert.deepEqual(Object.keys(p.roue).sort(), domaines, p.mois);
  assert.equal(DEMO.points.length, 14);
  assert.equal(DEMO.points.at(-1).mois, MOIS);
});

// ---------- Vitrine ----------

test('la vitrine de Léa : 5 bronze, 10 argent, 5 or, 1 platine', () => {
  assert.deepEqual(vitrine(DEMO.trophees, CATEGORIES), { bronze: 5, argent: 10, or: 5, platine: 1 });
});

test('la vitrine ignore un trophée retiré', () => {
  const sans = DEMO.trophees.map((t) => (t.id === 'demo-master' ? { ...t, supprimeLe: '2026-10-01T00:00:00Z' } : t));
  assert.equal(vitrine(sans, CATEGORIES).or, 4);
});

test('les catégories couvertes gardent l’ordre de la configuration', () => {
  assert.deepEqual(categoriesCouvertes(DEMO.trophees, CATEGORIES), CATEGORIES.map((c) => c.id));
  const deux = DEMO.trophees.filter((t) => ['corps', 'aventure'].includes(t.categorie));
  assert.deepEqual(categoriesCouvertes(deux, CATEGORIES), ['aventure', 'corps']);
});

test('le platine tombe le jour où la dernière catégorie est couverte', () => {
  // Liens est la dernière catégorie ouverte par Léa : marraine de Jeanne, le 19 février 2023.
  assert.deepEqual(platine(DEMO.trophees, CATEGORIES), { annee: 2023, date: '2023-02-19' });
});

test('pas de platine tant qu’une catégorie est vide, et pas de trace dans la vitrine', () => {
  const sansLiens = DEMO.trophees.filter((t) => t.categorie !== 'liens');
  assert.equal(platine(sansLiens, CATEGORIES), null);
  assert.equal(vitrine(sansLiens, CATEGORIES).platine, 0);
});

test('un platine dont une catégorie n’a aucune date reste sans date', () => {
  const flou = DEMO.trophees.map((t) => (t.categorie === 'liens' ? { ...t, annee: null, date: null } : t));
  assert.deepEqual(platine(flou, CATEGORIES), { annee: null, date: null });
});

test('les hauts faits : trois au plus', () => {
  assert.deepEqual(hautsFaits(DEMO.trophees).map((t) => t.id), ['demo-master', 'demo-montreal', 'demo-rupture']);
  assert.equal(hautsFaits(DEMO.trophees.map((t) => ({ ...t, hautFait: true }))).length, 3);
});

// ---------- Souvenir du jour ----------

test('le souvenir du jour : l’anniversaire du semi-marathon, il y a 2 ans', () => {
  const s = souvenirDuJour(DEMO.trophees, AUJOURDHUI);
  assert.equal(s.trophee.id, 'demo-semi');
  assert.equal(s.ans, 2);
});

test('sans anniversaire, un trophée au hasard, le même toute la journée', () => {
  const a = souvenirDuJour(DEMO.trophees, '2026-10-04');
  const b = souvenirDuJour(DEMO.trophees, '2026-10-04');
  assert.equal(a.ans, null);
  assert.equal(a.trophee.id, b.trophee.id);
});

test('un trophée marqué « pas de rappel » ne ressort jamais, même le jour anniversaire', () => {
  // « Demander de l’aide » date du 20 mai 2021 et porte rappel: false.
  const s = souvenirDuJour(DEMO.trophees, '2026-05-20');
  assert.notEqual(s.trophee.id, 'demo-aide');
  for (let i = 0; i < 50; i += 1) {
    const tire = souvenirDuJour(DEMO.trophees, '2026-01-01', i / 50);
    assert.notEqual(tire.trophee.rappel, false, tire.trophee.id);
  }
});

test('le souvenir du jour ne casse pas sur une vitrine vide ni sur un tirage à 1', () => {
  assert.equal(souvenirDuJour([], AUJOURDHUI), null);
  assert.ok(souvenirDuJour(DEMO.trophees, '2026-01-01', 1).trophee);
});

// ---------- Parcours ----------

test('le parcours de Léa : de 2009 à 2026, années vides gardées, platine en 2023', () => {
  const { annees, sansDate } = parcours(DEMO.trophees, DEMO.passages, 2026, CATEGORIES, PLATINE);
  assert.equal(annees[0].annee, 2009);
  assert.equal(annees.at(-1).annee, 2026);
  assert.equal(annees.length, 18);
  assert.equal(annees.find((a) => a.annee === 2011).entrees.length, 0);
  assert.equal(sansDate.length, 0);
  const a2023 = annees.find((a) => a.annee === 2023).entrees;
  assert.deepEqual(a2023.map((e) => e.genre), ['trophee', 'platine']);
  const a2025 = annees.find((a) => a.annee === 2025).entrees;
  assert.deepEqual(a2025.map((e) => e.genre), ['passage', 'trophee']);
});

test('un trophée sans année va dans « Un jour », pas dans le ruban', () => {
  const avec = [...DEMO.trophees, { id: 'x', titre: 'Un jour', categorie: 'corps', niveau: 'bronze', annee: null, date: null }];
  const { annees, sansDate } = parcours(avec, [], 2026);
  assert.deepEqual(sansDate.map((e) => e.id), ['x']);
  assert.ok(annees.every((a) => a.entrees.every((e) => e.id !== 'x')));
});

test('le parcours d’une vie sans rien de noté est vide, sans erreur', () => {
  assert.deepEqual(parcours([], [], 2026), { annees: [], sansDate: [] });
});

// ---------- Carte de vie ----------

test('décaler un mois passe les années dans les deux sens', () => {
  assert.equal(decalerMois('2026-01', -1), '2025-12');
  assert.equal(decalerMois('2025-12', 1), '2026-01');
  assert.equal(decalerMois('2026-09', -3), '2026-06');
  assert.equal(decalerMois('2026-09', -12), '2025-09');
});

test('la carte de Léa se compare au point d’il y a 3 mois', () => {
  const actuel = dernierPoint(DEMO.points, MOIS);
  const avant = pointDavant(DEMO.points, actuel);
  assert.equal(actuel.mois, '2026-09');
  assert.equal(avant.mois, '2026-06');
  assert.deepEqual(ecartsRoue(actuel, avant, DOMAINES).hausse.map((h) => [h.id, h.ecart]),
    [['amour', 2], ['sante', 1], ['proches', 1], ['cadre', 1]]);
  assert.equal(phraseRoue(actuel, avant, DOMAINES), 'Amour, Santé, Proches et Cadre de vie montent depuis juin. Le reste tient bon.');
});

test('un mois sauté : on compare au point le plus récent avant, pas à rien', () => {
  const troues = DEMO.points.filter((p) => p.mois !== '2026-06');
  assert.equal(pointDavant(troues, dernierPoint(troues, MOIS)).mois, '2026-05');
});

test('un seul point : pas de comparaison, pas de tendance', () => {
  const seul = [DEMO.points.at(-1)];
  const actuel = dernierPoint(seul, MOIS);
  assert.equal(pointDavant(seul, actuel), null);
  assert.equal(phraseRoue(actuel, null, DOMAINES), 'Premier point posé.');
  assert.equal(tendance(seul, 'satisfaction', MOIS), null);
});

test('ce qui baisse est dit sans jugement, et un domaine passé est ignoré', () => {
  const avant = { mois: '2026-06', roue: { sante: 7, travail: 8, amour: 5 } };
  const actuel = { mois: '2026-09', roue: { sante: 7, travail: 6 } };
  assert.equal(phraseRoue(actuel, avant, DOMAINES), 'Travail est plus difficile en ce moment.');
  assert.equal(phraseRoue(avant, avant, DOMAINES), 'Tout tient bon depuis juin.');
});

// ---------- Météo et tendances ----------

test('la courbe de Léa : douze mois d’octobre à septembre', () => {
  const courbe = courbeMeteo(DEMO.points, MOIS);
  assert.equal(courbe[0].mois, '2025-10');
  assert.deepEqual(courbe.map((c) => c.meteo), [3, 2, 2, 3, 3, 4, 3, 4, 4, 5, 4, 4]);
});

test('un mois sauté laisse un trou dans la courbe', () => {
  const troues = DEMO.points.filter((p) => p.mois !== '2026-03');
  assert.equal(courbeMeteo(troues, MOIS)[5].meteo, null);
});

test('les tendances de Léa : satisfaction en hausse, sens stable, énergie en baisse', () => {
  assert.equal(tendance(DEMO.points, 'satisfaction', MOIS), 'hausse');
  assert.equal(tendance(DEMO.points, 'sens', MOIS), 'stable');
  assert.equal(tendance(DEMO.points, 'energie', MOIS), 'baisse');
});
