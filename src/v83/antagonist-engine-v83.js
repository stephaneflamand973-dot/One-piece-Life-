(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('antagonistDataV83');if(!data)throw new Error('Antagonist data V8.3 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const pick=(arr,roll=.5)=>arr?.length?arr[Math.min(arr.length-1,Math.floor(clamp(Number(roll),0,.999999)*arr.length))]:null;

  function normalizeLieutenant(l={}){
    return {id:l.id||null,name:l.name||'Lieutenant',role:l.role||'Bras droit',power:clamp(num(l.power)||25,1,100),loyalty:clamp(Number.isFinite(Number(l.loyalty))?Number(l.loyalty):65,0,100),status:l.status||'active',wins:Math.max(0,Math.floor(num(l.wins))),losses:Math.max(0,Math.floor(num(l.losses)))}
  }

  function normalizeAntagonist(a={}){
    return {
      id:a.id||null,name:a.name||'Adversaire',faction:a.faction||'Pirates',region:a.region||'Grand Line',
      canonId:a.canonId||null,sourceType:a.sourceType||'procedural',sourceId:a.sourceId||null,
      archetype:data.archetypes[a.archetype]?a.archetype:'survivor',motivation:a.motivation||'Préserver son influence',temperament:a.temperament||'Calculateur',
      goal:a.goal||a.motivation||'Prendre l’avantage',power:clamp(num(a.power)||40,1,100),potentialPower:clamp(Math.max(num(a.potentialPower)||70,num(a.power)||40),1,100),
      growthRate:clamp(num(a.growthRate)||1,0.2,2.2),cunning:clamp(num(a.cunning)||50,0,100),resolve:clamp(num(a.resolve)||55,0,100),charisma:clamp(num(a.charisma)||45,0,100),
      rivalry:clamp(num(a.rivalry)||0,0,100),respect:clamp(num(a.respect)||15,0,100),obsession:clamp(num(a.obsession)||0,0,100),heat:clamp(num(a.heat)||12,0,100),
      encounters:Math.max(0,Math.floor(num(a.encounters))),wins:Math.max(0,Math.floor(num(a.wins))),losses:Math.max(0,Math.floor(num(a.losses))),
      campaigns:Math.max(0,Math.floor(num(a.campaigns))),escapes:Math.max(0,Math.floor(num(a.escapes))),defeats:Math.max(0,Math.floor(num(a.defeats))),
      status:a.status||'active',currentCampaignId:a.currentCampaignId||null,lastCampaignId:a.lastCampaignId||null,
      injuredUntil:Number.isFinite(Number(a.injuredUntil))?Number(a.injuredUntil):-99,lastSeenYear:Number.isFinite(Number(a.lastSeenYear))?Number(a.lastSeenYear):-99,
      lastEncounterYear:Number.isFinite(Number(a.lastEncounterYear))?Number(a.lastEncounterYear):-99,lastDecisionYear:Number.isFinite(Number(a.lastDecisionYear))?Number(a.lastDecisionYear):-99,
      returnCooldownUntil:Number.isFinite(Number(a.returnCooldownUntil))?Number(a.returnCooldownUntil):-99,survivalStreak:Math.max(0,Math.floor(num(a.survivalStreak))),
      lieutenants:Array.isArray(a.lieutenants)?a.lieutenants.map(normalizeLieutenant).slice(0,4):[],
      memories:Array.isArray(a.memories)?clone(a.memories).slice(0,18):[]
    }
  }

  function normalizeState(state={}){
    return {
      version:1,
      antagonists:Array.isArray(state.antagonists)?state.antagonists.map(normalizeAntagonist).slice(0,20):[],
      archives:Array.isArray(state.archives)?clone(state.archives).slice(0,30):[],
      totalCreated:Math.max(0,Math.floor(num(state.totalCreated))),
      totalReturns:Math.max(0,Math.floor(num(state.totalReturns))),
      totalFinalDefeats:Math.max(0,Math.floor(num(state.totalFinalDefeats))),
      lastAnnualYear:Number.isFinite(Number(state.lastAnnualYear))?Number(state.lastAnnualYear):-99
    }
  }

  function archetypeFor(faction='Pirates',roll=.5){
    return pick(data.factionArchetypes[faction]||data.factionArchetypes.Pirates,roll)||'survivor'
  }

  function lieutenantName(rollA=.5,rollB=.5){return (pick(data.firstNames,rollA)||'Renn')+' '+(pick(data.lastNames,rollB)||'Voss')}

  function createLieutenants(archetype='survivor',power=50,count=1,rolls=[]){
    const roles=data.lieutenantRoles[archetype]||data.lieutenantRoles.survivor,out=[];
    for(let i=0;i<clamp(Math.floor(count),0,4);i++){
      const r1=rolls[i*3]??((i+.23)/(count+1)),r2=rolls[i*3+1]??((i+.61)/(count+1)),r3=rolls[i*3+2]??.5;
      out.push(normalizeLieutenant({id:'lt_'+i+'_'+Math.floor(r1*99999),name:lieutenantName(r1,r2),role:roles[i%roles.length],power:clamp(Math.round(power*(.52+.18*Number(r3))),12,88),loyalty:clamp(Math.round(52+Number(r2)*38),35,94)}))
    }
    return out
  }

  function createAntagonist(subject={},ctx={},rolls={}){
    const faction=subject.faction||ctx.faction||'Pirates',archetype=archetypeFor(faction,rolls.archetype??.5),profile=data.archetypes[archetype];
    const motivation=pick(data.motivations[faction]||data.motivations.Pirates,rolls.motivation??.5)||'Prendre l’avantage';
    const power=clamp(Math.round(num(subject.power)||num(ctx.power)||45),8,100),potential=clamp(Math.round(Math.max(power,num(subject.potentialPower)||power+12+Number(rolls.potential??.5)*20)),power,100);
    const threat=clamp(num(ctx.threat)||50,0,100),ltCount=clamp(1+Math.floor((threat+power)/65),1,3);
    return normalizeAntagonist({
      id:subject.v83Id||('nem_'+String(subject.id||subject.name||'boss').toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Math.floor(Number(rolls.id??.5)*99999)),
      name:subject.name||'Adversaire',faction,region:ctx.region||subject.region||'Grand Line',canonId:subject.canonId||null,sourceType:subject.canonId?'canon':subject.sourceType||'campaign',
      sourceId:subject.id||null,archetype,motivation,temperament:pick(data.temperaments,rolls.temperament??.5)||'Calculateur',goal:subject.goal||motivation,
      power,potentialPower:potential,growthRate:clamp(num(subject.growthRate)||profile.growth*(.78+Number(rolls.growth??.5)*.5),.35,1.9),
      cunning:clamp(Math.round(38+Number(rolls.cunning??.5)*48+(archetype==='strategist'?12:0)),15,98),
      resolve:clamp(Math.round(42+Number(rolls.resolve??.5)*44+(archetype==='juggernaut'||archetype==='zealot'?10:0)),20,100),
      charisma:clamp(Math.round(28+Number(rolls.charisma??.5)*52+(archetype==='commander'?14:0)),10,100),
      rivalry:num(subject.rivalry)||0,respect:num(subject.respect)||18,obsession:0,heat:clamp(12+threat*.25,8,45),campaigns:1,currentCampaignId:ctx.campaignId||null,
      lieutenants:createLieutenants(archetype,power,ltCount,rolls.lieutenants||[])
    })
  }

  function nemesisScore(a={}){
    const n=normalizeAntagonist(a);
    return +clamp(n.rivalry*.34+n.obsession*.24+n.respect*.12+n.power*.14+n.encounters*3.8+n.escapes*4.5+n.campaigns*2.4,0,100).toFixed(1)
  }

  function tier(a={}){
    const s=nemesisScore(a);
    if(s>=82)return {id:'nemesis',label:'Némésis'};
    if(s>=64)return {id:'archrival',label:'Rival majeur'};
    if(s>=44)return {id:'rival',label:'Rival persistant'};
    return {id:'antagonist',label:'Antagoniste'};
  }

  function effectivePower(a={}){
    const n=normalizeAntagonist(a),active=n.lieutenants.filter(x=>x.status==='active'),support=active.reduce((sum,x)=>sum+x.power*(x.loyalty/100),0);
    return +clamp(n.power+support*.055+n.cunning*.035+n.charisma*.018,1,110).toFixed(1)
  }

  function weightedAction(archetype='survivor',roll=.5){
    const weights=data.archetypes[archetype]?.actionWeights||data.archetypes.survivor.actionWeights,entries=Object.entries(weights);
    const total=entries.reduce((s,[,w])=>s+w,0);let t=clamp(Number(roll),0,.999999)*total;
    for(const [id,w] of entries){t-=w;if(t<=0)return id}return entries[entries.length-1][0]
  }

  function annualTick(a={},ctx={},rolls={}){
    const n=normalizeAntagonist(a),year=num(ctx.year);if(n.status==='retired'||n.status==='archived')return {antagonist:n,changed:false};
    const profile=data.archetypes[n.archetype]||data.archetypes.survivor;
    if(n.injuredUntil>year){n.heat=clamp(n.heat-4,0,100);return {antagonist:n,changed:true,action:'recover',campaignSwing:0,stakesDelta:-1}}
    const gap=Math.max(0,n.potentialPower-n.power),gain=gap>0?clamp(profile.growth*n.growthRate*(.35+gap/26)*(.82+Number(rolls.growth??.5)*.36),.1,3.6):0;
    n.power=clamp(n.power+gain,0,n.potentialPower);
    const action=weightedAction(n.archetype,rolls.action??.5),def=data.actions[action]||data.actions.scheme;
    n.heat=clamp(n.heat+def.heat*profile.heat+(n.obsession/100)*2.2-1.2,0,100);
    if(action==='train')n.power=clamp(n.power+.6+Number(rolls.effect??.5)*1.4,0,n.potentialPower);
    if(action==='hunt')n.obsession=clamp(n.obsession+2+Number(rolls.effect??.5)*3,0,100);
    if(action==='scheme')n.cunning=clamp(n.cunning+.4+Number(rolls.effect??.5)*1.1,0,100);
    if(action==='recruit'&&n.lieutenants.filter(x=>x.status==='active').length<4){
      const idx=n.lieutenants.length,roles=data.lieutenantRoles[n.archetype]||data.lieutenantRoles.survivor;
      n.lieutenants.push(normalizeLieutenant({id:'lt_return_'+idx+'_'+year,name:lieutenantName(rolls.nameA??.35,rolls.nameB??.72),role:roles[idx%roles.length],power:n.power*(.48+Number(rolls.effect??.5)*.16),loyalty:58+Number(rolls.nameA??.5)*30}))
    }
    const activeLt=n.lieutenants.filter(x=>x.status==='active').length;
    const campaignSwing=(def.balance||0)*(0.78+n.cunning/260+activeLt*.045);
    const stakesDelta=(def.stakes||0)*(0.85+n.heat/220);
    return {antagonist:n,changed:true,action,actionDef:def,powerGain:+gain.toFixed(2),campaignSwing:+campaignSwing.toFixed(2),stakesDelta:+stakesDelta.toFixed(2)}
  }

  function recordEncounter(a={},ctx={}){
    const n=normalizeAntagonist(a),outcome=String(ctx.outcome||'failure'),opposed=ctx.opposed!==false,year=num(ctx.year);
    n.encounters++;n.lastEncounterYear=year;n.lastSeenYear=year;n.region=ctx.region||n.region;
    const important=ctx.importance==='major'||ctx.direct||num(ctx.danger)>=2;
    if(opposed){
      if(outcome==='success'){n.losses++;n.rivalry=clamp(n.rivalry+(important?8:5),0,100);n.respect=clamp(n.respect+(important?9:6),0,100);n.obsession=clamp(n.obsession+(important?7:4),0,100);n.heat=clamp(n.heat+4,0,100)}
      else if(outcome==='partial'){n.rivalry=clamp(n.rivalry+5,0,100);n.respect=clamp(n.respect+4,0,100);n.obsession=clamp(n.obsession+3,0,100)}
      else if(outcome==='retreat'){n.wins++;n.rivalry=clamp(n.rivalry+5,0,100);n.respect=clamp(n.respect+2,0,100);n.obsession=clamp(n.obsession+4,0,100);n.heat=clamp(n.heat+5,0,100)}
      else{n.wins++;n.rivalry=clamp(n.rivalry+7,0,100);n.respect=clamp(n.respect+2,0,100);n.obsession=clamp(n.obsession+6,0,100);n.heat=clamp(n.heat+6,0,100)}
    }else{
      n.respect=clamp(n.respect+(outcome==='success'?5:2),0,100);n.rivalry=clamp(n.rivalry-2,0,100);n.obsession=clamp(n.obsession-1,0,100)
    }
    n.memories.unshift({year,type:ctx.type||'encounter',label:ctx.label||'Affrontement',outcome,opposed,impact:num(ctx.impact)});
    n.memories=n.memories.slice(0,18);return n
  }

  function survivalOutcome(a={},ctx={},roll=.5){
    const n=normalizeAntagonist(a),profile=data.archetypes[n.archetype]||data.archetypes.survivor;
    if(n.canonId)return {survives:true,status:'active',chance:1,reason:'canon',antagonist:n};
    const margin=clamp(num(ctx.margin),0,50),contribution=clamp(num(ctx.playerContribution),0,40);
    const chance=clamp(.28+profile.survival+n.resolve/420+n.cunning/520+n.rivalry/650+n.obsession/700-margin/170-contribution/300,.12,.92);
    const survives=Number(roll)<chance;
    if(survives){n.status='escaped';n.escapes++;n.survivalStreak++;n.currentCampaignId=null;n.lastCampaignId=ctx.campaignId||n.lastCampaignId;n.returnCooldownUntil=num(ctx.year)+1+(margin>=25?1:0);n.injuredUntil=num(ctx.year)+(margin>=20?1:0);n.heat=clamp(n.heat+6,0,100)}
    else{n.status='retired';n.defeats++;n.currentCampaignId=null;n.lastCampaignId=ctx.campaignId||n.lastCampaignId;n.survivalStreak=0}
    n.memories.unshift({year:num(ctx.year),type:'campaign_end',label:survives?'Échappe à la chute':'Défaite finale',outcome:survives?'escaped':'retired',opposed:true,impact:margin});
    n.memories=n.memories.slice(0,18);
    return {survives,status:n.status,chance:+chance.toFixed(3),reason:survives?'escape':'final_defeat',antagonist:n}
  }

  function returnScore(a={},ctx={}){
    const n=normalizeAntagonist(a);if(!['escaped','active'].includes(n.status)||n.currentCampaignId||num(ctx.year)<n.returnCooldownUntil)return -999;
    const faction=n.faction===ctx.faction?20:-30,region=n.region===ctx.region?14:0;
    return +(nemesisScore(n)*.58+n.power*.18+n.heat*.12+faction+region).toFixed(1)
  }

  function bestReturn(antagonists=[],ctx={},roll=.5){
    const list=antagonists.map(a=>({a:normalizeAntagonist(a),score:returnScore(a,ctx)})).filter(x=>x.score>=42).sort((x,y)=>y.score-x.score);
    if(!list.length)return null;
    const pool=list.slice(0,3),idx=Math.min(pool.length-1,Math.floor(clamp(Number(roll),0,.999999)*pool.length));
    return {...pool[idx],tier:tier(pool[idx].a)}
  }

  function reappearanceCandidate(antagonists=[],ctx={},roll=.5){
    const available=antagonists.filter(a=>['escaped','active'].includes(a.status)&&!a.currentCampaignId&&a.region===ctx.region&&num(ctx.year)>=num(a.returnCooldownUntil)&&num(a.lastDecisionYear)!==num(ctx.year));
    if(!available.length)return null;
    const ranked=available.map(a=>({a:normalizeAntagonist(a),score:nemesisScore(a)})).sort((x,y)=>y.score-x.score);
    const top=ranked[0];if(top.score<48)return null;
    const gate=clamp(.08+(top.score-40)/210+top.a.heat/500,.08,.44);if(Number(roll)>=gate)return null;
    const t=tier(top.a),importance=clamp(52+top.score*.35+top.a.heat*.12,52,94),severity=clamp(40+top.a.power*.25+top.a.rivalry*.18,40,92);
    return {id:'nemesis_'+top.a.id+'_'+ctx.year,antagonistId:top.a.id,label:t.label,importance:+importance.toFixed(1),severity:+severity.toFixed(1),mandatory:top.score>=86&&top.a.heat>=72}
  }

  function encounterDecision(a={}){
    const n=normalizeAntagonist(a),t=tier(n);
    return {title:t.label+' • '+n.name,text:n.name+' refait surface. '+n.temperament+', '+(data.archetypes[n.archetype]?.desc||'il poursuit sa propre trajectoire')+' Objectif : '+n.goal+'.',choices:Object.entries(data.encounterChoices).map(([id,c])=>({id,...c}))}
  }

  function resolveEncounterChoice(a={},choiceId,ctx={},roll=.5){
    const n=normalizeAntagonist(a),choice=data.encounterChoices[choiceId];if(!choice)return {antagonist:n,error:'unknown_choice'};
    if(choiceId==='avoid'){
      n.lastDecisionYear=num(ctx.year);n.rivalry=clamp(n.rivalry+2,0,100);n.obsession=clamp(n.obsession+4,0,100);n.heat=clamp(n.heat+3,0,100);
      n.memories.unshift({year:num(ctx.year),type:'reappearance',label:'Affrontement évité',outcome:'avoid',opposed:true,impact:0});n.memories=n.memories.slice(0,18);
      return {antagonist:n,choice,success:true,avoided:true,chance:1,impact:0,risk:0}
    }
    const skill=Math.max(num(ctx.skills?.[choice.skill]),num(ctx.stats?.[choice.skill])),support=choiceId==='command'?num(ctx.authority)*.18+num(ctx.organization)*.24:0;
    const ability=skill*.56+num(ctx.power)*.28+support+num(ctx.worldRep)*.05;
    const difficulty=clamp(effectivePower(n)*.72+n.cunning*.13+n.resolve*.08+(choiceId==='direct'?5:0),32,96);
    const chance=clamp(.48+(ability-difficulty)/105,.08,.93),success=Number(roll)<chance;
    let updated=recordEncounter(n,{outcome:success?'success':'failure',opposed:true,year:ctx.year,region:ctx.region,direct:choiceId==='direct',danger:choice.risk,label:choice.label,type:'reappearance',impact:choice.impact});
    updated.lastDecisionYear=num(ctx.year);if(success&&choiceId==='direct')updated.injuredUntil=num(ctx.year)+1;
    return {antagonist:updated,choice,success,avoided:false,chance:+chance.toFixed(3),ability:+ability.toFixed(1),difficulty:+difficulty.toFixed(1),impact:success?choice.impact:-choice.impact*.45,risk:choice.risk}
  }

  function summary(a={}){
    const n=normalizeAntagonist(a),t=tier(n);
    return {id:n.id,name:n.name,faction:n.faction,region:n.region,archetype:n.archetype,archetypeLabel:data.archetypes[n.archetype]?.label||n.archetype,motivation:n.motivation,temperament:n.temperament,goal:n.goal,power:+n.power.toFixed(1),effectivePower:effectivePower(n),potentialPower:+n.potentialPower.toFixed(1),rivalry:+n.rivalry.toFixed(1),respect:+n.respect.toFixed(1),obsession:+n.obsession.toFixed(1),heat:+n.heat.toFixed(1),score:nemesisScore(n),tier:t.label,encounters:n.encounters,wins:n.wins,losses:n.losses,campaigns:n.campaigns,escapes:n.escapes,status:n.status,lieutenants:n.lieutenants.filter(x=>x.status==='active'),memories:n.memories}
  }

  registry.register('antagonistEngineV83',{version:'8.3.0',normalizeLieutenant,normalizeAntagonist,normalizeState,archetypeFor,createLieutenants,createAntagonist,nemesisScore,tier,effectivePower,weightedAction,annualTick,recordEncounter,survivalOutcome,returnScore,bestReturn,reappearanceCandidate,encounterDecision,resolveEncounterChoice,summary});
})(window);
