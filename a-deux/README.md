# À deux

Les langages de l'amour de deux personnes, relus à chaque ouverture, et des
idées de sorties qui leur parlent. Vanilla JS, aucune dépendance, aucun outil
de build. PWA autonome qui fonctionne hors ligne.

En ligne : <https://replica-n8n.github.io/a-deux/>

## Le principe

**Les langages ne sont pas un questionnaire.** C'est une liste des siens et de
ceux de l'autre, qu'on relit en rouvrant l'app. L'accueil les affiche en
permanence, en haut, sans qu'on ait rien à toucher. C'est ça, la fonction : se
souvenir.

Un questionnaire ne sert qu'une fois, on lit son résultat et on n'y revient
jamais. Un catalogue d'idées de dates est générique, il propose la même chose
à tout le monde et on l'oublie en trois jours. Ensemble, les deux se réparent :
les langages deviennent une mémoire, et ils deviennent le filtre qui rend les
idées pertinentes.

**On enregistre une réponse, on ne la déduit pas.** Le questionnaire de Gary
Chapman est protégé et sa validité mesurée est faible. L'app ne mesure rien :
elle range un principal et un secondaire, choisis en deux appuis.

**Le rose et la menthe sont les deux personnes.** La même couleur les désigne
partout, de l'icône aux cartes d'accueil. Un langage, lui, n'appartient à
personne : ses étiquettes ne sont ni roses ni menthe.

## Les rappels, quand ils arriveront

Une PWA servie par GitHub Pages ne peut pas garantir une notification poussée :
le Web Push exige un serveur qui pousse, qui n'existe pas ici, et l'API qui
déclencherait une notification locale depuis le service worker n'a jamais été
livrée. Coder « rappel » naïvement donnerait quelque chose qui marche sur le PC
et jamais sur un iPhone.

Le rappel passera donc par le **calendrier du téléphone**, avec un fichier
`.ics`. Le téléphone rappelle ensuite tout seul, app fermée et sans réseau.
C'est la tranche 5. Le même choix a déjà été fait dans `love-money`.

## Où en est le chantier

L'app se construit en tranches, chacune jugeable sur un téléphone. Depuis le
2026-09-11, elle suit la **règle des 7-7-7** : un tête-à-tête par semaine,
une nuit ailleurs toutes les 7 semaines, des vacances tous les 7 mois. Le
détail est dans `docs/spec-7-7-7.md`.

1. **Socle et profils** · LIVRÉ, installé sur le téléphone.
2. **Le verre et le classement** · la direction « Verre de saison », et le
   classement des cinq langages.
3. **La grille et l'angle** · une case par semaine, une page par saison,
   l'angle de la semaine.
4. **La sauvegarde** · export et import JSON.
5. **Les rappels** · trois séries dans l'agenda, posées une fois.

⚠️ **Le corpus d'idées a été retiré le 2026-10-01.** Les idées sont écrites
par elle, dans l'app : trois sur l'accueil, la liste entière dans son écran,
avec une étiquette Soirée, Nuit ou Vacances.

## Trois mots, et pas un de plus

- **Langage** : un des cinq de Chapman. Chacun en a un principal, parfois un
  secondaire.
- **Profil** : une personne, son prénom et ses langages. Il y en a deux,
  jamais plus.
- **Idée** : une sortie ou un geste, écrite par toi, étiquetée Soirée, Nuit
  ou Vacances.

## Tes données

Tout vit dans le `localStorage` de ton téléphone. Aucun compte, aucun serveur,
aucune requête. Ce que deux personnes se disent n'a aucune raison de sortir de
l'appareil.

Corollaire : **la seule protection contre un téléphone perdu est une
sauvegarde**, et elle arrive à la tranche 4. D'ici là, l'écran Réglages sait
seulement tout effacer.

Deux profils sur **un seul téléphone**, celui de qui organise. Une vraie
synchro à deux appareils demanderait un serveur, et c'est une autre app.

## Structure des fichiers

```
a-deux/
  index.html            les trois écrans, en HTML statique
  css/app.css           thème sombre unique
  js/coeur.js           dates, langages, profils, contrôle du corpus · testable sous Node
  js/store.js           localStorage
  js/app.js             navigation et rendu
  manifest.webmanifest
  sw.js                 cache hors ligne
  icons/                générées, voir tools/mkicons.py
  test-coeur.js         filet de non-régression du cœur
  tools/audit.js        audit d'interface, tourne DANS la page
  tools/capture-app.mjs captures Playwright des écrans
```

## Vérifier

```bash
node test-coeur.js
```

Puis, dans la page servie en local :

```js
const a = await import('./tools/audit.js?t=' + Date.now());
await a.audit({ ecrans: a.PLAN_A_DEUX, format: 'texte' });
```

⚠️ Un audit qui renvoie toujours zéro peut être un audit cassé. Injecter de
temps en temps un défaut qui change une **mesure** réelle, et vérifier qu'il
ressort.

⚠️ Pendant le développement, le service worker sert l'ANCIEN fichier tant que
`VERSION` n'a pas bougé : un audit peut alors mesurer du code déjà corrigé. Se
désinscrire et vider les caches avant de conclure.

## Cache et versions

**La constante `VERSION` en haut de `sw.js` est le seul endroit à changer**
pour livrer. Le nom du cache en dérive et l'ancien est supprimé à
l'activation. Aucun `?v=...` à répercuter ailleurs.

## Développement

Aucun build. Un serveur suffit, `file://` ne convient pas à un service worker :

```bash
python -m http.server 8103
```

---

Cette app range deux préférences et propose des sorties. Elle ne diagnostique
rien, ne mesure rien, et ne remplace aucune conversation.
