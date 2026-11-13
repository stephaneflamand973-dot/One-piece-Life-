// Carrière d'agent du Gouvernement mondial : le Cipher Pol.
// Cinq grades aux états de service (gains fixes), jusqu'au CP9 puis au CP0. On y apprend le Rokushiki, les six
// techniques des agents du canon. Missions binaires : surveillance, infiltration, arrestation, escorte,
// élimination. La solde vient du Gouvernement (extérieur comptabilisé). On ne quitte pas le Cipher Pol :
// passé le grade d'Aspirant, partir, c'est déserter, avec une prime sur la tête.
// Le bureau de recrutement de Loguetown est une invention du jeu.

import { rand, noter, age, avancer, blesser, notoriete, gagnerCompetence, GAINS, ILES, TAVERNES, res } from "./engine.js";
import { nouvelle } from "./monde.js";
import { reputation } from "./factions.js";
import { engagerCombat, definirFin } from "./combat.js";

export const GRADES_CP = ["Aspirant", "Agent du Cipher Pol", "Agent confirmé", "Agent du CP9", "Agent du CP0"];
export const SERVICE_GRADE = [0, 10, 30, 70, 150];
export const SOLDE_CP = [30, 60, 110, 200, 350]; // par semaine
export const ROKUSHIKI = [
  ["soru", "Soru", "te déplacer plus vite que l'œil"],
  ["geppo", "Geppō", "bondir sur l'air lui-même"],
  ["tekkai", "Tekkai", "durcir ton corps comme le fer"],
  ["shigan", "Shigan", "frapper du doigt comme une balle"],
  ["rankyaku", "Rankyaku", "trancher l'air d'un coup de pied"],
  ["kamie", "Kami-e", "plier ton corps comme une feuille pour esquiver"],
];
export const SEANCES_TECHNIQUE = 6;
// Chaque technique maîtrisée ajoute 3 à la puissance de combat ; elles restent acquises si l'on quitte le service.
export const bonusRokushiki = s => (s.rokushiki?.length || 0) * 3;

const agent = s => s.carriere?.type === "gouvernement";
const c0 = s => { const c = s.carriere; c.service ??= 0; c.grade ??= 0; c.missions ??= 0; c.dernierService ??= c.depuis; return c; };
const tropTard = (s, h) => s.heure + h > 24 || s.fatigue >= 80;
const occupe = (s, h, f) => { s.heure += h; s.fatigue = Math.min(100, s.fatigue + f); };
const danger = s => ILES[s.ile].danger || 0;
const port = s => s.lieu === ILES[s.ile].port;

// Condition supplémentaire de certains grades.
function verrou(s, grade) {
  const n = s.rokushiki?.length || 0;
  if (grade === 3 && n < 3) return "Le CP9 n'accepte que des agents maîtrisant au moins trois techniques du Rokushiki.";
  if (grade === 4 && n < 6) return "Le CP0 exige la maîtrise des six techniques du Rokushiki.";
  if (grade === 4 && !ILES[s.ile].grandLine) return "On n'entre au CP0 qu'en service sur Grand Line.";
  return null;
}

function service(s, n) {
  const c = c0(s);
  c.service += n; c.missions += 1; c.dernierService = s.jour;
  let t = ` États de service +${n}.`;
  while (c.grade < GRADES_CP.length - 1 && c.service >= SERVICE_GRADE[c.grade + 1]) {
    const v = verrou(s, c.grade + 1);
    if (v) { if (c.verrouDit !== c.grade) { c.verrouDit = c.grade; t += ` ${v}`; } break; }
    c.grade += 1;
    noter(s, `Tu es promu ${GRADES_CP[c.grade]}.`, "mission");
    t += ` Un pli scellé t'annonce ta promotion : ${GRADES_CP[c.grade]}. Solde : ${SOLDE_CP[c.grade]} Berrys par semaine.`;
  }
  return t;
}

function deserter(s, texte) {
  s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
  reputation(s, "gouvernement", -40); reputation(s, "marine", -15); reputation(s, "revolution", 10);
  notoriete(s, 3, { exploit: true });
  noter(s, `Tu as trahi le Cipher Pol. Ta tête est mise à prix : ${s.prime.toLocaleString("fr-FR")} Berrys.`, "mission");
  return `${texte} Le Gouvernement mondial ne pardonne pas : ta tête est mise à prix, ${s.prime.toLocaleString("fr-FR")} Berrys.`;
}

definirFin("arrestation", (s, issue) => {
  if (!agent(s)) return "";
  if (issue === "victoire") { reputation(s, "gouvernement", 3); return `Tu passes les menottes au suspect et le remets aux autorités. Combat +${gagnerCompetence(s, "combat", GAINS.combat)}.${service(s, 4)}`; }
  if (issue === "fuite") return "Le suspect t'échappe. Ton rapport sera court.";
  blesser(s, 1);
  return "Le suspect te blesse et disparaît. Mission échouée.";
});
definirFin("elimination", (s, issue) => {
  if (!agent(s)) return "";
  if (issue === "victoire") {
    s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 2); s.humeur = Math.max(-100, (s.humeur || 0) - 10);
    reputation(s, "gouvernement", 5);
    return `C'est fait. Aucun témoin, aucune trace. Tu ne sauras jamais vraiment ce qu'il avait fait.${service(s, 8)}`;
  }
  if (issue === "fuite") return "Tu renonces et te fonds dans la nuit. Il faudra t'en expliquer.";
  blesser(s, 2);
  return "Ta cible était prête. Tu t'en sors gravement blessé.";
});

export const ACTIONS_GOUVERNEMENT = {
  cipher(s) {
    if (s.lieu !== "bureau_gm") return res(false, "On se présente au bureau du Gouvernement mondial, à Loguetown.");
    if (s.carriere) return res(false, "Tu as déjà une carrière.");
    if (age(s) < 18) return res(false, "On ne te reçoit pas : tu es trop jeune.");
    if (s.prime > 0) return res(false, "Un fonctionnaire te dévisage, puis fait signe aux gardes. Tu ressors très vite.");
    if ((s.reputation?.gouvernement || 0) < 0 || (s.reputation?.revolution || 0) > 10) return res(false, "« Votre dossier ne plaide pas en votre faveur. » On te raccompagne à la porte.");
    if (s.stats.intelligence < 8 && (s.education || 0) < 20) return res(false, "On te fait passer un examen écrit. Tu échoues (intelligence 8 ou éducation 20).");
    if (s.stats.force + s.stats.agilite < 12) return res(false, "On te fait passer des épreuves physiques. Tu échoues (force + agilité : 12).");
    s.carriere = { type: "gouvernement", grade: 0, service: 0, missions: 0, depuis: s.jour, dernierService: s.jour };
    reputation(s, "gouvernement", 15); reputation(s, "revolution", -10);
    return res(true, `Après trois jours d'épreuves, on te remet un costume noir et une consigne : ne jamais dire pour qui tu travailles. Te voilà ${GRADES_CP[0]} du Cipher Pol, à ${SOLDE_CP[0]} Berrys par semaine.`);
  },
  surveillance(s) {
    if (!agent(s)) return res(false, "Il faut appartenir au Cipher Pol.");
    if (!TAVERNES.includes(s.lieu) && !port(s)) return res(false, "On écoute aux portes dans les tavernes et sur les ports.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 15);
    // Mission binaire : le renseignement est obtenu, ou non.
    if (s.stats.intelligence + (s.traits?.ruse || 0) * 2 + rand(s) * 15 >= 10 + danger(s) * 3) {
      const r = s.monde.rivaux.filter(x => x.actif).sort((a, b) => b.prime - a.prime)[0];
      return res(true, `Tu passes la soirée à écouter sans être vu.${r ? ` Tu apprends que le capitaine ${r.capitaine} se trouve ${ILES[r.ile].a}.` : " Rien d'important, mais ton rapport est précis."}${service(s, 1)}`);
    }
    return res(true, "Personne ne dit rien d'utile ce soir. Ton rapport tient en une ligne.");
  },
  infiltration(s) {
    if (!agent(s)) return res(false, "Il faut appartenir au Cipher Pol.");
    if (c0(s).grade < 1) return res(false, "On ne confie pas d'infiltration à un Aspirant.");
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    avancer(s, 3, { sansInterruption: true });
    if (!s.perso.vivant || !agent(s)) return res(true, "Les choses tournent autrement que prévu.");
    if (s.stats.intelligence + s.stats.charisme + (s.traits?.ruse || 0) * 2 + rand(s) * 20 >= 22 + danger(s) * 5) {
      reputation(s, "gouvernement", 2);
      return res(true, `Trois jours sous une fausse identité, parmi des gens qui te font confiance. Tu repars avec ce que tu étais venu chercher.${service(s, 3)}`);
    }
    blesser(s, 1); s.humeur = Math.max(-100, (s.humeur || 0) - 5);
    return res(true, "Ta couverture saute au troisième jour. Tu t'échappes par une fenêtre, blessé. Mission échouée.");
  },
  arrestation(s) {
    if (!agent(s)) return res(false, "Il faut appartenir au Cipher Pol.");
    if (c0(s).grade < 1) return res(false, "On ne confie pas d'arrestation à un Aspirant.");
    if (tropTard(s, 5)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 5, 30);
    const qui = ["un faussaire", "un trafiquant d'armes", "un espion étranger", "un agitateur recherché", "un fonctionnaire corrompu"][Math.floor(rand(s) * 5)];
    return engagerCombat(s, { type: "arrestation", nom: qui, force: 14 + danger(s) * 10 + c0(s).grade * 6 + rand(s) * 8, intro: `Tu frappes à la porte : « Gouvernement mondial. » ${qui[0].toUpperCase() + qui.slice(1)} tente de fuir.` });
  },
  escorte(s) {
    if (!agent(s)) return res(false, "Il faut appartenir au Cipher Pol.");
    if (c0(s).grade < 2) return res(false, "Seul un agent confirmé escorte un Noble mondial.");
    if (s.ile !== "sabaody") return res(false, "Les Nobles mondiaux ne se montrent guère qu'à Sabaody.");
    if (tropTard(s, 8)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 8, 30);
    s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 1); s.humeur = Math.max(-100, (s.humeur || 0) - 8);
    return res(true, `Une journée derrière un Noble mondial, à écarter la foule agenouillée et à regarder ailleurs. Rien à signaler, sinon ce que tu as vu.${service(s, 5)}`);
  },
  elimination(s) {
    if (!agent(s)) return res(false, "Il faut appartenir au Cipher Pol.");
    if (c0(s).grade < 3) return res(false, "Ces ordres-là ne sont donnés qu'au CP9.");
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 6, 35);
    return engagerCombat(s, { type: "elimination", nom: "la cible", force: 40 + danger(s) * 12 + rand(s) * 15, intro: "L'ordre tient en un nom et une adresse. Tu entres par les toits." });
  },
  rokushiki(s) {
    if (!agent(s)) return res(false, "Le Rokushiki ne s'enseigne qu'aux agents du Cipher Pol.");
    if (c0(s).grade < 1) return res(false, "On n'enseigne pas le Rokushiki à un Aspirant.");
    s.rokushiki ??= []; s.rokushikiProgres ??= 0;
    if (s.rokushiki.length >= ROKUSHIKI.length) return res(false, "Tu maîtrises déjà les six techniques.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 35);
    c0(s).dernierService = s.jour;
    s.rokushikiProgres += 1; // progression fixe (D.2A)
    const [id, nom, effet] = ROKUSHIKI[s.rokushiki.length];
    if (s.rokushikiProgres >= SEANCES_TECHNIQUE) {
      s.rokushikiProgres = 0; s.rokushiki.push(id);
      noter(s, `Technique du Rokushiki maîtrisée : ${nom}.`, "mission");
      return res(true, `Après des semaines d'efforts, ton corps comprend enfin : tu sais désormais ${effet}. ${nom} maîtrisé (${s.rokushiki.length}/6).`);
    }
    return res(true, `Tu répètes le même geste mille fois, jusqu'à ne plus sentir tes membres. ${nom} : ${s.rokushikiProgres}/${SEANCES_TECHNIQUE}.`);
  },
  demissionner(s) {
    if (!agent(s)) return res(false, "Tu n'es pas au service du Gouvernement.");
    if (c0(s).grade > 0) return res(false, "On ne quitte pas le Cipher Pol : tu en sais trop. La seule sortie est la désertion.");
    s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
    return res(true, "Tu rends ton costume noir. On te fait signer un engagement de silence, et on te laisse partir.");
  },
  deserter(s) {
    if (!agent(s)) return res(false, "Tu n'es pas au service du Gouvernement.");
    return res(true, deserter(s, "Tu brûles ton ordre de mission et disparais."));
  },
};

export function actionsGouvernement(s) {
  const a = [];
  if (s.lieu === "bureau_gm" && !s.carriere && age(s) >= 18) a.push({ id: "cipher", label: "Te présenter au Gouvernement mondial" });
  if (!agent(s)) return a;
  const c = c0(s);
  if (TAVERNES.includes(s.lieu) || port(s)) a.push({ id: "surveillance", label: "Mener une surveillance" });
  if (c.grade >= 1) {
    a.push({ id: "infiltration", label: "Partir en infiltration (3 jours)" });
    a.push({ id: "arrestation", label: "Procéder à une arrestation" });
    if ((s.rokushiki?.length || 0) < 6) a.push({ id: "rokushiki", label: `S'entraîner au Rokushiki (${ROKUSHIKI[s.rokushiki?.length || 0][1]} ${s.rokushikiProgres || 0}/${SEANCES_TECHNIQUE})` });
  }
  if (c.grade >= 2 && s.ile === "sabaody") a.push({ id: "escorte", label: "Escorter un Noble mondial" });
  if (c.grade >= 3) a.push({ id: "elimination", label: "Exécuter un ordre d'élimination" });
  if (port(s)) a.push(c.grade === 0 ? { id: "demissionner", label: "Démissionner" } : { id: "deserter", label: "Déserter le Cipher Pol" });
  return a;
}

// Chaque jour : solde hebdomadaire d'un agent en service, désertion après 90 jours sans mission.
export function vieGouvernement(s) {
  if (!agent(s)) return;
  const c = c0(s);
  if (s.prime > 0) { deserter(s, "Recherché, tu es rayé des effectifs."); return; }
  const absence = s.jour - c.dernierService;
  if (absence > 90 && !s.prison) { deserter(s, "Sans nouvelles de toi depuis trois mois, le Cipher Pol te déclare déserteur."); return; }
  if ((s.jour - c.depuis) % 7 === 0 && absence <= 14 && !s.prison) {
    const solde = SOLDE_CP[c.grade];
    s.monde.exterieur -= solde; s.berrys += solde;
    noter(s, `Une enveloppe sans nom t'attend : ta solde, ${solde} Berrys.`, "monde");
  }
}

export const EVENEMENTS_GOUVERNEMENT = [
  { id: "cp_erudit", age: [18, 99], cond: s => agent(s) && c0(s).grade >= 1, texte: "Ordre du jour : un vieil érudit étudie des pierres interdites. Tu dois le livrer.",
    choix: [["Obéir", s => { s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 2); s.humeur = Math.max(-100, (s.humeur || 0) - 10); return `Il ne résiste pas. « L'histoire vous jugera », dit-il seulement.${service(s, 4)}`; }],
      ["Le prévenir en secret", s => { s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 2); if (rand(s) < 0.3) return deserter(s, "Il s'enfuit à temps, mais un collègue t'a vu."); return "Quand vous arrivez, la maison est vide. Personne ne te soupçonne… pour l'instant."; }]] },
  { id: "cp_buster_call", age: [18, 99], cond: s => agent(s) && c0(s).grade >= 3, unique: true, texte: "On te remet un escargophone doré : transmets l'ordre, et une île entière sera rayée de la carte.",
    choix: [["Transmettre l'ordre", s => { s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 3); s.humeur = -100; nouvelle(s, s.ile, "Une île a été détruite par la flotte de la Marine, sur ordre du Gouvernement mondial.", "monde"); return `Tu appuies. Au loin, des dizaines de navires de guerre lèvent l'ancre. Tu ne dormiras plus jamais tout à fait.${service(s, 10)}`; }],
      ["Détruire l'escargophone", s => { s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 3); s.traits.courage = Math.min(10, (s.traits.courage || 0) + 2); return deserter(s, "Tu l'écrases sous ton talon. L'île est sauve."); }]] },
  { id: "cp_agent_double", age: [18, 99], cond: s => agent(s) && c0(s).grade >= 1, texte: "Une voix dans l'ombre : « L'Armée révolutionnaire sait qui tu es. Renseigne-nous, et tu changeras plus de choses qu'en obéissant. »",
    choix: [["Refuser et signaler le contact", s => { reputation(s, "revolution", -8); return `Ton rapport est remarqué en haut lieu.${service(s, 3)}`; }],
      ["Accepter de les renseigner", s => { reputation(s, "revolution", 15); s.drapeaux.agentDouble = s.jour; s.traits.ruse = Math.min(10, (s.traits.ruse || 0) + 1); return "Tu mènes désormais une double vie. Une erreur, et tu es mort."; }],
      ["Faire comme si tu n'avais rien entendu", () => "La voix se tait. Tu n'en parles à personne."]] },
  { id: "cp_double_decouvert", age: [18, 99], cond: s => agent(s) && !!s.drapeaux.agentDouble && rand(s) < 0.3, texte: "Ton supérieur te convoque. Sur son bureau, la copie d'un message que tu as fait passer aux révolutionnaires.",
    choix: [["Nier avec aplomb", s => { if (s.stats.charisme + (s.traits?.ruse || 0) * 2 + rand(s) * 15 >= 18) { s.drapeaux.agentDouble = null; return "Il te fixe longuement, puis range le papier. Tu as eu chaud : c'est fini, la double vie."; } return deserter(s, "Il ne te croit pas. Tu sautes par la fenêtre avant l'arrivée des gardes."); }],
      ["Fuir sur-le-champ", s => deserter(s, "Tu renverses le bureau et t'enfuis.")]] },
  { id: "cp_noble", age: [18, 99], cond: s => agent(s) && c0(s).grade >= 2, texte: "Tu découvres qu'un Noble mondial a fait disparaître une famille entière. Ton supérieur te dit de classer l'affaire.",
    choix: [["Classer l'affaire", s => { s.humeur = Math.max(-100, (s.humeur || 0) - 12); return `Le dossier rejoint les autres.${service(s, 2)}`; }],
      ["Faire fuiter le dossier à la presse", s => { s.traits.courage = Math.min(10, (s.traits.courage || 0) + 2); reputation(s, "revolution", 5); nouvelle(s, s.ile, "Un journal publie un dossier accablant sur un Noble mondial. Le Gouvernement dément.", "monde"); if (rand(s) < 0.4) return deserter(s, "La fuite est remontée jusqu'à toi."); return "Le scandale éclate. Personne ne remonte jusqu'à toi."; }]] },
];
