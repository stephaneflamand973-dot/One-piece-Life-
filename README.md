# One Piece Life V0.6.0 · Actions répétables et rendements décroissants

La simulation conserve la navigation **Grand Line Premium** et son moteur, mais retire les **quotas annuels artificiels** : les actions restent déclenchables plusieurs fois tant que leurs prérequis de jeu sont remplis. Seul **+ Âge** fait avancer une année.

## Principe commun

Les trois premières utilisations d'une famille d'actions dans l'année fonctionnent normalement, puis les bénéfices positifs et/ou probabilités diminuent. Le facteur commun est `max(5 %, 1/(1 + 0,42 × répétitions supplémentaires))`. Les échecs, les coûts et les risques ne disparaissent pas. Le gain réel dépend toujours de la compétence, de la fatigue, du contexte et des ressources.

- **Activités :** entraînements illimités à rendement décroissant ; fatigue et blessure restent des pénalités, sans blocage annuel. Repos répétables avec récupération diminuée.
- **Relations :** discussions répétées avec le même proche, cadeaux, aide et conflits ; chances et gains positifs dégressifs. Rencontres amicales, sorties de groupe, romance et contacts de faction ne consomment plus un quota verrouillant.
- **Carrière pirate :** travail intensif et candidatures réitérables. Les missions peuvent être répétées sans restriction de fréquence ; chances, butin, progression et croissance de la prime sont modulés.
- **Équipage et navire :** entraînements, réparations, partage, récompenses et entretien restent accessibles sous leurs conditions réelles ; les bénéfices se réduisent à force de répéter l'action.
- **Exploration :** plusieurs fouilles de la même île restent possibles. Le butin et la réussite sont dégressifs *durant l'année*, puis le rendement revient à la normale au passage à l'année suivante.
- **Affichage :** Relations et Activités présentent le nombre d'actions réalisées sans barre de quota ; Missions affiche le rendement et le gain maximal actuel.

## Ce qui reste soumis à des règles

Une action peut rester indisponible si le personnage est décédé, trop jeune pour une activité, si une décision obligatoire est en attente, si le navire est immobilisé ou si l'argent ou la capacité réelle manque. La maîtrise maximale d'une statistique et la capacité d'un équipage ne sont pas des quotas annuels. Les événements annuels narratifs et le bouton + Âge ne sont pas des activités répétables.

## Compatibilité et sûreté

**Aucune nouvelle clé de sauvegarde et aucun changement du schéma V18.** Les compteurs existants continuent d'être utilisés. Pour les commandes du capitaine, un compteur d'usage facultatif et borné en taille est ajouté seulement lorsque nécessaire : les anciennes sauvegardes demeurent valides. Tous les compteurs annuels sont réinitialisés avec + Âge. Les tests vérifient les répétitions au-delà de dix utilisations, la sauvegarde atomique, la diminution et la remise à zéro.

---

## Historique des versions

# One Piece Life V0.5.11 · Carrière pirate Grand Line Premium

**Réorganisation UX/UI pure** de la carrière pirate. Les calculs, les probabilités, les coûts, les accès métiers, le vieillissement et les sauvegardes restent ceux de la V0.5.10. Le schéma V18 et la clé locale de sauvegarde sont inchangés.

## Organisation

Depuis **Carrière**, le tableau de bord rassemble la fiche professionnelle et les informations de prime/butin, la performance, les événements prioritaires et des raccourcis. Six sous-pages claires sont disponibles : **Mon parcours**, **Mon équipage**, **Aventures**, **Mon navire**, **Finances**, **Influence**.

- **Mon parcours** : emploi, rang, ancienneté, performance, entraînement, demande de promotion, recrutement et fondation de son propre équipage.
- **Mon équipage** : présentation adaptée au statut ; cartes monogrammes et fiches individuelles repliables pour les membres recrutés, fonctions de commandement pour le capitaine uniquement.
- **Aventures** : Missions (contrats existants) et Exploration (routes/îles, navire, journal), avec bascule interne sans nouvel onglet général.
- **Mon navire** : état, réparations, entretien, amélioration et achat d'un autre navire, sur un seul écran.
- **Finances** : Berrys disponibles, bilan de missions, coûts déjà définis, partage du butin et renvoi vers les dépenses navales. Aucune comptabilité fictive.
- **Influence** : avis de recherche, notoriété, pression et discrétion.

En recrutement, le joueur accède aux offres via **Mon parcours**. Les simples membres et officiers voient leurs tâches et relations, tandis que le capitaine dispose des six espaces de commandement. Les pages non pertinentes ne polluent pas le tableau de bord.

## Fenêtres de décision

Une rencontre maritime ou demande d'équipage en attente s'affiche dans une **fenêtre immersive prioritaire** avec ses véritables choix et chances. La fenêtre bloque l'accès au reste jusqu'à résolution, sans ajouter un vieillissement. Navigation au clavier, focus et viewport mobile sont pris en compte.

## Garantie technique

L'architecture utilise le registre de sous-pages `#/career/*` déjà existant. Le fichier `career-layout.mjs` réorganise des fragments de `career-view.mjs` (mêmes boutons et disponibilités). Les styles sont isolés dans `career-dashboard.css`.

**Aucun fichier `foundation/src/core/` n'a été modifié.** Tests Node, compatibilité des sauvegardes et parcours Chromium/WebKit vérifient l'absence de régression. La seule action faisant passer une année reste `+ Âge`.

---

## Versions précédentes

# One Piece Life V0.5.10 · Grand Line Premium

**Refonte strictement visuelle**, livrée après la V0.5.9. Aucun changement aux probabilités, décisions, âge, sauvegardes, carrière pirate ou relations. Schéma de sauvegarde inchangé (V18).

## Nouvelle identité graphique

- **Couleurs :** bleu océan profond, or marin, parchemin ivoire et vert lagon. Typographies natives, titres éditoriaux en serif, fonds/textures réalisés en CSS sans téléchargement externe.
- **Vie :** carte du personnage, médaillon initial illustré, âge, statut, île actuelle, prime éventuelle, jauges réelles d'énergie, réputation, navigation et moral/volonté. Journal de bord chronologique lisible, événements récents immédiatement visibles et décisions contrastées.
- **Carrière :** en-tête capitaine avec richesse et prime réelles ; cartes, monnaies, actions et progression harmonisées. Les panneaux existants restent repliables et fonctionnels.
- **Navigation et navire :** bandeau cartographique décoratif situant le joueur et silhouette de navire. Aucune fausse donnée de géolocalisation et aucun impact sur les routes.
- **Relations :** portraits monogrammes façon cartes de personnages, progression affinée, fiches et interactions plus contrastées.
- **Activités :** panneaux d'entraînement, jauges et actions homogènes.
- **Marque/PWA :** rose des vents dorée sur fond marine, en-tête et navigation basse premium, couleurs système cohérentes.

Le thème vit dans `foundation/grand-line-premium.css`, chargé **après** `foundation/styles.css`. Cela permet de faire évoluer l'apparence sans toucher au moteur ni à l'architecture fonctionnelle.

## Garanties

Pas d'images distantes, pas de nouvelles dépendances, pas de modification des règles et aucune nouvelle clé de sauvegarde. Les interactions restent compatibles avec iPhone, Chromium, WebKit et les petits écrans. Les tests et vérifications visuelles sont inclus.

---

## Historique de la V0.5.9

# One Piece Life V0.5.9 · Rencontres et combat naval

Cette version ajoute un **moteur de confrontations en mer** dans la carrière pirate, au même endroit que la navigation et le commandement. Les déplacements, combats, négociations, réparations et explorations ne font jamais vieillir : seul **+ Âge** ajoute une année.

## Des rencontres qui imposent une vraie décision

Pendant un trajet entre îles, une interception aléatoire peut survenir, selon le danger local, la Marine et la chaleur de la prime. Les rencontres possibles sont :
- **Pirates rivaux** : duel naval et abordage à haut risque.
- **Marine** : patrouille et risque de voir sa prime monter après une attaque.
- **Marchands** : rencontres de commerce, confrontation ou négociation.
- **Révolutionnaires** : contacts et confrontations possibles.

Chaque rencontre propose quatre réponses visibles dans Carrière : **Combattre, Aborder, Fuir, Négocier**. Les probabilités sont calculées à la demande en fonction de la menace, des talents, des canons, de la vitesse, du nombre et du niveau des marins, du médecin et des conditions du navire. Aborder demande au moins un compagnon. Les trois autres actions permettent de sortir d'une rencontre, y compris quand la coque est endommagée.

## Conséquences dynamiques

Les victoires et défaites ont un coût : dégâts à la coque et aux canons, fatigue ou blessure, perte de Berrys, moral et cohésion. Les victoires rapportent du butin et peuvent faire augmenter la prime, distincte de la fortune ; attaquer la Marine est plus visible. La fuite dépend des capacités du navire, et la négociation peut préserver les ressources.

Les confrontations ont leur **journal persistant** (16 dernières entrées), avec résultat, probabilité réelle, dégâts, butin et progression de la prime. Des compteurs historiques suivent les victoires, les défaites, les évasions et les négociations. Les actions restent illimitées par année : seul le réalisme des ressources, du niveau des membres et de la fatigue encadre les conséquences.

Une rencontre en cours apparaît **en haut de la carrière** et bloque les autres ordres et « + Âge » jusqu'à sa résolution. Depuis Vie, un bouton **Rencontre** renvoie directement au bon écran. Le panneau Navigation reste repliable et l'interface mobile utilise les boutons existants.

## Persistance et sécurité

Le schéma V18 / clé `opl:foundation:life-v059` ajoute des confrontations vides aux parties de la V0.5.8, sans effacer personnages, navire, itinéraires, Berrys, prime ou historique. Les anciennes migrations restent actives. Chaque choix est enregistré de façon atomique ; un échec de stockage empêche toute action partielle.

Tests : navigation interceptée, reprise après rechargement, abordage, fuite, négociation, prime, fatigue/blessure, années bloquées, migrations et parcours Playwright Chromium/iPhone WebKit.

## V0.6.0 proposée

Développer les **styles de combat du personnage**, l'entraînement du Haki et les Fruits du Démon, avec des probabilités dynamiques et une progression façon BitLife.
