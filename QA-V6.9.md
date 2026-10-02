# ONE PIECE LIFE — QA V6.9

V6.9.0 — Career, Economy & Endgame 2.0

## Objectif

La V6.9 transforme la fin de carrière.

Avant V6.9, atteindre un rang élevé augmentait surtout :
- le titre ;
- le salaire ;
- le prestige ;
- certaines valeurs de réputation.

Désormais, un personnage suffisamment établi peut :
- déléguer des missions ;
- prendre des décisions stratégiques ;
- développer des actifs durables ;
- générer des revenus structurels ;
- payer des charges structurelles ;
- construire un héritage ;
- modifier le monde sans devoir personnellement effectuer chaque petite opération.

La règle de design est :

> Plus ton autorité augmente, moins ta carrière repose uniquement sur tes actions personnelles.

## Autorité

Chaque carrière reçoit un score d'autorité dynamique.

Il dépend de :
- position dans la hiérarchie ;
- prestige ;
- compétences pertinentes ;
- réputation de faction ;
- réputation mondiale.

Quatre phases :
1. Exécutant ;
2. Professionnel confirmé ;
3. Commandement ;
4. Décideur stratégique.

Les niveaux Commandement et Décideur stratégique débloquent de nouveaux mécanismes.

### QA
- recrue Marine : autorité 5,7 ;
- Vice-Amiral très expérimenté : autorité 100 ;
- phase atteinte : Décideur stratégique.

## Délégation

À partir du niveau Commandement :
- les missions faibles peuvent être déléguées ;
- au niveau Décideur stratégique, certaines missions moyennes peuvent aussi l'être.

Une délégation utilise :
- autorité ;
- Commandement ;
- cohésion de l'équipage ;
- réseau organisationnel ;
- difficulté de la mission.

Une réussite :
- donne une partie de la récompense ;
- donne une partie de l'XP ;
- produit une conséquence mondiale réduite ;
- ne met pas directement la santé du joueur en danger.

Un échec :
- ne blesse pas directement le personnage ;
- produit néanmoins des conséquences de réputation et de monde.

Une seule délégation majeure est disponible par année.

## Directives stratégiques

Les hauts niveaux de carrière peuvent effectuer une directive stratégique par année.

Options générales :
- Stabiliser la région ;
- Étendre l'influence ;
- Mobiliser l'organisation.

Les civils disposent d'une option économique :
- Stimuler l'économie locale.

Les libellés varient selon la faction.

Une directive :
- coûte des Berry ;
- utilise l'autorité ;
- modifie directement V6.8 Causal World ;
- est enregistrée dans le registre causal.

Exemples d'effets :
- baisse d'instabilité ;
- baisse de criminalité ;
- baisse de piraterie pour certaines factions ;
- hausse d'influence ;
- hausse de prospérité ;
- bonus de mission via mobilisation.

Une seule directive stratégique est disponible par année.

## Actifs durables

Trois familles d'actifs sont ajoutées :

### Base
Selon la faction :
- infrastructure de commandement ;
- repaire / port sûr ;
- base clandestine ;
- bureau sécurisé ;
- quartier général ;
- base professionnelle.

### Réseau
Selon la faction :
- réseau opérationnel ;
- informateurs ;
- cellules ;
- renseignement ;
- pistes ;
- contacts.

### Structure économique
Selon la faction :
- logistique ;
- flotte & affaires ;
- infrastructure spéciale ;
- bureau de contrats ;
- entreprise.

Chaque actif possède 3 niveaux.

Une seule amélioration d'actif majeur peut être achetée par année.

## Économie structurelle

Les actifs ne sont pas uniquement des bonus.

Chaque année ils peuvent générer :
- revenus ;
- coûts d'entretien.

Le résultat net est appliqué automatiquement au bilan annuel.

QA de référence avec Entreprise niveau 1 :
- revenus : 42 292 B ;
- charges : 9 000 B ;
- net : +33 292 B.

Le même système est testé sur 20 années supplémentaires pour éviter une explosion économique.

Résultat :
- valeurs finies ;
- argent non négatif ;
- pas d'emballement au-delà des limites de stress.

## Organisation et missions

Le Réseau et la Base ajoutent une contribution à la préparation des missions.

Dans le scénario QA :
- bonus organisation développé : +7,5.

Une mobilisation stratégique peut encore augmenter temporairement ce bonus pendant 12 mois.

L'autorité n'annule donc pas Combat & Mission 2.0 :
elle ajoute une couche organisationnelle aux facteurs déjà existants.

## Héritage

La V6.9 introduit un score d'héritage sur 100.

Il combine :
- autorité ;
- actifs ;
- fortune ;
- réputation mondiale ;
- impact causal V6.8 ;
- prestige.

L'équilibrage a été corrigé pendant le développement :
fortune et autorité dominaient initialement trop le calcul.

La formule finale donne davantage de poids à :
- organisation durable ;
- impact sur le monde ;
- construction à long terme.

QA :
- héritage avant organisation / fort impact : 70 ;
- héritage après actifs maximums + impact causal important : 100.

## Jalons persistants

Le moteur peut enregistrer :
- Accès au commandement ;
- Décideur stratégique ;
- Fortune établie ;
- Organisation durable ;
- Impact mondial ;
- Héritage majeur.

Ces jalons restent dans la sauvegarde et produisent un événement d'historique lorsqu'ils sont franchis.

## Titres d'endgame

La fin de carrière n'est plus limitée au prestige numérique.

La trajectoire obtient un titre dynamique selon faction et héritage.

Exemples de voies :
- Haut commandement ;
- Puissance pirate ;
- Réseau révolutionnaire ;
- Appareil d'influence ;
- Réseau de chasse ;
- Empire commercial ;
- Héritage professionnel.

Le niveau peut évoluer :
- émergent ;
- établi ;
- majeur ;
- légendaire.

## Interface

Deux nouveaux blocs apparaissent dans l'onglet Personnage :

### Autorité & héritage
Affiche :
- phase de carrière ;
- autorité ;
- héritage ;
- impact mondial ;
- jalons ;
- directives disponibles.

### Actifs durables
Affiche :
- niveaux de Base ;
- Réseau ;
- Structure économique ;
- revenus structurels cumulés ;
- charges cumulées ;
- options d'investissement.

Le tableau Missions affiche maintenant deux actions lorsque la délégation est disponible :
- Prendre la mission ;
- Déléguer.

## Correctifs UI

La V6.9 a également détecté puis corrigé plusieurs bindings qui avaient été accidentellement rétrogradés de `$$()` vers `$()` pendant les refontes.

Sont protégés :
- Fruits ;
- Activités ;
- Réparation du navire ;
- Missions ;
- Délégation ;
- Directives V6.9 ;
- Actifs V6.9 ;
- Voyages ;
- World Hooks ;
- Économie.

## Compatibilité

La chaîne de QA bloque toute régression des systèmes :
- V6.4 Risk / Adventure / Rarity ;
- V6.5 Combat & Mission ;
- V6.6 Potential Engine ;
- V6.7 Relationship & Crew ;
- V6.7.1 Stabilization ;
- V6.8 Causal World ;
- V6.9 Career / Economy / Endgame.

Le stress-test V6.7.1 de 30 ans reste actif.

Le stress-test V6.8 de 12 ans causaux reste actif.

## Résultats QA V6.9

- autorité faible : 5,7 ;
- autorité haute : 100 ;
- niveau haut : Décideur stratégique ;
- revenu structurel annuel testé : 42 292 B ;
- charges annuelles : 9 000 B ;
- net : +33 292 B ;
- bonus organisation : +7,5 ;
- héritage de base : 70 ;
- héritage construit : 100 ;
- jalons persistants : 6 ;
- délégations testées : 1 ;
- directives testées : 1 ;
- économie endgame sur 20 ans : stable.

## Version

- GAME_VERSION : **6.9.0**
- SAVE_VERSION : **690**
- Cache PWA : **one-piece-life-v6-9-0**
