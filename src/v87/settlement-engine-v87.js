(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('settlementDataV87');if(!data)throw new Error('Settlement data V8.7 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));

function normalizeState(state={}){
 const s={version:1,islands:state.islands&&typeof state.islands==='object'?clone(state.islands):{},totalVisits:Math.max(0,Math.floor(num(state.totalVisits))),totalServices:Math.max(0,Math.floor(num(state.totalServices))),totalContacts:Math.max(0,Math.floor(num(state.totalContacts))),totalSpent:Math.max(0,num(state.totalSpent)),history:Array.isArray(state.history)?clone(state.history).slice(0,40):[]};
 return s
}
function settlement(state,island){
 const s=normalizeState(state),r=s.islands[island]||{};
 return {standing:clamp(Number.isFinite(Number(r.standing))?Number(r.standing):10,-100,100),heat:clamp(num(r.heat),0,100),familiarity:clamp(num(r.familiarity),0,100),contacts:Math.max(0,Math.floor(num(r.contacts))),visits:Math.max(0,Math.floor(num(r.visits))),servicesUsed:Math.max(0,Math.floor(num(r.servicesUsed))),lastVisitYear:Number.isFinite(Number(r.lastVisitYear))?Number(r.lastVisitYear):-99,lastServiceYear:Number.isFinite(Number(r.lastServiceYear))?Number(r.lastServiceYear):-99,knownDistricts:Array.isArray(r.knownDistricts)?clone(r.knownDistricts):[],flags:r.flags&&typeof r.flags==='object'?clone(r.flags):{}}
}
function standingLabel(value){
 const v=num(value);let label=data.standingLabels[0].label;for(const x of data.standingLabels)if(v>=x.min)label=x.label;return label
}
function districtScore(template,tags=[]){
 return template.tags.reduce((s,t)=>s+(tags.includes(t)?3:0),0)
}
function districtsFor(place={}){
 const tags=Array.isArray(place.tags)?place.tags:[];
 let list=Object.entries(data.districtTemplates).map(([id,d])=>({id,...d,score:districtScore(d,tags)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 if(!list.length)list=[{id:'frontier',...data.districtTemplates.frontier,score:1}];
 return list.slice(0,3)
}
function servicesFor(place={},settle={}){
 const tags=Array.isArray(place.tags)?place.tags:[],districts=districtsFor(place),set=new Set();
 for(const d of districts)for(const id of d.services)set.add(id);
 for(const [id,s] of Object.entries(data.services))if(s.tags.some(t=>tags.includes(t)))set.add(id);
 if(num(settle.familiarity)>=45)set.add('tavern');
 if(num(settle.standing)>=55)set.add('authority');
 return [...set].map(id=>({id,...data.services[id]})).filter(x=>x.label)
}
function price(serviceId,ctx={}){
 const base=data.services[serviceId]?.cost||1000,idx=Math.max(.65,num(ctx.priceIndex)||1),standing=clamp(num(ctx.standing),-100,100),familiarity=clamp(num(ctx.familiarity),0,100),heat=clamp(num(ctx.heat),0,100);
 const discount=clamp(standing*.0018+familiarity*.0011, -.08,.22),heatTax=heat*.0015;
 return Math.max(250,Math.round(base*idx*(1-discount+heatTax)/50)*50)
}
function visit(state,island,ctx={}){
 const s=normalizeState(state),r=settlement(s,island),first=r.visits===0;r.visits++;s.totalVisits++;r.lastVisitYear=num(ctx.year);r.familiarity=clamp(r.familiarity+(first?12:4)+Math.min(5,num(ctx.exploration)/20),0,100);r.standing=clamp(r.standing+(first?0:1),-100,100);s.islands[island]=r;
 return {state:s,record:r,first}
}
function serviceOutcome(state,island,serviceId,ctx={},roll=.5){
 const s=normalizeState(state),r=settlement(s,island),service=data.services[serviceId];if(!service)return {state:s,error:'unknown_service'};
 const cost=price(serviceId,{priceIndex:ctx.priceIndex,standing:r.standing,familiarity:r.familiarity,heat:r.heat});
 if(num(ctx.money)<cost)return {state:s,error:'insufficient_funds',cost};
 const fx={money:-cost,health:0,energy:0,ship:0,supplies:0,rep:0,heat:0,skill:null,skillGain:0,lead:false,contact:false,exploration:0};
 if(service.effect==='resources'){fx.supplies=10+Math.round(Number(roll)*8);fx.energy=2}
 if(service.effect==='health'){fx.health=10+Math.round(Number(roll)*8);fx.energy=5}
 if(service.effect==='ship'){fx.ship=12+Math.round(Number(roll)*12);fx.supplies=4}
 if(service.effect==='intel'){fx.rep=2;fx.contact=Number(roll)>.42;fx.lead=Number(roll)>.78;fx.exploration=3}
 if(service.effect==='training'){fx.skill='Combat';fx.skillGain=1.2+Number(roll)*1.6;fx.energy=-4}
 if(service.effect==='knowledge'){fx.skill=Number(roll)>.5?'Navigation':'Discrétion';fx.skillGain=.8+Number(roll)*1.3;fx.exploration=5}
 if(service.effect==='underworld'){fx.heat=4+Math.round(Number(roll)*5);fx.lead=Number(roll)>.48;fx.money+=Math.round(Number(roll)*2200);fx.rep=-1}
 if(service.effect==='authority'){fx.rep=2;fx.heat=-3;fx.contact=Number(roll)>.62}
 r.servicesUsed++;r.lastServiceYear=num(ctx.year);r.familiarity=clamp(r.familiarity+2,0,100);r.standing=clamp(r.standing+fx.rep,-100,100);r.heat=clamp(r.heat+fx.heat,0,100);if(fx.contact){r.contacts++;s.totalContacts++}
 s.totalServices++;s.totalSpent+=cost;s.islands[island]=r;s.history.unshift({year:num(ctx.year),island,serviceId,cost});s.history=s.history.slice(0,40);
 return {state:s,record:r,cost,effects:fx,service}
}
function monthlyDrift(state,island,ctx={}){
 const s=normalizeState(state),r=settlement(s,island);if(num(ctx.month)%6===0){r.heat=clamp(r.heat-(r.heat>20?2:1),0,100);if(r.standing>10)r.standing=clamp(r.standing-.5,-100,100);if(r.standing<10)r.standing=clamp(r.standing+.5,-100,100)}s.islands[island]=r;return {state:s,record:r}
}
function summary(state,island,place={},ctx={}){
 const s=normalizeState(state),r=settlement(s,island),districts=districtsFor(place),services=servicesFor(place,r);
 return {record:r,label:standingLabel(r.standing),districts,services,priceIndex:num(ctx.priceIndex)||1,totalVisits:s.totalVisits,totalServices:s.totalServices,totalContacts:s.totalContacts,totalSpent:s.totalSpent}
}
registry.register('settlementEngineV87',{version:'8.7.0',normalizeState,settlement,standingLabel,districtsFor,servicesFor,price,visit,serviceOutcome,monthlyDrift,summary});
})(window);
