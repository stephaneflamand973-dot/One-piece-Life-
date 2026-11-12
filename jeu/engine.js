// One Piece Life — moteur de simulation (autorité sur les faits).
// Module pur : aucune dépendance au navigateur, testable avec Node.
// Règles appliquées : gains fixes (D.2A), missions binaires avec séquestre (L.3A, L.4A),
// guérison automatique en temps simulé (K.2A), fabrication instantanée si ressources (I.5A),
// monde figé hors session (01.6A : rien ne bouge sans action du joueur).

import { initialiserMonde, vieDuMonde } from "./monde.js";
import { ACTIONS_FINALE, actionsFinale, routeOuverte } from "./finale.js";
import { ACTIONS_COMBAT, actionsCombat, engagerCombat, definirFin } from "./combat.js";
import { ACTIONS_MARINE, actionsMarine, auPoste, lieuPoste, verrouPromotion, donnerNavire, reprendreNavire } from "./marine.js";
import { ACTIONS_TERRE, actionsTerre, initialiserTerre, vieATerre, journeeDeMetier, possede, maisonIci } from "./terre.js";
import { ACTIONS_PIRATE, actionsPirate, vieEquipage, estCapitaine, estMembre, bonusCanons, aVoiles, aBlindage, moral, devenirCapitaine } from "./pirate.js";
import { appliquerTalents, anniversaireTalents, aTalent, bonusStat, bonusCompetence, bonusHaki, bonusFruit, bonusSalaire, bonusRelation, facteurFatigue, decalageAge } from "./talents.js";
import { appliquerOrigine, texteNaissance, verifierSucces, ORIGINES, PEUPLES } from "./origines.js";
import { ACTIONS_VIE, actionsVie, initialiserVie, vieInterieure, seuilFatigue } from "./vie.js";
import { ACTIONS_FACTIONS, actionsFactions, vieFactions, marineIgnore, reputation } from "./factions.js";
import { initialiserChronologie, avancerChronologie, presentSelonCanon } from "./chronologie.js";
import { initialiserEvenements, declencherEvenement, choixEvenement, choisir, accomplir, verifierAmbition } from "./evenements.js";

export const VERSION = 5;
export const JOUR_HEURES = 16; // heures d'éveil par jour
export const FATIGUE_MAX_ACTIVITE = 80;

export const ILES = {
  fuchsia: { nom: "Fuchsia", a: "à Fuchsia", desc: "village de l'île de Dawn, sur East Blue", port: "port", auberge: "bar" },
  shells: { nom: "Shells Town", a: "à Shells Town", desc: "ville portuaire d'East Blue, siège d'une base de la Marine", port: "port_shells", auberge: "taverne_shells" },
  baratie: { nom: "le Baratie", a: "au Baratie", desc: "restaurant flottant au large d'East Blue", port: "pont_baratie", auberge: "pont_baratie" },
  loguetown: { nom: "Loguetown", a: "à Loguetown", desc: "grande ville d'East Blue, la ville du commencement et de la fin", port: "quais_logue", auberge: "auberge_logue" },
  // Grand Line : îles canoniques, habitants inventés pour le jeu. « danger » renforce adversaires et butins.
  cap: { nom: "le cap des Jumeaux", a: "au cap des Jumeaux", desc: "promontoire au pied de Reverse Mountain, porte de Grand Line", port: "phare", auberge: "phare", grandLine: true, danger: 1 },
  little_garden: { nom: "Little Garden", a: "à Little Garden", desc: "île préhistorique de Grand Line, couverte de jungle et de bêtes géantes", port: "rivage_lg", auberge: "rivage_lg", grandLine: true, danger: 2 },
  water_seven: { nom: "Water Seven", a: "à Water Seven", desc: "cité des eaux de Grand Line, capitale des charpentiers navals", port: "quai_w7", auberge: "bar_w7", grandLine: true, danger: 2 },
  sabaody: { nom: "l'archipel Sabaody", a: "à l'archipel Sabaody", desc: "archipel de mangroves géantes, au bout de la première moitié de Grand Line", port: "mangroves", auberge: "bar_sabaody", grandLine: true, danger: 3 },
  hommes_poissons: { nom: "l'île des Hommes-Poissons", a: "à l'île des Hommes-Poissons", desc: "royaume sous-marin enveloppé d'une bulle géante, à 10 000 mètres sous la surface", port: "port_hp", auberge: "port_hp", grandLine: true, danger: 3 },
  dressrosa: { nom: "Dressrosa", a: "à Dressrosa", desc: "royaume de l'amour et de la passion, dans le Nouveau Monde", port: "port_dr", auberge: "ville_dr", grandLine: true, nouveauMonde: true, danger: 5 },
  wano: { nom: "Wano", a: "à Wano", desc: "pays fermé du Nouveau Monde, terre des samouraïs", port: "cote_wano", auberge: "village_wano", grandLine: true, nouveauMonde: true, danger: 6 },
  zou: { nom: "Zou", a: "à Zou", desc: "île vivante portée par un éléphant millénaire, pays des Minks", port: "patte_zou", auberge: "cite_zou", grandLine: true, nouveauMonde: true, danger: 5 },
  whole_cake: { nom: "Whole Cake Island", a: "à Whole Cake Island", desc: "île de gâteaux et de sucreries, au cœur du Nouveau Monde", port: "cote_wc", auberge: "ville_wc", grandLine: true, nouveauMonde: true, danger: 7 },
  egghead: { nom: "Egghead", a: "à Egghead", desc: "île aux machines étranges, en avance de plusieurs siècles", port: "quai_egg", auberge: "quai_egg", grandLine: true, nouveauMonde: true, danger: 6 },
  elbaf: { nom: "Elbaf", a: "à Elbaf", desc: "royaume guerrier des géants", port: "fjord_elbaf", auberge: "halle_elbaf", grandLine: true, nouveauMonde: true, danger: 6 },
  laugh_tale: { nom: "Laugh Tale", a: "à Laugh Tale", desc: "la dernière île de Grand Line", port: "rivage_lt", auberge: "rivage_lt", grandLine: true, nouveauMonde: true, danger: 8 },
};
// Durée des traversées en jours (prix : 20 Berrys par jour de mer).
export const ROUTES = {
  fuchsia: { shells: 2, baratie: 3, loguetown: 5 },
  shells: { fuchsia: 2, baratie: 2, loguetown: 4 },
  baratie: { fuchsia: 3, shells: 2, loguetown: 3 },
  loguetown: { fuchsia: 5, shells: 4, baratie: 3, cap: 3 },
  // Le Log Pose impose l'ordre des îles ; revenir à East Blue oblige à traverser la Calm Belt.
  cap: { little_garden: 4, loguetown: 7 },
  little_garden: { cap: 4, water_seven: 6, loguetown: 7 },
  water_seven: { little_garden: 6, sabaody: 5, loguetown: 7 },
  sabaody: { water_seven: 5, loguetown: 7, hommes_poissons: 3 },
  hommes_poissons: { sabaody: 3, dressrosa: 6 },
  dressrosa: { hommes_poissons: 6, wano: 7, zou: 5 },
  wano: { dressrosa: 7, zou: 6, egghead: 6 },
  zou: { dressrosa: 5, whole_cake: 5, wano: 6 },
  whole_cake: { zou: 5 },
  egghead: { wano: 6, elbaf: 6 },
  elbaf: { egghead: 6, laugh_tale: 8 },
  laugh_tale: { elbaf: 8 },
};
export const estGrandLine = ile => !!ILES[ile]?.grandLine;
export const PRIX_JOUR_MER = 20;
// Billet de passager : plus cher sur Grand Line, et plus encore pour les passages redoutables.
export function prixPassage(depart, dest) {
  const j = ROUTES[depart]?.[dest] || 0;
  const gl = estGrandLine(depart) || estGrandLine(dest);
  const dangereux = estGrandLine(depart) !== estGrandLine(dest) || [depart, dest].includes("hommes_poissons");
  return j * (dangereux ? 80 : gl ? 50 : PRIX_JOUR_MER);
}
export const PRIX_AUBERGE = 10;

export const LIEUX = {
  maison: { ile: "fuchsia", nom: "ta maison", court: "Maison", a: "chez toi" },
  bar: { ile: "fuchsia", nom: "le bar Partys", court: "Bar Partys", a: "au bar Partys" },
  place: { ile: "fuchsia", nom: "la place du village", court: "Place", a: "sur la place du village" },
  port: { ile: "fuchsia", nom: "le port", court: "Port", a: "au port" },
  atelier: { ile: "fuchsia", nom: "l'atelier du charpentier", court: "Atelier", a: "à l'atelier du charpentier" },
  remise: { ile: "fuchsia", nom: "la remise du maire", court: "Remise", a: "à la remise du maire" },
  colline: { ile: "fuchsia", nom: "la colline", court: "Colline", a: "sur la colline" },
  maison_shells: { ile: "shells", nom: "ta maison", court: "Maison", a: "chez toi" },
  maison_logue: { ile: "loguetown", nom: "ta maison", court: "Maison", a: "chez toi" },
  maison_w7: { ile: "water_seven", nom: "ta maison", court: "Maison", a: "chez toi" },
  maison_hp: { ile: "hommes_poissons", nom: "ta maison de corail", court: "Maison", a: "chez toi" },
  ecole: { ile: "fuchsia", nom: "l'école du village", court: "École", a: "à l'école" },
  port_shells: { ile: "shells", nom: "le port de Shells Town", court: "Port", a: "au port de Shells Town" },
  base: { ile: "shells", nom: "la base de la Marine", court: "Base Marine", a: "à la base de la Marine" },
  cellule: { ile: "shells", nom: "ta cellule, dans la prison de la base", court: "Cellule", a: "dans ta cellule", cache: true },
  taverne_shells: { ile: "shells", nom: "la taverne", court: "Taverne", a: "à la taverne" },
  pont_baratie: { ile: "baratie", nom: "le pont du Baratie", court: "Pont", a: "sur le pont du Baratie" },
  salle_baratie: { ile: "baratie", nom: "la salle du restaurant", court: "Salle", a: "dans la salle du restaurant" },
  cuisine_baratie: { ile: "baratie", nom: "les cuisines du Baratie", court: "Cuisines", a: "dans les cuisines du Baratie" },
  quais_logue: { ile: "loguetown", nom: "les quais de Loguetown", court: "Quais", a: "sur les quais de Loguetown" },
  marche_logue: { ile: "loguetown", nom: "le grand marché", court: "Marché", a: "au grand marché" },
  armurerie: { ile: "loguetown", nom: "l'armurerie", court: "Armurerie", a: "à l'armurerie" },
  echafaud: { ile: "loguetown", nom: "la place de l'échafaud", court: "Échafaud", a: "sur la place de l'échafaud" },
  caserne_logue: { ile: "loguetown", nom: "la caserne de la Marine", court: "Caserne", a: "à la caserne de la Marine" },
  poste_sabaody: { ile: "sabaody", nom: "le poste de la Marine de l'archipel", court: "Poste Marine", a: "au poste de la Marine" },
  auberge_logue: { ile: "loguetown", nom: "l'auberge", court: "Auberge", a: "à l'auberge" },
  bureau_primes: { ile: "loguetown", nom: "le bureau des primes", court: "Bureau des primes", a: "au bureau des primes" },
  phare: { ile: "cap", nom: "le phare du cap", court: "Phare", a: "au phare du cap" },
  falaises: { ile: "cap", nom: "les falaises du cap", court: "Falaises", a: "sur les falaises du cap" },
  baie: { ile: "cap", nom: "la baie au pied de Reverse Mountain", court: "Baie", a: "dans la baie" },
  rivage_lg: { ile: "little_garden", nom: "le rivage de Little Garden", court: "Rivage", a: "sur le rivage" },
  jungle: { ile: "little_garden", nom: "la jungle préhistorique", court: "Jungle", a: "dans la jungle" },
  quai_w7: { ile: "water_seven", nom: "les quais de Water Seven", court: "Quais", a: "sur les quais de Water Seven" },
  chantier: { ile: "water_seven", nom: "le chantier naval", court: "Chantier", a: "au chantier naval" },
  bar_w7: { ile: "water_seven", nom: "un bar au bord des canaux", court: "Bar", a: "au bar des canaux" },
  mangroves: { ile: "sabaody", nom: "les mangroves du port", court: "Mangroves", a: "dans les mangroves du port" },
  enrobage: { ile: "sabaody", nom: "l'atelier d'enrobage", court: "Enrobage", a: "à l'atelier d'enrobage" },
  bar_sabaody: { ile: "sabaody", nom: "un bar de l'archipel", court: "Bar", a: "au bar de l'archipel" },
  port_hp: { ile: "hommes_poissons", nom: "le port de bulles", court: "Port", a: "au port de bulles" },
  place_hp: { ile: "hommes_poissons", nom: "la grande place du royaume", court: "Place", a: "sur la grande place du royaume" },
  port_dr: { ile: "dressrosa", nom: "le port de Dressrosa", court: "Port", a: "au port de Dressrosa" },
  ville_dr: { ile: "dressrosa", nom: "les rues fleuries", court: "Ville", a: "dans les rues fleuries" },
  colisee: { ile: "dressrosa", nom: "le Colisée", court: "Colisée", a: "au Colisée" },
  cote_wano: { ile: "wano", nom: "la côte escarpée", court: "Côte", a: "sur la côte escarpée" },
  village_wano: { ile: "wano", nom: "un village de rizières", court: "Village", a: "au village" },
  dojo: { ile: "wano", nom: "le dojo", court: "Dojo", a: "au dojo" },
  patte_zou: { ile: "zou", nom: "la patte de l'éléphant", court: "Patte", a: "au pied de l'éléphant" },
  cite_zou: { ile: "zou", nom: "la cité des Minks", court: "Cité", a: "dans la cité des Minks" },
  baleine_zou: { ile: "zou", nom: "l'arbre-baleine", court: "Arbre-baleine", a: "à l'arbre-baleine" },
  maison_zou: { ile: "zou", nom: "ta maison", court: "Maison", a: "chez toi" },
  cote_wc: { ile: "whole_cake", nom: "la côte de biscuit", court: "Côte", a: "sur la côte de biscuit" },
  ville_wc: { ile: "whole_cake", nom: "la ville sucrée", court: "Ville", a: "dans la ville sucrée" },
  chateau_wc: { ile: "whole_cake", nom: "le château-gâteau", court: "Château", a: "au château-gâteau" },
  quai_egg: { ile: "egghead", nom: "le quai d'Egghead", court: "Quai", a: "sur le quai d'Egghead" },
  labo_egg: { ile: "egghead", nom: "les laboratoires", court: "Laboratoires", a: "aux laboratoires" },
  epave_egg: { ile: "egghead", nom: "l'épave au large", court: "Épave", a: "à l'épave" },
  fjord_elbaf: { ile: "elbaf", nom: "le fjord d'Elbaf", court: "Fjord", a: "au fjord d'Elbaf" },
  halle_elbaf: { ile: "elbaf", nom: "la grande halle des guerriers", court: "Halle", a: "dans la grande halle" },
  maison_elbaf: { ile: "elbaf", nom: "ta maison", court: "Maison", a: "chez toi" },
  rivage_lt: { ile: "laugh_tale", nom: "le rivage de la dernière île", court: "Rivage", a: "sur le rivage" },
  coeur_lt: { ile: "laugh_tale", nom: "le cœur de l'île", court: "Cœur de l'île", a: "au cœur de l'île" },
};
export const lieuxDe = ile => Object.keys(LIEUX).filter(k => LIEUX[k].ile === ile && !LIEUX[k].cache);
// Lieux où le joueur peut se rendre : pas la cellule, et seulement sa propre maison.
export const lieuxAccessibles = s => lieuxDe(s.ile).filter(k => !k.startsWith("maison") || possede(s, k));

// Emplois : celui qui paie, le salaire fixe, la compétence travaillée (gain fixe, D.2A).
export const EMPLOIS = {
  port: { payeur: "bern", salaire: 30, heures: 4, fatigue: 25, ageMin: 10, competence: "peche", label: "Travailler avec Bern",
    texte: "Tu aides Bern à remonter les filets et trier la pêche." },
  cuisine_baratie: { payeur: "gallo", salaire: 45, heures: 5, fatigue: 25, ageMin: 14, competence: "cuisine", label: "Travailler en cuisine",
    texte: "Tu enchaînes les commandes sous les ordres du chef Gallo." },
  phare: { payeur: "oswin", salaire: 30, heures: 4, fatigue: 20, ageMin: 14, competence: "navigation", label: "Entretenir le phare avec Oswin",
    texte: "Tu nettoies la grande lentille et notes les navires qui descendent de Reverse Mountain." },
  chantier: { payeur: "bolt", salaire: 70, heures: 5, fatigue: 30, ageMin: 15, competence: "charpenterie", label: "Travailler au chantier naval",
    texte: "Tu scies, cloues et calfates des coques sous l'œil exigeant de Bolt." },
  ville_wc: { payeur: "madeleine", salaire: 90, heures: 5, fatigue: 25, ageMin: 15, competence: "cuisine", label: "Travailler à la pâtisserie",
    texte: "Crèmes, glaçages, pièces montées : tu travailles pour la pâtisserie de Madeleine." },
  halle_elbaf: { payeur: "hjorn", salaire: 80, heures: 5, fatigue: 35, ageMin: 15, competence: null, stat: "force", label: "Forger avec Hjorn",
    texte: "Tu bats le fer aux côtés du forgeron géant, sur une enclume grande comme une maison." },
  quais_logue: { payeur: "dock", salaire: 35, heures: 4, fatigue: 30, ageMin: 14, competence: null, stat: "force", label: "Décharger les navires",
    texte: "Tu portes des caisses entre les navires et les entrepôts." },
};

export const RANGS_MARINE = ["Recrue", "Matelot", "Caporal", "Sergent", "Adjudant", "Enseigne", "Lieutenant", "Capitaine", "Commodore", "Contre-amiral", "Vice-amiral", "Amiral"];
export const MERITE_RANG = [0, 10, 25, 45, 70, 100, 140, 200, 280, 380, 500, 650];
export const SOLDE_MARINE = [20, 30, 45, 65, 90, 125, 175, 240, 320, 420, 550, 700]; // par semaine

export const STATS = {
  force: "Force", agilite: "Agilité", endurance: "Endurance", intelligence: "Intelligence", charisme: "Charisme",
};
export const COMPETENCES = {
  charpenterie: "Charpenterie", peche: "Pêche", combat: "Combat", cuisine: "Cuisine", navigation: "Navigation", musique: "Musique", medecine: "Médecine",
};
export const OBJETS = {
  planche: { nom: "planche", pluriel: "planches", prix: 20, vendeur: "tomas" },
  clou: { nom: "clou", pluriel: "clous", prix: 2, vendeur: "ilda" },
  poisson: { nom: "poisson", pluriel: "poissons", prix: 0 },
  canne: { nom: "canne à pêche", pluriel: "cannes à pêche", prix: 60, vendeur: "ilda" },
  sabre: { nom: "sabre", pluriel: "sabres", prix: 300, vendeur: "barro" },
  bague: { nom: "bague", pluriel: "bagues", prix: 150, vendeur: "lise" },
  barque: { nom: "barque", pluriel: "barques", prix: 600, vendeur: "tomas", navire: true },
  caravelle: { nom: "caravelle", pluriel: "caravelles", prix: 4000, vendeur: "barro", navire: true },
  logpose: { nom: "Log Pose", pluriel: "Log Pose", prix: 500, vendeur: "oswin" },
  logpose_nm: { nom: "Log Pose du Nouveau Monde", pluriel: "Log Pose du Nouveau Monde", prix: 2000, vendeur: "coral" },
};

// Gains fixes prédéfinis (D.2A) : jamais modulés.
// Fruits du Démon inventés pour ce jeu (aucun fruit canonique n'est attribué au joueur).
export const FRUITS = {
  echo: { nom: "Fruit de l'Écho", type: "Paramecia", pouvoir: "projeter des ondes sonores qui renversent tes adversaires", bonus: 6 },
  plume: { nom: "Fruit de la Plume", type: "Zoan", pouvoir: "te transformer en grand oiseau de mer", bonus: 5 },
  braise: { nom: "Fruit de la Braise", type: "Logia", pouvoir: "devenir braise et projeter des flammes", bonus: 8, intangible: true },
  verre: { nom: "Fruit du Verre", type: "Paramecia", pouvoir: "créer et façonner du verre à volonté", bonus: 5 },
  lierre: { nom: "Fruit du Lierre", type: "Paramecia", pouvoir: "faire jaillir des lianes qui enserrent tes adversaires", bonus: 6 },
  lynx: { nom: "Fruit du Lynx", type: "Zoan", pouvoir: "te transformer en lynx géant, vif et silencieux", bonus: 7 },
  brume: { nom: "Fruit de la Brume", type: "Logia", pouvoir: "devenir brume et te dissiper à volonté", bonus: 7, intangible: true },
  encre: { nom: "Fruit de l'Encre", type: "Paramecia", pouvoir: "donner vie à ce que tu dessines, le temps d'un combat", bonus: 5 },
};
export const HAKI = {
  observation: { nom: "Haki de l'observation", effet: "pressentir les coups et les intentions" },
  armement: { nom: "Haki de l'armement", effet: "durcir ton corps et tes coups d'une force invisible" },
  rois: { nom: "Haki des Rois", effet: "imposer ta volonté et faire plier les esprits faibles" },
};
export const SEUIL_EVEIL = 8;
export const PRIX_LECON_HAKI = 50;

export const NAVIRES = { barque: { nom: "barque de pêche aménagée", capacite: 3 }, caravelle: { nom: "caravelle", capacite: 8 } };
export const TAVERNES = ["bar", "taverne_shells", "salle_baratie", "auberge_logue", "bar_w7", "bar_sabaody", "place_hp", "ville_dr", "village_wano", "cite_zou", "ville_wc", "halle_elbaf"];
export const EXPLORABLES = ["colline", "port", "port_shells", "quais_logue", "echafaud", "pont_baratie", "phare", "jungle", "quai_w7", "mangroves", "falaises", "patte_zou", "cote_wc", "quai_egg", "fjord_elbaf", "rivage_lt", "place_hp", "ville_dr", "cote_wano"];
export const PRIX_LECON_SABRE = 200;
export const PRIX_ENROBAGE = 3000;

export const GAINS = {
  entrainement: 1, etude: 1, jeu_enfant: 1, peche: 1, charpenterie: 1, combat: 1,
  relation_conversation: 2, relation_aide: 5, salaire_port: 30, merite_service: 1, merite_patrouille: 3, temps_famille: 3,
};

const PNJ_INITIAUX = () => ({
  makino: { nom: "Makino", role: "tient le bar Partys", genre: "f", canon: true, lieu: "bar", relation: 10, fonds: 3000, souvenirs: [] },
  woop: { nom: "Woop Slap", role: "maire du village", genre: "g", canon: true, lieu: "place", relation: 0, fonds: 2500, souvenirs: [] },
  tomas: { nom: "Tomas", role: "charpentier", genre: "g", lieu: "atelier", relation: 0, fonds: 800, souvenirs: [], stock: { planche: 30, barque: 2 } },
  bern: { nom: "Bern", role: "pêcheur", genre: "g", lieu: "port", relation: 0, fonds: 600, souvenirs: [] },
  ilda: { nom: "Ilda", role: "marchande ambulante", genre: "f", lieu: "place", relation: 0, fonds: 1200, souvenirs: [], stock: { clou: 80, canne: 2 }, presente: true },
  sacha: { nom: "Sacha", role: "du village, de ton âge", genre: "x", lieu: "colline", relation: 5, fonds: 50, souvenirs: [], naissance: 120, romance: true },
  rivo: { nom: "Sergent Rivo", role: "recruteur de la Marine", genre: "g", lieu: "base", relation: 0, fonds: 500, souvenirs: [] },
  mira: { nom: "Mira", role: "tient la taverne de Shells Town", genre: "f", lieu: "taverne_shells", relation: 0, fonds: 900, souvenirs: [], naissance: -730, romance: true },
  gallo: { nom: "Chef Gallo", role: "cuisinier du Baratie", genre: "g", lieu: "cuisine_baratie", relation: 0, fonds: 4000, souvenirs: [] },
  nino: { nom: "Nino", role: "serveur du Baratie", genre: "g", lieu: "salle_baratie", relation: 0, fonds: 300, souvenirs: [], naissance: -365, romance: true },
  barro: { nom: "Barro", role: "armurier de Loguetown", genre: "g", lieu: "armurerie", relation: 0, fonds: 2000, souvenirs: [], stock: { sabre: 3, caravelle: 1 } },
  oswin: { nom: "Oswin", role: "gardien du phare du cap", genre: "g", lieu: "phare", relation: 0, fonds: 1000, souvenirs: [], stock: { logpose: 5 } },
  bolt: { nom: "Bolt", role: "maître charpentier de Water Seven", genre: "g", lieu: "chantier", relation: 0, fonds: 30000, souvenirs: [] },
  tess: { nom: "Tess", role: "serveuse au bord des canaux", genre: "f", lieu: "bar_w7", relation: 0, fonds: 400, souvenirs: [], naissance: -365, romance: true },
  coral: { nom: "Coral", role: "marchand homme-poisson", genre: "g", lieu: "port_hp", relation: 0, fonds: 8000, souvenirs: [], stock: { logpose_nm: 3 } },
  maela: { nom: "Maela", role: "sirène du royaume", genre: "f", lieu: "place_hp", relation: 0, fonds: 500, souvenirs: [], naissance: -730, romance: true },
  rocco: { nom: "Rocco", role: "organisateur des combats du Colisée", genre: "g", lieu: "colisee", relation: 0, fonds: 80000, souvenirs: [] },
  soen: { nom: "Sōen", role: "vieux maître samouraï", genre: "g", lieu: "dojo", relation: 0, fonds: 1000, souvenirs: [], naissance: -55 * 365 },
  hal: { nom: "Hal", role: "enrobeur de navires", genre: "g", lieu: "enrobage", relation: 0, fonds: 5000, souvenirs: [] },
  nara: { nom: "Nara", role: "Mink, gardienne de l'arbre-baleine", genre: "f", lieu: "cite_zou", relation: 0, fonds: 800, souvenirs: [], naissance: -1500, romance: true },
  madeleine: { nom: "Madeleine", role: "pâtissière de la ville sucrée", genre: "f", lieu: "ville_wc", relation: 0, fonds: 20000, souvenirs: [] },
  pell: { nom: "Pell", role: "chercheuse des laboratoires", genre: "f", lieu: "labo_egg", relation: 0, fonds: 5000, souvenirs: [] },
  hjorn: { nom: "Hjorn", role: "géant, forgeron d'Elbaf", genre: "g", lieu: "halle_elbaf", relation: 0, fonds: 20000, souvenirs: [] },
  garo: { nom: "Garo", role: "vieux marin retraité aux yeux perçants", genre: "g", lieu: "auberge_logue", relation: 0, fonds: 300, souvenirs: [], naissance: -60 * 365 },
  lise: { nom: "Lise", role: "bijoutière du grand marché", genre: "f", lieu: "marche_logue", relation: 0, fonds: 1500, souvenirs: [], naissance: -1095, romance: true, stock: { bague: 5 } },
});

// ---------- Hasard reproductible (l'état du générateur est sauvegardé) ----------

export function rand(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];

// ---------- Création ----------

export function nouvelleVie({ prenom, genre = "x", seed = Date.now() >>> 0, aleatoire = true, ere = "avant_luffy", origine = "fuchsia", peuple = "humain", defi = "aucun", talents = [] } = {}) {
  if (!PEUPLES[peuple]) peuple = "humain";
  if (PEUPLES[peuple].origine) origine = PEUPLES[peuple].origine;
  if (!ORIGINES[origine] || (ORIGINES[origine].peuple && ORIGINES[origine].peuple !== peuple)) origine = "fuchsia";
  const s = {
    version: VERSION, id: `monde-${seed.toString(36)}`, rng: seed >>> 0, cree: seed,
    jour: 0, heure: 8, fatigue: 0,
    perso: { prenom: prenom || "Sans-nom", genre, naissance: 0, vivant: true },
    stats: { force: 1, agilite: 1, endurance: 1, intelligence: 1, charisme: 1 },
    competences: { charpenterie: 0, peche: 0, combat: 0, cuisine: 0, navigation: 0, musique: 0, medecine: 0 },
    potentiel: {},
    berrys: 0, inventaire: { planche: 0, clou: 0, poisson: 0, canne: 0, sabre: 0, bague: 0, logpose: 0, logpose_nm: 0, fruits: [] },
    sante: { blessures: [], sequelles: [] },
    lieu: ORIGINES[origine].foyer, ile: origine, foyer: ORIGINES[origine].foyer,
    pnj: PNJ_INITIAUX(),
    carriere: null, navire: null, fruit: null, prime: 0, infamie: 0, prison: null,
    haki: { observation: 0, armement: 0, rois: 0, eveil: { observation: false, armement: false, rois: false }, progres: { observation: 0, armement: 0 }, roisInne: false },
    famille: { partenaire: null, statut: null, enfants: [], grossesse: null },
    generation: 1, ancetres: [],
    monde: { toitRemise: "abîmé", prochainNavire: 18, voyouAuPort: false, meteo: "beau", exterieur: 1000000, fruitsTrouves: [] },
    missions: [], journal: [], compteurs: { actions: 0 },
  };
  s.pnj.dock = { nom: "Compagnie des docks", role: "employeur des quais", lieu: null, relation: 0, fonds: 20000, souvenirs: [], invisible: true };
  // Potentiel inné (B.4D) : il ne multiplie jamais les gains, il fixe seulement un plafond naturel.
  for (const k of Object.keys(s.stats)) s.potentiel[k] = 40 + Math.floor(rand(s) * 61);
  s.haki.roisInne = rand(s) < 0.03; // le Haki des Rois ne s'apprend pas : il est inné, et rare
  if (aleatoire) for (const k of Object.keys(s.stats)) s.stats[k] += Math.floor(rand(s) * 2);
  initialiserMonde(s);
  initialiserEvenements(s);
  initialiserChronologie(s, ere);
  initialiserVie(s);
  initialiserTerre(s);
  appliquerOrigine(s, { origine, peuple, defi });
  appliquerTalents(s, talents);
  noter(s, texteNaissance(s, `${s.pnj.mere.nom} et ${s.pnj.pere.nom}`), "naissance");
  return s;
}

// ---------- Utilitaires d'état ----------

export const age = s => Math.floor((s.jour - s.perso.naissance) / 365);
export const annee = s => Math.floor(s.jour / 365) + 1;
export const jourDansAnnee = s => (s.jour % 365) + 1;
export function noter(s, texte, type = "recit") {
  s.journal.push({ jour: s.jour, heure: s.heure, texte, type });
  if (s.journal.length > 400) s.journal.splice(0, s.journal.length - 400);
}
function souvenir(s, id, texte) {
  const p = s.pnj[id];
  p.souvenirs.push({ jour: s.jour, texte });
  if (p.souvenirs.length > 20) p.souvenirs.shift();
}
export { souvenir, transferer, gagnerStat, gagnerCompetence, blesser, res };
export const blessureActive = s => s.sante.blessures.length > 0;
const blessureGrave = s => s.sante.blessures.some(b => b.gravite >= 2);
// Appelée très souvent : boucle simple, avec un petit cache tant que rien ne change (même jour, heure, lieu, nombre d'habitants).
let cacheIci = { s: null, cle: "", res: [] };
export function pnjIci(s) {
  if (s.prison) return [];
  const cle = `${s.jour}|${s.heure}|${s.lieu}|${Object.keys(s.pnj).length}|${s.famille?.partenaire}`;
  if (cacheIci.s === s && cacheIci.cle === cle) return cacheIci.res.slice();
  const res = [];
  for (const id in s.pnj) {
    const p = s.pnj[id];
    if (p.lieu !== s.lieu && p.lieu !== "equipage") continue;
    if (p.presente === false || p.invisible || p.vivant === false) continue;
    if (p.naissance != null && p.naissance > s.jour) continue;
    if (s.chrono && !presentSelonCanon(s, id)) continue;
    res.push(id);
  }
  cacheIci = { s, cle, res };
  return res.slice();
}
export const agePnj = (s, id) => s.pnj[id].naissance == null ? null : Math.floor((s.jour - s.pnj[id].naissance) / 365);
const il = p => (p.genre === "f" ? "elle" : p.genre === "g" ? "il" : "iel");
const Il = p => il(p)[0].toUpperCase() + il(p).slice(1);

// Anciennes sauvegardes (version 1) : ajout des îles, des nouveaux habitants et de la famille.
export function migrer(s) {
  // Idempotente : complète tout ce qui manque, quelle que soit la version d'origine.
  const neufs = PNJ_INITIAUX();
  for (const [id, p] of Object.entries(neufs)) {
    if (!s.pnj[id]) s.pnj[id] = { ...p, naissance: p.naissance != null ? s.perso.naissance + p.naissance : undefined };
    else s.pnj[id].genre ??= p.genre;
  }
  s.pnj.dock ??= { nom: "Compagnie des docks", role: "employeur des quais", lieu: null, relation: 0, fonds: 20000, souvenirs: [], invisible: true };
  s.ile ??= "fuchsia";
  s.carriere ??= null;
  s.famille ??= { partenaire: null, statut: null, enfants: [], grossesse: null };
  s.generation ??= 1; s.ancetres ??= [];
  s.inventaire.sabre ??= 0; s.inventaire.bague ??= 0;
  s.inventaire.fruits ??= []; s.fruit ??= null; s.navire ??= null; s.prime ??= 0; s.infamie ??= 0; s.prison ??= null;
  s.monde.fruitsTrouves ??= [];
  s.haki ??= { observation: 0, armement: 0, rois: 0, eveil: { observation: false, armement: false, rois: false }, progres: { observation: 0, armement: 0 }, roisInne: rand(s) < 0.03 };
  s.inventaire.logpose ??= 0; s.inventaire.logpose_nm ??= 0;
  s.pnj.tomas.stock.barque ??= 2; if (s.pnj.barro) s.pnj.barro.stock.caravelle ??= 1;
  initialiserMonde(s, { parents: false });
  initialiserEvenements(s);
  initialiserChronologie(s);
  initialiserVie(s);
  s.talents ??= [];
  initialiserTerre(s);
  if (s.prison && s.lieu === "base") s.lieu = "cellule";
  s.foyer ??= "maison"; s.origine ??= "fuchsia"; s.peuple ??= "humain"; s.defi ??= "aucun"; s.succes ??= {};
  s.version = VERSION;
  return s;
}
function transferer(s, de, vers, montant) {
  // Transfert sans création ni destruction d'argent (G.5D).
  const src = de === "joueur" ? s : s.pnj[de];
  const dst = vers === "joueur" ? s : s.pnj[vers];
  const kSrc = de === "joueur" ? "berrys" : "fonds";
  const kDst = vers === "joueur" ? "berrys" : "fonds";
  if (src[kSrc] < montant) return false;
  src[kSrc] -= montant; dst[kDst] += montant;
  return true;
}
export function masseMonetaire(s) {
  return s.berrys + Object.values(s.pnj).reduce((t, p) => t + p.fonds, 0)
    + s.missions.reduce((t, m) => t + (m.sequestre || 0), 0) + s.monde.exterieur;
}

// ---------- Temps ----------

function consommer(s, heures, fatigue) {
  s.heure += heures;
  s.fatigue = Math.min(100, s.fatigue + Math.round(fatigue * facteurFatigue(s)));
}
function tempsDisponible(s, heures) { return s.heure + heures <= 8 + JOUR_HEURES; }

// Un jour qui passe : guérison, monde autonome, missions. Retourne les événements importants.
function passerJour(s, { recuperation = 70 } = {}) {
  const importants = [];
  s.jour += 1; s.heure = 8;
  s.fatigue = Math.max(0, s.fatigue - recuperation);
  // Solde hebdomadaire de la Marine (versée par l'institution, argent venu de l'extérieur, comptabilisé).
  // La solde n'est versée qu'à un marine en service (service ou patrouille dans les 14 derniers jours) ;
  // après 90 jours d'absence, il est rayé des cadres pour désertion.
  if (s.carriere?.type === "marine") {
    const absence = s.jour - (s.carriere.dernierService ?? s.carriere.depuis);
    if (absence > 90) {
      s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
      reprendreNavire(s);
      reputation(s, "marine", -15);
      noter(s, "Absent de ton poste depuis trois mois, tu es rayé des cadres de la Marine pour désertion.", "mission");
    } else if ((s.jour - s.carriere.depuis) % 7 === 0 && absence <= 14 && !s.prison) {
      const solde = SOLDE_MARINE[s.carriere.rang];
      s.monde.exterieur -= solde; s.berrys += solde;
      noter(s, `La Marine te verse ta solde : ${solde} Berrys.`, "monde");
    }
  }
  if (s.prison && s.jour >= s.prison.jusqua) {
    // Peine purgée : la dette envers la justice est payée, l'avis de recherche est retiré.
    s.prison = null; s.lieu = "port_shells"; s.infamie = 0; s.prime = 0;
    importants.push({ type: "liberation", texte: "Tu as purgé ta peine : la Marine te relâche sur le port de Shells Town et retire ton avis de recherche." });
    noter(s, "Libéré de prison. Ta prime est annulée.", "mission");
  }
  // Naissance d'un enfant.
  const g = s.famille?.grossesse;
  if (g && s.jour >= g.terme) {
    const prenoms = ["Ace", "Lou", "Maya", "Taro", "Noé", "Rin", "Elio", "Kim", "Sana", "Yuri"];
    const enfant = { prenom: prenoms[Math.floor(rand(s) * prenoms.length)], naissance: s.jour, genre: rand(s) < 0.5 ? "f" : "g" };
    s.famille.enfants.push(enfant); s.famille.grossesse = null;
    importants.push({ type: "naissance_enfant", texte: `Ton enfant ${enfant.prenom} est né${enfant.genre === "f" ? "e" : ""} !` });
    noter(s, `Naissance de ton enfant, ${enfant.prenom}.`, "famille");
    s.humeur = Math.min(100, (s.humeur || 0) + 40);
  }
  // Guérison automatique pendant le temps simulé (K.2A) ; séquelle possible pour les blessures graves.
  for (const b of s.sante.blessures) b.jours -= 1;
  for (const b of s.sante.blessures.filter(b => b.jours <= 0)) {
    noter(s, `Ta blessure (${b.nom}) est guérie.`, "sante");
    if (b.sequelle) { s.sante.sequelles.push(b.sequelle); noter(s, `Il te reste une séquelle : ${b.sequelle}.`, "sante"); }
  }
  s.sante.blessures = s.sante.blessures.filter(b => b.jours > 0);
  // Monde autonome.
  s.monde.meteo = rand(s) < 0.2 ? "pluie" : rand(s) < 0.05 ? "tempête" : "beau";
  const ilda = s.pnj.ilda;
  const cycle = s.jour % 12;
  const presente = cycle < 7;
  if (presente !== ilda.presente) {
    ilda.presente = presente;
    if (!presente) noter(s, "Ilda, la marchande ambulante, a quitté le village pour sa tournée.", "monde");
    else { ilda.stock.clou = Math.max(ilda.stock.clou, 60); noter(s, "Ilda est revenue au village avec de nouvelles marchandises.", "monde"); }
  }
  if (s.jour >= s.monde.prochainNavire) {
    s.monde.prochainNavire = s.jour + 15 + Math.floor(rand(s) * 15);
    // Commerce extérieur : le navire achète le poisson de Bern (argent venu de l'extérieur, comptabilisé).
    const vente = 100 + Math.floor(rand(s) * 100);
    if (s.pnj.bern.vivant !== false && !s.pnj.bern.ferme) { s.monde.exterieur -= vente; s.pnj.bern.fonds += vente; }
    s.pnj.tomas.stock.planche += 10;
    importants.push({ type: "navire", texte: "Un navire marchand entre dans le port de Fuchsia." });
    noter(s, "Un navire marchand accoste. Bern lui vend sa pêche, et Tomas reçoit du bois.", "monde");
  }
  s.monde.voyouAuPort = s.ile === "fuchsia" && age(s) >= 12 && rand(s) < 0.06;
  if (s.monde.voyouAuPort && s.lieu === "port") noter(s, "Un voyou de passage traîne au port et cherche des ennuis.", "monde");
  // Missions : échéances.
  verifierMissions(s, importants);
  // Proposition de mission par le maire (conditions réelles : toit abîmé, fonds suffisants, âge).
  if (s.ile === "fuchsia" && s.monde.toitRemise === "abîmé" && age(s) >= 12 && !s.missions.some(m => m.code === "toit" && ["proposée", "active"].includes(m.statut))
      && s.pnj.woop.fonds >= 500 && s.pnj.woop.vivant !== false && s.pnj.woop.naissance <= s.jour - 20 * 365 && rand(s) < 0.15) {
    s.missions.push({
      id: `m${s.jour}`, code: "toit", donneur: "woop", titre: "Réparer le toit de la remise du maire",
      condition: "Le toit de la remise est réparé avant la fin de l'échéance.",
      cloture: "Échéance : 3 jours après l'acceptation.", duree: 3, recompense: 500, statut: "proposée", jour: s.jour,
    });
    importants.push({ type: "mission", texte: "Le maire Woop Slap te cherche : il a une proposition de travail." });
  }
  // Le reste du monde vit sa vie : habitants, équipages rivaux, officiers, nouvelles.
  avancerChronologie(s);
  vieDuMonde(s);
  if (declencherEvenement(s)) importants.push({ type: "evenement", texte: "Un événement demande ta décision." });
  verifierAmbition(s);
  vieFactions(s);
  vieInterieure(s);
  verifierSucces(s);
  anniversaireTalents(s);
  vieEquipage(s);
  vieATerre(s);
  // Vieillissement et mortalité crédible (simplifiée) après 70 ans.
  if (age(s) - decalageAge(s) >= 70 && jourDansAnnee(s) === 1 && rand(s) < (age(s) - decalageAge(s) - 65) * 0.02) {
    s.perso.vivant = false;
    importants.push({ type: "mort", texte: "Ta vie s'achève paisiblement à Fuchsia." });
    noter(s, `${s.perso.prenom} s'éteint à ${age(s)} ans.`, "mort");
  }
  if (jourDansAnnee(s) === 1) noter(s, `Tu as maintenant ${age(s)} an${age(s) > 1 ? "s" : ""}.`, "age");
  return importants;
}

// Condition de réussite binaire, fixée avant l'acceptation (L.3A, Q-résolution 1).
function missionAccomplie(s, m) {
  if (m.code === "toit") return s.monde.toitRemise === "réparé";
  if (m.code === "livraison") return s.ile === m.dest && s.inventaire.colis > 0;
  return !!m.fait; // chasse, sauvetage : action « accomplir » réussie sur le lieu prévu
}
function verifierMissions(s, importants) {
  for (const m of s.missions.filter(m => m.statut === "active")) {
    const d = s.pnj[m.donneur];
    if (missionAccomplie(s, m)) {
      if (m.code === "livraison") s.inventaire.colis -= 1;
      // Verdict automatique binaire (L.3A) et récompense automatique depuis le séquestre (L.4A).
      s.berrys += m.sequestre; m.sequestre = 0; m.statut = "réussie"; m.fin = s.jour;
      if (d) { d.relation += 10; souvenir(s, m.donneur, `tu as tenu parole : ${m.titre.toLowerCase()}`); }
      noter(s, `Mission réussie : ${m.titre}. Tu reçois ${m.recompense} Berrys.`, "mission");
      importants?.push({ type: "mission_finie", texte: `Mission réussie : ${m.recompense} Berrys reçus.` });
    } else if (s.jour > m.echeance) {
      if (d && d.vivant !== false) d.fonds += m.sequestre; else s.monde.exterieur += m.sequestre;
      m.sequestre = 0; m.statut = "échouée"; m.fin = s.jour;
      if (m.code === "livraison" && s.inventaire.colis > 0) s.inventaire.colis -= 1;
      if (d) { d.relation -= 5; souvenir(s, m.donneur, `tu n'as pas tenu parole : ${m.titre.toLowerCase()}`); }
      noter(s, `Mission échouée : ${m.titre}. L'échéance est passée.`, "mission");
      importants?.push({ type: "mission_finie", texte: "Mission échouée : l'échéance est passée." });
    }
  }
}

// Ellipse : avance de n jours, interrompue par un événement important (01.3C).
export function avancer(s, jours, { recuperation, sansInterruption = false } = {}) {
  if (!s.perso.vivant) return res(false, "Cette vie est terminée.");
  if (s.combat) return res(false, "Tu es en plein combat : le temps n'avance pas.");
  const debut = s.jour;
  let interruption = null;
  for (let i = 0; i < jours; i++) {
    const evts = passerJour(s, { recuperation });
    if (!s.perso.vivant) { interruption = evts.find(e => e.type === "mort"); break; }
    if (sansInterruption) continue;
    // Seuls les événements qui demandent une décision interrompent l'ellipse (01.3C) ;
    // l'arrivée d'un navire est notée au journal sans arrêter le temps.
    const imp = evts.find(e => ["mission", "mort", "naissance_enfant", "liberation", "evenement"].includes(e.type));
    const fin = evts.find(e => e.type === "mission_finie");
    if (imp || fin) { interruption = imp || fin; break; }
  }
  const n = s.jour - debut;
  const txt = n === 1 ? "Une journée passe." : `${n} jours passent.`;
  noter(s, txt + (interruption ? ` ${interruption.texte}` : ""), "ellipse");
  return res(true, txt + (interruption ? ` Interruption : ${interruption.texte}` : ""), { interruption, jours: n });
}

function res(ok, texte, extra = {}) { return { ok, texte, ...extra }; }

// ---------- Actions disponibles (suggestions contextuelles) ----------

function actionsHaki(s) {
  const a = [];
  if (s.haki?.eveil.observation) a.push({ id: "haki", cible: "observation", label: "Méditer (Haki de l'observation)" });
  if (s.haki?.eveil.armement) a.push({ id: "haki", cible: "armement", label: "Endurcir ton corps (Haki de l'armement)" });
  if (s.haki?.eveil.rois) a.push({ id: "haki", cible: "rois", label: "Dompter ton Haki des Rois" });
  return a;
}

export function actionsDisponibles(s) {
  if (!s.perso.vivant) return [];
  if (s.combat) return actionsCombat(s);
  const a = [...choixEvenement(s)];
  for (const m of s.missions.filter(m => m.statut === "active" && m.lieu === s.lieu && !m.fait)) a.push({ id: "accomplir", label: `Mission : ${m.titre}` });
  const ag = age(s);
  const ici = pnjIci(s);
  for (const id of ici) a.push({ id: "parler", cible: id, label: `Parler à ${s.pnj[id].nom}` });
  if (s.prison) {
    return [...a, { id: "attendre", label: "Attendre (jusqu'à 30 jours)" }, { id: "evader", label: "Tenter de t'évader" },
      { id: "entrainer", cible: "force", label: "S'entraîner en cellule (force)" },
      ...(s.fruit ? [{ id: "maitriser", label: "Travailler ton pouvoir" }] : []),
      ...actionsHaki(s)];
  }
  if (ag < 6) {
    a.push({ id: "jouer", label: "Jouer dehors" });
    if (s.lieu === "bar") a.push({ id: "ecouter", label: "Écouter les histoires du bar" });
    return a;
  }
  a.push({ id: "entrainer", cible: "force", label: "S'entraîner (force)" });
  a.push({ id: "entrainer", cible: "agilite", label: "S'entraîner (agilité)" });
  a.push({ id: "entrainer", cible: "endurance", label: "Courir (endurance)" });
  a.push({ id: "etudier", label: "Lire et étudier" });
  const emploi = EMPLOIS[s.lieu];
  if (emploi && ag >= emploi.ageMin) a.push({ id: "travailler", label: emploi.label });
  if (s.lieu === "port" && s.inventaire.canne > 0) a.push({ id: "pecher", label: "Pêcher" });
  for (const [k, o] of Object.entries(OBJETS)) {
    if (o.vendeur && ici.includes(o.vendeur) && (s.pnj[o.vendeur].stock?.[k] ?? 0) > 0 && ag >= 10 && !(o.navire && s.navire && NAVIRES[s.navire.type].capacite >= NAVIRES[k].capacite))
      a.push({ id: "acheter", cible: k, label: `Acheter ${["planche", "canne", "bague", "barque", "caravelle"].includes(k) ? "une" : k === "logpose" ? "un" : "un"} ${o.nom} (${o.prix} B)` });
  }
  if (s.lieu === "remise" && s.monde.toitRemise === "abîmé") a.push({ id: "reparer", label: "Réparer le toit (3 planches, 6 clous)" });
  if (s.lieu === "port" && s.monde.voyouAuPort) a.push({ id: "combattre", label: "Affronter le voyou" });
  if (s.lieu === "bar" && ag >= 12 && ici.includes("makino")) a.push({ id: "cuisiner", label: "Aider Makino en cuisine" });
  if (EXPLORABLES.includes(s.lieu) && ag >= 8) a.push({ id: "explorer", label: "Explorer les environs" });
  for (const f of new Set(s.inventaire.fruits)) a.push({ id: "manger", cible: f, label: `Manger le ${FRUITS[f].nom}${s.fruit ? " (tu as déjà un pouvoir !)" : ""}` });
  if (s.fruit) a.push({ id: "maitriser", label: "Travailler ton pouvoir" });
  a.push(...actionsHaki(s));
  if (pnjIci(s).includes("garo") && ag >= 15 && s.pnj.garo.relation >= 30) {
    for (const t of ["observation", "armement"]) if (!s.haki.eveil[t]) a.push({ id: "initier", cible: t, label: `Leçon de ${HAKI[t].nom} avec Garo (${PRIX_LECON_HAKI} B)` });
  }
  // Toujours visible sur un port sans carrière : s'il manque quelque chose, le bouton le dit.
  if (s.lieu === ILES[s.ile].port && !s.carriere && ag >= 14) a.push({ id: "pirate", label: ag < 16 ? "Hisser le pavillon pirate (à partir de 16 ans)" : s.navire ? "Hisser le pavillon pirate" : "Hisser le pavillon pirate (il te faut un navire)" });
  if (estCapitaine(s)) {
    if (s.lieu === ILES[s.ile].port) a.push({ id: "attaquer", label: s.navire ? "Attaquer un navire marchand" : "Attaquer un navire marchand (il te faut un navire)" });
    if (TAVERNES.includes(s.lieu)) a.push({ id: "recruter", label: "Recruter un membre d'équipage" });
    if (s.lieu === ILES[s.ile].port) a.push({ id: "quitter", label: "Renoncer à la piraterie" });
  }
  if (s.lieu === "chantier" && s.navire && s.navire.coque < 100) a.push({ id: "radoub", label: `Faire réparer le navire (${(100 - s.navire.coque) * 20} B)` });
  a.push(...actionsFactions(s));
  a.push(...actionsVie(s));
  a.push(...actionsPirate(s));
  a.push(...actionsTerre(s));
  a.push(...actionsMarine(s));
  a.push(...actionsFinale(s));
  if (s.lieu === "colisee" && ag >= 18) a.push({ id: "colisee", label: "Combattre au Colisée (3 000 B si victoire)" });
  if (ici.includes("soen") && s.pnj.soen.relation >= 20) a.push({ id: "sabre", label: `Leçon de sabre avec Sōen (${PRIX_LECON_SABRE} B)` });
  if (s.lieu === "enrobage" && s.navire && !s.navire.enrobe) a.push({ id: "enrober", label: `Faire enrober le navire (${PRIX_ENROBAGE} B, 3 jours)` });
  if (s.lieu === ILES[s.ile].port && ag >= 14 && !estMembre(s)) {
    for (const [dest, j] of Object.entries(ROUTES[s.ile])) {
      const versGL = estGrandLine(dest), depuisGL = estGrandLine(s.ile);
      if (dest === "laugh_tale" && (!routeOuverte(s) || !s.navire)) continue;
      const passage = versGL && !depuisGL ? " par Reverse Mountain" : depuisGL && !versGL ? " par la Calm Belt" : "";
      a.push({ id: "voyager", cible: dest, label: s.navire ? `Naviguer vers ${ILES[dest].nom}${passage} (${j} j)` : `Embarquer pour ${ILES[dest].nom}${passage} (${j} j, ${prixPassage(s.ile, dest)} B)` });
    }
  }
  if (s.lieu === "base" && !s.carriere && ag >= 16) a.push({ id: "engager", label: "S'engager dans la Marine" });
  if (auPoste(s)) {
    a.push({ id: "service", label: "Faire son service" });
    a.push({ id: "patrouille", label: "Partir en patrouille (mission)" });
    a.push({ id: "quitter", label: "Quitter la Marine" });
  }
  // Amour et famille : seulement entre adultes, jamais imposé.
  for (const id of ici) {
    const p = s.pnj[id];
    if (!p.romance || ag < 18 || (agePnj(s, id) ?? 0) < 18) continue;
    if (s.famille.partenaire == null && p.relation >= 40) a.push({ id: "declarer", cible: id, label: `Déclarer tes sentiments à ${p.nom}` });
    if (s.famille.partenaire === id && s.famille.statut === "couple" && p.relation >= 70) a.push({ id: "mariage", cible: id, label: `Demander ${p.nom} en mariage` });
  }
  if (s.famille.partenaire && pnjIci(s).includes(s.famille.partenaire)) {
    a.push({ id: "famille", label: "Passer du temps en famille" });
    if (s.famille.statut === "marié" && !s.famille.grossesse && ag < 50) a.push({ id: "enfant", label: "Proposer d'avoir un enfant" });
  }
  for (const m of s.missions.filter(m => m.statut === "proposée" && ici.includes(m.donneur))) {
    a.push({ id: "accepter", cible: m.id, label: `Accepter : ${m.titre}` });
    a.push({ id: "refuser", cible: m.id, label: "Refuser la proposition" });
  }
  return a;
}

// ---------- Exécution d'une action ----------

export const actionExiste = id => Object.prototype.hasOwnProperty.call(ACTIONS, id);
export function agir(s, action) {
  if (!s.perso.vivant) return res(false, "Cette vie est terminée.");
  const { id, cible } = action;
  const ag = age(s);
  const f = ACTIONS[id];
  if (!f) return res(false, "Cette action n'existe pas dans le jeu.");
  if (s.combat && !id.startsWith("c_")) return res(false, `Tu es en plein combat contre ${s.combat.nom} ! Attaque, défends-toi ou fuis.`);
  if (s.prison && !["attendre", "evader", "entrainer", "etudier", "maitriser", "repos", "haki", "choisir"].includes(id)) {
    return res(false, `Tu es en prison jusqu'au jour ${s.prison.jusqua + 1}. Tu peux attendre, t'entraîner ou tenter de t'évader.`);
  }
  const r = f(s, cible, ag);
  if (r.promotion) r.texte += promotion(s);
  if (r.ok) s.compteurs.actions += 1;
  if (r.texte) noter(s, r.texte, r.ok ? "action" : "refus");
  verifierMissions(s, null);
  verifierSucces(s);
  return r;
}

function activite(s, { heures, fatigue, ageMin = 0 }) {
  // Conditions de validité (Q-résolution 3) : elles décident si l'activité a lieu, jamais du montant du gain.
  if (age(s) < ageMin) return `Tu es trop jeune pour ça (à partir de ${ageMin} ans).`;
  if (!tempsDisponible(s, heures)) return "Il est trop tard aujourd'hui. Repose-toi jusqu'à demain.";
  if (s.fatigue >= seuilFatigue(s)) return s.sante.maladies?.length ? "Ta santé ne te permet plus de forcer autant : repose-toi." : "Tu es trop fatigué : l'activité n'est pas possible. Repose-toi.";
  return null;
}
// Retourne le gain réellement obtenu (0 si la limite naturelle est atteinte).
// Les talents choisis à la création majorent ce gain d'une quantité fixe (exception D.2A-B).
function gagnerStat(s, k, gain) {
  // Plafond naturel du potentiel : au-delà, l'activité n'apporte rien, mais le gain n'est jamais réduit en dessous.
  if (s.stats[k] >= s.potentiel[k]) return 0;
  const total = gain + bonusStat(s, k);
  s.stats[k] += total; return total;
}
function gagnerCompetence(s, k, gain = 1) {
  const total = gain + bonusCompetence(s, k);
  s.competences[k] = (s.competences[k] || 0) + total;
  return total;
}

const ACTIONS = {
  ...ACTIONS_FACTIONS,
  ...ACTIONS_VIE,
  ...ACTIONS_PIRATE,
  ...ACTIONS_TERRE,
  ...ACTIONS_MARINE,
  ...ACTIONS_COMBAT,
  ...ACTIONS_FINALE,
  choisir: (s, i) => choisir(s, +i),
  accomplir: s => {
    const e = activite(s, { heures: 4, fatigue: 25, ageMin: 12 });
    if (e) return res(false, e);
    consommer(s, 4, 25);
    return accomplir(s);
  },
  aller(s, lieu) {
    if (!LIEUX[lieu]) return res(false, "Ce lieu n'existe pas.");
    if (LIEUX[lieu].cache || (lieu.startsWith("maison") && !possede(s, lieu))) return res(false, "Tu ne peux pas entrer là.");
    if (age(s) < 3) return res(false, "Tu es bien trop petit pour sortir seul. Dans quelques années !");
    if (LIEUX[lieu].ile !== s.ile) return res(false, `Ce lieu se trouve ${ILES[LIEUX[lieu].ile].a} : il faut d'abord embarquer depuis le port.`);
    if (s.lieu === lieu) return res(false, `Tu es déjà ${LIEUX[lieu].a}.`);
    if (!tempsDisponible(s, 0.5)) return res(false, "Il fait nuit. Rentre te reposer.");
    if (blessureGrave(s) && lieu === "colline") return res(false, "Ta blessure t'empêche de grimper la colline.");
    s.lieu = lieu; consommer(s, 0.5, 1);
    const ici = pnjIci(s).map(id => s.pnj[id].nom);
    const liste = ici.length > 1 ? `${ici.slice(0, -1).join(", ")} et ${ici.at(-1)}` : ici[0];
    return res(true, `Tu vas ${LIEUX[lieu].a}.${ici.length ? ` ${liste} ${ici.length > 1 ? "sont" : "est"} là.` : ""}`);
  },
  parler(s, id) {
    const p = s.pnj[id];
    if (!p || !pnjIci(s).includes(id)) return res(false, "Cette personne n'est pas ici.");
    if (!tempsDisponible(s, 1)) return res(false, "Il est trop tard pour une conversation.");
    consommer(s, 1, 3);
    p.relation += GAINS.relation_conversation + bonusRelation(s);
    const dernier = p.souvenirs[p.souvenirs.length - 1]; // souvenirs vécus avec toi
    return res(true, repliquePnj(s, id, dernier), { pnj: id });
  },
  jouer(s) {
    const e = activite(s, { heures: 2, fatigue: 15 });
    if (e) return res(false, e);
    // On progresse dans ce qui n'a pas encore atteint sa limite naturelle.
    const possibles = ["endurance", "agilite"].filter(x => s.stats[x] < s.potentiel[x]);
    if (!possibles.length) return res(false, `Tu as atteint tes limites naturelles en endurance (${s.stats.endurance}) et en agilité (${s.stats.agilite}) : jouer dehors ne te fait plus progresser. Essaie d'autres activités.`);
    consommer(s, 2, 15);
    const k = pick(s, possibles);
    const g = gagnerStat(s, k, GAINS.jeu_enfant);
    const limite = s.stats[k] >= s.potentiel[k] ? ` Tu as atteint ta limite naturelle en ${STATS[k].toLowerCase()}.` : "";
    return res(true, `Tu cours et grimpes partout avec les enfants du village. ${STATS[k]} +${g}.${limite}`);
  },
  ecouter(s) {
    const e = activite(s, { heures: 2, fatigue: 5 });
    if (e) return res(false, e);
    if (s.lieu !== "bar") return res(false, "Il faut être au bar Partys.");
    consommer(s, 2, 5);
    const g = gagnerStat(s, "intelligence", GAINS.etude);
    const makino = pnjIci(s).includes("makino");
    if (makino) s.pnj.makino.relation += GAINS.relation_conversation;
    return res(true, `Assis au comptoir, tu écoutes les marins raconter la mer.${makino ? " Makino te sert un verre de lait." : ""}${g ? ` Intelligence +${g}.` : ""}`);
  },
  entrainer(s, k) {
    if (!STATS[k]) return res(false, "Cet entraînement n'existe pas.");
    const e = activite(s, { heures: 2, fatigue: 15, ageMin: 6 });
    if (e) return res(false, e);
    if (blessureActive(s) && k !== "intelligence") return res(false, "Tu es blessé : l'entraînement physique attendra ta guérison.");
    consommer(s, 2, 15);
    // Exception B : le talent « Prodige » rend ce gain fixe plus grand, jamais variable.
    const g = gagnerStat(s, k, GAINS.entrainement);
    if (!g) return res(false, `Tu as atteint ta limite naturelle en ${STATS[k].toLowerCase()} (${s.stats[k]}) : cet entraînement ne te fait plus progresser.`);
    return res(true, `Tu t'entraînes dur. ${STATS[k]} +${g}.`);
  },
  etudier(s) {
    const e = activite(s, { heures: 2, fatigue: 8, ageMin: 6 });
    if (e) return res(false, e);
    consommer(s, 2, 8);
    const g = gagnerStat(s, "intelligence", GAINS.etude);
    return res(true, `Tu lis et apprends.${g ? ` Intelligence +${g}.` : ""}`);
  },
  travailler(s) {
    const e0 = EMPLOIS[s.lieu];
    if (!e0) return res(false, "Il n'y a pas de travail ici.");
    const e = activite(s, { heures: e0.heures, fatigue: e0.fatigue, ageMin: e0.ageMin });
    if (e) return res(false, e);
    if (blessureGrave(s)) return res(false, "Ta blessure t'empêche de travailler.");
    const payeur = s.pnj[e0.payeur];
    if (payeur.vivant === false || payeur.ferme) return res(false, "Il n'y a plus personne pour t'employer ici.");
    if (payeur.fonds < e0.salaire) return res(false, `${payeur.nom} n'a plus de quoi te payer en ce moment.`);
    consommer(s, e0.heures, e0.fatigue);
    transferer(s, e0.payeur, "joueur", e0.salaire);
    // Talent « Sens des affaires » : 10 Berrys de plus, payés par l'employeur s'il le peut (rien n'est créé).
    let prime = Math.min(bonusSalaire(s), payeur.fonds);
    if (prime > 0) transferer(s, e0.payeur, "joueur", prime);
    // Titre de métier : prime fixe du titre, payée par l'employeur s'il le peut.
    const metier = journeeDeMetier(s, s.lieu, payeur);
    if (metier.prime > 0) { transferer(s, e0.payeur, "joueur", metier.prime); prime += metier.prime; }
    s.compteurs.salaires = (s.compteurs.salaires || 0) + 1;
    let gain = "";
    if (e0.competence) gain = ` ${COMPETENCES[e0.competence]} +${gagnerCompetence(s, e0.competence)}.`;
    else { const g = gagnerStat(s, e0.stat, GAINS.entrainement); if (g) gain = ` ${STATS[e0.stat]} +${g}.`; }
    if (!payeur.invisible) { payeur.relation += GAINS.relation_aide; souvenir(s, e0.payeur, "tu as bien travaillé pour lui"); }
    return res(true, `${e0.texte} Tu gagnes ${e0.salaire + prime} Berrys.${gain}${metier.texte}`);
  },
  pecher(s) {
    if (s.lieu !== "port") return res(false, "On pêche au port.");
    if (s.inventaire.canne < 1) return res(false, "Il te faut une canne à pêche.");
    const e = activite(s, { heures: 3, fatigue: 10, ageMin: 8 });
    if (e) return res(false, e);
    consommer(s, 3, 10);
    const gp = gagnerCompetence(s, "peche", GAINS.peche);
    const pris = rand(s) < 0.3 + s.competences.peche * 0.02 ? 1 + Math.floor(rand(s) * 3) : 0;
    s.inventaire.poisson += pris;
    return res(true, `Tu pêches au bout du quai. ${pris ? `Tu attrapes ${pris} poisson${pris > 1 ? "s" : ""}.` : "Rien ne mord aujourd'hui."} Pêche +${gp}.`);
  },
  cuisiner(s) {
    if (s.lieu !== "bar") return res(false, "Il faut être au bar Partys.");
    if (!pnjIci(s).includes("makino")) return res(false, "Il n'y a personne à aider en cuisine en ce moment.");
    const e = activite(s, { heures: 3, fatigue: 12, ageMin: 12 });
    if (e) return res(false, e);
    consommer(s, 3, 12);
    const gc = gagnerCompetence(s, "cuisine");
    s.pnj.makino.relation += GAINS.relation_aide;
    souvenir(s, "makino", "tu l'as aidée en cuisine");
    return res(true, `Tu aides Makino en cuisine pendant le service. Cuisine +${gc}.`);
  },
  acheter(s, objet) {
    const o = OBJETS[objet];
    if (!o || !o.vendeur) return res(false, "Personne ne vend ça ici.");
    const v = s.pnj[o.vendeur];
    if (!pnjIci(s).includes(o.vendeur)) return res(false, `${v.nom} n'est pas ici.`);
    if ((v.stock?.[objet] ?? 0) < 1) return res(false, `${v.nom} n'en a plus en stock.`);
    if (s.berrys < o.prix) return res(false, `Il te faut ${o.prix} Berrys ; tu en as ${s.berrys}.`);
    if (objet === "barque" && s.peuple === "geant") return res(false, "Une barque ? Elle coulerait sous ton poids. Il te faut au moins une caravelle.");
    if (o.navire && s.navire && NAVIRES[s.navire.type].capacite >= NAVIRES[objet].capacite) return res(false, "Tu as déjà un navire au moins aussi grand.");
    transferer(s, "joueur", o.vendeur, o.prix);
    v.stock[objet] -= 1;
    if (o.navire) {
      s.navire = { type: objet, nom: s.navire?.nom || `Le ${["Goéland", "Vent d'Aube", "Petit Espoir", "Mouette Rieuse"][Math.floor(rand(s) * 4)]}`, coque: 100 };
      return res(true, `Tu achètes une ${o.nom} à ${v.nom} pour ${o.prix} Berrys. Tu la baptises « ${s.navire.nom} ». Tu peux désormais prendre la mer gratuitement, et accueillir jusqu'à ${NAVIRES[objet].capacite} membres d'équipage.`);
    }
    s.inventaire[objet] += 1;
    return res(true, `Tu achètes un${objet === "planche" || objet === "canne" ? "e" : ""} ${o.nom} à ${v.nom} pour ${o.prix} Berrys.`);
  },
  reparer(s) {
    // Fabrication instantanée si les ressources réelles sont là (I.5A, Q-résolution 5).
    if (s.lieu !== "remise") return res(false, "Il faut être devant la remise du maire.");
    if (s.monde.toitRemise !== "abîmé") return res(false, "Le toit est déjà réparé.");
    if (age(s) < 10) return res(false, "Tu es trop jeune pour grimper sur un toit.");
    const manque = [];
    if (s.inventaire.planche < 3) manque.push(`${3 - s.inventaire.planche} planche(s)`);
    if (s.inventaire.clou < 6) manque.push(`${6 - s.inventaire.clou} clou(s)`);
    if (manque.length) return res(false, `Impossible : il te manque ${manque.join(" et ")}.`);
    s.inventaire.planche -= 3; s.inventaire.clou -= 6;
    s.monde.toitRemise = "réparé";
    const gch = gagnerCompetence(s, "charpenterie", GAINS.charpenterie);
    consommer(s, 0, 5);
    return res(true, `Tu répares le toit de la remise avec 3 planches et 6 clous. Charpenterie +${gch}.`);
  },
  combattre(s) {
    if (s.lieu !== "port" || !s.monde.voyouAuPort) return res(false, "Il n'y a personne à affronter ici.");
    const e = activite(s, { heures: 1, fatigue: 20, ageMin: 12 });
    if (e) return res(false, e);
    consommer(s, 1, 20);
    s.monde.voyouAuPort = false;
    return engagerCombat(s, { type: "voyou", nom: "le voyou", force: 6 + rand(s) * 9, intro: "Tu fais face au voyou qui terrorise le port." });
  },
  accepter(s, mid) {
    const m = s.missions.find(m => m.id === mid && m.statut === "proposée");
    if (!m) return res(false, "Cette proposition n'existe plus.");
    // Séquestre de la récompense avant engagement (Q-résolution 2).
    if (!pnjIci(s).includes(m.donneur)) return res(false, "Il faut être en face de la personne pour accepter.");
    if (s.pnj[m.donneur].fonds < m.recompense) {
      return res(false, `${s.pnj[m.donneur].nom} n'a plus les fonds : la mission ne peut pas être garantie.`);
    }
    s.pnj[m.donneur].fonds -= m.recompense; m.sequestre = m.recompense;
    m.statut = "active"; m.echeance = s.jour + m.duree;
    if (m.code === "livraison") s.inventaire.colis = (s.inventaire.colis || 0) + 1;
    souvenir(s, m.donneur, `tu as accepté de l'aider : ${m.titre.toLowerCase()}`);
    return res(true, `Tu acceptes. ${s.pnj[m.donneur].nom} met ${m.recompense} Berrys de côté pour toi. Condition : ${m.condition} Échéance : fin du jour ${m.echeance + 1}.`);
  },
  refuser(s, mid) {
    const m = s.missions.find(m => m.id === mid && m.statut === "proposée");
    if (!m) return res(false, "Cette proposition n'existe plus.");
    m.statut = "refusée";
    return res(true, `Tu déclines la proposition de ${s.pnj[m.donneur].nom}.`);
  },
  repos(s) {
    if (s.prison) { const r = avancer(s, 1); return res(true, `Tu dors sur la paillasse de ta cellule. ${r.texte}`, { interruption: r.interruption }); }
    const lit = ILES[s.ile].auberge;
    const lieuAvant = s.lieu;
    let recuperation = 70, txt;
    // Les hommes-poissons paient trois fois plus cher à Sabaody : les préjugés y sont tenaces.
    const prix = PRIX_AUBERGE * (s.peuple === "homme_poisson" && s.ile === "sabaody" ? 3 : s.peuple === "geant" && s.ile !== "elbaf" ? 2 : 1);
    const chezSoi = LIEUX[s.foyer || "maison"].ile === s.ile ? (s.foyer || "maison") : (maisonIci(s) && possede(s, maisonIci(s)) ? maisonIci(s) : null);
    if (chezSoi) { s.lieu = chezSoi; txt = "Tu rentres dormir chez toi."; }
    else if (s.berrys >= prix) {
      s.lieu = lit; transferer(s, "joueur", "dock", prix);
      txt = `Tu paies ${prix} Berrys pour une nuit ${LIEUX[lit].a}${prix > PRIX_AUBERGE ? " (le triple, parce que tu es un homme-poisson)" : ""}.`;
    } else { s.lieu = lit; recuperation = 35; txt = "Sans argent pour une chambre, tu dors dehors. Tu récupères mal."; }
    // Au réveil, tu reprends là où tu étais la veille (sauf si la nuit a tout changé : prison, mort…).
    const ileAvant = s.ile;
    const r = avancer(s, 1, { recuperation });
    if (s.perso.vivant && !s.prison && s.ile === ileAvant && LIEUX[lieuAvant]?.ile === s.ile) s.lieu = lieuAvant;
    const retour = s.lieu === lieuAvant && lieuAvant !== (s.foyer || "maison") && lieuAvant !== lit ? ` Au matin, tu retournes ${LIEUX[lieuAvant].a}.` : "";
    return res(true, `${txt} ${r.texte}${retour}`, { interruption: r.interruption });
  },
  voyager(s, dest) {
    if (!ILES[dest] || dest === s.ile || !(dest in ROUTES[s.ile])) return res(false, "Cette destination n'est pas accessible d'ici.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "Les navires partent du port.");
    if (age(s) < 14) return res(false, "Tu es trop jeune pour embarquer seul (à partir de 14 ans).");
    if (estMembre(s)) return res(false, `Tu fais partie des ${s.carriere.equipage} : tu navigues avec eux. Pour partir seul, quitte d'abord l'équipage.`);
    const versGL = estGrandLine(dest), depuisGL = estGrandLine(s.ile);
    const nage = s.peuple === "homme_poisson" && !s.fruit && [s.ile, dest].includes("hommes_poissons") && [s.ile, dest].includes("sabaody");
    // Sans navire, on voyage comme passager : le capitaine du navire de passage a ses cartes, son Log Pose et son enrobage.
    const passager = !s.navire && !nage;
    if (dest === "laugh_tale") {
      if (!routeOuverte(s)) return res(false, "Personne ne connaît cette route. Il faudrait l'empreinte des quatre Ponéglyphes de route.");
      if (passager) return res(false, "Aucun navire de passage ne va là-bas : il te faut ton propre navire.");
    }
    if (versGL && !depuisGL && age(s) < 17) return res(false, "Reverse Mountain, à ton âge ? Attends au moins tes 17 ans.");
    if (depuisGL && versGL && !passager && s.inventaire.logpose < 1 && !(nage && !s.navire)) return res(false, "Sans Log Pose, impossible de naviguer sur Grand Line : les boussoles y sont folles. Le gardien du phare en vend.");
    if (dest === "hommes_poissons" && s.peuple !== "homme_poisson" && !passager && !s.navire.enrobe) return res(false, "Pour plonger à 10 000 mètres, le navire doit être enrobé (atelier de Hal, à Sabaody).");
    if ((ILES[dest].nouveauMonde || ILES[s.ile].nouveauMonde) && !passager && s.inventaire.logpose_nm < 1) return res(false, "Dans le Nouveau Monde, un Log Pose ordinaire s'affole : il faut le Log Pose à trois aiguilles. Coral en vend, à l'île des Hommes-Poissons.");
    const jours = ROUTES[s.ile][dest];
    const prix = passager ? prixPassage(s.ile, dest) : 0;
    if (s.berrys < prix) return res(false, `La traversée coûte ${prix} Berrys ; tu en as ${s.berrys}.`);
    s.berrys -= prix; s.monde.exterieur += prix;
    const depart = ILES[s.ile].nom;
    const textes = [];
    // Passages dangereux : la montée de Reverse Mountain, ou la Calm Belt et ses rois des mers.
    if (versGL && !depuisGL || depuisGL && !versGL) {
      const calm = depuisGL;
      let risque = calm ? 0.35 : 0.25;
      if (navigue(s)) risque -= 0.12;
      if (s.navire?.type === "caravelle") risque -= 0.05;
      if (aVoiles(s)) risque -= 0.05;
      if (rand(s) < risque) return naufrage(s, calm ? "dans la Calm Belt, renversé par un roi des mers" : "contre les parois de Reverse Mountain", calm ? "loguetown" : "cap");
      textes.push(calm ? "Vous traversez la Calm Belt sans vent, en retenant votre souffle au-dessus des rois des mers endormis." : "Le courant vous aspire vers le sommet de Reverse Mountain, puis vous dévalez de l'autre côté jusqu'à Grand Line !");
    }
    // Descente sous-marine et entrée de Wano : deux passages redoutables.
    if (nage && !s.navire) {
      avancer(s, ROUTES[s.ile][dest], { sansInterruption: true });
      s.ile = dest; s.lieu = ILES[dest].port;
      return res(true, `Tu plonges et nages ${ILES[dest].a}, à travers les profondeurs que tu connais si bien.`);
    }
    if (dest === "hommes_poissons" && s.ile === "sabaody") {
      if (rand(s) < (navigue(s) ? 0.08 : 0.15)) return naufrage(s, "dans les profondeurs, la bulle crevée par un courant descendant", "sabaody");
      textes.push("La bulle plonge dans les abysses : lumières des poissons des profondeurs, ombres de rois des mers, puis la lueur d'un royaume sous-marin.");
    }
    if (dest === "wano") {
      if (rand(s) < (navigue(s) ? 0.18 : 0.3)) return naufrage(s, "au pied des cascades qui défendent Wano", "dressrosa");
      textes.push("Une carpe géante, un courant furieux, puis l'ascension d'une cascade vertigineuse : Wano s'ouvre devant vous.");
    }
    // Les jours de mer passent réellement : le monde continue, les blessures guérissent.
    for (let j = 0; j < jours; j++) {
      avancer(s, 1, { sansInterruption: true });
      if (!s.perso.vivant) return res(true, "Ta vie s'achève en mer.");
      if (s.navire && (versGL || depuisGL)) {
        // Sur Grand Line, la mer use la coque ; un charpentier de bord répare en route.
        let usure = 2 + Math.floor(rand(s) * 5);
        if (rand(s) < (navigue(s) ? 0.04 : 0.1) * (aVoiles(s) ? 0.5 : 1)) { usure += 20; textes.push("Une tempête soudaine malmène le navire."); }
        if (aRole(s, "charpentier de bord")) usure = Math.max(0, usure - 4);
        if (aBlindage(s)) usure = Math.floor(usure / 2);
        s.navire.coque = Math.max(0, s.navire.coque - usure);
        if (s.navire.coque <= 0) return naufrage(s, "en pleine mer, la coque disloquée", dest);
      }
      if (s.prime > 0 && !marineIgnore(s) && !estMembre(s) && rand(s) < Math.min(0.25, 0.03 * s.infamie)) {
        const r = combatMarine(s, "en mer");
        if (s.prison || !s.perso.vivant) return r;
        noter(s, r.texte, "action");
      }
    }
    s.ile = dest; s.lieu = ILES[dest].port;
    noter(s, `Tu débarques ${ILES[dest].a}, ${ILES[dest].desc}.`, "voyage");
    let txt = `Tu quittes ${depart}${s.navire ? ` à bord du « ${s.navire.nom} »` : ""}. ${textes.join(" ")} Après ${jours} jours de mer, tu arrives ${ILES[dest].a}.${s.navire && (versGL || depuisGL) ? ` Coque : ${s.navire.coque}/100.` : ""}`;
    // Shells Town abrite une base de la Marine : un pirate recherché y est vite repéré.
    if (dest === "shells" && s.prime > 0 && !marineIgnore(s) && rand(s) < 0.6) {
      const r = combatMarine(s, "sur le port de Shells Town");
      txt += ` ${r.texte}`;
    }
    return res(true, txt.replace(/\s+/g, " "));
  },
  radoub(s) {
    if (s.lieu !== "chantier") return res(false, "Seul le chantier naval de Water Seven répare les navires.");
    if (!s.navire) return res(false, "Tu n'as pas de navire.");
    const manque = 100 - s.navire.coque;
    if (manque <= 0) return res(false, "Ta coque est en parfait état.");
    const prix = manque * 20;
    if (s.berrys < prix) return res(false, `Bolt : « ${prix} Berrys pour tout remettre à neuf. Reviens avec l'argent. »`);
    transferer(s, "joueur", "bolt", prix);
    s.navire.coque = 100;
    return res(true, `Les charpentiers de Bolt remettent « ${s.navire.nom} » à neuf pour ${prix} Berrys. Coque : 100/100.`);
  },
  colisee(s) {
    if (s.lieu !== "colisee") return res(false, "Les combats ont lieu au Colisée de Dressrosa.");
    const e = activite(s, { heures: 6, fatigue: 50, ageMin: 18 });
    if (e) return res(false, e);
    if (blessureActive(s)) return res(false, "Rocco : « Pas de blessés dans l'arène. Reviens guéri. »");
    if (!s.pnj.rocco || s.pnj.rocco.vivant === false || s.pnj.rocco.fonds < 3000) return res(false, "Le Colisée n'a plus de quoi payer ses champions : pas de combat aujourd'hui.");
    consommer(s, 6, 50);
    return engagerCombat(s, { type: "colisee", nom: "le champion du bloc", force: 45 + rand(s) * 35, intro: "Sous les cris de la foule, tu entres dans l'arène." });
  },
  sabre(s) {
    if (!pnjIci(s).includes("soen")) return res(false, "Seul Sōen, au dojo de Wano, enseigne cette voie.");
    if (s.pnj.soen.relation < 20) return res(false, "Sōen : « Un étranger ? Montre d'abord que tu es digne. »");
    if (s.berrys < PRIX_LECON_SABRE) return res(false, `Une leçon coûte ${PRIX_LECON_SABRE} Berrys.`);
    const e = activite(s, { heures: 4, fatigue: 35, ageMin: 14 });
    if (e) return res(false, e);
    consommer(s, 4, 35);
    transferer(s, "joueur", "soen", PRIX_LECON_SABRE);
    const gco = gagnerCompetence(s, "combat");
    // La voie du sabre de Wano mène au Haki de l'armement (progression fixe, D.2A).
    let txt = `Des heures de katas sous le regard de Sōen. Combat +${gco}.`;
    const gh = 1 + bonusHaki(s);
    if (s.haki.eveil.armement) { s.haki.armement += gh; txt += ` Haki de l'armement +${gh}.`; }
    else {
      s.haki.progres.armement += gh;
      if (s.haki.progres.armement >= SEUIL_EVEIL) {
        s.haki.eveil.armement = true; s.haki.armement = Math.max(1, s.haki.armement);
        noter(s, "Éveil du Haki de l'armement.", "mission");
        txt += " Ta lame se couvre d'un voile noir : le Haki de l'armement s'éveille en toi !";
      } else txt += ` Éveil de l'armement : ${s.haki.progres.armement}/${SEUIL_EVEIL}.`;
    }
    return res(true, txt);
  },
  enrober(s) {
    if (s.lieu !== "enrobage") return res(false, "L'enrobage se fait à l'atelier de Hal, à Sabaody.");
    if (!s.navire) return res(false, "Tu n'as pas de navire.");
    if (s.navire.enrobe) return res(false, "Ton navire est déjà enrobé.");
    if (s.berrys < PRIX_ENROBAGE) return res(false, `Hal : « L'enrobage, c'est ${PRIX_ENROBAGE} Berrys et trois jours de travail. »`);
    transferer(s, "joueur", "hal", PRIX_ENROBAGE);
    avancer(s, 3, { sansInterruption: true });
    s.navire.enrobe = true;
    return res(true, `Pendant trois jours, Hal enveloppe « ${s.navire.nom} » d'une immense bulle de résine. Ton navire peut désormais plonger sous la Red Line, vers l'île des Hommes-Poissons et le Nouveau Monde.`);
  },
  pirate(s) {
    if (s.carriere?.type === "marine") return res(false, "Quitte d'abord la Marine.");
    if (s.carriere?.type === "pirate") return res(false, estMembre(s) ? "Tu fais déjà partie d'un équipage : fonde le tien depuis le port." : "Tu es déjà pirate.");
    if (age(s) < 16) return res(false, "Tu es trop jeune pour prendre la mer en pirate (16 ans).");
    if (!s.navire) return res(false, `Un capitaine pirate a besoin de son propre navire. Tomas vend des barques à 600 Berrys à l'atelier de Fuchsia (tu en as ${s.berrys}) ; Barro vend une caravelle à 4 000 Berrys à l'armurerie de Loguetown. Tu peux aussi rejoindre un équipage existant comme mousse.`);
    if (s.lieu !== ILES[s.ile].port) return res(false, "On hisse le pavillon depuis le port.");
    devenirCapitaine(s, null);
    return res(true, `Tu hisses un pavillon noir sur « ${s.navire.nom} ». Les ${s.carriere.equipage} sont nés. La Marine ne te connaît pas encore.`);
  },
  recruter(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine pirate recrute un équipage.");
    if (!TAVERNES.includes(s.lieu)) return res(false, "On trouve des recrues dans les tavernes et les bars.");
    if (equipage(s).length >= NAVIRES[s.navire?.type]?.capacite) return res(false, "Ton navire est plein. Une caravelle (Loguetown) accueille plus de monde.");
    const e = activite(s, { heures: 2, fatigue: 5 });
    if (e) return res(false, e);
    consommer(s, 2, 5);
    const noms = ["Dag", "Orso", "Pia", "Zeke", "Luna", "Kurt", "Moe", "Vera", "Toby", "Ines", "Rufo", "Alba"];
    const roles = [["navigateur", 3], ["cuisinier", 4], ["combattant", 9], ["canonnier", 7], ["charpentier de bord", 5], ["médecin de bord", 3], ["musicien de bord", 3]];
    const [role, fbase] = roles[Math.floor(rand(s) * roles.length)];
    const nom = noms[Math.floor(rand(s) * noms.length)];
    const chance = Math.min(0.95, 0.3 + s.stats.charisme * 0.02 + s.infamie * 0.04 + (s.haki?.eveil.rois ? 0.15 : 0));
    if (rand(s) >= chance) return res(true, `Tu proposes à ${nom}, ${role}, de rejoindre ton équipage. ${nom} refuse : ${s.prime ? "trop risqué" : "personne n'a jamais entendu parler de toi"}.`);
    const id = `r${s.jour}_${Math.floor(rand(s) * 1e6)}`;
    s.pnj[id] = { nom, role: `${role} de ton équipage`, genre: rand(s) < 0.5 ? "f" : "g", lieu: "equipage", relation: 20, fonds: 0, souvenirs: [], force: fbase + Math.floor(rand(s) * 5), membre: true };
    souvenir(s, id, "tu l'as recruté dans ton équipage");
    return res(true, `${nom}, ${role}, accepte de te suivre ! Ton équipage compte ${equipage(s).length} membre${equipage(s).length > 1 ? "s" : ""}.`);
  },
  attaquer(s) {
    if (!estCapitaine(s) || !s.navire) return res(false, estMembre(s) ? "C'est ton capitaine qui décide des abordages : pars avec l'équipage." : "Il faut être pirate et avoir un navire.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "On part à l'abordage depuis le port.");
    const e = activite(s, { heures: 8, fatigue: 40 });
    if (e) return res(false, e);
    if (blessureGrave(s)) return res(false, "Tu es trop gravement blessé pour un abordage.");
    consommer(s, 8, 40);
    s.carriere.raids += 1; s.carriere.dernierRaid = s.jour;
    const danger = ILES[s.ile].danger || 0;
    const cible = 15 + danger * 8 + rand(s) * 20;
    const nous = puissance(s) + forceEquipage(s) + bonusCanons(s) + rand(s) * 15;
    if (nous < cible) {
      moral(s, -8);
      blesser(s, rand(s) < 0.3 ? 2 : 1);
      const membres = equipage(s);
      if (membres.length && rand(s) < 0.3) { const d = membres[Math.floor(rand(s) * membres.length)]; s.pnj[d].lieu = "disparu"; noter(s, `Déçu, ${s.pnj[d].nom} quitte ton équipage.`, "monde"); }
      return res(true, `L'abordage tourne mal : l'équipage marchand vous repousse et tu es blessé.${eveilDanger(s)}`);
    }
    // Butin pris au commerce extérieur (comptabilisé) ; l'équipage reçoit sa part.
    const butin = Math.round((150 + rand(s) * 350) * (1 + equipage(s).length / 3) * (1 + danger));
    s.monde.exterieur -= butin;
    reputation(s, "pirates", 3); reputation(s, "marine", -3); reputation(s, "gouvernement", -2);
    moral(s, 6);
    if (s.carriere.corsaire) { s.carriere.corsaire = false; noter(s, "En attaquant un navire marchand, tu perds ton titre de Grand Corsaire.", "mission"); }
    const membres = equipage(s);
    const part = membres.length ? Math.floor(butin * 0.4 / membres.length) : 0;
    for (const id of membres) { s.pnj[id].fonds += part; s.pnj[id].relation += 3; }
    s.berrys += butin - part * membres.length;
    // Un abordage ordinaire ne fait monter la notoriété que peu à peu, davantage sur les mers dangereuses.
    const primeAvant = s.prime;
    notoriete(s, 0.2 * (1 + danger));
    let txt = `À l'abordage ! Le navire marchand se rend. Butin : ${butin} Berrys${membres.length ? `, dont ${part * membres.length} partagés avec l'équipage` : ""}. ${s.prime > primeAvant ? `Ta prime passe à ${s.prime.toLocaleString("fr-FR")} Berrys.` : `Ta prime reste à ${s.prime.toLocaleString("fr-FR")} Berrys : sur cette mer, ce genre de coup ne la fera plus monter.`}`;
    const reste = Object.keys(FRUITS).filter(f => !s.monde.fruitsTrouves.includes(f));
    if (reste.length && rand(s) < 0.015) {
      const f = reste[Math.floor(rand(s) * reste.length)];
      s.monde.fruitsTrouves.push(f); s.inventaire.fruits.push(f);
      txt += ` Dans la cale, un coffre contient un fruit étrange aux motifs en spirale : le ${FRUITS[f].nom} !`;
    }
    if (s.infamie >= 3 && rand(s) < 0.15) { const r = combatMarine(s, "au large"); txt += ` ${r.texte}`; }
    return res(true, txt);
  },
  explorer(s) {
    if (!EXPLORABLES.includes(s.lieu)) return res(false, "Il n'y a rien à explorer ici.");
    const e = activite(s, { heures: 3, fatigue: 15, ageMin: 8 });
    if (e) return res(false, e);
    consommer(s, 3, 15);
    const reste = Object.keys(FRUITS).filter(f => !s.monde.fruitsTrouves.includes(f));
    const danger = ILES[s.ile].danger || 0;
    if (s.lieu === "jungle" && rand(s) < 0.15) {
      blesser(s, rand(s) < 0.3 ? 2 : 1);
      return res(true, "Un dinosaure surgit des fougères géantes ! Tu t'échappes de justesse, blessé. Au loin, deux géants s'affrontent dans un fracas de tonnerre.");
    }
    // Talent « Fruit promis » : la première exploration après 12 ans trouve un fruit.
    const promis = aTalent(s, "fruit_promis") && !s.drapeaux.fruitPromis && age(s) >= 12;
    const chance = aTalent(s, "chanceux") ? 3 : 1;
    const x = rand(s) / chance;
    if (reste.length && (promis || x < 0.0007 * (1 + danger))) {
      if (promis) s.drapeaux.fruitPromis = s.jour;
      const f = reste[Math.floor(rand(s) * reste.length)];
      s.monde.fruitsTrouves.push(f); s.inventaire.fruits.push(f);
      return res(true, `Sous des racines, tu découvres un fruit étrange couvert de spirales… C'est un Fruit du Démon : le ${FRUITS[f].nom} (${FRUITS[f].type}) !`);
    }
    if (x < 0.15) {
      const n = (5 + Math.floor(rand(s) * 25)) * (1 + danger * 2);
      s.monde.exterieur -= n; s.berrys += n;
      return res(true, `En fouillant les environs, tu trouves une bourse perdue : ${n} Berrys.`);
    }
    return res(true, pick(s, ["Tu explores les environs sans rien trouver de particulier.", "Tu découvres un joli point de vue, mais rien d'autre.", "Des mouettes se moquent de toi pendant que tu fouilles."]));
  },
  manger(s, f) {
    const i = s.inventaire.fruits.indexOf(f);
    if (i < 0) return res(false, "Tu n'as pas ce fruit.");
    s.inventaire.fruits.splice(i, 1);
    if (s.fruit) {
      // Règle du monde de One Piece : deux fruits dans un même corps, c'est la mort.
      s.perso.vivant = false;
      noter(s, `${s.perso.prenom} a mangé un second Fruit du Démon. Son corps n'y a pas survécu.`, "mort");
      return res(true, "Tu croques dans un second Fruit du Démon… Ton corps se déchire de l'intérieur. Ta vie s'achève.");
    }
    s.fruit = { id: f, maitrise: 0, depuis: s.jour };
    return res(true, `Tu croques dans le ${FRUITS[f].nom}. Le goût est atroce ! Un frisson parcourt ton corps : tu peux désormais ${FRUITS[f].pouvoir}. En échange, la mer ne te portera plus jamais : tu ne sais plus nager.`);
  },
  initier(s, t) {
    if (!["observation", "armement"].includes(t)) return res(false, "Garo ne connaît pas cette voie.");
    if (!pnjIci(s).includes("garo")) return res(false, "Garo n'est pas ici. On dit qu'il loge à l'auberge de Loguetown.");
    if (age(s) < 15) return res(false, "Garo : « Reviens quand tu seras plus grand. »");
    if (s.pnj.garo.relation < 30) return res(false, "Garo : « Je ne t'apprendrai rien tant que je ne te connaîtrai pas mieux. »");
    if (s.haki.eveil[t]) return res(false, "Ce Haki est déjà éveillé : entraîne-le par toi-même.");
    if (s.berrys < PRIX_LECON_HAKI) return res(false, `Une leçon coûte ${PRIX_LECON_HAKI} Berrys.`);
    const e = activite(s, { heures: 4, fatigue: 35, ageMin: 15 });
    if (e) return res(false, e);
    consommer(s, 4, 35);
    transferer(s, "joueur", "garo", PRIX_LECON_HAKI);
    s.haki.progres[t] += 1 + bonusHaki(s); // progression fixe vers l'éveil (D.2A, exception B pour le talent)
    if (s.haki.progres[t] >= SEUIL_EVEIL) {
      s.haki.eveil[t] = true; s.haki[t] = Math.max(1, s.haki[t]);
      souvenir(s, "garo", `il t'a aidé à éveiller le ${HAKI[t].nom}`);
      noter(s, `Éveil du ${HAKI[t].nom}.`, "mission");
      return res(true, `Après des jours d'efforts, quelque chose cède en toi. Tu peux désormais ${HAKI[t].effet} : ton ${HAKI[t].nom} est éveillé !`);
    }
    const leçon = t === "observation" ? "Les yeux bandés, tu tentes d'esquiver les coups de bâton de Garo." : "Garo te fait frapper un rocher jusqu'à ce que tes poings saignent.";
    return res(true, `${leçon} « Encore ! » Éveil : ${s.haki.progres[t]}/${SEUIL_EVEIL}.`);
  },
  haki(s, t) {
    if (!HAKI[t] || !s.haki.eveil[t]) return res(false, "Ce Haki n'est pas éveillé en toi.");
    const e = activite(s, { heures: 3, fatigue: 25 });
    if (e) return res(false, e);
    consommer(s, 3, 25);
    const g = 1 + bonusHaki(s);
    s.haki[t] += g; // gain fixe (D.2A, exception B pour le talent)
    return res(true, `Tu t'exerces au ${HAKI[t].nom}. Niveau +${g} (${s.haki[t]}).`);
  },
  maitriser(s) {
    if (!s.fruit) return res(false, "Tu n'as pas de pouvoir à maîtriser.");
    const e = activite(s, { heures: 3, fatigue: 20 });
    if (e) return res(false, e);
    consommer(s, 3, 20);
    const g = 1 + bonusFruit(s);
    s.fruit.maitrise += g; // gain fixe (D.2A, exception B pour le talent)
    return res(true, `Tu t'exerces avec le pouvoir du ${FRUITS[s.fruit.id].nom}. Maîtrise +${g} (${s.fruit.maitrise}).`);
  },
  attendre(s) {
    if (!s.prison) return res(false, "Tu n'es pas en prison.");
    const r = avancer(s, Math.max(1, Math.min(30, s.prison.jusqua - s.jour)));
    return res(true, `Les jours passent derrière les barreaux. ${r.texte}`, { interruption: r.interruption });
  },
  evader(s) {
    if (!s.prison) return res(false, "Tu n'es pas en prison.");
    const e = activite(s, { heures: 4, fatigue: 30 });
    if (e) return res(false, e);
    consommer(s, 4, 30);
    if (s.stats.agilite + (s.fruit ? 6 : 0) + rand(s) * 15 >= 22) {
      s.prison = null; s.lieu = "port_shells"; s.drapeaux.evade = s.jour; s.heure = 23; // on s'évade de nuit
      notoriete(s, 0.5, { exploit: true });
      return res(true, `Tu t'évades de la base de Shells Town ! Te voilà sur le port, sans navire. Ta prime monte à ${s.prime.toLocaleString("fr-FR")} Berrys.`);
    }
    s.prison.jusqua += 20;
    blesser(s, 0);
    return res(true, "Les gardes te rattrapent. Ta peine est prolongée de 20 jours.");
  },
  engager(s) {
    if (s.lieu !== "base") return res(false, "On s'engage à la base de la Marine de Shells Town.");
    if (s.carriere) return res(false, "Tu as déjà une carrière en cours.");
    if (s.prime > 0) return res(false, "Sergent Rivo : « Un pirate recherché ? Dans la Marine ? Jamais ! »");
    if (age(s) < 16) return res(false, "La Marine n'engage qu'à partir de 16 ans.");
    if (s.stats.force + s.stats.endurance < 6) return res(false, "Sergent Rivo : « Reviens quand tu seras plus solide. » (force + endurance : 6 minimum)");
    s.carriere = { type: "marine", rang: 0, merite: 0, depuis: s.jour, poste: "shells", captures: 0 };
    reputation(s, "marine", 10); reputation(s, "gouvernement", 5);
    souvenir(s, "rivo", "tu t'es engagé dans la Marine");
    return res(true, `Tu signes ton engagement. Te voilà ${RANGS_MARINE[0]} de la Marine, avec une solde de ${SOLDE_MARINE[0]} Berrys par semaine.`);
  },
  service(s) {
    if (!auPoste(s)) return res(false, s.carriere?.type === "marine" ? `Le service se fait à ton poste, ${LIEUX[lieuPoste(s)].a}.` : "Le service se fait dans la Marine.");
    const e = activite(s, { heures: 6, fatigue: 25 });
    if (e) return res(false, e);
    consommer(s, 6, 25);
    s.carriere.merite += GAINS.merite_service; s.carriere.dernierService = s.jour;
    const gf = gagnerStat(s, "force", GAINS.entrainement);
    const gco = gagnerCompetence(s, "combat");
    return res(true, `Exercices, corvées et maniement des armes. Mérite +${GAINS.merite_service}${gf ? `, Force +${gf}` : ""}, Combat +${gco}.${promotion(s)}`);
  },
  patrouille(s) {
    if (!auPoste(s)) return res(false, s.carriere?.type === "marine" ? `Les patrouilles partent de ton poste, ${LIEUX[lieuPoste(s)].a}.` : "Il faut être dans la Marine.");
    const e = activite(s, { heures: 8, fatigue: 35 });
    if (e) return res(false, e);
    if (blessureActive(s)) return res(false, "Tu es blessé : on ne t'envoie pas en patrouille.");
    consommer(s, 8, 35);
    s.carriere.dernierService = s.jour;
    // Mission formelle : réussite ou échec, sans entre-deux (L.3A).
    const difficulte = 10 + s.carriere.rang * 4 + (ILES[s.ile].danger || 0) * 6;
    const score = puissance(s) + rand(s) * 12;
    if (score >= difficulte) {
      s.carriere.merite += GAINS.merite_patrouille;
      return res(true, `Patrouille réussie : vous arrêtez une bande de contrebandiers. Mérite +${GAINS.merite_patrouille}.${promotion(s)}`);
    }
    blesser(s, rand(s) < 0.25 ? 2 : 1);
    return res(true, `Patrouille échouée : les contrebandiers vous échappent et tu es blessé.${eveilDanger(s)}`);
  },
  quitter(s) {
    if (estMembre(s)) return ACTIONS.quitter_equipage(s);
    if (s.carriere?.type === "chasseur" || s.carriere?.type === "revolution") {
      const t = s.carriere.type; s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
      return res(true, t === "chasseur" ? "Tu rends ta licence de chasseur de primes." : "Tu quittes discrètement l'Armée révolutionnaire.");
    }
    if (s.carriere?.type === "pirate") {
      s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
      for (const id of equipage(s)) s.pnj[id].lieu = "disparu";
      return res(true, `Tu dissous ton équipage et renonces à la piraterie. Ta prime de ${s.prime.toLocaleString("fr-FR")} Berrys, elle, reste affichée.`);
    }
    if (s.carriere?.type !== "marine") return res(false, "Tu n'es pas dans la Marine.");
    const rang = RANGS_MARINE[s.carriere.rang];
    s.ancienneCarriere = { ...s.carriere, fin: s.jour };
    s.carriere = null;
    reprendreNavire(s);
    return res(true, `Tu rends ton uniforme de ${rang}. Tu es libre.`);
  },
  declarer(s, id) {
    const p = s.pnj[id];
    if (!p?.romance || !pnjIci(s).includes(id)) return res(false, "Cette personne n'est pas là.");
    if (age(s) < 18 || (agePnj(s, id) ?? 0) < 18) return res(false, "Ce n'est pas possible.");
    if (s.famille.partenaire) return res(false, "Tu es déjà en couple.");
    if (p.famille) return res(false, "Ce n'est pas possible.");
    if (p.couple && s.pnj[p.couple]?.vivant !== false) return res(false, `${p.nom} partage déjà sa vie avec ${s.pnj[p.couple].nom}.`);
    consommer(s, 1, 2);
    // Le consentement n'est jamais imposé : la réponse dépend de la relation et d'une part de hasard.
    const chance = Math.min(0.9, (p.relation - 30) / 50 + s.stats.charisme * 0.01);
    if (rand(s) < chance) {
      s.famille.partenaire = id; s.famille.statut = "couple";
      p.relation += 10; souvenir(s, id, "vous vous êtes avoué vos sentiments");
      return res(true, `${p.nom} rougit, puis sourit : ${il(p)} partage tes sentiments. Vous êtes ensemble.`);
    }
    p.relation -= 5; souvenir(s, id, "tu lui as déclaré tes sentiments, mais ce n'était pas réciproque");
    return res(true, `${p.nom} te regarde avec douceur, mais ne partage pas tes sentiments. Vous restez amis.`);
  },
  mariage(s, id) {
    const p = s.pnj[id];
    if (s.famille.partenaire !== id || s.famille.statut !== "couple" || !pnjIci(s).includes(id)) return res(false, "Ce n'est pas possible.");
    if (s.inventaire.bague < 1) return res(false, "Il te faut une bague (en vente au grand marché de Loguetown).");
    consommer(s, 2, 5);
    if (rand(s) < Math.min(0.95, (p.relation - 50) / 40)) {
      s.inventaire.bague -= 1; s.famille.statut = "marié";
      p.lieu = s.foyer || "maison"; p.relation += 15; souvenir(s, id, "vous vous êtes mariés");
      s.humeur = Math.min(100, (s.humeur || 0) + 40);
      return res(true, `${p.nom} dit oui ! Vous vous mariez ${ILES[s.ile].a}, et ${il(p)} vient vivre avec toi dans ta maison, ${ILES[LIEUX[s.foyer || "maison"].ile].a}.`);
    }
    return res(true, `${p.nom} : « Je t'aime, mais je ne suis pas encore prêt${p.genre === "f" ? "e" : ""}. »`);
  },
  famille(s) {
    if (!s.famille.partenaire || !pnjIci(s).includes(s.famille.partenaire)) return res(false, "Ta famille n'est pas ici.");
    if (!tempsDisponible(s, 2)) return res(false, "Il est tard : vous vous retrouverez demain.");
    s.heure += 2; s.fatigue = Math.max(0, s.fatigue - 10);
    const p = s.pnj[s.famille.partenaire];
    p.relation += GAINS.temps_famille;
    const enfants = s.famille.enfants.filter(e => e.vivant !== false);
    return res(true, `Tu passes du temps avec ${p.nom}${enfants.length ? ` et ${enfants.map(e => e.prenom).join(", ")}` : ""}. Relation +${GAINS.temps_famille}.`);
  },
  enfant(s) {
    const p = s.pnj[s.famille.partenaire];
    if (!p || s.famille.statut !== "marié" || !pnjIci(s).includes(s.famille.partenaire)) return res(false, "Ce n'est pas possible.");
    if (s.famille.grossesse) return res(false, "Un enfant est déjà en route.");
    if (age(s) >= 50 || (agePnj(s, s.famille.partenaire) ?? 0) >= 50) return res(false, "Vous n'avez plus l'âge d'avoir un enfant.");
    if (rand(s) < 0.7) {
      s.famille.grossesse = { debut: s.jour, terme: s.jour + 270 };
      return res(true, `${p.nom} est d'accord. Quelques semaines plus tard, la nouvelle tombe : un enfant est en route.`);
    }
    return res(true, `${p.nom} préfère attendre encore un peu.`);
  },
};

// Conclusions des combats lancés par le moteur.
definirFin("voyou", (s, issue) => {
  const gco = gagnerCompetence(s, "combat", GAINS.combat); // l'expérience de l'affrontement, gain fixe
  if (issue === "victoire") {
    if (s.pnj.bern && s.pnj.bern.vivant !== false) { s.pnj.bern.relation += 5; souvenir(s, "bern", "tu as chassé un voyou du port"); }
    if (rand(s) < 0.3) s.planifies?.push({ jour: s.jour + 120 + Math.floor(rand(s) * 200), id: "voyou_vengeance", data: {} });
    return `Le voyou détale sans demander son reste. Combat +${gco}.`;
  }
  if (issue === "fuite") return `Le voyou ricane et s'en va. Combat +${gco}.`;
  blesser(s, rand(s) < 0.3 ? 2 : 1);
  return `Le voyou te laisse au sol et s'enfuit. Combat +${gco}.${eveilDanger(s)}`;
});
definirFin("colisee", (s, issue) => {
  if (issue === "victoire") {
    transferer(s, "rocco", "joueur", 3000);
    s.compteurs.colisee = (s.compteurs.colisee || 0) + 1;
    return `Tu remportes ton bloc ! Rocco te remet 3000 Berrys. Combat +${gagnerCompetence(s, "combat", GAINS.combat)}.`;
  }
  if (issue === "fuite") return "Tu quittes l'arène sous les huées.";
  blesser(s, 2);
  if (rand(s) < 0.05) {
    s.perso.vivant = false;
    noter(s, `${s.perso.prenom} tombe dans l'arène du Colisée.`, "mort");
    return "Ton adversaire était bien trop fort. Tu tombes dans l'arène, sous les yeux de la foule. Ta vie s'achève à Dressrosa.";
  }
  return `Tu es mis hors combat et emporté sur une civière.${eveilDanger(s)}`;
});

// Promotion automatique dès que le mérite atteint le seuil du grade suivant.
function promotion(s) {
  const c = s.carriere;
  if (!c || c.type !== "marine" || c.rang >= RANGS_MARINE.length - 1 || c.merite < MERITE_RANG[c.rang + 1]) return "";
  const verrou = verrouPromotion(s, c.rang + 1);
  if (verrou) return c.verrouDit === c.rang ? "" : ((c.verrouDit = c.rang), ` ${verrou}`);
  c.rang += 1;
  noter(s, `Promotion : tu deviens ${RANGS_MARINE[c.rang]} de la Marine.`, "mission");
  return ` Promotion : tu deviens ${RANGS_MARINE[c.rang]} ! Nouvelle solde : ${SOLDE_MARINE[c.rang]} Berrys par semaine.${donnerNavire(s)}`;
}

// Succession (B.7D) : on continue avec un enfant. Patrimoine transmis, compétences jamais transmises.
export function heritiers(s) {
  return s.famille.enfants.filter(e => e.vivant !== false);
}
export function succeder(s, index) {
  const e = heritiers(s)[index];
  if (s.perso.vivant || !e) return res(false, "Succession impossible.");
  s.ancetres.push({ prenom: s.perso.prenom, mort: s.jour, age: age(s), generation: s.generation });
  const heritage = s.berrys;
  s.perso = { prenom: e.prenom, genre: e.genre, naissance: e.naissance, vivant: true };
  s.generation += 1;
  // L'enfant a grandi par lui-même : base liée à son âge, sans rien recevoir du parent.
  // Les leçons reçues de son parent (transmission volontaire, jamais automatique) ajoutent jusqu'à +5.
  const base = 1 + Math.min(10, Math.floor((s.jour - e.naissance) / 365 / 3)) + Math.min(5, Math.floor((e.lecons || 0) / 10));
  s.stats = { force: base, agilite: base, endurance: base, intelligence: base, charisme: base };
  s.competences = { charpenterie: 0, peche: 0, combat: 0, cuisine: 0, navigation: 0, musique: 0, medecine: 0 };
  for (const k of Object.keys(s.stats)) s.potentiel[k] = 40 + Math.floor(rand(s) * 61);
  s.sante = { blessures: [], sequelles: [] };
  s.haki = { observation: 0, armement: 0, rois: 0, eveil: { observation: false, armement: false, rois: false }, progres: { observation: 0, armement: 0 }, roisInne: rand(s) < 0.03 };
  s.fatigue = 0; s.carriere = null; s.ancienneCarriere = null;
  // Rien de ce qui était attaché à la personne du défunt ne passe à l'enfant : pouvoir du fruit (qui renaît
  // ailleurs dans le monde), prime, prison, caractère, réputation, rêves, souvenirs d'événements, succès.
  if (s.fruit) s.monde.fruitsTrouves = s.monde.fruitsTrouves.filter(f => f !== s.fruit.id);
  s.fruit = null; s.prime = 0; s.infamie = 0; s.prison = null;
  s.traits = { courage: 0, ruse: 0, bonte: 0, ambition: 0 }; s.humeur = 0; s.education = 0;
  s.reputation = {}; s.ambition = null; s.evenement = null; s.combat = null; s.planifies = [];
  s.histo = { evenements: {}, compte: {} }; s.drapeaux = {}; s.succes = {}; s.compteurs = { actions: 0 };
  for (const m of s.missions.filter(m => m.sequestre > 0)) { const d = s.pnj[m.donneur]; if (d && d.vivant !== false) d.fonds += m.sequestre; else s.monde.exterieur += m.sequestre; m.sequestre = 0; }
  s.missions = []; s.inventaire.colis = 0; s.metiers = {};
  for (const r of s.monde.rivaux || []) { r.allie = false; r.ennemi = false; }
  for (const [id, role] of [["mere", "ta grand-mère"], ["pere", "ton grand-père"]]) if (s.pnj[id]) { s.pnj[id].role = role; s.pnj[id].famille = false; }
  for (const id of equipage(s)) s.pnj[id].lieu = "disparu";
  for (const p of Object.values(s.pnj)) if (!p.famille) { p.relation = Math.round((p.relation || 0) / 4); p.souvenirs = []; }
  const parent = s.famille.partenaire;
  s.famille = { partenaire: null, statut: null, enfants: [], grossesse: null };
  if (parent && s.pnj[parent]) { const p = s.pnj[parent]; p.relation = 60; p.role = p.genre === "f" ? "ta mère" : p.genre === "g" ? "ton père" : "ton parent"; p.famille = true; p.romance = false; }
  s.lieu = s.foyer || "maison"; s.ile = LIEUX[s.lieu].ile;
  noter(s, `Tu es ${e.prenom}, enfant de ${s.ancetres.at(-1).prenom}. Tu hérites de ${heritage} Berrys${s.navire ? `, du navire « ${s.navire.nom} »` : ""} et de la maison familiale ${ILES[s.ile].a}.`, "naissance");
  return res(true, `La vie continue avec ${e.prenom}.`);
}

// Puissance de combat : caractéristiques, expérience, arme et pouvoir du fruit.
export function puissance(s) {
  const fruit = s.fruit ? FRUITS[s.fruit.id].bonus + Math.floor(s.fruit.maitrise / 2) : 0;
  const h = s.haki || {};
  const haki = (h.armement || 0) + Math.floor((h.observation || 0) / 2) + (h.eveil?.rois ? 8 + Math.floor((h.rois || 0) / 2) : 0);
  const electro = s.peuple === "mink" ? 4 : 0; // l'Électro, que tout Mink possède de naissance
  return s.stats.force + s.stats.agilite + s.competences.combat * 2 + (s.inventaire.sabre > 0 ? 4 : 0) + fruit + haki + electro;
}
export const equipage = s => Object.keys(s.pnj).filter(id => s.pnj[id].lieu === "equipage" && s.pnj[id].vivant !== false);
const forceEquipage = s => equipage(s).reduce((t, id) => t + (s.pnj[id].force || 0), 0);
// Prime en Berrys canoniques : environ 25 millions pour 10 points de notoriété, un milliard vers 78.
// Notoriété : chaque mer a son plafond pour les coups ordinaires. Dans East Blue, une prime ne dépasse guère
// 30 millions ; pour aller plus haut, il faut prendre des risques sur Grand Line, puis dans le Nouveau Monde.
export const plafondNotoriete = s => (ILES[s.ile]?.nouveauMonde ? Infinity : ILES[s.ile]?.grandLine ? 45 : 12);
export function notoriete(s, gain, { exploit = false } = {}) {
  const plafond = plafondNotoriete(s) + (exploit ? 5 : 0);
  if (s.infamie < plafond) s.infamie = +Math.min(plafond, s.infamie + gain).toFixed(2);
  s.prime = calculPrime(s.infamie);
  return s.prime;
}
export const calculPrime = infamie => infamie <= 0 ? 0 : Math.round((infamie * infamie * 150000 + infamie * 1000000) / 100000) * 100000;

// Affrontement avec la Marine : victoire (fuite) ou capture. Un utilisateur de fruit peut se noyer en mer.
function combatMarine(s, ou) {
  const marine = 18 + s.infamie * 3 + (ILES[s.ile].danger || 0) * 10 + rand(s) * 20;
  const nous = puissance(s) + forceEquipage(s) * 0.5 + bonusCanons(s) + rand(s) * 20;
  if (nous >= marine) {
    notoriete(s, 0.5);
    if (rand(s) < 0.4) blesser(s, 0);
    return res(true, `La Marine vous attaque ${ou} ! Vous la repoussez et prenez la fuite. Ta prime est de ${s.prime.toLocaleString("fr-FR")} Berrys.`);
  }
  // Moment décisif : un Haki des Rois inné peut s'éveiller et renverser l'affrontement.
  if (s.haki?.roisInne && !s.haki.eveil.rois && age(s) >= 14 && rand(s) < 0.35) {
    s.haki.eveil.rois = true;
    notoriete(s, 2, { exploit: true });
    noter(s, "Éveil du Haki des Rois.", "mission");
    return res(true, `Acculé, tu sens une force immense jaillir de toi. Une onde invisible balaie le pont : les marines s'effondrent, inconscients. Tu viens d'éveiller le Haki des Rois ! Ta prime bondit à ${s.prime.toLocaleString("fr-FR")} Berrys.`);
  }
  eveilDanger(s);
  if (s.fruit && ou === "en mer" && rand(s) < 0.2) {
    s.perso.vivant = false;
    noter(s, `${s.perso.prenom} tombe à la mer pendant l'abordage. Le pouvoir du fruit l'empêche de nager.`, "mort");
    return res(true, "Pendant l'abordage, tu tombes à l'eau. Ton fruit t'empêche de nager… Ta vie s'achève en mer.");
  }
  return capturer(s, ou);
}
// Face au danger, l'observation peut s'éveiller d'elle-même.
function eveilDanger(s) {
  if (!s.haki || s.haki.eveil.observation || age(s) < 12 || rand(s) >= 0.05) return "";
  s.haki.eveil.observation = true; s.haki.observation = Math.max(1, s.haki.observation);
  noter(s, "Éveil du Haki de l'observation.", "mission");
  return " Au cœur du danger, tu as perçu chaque mouvement avant qu'il ne se produise : ton Haki de l'observation s'est éveillé !";
}

// Un navigateur à bord, ou ta propre science des cartes (navigation 10), réduit les risques en mer.
const navigue = s => aRole(s, "navigateur") || (s.competences.navigation || 0) >= 10;
const aRole = (s, role) => equipage(s).some(id => s.pnj[id].role.startsWith(role));

// Naufrage : le navire est perdu, l'équipage se disperse, et un mangeur de fruit peut se noyer.
function naufrage(s, ou, rivage) {
  const nom = s.navire ? `« ${s.navire.nom} »` : "le navire de passage";
  s.navire = null;
  for (const id of equipage(s)) if (rand(s) < 0.6) s.pnj[id].lieu = "disparu";
  if (s.fruit && rand(s) < (equipage(s).length ? 0.2 : 0.6)) {
    s.perso.vivant = false;
    noter(s, `${s.perso.prenom} disparaît en mer lors du naufrage. Son fruit l'empêchait de nager.`, "mort");
    return res(true, `Naufrage ${ou} ! ${nom} sombre. Ton fruit t'empêche de nager, et personne ne te repêche… Ta vie s'achève en mer.`);
  }
  blesser(s, s.peuple === "homme_poisson" && !s.fruit ? 0 : 2);
  s.ile = rivage; s.lieu = ILES[rivage].port;
  noter(s, `Naufrage : ${nom} est perdu.`, "mission");
  return res(true, `Naufrage ${ou} ! ${nom} sombre corps et biens. ${equipage(s).length ? "Ce qu'il reste de ton équipage te hisse" : "Accroché à une planche, tu dérives"} jusqu'${ILES[rivage].a}, blessé.`);
}

export function capturer(s, ou) {
  const jours = Math.min(3650, Math.round(30 + s.infamie * 20));
  s.prison = { jusqua: s.jour + jours, depuis: s.jour };
  for (const id of equipage(s)) { s.pnj[id].lieu = "disparu"; s.pnj[id].relation -= 10; }
  const navire = s.navire?.nom;
  s.navire = null;
  // Un capitaine en prison perd tout ce qui tenait à sa liberté : équipage, territoires, titres, alliances.
  if (s.carriere?.type === "pirate") {
    const c = s.carriere;
    c.capture = (c.capture || 0) + 1;
    if (c.membre) { s.ancienneCarriere = { ...c, fin: s.jour }; s.carriere = null; }
    else {
      if (c.territoires?.length) noter(s, `Sans toi, tes territoires (${c.territoires.map(i => ILES[i].nom).join(", ")}) passent à d'autres.`, "monde");
      c.territoires = []; c.corsaire = false; c.empereur = false; c.offreCorsaire = null; c.moral = 40; c.mutinerieMenace = null;
    }
  }
  for (const r of s.monde.rivaux || []) r.allie = false;
  // Le sabre est confisqué ; la décision en attente et les rendez-vous planifiés tombent à l'eau.
  if (s.inventaire.sabre > 0) s.inventaire.sabre = 0;
  s.evenement = null; s.combat = null;
  s.humeur = Math.max(-100, (s.humeur || 0) - 30);
  s.ile = "shells"; s.lieu = "cellule";
  blesser(s, 1);
  noter(s, `Capturé ${ou}. Condamné à ${jours} jours de prison à la base de Shells Town.`, "mission");
  return res(true, `La Marine vous submerge ${ou}. Tu es capturé${navire ? `, « ${navire} » est saisi` : ""} ${navire ? " et ton équipage se disperse" : ""}. On te confisque tes armes. Tu es condamné à ${jours} jours de prison à Shells Town.`);
}

function blesser(s, gravite) {
  const types = [
    { nom: "contusions", jours: 3 },
    { nom: "entaille au bras", jours: 7 },
    { nom: "côte fêlée", jours: 21, sequelle: "douleur au flanc par temps humide" },
  ];
  // Un Logia peut devenir intangible face à un adversaire ordinaire.
  if (s.fruit && FRUITS[s.fruit.id].intangible && rand(s) < 0.5) {
    noter(s, "Les coups traversent ton corps de braise sans te blesser.", "sante");
    return;
  }
  // Le Haki de l'observation permet de pressentir et d'éviter un coup.
  if (s.haki?.eveil.observation && rand(s) < Math.min(0.6, s.haki.observation * 0.03)) {
    noter(s, "Tu pressens le coup une fraction de seconde avant : tu l'esquives.", "sante");
    return;
  }
  const b = { ...types[gravite] };
  if (b.sequelle && (rand(s) > 0.4 || (s.competences.medecine || 0) >= 10 || aTalent(s, "constitution") || aRole(s, "médecin de bord"))) delete b.sequelle;
  s.sante.blessures.push({ ...b, gravite, depuis: s.jour });
  noter(s, `Blessure : ${b.nom} (guérison en ${b.jours} jours).`, "sante");
}

// Répliques sans IA : le PNJ ne dit que ce qu'il sait (non-omniscience, mémoire subjective).
function repliquePnj(s, id, dernier) {
  const p = s.pnj[id];
  const ag = age(s);
  const proche = p.relation >= 30;
  const missionProposee = s.missions.find(m => m.donneur === id && m.statut === "proposée");
  if (missionProposee) return `${p.nom} : « J'ai besoin de quelqu'un pour réparer le toit de ma remise. ${missionProposee.recompense} Berrys si c'est fait dans les ${missionProposee.duree} jours après ton accord. »`;
  const lignes = {
    makino: [
      ag < 6 ? "« Tu as encore grandi, toi ! Un verre de lait ? »" : "« Bonjour ! Tu veux quelque chose à boire ? »",
      s.monde.meteo !== "beau" ? "« Avec ce temps, les marins restent au bar. »" : "« Belle journée pour aller au port. »",
      proche ? "« Tu sais que tu peux toujours compter sur moi. »" : "« Le village est calme en ce moment. »",
    ],
    woop: [
      "« Ce village est paisible, et je compte bien le garder comme ça ! »",
      s.monde.toitRemise === "réparé" ? "« Ma remise ne prend plus l'eau, grâce à toi. »" : "« Le toit de ma remise fuit, ça me désole. »",
    ],
    tomas: [
      `« Une planche, c'est ${OBJETS.planche.prix} Berrys. Du bon bois. »`,
      ag >= 10 && s.competences.charpenterie > 0 ? "« Tu as la main, pour un débutant. »" : "« Le travail du bois demande de la patience. »",
    ],
    bern: [
      "« La mer donne ce qu'elle veut bien donner. »",
      s.pnj.bern.fonds < GAINS.salaire_port ? "« Les affaires sont maigres, je ne peux payer personne en ce moment. »" : "« Si tu veux travailler, viens m'aider aux filets. »",
    ],
    ilda: [
      "« Des clous, des cordes, de tout ! Je repars bientôt en tournée. »",
      "« J'ai vu du pays, mais Fuchsia reste mon arrêt préféré. »",
    ],
    sacha: [ag < 12 ? "« On fait la course jusqu'en haut de la colline ? »" : "« Tu crois qu'on quittera Fuchsia un jour ? »",
      proche ? "« Je suis content qu'on se connaisse depuis toujours. »" : "« Salut ! »"],
    rivo: [s.carriere?.type === "marine" ? `« Au rapport, ${RANGS_MARINE[s.carriere.rang]} ! »` : "« La Marine cherche des recrues solides, à partir de 16 ans. »",
      "« Justice et discipline. Le reste s'apprend. »"],
    mira: ["« Une chope de cidre ? La maison offre la première. »", "« Les marins de la base viennent ici après leur service. »"],
    gallo: ["« En cuisine, on ne traîne pas ! »", "« Un bon plat, ça se mérite. »"],
    nino: ["« Bienvenue au Baratie ! Une table pour toi ? »", "« Le chef crie fort, mais il a bon cœur. »"],
    barro: [`« Un sabre, c'est ${OBJETS.sabre.prix} Berrys. Il te sauvera la vie. »`, "« Loguetown voit passer bien des pirates. »"],
    oswin: ["« Sans Log Pose, Grand Line te dévorera. Les boussoles n'y servent à rien. »", "« Je garde ce phare depuis plus longtemps que je ne m'en souviens. »"],
    bolt: [s.navire ? `« Ta coque est à ${s.navire.coque} sur 100. ${s.navire.coque < 60 ? "Elle ne tiendra pas longtemps." : "Elle tient encore."} »` : "« Un navire, c'est une vie. Traite-le bien. »", "« Si tu sais tenir un rabot, il y a du travail au chantier. »"],
    tess: ["« Les canaux sont plus beaux au coucher du soleil. »", "« Tu viens d'East Blue ? Tu as dû traverser Reverse Mountain ! »"],
    coral: ["« Bienvenue sous la mer, humain ! Ici, tout le monde n'aime pas les gens de la surface. »", `« Pour le Nouveau Monde, il te faut mon Log Pose à trois aiguilles : ${OBJETS.logpose_nm.prix} Berrys. »`],
    maela: ["« Tu viens de la surface ? Raconte-moi le soleil ! »", "« Ici, la lumière vient d'un arbre géant, à la surface. »"],
    rocco: ["« Le Colisée accueille les plus forts du Nouveau Monde. Pas de règles, ou presque. »", "« La victoire paie bien. La défaite, elle, se paie parfois cher. »"],
    soen: [s.pnj.soen.relation < 20 ? "« Wano ne s'ouvre pas aux étrangers. Pourquoi es-tu ici ? »" : "« Un sabre n'est rien sans la volonté de celui qui le tient. »", "« Le ciel de Wano a vu bien des guerres. »"],
    hal: [`« Pour plonger sous la Red Line, il faut un enrobage. ${PRIX_ENROBAGE} Berrys. »`, "« Ici, le monde se divise : ceux qui continuent, et ceux qui renoncent. »"],
    luffy: [ag < 10 ? "« On joue aux pirates ? C'est moi le capitaine ! »" : "« Un jour, je serai le Roi des pirates ! »", "« T'as pas de la viande ? »"],
    shanks: ["« Ha ha ! Bois un coup avec nous ! »", "« La mer est vaste. Tu verras, un jour. »"],
    garo: [s.pnj.garo.relation < 30 ? "« Hmph. Encore un gamin qui rêve de Grand Line ? »" : "« Il existe une force que chacun porte en soi. Les marins de Grand Line l'appellent le Haki. »",
      age(s) >= 15 && s.pnj.garo.relation >= 30 ? "« Si tu veux, je peux t'apprendre à l'éveiller. Ça ne sera pas gratuit, et ça fera mal. »" : "« J'ai navigué loin, autrefois. Très loin. »"],
    lise: [`« Mes bagues sont à ${OBJETS.bague.prix} Berrys. Pour une demande en mariage, peut-être ? »`, "« Le marché est plus animé que jamais. »"],
  }[id] || ["« Bonjour. »"];
  let txt = `${p.nom} : ${pick(s, lignes)}`;
  // Mémoire subjective : seul ce PNJ se souvient de ce qu'il a vécu avec toi.
  if (dernier?.texte && s.jour - dernier.jour <= 14 && rand(s) < 0.6) {
    txt += ` ${Il(p)} n'a pas oublié que ${dernier.texte}.`;
  }
  return txt;
}

// ---------- Interprétation sans IA (saisie libre simple) ----------

const NORMALISER = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function interpreterTexte(s, texte) {
  const t = NORMALISER(texte);
  const actions = [];
  const lieuMotsTous = { bar: ["bar", "partys", "makino"], port: ["port", "quai"], place: ["place"], atelier: ["atelier", "charpentier", "tomas"],
    remise: ["remise"], colline: ["colline"], maison: ["maison", "chez moi"],
    port_shells: ["port"], base: ["base", "marine", "caserne"], taverne_shells: ["taverne", "mira"],
    phare: ["phare"], rivage_lg: ["rivage"], jungle: ["jungle"], quai_w7: ["quai"], chantier: ["chantier"], bar_w7: ["bar"],
    mangroves: ["mangrove", "port"], enrobage: ["enrobage"], bar_sabaody: ["bar"],
    port_hp: ["port"], place_hp: ["place"], port_dr: ["port"], ville_dr: ["ville", "rue"], colisee: ["colisee", "arene"],
    cote_wano: ["cote", "port"], village_wano: ["village"], dojo: ["dojo", "soen"],
    pont_baratie: ["pont"], salle_baratie: ["salle", "restaurant"], cuisine_baratie: ["cuisine"],
    quais_logue: ["quai", "port", "dock"], marche_logue: ["marche"], armurerie: ["armurerie", "arme"], echafaud: ["echafaud"], auberge_logue: ["auberge"] };
  const lieuMots = Object.fromEntries(Object.entries(lieuMotsTous).filter(([k]) => LIEUX[k].ile === s.ile));
  const ileMots = { fuchsia: ["fuchsia", "dawn"], shells: ["shells"], baratie: ["baratie"], loguetown: ["loguetown", "logue", "east blue", "calm belt"],
    cap: ["cap", "reverse", "grand line"], little_garden: ["little garden"], water_seven: ["water seven", "water 7"], sabaody: ["sabaody"],
    hommes_poissons: ["hommes-poissons", "hommes poissons", "sous-marin", "sous la mer"], dressrosa: ["dressrosa"], wano: ["wano"] };
  const pnjMots = { makino: ["makino"], woop: ["maire", "woop"], tomas: ["tomas", "charpentier"], bern: ["bern", "pecheur"], ilda: ["ilda", "marchande"],
    sacha: ["sacha"], rivo: ["rivo", "sergent", "recruteur"], mira: ["mira"], gallo: ["gallo", "chef"], nino: ["nino", "serveur"], barro: ["barro", "armurier"], lise: ["lise", "bijout"], garo: ["garo", "vieux marin"], oswin: ["oswin", "gardien"], bolt: ["bolt"], tess: ["tess"], hal: ["hal"], coral: ["coral"], maela: ["maela", "sirene"], rocco: ["rocco"], soen: ["soen", "maitre"] };
  const morceaux = t.split(/,| puis | et ensuite | ensuite |;| et /);
  for (const m of morceaux) {
    if (/(embarque|navigue|voyage|pars pour|part pour|bateau|navire)/.test(m)) {
      const d = Object.entries(ileMots).find(([, mots]) => mots.some(w => m.includes(w)));
      if (d) { actions.push({ id: "voyager", cible: d[0] }); continue; }
    }
    if (/(engage|enrole)/.test(m)) { actions.push({ id: "engager" }); continue; }
    if (/(radoub|repare.*(navire|bateau|coque))/.test(m)) { actions.push({ id: "radoub" }); continue; }
    if (/enrob/.test(m)) { actions.push({ id: "enrober" }); continue; }
    if (/(colisee|arene)/.test(m)) { actions.push({ id: "colisee" }); continue; }
    if (/(lecon de sabre|katana|kata)/.test(m)) { actions.push({ id: "sabre" }); continue; }
    if (/(pavillon|devenir pirate|deviens pirate)/.test(m)) { actions.push({ id: "pirate" }); continue; }
    if (/recrut/.test(m)) { actions.push({ id: "recruter" }); continue; }
    if (/(abordage|attaque.*navire|pille)/.test(m)) { actions.push({ id: "attaquer" }); continue; }
    if (/(explor|fouill)/.test(m)) { actions.push({ id: "explorer" }); continue; }
    if (/(evade|evasion)/.test(m)) { actions.push({ id: "evader" }); continue; }
    if (/(mange|croque).*fruit/.test(m) && s.inventaire.fruits.length) { actions.push({ id: "manger", cible: s.inventaire.fruits[0] }); continue; }
    if (/(lecon|apprend).*haki|haki.*(lecon|garo)/.test(m)) { actions.push({ id: "initier", cible: /arme/.test(m) ? "armement" : "observation" }); continue; }
    if (/(haki|medit|endurci)/.test(m)) { actions.push({ id: "haki", cible: /rois|conquer/.test(m) ? "rois" : /arme|endurci/.test(m) ? "armement" : "observation" }); continue; }
    if (/(pouvoir|maitris)/.test(m)) { actions.push({ id: "maitriser" }); continue; }
    if (/patrouill/.test(m)) { actions.push({ id: "patrouille" }); continue; }
    if (/service/.test(m)) { actions.push({ id: "service" }); continue; }
    if (/(va|vais|aller|rendre|retourne|rentre)/.test(m)) {
      const l = Object.entries(lieuMots).find(([, mots]) => mots.some(w => m.includes(w)));
      if (l) { actions.push({ id: "aller", cible: l[0] }); continue; }
    }
    if (/(parle|discute|salue|demande|bonjour)/.test(m)) {
      const p = Object.entries(pnjMots).find(([, mots]) => mots.some(w => m.includes(w)));
      if (p) { actions.push({ id: "parler", cible: p[0] }); continue; }
    }
    if (/entrain|muscu|pompes/.test(m)) { actions.push({ id: "entrainer", cible: /agil|souple/.test(m) ? "agilite" : /endur|cour/.test(m) ? "endurance" : "force" }); continue; }
    if (/cour(s|ir)/.test(m)) { actions.push({ id: "entrainer", cible: "endurance" }); continue; }
    if (/(lis|lire|etudi|apprend)/.test(m)) { actions.push({ id: "etudier" }); continue; }
    if (/travail/.test(m)) { actions.push({ id: "travailler" }); continue; }
    if (/peche|pecher/.test(m)) { actions.push({ id: "pecher" }); continue; }
    if (/(repare|reparer)/.test(m)) { actions.push({ id: "reparer" }); continue; }
    if (/(achete|acheter)/.test(m)) {
      const o = /planche/.test(m) ? "planche" : /clou/.test(m) ? "clou" : /canne/.test(m) ? "canne" : /sabre/.test(m) ? "sabre" : /bague/.test(m) ? "bague" : /barque/.test(m) ? "barque" : /caravelle/.test(m) ? "caravelle" : /log.*(nouveau|trois|3)/.test(m) ? "logpose_nm" : /log/.test(m) ? "logpose" : null;
      if (o) { const n = parseInt(m.match(/\d+/)?.[0] || "1", 10); for (let i = 0; i < Math.min(n, 20); i++) actions.push({ id: "acheter", cible: o }); continue; }
    }
    if (/(bat|combat|affronte|frappe)/.test(m)) { actions.push({ id: "combattre" }); continue; }
    if (/(dors|dormir|repose|coucher)/.test(m)) { actions.push({ id: "repos" }); continue; }
    if (/(joue|jouer)/.test(m)) { actions.push({ id: "jouer" }); continue; }
    if (/(cuisine|cuisiner)/.test(m)) { actions.push({ id: "cuisiner" }); continue; }
    if (/accept/.test(m)) { const mi = s.missions.find(x => x.statut === "proposée"); if (mi) { actions.push({ id: "accepter", cible: mi.id }); continue; } }
  }
  return actions;
}

// ---------- Sauvegarde vérifiable ----------

export function empreinte(obj) {
  const str = JSON.stringify(obj);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
export function serialiser(s) {
  return JSON.stringify({ etat: s, empreinte: empreinte(s) });
}
export function deserialiser(txt) {
  const o = JSON.parse(txt);
  if (!o || !o.etat || empreinte(o.etat) !== o.empreinte) throw new Error("Sauvegarde corrompue");
  return o.etat;
}

export function faitsPourNarration(s, resultat) {
  // Faits établis transmis au narrateur IA : rien d'autre ne doit être raconté.
  const ici = pnjIci(s).map(id => `${s.pnj[id].nom} (${s.pnj[id].role})`);
  return [
    `Lieu : ${LIEUX[s.lieu].nom}, ${ILES[s.ile].a} (${ILES[s.ile].desc}). Heure : ${Math.floor(s.heure)}h. Météo : ${s.monde.meteo}.`,
    `Protagoniste : ${s.perso.prenom}, ${age(s)} ans${s.carriere?.type === "marine" ? `, ${RANGS_MARINE[s.carriere.rang]} de la Marine` : ""}${s.carriere?.type === "pirate" ? `, capitaine des ${s.carriere.equipage}` : ""}${s.prime ? `, prime de ${s.prime} Berrys` : ""}${s.fruit ? `, mangeur du ${FRUITS[s.fruit.id].nom} (${FRUITS[s.fruit.id].pouvoir})` : ""}${s.prison ? ", en prison" : ""}${s.haki && Object.keys(HAKI).some(t => s.haki.eveil[t]) ? `, maîtrise le ${Object.keys(HAKI).filter(t => s.haki.eveil[t]).map(t => HAKI[t].nom).join(" et le ")}` : ""}. Fatigue ${s.fatigue}/100.${blessureActive(s) ? ` Blessé : ${s.sante.blessures.map(b => b.nom).join(", ")}.` : ""}`,
    ici.length ? `Présents : ${ici.join(", ")}.` : "Personne d'autre n'est présent.",
    `Résultat établi par le jeu : ${resultat}`,
  ].join("\n");
}
