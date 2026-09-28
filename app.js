(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var game=null,slot=1,mode='destiny',majorOnly=false,backupMode='export',P='opl-v05-';
var ORIG=['East Blue','North Blue','West Blue','South Blue'],REG=ORIG.concat(['Grand Line','New World']);
var ST=['Force','Vitesse','Agilité','Endurance','Résistance','Réflexes','Discipline','Volonté'];
var SK=['Combat','Sabre','Tir','Navigation','Médecine','Commandement','Discrétion','Science'];
var PL={
'Loguetown':['East Blue',14,['Shells Town','Baratie','Reverse Mountain']],
'Shells Town':['East Blue',8,['Loguetown','Orange Town']],
'Orange Town':['East Blue',9,['Shells Town','Syrup Village']],
'Goa':['East Blue',10,['Shimotsuki','Syrup Village']],
'Shimotsuki':['East Blue',6,['Goa','Baratie']],
'Syrup Village':['East Blue',5,['Orange Town','Goa','Baratie']],
'Baratie':['East Blue',12,['Loguetown','Shimotsuki','Syrup Village']],
'Lvneel':['North Blue',12,['Flevance','Minion Island']],
'Flevance':['North Blue',20,['Lvneel','Minion Island']],
'Minion Island':['North Blue',22,['Flevance','Reverse Mountain']],
'Ohara':['West Blue',8,['Ilusia']],
'Ilusia':['West Blue',14,['Ohara','Reverse Mountain']],
'Baterilla':['South Blue',10,['Torino','Reverse Mountain']],
'Torino':['South Blue',16,['Baterilla']],
'Reverse Mountain':['Grand Line',32,['Loguetown','Minion Island','Ilusia','Baterilla','Twin Cape']],
'Twin Cape':['Grand Line',28,['Reverse Mountain','Whisky Peak']],
'Whisky Peak':['Grand Line',34,['Twin Cape','Little Garden']],
'Little Garden':['Grand Line',39,['Whisky Peak','Drum']],
'Drum':['Grand Line',32,['Little Garden','Alabasta']],
'Alabasta':['Grand Line',37,['Drum','Jaya']],
'Jaya':['Grand Line',43,['Alabasta','Water 7']],
'Water 7':['Grand Line',29,['Jaya','Thriller Bark']],
'Thriller Bark':['Grand Line',48,['Water 7','Sabaody']],
'Sabaody':['Grand Line',45,['Thriller Bark','Fish-Man Island']],
'Fish-Man Island':['Grand Line',44,['Sabaody','Punk Hazard']],
'Punk Hazard':['New World',66,['Fish-Man Island','Dressrosa']],
'Dressrosa':['New World',61,['Punk Hazard','Zou','Whole Cake Island']],
'Zou':['New World',52,['Dressrosa','Wano']],
'Whole Cake Island':['New World',78,['Dressrosa','Wano']],
'Wano':['New World',82,['Zou','Whole Cake Island','Egghead']],
'Egghead':['New World',68,['Wano']]};
var CH=[['Garp','Marine','East Blue',90],['Shanks','Pirates','East Blue',95],['Rayleigh','Pirates','Grand Line',92],['Mihawk','Indépendant','Grand Line',90],['Dragon','Révolutionnaires','Grand Line',98],['Kaido','Pirates','New World',99],['Big Mom','Pirates','New World',99],['Barbe Blanche','Pirates','New World',100]];

var ACTOR_TEMPLATES=[
 {name:'Garp',faction:'Marine',region:'East Blue',base:92,peak:97,growth:1,importance:98,goal:'Former la prochaine génération'},
 {name:'Shanks',faction:'Pirates',region:'East Blue',base:28,peak:96,growth:16,importance:100,goal:'Tracer sa propre route'},
 {name:'Rayleigh',faction:'Pirates',region:'Grand Line',base:95,peak:91,growth:22,importance:94,goal:'Observer la nouvelle ère'},
 {name:'Mihawk',faction:'Indépendant',region:'Grand Line',base:34,peak:94,growth:16,importance:96,goal:'Chercher des adversaires dignes'},
 {name:'Dragon',faction:'Révolutionnaires',region:'Grand Line',base:58,peak:98,growth:14,importance:100,goal:'Étendre le réseau révolutionnaire'},
 {name:'Kaido',faction:'Pirates',region:'New World',base:84,peak:99,growth:10,importance:99,goal:'Accroître sa domination'},
 {name:'Big Mom',faction:'Pirates',region:'New World',base:95,peak:99,growth:8,importance:99,goal:'Étendre son territoire'},
 {name:'Barbe Blanche',faction:'Pirates',region:'New World',base:100,peak:96,growth:22,importance:100,goal:'Protéger sa famille'}
];
var CONTENT=window.OPV1_CONTENT||{locations:{},actors:[],fruits:[],fruitAssignments:[],canonEvents:[],specialTechniques:[],localEvents:[]};
Object.keys(CONTENT.locations||{}).forEach(function(n){PL[n]=CONTENT.locations[n]});
Object.keys(PL).forEach(function(n){var routes=PL[n][2]||[];routes.forEach(function(d){if(PL[d]&&PL[d][2].indexOf(n)<0)PL[d][2].push(n)})});
if(CONTENT.actors&&CONTENT.actors.length)ACTOR_TEMPLATES=CONTENT.actors.slice();
var CANON_EVENTS=(CONTENT.canonEvents||[]).slice();
var SPECIAL_TECHNIQUES=(CONTENT.specialTechniques||[]).slice();
var LOCAL_EVENTS=(CONTENT.localEvents||[]).slice();
var FRUIT_ASSIGNMENTS=(CONTENT.fruitAssignments||[]).slice();
var FRUIT_INFO={};(CONTENT.fruits||[]).forEach(function(x){FRUIT_INFO[x[0]]={type:x[1],rarity:x[2]}});
function fruitMeta(n){return FRUIT_INFO[n]||{type:'Inconnu',rarity:70}}
function pickFruit(list){var total=0,weights=list.map(function(n){var m=fruitMeta(n),w=Math.max(2,108-(m.rarity||70));total+=w;return w}),r=R('fruit')*total;for(var i=0;i<list.length;i++){r-=weights[i];if(r<=0)return list[i]}return list[list.length-1]}
function specialRequirementMet(t,p){var q=t.requires||{};if(q.faction&&p.faction!==q.faction)return false;if(q.race&&p.race!==q.race)return false;if(q.style&&p.style!==q.style)return false;if(q.skill&&(p.skills[q.skill]||0)<(q.skillValue||0))return false;if(q.stat&&(p.stats[q.stat]||0)<(q.statValue||0))return false;return true}
function canonMonth(c){return(c.year||0)*12+(c.month||0)}
function initCanonState(w){
 var previous={};(w.canon||[]).forEach(function(c){if(Array.isArray(c))previous[c[0]]=c[2];else if(c&&c.title)previous[c.title]=c.status});
 var source=CANON_EVENTS.length?CANON_EVENTS:[{id:'roger-execution',year:0,month:0,title:'Exécution de Gol D. Roger',type:'anchor',resistance:100,location:'Loguetown',required:[],factions:['Marine','Pirates'],description:'La Grande Ère de la Piraterie commence.'}];
 w.canon=source.map(function(c){var x=Object.assign({},c);x.required=(c.required||[]).slice();x.factions=(c.factions||[]).slice();x.status=previous[x.title]||x.status||(canonMonth(x)===0?'completed':'future');return x});
 w.canonHistory=w.canonHistory||[];return w
}
function fruitAssignmentMonth(a){return(a.year||0)*12+(a.month||0)}
function syncCanonicalFruits(){
 var w=game.world,now=w.year*12+Math.floor(w.month);
 FRUIT_ASSIGNMENTS.forEach(function(a){
  if(now<fruitAssignmentMonth(a))return;
  var reg=w.fruitRegistry[a.fruit]||(w.fruitRegistry[a.fruit]={status:'available',holder:null}),actor=w.actors.find(function(x){return x.name===a.holder});
  if(actor&&actor.status==='dead'){
   if(reg.holder===a.holder){reg.status='available';reg.holder=null;news('Fruit réapparu',a.fruit+' réapparaît quelque part dans le monde après la mort de '+a.holder+'.','major')}
   return
  }
  if(reg.status==='available'||reg.status==='sold'){
   reg.status='consumed';reg.holder=a.holder;return
  }
  if(reg.holder!==a.holder&&!reg.canonBlocked){
   reg.canonBlocked=true;w.divergence=cl(w.divergence+2.5,0,100);news('Divergence liée à un Fruit',a.holder+' ne peut pas obtenir '+a.fruit+' car son état mondial a déjà changé.','war')
  }
 })
}function fruitMarketTick(){
 var w=game.world;Object.keys(w.fruitRegistry||{}).forEach(function(n){var r=w.fruitRegistry[n];if(r.status!=='sold')return;r.marketMonths=(r.marketMonths||0)+1;if(r.marketMonths>=3||R('fruit')<.16){r.status='available';r.holder=null;r.marketMonths=0}})
}
function releasePlayerFruits(){
 var p=game.player,w=game.world;if(p.fruit){var r=w.fruitRegistry[p.fruit]||(w.fruitRegistry[p.fruit]={status:'available',holder:null});if(r.holder===p.name||r.status==='consumed'){r.status='available';r.holder=null;r.canonBlocked=false;news('Fruit réapparu',p.fruit+' réapparaît quelque part après la mort de '+p.name+'.','major')}}
 if(p.heldFruit){var h=w.fruitRegistry[p.heldFruit]||(w.fruitRegistry[p.heldFruit]={status:'available',holder:null});if(h.holder===p.name||h.status==='held'){h.status='available';h.holder=null;h.canonBlocked=false}}
}

var REGION_LINKS={
 'East Blue':['Grand Line'],'North Blue':['Grand Line'],'West Blue':['Grand Line'],'South Blue':['Grand Line'],
 'Grand Line':['East Blue','North Blue','West Blue','South Blue','New World'],'New World':['Grand Line']
};
var CREW_A=['Crimson','Brume','Tempête','Écume','Cendre','Aube','Foudre','Corail','Marée','Fer','Sillage','Astre'];
var CREW_B=['Mantas','Ravens','Sharks','Drakes','Foxes','Wolves','Blades','Corsairs','Comets','Serpents','Bulls','Vultures'];
var WORLD_FACTIONS=['Civil','Marine','Pirates','Chasseur de primes','Révolutionnaires','Gouvernement'];
function det(g,k){return (H(String(g.seed||1)+':'+k)%100000)/100000}
function pairKey(a,b){return[a,b].sort().join('|')}
function initDiplomacy(){
 var d={};
 function set(a,b,v){d[pairKey(a,b)]=v}
 set('Marine','Gouvernement',78);set('Marine','Pirates',-90);set('Marine','Révolutionnaires',-58);set('Marine','Civil',28);set('Marine','Chasseur de primes',18);
 set('Gouvernement','Pirates',-96);set('Gouvernement','Révolutionnaires',-100);set('Gouvernement','Civil',16);set('Gouvernement','Chasseur de primes',12);
 set('Pirates','Révolutionnaires',4);set('Pirates','Civil',-22);set('Pirates','Chasseur de primes',-62);
 set('Révolutionnaires','Civil',14);set('Révolutionnaires','Chasseur de primes',-6);set('Civil','Chasseur de primes',22);
 return d
}
function territorySeed(g,name){
 var region=infStatic(name).region,r=det(g,'territory:'+name),controller='Civil';
 if(['East Blue','North Blue','West Blue','South Blue'].indexOf(region)>=0)controller=r<.56?'Marine':r<.88?'Civil':'Pirates';
 else if(region==='Grand Line')controller=r<.30?'Marine':r<.58?'Civil':r<.89?'Pirates':'Gouvernement';
 else controller=r<.56?'Pirates':r<.76?'Gouvernement':r<.90?'Civil':'Révolutionnaires';
 return{controller:controller,influence:Math.round(48+det(g,'influence:'+name)*34),stability:Math.round(38+det(g,'stability:'+name)*50),contested:false,lastChange:null}
}
function infStatic(n){var p=PL[n]||['East Blue',10,[]];return{region:p[0],danger:p[1],routes:p[2]}}
function makeWorldCrew(g,i){
 var alignment=det(g,'crew:f:'+i),f=alignment<.72?'Pirates':alignment<.87?'Chasseur de primes':'Révolutionnaires',
 region=REG[Math.floor(det(g,'crew:r:'+i)*REG.length)],name=CREW_A[Math.floor(det(g,'crew:a:'+i)*CREW_A.length)]+' '+CREW_B[Math.floor(det(g,'crew:b:'+i)*CREW_B.length)];
 return{id:'crew-'+i,name:name,faction:f,region:region,power:Math.round(14+det(g,'crew:p:'+i)*54),members:Math.round(4+det(g,'crew:m:'+i)*28),morale:Math.round(42+det(g,'crew:o:'+i)*48),bounty:f==='Pirates'?Math.round((8+det(g,'crew:q:'+i)*90)*1000000):0,status:'active',ageMonths:Math.round(det(g,'crew:age:'+i)*90),victories:0,defeats:0}
}
function initLivingWorld(g,w){
 w.factions=w.factions||{};if(w.factions.Civil==null)w.factions.Civil=62;if(w.factions['Chasseur de primes']==null)w.factions['Chasseur de primes']=44;
 w.diplomacy=w.diplomacy||initDiplomacy();w.pressures=w.pressures||{};REG.forEach(function(r){if(!w.pressures[r])w.pressures[r]={Piraterie:20+det(g,'pressure:p:'+r)*25,Marine:30+det(g,'pressure:m:'+r)*35,Criminalité:15+det(g,'pressure:c:'+r)*30,Révolution:5+det(g,'pressure:r:'+r)*20,Prospérité:40+det(g,'pressure:o:'+r)*35,Instabilité:10+det(g,'pressure:i:'+r)*25}});
 w.territories=w.territories||{};Object.keys(PL).forEach(function(n){if(!w.territories[n])w.territories[n]=territorySeed(g,n)});
 var aliases={'Garp':'Monkey D. Garp','Rayleigh':'Silvers Rayleigh','Mihawk':'Dracule Mihawk','Dragon':'Monkey D. Dragon','Big Mom':'Charlotte Linlin','Barbe Blanche':'Edward Newgate'};var existing={};(w.actors||[]).forEach(function(a){existing[aliases[a.name]||a.name]=a});w.actors=ACTOR_TEMPLATES.map(function(a,i){var x=existing[a.name]||{};x.name=a.name;x.faction=a.faction;x.region=x.region||a.region;x.startRegion=a.region;x.base=a.base;x.peak=a.peak;x.growth=a.growth;x.importance=a.importance;x.goal=a.goal;x.birthYear=a.birthYear==null?-20:a.birthYear;x.activeFrom=a.activeFrom==null?0:a.activeFrom;x.status=x.status||(w.year>=x.activeFrom?'active':'inactive');if(x.status==='active'&&w.year<x.activeFrom)x.status='inactive';x.woundMonths=x.woundMonths||0;x.influence=x.influence==null?Math.round(60+det(g,'actor:i:'+i)*35):x.influence;x.actions=x.actions||0;return x});
 w.crews=w.crews||Array.from({length:10},function(_,i){return makeWorldCrew(g,i)});
 w.conflicts=w.conflicts||[];w.worldHistory=w.worldHistory||[];w.simRemainder=w.simRemainder||0;w.nextCrewId=w.nextCrewId||w.crews.length;w.globalTension=w.globalTension==null?34:w.globalTension;
 var fruitNames=(CONTENT.fruits||[]).map(function(x){return x[0]});w.fruits=[].concat(w.fruits||[],fruitNames).filter(function(v,i,a){return a.indexOf(v)===i});w.fruitRegistry=w.fruitRegistry||{};
 w.fruits.forEach(function(n){if(!w.fruitRegistry[n])w.fruitRegistry[n]={status:'available',holder:null}});
 initCanonState(w);return w
}
function diplomacy(a,b){if(a===b)return 100;if(a==='Indépendant'||b==='Indépendant')return 0;return game.world.diplomacy[pairKey(a,b)]||0}
function actorPower(a){var y=game.world.year||0;if(a.status==='inactive')return 0;var start=a.activeFrom||0,t=cl((y-start)/Math.max(1,a.growth||15),0,1);return a.base+(a.peak-a.base)*t}

var PEOPLE_NAMES=['Mira','Doran','Seline','Rook','Nessa','Toma','Ari','Noa','Kaï','Lina','Eden','Sora','Maël','Namiya','Kellan','Yuna','Senn','Iria','Milo','Rin'];
var HOUSING=[
 {name:'Logement modeste',monthly:700,buy:0,asset:0},
 {name:'Appartement confortable',monthly:1400,buy:25000,asset:15000},
 {name:'Maison familiale',monthly:2600,buy:90000,asset:70000},
 {name:'Résidence prestigieuse',monthly:6000,buy:300000,asset:250000}
];
var ACHIEVEMENTS=[
 {id:'voyage',name:'Premier horizon',desc:'Visiter au moins deux lieux.'},
 {id:'grandline',name:'Au-delà de Reverse Mountain',desc:'Atteindre Grand Line.'},
 {id:'newworld',name:'Nouveau Monde',desc:'Atteindre le Nouveau Monde.'},
 {id:'haki',name:'Volonté éveillée',desc:'Éveiller au moins un Haki.'},
 {id:'fruit',name:'Pouvoir interdit',desc:'Consommer un Fruit du démon.'},
 {id:'family',name:'Une autre génération',desc:'Avoir au moins un enfant.'},
 {id:'marriage',name:'Engagement',desc:'Se marier.'},
 {id:'wealth',name:'Millionnaire',desc:'Atteindre 1 000 000 B de patrimoine net.'},
 {id:'veteran',name:'Vétéran',desc:'Remporter 20 combats.'},
 {id:'bounty',name:'Menace mondiale',desc:'Atteindre 100 000 000 B de prime.'},
 {id:'social',name:'Un nom que l’on connaît',desc:'Entretenir huit relations importantes.'},
 {id:'divergence',name:'Faiseur d’histoire',desc:'Faire dépasser 10% de divergence historique.'},
 {id:'longevity',name:'Longue vie',desc:'Atteindre 60 ans.'},
 {id:'legacy',name:'La volonté transmise',desc:'Continuer la partie avec un héritier.'},
 {id:'commander',name:'Sous ton pavillon',desc:'Diriger une organisation avec au moins six membres actifs.'},
 {id:'flagship',name:'Navire de commandement',desc:'Commander une Frégate ou un Galion.'}
];
function normalizeRelation(g,r,i){
 r=r||{};var base=H(String(g.seed||1)+':rel:'+String(r.name||i));
 r.id=r.id||('rel-'+i+'-'+(base%100000));r.name=r.name||PEOPLE_NAMES[base%PEOPLE_NAMES.length];r.role=r.role||'connaissance';r.type=r.type||'social';
 r.affection=cl(r.affection==null?35+(base%41):r.affection,0,100);r.respect=cl(r.respect==null?30+((base>>>3)%46):r.respect,0,100);r.trust=cl(r.trust==null?30+((base>>>5)%41):r.trust,0,100);
 r.fear=cl(r.fear||0,0,100);r.loyalty=cl(r.loyalty==null?35+((base>>>7)%36):r.loyalty,0,100);r.rivalry=cl(r.rivalry||0,0,100);r.attraction=cl(r.attraction==null?20+((base>>>9)%61):r.attraction,0,100);
 r.monthsKnown=r.monthsKnown||0;r.relationshipMonths=r.relationshipMonths||0;r.status=r.status||'active';r.location=r.location||null;r.faction=r.faction||'Civil';return r
}
function defaultLife(){return{relationshipStatus:'Célibataire',partnerId:null,housingLevel:0,assets:{property:0,business:0,ship:0,treasure:0},livingCostsPaid:0,debtPeak:0,netWorthPeak:0,socialActions:2,lastExpense:0,totalBusinessIncome:0}}
function metaKey(){return P+'meta-'+slot}
function loadMeta(){try{return JSON.parse(localStorage.getItem(metaKey())||'null')}catch(x){return null}}
function saveMeta(){if(!game)return;localStorage.setItem(metaKey(),JSON.stringify({codex:game.codex,achievements:game.achievements,dynasty:game.dynasty}))}
function applyMeta(g){var m=loadMeta();if(!m)return g;if(m.codex){['people','places','factions','fruits','events','techniques'].forEach(function(k){g.codex[k]=[].concat(g.codex[k]||[],m.codex[k]||[]).filter(function(v,i,a){return a.indexOf(v)===i})})}if(m.achievements)g.achievements=m.achievements;return g}
var FACTION_KEYS=['Civil','Marine','Pirates','Chasseur de primes','Révolutionnaires','Gouvernement'];
var CAREERS={
Civil:{label:'Civil',salary:2800,specs:['Marchand','Médecin','Navigateur','Scientifique','Artisan','Cuisinier'],ranks:[
 {n:'Apprenti',xp:0,rep:-100,pow:0},{n:'Professionnel',xp:35,rep:5,pow:12},{n:'Confirmé',xp:95,rep:18,pow:20},{n:'Expert',xp:190,rep:35,pow:28},{n:'Maître',xp:330,rep:55,pow:38}]},
Marine:{label:'Marine',salary:4200,specs:['Combat','Navigation','Renseignement','Médecine'],ranks:[
 {n:'Recrue',xp:0,rep:-100,pow:0},{n:'Matelot',xp:28,rep:5,pow:15},{n:'Sous-officier',xp:82,rep:15,pow:24},{n:'Enseigne',xp:155,rep:28,pow:31},{n:'Lieutenant',xp:245,rep:42,pow:39},{n:'Commandant',xp:365,rep:58,pow:48},{n:'Capitaine',xp:520,rep:72,pow:58},{n:'Contre-amiral',xp:710,rep:84,pow:67},{n:'Vice-amiral',xp:950,rep:92,pow:76}]},
Pirates:{label:'Pirates',salary:0,specs:['Combattant','Navigateur','Tireur','Médecin','Quartier-maître'],ranks:[
 {n:'Novice',xp:0,rep:-100,pow:0},{n:'Membre',xp:25,rep:5,pow:16},{n:'Combattant',xp:78,rep:16,pow:25},{n:'Officier',xp:150,rep:30,pow:34},{n:'Bras droit',xp:255,rep:48,pow:44},{n:'Capitaine',xp:390,rep:65,pow:53},{n:'Capitaine renommé',xp:590,rep:82,pow:64}]},
'Chasseur de primes':{label:'Chasseur de primes',salary:0,specs:['Traqueur','Duelliste','Tireur','Investigateur'],ranks:[
 {n:'Indépendant',xp:0,rep:-100,pow:0},{n:'Chasseur licencié',xp:38,rep:6,pow:18},{n:'Chasseur réputé',xp:110,rep:22,pow:29},{n:'Chasseur d’élite',xp:225,rep:42,pow:43},{n:'Maître chasseur',xp:420,rep:66,pow:58}]},
Révolutionnaires:{label:'Révolutionnaires',salary:1200,specs:['Combat','Infiltration','Renseignement','Logistique'],ranks:[
 {n:'Sympathisant',xp:0,rep:-100,pow:0},{n:'Agent',xp:34,rep:6,pow:17},{n:'Officier',xp:100,rep:20,pow:27},{n:'Chef de cellule',xp:205,rep:38,pow:39},{n:'Commandant régional',xp:380,rep:62,pow:53},{n:'Cadre révolutionnaire',xp:620,rep:80,pow:65}]},
Gouvernement:{label:'Gouvernement Mondial',salary:5200,specs:['Administration','Renseignement','Cipher Pol'],ranks:[
 {n:'Agent junior',xp:0,rep:-100,pow:0},{n:'Agent',xp:36,rep:8,pow:16},{n:'Agent senior',xp:105,rep:24,pow:26},{n:'Inspecteur',xp:210,rep:42,pow:36},{n:'Directeur',xp:390,rep:65,pow:48}]}
};
var CP_RANKS=[
 {n:'Agent junior',xp:0,rep:-100,pow:0},{n:'Agent',xp:36,rep:8,pow:16},{n:'Stagiaire Cipher Pol',xp:105,rep:25,pow:28},
 {n:'CP7',xp:230,rep:45,pow:40},{n:'CP9',xp:430,rep:68,pow:56},{n:'Candidat CP0',xp:720,rep:88,pow:70}
];
var MISSIONS={
Civil:[
 {title:'Livraison côtière',danger:16,reward:6500,xp:10,tier:0},{title:'Escorte commerciale',danger:28,reward:12000,xp:16,tier:1},
 {title:'Ouvrir une route commerciale',danger:32,reward:19000,xp:23,tier:2,spec:'Marchand'},{title:'Soigner un équipage blessé',danger:20,reward:15000,xp:22,tier:1,spec:'Médecin'},
 {title:'Cartographier une route dangereuse',danger:35,reward:18000,xp:24,tier:2,spec:'Navigateur'},{title:'Étudier un phénomène rare',danger:30,reward:17000,xp:24,tier:2,spec:'Scientifique'}],
Marine:[
 {title:'Patrouille portuaire',danger:20,reward:9000,xp:12,tier:0},{title:'Escorte navale',danger:31,reward:14000,xp:18,tier:1},
 {title:'Démanteler des contrebandiers',danger:39,reward:19000,xp:25,tier:2},{title:'Intercepter un équipage pirate',danger:52,reward:29000,xp:34,tier:3},
 {title:'Sécuriser un royaume allié',danger:64,reward:42000,xp:46,tier:5},{title:'Opération de renseignement',danger:37,reward:21000,xp:28,tier:2,spec:'Renseignement'}],
Pirates:[
 {title:'Chasse au trésor',danger:25,reward:15000,xp:13,tier:0},{title:'Piller un convoi',danger:40,reward:24000,xp:21,tier:1},
 {title:'Affronter un équipage rival',danger:53,reward:36000,xp:31,tier:2},{title:'Raid contre une base Marine',danger:68,reward:54000,xp:45,tier:4},
 {title:'Prendre le contrôle d’une route',danger:77,reward:72000,xp:56,tier:5},{title:'Voler des cartes marines',danger:43,reward:30000,xp:29,tier:2,spec:'Navigateur'}],
'Chasseur de primes':[
 {title:'Traquer un hors-la-loi',danger:31,reward:18000,xp:15,tier:0},{title:'Capturer un capitaine',danger:48,reward:32000,xp:27,tier:2},
 {title:'Contrat sur une cible dangereuse',danger:62,reward:52000,xp:41,tier:3},{title:'Traque longue distance',danger:45,reward:36000,xp:31,tier:2,spec:'Traqueur'}],
Révolutionnaires:[
 {title:'Acheminer des renseignements',danger:28,reward:2000,xp:15,tier:0},{title:'Évacuer des civils',danger:35,reward:3000,xp:22,tier:1},
 {title:'Saboter une installation',danger:55,reward:5000,xp:34,tier:2},{title:'Libérer une cellule capturée',danger:67,reward:7000,xp:46,tier:4},
 {title:'Infiltrer un poste gouvernemental',danger:49,reward:4000,xp:33,tier:2,spec:'Infiltration'}],
Gouvernement:[
 {title:'Surveillance discrète',danger:24,reward:10000,xp:13,tier:0},{title:'Sécuriser un dignitaire',danger:34,reward:16000,xp:20,tier:1},
 {title:'Récupérer des renseignements sensibles',danger:45,reward:25000,xp:29,tier:2},{title:'Opération classifiée',danger:59,reward:39000,xp:40,tier:3},
 {title:'Mission Cipher Pol',danger:68,reward:48000,xp:49,tier:3,spec:'Cipher Pol'}]
};

var TECH={
'Équilibré':[{id:'garde',name:'Garde adaptative',req:12,skill:'Combat',bonus:3},{id:'contre',name:'Contre opportuniste',req:30,skill:'Combat',bonus:5},{id:'enchaînement',name:'Enchaînement complet',req:55,skill:'Combat',bonus:8}],
'Corps-à-corps':[{id:'impact',name:'Impact direct',req:12,skill:'Combat',bonus:4},{id:'rafale',name:'Rafale rapprochée',req:32,skill:'Combat',bonus:6},{id:'briseur',name:'Briseur de garde',req:58,skill:'Combat',bonus:9}],
'Sabreur':[{id:'coupe',name:'Coupe précise',req:12,skill:'Sabre',bonus:4},{id:'iai',name:'Iai rapide',req:34,skill:'Sabre',bonus:7},{id:'lame-distance',name:'Lame à distance',req:62,skill:'Sabre',bonus:10}],
'Tireur':[{id:'tir-vise',name:'Tir visé',req:12,skill:'Tir',bonus:4},{id:'tir-mobile',name:'Tir en mouvement',req:34,skill:'Tir',bonus:7},{id:'tir-longue',name:'Tir longue portée',req:62,skill:'Tir',bonus:10}],
'Mobile / esquive':[{id:'pas-lateral',name:'Pas latéral',req:12,skill:'Combat',bonus:4},{id:'feinte',name:'Feinte éclair',req:34,skill:'Combat',bonus:7},{id:'angle-mort',name:'Angle mort',req:62,skill:'Combat',bonus:10}]
};
var MATCH={'Corps-à-corps':{'Tireur':6},'Tireur':{'Sabreur':5},'Sabreur':{'Équilibré':4},'Mobile / esquive':{'Sabreur':5},'Équilibré':{'Mobile / esquive':3}};
var HAKI_APPS={
Observation:[[1,'Présence'],[25,'Perception étendue'],[55,'Anticipation'],[80,'Vision du futur naissante']],
Armement:[[1,'Renforcement'],[25,'Revêtement'],[55,'Projection'],[80,'Destruction interne']],
Conquérant:[[1,'Intimidation'],[35,'Décharge ciblée'],[70,'Infusion du Conquérant']]
};
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function cl(n,a,b){return Math.max(a,Math.min(b,n))}
function H(s){var x=2166136261>>>0;String(s).split('').forEach(function(c){x=Math.imul(x^c.charCodeAt(0),16777619)});return x>>>0}
function R(k){k=k||'m';var c=game?(game.rng[k]||0):0,s=(game?game.seed:1)^H(k+':'+c);if(game)game.rng[k]=c+1;var t=s+0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function pk(a,k){return a[Math.floor(R(k)*a.length)]}
function inf(n){var p=PL[n||game.player.island]||[game.player.region,10,[]];return{region:p[0],danger:p[1],routes:p[2]}}
function age(){var m=game.player.ageMonths,y=Math.floor(m/12),o=Math.floor(m%12);return y?(y+' an'+(y>1?'s':'')+(o?' et '+o+' mois':'')):(o+' mois')}
function key(){return P+slot}
function save(){if(game){localStorage.setItem(key(),JSON.stringify(game));saveMeta()}}
function migrate(g){
 if(!g)return null;var p=g.player||{},w=g.world||{};
 g.version=12;g.lastCombat=g.lastCombat||null;g.rng=g.rng||{};
 p.techniques=p.techniques||[];p.techniqueMastery=p.techniqueMastery||{};p.fruitMastery=p.fruitMastery||0;p.fruitAwakened=!!p.fruitAwakened;p.heldFruit=p.heldFruit||null;p.combatXP=p.combatXP||0;p.hakiApplications=p.hakiApplications||{Observation:[],Armement:[],Conquérant:[]};
 p.haki=p.haki||{Observation:0,Armement:0,Conquérant:0};p.latent=p.latent||{Observation:40,Armement:40,Conquérant:0};p.conditions=p.conditions||[];
 p.life=p.life||defaultLife();p.life.assets=p.life.assets||{property:0,business:0,ship:0,treasure:0};p.children=p.children||[];p.children=p.children.map(function(c,i){c.id=c.id||('child-'+i+'-'+H(String(g.seed)+':child:'+i));c.name=c.name||PEOPLE_NAMES[H(String(g.seed)+':childname:'+i)%PEOPLE_NAMES.length];c.ageMonths=c.ageMonths||0;c.birthplace=c.birthplace||p.island||'';c.birthRegion=c.birthRegion||p.region||p.origin;c.race=c.race||p.race||'Humain';c.status=c.status||'active';return c});
 g.codex=g.codex||{people:[],places:[],factions:['Civil'],fruits:[]};['people','places','factions','fruits','events','techniques'].forEach(function(k){g.codex[k]=g.codex[k]||[]});g.relations=(g.relations||[]).map(function(r,i){return normalizeRelation(g,r,i)});g.socialSeq=g.socialSeq||g.relations.length;g.achievements=g.achievements||{unlocked:{}};g.achievements.unlocked=g.achievements.unlocked||{};g.dynasty=g.dynasty||{generation:1,ancestors:[]};
 p.factionRep=p.factionRep||{Civil:10,Marine:0,Pirates:0,'Chasseur de primes':0,Révolutionnaires:0,Gouvernement:0};
 FACTION_KEYS.forEach(function(k){if(p.factionRep[k]==null)p.factionRep[k]=0});
 p.careerRecords=p.careerRecords||{};p.specialization=p.specialization||null;p.careerHistory=p.careerHistory||[];p.salaryTotal=p.salaryTotal||0;p.deserterFrom=p.deserterFrom||[];migrateOrganization(g,p);migrateJustice(p);
 if(p.career&&p.career!=='Aucune'&&!p.careerRecords[p.faction])p.careerRecords[p.faction]={xp:p.careerXP||0,months:p.serviceMonths||0,rank:p.rank||firstRank(p.faction),specialization:p.specialization||null,successes:0,failures:0};
 if(p.careerRecords[p.faction]){p.rank=p.careerRecords[p.faction].rank||p.rank;p.specialization=p.careerRecords[p.faction].specialization||p.specialization}
 w.fruits=w.fruits||['Mera Mera no Mi','Ope Ope no Mi','Hie Hie no Mi','Moku Moku no Mi'];w.fruitRegistry=w.fruitRegistry||{};
 w.fruits.forEach(function(n){if(!w.fruitRegistry[n])w.fruitRegistry[n]={status:p.fruit===n?'consumed':'available',holder:p.fruit===n?p.name:null}});
 w=initLivingWorld(g,w);g.player=p;g.world=w;return g
}
function load(i){try{return migrate(JSON.parse(localStorage.getItem(P+i)||'null'))}catch(x){return null}}
function tl(t,d,y){game.timeline.unshift({age:age(),title:t,desc:d,type:y||''});game.timeline=game.timeline.slice(0,100)}
function news(t,d,type){game.news.unshift({title:t,desc:d,type:type||''});game.news=game.news.slice(0,35)}
function press(){var o={};REG.forEach(function(r){o[r]={Piraterie:20+R('w')*25,Marine:30+R('w')*35,Criminalité:15+R('w')*30,Révolution:5+R('w')*20,Prospérité:40+R('w')*35,Instabilité:10+R('w')*25}});return o}
function make(){
 var seed=Number($('#seedInput').value)||Math.floor(Math.random()*2147483647),origin=mode==='custom'?$('#originInput').value:pk(ORIG,'b');
 game={version:12,seed:seed,rng:{},alive:true,pending:null,mission:null,timeline:[],news:[],relations:[],codex:{people:[],places:[],factions:['Civil'],fruits:[],events:[],techniques:[]},world:{year:0,month:0,divergence:0,pressures:{},factions:{Marine:82,Pirates:79,Révolutionnaires:56,Gouvernement:94},canon:[['Exécution de Gol D. Roger',0,'completed',100],['Nouvelle génération',18,'future',75],['Guerre au sommet',22,'future',95]],fruits:['Mera Mera no Mi','Ope Ope no Mi','Hie Hie no Mi','Moku Moku no Mi']},player:{name:$('#nameInput').value.trim()||'Kael Maren',difficulty:$('#difficultyInput').value,ageMonths:0,race:mode==='custom'?$('#raceInput').value:pk(['Humain','Humain','Humain','Mink','Homme-poisson'],'b'),origin:origin,region:origin,island:'',situation:'Enfance',activity:'Grandir',faction:'Civil',career:'Aucune',rank:'Enfant',money:3000,health:100,energy:100,danger:'Faible',conditions:[],bounty:0,highestBounty:0,reputation:0,ambition:'Survivre',wins:0,losses:0,travel:null,visited:[],style:mode==='custom'?$('#styleInput').value:pk(['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],'b'),fruit:null,heldFruit:null,fruitMastery:0,fruitAwakened:false,techniques:[],techniqueMastery:{},combatXP:0,hakiApplications:{Observation:[],Armement:[],Conquérant:[]},haki:{Observation:0,Armement:0,Conquérant:0},latent:{Observation:20+R('h')*60,Armement:20+R('h')*60,Conquérant:R('h')<.04?90:0},stats:{},skills:{},caps:{}}};
 game=applyMeta(migrate(game));syncCanonicalFruits();var homes=Object.keys(PL).filter(function(n){return PL[n][0]===origin});game.player.island=pk(homes,'b');game.player.visited=[game.player.island];game.codex.places=[game.player.island];game.world.pressures=press();
 ST.forEach(function(k){game.player.stats[k]=8+R('b')*12;game.player.caps[k]=68+R('c')*25});SK.forEach(function(k){game.player.skills[k]=2+R('b')*8;game.player.caps[k]=68+R('c')*25});
 syncPowers();tl('Naissance','Tu nais à '+game.player.island+', dans '+origin+'.','major');news('Grande Ère de la Piraterie','Le monde entre dans une période de bouleversements.');save();return game}
function diff(){return game.player.difficulty==='Casual'?[1.2,.75]:game.player.difficulty==='Ironman'?[.9,1.55]:[1,1]}
function allTechniqueDefs(){return[].concat.apply([],Object.keys(TECH).map(function(k){return TECH[k]})).concat(SPECIAL_TECHNIQUES)}function techniqueBonus(){var p=game.player,b=0,all=allTechniqueDefs();(p.techniques||[]).forEach(function(id){var t=all.find(function(x){return x.id===id});if(t)b+=t.bonus||0});return b}
function power(){var p=game.player,a=ST.reduce(function(s,k){return s+p.stats[k]},0)/ST.length,b=SK.reduce(function(s,k){return s+p.skills[k]},0)/SK.length,h=p.haki.Observation*.18+p.haki.Armement*.22+p.haki.Conquérant*.27,f=p.fruit?(8+p.fruitMastery*.18+(p.fruitAwakened?12:0)):0;return a*.42+b*.38+h+f+techniqueBonus()*.45}
function powerRank(){var v=power();return v<20?'Novice':v<35?'Combattant':v<50?'Confirmé':v<65?'Élite':v<80?'Monstrueux':'Sommet'}
function unlockTechnique(t,label){var p=game.player;if(p.techniques.indexOf(t.id)>=0)return;p.techniques.push(t.id);p.techniqueMastery[t.id]=1;if(game.codex&&game.codex.techniques&&game.codex.techniques.indexOf(t.name)<0)game.codex.techniques.push(t.name);tl(label||'Nouvelle technique',t.name+' entre dans ton répertoire.','major')}
function syncPowers(){var p=game.player,prof=TECH[p.style]||TECH['Équilibré'];prof.forEach(function(t){if((p.skills[t.skill]||0)>=t.req)unlockTechnique(t)});SPECIAL_TECHNIQUES.forEach(function(t){if(specialRequirementMet(t,p))unlockTechnique(t,'Technique spéciale')});Object.keys(HAKI_APPS).forEach(function(k){p.hakiApplications[k]=HAKI_APPS[k].filter(function(a){return p.haki[k]>=a[0]}).map(function(a){return a[1]})})}
function trainHaki(k,m){var p=game.player;if(!p.haki[k]){if(p.latent[k]>55&&R('h')<.025*m*(p.latent[k]/70)){p.haki[k]=1;tl('Éveil du Haki','Ton Haki de '+k+' s’éveille.','major')}return}p.haki[k]=cl(p.haki[k]+m*(.35+p.latent[k]/160)*cl(1-p.haki[k]/125,.12,1),0,100)}
function trainFruit(m){var p=game.player;if(!p.fruit)return;p.fruitMastery=cl(p.fruitMastery+m*(.55+R('fruit')*.45)*cl(1-p.fruitMastery/120,.15,1),0,100);if(p.fruitMastery>=85&&!p.fruitAwakened&&R('fruit')<.015*m){p.fruitAwakened=true;tl('ÉVEIL DU FRUIT','Ta maîtrise franchit un seuil extraordinaire.','major')}}
function learnMastery(m){var p=game.player;(p.techniques||[]).forEach(function(id){p.techniqueMastery[id]=cl((p.techniqueMastery[id]||1)+m*(.4+R('p')*.5),0,100)});syncPowers()}
function gain(k,n){var p=game.player,b=p.stats[k]!=null?p.stats:p.skills,z=b[k],cap=p.caps[k]||90;if(z>=cap)return 0;var g=n*diff()[0]*cl(1-Math.pow(z/110,1.7),.12,1);b[k]=cl(z+g,0,cap);return g}
function train(m){var p=game.player;if(p.activity==='Haki Observation'){trainHaki('Observation',m);learnMastery(m);return}if(p.activity==='Haki Armement'){trainHaki('Armement',m);learnMastery(m);return}if(p.activity==='Haki Conquérant'){trainHaki('Conquérant',m);learnMastery(m);return}if(p.activity==='Maîtrise du Fruit'){trainFruit(m);learnMastery(m);return}var map={Grandir:['Endurance','Réflexes'],Études:['Discipline','Science'],Entraînement:['Force','Combat'],Navigation:['Navigation','Endurance'],Sabre:['Sabre','Réflexes'],'Formation Marine':['Discipline','Combat'],'Formation Pirates':['Combat','Navigation'],'Formation Révolutionnaires':['Discrétion','Commandement'],'Formation Gouvernement':['Discipline','Discrétion'],Médecine:['Médecine','Discipline'],Explorer:['Réflexes','Navigation']},ks=map[p.activity]||[pk(ST,'p'),pk(SK,'p')];ks.forEach(function(k){gain(k,m*(.5+R('p')*.8))});if(p.fruit&&R('fruit')<.5)trainFruit(m*.35);if(p.haki.Observation&&R('h')<.35)trainHaki('Observation',m*.25);if(p.haki.Armement&&R('h')<.35)trainHaki('Armement',m*.25);learnMastery(m)}

function relationById(id){return game.relations.find(function(r){return r.id===id})||null}
function partnerRelation(){var id=game.player.life.partnerId;return id?relationById(id):null}
function createRelation(role){
 var p=game.player,i=game.socialSeq++,name=pk(PEOPLE_NAMES,'r'),tries=0;
 while(game.relations.some(function(r){return r.name===name})&&tries++<12)name=pk(PEOPLE_NAMES,'r');
 var r=normalizeRelation(game,{id:'rel-'+i+'-'+Math.floor(R('r')*99999),name:name,role:role||pk(['ami','rival','mentor','collègue','connaissance'],'r'),faction:pk([p.faction,'Civil','Marine','Pirates'],'r'),location:p.island,monthsKnown:0},i);
 if(r.role==='rival'){r.rivalry=45+R('r')*35;r.affection*=.7}
 if(r.role==='mentor'){r.respect=Math.max(r.respect,62);r.trust=Math.max(r.trust,50)}
 game.relations.push(r);return r
}
function netWorth(){
 var p=game.player,a=p.life.assets||{};return Math.round(p.money+(a.property||0)+(a.business||0)+(a.ship||0)+(a.treasure||0))
}
function livingCostPerMonth(){
 var p=game.player;if(p.ageMonths<180)return 0;var h=HOUSING[p.life.housingLevel||0]||HOUSING[0],base=h.monthly+(p.children||[]).length*850;
 if(p.life.relationshipStatus!=='Célibataire')base+=350;return Math.round(base)
}
function businessIncomePerMonth(){return Math.round(((game.player.life.assets||{}).business||0)*.008)}
function useSocialAction(){
 var l=game.player.life;if((l.socialActions||0)<1){toast('Tu as déjà consacré assez de temps à ta vie sociale pendant cette période.');return false}
 l.socialActions--;return true
}
function spendTime(id){
 var r=relationById(id),p=game.player;if(!r||r.status!=='active'||!useSocialAction())return;
 var cost=p.ageMonths>=180?300+Math.round(R('life')*700):0;if(p.money<cost)return toast('Tu n’as pas assez de Berry pour cette sortie.');
 p.money-=cost;r.affection=cl(r.affection+2+R('life')*5,0,100);r.trust=cl(r.trust+1+R('life')*4,0,100);r.respect=cl(r.respect+R('life')*2,0,100);if(p.ageMonths>=216)r.attraction=cl(r.attraction+R('life')*3,0,100);
 tl('Temps partagé','Tu passes du temps avec '+r.name+'.');save();renderRel();renderChar()
}
function pursueRomance(id){
 var p=game.player,r=relationById(id);if(!r||p.ageMonths<216)return toast('La romance est réservée aux personnages adultes.');if(p.life.partnerId)return toast('Tu es déjà engagé dans une relation.');if(!useSocialAction())return;
 var score=r.affection*.35+r.trust*.25+r.attraction*.4,ch=cl((score-32)/70,.08,.92);
 if(R('life')<ch){p.life.partnerId=r.id;p.life.relationshipStatus='En couple';r.type='partner';r.role='partenaire';r.relationshipMonths=0;r.affection=cl(r.affection+8,0,100);r.trust=cl(r.trust+6,0,100);tl('Nouvelle relation',r.name+' et toi commencez une relation.','major')}
 else{r.attraction=cl(r.attraction-6,0,100);r.trust=cl(r.trust-2,0,100);tl('Sentiments non partagés',r.name+' ne souhaite pas aller plus loin.')}
 save();render()
}
function marryPartner(){
 var p=game.player,r=partnerRelation();if(!r||p.life.relationshipStatus!=='En couple')return toast('Aucun partenaire avec qui se marier.');if(r.relationshipMonths<12||r.trust<62||r.affection<65)return toast('Votre relation n’est pas encore assez solide.');
 if(!useSocialAction())return;p.life.relationshipStatus='Marié';r.role='conjoint';r.loyalty=cl(r.loyalty+10,0,100);r.trust=cl(r.trust+7,0,100);tl('Mariage','Tu épouses '+r.name+'.','major');checkAchievements();save();render()
}
function breakup(){
 var p=game.player,r=partnerRelation();if(!r)return;decision('Mettre fin à la relation','Rompre avec '+r.name+' aura des conséquences sur votre relation.',[
  ['Se séparer','Mettre fin au couple.',function(){r.role='ex-partenaire';r.type='social';r.affection=cl(r.affection-22,0,100);r.trust=cl(r.trust-30,0,100);r.rivalry=cl(r.rivalry+8,0,100);p.life.partnerId=null;p.life.relationshipStatus='Célibataire';tl('Séparation','Ta relation avec '+r.name+' prend fin.','major')}],
  ['Rester ensemble','Ne rien changer.',function(){}]
 ])}
function welcomeChild(){
 var p=game.player,r=partnerRelation();if(!r||p.ageMonths<216)return toast('Il faut être adulte et en couple.');if(r.trust<50||r.affection<55)return toast('Votre relation n’est pas assez stable.');if((p.children||[]).length>=5)return toast('Ta famille est déjà très nombreuse.');if(!useSocialAction())return;
 var i=p.children.length,name=pk(PEOPLE_NAMES,'family'),child={id:'child-'+game.dynasty.generation+'-'+Math.floor(R('family')*999999)+'-'+i,name:name,ageMonths:0,birthplace:p.island,birthRegion:p.region,race:p.race,status:'active',bond:55+R('family')*30};
 p.children.push(child);p.money-=Math.min(p.money,2500);tl('Nouvelle génération',name+' rejoint ta famille à '+p.island+'.','major');checkAchievements();save();render()
}
function upgradeHousing(){
 var p=game.player;if(p.ageMonths<216)return toast('Tu dois être adulte pour acheter un logement.');var l=p.life,n=(l.housingLevel||0)+1;if(n>=HOUSING.length)return toast('Tu possèdes déjà le meilleur logement disponible.');var h=HOUSING[n];if(p.money<h.buy)return toast('Il te faut '+h.buy.toLocaleString('fr-FR')+' B.');
 p.money-=h.buy;l.housingLevel=n;l.assets.property=Math.max(l.assets.property||0,h.asset);tl('Nouveau logement','Tu t’installes dans : '+h.name+'.','major');save();renderChar()
}
function investBusiness(){
 var p=game.player;if(p.ageMonths<216)return toast('Tu dois être adulte pour investir.');var l=p.life,cost=50000;if(p.money<cost)return toast('Il te faut 50 000 B pour investir.');if((l.assets.business||0)>=240000)return toast('Ton activité commerciale est déjà très développée.');
 p.money-=cost;l.assets.business=(l.assets.business||0)+40000;tl('Investissement','Tu investis dans une activité commerciale locale.','major');save();renderChar()
}
function achievementCondition(id){
 var p=game.player,w=game.world,nw=netWorth();
 if(id==='voyage')return p.visited.length>=2;if(id==='grandline')return p.visited.some(function(x){return infStatic(x).region==='Grand Line'});
 if(id==='newworld')return p.visited.some(function(x){return infStatic(x).region==='New World'});if(id==='haki')return Object.keys(p.haki).some(function(k){return p.haki[k]>0});
 if(id==='fruit')return !!p.fruit;if(id==='family')return p.children.length>0;if(id==='marriage')return p.life.relationshipStatus==='Marié';if(id==='wealth')return nw>=1000000;
 if(id==='veteran')return p.wins>=20;if(id==='bounty')return p.highestBounty>=100000000;if(id==='social')return game.relations.length>=8;
 if(id==='divergence')return w.divergence>=10;if(id==='longevity')return p.ageMonths>=720;if(id==='legacy')return game.dynasty.generation>=2;if(id==='commander')return p.organization&&p.organization.authority==='leader'&&p.organization.members.filter(function(m){return m.status==='active'}).length>=6;if(id==='flagship')return p.organization&&p.organization.ship&&(p.organization.ship.tier||0)>=2;return false
}
function checkAchievements(silent){
 var u=game.achievements.unlocked;ACHIEVEMENTS.forEach(function(a){if(!u[a.id]&&achievementCondition(a.id)){u[a.id]={age:age(),generation:game.dynasty.generation};if(!silent)tl('Achievement : '+a.name,a.desc,'major')}});saveMeta()
}
function lifeTick(m){
 var p=game.player,l=p.life;l.socialActions=2;
 (p.children||[]).forEach(function(c){if(c.status==='active'){c.ageMonths+=m;c.bond=cl((c.bond||60)+(R('family')-.48)*m*.45,0,100)}});
 game.relations.forEach(function(r){if(r.status!=='active')return;r.monthsKnown+=m;if(r.id===l.partnerId){r.relationshipMonths+=m;r.affection=cl(r.affection+(R('life')-.42)*m*.9,0,100);r.trust=cl(r.trust+(R('life')-.44)*m*.7,0,100);r.loyalty=cl(r.loyalty+(R('life')-.45)*m*.5,0,100)}else{var near=!r.location||r.location===p.island;r.affection=cl(r.affection+(near?(R('life')-.49)*m*.35:-m*.08),0,100);r.trust=cl(r.trust+(R('life')-.5)*m*.2,0,100)}});
 if(p.ageMonths>=180){var cost=livingCostPerMonth()*m,income=businessIncomePerMonth()*m;p.money+=income-cost;l.livingCostsPaid+=cost;l.totalBusinessIncome+=income;l.lastExpense=cost;if(p.money<0){l.debtPeak=Math.min(l.debtPeak||0,p.money);p.energy=cl(p.energy-m*.7,0,100)}}
 var nw=netWorth();l.netWorthPeak=Math.max(l.netWorthPeak||0,nw);
 var partner=partnerRelation();if(partner&&R('life')<.018*m){if(R('life')<.66){partner.affection=cl(partner.affection+4,0,100);partner.trust=cl(partner.trust+3,0,100);tl('Moment important','Ta relation avec '+partner.name+' se renforce.')}else{partner.affection=cl(partner.affection-6,0,100);partner.trust=cl(partner.trust-5,0,100);tl('Tension dans le couple','Un désaccord fragilise ta relation avec '+partner.name+'.')}}if(partner&&partner.affection<12&&partner.trust<12){partner.role='ex-partenaire';partner.type='social';l.partnerId=null;l.relationshipStatus='Célibataire';tl('Rupture',partner.name+' met fin à votre relation après une longue dégradation.','major')}
 var years=p.ageMonths/12;if(years>55){p.health=cl(p.health-m*(years-55)/70,0,100);if(years>72&&R('life')<Math.pow((years-70)/35,2)*.006*m){die('Décès naturel à '+Math.floor(years)+' ans.');return}}
 checkAchievements()
}
function estateValue(){return Math.max(0,netWorth())}
function buildHeir(child){
 var old=game.player,partner=partnerRelation(),estate=estateValue(),heirs=Math.max(1,old.children.length+(partner?1:0)),share=Math.round(estate/heirs),ancestor={name:old.name,age:age(),career:old.career,rank:old.rank,cause:game.death?game.death.cause:'',estate:estate,bounty:old.highestBounty,generation:game.dynasty.generation};
 game.dynasty.ancestors.push(ancestor);game.dynasty.generation++;
 var parentCaps=old.caps||{},p={name:child.name,difficulty:old.difficulty,ageMonths:child.ageMonths,race:child.race||old.race,origin:child.birthRegion||old.origin,region:old.region,island:old.island,situation:child.ageMonths<180?'Enfance':'Nouvelle génération',activity:child.ageMonths<72?'Grandir':'Études',faction:'Civil',career:'Aucune',rank:child.ageMonths<180?'Enfant':'Sans carrière',money:share,health:100,energy:100,danger:'Faible',conditions:[],bounty:0,highestBounty:0,reputation:Math.round(old.reputation*.12),ambition:'Survivre',wins:0,losses:0,travel:null,visited:[old.island],style:pk(['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],'heir'),fruit:null,heldFruit:null,fruitMastery:0,fruitAwakened:false,techniques:[],techniqueMastery:{},combatXP:0,hakiApplications:{Observation:[],Armement:[],Conquérant:[]},haki:{Observation:0,Armement:0,Conquérant:0},latent:{Observation:20+R('heir')*60,Armement:20+R('heir')*60,Conquérant:R('heir')<.04?90:0},stats:{},skills:{},caps:{},factionRep:{Civil:10,Marine:0,Pirates:0,'Chasseur de primes':0,Révolutionnaires:0,Gouvernement:0},careerRecords:{},specialization:null,careerHistory:[],salaryTotal:0,deserterFrom:[],organization:null,organizationHistory:[],justice:defaultJustice(),life:defaultLife(),children:[]};
 ST.forEach(function(k){var inherited=parentCaps[k]||75;p.caps[k]=cl(inherited*.55+40+R('heir')*15,55,98);p.stats[k]=cl(7+Math.min(25,child.ageMonths/24)+R('heir')*5,5,p.caps[k])});
 SK.forEach(function(k){var inherited=parentCaps[k]||75;p.caps[k]=cl(inherited*.5+42+R('heir')*14,55,98);p.skills[k]=cl(2+Math.min(18,child.ageMonths/36)+R('heir')*4,1,p.caps[k])});
 game.player=p;game.alive=true;game.death=null;game.pending=null;game.mission=null;game.lastCombat=null;game.timeline=[];game.relations=[];
 if(partner)game.relations.push(normalizeRelation(game,{name:partner.name,role:'parent',type:'family',affection:Math.max(65,partner.affection),trust:Math.max(60,partner.trust),respect:65,loyalty:70,attraction:0,location:old.island,faction:partner.faction},0));
 old.children.filter(function(c){return c.id!==child.id}).forEach(function(c,i){game.relations.push(normalizeRelation(game,{name:c.name,role:'frère / sœur',type:'family',affection:55+(c.bond||0)*.3,trust:55,respect:45,loyalty:60,attraction:0,location:old.island,faction:'Civil'},i+1))});
 game.socialSeq=game.relations.length;syncPowers();tl('HÉRITAGE','Après la mort de '+old.name+', tu poursuis la vie de la famille en tant que '+child.name+'. Patrimoine reçu : '+share.toLocaleString('fr-FR')+' B.','major');checkAchievements();save();return game
}
function continueWithHeir(){var kids=(game.player.children||[]).filter(function(c){return c.status==='active'}).sort(function(a,b){return b.ageMonths-a.ageMonths});if(!kids.length)return toast('Aucun héritier disponible.');var c=kids[0];buildHeir(c);$('#deathModal').classList.add('hidden');render()}

function decision(t,txt,ch){game.pending={title:t,text:txt,choices:ch};save();render();showDecision()}
function showDecision(){if(!game.pending)return;$('#decisionTitle').textContent=game.pending.title;$('#decisionText').textContent=game.pending.text;$('#decisionChoices').innerHTML=game.pending.choices.map(function(c,i){return '<button class="choice-btn" data-c="'+i+'"><strong>'+e(c[0])+'</strong><small>'+e(c[1])+'</small></button>'}).join('');$$('[data-c]').forEach(function(b){b.onclick=function(){var c=game.pending.choices[+b.dataset.c];c[2]();game.pending=null;$('#decisionModal').classList.add('hidden');save();render()}});$('#decisionModal').classList.remove('hidden')}

var ORG_CONFIG={
 Civil:{kind:'Réseau professionnel',roles:['Associé','Médecin','Navigateur','Scientifique','Artisan','Cuisinier']},
 Marine:{kind:'Unité Marine',roles:['Combattant','Navigateur','Tireur','Médecin','Renseignement','Logistique']},
 Pirates:{kind:'Équipage pirate',roles:['Combattant','Navigateur','Tireur','Médecin','Cuisinier','Charpentier','Musicien','Quartier-maître']},
 'Chasseur de primes':{kind:'Groupe de chasse',roles:['Traqueur','Duelliste','Tireur','Investigateur','Médecin']},
 Révolutionnaires:{kind:'Cellule révolutionnaire',roles:['Combattant','Infiltration','Renseignement','Logistique','Médecin']},
 Gouvernement:{kind:'Équipe gouvernementale',roles:['Agent','Combat','Renseignement','Médecin','Logistique','Cipher Pol']}
};
var ORG_PREFIX=['Aube','Tempête','Sillage','Corail','Foudre','Brume','Étoile','Fer','Écume','Cendre','Horizon','Marée'];
var ORG_SUFFIX={Civil:['Atelier','Compagnie','Maison','Collectif'],Marine:['Escadre','Unité','Section','Détachement'],Pirates:['Corsaires','Drakes','Ravens','Mantas','Loups','Serpents'],'Chasseur de primes':['Traqueurs','Lames','Veilleurs','Chasseurs'],Révolutionnaires:['Flamme','Cellule','Front','Réseau'],Gouvernement:['Bureau','Section','Unité','Groupe']};
var SHIP_TIERS=[
 {name:'Sloop',capacity:4,cost:0,speed:0},
 {name:'Brigantin',capacity:8,cost:50000,speed:.07},
 {name:'Frégate',capacity:14,cost:150000,speed:.13},
 {name:'Galion',capacity:24,cost:400000,speed:.18}
];
function orgHash(g,key){return H(String(g.seed||1)+':org:'+key)}
function organizationAuthority(p){
 if(!p||p.career==='Aucune')return'none';var f=p.faction,i=rankIndex(),r=p.rank||'';
 if(f==='Pirates')return r.indexOf('Capitaine')>=0?'leader':i>=3?'officer':'member';
 if(f==='Marine')return i>=5?'leader':i>=3?'officer':'member';
 if(f==='Révolutionnaires')return i>=3?'leader':i>=2?'officer':'member';
 if(f==='Gouvernement')return i>=3?'leader':i>=2?'officer':'member';
 if(f==='Chasseur de primes')return i>=3?'leader':i>=2?'officer':'member';
 if(f==='Civil')return i>=3?'leader':i>=2?'officer':'member';return'member'
}
function authorityLabel(a){return a==='leader'?'Chef':a==='officer'?'Officier':'Membre'}
function orgKind(f,spec){if(f==='Gouvernement'&&spec==='Cipher Pol')return'Cellule Cipher Pol';return(ORG_CONFIG[f]||ORG_CONFIG.Civil).kind}
function organizationName(g,p,f){
 var h=orgHash(g,(p.name||'player')+':'+f),pre=ORG_PREFIX[h%ORG_PREFIX.length],suf=(ORG_SUFFIX[f]||ORG_SUFFIX.Civil)[(h>>>4)%(ORG_SUFFIX[f]||ORG_SUFFIX.Civil).length];
 if(f==='Marine')return suf+' '+(10+(h%90));
 if(f==='Gouvernement')return(p.specialization==='Cipher Pol'?'Cipher Pol ':'')+suf+' '+(1+(h%9));
 if(f==='Révolutionnaires')return pre+' '+suf;
 return pre+' '+suf
}
function seededOrgMember(g,p,f,i){
 var h=orgHash(g,(p.name||'player')+':'+f+':member:'+i),cfg=ORG_CONFIG[f]||ORG_CONFIG.Civil,name=PEOPLE_NAMES[h%PEOPLE_NAMES.length]+' '+String.fromCharCode(65+((h>>>5)%26))+'.',role=cfg.roles[(h>>>7)%cfg.roles.length],base=18+((h>>>9)%29);
 return{id:'orgm-'+i+'-'+(h%100000),name:name,role:role,power:base,loyalty:42+((h>>>3)%38),morale:48+((h>>>11)%34),months:0,injuryMonths:0,status:'active',origin:p.region||p.origin}
}
function buildOrganizationState(g,p,f){
 var authority='member',idx=0;
 try{var track=careerTrack(f,p.specialization),ri=track.findIndex(function(x){return x.n===p.rank});idx=ri<0?0:ri;if(f==='Pirates')authority=(p.rank||'').indexOf('Capitaine')>=0?'leader':idx>=3?'officer':'member';else authority=idx>=3?'leader':idx>=2?'officer':'member'}catch(_){authority='member'}
 var count=authority==='leader'?3:authority==='officer'?4:5,members=[];for(var i=0;i<count;i++)members.push(seededOrgMember(g,p,f,i));
 if(authority!=='leader'&&members.length){members[0].role=f==='Pirates'?'Capitaine':f==='Marine'?'Commandant':f==='Révolutionnaires'?'Chef de cellule':f==='Gouvernement'?'Superviseur':'Chef d’équipe';members[0].power+=12;members[0].loyalty=70}
 var ship=f==='Pirates'?{name:'Vent Libre',tier:0,condition:82,capacity:SHIP_TIERS[0].capacity}:null;
 return{id:'org-'+(orgHash(g,(p.name||'player')+':'+f)%1000000),faction:f,name:organizationName(g,p,f),kind:orgKind(f,p.specialization),authority:authority,playerRole:authorityLabel(authority),morale:58,cohesion:46,renown:0,treasury:0,supplies:42,members:members,ship:ship,commandActions:1,months:0,missions:0,successes:0,failures:0,history:[]}
}
function migrateOrganization(g,p){
 p.organizationHistory=p.organizationHistory||[];if(!p.organization&&p.career&&p.career!=='Aucune')p.organization=buildOrganizationState(g,p,p.faction);
 if(p.organization){var o=p.organization;o.faction=o.faction||p.faction;o.kind=o.kind||orgKind(o.faction,p.specialization);o.name=o.name||organizationName(g,p,o.faction);o.authority=o.authority||'member';o.playerRole=o.playerRole||authorityLabel(o.authority);o.morale=cl(o.morale==null?58:o.morale,0,100);o.cohesion=cl(o.cohesion==null?46:o.cohesion,0,100);o.renown=o.renown||0;o.treasury=o.treasury||0;o.supplies=o.supplies==null?42:o.supplies;o.commandActions=o.commandActions==null?1:o.commandActions;o.months=o.months||0;o.missions=o.missions||0;o.successes=o.successes||0;o.failures=o.failures||0;o.history=o.history||[];o.members=(o.members||[]).map(function(m,i){m.id=m.id||('orgm-'+i+'-'+orgHash(g,'legacy:'+i));m.role=m.role||'Membre';m.power=cl(m.power==null?25:m.power,1,100);m.loyalty=cl(m.loyalty==null?55:m.loyalty,0,100);m.morale=cl(m.morale==null?55:m.morale,0,100);m.months=m.months||0;m.injuryMonths=m.injuryMonths||0;m.status=m.status||'active';return m});if(o.faction==='Pirates'&&!o.ship)o.ship={name:'Vent Libre',tier:0,condition:82,capacity:4}}
 return p
}
function ensureOrganization(){
 var p=game.player;if(!p.career||p.career==='Aucune')return null;if(!p.organization||p.organization.faction!==p.faction){p.organization=buildOrganizationState(game,p,p.faction);tl('Nouvelle organisation','Tu intègres '+p.organization.name+' ('+p.organization.kind+').','major')}syncOrganizationRole();return p.organization
}
function syncOrganizationRole(){
 var p=game.player,o=p.organization;if(!o)return;var old=o.authority,a=organizationAuthority(p);o.authority=a;o.playerRole=authorityLabel(a);o.kind=orgKind(p.faction,p.specialization);
 if(old!==a&&a==='leader'){var chief=o.members.find(function(m){return ['Capitaine','Commandant','Chef de cellule','Superviseur','Chef d’équipe'].indexOf(m.role)>=0});if(chief){chief.role=p.faction==='Pirates'?'Quartier-maître':'Conseiller';chief.loyalty=cl(chief.loyalty+8,0,100)}o.history.push({age:age(),event:'command'});tl('Prise de commandement','Tu prends la direction de '+o.name+'.','major')}
}
function organizationCapacity(){
 var o=game.player.organization;if(!o)return 0;if(o.faction==='Pirates'&&o.ship)return o.ship.capacity||4;return o.authority==='leader'?12:o.authority==='officer'?8:6
}
function organizationPower(){
 var p=game.player,o=p.organization;if(!o)return 0,ms=o.members.filter(function(m){return m.status==='active'}),avg=ms.length?ms.reduce(function(a,m){return a+m.power},0)/ms.length:0,coverage=new Set(ms.map(function(m){return m.role})).size;
 return cl(avg*.56+(p.skills.Commandement||0)*.18+o.cohesion*.16+coverage*1.4,0,100)
}
function organizationSupport(m){
 var o=game.player.organization;if(!o||!o.members.length)return 0;var base=organizationPower()*.09+o.cohesion*.035+o.morale*.025,authority=o.authority==='leader'?1.25:o.authority==='officer'?1.1:.9;
 if(m&&m.spec&&o.members.some(function(x){return x.role===m.spec}))base+=2.5;return cl(base*authority,0,16)
}
function useOrganizationAction(){
 var o=ensureOrganization();if(!o)return false;if((o.commandActions||0)<1){toast('Tu as déjà utilisé ton action de commandement pour cette période.');return false}o.commandActions--;return true
}
function generateRecruitCandidate(){
 var p=game.player,o=ensureOrganization(),i=(o.members.length+1)+Math.floor(R('org')*999),cfg=ORG_CONFIG[p.faction]||ORG_CONFIG.Civil,role=pk(cfg.roles,'org'),name=pk(PEOPLE_NAMES,'org')+' '+String.fromCharCode(65+Math.floor(R('org')*26))+'.',danger=inf().danger;
 return{id:'orgm-r-'+Math.floor(R('org')*999999),name:name,role:role,power:cl(16+danger*.22+R('org')*24,12,72),loyalty:38+R('org')*42,morale:52+R('org')*30,months:0,injuryMonths:0,status:'active',origin:p.region}
}
function recruitOrganizationMember(){
 var p=game.player,o=ensureOrganization();if(!o)return;if(o.authority==='member')return toast('Ton rang ne te permet pas de recruter.');if(o.members.filter(function(m){return m.status==='active'}).length>=organizationCapacity())return toast('Ton organisation a atteint sa capacité actuelle.');if(!useOrganizationAction())return;
 var candidates=[generateRecruitCandidate(),generateRecruitCandidate(),generateRecruitCandidate()],choices=candidates.map(function(c){var cost=p.faction==='Pirates'||p.faction==='Chasseur de primes'?Math.round(3000+c.power*180):0;return[c.name,c.role+' • puissance '+Math.round(c.power)+(cost?' • '+cost.toLocaleString('fr-FR')+' B':''),function(){if(cost){var available=o.treasury+p.money;if(available<cost){o.commandActions++;return toast('Fonds insuffisants.')}var fromTreasury=Math.min(o.treasury,cost);o.treasury-=fromTreasury;p.money-=cost-fromTreasury}o.members.push(c);o.morale=cl(o.morale+2,0,100);o.cohesion=cl(o.cohesion-2,0,100);var rel=normalizeRelation(game,{name:c.name,role:'membre de '+o.name,type:'organization',affection:40,trust:c.loyalty*.65,respect:45,loyalty:c.loyalty,attraction:15,location:p.island,faction:p.faction},game.socialSeq++);game.relations.push(rel);tl('Recrutement',c.name+' rejoint '+o.name+' comme '+c.role+'.','major')} ]});choices.push(['Annuler','Conserver ton action de commandement.',function(){o.commandActions++}]);decision('Recrutement','Sélectionne un candidat. La qualité dépend de la région, de ta réputation et du contexte.',choices)
}
function trainOrganization(){
 var o=ensureOrganization();if(!o||o.authority==='member')return toast('Ton rang ne te permet pas d’organiser un entraînement collectif.');if(!useOrganizationAction())return;if(o.supplies<3){o.commandActions++;return toast('Pas assez de provisions pour organiser la session.')}o.supplies-=3;o.cohesion=cl(o.cohesion+2+R('org')*4,0,100);o.morale=cl(o.morale+1+R('org')*2,0,100);o.members.forEach(function(m){if(m.status==='active'){m.power=cl(m.power+.3+R('org')*.9,1,100);m.loyalty=cl(m.loyalty+R('org')*1.2,0,100)}});tl('Entraînement collectif','Le groupe travaille ses automatismes et sa cohésion.','major');save();renderChar()
}
function fundOrganization(){
 var p=game.player,o=ensureOrganization(),amount=10000;if(p.money<amount)return toast('Il te faut 10 000 B disponibles.');p.money-=amount;o.treasury+=amount;tl('Caisse commune','Tu verses 10 000 B à '+o.name+'.');save();renderChar()
}
function buyOrganizationSupplies(){
 var p=game.player,o=ensureOrganization(),cost=5000;if(o.treasury+p.money<cost)return toast('Il faut 5 000 B pour le ravitaillement.');var t=Math.min(o.treasury,cost);o.treasury-=t;p.money-=cost-t;o.supplies=cl(o.supplies+24,0,100);o.morale=cl(o.morale+1,0,100);tl('Ravitaillement','Les provisions de '+o.name+' sont renouvelées.');save();renderChar()
}
function supportOrganization(){
 var o=ensureOrganization();if(!o||!useOrganizationAction())return;o.morale=cl(o.morale+2+R('org')*2,0,100);o.cohesion=cl(o.cohesion+1+R('org')*2,0,100);o.members.forEach(function(m){if(m.status==='active')m.loyalty=cl(m.loyalty+.4+R('org')*.8,0,100)});tl('Vie de groupe','Tu consacres du temps à renforcer '+o.name+'.');save();renderChar()
}

function repairOrganizationShip(){
 var p=game.player,o=ensureOrganization();if(!o||!o.ship)return;var missing=100-o.ship.condition;if(missing<5)return toast('Le navire est déjà en bon état.');var cost=Math.round(3000+missing*350);if(o.treasury+p.money<cost)return toast('Réparation : '+cost.toLocaleString('fr-FR')+' B requis.');var t=Math.min(o.treasury,cost);o.treasury-=t;p.money-=cost-t;o.ship.condition=cl(o.ship.condition+35,0,100);tl('Réparations navales',o.ship.name+' est remis en état.','major');save();renderChar()
}
function upgradeOrganizationShip(){
 var p=game.player,o=ensureOrganization();if(!o||!o.ship||o.authority!=='leader')return toast('Seul le capitaine peut engager cette amélioration.');var next=SHIP_TIERS[(o.ship.tier||0)+1];if(!next)return toast('Ton navire est déjà au niveau maximal.');if(o.treasury+p.money<next.cost)return toast('Amélioration : '+next.cost.toLocaleString('fr-FR')+' B requis.');var t=Math.min(o.treasury,next.cost);o.treasury-=t;p.money-=next.cost-t;o.ship.tier++;o.ship.capacity=next.capacity;o.ship.condition=100;o.ship.name=next.name+' '+ORG_PREFIX[Math.floor(R('org')*ORG_PREFIX.length)];tl('Nouveau navire','Ton organisation navigue désormais sur '+o.ship.name+'.','major');save();renderChar()
}
function assignOrganizationRole(id){
 var o=ensureOrganization();if(!o||o.authority==='member')return;var m=o.members.find(function(x){return x.id===id});if(!m)return;var roles=(ORG_CONFIG[o.faction]||ORG_CONFIG.Civil).roles,choices=roles.map(function(role){return[role,'Assigner ce rôle à '+m.name+'.',function(){m.role=role;o.cohesion=cl(o.cohesion+.5,0,100);tl('Répartition des rôles',m.name+' devient '+role+'.')} ]});decision('Rôle de '+m.name,'Une équipe équilibrée améliore le soutien lors des missions.',choices)
}
function dismissOrganizationMember(id){
 var o=ensureOrganization();if(!o||o.authority!=='leader')return;var m=o.members.find(function(x){return x.id===id});if(!m)return;decision('Écarter '+m.name,'Cette décision réduira la cohésion et peut affecter le moral.',[['Confirmer','Faire quitter le groupe à '+m.name+'.',function(){m.status='left';m.loyalty=0;o.cohesion=cl(o.cohesion-5,0,100);o.morale=cl(o.morale-3,0,100);tl('Départ',m.name+' quitte '+o.name+'.','major')}],['Annuler','Ne rien changer.',function(){}]])
}
function archiveOrganization(reason){
 var p=game.player,o=p.organization;if(!o)return;p.organizationHistory=p.organizationHistory||[];p.organizationHistory.push({name:o.name,faction:o.faction,role:o.playerRole,months:o.months,successes:o.successes,reason:reason||'Départ'});p.organization=null
}
function organizationTick(m){
 var p=game.player;if(p.ageMonths<180||p.career==='Aucune')return;var o=ensureOrganization();if(!o)return;o.commandActions=1;o.months+=m;syncOrganizationRole();
 var active=o.members.filter(function(x){return x.status==='active'}),need=active.length*.42*m+(o.faction==='Pirates'?1.1*m:.3*m);o.supplies-=need;if(o.supplies<0){o.morale=cl(o.morale+o.supplies*.8,0,100);o.cohesion=cl(o.cohesion+o.supplies*.35,0,100);o.supplies=0}
 active.forEach(function(mem){mem.months+=m;if(mem.injuryMonths>0){mem.injuryMonths=Math.max(0,mem.injuryMonths-m);return}mem.power=cl(mem.power+(.08+R('org')*.18)*m,1,100);mem.morale=cl(mem.morale+(o.morale-mem.morale)*.04*m+(R('org')-.5)*1.2*m,0,100);mem.loyalty=cl(mem.loyalty+(o.cohesion-50)*.008*m+(R('org')-.49)*.8*m,0,100);if(mem.loyalty<18&&o.morale<25&&R('org')<.035*m){mem.status='left';o.morale=cl(o.morale-4,0,100);o.cohesion=cl(o.cohesion-4,0,100);tl('Désertion interne',mem.name+' quitte '+o.name+' après une longue dégradation du moral.','danger')}})
 if(o.ship){var decay=(p.travel?1.1:.22)*m;o.ship.condition=cl(o.ship.condition-decay,0,100);if(o.ship.condition<25)o.morale=cl(o.morale-.6*m,0,100)}
 var avg=active.length?active.reduce(function(a,x){return a+x.morale},0)/active.length:o.morale;o.morale=cl(o.morale+(avg-o.morale)*.08+(o.supplies>20?.2:-.25)*m,0,100);
 if(o.morale<12&&o.authority==='leader'&&active.length>1&&R('org')<.025*m){var rebel=active.slice().sort(function(a,b){return a.loyalty-b.loyalty})[0];if(rebel){rebel.status='left';var loss=Math.min(o.treasury,Math.round(o.treasury*.15));o.treasury-=loss;tl('Crise de commandement',rebel.name+' quitte le groupe avec '+loss.toLocaleString('fr-FR')+' B de la caisse.','danger')}}
}
function organizationMissionDanger(m){return Math.max(5,m.danger-organizationSupport(m))}
function organizationMissionResult(ok,m,reward){
 var o=ensureOrganization();if(!o)return reward;o.missions++;if(ok)o.successes++;else o.failures++;var share=ok?Math.round(reward*(o.authority==='leader'?.18:o.authority==='officer'?.08:.03)):0;if(share){o.treasury+=share;reward-=share}o.renown=cl(o.renown+(ok?2+(m.tier||0):-.8),0,100);o.morale=cl(o.morale+(ok?2:-4),0,100);o.cohesion=cl(o.cohesion+(ok?1:-2),0,100);if(!ok&&o.members.length&&R('org')<.28){var active=o.members.filter(function(x){return x.status==='active'});if(active.length){var hurt=pk(active,'org');hurt.injuryMonths=1+R('org')*3;hurt.morale=cl(hurt.morale-6,0,100);tl('Blessure dans le groupe',hurt.name+' est blessé pendant la mission.','danger')}}return reward
}


function defaultJustice(){
 var heat={};REG.forEach(function(r){heat[r]=0});
 return{regionalHeat:heat,notoriety:0,crimes:[],detained:false,prison:null,actions:1,captures:0,bountiesClaimed:0,escapes:0,pursuits:0,lastPursuit:null}
}
function migrateJustice(p){
 p.justice=p.justice||defaultJustice();var j=p.justice;j.regionalHeat=j.regionalHeat||{};REG.forEach(function(r){if(j.regionalHeat[r]==null)j.regionalHeat[r]=0});
 j.notoriety=j.notoriety||0;j.crimes=j.crimes||[];j.detained=!!j.detained;j.prison=j.prison||null;j.actions=j.actions==null?1:j.actions;j.captures=j.captures||0;j.bountiesClaimed=j.bountiesClaimed||0;j.escapes=j.escapes||0;j.pursuits=j.pursuits||0;j.lastPursuit=j.lastPursuit||null;return j
}
function currentHeat(){var p=game.player,j=migrateJustice(p);return j.regionalHeat[p.region]||0}
function wantedLevel(){
 var p=game.player,h=currentHeat(),b=p.bounty||0,s=Math.log10(Math.max(1,b+1))*9+h*.42+jNotoriety();
 return b<=0&&h<12?'Aucun avis':s<38?'Surveillé':s<58?'Recherché':s<78?'Priorité Marine':'Menace majeure'
}
function jNotoriety(){return(game&&game.player&&game.player.justice?game.player.justice.notoriety:0)*.16}
function issueBounty(amount,reason){
 var p=game.player;if(amount<=0)return;p.bounty=Math.max(0,Math.round((p.bounty||0)+amount));p.highestBounty=Math.max(p.highestBounty||0,p.bounty);if(reason)news('Nouvel avis de recherche',p.name+' atteint '+p.bounty.toLocaleString('fr-FR')+' B après : '+reason+'.','major')
}
function registerCrime(name,severity,witnessed){
 var p=game.player,j=migrateJustice(p),sev=cl(severity||1,1,6),rp=game.world.pressures[p.region]||{},territory=game.world.territories[p.island],control=territory?territory.controller:'Civil';
 if(witnessed==null){var watch=(rp.Marine||25)+(control==='Marine'||control==='Gouvernement'?20:0)-(p.skills.Discrétion||0)*.35;witnessed=R('justice')<cl(.28+watch/180,.12,.92)}
 j.crimes.unshift({name:name,severity:sev,region:p.region,place:p.island,year:game.world.year,month:Math.floor(game.world.month),witnessed:!!witnessed});j.crimes=j.crimes.slice(0,30);j.notoriety=cl(j.notoriety+sev*(witnessed?2.4:.6),0,100);
 if(witnessed){j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)+8+sev*8,0,100);var official=p.faction==='Marine'||p.faction==='Gouvernement';if(!official){var base=Math.round((2500*Math.pow(sev,2)+inf().danger*650)*(1+j.notoriety/120));if(p.faction==='Pirates'||p.faction==='Révolutionnaires'||control==='Marine'||control==='Gouvernement')issueBounty(base,name)}}
 tl('Incident judiciaire',name+(witnessed?' est attribué à ton personnage.':' n’est pas clairement relié à toi.'),witnessed?'danger':'');return witnessed
}
function justicePressure(){
 var p=game.player,j=migrateJustice(p),rp=game.world.pressures[p.region]||{},t=game.world.territories[p.island],official=t&&(t.controller==='Marine'||t.controller==='Gouvernement'),b=Math.log10(Math.max(1,(p.bounty||0)+1))*8;
 return cl((j.regionalHeat[p.region]||0)*.48+b+(rp.Marine||25)*.16+(official?12:0),0,100)
}
function useJusticeAction(){var j=migrateJustice(game.player);if(j.actions<1){toast('Tu as déjà utilisé ton action de discrétion pour cette période.');return false}j.actions--;return true}
function layLow(){
 var p=game.player,j=migrateJustice(p);if(j.detained)return toast('Difficile de se faire oublier depuis une cellule.');if(!useJusticeAction())return;var cost=Math.min(Math.max(0,p.money),1200),drop=9+R('justice')*13+(p.skills.Discrétion||0)*.08;p.money-=cost;j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)-drop,0,100);gain('Discrétion',.45+R('justice')*.5);tl('Profil bas','Tu te fais discret dans '+p.region+'. Chaleur locale -'+Math.round(drop)+'.');save();renderChar()
}
function arrestPlayer(reason){
 var p=game.player,j=migrateJustice(p);if(j.detained)return;var security=cl(inf().danger*.62+(game.world.pressures[p.region].Marine||30)*.38,18,96),months=Math.max(2,Math.round(2+Math.log10(Math.max(10,p.bounty+10))*1.8+currentHeat()/16+R('justice')*4));
 j.detained=true;j.prison={location:p.island,region:p.region,security:security,remaining:months,original:months,reason:reason||'Arrestation',attempts:0};p.situation='Détenu';p.activity='Détention';p.travel=null;game.mission=null;
 if(p.organization){p.organization.morale=cl(p.organization.morale-7,0,100);p.organization.cohesion=cl(p.organization.cohesion-3,0,100)}
 tl('ARRESTATION',p.name+' est capturé. Peine estimée : '+months+' mois.','danger');news('Arrestation de '+p.name,'Les autorités annoncent la capture du recherché.','major')
}
function releaseFromPrison(){
 var p=game.player,j=migrateJustice(p),pr=j.prison,old=p.bounty||0;j.detained=false;j.prison=null;p.situation=p.career==='Aucune'?'Formation':'Carrière';p.activity=p.career==='Aucune'?'Études':activityForFaction(p.faction);
 j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)*.35,0,100);p.bounty=Math.round(old*(p.faction==='Pirates'||p.faction==='Révolutionnaires'?.82:.35));tl('Libération','Tu sors de détention. Ta prime active est réévaluée à '+p.bounty.toLocaleString('fr-FR')+' B.','major')
}
function prisonTick(m){
 var p=game.player,j=migrateJustice(p),pr=j.prison;if(!j.detained||!pr)return;pr.remaining-=m;p.energy=cl(p.energy+m*1.2,0,100);p.health=cl(p.health+m*.7,0,100);j.actions=1;
 if(R('justice')<.05*m){var d=8+pr.security*.18+R('justice')*12,ok=power()+R('justice')*20>d;if(ok){p.reputation+=1;tl('Vie en détention','Tu traverses une situation tendue en prison sans blessure grave.')}else{p.health=cl(p.health-(3+R('justice')*8),0,100);tl('Incident en détention','Une altercation te blesse légèrement.','danger')}}
 if(pr.remaining<=0)releaseFromPrison()
}
function attemptEscape(){
 var p=game.player,j=migrateJustice(p),pr=j.prison;if(!j.detained||!pr)return toast('Tu n’es pas détenu.');if(!useJusticeAction())return;pr.attempts++;var skill=(p.skills.Discrétion||0)*.28+(p.stats.Agilité||0)*.23+(p.stats.Réflexes||0)*.18+power()*.12,guard=pr.security*.72+R('justice')*32,ch=cl(.18+(skill-guard)/100,.04,.78);
 if(R('justice')<ch){j.detained=false;j.prison=null;j.escapes++;j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)+28,0,100);issueBounty(25000+Math.round(pr.security*1800),'Évasion');p.situation='Cavale';p.activity='Explorer';tl('ÉVASION','Tu t’échappes de '+pr.location+'. Les autorités renforcent immédiatement les recherches.','major')}
 else{var extra=2+Math.ceil(R('justice')*4),damage=Math.round(3+R('justice')*10);pr.remaining+=extra;p.health=cl(p.health-damage,0,100);j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)+8,0,100);tl('Évasion échouée','La tentative échoue. +'+extra+' mois de détention et '+damage+'% de dégâts.','danger')}
 save();render()
}
function pursuitEncounter(){
 var p=game.player,j=migrateJustice(p);if(j.detained||!game.alive)return;var pressure=justicePressure(),d=cl(inf().danger*.45+pressure*.55+12,18,94);j.pursuits++;j.lastPursuit={year:game.world.year,month:Math.floor(game.world.month),region:p.region};
 var ok=fight(d,'Poursuite des autorités');if(!game.alive)return;if(ok){j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)+10,0,100);registerCrime('Résistance à l’arrestation',3,true);tl('Cavale','Tu échappes aux forces lancées à tes trousses.','major')}else arrestPlayer('Capture après poursuite')
}
function justiceTick(m){
 var p=game.player,j=migrateJustice(p);j.actions=1;
 REG.forEach(function(r){var decay=r===p.region?.55:1.15;j.regionalHeat[r]=cl((j.regionalHeat[r]||0)-decay*m,0,100)});
 if(j.detained)return;
 var pressure=justicePressure(),chance=cl((pressure-24)/650,0,.18)*m;if((p.bounty>0||currentHeat()>22)&&R('justice')<chance)pursuitEncounter()
}
function bountyTargets(){
 var p=game.player;return game.world.crews.filter(function(c){return c.status==='active'&&c.faction==='Pirates'&&c.bounty>0&&c.region===p.region}).sort(function(a,b){return b.bounty-a.bounty}).slice(0,5)
}
function huntBountyTarget(id){
 var p=game.player,j=migrateJustice(p);if(p.faction!=='Chasseur de primes')return toast('Réservé aux chasseurs de primes.');if(j.detained)return toast('Tu es actuellement détenu.');var target=game.world.crews.find(function(c){return c.id===id&&c.status==='active'});if(!target||target.region!==p.region)return toast('Cette cible n’est plus disponible dans la région.');if(p.health<40)return toast('Ta santé est trop basse pour lancer une traque.');
 var d=cl(target.power+8+target.members*.18,18,96),ok=fight(d,'Traque : '+target.name);if(!game.alive)return;if(ok){target.status='captured';target.defeats=(target.defeats||0)+1;var reward=Math.round(Math.min(target.bounty*.7,50000000));p.money+=reward;j.captures++;j.bountiesClaimed+=reward;adjustRep('Marine',3);adjustRep('Civil',2);var rec=careerRecord();rec.xp+=10+Math.round(target.power/5);p.reputation+=5;tl('Prime encaissée',target.name+' est capturé. Récompense : '+reward.toLocaleString('fr-FR')+' B.','major');news('Capture de '+target.name,p.name+' remet cet équipage aux autorités.','major')}else tl('Cible échappée',target.name+' échappe à ta tentative de capture.','danger');save();render()
}
function justiceMissionImpact(ok,m){
 var p=game.player;if(!ok)return;if(p.faction==='Pirates'){var sev=m.tier>=4?5:m.tier>=2?3:2;if(/trésor/i.test(m.title))sev=1;registerCrime(m.title,sev,null)}
 else if(p.faction==='Révolutionnaires'&&/(Saboter|Libérer|Infiltrer)/i.test(m.title))registerCrime(m.title,m.tier>=4?5:3,null);
 else if(p.faction==='Chasseur de primes'){migrateJustice(p).notoriety=cl(migrateJustice(p).notoriety-1,0,100)}
}

function careerTrack(f,spec){return f==='Gouvernement'&&spec==='Cipher Pol'?CP_RANKS:(CAREERS[f]?CAREERS[f].ranks:CAREERS.Civil.ranks)}
function firstRank(f){var c=CAREERS[f]||CAREERS.Civil;return c.ranks[0].n}
function careerRecord(f){f=f||game.player.faction;var p=game.player;if(!p.careerRecords[f])p.careerRecords[f]={xp:0,months:0,rank:firstRank(f),specialization:null,successes:0,failures:0};return p.careerRecords[f]}
function ownRep(){return game.player.factionRep[game.player.faction]||0}
function standingLabel(v){return v<=-40?'Hostile':v<-10?'Méfiant':v<20?'Neutre':v<45?'Reconnu':v<70?'Estimé':'Allié majeur'}
function adjustRep(f,n){var p=game.player;if(p.factionRep[f]==null)p.factionRep[f]=0;p.factionRep[f]=cl(p.factionRep[f]+n,-100,100)}
function rankIndex(){var p=game.player,t=careerTrack(p.faction,p.specialization),i=t.findIndex(function(r){return r.n===p.rank});return i<0?0:i}
function nextRank(){var t=careerTrack(game.player.faction,game.player.specialization),i=rankIndex();return i<t.length-1?t[i+1]:null}
function activityForFaction(f){return f==='Civil'?'Études':f==='Chasseur de primes'?'Entraînement':f==='Pirates'?'Formation Pirates':f==='Révolutionnaires'?'Formation Révolutionnaires':f==='Gouvernement'?'Formation Gouvernement':'Formation Marine'}
function join(f,r){var p=game.player,old=p.faction;if(p.organization&&p.organization.faction!==f)archiveOrganization('Changement de voie');var rec=careerRecord(f);p.faction=f;p.career=f;p.rank=rec.rank||r||firstRank(f);p.specialization=rec.specialization||null;p.situation='Carrière';p.activity=activityForFaction(f);if(game.codex.factions.indexOf(f)<0)game.codex.factions.push(f);p.careerHistory.push({age:age(),from:old,to:f});ensureOrganization();tl('Nouvelle carrière','Tu rejoins '+(CAREERS[f]?CAREERS[f].label:f)+'.','major')}
function career(){decision('Choisir une voie','Ta vie adulte commence. Chaque voie possède désormais ses propres rangs, missions, spécialisations et conséquences.',[
 ['Marine','Carrière structurée, salaire et promotions.',function(){join('Marine','Recrue')}],
 ['Pirate','Prime, équipage et ascension par la réputation.',function(){join('Pirates','Novice')}],
 ['Chasseur de primes','Contrats indépendants et revenus à la mission.',function(){join('Chasseur de primes','Indépendant')}],
 ['Civil','Médecine, commerce, navigation, science et artisanat.',function(){join('Civil','Apprenti')}],
 ['Révolutionnaires','Réseau clandestin, infiltration et opérations politiques.',function(){join('Révolutionnaires','Sympathisant')}],
 ['Gouvernement Mondial','Administration, renseignement et accès potentiel au Cipher Pol.',function(){join('Gouvernement','Agent junior')}]
 ])}
function specEligibility(sp){var p=game.player;if(sp==='Cipher Pol'){if(p.faction!=='Gouvernement')return[false,'Réservé au Gouvernement'];if((p.skills.Discrétion||0)<18||(p.skills.Combat||0)<18)return[false,'Combat 18 + Discrétion 18'];if((p.factionRep.Gouvernement||0)<15)return[false,'Réputation Gouvernement 15']}return[true,'']}
function chooseSpecialization(sp){var p=game.player,rec=careerRecord(),q=specEligibility(sp);if(!q[0])return toast(q[1]);if(rec.specialization&&rec.specialization!==sp){rec.xp*=.9;tl('Réorientation','Tu quittes la spécialisation '+rec.specialization+' pour '+sp+'. Une partie de ton expérience de carrière est perdue.','major')}else if(!rec.specialization)tl('Spécialisation','Tu te spécialises en '+sp+'.','major');rec.specialization=sp;p.specialization=sp;if(p.faction==='Gouvernement'&&sp==='Cipher Pol'&&rankIndex()<2&&rec.xp>=105){p.rank='Stagiaire Cipher Pol';rec.rank=p.rank}save();renderChar()}
function salaryPerMonth(){var p=game.player,c=CAREERS[p.faction]||CAREERS.Civil,i=rankIndex();if(!c.salary)return 0;return Math.round(c.salary*(1+i*.34))}
function specSkill(sp){var m={Combat:'Combat',Combattant:'Combat',Duelliste:'Combat',Navigation:'Navigation',Navigateur:'Navigation',Tireur:'Tir',Médecine:'Médecine',Médecin:'Médecine',Renseignement:'Discrétion',Infiltration:'Discrétion',Investigateur:'Discrétion',Scientifique:'Science',Administration:'Discipline',Logistique:'Commandement','Quartier-maître':'Commandement',Marchand:'Commandement',Artisan:'Science',Cuisinier:'Discipline',Traqueur:'Réflexes','Cipher Pol':'Discrétion'};return m[sp]||null}
function evaluatePromotion(){var p=game.player,rec=careerRecord(),n=nextRank();if(!n)return false;var rep=p.factionRep[p.faction]||0;if(rec.xp<n.xp||rep<n.rep||power()<n.pow)return false;p.rank=n.n;rec.rank=n.n;adjustRep(p.faction,3);tl('PROMOTION','Tu accèdes au rang de '+n.n+' au sein de '+(CAREERS[p.faction]?CAREERS[p.faction].label:p.faction)+'.','major');syncOrganizationRole();return true}
function careerTick(m){var p=game.player;if(p.ageMonths<180||p.career==='Aucune')return;var rec=careerRecord();rec.months+=m;var active=p.activity.indexOf('Formation')===0||p.activity==='Études'||p.activity==='Entraînement',base=active?1.25:.55;rec.xp+=m*base*(1+(p.stats.Discipline||0)/260);var sk=specSkill(p.specialization);if(sk)gain(sk,m*.14);var sal=salaryPerMonth()*m;if(sal>0){p.money+=sal;p.salaryTotal+=sal}adjustRep(p.faction,m*.08);evaluatePromotion();organizationTick(m)}
function careerEligibility(f){var p=game.player;if(f===p.faction)return[false,'Voie actuelle'];if(p.ageMonths<180)return[false,'Carrière accessible à partir de 15 ans'];if(f==='Marine'&&p.bounty>0)return[false,'Une prime active bloque le recrutement'];if(f==='Gouvernement'){if(p.bounty>0)return[false,'Une prime active bloque le recrutement'];if((p.stats.Discipline||0)<18)return[false,'Discipline 18 requise']}if(f==='Chasseur de primes'&&p.bounty>50000)return[false,'Prime trop élevée'];return[true,'']}
function switchCareer(f){var p=game.player,old=p.faction,q=careerEligibility(f);if(!q[0])return toast(q[1]);if(old!=='Civil')adjustRep(old,-16);if((old==='Marine'||old==='Gouvernement')&&(f==='Pirates'||f==='Révolutionnaires')){p.deserterFrom.push(old);p.bounty+=80000;tl('Désertion','Ton changement de camp est considéré comme une trahison. Une prime est émise.','danger')}join(f,firstRank(f));save();render()}
function careerChangeDecision(){var p=game.player,ch=[];FACTION_KEYS.forEach(function(f){if(f===p.faction)return;var q=careerEligibility(f);if(q[0])ch.push([(CAREERS[f]?CAREERS[f].label:f),'Quitter '+(CAREERS[p.faction]?CAREERS[p.faction].label:p.faction)+' pour cette voie.',function(){switchCareer(f)}])});if(!ch.length)return toast('Aucune autre voie n’est accessible actuellement.');ch.push(['Rester','Ne rien changer.',function(){}]);decision('Changer de voie','Un changement de faction peut dégrader tes anciennes relations et, en cas de désertion, créer une prime.',ch)}

function styleEdge(a,b){return(MATCH[a]&&MATCH[a][b])||-((MATCH[b]&&MATCH[b][a])||0)}
function injuryName(sev){if(sev>=3)return pk(['Fracture','Traumatisme','Plaie profonde'],'inj');if(sev===2)return pk(['Entorse','Coupure sérieuse','Contusion profonde'],'inj');return pk(['Ecchymoses','Coupure légère','Douleur musculaire'],'inj')}
function combatProfile(){var p=game.player,weapon=p.style==='Sabreur'?p.skills.Sabre:p.style==='Tireur'?p.skills.Tir:p.skills.Combat,inj=p.conditions.reduce(function(a,c){return a+(c.severity||1)*2},0);return{offense:p.stats.Force*.18+p.stats.Vitesse*.13+p.skills.Combat*.27+weapon*.19+p.haki.Armement*.18+p.haki.Conquérant*.08+(p.fruit?p.fruitMastery*.12:0)+techniqueBonus()*.35,defense:p.stats.Résistance*.2+p.stats.Agilité*.17+p.stats.Réflexes*.18+p.skills.Combat*.16+p.haki.Observation*.22+p.haki.Armement*.08-inj,stamina:p.stats.Endurance*.65+p.energy*.22+p.health*.13}}
function fight(d,t){var p=game.player,styles=['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],enemyStyle=pk(styles,'f'),terrain=pk(['terrain ouvert','pont de navire','espace étroit','ruelles','terrain accidenté'],'f'),cp=combatProfile(),edge=styleEdge(p.style,enemyStyle),enemyOff=d*(.72+R('f')*.46),enemyDef=d*(.7+R('f')*.44),terrainMod=(terrain==='espace étroit'&&p.style==='Tireur')?-4:(terrain==='terrain ouvert'&&p.style==='Tireur')?4:(terrain==='terrain accidenté'&&p.style==='Mobile / esquive')?4:0,playerScore=cp.offense*.58+cp.defense*.34+cp.stamina*.08+edge+terrainMod+(R('f')-.5)*12,enemyScore=enemyOff*.6+enemyDef*.4+(R('f')-.5)*12,adv=playerScore-enemyScore,chance=cl(.5+adv/100,.03,.97),ok=R('f')<chance,margin=Math.abs(adv)+(R('f')*10),damage=0,outcome='';
 p.energy=cl(p.energy-(5+d*.08),0,100);
 if(ok){p.wins++;p.reputation+=4;p.combatXP+=3+d/18;gain('Combat',1+d/42);damage=margin<10?Math.round(2+R('f')*7):Math.round(R('f')*4);p.health=cl(p.health-damage,0,100);outcome=margin>22?'Victoire nette':margin>10?'Victoire':'Victoire difficile';if(p.haki.Armement)trainHaki('Armement',.35);if(p.haki.Observation)trainHaki('Observation',.35);if(p.fruit)trainFruit(.3);tl(t||'Combat',outcome+'. '+(damage?'Tu subis '+damage+'% de dégâts.':'Tu évites les blessures sérieuses.'),'major')}
 else{p.losses++;damage=Math.round(cl(7+(enemyScore-playerScore)*.28+R('f')*18,5,58)*diff()[1]);p.health=cl(p.health-damage,0,100);outcome=damage>35?'Défaite sévère':damage>18?'Défaite':'Repli forcé';if(damage>12){var sev=damage>35?3:damage>22?2:1,inj={name:injuryName(sev),months:sev*(1.5+R('inj')*2),severity:sev};p.conditions.push(inj)}tl(t||'Combat',outcome+'. Tu subis '+damage+'% de dégâts.','danger');if(p.health<=0||R('f')<Math.max(0,(enemyScore-playerScore)/230))die('Mort lors d’un affrontement.')}
 game.lastCombat={title:t||'Combat',outcome:outcome,opponentPower:Math.round((enemyOff+enemyDef)/2),playerPower:Math.round(power()),opponentStyle:enemyStyle,playerStyle:p.style,terrain:terrain,matchup:edge+terrainMod,chance:Math.round(chance*100),damage:damage,log:(edge+terrainMod>2?'Ton style exploite le matchup. ':edge+terrainMod<-2?'Le matchup te désavantage. ':'Le matchup est relativement neutre. ')+(p.haki.Observation?'Ton Observation aide à lire les attaques. ':'')+(p.haki.Armement?' Ton Armement renforce les échanges.':'')};syncPowers();return ok}
function challengeFight(){var p=game.player;if(p.ageMonths<144)return toast('Tu es encore trop jeune pour chercher un vrai défi.');if(p.health<45)return toast('Ta santé est trop basse.');var d=inf().danger+12+R('f')*24,ok=fight(d,'Défi local à '+p.island);if(game.alive&&ok){var t=game.world.territories[p.island];if((p.faction==='Pirates'||p.faction==='Révolutionnaires')&&t&&(t.controller==='Marine'||t.controller==='Gouvernement'))registerCrime('Violence publique à '+p.island,2,null)}save();render();if(!game.alive)deathModal()}
function board(){var p=game.player,a=MISSIONS[p.faction]||MISSIONS.Civil,ri=rankIndex(),spec=p.specialization;var eligible=a.filter(function(m){return m.tier<=ri+1&&(!m.spec||m.spec===spec)});eligible.sort(function(x,y){var xs=x.spec===spec?0:1,ys=y.spec===spec?0:1;return xs-ys||x.tier-y.tier||x.danger-y.danger});return eligible.slice(0,4).map(function(m,i){return{id:i,title:m.title,danger:Math.round(m.danger+inf().danger*.22),reward:Math.round(m.reward*(1+ri*.1)),xp:m.xp,tier:m.tier,spec:m.spec||null,months:1+Math.ceil(m.danger/28)}})}
function startMission(i){if(game.mission||game.player.ageMonths<180)return toast('Mission indisponible.');var m=board()[i];if(!m)return toast('Mission introuvable.');game.mission={title:m.title,danger:m.danger,reward:m.reward,xp:m.xp,tier:m.tier,spec:m.spec,remaining:m.months};game.player.situation='Mission';tl('Mission acceptée',m.title+'.','major');save();render()}
function missionReputation(success,m){var p=game.player,d=success?(5+m.tier*2):-(3+m.tier);adjustRep(p.faction,d);if(success){if(p.faction==='Marine'){adjustRep('Gouvernement',1);adjustRep('Pirates',-1)}if(p.faction==='Pirates'){adjustRep('Marine',-2);adjustRep('Gouvernement',-1)}if(p.faction==='Révolutionnaires')adjustRep('Gouvernement',-2);if(p.faction==='Gouvernement')adjustRep('Révolutionnaires',-2);if(p.faction==='Chasseur de primes')adjustRep('Civil',1)}}
function playerWorldImpact(success,m){var p=game.player,w=game.world,t=w.territories[p.island];if(!t)return;var f=p.faction,scale=(m.tier||0)+1;if(success){if(w.factions[f]!=null)w.factions[f]=cl(w.factions[f]+scale*.18,0,100);if(f==='Civil'||f==='Chasseur de primes'){t.stability=cl(t.stability+scale*2,0,100)}else if(t.controller===f||(f==='Marine'&&t.controller==='Gouvernement')||(f==='Gouvernement'&&t.controller==='Marine')){t.influence=cl(t.influence+scale*2.4,0,100);t.stability=cl(t.stability+scale,0,100)}else{t.influence=cl(t.influence-scale*2.2,0,100);t.stability=cl(t.stability-scale*2,0,100);t.contested=t.influence<55;if((m.tier||0)>=3&&R('world')<.35)spawnConflict(p.island,f,t.controller,45+scale*6,'player')}if((m.tier||0)>=4){w.divergence=cl(w.divergence+.4*scale,0,100);news('Intervention remarquée',p.name+' influence directement l’équilibre autour de '+p.island+'.','major')}}else{t.stability=cl(t.stability-scale*1.2,0,100);if(w.factions[f]!=null)w.factions[f]=cl(w.factions[f]-.08*scale,0,100)}}
function resolveMission(){var m=game.mission,p=game.player,rec=careerRecord(),effective=organizationMissionDanger(m),ok=fight(effective,'Mission : '+m.title);if(!game.alive)return;if(ok){var paid=organizationMissionResult(true,m,m.reward);p.money+=paid;p.reputation+=6;rec.xp+=m.xp;rec.successes++;missionReputation(true,m);playerWorldImpact(true,m);justiceMissionImpact(true,m);tl('Mission accomplie',m.title+' est terminée avec succès. +'+m.xp+' XP carrière. Soutien du groupe : -'+Math.round(m.danger-effective)+' danger.','major')}else{organizationMissionResult(false,m,0);rec.xp+=Math.round(m.xp*.25);rec.failures++;missionReputation(false,m);playerWorldImpact(false,m);justiceMissionImpact(false,m);tl('Mission échouée',m.title+' échoue. La hiérarchie et ton organisation en tiennent compte.','danger')}game.mission=null;p.situation='Carrière';evaluatePromotion()}

function req(d){var r=inf(d).region,p=game.player;if(r==='Grand Line'&&p.skills.Navigation<18)return[false,'Navigation 18'];if(r==='New World'&&(p.skills.Navigation<35||power()<35))return[false,'Navigation 35 + puissance 35'];return[true,'']}
function go(d){var q=req(d);if(!q[0])return toast('Accès verrouillé : '+q[1]);var p=game.player,z=inf(d).danger,mo=.6+z/35+R('t')*.8,o=p.organization;if(o&&o.ship){var st=SHIP_TIERS[o.ship.tier||0]||SHIP_TIERS[0];mo*=1-st.speed;if(o.ship.condition<40)mo*=1.18}mo=Math.max(.5,Math.round(mo*10)/10);decision('Prendre la mer','Voyager vers '+d+' prendra environ '+mo+' mois.',[['Partir','Danger '+z+'/100',function(){p.travel={from:p.island,destination:d,remaining:mo,danger:z};p.situation='Navigation';p.activity='Navigation';tl('Départ en mer','Cap sur '+d+'.','major')}],['Rester','Annuler.',function(){}]])}
function travel(m){var p=game.player,t=p.travel,o=p.organization;t.remaining-=m;var incident=.18;if(o&&o.ship){incident+=o.ship.condition<35?.09:o.ship.condition>80?-.04:0;incident+=o.supplies<10?.06:0}if(R('t')<cl(incident,.05,.35))fight(t.danger*.75,'Incident en mer');if(!game.alive)return;if(t.remaining<=0){p.island=t.destination;p.region=inf(t.destination).region;p.travel=null;p.situation='Arrivée';p.activity='Explorer';if(p.visited.indexOf(p.island)<0)p.visited.push(p.island);if(game.codex.places.indexOf(p.island)<0)game.codex.places.push(p.island);tl('Nouvelle destination','Tu arrives à '+p.island+'.','major')}}
function hostileCandidates(defender){
 var map={Marine:['Pirates','Révolutionnaires'],Gouvernement:['Pirates','Révolutionnaires'],Pirates:['Marine','Gouvernement','Chasseur de primes'],Révolutionnaires:['Gouvernement','Marine'],Civil:['Pirates'], 'Chasseur de primes':['Pirates']};
 return map[defender]||['Pirates','Marine']
}
function spawnConflict(location,attacker,defender,intensity,source){
 var w=game.world;if(!location||attacker===defender)return null;
 var existing=w.conflicts.find(function(c){return c.location===location&&c.status==='active'});
 if(existing){existing.intensity=cl(existing.intensity+8,15,100);return existing}
 var c={id:'conf-'+w.year+'-'+Math.floor(w.month)+'-'+Math.floor(R('world')*99999),location:location,region:infStatic(location).region,attacker:attacker,defender:defender,intensity:Math.round(intensity||45),months:0,status:'active',source:source||'world'};
 w.conflicts.push(c);w.globalTension=cl(w.globalTension+3,0,100);var t=w.territories[location];if(t)t.contested=true;
 news('Conflit à '+location,attacker+' conteste le contrôle de '+defender+'.','war');
 if(game.player.island===location)tl('Conflit territorial',attacker+' et '+defender+' s’affrontent autour de '+location+'.','danger');
 return c
}
function resolveConflict(c){
 var w=game.world,t=w.territories[c.location];if(!t)return;
 var ap=(w.factions[c.attacker]||48)+(c.source&&String(c.source).indexOf('crew-')===0?(w.crews.find(function(x){return x.id===c.source})||{power:0}).power*.45:0)+R('world')*24+c.intensity*.12;
 var dp=(w.factions[c.defender]||48)+t.influence*.34+R('world')*24;
 var winner=ap>dp?c.attacker:c.defender,loser=winner===c.attacker?c.defender:c.attacker,margin=Math.abs(ap-dp);
 c.status='resolved';c.winner=winner;c.months=Math.max(1,c.months);
 if(winner!==t.controller){var old=t.controller;t.controller=winner;t.influence=Math.round(cl(48+margin*.45,42,76));t.stability=Math.round(cl(t.stability-12-R('world')*16,8,100));t.lastChange='Année '+w.year+', mois '+(Math.floor(w.month)+1);w.divergence=cl(w.divergence+(c.intensity/100)*1.5,0,100);news('Changement de contrôle',winner+' prend le contrôle de '+c.location+' au détriment de '+old+'.','major')}
 else{t.influence=cl(t.influence+5+margin*.12,0,100);t.stability=cl(t.stability+3-R('world')*4,0,100);news('Offensive repoussée',c.defender+' conserve '+c.location+' face à '+c.attacker+'.','war')}
 t.contested=false;w.globalTension=cl(w.globalTension-1,0,100);
 w.worldHistory.unshift({year:w.year,month:Math.floor(w.month),type:'conflict',location:c.location,winner:winner,loser:loser});w.worldHistory=w.worldHistory.slice(0,80)
}
function simulateConflicts(){
 var w=game.world;
 w.conflicts.filter(function(c){return c.status==='active'}).forEach(function(c){c.months++;c.intensity=cl(c.intensity+(R('world')-.43)*10,15,100);if(c.months>=2&&R('world')<.24+c.months*.08)resolveConflict(c)});
 w.conflicts=w.conflicts.filter(function(c){return c.status==='active'}).slice(-8);
 if(w.conflicts.length<4&&R('world')<.10+w.globalTension/900){var names=Object.keys(w.territories),loc=pk(names,'world'),t=w.territories[loc],att=pk(hostileCandidates(t.controller),'world');spawnConflict(loc,att,t.controller,32+R('world')*42,'world')}
}
function simulateCrews(){
 var w=game.world,active=w.crews.filter(function(c){return c.status==='active'});
 active.forEach(function(c){
  c.ageMonths++;c.power=cl(c.power+(R('world')-.35)*1.15,6,96);c.morale=cl(c.morale+(R('world')-.5)*5,8,100);
  if(c.faction==='Pirates')c.bounty=Math.max(0,c.bounty+Math.round((c.power*.12+R('world')*5)*100000));
  if(R('world')<.13){var links=REGION_LINKS[c.region]||[];if(links.length)c.region=pk(links,'world')}
  var terrs=Object.keys(w.territories).filter(function(n){return infStatic(n).region===c.region}),loc=terrs.length?pk(terrs,'world'):null,t=loc&&w.territories[loc];
  if(t&&c.power>42&&c.faction!==t.controller&&diplomacy(c.faction,t.controller)<-20&&R('world')<.045)spawnConflict(loc,c.faction,t.controller,35+c.power*.45,c.id);
  if(R('world')<.008+Math.max(0,25-c.morale)/2500){c.status='destroyed';c.defeats++;news(c.name+' disparaît',c.name+' est détruit ou dissous dans '+c.region+'.','major')}
 });
 if(w.crews.filter(function(c){return c.status==='active'}).length<8){var nc=makeWorldCrew(game,w.nextCrewId++);w.crews.push(nc);news('Nouvel équipage',nc.name+' apparaît dans '+nc.region+'.','')}
 w.crews=w.crews.slice(-28)
}
function syncActorAvailability(){
 var w=game.world;w.actors.forEach(function(a){if(a.status==='inactive'&&w.year>=(a.activeFrom||0)){a.status='active';a.region=a.startRegion||a.region;news('Nouvel acteur sur les mers',a.name+' commence à faire parler de lui dans '+a.region+'.',a.importance>=98?'major':'')}})
}
function simulateActors(){
 var w=game.world;syncActorAvailability();
 w.actors.forEach(function(a){
  if(a.status==='dead'||a.status==='inactive')return;if(a.status==='wounded'){a.woundMonths--;if(a.woundMonths<=0){a.status='active';a.woundMonths=0;news(a.name+' réapparaît',a.name+' reprend ses activités dans '+a.region+'.','')}return}
  a.actions++;if(R('world')<.08){var links=REGION_LINKS[a.region]||[];if(links.length){a.region=pk(links,'world');if(a.importance>=98&&R('world')<.20)news('Déplacement majeur',a.name+' est signalé dans '+a.region+'.','major')}}
  if(w.factions[a.faction]!=null&&R('world')<.30)w.factions[a.faction]=cl(w.factions[a.faction]+(R('world')-.38)*.5,0,100);
  if(a.faction!=='Indépendant'&&R('world')<.10){var ts=Object.keys(w.territories).filter(function(n){return infStatic(n).region===a.region});if(ts.length){var t=w.territories[pk(ts,'world')];if(t.controller===a.faction)t.influence=cl(t.influence+1.4,0,100)}}
 });
 var byRegion={};w.actors.filter(function(a){return a.status==='active'}).forEach(function(a){(byRegion[a.region]||(byRegion[a.region]=[])).push(a)});
 Object.keys(byRegion).forEach(function(r){var a=byRegion[r];if(a.length<2||R('world')>.045)return;var one=pk(a,'world'),opps=a.filter(function(x){return x!==one&&diplomacy(one.faction,x.faction)<-40});if(!opps.length)return;var two=pk(opps,'world'),p1=actorPower(one)+R('world')*16,p2=actorPower(two)+R('world')*16,loser=p1>=p2?two:one,winner=loser===one?two:one,margin=Math.abs(p1-p2);loser.status='wounded';loser.woundMonths=Math.round(2+R('world')*5);news('Affrontement majeur',winner.name+' prend l’avantage sur '+loser.name+' dans '+r+'.','major');var deathChance=(w.divergence/100)*.006*Math.max(.04,1-loser.importance/108);if(margin>20&&R('world')<deathChance){loser.status='dead';loser.woundMonths=0;w.divergence=cl(w.divergence+loser.importance*.18,0,100);news('DIVERGENCE HISTORIQUE',loser.name+' disparaît lors d’un affrontement contre '+winner.name+'.','war')}})
}
function simulateTerritories(){
 var w=game.world;Object.keys(w.territories).forEach(function(n){var t=w.territories[n];t.stability=cl(t.stability+(R('world')-.48)*2.8,0,100);if(t.stability<30)t.influence=cl(t.influence-(30-t.stability)*.025,20,100);t.contested=t.contested||t.influence<45});
}
function simulateDiplomacy(){
 var w=game.world;Object.keys(w.diplomacy).forEach(function(k){var v=w.diplomacy[k],parts=k.split('|');if((parts.indexOf('Pirates')>=0&&parts.indexOf('Marine')>=0)||(parts.indexOf('Gouvernement')>=0&&parts.indexOf('Révolutionnaires')>=0))return;w.diplomacy[k]=cl(v+(R('world')-.5)*1.1,-100,100)});
 if(R('world')<.025){var keys=Object.keys(w.diplomacy),k=pk(keys,'world'),old=w.diplomacy[k];w.diplomacy[k]=cl(old+(R('world')<.5?-12:12),-100,100);var p=k.split('|');news('Tension diplomatique',p[0]+' et '+p[1]+' voient leur relation évoluer.','')}
}
function canonActor(name){return game.world.actors.find(function(a){return a.name===name})||null}
function resolveCanonEvent(c){
 var w=game.world,p=game.player,required=c.required||[],missing=required.filter(function(n){var a=canonActor(n);return !a||a.status==='dead'||a.status==='inactive'}),terr=w.territories[c.location],instability=terr?100-terr.stability:30,pressure=w.divergence+instability*.08+(terr&&terr.contested?8:0),modified=false;
 if(missing.length){c.status='cancelled';w.divergence=cl(w.divergence+Math.max(2,(100-c.resistance)*.16+missing.length*2),0,100)}
 else{var threshold=c.resistance||75,flex=c.type==='flexible';modified=pressure>=threshold||(flex&&pressure>threshold*.48&&R('canon')<cl((pressure-threshold*.48)/80,.02,.42));c.status=modified?'modified':'completed';if(modified)w.divergence=cl(w.divergence+Math.max(1,(100-threshold)*.08),0,100)}
 if(c.status==='completed'){required.forEach(function(n){var a=canonActor(n);if(a&&c.location){a.region=infStatic(c.location).region;a.status='active'}});if(terr){terr.stability=cl(terr.stability-(c.type==='anchor'?8:4),0,100)}}
 var detail=c.status==='cancelled'?'Événement annulé : '+missing.join(', ')+' manque(nt) à la chaîne causale.':c.status==='modified'?'L’événement se produit sous une forme divergente.':c.description;
 news(c.title,detail,c.status==='completed'?'major':'war');if(p.island===c.location||p.region===infStatic(c.location).region)tl(c.title,detail,'canon');
 if(game.codex.events.indexOf(c.title)<0)game.codex.events.push(c.title);w.canonHistory.push({id:c.id,status:c.status,year:w.year,month:w.month});w.canonHistory=w.canonHistory.slice(-80)
}
function processCanonEvents(){var w=game.world,now=w.year*12+Math.floor(w.month);syncActorAvailability();w.canon.forEach(function(c){if(c.status==='future'&&now>=canonMonth(c))resolveCanonEvent(c)})}
function worldMonthStep(){syncActorAvailability();fruitMarketTick();syncCanonicalFruits();processCanonEvents();simulateTerritories();simulateCrews();simulateActors();simulateConflicts();simulateDiplomacy();var w=game.world;w.globalTension=cl(w.globalTension+(R('world')-.5)*2,0,100);REG.forEach(function(r){var rp=w.pressures[r];if(!rp)return;Object.keys(rp).forEach(function(k){rp[k]=cl(rp[k]+(R('world')-.5)*2.2,0,100)})})}
function world(m){var w=game.world;if(!w.v1ClockMigrated){var frac=(w.month||0)%1;w.month=Math.floor(w.month||0);w.simRemainder=(w.simRemainder||0)+frac;w.v1ClockMigrated=true}w.simRemainder=(w.simRemainder||0)+m;while(w.simRemainder>=1){w.simRemainder-=1;w.month++;if(w.month>=12){w.month=0;w.year++;if(R('world')<.55)news('Bilan annuel',pk(['La Marine réorganise plusieurs bases.','De nouveaux équipages se font un nom.','Des réseaux clandestins gagnent du terrain.','Plusieurs routes commerciales changent de mains.'],'world'),'')}worldMonthStep()}}
function runLocalEvent(){var p=game.player,candidates=LOCAL_EVENTS.filter(function(x){return x.regions.indexOf(p.region)>=0});if(!candidates.length)return false;var ev=pk(candidates,'local');if(ev.kind==='economy'){var v=1200+Math.round(R('local')*9000);if(R('local')<.58){p.money-=Math.min(Math.max(0,p.money),v);tl(ev.title,'Une transaction locale te coûte '+v.toLocaleString('fr-FR')+' B.')}else{p.money+=v;tl(ev.title,'Une opportunité commerciale te rapporte '+v.toLocaleString('fr-FR')+' B.')}}else if(ev.kind==='danger'){fight(inf().danger+8+R('local')*24,ev.title)}else if(ev.kind==='faction'){adjustRep(p.faction,1+R('local')*2);tl(ev.title,'Tes activités attirent l’attention des organisations présentes dans la zone.')}else if(ev.kind==='world'){news(ev.title,'Une information circule dans '+p.region+' et modifie les rumeurs locales.','');tl(ev.title,'Tu obtiens de nouvelles informations sur les forces locales.')}else if(ev.kind==='discovery'){var gain=500+Math.round(R('local')*6500);p.money+=gain;tl(ev.title,'Ton exploration te rapporte une découverte estimée à '+gain.toLocaleString('fr-FR')+' B.')}return true}
function event(m){if(R('e')>.18+m*.02)return;var p=game.player,x=pk(['relation','money','danger','meet','haki','fruit','crew','life','local','local'],'e');
 if(x==='relation'){var r=createRelation();tl('Nouvelle rencontre',r.name+' entre dans ta vie comme '+r.role+'.','major')}
 else if(x==='money'){var z=1000+Math.floor(R('e')*12000);p.money+=z;tl('Bonne affaire','Tu gagnes '+z.toLocaleString('fr-FR')+' B.')}
 else if(x==='danger')fight(inf().danger+10+R('e')*35,'Confrontation imprévue');
 else if(x==='meet'){var a=game.world.actors.filter(function(c){return c.region===p.region&&c.status==='active'});if(a.length){var c=pk(a,'e');if(game.codex.people.indexOf(c.name)<0)game.codex.people.push(c.name);tl('Rencontre canonique','Tu croises '+c.name+' ('+c.faction+'). Sa trajectoire actuelle : '+c.goal+'.','canon')}}
 else if(x==='crew'){var cs=game.world.crews.filter(function(c){return c.region===p.region&&c.status==='active'});if(cs.length){var cr=pk(cs,'e');tl('Équipage aperçu',cr.name+' est signalé dans '+p.region+' — puissance estimée '+Math.round(cr.power)+'.',diplomacy(p.faction,cr.faction)<-40?'danger':'')}} else if(x==='local'){runLocalEvent()} else if(x==='life'){if(p.ageMonths>=180&&R('life')<.55){var expense=800+Math.round(R('life')*6500);p.money-=expense;tl('Dépense imprévue','Un imprévu te coûte '+expense.toLocaleString('fr-FR')+' B.')}else if(p.ageMonths>=180){var gainLife=1000+Math.round(R('life')*9000);p.money+=gainLife;tl('Petit coup de chance','Une opportunité te rapporte '+gainLife.toLocaleString('fr-FR')+' B.')}}
 else if(x==='haki'){var k=pk(['Observation','Armement','Conquérant'],'h');if(p.latent[k]>55&&p.haki[k]===0){p.haki[k]=1;syncPowers();tl('Éveil du Haki','Ton Haki de '+k+' s’éveille.','major')}else if(p.haki[k]){trainHaki(k,.6);syncPowers();tl('Instinct affûté','Ton Haki de '+k+' progresse légèrement.')}}
 else if(x==='fruit'&&!p.fruit&&!p.heldFruit&&R('e')<.32){var av=game.world.fruits.filter(function(n){return !game.world.fruitRegistry[n]||game.world.fruitRegistry[n].status==='available'});if(av.length){var fr=pickFruit(av);decision('Un Fruit du démon','Tu découvres '+fr+'. Rien ne t’oblige à le consommer.',[['Le manger','Obtenir son pouvoir, mais perdre la capacité de nager.',function(){p.fruit=fr;p.fruitMastery=1;game.world.fruitRegistry[fr]={status:'consumed',holder:p.name};if(game.codex.fruits.indexOf(fr)<0)game.codex.fruits.push(fr);tl('Fruit du démon','Tu consommes le '+fr+'.','major')}],['Le conserver','Le garder pour plus tard.',function(){p.heldFruit=fr;game.world.fruitRegistry[fr]={status:'held',holder:p.name};tl('Fruit découvert','Tu conserves le '+fr+'.','major')}],['Le vendre','Transformer cette rareté en Berry.',function(){var val=40000+Math.round(R('fruit')*110000);p.money+=val;game.world.fruitRegistry[fr]={status:'sold',holder:null,marketMonths:0};tl('Vente exceptionnelle','Tu vends le '+fr+' pour '+val.toLocaleString('fr-FR')+' B.','major')}]])}}
}
function die(c){releasePlayerFruits();game.alive=false;game.death={cause:c};game.player.health=0;tl('Mort',c,'danger')}
function advance(){if(!game||!game.alive||game.pending)return;var p=game.player,m=p.ageMonths<72?6:p.ageMonths<180?3:game.mission?Math.min(1,game.mission.remaining):p.travel?Math.min(1,p.travel.remaining):1+R('time')*2;m=Math.max(.5,Math.round(m*2)/2);p.ageMonths+=m;world(m);p.health=cl(p.health+m*2,0,100);p.energy=cl(p.energy+m*4,0,100);p.conditions.forEach(function(c){c.months-=m});p.conditions=p.conditions.filter(function(c){return c.months>0});careerTick(m);lifeTick(m);if(!game.alive){save();render();deathModal();return}if(p.travel)travel(m);else if(game.mission){game.mission.remaining-=m;train(m);if(game.mission.remaining<=0)resolveMission()}else{train(m);event(m)}if(!game.alive){save();render();deathModal();return}if(p.ageMonths>=72&&p.situation==='Enfance'){p.situation='Formation';p.activity='Études';tl('Formation','Tu commences une formation structurée.','major')}if(p.ageMonths>=180&&p.career==='Aucune'&&!game.pending)career();p.danger=p.conditions.length?'Moyen':inf().danger>45?'Élevé':inf().danger>20?'Moyen':'Faible';checkAchievements();save();render()}
function rep(){var r=game.player.reputation;return r>75?'Célèbre':r>40?'Reconnu':r>15?'Connu':'Inconnu'}
function slots(){var b=$('#saveSlots');b.innerHTML='';for(var i=1;i<=3;i++){(function(i){var s=load(i),x=document.createElement('button');x.className='save-slot'+(s?'':' empty');x.innerHTML=s?'<strong>'+e(s.player.name)+'</strong><small>'+Math.floor(s.player.ageMonths/12)+' ans • '+e(s.player.faction)+'<br>'+e(s.player.island)+'</small>':'<strong>＋ Nouvelle vie</strong><small>Emplacement '+i+'</small>';x.onclick=function(){slot=i;if(s){game=s;syncCanonicalFruits();render()}else $('#creationCard').classList.remove('hidden')};b.appendChild(x)})(i)}}
function bar(o){return Object.keys(o).map(function(k){var v=o[k];return '<div class="stat-row"><span>'+e(k)+'</span><div class="stat-bar"><div class="stat-fill" style="width:'+cl(v,0,100)+'%"></div></div><span class="stat-value">'+Math.round(v)+'</span></div>'}).join('')}
function showGame(){$('#startScreen').classList.remove('active');$('#gameScreen').classList.add('active');$('#bottomNav').classList.remove('hidden');$('#homeBtn').classList.remove('hidden')}
function showStart(){game=null;$('#gameScreen').classList.remove('active');$('#startScreen').classList.add('active');$('#bottomNav').classList.add('hidden');$('#homeBtn').classList.add('hidden');slots()}
function renderTimeline(){var a=game.timeline.filter(function(x){return !majorOnly||['major','danger','canon'].indexOf(x.type)>=0});$('#timeline').innerHTML=a.slice(0,45).map(function(x){return '<div class="timeline-item '+e(x.type)+'"><span class="timeline-dot"></span><span class="timeline-age">'+e(x.age)+'</span><div class="timeline-title">'+e(x.title)+'</div><div class="timeline-desc">'+e(x.desc)+'</div></div>'}).join('')}
function renderChar(){var p=game.player,rec=careerRecord(),cfg=CAREERS[p.faction]||CAREERS.Civil,repv=p.factionRep[p.faction]||0,next=nextRank(),ri=rankIndex(),sal=salaryPerMonth();
 $('#identityGrid').innerHTML=[['Nom',p.name],['Origine',p.origin],['Race',p.race],['Lieu',p.island],['Faction',cfg.label],['Réputation',rep()]].map(function(x){return '<div class="info-cell"><span>'+e(x[0])+'</span><strong>'+e(x[1])+'</strong></div>'}).join('');
 $('#careerStandingBadge').textContent=standingLabel(repv);$('#careerCard').innerHTML='<strong>'+e(cfg.label)+' • '+e(p.rank)+'</strong><p>'+(p.specialization?'Spécialisation : '+e(p.specialization)+' • ':'')+'Ancienneté : '+Math.floor(rec.months)+' mois • Missions : '+rec.successes+' réussies / '+rec.failures+' échouées</p>'+(sal?'<span class="salary-chip">'+sal.toLocaleString('fr-FR')+' B / mois</span>':'<span class="salary-chip">Revenus à la mission</span>');
 if(next){var xpPct=cl(rec.xp/next.xp*100,0,100),reqs=[['XP '+Math.round(rec.xp)+' / '+next.xp,rec.xp>=next.xp],['Réputation '+Math.round(repv)+' / '+next.rep,repv>=next.rep],['Puissance '+Math.round(power())+' / '+next.pow,power()>=next.pow]];$('#careerProgressCard').innerHTML='<div class="career-progress-head"><strong>Prochain rang : '+e(next.n)+'</strong><span>'+Math.round(xpPct)+'%</span></div><div class="career-progress-bar"><div style="width:'+xpPct+'%"></div></div><div class="career-reqs">'+reqs.map(function(r){return '<span class="'+(r[1]?'met':'unmet')+'">'+e(r[0])+'</span>'}).join('')+'</div>'}else $('#careerProgressCard').innerHTML='<div class="career-progress-head"><strong>Rang maximal automatique atteint</strong><span>Les postes supérieurs dépendent d’événements du monde.</span></div>';
 $('#specializationBadge').textContent=p.specialization||'À choisir';$('#specializationCard').innerHTML=p.specialization?'<strong>'+e(p.specialization)+'</strong><p>Cette spécialisation influence tes missions et ta progression secondaire.</p>':'<strong>Aucune spécialisation</strong><p>Choisir un rôle ouvre des missions spécifiques. Une réorientation ultérieure coûte 10% d’XP carrière.</p>';
 $('#specializationOptions').innerHTML=cfg.specs.map(function(sp){var q=specEligibility(sp),sel=p.specialization===sp;return '<button class="action-card '+(sel?'selected ':'')+(q[0]?'':'locked')+'" data-sp="'+e(sp)+'"><strong>'+e(sp)+'</strong><small>'+(sel?'Spécialisation actuelle':q[0]?'Choisir cette voie':e(q[1]))+'</small></button>'}).join('');$$('[data-sp]').forEach(function(b){b.onclick=function(){chooseSpecialization(b.dataset.sp)}});
 $('#factionStanding').innerHTML=FACTION_KEYS.map(function(f){var v=p.factionRep[f]||0,pos=cl((v+100)/2,0,100);return '<div class="standing-row"><div class="standing-head"><strong>'+e(CAREERS[f]?CAREERS[f].label:f)+'</strong><span>'+standingLabel(v)+' • '+Math.round(v)+'</span></div><div class="standing-meter"><div class="standing-marker" style="left:'+pos+'%"></div></div></div>'}).join('');
 $('#careerActions').innerHTML='<button id="changeCareerBtn" class="action-card career-action-warning"><strong>Changer de voie</strong><small>Quitter ta faction peut avoir des conséquences durables.</small></button><button id="careerRecordBtn" class="action-card"><strong>Dossier de carrière</strong><small>'+p.careerHistory.length+' changement(s) de voie • '+Math.round(p.salaryTotal).toLocaleString('fr-FR')+' B de salaire cumulés</small></button>';$('#changeCareerBtn').onclick=careerChangeDecision;$('#careerRecordBtn').onclick=function(){toast('XP carrière : '+Math.round(rec.xp)+' • ancienneté : '+Math.floor(rec.months)+' mois')};
 $('#ambitionCard').innerHTML='<strong>'+e(p.ambition)+'</strong><p>Orientation personnelle.</p>';var aa=['Survivre','Devenir puissant','Explorer le monde','Faire fortune','Entrer dans l’histoire'];$('#ambitionOptions').innerHTML=aa.map(function(a){return '<button class="action-card '+(p.ambition===a?'active':'')+'" data-a="'+e(a)+'"><strong>'+e(a)+'</strong></button>'}).join('');$$('[data-a]').forEach(function(b){b.onclick=function(){p.ambition=b.dataset.a;save();renderChar()}});
 $('#missionBoard').innerHTML=game.mission?'<div class="mission-card active-mission"><strong>'+e(game.mission.title)+'</strong><p>'+game.mission.remaining.toFixed(1)+' mois restants • '+game.mission.xp+' XP carrière</p></div>':board().map(function(m){return '<button class="mission-card" data-m="'+m.id+'"><strong>'+e(m.title)+'</strong><p>Danger '+m.danger+' • '+m.reward.toLocaleString('fr-FR')+' B • '+m.xp+' XP</p>'+(m.spec?'<small>Spécialisation : '+e(m.spec)+'</small>':'')+'</button>'}).join('');$$('[data-m]').forEach(function(b){b.onclick=function(){startMission(+b.dataset.m)}});
 var acts=['Études','Entraînement','Navigation','Sabre','Médecine',activityForFaction(p.faction)];if(p.haki.Observation)acts.push('Haki Observation');if(p.haki.Armement)acts.push('Haki Armement');if(p.haki.Conquérant)acts.push('Haki Conquérant');if(p.fruit)acts.push('Maîtrise du Fruit');acts=acts.filter(function(v,i,a){return a.indexOf(v)===i});$('#activityOptions').innerHTML=acts.map(function(a){return '<button class="action-card '+(p.activity===a?'active':'')+'" data-act="'+e(a)+'"><strong>'+e(a)+'</strong></button>'}).join('');$$('[data-act]').forEach(function(b){b.onclick=function(){p.activity=b.dataset.act;save();renderChar()}});
 var org=p.career!=='Aucune'?ensureOrganization():null;$('#crewSection').classList.toggle('hidden',!org);
 if(org){
  var activeMembers=org.members.filter(function(m){return m.status==='active'}),cap=organizationCapacity(),auth=org.authority,orgPow=organizationPower();
  $('#organizationEyebrow').textContent=org.kind;$('#crewName').textContent=org.name;$('#crewMorale').textContent='Moral '+Math.round(org.morale)+'%';
  $('#organizationSummary').innerHTML='<div><span>Ton rôle</span><strong>'+e(org.playerRole)+'</strong></div><div><span>Puissance du groupe</span><strong>'+Math.round(orgPow)+'</strong></div><div><span>Cohésion</span><strong>'+Math.round(org.cohesion)+'%</strong></div><div><span>Renommée</span><strong>'+Math.round(org.renown)+'</strong></div>';
  $('#crewDetails').innerHTML='<strong>'+e(authorityLabel(auth))+' dans '+e(org.kind)+'</strong><p>'+Math.floor(org.months)+' mois dans cette organisation • '+org.successes+' missions réussies / '+org.failures+' échouées. '+(auth==='member'?'Tu participes aux opérations mais le commandement reste limité.':auth==='officer'?'Tu peux organiser l’entraînement et demander des renforts.':'Tu contrôles le recrutement, la logistique et la composition du groupe.')+'</p>';
  $('#memberCountBadge').textContent=activeMembers.length+'/'+cap;
  $('#organizationMembers').innerHTML=activeMembers.length?activeMembers.map(function(m){return '<div class="org-member '+(m.injuryMonths>0?'injured':'')+'"><div class="org-member-head"><strong>'+e(m.name)+'</strong><span>'+e(m.role)+'</span></div><div class="org-member-meta">Puissance '+Math.round(m.power)+' • loyauté '+Math.round(m.loyalty)+' • moral '+Math.round(m.morale)+(m.injuryMonths>0?' • blessé '+m.injuryMonths.toFixed(1)+' mois':'')+'</div><div class="org-member-bars"><div><div class="org-mini-meter"><div style="width:'+cl(m.loyalty,0,100)+'%"></div></div></div><div><div class="org-mini-meter"><div style="width:'+cl(m.power,0,100)+'%"></div></div></div></div>'+(auth!=='member'?'<div class="relation-actions-mini"><button data-org-role="'+e(m.id)+'">Changer le rôle</button>'+(auth==='leader'?'<button data-org-dismiss="'+e(m.id)+'">Écarter</button>':'')+'</div>':'')+'</div>'}).join(''):'<p class="org-empty">Aucun membre actif. Une organisation sans membres, concept audacieux mais opérationnellement médiocre.</p>';
  $('#organizationResources').innerHTML='<div><span>Caisse</span><strong>'+Math.round(org.treasury).toLocaleString('fr-FR')+' B</strong></div><div><span>Provisions</span><strong>'+Math.round(org.supplies)+'%</strong></div><div><span>Missions</span><strong>'+org.missions+'</strong></div><div><span>Soutien mission</span><strong>-'+Math.round(organizationSupport({}))+' danger</strong></div>';
  $('#shipSection').classList.toggle('hidden',!org.ship);if(org.ship){var st=SHIP_TIERS[org.ship.tier||0]||SHIP_TIERS[0],nextShip=SHIP_TIERS[(org.ship.tier||0)+1];$('#shipName').textContent=org.ship.name;$('#shipCondition').textContent='État '+Math.round(org.ship.condition)+'%';$('#shipCard').innerHTML='<strong>'+e(st.name)+' • capacité '+st.capacity+'</strong><span>Bonus vitesse '+Math.round(st.speed*100)+'%</span><small>État '+Math.round(org.ship.condition)+'%. Un navire dégradé ralentit les traversées et augmente le risque d’incident.</small>'}
  $('#organizationActionBadge').textContent=(org.commandActions||0)+' action';var actions='<button id="orgBondBtn" class="action-card"><strong>Vie de groupe</strong><small>Renforcer moral, cohésion et loyauté.</small></button>';
  if(auth!=='member')actions+='<button id="orgRecruitBtn" class="action-card"><strong>Recruter</strong><small>Ajouter un membre jusqu’à la capacité actuelle.</small></button><button id="orgTrainBtn" class="action-card"><strong>Entraînement collectif</strong><small>Améliorer la cohésion et la puissance du groupe.</small></button>';
  actions+='<button id="orgFundBtn" class="action-card"><strong>Verser 10 000 B</strong><small>Alimenter la caisse commune.</small></button><button id="orgSupplyBtn" class="action-card"><strong>Ravitaillement</strong><small>5 000 B pour restaurer les provisions.</small></button>';
  if(org.ship)actions+='<button id="orgRepairBtn" class="action-card"><strong>Réparer le navire</strong><small>Le coût dépend de son état.</small></button>'+(auth==='leader'&&SHIP_TIERS[(org.ship.tier||0)+1]?'<button id="orgUpgradeBtn" class="action-card org-leader"><strong>Améliorer le navire</strong><small>'+SHIP_TIERS[(org.ship.tier||0)+1].name+' • '+SHIP_TIERS[(org.ship.tier||0)+1].cost.toLocaleString('fr-FR')+' B</small></button>':'');
  $('#organizationActions').innerHTML=actions;$('#orgBondBtn').onclick=supportOrganization;var ob=$('#orgRecruitBtn');if(ob)ob.onclick=recruitOrganizationMember;var ot=$('#orgTrainBtn');if(ot)ot.onclick=trainOrganization;$('#orgFundBtn').onclick=fundOrganization;$('#orgSupplyBtn').onclick=buyOrganizationSupplies;var orp=$('#orgRepairBtn');if(orp)orp.onclick=repairOrganizationShip;var ou=$('#orgUpgradeBtn');if(ou)ou.onclick=upgradeOrganizationShip;
  $('[data-org-role]').forEach(function(b){b.onclick=function(){assignOrganizationRole(b.dataset.orgRole)}});$('[data-org-dismiss]').forEach(function(b){b.onclick=function(){dismissOrganizationMember(b.dataset.orgDismiss)}})
 }
 var nw=netWorth(),h=HOUSING[p.life.housingLevel||0]||HOUSING[0],assets=p.life.assets||{};
 $('#netWorthBadge').textContent=nw.toLocaleString('fr-FR')+' B';
 $('#economySummary').innerHTML='<div><span>Liquidités</span><strong class="'+(p.money<0?'debt':'')+'">'+Math.round(p.money).toLocaleString('fr-FR')+' B</strong></div><div><span>Patrimoine net</span><strong class="'+(nw>=1000000?'wealth':'')+'">'+nw.toLocaleString('fr-FR')+' B</strong></div><div><span>Coût mensuel</span><strong>'+livingCostPerMonth().toLocaleString('fr-FR')+' B</strong></div><div><span>Revenu activité</span><strong>'+businessIncomePerMonth().toLocaleString('fr-FR')+' B/mois</strong></div>';
 $('#housingCard').innerHTML='<strong>'+e(h.name)+'</strong><p>Immobilier : '+Math.round(assets.property||0).toLocaleString('fr-FR')+' B • activité : '+Math.round(assets.business||0).toLocaleString('fr-FR')+' B • trésor : '+Math.round(assets.treasure||0).toLocaleString('fr-FR')+' B</p><div class="mastery-meter"><div style="width:'+((p.life.housingLevel||0)/(HOUSING.length-1)*100)+'%"></div></div>';
 var nextHousing=HOUSING[(p.life.housingLevel||0)+1];$('#economyActions').innerHTML=(nextHousing?'<button id="upgradeHousingBtn" class="action-card"><strong>Améliorer le logement</strong><small>'+nextHousing.name+' • '+nextHousing.buy.toLocaleString('fr-FR')+' B</small></button>':'')+'<button id="investBusinessBtn" class="action-card"><strong>Investir</strong><small>50 000 B → activité productive.</small></button>';
 var uh=$('#upgradeHousingBtn');if(uh)uh.onclick=upgradeHousing;var ib=$('#investBusinessBtn');if(ib)ib.onclick=investBusiness;
 var unlocked=game.achievements&&game.achievements.unlocked?game.achievements.unlocked:{};$('#achievementBadge').textContent=Object.keys(unlocked).length+'/'+ACHIEVEMENTS.length;
 $('#achievementList').innerHTML=ACHIEVEMENTS.map(function(a){var u=unlocked[a.id];return '<div class="achievement-card '+(u?'unlocked':'locked')+'"><strong>'+(u?'✓ ':'○ ')+e(a.name)+'</strong><span>'+e(a.desc)+(u?' • '+e(u.age||''):'')+'</span></div>'}).join('');
 $('#equipmentList').innerHTML=['Tenue de voyage',p.style,p.fruit||'Aucun Fruit'].map(function(x){return '<span class="chip">'+e(x)+'</span>'}).join('');$('#storageStatus').textContent='Autosave local'
}
function specialReqText(t){var q=t.requires||{},a=[];if(q.faction)a.push(q.faction);if(q.race)a.push(q.race);if(q.style)a.push(q.style);if(q.skill)a.push(q.skill+' '+q.skillValue);if(q.stat)a.push(q.stat+' '+q.statValue);return a.join(' • ')}
function renderAb(){var p=game.player,fm=p.fruit?fruitMeta(p.fruit):p.heldFruit?fruitMeta(p.heldFruit):null;$('#powerEstimate').textContent='Puissance ~'+Math.round(power())+' • '+powerRank();$('#statsList').innerHTML=bar(p.stats);$('#skillsList').innerHTML=bar(p.skills);$('#hakiList').innerHTML=Object.keys(p.haki).map(function(k){return '<div class="ability-row"><strong>'+e(k)+'</strong><span>'+(p.haki[k]?'Niveau '+Math.round(p.haki[k]):'Non éveillé')+'</span></div>'}).join('');
 $('#fruitCard').innerHTML=p.fruit?'<strong>'+e(p.fruit)+'</strong><small>'+e(fm.type)+' • rareté '+fm.rarity+'/100</small><div class="mastery-meter"><div style="width:'+p.fruitMastery+'%"></div></div><span>Maîtrise '+Math.round(p.fruitMastery)+'%</span>':p.heldFruit?'<strong>'+e(p.heldFruit)+'</strong><small>'+e(fm.type)+' • rareté '+fm.rarity+'/100</small><p>Fruit conservé, non consommé.</p>':'Aucun Fruit consommé.';
 var prof=TECH[p.style]||TECH['Équilibré'],special=SPECIAL_TECHNIQUES.filter(function(t){var q=t.requires||{},known=p.techniques.indexOf(t.id)>=0;return known||(!q.race||q.race===p.race)&&(!q.style||q.style===p.style)&&(!q.faction||q.faction===p.faction)});$('#techniqueCount').textContent=(p.techniques||[]).length+' maîtrisées';
 var baseCards=prof.map(function(t){var ok=p.techniques.indexOf(t.id)>=0,m=p.techniqueMastery[t.id]||0;return '<div class="technique-card '+(ok?'':'locked')+'"><strong>'+e(t.name)+'</strong><span>'+(ok?'Maîtrise '+Math.round(m)+'%':'Requiert '+e(t.skill)+' '+t.req)+'</span><small>Bonus de combat '+t.bonus+'</small></div>'}).join('');
 var specialCards=special.map(function(t){var ok=p.techniques.indexOf(t.id)>=0,m=p.techniqueMastery[t.id]||0;return '<div class="technique-card '+(ok?'':'locked')+'"><strong>'+e(t.name)+' <em>'+e(t.group||'Spécial')+'</em></strong><span>'+(ok?'Maîtrise '+Math.round(m)+'%':'Requiert '+e(specialReqText(t)))+'</span><small>Technique spéciale • bonus '+t.bonus+'</small></div>'}).join('');
 $('#techniqueList').innerHTML=baseCards+specialCards+(p.fruit&&p.fruitMastery>=20?'<div class="technique-card"><strong>Application du '+e(p.fruit)+'</strong><span>Maîtrise '+Math.round(p.fruitMastery)+'%</span><small>'+(p.fruitAwakened?'Éveil acquis':'Le pouvoir évolue avec la pratique réelle.')+'</small></div>':'');
 $('#hakiApplications').innerHTML=Object.keys(p.hakiApplications).map(function(k){var a=p.hakiApplications[k];return '<div class="haki-app"><strong>'+e(k)+'</strong><small>'+(a.length?e(a.join(' • ')):'Aucune application connue')+'</small></div>'}).join('');
 $('#fruitMasteryCard').innerHTML=p.fruit?'<strong>'+e(p.fruit)+'</strong><p>'+e(fm.type)+' • rareté '+fm.rarity+'/100</p><div class="mastery-meter"><div style="width:'+p.fruitMastery+'%"></div></div><p>'+Math.round(p.fruitMastery)+'% de maîtrise'+(p.fruitAwakened?' • ÉVEIL':'')+'.</p>':p.heldFruit?'<strong>'+e(p.heldFruit)+'</strong><p>'+e(fm.type)+' • tu le conserves sans l’avoir mangé.</p><button id="eatHeldFruit" class="primary-btn small">Le consommer</button>':'<strong>Aucun pouvoir</strong><p>Les Fruits existent physiquement dans le monde et leur rareté influence réellement la probabilité de découverte.</p>';
 var eat=$('#eatHeldFruit');if(eat)eat.onclick=function(){var fr=p.heldFruit;p.heldFruit=null;p.fruit=fr;p.fruitMastery=1;game.world.fruitRegistry[fr]={status:'consumed',holder:p.name};if(game.codex.fruits.indexOf(fr)<0)game.codex.fruits.push(fr);tl('Fruit du démon','Tu décides finalement de consommer le '+fr+'.','major');save();renderAb()};
 $('#combatStyleCard').innerHTML='<strong>'+e(p.style)+'</strong><p>Combat '+Math.round(p.skills.Combat)+' • Sabre '+Math.round(p.skills.Sabre)+' • Tir '+Math.round(p.skills.Tir)+'</p><span class="power-rank">'+powerRank()+'</span>';$('#combatActions').innerHTML='<button id="challengeBtn" class="action-card"><strong>Défi local</strong><small>Affronter un adversaire cohérent avec la zone actuelle.</small></button><button id="martialTrainBtn" class="action-card"><strong>Priorité combat</strong><small>Passer l’activité principale à Entraînement.</small></button>';$('#challengeBtn').onclick=challengeFight;$('#martialTrainBtn').onclick=function(){p.activity='Entraînement';save();renderChar();toast('Activité : Entraînement')};
 if(game.lastCombat){$('#combatReportSection').classList.remove('hidden');var c=game.lastCombat,o=$('#combatOutcome');o.textContent=c.outcome;o.className='badge '+(c.outcome.indexOf('Victoire')>=0?'outcome-win':'outcome-loss');$('#combatReport').innerHTML='<div><span>Puissance</span><strong>'+c.playerPower+' vs '+c.opponentPower+'</strong></div><div><span>Styles</span><strong>'+e(c.playerStyle)+' vs '+e(c.opponentStyle)+'</strong></div><div><span>Terrain</span><strong>'+e(c.terrain)+'</strong></div><div><span>Chance estimée</span><strong>'+c.chance+'%</strong></div><div class="combat-log">'+e(c.log)+'</div>'}else $('#combatReportSection').classList.add('hidden')}
function renderRel(){
 var p=game.player,l=p.life,partner=partnerRelation(),kids=p.children||[],active=game.relations.filter(function(r){return r.status==='active'});
 $('#socialStatusBadge').textContent=l.relationshipStatus;$('#socialSummary').innerHTML='<div><span>Relations</span><strong>'+active.length+'</strong></div><div><span>Statut</span><strong>'+e(l.relationshipStatus)+'</strong></div><div><span>Enfants</span><strong>'+kids.length+'</strong></div><div><span>Génération</span><strong>'+game.dynasty.generation+'</strong></div>';
 $('#romanceBadge').textContent=partner?Math.round((partner.affection+partner.trust+partner.loyalty)/3)+'%':'Célibataire';
 if(partner){$('#romanceCard').innerHTML='<strong>'+e(partner.name)+' • '+e(l.relationshipStatus)+'</strong><p class="romance-state">Affection '+Math.round(partner.affection)+' • confiance '+Math.round(partner.trust)+' • loyauté '+Math.round(partner.loyalty)+' • '+Math.floor(partner.relationshipMonths)+' mois ensemble.</p>';$('#romanceActions').innerHTML='<button id="partnerTimeBtn" class="action-card"><strong>Passer du temps ensemble</strong><small>Renforcer le lien.</small></button>'+(l.relationshipStatus==='En couple'?'<button id="marryBtn" class="action-card"><strong>Se marier</strong><small>Requiert une relation solide depuis au moins un an.</small></button>':'')+'<button id="breakupBtn" class="action-card career-action-warning"><strong>Se séparer</strong><small>Mettre fin à la relation.</small></button>';$('#partnerTimeBtn').onclick=function(){spendTime(partner.id)};var mb=$('#marryBtn');if(mb)mb.onclick=marryPartner;$('#breakupBtn').onclick=breakup}
 else{$('#romanceCard').innerHTML='<strong>Célibataire</strong><p class="romance-state">Une relation peut émerger depuis les personnes que tu rencontres. L’attirance ne garantit jamais la réciprocité.</p>';$('#romanceActions').innerHTML='<div class="career-card"><p>Renforce d’abord une relation ci-dessous avant de tenter une approche romantique.</p></div>'}
 $('#familyBadge').textContent=kids.length+' enfant'+(kids.length>1?'s':'');$('#familyList').innerHTML=kids.length?kids.map(function(c,i){return '<div class="family-card '+(i===0?'heir-highlight':'')+'"><strong>'+e(c.name)+(i===0?' • héritier prioritaire':'')+'</strong><span>'+Math.floor(c.ageMonths/12)+' ans '+Math.floor(c.ageMonths%12)+' mois</span><small>Né à '+e(c.birthplace)+' • lien '+Math.round(c.bond||60)+'/100</small></div>'}).join(''):'<p class="helper-text">Aucun enfant pour le moment.</p>';
 $('#familyActions').innerHTML=partner&&p.ageMonths>=216?'<button id="welcomeChildBtn" class="action-card"><strong>Accueillir un enfant</strong><small>Agrandir la famille si la relation est suffisamment stable.</small></button>':'<div class="career-card"><p>Une famille peut se construire à l’âge adulte dans une relation stable.</p></div>';var wc=$('#welcomeChildBtn');if(wc)wc.onclick=welcomeChild;
 $('#relationCountBadge').textContent=active.length+' actives';$('#relationsList').innerHTML=active.length?active.map(function(r){var isPartner=r.id===l.partnerId;return '<div class="relation-card"><div class="relation-avatar">'+e(r.name[0])+'</div><div class="relation-copy"><strong>'+e(r.name)+(isPartner?' ♥':'')+'</strong><span>'+e(r.role)+' • '+e(r.faction)+'</span><div class="relation-metrics"><span>Aff '+Math.round(r.affection)+'</span><span>Conf '+Math.round(r.trust)+'</span><span>Resp '+Math.round(r.respect)+'</span><span>Loy '+Math.round(r.loyalty)+'</span><span>Riv '+Math.round(r.rivalry)+'</span></div><div class="relation-actions-mini"><button data-time="'+e(r.id)+'">Passer du temps</button>'+(!partner&&p.ageMonths>=216&&r.attraction>=25?'<button data-romance="'+e(r.id)+'">Approche romantique</button>':'')+'</div></div></div>'}).join(''):'<p class="helper-text">Aucune relation importante.</p>';
 $$('[data-time]').forEach(function(b){b.onclick=function(){spendTime(b.dataset.time)}});$$('[data-romance]').forEach(function(b){b.onclick=function(){pursueRomance(b.dataset.romance)}})
}
function diplomacyLabel(v){return v>=60?'Alliance':v>=25?'Coopération':v>-25?'Neutre':v>-60?'Tension':'Hostilité'}
function renderWorld(){var p=game.player,w=game.world,q=inf(),rp=w.pressures[p.region],terr=w.territories[p.island]||{controller:'Inconnu',influence:0,stability:0,contested:false};
 $('#worldHeadline').textContent='Grande Ère de la Piraterie';$('#worldSubhead').textContent='Année '+w.year+', mois '+(Math.floor(w.month)+1)+'. La V1 suit désormais une chronologie mensuelle et causale.';
 $('#worldMeta').innerHTML='<span>Divergence '+Math.round(w.divergence)+'%</span><span>Tension '+Math.round(w.globalTension)+'%</span><span>'+p.visited.length+' lieux visités</span>';
 $('#placeName').textContent=p.travel?'En mer → '+p.travel.destination:p.island;$('#placeDanger').textContent='Danger '+q.danger;
 $('#placeDescription').textContent=p.travel?'Temps restant : '+Math.max(0,p.travel.remaining).toFixed(1)+' mois.':'Région : '+p.region+' • contrôle : '+terr.controller+' • stabilité '+Math.round(terr.stability)+'%.';
 $('#placeTags').innerHTML='<span class="chip">'+e(p.region)+'</span><span class="chip">'+e(terr.controller)+'</span>'+(terr.contested?'<span class="chip">Contesté</span>':'');
 $('#travelStatus').textContent=p.travel?'Traversée':p.region;
 $('#travelOptions').innerHTML=p.travel?'<div class="career-card"><p>Utilise AVANCER pour poursuivre.</p></div>':q.routes.map(function(d){var z=req(d);return '<button class="action-card '+(z[0]?'':'locked')+'" data-d="'+e(d)+'"><strong>'+e(d)+'</strong><small>'+e(inf(d).region)+' • danger '+inf(d).danger+(z[0]?'':' • '+z[1])+'</small></button>'}).join('');
 $$('[data-d]').forEach(function(b){b.onclick=function(){go(b.dataset.d)}});
 $('#regionMap').innerHTML=REG.map(function(r){var v=p.visited.filter(function(x){return inf(x).region===r}).length,t=Object.keys(PL).filter(function(x){return inf(x).region===r}).length,ctrls={};Object.keys(w.territories).filter(function(n){return infStatic(n).region===r}).forEach(function(n){var c=w.territories[n].controller;ctrls[c]=(ctrls[c]||0)+1});var lead=Object.keys(ctrls).sort(function(a,b){return ctrls[b]-ctrls[a]})[0]||'Inconnu';return '<div class="region-card '+(r===p.region?'active':'')+'"><strong>'+e(r)+'</strong><span>'+v+'/'+t+' lieux visités</span><small>Influence dominante : '+e(lead)+'</small></div>'}).join('');
 var activeCrews=w.crews.filter(function(c){return c.status==='active'}),activeActors=w.actors.filter(function(a){return a.status==='active'||a.status==='wounded'}),contested=Object.keys(w.territories).filter(function(n){return w.territories[n].contested}).length;
 $('#worldPulseBadge').textContent=w.globalTension>=70?'Tension critique':w.globalTension>=45?'Tension élevée':w.globalTension>=25?'Instable':'Calme';$('#worldPulse').innerHTML='<div><span>Équipages actifs</span><strong>'+activeCrews.length+'</strong></div><div><span>Conflits actifs</span><strong>'+w.conflicts.length+'</strong></div><div><span>Territoires contestés</span><strong>'+contested+'</strong></div><div><span>Acteurs actifs</span><strong>'+activeActors.length+'</strong></div>';
 var ac=w.actors.filter(function(a){return a.region===p.region&&(a.status==='active'||a.status==='wounded')}).sort(function(a,b){return b.importance-a.importance});$('#localActors').innerHTML=ac.length?ac.map(function(a){return '<div class="actor-row '+(a.status==='wounded'?'inactive':'')+'"><strong>'+e(a.name)+'</strong><div><span>'+e(a.faction)+' • puissance ~'+Math.round(actorPower(a))+' • '+e(a.status)+'</span><small class="actor-goal">'+e(a.goal)+'</small></div></div>'}).join(''):'<p class="helper-text">Aucun acteur majeur identifié dans cette région.</p>';
 var known=p.visited.slice().sort(function(a,b){return (a===p.island?-1:0)-(b===p.island?-1:0)}).slice(0,10);$('#territoryBadge').textContent=terr.controller;$('#territoryList').innerHTML=known.map(function(n){var t=w.territories[n]||{controller:'Inconnu',influence:0,stability:0,contested:false};return '<div class="territory-row '+(t.contested?'contested':'')+'"><div class="territory-head"><strong>'+e(n)+'</strong><span>'+e(t.controller)+'</span></div><div class="territory-meta">'+e(infStatic(n).region)+' • influence '+Math.round(t.influence)+' • stabilité '+Math.round(t.stability)+(t.lastChange?' • dernier changement : '+e(t.lastChange):'')+'</div><div class="territory-meter"><div style="width:'+cl(t.influence,0,100)+'%"></div></div></div>'}).join('')||'<p class="helper-text">Aucun territoire connu.</p>';
 var conflicts=w.conflicts.slice().sort(function(a,b){return (b.region===p.region?1:0)-(a.region===p.region?1:0)||b.intensity-a.intensity}).slice(0,6);$('#conflictBadge').textContent=w.conflicts.length+' actif'+(w.conflicts.length>1?'s':'');$('#conflictList').innerHTML=conflicts.length?conflicts.map(function(c){return '<div class="conflict-card '+(c.intensity>=65?'hot':'')+'"><div class="conflict-head"><strong>'+e(c.location)+'</strong><span>Intensité '+Math.round(c.intensity)+'</span></div><div class="conflict-meta">'+e(c.attacker)+' contre '+e(c.defender)+' • '+e(c.region)+' • '+c.months+' mois</div><div class="conflict-meter"><div style="width:'+cl(c.intensity,0,100)+'%"></div></div></div>'}).join(''):'<p class="helper-text">Aucun conflit majeur actuellement enregistré.</p>';
 var crews=activeCrews.slice().sort(function(a,b){var ar=a.region===p.region?1:0,br=b.region===p.region?1:0;return br-ar||b.power-a.power}).slice(0,7);$('#crewWorldBadge').textContent=activeCrews.length+' actifs';$('#autonomousCrews').innerHTML=crews.length?crews.map(function(c){return '<div class="world-crew-card"><div class="crew-head"><strong>'+e(c.name)+'</strong><span class="crew-status">'+e(c.faction)+'</span></div><div class="crew-meta">'+e(c.region)+' • '+c.members+' membres • puissance '+Math.round(c.power)+(c.bounty?' • prime '+Math.round(c.bounty/1000000)+' M B':'')+' • moral '+Math.round(c.morale)+'%</div><div class="crew-power-meter"><div style="width:'+cl(c.power,0,100)+'%"></div></div></div>'}).join(''):'<p class="helper-text">Aucune force émergente active.</p>';
 var dip=Object.keys(w.diplomacy).map(function(k){return{k:k,v:w.diplomacy[k]}}).sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v)}).slice(0,10);$('#diplomacyGrid').innerHTML=dip.map(function(x){var p2=x.k.split('|'),cls=x.v>24?'diplomacy-positive':x.v<-24?'diplomacy-negative':'diplomacy-neutral';return '<div class="diplomacy-card '+cls+'"><strong>'+e(p2[0])+' ↔ '+e(p2[1])+'</strong><span>'+diplomacyLabel(x.v)+' • '+Math.round(x.v)+'</span></div>'}).join('');
 $('#factionOverview').innerHTML=Object.keys(w.factions).sort(function(a,b){return w.factions[b]-w.factions[a]}).map(function(n){return '<div class="faction-card"><strong>'+e(n)+'</strong><span>Influence mondiale '+Math.round(w.factions[n])+'</span><small>'+diplomacyLabel(diplomacy(p.faction,n))+' avec toi</small></div>'}).join('');$('#regionTitle').textContent=p.region;$('#pressureBars').innerHTML=bar(rp);
 $('#worldNews').innerHTML=game.news.map(function(n){var cls=n.type==='war'?' world-news-war':n.type==='major'?' world-news-major':'';return '<div class="news-item'+cls+'"><strong>'+e(n.title)+'</strong><span>'+e(n.desc)+'</span></div>'}).join('');
 var future=w.canon.filter(function(c){return c.status==='future'}).sort(function(a,b){return canonMonth(a)-canonMonth(b)}),forecast=future.slice(0,4),health=w.divergence<20?'Canon stable':w.divergence<50?'Canon sous tension':w.divergence<75?'Forte divergence':'Chronologie alternative';$('#canonHealthBadge').textContent=health;
 $('#canonForecast').innerHTML=forecast.length?forecast.map(function(c){var missing=(c.required||[]).filter(function(n){var a=canonActor(n);return !a||a.status==='dead'});return '<div class="canon-forecast-item"><span>Année '+c.year+', mois '+(c.month+1)+' • '+e(c.type)+'</span><strong>'+e(c.title)+'</strong><small>'+e(c.location)+' • résistance '+c.resistance+(missing.length?' • chaîne fragilisée : '+e(missing.join(', ')):'')+'</small></div>'}).join(''):'<p class="helper-text">Aucun événement canonique futur enregistré.</p>';
 $('#contentStats').innerHTML='<span>'+Object.keys(PL).length+' lieux</span><span>'+w.actors.length+' acteurs</span><span>'+w.fruits.length+' Fruits</span><span>'+w.canon.length+' événements canoniques</span>';
 $('#divergenceBadge').textContent='Divergence '+Math.round(w.divergence)+'%';$('#canonList').innerHTML=w.canon.slice().sort(function(a,b){return canonMonth(a)-canonMonth(b)}).map(function(c){return '<div class="canon-item canon-'+e(c.status)+'"><span class="status">'+e(c.status)+'</span><strong>'+e(c.title)+'</strong><span>Année '+c.year+', mois '+(c.month+1)+' • '+e(c.location)+' • résistance '+c.resistance+'</span><small>'+e(c.description||'')+'</small></div>'}).join('');
 var co=[].concat(game.codex.people,game.codex.places,game.codex.factions,game.codex.fruits,game.codex.events||[],game.codex.techniques||[]).filter(function(v,i,a){return a.indexOf(v)===i});$('#codexList').innerHTML=co.map(function(x){return '<span class="chip">'+e(x)+'</span>'}).join('')
}
function render(){if(!game)return;showGame();var p=game.player;$('#ageLabel').textContent=age();$('#locationLabel').textContent=p.travel?'→ '+p.travel.destination:p.island;$('#moneyLabel').textContent=Math.floor(p.money).toLocaleString('fr-FR')+' B';$('#playerName').textContent=p.name;$('#avatarInitial').textContent=p.name.charAt(0).toUpperCase();$('#playerSubtitle').textContent=p.race+' • '+p.region+' • '+p.faction;$('#lifeStatus').textContent=p.situation;$('#repPill').textContent=rep();$('#situationTitle').textContent=p.situation;$('#activityValue').textContent=p.activity;$('#factionValue').textContent=p.faction;$('#healthValue').textContent=Math.round(p.health)+'%';$('#energyValue').textContent=Math.round(p.energy)+'%';var d=$('#dangerBadge');d.textContent=p.danger;d.className='danger-badge '+(p.danger==='Élevé'?'high':p.danger==='Moyen'?'medium':'low');$('#conditionChips').innerHTML=p.conditions.length?p.conditions.map(function(c){return '<span class="chip">'+e(c.name)+'</span>'}).join(''):'<span class="chip">Aucune blessure</span>';$('#advanceBtn').disabled=!game.alive||!!game.pending;$('#advanceHint').textContent=game.pending?'Une décision t’attend':game.mission?'Mission : '+game.mission.title:p.travel?'Navigation en cours':'Le moteur choisit la durée adaptée';if(game.pending){$('#attentionCard').classList.remove('hidden');$('#attentionTitle').textContent=game.pending.title;$('#attentionText').textContent=game.pending.text}else $('#attentionCard').classList.add('hidden');renderTimeline();renderChar();renderAb();renderRel();renderWorld();$('#devOutput').textContent=JSON.stringify({seed:game.seed,power:power(),player:p,world:game.world},null,2)}
function deathModal(){var p=game.player,estate=estateValue(),partner=partnerRelation(),kids=(p.children||[]).filter(function(c){return c.status==='active'}),ach=Object.keys(game.achievements.unlocked||{}).length;$('#deathTitle').textContent=p.name+', '+age();$('#deathSummary').innerHTML='<div><span>Cause</span><strong>'+e(game.death.cause)+'</strong></div><div><span>Carrière</span><strong>'+e(p.career)+' • '+e(p.rank)+'</strong></div><div><span>Victoires</span><strong>'+p.wins+'</strong></div><div><span>Lieux</span><strong>'+p.visited.length+'</strong></div><div><span>Patrimoine</span><strong>'+estate.toLocaleString('fr-FR')+' B</strong></div><div><span>Achievements</span><strong>'+ach+'/'+ACHIEVEMENTS.length+'</strong></div>';$('#legacyCard').innerHTML='<strong>Génération '+game.dynasty.generation+'</strong><span>'+(partner?'Conjoint : '+e(partner.name)+' • ':'')+kids.length+' enfant'+(kids.length>1?'s':'')+' • prime maximale '+Math.round(p.highestBounty).toLocaleString('fr-FR')+' B.</span>';var hb=$('#continueHeirBtn');hb.classList.toggle('hidden',!kids.length);if(kids.length){var heir=kids.slice().sort(function(a,b){return b.ageMonths-a.ageMonths})[0];hb.textContent='Continuer avec '+heir.name}$('#deathModal').classList.remove('hidden')}
function toast(m){var t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.add('hidden')},1600)}
function backup(m){backupMode=m;$('#backupModal').classList.remove('hidden');$('#backupTitle').textContent=m==='export'?'Exporter':'Importer';$('#backupText').value=m==='export'?btoa(unescape(encodeURIComponent(JSON.stringify(game)))):'';$('#backupPrimaryBtn').textContent=m==='export'?'Copier':'Importer'}
function bind(){
 $$('.mode-card').forEach(function(b){b.onclick=function(){mode=b.dataset.mode;$$('.mode-card').forEach(function(x){x.classList.toggle('selected',x===b)});$('#customFields').classList.toggle('hidden',mode!=='custom')}});
 $('#newLifeBtn').onclick=function(){make();$('#creationCard').classList.add('hidden');render()};$('#cancelCreate').onclick=function(){$('#creationCard').classList.add('hidden')};$('#advanceBtn').onclick=advance;$('#attentionBtn').onclick=showDecision;$('#homeBtn').onclick=showStart;
 $('#deathHomeBtn').onclick=function(){$('#deathModal').classList.add('hidden');showStart()};$('#continueHeirBtn').onclick=continueWithHeir;$('#deathNewBtn').onclick=function(){localStorage.removeItem(key());$('#deathModal').classList.add('hidden');showStart();$('#creationCard').classList.remove('hidden')};
 $('#timelineFilter').onclick=function(){majorOnly=!majorOnly;renderTimeline()};$$('.nav-item').forEach(function(b){b.onclick=function(){$$('.nav-item').forEach(function(x){x.classList.toggle('active',x===b)});$$('.tab-panel').forEach(function(x){x.classList.toggle('active',x.dataset.panel===b.dataset.tab)});scrollTo(0,0)}});
 $('#devToggle').onclick=function(){if(game)$('#developerPanel').classList.remove('hidden')};$('#closeDev').onclick=function(){$('#developerPanel').classList.add('hidden')};$('#exportSaveBtn').onclick=function(){backup('export')};$('#importSaveBtn').onclick=function(){backup('import')};$('#backupCloseBtn').onclick=function(){$('#backupModal').classList.add('hidden')};
 $('#backupPrimaryBtn').onclick=function(){if(backupMode==='export'){if(navigator.clipboard)navigator.clipboard.writeText($('#backupText').value);toast('Sauvegarde copiée ou prête à copier.')}else try{game=migrate(JSON.parse(decodeURIComponent(escape(atob($('#backupText').value.trim())))));syncCanonicalFruits();save();$('#backupModal').classList.add('hidden');render()}catch(x){toast('Sauvegarde invalide.')}};
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save()});window.addEventListener('pagehide',save)
}
function init(){bind();if(location.protocol!=='file:')$('#localFileWarning').classList.add('hidden');if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.matchMedia('(display-mode: standalone)').matches&&location.protocol==='https:')$('#iosInstallCard').classList.remove('hidden');slots();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){})}
init();
})();