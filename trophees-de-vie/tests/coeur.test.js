import test from 'node:test';
import assert from 'node:assert/strict';

import { NIVEAUX, PASSAGES, SCENES, AXES } from '../js/config/vie.js';
import { DOMAINES, METEOS, ELANS } from '../js/config/domaines.js';
import { MOMENTS, POINTS } from './exemple.js';
import {
  comptes, parAxe, hautsFaits, ruban, souvenirDuJour,
  decalerMois, dernierPoint, pointDavant, ecartsRoue, phraseRoue,
} from '../js/coeur.js';

const AUJOURDHUI = '2026-10-05';
const MOIS = '2026-10';

// ---------- La configuration tient debout ----------

test('la configuration : trois niveaux, cinq axes, trois scènes, des passages sans doublon', () => {
  assert.deepEqual(NIVEAUX.map((n) => n.id), ['effort', 'cap', 'montagne']);
  assert.equal(AXES.length, 5);
  assert.equal(SCENES.length, 3);
  assert.ok(PASSAGES.length >= 8 && PASSAGES.length <= 15, `${PASSAGES.length} passages`);
  for (const groupe of [PASSAGES, SCENES, AXES, NIVEAUX, DOMAINES]) {
    const ids = groupe.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `identifiant en double dans ${ids}`);
  }
  assert.equal(DOMAINES.length, 8);
  assert.equal(METEOS.length, 5);
  assert.equal(ELANS.length, 3);
});

test('la configuration : aucun tiret long, aucun mot médical', () => {
  const textes = [...NIVEAUX, ...PASSAGES, ...SCENES, ...AXES, ...DOMAINES]
    .flatMap((x) => [x.titre, x.nom, x.question].filter(Boolean)).concat(METEOS, ELANS);
  for (const texte of textes) {
    assert.ok(!/[–—]/.test(texte), `tiret dans « ${texte} »`);
    assert.ok(!/dépress|anxi|troubl|diagnos|patholog|symptôm|thérap/i.test(texte), `mot médical dans « ${texte} »`);
  }
});

test('l’exemple des essais pointe vers des passages, des scènes et des axes qui existent', () => {
  const connus = { passage: PASSAGES, scene: SCENES, axe: AXES };
  const niveaux = NIVEAUX.map((n) => n.id);
  for (const m of MOMENTS) {
    assert.ok(niveaux.includes(m.niveau), m.id);
    const cle = m[m.genre];
    assert.ok(cle === null ? m.genre === 'passage' : connus[m.genre].some((x) => x.id === cle), `${m.id} → ${cle}`);
  }
  const domaines = DOMAINES.map((d) => d.id).sort();
  for (const p of POINTS) assert.deepEqual(Object.keys(p.roue).sort(), domaines, p.mois);
});

// ---------- En chiffres ----------

test('les comptes de l’exemple : 22 moments, 5 montagnes, 11 caps, 6 efforts', () => {
  assert.deepEqual(comptes(MOMENTS, NIVEAUX), { total: 22, effort: 6, cap: 11, montagne: 5 });
});

test('un moment retiré ne compte plus, nulle part', () => {
  const sans = MOMENTS.map((m) => (m.id === 'master' ? { ...m, supprimeLe: '2026-10-01T00:00:00Z' } : m));
  assert.equal(comptes(sans, NIVEAUX).total, 21);
  assert.equal(comptes(sans, NIVEAUX).montagne, 4);
  assert.deepEqual(hautsFaits(sans).map((m) => m.id), ['montreal', 'partir']);
  assert.ok(ruban(sans, 2026).annees.every((a) => a.moments.every((m) => m.id !== 'master')));
  for (let i = 0; i < 40; i += 1) assert.notEqual(souvenirDuJour(sans, '2026-01-01', i / 40).moment.id, 'master');
});

test('les cinq axes de l’exemple : 3, 4, 2, 2, 2, dans l’ordre du temps', () => {
  const axes = parAxe(MOMENTS, AXES);
  assert.deepEqual(axes.map((a) => [a.id, a.moments.length]), [['vivre', 3], ['hors', 4], ['dire', 2], ['amis', 2], ['bonheur', 2]]);
  assert.deepEqual(axes[1].moments.map((m) => m.id), ['nager', 'dix-km', 'semi', 'potager']);
});

test('un passage ou une scène n’entre dans aucun axe', () => {
  const total = parAxe(MOMENTS, AXES).reduce((s, a) => s + a.moments.length, 0);
  assert.equal(total, MOMENTS.filter((m) => m.genre === 'axe').length);
  assert.equal(total, 13);
});

test('les hauts faits : trois au plus, les plus anciens d’abord', () => {
  assert.deepEqual(hautsFaits(MOMENTS).map((m) => m.id), ['master', 'montreal', 'partir']);
  assert.equal(hautsFaits(MOMENTS.map((m) => ({ ...m, hautFait: true }))).length, 3);
});

// ---------- Ruban ----------

test('le ruban de l’exemple : de 2009 à 2026, années vides gardées', () => {
  const { debut, annees, sansDate } = ruban(MOMENTS, 2026);
  assert.equal(debut, 2009);
  assert.equal(annees.length, 18);
  assert.equal(annees.at(-1).annee, 2026);
  assert.equal(annees.find((a) => a.annee === 2011).moments.length, 0);
  assert.equal(annees.find((a) => a.annee === 2025).moments.length, 3);
  assert.equal(sansDate.length, 0);
});

test('un moment sans année va dans « Un jour », pas dans le ruban', () => {
  const avec = [...MOMENTS, { id: 'x', genre: 'axe', axe: 'amis', titre: 'Un jour', niveau: 'cap', annee: null, date: null }];
  const { annees, sansDate } = ruban(avec, 2026);
  assert.deepEqual(sansDate.map((m) => m.id), ['x']);
  assert.ok(annees.every((a) => a.moments.every((m) => m.id !== 'x')));
});

test('une vie sans rien de noté donne un ruban vide, sans erreur', () => {
  assert.deepEqual(ruban([], 2026), { debut: null, annees: [], sansDate: [] });
  assert.deepEqual(comptes([], NIVEAUX), { total: 0, effort: 0, cap: 0, montagne: 0 });
  assert.equal(souvenirDuJour([], AUJOURDHUI), null);
});

// ---------- Souvenir du jour ----------

test('le souvenir du jour : l’anniversaire du semi-marathon, il y a 2 ans', () => {
  const s = souvenirDuJour(MOMENTS, AUJOURDHUI);
  assert.equal(s.moment.id, 'semi');
  assert.equal(s.ans, 2);
  assert.equal(s.anniversaire, true);
});

test('sans anniversaire, un moment au hasard, le même toute la journée, avec son âge', () => {
  const a = souvenirDuJour(MOMENTS, '2026-10-06');
  const b = souvenirDuJour(MOMENTS, '2026-10-06');
  assert.equal(a.anniversaire, false);
  assert.equal(a.moment.id, b.moment.id);
  assert.equal(a.ans, 2026 - a.moment.annee);
});

test('un moment marqué « pas de rappel » ne ressort jamais', () => {
  for (let i = 0; i <= 50; i += 1) {
    assert.notEqual(souvenirDuJour(MOMENTS, '2026-01-01', i / 50).moment.rappel, false);
  }
});

test('un moment sans année ressort sans âge', () => {
  const seul = [{ id: 'x', genre: 'axe', axe: 'amis', titre: 'Un jour', niveau: 'cap', annee: null, date: null }];
  assert.equal(souvenirDuJour(seul, AUJOURDHUI).ans, null);
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
  assert.deepEqual(ecartsRoue(actuel, avant, DOMAINES).hausse.map((h) => [h.id, h.ecart]),
    [['amour', 2], ['sante', 1], ['proches', 1], ['cadre', 1]]);
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
