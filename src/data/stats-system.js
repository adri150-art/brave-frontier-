// =============================================================================
//  STATS-SYSTEM.js — SYSTÈME DE STATS UNIFIÉ (HÉROS + MONSTRES)
//  -----------------------------------------------------------------------------
//  Source de vérité unique pour l'équilibrage du jeu :
//    • ATT / DEF / HP de base, par rareté (1★ → 6★) et par niveau
//    • Modificateurs de TYPE (Lord, Anima, Breaker, Guardian, Oracle)
//    • Roue élémentaire (6 éléments) et avantages
//    • Compétences LEADER (boost d'équipe ATT/DEF/HP)
//    • Mode BRAVE BURST — power-up de combat (boost ATT/DEF temporaire + dégâts)
//
//  AUCUNE dépendance au DOM. Testable sous Node, importable dans le navigateur.
//  Toutes les valeurs d'équilibrage sont regroupées en haut → un seul endroit
//  à modifier pour rééquilibrer le jeu.
// =============================================================================

/* ===========================================================================
 *  1. ÉLÉMENTS & ROUE D'AVANTAGES
 * ======================================================================== */

// Clés internes (anglais) ⇄ libellés FR utilisés par l'UI.
export const ELEMENTS = ['fire', 'water', 'earth', 'thunder', 'light', 'dark'];

export const ELEMENT_LABEL = {
  fire: 'Feu', water: 'Eau', earth: 'Terre',
  thunder: 'Foudre', light: 'Lumière', dark: 'Ténèbres',
};

// A "bat" B  →  fire>earth>thunder>water>fire ; light<->dark
// (cohérent avec combat-turn-engine.js et ELEMENT_ADVANTAGE de balance.js)
export const ELEMENT_BEATS = {
  fire: 'earth', earth: 'thunder', thunder: 'water', water: 'fire',
  light: 'dark', dark: 'light',
};

// Réglages de la réfraction élémentaire (dégâts subis selon l'avantage).
export const ELEMENT_TUNING = {
  ADVANTAGE: 1.5,   // l'attaquant a l'avantage → +50% de dégâts
  DISADVANTAGE: 0.5, // l'attaquant est désavantagé → -50%
  NEUTRAL: 1.0,
};

/** Multiplicateur de dégâts selon l'élément attaquant vs défenseur. */
export function elementMultiplier(attacker, defender) {
  if (ELEMENT_BEATS[attacker] === defender) return ELEMENT_TUNING.ADVANTAGE;
  if (ELEMENT_BEATS[defender] === attacker) return ELEMENT_TUNING.DISADVANTAGE;
  return ELEMENT_TUNING.NEUTRAL;
}

/* ===========================================================================
 *  2. COURBES DE RARETÉ (1★ → 6★)
 *  -----------------------------------------------------------------------
 *  Chaque unité possède des stats de BASE (atk/def/hp) exprimées au niveau 1.
 *  La rareté multiplie ces stats (statMult) et débloque un palier de niveau
 *  (levelCap). La croissance par niveau est linéaire (growthPerLevel).
 *
 *  finalStat = baseStat × statMult × (1 + growthPerLevel × (level − 1)) × typeMod
 * ======================================================================== */

export const RARITY_TUNING = {
  1: { stars: 1, levelCap: 30,  statMult: 1.00, growthPerLevel: 0.040, label: '★'       },
  2: { stars: 2, levelCap: 40,  statMult: 1.55, growthPerLevel: 0.045, label: '★★'      },
  3: { stars: 3, levelCap: 60,  statMult: 2.40, growthPerLevel: 0.050, label: '★★★'     },
  4: { stars: 4, levelCap: 80,  statMult: 3.70, growthPerLevel: 0.055, label: '★★★★'    },
  5: { stars: 5, levelCap: 100, statMult: 5.60, growthPerLevel: 0.060, label: '★★★★★'   },
  6: { stars: 6, levelCap: 120, statMult: 8.50, growthPerLevel: 0.065, label: '★★★★★★'  },
  7: { stars: 7, levelCap: 150, statMult: 12.50, growthPerLevel: 0.070, label: '★★★★★★★' }, // palier ultime (Map 6)
};

/* ===========================================================================
 *  3. MODIFICATEURS DE TYPE (personnalité de l'unité)
 *  -----------------------------------------------------------------------
 *  Repris/étendu depuis balance.js (TYPE_MODS) : on expose désormais atk/def/hp.
 * ======================================================================== */

export const UNIT_TYPES = ['Lord', 'Anima', 'Breaker', 'Guardian', 'Oracle'];

export const TYPE_STAT_MODS = {
  Lord:     { atk: 1.00, def: 1.00, hp: 1.00 }, // polyvalent
  Anima:    { atk: 1.00, def: 0.85, hp: 1.25 }, // gros PV
  Breaker:  { atk: 1.25, def: 0.85, hp: 0.90 }, // gros ATT
  Guardian: { atk: 0.85, def: 1.25, hp: 1.00 }, // grosse DEF
  Oracle:   { atk: 0.95, def: 0.90, hp: 0.95 }, // soutien (bonus soin/BC ailleurs)
};

/* ===========================================================================
 *  4. RÔLES (gabarit de stats de base par archétype)
 *  -----------------------------------------------------------------------
 *  Permet de générer des stats cohérentes : un mage tape fort mais encaisse
 *  mal ; un tank l'inverse. Utilisé par buildUnitStats().
 * ======================================================================== */

export const ROLE_PROFILE = {
  mage:    { atk: 1.30, def: 0.80, hp: 0.85 },
  tank:    { atk: 0.75, def: 1.45, hp: 1.30 },
  support: { atk: 0.90, def: 1.05, hp: 1.10 },
  // gabarit générique pour les monstres communs / boss
  brute:   { atk: 1.15, def: 0.95, hp: 1.20 },
  boss:    { atk: 1.25, def: 1.20, hp: 2.50 },
};

/* ===========================================================================
 *  5. COMPÉTENCES LEADER (boost d'équipe)
 *  -----------------------------------------------------------------------
 *  Le héros placé en LEADER applique passivement son bonus à toute l'équipe
 *  (ou à un sous-ensemble : élément / rôle).
 *
 *  Forme : { id, name, target, targetDetail, stat, value }
 *    target       : 'all' | 'element' | 'role'
 *    targetDetail : '' | 'fire'… | 'mage'…
 *    stat         : 'atk' | 'def' | 'hp' | 'bb_rate' | 'bb_cost'
 *    value        : modificateur (+0.40 = +40%)
 * ======================================================================== */

export const LEADER_SKILLS = {
  // — Offensifs —
  brasier_ardent:   { name: 'Brasier Ardent',    target: 'element', targetDetail: 'fire',   stat: 'atk', value: 0.45 },
  maree_glaciale:   { name: 'Marée Glaciale',    target: 'element', targetDetail: 'water',  stat: 'atk', value: 0.45 },
  fureur_sauvage:   { name: 'Fureur Sauvage',    target: 'element', targetDetail: 'earth',  stat: 'atk', value: 0.45 },
  orage_dechaine:   { name: 'Orage Déchaîné',    target: 'element', targetDetail: 'thunder',stat: 'atk', value: 0.45 },
  jugement_sacre:   { name: 'Jugement Sacré',    target: 'element', targetDetail: 'light',  stat: 'atk', value: 0.45 },
  malediction:      { name: 'Malédiction',       target: 'element', targetDetail: 'dark',   stat: 'atk', value: 0.45 },
  rage_des_mages:   { name: 'Rage des Mages',    target: 'role',    targetDetail: 'mage',   stat: 'atk', value: 0.50 },
  assaut_total:     { name: 'Assaut Total',      target: 'all',     targetDetail: '',       stat: 'atk', value: 0.30 },

  // — Défensifs —
  rempart_de_gaia:  { name: 'Rempart de Gaïa',   target: 'all',     targetDetail: '',       stat: 'def', value: 0.35 },
  garde_des_ombres: { name: 'Garde des Ombres',  target: 'element', targetDetail: 'dark',   stat: 'def', value: 0.45 },
  mur_de_fer:       { name: 'Mur de Fer',        target: 'role',    targetDetail: 'tank',   stat: 'def', value: 0.55 },

  // — Vitalité —
  benediction_vie:  { name: 'Bénédiction de Vie',target: 'all',     targetDetail: '',       stat: 'hp',  value: 0.25 },
  coeur_aquatique:  { name: 'Cœur Aquatique',    target: 'element', targetDetail: 'water',  stat: 'hp',  value: 0.40 },

  // — Soutien / Burst —
  flux_de_brave:    { name: 'Flux de Brave',     target: 'all',     targetDetail: '',       stat: 'bb_rate', value: 0.30 },
  economie_brave:   { name: 'Économie Brave',    target: 'all',     targetDetail: '',       stat: 'bb_cost', value: -0.20 },
};

/* ===========================================================================
 *  6. BRAVE BURST — POWER-UP DE COMBAT
 *  -----------------------------------------------------------------------
 *  Le Brave Burst est un POWER-UP : quand la jauge BC est pleine, le héros
 *  entre en mode Burst → ses ATT/DEF sont temporairement boostées et il
 *  délivre une attaque à fort multiplicateur.
 *
 *  3 paliers : BB → SBB → UBB (puissance croissante, jauge plus coûteuse).
 *    gaugeCost   : points de jauge requis (jauge pleine = 100)
 *    atkBuff     : boost ATT pendant le Burst (+1.0 = ×2)
 *    defBuff     : boost DEF pendant le Burst
 *    dmgMult     : multiplicateur de l'attaque Burst (sur l'ATT boostée)
 *    duration    : nb de tours pendant lesquels le boost ATT/DEF reste actif
 * ======================================================================== */

export const BURST_TIERS = {
  BB:  { key: 'BB',  label: 'Brave Burst',   gaugeCost: 100, atkBuff: 0.50, defBuff: 0.25, dmgMult: 1.8, duration: 1, color: '#00d2ff' },
  SBB: { key: 'SBB', label: 'Super BB',      gaugeCost: 100, atkBuff: 1.00, defBuff: 0.50, dmgMult: 2.6, duration: 2, color: '#f1c40f' },
  UBB: { key: 'UBB', label: '⚡ Ultimate BB', gaugeCost: 100, atkBuff: 2.50, defBuff: 1.50, dmgMult: 4.5, duration: 3, color: '#ff3366' },
};

// Génération de jauge BC.
export const BB_GAUGE = {
  MAX: 100,
  PER_TURN: 10,     // gain passif par tour
  PER_HIT_DEALT: 8, // gain quand le héros attaque
  PER_HIT_TAKEN: 5, // gain quand le héros encaisse
};

/* ===========================================================================
 *  7. FORMULES DE CALCUL
 * ======================================================================== */

/**
 * Stats finales d'une unité à un niveau donné.
 * @param {object} base   { atk, def, hp }  — stats de base au niveau 1 / 1★
 * @param {object} opts   { stars=1, level=1, type='Lord' }
 * @returns {{atk:number, def:number, hp:number, stars:number, level:number, levelCap:number, type:string}}
 */
export function computeStats(base, { stars = 1, level = 1, type = 'Lord' } = {}) {
  const R = RARITY_TUNING[stars] || RARITY_TUNING[1];
  const T = TYPE_STAT_MODS[type] || TYPE_STAT_MODS.Lord;
  const lvl = Math.min(level, R.levelCap);
  const lvlFactor = 1 + R.growthPerLevel * (lvl - 1);

  const scale = (b, t) => Math.round(b * R.statMult * lvlFactor * t);

  return {
    atk: scale(base.atk, T.atk),
    def: scale(base.def, T.def),
    hp:  scale(base.hp,  T.hp),
    stars, level: lvl, levelCap: R.levelCap, type,
  };
}

/**
 * Construit des stats de base cohérentes à partir d'un budget de puissance
 * et d'un rôle. Garantit l'équilibrage automatique entre unités.
 * @param {number} budget  — enveloppe de puissance (plus haut = plus fort)
 * @param {string} role    — clé de ROLE_PROFILE
 */
export function buildBaseStats(budget, role = 'brute') {
  const P = ROLE_PROFILE[role] || ROLE_PROFILE.brute;
  return {
    atk: Math.round(budget * 0.10 * P.atk),
    def: Math.round(budget * 0.07 * P.def),
    hp:  Math.round(budget * 1.00 * P.hp),
  };
}

/**
 * Applique la compétence leader à une équipe.
 * @param {Array} team   — [{ element, role, stats:{atk,def,hp}, ... }]
 * @param {object} leaderSkill — entrée de LEADER_SKILLS
 * @returns {Array} équipe avec stats.atk/def/hp ajustées + champ bbMods
 */
export function applyLeaderSkill(team, leaderSkill) {
  if (!leaderSkill) return team;
  const { target, targetDetail, stat, value } = leaderSkill;

  const qualifies = (u) =>
    target === 'all' ||
    (target === 'element' && u.element === targetDetail) ||
    (target === 'role' && u.role === targetDetail);

  return team.map((u) => {
    if (!qualifies(u)) return u;
    const out = { ...u, stats: { ...u.stats }, bbMods: { ...(u.bbMods || {}) } };
    if (stat === 'atk' || stat === 'def' || stat === 'hp') {
      out.stats[stat] = Math.round(out.stats[stat] * (1 + value));
    } else {
      // bb_rate / bb_cost : modificateurs de jauge, appliqués côté combat
      out.bbMods[stat] = (out.bbMods[stat] || 0) + value;
    }
    return out;
  });
}

/**
 * Calcule les stats EN MODE BURST + les dégâts de l'attaque Brave Burst.
 * @param {object} stats  — { atk, def } courants (après leader)
 * @param {string} tierKey — 'BB' | 'SBB' | 'UBB'
 * @param {object} target  — { def=0, element } cible (pour dégâts)
 * @param {string} attackerElement
 * @returns {{burstAtk, burstDef, burstDamage, tier, duration}}
 */
export function applyBurst(stats, tierKey = 'BB', target = { def: 0 }, attackerElement = null) {
  const tier = BURST_TIERS[tierKey] || BURST_TIERS.BB;
  const burstAtk = Math.round(stats.atk * (1 + tier.atkBuff));
  const burstDef = Math.round(stats.def * (1 + tier.defBuff));

  const elemMult = (attackerElement && target.element)
    ? elementMultiplier(attackerElement, target.element) : 1;

  const burstDamage = Math.max(
    1,
    Math.round((burstAtk * tier.dmgMult * elemMult) - (target.def || 0))
  );

  return { burstAtk, burstDef, burstDamage, tier: tier.key, duration: tier.duration, elemMult };
}

/**
 * Dégâts d'une attaque normale (hors Burst) avec avantage élémentaire.
 */
export function basicDamage(attackerStats, attackerElement, target) {
  const elemMult = (attackerElement && target.element)
    ? elementMultiplier(attackerElement, target.element) : 1;
  return Math.max(1, Math.round(attackerStats.atk * elemMult - (target.def || 0)));
}

/* ===========================================================================
 *  8. EXPORT GROUPÉ (Node + navigateur)
 * ======================================================================== */

export const STATS_SYSTEM = {
  ELEMENTS, ELEMENT_LABEL, ELEMENT_BEATS, ELEMENT_TUNING,
  RARITY_TUNING, UNIT_TYPES, TYPE_STAT_MODS, ROLE_PROFILE,
  LEADER_SKILLS, BURST_TIERS, BB_GAUGE,
  elementMultiplier, computeStats, buildBaseStats,
  applyLeaderSkill, applyBurst, basicDamage,
};

// Compat CommonJS (tests Node) + global navigateur.
if (typeof module !== 'undefined' && module.exports) module.exports = STATS_SYSTEM;
if (typeof window !== 'undefined') window.StatsSystem = STATS_SYSTEM;

export default STATS_SYSTEM;
