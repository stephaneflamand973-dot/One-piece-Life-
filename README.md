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
