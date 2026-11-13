// Étape 2 · Des événements et des choix.
// Un événement a des conditions, 2 à 4 choix et des conséquences enregistrées. Certains en planifient
// d'autres des années plus tard (chaînes). Toutes les conséquences respectent les règles fixes :
// gains fixes (D.2A), argent toujours pris à quelqu'un ou à l'extérieur, aucune réussite partielle.

import { rand, noter, age, agePnj, pnjIci, puissance, souvenir, transferer, gagnerStat, gagnerCompetence, blesser, GAINS, ILES, LIEUX, ROUTES, lieuxDe } from "./engine.js";
import { nouvelle, regionDe, vivants } from "./monde.js";
import { EVENEMENTS_FACTIONS } from "./factions.js";
import { EVENEMENTS_2 } from "./evenements2.js";
import { EVENEMENTS_PIRATE } from "./pirate.js";
import { EVENEMENTS_3 } from "./evenements3.js";
import { EVENEMENTS_REVOLUTION } from "./revolution.js";
import { EVENEMENTS_CHASSEUR } from "./chasseur.js";
import { EVENEMENTS_GOUVERNEMENT } from "./gouvernement.js";
import { engagerCombat, definirFin } from "./combat.js";

definirFin("chasse", (s, issue, d) => {
  const m = s.missions.find(x => x.id === d.m);
  if (issue === "victoire") { if (m) m.fait = true; return `Tu maîtrises le bandit.${comp(s, "combat", GAINS.combat)}`; }
  if (issue === "fuite") return "Le bandit court toujours. Tu peux retenter avant l'échéance.";
  blesser(s, 1);
  return "Le bandit t'échappe après t'avoir blessé. Tu peux retenter avant l'échéance.";
});

const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
const AN = 365;

// ---------- Outils pour écrire les conséquences ----------

function trait(s, k, d) { s.traits[k] = Math.max(-10, Math.min(10, (s.traits[k] || 0) + d)); }
function humeur(s, d) { s.humeur = Math.max(-100, Math.min(100, (s.humeur || 0) + d)); }
function stat(s, k) { const g = gagnerStat(s, k, GAINS.entrainement); return g ? ` ${({ force: "Force", agilite: "Agilité", endurance: "Endurance", intelligence: "Intelligence", charisme: "Charisme" })[k]} +${g}.` : ""; }
// Progrès dans une compétence, majoré par le talent « Doué de ses mains » ; renvoie le texte « Nom +n. ».
function comp(s, k, base = 1) { const g = gagnerCompetence(s, k, base); return ` ${({ peche: "Pêche", cuisine: "Cuisine", charpenterie: "Charpenterie", combat: "Combat", navigation: "Navigation", musique: "Musique", medecine: "Médecine" })[k]} +${g}.`; }
function relation(s, id, d, souv) { if (!s.pnj[id]) return; s.pnj[id].relation += d; if (souv) souvenir(s, id, souv); }
function deExterieur(s, n) { s.monde.exterieur -= n; s.berrys += n; }
function versExterieur(s, n) { const m = Math.min(n, s.berrys); s.berrys -= m; s.monde.exterieur += m; return m; }
function planifier(s, id, dansJours, data = {}) { s.planifies.push({ jour: s.jour + dansJours, id, data }); }
const nom = (s, id) => s.pnj[id]?.nom ?? "quelqu'un";
const presentsAdultes = s => pnjIci(s).filter(id => (agePnj(s, id) ?? 30) >= 16 && !s.pnj[id].famille);
const parentsVivants = s => ["mere", "pere"].filter(id => s.pnj[id] && s.pnj[id].vivant !== false);
const surPort = s => s.lieu === ILES[s.ile].port;
const taverne = s => ["bar", "taverne_shells", "salle_baratie", "auberge_logue", "bar_w7", "bar_sabaody", "place_hp", "ville_dr", "village_wano"].includes(s.lieu);
function combat(s, difficulte) { return puissance(s) + rand(s) * 15 >= difficulte; }

export { trait, humeur, stat, comp, relation, deExterieur, versExterieur, planifier, nom, presentsAdultes, parentsVivants, surPort, taverne, combat, pick };

// ---------- Missions variées (toujours binaires, récompense mise de côté à l'acceptation) ----------

function proposerMission(s, donneur, code) {
  const p = s.pnj[donneur];
  const recompense = Math.round((code === "livraison" ? 120 : 200) * (1 + (ILES[s.ile].danger || 0)));
  if (!p || p.fonds < recompense) return null;
  const m = { id: `m${s.jour}_${Math.floor(rand(s) * 1e6)}`, code, donneur, recompense, statut: "proposée", jour: s.jour };
  if (code === "livraison") {
    const dests = Object.keys(ROUTES[s.ile] || {}).filter(i => regionDe(i) === regionDe(s.ile));
    if (!dests.length) return null;
    m.dest = pick(s, dests);
    m.titre = `Livrer un colis ${ILES[m.dest].a}`;
    m.condition = `Arriver ${ILES[m.dest].a} avec le colis.`;
    m.duree = ROUTES[s.ile][m.dest] + 6;
  } else {
    const lieux = lieuxDe(s.ile).filter(l => !l.startsWith("maison"));
    m.lieu = pick(s, lieux);
    if (code === "chasse") { m.titre = `Chasser le bandit qui rôde ${LIEUX[m.lieu].a}`; m.condition = `Vaincre le bandit ${LIEUX[m.lieu].a}.`; m.difficulte = 14 + (ILES[s.ile].danger || 0) * 10; }
    else { m.titre = `Retrouver un enfant perdu ${LIEUX[m.lieu].a}`; m.condition = `Retrouver l'enfant ${LIEUX[m.lieu].a}.`; m.difficulte = 8; }
    m.duree = 5;
  }
  s.missions.push(m);
  return m;
}

// ---------- Bibliothèque ----------

export const EVENEMENTS = [
  // Enfance
  { id: "premier_mot", age: [1, 2], unique: true, texte: "Tes parents se penchent sur ton berceau, guettant ton premier mot.",
    choix: [["« Maman ! »", s => { relation(s, "mere", 5); return "Ta mère fond en larmes de joie."; }],
      ["« Papa ! »", s => { relation(s, "pere", 5); return "Ton père te soulève jusqu'au plafond en riant."; }],
      ["« Viande ! »", s => { trait(s, "ambition", 1); return "Toute la maisonnée éclate de rire. Tu as de l'appétit, toi."; }]] },
  { id: "arbre", age: [4, 10], texte: "Au sommet du grand arbre de la colline, une branche plus haute te nargue.",
    choix: [["Grimper encore plus haut", s => { trait(s, "courage", 1); if (rand(s) < 0.35) { blesser(s, 0); return "La branche craque : tu tombes, couvert de bleus, mais fier."; } return `Tu touches le ciel ! ${stat(s, "agilite")}`; }],
      ["Redescendre prudemment", s => { trait(s, "ruse", 1); return "Tu redescends en repérant chaque prise. La prudence est une force."; }]] },
  { id: "chien", age: [5, 12], iles: ["fuchsia"], texte: "Un chien efflanqué te suit depuis le port, la queue basse.",
    choix: [["L'adopter", s => { trait(s, "bonte", 1); s.drapeaux.chien = s.jour; humeur(s, 10); return "Tu l'appelles Croquette. Il ne te quitte plus."; }],
      ["Le chasser", s => { trait(s, "bonte", -1); return "Le chien s'éloigne. Tu n'y repenses pas… presque pas."; }]] },
  { id: "bagarre_ecole", age: [7, 13], texte: "Des plus grands s'en prennent à un enfant plus petit derrière la remise.",
    choix: [["T'interposer", s => { trait(s, "courage", 1); if (rand(s) < 0.5) blesser(s, 0); relation(s, "sacha", 5, "tu as défendu un enfant plus petit"); return "Tu reçois quelques coups, mais les grands finissent par reculer."; }],
      ["Courir chercher un adulte", s => { trait(s, "bonte", 1); const m = s.pnj.makino && s.pnj.makino.vivant !== false && s.pnj.makino.naissance <= s.jour - 14 * 365; if (m) relation(s, "makino", 3); return `${m ? "Makino" : "Une voisine"} arrive en courant et disperse tout le monde.`; }],
      ["Passer ton chemin", s => { trait(s, "courage", -1); humeur(s, -5); return "Tu détournes les yeux. Ça te reste en travers de la gorge."; }]] },
  { id: "histoires_pirates", age: [6, 12], lieux: ["bar"], texte: "Un vieux marin raconte Grand Line : des îles volantes, des géants, des monstres marins.",
    choix: [["Écouter jusqu'au bout", s => { trait(s, "ambition", 1); return `Tu rêves de mer toute la nuit. ${stat(s, "intelligence")}`; }],
      ["Lui demander si c'est vrai", s => { trait(s, "ruse", 1); return "« Vrai ? Petit, la mer est encore plus folle que ça. »"; }]] },
  { id: "piece_plage", age: [6, 14], texte: "Sur la plage, une pièce brille entre deux coquillages : 10 Berrys.",
    choix: [["La garder", s => { deExterieur(s, 10); trait(s, "ruse", 1); return "Dix Berrys rien qu'à toi."; }],
      ["La porter au maire", s => { trait(s, "bonte", 1); const w = s.pnj.woop?.vivant !== false && s.ile === "fuchsia"; if (w) relation(s, "woop", 5, "tu as rapporté une pièce trouvée"); return `${w ? "Woop Slap" : "Le maire"} te félicite bruyamment devant tout le monde.`; }]] },
  { id: "tempete_enfance", age: [5, 13], texte: "Une tempête frappe la nuit. Les volets claquent.",
    choix: [["Aider à barricader la maison", s => { trait(s, "courage", 1); return `Tu tiens les planches pendant qu'on cloue. ${stat(s, "endurance")}`; }],
      ["Te cacher sous la couverture", s => { humeur(s, -3); return "Tu ne fermes pas l'œil de la nuit."; }]] },
  { id: "dix_ans", age: [10, 10], unique: true, texte: "Pour tes dix ans, tes parents te laissent choisir ton cadeau.",
    choix: [["Un livre sur les mers du monde", s => `Tu le dévores. ${stat(s, "intelligence")}`],
      ["Une épée de bois", s => `Tu t'entraînes contre tous les arbres du village. ${stat(s, "force")}`],
      ["Une longue-vue", s => { trait(s, "ambition", 1); return "Tu passes des heures à guetter l'horizon."; }]] },
  { id: "secret_sacha", age: [8, 14], cond: s => s.pnj.sacha?.vivant !== false, texte: "Sacha te confie un secret : il ou elle veut un jour quitter Fuchsia pour toujours.",
    choix: [["Garder le secret", s => { relation(s, "sacha", 8, "tu as gardé son secret"); return "Sacha te serre la main, solennel."; }],
      ["Le répéter aux autres", s => { trait(s, "ruse", 1); relation(s, "sacha", -12, "tu as trahi son secret"); return "Le secret fait le tour du village. Sacha ne te parle plus pendant des semaines."; }]] },
  { id: "voile_bern", age: [10, 15], lieux: ["port"], texte: "Bern se bat avec une voile déchirée par le vent.",
    choix: [["L'aider", s => { const t = comp(s, "peche"); relation(s, "bern", 4, "tu l'as aidé à recoudre une voile"); return `Vous recousez la voile ensemble.${t}`; }],
      ["Continuer ta route", () => "Bern grommelle dans sa barbe."]] },

  // Adolescence
  { id: "reve", age: [14, 16], unique: true, texte: "Un soir, face à la mer, une question te traverse : qu'est-ce que tu veux faire de ta vie ?",
    choix: [["Devenir Amiral de la Marine", s => { s.ambition = "amiral"; trait(s, "ambition", 2); return "Tu jures de faire régner la justice sur les mers."; }],
      ["Trouver le One Piece", s => { s.ambition = "one_piece"; trait(s, "ambition", 2); return "Le trésor de Gol D. Roger. Rien que ça."; }],
      ["Une vie paisible et une grande famille", s => { s.ambition = "famille"; trait(s, "bonte", 1); return "Le bonheur, c'est peut-être ici, tout simplement."; }],
      ["Devenir riche", s => { s.ambition = "riche"; trait(s, "ruse", 1); return "Un coffre plein de Berrys. Voilà un vrai rêve."; }]] },
  { id: "vol_marche", age: [13, 18], texte: "Une pomme rouge trône sur l'étal, et le marchand regarde ailleurs.",
    choix: [["La chiper", s => { trait(s, "ruse", 1); if (rand(s) < 0.3) { relation(s, "woop", -5, "on t'a pris à voler une pomme"); return "Pris la main dans le sac ! Le maire te sermonne pendant une heure."; } return "Elle est délicieuse. Personne n'a rien vu."; }],
      ["La payer", s => { versExterieur(s, 1); trait(s, "bonte", 1); return "Un Berry bien dépensé."; }]] },
  { id: "course", age: [12, 18], texte: "Des jeunes du village te défient à la course jusqu'au phare de la côte.",
    choix: [["Relever le défi", s => { trait(s, "courage", 1); return `Tu cours à t'en brûler les poumons. ${stat(s, "agilite")}`; }],
      ["Décliner", () => "Ils se moquent un peu, puis passent à autre chose."]] },
  { id: "dispute_parents", age: [13, 17], cond: s => parentsVivants(s).length > 0, texte: "Dispute à la maison : tes parents trouvent que tu rêves trop.",
    choix: [["T'excuser", s => { parentsVivants(s).forEach(id => relation(s, id, 5)); trait(s, "bonte", 1); return "Le calme revient autour de la table."; }],
      ["Claquer la porte", s => { parentsVivants(s).forEach(id => relation(s, id, -5)); trait(s, "courage", 1); return "Tu passes la nuit sur la colline à regarder les étoiles."; }]] },
  { id: "ami_depart", age: [15, 22], cond: s => presentsAdultes(s).length > 0, prep: s => ({ p: pick(s, presentsAdultes(s)) }),
    texte: (s, d) => `${nom(s, d.p)} t'annonce partir en mer demain, peut-être pour toujours.`,
    choix: [["Lui souhaiter bon vent", (s, d) => { relation(s, d.p, 5, "tu lui as dit au revoir"); trait(s, "bonte", 1); return "Vous vous serrez longuement dans les bras."; }],
      ["Lui demander de t'écrire", (s, d) => { relation(s, d.p, 3); planifier(s, "lettre", 120, { p: d.p }); return "« Promis ! » lance-t-il en riant."; }]] },
  { id: "lettre", planifie: true, texte: (s, d) => `Une mouette postale t'apporte une lettre de ${nom(s, d.p)}.`,
    choix: [["La lire tout de suite", (s, d) => { humeur(s, 10); relation(s, d.p, 5); trait(s, "ambition", 1); return "La lettre parle d'îles lointaines et de rencontres folles. Tu la relis dix fois."; }],
      ["La garder pour plus tard", s => { humeur(s, 3); return "Tu la ranges précieusement."; }]] },

  // Argent et travail
  { id: "pari", age: [18, 80], cond: taverne, texte: "À la taverne, un joueur de dés te propose une partie à 50 Berrys.",
    choix: [["Jouer", s => { if (s.berrys < 50) return "Tu n'as même pas 50 Berrys. Il ricane."; if (rand(s) < 0.45) { deExterieur(s, 50); return "Double six ! Tu empoches 50 Berrys."; } versExterieur(s, 50); return "Perdu. Tes 50 Berrys changent de poche."; }],
      ["Refuser", s => { trait(s, "ruse", 1); return "Tu as vu ses dés. Ils ne sont pas nets."; }]] },
  { id: "bourse", age: [12, 90], cond: surPort, texte: "Une bourse tombée d'un marin traîne sur le quai.",
    choix: [["La rapporter", s => { trait(s, "bonte", 1); humeur(s, 5); return "Le marin, ému, te remercie mille fois."; }],
      ["La garder", s => { const n = 20 + Math.floor(rand(s) * 60); deExterieur(s, n); trait(s, "ruse", 1); return `Elle contient ${n} Berrys.`; }]] },
  { id: "arnaque", age: [16, 90], lieux: ["marche_logue", "place", "mangroves", "ville_dr"], texte: "Un vendeur te propose « la vraie carte du One Piece » pour 100 Berrys.",
    choix: [["L'acheter", s => { const m = versExterieur(s, 100); return m ? "Tu rentres déchiffrer ta carte… c'est un plan de la ville, griffonné. Arnaqué." : "Tu n'as pas assez. Tant mieux."; }],
      ["Démasquer l'escroc", s => { trait(s, "ruse", 1); return "Tu le confonds devant la foule. Il détale."; }]] },
  { id: "apprentissage", age: [14, 25], lieux: ["atelier"], unique: true, cond: s => s.pnj.tomas?.vivant !== false, texte: "Tomas t'observe : « Tu as de bonnes mains. Tu veux devenir mon apprenti ? »",
    choix: [["Accepter", s => { s.drapeaux.apprenti = s.jour; const t = comp(s, "charpenterie"); relation(s, "tomas", 10, "tu es devenu son apprenti"); return `Tomas te tend un rabot.${t}`; }],
      ["Refuser poliment", () => "« Comme tu voudras. La porte reste ouverte. »"]] },
  { id: "pret", age: [18, 90], cond: s => s.berrys >= 100 && presentsAdultes(s).some(id => s.pnj[id].relation >= 20), prep: s => ({ p: pick(s, presentsAdultes(s).filter(id => s.pnj[id].relation >= 20)) }),
    texte: (s, d) => `${nom(s, d.p)} est dans la gêne et te demande de lui prêter 100 Berrys.`,
    choix: [["Prêter 100 Berrys", (s, d) => { transferer(s, "joueur", d.p, 100); relation(s, d.p, 8, "tu lui as prêté 100 Berrys"); planifier(s, "remboursement", 60, { p: d.p }); trait(s, "bonte", 1); return "Il te promet de te rembourser dans deux mois."; }],
      ["Refuser", (s, d) => { relation(s, d.p, -4); return "Il baisse les yeux et s'en va."; }]] },
  { id: "remboursement", planifie: true, cond: (s, d) => !!s.pnj[d.p] && s.pnj[d.p].vivant !== false, texte: (s, d) => `${nom(s, d.p)} revient au sujet des 100 Berrys que tu lui as prêtés.`,
    choix: [["L'écouter", (s, d) => { if (s.pnj[d.p].fonds >= 100) { transferer(s, d.p, "joueur", 100); relation(s, d.p, 5); return "Il te rend tes 100 Berrys, avec un grand sourire."; } return "Il n'a pas l'argent. Il te supplie d'attendre."; }],
      ["Lui faire cadeau de la dette", (s, d) => { trait(s, "bonte", 2); relation(s, d.p, 15, "tu lui as fait cadeau de sa dette"); return "Il en a les larmes aux yeux."; }]] },
  { id: "mission_livraison", age: [15, 75], poids: 3, cond: s => presentsAdultes(s).some(id => s.pnj[id].fonds >= 150), prep: s => ({ p: pick(s, presentsAdultes(s).filter(id => s.pnj[id].fonds >= 150)) }),
    texte: (s, d) => `${nom(s, d.p)} cherche quelqu'un de confiance pour livrer un colis sur une autre île.`,
    choix: [["Écouter la proposition", (s, d) => { const m = proposerMission(s, d.p, "livraison"); return m ? `${m.titre}, contre ${m.recompense} Berrys. Tu peux accepter ou refuser ci-dessous.` : "Finalement, il n'a pas de quoi payer."; }],
      ["Pas le temps", () => "Il ira voir quelqu'un d'autre."]] },
  { id: "mission_chasse", age: [16, 70], poids: 3, cond: s => presentsAdultes(s).some(id => s.pnj[id].fonds >= 200), prep: s => ({ p: pick(s, presentsAdultes(s).filter(id => s.pnj[id].fonds >= 200)) }),
    texte: (s, d) => `${nom(s, d.p)} est inquiet : un bandit rôde dans les environs.`,
    choix: [["Proposer ton aide", (s, d) => { const m = proposerMission(s, d.p, "chasse"); return m ? `${m.titre}, contre ${m.recompense} Berrys. Tu peux accepter ou refuser ci-dessous.` : "Il n'a pas les moyens de payer."; }],
      ["Ne pas t'en mêler", () => "Chacun ses problèmes."]] },
  { id: "mission_sauvetage", age: [14, 80], poids: 2, cond: s => presentsAdultes(s).some(id => s.pnj[id].fonds >= 200), prep: s => ({ p: pick(s, presentsAdultes(s).filter(id => s.pnj[id].fonds >= 200)) }),
    texte: (s, d) => `${nom(s, d.p)} accourt, affolé : un enfant a disparu.`,
    choix: [["Proposer de le chercher", (s, d) => { const m = proposerMission(s, d.p, "sauvetage"); return m ? `${m.titre}. Tu peux accepter ou refuser ci-dessous.` : "Quelqu'un d'autre s'en charge."; }],
      ["Laisser faire les autres", s => { humeur(s, -3); return "Tu espères qu'on le retrouvera."; }]] },

  // Mer et voyages
  { id: "naufrage_vu", age: [15, 80], cond: surPort, texte: "Au large, un petit bateau chavire. Des cris montent de l'eau.",
    choix: [["Plonger à leur secours", s => { if (s.fruit) return "Tu t'élances… et t'arrêtes au bord. Ton fruit t'interdit la mer. D'autres plongent à ta place."; trait(s, "courage", 2); if (rand(s) < 0.3) blesser(s, 0); nouvelle(s, s.ile, `${s.perso.prenom} a sauvé des naufragés au péril de sa vie.`, "region"); return `Tu ramènes deux marins sur le quai. ${stat(s, "endurance")}`; }],
      ["Alerter le port", s => { trait(s, "bonte", 1); return "Les barques partent à temps."; }]] },
  { id: "bouteille", age: [10, 90], cond: surPort, unique: true, texte: "Une bouteille échouée contient un vieux parchemin.",
    choix: [["Le déchiffrer", s => { s.drapeaux.carte = s.jour; trait(s, "ambition", 1); return "Une carte ! Une croix au cœur d'une jungle de Grand Line. Little Garden ?"; }],
      ["La relancer à la mer", () => "Qu'elle trouve quelqu'un d'autre."]] },
  { id: "tresor_carte", lieux: ["jungle"], cond: s => s.drapeaux.carte && !s.drapeaux.tresor, texte: "Tu reconnais le rocher dessiné sur ta vieille carte !",
    choix: [["Creuser", s => { s.drapeaux.tresor = s.jour; const n = 2000; deExterieur(s, n); humeur(s, 20); return `Un coffre rongé par le sel… ${n} Berrys !`; }],
      ["Te méfier d'un piège", s => { trait(s, "ruse", 1); return "Tu tournes autour… et repars. Tu reviendras."; }]] },
  { id: "news_coo", age: [12, 99], texte: "Une mouette postale te tend le journal du jour.",
    choix: [["Le lire", s => { const r = s.monde.rivaux.filter(r => r.actif).sort((a, b) => b.prime - a.prime)[0]; return `À la une : ${r ? `le capitaine ${r.capitaine} des ${r.nom}, prime de ${r.prime.toLocaleString("fr-FR")} Berrys.` : "rien de bien neuf."} ${stat(s, "intelligence")}`; }],
      ["La chasser", () => "La mouette repart, vexée."]] },
  { id: "roi_des_mers", age: [12, 99], cond: s => ILES[s.ile].grandLine && surPort(s), texte: "Une ombre gigantesque glisse sous la surface : un roi des mers.",
    choix: [["L'observer", s => { trait(s, "courage", 1); return "Il passe, indifférent. Tu en tremblerais presque."; }],
      ["Reculer loin du quai", () => "Sage décision."]] },

  // Danger
  { id: "agression", age: [16, 80], cond: s => !taverne(s) && s.ile !== "fuchsia", texte: "Dans une ruelle, deux brutes te barrent la route : « Ta bourse. »",
    choix: [["Te battre", s => { if (combat(s, 14 + (ILES[s.ile].danger || 0) * 8)) { return `Tu les envoies au tapis.${comp(s, "combat", GAINS.combat)}`; } blesser(s, 1); return "Ils sont plus forts. Tu repars blessé, mais ta bourse est sauve."; }],
      ["Donner 20 Berrys", s => { versExterieur(s, 20); trait(s, "courage", -1); return "Ils empochent l'argent et disparaissent."; }],
      ["T'enfuir", s => { if (s.stats.agilite + rand(s) * 10 > 10) return "Tu sèmes tes agresseurs dans les ruelles."; blesser(s, 0); return "Ils te rattrapent au coin de la rue."; }]] },
  { id: "voyou_vengeance", planifie: true, texte: "Le voyou que tu avais humilié est revenu, avec des amis.",
    choix: [["Faire face", s => { if (combat(s, 22)) { trait(s, "courage", 1); return "Tu les mets en déroute. On ne t'embêtera plus."; } blesser(s, 2); return "Le combat tourne mal. Tu t'effondres."; }],
      ["Négocier", s => { trait(s, "ruse", 1); versExterieur(s, 50); return "Quelques Berrys et des excuses : l'affaire est close."; }]] },
  { id: "chasseur_primes", age: [16, 99], poids: 2, cond: s => s.prime > 0, texte: "Un chasseur de primes t'a reconnu : « Ta tête vaut cher. »",
    choix: [["Le combattre", s => { if (combat(s, 20 + (ILES[s.ile].danger || 0) * 8)) { return `Tu le désarmes et l'envoies à la mer.${comp(s, "combat", GAINS.combat)}`; } blesser(s, 2); const perte = versExterieur(s, Math.floor(s.berrys * 0.2)); return `Il te roue de coups et te dépouille de ${perte} Berrys avant que tu ne t'échappes.`; }],
      ["Fuir", s => { if (s.stats.agilite + rand(s) * 15 > 14) return "Tu te fonds dans la foule."; blesser(s, 1); return "Il te blesse avant que tu ne t'échappes."; }]] },
  { id: "controle_marine", age: [16, 99], cond: s => surPort(s) && s.prime === 0 && s.ile !== "wano", texte: "Une patrouille de la Marine contrôle les voyageurs du port.",
    choix: [["Coopérer", s => { s.reputation.marine = (s.reputation.marine || 0) + 2; return "Rien à signaler. On te salue."; }],
      ["Lâcher une insolence", s => { trait(s, "courage", 1); s.reputation.marine = (s.reputation.marine || 0) - 5; return "Le sergent te fusille du regard. Il s'en souviendra."; }]] },

  // Amour et famille
  { id: "rendez_vous", age: [18, 50], cond: s => !s.famille.partenaire && pnjIci(s).some(id => s.pnj[id].romance && agePnj(s, id) >= 18), prep: s => ({ p: pick(s, pnjIci(s).filter(id => s.pnj[id].romance && agePnj(s, id) >= 18)) }),
    texte: (s, d) => `${nom(s, d.p)} te propose de dîner ensemble ce soir.`,
    choix: [["Accepter avec joie", (s, d) => { relation(s, d.p, 8, "vous avez dîné ensemble"); humeur(s, 8); return "Une soirée pleine de rires. Vous parlez jusqu'à minuit."; }],
      ["Décliner gentiment", (s, d) => { relation(s, d.p, -2); return "« Une autre fois, alors. »"; }]] },
  { id: "anniversaire_mariage", cond: s => s.famille.statut === "marié" && s.famille.partenaire, prep: s => ({ p: s.famille.partenaire }),
    texte: (s, d) => `C'est l'anniversaire de ton mariage avec ${nom(s, d.p)}.`,
    choix: [["Offrir un cadeau (50 B)", (s, d) => { if (s.berrys < 50) return "Tu n'as pas de quoi. Un baiser fera l'affaire."; transferer(s, "joueur", d.p, 50); relation(s, d.p, 10, "tu as fêté votre anniversaire"); humeur(s, 8); return "Ses yeux brillent."; }],
      ["Oublier…", (s, d) => { relation(s, d.p, -10, "tu as oublié votre anniversaire"); return "La soirée est glaciale."; }]] },
  { id: "enfant_malade", cond: s => s.famille.enfants.some(e => (s.jour - e.naissance) / AN < 12), texte: "Ton enfant est pris d'une forte fièvre.",
    choix: [["Payer un médecin (100 B)", s => { if (versExterieur(s, 100) < 100) return "Tu n'as pas assez. Tu veilles toute la nuit. Au matin, la fièvre tombe."; return "Le médecin le soigne. Au matin, il sourit."; }],
      ["Rester à son chevet", s => { trait(s, "bonte", 1); humeur(s, -5); return "Trois nuits blanches. La fièvre tombe enfin."; }]] },
  { id: "dispute_couple", cond: s => s.famille.partenaire && pnjIci(s).includes(s.famille.partenaire), prep: s => ({ p: s.famille.partenaire }),
    texte: (s, d) => `${nom(s, d.p)} te reproche d'être trop souvent absent.`,
    choix: [["T'excuser et promettre", (s, d) => { relation(s, d.p, 5); trait(s, "bonte", 1); return "Vous vous réconciliez."; }],
      ["Te défendre", (s, d) => { relation(s, d.p, -6); trait(s, "courage", 1); return "La porte claque. Il faudra du temps."; }]] },
  { id: "parents_ages", cond: s => parentsVivants(s).some(id => agePnj(s, id) >= 65) && age(s) >= 20, texte: "Tes parents vieillissent. Leur dernière lettre parle de toi, avec tendresse.",
    choix: [["Leur rendre visite bientôt", s => { parentsVivants(s).forEach(id => relation(s, id, 8, "tu es venu les voir")); humeur(s, 5); return "Tu te promets de rentrer à Fuchsia."; }],
      ["Remettre à plus tard", s => { humeur(s, -3); return "Il sera toujours temps… n'est-ce pas ?"; }]] },

  // Chronologie du canon : scène proposée seulement si le joueur est présent à la date.
  { id: "roi_de_la_cote", planifie: true, texte: "Un cri sur le port : un petit garçon du village est tombé à l'eau, et l'ombre énorme du Seigneur de la Côte fond sur lui !",
    choix: [["Plonger à son secours", s => {
        if (s.fruit) { nouvelle(s, "fuchsia", "Shanks le Roux a sauvé un enfant du Seigneur de la Côte, au prix de son bras gauche.", "region"); return "Ton fruit t'interdit la mer. Impuissant, tu vois un pirate aux cheveux roux plonger à ta place… et perdre un bras."; }
        if (puissance(s) + rand(s) * 15 >= 30) {
          s.chrono.divergences.bras_shanks = s.jour; trait(s, "courage", 2);
          relation(s, "luffy", 30, "tu lui as sauvé la vie face au Seigneur de la Côte"); relation(s, "shanks", 25, "tu as sauvé le petit Luffy avant lui");
          nouvelle(s, "fuchsia", `${s.perso.prenom} a repoussé le Seigneur de la Côte et sauvé le petit Luffy. Shanks le Roux a gardé ses deux bras.`, "monde");
          return "Tu frappes le monstre de toutes tes forces : il recule et disparaît sous les vagues. Le garçon, Luffy, s'accroche à ton cou en pleurant. Shanks arrive à la nage… et te regarde, stupéfait. L'histoire vient de changer.";
        }
        blesser(s, 2);
        nouvelle(s, "fuchsia", "Shanks le Roux a sauvé un enfant du Seigneur de la Côte, au prix de son bras gauche.", "region");
        return "Le monstre te balaie d'un coup de nageoire. Un pirate aux cheveux roux te dépasse, attrape l'enfant… et perd un bras dans la gueule du monstre.";
      }],
      ["Rester sur le quai", s => { nouvelle(s, "fuchsia", "Shanks le Roux a sauvé un enfant du Seigneur de la Côte, au prix de son bras gauche.", "region"); return "Un pirate aux cheveux roux plonge, sauve l'enfant… et revient sans son bras gauche."; }]] },

  // Vieillesse
  { id: "memoires", age: [60, 120], texte: "Les souvenirs remontent. Ta vie mériterait d'être racontée.",
    choix: [["Écrire tes mémoires", s => `Les pages se remplissent. ${stat(s, "intelligence")}`],
      ["Les raconter au bar", s => { relation(s, pick(s, pnjIci(s).length ? pnjIci(s) : ["makino"]), 5); return `On t'écoute jusqu'à la fermeture. ${stat(s, "charisme")}`; }]] },
  { id: "disciple", age: [55, 120], cond: s => presentsAdultes(s).length > 0, prep: s => ({ p: pick(s, presentsAdultes(s)) }),
    texte: (s, d) => `${nom(s, d.p)} te demande de lui transmettre ce que tu sais.`,
    choix: [["L'accepter comme disciple", (s, d) => { relation(s, d.p, 15, "tu l'as pris comme disciple"); trait(s, "bonte", 1); humeur(s, 8); return "Tu retrouves une énergie que tu croyais perdue."; }],
      ["Refuser", () => "Tu as assez donné."]] },
];

EVENEMENTS.push(...EVENEMENTS_FACTIONS, ...EVENEMENTS_2, ...EVENEMENTS_PIRATE, ...EVENEMENTS_3, ...EVENEMENTS_REVOLUTION, ...EVENEMENTS_CHASSEUR, ...EVENEMENTS_GOUVERNEMENT);

// ---------- Déclenchement ----------

const PAR_ID = Object.fromEntries(EVENEMENTS.map(e => [e.id, e]));
const REPETABLES = new Set(["mission_livraison", "mission_chasse", "mission_sauvetage", "pari", "news_coo", "bourse", "agression", "chasseur_primes",
  "controle_marine", "rendez_vous", "anniversaire_mariage", "dette_jeu", "voleur_poche", "brouillard", "equipage_dispute", "pirate_fete", "tempete_mer"]);

function eligible(s, e) {
  if (e.planifie) return false;
  const a = age(s);
  if (e.age && (a < e.age[0] || a > e.age[1])) return false;
  if (e.iles && !e.iles.includes(s.ile)) return false;
  if (e.lieux && !e.lieux.includes(s.lieu)) return false;
  // Un événement ordinaire revient au plus deux fois par vie, et pas avant deux ans ;
  // les situations du quotidien (missions, paris, journaux…) peuvent revenir plus souvent.
  const h = s.histo.evenements[e.id];
  const n = s.histo.compte?.[e.id] || 0;
  const rep = REPETABLES.has(e.id);
  if (h != null && (e.unique || s.jour - h < (rep ? 120 : 730))) return false;
  if (n >= (rep ? 40 : 2)) return false;
  if (s.prison) return false;
  return !e.cond || !!e.cond(s, {});
}

export function initialiserEvenements(s) {
  s.histo ??= { evenements: {} };
  s.planifies ??= [];
  s.drapeaux ??= {};
  s.traits ??= { courage: 0, ruse: 0, bonte: 0, ambition: 0 };
  s.humeur ??= 0;
  s.reputation ??= {};
  s.ambition ??= null;
  s.evenement ??= null;
}

// Appelé chaque jour simulé. Retourne vrai si un événement attend une décision.
export function declencherEvenement(s) {
  if (s.evenement) {
    if (s.jour - s.evenement.jour > 2) { noter(s, "Tu laisses passer l'occasion.", "ellipse"); s.evenement = null; }
    return false;
  }
  if (!s.perso.vivant) return false;
  // En prison, les rendez-vous planifiés attendent ta sortie.
  const i = s.prison ? -1 : s.planifies.findIndex(p => p.jour <= s.jour);
  if (i >= 0) {
    const p = s.planifies.splice(i, 1)[0];
    const e = PAR_ID[p.id];
    if (e && (!e.cond || e.cond(s, p.data))) return ouvrir(s, e, p.data);
  }
  if (rand(s) >= (s.talents?.includes("lignee_d") ? 0.15 : 0.1)) return false;
  const choix = EVENEMENTS.filter(e => eligible(s, e));
  if (!choix.length) return false;
  const total = choix.reduce((t, e) => t + (e.poids || 1), 0);
  let x = rand(s) * total;
  const e = choix.find(c => (x -= c.poids || 1) < 0) || choix[0];
  return ouvrir(s, e, e.prep ? e.prep(s) : {});
}

function ouvrir(s, e, data) {
  s.evenement = { id: e.id, jour: s.jour, data };
  noter(s, typeof e.texte === "function" ? e.texte(s, data) : e.texte, "evenement");
  return true;
}

export function choixEvenement(s) {
  if (!s.evenement) return [];
  const e = PAR_ID[s.evenement.id];
  return e ? e.choix.map(([label], i) => ({ id: "choisir", cible: i, label })) : [];
}

export function choisir(s, i) {
  const ev = s.evenement;
  const e = ev && PAR_ID[ev.id];
  if (!e || !e.choix[i]) return { ok: false, texte: "Il n'y a pas de décision à prendre." };
  s.evenement = null;
  // La personne concernée a pu mourir ou être remplacée entre-temps : l'occasion est passée.
  if (ev.data?.p && (!s.pnj[ev.data.p] || s.pnj[ev.data.p].vivant === false)) return { ok: true, texte: "L'occasion est passée." };
  s.histo.evenements[e.id] = s.jour;
  s.histo.compte ??= {};
  s.histo.compte[e.id] = (s.histo.compte[e.id] || 0) + 1;
  const texte = e.choix[i][1](s, ev.data) || "";
  return { ok: true, texte };
}

// Missions de chasse et de sauvetage : l'action se fait sur le lieu prévu, réussite ou échec.
export function accomplir(s) {
  const m = s.missions.find(m => m.statut === "active" && m.lieu === s.lieu && !m.fait);
  if (!m) return { ok: false, texte: "Il n'y a rien à accomplir ici." };
  if (m.code === "chasse") {
    return engagerCombat(s, { type: "chasse", nom: "le bandit", force: m.difficulte, intro: "Tu débusques le bandit dans sa cachette.", data: { m: m.id } });
  }
  if (s.stats.intelligence + s.stats.agilite + rand(s) * 10 >= m.difficulte) { m.fait = true; return { ok: true, texte: "Tu retrouves l'enfant, transi mais sain et sauf." }; }
  return { ok: true, texte: "Tu cherches pendant des heures, sans succès. Il faudra recommencer." };
}

// Ambitions : un rêve accompli est célébré une fois.
export function verifierAmbition(s) {
  if (!s.ambition || s.drapeaux.ambitionAtteinte) return;
  const ok = { amiral: s.carriere?.type === "marine" && s.carriere.rang >= 11, one_piece: !!s.drapeaux.onePiece,
    famille: s.famille.enfants.length >= 3, riche: s.berrys >= 100000 }[s.ambition];
  if (!ok) return;
  s.drapeaux.ambitionAtteinte = s.jour;
  humeur(s, 40);
  const textes = { amiral: "Tu portes enfin le manteau d'Amiral dont tu rêvais enfant.", one_piece: "Tu l'as trouvé. Le rêve de toute une vie, et de tant d'autres avant toi.",
    famille: "Ta maison résonne des rires de tes enfants. Ton rêve s'est réalisé.", riche: "Cent mille Berrys. Le petit rêveur de Fuchsia est devenu riche." };
  noter(s, `Rêve accompli ! ${textes[s.ambition]}`, "mission");
}
