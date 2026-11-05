# Palier 1 · Tranche verticale (liste fermée) et fiches de critères

Document de conception, **sans code**. Les valeurs chiffrées des cas sont des **données de test** (fixtures), pas un équilibrage du jeu final.

---

## 1. Cadre de la tranche

| Élément | Choix | Raison |
|---|---|---|
| Lieu | **Village de Fuchsia (Foosha), île de Dawn, East Blue** : village, port, bar Partys, colline | Petite échelle, faible danger, canon bien établi, contient travail, missions et voisinage |
| Époque | Après le départ de Shanks, avant celui de Luffy | Monde stable (C.9A) ; aucun grand événement canonique imposé dans la fenêtre courte |
| PNJ canoniques | **Makino** (tient le bar Partys), **Woop Slap** (maire) | Rôles canoniques simples et stables |
| Exclus volontairement | Luffy, Garp, Dadan, Ace, Sabo | Limiter le risque d'erreur canonique et de divergence majeure dans un jalon de test |
| PNJ originaux | Un charpentier, un pêcheur, un marchand ambulant, un voyou de passage | C.2D/C.8D : population vivante ; le rôle est fixé, pas l'issue |
| Protagoniste | Villageois de 16 ans, état initial fourni par fixture | La tranche teste des mécaniques ; B.1A (naissance) sera éprouvé en itération |
| Second monde | Un monde indépendant minimal | Requis pour l'isolation (N.5D) |

**À vérifier avant réalisation :** les rôles canoniques de Makino et du maire, et la cohérence de l'époque. Je ne fixe aucun fait canonique supplémentaire.

## 2. Liste fermée des cas (26)

Légende des scénarios S.2D : **1** actions libres et PNJ · **2** missions et économie · **3** progression, combat, santé, fabrication · **4** temps, ellipses et monde autonome · **5** sauvegardes, arrêt et continuité.

| ID | Sc. | Règles | Situation et action | Attendu | Interdit |
|---|---|---|---|---|---|
| T01 | 1 | O.2D, A.3B+D | « Je salue Makino, je lui demande s'il y a du travail au port et, si oui, j'y vais. » | Les trois intentions sont reconnues ; le déplacement n'a lieu que si la condition est vraie selon l'état | Créer un emploi inexistant ; ignorer la condition |
| T02 | 1 | O.2D | Intention ambiguë (« je m'en occupe ») sans référent clair | Une seule question de clarification ciblée | Action arbitraire |
| T03 | 1 | C.5D, O.4D | Interroger le charpentier sur un fait qu'il n'a pas pu apprendre | Le PNJ l'ignore ou suppose, en le disant | Omniscience |
| T04 | 1 | F, N.6D | Après reprise, revenir voir Makino ; demander au pêcheur (absent) la même chose | Makino se souvient de l'échange ; le pêcheur non | Mémoire partagée par tous |
| T05 | 2 | L.2D, Q-R1 | Le maire propose de réparer le toit de la remise sous 3 jours | Condition de réussite et de clôture binaires fixées **avant** l'acceptation | Mission acceptée avec un critère flou |
| T06 | 2 | Q-R2 | Le pêcheur promet « je te paierai peut-être » sans fonds | Promesse informelle, signalée comme non garantie | La traiter comme mission formelle rémunérée |
| T07 | 2 | Q-R2, L.4A | Pendant l'engagement, le maire tente de dépenser les 500 Berrys réservés | Refus : fonds sous séquestre | Dépense ou disparition des fonds |
| T08 | 2 | L.3A, L.4A | Toit réparé dans le délai | Réussite automatique ; transfert de 500 Berrys ; masse monétaire totale inchangée | Réussite partielle ; argent créé |
| T09 | 2 | L.3A | Variante : délai dépassé | Échec binaire ; séquestre libéré au maire | Réussite partielle ; réécriture de l'accord |
| T10 | 3 | I.5A, Q-R5 | Réparer avec planches et clous réellement en stock | Réparation instantanée ; ressources consommées | Délai fictif ; ressources non consommées |
| T11 | 3 | I.5A, Q-R4/5 | Même ordre sans clous | Échec immédiat ; rien n'est créé ni consommé | Clous inventés ; attente fictive |
| T12 | 3 | **D.2A**, Q-R3 | Entraînement physique répété 5 fois, état valide | Chaque fois **exactement** le gain fixe de la fixture | Gain dégressif, bonus, multiplicateur |
| T13 | 3 | D.2A, Q-R3, D.5D | 6ᵉ entraînement au-delà du seuil de fatigue de la fixture | Activité non accomplie ou inaccessible, gain nul et expliqué | Gain réduit (+0,5…) |
| T14 | 3 | E.4D, D.2A | Bagarre avec le voyou de passage | Blessure aiguë persistante ; pas d'XP automatique pour avoir combattu | Blessure oubliée ; XP de combat |
| T15 | 4 | K.2A, Q-R4, 01.2B | « Je me repose une semaine » | Guérison automatique pendant le temps simulé, sans microgestion | Guérison instantanée sans temps ; soins obligatoires |
| T16 | 3/4 | K.2A, Q-R4 | Blessure grave (fixture) puis guérison | L'état aigu guérit ; la séquelle durable reste | Restitution magique |
| T17 | 4 | 01.3C, A.6D | Un navire arrive au port pendant l'ellipse (événement planifié par le monde) | L'ellipse est interrompue ; le joueur décide | Événement important sauté |
| T18 | 4 | C.2D, O.4D, O.5D, C.5D | Pendant l'ellipse, le marchand suit son objectif et quitte le village | Ordre causal respecté ; le protagoniste ne l'apprend que si l'information lui parvient | Monde figé pendant le jeu ; fait connu sans source |
| T19 | 5 | N.2D, P.5D | Quitter puis reprendre | État identique (empreinte des états égale) | Écart d'état |
| T20 | 5 | **01.6A** | Session fermée plusieurs heures réelles | Aucun temps simulé écoulé, aucun PNJ n'a agi, rien n'a guéri | Rattrapage au retour |
| T21 | 5 | N.3D | Recharger une copie antérieure à la récompense de T08 | Pas de récompense en double ni de ressource dupliquée | Duplication |
| T22 | 5 | N.3D, P.5D | Sauvegarde courante corrompue (injection de test) | Récupération d'une copie valide, signalée au joueur | Réécriture silencieuse ; perte non signalée |
| T23 | 5 | N.5D | Action dans le monde 1 | Le monde 2 est inchangé et reste figé | Fuite d'état entre mondes |
| T24 | 1–5 | O.6D, Q-R6 | Le narrateur produit un fait non établi (injection de test) | Bloqué avant affichage ; le conflit est journalisé | Fait inventé affiché |
| T25 | 5 | B.7D, I.6D | Décès du protagoniste (fixture), continuation par un proche | Patrimoine transmis selon le contexte ; **aucune** compétence transmise automatiquement | Héritage de compétences |
| T26 | 1–5 | **P.2A** | Rejouer T01 à T25 réseau coupé | Tout fonctionne | Tout appel distant |

> La liste compte 26 cas. Elle est **fermée** : tout ajout ou retrait est un arbitrage explicite.

### Interactions entre scénarios couvertes

- Mission → récompense → ressource → fabrication (T05 → T08 → T10).
- Combat → blessure → ellipse → guérison → séquelle (T14 → T15 → T16).
- Ellipse → monde autonome → interruption (T15 → T17 → T18).
- Récompense → sauvegarde → rechargement sans duplication (T08 → T21).
- Mémoire PNJ → reprise de session (T04 → T19).

## 3. Fiches de critères

### 3.1 Critères fonctionnels (seuils fixés maintenant, indépendants de la machine)

| Code | Critère | Type | Seuil |
|---|---|---|---|
| F1 | Violations des invariants L.3A, L.4A, D.2A, K.2A, I.5A, P.2A, 01.6A | Obligatoire | **0** sur toutes les exécutions |
| F2 | Résultats « interdits » observés dans T01–T26 | Obligatoire | **0** |
| F3 | Moteur déterministe : cas sans IA rejoués 10 fois | Obligatoire | **10/10** identiques |
| F4 | Cas dépendants de l'IA (T01–T04, T24) rejoués 10 fois chacun | Obligatoire | **≥ 9/10** corrects ; tout échec doit être sûr (clarification ou refus), sans aucun fait faux |
| F5 | Fait inventé affiché au joueur | Obligatoire | **0** |
| F6 | Intégrité : sauvegarde, reprise, corruption (T19–T23) | Obligatoire | **100 %** des cas |
| F7 | Non-régression : tout cas passé reste passé au jalon suivant | Obligatoire | **100 %** |
| F8 | Fidélité narrative jugée par le user (ton One Piece, clarté) | Informatif | Grille 1–5, notée au bilan |

### 3.2 Critères de performance (seuils à fixer après le relevé de l'iPhone, avant tout test)

| Code | Mesure | Type prévu |
|---|---|---|
| P1 | Latence entre la saisie libre et le début de la réponse | Obligatoire |
| P2 | Latence de la réponse narrative complète | Obligatoire |
| P3 | Durée de calcul d'une ellipse d'une semaine | Obligatoire |
| P4 | Mémoire vive maximale pendant la tranche | Obligatoire |
| P5 | Stockage (modèles et sauvegardes) | Obligatoire |
| P6 | Stabilité : session continue sans plantage | Obligatoire |
| P7 | Échauffement de l'iPhone | Obligatoire |
| P9 | Consommation de batterie pendant la tranche | Obligatoire |
| P8 | Durée de sauvegarde et de reprise | Obligatoire |

Règle S.8 : une fois ces seuils fixés, on ne les abaisse jamais après avoir lu des résultats.

### 3.3 Statuts de validation

Réussi selon preuve · échoué · non testé · bloqué · en attente d'arbitrage. Un critère obligatoire qui n'est pas « réussi » bloque le jalon.

## 4. Relevé de l'iPhone (à fournir par le user)

Dans **Réglages → Général → Informations**, relever les éléments ci-dessous. La mémoire vive n'y est pas affichée : elle se déduit du modèle exact.

Ce relevé décrit l'appareil ; ce n'est pas un test. Il ne prouve aucune capacité.

| Élément | Valeur |
|---|---|
| Nom du modèle (ex. « iPhone 15 Pro ») | *à relever* |
| Version d'iOS | *à relever* |
| Capacité de stockage | *à relever* |
| Espace disponible | *à relever* |
| Apple Intelligence disponible et activé (Réglages → Apple Intelligence et Siri) | *à relever* |

## 5. Bilan du palier 1

| Livrable | Statut |
|---|---|
| Liste fermée de la tranche | Rédigée, en attente de ta relecture |
| Critères fonctionnels et seuils | Rédigés |
| Seuils de performance | En attente du relevé de l'iPhone |
| Relevé de l'iPhone | En attente |
