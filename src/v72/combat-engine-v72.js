(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');
  const data=registry.get('combatTechniquesV72');if(!data)throw new Error('Combat techniques V7.2 missing');

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const num=v=>Number(v)||0;
  const haki=(f,k)=>num(f?.haki?.[k]?.mastery ?? f?.haki?.[k]);
  const fruitType=f=>String(f?.devilFruit?.type||f?.fruit?.type||'');
  const fruitMastery=f=>num(f?.devilFruit?.mastery ?? f?.fruit?.mastery);
  const style=f=>String(f?.combatStyle?.primary||f?.style||'Équilibré');
  const doctrine=f=>String(f?.combatV72?.doctrine||f?.doctrine||'balanced');

  function meets(t,f){
    const r=t.requires||{};
    if(r.skill!=null&&num(f?.skills?.[t.skill])<r.skill)return false;
    if(r.stat!=null&&num(f?.stats?.[t.stat])<r.stat)return false;
    if(r.haki&&haki(f,r.haki)<num(r.mastery))return false;
    if(r.fruit&&fruitType(f)!==r.fruit)return false;
    if(r.fruitAny&&!fruitType(f))return false;
    if((r.fruit||r.fruitAny)&&fruitMastery(f)<num(r.mastery))return false;
    return true
  }

  function available(f,phase){
    return data.techniques.filter(t=>t.phases.includes(phase)&&t.styles.includes(style(f))&&meets(t,f))
  }

  function powerInteractions(self,other){
    const effects=[];let attack=0,guard=0;
    const obs=haki(self,'Observation'),arm=haki(self,'Armement'),conq=haki(self,'Conquérant');
    const enemyObs=haki(other,'Observation'),enemyArm=haki(other,'Armement');
    const otherFruit=fruitType(other);

    if(obs>enemyObs+12){attack+=2.5;guard+=2;effects.push('Observation supérieure')}
    if(otherFruit==='Logia'){
      if(arm>=18){attack+=6+arm*.025;effects.push('Armement contre Logia')}
      else{attack-=10;effects.push('Logia difficile à toucher')}
    }
    if(fruitType(self)==='Logia'&&enemyArm<18){guard+=8;effects.push('Intangibilité Logia')}
    if(fruitType(self)==='Zoan'){guard+=2+fruitMastery(self)*.025;effects.push('Endurance Zoan')}
    if(fruitType(self)==='Paramecia'){attack+=1+fruitMastery(self)*.02;effects.push('Polyvalence Paramecia')}

    const enemyWill=num(other?.stats?.Volonté)||num(other?.will)||num(other?.power);
    if(conq>=28&&conq>enemyWill*.72){
      attack+=clamp((conq-enemyWill*.5)/18,1,6);
      effects.push('Pression du Conquérant')
    }
    return {attack,guard,effects}
  }

  function styleModifier(self,other){
    return num(data.styleMatchups[style(self)]?.[style(other)])
  }

  function techniqueScore(t,self,other,phase,ctx={}){
    const skill=num(self?.skills?.[t.skill]),stat=num(self?.stats?.[t.stat]);
    const d=data.doctrines[doctrine(self)]||data.doctrines.balanced;
    const interactions=powerInteractions(self,other);
    let score=num(t.base)+skill*.08+stat*.055+styleModifier(self,other)+interactions.attack;

    if(t.tags.includes('guard'))score+=d.guard;
    else score+=d.attack;
    if(t.tags.includes('precision')&&haki(self,'Observation')>=25)score+=3;
    if(t.tags.includes('armament'))score+=haki(self,'Armement')*.035;
    if(t.tags.includes('observation'))score+=haki(self,'Observation')*.035;
    if(t.tags.includes('conqueror'))score+=haki(self,'Conquérant')*.04;
    if(t.tags.includes('fruit'))score+=fruitMastery(self)*.025;
    if(phase==='finish'&&t.tags.includes('finisher'))score+=4;
    if(ctx.range==='long'&&t.tags.includes('ranged'))score+=4;
    if(ctx.range==='long'&&t.tags.includes('close'))score-=5;

    return score-num(t.risk)*.35
  }

  function selectTechnique(self,other,phase,ctx={}){
    const pool=available(self,phase);
    if(!pool.length)return data.techniques[0];
    return pool
      .map(t=>({t,score:techniqueScore(t,self,other,phase,ctx)}))
      .sort((a,b)=>b.score-a.score||a.t.id.localeCompare(b.t.id))[0].t
  }

  function syntheticEnemy(enemy={}){
    const p=Math.max(1,num(enemy.power));
    const st=enemy.style||enemy.combatStyle?.primary||(p>62?'Équilibré':p>42?'Corps-à-corps':'Équilibré');
    const h={
      Observation:{mastery:num(enemy.haki?.Observation?.mastery)||(p>55?(p-48)*.55:0)},
      Armement:{mastery:num(enemy.haki?.Armement?.mastery)||(p>60?(p-54)*.5:0)},
      Conquérant:{mastery:num(enemy.haki?.Conquérant?.mastery)||0}
    };
    return {
      ...enemy,power:p,style:st,combatStyle:enemy.combatStyle||{primary:st},
      skills:enemy.skills||{Combat:p*.72,Sabre:0,Tir:0},
      stats:enemy.stats||{Force:p*.72,Vitesse:p*.70,Agilité:p*.68,Endurance:p*.74,Résistance:p*.74,Réflexes:p*.70,Volonté:p*.70},
      haki:h,combatV72:enemy.combatV72||{doctrine:'balanced'}
    }
  }

  function enhance(base,self,enemyRaw,ctx={}){
    const enemy=syntheticEnemy(enemyRaw);
    const d=data.doctrines[doctrine(self)]||data.doctrines.balanced;
    const selfInt=powerInteractions(self,enemy),enemyInt=powerInteractions(enemy,self);
    const sm=styleModifier(self,enemy),em=styleModifier(enemy,self);
    const phases=['opening','pressure','finish'],out={};

    for(const phase of phases){
      const tech=selectTechnique(self,enemy,phase,ctx),foe=selectTechnique(enemy,self,phase,ctx);
      const techGap=techniqueScore(tech,self,enemy,phase,ctx)-techniqueScore(foe,enemy,self,phase,ctx);
      const legacy=num(base?.[phase] ?? .5);
      const phaseBias=phase==='opening'
        ? selfInt.guard-enemyInt.guard
        : phase==='finish'
          ? d.guard*.35
          : d.attack*.25;
      const chance=clamp(legacy+(techGap+sm-em+phaseBias)/180,.08,.94);
      out[phase]={
        chance:+chance.toFixed(3),
        technique:{id:tech.id,name:tech.name,tags:tech.tags},
        enemyTechnique:{id:foe.id,name:foe.name},
        modifier:+((chance-legacy)*100).toFixed(1)
      }
    }

    const a=out.opening.chance,b=out.pressure.chance,c=out.finish.chance;
    const winEstimate=clamp(a*b+a*c+b*c-2*a*b*c,.03,.97);
    return {
      version:'7.2.0',phases:out,opening:a,pressure:b,finish:c,
      winEstimate:+winEstimate.toFixed(3),
      matchup:{
        playerStyle:style(self),enemyStyle:style(enemy),styleModifier:sm,
        interactions:selfInt.effects,enemyInteractions:enemyInt.effects
      },
      doctrine:data.doctrines[doctrine(self)]?.label||'Équilibrée'
    }
  }

  function resolve(assessment,rolls={}){
    const p=assessment?.phases||{},result={};let wins=0;
    for(const phase of ['opening','pressure','finish']){
      const r=Number(rolls[phase]);
      const ok=Number.isFinite(r)?r<num(p[phase]?.chance):false;
      result[phase]=ok;if(ok)wins++
    }
    return {phases:result,phasesWon:wins,outcome:wins===3?'decisive':wins>=2?'win':'defeat'}
  }

  registry.register('combatEngineV72',{
    version:'7.2.0',available,selectTechnique,powerInteractions,styleModifier,
    syntheticEnemy,enhance,resolve
  });
})(window);
