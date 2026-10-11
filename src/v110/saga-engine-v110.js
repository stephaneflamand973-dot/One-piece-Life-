(function(g){'use strict';const r=g.OPL_MODULES,d=r?.get('sagaDataV110');if(!d)throw Error('Sagacity engine data missing');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const int=(v,a=0,b=1e9)=>Math.floor(clamp(num(v),a,b)),str=(v,n=140)=>String(v||'').slice(0,n);
const themes=Object.keys(d.themes);
function cleanSaga(x){
 return {id:str(x.id,120),sourceId:str(x.sourceId,110),contactKey:str(x.contactKey,180),
  contact:str(x.contact,110),faction:str(x.faction,55),region:str(x.region,80),
  kind:themes.includes(x.kind)?x.kind:'intrigue',chapter:int(x.chapter,0,3),
  difficulty:int(x.difficulty,8,95),year:int(x.year,0,9999),
  successes:int(x.successes,0,3),failures:int(x.failures,0,6),
  reward:int(x.reward,0,30000),status:['active','complete','failed'].includes(x.status)?x.status:'active',
  lastChoice:str(x.lastChoice,32),lastYear:int(x.lastYear,0,9999)};
}
function normalize(raw={}){
 const s=raw&&typeof raw==='object'?raw:{};
 const campaigns=Array.isArray(s.campaigns)?s.campaigns.filter(x=>x&&typeof x==='object'&&x.id).slice(-16).map(cleanSaga):[];
 const pending=s.pending&&typeof s.pending==='object'&&s.pending.id&&
  campaigns.some(x=>x.id===s.pending.id&&x.status==='active'&&x.chapter===int(s.pending.chapter,0,2))?
  {id:str(s.pending.id,120),chapter:int(s.pending.chapter,0,2),
   year:int(s.pending.year,0,9999),region:str(s.pending.region,80)}:null;
 const history=Array.isArray(s.history)?s.history.filter(x=>x&&typeof x==='object').slice(-30).map(x=>({
  id:str(x.id,120),chapter:int(x.chapter,0,2),year:int(x.year,0,9999),
  choice:str(x.choice,32),success:!!x.success,withdraw:!!x.withdraw,
  healthLoss:int(x.healthLoss,0,60),reward:int(x.reward,0,30000)})):[];
 return {version:1,campaigns,selected:str(s.selected,120),pending,history,
  completed:int(s.completed),lost:int(s.lost),totalReward:int(s.totalReward,0,1e12)};
}
function create(raw,contract,ctx={}){
 const s=normalize(raw);
 const id='saga_'+str(contract?.id||'',110);
 if(!contract?.id||!contract.contactKey||!contract.contact||!contract.region)return {state:s,saga:null};
 if(s.campaigns.some(x=>x.sourceId===contract.id))return {state:s,saga:null};
 if(s.campaigns.filter(x=>x.status==='active').length>=3)return {state:s,saga:null};
 const kind=contract.kind==='challenge'?'rivalry':contract.kind==='alliance'?'alliance':'intrigue';
 const difficulty=int(clamp(num(contract.difficulty,48)+8+(ctx.success===false?8:0),15,92),15,92);
 const reward=Math.round(d.themes[kind].reward*(.65+difficulty*.008));
 const saga={id,sourceId:str(contract.id,110),contactKey:str(contract.contactKey,180),
  contact:str(contract.contact,110),faction:str(contract.faction,55),region:str(contract.region,80),
  kind,chapter:0,difficulty,year:int(ctx.year,0,9999),successes:0,failures:0,
  reward,status:'active',lastChoice:'',lastYear:0};
 return {state:{...s,campaigns:[...s.campaigns,saga].slice(-16)},saga};
}
function select(raw,id,ctx={}){
 const s=normalize(raw),saga=s.campaigns.find(x=>x.id===id&&x.status==='active');
 if(!saga||ctx.pending||ctx.travel||saga.region!==ctx.region||s.pending)return {ok:false,state:s,reason:'Saga indisponible dans cette région.'};
 return {ok:true,state:{...s,selected:s.selected===id?'':id},saga};
}
function status(raw,ctx={}){
 const s=normalize(raw),a=s.campaigns.find(x=>x.id===s.selected&&x.status==='active');
 let reason='';
 if(!a)reason='Sélectionne une saga active dans Monde.';
 else if(s.pending||ctx.pending)reason='Termine le choix en attente.';
 else if(ctx.alive===false)reason='Le personnage ne peut plus agir.';
 else if(ctx.travel)reason='Termine la traversée.';
 else if(num(ctx.age)<12)reason='Cette activité exige au moins 12 ans.';
 else if(a.region!==ctx.region)reason='Rejoins '+a.region+' pour poursuivre cette saga.';
 else if(num(ctx.energy)<10)reason='Énergie insuffisante.';
 return {available:!reason,reason,saga:a,remaining:a?3-a.chapter:0};
}
function begin(raw,ctx={}){
 const s=normalize(raw),gate=status(s,ctx);if(!gate.available)return {ok:false,state:s,reason:gate.reason};
 const pending={id:gate.saga.id,chapter:gate.saga.chapter,year:int(ctx.year,0,9999),region:str(ctx.region,80)};
 const state={...s,pending};
 return {ok:true,state,pending,decision:decision(state,ctx)};
}
function odds(saga,choice,ctx={}){
 const t=d.tactics[choice];if(!t)return null;
 if(t.retreat)return {chance:1,injuryChance:0,retreat:true};
 const skill=clamp(num(ctx.skills?.[t.skill]),0,100),crew=clamp(num(ctx.crew),0,100),
  trust=clamp(num(ctx.trust,50),0,100),rivalry=clamp(num(ctx.rivalry),0,100);
 const chance=clamp(.55+t.bonus+skill*.0025+crew*.00085+(trust-50)*.0009-
  rivalry*.0008-saga.difficulty*.0032-saga.chapter*.045-saga.failures*.022,.12,.92);
 const injuryChance=clamp((.09+saga.difficulty*.0028)*t.risk,0,.70);
 return {chance,injuryChance,retreat:false,skill:t.skill};
}
function decision(raw,ctx={}){
 const s=normalize(raw),p=s.pending,active=s.campaigns.find(x=>x.id===p?.id&&x.status==='active');
 if(!p||!active||active.chapter!==p.chapter)return null;
 const theme=d.themes[active.kind],options=Object.entries(d.tactics).map(([key,t])=>{
  const o=odds(active,key,ctx);
  return {label:t.label,hint:t.detail+(t.retreat?'':' • '+Math.round(o.chance*100)+' % réussite • '+Math.round(o.injuryChance*100)+' % blessure si échec'),
   action:'v110saga:'+p.id+':'+p.chapter+':'+key};
 });
 return {id:'v110_'+p.id+'_'+p.chapter,title:theme.label+' • Chapitre '+(p.chapter+1)+'/3',
  text:theme.chapters[p.chapter]+' avec '+active.contact+' ('+active.faction+'). '+
  'Cette décision changera durablement la situation et le prochain chapitre.',choices:options};
}
function resolve(raw,choice,ctx={},rolls={}){
 const s=normalize(raw),p=s.pending,a=s.campaigns.find(x=>x.id===p?.id&&x.status==='active');
 if(!p||!a||a.chapter!==p.chapter||!d.tactics[choice]||
  int(ctx.year,0,9999)!==p.year||ctx.region!==p.region)return {ok:false,state:s,reason:'Chapitre invalide ou déplacé.'};
 const t=d.tactics[choice],o=odds(a,choice,ctx),withdraw=!!t.retreat;
 const success=!withdraw&&clamp(num(rolls.success,.5),0,1)<o.chance;
 const healthLoss=!success&&!withdraw&&clamp(num(rolls.injury,1),0,1)<o.injuryChance?
  Math.max(1,Math.round((3+a.difficulty*.10)*t.risk)):0;
 const failures=a.failures+(!success&&!withdraw?1:0),chapter=a.chapter+(success?1:0);
 const complete=success&&chapter>=3,failed=failures>=5;
 const next={...a,chapter,successes:a.successes+(success?1:0),failures,
  status:complete?'complete':failed?'failed':'active',lastChoice:choice,lastYear:int(ctx.year,0,9999)};
 const reward=complete?a.reward:0;
 const trustDelta=withdraw?0:success?t.trust:Math.min(-2,t.trust-3);
 const rivalryDelta=withdraw?0:success?t.rivalry:Math.max(3,t.rivalry+3);
 const history={id:a.id,chapter:a.chapter,year:int(ctx.year,0,9999),choice,success,withdraw,healthLoss,reward};
 const state={...s,campaigns:s.campaigns.map(x=>x.id===a.id?next:x),pending:null,selected:complete||failed?'':s.selected,
  history:[...s.history,history].slice(-30),completed:s.completed+(complete?1:0),
  lost:s.lost+(failed?1:0),totalReward:s.totalReward+reward};
 return {ok:true,state,saga:next,success,withdraw,complete,failed,healthLoss,reward,
  trustDelta,rivalryDelta,reputation:complete?d.themes[a.kind].rep:success?1:withdraw?0:-1,
  text:withdraw?'Tu reportes volontairement ce chapitre.':complete?'Saga terminée : '+d.themes[a.kind].label+'.':
    failed?'La saga est définitivement compromise.':success?'Chapitre réussi : la situation évolue.':'Tentative échouée, le chapitre reste à accomplir.'};
}
r.register('sagaEngineV110',{version:'11.0.0',normalize,create,select,status,begin,odds,decision,resolve});
})(window);