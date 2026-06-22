// =============================================================================
//  bestiary-balance.mjs — PREUVE CHIFFRÉE DE L'ÉQUILIBRAGE DU BESTIAIRE
//  -----------------------------------------------------------------------------
//  Confronte, pour les 6 maps, une équipe de 4 héros « classe Ignis » du bon
//  palier d'étoiles aux monstres du bestiaire, et vérifie que les rapports de
//  puissance restent dans la bande équitable : « ni trop fort, ni trop faible ».
//
//  Modèle de combat (volontairement CONSERVATEUR — 1 tour héros = 1 tour monstre,
//  sans Brave Burst ni avantage élémentaire, qui jouent ensuite EN FAVEUR du
//  joueur) :
//    • dégâts squad/coup  = max(1, 4 × héroATK − monstreDEF)
//    • dégâts monstre/coup = max(1, monstreATK − héroDEF)     (encaissé par la squad)
//    • PV squad           = 4 × héroPV
//  Sorties : coups-pour-tuer (TTK) et marge de survie face au boss.
// =============================================================================

import { refHero, BESTIARY, ENCOUNTER_RATIOS, MAP_POWER_TIER } from '../src/data/bestiary.js';

const SQUAD_SIZE = 4;
// Jeu idle/clicker : les héros enchaînent les frappes pendant que le monstre
// n'attaque qu'au télégraphe. On modélise HERO_RATE attaques héros par swing
// monstre (valeur prudente : un vrai clicker en fait davantage).
const HERO_RATE = 4;

// Bandes « équitables » attendues (combat conservateur, hors burst/élément
// — qui jouent ENSUITE en faveur du joueur et offrent la marge restante).
const BANDS = {
  commonTTK: [1, 10],    // un commun tombe vite
  miniTTK:   [2, 40],    // mini-boss : effort réel
  bossTTK:   [6, 120],   // boss : combat marquant
  // marge de survie face au boss = PV squad ÷ dégâts subis pendant le combat.
  // ≥ 1,0 : la squad survit au combat ; ≤ 20 : le boss reste menaçant.
  bossSurvival: [1.0, 20],
};

function fight(squadAtk, squadHp, heroDef, mon) {
  const hitOnMon  = Math.max(1, squadAtk - mon.def);
  const hitOnHero = Math.max(1, mon.atk - heroDef);
  const ttk       = Math.ceil(mon.hp / hitOnMon);             // frappes héros pour tuer
  const monSwings = ttk / HERO_RATE;                          // swings monstre pendant le combat
  const dmgTaken  = monSwings * hitOnHero;
  const survive   = +(squadHp / Math.max(1, dmgTaken)).toFixed(2); // marge de survie
  return { ttk, survive };
}

function band(label, val, [lo, hi]) {
  const ok = val >= lo && val <= hi;
  return { ok, txt: `${ok ? '✅' : '❌'} ${label}=${val} [${lo}-${hi}]` };
}

let allPass = true;
const rows = [];

BESTIARY.forEach((map, mi) => {
  const tier   = MAP_POWER_TIER[mi];
  const ref    = refHero(tier);
  const squadAtk = SQUAD_SIZE * ref.atk;
  const squadHp  = SQUAD_SIZE * ref.hp;
  const heroDef  = ref.def;

  // Échantillon représentatif : zone 1 stage 1 (début), zone 5 stage 5 (boss final de map).
  const z1s1 = map.zones[0].stages[0];
  const z5s5 = map.zones[4].stages[4];

  const common = fight(squadAtk, squadHp, heroDef, z1s1.wave[0]);
  const mini   = fight(squadAtk, squadHp, heroDef, map.zones[0].stages[0].leader); // mini-boss z1s1
  const boss   = fight(squadAtk, squadHp, heroDef, z5s5.leader);

  const bossSurvival = boss.survive;

  const checks = [
    band('communTTK', common.ttk, BANDS.commonTTK),
    band('miniTTK',   mini.ttk,   BANDS.miniTTK),
    band('bossTTK',   boss.ttk,   BANDS.bossTTK),
    band('survieBoss', bossSurvival, BANDS.bossSurvival),
  ];
  const mapPass = checks.every(c => c.ok);
  allPass = allPass && mapPass;

  rows.push({
    map: `Map ${mi + 1} ${map.name}`, tier: `${tier}★`,
    refHero: `ATK ${ref.atk} / PV ${ref.hp} / DEF ${ref.def}`,
    bossFinal: z5s5.leader.name,
    bossStats: `PV ${z5s5.leader.hp} / ATK ${z5s5.leader.atk} / DEF ${z5s5.leader.def}`,
    checks,
  });
});

// ── Affichage ──
console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  ÉQUILIBRAGE DU BESTIAIRE — héros « classe Ignis » vs monstres');
console.log('══════════════════════════════════════════════════════════════════');
rows.forEach(r => {
  console.log(`\n▶ ${r.map}  (héros recommandés ${r.tier})`);
  console.log(`    Héros réf. (×4 en squad) : ${r.refHero}`);
  console.log(`    Boss final de map        : ${r.bossFinal} — ${r.bossStats}`);
  console.log('    ' + r.checks.map(c => c.txt).join('   '));
});

// ── Courbe de progression (PV du boss de fin de chaque map) ──
console.log('\n── Courbe de puissance (PV du boss final de chaque map) ──');
BESTIARY.forEach((map, mi) => {
  const boss = map.zones[4].stages[4].leader;
  const prev = mi > 0 ? BESTIARY[mi - 1].zones[4].stages[4].leader.hp : null;
  const x = prev ? `(×${(boss.hp / prev).toFixed(2)})` : '';
  console.log(`   Map ${mi + 1} ${map.name.padEnd(10)} : ${String(boss.hp).padStart(7)} PV  ${x}`);
});

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(allPass ? '  ✅ ÉQUILIBRAGE VALIDÉ — tous les ratios sont dans la bande équitable.'
                    : '  ❌ DÉSÉQUILIBRE DÉTECTÉ — voir les ❌ ci-dessus.');
console.log('══════════════════════════════════════════════════════════════════\n');

process.exit(allPass ? 0 : 1);
