(function(global){
'use strict';
const r=global.OPL_MODULES;if(!r)throw Error('OPL registry missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f,rate=x=>clamp(num(x),0,1),short=(x,n=120)=>String(x||'').slice(0,n);
const scenes=[
 {title:'Une piste dans la région',text:'Une piste mène vers {actor}. Comment abordes-tu la situation ?',choices:['observe','contact','infiltrate','retreat']},
 {title:'La rencontre décisive',text:'La situation se complique autour de {actor}. Il faut agir sans perdre le contrôle.',choices:['negotiate','sneak','fight','retreat']},
 {title:'Le choix final',text:'Une occasion se présente après la confrontation. Que veux-tu obtenir ?',choices:['secure','share','reveal','retreat']}
];
const moves={
 observe:{label:'Observer et recueillir des indices',skill:'Navigation',bonus:.09,energy:2,progress:1,heat:-1,trust:0,risk:0},
 contact:{label:'Entrer en contact',skill:'Commandement',bonus:.04,energy:2,progress:1,heat:0,trust:2,risk:1},
 infiltrate:{label:'S’infiltrer discrètement',skill:'Discrétion',bonus:.01,energy:4,progress:2,heat:2,trust:-1,risk:2},
 negotiate:{label:'Négocier un passage',skill:'Commandement',bonus:.05,energy:3,progress:1,heat:0,trust:2,risk:1},
 sneak:{label:'Contourner les défenses',skill:'Discrétion',bonus:.01,energy:4,progress:2,heat:1,trust:0,risk:2},
 fight:{label:'Forcer le passage',skill:'Combat',bonus:-.09,energy:5,progress:3,heat:3,trust:-2,risk:4},
 secure:{label:'Sécuriser la découverte',skill:'Navigation',bonus:.03,energy:2,progress:1,heat:0,trust:0,risk:1},
 share:{label:'Partager avec les habitants',skill:'Commandement',bonus:.09,energy:2,progress:1,heat:-2,trust:3,risk:0},
 reveal:{label:'Rendre les preuves publiques',skill:'Science',bonus:-.04,energy:3,progress:2,heat:3,trust:0,risk:3},
 retreat:{label:'Se retirer sans insister',skill:null,bonus:0,energy:0,progress:0,heat:0,trust:0,risk:0}
};
const generic=[
 {name:'Une patrouille de la Marine',faction:'Marine',kind:'generic'},
 {name:'Un groupe de pirates',faction:'Pirates',kind:'generic'},
 {name:'Un réseau révolutionnaire',faction:'Révolutionnaires',kind:'generic'},
 {name:'Des commerçants locaux',faction:'Civil',kind:'generic'},
 {name:'Des agents gouvernementaux',faction:'Gouvernement',kind:'generic'}
];
function actorOf(actors=[],roll=.5,danger=40){
 const pool=(Array.isArray(actors)?actors:[]).filter(x=>x&&x.name&&['canon','canonCrew','crew'].includes(x.kind)).slice(0,25);
 const canon=pool.filter(x=>x.kind==='canon'),other=pool.filter(x=>x.kind!=='canon');
 const selected=canon.length&&rate(roll)<.62?canon:other.length?other:canon;
 const a=selected.length?selected[Math.floor(rate(roll)*selected.length)%selected.length]:generic[Math.floor((rate(roll)*.79+clamp(danger,0,100)/600)*generic.length)%generic.length];
 return {name:short(a.name,80),faction:short(a.faction||'Civil',50),kind:short(a.kind,15),canonical:a.kind==='canon'};
}
function normalize(raw={}){
 const s=raw&&typeof raw==='object'?raw:{};
 const history=Array.isArray(s.history)?s.history.slice(-25).filter(x=>x&&typeof x==='object').map(x=>({
  id:short(x.id,80),island:short(x.island,100),year:clamp(Math.floor(num(x.year)),0,9999),
  actor:short(x.actor,80),faction:short(x.faction,50),outcome:short(x.outcome,18),
  money:Math.max(0,Math.floor(num(x.money))),healthLoss:clamp(Math.floor(num(x.healthLoss)),0,80),
  steps:Array.isArray(x.steps)?x.steps.slice(0,3).map(z=>({choice:short(z.choice,20),success:!!z.success,chance:rate(z.chance)})):[]
 })):[];
 let a=s.active&&typeof s.active==='object'?s.active:null;
 if(a){
  const stage=Math.floor(num(a.stage,-1));
  if(stage<0||stage>=3||!short(a.id)||!short(a.island))a=null;
  else a={id:short(a.id,80),island:short(a.island,100),year:clamp(Math.floor(num(a.year)),0,9999),
   actor:short(a.actor,80),faction:short(a.faction,50),kind:short(a.kind,15),canonical:!!a.canonical,
   stage,progress:clamp(Math.floor(num(a.progress)),0,20),trust:clamp(Math.floor(num(a.trust)),-20,20),
   heat:clamp(Math.floor(num(a.heat)),0,30),danger:clamp(num(a.danger),0,100),
   prep:clamp(num(a.prep),0,80),wins:clamp(Math.floor(num(a.wins)),0,3),
   injuries:clamp(Math.floor(num(a.injuries)),0,80),
   steps:Array.isArray(a.steps)?a.steps.slice(0,2).map(z=>({choice:short(z.choice,20),success:!!z.success,chance:rate(z.chance)})):[]
  };
 }
 return {version:1,history,active:a,total:clamp(Math.floor(num(s.total)),0,1e9),wins:clamp(Math.floor(num(s.wins)),0,1e9)};
}
function start(raw,ctx={},roll=.5){
 const s=normalize(raw);
 if(s.active)return {ok:false,reason:'Une expédition est déjà en cours.',state:s};
 if(!ctx.alive||ctx.travel||ctx.pending||num(ctx.age)<12)return {ok:false,reason:'Départ impossible dans la situation actuelle.',state:s};
 const a=actorOf(ctx.actors,roll,ctx.danger);
 const active={id:'story_'+Math.floor(num(ctx.year))+'_'+(s.total+1),year:Math.floor(num(ctx.year)),
  island:short(ctx.island,100),actor:a.name,faction:a.faction,kind:a.kind,canonical:a.canonical,
  stage:0,progress:0,trust:0,heat:0,danger:clamp(num(ctx.danger,40),0,100),
  prep:clamp(num(ctx.prep,0),0,80),wins:0,injuries:0,steps:[]};
 return {ok:true,state:{...s,active,total:s.total+1},active};
}
function decision(raw){
 const a=normalize(raw).active;if(!a)return null;
 const scene=scenes[a.stage];
 return {id:'v107_'+a.id+'_'+a.stage,title:'Expédition • '+scene.title+' ('+(a.stage+1)+'/3)',
  text:scene.text.replace('{actor}',a.actor)+' '+a.faction+' • '+a.island+'.',
  choices:scene.choices.map(id=>({label:moves[id].label,action:'v107:'+a.stage+':'+id,
   hint:id==='retreat'?'Fin immédiate, sans butin.':moves[id].skill+' • '+moves[id].energy+' énergie'}))};
}
function preview(raw,id,ctx={}){
 const a=normalize(raw).active,m=moves[id];if(!a||!m||!scenes[a.stage].choices.includes(id))return null;
 if(id==='retreat')return {chance:1,cost:0,injuryChance:0};
 const skill=clamp(num(ctx.skills?.[m.skill],ctx.skills?.Combat||0),0,100),power=clamp(num(ctx.combatPower),0,150);
 const chance=clamp(.58+m.bonus+skill*.0025+(id==='fight'?power*.001:0)+a.prep*.0014+clamp(num(ctx.crew),0,100)*.00065+
  a.progress*.016+a.trust*.012-a.heat*.018-a.danger*.0035-a.stage*.025,.12,.94);
 const injuryChance=clamp((.04+a.danger*.003+m.risk*.05+a.heat*.008)*num(ctx.riskMult,1),.01,.80);
 return {chance,cost:m.energy,injuryChance};
}
function choose(raw,stage,choice,ctx={},rolls={}){
 const s=normalize(raw),a=s.active,m=moves[choice];
 if(!a||!m||a.stage!==Number(stage)||!scenes[a.stage].choices.includes(choice))
  return {ok:false,reason:'Choix expiré ou non disponible.',state:s};
 if(ctx.island&&a.island!==ctx.island)return {ok:false,reason:'L’expédition ne correspond plus au lieu actuel.',state:s};
 const p=preview(s,choice,ctx);if(num(ctx.energy)<p.cost)return {ok:false,reason:'Énergie insuffisante. Choisis le retrait.',state:s};
 const retreat=choice==='retreat',success=!retreat&&rate(rolls.success)<p.chance;
 const injury=retreat||success||rate(rolls.injury)>=p.injuryChance?0:Math.max(1,Math.round((2+a.danger*.075+m.risk)*(.7+rate(rolls.severity)*.6)));
 const entry={choice,success,chance:p.chance};
 const next={...a,stage:a.stage+1,progress:clamp(a.progress+(success?m.progress:0),0,20),
  trust:clamp(a.trust+(success?m.trust:Math.min(0,m.trust)),-20,20),
  heat:clamp(a.heat+m.heat+(success?0:1),0,30),wins:a.wins+(success?1:0),
  injuries:a.injuries+injury,steps:[...a.steps,entry]};
 const finished=retreat||a.stage===2,won=!retreat&&finished&&next.wins>=2;
 if(!finished)return {ok:true,state:{...s,active:next},finished:false,success,cost:p.cost,injury,entry};
 const outcome=retreat?'retreat':won?'success':'failure';
 let money=0,localRep=0,skill=null,skillGain=0;
 if(won){
  const factor=choice==='share'?.45:choice==='reveal'?.7:1;
  money=Math.round(clamp((420+a.danger*21+next.progress*195)*(.85+rate(rolls.reward)*.3)*factor,0,8500));
  localRep=choice==='share'?6:choice==='reveal'?4:2;
  skill=m.skill;skillGain=clamp(1+next.wins*.6+next.progress*.12,1,5);
 }
 const record={id:a.id,island:a.island,year:a.year,actor:a.actor,faction:a.faction,outcome,
  money,healthLoss:next.injuries,steps:next.steps};
 return {ok:true,state:{...s,active:null,history:[...s.history,record].slice(-25),wins:s.wins+(won?1:0)},
  finished:true,success:won,retreat,cost:p.cost,injury,entry,money,localRep,skill,skillGain,record};
}
r.register('storyEngineV107',{version:'10.7.0',normalize,start,decision,preview,choose,actorOf,scenes,moves});
})(window);