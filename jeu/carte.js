// Carte interactive du monde : on touche une île pour voir le trajet (durée, prix, dangers, ce qui manque)
// et embarquer. Schématique : East Blue en bas, Grand Line au milieu, la Red Line, puis le Nouveau Monde.

import { ILES, LIEUX, ROUTES, infoVoyage, lieuxAccessibles, age } from "./engine.js";
import { regionDe } from "./monde.js";
import { routeOuverte } from "./finale.js";

// Position de chaque île sur la carte (repère 360 × 410).
export const POSITIONS = {
  fuchsia: [62, 374], shells: [142, 348], baratie: [224, 377], loguetown: [296, 340],
  cap: [304, 295], little_garden: [222, 268], water_seven: [132, 254], sabaody: [70, 222],
  hommes_poissons: [70, 187],
  dressrosa: [92, 149], zou: [186, 163], whole_cake: [286, 143], wano: [176, 111], egghead: [266, 82], elbaf: [150, 50], laugh_tale: [58, 27],
};
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const Maj = t => t[0].toUpperCase() + t.slice(1);
const visible = (s, ile) => ile !== "laugh_tale" || routeOuverte(s) || s.ile === "laugh_tale";

// Plus court chemin d'île en île (pour indiquer par où passer).
export function chemin(depart, arrivee) {
  const file = [[depart]]; const vus = new Set([depart]);
  while (file.length) {
    const c = file.shift(); const ici = c.at(-1);
    if (ici === arrivee) return c;
    for (const v of Object.keys(ROUTES[ici] || {})) if (!vus.has(v)) { vus.add(v); file.push([...c, v]); }
  }
  return null;
}

function marques(s, ile) {
  const m = [];
  if (LIEUX[s.foyer || "maison"].ile === ile) m.push("ton foyer");
  if (s.proprietes?.some(l => LIEUX[l].ile === ile)) m.push("une maison à toi");
  if (s.commerce?.ile === ile) m.push("ton commerce");
  const c = s.carriere;
  if (c?.type === "marine" && (c.poste || "shells") === ile) m.push("ton poste");
  if (c?.territoires?.includes(ile)) m.push("sous ta protection");
  if (c?.liberees?.includes(ile)) m.push("île libérée");
  else if (c?.cellules?.includes(ile)) m.push("une cellule");
  const k = c?.contrat && s.monde.rivaux.find(r => r.id === c.contrat && r.actif);
  if (k?.ile === ile) m.push(`ta cible, ${k.capitaine}`);
  return m;
}
const piratesConnus = (s, ile) => regionDe(ile) === regionDe(s.ile) ? s.monde.rivaux.filter(r => r.actif && r.ile === ile) : [];

export function carteHTML(s, selection) {
  const sel = selection && ILES[selection] && visible(s, selection) ? selection : s.ile;
  const vues = new Set();
  const lignes = [];
  for (const [a, dests] of Object.entries(ROUTES)) for (const b of Object.keys(dests)) {
    const cle = [a, b].sort().join("|");
    if (vues.has(cle) || !visible(s, a) || !visible(s, b)) continue;
    vues.add(cle);
    const directe = a === s.ile || b === s.ile;
    const [x1, y1] = POSITIONS[a], [x2, y2] = POSITIONS[b];
    lignes.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="route${directe ? " directe" : ""}"/>`);
  }
  const iles = Object.keys(ILES).filter(i => visible(s, i)).map(i => {
    const [x, y] = POSITIONS[i];
    const ici = i === s.ile, joignable = i in (ROUTES[s.ile] || {});
    const info = joignable ? infoVoyage(s, i) : null;
    const etat = ici ? "ici" : joignable ? (info.obstacle ? "bloquee" : "ouverte") : "loin";
    const nom = Maj(ILES[i].nom.replace(/^(le |la |l'|les )/i, "").replace("archipel ", "")).replace("Île des Hommes-Poissons", "Hommes-Poissons");
    const gauche = x > 250;
    return `<g class="ile ${etat}${i === sel ? " choisie" : ""}" data-ile="${i}" role="button" tabindex="0" aria-label="${esc(ILES[i].nom)}">
      <circle cx="${x}" cy="${y}" r="24" class="zone"/>
      ${ici ? `<circle cx="${x}" cy="${y}" r="15" class="halo"/>` : ""}
      <circle cx="${x}" cy="${y}" r="${ici ? 9 : 7}" class="point"/>
      ${piratesConnus(s, i).length ? `<circle cx="${x + 9}" cy="${y - 9}" r="4" class="pirates"/>` : ""}
      ${marques(s, i).length ? `<circle cx="${x - 9}" cy="${y - 9}" r="4" class="marque"/>` : ""}
      <text x="${gauche ? x - 13 : x + 13}" y="${y + 4}" text-anchor="${gauche ? "end" : "start"}">${esc(nom)}</text>
    </g>`;
  }).join("");
  return `<section class="carte-monde">
    <svg viewBox="0 0 360 410" role="group" aria-label="Carte du monde">
      <rect x="0" y="322" width="360" height="88" class="mer eb"/>
      <rect x="0" y="204" width="360" height="118" class="mer gl"/>
      <rect x="0" y="0" width="360" height="176" class="mer nm"/>
      <rect x="0" y="176" width="360" height="28" class="redline"/>
      <text x="352" y="404" class="region" text-anchor="end">EAST BLUE</text>
      <text x="8" y="316" class="region">GRAND LINE</text>
      <text x="352" y="194" class="region rl" text-anchor="end">RED LINE</text>
      <text x="352" y="16" class="region" text-anchor="end">NOUVEAU MONDE</text>
      <text x="352" y="316" class="repere" text-anchor="end">Reverse Mountain ▲</text>
      ${lignes.join("")}
      ${iles}
    </svg>
    <p class="legende"><span class="l-ici"></span>toi <span class="l-ouverte"></span>accessible <span class="l-bloquee"></span>il manque quelque chose <span class="l-pirates"></span>pirates signalés <span class="l-marque"></span>à toi</p>
    ${detailHTML(s, sel)}
  </section>`;
}

function detailHTML(s, ile) {
  const I = ILES[ile];
  const m = marques(s, ile), p = piratesConnus(s, ile);
  const plus = `${m.length ? `<p class="petit">Ici : ${m.map(esc).join(", ")}.</p>` : ""}${p.length ? `<p class="petit pirates-txt">Pirates signalés : ${p.map(r => `${esc(r.capitaine)} (${Math.round(r.prime / 1000000)} M฿)`).join(", ")}.</p>` : ""}`;
  const tete = `<h2>${esc(Maj(I.nom))}</h2><p class="discret">${esc(Maj(I.desc))}.</p>${plus}`;
  if (ile === s.ile) {
    const lieux = s.prison || s.combat || age(s) < 3 ? [] : lieuxAccessibles(s).filter(l => l !== s.lieu);
    return `<div class="detail">${tete}<p><b>Tu es ici</b>, ${esc(LIEUX[s.lieu].a)}.</p>
      ${lieux.length ? `<div class="lieux">${lieux.map(l => `<button class="chip" data-carte-aller="${l}">${esc(LIEUX[l].court)}</button>`).join("")}</div>` : ""}</div>`;
  }
  const v = infoVoyage(s, ile);
  if (v.horsRoute) {
    const c = chemin(s.ile, ile);
    const etapes = c ? c.slice(1).filter(i => ile === "laugh_tale" || i !== "laugh_tale").map(i => Maj(ILES[i].nom)) : null;
    return `<div class="detail">${tete}<p>Pas de route directe depuis ${esc(I.nom === ILES[s.ile].nom ? "ici" : ILES[s.ile].nom)}.</p>
      ${etapes ? `<p class="petit">Itinéraire : ${etapes.map(esc).join(" → ")} (${c.slice(1).reduce((t, i, k) => t + ROUTES[c[k]][i], 0)} jours de mer en tout).</p>
      <button class="secondaire" data-carte-choisir="${c[1]}">Voir la première étape : ${esc(Maj(ILES[c[1]].nom))}</button>` : ""}</div>`;
  }
  const comment = v.mode === "nage" ? "à la nage" : v.mode === "passager" ? "comme passager" : `à bord de « ${esc(s.navire.nom)} »`;
  const prix = v.prix ? `${v.prix} Berrys` : "gratuit";
  const verbe = v.mode === "nage" ? "Nager jusque-là" : v.mode === "passager" ? "Embarquer" : "Lever l'ancre";
  const auPort = s.lieu === ILES[s.ile].port;
  return `<div class="detail">${tete}
    <p><b>${v.jours} jour${v.jours > 1 ? "s" : ""} de mer</b> ${comment} · ${prix}</p>
    ${v.passage ? `<p class="petit danger-txt">Passage dangereux : ${esc(v.passage)}. Un naufrage est possible.</p>` : ""}
    ${v.obstacle ? `<p class="obstacle">${esc(v.obstacle)}</p>` : `<button class="principal" data-carte-partir="${ile}">${verbe}${auPort ? "" : " (départ du port)"}</button>`}
  </div>`;
}
