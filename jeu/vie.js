// Étape 5 · Une vie profonde.
// Personnalité (traits qui évoluent et ouvrent des options), humeur (n'influence jamais un gain),
// éducation, talents (navigation, musique, médecine) et santé au fil de l'âge (maladies chroniques
// qui limitent l'énergie disponible, sans toucher au montant des gains : D.2A).

import { rand, noter, age, pnjIci, transferer, gagnerStat, GAINS, ILES, res } from "./engine.js";
import { aTalent } from "./talents.js";

export const TRAITS = { courage: ["Prudent", "Courageux"], ruse: ["Franc", "Rusé"], bonte: ["Dur", "Bienveillant"], ambition: ["Modeste", "Ambitieux"] };
export const MALADIES = ["rhumatismes", "toux chronique", "cœur fragile", "vue qui baisse"];
const TAVERNES = ["bar", "taverne_shells", "salle_baratie", "auberge_logue", "bar_w7", "bar_sabaody", "ville_dr", "village_wano"];

export function initialiserVie(s) {
  s.traits ??= { courage: 0, ruse: 0, bonte: 0, ambition: 0 };
  s.humeur ??= 0;
  s.education ??= 0;
  s.sante.maladies ??= [];
  for (const k of ["navigation", "musique", "medecine"]) s.competences[k] ??= 0;
}

export function humeurTexte(h) {
  if (h <= -50) return ["En deuil", "ko"];
  if (h <= -15) return ["Morose", "ko"];
  if (h >= 50) return ["Radieux", "ok"];
  if (h >= 15) return ["Heureux", "ok"];
  return ["Serein", "ok"];
}
export function portraitTraits(s) {
  return Object.entries(TRAITS).filter(([k]) => Math.abs(s.traits[k] || 0) >= 2).map(([k, [neg, pos]]) => (s.traits[k] > 0 ? pos : neg));
}

// Une maladie chronique réduit l'énergie maximale (accès aux activités), jamais le gain d'une activité.
export const seuilFatigue = s => 80 - 12 * (s.sante.maladies?.length || 0);

// Chaque jour : l'humeur revient doucement vers le calme ; chaque année, la santé peut décliner.
export function vieInterieure(s) {
  if (s.humeur > 0) s.humeur -= 1; else if (s.humeur < 0) s.humeur += 1;
  if (s.jour % 365 !== 0) return;
  const a = age(s);
  const ae = a - (aTalent(s, "longevite") ? 10 : 0);
  if (ae >= 50 && s.sante.maladies.length < MALADIES.length && rand(s) < 0.04 + (ae - 50) * 0.004) {
    const m = MALADIES.find(x => !s.sante.maladies.includes(x));
    s.sante.maladies.push(m);
    noter(s, `L'âge se fait sentir : on te diagnostique ${m}. Tu te fatigues plus vite.`, "sante");
  }
}

export const ACTIONS_VIE = {
  ecole(s) {
    if (s.lieu !== "ecole") return res(false, "L'école est à Fuchsia.");
    if (age(s) < 6 || age(s) > 15) return res(false, "L'école accueille les enfants de 6 à 15 ans.");
    if (s.heure + 4 > 24 || s.fatigue >= seuilFatigue(s)) return res(false, "Pas aujourd'hui : il est trop tard, ou tu es trop fatigué.");
    s.heure += 4; s.fatigue = Math.min(100, s.fatigue + 10);
    const bonus = aTalent(s, "genie") ? 1 : 0; // exception B : gain fixe majoré par le talent « Génie »
    s.education += 1 + bonus;
    const g = gagnerStat(s, "intelligence", GAINS.etude + bonus) ? ` Intelligence +${GAINS.etude + bonus}.` : "";
    return res(true, `Une journée de classe : lecture, calcul, cartes du monde. Éducation +${1 + bonus}.${g}${s.education === 40 ? " Tu termines ta scolarité, instruit." : ""}`);
  },
  cartes(s) {
    if (s.lieu !== ILES[s.ile].port) return res(false, "On étudie les cartes marines sur le port, auprès des marins.");
    if (s.heure + 3 > 24 || s.fatigue >= seuilFatigue(s)) return res(false, "Pas maintenant : tu es trop fatigué ou il est tard.");
    s.heure += 3; s.fatigue = Math.min(100, s.fatigue + 10);
    s.competences.navigation += 1;
    return res(true, `Courants, vents, étoiles : tu étudies les cartes marines. Navigation +1 (${s.competences.navigation}).`);
  },
  musique(s) {
    if (!TAVERNES.includes(s.lieu)) return res(false, "On joue de la musique dans les bars et les tavernes.");
    if (s.heure + 3 > 24 || s.fatigue >= seuilFatigue(s)) return res(false, "Pas maintenant : tu es trop fatigué ou il est tard.");
    s.heure += 3; s.fatigue = Math.min(100, s.fatigue + 8);
    s.competences.musique += 1;
    // Pourboires donnés par les présents qui en ont les moyens (argent transféré, jamais créé).
    let total = 0;
    for (const id of pnjIci(s)) { const don = Math.min(5 + Math.floor(s.competences.musique / 5), s.pnj[id].fonds); if (don > 0 && !s.pnj[id].famille) { transferer(s, id, "joueur", don); total += don; } }
    s.humeur = Math.min(100, s.humeur + 5);
    return res(true, `Tu joues pour la salle. Musique +1.${total ? ` Pourboires : ${total} Berrys.` : " Personne n'a laissé de pourboire."}`);
  },
  medecine(s) {
    if (s.education < 20 && s.stats.intelligence < 15) return res(false, "La médecine demande des bases solides (école ou intelligence 15).");
    if (s.heure + 3 > 24 || s.fatigue >= seuilFatigue(s)) return res(false, "Pas maintenant : tu es trop fatigué ou il est tard.");
    s.heure += 3; s.fatigue = Math.min(100, s.fatigue + 12);
    s.competences.medecine += 1;
    return res(true, `Tu étudies l'anatomie et les remèdes. Médecine +1 (${s.competences.medecine}).`);
  },
  consulter(s) {
    if (!s.sante.maladies.length) return res(false, "Tu n'as aucune maladie à soigner.");
    if (s.ile === "fuchsia" && s.lieu !== "place") return res(false, "Le médecin de passage consulte sur la place du village.");
    const soi = s.competences.medecine >= 15;
    const prix = soi ? 0 : 150;
    if (s.berrys < prix) return res(false, `Une consultation coûte ${prix} Berrys.`);
    s.berrys -= prix; s.monde.exterieur += prix;
    s.heure += 2;
    if (rand(s) < (soi ? 0.4 : 0.5)) {
      const m = s.sante.maladies.pop();
      return res(true, `${soi ? "Tu te soignes toi-même" : "Le médecin te prescrit un traitement"} : ${m} est guéri${m.endsWith("s") ? "s" : ""}.`);
    }
    return res(true, `${soi ? "Tes remèdes" : "Le traitement"} n'y font rien cette fois. ${prix ? `${prix} Berrys dépensés.` : ""}`);
  },
  genereux(s) {
    if (s.berrys < 20) return res(false, "Tu n'as pas de quoi donner.");
    const pauvres = pnjIci(s).filter(id => s.pnj[id].fonds < 50 && !s.pnj[id].famille);
    if (!pauvres.length) return res(false, "Personne ici n'est dans le besoin.");
    const id = pauvres[0];
    transferer(s, "joueur", id, 20);
    s.pnj[id].relation += 6; s.humeur = Math.min(100, s.humeur + 6); s.traits.bonte = Math.min(10, s.traits.bonte + 1);
    return res(true, `Tu donnes 20 Berrys à ${s.pnj[id].nom}, dans le besoin. Son regard te réchauffe le cœur.`);
  },
  tricher(s) {
    if (!TAVERNES.includes(s.lieu)) return res(false, "Il faut une table de jeu.");
    if (s.berrys < 20) return res(false, "Il faut une mise de 20 Berrys.");
    s.heure += 2;
    const x = rand(s);
    if (x < 0.2) { const p = Math.min(20, s.berrys); s.berrys -= p; s.monde.exterieur += p; s.humeur -= 5; return res(true, "Pris en flagrant délit ! Tu perds ta mise et on te jette dehors."); }
    if (x < 0.75) { s.monde.exterieur -= 30; s.berrys += 30; s.traits.ruse = Math.min(10, s.traits.ruse + 1); return res(true, "Tes cartes truquées font merveille : +30 Berrys."); }
    s.berrys -= 20; s.monde.exterieur += 20;
    return res(true, "Même en trichant, tu perds. 20 Berrys envolés.");
  },
  harangue(s) {
    if (!TAVERNES.includes(s.lieu) && s.lieu !== ILES[s.ile].port) return res(false, "Il te faut un public.");
    if (s.heure + 2 > 24 || s.fatigue >= seuilFatigue(s)) return res(false, "Pas maintenant.");
    s.heure += 2; s.fatigue = Math.min(100, s.fatigue + 8);
    const g = gagnerStat(s, "charisme", GAINS.entrainement) ? ` Charisme +${GAINS.entrainement}.` : "";
    return res(true, `Debout sur une caisse, tu parles de tes rêves à qui veut l'entendre. Quelques-uns t'acclament.${g}`);
  },
};

export function actionsVie(s) {
  const a = [];
  const ag = age(s);
  if (s.lieu === "ecole" && ag >= 6 && ag <= 15) a.push({ id: "ecole", label: "Aller en classe" });
  if (ag >= 10 && s.lieu === ILES[s.ile].port) a.push({ id: "cartes", label: "Étudier les cartes marines" });
  if (ag >= 10 && TAVERNES.includes(s.lieu)) a.push({ id: "musique", label: "Jouer de la musique" });
  if (ag >= 16 && (s.education >= 20 || s.stats.intelligence >= 15)) a.push({ id: "medecine", label: "Étudier la médecine" });
  if (s.sante.maladies.length && (s.lieu === "place" || s.ile !== "fuchsia" || s.competences.medecine >= 15)) a.push({ id: "consulter", label: s.competences.medecine >= 15 ? "Te soigner toi-même" : "Consulter un médecin (150 B)" });
  // La personnalité ouvre des options.
  if (s.traits.bonte >= 3) a.push({ id: "genereux", label: "Aider quelqu'un dans le besoin (20 B)" });
  if (s.traits.ruse >= 3 && ag >= 16 && TAVERNES.includes(s.lieu)) a.push({ id: "tricher", label: "Jouer aux cartes… en trichant" });
  if (s.traits.ambition >= 3 && ag >= 14) a.push({ id: "harangue", label: "Haranguer la foule" });
  return a;
}
