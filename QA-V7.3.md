# ONE PIECE LIFE — QA V7.3

V7.3.0 — Career & Organization 3.0

## Objectif

La V7.3 corrige une limite structurelle du système de carrière : jusqu’ici, l’ascension reposait surtout sur l’expérience de carrière, les compétences et l’autorité V6.9.

Le joueur peut désormais être puissant et expérimenté sans être automatiquement considéré comme fiable, influent ou prêt à recevoir davantage de responsabilités.

---

## Branches professionnelles

Chaque grande faction possède désormais trois branches :

- Marine : Ligne de front, Commandement, Renseignement ;
- Pirates : Avant-garde, Exploration, Commandement d’équipage ;
- Chasseurs de primes : Traque, Duel, Réseau de contrats ;
- Révolutionnaires : Opérations, Renseignement, Organisation ;
- Gouvernement : Opérations Cipher, Renseignement, Administration stratégique ;
- Civil : Expertise, Commerce & réseau, Exploration.

Le moteur sélectionne une branche initiale cohérente avec le profil réel du personnage.

Le joueur peut ensuite changer de branche, mais :
- le changement est limité à une fois par an ;
- il coûte du standing ;
- il réduit légèrement la confiance ;
- l’historique de branche est conservé.

---

## Dossier interne

Nouvel état V7.3 :

- standing interne ;
- confiance ;
- fiabilité / discipline ;
- influence ;
- distinctions ;
- sanctions ;
- bilan des missions ;
- responsabilité ;
- dernier examen de promotion ;
- historique des branches.

Les valeurs sont conservées dans la sauvegarde.

---

## Missions → carrière

Une mission n’affecte plus uniquement :
- Berry ;
- XP ;
- réputation publique ;
- état du monde.

Elle modifie également le dossier interne.

### Succès
- standing en hausse ;
- confiance en hausse ;
- influence éventuelle ;
- distinction possible sur mission difficile.

### Réussite partielle
- progression interne plus faible.

### Retrait
- impact limité ;
- une approche prudente peut préserver la fiabilité.

### Échec
- standing et confiance en baisse ;
- sanction possible sur mission difficile.

Une mission cohérente avec la branche choisie reçoit également un bonus de pertinence.

---

## Promotions dynamiques

Une promotion normale utilise désormais :

1. XP de carrière ;
2. score de compétences ;
3. standing interne ;
4. confiance ;
5. influence aux hauts rangs ;
6. sanctions ;
7. bilan des missions.

Lorsque tous les critères sont remplis, le dossier devient éligible.

L’approbation finale conserve une probabilité dynamique calculée à partir de la qualité du dossier.

Une promotion peut donc être :
- validée ;
- différée ;
- bloquée par le dossier.

Le capitanat pirate conserve sa voie spéciale indépendante.

---

## Responsabilités

V7.3 ajoute cinq niveaux :

1. Membre opérationnel ;
2. Spécialiste reconnu ;
3. Chef d’équipe ;
4. Responsable d’unité ;
5. Cadre stratégique.

Le niveau dépend notamment :
- de l’autorité ;
- du rang relatif ;
- du standing.

Les responsabilités apportent un bonus réel en mission.

---

## Positionnement interne

Une fois par an, le joueur peut choisir :

- Faire ses preuves sur le terrain ;
- Développer son réseau interne ;
- Miser sur la fiabilité ;
- Revendiquer plus de responsabilités.

Ces choix modifient réellement :
- standing ;
- confiance ;
- influence ;
- discipline ;
- XP ;
- énergie éventuelle.

Une ambition trop précoce peut réduire la confiance.

---

## Politique interne

Une fois par année, le moteur peut produire un événement interne en fonction du profil du joueur.

Exemples :
- Soutien interne ;
- Rivalité interne ;
- Examen interne ;
- Responsabilité imprévue.

Le résultat dépend du standing, de la confiance, de l’influence et des sanctions.

---

## Intégration V6.9

L’autorité V6.9 utilise maintenant aussi :
- influence V7.3 ;
- standing V7.3 ;
- confiance V7.3.

Les bonus de mission peuvent combiner :
- réseau économique V6.9 ;
- mobilisation V6.9 ;
- responsabilité V7.3 ;
- cohérence de branche V7.3.

---

## Architecture

Nouveaux fichiers :

```
src/
  data/
    career-organizations-v73.js
  v73/
    career-organization-engine-v73.js
```

Le fichier de données contient :
- organisations ;
- branches ;
- responsabilités ;
- actions internes.

Le moteur pur contient :
- normalisation de l’état ;
- sélection de branche ;
- alignement de mission ;
- impact des missions ;
- niveau de responsabilité ;
- bonus d’organisation ;
- examen de promotion ;
- actions internes ;
- politique interne.

Le moteur ne dépend ni du DOM ni directement de la sauvegarde.

---

## QA V7.3

`scripts/qa-v73.mjs` vérifie notamment :

- 6 organisations ;
- 18 branches ;
- 5 niveaux de responsabilité ;
- 4 actions internes ;
- sélection de branche cohérente ;
- succès de mission augmentant le standing ;
- échec difficile dégradant le dossier ;
- bilan des missions conservé ;
- responsabilités réellement progressives ;
- XP et compétences insuffisants sans confiance interne ;
- dossier haut niveau éligible ;
- probabilité d’approbation dynamique ;
- alignement branche / mission ;
- bonus de leadership ;
- coût politique d’une ambition prématurée ;
- événements de politique interne ;
- conservation explicite des scores à 0 ;
- intégration au moteur live ;
- migration V7.2 → V7.3 ;
- PWA V7.3 ;
- absence de régression UI.

La chaîne complète conserve les QA V6.4 → V7.2.

---

## Version

- GAME_VERSION : **7.3.0**
- SAVE_VERSION : **730**
- Cache PWA : **one-piece-life-v7-3-0**
