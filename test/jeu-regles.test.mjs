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
    if (s.infamie === 1 && !s.prison) {
      reussi = true;
      assert.ok(s.berrys > b);
      assert.equal(s.prime, E.calculPrime(1));
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
  for (let i = 0; i < 3000; i++) { s.heure = 8; s.fatigue = 0; E.agir(s, { id: "explorer" }); }
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
    E.agir(s, { id: "combattre" });
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

test("Grand Line : Reverse Mountain exige un navire et 17 ans", () => {
  const s = aLoguetown(); s.navire = null;
  assert.equal(E.agir(s, { id: "voyager", cible: "cap" }).ok, false);
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
    E.agir(s, { id: "colisee" });
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
