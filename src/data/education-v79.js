(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const tracks={
    general:{
      label:'Formation générale',icon:'◈',desc:'Bases polyvalentes, discipline, lecture du monde et autonomie.',
      skills:{Navigation:.22,Commandement:.18,Médecine:.12,Science:.18,Discrétion:.08},
      stats:{Discipline:.36,Volonté:.22,Réflexes:.10},
      careers:{civil:.82,marine:.66,government:.58,revolution:.54,hunter:.44,pirate:.42}
    },
    martial:{
      label:'Dojo & arts martiaux',icon:'拳',desc:'Combat, contrôle du corps, réflexes et discipline martiale.',
      skills:{Combat:.55,Sabre:.20,Tir:.08,Commandement:.06},
      stats:{Réflexes:.30,Discipline:.24,Endurance:.18,Force:.16,Volonté:.12},
      careers:{marine:.82,hunter:.80,pirate:.76,revolution:.65,government:.52,civil:.34}
    },
    navigation:{
      label:'Apprentissage maritime',icon:'⌁',desc:'Navigation, météo, routes, autonomie en mer et observation.',
      skills:{Navigation:.62,Discrétion:.12,Commandement:.10,Science:.08},
      stats:{Réflexes:.28,Discipline:.24,Endurance:.13,Volonté:.10},
      careers:{pirate:.84,civil:.83,hunter:.58,marine:.62,revolution:.55,government:.35}
    },
    medicine:{
      label:'Médecine & soins',icon:'✚',desc:'Premiers soins, observation, rigueur et connaissances du vivant.',
      skills:{Médecine:.62,Science:.26,Commandement:.06},
      stats:{Discipline:.34,Volonté:.20,Réflexes:.14},
      careers:{civil:.92,marine:.65,revolution:.67,pirate:.55,government:.48,hunter:.32}
    },
    science:{
      label:'Sciences & techniques',icon:'⚗',desc:'Observation, expérimentation, compréhension et résolution de problèmes.',
      skills:{Science:.62,Médecine:.16,Navigation:.12,Discrétion:.06},
      stats:{Discipline:.38,Volonté:.16,Réflexes:.10},
      careers:{civil:.94,government:.68,marine:.55,revolution:.56,pirate:.38,hunter:.30}
    },
    craft:{
      label:'Artisanat & commerce',icon:'⚒',desc:'Travail pratique, négociation, ressources et savoir-faire local.',
      skills:{Commandement:.30,Navigation:.20,Science:.16,Discrétion:.08},
      stats:{Discipline:.34,Endurance:.18,Volonté:.16},
      careers:{civil:.90,pirate:.58,hunter:.52,marine:.45,revolution:.48,government:.42}
    },
    survival:{
      label:'Survie & exploration',icon:'◇',desc:'Terrain, discrétion, orientation, résistance et initiative.',
      skills:{Discrétion:.38,Navigation:.32,Combat:.14},
      stats:{Réflexes:.26,Endurance:.24,Résistance:.18,Volonté:.14},
      careers:{hunter:.82,pirate:.78,revolution:.70,marine:.58,civil:.52,government:.40}
    },
    service:{
      label:'Préparation au service',icon:'⚓',desc:'Discipline, commandement, entraînement et compréhension des institutions maritimes.',
      skills:{Commandement:.34,Combat:.28,Discrétion:.14,Navigation:.08},
      stats:{Discipline:.42,Volonté:.20,Réflexes:.14,Endurance:.10},
      careers:{marine:.94,government:.86,revolution:.32,pirate:.28,hunter:.44,civil:.46}
    }
  };

  const focuses={
    balanced:{label:'Équilibrer',desc:'Progression régulière en théorie et pratique.',knowledge:1,practical:1,discipline:.6,confidence:.4,energy:0},
    theory:{label:'Étudier sérieusement',desc:'Favorise connaissances et examens.',knowledge:1.55,practical:.55,discipline:.9,confidence:.1,energy:4},
    practice:{label:'Pratiquer sur le terrain',desc:'Favorise savoir-faire et compétences.',knowledge:.55,practical:1.6,discipline:.35,confidence:.5,energy:6},
    social:{label:'Apprendre avec les autres',desc:'Réseau, assurance et commandement.',knowledge:.7,practical:.75,discipline:.25,confidence:1.5,energy:3},
    recover:{label:'Lever le pied',desc:'Moins de progression, meilleure récupération.',knowledge:.45,practical:.45,discipline:.15,confidence:.25,energy:-7}
  };

  const milestones={
    basics:{age:8,label:'Bases acquises',difficulty:34,weight:{knowledge:.38,practical:.20,discipline:.28,confidence:.14}},
    foundation:{age:10,label:'Évaluation de fondation',difficulty:46,weight:{knowledge:.34,practical:.24,discipline:.28,confidence:.14}},
    orientation:{age:13,label:'Épreuve d’orientation',difficulty:57,weight:{knowledge:.28,practical:.34,discipline:.22,confidence:.16}},
    transition:{age:15,label:'Bilan de formation',difficulty:66,weight:{knowledge:.28,practical:.34,discipline:.22,confidence:.16}}
  };

  const events={
    mentor:{
      label:'Un formateur te remarque',minAge:8,
      text:'Une personne expérimentée remarque ta manière d’apprendre et te propose de te pousser davantage.',
      choices:{
        accept:{label:'Accepter son exigence',effects:{knowledge:4,practical:4,discipline:3,confidence:2,mentor:true,energy:-3}},
        cautious:{label:'Apprendre sans te surcharger',effects:{knowledge:3,practical:2,discipline:2,confidence:1}},
        refuse:{label:'Continuer seul',effects:{confidence:2,discipline:-1}}
      }
    },
    rivalry:{
      label:'Rivalité de jeunesse',minAge:9,
      text:'Quelqu’un de ton âge commence à se mesurer régulièrement à toi. Cette rivalité peut devenir un moteur ou une distraction.',
      choices:{
        compete:{label:'Entrer dans la compétition',effects:{practical:4,confidence:4,discipline:-1,stress:3}},
        respect:{label:'Transformer ça en émulation',effects:{practical:3,knowledge:2,confidence:2,discipline:2}},
        ignore:{label:'Rester concentré sur toi',effects:{knowledge:2,discipline:2}}
      }
    },
    field:{
      label:'Épreuve pratique',minAge:10,
      text:'Une situation réelle t’oblige à appliquer ce que tu as appris, loin des exercices propres et rassurants.',
      choices:{
        lead:{label:'Prendre l’initiative',effects:{practical:5,confidence:4,discipline:1,energy:-4}},
        observe:{label:'Observer puis agir',effects:{knowledge:3,practical:3,discipline:2,energy:-2}},
        avoid:{label:'Éviter le risque',effects:{knowledge:1,confidence:-2}}
      }
    },
    setback:{
      label:'Période difficile',minAge:8,
      text:'Fatigue, contraintes familiales ou manque de moyens ralentissent ta progression. Le talent, scandaleusement, ne remplit pas les journées à ta place.',
      choices:{
        persist:{label:'Continuer malgré tout',effects:{discipline:5,knowledge:2,practical:2,energy:-5,stress:4}},
        adapt:{label:'Adapter ton rythme',effects:{discipline:2,knowledge:2,practical:1,stress:-2}},
        pause:{label:'Faire une vraie pause',effects:{confidence:-1,energy:7,stress:-5}}
      }
    },
    sponsor:{
      label:'Soutien inattendu',minAge:11,
      text:'Un adulte, un atelier ou une petite organisation propose de soutenir ta formation.',
      choices:{
        accept:{label:'Accepter ce soutien',effects:{knowledge:4,practical:3,confidence:3,sponsor:true}},
        independence:{label:'Refuser pour rester indépendant',effects:{confidence:4,discipline:2}},
        share:{label:'Partager l’opportunité',effects:{confidence:2,network:4,knowledge:2}}
      }
    },
    discovery:{
      label:'Déclic d’apprentissage',minAge:7,
      text:'Tu découvres une manière de travailler qui correspond particulièrement bien à ton esprit.',
      choices:{
        deepen:{label:'Creuser cette méthode',effects:{knowledge:5,discipline:3}},
        apply:{label:'La mettre immédiatement en pratique',effects:{practical:5,confidence:2}},
        balance:{label:'Garder un équilibre',effects:{knowledge:3,practical:3}}
      }
    }
  };

  const careerLabels={
    marine:'Marine',pirate:'Pirates',civil:'Voie civile',hunter:'Chasseurs de primes',revolution:'Révolutionnaires',government:'Gouvernement'
  };

  registry.register('educationDataV79',{version:'7.9.0',tracks,focuses,milestones,events,careerLabels});
})(window);
