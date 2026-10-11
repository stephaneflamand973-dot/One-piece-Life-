(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('relationshipsDataV93');if(!data)throw new Error('Relationships data V9.3 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));

function normalizeLink(link={}){
  return {
    relationId:String(link.relationId||''),
    bondXp:clamp(num(link.bondXp),-40,100),
    playerOwes:clamp(Math.floor(num(link.playerOwes)),0,9),
    npcOwes:clamp(Math.floor(num(link.npcOwes)),0,9),
    grudge:clamp(num(link.grudge),0,100),
    promotedNemesis:!!link.promotedNemesis,
    nemesisId:link.nemesisId?String(link.nemesisId):null,
    lastBeatYear:Number.isFinite(Number(link.lastBeatYear))?Number(link.lastBeatYear):-99,
    lastEventMonth:Number.isFinite(Number(link.lastEventMonth))?Number(link.lastEventMonth):-99,
    history:Array.isArray(link.history)?clone(link.history).slice(0,12):[]
  }
}
function normalizeBeat(b={}){
  return {
    id:String(b.id||''),relationId:String(b.relationId||''),eventId:String(b.eventId||''),
    type:String(b.type||'phase'),year:num(b.year),month:num(b.month),priority:clamp(num(b.priority),0,100),
    title:String(b.title||''),text:String(b.text||''),eventTitle:String(b.eventTitle||''),eventDesc:String(b.eventDesc||'')
  }
}
function normalizeState(state={}){
  const relations={};
  for(const [id,l] of Object.entries(state.relations&&typeof state.relations==='object'?state.relations:{}))relations[id]=normalizeLink({...l,relationId:id});
  return {
    version:1,relations,
    pending:Array.isArray(state.pending)?state.pending.map(normalizeBeat).filter(x=>x.id&&x.relationId).slice(0,16):[],
    lastBeatYear:Number.isFinite(Number(state.lastBeatYear))?Number(state.lastBeatYear):-99,
    lastAnnualYear:Number.isFinite(Number(state.lastAnnualYear))?Number(state.lastAnnualYear):-99,
    totalBeats:Math.max(0,Math.floor(num(state.totalBeats))),
    totalNemeses:Math.max(0,Math.floor(num(state.totalNemeses))),
    totalCommitments:Math.max(0,Math.floor(num(state.totalCommitments))),
    history:Array.isArray(state.history)?clone(state.history).slice(0,40):[]
  }
}
function ensureLink(state,relationId){
  const s=normalizeState(state),id=String(relationId);
  if(!s.relations[id])s.relations[id]=normalizeLink({relationId:id});
  return {state:s,link:s.relations[id]}
}
function relationStrength(relation={},social={}){
  const base=num(relation.trust)*.27+num(relation.respect)*.20+num(relation.affection)*.17+num(relation.familiarity)*.12+num(relation.loyalty)*.10+num(social.bond)*.08+num(social.reliability)*.06-num(relation.rivalry)*.14-num(social.unresolved)*2;
  return clamp(base,0,100)
}
function bondScore(relation={},social={},life={},link={}){
  const strength=relationStrength(relation,social);
  const memory=(Array.isArray(social.memories)?social.memories:[]).slice(0,6).reduce((a,m)=>a+clamp(num(m.valence),-10,10)*clamp(num(m.impact)||1,1,5)*.12,0);
  const distance=String(life.region||'')&&String(life.playerRegion||'')&&life.region!==life.playerRegion?-3:0;
  return clamp(strength+num(link.bondXp)*.18+memory+num(link.npcOwes)*1.2-num(link.playerOwes)*.7-num(link.grudge)*.22+distance,0,100)
}
function tierFor(score){
  return data.bondTiers.find(t=>score>=t.min&&score<=t.max)||data.bondTiers[0]
}
function profile(relation={},social={},life={},link={}){
  const score=bondScore(relation,social,life,link),tier=tierFor(score);
  return {score:+score.toFixed(1),tierId:tier.id,tierLabel:tier.label,playerOwes:num(link.playerOwes),npcOwes:num(link.npcOwes),grudge:num(link.grudge)}
}
function nemesisScore(relation={},social={},life={},link={}){
  const rivalry=num(relation.rivalry),respect=num(relation.respect),trust=num(relation.trust),familiarity=num(relation.familiarity);
  const lifeThreat=clamp(num(life.power)*.45+num(life.renown)*.25,0,70);
  const hostility=clamp(rivalry-trust*.26+num(link.grudge)*.55,0,100);
  const score=rivalry*.40+respect*.15+familiarity*.12+lifeThreat*.18+hostility*.15+num(social.unresolved)*2;
  return +clamp(score,0,100).toFixed(1)
}
function nemesisEligible(relation={},social={},life={},link={}){
  const score=nemesisScore(relation,social,life,link),hostility=num(relation.rivalry)-num(relation.trust)*.25+num(link.grudge)*.5;
  return !link.promotedNemesis&&num(relation.familiarity)>=35&&num(relation.rivalry)>=68&&score>=72&&hostility>=42
}
function interaction(state,relationId,action,ctx={}){
  const got=ensureLink(state,relationId),s=got.state,l=got.link,fx=data.interactionEffects[action]||{bond:0,grudge:0};
  l.bondXp=clamp(l.bondXp+num(fx.bond),-40,100);l.grudge=clamp(l.grudge+num(fx.grudge),0,100);
  if(fx.npcOwes){l.npcOwes=clamp(l.npcOwes+num(fx.npcOwes),0,9);s.totalCommitments++}
  l.history.unshift({type:'interaction',action,year:num(ctx.year),month:num(ctx.month)});l.history=l.history.slice(0,12);s.relations[String(relationId)]=l;
  return {state:s,link:l}
}
function eventPriority(event={},relation={},social={},life={}){
  const def=data.eventBeats[event.type];if(!def)return 0;
  const strength=relationStrength(relation,social),importance=num(event.importance),familiarity=num(relation.familiarity);
  const local=event.type==='setback'?10:event.type==='promotion'||event.type==='career_change'?6:0;
  return clamp(def.priority+strength*.12+importance*.12+familiarity*.05+local,0,100)
}
function queueLifeEvent(state,relation,event,ctx={}){
  const s=normalizeState(state),social=ctx.social||{},life=ctx.life||{},def=data.eventBeats[event?.type];if(!relation||!event||!def)return {state:s,queued:null};
  const strength=relationStrength(relation,social);
  if(strength<38||num(relation.familiarity)<18)return {state:s,queued:null};
  const id='v93_'+String(relation.id)+'_'+String(event.id||event.type+'_'+event.month);
  if(s.pending.some(x=>x.id===id)||s.history.some(x=>x.id===id))return {state:s,queued:null};
  const beat=normalizeBeat({id,relationId:relation.id,eventId:event.id,type:event.type,year:num(ctx.year),month:num(event.month),priority:eventPriority(event,relation,social,life),title:def.label,text:def.text,eventTitle:event.title,eventDesc:event.desc});
  s.pending.unshift(beat);s.pending=s.pending.sort((a,b)=>b.priority-a.priority||b.month-a.month).slice(0,16);
  const got=ensureLink(s,relation.id);got.link.lastEventMonth=Math.max(got.link.lastEventMonth,num(event.month));got.state.relations[String(relation.id)]=got.link;
  return {state:got.state,queued:beat}
}
function nextBeat(state,relations=[],year=0){
  const s=normalizeState(state);if(s.lastBeatYear===num(year))return null;
  const ids=new Set(relations.filter(r=>r&&r.status!=='left').map(r=>String(r.id)));
  return s.pending.filter(b=>ids.has(b.relationId)&&num(year)-num(b.year)<=2).sort((a,b)=>b.priority-a.priority||b.month-a.month)[0]||null
}
function choiceDefs(beat,link){
  const def=data.eventBeats[beat.type]||data.eventBeats.phase;
  return (def.choices||[]).filter(id=>{
    const c=data.choices[id];if(!c)return false;
    if(c.needsDebt&&num(link?.npcOwes)<=0)return false;
    return true
  }).map(id=>({id,...data.choices[id]}))
}
function applyChoice(state,beatId,choiceId,relation={},ctx={}){
  const s=normalizeState(state),idx=s.pending.findIndex(x=>x.id===beatId);if(idx<0)return {state:s,error:'missing_beat'};
  const beat=s.pending[idx],choice=data.choices[choiceId];if(!choice)return {state:s,error:'invalid_choice'};
  const got=ensureLink(s,beat.relationId),next=got.state,l=got.link;
  if(choice.needsDebt&&l.npcOwes<=0)return {state:next,error:'no_debt'};
  l.bondXp=clamp(l.bondXp+num(choice.bond),-40,100);l.grudge=clamp(l.grudge+num(choice.grudge),0,100);
  l.npcOwes=clamp(l.npcOwes+num(choice.npcOwes),0,9);l.playerOwes=clamp(l.playerOwes+num(choice.playerOwes),0,9);
  l.lastBeatYear=num(ctx.year);l.history.unshift({id:beat.id,type:'beat',beatType:beat.type,choiceId,year:num(ctx.year),month:num(ctx.month)});l.history=l.history.slice(0,12);
  next.relations[beat.relationId]=l;next.pending=next.pending.filter(x=>x.id!==beatId);next.lastBeatYear=num(ctx.year);next.totalBeats++;
  const entry={id:beat.id,relationId:beat.relationId,type:beat.type,choiceId,year:num(ctx.year),title:beat.title,memory:choice.memory};
  next.history.unshift(entry);next.history=next.history.slice(0,40);
  return {state:next,beat,choice,link:l,delta:clone(choice.delta||{}),energy:num(choice.energy),memory:{id:beat.id,type:'v93',label:choice.memory,valence:num(choice.valence),impact:Math.abs(num(choice.valence))>=7?5:4,tags:['v93',beat.type,choiceId]}}
}
function markNemesis(state,relationId,nemesisId,ctx={}){
  const got=ensureLink(state,relationId);got.link.promotedNemesis=true;got.link.nemesisId=String(nemesisId||'');got.link.grudge=clamp(got.link.grudge+5,0,100);
  got.link.history.unshift({type:'nemesis',year:num(ctx.year),nemesisId:String(nemesisId||'')});got.link.history=got.link.history.slice(0,12);
  got.state.totalNemeses++;got.state.relations[String(relationId)]=got.link;return {state:got.state,link:got.link}
}
function supportBonus(state,relationId){
  const l=normalizeState(state).relations[String(relationId)];if(!l)return 0;
  return +clamp(num(l.npcOwes)*.35+Math.max(0,num(l.bondXp))*.008-num(l.grudge)*.008,0,1.6).toFixed(2)
}
function annualTick(state,relations=[],year=0){
  const s=normalizeState(state),active=new Set(relations.filter(r=>r.status!=='left').map(r=>String(r.id)));
  for(const [id,l] of Object.entries(s.relations)){
    if(!active.has(id))continue;
    l.grudge=clamp(l.grudge-1.2,0,100);l.bondXp=clamp(l.bondXp-(l.bondXp>0?.8:l.bondXp<0?-.4:0),-40,100)
  }
  s.pending=s.pending.filter(b=>active.has(b.relationId)&&num(year)-num(b.year)<=2);
  s.lastAnnualYear=num(year);
  return s
}

registry.register('relationshipsEngineV93',{
  version:'9.3.0',normalizeState,normalizeLink,ensureLink,relationStrength,bondScore,tierFor,profile,nemesisScore,nemesisEligible,
  interaction,eventPriority,queueLifeEvent,nextBeat,choiceDefs,applyChoice,markNemesis,supportBonus,annualTick
});
})(window);
