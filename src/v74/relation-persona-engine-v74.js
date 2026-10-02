(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('relationPersonaDataV74');if(!data)throw new Error('Relation persona data V7.4 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const arr=v=>Array.isArray(v)?v:[];
  const uniq=v=>[...new Set(v.filter(Boolean))];
  const clone=o=>JSON.parse(JSON.stringify(o));

  function inferredValues(relation={},canonPersona=null){
    const fromCanon=arr(canonPersona?.values);
    const temperament=arr(data.temperamentValues[relation.temperament]);
    const ambition=arr(data.ambitionValues[relation.ambition]);
    return uniq([...fromCanon,...temperament,...ambition]).slice(0,6)
  }

  function normalize(relation={},canonPersona=null){
    const social=relation.socialV74&&typeof relation.socialV74==='object'?relation.socialV74:{};
    const memories=Array.isArray(social.memories)?social.memories.slice(0,16):[];
    return {
      version:1,
      values:uniq(arr(social.values).length?social.values:inferredValues(relation,canonPersona)).slice(0,6),
      boundaries:uniq(arr(social.boundaries)).slice(0,4),
      memories,
      bond:clamp(Number.isFinite(Number(social.bond))?Number(social.bond):50,0,100),
      reliability:clamp(Number.isFinite(Number(social.reliability))?Number(social.reliability):50,0,100),
      unresolved:Math.max(0,Math.floor(num(social.unresolved))),
      arcHistory:Array.isArray(social.arcHistory)?social.arcHistory.slice(0,12):[],
      activeArc:social.activeArc||null,
      lastArcYear:Number.isFinite(Number(social.lastArcYear))?Number(social.lastArcYear):-99,
      lastInteractionYear:Number.isFinite(Number(social.lastInteractionYear))?Number(social.lastInteractionYear):-99,
      lastMemoryMonth:Number.isFinite(Number(social.lastMemoryMonth))?Number(social.lastMemoryMonth):-99
    }
  }

  function playerValues(ctx={}){
    const out=[];
    const ambition=String(ctx.ambitionType||ctx.ambition||'');
    out.push(...arr(data.ambitionValues[ambition]));
    const faction=String(ctx.faction||'');
    if(faction==='Marine')out.push('ordre','devoir');
    if(faction==='Pirates')out.push('liberté','loyauté');
    if(faction==='Révolutionnaires')out.push('liberté','révolution');
    if(faction==='Gouvernement')out.push('ordre','discipline');
    if(faction==='Chasseurs de primes')out.push('autonomie','fortune');
    if(faction==='Civil')out.push('autonomie');
    const style=String(ctx.combatStyle?.primary||'');
    if(style==='Sabreur')out.push('maîtrise');
    if(style==='Mobile / esquive')out.push('liberté');
    return uniq(out).slice(0,6)
  }

  function valueCompatibility(relation={},social={},ctx={}){
    const a=new Set(arr(social.values)),b=playerValues(ctx);
    if(!a.size||!b.length)return {score:0,matches:[],conflicts:[]};
    const matches=b.filter(v=>a.has(v));
    const conflictPairs=[
      ['ordre','liberté'],['discipline','aventure'],['loyauté','autonomie'],
      ['protection','puissance'],['justice','fortune'],['famille','ambition'],
      ['révolution','ordre'],['équilibre','domination']
    ];
    const conflicts=[];
    for(const [x,y] of conflictPairs){
      if((a.has(x)&&b.includes(y))||(a.has(y)&&b.includes(x)))conflicts.push(x+' / '+y)
    }
    const score=clamp(matches.length*9-conflicts.length*8,-30,30);
    return {score,matches,conflicts}
  }

  function relationStrength(relation={},social={}){
    const base=
      num(relation.trust)*.28+
      num(relation.respect)*.20+
      num(relation.affection)*.17+
      num(relation.familiarity)*.11+
      num(relation.loyalty)*.10+
      num(social.bond)*.08+
      num(social.reliability)*.06-
      num(relation.rivalry)*.15-
      num(social.unresolved)*2.2;
    return +clamp(base,0,100).toFixed(1)
  }

  function memoryWeight(memory={}){
    const age=Math.max(0,num(memory.ageMonthsAgo));
    const recency=Math.max(.35,1-age/180);
    return (num(memory.impact)||1)*recency;
  }

  function memoryTone(social={}){
    const memories=arr(social.memories);
    if(!memories.length)return {score:0,positive:0,negative:0,major:null};
    let positive=0,negative=0,major=null,best=-1;
    for(const m of memories){
      const w=memoryWeight(m);
      if(num(m.valence)>=0)positive+=Math.abs(num(m.valence))*w;
      else negative+=Math.abs(num(m.valence))*w;
      const importance=Math.abs(num(m.valence))*w;
      if(importance>best){best=importance;major=m}
    }
    return {score:+clamp(positive-negative,-100,100).toFixed(1),positive:+positive.toFixed(1),negative:+negative.toFixed(1),major}
  }

  function compatibility(relation={},social={},ctx={}){
    const values=valueCompatibility(relation,social,ctx);
    const memories=memoryTone(social);
    let score=50+values.score+memories.score*.12;
    const ambition=String(relation.ambition||'');
    if(ambition==='Loyauté'&&ctx.relationsPlan==='invest')score+=8;
    if(ambition==='Liberté'&&ctx.careerPlan==='hard')score-=5;
    if(ambition==='Influence'&&ctx.careerPlan==='initiative')score+=6;
    if(relation.canonId&&ctx.sameFaction)score+=4;
    return {
      score:+clamp(score,0,100).toFixed(1),
      valueScore:values.score,matches:values.matches,conflicts:values.conflicts,
      memoryScore:memories.score,majorMemory:memories.major
    }
  }

  function interactionImpact(relation={},social={},action='time',ctx={}){
    const profile=data.interactionProfiles[action]||data.interactionProfiles.time;
    const compat=compatibility(relation,social,ctx);
    const scale=.72+compat.score/180;
    const delta={};
    for(const k of ['trust','affection','respect','familiarity','loyalty','rivalry','shared']){
      const raw=num(profile[k]);if(raw)delta[k]=+(raw*scale).toFixed(2)
    }
    if(action==='challenge'&&num(relation.rivalry)>55)delta.rivalry=+(num(delta.rivalry)-3).toFixed(2);
    if(action==='confide'&&num(relation.trust)<25)delta.trust=+(num(delta.trust)*.55).toFixed(2);
    if(action==='distance'&&num(relation.rivalry)>65)delta.rivalry=+(num(delta.rivalry)+2).toFixed(2);
    return {profile,delta,compatibility:compat}
  }

  function makeMemory(spec={}){
    return {
      id:spec.id||('mem_'+Math.abs(String(spec.label||spec.type||'memory').split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0))),
      type:spec.type||'interaction',
      label:spec.label||'Souvenir partagé',
      valence:clamp(num(spec.valence),-10,10),
      impact:clamp(num(spec.impact)||1,1,5),
      month:Number.isFinite(Number(spec.month))?Number(spec.month):0,
      tags:uniq(arr(spec.tags)).slice(0,6)
    }
  }

  function addMemory(social={},memory={}){
    const next=clone(social),m=makeMemory(memory);
    next.memories=[m,...arr(next.memories).filter(x=>x.id!==m.id)].slice(0,16);
    next.lastMemoryMonth=m.month;
    next.bond=clamp(num(next.bond)+Math.max(-5,Math.min(5,m.valence*.45)),0,100);
    next.reliability=clamp(num(next.reliability)+(m.tags.includes('support')?2:m.tags.includes('betrayal')?-6:0),0,100);
    if(m.valence<=-5)next.unresolved=Math.min(9,num(next.unresolved)+1);
    if(m.valence>=5&&next.unresolved>0)next.unresolved=Math.max(0,next.unresolved-1);
    return next
  }

  function applyRelationDelta(relation={},delta={}){
    const next={...relation};
    for(const k of ['trust','affection','respect','familiarity','loyalty','rivalry','sharedExperience']){
      const source=k==='sharedExperience'?'shared':k;
      if(delta[source]!=null)next[k]=clamp(num(next[k])+num(delta[source]),0,100)
    }
    if(delta.status)next.status=delta.status;
    return next
  }

  function classify(relation={},social={}){
    const strength=relationStrength(relation,social),rivalry=num(relation.rivalry),trust=num(relation.trust),loyalty=num(relation.loyalty);
    if(relation.status==='distant')return {id:'distant',label:'Lien distant',strength};
    if(rivalry>=72&&num(relation.respect)>=55)return {id:'rival',label:'Rivalité respectée',strength};
    if(rivalry>=65&&trust<35)return {id:'hostile',label:'Conflit ouvert',strength};
    if(trust>=78&&loyalty>=72&&strength>=70)return {id:'bonded',label:'Lien très fort',strength};
    if(trust>=62&&strength>=58)return {id:'trusted',label:'Relation de confiance',strength};
    if(strength>=45)return {id:'stable',label:'Relation stable',strength};
    return {id:'fragile',label:'Relation fragile',strength}
  }

  function satisfiesConditions(arc,relation,social,ctx={}){
    if(num(relation.familiarity)<num(arc.minFamiliarity))return false;
    if(relationStrength(relation,social)<num(arc.minStrength))return false;
    const c=arc.conditions||{};
    for(const [k,v] of Object.entries(c)){
      if(k==='mentor'&&!!ctx.mentor!==!!v)return false;
      if(k==='status'&&String(relation.status)!==String(v))return false;
      if(Array.isArray(v)){
        const value=num(relation[k]);if(value<v[0]||value>v[1])return false
      }
    }
    return true
  }

  function eligibleArcs(relation={},social={},ctx={}){
    const recent=new Set(arr(social.arcHistory).filter(x=>num(ctx.year)-num(x.year)<3).map(x=>x.id));
    return data.socialArcs
      .filter(a=>!recent.has(a.id)&&satisfiesConditions(a,relation,social,ctx))
      .sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))
  }

  function resolveArc(relation={},social={},arcId,choiceId,ctx={}){
    const arc=data.socialArcs.find(a=>a.id===arcId),choice=data.arcChoices[choiceId];
    if(!arc||!choice||!arc.choices.includes(choiceId))return {relation,social,error:'invalid_arc_choice'};
    let nextRelation=applyRelationDelta(relation,choice.delta);
    let nextSocial=addMemory(normalize({...relation,socialV74:social}),{
      id:'arc_'+arc.id+'_'+num(ctx.year),
      type:'arc',label:choice.memory,valence:
        ['stand_by','respect_rival','learn','commit','repair','reconcile'].includes(choiceId)?7:-6,
      impact:4,month:num(ctx.month),tags:['arc',arc.id]
    });
    nextSocial.activeArc=null;
    nextSocial.lastArcYear=num(ctx.year);
    nextSocial.arcHistory=[{id:arc.id,choice:choiceId,year:num(ctx.year)},...arr(nextSocial.arcHistory)].slice(0,12);
    return {relation:nextRelation,social:nextSocial,arc,choice,state:classify(nextRelation,nextSocial)}
  }

  function supportScore(relation={},social={},ctx={}){
    const state=classify(relation,social),compat=compatibility(relation,social,ctx);
    if(relation.status!=='active')return 0;
    const score=(state.strength-45)/16+(compat.score-50)/35+(num(social.reliability)-50)/30;
    return +clamp(score,0,6).toFixed(1)
  }

  function betrayalRisk(relation={},social={},ctx={}){
    const compat=compatibility(relation,social,ctx),mem=memoryTone(social);
    const risk=
      6+
      num(relation.rivalry)*.34+
      Math.max(0,45-num(relation.trust))*.48+
      Math.max(0,42-num(relation.loyalty))*.38+
      num(social.unresolved)*5+
      Math.max(0,-mem.score)*.20+
      Math.max(0,45-compat.score)*.30-
      num(social.reliability)*.20;
    return +clamp(risk,0,92).toFixed(1)
  }

  registry.register('relationPersonaEngineV74',{
    version:'7.4.0',inferredValues,normalize,playerValues,valueCompatibility,relationStrength,
    memoryTone,compatibility,interactionImpact,makeMemory,addMemory,applyRelationDelta,classify,
    eligibleArcs,resolveArc,supportScore,betrayalRisk
  });
})(window);
