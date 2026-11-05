// Étape 1 · Un monde qui vit seul.
// Les habitants vieillissent, s'aiment, ont des enfants, partent, arrivent et meurent ;
// les métiers se transmettent ; des équipages rivaux et des officiers de la Marine vivent leur carrière ;
// les nouvelles circulent d'île en île avec un délai (non-omniscience).
// Tout argent déplacé l'est sans création : héritages, arrivées et départs passent par l'extérieur comptabilisé.

import { rand, noter, age, agePnj, ILES, LIEUX, ROUTES, lieuxDe } from "./engine.js";

const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
const AN = 365;

// Postes de travail : à la mort du titulaire, un enfant adulte ou un habitant de l'île reprend l'activité.
export const POSTES = ["makino", "woop", "tomas", "bern", "ilda", "rivo", "mira", "gallo", "nino", "barro", "lise", "garo",
  "oswin", "bolt", "tess", "hal", "coral", "rocco", "soen"];
const PRENOMS_PNJ = ["Aldo", "Bree", "Caius", "Dena", "Emil", "Fia", "Goran", "Hilde", "Ivo", "Jana", "Koby", "Lior", "Mara", "Nils",
  "Odile", "Pavel", "Quinn", "Rosa", "Silas", "Tilda", "Ugo", "Vesna", "Wim", "Xia", "Yann", "Zelda", "Amos", "Bianca", "Cyrus", "Dora"];
const ROLES_ARRIVANTS = { g: ["marin de passage", "commerçant", "apprenti", "voyageur", "docker", "musicien", "pêcheur"],
  f: ["marin de passage", "commerçante", "apprentie", "voyageuse", "docker", "musicienne", "pêcheuse"] };
const NOMS_EQUIPAGES = ["Pirates du Crâne Rouge", "Pirates de la Mouette Noire", "Pirates du Croc d'Argent", "Pirates de l'Ancre Brisée",
  "Pirates du Corbeau", "Pirates de la Lune Pâle", "Pirates du Requin Bleu", "Pirates de la Tempête", "Pirates du Serpent", "Pirates du Faucon"];
const CAPITAINES = ["Barbe-Rouille", "Morgane la Balafrée", "Krag", "Silver Joe", "Dame Ondine", "Tonnerre Bill", "Rook", "Hyena Sam", "Vasco", "Lady Corsa"];
const OFFICIERS = ["Lieutenant Orvel", "Lieutenante Kesia", "Capitaine Darro", "Lieutenant Fenn"];
export const RANGS_OFFICIERS = ["Lieutenant", "Capitaine", "Commodore", "Contre-amiral", "Vice-amiral"];

export const regionDe = ile => ILES[ile]?.nouveauMonde ? "nm" : ILES[ile]?.grandLine ? "gl" : "eb";
const ileDuLieu = lieu => LIEUX[lieu]?.ile;
const ilesRegion = r => Object.keys(ILES).filter(i => regionDe(i) === r && i !== "hommes_poissons");

export const vivants = s => Object.keys(s.pnj).filter(id => s.pnj[id].vivant !== false && !s.pnj[id].invisible && s.pnj[id].lieu !== "disparu");
const ileDe = (s, id) => s.pnj[id].lieu === "equipage" ? s.ile : ileDuLieu(s.pnj[id].lieu);

// ---------- Initialisation ----------

export function initialiserMonde(s, { parents = true } = {}) {
  for (const [id, p] of Object.entries(s.pnj)) {
    if (p.invisible) continue;
    p.vivant ??= true;
    if (p.naissance == null) p.naissance = s.perso.naissance - Math.floor((22 + rand(s) * 30) * AN);
    p.enfants ??= []; p.parents ??= []; p.couple ??= null;
  }
  s.monde.nouvelles ??= [];
  s.monde.rivaux ??= [];
  s.monde.officiers ??= [];
  s.monde.defunts ??= [];
  s.monde.compteurId ??= 0;
  if (!s.monde.rivaux.length) for (let i = 0; i < 3; i++) nouvelEquipage(s, "eb");
  if (!s.monde.officiers.length) for (const nom of OFFICIERS) s.monde.officiers.push({ nom, rang: 0, ile: pick(s, ["shells", "loguetown"]), actif: true });
  if (parents && !s.pnj.mere && s.perso.naissance === 0 && s.jour === 0) {
    const nomFamille = pick(s, ["Aube", "Vent", "Rivage", "Cordier", "Marin"]);
    for (const [id, role, genre] of [["mere", "ta mère", "f"], ["pere", "ton père", "g"]]) {
      s.pnj[id] = { nom: `${pick(s, PRENOMS_PNJ)} ${nomFamille}`, role, genre, lieu: "maison", relation: 60, fonds: 300, souvenirs: [],
        naissance: -Math.floor((24 + rand(s) * 12) * AN), vivant: true, enfants: [], parents: [], couple: null, famille: true };
      s.monde.exterieur -= 300;
    }
    s.pnj.mere.couple = "pere"; s.pnj.pere.couple = "mere";
  }
}

// ---------- Nouvelles et rumeurs ----------

// Portée : « locale » (l'île seulement), « region » (la même mer), « monde » (partout).
export function nouvelle(s, ile, texte, portee = "locale") {
  s.monde.nouvelles.push({ jour: s.jour, ile, texte, connue: false, portee });
  if (s.monde.nouvelles.length > 120) s.monde.nouvelles.splice(0, s.monde.nouvelles.length - 120);
}
function delai(origine, ici) {
  if (origine === ici) return 0;
  return regionDe(origine) === regionDe(ici) ? 3 : 10;
}
// Le joueur n'apprend une nouvelle que lorsqu'elle a pu arriver jusqu'à lui.
export function recevoirNouvelles(s) {
  if (s.prison) return;
  for (const n of s.monde.nouvelles) {
    const portee = n.portee || "locale";
    if (n.connue || s.jour < n.jour + delai(n.ile, s.ile)) continue;
    if (portee === "locale" && n.ile !== s.ile) continue;
    if (portee === "region" && regionDe(n.ile) !== regionDe(s.ile)) continue;
    n.connue = true;
    noter(s, n.ile === s.ile ? n.texte : `Rumeur : ${n.texte}`, "rumeur");
  }
}

// ---------- Vie et mort des habitants ----------

function nouvelId(s, prefixe) { s.monde.compteurId += 1; return `${prefixe}${s.monde.compteurId}`; }

export function mourir(s, id, cause) {
  const p = s.pnj[id];
  const ile = ileDe(s, id) || s.ile;
  p.vivant = false; p.mort = s.jour; p.cause = cause;
  if (p.couple && s.pnj[p.couple]) { s.pnj[p.couple].couple = null; s.pnj[p.couple].veuf = true; }
  // Héritage : enfants vivants, sinon le joueur s'il est son enfant, sinon l'extérieur (rien ne disparaît).
  const heritiers = (p.enfants || []).filter(e => s.pnj[e]?.vivant !== false && s.pnj[e]);
  if (p.fonds > 0) {
    if (heritiers.length) { const part = Math.floor(p.fonds / heritiers.length); heritiers.forEach(e => (s.pnj[e].fonds += part)); s.monde.exterieur += p.fonds - part * heritiers.length; }
    else if (p.famille) { s.berrys += p.fonds; noter(s, `Tu hérites de ${p.fonds} Berrys.`, "famille"); }
    else s.monde.exterieur += p.fonds;
    p.fonds = 0;
  }
  if (s.famille?.partenaire === id) {
    s.famille.partenaire = null; s.famille.statut = "veuf";
    noter(s, `${p.nom}, ton grand amour, est mort${p.genre === "f" ? "e" : ""}. Le deuil est lourd.`, "famille");
    s.humeur = Math.max(-100, (s.humeur ?? 0) - 60);
  } else if (p.famille) {
    noter(s, `${p.nom}, ${p.role}, s'est éteint${p.genre === "f" ? "e" : ""}.`, "famille");
    s.humeur = Math.max(-100, (s.humeur ?? 0) - 40);
  } else nouvelle(s, ile, `${p.nom} (${p.role}) est mort${p.genre === "f" ? "e" : ""} ${cause}.`, p.relation > 10 || p.canon ? "region" : "locale");
  s.monde.defunts.push({ nom: p.nom, role: p.role, mort: s.jour, age: Math.floor((s.jour - p.naissance) / AN) });
  if (POSTES.includes(id)) succession(s, id, ile);
}

// Un enfant adulte ou un habitant sans poste reprend le métier ; sinon, l'activité s'arrête.
function succession(s, poste, ile) {
  const ancien = s.pnj[poste];
  const candidats = [...(ancien.enfants || []), ...vivants(s).filter(id => !POSTES.includes(id) && ileDe(s, id) === ile && !s.pnj[id].famille && s.pnj[id].lieu !== "equipage")]
    .filter(id => s.pnj[id]?.vivant !== false && s.pnj[id] && agePnj(s, id) >= 16);
  if (!candidats.length) {
    ancien.ferme = true;
    nouvelle(s, ile, `L'activité de ${ancien.nom} (${ancien.role}) a fermé, faute de successeur.`);
    return;
  }
  const id = candidats[0];
  const n = s.pnj[id];
  const anciensEnfants = ancien.enfants || [];
  s.pnj[poste] = { ...ancien, nom: n.nom, genre: n.genre, naissance: n.naissance, relation: n.relation, souvenirs: n.souvenirs,
    fonds: n.fonds, couple: n.couple, enfants: n.enfants || [], parents: n.parents || [], vivant: true, mort: undefined, cause: undefined, ferme: false };
  if (n.couple && s.pnj[n.couple]) s.pnj[n.couple].couple = poste;
  for (const e of n.enfants || []) if (s.pnj[e]) s.pnj[e].parents = s.pnj[e].parents.map(x => (x === id ? poste : x));
  for (const e of anciensEnfants) if (s.pnj[e] && e !== id) s.pnj[e].parents = s.pnj[e].parents.filter(x => x !== poste);
  if (s.famille?.partenaire === id) s.famille.partenaire = poste;
  delete s.pnj[id];
  nouvelle(s, ile, `${s.pnj[poste].nom} reprend l'activité de ${ancien.nom} : ${ancien.role}.`);
}

function risqueMort(a, protege) {
  if (protege && a < 90) return 0;
  if (a < 50) return 0.003;
  if (a < 70) return 0.01 + (a - 50) * 0.002;
  return 0.05 + (a - 70) * 0.02;
}

function naissancePnj(s, mereId, pereId) {
  const m = s.pnj[mereId], p = s.pnj[pereId];
  const id = nouvelId(s, "n");
  const genre = rand(s) < 0.5 ? "f" : "g";
  s.pnj[id] = { nom: pick(s, PRENOMS_PNJ), role: `enfant de ${m.nom} et ${p.nom}`, genre, lieu: m.lieu === "equipage" ? "maison" : m.lieu,
    relation: 0, fonds: 0, souvenirs: [], naissance: s.jour, vivant: true, enfants: [], parents: [mereId, pereId], couple: null };
  m.enfants = [...(m.enfants || []), id]; p.enfants = [...(p.enfants || []), id];
  nouvelle(s, ileDe(s, mereId) || s.ile, `${m.nom} et ${p.nom} ont eu un enfant : ${s.pnj[id].nom}.`);
}

// ---------- Équipages rivaux et officiers ----------

function nouvelEquipage(s, region) {
  const iles = ilesRegion(region);
  const facteur = region === "nm" ? 40 : region === "gl" ? 8 : 1;
  s.monde.rivaux.push({ id: nouvelId(s, "eq"), nom: pick(s, NOMS_EQUIPAGES), capitaine: pick(s, CAPITAINES), region,
    ile: pick(s, iles), prime: Math.round((2 + rand(s) * 10) * facteur) * 1000000, force: Math.round((15 + rand(s) * 15) * (region === "nm" ? 3 : region === "gl" ? 1.8 : 1)), actif: true });
}

function vieRivaux(s) {
  for (const r of s.monde.rivaux.filter(r => r.actif)) {
    if (rand(s) < 0.15) {
      const voisins = Object.keys(ROUTES[r.ile] || {}).filter(i => regionDe(i) === r.region || (r.region === "eb" && i === "cap" && rand(s) < 0.1));
      if (voisins.length) {
        const dest = pick(s, voisins);
        if (dest === "cap") { r.region = "gl"; nouvelle(s, r.ile, `Les ${r.nom} du capitaine ${r.capitaine} ont franchi Reverse Mountain.`, "monde"); }
        r.ile = dest;
      }
    }
    if (rand(s) < 0.25) {
      const hausse = Math.round((1 + rand(s) * 4) * (r.region === "nm" ? 20 : r.region === "gl" ? 4 : 1)) * 1000000;
      r.prime += hausse; r.force += 1;
      if (rand(s) < 0.3) nouvelle(s, r.ile, `Les ${r.nom} ont pillé un navire près de ${ILES[r.ile].nom}. Prime du capitaine ${r.capitaine} : ${r.prime.toLocaleString("fr-FR")} Berrys.`, "region");
    }
    if (rand(s) < 0.003 * (1 + (ILES[r.ile].danger || 0))) {
      r.actif = false; r.fin = "capturé";
      const off = s.monde.officiers.find(o => o.actif && regionDe(o.ile) === r.region) || s.monde.officiers.find(o => o.actif);
      if (off) off.merite = (off.merite || 0) + 1;
      nouvelle(s, r.ile, `Le capitaine ${r.capitaine} (${r.nom}) a été capturé par la Marine${off ? `, sous les ordres de ${RANGS_OFFICIERS[off.rang]} ${off.nom.split(" ").pop()}` : ""}.`, "monde");
    }
  }
}

function vieOfficiers(s) {
  for (const o of s.monde.officiers.filter(o => o.actif)) {
    if (o.rang < RANGS_OFFICIERS.length - 1 && rand(s) < 0.12 + (o.merite || 0) * 0.05) {
      o.rang += 1; o.merite = 0;
      nouvelle(s, o.ile, `${o.nom.split(" ").slice(1).join(" ")} est promu${o.nom.includes("Lieutenante") ? "e" : ""} ${RANGS_OFFICIERS[o.rang]} de la Marine.`, "monde");
    }
  }
}

// ---------- Ticks ----------

export function vieDuMonde(s) {
  if (s.jour % 7 === 0) hebdomadaire(s);
  if (s.jour % AN === 0) annuel(s);
  recevoirNouvelles(s);
}

function hebdomadaire(s) {
  const ids = vivants(s);
  // Couples entre habitants adultes et libres de la même île.
  const libres = ids.filter(id => !s.pnj[id].couple && agePnj(s, id) >= 18 && agePnj(s, id) < 60 && s.famille?.partenaire !== id && s.pnj[id].lieu !== "equipage");
  if (libres.length >= 2 && rand(s) < 0.25) {
    const a = pick(s, libres);
    const b = libres.find(x => x !== a && ileDe(s, x) === ileDe(s, a) && !(s.pnj[a].parents || []).includes(x) && !(s.pnj[x].parents || []).includes(a)
      && !(s.pnj[a].parents || []).some(pa => (s.pnj[x].parents || []).includes(pa)) && rand(s) < 0.5);
    if (b) {
      s.pnj[a].couple = b; s.pnj[b].couple = a;
      nouvelle(s, ileDe(s, a), `${s.pnj[a].nom} et ${s.pnj[b].nom} sont désormais en couple.`);
    }
  }
  // Naissances.
  for (const id of ids) {
    const p = s.pnj[id];
    if (!p.couple || id > p.couple || s.pnj[p.couple]?.vivant === false) continue;
    const ages = [agePnj(s, id), agePnj(s, p.couple)];
    // Environ un enfant tous les dix ans par couple, quatre au plus ; moins sur une île déjà peuplée.
    const pop = vivants(s).filter(x => ileDe(s, x) === ileDe(s, id)).length;
    if (Math.max(...ages) < 45 && Math.min(...ages) >= 18 && (p.enfants || []).length < 4 && pop < 14 && rand(s) < 0.002) naissancePnj(s, id, p.couple);
  }
  vieRivaux(s);
}

function annuel(s) {
  for (const id of vivants(s)) {
    const p = s.pnj[id];
    if (!p || p.vivant === false) continue; // un successeur a pu être fusionné dans un poste pendant la boucle
    const a = agePnj(s, id);
    if (rand(s) < risqueMort(a, p.canon)) mourir(s, id, a >= 70 ? "de vieillesse" : "de maladie");
    else if (!POSTES.includes(id) && !p.famille && !p.membre && a >= 18 && rand(s) < 0.03) {
      // Départ vers une autre île.
      const dest = pick(s, Object.keys(ILES).filter(i => i !== ileDe(s, id) && regionDe(i) === regionDe(ileDe(s, id) || "fuchsia")));
      if (dest) { nouvelle(s, ileDe(s, id) || "fuchsia", `${p.nom} a quitté l'île pour s'installer ${ILES[dest].a}.`); p.lieu = ILES[dest].port; }
    }
  }
  // Arrivées : chaque île garde un minimum d'habitants ; un poste fermé peut être repris.
  for (const ile of Object.keys(ILES)) {
    const pop = vivants(s).filter(id => ileDe(s, id) === ile).length;
    if (pop < 4 && rand(s) < 0.6) {
      const id = nouvelId(s, "a");
      const genre = rand(s) < 0.5 ? "g" : "f";
      const role = pick(s, ROLES_ARRIVANTS[genre]);
      const fonds = 100 + Math.floor(rand(s) * 300);
      s.monde.exterieur -= fonds;
      s.pnj[id] = { nom: pick(s, PRENOMS_PNJ), role, genre, lieu: pick(s, lieuxDe(ile).filter(l => l !== "maison")),
        relation: 0, fonds, souvenirs: [], naissance: s.jour - Math.floor((18 + rand(s) * 20) * AN), vivant: true, enfants: [], parents: [], couple: null,
        romance: rand(s) < 0.5 };
      nouvelle(s, ile, `${s.pnj[id].nom}, ${role}, vient de s'installer ${ILES[ile].a}.`);
    }
  }
  for (const poste of POSTES.filter(p => s.pnj[p]?.ferme && rand(s) < 0.3)) {
    const p = s.pnj[poste];
    const fonds = 500;
    s.monde.exterieur -= fonds;
    p.nom = pick(s, PRENOMS_PNJ); p.vivant = true; p.ferme = false; p.relation = 0; p.souvenirs = []; p.fonds = fonds;
    p.naissance = s.jour - Math.floor((25 + rand(s) * 15) * AN); p.couple = null; p.enfants = []; p.parents = [];
    nouvelle(s, ileDuLieu(p.lieu), `${p.nom} rouvre l'activité : ${p.role}.`);
  }
  // Nouveaux équipages : la piraterie dépend de l'époque (voir la chronologie).
  const intensite = s.monde.intensitePiraterie ?? 1;
  for (const r of ["eb", "gl", "nm"]) if (rand(s) < 0.5 * intensite) nouvelEquipage(s, r);
  s.monde.rivaux = s.monde.rivaux.filter(r => r.actif || s.jour - (r.finJour ?? s.jour) < AN * 5).slice(-40);
  vieOfficiers(s);
}

export const rivauxIci = s => s.monde.rivaux.filter(r => r.actif && r.ile === s.ile);
