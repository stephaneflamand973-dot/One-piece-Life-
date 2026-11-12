// Étape 4 · Les factions et la politique.
// Réputation séparée auprès de chaque faction ; carrières de chasseur de primes, de révolutionnaire,
// de Grand Corsaire et d'Empereur ; alliances et trahisons entre équipages ; guerres dans le Nouveau Monde.
// Échelle : les primes sont en Berrys canoniques ; la Marine verse aux chasseurs une prime réglementaire
// d'un deux-millième, à l'échelle des prix du jeu. L'argent vient toujours de l'extérieur comptabilisé.

import { rand, noter, age, puissance, blesser, pnjIci, gagnerCompetence, notoriete, GAINS, ILES, res } from "./engine.js";
import { nouvelle, regionDe, rivauxIci } from "./monde.js";
import { engagerCombat, definirFin } from "./combat.js";
import { armeeExiste } from "./revolution.js";

definirFin("traque", (s, issue, d) => {
  const r = s.monde.rivaux.find(x => x.id === d.r);
  if (!r) return "";
  if (issue === "victoire") {
    const gain = Math.min(5000, recompenseChasseur(r.prime));
    r.actif = false; r.fin = "capturé par un chasseur";
    s.monde.exterieur -= gain; s.berrys += gain;
    if (s.carriere?.type === "chasseur") s.carriere.captures += 1;
    const gco = gagnerCompetence(s, "combat", GAINS.combat);
    reputation(s, "chasseurs", 5); reputation(s, "marine", 3); reputation(s, "pirates", -5);
    nouvelle(s, s.ile, `Le capitaine ${r.capitaine} (${r.nom}) a été capturé par ${s.perso.prenom}, chasseur de primes.`, "region");
    return `Tu captures le capitaine ${r.capitaine} et le livres à la Marine. Prime réglementaire versée : ${gain} Berrys. Combat +${gco}.`;
  }
  r.force += 1;
  if (issue === "fuite") return `Les ${r.nom} savent désormais qu'on les traque.`;
  blesser(s, rand(s) < 0.3 ? 2 : 1);
  return `La traque échoue et tu t'en sors blessé.`;
});

export const FACTIONS = { marine: "Marine", gouvernement: "Gouvernement mondial", revolution: "Armée révolutionnaire", pirates: "Pirates", chasseurs: "Chasseurs de primes" };
export const SEUIL_CORSAIRE = 80000000;
export const SEUIL_EMPEREUR = 1000000000;
export const TRIBUT_EMPEREUR = 2000;

export function reputation(s, k, d) {
  s.reputation ??= {};
  s.reputation[k] = Math.max(-100, Math.min(100, (s.reputation[k] || 0) + d));
}
const recompenseChasseur = prime => Math.round(prime / 2000);
const corsaire = s => s.carriere?.type === "pirate" && s.carriere.corsaire;

// La Marine épargne les Grands Corsaires (lettre de course du Gouvernement mondial).
export const marineIgnore = s => corsaire(s);

export const ACTIONS_FACTIONS = {
  chasseur(s) {
    if (s.lieu !== "bureau_primes") return res(false, "On s'inscrit au bureau des primes de Loguetown.");
    if (s.carriere) return res(false, "Tu as déjà une carrière.");
    if (age(s) < 16) return res(false, "Trop jeune pour chasser les pirates.");
    if (s.prime > 0) return res(false, "« Un pirate recherché qui veut chasser les pirates ? Dehors ! »");
    s.carriere = { type: "chasseur", captures: 0, depuis: s.jour };
    reputation(s, "chasseurs", 10); reputation(s, "pirates", -5);
    return res(true, "Tu signes le registre des chasseurs de primes. Les avis de recherche sont désormais ton gagne-pain.");
  },
  traquer(s) {
    if (s.carriere?.type !== "chasseur") return res(false, "Seul un chasseur de primes traque les pirates.");
    const cibles = rivauxIci(s);
    if (!cibles.length) return res(false, "Aucun équipage recherché n'est signalé sur cette île.");
    if (s.fatigue >= 80) return res(false, "Tu es trop fatigué pour une traque.");
    s.heure += 6; s.fatigue = Math.min(100, s.fatigue + 40);
    const r = cibles.sort((a, b) => a.force - b.force)[0];
    return engagerCombat(s, { type: "traque", nom: `le capitaine ${r.capitaine}`, force: r.force + 8, intro: `Tu débusques les ${r.nom} dans leur repaire.`, data: { r: r.id } });
  },
  revolution(s) {
    if (s.lieu !== "echafaud") return res(false, "On dit que l'Armée révolutionnaire recrute discrètement près de l'échafaud de Loguetown.");
    if (s.carriere) return res(false, "Tu as déjà une carrière.");
    if (!armeeExiste(s)) return res(false, "Tu attends des heures, en vain. À cette époque, aucune armée ne s'est encore levée contre le Gouvernement mondial.");
    if (age(s) < 18) return res(false, "Personne ne t'aborde. Tu es trop jeune.");
    if ((s.reputation?.gouvernement || 0) > -10 && (s.traits?.bonte || 0) < 3) return res(false, "Personne ne t'aborde. Il faudra prouver que tu combats l'injustice.");
    s.carriere = { type: "revolution", missions: 0, depuis: s.jour, grade: 0, influence: 0, couverture: 80, soutien: {}, cellules: [], liberees: [] };
    reputation(s, "revolution", 15); reputation(s, "gouvernement", -10);
    return res(true, "Une silhouette encapuchonnée te glisse un message : « Rejoins-nous. » Tu fais désormais partie de l'Armée révolutionnaire.");
  },
  sabotage(s) {
    if (s.carriere?.type !== "revolution") return res(false, "Seuls les révolutionnaires reçoivent ces missions.");
    if (s.lieu !== ILES[s.ile].port) return res(false, "Les cibles sont les entrepôts du Gouvernement, sur les ports.");
    if (s.fatigue >= 80) return res(false, "Tu es trop fatigué.");
    s.heure += 6; s.fatigue = Math.min(100, s.fatigue + 35);
    const danger = ILES[s.ile].danger || 0;
    if (s.stats.intelligence + s.stats.agilite + (s.traits?.ruse || 0) + rand(s) * 20 >= 20 + danger * 6) {
      s.carriere.missions += 1;
      reputation(s, "revolution", 5); reputation(s, "gouvernement", -5);
      notoriete(s, 1, { exploit: true });
      nouvelle(s, s.ile, `Des révolutionnaires ont saboté un entrepôt du Gouvernement mondial ${ILES[s.ile].a}.`, "monde");
      return res(true, `Le dépôt d'armes du Gouvernement part en fumée. Mission réussie. Le Gouvernement met ta tête à prix : ${s.prime.toLocaleString("fr-FR")} Berrys.`);
    }
    blesser(s, 1);
    return res(true, "Une patrouille te surprend : tu t'enfuis de justesse, blessé. Mission échouée.");
  },
  alliance(s) {
    if (s.carriere?.type !== "pirate" || s.carriere.membre) return res(false, "Seul un capitaine pirate conclut des alliances.");
    const r = rivauxIci(s).find(r => !r.allie && !r.ennemi);
    if (!r) return res(false, "Aucun équipage avec qui s'allier ici.");
    if (rand(s) < 0.3 + s.infamie * 0.05 + (s.stats.charisme || 0) * 0.01) {
      r.allie = true; reputation(s, "pirates", 3);
      nouvelle(s, s.ile, `Les ${s.carriere.equipage} et les ${r.nom} ont conclu une alliance.`, "region");
      return res(true, `Le capitaine ${r.capitaine} trinque avec toi : vos équipages sont désormais alliés.`);
    }
    return res(true, `Le capitaine ${r.capitaine} éclate de rire : « S'allier avec toi ? Reviens quand tu seras quelqu'un. »`);
  },
  trahir(s) {
    const r = rivauxIci(s).find(r => r.allie);
    if (!r) return res(false, "Aucun allié à trahir ici.");
    if (s.fatigue >= 80) return res(false, "Tu es trop fatigué.");
    s.heure += 6; s.fatigue = Math.min(100, s.fatigue + 40);
    r.allie = false; r.ennemi = true;
    reputation(s, "pirates", -25);
    if (puissance(s) + rand(s) * 20 >= r.force) {
      const butin = Math.min(5000, Math.round(recompenseChasseur(r.prime) * 2));
      s.monde.exterieur -= butin; s.berrys += butin;
      r.force = Math.max(5, r.force - 10);
      s.planifies?.push({ jour: s.jour + 200 + Math.floor(rand(s) * 200), id: "vengeance_alliee", data: { r: r.id } });
      nouvelle(s, s.ile, `Les ${s.carriere?.equipage ?? "hommes de " + s.perso.prenom} ont trahi et pillé leurs alliés, les ${r.nom} !`, "monde");
      return res(true, `Tu retournes tes canons contre tes alliés et pilles leur cale : ${butin} Berrys. Le capitaine ${r.capitaine} jure de se venger.`);
    }
    blesser(s, 2);
    return res(true, `La trahison échoue : les ${r.nom} étaient sur leurs gardes. Tu t'enfuis, gravement blessé.`);
  },
};

export function actionsFactions(s) {
  const a = [];
  if (s.lieu === "bureau_primes" && !s.carriere && age(s) >= 16) a.push({ id: "chasseur", label: "S'inscrire comme chasseur de primes" });
  if (s.carriere?.type === "chasseur" && rivauxIci(s).length) a.push({ id: "traquer", label: `Traquer un pirate recherché (${rivauxIci(s).length} signalé${rivauxIci(s).length > 1 ? "s" : ""})` });
  if (s.lieu === "echafaud" && !s.carriere && age(s) >= 18 && armeeExiste(s)) a.push({ id: "revolution", label: "Chercher l'Armée révolutionnaire" });
  if (s.carriere?.type === "pirate" && !s.carriere.membre) {
    if (rivauxIci(s).some(r => !r.allie && !r.ennemi)) a.push({ id: "alliance", label: "Proposer une alliance à un équipage" });
    if (rivauxIci(s).some(r => r.allie)) a.push({ id: "trahir", label: "Trahir un équipage allié" });
  }
  if ((s.carriere?.type === "chasseur" || s.carriere?.type === "revolution") && s.lieu === ILES[s.ile].port) a.push({ id: "quitter", label: "Abandonner ta carrière" });
  return a;
}

// Chaque jour : titres de Grand Corsaire et d'Empereur, tribut, guerres du Nouveau Monde.
export function vieFactions(s) {
  const c = s.carriere;
  if (c?.type === "pirate" && !c.membre) {
    if (!c.corsaire && !c.offreCorsaire && !s.prison && s.prime >= SEUIL_CORSAIRE && (s.reputation?.gouvernement || 0) > -40) {
      c.offreCorsaire = s.jour;
      s.planifies?.push({ jour: s.jour, id: "offre_corsaire", data: {} });
    }
    if (!c.empereur && regionDe(s.ile) === "nm" && s.prime >= SEUIL_EMPEREUR && Object.values(s.pnj).filter(p => p.lieu === "equipage").length >= 6) {
      c.empereur = s.jour;
      nouvelle(s, s.ile, `On compte désormais ${s.perso.prenom} parmi les Empereurs qui règnent sur le Nouveau Monde !`, "monde");
      noter(s, "Tu es désormais l'un des Empereurs du Nouveau Monde.", "mission");
    }
    if (c.empereur && s.jour % 7 === 0 && !s.prison) { s.monde.exterieur -= TRIBUT_EMPEREUR; s.berrys += TRIBUT_EMPEREUR; }
  }
  if (s.jour % 365 === 180 && rand(s) < 0.15) {
    nouvelle(s, "dressrosa", "Une guerre éclate entre la Marine et une flotte pirate du Nouveau Monde.", "monde");
    if (regionDe(s.ile) === "nm" && (c?.type === "pirate" || c?.type === "marine")) s.planifies?.push({ jour: s.jour, id: "guerre", data: {} });
  }
}

// Événements propres aux factions (ajoutés à la bibliothèque d'événements).
export const EVENEMENTS_FACTIONS = [
  { id: "offre_corsaire", planifie: true, cond: s => s.carriere?.type === "pirate", texte: "Un émissaire du Gouvernement mondial te tend une lettre scellée : on t'offre le titre de Grand Corsaire.",
    choix: [["Accepter le titre", s => { s.carriere.corsaire = s.jour; reputation(s, "gouvernement", 30); reputation(s, "pirates", -15); nouvelle(s, s.ile, `${s.perso.prenom} devient l'un des Grands Corsaires.`, "monde"); return "Ta prime est gelée et la Marine te laisse en paix. Les autres pirates te regardent de travers."; }],
      ["Refuser", s => { reputation(s, "pirates", 10); reputation(s, "gouvernement", -10); return "Tu déchires la lettre devant l'émissaire. Les pirates t'acclament."; }]] },
  { id: "vengeance_alliee", planifie: true, texte: "Une flotte surgit de la brume : tes anciens alliés viennent se venger.",
    choix: [["Combattre", s => { if (puissance(s) + rand(s) * 20 >= 40) { notoriete(s, 1); return "Tu les repousses définitivement."; } blesser(s, 2); return "Le combat est terrible. Tu survis à peine."; }],
      ["Fuir", s => { if (s.stats.agilite + rand(s) * 20 >= 18) return "Ton navire s'échappe dans la brume."; blesser(s, 1); return "Ils te rattrapent un moment avant que tu ne t'enfuies."; }]] },
  { id: "guerre", planifie: true, texte: "La guerre fait rage dans le Nouveau Monde. Les deux camps rassemblent leurs forces.",
    choix: [["Prendre part à la bataille", s => {
        if (puissance(s) + rand(s) * 30 >= 70) { if (s.carriere?.type === "marine") { s.carriere.merite += 30; s.carriere.dernierService = s.jour; } else notoriete(s, 3, { exploit: true }); return "Tu te distingues au cœur de la bataille. On parlera longtemps de toi."; }
        blesser(s, 2); return "La bataille te dépasse : tu en ressors gravement blessé, chanceux d'être en vie."; }],
      ["Rester à l'écart", () => "Tu observes de loin les éclairs et les incendies."]] },
];
