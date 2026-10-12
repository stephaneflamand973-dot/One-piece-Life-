
import {ORIGINS,FIRST_NAMES,LAST_NAMES,JOBS,SPECIAL,EVENTS} from './data.js';
export const SAVE_KEY='one-piece-life:reboot:v1';
export const SCHEMA=1;
const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,Math.round(Number(n)||0)));
const sample=(arr,rng)=>arr[Math.min(arr.length-1,Math.floor(rng()*arr.length))];
const findJob=id=>JOBS.find(j=>j.id===id);
const findSpecial=id=>SPECIAL.find(c=>c.id===id);
const getYear=s=>s.age;
const quota={study:2,exercise:2,relax:1,work:2,meet:1,interact:3,apply:3,raise:1,special:2};
export const isAdult=s=>s.age>=18;
export function createLife(input={},rng=Math.random){
 const name=String(input.name||'').trim().slice(0,40)||sample(FIRST_NAMES,rng)+' '+sample(LAST_NAMES,rng);
 const origin=ORIGINS.includes(input.origin)?input.origin:sample(ORIGINS,rng);
 return {schema:SCHEMA,id:'life-'+Math.floor(rng()*1e9),age:0,alive:true,pending:null,
  player:{name,origin,money:500,happiness:75,health:90,intellect:clamp(35+rng()*30),fitness:clamp(40+rng()*30),fame:0,bounty:0},
  career:{job:null,special:null},
  relations:[{id:'parent',name:'Parent',role:'Famille',bond:75}],
  counts:{},history:[{age:0,title:'Naissance',description:name+' est né(e) dans '+origin+'.',kind:'life'}]};
}
export const jobEligibility=(s,job)=>{
 if(!s?.alive)return 'Cette vie est terminée.';
 if(s.pending)return 'Réponds d’abord à la décision en attente.';
 if(s.career.special)return 'Une carrière spéciale est déjà en cours.';
 if(s.age<job.age)return 'Accessible à partir de '+job.age+' ans.';
 if(s.player.intellect<job.intellect)return 'Intelligence requise : '+job.intellect+'/100.';
 if(s.player.fitness<job.fitness)return 'Forme requise : '+job.fitness+'/100.';
 if(s.career.job?.id===job.id)return 'Tu occupes déjà ce poste.';
 if((s.counts.apply||0)>=quota.apply)return 'Trois candidatures maximum par an.';
 return '';
};
export const specialEligibility=(s,career)=>{
 if(!s?.alive)return 'Cette vie est terminée.';
 if(s.pending)return 'Réponds d’abord à la décision en attente.';
 if(s.career.job)return 'Quitte ton emploi ordinaire avant de rejoindre une carrière spéciale.';
 if(s.career.special)return 'Quitte ta carrière spéciale actuelle.';
 if(s.age<career.age)return 'Accessible à partir de '+career.age+' ans.';
 if(s.player.intellect<career.intellect)return 'Intelligence requise : '+career.intellect+'/100.';
 if(s.player.fitness<career.fitness)return 'Forme requise : '+career.fitness+'/100.';
 return '';
};
export function actionStatus(s,type){
 if(!s?.alive)return 'Cette vie est terminée.';
 if(s.pending)return 'Réponds d’abord à la décision en attente.';
 if(type==='study'&&s.age<5)return 'Accessible à partir de 5 ans.';
 if(type==='work'&&!s.career.job)return 'Tu n’as pas d’emploi ordinaire.';
 if(type==='special'&&!s.career.special)return 'Tu n’as pas de carrière spéciale.';
 if(type==='raise'&&!s.career.job)return 'Tu n’as pas de supérieur à solliciter.';
 if(type==='meet'&&s.age<5)return 'Accessible à partir de 5 ans.';
 if(type==='meet'&&s.relations.length>=12)return 'Ton cercle de relations est déjà complet.';
 const used=s.counts[type]||0;
 if(quota[type]!=null&&used>=quota[type])return 'Limite annuelle atteinte ('+quota[type]+').';
 return '';
}
export const remaining=(s,type)=>Math.max(0,(quota[type]||0)-(s.counts[type]||0));
function addLog(s,title,description,kind='life'){
 s.history.unshift({age:s.age,title,description,kind});
 s.history=s.history.slice(0,100);
}
function attributes(s,delta={}){
 for(const k of ['happiness','health','intellect','fitness','fame','bounty'])
  if(Object.prototype.hasOwnProperty.call(delta,k))s.player[k]=clamp(s.player[k]+delta[k],0,k==='bounty'?999999:100);
}
function use(s,key){s.counts[key]=(s.counts[key]||0)+1;}
function response(state,result){return {state,result};}
function block(state,reason){return response(state,{ok:false,message:reason});}
function success(s,message){return response(s,{ok:true,message});}
function work(s){const job=findJob(s.career.job.id);
 const bonus=Math.round((job.pay/12)*(.6+s.career.job.level*.1));
 s.player.money+=bonus;s.career.job.xp+=14;s.player.happiness=clamp(s.player.happiness-2);
 if(s.career.job.xp>=60){s.career.job.xp-=60;s.career.job.level=Math.min(5,s.career.job.level+1);addLog(s,'Promotion au travail','Tu as progressé en tant que '+job.name+'.','career');}
 use(s,'work');addLog(s,'Journée de travail','Prime d’activité : +'+bonus.toLocaleString('fr-FR')+' Berry.','career');return success(s,'Travail effectué : +'+bonus+' Berry.');
}
function specialAction(s,id,rng){
 const c=s.career.special,def=findSpecial(c.id),act=def.actions.find(a=>a.id===id);
 if(!act)return block(s,'Action spéciale inconnue.');
 if(actionStatus(s,'special'))return block(s,actionStatus(s,'special'));
 if(s.player.health<act.cost)return block(s,'Santé insuffisante pour cette action.');
 use(s,'special');
 const risky=['raid','patrol','contract','mission','intel'].includes(id);
 const won=!risky||rng()<Math.min(.9,.45+s.player.fitness/200+c.reputation/300);
 const reward=won?(id==='contract'?1800:id==='raid'?1450:risky?450:0):0;
 s.player.money+=reward;c.xp+=won?15:4;c.reputation=clamp(c.reputation+(won?7:-3));
 attributes(s,won?{health:-2,happiness:2,fame:2}:{health:-12,happiness:-5});
 if(c.id==='pirate'&&id==='raid'&&won)attributes(s,{bounty:40});
 if(c.id==='pirate'&&id==='recruit'&&won)c.crew+=1;
 if(c.xp>=55){c.xp-=55;c.rank+=1;addLog(s,'Progression spéciale','Nouveau niveau dans la voie '+def.name+'.','career');}
 addLog(s,def.name+' : '+act.label,won?'Opération réussie.'+(reward?' +'+reward+' Berry.':''):'Une mission difficile qui laisse des traces.','career');
 return success(s,won?'Action réussie.':'Échec de la tentative, avec des conséquences.');
}
export function transition(state,action={},rng=Math.random){
 if(!state||state.schema!==SCHEMA)return block(state,'Sauvegarde incompatible avec le nouveau moteur.');
 if(!state.alive)return block(state,'Cette vie est terminée.');
 const type=String(action.type||'');
 if(state.pending&&type!=='choose')return block(state,'Réponds à la décision en attente.');
 const s=structuredClone(state);
 const p=s.player;
 if(type==='age'){
  s.age+=1;s.counts={};
  if(s.age>=6&&s.age<=17)attributes(s,{intellect:1});
  if(s.career.job){
   const job=findJob(s.career.job.id),pay=Math.round(job.pay*(1+(s.career.job.level-1)*.12));
   p.money+=pay;addLog(s,'Salaire annuel','Ton emploi de '+job.name+' t’a rapporté '+pay.toLocaleString('fr-FR')+' Berry.','career');
  }
  if(s.career.special&&['marine','government'].includes(s.career.special.id)){
   const pay=4700+s.career.special.rank*800;p.money+=pay;
   addLog(s,'Solde annuelle','Ta carrière spéciale te rapporte '+pay+' Berry.','career');
  }
  const living=s.age>=18?1100:180;
  p.money=Math.max(0,p.money-living);
  attributes(s,{happiness:s.age>55?-1:0,health:s.age>55?-2:0});
  for(const rel of s.relations)rel.bond=clamp(rel.bond-(rng()<.35?1:0));
  addLog(s,s.age+' ans','Une nouvelle année commence dans '+p.origin+'.','life');
  const fatal=s.age>=75&&(rng()<(s.age-74)*.025)||p.health<=0;
  if(fatal){s.alive=false;addLog(s,'Fin de vie',p.name+' laisse derrière lui une histoire unique.','major');return success(s,'Fin de vie à '+s.age+' ans.');}
  if(s.age>=5&&rng()<.35){const ev=sample(EVENTS,rng);s.pending=ev.id;
   addLog(s,ev.title,ev.text,'decision');return success(s,'Une décision importante t’attend.');}
  return success(s,'Tu as maintenant '+s.age+' ans.');
 }
 if(type==='choose'){
  const ev=EVENTS.find(e=>e.id===s.pending),choice=ev?.choices.find(c=>c.id===action.id);
  if(!choice)return block(state,'Choix inconnu.');
  attributes(s,choice.delta);p.money=Math.max(0,p.money+(choice.money||0));s.pending=null;
  addLog(s,ev.title,choice.text,'decision');return success(s,choice.text);
 }
 if(type==='activity'){
  const id=String(action.id),gate=actionStatus(s,id);if(gate)return block(state,gate);
  if(id==='work')return work(s);
  const deltas={study:{intellect:4,happiness:-1},exercise:{fitness:4,health:2},relax:{happiness:6,health:2}};
  if(!deltas[id])return block(state,'Activité inconnue.');
  use(s,id);attributes(s,deltas[id]);
  const names={study:'Étudier',exercise:'Faire du sport',relax:'Se détendre'};
  addLog(s,names[id],'Tu as pris du temps pour '+names[id].toLowerCase()+'.','activity');
  return success(s,names[id]+' : progression enregistrée.');
 }
 if(type==='apply'){
  const job=findJob(action.id);if(!job)return block(state,'Métier inconnu.');
  const gate=jobEligibility(s,job);if(gate)return block(state,gate);
  use(s,'apply');
  const accepted=rng()<Math.min(.98,.78+(p.intellect-job.intellect)*.003);
  if(accepted){const previous=s.career.job?findJob(s.career.job.id).name:null;
   s.career.job={id:job.id,level:1,xp:0};
   addLog(s,'Embauché !','Nouveau poste : '+job.name+(previous?' (ancien poste : '+previous+')':'')+'.','career');
   return success(s,'Candidature acceptée chez '+job.name+'.');}
  addLog(s,'Candidature refusée','Ton dossier pour '+job.name+' n’a pas été retenu.','career');
  return success(s,'Candidature refusée. Tu peux réessayer plus tard.');
 }
 if(type==='quit-job'){
  if(!s.career.job)return block(state,'Tu n’as pas d’emploi.');
  const job=findJob(s.career.job.id);s.career.job=null;addLog(s,'Démission','Tu as quitté ton poste de '+job.name+'.','career');
  return success(s,'Tu as quitté ton poste.');
 }
 if(type==='raise'){
  const gate=actionStatus(s,'raise');if(gate)return block(state,gate);
  use(s,'raise');const yes=rng()<Math.min(.9,.25+s.career.job.xp/150+s.career.job.level*.10);
  if(yes)s.career.job.level=Math.min(5,s.career.job.level+1);
  addLog(s,'Demande d’augmentation',yes?'Augmentation accordée.':'Demande refusée.','career');
  return success(s,yes?'Augmentation accordée.':'Augmentation refusée.');
 }
 if(type==='special-join'){
  const c=findSpecial(action.id);if(!c)return block(state,'Carrière spéciale inconnue.');
  const gate=specialEligibility(s,c);if(gate)return block(state,gate);
  if(c.id==='pirate'&&!['create','join'].includes(action.method))return block(state,'Choisis de créer ou de rejoindre un équipage.');
  s.career.special={id:c.id,rank:1,xp:0,reputation:10,crew:c.id==='pirate'?(action.method==='create'?1:4):0,method:c.id==='pirate'?action.method:'enlist'};
  addLog(s,'Nouvelle carrière : '+c.name,c.id==='pirate'?(action.method==='create'?'Tu fondes ton propre équipage.':'Tu rejoins un équipage existant.'):'Tu commences un parcours indépendant des métiers ordinaires.','career');
  return success(s,'Tu as rejoint la voie '+c.name+'.');
 }
 if(type==='special-leave'){
  if(!s.career.special)return block(state,'Aucune carrière spéciale en cours.');
  const c=findSpecial(s.career.special.id);s.career.special=null;
  addLog(s,'Départ de '+c.name,'Tu mets fin à ton engagement.','career');
  return success(s,'Tu as quitté '+c.name+'.');
 }
 if(type==='special-action')return specialAction(s,action.id,rng);
 if(type==='meet'){
  const gate=actionStatus(s,'meet');if(gate)return block(state,gate);
  const name=sample(FIRST_NAMES,rng)+' '+sample(LAST_NAMES,rng);
  const id='person-'+s.age+'-'+s.relations.length+'-'+Math.floor(rng()*10000);
  s.relations.push({id,name,role:'Amitié',bond:40});use(s,'meet');
  addLog(s,'Nouvelle rencontre','Tu as fait la connaissance de '+name+'.','social');
  return success(s,'Tu as rencontré '+name+'.');
 }
 if(type==='interact'){
  const gate=actionStatus(s,'interact');if(gate)return block(state,gate);
  const person=s.relations.find(x=>x.id===action.id);if(!person)return block(state,'Cette relation est introuvable.');
  const mood=action.method==='talk'?6:action.method==='gift'?12:0;
  if(!mood)return block(state,'Interaction inconnue.');
  if(action.method==='gift'&&p.money<100)return block(state,'Il te faut 100 Berry pour ce cadeau.');
  if(action.method==='gift')p.money-=100;
  person.bond=clamp(person.bond+mood);attributes(s,{happiness:3});use(s,'interact');
  addLog(s,'Moment avec '+person.name,action.method==='gift'?'Tu as offert un cadeau.':'Vous avez discuté.','social');
  return success(s,'Ton lien avec '+person.name+' s’améliore.');
 }
 return block(state,'Action inconnue.');
}
export const currentEvent=s=>EVENTS.find(e=>e.id===s.pending)||null;
export const currentJob=s=>s.career.job?findJob(s.career.job.id):null;
export const currentSpecial=s=>s.career.special?findSpecial(s.career.special.id):null;
