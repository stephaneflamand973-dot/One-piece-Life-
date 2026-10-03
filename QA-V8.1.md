# ONE PIECE LIFE — QA V8.1

V8.1.0 — Faction Identity 4.0

## Objectif

V8.1 transforme les factions en styles de vie réellement différents au lieu de simples étiquettes de carrière.

Le système repose sur V7.3 pour le dossier professionnel et sur V8.0 pour l'arbitrage narratif. Il n'ajoute donc pas une seconde progression concurrente : il donne du sens aux métriques déjà existantes.

## Six identités de faction

- **Civil** : indépendance, réputation et ancrage local.
- **Marine** : justice, service et hiérarchie.
- **Pirates** : liberté, équipage et réputation.
- **Chasseurs de primes** : contrats, code et indépendance.
- **Révolutionnaires** : cause, réseau et clandestinité.
- **Gouvernement** : secret, efficacité et obéissance.

Chaque profil possède trois valeurs structurantes, une pression de base différente, des devoirs propres, des opportunités propres et des conflits internes propres.

## État persistant

La sauvegarde conserve désormais l'identité, la loyauté, l'autonomie, la pression, la friction, le meilleur standing, les devoirs remplis ou ignorés, les opportunités saisies, les changements de faction et l'historique factionnel.

Un changement de faction ne remplace donc plus silencieusement une étiquette. Il laisse une trace et réinitialise une partie de la relation avec la nouvelle organisation.

## Priority Director

Les événements de faction deviennent un nouveau type d'interruption V8.0. Ils ne sont proposés qu'après arbitrage avec les conséquences, la jeunesse, la vie personnelle et les décisions générales.

Une forte pression peut rendre un devoir prioritaire, mais les événements ordinaires restent limités à une vérification annuelle afin de préserver le rythme V8.0.

## Missions

Les résultats de mission alimentent directement l'identité de faction. Une réussite alignée renforce identité et loyauté, un échec augmente pression et friction, le danger amplifie l'effet et l'alignement avec la branche V7.3 compte réellement.

## Interface

L'onglet **Personnage** affiche une nouvelle carte « Identité & pression » avec l'identité de faction, ses valeurs, l'identité, la loyauté, l'autonomie, la pression, la friction et les compteurs de devoirs et d'opportunités.

## QA

Le script scripts/qa-v81.mjs vérifie notamment les six profils, les alias de faction, le raccord au Priority Director, les devoirs/opportunités/frictions, les conséquences des choix, la réaction aux missions, la persistance des changements de faction, l'idempotence annuelle, la migration des sauvegardes, les hooks live et le cache PWA.

La chaîne conserve les QA V6.4 → V8.0.

## Version

- GAME_VERSION : **8.1.0**
- SAVE_VERSION : **810**
- Cache PWA : **one-piece-life-v8-1-0**
