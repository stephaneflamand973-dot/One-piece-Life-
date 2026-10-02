# ONE PIECE LIFE — QA V6.7

V6.7.0 — Relationship & Crew 2.0

## Objectif
La V6.7 transforme les relations et l’équipage en systèmes persistants qui influencent réellement progression, missions et stabilité de la trajectoire.

## Relations vivantes
- Chaque relation reçoit un tempérament persistant :
  - Loyaliste ;
  - Protecteur ;
  - Méthodique ;
  - Téméraire ;
  - Ambitieux ;
  - Indépendant.
- Chaque relation possède aussi une ambition personnelle :
  - Maîtrise ;
  - Influence ;
  - Fortune ;
  - Aventure ;
  - Liberté ;
  - Loyauté.
- Les relations réagissent au plan annuel du joueur.
- Confiance, respect, affection, loyauté, familiarité et rivalité contribuent désormais à une force relationnelle réelle.
- Les alliés solides peuvent contribuer au soutien de mission.
- Les rivalités fortes et respectueuses améliorent légèrement la progression martiale au lieu de n’être que décoratives.

## Mentorat
- Certaines relations crédibles peuvent devenir mentors : instructeurs, supérieurs, maîtres, vétérans ou mentors potentiels.
- Le mentorat exige une vraie qualité de relation.
- Un mentor actif donne un bonus de progression dont l’efficacité dépend de confiance, respect et compatibilité de rôle.
- Le mentorat peut affecter les compétences pertinentes et le Haki.
- Une relation trop dégradée peut mettre fin au mentorat.
- Le joueur peut accepter un mentor via une opportunité annuelle ou directement depuis l’onglet Relations lorsque les conditions sont réunies.

## Crew 2.0
- Chaque équipier obtient :
  - identifiant persistant ;
  - tempérament ;
  - ambition ;
  - confiance ;
  - rivalité ;
  - expérience ;
  - Growth Rate ;
  - potentiel de puissance.
- Les équipiers progressent de façon autonome.
- Les équipiers deviennent aussi de vraies relations persistantes.
- Les ambitions réagissent au plan annuel du joueur.
- La loyauté peut monter ou diminuer.
- Les profils ambitieux peuvent développer davantage de rivalité si leur trajectoire est frustrée.

## Cohésion et tension
- L’équipage possède une cohésion calculée à partir du moral, de la loyauté et des rivalités.
- La tension augmente avec rivalités, faible loyauté et mauvais moral.
- Cohésion et tension modifient directement le soutien de mission.
- L’interface affiche désormais cohésion et tension au lieu du seul moral.

## Conflits et départs
- Une tension élevée peut déclencher un conflit interne.
- Trois réponses :
  - médiation ;
  - soutenir la demande ;
  - imposer la discipline.
- La médiation dépend notamment du Commandement et de la relation.
- Une loyauté très faible peut provoquer un départ réel.
- Un membre parti devient un ancien équipier dans le réseau relationnel au lieu de disparaître de l’existence.

## Interface
L’onglet Relations affiche :
- tempérament ;
- ambition ;
- état du lien ;
- confiance ;
- rivalité ;
- mentor actif éventuel ;
- appartenance à l’équipage.

La fiche équipage affiche :
- membres actifs ;
- moral ;
- cohésion ;
- tension ;
- tempérament ;
- ambition ;
- loyauté.

## Correctif UI découvert pendant la V6.7
Le rendu du personnage utilisait par endroits le sélecteur mono-élément `$` avant un `.forEach()` pour des groupes de boutons.
La V6.7 corrige ces bindings pour :
- boutons Fruit ;
- activités ;
- réparations du navire.

Ils utilisent désormais correctement `$$`.

## Compatibilité
Les systèmes V6.4, V6.5 et V6.6 restent actifs :
- Risk Director ;
- Adventure 2.0 ;
- Rarity 2.0 ;
- Combat & Mission 2.0 ;
- Potential Engine 2.0.

Save version : **670**.

## QA live
Test bloquant : `scripts/qa-v67.mjs`.

Il vérifie notamment :
- génération déterministe des tempéraments et ambitions d’équipage ;
- synchronisation équipiers → relations ;
- variation cohésion/tension ;
- soutien de mission par les relations ;
- mentorat actif ;
- bonus de mentor ;
- bonus de rivalité martiale ;
- réaction des ambitions au plan annuel ;
- présence des départs et conflits ;
- décisions de mentorat ;
- correction des bindings UI multi-boutons.

Les QA V6.4, V6.5 et V6.6 restent exécutées comme régressions.

## PWA
Cache : `one-piece-life-v6-7-0`.
