// §1.7 data/liveops.js — DONNÉES PURES — Rétention/LiveOps : succès, login, quêtes, boss hebdo
// Extraites VERBATIM de index.html.

export const ACHIEVEMENTS_DEFS = [
    { id: 'k10', name: 'Débutant', desc: 'Tuez 10 Monstres', req: s=>s.totalKills>=10, reward: 5 },
    { id: 'k100', name: 'Chasseur', desc: 'Tuez 100 Monstres', req: s=>s.totalKills>=100, reward: 10 },
    { id: 'z10', name: 'Explorateur', desc: 'Atteignez la Zone 10', req: s=>s.maxZone>=10, reward: 15 },
    { id: 'c1k', name: 'Clickeur', desc: 'Faites 1 000 Clics', req: s=>s.totalClicks>=1000, reward: 5 },
    { id: 'b5', name: 'Tueur de Boss', desc: 'Tuez 5 Boss', req: s=>s.bossKills>=5, reward: 10 },
    { id: 'sum3', name: 'Invocateur', desc: 'Possédez 3 Héros', req: s=>Object.keys(s.heroes).length>=3, reward: 10 },
];

export const LOGIN_REWARDS = [
    { icon:'⚔',  label:'Jour 1', val:'500 PH',
      apply() { G.honorPoints += 500; }, desc:'500 PH' },
    { icon:'💎',  label:'Jour 2', val:'2 Gemmes',
      apply() { G.gems += 2; }, desc:'2 💎' },
    { icon:'∞',  label:'Jour 3', val:'2 Cristaux',
      apply() { G.materials.fire_crystal=(G.materials.fire_crystal||0)+1; G.materials.water_crystal=(G.materials.water_crystal||0)+1; }, desc:'2 Cristaux' },
    { icon:'💎',  label:'Jour 4', val:'5 Gemmes',
      apply() { G.gems += 5; }, desc:'5 💎' },
    { icon:'✨',  label:'Jour 5', val:'Mimic +1K PH',
      apply() { G.materials.mimic=(G.materials.mimic||0)+1; G.honorPoints+=1000; }, desc:'1 Mimic + 1K PH' },
    { icon:'💎',  label:'Jour 6', val:'10 Gemmes',
      apply() { G.gems += 10; }, desc:'10 💎' },
    { icon:'🌟',  label:'Jour 7', val:'INVOCATION',
      apply() { setTimeout(summonRare, 400); }, desc:'Rare Summon offert !' },
];

export const DQ_POOL = [
    { id:'dq_k50',  name:'Chasseur du Jour',     type:'kills',      target:50,   apply(){ G.gems+=1; },              rewardDesc:'1 💎' },
    { id:'dq_k150', name:'Tueur de Monstres',     type:'kills',      target:150,  apply(){ G.gems+=2; },              rewardDesc:'2 💎' },
    { id:'dq_k400', name:'Exterminateur',          type:'kills',      target:400,  apply(){ G.gems+=4; },              rewardDesc:'4 💎' },
    { id:'dq_b3',   name:'Fléau des Boss',         type:'bossKills',  target:3,    apply(){ G.gems+=2; },              rewardDesc:'2 💎' },
    { id:'dq_b8',   name:'Bosseur Acharné',        type:'bossKills',  target:8,    apply(){ G.gems+=5; },              rewardDesc:'5 💎' },
    { id:'dq_bb3',  name:'Brave Burst !',          type:'bbUses',     target:3,    apply(){ G.honorPoints+=400; },     rewardDesc:'400 PH' },
    { id:'dq_bb8',  name:'Maître du Burst',        type:'bbUses',     target:8,    apply(){ G.honorPoints+=1000; },    rewardDesc:'1 000 PH' },
    { id:'dq_c200', name:'Cliqueur Acharné',       type:'clicks',     target:200,  apply(){ G.honorPoints+=500; },     rewardDesc:'500 PH' },
    { id:'dq_c600', name:'Tapeur Infatigable',     type:'clicks',     target:600,  apply(){ G.gems+=1; G.honorPoints+=300; }, rewardDesc:'1 💎 + 300 PH' },
    { id:'dq_g5k',  name:"L'Or Coule !",           type:'goldGained', target:5000, apply(){ G.gems+=1; },              rewardDesc:'1 💎' },
];

export const WEEKLY_BOSSES = [
    { name:'Titan de Granit',      elem:'Terre',    icon:'🗿', hp:500000,
      color:'#2ecc71', mat:'earth_totem',  gems:15, ph:2000,
      lore:'"Un colosse de pierre immuable, gardien oublié d\'un âge révolu."' },
    { name:'Kraken des Abysses',   elem:'Eau',      icon:'🦑', hp:750000,
      color:'#3498db', mat:'water_totem',  gems:20, ph:2500,
      lore:'"Un monstre marin millénaire émergeant des profondeurs les plus obscures."' },
    { name:'Phoenix Éternel',      elem:'Feu',      icon:'🔥', hp:900000,
      color:'#e74c3c', mat:'fire_totem',   gems:25, ph:3000,
      lore:'"Un oiseau légendaire renaissant sans cesse de ses cendres ardentes."' },
    { name:'Hydre Foudre',         elem:'Foudre',   icon:'⚡', hp:1100000,
      color:'#f1c40f', mat:'thunder_totem',gems:30, ph:3500,
      lore:'"Une hydre à sept têtes crachant des éclairs dévastateurs."' },
    { name:'Archange Corrompu',    elem:'Lumière',  icon:'👼', hp:1500000,
      color:'#fff9c4', mat:'light_totem',  gems:40, ph:5000,
      lore:'"Un ange déchu dont la lumière divine a été souillée par les ténèbres."' },
    { name:'Seigneur des Ombres',  elem:'Ténèbres', icon:'💀', hp:2000000,
      color:'#9b59b6', mat:'dark_totem',   gems:50, ph:7000,
      lore:'"L\'entité la plus sombre jamais vaincue par une squad de héros."' },
];

export const OBJECTIVES = [
    { zone: 5,   label: 'Atteindre la Zone 5 !' },
    { zone: 10,  label: 'Vaincs le Boss de la Zone 10 !' },
    { zone: 25,  label: 'Atteins la Zone 25 !' },
    { zone: 50,  label: 'Zone 50 — Prestige disponible !' },
    { zone: 100, label: 'Atteins la Zone 100 — Légende !' },
    { zone: 200, label: 'Zone 200 — Maître Absolu !' },
];

