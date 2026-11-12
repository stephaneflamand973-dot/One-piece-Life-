// Combats jouables : manche par manche, le joueur choisit sa tactique.
// Un combat ne fait pas passer le temps ; il se termine par une victoire, une défaite ou une fuite,
// puis la suite (butin, blessure, mission…) est appliquée par le module qui l'a déclenché.

import { rand, noter, puissance, FRUITS, res } from "./engine.js";

const FINS = {};
// Chaque type de combat déclare sa conclusion : (s, issue, data) => texte, issue ∈ "victoire" | "defaite" | "fuite".
export function definirFin(type, fn) { FINS[type] = fn; }

export function engagerCombat(s, { type, nom, force, intro, data = {} }) {
  const pvT = 15 + s.stats.endurance;
  const pvE = Math.round(15 + force / 2);
  s.combat = { type, nom, force: Math.round(force), pvT, pvTmax: pvT, pvE, pvEmax: pvE, manche: 1, data,
    pouvoirs: s.fruit ? 2 + Math.floor(s.fruit.maitrise / 10) : 0,
    esquives: s.haki?.eveil.observation ? 1 + Math.floor(s.haki.observation / 10) : 0 };
  return res(true, `${intro} Le combat s'engage contre ${nom} !`, { combat: true });
}

const coupJoueur = s => Math.max(1, puissance(s) / 5 + rand(s) * 4);
const coupEnnemi = s => Math.max(1, s.combat.force / 5 + rand(s) * 4);

function manche(s, { degats, subis, texte }) {
  const c = s.combat;
  const d = Math.round(degats), r = Math.round(subis);
  c.pvE = Math.max(0, c.pvE - d); c.pvT = Math.max(0, c.pvT - (c.pvE > 0 ? r : 0));
  let t = `${texte} Tu infliges ${d}${c.pvE > 0 ? `, tu encaisses ${r}` : ""}. (Toi ${c.pvT}/${c.pvTmax} · ${c.nom} ${c.pvE}/${c.pvEmax})`;
  if (c.pvE <= 0) return conclure(s, "victoire", t);
  if (c.pvT <= 0) return conclure(s, "defaite", t);
  c.manche += 1;
  if (c.manche > 15) return conclure(s, "fuite", `${t} Épuisés, vous vous séparez sans vainqueur.`);
  return res(true, t);
}

function conclure(s, issue, texte) {
  const c = s.combat;
  s.combat = null;
  const suite = FINS[c.type] ? FINS[c.type](s, issue, c.data) : "";
  noter(s, issue === "victoire" ? `Victoire contre ${c.nom}.` : issue === "defaite" ? `Défaite contre ${c.nom}.` : `Combat interrompu contre ${c.nom}.`, "mission");
  return res(true, `${texte} ${suite}`.trim(), { finCombat: issue });
}

export const ACTIONS_COMBAT = {
  c_frapper(s) {
    if (!s.combat) return res(false, "Tu n'es pas en combat.");
    return manche(s, { degats: coupJoueur(s), subis: coupEnnemi(s), texte: "Tu attaques de front." });
  },
  c_garde(s) {
    if (!s.combat) return res(false, "Tu n'es pas en combat.");
    return manche(s, { degats: coupJoueur(s) * 0.5, subis: coupEnnemi(s) * 0.3, texte: "Tu te mets en garde et contres." });
  },
  c_pouvoir(s) {
    const c = s.combat;
    if (!c) return res(false, "Tu n'es pas en combat.");
    if (!s.fruit || c.pouvoirs <= 0) return res(false, "Tu ne peux plus utiliser ton pouvoir dans ce combat.");
    c.pouvoirs -= 1;
    const f = FRUITS[s.fruit.id];
    return manche(s, { degats: coupJoueur(s) * 2.5, subis: f.intangible ? 0 : coupEnnemi(s), texte: `Tu déchaînes le pouvoir du ${f.nom} !${f.intangible ? " Les coups te traversent." : ""}` });
  },
  c_esquive(s) {
    const c = s.combat;
    if (!c) return res(false, "Tu n'es pas en combat.");
    if (c.esquives <= 0) return res(false, "Ta concentration est épuisée pour ce combat.");
    c.esquives -= 1;
    return manche(s, { degats: coupJoueur(s), subis: 0, texte: "Ton Haki de l'observation te montre le coup avant qu'il parte : tu l'évites et ripostes." });
  },
  c_fuir(s) {
    const c = s.combat;
    if (!c) return res(false, "Tu n'es pas en combat.");
    if (rand(s) < Math.min(0.8, 0.3 + s.stats.agilite * 0.01)) return conclure(s, "fuite", "Tu romps le combat et t'échappes.");
    return manche(s, { degats: 0, subis: coupEnnemi(s), texte: "Tu tentes de fuir, mais ton adversaire te barre la route." });
  },
};

export function actionsCombat(s) {
  const c = s.combat;
  if (!c) return [];
  const a = [{ id: "c_frapper", label: "Attaquer" }, { id: "c_garde", label: "Se mettre en garde" }];
  if (s.fruit && c.pouvoirs > 0) a.push({ id: "c_pouvoir", label: `Utiliser ton pouvoir (${c.pouvoirs} restant${c.pouvoirs > 1 ? "s" : ""})` });
  if (c.esquives > 0) a.push({ id: "c_esquive", label: `Esquive du Haki (${c.esquives} restante${c.esquives > 1 ? "s" : ""})` });
  a.push({ id: "c_fuir", label: "Fuir" });
  return a;
}
