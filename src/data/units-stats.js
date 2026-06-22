// =============================================================================
//  UNITS-STATS.js — STAT BLOCKS DES HÉROS & MONSTRES
//  -----------------------------------------------------------------------------
//  Données pures d'équilibrage construites SUR stats-system.js.
//  Chaque unité déclare des stats de BASE (au niveau 1 / 1★) ; la rareté et le
//  niveau les font évoluer via computeStats().
//
//  HÉROS  : 12 héros canoniques (2 / élément) + 3 unités spéciales.
//  MONSTRES : 6 biomes × (3 communs + 1 boss).
// =============================================================================

import {
  buildBaseStats, computeStats, LEADER_SKILLS, BURST_TIERS,
} from './stats-system.js';

/* ===========================================================================
 *  BUDGETS DE PUISSANCE (enveloppe de base, AVANT rareté/niveau)
 *  -----------------------------------------------------------------------
 *  Normalisés : l'écart de puissance réel vient surtout des étoiles (★).
 *  Ajuster ces chiffres = rééquilibrer une unité sans toucher au moteur.
 * ======================================================================== */
const HERO_BUDGET = 100;     // base commune des héros (rareté = différenciateur)
const MOB_BUDGET  = 90;      // monstre commun de référence
const ELITE_MULT  = 1.6;     // monstre élite
const BOSS_MULT   = 3.2;     // boss de biome

/* ===========================================================================
 *  HÉROS — STAT BLOCKS
 *  -----------------------------------------------------------------------
 *  type      : personnalité (Lord/Anima/Breaker/Guardian/Oracle)
 *  leader    : clé dans LEADER_SKILLS
 *  burstTier : palier Brave Burst débloqué (BB/SBB/UBB)
 *  base      : stats de base — générées par rôle pour rester équilibrées
 * ======================================================================== */

function hero(def) {
  return {
    ...def,
    base: buildBaseStats(HERO_BUDGET, def.role),
    leaderSkill: LEADER_SKILLS[def.leader],
  };
}

export const HERO_STATS = [
  // ── FEU ──
  hero({ id: 'ignis',   name: 'Ignis',   element: 'fire',   role: 'mage',    rarity: 3, type: 'Breaker',  leader: 'brasier_ardent',  burstTier: 'SBB' }),
  hero({ id: 'vargas',  name: 'Vargas',  element: 'fire',   role: 'support', rarity: 3, type: 'Oracle',   leader: 'flux_de_brave',   burstTier: 'BB'  }),
  // ── EAU ──
  hero({ id: 'selena',  name: 'Selena',  element: 'water',  role: 'support', rarity: 3, type: 'Oracle',   leader: 'coeur_aquatique', burstTier: 'BB'  }),
  hero({ id: 'margonia',name: 'Margonia',element: 'water',  role: 'mage',    rarity: 3, type: 'Breaker',  leader: 'maree_glaciale',  burstTier: 'SBB' }),
  // ── TERRE ──
  hero({ id: 'lance',   name: 'Lance',   element: 'earth',  role: 'tank',    rarity: 3, type: 'Guardian', leader: 'rempart_de_gaia', burstTier: 'BB'  }),
  hero({ id: 'zeln',    name: 'Zeln',    element: 'earth',  role: 'mage',    rarity: 3, type: 'Breaker',  leader: 'rage_des_mages',  burstTier: 'SBB' }),
  // ── FOUDRE ──
  hero({ id: 'karl',    name: 'Karl',    element: 'thunder',role: 'support', rarity: 3, type: 'Anima',    leader: 'economie_brave',  burstTier: 'BB'  }),
  hero({ id: 'eze',     name: 'Eze',     element: 'thunder',role: 'mage',    rarity: 3, type: 'Breaker',  leader: 'orage_dechaine',  burstTier: 'SBB' }),
  // ── LUMIÈRE ──
  hero({ id: 'sera',    name: 'Sera',    element: 'light',  role: 'support', rarity: 3, type: 'Oracle',   leader: 'benediction_vie', burstTier: 'BB'  }),
  hero({ id: 'atro',    name: 'Atro',    element: 'light',  role: 'mage',    rarity: 3, type: 'Lord',     leader: 'jugement_sacre',  burstTier: 'SBB' }),
  // ── TÉNÈBRES ──
  hero({ id: 'magress', name: 'Magress', element: 'dark',   role: 'tank',    rarity: 3, type: 'Guardian', leader: 'garde_des_ombres',burstTier: 'BB'  }),
  hero({ id: 'kikuri',  name: 'Kikuri',  element: 'dark',   role: 'support', rarity: 3, type: 'Oracle',   leader: 'malediction',     burstTier: 'BB'  }),

  // ── UNITÉS SPÉCIALES (5★) ──
  hero({ id: 'unit_10012',       name: 'Vargas Céleste', element: 'light', role: 'mage', rarity: 5, type: 'Lord',    leader: 'assaut_total', burstTier: 'UBB' }),
  hero({ id: 'unit_10013',       name: 'Selena Sombre',  element: 'dark',  role: 'mage', rarity: 5, type: 'Breaker', leader: 'assaut_total', burstTier: 'UBB' }),
  hero({ id: 'unit_ignis_frame', name: 'Ignis Divin',    element: 'fire',  role: 'mage', rarity: 6, type: 'Breaker', leader: 'assaut_total', burstTier: 'UBB' }),
];

/* ===========================================================================
 *  MONSTRES — STAT BLOCKS (6 biomes × 3 communs + 1 boss)
 *  -----------------------------------------------------------------------
 *  rarity croît avec le biome (progression du monde).
 *  Les monstres n'ont pas de Brave Burst : ils utilisent un "telegraph"
 *  (attaque annoncée) géré par combat-turn-engine.js.
 * ======================================================================== */

function mob(def, mult = 1) {
  return {
    ...def,
    base: buildBaseStats(MOB_BUDGET * mult, def.role || 'brute'),
  };
}

const BIOME_ELEMENTS = ['fire', 'water', 'earth', 'thunder', 'light', 'dark'];

// Noms (alignés sur ZONE_THEMES / assets existants).
const BIOME_MONSTERS = [
  { name: 'Cavernes d’Agni',    commons: ['Slime de Lave', 'Canidé d’Enfer', 'Élémentaire de Scorie'], boss: 'Dragon d’Agni' },
  { name: 'Océan Éternel',       commons: ['Méduse de Cristal', 'Éclaireur Squalide', 'Tortue de Récif'], boss: 'Léviathan' },
  { name: 'Forêt de Gaïa',       commons: ['Rôdeur Sylvestre', 'Golem de Mousse', 'Mante Géante'], boss: 'Gardien de Gaïa' },
  { name: 'Pic Foudroyé',        commons: ['Harpie Statique', 'Élémentaire d’Orage', 'Wyverne Électrique'], boss: 'Seigneur du Tonnerre' },
  { name: 'Sanctuaire Céleste',  commons: ['Séraphin Déchu', 'Gardien Doré', 'Spectre Lumineux'], boss: 'Archange Corrompu' },
  { name: 'Néant des Ombres',    commons: ['Ombre Rampante', 'Liche Maudite', 'Démon du Vide'], boss: 'Souverain du Néant' },
];

export const MONSTER_STATS = BIOME_MONSTERS.flatMap((biome, bi) => {
  const element = BIOME_ELEMENTS[bi];
  const rarity = Math.min(6, bi + 1); // biome 1 → 1★ … biome 6 → 6★
  const units = biome.commons.map((nm, ci) =>
    mob({
      id: `mob_b${bi + 1}_${ci + 1}`,
      name: nm, element, role: 'brute', rarity, kind: 'common', biome: bi + 1,
    }, ci === 2 ? ELITE_MULT : 1) // le 3e commun joue le rôle d'élite
  );
  const boss = mob({
    id: `boss_b${bi + 1}`,
    name: biome.boss, element, role: 'boss', rarity: Math.min(6, rarity + 1),
    kind: 'boss', biome: bi + 1,
  }, BOSS_MULT);
  return [...units, boss];
});

/* ===========================================================================
 *  HELPERS PRATIQUES
 * ======================================================================== */

/** Stats finales d'un héros à un niveau donné (max niveau par défaut). */
export function heroStatsAt(heroId, level = null) {
  const h = HERO_STATS.find((x) => x.id === heroId);
  if (!h) return null;
  const lvl = level ?? Infinity;
  return { ...h, ...computeStats(h.base, { stars: h.rarity, level: lvl, type: h.type }) };
}

/** Stats finales d'un monstre (niveau = recommandé pour son biome). */
export function monsterStatsAt(monsterId, level = null) {
  const m = MONSTER_STATS.find((x) => x.id === monsterId);
  if (!m) return null;
  const lvl = level ?? (m.biome * 10);
  return { ...m, ...computeStats(m.base, { stars: m.rarity, level: lvl, type: 'Lord' }) };
}

export const UNITS_STATS = { HERO_STATS, MONSTER_STATS, heroStatsAt, monsterStatsAt };

if (typeof module !== 'undefined' && module.exports) module.exports = UNITS_STATS;
if (typeof window !== 'undefined') window.UnitsStats = UNITS_STATS;

export default UNITS_STATS;
