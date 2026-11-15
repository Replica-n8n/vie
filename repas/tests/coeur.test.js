import test from 'node:test';
import assert from 'node:assert/strict';
import { somme, reste, fraction, lireEtat, ecrireEtat, cleEtat, jourParDefaut, dateLocale } from '../js/coeur.js';

const memoire = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('la somme additionne les macros des repas', () => {
  assert.deepEqual(somme([{ kcal: 800, p: 50, g: 60, l: 30, f: 5 }, { kcal: 700, p: 40, g: 50, l: 20 }]), { kcal: 1500, p: 90, g: 110, l: 50, f: 5 });
});

test('le reste dit « déjà dépassés » au lieu de « 0 g »', () => {
  const r = reste({ kcal: 1650, p: 120, g: 100, l: 95, f: 30 }, { kcal: 2200, p: 143, g: 204, l: 90, f: 25 });
  assert.deepEqual(r, ['550 kcal', 'protéines 23 g', 'glucides 104 g', 'lipides déjà dépassés de 5 g', 'fibres déjà dépassés de 5 g']);
});

test('les fractions se lisent comme dans une recette', () => {
  assert.equal(fraction(2.25), '2 ¼');
  assert.equal(fraction(2 / 3), '⅔');
  assert.equal(fraction(2), '2');
  assert.equal(fraction(1.13), '1,1');
});

test("l'état est gardé par semaine et survit à une donnée abîmée", () => {
  const s = memoire();
  ecrireEtat(s, '2026-11-16', { cuisines: { 'lun-midi': true }, pris: { c3: true } });
  assert.deepEqual(lireEtat(s, '2026-11-16'), { cuisines: { 'lun-midi': true }, pris: { c3: true } });
  assert.deepEqual(lireEtat(s, '2026-11-23'), { cuisines: {}, pris: {} });
  s.setItem(cleEtat('2026-11-30'), '{abîmé');
  assert.deepEqual(lireEtat(s, '2026-11-30'), { cuisines: {}, pris: {} });
});

test("le jour par défaut est aujourd'hui s'il est dans la semaine", () => {
  const jours = [{ date: '2026-11-16' }, { date: '2026-11-17' }];
  assert.equal(jourParDefaut(jours, '2026-11-17'), '2026-11-17');
  assert.equal(jourParDefaut(jours, '2026-11-30'), '2026-11-16');
});

test('la date est celle du téléphone, pas UTC', () => {
  assert.equal(dateLocale(new Date(2026, 10, 16, 23, 30)), '2026-11-16');
});
