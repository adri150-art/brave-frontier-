// §1.7 — Bootstrap : load → init systems → start loop
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION INCRÉMENTALE (strangler-fig). État au 2026-06-09 — Incrément 3 :
//
//   ✅ COUCHE DONNÉES COMPLÈTE & VÉRIFIÉE EN NODE (identique au monolithe, 0 divergence) :
//        data/heroes · biomes · monsters · balance · affixes · skilltree · banners · liveops · squad
//   ✅ CORE PUR-LOGIQUE : core/bignum (_Dec,D,fmt) · core/events (bus) · core/rng (seedé)
//
//   ✅ CORE save/store/loop : DEFAULT_STATE, deepMerge, migrateSave (verbatim) + store + boucle fixed-timestep
//   ⏳ RESTE : systems/* (combat, economy, gacha, loot, prestige, progression, retention), ui/*, PUIS câblage.
//
//   ⚠️ index.html garde encore ses copies inline → ces modules sont "prêts à brancher".
//      Tant que le câblage n'est pas fait : modifier le MONOLITHE, jamais les modules.
//
//   STRATÉGIE DE CÂBLAGE RECOMMANDÉE (voir WIRING_GUIDE.md) :
//      Ne PAS transformer le monolithe en module (casserait les 51+ handlers onclick).
//      Préférer : builder src/ en un bundle "globals" (esbuild --format=iife) chargé
//      AVANT le monolithe, puis supprimer les copies inline. Le monolithe reste un
//      script classique → handlers intacts.
// ─────────────────────────────────────────────────────────────────────────────

import { _Dec, D, fmt }      from './core/bignum.js';
import { on, off, emit }     from './core/events.js';
import { createRng, rng }    from './core/rng.js';
import { DEFAULT_STATE, deepMerge, migrateSave, SAVE_VERSION } from './core/save.js';
import * as store                 from './core/store.js';
import { createFixedTimestep, GAME_TICK } from './core/loop.js';

import { HERO_DEFS }                          from './data/heroes.js';
import * as Biomes                            from './data/biomes.js';
import { MONSTER_IMAGES }                     from './data/monsters.js';
import * as Balance                           from './data/balance.js';
import * as Affixes                           from './data/affixes.js';
import * as SkillTree                         from './data/skilltree.js';
import { SUMMON_POOLS }                       from './data/banners.js';
import * as LiveOps                           from './data/liveops.js';
import * as Squad                             from './data/squad.js';

console.log('[main.js] modules réels chargés — héros:', HERO_DEFS.length,
    '| biomes:', Biomes.ZONE_THEMES.length, '| affixes:', Affixes.AFFIX_TABLE.length);

export {
    _Dec, D, fmt, on, off, emit, createRng, rng,
    HERO_DEFS, MONSTER_IMAGES, SUMMON_POOLS,
    Biomes, Balance, Affixes, SkillTree, LiveOps, Squad,
    DEFAULT_STATE, deepMerge, migrateSave, SAVE_VERSION, store, createFixedTimestep, GAME_TICK,
};
