(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('gameFlowDataV90');if(!data)throw new Error('Game flow data V9.0 missing');

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));

function normalizeState(state={}){
  return {
    version:1,
    annualPreset:data.presets[state.annualPreset]?state.annualPreset:'balanced',
    customPlan:!!state.customPlan,
    lastDigestYear:Number.isFinite(Number(state.lastDigestYear))?Number(state.lastDigestYear):-99,
    digestSeenYear:Number.isFinite(Number(state.digestSeenYear))?Number(state.digestSeenYear):-99,
    lastPriorityKey:String(state.lastPriorityKey||''),
    detailOpen:!!state.detailOpen,
    totalYearsViewed:Math.max(0,Math.floor(num(state.totalYearsViewed)))
  };
}
function add(out,type,title,desc,score,extra={}){
  const spec=data.priorityTypes[type]||data.priorityTypes.world;
  out.push({key:extra.key||type,type,title,desc,score:num(score),tab:extra.tab||spec.tab,severity:extra.severity||spec.severity,action:extra.action||'open',meta:extra.meta||''})
}
function priorities(ctx={}){
  const out=[];
  if(!ctx.alive){add(out,'survival','Cette vie est terminée','Consulte le bilan de vie avant de recommencer.',100,{key:'death'});return out}
  if(ctx.pendingDecision)add(out,'decision',ctx.pendingDecisionTitle||'Une décision t’attend','La simulation est en pause exactement au moment où ton choix compte.',100,{key:'decision',action:'decision'});
  if(num(ctx.health)<=25)add(out,'survival','Santé critique','Ta priorité immédiate est de survivre et récupérer.',95,{key:'health'});
  else if(num(ctx.health)<=45)add(out,'survival','Santé fragile','Réduire les risques maintenant évitera qu’une année prometteuse se termine stupidement.',78,{key:'health'});
  if(num(ctx.energy)<=20)add(out,'survival','Énergie épuisée','Ton efficacité chute fortement. Une année de récupération devient rationnelle.',88,{key:'energy'});
  else if(num(ctx.energy)<=40)add(out,'year','Fatigue importante','Allège au moins un domaine du plan annuel.',68,{key:'energy'});
  if(ctx.activeMission)add(out,'mission',ctx.activeMissionTitle||'Mission active','Choisis ton approche puis avance l’année pour la résoudre.',82,{key:'mission'});
  if(ctx.travel)add(out,'travel','Traversée en cours','Le prochain jalon important est ton arrivée à '+String(ctx.travelDestination||'destination')+'.',80,{key:'travel'});
  if(ctx.annualActive)add(out,'year','Année en cours',Math.round(num(ctx.annualProgress))+'/12 mois simulés. Les décisions majeures reprendront automatiquement le fil.',76,{key:'annual',action:'advance'});
  else add(out,'year','Préparer la prochaine année','Choisis un plan rapide ou ajuste les domaines avancés avant de simuler.',52,{key:'annual-plan',action:'plan'});
  if(num(ctx.consequenceSeverity)>=65)add(out,'consequence','Conséquence urgente','Une ancienne décision approche d’un point critique.',74,{key:'consequence'});
  else if(num(ctx.consequenceSeverity)>=35)add(out,'consequence','Conséquence active','Une situation passée peut encore revenir cette année.',57,{key:'consequence'});
  if(num(ctx.brokenEquipment)>0)add(out,'equipment','Équipement endommagé',num(ctx.brokenEquipment)+' objet(s) cassé(s) ne donnent plus de bonus.',63,{key:'equipment'});
  if(ctx.campaign)add(out,'campaign',ctx.campaignTitle||'Saga régionale active','Le rapport de force régional évolue et peut créer de nouvelles opportunités.',55,{key:'campaign'});
  if(ctx.nemesis)add(out,'nemesis',ctx.nemesisName||'Un adversaire persistant','Cette rivalité continue de progresser hors de ton champ de vision.',54,{key:'nemesis'});
  if(num(ctx.money)<Math.max(2500,num(ctx.annualCost)*.45))add(out,'resources','Réserves faibles','Tes Berry couvrent mal les besoins et investissements à venir.',58,{key:'money'});
  return out.sort((a,b)=>b.score-a.score).slice(0,4)
}
function flowScore(ctx={}){
  let score=78;
  score+=(clamp(num(ctx.health),0,100)-70)*.18;
  score+=(clamp(num(ctx.energy),0,100)-65)*.14;
  if(ctx.pendingDecision)score-=8;
  if(num(ctx.brokenEquipment)>0)score-=Math.min(10,num(ctx.brokenEquipment)*3);
  if(num(ctx.consequenceSeverity)>60)score-=8;
  if(ctx.activeMission)score+=3;
  if(ctx.annualActive)score+=3;
  return Math.round(clamp(score,20,100))
}
function recommendedPreset(ctx={}){
  if(num(ctx.health)<50||num(ctx.energy)<42)return'recovery';
  if(ctx.travel||num(ctx.explorationIntent)>0)return'adventure';
  if(ctx.activeMission||num(ctx.careerPressure)>60)return'career';
  if(num(ctx.money)<3500)return'wealth';
  return'balanced'
}
function digest(report={},events=[]){
  const metrics=[];
  const delta=(label,value,suffix='',weight=1)=>{
    const n=num(value);if(!n)return;
    metrics.push({label,value:n,text:(n>0?'+':'')+Math.round(n*10)/10+suffix,tone:n>0?'good':'bad',importance:Math.abs(n)*weight})
  };
  delta('Puissance',report.powerDelta,'',3);
  delta('Berry',report.moneyDelta,' B',.00018);
  delta('Santé',report.healthDelta,'%',2);
  delta('XP carrière',report.xpDelta,'',1.6);
  delta('Prime',report.bountyDelta,' B',.00012);
  delta('Nouveaux lieux',report.visitedDelta,'',5);
  delta('Relations',report.relationsDelta,'',3);
  if(report.rankBefore&&report.rankAfter&&report.rankBefore!==report.rankAfter)metrics.push({label:'Promotion',value:1,text:String(report.rankBefore)+' → '+String(report.rankAfter),tone:'good',importance:12});
  const highlights=(Array.isArray(report.highlights)?report.highlights:[]).slice(0,4).map(x=>({title:x.title,desc:x.desc,type:x.type||'normal'}));
  const eventHighlights=(Array.isArray(events)?events:[]).filter(x=>['canon','danger','major'].includes(x.type)).slice(0,3).map(x=>({title:x.title,desc:x.desc,type:x.type}));
  const merged=[];for(const h of [...highlights,...eventHighlights])if(!merged.some(x=>x.title===h.title))merged.push(h);
  return {
    year:num(report.year),
    classification:String(report.classification||'Année terminée'),
    metrics:metrics.sort((a,b)=>b.importance-a.importance).slice(0,4),
    highlights:merged.slice(0,4),
    interruptions:Math.max(0,Math.floor(num(report.interruptions))),
    riskSpent:Math.max(0,num(report.riskSpent)),
    riskBudget:Math.max(0,num(report.riskBudget)),
    adventureDiscoveries:Math.max(0,Math.floor(num(report.adventureDiscoveries)))
  }
}
function planSummary(plan={}){
  const parts=[];
  const preset=Object.entries(data.presets).find(([,p])=>Object.entries(p.plan).every(([k,v])=>(plan[k]||'standard')===v));
  if(preset)return {preset:preset[0],label:preset[1].label,custom:false};
  for(const k of ['career','training','relations','adventure','resources'])parts.push(String(plan[k]||'steady'));
  return {preset:null,label:'Personnalisé',custom:true,key:parts.join('|')}
}
function presetPlan(id){return data.presets[id]?clone(data.presets[id].plan):clone(data.presets.balanced.plan)}

registry.register('gameFlowEngineV90',{version:'9.0.0',normalizeState,priorities,flowScore,recommendedPreset,digest,planSummary,presetPlan});
})(window);
