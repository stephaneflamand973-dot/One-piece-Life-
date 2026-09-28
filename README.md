# ONE PIECE LIFE — V0.8 Living World

Prototype mobile-first d’un simulateur procédural de vie, carrière et aventure dans un monde pirate vivant.

## V0.8 — Living World

La V0.8 transforme l’état du monde en simulation persistante indépendante du joueur.

### Monde autonome
- simulation mondiale mensuelle ;
- équipages procéduraux qui naissent, se déplacent, gagnent en puissance et peuvent disparaître ;
- personnages majeurs dotés d’un état, d’une localisation, d’un objectif et d’une activité autonome ;
- déplacements des acteurs majeurs entre régions ;
- blessures temporaires des personnages lors de confrontations importantes ;
- disparition hors écran extrêmement protégée par l’importance causale et la divergence accumulée.

### Territoires
- chaque lieu possède désormais un contrôleur ;
- influence et stabilité sont simulées séparément ;
- les territoires peuvent devenir contestés ;
- les conflits peuvent changer durablement le contrôle d’une île ;
- les résultats sont conservés dans l’historique mondial.

### Conflits
- affrontements entre Marine, Gouvernement, Pirates, Révolutionnaires et autres forces ;
- intensité et durée propres à chaque conflit ;
- résolution basée sur la puissance globale, l’influence locale, les équipages impliqués et le RNG seedé ;
- les conflits peuvent être générés par le monde ou provoqués indirectement par les actions du joueur.

### Diplomatie
- relations persistantes entre grandes factions ;
- alliances, coopération, neutralité, tension et hostilité ;
- certaines oppositions fondamentales restent beaucoup plus stables ;
- des évolutions diplomatiques peuvent apparaître dans les actualités mondiales.

### Impact du joueur
- les missions de carrière influencent désormais le territoire où elles se déroulent ;
- une mission importante peut renforcer une faction, fragiliser un contrôle local ou déclencher un conflit ;
- les interventions de haut niveau peuvent augmenter la divergence historique.

### Équipages autonomes
Chaque équipage possède notamment :
- faction ;
- région ;
- puissance ;
- nombre de membres ;
- moral ;
- prime éventuelle ;
- victoires / défaites ;
- statut actif ou détruit.

### Interface Monde
La section Monde affiche maintenant :
- tension globale ;
- conflits actifs ;
- territoires contestés ;
- personnages présents dans la région ;
- contrôleurs des lieux visités ;
- équipages émergents ;
- diplomatie entre factions ;
- actualités produites par de vrais changements d’état.

## Héritage des versions précédentes

V0.7 : carrières, rangs, spécialisations, salaires, réputation de faction et changements de voie.

V0.6 : combat multidimensionnel, styles, techniques, Haki, Fruits du démon, blessures et rapports de combat.

V0.5 : routes maritimes, voyages, régions et canon dynamique.

## Sauvegardes

Les sauvegardes V0.5 à V0.7 sont migrées automatiquement vers V0.8.

## Déploiement

Chaque push sur `main` est validé puis publié sur GitHub Pages. Sur iPhone : Safari → Partager → **Sur l’écran d’accueil** → **Ouvrir comme app web**.
