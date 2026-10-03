# ONE PIECE LIFE — QA V8.5

V8.5.0 — Voyage & Exploration 4.0

## Objectif

La V8.5 fait de la mer un système de jeu à part entière. Une traversée possède désormais une stratégie, une météo, un risque, une usure, une progression et une mémoire persistante.

## Styles de traversée

Quatre modes sont disponibles avant chaque départ :

- Route normale : profil équilibré.
- Navigation prudente : plus lente, mais réduit risque et usure.
- Forcer l'allure : plus rapide, mais augmente risque et usure.
- Route d'exploration : plus lente et légèrement plus risquée, mais maximise les découvertes.

## Météo

Les distributions météo diffèrent selon les régions.

Les Blues restent globalement plus stables. Grand Line et le Nouveau Monde favorisent davantage :
- tempêtes ;
- courants violents ;
- brouillard ;
- cyclones ;
- variations extrêmes.

La météo modifie la progression, le risque et l'usure du voyage.

## Log Pose

Le moteur distingue trois niveaux :
- navigation classique ;
- Log Pose ;
- Log Pose avancé.

Le manque d'instrument adapté pénalise durée et risque sur Grand Line et dans le Nouveau Monde.

## Maîtrise des routes

Chaque paire d'îles possède :
- nombre de traversées ;
- maîtrise 0–100 ;
- dernière année parcourue.

Une route connue devient plus courte et moins risquée.

## Équipage et navire

Les performances maritimes utilisent :
- Navigation du joueur ;
- domaine Navigation de l'équipage V8.4 ;
- état réel du navire ;
- maîtrise de route ;
- Log Pose.

Le navigateur et le charpentier cessent donc d'être des décorations très professionnelles.

## Incidents maritimes

Le moteur peut générer :
- tempêtes ;
- pirates ;
- patrouilles de la Marine ;
- Rois des Mers ;
- récifs ;
- courants ;
- navires marchands.

Les conséquences incluent fatigue, retard, dégâts au navire, combat et opportunités économiques.

## Exploration des îles

Chaque lieu possède une exploration persistante entre 0 et 100.

L'exploration progresse lors :
- d'une première arrivée ;
- des visites suivantes ;
- des actions annuelles Explorer / Chasser les opportunités.

Les seuils 25, 50, 75 et 100 augmentent la probabilité d'une découverte notable.

## Découvertes

Sept familles :
- données cartographiques ;
- trésors ;
- vestiges ;
- ressources ;
- contacts ;
- pistes rares ;
- savoirs pratiques.

Les récompenses utilisent les systèmes existants : argent, réputation, Navigation, Discrétion, Codex et rareté V6.4.

## Interface

La carte Exploration affiche :
- niveau de Log Pose ;
- expérience en mer ;
- routes connues ;
- routes maîtrisées ;
- mois en mer ;
- exploration de l'île actuelle ;
- découvertes ;
- trésors ;
- tempêtes traversées ;
- météo et état de la traversée active.

## Version

- GAME_VERSION : **8.5.0**
- SAVE_VERSION : **850**
- Cache PWA : **one-piece-life-v8-5-0**
