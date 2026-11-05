# ONE PIECE — AI LIFE SIMULATOR · Registre des arbitrages du dossier S

Complément au *Dossier maître de transmission* du 2026-11-05. Ce registre ne remplace pas ce dossier : il enregistre les décisions prises après lui.

> **Statut des prototypes du dépôt (S.14) :** le code présent dans `foundation/` et `test/` (jusqu'à V0.6.0) est **archivé comme source d'idées**. Il n'est **pas** la base du démonstrateur. La V0.6.0 applique des rendements décroissants aux gains, ce qui **contredit D.2A** (précisé par Q-résolution 3).

## Décisions validées par le user

| Réf. | Décision |
|---|---|
| S.1D | Démonstrateur intégré mais représentatif. |
| S.2D | Un mini-monde persistant, cinq scénarios complémentaires reliés. |
| S.3D | Validation multicritère, traçable, par étapes obligatoires ; critères et seuils définis avant les tests. |
| **S.4D** | Intégration progressive dans un seul mini-monde, avec vérification et non-régression à chaque jalon. |
| **S.5D** | Socle transversal minimal → tranche verticale traversant les cinq scénarios en version très réduite → approfondissement par itérations, avec non-régression complète à chaque itération. Remplace l'ancien déroulé « étapes 0 à 5 », jamais validé. |
| **S.Δ** | Délégation générale du user : « choisis automatiquement tous les autres aspects ». Elle couvre les arbitrages de conception du dossier S, pas l'autorisation de coder, tester ou choisir un modèle IA. |

## Révision de plateforme (décision du user, postérieure au dossier)

| Réf. | Décision |
|---|---|
| **R.1A-iPhone** | Le user veut l'application sur son iPhone. **L'iPhone est la seule machine** : développement, essais et validation se font dessus. Remplace R.1D (« Mac d'abord, iPhone après validation ») et R.2A (Mac comme machine de référence). |
| Maintenu | **P.2A : 100 % local sur l'iPhone, IA comprise.** Aucune dérogation, aucun serveur. |
| Conséquences | Les seuils de performance sont fixés sur l'iPhone. L'instrumentation de mesure (S.7) doit fonctionner sur le téléphone et permettre d'exporter les résultats. Dans S.13, la réussite sur l'iPhone est la preuve visée ; elle ne certifie toujours pas le monde complet ni le multigénérationnel. |
| **R.7D** | Forme technique **décidée par mesure** : comparaison courte de l'IA locale dans Safari et en natif, sur les cas T01–T04 et T24, avec les seuils du palier 1, avant de construire le socle. |
| Non décidé | La forme technique retenue et le modèle IA (issus de la mesure R.7D). |

## Arbitrages adoptés sous délégation S.Δ

| Réf. | Sujet | Décision |
|---|---|---|
| S.6D | Périmètre de la tranche | Séquence de vie continue couvrant obligatoirement chaque invariant prioritaire, O.6D, N.3D, les interactions entre scénarios et des cas limites ciblés. **Liste fermée** fixée avant réalisation. |
| S.7 | Socle minimal | Uniquement ce que la tranche exige : états objectifs, temps simulé figé hors session, sauvegardes automatiques avec copies valides et contrôle d'intégrité, isolation des mondes, journal causal, interfaces entre modules, instrumentation de mesure. Aucun choix technique. |
| S.8 | Critères et seuils | Une fiche par jalon, critères obligatoires et informatifs. Seuils fonctionnels fixés dès la fiche. Seuils de performance fixés après le relevé de l'iPhone et avant tout test. On ne les abaisse jamais après lecture des résultats ; toute révision est un arbitrage explicite et oblige à refaire les tests. |
| S.9 | Ordre des itérations | Du risque le plus fort au plus faible : faisabilité IA locale → invariants fragiles (séquestre, gains fixes, fabrication) → autonomie PNJ et monde → profondeur de vie → succession et continuité générationnelle. |
| S.10 | Sélection du modèle IA | Comparaison des candidats sur la même tranche et les mêmes fiches, avant l'approfondissement. Un modèle par rôle est permis. Élimination sur les critères obligatoires, puis départage. Aucun recours distant. |
| S.11 | Échecs | Un critère obligatoire échoué bloque le jalon : analyse causale, correction, non-régression complète. iPhone insuffisant → allègement de charge (P.3D) sans altérer règles ni conséquences, jamais de recours distant ; si c'est impossible, le signaler. |
| S.12 | Traçabilité | Registre des jalons, fiche de preuve par critère, journal des écarts, dossier de transmission mis à jour à chaque jalon. |
| S.13 | Fin de préproduction | Réussite = tous les critères obligatoires de la tranche et des itérations prévues passés. Ne certifie ni le monde complet, ni le multigénérationnel, ni l'iPhone. Production et portage iPhone sont des décisions distinctes. |
| S.14 | Prototypes existants | Archivés comme source d'idées, pas comme base. Rien n'est modifié ni supprimé. |

**Dossier S : clôturé conceptuellement V1.0, avec réserves.**

## Autorisation de réalisation (décision du user)

**Option D : réalisation par paliers, avec un bilan de preuves et l'accord du user avant chaque palier suivant.**

| Palier | Contenu | Statut |
|---|---|---|
| 1 | Relevé de l'iPhone, liste fermée de la tranche, fiches de critères avec seuils. **Sans code.** | **En cours** |
| 1 | (bilan) | Validé par le user, sauf l'espace disponible sur l'iPhone, encore à relever |
| 1 bis | Mesure R.7D : **Safari d'abord** (banc jetable `mesure/`, pas le jeu) ; natif seulement si Safari échoue à un seuil obligatoire, et le compte Apple Developer est alors décidé par le user | **Autorisé, banc prêt** ; mesures sur iPhone à faire |
| 2 | Socle minimal (S.7) | Non autorisé |
| 3 | Tranche verticale (S.6D) | Non autorisé |

## Réserves ouvertes

1. iPhone relevé (iPhone 15, 6 Go de mémoire vive, non compatible Apple Intelligence) ; aucune capacité n'est prouvée. Le modèle d'IA local intégré à iOS n'est pas disponible sur cet appareil. Faire tourner une IA locale de qualité suffisante sur un iPhone n'est pas démontré.
2. Aucun modèle IA n'est choisi.
3. Les seuils de performance ne sont pas fixés.
4. Les cas limites du séquestre (Q-résolution 2) restent à confronter.
5. Les libellés non retrouvés de D.1, G.6, K.5/K.6 et de certaines sous-questions F restent non reconstitués.

## Résultats de la mesure R.7D, volet Safari (iPhone 15, iOS 26.5.2, 2026-11-05)

| Modèle | Résultat |
|---|---|
| Qwen 3.5 · 2B | Chargé (65 s), puis **fermeture forcée par iOS** à la première génération. P4 échoué. |
| Llama 3.2 · 1B | **2 fermetures forcées** (début de série, début d'endurance). P4 échoué. Après environ 4,5 minutes, le moteur IA ne répond plus (réponses vides). Interprétation JSON très insuffisante : intentions inventées, conditions fausses, boucles d'espaces. Vitesse passée de 27 à 20 jetons/s en 4 minutes. |

Le bilan automatique de l'export comptait comme « réussis » des cas vides (T24) et calculait P1/P2 sur trop peu de réponses : ces statuts sont **invalides**. Le banc est corrigé.

**Constat :** les deux candidats mesurés, dont le plus léger, échouent à P4 dans Safari. Ce n'est pas une démonstration d'infaisabilité de l'IA locale sur iPhone ; le volet natif n'est pas mesuré.

## Changement de cap (décision du user, 2026-11-05)

Le user demande « une application hébergée sur une plateforme gratuite ». Il n'a pas répondu à la question sur l'IA et la base de départ ; Claude a choisi :

| Sujet | Choix |
|---|---|
| Hébergement | GitHub Pages (gratuit, déjà en place), app installable sur l'écran d'accueil |
| Base | Nouvelle application `jeu/`, respectant les invariants D.2A, L.3A, L.4A, K.2A, I.5A, 01.6A |
| IA | Le jeu fonctionne sans IA et hors ligne. IA en ligne **facultative** (Gemini, clé gratuite du joueur) : **P.2A n'est plus garanti quand elle est activée.** L'IA n'a aucune autorité sur les faits. |
| Processus | La démarche par paliers et questions est suspendue : réalisation directe. |
