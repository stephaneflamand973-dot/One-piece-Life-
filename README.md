# One Piece Life V0.5.2 · Missions pirates

La version 0.5.2 introduit de vraies expéditions dans **Carrière** sans ajouter d'onglet. Cinq missions de difficulté progressive : escorter une cargaison, explorer une île, chercher un trésor, aborder un rival et échapper à la Marine. Certaines requièrent le rang membre confirmé ou officier.

Chaque mission affiche une chance dynamique (8 à 92 %) calculée à partir des aptitudes pertinentes, de la spécialité, de la performance, de la confiance du capitaine, de la cohésion et de la loyauté, ainsi que de la fatigue et des blessures. Trois issues possibles : réussite, succès partiel, échec. Les résultats modifient le butin en Berrys, la performance, la réputation, la loyauté, la fatigue, et parfois la santé. Le succès n'est jamais garanti.

Deux missions au maximum par année, sans avancer automatiquement l'âge. Le journal garde **exactement une entrée par année**, même après plusieurs expéditions. Les missions réelles sont aussi accessibles par l'ancienne action Mission des Relations après recrutement.

Les Berrys sont la richesse gagnée par le personnage ; **la prime de recherche ne constitue pas une récompense financière** et sera développée dans une version ultérieure. Les sommes, résultats et blessures sont enregistrés et persistent après rechargement.

Le schéma V12 utilise la sauvegarde `opl:foundation:life-v052`, avec migration automatique et non destructive depuis V0.5.1 et la chaîne des sauvegardes précédentes. Les capacités, équipages, partenaires et données de vie existants sont conservés.

Exécuter `npm test` pour les tests Node. La QA mobile explore les missions et sauvegardes sur Chromium (320/390/430 px) et WebKit simulant un iPhone.
