# One Piece Life V0.5.0 · Carrière pirate & entraînement

## Carrière pirate (inspirée du gameplay BitLife)
- La rubrique **Carrière** est enfin jouable. Dès 16 ans, candidature auprès de l'Équipage des Alizés ou de l'Équipage de l'Aurore.
- Les candidatures peuvent être refusées. **Une candidature par an**, spécialités conditionnées par les compétences réellement développées.
- Sept spécialisations : combattant, sabreur, navigateur, tireur, médecin, cuisinier, charpentier.
- Fiche de carrière claire : équipage, métier, capitaine (contact existant dans Relations), ancienneté, performance, rang et compétence principale.
- Bouton **Travailler davantage** une fois par année, progression de performance et de confiance du capitaine.
- Progression automatique d'ancienneté et promotion initiale *Recrue → Membre confirmé*, sous conditions de performance et d'expérience.
- Les missions pirates approfondies, promotions avancées, primes et commandement attendent les versions V0.5.1 et suivantes.

## Entraînement et compétences
- L'onglet **Activités** est jouable dès 6 ans, y compris sans appartenir à un équipage.
- Onze capacités persistantes : Force, Vitesse, Endurance, Technique de combat, Maîtrise des armes, Volonté, Navigation, Précision, Médecine, Cuisine, Charpenterie.
- **Trois séances maximum par an**, progression liée au talent personnel, au niveau de maîtrise et à la fatigue.
- Fatigue qui s'accumule, puis récupération à chaque année. Les progrès et le dernier entraînement restent enregistrés.
- Le bouton **S'entraîner** de la fiche Carrière ouvre le même écran, sans créer un second système incompatible.
- Les compétences restent attachées au **personnage**, jamais à sa faction, son grade ou son emploi.

## Simplicité et continuité
- Navigation inchangée à cinq rubriques : Carrière, Biens, Vie, Relations, Activités.
- **+ Âge** avance d'exactement un an, sans simulation laborieuse ni écrans supplémentaires.
- La carrière utilise le même capitaine que les Relations et conserve la faction pirate et sa réputation.
- Deux équipages originaux seulement pour cette première itération ; les équipages canoniques viendront après validation des systèmes.

## Sauvegardes et tests
- Schéma V10, clé `opl:foundation:life-v050`.
- Migration automatique de V0.4.5 et versions précédentes. Les sauvegardes antérieures ne sont ni effacées ni réécrites.
- Tests automatisés : vie de 120 ans, performances, entraînement, talent, recrutement et refus, promotions, incohérences, stockage bloqué et persistance.
- QA mobile : Chromium 320/390/430 px et WebKit iPhone simulé, y compris candidatures et entraînements.
