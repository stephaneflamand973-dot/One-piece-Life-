// Simulateur de vies : joue automatiquement des vies entières pour repérer erreurs, impasses,
// déséquilibres et création d'argent. Chaque vie suit un objectif (Marine, pirate, chasseur de primes,
// vie paisible) ou joue au hasard, comme le ferait un joueur qui découvre le jeu.
// Usage : node outils/simuler.mjs [nombre de vies] [graine de départ]
import * as E from "../jeu/engine.js";

export const PLANS = ["marine", "pirate", "chasseur", "paisible", "hasard"];

// Trajet d'une île à l'autre (plus court chemin sur les routes maritimes).
function prochaineIle(depart, arrivee) {
  const file = [[depart]]; const vus = new Set([depart]);
  while (file.length) {
    const ch = file.shift(); const ici = ch.at(-1);
    if (ici === arrivee) return ch[1];
    for (const v of Object.keys(E.ROUTES[ici] || {})) if (!vus.has(v)) { vus.add(v); file.push([...ch, v]); }
  }
  return null;
}

function agent(s, plan, hasard) {
  const essayer = a => E.agir(s, a);
  const dispo = () => E.actionsDisponibles(s);
  const trouver = (id, cible) => dispo().find(a => a.id === id && (cible === undefined || a.cible === cible));
  const aller = lieu => {
    const ile = E.LIEUX[lieu].ile;
    if (ile !== s.ile) {
      if (s.lieu !== E.ILES[s.ile].port) return essayer({ id: "aller", cible: E.ILES[s.ile].port });
      const suivante = prochaineIle(s.ile, ile);
      return essayer({ id: "voyager", cible: suivante });
    }
    if (s.lieu !== lieu) return essayer({ id: "aller", cible: lieu });
    return null;
  };
  const gagner = montant => {
    // Travailler là où c'est possible, sinon rentrer au port de Fuchsia ou aux quais de Loguetown.
    const t = trouver("travailler");
    if (t) return essayer(t);
    const emploi = s.ile === "loguetown" ? "quais_logue" : s.ile === "baratie" ? "cuisine_baratie" : s.ile === "water_seven" ? "chantier" : "port";
    if (E.LIEUX[emploi].ile === s.ile) return aller(emploi) || essayer({ id: "repos" });
    return aller("quais_logue") || essayer({ id: "repos" });
  };

  // Les décisions d'abord (choix au hasard, comme un joueur hésitant).
  const decisions = dispo().filter(a => a.id === "choisir");
  if (decisions.length) return essayer(decisions[Math.floor(hasard() * decisions.length)]);
  const accepter = trouver("accepter"); if (accepter && hasard() < 0.5) return essayer(accepter);
  const accomplir = trouver("accomplir"); if (accomplir) return essayer(accomplir);
  if (s.fatigue >= 70 || s.heure >= 22) return essayer({ id: "repos" });
  const ag = E.age(s);
  if (ag < 16 || plan === "hasard") {
    const d = dispo().filter(x => !(x.id === "manger" && s.fruit) && x.id !== "trahir");
    if (!d.length || hasard() < 0.1) return essayer({ id: "repos" });
    return essayer(d[Math.floor(hasard() * d.length)]);
  }
  if (s.prison) return essayer(hasard() < 0.3 ? { id: "evader" } : { id: "attendre" });
  if (s.fruit === null && s.inventaire.fruits.length) return essayer({ id: "manger", cible: s.inventaire.fruits[0] });

  if (plan === "marine") {
    if (!s.carriere) {
      if (s.ile !== "shells" && s.berrys < 120) return gagner();
      if (s.stats.force + s.stats.endurance < 6) return essayer({ id: "entrainer", cible: "force" });
      return aller("base") || essayer({ id: "engager" });
    }
    return aller("base") || essayer(hasard() < 0.5 ? { id: "service" } : { id: "patrouille" });
  }
  if (plan === "pirate") {
    if (!s.navire) {
      if (s.berrys < 600) return gagner();
      if (s.ile !== "fuchsia") return aller("atelier");
      return aller("atelier") || essayer({ id: "acheter", cible: "barque" });
    }
    if (!s.carriere) return aller(E.ILES[s.ile].port) || essayer({ id: "pirate" });
    if (s.carriere.type !== "pirate") return essayer({ id: "repos" });
    const membres = Object.values(s.pnj).filter(p => p.lieu === "equipage").length;
    if (membres < 3 && hasard() < 0.4) { const tav = { fuchsia: "bar", shells: "taverne_shells", loguetown: "auberge_logue", baratie: "salle_baratie" }[s.ile]; if (tav) return aller(tav) || essayer({ id: "recruter" }); }
    if (hasard() < 0.05) { const r = Object.keys(E.ROUTES[s.ile]).filter(i => !E.estGrandLine(i) || s.inventaire.logpose); return aller(E.ILES[s.ile].port) || essayer({ id: "voyager", cible: r[Math.floor(hasard() * r.length)] }); }
    return aller(E.ILES[s.ile].port) || essayer({ id: "attaquer" });
  }
  if (plan === "chasseur") {
    if (!s.carriere) { if (s.ile !== "loguetown" && s.berrys < 120) return gagner(); return aller("bureau_primes") || essayer({ id: "chasseur" }); }
    if (s.carriere.type !== "chasseur") return essayer({ id: "repos" });
    const t = trouver("traquer"); if (t) return essayer(t);
    if (s.berrys < 120) return gagner();
    const iles = ["fuchsia", "shells", "baratie", "loguetown"].filter(i => i !== s.ile);
    return aller(E.ILES[s.ile].port) || essayer({ id: "voyager", cible: iles[Math.floor(hasard() * iles.length)] });
  }
  // Vie paisible : travailler, se lier, se marier, fonder une famille.
  const coeur = dispo().find(a => ["declarer", "mariage", "enfant", "famille"].includes(a.id));
  if (coeur && hasard() < 0.5) return essayer(coeur);
  if (s.famille.statut === "couple" && !s.inventaire.bague && s.berrys >= 300 && hasard() < 0.2) return aller("marche_logue") || essayer({ id: "acheter", cible: "bague" });
  const parler = dispo().filter(a => a.id === "parler");
  if (parler.length && hasard() < 0.4) return essayer(parler[Math.floor(hasard() * parler.length)]);
  return gagner();
}

export function jouerVie(seed, { maxJours = 120 * 365, plan } = {}) {
  const s = E.nouvelleVie({ prenom: "Sim", seed });
  plan ??= PLANS[seed % PLANS.length];
  const masse0 = E.masseMonetaire(s);
  let rngJoueur = seed * 7919 + 1;
  const hasard = () => { rngJoueur = (rngJoueur * 1103515245 + 12345) % 2147483648; return rngJoueur / 2147483648; };
  const vus = new Set();
  let actions = 0, echecs = 0, impasse = 0, suite = 0;
  while (s.perso.vivant && s.jour < maxJours) {
    if (s.evenement) vus.add(s.evenement.id);
    const jour = s.jour;
    // Après deux refus de suite, un joueur raisonnable va dormir.
    const infAvant = s.infamie;
    const r = (suite >= 2 ? E.agir(s, { id: "repos" }) : agent(s, plan, hasard)) || E.agir(s, { id: "repos" });
    if (process.env.TRACE_PRIME && s.infamie - infAvant >= 0.4) console.log("âge", E.age(s), "notoriété", infAvant, "->", s.infamie, "|", (r.texte || "").slice(0, 200));
    actions++;
    if (!r.ok) { echecs++; suite++; } else suite = 0;
    // Impasse : beaucoup d'actions sans que le temps avance.
    if (s.jour === jour) { if (++impasse > 400) { E.agir(s, { id: "repos" }); impasse = 0; } } else impasse = 0;
  }
  return {
    seed, plan, age: E.age(s), vivant: s.perso.vivant, actions, echecs, evenements: [...vus], masseOk: E.masseMonetaire(s) === masse0,
    berrys: s.berrys, prime: s.prime, ile: s.ile, carriere: s.carriere?.type || s.ancienneCarriere?.type || "aucune",
    rang: s.carriere?.rang ?? s.ancienneCarriere?.rang ?? null, fruit: !!s.fruit, haki: Object.values(s.haki.eveil).some(Boolean),
    enfants: s.famille.enfants.length, succes: Object.keys(s.succes || {}).length,
  };
}

export function simuler(n, depart = 1, options = {}) {
  const vies = [];
  const erreurs = [];
  for (let i = 0; i < n; i++) {
    try { vies.push(jouerVie(depart + i, options)); } catch (e) { erreurs.push({ seed: depart + i, erreur: e.stack.split("\n").slice(0, 3).join(" | ") }); }
  }
  const moy = (liste, f) => liste.length ? liste.reduce((t, v) => t + f(v), 0) / liste.length : 0;
  let rep = 0;
  for (let i = 1; i < vies.length; i++) {
    const a = new Set(vies[i - 1].evenements), b = vies[i].evenements;
    rep += b.length ? b.filter(x => a.has(x)).length / b.length : 0;
  }
  const parPlan = {};
  for (const p of PLANS) {
    const l = vies.filter(v => v.plan === p);
    if (!l.length) continue;
    parPlan[p] = { vies: l.length, ageMort: Math.round(moy(l, v => v.age)), carriereAtteinte: l.filter(v => v.carriere !== "aucune").length,
      richesse: Math.round(moy(l, v => v.berrys)), primeMoyenne: Math.round(moy(l, v => v.prime)), enfants: +moy(l, v => v.enfants).toFixed(1), succes: +moy(l, v => v.succes).toFixed(1),
      rangMarineMoyen: p === "marine" ? +moy(l, v => v.rang || 0).toFixed(1) : undefined };
  }
  return {
    vies: vies.length, erreurs, argentCree: vies.filter(v => !v.masseOk).length,
    ageMoyenMort: Math.round(moy(vies, v => v.age)), evenementsParVie: +moy(vies, v => v.evenements.length).toFixed(1),
    evenementsDifferents: new Set(vies.flatMap(v => v.evenements)).size,
    repetition: vies.length > 1 ? +(rep / (vies.length - 1)).toFixed(2) : 0,
    avecFruit: vies.filter(v => v.fruit).length, avecHaki: vies.filter(v => v.haki).length, parPlan,
  };
}

if (process.argv[1]?.endsWith("simuler.mjs")) {
  const n = +process.argv[2] || 100, d = +process.argv[3] || 1;
  const t = Date.now();
  console.log(JSON.stringify(simuler(n, d), null, 2));
  console.log(`${n} vies en ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
