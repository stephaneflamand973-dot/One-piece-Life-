(function(global){
  'use strict';
  const registry=global.OPL_MODULES;if(!registry)throw new Error('OPL module registry missing');

  const housing={
    family_home:{label:'Foyer familial',tier:0,purchase:0,upkeep:0,stability:58,condition:78,ageMin:0,owner:false},
    faction_quarters:{label:'Logement de faction',tier:1,purchase:0,upkeep:1800,stability:56,condition:72,ageMin:16,owner:false},
    rented_room:{label:'Chambre / petit logement',tier:1,purchase:0,upkeep:4800,stability:52,condition:70,ageMin:18,owner:false},
    modest_home:{label:'Maison modeste',tier:2,purchase:32000,upkeep:5200,stability:68,condition:82,ageMin:18,owner:true},
    comfortable_home:{label:'Maison confortable',tier:3,purchase:92000,upkeep:9800,stability:80,condition:88,ageMin:20,owner:true},
    estate:{label:'Grande propriété',tier:4,purchase:260000,upkeep:19000,stability:91,condition:94,ageMin:24,owner:true}
  };

  const factionHousingLabels={
    Pirates:'Cabine / quartier d’équipage',
    Marine:'Quartiers de la Marine',
    Révolutionnaires:'Planque sécurisée',
    Gouvernement:'Logement de fonction',
    'Chasseurs de primes':'Pension de chasseurs',
    Civil:'Logement fourni'
  };

  const householdActions={
    family_time:{label:'Consacrer du temps à la famille',cost:0,energy:5,bond:8,stability:4,stress:-5},
    repair:{label:'Entretenir le logement',cost:4500,energy:2,condition:14,stability:3,stress:-3},
    reserve:{label:'Constituer une réserve du foyer',cost:6500,energy:0,reserve:6500,stability:5,stress:-4},
    community:{label:'Renforcer le voisinage',cost:1800,energy:4,bond:2,stability:3,repLocal:2}
  };

  const personalEvents={
    independence:{
      label:'Prendre ton indépendance',
      minAge:18,priority:95,
      text:'Ton foyer d’origine n’est plus forcément l’endroit où ta vie doit rester organisée. Tu peux chercher ton propre espace ou conserver cette stabilité encore un temps.',
      choices:[
        {id:'leave',label:'Prendre un logement',hint:'Coût réel, mais davantage d’autonomie.',effects:{independent:true,move:'rented_room',bond:-1,stability:3}},
        {id:'faction',label:'Utiliser un logement de faction',hint:'Disponible si ta carrière le permet.',requires:'factionHousing',effects:{independent:true,move:'faction_quarters',bond:0,stability:1}},
        {id:'stay',label:'Rester au foyer familial',hint:'Économique, mais indépendance reportée.',effects:{bond:2,stress:2}}
      ]
    },
    family_request:{
      label:'La famille a besoin de toi',
      minAge:16,priority:58,
      text:'Un besoin concret apparaît dans ta famille. Ce n’est pas une catastrophe mondiale, donc naturellement personne n’écrira de journal dessus, mais ton choix laissera une trace.',
      choices:[
        {id:'help',label:'Aider financièrement',hint:'Coûte des Berry, renforce fortement le lien.',effects:{money:-4500,bond:9,stability:2,stress:2}},
        {id:'time',label:'Donner du temps plutôt que de l’argent',hint:'Coûte de l’énergie.',effects:{energy:-7,bond:6,stress:1}},
        {id:'decline',label:'Refuser cette fois',hint:'Protège tes ressources.',effects:{bond:-6,stress:-1}}
      ]
    },
    reunion:{
      label:'Retrouvailles familiales',
      minAge:14,priority:38,
      text:'Une occasion rare permet de retrouver ta famille ou ceux qui ont tenu ce rôle dans ta vie.',
      choices:[
        {id:'go',label:'Être présent',hint:'Renforce le lien et réduit la pression personnelle.',effects:{energy:-3,bond:7,stress:-5}},
        {id:'brief',label:'Passer rapidement',hint:'Un compromis.',effects:{energy:-1,bond:3,stress:-2}},
        {id:'skip',label:'Ne pas y aller',hint:'Aucune dépense immédiate.',effects:{bond:-3,stress:1}}
      ]
    },
    home_repair:{
      label:'Le logement se dégrade',
      minAge:18,priority:72,
      text:'Le logement réclame de l’entretien. Les murs ont cette fâcheuse habitude de ne pas respecter les grandes ambitions de leurs occupants.',
      choices:[
        {id:'repair',label:'Réparer correctement',hint:'Dépense importante, forte récupération de condition.',effects:{money:-6000,condition:22,stability:4,stress:-3}},
        {id:'patch',label:'Faire le minimum',hint:'Moins cher, résultat limité.',effects:{money:-2200,condition:9,stability:1}},
        {id:'ignore',label:'Reporter',hint:'Risque d’aggraver le problème.',effects:{condition:-8,stability:-5,stress:6}}
      ]
    },
    new_contact:{
      label:'Une rencontre personnelle',
      minAge:18,priority:42,
      text:'Une personne rencontrée en dehors de tes obligations habituelles commence à compter. Tu peux laisser cette proximité évoluer ou la garder simplement amicale.',
      choices:[
        {id:'explore',label:'Explorer cette relation',hint:'Ouvre une relation de couple potentielle.',effects:{createPartner:true,partnership:'dating',stability:2}},
        {id:'friend',label:'Rester proches sans former de couple',hint:'Crée une relation importante, sans engagement romantique.',effects:{createContact:true,stability:1}},
        {id:'distance',label:'Garder tes distances',hint:'Aucune nouvelle relation structurante.',effects:{stress:-1}}
      ]
    },
    commitment:{
      label:'Construire quelque chose à deux',
      minAge:20,priority:70,
      text:'Ta relation a atteint un point où vous pouvez décider d’en faire un véritable foyer commun plutôt qu’une succession de bons moments entre deux catastrophes mondiales.',
      choices:[
        {id:'commit',label:'Construire un foyer commun',hint:'Renforce le couple et le foyer.',effects:{partnership:'committed',stability:9,partnerTrust:7,partnerLoyalty:8}},
        {id:'wait',label:'Prendre encore du temps',hint:'La relation continue sans nouvel engagement.',effects:{partnerTrust:1}},
        {id:'end',label:'Mettre fin à la relation',hint:'Décision nette, effets relationnels importants.',effects:{partnership:'single',stability:-5,stress:8,partnerTrust:-12,partnerAffection:-14}}
      ]
    },
    household_growth:{
      label:'Agrandir le foyer',
      minAge:22,priority:55,
      text:'Votre foyer est assez stable pour envisager d’accueillir un enfant. Ce choix augmente durablement les responsabilités, les coûts et les liens familiaux.',
      choices:[
        {id:'welcome',label:'Accueillir un enfant',hint:'Nouvelle responsabilité durable.',effects:{addChild:true,stability:4,stress:7,bond:4}},
        {id:'later',label:'Pas maintenant',hint:'Aucun changement majeur.',effects:{stability:1}},
        {id:'never',label:'Ne pas poursuivre cette voie',hint:'Désactive cette proposition pour le foyer actuel.',effects:{closeGrowth:true}}
      ]
    },
    caregiving:{
      label:'Responsabilité familiale',
      minAge:30,priority:48,
      text:'Quelqu’un de ta famille a besoin d’un soutien plus régulier. La question n’est plus seulement affective : elle touche ton temps, ton énergie et tes ressources.',
      choices:[
        {id:'take_on',label:'Prendre cette responsabilité',hint:'Coût annuel supplémentaire, lien renforcé.',effects:{dependent:1,bond:8,stress:7}},
        {id:'fund',label:'Financer de l’aide',hint:'Coûte des Berry mais limite la charge personnelle.',effects:{money:-9000,bond:5,stress:2}},
        {id:'decline',label:'Ne pas pouvoir assumer',hint:'Protège tes ressources, fragilise le lien.',effects:{bond:-7,stress:2}}
      ]
    },
    inheritance:{
      label:'Transmission familiale',
      minAge:28,priority:24,
      text:'Une transmission inattendue arrive jusqu’à toi. Ce n’est pas une fortune de Tenryūbito, mais assez pour modifier ton foyer.',
      choices:[
        {id:'keep',label:'Conserver la transmission',hint:'Apporte des Berry au foyer.',effects:{money:18000,reserve:5000,bond:2}},
        {id:'share',label:'Partager avec la famille',hint:'Gain financier plus faible, lien renforcé.',effects:{money:9000,bond:8}},
        {id:'invest_home',label:'L’investir dans le logement',hint:'Améliore condition et stabilité.',effects:{money:6000,condition:16,stability:6}}
      ]
    }
  };

  const names=['Ari Vale','Noa Rinn','Mika Sol','Sora Venn','Eden Mare','Lio Arden','Neri Cove','Kai Rowan','Mira Dawn','Rin Hale','Aven Reef','Nilo Voss'];
  const temperaments=['Calme','Loyaliste','Curieux','Pragmatique','Protecteur','Indépendant','Franc','Patient'];
  const ambitions=['Stabilité','Liberté','Famille','Découverte','Maîtrise','Protection','Réussite'];

  registry.register('personalLifeDataV78',{
    version:'7.8.0',housing,factionHousingLabels,householdActions,personalEvents,names,temperaments,ambitions
  });
})(window);
