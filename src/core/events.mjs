// Le moteur sélectionne UN événement annuel. Les catalogues sont des données, pas du code UI.
export const EVENTS = Object.freeze([
  { id: 'baby-smile', min: 1, max: 5, text: 'Une journée de jeux vous laisse un très bon souvenir.', effects: { bonheur: 3 } },
  { id: 'baby-cold', min: 1, max: 5, text: 'Vous passez quelques jours fatigué après un rhume.', effects: { sante: -3 } },
  { id: 'baby-story', min: 1, max: 5, text: 'Une histoire sur les pirates éveille votre curiosité.', effects: { intelligence: 2 } },
  { id: 'school-friend', min: 6, max: 12, text: 'Vous vous faites un nouvel ami pendant l’année.', effects: { bonheur: 4 } },
  { id: 'school-learn', min: 6, max: 12, text: 'Vous découvrez avec passion les cartes des mers.', effects: { intelligence: 4 } },
  { id: 'school-sick', min: 6, max: 12, text: 'Une petite maladie vous oblige à rester au repos.', effects: { sante: -4 } },
  { id: 'teen-training', min: 13, max: 17, text: 'Vous prenez goût à l’entraînement physique.', effects: { sante: 4 } },
  { id: 'teen-discovery', min: 13, max: 17, text: 'Vous apprenez une chose étonnante sur le vaste monde.', effects: { intelligence: 3 } },
  { id: 'teen-setback', min: 13, max: 17, text: 'Une dispute gâche quelque peu votre semaine.', effects: { bonheur: -4 } },
  { id: 'adult-market', min: 18, max: 99, text: 'Une belle rencontre anime votre journée au marché.', effects: { bonheur: 3 } },
  { id: 'adult-reading', min: 18, max: 99, text: 'Vous consacrez du temps à découvrir le monde.', effects: { intelligence: 3 } },
  { id: 'adult-rest', min: 18, max: 99, text: 'Une période de repos vous fait le plus grand bien.', effects: { sante: 3 } },
  { id: 'adult-worry', min: 18, max: 99, text: 'Les nouvelles venues d’une autre île vous préoccupent.', effects: { bonheur: -3 } },
  { id: 'adult-sun', min: 18, max: 99, text: 'Une longue journée en plein air vous fatigue.', effects: { sante: -2 } }
]);
export function eventsForAge(age) { return EVENTS.filter(e => age >= e.min && age <= e.max); }
