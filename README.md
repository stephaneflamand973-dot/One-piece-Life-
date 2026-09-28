# ONE PIECE LIFE — V1.0 Canon Release

Simulateur mobile-first de vie, carrière, aventure et héritage dans un monde One Piece vivant.

## V1.0

La V1.0 consolide les systèmes développés depuis la V0.5 et sépare désormais le contenu du moteur afin de pouvoir enrichir le jeu sans reconstruire son architecture.

### Content pack séparé

`content-v1.js` contient désormais les données extensibles :

- lieux et routes ;
- personnages canoniques ;
- Fruits du démon ;
- événements historiques ;
- techniques spéciales ;
- événements contextuels.

Le moteur reste dans `app.js`.

### Chronologie canonique causale

Les événements canoniques possèdent maintenant :

- année et mois ;
- type : ancrage ou événement flexible ;
- localisation ;
- personnages requis ;
- factions concernées ;
- résistance à la divergence ;
- statut persistant.

Résultats possibles :

- `future`
- `completed`
- `modified`
- `cancelled`

Un personnage requis mort ou indisponible peut réellement casser la chaîne causale. Le moteur ne restaure pas artificiellement le scénario original.

La simulation mondiale utilise désormais une horloge mensuelle précise : chaque mois simulé reçoit son propre tick de monde et son propre contrôle canonique.

### Contenu V1

Le pack initial V1 ajoute notamment :

- 15 lieux supplémentaires, dont Foosha Village, Cocoyasi, Skypiea, Enies Lobby, Marineford, Impel Down, Amazon Lily, Hachinosu, Elbaf et Mary Geoise ;
- environ 30 acteurs canoniques structurés ;
- plus de 30 Fruits du démon avec type et rareté ;
- une chronologie historique allant de l’exécution de Roger jusqu’aux grands événements de l’ère récente ;
- techniques spéciales comme le Rokushiki, le Karaté des Hommes-Poissons, Electro et des maîtrises avancées de sabre/tir.

### Personnages canoniques

Les acteurs canoniques disposent de :

- période d’activation ;
- région ;
- puissance de départ ;
- plafond ;
- vitesse d’évolution ;
- importance causale ;
- objectif.

Un personnage qui n’a pas encore commencé sa carrière n’est plus simulé comme s’il était déjà à son apogée.

### Fruits du démon

Les Fruits ne sont plus tirés uniformément.

Leur rareté influence la probabilité de découverte. Le registre mondial continue de suivre :

`available → held → consumed / sold`

### Techniques spéciales

Les techniques spéciales se débloquent selon des conditions réelles :

- faction ;
- race ;
- style ;
- compétence ;
- statistique.

Exemples : Rokushiki pour certaines carrières gouvernementales, Electro pour les Minks, Karaté des Hommes-Poissons pour les Hommes-Poissons.

### Événements locaux

La zone et la région peuvent maintenant générer davantage de situations contextuelles :

- contrôles ;
- météo ;
- commerce ;
- épaves ;
- rumeurs ;
- contacts clandestins ;
- découvertes.

### Interface Monde

La V1 ajoute :

- prochains ancrages historiques ;
- santé de la chronologie ;
- personnages requis manquants ;
- statistiques du content pack ;
- statut détaillé de chaque événement canonique ;
- Codex enrichi par les événements et techniques découverts.

## Systèmes hérités

### V0.9
Relations, romance, famille, enfants, économie, achievements et héritage intergénérationnel.

### V0.8
Monde autonome, équipages procéduraux, territoires, conflits et diplomatie.

### V0.7
Carrières, rangs, spécialisations, missions et réputation de factions.

### V0.6
Combat, styles, techniques, Haki, Fruits du démon et blessures.

### V0.5
Routes maritimes, voyages, régions et première couche de canon dynamique.

## Validation

Deux contrôles automatiques sont exécutés à chaque push :

```
node scripts/validate.mjs
node scripts/validate-content.mjs
```

Ils vérifient notamment :

- syntaxe ;
- interface ;
- migration V1 ;
- présence des systèmes essentiels ;
- routes vers des lieux existants ;
- IDs uniques ;
- Fruits non dupliqués ;
- personnages requis par le canon ;
- ordre chronologique des événements.

## Sauvegardes

Les sauvegardes V0.5 à V0.9 sont migrées automatiquement vers V1.0.

Le Codex et les achievements restent méta-persistants par emplacement.

## iPhone / PWA

GitHub Pages publie automatiquement la branche `main`.

Sur iPhone :

Safari → Partager → **Sur l’écran d’accueil** → **Ouvrir comme app web**.

Le service worker V1 met également `content-v1.js` en cache pour le fonctionnement hors ligne.

## Note

Projet fan-made expérimental. Le dépôt n’embarque pas d’images, musiques ou autres assets officiels.
