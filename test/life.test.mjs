import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState, beginLife, advanceOneYear, resolveDecision, isValidState, MAX_AGE } from '../foundation/src/core/state.mjs';
import { createCharacter } from '../foundation/src/core/life.mjs';
import { SEAS } from '../foundation/src/core/places.mjs';
import { EVENTS, sceneForAge, annualNarrative } from '../foundation/src/core/events.mjs';
import { createEngine } from '../foundation/src/core/engine.mjs';
import { SAVE_KEY, PREVIOUS_SAVE_KEY, loadState, saveState, eraseState, migrateV02 } from '../foundation/src/core/storage.mjs';
import { renderLife } from '../foundation/src/ui/life-view.mjs';

const options={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
function fakeStorage(){
  const map=new Map([['one-piece-life:legacy','intouchable']]);
  const storage={getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v),removeItem:key=>map.delete(key)};
  return {storage,map};
}
function playUntil(state,age,choose='aider') {
  let next=state;
  while(next.activeLife.age < age) {
    next=advanceOneYear(next);
    if(next.domainData.story.pending)
      next=resolveDecision(next,sceneForAge(next.activeLife.age).options[0].id);
  }
  return next;
}
test('naissance à zéro et une ligne de journal',()=>{
  const before=createEmptyState();
  const state=beginLife(before,options);
  assert.equal(before.activeLife,null);
  assert.equal(state.activeLife.age,0);
  assert.equal(state.history.length,1);
  assert.equal(state.history[0].type,'birth');
  assert.ok(isValidState(state));
  assert.throws(()=>beginLife(state,options));
});
test('un clic = un an et un événement adapté à l’âge',()=>{
  const first=beginLife(createEmptyState(),options);
  const next=advanceOneYear(first);
  assert.equal(first.activeLife.age,0);
  assert.equal(next.activeLife.age,1);
  assert.equal(next.history.length,2);
  assert.equal(next.history[1].type,'year');
  assert.equal(next.history[1].age,1);
  assert.ok(next.history[1].text !== 'Vous avez maintenant 1 an.');
  assert.ok(isValidState(next));
  assert.notStrictEqual(next.activeLife,first.activeLife);
});
test('à 6 ans, décision bloquante puis conséquence persistante à 7 ans',()=>{
  const start=beginLife(createEmptyState(),options);
  const before=playUntil(start,5);
  const pending=advanceOneYear(before);
  assert.equal(pending.activeLife.age,6);
  assert.deepEqual(pending.domainData.story.pending,{age:6,eventId:'quai'});
  assert.equal(pending.history[6].type,'event');
  assert.equal(advanceOneYear(pending),null);
  assert.equal(resolveDecision(pending,'invalide'),null);
  const chosen=resolveDecision(pending,'aider');
  assert.equal(chosen.activeLife.age,6);
  assert.equal(chosen.history.length,7);
  assert.equal(chosen.history[6].type,'decision');
  assert.equal(chosen.domainData.story.qualities.solidarite,1);
  assert.equal(chosen.domainData.story.pending,null);
  assert.deepEqual(chosen.domainData.story.decisions,[{age:6,eventId:'quai',option:'aider'}]);
  const seventh=advanceOneYear(chosen);
  assert.equal(seventh.activeLife.age,7);
  assert.match(seventh.history[7].text,/L’enfant du quai vous remercie/);
  assert.ok(isValidState(seventh));
});
test('les deux choix produisent des suites différentes et un score enregistré',()=>{
  const six=advanceOneYear(playUntil(beginLife(createEmptyState(),options),5));
  const a=resolveDecision(six,'aider');
  const b=resolveDecision(six,'observer');
  assert.notDeepEqual(a.domainData.story.qualities,b.domainData.story.qualities);
  assert.notEqual(advanceOneYear(a).history[7].text,advanceOneYear(b).history[7].text);
  assert.equal(a.activeLife.age,b.activeLife.age);
});
test('enchaînement de 120 années et de toutes les décisions sans double année',()=>{
  let state=beginLife(createEmptyState(),options);
  for(let year=1;year<=MAX_AGE;year++) {
    const aged=advanceOneYear(state);
    assert.ok(aged);
    assert.equal(aged.activeLife.age,year);
    assert.equal(aged.history.length,year+1);
    const scene=sceneForAge(year);
    if(scene) {
      assert.equal(aged.history[year].type,'event');
      assert.equal(advanceOneYear(aged),null);
      state=resolveDecision(aged,scene.options[0].id);
    } else {
      state=aged;
    }
    assert.ok(isValidState(state),'État invalide à '+year+' ans');
  }
  assert.equal(state.activeLife.alive,false);
  assert.equal(state.history[120].type,'end');
  assert.equal(state.domainData.story.decisions.length,EVENTS.length);
  assert.equal(advanceOneYear(state),null);
});
test('origine aléatoire contrôlée et choix non déterministes au départ',()=>{
  for(const p of [0,0.15,0.4,0.75,0.999999]){
    const person=createCharacter({},()=>p);
    assert.ok(SEAS.some(s=>s.id===person.origin.sea && s.places.includes(person.origin.place)));
    assert.ok(['M','F'].includes(person.gender));
  }
  assert.throws(()=>createCharacter({},()=>1));
});
test('sauvegarde de décision en attente puis reprise après rechargement',()=>{
  const {storage,map}=fakeStorage();
  const a=createEngine({storage,random:()=>0});
  assert.equal(a.startLife(options),true);
  for(let age=1;age<=6;age++) assert.equal(a.age(),true);
  assert.equal(a.getState().domainData.story.pending.eventId,'quai');
  const reloaded=createEngine({storage});
  assert.equal(reloaded.getState().activeLife.age,6);
  assert.equal(reloaded.age(),false);
  assert.equal(reloaded.choose('observer'),true);
  assert.equal(reloaded.getState().domainData.story.qualities.curiosite,1);
  assert.equal(createEngine({storage}).getState().domainData.story.pending,null);
  assert.ok(map.has(SAVE_KEY));
});
test('les choix illégaux ne modifient jamais la partie',()=>{
  const {storage}=fakeStorage();
  const engine=createEngine({storage});
  engine.startLife(options);
  assert.equal(engine.choose('aider'),false);
  const original=engine.getState();
  assert.strictEqual(original,engine.getState());
  const tampered={...original,domainData:{story:{...original.domainData.story,qualities:{audace:3,curiosite:0,solidarite:0}}}};
  assert.equal(isValidState(tampered),false);
  assert.equal(saveState(tampered,storage),false);
});
test('erreur de stockage: une année ou une décision refusée ne change pas l’état mémoire',()=>{
  let locked=false;
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{if(locked)throw Error('locked');map.set(k,v)},removeItem:k=>map.delete(k)};
  const engine=createEngine({storage});
  engine.startLife(options);
  locked=true;
  assert.equal(engine.age(),false);
  assert.equal(engine.getState().activeLife.age,0);
  locked=false;
  for(let i=0;i<6;i++) assert.equal(engine.age(),true);
  locked=true;
  const pending=engine.getState();
  assert.equal(engine.choose('aider'),false);
  assert.strictEqual(engine.getState(),pending);
  assert.equal(engine.restart(),false);
  assert.strictEqual(engine.getState(),pending);
});
test('V0.2 migrée à V0.3 sans perdre l’âge et sans effacer les anciennes données',()=>{
  const {storage,map}=fakeStorage();
  const legacy={
    schemaVersion:2,
    activeLife:{...createCharacter(options,()=>0),age:7},
    history:[
      {age:0,type:'birth',text:'Naissance ancienne.'},
      ...Array.from({length:7},(_,i)=>({age:i+1,type:'year',text:'Année historique.'}))
    ],
    domainData:{}
  };
  map.set(PREVIOUS_SAVE_KEY,JSON.stringify(legacy));
  const engine=createEngine({storage});
  assert.equal(engine.getState().activeLife.age,7);
  assert.equal(engine.getState().history.length,8);
  assert.equal(engine.getState().domainData.story.decisions.length,0);
  assert.ok(map.has(SAVE_KEY));
  assert.equal(map.get(PREVIOUS_SAVE_KEY),JSON.stringify(legacy));
  assert.equal(engine.age(),true);
  assert.equal(engine.getState().activeLife.age,8);
  assert.equal(engine.restart(),true);
  assert.equal(engine.getState().activeLife,null);
  assert.ok(map.has(SAVE_KEY));
  assert.equal(createEngine({storage}).getState().activeLife,null);
  assert.equal(map.get(PREVIOUS_SAVE_KEY),JSON.stringify(legacy));
  assert.equal(map.get('one-piece-life:legacy'),'intouchable');
});
test('migrations et sauvegardes corrompues rejetées',()=>{
  const {storage,map}=fakeStorage();
  assert.equal(migrateV02({schemaVersion:2,activeLife:{age:6},history:[],domainData:{}}),null);
  assert.equal(migrateV02({schemaVersion:1}),null);
  map.set(PREVIOUS_SAVE_KEY,'{not-json');
  assert.equal(loadState(storage),null);
  const state=beginLife(createEmptyState(),options);
  assert.equal(saveState(state,storage),true);
  map.set(SAVE_KEY,'{broken');
  assert.equal(loadState(storage),null);
  assert.equal(eraseState(storage),true);
  assert.equal(loadState(storage).activeLife,null);
});
test('affichage accessible des décisions sans injection HTML',()=>{
  const six=advanceOneYear(playUntil(beginLife(createEmptyState(),{...options,firstName:'<script>X</script>'}),5));
  const html=renderLife(six);
  assert.ok(html.includes('decision-panel'));
  assert.equal((html.match(/Près du port, un enfant a perdu son petit bateau en bois/g) ?? []).length, 1);
  assert.ok(html.includes('data-choice="aider"'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  const resolved=renderLife(resolveDecision(six,'aider'));
  assert.ok(!resolved.includes('data-choice='));
  assert.ok(resolved.includes('Solidarité'));
});
