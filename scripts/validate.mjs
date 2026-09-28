import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');

new Function(app);
JSON.parse(manifest);

if(!html.includes('V0.6')) throw new Error('index.html does not expose V0.6');
if(!app.includes('version:6')) throw new Error('game state is not V0.6');

const dynamicIds=new Set(['eatHeldFruit','challengeBtn','martialTrainBtn']);
const ids=[...app.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(ids)].filter(id=>!dynamicIds.has(id)&&!html.includes('id="'+id+'"'));
if(missing.length) throw new Error('Missing HTML ids: '+missing.join(', '));

console.log('ONE PIECE LIFE V0.6 validation OK');
