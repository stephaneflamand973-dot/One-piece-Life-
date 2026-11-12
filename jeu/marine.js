// Carrière dans la Marine, version complète : douze grades jusqu'à Amiral, affectations (Shells Town,
// Loguetown, Sabaody), commandement d'un navire de guerre à partir de Lieutenant, traque des équipages.

import { rand, noter, age, avancer, puissance, blesser, gagnerCompetence, ILES, LIEUX, GAINS, res } from "./engine.js";
import { nouvelle, rivauxIci } from "./monde.js";
import { reputation } from "./factions.js";

// Lieu de service de chaque affectation, et grade minimal pour y être muté.
export const POSTES = { shells: { lieu: "base", rang: 0 }, loguetown: { lieu: "caserne_logue", rang: 2 }, sabaody: { lieu: "poste_sabaody", rang: 5 } };
export const lieuPoste = s => POSTES[s.carriere?.poste || "shells"].lieu;
export const auPoste = s => s.carriere?.type === "marine" && s.lieu === lieuPoste(s);
const RANG_COMMANDEMENT = 6; // Lieutenant
const RANG_HAKI = 10; // Vice-amiral : tous maîtrisent le Haki

// Condition supplémentaire de certains grades ; renvoie un texte si elle manque.
export function verrouPromotion(s, rang) {
  if (rang >= 8 && (s.carriere.poste || "shells") !== "sabaody") return "Pour monter plus haut, il faut servir sur Grand Line (mutation à Sabaody).";
  if (rang >= RANG_HAKI && !(s.haki?.eveil.armement || s.haki?.eveil.observation)) return "Aucun Vice-amiral n'ignore le Haki : éveille-le d'abord.";
  if (rang >= 11 && (s.carriere.captures || 0) < 10) return "On ne nomme Amiral qu'un officier qui a capturé au moins dix équipages.";
  return null;
}

export function donnerNavire(s) {
  if (s.carriere?.type !== "marine" || s.carriere.rang < RANG_COMMANDEMENT || s.navire) return "";
  s.navire = { type: "caravelle", nom: `Navire de guerre n° ${100 + Math.floor(rand(s) * 800)}`, coque: 100, marine: true, ameliorations: { canons: s.jour } };
  s.inventaire.logpose = Math.max(1, s.inventaire.logpose || 0);
  return ` On te confie le commandement du « ${s.navire.nom} ».`;
}
export function reprendreNavire(s) { if (s.navire?.marine) s.navire = null; }

export const ACTIONS_MARINE = {
  mutation(s, poste) {
    const p = POSTES[poste];
    if (s.carriere?.type !== "marine" || !p) return res(false, "Ce n'est pas possible.");
    if (!auPoste(s)) return res(false, "Les demandes de mutation se font à ton poste.");
    if ((s.carriere.poste || "shells") === poste) return res(false, "Tu y es déjà affecté.");
    if (s.carriere.rang < p.rang) return res(false, "Ton grade ne te permet pas encore cette affectation.");
    s.carriere.poste = poste; s.carriere.dernierService = s.jour;
    // La Marine assure le transport : les jours passent, sans frais.
    avancer(s, 5, { sansInterruption: true });
    if (!s.perso.vivant) return res(true, "Ta vie s'achève pendant la traversée.");
    s.ile = poste; s.lieu = p.lieu;
    noter(s, `Mutation : tu rejoins ton nouveau poste ${ILES[poste].a}.`, "voyage");
    return res(true, `Un navire de la Marine te conduit ${ILES[poste].a}. Tu prends ton service ${LIEUX[p.lieu].a}.`);
  },
  traquer_pirates(s) {
    if (s.carriere?.type !== "marine" || s.carriere.rang < RANG_COMMANDEMENT) return res(false, "Seul un officier qui commande un navire mène une traque.");
    if (!s.navire?.marine) return res(false, "Tu n'as plus de navire de guerre.");
    const cibles = rivauxIci(s);
    if (!cibles.length) return res(false, "Aucun équipage pirate n'est signalé dans ces eaux.");
    if (s.heure + 8 > 24 || s.fatigue >= 80) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    s.heure += 8; s.fatigue = Math.min(100, s.fatigue + 40);
    s.carriere.dernierService = s.jour;
    const r = cibles.sort((a, b) => a.force - b.force)[0];
    // Capture binaire : l'équipage est pris, ou il s'échappe.
    if (puissance(s) + s.carriere.rang * 4 + 8 + rand(s) * 20 >= r.force + 12) {
      r.actif = false; r.fin = "capturé par la Marine";
      const merite = 5 + Math.min(20, Math.round(r.prime / 20000000));
      s.carriere.merite += merite; s.carriere.captures = (s.carriere.captures || 0) + 1;
      const g = gagnerCompetence(s, "combat", GAINS.combat);
      reputation(s, "marine", 4); reputation(s, "pirates", -6);
      nouvelle(s, s.ile, `Le capitaine ${r.capitaine} (${r.nom}) a été capturé par ${s.perso.prenom}, de la Marine.`, "monde");
      return res(true, `Ton navire prend en chasse les ${r.nom} et les force à se rendre. Mérite +${merite}, Combat +${g}.`, { promotion: true });
    }
    blesser(s, rand(s) < 0.3 ? 2 : 1);
    r.force += 1;
    return res(true, `Les ${r.nom} vous échappent après un rude combat. Tu es blessé.`);
  },
};

export function actionsMarine(s) {
  const a = [];
  const c = s.carriere;
  if (c?.type !== "marine") return a;
  if (auPoste(s)) for (const [k, p] of Object.entries(POSTES)) if (k !== (c.poste || "shells") && c.rang >= p.rang) a.push({ id: "mutation", cible: k, label: `Demander ta mutation ${ILES[k].a}` });
  if (c.rang >= RANG_COMMANDEMENT && s.navire?.marine && s.lieu === ILES[s.ile].port && rivauxIci(s).length) a.push({ id: "traquer_pirates", label: `Traquer un équipage pirate (${rivauxIci(s).length} signalé${rivauxIci(s).length > 1 ? "s" : ""})` });
  return a;
}
