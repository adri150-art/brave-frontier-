// §1.7 data/skilltree.js — DONNÉES PURES (zéro logique) — Arbre de compétences & Paragon
// Extraites VERBATIM de index.html. Source de vérité une fois index.html câblé en module.

export const SKILL_TREE_DEF = {
    // Branche Offensive
    off_dps1:     { branch:'off', name:'Puissance Brute',    desc:'+10% DPS squad',   cost:1, requires:null,       bonus:{dps_pct:0.10} },
    off_dps2:     { branch:'off', name:'Frappe Précise',     desc:'+15% DPS squad',   cost:2, requires:'off_dps1', bonus:{dps_pct:0.15} },
    off_crit1:    { branch:'off', name:'Œil Critique',       desc:'+5% chance crit',  cost:2, requires:'off_dps1', bonus:{crit_ch:0.05} },
    off_spark1:   { branch:'off', name:'Maîtrise Spark',     desc:'+20% Spark DMG',   cost:3, requires:'off_crit1',bonus:{spark_dmg:0.20} },
    off_dps3:     { branch:'off', name:'Fureur Éternelle',   desc:'+25% DPS squad',   cost:5, requires:'off_dps2', bonus:{dps_pct:0.25} },
    // Branche Défensive
    def_hp1:      { branch:'def', name:'Endurance',          desc:'+15% HP équipe',   cost:1, requires:null,       bonus:{hp_pct:0.15} },
    def_hp2:      { branch:'def', name:'Vitalité Sacrée',    desc:'+25% HP équipe',   cost:2, requires:'def_hp1',  bonus:{hp_pct:0.25} },
    def_mit1:     { branch:'def', name:'Bouclier Ésotérique',desc:'-15% Dégâts subis',cost:3, requires:'def_hp1',  bonus:{dmg_red:0.15} },
    def_hp3:      { branch:'def', name:'Cœur de Pierre',     desc:'+40% HP équipe',   cost:5, requires:'def_hp2',  bonus:{hp_pct:0.40} },
    // Branche Économie
    eco_gold1:    { branch:'eco', name:"Nez pour l'Or",     desc:'+20% Or',          cost:1, requires:null,       bonus:{gold_pct:0.20} },
    eco_gold2:    { branch:'eco', name:"Avalanche d'Or",    desc:'+35% Or',          cost:2, requires:'eco_gold1',bonus:{gold_pct:0.35} },
    eco_drop1:    { branch:'eco', name:'Chance du Chasseur', desc:'+20% Drop rate',   cost:2, requires:'eco_gold1',bonus:{drop_bonus:0.20} },
    eco_gold3:    { branch:'eco', name:'Tr\u00e9sorier Supr\u00eame',  desc:'+50% Or',          cost:5, requires:'eco_gold2',bonus:{gold_pct:0.50} },
    // Branche Idle
    idle_off1:    { branch:'idl', name:'Synergie Passive',   desc:'+10% DPS passif',  cost:1, requires:null,       bonus:{idle_dps:0.10} },
    idle_off2:    { branch:'idl', name:'Flux Ininterrompu',  desc:'+25% gains hors-ligne', cost:3, requires:'idle_off1', bonus:{offline_mult:0.25} },
    idle_bc1:     { branch:'idl', name:'Résonance BC',       desc:'+15% gen BC auto', cost:2, requires:'idle_off1',bonus:{bc_gen:0.15} },
    // Branche Élémentaire
    elem_fire1:   { branch:'ele', name:'Cœur de Flamme',     desc:'+15% Feu',         cost:2, requires:null,       bonus:{elem_fire:0.15} },
    elem_water1:  { branch:'ele', name:'Torrent Bleu',       desc:'+15% Eau',         cost:2, requires:null,       bonus:{elem_water:0.15} },
    elem_thunder1:{ branch:'ele', name:'Foudre Vivante',     desc:'+15% Foudre',      cost:2, requires:null,       bonus:{elem_thunder:0.15} },
    elem_all1:    { branch:'ele', name:'Harmonie Élémentaire',desc:'+10% tous élém.', cost:5, requires:'elem_fire1',bonus:{elem_fire:0.10,elem_water:0.10,elem_thunder:0.10,elem_light:0.10,elem_dark:0.10} },
};

export const PARAGON_CATEGORIES = {
    strength:   { label:'Force',     stat:'dps_pct',  costBase:1, costGrowth:1.15 },
    vitality:   { label:'Vitalité',  stat:'hp_pct',   costBase:1, costGrowth:1.15 },
    fortune:    { label:'Fortune',   stat:'gold_pct', costBase:1, costGrowth:1.15 },
    arcane:     { label:'Arcane',    stat:'bc_gen',   costBase:1, costGrowth:1.20 },
};

