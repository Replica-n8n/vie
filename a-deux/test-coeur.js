/* Filet de non-régression du cœur logique.
   Lancer :  node test-coeur.js

   Chaque cas vient d'un piège réel, pas d'une liste générique : les dates qui
   glissent d'un jour par UTC, le changement d'heure de Montréal qui fausse un
   écart en jours, la fin de mois qui déborde, et le corpus écrit à la main où
   un identifiant mal tapé rendrait une idée invisible en silence.
*/

const C = require('./js/coeur.js');

let echecs = 0;
function verifie(nom, obtenu, attendu) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) {
    echecs++;
    console.log('ECHEC  ' + nom + '\n   obtenu  : ' + JSON.stringify(obtenu) +
                '\n   attendu : ' + JSON.stringify(attendu));
  }
}

/* ------------------------------------------------------------- les dates */

/* Le piège UTC : à Montréal, `new Date('2026-01-01')` est le 31 décembre à
   19 h. Toute date reconstruite via UTC recule d'un jour la moitié de
   l'année. On vérifie donc l'aller-retour aux deux extrémités de l'année. */
verifie('aller-retour 1er janvier', C.versTexte(C.depuisTexte('2026-01-01')), '2026-01-01');
verifie('aller-retour 1er juillet', C.versTexte(C.depuisTexte('2026-07-01')), '2026-07-01');
verifie('aller-retour 31 décembre', C.versTexte(C.depuisTexte('2026-12-31')), '2026-12-31');
verifie('le jour lu est le bon', C.depuisTexte('2026-01-01').getDate(), 1);

// Le cas ordinaire du décalage de mois.
verifie('un mois plus tard', C.ajouterMois('2026-07-11', 1), '2026-08-11');
verifie('six mois plus tard', C.ajouterMois('2026-07-11', 6), '2027-01-11');

/* Le 31 janvier plus un mois n'existe pas : `new Date(2026, 1, 31)` déborde
   en silence sur le 3 mars. C'est ce glissement qui ferait remonter une idée
   faite trop tôt, ou trop tard, quand la règle des six mois arrivera. */
verifie('31 janvier plus un mois', C.ajouterMois('2026-01-31', 1), '2026-02-28');
verifie('31 janvier plus un mois, année bissextile', C.ajouterMois('2028-01-31', 1), '2028-02-29');
verifie('31 août plus six mois', C.ajouterMois('2026-08-31', 6), '2027-02-28');
verifie('31 mars plus un mois', C.ajouterMois('2026-03-31', 1), '2026-04-30');

// Le passage d'année, dans les deux sens.
verifie('décembre plus un mois', C.ajouterMois('2026-12-15', 1), '2027-01-15');
verifie('janvier moins un mois', C.ajouterMois('2026-01-15', -1), '2025-12-15');
verifie('juillet moins huit mois', C.ajouterMois('2026-07-11', -8), '2025-11-11');

/* Le changement d'heure : au printemps une journée dure 23 h, à l'automne
   25 h. Un écart calculé sans arrondi tomberait à 1,958 jour et un `floor`
   renverrait 1 au lieu de 2. À Montréal en 2026 : le 8 mars et le 1er
   novembre. */
verifie('écart au passage à l’heure d’été', C.joursEntre('2026-03-07', '2026-03-09'), 2);
verifie('écart au retour à l’heure normale', C.joursEntre('2026-10-31', '2026-11-02'), 2);
verifie('écart nul', C.joursEntre('2026-05-04', '2026-05-04'), 0);
verifie('écart négatif', C.joursEntre('2026-05-04', '2026-05-01'), -3);
verifie('écart sur une année', C.joursEntre('2026-01-01', '2027-01-01'), 365);

verifie('date écrite en toutes lettres', C.formaterDate('2026-07-04'), '4 juillet 2026');
verifie('date de février bissextile', C.formaterDate('2028-02-29'), '29 février 2028');

/* --------------------------------------------------------- les langages */

verifie('cinq langages', C.LANGAGES.length, 5);
verifie('un langage connu', C.estLangage('toucher'), true);
verifie('un langage inventé', C.estLangage('cuisine'), false);
verifie('nom du langage', C.nomLangage('moments'), 'Moments de qualité');
verifie('nom court', C.nomCourt('services'), 'Services');
verifie('nom d’un langage inconnu', C.nomLangage('cuisine'), '');

/* ---------------------------------------------------------- les profils */

verifie('profil absent',
  C.normaliserProfil(null, 'Moi'),
  { nom: 'Moi', principal: null, secondaire: null });

verifie('profil complet',
  C.normaliserProfil({ nom: 'Alex', principal: 'moments', secondaire: 'toucher' }, 'Moi'),
  { nom: 'Alex', principal: 'moments', secondaire: 'toucher' });

/* Deux appuis rapides sur la même ligne donneraient un profil qui affiche
   deux fois la même chose sans rien dire de plus. */
verifie('secondaire égal au principal',
  C.normaliserProfil({ nom: 'Alex', principal: 'moments', secondaire: 'moments' }, 'Moi'),
  { nom: 'Alex', principal: 'moments', secondaire: null });

/* Un secondaire seul est illisible sur l'accueil : il devient le principal. */
verifie('secondaire sans principal',
  C.normaliserProfil({ nom: 'Alex', principal: null, secondaire: 'cadeaux' }, 'Moi'),
  { nom: 'Alex', principal: 'cadeaux', secondaire: null });

/* Un localStorage écrit par une version plus ancienne, ou édité à la main. */
verifie('langage inconnu ignoré',
  C.normaliserProfil({ nom: 'Alex', principal: 'cuisine', secondaire: 'toucher' }, 'Moi'),
  { nom: 'Alex', principal: 'toucher', secondaire: null });

verifie('nom vide, on reprend le défaut',
  C.normaliserProfil({ nom: '   ', principal: 'paroles' }, 'L’autre').nom, 'L’autre');
verifie('nom rogné',
  C.normaliserProfil({ nom: '  Alexandra  ', principal: 'paroles' }, 'Moi').nom, 'Alexandra');
verifie('nom plafonné à 18 signes',
  C.normaliserProfil({ nom: 'Marie-Christine-Anne', principal: 'paroles' }, 'Moi').nom.length, 18);
verifie('nom qui n’est pas du texte',
  C.normaliserProfil({ nom: 42, principal: 'paroles' }, 'Moi').nom, 'Moi');

verifie('profil complet, oui', C.profilComplet({ principal: 'moments' }), true);
verifie('profil complet, non', C.profilComplet({ principal: null }), false);

verifie('résumé à deux langages',
  C.resumeProfil({ principal: 'moments', secondaire: 'toucher' }),
  'Moments de qualité · Toucher physique');
verifie('résumé à un langage',
  C.resumeProfil({ principal: 'moments', secondaire: null }), 'Moments de qualité');
verifie('résumé vide', C.resumeProfil({ principal: null }), '');

/* ------------------------------------------------------------ les idées */

/* Le corpus embarqué a été retiré le 2026-10-01 : les idées sont écrites par
   elle. Ce qui se teste ici, c'est donc la FORME d'une idée relue, parce
   qu'un localStorage peut venir d'une version plus ancienne ou avoir été
   édité à la main. */

verifie('trois paliers', C.PALIERS.map(p => p.id), ['soiree', 'nuit', 'vacances']);
verifie('palier connu', C.estPalier('nuit'), true);
verifie('palier inventé', C.estPalier('weekend'), false);
verifie('nom du palier', C.nomPalier('vacances'), 'Vacances');
verifie("nom d'un palier inconnu", C.nomPalier('weekend'), '');

verifie('une idée juste passe',
  C.normaliserIdee({ id: 'a', texte: 'Souper au Petit Alep', palier: 'nuit' }),
  { id: 'a', texte: 'Souper au Petit Alep', palier: 'nuit' });

/* Un palier inconnu ne doit pas rendre l'idée invisible : elle retombe sur
   le plus fréquent, et reste modifiable. */
verifie('palier inconnu ramené à soirée',
  C.normaliserIdee({ id: 'a', texte: 'Patiner', palier: 'weekend' }).palier, 'soiree');
verifie('palier absent ramené à soirée',
  C.normaliserIdee({ id: 'a', texte: 'Patiner' }).palier, 'soiree');

verifie('texte rogné',
  C.normaliserIdee({ id: 'a', texte: '   Patiner au canal   ' }).texte, 'Patiner au canal');

/* Un texte sans fin casserait la ligne de la liste, et le champ est déjà
   plafonné à 80 signes côté interface : le cœur le garantit aussi. */
verifie('texte plafonné à 80 signes',
  C.normaliserIdee({ id: 'a', texte: 'o'.repeat(200) }).texte.length, 80);

verifie('texte vide refusé', C.normaliserIdee({ id: 'a', texte: '   ' }), null);
verifie('texte absent refusé', C.normaliserIdee({ id: 'a' }), null);
verifie('texte qui n’est pas du texte', C.normaliserIdee({ id: 'a', texte: 42 }), null);
verifie('identifiant manquant refusé', C.normaliserIdee({ texte: 'Patiner' }), null);
verifie('rien du tout refusé', C.normaliserIdee(null), null);

/* ------------------------------------------------------ le service worker */

/* Les relais de GitHub Pages gardent un fichier 10 minutes après une
   publication. Sans la VERSION dans l'adresse, une installation faite dans
   ces 10 minutes rangeait l'ANCIEN fichier dans le cache de la NOUVELLE
   version, et le servait sans erreur jusqu'à la suivante. */
{
  const sw = require('fs').readFileSync(require('path').join(__dirname, 'sw.js'), 'utf8');
  const install = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
  verifie('sw : installation trouvée', install.length > 0, true);
  verifie("sw : la version est dans l'adresse", /v=' \+ encodeURIComponent\(VERSION\)/.test(install), true);
  verifie("sw : plus d'addAll sans version", /\.addAll\(/.test(install), false);
}

/* --------------------------------------------------------------- bilan */

if (echecs) {
  console.log('\n' + echecs + ' échec(s)');
  process.exit(1);
}
console.log('TOUT EST VERT');
