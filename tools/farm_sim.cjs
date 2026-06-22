// =============================================================
// §ÉCO v2 — Simulateur de farm : demande (création + évolution) vs offre
// (combat + gisements de la Ville + comptoir PH) → temps de complétion.
// Usage : node tools/farm_sim.cjs
// Les constantes proviennent du bundle réel (assets/globals.bundle.js).
// =============================================================
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'assets', 'globals.bundle.js'));
const W = global.window;

const { HERO_DEFS, SUMMON_POOLS, CREATE_RECIPE, EVO_MATS, EVO_COSTS,
        EVO_LEVEL_CAPS, NODE_DROP_RATES } = W;

// ---- Profils de joueur (scénarios) ----
const SCENARIOS = {
    casual:   { killsPerMin: 15, bossEveryKills: 50, activeHoursPerDay: 0.5, townChargesPerDay: 15 },
    moyen:    { killsPerMin: 25, bossEveryKills: 50, activeHoursPerDay: 1.0, townChargesPerDay: 25 },
    hardcore: { killsPerMin: 40, bossEveryKills: 45, activeHoursPerDay: 2.5, townChargesPerDay: 40 },
};
// Profil choisi via argv (ex: node tools/farm_sim.cjs casual) ; défaut = moyen.
const profile = process.argv[2] && SCENARIOS[process.argv[2]] ? process.argv[2] : 'moyen';
const P = Object.assign({ phToCrystal: 200, elements: 6 }, SCENARIOS[profile]);
console.log('### PROFIL :', profile.toUpperCase(), '###');

const ELEM = ['fire','water','earth','thunder','light','dark'];
function elemOf(def){
    const e=(def.element||'').toLowerCase();
    if(e.includes('fire')||e.includes('feu'))return'fire';
    if(e.includes('water')||e.includes('eau'))return'water';
    if(e.includes('earth')||e.includes('terre'))return'earth';
    if(e.includes('thunder')||e.includes('foudre'))return'thunder';
    if(e.includes('light')||e.includes('lumi'))return'light';
    if(e.includes('dark')||e.includes('tene'))return'dark';
    return 'fire';
}
function tierOf(def){
    if(SUMMON_POOLS.S.includes(def.id))return'S';
    if(SUMMON_POOLS.A.includes(def.id))return'A';
    if((def.rarity||3)>=5)return'S';
    if((def.rarity||3)>=4)return'A';
    return'B';
}

// ---- DEMANDE ----
// Agrège la demande totale par type générique (crystal/idol/totem/mimic/essence) + or.
const demand = { crystal:0, idol:0, totem:0, mimic:0, essence:0, gold:0 };
const perElem = {}; ELEM.forEach(e=>perElem[e]={crystal:0,idol:0,totem:0});

for(const def of HERO_DEFS){
    const tier=tierOf(def), el=elemOf(def);
    const start = (def.rarity||3) >= 5 ? 5 : 3; // étoiles de départ après création
    // Création
    const rec = CREATE_RECIPE[tier];
    demand.gold += rec.gold||0;
    demand.essence += rec.essence||0;
    if(rec.crystal){demand.crystal+=rec.crystal; perElem[el].crystal+=rec.crystal;}
    if(rec.idol){demand.idol+=rec.idol; perElem[el].idol+=rec.idol;}
    if(rec.totem){demand.totem+=rec.totem; perElem[el].totem+=rec.totem;}
    if(rec.mimic)demand.mimic+=rec.mimic;
    // Évolution start→6
    for(let s=start;s<6;s++){
        const m=EVO_MATS[s]; if(m){
            if(m.crystal){demand.crystal+=m.crystal; perElem[el].crystal+=m.crystal;}
            if(m.idol){demand.idol+=m.idol; perElem[el].idol+=m.idol;}
            if(m.totem){demand.totem+=m.totem; perElem[el].totem+=m.totem;}
            if(m.mimic)demand.mimic+=m.mimic;
        }
        demand.gold += EVO_COSTS[s]||0;
    }
}

// ---- OFFRE par jour ----
const minutesPerDay = P.activeHoursPerDay*60;
const killsPerDay   = P.killsPerMin*minutesPerDay;
const bossPerDay    = killsPerDay/P.bossEveryKills;

const C = NODE_DROP_RATES?.combat || {};
const Bo = NODE_DROP_RATES?.boss || {};
const r = (o,k,d)=> (o[k] ?? d);

const supply = {
    crystal: killsPerDay*r(C,'crystal',0.08)            + P.townChargesPerDay,         // combat + gisement
    totem:   bossPerDay*r(Bo,'totemRepeat',0.10)        + P.townChargesPerDay,         // boss + gisement
    idol:    bossPerDay*r(Bo,'idol',0)                  + P.townChargesPerDay,         // boss + gisement
    mimic:   killsPerDay*r(C,'mimic',0) + bossPerDay*r(Bo,'mimic',0) + P.townChargesPerDay*0.5, // combat+boss+Manoir
    essence: 0, // bornée (1ers clears/boss) — traitée à part
};

// ---- RÉSULTATS ----
function fmt(n){return n>=1000?(n/1000).toFixed(1)+'k':String(Math.round(n));}
function days(d,s){ return s>0 ? d/s : Infinity; }

console.log('================ SIMULATEUR DE FARM — §ÉCO v2 ================');
console.log('Hypothèses :', JSON.stringify(P));
console.log('  kills/jour =', Math.round(killsPerDay), '| boss/jour =', bossPerDay.toFixed(1));
console.log('\n--- DEMANDE TOTALE (15 héros créés + évolués jusqu\'à 6*) ---');
['crystal','idol','totem','mimic','essence'].forEach(k=>console.log('  '+k.padEnd(8), Math.round(demand[k])));
console.log('  gold (création+évo, hors niveaux) =', fmt(demand.gold));

console.log('\n--- OFFRE / JOUR ---');
['crystal','idol','totem','mimic'].forEach(k=>console.log('  '+k.padEnd(8), supply[k].toFixed(1)+'/j'));

console.log('\n--- TEMPS POUR SATISFAIRE CHAQUE MATÉRIAU ---');
const times={};
['crystal','idol','totem','mimic'].forEach(k=>{
    times[k]=days(demand[k],supply[k]);
    console.log('  '+k.padEnd(8), demand[k]+' / '+supply[k].toFixed(1)+'/j  →  '+times[k].toFixed(1)+' jours');
});
const bottleneck = Object.entries(times).sort((a,b)=>b[1]-a[1])[0];
const totalDays = bottleneck[1];
console.log('\n>>> GOULOT : '+bottleneck[0].toUpperCase()+'  —  complétion ≈ '+totalDays.toFixed(1)+' jours');
console.log('    (soit ≈ '+(totalDays*P.activeHoursPerDay).toFixed(1)+' h de jeu actif sur '+totalDays.toFixed(0)+' jours réels)');

console.log('\n--- DEMANDE PAR ÉLÉMENT (équilibrage géographique) ---');
ELEM.forEach(e=>console.log('  '+e.padEnd(8),'crystal '+perElem[e].crystal+'  idol '+perElem[e].idol+'  totem '+perElem[e].totem));

console.log('\nNOTE : ce temps ne couvre que les MATÉRIAUX. Le vrai frein de fin de partie reste');
console.log('la montée en niveaux (atteindre les caps 50/80/100/150 pour évoluer) + les gates de');
console.log('zone — gold-gated et exponentiels. Les matériaux soutiennent le parcours, ils ne sont');
console.log('pas le mur : c\'est l\'objectif visé (pas de grind de matériaux frustrant).');
