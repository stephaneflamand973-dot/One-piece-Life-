// Talents choisis à la création (décision du joueur : option B, sélection libre).
// D.2A reste la règle du jeu ; seule exception : un talent choisi à la création peut modifier un gain,
// toujours d'une quantité FIXE et connue d'avance (jamais de hasard, jamais de rendement décroissant).

import { rand, noter, age } from "./engine.js";

const AN = 365;

export const TALENTS = {
  // Progression (exception B : gains fixes majorés)
  prodige: { groupe: "Progression", nom: "Prodige", desc: "Chaque gain de force, d'agilité ou d'endurance est toujours de +2 au lieu de +1 (entraînement, jeux, travail, service, événements)." },
  genie: { groupe: "Progression", nom: "Génie", desc: "Chaque gain d'intelligence est toujours de +2 au lieu de +1, et chaque journée d'école donne +2 en éducation." },
  doue: { groupe: "Progression", nom: "Doué de ses mains", desc: "Chaque progrès dans une compétence (pêche, cuisine, charpenterie, combat, navigation, musique, médecine) est toujours de +2 au lieu de +1." },
  haki_inne: { groupe: "Progression", nom: "Don pour le Haki", desc: "Chaque leçon ou séance de Haki compte toujours double (+2)." },
  affinite_fruit: { groupe: "Progression", nom: "Affinité avec les fruits", desc: "Chaque séance de maîtrise d'un Fruit du Démon rapporte toujours +2." },
  affaires: { groupe: "Progression", nom: "Sens des affaires", desc: "Chaque salaire rapporte toujours 10 Berrys de plus, payés par l'employeur s'il le peut." },
  charisme_naturel: { groupe: "Progression", nom: "Charisme naturel", desc: "Chaque conversation rapporte toujours +4 en relation au lieu de +2, et chaque gain de charisme est de +2." },
  infatigable: { groupe: "Progression", nom: "Infatigable", desc: "Toutes les activités te fatiguent deux fois moins." },
  // Corps et esprit
  costaud: { groupe: "Corps et esprit", nom: "Né costaud", desc: "+2 en force au départ." },
  constitution: { groupe: "Corps et esprit", nom: "Constitution solide", desc: "+2 en endurance au départ ; tes blessures ne laissent jamais de séquelles." },
  esprit_vif: { groupe: "Corps et esprit", nom: "Esprit vif", desc: "+2 en intelligence et +10 en éducation au départ." },
  potentiel: { groupe: "Corps et esprit", nom: "Grand potentiel", desc: "Tes limites naturelles sont plus hautes (+30 dans chaque caractéristique)." },
  longevite: { groupe: "Corps et esprit", nom: "Longévité", desc: "La vieillesse et les maladies arrivent dix ans plus tard." },
  // Talents innés
  ne_en_mer: { groupe: "Talents innés", nom: "Né en mer", desc: "+5 en navigation au départ." },
  cuisinier: { groupe: "Talents innés", nom: "Fin cuisinier", desc: "+5 en cuisine au départ." },
  musicien: { groupe: "Talents innés", nom: "Oreille musicale", desc: "+5 en musique au départ." },
  combattant: { groupe: "Talents innés", nom: "Instinct du combat", desc: "+3 en combat au départ." },
  // Destin
  rois: { groupe: "Destin", nom: "Haki des Rois dormant", desc: "Tu portes le Haki des Rois. Il faudra encore l'éveiller dans un moment décisif." },
  fruit_promis: { groupe: "Destin", nom: "Fruit promis", desc: "Un Fruit du Démon t'attend : ta première exploration après 12 ans le trouvera." },
  lignee_d: { groupe: "Destin", nom: "Porteur du D.", desc: "Ta vie attire les événements (plus fréquents), et la Marine se méfie de toi." },
  chanceux: { groupe: "Destin", nom: "Chanceux", desc: "Tes explorations trouvent bien plus souvent quelque chose." },
  // Richesse et relations
  famille_aisee: { groupe: "Richesse et relations", nom: "Famille aisée", desc: "Tes parents ont 2 000 Berrys de plus chacun." },
  pecule: { groupe: "Richesse et relations", nom: "Petit pécule", desc: "200 Berrys mis de côté pour toi, versés à tes 14 ans." },
  ami_enfance: { groupe: "Richesse et relations", nom: "Ami d'enfance", desc: "Un ami de ton âge, déjà très proche de toi." },
  protege: { groupe: "Richesse et relations", nom: "Protégé d'un maître", desc: "Garo, le vieux marin de Loguetown, te connaît et t'apprécie déjà." },
  navire_herite: { groupe: "Richesse et relations", nom: "Navire en héritage", desc: "Une barque t'attend à tes 16 ans." },
};

export const aTalent = (s, id) => !!s.talents?.includes(id);

// Bonus fixes de l'exception B, lus aux endroits où les gains sont appliqués.
const PHYSIQUE = ["force", "agilite", "endurance"];
// Bonus fixe ajouté à chaque gain d'une caractéristique ou d'une compétence, quelle que soit l'activité.
export const bonusStat = (s, k) => (PHYSIQUE.includes(k) && aTalent(s, "prodige")) || (k === "intelligence" && aTalent(s, "genie"))
  || (k === "charisme" && aTalent(s, "charisme_naturel")) ? 1 : 0;
export const bonusCompetence = (s, k) => (aTalent(s, "doue") ? 1 : 0);
export const bonusHaki = s => (aTalent(s, "haki_inne") ? 1 : 0);
export const bonusFruit = s => (aTalent(s, "affinite_fruit") ? 1 : 0);
export const bonusSalaire = s => (aTalent(s, "affaires") ? 10 : 0);
export const bonusRelation = s => (aTalent(s, "charisme_naturel") ? 2 : 0);
export const facteurFatigue = s => (aTalent(s, "infatigable") ? 0.5 : 1);
// Les géants vivent environ trois fois plus longtemps que les humains.
export const decalageAge = s => (aTalent(s, "longevite") ? 10 : 0) + (s.peuple === "geant" ? 140 : 0);

export function appliquerTalents(s, talents = []) {
  s.talents = talents.filter(t => TALENTS[t]);
  const t = id => aTalent(s, id);
  if (t("costaud")) s.stats.force += 2;
  if (t("constitution")) s.stats.endurance += 2;
  if (t("esprit_vif")) { s.stats.intelligence += 2; s.education = (s.education || 0) + 10; }
  if (t("potentiel")) for (const k of Object.keys(s.potentiel)) s.potentiel[k] += 30;
  if (t("ne_en_mer")) s.competences.navigation += 5;
  if (t("cuisinier")) s.competences.cuisine += 5;
  if (t("musicien")) s.competences.musique += 5;
  if (t("combattant")) s.competences.combat += 3;
  if (t("rois")) s.haki.roisInne = true;
  if (t("lignee_d")) s.reputation.marine = (s.reputation.marine || 0) - 10;
  if (t("famille_aisee")) for (const id of ["mere", "pere"]) if (s.pnj[id] && s.pnj[id].vivant !== false) { s.monde.exterieur -= 2000; s.pnj[id].fonds += 2000; }
  if (t("protege") && s.pnj.garo) s.pnj.garo.relation = 40;
  if (t("ami_enfance")) {
    const genre = rand(s) < 0.5 ? "f" : "g";
    s.pnj.ami_enfance = { nom: genre === "f" ? "Lou" : "Tao", role: "ton ami d'enfance", genre, lieu: s.foyer || "maison", relation: 50, fonds: 20,
      souvenirs: [{ jour: 0, texte: "vous avez grandi ensemble" }], naissance: s.perso.naissance + 30, vivant: true, enfants: [], parents: [], couple: null, romance: true };
    s.monde.exterieur -= 20;
  }
}

// Chaque année, à l'anniversaire : versements promis par les talents.
export function anniversaireTalents(s) {
  if ((s.jour - s.perso.naissance) % AN !== 0) return;
  const a = age(s);
  if (a === 14 && aTalent(s, "pecule") && !s.drapeaux.pecule) { s.drapeaux.pecule = s.jour; s.monde.exterieur -= 200; s.berrys += 200; noter(s, "Tes 14 ans : on te remet le petit pécule mis de côté pour toi, 200 Berrys.", "famille"); }
  if (a >= 16 && !s.prison && aTalent(s, "navire_herite") && !s.navire && !s.drapeaux.navireHerite) {
    s.drapeaux.navireHerite = s.jour;
    s.navire = { type: "barque", nom: "L'Héritage", coque: 100 };
    noter(s, "Tu as l'âge : on te confie la barque familiale, « L'Héritage ». Tu peux prendre la mer.", "famille");
  }
}
