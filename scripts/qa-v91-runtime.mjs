import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const registrySrc=fs.readFileSync('src/core/module-registry.js','utf8');
const v90DataSrc=fs.readFileSync('src/data/game-flow-v90.js','utf8');
const v90EngineSrc=fs.readFileSync('src/v90/game-flow-engine-v90.js','utf8');
const v91DataSrc=fs.readFileSync('src/data/goals-v91.js','utf8');
const v91EngineSrc=fs.readFileSync('src/v91/goals-engine-v91.js','utf8');

function assert(cond,msg){if(!cond)throw new Error(msg)}

let source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const initCall="init().catch(()=>{storageFallback=true;renderSlots();startupMessage('Démarrage en mode de secours local.','warn')});";
assert(source&&source.includes(initCall),'V9.1 runtime instrumentation marker missing');
source=source.replace(initCall,`window.__qa91={
  initialGame,setGame(v){game=v},getGame(){return game},ensure:ensureV6,render,renderAmbition,advance,resolveDecision,
  goals:v91Ensure,sync:v91Sync,context:v91Context,applyIntent:v91ApplyIntent,changeAmbition:v91ChangeAmbition,
  forceAmbition:v91OnAmbitionChange,applyPreset:v90ApplyPreset,plan:v62PlanSource,overallPower,
  summary(){const m=v91Module(),s=v91Ensure();return m&&s?m.summary(s,v91Context()):null}
};`);

const elements=new Map();
function fakeElement(sel){
  if(!elements.has(sel)){
    const cls=new Set();
    elements.set(sel,{
      value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},onclick:null,
      classList:{
        add(...xs){xs.forEach(x=>cls.add(x))},
        remove(...xs){xs.forEach(x=>cls.delete(x))},
        toggle(x,force){
          if(force===undefined){if(cls.has(x)){cls.delete(x);return false}cls.add(x);return true}
          force?cls.add(x):cls.delete(x);return !!force
        },
        contains(x){return cls.has(x)}
      },
      addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},
      focus(){},select(){},closest(){return null},scrollIntoView(){}
    });
  }
  return elements.get(sel);
}
for(const [k,v] of Object.entries({
  '#seedInput':'910091','#nameInput':'Agency Runtime QA','#difficultyInput':'Casual',
  '#originInput':'East Blue','#raceInput':'Humain','#styleInput':'Équilibré'
}))fakeElement(k).value=v;

const document={
  visibilityState:'visible',
  querySelector:fakeElement,
  querySelectorAll(){return[]},
  addEventListener(){},removeEventListener(){},execCommand(){return true}
};
const storage=new Map();
const localStorage={
  getItem(k){return storage.has(k)?storage.get(k):null},
  setItem(k,v){storage.set(k,String(v))},
  removeItem(k){storage.delete(k)},
  clear(){storage.clear()}
};
const windowObj={
  addEventListener(){},removeEventListener(){},scrollTo(){},
  matchMedia(){return{matches:false}},
  isSecureContext:true
};
windowObj.window=windowObj;windowObj.document=document;windowObj.localStorage=localStorage;

new Function('window',registrySrc)(windowObj);
for(const path of ['src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js','src/data/action-v102.js','src/v102/action-engine-v102.js'])new Function('window',fs.readFileSync(path,'utf8'))(windowObj);
for(const src of [v90DataSrc,v90EngineSrc,v91DataSrc,v91EngineSrc])new Function('window',src)(windowObj);
for(const path of ['src/data/manual-life-v100.js','src/v100/manual-life-engine-v100.js','src/data/action-v102.js','src/v102/action-engine-v102.js'])new Function('window',fs.readFileSync(path,'utf8'))(windowObj);

new Function(
  'window','document','localStorage','navigator','location','indexedDB',
  'setTimeout','clearTimeout','requestAnimationFrame','console','Promise',source
)(
  windowObj,document,localStorage,
  {userAgent:'V9.1-RUNTIME-QA',clipboard:{writeText(){return Promise.resolve()}},storage:{persist(){return Promise.resolve(true)}}},
  {protocol:'https:'},undefined,
  ()=>1,()=>{},cb=>{if(typeof cb==='function')cb();return 1},
  {log(){},warn(){},error(){}},Promise
);

const q=windowObj.__qa91;
assert(q,'V9.1 runtime QA API missing');

const game=q.initialGame();
q.setGame(game);
game.ageMonths=18*12;game.clock.year=18;game.clock.month=0;game.meta.difficulty='Casual';
Object.assign(game.player,{
  faction:'Marine',career:'Marine',rank:'Recrue',situation:'Service actif',
  activity:'Patrouille',activityType:'marine',health:100,energy:90,
  ambition:'Devenir puissant',ambitionType:'power'
});
game.flags.ambitionOffered=true;game.flags.careerOffered=true;game.flags.specializationOffered=true;
game.player.specialization='combat';game.player.reputation.marine=35;game.player.reputation.world=5;

q.ensure();q.goals();q.applyPreset('balanced');

const initial=q.summary();
assert(initial&&initial.medium.length===2,'V9.1 runtime medium goals missing');
assert(initial.short.length===3,'V9.1 runtime short goals missing');

assert(q.applyIntent('mastery'),'Mastery intent could not be selected');
assert(q.plan().training==='mastery','Mastery intent did not patch the real annual plan');

assert(q.applyIntent('recovery'),'Recovery intent could not replace mastery');
assert(q.plan().training==='recover','Recovery intent training patch missing');
assert(q.plan().adventure==='cautious','Recovery intent adventure patch missing');
assert(q.plan().mission==='cautious','Recovery intent mission patch missing');
assert(q.plan().career==='steady','Intent switching leaked an unrelated previous patch');

assert(q.applyIntent('career'),'Career intent could not replace recovery');
assert(q.plan().career==='hard','Career intent career patch missing');
assert(q.plan().training==='steady','Recovery training patch leaked into the career intent');
assert(q.plan().adventure==='steady','Recovery adventure patch leaked into the career intent');
assert(q.plan().mission==='standard','Recovery mission patch leaked into the career intent');

game.player.ambition='Devenir puissant';game.player.ambitionType='power';
assert(q.forceAmbition(true),'Initial ambition synchronization failed');
assert(game.player.goalsV91.lastAmbitionChangeYear===game.clock.year,'Initial ambition choice did not start yearly cooldown');
assert(q.changeAmbition('explore')===false,'Ambition changed twice in the same year');

q.applyPreset('balanced');
const startPower=q.overallPower();
const startProgress=q.summary().ambition.progress;
const completedBefore=game.player.goalsV91.completed.length;

let years=0,decisions=0,safety=0,maxSave=0;
while(years<8&&game.alive&&safety++<650){
  const yearBefore=game.clock.year;
  if(game.pendingDecision){
    const choice=game.pendingDecision.choices?.[0];
    assert(choice,'Pending decision without a choice');
    decisions++;q.resolveDecision(choice.action);
  }else{
    q.advance();
  }
  if(!game.agency?.annualTurn?.active&&game.clock.year>yearBefore){
    years++;
    assert(game.player.goalsV91.annualIntent==='balanced','Annual intent did not expire at year end');
  }
  maxSave=Math.max(maxSave,JSON.stringify(game).length);
  assert(game.player.health>=0&&game.player.health<=100,'Health out of bounds');
  assert(game.player.energy>=0&&game.player.energy<=100,'Energy out of bounds');
}
assert(years>=6,'V9.1 integrated simulation did not advance enough years');

q.renderAmbition();
const final=q.summary();
assert(fakeElement('#ambitionCard').innerHTML.includes('Ambition long terme'),'V9.1 goal card did not render');
assert(fakeElement('#ambitionOptions').innerHTML.includes('Intention annuelle'),'V9.1 intent controls did not render');
assert(final.ambition.progress>=startProgress,'Power ambition progress regressed');
assert(game.player.goalsV91.completed.length>=completedBefore,'Completed goal history regressed');
assert(maxSave<500*1024,'V9.1 save grew beyond 500 KiB during runtime QA');

console.log('V9.1 INTEGRATED RUNTIME QA OK',JSON.stringify({
  years,decisions,alive:game.alive,rank:game.player.rank,
  power:{start:+startPower.toFixed(1),end:+q.overallPower().toFixed(1)},
  ambition:{start:+startProgress.toFixed(1),end:+final.ambition.progress.toFixed(1)},
  completed:game.player.goalsV91.completed.length-completedBefore,
  intent:final.intent.id,
  maxSaveKB:+(maxSave/1024).toFixed(1)
}));
