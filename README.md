# One Piece Life V0.5.4 · Devenir capitaine

## La carrière évolue

La rubrique **Carrière** permet désormais de **quitter un équipage** et de postuler dans un autre après une année. Les compétences, relations, primes et Berrys gagnés suivent toujours le personnage. L'ancienne affiliation et ses contacts demeurent accessibles dans Relations.

Quand tu as gagné **50 000 Berrys**, le bouton **Fonder mon équipage** permet d'acheter un navire et de devenir **Capitaine**. Le coût est réel : il est déduit du butin. Le navire, le moral et la liste des compagnons sont enregistrés durablement.

## Responsabilités du capitaine
- **Recruter jusqu'à quatre compagnons** avec une spécialité, une compétence et une loyauté individuelles. Une tentative par année, refus possible, 5 000 Berrys seulement si recrutement réussi.
- **Un ordre annuel** parmi Entraîner l'équipage, Réparer le navire (8 000 Berrys) et Partager le butin (5 000 Berrys).
- **Le moral et l'état du navire** varient selon les missions et le temps, avec risques de désertion à moral bas.
- Les compétences des recrues, le nombre de membres et l'état du navire influencent la réussite des missions pirates.
- Le capitaine occupe un **rang distinct**, non accessible par promotion automatique depuis Officier. Il n'a plus de chef.
- La formation, le Haki futur, la prime et les autres systèmes restent attachés au personnage.
- Le statut de capitaine est persistant en V0.5.4 : la dissolution volontaire et la création d'une flotte viendront dans des versions distinctes.

## Simplicité et compatibilité
- Tout se joue depuis **Carrière**. Pas de nouvel onglet.
- **+ Âge avance d'un an**, même pendant des décennies de commandement.
- Sauvegarde schéma 14 `opl:foundation:life-v054`, migration non destructive depuis V0.5.3 et toutes les versions précédentes.
- Tests automatisés de la démission, de l'achat du navire, des recrutements, des ordres, du coût du butin, des missions, des sauvegardes et d'une vie jusqu'à 120 ans.
- QA Chromium mobile 320/390/430 px et WebKit iPhone simulé, parcours de capitaine et reprise du navigateur.
