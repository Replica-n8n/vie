# Trophées de vie

Un tableau de bord personnel de tout ce qu'on a fait dans sa vie. PWA vanilla en
modules JS, sans build, hors ligne, sans serveur : tout reste dans IndexedDB.
Pour elle d'abord, partageable plus tard.

## Principes à ne pas casser

- Aucun trophée « verrouillé » n'est jamais affiché. `js/config/trophees.js` est
  une banque de suggestions pour les formulaires, pas une liste à compléter.
- Le niveau d'un trophée est choisi par la personne. Celui de la configuration
  n'est qu'une proposition.
- Les compteurs n'ont pas de paliers : ils affichent leur nombre.
- Le platine est calculé (`platine()` dans `js/coeur.js`), jamais stocké.
- La météo et les trois questions s'affichent en mots et en tendance, jamais en score.
- Un mois sauté reste un trou dans la courbe, sans commentaire.
- Une suppression est une marque (`supprimeLe`), jamais un effacement.
- Textes en français, tutoiement, aucun vocabulaire médical, aucun tiret cadratin.

## Où sont les choses

- `js/config/` : trophées proposés, domaines de la carte de vie, données de démo (Léa).
- `js/coeur.js` : toutes les règles, pures, datées par argument.
- `js/stockage.js` : IndexedDB, sauvegarde et reprise, base de démo séparée.
- `maquettes/v4.html` : la maquette validée (direction « verre vert »). C'est la
  référence visuelle tant que l'écran réel n'existe pas.

## Contrôles

- `npm test` : les règles et la configuration.
- `npm run essai-tests` : abîme une règle à la fois, la suite doit tomber.
- `npm run essai-stockage` : le stockage dans un vrai Chromium.

Les règles de la maison (maquette avant code, captures avant livraison, tendances
de l'année, contrastes mesurés) sont dans la mémoire : `standards_apps_2026`,
`montrer_avant_coder`, `user_preferences`.
