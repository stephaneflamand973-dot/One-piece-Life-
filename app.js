(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var game=null,slot=1,mode='destiny',majorOnly=false,backupMode='export',P='opl-v05-';
var ORIG=['East Blue','North Blue','West Blue','South Blue'],REG=ORIG.concat(['Grand Line','New World']);
var ST=['Force','Vitesse','Agilité','Endurance','Résistance','Réflexes','Discipline','Volonté'];
var SK=['Combat','Sabre','Tir','Navigation','Médecine','Commandement','Discrétion','Science'];
var TRAINING_PROFILES={
 Grandir:{keys:['Endurance','Réflexes'],desc:'Développement naturel : Endurance & Réflexes'},
 Études:{keys:['Discipline','Science'],desc:'Discipline & Science'},
 Entraînement:{keys:['Force','Combat'],desc:'Force & Combat'},
 Renforcement:{keys:['Force','Résistance'],desc:'Force & Résistance'},
 Mobilité:{keys:['Vitesse','Agilité'],desc:'Vitesse & Agilité'},
 'Condition physique':{keys:['Endurance','Réflexes'],desc:'Endurance & Réflexes'},
 Mental:{keys:['Volonté','Discipline'],desc:'Volonté & Discipline'},
 Navigation:{keys:['Navigation','Endurance'],desc:'Navigation & Endurance'},
 Sabre:{keys:['Sabre','Réflexes'],desc:'Sabre & Réflexes'},
 Tir:{keys:['Tir','Réflexes'],desc:'Tir & Réflexes'},
 Médecine:{keys:['Médecine','Discipline'],desc:'Médecine & Discipline'},
 Commandement:{keys:['Commandement','Volonté'],desc:'Commandement & Volonté'},
 Discrétion:{keys:['Discrétion','Agilité'],desc:'Discrétion & Agilité'},
 Science:{keys:['Science','Discipline'],desc:'Science & Discipline'},
 'Formation Marine':{keys:['Discipline','Combat'],desc:'Discipline & Combat'},
 'Formation Pirates':{keys:['Combat','Navigation'],desc:'Combat & Navigation'},
 'Formation Révolutionnaires':{keys:['Discrétion','Commandement'],desc:'Discrétion & Commandement'},
 'Formation Gouvernement':{keys:['Discipline','Discrétion'],desc:'Discipline & Discrétion'}
};

var SIMPLE_FOCUS={
 'Équilibre':{label:'Équilibre',desc:'Le moteur corrige automatiquement tes points faibles sans micro-gestion.'},
 'Combat':{label:'Combat',desc:'Travaille automatiquement ton style de combat et les qualités physiques qui lui correspondent.'},
 'Forme':{label:'Forme',desc:'Renforce automatiquement tes qualités physiques les moins développées.'},
 'Carrière':{label:'Carrière',desc:'Développe les compétences réellement utiles à ta spécialisation et à ta progression professionnelle.'},
 'Pouvoirs':{label:'Pouvoirs',desc:'Concentre la période sur le Haki, le Fruit du démon et la volonté.'}
};
var LEGACY_FOCUS={
 'Études':'Carrière','Entraînement':'Combat','Renforcement':'Forme','Mobilité':'Forme','Condition physique':'Forme','Mental':'Équilibre','Sabre':'Combat','Tir':'Combat','Médecine':'Carrière','Commandement':'Carrière','Discrétion':'Carrière','Science':'Carrière',
 'Formation Marine':'Carrière','Formation Pirates':'Carrière','Formation Révolutionnaires':'Carrière','Formation Gouvernement':'Carrière','Haki Observation':'Pouvoirs','Haki Armement':'Pouvoirs','Haki Conquérant':'Pouvoirs','Maîtrise du Fruit':'Pouvoirs'
};
function keyValue(k){var p=game.player;return p.stats&&p.stats[k]!=null?p.stats[k]:p.skills&&p.skills[k]!=null?p.skills[k]:0}
function keyCap(k){return Math.max(1,game.player.caps&&game.player.caps[k]||100)}
function weakestOf(keys,count){return keys.slice().sort(function(a,b){return keyValue(a)/keyCap(a)-keyValue(b)/keyCap(b)}).slice(0,count||1)}
function styleFocusKeys(){
 var p=game.player;if(p.style==='Sabreur')return['Sabre','Réflexes'];if(p.style==='Tireur')return['Tir','Réflexes'];if(p.style==='Mobile / esquive')return['Combat','Agilité'];if(p.style==='Corps-à-corps')return['Combat','Force'];return['Combat','Réflexes']
}
function careerFocusKeys(){
 var p=game.player,profile=specProfile(p.specialization);if(profile)return weakestOf(profile.keys,2);
 var factionMap={Marine:['Discipline','Combat'],Pirates:['Combat','Navigation'],'Chasseur de primes':['Réflexes','Discrétion'],Révolutionnaires:['Discrétion','Commandement'],Gouvernement:['Discipline','Discrétion'],Civil:['Discipline','Science']};
 return factionMap[p.faction]||['Discipline','Science']
}
function simpleFocusKeys(a){
 if(a==='Équilibre')return[weakestOf(ST,1)[0],weakestOf(SK,1)[0]];
 if(a==='Combat')return styleFocusKeys();
 if(a==='Forme')return weakestOf(['Force','Vitesse','Agilité','Endurance','Résistance','Réflexes'],2);
 if(a==='Carrière')return careerFocusKeys();
 return[]
}
function hasPowerFocus(){
 var p=game.player;if(p.fruit)return true;if(Object.keys(p.haki||{}).some(function(k){return p.haki[k]>0}))return true;
 return p.ageMonths>=144&&Math.max(p.latent.Observation||0,p.latent.Armement||0,p.latent.Conquérant||0)>55
}
function focusOptions(){
 var p=game.player;if(p.ageMonths<72)return['Grandir'];var out=['Équilibre','Combat','Forme'];if(p.ageMonths>=180||p.career!=='Aucune')out.push('Carrière');if(hasPowerFocus())out.push('Pouvoirs');return out
}
function recommendedFocus(){
 var p=game.player;if(p.ageMonths<72)return'Grandir';if(p.health<72||p.energy<45)return'Forme';if(p.ambition==='Devenir puissant')return'Combat';if(p.ambition==='Faire fortune'&&p.career!=='Aucune')return'Carrière';if(p.specialization&&careerExpertise(p.specialization)<32)return'Carrière';if(hasPowerFocus()&&(p.fruit&&p.fruitMastery<30||Object.keys(p.haki).some(function(k){return p.haki[k]>0&&p.haki[k]<25})))return'Pouvoirs';return'Équilibre'
}
function normalizeActivityFocus(p){
 if(!p)return;if(p.travel||game&&game.mission)return;
 if(LEGACY_FOCUS[p.activity])p.activity=LEGACY_FOCUS[p.activity];
 if(p.activity==='Navigation'&&p.situation!=='Navigation')p.activity=p.career!=='Aucune'?'Carrière':'Équilibre';
 if(p.activity!=='Grandir'&&p.activity!=='Explorer'&&!SIMPLE_FOCUS[p.activity])p.activity=p.ageMonths<72?'Grandir':recommendedFocus()
}

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
 {id:'flagship',name:'Navire de commandement',desc:'Commander une Frégate ou un Galion.'},
 {id:'escape',name:'Les murs ne suffisent pas',desc:'Réussir une évasion de prison.'},
 {id:'hunter',name:'Chasseur confirmé',desc:'Capturer cinq cibles recherchées.'},
 {id:'domain',name:'Mon pavillon ici',desc:'Établir un premier domaine personnel.'},
 {id:'regional-power',name:'Puissance régionale',desc:'Contrôler au moins trois zones.'},
 {id:'fleet',name:'Flotte sous influence',desc:'Rallier trois équipages autonomes.'},
 {id:'emperor',name:'Au sommet des mers',desc:'Être reconnu comme Empereur des mers.'},
 {id:'campaign',name:'Tambours de guerre',desc:'Lancer une première campagne stratégique.'},
 {id:'strategist',name:'Stratège des mers',desc:'Remporter trois guerres auxquelles ton camp a participé.'},
 {id:'merchant',name:'Marchand des mers',desc:'Cumuler 100 000 B de profit commercial.'},
 {id:'smuggler',name:'Sous le nez de la Marine',desc:'Réussir trois passages de contrebande.'},
 {id:'mentor-bond',name:'Sous l’aile d’un maître',desc:'Effectuer cinq entraînements avec un mentor.'},
 {id:'nemesis',name:'Rivalité légendaire',desc:'Disputer cinq duels contre le même rival.'},
 {id:'known-recruit',name:'Plus qu’une connaissance',desc:'Recruter une relation importante dans ton organisation.'},
 {id:'explorer',name:'Grand voyageur',desc:'Visiter au moins dix lieux différents.'},
 {id:'discoverer',name:'Œil d’explorateur',desc:'Enregistrer dix découvertes locales.'},
 {id:'cartographer',name:'Je connais ces mers',desc:'Maîtriser la connaissance de trois îles.'},
 {id:'story-first',name:'Un fil se noue',desc:'Résoudre un premier fil narratif.'},
 {id:'story-weaver',name:'Une vie pleine d’histoires',desc:'Résoudre dix fils narratifs.'},
 {id:'story-decisions',name:'À la croisée des chemins',desc:'Prendre quinze décisions narratives.'}
];
function normalizeRelation(g,r,i){
 r=r||{};var base=H(String(g.seed||1)+':rel:'+String(r.name||i)),p=g.player||{},playerAge=p.ageMonths||0;
 r.id=r.id||('rel-'+i+'-'+(base%100000));r.name=r.name||PEOPLE_NAMES[base%PEOPLE_NAMES.length];r.role=r.role||'connaissance';r.type=r.type||'social';
 r.affection=cl(r.affection==null?35+(base%41):r.affection,0,100);r.respect=cl(r.respect==null?30+((base>>>3)%46):r.respect,0,100);r.trust=cl(r.trust==null?30+((base>>>5)%41):r.trust,0,100);
 r.fear=cl(r.fear||0,0,100);r.loyalty=cl(r.loyalty==null?35+((base>>>7)%36):r.loyalty,0,100);r.rivalry=cl(r.rivalry||0,0,100);r.attraction=cl(r.attraction==null?20+((base>>>9)%61):r.attraction,0,100);
 r.monthsKnown=r.monthsKnown||0;r.relationshipMonths=r.relationshipMonths||0;r.status=r.status||'active';r.location=r.location||null;r.faction=r.faction||'Civil';
 r.canonical=!!r.canonical;r.actorName=r.actorName||null;r.npcAgeMonths=r.npcAgeMonths==null?Math.max(0,playerAge-48+((base>>>10)%145)):r.npcAgeMonths;if(r.role==='mentor'||r.role==='partenaire'||r.type==='partner')r.npcAgeMonths=Math.max(216,r.npcAgeMonths);
 r.npcPower=cl(r.npcPower==null?12+((base>>>12)%39)+(r.role==='mentor'?18:r.role==='rival'?8:0):r.npcPower,1,100);
 r.npcPotential=cl(r.npcPotential==null?Math.max(r.npcPower+8,58+((base>>>15)%40)):r.npcPotential,r.npcPower,100);
 r.npcSpecialty=r.npcSpecialty||['Combat','Navigation','Médecine','Sabre','Discrétion','Commandement'][(base>>>18)%6];
 r.npcTrajectory=r.npcTrajectory||['Stable','Ascension','Ascension','Instable','Stable'][(base>>>21)%5];
 r.npcAmbition=r.npcAmbition||['Devenir plus fort','Explorer le monde','Faire fortune','Servir sa faction','Protéger ses proches'][(base>>>24)%5];
 r.careerLevel=cl(r.careerLevel==null?Math.floor(r.npcPower/18):r.careerLevel,0,6);r.npcWins=r.npcWins||0;r.npcLosses=r.npcLosses||0;r.rivalWins=r.rivalWins||0;r.rivalLosses=r.rivalLosses||0;
 r.mentorSessions=r.mentorSessions||0;r.favorBalance=r.favorBalance||0;r.injuryMonths=r.injuryMonths||0;r.lastDuelAge=r.lastDuelAge==null?-999:r.lastDuelAge;r.lastCanonInteractionAge=r.lastCanonInteractionAge==null?-999:r.lastCanonInteractionAge;r.challengeReady=!!r.challengeReady;r.joinedOrganization=!!r.joinedOrganization;r.peerRecognized=!!r.peerRecognized;r.rivalResolved=!!r.rivalResolved;
 r.memories=Array.isArray(r.memories)?r.memories.slice(0,12):[];r.region=r.region||(r.location&&PL[r.location]?PL[r.location][0]:(p.region||p.origin||'East Blue'));return r
}

function addRelationMemory(r,text,type){
 if(!r)return;r.memories=r.memories||[];var stamp=game&&game.player?age():'?';if(r.memories[0]&&r.memories[0].text===text)return;r.memories.unshift({text:text,type:type||'social',age:stamp});r.memories=r.memories.slice(0,12)
}
function relationForActor(name){return game.relations.find(function(r){return r.actorName===name||(r.canonical&&r.name===name)})||null}
function npcCareerRank(r){
 if((r.npcAgeMonths||0)<144)return'Enfance';if((r.npcAgeMonths||0)<180)return'Formation';if(r.faction==='Indépendant')return r.canonical?'Indépendant reconnu':'Indépendant';
 var cfg=CAREERS[r.faction]||CAREERS.Civil,track=(r.faction==='Gouvernement'?careerTrack('Gouvernement',null):cfg.ranks)||[];if(!track.length)return r.role||'Indépendant';return track[Math.min(track.length-1,Math.max(0,r.careerLevel||0))].n
}
function npcRegion(r){if(r.canonical&&r.actorName){var a=canonActor(r.actorName);if(a)return a.region}return r.region||(r.location&&PL[r.location]?PL[r.location][0]:game.player.region)}
function npcNearby(r){
 var p=game.player;if(!r||r.status!=='active')return false;if(r.joinedOrganization||r.id===p.life.partnerId)return true;if(p.travel)return false;if(r.canonical)return npcRegion(r)===p.region;if(r.location)return r.location===p.island;return npcRegion(r)===p.region
}
function canonicalFreedom(r){if(!r.canonical)return true;var a=canonActor(r.actorName||r.name),need=a?Math.round((a.importance||90)*.48):48;return game.world.divergence>=need}
function bondCanonicalActor(a,context){
 if(!a)return null;var r=relationForActor(a.name),p=game.player;
 if(!r){var hostile=diplomacy(p.faction,a.faction)<-35,pow=actorPower(a),role=hostile?'rival':'connaissance';r=normalizeRelation(game,{id:'canon-rel-'+H(a.name),name:a.name,role:role,type:'canonical',canonical:true,actorName:a.name,faction:a.faction,region:a.region,location:null,npcAgeMonths:Math.max(0,((game.world.year||0)-(a.birthYear||0))*12+(game.world.month||0)),npcPower:pow,npcPotential:a.peak,respect:hostile?35:55,trust:hostile?20:42,loyalty:35,attraction:10,rivalry:hostile?48:0,npcAmbition:a.goal,mentorPotential:a.faction===p.faction&&pow>power()+18},game.socialSeq++);game.relations.push(r);addRelationMemory(r,'Première rencontre dans '+p.region+'.','canon')}
 else{r.faction=a.faction;r.region=a.region;r.npcAgeMonths=Math.max(0,((game.world.year||0)-(a.birthYear||0))*12+(game.world.month||0));r.npcPower=actorPower(a);r.status=a.status==='dead'?'dead':a.status==='wounded'?'wounded':'active';r.monthsKnown=Math.max(r.monthsKnown,1)}
 if(context){addRelationMemory(r,context,'canon');r.lastCanonInteractionAge=p.ageMonths}return r
}
function relationPower(r){if(r.canonical&&r.actorName){var a=canonActor(r.actorName);if(a)return actorPower(a)}return r.npcPower||10}
function relationGrowthRate(r){
 var base=r.npcTrajectory==='Ascension'?.09:r.npcTrajectory==='Instable'?.045:r.npcTrajectory==='Déclin'?.018:.055;if(r.role==='rival')base*=1.18;if(r.role==='mentor')base*=.72;return base
}
function moveNpc(r){
 var cur=npcRegion(r),links=REGION_LINKS[cur]||[];if(!links.length)return;var next=pk(links,'npc'),places=Object.keys(PL).filter(function(n){return PL[n][0]===next});r.region=next;r.location=places.length?pk(places,'npc'):null;addRelationMemory(r,'Part pour '+next+'.','travel');if(next===game.player.region&&r.monthsKnown>=6){r.trust=cl(r.trust+1,0,100);addRelationMemory(r,'Vos routes se croisent à nouveau dans '+next+'.','reunion');tl('Retrouvailles',r.name+' réapparaît dans ta région.','major')}
}
function npcTick(m){
 var p=game.player;
 game.relations.forEach(function(r){
  r=normalizeRelation(game,r,0);if(r.status==='dead')return;r.npcAgeMonths+=m;
  if(r.canonical&&r.actorName){var a=canonActor(r.actorName);if(a){var was=r.status;r.faction=a.faction;r.region=a.region;r.npcPower=actorPower(a);r.status=a.status==='dead'?'dead':a.status==='wounded'?'wounded':'active';if(was!=='dead'&&r.status==='dead')addRelationMemory(r,'Sa trajectoire s’achève dans le monde vivant.','death')}return}
  if(r.injuryMonths>0){r.injuryMonths-=m;if(r.injuryMonths<=0){r.injuryMonths=0;r.status='active';addRelationMemory(r,'Se remet de ses blessures.','recovery')}return}
  if(r.status!=='active')return;
  if(r.id===p.life.partnerId){r.region=p.region;r.location=p.island}
  if(r.joinedOrganization){var org=p.organization,mem=org&&org.members.find(function(m){return m.linkedRelationId===r.id});if(mem&&mem.status==='active'){r.region=p.region;r.location=p.island;r.npcPower=cl(Math.max(r.npcPower,mem.power),1,100);mem.power=r.npcPower;r.injuryMonths=mem.injuryMonths||0;return}else{r.joinedOrganization=false;if(r.type==='organization')r.type='social';addRelationMemory(r,'N’appartient plus à ton organisation.','organization')}}
  var gap=Math.max(0,r.npcPotential-r.npcPower),ageFactor=r.npcAgeMonths<144?.42:r.npcAgeMonths<180?.68:1,growth=gap/100*relationGrowthRate(r)*m*5*ageFactor;r.npcPower=cl(r.npcPower+growth,1,r.npcPotential);
  if(r.npcTrajectory==='Instable'&&R('npc')<.008*m)r.npcPower=cl(r.npcPower-(1+R('npc')*3),1,r.npcPotential);
  if(r.npcAgeMonths>=180&&R('npc')<.018*m&&r.careerLevel<6){r.careerLevel++;r.respect=cl(r.respect+2,0,100);addRelationMemory(r,'Progresse dans sa carrière : '+npcCareerRank(r)+'.','career')}
  var localDanger=35;var localPlaces=Object.keys(PL).filter(function(n){return PL[n][0]===npcRegion(r)});if(localPlaces.length)localDanger=localPlaces.reduce(function(a,n){return a+PL[n][1]},0)/localPlaces.length;var youth=r.npcAgeMonths<180,incidentChance=r.npcAgeMonths<144?0:.004*m*(.7+localDanger/70)*(youth?.45:1);if(R('npc')<incidentChance){var effectiveDanger=youth?localDanger*.55:localDanger,odds=cl(.48+(r.npcPower-effectiveDanger)/130,.12,.9);if(R('npc')<odds){r.npcWins++;r.npcPower=cl(r.npcPower+.3+R('npc')*.8,1,r.npcPotential);addRelationMemory(r,youth?'Se distingue lors d’une épreuve risquée de jeunesse.':'Surmonte un affrontement dangereux pendant son propre voyage.','incident')}else{r.npcLosses++;r.injuryMonths=youth?1:1+Math.floor(R('npc')*4);r.status='wounded';addRelationMemory(r,youth?'Se blesse lors d’une épreuve de jeunesse.':'Est blessé lors d’un incident autonome.','injury');return}}
  if(r.npcAgeMonths>=180&&r.id!==p.life.partnerId&&R('npc')<.012*m)moveNpc(r);
  if(r.role==='rival'&&r.npcAgeMonths>=144&&p.ageMonths>=144&&r.rivalry>=55&&npcNearby(r)&&p.ageMonths-r.lastDuelAge>=6&&R('npc')<.035*m){r.challengeReady=true;addRelationMemory(r,'Te provoque pour mesurer vos progrès.','rival')}
  if(r.role==='mentor'&&power()>r.npcPower+15&&r.mentorSessions>=3&&!r.peerRecognized){r.peerRecognized=true;r.respect=cl(r.respect+8,0,100);addRelationMemory(r,'Te reconnaît désormais comme un pair.','mentor')}
  var years=r.npcAgeMonths/12,dip=(r.faction==='Civil'||r.faction==='Indépendant'||r.faction===p.faction)?0:diplomacy(p.faction,r.faction),protectedBond=r.id===p.life.partnerId||r.type==='family'||r.role==='parent'||r.role==='frère / sœur';
  if(!protectedBond&&dip<=-55){var resilience=.35+.65*(1-r.trust/100);r.trust=cl(r.trust-.045*m*resilience,0,100);r.rivalry=cl(r.rivalry+.06*m*resilience,0,100);if(!r.canonical&&r.role!=='mentor'&&r.role!=='rival'&&r.trust<28&&r.rivalry>=62){r.role='rival';addRelationMemory(r,'Les tensions entre vos factions finissent par rendre votre opposition personnelle.','rival')}}
  else if(dip>=55&&npcNearby(r)){r.trust=cl(r.trust+.025*m,0,100);r.respect=cl(r.respect+.02*m,0,100)}
  if((r.favorBalance||0)<-2){r.trust=cl(r.trust-.12*m*Math.abs(r.favorBalance),0,100);r.loyalty=cl(r.loyalty-.08*m*Math.abs(r.favorBalance),0,100)}if(years>72&&R('npc')<Math.pow((years-70)/38,2)*.002*m){r.status='dead';if(r.joinedOrganization&&p.organization){var dm=p.organization.members.find(function(mem){return mem.linkedRelationId===r.id&&mem.status==='active'});if(dm)dm.status='dead'}r.joinedOrganization=false;addRelationMemory(r,'Décède après une longue vie.','death');if(r.id===p.life.partnerId){p.life.partnerId=null;p.life.relationshipStatus='En deuil';tl('Deuil',r.name+' est décédé. Ta vie familiale en est profondément marquée.','major')}else tl('Une relation disparaît',r.name+' est décédé.','major')}
 })
}
function askMentorship(id){
 var p=game.player,r=relationById(id);if(!r||!npcNearby(r)||r.status!=='active')return toast('Cette personne n’est pas disponible dans ta région.');if(r.role==='mentor')return toast(r.name+' est déjà ton mentor.');if(relationPower(r)<power()+8)return toast('Cette personne n’a pas assez d’avance sur toi pour devenir un mentor crédible.');if(r.respect<55||r.trust<38)return toast('Il faut davantage de respect et de confiance.');if(!canonicalFreedom(r))return toast('Sa trajectoire canonique reste encore trop contrainte par le monde.');if(!useSocialAction())return;
 var chance=cl(.35+r.respect/220+r.trust/300,.25,.9);if(R('npc')<chance){r.role='mentor';r.rivalry=cl(r.rivalry-10,0,100);r.respect=cl(r.respect+5,0,100);addRelationMemory(r,'Accepte de devenir ton mentor.','mentor');tl('Mentorat',r.name+' accepte de guider ta progression.','major')}else{r.respect=cl(r.respect-2,0,100);addRelationMemory(r,'Refuse pour l’instant de devenir ton mentor.','mentor')}save();render()
}
function trainWithMentor(id){
 var p=game.player,r=relationById(id);if(!r||r.role!=='mentor'||!npcNearby(r)||r.status!=='active')return toast('Ton mentor doit être actif dans ta région.');if(!useSocialAction())return;
 var skill=r.npcSpecialty||'Combat',before=p.skills[skill]||0,peer=!!r.peerRecognized,gained=gain(skill,(peer?.65:1.4)+Math.max(0,relationPower(r)-power())*(peer?.006:.018)+R('npc')*(peer?.35:.8));r.mentorSessions++;r.respect=cl(r.respect+(peer?.5:1.5),0,100);r.trust=cl(r.trust+1,0,100);
 var cap=p.caps[skill]||90,abs=p.absoluteCaps&&p.absoluteCaps[skill]!=null?p.absoluteCaps[skill]:100;if(!peer&&before>=cap-.8&&cap<abs&&r.respect>=72&&r.trust>=55&&R('npc')<.18){var oldCap=cap;p.caps[skill]=cl(cap+1+Math.floor(R('npc')*2),cap,abs);migrateProgression(game,p).breakthroughs.push({age:age(),key:skill,from:oldCap,to:p.caps[skill],context:'mentor'});migrateProgression(game,p).breakthroughs=migrateProgression(game,p).breakthroughs.slice(-20);addRelationMemory(r,'T’aide à dépasser une limite en '+skill+'.','breakthrough');tl('Percée avec un mentor',r.name+' t’aide à repousser ton plafond en '+skill+'.','major')}else if(peer){addRelationMemory(r,'Vous vous entraînez désormais comme deux pairs en '+skill+'.','peer');tl('Entraînement entre pairs','Avec '+r.name+', la relation de maître à élève a laissé place à un échange plus équilibré.')}else{addRelationMemory(r,'Séance de '+skill+' partagée.','mentor');tl('Entraînement avec '+r.name,'Ta maîtrise de '+skill+' progresse de '+gained.toFixed(1)+'.')}
 save();render()
}
function declareRivalry(id){
 var r=relationById(id);if(!r||r.id===game.player.life.partnerId||r.status!=='active')return;if(!npcNearby(r))return toast('Cette personne n’est pas dans ta région.');if(r.canonical&&!canonicalFreedom(r))return toast('Le canon résiste encore à une rivalité personnelle aussi importante.');if(!useSocialAction())return;r.role='rival';r.rivalry=Math.max(r.rivalry,50);r.respect=cl(r.respect+3,0,100);addRelationMemory(r,'Votre relation devient une rivalité assumée.','rival');tl('Nouvelle rivalité',r.name+' devient un rival récurrent.','major');save();render()
}
function rivalStage(r){
 var total=(r.rivalWins||0)+(r.rivalLosses||0);if(r.role!=='rival')return'';if(total>=5&&r.rivalry>=78)return'Némésis';if(total>=2)return'Rival confirmé';return'Rivalité naissante'
}
function reconcileRival(id){
 var r=relationById(id);if(!r||r.role!=='rival'||!npcNearby(r)||r.status!=='active')return toast('Ce rival n’est pas disponible ici.');var total=(r.rivalWins||0)+(r.rivalLosses||0);if(total<3||r.respect<65||r.trust<40||r.affection<40)return toast('Votre rivalité n’a pas encore assez mûri pour devenir autre chose.');if(!useSocialAction())return;
 r.role='ami';r.rivalResolved=true;r.rivalry=cl(r.rivalry-45,0,100);r.affection=cl(r.affection+8,0,100);r.trust=cl(r.trust+6,0,100);addRelationMemory(r,'Après plusieurs duels, votre rivalité se transforme en respect durable.','reconciliation');tl('Rivalité apaisée',r.name+' n’est plus seulement un adversaire : un respect véritable s’installe.','major');save();render()
}
function challengeRival(id){
 var p=game.player,r=relationById(id);if(!r||r.role!=='rival'||r.status!=='active'||!npcNearby(r))return toast('Ce rival n’est pas disponible ici.');if(p.ageMonths<144||r.npcAgeMonths<144)return toast('Cette rivalité est encore trop jeune pour devenir un véritable duel.');if(r.canonical&&!canonicalFreedom(r))return toast('Sa trajectoire canonique ne permet pas encore un duel personnel de cette importance.');if(p.health<45)return toast('Ta santé est trop basse pour provoquer un rival.');if(p.ageMonths-r.lastDuelAge<3)return toast('Votre dernier duel est encore trop récent.');if(!useSocialAction())return;
 var danger=cl(relationPower(r),12,98),ok=fight(danger,'Duel contre '+r.name);r.lastDuelAge=p.ageMonths;r.challengeReady=false;r.rivalry=cl(r.rivalry+2,0,100);
 if(!game.alive)return;if(ok){r.rivalLosses++;r.respect=cl(r.respect+6,0,100);r.affection=cl(r.affection+1,0,100);addRelationMemory(r,'Tu remportes un duel contre lui/elle.','rival')}else{r.rivalWins++;r.respect=cl(r.respect+3,0,100);addRelationMemory(r,'Remporte un duel contre toi.','rival')}
 if(r.rivalLosses>=3&&r.rivalLosses>=r.rivalWins+2){r.npcTrajectory='Ascension';r.npcPotential=cl(Math.max(r.npcPotential,r.npcPower+8),0,100)}var stage=rivalStage(r);if(stage==='Némésis'&&!r.nemesisRecognized){r.nemesisRecognized=true;r.rivalry=cl(Math.max(r.rivalry,82),0,100);addRelationMemory(r,'Votre rivalité est désormais connue comme une véritable némésis.','nemesis');tl('Némésis',r.name+' devient ton adversaire personnel le plus marquant.','major')}
 save();render()
}
function relationOrgRole(r){
 var roles=(ORG_CONFIG[game.player.faction]||ORG_CONFIG.Civil).roles,s=r.npcSpecialty;if(s==='Navigation')return roles.find(function(x){return /Navig/i.test(x)})||roles[0];if(s==='Médecine')return roles.find(function(x){return /Médec/i.test(x)})||roles[0];if(s==='Discrétion')return roles.find(function(x){return /Infil|Renseig|Investig/i.test(x)})||roles[0];if(s==='Commandement')return roles.find(function(x){return /Quartier|Logist|Associ/i.test(x)})||roles[0];return roles.find(function(x){return /Combat|Combatt|Duell|Agent/i.test(x)})||roles[0]
}
function recruitKnownRelation(id){
 var p=game.player,r=relationById(id),o=ensureOrganization();if(!r||!o)return;if(r.npcAgeMonths<180)return toast('Cette relation est encore trop jeune pour rejoindre une organisation professionnelle.');if(r.canonical)return toast('Les personnages canoniques restent autonomes dans cette version.');if(r.joinedOrganization)return toast(r.name+' appartient déjà à ton organisation.');if(o.authority!=='leader')return toast('Il faut diriger ton organisation.');if(!npcNearby(r))return toast(r.name+' n’est pas dans ta région.');if(r.faction!==p.faction&&r.faction!=='Civil')return toast('Sa faction est incompatible avec ton organisation.');if(r.trust<58||r.loyalty<52||r.respect<42)return toast('Le lien n’est pas assez solide pour un recrutement.');if(o.members.filter(function(m){return m.status==='active'}).length>=organizationCapacity())return toast('Ton organisation a atteint sa capacité.');if(!useOrganizationAction())return;
 var role=relationOrgRole(r),member={id:'orgm-rel-'+r.id,name:r.name,role:role,power:relationPower(r),loyalty:r.loyalty,morale:cl((r.affection+r.trust)/2,35,95),months:0,injuryMonths:r.injuryMonths||0,status:'active',origin:r.region,linkedRelationId:r.id};o.members.push(member);r.joinedOrganization=true;r.faction=p.faction;r.type='organization';r.location=p.island;r.region=p.region;r.loyalty=cl(r.loyalty+8,0,100);addRelationMemory(r,'Rejoint '+o.name+' comme '+role+'.','organization');tl('Recrutement relationnel',r.name+' rejoint '+o.name+' comme '+role+'.','major');save();render()
}

function favorLabel(r){var v=r.favorBalance||0;return v>0?'te doit '+v+' service'+(v>1?'s':''):v<0?'tu lui dois '+Math.abs(v)+' service'+(v<-1?'s':''):'aucune dette'}
function helpRelation(id){
 var p=game.player,r=relationById(id);if(!r||r.status!=='active'||!npcNearby(r))return toast('Cette personne n’est pas disponible ici.');if(!useSocialAction())return;var cost=p.ageMonths>=180?Math.round(500+relationPower(r)*22):0;if(p.money<cost){p.life.socialActions++;return toast('Il te manque des Berry pour l’aider concrètement.')}p.money-=cost;r.favorBalance=cl((r.favorBalance||0)+1,-5,5);r.trust=cl(r.trust+4,0,100);r.loyalty=cl(r.loyalty+3,0,100);r.affection=cl(r.affection+2,0,100);addRelationMemory(r,'Tu l’aides lorsqu’il/elle en avait besoin.','favor');tl('Service rendu','Tu aides '+r.name+' et renforces votre confiance.');save();render()
}
function askRelationFavor(id){
 var p=game.player,r=relationById(id);if(!r||r.status!=='active'||!npcNearby(r))return toast('Cette personne n’est pas disponible ici.');if(r.trust<48)return toast('La confiance est insuffisante pour demander un service.');var balance=r.favorBalance||0;if(balance<=-4)return toast('Tu lui dois déjà trop de services. Rends-lui la pareille avant de demander davantage.');if(!useSocialAction())return;var ch=cl(.40+r.trust/260+r.loyalty/360+Math.max(0,balance)*.09+Math.min(0,balance)*.08,.12,.95);
 if(R('npc')>=ch){r.trust=cl(r.trust-3,0,100);addRelationMemory(r,'Refuse une demande de service trop lourde.','favor');tl('Service refusé',r.name+' ne peut pas t’aider cette fois. Aucune dette nouvelle n’est créée.');save();render();return}
 r.favorBalance=cl(balance-1,-5,5);r.loyalty=cl(r.loyalty+1,0,100);var spec=r.npcSpecialty||'Combat',msg='';
 if(r.npcAgeMonths<180){p.energy=cl(p.energy+5,0,100);msg='t’aide dans une petite tâche du quotidien'}
 else if(spec==='Médecine'){p.health=cl(p.health+16,0,100);if(p.conditions.length&&R('npc')<.55)p.conditions.shift();msg='t’aide à récupérer physiquement'}
 else if(spec==='Discrétion'){var j=migrateJustice(p);j.regionalHeat[p.region]=cl((j.regionalHeat[p.region]||0)-12,0,100);msg='fait jouer ses contacts pour diminuer la pression locale'}
 else if(spec==='Navigation'){p.energy=cl(p.energy+18,0,100);msg='t’aide à préparer ta prochaine traversée'}
 else if(spec==='Commandement'){p.reputation=cl(p.reputation+3,0,100);msg='met sa réputation au service de ton réseau'}
 else{var support=700+Math.round(relationPower(r)*18);p.money+=support;msg='te fournit '+support.toLocaleString('fr-FR')+' B de soutien'}
 addRelationMemory(r,'Accepte de te rendre un service : '+msg+'.','favor');tl('Service de '+r.name,r.name+' '+msg+'.','major');save();render()
}
function approachCanonicalActor(name){
 var p=game.player,a=canonActor(name);if(p.travel)return toast('Impossible d’organiser cette rencontre pendant une traversée.');if(!a||a.status!=='active'||a.region!==p.region)return toast('Cet acteur n’est pas disponible dans ta région.');var existing=relationForActor(name);if(existing&&p.ageMonths-existing.lastCanonInteractionAge<2)return toast('Cette rencontre est trop récente pour provoquer un nouvel échange important.');if(existing){if(!useSocialAction())return;existing.lastCanonInteractionAge=p.ageMonths;existing.respect=cl(existing.respect+1+R('npc')*3,0,100);existing.trust=cl(existing.trust+R('npc')*2,0,100);addRelationMemory(existing,'Nouvelle rencontre dans '+p.region+'.','canon');tl('Retrouvailles',name+' te reconnaît désormais plus facilement.');save();render();return}
 if(!useSocialAction())return;var hostile=diplomacy(p.faction,a.faction)<-35,gate=.20+p.reputation/260+influenceMetrics().score/420+(a.faction===p.faction?.18:0)-(a.importance||80)/620-(hostile?.10:0),chance=cl(gate,.05,.82);
 if(R('npc')<chance){var r=bondCanonicalActor(a,'Tu prends l’initiative de l’aborder dans '+p.region+'.');r.lastCanonInteractionAge=p.ageMonths;r.respect=cl(r.respect+4,0,100);r.trust=cl(r.trust+2,0,100);tl('Rencontre marquante',name+' accepte un véritable échange avec toi.','canon')}
 else{tl('Occasion manquée',name+' ne t’accorde qu’un instant avant de poursuivre sa route.');if(hostile&&actorPower(a)>power()+35&&R('npc')<.12)registerCrime('Incident lors d’une rencontre avec '+name,2,true)}
 save();render()
}
function seekMentor(){
 var p=game.player;if(p.ageMonths<144)return toast('Tu es encore trop jeune pour rechercher un mentor structuré.');var current=game.relations.filter(function(r){return r.status==='active'&&r.role==='mentor'});if(current.length>=2)return toast('Tu as déjà suffisamment de mentors actifs. Approfondis ces liens.');if(!useSocialAction())return;var existing=game.relations.filter(function(r){return r.status==='active'&&npcNearby(r)&&relationPower(r)>power()+10&&!r.canonical});if(existing.length){var r=pk(existing,'npc');r.respect=cl(r.respect+4,0,100);r.trust=cl(r.trust+3,0,100);addRelationMemory(r,'Tu sollicites ses conseils.','mentor');tl('Piste de mentorat',r.name+' semble disposé à observer ta progression.');save();render();return}
 var r=createRelation('mentor');r.region=p.region;r.location=p.island;r.npcPower=cl(power()+14+R('npc')*16,20,94);r.npcPotential=cl(Math.max(r.npcPower+5,72+R('npc')*24),r.npcPower,100);r.respect=Math.max(r.respect,64);r.trust=Math.max(r.trust,48);addRelationMemory(r,'Rencontré en recherchant un guide expérimenté.','mentor');tl('Mentor potentiel',r.name+' accepte de suivre tes progrès.','major');save();render()
}

function defaultLife(){return{relationshipStatus:'Célibataire',partnerId:null,housingLevel:0,assets:{property:0,business:0,ship:0,treasure:0},livingCostsPaid:0,debt:0,debtPeak:0,debtInterestPaid:0,netWorthPeak:0,socialActions:2,lastExpense:0,totalBusinessIncome:0}}
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

var SPEC_PROFILES={
 Combat:{keys:['Combat','Force','Réflexes'],combatWeight:.82,label:'Combat'},Combattant:{keys:['Combat','Force','Endurance'],combatWeight:.88,label:'Combat rapproché'},Duelliste:{keys:['Combat','Agilité','Réflexes'],combatWeight:.78,label:'Duel'},
 Navigation:{keys:['Navigation','Discipline','Réflexes'],combatWeight:.18,label:'Navigation'},Navigateur:{keys:['Navigation','Discipline','Réflexes'],combatWeight:.18,label:'Navigation'},Tireur:{keys:['Tir','Réflexes','Discipline'],combatWeight:.58,label:'Tir'},
 Médecine:{keys:['Médecine','Science','Discipline'],combatWeight:.08,label:'Médecine'},Médecin:{keys:['Médecine','Science','Discipline'],combatWeight:.08,label:'Médecine'},Renseignement:{keys:['Discrétion','Discipline','Agilité'],combatWeight:.20,label:'Renseignement'},
 Infiltration:{keys:['Discrétion','Agilité','Réflexes'],combatWeight:.28,label:'Infiltration'},Investigateur:{keys:['Discrétion','Science','Discipline'],combatWeight:.16,label:'Investigation'},Scientifique:{keys:['Science','Discipline','Navigation'],combatWeight:.04,label:'Science'},
 Administration:{keys:['Discipline','Commandement','Science'],combatWeight:.04,label:'Administration'},Logistique:{keys:['Commandement','Navigation','Discipline'],combatWeight:.08,label:'Logistique'},'Quartier-maître':{keys:['Commandement','Navigation','Discipline'],combatWeight:.12,label:'Logistique'},
 Marchand:{keys:['Commandement','Navigation','Discipline'],combatWeight:.04,label:'Commerce'},Artisan:{keys:['Science','Discipline','Commandement'],combatWeight:.04,label:'Artisanat'},Cuisinier:{keys:['Discipline','Médecine','Commandement'],combatWeight:.04,label:'Cuisine'},
 Traqueur:{keys:['Réflexes','Discrétion','Navigation'],combatWeight:.30,label:'Traque'},'Cipher Pol':{keys:['Discrétion','Combat','Réflexes'],combatWeight:.72,label:'Cipher Pol'}
};
var MISSION_TITLE_PROFILES={
 'Livraison côtière':'navigation','Escorte commerciale':'command','Ouvrir une route commerciale':'trade','Soigner un équipage blessé':'medicine','Cartographier une route dangereuse':'navigation','Étudier un phénomène rare':'science',
 'Patrouille portuaire':'command','Escorte navale':'navigation','Démanteler des contrebandiers':'hunt','Intercepter un équipage pirate':'combat','Sécuriser un royaume allié':'command','Opération de renseignement':'stealth',
 'Chasse au trésor':'exploration','Piller un convoi':'combat','Affronter un équipage rival':'combat','Raid contre une base Marine':'combat','Prendre le contrôle d’une route':'command','Voler des cartes marines':'stealth',
 'Traquer un hors-la-loi':'hunt','Capturer un capitaine':'hunt','Contrat sur une cible dangereuse':'combat','Traque longue distance':'hunt',
 'Acheminer des renseignements':'stealth','Évacuer des civils':'rescue','Saboter une installation':'stealth','Libérer une cellule capturée':'mixed','Infiltrer un poste gouvernemental':'stealth',
 'Surveillance discrète':'stealth','Sécuriser un dignitaire':'command','Récupérer des renseignements sensibles':'stealth','Opération classifiée':'mixed','Mission Cipher Pol':'mixed'
};
var MISSION_PROFILE_CONFIG={
 combat:{label:'Combat',keys:['Combat','Force','Réflexes'],combat:true},navigation:{label:'Navigation',keys:['Navigation','Discipline','Réflexes','Endurance']},medicine:{label:'Médecine',keys:['Médecine','Science','Discipline','Réflexes']},
 science:{label:'Science',keys:['Science','Discipline','Navigation','Commandement']},stealth:{label:'Infiltration',keys:['Discrétion','Agilité','Réflexes','Discipline']},command:{label:'Commandement',keys:['Commandement','Volonté','Discipline','Combat']},
 trade:{label:'Commerce',keys:['Commandement','Navigation','Discipline','Science']},hunt:{label:'Traque',keys:['Réflexes','Discrétion','Navigation','Combat']},exploration:{label:'Exploration',keys:['Navigation','Discipline','Réflexes','Science']},
 rescue:{label:'Sauvetage',keys:['Médecine','Commandement','Endurance','Navigation']},mixed:{label:'Opération mixte',keys:['Combat','Discrétion','Commandement','Réflexes'],mixed:true}
};
function valueForKey(k){var p=game.player;if(p.stats&&p.stats[k]!=null)return p.stats[k];if(p.skills&&p.skills[k]!=null)return p.skills[k];return 0}
function specProfile(sp){return SPEC_PROFILES[sp]||null}
function careerExpertise(sp){var p=game.player,profile=specProfile(sp||p.specialization);if(!profile)return((p.stats.Discipline||0)+(p.skills.Commandement||0)+(p.skills.Combat||0))/3;return profile.keys.reduce(function(a,k){return a+valueForKey(k)},0)/profile.keys.length}
function careerQualification(){var p=game.player,profile=specProfile(p.specialization),expertise=careerExpertise(p.specialization),cw=profile?profile.combatWeight:.45;return expertise*(1-cw)+power()*cw}
function careerRequirementLabel(){var p=game.player,profile=specProfile(p.specialization);return profile&&profile.combatWeight<.45?'Expertise métier':'Qualification'}
function missionProfile(m){var id=(m&&m.profile)||MISSION_TITLE_PROFILES[m&&m.title]||'mixed';return{id:id,config:MISSION_PROFILE_CONFIG[id]||MISSION_PROFILE_CONFIG.mixed}}
function missionScore(m){var p=game.player,mp=missionProfile(m),keys=mp.config.keys,score=keys.reduce(function(a,k){return a+valueForKey(k)},0)/Math.max(1,keys.length);if(mp.id==='combat')score=power();else if(mp.id==='mixed')score=score*.55+power()*.45;if(p.specialization&&m.spec===p.specialization)score+=5;var sp=specProfile(p.specialization);if(sp&&keys.some(function(k){return sp.keys.indexOf(k)>=0}))score+=2.5;return score}
function missionChance(m){var effective=organizationMissionDanger(m),mp=missionProfile(m),score=missionScore(m),support=Math.max(0,m.danger-effective)*.35,ch=.52+(score-effective)/82+support/100;if(mp.id==='medicine'||mp.id==='science'||mp.id==='navigation'||mp.id==='trade')ch+=.04;return cl(ch,.08,.94)}
function missionRiskLabel(m){var c=missionChance(m);return c>=.8?'Favorable':c>=.62?'Maîtrisé':c>=.45?'Incertain':c>=.28?'Dangereux':'Extrême'}

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
function pendingIsExecutable(p){
 return!!(p&&Array.isArray(p.choices)&&p.choices.length&&p.choices.every(function(c){return Array.isArray(c)&&typeof c[2]==='function'}))
}
function save(){if(game){var persisted=game;if(game.pending){persisted=Object.assign({},game,{pending:null})}localStorage.setItem(key(),JSON.stringify(persisted));saveMeta()}}

function defaultProgression(p){
 return{gains:{},snapshots:[],breakthroughs:[],lastSnapshotAge:p&&p.ageMonths||0}
}
function migrateProgression(g,p){
 p.progression=p.progression||defaultProgression(p);p.progression.gains=p.progression.gains||{};p.progression.snapshots=Array.isArray(p.progression.snapshots)?p.progression.snapshots.slice(-30):[];p.progression.breakthroughs=Array.isArray(p.progression.breakthroughs)?p.progression.breakthroughs.slice(-20):[];p.progression.lastSnapshotAge=p.progression.lastSnapshotAge==null?(p.ageMonths||0):p.progression.lastSnapshotAge;
 p.naturalCaps=p.naturalCaps||{};p.absoluteCaps=p.absoluteCaps||{};var caps=p.caps||{};
 ST.concat(SK).forEach(function(k){var c=caps[k]||90;if(p.naturalCaps[k]==null)p.naturalCaps[k]=c;if(p.absoluteCaps[k]==null){var extra=5+(H(String(g.seed||1)+':absolute:'+k)%8);p.absoluteCaps[k]=cl(c+extra,c,100)}else p.absoluteCaps[k]=cl(p.absoluteCaps[k],c,100)});
 return p.progression
}
function developmentFactor(k){
 var p=game.player,y=(p.ageMonths||0)/12,isSkill=p.skills&&p.skills[k]!=null;
 if(y<2)return isSkill?.08:.18;if(y<6)return isSkill?.18:.34;if(y<12)return isSkill?.45:.68;if(y<15)return isSkill?.72:.88;if(y<40)return 1;if(y<55)return .9;if(y<70)return .72;return .52
}
function trackProgressGain(k,n){
 if(!n||n<=0)return;var pr=migrateProgression(game,game.player);pr.gains[k]=(pr.gains[k]||0)+n
}
function progressionSnapshot(){
 var p=game.player;return{ageMonths:p.ageMonths,power:+power().toFixed(2),stats:Object.assign({},p.stats),skills:Object.assign({},p.skills),haki:Object.assign({},p.haki),fruit:+(p.fruitMastery||0).toFixed(2)}
}
function recordProgressSnapshot(force){
 var p=game.player,pr=migrateProgression(game,p),ageNow=p.ageMonths||0;if(!force&&ageNow-(pr.lastSnapshotAge||0)<6)return false;pr.snapshots.push(progressionSnapshot());pr.snapshots=pr.snapshots.slice(-30);pr.lastSnapshotAge=ageNow;return true
}
function progressionDelta(){
 var pr=migrateProgression(game,game.player),ss=pr.snapshots;if(ss.length<2)return{power:0,months:0};var a=ss[ss.length-2],b=ss[ss.length-1];return{power:b.power-a.power,months:b.ageMonths-a.ageMonths}
}
function currentCapStatus(k){
 var p=game.player,b=p.stats[k]!=null?p.stats:p.skills,v=b[k]||0,c=p.caps[k]||90;if(v>=c-.05)return'Plafond actuel';if(c-v<=5)return'Proche du plafond';return'Progression ouverte'
}
function qualitativePotential(k){
 var p=game.player,c=p.caps[k]||90,a=p.absoluteCaps&&p.absoluteCaps[k]!=null?p.absoluteCaps[k]:c,room=a-c;if(room>=10)return'Réserve exceptionnelle';if(room>=6)return'Réserve prometteuse';if(room>=3)return'Marge limitée';return'Quasi stabilisé'
}
function attemptBreakthrough(context,intensity){
 var p=game.player,pr=migrateProgression(game,p),candidates=ST.concat(SK).filter(function(k){var b=p.stats[k]!=null?p.stats:p.skills,cap=p.caps[k]||90,abs=p.absoluteCaps[k]||cap;return b[k]>=cap-.35&&cap<abs-.05});
 if(!candidates.length)return false;var chance=context==='combat'?cl(.012+Math.max(0,(intensity||0)-55)*.0008,.012,.05):.01;if(R('breakthrough')>=chance)return false;
 var k=pk(candidates,'breakthrough'),old=p.caps[k],abs=p.absoluteCaps[k]||100,inc=Math.min(abs-old,1+Math.floor(R('breakthrough')*2));if(inc<=0)return false;p.caps[k]=cl(old+inc,old,abs);var item={age:age(),key:k,from:old,to:p.caps[k],context:context};pr.breakthroughs.push(item);pr.breakthroughs=pr.breakthroughs.slice(-20);tl('BREAKTHROUGH',k+' repousse son plafond : '+Math.round(old)+' → '+Math.round(p.caps[k])+'.','major');return true
}


function defaultLifeLoop(){return{advanceCount:0,quietAdvances:0,momentSeq:0,majorSeq:0,lastAdvance:null,recentKinds:[]}}
function migrateLifeLoop(g){
 g.loop=g.loop||defaultLifeLoop();var l=g.loop;l.advanceCount=l.advanceCount||0;l.quietAdvances=l.quietAdvances||0;l.momentSeq=l.momentSeq||0;l.majorSeq=l.majorSeq||0;l.lastAdvance=l.lastAdvance||null;l.recentKinds=Array.isArray(l.recentKinds)?l.recentKinds.slice(0,6):[];return l
}
function advancePlan(){
 var p=game.player,j=migrateJustice(p),danger=inf().danger||0,severe=p.health<45||(p.conditions||[]).some(function(c){return(c.severity||1)>=2});
 if(game.pending)return{key:'decision',label:'Décision en attente',tone:'urgent',min:0,max:0,reason:'Une décision importante interrompt automatiquement le temps.'};var storyWait=awaitingStory();if(storyWait)return{key:'story-decision',label:'Fil narratif à décider',tone:'urgent',min:0,max:0,reason:storyWait.title+' attend ta décision avant que le temps continue.'};
 if(j.detained&&j.prison)return{key:'detention',label:'Détention',tone:'urgent',min:.5,max:1,limit:j.prison.remaining,reason:'Le temps avance lentement en détention.'};
 if(game.mission)return{key:'mission',label:'Mission en cours',tone:'active',min:.5,max:1,limit:game.mission.remaining,reason:'La simulation resserre le temps jusqu’à la prochaine étape de mission.'};
 if(p.travel)return{key:'travel',label:'Navigation',tone:'active',min:.5,max:1,limit:p.travel.remaining,reason:'La traversée progresse par périodes courtes afin de laisser les incidents interrompre le voyage.'};
 if(severe)return{key:'recovery',label:'Récupération',tone:'urgent',min:.5,max:1.5,reason:'Blessures ou santé fragile : la simulation surveille de près ton état.'};
 if(p.ageMonths<24)return{key:'infancy',label:'Petite enfance',tone:'calm',min:6,max:9,reason:'Les mois passent vite tant qu’aucun événement important ne survient.'};
 if(p.ageMonths<72)return{key:'childhood',label:'Enfance',tone:'calm',min:4,max:7,reason:'Le temps avance encore rapidement, avec interruption automatique en cas d’événement.'};
 if(p.ageMonths<180)return{key:'formation',label:'Formation',tone:'active',min:2,max:4,reason:'La progression devient plus détaillée à mesure que ton autonomie augmente.'};
 if(danger>=58||currentHeat()>55)return{key:'high-risk',label:'Contexte tendu',tone:'urgent',min:.5,max:1.5,reason:'Danger local ou pression judiciaire élevée : les périodes deviennent courtes.'};
 var focusedTraining=activityGrowthKeys(p.activity).length>0||String(p.activity).indexOf('Haki ')===0||p.activity==='Maîtrise du Fruit';if(p.career!=='Aucune'||focusedTraining)return{key:'active-life',label:'Vie active',tone:'active',min:1,max:2,reason:'Carrière et entraînement maintiennent un rythme intermédiaire.'};
 return{key:'calm-life',label:'Période calme',tone:'calm',min:1.5,max:3,reason:'Rien n’impose un découpage très fin pour le moment.'}
}
function chooseAdvanceDuration(plan){
 if(!plan||plan.max<=0)return 0;var m=plan.min+(plan.max-plan.min)*R('time');if(plan.limit!=null)m=Math.min(m,Math.max(.25,plan.limit));return Math.max(.25,Math.round(m*4)/4)
}
function durationText(m){
 if(m<=.3)return'environ une semaine';if(m<=.6)return'environ deux semaines';if(m<1)return'environ trois semaines';var q=Math.round(m*4)/4,whole=Math.floor(q),frac=Math.round((q-whole)*4),suffix=frac===1?'¼':frac===2?'½':frac===3?'¾':'',label=(whole?whole:'')+suffix;if(!label)label='1';return label+' mois'
}
function planWindowText(plan){
 if(!plan||plan.max<=0)return'Décision';var a=durationText(plan.min),b=durationText(plan.max);return plan.min===plan.max?a:a+' à '+b
}
function totalTrackedGain(){
 var p=game.player,pr=migrateProgression(game,p);return Object.keys(pr.gains||{}).reduce(function(a,k){return a+(pr.gains[k]||0)},0)
}
function totalAbilityProgress(){
 var p=game.player,haki=(p.haki.Observation||0)+(p.haki.Armement||0)+(p.haki.Conquérant||0),tech=Object.keys(p.techniqueMastery||{}).reduce(function(a,k){return a+(p.techniqueMastery[k]||0)},0);return totalTrackedGain()+haki+(p.fruitMastery||0)+tech
}
function captureAdvanceState(){
 var p=game.player,l=migrateLifeLoop(game);return{age:p.ageMonths,money:p.money,health:p.health,energy:p.energy,power:power(),gain:totalAbilityProgress(),momentSeq:l.momentSeq,majorSeq:l.majorSeq}
}
function finalizeAdvanceReport(before,m,plan){
 var p=game.player,l=migrateLifeLoop(game),moments=Math.max(0,l.momentSeq-before.momentSeq),major=Math.max(0,l.majorSeq-before.majorSeq),powerDelta=power()-before.power,gainDelta=totalAbilityProgress()-before.gain,moneyDelta=p.money-before.money;if(game.pending){moments=Math.max(1,moments);major=Math.max(1,major)}
 l.advanceCount++;l.quietAdvances=moments?0:l.quietAdvances+1;l.recentKinds.unshift(plan&&plan.key||'unknown');l.recentKinds=l.recentKinds.slice(0,6);
 l.lastAdvance={months:m,kind:plan&&plan.key||'',label:plan&&plan.label||'',moments:moments,major:major,powerDelta:powerDelta,gainDelta:gainDelta,moneyDelta:moneyDelta,healthDelta:p.health-before.health,energyDelta:p.energy-before.energy,activity:p.activity,ageFrom:before.age,ageTo:p.ageMonths};
 return l.lastAdvance
}
function weightedEventPick(items){
 var l=migrateLifeLoop(game),total=0,weighted=items.map(function(x){var recent=l.recentKinds.indexOf('event:'+x.id)>=0,weight=Math.max(.01,x.weight*(recent?.45:1));total+=weight;return{x:x,w:weight}}),r=R('e')*total;
 for(var i=0;i<weighted.length;i++){r-=weighted[i].w;if(r<=0){l.recentKinds.unshift('event:'+weighted[i].x.id);l.recentKinds=l.recentKinds.slice(0,6);return weighted[i].x}}return weighted.length?weighted[weighted.length-1].x:null
}
function eventChance(m){
 var l=migrateLifeLoop(game),w=game.world,d=inf().danger||0,base=.09+Math.min(.18,m*.025)+Math.min(.11,d/650)+Math.min(.10,(w.globalTension||0)/650)+Math.min(.22,l.quietAdvances*.09);
 return cl(base,.08,.68)
}
function renderAdvanceLoop(){
 var l=migrateLifeLoop(game),plan=advancePlan(),badge=$('#advanceWindowBadge');$('#advanceRhythm').textContent=plan.label;badge.textContent=planWindowText(plan);badge.className='badge '+(plan.tone==='urgent'?'rhythm-urgent':plan.tone==='active'?'rhythm-active':'rhythm-calm');$('#advancePreview').textContent=plan.reason;
 var report=l.lastAdvance,box=$('#advanceReport');if(!report){box.classList.add('hidden')}else{box.classList.remove('hidden');$('#advanceReportDuration').textContent=durationText(report.months);$('#advanceReportStats').innerHTML='<div><span>Progression</span><strong>'+(report.gainDelta>0?'+'+report.gainDelta.toFixed(1):'Stable')+'</strong></div><div><span>Puissance</span><strong>'+(report.powerDelta>=0?'+':'')+report.powerDelta.toFixed(1)+'</strong></div><div><span>Berry</span><strong>'+(report.moneyDelta>=0?'+':'')+Math.round(report.moneyDelta).toLocaleString('fr-FR')+'</strong></div><div><span>Moments</span><strong>'+report.moments+'</strong></div>';var txt=report.moments?'Cette période a produit '+report.moments+' moment'+(report.moments>1?'s':'')+' notable'+(report.moments>1?'s':'')+(report.major?' dont '+report.major+' majeur'+(report.major>1?'s':''):'')+'.':report.gainDelta>.05?'Période calme : aucun événement majeur, mais ton activité a continué à te faire progresser.':'Période réellement calme. Le directeur d’événements augmente désormais la probabilité d’une interruption significative.';$('#advanceReportText').textContent=txt}
 var storyWait=awaitingStory();$('#advanceBtn').disabled=!game.alive;$('#advanceHint').textContent=game.pending?'Décision à prendre — appuie pour l’ouvrir':storyWait?'Fil narratif à décider — appuie pour l’ouvrir':plan.max>0?planWindowText(plan)+' • '+plan.label:'Décision en attente'
}


var EXPLORATION_REGION_FLAVOR={
 'East Blue':{identity:'Mers accessibles, villages côtiers et petites puissances locales.',tags:['Côtes','Villages','Routes marchandes'],themes:['port caché','histoire locale','atelier artisanal','réseau de contrebandiers']},
 'North Blue':{identity:'Royaumes froids, tensions politiques et réseaux clandestins.',tags:['Politique','Froid','Réseaux'],themes:['archives oubliées','laboratoire abandonné','passage clandestin','ancienne fortification']},
 'West Blue':{identity:'Îles de savoir, criminalité organisée et vieilles histoires.',tags:['Culture','Histoire','Criminalité'],themes:['ruines savantes','bibliothèque privée','marché discret','vestige historique']},
 'South Blue':{identity:'Faune étrange, routes lointaines et communautés isolées.',tags:['Nature','Isolement','Faune'],themes:['sanctuaire naturel','route oubliée','plante rare','campement isolé']},
 'Grand Line':{identity:'Climats impossibles, îles uniques et routes imprévisibles.',tags:['Climat extrême','Aventure','Mystères'],themes:['phénomène climatique','ruine ancienne','raccourci maritime','trésor oublié']},
 'New World':{identity:'Territoires dominés par des puissances majeures et mers hostiles.',tags:['Puissances','Danger','Ressources rares'],themes:['avant-poste secret','ressource stratégique','route dangereuse','vestige d’une grande puissance']}
};
var ISLAND_SPECIAL={
 'Loguetown':{identity:'Ville de l’exécution de Roger, carrefour de la Grande Ère de la Piraterie.',tags:['Histoire','Marine','Commerce'],themes:['place de l’exécution','archives de la Marine','rumeur de pirate','marché historique']},
 'Water 7':{identity:'Métropole maritime bâtie autour des canaux et de la construction navale.',tags:['Chantiers navals','Canaux','Commerce'],themes:['atelier de charpentier','canal secondaire','plan naval ancien','contact de chantier']},
 'Sabaody':{identity:'Archipel de mangroves, carrefour du monde et porte du Nouveau Monde.',tags:['Mangroves','Sous-monde','Carrefour'],themes:['revendeur clandestin','bulle de mangrove','route de contrebande','information du Nouveau Monde']},
 'Alabasta':{identity:'Grand royaume désertique dont les villes dépendent de routes vitales.',tags:['Désert','Royaume','Ruines'],themes:['ruine du désert','source cachée','ancienne route caravanière','rumeur royale']},
 'Little Garden':{identity:'Île préhistorique où le temps semble s’être arrêté.',tags:['Préhistoire','Faune','Survie'],themes:['trace de géant','nid préhistorique','plante ancienne','passage sauvage']},
 'Drum':{identity:'Île hivernale connue pour sa médecine et ses reliefs vertigineux.',tags:['Neige','Médecine','Montagnes'],themes:['herbe médicinale','refuge de montagne','ancien cabinet','passage enneigé']},
 'Jaya':{identity:'Île agitée où aventuriers, criminels et rêves impossibles se croisent.',tags:['Pirates','Rumeurs','Aventure'],themes:['rumeur céleste','cache pirate','carte incomplète','contact douteux']},
 'Fish-Man Island':{identity:'Royaume sous-marin au carrefour des routes vers le Nouveau Monde.',tags:['Sous-marin','Hommes-poissons','Courants'],themes:['courant secret','sanctuaire marin','artisan local','rumeur des profondeurs']},
 'Punk Hazard':{identity:'Île ravagée par des expériences et des climats artificiellement extrêmes.',tags:['Science','Danger','Climat'],themes:['laboratoire détruit','échantillon rare','installation secrète','archive scientifique']},
 'Dressrosa':{identity:'Royaume méditerranéen vivant sous une forte influence politique et criminelle.',tags:['Royaume','Commerce','Sous-monde'],themes:['atelier local','passage souterrain','contact criminel','archive royale']},
 'Zou':{identity:'Civilisation mouvante installée sur le dos d’un éléphant gigantesque.',tags:['Minks','Mobile','Ancien'],themes:['chemin de la forêt','tradition Mink','poste d’observation','trace historique']},
 'Whole Cake Island':{identity:'Territoire extrêmement surveillé organisé autour d’une puissance pirate dominante.',tags:['Empire pirate','Surveillance','Cuisine'],themes:['atelier culinaire','route surveillée','réseau local','stock rare']},
 'Wano':{identity:'Pays fermé de samouraïs, d’artisans et de ressources stratégiques.',tags:['Samouraïs','Kairouseki','Fermé'],themes:['forge ancienne','gisement discret','dojo isolé','passage de montagne']},
 'Egghead':{identity:'Île-laboratoire concentrant une technologie très en avance sur son époque.',tags:['Science','Technologie','Gouvernement'],themes:['prototype abandonné','archive scientifique','atelier robotique','système expérimental']},
 'Ohara':{identity:'Île associée au savoir, aux recherches historiques et à leurs conséquences politiques.',tags:['Savoir','Histoire','Archéologie'],themes:['fragment d’archive','site d’étude','inscription ancienne','rumeur interdite']}
};
var SEA_CONDITIONS=[
 {id:'calm',name:'Mer calme',speed:.90,incident:.08},
 {id:'current',name:'Courants portants',speed:.82,incident:.11},
 {id:'rough',name:'Mer agitée',speed:1.08,incident:.19},
 {id:'fog',name:'Brouillard dense',speed:1.12,incident:.20},
 {id:'storm',name:'Tempête',speed:1.28,incident:.30}
];
function defaultExploration(){
 return{sites:{},totalDiscoveries:0,treasures:0,treasureValue:0,rumors:0,journeys:0,seaIncidents:0}
}
function migrateExploration(p){
 p.exploration=p.exploration||defaultExploration();var x=p.exploration;x.sites=x.sites||{};['totalDiscoveries','treasures','treasureValue','rumors','journeys','seaIncidents'].forEach(function(k){x[k]=x[k]||0});return x
}
function explorationSite(name){
 var p=game.player,x=migrateExploration(p),n=name||p.island;if(!x.sites[n])x.sites[n]={familiarity:0,attempts:0,visits:0,discoveries:[],rumors:[],lastExploreAge:null};var s=x.sites[n];s.discoveries=s.discoveries||[];s.rumors=s.rumors||[];s.familiarity=cl(s.familiarity||0,0,100);return s
}
function islandProfile(name){
 var q=infStatic(name),reg=EXPLORATION_REGION_FLAVOR[q.region]||EXPLORATION_REGION_FLAVOR['East Blue'],sp=ISLAND_SPECIAL[name]||{},themes=(sp.themes||reg.themes).slice(),tags=(sp.tags||reg.tags).slice(),seed=H(name+':profile');
 return{name:name,region:q.region,danger:q.danger,identity:sp.identity||reg.identity,tags:tags,themes:themes,signature:themes[seed%themes.length]}
}
function explorationLevel(v){return v<15?'Inconnue':v<35?'Reconnue':v<60?'Connue':v<85?'Bien connue':'Maîtrisée'}
function discoveryPool(name){
 var p=islandProfile(name),types=['Lieu notable','Histoire','Ressource','Contact'],out=[];
 p.themes.forEach(function(t,i){out.push({id:name+'-'+i,name:(i===0?'Repère : ':i===1?'Indice : ':i===2?'Ressource : ':'Contact : ')+t,type:types[i%types.length],desc:i===0?'Un élément marquant de la géographie locale.':i===1?'Une information qui éclaire l’histoire ou les forces de l’île.':i===2?'Une ressource ou opportunité propre à la zone.':'Une piste sociale ou professionnelle utile sur place.',threshold:[12,30,52,76][i]||80})});
 out.push({id:name+'-secret',name:'Secret de '+name,type:'Secret',desc:'Une découverte rare qui n’apparaît qu’après une exploration approfondie.',threshold:90});
 return out
}
function registerDiscovery(name,d){
 var p=game.player,site=explorationSite(name),x=migrateExploration(p);if(site.discoveries.indexOf(d.id)>=0)return false;site.discoveries.push(d.id);x.totalDiscoveries++;game.codex.discoveries=game.codex.discoveries||[];if(!game.codex.discoveries.some(function(z){return z.id===d.id}))game.codex.discoveries.push({id:d.id,place:name,name:d.name,type:d.type,desc:d.desc});tl('Découverte — '+name,d.name+' : '+d.desc,d.type==='Secret'?'major':'');return true
}
function discoverByKnowledge(name){
 var site=explorationSite(name),pool=discoveryPool(name).filter(function(d){return site.familiarity>=d.threshold&&site.discoveries.indexOf(d.id)<0});if(!pool.length)return false;pool.sort(function(a,b){return a.threshold-b.threshold});return registerDiscovery(name,pool[0])
}
function currentRumor(name){
 var p=game.player,w=game.world,region=infStatic(name).region,parts=[],conf=w.conflicts.find(function(c){return c.location===name||c.region===region}),actor=w.actors.filter(function(a){return a.region===region&&a.status==='active'}).sort(function(a,b){return b.importance-a.importance})[0],crew=w.crews.filter(function(c){return c.region===region&&c.status==='active'}).sort(function(a,b){return b.power-a.power})[0],market=w.markets&&w.markets[name],routes=PL[name]&&PL[name][2]||[];
 if(conf)parts.push('On parle d’un affrontement entre '+conf.attacker+' et '+conf.defender+' autour de '+conf.location+'.');
 if(actor)parts.push(actor.name+' aurait récemment été aperçu dans '+region+'.');
 if(crew)parts.push('L’équipage '+crew.name+' serait actif dans '+region+'.');
 if(market){var scarce=TRADE_GOODS.map(function(g){return{g:g,x:market.goods[g.id]}}).filter(function(z){return z.x}).sort(function(a,b){return(a.x.stock-a.x.demand)-(b.x.stock-b.x.demand)})[0];if(scarce&&scarce.x.stock<scarce.x.demand)parts.push('Les '+scarce.g.name.toLowerCase()+' deviennent difficiles à trouver à '+name+'.')}
 if(routes.length)parts.push('Les navigateurs discutent beaucoup de la route vers '+routes[H(name+':rumor:'+Math.floor(p.ageMonths/6))%routes.length]+'.');
 return parts.length?parts[H(String(game.seed)+':rumor:'+name+':'+Math.floor(p.ageMonths/3))%parts.length]:'Les habitants évoquent des mouvements inhabituels autour de '+name+'.'
}
function learnLocalRumor(name){
 var site=explorationSite(name),text=currentRumor(name);if(site.rumors.some(function(r){return r.text===text}))return false;site.rumors.unshift({text:text,age:age()});site.rumors=site.rumors.slice(0,6);migrateExploration(game.player).rumors++;tl('Rumeur locale',text);return true
}
function explorationTick(m){
 var p=game.player;if(p.travel||p.activity!=='Explorer')return false;var site=explorationSite(p.island),before=site.familiarity,nav=p.skills.Navigation||0,disc=p.stats.Discipline||0,obs=p.haki.Observation||0,rate=(1.35+nav*.018+disc*.009+obs*.006)*m*cl(1-site.familiarity/125,.25,1);site.familiarity=cl(site.familiarity+rate,0,100);site.attempts++;site.lastExploreAge=p.ageMonths;var found=discoverByKnowledge(p.island);
 if(!found&&R('explore')<cl(.06*m+site.familiarity/900,.03,.22))learnLocalRumor(p.island);
 if(site.familiarity>=70&&R('explore')<.012*m){var v=1500+Math.round(R('explore')*(8000+inf().danger*220));p.money+=v;p.life.assets.treasure=(p.life.assets.treasure||0)+v;migrateExploration(p).treasures++;migrateExploration(p).treasureValue+=v;tl('Trouvaille', 'Ton exploration de '+p.island+' révèle un butin estimé à '+v.toLocaleString('fr-FR')+' B.','major')}
 return site.familiarity>before
}
function chooseSeaCondition(from,to){
 var danger=infStatic(to).danger,r=R('sea'),storm=cl(.04+danger/500,.04,.22),rough=.22+danger/600,fog=.12;
 if(r<storm)return SEA_CONDITIONS[4];if(r<storm+rough)return SEA_CONDITIONS[2];if(r<storm+rough+fog)return SEA_CONDITIONS[3];if(r>.82)return SEA_CONDITIONS[1];return SEA_CONDITIONS[0]
}
function routeEstimate(from,to){
 var p=game.player,z=infStatic(to).danger,base=.6+z/35+R('t')*.8,o=p.organization,cond=chooseSeaCondition(from,to);if(o&&o.ship){var st=SHIP_TIERS[o.ship.tier||0]||SHIP_TIERS[0];base*=1-st.speed;if(o.ship.condition<40)base*=1.18}var load=cargoUsed()/Math.max(1,cargoCapacity());base*=1+cl(load,0,1)*.08;base*=cond.speed;return{months:Math.max(.5,Math.round(base*10)/10),condition:cond,load:load}
}
function addJourneyLog(t,text){var p=game.player;if(!p.travel)return;p.travel.logs=p.travel.logs||[];p.travel.logs.unshift({title:t,text:text});p.travel.logs=p.travel.logs.slice(0,5)}
function seaJourneyTick(m){
 var p=game.player,t=p.travel,o=p.organization;if(!t)return false;var cond=SEA_CONDITIONS.find(function(c){return c.id===t.condition})||SEA_CONDITIONS[0],nav=p.skills.Navigation||0,chance=cl(cond.incident+t.danger/700-nav/1100,.04,.42)*Math.min(1,m+.3);if(R('sea')>chance)return false;
 migrateExploration(p).seaIncidents++;t.incidents=(t.incidents||0)+1;var roll=R('sea');
 if(roll<.28){var g=gain('Navigation',.18+.35*R('sea'));t.remaining=Math.max(0,t.remaining-(.05+.12*R('sea')));addJourneyLog('Lecture des courants','Tu exploites les conditions et gagnes du temps sur la route.');tl('Navigation maîtrisée','Tu lis correctement les courants en route vers '+t.destination+(g?' • Navigation +'+g.toFixed(1):'')+'.')}
 else if(roll<.52){var loss=5+Math.round(R('sea')*11);p.energy=cl(p.energy-loss,0,100);if(o&&o.ship&&R('sea')<.55)o.ship.condition=cl(o.ship.condition-(2+R('sea')*6),0,100);addJourneyLog(cond.name,'La traversée fatigue l’équipage'+(o&&o.ship?' et sollicite le navire':'')+'.');tl('Conditions difficiles',cond.name+' ralentit et fatigue la traversée.')}
 else if(roll<.72){if(o)o.supplies=cl(o.supplies-(3+R('sea')*8),0,100);addJourneyLog('Logistique en mer','Une partie des provisions est consommée ou perdue.');tl('Ravitaillement entamé','La traversée consomme davantage de provisions que prévu.')}
 else if(roll<.9){addJourneyLog('Rencontre maritime','Une présence hostile coupe momentanément ta route.');fight(t.danger*.72+8,'Rencontre en mer')}
 else{addJourneyLog('Découverte maritime','Tu repères un détail utile sur cette route.');learnLocalRumor(t.destination);gain('Navigation',.15+.2*R('sea'))}
 return true
}
function setExplorationActivity(){var p=game.player;if(p.travel)return toast('Impossible d’explorer une île pendant une traversée.');if(p.ageMonths<72)return toast('Tu es encore trop jeune pour explorer seul cette île.');p.activity='Explorer';save();renderWorld();toast('Activité : Explorer '+p.island)}
function renderExploration(){
 var p=game.player,focus=p.travel?p.travel.destination:p.island,profile=islandProfile(focus),site=explorationSite(focus),pool=discoveryPool(focus),known=pool.filter(function(d){return site.discoveries.indexOf(d.id)>=0}),next=pool.filter(function(d){return site.discoveries.indexOf(d.id)<0}).sort(function(a,b){return a.threshold-b.threshold})[0],x=migrateExploration(p);
 $('#islandIdentity').textContent=p.travel?'Destination : '+focus:focus;$('#explorationBadge').textContent=explorationLevel(site.familiarity);$('#explorationMeterFill').style.width=Math.round(site.familiarity)+'%';
 $('#explorationSummary').innerHTML='<div><span>Connaissance</span><strong>'+Math.round(site.familiarity)+'%</strong></div><div><span>Découvertes</span><strong>'+known.length+'/'+pool.length+'</strong></div><div><span>Visites</span><strong>'+(site.visits||0)+'</strong></div><div><span>Total monde</span><strong>'+x.totalDiscoveries+'</strong></div>';
 $('#explorationFlavor').textContent=profile.identity+(next?' • Prochain palier de découverte vers '+next.threshold+'%.':' • Cette zone ne cache presque plus rien à tes yeux.');
 $('#localDiscoveries').innerHTML=known.length?known.slice(-4).reverse().map(function(d){return'<div class="discovery-item"><strong>'+e(d.name)+'</strong><small>'+e(d.type)+'</small></div>'}).join(''):'<div class="discovery-item"><small>Aucune découverte importante enregistrée.</small></div>';
 $('#localRumors').innerHTML=site.rumors.length?site.rumors.slice(0,4).map(function(r){return'<div class="discovery-item"><strong>Rumeur</strong><small>'+e(r.text)+'</small></div>'}).join(''):'<div class="discovery-item"><small>Aucune rumeur locale fiable pour le moment.</small></div>';
 if(p.travel)$('#explorationActions').innerHTML='<div class="career-card"><p>Termine la traversée avant d’explorer localement.</p></div>';
 else if(p.ageMonths<72)$('#explorationActions').innerHTML='<div class="career-card"><p>Tu découvres surtout ton environnement proche. L’exploration autonome se débloque à partir de 6 ans.</p></div>';
 else $('#explorationActions').innerHTML='<button id="exploreIslandBtn" class="action-card '+(p.activity==='Explorer'?'active':'')+'"><strong>'+(p.activity==='Explorer'?'Exploration active':'Explorer cette île')+'</strong><small>AVANCER fera progresser la connaissance locale et peut révéler des découvertes.</small></button><button id="seekRumorBtn" class="action-card"><strong>Écouter les rumeurs</strong><small>Obtenir une information locale sans faire avancer le temps.</small></button>';
 var eb=$('#exploreIslandBtn');if(eb)eb.onclick=setExplorationActivity;var rb=$('#seekRumorBtn');if(rb)rb.onclick=function(){if(learnLocalRumor(p.island)){save();renderWorld()}else toast('Aucune nouvelle rumeur crédible pour le moment.')}
}
function renderJourney(){
 var p=game.player,card=$('#seaJourneyCard');if(!p.travel){card.classList.add('hidden');return}var t=p.travel,cond=SEA_CONDITIONS.find(function(c){return c.id===t.condition})||SEA_CONDITIONS[0],total=Math.max(.01,t.total||t.remaining||1),done=cl(1-t.remaining/total,0,1);card.classList.remove('hidden');$('#journeyRoute').textContent=t.from+' → '+t.destination;$('#journeyCondition').textContent=cond.name;$('#journeyMeterFill').style.width=Math.round(done*100)+'%';$('#journeySummary').innerHTML='<div><span>Progression</span><strong>'+Math.round(done*100)+'%</strong></div><div><span>Temps restant</span><strong>'+Math.max(0,t.remaining).toFixed(1)+' mois</strong></div><div><span>Danger</span><strong>'+Math.round(t.danger)+'/100</strong></div><div><span>Incidents</span><strong>'+(t.incidents||0)+'</strong></div>';$('#journeyLog').innerHTML=(t.logs||[]).length?t.logs.map(function(x){return'<div class="journey-log-item"><strong>'+e(x.title)+'</strong><br>'+e(x.text)+'</div>'}).join(''):'<div class="journey-log-item">Aucun incident notable depuis le départ.</div>'
}
function renderCodexExploration(){
 var p=game.player,x=migrateExploration(p),disc=game.codex.discoveries||[],sites=Object.keys(x.sites),mastered=sites.filter(function(n){return x.sites[n].familiarity>=85}).length;$('#codexProgressBadge').textContent=disc.length+' découverte'+(disc.length>1?'s':'');$('#codexSummary').innerHTML='<div><span>Îles connues</span><strong>'+p.visited.length+'</strong></div><div><span>Îles maîtrisées</span><strong>'+mastered+'</strong></div><div><span>Découvertes</span><strong>'+disc.length+'</strong></div><div><span>Trésors</span><strong>'+x.treasures+'</strong></div>';$('#codexDiscoveries').innerHTML=disc.length?disc.slice(-8).reverse().map(function(d){return'<div class="codex-entry"><strong>'+e(d.name)+'</strong><small>'+e(d.place)+' • '+e(d.type)+'</small></div>'}).join(''):'<div class="codex-entry"><small>Explore le monde pour enrichir le Codex.</small></div>'
}


function defaultStoryEngine(){
 return{seq:0,active:[],history:[],stats:{started:0,resolved:0,failed:0,abandoned:0,interrupted:0,choices:0},lastStartAge:-999}
}
function migrateStoryEngine(g){
 g.story=g.story||defaultStoryEngine();var st=g.story;st.seq=st.seq||0;st.active=Array.isArray(st.active)?st.active:[];st.history=Array.isArray(st.history)?st.history.slice(0,30):[];st.stats=st.stats||{};
 if(st.stats.abandoned==null){var oldAbandoned=st.history.filter(function(h){return /distance gardée|piste abandonnée|aide refusée|duel reporté/i.test(h.outcome||'')}).length;st.stats.abandoned=oldAbandoned;st.stats.resolved=Math.max(0,(st.stats.resolved||0)-oldAbandoned)}
 if(st.stats.interrupted==null){var oldInterrupted=st.history.filter(function(h){return /interrompu|occasion perdue|duel impossible|groupe disparu|laissée derrière/i.test(h.outcome||'')}).length;st.stats.interrupted=oldInterrupted;st.stats.failed=Math.max(0,(st.stats.failed||0)-oldInterrupted)}
 ['started','resolved','failed','abandoned','interrupted','choices'].forEach(function(k){st.stats[k]=st.stats[k]||0});st.lastStartAge=st.lastStartAge==null?-999:st.lastStartAge;
 st.active=st.active.filter(function(x){return x&&x.id&&x.type}).map(function(x){x.status=x.status||'active';x.stage=x.stage||0;x.awaiting=!!x.awaiting;x.createdAge=x.createdAge==null?(g.player&&g.player.ageMonths||0):x.createdAge;x.nextAge=x.nextAge==null?x.createdAge+1:x.nextAge;x.deadlineAge=x.deadlineAge==null?x.createdAge+10:x.deadlineAge;x.data=x.data||{};return x});
 return st
}
function activeStories(){return migrateStoryEngine(game).active.filter(function(s){return s.status==='active'})}
function awaitingStory(){return activeStories().find(function(s){return s.awaiting})||null}
function storyRelation(story){return story&&story.participantId?relationById(story.participantId):null}
function storyEligibleTypes(){
 var p=game.player,types=[],active=activeStories(),used=active.map(function(s){return s.type}),rels=game.relations.filter(function(r){return r.status==='active'&&(r.location===p.island||r.region===p.region)}),rivals=rels.filter(function(r){return r.role==='rival'}),site=explorationSite(p.island),j=migrateJustice(p);
 function add(id,w){if(used.indexOf(id)<0&&w>0)types.push({id:id,weight:w})}
 if(p.ageMonths>=72&&p.ageMonths<180&&rels.length)add('youth-promise',1.6);
 if(p.ageMonths>=144&&!p.travel&&site.familiarity>=20)add('island-secret',1.35+(p.activity==='Explorer'?.55:0));
 if(p.ageMonths>=180&&rels.length)add('social-favor',1.05);
 if(p.ageMonths>=180&&p.career!=='Aucune')add('career-crossroads',1.1);
 if(p.ageMonths>=180&&((j.regionalHeat[p.region]||0)>=25||p.bounty>0))add('justice-shadow',.8+(j.regionalHeat[p.region]||0)/100);
 if(p.ageMonths>=180&&rivals.length)add('rival-challenge',.85);
 if(p.ageMonths>=180&&p.organization&&(p.organization.morale<72||p.organization.supplies<30))add('organization-crisis',1.05);
 return types
}
function pickStoryType(types){
 var total=types.reduce(function(a,x){return a+x.weight},0),r=R('story')*total;for(var i=0;i<types.length;i++){r-=types[i].weight;if(r<=0)return types[i].id}return types.length?types[types.length-1].id:null
}
function storyBase(type){
 var p=game.player,rels=game.relations.filter(function(r){return r.status==='active'&&(r.location===p.island||r.region===p.region)}),rivals=rels.filter(function(r){return r.role==='rival'}),site=explorationSite(p.island),profile=islandProfile(p.island),o=p.organization,j=migrateJustice(p),r=null,title='',summary='',data={};
 if(type==='youth-promise'){r=pk(rels,'story');title='Une promesse avec '+r.name;summary='Un lien de jeunesse commence à devenir plus important qu’une simple rencontre.';data.focus=pk(['Discipline','Réflexes','Combat'],'story')}
 else if(type==='island-secret'){title='Une piste à '+p.island;summary='Un détail revient dans plusieurs indices locaux : '+profile.signature+'.';data.familiarity=site.familiarity;data.signature=profile.signature}
 else if(type==='social-favor'){r=pk(rels,'story');title=r.name+' a besoin de toi';summary='Une relation importante te demande une aide qui pourrait laisser une trace durable.';data.cost=Math.min(Math.max(500,Math.round(800+R('story')*4500)),Math.max(500,Math.round(p.money*.18)))}
 else if(type==='career-crossroads'){title='Un choix dans ta carrière';summary='Une opportunité plus risquée que ton travail habituel se présente dans '+p.region+'.';data.danger=cl(inf().danger+15+R('story')*25,20,95)}
 else if(type==='justice-shadow'){title='La pression se rapproche';summary='Des signes indiquent que les autorités s’intéressent davantage à tes mouvements.';data.heat=j.regionalHeat[p.region]||0}
 else if(type==='rival-challenge'){r=pk(rivals,'story');title='Le défi de '+r.name;summary='Ta rivalité avec '+r.name+' réclame une réponse concrète.';data.rivalPower=relationPower(r)}
 else if(type==='organization-crisis'){title='Tensions dans '+o.name;summary=o.supplies<30?'Les provisions deviennent un problème sérieux pour le groupe.':'Le moral du groupe commence à se fissurer.';data.cost=5000+Math.round(R('story')*10000)}
 return{title:title,summary:summary,participant:r,data:data}
}
function startStory(type){
 var p=game.player,eng=migrateStoryEngine(game),base=storyBase(type);if(!base.title)return null;var id='story-'+(++eng.seq)+'-'+Math.floor(R('story')*99999),story={id:id,type:type,title:base.title,summary:base.summary,status:'active',stage:0,awaiting:false,createdAge:p.ageMonths,nextAge:p.ageMonths+1+R('story')*2,deadlineAge:p.ageMonths+8+R('story')*6,location:p.island,region:p.region,participantId:base.participant?base.participant.id:null,participantName:base.participant?base.participant.name:null,data:base.data||{},choice:null,lastBeat:'Ouverture'};
 eng.active.push(story);eng.stats.started++;eng.lastStartAge=p.ageMonths;tl('Nouveau fil — '+story.title,story.summary,'major');return story
}
function maybeStartStory(m){
 var p=game.player,eng=migrateStoryEngine(game),active=activeStories();if(p.ageMonths<72||p.travel||game.mission||active.length>=2||p.ageMonths-eng.lastStartAge<4)return false;var types=storyEligibleTypes();if(!types.length)return false;var chance=cl(.025+.035*m+(active.length?0:.025),.03,.18);if(R('story')>chance)return false;return!!startStory(pickStoryType(types))
}
function storyPrompt(story){
 if(story.type==='youth-promise')return story.participantName+' te propose de vous fixer un objectif commun pour les mois qui viennent.';
 if(story.type==='island-secret')return'Les indices autour de "'+story.data.signature+'" deviennent assez précis pour justifier une vraie recherche.';
 if(story.type==='social-favor')return story.participantName+' te demande une aide concrète. Cela pourrait te coûter environ '+Math.round(story.data.cost||0).toLocaleString('fr-FR')+' B.';
 if(story.type==='career-crossroads')return'Ta hiérarchie ou ton réseau te propose une voie plus risquée, mais potentiellement plus profitable.';
 if(story.type==='justice-shadow')return'La pression des autorités augmente. Tu dois choisir comment réagir avant qu’elles ne décident pour toi.';
 if(story.type==='rival-challenge')return story.participantName+' veut régler une partie de votre rivalité face à face.';
 if(story.type==='organization-crisis')return'Ton groupe attend une réponse avant que la situation ne se détériore.';
 return story.summary
}
function storyChoices(story){
 if(story.type==='youth-promise')return[{id:'commit',label:'Faire la promesse',desc:'T’investir et voir où ce lien vous mène.'},{id:'distance',label:'Garder tes distances',desc:'Ne pas transformer ce lien en engagement.'}];
 if(story.type==='island-secret')return[{id:'investigate',label:'Suivre la piste',desc:'Consacrer du temps et prendre le risque de te tromper.'},{id:'leave',label:'Laisser tomber',desc:'Ne pas poursuivre cette histoire.'}];
 if(story.type==='social-favor')return[{id:'help',label:'L’aider',desc:'Dépenser des ressources et renforcer potentiellement votre lien.'},{id:'refuse',label:'Refuser',desc:'Préserver tes ressources mais assumer la réaction.'}];
 if(story.type==='career-crossroads')return[{id:'bold',label:'Prendre le risque',desc:'Plus de potentiel, mais une vraie possibilité d’échec.'},{id:'steady',label:'Rester méthodique',desc:'Récompense plus modeste mais risque limité.'}];
 if(story.type==='justice-shadow')return[{id:'hide',label:'Disparaître quelque temps',desc:'Miser sur la discrétion pour faire retomber la pression.'},{id:'defy',label:'Ne rien céder',desc:'Assumer publiquement la pression et renforcer ta réputation.'}];
 if(story.type==='rival-challenge')return[{id:'accept',label:'Accepter le duel',desc:'Mettre votre progression à l’épreuve.'},{id:'decline',label:'Refuser cette fois',desc:'Reporter la confrontation, avec un coût relationnel.'}];
 if(story.type==='organization-crisis')return[{id:'fund',label:'Financer une solution',desc:'Utiliser tes Berry pour stabiliser rapidement la situation.'},{id:'rally',label:'Rallier le groupe',desc:'Miser sur ton Commandement plutôt que sur l’argent.'}];
 return[]
}
function setStoryAwaiting(story){
 story.awaiting=true;story.lastBeat='Décision';story.summary=storyPrompt(story);tl('Décision — '+story.title,story.summary,'major')
}
function closeStory(story,outcome,text,failed,closure){
 var eng=migrateStoryEngine(game);closure=closure||(failed?'failed':'resolved');story.status=closure;story.awaiting=false;story.outcome=outcome;story.result=text;story.closure=closure;story.resolvedAge=game.player.ageMonths;eng.active=eng.active.filter(function(s){return s.id!==story.id});eng.history.unshift({id:story.id,type:story.type,title:story.title,outcome:outcome,result:text,closure:closure,resolvedAge:story.resolvedAge,generation:game.dynasty?game.dynasty.generation:1});eng.history=eng.history.slice(0,30);if(closure==='failed')eng.stats.failed++;else if(closure==='abandoned')eng.stats.abandoned++;else if(closure==='interrupted')eng.stats.interrupted++;else eng.stats.resolved++;game.codex.events=game.codex.events||[];var label='Fil narratif : '+story.title;if(game.codex.events.indexOf(label)<0)game.codex.events.push(label);var prefix=closure==='resolved'?'Fil abouti — ':closure==='abandoned'?'Fil abandonné — ':closure==='interrupted'?'Fil interrompu — ':'Fil échoué — ';tl(prefix+story.title,text,closure==='resolved'?'major':'danger')
}
function storyResolve(story){
 var p=game.player,r=storyRelation(story),site=explorationSite(story.location),success=false,text='',rec=null,o=p.organization,j=migrateJustice(p);
 if(story.type==='youth-promise'){
  if(!r||r.status!=='active')return closeStory(story,'interrompu','Le lien disparaît avant que votre promesse puisse réellement prendre forme.',true,'interrupted');
  var g=gain(story.data.focus||'Discipline',.4+.5*R('story'));r.trust=cl(r.trust+6,0,100);r.respect=cl(r.respect+4,0,100);r.affection=cl(r.affection+4,0,100);addRelationMemory(r,'Vous avez tenu une promesse de jeunesse ensemble.','story');text='Votre engagement tient. '+r.name+' devient un souvenir structurant de ta jeunesse'+(g?' • '+story.data.focus+' +'+g.toFixed(1):'')+'.';return closeStory(story,'promesse tenue',text,false)
 }
 if(story.type==='island-secret'){
  if(p.island!==story.location)return closeStory(story,'piste perdue','Tu quittes '+story.location+' avant d’avoir pu aller au bout de la piste.',true);
  var score=(p.skills.Navigation||0)*.35+(p.stats.Discipline||0)*.25+(p.haki.Observation||0)*.15+site.familiarity*.35,target=35+infStatic(story.location).danger*.35,ok=R('story')<cl(.35+(score-target)/120,.12,.9);if(ok){site.familiarity=cl(site.familiarity+8,0,100);var found=discoverByKnowledge(story.location),value=1200+Math.round(R('story')*(3000+infStatic(story.location).danger*100));p.money+=value;text='La piste mène quelque part. '+(found?'Une nouvelle découverte entre dans ton Codex. ':'Tu confirmes un détail que peu de gens connaissent. ')+'Tu récupères aussi '+value.toLocaleString('fr-FR')+' B.';return closeStory(story,'secret éclairci',text,false)}p.energy=cl(p.energy-8,0,100);return closeStory(story,'fausse piste','La piste s’effondre après plusieurs recherches. Tu en ressors surtout plus prudent.',true)
 }
 if(story.type==='social-favor'){
  if(!r||r.status!=='active')return closeStory(story,'occasion perdue','La situation change avant que tu puisses réellement aider '+story.participantName+'.',true,'interrupted');
  var need=Math.max(1,story.data.cost||1),paid=Math.max(0,story.data.paid||0),support=paid/need+(p.skills.Commandement||0)/160+(p.stats.Volonté||0)/260;
  if(story.choice==='help'&&support<.28){r.trust=cl(r.trust-1,0,100);return closeStory(story,'aide insuffisante','Tu essaies d’aider, mais tes ressources et ton influence ne suffisent pas à résoudre le problème.',true)}
  r.trust=cl(r.trust+7,0,100);r.loyalty=cl(r.loyalty+5,0,100);r.affection=cl(r.affection+3,0,100);r.favorBalance=cl((r.favorBalance||0)+1,-5,5);addRelationMemory(r,'Tu réponds présent dans une période difficile.','story');return closeStory(story,'lien renforcé',story.participantName+' n’oublie pas ton aide. Votre relation gagne en confiance et une dette sociale apparaît.',false)
 }
 if(story.type==='career-crossroads'){
  rec=careerRecord();var bold=story.choice==='bold',careerScore=power()+(p.stats.Discipline||0)*.35+(rec.xp||0)*.02,danger=story.data.danger||50;success=!bold||R('story')<cl(.38+(careerScore-danger)/100,.16,.88);if(success){var xp=bold?12+Math.round(R('story')*16):6+Math.round(R('story')*7);rec.xp+=xp;p.reputation+=bold?4:2;text='Tu transformes ce choix en progression concrète : +'+xp+' XP carrière.';return closeStory(story,bold?'pari réussi':'progression sûre',text,false)}p.reputation=Math.max(0,p.reputation-2);p.health=cl(p.health-(3+R('story')*8),1,100);return closeStory(story,'pari manqué','L’opportunité se retourne contre toi. Tu conserves ton poste, mais l’échec laisse des traces.',true)
 }
 if(story.type==='justice-shadow'){
  var heat=j.regionalHeat[p.region]||0;if(story.choice==='hide'){var hideScore=(p.skills.Discrétion||0)*.8+(p.stats.Discipline||0)*.2,okHide=R('story')<cl(.35+(hideScore-heat)/110,.15,.9);if(okHide){j.regionalHeat[p.region]=cl(heat-18,0,100);j.notoriety=cl(j.notoriety-5,0,100);return closeStory(story,'pression évitée','Tu changes suffisamment tes habitudes pour faire retomber une partie de la pression.',false)}j.regionalHeat[p.region]=cl(heat+9,0,100);return closeStory(story,'repéré','Tes efforts pour disparaître attirent finalement davantage l’attention.',true)}
  p.reputation+=3;j.regionalHeat[p.region]=cl(heat+12,0,100);if(p.faction==='Pirates'||p.faction==='Révolutionnaires')issueBounty(4000+Math.round(heat*220),'Défi aux autorités');return closeStory(story,'défi assumé','Tu refuses de te cacher. Ta réputation augmente, mais les autorités resserrent leur attention.',false)
 }
 if(story.type==='rival-challenge'){
  if(!r||r.status!=='active')return closeStory(story,'duel impossible','Ton rival n’est plus disponible pour cette confrontation.',true,'interrupted');var rp=relationPower(r),chance=cl(.5+(power()-rp)/85,.12,.88),win=R('story')<chance;if(win){p.wins++;r.rivalWins=(r.rivalWins||0)+1;r.rivalry=cl(r.rivalry+5,0,100);r.respect=cl(r.respect+6,0,100);addRelationMemory(r,'Tu remportes un duel important dans votre rivalité.','story');return closeStory(story,'duel remporté','Tu prends l’avantage sur '+r.name+'. La rivalité gagne en respect autant qu’en intensité.',false)}p.losses++;r.rivalLosses=(r.rivalLosses||0)+1;r.rivalry=cl(r.rivalry+6,0,100);r.respect=cl(r.respect+3,0,100);p.health=cl(p.health-(3+R('story')*7),1,100);addRelationMemory(r,'Te bat lors d’un duel important.','story');return closeStory(story,'duel perdu',r.name+' prend l’avantage cette fois. La rivalité, elle, ne disparaît pas.',false)
 }
 if(story.type==='organization-crisis'){
  if(!o)return closeStory(story,'groupe disparu','Ton organisation n’existe plus lorsque vient le moment de résoudre la crise.',true,'interrupted');if(story.choice==='fund'){o.morale=cl(o.morale+10,0,100);o.supplies=cl(o.supplies+18,0,100);o.cohesion=cl(o.cohesion+4,0,100);return closeStory(story,'crise financée','L’investissement stabilise les ressources et le moral du groupe.',false)}var cmd=p.skills.Commandement||0,okCmd=R('story')<cl(.35+cmd/130,.2,.9);if(okCmd){o.morale=cl(o.morale+12,0,100);o.cohesion=cl(o.cohesion+8,0,100);return closeStory(story,'groupe rallié','Ton autorité suffit à ressouder le groupe sans achat massif.',false)}o.morale=cl(o.morale-7,0,100);o.cohesion=cl(o.cohesion-5,0,100);return closeStory(story,'crise aggravée','Ton discours ne convainc pas assez. La tension interne augmente.',true)
 }
}
function storyChoice(storyId,choiceId){
 var eng=migrateStoryEngine(game),story=eng.active.find(function(s){return s.id===storyId});if(!story||!story.awaiting)return false;story.choice=choiceId;story.awaiting=false;eng.stats.choices++;
 if(story.type==='youth-promise'&&choiceId==='distance'){var yr=storyRelation(story);if(yr)yr.trust=cl(yr.trust-2,0,100);return closeStory(story,'distance gardée','Tu choisis de ne pas transformer ce lien en promesse durable.',false,'abandoned')}
 if(story.type==='island-secret'&&choiceId==='leave')return closeStory(story,'piste abandonnée','Tu décides que cette piste ne mérite pas davantage de temps.',false,'abandoned');
 if(story.type==='social-favor'&&choiceId==='refuse'){var sr=storyRelation(story);if(sr){sr.trust=cl(sr.trust-5,0,100);sr.affection=cl(sr.affection-2,0,100);addRelationMemory(sr,'Tu refuses de l’aider lors d’un moment important.','story')}return closeStory(story,'aide refusée','Tu protèges tes ressources, mais '+story.participantName+' retient ton refus.',false,'abandoned')}
 if(story.type==='social-favor'&&choiceId==='help'){var need=Math.max(0,story.data.cost||0),cost=Math.min(Math.max(0,game.player.money),need);game.player.money-=cost;story.data.paid=cost;story.data.unpaid=Math.max(0,need-cost)}
 if(story.type==='rival-challenge'&&choiceId==='decline'){var rr=storyRelation(story);if(rr){rr.rivalry=cl(rr.rivalry+3,0,100);rr.respect=cl(rr.respect-3,0,100)}return closeStory(story,'duel reporté','Tu refuses cette confrontation. Ton rival ne l’oublie pas.',false,'abandoned')}
 if(story.type==='organization-crisis'&&choiceId==='fund'){var need=story.data.cost||5000;if(game.player.money<need){story.choice='rally'}else game.player.money-=need}
 story.stage=1;story.nextAge=game.player.ageMonths+1+R('story')*3;story.deadlineAge=Math.max(story.deadlineAge,story.nextAge+4);story.lastBeat='Conséquence en attente';story.summary='Ta décision est prise. Il faut maintenant laisser la situation évoluer.';tl('Choix — '+story.title,storyChoices(story).find(function(x){return x.id===choiceId})?.label||choiceId);return true
}
function storyTick(m){
 var p=game.player,eng=migrateStoryEngine(game),list=activeStories().slice();for(var i=0;i<list.length;i++){var story=list[i];if(story.type==='island-secret'&&p.travel&&p.travel.from===story.location){closeStory(story,'piste laissée derrière','Tu prends la mer avant d’avoir résolu ce mystère local.',true,'interrupted');continue}if(story.awaiting)continue;if(p.ageMonths>story.deadlineAge){closeStory(story,'échéance dépassée','La situation se referme avant que tu puisses aller au bout.',true);continue}if(p.ageMonths<story.nextAge)continue;
  if(story.stage===0){setStoryAwaiting(story);continue}
  if(story.stage===1)storyResolve(story)
 }
 if(!awaitingStory()&&!migrateJustice(p).detained)maybeStartStory(m)
}
function showStoryDecision(id){
 var story=id?activeStories().find(function(s){return s.id===id}):awaitingStory();if(!story||!story.awaiting)return false;var choices=storyChoices(story).map(function(c){return[c.label,c.desc,function(){storyChoice(story.id,c.id)}]});if(!choices.length)return false;decision(story.title,storyPrompt(story),choices);return true
}
function showAttention(){
 if(game&&game.pending)return showDecision();var s=awaitingStory();if(s)return showStoryDecision(s.id)
}
function renderStories(){
 var eng=migrateStoryEngine(game),active=activeStories(),awaiting=awaitingStory();$('#storyEngineBadge').textContent=active.length?active.length+' actif'+(active.length>1?'s':''):'Aucun fil';$('#storySummary').innerHTML='<div><span>Démarrés</span><strong>'+eng.stats.started+'</strong></div><div><span>Aboutis</span><strong>'+eng.stats.resolved+'</strong></div><div><span>Abandonnés</span><strong>'+eng.stats.abandoned+'</strong></div><div><span>Échecs</span><strong>'+eng.stats.failed+'</strong></div><div><span>Interrompus</span><strong>'+eng.stats.interrupted+'</strong></div><div><span>Choix</span><strong>'+eng.stats.choices+'</strong></div>';
 $('#activeStories').innerHTML=active.length?active.map(function(s){var wait=s.awaiting,remaining=Math.max(0,s.deadlineAge-game.player.ageMonths);return'<div class="story-thread '+(wait?'awaiting':'')+'"><div class="story-thread-head"><strong>'+e(s.title)+'</strong><span>'+(wait?'Décision':'Étape '+(s.stage+1))+'</span></div><p>'+e(s.summary)+'</p><div class="story-thread-meta"><span>'+e(s.region||'')+'</span><span>'+(remaining<=0?'Échéance immédiate':durationText(remaining)+' avant échéance')+'</span>'+(s.participantName?'<span>'+e(s.participantName)+'</span>':'')+'</div>'+(wait?'<div class="story-thread-actions"><button data-story-decision="'+e(s.id)+'">Voir les choix</button></div>':'')+'</div>'}).join(''):'<p class="helper-text">Aucun fil narratif actif. Les situations naissent naturellement des relations, de la carrière, de l’exploration et du monde.</p>';
 $$('[data-story-decision]').forEach(function(b){b.onclick=function(){showStoryDecision(b.dataset.storyDecision)}});
 $('#storyHistory').innerHTML=eng.history.length?'<span class="tiny-label">Fils récents</span>'+eng.history.slice(0,5).map(function(h){var cls=h.closure==='resolved'?'story-outcome-success':'story-outcome-failed';return'<div class="story-history-item '+cls+'"><strong>'+e(h.title)+' • '+e(h.outcome||h.closure||'clos')+'</strong>'+e(h.result||'')+'</div>'}).join(''):''
}

function migrate(g){
 if(!g)return null;var p=g.player||{},w=g.world||{};
 g.version=23;g.lastCombat=g.lastCombat||null;g.rng=g.rng||{};migrateLifeLoop(g);migrateExploration(p);migrateStoryEngine(g);if(g.pending&&!pendingIsExecutable(g.pending))g.pending=null;
 p.techniques=p.techniques||[];p.techniqueMastery=p.techniqueMastery||{};p.fruitMastery=p.fruitMastery||0;p.fruitAwakened=!!p.fruitAwakened;p.heldFruit=p.heldFruit||null;p.combatXP=p.combatXP||0;p.hakiApplications=p.hakiApplications||{Observation:[],Armement:[],Conquérant:[]};
 p.haki=p.haki||{Observation:0,Armement:0,Conquérant:0};p.latent=p.latent||{Observation:40,Armement:40,Conquérant:0};p.conditions=p.conditions||[];
 normalizeActivityFocus(p);
  p.life=p.life||defaultLife();p.life.assets=p.life.assets||{property:0,business:0,ship:0,treasure:0};p.life.debt=Math.max(0,p.life.debt||0);p.life.debtPeak=Math.max(0,p.life.debtPeak||0);p.life.debtInterestPaid=Math.max(0,p.life.debtInterestPaid||0);if(p.money<0){p.life.debt+=-p.money;p.life.debtPeak=Math.max(p.life.debtPeak,p.life.debt);p.money=0}p.children=p.children||[];p.children=p.children.map(function(c,i){c.id=c.id||('child-'+i+'-'+H(String(g.seed)+':child:'+i));c.name=c.name||PEOPLE_NAMES[H(String(g.seed)+':childname:'+i)%PEOPLE_NAMES.length];c.ageMonths=c.ageMonths||0;c.birthplace=c.birthplace||p.island||'';c.birthRegion=c.birthRegion||p.region||p.origin;c.race=c.race||p.race||'Humain';c.status=c.status||'active';return c});
 g.codex=g.codex||{people:[],places:[],factions:['Civil'],fruits:[]};['people','places','factions','fruits','events','techniques','discoveries'].forEach(function(k){g.codex[k]=g.codex[k]||[]});g.relations=(g.relations||[]).map(function(r,i){return normalizeRelation(g,r,i)});g.socialSeq=g.socialSeq||g.relations.length;g.achievements=g.achievements||{unlocked:{}};g.achievements.unlocked=g.achievements.unlocked||{};g.dynasty=g.dynasty||{generation:1,ancestors:[]};
 p.factionRep=p.factionRep||{Civil:10,Marine:0,Pirates:0,'Chasseur de primes':0,Révolutionnaires:0,Gouvernement:0};
 FACTION_KEYS.forEach(function(k){if(p.factionRep[k]==null)p.factionRep[k]=0});
 p.careerRecords=p.careerRecords||{};p.specialization=p.specialization||null;p.careerHistory=p.careerHistory||[];p.salaryTotal=p.salaryTotal||0;p.deserterFrom=p.deserterFrom||[];migrateOrganization(g,p);migrateJustice(p);migrateInfluence(p);migrateStrategy(p);migrateTrade(p);migrateProgression(g,p);
 if(p.career&&p.career!=='Aucune'&&!p.careerRecords[p.faction])p.careerRecords[p.faction]={xp:p.careerXP||0,months:p.serviceMonths||0,rank:p.rank||firstRank(p.faction),specialization:p.specialization||null,successes:0,failures:0};
 if(p.careerRecords[p.faction]){p.rank=p.careerRecords[p.faction].rank||p.rank;p.specialization=p.careerRecords[p.faction].specialization||p.specialization}
 w.fruits=w.fruits||['Mera Mera no Mi','Ope Ope no Mi','Hie Hie no Mi','Moku Moku no Mi'];w.fruitRegistry=w.fruitRegistry||{};
 w.fruits.forEach(function(n){if(!w.fruitRegistry[n])w.fruitRegistry[n]={status:p.fruit===n?'consumed':'available',holder:p.fruit===n?p.name:null}});
 w=initWorldEconomy(g,initGrandStrategy(initLivingWorld(g,w)));var dk=String(g.seed),ix=migrateInfluence(p);ix.domains=Object.keys(w.territories).filter(function(n){var pc=w.territories[n].playerControl;return pc&&pc.ownerKey===dk});ix.affiliates=w.crews.filter(function(c){return c.affiliation&&c.affiliation.ownerKey===dk&&c.status==='active'}).map(function(c){return c.id});g.player=p;g.world=w;return g
}
function load(i){try{return migrate(JSON.parse(localStorage.getItem(P+i)||'null'))}catch(x){return null}}
function tl(t,d,y){game.timeline.unshift({age:age(),title:t,desc:d,type:y||''});game.timeline=game.timeline.slice(0,100);var l=migrateLifeLoop(game);l.momentSeq++;if(['major','danger','canon'].indexOf(y)>=0)l.majorSeq++}
function news(t,d,type){game.news.unshift({title:t,desc:d,type:type||''});game.news=game.news.slice(0,35)}
function press(){var o={};REG.forEach(function(r){o[r]={Piraterie:20+R('w')*25,Marine:30+R('w')*35,Criminalité:15+R('w')*30,Révolution:5+R('w')*20,Prospérité:40+R('w')*35,Instabilité:10+R('w')*25}});return o}
function make(){
 var seed=Number($('#seedInput').value)||Math.floor(Math.random()*2147483647);game={seed:seed,rng:{}};var origin=mode==='custom'?$('#originInput').value:pk(ORIG,'b');
 game={version:23,seed:seed,rng:game.rng,alive:true,pending:null,mission:null,timeline:[],news:[],relations:[],codex:{people:[],places:[],factions:['Civil'],fruits:[],events:[],techniques:[],discoveries:[]},world:{year:0,month:0,divergence:0,pressures:{},factions:{Marine:82,Pirates:79,Révolutionnaires:56,Gouvernement:94},canon:[['Exécution de Gol D. Roger',0,'completed',100],['Nouvelle génération',18,'future',75],['Guerre au sommet',22,'future',95]],fruits:['Mera Mera no Mi','Ope Ope no Mi','Hie Hie no Mi','Moku Moku no Mi']},player:{name:$('#nameInput').value.trim()||'Kael Maren',difficulty:$('#difficultyInput').value,ageMonths:0,race:mode==='custom'?$('#raceInput').value:pk(['Humain','Humain','Humain','Mink','Homme-poisson'],'b'),origin:origin,region:origin,island:'',situation:'Enfance',activity:'Grandir',faction:'Civil',career:'Aucune',rank:'Enfant',money:3000,health:100,energy:100,danger:'Faible',conditions:[],bounty:0,highestBounty:0,reputation:0,ambition:'Survivre',wins:0,losses:0,travel:null,visited:[],style:mode==='custom'?$('#styleInput').value:pk(['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],'b'),fruit:null,heldFruit:null,fruitMastery:0,fruitAwakened:false,techniques:[],techniqueMastery:{},combatXP:0,hakiApplications:{Observation:[],Armement:[],Conquérant:[]},haki:{Observation:0,Armement:0,Conquérant:0},latent:{Observation:20+R('h')*60,Armement:20+R('h')*60,Conquérant:R('h')<.04?90:0},stats:{},skills:{},caps:{}}};
 game=applyMeta(migrate(game));syncCanonicalFruits();var homes=Object.keys(PL).filter(function(n){return PL[n][0]===origin});game.player.island=pk(homes,'b');game.player.visited=[game.player.island];game.codex.places=[game.player.island];game.world.pressures=press();var birthSite=explorationSite(game.player.island);birthSite.familiarity=22;birthSite.visits=1;
 ST.forEach(function(k){game.player.stats[k]=8+R('b')*12;game.player.caps[k]=68+R('c')*25});SK.forEach(function(k){game.player.skills[k]=2+R('b')*8;game.player.caps[k]=68+R('c')*25});game.player.naturalCaps={};game.player.absoluteCaps={};ST.concat(SK).forEach(function(k){game.player.naturalCaps[k]=game.player.caps[k];game.player.absoluteCaps[k]=cl(game.player.caps[k]+5+(H(String(game.seed)+':absolute:'+k)%8),game.player.caps[k],100)});game.player.progression=defaultProgression(game.player);
 syncPowers();recordProgressSnapshot(true);tl('Naissance','Tu nais à '+game.player.island+', dans '+origin+'.','major');news('Grande Ère de la Piraterie','Le monde entre dans une période de bouleversements.');save();return game}
function diff(){var d=game.player.difficulty;return d==='Casual'?[1.18,.75]:d==='Grand Line'?[.97,1.15]:d==='New World'?[.93,1.35]:d==='Ironman'?[.9,1.55]:[1,1]}
function allTechniqueDefs(){return[].concat.apply([],Object.keys(TECH).map(function(k){return TECH[k]})).concat(SPECIAL_TECHNIQUES)}function techniqueBonus(){var p=game.player,b=0,all=allTechniqueDefs();(p.techniques||[]).forEach(function(id){var t=all.find(function(x){return x.id===id});if(t){var m=cl((p.techniqueMastery&&p.techniqueMastery[id])||1,0,100),factor=.25+.75*(m/100);b+=(t.bonus||0)*factor}});return b}function techniqueEffectiveBonus(id){var p=game.player,t=allTechniqueDefs().find(function(x){return x.id===id});if(!t)return 0;var m=cl((p.techniqueMastery&&p.techniqueMastery[id])||1,0,100);return(t.bonus||0)*(.25+.75*m/100)}
function styleMastery(){var p=game.player;if(p.style==='Corps-à-corps')return(p.skills.Combat||0)*.55+(p.stats.Force||0)*.30+(p.stats.Endurance||0)*.15;if(p.style==='Sabreur')return(p.skills.Sabre||0)*.62+(p.skills.Combat||0)*.23+(p.stats.Réflexes||0)*.15;if(p.style==='Tireur')return(p.skills.Tir||0)*.62+(p.stats.Réflexes||0)*.23+(p.stats.Discipline||0)*.15;if(p.style==='Mobile / esquive')return(p.skills.Combat||0)*.45+(p.stats.Agilité||0)*.33+(p.stats.Vitesse||0)*.22;return(p.skills.Combat||0)*.62+(p.stats.Discipline||0)*.20+(p.stats.Réflexes||0)*.18}
function power(){var p=game.player,physical=(p.stats.Force+p.stats.Vitesse+p.stats.Agilité+p.stats.Endurance+p.stats.Résistance+p.stats.Réflexes)/6,martial=styleMastery(),mental=p.stats.Discipline*.45+p.stats.Volonté*.55,h=p.haki.Observation*.06+p.haki.Armement*.08+p.haki.Conquérant*.10,f=p.fruit?(4+p.fruitMastery*.08+(p.fruitAwakened?6:0)):0;return physical*.36+martial*.30+mental*.08+h+f+techniqueBonus()*.30}
function powerRank(){var v=power();return v<20?'Novice':v<35?'Combattant':v<50?'Confirmé':v<65?'Élite':v<80?'Monstrueux':'Sommet'}
function unlockTechnique(t,label){var p=game.player;if(p.techniques.indexOf(t.id)>=0)return;p.techniques.push(t.id);p.techniqueMastery[t.id]=1;if(game.codex&&game.codex.techniques&&game.codex.techniques.indexOf(t.name)<0)game.codex.techniques.push(t.name);tl(label||'Nouvelle technique',t.name+' entre dans ton répertoire.','major')}
function syncPowers(){var p=game.player,prof=TECH[p.style]||TECH['Équilibré'];prof.forEach(function(t){if((p.skills[t.skill]||0)>=t.req)unlockTechnique(t)});SPECIAL_TECHNIQUES.forEach(function(t){if(specialRequirementMet(t,p))unlockTechnique(t,'Technique spéciale')});Object.keys(HAKI_APPS).forEach(function(k){p.hakiApplications[k]=HAKI_APPS[k].filter(function(a){return p.haki[k]>=a[0]}).map(function(a){return a[1]})})}
function trainHaki(k,m){var p=game.player,learn=developmentFactor('Combat');if(!p.haki[k]){if(p.latent[k]>55&&R('h')<.025*m*learn*(p.latent[k]/70)){p.haki[k]=1;tl('Éveil du Haki','Ton Haki de '+k+' s’éveille.','major')}return}p.haki[k]=cl(p.haki[k]+m*learn*(.35+p.latent[k]/160)*cl(1-p.haki[k]/125,.12,1),0,100)}
function trainFruit(m){var p=game.player;if(!p.fruit)return;var learn=developmentFactor('Combat');p.fruitMastery=cl(p.fruitMastery+m*learn*(.55+R('fruit')*.45)*cl(1-p.fruitMastery/120,.15,1),0,100);if(p.fruitMastery>=85&&!p.fruitAwakened&&R('fruit')<.015*m*learn){p.fruitAwakened=true;tl('ÉVEIL DU FRUIT','Ta maîtrise franchit un seuil extraordinaire.','major')}}
function learnMastery(m,focus){
 var p=game.player,defs=allTechniqueDefs(),fs=Array.isArray(focus)?focus:focus?[focus]:[];(p.techniques||[]).forEach(function(id){var def=defs.find(function(x){return x.id===id}),relevant=!fs.length||(def&&def.skill&&fs.indexOf(def.skill)>=0)||(def&&def.requires&&def.requires.skill&&fs.indexOf(def.requires.skill)>=0);if(!relevant)return;var cur=p.techniqueMastery[id]||1;p.techniqueMastery[id]=cl(cur+m*(.28+R('p')*.38)*cl(1-cur/125,.15,1),0,100)});syncPowers()
}
function gain(k,n){var p=game.player,b=p.stats[k]!=null?p.stats:p.skills,z=b[k],cap=p.caps[k]||90;if(z>=cap)return 0;var raw=n*diff()[0]*developmentFactor(k)*cl(1-Math.pow(z/110,1.7),.1,1),next=cl(z+raw,0,cap),g=next-z;b[k]=next;trackProgressGain(k,g);return g}
function activityGrowthKeys(a){if(a==='Explorer')return['Réflexes','Navigation'];if(SIMPLE_FOCUS[a])return simpleFocusKeys(a);var profile=TRAINING_PROFILES[a];return profile?profile.keys.slice():[]}
function train(m){
 var p=game.player;
 if(p.activity==='Pouvoirs'){
  gain('Volonté',m*(.28+R('p')*.32));gain('Discipline',m*(.18+R('p')*.25));
  if(p.fruit)trainFruit(m*.82);
  var awakened=Object.keys(p.haki).filter(function(k){return p.haki[k]>0});
  if(awakened.length)awakened.forEach(function(k){trainHaki(k,m*.48)});
  else if(p.ageMonths>=144){trainHaki('Observation',m*.32);trainHaki('Armement',m*.28);if((p.latent.Conquérant||0)>0)trainHaki('Conquérant',m*.18)}
  learnMastery(m*.35,['Combat','Sabre','Tir']);return
 }
 var ks=activityGrowthKeys(p.activity);if(!ks.length)ks=[pk(ST,'p'),pk(SK,'p')];
 var rate=p.activity==='Équilibre'?.48:p.activity==='Carrière'?.56:p.activity==='Combat'?.57:.52;
 ks.forEach(function(k){gain(k,m*(rate+R('p')*.72))});
 if(p.fruit&&R('fruit')<.35)trainFruit(m*.25);if(p.haki.Observation&&R('h')<.25)trainHaki('Observation',m*.18);if(p.haki.Armement&&R('h')<.25)trainHaki('Armement',m*.18);learnMastery(m,ks)
}

function relationById(id){return game.relations.find(function(r){return r.id===id})||null}
function partnerRelation(){var id=game.player.life.partnerId;return id?relationById(id):null}
function createRelation(role){
 var p=game.player,i=game.socialSeq++,name=pk(PEOPLE_NAMES,'r'),tries=0,years=p.ageMonths/12,roles=years<6?['proche de la famille','connaissance']:years<12?['ami','rival','connaissance']:years<15?['ami','rival','connaissance','mentor']:['ami','rival','mentor','collègue','connaissance'];
 while(game.relations.some(function(r){return r.name===name})&&tries++<12)name=pk(PEOPLE_NAMES,'r');
 var chosen=role||pk(roles,'r');if(years<6&&(chosen==='rival'||chosen==='mentor'||chosen==='collègue'))chosen='connaissance';else if(years<12&&(chosen==='mentor'||chosen==='collègue'))chosen='connaissance';if(years<15&&chosen==='collègue')chosen='connaissance';
 var faction=years<15&&chosen!=='mentor'?'Civil':pk([p.faction,'Civil','Marine','Pirates'],'r'),r=normalizeRelation(game,{id:'rel-'+i+'-'+Math.floor(R('r')*99999),name:name,role:chosen,faction:faction,location:p.island,monthsKnown:0},i);
 if(years<12&&['ami','rival','connaissance'].indexOf(r.role)>=0)r.npcAgeMonths=cl(p.ageMonths-24+R('r')*48,Math.max(0,p.ageMonths-30),p.ageMonths+30);
 if(r.role==='rival'){var span=years<12?24:48;r.npcAgeMonths=cl(p.ageMonths-span/2+R('r')*span,Math.max(0,p.ageMonths-span),p.ageMonths+span);r.rivalry=45+R('r')*35;r.affection*=.7}
 if(r.role==='mentor'){r.npcAgeMonths=Math.max(216,p.ageMonths+48+R('r')*120);r.respect=Math.max(r.respect,62);r.trust=Math.max(r.trust,50);r.npcPower=Math.max(r.npcPower,cl(power()+10+R('r')*18,20,92));r.npcPotential=Math.max(r.npcPotential,r.npcPower+4)}
 game.relations.push(r);return r
}
function netWorth(){
 var p=game.player,a=p.life.assets||{},debt=Math.max(0,p.life&&p.life.debt||0);return Math.round(Math.max(0,p.money)+(a.property||0)+(a.business||0)+(a.ship||0)+(a.treasure||0)+cargoBookValue()-debt)
}
function livingCostPerMonth(){
 var p=game.player;if(p.ageMonths<180)return 0;var h=HOUSING[p.life.housingLevel||0]||HOUSING[0],base=h.monthly+(p.children||[]).length*850;
 if(p.life.relationshipStatus!=='Célibataire')base+=350;return Math.round(base)
}
function businessIncomePerMonth(){var p=game.player,asset=(p.life.assets||{}).business||0;if(!asset)return 0;var rp=game.world.pressures[p.region]||{},m=game.world.markets&&game.world.markets[p.island],mult=.72+(rp.Prospérité||50)/180;if(m&&m.blockade)mult*=.58;return Math.round(asset*.008*mult)}
function chargeMoney(amount){var p=game.player,l=p.life;amount=Math.max(0,amount||0);var paid=Math.min(Math.max(0,p.money),amount);p.money-=paid;var missing=amount-paid;if(missing>0){l.debt=Math.max(0,(l.debt||0)+missing);l.debtPeak=Math.max(l.debtPeak||0,l.debt)}return{paid:paid,debt:missing}}
function serviceDebt(){var p=game.player,l=p.life,debt=Math.max(0,l.debt||0);if(!debt||p.money<=0)return 0;var pay=Math.min(debt,p.money*.22);p.money-=pay;l.debt-=pay;return pay}
function useSocialAction(){
 var l=game.player.life;if((l.socialActions||0)<1){toast('Tu as déjà consacré assez de temps à ta vie sociale pendant cette période.');return false}
 l.socialActions--;return true
}
function spendTime(id){
 var r=relationById(id),p=game.player;if(!r||r.status!=='active')return;if(!npcNearby(r))return toast(r.name+' n’est pas assez proche pour passer du temps ensemble.');if(!useSocialAction())return;
 var cost=p.ageMonths>=180?300+Math.round(R('life')*700):0;if(p.money<cost)return toast('Tu n’as pas assez de Berry pour cette sortie.');
 p.money-=cost;r.affection=cl(r.affection+2+R('life')*5,0,100);r.trust=cl(r.trust+1+R('life')*4,0,100);r.respect=cl(r.respect+R('life')*2,0,100);if(p.ageMonths>=216)r.attraction=cl(r.attraction+R('life')*3,0,100);addRelationMemory(r,'Vous passez du temps ensemble à '+p.island+'.','social');
 tl('Temps partagé','Tu passes du temps avec '+r.name+'.');save();renderRel();renderChar()
}
function pursueRomance(id){
 var p=game.player,r=relationById(id);if(!r||p.ageMonths<216||r.npcAgeMonths<216)return toast('La romance est réservée aux personnages adultes.');if(p.life.partnerId)return toast('Tu es déjà engagé dans une relation.');if(!useSocialAction())return;
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
 if(id==='divergence')return w.divergence>=10;if(id==='longevity')return p.ageMonths>=720;if(id==='legacy')return game.dynasty.generation>=2;if(id==='commander')return p.organization&&p.organization.authority==='leader'&&p.organization.members.filter(function(m){return m.status==='active'}).length>=6;if(id==='flagship')return p.organization&&p.organization.ship&&(p.organization.ship.tier||0)>=2;if(id==='escape')return p.justice&&p.justice.escapes>=1;if(id==='hunter')return p.justice&&p.justice.captures>=5;if(id==='domain')return p.influence&&p.influence.domains.length>=1;if(id==='regional-power')return p.influence&&p.influence.domains.length>=3;if(id==='fleet')return p.influence&&p.influence.affiliates.length>=3;if(id==='emperor')return p.influence&&p.influence.recognizedTitle==='Empereur des mers';if(id==='campaign')return p.strategy&&p.strategy.campaignsLed>=1;if(id==='strategist')return p.strategy&&p.strategy.warsWon>=3;if(id==='merchant')return p.trade&&p.trade.profit>=100000;if(id==='smuggler')return p.trade&&p.trade.smugglingRuns>=3;if(id==='mentor-bond')return game.relations.some(function(r){return r.mentorSessions>=5});if(id==='nemesis')return game.relations.some(function(r){return (r.rivalWins+r.rivalLosses)>=5});if(id==='known-recruit')return game.relations.some(function(r){return r.joinedOrganization});if(id==='explorer')return p.visited.length>=10;if(id==='discoverer')return p.exploration&&p.exploration.totalDiscoveries>=10;if(id==='cartographer')return p.exploration&&Object.keys(p.exploration.sites||{}).filter(function(n){return p.exploration.sites[n].familiarity>=85}).length>=3;if(id==='story-first')return game.story&&game.story.stats.resolved>=1;if(id==='story-weaver')return game.story&&game.story.stats.resolved>=10;if(id==='story-decisions')return game.story&&game.story.stats.choices>=15;return false
}
function checkAchievements(silent){
 var u=game.achievements.unlocked;ACHIEVEMENTS.forEach(function(a){if(!u[a.id]&&achievementCondition(a.id)){u[a.id]={age:age(),generation:game.dynasty.generation};if(!silent)tl('Achievement : '+a.name,a.desc,'major')}});saveMeta()
}
function lifeTick(m){
 var p=game.player,l=p.life;l.socialActions=2;npcTick(m);
 (p.children||[]).forEach(function(c){if(c.status==='active'){c.ageMonths+=m;c.bond=cl((c.bond||60)+(R('family')-.48)*m*.45,0,100)}});
 game.relations.forEach(function(r){if(r.status!=='active')return;r.monthsKnown+=m;if(r.id===l.partnerId){r.relationshipMonths+=m;r.affection=cl(r.affection+(R('life')-.42)*m*.9,0,100);r.trust=cl(r.trust+(R('life')-.44)*m*.7,0,100);r.loyalty=cl(r.loyalty+(R('life')-.45)*m*.5,0,100)}else{var near=!r.location||r.location===p.island;r.affection=cl(r.affection+(near?(R('life')-.49)*m*.35:-m*.08),0,100);r.trust=cl(r.trust+(R('life')-.5)*m*.2,0,100)}});
 if(p.ageMonths>=180){var cost=livingCostPerMonth()*m,income=businessIncomePerMonth()*m;p.money+=income;l.totalBusinessIncome+=income;chargeMoney(cost);serviceDebt();l.livingCostsPaid+=cost;l.lastExpense=cost;if((l.debt||0)>0){var interest=(l.debt||0)*.006*m;l.debt+=interest;l.debtInterestPaid+=interest;l.debtPeak=Math.max(l.debtPeak||0,l.debt);p.energy=cl(p.energy-m*cl(.35+l.debt/180000,.35,2.1),0,100)}}
 var nw=netWorth();l.netWorthPeak=Math.max(l.netWorthPeak||0,nw);
 var partner=partnerRelation();if(partner&&R('life')<.018*m){if(R('life')<.66){partner.affection=cl(partner.affection+4,0,100);partner.trust=cl(partner.trust+3,0,100);tl('Moment important','Ta relation avec '+partner.name+' se renforce.')}else{partner.affection=cl(partner.affection-6,0,100);partner.trust=cl(partner.trust-5,0,100);tl('Tension dans le couple','Un désaccord fragilise ta relation avec '+partner.name+'.')}}if(partner&&partner.affection<12&&partner.trust<12){partner.role='ex-partenaire';partner.type='social';l.partnerId=null;l.relationshipStatus='Célibataire';tl('Rupture',partner.name+' met fin à votre relation après une longue dégradation.','major')}
 var years=p.ageMonths/12;if(years>55){p.health=cl(p.health-m*(years-55)/70,0,100);if(years>72&&R('life')<Math.pow((years-70)/35,2)*.006*m){die('Décès naturel à '+Math.floor(years)+' ans.');return}}
 checkAchievements()
}
function estateValue(){return Math.max(0,netWorth())}
function buildHeir(child){
 var old=game.player,partner=partnerRelation(),legacyRelations=game.relations.filter(function(r){return r.status==='active'&&(r.canonical||r.role==='mentor'||r.role==='rival'||r.trust>=75||r.loyalty>=75)}).slice(0,10).map(function(r){return JSON.parse(JSON.stringify(r))}),estate=estateValue(),heirs=Math.max(1,old.children.length+(partner?1:0)),share=Math.round(estate/heirs),ancestor={name:old.name,age:age(),career:old.career,rank:old.rank,cause:game.death?game.death.cause:'',estate:estate,bounty:old.highestBounty,generation:game.dynasty.generation};
 game.dynasty.ancestors.push(ancestor);game.dynasty.generation++;
 var parentCaps=old.caps||{},p={name:child.name,difficulty:old.difficulty,ageMonths:child.ageMonths,race:child.race||old.race,origin:child.birthRegion||old.origin,region:old.region,island:old.island,situation:child.ageMonths<180?'Enfance':'Nouvelle génération',activity:child.ageMonths<72?'Grandir':'Études',faction:'Civil',career:'Aucune',rank:child.ageMonths<180?'Enfant':'Sans carrière',money:share,health:100,energy:100,danger:'Faible',conditions:[],bounty:0,highestBounty:0,reputation:Math.round(old.reputation*.12),ambition:'Survivre',wins:0,losses:0,travel:null,visited:[old.island],style:pk(['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],'heir'),fruit:null,heldFruit:null,fruitMastery:0,fruitAwakened:false,techniques:[],techniqueMastery:{},combatXP:0,hakiApplications:{Observation:[],Armement:[],Conquérant:[]},haki:{Observation:0,Armement:0,Conquérant:0},latent:{Observation:20+R('heir')*60,Armement:20+R('heir')*60,Conquérant:R('heir')<.04?90:0},stats:{},skills:{},caps:{},factionRep:{Civil:10,Marine:0,Pirates:0,'Chasseur de primes':0,Révolutionnaires:0,Gouvernement:0},careerRecords:{},specialization:null,careerHistory:[],salaryTotal:0,deserterFrom:[],organization:null,organizationHistory:[],justice:defaultJustice(),influence:defaultInfluence(),strategy:defaultStrategy(),trade:defaultTrade(),exploration:defaultExploration(),life:defaultLife(),children:[]};
 ST.forEach(function(k){var inherited=parentCaps[k]||75;p.caps[k]=cl(inherited*.55+40+R('heir')*15,55,98);p.stats[k]=cl(7+Math.min(25,child.ageMonths/24)+R('heir')*5,5,p.caps[k])});
 SK.forEach(function(k){var inherited=parentCaps[k]||75;p.caps[k]=cl(inherited*.5+42+R('heir')*14,55,98);p.skills[k]=cl(2+Math.min(18,child.ageMonths/36)+R('heir')*4,1,p.caps[k])});p.naturalCaps={};p.absoluteCaps={};ST.concat(SK).forEach(function(k){p.naturalCaps[k]=p.caps[k];p.absoluteCaps[k]=cl(p.caps[k]+5+(H(String(game.seed)+':heir:'+game.dynasty.generation+':'+k)%8),p.caps[k],100)});p.progression=defaultProgression(p);
 var legacyStoryHistory=(game.story&&game.story.history||[]).slice(0,10);game.player=p;game.alive=true;game.death=null;game.pending=null;game.mission=null;game.lastCombat=null;game.timeline=[];game.relations=[];game.loop=defaultLifeLoop();game.story=defaultStoryEngine();game.story.history=legacyStoryHistory;
 if(partner)game.relations.push(normalizeRelation(game,{name:partner.name,role:'parent',type:'family',affection:Math.max(65,partner.affection),trust:Math.max(60,partner.trust),respect:65,loyalty:70,attraction:0,location:old.island,faction:partner.faction},0));
 old.children.filter(function(c){return c.id!==child.id}).forEach(function(c,i){game.relations.push(normalizeRelation(game,{name:c.name,role:'frère / sœur',type:'family',affection:55+(c.bond||0)*.3,trust:55,respect:45,loyalty:60,attraction:0,location:old.island,faction:'Civil'},i+1))});
 legacyRelations.forEach(function(r){if(partner&&r.name===partner.name)return;if(game.relations.some(function(x){return x.name===r.name}))return;var nr=normalizeRelation(game,{name:r.name,role:'relation de la famille',type:r.canonical?'canonical':'legacy',canonical:r.canonical,actorName:r.actorName,faction:r.faction,region:r.region,location:r.location,npcAgeMonths:r.npcAgeMonths,npcPower:r.npcPower,npcPotential:r.npcPotential,npcSpecialty:r.npcSpecialty,npcTrajectory:r.npcTrajectory,npcAmbition:r.npcAmbition,affection:cl(r.affection*.45,15,60),trust:cl(r.trust*.55,20,65),respect:cl(r.respect*.75,25,80),loyalty:cl(r.loyalty*.5,20,65),rivalry:r.role==='rival'?cl(r.rivalry*.35,10,45):0,attraction:0,memories:(r.memories||[]).slice(0,6)},game.relations.length);addRelationMemory(nr,'A connu ton parent '+old.name+' et se souvient de cette génération.','legacy');game.relations.push(nr)});
 game.socialSeq=game.relations.length;syncPowers();recordProgressSnapshot(true);tl('HÉRITAGE','Après la mort de '+old.name+', tu poursuis la vie de la famille en tant que '+child.name+'. Patrimoine reçu : '+share.toLocaleString('fr-FR')+' B.','major');checkAchievements();save();return game
}
function continueWithHeir(){var kids=(game.player.children||[]).filter(function(c){return c.status==='active'}).sort(function(a,b){return b.ageMonths-a.ageMonths});if(!kids.length)return toast('Aucun héritier disponible.');var c=kids[0];buildHeir(c);$('#deathModal').classList.add('hidden');render()}

function decision(t,txt,ch){game.pending={title:t,text:txt,choices:ch};save();render();showDecision()}
function showDecision(){if(!game.pending)return;if(!pendingIsExecutable(game.pending)){game.pending=null;save();render();toast('La décision incomplète a été réparée. Tu peux continuer.');return}$('#decisionTitle').textContent=game.pending.title;$('#decisionText').textContent=game.pending.text;$('#decisionChoices').innerHTML=game.pending.choices.map(function(c,i){return '<button class="choice-btn" data-c="'+i+'"><strong>'+e(c[0])+'</strong><small>'+e(c[1])+'</small></button>'}).join('');$$('[data-c]').forEach(function(b){b.onclick=function(){var c=game.pending.choices[+b.dataset.c];c[2]();game.pending=null;$('#decisionModal').classList.add('hidden');save();render()}});$('#decisionModal').classList.remove('hidden')}

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
 var p=game.player,o=p.organization;if(!o)return 0;var ms=o.members.filter(function(m){return m.status==='active'}),avg=ms.length?ms.reduce(function(a,m){return a+m.power},0)/ms.length:0,coverage=new Set(ms.map(function(m){return m.role})).size;
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
 var p=game.player,o=ensureOrganization(),m=game.world.markets[p.island],unit=marketPrice(p.island,'provisions',true),qty=5,cost=unit*qty;if(!m||m.goods.provisions.stock<qty)return toast('Le marché local manque de provisions.');if(o.treasury+p.money<cost)return toast('Ravitaillement actuel : '+cost.toLocaleString('fr-FR')+' B.');var t=Math.min(o.treasury,cost);o.treasury-=t;p.money-=cost-t;m.goods.provisions.stock-=qty;m.tradeActivity+=cost;o.supplies=cl(o.supplies+24,0,100);o.morale=cl(o.morale+1,0,100);tl('Ravitaillement','Les provisions de '+o.name+' sont renouvelées pour '+cost.toLocaleString('fr-FR')+' B.');save();render()
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
 var o=ensureOrganization();if(!o||o.authority!=='leader')return;var m=o.members.find(function(x){return x.id===id});if(!m)return;decision('Écarter '+m.name,'Cette décision réduira la cohésion et peut affecter le moral.',[['Confirmer','Faire quitter le groupe à '+m.name+'.',function(){m.status='left';m.loyalty=0;o.cohesion=cl(o.cohesion-5,0,100);o.morale=cl(o.morale-3,0,100);if(m.linkedRelationId){var r=relationById(m.linkedRelationId);if(r){r.joinedOrganization=false;r.type='social';r.loyalty=cl(r.loyalty-18,0,100);r.trust=cl(r.trust-10,0,100);addRelationMemory(r,'Tu l’écartes de '+o.name+'.','organization')}}tl('Départ',m.name+' quitte '+o.name+'.','major')}],['Annuler','Ne rien changer.',function(){}]])
}
function archiveOrganization(reason){
 var p=game.player,o=p.organization;if(!o)return;p.organizationHistory=p.organizationHistory||[];p.organizationHistory.push({name:o.name,faction:o.faction,role:o.playerRole,months:o.months,successes:o.successes,reason:reason||'Départ'});p.organization=null
}
function organizationTick(m){
 var p=game.player;if(p.ageMonths<180||p.career==='Aucune')return;var o=ensureOrganization();if(!o)return;o.commandActions=1;o.months+=m;syncOrganizationRole();
 var active=o.members.filter(function(x){return x.status==='active'}),need=active.length*.42*m+(o.faction==='Pirates'?1.1*m:.3*m);o.supplies-=need;if(o.supplies<0){o.morale=cl(o.morale+o.supplies*.8,0,100);o.cohesion=cl(o.cohesion+o.supplies*.35,0,100);o.supplies=0}
 active.forEach(function(mem){mem.months+=m;if(mem.injuryMonths>0){mem.injuryMonths=Math.max(0,mem.injuryMonths-m);if(mem.linkedRelationId){var ir=relationById(mem.linkedRelationId);if(ir){ir.injuryMonths=mem.injuryMonths;ir.status=mem.injuryMonths>0?'wounded':'active';ir.region=p.region;ir.location=p.island;ir.joinedOrganization=true}}return}mem.power=cl(mem.power+(.08+R('org')*.18)*m,1,100);mem.morale=cl(mem.morale+(o.morale-mem.morale)*.04*m+(R('org')-.5)*1.2*m,0,100);mem.loyalty=cl(mem.loyalty+(o.cohesion-50)*.008*m+(R('org')-.49)*.8*m,0,100);if(mem.linkedRelationId){var rr=relationById(mem.linkedRelationId);if(rr){var sharedPower=Math.max(rr.npcPower||0,mem.power||0);rr.npcPower=sharedPower;mem.power=sharedPower;rr.loyalty=cl((rr.loyalty+mem.loyalty)/2,0,100);mem.loyalty=rr.loyalty;rr.region=p.region;rr.location=p.island;rr.joinedOrganization=true;rr.injuryMonths=Math.max(rr.injuryMonths||0,mem.injuryMonths||0);if(rr.injuryMonths>0)rr.status='wounded';else if(rr.status==='wounded')rr.status='active'}}if(mem.loyalty<18&&o.morale<25&&R('org')<.035*m){mem.status='left';if(mem.linkedRelationId){var lr=relationById(mem.linkedRelationId);if(lr){lr.joinedOrganization=false;lr.type='social';lr.trust=cl(lr.trust-12,0,100);addRelationMemory(lr,'Quitte '+o.name+' après une crise de loyauté.','organization')}}o.morale=cl(o.morale-4,0,100);o.cohesion=cl(o.cohesion-4,0,100);tl('Désertion interne',mem.name+' quitte '+o.name+' après une longue dégradation du moral.','danger')}})
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
function surrenderPlayer(){
 var p=game.player,j=migrateJustice(p);if(j.detained)return;if((p.bounty||0)<=0&&currentHeat()<18)return toast('Les autorités ne te recherchent pas activement.');arrestPlayer('Reddition volontaire');if(j.prison)j.prison.remaining=Math.max(1,Math.round(j.prison.remaining*.72));tl('Reddition','Ta coopération réduit légèrement la durée de détention.');save();render()
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


function defaultInfluence(){return{score:0,fame:0,infamy:0,peak:0,titles:[],primaryTitle:'Inconnu des mers',domains:[],affiliates:[],actions:1,totalDomainIncome:0,recognizedTitle:null,history:[]}}
function migrateInfluence(p){p.influence=p.influence||defaultInfluence();var x=p.influence;x.score=x.score||0;x.fame=x.fame||0;x.infamy=x.infamy||0;x.peak=x.peak||0;x.titles=x.titles||[];x.primaryTitle=x.primaryTitle||'Inconnu des mers';x.domains=x.domains||[];x.affiliates=x.affiliates||[];x.actions=x.actions==null?1:x.actions;x.totalDomainIncome=x.totalDomainIncome||0;x.recognizedTitle=x.recognizedTitle||null;x.history=x.history||[];return x}
function dynastyKey(){return String(game.seed)}
function syncInfluenceOwnership(){
 var p=game.player,x=migrateInfluence(p),key=dynastyKey();x.domains=Object.keys(game.world.territories).filter(function(n){var c=game.world.territories[n].playerControl;return c&&c.ownerKey===key});x.affiliates=game.world.crews.filter(function(c){return c.affiliation&&c.affiliation.ownerKey===key&&c.status==='active'}).map(function(c){return c.id});return x
}
function domainLabel(f){return f==='Pirates'?'Territoire sous protection':f==='Marine'?'Zone de commandement':f==='Révolutionnaires'?'Réseau révolutionnaire':f==='Gouvernement'?'District administré':f==='Chasseur de primes'?'Zone de chasse':'Comptoir commercial'}
function publicImage(){
 var x=migrateInfluence(game.player);if(x.infamy>x.fame+18)return'Redouté';if(x.fame>x.infamy+20)return'Admiré';if(x.score>=70)return'Incontournable';if(x.score>=40)return'Connu';return'Discret'
}
function influenceMetrics(){
 var p=game.player,x=syncInfluenceOwnership(),org=p.organization,ach=Object.keys((game.achievements&&game.achievements.unlocked)||{}).length,crime=(p.justice&&p.justice.crimes||[]).reduce(function(a,c){return a+(c.witnessed?c.severity:0)},0);
 var fame=cl((p.reputation||0)*1.15+(p.wins||0)*1.2+(org?org.renown*.42:0)+(p.justice?p.justice.captures*3:0)+ach*1.7+x.domains.length*5,0,100);
 var infamy=cl(Math.log10(Math.max(1,(p.bounty||0)+1))*9+crime*.75+(p.justice?p.justice.escapes*8:0)+x.domains.filter(function(n){var t=game.world.territories[n];return t&&t.playerControl&&t.playerControl.mode==='conquest'}).length*5,0,100);
 var bestRep=Math.max.apply(null,Object.keys(p.factionRep||{}).map(function(k){return p.factionRep[k]||0}).concat([0])),score=cl(power()*.24+fame*.22+(org?org.renown*.16:0)+bestRep*.12+x.domains.length*7+x.affiliates.length*4,0,100);
 x.fame=fame;x.infamy=infamy;x.score=score;x.peak=Math.max(x.peak||0,score);return x
}
function addTitle(t){
 var x=migrateInfluence(game.player);if(x.titles.indexOf(t)>=0)return false;x.titles.push(t);x.primaryTitle=t;x.history.unshift({age:age(),title:t});x.history=x.history.slice(0,30);tl('Nouveau titre',game.player.name+' est désormais connu comme « '+t+' ».','major');news('Un nouveau nom circule',game.player.name+' gagne le titre « '+t+' ».','major');return true
}
function evaluateTitles(){
 var p=game.player,x=influenceMetrics(),org=p.organization,ageY=p.ageMonths/12,rank=p.rank||'';if(p.ageMonths<180)return x;
 if(x.fame>=22)addTitle('Nom montant');
 if(x.score>=48)addTitle('Figure des mers');
 if(p.faction==='Pirates'&&ageY<=30&&(p.bounty||0)>=100000000&&p.visited.indexOf('Sabaody')>=0)addTitle('Supernova');
 if(p.faction==='Pirates'&&org&&org.authority==='leader'&&p.region==='New World'&&power()>=58)addTitle('Capitaine du Nouveau Monde');
 if(p.faction==='Pirates'&&x.domains.length>=2&&x.score>=68)addTitle('Seigneur pirate');
 if(p.faction==='Marine'&&['Capitaine','Contre-amiral','Vice-amiral'].indexOf(rank)>=0&&x.fame>=50)addTitle('Officier renommé');
 if(p.faction==='Marine'&&rank==='Vice-amiral'&&power()>=82&&(p.factionRep.Marine||0)>=82&&x.score>=78)addTitle('Candidat au haut commandement');
 if(p.faction==='Révolutionnaires'&&(rank==='Cadre révolutionnaire'||rank==='Commandant régional')&&x.score>=66)addTitle('Cadre de la Révolution');
 if(p.faction==='Gouvernement'&&(rank==='CP9'||rank==='Candidat CP0'||p.specialization==='Cipher Pol')&&power()>=58)addTitle('Agent d’élite');
 if(p.faction==='Chasseur de primes'&&p.justice&&p.justice.captures>=5)addTitle('Chasseur renommé');
 if(p.faction==='Chasseur de primes'&&p.justice&&p.justice.captures>=15&&p.justice.bountiesClaimed>=100000000)addTitle('Légende des primes');
 if(p.faction==='Civil'&&netWorth()>=5000000)addTitle('Magnat des mers');
 if(x.score>=88&&power()>=85&&x.domains.length>=3)addTitle('Puissance du Nouveau Monde');
 return x
}
function useInfluenceAction(){var x=migrateInfluence(game.player);if(x.actions<1){toast('Tu as déjà utilisé ton action d’influence pour cette période.');return false}x.actions--;return true}
function claimEligibility(){
 var p=game.player,x=influenceMetrics(),o=p.organization,t=game.world.territories[p.island];if(p.ageMonths<216)return[false,'Il faut être adulte.'];if(p.justice&&p.justice.detained)return[false,'Impossible depuis une prison.'];if(!o||o.authority!=='leader')return[false,'Il faut diriger ton organisation.'];if(!t)return[false,'Territoire indisponible.'];if(t.playerControl&&t.playerControl.ownerKey===dynastyKey())return[false,'Ta dynastie contrôle déjà cette zone.'];if(x.score<48)return[false,'Influence 48 requise.'];if(organizationPower()<38)return[false,'Puissance d’organisation 38 requise.'];return[true,'']}
function establishDomain(){
 var p=game.player,x=influenceMetrics(),q=claimEligibility();if(!q[0])return toast(q[1]);if(!useInfluenceAction())return;var t=game.world.territories[p.island],friendly=t.controller===p.faction||t.controller==='Civil',mode=friendly?'influence':'conquest';
 function success(){t.playerControl={ownerKey:dynastyKey(),ownerName:p.name,faction:p.faction,label:domainLabel(p.faction),control:Math.round(cl(48+x.score*.28+organizationPower()*.18,45,86)),sinceYear:game.world.year,sinceMonth:Math.floor(game.world.month),mode:mode,income:0};if(mode==='conquest'&&['Pirates','Marine','Révolutionnaires','Gouvernement'].indexOf(p.faction)>=0){var old=t.controller;t.controller=p.faction;t.influence=cl(t.influence-8,38,78);t.stability=cl(t.stability-9,10,100);if((p.faction==='Pirates'||p.faction==='Révolutionnaires')&&(old==='Marine'||old==='Gouvernement'))registerCrime('Prise de contrôle de '+p.island,5,true)}x.domains.push(p.island);x.domains=x.domains.filter(function(v,i,a){return a.indexOf(v)===i});x.score=cl(x.score+5,0,100);if(p.organization)p.organization.renown=cl(p.organization.renown+6,0,100);tl('Domaine établi',domainLabel(p.faction)+' établi à '+p.island+'.','major');news('Nouvelle puissance locale',p.name+' établit son influence à '+p.island+'.','major');evaluateTitles();checkAchievements();save();render()}
 if(friendly){success();return}
 var d=cl(inf().danger*.7+t.influence*.36+12,25,95),ok=fight(d,'Prise d’influence à '+p.island);if(!game.alive)return;if(ok)success();else{t.stability=cl(t.stability-3,0,100);tl('Expansion repoussée','Les forces locales empêchent ton implantation.','danger')}save();render()
}
function fortifyDomain(){
 var p=game.player,t=game.world.territories[p.island],x=syncInfluenceOwnership();if(!t||!t.playerControl||t.playerControl.ownerKey!==dynastyKey())return toast('Tu ne contrôles pas cette zone.');if(!useInfluenceAction())return;var cost=15000,org=p.organization;if((org?org.treasury:0)+p.money<cost){x.actions++;return toast('Il faut 15 000 B pour consolider la zone.')}var fromOrg=org?Math.min(org.treasury,cost):0;if(org)org.treasury-=fromOrg;p.money-=cost-fromOrg;t.playerControl.control=cl(t.playerControl.control+10+R('influence')*8,0,100);t.stability=cl(t.stability+5+R('influence')*5,0,100);tl('Consolidation',p.island+' renforce sa fidélité à ton réseau.','major');save();render()
}
function affiliateCandidates(){
 var p=game.player,x=influenceMetrics();if(p.faction!=='Pirates'||!p.organization||p.organization.authority!=='leader'||x.score<62)return[];return game.world.crews.filter(function(c){return c.status==='active'&&c.faction==='Pirates'&&c.region===p.region&&!c.affiliation&&c.power<=power()+18}).sort(function(a,b){return a.power-b.power}).slice(0,5)
}
function recruitAffiliate(id){
 var p=game.player,x=influenceMetrics(),c=game.world.crews.find(function(y){return y.id===id}),o=p.organization;if(!c||c.status!=='active'||c.region!==p.region||c.affiliation)return toast('Cet équipage n’est plus disponible.');if(!o||o.authority!=='leader'||p.faction!=='Pirates')return toast('Réservé aux capitaines pirates.');if(!useInfluenceAction())return;
 var leverage=x.score*.36+(o.renown||0)*.22+power()*.18+(p.bounty?Math.log10(p.bounty+1)*2:0)-c.power*.42,ch=cl(.28+leverage/100,.08,.9);
 if(R('influence')<ch){c.affiliation={ownerKey:dynastyKey(),ownerName:p.name,orgId:o.id,sinceYear:game.world.year};x.affiliates.push(c.id);x.affiliates=x.affiliates.filter(function(v,i,a){return a.indexOf(v)===i});o.renown=cl(o.renown+4,0,100);tl('Alliance pirate',c.name+' reconnaît ton pavillon et rejoint ton réseau.','major');news('Flotte en expansion',c.name+' se place sous l’influence de '+p.name+'.','major');evaluateTitles()}
 else{c.morale=cl(c.morale+2,0,100);tl('Alliance refusée',c.name+' refuse de se placer sous ton influence.')}
 save();render()
}
function domainIncome(t,name,m){
 var p=game.player,rp=game.world.pressures[infStatic(name).region]||{},pc=t.playerControl,market=game.world.markets&&game.world.markets[name];if(!pc)return 0;var trade=market?Math.min(1.45,.75+(market.tradeActivity||0)/50000):1,block=market&&market.blockade?.55:1,base=350+t.stability*12+(rp.Prospérité||40)*9+pc.control*8+infStatic(name).danger*4,amount=Math.round(base*trade*block*m);pc.income=(pc.income||0)+amount;return amount
}
function playerDomainDefense(location){
 var p=game.player,t=game.world.territories[location],pc=t&&t.playerControl;if(!pc||pc.ownerKey!==dynastyKey())return 0;var aff=game.world.crews.filter(function(c){return c.status==='active'&&c.affiliation&&c.affiliation.ownerKey===dynastyKey()&&c.region===infStatic(location).region}).reduce(function(a,c){return a+c.power},0),org=p.organization&&p.region===infStatic(location).region?organizationPower():0;return pc.control*.18+aff*.08+org*.1
}
function loseDomain(name,reason){
 var p=game.player,x=migrateInfluence(p),t=game.world.territories[name];if(!t||!t.playerControl||t.playerControl.ownerKey!==dynastyKey())return;delete t.playerControl;x.domains=x.domains.filter(function(n){return n!==name});tl('Domaine perdu',name+' échappe à ton influence'+(reason?' : '+reason:'')+'.','danger');news('Recul territorial',p.name+' perd son emprise sur '+name+'.','war')
}
function realignInfluenceAfterFactionChange(oldF,newF){
 var p=game.player,x=syncInfluenceOwnership();x.domains.slice().forEach(function(name){var t=game.world.territories[name],pc=t&&t.playerControl;if(!pc||pc.ownerKey!==dynastyKey())return;var hostile=diplomacy(oldF,newF)<-20;if(hostile)pc.control=cl(pc.control-35,0,100);if(pc.control<45){loseDomain(name,'changement de faction');return}pc.faction=newF;pc.label=domainLabel(newF);if(['Pirates','Marine','Révolutionnaires','Gouvernement'].indexOf(newF)>=0)t.controller=newF});
 if(newF!=='Pirates'){game.world.crews.forEach(function(c){if(c.affiliation&&c.affiliation.ownerKey===dynastyKey())delete c.affiliation});x.affiliates=[]}
 evaluateTitles()
}
function influenceTick(m){
 var p=game.player,x=syncInfluenceOwnership();x.actions=1;var total=0;
 x.domains.slice().forEach(function(name){var t=game.world.territories[name];if(!t||!t.playerControl||t.playerControl.ownerKey!==dynastyKey())return;total+=domainIncome(t,name,m);t.playerControl.control=cl(t.playerControl.control+(t.stability-45)*.008*m+(R('influence')-.5)*1.1*m,0,100);if(t.playerControl.control<12)loseDomain(name,'autorité locale effondrée');else if(R('influence')<.012*m*(1+game.world.globalTension/90)){var hostile=pk(hostileCandidates(t.controller),'influence');spawnConflict(name,hostile,t.controller,35+R('influence')*35,'domain')}}
 );
 if(total){x.totalDomainIncome+=total;if(p.organization)p.organization.treasury+=total;else p.money+=total}
 x.affiliates=x.affiliates.filter(function(id){var c=game.world.crews.find(function(y){return y.id===id});if(!c||c.status!=='active'||!c.affiliation||c.affiliation.ownerKey!==dynastyKey())return false;if(c.morale<18&&R('influence')<.025*m){delete c.affiliation;tl('Alliance rompue',c.name+' cesse de reconnaître ton réseau.','danger');return false}return true});
 evaluateTitles();
 if(p.faction==='Pirates'&&!x.recognizedTitle&&game.world.year>=20&&game.world.divergence>=18&&x.domains.length>=4&&x.affiliates.length>=3&&(p.bounty||0)>=1000000000&&power()>=90&&x.score>=90&&R('influence')<.035*m){x.recognizedTitle='Empereur des mers';addTitle('Empereur des mers');game.world.divergence=cl(game.world.divergence+3,0,100);news('Nouvel Empereur',p.name+' est désormais reconnu comme l’une des puissances dominantes du Nouveau Monde.','war')}
}
function renderInfluence(){
 var p=game.player,x=influenceMetrics(),img=publicImage(),badge=$('#influenceBadge');badge.textContent=Math.round(x.score)+'/100';badge.className='badge '+(x.score>=75?'influence-critical':x.score>=45?'influence-major':'');
 $('#publicStanding').innerHTML='<div><span>Influence</span><strong>'+Math.round(x.score)+'</strong></div><div><span>Image publique</span><strong>'+e(img)+'</strong></div><div><span>Renommée</span><strong>'+Math.round(x.fame)+'</strong></div><div><span>Infamie</span><strong>'+Math.round(x.infamy)+'</strong></div>';
 $('#titleList').innerHTML=(x.titles.length?x.titles.slice().reverse().map(function(t,i){return '<span class="title-chip '+(i===0?'primary':'')+'">'+e(t)+'</span>'}).join(''):'<span class="title-chip">Aucun titre majeur</span>')+(x.recognizedTitle?'<div class="world-title-banner"><strong>'+e(x.recognizedTitle)+'</strong><span>Reconnaissance mondiale</span></div>':'');
 var q=claimEligibility(),t=game.world.territories[p.island],owned=t&&t.playerControl&&t.playerControl.ownerKey===dynastyKey(),actions='';
 if(owned)actions+='<button id="fortifyDomainBtn" class="action-card"><strong>Consolider '+e(p.island)+'</strong><small>15 000 B • augmente contrôle et stabilité.</small></button>';else if(q[0])actions+='<button id="claimDomainBtn" class="action-card"><strong>Établir ton influence ici</strong><small>'+e(domainLabel(p.faction))+' à '+e(p.island)+'.</small></button>';
 var candidates=affiliateCandidates();if(candidates.length)actions+='<button id="affiliateCrewBtn" class="action-card"><strong>Rallier un équipage</strong><small>'+candidates.length+' force(s) pirate(s) compatible(s) dans la région.</small></button>';
 if(!actions)actions='<div class="career-card"><p>Développe ton rang, ton organisation et ton influence pour exercer un pouvoir direct sur le monde.</p></div>';
 $('#influenceActions').innerHTML=actions;var c=$('#claimDomainBtn');if(c)c.onclick=establishDomain;var f=$('#fortifyDomainBtn');if(f)f.onclick=fortifyDomain;var a=$('#affiliateCrewBtn');if(a)a.onclick=function(){var cs=affiliateCandidates(),choices=cs.map(function(cr){return[cr.name,'Puissance '+Math.round(cr.power)+' • '+Math.round(cr.bounty/1000000)+' M B de prime',function(){recruitAffiliate(cr.id)}]});choices.push(['Annuler','Ne rien proposer.',function(){}]);decision('Étendre ton réseau','Convaincre un équipage autonome de reconnaître ton pavillon.',choices)}
}
function renderDomains(){
 var p=game.player,x=syncInfluenceOwnership(),domains=x.domains.map(function(n){return{name:n,t:game.world.territories[n]}}),aff=x.affiliates.map(function(id){return game.world.crews.find(function(c){return c.id===id})}).filter(Boolean);
 $('#domainBadge').textContent=domains.length+' zone'+(domains.length>1?'s':'');$('#domainSummary').innerHTML='<div><span>Zones sous influence</span><strong>'+domains.length+'</strong></div><div><span>Revenu cumulé</span><strong>'+Math.round(x.totalDomainIncome).toLocaleString('fr-FR')+' B</strong></div><div><span>Forces affiliées</span><strong>'+aff.length+'</strong></div><div><span>Pic d’influence</span><strong>'+Math.round(x.peak)+'</strong></div>';
 $('#domainList').innerHTML=domains.length?domains.map(function(d){var pc=d.t.playerControl,threat=game.world.conflicts.some(function(c){return c.location===d.name&&c.status==='active'});return '<div class="domain-row '+(threat?'domain-threat':'domain-owned')+'"><strong>'+e(d.name)+'</strong><span>'+e(pc.label)+' • contrôle '+Math.round(pc.control)+'%</span><small>'+e(infStatic(d.name).region)+' • stabilité '+Math.round(d.t.stability)+'% • revenus cumulés '+Math.round(pc.income||0).toLocaleString('fr-FR')+' B'+(threat?' • CONFLIT EN COURS':'')+'</small><div class="domain-control-meter"><div style="width:'+cl(pc.control,0,100)+'%"></div></div></div>'}).join(''):'<p class="helper-text">Aucun domaine personnel établi.</p>';
 $('#affiliateBadge').textContent=aff.length+' allié'+(aff.length>1?'s':'');$('#affiliateList').innerHTML=aff.length?aff.map(function(c){return '<div class="affiliate-row"><strong>'+e(c.name)+'</strong><span>'+e(c.region)+' • puissance '+Math.round(c.power)+'</span><small>'+c.members+' membres • prime '+Math.round(c.bounty).toLocaleString('fr-FR')+' B • moral '+Math.round(c.morale)+'%</small></div>'}).join(''):'<p class="helper-text">Aucune force autonome n’a encore reconnu ton réseau.</p>'
}


var TRADE_GOODS=[
 {id:'provisions',name:'Provisions',base:900,weight:1,restricted:false},
 {id:'medicine',name:'Médicaments',base:1900,weight:1,restricted:false},
 {id:'materials',name:'Matériaux',base:1450,weight:2,restricted:false},
 {id:'luxury',name:'Produits de luxe',base:3600,weight:1,restricted:false},
 {id:'weapons',name:'Armes',base:4800,weight:2,restricted:true},
 {id:'dials',name:'Dials',base:5700,weight:1,restricted:false},
 {id:'seastone',name:'Kairouseki',base:9200,weight:1,restricted:true}
];
var TRADE_BIAS={
 'East Blue':{provisions:.86,medicine:1.02,materials:.94,luxury:1.08,weapons:1.15,dials:1.55,seastone:1.70},
 'North Blue':{provisions:1.02,medicine:.92,materials:.90,luxury:1.04,weapons:.82,dials:1.45,seastone:1.58},
 'West Blue':{provisions:.95,medicine:.96,materials:.88,luxury:.83,weapons:1.05,dials:1.42,seastone:1.55},
 'South Blue':{provisions:.88,medicine:1.00,materials:.96,luxury:.96,weapons:1.10,dials:1.48,seastone:1.62},
 'Grand Line':{provisions:1.08,medicine:1.08,materials:1.04,luxury:1.12,weapons:1.00,dials:.72,seastone:1.22},
 'New World':{provisions:1.22,medicine:1.20,materials:1.10,luxury:1.18,weapons:.96,dials:1.12,seastone:.74}
};
function goodById(id){return TRADE_GOODS.find(function(g){return g.id===id})||null}
function defaultTrade(){return{cargo:[],profit:0,volume:0,trades:0,smugglingRuns:0,seizures:0,marketActions:0,bestProfit:0,lastPort:null}}
function migrateTrade(p){p.trade=p.trade||defaultTrade();var t=p.trade;t.cargo=t.cargo||[];t.cargo=t.cargo.filter(function(c){return goodById(c.good)&&c.qty>0}).map(function(c){c.qty=Math.max(0,c.qty||0);c.avgCost=Math.max(0,c.avgCost||0);return c});t.profit=t.profit||0;t.volume=t.volume||0;t.trades=t.trades||0;t.smugglingRuns=t.smugglingRuns||0;t.seizures=t.seizures||0;t.marketActions=t.marketActions||0;t.bestProfit=t.bestProfit||0;t.lastPort=t.lastPort||null;return t}
function initialMarket(g,name){
 var region=infStatic(name).region,bias=TRADE_BIAS[region]||{},goods={};
 TRADE_GOODS.forEach(function(x,i){var b=bias[x.id]||1,rare=x.id==='seastone'||x.id==='dials',stock=(rare?9:34)+(1/b)*22+det(g,'market:stock:'+name+':'+x.id)*32,demand=32+b*18+det(g,'market:demand:'+name+':'+x.id)*28;if(name==='Skypiea'&&x.id==='dials')stock+=55;if(name==='Wano'&&x.id==='seastone')stock+=50;goods[x.id]={stock:Math.round(cl(stock,2,120)),demand:Math.round(cl(demand,12,100)),activity:0,lastPrice:x.base}});
 return{goods:goods,tradeActivity:0,blockade:false,shock:null,lastShockMonth:null,shockState:null}
}
function initWorldEconomy(g,w){
 w.markets=w.markets||{};Object.keys(PL).forEach(function(n){if(!w.markets[n])w.markets[n]=initialMarket(g,n);else{w.markets[n].goods=w.markets[n].goods||{};TRADE_GOODS.forEach(function(x){if(!w.markets[n].goods[x.id])w.markets[n].goods[x.id]=initialMarket(g,n).goods[x.id]})}});
 w.economy=w.economy||{priceIndex:100,tradeVolume:0,monthlyVolume:0,shortages:0,shocks:[],month:0};w.economy.shocks=w.economy.shocks||[];return w
}
function marketBlockade(name){
 var w=game.world;if(w.conflicts.some(function(c){return c.status==='active'&&c.location===name&&c.intensity>=45}))return true;
 return(w.wars||[]).some(function(war){return war.status==='active'&&war.target===name&&war.months>=1})
}
function regionalBias(region,id){var b=TRADE_BIAS[region]||{},raw=b[id]||1;return cl(1+(raw-1)*.65,.78,1.5)}
function marketPrice(name,id,buy,stockOverride){
 var g=goodById(id),m=game.world.markets[name],x=m&&m.goods[id];if(!g||!x)return 0;var region=infStatic(name).region,rp=game.world.pressures[region]||{},terr=game.world.territories[name]||{stability:55},bias=regionalBias(region,id),stock=stockOverride==null?x.stock:stockOverride,scarcity=cl(1+(x.demand-stock)/115,.55,2.15),instability=1+cl((50-(terr.stability||50))/220,-.12,.32),blocked=marketBlockade(name),war=blocked?1.32:1,pressure=1;m.blockade=blocked;
 if(id==='provisions'||id==='medicine')pressure*=1+cl((rp.Instabilité||20)/380,0,.28);
 if(id==='luxury')pressure*=.83+(rp.Prospérité||50)/290;
 if(g.restricted)pressure*=.92+(rp.Criminalité||20)/220;
 var price=g.base*bias*scarcity*instability*war*pressure,spread=buy?1.06:.94;return Math.max(50,Math.round(price*spread/10)*10)
}
function commodityQuote(name,id,qty,buy){
 var m=game.world.markets[name],x=m&&m.goods[id],g=goodById(id);qty=Math.max(0,Math.floor(qty||0));if(!x||!g||qty<1)return{total:0,avg:0,qty:0};var virtual=x.stock,total=0,n=0;
 for(var i=0;i<qty;i++){if(buy&&virtual<1)break;var price=marketPrice(name,id,buy,virtual);total+=price;n++;virtual=cl(virtual+(buy?-1:1),0,150)}
 return{total:Math.round(total),avg:n?total/n:0,qty:n}
}
function marketPriceIndex(name){
 var vals=TRADE_GOODS.filter(function(g){return ['provisions','medicine','materials','luxury'].indexOf(g.id)>=0}).map(function(g){return marketPrice(name,g.id,true)/g.base});return Math.round((vals.reduce(function(a,b){return a+b},0)/Math.max(1,vals.length))*100)
}
function cargoItem(id){return migrateTrade(game.player).cargo.find(function(c){return c.good===id})||null}
function cargoUsed(){
 return migrateTrade(game.player).cargo.reduce(function(a,c){var g=goodById(c.good);return a+(g?g.weight*c.qty:0)},0)
}
function cargoCapacity(){
 var p=game.player,o=p.organization;if(o&&o.ship){var tier=o.ship.tier||0;return[10,20,36,60][tier]||10}return 5+Math.floor((p.skills.Navigation||0)/25)
}
function cargoBookValue(){return Math.round(migrateTrade(game.player).cargo.reduce(function(a,c){return a+c.qty*c.avgCost},0))}
function blackMarketAccess(){
 var p=game.player,rp=game.world.pressures[p.region]||{};return p.faction==='Pirates'||p.faction==='Révolutionnaires'||(p.skills.Discrétion||0)>=28||(rp.Criminalité||0)>=38
}
function blackMarketRisk(){
 var p=game.player,rp=game.world.pressures[p.region]||{},t=game.world.territories[p.island],official=t&&(t.controller==='Marine'||t.controller==='Gouvernement'),heat=currentHeat?currentHeat():0;return cl(.08+(rp.Marine||25)/230+(official?.10:0)+heat/400-(p.skills.Discrétion||0)/300,.04,.58)
}
function transactBlackMarketRisk(good,qty){
 if(!good.restricted)return;if(R('trade')<blackMarketRisk()){registerCrime('Transaction clandestine : '+good.name,good.id==='seastone'?3:2,true);if(game.player.faction==='Marine'||game.player.faction==='Gouvernement')adjustRep(game.player.faction,-8)}else gain('Discrétion',.12+qty*.03)
}
function buyCommodity(id,qty,black){
 var p=game.player;if(p.ageMonths<144)return toast('Tu es encore trop jeune pour gérer du commerce maritime.');var t=migrateTrade(p),g=goodById(id),m=game.world.markets[p.island],x=m&&m.goods[id];qty=Math.max(1,Math.floor(qty||1));if(!g||!x)return;if(g.restricted&&!black)return toast('Cette marchandise n’est pas vendue légalement ici.');if(black&&!blackMarketAccess())return toast('Tu n’as pas accès au marché noir local.');var maxByStock=Math.floor(x.stock),maxByCapacity=Math.floor((cargoCapacity()-cargoUsed())/g.weight),price=marketPrice(p.island,id,true),maxByMoney=Math.floor(Math.max(0,p.money)/price),n=Math.min(qty,maxByStock,maxByCapacity,maxByMoney);if(n<1)return toast('Stock, argent ou capacité de cargaison insuffisant.');
 var quote=commodityQuote(p.island,id,n,true);while(n>0&&quote.total>p.money){n--;quote=commodityQuote(p.island,id,n,true)}if(n<1)return toast('Fonds insuffisants après variation du marché.');var cost=quote.total,item=cargoItem(id);p.money-=cost;x.stock-=n;x.activity+=n;m.tradeActivity+=cost;t.volume+=cost;t.trades++;game.world.economy.tradeVolume+=cost;game.world.economy.monthlyVolume+=cost;if(item){item.avgCost=(item.avgCost*item.qty+cost)/(item.qty+n);item.qty+=n}else t.cargo.push({good:id,qty:n,avgCost:quote.avg});if(black)transactBlackMarketRisk(g,n);tl('Achat commercial',n+' × '+g.name+' pour '+cost.toLocaleString('fr-FR')+' B.');save();render()
}
function sellCommodity(id,qty,black){
 var p=game.player;if(p.ageMonths<144)return toast('Tu es encore trop jeune pour gérer du commerce maritime.');var t=migrateTrade(p),g=goodById(id),m=game.world.markets[p.island],x=m&&m.goods[id],item=cargoItem(id);qty=Math.max(1,Math.floor(qty||1));if(!g||!x||!item||item.qty<1)return;if(g.restricted&&!black)return toast('Cette marchandise exige un acheteur clandestin.');if(black&&!blackMarketAccess())return toast('Aucun intermédiaire clandestin disponible.');var n=Math.min(qty,item.qty),quote=commodityQuote(p.island,id,n,false),price=quote.avg,revenue=quote.total,profit=Math.round(revenue-item.avgCost*n);p.money+=revenue;x.stock=cl(x.stock+n,0,150);x.activity+=n;m.tradeActivity+=revenue;t.volume+=revenue;t.trades++;game.world.economy.tradeVolume+=revenue;game.world.economy.monthlyVolume+=revenue;t.profit+=profit;t.bestProfit=Math.max(t.bestProfit,profit);item.qty-=n;if(item.qty<=0)t.cargo=t.cargo.filter(function(c){return c!==item});if(black)transactBlackMarketRisk(g,n);if(p.faction==='Civil'&&profit>0){adjustRep('Civil',Math.min(2,profit/30000));careerRecord().xp+=Math.min(3,profit/18000)}tl('Vente commerciale',n+' × '+g.name+' pour '+revenue.toLocaleString('fr-FR')+' B ('+(profit>=0?'+':'')+profit.toLocaleString('fr-FR')+' B).',profit>=10000?'major':'');checkAchievements();save();render()
}
function tradeRouteOpportunities(){
 var p=game.player,routes=inf().routes||[],out=[];routes.forEach(function(dest){TRADE_GOODS.filter(function(g){return !g.restricted}).forEach(function(g){var buy=marketPrice(p.island,g.id,true),sell=marketPrice(dest,g.id,false),margin=buy?((sell-buy)/buy)*100:0;if(margin>4)out.push({dest:dest,good:g,margin:margin,buy:buy,sell:sell})})});return out.sort(function(a,b){return b.margin-a.margin}).slice(0,6)
}
function inspectSmugglingAtArrival(destination){
 var p=game.player,t=migrateTrade(p),restricted=t.cargo.filter(function(c){var g=goodById(c.good);return g&&g.restricted&&c.qty>0});if(!restricted.length)return;var rp=game.world.pressures[infStatic(destination).region]||{},terr=game.world.territories[destination],official=terr&&(terr.controller==='Marine'||terr.controller==='Gouvernement'),chance=cl(.09+(rp.Marine||25)/210+(official?.13:0)+currentHeat()/450-(p.skills.Discrétion||0)/280,.04,.72);
 if(R('trade')<chance){var seized=0,value=0;restricted.forEach(function(c){var g=goodById(c.good);seized+=c.qty;value+=Math.round(c.qty*c.avgCost);c.qty=0});t.cargo=t.cargo.filter(function(c){return c.qty>0});t.seizures++;var fine=Math.min(Math.max(0,p.money),Math.round(value*.22));p.money-=fine;registerCrime('Contrebande maritime',cl(2+Math.floor(seized/4),2,5),true);tl('Contrôle douanier','Les autorités saisissent '+seized+' unité(s) de cargaison interdite et imposent '+fine.toLocaleString('fr-FR')+' B d’amende.','danger')}
 else{t.smugglingRuns++;gain('Discrétion',.35+restricted.length*.08);tl('Passage discret','Ta cargaison clandestine franchit le contrôle de '+destination+'.','major');checkAchievements()}
}
function marketMonthlyTarget(name,id){
 var g=goodById(id),region=infStatic(name).region,rp=game.world.pressures[region]||{},terr=game.world.territories[name]||{stability:50},bias=regionalBias(region,id),target=55/bias;
 if(id==='provisions')target+=((rp.Prospérité||50)-40)*.18;if(id==='medicine')target-=((rp.Instabilité||20))*0.12;if(g.restricted)target+=((rp.Criminalité||20)-25)*.25;if(name==='Skypiea'&&id==='dials')target+=55;if(name==='Wano'&&id==='seastone')target+=50;
 if(marketBlockade(name))target*=.58;target*=.7+(terr.stability||50)/165;return cl(target,4,125)
}
function simulateTradeRoutes(){
 var w=game.world,seen={};Object.keys(PL).forEach(function(a){(PL[a][2]||[]).forEach(function(b){if(!w.markets[b])return;var key=[a,b].sort().join('|');if(seen[key])return;seen[key]=1;if(marketBlockade(a)||marketBlockade(b))return;var good=pk(TRADE_GOODS.filter(function(g){return !g.restricted}),'economy'),pa=marketPrice(a,good.id,false),pb=marketPrice(b,good.id,false),from=pa<pb?a:b,to=from===a?b:a,mf=w.markets[from].goods[good.id],mt=w.markets[to].goods[good.id],gap=Math.abs(pa-pb)/Math.max(1,Math.min(pa,pb));if(gap>.12&&mf.stock>10){var qty=Math.min(mf.stock-8,1+Math.floor(R('economy')*4));mf.stock-=qty;mt.stock=cl(mt.stock+qty,0,150);w.economy.monthlyVolume+=Math.round(qty*Math.min(pa,pb))}})})
}
function simulateEconomy(){
 var w=game.world,econ=w.economy;econ.month++;econ.monthlyVolume=0;var indices=[],shortages=0;
 Object.keys(w.markets).forEach(function(name){var m=w.markets[name],terr=w.territories[name]||{stability:50},rp=w.pressures[infStatic(name).region]||{};m.blockade=marketBlockade(name);m.tradeActivity*=.82;m.shockState=m.shockState||null;
  if(m.shockState){m.shockState.months--;if(m.shockState.months<=0){m.shockState=null;m.shock=null}}
  TRADE_GOODS.forEach(function(g){var x=m.goods[g.id],target=marketMonthlyTarget(name,g.id),warDemand=m.blockade&&(g.id==='provisions'||g.id==='medicine'||g.id==='materials')?8:0,shock=m.shockState&&m.shockState.good===g.id?m.shockState:null,shockStock=shock?(shock.type==='shortage'?-4:4):0,shockDemand=shock?(shock.type==='shortage'?3:-3):0;x.demand=cl(x.demand+(target-x.demand)*.07+(R('economy')-.5)*2.5+warDemand+shockDemand,8,120);x.stock=cl(x.stock+(target-x.stock)*.08+(rp.Prospérité||40)/90+(R('economy')-.5)*3-(m.blockade?2.5:0)+shockStock,0,150);x.activity*=.78;x.lastPrice=marketPrice(name,g.id,true);if((shock&&shock.type==='shortage')||(x.stock<8&&x.demand>50))shortages++});
  if(!m.shockState&&R('economy')<.0035){var shockGood=pk(TRADE_GOODS,'economy'),sx=m.goods[shockGood.id],short=R('economy')<.58,duration=4+Math.floor(R('economy')*5);if(short){sx.stock=cl(sx.stock-(18+R('economy')*25),0,150);sx.demand=cl(sx.demand+14+R('economy')*18,0,120)}else sx.stock=cl(sx.stock+20+R('economy')*32,0,150);m.shockState={good:shockGood.id,type:short?'shortage':'surplus',months:duration};m.shock=(short?'Pénurie : ':'Arrivage : ')+shockGood.name;m.lastShockMonth=econ.month;econ.shocks.unshift({place:name,good:shockGood.id,type:short?'shortage':'surplus',duration:duration,year:w.year,month:w.month});econ.shocks=econ.shocks.slice(0,30);news(short?'Pénurie locale':'Arrivage commercial',name+' connaît '+(short?'une pénurie durable de ':'un afflux durable de ')+shockGood.name+' ('+duration+' mois estimés).',short?'major':'')};
  indices.push(marketPriceIndex(name))
 });
 simulateTradeRoutes();econ.tradeVolume+=econ.monthlyVolume;econ.shortages=shortages;econ.priceIndex=Math.round(indices.reduce(function(a,b){return a+b},0)/Math.max(1,indices.length))
}
function localMarketStatus(){
 var p=game.player,m=game.world.markets[p.island],idx=marketPriceIndex(p.island);if(m.blockade)return'Blocus';if((m.shockState&&m.shockState.type==='shortage')||TRADE_GOODS.some(function(g){var x=m.goods[g.id];return x.stock<8&&x.demand>50}))return'Pénurie';if(idx<88)return'Marché favorable';if(idx>128)return'Prix élevés';return'Stable'
}
function renderCargo(){
 var p=game.player,t=migrateTrade(p),used=cargoUsed(),cap=cargoCapacity(),value=cargoBookValue();$('#cargoBadge').textContent=used+'/'+cap+' capacité';$('#cargoSummary').innerHTML='<div><span>Valeur comptable</span><strong>'+value.toLocaleString('fr-FR')+' B</strong></div><div><span>Profit commercial</span><strong class="'+(t.profit>=0?'trade-profit':'trade-loss')+'">'+(t.profit>=0?'+':'')+Math.round(t.profit).toLocaleString('fr-FR')+' B</strong></div><div><span>Transactions</span><strong>'+t.trades+'</strong></div><div><span>Passages clandestins</span><strong>'+t.smugglingRuns+'</strong></div><div style="grid-column:1/-1"><span>Capacité utilisée</span><div class="cargo-capacity"><div style="width:'+cl(used/Math.max(1,cap)*100,0,100)+'%"></div></div></div>';
 $('#cargoList').innerHTML=t.cargo.length?t.cargo.map(function(c){var g=goodById(c.good),here=marketPrice(p.island,c.good,false),delta=here-c.avgCost;return '<div class="cargo-row"><div class="cargo-head"><strong>'+e(g.name)+'</strong><span>'+c.qty+' unité'+(c.qty>1?'s':'')+'</span></div><div class="cargo-meta">Coût moyen '+Math.round(c.avgCost).toLocaleString('fr-FR')+' B • vente locale '+here.toLocaleString('fr-FR')+' B • <span class="'+(delta>=0?'trade-profit':'trade-loss')+'">'+(delta>=0?'+':'')+Math.round(delta).toLocaleString('fr-FR')+' B/u</span></div></div>'}).join(''):'<p class="helper-text">Aucune marchandise transportée.</p>'
}
function renderMarket(){
 var p=game.player,m=game.world.markets[p.island],status=localMarketStatus(),idx=marketPriceIndex(p.island),rp=game.world.pressures[p.region]||{},used=cargoUsed(),cap=cargoCapacity();$('#marketPlaceName').textContent=p.island;var badge=$('#marketStatusBadge');badge.textContent=status;badge.className='badge '+(status==='Blocus'||status==='Pénurie'?'market-crisis':status==='Marché favorable'?'market-boom':'');
 $('#marketSummary').innerHTML='<div><span>Indice local</span><strong>'+idx+'</strong></div><div><span>Indice mondial</span><strong>'+Math.round(game.world.economy.priceIndex)+'</strong></div><div><span>Prospérité régionale</span><strong>'+Math.round(rp.Prospérité||0)+'%</strong></div><div><span>Pénuries mondiales</span><strong>'+game.world.economy.shortages+'</strong></div><div><span>Activité commerciale</span><strong>'+Math.round(m.tradeActivity).toLocaleString('fr-FR')+' B</strong></div><div><span>Cargaison</span><strong>'+used+'/'+cap+'</strong></div>';
 function cards(restricted){return TRADE_GOODS.filter(function(g){return !!g.restricted===restricted}).map(function(g){var x=m.goods[g.id],buy=marketPrice(p.island,g.id,true),sell=marketPrice(p.island,g.id,false),owned=(cargoItem(g.id)||{qty:0}).qty,scarce=x.stock<10;return '<div class="market-good '+(g.restricted?'restricted ':'')+(scarce?'scarce':'')+'"><div class="market-good-head"><strong>'+e(g.name)+'</strong><span>'+Math.floor(x.stock)+' en stock</span></div><div class="market-good-meta">Acheter '+buy.toLocaleString('fr-FR')+' B • vendre '+sell.toLocaleString('fr-FR')+' B • demande '+Math.round(x.demand)+'/100'+(owned?' • tu en as '+owned:'')+'</div><div class="market-good-actions"><button data-buy-good="'+g.id+'" data-buy-qty="1">Acheter 1</button><button data-buy-good="'+g.id+'" data-buy-qty="5">Acheter 5</button>'+(owned?'<button data-sell-good="'+g.id+'" data-sell-qty="1">Vendre 1</button><button data-sell-good="'+g.id+'" data-sell-qty="5">Vendre 5</button>':'')+'</div></div>'}).join('')}
 $('#marketGoods').innerHTML=cards(false);var access=blackMarketAccess();$('#blackMarketSection').classList.toggle('hidden',!access);if(access){$('#blackMarketBadge').textContent='Risque '+Math.round(blackMarketRisk()*100)+'%';$('#blackMarketGoods').innerHTML=cards(true)}
 var routes=tradeRouteOpportunities();$('#tradeRouteBadge').textContent=routes.length+' piste'+(routes.length>1?'s':'');$('#tradeRoutes').innerHTML=routes.length?routes.map(function(r){return '<div class="trade-route"><div class="trade-route-head"><strong>'+e(r.dest)+'</strong><span>'+Math.round(r.margin)+'% estimé</span></div><div class="trade-route-meta">'+e(r.good.name)+' • achat ici '+r.buy.toLocaleString('fr-FR')+' B • vente actuelle là-bas '+r.sell.toLocaleString('fr-FR')+' B</div></div>'}).join(''):'<p class="helper-text">Aucun écart commercial intéressant sur les routes immédiates.</p>';
 $$('[data-buy-good]').forEach(function(b){b.onclick=function(){buyCommodity(b.dataset.buyGood,+b.dataset.buyQty,goodById(b.dataset.buyGood).restricted)}});$$('[data-sell-good]').forEach(function(b){b.onclick=function(){sellCommodity(b.dataset.sellGood,+b.dataset.sellQty,goodById(b.dataset.sellGood).restricted)}})
}

function careerTrack(f,spec){return f==='Gouvernement'&&spec==='Cipher Pol'?CP_RANKS:(CAREERS[f]?CAREERS[f].ranks:CAREERS.Civil.ranks)}
function firstRank(f){var c=CAREERS[f]||CAREERS.Civil;return c.ranks[0].n}
function careerRecord(f){f=f||game.player.faction;var p=game.player;if(!p.careerRecords[f])p.careerRecords[f]={xp:0,months:0,rank:firstRank(f),specialization:null,successes:0,failures:0};return p.careerRecords[f]}
function ownRep(){return game.player.factionRep[game.player.faction]||0}
function standingLabel(v){return v<=-40?'Hostile':v<-10?'Méfiant':v<20?'Neutre':v<45?'Reconnu':v<70?'Estimé':'Allié majeur'}
function adjustRep(f,n){var p=game.player;if(p.factionRep[f]==null)p.factionRep[f]=0;p.factionRep[f]=cl(p.factionRep[f]+n,-100,100)}
function rankIndex(){var p=game.player,t=careerTrack(p.faction,p.specialization),i=t.findIndex(function(r){return r.n===p.rank});return i<0?0:i}
function nextRank(){var t=careerTrack(game.player.faction,game.player.specialization),i=rankIndex();return i<t.length-1?t[i+1]:null}
function activityForFaction(f){return'Carrière'}
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
function specializationDecision(){
 var p=game.player,cfg=CAREERS[p.faction]||CAREERS.Civil,ch=[];
 cfg.specs.forEach(function(sp){var q=specEligibility(sp);if(sp===p.specialization)return;if(q[0])ch.push([sp,p.specialization?'Se réorienter vers '+sp+'.':'Choisir '+sp+'.',function(){chooseSpecialization(sp)}])});
 if(!ch.length)return toast('Aucune autre spécialisation accessible.');ch.push(['Annuler','Ne rien changer.',function(){}]);decision(p.specialization?'Changer de spécialisation':'Choisir une spécialisation','Le jeu adaptera ensuite automatiquement le focus Carrière à ce rôle.',ch)
}
function ambitionDecision(){
 var p=game.player,ch=['Survivre','Devenir puissant','Explorer le monde','Faire fortune','Entrer dans l’histoire'].filter(function(a){return a!==p.ambition}).map(function(a){return[a,'Adopter cette priorité.',function(){p.ambition=a;if(p.activity!=='Explorer'&&!p.travel)p.activity=recommendedFocus();save();renderChar();renderAb()}]});ch.push(['Annuler','Ne rien changer.',function(){}]);decision('Changer d’ambition','L’ambition guide les recommandations sans t’enfermer.',ch)
}
function salaryPerMonth(){var p=game.player,c=CAREERS[p.faction]||CAREERS.Civil,i=rankIndex();if(!c.salary)return 0;return Math.round(c.salary*(1+i*.34))}
function specSkill(sp){var m={Combat:'Combat',Combattant:'Combat',Duelliste:'Combat',Navigation:'Navigation',Navigateur:'Navigation',Tireur:'Tir',Médecine:'Médecine',Médecin:'Médecine',Renseignement:'Discrétion',Infiltration:'Discrétion',Investigateur:'Discrétion',Scientifique:'Science',Administration:'Discipline',Logistique:'Commandement','Quartier-maître':'Commandement',Marchand:'Commandement',Artisan:'Science',Cuisinier:'Discipline',Traqueur:'Réflexes','Cipher Pol':'Discrétion'};return m[sp]||null}
function careerActivityFit(){var p=game.player,keys=activityGrowthKeys(p.activity),profile=specProfile(p.specialization);if(p.activity==='Carrière')return 1.35;if(p.activity==='Équilibre')return .82;if(!profile)return p.activity==='Combat'?1.0:.68;var hits=profile.keys.filter(function(k){return keys.indexOf(k)>=0}).length;if(hits>=2)return 1.18;if(hits===1)return .95;return .62}
function evaluatePromotion(){var p=game.player,rec=careerRecord(),n=nextRank();if(!n)return false;var rep=p.factionRep[p.faction]||0,qual=careerQualification();if(rec.xp<n.xp||rep<n.rep||qual<n.pow)return false;p.rank=n.n;rec.rank=n.n;adjustRep(p.faction,3);tl('PROMOTION','Tu accèdes au rang de '+n.n+' au sein de '+(CAREERS[p.faction]?CAREERS[p.faction].label:p.faction)+' grâce à une qualification de '+Math.round(qual)+'.','major');syncOrganizationRole();return true}
function careerTick(m){var p=game.player;if(p.ageMonths<180||p.career==='Aucune')return;var rec=careerRecord(),fit=careerActivityFit();rec.months+=m;rec.xp+=m*fit*(1+(p.stats.Discipline||0)/260);var sk=specSkill(p.specialization);if(sk)gain(sk,m*(.10+.05*fit));var sal=salaryPerMonth()*m;if(sal>0){p.money+=sal;p.salaryTotal+=sal}adjustRep(p.faction,m*.08);evaluatePromotion();organizationTick(m)}
function careerEligibility(f){var p=game.player;if(f===p.faction)return[false,'Voie actuelle'];if(p.ageMonths<180)return[false,'Carrière accessible à partir de 15 ans'];if(f==='Marine'&&p.bounty>0)return[false,'Une prime active bloque le recrutement'];if(f==='Gouvernement'){if(p.bounty>0)return[false,'Une prime active bloque le recrutement'];if((p.stats.Discipline||0)<18)return[false,'Discipline 18 requise']}if(f==='Chasseur de primes'&&p.bounty>50000)return[false,'Prime trop élevée'];return[true,'']}
function realignRelationsAfterFactionChange(oldF,newF){
 var p=game.player;game.relations.forEach(function(r){if(r.status!=='active')return;var family=r.type==='family'||r.role==='parent'||r.role==='frère / sœur',partner=r.id===p.life.partnerId||r.type==='partner'||r.role==='partenaire';
  if(r.joinedOrganization){r.joinedOrganization=false;if(r.type==='organization')r.type='social';addRelationMemory(r,'Ton changement de voie vous sépare de votre ancienne organisation.','faction')}
  if(r.faction===newF){r.respect=cl(r.respect+4,0,100);r.trust=cl(r.trust+2,0,100);addRelationMemory(r,'Ton arrivée dans '+newF+' rapproche vos trajectoires.','faction');return}
  var hostile=diplomacy(newF,r.faction)<-35;if(!hostile)return;
  var shield=(family?0.35:partner?0.5:1)*(r.trust>=75?.55:1),trustLoss=8*shield,loyaltyLoss=9*shield,rivalGain=10*shield;
  r.trust=cl(r.trust-trustLoss,0,100);r.loyalty=cl(r.loyalty-loyaltyLoss,0,100);r.rivalry=cl(r.rivalry+rivalGain,0,100);addRelationMemory(r,'Ton changement vers '+newF+' crée une tension avec son appartenance à '+r.faction+'.','faction');
  if(!r.canonical&&!family&&!partner&&r.trust<32&&r.rivalry>=58&&r.role!=='mentor'){r.role='rival';addRelationMemory(r,'Le désaccord politique devient une rivalité personnelle.','rival')}
 })
}
function switchCareer(f){var p=game.player,old=p.faction,q=careerEligibility(f);if(!q[0])return toast(q[1]);if(old!=='Civil')adjustRep(old,-16);if((old==='Marine'||old==='Gouvernement')&&(f==='Pirates'||f==='Révolutionnaires')){p.deserterFrom.push(old);issueBounty(80000,'Désertion');tl('Désertion','Ton changement de camp est considéré comme une trahison. Une prime est émise.','danger')}join(f,firstRank(f));realignInfluenceAfterFactionChange(old,f);realignRelationsAfterFactionChange(old,f);save();render()}
function careerChangeDecision(){var p=game.player,ch=[];FACTION_KEYS.forEach(function(f){if(f===p.faction)return;var q=careerEligibility(f);if(q[0])ch.push([(CAREERS[f]?CAREERS[f].label:f),'Quitter '+(CAREERS[p.faction]?CAREERS[p.faction].label:p.faction)+' pour cette voie.',function(){switchCareer(f)}])});if(!ch.length)return toast('Aucune autre voie n’est accessible actuellement.');ch.push(['Rester','Ne rien changer.',function(){}]);decision('Changer de voie','Un changement de faction peut dégrader tes anciennes relations et, en cas de désertion, créer une prime.',ch)}

function styleEdge(a,b){return(MATCH[a]&&MATCH[a][b])||-((MATCH[b]&&MATCH[b][a])||0)}
function injuryName(sev){if(sev>=3)return pk(['Fracture','Traumatisme','Plaie profonde'],'inj');if(sev===2)return pk(['Entorse','Coupure sérieuse','Contusion profonde'],'inj');return pk(['Ecchymoses','Coupure légère','Douleur musculaire'],'inj')}
function combatPrimarySkill(){var p=game.player;return p.style==='Sabreur'?'Sabre':p.style==='Tireur'?'Tir':'Combat'}
function combatProfile(){var p=game.player,mastery=styleMastery(),inj=p.conditions.reduce(function(a,c){return a+(c.severity||1)*2},0),offMod=p.style==='Corps-à-corps'?2:p.style==='Sabreur'||p.style==='Tireur'?1:p.style==='Mobile / esquive'?-1:0,defMod=p.style==='Mobile / esquive'?3:p.style==='Équilibré'?1:0;return{offense:p.stats.Force*.15+p.stats.Vitesse*.12+mastery*.34+p.skills.Combat*.10+p.haki.Armement*.18+p.haki.Conquérant*.08+(p.fruit?p.fruitMastery*.12:0)+techniqueBonus()*.35+offMod,defense:p.stats.Résistance*.19+p.stats.Agilité*.17+p.stats.Réflexes*.18+mastery*.10+p.skills.Combat*.07+p.haki.Observation*.22+p.haki.Armement*.08+defMod-inj,stamina:p.stats.Endurance*.65+p.energy*.22+p.health*.13}}
function fight(d,t){var p=game.player,styles=['Équilibré','Corps-à-corps','Sabreur','Tireur','Mobile / esquive'],enemyStyle=pk(styles,'f'),terrain=pk(['terrain ouvert','pont de navire','espace étroit','ruelles','terrain accidenté'],'f'),cp=combatProfile(),edge=styleEdge(p.style,enemyStyle),enemyOff=d*(.72+R('f')*.46),enemyDef=d*(.7+R('f')*.44),terrainMod=(terrain==='espace étroit'&&p.style==='Tireur')?-4:(terrain==='terrain ouvert'&&p.style==='Tireur')?4:(terrain==='terrain accidenté'&&p.style==='Mobile / esquive')?4:0,playerScore=cp.offense*.58+cp.defense*.34+cp.stamina*.08+edge+terrainMod+(R('f')-.5)*12,enemyScore=enemyOff*.6+enemyDef*.4+(R('f')-.5)*12+Math.max(0,d-35)*.16,adv=playerScore-enemyScore,chance=cl(.5+adv/88,.03,.97),ok=R('f')<chance,margin=Math.abs(adv)+(R('f')*10),damage=0,outcome='';
 p.energy=cl(p.energy-(5+d*.08),0,100);
 if(ok){p.wins++;p.reputation+=4;p.combatXP+=3+d/18;var primarySkill=combatPrimarySkill();gain(primarySkill,1+d/42);if(primarySkill!=='Combat')gain('Combat',.25+d/140);damage=margin<10?Math.round(2+R('f')*7):Math.round(R('f')*4);p.health=cl(p.health-damage,0,100);outcome=margin>22?'Victoire nette':margin>10?'Victoire':'Victoire difficile';if(p.haki.Armement)trainHaki('Armement',.35);if(p.haki.Observation)trainHaki('Observation',.35);if(p.fruit)trainFruit(.3);if(d>=55)attemptBreakthrough('combat',d);tl(t||'Combat',outcome+'. '+(damage?'Tu subis '+damage+'% de dégâts.':'Tu évites les blessures sérieuses.'),'major')}
 else{p.losses++;damage=Math.round(cl(7+(enemyScore-playerScore)*.28+R('f')*18,5,58)*diff()[1]);p.health=cl(p.health-damage,0,100);outcome=damage>35?'Défaite sévère':damage>18?'Défaite':'Repli forcé';if(damage>12){var sev=damage>35?3:damage>22?2:1,inj={name:injuryName(sev),months:sev*(1.5+R('inj')*2),severity:sev};p.conditions.push(inj)}tl(t||'Combat',outcome+'. Tu subis '+damage+'% de dégâts.','danger');if(p.health<=0||R('f')<Math.max(0,(enemyScore-playerScore)/230))die('Mort lors d’un affrontement.')}
 game.lastCombat={title:t||'Combat',outcome:outcome,opponentPower:Math.round((enemyOff+enemyDef)/2),playerPower:Math.round(power()),opponentStyle:enemyStyle,playerStyle:p.style,terrain:terrain,matchup:edge+terrainMod,chance:Math.round(chance*100),damage:damage,log:(edge+terrainMod>2?'Ton style exploite le matchup. ':edge+terrainMod<-2?'Le matchup te désavantage. ':'Le matchup est relativement neutre. ')+(p.haki.Observation?'Ton Observation aide à lire les attaques. ':'')+(p.haki.Armement?' Ton Armement renforce les échanges.':'')};syncPowers();return ok}
function challengeFight(){var p=game.player;if(p.ageMonths<144)return toast('Tu es encore trop jeune pour chercher un vrai défi.');if(p.health<45)return toast('Ta santé est trop basse.');var d=inf().danger+12+R('f')*24,ok=fight(d,'Défi local à '+p.island);if(game.alive&&ok){var t=game.world.territories[p.island];if((p.faction==='Pirates'||p.faction==='Révolutionnaires')&&t&&(t.controller==='Marine'||t.controller==='Gouvernement'))registerCrime('Violence publique à '+p.island,2,null)}save();render();if(!game.alive)deathModal()}
function combatRiskLabel(d){
 var delta=power()-d;if(delta>=24)return'Favorable';if(delta>=8)return'Modéré';if(delta>=-10)return'Incertain';if(delta>=-25)return'Dangereux';return'Extrême'
}
function board(){var p=game.player,a=MISSIONS[p.faction]||MISSIONS.Civil,ri=rankIndex(),spec=p.specialization;var options=a.filter(function(m){return m.tier<=ri+1&&(!m.spec||m.spec===spec)}).map(function(m){var x={title:m.title,danger:Math.round(m.danger+inf().danger*.22),reward:Math.round(m.reward*(1+ri*.1)),xp:m.xp,tier:m.tier,spec:m.spec||null,months:1+Math.ceil(m.danger/28)};x.profile=missionProfile(x).id;x.approach=missionProfile(x).config.label;x.chance=missionChance(x);return x});options.sort(function(x,y){var xs=x.spec===spec?1:0,ys=y.spec===spec?1:0;return ys-xs||y.chance-x.chance||x.tier-y.tier});return options.slice(0,3).map(function(x,i){x.id=i;x.recommended=i===0;return x})}
function startMission(i){if(game.mission||game.player.ageMonths<180)return toast('Mission indisponible.');var m=board()[i];if(!m)return toast('Mission introuvable.');game.mission={title:m.title,danger:m.danger,reward:m.reward,xp:m.xp,tier:m.tier,spec:m.spec,profile:m.profile,remaining:m.months};game.player.situation='Mission';tl('Mission acceptée',m.title+' • approche principale : '+missionProfile(m).config.label+'.','major');save();render()}
function missionReputation(success,m){var p=game.player,d=success?(5+m.tier*2):-(3+m.tier);adjustRep(p.faction,d);if(success){if(p.faction==='Marine'){adjustRep('Gouvernement',1);adjustRep('Pirates',-1)}if(p.faction==='Pirates'){adjustRep('Marine',-2);adjustRep('Gouvernement',-1)}if(p.faction==='Révolutionnaires')adjustRep('Gouvernement',-2);if(p.faction==='Gouvernement')adjustRep('Révolutionnaires',-2);if(p.faction==='Chasseur de primes')adjustRep('Civil',1)}}
function playerWorldImpact(success,m){var p=game.player,w=game.world,t=w.territories[p.island];if(!t)return;var f=p.faction,scale=(m.tier||0)+1;if(success){if(w.factions[f]!=null)w.factions[f]=cl(w.factions[f]+scale*.18,0,100);if(f==='Civil'||f==='Chasseur de primes'){t.stability=cl(t.stability+scale*2,0,100)}else if(t.controller===f||(f==='Marine'&&t.controller==='Gouvernement')||(f==='Gouvernement'&&t.controller==='Marine')){t.influence=cl(t.influence+scale*2.4,0,100);t.stability=cl(t.stability+scale,0,100)}else{t.influence=cl(t.influence-scale*2.2,0,100);t.stability=cl(t.stability-scale*2,0,100);t.contested=t.influence<55;if((m.tier||0)>=3&&R('world')<.35)spawnConflict(p.island,f,t.controller,45+scale*6,'player')}if((m.tier||0)>=4){w.divergence=cl(w.divergence+.4*scale,0,100);news('Intervention remarquée',p.name+' influence directement l’équilibre autour de '+p.island+'.','major')}}else{t.stability=cl(t.stability-scale*1.2,0,100);if(w.factions[f]!=null)w.factions[f]=cl(w.factions[f]-.08*scale,0,100)}}
function missionResolution(m){var p=game.player,effective=organizationMissionDanger(m),mp=missionProfile(m),score=missionScore(m),chance=missionChance(m),ok=false,detail='',gainKey=mp.config.keys[0];if(mp.config.combat){ok=fight(effective,'Mission : '+m.title);if(!game.alive)return{ok:false,dead:true,profile:mp.config.label,chance:chance,score:score,effective:effective};detail='Affrontement direct'}else{ok=R('mission')<chance;p.energy=cl(p.energy-(3+effective*.035),0,100);if(ok){var gained=gain(gainKey,.55+(m.tier||0)*.18+R('mission')*.35);detail=mp.config.label+' réussie'+(gained?' • '+gainKey+' +'+gained.toFixed(1):'')}else{var harm=Math.round(Math.max(0,(effective-score)*.08)+R('mission')*4);if(mp.id==='rescue'||mp.id==='navigation'||mp.id==='hunt'||mp.id==='mixed')p.health=cl(p.health-harm,1,100);if((mp.id==='stealth'||mp.id==='hunt'||mp.id==='mixed')&&effective>=48&&R('mission')<.28){var survived=fight(Math.max(20,effective*.68),'Extraction compromise');if(!game.alive)return{ok:false,dead:true,profile:mp.config.label,chance:chance,score:score,effective:effective};detail='Mission compromise • '+(survived?'extraction réussie':'repli difficile')}else detail='Échec de '+mp.config.label.toLowerCase()}}return{ok:ok,dead:false,profile:mp.config.label,chance:chance,score:score,effective:effective,detail:detail}}
function resolveMission(){var m=game.mission,p=game.player,rec=careerRecord(),result=missionResolution(m);if(!game.alive||result.dead)return;var ok=result.ok;if(ok){var paid=organizationMissionResult(true,m,m.reward);p.money+=paid;p.reputation+=6;rec.xp+=m.xp;rec.successes++;missionReputation(true,m);playerWorldImpact(true,m);justiceMissionImpact(true,m);tl('Mission accomplie',m.title+' • '+result.profile+' • '+result.detail+'. +'+m.xp+' XP carrière.','major')}else{organizationMissionResult(false,m,0);rec.xp+=Math.round(m.xp*.25);rec.failures++;missionReputation(false,m);playerWorldImpact(false,m);justiceMissionImpact(false,m);tl('Mission échouée',m.title+' • '+result.profile+' • '+result.detail+'.','danger')}game.lastMission={title:m.title,profile:result.profile,score:Math.round(result.score),danger:Math.round(result.effective),chance:Math.round(result.chance*100),success:ok};game.mission=null;p.situation='Carrière';evaluatePromotion()}

function req(d){var r=inf(d).region,p=game.player;if(r==='Grand Line'&&p.skills.Navigation<18)return[false,'Navigation 18'];if(r==='New World'&&(p.skills.Navigation<35||power()<35))return[false,'Navigation 35 + puissance 35'];return[true,'']}
function go(d){var q=req(d);if(!q[0])return toast('Accès verrouillé : '+q[1]);var p=game.player,z=inf(d).danger,est=routeEstimate(p.island,d),mo=est.months,cond=est.condition;decision('Prendre la mer','Voyager vers '+d+' prendra environ '+mo+' mois. Conditions prévues : '+cond.name+'.',[['Partir','Danger '+z+'/100 • cargaison '+Math.round(est.load*100)+'% • '+cond.name,function(){p.travel={from:p.island,destination:d,remaining:mo,total:mo,danger:z,condition:cond.id,logs:[],startedAge:p.ageMonths};p.situation='Navigation';p.activity='Navigation';migrateExploration(p).journeys++;addJourneyLog('Départ','Cap sur '+d+' sous '+cond.name.toLowerCase()+'.');tl('Départ en mer','Cap sur '+d+' • '+cond.name+'.','major')}],['Rester','Annuler.',function(){}]])}
function travel(m){var p=game.player,t=p.travel;if(!t)return;seaJourneyTick(m);if(!game.alive)return;t.remaining-=m;if(t.remaining<=0){var dest=t.destination,site=explorationSite(dest);p.island=dest;p.region=inf(dest).region;p.travel=null;p.situation='Arrivée';p.activity='Explorer';site.visits=(site.visits||0)+1;site.familiarity=cl(site.familiarity+8+(p.skills.Navigation||0)*.03,0,100);if(p.visited.indexOf(p.island)<0)p.visited.push(p.island);if(game.codex.places.indexOf(p.island)<0)game.codex.places.push(p.island);inspectSmugglingAtArrival(p.island);discoverByKnowledge(p.island);tl('Nouvelle destination','Tu arrives à '+p.island+'. Première impression : '+islandProfile(p.island).identity,'major')}}
function hostileCandidates(defender){
 var map={Marine:['Pirates','Révolutionnaires'],Gouvernement:['Pirates','Révolutionnaires'],Pirates:['Marine','Gouvernement','Chasseur de primes'],Révolutionnaires:['Gouvernement','Marine'],Civil:['Pirates'], 'Chasseur de primes':['Pirates']};
 return map[defender]||['Pirates','Marine']
}

function defaultStrategy(){return{actions:1,campaignsLed:0,warsWon:0,warsLost:0,frontsJoined:0,supportSpent:0,lastWarId:null}}
function migrateStrategy(p){p.strategy=p.strategy||defaultStrategy();var x=p.strategy;x.actions=x.actions==null?1:x.actions;x.campaignsLed=x.campaignsLed||0;x.warsWon=x.warsWon||0;x.warsLost=x.warsLost||0;x.frontsJoined=x.frontsJoined||0;x.supportSpent=x.supportSpent||0;x.lastWarId=x.lastWarId||null;return x}
function initGrandStrategy(w){
 w.wars=w.wars||[];w.treaties=w.treaties||[];w.warHistory=w.warHistory||[];w.nextWarId=w.nextWarId||1;w.nextTreatyId=w.nextTreatyId||1;
 if(!w.treaties.some(function(t){return t.status==='active'&&t.type==='alliance'&&pairKey(t.a,t.b)===pairKey('Marine','Gouvernement')}))w.treaties.push({id:'treaty-foundation',type:'alliance',a:'Marine',b:'Gouvernement',status:'active',monthsLeft:null,sinceYear:w.year||0,reason:'Structure institutionnelle'});
 w.wars.forEach(function(war){war.attackerCoalition=war.attackerCoalition||[war.attacker];war.defenderCoalition=war.defenderCoalition||[war.defender];war.score=war.score||0;war.exhaustionA=war.exhaustionA||0;war.exhaustionD=war.exhaustionD||0;war.months=war.months||0;war.fronts=war.fronts||[];war.history=war.history||[];war.status=war.status||'active';war.goal=war.goal||'Pression stratégique'});
 return w
}
function activeTreaty(a,b,type){
 var k=pairKey(a,b);return game.world.treaties.find(function(t){return t.status==='active'&&pairKey(t.a,t.b)===k&&(!type||t.type===type)})||null
}
function createTreaty(a,b,type,months,reason){
 var w=game.world;if(a===b)return null;var old=activeTreaty(a,b,type);if(old){if(months!=null)old.monthsLeft=Math.max(old.monthsLeft||0,months);return old}
 var t={id:'treaty-'+(w.nextTreatyId++),type:type,a:a,b:b,status:'active',monthsLeft:months==null?null:months,sinceYear:w.year,sinceMonth:Math.floor(w.month),reason:reason||''};w.treaties.push(t);
 if(type==='alliance')w.diplomacy[pairKey(a,b)]=cl(Math.max(w.diplomacy[pairKey(a,b)]||0,62),-100,100);if(type==='truce')w.diplomacy[pairKey(a,b)]=cl(Math.max(w.diplomacy[pairKey(a,b)]||0,-15),-100,100);
 news(type==='alliance'?'Nouvelle alliance':'Accord diplomatique',a+' et '+b+' concluent '+(type==='alliance'?'une alliance':'une trêve')+(months?' pour '+months+' mois':'')+'.','major');return t
}
function alliancePartners(faction){
 return game.world.treaties.filter(function(t){return t.status==='active'&&t.type==='alliance'&&(t.a===faction||t.b===faction)}).map(function(t){return t.a===faction?t.b:t.a})
}
function coalitionFor(faction,opponent){
 var out=[faction];alliancePartners(faction).forEach(function(a){if(a!==opponent&&diplomacy(a,opponent)<25&&out.indexOf(a)<0)out.push(a)});return out
}
function sideContains(war,side,f){return(side==='attacker'?war.attackerCoalition:war.defenderCoalition).indexOf(f)>=0}
function warBetween(a,b){
 return game.world.wars.find(function(w){return w.status==='active'&&((w.attackerCoalition.indexOf(a)>=0&&w.defenderCoalition.indexOf(b)>=0)||(w.attackerCoalition.indexOf(b)>=0&&w.defenderCoalition.indexOf(a)>=0))})||null
}
function warGoalLabel(goal){return goal==='territory'?'Conquête territoriale':goal==='liberation'?'Libération':goal==='suppression'?'Écrasement du réseau':goal==='blockade'?'Blocus':'Pression stratégique'}
function canStartStrategicWar(a,b){
 if(!a||!b||a===b)return false;if(warBetween(a,b))return false;if(activeTreaty(a,b,'truce'))return false;if(activeTreaty(a,b,'alliance'))return false;return diplomacy(a,b)<=-35
}
function pickWarTarget(defender,region){
 var names=Object.keys(game.world.territories).filter(function(n){var t=game.world.territories[n];return t.controller===defender&&(!region||infStatic(n).region===region)});if(!names.length)names=Object.keys(game.world.territories).filter(function(n){return game.world.territories[n].controller===defender});return names.length?pk(names,'strategy'):null
}
function startStrategicWar(attacker,defender,goal,target,source){
 var w=game.world;if(!canStartStrategicWar(attacker,defender))return null;target=target||pickWarTarget(defender,null);if(!target)return null;
 var ac=coalitionFor(attacker,defender),dc=coalitionFor(defender,attacker).filter(function(f){return ac.indexOf(f)<0});var war={id:'war-'+(w.nextWarId++),name:attacker+' vs '+defender,attacker:attacker,defender:defender,attackerCoalition:ac,defenderCoalition:dc,goal:goal||'territory',target:target,region:infStatic(target).region,months:0,score:0,exhaustionA:0,exhaustionD:0,status:'active',source:source||'world',fronts:[],history:[],playerLed:source==='player',playerContribution:0};
 w.wars.push(war);w.globalTension=cl(w.globalTension+8,0,100);war.attackerCoalition.forEach(function(f){war.defenderCoalition.forEach(function(g){w.diplomacy[pairKey(f,g)]=cl((w.diplomacy[pairKey(f,g)]||0)-8,-100,100)})});
 news('GUERRE : '+attacker+' contre '+defender,warGoalLabel(war.goal)+' autour de '+target+'.','war');if(source==='player'){migrateStrategy(game.player).campaignsLed++;migrateStrategy(game.player).lastWarId=war.id;tl('Campagne lancée','Ton organisation ouvre une campagne contre '+defender+' pour '+target+'.','major')}
 spawnConflict(target,attacker,defender,45+R('strategy')*25,source==='player'?'player-campaign':'war',war.id);return war
}
function warSideForPlayer(war){
 var p=game.player,domains=(p.influence&&p.influence.domains)||[],targetOwned=domains.indexOf(war.target)>=0;
 if(p.faction==='Pirates'){if(war.playerLed&&war.source==='player')return'attacker';if(targetOwned){var tt=game.world.territories[war.target];if(tt&&tt.playerControl&&tt.playerControl.ownerKey===dynastyKey())return sideContains(war,'attacker',tt.playerControl.faction)?'attacker':'defender'}return null}
 if(sideContains(war,'attacker',p.faction))return'attacker';if(sideContains(war,'defender',p.faction))return'defender';
 if(targetOwned){var t=game.world.territories[war.target];if(t&&t.playerControl&&sideContains(war,'defender',t.playerControl.faction))return'defender'}return null
}
function recordWarBattle(c,winner){
 if(!c.warId)return;var war=game.world.wars.find(function(w){return w.id===c.warId&&w.status==='active'});if(!war)return;var attackWin=sideContains(war,'attacker',winner),delta=6+c.intensity*.08+(c.location===war.target?5:0);war.score=cl(war.score+(attackWin?delta:-delta),-100,100);if(attackWin)war.exhaustionD=cl(war.exhaustionD+4+c.intensity*.04,0,120);else war.exhaustionA=cl(war.exhaustionA+4+c.intensity*.04,0,120);war.history.unshift({month:war.months,location:c.location,winner:winner,delta:Math.round(delta)});war.history=war.history.slice(0,20)
}
function strategicFrontLocations(war){
 var regions=[war.region],names=Object.keys(game.world.territories).filter(function(n){var t=game.world.territories[n];return regions.indexOf(infStatic(n).region)>=0&&(sideContains(war,'attacker',t.controller)||sideContains(war,'defender',t.controller))});if(war.target&&names.indexOf(war.target)<0)names.unshift(war.target);return names
}
function spawnWarFront(war){
 var locations=strategicFrontLocations(war);if(!locations.length)return null;var loc=pk(locations,'strategy'),t=game.world.territories[loc],def=t.controller,att;
 if(sideContains(war,'defender',def))att=pk(war.attackerCoalition,'strategy');else if(sideContains(war,'attacker',def))att=pk(war.defenderCoalition,'strategy');else{def=war.defender;att=war.attacker}
 var c=spawnConflict(loc,att,def,32+R('strategy')*48,'war-front',war.id);if(c&&war.fronts.indexOf(c.id)<0)war.fronts.push(c.id);return c
}
function resolveWar(war,outcome){
 var w=game.world;if(war.status!=='active')return;war.status='resolved';war.outcome=outcome;war.endYear=w.year;war.endMonth=Math.floor(w.month);
 var attackerWon=outcome==='attacker',defenderWon=outcome==='defender',target=w.territories[war.target];
 if(attackerWon&&target){target.controller=war.attacker;target.influence=cl(Math.max(48,target.influence),0,100);target.stability=cl(target.stability-8,0,100);target.lastChange='Paix, année '+w.year;if(target.playerControl&&target.playerControl.ownerKey===dynastyKey()&&target.playerControl.faction!==war.attacker){target.playerControl.control=cl(target.playerControl.control-45,0,100);if(target.playerControl.control<25)loseDomain(war.target,'conditions de paix')}}
 if(defenderWon&&target&&sideContains(war,'attacker',target.controller)){target.controller=war.defender;target.influence=cl(Math.max(45,target.influence),0,100)}
 createTreaty(war.attacker,war.defender,'truce',12+Math.round(R('strategy')*12),'Fin de guerre');w.globalTension=cl(w.globalTension-8,0,100);
 var text=attackerWon?war.attacker+' impose ses conditions à '+war.defender+'.':defenderWon?war.defender+' repousse '+war.attacker+'.':'Les deux camps acceptent une paix sans victoire décisive.';
 news('Fin de guerre',text,'major');w.warHistory.unshift({name:war.name,outcome:outcome,months:war.months,target:war.target,score:Math.round(war.score),year:w.year});w.warHistory=w.warHistory.slice(0,30);
 var ps=warSideForPlayer(war),st=migrateStrategy(game.player);if(ps){var won=(ps==='attacker'&&attackerWon)||(ps==='defender'&&defenderWon);if(won)st.warsWon++;else if(outcome!=='negotiated')st.warsLost++;if(war.playerLed)tl('Campagne terminée',text,won?'major':'danger')}
}
function simulateTreaties(){
 var w=game.world;w.treaties.forEach(function(t){if(t.status!=='active'||t.monthsLeft==null)return;t.monthsLeft--;if(t.monthsLeft<=0){t.status='expired';news('Fin d’accord',t.a+' et '+t.b+' voient leur '+(t.type==='truce'?'trêve':'accord')+' arriver à terme.','')}});
 var keys=Object.keys(w.diplomacy);if(R('strategy')<.025){var k=pk(keys,'strategy'),parts=k.split('|'),v=w.diplomacy[k];if(v>=72&&!activeTreaty(parts[0],parts[1])&&canStartStrategicWar(parts[0],parts[1])===false&&!activeTreaty(parts[0],parts[1],'truce'))createTreaty(parts[0],parts[1],'alliance',18+Math.round(R('strategy')*24),'Convergence stratégique')}
 w.treaties=w.treaties.filter(function(t){return t.status==='active'||(t.monthsLeft!=null&&t.monthsLeft>-6)})
}
function simulateWars(){
 var w=game.world;w.wars.filter(function(war){return war.status==='active'}).forEach(function(war){
  war.months++;var activeFronts=w.conflicts.filter(function(c){return c.status==='active'&&c.warId===war.id});war.fronts=activeFronts.map(function(c){return c.id});
  var pressure=.8+activeFronts.length*.65+w.globalTension*.006;war.exhaustionA=cl(war.exhaustionA+pressure*(.8+R('strategy')*.7),0,120);war.exhaustionD=cl(war.exhaustionD+pressure*(.8+R('strategy')*.7),0,120);
  if(activeFronts.length<2&&R('strategy')<.48)spawnWarFront(war);
  if(war.score>=72||war.exhaustionD>=100)resolveWar(war,'attacker');else if(war.score<=-72||war.exhaustionA>=100)resolveWar(war,'defender');else if(war.months>=8&&war.exhaustionA+war.exhaustionD>=150&&Math.abs(war.score)<45)resolveWar(war,'negotiated');else if(war.months>=22)resolveWar(war,war.score>18?'attacker':war.score<-18?'defender':'negotiated')
 });
 if(w.wars.filter(function(x){return x.status==='active'}).length<3&&w.globalTension>48&&R('strategy')<.045){var pairs=Object.keys(w.diplomacy).filter(function(k){var p=k.split('|');return w.diplomacy[k]<=-70&&canStartStrategicWar(p[0],p[1])});if(pairs.length){var pair=pk(pairs,'strategy').split('|'),a=pair[0],b=pair[1],target=pickWarTarget(b,null);if(!target){var swap=a;a=b;b=swap;target=pickWarTarget(b,null)}if(target)startStrategicWar(a,b,'territory',target,'world')}}
}
function strategyTick(){
 migrateStrategy(game.player).actions=1;simulateTreaties();simulateWars()
}
function useStrategyAction(){
 var st=migrateStrategy(game.player);if(st.actions<1){toast('Tu as déjà utilisé ton action stratégique pour cette période.');return false}st.actions--;return true
}
function campaignEligibility(){
 var p=game.player,x=influenceMetrics(),o=p.organization,j=migrateJustice(p);if(p.ageMonths<216)return[false,'Il faut être adulte.'];if(j.detained)return[false,'Impossible en détention.'];if(!o||o.authority!=='leader')return[false,'Il faut diriger une organisation.'];if(x.score<68)return[false,'Influence 68 requise.'];if(organizationPower()<52)return[false,'Puissance d’organisation 52 requise.'];if(p.faction==='Civil'||p.faction==='Chasseur de primes')return[false,'Ta faction ne mène pas de guerre territoriale directe.'];return[true,'']
}
function campaignTargets(){
 var p=game.player,q=campaignEligibility();if(!q[0])return[];return Object.keys(game.world.territories).filter(function(n){var t=game.world.territories[n];return infStatic(n).region===p.region&&t.controller!==p.faction&&diplomacy(p.faction,t.controller)<=-35&&!warBetween(p.faction,t.controller)&&!activeTreaty(p.faction,t.controller,'truce')}).sort(function(a,b){return infStatic(a).danger-infStatic(b).danger}).slice(0,8)
}
function launchCampaign(target){
 var p=game.player,o=p.organization,t=game.world.territories[target],q=campaignEligibility();if(!q[0])return toast(q[1]);if(!t)return toast('Cible invalide.');if(!useStrategyAction())return;var cost=30000,supply=12;if(o.treasury+p.money<cost||o.supplies<supply){migrateStrategy(p).actions++;return toast('Campagne : 30 000 B et 12% de provisions requis.')}var from=Math.min(o.treasury,cost);o.treasury-=from;p.money-=cost-from;o.supplies-=supply;migrateStrategy(p).supportSpent+=cost;var war=startStrategicWar(p.faction,t.controller,'territory',target,'player');if(!war){migrateStrategy(p).actions++;o.supplies+=supply;o.treasury+=from;p.money+=cost-from;return toast('Impossible d’ouvrir cette campagne actuellement.')}save();render()
}
function supportStrategicWar(id){
 var p=game.player,war=game.world.wars.find(function(w){return w.id===id&&w.status==='active'}),side=war&&warSideForPlayer(war),o=p.organization;if(!war||!side)return toast('Tu n’es pas engagé dans cette guerre.');if(!useStrategyAction())return;var cost=10000,supply=6;if(!o||o.treasury+p.money<cost||o.supplies<supply){migrateStrategy(p).actions++;return toast('Soutien : organisation, 10 000 B et 6% de provisions requis.')}var from=Math.min(o.treasury,cost);o.treasury-=from;p.money-=cost-from;o.supplies-=supply;var impact=3+organizationPower()*.055+influenceMetrics().score*.025+R('strategy')*5;war.score=cl(war.score+(side==='attacker'?impact:-impact),-100,100);war.playerContribution=(war.playerContribution||0)+impact;migrateStrategy(p).supportSpent+=cost;tl('Soutien stratégique','Ton organisation renforce le camp '+(side==='attacker'?war.attacker:war.defender)+' dans '+war.name+'.','major');save();render()
}
function joinWarFront(id){
 var p=game.player,war=game.world.wars.find(function(w){return w.id===id&&w.status==='active'}),side=war&&warSideForPlayer(war);if(!war||!side)return toast('Tu n’es pas engagé dans cette guerre.');if(p.justice&&p.justice.detained)return toast('Impossible en détention.');var fronts=game.world.conflicts.filter(function(c){return c.status==='active'&&c.warId===war.id&&c.region===p.region});if(!fronts.length)return toast('Aucun front accessible dans ta région.');if(!useStrategyAction())return;var c=pk(fronts,'strategy'),enemy=side==='attacker'?c.defender:c.attacker,d=cl(c.intensity*.72+(game.world.factions[enemy]||45)*.35,20,96),ok=fight(d,'Front de guerre : '+c.location);if(!game.alive)return;if(ok){var impact=8+power()*.05;war.score=cl(war.score+(side==='attacker'?impact:-impact),-100,100);c.intensity=cl(c.intensity+6,15,100);migrateStrategy(p).frontsJoined++;tl('Intervention décisive','Ton action influence le front de '+c.location+'.','major')}else{var loss=5+power()*.025;war.score=cl(war.score+(side==='attacker'?-loss:loss),-100,100);tl('Intervention repoussée','Ton camp perd du terrain après ton intervention.','danger')}save();render()
}
function proposeStrategicPeace(id){
 var p=game.player,war=game.world.wars.find(function(w){return w.id===id&&w.status==='active'}),side=war&&warSideForPlayer(war),x=influenceMetrics();if(!war||!side||war.months<3)return toast('Aucune paix crédible à proposer.');if(x.score<76)return toast('Influence 76 requise pour peser sur les négociations.');if(!useStrategyAction())return;var exhaustion=(war.exhaustionA+war.exhaustionD)/2,ch=cl(.18+exhaustion/150+(Math.abs(war.score)<22?.12:0)+x.score/500,.12,.88);if(R('strategy')<ch){resolveWar(war,'negotiated');tl('Négociation réussie','Une trêve met fin à la campagne.','major')}else tl('Négociation rejetée','Les camps refusent encore de mettre fin à la guerre.','danger');save();render()
}
function renderStrategy(){
 var p=game.player,w=game.world,st=migrateStrategy(p),active=w.wars.filter(function(x){return x.status==='active'}),involved=active.filter(function(x){return !!warSideForPlayer(x)}),treaties=w.treaties.filter(function(t){return t.status==='active'});
 $('#warBadge').textContent=active.length+' guerre'+(active.length>1?'s':'');$('#warOverview').innerHTML='<div><span>Guerres actives</span><strong>'+active.length+'</strong></div><div><span>Ton camp impliqué</span><strong>'+involved.length+'</strong></div><div><span>Campagnes menées</span><strong>'+st.campaignsLed+'</strong></div><div><span>Victoires stratégiques</span><strong>'+st.warsWon+'</strong></div>';
 $('#warList').innerHTML=active.length?active.map(function(war){var side=warSideForPlayer(war),aw=cl(Math.max(0,war.score),0,100)/2,dw=cl(Math.max(0,-war.score),0,100)/2,fronts=w.conflicts.filter(function(c){return c.status==='active'&&c.warId===war.id});return '<div class="war-card '+(war.months>=8?'hot ':'')+(side?'player-war':'')+'"><div class="war-head"><strong>'+e(war.name)+'</strong><span>'+e(warGoalLabel(war.goal))+'</span></div><div class="war-meta">'+e(war.attackerCoalition.join(' + '))+' ↔ '+e(war.defenderCoalition.join(' + '))+' • cible '+e(war.target)+' • '+war.months+' mois</div><div class="war-score"><div class="attack" style="width:'+aw+'%"></div><div class="defend" style="width:'+dw+'%"></div></div><div class="war-exhaustion"><span>Attaquant : '+Math.round(war.exhaustionA)+' fatigue</span><span>Score '+Math.round(war.score)+'</span><span>Défenseur : '+Math.round(war.exhaustionD)+' fatigue</span></div><div class="war-fronts">'+(fronts.length?fronts.map(function(c){return '<span>'+e(c.location)+' • '+Math.round(c.intensity)+'</span>'}).join(''):'<span>Aucun front actif</span>')+'</div>'+(side?'<div class="relation-actions-mini"><button data-war-support="'+e(war.id)+'">Soutenir</button><button data-war-front="'+e(war.id)+'">Rejoindre un front</button>'+(war.months>=3?'<button data-war-peace="'+e(war.id)+'">Proposer une paix</button>':'')+'</div>':'')+'</div>'}).join(''):'<p class="helper-text">Aucune guerre stratégique active.</p>';
 $('#treatyBadge').textContent=treaties.length+' actif'+(treaties.length>1?'s':'');$('#treatyList').innerHTML=treaties.length?treaties.map(function(t){return '<div class="treaty-card '+(t.type==='alliance'?'alliance':'')+'"><div class="treaty-head"><strong>'+e(t.a)+' ↔ '+e(t.b)+'</strong><span>'+e(t.type)+'</span></div><div class="treaty-meta">'+e(t.reason||'Accord diplomatique')+(t.monthsLeft!=null?' • '+t.monthsLeft+' mois restants':' • durée indéterminée')+'</div></div>'}).join(''):'<p class="helper-text">Aucun accord actif.</p>';
 var q=campaignEligibility(),targets=campaignTargets(),actions='';if(q[0]&&targets.length)actions+='<button id="launchCampaignBtn" class="action-card strategy-warning"><strong>Lancer une campagne</strong><small>'+targets.length+' cible(s) disponible(s) dans '+e(p.region)+'.</small></button>';if(!actions)actions='<div class="career-card"><p>Dirige une organisation puissante et augmente ton influence pour initier des campagnes. Les guerres auxquelles ta faction participe restent accessibles ci-dessus.</p></div>';
 $('#strategyActionBadge').textContent=st.actions+' action';$('#strategyActions').innerHTML=actions;var lc=$('#launchCampaignBtn');if(lc)lc.onclick=function(){var ts=campaignTargets(),choices=ts.map(function(n){var t=w.territories[n];return[n,e(t.controller)+' • danger '+infStatic(n).danger+' • stabilité '+Math.round(t.stability),function(){launchCampaign(n)}]});choices.push(['Annuler','Ne rien engager.',function(){}]);decision('Ouvrir une campagne','Une guerre mobilise argent, provisions et influence. La paix ne sera pas immédiate.',choices)};
 $$('[data-war-support]').forEach(function(b){b.onclick=function(){supportStrategicWar(b.dataset.warSupport)}});$$('[data-war-front]').forEach(function(b){b.onclick=function(){joinWarFront(b.dataset.warFront)}});$$('[data-war-peace]').forEach(function(b){b.onclick=function(){proposeStrategicPeace(b.dataset.warPeace)}})
}

function spawnConflict(location,attacker,defender,intensity,source,warId){
 var w=game.world;if(!location||attacker===defender)return null;
 var existing=w.conflicts.find(function(c){return c.location===location&&c.status==='active'});
 if(existing){existing.intensity=cl(existing.intensity+8,15,100);if(warId&&!existing.warId)existing.warId=warId;return existing}
 var linked=warId||((warBetween(attacker,defender)||{}).id||null),c={id:'conf-'+w.year+'-'+Math.floor(w.month)+'-'+Math.floor(R('world')*99999),location:location,region:infStatic(location).region,attacker:attacker,defender:defender,intensity:Math.round(intensity||45),months:0,status:'active',source:source||'world',warId:linked};
 w.conflicts.push(c);w.globalTension=cl(w.globalTension+3,0,100);var t=w.territories[location];if(t)t.contested=true;
 news('Conflit à '+location,attacker+' conteste le contrôle de '+defender+'.','war');
 if(game.player.island===location)tl('Conflit territorial',attacker+' et '+defender+' s’affrontent autour de '+location+'.','danger');
 return c
}
function warBattleSidePower(war,side){
 var fs=side==='attacker'?war.attackerCoalition:war.defenderCoalition,primary=side==='attacker'?war.attacker:war.defender,base=game.world.factions[primary]||48,ally=fs.filter(function(f){return f!==primary}).reduce(function(a,f){return a+Math.max(0,(game.world.factions[f]||48)-40)*.10},0),bonus=0,p=game.player;
 if(war.playerLed&&warSideForPlayer(war)===side&&p.organization){bonus+=organizationPower()*.16+(p.organization.supplies||0)*.03;if(p.faction==='Pirates')bonus+=Math.min(8,(p.influence&&p.influence.affiliates?p.influence.affiliates.length:0)*1.5)}
 return base+ally+bonus
}
function resolveConflict(c){
 var w=game.world,t=w.territories[c.location];if(!t)return;var war=c.warId?w.wars.find(function(x){return x.id===c.warId&&x.status==='active'}):null,attackBase=w.factions[c.attacker]||48,defendBase=w.factions[c.defender]||48;
 if(war){var as=sideContains(war,'attacker',c.attacker)?'attacker':'defender',ds=as==='attacker'?'defender':'attacker';attackBase=warBattleSidePower(war,as);defendBase=warBattleSidePower(war,ds)}
 var ap=attackBase+(c.source&&String(c.source).indexOf('crew-')===0?(w.crews.find(function(x){return x.id===c.source})||{power:0}).power*.45:0)+R('world')*24+c.intensity*(war?.28:.12);
 var dp=defendBase+t.influence*(war?.14:.34)+R('world')*24+playerDomainDefense(c.location)*(war?.75:1);
 var winner=ap>dp?c.attacker:c.defender,loser=winner===c.attacker?c.defender:c.attacker,margin=Math.abs(ap-dp),pc=t.playerControl&&t.playerControl.ownerKey===dynastyKey()?t.playerControl:null;
 c.status='resolved';c.winner=winner;c.months=Math.max(1,c.months);
 if(winner!==t.controller){var old=t.controller;t.controller=winner;t.influence=Math.round(cl(48+margin*.45,42,76));t.stability=Math.round(cl(t.stability-12-R('world')*16,8,100));t.lastChange='Année '+w.year+', mois '+(Math.floor(w.month)+1);w.divergence=cl(w.divergence+(c.intensity/100)*1.5,0,100);news('Changement de contrôle',winner+' prend le contrôle de '+c.location+' au détriment de '+old+'.','major')}
 else{t.influence=cl(t.influence+5+margin*.12,0,100);t.stability=cl(t.stability+3-R('world')*4,0,100);news('Offensive repoussée',c.defender+' conserve '+c.location+' face à '+c.attacker+'.','war')}
 if(pc){if(winner===pc.faction)pc.control=cl(pc.control+5+margin*.08,0,100);else if(diplomacy(winner,pc.faction)<-20){pc.control=cl(pc.control-(18+margin*.22),0,100);if(pc.control<=20)loseDomain(c.location,'défaite militaire')}}
 t.contested=false;w.globalTension=cl(w.globalTension-1,0,100);
 w.worldHistory.unshift({year:w.year,month:Math.floor(w.month),type:'conflict',location:c.location,winner:winner,loser:loser});w.worldHistory=w.worldHistory.slice(0,80);recordWarBattle(c,winner)
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
function worldMonthStep(){syncActorAvailability();fruitMarketTick();syncCanonicalFruits();processCanonEvents();simulateTerritories();simulateCrews();simulateActors();simulateConflicts();simulateDiplomacy();strategyTick();simulateEconomy();var w=game.world;w.globalTension=cl(w.globalTension+(R('world')-.5)*2,0,100);REG.forEach(function(r){var rp=w.pressures[r];if(!rp)return;Object.keys(rp).forEach(function(k){rp[k]=cl(rp[k]+(R('world')-.5)*2.2,0,100)})})}
function world(m){var w=game.world;if(!w.v1ClockMigrated){var frac=(w.month||0)%1;w.month=Math.floor(w.month||0);w.simRemainder=(w.simRemainder||0)+frac;w.v1ClockMigrated=true}w.simRemainder=(w.simRemainder||0)+m;while(w.simRemainder>=1){w.simRemainder-=1;w.month++;if(w.month>=12){w.month=0;w.year++;if(R('world')<.55)news('Bilan annuel',pk(['La Marine réorganise plusieurs bases.','De nouveaux équipages se font un nom.','Des réseaux clandestins gagnent du terrain.','Plusieurs routes commerciales changent de mains.'],'world'),'')}worldMonthStep()}}
function runLocalEvent(){var p=game.player,candidates=LOCAL_EVENTS.filter(function(x){return x.regions.indexOf(p.region)>=0});if(!candidates.length)return false;var ev=pk(candidates,'local');if(ev.kind==='economy'){var v=1200+Math.round(R('local')*9000);if(R('local')<.58){p.money-=Math.min(Math.max(0,p.money),v);tl(ev.title,'Une transaction locale te coûte '+v.toLocaleString('fr-FR')+' B.')}else{p.money+=v;tl(ev.title,'Une opportunité commerciale te rapporte '+v.toLocaleString('fr-FR')+' B.')}}else if(ev.kind==='danger'){fight(inf().danger+8+R('local')*24,ev.title)}else if(ev.kind==='faction'){adjustRep(p.faction,1+R('local')*2);tl(ev.title,'Tes activités attirent l’attention des organisations présentes dans la zone.')}else if(ev.kind==='world'){news(ev.title,'Une information circule dans '+p.region+' et modifie les rumeurs locales.','');tl(ev.title,'Tu obtiens de nouvelles informations sur les forces locales.')}else if(ev.kind==='discovery'){var site=explorationSite(p.island),gain=3+R('local')*7;site.familiarity=cl(site.familiarity+gain,0,100);var found=discoverByKnowledge(p.island);if(!found)learnLocalRumor(p.island);var value=300+Math.round(R('local')*2200);p.money+=value;tl(ev.title,'Ton exploration enrichit ta connaissance de '+p.island+' et te rapporte '+value.toLocaleString('fr-FR')+' B.')}return true}
function event(m,force){
 var p=game.player,l=migrateLifeLoop(game),before=l.momentSeq;if(!force&&R('e')>eventChance(m))return false;
 var actors=game.world.actors.filter(function(c){return c.region===p.region&&c.status==='active'}),crews=game.world.crews.filter(function(c){return c.region===p.region&&c.status==='active'}),availableFruits=!p.fruit&&!p.heldFruit?game.world.fruits.filter(function(n){return !game.world.fruitRegistry[n]||game.world.fruitRegistry[n].status==='available'}):[],hakiKeys=['Observation','Armement','Conquérant'].filter(function(k){return p.haki[k]>0||p.latent[k]>55}),activityKeys=activityGrowthKeys(p.activity).filter(function(k){var b=p.stats[k]!=null?p.stats:p.skills;return(b[k]||0)<(p.caps[k]||100)-.05});
 var items=[{id:'youth',weight:p.ageMonths<144?2.4:0},{id:'local',weight:p.ageMonths>=144?2.0:0},{id:'activity',weight:p.ageMonths>=72&&activityKeys.length?1.05:0},{id:'relation',weight:p.ageMonths>=72?1.0:0},{id:'danger',weight:p.ageMonths>=144?.55+(inf().danger||0)/70:0},{id:'meet',weight:actors.length?.75:0},{id:'crew',weight:p.ageMonths>=72&&crews.length?.55:0},{id:'life',weight:p.ageMonths>=180?.7:0},{id:'money',weight:p.ageMonths>=180?.5:0},{id:'haki',weight:p.ageMonths>=144&&hakiKeys.length?.14:0},{id:'fruit',weight:p.ageMonths>=144&&availableFruits.length?.055:0}].filter(function(x){return x.weight>0}),pick=weightedEventPick(items);if(!pick)return false;var x=pick.id;
 if(x==='youth'){var y=pk(['discovery','family','challenge','rumor'],'e');if(y==='family'){var yr=createRelation(p.ageMonths<72?'proche de la famille':null);tl('Vie quotidienne',yr.name+' prend une place plus importante dans ton entourage.')}else if(y==='challenge'){var yk=pk(p.ageMonths<72?['Endurance','Réflexes']:['Discipline','Réflexes'],'e'),yg=gain(yk,.18+.28*R('e'));tl('Petit défi','Une expérience de ton âge fait progresser '+yk+(yg>0?' de '+yg.toFixed(1):'')+'.')}else if(y==='rumor'){tl('Rumeurs du large','Des récits de pirates, de Marines et d’îles lointaines nourrissent peu à peu ta vision du monde.')}else{var dk=pk(['Réflexes','Discipline'],'e'),dg=gain(dk,.15+.25*R('e'));tl('Découverte locale','Une expérience nouvelle aiguise '+dk+(dg>0?' de '+dg.toFixed(1):'')+'.')}}
 else if(x==='activity'){var ak=pk(activityKeys,'e'),ag=gain(ak,.2+.35*R('e'));tl('Déclic dans ton activité',p.activity+' commence à porter ses fruits : '+ak+(ag>0?' +'+ag.toFixed(1):' se consolide')+'.')}
 else if(x==='relation'){var r=createRelation();tl('Nouvelle rencontre',r.name+' entre dans ta vie comme '+r.role+'.','major')}
 else if(x==='money'){var z=1000+Math.floor(R('e')*12000);p.money+=z;tl('Bonne affaire','Tu gagnes '+z.toLocaleString('fr-FR')+' B.')}
 else if(x==='danger')fight(inf().danger+10+R('e')*35,'Confrontation imprévue');
 else if(x==='meet'){var c=pk(actors,'e'),rel=bondCanonicalActor(c,'Vous vous recroisez dans '+p.region+'.');if(game.codex.people.indexOf(c.name)<0)game.codex.people.push(c.name);tl('Rencontre canonique','Tu croises '+c.name+' ('+c.faction+'). '+(rel.role==='rival'?'Une tension personnelle commence à s’installer.':rel.mentorPotential?'Son expérience pourrait un jour influencer ta progression.':'Il/elle fait désormais partie de ton réseau de relations.')+' Sa trajectoire actuelle : '+c.goal+'.','canon')}
 else if(x==='crew'){var cr=pk(crews,'e');tl('Équipage aperçu',cr.name+' est signalé dans '+p.region+' — puissance estimée '+Math.round(cr.power)+'.',diplomacy(p.faction,cr.faction)<-40?'danger':'')}
 else if(x==='local')runLocalEvent();
 else if(x==='life'){if(R('life')<.55){var expense=800+Math.round(R('life')*6500);p.money-=expense;tl('Dépense imprévue','Un imprévu te coûte '+expense.toLocaleString('fr-FR')+' B.')}else{var gainLife=1000+Math.round(R('life')*9000);p.money+=gainLife;tl('Petit coup de chance','Une opportunité te rapporte '+gainLife.toLocaleString('fr-FR')+' B.')}}
 else if(x==='haki'){var k=pk(hakiKeys,'h');if(p.haki[k]===0){p.haki[k]=1;syncPowers();tl('Éveil du Haki','Ton Haki de '+k+' s’éveille.','major')}else{trainHaki(k,.6);syncPowers();tl('Instinct affûté','Ton Haki de '+k+' progresse légèrement.')}}
 else if(x==='fruit'){var fr=pickFruit(availableFruits);decision('Un Fruit du démon','Tu découvres '+fr+'. Rien ne t’oblige à le consommer.',[['Le manger','Obtenir son pouvoir, mais perdre la capacité de nager.',function(){p.fruit=fr;p.fruitMastery=1;game.world.fruitRegistry[fr]={status:'consumed',holder:p.name};if(game.codex.fruits.indexOf(fr)<0)game.codex.fruits.push(fr);tl('Fruit du démon','Tu consommes le '+fr+'.','major')}],['Le conserver','Le garder pour plus tard.',function(){p.heldFruit=fr;game.world.fruitRegistry[fr]={status:'held',holder:p.name};tl('Fruit découvert','Tu conserves le '+fr+'.','major')}],['Le vendre','Transformer cette rareté en Berry.',function(){var val=40000+Math.round(R('fruit')*110000);p.money+=val;game.world.fruitRegistry[fr]={status:'sold',holder:null,marketMonths:0};tl('Vente exceptionnelle','Tu vends le '+fr+' pour '+val.toLocaleString('fr-FR')+' B.','major')}]])}
 return migrateLifeLoop(game).momentSeq>before||!!game.pending
}

function die(c){activeStories().slice().forEach(function(st){closeStory(st,'interrompu par la mort','La mort de '+game.player.name+' met fin à ce fil narratif.',true,'interrupted')});releasePlayerFruits();game.alive=false;game.death={cause:c};game.player.health=0;tl('Mort',c,'danger')}
function advance(){
 if(!game||!game.alive)return;if(game.pending)return showDecision();if(awaitingStory())return showStoryDecision();var p=game.player,j=migrateJustice(p),plan=advancePlan(),m=chooseAdvanceDuration(plan),before=captureAdvanceState(),loop=migrateLifeLoop(game);p.ageMonths+=m;world(m);p.conditions.forEach(function(c){c.months-=m});p.conditions=p.conditions.filter(function(c){return c.months>0});
 if(j.detained){lifeTick(m);influenceTick(m);if(!game.alive){finalizeAdvanceReport(before,m,plan);save();render();deathModal();return}prisonTick(m);storyTick(m);p.danger='Détenu';recordProgressSnapshot(false);finalizeAdvanceReport(before,m,plan);checkAchievements();save();render();return}
 p.health=cl(p.health+m*2,0,100);p.energy=cl(p.energy+m*4,0,100);careerTick(m);lifeTick(m);if(!game.alive){finalizeAdvanceReport(before,m,plan);save();render();deathModal();return}justiceTick(m);influenceTick(m);if(!game.alive){finalizeAdvanceReport(before,m,plan);save();render();deathModal();return}if(j.detained){storyTick(m);finalizeAdvanceReport(before,m,plan);save();render();return}
 if(p.travel){travel(m);storyTick(m)}
 else if(game.mission){game.mission.remaining-=m;train(m);if(game.mission.remaining<=0)resolveMission();storyTick(m)}
 else{train(m);explorationTick(m);storyTick(m);var alreadyMeaningful=loop.momentSeq>before.momentSeq,force=!alreadyMeaningful&&loop.quietAdvances>=2;if(!alreadyMeaningful||R('story')<.22)event(m,force)}
 if(!game.alive){finalizeAdvanceReport(before,m,plan);save();render();deathModal();return}if(p.ageMonths>=72&&p.situation==='Enfance'){p.situation='Formation';p.activity='Équilibre';tl('Formation','Tu commences une formation structurée.','major')}if(p.ageMonths>=180&&p.career==='Aucune'&&!game.pending&&!awaitingStory())career();p.danger=p.conditions.length?'Moyen':inf().danger>45?'Élevé':inf().danger>20?'Moyen':'Faible';recordProgressSnapshot(false);finalizeAdvanceReport(before,m,plan);checkAchievements();save();render()
}

function rep(){var r=game.player.reputation;return r>75?'Célèbre':r>40?'Reconnu':r>15?'Connu':'Inconnu'}
function slots(){var b=$('#saveSlots');b.innerHTML='';for(var i=1;i<=3;i++){(function(i){var s=load(i),x=document.createElement('button');x.className='save-slot'+(s?'':' empty');x.innerHTML=s?'<strong>'+e(s.player.name)+'</strong><small>'+Math.floor(s.player.ageMonths/12)+' ans • '+e(s.player.faction)+'<br>'+e(s.player.island)+'</small>':'<strong>＋ Nouvelle vie</strong><small>Emplacement '+i+'</small>';x.onclick=function(){slot=i;if(s){game=s;syncCanonicalFruits();render()}else $('#creationCard').classList.remove('hidden')};b.appendChild(x)})(i)}}
function bar(o){return Object.keys(o).map(function(k){var v=o[k];return '<div class="stat-row"><span>'+e(k)+'</span><div class="stat-bar"><div class="stat-fill" style="width:'+cl(v,0,100)+'%"></div></div><span class="stat-value">'+Math.round(v)+'</span></div>'}).join('')}

var activeTab='life';
var sectionState={character:'profile',abilities:'progress',relations:'close',world:'explore'};
var SECTION_UI={
 character:{nav:'characterSectionTabs',groups:[
  {id:'profile',label:'Profil',markers:['identityGrid','careerCard','careerProgressCard','specializationCard','factionStanding','ambitionCard']},
  {id:'career',label:'Carrière',markers:['specializationOptions','careerActions','missionBoard']},
  {id:'situation',label:'Situation',markers:['wantedPoster','publicStanding','crewSection','economySummary','achievementList','equipmentList','storageStatus']}
 ]},
 abilities:{nav:'abilitiesSectionTabs',groups:[
  {id:'progress',label:'Progresser',markers:['progressionSummary','activityOptions']},
  {id:'powers',label:'Pouvoirs',markers:['hakiList','fruitCard','hakiApplications','fruitMasteryCard']},
  {id:'details',label:'Détails',markers:['statsList','skillsList','techniqueList','combatStyleCard','combatReportSection']}
 ]},
 relations:{nav:'relationsSectionTabs',groups:[
  {id:'close',label:'Proches',markers:['socialSummary','romanceCard','familyList']},
  {id:'network',label:'Réseau',markers:['bondDynamicsSummary','npcNetworkSummary','relationsList']}
 ]},
 world:{nav:'worldSectionTabs',groups:[
  {id:'explore',label:'Explorer',markers:['worldHeadline','placeName','explorationSummary','journeySummary','travelOptions','regionMap']},
  {id:'world',label:'Monde',markers:['marketSummary','worldPulse','localActors','territoryList','domainSummary','conflictList','warOverview','autonomousCrews','diplomacyGrid','factionOverview','pressureBars']},
  {id:'history',label:'Histoire',markers:['worldNews','canonForecast','canonList','codexSummary','codexList']}
 ]}
};
function setupSectionNavigation(){
 Object.keys(SECTION_UI).forEach(function(name){var cfg=SECTION_UI[name],panel=$('#'+name+'Panel'),nav=$('#'+cfg.nav);if(!panel||!nav)return;
  cfg.groups.forEach(function(g){g.markers.forEach(function(id){var marker=$('#'+id);if(!marker||!marker.closest)return;var card=marker.closest('.paper-card');if(card&&card.parentElement===panel)card.dataset.uiGroup=g.id})});
  Array.prototype.forEach.call(panel.children,function(el){if(el.classList&&el.classList.contains('paper-card')&&!el.dataset.uiGroup)el.dataset.uiGroup=cfg.groups[0].id});
  nav.innerHTML=cfg.groups.map(function(g){return'<button class="section-tab '+(sectionState[name]===g.id?'active':'')+'" data-section-owner="'+name+'" data-section-target="'+g.id+'">'+e(g.label)+'</button>'}).join('');
  nav.querySelectorAll('.section-tab').forEach(function(b){b.onclick=function(){applySectionGroup(name,b.dataset.sectionTarget,true)}});
  applySectionGroup(name,sectionState[name]||cfg.groups[0].id,false)
 })
}
function applySectionGroup(name,group,scroll){
 var cfg=SECTION_UI[name],panel=$('#'+name+'Panel'),nav=cfg&&$('#'+cfg.nav);if(!cfg||!panel)return;sectionState[name]=group;
 Array.prototype.forEach.call(panel.children,function(el){if(el.classList&&el.classList.contains('paper-card'))el.classList.toggle('ui-section-hidden',!!el.dataset.uiGroup&&el.dataset.uiGroup!==group)});
 if(nav)nav.querySelectorAll('.section-tab').forEach(function(b){b.classList.toggle('active',b.dataset.sectionTarget===group)});
 if(scroll)scrollTo(0,0)
}
function renderPanel(name){
 if(!game)return;if(name==='life')renderTimeline();else if(name==='character')renderChar();else if(name==='abilities')renderAb();else if(name==='relations')renderRel();else if(name==='world')renderWorld();
 if(SECTION_UI[name])applySectionGroup(name,sectionState[name]||SECTION_UI[name].groups[0].id,false)
}
function activateTab(name,scroll){
 activeTab=name||'life';$$('.nav-item').forEach(function(x){x.classList.toggle('active',x.dataset.tab===activeTab)});$$('.tab-panel').forEach(function(x){x.classList.toggle('active',x.dataset.panel===activeTab)});renderPanel(activeTab);if(scroll!==false)scrollTo(0,0)
}
function renderDevOutput(){
 var panel=$('#developerPanel');if(!game||!panel||panel.classList.contains('hidden'))return;$('#devOutput').textContent=JSON.stringify({seed:game.seed,power:power(),player:game.player,world:game.world},null,2)
}

function showGame(){$('#startScreen').classList.remove('active');$('#gameScreen').classList.add('active');$('#bottomNav').classList.remove('hidden');$('#homeBtn').classList.remove('hidden')}
function showStart(){game=null;activeTab='life';$('#gameScreen').classList.remove('active');$('#startScreen').classList.add('active');$('#bottomNav').classList.add('hidden');$('#homeBtn').classList.add('hidden');slots()}
function renderTimeline(){var a=game.timeline.filter(function(x){return !majorOnly||['major','danger','canon'].indexOf(x.type)>=0});$('#timeline').innerHTML=a.slice(0,45).map(function(x){return '<div class="timeline-item '+e(x.type)+'"><span class="timeline-dot"></span><span class="timeline-age">'+e(x.age)+'</span><div class="timeline-title">'+e(x.title)+'</div><div class="timeline-desc">'+e(x.desc)+'</div></div>'}).join('')}
function renderJustice(){
 var p=game.player,j=migrateJustice(p),level=wantedLevel(),heat=currentHeat(),pressure=justicePressure(),bounty=p.bounty||0,badge=$('#wantedBadge');
 badge.textContent=level;badge.className='badge '+(level==='Aucun avis'?'wanted-clear':level==='Surveillé'||level==='Recherché'?'wanted-hot':'wanted-critical');
 $('#wantedPoster').innerHTML='<div class="wanted-kicker">'+(bounty>0?'WANTED • DEAD OR ALIVE':'SURVEILLANCE LOCALE')+'</div><div class="wanted-name">'+e(p.name)+'</div><div class="wanted-bounty">'+bounty.toLocaleString('fr-FR')+' B</div><div class="wanted-level">'+e(level)+' • record '+Math.round(p.highestBounty||0).toLocaleString('fr-FR')+' B</div>';
 $('#justiceSummary').innerHTML='<div><span>Chaleur '+e(p.region)+'</span><strong>'+Math.round(heat)+'%</strong><div class="heat-meter"><div style="width:'+cl(heat,0,100)+'%"></div></div></div><div><span>Pression des autorités</span><strong>'+Math.round(pressure)+'%</strong><div class="heat-meter"><div style="width:'+cl(pressure,0,100)+'%"></div></div></div><div><span>Captures effectuées</span><strong>'+j.captures+'</strong></div><div><span>Primes encaissées</span><strong>'+Math.round(j.bountiesClaimed).toLocaleString('fr-FR')+' B</strong></div>';
 var actions='';if(!j.detained){if(heat>2||bounty>0)actions+='<button id="layLowBtn" class="action-card"><strong>Se faire oublier</strong><small>Réduire la chaleur locale. Coûte jusqu’à 1 200 B.</small></button>';if(bounty>0||heat>=18)actions+='<button id="surrenderBtn" class="action-card career-action-warning"><strong>Se rendre</strong><small>Accepter une détention réduite plutôt que risquer une capture violente.</small></button>';if(!actions)actions='<div class="career-card"><p class="justice-note">Aucune recherche active importante. Les crimes observés, les attaques contre les autorités et certaines missions peuvent changer cela.</p></div>'}
 $('#justiceActions').innerHTML=actions;var lb=$('#layLowBtn');if(lb)lb.onclick=layLow;var sb=$('#surrenderBtn');if(sb)sb.onclick=surrenderPlayer;
 $('#prisonSection').classList.toggle('hidden',!j.detained);if(j.detained&&j.prison){var pr=j.prison;$('#prisonTitle').textContent='Détention à '+pr.location;$('#prisonBadge').textContent=pr.remaining.toFixed(1)+' mois';$('#prisonCard').innerHTML='<div class="prison-state"><strong>'+e(pr.reason)+'</strong><span>Sécurité '+Math.round(pr.security)+'/100 • '+pr.attempts+' tentative(s) d’évasion • avance le temps pour purger la peine.</span></div>';$('#prisonActions').innerHTML='<button id="escapeBtn" class="action-card career-action-warning"><strong>Tenter une évasion</strong><small>Discrétion, agilité, réflexes et puissance contre la sécurité de la prison.</small></button>';$('#escapeBtn').onclick=attemptEscape}
 $('#bountyHunterSection').classList.toggle('hidden',p.faction!=='Chasseur de primes'||j.detained);if(p.faction==='Chasseur de primes'&&!j.detained){var targets=bountyTargets();$('#bountyHunterBadge').textContent=targets.length+' cible'+(targets.length>1?'s':'');$('#bountyTargets').innerHTML=targets.length?targets.map(function(t){return '<div class="bounty-target"><strong>'+e(t.name)+'</strong><span>'+e(t.region)+' • puissance '+Math.round(t.power)+' • '+t.members+' membres</span><small>Prime : '+Math.round(t.bounty).toLocaleString('fr-FR')+' B</small><button data-bounty-target="'+e(t.id)+'">Lancer la traque</button></div>'}).join(''):'<p class="justice-note">Aucune cible pirate active dans cette région. Change de région ou laisse le monde évoluer.</p>';$$('[data-bounty-target]').forEach(function(b){b.onclick=function(){huntBountyTarget(b.dataset.bountyTarget)}})}
 $('#crimeHistory').innerHTML=j.crimes.length?j.crimes.slice(0,8).map(function(c){return '<div class="crime-row"><strong>'+e(c.name)+'</strong><span>'+e(c.place)+' • '+e(c.region)+' • gravité '+c.severity+' • '+(c.witnessed?'attribué':'non attribué')+' • année '+c.year+', mois '+(c.month+1)+'</span></div>'}).join(''):'<p class="justice-note">Dossier vierge. Pour le moment.</p>'
}

function renderChar(){var p=game.player,rec=careerRecord(),cfg=CAREERS[p.faction]||CAREERS.Civil,repv=p.factionRep[p.faction]||0,next=nextRank(),ri=rankIndex(),sal=salaryPerMonth();
 $('#identityGrid').innerHTML=[['Nom',p.name],['Origine',p.origin],['Race',p.race],['Lieu',p.island],['Faction',cfg.label],['Réputation',rep()]].map(function(x){return '<div class="info-cell"><span>'+e(x[0])+'</span><strong>'+e(x[1])+'</strong></div>'}).join('');
 $('#careerStandingBadge').textContent=standingLabel(repv);$('#careerCard').innerHTML='<strong>'+e(cfg.label)+' • '+e(p.rank)+'</strong><p>'+(p.specialization?'Spécialisation : '+e(p.specialization)+' • ':'')+'Ancienneté : '+Math.floor(rec.months)+' mois • Missions : '+rec.successes+' réussies / '+rec.failures+' échouées</p>'+(sal?'<span class="salary-chip">'+sal.toLocaleString('fr-FR')+' B / mois</span>':'<span class="salary-chip">Revenus à la mission</span>');
 if(next){var xpPct=cl(rec.xp/next.xp*100,0,100),qual=careerQualification(),expertise=careerExpertise(),reqs=[['XP '+Math.round(rec.xp)+' / '+next.xp,rec.xp>=next.xp],['Réputation '+Math.round(repv)+' / '+next.rep,repv>=next.rep],[careerRequirementLabel()+' '+Math.round(qual)+' / '+next.pow,qual>=next.pow],['Expertise '+Math.round(expertise),true]];$('#careerProgressCard').innerHTML='<div class="career-progress-head"><strong>Prochain rang : '+e(next.n)+'</strong><span>'+Math.round(xpPct)+'%</span></div><div class="career-progress-bar"><div style="width:'+xpPct+'%"></div></div><div class="career-reqs">'+reqs.map(function(r){return '<span class="'+(r[1]?'met':'unmet')+'">'+e(r[0])+'</span>'}).join('')+'</div>'}else $('#careerProgressCard').innerHTML='<div class="career-progress-head"><strong>Rang maximal automatique atteint</strong><span>Les postes supérieurs dépendent d’événements du monde.</span></div>';
 $('#specializationBadge').textContent=p.specialization||'À choisir';$('#specializationCard').innerHTML=p.specialization?'<strong>'+e(p.specialization)+'</strong><p>Cette spécialisation influence tes missions et ta progression secondaire.</p>':'<strong>Aucune spécialisation</strong><p>Choisir un rôle ouvre des missions spécifiques. Une réorientation ultérieure coûte 10% d’XP carrière.</p>';
 $('#specializationOptions').innerHTML='<button id="specializationChoiceBtn" class="action-card"><strong>'+(p.specialization?'Changer de spécialisation':'Choisir une spécialisation')+'</strong><small>'+(p.specialization?'Rôle actuel : '+e(p.specialization):'Le moteur adaptera ensuite entraînement et missions.')+'</small></button>';$('#specializationChoiceBtn').onclick=specializationDecision;
 $('#factionStanding').innerHTML=FACTION_KEYS.map(function(f){var v=p.factionRep[f]||0,pos=cl((v+100)/2,0,100);return '<div class="standing-row"><div class="standing-head"><strong>'+e(CAREERS[f]?CAREERS[f].label:f)+'</strong><span>'+standingLabel(v)+' • '+Math.round(v)+'</span></div><div class="standing-meter"><div class="standing-marker" style="left:'+pos+'%"></div></div></div>'}).join('');renderJustice();renderInfluence();
 $('#careerActions').innerHTML='<button id="changeCareerBtn" class="action-card career-action-warning"><strong>Changer de voie</strong><small>Quitter ta faction peut avoir des conséquences durables.</small></button><button id="careerRecordBtn" class="action-card"><strong>Dossier de carrière</strong><small>'+p.careerHistory.length+' changement(s) de voie • '+Math.round(p.salaryTotal).toLocaleString('fr-FR')+' B de salaire cumulés</small></button>';$('#changeCareerBtn').onclick=careerChangeDecision;$('#careerRecordBtn').onclick=function(){toast('XP carrière : '+Math.round(rec.xp)+' • ancienneté : '+Math.floor(rec.months)+' mois')};
 $('#ambitionCard').innerHTML='<strong>'+e(p.ambition)+'</strong><p>Cette priorité guide les recommandations automatiques.</p>';$('#ambitionOptions').innerHTML='<button id="ambitionChoiceBtn" class="action-card"><strong>Changer d’ambition</strong><small>Une seule décision au lieu de cinq boutons permanents.</small></button>';$('#ambitionChoiceBtn').onclick=ambitionDecision;
 $('#missionBoard').innerHTML=game.mission?'<div class="mission-card active-mission"><strong>'+e(game.mission.title)+'</strong><p>'+game.mission.remaining.toFixed(1)+' mois restants • '+e(missionProfile(game.mission).config.label)+' • '+game.mission.xp+' XP carrière</p></div>':board().map(function(m){return '<button class="mission-card '+(m.recommended?'recommended':'')+'" data-m="'+m.id+'"><strong>'+e(m.title)+(m.recommended?' · recommandée':'')+'</strong><p>'+e(m.approach)+' • '+Math.round(m.chance*100)+'% • '+e(missionRiskLabel(m))+' • '+m.reward.toLocaleString('fr-FR')+' B</p></button>'}).join('');$$('[data-m]').forEach(function(b){b.onclick=function(){startMission(+b.dataset.m)}});
 renderActivityOptions();
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
  var currentSupplyCost=marketPrice(p.island,'provisions',true)*5;actions+='<button id="orgFundBtn" class="action-card"><strong>Verser 10 000 B</strong><small>Alimenter la caisse commune.</small></button><button id="orgSupplyBtn" class="action-card"><strong>Ravitaillement</strong><small>Environ '+currentSupplyCost.toLocaleString('fr-FR')+' B selon le marché local.</small></button>';
  if(org.ship)actions+='<button id="orgRepairBtn" class="action-card"><strong>Réparer le navire</strong><small>Le coût dépend de son état.</small></button>'+(auth==='leader'&&SHIP_TIERS[(org.ship.tier||0)+1]?'<button id="orgUpgradeBtn" class="action-card org-leader"><strong>Améliorer le navire</strong><small>'+SHIP_TIERS[(org.ship.tier||0)+1].name+' • '+SHIP_TIERS[(org.ship.tier||0)+1].cost.toLocaleString('fr-FR')+' B</small></button>':'');
  $('#organizationActions').innerHTML=actions;$('#orgBondBtn').onclick=supportOrganization;var ob=$('#orgRecruitBtn');if(ob)ob.onclick=recruitOrganizationMember;var ot=$('#orgTrainBtn');if(ot)ot.onclick=trainOrganization;$('#orgFundBtn').onclick=fundOrganization;$('#orgSupplyBtn').onclick=buyOrganizationSupplies;var orp=$('#orgRepairBtn');if(orp)orp.onclick=repairOrganizationShip;var ou=$('#orgUpgradeBtn');if(ou)ou.onclick=upgradeOrganizationShip;
  $$('[data-org-role]').forEach(function(b){b.onclick=function(){assignOrganizationRole(b.dataset.orgRole)}});$$('[data-org-dismiss]').forEach(function(b){b.onclick=function(){dismissOrganizationMember(b.dataset.orgDismiss)}})
 }
 var nw=netWorth(),h=HOUSING[p.life.housingLevel||0]||HOUSING[0],assets=p.life.assets||{};
 $('#netWorthBadge').textContent=nw.toLocaleString('fr-FR')+' B';
 $('#economySummary').innerHTML='<div><span>Liquidités</span><strong>'+Math.round(p.money).toLocaleString('fr-FR')+' B</strong></div><div><span>Dette</span><strong class="'+((p.life.debt||0)>0?'debt':'')+'">'+Math.round(p.life.debt||0).toLocaleString('fr-FR')+' B</strong></div><div><span>Patrimoine net</span><strong class="'+(nw>=1000000?'wealth':'')+'">'+nw.toLocaleString('fr-FR')+' B</strong></div><div><span>Coût mensuel</span><strong>'+livingCostPerMonth().toLocaleString('fr-FR')+' B</strong></div><div><span>Revenu activité</span><strong>'+businessIncomePerMonth().toLocaleString('fr-FR')+' B/mois</strong></div>';
 $('#housingCard').innerHTML='<strong>'+e(h.name)+'</strong><p>Immobilier : '+Math.round(assets.property||0).toLocaleString('fr-FR')+' B • activité : '+Math.round(assets.business||0).toLocaleString('fr-FR')+' B • trésor : '+Math.round(assets.treasure||0).toLocaleString('fr-FR')+' B</p><div class="mastery-meter"><div style="width:'+((p.life.housingLevel||0)/(HOUSING.length-1)*100)+'%"></div></div>';
 var nextHousing=HOUSING[(p.life.housingLevel||0)+1];$('#economyActions').innerHTML=(nextHousing?'<button id="upgradeHousingBtn" class="action-card"><strong>Améliorer le logement</strong><small>'+nextHousing.name+' • '+nextHousing.buy.toLocaleString('fr-FR')+' B</small></button>':'')+'<button id="investBusinessBtn" class="action-card"><strong>Investir</strong><small>50 000 B → activité productive.</small></button>';
 var uh=$('#upgradeHousingBtn');if(uh)uh.onclick=upgradeHousing;var ib=$('#investBusinessBtn');if(ib)ib.onclick=investBusiness;renderCargo();
 var unlocked=game.achievements&&game.achievements.unlocked?game.achievements.unlocked:{};$('#achievementBadge').textContent=Object.keys(unlocked).length+'/'+ACHIEVEMENTS.length;
 $('#achievementList').innerHTML=ACHIEVEMENTS.map(function(a){var u=unlocked[a.id];return '<div class="achievement-card '+(u?'unlocked':'locked')+'"><strong>'+(u?'✓ ':'○ ')+e(a.name)+'</strong><span>'+e(a.desc)+(u?' • '+e(u.age||''):'')+'</span></div>'}).join('');
 $('#equipmentList').innerHTML=['Tenue de voyage',p.style,p.fruit||'Aucun Fruit'].map(function(x){return '<span class="chip">'+e(x)+'</span>'}).join('');$('#storageStatus').textContent='Autosave local'
}
function specialReqText(t){var q=t.requires||{},a=[];if(q.faction)a.push(q.faction);if(q.race)a.push(q.race);if(q.style)a.push(q.style);if(q.skill)a.push(q.skill+' '+q.skillValue);if(q.stat)a.push(q.stat+' '+q.statValue);return a.join(' • ')}
function renderActivityOptions(){
 var p=game.player;normalizeActivityFocus(p);var acts=focusOptions(),recommended=recommendedFocus();
 $('#activityOptions').innerHTML=acts.map(function(a){var keys=activityGrowthKeys(a),detail=a==='Pouvoirs'?'Haki • Fruit • Volonté':keys.join(' • ');return '<button class="action-card '+(p.activity===a?'active ':'')+(recommended===a?'recommended':'')+'" data-act="'+e(a)+'"><strong>'+e(a)+(recommended===a?' · recommandé':'')+'</strong><small>'+e(activityFocusText(a))+'<br>'+e(detail)+'</small></button>'}).join('');
 $$('[data-act]').forEach(function(b){b.onclick=function(){p.activity=b.dataset.act;save();renderAb()}})
}
function activityFocusText(a){if(SIMPLE_FOCUS[a])return SIMPLE_FOCUS[a].desc;if(a==='Grandir')return'Développement naturel pendant la petite enfance.';if(a==='Explorer')return'Exploration locale et progression de Navigation.';var profile=TRAINING_PROFILES[a];return profile?profile.desc:'Le moteur adapte automatiquement la progression.'}

function progressionBar(o){
 var p=game.player;return Object.keys(o).map(function(k){var v=o[k],cap=p.caps[k]||100,pct=cl(v/Math.max(1,cap)*100,0,100),status=currentCapStatus(k);return '<div class="stat-row progression-stat"><span>'+e(k)+'</span><div><div class="stat-bar"><div class="stat-fill" style="width:'+pct+'%"></div></div><small>'+e(status)+'</small></div><span class="stat-value">'+Math.round(v)+'/'+Math.round(cap)+'</span></div>'}).join('')
}
function renderProgressionOverview(){
 var p=game.player,pr=migrateProgression(game,p),d=progressionDelta(),gains=Object.entries(pr.gains||{}).sort(function(a,b){return b[1]-a[1]}).slice(0,3),atCap=ST.concat(SK).filter(function(k){return currentCapStatus(k)==='Plafond actuel'}),recent=pr.breakthroughs.length?pr.breakthroughs[pr.breakthroughs.length-1]:null,trend=d.power>1.5?'Forte hausse':d.power>.35?'En hausse':d.power<-.2?'En baisse':'Stable';
 $('#progressionTrendBadge').textContent=trend;$('#progressionSummary').innerHTML='<div><span>Puissance</span><strong>'+Math.round(power())+'</strong></div><div><span>Rang</span><strong>'+e(powerRank())+'</strong></div><div><span>Variation récente</span><strong>'+(d.power>=0?'+':'')+d.power.toFixed(1)+'</strong></div><div><span>Plafonds atteints</span><strong>'+atCap.length+'</strong></div>';
 $('#progressionFocus').innerHTML='<strong>Progression dominante</strong><p>'+(gains.length?gains.map(function(x){return e(x[0])+' +'+x[1].toFixed(1)}).join(' • '):'Commence à avancer dans le temps pour établir une tendance.')+'</p>'+(recent?'<small>Dernière percée : '+e(recent.key)+' '+Math.round(recent.from)+' → '+Math.round(recent.to)+' • '+e(recent.context)+'</small>':'<small>Les plafonds extraordinaires restent cachés. Mentorat et combats extrêmes peuvent parfois repousser une limite.</small>')
}
function renderAb(){var p=game.player,fm=p.fruit?fruitMeta(p.fruit):p.heldFruit?fruitMeta(p.heldFruit):null;renderProgressionOverview();renderActivityOptions();$('#powerEstimate').textContent='Puissance ~'+Math.round(power())+' • '+powerRank();$('#statsList').innerHTML=progressionBar(p.stats);$('#skillsList').innerHTML=progressionBar(p.skills);$('#hakiList').innerHTML=Object.keys(p.haki).map(function(k){return '<div class="ability-row"><strong>'+e(k)+'</strong><span>'+(p.haki[k]?'Niveau '+Math.round(p.haki[k]):'Non éveillé')+'</span></div>'}).join('');
 $('#fruitCard').innerHTML=p.fruit?'<strong>'+e(p.fruit)+'</strong><small>'+e(fm.type)+' • rareté '+fm.rarity+'/100</small><div class="mastery-meter"><div style="width:'+p.fruitMastery+'%"></div></div><span>Maîtrise '+Math.round(p.fruitMastery)+'%</span>':p.heldFruit?'<strong>'+e(p.heldFruit)+'</strong><small>'+e(fm.type)+' • rareté '+fm.rarity+'/100</small><p>Fruit conservé, non consommé.</p>':'Aucun Fruit consommé.';
 var prof=TECH[p.style]||TECH['Équilibré'],special=SPECIAL_TECHNIQUES.filter(function(t){var q=t.requires||{},known=p.techniques.indexOf(t.id)>=0;return known||(!q.race||q.race===p.race)&&(!q.style||q.style===p.style)&&(!q.faction||q.faction===p.faction)});$('#techniqueCount').textContent=(p.techniques||[]).length+' maîtrisées';
 var baseCards=prof.map(function(t){var ok=p.techniques.indexOf(t.id)>=0,m=p.techniqueMastery[t.id]||0;return '<div class="technique-card '+(ok?'':'locked')+'"><strong>'+e(t.name)+'</strong><span>'+(ok?'Maîtrise '+Math.round(m)+'%':'Requiert '+e(t.skill)+' '+t.req)+'</span><small>Bonus actuel +'+techniqueEffectiveBonus(t.id).toFixed(1)+' • max +'+t.bonus+'</small></div>'}).join('');
 var specialCards=special.map(function(t){var ok=p.techniques.indexOf(t.id)>=0,m=p.techniqueMastery[t.id]||0;return '<div class="technique-card '+(ok?'':'locked')+'"><strong>'+e(t.name)+' <em>'+e(t.group||'Spécial')+'</em></strong><span>'+(ok?'Maîtrise '+Math.round(m)+'%':'Requiert '+e(specialReqText(t)))+'</span><small>Technique spéciale • bonus actuel +'+techniqueEffectiveBonus(t.id).toFixed(1)+' • max +'+t.bonus+'</small></div>'}).join('');
 $('#techniqueList').innerHTML=baseCards+specialCards+(p.fruit&&p.fruitMastery>=20?'<div class="technique-card"><strong>Application du '+e(p.fruit)+'</strong><span>Maîtrise '+Math.round(p.fruitMastery)+'%</span><small>'+(p.fruitAwakened?'Éveil acquis':'Le pouvoir évolue avec la pratique réelle.')+'</small></div>':'');
 $('#hakiApplications').innerHTML=Object.keys(p.hakiApplications).map(function(k){var a=p.hakiApplications[k];return '<div class="haki-app"><strong>'+e(k)+'</strong><small>'+(a.length?e(a.join(' • ')):'Aucune application connue')+'</small></div>'}).join('');
 $('#fruitMasteryCard').innerHTML=p.fruit?'<strong>'+e(p.fruit)+'</strong><p>'+e(fm.type)+' • rareté '+fm.rarity+'/100</p><div class="mastery-meter"><div style="width:'+p.fruitMastery+'%"></div></div><p>'+Math.round(p.fruitMastery)+'% de maîtrise'+(p.fruitAwakened?' • ÉVEIL':'')+'.</p>':p.heldFruit?'<strong>'+e(p.heldFruit)+'</strong><p>'+e(fm.type)+' • tu le conserves sans l’avoir mangé.</p><button id="eatHeldFruit" class="primary-btn small">Le consommer</button>':'<strong>Aucun pouvoir</strong><p>Les Fruits existent physiquement dans le monde et leur rareté influence réellement la probabilité de découverte.</p>';
 var eat=$('#eatHeldFruit');if(eat)eat.onclick=function(){var fr=p.heldFruit;p.heldFruit=null;p.fruit=fr;p.fruitMastery=1;game.world.fruitRegistry[fr]={status:'consumed',holder:p.name};if(game.codex.fruits.indexOf(fr)<0)game.codex.fruits.push(fr);tl('Fruit du démon','Tu décides finalement de consommer le '+fr+'.','major');save();renderAb()};
 $('#combatStyleCard').innerHTML='<strong>'+e(p.style)+'</strong><p>Maîtrise du style '+Math.round(styleMastery())+' • Combat '+Math.round(p.skills.Combat)+' • Sabre '+Math.round(p.skills.Sabre)+' • Tir '+Math.round(p.skills.Tir)+'</p><span class="power-rank">'+powerRank()+'</span>';$('#combatActions').innerHTML='<button id="challengeBtn" class="action-card"><strong>Défi local</strong><small>Affronter un adversaire cohérent avec la zone actuelle.</small></button><button id="martialTrainBtn" class="action-card"><strong>Priorité combat</strong><small>Passer l’activité principale à Entraînement.</small></button>';$('#challengeBtn').onclick=challengeFight;$('#martialTrainBtn').onclick=function(){p.activity='Entraînement';save();renderAb();toast('Activité : Entraînement')};
 if(game.lastCombat){$('#combatReportSection').classList.remove('hidden');var c=game.lastCombat,o=$('#combatOutcome');o.textContent=c.outcome;o.className='badge '+(c.outcome.indexOf('Victoire')>=0?'outcome-win':'outcome-loss');$('#combatReport').innerHTML='<div><span>Puissance</span><strong>'+c.playerPower+' vs '+c.opponentPower+'</strong></div><div><span>Styles</span><strong>'+e(c.playerStyle)+' vs '+e(c.opponentStyle)+'</strong></div><div><span>Terrain</span><strong>'+e(c.terrain)+'</strong></div><div><span>Chance estimée</span><strong>'+c.chance+'%</strong></div><div class="combat-log">'+e(c.log)+'</div>'}else $('#combatReportSection').classList.add('hidden')}
function renderRel(){
 var p=game.player,l=p.life,partner=partnerRelation(),kids=p.children||[],active=game.relations.filter(function(r){return r.status==='active'}),rivals=active.filter(function(r){return r.role==='rival'}),mentors=active.filter(function(r){return r.role==='mentor'}),canonBonds=active.filter(function(r){return r.canonical}),nearby=active.filter(function(r){return npcNearby(r)});
 $('#socialStatusBadge').textContent=l.relationshipStatus;$('#socialSummary').innerHTML='<div><span>Relations</span><strong>'+active.length+'</strong></div><div><span>Statut</span><strong>'+e(l.relationshipStatus)+'</strong></div><div><span>Enfants</span><strong>'+kids.length+'</strong></div><div><span>Génération</span><strong>'+game.dynasty.generation+'</strong></div>';
 $('#romanceBadge').textContent=partner?Math.round((partner.affection+partner.trust+partner.loyalty)/3)+'%':'Célibataire';
 if(partner){$('#romanceCard').innerHTML='<strong>'+e(partner.name)+' • '+e(l.relationshipStatus)+'</strong><p class="romance-state">Affection '+Math.round(partner.affection)+' • confiance '+Math.round(partner.trust)+' • loyauté '+Math.round(partner.loyalty)+' • '+Math.floor(partner.relationshipMonths)+' mois ensemble.</p>';$('#romanceActions').innerHTML='<button id="partnerTimeBtn" class="action-card"><strong>Passer du temps ensemble</strong><small>Renforcer le lien.</small></button>'+(l.relationshipStatus==='En couple'?'<button id="marryBtn" class="action-card"><strong>Se marier</strong><small>Requiert une relation solide depuis au moins un an.</small></button>':'')+'<button id="breakupBtn" class="action-card career-action-warning"><strong>Se séparer</strong><small>Mettre fin à la relation.</small></button>';$('#partnerTimeBtn').onclick=function(){spendTime(partner.id)};var mb=$('#marryBtn');if(mb)mb.onclick=marryPartner;$('#breakupBtn').onclick=breakup}
 else{$('#romanceCard').innerHTML='<strong>Célibataire</strong><p class="romance-state">Une relation peut émerger depuis les personnes que tu rencontres. L’attirance ne garantit jamais la réciprocité.</p>';$('#romanceActions').innerHTML='<div class="career-card"><p>Renforce d’abord une relation ci-dessous avant de tenter une approche romantique.</p></div>'}
 $('#familyBadge').textContent=kids.length+' enfant'+(kids.length>1?'s':'');$('#familyList').innerHTML=kids.length?kids.map(function(c,i){return '<div class="family-card '+(i===0?'heir-highlight':'')+'"><strong>'+e(c.name)+(i===0?' • héritier prioritaire':'')+'</strong><span>'+Math.floor(c.ageMonths/12)+' ans '+Math.floor(c.ageMonths%12)+' mois</span><small>Né à '+e(c.birthplace)+' • lien '+Math.round(c.bond||60)+'/100</small></div>'}).join(''):'<p class="helper-text">Aucun enfant pour le moment.</p>';
 $('#familyActions').innerHTML=partner&&p.ageMonths>=216?'<button id="welcomeChildBtn" class="action-card"><strong>Accueillir un enfant</strong><small>Agrandir la famille si la relation est suffisamment stable.</small></button>':'<div class="career-card"><p>Une famille peut se construire à l’âge adulte dans une relation stable.</p></div>';var wc=$('#welcomeChildBtn');if(wc)wc.onclick=welcomeChild;
 $('#bondDynamicsBadge').textContent=(rivals.length+mentors.length)+' lien'+(rivals.length+mentors.length>1?'s':'');$('#bondDynamicsSummary').innerHTML='<div><span>Mentors</span><strong>'+mentors.length+'</strong></div><div><span>Rivaux</span><strong>'+rivals.length+'</strong></div><div><span>Liens canoniques</span><strong>'+canonBonds.length+'</strong></div><div><span>Présents dans ta région</span><strong>'+nearby.length+'</strong></div>';
 $('#bondDynamicsList').innerHTML=mentors.concat(rivals).length?mentors.concat(rivals).map(function(r){var pow=Math.round(relationPower(r)),last=r.memories&&r.memories.length?r.memories[0].text:'Aucun souvenir majeur récent.',cls=r.role==='rival'?'rival':'mentor';return '<div class="npc-dynamic-card '+cls+'"><div class="npc-dynamic-head"><strong>'+e(r.name)+'</strong><span>'+e(r.role)+'</span></div><div class="npc-dynamic-meta">'+e(npcCareerRank(r))+' • puissance '+pow+' • '+e(npcRegion(r))+' • '+e(r.npcTrajectory)+(r.canonical?' • canonique':'')+(r.peerRecognized?' • pair reconnu':'')+(r.role==='rival'?' • '+e(rivalStage(r)):'')+'</div><div class="npc-power-meter"><div style="width:'+cl(pow,0,100)+'%"></div></div><div class="npc-memory">'+e(last)+'</div><div class="npc-actions">'+(r.role==='mentor'&&npcNearby(r)?'<button data-mentor-train="'+e(r.id)+'">S’entraîner</button>':'')+(r.role==='rival'&&npcNearby(r)&&p.ageMonths>=144&&r.npcAgeMonths>=144?'<button class="rival-action" data-rival-duel="'+e(r.id)+'">Duel</button>'+(((r.rivalWins||0)+(r.rivalLosses||0))>=3?'<button data-rival-reconcile="'+e(r.id)+'">Apaiser</button>':''):'')+'</div></div>'}).join(''):'<p class="helper-text">Aucune rivalité ou relation de mentorat importante pour le moment.</p>';
 $('#npcNetworkBadge').textContent=nearby.length+' proche'+(nearby.length>1?'s':'');$('#npcNetworkSummary').innerHTML='<div><span>Relations actives</span><strong>'+active.length+'</strong></div><div><span>Canoniques connues</span><strong>'+canonBonds.length+'</strong></div><div><span>Recrutées</span><strong>'+active.filter(function(r){return r.joinedOrganization}).length+'</strong></div><div><span>Souvenirs enregistrés</span><strong>'+active.reduce(function(a,r){return a+(r.memories?r.memories.length:0)},0)+'</strong></div>';
 var opp='<button id="seekMentorBtn" class="action-card"><strong>Chercher un mentor</strong><small>Identifier une personne plus expérimentée dans ta région.</small></button>';$('#npcOpportunities').innerHTML=opp;$('#seekMentorBtn').onclick=seekMentor;
 $('#relationCountBadge').textContent=active.length+' actives';$('#relationsList').innerHTML=active.length?active.map(function(r){var isPartner=r.id===l.partnerId,pow=Math.round(relationPower(r)),near=npcNearby(r),tags=(r.canonical?'<span class="npc-tag canon">Canon</span>':'')+(r.role==='mentor'?'<span class="npc-tag mentor">Mentor</span>':'')+(r.role==='rival'?'<span class="npc-tag rival">Rival</span>':'');var actions=near?'<button data-time="'+e(r.id)+'">Passer du temps</button>':'';if(!partner&&p.ageMonths>=216&&r.npcAgeMonths>=216&&r.attraction>=25&&!r.canonical)actions+='<button data-romance="'+e(r.id)+'">Approche romantique</button>';if(near&&r.role!=='mentor'&&relationPower(r)>power()+8)actions+='<button data-ask-mentor="'+e(r.id)+'">Mentorat</button>';if(near&&r.role!=='rival'&&r.role!=='mentor'&&!isPartner)actions+='<button data-declare-rival="'+e(r.id)+'">Rivalité</button>';if(near&&r.trust>=48)actions+='<button data-ask-favor="'+e(r.id)+'">Demander un service</button>';if(near)actions+='<button data-help-rel="'+e(r.id)+'">Aider</button>';if(near&&r.npcAgeMonths>=180&&!r.canonical&&!r.joinedOrganization&&p.organization&&p.organization.authority==='leader')actions+='<button data-recruit-rel="'+e(r.id)+'">Recruter</button>';return '<div class="relation-card"><div class="relation-avatar">'+e(r.name[0])+'</div><div class="relation-copy"><strong>'+e(r.name)+(isPartner?' ♥':'')+'</strong><span>'+e(r.role)+' • '+e(r.faction)+'</span>'+tags+'<div class="npc-state-line">'+e(npcCareerRank(r))+' • puissance '+pow+' • '+e(npcRegion(r))+' • '+(near?'dans ta région':'éloigné')+' • '+e(favorLabel(r))+'</div><div class="relation-metrics"><span>Aff '+Math.round(r.affection)+'</span><span>Conf '+Math.round(r.trust)+'</span><span>Resp '+Math.round(r.respect)+'</span><span>Loy '+Math.round(r.loyalty)+'</span><span>Riv '+Math.round(r.rivalry)+'</span></div><div class="relation-actions-mini">'+actions+'</div></div></div>'}).join(''):'<p class="helper-text">Aucune relation importante.</p>';
 $$('[data-time]').forEach(function(b){b.onclick=function(){spendTime(b.dataset.time)}});$$('[data-romance]').forEach(function(b){b.onclick=function(){pursueRomance(b.dataset.romance)}});$$('[data-mentor-train]').forEach(function(b){b.onclick=function(){trainWithMentor(b.dataset.mentorTrain)}});$$('[data-rival-duel]').forEach(function(b){b.onclick=function(){challengeRival(b.dataset.rivalDuel)}});$$('[data-rival-reconcile]').forEach(function(b){b.onclick=function(){reconcileRival(b.dataset.rivalReconcile)}});$$('[data-ask-mentor]').forEach(function(b){b.onclick=function(){askMentorship(b.dataset.askMentor)}});$$('[data-declare-rival]').forEach(function(b){b.onclick=function(){declareRivalry(b.dataset.declareRival)}});$$('[data-recruit-rel]').forEach(function(b){b.onclick=function(){recruitKnownRelation(b.dataset.recruitRel)}});$$('[data-ask-favor]').forEach(function(b){b.onclick=function(){askRelationFavor(b.dataset.askFavor)}});$$('[data-help-rel]').forEach(function(b){b.onclick=function(){helpRelation(b.dataset.helpRel)}})
}
function diplomacyLabel(v){return v>=60?'Alliance':v>=25?'Coopération':v>-25?'Neutre':v>-60?'Tension':'Hostilité'}
function renderWorld(){var p=game.player,w=game.world,q=inf(),rp=w.pressures[p.region],terr=w.territories[p.island]||{controller:'Inconnu',influence:0,stability:0,contested:false};
 $('#worldHeadline').textContent='Grande Ère de la Piraterie';$('#worldSubhead').textContent='Année '+w.year+', mois '+(Math.floor(w.month)+1)+'. La V2.2 relie désormais progression, spécialisations, missions, carrière, justice et organisations en fils narratifs persistants.';
 $('#worldMeta').innerHTML='<span>Divergence '+Math.round(w.divergence)+'%</span><span>Tension '+Math.round(w.globalTension)+'%</span><span>'+p.visited.length+' lieux visités</span>';
 $('#placeName').textContent=p.travel?'En mer → '+p.travel.destination:p.island;$('#placeDanger').textContent='Danger '+q.danger;
 var placeProfile=islandProfile(p.island);$('#placeDescription').textContent=p.travel?'Temps restant : '+Math.max(0,p.travel.remaining).toFixed(1)+' mois vers '+p.travel.destination+'.':'Région : '+p.region+' • contrôle : '+terr.controller+' • stabilité '+Math.round(terr.stability)+'%. '+placeProfile.identity;
 $('#placeTags').innerHTML='<span class="chip">'+e(p.region)+'</span><span class="chip">'+e(terr.controller)+'</span>'+placeProfile.tags.map(function(tg){return'<span class="chip">'+e(tg)+'</span>'}).join('')+(terr.contested?'<span class="chip">Contesté</span>':'');
 $('#travelStatus').textContent=p.travel?'Traversée':p.region;
 $('#travelOptions').innerHTML=p.travel?'<div class="career-card"><p>Utilise AVANCER pour poursuivre.</p></div>':q.routes.map(function(d){var z=req(d);return '<button class="action-card '+(z[0]?'':'locked')+'" data-d="'+e(d)+'"><strong>'+e(d)+'</strong><small>'+e(inf(d).region)+' • danger '+inf(d).danger+(z[0]?'':' • '+z[1])+'</small></button>'}).join('');
 $$('[data-d]').forEach(function(b){b.onclick=function(){go(b.dataset.d)}});renderExploration();renderJourney();renderMarket();
 $('#regionMap').innerHTML=REG.map(function(r){var v=p.visited.filter(function(x){return inf(x).region===r}).length,t=Object.keys(PL).filter(function(x){return inf(x).region===r}).length,ctrls={};Object.keys(w.territories).filter(function(n){return infStatic(n).region===r}).forEach(function(n){var c=w.territories[n].controller;ctrls[c]=(ctrls[c]||0)+1});var lead=Object.keys(ctrls).sort(function(a,b){return ctrls[b]-ctrls[a]})[0]||'Inconnu';return '<div class="region-card '+(r===p.region?'active':'')+'"><strong>'+e(r)+'</strong><span>'+v+'/'+t+' lieux visités</span><small>Influence dominante : '+e(lead)+'</small></div>'}).join('');
 var activeCrews=w.crews.filter(function(c){return c.status==='active'}),activeActors=w.actors.filter(function(a){return a.status==='active'||a.status==='wounded'}),contested=Object.keys(w.territories).filter(function(n){return w.territories[n].contested}).length;
 $('#worldPulseBadge').textContent=w.globalTension>=70?'Tension critique':w.globalTension>=45?'Tension élevée':w.globalTension>=25?'Instable':'Calme';$('#worldPulse').innerHTML='<div><span>Équipages actifs</span><strong>'+activeCrews.length+'</strong></div><div><span>Conflits actifs</span><strong>'+w.conflicts.length+'</strong></div><div><span>Territoires contestés</span><strong>'+contested+'</strong></div><div><span>Acteurs actifs</span><strong>'+activeActors.length+'</strong></div>';
 var ac=w.actors.filter(function(a){return a.region===p.region&&(a.status==='active'||a.status==='wounded')}).sort(function(a,b){return b.importance-a.importance});$('#localActors').innerHTML=ac.length?ac.map(function(a){var rel=relationForActor(a.name);return '<div class="actor-row '+(a.status==='wounded'?'inactive':'')+'"><strong>'+e(a.name)+(rel?' • '+e(rel.role):'')+'</strong><div><span>'+e(a.faction)+' • puissance ~'+Math.round(actorPower(a))+' • '+e(a.status)+'</span><small class="actor-goal">'+e(a.goal)+'</small>'+(a.status==='active'?'<div class="relation-actions-mini"><button data-actor-bond="'+e(a.name)+'">'+(rel?'Interagir':'Approcher')+'</button></div>':'')+'</div></div>'}).join(''):'<p class="helper-text">Aucun acteur majeur identifié dans cette région.</p>';$$('[data-actor-bond]').forEach(function(b){b.onclick=function(){approachCanonicalActor(b.dataset.actorBond)}});
 var known=p.visited.slice().sort(function(a,b){return (a===p.island?-1:0)-(b===p.island?-1:0)}).slice(0,10);$('#territoryBadge').textContent=terr.controller;$('#territoryList').innerHTML=known.map(function(n){var t=w.territories[n]||{controller:'Inconnu',influence:0,stability:0,contested:false};return '<div class="territory-row '+(t.contested?'contested':'')+'"><div class="territory-head"><strong>'+e(n)+'</strong><span>'+e(t.controller)+'</span></div><div class="territory-meta">'+e(infStatic(n).region)+' • influence '+Math.round(t.influence)+' • stabilité '+Math.round(t.stability)+(t.lastChange?' • dernier changement : '+e(t.lastChange):'')+'</div><div class="territory-meter"><div style="width:'+cl(t.influence,0,100)+'%"></div></div></div>'}).join('')||'<p class="helper-text">Aucun territoire connu.</p>';renderDomains();
 var conflicts=w.conflicts.slice().sort(function(a,b){return (b.region===p.region?1:0)-(a.region===p.region?1:0)||b.intensity-a.intensity}).slice(0,6);$('#conflictBadge').textContent=w.conflicts.length+' actif'+(w.conflicts.length>1?'s':'');$('#conflictList').innerHTML=conflicts.length?conflicts.map(function(c){return '<div class="conflict-card '+(c.intensity>=65?'hot':'')+'"><div class="conflict-head"><strong>'+e(c.location)+'</strong><span>Intensité '+Math.round(c.intensity)+'</span></div><div class="conflict-meta">'+e(c.attacker)+' contre '+e(c.defender)+' • '+e(c.region)+' • '+c.months+' mois</div><div class="conflict-meter"><div style="width:'+cl(c.intensity,0,100)+'%"></div></div></div>'}).join(''):'<p class="helper-text">Aucun conflit majeur actuellement enregistré.</p>';renderStrategy();
 var crews=activeCrews.slice().sort(function(a,b){var ar=a.region===p.region?1:0,br=b.region===p.region?1:0;return br-ar||b.power-a.power}).slice(0,7);$('#crewWorldBadge').textContent=activeCrews.length+' actifs';$('#autonomousCrews').innerHTML=crews.length?crews.map(function(c){return '<div class="world-crew-card"><div class="crew-head"><strong>'+e(c.name)+'</strong><span class="crew-status">'+e(c.faction)+'</span></div><div class="crew-meta">'+e(c.region)+' • '+c.members+' membres • puissance '+Math.round(c.power)+(c.bounty?' • prime '+Math.round(c.bounty/1000000)+' M B':'')+' • moral '+Math.round(c.morale)+'%</div><div class="crew-power-meter"><div style="width:'+cl(c.power,0,100)+'%"></div></div></div>'}).join(''):'<p class="helper-text">Aucune force émergente active.</p>';
 var dip=Object.keys(w.diplomacy).map(function(k){return{k:k,v:w.diplomacy[k]}}).sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v)}).slice(0,10);$('#diplomacyGrid').innerHTML=dip.map(function(x){var p2=x.k.split('|'),cls=x.v>24?'diplomacy-positive':x.v<-24?'diplomacy-negative':'diplomacy-neutral';return '<div class="diplomacy-card '+cls+'"><strong>'+e(p2[0])+' ↔ '+e(p2[1])+'</strong><span>'+diplomacyLabel(x.v)+' • '+Math.round(x.v)+'</span></div>'}).join('');
 $('#factionOverview').innerHTML=Object.keys(w.factions).sort(function(a,b){return w.factions[b]-w.factions[a]}).map(function(n){return '<div class="faction-card"><strong>'+e(n)+'</strong><span>Influence mondiale '+Math.round(w.factions[n])+'</span><small>'+diplomacyLabel(diplomacy(p.faction,n))+' avec toi</small></div>'}).join('');$('#regionTitle').textContent=p.region;$('#pressureBars').innerHTML=bar(rp);
 $('#worldNews').innerHTML=game.news.map(function(n){var cls=n.type==='war'?' world-news-war':n.type==='major'?' world-news-major':'';return '<div class="news-item'+cls+'"><strong>'+e(n.title)+'</strong><span>'+e(n.desc)+'</span></div>'}).join('');
 var future=w.canon.filter(function(c){return c.status==='future'}).sort(function(a,b){return canonMonth(a)-canonMonth(b)}),forecast=future.slice(0,4),health=w.divergence<20?'Canon stable':w.divergence<50?'Canon sous tension':w.divergence<75?'Forte divergence':'Chronologie alternative';$('#canonHealthBadge').textContent=health;
 $('#canonForecast').innerHTML=forecast.length?forecast.map(function(c){var missing=(c.required||[]).filter(function(n){var a=canonActor(n);return !a||a.status==='dead'});return '<div class="canon-forecast-item"><span>Année '+c.year+', mois '+(c.month+1)+' • '+e(c.type)+'</span><strong>'+e(c.title)+'</strong><small>'+e(c.location)+' • résistance '+c.resistance+(missing.length?' • chaîne fragilisée : '+e(missing.join(', ')):'')+'</small></div>'}).join(''):'<p class="helper-text">Aucun événement canonique futur enregistré.</p>';
 $('#contentStats').innerHTML='<span>'+Object.keys(PL).length+' lieux</span><span>'+w.actors.length+' acteurs</span><span>'+w.fruits.length+' Fruits</span><span>'+w.canon.length+' événements canoniques</span>';
 $('#divergenceBadge').textContent='Divergence '+Math.round(w.divergence)+'%';$('#canonList').innerHTML=w.canon.slice().sort(function(a,b){return canonMonth(a)-canonMonth(b)}).map(function(c){return '<div class="canon-item canon-'+e(c.status)+'"><span class="status">'+e(c.status)+'</span><strong>'+e(c.title)+'</strong><span>Année '+c.year+', mois '+(c.month+1)+' • '+e(c.location)+' • résistance '+c.resistance+'</span><small>'+e(c.description||'')+'</small></div>'}).join('');
 renderCodexExploration();var co=[].concat(game.codex.people,game.codex.places,game.codex.factions,game.codex.fruits,game.codex.events||[],game.codex.techniques||[]).filter(function(v,i,a){return a.indexOf(v)===i});$('#codexList').innerHTML=co.map(function(x){return '<span class="chip">'+e(x)+'</span>'}).join('')
}
function render(){if(!game)return;showGame();var p=game.player;$('#ageLabel').textContent=age();$('#locationLabel').textContent=p.travel?'→ '+p.travel.destination:p.island;$('#moneyLabel').textContent=Math.floor(p.money).toLocaleString('fr-FR')+' B';$('#playerName').textContent=p.name;$('#avatarInitial').textContent=p.name.charAt(0).toUpperCase();$('#playerSubtitle').textContent=p.race+' • '+p.region+' • '+p.faction;$('#lifeStatus').textContent=p.situation;$('#repPill').textContent=rep();$('#situationTitle').textContent=p.situation;$('#activityValue').textContent=p.activity;$('#factionValue').textContent=p.faction;$('#healthValue').textContent=Math.round(p.health)+'%';$('#energyValue').textContent=Math.round(p.energy)+'%';var d=$('#dangerBadge');d.textContent=p.danger;d.className='danger-badge '+(p.danger==='Élevé'?'high':p.danger==='Moyen'?'medium':'low');$('#conditionChips').innerHTML=p.conditions.length?p.conditions.map(function(c){return '<span class="chip">'+e(c.name)+'</span>'}).join(''):'<span class="chip">Aucune blessure</span>';renderAdvanceLoop();var sw=awaitingStory();if(game.pending||sw){$('#attentionCard').classList.remove('hidden');$('#attentionTitle').textContent=game.pending?game.pending.title:sw.title;$('#attentionText').textContent=game.pending?game.pending.text:storyPrompt(sw)}else $('#attentionCard').classList.add('hidden');renderStories();renderPanel(activeTab);renderDevOutput()}
function deathModal(){var p=game.player,estate=estateValue(),partner=partnerRelation(),kids=(p.children||[]).filter(function(c){return c.status==='active'}),ach=Object.keys(game.achievements.unlocked||{}).length,storyStats=migrateStoryEngine(game).stats;$('#deathTitle').textContent=p.name+', '+age();$('#deathSummary').innerHTML='<div><span>Cause</span><strong>'+e(game.death.cause)+'</strong></div><div><span>Carrière</span><strong>'+e(p.career)+' • '+e(p.rank)+'</strong></div><div><span>Victoires</span><strong>'+p.wins+'</strong></div><div><span>Lieux</span><strong>'+p.visited.length+'</strong></div><div><span>Histoires</span><strong>'+storyStats.resolved+' résolue'+(storyStats.resolved>1?'s':'')+'</strong></div><div><span>Patrimoine</span><strong>'+estate.toLocaleString('fr-FR')+' B</strong></div><div><span>Achievements</span><strong>'+ach+'/'+ACHIEVEMENTS.length+'</strong></div>';$('#legacyCard').innerHTML='<strong>Génération '+game.dynasty.generation+'</strong><span>'+(partner?'Conjoint : '+e(partner.name)+' • ':'')+kids.length+' enfant'+(kids.length>1?'s':'')+' • prime maximale '+Math.round(p.highestBounty).toLocaleString('fr-FR')+' B.</span>';var hb=$('#continueHeirBtn');hb.classList.toggle('hidden',!kids.length);if(kids.length){var heir=kids.slice().sort(function(a,b){return b.ageMonths-a.ageMonths})[0];hb.textContent='Continuer avec '+heir.name}$('#deathModal').classList.remove('hidden')}
function toast(m){var t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.add('hidden')},1600)}
function backup(m){backupMode=m;$('#backupModal').classList.remove('hidden');$('#backupTitle').textContent=m==='export'?'Exporter':'Importer';$('#backupText').value=m==='export'?btoa(unescape(encodeURIComponent(JSON.stringify(game)))):'';$('#backupPrimaryBtn').textContent=m==='export'?'Copier':'Importer'}
function bind(){
 $$('.mode-card').forEach(function(b){b.onclick=function(){mode=b.dataset.mode;$$('.mode-card').forEach(function(x){x.classList.toggle('selected',x===b)});$('#customFields').classList.toggle('hidden',mode!=='custom')}});
 $('#newLifeBtn').onclick=function(){make();$('#creationCard').classList.add('hidden');render()};$('#cancelCreate').onclick=function(){$('#creationCard').classList.add('hidden')};$('#advanceBtn').onclick=function(){if(game)advance()};$('#attentionBtn').onclick=showAttention;$('#homeBtn').onclick=showStart;
 $('#deathHomeBtn').onclick=function(){$('#deathModal').classList.add('hidden');showStart()};$('#continueHeirBtn').onclick=continueWithHeir;$('#deathNewBtn').onclick=function(){localStorage.removeItem(key());$('#deathModal').classList.add('hidden');showStart();$('#creationCard').classList.remove('hidden')};
 $('#timelineFilter').onclick=function(){majorOnly=!majorOnly;renderTimeline()};$$('.nav-item').forEach(function(b){b.onclick=function(){activateTab(b.dataset.tab,true)}});
 $('#devToggle').onclick=function(){if(game){$('#developerPanel').classList.remove('hidden');renderDevOutput()}};$('#closeDev').onclick=function(){$('#developerPanel').classList.add('hidden')};$('#exportSaveBtn').onclick=function(){backup('export')};$('#importSaveBtn').onclick=function(){backup('import')};$('#backupCloseBtn').onclick=function(){$('#backupModal').classList.add('hidden')};
 $('#backupPrimaryBtn').onclick=function(){if(backupMode==='export'){if(navigator.clipboard)navigator.clipboard.writeText($('#backupText').value);toast('Sauvegarde copiée ou prête à copier.')}else try{game=migrate(JSON.parse(decodeURIComponent(escape(atob($('#backupText').value.trim())))));syncCanonicalFruits();save();$('#backupModal').classList.add('hidden');render()}catch(x){toast('Sauvegarde invalide.')}};
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save()});window.addEventListener('pagehide',save)
}
function init(){bind();setupSectionNavigation();if(location.protocol!=='file:')$('#localFileWarning').classList.add('hidden');if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.matchMedia('(display-mode: standalone)').matches&&location.protocol==='https:')$('#iosInstallCard').classList.remove('hidden');slots();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){})}
init();
})();