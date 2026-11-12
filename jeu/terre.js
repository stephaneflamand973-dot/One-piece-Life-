// Vie adulte à terre : métiers avec titres, logement, commerce, médecine de village, vie de famille.
// Gains fixes ; tout l'argent vient de quelqu'un ou de l'extérieur comptabilisé.

import { rand, noter, age, pnjIci, transferer, gagnerCompetence, ILES, LIEUX, EMPLOIS, res } from "./engine.js";

// Titres de métier : obtenus au nombre de journées travaillées chez le même employeur (seuils fixes).
export const TITRES = [[0, "Apprenti", 0], [30, "Compagnon", 10], [100, "Maître", 25]];
export function titreMetier(s, lieu) {
  const n = s.metiers?.[lieu] || 0;
  return [...TITRES].reverse().find(([seuil]) => n >= seuil);
}

export const PRIX_MAISON = { fuchsia: 1500, shells: 2000, loguetown: 3000, water_seven: 3500, hommes_poissons: 3000 };
const MAISON = { fuchsia: "maison", shells: "maison_shells", loguetown: "maison_logue", water_seven: "maison_w7", hommes_poissons: "maison_hp" };
export const maisonIci = s => MAISON[s.ile];
export const possede = (s, lieu) => lieu === (s.foyer || "maison") || !!s.proprietes?.includes(lieu);

export const COMMERCES = {
  echoppe: { nom: "une échoppe", prix: 1500, revenu: 40 },
  taverne: { nom: "une taverne", prix: 4000, revenu: 110 },
  comptoir: { nom: "un comptoir de négoce", prix: 12000, revenu: 320 },
};
const LIEUX_COMMERCE = ["place", "port_shells", "marche_logue", "quai_w7", "mangroves", "place_hp", "ville_dr", "village_wano"];

export function initialiserTerre(s) {
  s.metiers ??= {};
  s.proprietes ??= [];
  s.commerce ??= null;
}

// Appelé par « travailler » : compte la journée et renvoie la prime fixe du titre (payée par l'employeur s'il le peut).
export function journeeDeMetier(s, lieu, payeur) {
  s.metiers[lieu] = (s.metiers[lieu] || 0) + 1;
  const [seuil, nom, prime] = titreMetier(s, lieu);
  let texte = "";
  if (s.metiers[lieu] === seuil && seuil > 0) { texte = ` Ton employeur te nomme ${nom} !`; noter(s, `Tu deviens ${nom} (${EMPLOIS[lieu].label.toLowerCase()}).`, "mission"); }
  const verse = Math.min(prime, payeur.fonds);
  return { prime: verse, texte };
}

export const ACTIONS_TERRE = {
  acheter_maison(s) {
    const lieu = maisonIci(s);
    if (!lieu) return res(false, "Il n'y a pas de maison à vendre sur cette île.");
    if (possede(s, lieu)) return res(false, "Tu as déjà une maison ici.");
    if (age(s) < 18) return res(false, "Il faut être majeur pour acheter une maison.");
    const prix = PRIX_MAISON[s.ile];
    if (s.berrys < prix) return res(false, `Une maison coûte ${prix} Berrys ${ILES[s.ile].a} ; tu en as ${s.berrys}.`);
    s.berrys -= prix; s.monde.exterieur += prix;
    s.proprietes.push(lieu);
    return res(true, `Tu achètes une maison ${ILES[s.ile].a} pour ${prix} Berrys. Tu y dormiras gratuitement.`);
  },
  demenager(s) {
    const lieu = maisonIci(s);
    if (!lieu || !s.proprietes.includes(lieu)) return res(false, "Il faut posséder une maison ici.");
    s.proprietes = s.proprietes.filter(l => l !== lieu); s.proprietes.push(s.foyer || "maison");
    s.foyer = lieu;
    const p = s.famille.partenaire && s.pnj[s.famille.partenaire];
    if (p && s.famille.statut === "marié") p.lieu = lieu;
    return res(true, `Tu fais de cette maison ton foyer${p && s.famille.statut === "marié" ? `, et ${p.nom} t'y rejoint` : ""}.`);
  },
  ouvrir_commerce(s, type) {
    const c = COMMERCES[type];
    if (!c) return res(false, "Ce commerce n'existe pas.");
    if (!LIEUX_COMMERCE.includes(s.lieu)) return res(false, "On ouvre un commerce sur une place, un marché ou un port marchand.");
    if (age(s) < 18) return res(false, "Il faut être majeur.");
    if (s.commerce) return res(false, `Tu tiens déjà ${COMMERCES[s.commerce.type].nom} ${ILES[s.commerce.ile].a}. Vends-la d'abord.`);
    if (s.berrys < c.prix) return res(false, `Il faut ${c.prix} Berrys pour ouvrir ${c.nom}.`);
    s.berrys -= c.prix; s.monde.exterieur += c.prix;
    s.commerce = { type, ile: s.ile, lieu: s.lieu, depuis: s.jour, derniereVisite: s.jour };
    return res(true, `Tu ouvres ${c.nom} ${LIEUX[s.lieu].a}. Elle rapporte ${c.revenu} Berrys par semaine tant que tu passes la voir au moins une fois par mois.`);
  },
  gerer_commerce(s) {
    if (!s.commerce || s.commerce.lieu !== s.lieu) return res(false, "Ton commerce n'est pas ici.");
    if (s.heure + 3 > 24 || s.fatigue >= 80) return res(false, "Pas maintenant : il est tard, ou tu es trop fatigué.");
    s.heure += 3; s.fatigue = Math.min(100, s.fatigue + 10);
    s.commerce.derniereVisite = s.jour;
    return res(true, "Tu fais les comptes, passes les commandes et salues les habitués. Les affaires tournent.");
  },
  vendre_commerce(s) {
    if (!s.commerce || s.commerce.lieu !== s.lieu) return res(false, "Ton commerce n'est pas ici.");
    const prix = Math.round(COMMERCES[s.commerce.type].prix * 0.7);
    s.monde.exterieur -= prix; s.berrys += prix;
    const nom = COMMERCES[s.commerce.type].nom; s.commerce = null;
    return res(true, `Tu vends ${nom} pour ${prix} Berrys.`);
  },
  soigner(s) {
    if ((s.competences.medecine || 0) < 10) return res(false, "Il faut au moins 10 en médecine pour soigner.");
    if (s.heure + 4 > 24 || s.fatigue >= 80) return res(false, "Pas maintenant : il est tard, ou tu es trop fatigué.");
    s.heure += 4; s.fatigue = Math.min(100, s.fatigue + 20);
    const g = gagnerCompetence(s, "medecine");
    // Les patients présents paient s'ils le peuvent ; sinon, tu soignes gratuitement.
    let total = 0;
    for (const id of pnjIci(s)) { const p = s.pnj[id]; if (p.famille || p.membre) continue; const h = Math.min(25, p.fonds); if (h > 0) { transferer(s, id, "joueur", h); total += h; p.relation += 3; } }
    s.traits.bonte = Math.min(10, (s.traits.bonte || 0) + (total ? 0 : 1));
    return res(true, `Tu tiens consultation : plaies, fièvres, os démis.${total ? ` Honoraires : ${total} Berrys.` : " Personne ne peut payer : tu soignes gratuitement."} Médecine +${g}.`);
  },
  jouer_enfant(s) {
    const e = enfantsIci(s)[0];
    if (!e) return res(false, "Tes enfants ne sont pas ici.");
    if (s.heure + 2 > 24) return res(false, "Il est tard : au lit, les enfants !");
    s.heure += 2; s.humeur = Math.min(100, (s.humeur || 0) + 6);
    return res(true, `Tu joues avec ${e.prenom} jusqu'à en avoir mal aux côtes.`);
  },
  enseigner_enfant(s) {
    const e = enfantsIci(s).find(x => (s.jour - x.naissance) / 365 >= 5);
    if (!e) return res(false, "Aucun de tes enfants n'est en âge d'apprendre ici.");
    if (s.heure + 3 > 24 || s.fatigue >= 80) return res(false, "Pas maintenant.");
    s.heure += 3; s.fatigue = Math.min(100, s.fatigue + 10);
    e.lecons = (e.lecons || 0) + 1;
    return res(true, `Tu transmets à ${e.prenom} ce que la vie t'a appris (${e.lecons} leçon${e.lecons > 1 ? "s" : ""}). S'il te succède un jour, il partira avec de meilleures bases.`);
  },
};

// Les enfants de moins de 18 ans vivent au foyer.
function enfantsIci(s) {
  return s.lieu === (s.foyer || "maison") ? s.famille.enfants.filter(e => e.vivant !== false && (s.jour - e.naissance) / 365 < 18) : [];
}

export function actionsTerre(s) {
  const a = [];
  const ag = age(s);
  if (ag < 16) return a;
  const lieu = maisonIci(s);
  if (ag >= 18 && lieu && !possede(s, lieu) && s.lieu !== lieu && [ILES[s.ile].port, "place", "marche_logue", "taverne_shells", "place_hp", "bar_w7"].includes(s.lieu)) a.push({ id: "acheter_maison", label: `Acheter une maison ici (${PRIX_MAISON[s.ile]} B)` });
  if (lieu && s.lieu === lieu && s.proprietes?.includes(lieu)) a.push({ id: "demenager", label: "Faire de cette maison ton foyer" });
  if (ag >= 18 && !s.commerce && LIEUX_COMMERCE.includes(s.lieu)) for (const [k, c] of Object.entries(COMMERCES)) if (s.berrys >= c.prix) a.push({ id: "ouvrir_commerce", cible: k, label: `Ouvrir ${c.nom} (${c.prix} B)` });
  if (s.commerce && s.commerce.lieu === s.lieu) { a.push({ id: "gerer_commerce", label: "Gérer ton commerce" }); a.push({ id: "vendre_commerce", label: "Vendre ton commerce" }); }
  if ((s.competences.medecine || 0) >= 10 && pnjIci(s).length) a.push({ id: "soigner", label: "Tenir consultation" });
  if (enfantsIci(s).length) { a.push({ id: "jouer_enfant", label: "Jouer avec tes enfants" }); if (enfantsIci(s).some(e => (s.jour - e.naissance) / 365 >= 5)) a.push({ id: "enseigner_enfant", label: "Transmettre ton savoir à ton enfant" }); }
  return a;
}

// Chaque semaine : revenu du commerce, s'il a été visité dans les 30 derniers jours.
export function vieATerre(s) {
  const c = s.commerce;
  if (!c || s.jour % 7 !== 0 || s.prison) return;
  if (s.jour - c.derniereVisite > 30) {
    if (!c.neglige) { c.neglige = true; noter(s, `Ton commerce ${ILES[c.ile].a} périclite : personne ne s'en occupe. Passe le voir.`, "monde"); }
    return;
  }
  c.neglige = false;
  const revenu = COMMERCES[c.type].revenu;
  s.monde.exterieur -= revenu; s.berrys += revenu;
}
