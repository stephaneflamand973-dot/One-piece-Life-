// Tests des règles du jeu (jeu/engine.js) : invariants D.2A, L.3A, L.4A, K.2A, I.5A, sauvegardes.
import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../jeu/engine.js";

const ado = () => { const s = E.nouvelleVie({ prenom: "Test", seed: 42 }); s.jour = 16 * 365; s.perso.naissance = 0; return s; };

test("naissance : vie qui commence à 0 an à Fuchsia", () => {
  const s = E.nouvelleVie({ prenom: "Kai", seed: 1 });
  assert.equal(E.age(s), 0);
  assert.equal(s.lieu, "maison");
  assert.match(s.journal[0].texte, /Fuchsia/);
});

test("D.2A : chaque entraînement valide rapporte exactement le même gain fixe", () => {
  const s = ado();
  const depart = s.stats.force;
  for (let i = 0; i < 5; i++) {
    const r = E.agir(s, { id: "entrainer", cible: "force" });
    assert.ok(r.ok, r.texte);
    assert.equal(s.stats.force, depart + (i + 1) * E.GAINS.entrainement);
  }
});

test("D.2A : la fatigue rend l'activité impossible, sans jamais réduire le gain", () => {
  const s = ado();
  s.fatigue = E.FATIGUE_MAX_ACTIVITE;
  const avant = s.stats.force;
  const r = E.agir(s, { id: "entrainer", cible: "force" });
  assert.equal(r.ok, false);
  assert.equal(s.stats.force, avant);
});

test("économie : acheter transfère l'argent sans en créer", () => {
  const s = ado(); s.berrys = 100; s.lieu = "atelier";
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "acheter", cible: "planche" }).ok);
  assert.equal(s.berrys, 80);
  assert.equal(s.inventaire.planche, 1);
  assert.equal(E.masseMonetaire(s), masse);
});

test("I.5A : réparation instantanée si les ressources sont là, échec immédiat sinon", () => {
  const s = ado(); s.lieu = "remise";
  const r1 = E.agir(s, { id: "reparer" });
  assert.equal(r1.ok, false);
  assert.match(r1.texte, /manque/);
  assert.equal(s.monde.toitRemise, "abîmé");
  s.inventaire.planche = 3; s.inventaire.clou = 6;
  const heure = s.heure;
  assert.ok(E.agir(s, { id: "reparer" }).ok);
  assert.equal(s.monde.toitRemise, "réparé");
  assert.equal(s.inventaire.planche, 0);
  assert.equal(s.inventaire.clou, 0);
  assert.equal(s.heure, heure);
});

function avecMission(s) {
  s.missions.push({ id: "m1", code: "toit", donneur: "woop", titre: "Réparer le toit de la remise du maire", condition: "c", cloture: "c",
    duree: 3, recompense: 500, statut: "proposée", jour: s.jour });
  s.lieu = "place";
}

test("L.3A / L.4A : séquestre à l'acceptation, récompense automatique à la réussite", () => {
  const s = ado(); avecMission(s);
  const masse = E.masseMonetaire(s);
  const fonds = s.pnj.woop.fonds;
  assert.ok(E.agir(s, { id: "accepter", cible: "m1" }).ok);
  assert.equal(s.pnj.woop.fonds, fonds - 500);
  assert.equal(s.missions[0].sequestre, 500);
  assert.equal(E.masseMonetaire(s), masse);
  s.lieu = "remise"; s.inventaire.planche = 3; s.inventaire.clou = 6;
  E.agir(s, { id: "reparer" });
  assert.equal(s.missions[0].statut, "réussie");
  assert.equal(s.berrys, 500);
  assert.equal(E.masseMonetaire(s), masse);
});

test("L.3A : échéance dépassée, échec binaire et séquestre rendu", () => {
  const s = ado(); avecMission(s);
  const fonds = s.pnj.woop.fonds;
  E.agir(s, { id: "accepter", cible: "m1" });
  for (let i = 0; i < 6 && s.missions[0].statut === "active"; i++) E.avancer(s, 1);
  assert.equal(s.missions[0].statut, "échouée");
  assert.equal(s.pnj.woop.fonds, fonds);
  assert.equal(s.berrys, 0);
});

test("mission non garantie si le donneur n'a pas les fonds", () => {
  const s = ado(); avecMission(s); s.pnj.woop.fonds = 100;
  assert.equal(E.agir(s, { id: "accepter", cible: "m1" }).ok, false);
  assert.equal(s.missions[0].statut, "proposée");
});

test("K.2A : la blessure guérit automatiquement avec le temps simulé", () => {
  const s = ado();
  s.sante.blessures.push({ nom: "entaille au bras", jours: 7, gravite: 1 });
  assert.equal(E.agir(s, { id: "entrainer", cible: "force" }).ok, false);
  let jours = 0;
  while (s.sante.blessures.length && jours < 30) jours += E.avancer(s, 7).jours;
  assert.equal(s.sante.blessures.length, 0);
});

test("K.2A : une séquelle durable reste après la guérison", () => {
  const s = ado();
  s.sante.blessures.push({ nom: "côte fêlée", jours: 2, gravite: 2, sequelle: "douleur au flanc" });
  let n = 0; while (s.sante.blessures.length && n++ < 10) E.avancer(s, 1);
  assert.deepEqual(s.sante.sequelles, ["douleur au flanc"]);
});

test("01.6A : sans action du joueur, le monde ne bouge pas (pas de rattrapage)", () => {
  const s = ado();
  const avant = JSON.stringify(s);
  const copie = E.deserialiser(E.serialiser(s));
  assert.equal(JSON.stringify(copie), avant);
});

test("sauvegarde : une sauvegarde modifiée est détectée comme corrompue", () => {
  const s = ado();
  const txt = E.serialiser(s).replace('"berrys":0', '"berrys":99999');
  assert.throws(() => E.deserialiser(txt), /corrompue/);
});

test("sauvegarde : recharger ne rejoue pas une récompense", () => {
  const s = ado(); avecMission(s);
  E.agir(s, { id: "accepter", cible: "m1" });
  s.lieu = "remise"; s.inventaire.planche = 3; s.inventaire.clou = 6;
  E.agir(s, { id: "reparer" });
  const recharge = E.deserialiser(E.serialiser(s));
  E.avancer(recharge, 1);
  assert.equal(recharge.berrys, 500);
});

test("ellipse interrompue par un événement important", () => {
  const s = ado();
  s.missions.push({ id: "mx", code: "toit", donneur: "woop", titre: "t", condition: "c", duree: 3, recompense: 500,
    statut: "active", sequestre: 500, echeance: s.jour + 2 });
  s.pnj.woop.fonds -= 500;
  const r = E.avancer(s, 30);
  assert.ok(r.interruption);
  assert.ok(r.jours <= 3);
});

test("PNJ : ne se trouvent que là où ils sont, actions impossibles ailleurs", () => {
  const s = ado(); s.lieu = "colline";
  assert.equal(E.agir(s, { id: "parler", cible: "makino" }).ok, false);
  assert.equal(E.agir(s, { id: "travailler" }).ok, false);
});

test("saisie libre simple : plusieurs intentions dans l'ordre", () => {
  const s = ado();
  const a = E.interpreterTexte(s, "Je vais au port, puis je travaille avec Bern et ensuite je rentre dormir");
  assert.deepEqual(a.map(x => x.id), ["aller", "travailler", "repos"]);
  assert.equal(a[0].cible, "port");
});

test("enfance : un bébé ne peut pas s'entraîner, mais peut jouer", () => {
  const s = E.nouvelleVie({ prenom: "B", seed: 3 });
  assert.equal(E.agir(s, { id: "entrainer", cible: "force" }).ok, false);
  assert.ok(E.agir(s, { id: "jouer" }).ok);
});

test("une vie complète peut être simulée année par année sans erreur", () => {
  const s = E.nouvelleVie({ prenom: "L", seed: 7 });
  let garde = 0;
  while (s.perso.vivant && garde++ < 3000) E.avancer(s, 365);
  assert.ok(E.age(s) > 0);
  assert.ok(E.masseMonetaire(s) > 0);
});
