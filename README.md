# ONE PIECE LIFE · V0.4 — Famille et relations

## Jouable
- **Famille générée à la naissance** : père, mère et éventuellement jusqu'à deux frères ou sœurs, avec âges et affinités propres.
- **Amis** : à partir de six ans, possibilité de rencontrer jusqu'à quatre personnages différents.
- **Interactions** : discuter, passer du temps, se disputer. Chaque choix influence concrètement la force du lien (0 à 100).
- **Limites équilibrées** : deux actions sociales par année, au maximum une interaction avec la même personne par an, interactions possibles à partir de trois ans.
- **Évolution annuelle** : affinités amicales et fraternelles qui s'érodent légèrement sans contact, âges qui progressent, décès selon un âge de fin de vie propre à chaque personne.
- **Conséquences narratives** : certains jalons de solidarité renforcent les liens familiaux, et les amitiés durables ou fragiles peuvent être mentionnées dans le fil de vie.
- **Premier onglet Relations réellement actif** : famille, amis, niveau de relation, fiche de chaque personne, actions et dernières interactions. Aucun nouveau sous-menu parasite.
- **Sauvegardes** : V0.4 utilise une nouvelle clé, importe les parties V0.3 et V0.2 sans effacer les originales. Le reset V0.4 bloque la résurrection d'anciennes parties.
- La règle fondamentale est conservée : **un clic + Âge = une année et une seule entrée dans le fil**.

## Mécaniques volontairement absentes
Rencontres amoureuses, enfants, mariage, divorces, PNJ canons, professions et factions feront l'objet de modules ultérieurs. Il n'existe aucun bouton inutilisable pour les simuler.

## Architecture
`foundation/src/core/relationships.mjs` calcule des liens persistants et toutes les actions.
`foundation/src/ui/relations-view.mjs` affiche les liens sans enregistrer de données.
`foundation/src/core/state.mjs` assure les validations et l'intégration à la simulation annuelle.
`foundation/src/core/storage.mjs` gère l'import conservateur V0.2 / V0.3 vers V0.4.

## Tester
```sh
npm test
python3 -m http.server 8000
```
Ouvrir `http://localhost:8000/foundation/`.
La QA automatisée couvre Chromium mobile (320/390/430 px) et WebKit iPhone simulé.
