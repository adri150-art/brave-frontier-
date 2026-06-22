// §1.7 src/globals.js — Point d'entrée "globals" pour le câblage incrémental.
// Buildé en IIFE (esbuild) → assets/globals.bundle.js, chargé AVANT le monolithe.
// Expose sur window les modules dont la copie inline a été retirée de index.html.
// ÉTAPE 1 : bignum (+ events/rng additifs, inoffensifs).
import { _Dec, D, fmt }   from './core/bignum.js';
import { on, off, emit }  from './core/events.js';
import { createRng, rng } from './core/rng.js';

// ÉTAPE 2 : couche data complète (vérifiée 0 divergence — tools/compare-inline-vs-modules.mjs)
import * as Affixes   from './data/affixes.js';
import * as Balance   from './data/balance.js';
import * as Banners   from './data/banners.js';
import * as Biomes    from './data/biomes.js';
import * as Heroes    from './data/heroes.js';
import * as LiveOps   from './data/liveops.js';
import * as Monsters  from './data/monsters.js';
import * as SkillTree from './data/skilltree.js';
import * as Squad     from './data/squad.js';

Object.assign(window, { _Dec, D, fmt, on, off, emit, createRng, rng },
  Affixes, Balance, Banners, Biomes, Heroes, LiveOps, Monsters, SkillTree, Squad);
console.log('[globals] exposés : bignum/events/rng + couche data (affixes, balance, banners, biomes, heroes, liveops, monsters, skilltree, squad)');
