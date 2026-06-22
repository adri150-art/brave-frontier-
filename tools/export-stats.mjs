// Exporte un JSON d'équilibrage complet (toutes unités, paliers de stats).
import fs from 'node:fs';
import {
  RARITY_TUNING, TYPE_STAT_MODS, ROLE_PROFILE, LEADER_SKILLS, BURST_TIERS,
  ELEMENT_BEATS, ELEMENT_LABEL, computeStats,
} from '../src/data/stats-system.js';
import { HERO_STATS, MONSTER_STATS } from '../src/data/units-stats.js';

const heroRow = (h) => {
  const lv1 = computeStats(h.base, { stars: h.rarity, level: 1, type: h.type });
  const max = computeStats(h.base, { stars: h.rarity, level: RARITY_TUNING[h.rarity].levelCap, type: h.type });
  return {
    id: h.id, name: h.name, element: ELEMENT_LABEL[h.element], role: h.role,
    rarity: h.rarity, type: h.type,
    base: h.base,
    statsLv1: { atk: lv1.atk, def: lv1.def, hp: lv1.hp },
    statsMax: { atk: max.atk, def: max.def, hp: max.hp, level: max.level },
    leaderSkill: h.leaderSkill,
    burst: BURST_TIERS[h.burstTier],
  };
};

const mobRow = (m) => {
  const st = computeStats(m.base, { stars: m.rarity, level: m.biome * 10, type: 'Lord' });
  return {
    id: m.id, name: m.name, element: ELEMENT_LABEL[m.element], kind: m.kind,
    biome: m.biome, rarity: m.rarity,
    stats: { atk: st.atk, def: st.def, hp: st.hp, level: st.level },
  };
};

const out = {
  generatedAt: new Date().toISOString(),
  config: {
    rarity: RARITY_TUNING,
    types: TYPE_STAT_MODS,
    roles: ROLE_PROFILE,
    elementWheel: ELEMENT_BEATS,
    leaderSkills: LEADER_SKILLS,
    burstTiers: BURST_TIERS,
  },
  heroes: HERO_STATS.map(heroRow),
  monsters: MONSTER_STATS.map(mobRow),
};

fs.writeFileSync(new URL('../docs/stats-balance.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('Écrit docs/stats-balance.json —', out.heroes.length, 'héros,', out.monsters.length, 'monstres');
