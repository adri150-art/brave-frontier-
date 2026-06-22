// §1.7 data/affixes.js — DONNÉES PURES (zéro logique) — Loot : raretés, slots, table d'affixes, spheres, matériaux
// Extraites VERBATIM de index.html. Source de vérité une fois index.html câblé en module.

export const ITEM_RARITIES = {
    common:    { name: 'Commun',    color: '#9aa5b4', maxAffixes: 1, dropWeight: 50 },
    magic:     { name: 'Magique',   color: '#4f8fff', maxAffixes: 2, dropWeight: 28 },
    rare:      { name: 'Rare',      color: '#f1c40f', maxAffixes: 3, dropWeight: 14 },
    epic:      { name: 'Épique',    color: '#c084fc', maxAffixes: 4, dropWeight: 6  },
    legendary: { name: 'Légendaire',color: '#ff8c00', maxAffixes: 5, dropWeight: 2  },
    mythic:    { name: 'Mythique',  color: '#ff3366', maxAffixes: 6, dropWeight: 0.5 }
};

export const ITEM_SLOTS = ['weapon','armor','helm','boots','ring','amulet'];

export const ITEM_SLOT_NAMES = { weapon:'Arme', armor:'Armure', helm:'Casque', boots:'Bottes', ring:'Anneau', amulet:'Amulette' };

export const ITEM_SLOT_ICONS = { weapon:'⚔', armor:'🛡', helm:'⛑', boots:'👢', ring:'💍', amulet:'📿' };

export const AFFIX_TABLE = [
    { id:'dps_pct',   label:'% DPS',        stat:'dps_pct',   min:0.05, max:0.30 },
    { id:'hp_pct',    label:'% HP',         stat:'hp_pct',    min:0.05, max:0.25 },
    { id:'crit_ch',   label:'% Crit',       stat:'crit_ch',   min:0.02, max:0.12 },
    { id:'crit_dmg',  label:'% Dégâts Crit',stat:'crit_dmg',  min:0.10, max:0.60 },
    { id:'spark_dmg', label:'% Spark Dmg',  stat:'spark_dmg', min:0.08, max:0.40 },
    { id:'bc_gen',    label:'% Gen BC',     stat:'bc_gen',    min:0.05, max:0.25 },
    { id:'gold_pct',  label:'% Or',         stat:'gold_pct',  min:0.05, max:0.35 },
    { id:'cd_red',    label:'Réduction CD', stat:'cd_red',    min:0.05, max:0.20 },
    { id:'fire_dmg',  label:'% Dég Feu',    stat:'elem_fire', min:0.10, max:0.40 },
    { id:'water_dmg', label:'% Dég Eau',    stat:'elem_water',min:0.10, max:0.40 },
    { id:'thunder_dmg',label:'% Dég Foudre',stat:'elem_thunder',min:0.10, max:0.40 },
    { id:'light_dmg', label:'% Dég Lumière',stat:'elem_light', min:0.10, max:0.40 },
    { id:'dark_dmg',  label:'% Dég Ténèbres',stat:'elem_dark', min:0.10, max:0.40 },
];

export const SPHERE_DEFS = {
    bijou_sacre: { name: 'Bijou Sacré', desc: '+20% Stats', multiplier: 1.2 },
    barre_legwand: { name: 'Barre Legwand', desc: '+30% Stats', multiplier: 1.3 },
    pierre_choc: { name: 'Pierre de Choc', desc: '+25% Dégâts', multiplier: 1.25 }
};

export const MATERIAL_DEFS = {
    fire_crystal: { name: 'Cristal de Feu', color: '#e74c3c', rarity: '3★ Component' },
    fire_idol: { name: 'Idole de Feu', color: '#c0392b', rarity: '4★ Component' },
    fire_totem: { name: 'Totem de Feu', color: '#962d22', rarity: '5★ Component' },
    water_crystal: { name: 'Cristal d\'Eau', color: '#3498db', rarity: '3★ Component' },
    water_idol: { name: 'Idole d\'Eau', color: '#2980b9', rarity: '4★ Component' },
    water_totem: { name: 'Totem d\'Eau', color: '#1a5276', rarity: '5★ Component' },
    earth_crystal: { name: 'Cristal de Terre', color: '#2ecc71', rarity: '3★ Component' },
    earth_idol: { name: 'Idole de Terre', color: '#27ae60', rarity: '4★ Component' },
    earth_totem: { name: 'Totem de Terre', color: '#1e8449', rarity: '5★ Component' },
    thunder_crystal: { name: 'Cristal Foudre', color: '#f1c40f', rarity: '3★ Component' },
    thunder_idol: { name: 'Idole Foudre', color: '#d4ac0d', rarity: '4★ Component' },
    thunder_totem: { name: 'Totem Foudre', color: '#9a7d0a', rarity: '5★ Component' },
    light_crystal: { name: 'Cristal Lumière', color: '#fcf3cf', rarity: '3★ Component' },
    light_idol: { name: 'Idole Lumière', color: '#f9e79f', rarity: '4★ Component' },
    light_totem: { name: 'Totem Lumière', color: '#f7dc6f', rarity: '5★ Component' },
    dark_crystal: { name: 'Cristal Ténèbres', color: '#9b59b6', rarity: '3★ Component' },
    dark_idol: { name: 'Idole Ténèbres', color: '#8e44ad', rarity: '4★ Component' },
    dark_totem: { name: 'Totem Ténèbres', color: '#6c3483', rarity: '5★ Component' },
    mimic: { name: 'Mimic', color: '#a0b0c0', rarity: 'Universal Component' }
};

