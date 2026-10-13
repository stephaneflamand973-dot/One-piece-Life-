# One Piece Life V0.4.2 · Les proches prennent l'initiative

## Fonctionnalités
- Des parents ou amis peuvent **spontanément** solliciter le joueur pendant la progression annuelle.
- Quatre types : demander de l'aide, proposer une sortie, se confier, déclencher un conflit.
- Probabilités de déclenchement liées à la sociabilité et aux affinités ; le type de demande est influencé par les traits et la rivalité.
- Deux réponses possibles, avec conséquences distinctes sur l'affinité, la confiance, le respect et la rivalité.
- Les demandes en attente sont persistantes et restent identiques après rechargement ; la progression par + Âge attend la décision.
- Aucun nouveau sous-menu : la demande apparaît au sommet du fil Vie, dans la carte de décision.
- Pas de superposition avec les décisions principales aux âges 6, 12, 16, 18, 25, 35, 50 et 70 ans.
- Les actions de l'onglet Relations sont temporairement bloquées jusqu'à résolution.
- **Une pression sur + Âge = un an et une entrée de journal**, même en cas de décision d'un PNJ.
- Apparitions modérées à certaines étapes (9, 14, 23, 31, 42, 58 et 74 ans) et non systématiques, afin de ne pas saturer le joueur.

## Compatibilité
Sauvegarde V0.4.2 sous `opl:foundation:life-v042`. Migration automatique depuis V0.4.1, V0.4, V0.3 ou V0.2 sans effacer les versions antérieures. Le redémarrage sauvegarde une nouvelle vie vide pour éviter toute réapparition de parties plus anciennes.

## Structure
- `foundation/src/core/initiatives.mjs` : moteur pur d'initiatives, choix et conséquences.
- `foundation/src/core/relationships.mjs` : profil relationnel, carnet d'initiatives et validation.
- `foundation/src/core/state.mjs` : transitions d'âge et blocage d'un seul choix en attente.
- `foundation/src/ui/life-view.mjs` : carte d'initiative non dupliquée dans le fil.
- `test/initiatives.test.mjs` : âge, sauvegarde, conséquences, migrations, anti-duplication.
- `test/browser/mobile.mjs` : navigation, décisions PNJ et persistance Chromium mobile + WebKit.

## Vérifier
```sh
npm test
python3 -m http.server 8000
```
Ouvrir `http://localhost:8000/foundation/`.
