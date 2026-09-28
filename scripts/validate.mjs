import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');

new Function(app);
JSON.parse(manifest);

if(!html.includes('V0.7')) throw new Error('index.html does not expose V0.7');
if(!app.includes('version:7') || !app.includes('g.version=7')) throw new Error('game state is not V0.7');

const dynamicIds=new Set(['eatHeldFruit','challengeBtn','martialTrainBtn']);
const ids=[...app.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(ids)].filter(id=>!dynamicIds.has(id)&&!html.includes('id="'+id+'"'));
if(missing.length) throw new Error('Missing HTML ids: '+missing.join(', '));

if(!app.includes('function careerTick') || !app.includes('var CAREERS=')) throw new Error('V0.7 career engine missing');
if(!app.includes('factionRep') || !app.includes('Cipher Pol')) throw new Error('V0.7 faction systems missing');
console.log('ONE PIECE LIFE V0.7 validation OK');
