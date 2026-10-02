(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('worldCanonDataV75');if(!data)throw new Error('World canon data V7.5 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeState(state={}){
    return {
      version:1,
      lastDirectorMonth:Number.isFinite(Number(state.lastDirectorMonth))?Number(state.lastDirectorMonth):-99,
      totalActions:Math.max(0,Math.floor(num(state.totalActions))),
      totalClashes:Math.max(0,Math.floor(num(state.totalClashes))),
      totalMoves:Math.max(0,Math.floor(num(state.totalMoves))),
      totalFruitTransfers:Math.max(0,Math.floor(num(state.totalFruitTransfers))),
      totalCrewShifts:Math.max(0,Math.floor(num(state.totalCrewShifts))),
      ledger:Array.isArray(state.ledger)?state.ledger.slice(0,40):[],
      fruitHistory:Array.isArray(state.fruitHistory)?state.fruitHistory.slice(0,24):[],
      crewHistory:Array.isArray(state.crewHistory)?state.crewHistory.slice(0,24):[],
      actorHistory:Array.isArray(state.actorHistory)?state.actorHistory.slice(0,40):[]
    }
  }

  function factionRelation(a='Civil',b='Civil'){
    if(a===b)return num(data.factionRelations[a]?.[b])||45;
    return num(data.factionRelations[a]?.[b]??data.factionRelations[b]?.[a]??0)
  }

  function profile(faction='Civil'){return data.factionProfiles[faction]||data.factionProfiles.Civil}

  function actorPriority(actor={},ctx={}){
    const importance=num(actor.importance),power=num(actor.power),health=num(actor.health)||100,experience=num(actor.experience);
    const regionHeat=num(ctx.regionHeat?.[actor.currentRegion]);
    const momentum=num(actor.momentum??50);
    const activeBonus=actor.status==='alive'||actor.status==='active'?8:-30;
    return +(importance*.42+power*.24+momentum*.10+Math.min(18,experience*.025)+regionHeat*.12+health*.04+activeBonus).toFixed(2)
  }

  function regionOptions(actor={}){
    const current=actor.currentRegion||actor.region||'Grand Line';
    const linked=data.regionLinks[current]||data.regions.filter(r=>r!==current);
    const regions=actor.regions||[],explicit=regions.filter(r=>r!=='Global');
    if(regions.includes('Global'))return linked.filter(r=>r!==current);
    if(explicit.length)return [...new Set(explicit)].filter(r=>r!==current);
    return linked.filter(r=>r!==current)
  }

  function hostileTargets(actor={},actors=[]){
    return actors.filter(x=>
      x&&x.id!==actor.id&&(x.status==='alive'||x.status==='active')&&
      (x.currentRegion||x.region)===(actor.currentRegion||actor.region)&&
      factionRelation(actor.faction,x.faction)<=-25
    )
  }

  function cooperativeTargets(actor={},actors=[]){
    return actors.filter(x=>
      x&&x.id!==actor.id&&(x.status==='alive'||x.status==='active')&&
      (x.currentRegion||x.region)===(actor.currentRegion||actor.region)&&
      factionRelation(actor.faction,x.faction)>=15
    )
  }

  function availableFruits(actor={},fruits=[]){
    const owns=fruits.some(f=>['held','consumed'].includes(f.status)&&String(f.holder||'').toLowerCase()===String(actor.name||actor.id||'').toLowerCase());
    if(owns)return[];
    const region=actor.currentRegion||actor.region;
    return fruits.filter(f=>!f.holder&&['world','hidden','discovered'].includes(f.status)&&(f.region==='Global'||f.region===region))
  }

  function actionCandidates(actor={},ctx={}){
    const p=profile(actor.faction),health=num(actor.health)||100,momentum=num(actor.momentum??50),importance=num(actor.importance);
    const enemies=hostileTargets(actor,ctx.actors||[]);
    const allies=cooperativeTargets(actor,ctx.actors||[]);
    const fruits=availableFruits(actor,ctx.fruits||[]);
    const moves=regionOptions(actor);
    const c=[];
    if(health<48)c.push({type:'recover',weight:(1+(48-health)/18)*p.recover});
    if(moves.length)c.push({type:'move',weight:(.8+importance/140)*p.mobility,targets:moves});
    if(enemies.length&&health>=32)c.push({type:'clash',weight:(.55+importance/120+momentum/150)*p.conflict,targets:enemies});
    if(allies.length)c.push({type:'cooperate',weight:(.40+importance/180)*p.cooperate,targets:allies});
    c.push({type:'influence',weight:(.62+importance/150+momentum/180)*p.influence});
    if(fruits.length&&health>=45)c.push({type:'fruit',weight:(.25+importance/170)*p.fruit,targets:fruits});
    return c.filter(x=>x.weight>0)
  }

  function weightedPick(items=[],roll=.5){
    if(!items.length)return null;
    const total=items.reduce((n,x)=>n+Math.max(0,num(x.weight)),0);
    if(total<=0)return items[0];
    let t=clamp(Number(roll),0,.999999)*total;
    for(const x of items){t-=Math.max(0,num(x.weight));if(t<=0)return x}
    return items[items.length-1]
  }

  function planAction(actor={},ctx={},rolls={}){
    const candidates=actionCandidates(actor,ctx),picked=weightedPick(candidates,rolls.action??.5);
    if(!picked)return null;
    const target=Array.isArray(picked.targets)&&picked.targets.length?picked.targets[Math.min(picked.targets.length-1,Math.floor(clamp(Number(rolls.target??.5),0,.999999)*picked.targets.length))]:null;
    const region=actor.currentRegion||actor.region||'Global';
    const action={type:picked.type,actorId:actor.id,actorName:actor.name,actorFaction:actor.faction,region,targetId:null,targetName:null,importance:clamp(Math.round((num(actor.importance)+num(target?.importance||50))/2),20,100)};
    if(picked.type==='move'){action.toRegion=target;action.targetName=target}
    if(['clash','cooperate'].includes(picked.type)&&target){action.targetId=target.id;action.targetName=target.name}
    if(picked.type==='fruit'&&target){action.targetId=target.id;action.targetName=target.name}
    return action
  }

  function resolveClash(actor={},target={},roll=.5){
    const aHealth=num(actor.health)||100,bHealth=num(target.health)||100;
    const aScore=num(actor.power)+aHealth*.08+num(actor.experience)*.015+(Number(roll)-.5)*24;
    const bScore=num(target.power)+bHealth*.08+num(target.experience)*.015+(0.5-Number(roll))*24;
    const winner=aScore>=bScore?actor:target,loser=winner===actor?target:actor;
    const margin=Math.abs(aScore-bScore),harm=clamp(7+margin*.38,7,24);
    return {
      winnerId:winner.id,loserId:loser.id,
      loserHealth:clamp((num(loser.health)||100)-harm,1,100),
      injuryMonths:Math.max(1,Math.round(1+harm/8)),
      winnerExperience:+clamp(num(winner.experience)+2+margin*.12,0,9999).toFixed(2),
      margin:+margin.toFixed(2),harm:+harm.toFixed(1)
    }
  }

  function resolveFruitSeek(actor={},fruit={},roll=.5){
    const chance=clamp(.30+num(actor.power)/220+num(actor.importance)/300,.28,.88);
    return {success:Number(roll)<chance,chance:+chance.toFixed(3),fruitId:fruit?.id,holder:actor.name||actor.id,region:actor.currentRegion||actor.region||'Global'}
  }

  function influenceDelta(actor={},ctx={}){
    const base=2.2+num(actor.importance)/45+num(actor.power)/70;
    const pressure=actor.faction==='Pirates'?'Piraterie':actor.faction==='Marine'?'Marine':actor.faction==='Révolutionnaires'?'Révolution':actor.faction==='Gouvernement'?'Instabilité':'Criminalité';
    return {faction:actor.faction,region:actor.currentRegion||actor.region||'Global',influence:+clamp(base,1.5,7).toFixed(2),pressure,pressureDelta:+clamp(base*.55,.8,4).toFixed(2)}
  }

  function actionText(action={},actor={},target=null){
    if(action.type==='move')return {title:(actor.name||'Un acteur majeur')+' se redéploie',desc:(actor.name||'Un acteur majeur')+' quitte '+(action.region||'sa zone')+' pour '+action.toRegion+'.'};
    if(action.type==='clash')return {title:(actor.name||'Un acteur majeur')+' affronte '+(target?.name||action.targetName||'un rival'),desc:'Un affrontement hors écran modifie l’état réel des deux trajectoires.'};
    if(action.type==='cooperate')return {title:'Coopération entre '+(actor.name||'un acteur')+' et '+(target?.name||action.targetName||'un allié'),desc:'Leur relation et leur influence locale se renforcent.'};
    if(action.type==='fruit')return {title:(actor.name||'Un acteur majeur')+' recherche '+(target?.name||action.targetName||'un Fruit'),desc:'La circulation d’un Fruit du Démon devient un enjeu concret du monde.'};
    if(action.type==='recover')return {title:(actor.name||'Un acteur majeur')+' se replie',desc:'Blessures, fatigue ou pression stratégique imposent une phase de récupération.'};
    return {title:(actor.name||'Un acteur majeur')+' exerce son influence',desc:'Sa faction transforme sa présence en pression territoriale.'}
  }

  function syncCrew(crew={},leader=null){
    const next=clone(crew),changes=[];
    if(!leader)return {crew:next,changes};
    if(leader.status==='dead'&&['active','future'].includes(next.status)){
      next.momentum=clamp(num(next.momentum)-28,0,100);
      if(next.status==='active'){
        next.status=next.importance>=94?'fractured':'dissolved';
        changes.push({type:'leader_loss',status:next.status,label:'Perte du leader'})
      }
    }else if(leader.status==='alive'){
      const lr=leader.currentRegion||leader.region;
      if(lr&&next.currentRegion!==lr&&next.region!=='Global'){next.currentRegion=lr;changes.push({type:'follow_leader',region:lr,label:'Déplacement avec le leader'})}
      const targetPower=clamp(num(next.power)*.78+num(leader.power)*.22,0,100);
      if(Math.abs(targetPower-num(next.power))>=.4){next.power=+targetPower.toFixed(2);changes.push({type:'power_sync',power:next.power,label:'Puissance synchronisée'})}
    }
    return {crew:next,changes}
  }

  function holderMatchesActor(holder,actor={}){
    const raw=String(holder||''),h=raw.toLowerCase().replace(/[^a-z0-9]/g,'');
    const alias=data.holderAliases?.[raw];
    const names=[actor.id,actor.name,alias].filter(Boolean).map(x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,''));
    return !!h&&names.includes(h)
  }

  function syncFruit(fruit={},actors=[]){
    if(!fruit.holder)return {fruit:clone(fruit),released:false};
    const holder=actors.find(a=>holderMatchesActor(fruit.holder,a));
    if(holder&&holder.status==='dead'){
      const next=clone(fruit);next.holder=null;next.status='world';next.region=holder.currentRegion||holder.region||data.fruitReleaseRules.defaultRegion;
      return {fruit:next,released:true,reason:'dead_holder',formerHolder:holder.name||holder.id,region:next.region}
    }
    return {fruit:clone(fruit),released:false}
  }

  function eventCoherence(event={},ctx={}){
    const anchor=data.eventAnchors[event.id];if(!anchor)return {actorReady:true,missingCharacters:[],missingCrews:[],score:100};
    const chars=ctx.characters||[],crews=ctx.crews||[];
    const missingCharacters=(anchor.characters||[]).filter(id=>{const c=chars.find(x=>x.id===id);return !c||c.status!=='alive'});
    const missingCrews=(anchor.crews||[]).filter(id=>{const c=crews.find(x=>x.id===id);return !c||!['active','future'].includes(c.status)});
    const missing=missingCharacters.length+missingCrews.length;
    return {actorReady:missing===0,missingCharacters,missingCrews,score:clamp(100-missing*34,0,100)}
  }

  function regionHeat(region,ctx={}){
    const p=ctx.pressures?.[region]||{},actors=(ctx.actors||[]).filter(a=>(a.currentRegion||a.region)===region&&(a.status==='alive'||a.status==='active'));
    const crews=(ctx.crews||[]).filter(c=>(c.currentRegion||c.region)===region&&c.status==='active');
    const pressure=(num(p.Instabilité)+num(p.Piraterie)+num(p.Marine)+num(p.Révolution)+num(p.Criminalité))/5;
    const major=actors.reduce((n,a)=>n+num(a.importance),0)/Math.max(1,actors.length||1);
    const crewPower=crews.reduce((n,c)=>n+num(c.power),0)/Math.max(1,crews.length||1);
    return +clamp(pressure*.48+Math.min(28,actors.length*3)+major*.16+crewPower*.12,0,100).toFixed(1)
  }

  function worldHeatmap(ctx={}){
    return Object.fromEntries(data.regions.map(r=>[r,regionHeat(r,ctx)]))
  }

  function ledgerEntry(action={},text={},month=0){
    return {
      id:'v75_'+String(action.actorId||'actor')+'_'+String(action.type||'action')+'_'+month,
      month,
      type:action.type||'action',
      actorId:action.actorId||null,
      targetId:action.targetId||null,
      region:action.region||'Global',
      title:text.title||data.actionLabels[action.type]||'Action du monde',
      desc:text.desc||'Le monde évolue hors écran.',
      importance:num(action.importance)||50
    }
  }

  registry.register('worldCanonEngineV75',{
    version:'7.5.0',normalizeState,factionRelation,profile,actorPriority,regionOptions,hostileTargets,
    cooperativeTargets,availableFruits,actionCandidates,weightedPick,planAction,resolveClash,resolveFruitSeek,
    influenceDelta,actionText,syncCrew,holderMatchesActor,syncFruit,eventCoherence,regionHeat,worldHeatmap,ledgerEntry
  });
})(window);
