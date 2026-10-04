(function(global){
'use strict';
const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
const data=registry.get('equipmentDataV89');if(!data)throw new Error('Equipment data V8.9 missing');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=v=>Number(v)||0,clone=o=>JSON.parse(JSON.stringify(o));
const slotKeys=Object.keys(data.slots);

function normalizeItem(item){
  const t=data.templates[item?.templateId];if(!t)return null;
  const rarity=data.rarities[item.rarity]?item.rarity:'common',quality=clamp(num(item.quality)||50,20,100);
  const maxDurability=clamp(Math.round(num(item.maxDurability)||60+quality*.28+data.rarities[rarity].tier*7),45,100);
  return {
    uid:String(item.uid||('item_'+Math.abs(Math.floor(num(item.created)||0)))),
    templateId:item.templateId,rarity,quality,
    durability:clamp(item.durability==null?maxDurability:num(item.durability),0,maxDurability),
    maxDurability,
    upgrades:clamp(Math.floor(num(item.upgrades)),0,3),
    origin:String(item.origin||'Inconnue'),
    source:String(item.source||'inconnu'),
    acquiredYear:Number.isFinite(Number(item.acquiredYear))?Number(item.acquiredYear):0
  };
}
function normalizeState(state={}){
  const items=(Array.isArray(state.items)?state.items:[]).map(normalizeItem).filter(Boolean).slice(0,24);
  const ids=new Set(items.map(x=>x.uid)),equipped={};
  for(const slot of slotKeys){const id=state.equipped?.[slot];equipped[slot]=ids.has(id)&&data.templates[items.find(x=>x.uid===id)?.templateId]?.slot===slot?id:null}
  return {
    version:1,items,equipped,
    totalLoot:Math.max(0,Math.floor(num(state.totalLoot))),
    totalBought:Math.max(0,Math.floor(num(state.totalBought))),
    totalSold:Math.max(0,Math.floor(num(state.totalSold))),
    totalRepairs:Math.max(0,Math.floor(num(state.totalRepairs))),
    totalUpgrades:Math.max(0,Math.floor(num(state.totalUpgrades))),
    legacyMigrated:!!state.legacyMigrated,
    purchasedOffers:Array.isArray(state.purchasedOffers)?state.purchasedOffers.map(String).slice(0,40):[],
    history:Array.isArray(state.history)?clone(state.history).slice(0,40):[]
  };
}
function rarityFor(ctx={},roll=.5){
  const danger=clamp(num(ctx.danger),0,100),exploration=clamp(num(ctx.exploration),0,100),power=clamp(num(ctx.power),0,100);
  const boost=danger*.0007+exploration*.00045+power*.00035+(ctx.source==='treasure'?.015:ctx.source==='mission'?.008:0);
  const legendary=clamp(.003+boost*.16,.003,.025),exceptional=clamp(.025+boost*.55,.025,.09),rare=clamp(.12+boost, .12,.28),fine=clamp(.38+boost*.5,.38,.58);
  if(roll<legendary)return'legendary';
  if(roll<legendary+exceptional)return'exceptional';
  if(roll<legendary+exceptional+rare)return'rare';
  if(roll<legendary+exceptional+rare+fine)return'fine';
  return'common';
}
function createItem(templateId,ctx={},rolls={}){
  const t=data.templates[templateId];if(!t)return null;
  const rolled=ctx.rarity&&data.rarities[ctx.rarity]?ctx.rarity:rarityFor(ctx,Number(rolls.rarity??.5));
  const rarity=t.consumable?(Number(rolls.rarity??.5)<.18?'fine':'common'):rolled;
  const tier=data.rarities[rarity].tier,quality=clamp(Math.round(42+tier*9+Number(rolls.quality??.5)*22+clamp(num(ctx.qualityBonus),0,12)),25,100);
  const maxDurability=clamp(Math.round(58+quality*.3+tier*7),45,100);
  return normalizeItem({uid:String(ctx.uid||('v89_'+templateId+'_'+Math.floor(Number(rolls.id??.5)*1e8))),templateId,rarity,quality,durability:maxDurability,maxDurability,upgrades:clamp(num(ctx.upgrades),0,3),origin:ctx.origin||'Inconnue',source:ctx.source||'inconnu',acquiredYear:num(ctx.year)});
}
function itemEffects(item){
  const i=normalizeItem(item);if(!i||i.durability<=0)return {};
  const t=data.templates[i.templateId],r=data.rarities[i.rarity],q=.72+i.quality*.0048,u=1+i.upgrades*.10,d=.45+.55*(i.durability/i.maxDurability),scale=r.mult*q*u*d,out={};
  for(const [k,v] of Object.entries(t.effects||{}))out[k]=+(num(v)*scale).toFixed(2);
  return out;
}
function effects(state){
  const s=normalizeState(state),out={offense:0,defense:0,mission:0,navigation:0,stealth:0,medicine:0,science:0,exploration:0,command:0,combat:0,sabre:0,tir:0};
  for(const slot of slotKeys){const id=s.equipped[slot],item=s.items.find(x=>x.uid===id);if(!item)continue;for(const [k,v] of Object.entries(itemEffects(item)))out[k]=(out[k]||0)+num(v)}
  out.damageMult=+clamp(1-out.defense*.021,.70,1).toFixed(3);
  out.missionBonus=+clamp(out.mission+out.defense*.55+out.offense*.35,0,10).toFixed(2);
  out.combatBonus=+clamp(out.offense+out.defense*.18,0,10).toFixed(2);
  return out;
}
function itemScore(item){
  const fx=itemEffects(item);return +Object.entries(fx).reduce((s,[k,v])=>s+num(v)*(k==='offense'||k==='defense'?1.35:1),0).toFixed(2)
}
function acquire(state,item,meta={}){
  const s=normalizeState(state),i=normalizeItem(item);if(!i)return {state:s,error:'invalid_item'};
  if(s.items.length>=24)return {state:s,error:'inventory_full'};
  if(s.items.some(x=>x.uid===i.uid))return {state:s,error:'duplicate'};
  s.items.push(i);if(meta.loot)s.totalLoot++;if(meta.bought)s.totalBought++;
  if(i.source)s.history.unshift({type:meta.loot?'loot':meta.bought?'buy':'acquire',uid:i.uid,templateId:i.templateId,year:i.acquiredYear,origin:i.origin});
  s.history=s.history.slice(0,40);
  const slot=data.templates[i.templateId]?.slot;if(slot&&!s.equipped[slot])s.equipped[slot]=i.uid;
  return {state:s,item:i,autoEquipped:!!(slot&&s.equipped[slot]===i.uid)}
}
function equip(state,uid){
  const s=normalizeState(state),item=s.items.find(x=>x.uid===uid);if(!item)return {state:s,error:'missing_item'};
  const slot=data.templates[item.templateId]?.slot;if(!slot)return {state:s,error:'not_equippable'};
  s.equipped[slot]=uid;return {state:s,item,slot}
}
function unequip(state,slot){
  const s=normalizeState(state);if(!slotKeys.includes(slot))return {state:s,error:'invalid_slot'};s.equipped[slot]=null;return {state:s}
}
function remove(state,uid){
  const s=normalizeState(state),item=s.items.find(x=>x.uid===uid);if(!item)return {state:s,error:'missing_item'};
  for(const slot of slotKeys)if(s.equipped[slot]===uid)s.equipped[slot]=null;
  s.items=s.items.filter(x=>x.uid!==uid);return {state:s,item}
}
function wear(state,amount=1,slots=['weapon','outfit']){
  const s=normalizeState(state),changed=[],broken=[];
  for(const slot of slots){const uid=s.equipped[slot],item=s.items.find(x=>x.uid===uid);if(!item)continue;const loss=Math.max(1,Math.round(num(amount)*(slot==='weapon'?1:.75)));item.durability=clamp(item.durability-loss,0,item.maxDurability);changed.push({uid:item.uid,slot,loss,durability:item.durability});if(item.durability<=0)broken.push(item.uid)}
  return {state:s,changed,broken}
}
function repairCost(item,priceIndex=1){
  const i=normalizeItem(item);if(!i)return 0;const t=data.templates[i.templateId],r=data.rarities[i.rarity],missing=Math.max(0,i.maxDurability-i.durability);
  return missing?Math.max(100,Math.round(t.baseValue*r.value*(missing/i.maxDurability)*.34*Math.max(.7,num(priceIndex)||1)/50)*50):0
}
function repair(state,uid,ctx={}){
  const s=normalizeState(state),item=s.items.find(x=>x.uid===uid);if(!item)return {state:s,error:'missing_item'};
  const cost=repairCost(item,ctx.priceIndex);if(cost<=0)return {state:s,error:'not_needed',cost:0};
  if(num(ctx.money)<cost)return {state:s,error:'insufficient_funds',cost};
  item.durability=item.maxDurability;s.totalRepairs++;s.history.unshift({type:'repair',uid,templateId:item.templateId,cost,year:num(ctx.year)});s.history=s.history.slice(0,40);
  return {state:s,item,cost,moneyDelta:-cost}
}
function upgradeCost(item,priceIndex=1){
  const i=normalizeItem(item);if(!i||i.upgrades>=3)return 0;const t=data.templates[i.templateId],r=data.rarities[i.rarity];
  return Math.max(1000,Math.round(t.baseValue*r.value*(.55+i.upgrades*.38)*Math.max(.7,num(priceIndex)||1)/100)*100)
}
function upgrade(state,uid,ctx={}){
  const s=normalizeState(state),item=s.items.find(x=>x.uid===uid);if(!item)return {state:s,error:'missing_item'};
  if(item.upgrades>=3)return {state:s,error:'max_upgrade',cost:0};
  const cost=upgradeCost(item,ctx.priceIndex);if(num(ctx.money)<cost)return {state:s,error:'insufficient_funds',cost};
  item.upgrades++;item.quality=clamp(item.quality+4,20,100);item.maxDurability=clamp(item.maxDurability+3,45,100);item.durability=Math.max(item.durability,item.maxDurability*.75);
  s.totalUpgrades++;s.history.unshift({type:'upgrade',uid,templateId:item.templateId,cost,year:num(ctx.year),upgrades:item.upgrades});s.history=s.history.slice(0,40);
  return {state:s,item,cost,moneyDelta:-cost}
}
function use(state,uid){
  const s=normalizeState(state),item=s.items.find(x=>x.uid===uid);if(!item)return {state:s,error:'missing_item'};
  const t=data.templates[item.templateId];if(!t?.consumable)return {state:s,error:'not_consumable'};
  const fx=clone(t.use||{});const removed=remove(s,uid);return {state:removed.state,item,effects:fx}
}
function saleValue(item,ctx={}){
  const i=normalizeItem(item);if(!i)return 0;const t=data.templates[i.templateId],r=data.rarities[i.rarity],condition=.4+.6*(i.durability/i.maxDurability),standing=clamp(num(ctx.standing),-100,100);
  return Math.max(100,Math.round(t.baseValue*r.value*(.42+standing*.0012)*condition*Math.max(.7,num(ctx.priceIndex)||1)/50)*50)
}
function marketPrice(item,ctx={}){
  const i=normalizeItem(item);if(!i)return 0;const t=data.templates[i.templateId],r=data.rarities[i.rarity],standing=clamp(num(ctx.standing),-100,100),familiarity=clamp(num(ctx.familiarity),0,100),heat=clamp(num(ctx.heat),0,100);
  const relation=clamp(1-standing*.001-familiarity*.0005+heat*.0012,.84,1.18);
  return Math.max(250,Math.round(t.baseValue*r.value*(.82+i.quality*.0045)*relation*Math.max(.7,num(ctx.priceIndex)||1)/50)*50)
}
function candidateTemplates(place={},includeConsumables=true){
  const tags=Array.isArray(place.tags)?place.tags:[],scored=Object.entries(data.templates).filter(([id,t])=>id!=='legacy_protection'&& (includeConsumables||!t.consumable)).map(([id,t])=>({id,t,score:(t.tags||[]).filter(x=>tags.includes(x)||x===place.region).length}));
  return scored.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
}
function shopOffers(place={},ctx={},rolls=[]){
  const pool=candidateTemplates(place,true),used=new Set(),out=[],count=Math.min(4,pool.length);
  for(let i=0;i<count;i++){
    const roll=rolls[i]||{},top=pool.filter(x=>!used.has(x.id)),weighted=top.filter(x=>x.score>0),src=weighted.length?weighted:top;
    const pick=src[Math.min(src.length-1,Math.floor(clamp(Number(roll.pick??.5),0,.999999)*src.length))];if(!pick)continue;used.add(pick.id);
    const uid=String(ctx.offerPrefix||'offer')+'_'+i+'_'+pick.id;
    const item=createItem(pick.id,{...ctx,uid,source:'market',origin:ctx.island||place.region||'Marché',qualityBonus:2},{rarity:Number(roll.rarity??.65),quality:Number(roll.quality??.55),id:Number(roll.id??.5)});
    out.push({id:uid,item,price:marketPrice(item,ctx),template:pick.t})
  }
  return out
}
function bestForSlot(state,slot){
  const s=normalizeState(state);return s.items.filter(x=>data.templates[x.templateId]?.slot===slot&&x.durability>0).sort((a,b)=>itemScore(b)-itemScore(a))[0]||null
}
function autoEquip(state){
  let s=normalizeState(state);for(const slot of slotKeys){const best=bestForSlot(s,slot);if(best)s.equipped[slot]=best.uid}return {state:s,effects:effects(s)}
}
function summary(state){
  const s=normalizeState(state),fx=effects(s);return {state:s,effects:fx,count:s.items.length,equippedCount:slotKeys.filter(k=>s.equipped[k]).length,broken:s.items.filter(x=>x.durability<=0).length,slots:slotKeys.map(slot=>({slot,item:s.items.find(x=>x.uid===s.equipped[slot])||null}))}
}
registry.register('equipmentEngineV89',{version:'8.9.0',normalizeState,normalizeItem,rarityFor,createItem,itemEffects,effects,itemScore,acquire,equip,unequip,remove,wear,repairCost,repair,upgradeCost,upgrade,use,saleValue,marketPrice,candidateTemplates,shopOffers,bestForSlot,autoEquip,summary});
})(window);
