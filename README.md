# One Piece Life V0.5.8 · Navigation et exploration

La carrière pirate propose un **journal de bord repliable** directement dans **Carrière**. Les actions de navigation et d'exploration sont libres : elles ne consomment aucune année, ne possèdent aucun quota annuel et ne changent pas d'onglet.

## Un monde connecté, pas un catalogue de boutons

21 destinations inspirées de *One Piece*, réparties dans les trois mers :
- **East Blue** : Village de Fuchsia, Shells Town, Orange Town, Village de Sirop, Baratie, Village de Cocoyasi et Loguetown ;
- **Grand Line** : Whiskey Peak, Little Garden, Drum, Alabasta, Jaya, Skypiea, Water Seven et Sabaody ;
- **Nouveau Monde** : Île des Hommes-Poissons, Punk Hazard, Dressrosa, Zou, Pays des Wa et Egghead.

Chaque lieu possède un risque et une description. Le joueur ne peut voyager que vers les îles reliées à son port actuel, puis rebrousser chemin. **Grand Line** exige au moins un compagnon, un niveau de navigation 20 et une coque 35. **Le Nouveau Monde** exige deux compagnons, un brick ou une frégate, navigation 45 et coque 60. **Skypiea** demande navigation 35 et coque 50. Le navigateur de l'équipage peut satisfaire les prérequis de navigation.

## Conséquences persistantes

- **Voyages** : 1 000 Berrys en East Blue, 2 500 en Grand Line, 4 000 dans le Nouveau Monde. Risque de tempête calculé d'après la destination, la vitesse du bateau, le navigateur, la cohésion et l'entretien. Chaque trajet coûte du carburant/provisions représenté par des Berrys et use le bateau. Même après une mauvaise traversée, le joueur atteint sa destination, mais peut subir des dégâts.
- **Exploration sur place** : action gratuite avec découvertes, rencontres et dangers. Butin possible de 4 000 Berrys en East Blue, 9 000 en Grand Line, 15 000 dans le Nouveau Monde. **Les gains diminuent à chaque exploration du même lieu**, jusqu'à s'épuiser ; aucune génération illimitée d'argent en spammant une île.
- **Rencontres** : marchands, habitants, pirates, révolutionnaires ou patrouilles de la Marine. L'apparition de la Marine dépend de la pression de recherche ; les rencontres sont consignées dans le journal.
- **Journal de bord** : 16 derniers événements avec âge, île, type d'action, rencontre et conséquences. L'historique annuel du personnage n'a qu'une ligne par année.
- **Navire** : coque, voiles et gouvernail doivent être utilisables pour voyager. Les dommages réduisent la sécurité des voyages ; réparations et améliorations de V0.5.7 restent disponibles sans limite annuelle.

## Architecture, sauvegarde et compatibilité

Le schéma passe de **16 à 17** avec la clé `opl:foundation:life-v058`. La migration V16 -> V17 ajoute l'emplacement initial et le journal vierge à chaque ancien capitaine, sans modifier son navire, ses améliorations, ses compagnons, Berrys, relations, notoriété et historique. Les migrations plus anciennes sont conservées.

Tests automatiques : itinéraires successifs sans vieillir, accès aux mers, traversées avec ou sans tempête, dégradation localisée, rencontres, économies, UI mobile Chromium/WebKit et migrations anciennes.

## Prochaine étape

V0.5.9 : rencontres maritimes interactives, affrontements, abordages et choix de négociation.
