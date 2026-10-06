# a-deux

PWA des langages de l'amour et des idées de sorties. Vanilla JS, **aucune
dépendance, aucun outil de build**. Servie par GitHub Pages sur `main` :
`https://replica-n8n.github.io/a-deux/`.

Le `README.md` décrit l'app et ses partis pris. Ce fichier dit ce qui casse
quand on y touche.

**La spec en vigueur est `docs/spec-7-7-7.md`** (2026-09-11) : la règle des
7-7-7, la grille des saisons, l'angle de la semaine, la direction « Verre de
saison ». Elle remplace en partie la spec d'origine, restée dans le dossier
parent (`docs/superpowers/specs/2026-09-04-a-deux-design.md`).

⚠️ **Google Agenda jette les `VALARM` d'un fichier `.ics`** (vérifié sur son
Pixel le 2026-09-10) : le rappel, c'est le MOMENT de l'événement, et jamais
un événement sur la journée entière.

## Invariants

- **`VERSION` en haut de `sw.js` est le seul point de version.** Le nom du
  cache en dérive. La bumper est ce qui livre.
  ⚠️ Pendant le développement, le service worker sert l'ANCIEN fichier tant
  que `VERSION` n'a pas bougé. Un audit ou une capture peuvent alors mesurer
  du code déjà corrigé, et on croit à un bug qui n'existe plus. Se désinscrire
  et vider les caches avant de conclure.
- **Les dates sont des chaînes `AAAA-MM-JJ` et le restent.** Une `Date` ne
  sert que le temps d'un calcul, jamais au stockage.
  ⚠️ **Jamais `new Date('2026-01-01')` ni `toISOString().slice(0,10)`** : les
  deux passent par UTC et reculent d'un jour la moitié de l'année à Montréal.
  Construire composant par composant, comme le fait `coeur.js`.
- **Un mois plus tard n'est pas `+1` sur le mois.** Le 31 janvier plus un mois
  glisse au 3 mars. `ajouterMois` ramène au dernier jour du mois, et quatre
  tests le prouvent. La règle des six mois de la tranche 3 s'appuiera dessus.
- **Tout ce qui se calcule vit dans `js/coeur.js`**, sans DOM ni
  `localStorage`, pour rester exerçable sous Node. Le rendu n'y entre pas.
- **Le secondaire ne peut jamais égaler le principal.** `normaliserProfil` le
  garantit, et promeut un secondaire orphelin. Toute donnée relue repasse par
  lui : un `localStorage` écrit par une version plus ancienne ne doit pas
  traverser l'app et casser un filtre bien plus loin.
- **`verifierCorpus` tourne sous Node sur le corpus embarqué.** Une faute de
  frappe sur un identifiant de langage rendrait une idée invisible au
  filtrage, en silence et sans erreur à l'écran.
- **Chaque écran est une entrée d'historique**, et les boutons « Retour »
  CONSOMMENT l'entrée de l'aller par `history.back()`. Les empiler ferait
  qu'un aller-retour ajoute deux entrées et le retour matériel d'Android ne
  ramènerait plus à l'accueil. Contrôle : cinq allers-retours ajoutent zéro
  entrée.
- **La page ne défile jamais**, c'est la zone `.body` qui défile. `height` et
  non `min-height` sur `.screen`, sinon le bouton principal passe sous la
  ligne de flottaison.
- **Cibles tactiles à 44 px, et 8 px entre deux cibles.**
- **Jamais d'`opacity` pour éteindre un contrôle.** Un `opacity:.4` sur la
  ligne « déjà principal » faisait tomber son texte à 2,16:1, sous le seuil de
  4,5:1, et l'audit l'a relevé. On éteint en changeant les COULEURS.
- **Pas de glyphe de police pour une icône.** Le crayon des cartes était un
  `✎` : sur Android le repli de police n'a que son dessin ÉMOJI, il arrivait
  en couleur, et ni `font-variant-emoji:text` ni le sélecteur U+FE0E n'y
  changeaient rien. C'est un SVG en ligne, en `currentColor`.
- **Un bouton d'installation, toujours.** Chrome ne montre plus de bandeau de
  lui-même : il prévient la page par `beforeinstallprompt` et attend qu'elle
  réagisse. Une app qui ignore cet événement remplit tous les critères et ne
  propose jamais rien. Avec le repli iOS, où l'événement n'existe pas.
- **Aucune requête réseau** une fois la page chargée. Aucun compte, aucun
  serveur.

## Vérifier, dans cet ordre

1. `node test-coeur.js` · dates, langages, profils, corpus.
2. L'audit d'interface, dans la page servie en local :
   `await a.audit({ ecrans: a.PLAN_A_DEUX, format: 'texte' })`.
3. `node tools/capture-app.mjs` si le rendu est en cause. ⚠️ Le panneau
   navigateur intégré rend parfois l'app en **mosaïque** quand un `.screen`
   est en `position:fixed` : le DOM est juste, l'image ne l'est pas. Mesurer
   le DOM avant de croire à un bug, et capturer avec Playwright.
4. **Hors ligne** : arrêter le serveur, recharger, l'app doit se relancer
   entière. C'est ça la preuve d'une PWA, pas la présence d'un manifeste.
5. **Prouver que le filet mord**, dès qu'on le modifie : injecter un défaut
   qui change une MESURE réelle. Casser `ajouterMois` sort quatre échecs.

## Elle est sur ANDROID

Un Pixel 9a. La spec de conception dit « son iPhone » au point 4 de sa section
de vérification : c'est faux, et le repli iOS du bouton d'installation
s'écrira sans pouvoir être vérifié. Playwright ne connaît pas le 9a, prendre
`devices['Pixel 9']`.

## Avant de pousser

`/code-review` sur le diff, puis bumper `VERSION`, puis un message de commit
en français qui dit **ce qui cassait** avant de dire ce qui change.
`main` est ce que voient les gens, `develop` est le terrain d'essai.

## `tools/audit.js` est une copie

Il vient de `love-money/tools/audit.js`, lui-même venu de
`workout/tools/audit.js`. Seul `PLAN_A_DEUX` est propre à ce dépôt. Une
correction utile ici l'est probablement là-bas, et l'inverse : les copies
dérivent si personne ne les rapproche.

**Divergence connue, à rapatrier** : `enTexte` écrivait ses en-têtes d'écran
avec des tirets cadratins. Corrigé ici en point médian, PAS encore dans
`love-money` ni dans `workout`.

## Écriture

Interface en français. **Aucun tiret cadratin**, nulle part : ni dans le code,
ni dans les commentaires, ni dans l'interface, ni dans les docs. Une fonction
que rien n'annonce n'existe pas, et on l'annonce en rendant le CONTRÔLE
visible, pas en écrivant une notice sur l'écran de départ.
