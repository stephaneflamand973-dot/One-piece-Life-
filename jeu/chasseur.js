// Carrière de chasseur de primes.
// Cinq rangs gagnés à la renommée (gains fixes par capture). On consulte les avis de recherche, on prend un
// contrat sur un équipage précis, on prépare un piège, on traque ; à défaut de pirates, chaque île a ses
// petites primes. Un associé aide au combat et prend sa part. Les pirates, eux, n'oublient pas.
// Les primes versées viennent de la Marine (extérieur comptabilisé) ; la part de l'associé lui est transférée.

import { rand, noter, age, blesser, transferer, gagnerCompetence, equipage, GAINS, ILES, TAVERNES, res } from "./engine.js";
import { nouvelle, regionDe, rivauxIci } from "./monde.js";
import { reputation } from "./factions.js";
import { engagerCombat, definirFin } from "./combat.js";

export const RANGS_CHASSEUR = ["Novice", "Traqueur", "Limier", "Chasseur d'élite", "Légende"];
export const RENOMMEE_RANG = [0, 10, 30, 70, 150];
export const PRIX_PIEGE = 30;
const NOMS_REGION = { eb: "East Blue", gl: "Grand Line", nm: "le Nouveau Monde" };

const chasseur = s => s.carriere?.type === "chasseur";
const c0 = s => { const c = s.carriere; c.captures ??= 0; c.renommee ??= 0; c.rang ??= 0; c.contrat ??= null; c.piege ??= false; c.petites ??= 0; return c; };
const tropTard = (s, h) => s.heure + h > 24 || s.fatigue >= 80;
const occupe = (s, h, f) => { s.heure += h; s.fatigue = Math.min(100, s.fatigue + f); };
const associe = s => equipage(s).find(id => s.pnj[id].associe);
const recherches = s => s.monde.rivaux.filter(r => r.actif && r.region === regionDe(s.ile)).sort((a, b) => b.prime - a.prime);
export const primeVersee = prime => Math.min(5000, Math.round(prime / 2000));
// Renommée fixe par capture, selon la prime : 1 point par tranche de 10 millions, de 2 à 20.
export const renommeeCapture = prime => Math.max(2, Math.min(20, Math.round(prime / 10000000)));

function renommee(s, n) {
  const c = c0(s);
  c.renommee += n;
  let t = ` Renommée +${n}.`;
  while (c.rang < RANGS_CHASSEUR.length - 1 && c.renommee >= RENOMMEE_RANG[c.rang + 1]) {
    c.rang += 1;
    noter(s, `Tu es désormais reconnu comme ${RANGS_CHASSEUR[c.rang]} parmi les chasseurs de primes.`, "mission");
    t += ` On t'appelle désormais ${RANGS_CHASSEUR[c.rang]} !`;
  }
  return t;
}

// Verse une prime : la Marine paie, l'associé reçoit 30 %.
function encaisser(s, montant) {
  s.monde.exterieur -= montant; s.berrys += montant;
  const a = associe(s);
  if (!a) return "";
  const part = Math.floor(montant * 0.3);
  transferer(s, "joueur", a, part); s.pnj[a].relation += 3;
  return ` Ton associé ${s.pnj[a].nom} touche sa part : ${part} Berrys.`;
}

definirFin("chasse_prime", (s, issue, d) => {
  const r = s.monde.rivaux.find(x => x.id === d.r);
  if (!r || !chasseur(s)) return "";
  const c = c0(s);
  if (issue === "victoire") {
    const gain = primeVersee(r.prime);
    r.actif = false; r.fin = "capturé par un chasseur";
    const part = encaisser(s, gain);
    c.captures += 1;
    const contrat = c.contrat === r.id;
    if (contrat) c.contrat = null;
    const gco = gagnerCompetence(s, "combat", GAINS.combat);
    reputation(s, "chasseurs", 5); reputation(s, "marine", 3); reputation(s, "pirates", -5);
    nouvelle(s, s.ile, `Le capitaine ${r.capitaine} (${r.nom}) a été capturé par ${s.perso.prenom}, chasseur de primes.`, "region");
    // Les compagnons du capturé peuvent chercher à se venger.
    if (rand(s) < 0.25) s.planifies.push({ jour: s.jour + 60 + Math.floor(rand(s) * 200), id: "vengeance_pirates", data: { nom: r.nom } });
    return `Tu passes les fers au capitaine ${r.capitaine} et le livres à la Marine. Prime versée : ${gain} Berrys.${part} Combat +${gco}.${renommee(s, renommeeCapture(r.prime) + (contrat ? 3 : 0))}${contrat ? " Contrat honoré." : ""}`;
  }
  r.force += 1;
  if (issue === "fuite") return `Les ${r.nom} savent désormais qu'on les traque.`;
  blesser(s, rand(s) < 0.3 ? 2 : 1);
  return "La traque échoue et tu t'en sors blessé.";
});
definirFin("petite_prime", (s, issue, d) => {
  if (!chasseur(s)) return "";
  if (issue === "victoire") {
    const part = encaisser(s, d.gain);
    c0(s).petites += 1;
    return `Tu ramènes le fugitif au poste. Prime versée : ${d.gain} Berrys.${part} Combat +${gagnerCompetence(s, "combat", GAINS.combat)}.${renommee(s, 1)}`;
  }
  if (issue === "fuite") return "Le fugitif court toujours.";
  blesser(s, 1);
  return "Le fugitif te blesse et disparaît.";
});
definirFin("vengeance_pirates", (s, issue) => {
  if (issue === "victoire") return `Tu les mets en déroute. On saura qu'il ne fait pas bon te chercher.${chasseur(s) ? renommee(s, 2) : ""}`;
  if (issue === "fuite") return "Tu leur échappes, pour cette fois.";
  blesser(s, 2);
  return "Ils te laissent pour mort dans une ruelle.";
});

export const ACTIONS_CHASSEUR = {
  avis(s) {
    if (!chasseur(s)) return res(false, "Les avis de recherche intéressent surtout les chasseurs de primes.");
    if (s.lieu !== "bureau_primes" && !TAVERNES.includes(s.lieu) && s.lieu !== ILES[s.ile].port) return res(false, "On affiche les avis au bureau des primes, dans les tavernes et sur les ports.");
    if (tropTard(s, 1)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 1, 2);
    const l = recherches(s).slice(0, 5);
    if (!l.length) return res(true, `Aucun équipage recherché n'est signalé sur ${NOMS_REGION[regionDe(s.ile)]} en ce moment.`);
    return res(true, `Avis de recherche sur ${NOMS_REGION[regionDe(s.ile)]} : ${l.map(r => `${r.capitaine} (${r.nom}), ${r.prime.toLocaleString("fr-FR")} Berrys, vu ${ILES[r.ile].a}`).join(" ; ")}.`);
  },
  contrat(s, id) {
    if (!chasseur(s)) return res(false, "Il faut une licence de chasseur de primes.");
    const r = s.monde.rivaux.find(x => x.id === id && x.actif);
    if (!r || r.region !== regionDe(s.ile)) return res(false, "Cet équipage n'est pas signalé dans cette mer.");
    c0(s).contrat = r.id;
    return res(true, `Tu prends le contrat sur le capitaine ${r.capitaine} (${r.nom}), ${r.prime.toLocaleString("fr-FR")} Berrys. Dernière position connue : ${ILES[r.ile].nom}. Une capture sous contrat rapporte plus de renommée.`);
  },
  piege(s) {
    if (!chasseur(s)) return res(false, "Il faut une licence de chasseur de primes.");
    const c = c0(s);
    if (c.piege) return res(false, "Ton piège est déjà prêt.");
    if (s.berrys < PRIX_PIEGE) return res(false, `Cordes, filets, appâts : il faut ${PRIX_PIEGE} Berrys.`);
    if (tropTard(s, 3)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 3, 15);
    s.berrys -= PRIX_PIEGE; s.monde.exterieur += PRIX_PIEGE;
    c.piege = true;
    return res(true, `Tu repères les lieux et prépares ton embuscade (${PRIX_PIEGE} Berrys). Ta prochaine cible sera affaiblie d'un quart.`);
  },
  traquer(s) {
    if (!chasseur(s)) return res(false, "Seul un chasseur de primes traque les pirates.");
    const c = c0(s);
    const ici = rivauxIci(s);
    if (!ici.length) {
      const k = c.contrat && s.monde.rivaux.find(x => x.id === c.contrat && x.actif);
      return res(false, k ? `Ta cible, ${k.capitaine}, a été vue ${ILES[k.ile].a}.` : "Aucun équipage recherché n'est signalé sur cette île.");
    }
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 6, 40);
    const r = ici.find(x => x.id === c.contrat) || ici.sort((a, b) => a.force - b.force)[0];
    const a = associe(s);
    let force = r.force + 8 - (a ? (s.pnj[a].force || 0) / 2 : 0);
    if (c.piege) { force *= 0.75; c.piege = false; }
    return engagerCombat(s, { type: "chasse_prime", nom: `le capitaine ${r.capitaine}`, force: Math.max(5, force), intro: `Tu débusques les ${r.nom}${a ? ` avec ${s.pnj[a].nom}` : ""}.`, data: { r: r.id } });
  },
  petite_prime(s) {
    if (!chasseur(s)) return res(false, "Il faut une licence de chasseur de primes.");
    if (s.lieu !== ILES[s.ile].port && !TAVERNES.includes(s.lieu)) return res(false, "Les petits fugitifs se cachent sur les ports et dans les tavernes.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 25);
    if (rand(s) < 0.3) return res(true, "Tu fais le tour des bouges et des quais, sans trouver personne à arrêter aujourd'hui.");
    const c = c0(s);
    const danger = ILES[s.ile].danger || 0;
    const a = associe(s);
    let force = 8 + danger * 9 + rand(s) * 8 - (a ? (s.pnj[a].force || 0) / 2 : 0);
    if (c.piege) { force *= 0.75; c.piege = false; }
    const cible = ["un voleur de bourses", "un contrebandier", "un déserteur", "un escroc recherché", "un pilleur d'épaves"][Math.floor(rand(s) * 5)];
    return engagerCombat(s, { type: "petite_prime", nom: cible, force: Math.max(4, force), intro: `Tu reconnais ${cible} d'après un avis de recherche.`, data: { gain: 60 * (1 + danger) } });
  },
  associe(s) {
    if (!chasseur(s)) return res(false, "Il faut une licence de chasseur de primes.");
    if (c0(s).rang < 1) return res(false, "Personne ne s'associe à un novice. Fais d'abord tes preuves (rang Traqueur).");
    if (associe(s)) return res(false, "Tu as déjà un associé.");
    if (!TAVERNES.includes(s.lieu)) return res(false, "On trouve un associé dans les tavernes.");
    if (tropTard(s, 2)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 2, 5);
    if (rand(s) >= 0.4 + s.stats.charisme * 0.02 + c0(s).rang * 0.1) return res(true, "Tu sondes quelques gaillards au comptoir. Aucun ne te paraît fiable aujourd'hui.");
    const nom = ["Brak", "Sélène", "Hobb", "Yara", "Tuck", "Mina"][Math.floor(rand(s) * 6)];
    const id = `as${s.jour}_${Math.floor(rand(s) * 1e6)}`;
    s.pnj[id] = { nom, role: "ton associé, chasseur de primes", genre: rand(s) < 0.5 ? "f" : "g", lieu: "equipage", relation: 20, fonds: 0, souvenirs: [], force: 8 + Math.floor(rand(s) * 8),
      associe: true, membre: true, vivant: true, enfants: [], parents: [], couple: null };
    return res(true, `${nom} accepte de faire équipe avec toi : 30 % des primes, et son aide dans chaque traque.`);
  },
  renvoyer_associe(s) {
    const a = associe(s);
    if (!a) return res(false, "Tu n'as pas d'associé.");
    s.pnj[a].lieu = "disparu";
    return res(true, `Tu te sépares de ${s.pnj[a].nom}. Chacun reprend sa route.`);
  },
};

export function actionsChasseur(s) {
  const a = [];
  if (!chasseur(s)) return a;
  const c = c0(s);
  const affichage = s.lieu === "bureau_primes" || TAVERNES.includes(s.lieu) || s.lieu === ILES[s.ile].port;
  if (affichage) {
    a.push({ id: "avis", label: "Consulter les avis de recherche" });
    for (const r of recherches(s).slice(0, 3)) if (r.id !== c.contrat) a.push({ id: "contrat", cible: r.id, label: `Contrat : ${r.capitaine}, ${Math.round(r.prime / 1000000)} M฿ (${ILES[r.ile].nom})` });
  }
  if (rivauxIci(s).length) a.push({ id: "traquer", label: `Traquer ${rivauxIci(s).some(r => r.id === c.contrat) ? "ta cible" : "un pirate recherché"}${c.piege ? " (piège prêt)" : ""}` });
  if (s.lieu === ILES[s.ile].port || TAVERNES.includes(s.lieu)) a.push({ id: "petite_prime", label: "Chercher une petite prime" });
  if (!c.piege && s.berrys >= PRIX_PIEGE) a.push({ id: "piege", label: `Préparer un piège (${PRIX_PIEGE} B)` });
  if (c.rang >= 1 && !associe(s) && TAVERNES.includes(s.lieu)) a.push({ id: "associe", label: "Chercher un associé" });
  if (associe(s) && TAVERNES.includes(s.lieu)) a.push({ id: "renvoyer_associe", label: "Te séparer de ton associé" });
  return a;
}

// Chaque jour : un chasseur recherché perd sa licence ; un contrat sur un équipage disparu tombe.
export function vieChasseur(s) {
  if (!chasseur(s)) return;
  const c = c0(s);
  if (s.prime > 0) {
    s.ancienneCarriere = { ...c, fin: s.jour }; s.carriere = null;
    const a = associe(s); if (a) s.pnj[a].lieu = "disparu";
    reputation(s, "chasseurs", -20);
    noter(s, "Ta tête est mise à prix : ta licence de chasseur de primes est révoquée.", "mission");
    return;
  }
  if (c.contrat && !s.monde.rivaux.some(r => r.id === c.contrat && r.actif)) { c.contrat = null; noter(s, "Ta cible a été prise par un autre : le contrat est annulé.", "monde"); }
}

export const EVENEMENTS_CHASSEUR = [
  { id: "vengeance_pirates", planifie: true, texte: (s, d) => `Des silhouettes t'encerclent : d'anciens compagnons des ${d.nom || "pirates que tu as livrés"} veulent ta peau.`,
    choix: [["Te battre", s => engagerCombat(s, { type: "vengeance_pirates", nom: "le meneur de la bande", force: 22 + (ILES[s.ile].danger || 0) * 10, intro: "Tu te mets dos au mur." }).texte],
      ["Fuir", s => { if (s.stats.agilite + rand(s) * 20 >= 18) return "Tu disparais dans la foule."; blesser(s, 1); return "Ils te rattrapent et te rossent avant que tu ne t'échappes."; }]] },
  { id: "chasseur_rival", age: [16, 99], cond: s => chasseur(s) && !!c0(s).contrat, texte: "Un autre chasseur suit la même piste que toi et propose de partager la prime.",
    choix: [["Refuser : c'est ton contrat", s => { s.traits.courage = Math.min(10, (s.traits.courage || 0) + 1); return "« Alors que le meilleur gagne. » Il te devancera peut-être."; }],
      ["Lui céder le contrat contre 80 Berrys", s => { c0(s).contrat = null; s.monde.exterieur -= 80; s.berrys += 80; s.traits.ruse = Math.min(10, (s.traits.ruse || 0) + 1); return "Il te paie comptant. À lui les risques."; }]] },
  { id: "chasseur_pot_de_vin", age: [16, 99], cond: s => chasseur(s) && c0(s).captures >= 1, texte: "Un pirate que tu serres de près te glisse une bourse : « Tu ne m'as jamais vu. »",
    choix: [["Refuser", s => { reputation(s, "chasseurs", 4); return `Ta réputation d'incorruptible grandit.${renommee(s, 1)}`; }],
      ["Prendre l'argent (200 Berrys)", s => { s.monde.exterieur -= 200; s.berrys += 200; reputation(s, "chasseurs", -8); s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 1); return "Tu empoches. Dans ce métier, tout finit par se savoir."; }]] },
  { id: "chasseur_innocent", age: [16, 99], cond: s => chasseur(s), texte: "L'homme de l'avis de recherche jure qu'on l'accuse à tort, et les preuves semblent lui donner raison.",
    choix: [["Enquêter avant de l'arrêter", s => { s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + 2); return `Tu démasques le vrai coupable : un notable. L'innocent est libre.${renommee(s, 2)}`; }],
      ["Le livrer : une prime est une prime", s => { s.monde.exterieur -= 100; s.berrys += 100; s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 2); s.humeur = Math.max(-100, (s.humeur || 0) - 8); return "Cent Berrys. Son regard te suivra longtemps."; }]] },
  { id: "chasseur_marine", age: [16, 99], cond: s => chasseur(s) && c0(s).rang >= 2, texte: "Un officier de la Marine te propose un poste : « Un homme comme toi serait mieux sous l'uniforme. »",
    choix: [["Décliner : tu tiens à ta liberté", s => { s.traits.courage = Math.min(10, (s.traits.courage || 0) + 1); return "Il sourit. « Dommage. »"; }],
      ["Demander une prime doublée à la place", s => { s.traits.ruse = Math.min(10, (s.traits.ruse || 0) + 1); reputation(s, "marine", -2); return "Il s'étrangle, puis éclate de rire. Tu n'auras ni l'un ni l'autre."; }]] },
];
