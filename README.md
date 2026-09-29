# ONE PIECE LIFE — V1.6 Rivals, Mentors & Living NPCs

La V1.6 approfondit la partie **simulation de vie**. Les personnes rencontrées ne sont plus de simples lignes de relation : elles disposent désormais d’une trajectoire persistante et peuvent devenir des mentors, rivaux, alliés ou membres de ton organisation.

## Personnages persistants

Chaque relation conserve désormais notamment :

- âge propre ;
- puissance ;
- potentiel ;
- spécialité ;
- trajectoire ;
- ambition ;
- carrière ;
- région ;
- blessures ;
- historique de duels ;
- séances de mentorat ;
- souvenirs importants ;
- statut dans ton organisation.

Les anciennes sauvegardes sont migrées automatiquement.

## Progression autonome

Les PNJ procéduraux vieillissent et progressent même lorsque tu ne t’occupes pas d’eux.

Selon leur trajectoire, ils peuvent :

- devenir plus puissants ;
- progresser dans leur carrière ;
- voyager entre régions ;
- être blessés ;
- se remettre ;
- vieillir et mourir ;
- reconnaître le joueur comme un pair.

## Personnages canoniques

Une rencontre canonique crée maintenant un **lien persistant**.

Le jeu mémorise la relation avec le personnage, sa faction, sa région, sa puissance actuelle et les rencontres marquantes.

Les personnages canoniques restent synchronisés avec le WorldState.

Leur liberté relationnelle dépend de la divergence du monde : une chronologie encore proche du canon résiste davantage aux transformations extrêmes.

## Mentors

Une relation suffisamment puissante, respectée et digne de confiance peut devenir mentor.

Un mentor permet :

- entraînement ciblé selon sa spécialité ;
- progression plus rapide ;
- chance rare de repousser un plafond de compétence ;
- reconnaissance comme pair lorsque le joueur finit par le dépasser.

Une action permet aussi de rechercher un mentor dans la région actuelle.

## Rivaux

Une relation peut devenir un rival persistant.

Les rivaux conservent :

- rivalité ;
- puissance ;
- potentiel ;
- victoires ;
- défaites ;
- date du dernier duel ;
- souvenirs communs.

Un rival peut progresser après plusieurs défaites et revenir plus dangereux.

## Recrutement relationnel

Un chef d’organisation peut recruter une relation procédurale déjà connue si :

- elle est présente dans la région ;
- le lien de confiance est suffisant ;
- la loyauté et le respect sont assez élevés ;
- sa faction est compatible ;
- l’organisation dispose d’une place.

Le membre créé reste lié à la relation d’origine.

Les personnages canoniques restent autonomes dans cette version.

## Mémoire sociale

Les relations conservent leurs événements importants :

- première rencontre ;
- entraînement ;
- duel ;
- voyage ;
- progression de carrière ;
- recrutement ;
- blessure et rétablissement ;
- moments partagés.

L’interface affiche le souvenir récent le plus important.

## Achievements V1.6

- **Sous l’aile d’un maître** : cinq entraînements avec un mentor ;
- **Rivalité légendaire** : cinq duels contre le même rival ;
- **Plus qu’une connaissance** : recruter une relation importante dans son organisation.

## Services, dettes et loyauté

Les relations peuvent maintenant créer de véritables **services réciproques**.

Aider quelqu’un :

- augmente confiance et loyauté ;
- crée un crédit social ;
- laisse un souvenir persistant.

Demander ensuite de l’aide peut fournir selon sa spécialité :

- soins ;
- réduction de pression judiciaire ;
- aide à la navigation ;
- appui de réputation ;
- soutien financier.

Abuser des services sans rendre la pareille dégrade progressivement confiance et loyauté.

## Interactions canoniques directes

Les acteurs canoniques présents dans ta région peuvent désormais être approchés depuis l’écran Monde.

La probabilité d’obtenir un véritable échange dépend notamment :

- de ta réputation ;
- de ton influence ;
- de votre faction ;
- de l’importance canonique du personnage ;
- de l’hostilité entre vos camps.

Une fois le lien créé, les rencontres suivantes sont mémorisées.

## Mémoire dynastique

À la mort du personnage, les relations majeures ne disparaissent plus toutes avec lui.

Les mentors, rivaux, liens canoniques et relations extrêmement fortes peuvent survivre dans la génération suivante comme **relations de la famille**.

Le nouvel héritier ne récupère pas automatiquement les sentiments de son parent, mais le PNJ se souvient de la génération précédente.

## Cohérence sociale renforcée

La simulation distingue maintenant réellement la **région** de la **présence locale**.

Pour les PNJ procéduraux :

- être dans la même mer ne suffit plus pour interagir physiquement ;
- la même île est normalement requise ;
- un membre recruté suit l’organisation et le joueur ;
- le partenaire reste synchronisé avec la vie quotidienne du joueur ;
- les interactions physiques sont indisponibles pendant une traversée lorsque le PNJ n’est pas avec toi.

Les relations générées pendant l’enfance respectent également l’âge :

- pas de collègue ou mentor absurde à l’âge scolaire ;
- pas de rivalité procédurale avant six ans ;
- les pairs enfants restent dans une tranche d’âge cohérente ;
- l’interface affiche **Enfance** ou **Formation** au lieu d’un rang professionnel pour les jeunes PNJ.

## Incidents autonomes

Les PNJ procéduraux ne progressent plus dans un vide parfaitement sûr.

Selon leur puissance et le danger de leur région, ils peuvent :

- gagner un affrontement autonome ;
- gagner légèrement en puissance ;
- perdre ;
- être blessés plusieurs mois ;
- se rétablir plus tard.

Ces incidents alimentent leur mémoire persistante.

## Protection du canon

Les relations avec les acteurs canoniques ont maintenant des garde-fous supplémentaires :

- cooldown entre deux interactions significatives ;
- aucune interaction directe pendant une traversée ;
- âge synchronisé avec la chronologie du personnage canonique ;
- mentorat et duels importants limités par la divergence du monde ;
- une relation personnelle ne remplace jamais l’état de l’acteur dans le WorldState.

## QA

La V1.6 exécute désormais **37 scénarios fonctionnels** dans la CI, en plus des validateurs statiques et du content pack.

Ils couvrent notamment :

- création Custom et Destiny ;
- migration d’anciennes sauvegardes ;
- simulation mondiale sur 30 ans ;
- progression, Haki et Fruits ;
- combat ;
- carrière, missions et organisations ;
- relations, mariage, famille et héritage ;
- justice, prison et évasion ;
- influence et domaines ;
- guerres ;
- économie et contrebande ;
- migration des relations V1.6 ;
- synchronisation canonique ;
- mentorat ;
- rivalité ;
- progression autonome ;
- services et dettes ;
- recrutement relationnel ;
- mémoire dynastique ;
- présence locale des PNJ ;
- cooldown des rencontres canoniques ;
- synchronisation organisationnelle ;
- cohérence sociale de l’enfance.

## Compatibilité

Migration interne : **version 16**.

Les sauvegardes précédentes sont migrées automatiquement.

## iPhone / PWA

GitHub Pages publie automatiquement la branche `main`.

Sur iPhone :

Safari → Partager → **Sur l’écran d’accueil** → **Ouvrir comme app web**.
