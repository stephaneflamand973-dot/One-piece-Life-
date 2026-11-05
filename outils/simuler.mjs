// Simulateur de vies : joue automatiquement des vies entières avec un joueur au hasard,
// pour repérer erreurs, impasses, déséquilibres et création d'argent.
// Usage : node outils/simuler.mjs [nombre de vies] [graine de départ]
import * as E from "../jeu/engine.js";

export function jouerVie(seed, { maxJours = 120 * 365 } = {}) {
  const s = E.nouvelleVie({ prenom: "Sim", seed });
  const masse0 = E.masseMonetaire(s);
  let rngJoueur = seed * 7919 + 1;
  const hasard = () => { rngJoueur = (rngJoueur * 1103515245 + 12345) % 2147483648; return rngJoueur / 2147483648; };
  const vus = new Set();
  let actions = 0, sansAction = 0;
  while (s.perso.vivant && s.jour < maxJours) {
    if (s.evenement) vus.add(s.evenement.id);
    const dispo = E.actionsDisponibles(s);
    if (!dispo.length || hasard() < 0.15) { E.agir(s, { id: "repos" }); sansAction = 0; continue; }
    // Préfère les décisions en attente, sinon une action au hasard (dont voyages et carrières).
    const decision = dispo.find(a => a.id === "choisir" || a.id === "accepter");
    // Un joueur raisonnable ne mange pas un second Fruit du Démon.
    const sensees = dispo.filter(x => !(x.id === "manger" && s.fruit));
    if (!sensees.length) { E.agir(s, { id: "repos" }); continue; }
    const a = decision && hasard() < 0.9 ? decision : sensees[Math.floor(hasard() * sensees.length)];
    const r = E.agir(s, a);
    actions++;
    if (!r.ok) sansAction++; else sansAction = 0;
    if (sansAction > 50) { E.agir(s, { id: "repos" }); sansAction = 0; }
    if (hasard() < 0.05) E.agir(s, { id: "aller", cible: E.ILES[s.ile].port });
  }
  return {
    seed, age: E.age(s), vivant: s.perso.vivant, actions, evenements: [...vus], masseOk: E.masseMonetaire(s) === masse0,
    berrys: s.berrys, prime: s.prime, ile: s.ile, carriere: s.carriere?.type || s.ancienneCarriere?.type || "aucune",
    fruit: !!s.fruit, haki: Object.values(s.haki.eveil).some(Boolean), enfants: s.famille.enfants.length,
  };
}

export function simuler(n, depart = 1) {
  const vies = [];
  const erreurs = [];
  for (let i = 0; i < n; i++) {
    try { vies.push(jouerVie(depart + i)); } catch (e) { erreurs.push({ seed: depart + i, erreur: e.stack.split("\n").slice(0, 3).join(" | ") }); }
  }
  const moy = f => vies.length ? vies.reduce((t, v) => t + f(v), 0) / vies.length : 0;
  // Répétition d'une vie à l'autre : part moyenne des événements d'une vie déjà vus dans la précédente.
  let rep = 0;
  for (let i = 1; i < vies.length; i++) {
    const a = new Set(vies[i - 1].evenements), b = vies[i].evenements;
    rep += b.length ? b.filter(x => a.has(x)).length / b.length : 0;
  }
  const compte = k => vies.reduce((o, v) => ((o[v[k]] = (o[v[k]] || 0) + 1), o), {});
  return {
    vies: vies.length, erreurs, argentCree: vies.filter(v => !v.masseOk).length,
    ageMoyenMort: Math.round(moy(v => v.age)), evenementsParVie: +moy(v => v.evenements.length).toFixed(1),
    repetition: vies.length > 1 ? +(rep / (vies.length - 1)).toFixed(2) : 0,
    carrieres: compte("carriere"), iles: compte("ile"), avecFruit: vies.filter(v => v.fruit).length, avecHaki: vies.filter(v => v.haki).length,
    richesseMoyenne: Math.round(moy(v => v.berrys)), primeMax: Math.max(0, ...vies.map(v => v.prime)),
  };
}

if (process.argv[1]?.endsWith("simuler.mjs")) {
  const n = +process.argv[2] || 100, d = +process.argv[3] || 1;
  const t = Date.now();
  console.log(JSON.stringify(simuler(n, d), null, 2));
  console.log(`${n} vies en ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
