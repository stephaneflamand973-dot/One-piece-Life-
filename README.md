# One Piece Life · Fondation navigation 0.1

Cette étape installe **uniquement la navigation de l'application**, inspirée de l'ergonomie des simulateurs de vie de type BitLife, sans copier leurs graphismes ou leur code.

## Déjà opérationnel

- Interface mobile-first et barre inférieure toujours accessible.
- Navigation en cinq destinations permanentes (de gauche à droite) :
  **Carrière · Biens · Vie · Relations · Activités**.
- Bouton central **Vie** pour revenir au journal central. Il est volontairement réservé à la navigation, **il ne fait pas vieillir** tant que le moteur de vie n'est pas intégré.
- Retour contextuel (flèche en haut) vers Vie ; pour les futures sous-pages, retour vers la catégorie.
- Adresses partageables (`#/life`, `#/career`, etc.) et navigation native retour/précédent.
- Le registre `src/core/modules.mjs` accepte des domaines et des sous-pages autonomes, mais **ne charge aucun module de contenu par défaut**.
- Les rubriques sont de simples contenants vides. Aucun personnage, jauge, événement, monnaie, relation, carrière ni autre mécanique n'est généré.
- Sauvegardes historiques non lues et non supprimées.
- Tests de cohérence de navigation, routing profond, retour et fondation vierge.

## Architecture

```text
foundation/
  index.html
  styles.css
  src/
    ui/
      app.mjs          # écran, navigation, retour, état vide
    core/
      navigation.mjs   # cinq routes, liens, sous-pages, validation
      modules.mjs      # registre de modules métier installables
      engine.mjs       # conteneur sans gameplay
      state.mjs        # état vierge
test/
  base.test.mjs
  navigation.test.mjs
```

## Principes impératifs

1. Les routes et la navigation sont indépendantes de la simulation.
2. Un nouveau domaine doit s'intégrer via le registre, sans modifier cinq écrans à la fois.
3. Le moteur n'invente aucune donnée ; chaque système doit être développé ensuite.
4. Aucune liste d'actions, sous-page ou catégorie fictive ne doit apparaître avant intégration.
5. Le retour arrière ne doit pas faire perdre l'état du joueur (quand celui-ci existera).
6. Toute prochaine fonctionnalité doit être testée sur téléphone avant d'être considérée comme terminée.

## Tester

```sh
npm test
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000/foundation/`.
Publication : https://stephaneflamand973-dot.github.io/One-piece-Life-/foundation/

## Suivant

**Première mécanique de vie (à construire séparément) :** démarrage d'une nouvelle vie, génération du personnage, puis activation du bouton + Âge. Pas de mécaniques cachées dans la navigation.
