// Smoke test headless : index.html doit charger sans ReferenceError
// et les globals data doivent être accessibles depuis le monolithe.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const vc = new (await import('jsdom')).VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e.detail?.stack || e.message || e)));
vc.on('error', (...a) => errors.push(a.join(' ')));

const dom = await JSDOM.fromFile(join(root, 'index.html'), {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'file://' + join(root, 'index.html'),
});

await new Promise(r => setTimeout(r, 4000)); // laisser le boot se faire

const w = dom.window;
let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; } else { fail++; console.log('  ❌', l); } };

// Globals data exposés par le bundle
for (const n of ['HERO_DEFS','ZONE_THEMES','SUMMON_POOLS','FORMATIONS','SYNERGIES','SKILL_TREE_DEF','ACHIEVEMENTS_DEFS','MONSTER_IMAGES','EVO_LEVEL_CAPS','ELEMENT_ADVANTAGE','AFFIX_TABLE','SPHERE_DEFS','D','fmt'])
  ok(w[n] !== undefined, `window.${n} manquant`);

ok(Array.isArray(w.HERO_DEFS) && w.HERO_DEFS.length >= 12, 'HERO_DEFS peuplé');
ok(typeof w.fmt === 'function' && w.fmt(1e21) === '1.00Sx', 'fmt fonctionne');

// Fonctions du monolithe qui consomment la data (preuve que le câblage tient)
for (const n of ['upgradeTap','summonRare','useBB','startMenuNewGame','exportSave'])
  ok(typeof w[n] === 'function', `fonction monolithe ${n} absente`);

const refErrors = errors.filter(e => /ReferenceError/.test(e));
ok(refErrors.length === 0, `ReferenceError détectées:\n${refErrors.slice(0,5).join('\n')}`);

console.log(`\nSmoke test — PASS: ${pass}  FAIL: ${fail}`);
if (errors.length && fail) console.log('\nErreurs page (extrait):\n' + errors.slice(0, 5).join('\n---\n').slice(0, 2000));
process.exit(fail ? 1 : 0);
