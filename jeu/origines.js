// Étape 6 · La rejouabilité : origines, peuples, départs imposés (défis) et succès.

import { noter } from "./engine.js";

export const ORIGINES = {
  fuchsia: { nom: "Fuchsia (East Blue)", foyer: "maison", texte: "Tu nais à Fuchsia, un petit village paisible de l'île de Dawn, sur East Blue." },
  shells: { nom: "Shells Town (East Blue)", foyer: "maison_shells", texte: "Tu nais à Shells Town, à l'ombre de la base de la Marine." },
  loguetown: { nom: "Loguetown (East Blue)", foyer: "maison_logue", texte: "Tu nais à Loguetown, la ville du commencement et de la fin." },
  water_seven: { nom: "Water Seven (Grand Line)", foyer: "maison_w7", texte: "Tu nais à Water Seven, au son des marteaux des charpentiers et du clapotis des canaux." },
  hommes_poissons: { nom: "Île des Hommes-Poissons", foyer: "maison_hp", texte: "Tu nais à 10 000 mètres sous la mer, dans le royaume de l'île des Hommes-Poissons.", peuple: "homme_poisson" },
};

export const PEUPLES = {
  humain: { nom: "Humain", desc: "Le peuple le plus répandu des mers." },
  homme_poisson: { nom: "Homme-poisson", desc: "Dix fois plus fort qu'un humain sous l'eau, il nage comme il respire. Mais à la surface, beaucoup le méprisent.", origine: "hommes_poissons" },
};

export const DEFIS = {
  aucun: { nom: "Aucun", desc: "Une naissance ordinaire, avec tes deux parents." },
  orphelin: { nom: "Orphelin", desc: "Tes parents disparaissent en mer peu après ta naissance. Tu grandis seul, et plus dur." },
  enfant_pirate: { nom: "Enfant d'un pirate recherché", desc: "Ton père était un pirate recherché. La Marine se méfie de toi dès le berceau." },
  heritier: { nom: "Héritier", desc: "Ta famille est riche : tes parents ont de quoi te transmettre une fortune… s'ils te la laissent." },
};

// Appliqué juste après la création du monde (parents déjà créés).
export function appliquerOrigine(s, { origine, peuple, defi }) {
  s.origine = origine; s.peuple = peuple; s.defi = defi;
  if (peuple === "homme_poisson") { s.stats.force += 3; s.stats.endurance += 2; }
  if (defi === "orphelin") {
    for (const id of ["mere", "pere"]) if (s.pnj[id]) { s.monde.exterieur += s.pnj[id].fonds; s.pnj[id].fonds = 0; s.pnj[id].vivant = false; s.pnj[id].mort = 0; s.pnj[id].cause = "en mer"; }
    s.traits.courage += 2;
    s.pnj.makino && (s.pnj.makino.relation += 20);
  }
  if (defi === "enfant_pirate") { s.reputation.marine = -20; s.reputation.pirates = 10; s.traits.ambition += 1; }
  if (defi === "heritier") for (const id of ["mere", "pere"]) if (s.pnj[id]) { s.monde.exterieur -= 4700; s.pnj[id].fonds += 4700; }
}

export const texteNaissance = (s, prenoms) => {
  const o = ORIGINES[s.origine] || ORIGINES.fuchsia;
  const parents = s.defi === "orphelin" ? "Tes parents disparaissent en mer quelques semaines plus tard ; c'est le village qui t'élève." : `Tes parents, ${prenoms}, t'appellent ${s.perso.prenom}.`;
  return `${o.texte} ${parents}${s.peuple === "homme_poisson" ? " Tu es un homme-poisson." : ""}`;
};

// ---------- Succès (débloqués une fois par vie, cumulés dans le mémorial) ----------

export const SUCCES = {
  premier_salaire: ["Premier salaire", s => s.compteurs.salaires >= 1],
  majeur: ["Adulte", s => s.jour - s.perso.naissance >= 18 * 365],
  centenaire: ["Centenaire", s => s.jour - s.perso.naissance >= 100 * 365],
  mer: ["Prendre le large", s => s.ile !== (s.origine || "fuchsia")],
  grand_line: ["Bienvenue sur Grand Line", s => ["cap", "little_garden", "water_seven", "sabaody"].includes(s.ile) && s.origine !== "water_seven"],
  nouveau_monde: ["Le Nouveau Monde", s => ["dressrosa", "wano"].includes(s.ile)],
  fruit: ["Mangeur de fruit", s => !!s.fruit],
  haki: ["Volonté éveillée", s => Object.values(s.haki?.eveil || {}).some(Boolean)],
  rois: ["Haki des Rois", s => !!s.haki?.eveil?.rois],
  prime: ["Avis de recherche", s => s.prime > 0],
  prime_100m: ["Cent millions", s => s.prime >= 100000000],
  milliard: ["Un milliard", s => s.prime >= 1000000000],
  amiral: ["Lieutenant de la Marine", s => s.carriere?.type === "marine" && s.carriere.rang >= 6],
  vrai_amiral: ["Amiral", s => s.carriere?.type === "marine" && s.carriere.rang >= 11],
  corsaire: ["Grand Corsaire", s => !!s.carriere?.corsaire],
  empereur: ["Empereur", s => !!s.carriere?.empereur],
  chasseur: ["Chasseur redouté", s => s.carriere?.type === "chasseur" && s.carriere.captures >= 5],
  revolution: ["Révolutionnaire", s => s.carriere?.type === "revolution" && s.carriere.missions >= 5],
  mariage: ["Marié", s => s.famille.statut === "marié"],
  famille: ["Grande famille", s => s.famille.enfants.length >= 3],
  riche: ["Fortune", s => s.berrys >= 100000],
  evasion: ["Évadé", s => !!s.drapeaux?.evade],
  shanks: ["Le bras de Shanks", s => !!s.chrono?.divergences?.bras_shanks],
  colisee: ["Champion du Colisée", s => (s.compteurs.colisee || 0) >= 3],
  dynastie: ["Dynastie", s => (s.generation || 1) >= 3],
};

export function verifierSucces(s) {
  s.succes ??= {};
  for (const [id, [nom, test]] of Object.entries(SUCCES)) {
    if (s.succes[id] || !test(s)) continue;
    s.succes[id] = s.jour;
    noter(s, `Succès débloqué : ${nom} !`, "succes");
  }
}
