/** Règle partagée : les actions restent accessibles, mais leur rendement s'érode dans l'année.
 * Les trois premières utilisations gardent leur rendement. Les pénalités n'avancent jamais l'âge.
 * Compteurs entiers sûrs ; aucun quota fixe de clics.
 */
export const FREE_REPETITIONS=3;
export function diminishingFactor(used,grace=FREE_REPETITIONS){
 const extra=Math.max(0,Math.min(100000,used-grace+1));
 return Math.max(.05,1/(1+.42*extra));
}
export function scaledBenefit(base,used,grace=FREE_REPETITIONS){
 if(!Number.isFinite(base))throw new TypeError('Bénéfice invalide');
 if(base<=0)return Math.round(base);
 return Math.max(0,Math.round(base*diminishingFactor(used,grace)));
}
export function scaledChance(chance,used,grace=FREE_REPETITIONS,min=8){
 return Math.max(min,Math.min(95,Math.round(chance*diminishingFactor(used,grace))));
}
export function nextCount(used){
 return Math.min(Number.MAX_SAFE_INTEGER,used+1);
}
