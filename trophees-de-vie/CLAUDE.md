# Trophées de vie

Un tableau de bord personnel de tout ce qu'on a fait dans sa vie. Une page web
vanilla en modules JS, sans build ni serveur, pensée comme page d'accueil du
navigateur sur ordinateur : tout se lit sur un écran, sans défiler ni cliquer.
Les données restent dans IndexedDB. Pour elle d'abord, partageable plus tard.
Ce n'est plus une PWA (décidé le 2026-10-05).

## Principes à ne pas casser

- Tout se lit sur un écran d'ordinateur, sans défiler ni cliquer. Le détail (le
  parcours complet) est derrière « Tout voir », jamais sur la page.
- Rien n'est une liste à compléter : un passage non vécu n'apparaît nulle part,
  il n'existe que comme proposition dans le formulaire.
- Seuls les passages comptent, pas les durées ni les répétitions.
- Le niveau (effort, cap, montagne) est choisi par la personne. Il se montre en
  lunes : anneau, demi-lune, pleine lune en or doux. Pas de métal, pas de brillance,
  pas de couleur vive sur le texte.
- Aucun personnage fictif, aucune donnée d'exemple dans la page. La vie d'exemple
  de `tests/exemple.js` ne sert qu'aux essais.
- La météo s'affiche en mots, jamais en score. Un mois sauté ne se commente pas.
- Une suppression est une marque (`supprimeLe`), jamais un effacement.
- Textes en français, tutoiement, aucun vocabulaire médical, aucun tiret cadratin.

## Où sont les choses

- `index.html`, `css/app.css`, `js/app.js` : la page et ses trois volets
  (ajouter, faire le point, tout voir) plus la sauvegarde.
- `js/config/vie.js` : niveaux, passages, scènes, cinq axes. C'est le fichier à
  modifier pour reformuler une question. Les sources sont citées dedans.
- `js/config/domaines.js` : la carte de vie, la météo, l'élan.
- `js/coeur.js` : toutes les règles, pures, datées par argument.
- `js/stockage.js` : IndexedDB, sauvegarde et reprise.
- `polices/` : les polices hébergées ici (`npm run polices` pour les retélécharger).
- `maquettes/` : l'historique de la recherche visuelle. `v8.src.html` est la
  maquette dont la page est issue ; `captures/` est réécrit par `npm run essai-page`.

## Pièges

- GitHub Pages garde un fichier dix minutes. `index.html` appelle `app.css?v=N` et
  `app.js?v=N`, et `app.js` importe ses quatre modules avec le même `?v=N` : monter
  N aux SEPT endroits à chaque livraison, sinon l'ancien et le nouveau se mélangent.
- Un identifiant de passage ou de proposition ne se renomme jamais : les moments
  gardés dans son navigateur le portent, et c'est lui qui empêche de recocher.
- Tout ce qui remplit la page doit pouvoir se toucher sans rien écrire. Les questions
  ouvertes restent, mais en plus : sur sa vraie page, elle n'a répondu qu'aux
  questions faciles et cinq tuiles sur six sont restées vides (2026-10-08).
- `?base=nom` ouvre une autre base : c'est ce qui permet aux essais de ne jamais
  toucher à la vraie.

## Contrôles

- `npm test` : les règles et la configuration.
- `npm run essai-tests` : abîme une règle à la fois, la suite doit tomber.
- `npm run essai-stockage` : le stockage dans un vrai Chromium.
- `npm run essai-page` : la vraie page de bout en bout (page vide, volets,
  persistance, corrections, sauvegarde, trois tailles d'écran, contrastes mesurés
  sur les pixels) et les captures.

Les règles de la maison (maquette avant code, captures avant livraison, tendances
de l'année, contrastes mesurés) sont dans la mémoire : `standards_apps_2026`,
`montrer_avant_coder`, `user_preferences`.
