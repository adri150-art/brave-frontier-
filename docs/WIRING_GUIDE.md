# 🔌 Guide de câblage des modules (Mission 2 — étape navigateur)

> ✅ **Étape 1 FAITE & vérifiée (jsdom) : `bignum` câblé** via `assets/globals.bundle.js`. À confirmer avec `npm run dev`. Étapes suivantes ci-dessous.
>
> ✅ **Étape 2 FAITE (2026-06-10) : couche `data` complète câblée.** Les 34 constantes data (HERO_DEFS, ZONE_THEMES, SUMMON_POOLS, FORMATIONS, SYNERGIES, SKILL_TREE_DEF, etc.) sont fournies par `assets/globals.bundle.js` ; leurs copies inline ont été supprimées du monolithe (index.html : 11 767 → 11 225 lignes). Vérifié : 0 divergence (`tools/compare-inline-vs-modules.mjs`), syntaxe OK (`node --check`), smoke test jsdom 22/22 (`tools/smoke-test.mjs`), tests modules 90 016/90 016. Sauvegarde : `index.BEFORE_DATA_WIRING.20260610_095748.html`. **À confirmer avec `npm run dev` (checklist ci-dessous).** Prochaine étape : `core/save.js`.

L'extraction est faite : `src/core/*` et `src/data/*` sont réels et vérifiés (0 divergence avec le monolithe).
Le **câblage** = faire en sorte que `index.html` UTILISE ces modules au lieu de ses copies inline. C'est l'étape à tester **dans le navigateur** (`npm run dev`), un module à la fois.

## ⚠️ Le piège : 51+ handlers `onclick=` inline
Transformer le `<script>` principal en `<script type="module">` **casserait tous les handlers inline** (`onclick="upgradeTap()"`, etc.) car les fonctions d'un module ne sont pas globales. Au moins **51 fonctions** sont appelées depuis le HTML statique (et davantage depuis les `innerHTML` dynamiques) :

```
_bossReviveAccept _bossReviveDecline adDoubleOfflineGains adDoubleQuestReward adFreeSummon adGoldBuff attackWeeklyBoss buyCurrentHero buyIAP claimAchievement claimBattlePassDay claimDailyQuest claimLoginBonus claimWeeklyReward closeAchShare closeBossVictory closeDifficultyModal closeDrawer closeHeroModal closeReveal closeTeamBuilder confirmReset doPrestigeChoice equipSphere evolveCurrentHero exportSave importSavePrompt levelUpCurrentHero openDifficultyModal openPrestigeChoiceModal openSquadShareModal openTeamBuilder selectDifficulty selectFormation setPerfMode shareBossVictory skipTutorial startMenuContinue startMenuNewGame startMenuOptions summonHonor summonRare summonRare10 tbSetFilter toggleSettingsBGM toggleSettingsSFX toggleSphereSelect toggleSquadCurrentHero upgradeTap useBB usePlayerSkill 
```

## ✅ Stratégie recommandée (faible risque) : bundle "globals" AVANT le monolithe
Plutôt que de modulariser le monolithe, on garde le monolithe en **script classique** (handlers intacts) et on lui fournit les modules sous forme de **globals**, chargés avant lui.

1. **Point d'entrée globals** — créer `src/globals.js` :
   ```js
   import * as bignum from './core/bignum.js';
   import { HERO_DEFS } from './data/heroes.js';
   import * as Biomes from './data/biomes.js';
   // ...tous les modules data + core
   Object.assign(window, bignum);          // window._Dec, window.D, window.fmt
   window.HERO_DEFS = HERO_DEFS;
   Object.assign(window, Biomes, /* ... */);
   ```
2. **Builder en IIFE** (esbuild, déjà en devDep) :
   ```
   npx esbuild src/globals.js --bundle --format=iife --outfile=assets/globals.bundle.js
   ```
3. **Charger AVANT le monolithe** dans `index.html` :
   ```html
   <script src="./assets/globals.bundle.js"></script>   <!-- classique, s'exécute avant -->
   <script> /* monolithe, copies inline supprimées */ </script>
   ```
   ⚠️ Un script classique normal s'exécute dans l'ordre du document → `globals.bundle.js` placé avant garantit que `window.D` etc. existent quand le monolithe charge. (Ne pas utiliser `type="module"` ici, qui est différé.)
4. **Supprimer une copie inline à la fois** dans le monolithe (commencer par `_Dec/D/fmt`), puis :
   ```
   npm run dev  → vérifier : démarrage, fmt à l'écran, combat, achat, sauvegarde
   ```
   Ne passer au bloc suivant (`HERO_DEFS`, puis biomes, etc.) **qu'après** validation navigateur.

## Checklist de validation navigateur (entre chaque suppression de copie inline)
- [ ] Le menu de démarrage s'affiche, "Continuer"/"Nouvelle partie" fonctionnent
- [ ] Les nombres s'affichent (`fmt`) — or, HP, DPS
- [ ] Le combat fonctionne (tap, mort de monstre, boss)
- [ ] Achat/level-up de héros, invocation
- [ ] Sauvegarde/rechargement (recharger la page → progression conservée)
- [ ] Console sans `ReferenceError`

## Ordre d'extraction restant (après la couche data, déjà faite)
1. `core/save.js` (DEFAULT_STATE, deepMerge, IDB) — extraire du monolithe
2. `core/loop.js` (boucle maître) — dépend du store
3. `core/store.js` (état G + dirty flags)
4. `systems/*` un par un (combat en dernier, le plus couplé)
5. `ui/*`
