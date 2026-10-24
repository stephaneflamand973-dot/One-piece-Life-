import test from 'node:test';
import assert from 'node:assert/strict';
import {diminishingFactor,scaledBenefit,scaledChance} from '../foundation/src/core/diminishing.mjs';
import {createEngine} from '../foundation/src/core/engine.mjs';
import {sceneForAge} from '../foundation/src/core/events.mjs';
import {isValidState,SCHEMA_VERSION} from '../foundation/src/core/state.mjs';
import {restAbilities} from '../foundation/src/core/abilities.mjs';
import {reactionChance,resolveReaction} from '../foundation/src/core/personality.mjs';
import {missionAvailability} from '../foundation/src/core/pirate-missions.mjs';
import {ageCommand,orderAvailability} from '../foundation/src/core/pirate-command.mjs';
import {SAVE_KEY} from '../foundation/src/core/storage.mjs';

const hero={firstName:'Lina',lastName:'Marin',gender:'F',sea:'east',place:'Village de Fuchsia'};
const memory=()=>{
 const values=new Map();
 return {values,storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
};
function prepare(){
 const {values,storage}=memory();
 const engine=createEngine({storage,random:()=>0});
 assert.ok(engine.startLife(hero));
 while(engine.getState().activeLife.age<16){
  assert.ok(engine.age());
  const s=engine.getState();
  if(s.domainData.story.pending)
    assert.ok(engine.choose(sceneForAge(s.activeLife.age).options[0].id));
  if(engine.getState().domainData.relationships.pending)assert.ok(engine.answerNpc('accept'));
 }
 return {engine,storage,values};
}
test('courbe universelle : pas de plafond et premières répétitions intactes',()=>{
 assert.equal(diminishingFactor(0),1);
 assert.equal(diminishingFactor(1),1);
 assert.equal(diminishingFactor(2),1);
 assert.ok(diminishingFactor(3)<1);
 assert.ok(diminishingFactor(7)<diminishingFactor(3));
 assert.ok(diminishingFactor(10000)>0);
 assert.equal(scaledBenefit(100,0),100);
 assert.ok(scaledBenefit(100,10)>0);
 assert.ok(scaledBenefit(100,10)<scaledBenefit(100,4));
 assert.ok(scaledChance(90,20)>=8);
});
test('plus de 10 séances et repos dans la même année, sauvegarde et retour au rendement initial',()=>{
 const {engine,storage}=prepare(),age=engine.getState().activeLife.age;
 const skill=engine.getState().domainData.abilities.skills.force;
 for(let i=0;i<12;i++)assert.ok(engine.train('force'),'séance '+i);
 const after=engine.getState();
 assert.equal(after.activeLife.age,age);
 assert.equal(after.domainData.abilities.trainingUsed,12);
 assert.ok(after.domainData.abilities.skills.force>skill);
 assert.ok(isValidState(after));
 const base={...after.domainData.abilities,restUsed:0,fatigue:100};
 const one=restAbilities(base,after.activeLife);
 const late=restAbilities({...base,restUsed:7},after.activeLife);
 assert.ok(one.fatigue<late.fatigue,'repos répété moins efficace');
 for(let i=0;i<8;i++)assert.ok(engine.rest());
 assert.equal(engine.getState().domainData.abilities.restUsed,8);
 assert.ok(isValidState(engine.getState()));
 assert.deepEqual(createEngine({storage}).getState(),engine.getState());
 assert.ok(engine.age());
 assert.equal(engine.getState().domainData.abilities.trainingUsed,0);
 assert.equal(engine.getState().domainData.abilities.restUsed,0);
});
test('relations : même personne répétable, chance et bénéfices moindres',()=>{
 const {engine}=prepare();
 const start=engine.getState().domainData.relationships;
 const mother=start.people.find(p=>p.id==='mother');
 const oldChance=reactionChance(start,mother,'talk');
 const tooMany={...start,actionsUsed:14};
 const lateChance=reactionChance(tooMany,mother,'talk');
 assert.ok(lateChance<oldChance);
 const first=resolveReaction(start,mother,'talk',16,0,()=>0);
 const late=resolveReaction(tooMany,mother,'talk',16,0,()=>0);
 assert.ok(first.updated.bond-mother.bond>=late.updated.bond-mother.bond);
 for(let i=0;i<10;i++)assert.ok(engine.interact('mother','talk'));
 assert.equal(engine.getState().domainData.relationships.actionsUsed,10);
 assert.ok(isValidState(engine.getState()));
});
test('missions : ni fatigue extrême ni répétition ne verrouillent ; les récompenses s’érodent',()=>{
 const {engine}=prepare();
 assert.ok(engine.applyPirate('alizes','combattant'));
 const begin=engine.getState();
 for(let i=0;i<9;i++)assert.ok(engine.mission('escort'),'mission '+i);
 const final=engine.getState();
 assert.equal(final.domainData.career.missions.used,9);
 const logs=final.domainData.career.missions.log;
 assert.ok(logs[0].reward>=logs.at(-1).reward);
 assert.ok(logs[0].chance>=logs.at(-1).chance);
 assert.ok(missionAvailability(final.domainData.career,
  {...final.domainData.abilities,fatigue:100},final.domainData.relationships,
  final.activeLife,'escort').enabled);
 assert.deepEqual(final.history.length,begin.history.length);
 assert.ok(isValidState(final));
});
test('commandement : ordres de capitaine répétables et compteur remis à zéro annuellement',()=>{
 const {engine,storage}=prepare();
 assert.ok(engine.applyPirate('alizes','combattant'));
 assert.ok(engine.mission('escort'));assert.ok(engine.mission('explore'));
 assert.ok(engine.foundCrew());
 const life=engine.getState().activeLife;
 assert.ok(engine.recruitCrew('combattant'));
 const before=engine.getState().domainData.career.command.members[0].skill;
 for(let i=0;i<8;i++)assert.ok(engine.commandCrew('train'),'ordre '+i);
 const cmd=engine.getState().domainData.career.command;
 assert.equal(cmd.actionUsage['order:train'],8);
 assert.ok(cmd.members[0].skill>before);
 const next=ageCommand(engine.getState().domainData.career,life.age+1,()=>.99);
 assert.deepEqual(next.career.command.actionUsage,{});
 assert.ok(isValidState(engine.getState()));
 assert.equal(SCHEMA_VERSION,18);
 assert.ok(storage.getItem(SAVE_KEY));
});
