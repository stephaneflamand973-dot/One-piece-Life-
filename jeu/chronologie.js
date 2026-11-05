// Étape 3 · La chronologie du canon et l'époque au choix.
// Les années sont comptées par rapport au départ de Luffy (année 0). Les dates sont approximatives (≈) :
// le canon les donne surtout en « il y a N ans ». Les personnages canoniques n'apparaissent qu'à l'époque
// où ils sont réellement là ; le futur canonique n'est pas garanti si le joueur change un événement.

import { age } from "./engine.js";
import { nouvelle } from "./monde.js";

const AN = 365;

export const ERES = {
  roger: { nom: "L'âge d'or de Roger", naissance: -45, desc: "Tu nais quand Gol D. Roger sillonne encore les mers. La piraterie est rare." },
  execution: { nom: "La fin de Roger", naissance: -38, desc: "Tu as environ 16 ans quand Roger est exécuté et que la Grande ère de la piraterie commence." },
  avant_luffy: { nom: "Les années avant Luffy", naissance: -17, desc: "Tu grandis à Fuchsia en même temps qu'un certain garçon au chapeau de paille." },
  luffy: { nom: "L'ère de Luffy", naissance: -20, desc: "Tu as environ 20 ans quand Luffy prend la mer." },
};

// Naissances canoniques approximatives (années par rapport au départ de Luffy).
const NAISSANCES_CANON = { makino: -31, woop: -70, luffy: -17, shanks: -37 };

export const CALENDRIER = [
  { id: "execution_roger", annee: -22, ile: "loguetown", portee: "monde",
    texte: "Gol D. Roger, le Roi des pirates, est exécuté à Loguetown. Ses derniers mots lancent la Grande ère de la piraterie !",
    effet: s => { s.monde.intensitePiraterie = 3; } },
  { id: "arrivee_shanks", annee: -11, ile: "fuchsia", portee: "region",
    texte: "L'équipage du pirate Shanks le Roux jette l'ancre à Fuchsia pour un long séjour.",
    effet: s => { if (s.pnj.shanks) s.pnj.shanks.lieu = "bar"; } },
  { id: "roi_de_la_cote", annee: -10, jourAnnee: 120, ile: "fuchsia", portee: "region",
    texte: "Au large de Fuchsia, le monstre marin qu'on appelle le Seigneur de la Côte a attaqué un enfant tombé à l'eau.",
    interactif: s => s.ile === "fuchsia" && age(s) >= 16 && !s.prison },
  { id: "depart_shanks", annee: -10, jourAnnee: 140, ile: "fuchsia", portee: "region",
    texte: s => s.chrono.divergences.bras_shanks
      ? "Shanks le Roux quitte Fuchsia, ses deux bras intacts grâce à toi, en confiant son chapeau de paille à un petit garçon du village."
      : "Shanks le Roux quitte Fuchsia après avoir sacrifié un bras pour sauver un enfant. Il lui confie son chapeau de paille.",
    effet: s => { if (s.pnj.shanks) s.pnj.shanks.lieu = null; } },
  { id: "depart_ace", annee: -3, ile: "fuchsia", portee: "region",
    texte: "Un jeune homme des montagnes de Dawn, Portgas D. Ace, prend la mer à 17 ans." },
  { id: "depart_luffy", annee: 0, jourAnnee: 60, ile: "fuchsia", portee: "monde",
    texte: s => `Monkey D. Luffy, le garçon au chapeau de paille, quitte Fuchsia sur une petite barque. Il jure de devenir le Roi des pirates${s.chrono.divergences.bras_shanks ? ", comme Shanks qu'on dit désormais invaincu des deux bras" : ""}.`,
    effet: s => { if (s.pnj.luffy) s.pnj.luffy.lieu = null; } },
];

export const anneeRelative = s => s.chrono.naissance + Math.floor(s.jour / AN);
export const anneeTexte = n => n === 0 ? "l'année du départ de Luffy" : n < 0 ? `≈ ${-n} an${n < -1 ? "s" : ""} avant le départ de Luffy` : `≈ ${n} an${n > 1 ? "s" : ""} après le départ de Luffy`;
const jourDe = (s, annee, jourAnnee = 0) => (annee - s.chrono.naissance) * AN + jourAnnee;

export function initialiserChronologie(s, ere = "avant_luffy") {
  if (!s.chrono) {
    const e = ERES[ere] ? ere : "avant_luffy";
    s.chrono = { ere: e, naissance: ERES[e].naissance, faits: {}, divergences: {} };
    // Âges canoniques alignés sur l'époque choisie.
    for (const [id, a] of Object.entries(NAISSANCES_CANON)) if (s.pnj[id]) s.pnj[id].naissance = jourDe(s, a);
    if (!s.pnj.luffy) s.pnj.luffy = { nom: "Luffy", role: "garçon turbulent du village", genre: "g", canon: true, lieu: "colline", relation: 0, fonds: 0,
      souvenirs: [], naissance: jourDe(s, NAISSANCES_CANON.luffy), vivant: true, enfants: [], parents: [], couple: null };
    if (!s.pnj.shanks) s.pnj.shanks = { nom: "Shanks", role: "capitaine pirate, dit le Roux", genre: "g", canon: true, lieu: null, relation: 0, fonds: 0,
      souvenirs: [], naissance: jourDe(s, NAISSANCES_CANON.shanks), vivant: true, enfants: [], parents: [], couple: null };
    // Avant l'exécution de Roger, la piraterie est bien moins répandue.
    s.monde.intensitePiraterie = anneeRelative(s) < -22 ? 0.5 : 3;
    // Les événements déjà passés à la naissance sont considérés comme advenus, sans rumeur.
    for (const ev of CALENDRIER) if (jourDe(s, ev.annee, ev.jourAnnee) <= 0) { s.chrono.faits[ev.id] = "advenu"; ev.effet?.(s); }
    if (anneeRelative(s) >= 0 && s.pnj.luffy) s.pnj.luffy.lieu = null;
  }
}

// Présence canonique : Luffy n'est à Fuchsia qu'entre sa naissance et son départ, Shanks seulement pendant son séjour.
export function presentSelonCanon(s, id) {
  if (id === "luffy") return !s.chrono.faits.depart_luffy && s.jour >= s.pnj.luffy.naissance + 3 * AN;
  if (id === "shanks") return !!s.chrono.faits.arrivee_shanks && !s.chrono.faits.depart_shanks;
  return true;
}

// Appelé chaque jour : les événements datés se produisent à leur date.
export function avancerChronologie(s) {
  for (const ev of CALENDRIER) {
    if (s.chrono.faits[ev.id] || s.jour < jourDe(s, ev.annee, ev.jourAnnee)) continue;
    s.chrono.faits[ev.id] = "advenu";
    if (ev.interactif?.(s)) {
      // Le joueur est présent : la scène lui est proposée (voir l'événement du même nom).
      s.planifies.push({ jour: s.jour, id: ev.id, data: {} });
      continue;
    }
    ev.effet?.(s);
    const texte = typeof ev.texte === "function" ? ev.texte(s) : ev.texte;
    nouvelle(s, ev.ile, texte, ev.portee);
  }
}
