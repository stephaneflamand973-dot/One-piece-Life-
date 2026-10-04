# ONE PIECE LIFE — QA V8.9

V8.9.0 — Equipment, Items & Loot 4.0

## Objectif

La V8.9 remplace l'ancien bonus abstrait `gearLevel` par de vrais objets persistants. Le personnage possède désormais un équipement identifiable, améliorable, endommageable et lié aux systèmes de combat, mission, voyage, exploration et économie.

## Équipement

- 4 slots actifs : Arme, Tenue, Accessoire et Outil.
- 22 modèles d'objets, dont armes, protections, outils spécialisés et consommables.
- 5 raretés : Commun, Soigné, Rare, Exceptionnel et Légendaire.
- Qualité individuelle de 20 à 100.
- Durabilité et état cassé.
- Jusqu'à 3 améliorations par objet.
- Inventaire limité à 24 objets pour éviter le gonflement des sauvegardes.

## Effets

Les objets peuvent modifier :
- attaque ;
- défense ;
- préparation de mission ;
- Combat, Sabre ou Tir ;
- Navigation ;
- Discrétion ;
- Médecine ;
- Science ;
- Commandement ;
- exploration.

Les objets cassés ne donnent plus de bonus.

## Loot

Le butin peut apparaître après :
- certains combats remportés ;
- les missions réussies ;
- les réussites partielles plus rarement ;
- les trésors et ressources d'exploration.

La rareté dépend du danger, du niveau de l'opposition, de l'exploration locale et du contexte de découverte.

## Économie

- Les marchés V8.8 proposent jusqu'à 4 offres d'équipement locales par année.
- Les offres dépendent des tags de l'île.
- Achat et revente utilisent l'indice régional et la réputation locale.
- Réparations disponibles sur les marchés locaux.
- Le système annuel V6.3 « équipement » améliore désormais un vrai objet.
- L'ancien `gearLevel` est migré vers une pièce réelle puis conservé uniquement comme miroir de compatibilité.

## Intégrations

- V6.5 : bonus de mission, combat et réduction des blessures viennent des objets équipés.
- V8.5 : Navigation, Discrétion et exploration profitent des outils adaptés.
- V8.7 : réputation et conditions locales influencent les prix.
- V8.8 : les marchés deviennent le point d'achat/revente d'équipement.
- Les Fruits du Démon conservés restent dans l'inventaire spécial et ne sont jamais mélangés aux objets ordinaires.

## Version

- GAME_VERSION : **8.9.0**
- SAVE_VERSION : **890**
- Cache PWA : **one-piece-life-v8-9-0**
