// Bibliothèque d'événements, troisième volume : îles, saisons, métiers, peuples, vie à terre et grandes mers.
// Mêmes règles : gains fixes, argent toujours pris à quelqu'un ou à l'extérieur, pas de réussite partielle.

import { rand, age, agePnj, pnjIci, blesser, transferer, notoriete, GAINS, ILES } from "./engine.js";
import { nouvelle, regionDe } from "./monde.js";
import { trait, humeur, stat, comp, relation, deExterieur, versExterieur, planifier, nom, presentsAdultes, parentsVivants, surPort, taverne, combat, pick } from "./evenements.js";

const ile = (...l) => s => l.includes(s.ile);
const lieu = (...l) => s => l.includes(s.lieu);
const car = t => s => s.carriere?.type === t;
const saison = s => Math.floor((s.jour % 365) / 91.25); // 0 printemps … 3 hiver
const marie = s => s.famille.statut === "marié" && s.famille.partenaire;
const ev = (id, a, texte, choix, extra = {}) => ({ id, age: a, texte, choix, ...extra });
const ami = s => ({ p: pick(s, presentsAdultes(s)) });
const aAmi = s => presentsAdultes(s).length > 0;

export const EVENEMENTS_3 = [
  // ---------- Saisons et fêtes ----------
  ev("fete_printemps", [5, 99], "Le village fête le retour du printemps : lampions, tambours et brochettes.", [
    ["Danser toute la nuit", s => { humeur(s, 12); return `Tes jambes ne te portent plus, mais quel bonheur ! ${stat(s, "endurance")}`; }],
    ["Aider à tenir un stand", s => { trait(s, "bonte", 1); deExterieur(s, 10); return "On te glisse 10 Berrys pour ta peine."; }]], { cond: s => saison(s) === 0 }),
  ev("canicule", [6, 99], "L'été écrase l'île. Même les mouettes restent à l'ombre.", [
    ["Te baigner", s => { if (s.fruit) { humeur(s, -3); return "Tu regardes les autres se baigner. La mer n'est plus pour toi."; } humeur(s, 8); return "L'eau est délicieuse."; }],
    ["Faire la sieste", s => { s.fatigue = Math.max(0, s.fatigue - 20); return "Tu te réveilles frais et dispos."; }]], { cond: s => saison(s) === 1 }),
  ev("recolte", [8, 99], "C'est le temps des récoltes, et on manque de bras dans les champs.", [
    ["Donner un coup de main", s => { deExterieur(s, 15); return `Une rude journée, 15 Berrys. ${stat(s, "force")}`; }],
    ["Passer ton chemin", () => "D'autres s'en chargeront."]], { cond: s => saison(s) === 2 && regionDe(s.ile) === "eb" }),
  ev("neige", [4, 99], "Il neige ! Les toits sont blancs et le port fume.", [
    ["Bataille de boules de neige", s => { humeur(s, 10); return `Tu vises juste. ${stat(s, "agilite")}`; }],
    ["Rester au chaud avec un livre", s => `Le feu crépite. ${stat(s, "intelligence")}`]], { cond: s => saison(s) === 3 }),
  ev("nouvel_an", [3, 99], "C'est le dernier soir de l'année. Tout le monde fait un vœu.", [
    ["Souhaiter l'aventure", s => { trait(s, "ambition", 1); return "Que l'année t'emmène loin."; }],
    ["Souhaiter la santé des tiens", s => { trait(s, "bonte", 1); humeur(s, 5); return "Tu lèves ton verre à ceux que tu aimes."; }]], { cond: s => s.jour % 365 > 355 }),
  ev("eclipse", [6, 99], "En plein midi, le ciel s'obscurcit : une éclipse.", [
    ["L'observer", s => `Un anneau de feu dans le ciel. Tu n'oublieras jamais. ${stat(s, "intelligence")}`],
    ["Y voir un présage", s => { trait(s, "courage", -1); humeur(s, -3); return "Tu passes la journée sur tes gardes."; }]], { unique: true }),

  // ---------- Enfance ----------
  ev("dent_de_lait", [5, 8], "Ta première dent de lait est tombée.", [
    ["La cacher sous l'oreiller", s => { deExterieur(s, 2); return "Au matin, 2 Berrys l'ont remplacée."; }],
    ["La garder comme trésor", s => { trait(s, "ambition", 1); return "Ton premier trésor de pirate."; }]], { unique: true }),
  ev("cabane", [6, 12], "Avec deux planches et un vieux drap, tu pourrais construire une cabane.", [
    ["La bâtir toi-même", s => `Elle penche, mais elle tient.${comp(s, "charpenterie")}`],
    ["Enrôler les copains", s => { humeur(s, 6); return `Tu diriges le chantier. ${stat(s, "charisme")}`; }]]),
  ev("oiseau_blesse", [5, 13], "Un petit goéland à l'aile cassée s'est réfugié sous le ponton.", [
    ["Le soigner", s => { trait(s, "bonte", 1); return `Après deux semaines, il s'envole.${comp(s, "medecine")}`; }],
    ["Le laisser faire la nature", s => { trait(s, "bonte", -1); return "Tu passes ton chemin."; }]]),
  ev("gros_mot", [4, 9], "Tu as répété devant tout le monde un mot entendu chez les marins.", [
    ["T'excuser", s => { parentsVivants(s).forEach(id => relation(s, id, 2)); return "On te pardonne en retenant un sourire."; }],
    ["Le redire plus fort", s => { trait(s, "courage", 1); parentsVivants(s).forEach(id => relation(s, id, -2)); return "Au coin jusqu'au dîner."; }]]),
  ev("carte_enfant", [7, 13], "Tu dessines la carte de ton île, avec ses cachettes secrètes.", [
    ["La garder pour toi", s => `Une vraie carte au trésor.${comp(s, "navigation")}`],
    ["La montrer à tous", s => { humeur(s, 4); return `Les autres veulent tous la leur. ${stat(s, "charisme")}`; }]]),
  ev("peur_du_noir", [3, 8], "La nuit, des ombres dansent sur le mur de ta chambre.", [
    ["Aller voir ce que c'est", s => { trait(s, "courage", 1); return "Ce n'était que le linge qui sèche."; }],
    ["Appeler", s => { humeur(s, 3); return "On vient te rassurer."; }]]),
  ev("gouter_vole", [6, 12], "Une tarte refroidit sur le rebord d'une fenêtre.", [
    ["En chiper une part", s => { trait(s, "ruse", 1); return "La meilleure tarte de ta vie."; }],
    ["Résister", s => { trait(s, "bonte", 1); return "La pâtissière t'en offre une part en te voyant saliver."; }]]),
  ev("vieux_sage", [7, 14], "Un vieux marin édenté te propose de t'apprendre les nœuds.", [
    ["Apprendre", s => `Nœud de chaise, de cabestan, de pêcheur…${comp(s, "navigation")}`],
    ["Filer jouer", () => "Les nœuds attendront."]]),
  ev("concours_peche_enfants", [8, 14], "Concours de pêche des enfants sur le quai !", [
    ["Participer", s => { const t = comp(s, "peche"); return rand(s) < 0.4 ? `Tu gagnes le concours !${t}` : `Un tout petit poisson, mais tu es fier.${t}`; }],
    ["Encourager les autres", s => { trait(s, "bonte", 1); return "Tu cries plus fort que tout le monde."; }]], { cond: s => surPort(s) }),
  ev("promesse", [8, 14], "Un ami te fait jurer de vous retrouver ici dans dix ans, quoi qu'il arrive.", [
    ["Jurer", s => { planifier(s, "retrouvailles", 3650); trait(s, "bonte", 1); return "Vous crachez dans vos mains et les serrez."; }],
    ["Dire que c'est idiot", s => { trait(s, "ruse", 1); return "Il boude un moment."; }]], { unique: true }),
  { id: "retrouvailles", planifie: true, texte: "Dix ans ont passé depuis la promesse faite à ton ami d'enfance.",
    choix: [["Aller au rendez-vous", s => { humeur(s, 15); return "Il est là, avec dix ans de plus et le même sourire. Vous parlez jusqu'à l'aube."; }],
      ["Laisser tomber", s => { humeur(s, -8); return "Tu imagines sa silhouette qui attend, puis s'en va."; }]] },

  // ---------- Adolescence et jeunesse ----------
  ev("premier_verre", [15, 19], "On te tend ta première chope au comptoir.", [
    ["Boire cul sec", s => { humeur(s, 5); s.fatigue = Math.min(100, s.fatigue + 15); return "La salle tourne. Tout le monde rit."; }],
    ["Refuser", s => { trait(s, "ruse", 1); return "Du jus de pomme fera l'affaire."; }]], { cond: s => taverne(s), unique: true }),
  ev("bras_de_fer", [14, 60], "Un costaud défie la salle au bras de fer : 20 Berrys la partie.", [
    ["Relever le défi", s => { if (s.berrys < 20) return "Tu n'as pas la mise."; if (s.stats.force + rand(s) * 10 >= 14) { deExterieur(s, 20); return "Sa main touche la table ! +20 Berrys."; } versExterieur(s, 20); return "Ton bras cède. -20 Berrys."; }],
    ["Regarder", () => "Il bat tout le monde."]], { cond: s => taverne(s) }),
  ev("lettre_amour", [14, 20], "Une lettre parfumée, sans signature, t'attend sur le pas de la porte.", [
    ["Chercher qui l'a écrite", s => { humeur(s, 8); trait(s, "ruse", 1); return "Tu mènes l'enquête toute la semaine, le cœur léger."; }],
    ["La ranger en rougissant", s => { humeur(s, 5); return "Tu la relis chaque soir."; }]], { unique: true }),
  ev("tatouage", [16, 40], "Un tatoueur de passage propose ses services.", [
    ["Te faire tatouer (30 B)", s => { if (versExterieur(s, 30) < 30) return "Pas assez d'argent."; s.drapeaux.tatouage = s.jour; trait(s, "courage", 1); return "Ça pique, mais le résultat a de l'allure."; }],
    ["Non merci", () => "Ta peau restera vierge."]], { unique: true }),
  ev("choix_metier", [15, 18], "Tout le monde te demande ce que tu feras plus tard.", [
    ["« Quelque chose de mes mains »", s => { trait(s, "bonte", 1); return `On t'encourage.${comp(s, "charpenterie")}`; }],
    ["« Voir le monde »", s => { trait(s, "ambition", 1); return "Les anciens hochent la tête."; }],
    ["« Je verrai bien »", s => { humeur(s, 3); return "Chaque chose en son temps."; }]], { unique: true }),
  ev("vol_bateau", [14, 18], "Des amis proposent d'« emprunter » une barque pour la nuit.", [
    ["Y aller", s => { trait(s, "courage", 1); if (rand(s) < 0.3) { relation(s, "bern", -5, "tu as emprunté une barque sans permission"); return "Vous vous échouez sur un banc de sable. Le pêcheur est furieux."; } return `Une nuit sous les étoiles, à ramer.${comp(s, "navigation")}`; }],
    ["Refuser", s => { trait(s, "ruse", 1); return "Ils se font prendre. Pas toi."; }]], { cond: s => surPort(s) }),
  ev("entrainement_secret", [12, 20], "Tu découvres une clairière parfaite pour t'entraîner en secret.", [
    ["T'y entraîner chaque matin", s => `Personne ne te voit suer. ${stat(s, "force")}`],
    ["En faire ton coin de lecture", s => `Le calme est total. ${stat(s, "intelligence")}`]]),
  ev("honte_publique", [13, 25], "Tu trébuches et renverses un étal entier devant tout le marché.", [
    ["Tout ramasser en t'excusant", s => { trait(s, "bonte", 1); return "Le marchand finit par rire avec toi."; }],
    ["T'enfuir", s => { humeur(s, -5); return "Tu évites le marché pendant un mois."; }]]),

  // ---------- Vie à terre, métiers et argent ----------
  ev("client_difficile", [16, 80], "Un client hurle que ton travail ne vaut rien.", [
    ["Garder ton calme", s => { trait(s, "bonte", 1); return "Il finit par payer en maugréant."; }],
    ["Lui répondre sur le même ton", s => { trait(s, "courage", 1); return "Il claque la porte. Bon débarras."; }]], { cond: s => Object.keys(s.metiers || {}).length > 0 }),
  ev("offre_concurrent", [18, 70], "Un concurrent te propose 200 Berrys pour quitter ton employeur.", [
    ["Accepter", s => { deExterieur(s, 200); trait(s, "ruse", 1); for (const k of Object.keys(s.metiers)) s.metiers[k] = 0; return "Tu empoches. Ton ancien patron ne te salue plus."; }],
    ["Rester fidèle", s => { trait(s, "bonte", 1); return "Ton patron l'apprend et te serre la main."; }]], { cond: s => Object.values(s.metiers || {}).some(n => n >= 30) }),
  ev("incendie_commerce", [18, 99], "On frappe à ta porte en pleine nuit : il y a le feu près de ton commerce !", [
    ["Courir sauver la marchandise", s => { if (rand(s) < 0.6) return "Tu sauves l'essentiel."; blesser(s, 0); return "Tu sauves la caisse, au prix de quelques brûlures."; }],
    ["Laisser faire les pompiers", s => { s.commerce.derniereVisite = s.jour - 31; return "Les dégâts sont lourds : il faudra remettre l'affaire sur pied."; }]], { cond: s => !!s.commerce }),
  ev("bon_client", [18, 99], "Un riche voyageur vide la moitié de ta boutique d'un coup.", [
    ["Le remercier", s => { deExterieur(s, 60); return "Une belle journée : 60 Berrys de plus en caisse."; }],
    ["Lui offrir un cadeau", s => { deExterieur(s, 40); trait(s, "bonte", 1); return "Il promet de revenir avec des amis."; }]], { cond: s => !!s.commerce && s.ile === s.commerce.ile }),
  ev("impots", [18, 99], "Le percepteur passe : 5 % de ce que tu as en poche.", [
    ["Payer", s => { const n = versExterieur(s, Math.floor(s.berrys * 0.05)); return `Tu verses ${n} Berrys.`; }],
    ["Cacher ta bourse", s => { trait(s, "ruse", 1); if (rand(s) < 0.4) { const n = versExterieur(s, Math.floor(s.berrys * 0.1)); return `Il la trouve : amende comprise, ${n} Berrys.`; } return "Il repart bredouille."; }]], { cond: s => s.berrys >= 500 && !s.prime }),
  ev("voisin_bruyant", [18, 99], "Ton voisin répète de la trompette. Très mal. Tous les soirs.", [
    ["Aller lui parler gentiment", s => { trait(s, "bonte", 1); return "Il jouera plus tôt, promis."; }],
    ["Jouer plus fort que lui", s => `La guerre du bruit est déclarée.${comp(s, "musique")}`]], { cond: s => s.lieu === (s.foyer || "maison") }),
  ev("heritage_oncle", [20, 60], "Un notaire t'annonce qu'un oncle lointain t'a laissé quelque chose.", [
    ["Aller voir", s => { const n = 100 + Math.floor(rand(s) * 300); deExterieur(s, n); return `Une malle de vieux vêtements… et ${n} Berrys cousus dans la doublure.`; }],
    ["Refuser la succession", s => { trait(s, "ruse", 1); return "Il avait surtout des dettes, paraît-il."; }]], { unique: true }),
  ev("fuite_toit", [18, 99], "Il pleut dans ta chambre.", [
    ["Réparer toi-même", s => `Trois tuiles et un seau.${comp(s, "charpenterie")}`],
    ["Payer un couvreur (40 B)", s => { versExterieur(s, 40); return "C'est réparé avant la nuit."; }]], { cond: s => s.lieu === (s.foyer || "maison") }),
  ev("marchand_tapis", [16, 99], "Un marchand jure que son tapis vient d'Alabasta.", [
    ["Marchander", s => { trait(s, "ruse", 1); return `Une heure de palabres. ${stat(s, "charisme")}`; }],
    ["Acheter au prix fort (50 B)", s => { versExterieur(s, 50); humeur(s, 3); return "Il est beau, ce tapis."; }]], { cond: lieu("marche_logue", "place", "ville_dr", "mangroves") }),
  ev("apprenti_a_former", [30, 80], "Un gamin motivé te supplie de lui apprendre ton métier.", [
    ["Le prendre sous ton aile", s => { trait(s, "bonte", 1); humeur(s, 6); return "Il apprend vite. Tu te revois à son âge."; }],
    ["Refuser", () => "Tu n'as pas le temps."]], { cond: s => Object.values(s.metiers || {}).some(n => n >= 100) }),
  ev("penurie", [16, 99], "Les navires n'arrivent plus : le village manque de tout.", [
    ["Partager tes réserves", s => { trait(s, "bonte", 2); versExterieur(s, 20); return "On s'en souviendra."; }],
    ["Vendre au prix fort", s => { trait(s, "bonte", -1); deExterieur(s, 40); return "+40 Berrys. Quelques regards noirs."; }]], { cond: s => s.monde.meteo === "tempête" }),

  // ---------- Santé ----------
  ev("mal_de_dents", [10, 99], "Une rage de dents te réveille.", [
    ["Aller chez l'arracheur (15 B)", s => { versExterieur(s, 15); return "Un mauvais moment, puis le soulagement."; }],
    ["Serrer les dents", s => { humeur(s, -6); return "Trois jours de supplice avant que ça passe."; }]]),
  ev("epidemie", [5, 99], "Une mauvaise fièvre court sur l'île.", [
    ["Aider les malades", s => { trait(s, "bonte", 2); const t = comp(s, "medecine"); if (rand(s) < 0.3) { s.fatigue = 100; return `Tu l'attrapes à ton tour, sans gravité.${t}`; } return `Tu soignes sans relâche.${t}`; }],
    ["Rester chez toi", s => { trait(s, "courage", -1); return "Tu attends que ça passe."; }]]),
  ev("insomnie", [16, 99], "Impossible de fermer l'œil cette nuit.", [
    ["Sortir marcher", s => { humeur(s, 3); return "Le port est beau, la nuit."; }],
    ["Ruminer", s => { s.fatigue = Math.min(100, s.fatigue + 20); return "L'aube te trouve épuisé."; }]]),
  ev("remede_grand_mere", [20, 99], "Une vieille femme te confie la recette d'une tisane « qui guérit tout ».", [
    ["La noter", s => `Camomille, écorce, et un ingrédient secret.${comp(s, "medecine")}`],
    ["Sourire poliment", () => "Les remèdes de bonne femme…"]]),

  // ---------- Amour et famille ----------
  ev("demande_inattendue", [20, 45], "Quelqu'un que tu connais à peine te déclare sa flamme.", [
    ["Décliner avec douceur", s => { trait(s, "bonte", 1); return "Il ou elle repart digne."; }],
    ["En rire", s => { trait(s, "bonte", -1); return "Tu le regretteras un peu."; }]], { cond: s => !s.famille.partenaire }),
  ev("belle_famille", [20, 70], "La famille de ton conjoint débarque pour une semaine.", [
    ["Jouer l'hôte parfait", s => { relation(s, s.famille.partenaire, 6); s.fatigue = Math.min(100, s.fatigue + 20); return "Épuisant, mais ton conjoint est ravi."; }],
    ["Disparaître « pour le travail »", s => { relation(s, s.famille.partenaire, -6); return "On te le reprochera."; }]], { cond: marie }),
  ev("voyage_amoureux", [20, 60], "Ton conjoint rêve de voir autre chose que cette île.", [
    ["Promettre un voyage", s => { relation(s, s.famille.partenaire, 5); trait(s, "ambition", 1); return "Ses yeux brillent."; }],
    ["Dire que vous êtes bien ici", s => { relation(s, s.famille.partenaire, -2); return "Un soupir."; }]], { cond: marie }),
  ev("enfant_question", [25, 70], "Ton enfant te demande : « C'est quoi, être courageux ? »", [
    ["« Avoir peur et y aller quand même »", s => { trait(s, "courage", 1); return "Il réfléchit longtemps."; }],
    ["« Protéger ceux qu'on aime »", s => { trait(s, "bonte", 1); return "Il te serre fort."; }]], { cond: s => s.famille.enfants.some(e => (s.jour - e.naissance) / 365 >= 5 && (s.jour - e.naissance) / 365 <= 12) }),
  ev("enfant_talent", [25, 70], "Ton enfant révèle un vrai don.", [
    ["L'encourager", s => { humeur(s, 8); return "Tu lui trouves un maître."; }],
    ["Lui dire de garder les pieds sur terre", s => { trait(s, "ruse", 1); return "Il boude une semaine."; }]], { cond: s => s.famille.enfants.some(e => (s.jour - e.naissance) / 365 >= 8 && (s.jour - e.naissance) / 365 <= 16) }),
  ev("noces", [30, 90], "Dix ans de mariage. Dix ans !", [
    ["Refaire votre demande", s => { relation(s, s.famille.partenaire, 10); humeur(s, 12); return "On pleure, on rit, on danse."; }],
    ["Un simple dîner", s => { relation(s, s.famille.partenaire, 4); return "Parfois, la simplicité suffit."; }]], { cond: marie, unique: true }),
  ev("parent_malade", [16, 60], "L'un de tes parents est alité depuis des jours.", [
    ["Rester à son chevet", s => { parentsVivants(s).forEach(id => relation(s, id, 8, "tu l'as veillé quand il était malade")); trait(s, "bonte", 1); return "Il se rétablit doucement."; }],
    ["Envoyer de l'argent (50 B)", s => { const p = parentsVivants(s)[0]; if (p && s.berrys >= 50) transferer(s, "joueur", p, 50); return "C'est déjà ça."; }]], { cond: s => parentsVivants(s).length > 0 }),
  ev("dispute_heritage", [30, 80], "Un cousin conteste ce que tes parents t'ont laissé.", [
    ["Partager (100 B)", s => { versExterieur(s, Math.min(100, s.berrys)); trait(s, "bonte", 1); return "La paix de la famille vaut bien ça."; }],
    ["Tenir bon", s => { trait(s, "courage", 1); return "Il repart en claquant la porte."; }]], { cond: s => parentsVivants(s).length === 0 && s.berrys >= 300, unique: true }),

  // ---------- Amitié ----------
  ev("confidence", [14, 99], (s, d) => `${nom(s, d.p)} a besoin de parler : quelque chose lui pèse.`, [
    ["L'écouter jusqu'au bout", (s, d) => { relation(s, d.p, 7, "tu l'as écouté quand il allait mal"); trait(s, "bonte", 1); return "Il repart plus léger."; }],
    ["Changer de sujet", (s, d) => { relation(s, d.p, -3); return "Il n'insiste pas."; }]], { cond: aAmi, prep: ami }),
  ev("service_rendu", [14, 99], (s, d) => `${nom(s, d.p)} te demande un coup de main pour déménager.`, [
    ["Y aller", (s, d) => { relation(s, d.p, 6, "tu l'as aidé à déménager"); return `Des meubles, des escaliers… ${stat(s, "force")}`; }],
    ["Avoir « un empêchement »", (s, d) => { relation(s, d.p, -3); return "Il se débrouillera."; }]], { cond: aAmi, prep: ami }),
  ev("rumeur_sur_toi", [14, 99], "On raconte des choses fausses sur toi au village.", [
    ["Retrouver la source", s => { trait(s, "ruse", 1); return "Un jaloux. Tu le confonds publiquement."; }],
    ["Laisser dire", s => { humeur(s, -4); return "Ça finira par passer."; }]]),
  ev("pari_ami", [14, 70], (s, d) => `${nom(s, d.p)} parie que tu ne tiendras pas une journée sans parler.`, [
    ["Relever le pari", (s, d) => { relation(s, d.p, 4); return rand(s) < 0.5 ? "Tu tiens ! Il te doit un repas." : "Tu craques à midi. Fou rire général."; }],
    ["Refuser", () => "Pas ton genre."]], { cond: aAmi, prep: ami }),
  ev("cadeau_ami", [10, 99], (s, d) => `C'est l'anniversaire de ${nom(s, d.p)}.`, [
    ["Offrir un cadeau (15 B)", (s, d) => { if (s.berrys < 15) return "Tu n'as rien à offrir que tes vœux."; transferer(s, "joueur", d.p, 15); relation(s, d.p, 8, "tu as pensé à son anniversaire"); return "Il est touché."; }],
    ["Oublier", (s, d) => { relation(s, d.p, -2); return "Aïe."; }]], { cond: aAmi, prep: ami }),

  // ---------- East Blue ----------
  ev("morgan_statue", [10, 99], "À Shells Town, on érige une nouvelle statue devant la base.", [
    ["Saluer comme tout le monde", s => { s.reputation.marine = (s.reputation.marine || 0) + 1; return "Les marines te regardent passer."; }],
    ["Passer sans saluer", s => { trait(s, "courage", 1); s.reputation.marine = (s.reputation.marine || 0) - 2; return "Un sergent note ton visage."; }]], { cond: ile("shells") }),
  ev("baratie_bagarre", [14, 99], "Au Baratie, un client insulte la cuisine. Les cuisiniers sortent les couteaux.", [
    ["Prendre le parti des cuisiniers", s => { relation(s, "gallo", 6, "tu as défendu sa cuisine"); return "Le client est jeté à la mer. Le chef t'offre le dessert."; }],
    ["Finir ton assiette", () => "Spectacle compris dans l'addition."]], { cond: ile("baratie") }),
  ev("baratie_affame", [14, 99], "Un naufragé affamé se traîne sur le pont du Baratie, sans un sou.", [
    ["Lui payer un repas (20 B)", s => { versExterieur(s, Math.min(20, s.berrys)); trait(s, "bonte", 2); return "Il pleure en mangeant."; }],
    ["Regarder ailleurs", s => { trait(s, "bonte", -1); return "Un cuisinier finit par lui glisser une assiette en cachette."; }]], { cond: ile("baratie") }),
  ev("logue_echafaud", [10, 99], "Sur la place de l'échafaud, un guide raconte l'exécution du Roi des pirates.", [
    ["Écouter", s => { trait(s, "ambition", 1); return "« Mon trésor ? Il existe ! » Tu en as la chair de poule."; }],
    ["Monter sur l'échafaud", s => { trait(s, "courage", 1); s.reputation.marine = (s.reputation.marine || 0) - 1; return "La vue est belle. Un marine te fait redescendre."; }]], { cond: s => s.lieu === "echafaud" && !!s.chrono?.faits?.execution_roger }),
  ev("logue_marchand_armes", [16, 99], "L'armurier te laisse essayer un sabre de bonne facture.", [
    ["Quelques passes", s => `La lame siffle.${comp(s, "combat")}`],
    ["Le reposer", () => "Trop cher pour toi."]], { cond: lieu("armurerie") }),
  ev("fuchsia_bandits", [10, 99], "Des bandits des montagnes descendent boire au bar et font du tapage.", [
    ["Leur demander de se calmer", s => { if (combat(s, 12)) { trait(s, "courage", 1); return "Ils grognent, puis paient et s'en vont."; } blesser(s, 0); return "Tu ramasses une chaise sur la tête."; }],
    ["Ne pas t'en mêler", () => "Ils finissent par repartir."]], { cond: lieu("bar") }),
  ev("pirates_au_port", [8, 99], "Un pavillon noir à l'horizon : des pirates approchent de l'île.", [
    ["Aider à barricader", s => { trait(s, "courage", 1); return "Ils ne font que se ravitailler, mais l'île te remercie."; }],
    ["Te cacher", s => { trait(s, "courage", -1); return "Fausse alerte, ou presque."; }]], { cond: s => regionDe(s.ile) === "eb" && s.monde.rivaux.some(r => r.actif && r.ile === s.ile) && s.carriere?.type !== "pirate" }),

  // ---------- Grand Line ----------
  ev("climat_fou", [12, 99], "En une heure : grêle, canicule, puis neige. Bienvenue sur Grand Line.", [
    ["En rire", s => { humeur(s, 4); return "Il vaut mieux."; }],
    ["Prendre des notes", s => `Les vents de Grand Line ont leur logique.${comp(s, "navigation")}`]], { cond: s => regionDe(s.ile) === "gl" }),
  ev("laboon", [10, 99], "Une baleine grande comme une île se cogne la tête contre Reverse Mountain.", [
    ["Demander son histoire au gardien", s => { trait(s, "bonte", 1); return "Elle attend des compagnons partis il y a des décennies. Tu as la gorge serrée."; }],
    ["Garder tes distances", () => "Prudent."]], { cond: ile("cap"), unique: true }),
  ev("geants_duel", [12, 99], "Le volcan gronde : les deux géants reprennent leur duel centenaire.", [
    ["Regarder", s => { trait(s, "courage", 1); return "Chaque coup fait trembler l'île. Quelle fierté !"; }],
    ["Leur apporter à boire après", s => { trait(s, "bonte", 1); humeur(s, 6); return "Ils rient à en faire fuir les dinosaures."; }]], { cond: ile("little_garden") }),
  ev("aqua_laguna", [10, 99], "Les sirènes hurlent : la grande marée, l'Aqua Laguna, arrive sur Water Seven.", [
    ["Aider à évacuer la ville basse", s => { trait(s, "bonte", 2); return `Tu portes des enfants jusqu'aux hauteurs. ${stat(s, "endurance")}`; }],
    ["Monter te mettre à l'abri", () => "La vague est terrifiante, même de loin."]], { cond: ile("water_seven") }),
  ev("train_des_mers", [10, 99], "Un train fume sur les rails posés à même la mer.", [
    ["Le regarder passer", s => { humeur(s, 5); trait(s, "ambition", 1); return "Les hommes peuvent donc dompter la mer."; }],
    ["Interroger les ingénieurs", s => `On t'explique les rails flottants. ${stat(s, "intelligence")}`]], { cond: s => s.ile === "water_seven" && (s.chrono?.naissance ?? 0) + Math.floor(s.jour / 365) >= -14, unique: true }),
  ev("bulles_sabaody", [8, 99], "Des bulles montent du sol. On peut même s'asseoir dedans.", [
    ["Essayer", s => { humeur(s, 8); return "Tu flottes au-dessus des mangroves."; }],
    ["En étudier la résine", s => `Collante, élastique, étonnante. ${stat(s, "intelligence")}`]], { cond: ile("sabaody"), unique: true }),
  ev("noble_mondial", [12, 99], "La foule se jette à genoux : un Noble mondial traverse la rue.", [
    ["T'agenouiller comme tous", s => { humeur(s, -5); return "Tu serres les poings, front contre terre."; }],
    ["Rester debout", s => { trait(s, "courage", 2); s.reputation.gouvernement = (s.reputation.gouvernement || 0) - 15; notoriete(s, 1); return "Des gardes te remarquent. Tu disparais dans la foule de justesse."; }]], { cond: ile("sabaody") }),
  ev("vente_encheres", [16, 99], "On t'invite à une vente aux enchères « très spéciale ».", [
    ["Refuser, écœuré", s => { trait(s, "bonte", 1); return "Tu sais ce qu'on y vend."; }],
    ["Y aller pour voir", s => { humeur(s, -10); return "Des êtres humains, des hommes-poissons… Tu sors avant la fin."; }]], { cond: ile("sabaody"), unique: true }),

  // ---------- Nouveau Monde et fonds marins ----------
  ev("hp_prejuges", [8, 99], "Sur l'île des Hommes-Poissons, un vieil homme-poisson te fixe avec méfiance.", [
    ["Le saluer avec respect", s => { trait(s, "bonte", 1); return "Il hoche la tête, surpris."; }],
    ["Lui demander ce qu'il a vécu", s => { humeur(s, -4); return `L'esclavage, les chaînes, la surface. ${stat(s, "intelligence")}`; }]], { cond: s => s.ile === "hommes_poissons" && s.peuple !== "homme_poisson" }),
  ev("hp_surface", [10, 99], "Des humains te montrent du doigt en chuchotant.", [
    ["Les ignorer", s => { trait(s, "courage", 1); return "Tu marches la tête haute."; }],
    ["Leur sourire", s => { trait(s, "bonte", 1); return "L'un d'eux, gêné, te rend ton sourire."; }]], { cond: s => s.peuple === "homme_poisson" && s.ile !== "hommes_poissons" }),
  ev("jouets_dressrosa", [8, 99], "À Dressrosa, des jouets vivants se promènent parmi les passants.", [
    ["Leur parler", s => { humeur(s, -3); return "Un soldat de plomb te regarde avec une tristesse étrange."; }],
    ["Passer ton chemin", () => "Quelle drôle d'île."]], { cond: ile("dressrosa"), unique: true }),
  ev("danse_dressrosa", [14, 99], "Une danseuse t'entraîne dans un flamenco endiablé.", [
    ["Danser", s => { humeur(s, 10); return `Olé ! ${stat(s, "agilite")}`; }],
    ["Décliner", () => "Elle fait la moue."]], { cond: ile("dressrosa") }),
  ev("wano_etranger", [10, 99], "À Wano, des gardes arrêtent les étrangers.", [
    ["Te déguiser en habitant", s => { trait(s, "ruse", 1); return "Un kimono, un chapeau de paille de riz : te voilà du pays."; }],
    ["Passer par les toits", s => { if (s.stats.agilite + rand(s) * 10 >= 12) return "Personne ne t'a vu."; blesser(s, 0); return "Une tuile cède. Tu t'en tires avec des bleus."; }]], { cond: ile("wano") }),
  ev("wano_soba", [8, 99], "Un marchand de nouilles te tend un bol fumant.", [
    ["Goûter", s => { humeur(s, 6); return `Tu n'as jamais rien mangé d'aussi bon.${comp(s, "cuisine")}`; }],
    ["Demander la recette", s => `« Vingt ans de pratique », répond-il.${comp(s, "cuisine")}`]], { cond: ile("wano") }),
  ev("mer_dechainee_nm", [14, 99], "La mer bout, des éclairs tombent du ciel sans nuage : le Nouveau Monde.", [
    ["Tenir la barre", s => { trait(s, "courage", 1); return `Tes bras tremblent encore.${comp(s, "navigation")}`; }],
    ["T'attacher au mât", () => "Tu survis. C'est déjà beaucoup."]], { cond: s => regionDe(s.ile) === "nm" && surPort(s) }),

  // ---------- Marine ----------
  ev("marine_recrue", [18, 99], "Une jeune recrue pleure dans le dortoir : elle veut rentrer chez elle.", [
    ["La réconforter", s => { trait(s, "bonte", 1); s.carriere.merite += 1; return "Elle reste. Tu as gagné une alliée."; }],
    ["La secouer", s => { trait(s, "courage", 1); return "« La mer n'attend pas. »"; }]], { cond: car("marine") }),
  ev("marine_corruption", [18, 99], "Tu surprends ton supérieur en train d'empocher un pot-de-vin.", [
    ["Le dénoncer", s => { trait(s, "courage", 2); s.carriere.merite += 5; s.reputation.marine = (s.reputation.marine || 0) + 5; return "Il est muté. Certains t'évitent, d'autres te saluent."; }],
    ["Demander ta part", s => { trait(s, "bonte", -2); deExterieur(s, 150); return "150 Berrys. Tu dors mal."; }],
    ["Te taire", s => { humeur(s, -6); return "Tu n'as rien vu."; }]], { cond: car("marine") }),
  ev("marine_pirate_enfant", [18, 99], "Parmi les pirates capturés, un gamin de douze ans.", [
    ["Plaider pour lui", s => { trait(s, "bonte", 2); return "On le confie à un orphelinat plutôt qu'à la prison."; }],
    ["Appliquer le règlement", s => { s.carriere.merite += 2; trait(s, "bonte", -1); return "La loi est la même pour tous."; }]], { cond: car("marine") }),
  ev("marine_medaille", [18, 99], "On te propose pour une médaille… pour un exploit accompli par un autre.", [
    ["Rétablir la vérité", s => { trait(s, "bonte", 2); return "Ton camarade ne l'oubliera jamais."; }],
    ["Accepter", s => { s.carriere.merite += 6; trait(s, "ruse", 1); return "La médaille brille. Elle pèse aussi."; }]], { cond: car("marine") }),
  ev("marine_justice", [18, 99], "Un vieux sergent te demande : « C'est quoi, pour toi, la justice ? »", [
    ["« Protéger les faibles »", s => { trait(s, "bonte", 1); return "Il sourit."; }],
    ["« Appliquer la loi »", s => { s.carriere.merite += 1; return "Il hoche la tête."; }],
    ["« Gagner »", s => { trait(s, "ambition", 1); return "Il te regarde longuement."; }]], { cond: car("marine"), unique: true }),

  // ---------- Piraterie ----------
  ev("pirate_carte", [16, 99], "Un mourant te confie une carte : un trésor sur une île voisine.", [
    ["Suivre la carte", s => { if (rand(s) < 0.5) { deExterieur(s, 400); return "Le coffre existe ! 400 Berrys."; } return "Un trou, et un mot : « Trop tard. »"; }],
    ["La vendre (80 B)", s => { deExterieur(s, 80); trait(s, "ruse", 1); return "À quelqu'un de plus crédule."; }]], { cond: car("pirate") }),
  ev("pirate_village", [16, 99], "Les habitants d'un hameau vous supplient de les épargner.", [
    ["Repartir sans rien prendre", s => { trait(s, "bonte", 2); return "Ils vous offrent d'eux-mêmes des vivres."; }],
    ["Prendre les vivres", s => { trait(s, "bonte", -1); return "L'équipage mange à sa faim."; }]], { cond: car("pirate") }),
  ev("pirate_traitre", [16, 99], "On murmure qu'un de tes hommes renseigne la Marine.", [
    ["Mener l'enquête", s => { trait(s, "ruse", 1); return "Fausse rumeur, lancée par un rival."; }],
    ["Réunir l'équipage et parler franchement", s => { trait(s, "courage", 1); if (s.carriere.moral != null) s.carriere.moral = Math.min(100, s.carriere.moral + 5); return "La confiance revient."; }]], { cond: s => s.carriere?.type === "pirate" && !s.carriere.membre }),
  ev("pirate_pavillon", [16, 99], "Ton équipage veut un nouvel emblème pour le pavillon.", [
    ["Dessiner toi-même", s => { humeur(s, 5); return "Il est… unique. On l'adopte."; }],
    ["Laisser l'équipage voter", s => { if (s.carriere.moral != null) s.carriere.moral = Math.min(100, s.carriere.moral + 4); return "Trois heures de débat. Ils sont ravis."; }]], { cond: s => s.carriere?.type === "pirate" && !s.carriere.membre, unique: true }),
  ev("pirate_marine_honnete", [16, 99], "Un officier de la Marine te laisse filer : « Tu n'es pas de ceux que je chasse. »", [
    ["Le remercier d'un signe", s => { trait(s, "bonte", 1); return "Vous vous reverrez peut-être."; }],
    ["Te méfier", s => { trait(s, "ruse", 1); return "Aucun piège. Étrange."; }]], { cond: s => s.carriere?.type === "pirate" && s.prime > 0 && (s.traits?.bonte || 0) >= 3 }),
  ev("pirate_tempete_butin", [16, 99], "En pleine tempête, la cale prend l'eau : il faut jeter du poids.", [
    ["Jeter une partie du butin", s => { const n = versExterieur(s, Math.floor(s.berrys * 0.1)); return `${n} Berrys par-dessus bord, mais tout le monde vit.`; }],
    ["Tout garder", s => { if (rand(s) < 0.4 && s.navire) { s.navire.coque = Math.max(5, s.navire.coque - 25); return "La coque souffre terriblement. Coque -25."; } return "Ça passe. De justesse."; }]], { cond: s => s.carriere?.type === "pirate" && !!s.navire && surPort(s) }),

  // ---------- Fruits, Haki, mystères ----------
  ev("fruit_faux", [12, 99], "Un marchand jure que ce fruit violet est un Fruit du Démon. 500 Berrys.", [
    ["Rire et partir", s => { trait(s, "ruse", 1); return "Une aubergine peinte."; }],
    ["Acheter", s => { const n = versExterieur(s, Math.min(500, s.berrys)); return n ? "Tu croques. C'est une aubergine. Peinte." : "Tu n'as pas un sou, heureusement."; }]], { cond: s => !s.fruit }),
  ev("fruit_peur", [10, 99], "Depuis que tu as ton pouvoir, certains changent de trottoir.", [
    ["T'en moquer", s => { trait(s, "courage", 1); return "Leur peur n'est pas ton problème."; }],
    ["Montrer que tu es inoffensif", s => { trait(s, "bonte", 1); return "Les enfants, eux, t'adorent."; }]], { cond: s => !!s.fruit }),
  ev("haki_reve", [14, 99], "En rêve, tu entends des voix lointaines, comme si le monde te parlait.", [
    ["Tendre l'oreille", s => { if (s.haki && !s.haki.eveil.observation) s.haki.progres.observation = Math.min(7, s.haki.progres.observation + 1); return "Au réveil, tu sais qu'il s'est passé quelque chose."; }],
    ["Te rendormir", () => "Juste un rêve."]], { unique: true }),
  ev("poneglyphe_rumeur", [14, 99], "Un érudit chuchote : des pierres indestructibles raconteraient l'histoire interdite.", [
    ["L'interroger", s => { s.reputation.gouvernement = (s.reputation.gouvernement || 0) - 2; return `Il parle de Ponéglyphes, puis se tait, effrayé. ${stat(s, "intelligence")}`; }],
    ["Ne pas t'en mêler", () => "Ces savoirs-là coûtent cher."]], { unique: true }),
  ev("siecle_oublie", [18, 99], "Dans un vieux livre, cent ans d'histoire manquent, comme arrachés.", [
    ["Chercher à comprendre", s => { trait(s, "ambition", 1); return `Le Siècle oublié… ${stat(s, "intelligence")}`; }],
    ["Refermer le livre", () => "Certaines portes restent mieux fermées."]], { cond: s => (s.education || 0) >= 20 || s.stats.intelligence >= 15, unique: true }),

  // ---------- Vieillesse ----------
  ev("vieux_copains", [60, 99], "Tes vieux amis se retrouvent au bar pour refaire le monde.", [
    ["Y passer la soirée", s => { humeur(s, 10); return "On rit des mêmes histoires qu'il y a quarante ans."; }],
    ["Rester chez toi", () => "Tes os te remercient."]]),
  ev("jardin", [55, 99], "Un petit jardin t'occuperait bien les mains.", [
    ["Planter des légumes", s => { humeur(s, 6); return "Les premières tomates sont une victoire."; }],
    ["Planter des fleurs", s => { humeur(s, 6); trait(s, "bonte", 1); return "Les voisins s'arrêtent pour les regarder."; }]], { unique: true }),
  ev("souvenir_objet", [60, 99], "Au fond d'un coffre, tu retrouves un objet de ta jeunesse.", [
    ["Le garder près de toi", s => { humeur(s, 8); return "Toute une époque te revient."; }],
    ["L'offrir à un enfant", s => { trait(s, "bonte", 1); return "Il en fera meilleur usage."; }]], { unique: true }),
  ev("dernier_combat", [60, 99], "Un jeune fanfaron te traite de vieillard fini.", [
    ["Lui donner une leçon", s => { if (combat(s, 14)) { humeur(s, 12); return "Il se relève, penaud. « Pardon, l'ancien. »"; } blesser(s, 0); return "Il avait raison sur un point : tu n'as plus vingt ans."; }],
    ["Sourire", s => { trait(s, "bonte", 1); return "Tu as été ce garçon-là."; }]]),
  ev("statue", [65, 99], "Le village veut donner ton nom à une rue.", [
    ["Accepter, ému", s => { humeur(s, 15); return "Tu passes devant la plaque dix fois par jour."; }],
    ["Refuser par modestie", s => { trait(s, "bonte", 1); return "Ils le feront quand même, plus tard."; }]], { cond: s => (s.traits?.bonte || 0) >= 5, unique: true }),

  // ---------- Hasards ----------
  ev("trefle", [5, 99], "Un trèfle à quatre feuilles au bord du chemin.", [
    ["Le cueillir", s => { humeur(s, 5); return "Toute la journée te sourit."; }],
    ["Le laisser pour un autre", s => { trait(s, "bonte", 1); return "La chance se partage."; }]], { unique: true }),
  ev("chat_noir", [5, 99], "Un chat noir te suit jusque chez toi.", [
    ["Lui donner du poisson", s => { humeur(s, 5); return "Il revient tous les soirs."; }],
    ["Le chasser", () => "Il te lance un regard de reproche."]]),
  ev("musicien_rue", [6, 99], "Un musicien de rue joue un air qui te serre le cœur.", [
    ["Lui donner une pièce (2 B)", s => { versExterieur(s, Math.min(2, s.berrys)); humeur(s, 5); return "Il te salue du chapeau."; }],
    ["Chanter avec lui", s => `La rue entière reprend le refrain.${comp(s, "musique")}`]]),
  ev("portrait", [10, 99], "Un peintre propose de faire ton portrait.", [
    ["Poser (20 B)", s => { if (versExterieur(s, 20) < 20) return "Pas assez d'argent."; humeur(s, 5); return "Il t'a fait le nez un peu gros."; }],
    ["Refuser", () => "Une autre fois."]]),
  ev("etoile_filante", [5, 99], "Une étoile filante traverse tout le ciel.", [
    ["Faire un vœu", s => { humeur(s, 5); return "On ne le dit pas, sinon il ne se réalise pas."; }],
    ["La suivre des yeux jusqu'au bout", s => `Vers le sud, toujours.${comp(s, "navigation")}`]]),
  ev("pluie_poissons", [5, 99], "Une trombe marine fait pleuvoir des poissons sur le port !", [
    ["En ramasser", s => { s.inventaire.poisson += 3; return "Trois beaux poissons tombés du ciel."; }],
    ["Te mettre à l'abri", () => "Un thon sur la tête, ça peut assommer."]], { cond: s => surPort(s) }),
  ev("faux_prophete", [10, 99], "Un homme annonce la fin du monde pour demain.", [
    ["Débattre avec lui", s => `Deux heures de rhétorique. ${stat(s, "charisme")}`],
    ["Hausser les épaules", () => "Demain arrive, comme toujours."]]),
  ev("jumelle", [12, 99], "Tu trouves une longue-vue cassée sur la grève.", [
    ["La réparer", s => `Une vis, un peu de colle. ${stat(s, "intelligence")}`],
    ["La rendre à la mer", () => "Elle a peut-être une histoire."]], { cond: s => surPort(s), unique: true }),
  ev("grand_marin", [8, 99], "Un marin au manteau usé débarque, respecté de tous sans dire un mot.", [
    ["Lui offrir à boire", s => { trait(s, "bonte", 1); return "Il te raconte une mer où le ciel est en dessous. Tu ne sais pas s'il plaisante."; }],
    ["L'observer de loin", s => { trait(s, "ruse", 1); return "Il repart à l'aube sans que personne sache son nom."; }]], { cond: s => taverne(s) }),
];
