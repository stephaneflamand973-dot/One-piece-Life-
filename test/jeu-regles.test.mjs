// Tests des règles du jeu (jeu/engine.js) : invariants D.2A, L.3A, L.4A, K.2A, I.5A, sauvegardes.
import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../jeu/engine.js";

// Mène un combat en cours jusqu'à son terme en attaquant à chaque manche.
const finir = s => { let n = 0; while (s.combat && n++ < 40) E.agir(s, { id: "c_frapper" }); return s; };
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

// ---------- Version 2 : voyages, Marine, famille, succession ----------

test("voyage : traversée payée, jours écoulés, argent conservé", () => {
  const s = ado(); s.berrys = 100; s.lieu = "port";
  const masse = E.masseMonetaire(s); const jour = s.jour;
  const r = E.agir(s, { id: "voyager", cible: "shells" });
  assert.ok(r.ok, r.texte);
  assert.equal(s.ile, "shells");
  assert.equal(s.lieu, "port_shells");
  assert.equal(s.jour, jour + 2);
  assert.equal(s.berrys, 60);
  assert.equal(E.masseMonetaire(s), masse);
});

test("voyage : impossible sans argent, et on ne va pas à pied sur une autre île", () => {
  const s = ado(); s.lieu = "port";
  assert.equal(E.agir(s, { id: "voyager", cible: "loguetown" }).ok, false);
  assert.equal(E.agir(s, { id: "aller", cible: "base" }).ok, false);
  assert.equal(s.ile, "fuchsia");
});

test("Marine : engagement, solde hebdomadaire, mérite fixe et promotion", () => {
  const s = ado(); s.ile = "shells"; s.lieu = "base"; s.stats.force = 5; s.stats.endurance = 5;
  assert.ok(E.agir(s, { id: "engager" }).ok);
  assert.equal(s.carriere.rang, 0);
  const b = s.berrys;
  E.avancer(s, 7, { sansInterruption: true });
  assert.equal(s.berrys, b + E.SOLDE_MARINE[0]);
  s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "service" });
  assert.equal(s.carriere.merite, 1);
  s.carriere.merite = 9; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "service" });
  assert.equal(s.carriere.rang, 1);
});

test("amour : le consentement n'est pas garanti, et le mariage exige une bague", () => {
  let acceptes = 0, refus = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = E.nouvelleVie({ prenom: "A", seed }); s.jour = 20 * 365; s.lieu = "colline"; s.pnj.sacha.relation = 50;
    const r = E.agir(s, { id: "declarer", cible: "sacha" });
    if (s.famille.partenaire === "sacha") acceptes++; else refus++;
    assert.ok(r.ok);
  }
  assert.ok(acceptes > 0 && refus > 0);
  const s = E.nouvelleVie({ prenom: "A", seed: 5 }); s.jour = 20 * 365; s.lieu = "colline";
  s.famille.partenaire = "sacha"; s.famille.statut = "couple"; s.pnj.sacha.relation = 95;
  assert.equal(E.agir(s, { id: "mariage", cible: "sacha" }).ok, false);
});

test("famille : un enfant naît au terme, puis succession sans transmission de compétences", () => {
  const s = ado(); s.jour = 25 * 365;
  s.famille = { partenaire: "sacha", statut: "marié", enfants: [], grossesse: { debut: s.jour, terme: s.jour + 3 } };
  s.pnj.sacha.lieu = "maison";
  E.avancer(s, 5, { sansInterruption: true });
  assert.equal(s.famille.enfants.length, 1);
  s.competences.combat = 30; s.stats.force = 40; s.berrys = 777;
  s.perso.vivant = false;
  assert.ok(E.succeder(s, 0).ok);
  assert.equal(s.perso.vivant, true);
  assert.equal(s.generation, 2);
  assert.equal(s.competences.combat, 0);
  assert.ok(s.stats.force < 40);
  assert.equal(s.berrys, 777);
});

test("migration : une sauvegarde version 1 reçoit les îles et les nouveaux habitants", () => {
  const s = ado();
  delete s.ile; delete s.famille; delete s.carriere; delete s.pnj.mira; s.version = 1;
  const m = E.migrer(s);
  assert.equal(m.ile, "fuchsia");
  assert.ok(m.pnj.mira);
  assert.deepEqual(m.famille.enfants, []);
});

// ---------- Version 3 : piraterie et Fruits du Démon ----------

const capitaine = (seed = 42) => {
  const s = ado(); s.rng = seed; s.berrys = 700; s.lieu = "atelier";
  assert.ok(E.agir(s, { id: "acheter", cible: "barque" }).ok);
  s.lieu = "port";
  assert.ok(E.agir(s, { id: "pirate" }).ok);
  return s;
};

test("navire : une barque permet de naviguer gratuitement", () => {
  const s = ado(); s.berrys = 600; s.lieu = "atelier";
  assert.ok(E.agir(s, { id: "acheter", cible: "barque" }).ok);
  assert.equal(s.navire.type, "barque");
  assert.equal(s.berrys, 0);
  s.lieu = "port";
  assert.ok(E.agir(s, { id: "voyager", cible: "shells" }).ok);
  assert.equal(s.ile, "shells");
});

test("piraterie : impossible sans navire ou depuis la Marine", () => {
  const s = ado(); s.lieu = "port";
  assert.equal(E.agir(s, { id: "pirate" }).ok, false);
  s.navire = { type: "barque", nom: "X", coque: 100 }; s.carriere = { type: "marine", rang: 0, merite: 0, depuis: 0 };
  assert.equal(E.agir(s, { id: "pirate" }).ok, false);
});

test("piraterie : un abordage réussi donne un butin, partage l'argent sans en créer et fait monter la prime", () => {
  let reussi = false;
  for (let seed = 1; seed < 60 && !reussi; seed++) {
    const s = capitaine(seed); s.stats.force = 20; s.stats.agilite = 20;
    const masse = E.masseMonetaire(s); const b = s.berrys;
    E.agir(s, { id: "attaquer" });
    if (s.infamie > 0 && !s.prison) {
      reussi = true;
      assert.ok(s.berrys > b);
      assert.equal(s.prime, E.calculPrime(s.infamie));
      assert.equal(E.masseMonetaire(s), masse);
    }
  }
  assert.ok(reussi);
});

test("piraterie : recruter remplit l'équipage jusqu'à la capacité du navire", () => {
  const s = capitaine(); s.lieu = "bar"; s.stats.charisme = 40;
  for (let i = 0; i < 20; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "recruter" }); }
  assert.equal(E.equipage(s).length, 3);
  assert.equal(E.agir(s, { id: "recruter" }).ok, false);
});

test("Marine : capture, prison, navire saisi, puis libération à Shells Town", () => {
  const s = capitaine(); s.infamie = 5; s.prime = E.calculPrime(5); s.stats.force = 1; s.stats.agilite = 1;
  s.pnj.dagtest = { nom: "Dag", role: "x", lieu: "equipage", relation: 20, fonds: 0, souvenirs: [], force: 1 };
  // La Marine est forcément plus forte : la capture est garantie.
  let essais = 0;
  while (!s.prison && essais++ < 50) { s.ile = "fuchsia"; s.lieu = "port"; s.heure = 8; s.fatigue = 0; s.navire ??= { type: "barque", nom: "X", coque: 100 }; E.agir(s, { id: "voyager", cible: "shells" }); }
  assert.ok(s.prison, "capture attendue");
  assert.equal(s.navire, null);
  assert.equal(s.pnj.dagtest.lieu, "disparu");
  assert.equal(E.agir(s, { id: "aller", cible: "taverne_shells" }).ok, false);
  let n = 0; while (s.prison && n++ < 20) E.agir(s, { id: "attendre" });
  assert.equal(s.prison, null);
  assert.equal(s.lieu, "port_shells");
});

test("fruit : le manger donne un pouvoir et ôte la nage ; la maîtrise a un gain fixe", () => {
  const s = ado(); s.inventaire.fruits.push("echo");
  const avant = E.puissance(s);
  assert.ok(E.agir(s, { id: "manger", cible: "echo" }).ok);
  assert.equal(s.fruit.id, "echo");
  assert.equal(E.puissance(s), avant + E.FRUITS.echo.bonus);
  for (let i = 1; i <= 3; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "maitriser" }); assert.equal(s.fruit.maitrise, i); }
});

test("fruit : en manger un second est mortel", () => {
  const s = ado(); s.inventaire.fruits.push("echo", "verre");
  E.agir(s, { id: "manger", cible: "echo" });
  E.agir(s, { id: "manger", cible: "verre" });
  assert.equal(s.perso.vivant, false);
});

test("fruit : chaque fruit n'existe qu'une fois par monde", () => {
  const s = ado(); s.lieu = "colline";
  for (let i = 0; i < 12000; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "explorer" }); }
  assert.equal(new Set(s.monde.fruitsTrouves).size, s.monde.fruitsTrouves.length);
  assert.ok(s.monde.fruitsTrouves.length <= Object.keys(E.FRUITS).length);
  assert.ok(s.monde.fruitsTrouves.length > 0);
});

// ---------- Version 4 : Haki ----------

const chezGaro = () => { const s = ado(); s.ile = "loguetown"; s.lieu = "auberge_logue"; s.berrys = 1000; return s; };

test("Haki : Garo n'enseigne qu'à quelqu'un qu'il connaît", () => {
  const s = chezGaro();
  assert.equal(E.agir(s, { id: "initier", cible: "observation" }).ok, false);
  assert.ok(!E.actionsDisponibles(s).some(a => a.id === "initier"));
});

test("Haki : leçons payées, progression fixe, éveil au seuil", () => {
  const s = chezGaro(); s.pnj.garo.relation = 30;
  const masse = E.masseMonetaire(s);
  for (let i = 1; i <= E.SEUIL_EVEIL; i++) {
    s.heure = 8; s.fatigue = 0;
    assert.ok(E.agir(s, { id: "initier", cible: "armement" }).ok);
    assert.equal(s.haki.progres.armement, i);
  }
  assert.equal(s.haki.eveil.armement, true);
  assert.equal(s.berrys, 1000 - E.SEUIL_EVEIL * E.PRIX_LECON_HAKI);
  assert.equal(E.masseMonetaire(s), masse);
  assert.equal(E.agir(s, { id: "initier", cible: "armement" }).ok, false);
});

test("Haki : l'entraînement d'un Haki éveillé rapporte toujours +1 et augmente la puissance", () => {
  const s = ado();
  assert.equal(E.agir(s, { id: "haki", cible: "armement" }).ok, false);
  s.haki.eveil.armement = true; s.haki.armement = 1;
  const p0 = E.puissance(s);
  for (let i = 0; i < 4; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "haki", cible: "armement" }); }
  assert.equal(s.haki.armement, 5);
  assert.equal(E.puissance(s), p0 + 4);
});

test("Haki de l'observation : certains coups sont esquivés", () => {
  const s = ado(); s.haki.eveil.observation = true; s.haki.observation = 20;
  let esquives = 0;
  for (let i = 0; i < 200; i++) {
    s.sante.blessures = [];
    s.ile = "fuchsia"; s.lieu = "port"; s.monde.voyouAuPort = true; s.heure = 8; s.fatigue = 0;
    E.agir(s, { id: "combattre" }); finir(s);
    if (!s.sante.blessures.length) esquives++;
  }
  assert.ok(esquives > 40);
});

test("Haki des Rois : seulement s'il est inné, éveillé dans un moment décisif", () => {
  let eveille = false;
  for (let seed = 1; seed < 80 && !eveille; seed++) {
    const s = capitaine(seed); s.haki.roisInne = true; s.infamie = 10; s.prime = E.calculPrime(10);
    s.stats.force = 1; s.stats.agilite = 1;
    for (let n = 0; n < 20 && !s.prison && !s.haki.eveil.rois && s.perso.vivant; n++) {
      s.ile = "fuchsia"; s.lieu = "port"; s.heure = 8; s.fatigue = 0; s.navire ??= { type: "barque", nom: "X", coque: 100 };
      E.agir(s, { id: "voyager", cible: "shells" });
    }
    eveille = s.haki.eveil.rois;
  }
  assert.ok(eveille);
  const sansDon = capitaine(3); sansDon.haki.roisInne = false; sansDon.infamie = 10; sansDon.prime = E.calculPrime(10);
  for (let n = 0; n < 20 && !sansDon.prison && sansDon.perso.vivant; n++) {
    sansDon.ile = "fuchsia"; sansDon.lieu = "port"; sansDon.navire ??= { type: "barque", nom: "X", coque: 100 };
    E.agir(sansDon, { id: "voyager", cible: "shells" });
  }
  assert.equal(sansDon.haki.eveil.rois, false);
});

test("Haki : les anciennes sauvegardes le reçoivent, la succession ne le transmet pas", () => {
  const s = ado(); delete s.haki; delete s.pnj.garo; s.version = 1;
  E.migrer(s);
  assert.ok(s.haki && s.pnj.garo);
  s.haki.eveil.armement = true; s.haki.armement = 30;
  s.famille.enfants.push({ prenom: "Z", naissance: s.jour - 3650, genre: "f" });
  s.perso.vivant = false;
  E.succeder(s, 0);
  assert.equal(s.haki.eveil.armement, false);
  assert.equal(s.haki.armement, 0);
});

test("migration : une sauvegarde de la version 2 (sans piraterie ni fruits) devient jouable", () => {
  const s = ado();
  delete s.inventaire.fruits; delete s.fruit; delete s.navire; delete s.prime; delete s.infamie; delete s.prison; delete s.haki;
  delete s.monde.fruitsTrouves; delete s.pnj.tomas.stock.barque; s.version = 2;
  E.migrer(s);
  assert.deepEqual(s.inventaire.fruits, []);
  assert.equal(s.prime, 0);
  assert.equal(s.pnj.tomas.stock.barque, 2);
  s.lieu = "colline";
  assert.ok(E.agir(s, { id: "explorer" }).ok);
  assert.ok(E.actionsDisponibles(s).length > 0);
});

// ---------- Version 5 : Grand Line ----------

const aLoguetown = (seed = 7) => {
  const s = ado(); s.rng = seed; s.jour = 20 * 365; s.ile = "loguetown"; s.lieu = "quais_logue"; s.berrys = 5000;
  s.navire = { type: "caravelle", nom: "Test", coque: 100 };
  return s;
};

test("Grand Line : Reverse Mountain exige 17 ans ; sans navire, on embarque comme passager", () => {
  const s = aLoguetown(); s.navire = null;
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "voyager", cible: "cap" }).ok);
  assert.equal(E.masseMonetaire(s), masse);
  assert.ok(s.berrys < 5000);
  const t = aLoguetown(); t.jour = 16 * 365;
  assert.equal(E.agir(t, { id: "voyager", cible: "cap" }).ok, false);
});

test("Grand Line : traversée de Reverse Mountain, réussie ou naufrage", () => {
  let arrive = 0, naufrages = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = aLoguetown(seed);
    E.agir(s, { id: "voyager", cible: "cap" });
    if (s.ile === "cap" && s.navire) arrive++;
    if (!s.navire) naufrages++;
  }
  assert.ok(arrive > 0 && naufrages > 0);
});

test("Grand Line : sans Log Pose, on ne quitte pas le cap ; avec, la coque s'use", () => {
  const s = aLoguetown(); s.ile = "cap"; s.lieu = "phare";
  assert.equal(E.agir(s, { id: "voyager", cible: "little_garden" }).ok, false);
  assert.ok(E.agir(s, { id: "acheter", cible: "logpose" }).ok);
  let essais = 0;
  while (s.ile !== "little_garden" && essais++ < 30) {
    s.ile = "cap"; s.lieu = "phare"; s.navire ??= { type: "caravelle", nom: "T", coque: 100 }; s.navire.coque = 100;
    E.agir(s, { id: "voyager", cible: "little_garden" });
  }
  assert.equal(s.ile, "little_garden");
  assert.ok(s.navire.coque < 100);
});

test("Grand Line : on ne saute pas d'île sans suivre le Log Pose", () => {
  const s = aLoguetown(); s.ile = "cap"; s.lieu = "phare"; s.inventaire.logpose = 1;
  assert.equal(E.agir(s, { id: "voyager", cible: "sabaody" }).ok, false);
});

test("Water Seven : réparation payée sans création d'argent", () => {
  const s = aLoguetown(); s.ile = "water_seven"; s.lieu = "chantier"; s.navire.coque = 40;
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "radoub" }).ok);
  assert.equal(s.navire.coque, 100);
  assert.equal(s.berrys, 5000 - 60 * 20);
  assert.equal(E.masseMonetaire(s), masse);
});

test("naufrage quand la coque cède en mer", () => {
  let coule = false;
  for (let seed = 1; seed < 40 && !coule; seed++) {
    const s = aLoguetown(seed); s.ile = "water_seven"; s.lieu = "quai_w7"; s.inventaire.logpose = 1; s.navire.coque = 3;
    E.agir(s, { id: "voyager", cible: "sabaody" });
    if (!s.navire) coule = true;
  }
  assert.ok(coule);
});

test("Sabaody : l'enrobage coûte 3 jours et 3000 Berrys", () => {
  const s = aLoguetown(); s.ile = "sabaody"; s.lieu = "enrobage";
  const jour = s.jour;
  assert.ok(E.agir(s, { id: "enrober" }).ok);
  assert.equal(s.navire.enrobe, true);
  assert.equal(s.jour, jour + 3);
  assert.equal(s.berrys, 2000);
});

// ---------- Version 6 : Nouveau Monde ----------

const aSabaody = (seed = 7) => { const s = aLoguetown(seed); s.ile = "sabaody"; s.lieu = "mangroves"; s.inventaire.logpose = 1; s.berrys = 20000; return s; };

test("Nouveau Monde : la descente exige un navire enrobé", () => {
  const s = aSabaody();
  assert.equal(E.agir(s, { id: "voyager", cible: "hommes_poissons" }).ok, false);
  let arrive = false;
  for (let seed = 1; seed < 20 && !arrive; seed++) {
    const t = aSabaody(seed); t.navire.enrobe = true;
    E.agir(t, { id: "voyager", cible: "hommes_poissons" });
    arrive = t.ile === "hommes_poissons";
  }
  assert.ok(arrive);
});

test("Nouveau Monde : le Log Pose à trois aiguilles est obligatoire", () => {
  const s = aSabaody(); s.ile = "hommes_poissons"; s.lieu = "port_hp";
  assert.equal(E.agir(s, { id: "voyager", cible: "dressrosa" }).ok, false);
  assert.ok(E.agir(s, { id: "acheter", cible: "logpose_nm" }).ok);
  assert.equal(s.inventaire.logpose_nm, 1);
  const r = E.agir(s, { id: "voyager", cible: "dressrosa" });
  assert.ok(r.ok);
});

test("Colisée : la victoire paie 3000 Berrys sans création d'argent", () => {
  let gagne = false;
  for (let seed = 1; seed < 40 && !gagne; seed++) {
    const s = aSabaody(seed); s.ile = "dressrosa"; s.lieu = "colisee"; s.stats.force = 40; s.stats.agilite = 40;
    const masse = E.masseMonetaire(s); const b = s.berrys;
    E.agir(s, { id: "colisee" }); finir(s);
    if (s.berrys === b + 3000) { gagne = true; assert.equal(E.masseMonetaire(s), masse); }
  }
  assert.ok(gagne);
});

test("Wano : les leçons de Sōen mènent au Haki de l'armement à pas fixes", () => {
  const s = aSabaody(); s.ile = "wano"; s.lieu = "dojo";
  assert.equal(E.agir(s, { id: "sabre" }).ok, false);
  s.pnj.soen.relation = 20;
  for (let i = 1; i <= E.SEUIL_EVEIL; i++) { s.heure = 8; s.fatigue = 0; assert.ok(E.agir(s, { id: "sabre" }).ok); }
  assert.equal(s.haki.eveil.armement, true);
  assert.equal(s.competences.combat, E.SEUIL_EVEIL);
});

// ---------- Étape 1 : un monde qui vit seul ----------
import * as M from "../jeu/monde.js";

test("monde vivant : en 50 ans sans le joueur, au moins 30 % des habitants ont changé", () => {
  const s = E.nouvelleVie({ prenom: "W", seed: 11 });
  const initiaux = M.vivants(s);
  const masse = E.masseMonetaire(s);
  for (let y = 0; y < 50; y++) E.avancer(s, 365, { sansInterruption: true });
  const changes = initiaux.filter(id => !s.pnj[id] || s.pnj[id].vivant === false || s.pnj[id].couple || s.pnj[id].enfants?.length).length;
  assert.ok(changes / initiaux.length >= 0.3, `${changes}/${initiaux.length}`);
  assert.ok(s.monde.defunts.length > 0);
  assert.equal(E.masseMonetaire(s), masse);
});

test("monde vivant : les personnages canoniques ne meurent pas avant 90 ans", () => {
  const s = E.nouvelleVie({ prenom: "W", seed: 12 });
  s.pnj.makino.naissance = s.jour - 30 * 365;
  for (let y = 0; y < 50; y++) E.avancer(s, 365, { sansInterruption: true });
  assert.notEqual(s.pnj.makino.vivant, false);
});

test("monde vivant : à la mort d'un artisan, un successeur reprend son poste", () => {
  const s = E.nouvelleVie({ prenom: "W", seed: 13 });
  s.pnj.tomas.enfants = []; s.pnj.app = { nom: "Apo", role: "apprenti", genre: "g", lieu: "atelier", relation: 0, fonds: 10, souvenirs: [], naissance: s.jour - 20 * 365, vivant: true, enfants: [], parents: [], couple: null };
  M.mourir(s, "tomas", "de maladie");
  assert.equal(s.pnj.tomas.nom, "Apo");
  assert.notEqual(s.pnj.tomas.vivant, false);
  assert.equal(s.pnj.app, undefined);
  assert.equal(s.pnj.tomas.stock.planche, 30);
});

test("monde vivant : une nouvelle lointaine arrive avec un délai", () => {
  const s = E.nouvelleVie({ prenom: "W", seed: 14 }); s.jour = 20 * 365;
  M.nouvelle(s, "loguetown", "Test lointain.", "region");
  M.nouvelle(s, "loguetown", "Petite nouvelle locale.");
  M.recevoirNouvelles(s);
  assert.ok(!s.journal.some(e => e.texte.includes("Test lointain")));
  s.jour += 3; M.recevoirNouvelles(s);
  assert.ok(s.journal.some(e => e.type === "rumeur" && e.texte.includes("Test lointain")));
  assert.ok(!s.journal.some(e => e.texte.includes("Petite nouvelle locale")));
});

test("monde vivant : la mort de ses parents donne un héritage, sans création d'argent", () => {
  const s = E.nouvelleVie({ prenom: "W", seed: 15 });
  const masse = E.masseMonetaire(s);
  M.mourir(s, "mere", "de maladie");
  assert.equal(s.berrys, 300);
  assert.equal(E.masseMonetaire(s), masse);
});

// ---------- Étape 2 : événements et choix ----------
import * as EV from "../jeu/evenements.js";
import { jouerVie } from "../outils/simuler.mjs";

test("événements : un événement se déclenche, interrompt l'ellipse et attend une décision", () => {
  const s = E.nouvelleVie({ prenom: "V", seed: 21 });
  let r = null, n = 0;
  while (!s.evenement && n++ < 200) r = E.avancer(s, 30);
  assert.ok(s.evenement, "aucun événement en 200 mois");
  const choix = E.actionsDisponibles(s).filter(a => a.id === "choisir");
  assert.ok(choix.length >= 2);
  const res = E.agir(s, choix[0]);
  assert.ok(res.ok);
  assert.equal(s.evenement, null);
});

test("événements : chaque choix de chaque événement s'exécute sans erreur ni création d'argent", () => {
  for (const ev of EV.EVENEMENTS) {
    ev.choix.forEach((c, i) => {
      const s = E.nouvelleVie({ prenom: "V", seed: 30 + i }); s.jour = 30 * 365; s.berrys = 500; s.monde.exterieur -= 500;
      s.pnj.ami = { nom: "Ami", role: "ami", genre: "g", lieu: s.lieu, relation: 30, fonds: 500, souvenirs: [], naissance: s.jour - 30 * 365, vivant: true, enfants: [], parents: [], couple: null, romance: true };
      s.monde.exterieur -= 500;
      const masse = E.masseMonetaire(s);
      s.carriere = { type: "pirate", equipage: "Test", depuis: 0, raids: 0, merite: 0 };
      s.navire = { type: "barque", nom: "T", coque: 100 };
      s.famille.partenaire = "ami"; s.famille.statut = "marié"; s.metiers = { port: 120 };
      s.commerce = { type: "echoppe", ile: s.ile, lieu: "place", depuis: 0, derniereVisite: s.jour };
      s.evenement = { id: ev.id, jour: s.jour, data: { p: "ami" } };
      const r = E.agir(s, { id: "choisir", cible: i });
      assert.ok(r.ok, `${ev.id} choix ${i}`);
      assert.equal(E.masseMonetaire(s), masse, `${ev.id} choix ${i} crée de l'argent`);
    });
  }
});

test("missions variées : livraison binaire, colis remis à l'arrivée, argent conservé", () => {
  const s = ado(); s.berrys = 200; s.lieu = "port";
  s.pnj.bern.fonds = 1000;
  s.evenement = { id: "mission_livraison", jour: s.jour, data: { p: "bern" } };
  E.agir(s, { id: "choisir", cible: 0 });
  const m = s.missions.at(-1);
  assert.equal(m.code, "livraison");
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "accepter", cible: m.id }).ok);
  assert.equal(s.inventaire.colis, 1);
  E.agir(s, { id: "voyager", cible: m.dest });
  assert.equal(m.statut, "réussie");
  assert.equal(s.inventaire.colis, 0);
  assert.equal(E.masseMonetaire(s), masse);
});

test("simulateur : des vies jouées au hasard sans erreur ni création d'argent", () => {
  for (let seed = 1; seed <= 4; seed++) {
    const v = jouerVie(seed, { maxJours: 25 * 365 });
    assert.ok(v.masseOk, `vie ${seed} : argent créé`);
  }
});

// ---------- Étape 3 : chronologie du canon ----------
import * as C from "../jeu/chronologie.js";

test("chronologie : à l'âge d'or de Roger, Makino n'est pas encore née et la piraterie est rare", () => {
  const s = E.nouvelleVie({ prenom: "R", seed: 41, ere: "roger" });
  assert.equal(C.anneeRelative(s), -45);
  assert.equal(s.monde.intensitePiraterie, 0.5);
  s.lieu = "bar";
  assert.ok(!E.pnjIci(s).includes("makino"));
  E.avancer(s, 24 * 365, { sansInterruption: true });
  assert.equal(s.chrono.faits.execution_roger, "advenu");
  assert.equal(s.monde.intensitePiraterie, 3);
});

test("chronologie : Luffy est au village pendant son enfance, puis part à l'année 0", () => {
  const s = E.nouvelleVie({ prenom: "L", seed: 42 });
  s.jour = 6 * 365; s.lieu = "colline";
  assert.ok(E.pnjIci(s).includes("luffy"));
  E.avancer(s, 12 * 365, { sansInterruption: true });
  assert.equal(s.chrono.faits.depart_luffy, "advenu");
  s.lieu = "colline";
  assert.ok(!E.pnjIci(s).includes("luffy"));
});

test("chronologie : sauver l'enfant du Seigneur de la Côte crée une divergence durable", () => {
  const s = E.nouvelleVie({ prenom: "D", seed: 43, ere: "execution" });
  s.stats.force = 30; s.stats.agilite = 30; s.lieu = "port";
  while (!s.evenement || s.evenement.id !== "roi_de_la_cote") { E.avancer(s, 30); s.ile = "fuchsia"; s.lieu = "port"; if (s.evenement && s.evenement.id !== "roi_de_la_cote") E.agir(s, { id: "choisir", cible: 0 }); if (C.anneeRelative(s) > -9) break; }
  assert.equal(s.evenement?.id, "roi_de_la_cote");
  E.agir(s, { id: "choisir", cible: 0 });
  assert.ok(s.chrono.divergences.bras_shanks);
  E.avancer(s, 40, { sansInterruption: true });
  assert.ok(s.monde.nouvelles.some(n => n.texte.includes("deux bras intacts")));
});

// ---------- Étape 4 : factions et politique ----------
import * as F from "../jeu/factions.js";

const aLogue = () => { const s = ado(); s.jour = 20 * 365; s.ile = "loguetown"; s.lieu = "bureau_primes"; return s; };

test("chasseur de primes : inscription, capture binaire payée sans création d'argent", () => {
  let capture = false;
  for (let seed = 1; seed < 30 && !capture; seed++) {
    const s = aLogue(); s.rng = seed; s.stats.force = 30; s.stats.agilite = 30;
    assert.ok(E.agir(s, { id: "chasseur" }).ok);
    s.lieu = "quais_logue";
    s.monde.rivaux = [{ id: "r1", nom: "Pirates Test", capitaine: "Test", region: "eb", ile: "loguetown", prime: 5000000, force: 20, actif: true }];
    const masse = E.masseMonetaire(s);
    E.agir(s, { id: "traquer" }); finir(s);
    if (!s.monde.rivaux[0].actif) { capture = true; assert.equal(s.berrys, 2500); assert.equal(E.masseMonetaire(s), masse); }
  }
  assert.ok(capture);
});

test("révolution : il faut avoir combattu l'injustice pour être approché", () => {
  const s = aLogue(); s.lieu = "echafaud";
  assert.equal(E.agir(s, { id: "revolution" }).ok, false);
  s.traits.bonte = 3;
  assert.ok(E.agir(s, { id: "revolution" }).ok);
  assert.equal(s.carriere.type, "revolution");
});

test("Grand Corsaire : l'offre arrive avec une grosse prime, et la Marine laisse alors en paix", () => {
  const s = capitaine(); s.infamie = 15; s.prime = F.SEUIL_CORSAIRE;
  for (let i = 0; i < 20 && s.evenement?.id !== "offre_corsaire"; i++) {
    if (s.evenement) E.agir(s, { id: "choisir", cible: s.evenement.id === "offre_corsaire" ? 0 : 1 });
    E.avancer(s, 1);
  }
  assert.equal(s.evenement?.id, "offre_corsaire");
  E.agir(s, { id: "choisir", cible: 0 });
  assert.ok(s.carriere.corsaire);
  assert.ok(F.marineIgnore(s));
});

test("alliance puis trahison : la réputation chez les pirates s'effondre", () => {
  const s = capitaine(); s.stats.charisme = 60; s.stats.force = 40;
  s.monde.rivaux = [{ id: "r2", nom: "Pirates Alliés", capitaine: "Allié", region: "eb", ile: "fuchsia", prime: 3000000, force: 10, actif: true }];
  E.agir(s, { id: "alliance" });
  assert.ok(s.monde.rivaux[0].allie);
  E.agir(s, { id: "trahir" });
  assert.ok(s.monde.rivaux[0].ennemi);
  assert.ok(s.reputation.pirates < 0);
});

// ---------- Étape 5 : une vie profonde ----------
import * as VI from "../jeu/vie.js";

test("école : chaque journée de classe rapporte exactement +1 en éducation", () => {
  const s = E.nouvelleVie({ prenom: "S", seed: 51 }); s.jour = 8 * 365; s.lieu = "ecole";
  for (let i = 1; i <= 3; i++) { s.heure = 8; s.fatigue = 0; assert.ok(E.agir(s, { id: "ecole" }).ok); assert.equal(s.education, i); }
});

test("maladie chronique : moins d'énergie disponible, mais le gain d'un entraînement reste fixe", () => {
  const s = ado(); s.sante.maladies = ["rhumatismes"];
  s.fatigue = 70;
  assert.equal(E.agir(s, { id: "entrainer", cible: "force" }).ok, false);
  s.fatigue = 0; const f = s.stats.force;
  E.agir(s, { id: "entrainer", cible: "force" });
  assert.equal(s.stats.force, f + E.GAINS.entrainement);
});

test("musique : les pourboires viennent des présents, sans création d'argent", () => {
  const s = ado(); s.lieu = "bar";
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "musique" }).ok);
  assert.ok(s.berrys > 0);
  assert.equal(E.masseMonetaire(s), masse);
});

test("personnalité : deux vies identiques à la naissance divergent selon les choix", () => {
  const vivre = choix => {
    const s = E.nouvelleVie({ prenom: "J", seed: 52 });
    for (let j = 0; j < 20 * 365 && s.perso.vivant; j++) {
      if (s.evenement) { const n = E.actionsDisponibles(s).filter(a => a.id === "choisir").length; E.agir(s, { id: "choisir", cible: choix === "premier" ? 0 : n - 1 }); }
      E.avancer(s, 1);
    }
    return s;
  };
  const a = vivre("premier"), b = vivre("dernier");
  const ecart = Object.keys(a.traits).reduce((t, k) => t + Math.abs(a.traits[k] - b.traits[k]), 0);
  assert.ok(ecart >= 4, `écart de personnalité trop faible : ${ecart}`);
});

// ---------- Étape 6 : rejouabilité ----------
test("origines : naître à Water Seven, rentrer dormir chez soi", () => {
  const s = E.nouvelleVie({ prenom: "O", seed: 61, origine: "water_seven" });
  assert.equal(s.ile, "water_seven");
  assert.equal(s.lieu, "maison_w7");
  assert.match(s.journal[0].texte, /Water Seven/);
  s.jour = 20 * 365; s.lieu = "chantier";
  E.agir(s, { id: "repos" });
  // On dort chez soi, puis on se réveille là où l'on était.
  assert.equal(s.lieu, "chantier");
});

test("peuples : un homme-poisson naît sous la mer, plus fort, et nage jusqu'à Sabaody", () => {
  const s = E.nouvelleVie({ prenom: "P", seed: 62, peuple: "homme_poisson" });
  assert.equal(s.ile, "hommes_poissons");
  assert.ok(s.stats.force >= 4);
  s.jour = 18 * 365; s.lieu = "port_hp";
  assert.ok(E.agir(s, { id: "voyager", cible: "sabaody" }).ok);
  assert.equal(s.ile, "sabaody");
});

test("défis : l'orphelin n'a pas de parents, l'héritier hérite sans création d'argent", () => {
  const o = E.nouvelleVie({ prenom: "Q", seed: 63, defi: "orphelin" });
  assert.equal(o.pnj.mere.vivant, false);
  const h = E.nouvelleVie({ prenom: "R", seed: 64, defi: "heritier" });
  const masse = E.masseMonetaire(h);
  M.mourir(h, "mere", "de maladie");
  assert.equal(h.berrys, 5000);
  assert.equal(E.masseMonetaire(h), masse);
});

test("succès : débloqués une seule fois, notés au journal", () => {
  const s = ado(); s.lieu = "port";
  E.agir(s, { id: "travailler" });
  assert.ok(s.succes.premier_salaire);
  assert.ok(s.succes.majeur === undefined || s.succes.majeur >= 0);
  const n = s.journal.filter(e => e.type === "succes" && e.texte.includes("Premier salaire")).length;
  E.agir(s, { id: "travailler" });
  assert.equal(s.journal.filter(e => e.type === "succes" && e.texte.includes("Premier salaire")).length, n);
});

// ---------- Talents (exception B à D.2A : gains fixes majorés, choisis à la création) ----------
test("talents : Prodige donne toujours exactement +2 par entraînement physique", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 71, talents: ["prodige"] }); s.jour = 16 * 365;
  const f = s.stats.force;
  for (let i = 1; i <= 4; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "entrainer", cible: "force" }); assert.equal(s.stats.force, f + 2 * i); }
});

test("talents : sans talent, D.2A s'applique toujours (+1)", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 72 }); s.jour = 16 * 365;
  const f = s.stats.force;
  E.agir(s, { id: "entrainer", cible: "force" });
  assert.equal(s.stats.force, f + 1);
});

test("talents : Sens des affaires paie 10 Berrys de plus sans créer d'argent", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 73, talents: ["affaires"] }); s.jour = 16 * 365; s.lieu = "port";
  const masse = E.masseMonetaire(s);
  E.agir(s, { id: "travailler" });
  assert.equal(s.berrys, 40);
  assert.equal(E.masseMonetaire(s), masse);
});

test("talents : Infatigable divise la fatigue, Fruit promis trouve un fruit à la première exploration", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 74, talents: ["infatigable", "fruit_promis"] }); s.jour = 16 * 365; s.lieu = "colline";
  E.agir(s, { id: "explorer" });
  assert.equal(s.inventaire.fruits.length, 1);
  assert.ok(s.fatigue <= 8);
});

test("talents : tout cocher crée une vie valide, sans création d'argent", () => {
  const tous = Object.keys((await_import_talents()).TALENTS);
  const s = E.nouvelleVie({ prenom: "T", seed: 75, talents: tous });
  const masse = E.masseMonetaire(s);
  assert.ok(s.pnj.ami_enfance);
  E.avancer(s, 17 * 365, { sansInterruption: true });
  assert.ok(s.navire);
  assert.ok(s.drapeaux.pecule);
  assert.equal(E.masseMonetaire(s), masse);
});
import * as TA from "../jeu/talents.js";
function await_import_talents() { return TA; }

test("talents : Prodige s'applique partout (jeux d'enfant, travail aux docks, service Marine, événements)", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 76, talents: ["prodige"] }); s.jour = 3 * 365; s.lieu = "colline";
  const avant = s.stats.endurance + s.stats.agilite;
  E.agir(s, { id: "jouer" });
  assert.equal(s.stats.endurance + s.stats.agilite, avant + 2);
  s.jour = 20 * 365; s.ile = "loguetown"; s.lieu = "quais_logue"; s.heure = 8; s.fatigue = 0;
  const f = s.stats.force;
  E.agir(s, { id: "travailler" });
  assert.equal(s.stats.force, f + 2);
  s.ile = "shells"; s.lieu = "base"; s.heure = 8; s.fatigue = 0; s.carriere = { type: "marine", rang: 0, merite: 0, depuis: s.jour };
  const f2 = s.stats.force;
  E.agir(s, { id: "service" });
  assert.equal(s.stats.force, f2 + 2);
  s.evenement = { id: "course", jour: s.jour, data: {} };
  const a = s.stats.agilite;
  E.agir(s, { id: "choisir", cible: 0 });
  assert.equal(s.stats.agilite, a + 2);
});

test("talents : Doué de ses mains donne +2 à chaque progrès de compétence", () => {
  const s = E.nouvelleVie({ prenom: "T", seed: 77, talents: ["doue"] }); s.jour = 16 * 365; s.lieu = "port";
  E.agir(s, { id: "travailler" });
  assert.equal(s.competences.peche, 2);
  s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "cartes" });
  assert.equal(s.competences.navigation, 2);
});

test("talents : Génie s'applique aussi aux histoires du bar ; sans talent, toujours +1", () => {
  const g = E.nouvelleVie({ prenom: "T", seed: 78, talents: ["genie"] }); g.jour = 3 * 365; g.lieu = "bar";
  const i = g.stats.intelligence; E.agir(g, { id: "ecouter" }); assert.equal(g.stats.intelligence, i + 2);
  const n = E.nouvelleVie({ prenom: "T", seed: 78 }); n.jour = 3 * 365; n.lieu = "bar";
  const j = n.stats.intelligence; E.agir(n, { id: "ecouter" }); assert.equal(n.stats.intelligence, j + 1);
});

test("limite naturelle : jouer dehors progresse dans ce qui n'est pas bloqué, puis le dit clairement", () => {
  const s = E.nouvelleVie({ prenom: "L", seed: 79 }); s.jour = 4 * 365; s.lieu = "colline";
  s.stats.endurance = s.potentiel.endurance;
  const a = s.stats.agilite;
  E.agir(s, { id: "jouer" });
  assert.equal(s.stats.agilite, a + 1);
  s.stats.agilite = s.potentiel.agilite; s.heure = 8; s.fatigue = 0;
  const r = E.agir(s, { id: "jouer" });
  assert.equal(r.ok, false);
  assert.match(r.texte, /limites naturelles/);
});

// ---------- Carrière de pirate complète et sommeil sur place ----------
import * as P from "../jeu/pirate.js";

const avecRival = (s, extra = {}) => { s.monde.rivaux = [{ id: "rx", nom: "Pirates du Test", capitaine: "Barbe-Test", region: "eb", ile: s.ile, prime: 8000000, force: 30, actif: true, ...extra }]; };

test("dormir : on se réveille là où l'on était", () => {
  const s = ado(); s.lieu = "port";
  E.agir(s, { id: "repos" });
  assert.equal(s.lieu, "port");
  s.ile = "loguetown"; s.lieu = "marche_logue"; s.berrys = 50;
  E.agir(s, { id: "repos" });
  assert.equal(s.lieu, "marche_logue");
});

test("pirate : entrer comme mousse, corvées et promotion à mérite fixe", () => {
  const s = ado(); s.lieu = "port"; s.stats.force = 10; avecRival(s);
  assert.ok(E.agir(s, { id: "rejoindre" }).ok);
  assert.ok(P.estMembre(s));
  assert.equal(s.carriere.grade, 0);
  for (let i = 0; i < 8; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "corvees" }); }
  assert.equal(s.carriere.merite, 8);
  assert.equal(s.carriere.grade, 1);
});

test("pirate : le membre suit son équipage d'île en île", () => {
  const s = ado(); s.lieu = "port"; s.stats.force = 10; avecRival(s);
  E.agir(s, { id: "rejoindre" });
  s.monde.rivaux[0].ile = "shells";
  E.avancer(s, 1, { sansInterruption: true });
  assert.equal(s.ile, "shells");
});

test("pirate : la mutinerie du Second donne un navire et un équipage", () => {
  let reussie = false;
  for (let seed = 1; seed < 30 && !reussie; seed++) {
    const s = ado(); s.rng = seed; s.lieu = "port"; s.stats.force = 40; s.stats.charisme = 20; avecRival(s, { force: 20 });
    E.agir(s, { id: "rejoindre" });
    s.carriere.grade = 3;
    E.agir(s, { id: "mutinerie" });
    if (P.estCapitaine(s)) { reussie = true; assert.ok(s.navire); assert.equal(E.equipage(s).length, 4); assert.equal(s.monde.rivaux[0].actif, false); }
  }
  assert.ok(reussie);
});

test("capitaine : améliorations payées sans création d'argent, canons plus puissants", () => {
  const s = capitaine(); s.berrys = 5000; s.ile = "water_seven"; s.lieu = "chantier";
  const masse = E.masseMonetaire(s);
  const avant = P.bonusCanons(s);
  assert.ok(E.agir(s, { id: "ameliorer", cible: "canons" }).ok);
  assert.ok(E.agir(s, { id: "ameliorer", cible: "blindage" }).ok);
  assert.equal(P.bonusCanons(s), avant + 8);
  assert.equal(E.masseMonetaire(s), masse);
  assert.equal(E.agir(s, { id: "ameliorer", cible: "canons" }).ok, false);
});

test("capitaine : fête et prime font monter le moral, l'argent va à l'équipage", () => {
  const s = capitaine(); s.berrys = 500; s.carriere.moral = 30;
  P.creerMembre(s); P.creerMembre(s);
  const masse = E.masseMonetaire(s);
  E.agir(s, { id: "fete" });
  assert.equal(s.carriere.moral, 45);
  E.agir(s, { id: "prime_equipage" });
  assert.equal(s.carriere.moral, 55);
  assert.equal(E.masseMonetaire(s), masse);
});

test("capitaine : un duel gagné disperse l'équipage rival et rapporte des recrues", () => {
  let gagne = false;
  for (let seed = 1; seed < 30 && !gagne; seed++) {
    const s = capitaine(seed); s.stats.force = 40; s.stats.agilite = 40; avecRival(s, { force: 15 });
    E.agir(s, { id: "defier" }); finir(s);
    if (!s.monde.rivaux[0].actif) { gagne = true; assert.ok(E.equipage(s).length >= 1); assert.ok(s.prime > 0); }
  }
  assert.ok(gagne);
});

test("capitaine : un territoire verse un tribut chaque semaine, sans création d'argent", () => {
  const s = capitaine(); s.infamie = 12; s.prime = E.calculPrime(12);
  assert.ok(E.agir(s, { id: "proteger" }).ok);
  const masse = E.masseMonetaire(s); const b = s.berrys;
  E.avancer(s, 7, { sansInterruption: true });
  assert.ok(s.berrys >= b + 60);
  assert.equal(E.masseMonetaire(s), masse);
});

test("capitaine : un moral au plus bas provoque des désertions", () => {
  const s = capitaine(5); for (let i = 0; i < 3; i++) P.creerMembre(s);
  s.carriere.moral = 5;
  E.avancer(s, 60, { sansInterruption: true });
  assert.ok(E.equipage(s).length < 3 || !s.carriere);
});

test("pavillon : le bouton est visible sans navire et explique ce qu'il manque", () => {
  const s = ado(); s.lieu = "port";
  const a = E.actionsDisponibles(s).find(x => x.id === "pirate");
  assert.ok(a);
  assert.match(a.label, /navire/);
  const r = E.agir(s, { id: "pirate" });
  assert.equal(r.ok, false);
  assert.match(r.texte, /barques à 600 Berrys/);
});


test("cap des Jumeaux : plusieurs lieux, un travail, et on peut toujours en repartir sans navire", () => {
  const s = aLoguetown(); s.navire = null; s.ile = "cap"; s.lieu = "phare"; s.berrys = 0;
  assert.ok(E.lieuxDe("cap").length >= 3);
  assert.ok(E.agir(s, { id: "aller", cible: "falaises" }).ok);
  E.agir(s, { id: "aller", cible: "phare" });
  assert.ok(E.agir(s, { id: "travailler" }).ok);
  assert.equal(s.berrys, 30);
  s.berrys = 1000;
  const dest = E.actionsDisponibles(s).filter(a => a.id === "voyager");
  assert.ok(dest.length >= 2);
  assert.ok(E.agir(s, { id: "voyager", cible: "little_garden" }).ok || s.ile !== "cap");
});

// ---------- Cohérence : capture, prison, succession, couples, solde ----------
test("capture : cellule, territoires et titres perdus, sabre confisqué, tribut arrêté", () => {
  const s = capitaine(); s.infamie = 12; s.prime = E.calculPrime(12); s.inventaire.sabre = 1;
  s.carriere.territoires = ["fuchsia"]; s.carriere.corsaire = 1;
  s.evenement = { id: "pari", jour: s.jour, data: {} };
  E.capturer(s, "en mer");
  assert.equal(s.lieu, "cellule");
  assert.deepEqual(s.carriere.territoires, []);
  assert.equal(s.carriere.corsaire, false);
  assert.equal(s.inventaire.sabre, 0);
  assert.equal(s.evenement, null);
  const b = s.berrys;
  E.avancer(s, 14, { sansInterruption: true });
  assert.equal(s.berrys, b);
  assert.equal(E.agir(s, { id: "aller", cible: "port_shells" }).ok, false);
});

test("prison : les rendez-vous planifiés attendent, et la peine purgée annule la prime", () => {
  const s = capitaine(); s.infamie = 1; s.prime = E.calculPrime(1);
  E.capturer(s, "en mer");
  s.planifies.push({ jour: s.jour, id: "lettre", data: { p: "makino" } });
  E.avancer(s, 10, { sansInterruption: true });
  assert.equal(s.evenement, null);
  assert.equal(s.planifies.length, 1);
  E.avancer(s, 60, { sansInterruption: true });
  assert.equal(s.prison, null);
  assert.equal(s.prime, 0);
  assert.equal(s.infamie, 0);
});

test("on ne peut pas entrer dans la cellule ni dans la maison d'un autre", () => {
  const s = ado(); s.ile = "shells"; s.lieu = "port_shells";
  assert.equal(E.agir(s, { id: "aller", cible: "cellule" }).ok, false);
  assert.equal(E.agir(s, { id: "aller", cible: "maison_shells" }).ok, false);
  assert.ok(!E.lieuxAccessibles(s).includes("maison_shells"));
});

test("succession : ni fruit, ni prime, ni prison, ni réputation ne passent à l'enfant", () => {
  const s = ado(); s.jour = 40 * 365;
  s.fruit = { id: "echo", maitrise: 5 }; s.monde.fruitsTrouves = ["echo"];
  s.prime = 5000000; s.infamie = 4; s.prison = { jusqua: s.jour + 99, depuis: s.jour }; s.lieu = "cellule"; s.ile = "shells";
  s.reputation = { marine: -50 }; s.traits.courage = 8; s.drapeaux.memorialise = 1; s.succes = { fruit: 1 };
  s.famille.enfants.push({ prenom: "Z", naissance: s.jour - 20 * 365, genre: "f" });
  s.perso.vivant = false;
  const masse = E.masseMonetaire(s);
  assert.ok(E.succeder(s, 0).ok);
  assert.equal(s.fruit, null);
  assert.ok(!s.monde.fruitsTrouves.includes("echo"));
  assert.equal(s.prime, 0);
  assert.equal(s.prison, null);
  assert.deepEqual(s.reputation, {});
  assert.equal(s.traits.courage, 0);
  assert.equal(s.drapeaux.memorialise, undefined);
  assert.equal(s.pnj.mere.role, "ta grand-mère");
  assert.equal(E.masseMonetaire(s), masse);
  assert.notEqual(s.lieu, "cellule");
});

test("amour : impossible avec quelqu'un déjà en couple, pas d'enfant après 50 ans", () => {
  const s = ado(); s.jour = 25 * 365; s.lieu = "colline"; s.pnj.sacha.relation = 90;
  s.pnj.sacha.couple = "bern";
  assert.equal(E.agir(s, { id: "declarer", cible: "sacha" }).ok, false);
  s.pnj.sacha.couple = null; s.famille.partenaire = "sacha"; s.famille.statut = "marié"; s.pnj.sacha.lieu = "colline";
  s.pnj.sacha.naissance = s.jour - 55 * 365;
  assert.equal(E.agir(s, { id: "enfant" }).ok, false);
});

test("Marine : sans service, plus de solde, puis radiation pour désertion", () => {
  const s = ado(); s.ile = "shells"; s.lieu = "base"; s.stats.force = 5; s.stats.endurance = 5;
  E.agir(s, { id: "engager" });
  E.avancer(s, 28, { sansInterruption: true });
  const b = s.berrys;
  E.avancer(s, 28, { sansInterruption: true });
  assert.equal(s.berrys, b);
  E.avancer(s, 60, { sansInterruption: true });
  assert.equal(s.carriere, null);
});

test("un bébé ne sort pas seul, un membre d'équipage ne voyage pas seul", () => {
  const b = E.nouvelleVie({ prenom: "B", seed: 91 });
  assert.equal(E.agir(b, { id: "aller", cible: "port" }).ok, false);
  const s = ado(); s.lieu = "port"; s.berrys = 500; s.stats.force = 10; avecRival(s);
  E.agir(s, { id: "rejoindre" });
  assert.equal(E.agir(s, { id: "voyager", cible: "shells" }).ok, false);
});

test("prime : plafonnée par mer pour les coups ordinaires (East Blue ≈ 34 millions)", () => {
  const s = capitaine(); s.stats.force = 60; s.stats.agilite = 60;
  for (let i = 0; i < 400 && !s.prison && s.perso.vivant; i++) { s.heure = 8; s.fatigue = 0; s.sante.blessures = []; s.ile = "fuchsia"; s.lieu = "port"; s.navire ??= { type: "barque", nom: "X", coque: 100 }; E.agir(s, { id: "attaquer" }); }
  assert.ok(s.infamie <= 12, `notoriété ${s.infamie}`);
  assert.ok(s.prime <= 34000000);
  s.ile = "water_seven";
  assert.equal(E.plafondNotoriete(s), 45);
});

// ---------- Vie adulte à terre ----------
test("métier : Compagnon après 30 journées, prime fixe payée par l'employeur", () => {
  const s = ado(); s.lieu = "port"; s.pnj.bern.fonds = 100000; s.monde.exterieur -= 100000 - 600;
  const masse = E.masseMonetaire(s);
  for (let i = 0; i < 30; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "travailler" }); }
  const b = s.berrys; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "travailler" });
  assert.equal(s.berrys, b + 40);
  assert.equal(E.masseMonetaire(s), masse);
});

test("logement : acheter une maison sur une autre île, y dormir gratuitement, en faire son foyer", () => {
  const s = ado(); s.jour = 20 * 365; s.ile = "loguetown"; s.lieu = "quais_logue"; s.berrys = 3500; s.monde.exterieur -= 3500;
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "acheter_maison" }).ok);
  assert.equal(s.berrys, 500);
  E.agir(s, { id: "repos" });
  assert.equal(s.berrys, 500);
  assert.ok(E.agir(s, { id: "aller", cible: "maison_logue" }).ok);
  assert.ok(E.agir(s, { id: "demenager" }).ok);
  assert.equal(s.foyer, "maison_logue");
  assert.equal(E.masseMonetaire(s), masse);
});

test("commerce : revenu hebdomadaire s'il est visité, rien s'il est négligé", () => {
  const s = ado(); s.jour = 20 * 365 + 1; s.lieu = "place"; s.berrys = 1500; s.monde.exterieur -= 1500;
  const masse = E.masseMonetaire(s);
  assert.ok(E.agir(s, { id: "ouvrir_commerce", cible: "echoppe" }).ok);
  E.avancer(s, 14, { sansInterruption: true });
  assert.equal(s.berrys, 80);
  E.avancer(s, 60, { sansInterruption: true });
  const b = s.berrys;
  E.avancer(s, 14, { sansInterruption: true });
  assert.equal(s.berrys, b);
  assert.equal(E.masseMonetaire(s), masse);
});

test("famille : les leçons données à son enfant comptent à la succession", () => {
  const s = ado(); s.jour = 40 * 365;
  s.famille.enfants.push({ prenom: "Z", naissance: s.jour - 10 * 365, genre: "f" });
  for (let i = 0; i < 20; i++) { s.heure = 8; s.fatigue = 0; assert.ok(E.agir(s, { id: "enseigner_enfant" }).ok); }
  s.perso.vivant = false;
  E.succeder(s, 0);
  assert.equal(s.stats.force, 1 + 3 + 2);
});


test("événements : au moins 200, tous avec un identifiant unique et 2 à 4 choix", () => {
  const ids = EV.EVENEMENTS.map(e => e.id);
  assert.ok(ids.length >= 200, `${ids.length} événements`);
  assert.equal(new Set(ids).size, ids.length);
  for (const e of EV.EVENEMENTS) assert.ok(e.choix.length >= 2 && e.choix.length <= 4, e.id);
});

// ---------- Marine complète ----------
const marin = (rang = 0) => { const s = ado(); s.jour = 25 * 365; s.ile = "shells"; s.lieu = "base"; s.stats.force = 30; s.stats.agilite = 30; s.stats.endurance = 10;
  E.agir(s, { id: "engager" }); s.carriere.rang = rang; s.carriere.merite = E.MERITE_RANG[rang]; return s; };

test("Marine : mutation à Loguetown dès Caporal, service au nouveau poste seulement", () => {
  const s = marin(1);
  assert.equal(E.agir(s, { id: "mutation", cible: "loguetown" }).ok, false);
  s.carriere.rang = 2;
  const jour = s.jour;
  assert.ok(E.agir(s, { id: "mutation", cible: "loguetown" }).ok);
  assert.equal(s.lieu, "caserne_logue");
  assert.equal(s.jour, jour + 5);
  s.heure = 8; s.fatigue = 0;
  assert.ok(E.agir(s, { id: "service" }).ok);
  s.ile = "shells"; s.lieu = "base"; s.heure = 8; s.fatigue = 0;
  assert.equal(E.agir(s, { id: "service" }).ok, false);
});

test("Marine : le Lieutenant reçoit un navire de guerre, repris s'il quitte la Marine", () => {
  const s = marin(5); s.carriere.merite = 139;
  E.agir(s, { id: "service" });
  assert.equal(s.carriere.rang, 6);
  assert.ok(s.navire?.marine);
  E.agir(s, { id: "quitter" });
  assert.equal(s.navire, null);
});

test("Marine : traquer un équipage rapporte du mérite fixe et compte une capture", () => {
  let pris = false;
  for (let seed = 1; seed < 20 && !pris; seed++) {
    const s = marin(6); s.rng = seed; s.navire = { type: "caravelle", nom: "N", coque: 100, marine: true }; s.lieu = "port_shells";
    s.monde.rivaux = [{ id: "rm", nom: "Pirates Test", capitaine: "T", region: "eb", ile: "shells", prime: 20000000, force: 20, actif: true }];
    const m = s.carriere.merite;
    E.agir(s, { id: "traquer_pirates" });
    if (!s.monde.rivaux[0].actif) { pris = true; assert.equal(s.carriere.merite, m + 6); assert.equal(s.carriere.captures, 1); }
  }
  assert.ok(pris);
});

test("Marine : pas de Commodore sans Grand Line, pas de Vice-amiral sans Haki, pas d'Amiral sans dix captures", () => {
  const s = marin(7); s.carriere.merite = 1000;
  E.agir(s, { id: "service" });
  assert.equal(s.carriere.rang, 7);
  s.carriere.poste = "sabaody"; s.ile = "sabaody"; s.lieu = "poste_sabaody";
  for (let i = 0; i < 6; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "service" }); }
  assert.equal(s.carriere.rang, 9);
  s.haki.eveil.armement = true;
  for (let i = 0; i < 4; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "service" }); }
  assert.equal(s.carriere.rang, 10);
  s.carriere.captures = 10; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "service" });
  assert.equal(s.carriere.rang, 11);
  assert.equal(E.RANGS_MARINE[11], "Amiral");
});

// ---------- Combats jouables ----------
test("combat : manche par manche, le temps ne passe pas et les autres actions sont bloquées", () => {
  const s = ado(); s.lieu = "port"; s.monde.voyouAuPort = true; s.stats.force = 10; s.stats.agilite = 10;
  const r = E.agir(s, { id: "combattre" });
  assert.ok(r.combat && s.combat);
  assert.equal(E.agir(s, { id: "aller", cible: "bar" }).ok, false);
  assert.equal(E.avancer(s, 7).ok, false);
  assert.deepEqual(E.actionsDisponibles(s).map(a => a.id).slice(0, 2), ["c_frapper", "c_garde"]);
  const jour = s.jour, heure = s.heure;
  finir(s);
  assert.equal(s.combat, null);
  assert.equal(s.jour, jour); assert.equal(s.heure, heure);
  assert.equal(s.competences.combat, 1);
});

test("combat : la garde encaisse moins, le pouvoir du fruit est limité et frappe plus fort", () => {
  const s = ado(); s.lieu = "port"; s.monde.voyouAuPort = true; s.stats.endurance = 60;
  s.fruit = { id: "braise", maitrise: 0 };
  E.agir(s, { id: "combattre" }); s.combat.pvE = 999; s.combat.pvEmax = 999; s.combat.force = 40;
  const pv0 = s.combat.pvT; E.agir(s, { id: "c_garde" }); const garde = pv0 - s.combat.pvT;
  const pv1 = s.combat.pvT; E.agir(s, { id: "c_frapper" }); const front = pv1 - s.combat.pvT;
  assert.ok(garde < front);
  const pv2 = s.combat.pvT;
  assert.ok(E.agir(s, { id: "c_pouvoir" }).ok); assert.equal(s.combat.pvT, pv2); // Logia : intangible
  assert.ok(E.agir(s, { id: "c_pouvoir" }).ok);
  assert.equal(E.agir(s, { id: "c_pouvoir" }).ok, false);
});

test("combat : une mission de chasse n'est réussie que si le bandit est vaincu", () => {
  const s = ado(); s.stats.force = 40; s.stats.agilite = 40;
  s.missions.push({ id: "mc", code: "chasse", donneur: "woop", titre: "Chasser le bandit", condition: "c", lieu: "colline", difficulte: 14, duree: 5, recompense: 200, statut: "active", sequestre: 200, echeance: s.jour + 5 });
  s.pnj.woop.fonds -= 200; s.lieu = "colline";
  E.agir(s, { id: "accomplir" });
  assert.ok(s.combat);
  assert.equal(s.missions[0].statut, "active");
  finir(s);
  assert.equal(s.missions[0].statut, "réussie");
  assert.equal(s.berrys, 200);
});

// ---------- Fin du Nouveau Monde, peuples, fruits ----------
import * as FI from "../jeu/finale.js";

test("Laugh Tale : inaccessible sans les quatre empreintes, puis ouverte depuis Elbaf", () => {
  const s = aLoguetown(); s.ile = "elbaf"; s.lieu = "fjord_elbaf"; s.inventaire.logpose = 1; s.inventaire.logpose_nm = 1; s.competences.navigation = 30;
  assert.equal(E.agir(s, { id: "voyager", cible: "laugh_tale" }).ok, false);
  assert.ok(!E.actionsDisponibles(s).some(a => a.cible === "laugh_tale"));
  s.poneglyphes = { zou: 1, whole_cake: 1, wano: 1, egghead: 1 };
  assert.ok(E.actionsDisponibles(s).some(a => a.cible === "laugh_tale"));
  let la = false;
  for (let i = 0; i < 30 && !la; i++) { s.ile = "elbaf"; s.lieu = "fjord_elbaf"; s.navire ??= { type: "caravelle", nom: "T", coque: 100 }; s.navire.coque = 100; s.sante.blessures = []; E.agir(s, { id: "voyager", cible: "laugh_tale" }); la = s.ile === "laugh_tale"; }
  assert.ok(la);
  E.agir(s, { id: "aller", cible: "coeur_lt" });
  assert.ok(E.agir(s, { id: "decouvrir" }).ok);
  assert.ok(s.drapeaux.onePiece);
  assert.ok(s.succes.laugh_tale);
});

test("Ponéglyphes : Zou exige la confiance de Nara, l'épave exige de savoir naviguer", () => {
  const s = aLoguetown(); s.ile = "zou"; s.lieu = "baleine_zou";
  E.agir(s, { id: "empreinte" });
  assert.equal(FI.empreintes(s), 0);
  s.pnj.nara.relation = 30; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "empreinte" });
  assert.equal(FI.empreintes(s), 1);
  assert.equal(E.agir(s, { id: "empreinte" }).ok, false);
  s.ile = "egghead"; s.lieu = "epave_egg"; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "empreinte" });
  assert.equal(FI.empreintes(s), 1);
  s.competences.navigation = 15; s.heure = 8; s.fatigue = 0;
  E.agir(s, { id: "empreinte" });
  assert.equal(FI.empreintes(s), 2);
});

test("peuples : un Mink naît à Zou avec l'Électro, un géant naît à Elbaf, fort et sans barque", () => {
  const m = E.nouvelleVie({ prenom: "M", seed: 81, peuple: "mink" });
  assert.equal(m.ile, "zou");
  const h = E.nouvelleVie({ prenom: "H", seed: 81 });
  assert.ok(E.puissance(m) >= E.puissance(h) + 4);
  const g = E.nouvelleVie({ prenom: "G", seed: 82, peuple: "geant" });
  assert.equal(g.ile, "elbaf");
  assert.ok(g.stats.force >= 9);
  g.jour = 20 * 365; g.ile = "fuchsia"; g.lieu = "atelier"; g.berrys = 1000;
  assert.equal(E.agir(g, { id: "acheter", cible: "barque" }).ok, false);
});

test("fruits : huit fruits inventés, tous avec un pouvoir", () => {
  assert.equal(Object.keys(E.FRUITS).length, 8);
  for (const f of Object.values(E.FRUITS)) assert.ok(f.nom && f.pouvoir && f.bonus > 0);
});

// ---------- Carrière de révolutionnaire ----------
import * as RV from "../jeu/revolution.js";
const revolu = () => { const s = ado(); s.jour = 22 * 365; s.ile = "loguetown"; s.lieu = "echafaud"; s.traits.bonte = 3; s.berrys = 1000; s.monde.exterieur -= 1000;
  assert.ok(E.agir(s, { id: "revolution" }).ok); return s; };
const frais = s => { s.heure = 8; s.fatigue = 0; };

test("révolution : l'armée n'existe pas encore à l'âge d'or de Roger", () => {
  const s = E.nouvelleVie({ prenom: "R", seed: 95, ere: "roger" }); s.jour = 20 * 365; s.ile = "loguetown"; s.lieu = "echafaud"; s.traits.bonte = 5;
  assert.equal(E.agir(s, { id: "revolution" }).ok, false);
});

test("révolution : tracts et entraide font monter le soutien et l'influence à pas fixes", () => {
  const s = revolu(); const masse = E.masseMonetaire(s);
  frais(s); E.agir(s, { id: "tracts" });
  assert.equal(s.carriere.soutien.loguetown, 5);
  assert.equal(s.carriere.influence, 1);
  frais(s); E.agir(s, { id: "entraide" });
  assert.equal(s.carriere.soutien.loguetown, 15);
  assert.equal(s.berrys, 950);
  assert.equal(E.masseMonetaire(s), masse);
});

test("révolution : promotion à l'influence, cellule à 30 de soutien, dons hebdomadaires", () => {
  const s = revolu();
  assert.equal(E.agir(s, { id: "cellule" }).ok, false);
  for (let i = 0; i < 10; i++) { frais(s); E.agir(s, { id: "tracts" }); }
  assert.equal(s.carriere.grade, 1);
  frais(s);
  assert.ok(E.agir(s, { id: "cellule" }).ok);
  assert.deepEqual(s.carriere.cellules, ["loguetown"]);
  const masse = E.masseMonetaire(s); const b = s.berrys;
  s.carriere.couverture = 100;
  E.avancer(s, 7, { sansInterruption: true });
  assert.equal(s.berrys, b + 15);
  assert.equal(E.masseMonetaire(s), masse);
});

test("révolution : un soulèvement réussi libère l'île et ouvre le grade de Commandant", () => {
  let libre = false;
  for (let seed = 1; seed < 30 && !libre; seed++) {
    const s = revolu(); s.rng = seed; s.stats.force = 40; s.stats.agilite = 40; s.stats.charisme = 20;
    s.carriere.grade = 2; s.carriere.influence = 69; s.carriere.cellules = ["loguetown"]; s.carriere.soutien.loguetown = 100;
    frais(s); E.agir(s, { id: "soulevement" });
    if (s.carriere.liberees.includes("loguetown")) { libre = true; assert.equal(s.carriere.grade, 3); assert.ok(s.prime > 0); assert.ok(RV.refuge(s)); }
  }
  assert.ok(libre);
});

test("révolution : une couverture trop basse attire une rafle ; se cacher la fait remonter", () => {
  const s = revolu(); s.carriere.couverture = 0;
  let rafle = false;
  for (let i = 0; i < 40 && !rafle; i++) { E.avancer(s, 7); rafle = s.evenement?.id === "rafle"; if (s.evenement && !rafle) E.agir(s, { id: "choisir", cible: 0 }); s.carriere && (s.carriere.couverture = 0); if (!s.carriere || s.prison) break; }
  assert.ok(rafle);
  const t = revolu(); t.carriere.couverture = 40; const jour = t.jour;
  E.agir(t, { id: "planque" });
  assert.equal(t.jour, jour + 7);
  assert.ok(t.carriere.couverture >= 60);
});

test("révolution : libérer des captifs passe par un combat", () => {
  const s = revolu(); s.ile = "sabaody"; s.lieu = "mangroves"; s.stats.force = 60; s.stats.agilite = 60; s.stats.endurance = 60;
  frais(s); E.agir(s, { id: "liberer" });
  assert.ok(s.combat);
  finir(s);
  assert.equal(s.carriere.influence, 5);
  assert.ok(s.carriere.soutien.sabaody >= 15);
});

// ---------- Carrière de chasseur de primes ----------
import * as CH from "../jeu/chasseur.js";
const chasseurDe = (seed = 3) => { const s = aLogue(); s.rng = seed; s.stats.force = 30; s.stats.agilite = 30; s.stats.endurance = 20; s.berrys = 200; s.monde.exterieur -= 200;
  assert.ok(E.agir(s, { id: "chasseur" }).ok);
  s.monde.rivaux = [{ id: "c1", nom: "Pirates du Test", capitaine: "Krag", region: "eb", ile: "loguetown", prime: 20000000, force: 18, actif: true },
    { id: "c2", nom: "Pirates Lointains", capitaine: "Vasco", region: "eb", ile: "shells", prime: 8000000, force: 12, actif: true }];
  return s; };

test("chasseur : avis de recherche, contrat, et capture sous contrat mieux récompensée en renommée", () => {
  const s = chasseurDe();
  const r = E.agir(s, { id: "avis" });
  assert.match(r.texte, /Krag/); assert.match(r.texte, /Vasco/);
  assert.ok(E.agir(s, { id: "contrat", cible: "c1" }).ok);
  s.lieu = "quais_logue"; const masse = E.masseMonetaire(s); const b = s.berrys;
  frais(s); E.agir(s, { id: "traquer" }); finir(s);
  assert.equal(s.monde.rivaux[0].actif, false);
  assert.equal(s.berrys, b + CH.primeVersee(20000000));
  assert.equal(s.carriere.renommee, CH.renommeeCapture(20000000) + 3);
  assert.equal(s.carriere.contrat, null);
  assert.equal(E.masseMonetaire(s), masse);
});

test("chasseur : le piège affaiblit la cible d'un quart et ne sert qu'une fois", () => {
  const s = chasseurDe(); s.lieu = "quais_logue";
  frais(s); assert.ok(E.agir(s, { id: "piege" }).ok);
  assert.equal(s.berrys, 170);
  frais(s); E.agir(s, { id: "traquer" });
  assert.equal(s.combat.force, Math.round((18 + 8) * 0.75));
  assert.equal(s.carriere.piege, false);
});

test("chasseur : petites primes à renommée fixe, rang Traqueur à 10, associé payé 30 %", () => {
  const s = chasseurDe(); s.monde.rivaux = []; s.lieu = "quais_logue";
  let n = 0;
  while (s.carriere.petites < 10 && n++ < 80) { frais(s); s.sante.blessures = []; E.agir(s, { id: "petite_prime" }); finir(s); }
  assert.equal(s.carriere.renommee, 10);
  assert.equal(s.carriere.rang, 1);
  s.lieu = "auberge_logue"; s.stats.charisme = 40;
  for (let i = 0; i < 10 && !E.equipage(s).length; i++) { frais(s); E.agir(s, { id: "associe" }); }
  const a = E.equipage(s)[0]; assert.ok(s.pnj[a].associe);
  const masse = E.masseMonetaire(s); const fa = s.pnj[a].fonds; const p = s.carriere.petites;
  n = 0; while (s.carriere.petites === p && n++ < 40) { frais(s); s.sante.blessures = []; E.agir(s, { id: "petite_prime" }); finir(s); }
  assert.equal(s.pnj[a].fonds, fa + 18);
  assert.equal(E.masseMonetaire(s), masse);
});

test("chasseur : une prime sur sa tête révoque la licence ; un contrat tombe si la cible disparaît", () => {
  const s = chasseurDe(); E.agir(s, { id: "contrat", cible: "c2" });
  s.monde.rivaux[1].actif = false;
  E.avancer(s, 1, { sansInterruption: true });
  assert.equal(s.carriere.contrat, null);
  s.infamie = 2; s.prime = E.calculPrime(2);
  E.avancer(s, 1, { sansInterruption: true });
  assert.equal(s.carriere, null);
});

// ---------- Carrière d'agent du Gouvernement mondial ----------
import * as GO from "../jeu/gouvernement.js";
const agentCP = (grade = 0) => { const s = ado(); s.jour = 22 * 365; s.ile = "loguetown"; s.lieu = "bureau_gm"; s.stats.intelligence = 20; s.stats.force = 30; s.stats.agilite = 30; s.stats.endurance = 25; s.stats.charisme = 20;
  assert.ok(E.agir(s, { id: "cipher" }).ok); s.carriere.grade = grade; s.carriere.service = GO.SERVICE_GRADE[grade]; return s; };

test("Cipher Pol : refusé à un recherché ou à un sympathisant révolutionnaire", () => {
  const s = ado(); s.jour = 22 * 365; s.ile = "loguetown"; s.lieu = "bureau_gm"; s.stats.intelligence = 20; s.stats.force = 30;
  s.reputation = { revolution: 20 };
  assert.equal(E.agir(s, { id: "cipher" }).ok, false);
  s.reputation = {}; s.infamie = 1; s.prime = E.calculPrime(1);
  assert.equal(E.agir(s, { id: "cipher" }).ok, false);
});

test("Cipher Pol : solde seulement en service, désertion après trois mois, prime sur la tête", () => {
  const s = agentCP(); const masse = E.masseMonetaire(s);
  E.avancer(s, 7, { sansInterruption: true });
  assert.equal(s.berrys, GO.SOLDE_CP[0]);
  assert.equal(E.masseMonetaire(s), masse);
  E.avancer(s, 100, { sansInterruption: true });
  assert.equal(s.carriere, null);
  assert.ok(s.prime > 0);
});

test("Rokushiki : six séances par technique, +3 de puissance chacune, conservé après le service", () => {
  const s = agentCP(1); const p0 = E.puissance(s);
  for (let i = 1; i <= 6; i++) { frais(s); E.agir(s, { id: "rokushiki" }); assert.equal(s.rokushiki.length, i === 6 ? 1 : 0); }
  assert.equal(E.puissance(s), p0 + 3);
  s.lieu = "quais_logue"; E.agir(s, { id: "deserter" });
  assert.equal(s.carriere, null);
  assert.equal(E.puissance(s), p0 + 3);
});

test("Cipher Pol : promotions aux états de service, CP9 verrouillé sans trois techniques", () => {
  const s = agentCP(2); s.carriere.service = 69; s.lieu = "auberge_logue";
  let n = 0; while (s.carriere.service < 70 && n++ < 40) { frais(s); E.agir(s, { id: "surveillance" }); }
  assert.equal(s.carriere.grade, 2);
  s.rokushiki = ["soru", "geppo", "tekkai"];
  n = 0; const sv = s.carriere.service; while (s.carriere.service === sv && n++ < 40) { frais(s); E.agir(s, { id: "surveillance" }); }
  assert.equal(s.carriere.grade, 3);
});

test("Cipher Pol : une arrestation est un combat ; un agent voyage gratuitement", () => {
  const s = agentCP(1);
  frais(s); E.agir(s, { id: "arrestation" });
  assert.ok(s.combat); finir(s);
  assert.equal(s.carriere.service, 10 + 4);
  s.lieu = "quais_logue"; s.sante.blessures = []; const b = s.berrys;
  E.agir(s, { id: "voyager", cible: "shells" });
  assert.equal(s.ile, "shells");
  assert.ok(s.berrys >= b);
});

test("Cipher Pol : refuser le Buster Call, c'est déserter", () => {
  const s = agentCP(3);
  s.evenement = { id: "cp_buster_call", jour: s.jour, data: {} };
  E.agir(s, { id: "choisir", cible: 1 });
  assert.equal(s.carriere, null);
  assert.ok(s.prime > 0);
  assert.ok(s.traits.bonte >= 3);
});

// ---------- Carte et voyages ----------
import * as CA from "../jeu/carte.js";

test("carte : infoVoyage annonce durée, prix, mode, passage dangereux et ce qui manque", () => {
  const s = ado(); s.jour = 20 * 365; s.berrys = 300;
  let v = E.infoVoyage(s, "shells");
  assert.equal(v.obstacle, null); assert.equal(v.jours, 2); assert.equal(v.prix, 40); assert.equal(v.mode, "passager");
  v = E.infoVoyage(s, "wano");
  assert.ok(v.horsRoute);
  s.berrys = 10;
  assert.match(E.infoVoyage(s, "shells").obstacle, /coûte 40 Berrys/);
  s.ile = "loguetown"; s.navire = { type: "caravelle", nom: "N", coque: 100 };
  v = E.infoVoyage(s, "cap");
  assert.equal(v.prix, 0); assert.equal(v.mode, "navire"); assert.match(v.passage, /Reverse Mountain/);
  s.ile = "cap";
  assert.match(E.infoVoyage(s, "little_garden").obstacle, /Log Pose/);
  assert.equal(E.infoVoyage(s, "cap").obstacle, "Tu y es déjà.");
});

test("carte : toutes les îles ont une position, l'itinéraire passe par les bonnes étapes, Laugh Tale reste cachée", () => {
  for (const i of Object.keys(E.ILES)) assert.ok(CA.POSITIONS[i], i);
  assert.deepEqual(CA.chemin("fuchsia", "little_garden"), ["fuchsia", "loguetown", "cap", "little_garden"]);
  const s = ado();
  const html = CA.carteHTML(s, "loguetown");
  assert.ok(html.includes('data-ile="wano"'));
  assert.ok(!html.includes('data-ile="laugh_tale"'));
  assert.ok(html.includes('data-carte-partir="loguetown"') || html.includes("obstacle"));
  s.poneglyphes = { zou: 1, whole_cake: 1, wano: 1, egghead: 1 };
  assert.ok(CA.carteHTML(s, null).includes('data-ile="laugh_tale"'));
});
