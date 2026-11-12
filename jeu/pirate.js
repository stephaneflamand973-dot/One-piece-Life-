// Carrière de pirate complète.
// Deux voies : entrer comme mousse dans un équipage existant et monter en grade (jusqu'à fonder le sien
// ou prendre le commandement par une mutinerie), ou être capitaine de son propre équipage.
// Le capitaine gère le moral, les rôles à bord, les améliorations du navire, les coups (navires marchands,
// navires de la Marine, rançons, duels de capitaines) et des territoires sous sa protection.
// Tout l'argent vient de quelqu'un ou de l'extérieur comptabilisé ; les gains d'expérience sont fixes.

import { rand, noter, age, puissance, blesser, transferer, gagnerStat, gagnerCompetence, souvenir, equipage, calculPrime, capturer,
  GAINS, ILES, LIEUX, NAVIRES, res } from "./engine.js";
import { nouvelle, regionDe, rivauxIci } from "./monde.js";
import { reputation } from "./factions.js";

export const GRADES_PIRATE = ["Mousse", "Matelot", "Officier", "Second"];
export const MERITE_PIRATE = [0, 8, 20, 40];
export const AMELIORATIONS = {
  canons: { nom: "Canons", prix: 1500, desc: "+8 en puissance à l'abordage et contre la Marine" },
  voiles: { nom: "Voiles renforcées", prix: 800, desc: "tempêtes deux fois plus rares, passages dangereux plus sûrs" },
  blindage: { nom: "Coque blindée", prix: 2000, desc: "la coque s'use deux fois moins en mer" },
};

export const estCapitaine = s => s.carriere?.type === "pirate" && !s.carriere.membre;
export const estMembre = s => s.carriere?.type === "pirate" && !!s.carriere.membre;
const role = (s, r) => equipage(s).filter(id => s.pnj[id].role.startsWith(r)).length;
export const bonusCanons = s => (s.navire?.ameliorations?.canons ? 8 : 0) + 4 * role(s, "canonnier");
export const aVoiles = s => !!s.navire?.ameliorations?.voiles;
export const aBlindage = s => !!s.navire?.ameliorations?.blindage;
const rival = s => s.monde.rivaux.find(r => r.id === s.carriere?.membre);
const occupe = (s, h, f) => { s.heure += h; s.fatigue = Math.min(100, s.fatigue + f); };
const tropTard = (s, h) => s.heure + h > 24 || s.fatigue >= 80;
const port = s => s.lieu === ILES[s.ile].port;

export function moral(s, d) {
  if (!estCapitaine(s)) return;
  s.carriere.moral = Math.max(0, Math.min(100, (s.carriere.moral ?? 60) + d));
}

function promotionPirate(s) {
  const c = s.carriere;
  if (c.grade >= GRADES_PIRATE.length - 1 || c.merite < MERITE_PIRATE[c.grade + 1]) return "";
  c.grade += 1;
  noter(s, `Promotion : tu deviens ${GRADES_PIRATE[c.grade]} des ${c.equipage}.`, "mission");
  return ` Le capitaine te nomme ${GRADES_PIRATE[c.grade]} !`;
}

// Devenir capitaine : à partir de rien (avec un navire), ou en quittant / renversant son équipage.
export function devenirCapitaine(s, nom, { moralDepart = 60 } = {}) {
  s.carriere = { type: "pirate", equipage: nom || `Pirates de ${s.perso.prenom}`, depuis: s.jour, raids: 0, moral: moralDepart, territoires: [], dernierRaid: s.jour };
  s.navire && (s.navire.ameliorations ??= {});
}

export const ACTIONS_PIRATE = {
  rejoindre(s) {
    if (s.carriere) return res(false, "Tu as déjà une carrière.");
    if (age(s) < 15) return res(false, "« Reviens quand tu auras du poil au menton, gamin. »");
    const r = rivauxIci(s).find(r => !r.ennemi);
    if (!r) return res(false, "Aucun équipage pirate ne mouille ici.");
    if (tropTard(s, 2)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 2, 5);
    if (s.stats.force + s.competences.combat + s.stats.charisme + rand(s) * 15 < 12) return res(true, `Le capitaine ${r.capitaine} te toise : « Trop maigrichon. Reviens plus costaud. »`);
    s.carriere = { type: "pirate", membre: r.id, equipage: r.nom, capitaine: r.capitaine, grade: 0, merite: 0, depuis: s.jour, raids: 0 };
    reputation(s, "pirates", 3); reputation(s, "marine", -3);
    return res(true, `Le capitaine ${r.capitaine} te tend une main calleuse : te voilà mousse des ${r.nom}. Tu suivras l'équipage où il ira.`);
  },
  corvees(s) {
    if (!estMembre(s)) return res(false, "Il faut faire partie d'un équipage.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 20);
    s.carriere.merite += 1;
    const g = gagnerStat(s, "force", GAINS.entrainement);
    return res(true, `Pont lavé, cordages lovés, voiles ravaudées. Mérite +1${g ? `, Force +${g}` : ""}.${promotionPirate(s)}`);
  },
  abordage(s) {
    if (!estMembre(s)) return res(false, "Il faut faire partie d'un équipage.");
    if (!port(s)) return res(false, "L'équipage part à l'abordage depuis le port.");
    if (tropTard(s, 8)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 8, 40);
    const r = rival(s);
    const danger = ILES[s.ile].danger || 0;
    s.carriere.raids += 1;
    if ((r?.force || 20) + puissance(s) * 0.5 + rand(s) * 20 >= 25 + danger * 10) {
      const part = Math.round((80 + rand(s) * 120) * (1 + danger) * (1 + s.carriere.grade * 0.5));
      s.monde.exterieur -= part; s.berrys += part;
      s.carriere.merite += 3;
      s.infamie = +(s.infamie + 0.1 * (1 + danger)).toFixed(2); s.prime = calculPrime(s.infamie);
      reputation(s, "pirates", 1);
      return res(true, `Les ${s.carriere.equipage} s'emparent d'un navire marchand. Ta part du butin : ${part} Berrys. Mérite +3.${s.prime ? ` Ta prime : ${s.prime.toLocaleString("fr-FR")} Berrys.` : ""}${promotionPirate(s)}`);
    }
    blesser(s, rand(s) < 0.3 ? 2 : 1);
    return res(true, "L'abordage échoue : l'équipage bat en retraite et tu es blessé.");
  },
  fonder(s) {
    if (!estMembre(s)) return res(false, "Il faut d'abord faire partie d'un équipage.");
    if (!s.navire) return res(false, "Pour fonder ton équipage, il te faut ton propre navire.");
    if (!port(s)) return res(false, "Il faut être au port.");
    const ancien = s.carriere.equipage;
    devenirCapitaine(s, null);
    return res(true, `Tu quittes les ${ancien} en bons termes et hisses ton propre pavillon sur « ${s.navire.nom} ». Les ${s.carriere.equipage} sont nés.`);
  },
  mutinerie(s) {
    if (!estMembre(s) || s.carriere.grade < 3) return res(false, "Seul le Second peut espérer rallier l'équipage contre son capitaine.");
    const r = rival(s);
    if (!r) return res(false, "Ton équipage n'existe plus.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 40);
    if (puissance(s) + s.stats.charisme + rand(s) * 25 >= r.force + 15) {
      r.actif = false; r.fin = "mutinerie";
      const nom = r.nom;
      s.navire = { type: "caravelle", nom: `Le ${["Revanche", "Fier Corbeau", "Nouvel Horizon"][Math.floor(rand(s) * 3)]}`, coque: 80, ameliorations: {} };
      devenirCapitaine(s, nom, { moralDepart: 45 });
      for (let i = 0; i < 4; i++) creerMembre(s);
      s.infamie = +(s.infamie + 1).toFixed(2); s.prime = calculPrime(s.infamie);
      nouvelle(s, s.ile, `Mutinerie chez les ${nom} : ${s.perso.prenom} a renversé le capitaine ${r.capitaine}.`, "region");
      return res(true, `La mutinerie réussit ! Le capitaine ${r.capitaine} est débarqué. Te voilà capitaine des ${nom}, avec leur caravelle et une partie de l'équipage.`);
    }
    blesser(s, 2);
    s.carriere = null;
    return res(true, `La mutinerie échoue. Le capitaine ${r.capitaine} te fait jeter par-dessus bord. Tu regagnes la rive, blessé et sans équipage.`);
  },
  quitter_equipage(s) {
    if (!estMembre(s)) return res(false, "Tu ne fais partie d'aucun équipage.");
    s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
    return res(true, "Tu débarques avec ton sac et ta part du butin. Fin de l'aventure avec cet équipage.");
  },
  // ---------- Capitaine ----------
  fete(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine organise une fête.");
    const n = Math.max(1, equipage(s).length);
    const cout = 10 * n;
    if (s.berrys < cout) return res(false, `Il faut ${cout} Berrys pour régaler tout le monde.`);
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    s.berrys -= cout; s.monde.exterieur += cout;
    occupe(s, 4, 10); moral(s, 15);
    for (const id of equipage(s)) s.pnj[id].relation += 3;
    return res(true, `Rhum, viande grillée et chansons jusqu'à l'aube (${cout} Berrys). Moral de l'équipage : ${s.carriere.moral}.`);
  },
  prime_equipage(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine distribue des primes.");
    const membres = equipage(s);
    if (!membres.length) return res(false, "Tu n'as pas d'équipage.");
    const cout = 20 * membres.length;
    if (s.berrys < cout) return res(false, `Il faut ${cout} Berrys (20 par membre).`);
    for (const id of membres) { transferer(s, "joueur", id, 20); s.pnj[id].relation += 4; }
    moral(s, 10);
    return res(true, `Chacun reçoit 20 Berrys de prime. L'équipage t'acclame. Moral : ${s.carriere.moral}.`);
  },
  ameliorer(s, k) {
    const a = AMELIORATIONS[k];
    if (!a) return res(false, "Cette amélioration n'existe pas.");
    if (!s.navire) return res(false, "Tu n'as pas de navire.");
    const vendeur = s.lieu === "chantier" ? "bolt" : s.lieu === "armurerie" ? "barro" : null;
    if (!vendeur || (k !== "canons" && vendeur === "barro")) return res(false, k === "canons" ? "Les canons s'achètent à l'armurerie de Loguetown ou au chantier de Water Seven." : "Seul le chantier naval de Water Seven fait ce travail.");
    if (s.navire.ameliorations?.[k]) return res(false, "Ton navire en est déjà équipé.");
    if (s.berrys < a.prix) return res(false, `Il faut ${a.prix} Berrys.`);
    transferer(s, "joueur", vendeur, a.prix);
    s.navire.ameliorations ??= {}; s.navire.ameliorations[k] = s.jour;
    return res(true, `${a.nom} installés sur « ${s.navire.nom} » pour ${a.prix} Berrys : ${a.desc}.`);
  },
  attaquer_marine(s) {
    if (!estCapitaine(s) || !s.navire) return res(false, "Il faut être capitaine et avoir un navire.");
    if (!port(s)) return res(false, "On guette les navires de la Marine depuis le port.");
    if (s.infamie < 2) return res(false, "Ton équipage n'ose pas encore s'attaquer à la Marine.");
    if (tropTard(s, 8)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 8, 45);
    s.carriere.raids += 1; s.carriere.dernierRaid = s.jour;
    const danger = ILES[s.ile].danger || 0;
    const nous = puissance(s) + equipage(s).reduce((t, id) => t + (s.pnj[id].force || 0), 0) + bonusCanons(s) + rand(s) * 20;
    if (nous >= 35 + danger * 12 + rand(s) * 25) {
      const butin = Math.round(300 * (1 + danger));
      s.monde.exterieur -= butin; s.berrys += butin;
      s.infamie = +(s.infamie + 1.5).toFixed(2); s.prime = calculPrime(s.infamie);
      reputation(s, "marine", -10); reputation(s, "pirates", 6); moral(s, 12);
      nouvelle(s, s.ile, `Les ${s.carriere.equipage} ont coulé un navire de la Marine !`, "monde");
      return res(true, `Vous prenez d'assaut un navire de la Marine et pillez sa caisse : ${butin} Berrys. Ta prime grimpe à ${s.prime.toLocaleString("fr-FR")} Berrys.`);
    }
    moral(s, -10);
    if (rand(s) < 0.5) {
      blesser(s, 2);
      return res(true, "La Marine riposte avec violence. Vous battez en retraite, tu es gravement blessé.");
    }
    return capturer(s, "lors de l'assaut d'un navire de la Marine");
  },
  rancon(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine peut rançonner une île.");
    if (!port(s)) return res(false, "Il faut être au port.");
    if (s.ile === "shells" || ILES[s.ile].nouveauMonde && !s.carriere.territoires.includes(s.ile) && s.infamie < 30) return res(false, "Cette île est trop bien gardée pour toi.");
    if (s.carriere.territoires.includes(s.ile)) return res(false, "Cette île est sous ta protection : la rançonner briserait ta parole.");
    if (tropTard(s, 6)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 6, 25);
    const danger = ILES[s.ile].danger || 0;
    const somme = Math.round(200 * (1 + danger));
    s.monde.exterieur -= somme; s.berrys += somme;
    s.infamie = +(s.infamie + 0.3).toFixed(2); s.prime = calculPrime(s.infamie);
    reputation(s, "gouvernement", -3); moral(s, 5);
    s.traits.bonte = Math.max(-10, (s.traits.bonte || 0) - 1);
    s.drapeaux.rancons ??= {}; s.drapeaux.rancons[s.ile] = s.jour;
    nouvelle(s, s.ile, `Les ${s.carriere.equipage} ont rançonné ${ILES[s.ile].nom}.`, "region");
    return res(true, `Les habitants rassemblent ${somme} Berrys sous la menace de vos canons. Ils ne l'oublieront pas.`);
  },
  defier(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine défie un autre capitaine.");
    const r = rivauxIci(s).filter(r => !r.allie).sort((a, b) => a.force - b.force)[0];
    if (!r) return res(false, "Aucun capitaine rival à défier ici.");
    if (tropTard(s, 4)) return res(false, "Il est trop tard, ou tu es trop fatigué.");
    occupe(s, 4, 40);
    if (puissance(s) + rand(s) * 25 >= r.force + 10) {
      r.actif = false; r.fin = `vaincu en duel par ${s.perso.prenom}`;
      const recrues = Math.min(2, (NAVIRES[s.navire?.type]?.capacite || 3) - equipage(s).length);
      for (let i = 0; i < recrues; i++) creerMembre(s);
      s.infamie = +(s.infamie + Math.min(3, Math.max(1, r.prime / 30000000))).toFixed(2); s.prime = calculPrime(s.infamie);
      const butin = Math.min(5000, Math.round(r.prime / 4000));
      s.monde.exterieur -= butin; s.berrys += butin;
      gagnerCompetence(s, "combat", GAINS.combat); moral(s, 15);
      nouvelle(s, s.ile, `Le capitaine ${r.capitaine} (${r.nom}) a été vaincu en duel par ${s.perso.prenom}.`, "region");
      return res(true, `Duel de capitaines ! Tu fais plier ${r.capitaine}. Son équipage se disperse${recrues > 0 ? ` et ${recrues} de ses hommes te rejoignent` : ""}. Butin : ${butin} Berrys. Ta prime : ${s.prime.toLocaleString("fr-FR")} Berrys.`);
    }
    blesser(s, 2); moral(s, -12);
    return res(true, `${r.capitaine} est plus fort que prévu. Tu t'effondres sur le pont devant ton équipage.`);
  },
  proteger(s) {
    if (!estCapitaine(s)) return res(false, "Seul un capitaine place une île sous sa protection.");
    if (!port(s)) return res(false, "Il faut être au port.");
    if (s.infamie < 12) return res(false, "Ton nom ne fait pas encore assez peur pour protéger une île (prime d'environ 34 millions).");
    if (s.ile === "shells") return res(false, "Une base de la Marine ? Impossible.");
    if (s.carriere.territoires.includes(s.ile)) return res(false, "Cette île est déjà sous ta protection.");
    s.carriere.territoires.push(s.ile);
    nouvelle(s, s.ile, `${ILES[s.ile].nom} passe sous la protection des ${s.carriere.equipage}.`, "monde");
    return res(true, `Ton pavillon flotte désormais sur ${ILES[s.ile].nom}. Plus aucun pirate n'osera la piller, et elle te versera un tribut chaque semaine.`);
  },
  renommer(s, nom) {
    if (!estCapitaine(s)) return res(false, "Seul le capitaine choisit le nom de l'équipage.");
    const n = String(nom || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (n.length < 3) return res(false, "Nom trop court.");
    s.carriere.equipage = n;
    return res(true, `Ton équipage s'appelle désormais les « ${n} ».`);
  },
};

const NOMS = ["Dag", "Orso", "Pia", "Zeke", "Luna", "Kurt", "Moe", "Vera", "Toby", "Ines", "Rufo", "Alba", "Brick", "Sola", "Jin", "Mako"];
const ROLES = [["navigateur", 3], ["cuisinier", 4], ["combattant", 9], ["canonnier", 7], ["charpentier de bord", 5], ["médecin de bord", 3], ["musicien de bord", 3]];
export function creerMembre(s) {
  const [r, f] = ROLES[Math.floor(rand(s) * ROLES.length)];
  const id = `r${s.jour}_${Math.floor(rand(s) * 1e6)}`;
  s.pnj[id] = { nom: NOMS[Math.floor(rand(s) * NOMS.length)], role: `${r} de ton équipage`, genre: rand(s) < 0.5 ? "f" : "g", lieu: "equipage",
    relation: 15, fonds: 0, souvenirs: [], force: f + Math.floor(rand(s) * 5), membre: true, vivant: true, enfants: [], parents: [], couple: null };
  return id;
}

export function actionsPirate(s) {
  const a = [];
  if (!s.carriere && age(s) >= 15 && rivauxIci(s).some(r => !r.ennemi)) a.push({ id: "rejoindre", label: `Rejoindre un équipage pirate (${rivauxIci(s).find(r => !r.ennemi).nom})` });
  if (estMembre(s)) {
    a.push({ id: "corvees", label: "Corvées à bord" });
    if (port(s)) a.push({ id: "abordage", label: "Partir à l'abordage avec l'équipage" });
    if (s.navire && port(s)) a.push({ id: "fonder", label: "Fonder ton propre équipage" });
    if (s.carriere.grade >= 3) a.push({ id: "mutinerie", label: "Mener une mutinerie" });
    a.push({ id: "quitter_equipage", label: "Quitter l'équipage" });
  }
  if (estCapitaine(s)) {
    a.push({ id: "fete", label: `Organiser une fête à bord (${10 * Math.max(1, equipage(s).length)} B)` });
    if (equipage(s).length) a.push({ id: "prime_equipage", label: `Distribuer une prime (${20 * equipage(s).length} B)` });
    if (port(s)) {
      if (s.infamie >= 2) a.push({ id: "attaquer_marine", label: "Attaquer un navire de la Marine" });
      if (s.ile !== "shells" && !s.carriere.territoires.includes(s.ile)) a.push({ id: "rancon", label: "Rançonner l'île" });
      if (s.infamie >= 12 && s.ile !== "shells" && !s.carriere.territoires.includes(s.ile)) a.push({ id: "proteger", label: "Placer l'île sous ta protection" });
    }
    if (rivauxIci(s).some(r => !r.allie)) a.push({ id: "defier", label: "Défier un capitaine rival en duel" });
  }
  if (s.navire && (s.lieu === "chantier" || s.lieu === "armurerie")) {
    for (const [k, am] of Object.entries(AMELIORATIONS)) {
      if (s.navire.ameliorations?.[k]) continue;
      if (s.lieu === "armurerie" && k !== "canons") continue;
      a.push({ id: "ameliorer", cible: k, label: `${am.nom} (${am.prix} B)` });
    }
  }
  return a;
}

// Chaque jour : suivre son équipage, moral, tribut des territoires, désertions et mutineries.
export function vieEquipage(s) {
  const c = s.carriere;
  if (!c || c.type !== "pirate" || !s.perso.vivant) return;
  if (c.membre) {
    const r = rival(s);
    if (!r || !r.actif) {
      s.ancienneCarriere = { ...c, fin: s.jour }; s.carriere = null;
      noter(s, `Ton équipage, les ${c.equipage}, n'existe plus. Te voilà seul.`, "mission");
      return;
    }
    if (!s.prison && r.ile !== s.ile) {
      s.ile = r.ile; s.lieu = ILES[r.ile].port;
      noter(s, `Tu suis les ${c.equipage} : vous jetez l'ancre ${ILES[r.ile].a}.`, "voyage");
    }
    return;
  }
  c.moral ??= 60; c.territoires ??= [];
  if (s.prison) return; // en prison : ni tribut, ni vie d'équipage
  // Sans butin depuis longtemps, l'équipage s'ennuie ; un cuisinier et un musicien adoucissent l'attente.
  if (s.jour - (c.dernierRaid ?? s.jour) > 14 && s.jour % 3 === 0) moral(s, -1 + (role(s, "cuisinier") ? 0.5 : 0) + (role(s, "musicien") ? 0.5 : 0));
  if (s.jour % 7 === 0) {
    for (const ile of c.territoires) {
      const tribut = Math.round(60 * (1 + (ILES[ile].danger || 0)));
      s.monde.exterieur -= tribut; s.berrys += tribut;
    }
    if (c.territoires.length) noter(s, `Tes territoires te versent leur tribut (${c.territoires.length} île${c.territoires.length > 1 ? "s" : ""}).`, "monde");
    const membres = equipage(s);
    if (c.moral < 25 && membres.length && rand(s) < 0.4) {
      const id = membres[Math.floor(rand(s) * membres.length)];
      s.pnj[id].lieu = "disparu";
      noter(s, `Le moral est au plus bas : ${s.pnj[id].nom} a déserté pendant la nuit.`, "mission");
    }
    if (c.moral < 10 && membres.length >= 2 && !c.mutinerieMenace) {
      c.mutinerieMenace = s.jour;
      s.planifies?.push({ jour: s.jour, id: "mutinerie_contre_toi", data: {} });
    }
  }
}

export const EVENEMENTS_PIRATE = [
  { id: "mutinerie_contre_toi", planifie: true, cond: s => estCapitaine(s), texte: "Des murmures sur le pont, des regards fuyants… Ton équipage prépare une mutinerie !",
    choix: [["Affronter les meneurs", s => {
        const force = equipage(s).reduce((t, id) => t + (s.pnj[id].force || 0), 0) * 0.5;
        s.carriere.mutinerieMenace = null;
        if (puissance(s) + rand(s) * 20 >= force + 10) { s.carriere.moral = 45; return "Tu fais face aux meneurs et les désarmes. L'équipage se range derrière toi, impressionné."; }
        blesser(s, 2);
        const nav = s.navire?.nom; s.navire = null;
        for (const id of equipage(s)) s.pnj[id].lieu = "disparu";
        s.ancienneCarriere = { ...s.carriere, fin: s.jour }; s.carriere = null;
        return `Les mutins te jettent dans une chaloupe et partent avec « ${nav} ». Tu n'as plus ni navire ni équipage.`;
      }],
      ["Promettre une grosse prime (30 B par membre)", s => {
        const membres = equipage(s); const cout = 30 * membres.length;
        s.carriere.mutinerieMenace = null;
        if (s.berrys < cout) { s.carriere.moral = 15; return "Tu n'as pas l'argent. Les promesses ne suffisent qu'à gagner du temps."; }
        for (const id of membres) transferer(s, "joueur", id, 30);
        s.carriere.moral = 55; return "L'argent apaise les esprits. Pour cette fois.";
      }]] },
  { id: "territoire_attaque", age: [16, 99], cond: s => estCapitaine(s) && s.carriere.territoires?.length > 0 && rand(s) < 0.3,
    prep: s => ({ ile: s.carriere.territoires[Math.floor(rand(s) * s.carriere.territoires.length)] }),
    texte: (s, d) => `Un équipage rival menace ${ILES[d.ile].nom}, placée sous ta protection.`,
    choix: [["Défendre ton territoire", (s, d) => {
        if (!ILES[d.ile] || !s.carriere?.territoires) return "Fausse alerte : aucun navire ennemi en vue.";
        if (puissance(s) + bonusCanons(s) + rand(s) * 25 >= 30 + (ILES[d.ile].danger || 0) * 10) { moral(s, 10); s.infamie = +(s.infamie + 0.5).toFixed(2); s.prime = calculPrime(s.infamie); return "Vous chassez les intrus. Ta parole tient, et ta réputation grandit."; }
        blesser(s, 1); s.carriere.territoires = s.carriere.territoires.filter(i => i !== d.ile); moral(s, -10);
        return `Vous êtes repoussés : ${ILES[d.ile].nom} passe aux mains de tes rivaux.`;
      }],
      ["Abandonner l'île", (s, d) => { if (!ILES[d.ile] || !s.carriere?.territoires) return "Fausse alerte."; s.carriere.territoires = s.carriere.territoires.filter(i => i !== d.ile); moral(s, -8); return `Tu renonces à ${ILES[d.ile].nom}. L'équipage murmure que tu as manqué de cran.`; }]] },
];
