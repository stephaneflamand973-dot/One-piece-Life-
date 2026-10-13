# One Piece Life V0.4.3 · Famille évolutive et groupes sociaux

La structure mobile reste inspirée de BitLife : un seul onglet Relations, une fiche par proche, et un fil Vie inversé limité à huit entrées.

## Famille
- La famille peut accueillir de nouveaux frères ou sœurs pendant l'enfance (4, 8 et 12 ans, sous conditions d'âge parental et de probabilité).
- Maximum **trois frères et sœurs**, incluant ceux déjà présents à la naissance.
- Les nouveaux membres ont leur propre âge, personnalité, confiance et affinité.
- Les nourrissons ne peuvent pas être sollicités tant qu'ils n'ont pas trois ans.
- L'arrivée dans la famille apparaît dans le fil annuel et le registre d'interactions, sans créer d'année supplémentaire.
- Les proches vieillissent et peuvent décéder comme auparavant.

## Amitiés et groupes
- À partir de deux amis, un **Cercle du port** est formé automatiquement.
- Le groupe possède une liste de membres persistante, une cohésion sur 100 et une activité collective « Organiser une sortie » dès huit ans.
- Une sortie coûte **une des trois actions sociales annuelles**, et peut améliorer ou dégrader les liens du groupe selon une probabilité dynamique.
- La cohésion s'érode légèrement avec le temps en l'absence de sortie.
- Une amitié atteignant 80 d'affinité et 65 de confiance donne un souvenir persistant « Amitié marquante ».
- Le groupe reste dans l'onglet Relations existant. Aucun nouvel onglet ni faux équipement.

## Compatibilité
- `SCHEMA_VERSION=7`, sauvegarde `opl:foundation:life-v043`.
- Migration depuis V0.4.2, V0.4.1, V0.4, V0.3 et V0.2 sans effacer les données originales.
- Les PNJ, leurs affinités, âges, personnalités, interactions, décisions et histoires existantes sont conservés.
- Le bouton Nouvelle vie n'importe pas une ancienne partie après réinitialisation.

## Architecture
- `foundation/src/core/social-evolution.mjs` : naissances, groupes, sorties et amitiés marquantes.
- `foundation/src/core/relationships.mjs` : validation des contacts et continuité annuelle.
- `foundation/src/core/state.mjs` : une action sociale ne fait jamais avancer le temps, un clic + Âge = une année.
- `foundation/src/ui/relations-view.mjs` : fiche et groupe dans la même rubrique.
- `test/social-evolution.test.mjs` : probabilités, décès, liens, groupes, limites, migration et persistance.
- `test/browser/mobile.mjs` : quatre parcours mobiles Chromium et WebKit avec création de cercle, activité et rechargement.

## Après V0.4.3
La romance, les conjoints, le mariage et les enfants du joueur sont volontairement réservés à V0.4.4.
