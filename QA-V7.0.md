# ONE PIECE LIFE — QA V7.0

V7.0.0 — Ultimate Canon Expansion

## Objectif

La V7.0 transforme le canon en système vivant.

Le contenu canonique n'est plus limité à quelques noms et événements décoratifs. Il influence désormais :

- rencontres ;
- relations ;
- mentorat potentiel ;
- rivalités ;
- danger régional ;
- missions ;
- équipages présents ;
- Fruits ;
- chronologie ;
- Causal World.

## Contenu V7.0

### Personnages canoniques
Le moteur contient désormais **58 personnages canoniques**.

Les ajouts incluent notamment :
- Koby ;
- Helmeppo ;
- Hina ;
- Fujitora ;
- Ryokugyu ;
- Marshall D. Teach ;
- Marco ;
- Zoro ;
- Nami ;
- Usopp ;
- Sanji ;
- Chopper ;
- Franky ;
- Brook ;
- Jinbe ;
- Boa Hancock ;
- Katakuri ;
- King ;
- Queen ;
- Yamato ;
- Moria ;
- Perona ;
- Kaku ;
- Stussy ;
- Koala ;
- Karasu ;
- Belo Betty ;
- Morley ;
- Bonney ;
- Bege ;
- Bartolomeo ;
- Cavendish.

### Équipages et groupes
**12 groupes canoniques** :
- Équipage du Roux ;
- Équipage de Barbe Blanche ;
- Équipage aux Cent Bêtes ;
- Équipage de Big Mom ;
- Équipage du Chapeau de Paille ;
- Équipage de Barbe Noire ;
- Heart Pirates ;
- Kid Pirates ;
- Kuja Pirates ;
- Donquixote Family ;
- Cross Guild ;
- Armée Révolutionnaire.

### Fruits
Le monde contient désormais **26 Fruits du Démon**.

Les ajouts comprennent notamment :
- Gomu Gomu no Mi ;
- Yami Yami no Mi ;
- Gura Gura no Mi ;
- Ope Ope no Mi ;
- Jiki Jiki no Mi ;
- Hana Hana no Mi ;
- Suna Suna no Mi ;
- Ito Ito no Mi ;
- Nikyu Nikyu no Mi ;
- Pika Pika no Mi ;
- Hie Hie no Mi ;
- Magu Magu no Mi ;
- Uo Uo no Mi, modèle Seiryu ;
- Soru Soru no Mi ;
- Hito Hito no Mi, modèle Daibutsu ;
- Mero Mero no Mi ;
- Mochi Mochi no Mi ;
- Tori Tori no Mi, modèle Phénix.

### Lieux
Le monde contient désormais **47 lieux**.

Ajouts :
- Cocoyasi ;
- Marineford ;
- Impel Down ;
- Amazon Lily ;
- Mary Geoise ;
- Baltigo ;
- Kamabakka ;
- Onigashima ;
- Hachinosu ;
- Elbaf.

Les routes des lieux existants ont été adaptées afin que ces zones soient réellement accessibles.

### Événements
Le moteur contient désormais **21 événements canoniques**.

Nouvelles chaînes :
- Collision des puissances à Sabaody ;
- Crise d'Enies Lobby ;
- Capture d'un commandant pirate majeur ;
- Guerre de Marineford ;
- Nouvel équilibre après-guerre ;
- Chute d'un réseau majeur à Dressrosa ;
- Escalade contre les Empereurs ;
- Guerre de Wano ;
- Émergence de Cross Guild ;
- Incident d'Egghead.

## Personnalités canoniques

La V7.0 introduit `V70_PERSONAS`.

Un personnage canonique peut posséder :
- tempérament ;
- objectif ;
- valeurs ;
- compétences qu'il respecte ;
- ambitions qu'il respecte ;
- factions qu'il considère hostiles ;
- potentiel de mentorat ;
- biais de confiance ;
- biais de rivalité.

Exemples :
- Mihawk respecte réellement la maîtrise du Sabre ;
- Sakazuki réagit très différemment à un Pirate ;
- Shanks privilégie davantage liberté, loyauté et Commandement ;
- Dragon réagit à la Révolution, au Commandement et à la Discrétion ;
- Robin valorise savoir et discrétion ;
- Law valorise Médecine, stratégie et discrétion ;
- Kid développe plus facilement une rivalité ;
- Rayleigh, Garp, Mihawk, Robin, Law, Jinbe et d'autres peuvent devenir des mentors cohérents selon la relation.

## Rencontres canoniques

`canonEncounter()` utilise maintenant la personnalité du personnage.

La relation générée dépend de :
- faction du joueur ;
- ambition ;
- réputation ;
- puissance ;
- compétence pertinente ;
- personnalité canonique.

Les rencontres suivantes font évoluer :
- familiarité ;
- respect ;
- confiance ;
- rivalité.

Une figure très hostile et importante peut créer un World Hook spécifique.

## Graphe historique

La V7.0 ajoute des dépendances entre événements.

Exemple :

Nouvelle génération
→ Capture d'un commandant pirate majeur
→ Pression vers une guerre majeure
→ Guerre de Marineford
→ Nouvel équilibre après-guerre

Autres chaînes :
- Water 7 → Enies Lobby ;
- Nouvelle génération → Sabaody ;
- Bouleversements du Nouveau Monde → Dressrosa ;
- Dressrosa → conflit contre les Empereurs ;
- conflit des Empereurs → Wano ;
- Wano → Egghead ;
- après-guerre → Cross Guild.

Un événement dépendant ne peut pas survenir si ses causes n'existent pas.

Si la fenêtre temporelle expire sans ses prérequis :
- l'événement devient empêché ;
- la divergence augmente ;
- le moteur explique quelles causes ont disparu.

## Effets canoniques réels

Les événements peuvent modifier :
- pressions régionales ;
- influence des factions ;
- position de personnages ;
- statut de personnages ;
- statut d'un équipage ;
- région d'un équipage ;
- disponibilité de Fruits ;
- détenteur d'un Fruit.

Exemple QA Marineford :
- Ace passe au statut mort ;
- Edward Newgate passe au statut mort ;
- l'Équipage de Barbe Blanche est dissous ;
- le Mera Mera no Mi retourne dans le monde ;
- le Gura Gura no Mi passe à Blackbeard.

Ces effets restent soumis au graphe historique : si Marineford est empêché dans une partie divergente, cette chaîne n'est pas imposée artificiellement.

## Équipages canoniques dans Causal World

Les groupes canoniques sont désormais des acteurs régionaux.

Ils possèdent :
- puissance ;
- importance ;
- dynamique / momentum ;
- région ;
- leader ;
- fenêtre historique ;
- statut.

Leur présence contribue à :
- danger régional ;
- risque de route, de façon limitée ;
- opportunités ;
- missions.

Leur poids maritime a été rééquilibré pendant la QA afin qu'une forte présence canonique n'annule pas l'intérêt de réduire piraterie et instabilité.

## Missions canoniques

Les factions opposées peuvent recevoir des missions liées à un véritable équipage canonique.

Exemples :
- opération contre l'Équipage du Roux ;
- opération contre un groupe pirate majeur ;
- croisement/rivalité entre équipages pirates.

Une mission contre un groupe canonique modifie notamment sa dynamique et utilise toujours les conséquences V6.8.

## Migration

`v70Ensure()` migre les sauvegardes existantes.

Il ajoute sans doublon :
- nouveaux personnages ;
- nouveaux Fruits ;
- nouveaux événements ;
- groupes canoniques.

Les événements nouvellement introduits dont la fenêtre est déjà dépassée deviennent **archivés**, et non automatiquement empêchés.

Les événements déjà complétés dans une sauvegarde pré-V7 sont marqués comme ayant déjà produit leurs effets : leurs nouvelles conséquences systémiques ne sont donc pas rejouées rétroactivement.

## Interface Monde

L'écran Monde affiche maintenant :
- nombre de groupes canoniques actifs ;
- nombre de personnages canoniques ;
- nombre de Fruits ;
- progression de découverte des 47 lieux ;
- personnalités/objectifs des personnages présents ;
- groupes canoniques locaux ;
- état de leurs dynamiques ;
- dépendances des événements ;
- événements dont les causes sont réunies ;
- événements bloqués et causes manquantes.

## QA V7.0

Le test bloquant `scripts/qa-v70.mjs` vérifie :
- minimum 58 personnages ;
- 12 groupes ;
- 26 Fruits ;
- 21 événements ;
- 47 lieux ;
- migration d'une sauvegarde pré-V7 ;
- archivage propre des événements historiques ajoutés ;
- absence d'effets rétroactifs ;
- différence Mihawk / Sakazuki / Shanks ;
- réaction hostile de Sakazuki à un Pirate ;
- respect de Mihawk pour le Sabre ;
- prérequis de Marineford ;
- effets de Marineford ;
- retour du Mera Mera dans le monde ;
- transfert du Gura Gura ;
- poids régional des groupes canoniques ;
- génération de missions canoniques ;
- conservation des systèmes V6.4 à V6.9 ;
- absence globale de `$().forEach()` sur les bindings UI.

## Résultats de référence

- personnages : **58** ;
- groupes : **12** ;
- Fruits : **26** ;
- événements : **21** ;
- lieux : **47** ;
- respect Mihawk dans le scénario Sabreur : **55,4** ;
- confiance Sakazuki envers le Pirate : **0** ;
- confiance Shanks envers le même profil : **38** ;
- dépendances Marineford : **2** ;
- groupes canoniques actifs dans le scénario régional : **3** ;
- danger causal sans ces groupes : **14,7** ;
- danger causal avec eux : **22,3** ;
- missions canoniques générées : **3** ;
- migration : validée ;
- règles de personnalité : validées ;
- graphe historique : validé.

## Régressions

La chaîne exécute toujours :
- V6.4 ;
- V6.5 ;
- V6.6 ;
- V6.7 ;
- V6.7.1 ;
- V6.8 ;
- V6.9 ;
- V7.0.

Les stress-tests existants restent actifs :
- carrière live 30 ans ;
- monde causal 12 ans ;
- économie endgame 20 ans.

## Version

- GAME_VERSION : **7.0.0**
- SAVE_VERSION : **700**
- Cache PWA : **one-piece-life-v7-0-0**
