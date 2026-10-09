# Trophées de vie

Un tableau de bord personnel de tout ce qu'on a fait dans sa vie. Une page web
vanilla en modules JS, sans build ni serveur, pensée comme page d'accueil du
navigateur sur ordinateur : tout se lit sur un écran, sans défiler ni cliquer.
Les données restent dans IndexedDB. Elle veut que le plus de gens possible l'utilisent une fois finie (dit le 2026-10-08) : ne plus concevoir pour une personne en particulier.
Ce n'est plus une PWA (décidé le 2026-10-05).

## Ce que la page doit faire

Un bilan rétrospectif valorisant : le chemin parcouru, des réussites dont on est
fière. Pas des questions existentielles. Les cinq « regrets » de Bronnie Ware ont été
essayés comme structure (version 2) et rejetés : ce sont des choses à ne pas rater,
pas des accomplissements.

## L'agencement (version 9, issu d'une critique impeccable à 24/40)

Le bilan d'abord : rangée 1, le total et les trois plus beaux trophées (hauts faits
épinglés, sinon les plus rares), puis le souvenir du jour ; rangée 2, les six catégories
sur toute la largeur, qui NOMMENT leurs réussites ; rangée 3, le ruban et la carte de vie
en petit. Ses choix : carte de vie gardée mais petite, catégories vides gardées avec leur
« + », et **le ciel ne change jamais** (mer et plage, plus de variation selon la météo).
Sans or, pas de décompte par médaille. Le souvenir du jour est tiré avec une préférence
pour l'or, les notes et les titres précisés.

## Principes à ne pas casser

- Tout se lit sur un écran d'ordinateur, sans défiler ni cliquer. Le détail (le
  parcours complet) est derrière « Tout voir », jamais sur la page.
- Rien n'est une liste à compléter : une réussite non cochée n'apparaît nulle part.
- Tout ce qui remplit la page se touche, sans rien écrire. Elle saute les questions
  ouvertes et intimes : il n'y en a plus.
- **La rareté fixe la médaille** (comme le pourcentage d'un trophée PlayStation) : or
  jusqu'à un adulte sur cinq, argent jusqu'à un sur deux, bronze au-delà. Sans chiffre
  fiable, c'est la personne qui choisit, et la page n'affiche aucun pourcentage.
- La page écrit « Top 16 % », rien d'autre : pas de pays, pas de source, pas de
  détail. Et seulement pour l'or : pour l'argent et le bronze, le chiffre dirait
  surtout que c'est courant. Les sources vivent dans `js/config/vie.js`.
- **Aucun chiffre inventé.** Une réussite sans statistique vérifiée porte `defaut`,
  pas `rarete`.
- Trophées or, argent, bronze, nommés ainsi, tous de la MÊME taille. Dessinés à plat, sans reflet : elle a
  rejeté le métal brillant (« jeu vidéo »), les lunes (« ne veulent rien dire ») et
  « effort, cap, montagne » (« ne me parlent pas »).
- Aucun personnage fictif, aucune donnée d'exemple dans la page. La vie d'exemple
  de `tests/exemple.js` ne sert qu'aux essais.
- La météo s'affiche en mots, jamais en score. Un mois sauté ne se commente pas.
- Une suppression est une marque (`supprimeLe`), jamais un effacement.
- Textes en français, tutoiement, aucun vocabulaire médical, aucun tiret cadratin.

## Où sont les choses

- `index.html`, `css/app.css`, `js/app.js` : la page et ses volets (ajouter, faire
  le point, tout voir, sauvegarde).
- `js/config/vie.js` : médailles, six catégories, réussites proposées avec leur
  rareté et sa source en commentaire. C'est le fichier à modifier.
- `js/config/domaines.js` : la carte de vie, la météo, l'élan.
- `js/coeur.js` : toutes les règles, pures. `lire()` transforme ce qui est gardé en
  trophées tels que la page les montre (médaille, « Top », catégorie).
- `js/stockage.js` : IndexedDB, sauvegarde et reprise.
- `polices/` : les polices hébergées ici (`npm run polices` pour les retélécharger).
- `maquettes/` : l'historique de la recherche visuelle ; `captures/` est réécrit par
  `npm run essai-page`.

## Pièges

- GitHub Pages garde un fichier dix minutes. `index.html` appelle `app.css?v=N` et
  `app.js?v=N`, et `app.js` importe ses quatre modules avec le même `?v=N` : monter
  N aux SEPT endroits à chaque livraison, sinon l'ancien et le nouveau se mélangent.
- **Sa vraie page contient des moments écrits par les versions 1 et 2** (champs
  `passage`, `proposition`, niveaux `effort`, `cap`, `montagne`). Ils doivent
  rester lisibles : `definition()` et `medaille()` les traduisent, `ALIAS` reconnaît
  les anciens identifiants, et l'essai de la page ouvre une base ancienne.
- Un identifiant de réussite ne se renomme jamais : les moments gardés le portent.
- Les chiffres ne viennent pas tous de la même population (OCDE, Union européenne,
  France, monde). Elle a demandé l'OCDE ; quand l'OCDE ne publie rien, on a pris le
  meilleur chiffre disponible. À lui redire si elle demande d'où vient un « Top ».
- La médaille dépend de l'âge pour l'achat du logement : sans année de naissance,
  c'est le chiffre tous âges qui sert.
- « Tient sur un écran » se teste avec PLUSIEURS souvenirs du jour (`?jour=AAAA-MM-JJ`) :
  le bandeau change de hauteur selon le trophée tiré, et un seul souvenir essayé a laissé
  passer un débordement en production (version 8).
- `?base=nom` ouvre une autre base : c'est ce qui permet aux essais de ne jamais
  toucher à la vraie. Effacer une base depuis la page qui l'a ouverte attend pour
  toujours : partir de `icone.svg`.

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
