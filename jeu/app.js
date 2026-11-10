import {
  nouvelleVie, agir, avancer, actionsDisponibles, noter, interpreterTexte, serialiser, deserialiser,
  age, annee, jourDansAnnee, LIEUX, ILES, STATS, COMPETENCES, OBJETS, pnjIci, faitsPourNarration,
  migrer, lieuxDe, heritiers, succeder, RANGS_MARINE, MERITE_RANG, agePnj, FRUITS, NAVIRES, equipage, puissance,
  HAKI, SEUIL_EVEIL,
} from "./engine.js";
import { regionDe, RANGS_OFFICIERS } from "./monde.js";
import { ERES, CALENDRIER, anneeRelative, anneeTexte } from "./chronologie.js";
import { FACTIONS } from "./factions.js";
import { humeurTexte, portraitTraits, TRAITS } from "./vie.js";
import { ORIGINES, PEUPLES, DEFIS, SUCCES } from "./origines.js";
import { TALENTS } from "./talents.js";
import { GRADES_PIRATE, MERITE_PIRATE, AMELIORATIONS } from "./pirate.js";
import { sceneSVG, sons, afficherTutoriel, animationTemps, lireAffichage, ecrireAffichage, appliquerAffichage, demarrerAmbiance } from "./presentation.js";

// Mémorial : toutes les vies terminées, gardées sur l'iPhone d'une partie à l'autre.
const CLE_MEMORIAL = "opl-memorial";
const lireMemorial = () => { try { return JSON.parse(localStorage.getItem(CLE_MEMORIAL) || "[]"); } catch { return []; } };
function memorialiser() {
  if (!s || s.perso.vivant || s.drapeaux?.memorialise) return;
  s.drapeaux.memorialise = s.jour;
  const m = lireMemorial();
  m.unshift({ prenom: s.perso.prenom, age: age(s), generation: s.generation, peuple: s.peuple, origine: s.origine,
    carriere: s.carriere?.type || s.ancienneCarriere?.type || null, prime: s.prime, fruit: s.fruit?.id || null, succes: Object.keys(s.succes || {}), date: Date.now() });
  try { localStorage.setItem(CLE_MEMORIAL, JSON.stringify(m.slice(0, 100))); } catch {}
  sauver();
}
import { lireConfig, ecrireConfig, iaActive, interpreter, narrer, testerCle, MODELE_DEFAUT } from "./ia.js";

export const VERSION_APP = "18.2 · voyages libres";
const CLE_INDEX = "opl-jeu-mondes";
const cleMonde = id => `opl-jeu-monde-${id}`;
const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let s = null;
let occupe = false;
let onglet = "jeu";
let dernierLieu = null;

// ---------- Sauvegardes (automatiques, vérifiées, avec copie de secours) ----------

function lireIndex() { try { return JSON.parse(localStorage.getItem(CLE_INDEX) || "[]"); } catch { return []; } }
function ecrireIndex(ix) { try { localStorage.setItem(CLE_INDEX, JSON.stringify(ix)); } catch {} }

function sauver() {
  if (!s) return;
  try {
    const k = cleMonde(s.id);
    const ancien = localStorage.getItem(k);
    if (ancien) localStorage.setItem(`${k}-secours`, ancien);
    localStorage.setItem(k, serialiser(s));
    const ix = lireIndex().filter(m => m.id !== s.id);
    ix.unshift({ id: s.id, prenom: s.perso.prenom, age: age(s), vivant: s.perso.vivant, maj: Date.now() });
    ecrireIndex(ix);
  } catch (e) { alerte(`Sauvegarde impossible : ${e.message}`); }
}

function charger(id) {
  const k = cleMonde(id);
  try { return { etat: migrer(deserialiser(localStorage.getItem(k))), secours: false }; }
  catch {
    try { return { etat: migrer(deserialiser(localStorage.getItem(`${k}-secours`))), secours: true }; }
    catch { return null; }
  }
}

// ---------- Prénoms au hasard ----------

const PRENOMS = {
  g: ["Kai", "Milo", "Ren", "Taro", "Elio", "Noé", "Sven", "Jiro", "Lucas", "Matéo", "Hugo", "Raiden", "Yuki", "Diego", "Ilan", "Kenji", "Léo", "Orin", "Bastien", "Akira"],
  f: ["Lena", "Sora", "Mei", "Lina", "Rin", "Iris", "Nora", "Yumi", "Alba", "Kiara", "Zoé", "Inès", "Hana", "Maya", "Luna", "Aiko", "Elsa", "Naïa", "Clara", "Sakura"],
};
function prenomAuHasard(genre) {
  const liste = genre === "g" ? PRENOMS.g : genre === "f" ? PRENOMS.f : [...PRENOMS.g, ...PRENOMS.f];
  return liste[Math.floor(Math.random() * liste.length)];
}

// ---------- Écrans ----------

function ecranAccueil() {
  s = null;
  const ix = lireIndex();
  $("#app").innerHTML = `
    <header class="titre"><h1>One Piece Life</h1><p>Une vie entière dans le monde de One Piece.</p><p class="discret petit">Version ${VERSION_APP}</p></header>
    <section class="carte">
      <h2>Nouvelle vie</h2>
      <label for="prenom">Prénom</label>
      <div class="ligne-champ">
        <input id="prenom" maxlength="24" placeholder="Ton prénom" autocomplete="off">
        <button type="button" class="de" id="hasard" aria-label="Prénom au hasard">🎲</button>
      </div>
      <label for="genre">Tu es</label>
      <select id="genre"><option value="g">un garçon</option><option value="f">une fille</option><option value="x">non précisé</option></select>
      <label for="peuple">Peuple</label>
      <select id="peuple">${Object.entries(PEUPLES).map(([k, p]) => `<option value="${k}">${p.nom}</option>`).join("")}</select>
      <label for="origine">Île de naissance</label>
      <select id="origine">${Object.entries(ORIGINES).filter(([k]) => k !== "hommes_poissons").map(([k, o]) => `<option value="${k}">${o.nom}</option>`).join("")}</select>
      <label for="defi">Départ</label>
      <select id="defi">${Object.entries(DEFIS).map(([k, d]) => `<option value="${k}">${d.nom}</option>`).join("")}</select>
      <p class="discret petit" id="defi-desc">${DEFIS.aucun.desc}</p>
      <label>Talents <span class="discret petit">(coche tous ceux que tu veux)</span></label>
      <div class="talents">
        ${[...new Set(Object.values(TALENTS).map(t => t.groupe))].map(g => `<fieldset><legend>${g}</legend>
          ${Object.entries(TALENTS).filter(([, t]) => t.groupe === g).map(([k, t]) => `<label class="talent"><input type="checkbox" value="${k}"><span><b>${t.nom}</b><br><span class="discret petit">${t.desc}</span></span></label>`).join("")}
        </fieldset>`).join("")}
        <div class="ligne-champ"><button type="button" class="secondaire" id="talents-tous">Tout cocher</button><button type="button" class="secondaire" id="talents-aucun">Tout décocher</button></div>
      </div>
      <label for="ere">Époque</label>
      <select id="ere">${Object.entries(ERES).map(([k, e]) => `<option value="${k}" ${k === "avant_luffy" ? "selected" : ""}>${e.nom}</option>`).join("")}</select>
      <p class="discret petit" id="ere-desc">${ERES.avant_luffy.desc}</p>
      <button id="naitre" class="principal">Naître</button>
      <p class="discret">Ta vie commence à la naissance, dans le village de Fuchsia, sur l'île de Dawn (East Blue). Chaque vie est un monde indépendant.</p>
    </section>
    ${ix.length ? `<section class="carte"><h2>Continuer</h2>${ix.map(m => `
      <div class="ligne-vie"><button class="secondaire" data-ouvrir="${esc(m.id)}">${esc(m.prenom)} · ${m.vivant ? `${m.age} ans` : "vie terminée"}</button>
      <button class="icone" data-suppr="${esc(m.id)}" aria-label="Supprimer">✕</button></div>`).join("")}</section>` : ""}
    ${(() => { const m = lireMemorial(); if (!m.length) return ""; const tous = new Set(m.flatMap(v => v.succes || []));
      return `<section class="carte"><h2>Mémorial</h2><p class="discret">${m.length} vie${m.length > 1 ? "s" : ""} vécue${m.length > 1 ? "s" : ""} · ${tous.size}/${Object.keys(SUCCES).length} succès débloqués</p>
      ${m.slice(0, 8).map(v => `<p class="petit"><b>${esc(v.prenom)}</b> · ${v.age} ans${v.carriere ? ` · ${v.carriere}` : ""}${v.prime ? ` · prime ${v.prime.toLocaleString("fr-FR")} ฿` : ""}${v.fruit ? " · fruit" : ""}</p>`).join("")}</section>`; })()}
    <section class="carte"><h2>Réglages</h2>${htmlReglages()}</section>`;
  $("#talents-tous").onclick = () => document.querySelectorAll(".talent input").forEach(c => (c.checked = true));
  $("#talents-aucun").onclick = () => document.querySelectorAll(".talent input").forEach(c => (c.checked = false));
  $("#defi").onchange = () => { $("#defi-desc").textContent = DEFIS[$("#defi").value].desc; };
  $("#peuple").onchange = () => { const hp = $("#peuple").value === "homme_poisson"; $("#origine").disabled = hp; };
  $("#ere").onchange = () => { $("#ere-desc").textContent = ERES[$("#ere").value].desc; };
  $("#hasard").onclick = () => { $("#prenom").value = prenomAuHasard($("#genre").value); };
  $("#naitre").onclick = () => {
    const prenom = $("#prenom").value.trim() || prenomAuHasard($("#genre").value);
    s = nouvelleVie({ prenom, genre: $("#genre").value, ere: $("#ere").value, origine: $("#origine").value, peuple: $("#peuple").value, defi: $("#defi").value, talents: [...document.querySelectorAll(".talent input:checked")].map(c => c.value), seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0 });
    sauver(); ecranJeu();
  };
  document.querySelectorAll("[data-ouvrir]").forEach(b => b.onclick = () => {
    const r = charger(b.dataset.ouvrir);
    if (!r) return alerte("Cette sauvegarde est illisible et n'a pas de copie valide.");
    s = r.etat; ecranJeu();
    if (r.secours) alerte("La dernière sauvegarde était abîmée : la copie de secours précédente a été chargée.");
  });
  document.querySelectorAll("[data-suppr]").forEach(b => b.onclick = () => {
    if (!confirm("Supprimer définitivement cette vie ?")) return;
    try { localStorage.removeItem(cleMonde(b.dataset.suppr)); localStorage.removeItem(`${cleMonde(b.dataset.suppr)}-secours`); } catch {}
    ecrireIndex(lireIndex().filter(m => m.id !== b.dataset.suppr)); appliquerAffichage();
ecranAccueil();
  });
  brancherReglages();
}

function ecranJeu() {
  onglet = "jeu";
  $("#app").innerHTML = `
    <header class="statut" id="statut"></header>
    <main id="contenu"></main>
    <nav class="onglets">
      <button data-onglet="jeu" class="actif">Vivre</button>
      <button data-onglet="fiche">Fiche</button>
      <button data-onglet="journal">Journal</button>
      <button data-onglet="menu">Menu</button>
    </nav>`;
  document.querySelectorAll("[data-onglet]").forEach(b => b.onclick = () => { onglet = b.dataset.onglet; rendre(); });
  rendre();
  afficherTutoriel();
}

// Après chaque mise à jour de l'écran, les boutons changent de place : un second appui trop rapide
// tomberait sur un autre bouton. On ignore donc les appuis pendant un court instant.
let verrouAppuis = 0;
document.addEventListener("click", e => {
  if (performance.now() < verrouAppuis && e.target.closest("button")) { e.preventDefault(); e.stopPropagation(); return; }
  if (e.target.closest("button")) { sons.appui(); demarrerAmbiance(); }
}, true);

function rendre() {
  verrouAppuis = performance.now() + 220;
  memorialiser();
  document.querySelectorAll("[data-onglet]").forEach(b => b.classList.toggle("actif", b.dataset.onglet === onglet));
  rendreStatut();
  ({ jeu: rendreVivre, fiche: rendreFiche, journal: rendreJournal, menu: rendreMenu })[onglet]();
}

function rendreStatut() {
  const ile = ILES[s.ile];
  const region = ile.nouveauMonde ? "Nouveau Monde" : ile.grandLine ? "Grand Line" : "East Blue";
  const energie = 100 - s.fatigue;
  const etat = s.prison ? ["En prison", "ko"] : s.sante.blessures.length ? ["Blessé", "ko"] : ["En forme", "ok"];
  $("#statut").innerHTML = `
    <div class="tete">
      <div class="avatar" aria-hidden="true">${esc(s.perso.prenom[0] || "?")}</div>
      <div class="identite">
        <div><strong>${esc(s.perso.prenom)}</strong> <span class="discret">· ${age(s) === 0 ? "nouveau-né" : `${age(s)} an${age(s) > 1 ? "s" : ""}`}</span></div>
        <div class="discret petit">${anneeTexte(anneeRelative(s))} · jour ${jourDansAnnee(s)} · ${Math.floor(s.heure)}h</div>
      </div>
      <div class="bourse"><b>${s.berrys.toLocaleString("fr-FR")}</b> ฿</div>
    </div>
    <div class="jauges">
      <span class="energie" title="Énergie"><i style="width:${energie}%"></i><em>Énergie ${energie}</em></span>
      <span class="${etat[1]}">${etat[0]}</span>
      <span class="${humeurTexte(s.humeur || 0)[1]}">${humeurTexte(s.humeur || 0)[0]}</span>
      <span class="region">${region}</span>
      ${s.prime ? `<span class="prime">Prime ${s.prime.toLocaleString("fr-FR")} ฿</span>` : ""}
      ${iaActive() ? `<span class="ia">IA</span>` : ""}
    </div>`;
}

// Regroupement des actions par thème pour l'écran principal.
const GROUPES = [
  ["propositions", "Décision", ["choisir", "accepter", "refuser", "accomplir"]],
  ["prison", "En cellule", ["attendre", "evader"]],
  ["progresser", "Progresser", ["entrainer", "etudier", "ecole", "cartes", "medecine", "haki", "maitriser", "jouer", "ecouter", "sabre", "initier"]],
  ["activites", "Activités", ["travailler", "pecher", "cuisiner", "musique", "acheter", "reparer", "radoub", "enrober", "explorer", "colisee", "consulter", "genereux", "tricher", "harangue", "manger"]],
  ["aventure", "Aventure", ["voyager", "pirate", "rejoindre", "corvees", "abordage", "fonder", "mutinerie", "quitter_equipage", "recruter", "attaquer", "attaquer_marine", "rancon", "defier", "proteger", "fete", "prime_equipage", "ameliorer", "combattre", "engager", "service", "patrouille", "chasseur", "traquer", "revolution", "sabotage", "alliance", "trahir", "quitter"]],
  ["coeur", "Cœur et famille", ["declarer", "mariage", "famille", "enfant"]],
];

const TYPES_VISIBLES = new Set(["naissance", "recit", "action", "refus", "ellipse", "monde", "sante", "mission", "age", "mort", "narration", "parole", "voyage", "famille", "rumeur", "evenement", "succes"]);

function rendreVivre() {
  const recents = s.journal.filter(e => TYPES_VISIBLES.has(e.type)).slice(-14);
  const actions = actionsDisponibles(s);
  const ici = pnjIci(s);
  const enfant = age(s) < 6;
  const ile = ILES[s.ile];
  const lieu = LIEUX[s.lieu];
  const index = new Map(actions.map((a, i) => [a, i]));
  const groupes = GROUPES.map(([cle, titre, ids]) => [cle, titre, actions.filter(a => ids.includes(a.id))]).filter(g => g[2].length);
  const bouton = a => `<button class="action${a.id === "manger" && s.fruit ? " danger" : ""}" data-action="${index.get(a)}">${esc(a.label)}</button>`;
  let jourPrec = null;
  const recit = recents.map((e, i) => {
    const sep = e.jour !== jourPrec ? `<div class="sep-jour">Année ${Math.floor(e.jour / 365) + 1} · jour ${(e.jour % 365) + 1}</div>` : "";
    jourPrec = e.jour;
    return `${sep}<p class="e-${e.type}${i === recents.length - 1 ? " dernier" : ""}">${esc(e.texte)}</p>`;
  }).join("");
  $("#contenu").innerHTML = `
    <section class="scene">
      ${sceneSVG(s.ile, s.lieu, regionDe(s.ile), s.heure)}
      <div class="scene-ile">${esc(ile.nom[0].toUpperCase() + ile.nom.slice(1))}</div>
      <div class="scene-lieu">${esc(lieu.nom[0].toUpperCase() + lieu.nom.slice(1))}</div>
      <div class="presents">${ici.length ? ici.map(id => `<button class="pnj" data-parler="${id}"><span>${esc(s.pnj[id].nom[0])}</span>${esc(s.pnj[id].nom)}</button>`).join("") : `<span class="discret petit">Personne ici.</span>`}</div>
    </section>
    <section class="recit" id="recit" aria-live="polite">${recit}</section>
    ${s.perso.vivant ? `
    ${enfant ? "" : `<form class="saisie" id="saisie">
      <input id="texte" placeholder="Que fais-tu ?" autocomplete="off" enterkeyhint="send">
      <button class="principal" type="submit" aria-label="Valider">➤</button>
    </form>`}
    ${(() => {
      // Refaire la dernière action en un geste, une fois, cinq fois ou jusqu'à l'épuisement.
      const dispo = derniereAction && actions.find(a => a.id === derniereAction.id && a.cible === derniereAction.cible);
      return dispo && !s.evenement ? `<section class="rapide"><span class="petit discret">Refaire « ${esc(dispo.label)} »</span>
        <div class="ligne-champ"><button data-refaire="1">↻ 1 fois</button><button data-refaire="5">↻ 5 fois</button><button data-refaire="99">↻ Jusqu'à épuisement</button></div></section>` : "";
    })()}
    ${groupes.map(([cle, titre, liste]) => `<section class="groupe g-${cle}"><h3>${titre}</h3><div class="grille">${liste.map(bouton).join("")}</div></section>`).join("")}
    ${s.prison ? "" : `<section class="groupe"><h3>Se déplacer ${ile.a}</h3>
      <div class="lieux">${lieuxDe(s.ile).filter(id => id !== s.lieu).map(id => `<button class="chip" data-aller="${id}">${LIEUX[id].court}</button>`).join("")}</div></section>`}
    <section class="temps">
      <button data-temps="repos" class="${dernierRefusFatigue ? "conseil" : ""}">🌙 Dormir</button>
      <button data-temps="7">+1 sem.</button>
      <button data-temps="30">+1 mois</button>
      ${age(s) < 16 ? `<button data-temps="365">+1 an</button>` : ""}
    </section>
` : `<section class="carte"><h2>Fin de vie</h2><p>${esc(s.perso.prenom)} a vécu ${age(s)} ans.</p>
      ${heritiers(s).map((e, i) => `<button class="principal" data-heritier="${i}">Continuer avec ${esc(e.prenom)} (${Math.floor((s.jour - e.naissance) / 365)} ans)</button>`).join("")}
      <button class="${heritiers(s).length ? "secondaire" : "principal"}" id="retour">Commencer une nouvelle vie</button></section>`}`;
  const r = $("#recit"); r.scrollTop = r.scrollHeight;
  // Nouveau lieu : on remonte en haut pour voir la scène et qui est présent.
  if (s.lieu !== dernierLieu) { window.scrollTo(0, 0); dernierLieu = s.lieu; }
  document.querySelectorAll("[data-action]").forEach(b => b.onclick = () => { derniereAction = actions[+b.dataset.action]; jouer([derniereAction]); });
  document.querySelectorAll("[data-refaire]").forEach(b => b.onclick = () => repeter(+b.dataset.refaire));
  document.querySelectorAll("[data-parler]").forEach(b => b.onclick = () => jouer([{ id: "parler", cible: b.dataset.parler }]));
  document.querySelectorAll("[data-aller]").forEach(b => b.onclick = () => jouer([{ id: "aller", cible: b.dataset.aller }]));
  document.querySelectorAll("[data-temps]").forEach(b => b.onclick = () => {
    if (b.dataset.temps === "repos") return jouer([{ id: "repos" }]);
    temps(+b.dataset.temps);
  });
  if ($("#saisie")) $("#saisie").onsubmit = e => { e.preventDefault(); libre($("#texte").value.trim()); };
  if ($("#retour")) $("#retour").onclick = ecranAccueil;
  document.querySelectorAll("[data-heritier]").forEach(b => b.onclick = () => { succeder(s, +b.dataset.heritier); sauver(); rendre(); });
}

let derniereAction = null;
let dernierRefusFatigue = false;
const refusFatigue = t => /fatigu|trop tard|repose|santé ne te permet|tard aujourd'hui|nuit/i.test(t || "");

// Répète la dernière action ; s'arrête au premier refus, à une décision à prendre ou à la mort.
async function repeter(n) {
  if (occupe || !derniereAction) return;
  const actions = [];
  for (let i = 0; i < n; i++) actions.push(derniereAction);
  await jouer(actions, { narrer: n === 1 });
}

async function jouer(actions, { narrer: avecNarration = true } = {}) {
  if (occupe || !actions.length) return;
  occupe = true;
  const resultats = [];
  let resultatsOk = true;
  for (const a of actions) {
    const r = agir(s, a);
    resultats.push(r.texte);
    resultatsOk = r.ok;
    if (!r.ok || r.interruption || s.evenement || !s.perso.vivant) break; // un refus ou un événement important arrête la suite
  }
  dernierRefusFatigue = !resultatsOk && refusFatigue(resultats.at(-1));
  if (actions.length > 1 && resultats.length > 1) noter(s, `${resultats.length - (resultatsOk ? 0 : 1)} fois de suite.`, "ellipse");
  sauver(); rendre();
  if (s.evenement) sons.evenement(); else if (resultats.length) (resultatsOk ? sons.succes : sons.echec)();
  if (avecNarration && iaActive() && s.perso.vivant) await raconter(resultats.join(" "));
  occupe = false;
}

function temps(jours) {
  if (occupe) return;
  animationTemps(jours >= 365 ? "Une année passe…" : jours >= 30 ? "Un mois passe…" : "Une semaine passe…");
  sons.temps();
  dernierRefusFatigue = false;
  avancer(s, jours); sauver(); rendre();
  if (s.evenement) sons.evenement();
}

async function raconter(resultat) {
  const zone = $("#recit");
  const p = document.createElement("p"); p.className = "e-attente"; p.textContent = "…";
  zone?.appendChild(p); if (zone) zone.scrollTop = zone.scrollHeight;
  try {
    const txt = await narrer(faitsPourNarration(s, resultat));
    if (txt) { s.journal.push({ jour: s.jour, heure: s.heure, texte: txt, type: "narration" }); sauver(); }
  } catch (e) {
    s.journal.push({ jour: s.jour, heure: s.heure, texte: `(Narration IA indisponible : ${e.message}.)`, type: "refus" });
  }
  if (onglet === "jeu") rendre();
}

async function libre(texte) {
  if (!texte || occupe) return;
  s.journal.push({ jour: s.jour, heure: s.heure, texte: `« ${texte} »`, type: "parole" });
  let actions = [];
  let message = "";
  if (iaActive()) {
    occupe = true; rendre();
    try {
      const r = await interpreter(s, texte);
      actions = r.actions;
      if (r.clarification && !actions.length) message = r.clarification;
      else if (r.impossible) message = `Pas possible dans le jeu : ${r.impossible}`;
    } catch (e) {
      actions = interpreterTexte(s, texte);
      message = `(IA indisponible : ${e.message}. Interprétation simple utilisée.)`;
    }
    occupe = false;
  } else actions = interpreterTexte(s, texte);
  if (message) s.journal.push({ jour: s.jour, heure: s.heure, texte: message, type: "refus" });
  if (!actions.length) {
    if (!message) s.journal.push({ jour: s.jour, heure: s.heure, texte: "Je n'ai pas compris. Essaie une action plus simple, ou utilise les boutons.", type: "refus" });
    sauver(); rendre(); return;
  }
  await jouer(actions);
}

function rendreFiche() {
  const barre = (v, max = 100) => `<span class="barre"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></span>`;
  const missions = s.missions.filter(m => m.statut !== "refusée").slice(-6).reverse();
  $("#contenu").innerHTML = `
    <section class="carte"><h2>Caractéristiques</h2>
      ${Object.entries(STATS).map(([k, l]) => `<div class="stat"><span>${l}</span>${barre(s.stats[k], s.potentiel[k])}<b>${s.stats[k]}<span class="discret petit">/${s.potentiel[k]}</span></b></div>`).join("")}
      <p class="discret">Le second nombre est ta limite naturelle : une fois atteinte, la caractéristique ne progresse plus.</p>
      <p class="discret">Chaque entraînement réussi rapporte toujours le même gain fixe.</p></section>
    ${s.talents?.length ? `<section class="carte"><h2>Talents</h2>${s.talents.map(t => `<p><b>${TALENTS[t].nom}</b> · <span class="discret petit">${TALENTS[t].desc}</span></p>`).join("")}</section>` : ""}
    <section class="carte"><h2>Personnalité</h2>
      <p>${portraitTraits(s).join(", ") || "Encore en train de se dessiner."}</p>
      ${Object.entries(TRAITS).map(([k, [neg, pos]]) => `<div class="stat"><span class="petit">${neg} · ${pos}</span><span class="barre"><i style="width:${((s.traits[k] || 0) + 10) * 5}%"></i></span><b>${s.traits[k] || 0}</b></div>`).join("")}
      <p class="discret">Éducation : ${s.education || 0}${(s.education || 0) >= 40 ? " (instruit)" : ""} · Humeur : ${humeurTexte(s.humeur || 0)[0].toLowerCase()}</p></section>
    <section class="carte"><h2>Compétences</h2>
      ${Object.entries(COMPETENCES).map(([k, l]) => `<div class="stat"><span>${l}</span>${barre(s.competences[k], 50)}<b>${s.competences[k]}</b></div>`).join("")}</section>
    <section class="carte"><h2>Santé</h2>
      ${s.sante.blessures.length ? s.sante.blessures.map(b => `<p>${esc(b.nom)} · guérison dans ${b.jours} jour${b.jours > 1 ? "s" : ""}</p>`).join("") : "<p>Aucune blessure.</p>"}
      ${s.sante.sequelles.length ? `<p class="discret">Séquelles : ${s.sante.sequelles.map(esc).join(", ")}</p>` : ""}
      ${s.sante.maladies?.length ? `<p class="discret">Maladies : ${s.sante.maladies.join(", ")}</p>` : ""}</section>
    <section class="carte"><h2>Possessions</h2><p>${s.berrys} Berrys</p>
      <p>${Object.entries(s.inventaire).filter(([k, n]) => k !== "fruits" && n > 0).map(([k, n]) => `${n} ${n > 1 ? OBJETS[k].pluriel : OBJETS[k].nom}`).join(", ") || "Rien d'autre."}</p>
      ${s.inventaire.fruits.length ? `<p>Fruits du Démon non mangés : ${s.inventaire.fruits.map(f => FRUITS[f].nom).join(", ")}</p>` : ""}
      ${s.navire ? `<p>Navire : « ${esc(s.navire.nom)} », ${NAVIRES[s.navire.type].nom} (${NAVIRES[s.navire.type].capacite} places d'équipage) · coque ${s.navire.coque}/100${s.navire.enrobe ? " · enrobé" : ""}</p>` : ""}</section>
    <section class="carte"><h2>Pouvoir et combat</h2>
      <p>Puissance de combat : <b>${puissance(s)}</b></p>
      ${Object.keys(HAKI).filter(t => s.haki.eveil[t] || (t !== "rois" && s.haki.progres[t] > 0)).map(t => s.haki.eveil[t]
        ? `<p><b>${HAKI[t].nom}</b> · niveau ${s.haki[t]} <span class="discret">(${HAKI[t].effet})</span></p>`
        : `<p>${HAKI[t].nom} · éveil ${s.haki.progres[t]}/${SEUIL_EVEIL}</p>`).join("") || `<p class="discret">Aucun Haki éveillé.${age(s) >= 15 ? " On parle d'un vieux marin, à Loguetown, qui en saurait long." : ""}</p>`}
      ${s.fruit ? `<p><b>${FRUITS[s.fruit.id].nom}</b> (${FRUITS[s.fruit.id].type}) : tu peux ${FRUITS[s.fruit.id].pouvoir}. Maîtrise ${s.fruit.maitrise}.</p><p class="discret">Tu ne sais plus nager.</p>` : "<p>Pas de Fruit du Démon.</p>"}</section>
    <section class="carte"><h2>Relations</h2>
      ${Object.entries(s.pnj).filter(([, p]) => !p.invisible && p.lieu !== "disparu" && (p.relation !== 0 || p.souvenirs.length || LIEUX[p.lieu]?.ile === s.ile)).map(([id, p]) => `<div class="stat"><span>${esc(p.nom)} <i class="discret">${esc(p.role)}${agePnj(s, id) != null ? `, ${agePnj(s, id)} ans` : ""}</i></span>${barre(Math.max(0, p.relation))}<b>${p.relation}</b></div>`).join("")}</section>
    <section class="carte"><h2>Carrière</h2>
      ${s.carriere?.type === "marine" ? `<p>${RANGS_MARINE[s.carriere.rang]} de la Marine · mérite ${s.carriere.merite}${s.carriere.rang < RANGS_MARINE.length - 1 ? ` / ${MERITE_RANG[s.carriere.rang + 1]} pour ${RANGS_MARINE[s.carriere.rang + 1]}` : ""}</p>`
        : s.carriere?.type === "chasseur" ? `<p>Chasseur de primes · ${s.carriere.captures} capture${s.carriere.captures > 1 ? "s" : ""}</p>`
        : s.carriere?.type === "revolution" ? `<p>Membre de l'Armée révolutionnaire · ${s.carriere.missions} mission${s.carriere.missions > 1 ? "s" : ""}</p>`
        : s.carriere?.type === "pirate" && s.carriere.membre ? `<p><b>${GRADES_PIRATE[s.carriere.grade]}</b> des ${esc(s.carriere.equipage)}, sous les ordres du capitaine ${esc(s.carriere.capitaine || "")}</p>
          <p class="discret">Mérite ${s.carriere.merite}${s.carriere.grade < 3 ? ` / ${MERITE_PIRATE[s.carriere.grade + 1]} pour ${GRADES_PIRATE[s.carriere.grade + 1]}` : " · tu peux mener une mutinerie"} · ${s.carriere.raids} abordage${s.carriere.raids > 1 ? "s" : ""}</p>
          <p class="discret">Tu suis l'équipage d'île en île. Avec ton propre navire, tu peux fonder ton équipage depuis un port.</p>`
        : s.carriere?.type === "pirate" ? `<p>Capitaine des <b>${esc(s.carriere.equipage)}</b> · ${s.carriere.raids} abordage${s.carriere.raids > 1 ? "s" : ""}${s.carriere.corsaire ? " · <b>Grand Corsaire</b>" : ""}${s.carriere.empereur ? " · <b>Empereur</b>" : ""}</p>
          <div class="stat"><span>Moral de l'équipage</span><span class="barre"><i style="width:${s.carriere.moral ?? 60}%;background:${(s.carriere.moral ?? 60) < 25 ? "var(--ko)" : "var(--ok)"}"></i></span><b>${Math.round(s.carriere.moral ?? 60)}</b></div>
          ${equipage(s).map(id => `<p>${esc(s.pnj[id].nom)} · <span class="discret">${esc(s.pnj[id].role)}, force ${s.pnj[id].force}</span></p>`).join("") || "<p class=\"discret\">Pas encore d'équipage : recrute dans les tavernes.</p>"}
          <p class="discret petit">Rôles utiles : navigateur et voiles (moins de tempêtes), charpentier (répare en mer), canonnier (+4 à l'abordage), médecin (pas de séquelles), cuisinier et musicien (le moral baisse moins vite).</p>
          ${s.navire ? `<p class="petit">Améliorations : ${Object.keys(s.navire.ameliorations || {}).map(k => AMELIORATIONS[k].nom).join(", ") || "aucune (chantier de Water Seven, armurerie de Loguetown)"}</p>` : ""}
          ${s.carriere.territoires?.length ? `<p class="petit">Territoires : ${s.carriere.territoires.map(i => ILES[i].nom).join(", ")}</p>` : ""}
          <button class="secondaire" id="renommer">Renommer l'équipage</button>`
        : `<p>Aucune carrière.${age(s) >= 16 ? " La Marine recrute à la base de Shells Town ; avec un navire, tu peux aussi hisser le pavillon pirate." : ""}</p>`}
      ${s.prime ? `<p class="m-échouée">Avis de recherche : ${s.prime.toLocaleString("fr-FR")} Berrys</p>` : ""}
      ${s.prison ? `<p>En prison jusqu'au jour ${s.prison.jusqua + 1} (encore ${s.prison.jusqua - s.jour} jours).</p>` : ""}</section>
    <section class="carte"><h2>Famille</h2>
      ${s.famille.partenaire ? `<p>${s.famille.statut === "marié" ? "Marié·e à" : "En couple avec"} ${esc(s.pnj[s.famille.partenaire].nom)}</p>` : "<p>Célibataire.</p>"}
      ${s.famille.grossesse ? `<p class="discret">Un enfant est attendu dans ${s.famille.grossesse.terme - s.jour} jours.</p>` : ""}
      ${s.famille.enfants.map(e => `<p>${esc(e.prenom)} · ${Math.floor((s.jour - e.naissance) / 365)} ans</p>`).join("")}
      ${s.ancetres.length ? `<p class="discret">Génération ${s.generation} · ancêtres : ${s.ancetres.map(a => `${esc(a.prenom)} (${a.age} ans)`).join(", ")}</p>` : ""}</section>
    <section class="carte"><h2>Le monde</h2>
      <p class="discret">Avis de recherche affichés dans ta région :</p>
      ${s.monde.rivaux.filter(r => r.actif && r.region === regionDe(s.ile)).sort((a, b) => b.prime - a.prime).slice(0, 5)
        .map(r => `<p>${esc(r.capitaine)} · <span class="discret">${esc(r.nom)}</span> · <b>${r.prime.toLocaleString("fr-FR")} ฿</b></p>`).join("") || "<p>Aucun.</p>"}
      <p class="discret">Dernières nouvelles :</p>
      ${s.journal.filter(e => e.type === "rumeur").slice(-5).reverse().map(e => `<p class="petit">${esc(e.texte)}</p>`).join("") || "<p>Rien de neuf.</p>"}</section>
    <section class="carte"><h2>Réputation</h2>
      ${Object.entries(FACTIONS).map(([k, n]) => { const v = s.reputation?.[k] || 0; return `<div class="stat"><span>${n}</span><span class="barre"><i style="width:${(v + 100) / 2}%;background:${v < 0 ? "var(--ko)" : "var(--ok)"}"></i></span><b>${v > 0 ? "+" : ""}${v}</b></div>`; }).join("")}</section>
    <section class="carte"><h2>Chronologie</h2>
      <p class="discret">Époque : ${ERES[s.chrono.ere].nom}. Dates approximatives.</p>
      ${CALENDRIER.filter(ev => s.chrono.faits[ev.id]).map(ev => `<p class="petit"><b>${anneeTexte(ev.annee)}</b> · ${esc(typeof ev.texte === "function" ? ev.texte(s) : ev.texte)}</p>`).join("") || "<p>Aucun grand événement pour l'instant.</p>"}
      ${s.chrono.divergences.bras_shanks ? `<p class="m-réussie">Divergence : grâce à toi, Shanks a gardé ses deux bras. Le futur n'est plus celui du canon.</p>` : ""}</section>
    <section class="carte"><h2>Succès de cette vie</h2>
      <p>${Object.keys(s.succes || {}).map(k => SUCCES[k]?.[0]).filter(Boolean).join(" · ") || "Aucun pour l'instant."}</p>
      <p class="discret">${Object.keys(s.succes || {}).length}/${Object.keys(SUCCES).length}</p></section>
    <section class="carte"><h2>Missions</h2>
      ${missions.length ? missions.map(m => `<div class="mission"><b>${esc(m.titre)}</b> · <span class="m-${m.statut}">${m.statut}</span>
        <p class="discret">${esc(m.condition)} Récompense : ${m.recompense} Berrys${m.statut === "active" ? ` (mise de côté) · échéance fin du jour ${m.echeance + 1}` : ""}.</p></div>`).join("") : "<p>Aucune mission.</p>"}</section>`;
  if ($("#renommer")) $("#renommer").onclick = () => {
    const n = prompt("Nouveau nom de ton équipage :", s.carriere?.equipage || "");
    if (!n) return;
    const r = agir(s, { id: "renommer", cible: n }); sauver(); alerte(r.texte); rendre();
  };
}

function rendreJournal() {
  const e = s.journal.slice(-150).reverse();
  $("#contenu").innerHTML = `<section class="carte"><h2>Journal</h2>${e.map(x =>
    `<p class="e-${x.type}"><span class="discret">A${Math.floor(x.jour / 365) + 1} J${(x.jour % 365) + 1}</span> ${esc(x.texte)}</p>`).join("")}</section>`;
}

function rendreMenu() {
  $("#contenu").innerHTML = `
    <section class="carte"><h2>Partie</h2>
      <p class="discret">Sauvegarde automatique après chaque action. Le monde est figé quand tu quittes l'app. Version ${VERSION_APP}.</p>
      <button class="secondaire" id="exporter">Exporter la sauvegarde</button>
      <button class="secondaire" id="accueil">Changer de vie</button></section>
    <section class="carte"><h2>Affichage et sons</h2>
      <label for="taille">Taille du texte</label>
      <select id="taille"><option value="normal">Normale</option><option value="grand">Grande</option><option value="tresgrand">Très grande</option></select>
      <label class="case"><input type="checkbox" id="contraste"> Contraste renforcé</label>
      <label class="case"><input type="checkbox" id="sons"> Sons</label>
      <label class="case"><input type="checkbox" id="ambiance"> Ambiance de la mer</label>
      <button class="secondaire" id="tuto">Revoir le tutoriel</button>
      <p class="discret petit">Les vibrations ne sont pas possibles : Safari sur iPhone ne les autorise pas aux sites web.</p></section>
    <section class="carte"><h2>IA (facultative)</h2>${htmlReglages()}</section>`;
  const r = lireAffichage();
  $("#taille").value = r.texte; $("#contraste").checked = r.contraste; $("#sons").checked = r.sons; $("#ambiance").checked = r.ambiance;
  const maj = () => { ecrireAffichage({ texte: $("#taille").value, contraste: $("#contraste").checked, sons: $("#sons").checked, ambiance: $("#ambiance").checked }); if ($("#ambiance").checked) demarrerAmbiance(); };
  ["#taille", "#contraste", "#sons", "#ambiance"].forEach(sel => ($(sel).onchange = maj));
  $("#tuto").onclick = () => afficherTutoriel(true);
  $("#accueil").onclick = ecranAccueil;
  $("#exporter").onclick = async () => {
    const data = serialiser(s);
    const f = new File([data], `one-piece-life-${s.perso.prenom}.json`, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] });
      else { await navigator.clipboard.writeText(data); alerte("Sauvegarde copiée dans le presse-papiers."); }
    } catch {}
  };
  brancherReglages();
}

function htmlReglages() {
  const c = lireConfig();
  return `
    <p class="discret">Sans IA, le jeu marche hors ligne avec les boutons et une saisie simple. Avec une clé Gemini gratuite (aistudio.google.com → « Get API key »), l'IA comprend tes phrases et raconte les scènes. Elle ne décide jamais des résultats. La clé reste sur ton iPhone.</p>
    <label class="case"><input type="checkbox" id="ia-actif" ${c.actif ? "checked" : ""}> Activer l'IA en ligne</label>
    <label for="ia-cle">Clé API Gemini</label>
    <input id="ia-cle" type="password" value="${esc(c.cle)}" placeholder="AIza…" autocomplete="off">
    <label for="ia-modele">Modèle</label>
    <input id="ia-modele" value="${esc(c.modele || MODELE_DEFAUT)}">
    <button class="secondaire" id="ia-tester">Enregistrer et tester</button>
    <p id="ia-etat" class="discret"></p>`;
}
function brancherReglages() {
  const b = $("#ia-tester");
  if (!b) return;
  const enregistrer = () => ecrireConfig({ actif: $("#ia-actif").checked, cle: $("#ia-cle").value.trim(), modele: $("#ia-modele").value.trim() || MODELE_DEFAUT });
  $("#ia-actif").onchange = () => { enregistrer(); if (s) rendreStatut(); };
  b.onclick = async () => {
    enregistrer();
    $("#ia-etat").textContent = "Test en cours…";
    try { $("#ia-etat").textContent = (await testerCle()) ? "L'IA répond. Tout est prêt." : "Réponse inattendue de l'IA."; }
    catch (e) { $("#ia-etat").textContent = `Échec : ${e.message}`; }
    if (s) rendreStatut();
  };
}

function alerte(t) {
  const d = document.createElement("div"); d.className = "toast"; d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 4000);
}

// Mises à jour : on vérifie au lancement et à chaque retour dans l'app ; si une nouvelle version
// s'installe, la page se recharge d'elle-même (la partie est déjà sauvegardée).
if ("serviceWorker" in navigator) {
  const avaitControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then(reg => {
    reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch(() => {});
  let recharge = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!avaitControleur || recharge) return;
    recharge = true; sauver(); location.reload();
  });
}
appliquerAffichage();
ecranAccueil();
