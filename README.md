# ONE PIECE LIFE — V5.0 Grand Journey

La V5.0 part du constat post-V4.0 : le monde sait désormais vivre sans le joueur, mais la vie du joueur doit devenir tout aussi organique.

## Life Director
- Un **Life Director** persistant fonctionne en arrière-plan sans créer de nouvelle jauge ni nouvel onglet.
- Les carrières peuvent maintenant faire émerger des **opportunités de mobilité** qui proposent de voyager vers une destination réellement accessible.
- Accepter une mutation déclenche une vraie traversée avec les systèmes maritimes existants et mémorise la cause du déplacement.
- Les liens sociaux forts peuvent faire émerger naturellement une **possibilité sentimentale**, sans obliger le joueur à fouiller le menu Relations.
- Un couple établi peut faire apparaître des étapes familiales importantes comme le mariage ou l’arrivée d’un enfant, toujours sous forme de décision explicite du joueur.
- Les historiques du Life Director sont bornés afin de préserver les longues sauvegardes.
- Le GameState interne reste en **version 28**.

## État actuel de la V5.0
- **Mobilité organique** : des opportunités professionnelles peuvent provoquer de vraies traversées sans passage obligatoire par le menu Monde. Les destinations sont pondérées par la faction, l’ambition, l’état géopolitique, la nouveauté et les déplacements récents afin d’éviter les allers-retours artificiels.
- **Continuité du foyer** : conjoint et distance géographique réagissent aux mutations ; les étapes familiales exigent une proximité réelle.
- **Momentum de carrière** : réussites et échecs modifient temporairement la vitesse de progression professionnelle, puis l'effet revient vers la normale. Les promotions supérieures demandent aussi un dossier de missions crédible.
- **Chapitres personnels** : promotions, missions majeures, rivalités, voyages et famille peuvent se regrouper en arcs de vie mémorables sans ajouter d'écran.
- **Chronique de vie** : le bilan final synthétise automatiquement reconnaissance, voyages, famille, chapitres et moments signatures, puis transmet une version compacte à la génération suivante.
- **Carrefour d’héritage** : lorsqu’un ancêtre a réellement marqué le monde, son descendant reçoit au plus une décision majeure pour assumer cet héritage ou tracer sa propre voie ; les héritages insignifiants ne génèrent aucune interruption.
- **Fluidité** : vie active ordinaire compressée en fenêtres de 4 à 6 mois ; périodes adultes réellement calmes en 5,5 à 7,5 mois. Les événements importants interrompent toujours la période immédiatement.
- **Release gate** : GitHub Pages ne publie désormais qu’un SHA ayant réussi le QA V5.0, puis les validations statiques sont rejouées sur ce même SHA avant déploiement.
- Les historiques V5.0 restent bornés et le GameState reste en **version 28**.

## Baseline auditée V5.0
Release candidate validée après Life Director, mobilité organique, continuité du foyer, dossiers de carrière, réorientations organiques et chapitres personnels :

- QA : **333/333** ;
- survie 20 ans : **96 %** ;
- fluidité : **5,21 AVANCER/an** ;
- missions : **1,03/an** ;
- lieux visités : **4,0** en moyenne sur 20 ans et **6,7** sur 40 ans ;
- couple : **94 %** ; mariage : **63 %** ; parentalité : **54 %** dans les carrières autonomes de l’audit ;
- chapitres personnels résolus : **4,9** par carrière sur 20 ans et **9,5** sur 40 ans ;
- souvenirs fondateurs : **1,7** par carrière sur 20 ans ;
- variété moyenne de rang final : **2,0** par profil ;
- stress de réorientation volontairement mal appariée : **42 %** des carrières changent de spécialité, pour seulement **0,42** tournant moyen ;
- sauvegarde moyenne 20 ans : **232,4 KB**, maximum observé **249,3 KB** ;
- sauvegarde moyenne 40 ans : **270,8 KB**, maximum observé **286,3 KB** ;
- monde V4 préservé : **2,58 sagas/décennie**, **0,45** saga active en moyenne, **100 %** de résolution ;
- simulation mondiale : **3,88 ms/mois** ;
- GameState interne : **28**.

## Philosophie V5.0
Le moteur doit proposer le prochain tournant intéressant. Le joueur décide. Les actions ordinaires restent automatiques.

---

# ONE PIECE LIFE — V4.0 Living World

La V4.0 fait passer la simulation d'une carrière dans One Piece à une simulation du monde de One Piece autour de cette carrière.

## Living World
- Les guerres, rivalités majeures et divergences canoniques peuvent devenir des **sagas mondiales persistantes**.
- Les sagas évoluent de Tensions à Confrontation, Escalade puis Point culminant, avant stabilisation, nouvel équilibre ou rupture.
- Les factions et équipages poursuivent des **ambitions collectives persistantes**.
- Les changements territoriaux mémorisent leur cause afin de produire une géopolitique traçable.
- Le joueur est intégré automatiquement aux sagas de sa région lorsque sa carrière les traverse.
- L'endgame utilise désormais une **reconnaissance mondiale organique** fondée sur puissance, influence, territoires, alliés, sagas et impact canonique.
- Le Canon Engine V3.5 reste actif : les timelines alternatives continuent d'alimenter les nouvelles sagas.
- Toute cette profondeur reste principalement automatique et remonte via les interfaces existantes plutôt que par de nouveaux écrans de micro-gestion.
- Le GameState interne reste en version 28 pour préserver les sauvegardes existantes.

---

# ONE PIECE LIFE — V3.5 Canon Engine

La V3.5 transforme la chronologie canonique en système causal vivant plutôt qu'en calendrier figé.

## Canon Engine
- Les grands événements possèdent désormais des dépendances historiques explicites.
- La chronologie évolue entre **Canon protégé**, **Canon flexible** et **Timeline divergente**.
- Un événement modifié ou annulé génère une branche alternative persistante.
- Ces branches évoluent mois après mois selon l'instabilité locale, les factions et les acteurs présents.
- Une branche peut se résorber, créer un nouvel équilibre ou dégénérer en conflit territorial réel.
- Le joueur peut être enregistré comme cause directe d'une divergence lorsque son implication est effectivement plausible.
- Cette responsabilité influence sa réputation et ses relations avec les personnages canoniques concernés.
- Les conséquences importantes remontent dans le compte rendu compact **AVANCER**, sans nouvel écran de micro-gestion.
- Les historiques canoniques sont bornés afin de préserver les longues carrières et la taille des sauvegardes.
- Le **GameState interne reste en version 28** afin de conserver la compatibilité des sauvegardes existantes.

---

# ONE PIECE LIFE — V3.2 World Foundations

La V3.2 transforme les systèmes autonomes existants en une mémoire mondiale persistante, sans ajouter de micro-gestion.

## Fondations du monde vivant
- Les acteurs majeurs possèdent désormais une ambition persistante et une progression associée.
- Leurs actions significatives alimentent un historique causal.
- Les équipages autonomes disposent également d'un historique persistant.
- Les ambitions peuvent influencer factions, territoires, stabilité et équipages alliés.
- Les changements territoriaux significatifs sont mémorisés.
- Le compte rendu **AVANCER** remonte uniquement les changements mondiaux importants via **Monde vivant**, afin de préserver une interface compacte.
- Les anciennes sauvegardes restent compatibles avec le GameState interne 28.

---

# ONE PIECE LIFE — V3.1 Living Endgame

La V3.1 poursuit la refonte de fluidité sans rajouter de micro-gestion. Deux cibles : réduire la densité d'interruptions des pirates vétérans sans rendre le Nouveau Monde inoffensif, et donner aux carrières longues des objectifs de fin de partie propres à leur voie.

## V3.1 — Living Endgame

### Rythme pirate vétéran
À partir d'une carrière pirate établie, un personnage suffisamment puissant absorbe les incidents mineurs dans des blocs de temps plus longs. Le contexte reste classé **haut risque** : seules les interruptions banales sont compressées. Une pression judiciaire extrême rétablit immédiatement le rythme court et urgent.

### Objectifs de fin de carrière
À partir de 25 ans, chaque grande voie reçoit des jalons mesurables plutôt qu'un simple grind de statistiques :
- Pirates : Nouveau Monde, territoires, flotte, puissance mondiale ;
- Marine : haut commandement, statut de figure majeure, influence sur l'équilibre des mers ;
- Révolutionnaires : réseau, commandement, divergence mondiale ;
- Gouvernement : opérations d'élite, réseau d'influence, autorité mondiale ;
- Chasseurs de primes : captures, fortune, reconnaissance ;
- Civils : maîtrise professionnelle, fortune et héritage.

Ces jalons utilisent les systèmes déjà présents. Ils ne créent donc ni nouvelle monnaie ni écran de gestion supplémentaire.

### Compatibilité
Le **GameState reste en version interne 28**. Les sauvegardes V2.8, V2.9 et V3.0 restent compatibles.

---

# ONE PIECE LIFE — V2.9 Living Missions

La V2.9 vient d'un stress-test longue durée de la V2.8 : le moteur était stable, mais une carrière de vingt ans finissait encore par revoir trop souvent les mêmes missions. Cette release corrige ce problème sans ajouter d'écran, de monnaie ni de micro-gestion.

## V2.9 — Living Missions

### Missions métier adaptatives

Le tableau de carrière peut maintenant générer des briefs adaptés à :

- la faction ;
- la spécialisation ;
- le lieu actuel ;
- la région ;
- le rang ;
- le danger local ;
- les missions récemment acceptées.

Les briefs sont déterministes tant que l'état du jeu ne change pas : ouvrir plusieurs fois le tableau ne consomme pas de RNG et ne permet pas de reroll artificiellement les propositions.

Une mission acceptée est immédiatement pénalisée par le directeur de nouveauté, qui privilégie ensuite une autre combinaison de mission et de contexte.

### Tableau de missions compact

Le tableau reste limité à trois propositions.

Lorsqu'elles existent, le moteur protège désormais trois rôles complémentaires :

1. une option réellement viable ;
2. une opportunité produite par le monde vivant ;
3. un brief adaptatif lié au métier du personnage.

Les missions statiques restent disponibles lorsqu'elles sont compétitives. Les missions de routine de V2.8 restent un filet de sécurité uniquement si aucune proposition n'atteint le seuil de viabilité.

### Némésis mieux rythmées

Une Némésis ne répète plus continuellement l'intention « Poursuivre sa némésis » alors qu'un duel est déjà prêt.

La poursuite revient après une période de refroidissement lorsqu'une nouvelle confrontation doit réellement être préparée. Le système conserve donc la pression narrative sans transformer la rivalité en notification mensuelle.

### Compatibilité

La V2.9 ne crée aucune nouvelle donnée persistante obligatoire. Le **GameState reste en version interne 28** : les sauvegardes V2.8 sont directement compatibles et aucune migration artificielle n'est ajoutée.

### Stress-test longue durée

Le banc V2.9 simule **48 carrières de 20 ans** réparties sur six profils :

- Civil / Scientifique ;
- Civil / Navigateur ;
- Marine / Combattant ;
- Pirates / Duelliste ;
- Révolutionnaires / Infiltration ;
- Gouvernement / Renseignement.

Comparaison avant / après :

- répétition des titres de missions : **88 % → 37 %** ;
- répétition immédiate : **57 % → 3 %** ;
- survie sur l'échantillon : **88 % → 96 %** ;
- missions recommandées provenant du monde vivant : **23 % avant refonte, 19 % après équilibrage final** ;
- Némésis en poursuite active : **40,7 mois → 5,3 mois** sur une fenêtre de dix ans, tout en préparant un nouveau défi dans **100 %** des scénarios de contrôle ;
- fluidité moyenne : **6,91 AVANCER/an** sur l'ensemble du stress-test.

Quelques profils après équilibrage :

- Civil / Scientifique : **43 %** de répétition, **0 %** de répétition immédiate ;
- Marine / Combattant : **38 % / 10 %** ;
- Pirates / Duelliste : **38 % / 5 %**, avec **100 %** de survie dans l'échantillon ;
- Gouvernement / Renseignement : **27 % / 2 %**, dont **43 %** de missions recommandées directement issues du monde vivant.

### QA V2.9

La release finale passe **221/221 tests** avec **0 échec** via `scripts/qa-v29.mjs`.

Les nouveaux garde-fous vérifient notamment :

- déterminisme des briefs sans consommation de RNG ;
- rotation après acceptation ;
- couverture des six factions ;
- identité de nouveauté propre aux missions adaptatives ;
- conservation simultanée d'un brief adaptatif et d'une mission du monde vivant sur le tableau compact ;
- arrêt des poursuites répétitives lorsqu'une Némésis a déjà préparé son défi ;
- reprise correcte de la poursuite après cooldown.

Le stress-test dédié est conservé dans `scripts/audit-v29.mjs` et exécuté automatiquement par le workflow **V2.9 Long Audit**.

---

# ONE PIECE LIFE — V2.8 Emergent Arcs

La V2.8 transforme la mémoire causale de V2.7 en **moteur de trajectoires persistantes**. Le jeu ne se contente plus de se souvenir qu'un événement a eu lieu : il peut maintenant utiliser ce passé pour modifier les décisions du monde, les opportunités futures et la trajectoire d'un rival ou d'un équipage.

## V2.8 — Emergent Arcs

### Arcs émergents

Les conséquences répétées liées à une même source peuvent désormais former un arc compact et sérialisable :

- Graine ;
- En cours ;
- Escalade ;
- Tournant ;
- Héritage.

Le registre actif est volontairement limité à quatre arcs. Les anciens arcs sont résolus ou expirent afin de préserver la fluidité et la lisibilité.

Les arcs peuvent être alimentés par :

- un équipage déjà affronté ;
- une rivalité ou une Némésis ;
- un conflit du monde ;
- un acteur récurrent ;
- une relation importante.

Les changements de stade remontent directement dans le rapport **AVANCER**.

### Mémoire causale réellement exploitée

La rancune d'un équipage n'est plus une valeur passive. Un équipage qui te connaît suffisamment peut désormais modifier ses intentions et commencer à te traquer.

Une Némésis reconnue influence maintenant réellement le moteur de décision du PNJ : elle peut se rapprocher de ta région, progresser et préparer une nouvelle confrontation.

Les anciennes histoires utilisent également correctement l'identité de leur protagoniste lorsqu'un écho différé revient.

### Mission & Risk Intelligence

Le tableau de missions privilégie désormais beaucoup plus fortement l'adéquation avec le personnage et la probabilité réelle de réussite.

Les missions affichent une lecture simple :

- **Sûre** ;
- **Adaptée** ;
- **Ambitieuse** ;
- **Extrême** ;
- **Signature extrême**.

Une mission rare ou narrative ne devient donc plus automatiquement « recommandée » simplement parce qu'elle est intéressante.

### Breakthroughs universels

Le dépassement du plafond naturel n'est plus réservé aux combattants.

Des exploits difficiles peuvent maintenant provoquer un breakthrough dans des domaines comme :

- Navigation ;
- Science ;
- Discrétion ;
- Commandement ;
- Réflexes ;
- Discipline ;
- autres compétences pertinentes selon l'épreuve.

Les grands breakthroughs sont également enregistrés comme moments signatures.

### Danger contextuel

Les événements dangereux hors missions ne forcent plus systématiquement un personnage non combattant à résoudre la situation par un duel.

Un personnage suffisamment compétent peut parfois éviter l'affrontement grâce à :

- Navigation ;
- Discrétion ;
- Commandement ;
- Réflexes ;
- Agilité.

La mort reste possible, mais la construction du personnage compte davantage dans la manière de survivre.

### Compatibilité

Le GameState passe en **version interne 28**. Les sauvegardes V2.7 sont migrées automatiquement avec :

- registre d'arcs actifs ;
- historique compact d'arcs ;
- souvenirs fondateurs ;
- compteurs associés.

### Mission de routine adaptative

Si une faction ne propose momentanément aucune mission à **45 % de réussite ou plus**, le moteur ajoute une mission de routine adaptée au niveau et, lorsque possible, à la spécialisation du personnage. Elle reste volontairement moins prestigieuse que les opportunités normales et ne remplace pas la mission générée par le monde vivant.

### QA V2.8

La release finale passe **214/214 tests** avec **0 échec** via `scripts/qa-v28.mjs`.

Les nouveaux garde-fous couvrent notamment :

- migration V27 → V28 idempotente ;
- arcs émergents persistants et registre actif plafonné ;
- exploitation réelle des rancunes d'équipage ;
- Némésis influençant l'IA des PNJ ;
- callbacks narratifs retrouvant le bon protagoniste ;
- breakthroughs non-combat ;
- alternatives contextuelles aux combats imposés ;
- lecture Sûre / Adaptée / Ambitieuse / Extrême ;
- présence d'une recommandation viable pour les **6 factions sur 6** dans le scénario de contrôle ;
- conservation des opportunités provenant du monde vivant ;
- remontée des transitions d'arc dans **AVANCER**.

Mesures de non-régression finales :

- fluidité adulte : **5,08 AVANCER/an** ;
- carrière active : **6,11 AVANCER/an** et **0,94 mission/an** ;
- exploration : **5,24 AVANCER/an** ;
- variété narrative : **4,3 archétypes distincts** en moyenne sur dix ans ;
- progression joueur à 25 ans : puissance moyenne **34,9** ;
- progression de 120 PNJ sur 15 ans : gain moyen **+18,4**, maximum **89,7** ;
- courbe de victoire à statistiques intermédiaires : **90 % / 57 % / 41 % / 17 %** pour des dangers 20 / 40 / 60 / 80 ;
- monde sur 30 ans : **33,6 %** de divergence moyenne, **4 guerres** et **8 équipages actifs** en moyenne.

---

# ONE PIECE LIFE — V2.7 Living Consequences

La V2.7 conserve la fluidité de V2.6 mais change une règle fondamentale : **les grands événements ne disparaissent plus une fois résolus**.

## V2.7 — Living Consequences

Le moteur possède maintenant une mémoire causale persistante et sérialisable :

- les fils narratifs terminés peuvent revenir plusieurs mois plus tard sous forme d’échos ;
- une relation se souvient d’une aide, d’un abandon ou d’une histoire mal terminée ;
- les missions contextuelles et signatures peuvent modifier les futurs plans de leur équipage, conflit ou acteur source ;
- un équipage survivant peut développer une rancune envers le joueur et adapter son intention ;
- une rivalité confirmée ou une Némésis programme sa propre réapparition ;
- les grands combats peuvent continuer à nourrir la réputation du personnage longtemps après leur résolution ;
- une seule conséquence différée est résolue par tick afin de préserver la lisibilité ;
- les conséquences visibles remontent directement dans le rapport **AVANCER** ;
- aucune nouvelle action obligatoire ni nouvel écran de micro-gestion n’est ajouté.

### Mémoire causale

Chaque sauvegarde possède maintenant une file compacte de conséquences différées et un historique des échos déjà résolus.

Une conséquence contient uniquement des données sérialisables : type, source, date prévue, poids narratif et références vers les entités existantes. Les sauvegardes restent donc simples à migrer et sûres à recharger.

### Compatibilité

Le GameState passe en **version interne 27**.

Les sauvegardes V2.6 migrent automatiquement vers la nouvelle structure de mémoire causale sans perdre leurs moments signatures, fils narratifs, relations, missions, monde ou progression.

### QA V2.7

La release V2.7 passe **202/202 scénarios fonctionnels** : les 191 garde-fous hérités de V2.6 et **11 nouveaux scénarios** dédiés à Living Consequences. La suite complète est exécutée automatiquement via `scripts/qa-v27.mjs` et GitHub Actions.

Les nouveaux garde-fous couvrent notamment :

- création native du GameState 27 ;
- migration V26 → V27 idempotente ;
- persistance et résolution d’un callback relationnel ;
- réaction future d’un équipage après une mission ;
- retour automatique d’une Némésis ;
- résolution d’une seule conséquence par tick ;
- affichage des callbacks dans le rapport AVANCER ;
- programmation automatique d’un écho après un fil narratif résolu ;
- programmation automatique d’une conséquence après une mission signature.
- réaction contextuelle d’un rival : rivalité et respect plutôt qu’un gain générique de confiance ;
- comportement cohérent d’un équipage victorieux, qui prend de l’élan au lieu de passer artificiellement en récupération.

Mesures V2.7 validées :

- enfance jusqu’à 15 ans : **36,4 AVANCER** en moyenne ;
- variété narrative adulte : **4,3 archétypes distincts** en moyenne sur dix ans ;
- fluidité adulte : **5,10 AVANCER/an** ;
- carrière active : **6,09 AVANCER/an** avec **0,92 mission/an** ;
- exploration : **5,24 AVANCER/an** ;
- progression joueur à 25 ans : puissance moyenne **34,9** ;
- progression de 120 PNJ sur 15 ans : gain moyen **+18,4**, maximum **89,7**, aucun PNJ ordinaire à 95+ ;
- monde simulé sur 30 ans : **33,6 %** de divergence moyenne et **8,0 équipages actifs** ;
- courbe de victoire à statistiques intermédiaires : **90 % / 57 % / 41 % / 17 %** pour des dangers 20 / 40 / 60 / 80.

---

# ONE PIECE LIFE — V2.6 Signature Moments

La V2.6 conserve la fluidité et le monde autonome de V2.5, mais donne davantage de poids aux événements qui doivent réellement définir une carrière.

## V2.6 — Signature Moments

Le moteur identifie maintenant les moments rares sans demander de micro-gestion supplémentaire :

- missions du monde classées par importance et marquées **Exceptionnelles** ou **Décisives** lorsque les enjeux le justifient ;
- récompenses légèrement renforcées pour les missions signatures ;
- combats majeurs et exploits improbables enregistrés comme moments signatures ;
- rivalités qui produisent des jalons uniques lorsqu'elles deviennent confirmées puis atteignent le statut de Némésis ;
- achievements remontés directement dans le rapport **AVANCER** ;
- nouveaux moments signatures affichés dans le même rapport de période ;
- registre compact et sérialisable des temps forts de la carrière ;
- migration automatique des sauvegardes V2.5 vers **GameState 26**.

Aucun nouvel écran de micro-gestion n'est ajouté.

## Héritage V2.5 — Living World Intelligence

La V2.5 conserve la fluidité de V2.4 et rend la simulation plus autonome sans ajouter de micro-gestion.

## Fun Flow hardening

La passe plaisir/fluidité ajoute un directeur de nouveauté invisible : les événements, fils narratifs et missions récemment vus sont temporairement moins prioritaires. L'écran Vie remonte maintenant les changements récents du monde dans le rapport AVANCER, l'historique des fils narratifs est réellement affiché, les combats restent automatiques mais sont racontés en trois temps, et la phase Formation avance par blocs légèrement plus longs.

## Le monde poursuit ses propres objectifs

Les acteurs majeurs possèdent désormais une **intention temporaire** :

- s'entraîner ;
- voyager ;
- étendre leur influence ;
- chercher un affrontement ;
- sécuriser leur région ;
- consolider des alliances.

Ces intentions sont de simples données persistantes. Elles sont simulées par le moteur et ne stockent aucune fonction dans les sauvegardes.

## Équipages autonomes

Les équipages émergents poursuivent également des projets :

- chercher du butin ;
- s'entraîner ;
- voyager ;
- recruter lorsque leurs effectifs deviennent trop faibles ;
- traquer une cible ;
- étendre un réseau ;
- revendiquer une zone ;
- récupérer après une mauvaise période.

Leurs actions modifient réellement puissance, moral, ressources, primes, pressions régionales et conflits.

## PNJ liés au joueur

Les relations importantes ne restent plus figées en attendant le joueur.

Un PNJ peut notamment :

- s'entraîner ;
- progresser dans sa carrière ;
- voyager ;
- s'enrichir ;
- soutenir ses proches ;
- préparer un défi ;
- transmettre son expérience.

Le projet actuel apparaît dans le réseau relationnel.

## Relations entre PNJ

Les PNJ non canoniques peuvent développer des liens entre eux lorsqu'ils évoluent dans la même région.

Ces liens sont persistants et peuvent évoluer vers :

- alliance ;
- neutralité ;
- rivalité.

Le réseau reste volontairement sparse et limité afin de ne pas alourdir les sauvegardes.

## Missions causales

Certaines missions sont désormais générées à partir du WorldState réel :

- équipage actif dans la région ;
- conflit en cours ;
- acteur hostile poursuivant une initiative locale.

La mission garde une référence de données vers sa source.

Réussir ou échouer modifie ensuite réellement cette source : moral et ressources d'un équipage, intensité d'un conflit, momentum d'un acteur, etc.

## Suppression des sauvegardes

Chaque emplacement occupé dispose maintenant d'un bouton **Supprimer**.

La suppression :

- demande une confirmation ;
- supprime la sauvegarde ;
- supprime aussi ses métadonnées associées ;
- ne touche pas aux autres emplacements.

## Compatibilité

Le GameState passe en **version interne 25**.

Les sauvegardes V2.4 migrent automatiquement et reçoivent les nouveaux champs d'intention, de réseau PNJ et d'autonomie sans perdre leur progression existante.


## QA V2.6

La release V2.6 passe **191/191 scénarios fonctionnels** avec les nouveaux garde-fous Signature Moments.

Les nouveaux garde-fous vérifient notamment :

- migration V24 → V25 des acteurs, équipages et relations ;
- intentions d'acteurs persistantes et sérialisables ;
- intentions d'équipages avec conséquences réelles ;
- projets autonomes des relations importantes ;
- liens persistants entre PNJ ;
- génération de missions à partir d'entités réellement présentes dans le WorldState ;
- conséquences d'une mission sur son équipage, conflit ou acteur source ;
- identité causale unique des conflits afin qu'une mission ancienne ne puisse jamais modifier un conflit de remplacement ;
- migration sûre des anciennes missions contextuelles V2.5 vers les identifiants uniques, avec neutralisation de la référence si le conflit d'origine n'existe plus ;
- exclusion stricte des conflits déjà résolus dans la génération de missions contextuelles ;
- maintien du tableau de missions à trois opportunités maximum ;
- suppression complète d'un emplacement de sauvegarde et de ses métadonnées sans toucher aux autres slots.
- intentions pondérées par les objectifs et l’état réel des acteurs ;
- bonus contextuels capables d'introduire une action absente du pool de base ;
- équipages en difficulté qui privilégient la récupération ;
- équipages réduits qui peuvent réellement recruter, avec coût en ressources et limite d'effectif ;
- ambitions, potentiel inexploité et ressources personnelles des PNJ qui orientent réellement leurs décisions autonomes ;
- progression de carrière des PNJ probabiliste et contextualisée, avec rangs élevés plus difficiles à atteindre ;
- anti-répétition indépendant pour événements, histoires et missions ;
- historique narratif visible ;
- changements du monde remontés dans le rapport AVANCER ;
- combats automatiques racontés en ouverture, tournant et conclusion ;
- enfance/formation compressée sans supprimer les événements structurants ;
- quatre nouveaux archétypes narratifs : mentor, menace d’équipage, famille et appel du large ;
- passage de rang de puissance transformé en événement majeur visible ;
- ouverture des fils narratifs non bloquante : AVANCER s’arrête sur la décision, pas sur le simple lancement de l’histoire ;
- migration V25 → V26 du registre de moments signatures ;
- classification automatique des missions exceptionnelles ;
- migration des missions actives vers leur niveau d’importance ;
- combats majeurs enregistrés sans clic supplémentaire ;
- jalons de rivalité non dupliqués ;
- achievements et moments signatures remontés dans le rapport AVANCER.

Mesures longues de référence :

- monde simulé sur 30 ans : **33,6 %** de divergence moyenne ;
- **8,0 équipages actifs** en moyenne après simulation longue ;
- indice des prix moyen : **102,5** ;
- progression de 120 PNJ sur 15 ans : gain moyen **+18,4**, puissance maximale **89,7**, aucun PNJ ordinaire à 95+ ;
- carrière PNJ après 15 ans : **3,3** en moyenne pour les trajectoires Ascension contre **2,1** pour Déclin ;
- enfance jusqu’à 15 ans : **36,3 AVANCER** en moyenne, contre 42,9 avant la passe Fun Flow ;
- diversité narrative adulte : **4,2 archétypes distincts** en moyenne sur dix ans ;
- fluidité adulte : **5,22 AVANCER/an** ;
- carrière active : **5,93 AVANCER/an** ;
- exploration : **5,32 AVANCER/an**.


---

# ONE PIECE LIFE — V2.4 Flow Engine

La V2.4 part d'un constat simple : V2.3 avait réduit la micro-gestion, mais le jeu demandait encore trop de clics et rendait trop de contenu invisible.

## Objectif

**Même profondeur, moins d'effort pour y accéder.**

## Temps plus fluide

AVANCER utilise désormais des fenêtres plus longues quand rien ne justifie une interruption :

- vie calme : **4 à 6 mois** ;
- carrière : **2,5 à 4,5 mois** ;
- exploration : **1,5 à 3 mois** ;
- formation : **2,5 à 4,5 mois** ;
- danger, détention et blessures restent volontairement plus fins ;
- missions et voyages avancent par blocs plus larges jusqu'à leur prochaine étape utile.

Le focus de progression n'impose plus artificiellement un rythme de 1 à 2 mois à toute vie adulte.

## Focus AUTO

Le mode **Auto** devient la manière la plus simple de progresser.

Il choisit dynamiquement entre Combat, Forme, Carrière, Pouvoirs ou Équilibre selon :

- santé et énergie ;
- ambition ;
- spécialisation ;
- expertise ;
- Haki ;
- Fruit ;
- style de combat.

Les focus manuels restent disponibles.

## Activité et focus

Les événements de progression utilisent maintenant le **focus réel** plutôt que l'activité temporaire.

Une mission, une exploration ou une routine ne fait donc plus disparaître les événements liés à la progression choisie.

## Rendu à la demande

Les écrans complexes ne construisent plus systématiquement tout leur contenu caché.

- Monde rend indépendamment **Explorer / Monde / Histoire** ;
- Progression rend indépendamment **Progresser / Pouvoirs / Détails** ;
- Carrière rend indépendamment **Profil / Carrière / Situation** ;
- Liens rend indépendamment **Proches / Réseau**.

## Relations simplifiées

Le réseau social affiche les relations prioritaires et un seul bouton **Interagir** par personne.

Les actions disponibles sont proposées ensuite dans une décision contextuelle.

Le réseau complet reste accessible.

## Feedback AVANCER

Après une période, le rapport indique les progressions principales réellement obtenues, par exemple :

**Focus Combat : Sabre +0,8 • Réflexes +0,5**

## Interface Vie

La Timeline normale est limitée aux **5 derniers événements**. L'historique étendu reste accessible.

Les compteurs détaillés des fils narratifs sont retirés de la boucle principale ; seuls les fils actifs et décisions utiles restent visibles.

## Compatibilité

Le GameState passe en **version interne 24**.

Les sauvegardes V2.3 sont migrées sans perdre statistiques, relations, histoires, monde, économie ou progression.


## QA V2.4

La release candidate passe **149/149 scénarios fonctionnels**.

Les garde-fous spécifiques à la fluidité vérifient notamment :

- focus **Auto** dynamique sans écraser le choix du joueur ;
- effet réel des cinq ambitions ;
- vie calme par fenêtres de **4 à 6 mois** ;
- carrière par fenêtres de **2,5 à 4,5 mois** ;
- simulation segmentée qui s’interrompt sur décision, événement majeur, arrivée ou fin de mission ;
- événements de progression branchés sur le focus réel ;
- feedback détaillé après AVANCER ;
- vrai lazy rendering des sous-sections Monde et Progression ;
- réseau relationnel limité à six personnes visibles avec un seul bouton contextuel par relation ;
- un seul scan d’achievements par AVANCER ;
- Timeline limitée à cinq entrées avant développement.

Mesures V2.4 de référence :

- **5,28 AVANCER/an** sur le parcours adulte simulé, sous l’objectif ≤ 5,5 ;
- **6,28 AVANCER/an** en carrière active avec environ 1 mission/an, sous l’objectif ≤ 7,5 ;
- **5,44 AVANCER/an** en exploration prolongée, sous l’objectif ≤ 7,5 ;
- **43,3 AVANCER** en moyenne pour atteindre 15 ans, contre environ 48 en V2.3 ;
- **0,66 moment notable par clic** pendant l’enfance ;
- puissance moyenne à 25 ans : **34,9** ;
- exploration après 36 mois : **60,4 %** de familiarité et **3 découvertes** en moyenne ;
- narration adulte sur dix ans : **6,7 fils commencés**, maximum **2 simultanés** ;
- monde sur trente ans : divergence moyenne **35 %**, indice des prix **103,4**, environ **8 équipages actifs**.

La fluidité progresse donc sans supprimer la profondeur ni accélérer artificiellement les simulations mensuelles internes.


---

# ONE PIECE LIFE — V2.3 Fluid Life

La V2.3 simplifie l’expérience sans supprimer les systèmes profonds développés jusqu’à V2.2.

## Philosophie

Le joueur prend moins de décisions répétitives.

Le moteur conserve les statistiques, compétences, spécialisations, styles, Haki, Fruit, carrière, monde vivant, économie, relations, justice et narration, mais il automatise davantage les calculs secondaires.

Principe de la version :

**moins de boutons, plus de décisions importantes.**

## Progression simplifiée

Les anciennes activités très détaillées sont remplacées dans l’interface par quelques priorités simples :

- **Équilibre** : travaille automatiquement les points faibles ;
- **Combat** : développe le style de combat naturel du personnage ;
- **Forme** : renforce automatiquement les qualités physiques les plus en retard ;
- **Carrière** : cible les compétences utiles à la spécialisation actuelle ;
- **Pouvoirs** : apparaît lorsque Haki/Fruit/potentiel le justifie et gère leur entraînement.

Le joueur ne choisit donc plus séparément Force, Mobilité, Condition physique, Mental, Sabre, Tir, Médecine, Science, Commandement, etc.

Ces caractéristiques existent toujours. Le moteur choisit automatiquement les bonnes cibles.

## Recommandation automatique

Le jeu propose un focus recommandé selon :

- âge ;
- santé et énergie ;
- ambition ;
- spécialisation ;
- niveau d’expertise ;
- Haki et Fruit.

La recommandation n’impose rien.

## Navigation simplifiée

Les sous-onglets sont réduits :

- Personnage : **Profil / Carrière / Situation** ;
- Progression : **Progresser / Pouvoirs / Détails** ;
- Relations : **Proches / Réseau** ;
- Monde : **Explorer / Monde / Histoire**.

Les systèmes avancés restent accessibles mais ne saturent plus l’écran principal.

## Choix contextuels

Les listes permanentes de spécialisations et d’ambitions sont remplacées par un bouton unique qui ouvre le choix uniquement lorsque le joueur veut le modifier.

## Missions plus lisibles

Le tableau affiche maintenant trois opportunités au lieu de quatre.

Elles sont triées selon :

- spécialisation ;
- chances réelles du personnage ;
- niveau de mission.

La meilleure option contextuelle est mise en avant comme recommandée.

## Compatibilité

Le GameState passe en **version interne 23**.

Les anciennes activités des sauvegardes V2.2 sont automatiquement converties vers les nouveaux focus sans supprimer les statistiques déjà acquises.


## QA V2.3

La release candidate passe **137/137 scénarios fonctionnels**.

La simplification est contrôlée explicitement :

- maximum **5 focus** de progression visibles ;
- les anciens entraînements détaillés ne sont plus exposés dans l’interface ;
- **Combat** adapte automatiquement ses cibles au style ;
- **Forme** choisit les qualités physiques les plus faibles ;
- **Carrière** adapte ses cibles à la spécialisation ;
- **Équilibre** corrige automatiquement un point faible statistique et une compétence faible ;
- **Pouvoirs** n’apparaît que lorsqu’il existe une voie de progression pertinente ;
- exploration, mission et navigation ne suppriment plus le focus choisi ;
- le tableau de missions est limité à **3 opportunités contextuelles** ;
- spécialisation et ambition n’occupent plus qu’un contrôle permanent chacune ;
- les sous-onglets passent de **17 à 11** au total sur les quatre écrans secondaires.

Mesures de stabilité :

- enfance : **30/30** vies de l’échantillon atteignent 15 ans ;
- rythme : **48 AVANCER** en moyenne jusqu’à 15 ans ;
- densité : **0,69 moment notable par clic** ;
- puissance moyenne à 25 ans : **35** ;
- connaissance d’une île après 36 mois d’exploration ciblée : **60,4 %** ;
- histoires démarrées sur dix ans adultes : **5,7** en moyenne ;
- maximum de fils narratifs simultanés : **2**.


## QA V2.3

La release candidate passe **137/137 scénarios fonctionnels**.

Les tests dédiés vérifient notamment :

- maximum cinq focus de progression visibles ;
- adaptation du focus Combat au style ;
- ciblage automatique des points faibles par Forme et Équilibre ;
- adaptation du focus Carrière à la spécialisation ;
- apparition contextuelle du focus Pouvoirs ;
- migration V22 → V23 des anciennes activités ;
- conservation du focus pendant exploration, voyage et mission ;
- trois missions contextuelles maximum ;
- une seule commande persistante pour spécialisation et ambition ;
- navigation réduite à 3/3/2/3 sous-sections ;
- stabilité du rythme de vie, du monde, de l’économie, de l’exploration et de la narration.

Sur les simulations de référence, le personnage moyen atteint environ **35 de puissance à 25 ans**, l’enfance demande environ **48 clics** jusqu’à 15 ans, et le moteur narratif reste à environ **5,7 fils démarrés sur dix ans**.

---

# ONE PIECE LIFE — V2.2 Meaningful Builds & Missions

La V2.2 répond à l’audit de simulation de V2.1 : toutes les caractéristiques étaient entraînables, mais elles n’avaient pas encore toutes une utilité comparable.

## Missions spécialisées

Les missions ne sont plus résolues automatiquement par un combat.

Chaque mission reçoit désormais un profil principal :

- Combat ;
- Navigation ;
- Médecine ;
- Science ;
- Infiltration ;
- Commandement ;
- Commerce ;
- Traque ;
- Exploration ;
- Sauvetage ;
- opération mixte.

La probabilité de réussite dépend des caractéristiques réellement pertinentes, de la spécialisation et du soutien de l’organisation.

## Qualification de carrière

Les promotions utilisent désormais une **qualification de carrière**.

Pour les spécialisations combattantes, la puissance conserve un poids important.

Pour les spécialisations comme Médecin, Scientifique, Navigateur, Marchand, Administration ou Renseignement, l’expertise métier devient la composante principale.

## Activité et carrière

L’XP de carrière dépend désormais de la cohérence entre l’activité choisie et la spécialisation.

Science devient réellement utile à un Scientifique, Médecine à un Médecin, Navigation à un Navigateur, etc.

## Styles de combat

Chaque style possède maintenant une maîtrise propre.

Un Sabreur dépend surtout de Sabre, un Tireur de Tir, un combattant Mobile de Combat + Agilité + Vitesse, et un combattant au corps-à-corps de Combat + Force + Endurance.

## Dette

Les Berry ne passent plus silencieusement en négatif.

Les dépenses non couvertes deviennent une dette explicite, avec intérêts mensuels et pression sur l’énergie. Les anciennes sauvegardes ayant un solde négatif migrent automatiquement vers ce système.

## Narration

Les fils distinguent désormais :

- abouti ;
- échoué ;
- abandonné ;
- interrompu.

Abandonner une piste ou refuser un duel ne compte donc plus comme une réussite narrative.

## Compatibilité

Le GameState passe en **version interne 22**.

Les sauvegardes V2.1 sont migrées automatiquement.

## QA V2.2

La release candidate passe **122/122 scénarios fonctionnels**.

Les contrôles V2.2 vérifient notamment :

- les 32 missions classées dans un profil de résolution valide ;
- l'influence réelle de Médecine, Science, Navigation, Discrétion, Commandement et des autres spécialisations ;
- les missions non combattantes sans victoire/défaite de combat artificielle ;
- les promotions par expertise métier ;
- la progression de carrière alignée sur l'activité ;
- la migration de dette V21 → V22 ;
- l'absence de Berry négatifs ;
- la séparation entre fils aboutis, abandonnés, échoués et interrompus ;
- l'équilibrage des cinq styles à attributs égaux ;
- la progression de Sabre/Tir pendant les combats correspondants.

Sur 200 combats simulés par style à attributs identiques contre une difficulté 50 :

- Équilibré : **44,5 %** ;
- Corps-à-corps : **44,0 %** ;
- Sabreur : **38,5 %** ;
- Tireur : **47,5 %** ;
- Mobile / esquive : **40,5 %**.

L'écart maximal tombe ainsi à **9 points**, sans rendre les styles identiques.


---

# ONE PIECE LIFE — V2.1 Complete Progression

La V2.1 corrige un angle mort du moteur de progression : certaines caractéristiques existaient dans les calculs de puissance et de combat sans disposer d’une voie d’entraînement volontaire claire.

## Progression complète

Les **8 statistiques** et les **8 compétences** affichées peuvent désormais toutes être travaillées directement.

Nouvelles activités ciblées :

- **Renforcement** : Force & Résistance ;
- **Mobilité** : Vitesse & Agilité ;
- **Condition physique** : Endurance & Réflexes ;
- **Mental** : Volonté & Discipline ;
- **Tir** : Tir & Réflexes ;
- **Commandement** : Commandement & Volonté ;
- **Discrétion** : Discrétion & Agilité ;
- **Science** : Science & Discipline.

Les activités existantes restent compatibles avec les anciennes sauvegardes : Études, Entraînement, Navigation, Sabre, Médecine et formations de faction continuent de fonctionner.

## Correctif Agilité

Agilité n’était pas bloquée par son plafond : elle n’était simplement ciblée par aucune activité d’entraînement sélectionnable. Elle intervenait pourtant déjà dans la puissance défensive et certaines actions comme l’évasion.

La V2.1 lui donne deux voies cohérentes :

- **Mobilité**, avec Vitesse ;
- **Discrétion**, comme caractéristique physique secondaire.

## Compatibilité

Le GameState passe en **version interne 21**.

Les sauvegardes V2.0 sont migrées sans modifier les valeurs existantes de statistiques, compétences, plafonds, histoires, relations ou monde.

## QA V2.1

La release candidate passe **105/105 scénarios fonctionnels**. Le banc V2.1 ajoute des contrôles garantissant :

- qu’aucune des 8 statistiques n’est orpheline ;
- qu’aucune des 8 compétences n’est orpheline ;
- que Mobilité améliore réellement Vitesse et Agilité ;
- que chaque nouvelle activité améliore toutes ses cibles déclarées ;
- que les nouvelles cartes d’entraînement sont rendues dans l’interface ;
- qu’une sauvegarde V20 migre vers V21 sans altérer la progression.

---

# ONE PIECE LIFE — V2.0 Emergent Story Engine

La V2.0 transforme les systèmes accumulés depuis les versions précédentes en **histoires persistantes**.

Le jeu ne se contente plus d’enchaîner des événements indépendants. Une situation peut désormais naître d’une relation, d’une exploration, d’une carrière, de la justice, d’une rivalité ou d’une organisation, évoluer pendant plusieurs périodes, demander une décision puis laisser une conséquence durable.

## Fils narratifs persistants

Chaque fil possède notamment :

- un identifiant permanent ;
- un type ;
- un titre ;
- un contexte ;
- un lieu et une région ;
- un éventuel participant ;
- une étape ;
- une prochaine échéance ;
- une date limite ;
- une décision éventuelle ;
- un résultat final.

Les fils sont enregistrés comme des données JSON normales.

Aucun callback JavaScript n’est stocké dans la sauvegarde.

Une partie peut donc être quittée au milieu d’un choix puis rechargée sans perdre ou casser l’histoire en cours.

## AVANCER et décisions narratives

Lorsqu’un fil atteint une étape nécessitant une décision :

- le temps s’arrête ;
- AVANCER ouvre la décision ;
- l’écran Vie affiche l’histoire concernée ;
- la partie ne peut pas sauter cette étape par accident.

Une fois le choix effectué, le fil peut continuer pendant plusieurs mois avant d’en révéler les conséquences.

## Types de fils V2.0

Le moteur initial comprend plusieurs familles.

### Promesse de jeunesse

Une relation de jeunesse peut devenir une promesse qui influence :

- confiance ;
- respect ;
- affection ;
- progression personnelle.

### Mystère local

Une connaissance suffisante d’une île peut faire émerger une piste.

Le joueur peut :

- l’abandonner ;
- enquêter.

Le résultat dépend notamment de :

- Navigation ;
- Discipline ;
- Haki de l’Observation ;
- connaissance de l’île ;
- danger local.

Quitter l’île avant la résolution peut briser définitivement le fil.

### Service à une relation

Un proche peut demander une aide concrète.

Aider peut :

- coûter des Berry ;
- augmenter confiance et loyauté ;
- créer une dette sociale persistante.

Refuser protège les ressources mais reste dans la mémoire de la relation.

### Croisée des chemins professionnelle

La carrière peut proposer une opportunité :

- prudente ;
- risquée.

Le choix plus risqué utilise réellement :

- puissance ;
- Discipline ;
- expérience de carrière ;
- difficulté de la situation.

### Pression des autorités

Un personnage recherché ou surveillé peut voir la justice devenir un fil narratif.

Il peut notamment :

- tenter de disparaître ;
- défier ouvertement les autorités.

Le résultat influence chaleur régionale, notoriété, réputation et éventuellement prime.

### Rivalité

Un rival peut provoquer une confrontation narrative.

Accepter ou reporter le duel influence :

- rivalité ;
- respect ;
- historique des confrontations ;
- victoire ou défaite du personnage.

### Crise d’organisation

Un équipage, une unité ou un groupe dont les ressources ou le moral se dégradent peut produire une crise.

Le joueur peut :

- financer la solution ;
- tenter de rallier le groupe avec son Commandement.

## Directeur narratif

Le moteur n’impose pas artificiellement une histoire toutes les quelques secondes.

Une nouvelle intrigue dépend :

- de l’âge ;
- des relations présentes ;
- de la carrière ;
- de l’activité ;
- de la connaissance locale ;
- de la justice ;
- des rivalités ;
- de l’état de l’organisation ;
- des fils déjà actifs.

Maximum : **2 fils actifs simultanément**.

Aucun nouveau fil n’est créé pendant :

- une traversée ;
- une mission ;
- une détention.

Le moteur garde ainsi les histoires lisibles au lieu de transformer la vie du personnage en boîte de réception professionnelle.

## Échéances

Chaque intrigue possède une fenêtre temporelle.

Si le personnage ignore trop longtemps une situation :

- elle peut échouer ;
- disparaître ;
- rester dans l’historique comme occasion manquée.

Les choix ont donc un poids temporel réel.

## Mort et héritage

La mort interrompt automatiquement les fils encore actifs.

Ils sont archivés comme histoires inachevées.

Lorsqu’un héritier reprend la partie :

- aucun fil actif du parent ne lui est artificiellement transféré ;
- les derniers fils résolus restent dans la mémoire narrative de la dynastie.

Le nouveau personnage construit ensuite ses propres histoires.

## Interface Vie

L’écran Vie possède maintenant un panneau **Fils narratifs**.

Il affiche :

- nombre de fils démarrés ;
- résolus ;
- échoués ;
- décisions prises ;
- histoires actuellement actives ;
- prochaine échéance ;
- participant éventuel ;
- derniers fils terminés.

Une histoire en attente de décision apparaît également dans la carte d’attention centrale.

## Achievements V2.0

Trois nouveaux succès :

- **Un fil se noue** : résoudre une première histoire ;
- **Une vie pleine d’histoires** : résoudre dix fils ;
- **À la croisée des chemins** : prendre quinze décisions narratives.

## QA V2.0

Le banc professionnel passe à **98 scénarios fonctionnels**.

La release candidate valide notamment :

- sérialisation JSON des fils sans callbacks ;
- reprise d’une décision après sauvegarde et rechargement ;
- blocage correct d’AVANCER pendant un choix ;
- résolution unique sans duplication d’historique ;
- conséquences sociales ;
- conséquences professionnelles ;
- conséquences judiciaires ;
- rupture d’un mystère lors d’un départ en mer ;
- interruption correcte à la mort ;
- migration V19 → V20 ;
- maximum de deux fils actifs ;
- interface narrative.

### Mesures de simulation

Sur vingt vies simulées pendant dix années adultes :

- fils démarrés en moyenne : **5,4** ;
- fils résolus : **3,2** ;
- fils échoués : **1,9** ;
- décisions narratives : **5,3** ;
- maximum simultané observé : **2**.

La boucle d’enfance reste également stable :

- 28 vies sur 30 atteignent 15 ans dans l’échantillon ;
- environ **48,4 AVANCER** pour atteindre 15 ans ;
- densité moyenne : **0,67 moment notable par clic** ;
- maximum de deux périodes réellement calmes consécutives.

## Sauvegardes

Les sauvegardes V1.9 sont migrées automatiquement vers la **version interne 20**.

---

# ONE PIECE LIFE — V1.9 Exploration & Discovery

La V1.9 transforme le déplacement en **aventure**. Les îles ne sont plus seulement des noms reliés par des routes : chacune possède une identité, un niveau de connaissance, des découvertes, des rumeurs et une progression d’exploration persistante.

## Connaissance locale

Chaque île possède désormais un niveau de connaissance personnel :

- Inconnue ;
- Reconnue ;
- Connue ;
- Bien connue ;
- Maîtrisée.

Le personnage ne gagne cette connaissance qu’en réellement explorant la zone.

La familiarité dépend notamment de :

- Navigation ;
- Discipline ;
- Haki de l’Observation ;
- durée consacrée à l’exploration.

Les progrès ralentissent naturellement lorsqu’une île devient déjà très bien connue.

## Identité des îles

Les grandes îles possèdent maintenant une identité particulière.

Exemples :

- Water 7 : chantiers navals, canaux, commerce ;
- Wano : samouraïs, Kairouseki, territoire fermé ;
- Egghead : science et technologie ;
- Little Garden : faune préhistorique ;
- Alabasta : désert, royaume et ruines ;
- Sabaody : mangroves, sous-monde et carrefour mondial.

Les autres lieux héritent d’un profil régional cohérent.

## Découvertes

L’exploration peut révéler plusieurs catégories :

- lieux remarquables ;
- indices historiques ;
- ressources ;
- contacts ;
- secrets.

Les découvertes sont persistantes et entrent dans le Codex.

Un même élément ne peut pas être découvert deux fois.

Les secrets les plus rares exigent une connaissance très élevée de la zone.

## Rumeurs

Les rumeurs utilisent l’état actuel du monde.

Elles peuvent concerner :

- conflit local ;
- personnage canonique présent dans la région ;
- équipage actif ;
- pénurie économique ;
- route maritime voisine.

Une rumeur n’est donc pas simplement un texte décoratif choisi au hasard : elle découle du WorldState au moment où elle est entendue.

## Exploration et AVANCER

Choisir **Explorer cette île** définit Explorer comme activité principale.

AVANCER peut alors :

- augmenter la connaissance locale ;
- révéler une découverte ;
- faire entendre une nouvelle rumeur ;
- produire une petite trouvaille ;
- améliorer Navigation et Réflexes via l’activité normale.

L’exploration autonome est bloquée avant 6 ans afin de préserver la cohérence de l’enfance.

## Traversées maritimes

Une traversée possède désormais une condition de mer propre :

- Mer calme ;
- Courants portants ;
- Mer agitée ;
- Brouillard dense ;
- Tempête.

Cette condition modifie réellement :

- durée estimée ;
- risque d’incident.

Les navires, leur état et la cargaison continuent également d’influencer le voyage.

## Incidents en mer

Une traversée peut maintenant produire autre chose qu’un combat générique :

- lecture favorable des courants ;
- conditions météorologiques difficiles ;
- consommation ou perte de provisions ;
- rencontre maritime ;
- découverte utile sur la route.

Le journal de traversée conserve les derniers événements.

## Arrivée sur une île

Arriver dans un nouveau lieu :

- enregistre la visite ;
- enrichit le Codex ;
- donne une première connaissance locale ;
- peut immédiatement révéler une découverte si le seuil approprié est franchi ;
- lance toujours les éventuels contrôles de contrebande.

## Codex enrichi

Le Codex affiche maintenant notamment :

- îles connues ;
- îles maîtrisées ;
- découvertes ;
- trésors ;
- dernières découvertes avec leur lieu et leur type.

Le Codex devient donc une vraie mémoire de la vie du personnage, et non plus une simple collection de noms.

## Achievements V1.9

Trois nouveaux achievements :

- **Grand voyageur** : visiter dix lieux ;
- **Œil d’explorateur** : enregistrer dix découvertes ;
- **Je connais ces mers** : maîtriser trois îles.

## QA V1.9

Le banc professionnel passe à **84 scénarios fonctionnels**.

Mesures de la release candidate :

- familiarité moyenne après 36 mois d’exploration ciblée : **60,4 %** ;
- découvertes moyennes sur cette période : **3** ;
- aucune duplication de découverte ;
- rumeurs limitées et persistantes ;
- conditions maritimes toujours bornées ;
- arrivée, Codex et migration V18 → V19 validés ;
- tous les systèmes précédents de progression, combat, économie, PNJ, guerre et AVANCER restent couverts.

## Sauvegardes

Les sauvegardes V1.8 sont migrées automatiquement vers la **version interne 19**.

---

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
