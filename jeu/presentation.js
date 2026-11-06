// Étape 7 · La présentation : illustrations dessinées en code (originales), sons synthétisés,
// tutoriel d'accueil et réglages de lisibilité. Aucune image ni musique tirée de One Piece.

// ---------- Réglages d'affichage et de son (propres à cet iPhone) ----------

const CLE = "opl-affichage";
export function lireAffichage() {
  try { return { texte: "normal", contraste: false, sons: true, ambiance: false, ...JSON.parse(localStorage.getItem(CLE) || "{}") }; }
  catch { return { texte: "normal", contraste: false, sons: true, ambiance: false }; }
}
export function ecrireAffichage(r) { try { localStorage.setItem(CLE, JSON.stringify(r)); } catch {} appliquerAffichage(); }
export function appliquerAffichage() {
  const r = lireAffichage();
  document.documentElement.style.fontSize = { normal: "100%", grand: "115%", tresgrand: "130%" }[r.texte] || "100%";
  document.documentElement.toggleAttribute("data-contraste", !!r.contraste);
  if (!r.ambiance) arreterAmbiance();
}

// ---------- Sons (Web Audio, rien à télécharger) ----------

let ctx = null;
function audio() {
  if (!lireAffichage().sons) return null;
  try { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; } catch { return null; }
}
function note(freq, debut, duree, { type = "sine", volume = 0.08 } = {}) {
  const c = audio(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + debut);
  g.gain.linearRampToValueAtTime(volume, c.currentTime + debut + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + debut + duree);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + debut); o.stop(c.currentTime + debut + duree + 0.05);
}
export const sons = {
  appui: () => note(660, 0, 0.06, { type: "triangle", volume: 0.04 }),
  succes: () => { note(523, 0, 0.15); note(659, 0.1, 0.15); note(784, 0.2, 0.3); },
  echec: () => { note(220, 0, 0.18, { type: "square", volume: 0.03 }); note(180, 0.12, 0.25, { type: "square", volume: 0.03 }); },
  temps: () => { note(392, 0, 0.3, { volume: 0.05 }); note(294, 0.15, 0.4, { volume: 0.05 }); },
  evenement: () => { note(440, 0, 0.12); note(554, 0.12, 0.2); },
};

let ambiance = null;
export function demarrerAmbiance() {
  const c = audio(); if (!c || ambiance || !lireAffichage().ambiance) return;
  // Ressac : bruit filtré dont le volume ondule lentement.
  const tampon = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = tampon; src.loop = true;
  const filtre = c.createBiquadFilter(); filtre.type = "lowpass"; filtre.frequency.value = 500;
  const g = c.createGain(); g.gain.value = 0.02;
  const lfo = c.createOscillator(); lfo.frequency.value = 0.12;
  const lfoG = c.createGain(); lfoG.gain.value = 0.015;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(filtre).connect(g).connect(c.destination);
  src.start(); lfo.start();
  ambiance = { src, lfo };
}
export function arreterAmbiance() { if (!ambiance) return; try { ambiance.src.stop(); ambiance.lfo.stop(); } catch {} ambiance = null; }

// ---------- Illustrations de scène (SVG dessiné en code) ----------

const PALETTES = {
  eb: ["#7ec8e3", "#2a7bb5", "#f6d38b"],
  gl: ["#9b8fd9", "#2b5f9e", "#f0b27a"],
  nm: ["#e07a5f", "#3d2c5e", "#f2cc8f"],
  mer: ["#0b3a5c", "#05223a", "#2aa198"],
};
function ciel(heure) {
  if (heure < 7 || heure >= 21) return ["#0b1a33", "#23345e"];
  if (heure < 9) return ["#f5b68c", "#9ec9e8"];
  if (heure >= 18) return ["#f08a5d", "#6a4c93"];
  return null;
}
function decor(lieu, ile) {
  const L = lieu || "";
  if (ile === "hommes_poissons") return `<circle cx="300" cy="40" r="130" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
    ${[40, 90, 150, 220, 270].map((x, i) => `<path d="M${x} 150 q -6 -${20 + i * 6} 4 -${40 + i * 8} q 8 ${20} -2 ${40 + i * 8}z" fill="#ff8fa3" opacity=".7"/>`).join("")}
    ${[60, 130, 200, 250].map((x, i) => `<circle cx="${x}" cy="${40 + i * 12}" r="${3 + i}" fill="rgba(255,255,255,.5)"/>`).join("")}`;
  if (L === "jungle") return `${[20, 70, 130, 190, 250, 300].map((x, i) => `<path d="M${x} 150 v-${50 + (i % 3) * 15}" stroke="#2d5016" stroke-width="5"/><ellipse cx="${x}" cy="${95 - (i % 3) * 15}" rx="26" ry="14" fill="#3f7d20"/>`).join("")}
    <path d="M220 150 q 10 -40 40 -45 q 15 0 20 10 l -10 4 q -20 -4 -28 30z" fill="#5a4630"/>`;
  if (L === "colisee") return `<path d="M40 150 v-55 q 120 -40 240 0 v55z" fill="#c9a66b"/>${[60, 100, 140, 180, 220, 260].map(x => `<path d="M${x} 150 v-30 q 12 -14 24 0 v30z" fill="#7a5c33"/>`).join("")}`;
  if (ile === "wano") return `<path d="M0 150 l70 -90 l70 90z" fill="#5b4b8a"/><path d="M230 150 v-70 h60 v70z" fill="#8c2f39"/><path d="M220 82 h80 l-40 -22z" fill="#2b2d42"/><path d="M150 40 v110" stroke="#cfe8ff" stroke-width="12" opacity=".6"/>`;
  if (ile === "water_seven") return `<path d="M0 150 h320 v-6 h-320z" fill="#58a4b0"/>${[30, 90, 150, 210, 270].map((x, i) => `<rect x="${x}" y="${80 - (i % 2) * 20}" width="40" height="${70 + (i % 2) * 20}" fill="#e9dcc9"/><rect x="${x + 14}" y="${120}" width="12" height="30" fill="#7b5e57"/>`).join("")}
    <path d="M140 60 q 20 -40 40 0" stroke="#5c7cfa" stroke-width="6" fill="none"/>`;
  if (ile === "sabaody") return `${[40, 120, 210, 290].map((x, i) => `<path d="M${x} 150 v-${70 + i * 8}" stroke="#7d5a3c" stroke-width="16"/><ellipse cx="${x}" cy="${75 - i * 8}" rx="40" ry="18" fill="#6a994e"/>`).join("")}
    ${[80, 160, 250].map((x, i) => `<circle cx="${x}" cy="${50 + i * 15}" r="${10 + i * 3}" fill="rgba(255,255,255,.35)" stroke="rgba(255,255,255,.7)"/>`).join("")}`;
  if (ile === "little_garden") return `<path d="M0 150 q 80 -70 160 -40 t 160 -30 v70z" fill="#3f7d20"/><path d="M60 110 l 10 -40 l 10 40" fill="#2d5016"/><path d="M250 100 q10 -25 22 0" stroke="#e9c46a" stroke-width="5" fill="none"/>`;
  if (ile === "cap") return `<path d="M0 150 q 120 -30 200 -20 l 120 20z" fill="#6c757d"/><rect x="230" y="60" width="18" height="70" fill="#f8f9fa"/><rect x="230" y="60" width="18" height="12" fill="#e63946"/><path d="M0 70 l 60 -60 l 50 80z" fill="#495057" opacity=".8"/>`;
  if (L.startsWith("port") || L.startsWith("quai") || L === "pont_baratie" || L === "mangroves" || L === "phare" || L === "rivage_lg" || L === "cote_wano") return `<path d="M0 150 h320 v-20 h-320z" fill="#8d6e63"/>
    <path d="M180 128 q 40 15 100 0 l -10 -18 h-80z" fill="#6d4c41"/><path d="M228 110 v-70" stroke="#4e342e" stroke-width="4"/><path d="M230 45 q 30 20 0 55z" fill="#fefae0"/>
    ${[40, 90].map(x => `<path d="M${x} 130 v-25" stroke="#5d4037" stroke-width="4"/>`).join("")}`;
  if (L === "base") return `<rect x="70" y="60" width="180" height="90" fill="#e9ecef"/><rect x="140" y="30" width="40" height="40" fill="#dee2e6"/><path d="M160 30 v-20" stroke="#495057" stroke-width="3"/><path d="M162 12 h20 v10 h-20z" fill="#1d3557"/>`;
  if (L === "colline" || L === "echafaud") return L === "echafaud"
    ? `<path d="M0 150 h320 v-10 h-320z" fill="#adb5bd"/><path d="M130 140 v-80 h60 v80" stroke="#5c4033" stroke-width="8" fill="none"/><path d="M120 60 h80" stroke="#5c4033" stroke-width="8"/>`
    : `<path d="M0 150 q 100 -90 200 -50 t 120 -10 v60z" fill="#74a57f"/><path d="M200 60 v-30" stroke="#5c4033" stroke-width="6"/><circle cx="200" cy="30" r="22" fill="#4f772d"/>`;
  // Village ou ville par défaut : maisons aux toits colorés.
  return [20, 80, 140, 200, 260].map((x, i) => `<rect x="${x}" y="${100 - (i % 3) * 8}" width="44" height="${50 + (i % 3) * 8}" fill="#f1e3c6"/><path d="M${x - 4} ${100 - (i % 3) * 8} l26 -22 l26 22z" fill="${["#c0392b", "#2980b9", "#d68910", "#16a085", "#8e44ad"][i]}"/><rect x="${x + 16}" y="125" width="12" height="25" fill="#7b5e57"/>`).join("");
}
export function sceneSVG(ile, lieu, region, heure) {
  const sousMarin = ile === "hommes_poissons";
  const [c1, c2, sable] = sousMarin ? PALETTES.mer : PALETTES[region] || PALETTES.eb;
  const c = !sousMarin && ciel(heure);
  const haut = c ? c[0] : sousMarin ? "#0b3a5c" : c1;
  const bas = c ? c[1] : sousMarin ? "#05223a" : "#d9f0ff";
  const nuit = c && (heure < 7 || heure >= 21);
  return `<svg class="illustration" viewBox="0 0 320 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${haut}"/><stop offset="1" stop-color="${bas}"/></linearGradient></defs>
    <rect width="320" height="150" fill="url(#ciel)"/>
    ${sousMarin ? "" : nuit ? `<circle cx="270" cy="30" r="12" fill="#fefae0"/>${[30, 80, 140, 190].map((x, i) => `<circle cx="${x}" cy="${15 + i * 7}" r="1.4" fill="#fff"/>`).join("")}` : `<circle cx="270" cy="32" r="16" fill="#ffd166" opacity=".9"/>`}
    ${sousMarin ? "" : `<path d="M0 118 q 40 -6 80 0 t 80 0 t 80 0 t 80 0 v32 h-320z" fill="${c2}" opacity=".85"/>`}
    ${decor(lieu, ile)}
    ${sousMarin ? "" : `<path d="M0 146 h320 v4 h-320z" fill="${sable}" opacity=".6"/>`}
  </svg>`;
}

// ---------- Tutoriel ----------

const CLE_TUTO = "opl-tuto-vu";
const ETAPES = [
  ["Bienvenue !", "Tu vas vivre une vie entière dans le monde de One Piece, de la naissance à la mort. Le monde vit sa vie autour de toi."],
  ["Agir", "Touche les grands boutons pour agir : t'entraîner, travailler, partir en mer… Touche un habitant dans la carte de scène pour lui parler."],
  ["Le temps", "En bas, « Dormir », « +1 sem. », « +1 mois » font avancer le temps. Un événement important l'interrompt et te demande une décision."],
  ["Ta fiche", "L'onglet Fiche montre ta personnalité, ta réputation, tes succès, les nouvelles du monde et la chronologie. Bonne vie !"],
];
export function tutorielVu() { try { return !!localStorage.getItem(CLE_TUTO); } catch { return true; } }
export function afficherTutoriel(forcer = false) {
  if (!forcer && tutorielVu()) return;
  let i = 0;
  const fond = document.createElement("div");
  fond.className = "tuto"; fond.setAttribute("role", "dialog"); fond.setAttribute("aria-modal", "true");
  const rendre = () => {
    fond.innerHTML = `<div class="tuto-carte"><div class="tuto-pas">${i + 1} / ${ETAPES.length}</div><h2>${ETAPES[i][0]}</h2><p>${ETAPES[i][1]}</p>
      <div class="tuto-boutons"><button class="secondaire" data-tuto="passer">Passer</button><button class="principal" data-tuto="suivant">${i === ETAPES.length - 1 ? "C'est parti" : "Suivant"}</button></div></div>`;
    fond.querySelector('[data-tuto="passer"]').onclick = fermer;
    fond.querySelector('[data-tuto="suivant"]').onclick = () => { if (++i >= ETAPES.length) fermer(); else rendre(); };
  };
  const fermer = () => { try { localStorage.setItem(CLE_TUTO, "1"); } catch {} fond.remove(); };
  rendre();
  document.body.appendChild(fond);
}

// Petite animation pendant une ellipse.
export function animationTemps(texte) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const d = document.createElement("div");
  d.className = "voile-temps"; d.innerHTML = `<div class="sablier">⏳</div><div>${texte}</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("fin"), 450);
  setTimeout(() => d.remove(), 800);
}
