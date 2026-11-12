// Fin du Nouveau Monde : Zou, Whole Cake Island, Egghead, Elbaf, puis Laugh Tale.
// Pour atteindre la dernière île, il faut l'empreinte de quatre Ponéglyphes de route. Trois emplacements suivent
// le canon (Zou, Whole Cake Island, Wano) ; le quatrième, perdu dans le canon, est placé ici dans une épave au
// large d'Egghead : c'est une invention du jeu. Ce que contient Laugh Tale n'est pas décrit : le canon ne le dit pas.

import { rand, noter, age, pnjIci, puissance, blesser, equipage, ILES, res } from "./engine.js";
import { nouvelle } from "./monde.js";
import { engagerCombat, definirFin } from "./combat.js";

export const PONEGLYPHES = {
  zou: { lieu: "baleine_zou", nom: "de Zou" },
  whole_cake: { lieu: "chateau_wc", nom: "de Whole Cake Island" },
  wano: { lieu: "village_wano", nom: "de Wano" },
  egghead: { lieu: "epave_egg", nom: "de l'épave d'Egghead" },
};
export const empreintes = s => Object.keys(s.poneglyphes || {}).length;
export const routeOuverte = s => empreintes(s) >= 4;
const iciPoneglyphe = s => Object.entries(PONEGLYPHES).find(([ile, p]) => ile === s.ile && p.lieu === s.lieu);

function relever(s, ile) {
  s.poneglyphes ??= {};
  s.poneglyphes[ile] = s.jour;
  noter(s, `Empreinte du Ponéglyphe de route ${PONEGLYPHES[ile].nom} relevée (${empreintes(s)}/4).`, "mission");
  return `Tu relèves l'empreinte de la pierre rouge sur une grande feuille (${empreintes(s)}/4).${routeOuverte(s) ? " Les quatre empreintes se recoupent en un seul point de la carte : la route de la dernière île est ouverte, depuis Elbaf." : ""}`;
}

definirFin("garde_wc", (s, issue) => {
  if (issue === "victoire") return relever(s, "whole_cake");
  s.lieu = "cote_wc";
  if (issue === "fuite") return "Tu t'échappes du château par les cuisines et regagnes la côte.";
  blesser(s, 2);
  return "Les gardes te jettent hors du château, à demi mort.";
});

export const ACTIONS_FINALE = {
  empreinte(s) {
    const p = iciPoneglyphe(s);
    if (!p) return res(false, "Il n'y a pas de Ponéglyphe ici.");
    const [ile] = p;
    if (s.poneglyphes?.[ile]) return res(false, "Tu as déjà l'empreinte de cette pierre.");
    if (age(s) < 16) return res(false, "On ne te laisse pas approcher.");
    if (s.heure + 4 > 24 || s.fatigue >= 80) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    s.heure += 4; s.fatigue = Math.min(100, s.fatigue + 25);
    if (ile === "zou") {
      if ((s.pnj.nara?.relation || 0) < 30 || s.pnj.nara.vivant === false) return res(true, "Nara, la gardienne, te barre l'entrée de l'arbre-baleine : « Seuls les amis des Minks voient la pierre. » Gagne d'abord sa confiance.");
      return res(true, `Nara te conduit au cœur de l'arbre-baleine. ${relever(s, ile)}`);
    }
    if (ile === "wano") {
      if ((s.pnj.soen?.relation || 0) < 40 || s.pnj.soen.vivant === false || !pnjIci(s).length && false) return res(true, "Personne ne te dira où se cache la pierre. Il faudrait la confiance d'un ancien du pays, comme maître Sōen (relation 40).");
      return res(true, `Maître Sōen te mène, de nuit, à une grotte scellée. ${relever(s, ile)}`);
    }
    if (ile === "egghead") {
      if ((s.competences.navigation || 0) < 15) return res(true, "L'épave repose dans des courants traîtres : sans une vraie science de la mer (navigation 15), impossible de l'atteindre.");
      if (s.fruit && !equipage(s).length) return res(true, "La pierre est dans la cale noyée. Avec ton fruit, tu ne peux pas plonger, et tu n'as personne pour le faire à ta place.");
      return res(true, `${s.fruit ? "Un de tes hommes plonge" : "Tu plonges"} dans la cale noyée. ${relever(s, ile)}`);
    }
    // Whole Cake Island : s'introduire dans le château, sinon affronter la garde.
    if (s.stats.agilite + (s.traits?.ruse || 0) * 3 + rand(s) * 30 >= 60) return res(true, `Tu te glisses dans la salle du trésor sans un bruit. ${relever(s, ile)}`);
    return engagerCombat(s, { type: "garde_wc", nom: "le capitaine de la garde", force: 110, intro: "Une sentinelle donne l'alerte !" });
  },
  decouvrir(s) {
    if (s.lieu !== "coeur_lt") return res(false, "Ce n'est pas ici.");
    if (s.drapeaux.onePiece) return res(false, "Tu as déjà vu ce qu'il y avait à voir.");
    s.drapeaux.onePiece = s.jour;
    s.humeur = 100;
    const roi = s.carriere?.type === "pirate" && !s.carriere.membre;
    nouvelle(s, "laugh_tale", roi ? `${s.perso.prenom} a atteint la dernière île : les mers ont un nouveau Roi des pirates !` : `${s.perso.prenom} a atteint la dernière île, celle que seul l'équipage de Roger avait trouvée.`, "monde");
    return res(true, `Au cœur de l'île, tu trouves enfin ce que tant d'autres ont cherché toute leur vie. Tu restes un long moment sans voix… puis tu éclates de rire, d'un rire immense, comme d'autres avant toi.${roi ? " Le monde entier t'appellera bientôt le Roi des pirates." : ""}`);
  },
};

export function actionsFinale(s) {
  const a = [];
  const p = iciPoneglyphe(s);
  if (p && !s.poneglyphes?.[p[0]] && age(s) >= 16) a.push({ id: "empreinte", label: "Chercher le Ponéglyphe de route" });
  if (s.lieu === "coeur_lt" && !s.drapeaux.onePiece) a.push({ id: "decouvrir", label: "Avancer jusqu'au cœur de l'île" });
  return a;
}
