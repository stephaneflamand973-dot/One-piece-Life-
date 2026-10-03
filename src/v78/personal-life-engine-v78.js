(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('personalLifeDataV78');if(!data)throw new Error('Personal life data V7.8 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeState(state={},family={},ctx={}){
    const home=data.housing[state.home?.id]?state.home.id:(num(ctx.age)>=18?'rented_room':'family_home');
    const def=data.housing[home];
    return {
      version:1,
      home:{
        id:home,
        condition:clamp(Number.isFinite(Number(state.home?.condition))?Number(state.home.condition):def.condition,0,100),
        owned:state.home?.owned===true?true:!!def.owner,
        region:state.home?.region||ctx.region||null,
        sinceYear:Number.isFinite(Number(state.home?.sinceYear))?Number(state.home.sinceYear):num(ctx.year)
      },
      independent:typeof state.independent==='boolean'?state.independent:home!=='family_home',
      familyBond:clamp(Number.isFinite(Number(state.familyBond))?Number(state.familyBond):num(family.bond)||55,0,100),
      partnership:['single','dating','committed'].includes(state.partnership)?state.partnership:'single',
      partnerId:state.partnerId||null,
      children:Array.isArray(state.children)?state.children.slice(0,6).map(c=>({
        id:c.id||'child_'+Math.random().toString(36).slice(2,8),
        name:c.name||'Enfant du foyer',
        ageMonths:Math.max(0,Math.floor(num(c.ageMonths))),
        bond:clamp(Number.isFinite(Number(c.bond))?Number(c.bond):60,0,100),
        status:c.status||'household'
      })):[],
      dependents:Math.max(0,Math.floor(num(state.dependents))),
      reserve:Math.max(0,Math.floor(num(state.reserve))),
      stability:clamp(Number.isFinite(Number(state.stability))?Number(state.stability):def.stability,0,100),
      stress:clamp(Number.isFinite(Number(state.stress))?Number(state.stress):18,0,100),
      growthClosed:!!state.growthClosed,
      lastActionYear:Number.isFinite(Number(state.lastActionYear))?Number(state.lastActionYear):-99,
      lastEventYear:Number.isFinite(Number(state.lastEventYear))?Number(state.lastEventYear):-99,
      lastEventCheckYear:Number.isFinite(Number(state.lastEventCheckYear))?Number(state.lastEventCheckYear):-99,
      lastAnnualYear:Number.isFinite(Number(state.lastAnnualYear))?Number(state.lastAnnualYear):-99,
      lifetimeCosts:Math.max(0,Math.floor(num(state.lifetimeCosts))),
      lifetimeSupport:Math.max(0,Math.floor(num(state.lifetimeSupport))),
      homesOwned:Math.max(0,Math.floor(num(state.homesOwned))),
      milestones:state.milestones&&typeof state.milestones==='object'?{...state.milestones}:{}
    }
  }

  function housingDef(state={}){
    return data.housing[state.home?.id]||data.housing.family_home
  }

  function housingLabel(state={},faction='Civil'){
    const id=state.home?.id||'family_home';
    if(id==='faction_quarters')return data.factionHousingLabels[faction]||data.housing.faction_quarters.label;
    return data.housing[id]?.label||'Logement'
  }

  function annualCost(state={},ctx={}){
    const def=housingDef(state);
    if(num(ctx.age)<18&&state.home?.id==='family_home')return {housing:0,children:0,dependents:0,total:0};
    const housing=Math.round(num(def.upkeep)*(0.85+num(ctx.priceIndex)*.15));
    const children=Math.round((state.children||[]).length*2600*(0.8+num(ctx.priceIndex)*.2));
    const dependents=Math.round(num(state.dependents)*4200*(0.8+num(ctx.priceIndex)*.2));
    return {housing,children,dependents,total:housing+children+dependents}
  }

  function stabilityScore(state={},ctx={}){
    const def=housingDef(state),partner=state.partnership==='committed'?8:state.partnership==='dating'?3:0;
    const children=Math.min(8,(state.children||[]).length*2.5);
    const stressPenalty=num(state.stress)*.32;
    const moneyBuffer=num(ctx.money)>=50000?7:num(ctx.money)>=15000?3:num(ctx.money)<3000?-6:0;
    return +clamp(def.stability*.55+num(state.home?.condition)*.18+num(state.familyBond)*.12+partner+children+moneyBuffer-stressPenalty,0,100).toFixed(1)
  }

  function housingOptions(state={},ctx={}){
    const current=data.housing[state.home?.id]||data.housing.family_home;
    return Object.entries(data.housing).map(([id,h])=>{
      let available=num(ctx.age)>=h.ageMin&&id!==state.home?.id;
      if(id==='family_home')available=false;
      if(id==='faction_quarters')available=available&&ctx.faction!=='Civil'&&ctx.career!=='Aucune';
      if(h.purchase>0)available=available&&num(ctx.money)>=Math.round(h.purchase*num(ctx.priceIndex||1));
      if(h.tier<current.tier-1)available=false;
      return {...h,id,label:id==='faction_quarters'?(data.factionHousingLabels[ctx.faction]||h.label):h.label,cost:Math.round(h.purchase*num(ctx.priceIndex||1)),available}
    })
  }

  function eventCandidates(state={},ctx={}){
    const age=num(ctx.age),year=num(ctx.year),out=[];
    const add=(id,weight,reason='')=>{const e=data.personalEvents[id];if(e&&age>=e.minAge)out.push({id,event:e,weight:Math.max(.1,weight),reason})};
    if(age>=18&&!state.independent&&state.home?.id==='family_home')add('independence',9,'indépendance');
    if(state.home?.id!=='family_home'&&num(state.home?.condition)<58)add('home_repair',8+(58-num(state.home.condition))*.22,'logement');
    if(age>=16&&num(state.familyBond)>=35&&num(ctx.money)>=2500)add('family_request',3.2+num(state.familyBond)/40,'famille');
    if(age>=14)add('reunion',2.4+(70-num(state.familyBond))/55,'famille');
    if(age>=18&&state.partnership==='single')add('new_contact',2.5+(ctx.relationsPlan==='invest'?2:ctx.relationsPlan==='isolate'?-1.2:0),'vie personnelle');
    if(age>=20&&state.partnership==='dating'&&num(ctx.partnerStrength)>=56)add('commitment',3.5+(num(ctx.partnerStrength)-50)/18,'couple');
    if(age>=22&&state.partnership==='committed'&&!state.growthClosed&&(state.children||[]).length<3&&num(state.stability)>=52)add('household_growth',2.2+num(state.stability)/45,'foyer');
    if(age>=30&&state.dependents<2)add('caregiving',1.25+Math.max(0,age-30)/25,'responsabilités');
    if(age>=28&&year-state.lastEventYear>=2)add('inheritance',.45+num(state.familyBond)/180,'transmission');
    return out
  }

  function weightedPick(items=[],roll=.5){
    if(!items.length)return null;
    const total=items.reduce((n,x)=>n+Math.max(0,num(x.weight)),0);if(total<=0)return items[0];
    let t=clamp(Number(roll),0,.999999)*total;
    for(const x of items){t-=Math.max(0,num(x.weight));if(t<=0)return x}
    return items[items.length-1]
  }

  function chooseEvent(state={},ctx={},roll=.5){
    return weightedPick(eventCandidates(state,ctx),roll)
  }

  function eventChoices(eventId,state={},ctx={}){
    const e=data.personalEvents[eventId];if(!e)return[];
    return (e.choices||[]).filter(c=>{
      if(c.requires==='factionHousing')return ctx.faction!=='Civil'&&ctx.career!=='Aucune';
      const moneyNeed=Math.abs(Math.min(0,num(c.effects?.money)));
      return !moneyNeed||num(ctx.money)>=moneyNeed
    })
  }

  function resolveEvent(eventId,choiceId,state={},ctx={}){
    const e=data.personalEvents[eventId],choice=e?.choices?.find(c=>c.id===choiceId);
    if(!e||!choice)return {error:'invalid_choice'};
    return {event:e,choice,effects:clone(choice.effects||{})}
  }

  function applyStateEffects(state={},effects={},ctx={}){
    const next=normalizeState(state,{},ctx);
    next.familyBond=clamp(next.familyBond+num(effects.bond),0,100);
    next.stability=clamp(next.stability+num(effects.stability),0,100);
    next.stress=clamp(next.stress+num(effects.stress),0,100);
    next.reserve=Math.max(0,next.reserve+num(effects.reserve));
    next.dependents=Math.max(0,next.dependents+Math.floor(num(effects.dependent)));
    if(effects.independent===true)next.independent=true;
    if(effects.partnership)next.partnership=effects.partnership;
    if(effects.closeGrowth)next.growthClosed=true;
    if(effects.move&&data.housing[effects.move]){
      const h=data.housing[effects.move];
      next.home={id:effects.move,condition:h.condition,owned:!!h.owner,region:ctx.region||next.home.region,sinceYear:num(ctx.year)};
      if(h.owner)next.homesOwned=Math.max(1,next.homesOwned+1)
    }
    if(num(effects.condition))next.home.condition=clamp(num(next.home.condition)+num(effects.condition),0,100);
    return next
  }

  function contactProfile(rolls={}){
    const i=Math.floor(clamp(Number(rolls.name??.5),0,.999999)*data.names.length);
    const t=Math.floor(clamp(Number(rolls.temperament??.5),0,.999999)*data.temperaments.length);
    const a=Math.floor(clamp(Number(rolls.ambition??.5),0,.999999)*data.ambitions.length);
    return {
      id:'personal_'+String(i)+'_'+String(t)+'_'+String(a),
      name:data.names[i],temperament:data.temperaments[t],ambition:data.ambitions[a],adult:true,
      trust:42+Math.floor(clamp(Number(rolls.trust??.5),0,1)*12),
      affection:40+Math.floor(clamp(Number(rolls.affection??.5),0,1)*14),
      respect:42+Math.floor(clamp(Number(rolls.respect??.5),0,1)*12),
      familiarity:28,loyalty:45,rivalry:0,fear:0,status:'active',role:'Relation personnelle'
    }
  }

  function childProfile(index=0,roll=.5){
    const first=['Ari','Noa','Mika','Sora','Eden','Lio','Neri','Kai','Mira','Rin','Aven','Nilo'];
    const i=Math.floor(clamp(Number(roll),0,.999999)*first.length);
    return {id:'child_'+index+'_'+i,name:first[i],ageMonths:0,bond:62,status:'household'}
  }

  function ageChildren(state={},months=12){
    const next=clone(state);next.children=(next.children||[]).map(c=>({...c,ageMonths:Math.max(0,num(c.ageMonths)+months)}));return next
  }

  function annualTick(state={},ctx={}){
    let next=normalizeState(state,{},ctx);
    if(next.lastAnnualYear===num(ctx.year))return {state:next,cost:{housing:0,children:0,dependents:0,total:0},recovery:0,stressDelta:0};
    next.lastAnnualYear=num(ctx.year);
    const cost=annualCost(next,ctx);
    next.lifetimeCosts+=cost.total;
    next.home.condition=clamp(num(next.home.condition)-(next.home.id==='family_home'?1.5:3.5+num(next.dependents)*.4),0,100);
    const relationMode=ctx.relationsPlan||'steady';
    const bondDelta=relationMode==='invest'?3:relationMode==='isolate'?-3:1;
    next.familyBond=clamp(next.familyBond+bondDelta,0,100);
    let stressDelta=0;
    if(cost.total>num(ctx.money)*.55)stressDelta+=7;
    if(num(next.stability)<45)stressDelta+=5;
    if(next.partnership==='committed')stressDelta-=2;
    next.stress=clamp(next.stress+stressDelta-2,0,100);
    next.stability=stabilityScore(next,{...ctx,money:Math.max(0,num(ctx.money)-cost.total)});
    next=ageChildren(next,12);
    const recovery=clamp((next.stability-50)/18-(next.stress-40)/30,-5,6);
    return {state:next,cost,recovery:+recovery.toFixed(1),stressDelta}
  }

  function summary(state={},ctx={}){
    const s=normalizeState(state,{},ctx),def=housingDef(s),stability=stabilityScore(s,ctx),cost=annualCost(s,ctx);
    return {
      homeLabel:housingLabel(s,ctx.faction),
      homeTier:def.tier,
      condition:Math.round(s.home.condition),
      familyBond:Math.round(s.familyBond),
      partnership:s.partnership,
      children:s.children.length,
      dependents:s.dependents,
      stability:Math.round(stability),
      stress:Math.round(s.stress),
      annualCost:cost.total,
      reserve:s.reserve
    }
  }

  registry.register('personalLifeEngineV78',{
    version:'7.8.0',normalizeState,housingDef,housingLabel,annualCost,stabilityScore,housingOptions,
    eventCandidates,weightedPick,chooseEvent,eventChoices,resolveEvent,applyStateEffects,contactProfile,
    childProfile,ageChildren,annualTick,summary
  });
})(window);
