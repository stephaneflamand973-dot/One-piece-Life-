// IA en ligne facultative (Google Gemini, palier gratuit, clé fournie par le joueur).
// L'IA n'a aucune autorité : elle propose des actions que le moteur valide, et raconte des faits établis.

import { LIEUX, ILES, STATS, OBJETS, actionsDisponibles, lieuxDe } from "./engine.js";

const CLE_CONFIG = "opl-jeu-ia";
export const MODELE_DEFAUT = "gemini-2.5-flash";

export function lireConfig() {
  try { return { actif: false, cle: "", modele: MODELE_DEFAUT, ...JSON.parse(localStorage.getItem(CLE_CONFIG) || "{}") }; }
  catch { return { actif: false, cle: "", modele: MODELE_DEFAUT }; }
}
export function ecrireConfig(c) {
  try { localStorage.setItem(CLE_CONFIG, JSON.stringify(c)); } catch {}
}
export const iaActive = () => { const c = lireConfig(); return c.actif && c.cle; };

async function appeler(prompt, { json = false } = {}) {
  const c = lireConfig();
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.modele || MODELE_DEFAUT)}:generateContent`, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": c.cle },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: json ? 0.2 : 0.8, maxOutputTokens: json ? 400 : 350,
          ...(json ? { responseMimeType: "application/json" } : {}),
          thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(r.status === 429 ? "quota gratuit atteint, réessaie plus tard" : r.status === 400 || r.status === 403 ? "clé ou modèle refusé" : `erreur ${r.status} ${t.slice(0, 80)}`);
    }
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  } finally { clearTimeout(minuteur); }
}

// Interprétation : l'IA choisit seulement parmi les actions que le moteur autorise ici et maintenant.
export async function interpreter(s, texte) {
  const dispo = actionsDisponibles(s).map(a => ({ id: a.id, cible: a.cible ?? null, description: a.label }));
  for (const id of lieuxDe(s.ile)) if (id !== s.lieu) { const l = LIEUX[id]; dispo.push({ id: "aller", cible: id, description: `Aller ${l.a}` }); }
  dispo.push({ id: "repos", cible: null, description: "Rentrer dormir jusqu'au lendemain" });
  const prompt = `Tu es l'interpréteur d'un jeu de simulation de vie dans l'univers de One Piece. Tu ne racontes rien.
Traduis la phrase du joueur en une suite d'actions. Voici les actions possibles ici et maintenant (id et cible exacts) ; après un déplacement, tu peux aussi utiliser parler (cible : identifiant d'un habitant de l'île), acheter (planche, clou, canne, sabre, bague), entrainer (force, agilite, endurance), travailler, pecher, cuisiner, reparer, combattre, service, patrouille, repos :
${JSON.stringify(dispo)}
Règles :
- Respecte l'ordre voulu par le joueur. Une action peut être répétée (par exemple acheter plusieurs fois).
- Si une partie de la demande ne correspond à aucune action de la liste, mets-la dans "impossible" au lieu de l'inventer.
- Si la phrase est trop ambiguë, laisse "actions" vide et pose une seule question courte dans "clarification".
Réponds en JSON : {"actions":[{"id":"...","cible":null}],"impossible":"","clarification":""}
Phrase du joueur : ${JSON.stringify(texte)}`;
  const txt = await appeler(prompt, { json: true });
  let o;
  try { o = JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch { o = {}; }
  // Une suite d'actions change le contexte (aller au bar, puis parler à Makino) : on accepte toute action
  // connue du jeu avec une cible connue ; le moteur vérifie ensuite chaque étape et refuse l'impossible.
  const actions = (Array.isArray(o.actions) ? o.actions : [])
    .filter(a => a && actionConnue(s, a)).slice(0, 25)
    .map(a => ({ id: a.id, cible: a.cible ?? undefined }));
  return { actions, impossible: o.impossible || "", clarification: o.clarification || "" };
}

function actionConnue(s, a) {
  const c = a.cible ?? null;
  switch (a.id) {
    case "aller": return c in LIEUX;
    case "parler": case "declarer": case "mariage": return c in s.pnj;
    case "voyager": return c in ILES;
    case "entrainer": return c in STATS;
    case "acheter": return c in OBJETS;
    case "accepter": case "refuser": return s.missions.some(m => m.id === c);
    case "jouer": case "ecouter": case "etudier": case "travailler": case "pecher": case "cuisiner":
    case "reparer": case "combattre": case "repos": case "engager": case "service": case "patrouille":
    case "quitter": case "famille": case "enfant": return true;
    default: return false;
  }
}

// Narration : raconte uniquement les faits établis par le moteur.
export async function narrer(faits) {
  const prompt = `Tu es le narrateur d'un jeu de simulation de vie dans l'univers de One Piece.
Raconte en français, à la deuxième personne et au présent, en 50 à 90 mots, dans le ton de One Piece (chaleureux, vivant, parfois drôle).
Règles absolues : utilise uniquement les faits ci-dessous. N'invente aucun personnage, objet, lieu, chiffre, gain ou événement. Ne fais apparaître aucun personnage absent. Ne contredis pas le résultat.
Faits établis :
${faits}`;
  return (await appeler(prompt)).trim();
}

export async function testerCle() {
  const t = await appeler("Réponds seulement : OK");
  return /ok/i.test(t);
}
