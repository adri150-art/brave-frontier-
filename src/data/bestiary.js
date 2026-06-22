// =============================================================================
//  BESTIARY.js — BESTIAIRE COMPLET & ÉQUILIBRÉ (6 MAPS × 5 ZONES × 5 STAGES)
//  -----------------------------------------------------------------------------
//  Données pures construites SUR stats-system.js. Aucune dépendance au DOM.
//  Testable sous Node, importable dans le navigateur.
//
//  STRUCTURE DU MONDE
//    • 6 Maps. Chaque Map = 5 Zones. Chaque Zone = 5 Stages.
//    • Stages 1 à 4  → vague de monstres communs + UN MINI-BOSS à la fin.
//    • Stage 5        → vague de monstres communs + LE BOSS DE ZONE à la fin.
//
//  PALIERS DE PUISSANCE (★ des héros recommandés par Map)
//    Map 1 : 3★   |   Map 2 : 3★   |   Map 3 : 4★
//    Map 4 : 5★   |   Map 5 : 6★   |   Map 6 : 7★
//
//  PHILOSOPHIE D'ÉQUILIBRAGE — « ni trop fort, ni trop faible »
//    Tout est ancré sur un héros de RÉFÉRENCE de classe IGNIS (mage Breaker,
//    budget 100) MAXIMISÉ au cap de son palier d'étoiles. Les stats des
//    monstres sont dérivées en RATIO de ce héros de référence :
//      • un commun meurt en quelques coups et grignote un peu de PV ;
//      • un mini-boss demande un vrai effort sans être un mur ;
//      • un boss de zone est un combat marquant mais gagnable avec une équipe
//        du bon palier d'étoiles.
//    Voir tools/bestiary-balance.mjs pour la preuve chiffrée des ratios.
// =============================================================================

import { RARITY_TUNING, computeStats } from './stats-system.js';

/* ===========================================================================
 *  1. HÉROS DE RÉFÉRENCE (ANCRE D'ÉQUILIBRAGE) — « classe Ignis »
 *  -----------------------------------------------------------------------
 *  REF_BASE = buildBaseStats(100, 'mage') = stats de base d'Ignis.
 *  refHero(stars) = ces stats poussées à la rareté donnée, AU NIVEAU MAX,
 *  avec le type Breaker (celui d'Ignis). C'est l'étalon de puissance.
 * ======================================================================== */

export const REF_BASE = { atk: 13, def: 6, hp: 85 };

export function refHero(stars) {
  const R = RARITY_TUNING[stars] || RARITY_TUNING[3];
  return computeStats(REF_BASE, { stars, level: R.levelCap, type: 'Breaker' });
}

/* ===========================================================================
 *  2. RATIOS D'ENCOUNTER (puissance monstre ÷ héros de référence)
 *  -----------------------------------------------------------------------
 *    hp  : ×  refHero.atk   (combien de coups le monstre encaisse)
 *    atk : ×  refHero.hp    (fraction des PV d'un héros grignotée par coup)
 *    def : ×  refHero.def   (réduction des dégâts héros)
 *  Un seul endroit à toucher pour durcir / adoucir tout le jeu.
 * ======================================================================== */

export const ENCOUNTER_RATIOS = {
  common: { hp: 1.8,  atk: 0.060, def: 0.40 }, // monstre commun (fodder)
  mini:   { hp: 9.0,  atk: 0.120, def: 0.70 }, // mini-boss (fin des stages 1→4)
  boss:   { hp: 18.0, atk: 0.190, def: 1.00 }, // boss de zone (fin du stage 5)
};

// Palier d'étoiles recommandé par Map (index 0 = Map 1).
export const MAP_POWER_TIER = [3, 3, 4, 5, 6, 7];

// Maps 1 & 2 partagent le palier 3★ : on durcit la Map 2 pour combler l'écart
// vers la Map 3 (4★). Les autres Maps montent d'un palier → multiplicateur 1.
export const MAP_WITHIN_TIER_MULT = [1.0, 1.5, 1.0, 1.0, 1.0, 1.0];

// Progression DOUCE à l'intérieur d'une Map.
const ZONE_RAMP  = 0.15; // +15 % de puissance par zone (zone 5 = 1.6× zone 1)
const STAGE_RAMP = 0.05; // +5 %  de puissance par stage à l'intérieur d'une zone

/* ===========================================================================
 *  3. ÉLÉMENTS & LIBELLÉS
 * ======================================================================== */

export const ELEM_FR = {
  fire: 'Feu', water: 'Eau', earth: 'Terre',
  thunder: 'Foudre', light: 'Lumière', dark: 'Ténèbres',
};

/* ===========================================================================
 *  4. RÉSERVOIRS DE NOMS (par élément, décorés selon le rang de la Map)
 * ======================================================================== */

const COMMON_NAMES = {
  fire:    ['Slime de Lave', 'Canidé d’Enfer', 'Salamandre Ignée', 'Lutin des Braises', 'Chauve-Souris de Cendre'],
  water:   ['Méduse de Cristal', 'Éclaireur Squalide', 'Tortue de Récif', 'Ondin Rôdeur', 'Murène Spectrale'],
  earth:   ['Rôdeur Sylvestre', 'Golem de Mousse', 'Mante Géante', 'Champignon Rampant', 'Scarabée de Roche'],
  thunder: ['Harpie Statique', 'Élémentaire d’Orage', 'Wyverne Électrique', 'Lézard Fulgurant', 'Corbeau de Foudre'],
  light:   ['Séraphin Mineur', 'Gardien Doré', 'Spectre Lumineux', 'Fée Radieuse', 'Cerf Céleste'],
  dark:    ['Ombre Rampante', 'Goule Maudite', 'Spectre Nocturne', 'Chauve-Souris d’Ébène', 'Larve du Vide'],
};

// Épithète ajoutée selon le rang de la Map (0 : Maps 1-2, 1 : Maps 3-4, 2 : Maps 5-6).
const COMMON_EPITHET = [
  ['', ' Sauvage', ' Éclaireur'],
  [' Aguerri', ' Corrompu', ' Vorace'],
  [' Ancestral', ' Cauchemardesque', ' Primordial'],
];

const MINI_NAMES = {
  fire:    ['Brûleur Infernal', 'Chevalier de Magma', 'Hydre de Flammes', 'Colosse de Cendres'],
  water:   ['Sirène Abyssale', 'Garde des Profondeurs', 'Kraken Mineur', 'Élémentaire des Marées'],
  earth:   ['Golem Ancien', 'Traqueur de la Canopée', 'Béhémoth de Pierre', 'Druide Déchu'],
  thunder: ['Djinn d’Orage', 'Gardien Fulgurant', 'Roc Électrique', 'Chimère de Foudre'],
  light:   ['Paladin Déchu', 'Valkyrie Radiante', 'Golem Sacré', 'Archonte Mineur'],
  dark:    ['Liche Maudite', 'Faucheur d’Ombre', 'Gargouille du Néant', 'Tyran Spectral'],
};

// Boss-signature unique de la zone finale (zone 5) de chaque map — le climax.
const MAP_FINAL_BOSS = [
  'Gardien de Mistral',     // Map 1
  'Hydre de Sylvania',      // Map 2
  'Tyran de Glaciarem',     // Map 3
  'Seigneur de Vulcanor',   // Map 4
  'Archange d’Aetheria',    // Map 5
  'Avatar Primordial',      // Map 6 (boss ultime du jeu)
];

const BOSS_NAMES = {
  fire:    ['Dragon d’Agni', 'Phénix Calciné', 'Seigneur des Flammes', 'Titan Volcanique', 'Avatar Infernal'],
  water:   ['Léviathan', 'Tyran des Abysses', 'Hydre des Marées', 'Souverain Glaciaire', 'Avatar des Océans'],
  earth:   ['Gardien de Gaïa', 'Béhémoth Primordial', 'Colosse de la Forêt', 'Titan Tellurique', 'Avatar de la Terre'],
  thunder: ['Seigneur du Tonnerre', 'Dragon Fulgurant', 'Roi des Tempêtes', 'Titan Électrique', 'Avatar de l’Orage'],
  light:   ['Archange Corrompu', 'Séraphin Suprême', 'Empereur Solaire', 'Titan de Lumière', 'Avatar Céleste'],
  dark:    ['Souverain du Néant', 'Faucheur d’Âmes', 'Seigneur des Abysses', 'Titan des Ombres', 'Avatar Primordial'],
};

/* ===========================================================================
 *  5. DÉFINITION DES 6 MAPS (thèmes, zones, éléments)
 *  -----------------------------------------------------------------------
 *  Chaque map : 5 zones, chaque zone porte un élément (variété + jeu de la
 *  roue élémentaire). x/y = position sur l'image de carte (en %).
 * ======================================================================== */

export const MAP_THEMES = [
  {
    id: 0, name: 'Mistral', tier: 3,
    lore: 'Les marches ardentes où débutent tous les invocateurs.',
    zones: [
      { name: 'Gorges Ardentes',       element: 'fire'  },
      { name: 'Temple des Braises',    element: 'fire'  },
      { name: 'Lac Luminescent',       element: 'water' },
      { name: 'Forêt aux Champignons', element: 'water' },
      { name: 'Temple de la Jungle',   element: 'earth' },
    ],
  },
  {
    id: 1, name: 'Sylvania', tier: 3,
    lore: 'Forêts profondes et marécages électriques aux créatures plus tenaces.',
    zones: [
      { name: 'Bois Murmurants',       element: 'earth'   },
      { name: 'Tourbière Putride',     element: 'earth'   },
      { name: 'Cascades d’Émeraude',   element: 'water'   },
      { name: 'Clairière Foudroyée',   element: 'thunder' },
      { name: 'Ravin de Braise',       element: 'fire'    },
    ],
  },
  {
    id: 2, name: 'Glaciarem', tier: 4,
    lore: 'Cimes gelées et orages perpétuels : le premier vrai test de force.',
    zones: [
      { name: 'Banquise Brisée',       element: 'water'   },
      { name: 'Fjord Silencieux',      element: 'water'   },
      { name: 'Pic des Tempêtes',      element: 'thunder' },
      { name: 'Toundra Pétrifiée',     element: 'earth'   },
      { name: 'Sanctuaire de Givre',   element: 'light'   },
    ],
  },
  {
    id: 3, name: 'Vulcanor', tier: 5,
    lore: 'Forges infernales et abîmes obscurs sous une terre en fusion.',
    zones: [
      { name: 'Caldeira Rugissante',   element: 'fire'    },
      { name: 'Mines de Foudre',       element: 'thunder' },
      { name: 'Rivière de Magma',      element: 'fire'    },
      { name: 'Galeries Effondrées',   element: 'earth'   },
      { name: 'Antre Obscur',          element: 'dark'    },
    ],
  },
  {
    id: 4, name: 'Aetheria', tier: 6,
    lore: 'Le royaume céleste corrompu : gardiens divins déchus et tempêtes sacrées.',
    zones: [
      { name: 'Parvis Radieux',        element: 'light'   },
      { name: 'Nefs Suspendues',       element: 'light'   },
      { name: 'Vortex Céleste',        element: 'thunder' },
      { name: 'Bassins Astraux',       element: 'water'   },
      { name: 'Crypte des Anges',      element: 'dark'    },
    ],
  },
  {
    id: 5, name: 'Abyssia', tier: 7,
    lore: 'Le Néant primordial. Au-delà : seuls les avatars des dieux subsistent.',
    zones: [
      { name: 'Seuil des Ombres',      element: 'dark'    },
      { name: 'Abîme Sans Fond',       element: 'dark'    },
      { name: 'Cœur Incandescent',     element: 'fire'    },
      { name: 'Faille de Lumière',     element: 'light'   },
      { name: 'Trône Primordial',      element: 'dark'    },
    ],
  },
];

/* ===========================================================================
 *  6. GÉNÉRATEUR DE STATS (déterministe)
 * ======================================================================== */

function statBlock(kind, tier, mapIdx, zoneIdx, stageIdx) {
  const ref      = refHero(tier);
  const ratio    = ENCOUNTER_RATIOS[kind];
  const mapMult  = MAP_WITHIN_TIER_MULT[mapIdx] ?? 1;
  const zoneMult = 1 + ZONE_RAMP  * zoneIdx;
  const stgMult  = 1 + STAGE_RAMP * stageIdx;
  const power    = mapMult * zoneMult * stgMult;
  return {
    hp:  Math.round(ratio.hp  * ref.atk * power),
    atk: Math.max(1, Math.round(ratio.atk * ref.hp  * power)),
    def: Math.round(ratio.def * ref.def * power),
  };
}

let _uid = 0;
function makeMonster({ kind, name, element, tier, mapIdx, zoneIdx, stageIdx }) {
  const s = statBlock(kind, tier, mapIdx, zoneIdx, stageIdx);
  return {
    id: `m${mapIdx + 1}_z${zoneIdx + 1}_s${stageIdx + 1}_${kind}_${++_uid}`,
    name, kind,
    element, elem: ELEM_FR[element],
    rarity: Math.min(7, tier),
    map: mapIdx + 1, zone: zoneIdx + 1, stage: stageIdx + 1,
    level: tier * 20 + zoneIdx * 4 + stageIdx, // niveau indicatif (affichage)
    atk: s.atk, def: s.def, hp: s.hp,
  };
}

/* ===========================================================================
 *  7. CONSTRUCTION DU BESTIAIRE COMPLET
 * ======================================================================== */

function buildBestiary() {
  return MAP_THEMES.map((map, mapIdx) => {
    const rank = Math.floor(mapIdx / 2); // 0:Maps1-2, 1:Maps3-4, 2:Maps5-6
    const tier = map.tier;

    const zones = map.zones.map((zone, zoneIdx) => {
      const el = zone.element;
      const commonPool = COMMON_NAMES[el];
      const epithets   = COMMON_EPITHET[rank];
      const miniPool   = MINI_NAMES[el];
      const bossPool   = BOSS_NAMES[el];

      // 3 archétypes communs propres à la zone (décorés selon le rang).
      const commons = [0, 1, 2].map((k) => {
        const base = commonPool[(zoneIdx + k) % commonPool.length];
        return base + (epithets[k] || '');
      });

      const stages = [0, 1, 2, 3, 4].map((stageIdx) => {
        const isBossStage = stageIdx === 4;

        // Vague de communs : 3 sur les stages normaux, 4 (plus dense) sur le stage boss.
        const waveSize = isBossStage ? 4 : 3;
        const wave = Array.from({ length: waveSize }, (_, i) =>
          makeMonster({
            kind: 'common',
            name: commons[i % commons.length],
            element: el, tier, mapIdx, zoneIdx, stageIdx,
          })
        );

        let leader;
        if (isBossStage) {
          // Boss de zone : la zone finale (5) porte le boss-signature de la map ;
          // les autres zones tirent un boss élémentaire varié selon rang + zone.
          const bossName = (zoneIdx === 4)
            ? MAP_FINAL_BOSS[mapIdx]
            : bossPool[(rank + zoneIdx) % bossPool.length];
          leader = makeMonster({
            kind: 'boss', name: bossName,
            element: el, tier, mapIdx, zoneIdx, stageIdx,
          });
        } else {
          // Mini-boss de fin de stage : un nom distinct par stage (4 dispo / zone).
          leader = makeMonster({
            kind: 'mini', name: miniPool[stageIdx % miniPool.length],
            element: el, tier, mapIdx, zoneIdx, stageIdx,
          });
        }

        return {
          stage: stageIdx + 1,
          isBossStage,
          wave,                 // monstres communs à enchaîner
          leader,               // mini-boss (stages 1-4) ou boss de zone (stage 5)
        };
      });

      return {
        id: zoneIdx, name: zone.name,
        element: el, elem: ELEM_FR[el],
        commons, stages,
      };
    });

    return { id: mapIdx, name: map.name, lore: map.lore, tier, rank, zones };
  });
}

export const BESTIARY = buildBestiary();

/* ===========================================================================
 *  8. ACCESSEURS PRATIQUES (pour le moteur de combat / la carte / les tests)
 * ======================================================================== */

/** Retourne l'objet Map (0-indexé). */
export function getMap(mapIdx) { return BESTIARY[mapIdx] || null; }

/** Retourne l'objet Zone d'une map (0-indexés). */
export function getZone(mapIdx, zoneIdx) {
  return BESTIARY[mapIdx]?.zones[zoneIdx] || null;
}

/** Retourne l'encounter complet d'un stage : { wave:[...], leader:{...}, isBossStage }. */
export function getStage(mapIdx, zoneIdx, stageIdx) {
  return BESTIARY[mapIdx]?.zones[zoneIdx]?.stages[stageIdx] || null;
}

/** Liste à plat de TOUS les monstres du jeu (utile pour un index/bestiaire UI). */
export function allMonsters() {
  const out = [];
  for (const map of BESTIARY)
    for (const zone of map.zones)
      for (const st of zone.stages) { out.push(...st.wave, st.leader); }
  return out;
}

/**
 * PV / ATT recommandés d'un stage donné, pour brancher le moteur de combat
 * exponentiel existant (getMonsterMaxHp / getMonsterAttack) sur le bestiaire.
 * @returns {{commonHp, commonAtk, leaderHp, leaderAtk, kind}}
 */
export function stageCombatStats(mapIdx, zoneIdx, stageIdx) {
  const st = getStage(mapIdx, zoneIdx, stageIdx);
  if (!st) return null;
  const c = st.wave[0];
  return {
    commonHp: c.hp, commonAtk: c.atk, commonDef: c.def,
    leaderHp: st.leader.hp, leaderAtk: st.leader.atk, leaderDef: st.leader.def,
    kind: st.leader.kind,
  };
}

export const BESTIARY_API = {
  BESTIARY, MAP_THEMES, MAP_POWER_TIER, ENCOUNTER_RATIOS,
  refHero, getMap, getZone, getStage, allMonsters, stageCombatStats,
};

if (typeof module !== 'undefined' && module.exports) module.exports = BESTIARY_API;
if (typeof window !== 'undefined') window.Bestiary = BESTIARY_API;

export default BESTIARY_API;
