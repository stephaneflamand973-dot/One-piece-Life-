# One Piece Life · Feuille de route

**Objectif :** faire de One Piece Life un jeu de simulation de vie digne des références du genre : BitLife pour la vie entière, Les Sims pour la vie quotidienne, RimWorld et Dwarf Fortress pour le monde qui vit seul, Crusader Kings pour les dynasties et la politique.

**Version de départ :** 7.1 (5 novembre 2026). Jeu en ligne : https://stephaneflamand973-dot.github.io/One-piece-Life-/jeu/

**Statuts :** ✅ fait · 🔨 en cours · ⏳ à faire

---

## Règles qui ne changent jamais

Chaque étape doit les respecter. Un test automatique vérifie chacune d'elles.

1. **Gains fixes** : une activité réussie rapporte toujours exactement son gain prévu. La fatigue ou les conditions décident si elle a lieu, jamais du montant (D.2A). Exception décidée le 6 novembre 2026 : un talent choisi à la création peut fixer un gain plus grand, toujours fixe (D.2A-B).
2. **Missions binaires** : réussite ou échec, sans entre-deux ; récompense mise de côté avant l'engagement et versée automatiquement (L.3A, L.4A).
3. **Guérison automatique** pendant le temps simulé ; des séquelles durables restent possibles (K.2A).
4. **Fabrication et réparation instantanées** si les ressources sont réellement là ; échec immédiat sinon (I.5A).
5. **Monde figé quand l'app est fermée** : aucun rattrapage au retour (01.6A).
6. **Argent jamais créé de nulle part** : chaque Berry vient de quelqu'un ou de l'extérieur, et c'est comptabilisé.
7. **Le moteur décide des faits.** L'IA, si elle est activée, interprète les phrases et raconte, sans jamais décider d'un résultat.
8. **Fidélité au canon** : aucun personnage canonique ne fait ce qu'il n'aurait pas pu faire à l'époque jouée. Les personnages et objets inventés sont signalés comme tels.
9. **Sauvegardes** : automatiques, vérifiées, avec une copie de secours, et compatibles avec les anciennes versions.

---

## Ce qui est déjà fait

| Domaine | Contenu |
|---|---|
| ✅ Vie | Naissance à Fuchsia, enfance, vieillissement, mort, succession avec un enfant (sans transmission de compétences) |
| ✅ Monde | East Blue (4 îles), Grand Line (4 îles), Nouveau Monde (3 îles), Reverse Mountain, Calm Belt, Log Pose |
| ✅ Carrières | Pêche, cuisine, charpenterie navale, docks, Marine (7 grades), piraterie (équipage, abordages, prime) |
| ✅ Pouvoirs | 4 Fruits du Démon inventés, Haki de l'observation, de l'armement et des Rois |
| ✅ Dangers | Combats, blessures, prison, naufrages, Colisée |
| ✅ Relations | Amitié, mémoire des habitants, amour avec consentement, mariage, enfants |
| ✅ Technique | App installable sur l'iPhone, hors ligne, mises à jour automatiques, IA Gemini facultative, 215 tests |

---

## Bilan du 6 novembre 2026 (versions 8 à 14)

Les 7 étapes ont reçu une première version jouable, testée et mise en ligne. Plusieurs critères de réussite ne sont **pas encore atteints** ; ils sont listés ici pour la suite.

| Étape | Fait | Critère | Reste à faire |
|---|---|---|---|
| 1. Monde vivant | Mort, couples, naissances, successions de métiers, arrivées et départs, rivaux, officiers, nouvelles à délai | ✅ Plus de 30 % des habitants changent en 50 ans (test) ; ✅ personnages canoniques protégés ; ✅ une semaine se calcule en moins d'une seconde | — |
| 2. Événements | 101 événements (dont factions et canon), chaînes, rêves, missions de livraison, chasse et sauvetage ; un événement ordinaire revient au plus deux fois par vie | ✅ 100 événements atteints ; ❌ la répétition d'une vie à l'autre reste élevée (85 % mesurés, 20 % visés) | Viser 300 événements, varier les textes |
| 3. Chronologie | 4 époques, 6 événements datés, présence canonique de Luffy, Shanks, Makino, du maire, 1 divergence jouable | ⚠️ Pas encore vérifié sur 20 parties par un humain | Plus d'événements canoniques, plus de divergences |
| 4. Factions | Réputation × 5, chasseur de primes, révolutionnaire, Grand Corsaire, Empereur, alliances, trahisons, guerres | ⚠️ Carrières de 20 ans pas encore jouées en entier par un humain | Agent du Gouvernement, territoires, Amiraux |
| 5. Vie profonde | Traits, humeur, école, navigation, musique, médecine, maladies de l'âge | ✅ Deux vies identiques divergent selon les choix (test) | Plus d'options liées aux traits |
| 6. Rejouabilité | 5 îles de naissance, humain ou homme-poisson, 3 départs imposés, 24 succès, mémorial | ⚠️ Peuples mink et géant absents | Autres peuples, défis supplémentaires |
| 7. Présentation | Illustrations dessinées en code, tutoriel, animations, sons synthétisés, taille du texte, contraste | ⚠️ Pas de vrais portraits ni de musique ; vibrations impossibles dans Safari sur iPhone | Images libres de droits ou fournies, musique |
| Qualité | Simulateur avec objectifs (Marine, pirate, chasseur, vie paisible, hasard), 10 fois plus rapide ; 239 tests. Il a trouvé une perte d'argent, un plantage, des primes et des gains trop élevés : corrigés | ⚠️ Séries de 25 vies sans erreur ni argent créé ; 1 000 vies pas encore lancées (environ 2 h) | Simuler 1 000 vies, apprendre au simulateur à fonder une famille |

---

## Étape 1 · Un monde qui vit seul ✅ (première version)

**But :** le monde change même quand tu ne fais rien. Après 50 ans de partie, le village doit être transformé sans que tu y sois pour rien.

| Livrable | Détail |
|---|---|
| Habitants mortels | Chaque habitant a un âge, vieillit, peut tomber malade et meurt. Ses biens passent à ses proches |
| Vie privée des habitants | Les habitants se lient d'amitié, se mettent en couple, se marient et ont des enfants entre eux |
| Renouvellement | De nouveaux habitants naissent ou arrivent ; certains partent vivre ailleurs |
| Métiers transmis | Quand Tomas meurt, son apprenti ou son enfant reprend l'atelier, ou l'atelier ferme |
| Rivaux autonomes | Des équipages pirates et des officiers de la Marine inventés vivent leur carrière : primes, promotions, captures, morts |
| Rumeurs | Les nouvelles circulent d'île en île avec un délai. Tu n'apprends un événement lointain que si quelqu'un te le raconte |
| Simulation légère | Les habitants des îles lointaines sont simulés de façon résumée, pour garder le jeu fluide sur l'iPhone |

**Critères de réussite :**
- Simuler 50 ans sans le joueur modifie au moins 30 % des habitants : décès, naissances, couples, départs.
- Aucun habitant ne connaît un fait qu'il n'a pas pu apprendre.
- Une semaine d'ellipse se calcule en moins d'une seconde sur l'iPhone 15.

---

## Étape 2 · Des événements et des choix ✅ (première version)

**But :** chaque partie est faite de moments marquants, de dilemmes et de conséquences qui durent.

| Livrable | Détail |
|---|---|
| Moteur d'événements | Chaque événement a des conditions (âge, lieu, réputation, relations, passé, saison), puis 2 à 4 choix, puis des conséquences enregistrées |
| Bibliothèque | 300 événements à terme, en commençant par 100 : enfance, adolescence, travail, mer, amour, famille, vieillesse, crimes, catastrophes |
| Chaînes | Des événements en plusieurs épisodes, qui reviennent des années plus tard (une dette, une vengeance, une promesse) |
| Missions variées | Escorte, livraison, sauvetage, enquête, capture, défense de village, toutes avec une condition de réussite fixée à l'avance |
| Ambitions | Des rêves choisis ou nés de la vie (devenir Amiral, trouver le One Piece, ouvrir un restaurant), qui orientent les propositions |
| Mémoire des choix | Les habitants se souviennent de ce que tu as fait et y réagissent |

**Critères de réussite :**
- Sur 10 vies simulées, moins de 20 % des événements se répètent d'une vie à l'autre.
- Chaque choix a au moins une conséquence visible plus tard.
- Aucun événement ne crée d'argent ni de compétence en dehors des règles.

---

## Étape 3 · La chronologie du canon et l'époque au choix ✅ (première version)

**But :** vivre à l'époque de son choix dans un monde fidèle au canon, qui peut ensuite diverger.

| Livrable | Détail |
|---|---|
| Choix de l'époque | Âge d'or de Roger, exécution de Roger, années avant le départ de Luffy, ère de Luffy |
| Calendrier canonique | Les grands événements datés (par exemple l'exécution de Roger à Loguetown) arrivent à leur date, sauf si tes actions les rendent impossibles |
| Personnages canoniques | Leur présence suit l'époque : ils apparaissent, partent et vieillissent selon le canon, tant que tu n'interviens pas |
| Divergences | Si tu changes un événement, ses suites changent de façon logique ; le futur canonique n'est plus garanti |
| Vérification | Une fiche par personnage canonique (époque, lieu, rôle) pour éviter les erreurs |

**Critères de réussite :**
- Aucune erreur de canon relevée sur 20 parties testées.
- Une divergence produit au moins trois conséquences cohérentes dans les années suivantes.

---

## Étape 4 · Les factions et la politique ✅ (première version)

**But :** chaque grande puissance du monde de One Piece est jouable et réagit à tes actes.

| Livrable | Détail |
|---|---|
| Factions | Gouvernement mondial, Marine, Révolutionnaires, Grands Corsaires, Empereurs, chasseurs de primes, royaumes |
| Réputation par faction | Chaque faction a son opinion de toi, qui change selon tes actes et selon ce qu'elle en apprend |
| Carrières complètes | Chasseur de primes, révolutionnaire, Grand Corsaire, agent secret : chacune avec ses grades, ses missions et ses risques |
| Alliances et trahisons | Pactes entre équipages, protection d'un Empereur, territoires, tributs |
| Guerres | Affrontements entre factions à grande échelle, auxquels tu peux participer ou non |

**Critères de réussite :**
- Chaque faction propose une carrière jouable de 20 ans.
- Une trahison a des conséquences durables sur plusieurs factions.

---

## Étape 5 · Une vie profonde ✅ (première version)

**But :** le personnage a une vie intérieure, et deux vies qui partent du même point divergent vraiment.

| Livrable | Détail |
|---|---|
| Personnalité | Des traits (courage, ruse, bonté, ambition…) qui évoluent selon les choix et ouvrent ou ferment des options |
| Humeur | Joie, peur, colère, deuil : elles influencent ce qui est proposé, sans bloquer le joueur |
| Éducation | École, apprentissage, maîtres ; les connaissances débloquent des métiers |
| Santé au fil de l'âge | Maladies, vieillesse, médecins, séquelles ; guérison automatique respectée |
| Talents | Cuisine, navigation, médecine, musique, cartographie, chacun avec ses usages |

**Critère de réussite :** deux personnages identiques à la naissance sont nettement différents à 20 ans selon leurs choix.

---

## Étape 6 · La rejouabilité ✅ (première version)

**But :** donner envie de recommencer encore et encore.

| Livrable | Détail |
|---|---|
| Origines | Naître sur différentes îles des quatre mers |
| Peuples | Humain, homme-poisson, sirène, mink, géant, chacun avec ses forces, ses limites et ses préjugés |
| Succès | Des objectifs à débloquer (survivre à Reverse Mountain, atteindre une prime d'un milliard…) |
| Mémorial | L'historique de toutes tes vies et de ta dynastie |
| Défis | Départs imposés (orphelin, esclave évadé, enfant de pirate recherché) |

**Critère de réussite :** dix vies de suite restent différentes et intéressantes.

---

## Étape 7 · La présentation ✅ (première version)

**But :** un jeu agréable à regarder, à écouter et à prendre en main.

| Livrable | Détail |
|---|---|
| Tutoriel | Les premières minutes guident le joueur sans le noyer |
| Illustrations | Une image par lieu et un portrait par habitant, libres de droits ou fournis par toi, jamais copiés de One Piece |
| Animations | Transitions, ellipses animées, combats rythmés |
| Sons | Musique d'ambiance par mer, bruitages, réglables |
| Vibrations | Retours tactiles sur l'iPhone lors des moments forts |
| Accessibilité | Taille du texte, contraste, lecture par VoiceOver |

**Critère de réussite :** un nouveau joueur comprend le jeu en 2 minutes, sans aide.

**Limite :** je peux écrire le code et les textes, mais je ne peux pas produire des illustrations professionnelles ni une bande-son. Il faudra des ressources libres de droits ou fournies par toi.

---

## En continu · La qualité 🔨

**But :** un jeu équilibré, stable et fiable, à chaque étape.

| Livrable | Détail |
|---|---|
| Simulateur de vies | Des milliers de vies jouées automatiquement pour repérer les déséquilibres, les impasses et les stratégies qui cassent le jeu |
| Tableau d'équilibrage | Âge moyen de mort, richesse, primes, taux de naufrage, carrières choisies |
| Tests de règles | Un test pour chaque nouvelle règle, et toujours les neuf règles fixes |
| Performance | Mesures sur l'iPhone 15 : temps de réponse, mémoire, batterie |
| Sauvegardes | Conversion automatique de toutes les anciennes versions, à chaque mise à jour |

**Critères de réussite :**
- Aucune impasse sur 1 000 vies simulées.
- Aucune stratégie unique qui domine toutes les autres.
- Aucun test en échec avant une mise en ligne.

---

## Ordre de réalisation

1. **Étape 1 · Un monde qui vit seul** : c'est le socle des autres étapes.
2. **Étape 2 · Des événements et des choix** : c'est ce qui rend chaque partie captivante.
3. **La qualité**, en continu, en commençant par le simulateur de vies.
4. **Étape 3 · La chronologie du canon**, puis **étape 4 · Les factions**.
5. **Étape 5 · Une vie profonde**, puis **étape 6 · La rejouabilité**.
6. **Étape 7 · La présentation**, sur un contenu devenu stable.

Chaque étape se fait en plusieurs mises à jour. Chacune est testée, puis mise en ligne seulement si tous les tests passent.

---

## Bilan du 12 novembre 2026 (versions 20 à 24)

| Chantier | Fait | Reste |
|---|---|---|
| Vie à terre | Titres de métier, maisons, commerces, consultations, leçons aux enfants | Plus de métiers, artisanat |
| Événements | 208 événements | Viser 300, mesurer la répétition |
| Marine | 12 grades jusqu'à Amiral, 3 affectations, navire de guerre, traque | Postes du Nouveau Monde, missions variées |
| Combats | Manche par manche pour 5 situations (voyou, Colisée, duel, traque, chasse) | Abordages et combats de la Marine encore instantanés |
| Fin du Nouveau Monde | Zou, Whole Cake Island, Egghead, Elbaf, 4 Ponéglyphes, Laugh Tale | Empereurs canoniques jouables, plus de contenu par île |
| Peuples et fruits | Mink, géant, 8 fruits inventés | Autres peuples |

Le quatrième Ponéglyphe de route est placé dans une épave près d'Egghead : c'est une invention du jeu, son emplacement canonique étant inconnu. Le contenu de Laugh Tale n'est pas décrit.
