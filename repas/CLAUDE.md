# Repas

Les 14 repas de la semaine (déjeuner et dîner, pour deux), la liste de courses et les
fiches de recettes. PWA vanilla en modules JS, sans build ni serveur, installable, hors ligne.

## D'où viennent les données

- `plan.json` est **produit**, jamais écrit à la main : `repas/tools/semaine.mjs <choix> --vie`
  (dossier `Claude - projet 1/repas/`, hors de ce dépôt). Le script calcule les macros avec le
  Fichier canadien sur les éléments nutritifs, multiplie les recettes pour viser ses objectifs,
  additionne les courses et en déduit son inventaire (`repas/donnees/inventaire.json`).
- Les cases cochées (cuisiné, courses prises) restent dans le téléphone : `localStorage`,
  clé `repas:etat:<lundi de la semaine>`. Une clé ne se renomme jamais.
- Notion sera la source des recettes et de l'inventaire plus tard (voir `repas/docs/spec-notion.md`).

## Règles à ne pas casser

- **Ne jamais créer de recette.** Seulement ses recettes et des découvertes réelles, avec leur lien.
- **Aucun chiffre écrit à la main.** Les macros viennent du script ; un ingrédient absent du
  FCEN est affiché « non compté », jamais deviné.
- **La quantité servie vise SES objectifs** (2 200 kcal, P 143, G 204, L 90, F 25 par jour ;
  les deux repas visent 75 %). Les portions des sites ne mesurent pas ce qu'elle mange.
- La page montre la JOURNÉE entière et ce qu'il reste pour le petit-déjeuner et les collations.
- 30 min au plus en semaine ; au-delà, cuisson du week-end, et le plat doit se garder.
- Style validé le 2026-11-03 : bleu fixe pour tout ce qu'on touche, chaque plat en pastel de
  son aliment (classes `al-…`), titres Big Shoulders, corps Roboto Flex. Pas d'autre couleur.
- Textes en français, tutoiement, aucun tiret cadratin.

## Pièges

- **La CSP bloque les attributs `style="…"`** : une couleur passe par une classe, jamais en ligne.
- GitHub Pages garde un fichier dix minutes : à chaque livraison, monter `?v=N` dans
  `index.html` (2 endroits), dans `js/app.js` (import de `coeur.js`) et `VERSION` dans `sw.js`.
- `plan.json` passe par le réseau (le service worker garde la dernière copie pour le hors ligne).
- Tester : `npm test`, puis la page au format 360 × 732 et 360 × 640, clair et sombre, hors ligne.
