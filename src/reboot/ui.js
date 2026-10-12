
import {ORIGINS,JOBS,SPECIAL} from './data.js';
import {SAVE_KEY,SCHEMA,createLife,transition,jobEligibility,specialEligibility,actionStatus,remaining,currentJob,currentSpecial,currentEvent} from './engine.js';
const app=document.getElementById('app');
let state=null,tab='life',careerView='jobs',selectedRelation=null,notice='';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=n=>Math.round(Number(n)||0).toLocaleString('fr-FR');
const button=(label,type,id='',disabled='',extra='')=>'<button type="button" class="action-btn" data-do="'+type+'" data-id="'+escapeHtml(id)+'" '+(disabled?'disabled':'')+' '+extra+'>'+label+'</button>';
const pill=(label)=>'<span class="pill">'+escapeHtml(label)+'</span>';
const card=(title,contents,cls='')=>'<section class="card '+cls+'"><h2>'+title+'</h2>'+contents+'</section>';
const stat=(label,n)=>'<div class="stat"><div class="stat-head"><span>'+label+'</span><strong>'+Math.round(n)+' %</strong></div><div class="meter"><span style="width:'+Math.max(0,Math.min(100,n))+'%"></span></div></div>';
function load(){try{const value=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return value&&value.schema===SCHEMA&&value.player&&Array.isArray(value.history)&&Array.isArray(value.relations)&&value.counts&&value.career?value:null;}catch{return null;}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{notice='La sauvegarde locale a échoué. Vérifie l’espace de stockage du navigateur.';return false;}}
function navigation(){const labels=[['life','Vie','⌂'],['activities','Activités','✦'],['relations','Relations','♥'],['career','Carrière','▣'],['profile','Profil','◉']];
 return '<nav class="bottom-nav" aria-label="Navigation">'+labels.map(([id,label,icon])=>
 '<button data-tab="'+id+'" class="'+(tab===id?'active':'')+'" aria-current="'+(tab===id?'page':'false')+'"><span aria-hidden="true">'+icon+'</span><small>'+label+'</small></button>').join('')+'</nav>';
}
function intro(){return '<div class="intro"><div class="intro-symbol">☠</div><p class="eyebrow">ONE PIECE LIFE · REBOOT</p><h1>Une vie. Mille destins.</h1><p>Une simulation de vie simple. Tu grandis, tu choisis, tu assumes les conséquences. Tout commence à la naissance.</p>'+
 '<form id="newLife"><label>Nom du personnage<input name="name" maxlength="40" placeholder="Aléatoire si vide" autocomplete="off"></label>'+
 '<label>Mer d’origine<select name="origin">'+ORIGINS.map(x=>'<option>'+escapeHtml(x)+'</option>').join('')+'</select></label>'+
 '<button type="submit" class="primary-btn">Commencer une nouvelle vie</button></form>'+
 '<p class="footnote">La nouvelle version utilise une sauvegarde vierge et indépendante. <a href="./classic.html">Retrouver l’ancienne version</a></p></div>';
}
function heading(){const p=state.player;return '<header class="topbar"><div><strong>ONE PIECE LIFE</strong><small>REBOOT · FONDATIONS</small></div><div class="top-age">'+state.age+' <small>ans</small></div></header>'+
 '<div class="identity"><div class="portrait">'+escapeHtml(p.name[0]||'?')+'</div><div><span class="eyebrow">'+escapeHtml(p.origin)+'</span><h1>'+escapeHtml(p.name)+'</h1><p>'+escapeHtml(state.career.special?'Carrière spéciale : '+currentSpecial(state).name:state.career.job?'Métier : '+currentJob(state).name:state.age<=17?'Enfance et formation':'Sans emploi')+'</p></div></div>'+
 '<div class="money-line"><span>Ton argent</span><strong>'+format(p.money)+' <small>Berry</small></strong></div>';
}
function eventCard(){const ev=currentEvent(state);if(!ev)return '';
 return card('Une décision t’attend','<p>'+escapeHtml(ev.text)+'</p><div class="action-stack">'+ev.choices.map(x=>
 button(escapeHtml(x.label)+' <span aria-hidden="true">›</span>','choose',x.id)).join('')+'</div>','event-card');
}
function history(){return '<div class="history">'+state.history.slice(0,14).map(h=>
 '<article class="history-item"><div class="history-age">'+h.age+' ans</div><div><strong>'+escapeHtml(h.title)+'</strong><p>'+escapeHtml(h.description)+'</p></div></article>').join('')+'</div>';}
function home(){return eventCard()+card('Comment vas-tu ?',
 '<div class="stat-grid">'+stat('Bonheur',state.player.happiness)+stat('Santé',state.player.health)+stat('Intelligence',state.player.intellect)+stat('Forme',state.player.fitness)+'</div>')+
 card('Ton quotidien','<div class="shortcuts">'+[['activities','Activités'],['career','Métier'],['relations','Relations']].map(([id,label])=>'<button data-tab="'+id+'" class="shortcut">'+label+' <span>›</span></button>').join('')+'</div>')+
 card('Ton histoire',history(),'story-card');}
function activities(){const options=[
 ['study','Étudier','Améliore ton intelligence.'],['exercise','Faire du sport','Améliore forme et santé.'],
 ['relax','Se détendre','Récupère du bonheur et de la santé.'],['work','Travailler davantage','Gagne une prime et progresse dans ton emploi.']];
 return card('Activités','<p class="muted">Des actions volontaires, avec des limites annuelles. Avancer d’un an renouvelle les possibilités.</p>'+
 '<div class="action-stack">'+options.map(([id,label,detail])=>{const gate=actionStatus(state,id);
 return '<div class="option"><div><strong>'+label+'</strong><small>'+detail+(gate?' · '+escapeHtml(gate):' · '+remaining(state,id)+' action(s) restante(s)')+'</small></div>'+
 button('Faire ›','activity',id,gate)+'</div>';}).join('')+'</div>');}
function relations(){
 const person=state.relations.find(x=>x.id===selectedRelation);
 if(person){const gate=actionStatus(state,'interact');
 return '<button class="back-btn" data-do="close-person">‹ Toutes les relations</button>'+
 card(escapeHtml(person.name),'<p>'+escapeHtml(person.role)+' · Lien '+person.bond+'/100</p>'+
 stat('Votre relation',person.bond)+
 '<div class="action-stack">'+
 button('Discuter','interact',person.id,gate,'data-method="talk"')+
 button('Offrir un cadeau · 100 Berry','interact',person.id,gate||state.player.money<100,'data-method="gift"')+
 '</div><p class="muted">Interactions restantes cette année : '+remaining(state,'interact')+'</p>');
 }
 const gate=actionStatus(state,'meet');
 return card('Tes relations','<p class="muted">Choisis une personne pour interagir directement avec elle.</p>'+
 '<div class="person-list">'+state.relations.map(x=>'<button class="person" data-person="'+escapeHtml(x.id)+'"><span class="person-avatar">'+escapeHtml(x.name[0])+'</span><span><strong>'+escapeHtml(x.name)+'</strong><small>'+escapeHtml(x.role)+' · Lien '+x.bond+'/100</small></span><span>›</span></button>').join('')+'</div>')+
 card('Faire une rencontre','<p class="muted">Élargis ton cercle de connaissances.</p>'+
 button('Rencontrer quelqu’un','meet','',gate));
}
function employment(){
 const j=currentJob(state);
 const info=j?card('Ton emploi actuel','<p><strong>'+escapeHtml(j.name)+'</strong> · Niveau '+state.career.job.level+'</p>'+
 '<p>Salaire annuel : '+format(Math.round(j.pay*(1+(state.career.job.level-1)*.12)))+' Berry</p>'+
 '<p class="muted">Progression '+state.career.job.xp+'/60 XP</p>'+
 '<div class="action-stack">'+button('Travailler davantage','activity','work',actionStatus(state,'work'))+
 button('Demander une augmentation','raise','',actionStatus(state,'raise'))+
 button('Démissionner','quit-job')+'</div>','job-current'):'';
 return info+card('Offres d’emploi','<p class="muted">Les métiers ordinaires ont des salaires, conditions d’embauche et promotions. Trois candidatures par année.</p>'+
 '<div class="offer-list">'+JOBS.map(j=>{const gate=jobEligibility(state,j);return '<div class="offer"><div><strong>'+escapeHtml(j.name)+'</strong><small>'+format(j.pay)+' Berry/an · Dès '+j.age+' ans</small>'+
 (gate?'<small class="lock">'+escapeHtml(gate)+'</small>':'')+'</div>'+
 button('Postuler','apply',j.id,gate)+'</div>';}).join('')+'</div>');
}
function special(){
 const current=currentSpecial(state);
 if(current){const c=state.career.special;
 return card(current.name,pill(c.method==='create'?'Ton équipage':'Parcours spécial')+
 '<p>Grade / niveau '+c.rank+' · Réputation '+c.reputation+'/100 · '+c.xp+'/55 XP</p>'+
 (c.id==='pirate'?'<p>Effectif : '+c.crew+' membre(s)</p>':'')+
 '<div class="action-stack">'+current.actions.map(a=>{const gate=actionStatus(state,'special')||(state.player.health<a.cost?'Santé insuffisante.':'');
 return button(escapeHtml(a.label)+' · Santé minimale '+a.cost,'special-action',a.id,gate);}).join('')+
 button('Quitter cette voie','special-leave')+'</div>','special-current');
 }
 return card('Carrières spéciales','<p class="muted">Des parcours indépendants des métiers ordinaires. Chacun possède ses propres actions et sa progression.</p>'+
 '<div class="offer-list">'+SPECIAL.map(c=>{const gate=specialEligibility(state,c);
 return '<div class="offer special-offer"><div><strong>'+escapeHtml(c.name)+'</strong><small>'+escapeHtml(c.subtitle)+'</small>'+
 (gate?'<small class="lock">'+escapeHtml(gate)+'</small>':'')+'</div>'+
 (c.id==='pirate'?'<div class="special-choices">'+button('Créer','special-join',c.id,gate,'data-method="create"')+
 button('Rejoindre','special-join',c.id,gate,'data-method="join"')+'</div>':
 button('Candidater','special-join',c.id,gate))+'</div>';}).join('')+'</div>');
}
function career(){return '<div class="segment" role="group" aria-label="Type de carrière">'+
 '<button data-career="jobs" aria-pressed="'+(careerView==='jobs')+'" class="'+(careerView==='jobs'?'selected':'')+'">Emplois ordinaires</button>'+
 '<button data-career="special" aria-pressed="'+(careerView==='special')+'" class="'+(careerView==='special'?'selected':'')+'">Carrières spéciales</button></div>'+
 (careerView==='jobs'?employment():special());}
function profile(){const p=state.player;return card('Ta vie','<div class="info-line"><span>Nom</span><strong>'+escapeHtml(p.name)+'</strong></div>'+
 '<div class="info-line"><span>Origine</span><strong>'+escapeHtml(p.origin)+'</strong></div>'+
 '<div class="info-line"><span>Âge</span><strong>'+state.age+' ans</strong></div>'+
 '<div class="info-line"><span>Prime</span><strong>'+format(p.bounty)+' Berry</strong></div>'+
 '<div class="info-line"><span>Notoriété</span><strong>'+p.fame+'/100</strong></div>')+
 card('Sauvegarde et version','<p>Cette V13 est indépendante de l’ancien jeu. Ta sauvegarde est locale et ne migre pas automatiquement.</p>'+
 '<a class="legacy-link" href="./classic.html">Ouvrir l’ancienne version</a>'+
 '<button class="danger-btn" data-do="new-life">Recommencer une vie vierge</button>'+
 '<p class="muted">Moteur V13.0 · Sauvegarde schéma '+SCHEMA+' · Pas de progression payante.</p>');
}
function ageButton(){
 const pending=!!state.pending;
 return '<div class="age-dock"><button type="button" data-do="'+(pending?'to-decision':'age')+'" class="age-btn">'+
 (pending?'Répondre à la décision':'Avancer d’un an')+
 '<small>'+(pending?'Un événement attend ton choix':'Passer à ton prochain anniversaire')+'</small></button></div>';
}
function render(){
 if(!state){app.innerHTML=intro();return;}
 const active=tab==='life'?home():tab==='activities'?activities():tab==='relations'?relations():tab==='career'?career():profile();
 app.innerHTML=heading()+'<main id="game-main"><div class="tab-title">'+
 '<span class="eyebrow">'+(tab==='career'?'Deux parcours indépendants':'Ton histoire, tes choix')+'</span>'+
 '<h2>'+({life:'Ta vie',activities:'Activités',relations:'Relations',career:'Carrière',profile:'Profil'}[tab])+'</h2></div>'+
 (notice?'<p role="status" class="toast">'+escapeHtml(notice)+'</p>':'')+
 (!state.alive?card('Fin de vie','<p>'+escapeHtml(state.player.name)+' est décédé(e) à '+state.age+' ans.</p>'+button('Nouvelle vie','new-life')):active)+
 '</main>'+(state.alive?ageButton():'')+navigation();
}
function submit(action){
 const out=transition(state,action);
 notice=out.result.message;
 if(out.result.ok){state=out.state;save();if(state.pending)tab='life';}
 render();
}
app.addEventListener('submit',e=>{
 if(e.target.id!=='newLife')return;
 e.preventDefault();const input=new FormData(e.target);
 state=createLife({name:input.get('name'),origin:input.get('origin')});
 tab='life';careerView='jobs';selectedRelation=null;notice='Une nouvelle vie commence.';save();render();
});
app.addEventListener('click',e=>{
 const el=e.target.closest('button');if(!el||el.disabled)return;
 if(el.dataset.tab){tab=el.dataset.tab;selectedRelation=null;notice='';render();window.scrollTo?.(0,0);return;}
 if(el.dataset.career){careerView=el.dataset.career;notice='';render();return;}
 if(el.dataset.person){selectedRelation=el.dataset.person;render();return;}
 const action=el.dataset.do;if(!action)return;
 if(action==='close-person'){selectedRelation=null;render();return;}
 if(action==='to-decision'){tab='life';render();window.scrollTo?.(0,0);return;}
 if(action==='new-life'){
  if(!window.confirm('Recommencer ? La sauvegarde V13 actuelle sera remplacée. L’ancienne version ne sera pas touchée.'))return;
  try{localStorage.removeItem(SAVE_KEY);}catch{}
  state=null;notice='';tab='life';selectedRelation=null;render();return;
 }
 if(action==='age')submit({type:'age'});
 else if(action==='activity')submit({type:'activity',id:el.dataset.id});
 else if(action==='apply')submit({type:'apply',id:el.dataset.id});
 else if(action==='quit-job')submit({type:'quit-job'});
 else if(action==='raise')submit({type:'raise'});
 else if(action==='special-join')submit({type:'special-join',id:el.dataset.id,method:el.dataset.method});
 else if(action==='special-action')submit({type:'special-action',id:el.dataset.id});
 else if(action==='special-leave')submit({type:'special-leave'});
 else if(action==='meet')submit({type:'meet'});
 else if(action==='interact')submit({type:'interact',id:el.dataset.id,method:el.dataset.method});
 else if(action==='choose')submit({type:'choose',id:el.dataset.id});
});
state=load();render();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
