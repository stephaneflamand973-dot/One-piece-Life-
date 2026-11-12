// Carrière de révolutionnaire.
// Quatre grades (Sympathisant, Agent, Chef de cellule, Commandant) gagnés à l'influence, par gains fixes.
// On gagne le soutien de chaque île (tracts, entraide), on y fonde des cellules, on sabote le Gouvernement,
// on libère des captifs, et l'on peut soulever une île entière. Tout se paie en clandestinité : une couverture
// trop basse attire les agents du Gouvernement. L'argent vient toujours de quelqu'un ou de l'extérieur.

import { rand, noter, age, avancer, puissance, blesser, capturer, notoriete, gagnerCompetence, GAINS, ILES, LIEUX, TAVERNES, res } from "./engine.js";
import { nouvelle, regionDe } from "./monde.js";
import { reputation } from "./factions.js";
import { engagerCombat, definirFin } from "./combat.js";
import { anneeRelative } from "./chronologie.js";

export const GRADES_REVO = ["Sympathisant", "Agent", "Chef de cellule", "Commandant"];
export const INFLUENCE_GRADE = [0, 10, 30, 70];
// L'Armée révolutionnaire n'existe pas encore à l'âge d'or de Roger (dates approximatives).
export const ANNEE_FONDATION = -20;
export const armeeExiste = s => !s.chrono || anneeRelative(s) >= ANNEE_FONDATION;

const revo = s => s.carriere?.type === "revolution";
const c0 = s => { const c = s.carriere; c.influence ??= 0; c.grade ??= 0; c.couverture ??= 80; c.soutien ??= {}; c.cellules ??= []; c.liberees ??= []; c.missions ??= 0; return c; };
const port = s => s.lieu === ILES[s.ile].port;
const public_ = s => TAVERNES.includes(s.lieu) || ["place", "marche_logue", "mangroves", "quai_w7", "echafaud", "port_shells", "ville_dr", "village_wano"].includes(s.lieu);
const tropTard = (s, h) => s.heure + h > 24 || s.fatigue >= 80;
const occupe = (s, h, f) => { s.heure += h; s.fatigue = Math.min(100, s.fatigue + f); };
const soutien = (s, d) => { const c = c0(s); c.soutien[s.ile] = Math.max(0, Math.min(100, (c.soutien[s.ile] || 0) + d)); return c.soutien[s.ile]; };
const couverture = (s, d) => { const c = c0(s); c.couverture = Math.max(0, Math.min(100, c.couverture + d)); };
const liberee = s => c0(s).liberees.includes(s.ile);

function influence(s, n) {
  const c = c0(s);
  c.influence += n; c.missions += 1;
  let t = ` Influence +${n}.`;
  while (c.grade < GRADES_REVO.length - 1 && c.influence >= INFLUENCE_GRADE[c.grade + 1]) {
    if (c.grade + 1 === 3 && !c.liberees.length) { if (!c.verrouDit) { c.verrouDit = true; t += " Pour devenir Commandant, il te faudra avoir libéré une île."; } break; }
    c.grade += 1;
    noter(s, `Tu deviens ${GRADES_REVO[c.grade]} de l'Armée révolutionnaire.`, "mission");
    t += ` On te nomme ${GRADES_REVO[c.grade]} !`;
  }
  return t;
}

definirFin("liberation", (s, issue) => {
  if (issue === "victoire") {
    reputation(s, "revolution", 6); reputation(s, "gouvernement", -8);
    s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 1);
    soutien(s, 15); couverture(s, -15); notoriete(s, 1, { exploit: true });
    nouvelle(s, s.ile, `Des captifs ont été libérés ${ILES[s.ile].a} par des révolutionnaires.`, "monde");
    return `Les chaînes tombent. Les captifs se dispersent dans la nuit ; certains jurent de rejoindre la cause.${influence(s, 5)}`;
  }
  couverture(s, -10);
  if (issue === "fuite") return "Tu décroches avant l'arrivée des renforts. Les captifs restent aux fers.";
  blesser(s, 2);
  return "Les gardes sont trop nombreux. Tu t'échappes de justesse, gravement blessé.";
});
definirFin("agent_cp", (s, issue) => {
  if (issue === "victoire") { couverture(s, 25); notoriete(s, 1, { exploit: true }); return `L'agent du Gouvernement s'effondre. Tu disparais avant l'aube.${influence(s, 3)}`; }
  if (issue === "fuite") { couverture(s, 15); return "Tu sèmes l'agent dans les ruelles et changes de planque."; }
  return capturer(s, "par un agent du Gouvernement").texte;
});

export const ACTIONS_REVOLUTION = {
  tracts(s) {
    if (!revo(s)) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    if (!public_(s)) return res(false, "Il faut un lieu public : place, marché, taverne.");
    if (tropTard(s, 3)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 3, 12);
    const n = soutien(s, 5); couverture(s, liberee(s) ? 0 : -3);
    return res(true, `Tu glisses des tracts sous les portes et parles à voix basse aux mécontents. Soutien ${ILES[s.ile].a} : ${n}/100.${influence(s, 1)}`);
  },
  entraide(s) {
    if (!revo(s)) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    if (s.berrys < 50) return res(false, "Il faut 50 Berrys de vivres et de remèdes.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 15);
    s.berrys -= 50; s.monde.exterieur += 50;
    s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 1);
    const n = soutien(s, 10);
    return res(true, `Tu distribues vivres et remèdes aux plus pauvres (50 Berrys). Soutien ${ILES[s.ile].a} : ${n}/100.${influence(s, 1)}`);
  },
  cellule(s) {
    const c = revo(s) && c0(s);
    if (!c) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    if (c.grade < 1) return res(false, "Seul un Agent confirmé peut fonder une cellule.");
    if (c.cellules.includes(s.ile)) return res(false, "Une cellule existe déjà ici.");
    if ((c.soutien[s.ile] || 0) < 30) return res(false, `Il faut un soutien d'au moins 30 ${ILES[s.ile].a} (actuellement ${c.soutien[s.ile] || 0}).`);
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 6, 25);
    c.cellules.push(s.ile);
    return res(true, `Dans une arrière-salle, cinq habitants prêtent serment. Une cellule est née ${ILES[s.ile].a} : elle collectera des dons et te couvrira.${influence(s, 4)}`);
  },
  sabotage(s) {
    if (!revo(s)) return res(false, "Seuls les révolutionnaires reçoivent ces missions.");
    if (!port(s)) return res(false, "Les cibles sont les entrepôts du Gouvernement, sur les ports.");
    if (liberee(s)) return res(false, "Cette île est libre : il n'y a plus rien à saboter ici.");
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 6, 35);
    const danger = ILES[s.ile].danger || 0;
    const aide = c0(s).cellules.includes(s.ile) ? 6 : 0;
    // Mission binaire : réussie ou échouée.
    if (s.stats.intelligence + s.stats.agilite + (s.traits?.ruse || 0) + aide + rand(s) * 20 >= 20 + danger * 6) {
      reputation(s, "revolution", 5); reputation(s, "gouvernement", -5);
      couverture(s, -10); soutien(s, 5); notoriete(s, 1, { exploit: true });
      nouvelle(s, s.ile, `Des révolutionnaires ont saboté un entrepôt du Gouvernement mondial ${ILES[s.ile].a}.`, "monde");
      return res(true, `Le dépôt d'armes du Gouvernement part en fumée. Ta tête est mise à prix : ${s.prime.toLocaleString("fr-FR")} Berrys.${influence(s, 3)}`);
    }
    couverture(s, -15); blesser(s, 1);
    return res(true, "Une patrouille te surprend : tu t'enfuis de justesse, blessé. Mission échouée.");
  },
  liberer(s) {
    if (!revo(s)) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    if (!["mangroves", "port_shells", "port_dr", "cote_wc"].includes(s.lieu)) return res(false, "Il n'y a pas de captifs à libérer ici. On en trouve à Sabaody, à Shells Town, à Dressrosa.");
    if (liberee(s)) return res(false, "Cette île est libre : plus personne n'y est enchaîné.");
    if (tropTard(s, 5)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 5, 35);
    return engagerCombat(s, { type: "liberation", nom: "le chef des gardes", force: 20 + (ILES[s.ile].danger || 0) * 14, intro: "De nuit, tu forces la porte de l'enclos où l'on garde les captifs." });
  },
  soulevement(s) {
    const c = revo(s) && c0(s);
    if (!c) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    if (c.grade < 2) return res(false, "Seul un Chef de cellule peut lancer un soulèvement.");
    if (liberee(s)) return res(false, "Cette île est déjà libre.");
    if (!c.cellules.includes(s.ile) || (c.soutien[s.ile] || 0) < 100) return res(false, `Un soulèvement demande une cellule sur place et un soutien de 100 (actuellement ${c.soutien[s.ile] || 0}).`);
    if (s.ile === "laugh_tale" || s.ile === "cap") return res(false, "Il n'y a personne à soulever ici.");
    if (tropTard(s, 10)) return res(false, "Il te faut une journée entière et toutes tes forces.");
    occupe(s, 10, 60);
    const danger = ILES[s.ile].danger || 0;
    const base = s.ile === "shells" ? 25 : 0; // une base de la Marine se défend mieux
    if (puissance(s) + c.cellules.length * 5 + s.stats.charisme + rand(s) * 30 >= 45 + danger * 12 + base) {
      c.liberees.push(s.ile);
      reputation(s, "revolution", 20); reputation(s, "gouvernement", -25); reputation(s, "marine", -10);
      notoriete(s, 3, { exploit: true });
      nouvelle(s, s.ile, `${ILES[s.ile].nom} s'est soulevée contre le Gouvernement mondial, menée par ${s.perso.prenom}.`, "monde");
      return res(true, `Au signal, toute l'île descend dans la rue. Au matin, le pavillon du Gouvernement est amené : ${ILES[s.ile].nom} est libre. Ta prime : ${s.prime.toLocaleString("fr-FR")} Berrys.${influence(s, 15)}`);
    }
    c.soutien[s.ile] = 40; c.cellules = c.cellules.filter(i => i !== s.ile); couverture(s, -30);
    blesser(s, 2);
    return res(true, "Le soulèvement est écrasé avant midi. La cellule est démantelée, le soutien s'effondre, et tu t'échappes gravement blessé.");
  },
  planque(s) {
    if (!revo(s)) return res(false, "Il faut appartenir à l'Armée révolutionnaire.");
    const c = c0(s);
    if (c.couverture >= 100) return res(false, "Personne ne te cherche : inutile de te cacher.");
    avancer(s, 7, { sansInterruption: true });
    if (!s.perso.vivant || !revo(s)) return res(true, "La semaine s'achève autrement que prévu.");
    couverture(s, c.cellules.includes(s.ile) ? 35 : 20);
    return res(true, `Tu disparais une semaine${c.cellules.includes(s.ile) ? ", à l'abri dans la cellule locale" : ""}. Couverture : ${c.couverture}/100.`);
  },
};

export function actionsRevolution(s) {
  const a = [];
  if (!revo(s)) return a;
  const c = c0(s);
  const ici = c.soutien[s.ile] || 0;
  if (public_(s)) a.push({ id: "tracts", label: `Distribuer des tracts (soutien ${ici}/100)` });
  if (s.berrys >= 50) a.push({ id: "entraide", label: "Aider les plus pauvres (50 B)" });
  if (c.grade >= 1 && !c.cellules.includes(s.ile) && ici >= 30) a.push({ id: "cellule", label: "Fonder une cellule ici" });
  if (port(s) && !liberee(s)) a.push({ id: "sabotage", label: "Saboter un entrepôt du Gouvernement" });
  if (["mangroves", "port_shells", "port_dr", "cote_wc"].includes(s.lieu) && !liberee(s)) a.push({ id: "liberer", label: "Libérer des captifs" });
  if (c.grade >= 2 && c.cellules.includes(s.ile) && ici >= 100 && !liberee(s)) a.push({ id: "soulevement", label: "Lancer le soulèvement de l'île" });
  if (c.couverture < 100) a.push({ id: "planque", label: `Te faire oublier une semaine (couverture ${c.couverture}/100)` });
  return a;
}

// Chaque semaine : dons des cellules, la couverture remonte un peu, et une couverture trop basse attire une rafle.
export function vieRevolution(s) {
  if (!revo(s) || s.prison || s.jour % 7 !== 0) return;
  const c = c0(s);
  if (c.cellules.length) { const dons = 15 * c.cellules.length; s.monde.exterieur -= dons; s.berrys += dons; }
  couverture(s, 2);
  if (c.couverture < 30 && !liberee(s) && !s.evenement && !s.combat && rand(s) < (30 - c.couverture) / 60) s.planifies.push({ jour: s.jour, id: "rafle", data: {} });
}

// Une île libérée est un refuge : la Marine n'y pourchasse plus personne.
export const refuge = s => revo(s) && liberee(s);

export const EVENEMENTS_REVOLUTION = [
  { id: "rafle", planifie: true, cond: s => revo(s), texte: "Des bottes dans l'escalier : un agent du Gouvernement a retrouvé ta planque.",
    choix: [["L'affronter", s => engagerCombat(s, { type: "agent_cp", nom: "l'agent du Gouvernement", force: 30 + (ILES[s.ile].danger || 0) * 12 + c0(s).grade * 8, intro: "La porte vole en éclats." }).texte],
      ["Fuir par les toits", s => { if (s.stats.agilite + (c0(s).cellules.includes(s.ile) ? 8 : 0) + rand(s) * 20 >= 18) { couverture(s, 15); return "Tu sautes de toit en toit et disparais. Il faudra changer de planque."; } return capturer(s, "en fuyant par les toits").texte; }]] },
  { id: "revo_taupe", age: [18, 99], cond: s => revo(s) && c0(s).cellules.length > 0, texte: "Un membre de ta cellule est soupçonné de renseigner le Gouvernement.",
    choix: [["Enquêter discrètement", s => { if (s.stats.intelligence + rand(s) * 15 >= 14) { couverture(s, 10); return "Tu confonds le traître avant qu'il ne parle. La cellule est sauve."; } couverture(s, -15); return "Tu te trompes de coupable. Le vrai traître a eu le temps de parler."; }],
      ["Dissoudre la cellule par prudence", s => { const c = c0(s); c.cellules = c.cellules.filter(i => i !== s.ile); couverture(s, 20); return "Tout le monde se disperse. Il faudra tout reconstruire, mais personne n'est pris."; }]] },
  { id: "revo_recrue", age: [18, 99], cond: s => revo(s), texte: "Un jeune ouvrier te supplie de l'enrôler : son père est mort dans une mine du Gouvernement.",
    choix: [["L'accueillir", s => { soutien(s, 5); return `Il a la rage au ventre. Il faudra lui apprendre la patience.${influence(s, 1)}`; }],
      ["Lui dire d'attendre d'être prêt", s => { s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 1); return "« La colère ne suffit pas. Reviens quand tu sauras pourquoi tu te bats. »"; }]] },
  { id: "revo_dilemme", age: [18, 99], cond: s => revo(s) && c0(s).grade >= 1, texte: "L'état-major propose de faire sauter un pont : cela couperait la Marine, mais affamerait un village.",
    choix: [["Refuser et proposer un autre plan", s => { s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 2); soutien(s, 8); return "Ton plan est plus lent, mais personne n'aura faim à cause de vous."; }],
      ["Obéir", s => { s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 2); soutien(s, -15); s.humeur = Math.max(-100, (s.humeur || 0) - 10); return `Le pont saute. La Marine est coupée, le village aussi.${influence(s, 3)}`; }]] },
  { id: "revo_marine_doute", age: [18, 99], cond: s => revo(s), texte: "Un jeune marine te reconnaît… et te laisse passer : « Mon village aussi a faim. »",
    choix: [["Lui proposer de rejoindre la cause", s => { soutien(s, 6); return `Il hésite, puis hoche la tête. Un allié à l'intérieur.${influence(s, 2)}`; }],
      ["Passer sans un mot", s => { couverture(s, 5); return "Vous ne vous êtes jamais vus."; }]] },
];
