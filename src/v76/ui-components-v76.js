(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('uiLayoutDataV76');if(!data)throw new Error('UI layout data V7.6 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeState(state={}){
    const density=['focus','expanded'].includes(state.density)?state.density:'focus';
    const activeTab=data.tabs.some(t=>t.id===state.activeTab)?state.activeTab:'life';
    return {
      version:1,
      density,
      activeTab,
      collapsed:state.collapsed&&typeof state.collapsed==='object'?{...state.collapsed}:{},
      scroll:state.scroll&&typeof state.scroll==='object'?{...state.scroll}:{},
      reducedMotion:!!state.reducedMotion,
      lastViewedYear:Number.isFinite(Number(state.lastViewedYear))?Number(state.lastViewedYear):-99
    }
  }

  function sectionCollapsed(state={},section={}){
    const s=normalizeState(state);
    if(Object.prototype.hasOwnProperty.call(s.collapsed,section.key))return !!s.collapsed[section.key];
    return s.density==='focus'?!!section.defaultCollapsed:false
  }

  function toggleSection(state={},key){
    const next=normalizeState(state),section=data.sections.find(s=>s.key===key);
    if(!section)return next;
    next.collapsed[key]=!sectionCollapsed(next,section);
    return next
  }

  function toggleDensity(state={}){
    const next=normalizeState(state);
    next.density=next.density==='focus'?'expanded':'focus';
    next.collapsed={};
    return next
  }

  function priority(ctx={}){
    const list=[];
    const add=(severity,title,desc,tab='life',action=null)=>list.push({severity,title,desc,tab,action,rank:data.severity[severity]?.rank||0});
    if(ctx.pendingDecision)add('critical','Décision en attente',ctx.pendingDecisionTitle||'Un choix important attend ta réponse.','life','decision');
    if(ctx.activeArc&&!ctx.pendingDecision)add('high','Arc majeur en cours',ctx.activeArcTitle||'Un événement majeur demande ton attention.','life');
    if(ctx.annualTurnActive&&!ctx.pendingDecision)add('high','Année interrompue',String(ctx.annualProgress||'')+' mois simulés sur 12. Reprends la simulation.','life','advance');
    if(ctx.health<35)add('critical','Santé critique','Ta santé est à '+Math.round(ctx.health)+'%. Réduis le risque et récupère.','life');
    else if(ctx.energy<22)add('high','Énergie très basse','Il te reste '+Math.round(ctx.energy)+'% d’énergie. Une année trop chargée peut coûter cher.','life');
    if(ctx.activeMission)add('high','Mission active',ctx.activeMissionTitle||'Une mission sera résolue pendant l’année.','character');
    if(ctx.promotionEligible)add('medium','Promotion possible','Ton dossier remplit les critères. Une commission peut désormais se prononcer.','character');
    else if(ctx.promotionMissing?.length)add('low','Prochaine promotion','À améliorer : '+ctx.promotionMissing.slice(0,3).join(', ')+'.','character');
    if(ctx.highRelationRisk>0)add('medium','Lien sous tension',ctx.highRelationRisk+' relation'+(ctx.highRelationRisk>1?'s':'')+' présente'+(ctx.highRelationRisk>1?'nt':'')+' un risque élevé de fracture.','relations');
    if(ctx.overdueConsequences>0)add('high','Le passé revient',ctx.overdueConsequences+' conséquence'+(ctx.overdueConsequences>1?'s':'')+' arrive'+(ctx.overdueConsequences>1?'nt':'')+' à échéance.','life');
    else if(ctx.highConsequences>0)add('medium','Conséquences en suspens',ctx.highConsequences+' conséquence'+(ctx.highConsequences>1?'s':'')+' importante'+(ctx.highConsequences>1?'s':'')+' peu'+(ctx.highConsequences>1?'vent':'t')+' revenir plus tard.','life');
    if(ctx.worldThreats>0)add('medium','Menaces dans le monde',ctx.worldThreats+' situation'+(ctx.worldThreats>1?'s':'')+' urgente'+(ctx.worldThreats>1?'s':'')+' détectée'+(ctx.worldThreats>1?'s':'')+'.','world');
    if(ctx.travel)add('medium','Voyage en cours','Destination : '+ctx.travel+'.','world');
    if(!list.length)add('calm','Trajectoire stable','Aucune urgence immédiate. Tu peux choisir librement ce que tu veux développer cette année.','life');
    return list.sort((a,b)=>b.rank-a.rank)[0]
  }

  function navBadges(ctx={}){
    return {
      life:ctx.pendingDecision?1:(ctx.annualTurnActive?1:0),
      character:ctx.activeMission?1:(ctx.promotionEligible?1:0),
      abilities:0,
      relations:Math.min(9,Math.max(0,Math.floor(num(ctx.highRelationRisk)))),
      world:Math.min(9,Math.max(0,Math.floor(num(ctx.worldThreats))))
    }
  }

  function annualDeltas(report=null){
    if(!report)return[];
    const out=[];
    const add=(id,label,value,suffix='')=>{
      const n=Number(value);if(!Number.isFinite(n)||n===0)return;
      out.push({id,label,value:n,text:(n>0?'+':'')+Math.round(n)+suffix,tone:n>0?'up':'down'})
    };
    add('power','Puissance',report.powerDelta);
    add('money','Berry',report.moneyDelta,' B');
    add('health','Santé',report.healthDelta,'%');
    if(report.rankBefore&&report.rankAfter&&report.rankBefore!==report.rankAfter)out.push({id:'rank',label:'Rang',value:1,text:report.rankBefore+' → '+report.rankAfter,tone:'up'});
    if(num(report.visitedDelta)>0)out.push({id:'places',label:'Exploration',value:num(report.visitedDelta),text:'+'+num(report.visitedDelta)+' lieu'+(num(report.visitedDelta)>1?'x':''),tone:'up'});
    return out.slice(0,5)
  }

  function snapshot(ctx={}){
    return {
      age:num(ctx.age),
      money:num(ctx.money),
      health:num(ctx.health),
      energy:num(ctx.energy),
      power:num(ctx.power),
      rank:String(ctx.rank||''),
      location:String(ctx.location||''),
      reputation:num(ctx.reputation)
    }
  }

  function diffSnapshots(before=null,after=null){
    if(!before||!after)return[];
    const out=[];
    for(const key of ['money','health','energy','power','reputation']){
      const delta=num(after[key])-num(before[key]);
      if(Math.abs(delta)>.001)out.push({key,delta,tone:delta>0?'up':'down'});
    }
    if(before.rank!==after.rank)out.push({key:'rank',delta:1,tone:'up',from:before.rank,to:after.rank});
    if(before.location!==after.location)out.push({key:'location',delta:1,tone:'neutral',from:before.location,to:after.location});
    return out
  }

  function focusModel(ctx={}){
    const p=priority(ctx),annual=annualDeltas(ctx.lastAnnualReport);
    const vitals=[
      {id:'power',label:'Puissance',value:Math.round(num(ctx.power)),tone:num(ctx.power)>=70?'strong':'normal'},
      {id:'health',label:'Santé',value:Math.round(num(ctx.health))+'%',tone:num(ctx.health)<35?'danger':num(ctx.health)<65?'warn':'good'},
      {id:'energy',label:'Énergie',value:Math.round(num(ctx.energy))+'%',tone:num(ctx.energy)<22?'danger':num(ctx.energy)<50?'warn':'good'},
      {id:'rep',label:'Réputation',value:String(ctx.reputationLabel||'Inconnu'),tone:num(ctx.reputation)>=60?'strong':'normal'}
    ];
    return {priority:p,annual,vitals}
  }

  function densityLabel(state={}){
    const s=normalizeState(state);
    return s.density==='focus'?'Vue Focus':'Tout afficher'
  }

  registry.register('uiComponentsV76',{
    version:'7.6.0',normalizeState,sectionCollapsed,toggleSection,toggleDensity,priority,navBadges,
    annualDeltas,snapshot,diffSnapshots,focusModel,densityLabel,clone
  });
})(window);
