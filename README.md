# ONE PIECE LIFE — V1.8 Adaptive Life Loop

La V1.8 refond le cœur du jeu : **AVANCER**. Le moteur choisit désormais une durée selon l’âge et le contexte, resserre automatiquement le temps pendant les situations tendues et évite les longues séries de clics sans intérêt.

## Temps adaptatif

La durée d’un avancement dépend maintenant de la situation :

- petite enfance : environ 6 à 9 mois ;
- enfance : environ 4 à 7 mois ;
- formation : environ 2 à 4 mois ;
- vie adulte calme : environ 1,5 à 3 mois ;
- carrière ou entraînement soutenu : environ 1 à 2 mois ;
- danger élevé, blessure, mission, voyage ou détention : périodes beaucoup plus courtes.

Une mission ou une traversée ne peut jamais être dépassée artificiellement par le pas temporel.

## Directeur d’événements

Les événements ne reposent plus sur une simple probabilité uniforme.

Le moteur tient compte notamment :

- de l’âge ;
- du danger local ;
- de la tension mondiale ;
- de l’activité du personnage ;
- des acteurs et équipages présents ;
- du nombre de périodes calmes successives ;
- de la disponibilité réelle de certains événements rares.

Les événements récents voient temporairement leur poids diminuer afin de limiter les répétitions.

## Enfance cohérente

Le directeur d’événements distingue désormais explicitement les événements de jeunesse.

Un jeune enfant peut vivre :

- découvertes ;
- petits défis ;
- rencontres familiales ;
- rumeurs du large ;
- micro-progressions cohérentes.

Il n’est plus envoyé vers les mêmes événements commerciaux ou combats génériques qu’un adulte.

## Anti-ennui sans récompense artificielle

Une période peut rester calme.

Mais après plusieurs périodes réellement calmes, la probabilité d’une interruption significative augmente automatiquement.

Le moteur ne garantit donc pas un Fruit, un Haki ou une rencontre canonique. Il garantit seulement que la simulation ne se transforme pas en série de clics vides.

## Résumé de période

Après chaque AVANCER, l’écran Vie affiche désormais :

- durée écoulée ;
- progression cumulée ;
- variation de puissance ;
- variation de Berry ;
- nombre de moments notables ;
- explication synthétique de la période.

Le joueur peut donc comprendre ce qui vient de se passer sans fouiller toutes les statistiques.

## Prévisualisation du rythme

Avant d’avancer, l’interface indique le type de période actuel :

- Période calme ;
- Formation ;
- Vie active ;
- Navigation ;
- Mission ;
- Contexte tendu ;
- Récupération ;
- Détention.

Elle donne aussi la fenêtre temporelle probable et explique pourquoi le moteur l’a choisie.

## Sauvegardes

Le GameState passe en **version 18**.

Les sauvegardes V1.7 sont migrées automatiquement et reçoivent simplement le nouvel état de boucle de vie. Timeline, personnage, monde, relations et progression existants sont conservés.

## QA V1.8

La release candidate passe **72/72 scénarios fonctionnels**.

Les nouveaux tests couvrent notamment :

- fenêtres temporelles selon l’âge ;
- limites de durée des missions et voyages ;
- rapport après AVANCER ;
- protection contre les longues séries de périodes vides ;
- événements d’enfance adaptés à l’âge ;
- montée de probabilité après plusieurs périodes calmes ;
- migration V17 → V18 ;
- rendu de la nouvelle interface Vie.

Télémétrie de référence :

- 30 vies simulées de la naissance à 15 ans ;
- **48,1 clics** en moyenne pour atteindre 15 ans parmi les vies qui y parviennent ;
- environ **0,52 moment notable par clic** ;
- **29 vies sur 30** atteignent 15 ans dans l’échantillon, avec 1 mort précoce cohérente avec la mortalité du simulateur ;
- maximum de **2 périodes réellement calmes consécutives** ;
- tous les contrôles de progression, monde vivant, économie, guerre, PNJ, justice et héritage des versions précédentes restent actifs.

---

# ONE PIECE LIFE — V1.7 Core Experience Rework

La V1.7 est une refonte structurelle centrée sur les principes du GDD : **interface simple, simulation profonde, progression cohérente et moteur rapide**.

## Interface mobile refondue

La navigation principale reste volontairement limitée à cinq entrées :

- **Vie** : situation actuelle, décisions et timeline ;
- **Progression** : évolution, entraînement, capacités, Haki, Fruit et combat ;
- **Carrière** : profil, carrière, organisation, justice et patrimoine ;
- **Liens** : proches, famille, mentors, rivaux et réseau ;
- **Monde** : voyage, économie, puissances, guerres et chronologie.

Les quatre écrans les plus riches utilisent maintenant des sous-onglets horizontaux. Le joueur ne traverse donc plus une page interminable contenant quinze systèmes différents.

## Rendu allégé

L’ancien rendu reconstruisait simultanément Vie, Personnage, Capacités, Relations et Monde à presque chaque action.

La V1.7 ne reconstruit plus que **l’onglet actuellement affiché**.

Le panneau développeur ne sérialise également le WorldState que lorsqu’il est réellement ouvert.

Cette architecture réduit fortement le travail DOM inutile sur mobile sans diminuer la profondeur de la simulation.

## Progression du personnage auditée

La progression possède maintenant trois niveaux de limite :

- plafond naturel initial ;
- plafond actuel entraînable ;
- plafond extraordinaire caché.

Les anciennes sauvegardes conservent exactement leurs plafonds actuels. La migration ajoute seulement les nouvelles couches cachées.

Une caractéristique arrivée à son plafond actuel ne peut toujours plus recevoir de progression normale.

## Développement lié à l’âge

Le même entraînement n’a plus exactement le même rendement à quatre ans et à vingt-cinq ans.

La croissance est volontairement lente pendant la petite enfance, augmente pendant la formation, atteint son rendement normal à l’âge adulte puis ralentit progressivement avec l’âge avancé.

Les tests de régression empêchent notamment qu’un enfant devienne un combattant d’élite simplement parce que plusieurs gros pas temporels ont été simulés.

## Difficulté réellement différenciée

Les cinq difficultés influencent désormais explicitement progression et danger :

- Casual ;
- Standard ;
- Grand Line ;
- New World ;
- Ironman.

Grand Line et New World ne retombent plus silencieusement sur les mêmes paramètres que Standard.

## Techniques et maîtrise

Débloquer une technique ne donne plus immédiatement 100 % de son bonus.

Son efficacité dépend de sa **maîtrise réelle**.

La maîtrise progresse uniquement lorsque l’activité entraînée est pertinente. Étudier la Science ne perfectionne donc plus mystérieusement une technique de sabre.

## Haki et Fruit

Le Haki et la maîtrise d’un Fruit utilisent maintenant eux aussi la courbe de développement liée à l’âge.

Les opportunités extraordinaires restent possibles, mais l’enfance n’est plus un raccourci numérique vers les capacités de haut niveau.

## Breakthroughs

Les breakthroughs peuvent repousser le plafond actuel sans dépasser un plafond extraordinaire caché.

Sources actuellement prises en compte :

- mentor qualifié ;
- victoire dans un combat réellement dangereux.

Chaque percée est enregistrée dans l’historique de progression.

## Puissance globale recalculée

L’ancienne formule donnait du poids à toutes les compétences dans la puissance de combat. Un excellent médecin ou scientifique pouvait donc devenir artificiellement beaucoup plus dangereux au combat.

La V1.7 utilise désormais principalement :

- capacités physiques pertinentes ;
- Combat ;
- compétence du style naturel, comme Sabre ou Tir ;
- Discipline et Volonté dans une mesure limitée ;
- Haki ;
- Fruit ;
- techniques avec leur maîtrise effective.

Médecine, Navigation ou Science restent importantes pour leurs propres systèmes mais ne gonflent plus artificiellement le niveau martial.

## Tableau de progression

L’écran Progression affiche maintenant :

- puissance estimée ;
- rang de puissance ;
- évolution récente ;
- plafonds actuels atteints ;
- domaines ayant le plus progressé ;
- dernière percée ;
- valeur actuelle / plafond actuel de chaque caractéristique.

Le plafond extraordinaire reste caché conformément au GDD.

## Cohérence générationnelle

Les héritiers reçoivent le même modèle de progression en trois couches.

Ils héritent partiellement du potentiel parental sans récupérer mécaniquement les statistiques ou exploits de leur parent.

## QA V1.7

Le banc professionnel couvre maintenant **60 scénarios fonctionnels** avant publication.

Parmi les nouveaux garde-fous :

- croissance enfant/adulte ;
- cinq niveaux de difficulté ;
- maîtrise ciblée des techniques ;
- impact réel de la maîtrise sur le combat ;
- Haki et Fruit selon l’âge ;
- plafond extraordinaire ;
- migration V16 → V17 ;
- formule de puissance ;
- rendu paresseux des écrans ;
- navigation principale indépendante.

Mesures de référence de la build candidate :

- 200 créations Destiny reproductibles ;
- danger combat 20/40/60/80 : environ **90 % / 62 % / 44 % / 18 %** de victoire pour le personnage médian du test ;
- progression ordinaire à 25 ans : puissance moyenne **32,2**, seulement **0,1 caractéristique au plafond** en moyenne ;
- simulation mondiale de 30 ans stable ;
- 30 campagnes stratégiques simulées ;
- progression autonome de 120 PNJ pendant 15 ans.

## Sauvegardes

Les sauvegardes précédentes sont migrées automatiquement.

La version interne du GameState passe à **17**.

---

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

Lorsque le joueur finit par dépasser nettement son mentor après plusieurs séances, celui-ci peut le reconnaître comme **pair**.

À partir de ce moment :

- le lien reste important ;
- l’entraînement commun continue ;
- le bonus devient plus modéré ;
- les percées de plafond réservées au véritable mentorat ne sont plus disponibles.

La relation évolue donc de maître à élève vers une relation plus équilibrée.

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

La rivalité possède maintenant un véritable cycle de vie :

- rivalité naissante ;
- rival confirmé ;
- **némésis** après plusieurs duels marquants ;
- réconciliation possible lorsque respect, confiance et histoire commune sont suffisamment élevés.

Une rivalité peut donc devenir plus intense ou se transformer en amitié durable au lieu de rester figée éternellement.

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

Une demande refusée ne crée plus artificiellement de dette : le crédit social ne change que lorsqu’un service est réellement accordé.

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
- l’interface affiche **Enfance** ou **Formation** au lieu d’un rang professionnel pour les jeunes PNJ ;
- aucun niveau de carrière professionnel n’est accumulé avant l’âge requis ;
- les déplacements autonomes entre régions commencent à l’âge de carrière ;
- les incidents dangereux sont désactivés pour les plus jeunes et atténués pendant l’adolescence ;
- un duel de rivalité réel n’est pas disponible avant l’adolescence ;
- romance et mariage exigent que les deux personnages soient adultes ;
- le recrutement dans une organisation professionnelle exige l’âge de carrière.

## Incidents autonomes

Les PNJ procéduraux ne progressent plus dans un vide parfaitement sûr.

Selon leur puissance et le danger de leur région, ils peuvent :

- gagner un affrontement autonome ;
- gagner légèrement en puissance ;
- perdre ;
- être blessés plusieurs mois ;
- se rétablir plus tard.

Ces incidents alimentent leur mémoire persistante.


## Relations et politique

Les relations réagissent maintenant aux changements de faction.

Lors d’une désertion ou d’un changement de camp :

- les anciens liens d’organisation sont rompus proprement ;
- les relations appartenant au nouveau camp peuvent gagner confiance et respect ;
- les relations appartenant à une faction hostile peuvent perdre confiance et loyauté ;
- les liens très forts résistent davantage ;
- famille et partenaire bénéficient d’une forte protection relationnelle ;
- une relation procédurale très dégradée peut devenir un rival politique.

Même sans changement de carrière, une hostilité durable entre deux factions peut lentement éroder certains liens et transformer une opposition politique en rivalité personnelle.

## Protection du canon

Les relations avec les acteurs canoniques ont maintenant des garde-fous supplémentaires :

- cooldown entre deux interactions significatives ;
- aucune interaction directe pendant une traversée ;
- âge synchronisé avec la chronologie du personnage canonique ;
- mentorat et duels importants limités par la divergence du monde ;
- une relation personnelle ne remplace jamais l’état de l’acteur dans le WorldState.

## QA

La V1.6 exécute désormais **48 scénarios fonctionnels** dans la CI, en plus des validateurs statiques et du content pack.

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
- cohérence sociale de l’enfance ;
- cycle mentor → pair ;
- cycle rival → némésis / réconciliation ;
- sécurité d’âge pour romance, recrutement et carrière ;
- réaction des relations aux changements de faction ;
- dérive sociale liée à l’hostilité politique ;
- télémétrie de progression de 120 PNJ sur quinze ans.


## Équilibrage long terme des PNJ

Un banc de 120 PNJ est simulé pendant quinze ans à chaque validation de balance.

Sur la build actuelle :

- gain moyen de puissance : **+13,4** ;
- puissance maximale observée : **73,5** ;
- aucun PNJ du panel n’atteint artificiellement 95+ ;
- trajectoire Stable : puissance moyenne **49,0** ;
- Ascension : **55,7** ;
- Instable : **44,7** ;
- Déclin : **39,7**.

La population ne converge donc pas vers un niveau élite uniforme et les trajectoires produisent des différences visibles sur le long terme.

## Compatibilité

Migration interne : **version 16**.

Les sauvegardes précédentes sont migrées automatiquement.

## iPhone / PWA

GitHub Pages publie automatiquement la branche `main`.

Sur iPhone :

Safari → Partager → **Sur l’écran d’accueil** → **Ouvrir comme app web**.
