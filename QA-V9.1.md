# ONE PIECE LIFE — QA V9.1

V9.1.0 — Goals & Player Agency 5.1

## Objectif

La V9.1 transforme l'ancienne ambition descriptive en système jouable d'objectifs personnels sans garantir les résultats.

Le joueur choisit une direction et une intention. Le monde, les probabilités et les systèmes existants déterminent toujours ce qui arrive réellement.

## Ambition long terme

Les 6 ambitions historiques restent la source de vérité :

- Survivre ;
- Devenir puissant ;
- Explorer le monde ;
- Faire fortune ;
- Entrer dans l'histoire ;
- Protéger les autres.

Chaque ambition possède désormais une progression mesurable de 0 à 100 selon des métriques réelles de la partie.

Aucune progression n'est ajoutée artificiellement : elle dérive de l'âge, de la puissance, des lieux visités, de la richesse, de la réputation, de l'héritage et des relations.

## Objectifs intermédiaires

Deux objectifs intermédiaires restent actifs en permanence à partir de 13 ans.

Exemples :

- gagner 10 points de puissance ;
- atteindre le rang suivant ;
- découvrir trois îles ;
- changer de grande région ;
- gagner en réputation mondiale ;
- renforcer son cercle proche ;
- réussir plusieurs missions ;
- développer son commerce ;
- agrandir son équipage ;
- restaurer santé et énergie.

Ils sont générés selon l'ambition et le contexte réel du personnage.

## Prochaines étapes

Trois objectifs courts restent actifs.

Ils utilisent les mêmes données réelles :

- réparer l'équipement ;
- récupérer ;
- gagner 3 points de puissance ;
- découvrir une île ;
- réussir une mission ;
- créer un lien fort ;
- constituer une réserve ;
- compléter les quatre slots d'équipement.

Les objectifs se complètent automatiquement.

## Intention annuelle

7 intentions :

- Équilibre ;
- Ascension ;
- Maîtrise ;
- Aventure ;
- Fortune ;
- Liens ;
- Récupération.

Une intention ne garantit jamais un résultat.

Elle modifie les réglages du plan annuel V6.5 déjà existant :

- Ascension -> carrière intensive ;
- Maîtrise -> entraînement intensif ;
- Aventure -> exploration ;
- Fortune -> ressources supplémentaires ;
- Liens -> investissement relationnel ;
- Récupération -> entraînement récupération + aventure prudente + mission prudente.

Le reste du plan reste intact et peut toujours être personnalisé manuellement.

Les patches d’intention sont appliqués sur une copie du plan de base de l’année : passer de Récupération à Ascension ne conserve donc pas les anciens réglages prudents.

À la clôture du bilan annuel, l’intention revient automatiquement sur Équilibre et le plan préparatoire revient à sa base. Les presets V9.0 et les modifications manuelles reprennent également la priorité sur l’intention.

## Intégrations

- V6.5 : les intentions réutilisent le vrai plan annuel.
- V8.0 : les objectifs terminés alimentent la timeline et les chapitres via addHistory.
- V8.5 : les voyages font progresser les objectifs d'exploration.
- V8.8 : le bénéfice commercial alimente les objectifs de fortune.
- V8.9 : équipement cassé et slots équipés deviennent des objectifs contextuels.
- V9.0 : la progression d'ambition apparaît dans le Cockpit de vie.
- Les réussites de mission sont comptées de manière persistante pour survivre à la rotation de l'historique.

## Migration

- Les anciennes ambitions sont conservées.
- Les objectifs V9.1 sont générés à partir de l'état réel de la sauvegarde.
- Aucun objectif n'est créé avant 13 ans.
- Les compteurs historiques de mission sont initialisés à partir de l'historique disponible puis deviennent persistants.

## Version

- GAME_VERSION : **9.1.0**
- SAVE_VERSION : **910**
- Cache PWA : **one-piece-life-v9-1-0**
