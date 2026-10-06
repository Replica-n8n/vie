# À deux · la règle des 7-7-7

Spec du 2026-09-11, arrêtée avec elle pendant le brainstorm des 10 et
11 septembre. Elle **remplace** la spec du 2026-09-04
(`docs/superpowers/specs/2026-09-04-a-deux-design.md`, dans le dossier
parent) sur quatre points : le corpus d'idées, le filtrage, les trois statuts
d'une idée, et l'événement sur la journée entière. Tout le reste de
l'ancienne spec tient toujours : les profils relus sans interaction, le
rappel par calendrier et jamais par notification, les invariants de
`love-money`.

La tranche 1 (le socle et les deux profils) est livrée, en ligne en v0.1.0 et
installée sur son Pixel.

## Le problème, recadré

Le corpus était générique. Dix idées ont suffi à le montrer : un catalogue
répond à « quoi faire », alors qu'un couple manque rarement d'idées. Ce qui
arrive, c'est que personne ne planifie et que trois mois passent.

La règle des 7-7-7 donne un **rythme** au lieu d'un menu :

- tous les 7 jours, un tête-à-tête ;
- toutes les 7 semaines, une nuit ailleurs ;
- tous les 7 mois, de vraies vacances.

Mais sans corpus, les langages ne servaient plus qu'à être relus, et
l'app redevenait deux moitiés qui ne se parlent pas. Le lien est **l'angle
de la semaine** : le créneau reste régulier, et c'est le langage qui en fait
varier la forme.

## Ce que disent les données

- **Sur un an**, la règle donne environ 42 tête-à-tête « simples » (les
  semaines de nuit ou de vacances comptent pour la plus grande sortie),
  7 nuits ailleurs, et 1 ou 2 vacances selon l'année.
- **Seul le palier hebdomadaire s'appuie sur des données.** Le National
  Marriage Project (Wilcox et Dew, plus de 1 600 couples mariés) trouve que
  ceux qui se réservent du temps à deux au moins une fois par semaine ont
  nettement plus souvent une relation de grande qualité. C'est une
  corrélation.
- **Le contenu compte plus que la régularité.** Reissman, Aron et Bergen
  (1993) : 53 couples, 1 h 30 par semaine pendant 10 semaines. Faire des
  activités ensemble, quelles qu'elles soient, n'a pas amélioré la
  satisfaction de façon notable. Seules les activités nouvelles et
  excitantes l'ont fait, nettement plus que les activités agréables.
- **Aucune étude n'a testé le « 7 ».** C'est un moyen de s'en souvenir.
- **Les vacances tous les 7 mois sont le point faible** : ce rythme ignore
  les congés et les calendriers scolaires, et personne n'oublie ses
  vacances.

Verdict retenu : la pratique valide l'idée, pas les chiffres. D'où deux
choix : le rythme reste régulier (c'est lui qui protège le créneau, et c'est
la seule chose qu'une série d'agenda sait porter), et la forme varie selon
les langages. Un rythme irrégulier, du type Fibonacci, a été écarté : 1, 1,
2, 3, 5, 8, 13 semaines donnent 7 rendez-vous par an au lieu de 52, de plus
en plus espacés, et aucun agenda ne sait répéter un rythme irrégulier.

## Ce qu'on construit

### 1. Les profils : classer les cinq

Chaque personne classe ses langages **dans l'ordre** : on appuie sur les
lignes l'une après l'autre, et chacune prend son numéro, de 1 à 5. Un appui
sur une ligne numérotée la retire, et les suivantes remontent d'un rang. Pas
de glisser-déposer : caché, et difficile à une main. On peut s'arrêter à deux
ou trois si la suite est floue.

L'accueil montre les **deux premiers** de chaque classement. L'écran de
profil montre le classement entier.

**Migration** : un profil de la tranche 1 (`principal`, `secondaire`) devient
un classement `[principal, secondaire]`. Son téléphone porte déjà ces
données : la migration se teste sur leur forme exacte avant de livrer.

### 2. La grille des saisons

- **Une case par semaine.** Une grille par jour laisserait 6 jours sur 7
  vides même en ne ratant aucune semaine, et 53 colonnes sur la largeur d'un
  téléphone donnent des cases de 4 px.
- **Une semaine commence le lundi**, pour qu'un week-end tienne dans une
  seule case. Elle est désignée par la date de son lundi.
- **Une semaine appartient au mois de son lundi**, et le mois à sa saison.
- **Des saisons en mois entiers** : hiver = décembre, janvier, février ;
  printemps = mars, avril, mai ; été = juin, juillet, août ; automne =
  septembre, octobre, novembre. L'hiver chevauche deux années et s'affiche
  « déc. 2025 à févr. 2026 ».
- **Quatre pages, l'année glissante** : la saison en cours et les trois
  précédentes. Une flèche remonte plus loin quand l'historique dépasse un an.
- **Quatre onglets nommés**, Hiver · Printemps · Été · Automne, visibles en
  permanence. Le glissement du doigt peut s'y ajouter, jamais les remplacer.
  L'app s'ouvre sur la saison en cours.
- **Trois états de semaine** : passée, en cours, à venir. La semaine en cours
  porte un « + ». Les semaines à venir sont en pointillé et ne réagissent
  pas : sans ce pointillé, une saison qui commence aurait l'air d'un échec.

### 3. Noter une semaine

Un appui sur une semaine passée ou en cours ouvre un volet par-dessus la
grille :

- **semaine vide** : trois lignes, tête-à-tête, nuit ailleurs, vacances, avec
  tête-à-tête coché d'office, puis une ligne libre facultative, puis
  Enregistrer. Le cas le plus fréquent tient en deux gestes ;
- **semaine notée** : ce qui a été noté, avec Modifier, et Supprimer en deux
  appuis (le premier arme, le second efface).

**Pas de champ date** : la case touchée est la date, et la grille compte en
semaines. Rattraper un oubli, c'est toucher la semaine passée. Des vacances
de deux semaines, ce sont deux cases.

**Une semaine, une seule note.** Si un tête-à-tête et une nuit ailleurs
tombent la même semaine, on note la plus grande, et la ligne libre peut
raconter les deux.

Les trois paliers se notent **toujours**, qu'un rappel soit posé ou non.

### 4. L'angle de la semaine

Chaque semaine, l'accueil affiche un langage : « Cette semaine : toucher,
pour Alex ». L'app ne propose aucune idée. Elle donne la direction, le couple
invente la forme.

**Le calcul**, entièrement dans `coeur.js` et déterministe :

- `k` = nombre de semaines entre le lundi 2024-01-01 et le lundi de la
  semaine, compté en jours puis divisé par 7 ;
- `k` pair : l'autre ; `k` impair : moi ;
- dans la suite de cette personne, `j = floor(k / 2)`, et le rang visé est
  `1 + (nombre de zéros de fin de j + 1 en binaire)`, plafonné au nombre de
  langages classés. Le n° 1 revient une semaine sur deux de cette personne,
  le n° 2 une sur quatre, le n° 3 une sur huit, et ainsi de suite ;
- si cette personne n'a rien classé, on prend l'autre ; si personne n'a rien
  classé, aucun angle ne s'affiche.

**L'angle est rangé avec la note.** Il se calcule à partir d'un classement,
et si ce classement change, le passé ne doit pas changer après coup.

Nuance acceptée : l'app est sur un seul téléphone. Une semaine « pour moi »
ne marche que si le tête-à-tête se prépare à deux.

### 5. Les rappels

**Réglages** :

- les trois rappels, en lignes nommées avec une coche ;
- le moment : un jour et une heure, choisis une fois, **dimanche 19 h**
  proposé ;
- pour chaque rappel coché, « Poser le rappel dans l'agenda », puis
  « Posé le 11 septembre · dimanche 19 h » ;
- décocher un rappel déjà posé affiche une ligne : « Supprime aussi la série
  "À deux · nuit ailleurs" dans ton agenda. » L'app ne peut pas retirer une
  série d'un agenda, et le taire laisserait sonner un rappel éteint.

**Le fichier**, un par palier, une série chacun, exactement la forme vérifiée
sur son téléphone :

| Palier | Titre | Répétition |
|---|---|---|
| Tête-à-tête | À deux · un tête-à-tête cette semaine ? | `FREQ=WEEKLY` |
| Nuit ailleurs | À deux · prévoir une nuit ailleurs | `FREQ=WEEKLY;INTERVAL=7` |
| Vacances | À deux · prévoir des vacances | `FREQ=WEEKLY;INTERVAL=30` |

- **30 semaines et pas 7 mois** : `FREQ=MONTHLY;INTERVAL=7` répète le même
  quantième, qui ne tombe pas un dimanche. 30 semaines, c'est 7 mois à trois
  jours près, toujours au moment choisi.
- **Des invitations à prévoir**, pas à faire : pour une nuit ou un voyage, il
  faut réserver bien avant.
- **Heure flottante** (`DTSTART:20260913T190000`, sans `Z` ni `TZID`) :
  l'agenda la lit dans son fuseau, aucune conversion UTC.
- **15 minutes**, `TRANSP:TRANSPARENT` pour ne pas marquer l'agenda occupé.
- **Jamais sur la journée entière.** Vérifié sur son Pixel le 2026-09-10 :
  Google Agenda jette les `VALARM` du fichier et met ses propres réglages.
  Journée entière = une notification la veille à 23 h 30. À heure fixe = sa
  notification « 30 minutes avant ». **Le rappel, c'est le moment de
  l'événement lui-même.**
- **La `VALARM` est gardée** pour les autres agendas, qui la respectent.
- **La description ne porte que le lien vers l'app**, pas les langages, qui
  y seraient figés et deviendraient faux. Le rappel ramène dans l'app, et
  l'app montre les profils et l'angle.
- **Un `UID` stable par palier**, pour que reposer une série puisse la
  mettre à jour (à vérifier, voir la sonde 2).
- **Pas de partage par l'app.** Vérifié : Web Share refuse le fichier
  (`NotAllowedError`). Pour qu'Alex reçoive la série, on l'invite depuis
  Google Agenda.

### 6. La sauvegarde

Un historique de semaines se perd avec un téléphone et ne se reconstruit
pas. Réglages exporte un fichier JSON (profils, notes, rappels) et sait le
relire. La restauration remplace tout, et seulement si le fichier tient
debout : une restauration à moitié appliquée serait pire que rien.

## La direction visuelle : Verre de saison

Choisie par elle le 2026-09-11 parmi trois maquettes (Expressive,
Verre de saison, Courtepointe), après sa remarque, juste, que toutes nos apps
se ressemblent. **La feuille de la tranche 1, recopiée de `love-money`, est
abandonnée.**

- **Une lumière par saison** : un fond fait de grands dégradés radiaux, qui
  change avec la page. Hiver : bleu nuit et lavande. Printemps : lilas et
  vert tendre. Été : abricot et miel. Automne : prune, rouille et ambre.
- **Des tuiles de verre dépoli** posées en bento : les deux profils, l'angle
  de la semaine, la grille. Le volet d'une semaine est lui aussi en verre.
- **Rose et menthe restent les deux personnes**, en pastille sur leur tuile.
  Aucune lumière de saison ne doit s'en approcher : le vert du printemps
  s'écarte de la menthe, l'abricot de l'été s'écarte du rose.
- **Les cases** : du blanc à trois opacités, du plus discret (tête-à-tête)
  au plus plein (vacances).
- **Typographie** : Unbounded pour le nom de l'app, les saisons et les
  onglets ; Figtree pour le texte. Les deux sont sous licence libre (OFL),
  **hébergées dans l'app** (`fonts/`, sous-ensemble latin, en cache dans le
  service worker) : aucune requête vers Google une fois la page chargée.

**Les règles de lisibilité, parce que c'est le risque connu de ce style** :

- **Aucun texte posé directement sur la lumière.** Tout texte vit sur une
  tuile, dont l'opacité minimale se règle par la mesure, pas au jugé.
- **La mesure se fait sur des pixels**, pas sur des couleurs déclarées : un
  fond translucide flouté n'a pas de couleur fixe. Capture Playwright, puis
  échantillonnage du fond sous chaque texte, au point le plus défavorable de
  chaque saison. Texte : 4,5:1. Cases : 3:1 contre la tuile, et chaque
  intensité se distingue de sa voisine ; sinon une marque s'ajoute.
- **Sans `backdrop-filter`**, ou si l'utilisateur demande moins de
  transparence, les tuiles deviennent opaques.
- **Pas de flou animé**, et une seule couche de verre à la fois sous le
  pouce, pour la fluidité.

## Ce qu'on ne construit pas

- Planifier un rendez-vous précis dans l'app : l'app ne peut pas lire
  l'agenda, et deux copies d'une date finissent par se contredire en
  silence.
- Un corpus d'idées, sous quelque forme que ce soit.
- Une notification poussée.
- Le partage du fichier par l'app.
- Un score, une série, un « en retard de » : un creux se voit dans la grille,
  il ne se compte pas.
- Plusieurs notes par semaine.
- Le glisser-déposer.
- Une synchro à deux téléphones.

## Les données

`localStorage`, relu et assaini à chaque lecture.

| Clé | Forme |
|---|---|
| `ad.moi`, `ad.autre` | `{ nom, ordre: [id, ...] }`, de 0 à 5 langages connus, sans doublon |
| `ad.semaines` | `{ "AAAA-MM-JJ": { palier, ligne, angle } }`, la clé est le lundi |
| `ad.rappels` | `{ jour, heure, paliers }`, où `paliers` a trois entrées `tete`, `nuit`, `vacances`, chacune `{ voulu, pose }` (`pose` : date du dernier fichier produit, ou `null`) |

- **Une note par semaine est garantie par la forme** : une semaine n'a qu'un
  lundi, donc qu'une place. Aucun code n'a à l'interdire.
- Une clé qui n'est pas un lundi, un palier inconnu, un langage inconnu : la
  note est écartée à la relecture, pas propagée.
- `angle` vaut `{ qui, langage }` ou `null`.

## Ce qui vit dans `coeur.js`

Sans DOM ni stockage, testé sous Node :

- `lundiDe(date)`, `semainesDuMois(annee, mois)`, `saisonDe(date)`,
  `saisonsGlissantes(aujourdhui)`, `etatSemaine(lundi, aujourdhui)` ;
- `normaliserProfil` (classement), `migrerProfil` ;
- `angleDeLaSemaine(lundi, profils)` ;
- `ics(palier, moment, depuis)` ;
- la validation d'un fichier de sauvegarde.

**Les pièges à tester** : le 29 février ; la semaine qui chevauche le
1er janvier ; la semaine du 30 novembre, qui reste en automne ; l'hiver qui
chevauche deux années ; les changements d'heure (on compte en jours, jamais
en millisecondes brutes) ; la migration sur la forme exacte des données de la
tranche 1 ; un classement vide, partiel, complet ; l'angle quand une seule
personne a classé.

## La sonde 2, avant tout code du calendrier

La sonde 1 a prouvé une série hebdomadaire de trois occurrences. Il reste à
vérifier sur son téléphone :

1. une série **sans fin** ;
2. `INTERVAL=7` et `INTERVAL=30` ;
3. reposer une série avec le même `UID` et un autre horaire : mise à jour ou
   doublon ;
4. `TRANSP:TRANSPARENT` : « disponible » ou « occupé » ;
5. le lien de la description : ouvre-t-il l'app installée ?

Page jetable dans `tools/`, comme la première.

## Le découpage

Chaque tranche passe par `develop`, puis sur `main` seulement après son essai
sur le téléphone.

| Tranche | Ce qu'elle juge sur le téléphone |
|---|---|
| **2 · Le verre et le classement** | La nouvelle direction visuelle sur les écrans existants, en plein jour ; classer les cinq ; ses profils migrés intacts |
| **3 · La grille et l'angle** | Les quatre saisons, noter une semaine en deux gestes, corriger, relire l'angle. Les dix idées et `idees.js` disparaissent |
| **4 · La sauvegarde** | Exporter, tout effacer, restaurer |
| *Sonde 2* | Les cinq points ci-dessus, à tout moment avant la tranche 5 |
| **5 · Les rappels** | Choisir le moment, poser les séries, les voir dans Agenda |

Le verre entre dès la tranche 2 : c'est le pari visuel le plus risqué, et il
faut le juger tôt, sur le vrai écran.

**La preuve, à chaque tranche, avant de lui demander quoi que ce soit** :
les tests Node, avec un défaut injecté pour vérifier qu'ils mordent ; l'audit
d'interface à zéro constat ; la mesure de contraste sur pixels ; cinq
allers-retours sans entrée d'historique en plus ; le hors-ligne, serveur
arrêté.

## Ce qui reste ouvert

- Les teintes exactes des quatre lumières, fixées par la mesure de la
  tranche 2.
- L'opacité minimale des tuiles, idem.
- La forme exacte des libellés des rappels, à relire avec elle à la
  tranche 5.
