# ONE PIECE LIFE — QA V7.1

V7.1.0 — Arc Director & Modular Core

## Objectif

La V7.1 répond à la limite principale identifiée après V7.0 :

> les grands événements canoniques existaient dans le monde, mais le joueur ne les vivait pas encore suffisamment.

La V7.1 ajoute un **Arc Director** qui peut interrompre une année au moment exact où un événement historique majeur devient pertinent pour le joueur.

Elle démarre également une modularisation progressive du moteur live.

---

## Arc Director

Lorsqu'un événement majeur compatible avec V7.1 devient actif, le moteur évalue si le joueur est suffisamment impliqué pour y participer.

Le score de participation utilise notamment :

- réputation mondiale ;
- autorité V6.9 ;
- puissance ;
- relations avec les personnages concernés ;
- faction ;
- région ;
- importance de l'événement.

Un personnage faible et inconnu n'est donc pas automatiquement téléporté au centre de Marineford simplement parce que l'événement existe.

### QA de référence

Un civil peu expérimenté :
- participation Marineford : non éligible.

Un capitaine pirate majeur :
- participation Marineford : éligible ;
- rôle : **Intervenant pirate**.

---

## Arcs jouables

La V7.1 fournit actuellement **7 arcs majeurs modulaires** :

1. Enies Lobby ;
2. Sabaody ;
3. Marineford ;
4. Dressrosa ;
5. Wano ;
6. Cross Guild ;
7. Egghead.

Les arcs possèdent entre 2 et 3 étapes.

Marineford et Wano disposent de 3 étapes complètes.

Chaque étape peut proposer plusieurs décisions selon la faction du joueur.

---

## Exemple : Marineford

### Étape 1 — Mobilisation

Un Pirate peut notamment :
- se placer du côté du sauvetage ;
- poursuivre un objectif indépendant ;
- refuser la guerre.

Un Marine peut notamment :
- tenir la ligne de la Marine ;
- poursuivre un objectif indépendant ;
- se retirer.

Le moteur ne montre donc pas exactement les mêmes possibilités à toutes les factions.

### Étape 2 — Champ de bataille

Les choix peuvent utiliser :
- Combat ;
- Commandement ;
- Réflexes ;
- puissance générale ;
- Haki ;
- organisation ;
- soutien relationnel.

### Étape 3 — Point de non-retour

Les décisions critiques peuvent produire une divergence historique.

Exemple :
- **Tout risquer pour sauver Ace**.

Si le personnage possède réellement le niveau requis et réussit l'arc avec une contribution légendaire :
- Ace peut survivre ;
- le Mera Mera no Mi reste avec Ace ;
- la divergence mondiale augmente fortement ;
- la nouvelle réalité est enregistrée dans la chronologie.

Les conséquences canoniques ne sont donc plus totalement extérieures au joueur.

---

## Résolution des étapes

Chaque choix possède :
- compétence principale ;
- compétence secondaire éventuelle ;
- difficulté ;
- exposition ;
- contribution potentielle ;
- alignement ;
- relations affectées ;
- résultat critique éventuel.

La réussite dépend de la construction réelle du personnage.

Une réussite :
- augmente la contribution ;
- améliore éventuellement certaines relations ;
- peut augmenter réputation et impact causal.

Un échec :
- réduit la contribution ;
- augmente davantage l'exposition ;
- peut provoquer une blessure ;
- reste mémorisé dans l'arc.

---

## Contribution et exposition

Chaque arc suit deux valeurs principales.

### Contribution

Mesure dans quelle mesure le joueur a réellement pesé sur l'événement.

### Exposition

Mesure le niveau de risque accumulé au fil des décisions.

Le bilan final classe actuellement la participation en :
- withdrawn ;
- failed ;
- limited ;
- major ;
- legendary.

---

## Refus de participation

Le joueur peut refuser certains arcs dès leur première étape.

Dans ce cas :
- l'arc se ferme ;
- l'événement canonique continue normalement ;
- l'événement n'est pas bloqué dans un statut intermédiaire ;
- la décision est conservée dans l'historique V7.1.

La QA vérifie explicitement cette sortie.

---

## Interruption du système annuel

La philosophie **1 clic = 1 année** reste intacte.

Lorsqu'un arc majeur survient :

1. l'année avance normalement ;
2. l'événement se déclenche au mois correspondant ;
3. l'année est interrompue ;
4. le joueur prend une décision ;
5. les étapes significatives se résolvent ;
6. lorsque l'arc est terminé, l'année reprend.

V7.1 ajoute donc un premier **Adaptive Time Director** sans abandonner la boucle annuelle.

---

# Modularisation V7.1

La V7.1 démarre la sortie progressive du moteur monolithique.

## Nouvelle structure

```
src/
  core/
    module-registry.js
  data/
    arc-definitions-v71.js
  v71/
    arc-director.js
    arc-director.css
```

### module-registry.js

Crée un registre global minimal :

- register ;
- get ;
- has ;
- list.

Il permet aux nouvelles fonctionnalités d'être chargées comme modules versionnés.

### arc-definitions-v71.js

Contient uniquement les données des arcs :

- étapes ;
- textes ;
- choix ;
- difficultés ;
- compétences ;
- relations ;
- alignements ;
- conséquences critiques.

Les données ne sont donc plus mélangées au moteur principal.

### arc-director.js

Contient la logique pure :

- éligibilité ;
- rôle ;
- construction d'un arc ;
- choix disponibles ;
- calcul de capacité ;
- résolution ;
- bilan.

Il ne dépend pas directement du DOM ni des sauvegardes.

### arc-director.css

Les styles propres au système V7.1 sont également séparés.

---

## Pont legacy

Le fichier `index.html` conserve actuellement un petit pont V7.1 pour :

- lire/écrire la sauvegarde ;
- relier les modules aux systèmes V6.4–V7.0 ;
- appliquer relations et conséquences ;
- afficher l'arc ;
- reprendre le tour annuel.

Cette stratégie évite une réécriture brutale.

Les prochains systèmes devront progressivement suivre le même principe :

> données et logique pure hors du monolithe ; orchestration legacy minimale dans index.html.

---

## PWA

Le Service Worker met désormais en cache les modules V7.1 :

- module-registry.js ;
- arc-definitions-v71.js ;
- arc-director.js ;
- arc-director.css.

Cache :
**one-piece-life-v7-1-0**

---

## QA V7.1

Le test `scripts/qa-v71.mjs` charge réellement :

1. le registre ;
2. les définitions d'arcs ;
3. l'Arc Director ;
4. le moteur inline.

Il vérifie notamment :

- enregistrement des modules ;
- chargement depuis index.html ;
- présence dans le cache PWA ;
- au moins 7 arcs ;
- 3 étapes pour Marineford ;
- faible personnage non forcé dans Marineford ;
- personnage majeur éligible ;
- rôle spécifique à la faction ;
- passage de l'événement en `active_arc` ;
- création d'une vraie décision ;
- filtrage des choix par faction ;
- différence succès / échec ;
- différence d'exposition ;
- retrait déterministe ;
- absence d'événement bloqué après retrait ;
- divergence critique permettant la survie d'Ace ;
- migration V7.0 → V7.1 ;
- absence de binding UI `$().forEach()`.

---

## Compatibilité

La chaîne bloque toujours les régressions :

- V6.4 Risk / Adventure / Rarity ;
- V6.5 Combat & Mission ;
- V6.6 Potential Engine ;
- V6.7 Relationship & Crew ;
- V6.7.1 Stabilization ;
- V6.8 Causal World ;
- V6.9 Career / Economy / Endgame ;
- V7.0 Ultimate Canon Expansion ;
- V7.1 Arc Director.

---

## Version

- GAME_VERSION : **7.1.0**
- SAVE_VERSION : **710**
- Cache PWA : **one-piece-life-v7-1-0**
