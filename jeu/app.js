import {
  nouvelleVie, agir, avancer, actionsDisponibles, interpreterTexte, serialiser, deserialiser,
  age, annee, jourDansAnnee, LIEUX, ILES, STATS, COMPETENCES, OBJETS, pnjIci, faitsPourNarration,
  migrer, lieuxDe, heritiers, succeder, RANGS_MARINE, MERITE_RANG, agePnj, FRUITS, NAVIRES, equipage, puissance,
} from "./engine.js";
import { lireConfig, ecrireConfig, iaActive, interpreter, narrer, testerCle, MODELE_DEFAUT } from "./ia.js";

const CLE_INDEX = "opl-jeu-mondes";
const cleMonde = id => `opl-jeu-monde-${id}`;
const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let s = null;
let occupe = false;
let onglet = "jeu";

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

// ---------- Écrans ----------

function ecranAccueil() {
  s = null;
  const ix = lireIndex();
  $("#app").innerHTML = `
    <header class="titre"><h1>One Piece Life</h1><p>Une vie entière dans le monde de One Piece.</p></header>
    <section class="carte">
      <h2>Nouvelle vie</h2>
      <label for="prenom">Prénom</label>
      <input id="prenom" maxlength="24" placeholder="Ton prénom" autocomplete="off">
      <label for="genre">Tu es</label>
      <select id="genre"><option value="g">un garçon</option><option value="f">une fille</option><option value="x">non précisé</option></select>
      <button id="naitre" class="principal">Naître à Fuchsia</button>
      <p class="discret">Ta vie commence à la naissance, dans le village de Fuchsia, sur l'île de Dawn (East Blue). Chaque vie est un monde indépendant.</p>
    </section>
    ${ix.length ? `<section class="carte"><h2>Continuer</h2>${ix.map(m => `
      <div class="ligne-vie"><button class="secondaire" data-ouvrir="${esc(m.id)}">${esc(m.prenom)} · ${m.vivant ? `${m.age} ans` : "vie terminée"}</button>
      <button class="icone" data-suppr="${esc(m.id)}" aria-label="Supprimer">✕</button></div>`).join("")}</section>` : ""}
    <section class="carte"><h2>Réglages</h2>${htmlReglages()}</section>`;
  $("#naitre").onclick = () => {
    const prenom = $("#prenom").value.trim() || ["Kai", "Lena", "Sora", "Milo", "Nami"][Math.floor(Math.random() * 5)];
    s = nouvelleVie({ prenom, genre: $("#genre").value, seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0 });
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
    ecrireIndex(lireIndex().filter(m => m.id !== b.dataset.suppr)); ecranAccueil();
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
}

function rendre() {
  document.querySelectorAll("[data-onglet]").forEach(b => b.classList.toggle("actif", b.dataset.onglet === onglet));
  rendreStatut();
  ({ jeu: rendreVivre, fiche: rendreFiche, journal: rendreJournal, menu: rendreMenu })[onglet]();
}

function rendreStatut() {
  const sante = s.prison ? "En prison" : s.sante.blessures.length ? `Blessé` : "En forme";
  $("#statut").innerHTML = `
    <div><strong>${esc(s.perso.prenom)}</strong> · ${age(s)} an${age(s) > 1 ? "s" : ""}</div>
    <div class="discret">Année ${annee(s)}, jour ${jourDansAnnee(s)} · ${Math.floor(s.heure)}h · ${ILES[s.ile].nom} · ${LIEUX[s.lieu].court}</div>
    <div class="jauges"><span>${s.berrys} ฿</span><span>Fatigue ${s.fatigue}</span><span>${sante}</span>${s.prime ? `<span class="prime">Prime ${s.prime.toLocaleString("fr-FR")} ฿</span>` : ""}${iaActive() ? `<span class="ia">IA</span>` : ""}</div>`;
}

const TYPES_VISIBLES = new Set(["naissance", "recit", "action", "refus", "ellipse", "monde", "sante", "mission", "age", "mort", "narration", "parole", "voyage", "famille"]);

function rendreVivre() {
  const recents = s.journal.filter(e => TYPES_VISIBLES.has(e.type)).slice(-14);
  const actions = actionsDisponibles(s);
  const ici = pnjIci(s).map(id => s.pnj[id].nom);
  const enfant = age(s) < 6;
  $("#contenu").innerHTML = `
    <section class="recit" id="recit">${recents.map(e => `<p class="e-${e.type}">${esc(e.texte)}</p>`).join("")}</section>
    ${s.perso.vivant ? `
    ${enfant ? "" : `<form class="saisie" id="saisie">
      <input id="texte" placeholder="Que fais-tu ? (ex. « je vais au port et je travaille avec Bern »)" autocomplete="off">
      <button class="principal" type="submit">OK</button>
    </form>`}
    <section class="carte compacte">
      <p class="discret">${LIEUX[s.lieu].nom[0].toUpperCase() + LIEUX[s.lieu].nom.slice(1)}${ici.length ? ` · ${ici.join(", ")}` : " · personne"}</p>
      <div class="boutons">${actions.map((a, i) => `<button data-action="${i}">${esc(a.label)}</button>`).join("")}</div>
      <div class="lieux">${lieuxDe(s.ile).filter(id => id !== s.lieu).map(id => `<button class="secondaire" data-aller="${id}">${LIEUX[id].court}</button>`).join("")}</div>
      <div class="boutons temps">
        <button class="secondaire" data-temps="repos">Dormir</button>
        <button class="secondaire" data-temps="7">+1 semaine</button>
        <button class="secondaire" data-temps="30">+1 mois</button>
        ${age(s) < 16 ? `<button class="secondaire" data-temps="365">+1 an</button>` : ""}
      </div>
    </section>
` : `<section class="carte"><h2>Fin de vie</h2><p>${esc(s.perso.prenom)} a vécu ${age(s)} ans.</p>
      ${heritiers(s).map((e, i) => `<button class="principal" data-heritier="${i}">Continuer avec ${esc(e.prenom)} (${Math.floor((s.jour - e.naissance) / 365)} ans)</button>`).join("")}
      <button class="${heritiers(s).length ? "secondaire" : "principal"}" id="retour">Commencer une nouvelle vie</button></section>`}`;
  const r = $("#recit"); r.scrollTop = r.scrollHeight;
  document.querySelectorAll("[data-action]").forEach(b => b.onclick = () => jouer([actions[+b.dataset.action]]));
  document.querySelectorAll("[data-aller]").forEach(b => b.onclick = () => jouer([{ id: "aller", cible: b.dataset.aller }]));
  document.querySelectorAll("[data-temps]").forEach(b => b.onclick = () => {
    if (b.dataset.temps === "repos") return jouer([{ id: "repos" }]);
    temps(+b.dataset.temps);
  });
  if ($("#saisie")) $("#saisie").onsubmit = e => { e.preventDefault(); libre($("#texte").value.trim()); };
  if ($("#retour")) $("#retour").onclick = ecranAccueil;
  document.querySelectorAll("[data-heritier]").forEach(b => b.onclick = () => { succeder(s, +b.dataset.heritier); sauver(); rendre(); });
}

async function jouer(actions, { narrer: avecNarration = true } = {}) {
  if (occupe || !actions.length) return;
  occupe = true;
  const resultats = [];
  for (const a of actions) {
    const r = agir(s, a);
    resultats.push(r.texte);
    if (!r.ok || r.interruption) break; // une action impossible ou un événement important arrête la suite
  }
  sauver(); rendre();
  if (avecNarration && iaActive() && s.perso.vivant) await raconter(resultats.join(" "));
  occupe = false;
}

function temps(jours) {
  if (occupe) return;
  avancer(s, jours); sauver(); rendre();
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
      ${Object.entries(STATS).map(([k, l]) => `<div class="stat"><span>${l}</span>${barre(s.stats[k])}<b>${s.stats[k]}</b></div>`).join("")}
      <p class="discret">Chaque entraînement réussi rapporte toujours le même gain fixe.</p></section>
    <section class="carte"><h2>Compétences</h2>
      ${Object.entries(COMPETENCES).map(([k, l]) => `<div class="stat"><span>${l}</span>${barre(s.competences[k], 50)}<b>${s.competences[k]}</b></div>`).join("")}</section>
    <section class="carte"><h2>Santé</h2>
      ${s.sante.blessures.length ? s.sante.blessures.map(b => `<p>${esc(b.nom)} · guérison dans ${b.jours} jour${b.jours > 1 ? "s" : ""}</p>`).join("") : "<p>Aucune blessure.</p>"}
      ${s.sante.sequelles.length ? `<p class="discret">Séquelles : ${s.sante.sequelles.map(esc).join(", ")}</p>` : ""}</section>
    <section class="carte"><h2>Possessions</h2><p>${s.berrys} Berrys</p>
      <p>${Object.entries(s.inventaire).filter(([k, n]) => k !== "fruits" && n > 0).map(([k, n]) => `${n} ${n > 1 ? OBJETS[k].pluriel : OBJETS[k].nom}`).join(", ") || "Rien d'autre."}</p>
      ${s.inventaire.fruits.length ? `<p>Fruits du Démon non mangés : ${s.inventaire.fruits.map(f => FRUITS[f].nom).join(", ")}</p>` : ""}
      ${s.navire ? `<p>Navire : « ${esc(s.navire.nom)} », ${NAVIRES[s.navire.type].nom} (${NAVIRES[s.navire.type].capacite} places d'équipage)</p>` : ""}</section>
    <section class="carte"><h2>Pouvoir et combat</h2>
      <p>Puissance de combat : <b>${puissance(s)}</b></p>
      ${s.fruit ? `<p><b>${FRUITS[s.fruit.id].nom}</b> (${FRUITS[s.fruit.id].type}) : tu peux ${FRUITS[s.fruit.id].pouvoir}. Maîtrise ${s.fruit.maitrise}.</p><p class="discret">Tu ne sais plus nager.</p>` : "<p>Pas de Fruit du Démon.</p>"}</section>
    <section class="carte"><h2>Relations</h2>
      ${Object.entries(s.pnj).filter(([, p]) => !p.invisible && p.lieu !== "disparu" && (p.relation !== 0 || p.souvenirs.length || LIEUX[p.lieu]?.ile === s.ile)).map(([id, p]) => `<div class="stat"><span>${esc(p.nom)} <i class="discret">${esc(p.role)}${agePnj(s, id) != null ? `, ${agePnj(s, id)} ans` : ""}</i></span>${barre(Math.max(0, p.relation))}<b>${p.relation}</b></div>`).join("")}</section>
    <section class="carte"><h2>Carrière</h2>
      ${s.carriere?.type === "marine" ? `<p>${RANGS_MARINE[s.carriere.rang]} de la Marine · mérite ${s.carriere.merite}${s.carriere.rang < RANGS_MARINE.length - 1 ? ` / ${MERITE_RANG[s.carriere.rang + 1]} pour ${RANGS_MARINE[s.carriere.rang + 1]}` : ""}</p>`
        : s.carriere?.type === "pirate" ? `<p>Capitaine des <b>${esc(s.carriere.equipage)}</b> · ${s.carriere.raids} abordage${s.carriere.raids > 1 ? "s" : ""}</p>
          ${equipage(s).map(id => `<p>${esc(s.pnj[id].nom)} · <span class="discret">${esc(s.pnj[id].role)}, force ${s.pnj[id].force}</span></p>`).join("") || "<p class=\"discret\">Pas encore d'équipage : recrute dans les tavernes.</p>"}`
        : `<p>Aucune carrière.${age(s) >= 16 ? " La Marine recrute à la base de Shells Town ; avec un navire, tu peux aussi hisser le pavillon pirate." : ""}</p>`}
      ${s.prime ? `<p class="m-échouée">Avis de recherche : ${s.prime.toLocaleString("fr-FR")} Berrys</p>` : ""}
      ${s.prison ? `<p>En prison jusqu'au jour ${s.prison.jusqua + 1} (encore ${s.prison.jusqua - s.jour} jours).</p>` : ""}</section>
    <section class="carte"><h2>Famille</h2>
      ${s.famille.partenaire ? `<p>${s.famille.statut === "marié" ? "Marié·e à" : "En couple avec"} ${esc(s.pnj[s.famille.partenaire].nom)}</p>` : "<p>Célibataire.</p>"}
      ${s.famille.grossesse ? `<p class="discret">Un enfant est attendu dans ${s.famille.grossesse.terme - s.jour} jours.</p>` : ""}
      ${s.famille.enfants.map(e => `<p>${esc(e.prenom)} · ${Math.floor((s.jour - e.naissance) / 365)} ans</p>`).join("")}
      ${s.ancetres.length ? `<p class="discret">Génération ${s.generation} · ancêtres : ${s.ancetres.map(a => `${esc(a.prenom)} (${a.age} ans)`).join(", ")}</p>` : ""}</section>
    <section class="carte"><h2>Missions</h2>
      ${missions.length ? missions.map(m => `<div class="mission"><b>${esc(m.titre)}</b> · <span class="m-${m.statut}">${m.statut}</span>
        <p class="discret">${esc(m.condition)} Récompense : ${m.recompense} Berrys${m.statut === "active" ? ` (mise de côté) · échéance fin du jour ${m.echeance + 1}` : ""}.</p></div>`).join("") : "<p>Aucune mission.</p>"}</section>`;
}

function rendreJournal() {
  const e = s.journal.slice(-150).reverse();
  $("#contenu").innerHTML = `<section class="carte"><h2>Journal</h2>${e.map(x =>
    `<p class="e-${x.type}"><span class="discret">A${Math.floor(x.jour / 365) + 1} J${(x.jour % 365) + 1}</span> ${esc(x.texte)}</p>`).join("")}</section>`;
}

function rendreMenu() {
  $("#contenu").innerHTML = `
    <section class="carte"><h2>Partie</h2>
      <p class="discret">Sauvegarde automatique après chaque action. Le monde est figé quand tu quittes l'app.</p>
      <button class="secondaire" id="exporter">Exporter la sauvegarde</button>
      <button class="secondaire" id="accueil">Changer de vie</button></section>
    <section class="carte"><h2>IA (facultative)</h2>${htmlReglages()}</section>`;
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

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
ecranAccueil();
