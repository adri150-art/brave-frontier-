// §1.7 data/balance.js — DONNÉES PURES (zéro logique) — Constantes de courbe & équilibrage (un seul endroit)
// Extraites VERBATIM de index.html. Source de vérité une fois index.html câblé en module.

export const EVO_LEVEL_CAPS = [0, 0, 0, 50, 80, 100, 120, 150]; // index 7 = palier 7★ (cap 150)

export const EVO_COSTS = [0, 0, 0, 1000, 10000, 100000, 1000000]; // index 6 = 6★→7★

export const EVO_ZONE_GATES = [0, 0, 0, 1, 16, 36, 61, 126]; // index 7 = 7★ débloqué à l'entrée de la Map 6 (stage global 126)

export const ELEMENT_ADVANTAGE = { 'Feu': 'Terre', 'Eau': 'Feu', 'Terre': 'Foudre', 'Foudre': 'Eau', 'Lumière': 'Ténèbres', 'Ténèbres': 'Lumière' };

export const MILESTONES = [10, 25, 50, 100];

export const MILESTONE_LABELS = { 10: '✦ Éveil I (×2,5)', 25: '— cap supprimé —', 50: '✦✦ Éveil II (×3,5)', 100: '✦✦✦ Éveil III (×5)' };

export const HERO_TYPES = ['Lord', 'Anima', 'Breaker', 'Guardian', 'Oracle'];

export const TYPE_MODS = {
    'Lord': { dps: 1.0, hp: 1.0, def: 1.0 },
    'Anima': { dps: 1.0, hp: 1.25, def: 0.85 },
    'Breaker': { dps: 1.25, hp: 0.9, def: 0.85 },
    'Guardian': { dps: 0.85, hp: 1.0, def: 1.25 },
    'Oracle': { dps: 0.95, hp: 0.95, def: 0.9, heal: 1.3 }
};

export const BB_TIER_MULT  = { BB: 1.0, SBB: 1.8, UBB: 4.5 };

export const BB_TIER_LABEL = { BB: 'Brave Burst', SBB: 'Super BB', UBB: '⚡ ULTIMATE BB' };

export const BB_TIER_COLOR = { BB: '#00d2ff', SBB: '#f1c40f', UBB: '#ff3366' };

export const SPARK_WINDOW_MS = 1200;

// ═══════════════════════════════════════════════════════════════════════════════
// §ÉCO — ÉCONOMIE OFFLINE 2 € (inspirée de Puzzle & Dragons)
// Voir RAPPORT_ECONOMIE_JEU.pdf. Principe : économie fermée, généreuse, complétable
// à 100 % sans aucun achat. Le rythme vient de la difficulté + du farm, pas d'un paywall.
// Ajuste UN seul paramètre à la fois et observe l'effet.
// ═══════════════════════════════════════════════════════════════════════════════

// — Machine Rare (invocation à la gemme) : 5 gemmes / tirage, 45 pour un x10.
export const RARE_SUMMON_COST   = 5;
export const RARE_SUMMON_COST_10 = 45;
// Probabilités par tier (somme = 1). S = 6★-ready (vedette), A = 5★, B = 4★, base = 3★.
export const RARE_RATES = { S: 0.05, A: 0.20, B: 0.35, base: 0.40 };
// Pité : au plus tard au 40e tirage SANS tier S, le prochain est un S garanti (compteur reset).
export const RARE_PITY = 40;

// — Machine d'Honneur : 500 PH / tirage. Voie passive et régulière des matériaux.
export const HONOR_SUMMON_COST = 500;
export const HONOR_RATES = { hero3: 0.15, idol4: 0.15, crystal: 0.50, totem: 0.10, mimic: 0.10 };

// — Drops de donjon : obtenir les héros DANS les niveaux (la mécanique « P&D »).
// Chaque boss de biome peut dropper sa version recrutable ; sinon on cumule des fragments.
export const FRAGMENTS_PER_HERO     = 50;    // 50 fragments = 1 exemplaire garanti
export const BOSS_HERO_DROP         = 0.03;  // chance que le boss droppe le héros complet
export const ELITE_FRAGMENT_DROP    = 0.05;  // chance qu'une élite droppe 1 fragment
// Taux de matériaux par type de node. §ÉCO v2 — équilibré au simulateur (tools/farm_sim.cjs) :
// le combat alimente aussi Idoles (boss) et Mimics, pour ne pas dépendre que des gisements lents.
export const NODE_DROP_RATES = {
    combat:   { crystal: 0.10, mimic: 0.02 },
    elite:    { idol: 0.35, fragment: ELITE_FRAGMENT_DROP },
    treasure: { guaranteed: { crystal: 0.60, idol: 0.30, totem: 0.10 }, mimic: 0.05 },
    boss:     { totemFirstClear: 1.0, totemRepeat: 0.20, idol: 0.30, mimic: 0.10, hero: BOSS_HERO_DROP },
};
// Multiplicateurs d'or par type de node.
export const NODE_GOLD_MULT = { combat: 1, elite: 2, treasure: 3, boss: 5, event: 2 };

// — Recettes de matériaux pour l'évolution (en plus de EVO_COSTS en or et des gates de zone).
// index = nombre d'étoiles ACTUELLES (aligné sur EVO_COSTS) : EVO_MATS[3] = passage 3★→4★.
// Les matériaux crystal/idol/totem sont par élément du héros ; mimic est universel.
export const EVO_MATS = [
    null, null, null,
    { crystal: 5 },              // [3] 3★ → 4★
    { idol: 5, mimic: 2 },       // [4] 4★ → 5★   (mimic réduit : 3 → 2)
    { totem: 5, mimic: 3 },      // [5] 5★ → 6★   (mimic réduit : 5 → 3)
    { totem: 12, mimic: 6, essence: 3 }, // [6] 6★ → 7★ (palier ultime — coût lourd)
];

// — Points de Maître (PM) : les doublons (au-delà du Limit Break) deviennent des PM,
// dépensables dans une boutique d'échange GARANTIE (filet anti-malchance).
export const MASTER_POINTS_DUPE = { 3: 500, 4: 1500, 5: 5000, 6: 15000, 7: 40000 };   // PM gagnés par doublon
export const MASTER_SHOP_COST   = { 3: 5000, 4: 15000, 5: 40000, 6: 90000, 7: 200000 }; // PM pour acheter un héros

// — Robinet de gemmes : viser ≈ 1,4× le coût théorique de la collection complète,
// afin de garantir la complétion sans rendre les gemmes insignifiantes.
export const GEM_FAUCET_TARGET_MULT = 1.4;
// Récompenses de gemmes (faucets) — sources bornées, pas de robinet infini.
export const GEM_REWARDS = {
    stageFirstClear: 3,   // premier clear d'un stage normal
    bossFirstClear:  5,   // premier clear d'un boss de biome
    bossRepeat:      1,   // boss rejoué
};

// — Extension de stockage de héros (puits de gemmes secondaire).
export const STORAGE_EXPAND_COST = 5; // gemmes par palier

// ═══════════════════════════════════════════════════════════════════════════════
// §ÉCO v2 — MODÈLE DÉTERMINISTE (sans gacha) : les héros se CRÉENT à l'Atelier
// avec or + matériaux (+ Essence = gemmes réaffectées). Voir RAPPORT_ECONOMIE_V2.
// ═══════════════════════════════════════════════════════════════════════════════

// Recettes de création par palier de héros (B = commun, A = avancé, S = élite).
// Les clés crystal/idol/totem sont préfixées par l'élément du héros au moment du calcul ;
// mimic est universel ; essence = gemmes (G.gems) réaffectées en catalyseur rare.
export const CREATE_RECIPE = {
    B: { gold: 4000,   crystal: 6 },
    A: { gold: 30000,  idol: 6,  mimic: 2 },   // §ÉCO v2 : mimic réduit 4 → 2
    S: { gold: 150000, totem: 8, mimic: 3, essence: 3 }, // mimic réduit 6 → 3
};

// Comptoir d'échange (remplace l'Honor Summon aléatoire) : coût en PH par matériau obtenu.
export const HONOR_EXCHANGE = { crystal: 200, idol: 600, mimic: 1500 };

// Robinet d'Essence (= gemmes) : sources bornées, sert de frein des héros d'élite.
export const ESSENCE_REWARDS = { stageFirstClear: 1, bossFirstClear: 3, bossRepeat: 0 };

