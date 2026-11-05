// One Piece Life — moteur de simulation (autorité sur les faits).
// Module pur : aucune dépendance au navigateur, testable avec Node.
// Règles appliquées : gains fixes (D.2A), missions binaires avec séquestre (L.3A, L.4A),
// guérison automatique en temps simulé (K.2A), fabrication instantanée si ressources (I.5A),
// monde figé hors session (01.6A : rien ne bouge sans action du joueur).

export const VERSION = 2;
export const JOUR_HEURES = 16; // heures d'éveil par jour
export const FATIGUE_MAX_ACTIVITE = 80;

export const ILES = {
  fuchsia: { nom: "Fuchsia", desc: "village de l'île de Dawn, sur East Blue", port: "port", auberge: "maison" },
  shells: { nom: "Shells Town", desc: "ville portuaire d'East Blue, siège d'une base de la Marine", port: "port_shells", auberge: "taverne_shells" },
  baratie: { nom: "le Baratie", desc: "restaurant flottant au large d'East Blue", port: "pont_baratie", auberge: "pont_baratie" },
  loguetown: { nom: "Loguetown", desc: "grande ville d'East Blue, la ville du commencement et de la fin", port: "quais_logue", auberge: "auberge_logue" },
};
// Durée des traversées en jours (prix : 20 Berrys par jour de mer).
export const ROUTES = {
  fuchsia: { shells: 2, baratie: 3, loguetown: 5 },
  shells: { fuchsia: 2, baratie: 2, loguetown: 4 },
  baratie: { fuchsia: 3, shells: 2, loguetown: 3 },
  loguetown: { fuchsia: 5, shells: 4, baratie: 3 },
};
export const PRIX_JOUR_MER = 20;
export const PRIX_AUBERGE = 10;

export const LIEUX = {
  maison: { ile: "fuchsia", nom: "ta maison", court: "Maison", a: "chez toi" },
  bar: { ile: "fuchsia", nom: "le bar Partys", court: "Bar Partys", a: "au bar Partys" },
  place: { ile: "fuchsia", nom: "la place du village", court: "Place", a: "sur la place du village" },
  port: { ile: "fuchsia", nom: "le port", court: "Port", a: "au port" },
  atelier: { ile: "fuchsia", nom: "l'atelier du charpentier", court: "Atelier", a: "à l'atelier du charpentier" },
  remise: { ile: "fuchsia", nom: "la remise du maire", court: "Remise", a: "à la remise du maire" },
  colline: { ile: "fuchsia", nom: "la colline", court: "Colline", a: "sur la colline" },
  port_shells: { ile: "shells", nom: "le port de Shells Town", court: "Port", a: "au port de Shells Town" },
  base: { ile: "shells", nom: "la base de la Marine", court: "Base Marine", a: "à la base de la Marine" },
  taverne_shells: { ile: "shells", nom: "la taverne", court: "Taverne", a: "à la taverne" },
  pont_baratie: { ile: "baratie", nom: "le pont du Baratie", court: "Pont", a: "sur le pont du Baratie" },
  salle_baratie: { ile: "baratie", nom: "la salle du restaurant", court: "Salle", a: "dans la salle du restaurant" },
  cuisine_baratie: { ile: "baratie", nom: "les cuisines du Baratie", court: "Cuisines", a: "dans les cuisines du Baratie" },
  quais_logue: { ile: "loguetown", nom: "les quais de Loguetown", court: "Quais", a: "sur les quais de Loguetown" },
  marche_logue: { ile: "loguetown", nom: "le grand marché", court: "Marché", a: "au grand marché" },
  armurerie: { ile: "loguetown", nom: "l'armurerie", court: "Armurerie", a: "à l'armurerie" },
  echafaud: { ile: "loguetown", nom: "la place de l'échafaud", court: "Échafaud", a: "sur la place de l'échafaud" },
  auberge_logue: { ile: "loguetown", nom: "l'auberge", court: "Auberge", a: "à l'auberge" },
};
export const lieuxDe = ile => Object.keys(LIEUX).filter(k => LIEUX[k].ile === ile);

// Emplois : celui qui paie, le salaire fixe, la compétence travaillée (gain fixe, D.2A).
export const EMPLOIS = {
  port: { payeur: "bern", salaire: 30, heures: 4, fatigue: 25, ageMin: 10, competence: "peche", label: "Travailler avec Bern",
    texte: "Tu aides Bern à remonter les filets et trier la pêche." },
  cuisine_baratie: { payeur: "gallo", salaire: 45, heures: 5, fatigue: 25, ageMin: 14, competence: "cuisine", label: "Travailler en cuisine",
    texte: "Tu enchaînes les commandes sous les ordres du chef Gallo." },
  quais_logue: { payeur: "dock", salaire: 35, heures: 4, fatigue: 30, ageMin: 14, competence: null, stat: "force", label: "Décharger les navires",
    texte: "Tu portes des caisses entre les navires et les entrepôts." },
};

export const RANGS_MARINE = ["Recrue", "Matelot", "Caporal", "Sergent", "Adjudant", "Enseigne", "Lieutenant"];
export const MERITE_RANG = [0, 10, 25, 45, 70, 100, 140];
export const SOLDE_MARINE = [40, 60, 90, 130, 180, 250, 350]; // par semaine

export const STATS = {
  force: "Force", agilite: "Agilité", endurance: "Endurance", intelligence: "Intelligence", charisme: "Charisme",
};
export const COMPETENCES = {
  charpenterie: "Charpenterie", peche: "Pêche", combat: "Combat", cuisine: "Cuisine",
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
};

// Gains fixes prédéfinis (D.2A) : jamais modulés.
// Fruits du Démon inventés pour ce jeu (aucun fruit canonique n'est attribué au joueur).
export const FRUITS = {
  echo: { nom: "Fruit de l'Écho", type: "Paramecia", pouvoir: "projeter des ondes sonores qui renversent tes adversaires", bonus: 6 },
  plume: { nom: "Fruit de la Plume", type: "Zoan", pouvoir: "te transformer en grand oiseau de mer", bonus: 5 },
  braise: { nom: "Fruit de la Braise", type: "Logia", pouvoir: "devenir braise et projeter des flammes", bonus: 8, intangible: true },
  verre: { nom: "Fruit du Verre", type: "Paramecia", pouvoir: "créer et façonner du verre à volonté", bonus: 5 },
};
export const NAVIRES = { barque: { nom: "barque de pêche aménagée", capacite: 3 }, caravelle: { nom: "caravelle", capacite: 8 } };
export const TAVERNES = ["bar", "taverne_shells", "salle_baratie", "auberge_logue"];
export const EXPLORABLES = ["colline", "port", "port_shells", "quais_logue", "echafaud", "pont_baratie"];

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
  sacha: { nom: "Sacha", role: "enfant du village, de ton âge", genre: "x", lieu: "colline", relation: 5, fonds: 50, souvenirs: [], naissance: 120, romance: true },
  rivo: { nom: "Sergent Rivo", role: "recruteur de la Marine", genre: "g", lieu: "base", relation: 0, fonds: 500, souvenirs: [] },
  mira: { nom: "Mira", role: "tient la taverne de Shells Town", genre: "f", lieu: "taverne_shells", relation: 0, fonds: 900, souvenirs: [], naissance: -730, romance: true },
  gallo: { nom: "Chef Gallo", role: "cuisinier du Baratie", genre: "g", lieu: "cuisine_baratie", relation: 0, fonds: 4000, souvenirs: [] },
  nino: { nom: "Nino", role: "serveur du Baratie", genre: "g", lieu: "salle_baratie", relation: 0, fonds: 300, souvenirs: [], naissance: -365, romance: true },
  barro: { nom: "Barro", role: "armurier de Loguetown", genre: "g", lieu: "armurerie", relation: 0, fonds: 2000, souvenirs: [], stock: { sabre: 3, caravelle: 1 } },
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

export function nouvelleVie({ prenom, genre = "x", seed = Date.now() >>> 0, aleatoire = true } = {}) {
  const s = {
    version: VERSION, id: `monde-${seed.toString(36)}`, rng: seed >>> 0, cree: seed,
    jour: 0, heure: 8, fatigue: 0,
    perso: { prenom: prenom || "Sans-nom", genre, naissance: 0, vivant: true },
    stats: { force: 1, agilite: 1, endurance: 1, intelligence: 1, charisme: 1 },
    competences: { charpenterie: 0, peche: 0, combat: 0, cuisine: 0 },
    potentiel: {},
    berrys: 0, inventaire: { planche: 0, clou: 0, poisson: 0, canne: 0, sabre: 0, bague: 0, fruits: [] },
    sante: { blessures: [], sequelles: [] },
    lieu: "maison", ile: "fuchsia",
    pnj: PNJ_INITIAUX(),
    carriere: null, navire: null, fruit: null, prime: 0, infamie: 0, prison: null,
    famille: { partenaire: null, statut: null, enfants: [], grossesse: null },
    generation: 1, ancetres: [],
    monde: { toitRemise: "abîmé", prochainNavire: 18, voyouAuPort: false, meteo: "beau", exterieur: 1000000, fruitsTrouves: [] },
    missions: [], journal: [], compteurs: { actions: 0 },
  };
  s.pnj.dock = { nom: "Compagnie des docks", role: "employeur des quais", lieu: null, relation: 0, fonds: 20000, souvenirs: [], invisible: true };
  // Potentiel inné (B.4D) : il ne multiplie jamais les gains, il fixe seulement un plafond naturel.
  for (const k of Object.keys(s.stats)) s.potentiel[k] = 40 + Math.floor(rand(s) * 61);
  if (aleatoire) for (const k of Object.keys(s.stats)) s.stats[k] += Math.floor(rand(s) * 2);
  noter(s, `Tu nais à Fuchsia, un petit village paisible de l'île de Dawn, sur East Blue. Tes parents t'appellent ${s.perso.prenom}.`, "naissance");
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
export const blessureActive = s => s.sante.blessures.length > 0;
const blessureGrave = s => s.sante.blessures.some(b => b.gravite >= 2);
export function pnjIci(s) {
  if (s.prison) return [];
  return Object.entries(s.pnj).filter(([, p]) => (p.lieu === s.lieu || p.lieu === "equipage") && p.presente !== false && !p.invisible && p.vivant !== false).map(([id]) => id);
}
export const agePnj = (s, id) => s.pnj[id].naissance == null ? null : Math.floor((s.jour - s.pnj[id].naissance) / 365);
const il = p => (p.genre === "f" ? "elle" : p.genre === "g" ? "il" : "iel");
const Il = p => il(p)[0].toUpperCase() + il(p).slice(1);

// Anciennes sauvegardes (version 1) : ajout des îles, des nouveaux habitants et de la famille.
export function migrer(s) {
  if (s.version >= VERSION) return s;
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
  s.pnj.tomas.stock.barque ??= 2; if (s.pnj.barro) s.pnj.barro.stock.caravelle ??= 1;
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
  s.fatigue = Math.min(100, s.fatigue + fatigue);
}
function tempsDisponible(s, heures) { return s.heure + heures <= 8 + JOUR_HEURES; }

// Un jour qui passe : guérison, monde autonome, missions. Retourne les événements importants.
function passerJour(s, { recuperation = 70 } = {}) {
  const importants = [];
  s.jour += 1; s.heure = 8;
  s.fatigue = Math.max(0, s.fatigue - recuperation);
  // Solde hebdomadaire de la Marine (versée par l'institution, argent venu de l'extérieur, comptabilisé).
  if (s.carriere?.type === "marine" && (s.jour - s.carriere.depuis) % 7 === 0) {
    const solde = SOLDE_MARINE[s.carriere.rang];
    s.monde.exterieur -= solde; s.berrys += solde;
    noter(s, `La Marine te verse ta solde : ${solde} Berrys.`, "monde");
  }
  if (s.prison && s.jour >= s.prison.jusqua) {
    s.prison = null; s.lieu = "port_shells";
    importants.push({ type: "liberation", texte: "Tu as purgé ta peine : la Marine te relâche sur le port de Shells Town." });
    noter(s, "Libéré de prison.", "mission");
  }
  // Naissance d'un enfant.
  const g = s.famille?.grossesse;
  if (g && s.jour >= g.terme) {
    const prenoms = ["Ace", "Lou", "Maya", "Taro", "Noé", "Rin", "Elio", "Kim", "Sana", "Yuri"];
    const enfant = { prenom: prenoms[Math.floor(rand(s) * prenoms.length)], naissance: s.jour, genre: rand(s) < 0.5 ? "f" : "g" };
    s.famille.enfants.push(enfant); s.famille.grossesse = null;
    importants.push({ type: "naissance_enfant", texte: `Ton enfant ${enfant.prenom} est né${enfant.genre === "f" ? "e" : ""} !` });
    noter(s, `Naissance de ton enfant, ${enfant.prenom}.`, "famille");
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
    s.monde.exterieur -= vente;
    s.pnj.bern.fonds += vente;
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
      && s.pnj.woop.fonds >= 500 && rand(s) < 0.15) {
    s.missions.push({
      id: `m${s.jour}`, code: "toit", donneur: "woop", titre: "Réparer le toit de la remise du maire",
      condition: "Le toit de la remise est réparé avant la fin de l'échéance.",
      cloture: "Échéance : 3 jours après l'acceptation.", duree: 3, recompense: 500, statut: "proposée", jour: s.jour,
    });
    importants.push({ type: "mission", texte: "Le maire Woop Slap te cherche : il a une proposition de travail." });
  }
  // Vieillissement et mortalité crédible (simplifiée) après 70 ans.
  if (age(s) >= 70 && jourDansAnnee(s) === 1 && rand(s) < (age(s) - 65) * 0.02) {
    s.perso.vivant = false;
    importants.push({ type: "mort", texte: "Ta vie s'achève paisiblement à Fuchsia." });
    noter(s, `${s.perso.prenom} s'éteint à ${age(s)} ans.`, "mort");
  }
  if (jourDansAnnee(s) === 1) noter(s, `Tu as maintenant ${age(s)} an${age(s) > 1 ? "s" : ""}.`, "age");
  return importants;
}

function verifierMissions(s, importants) {
  for (const m of s.missions.filter(m => m.statut === "active")) {
    const reussie = m.code === "toit" && s.monde.toitRemise === "réparé";
    if (reussie) {
      // Verdict automatique binaire (L.3A) et récompense automatique depuis le séquestre (L.4A).
      s.berrys += m.sequestre; m.sequestre = 0; m.statut = "réussie"; m.fin = s.jour;
      s.pnj[m.donneur].relation += 10;
      souvenir(s, m.donneur, "tu as réparé le toit de la remise comme promis");
      noter(s, `Mission réussie : ${m.titre}. Tu reçois ${m.recompense} Berrys.`, "mission");
      importants?.push({ type: "mission_finie", texte: `Mission réussie : ${m.recompense} Berrys reçus.` });
    } else if (s.jour > m.echeance) {
      s.pnj[m.donneur].fonds += m.sequestre; m.sequestre = 0; m.statut = "échouée"; m.fin = s.jour;
      s.pnj[m.donneur].relation -= 5;
      souvenir(s, m.donneur, "tu n'as pas réparé le toit à temps");
      noter(s, `Mission échouée : ${m.titre}. L'échéance est passée.`, "mission");
      importants?.push({ type: "mission_finie", texte: "Mission échouée : l'échéance est passée." });
    }
  }
}

// Ellipse : avance de n jours, interrompue par un événement important (01.3C).
export function avancer(s, jours, { recuperation, sansInterruption = false } = {}) {
  if (!s.perso.vivant) return res(false, "Cette vie est terminée.");
  const debut = s.jour;
  let interruption = null;
  for (let i = 0; i < jours; i++) {
    const evts = passerJour(s, { recuperation });
    if (!s.perso.vivant) { interruption = evts.find(e => e.type === "mort"); break; }
    if (sansInterruption) continue;
    // Seuls les événements qui demandent une décision interrompent l'ellipse (01.3C) ;
    // l'arrivée d'un navire est notée au journal sans arrêter le temps.
    const imp = evts.find(e => ["mission", "mort", "naissance_enfant", "liberation"].includes(e.type));
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

export function actionsDisponibles(s) {
  if (!s.perso.vivant) return [];
  const a = [];
  const ag = age(s);
  const ici = pnjIci(s);
  for (const id of ici) a.push({ id: "parler", cible: id, label: `Parler à ${s.pnj[id].nom}` });
  if (s.prison) {
    return [{ id: "attendre", label: "Attendre (jusqu'à 30 jours)" }, { id: "evader", label: "Tenter de t'évader" },
      { id: "entrainer", cible: "force", label: "S'entraîner en cellule (force)" },
      ...(s.fruit ? [{ id: "maitriser", label: "Travailler ton pouvoir" }] : [])];
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
      a.push({ id: "acheter", cible: k, label: `Acheter ${["planche", "canne", "bague", "barque", "caravelle"].includes(k) ? "une" : "un"} ${o.nom} (${o.prix} B)` });
  }
  if (s.lieu === "remise" && s.monde.toitRemise === "abîmé") a.push({ id: "reparer", label: "Réparer le toit (3 planches, 6 clous)" });
  if (s.lieu === "port" && s.monde.voyouAuPort) a.push({ id: "combattre", label: "Affronter le voyou" });
  if (s.lieu === "bar" && ag >= 12) a.push({ id: "cuisiner", label: "Aider Makino en cuisine" });
  if (EXPLORABLES.includes(s.lieu) && ag >= 8) a.push({ id: "explorer", label: "Explorer les environs" });
  for (const f of new Set(s.inventaire.fruits)) a.push({ id: "manger", cible: f, label: `Manger le ${FRUITS[f].nom}${s.fruit ? " (tu as déjà un pouvoir !)" : ""}` });
  if (s.fruit) a.push({ id: "maitriser", label: "Travailler ton pouvoir" });
  if (s.lieu === ILES[s.ile].port && s.navire && !s.carriere && ag >= 16) a.push({ id: "pirate", label: "Hisser le pavillon pirate" });
  if (s.carriere?.type === "pirate") {
    if (s.lieu === ILES[s.ile].port) a.push({ id: "attaquer", label: "Attaquer un navire marchand" });
    if (TAVERNES.includes(s.lieu)) a.push({ id: "recruter", label: "Recruter un membre d'équipage" });
    if (s.lieu === ILES[s.ile].port) a.push({ id: "quitter", label: "Renoncer à la piraterie" });
  }
  if (s.lieu === ILES[s.ile].port && ag >= 14) {
    for (const [dest, j] of Object.entries(ROUTES[s.ile])) a.push({ id: "voyager", cible: dest, label: s.navire ? `Naviguer vers ${ILES[dest].nom} (${j} j)` : `Embarquer pour ${ILES[dest].nom} (${j} j, ${j * PRIX_JOUR_MER} B)` });
  }
  if (s.lieu === "base") {
    if (!s.carriere && ag >= 16) a.push({ id: "engager", label: "S'engager dans la Marine" });
    if (s.carriere?.type === "marine") {
      a.push({ id: "service", label: "Faire son service" });
      a.push({ id: "patrouille", label: "Partir en patrouille (mission)" });
      a.push({ id: "quitter", label: "Quitter la Marine" });
    }
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

export function agir(s, action) {
  if (!s.perso.vivant) return res(false, "Cette vie est terminée.");
  const { id, cible } = action;
  const ag = age(s);
  const f = ACTIONS[id];
  if (!f) return res(false, "Cette action n'existe pas dans le jeu.");
  if (s.prison && !["attendre", "evader", "entrainer", "etudier", "maitriser", "repos"].includes(id)) {
    return res(false, `Tu es en prison jusqu'au jour ${s.prison.jusqua + 1}. Tu peux attendre, t'entraîner ou tenter de t'évader.`);
  }
  const r = f(s, cible, ag);
  if (r.ok) s.compteurs.actions += 1;
  if (r.texte) noter(s, r.texte, r.ok ? "action" : "refus");
  verifierMissions(s, null);
  return r;
}

function activite(s, { heures, fatigue, ageMin = 0 }) {
  // Conditions de validité (Q-résolution 3) : elles décident si l'activité a lieu, jamais du montant du gain.
  if (age(s) < ageMin) return `Tu es trop jeune pour ça (à partir de ${ageMin} ans).`;
  if (!tempsDisponible(s, heures)) return "Il est trop tard aujourd'hui. Repose-toi jusqu'à demain.";
  if (s.fatigue >= FATIGUE_MAX_ACTIVITE) return "Tu es trop fatigué : l'activité n'est pas possible. Repose-toi.";
  return null;
}
function gagnerStat(s, k, gain) {
  // Plafond naturel du potentiel : au-delà, l'activité n'apporte rien, mais le gain n'est jamais réduit en dessous.
  if (s.stats[k] >= s.potentiel[k]) return false;
  s.stats[k] += gain; return true;
}

const ACTIONS = {
  aller(s, lieu) {
    if (!LIEUX[lieu]) return res(false, "Ce lieu n'existe pas.");
    if (LIEUX[lieu].ile !== s.ile) return res(false, `Ce lieu est à ${ILES[LIEUX[lieu].ile].nom} : il faut d'abord embarquer depuis le port.`);
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
    p.relation += GAINS.relation_conversation;
    const dernier = p.souvenirs[p.souvenirs.length - 1]; // souvenirs vécus avec toi
    return res(true, repliquePnj(s, id, dernier), { pnj: id });
  },
  jouer(s) {
    const e = activite(s, { heures: 2, fatigue: 15 });
    if (e) return res(false, e);
    consommer(s, 2, 15);
    const k = pick(s, ["endurance", "agilite"]);
    gagnerStat(s, k, GAINS.jeu_enfant);
    return res(true, `Tu cours et grimpes partout avec les enfants du village. ${STATS[k]} +${GAINS.jeu_enfant}.`);
  },
  ecouter(s) {
    const e = activite(s, { heures: 2, fatigue: 5 });
    if (e) return res(false, e);
    if (s.lieu !== "bar") return res(false, "Il faut être au bar Partys.");
    consommer(s, 2, 5);
    gagnerStat(s, "intelligence", GAINS.etude);
    s.pnj.makino.relation += GAINS.relation_conversation;
    return res(true, `Assis au comptoir, tu écoutes les marins raconter la mer. Makino te sert un verre de lait. Intelligence +${GAINS.etude}.`);
  },
  entrainer(s, k) {
    if (!STATS[k]) return res(false, "Cet entraînement n'existe pas.");
    const e = activite(s, { heures: 2, fatigue: 15, ageMin: 6 });
    if (e) return res(false, e);
    if (blessureActive(s) && k !== "intelligence") return res(false, "Tu es blessé : l'entraînement physique attendra ta guérison.");
    consommer(s, 2, 15);
    if (!gagnerStat(s, k, GAINS.entrainement)) return res(true, `Tu t'entraînes, mais tu as atteint ta limite naturelle en ${STATS[k].toLowerCase()}.`);
    return res(true, `Tu t'entraînes dur. ${STATS[k]} +${GAINS.entrainement}.`);
  },
  etudier(s) {
    const e = activite(s, { heures: 2, fatigue: 8, ageMin: 6 });
    if (e) return res(false, e);
    consommer(s, 2, 8);
    gagnerStat(s, "intelligence", GAINS.etude);
    return res(true, `Tu lis et apprends. Intelligence +${GAINS.etude}.`);
  },
  travailler(s) {
    const e0 = EMPLOIS[s.lieu];
    if (!e0) return res(false, "Il n'y a pas de travail ici.");
    const e = activite(s, { heures: e0.heures, fatigue: e0.fatigue, ageMin: e0.ageMin });
    if (e) return res(false, e);
    if (blessureGrave(s)) return res(false, "Ta blessure t'empêche de travailler.");
    const payeur = s.pnj[e0.payeur];
    if (payeur.fonds < e0.salaire) return res(false, `${payeur.nom} n'a plus de quoi te payer en ce moment.`);
    consommer(s, e0.heures, e0.fatigue);
    transferer(s, e0.payeur, "joueur", e0.salaire);
    let gain = "";
    if (e0.competence) { s.competences[e0.competence] += 1; gain = ` ${COMPETENCES[e0.competence]} +1.`; }
    else if (gagnerStat(s, e0.stat, GAINS.entrainement)) gain = ` ${STATS[e0.stat]} +${GAINS.entrainement}.`;
    if (!payeur.invisible) { payeur.relation += GAINS.relation_aide; souvenir(s, e0.payeur, "tu as bien travaillé pour lui"); }
    return res(true, `${e0.texte} Tu gagnes ${e0.salaire} Berrys.${gain}`);
  },
  pecher(s) {
    if (s.lieu !== "port") return res(false, "On pêche au port.");
    if (s.inventaire.canne < 1) return res(false, "Il te faut une canne à pêche.");
    const e = activite(s, { heures: 3, fatigue: 10, ageMin: 8 });
    if (e) return res(false, e);
    consommer(s, 3, 10);
    s.competences.peche += GAINS.peche;
    const pris = rand(s) < 0.3 + s.competences.peche * 0.02 ? 1 + Math.floor(rand(s) * 3) : 0;
    s.inventaire.poisson += pris;
    return res(true, `Tu pêches au bout du quai. ${pris ? `Tu attrapes ${pris} poisson${pris > 1 ? "s" : ""}.` : "Rien ne mord aujourd'hui."} Pêche +${GAINS.peche}.`);
  },
  cuisiner(s) {
    if (s.lieu !== "bar") return res(false, "Il faut être au bar Partys.");
    const e = activite(s, { heures: 3, fatigue: 12, ageMin: 12 });
    if (e) return res(false, e);
    consommer(s, 3, 12);
    s.competences.cuisine += 1;
    s.pnj.makino.relation += GAINS.relation_aide;
    souvenir(s, "makino", "tu l'as aidée en cuisine");
    return res(true, "Tu aides Makino en cuisine pendant le service. Cuisine +1.");
  },
  acheter(s, objet) {
    const o = OBJETS[objet];
    if (!o || !o.vendeur) return res(false, "Personne ne vend ça ici.");
    const v = s.pnj[o.vendeur];
    if (!pnjIci(s).includes(o.vendeur)) return res(false, `${v.nom} n'est pas ici.`);
    if ((v.stock?.[objet] ?? 0) < 1) return res(false, `${v.nom} n'en a plus en stock.`);
    if (s.berrys < o.prix) return res(false, `Il te faut ${o.prix} Berrys ; tu en as ${s.berrys}.`);
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
    s.competences.charpenterie += GAINS.charpenterie;
    consommer(s, 0, 5);
    return res(true, `Tu répares le toit de la remise avec 3 planches et 6 clous. Charpenterie +${GAINS.charpenterie}.`);
  },
  combattre(s) {
    if (s.lieu !== "port" || !s.monde.voyouAuPort) return res(false, "Il n'y a personne à affronter ici.");
    const e = activite(s, { heures: 1, fatigue: 20, ageMin: 12 });
    if (e) return res(false, e);
    consommer(s, 1, 20);
    const toi = puissance(s) + rand(s) * 10;
    const lui = 8 + rand(s) * 10;
    s.monde.voyouAuPort = false;
    s.competences.combat += GAINS.combat; // l'expérience de l'affrontement, gain fixe
    if (toi >= lui) {
      blesser(s, rand(s) < 0.5 ? 0 : 1);
      s.pnj.bern.relation += 5;
      souvenir(s, "bern", "tu as chassé un voyou du port");
      return res(true, `Tu fais face au voyou. Après un échange de coups, il détale. Combat +${GAINS.combat}.`);
    }
    blesser(s, rand(s) < 0.3 ? 2 : 1);
    return res(true, `Le voyou est plus coriace que prévu. Il te laisse au sol et s'enfuit. Combat +${GAINS.combat}.`);
  },
  accepter(s, mid) {
    const m = s.missions.find(m => m.id === mid && m.statut === "proposée");
    if (!m) return res(false, "Cette proposition n'existe plus.");
    // Séquestre de la récompense avant engagement (Q-résolution 2).
    if (s.pnj[m.donneur].fonds < m.recompense) {
      return res(false, `${s.pnj[m.donneur].nom} n'a plus les fonds : la mission ne peut pas être garantie.`);
    }
    s.pnj[m.donneur].fonds -= m.recompense; m.sequestre = m.recompense;
    m.statut = "active"; m.echeance = s.jour + m.duree;
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
    let recuperation = 70, txt;
    if (s.ile === "fuchsia") { s.lieu = "maison"; txt = "Tu rentres dormir chez toi."; }
    else if (s.berrys >= PRIX_AUBERGE) {
      s.lieu = lit; transferer(s, "joueur", "dock", PRIX_AUBERGE);
      txt = `Tu paies ${PRIX_AUBERGE} Berrys pour une nuit ${LIEUX[lit].a}.`;
    } else { s.lieu = lit; recuperation = 35; txt = "Sans argent pour une chambre, tu dors dehors. Tu récupères mal."; }
    const r = avancer(s, 1, { recuperation });
    return res(true, `${txt} ${r.texte}`, { interruption: r.interruption });
  },
  voyager(s, dest) {
    if (!ILES[dest] || dest === s.ile) return res(false, "Cette destination n'existe pas.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "Les navires partent du port.");
    if (age(s) < 14) return res(false, "Tu es trop jeune pour embarquer seul (à partir de 14 ans).");
    const jours = ROUTES[s.ile][dest];
    const prix = s.navire ? 0 : jours * PRIX_JOUR_MER;
    if (s.berrys < prix) return res(false, `La traversée coûte ${prix} Berrys ; tu en as ${s.berrys}.`);
    s.berrys -= prix; s.monde.exterieur += prix;
    const depart = ILES[s.ile].nom;
    // Les jours de mer passent réellement : le monde continue, les blessures guérissent.
    // Avec une prime sur la tête, la Marine peut intercepter le navire en mer.
    for (let j = 0; j < jours; j++) {
      avancer(s, 1, { sansInterruption: true });
      if (!s.perso.vivant) return res(true, "Ta vie s'achève en mer.");
      if (s.prime > 0 && rand(s) < Math.min(0.25, 0.03 * s.infamie)) {
        const r = combatMarine(s, "en mer");
        if (s.prison || !s.perso.vivant) return r;
        noter(s, r.texte, "action");
      }
    }
    s.ile = dest; s.lieu = ILES[dest].port;
    noter(s, `Tu débarques à ${ILES[dest].nom}, ${ILES[dest].desc}.`, "voyage");
    let txt = `Tu quittes ${depart}${s.navire ? ` à bord du « ${s.navire.nom} »` : ""}. Après ${jours} jours de mer, tu arrives à ${ILES[dest].nom}.`;
    // Shells Town abrite une base de la Marine : un pirate recherché y est vite repéré.
    if (dest === "shells" && s.prime > 0 && rand(s) < 0.6) {
      const r = combatMarine(s, "sur le port de Shells Town");
      txt += ` ${r.texte}`;
    }
    return res(true, txt);
  },
  pirate(s) {
    if (s.carriere?.type === "marine") return res(false, "Quitte d'abord la Marine.");
    if (s.carriere?.type === "pirate") return res(false, "Tu es déjà pirate.");
    if (age(s) < 16) return res(false, "Tu es trop jeune pour prendre la mer en pirate (16 ans).");
    if (!s.navire) return res(false, "Un pirate a besoin d'un navire. Tomas vend des barques à Fuchsia.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "On hisse le pavillon depuis le port.");
    s.carriere = { type: "pirate", equipage: `Pirates de ${s.perso.prenom}`, depuis: s.jour, raids: 0 };
    return res(true, `Tu hisses un pavillon noir sur « ${s.navire.nom} ». Les ${s.carriere.equipage} sont nés. La Marine ne te connaît pas encore.`);
  },
  recruter(s) {
    if (s.carriere?.type !== "pirate") return res(false, "Seul un capitaine pirate recrute un équipage.");
    if (!TAVERNES.includes(s.lieu)) return res(false, "On trouve des recrues dans les tavernes et les bars.");
    if (equipage(s).length >= NAVIRES[s.navire?.type]?.capacite) return res(false, "Ton navire est plein. Une caravelle (Loguetown) accueille plus de monde.");
    const e = activite(s, { heures: 2, fatigue: 5 });
    if (e) return res(false, e);
    consommer(s, 2, 5);
    const noms = ["Dag", "Orso", "Pia", "Zeke", "Luna", "Kurt", "Moe", "Vera", "Toby", "Ines", "Rufo", "Alba"];
    const roles = [["navigateur", 3], ["cuisinier", 4], ["combattant", 9], ["canonnier", 7], ["charpentier de bord", 5], ["médecin de bord", 3]];
    const [role, fbase] = roles[Math.floor(rand(s) * roles.length)];
    const nom = noms[Math.floor(rand(s) * noms.length)];
    const chance = Math.min(0.9, 0.3 + s.stats.charisme * 0.02 + s.infamie * 0.04);
    if (rand(s) >= chance) return res(true, `Tu proposes à ${nom}, ${role}, de rejoindre ton équipage. ${nom} refuse : ${s.prime ? "trop risqué" : "personne n'a jamais entendu parler de toi"}.`);
    const id = `r${s.jour}_${Math.floor(rand(s) * 1e6)}`;
    s.pnj[id] = { nom, role: `${role} de ton équipage`, genre: rand(s) < 0.5 ? "f" : "g", lieu: "equipage", relation: 20, fonds: 0, souvenirs: [], force: fbase + Math.floor(rand(s) * 5), membre: true };
    souvenir(s, id, "tu l'as recruté dans ton équipage");
    return res(true, `${nom}, ${role}, accepte de te suivre ! Ton équipage compte ${equipage(s).length} membre${equipage(s).length > 1 ? "s" : ""}.`);
  },
  attaquer(s) {
    if (s.carriere?.type !== "pirate" || !s.navire) return res(false, "Il faut être pirate et avoir un navire.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "On part à l'abordage depuis le port.");
    const e = activite(s, { heures: 8, fatigue: 40 });
    if (e) return res(false, e);
    if (blessureGrave(s)) return res(false, "Tu es trop gravement blessé pour un abordage.");
    consommer(s, 8, 40);
    s.carriere.raids += 1;
    const cible = 15 + rand(s) * 20;
    const nous = puissance(s) + forceEquipage(s) + rand(s) * 15;
    if (nous < cible) {
      blesser(s, rand(s) < 0.3 ? 2 : 1);
      const membres = equipage(s);
      if (membres.length && rand(s) < 0.3) { const d = membres[Math.floor(rand(s) * membres.length)]; s.pnj[d].lieu = "disparu"; noter(s, `Déçu, ${s.pnj[d].nom} quitte ton équipage.`, "monde"); }
      return res(true, "L'abordage tourne mal : l'équipage marchand vous repousse et tu es blessé.");
    }
    // Butin pris au commerce extérieur (comptabilisé) ; l'équipage reçoit sa part.
    const butin = Math.round((150 + rand(s) * 350) * (1 + equipage(s).length / 3));
    s.monde.exterieur -= butin;
    const membres = equipage(s);
    const part = membres.length ? Math.floor(butin * 0.4 / membres.length) : 0;
    for (const id of membres) { s.pnj[id].fonds += part; s.pnj[id].relation += 3; }
    s.berrys += butin - part * membres.length;
    s.infamie += 1; s.prime = calculPrime(s.infamie);
    let txt = `À l'abordage ! Le navire marchand se rend. Butin : ${butin} Berrys${membres.length ? `, dont ${part * membres.length} partagés avec l'équipage` : ""}. Ta prime passe à ${s.prime.toLocaleString("fr-FR")} Berrys.`;
    const reste = Object.keys(FRUITS).filter(f => !s.monde.fruitsTrouves.includes(f));
    if (reste.length && rand(s) < 0.05) {
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
    const x = rand(s);
    if (reste.length && x < 0.012) {
      const f = reste[Math.floor(rand(s) * reste.length)];
      s.monde.fruitsTrouves.push(f); s.inventaire.fruits.push(f);
      return res(true, `Sous des racines, tu découvres un fruit étrange couvert de spirales… C'est un Fruit du Démon : le ${FRUITS[f].nom} (${FRUITS[f].type}) !`);
    }
    if (x < 0.15) {
      const n = 5 + Math.floor(rand(s) * 25);
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
  maitriser(s) {
    if (!s.fruit) return res(false, "Tu n'as pas de pouvoir à maîtriser.");
    const e = activite(s, { heures: 3, fatigue: 20 });
    if (e) return res(false, e);
    consommer(s, 3, 20);
    s.fruit.maitrise += 1; // gain fixe (D.2A)
    return res(true, `Tu t'exerces avec le pouvoir du ${FRUITS[s.fruit.id].nom}. Maîtrise +1 (${s.fruit.maitrise}).`);
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
      s.prison = null; s.lieu = "port_shells";
      s.infamie += 1; s.prime = calculPrime(s.infamie);
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
    s.carriere = { type: "marine", rang: 0, merite: 0, depuis: s.jour };
    souvenir(s, "rivo", "tu t'es engagé dans la Marine");
    return res(true, `Tu signes ton engagement. Te voilà ${RANGS_MARINE[0]} de la Marine, avec une solde de ${SOLDE_MARINE[0]} Berrys par semaine.`);
  },
  service(s) {
    if (s.carriere?.type !== "marine" || s.lieu !== "base") return res(false, "Le service se fait à la base, dans la Marine.");
    const e = activite(s, { heures: 6, fatigue: 25 });
    if (e) return res(false, e);
    consommer(s, 6, 25);
    s.carriere.merite += GAINS.merite_service;
    gagnerStat(s, "force", GAINS.entrainement);
    s.competences.combat += 1;
    return res(true, `Exercices, corvées et maniement des armes. Mérite +${GAINS.merite_service}, Force +${GAINS.entrainement}, Combat +1.${promotion(s)}`);
  },
  patrouille(s) {
    if (s.carriere?.type !== "marine" || s.lieu !== "base") return res(false, "Les patrouilles partent de la base.");
    const e = activite(s, { heures: 8, fatigue: 35 });
    if (e) return res(false, e);
    if (blessureActive(s)) return res(false, "Tu es blessé : on ne t'envoie pas en patrouille.");
    consommer(s, 8, 35);
    // Mission formelle : réussite ou échec, sans entre-deux (L.3A).
    const difficulte = 10 + s.carriere.rang * 4;
    const score = puissance(s) + rand(s) * 12;
    if (score >= difficulte) {
      s.carriere.merite += GAINS.merite_patrouille;
      return res(true, `Patrouille réussie : vous arrêtez une bande de contrebandiers. Mérite +${GAINS.merite_patrouille}.${promotion(s)}`);
    }
    blesser(s, rand(s) < 0.25 ? 2 : 1);
    return res(true, "Patrouille échouée : les contrebandiers vous échappent et tu es blessé.");
  },
  quitter(s) {
    if (s.carriere?.type === "pirate") {
      s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
      for (const id of equipage(s)) s.pnj[id].lieu = "disparu";
      return res(true, `Tu dissous ton équipage et renonces à la piraterie. Ta prime de ${s.prime.toLocaleString("fr-FR")} Berrys, elle, reste affichée.`);
    }
    if (s.carriere?.type !== "marine") return res(false, "Tu n'es pas dans la Marine.");
    const rang = RANGS_MARINE[s.carriere.rang];
    s.ancienneCarriere = { ...s.carriere, fin: s.jour };
    s.carriere = null;
    return res(true, `Tu rends ton uniforme de ${rang}. Tu es libre.`);
  },
  declarer(s, id) {
    const p = s.pnj[id];
    if (!p?.romance || !pnjIci(s).includes(id)) return res(false, "Cette personne n'est pas là.");
    if (age(s) < 18 || (agePnj(s, id) ?? 0) < 18) return res(false, "Ce n'est pas possible.");
    if (s.famille.partenaire) return res(false, "Tu es déjà en couple.");
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
      p.lieu = "maison"; p.relation += 15; souvenir(s, id, "vous vous êtes mariés");
      return res(true, `${p.nom} dit oui ! Vous vous mariez à Fuchsia, et ${il(p)} vient vivre avec toi dans ta maison.`);
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
    if (rand(s) < 0.7) {
      s.famille.grossesse = { debut: s.jour, terme: s.jour + 270 };
      return res(true, `${p.nom} est d'accord. Quelques semaines plus tard, la nouvelle tombe : un enfant est en route.`);
    }
    return res(true, `${p.nom} préfère attendre encore un peu.`);
  },
};

// Promotion automatique dès que le mérite atteint le seuil du grade suivant.
function promotion(s) {
  const c = s.carriere;
  if (!c || c.rang >= RANGS_MARINE.length - 1 || c.merite < MERITE_RANG[c.rang + 1]) return "";
  c.rang += 1;
  noter(s, `Promotion : tu deviens ${RANGS_MARINE[c.rang]} de la Marine.`, "mission");
  return ` Promotion : tu deviens ${RANGS_MARINE[c.rang]} ! Nouvelle solde : ${SOLDE_MARINE[c.rang]} Berrys par semaine.`;
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
  const base = 1 + Math.min(10, Math.floor((s.jour - e.naissance) / 365 / 3));
  s.stats = { force: base, agilite: base, endurance: base, intelligence: base, charisme: base };
  s.competences = { charpenterie: 0, peche: 0, combat: 0, cuisine: 0 };
  for (const k of Object.keys(s.stats)) s.potentiel[k] = 40 + Math.floor(rand(s) * 61);
  s.sante = { blessures: [], sequelles: [] };
  s.fatigue = 0; s.carriere = null; s.ancienneCarriere = null;
  const parent = s.famille.partenaire;
  s.famille = { partenaire: null, statut: null, enfants: [], grossesse: null };
  if (parent && s.pnj[parent]) { s.pnj[parent].relation = 60; s.pnj[parent].role = "ton parent"; }
  s.ile = "fuchsia"; s.lieu = "maison";
  noter(s, `Tu es ${e.prenom}, enfant de ${s.ancetres.at(-1).prenom}. Tu hérites de ${heritage} Berrys et de la maison familiale de Fuchsia.`, "naissance");
  return res(true, `La vie continue avec ${e.prenom}.`);
}

// Puissance de combat : caractéristiques, expérience, arme et pouvoir du fruit.
export function puissance(s) {
  const fruit = s.fruit ? FRUITS[s.fruit.id].bonus + Math.floor(s.fruit.maitrise / 2) : 0;
  return s.stats.force + s.stats.agilite + s.competences.combat * 2 + (s.inventaire.sabre > 0 ? 4 : 0) + fruit;
}
export const equipage = s => Object.keys(s.pnj).filter(id => s.pnj[id].lieu === "equipage" && s.pnj[id].vivant !== false);
const forceEquipage = s => equipage(s).reduce((t, id) => t + (s.pnj[id].force || 0), 0);
export const calculPrime = infamie => infamie <= 0 ? 0 : Math.round(infamie * infamie * 400000 + infamie * 1600000);

// Affrontement avec la Marine : victoire (fuite) ou capture. Un utilisateur de fruit peut se noyer en mer.
function combatMarine(s, ou) {
  const marine = 18 + s.infamie * 3 + rand(s) * 20;
  const nous = puissance(s) + forceEquipage(s) * 0.5 + rand(s) * 20;
  if (nous >= marine) {
    s.infamie += 1; s.prime = calculPrime(s.infamie);
    if (rand(s) < 0.4) blesser(s, 0);
    return res(true, `La Marine vous attaque ${ou} ! Vous la repoussez et prenez la fuite. Ta prime monte à ${s.prime.toLocaleString("fr-FR")} Berrys.`);
  }
  if (s.fruit && ou === "en mer" && rand(s) < 0.2) {
    s.perso.vivant = false;
    noter(s, `${s.perso.prenom} tombe à la mer pendant l'abordage. Le pouvoir du fruit l'empêche de nager.`, "mort");
    return res(true, "Pendant l'abordage, tu tombes à l'eau. Ton fruit t'empêche de nager… Ta vie s'achève en mer.");
  }
  return capturer(s, ou);
}
function capturer(s, ou) {
  const jours = 30 + s.infamie * 20;
  s.prison = { jusqua: s.jour + jours, depuis: s.jour };
  for (const id of equipage(s)) { s.pnj[id].lieu = "disparu"; s.pnj[id].relation -= 10; }
  const navire = s.navire?.nom;
  s.navire = null;
  if (s.carriere?.type === "pirate") s.carriere.capture = (s.carriere.capture || 0) + 1;
  s.ile = "shells"; s.lieu = "base";
  blesser(s, 1);
  noter(s, `Capturé ${ou}. Condamné à ${jours} jours de prison à la base de Shells Town.`, "mission");
  return res(true, `La Marine vous submerge ${ou}. Tu es capturé${navire ? `, « ${navire} » est saisi` : ""} et ton équipage se disperse. Tu es condamné à ${jours} jours de prison à Shells Town.`);
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
  const b = { ...types[gravite] };
  if (b.sequelle && rand(s) > 0.4) delete b.sequelle;
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
    pont_baratie: ["pont"], salle_baratie: ["salle", "restaurant"], cuisine_baratie: ["cuisine"],
    quais_logue: ["quai", "port", "dock"], marche_logue: ["marche"], armurerie: ["armurerie", "arme"], echafaud: ["echafaud"], auberge_logue: ["auberge"] };
  const lieuMots = Object.fromEntries(Object.entries(lieuMotsTous).filter(([k]) => LIEUX[k].ile === s.ile));
  const ileMots = { fuchsia: ["fuchsia", "dawn"], shells: ["shells"], baratie: ["baratie"], loguetown: ["loguetown", "logue"] };
  const pnjMots = { makino: ["makino"], woop: ["maire", "woop"], tomas: ["tomas", "charpentier"], bern: ["bern", "pecheur"], ilda: ["ilda", "marchande"],
    sacha: ["sacha"], rivo: ["rivo", "sergent", "recruteur"], mira: ["mira"], gallo: ["gallo", "chef"], nino: ["nino", "serveur"], barro: ["barro", "armurier"], lise: ["lise", "bijout"] };
  const morceaux = t.split(/,| puis | et ensuite | ensuite |;| et /);
  for (const m of morceaux) {
    if (/(embarque|navigue|voyage|pars pour|part pour|bateau|navire)/.test(m)) {
      const d = Object.entries(ileMots).find(([, mots]) => mots.some(w => m.includes(w)));
      if (d) { actions.push({ id: "voyager", cible: d[0] }); continue; }
    }
    if (/(engage|enrole)/.test(m)) { actions.push({ id: "engager" }); continue; }
    if (/(pavillon|devenir pirate|deviens pirate)/.test(m)) { actions.push({ id: "pirate" }); continue; }
    if (/recrut/.test(m)) { actions.push({ id: "recruter" }); continue; }
    if (/(abordage|attaque.*navire|pille)/.test(m)) { actions.push({ id: "attaquer" }); continue; }
    if (/(explor|fouill)/.test(m)) { actions.push({ id: "explorer" }); continue; }
    if (/(evade|evasion)/.test(m)) { actions.push({ id: "evader" }); continue; }
    if (/(mange|croque).*fruit/.test(m) && s.inventaire.fruits.length) { actions.push({ id: "manger", cible: s.inventaire.fruits[0] }); continue; }
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
      const o = /planche/.test(m) ? "planche" : /clou/.test(m) ? "clou" : /canne/.test(m) ? "canne" : /sabre/.test(m) ? "sabre" : /bague/.test(m) ? "bague" : /barque/.test(m) ? "barque" : /caravelle/.test(m) ? "caravelle" : null;
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
    `Lieu : ${LIEUX[s.lieu].nom}, à ${ILES[s.ile].nom} (${ILES[s.ile].desc}). Heure : ${Math.floor(s.heure)}h. Météo : ${s.monde.meteo}.`,
    `Protagoniste : ${s.perso.prenom}, ${age(s)} ans${s.carriere?.type === "marine" ? `, ${RANGS_MARINE[s.carriere.rang]} de la Marine` : ""}${s.carriere?.type === "pirate" ? `, capitaine des ${s.carriere.equipage}` : ""}${s.prime ? `, prime de ${s.prime} Berrys` : ""}${s.fruit ? `, mangeur du ${FRUITS[s.fruit.id].nom} (${FRUITS[s.fruit.id].pouvoir})` : ""}${s.prison ? ", en prison" : ""}. Fatigue ${s.fatigue}/100.${blessureActive(s) ? ` Blessé : ${s.sante.blessures.map(b => b.nom).join(", ")}.` : ""}`,
    ici.length ? `Présents : ${ici.join(", ")}.` : "Personne d'autre n'est présent.",
    `Résultat établi par le jeu : ${resultat}`,
  ].join("\n");
}
