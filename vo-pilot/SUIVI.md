# Suivi du développement — VO PILOT

Dernière mise à jour : 2026-11-14.

## Terminé et testé

| Module | État |
|---|---|
| Socle : React + TypeScript + Tailwind, PWA installable, hors ligne, mode clair/sombre | fait |
| Navigation : 5 onglets mobiles + bouton d’ajout rapide, barre latérale ordinateur | fait |
| Tableau de bord : 3 priorités expliquées (exécuter / reporter / valider), chiffres du mois, planning du jour avec créneaux libres, actions rapides | fait |
| Clients / prospects : fiche, pipeline 16 étapes renommable, historique, vues « oubliés », doublons, consentement, suppression contrôlée, actions groupées | fait |
| Leads : heure de réception saisie, compte à rebours, urgence, traitement marqué dans VO PILOT uniquement | fait |
| Mode express : échange + résultat + prochaine action proposée en un écran | fait |
| Assistant de vente : découverte guidée (rappel de l’usage), incitation à l’essai, hésitations, objections modifiables, étapes de conclusion | fait |
| Catalogue : fiche, statuts, recherche multicritère, tris, import/export CSV avec dédoublonnage par référence, photos ordonnables, fiche image à partager | fait |
| Correspondance véhicule ↔ prospect, avec raisons et écarts | fait |
| Devis : frais, carte grise (règle déclarée réglable), remise, reprise, financement indicatif, proposition imprimable / PDF, envoi déclaré, relance | fait |
| WhatsApp : 18 modèles modifiables, variables, copie, lien wa.me, envoi confirmé à la main | fait |
| Ventes : dossier unique, 9 statuts, définition unique de la vente comptée, pas de double comptage | fait |
| Préparations / livraisons : checklist 6 statuts, interventions, blocages, documents (statut seul), exception tracée, tableau, calendrier | fait |
| Commissions : barème libre (règles cumulées, remise, paliers), estimé / confirmé / versé, net saisi, simulateur | fait |
| Statistiques : périodes, conversions avec numérateur/dénominateur, « données insuffisantes », 3 axes maximum | fait |
| Fidélisation : suivis après livraison, clients livrés, réactivation | fait |
| Agenda : jour / semaine / mois, export ICS | fait |
| Assistant : questions en langage courant, 7 modules de règles, hors ligne | fait |
| Automatisations : 8 règles activables, sans doublon, journal, dernière erreur | fait |
| Notes liées, recherche globale, favoris, journal d’audit | fait |
| Code d’accès (4 à 8 chiffres, empreinte seule, reverrouillage après 5 min en arrière-plan) | fait |
| Import Excel .xlsx direct du catalogue, comparaison imprimable de 2 ou 3 véhicules | fait |
| Vue pipeline des dossiers par étape, rappel de sauvegarde sur l’accueil, recalcul des commissions après changement de barème | fait |
| Paramètres (6 rubriques), sauvegarde JSON, restauration validée, exports CSV, effacement à double confirmation, démonstration fictive supprimable | fait |

## Tests exécutés

- `npm test` : 43 tests réussis (calculs de devis et carte grise, fuseau, correspondances, commissions, priorités, CSV, sauvegarde, parcours 1 à 5 sur IndexedDB).
- `npm run e2e` : 28 parcours réussis (trois exécutions de suite) dans Chromium au format iPhone 14, dont persistance après actualisation, import corrompu refusé, restauration, utilisation hors connexion. Aucune erreur console.
- `npm run build` : vérification de types et construction réussies.

## Non testé

- iPhone réel et Safari/WebKit (tests faits dans Chromium émulant un iPhone) : installation sur l’écran d’accueil, partage de la fiche image, notifications.
- Publication GitHub Pages : construction et mise en ligne réussies le 2026-11-13 ; l’adresse publique n’a pas été ouverte depuis l’environnement de développement.
- Gros volumes (plusieurs centaines de fiches, nombreuses photos) : non mesuré.
- Stockage indisponible (navigation privée stricte) : un écran d’erreur est prévu, non vérifié sur appareil.
- Accessibilité au lecteur d’écran : libellés posés, pas d’audit.
- Cibles de rapidité (prospect en 20 s, appel en 10 s) : à mesurer en usage réel.

## Non développé

- Synchronisation cloud entre appareils (donc pas de résolution de conflits) — sauvegarde exportable à la place.
- Connexions UpYourLeads, stock Renault, API WhatsApp Business, Outlook/Microsoft 365.
- IA externe (l’assistant est entièrement à base de règles).
- Notifications en arrière-plan (exigent un serveur d’envoi).
- Ancien format Excel .xls, import ICS, pièces jointes aux notes, fiche de rendez-vous imprimable.
- Opportunités multiples par client (une fiche = une opportunité en cours ; un client livré repasse « À réactiver »).
- Chiffrement de la base locale (le code d’accès bloque l’ouverture de l’application, il ne chiffre pas les données).
- Durées de conservation automatiques (seul un rappel des fiches perdues anciennes existe).

## Problèmes connus

- Le paquet JavaScript principal pèse environ 175 Ko compressé ; découpage possible.
- Modifier le barème ne recalcule pas d’office les ventes déjà enregistrées : bouton de recalcul par mois dans Commissions.
- Code d’accès oublié : aucune récupération, il faut tout effacer puis restaurer une sauvegarde.
- L’import Excel lit la première feuille et les valeurs brutes ; une date Excel apparaît comme un nombre.
- Le numéro WhatsApp suppose l’indicatif +596 pour un numéro local à 10 chiffres commençant par 0.

## Prochaine étape proposée

1. Essai sur l’iPhone réel avec la démonstration, puis saisie du vrai barème de commissions.
2. Confirmer avec l’employeur l’autorisation de conserver des données clients avant toute saisie réelle.
3. Selon l’usage : synchronisation cloud avec authentification (Supabase), chiffrement local, fiche de rendez-vous imprimable.
