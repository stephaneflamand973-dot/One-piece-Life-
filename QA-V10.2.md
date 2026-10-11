# ONE PIECE LIFE — V10.2 : Action Engine 2.0

## Statut
Version 10.2.0 du moteur de gameplay manuel. Sauvegardes de génération V10 compatibles (`SAVE_VERSION = 1000`).

## Changements apportés

### 1. Registre unique des actions
`src/data/action-v102.js` centralise les conditions, coûts, limites annuelles et rendements. `src/v102/action-engine-v102.js` est responsable de la normalisation, de la migration, de l'éligibilité, de l'exécution et de l'enregistrement des actions.

| Action | Utilisations/an | Énergie | Rendement successif |
|---|---:|---:|---|
| Travailler | 4 | 12 | 100 %, 78 %, 58 %, 42 % |
| S'entraîner | 5 | 12 | 100 %, 82 %, 65 %, 50 %, 38 % |
| Accomplir une mission | 3 | 0 | 100 % |
| Demander une promotion | 1 | 3 | 100 % |
| Se reposer | 4 | 0 | 100 %, 86 %, 70 %, 60 % |
| Effectuer une traversée | 4 | 8 | 100 % |

Les quotas sont des **limites de sécurité de rythme** et non des gains automatiques. Les actions complexes gardent un rendement nominal car elles déclenchent des missions et dangers propres.

### 2. Entraînement ciblé
Choix conservé dans la sauvegarde : condition physique, combat et technique, Haki et maîtrise, discipline et étude. Le choix influe sur le type d'entraînement transmis au moteur existant ; son activité initiale est rétablie après la séance.

### 3. Validation partagée
Disponibilité dans le panneau et le Centre d'actions, coût énergétique, prérequis de carrière, mission, traversée, promotion et récupération passent par le même calcul. Le rendement de la prochaine action est montré avant le clic.

### 4. Transactions et historique
- Vérification avant l'action.
- Copie de sécurité de la partie avant modification.
- Exécution réelle.
- Décompte du quota et ajout au journal uniquement après réussite de l'exécution.
- Restauration de la partie si un effet échoue avec exception.
- Journal borné aux 24 dernières actions pour limiter la taille des sauvegardes.

### 5. Passage d'une année
Les compteurs sont remis à zéro, l'historique des actions est conservé, le monde vieillit. Aucune progression de carrière, récompense, promotion ou entraînement n'est déclenché *uniquement* en vieillissant.

### 6. Migration
Le premier chargement d'une sauvegarde V10.0/V10.1 transfère les actions déjà utilisées pendant l'année courante vers le format V10.2. Les usages d'années passées ne bloquent pas la nouvelle année.

## Non inclus dans la V10.2
- Les relations et services de V9.5 conservent provisoirement leurs propres limites.
- Les missions et traversées se terminent encore via leur résolution historique en un clic.
- Les carrières détaillées et l'économie seront enrichies dans les versions V10.3 et V10.5.
- La refonte totale des cinq onglets est prévue pour V11.0.

## Tests
`node scripts/qa-v102.mjs` teste notamment les rendements, quotas, prérequis, refus, rollback du compteur, migration, focus, cache et limites du journal.
`node scripts/qa-v100-runtime.mjs` teste le gameplay réel, dont plusieurs travaux la même année et l'absence de gains automatiques en vieillissant.
Les workflows CI continuent d'exécuter les tests historiques V6.4 à V10.1.

## Prochaine étape
V10.3 : Carrières et organisations 2.0, avec métiers différenciés, gestion de la hiérarchie, performance, salaire, collègues et promotions.
