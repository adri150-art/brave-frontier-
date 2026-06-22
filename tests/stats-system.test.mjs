// Vérification du système de stats — bundle via esbuild puis exécuté sous Node.
import {
  computeStats, applyLeaderSkill, applyBurst, basicDamage,
  elementMultiplier, RARITY_TUNING, LEADER_SKILLS, BURST_TIERS,
} from '../src/data/stats-system.js';
import { HERO_STATS, MONSTER_STATS, heroStatsAt, monsterStatsAt } from '../src/data/units-stats.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } };

// 1. Monotonie de la rareté : plus d'étoiles ⇒ plus de stats (même base/niveau).
const base = { atk: 100, def: 70, hp: 1000 };
let prev = 0;
for (let s = 1; s <= 6; s++) {
  const st = computeStats(base, { stars: s, level: 1 });
  ok(st.atk > prev, `ATT croît avec ${s}★ (got ${st.atk})`);
  prev = st.atk;
}

// 2. Cap de niveau respecté.
const capped = computeStats(base, { stars: 3, level: 999 });
ok(capped.level === RARITY_TUNING[3].levelCap, 'niveau plafonné au levelCap 3★');

// 3. Type mods : Breaker > Guardian en ATT ; inverse en DEF.
const br = computeStats(base, { stars: 4, level: 40, type: 'Breaker' });
const gu = computeStats(base, { stars: 4, level: 40, type: 'Guardian' });
ok(br.atk > gu.atk, 'Breaker ATT > Guardian ATT');
ok(gu.def > br.def, 'Guardian DEF > Breaker DEF');

// 4. Roue élémentaire.
ok(elementMultiplier('fire', 'earth') === 1.5, 'Feu bat Terre (×1.5)');
ok(elementMultiplier('earth', 'fire') === 0.5, 'Terre désavantagée vs Feu (×0.5)');
ok(elementMultiplier('fire', 'water') === 0.5, 'Feu désavantagé vs Eau');
ok(elementMultiplier('light', 'dark') === 1.5, 'Lumière bat Ténèbres');

// 5. Leader skill : +45% ATT aux unités feu uniquement.
const team = [
  { element: 'fire',  role: 'mage', stats: { atk: 100, def: 50, hp: 500 } },
  { element: 'water', role: 'mage', stats: { atk: 100, def: 50, hp: 500 } },
];
const boosted = applyLeaderSkill(team, LEADER_SKILLS.brasier_ardent);
ok(boosted[0].stats.atk === 145, 'Feu reçoit +45% ATT (145)');
ok(boosted[1].stats.atk === 100, 'Eau non affectée par leader Feu');

// 6. Burst : ATT/DEF boostées + dégâts > attaque normale.
const stats = { atk: 200, def: 80 };
const tgt = { def: 50, element: 'earth' };
const burst = applyBurst(stats, 'SBB', tgt, 'fire');
ok(burst.burstAtk === Math.round(200 * 2), 'SBB double l’ATT');
const normal = basicDamage(stats, 'fire', tgt);
ok(burst.burstDamage > normal, `dégâts Burst (${burst.burstDamage}) > normal (${normal})`);
const ubb = applyBurst(stats, 'UBB', tgt, 'fire');
ok(ubb.burstDamage > burst.burstDamage, 'UBB > SBB en dégâts');

// 7. Intégrité des données.
ok(HERO_STATS.length === 15, `15 héros (got ${HERO_STATS.length})`);
ok(MONSTER_STATS.length === 24, `24 monstres (6 biomes × 4) (got ${MONSTER_STATS.length})`);
ok(HERO_STATS.every(h => h.leaderSkill && h.base && BURST_TIERS[h.burstTier]), 'chaque héros a leader+base+burst valides');
ok(heroStatsAt('eze').atk > 0, 'heroStatsAt(eze) calcule une ATT');
ok(monsterStatsAt('boss_b6').hp > monsterStatsAt('mob_b1_1').hp, 'boss final plus costaud que 1er commun');

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} OK, ${fail} échec(s)`);

// Aperçu lisible.
console.log('\n— Aperçu héros (niveau max) —');
['ignis', 'lance', 'eze', 'unit_ignis_frame'].forEach(id => {
  const h = heroStatsAt(id);
  console.log(`  ${h.name.padEnd(16)} ${h.rarity}★ ${h.type.padEnd(8)} ATT ${String(h.atk).padStart(6)}  DEF ${String(h.def).padStart(6)}  HP ${String(h.hp).padStart(7)}  Burst ${h.burstTier}`);
});
console.log('\n— Aperçu monstres —');
['mob_b1_1', 'boss_b1', 'boss_b6'].forEach(id => {
  const m = monsterStatsAt(id);
  console.log(`  ${m.name.padEnd(20)} ${m.rarity}★ ATT ${String(m.atk).padStart(6)}  DEF ${String(m.def).padStart(6)}  HP ${String(m.hp).padStart(7)}`);
});

if (fail > 0) process.exit(1);
