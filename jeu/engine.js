// One Piece Life — moteur de simulation (autorité sur les faits).
// Module pur : aucune dépendance au navigateur, testable avec Node.
// Règles appliquées : gains fixes (D.2A), missions binaires avec séquestre (L.3A, L.4A),
// guérison automatique en temps simulé (K.2A), fabrication instantanée si ressources (I.5A),
// monde figé hors session (01.6A : rien ne bouge sans action du joueur).

export const VERSION = 1;
export const JOUR_HEURES = 16; // heures d'éveil par jour
export const FATIGUE_MAX_ACTIVITE = 80;

export const LIEUX = {
  maison: { nom: "ta maison", court: "Maison", a: "chez toi" },
  bar: { nom: "le bar Partys", court: "Bar Partys", a: "au bar Partys" },
  place: { nom: "la place du village", court: "Place", a: "sur la place du village" },
  port: { nom: "le port", court: "Port", a: "au port" },
  atelier: { nom: "l'atelier du charpentier", court: "Atelier", a: "à l'atelier du charpentier" },
  remise: { nom: "la remise du maire", court: "Remise", a: "à la remise du maire" },
  colline: { nom: "la colline", court: "Colline", a: "sur la colline" },
};

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
};

// Gains fixes prédéfinis (D.2A) : jamais modulés.
export const GAINS = {
  entrainement: 1, etude: 1, jeu_enfant: 1, peche: 1, charpenterie: 1, combat: 1,
  relation_conversation: 2, relation_aide: 5, salaire_port: 30,
};

const PNJ_INITIAUX = () => ({
  makino: { nom: "Makino", role: "tient le bar Partys", canon: true, lieu: "bar", relation: 10, fonds: 3000, souvenirs: [] },
  woop: { nom: "Woop Slap", role: "maire du village", canon: true, lieu: "place", relation: 0, fonds: 2500, souvenirs: [] },
  tomas: { nom: "Tomas", role: "charpentier", canon: false, lieu: "atelier", relation: 0, fonds: 800, souvenirs: [], stock: { planche: 30 } },
  bern: { nom: "Bern", role: "pêcheur", canon: false, lieu: "port", relation: 0, fonds: 600, souvenirs: [] },
  ilda: { nom: "Ilda", role: "marchande ambulante", canon: false, lieu: "place", relation: 0, fonds: 1200, souvenirs: [], stock: { clou: 80, canne: 2 }, presente: true },
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
    berrys: 0, inventaire: { planche: 0, clou: 0, poisson: 0, canne: 0 },
    sante: { blessures: [], sequelles: [] },
    lieu: "maison",
    pnj: PNJ_INITIAUX(),
    monde: { toitRemise: "abîmé", prochainNavire: 18, voyouAuPort: false, meteo: "beau", exterieur: 100000 },
    missions: [], journal: [], compteurs: { actions: 0 },
  };
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
  return Object.entries(s.pnj).filter(([, p]) => p.lieu === s.lieu && p.presente !== false).map(([id]) => id);
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
function passerJour(s) {
  const importants = [];
  s.jour += 1; s.heure = 8;
  s.fatigue = Math.max(0, s.fatigue - 70);
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
  s.monde.voyouAuPort = age(s) >= 12 && rand(s) < 0.06;
  if (s.monde.voyouAuPort) importants.push({ type: "voyou", texte: "Un voyou de passage traîne au port et cherche des ennuis." });
  // Missions : échéances.
  verifierMissions(s, importants);
  // Proposition de mission par le maire (conditions réelles : toit abîmé, fonds suffisants, âge).
  if (s.monde.toitRemise === "abîmé" && age(s) >= 12 && !s.missions.some(m => m.code === "toit" && ["proposée", "active"].includes(m.statut))
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
export function avancer(s, jours) {
  if (!s.perso.vivant) return res(false, "Cette vie est terminée.");
  const debut = s.jour;
  let interruption = null;
  for (let i = 0; i < jours; i++) {
    const evts = passerJour(s);
    // Seuls les événements qui demandent une décision interrompent l'ellipse (01.3C) ;
    // l'arrivée d'un navire est notée au journal sans arrêter le temps.
    const imp = evts.find(e => ["voyou", "mission", "mort"].includes(e.type));
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
  if (ag < 6) {
    a.push({ id: "jouer", label: "Jouer dehors" });
    if (s.lieu === "bar") a.push({ id: "ecouter", label: "Écouter les histoires du bar" });
  } else {
    a.push({ id: "entrainer", cible: "force", label: "S'entraîner (force)" });
    a.push({ id: "entrainer", cible: "agilite", label: "S'entraîner (agilité)" });
    a.push({ id: "entrainer", cible: "endurance", label: "Courir (endurance)" });
    a.push({ id: "etudier", label: "Lire et étudier" });
    if (s.lieu === "port" && ag >= 10) a.push({ id: "travailler", label: "Travailler avec Bern" });
    if (s.lieu === "port" && s.inventaire.canne > 0) a.push({ id: "pecher", label: "Pêcher" });
    if (s.lieu === "atelier" && ag >= 10) a.push({ id: "acheter", cible: "planche", label: "Acheter une planche (20 B)" });
    if (ici.includes("ilda")) {
      a.push({ id: "acheter", cible: "clou", label: "Acheter un clou (2 B)" });
      if (s.pnj.ilda.stock.canne > 0) a.push({ id: "acheter", cible: "canne", label: "Acheter une canne à pêche (60 B)" });
    }
    if (s.lieu === "remise" && s.monde.toitRemise === "abîmé") a.push({ id: "reparer", label: "Réparer le toit (3 planches, 6 clous)" });
    if (s.lieu === "port" && s.monde.voyouAuPort) a.push({ id: "combattre", label: "Affronter le voyou" });
    if (s.lieu === "bar" && ag >= 12) a.push({ id: "cuisiner", label: "Aider Makino en cuisine" });
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
    if (!LIEUX[lieu]) return res(false, "Ce lieu n'existe pas à Fuchsia.");
    if (s.lieu === lieu) return res(false, `Tu es déjà ${LIEUX[lieu].a}.`);
    if (!tempsDisponible(s, 0.5)) return res(false, "Il fait nuit. Rentre te reposer.");
    if (blessureGrave(s) && lieu === "colline") return res(false, "Ta blessure t'empêche de grimper la colline.");
    s.lieu = lieu; consommer(s, 0.5, 1);
    const ici = pnjIci(s).map(id => s.pnj[id].nom);
    return res(true, `Tu vas ${LIEUX[lieu].a}.${ici.length ? ` ${ici.join(" et ")} ${ici.length > 1 ? "sont" : "est"} là.` : ""}`);
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
    if (s.lieu !== "port") return res(false, "Bern travaille au port.");
    const e = activite(s, { heures: 4, fatigue: 25, ageMin: 10 });
    if (e) return res(false, e);
    if (blessureGrave(s)) return res(false, "Ta blessure t'empêche de travailler.");
    if (s.pnj.bern.fonds < GAINS.salaire_port) return res(false, "Bern n'a plus de quoi te payer en ce moment.");
    consommer(s, 4, 25);
    transferer(s, "bern", "joueur", GAINS.salaire_port);
    s.competences.peche += GAINS.peche;
    s.pnj.bern.relation += GAINS.relation_aide;
    souvenir(s, "bern", "tu l'as aidé à remonter les filets");
    return res(true, `Tu aides Bern à remonter les filets et trier la pêche. Il te paie ${GAINS.salaire_port} Berrys. Pêche +${GAINS.peche}.`);
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
    transferer(s, "joueur", o.vendeur, o.prix);
    v.stock[objet] -= 1; s.inventaire[objet] += 1;
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
    const toi = s.stats.force + s.stats.agilite + s.competences.combat * 2 + rand(s) * 10;
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
    if (s.lieu !== "maison") { s.lieu = "maison"; }
    const r = avancer(s, 1);
    return res(true, `Tu rentres dormir. ${r.texte}`, { interruption: r.interruption });
  },
};

function blesser(s, gravite) {
  const types = [
    { nom: "contusions", jours: 3 },
    { nom: "entaille au bras", jours: 7 },
    { nom: "côte fêlée", jours: 21, sequelle: "douleur au flanc par temps humide" },
  ];
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
  }[id];
  let txt = `${p.nom} : ${pick(s, lignes)}`;
  // Mémoire subjective : seul ce PNJ se souvient de ce qu'il a vécu avec toi.
  if (dernier?.texte && s.jour - dernier.jour <= 14 && rand(s) < 0.6) {
    txt += ` ${["woop", "tomas", "bern"].includes(id) ? "Il" : "Elle"} n'a pas oublié que ${dernier.texte}.`;
  }
  return txt;
}

// ---------- Interprétation sans IA (saisie libre simple) ----------

const NORMALISER = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function interpreterTexte(s, texte) {
  const t = NORMALISER(texte);
  const actions = [];
  const lieuMots = { bar: ["bar", "partys", "makino"], port: ["port", "quai"], place: ["place"], atelier: ["atelier", "charpentier", "tomas"],
    remise: ["remise"], colline: ["colline"], maison: ["maison", "chez moi"] };
  const pnjMots = { makino: ["makino"], woop: ["maire", "woop"], tomas: ["tomas", "charpentier"], bern: ["bern", "pecheur"], ilda: ["ilda", "marchande"] };
  const morceaux = t.split(/,| puis | et ensuite | ensuite |;| et /);
  for (const m of morceaux) {
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
      const o = /planche/.test(m) ? "planche" : /clou/.test(m) ? "clou" : /canne/.test(m) ? "canne" : null;
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
    `Lieu : ${LIEUX[s.lieu].nom}, à Fuchsia (île de Dawn, East Blue). Heure : ${Math.floor(s.heure)}h. Météo : ${s.monde.meteo}.`,
    `Protagoniste : ${s.perso.prenom}, ${age(s)} ans. Fatigue ${s.fatigue}/100.${blessureActive(s) ? ` Blessé : ${s.sante.blessures.map(b => b.nom).join(", ")}.` : ""}`,
    ici.length ? `Présents : ${ici.join(", ")}.` : "Personne d'autre n'est présent.",
    `Résultat établi par le jeu : ${resultat}`,
  ].join("\n");
}
