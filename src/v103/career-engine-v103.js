(function(global){
'use strict';
const r=global.OPL_MODULES,data=r?.get('careerDataV103');if(!data)throw Error('V10.3 career registry missing');
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const num=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const bounded=(n,a=0,b=100)=>clamp(num(n,a),a,b);
function profile(faction){return data.profiles[faction]||data.profiles.Civil}
function normalize(raw={},identity=''){
 const validMode=Object.prototype.hasOwnProperty.call(data.modes,raw.mode)?raw.mode:'steady';
 const same=typeof identity==='string'&&raw.identity===identity;
 // Changing profession removes temporary performance, preventing faction-switch bonus exploits.
 return {version:1,identity:String(identity).slice(0,96),mode:same?validMode:'steady',
  performance:same?bounded(raw.performance):30,
  workSessions:same?Math.floor(bounded(raw.workSessions,0,100000)):0,
  earned:same?Math.floor(bounded(raw.earned,0,1e12)):0,
  xpEarned:same?Math.floor(bounded(raw.xpEarned,0,1e9)):0,
  bonusEarned:same?Math.floor(bounded(raw.bonusEarned,0,1e12)):0,
  lastWorkYear:same?Math.floor(num(raw.lastWorkYear,-99)):-99,
  lastBonusYear:same?Math.floor(num(raw.lastBonusYear,-99)):-99,
  history:same&&Array.isArray(raw.history)?raw.history.slice(-12).filter(x=>x&&typeof x==='object').map(x=>({
    year:Math.floor(bounded(x.year,0,9999)),kind:String(x.kind||'work').slice(0,25),
    money:Math.floor(bounded(x.money,0,1e9)),xp:Math.floor(bounded(x.xp,0,1e6))
  })):[]
 }
}
function selectMode(state,id){return {...state,mode:Object.prototype.hasOwnProperty.call(data.modes,id)?id:state.mode}}
function workCost(state){return data.modes[state.mode]?.cost||data.modes.steady.cost}
function workSession(raw,ctx={}){
 const s=normalize(raw,ctx.identity),p=profile(ctx.faction),mode=data.modes[s.mode]||data.modes.steady;
 const efficiency=bounded(ctx.efficiency,0,1),rank=Math.floor(bounded(ctx.rankIndex,0,99));
 const orgTrust=bounded(ctx.trust),quality=clamp(.9+(orgTrust-50)/500,.8,1.1);
 const fluctuation=clamp(num(ctx.roll,.5),0,1);
 const bonusContext=/Médecin|scientifique|Navigateur/i.test(String(ctx.career||''))?1.06:1;
 const nominal=(p.basePay+p.rankPay*rank+fluctuation*260)*quality*bonusContext;
 const pay=Math.max(1,Math.round(nominal*mode.pay*efficiency));
 const xp=Math.max(1,Math.round((7+fluctuation*5+Math.min(4,rank*.4))*mode.xp*efficiency));
 const increase=mode.performance*(.7+.3*efficiency);
 const next={...s,performance:bounded(s.performance+increase),workSessions:s.workSessions+1,
  earned:s.earned+pay,xpEarned:s.xpEarned+xp,lastWorkYear:Math.floor(num(ctx.year))};
 next.history=[...s.history,{year:next.lastWorkYear,kind:'work',money:pay,xp}].slice(-12);
 return {state:next,pay,xp,cost:mode.cost,delta:mode.delta,performanceGain:+increase.toFixed(1),mode:mode.label}
}
function status(state,id,ctx={}){
 const a=data.actions[id],s=normalize(state,ctx.identity);
 if(!a)return {available:false,reason:'Action de carrière inconnue.'};
 let reason='';
 if(ctx.alive===false)reason='Cette vie est terminée.';
 else if(ctx.pending)reason='Résous d’abord la décision en attente.';
 else if(!ctx.careerActive)reason='Commence une carrière pour agir.';
 else if(ctx.travel)reason='Action professionnelle indisponible en mer.';
 else if(num(ctx.energy,0)<a.cost)reason='Énergie insuffisante.';
 else if(id==='career_bonus'&&(s.workSessions===0||s.performance<55))reason='Travaille pour atteindre 55 points de performance.';
 else if(id==='career_bonus'&&bounded(ctx.standing)<35)reason='Standing interne insuffisant pour négocier une prime.';
 return {available:!reason,reason,cost:a.cost,label:a.label,description:a.description}
}
function initiative(raw,id,ctx={}){
 const a=data.actions[id],s=normalize(raw,ctx.identity);
 if(!a||id==='career_bonus')return {ok:false,reason:'Action non prise en charge.'};
 const gate=status(s,id,ctx);
 if(!gate.available)return {ok:false,reason:gate.reason};
 const efficiency=bounded(ctx.efficiency??1,0,1),performanceGain=Math.max(1,Math.round(a.performance*efficiency)),xp=Math.max(1,Math.round(a.xp*efficiency));
 const performance=bounded(s.performance+performanceGain);
 const next={...s,performance,xpEarned:s.xpEarned+xp};
 next.history=[...s.history,{year:Math.floor(num(ctx.year)),kind:id,money:0,xp}].slice(-12);
 const delta=Object.fromEntries(Object.entries(a.delta).map(([key,value])=>[key,Math.round(value*efficiency*100)/100]));
 return {ok:true,state:next,delta,xp,cost:a.cost,performanceGain}
}
function bonus(raw,ctx={}){
 const s=normalize(raw,ctx.identity),gate=status(s,'career_bonus',ctx);
 if(!gate.available)return {ok:false,reason:gate.reason};
 const p=profile(ctx.faction),rank=Math.floor(bounded(ctx.rankIndex,0,99)),trust=bounded(ctx.trust);
 const chance=clamp(.38+(s.performance-55)*.008+(trust-50)*.003, .20,.85);
 const approved=clamp(num(ctx.roll,.5),0,1)<chance;
 const pay=approved?Math.round((p.basePay+p.rankPay*rank)*p.bonus*(.35+s.performance/145)):0;
 const next={...s,bonusEarned:s.bonusEarned+pay,earned:s.earned+pay,lastBonusYear:Math.floor(num(ctx.year))};
 next.history=[...s.history,{year:next.lastBonusYear,kind:'career_bonus',money:pay,xp:0}].slice(-12);
 return {ok:true,state:next,approved,pay,chance,delta:{standing:approved?1:-.6,trust:approved?.8:-.4}}
}
r.register('careerEngineV103',{version:'10.3.0',profile,normalize,selectMode,workCost,workSession,status,initiative,bonus});
})(window);
