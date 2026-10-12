/**
 * Moteur narratif de V0.3, isolé de l'affichage et de la navigation.
 * Chaque année produit UNE entrée. Seules les étapes définies ci-dessous
 * demandent une décision. Les choix marquent durablement la vie.
 */
export const QUALITY_KEYS = Object.freeze(['audace', 'curiosite', 'solidarite']);

const SCENES = [
  { age: 6, id: 'quai', title: 'Un enfant sur le quai',
    text: 'Près du port, un enfant a perdu son petit bateau en bois. Que faites-vous ?',
    options: [
      { id: 'aider', label: 'L’aider à retrouver son bateau', quality: 'solidarite',
        result: 'Vous aidez cet enfant. Votre générosité ne passe pas inaperçue.',
        followUp: 'L’enfant du quai vous remercie à nouveau. Votre geste a laissé un bon souvenir.' },
      { id: 'observer', label: 'Observer la mer et ses courants', quality: 'curiosite',
        result: 'Vous observez les courants pour comprendre où le bateau a dérivé.',
        followUp: 'Depuis cet épisode, vous remarquez mieux les courants et les marées.' }
    ] },
  { age: 12, id: 'cartes', title: 'Une carte mystérieuse',
    text: 'Un vieux marin vous montre une carte incomplète des îles voisines. Comment réagissez-vous ?',
    options: [
      { id: 'etudier', label: 'Étudier les indications de la carte', quality: 'curiosite',
        result: 'Vous étudiez soigneusement la carte et retenez ses repères.',
        followUp: 'Les symboles de la carte vous permettent de mieux comprendre les voyages.' },
      { id: 'partir', label: 'Demander à participer à une sortie en mer', quality: 'audace',
        result: 'Vous demandez à prendre la mer pour voir les îles de vos propres yeux.',
        followUp: 'Cette envie d’exploration vous pousse à regarder au-delà de votre île.' }
    ] },
  { age: 16, id: 'tempete', title: 'Une tempête approche',
    text: 'Le vent se lève au village. Des habitants se préparent à protéger leurs embarcations.',
    options: [
      { id: 'aider', label: 'Prêter main-forte aux habitants', quality: 'solidarite',
        result: 'Vous participez à la protection des bateaux avant la tempête.',
        followUp: 'Les habitants se souviennent de votre aide pendant la tempête.' },
      { id: 'affronter', label: 'Renforcer vous-même les amarres au port', quality: 'audace',
        result: 'Vous intervenez avec détermination sur les amarres.',
        followUp: 'Votre sang-froid au port vous donne confiance dans les moments difficiles.' }
    ] },
  { age: 18, id: 'horizon', title: 'À la croisée des chemins',
    text: 'Vous êtes adulte. Une nouvelle étape de votre vie s’ouvre devant vous.',
    options: [
      { id: 'apprendre', label: 'Découvrir le monde avant de choisir une voie', quality: 'curiosite',
        result: 'Vous décidez de prendre le temps de découvrir le vaste monde.',
        followUp: 'Vous collectez des récits de voyage pour préparer votre avenir.' },
      { id: 'agir', label: 'Prendre rapidement vos responsabilités', quality: 'audace',
        result: 'Vous choisissez d’affronter directement les responsabilités de l’âge adulte.',
        followUp: 'Vous abordez votre nouvelle vie avec une énergie déterminée.' }
    ] },
  { age: 25, id: 'voyageur', title: 'Un voyageur demande de l’aide',
    text: 'Un voyageur bloqué au port cherche quelqu’un pour l’orienter.',
    options: [
      { id: 'guider', label: 'Prendre du temps pour le guider', quality: 'solidarite',
        result: 'Vous accompagnez le voyageur et l’aidez à retrouver son chemin.',
        followUp: 'Votre rencontre avec ce voyageur vous rappelle l’importance de l’entraide.' },
      { id: 'questionner', label: 'Lui demander des nouvelles des autres îles', quality: 'curiosite',
        result: 'Vous échangez des informations sur les îles lointaines.',
        followUp: 'Les récits du voyageur nourrissent encore votre curiosité.' }
    ] },
  { age: 35, id: 'passage', title: 'Un passage difficile',
    text: 'Une traversée locale devient compliquée à cause de vents changeants.',
    options: [
      { id: 'oser', label: 'Aider à trouver un passage plus sûr', quality: 'audace',
        result: 'Vous participez avec courage à la recherche d’une route sûre.',
        followUp: 'L’épisode de la traversée renforce votre confiance en vos décisions.' },
      { id: 'ecouter', label: 'Écouter les conseils des navigateurs expérimentés', quality: 'curiosite',
        result: 'Vous apprenez à interpréter les signes annonçant le mauvais temps.',
        followUp: 'Les conseils des navigateurs vous servent encore aujourd’hui.' }
    ] },
  { age: 50, id: 'transmission', title: 'Transmettre son expérience',
    text: 'Une jeune personne vous demande ce que vous avez appris de votre vie.',
    options: [
      { id: 'enseigner', label: 'Partager ce que vous savez', quality: 'solidarite',
        result: 'Vous partagez vos connaissances avec patience.',
        followUp: 'Votre discussion inspire la personne que vous avez aidée.' },
      { id: 'encourager', label: 'L’encourager à suivre sa propre route', quality: 'audace',
        result: 'Vous lui transmettez le goût des décisions courageuses.',
        followUp: 'Vos paroles lui ont donné l’envie de tracer sa voie.' }
    ] },
  { age: 70, id: 'souvenirs', title: 'Les souvenirs du port',
    text: 'En regardant les navires, vous repensez au chemin parcouru.',
    options: [
      { id: 'raconter', label: 'Raconter vos souvenirs à votre entourage', quality: 'solidarite',
        result: 'Vous partagez vos souvenirs avec celles et ceux qui vous entourent.',
        followUp: 'Vos histoires deviennent des souvenirs précieux pour votre entourage.' },
      { id: 'explorer', label: 'Continuer à apprendre sur le monde', quality: 'curiosite',
        result: 'Vous conservez votre curiosité pour les horizons inconnus.',
        followUp: 'Même après toutes ces années, votre curiosité reste vive.' }
    ] }
];
export const EVENTS = Object.freeze(SCENES.map(scene => Object.freeze({
  ...scene, options: Object.freeze(scene.options.map(option => Object.freeze(option)))
})));

export function sceneForAge(age) { return EVENTS.find(scene => scene.age === age) ?? null; }
export function optionFor(scene, optionId) {
  return scene?.options.find(option => option.id === optionId) ?? null;
}
export function emptyStory() {
  return { qualities: { audace: 0, curiosite: 0, solidarite: 0 }, decisions: [], pending: null };
}
export function qualityAfterChoice(qualities, option) {
  return { ...qualities, [option.quality]: Math.min(5, qualities[option.quality] + 1) };
}
function followUpFor(age, decisions) {
  const last = decisions.findLast(decision => decision.age === age - 1);
  if (!last) return null;
  const scene = sceneForAge(last.age);
  return optionFor(scene, last.option)?.followUp ?? null;
}
const AMBIENT = Object.freeze({
  childhood: [
    'Vous jouez près de votre maison et découvrez de nouveaux endroits.',
    'Les histoires des marins éveillent votre imagination.',
    'Une promenade au village vous fait découvrir le quotidien du port.'
  ],
  youth: [
    'Vous observez les navires qui traversent le port.',
    'Vous apprenez à mieux connaître votre île.',
    'Des récits venus d’autres mers attirent votre attention.'
  ],
  adult: [
    'Une saison paisible vous permet de réfléchir à votre avenir.',
    'La vie du port change avec l’arrivée de nouveaux voyageurs.',
    'Vous prenez le temps de réfléchir aux décisions de votre vie.'
  ],
  elder: [
    'Vous profitez d’une journée tranquille face à la mer.',
    'Les mouvements du port vous rappellent des années passées.',
    'Vous regardez les nouvelles générations préparer leur avenir.'
  ]
});
export function annualNarrative(life, story) {
  const followUp = followUpFor(life.age, story.decisions);
  if (followUp) return followUp;
  const band = life.age <= 12 ? 'childhood' : life.age <= 17 ? 'youth' :
    life.age < 65 ? 'adult' : 'elder';
  const options = AMBIENT[band];
  const { audace, curiosite, solidarite } = story.qualities;
  const index = (life.age * 7 + audace * 2 + curiosite * 5 + solidarite * 11) % options.length;
  return options[index];
}
