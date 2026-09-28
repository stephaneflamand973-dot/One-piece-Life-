import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('content-v1.js','utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);

const c=sandbox.window.OPV1_CONTENT;
if(!c) throw new Error('OPV1_CONTENT missing');

const locations=c.locations||{};
const actors=c.actors||[];
const fruits=c.fruits||[];
const canon=c.canonEvents||[];
const special=c.specialTechniques||[];
const assignments=c.fruitAssignments||[];

const baseLocations=[
'Loguetown','Shells Town','Orange Town','Goa','Shimotsuki','Syrup Village','Baratie',
'Lvneel','Flevance','Minion Island','Ohara','Ilusia','Baterilla','Torino','Reverse Mountain',
'Twin Cape','Whisky Peak','Little Garden','Drum','Alabasta','Jaya','Water 7','Thriller Bark',
'Sabaody','Fish-Man Island','Punk Hazard','Dressrosa','Zou','Whole Cake Island','Wano','Egghead'
];
const allLocations=new Set([...baseLocations,...Object.keys(locations)]);
for(const [name,data] of Object.entries(locations)){
  if(!Array.isArray(data)||data.length<3) throw new Error('Invalid location data: '+name);
  for(const route of data[2]) if(!allLocations.has(route)) throw new Error('Unknown route from '+name+' to '+route);
}
const unique=(arr,label)=>{const seen=new Set();for(const v of arr){if(seen.has(v))throw new Error('Duplicate '+label+': '+v);seen.add(v)}};
unique(actors.map(a=>a.name),'actor');
unique(fruits.map(f=>f[0]),'fruit');
unique(canon.map(e=>e.id),'canon id');
unique(special.map(t=>t.id),'special technique');

const actorNames=new Set(actors.map(a=>a.name));
for(const ev of canon){
  if(!allLocations.has(ev.location)) throw new Error('Canon event '+ev.id+' uses unknown location '+ev.location);
  for(const n of ev.required||[]) if(!actorNames.has(n)) throw new Error('Canon event '+ev.id+' requires unknown actor '+n);
}
for(let i=1;i<canon.length;i++){
  const prev=canon[i-1].year*12+(canon[i-1].month||0);
  const now=canon[i].year*12+(canon[i].month||0);
  if(now<prev) throw new Error('Canon chronology is not sorted at '+canon[i].id);
}
for(const f of fruits){
  if(!f[0]||!f[1]||typeof f[2]!=='number'||f[2]<1||f[2]>100) throw new Error('Invalid fruit row: '+JSON.stringify(f));
}
const fruitNames=new Set(fruits.map(f=>f[0]));
for(const a of assignments){
  if(!fruitNames.has(a.fruit)) throw new Error('Fruit assignment references unknown fruit '+a.fruit);
  if(!actorNames.has(a.holder)) throw new Error('Fruit assignment references unknown actor '+a.holder);
  if(typeof a.year!=='number'||typeof a.month!=='number') throw new Error('Invalid fruit assignment date for '+a.fruit);
}
unique(assignments.map(a=>a.fruit+'@'+a.year+':'+a.month),'fruit assignment');

console.log('V1 content validation OK:',Object.keys(locations).length,'new locations,',actors.length,'actors,',fruits.length,'fruits,',canon.length,'canon events,',assignments.length,'fruit assignments');
