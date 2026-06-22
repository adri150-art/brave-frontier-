// Soak test : jeu chargé en jsdom, taps rapides + temps accéléré, suivi mémoire/erreurs
import { JSDOM, VirtualConsole } from 'jsdom';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e.detail?.stack || e.message || e).slice(0, 300)));
vc.on('error', (...a) => errors.push(a.join(' ').slice(0, 300)));

const dom = await JSDOM.fromFile(join(root, 'index.html'), {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
  virtualConsole: vc, url: 'file://' + join(root, 'index.html'),
});
const w = dom.window;
await new Promise(r => setTimeout(r, 4000)); // boot

// Démarrer une partie
try { w.startMenuNewGame ? w.startMenuNewGame() : null; } catch(e) { errors.push('newGame: '+e.message); }
await new Promise(r => setTimeout(r, 1000));

const zone = w.document.getElementById('monster-zone');
const mem0 = process.memoryUsage().heapUsed;
let taps = 0;
const t0 = Date.now();

// 25 secondes de jeu intensif : ~20 taps/s + BB quand prêt
const tapTimer = setInterval(() => {
  try {
    if (zone) {
      const evt = new w.MouseEvent('click', { bubbles: true, clientX: 200, clientY: 200 });
      zone.dispatchEvent(evt);
      taps++;
    }
    // déclenche les BB prêts
    w.document.querySelectorAll('.footer-bb.ready').forEach(el => el.click());
  } catch(e) { errors.push('tap: ' + e.message); }
}, 50);

const samples = [];
const memTimer = setInterval(() => {
  global.gc && global.gc();
  samples.push(((process.memoryUsage().heapUsed - mem0) / 1048576).toFixed(1));
}, 5000);

await new Promise(r => setTimeout(r, 25000));
clearInterval(tapTimer); clearInterval(memTimer);
global.gc && global.gc();

const domNodes = w.document.getElementsByTagName('*').length;
console.log(`taps: ${taps} en ${((Date.now()-t0)/1000).toFixed(0)}s`);
console.log('heap delta (Mo) par 5s:', samples.join(' → '));
console.log('nœuds DOM:', domNodes);
console.log('particles[]:', (w.particles && w.particles.length) ?? 'n/a');
console.log('timers actifs estimés: n/a');
console.log('ERREURS (' + errors.length + '):');
[...new Set(errors)].slice(0, 10).forEach(e => console.log(' -', e));
process.exit(0);
