# ✅ Mission 2 — Rapport de vérification & état réel

**Date :** 2026-06-09 · **Fichier audité :** `index.html` (11 832 lignes) + `src/` (scaffold)

## État réel de la Mission 2 (important)
Il existe **deux codebases** :
1. **`index.html` = LE jeu** (monolithe autonome, aucun `import` de module). Les *features* Mission 2 y ont été **retrofittées**.
2. **`src/` = scaffold** : structure exacte du plan (`core/data/systems/ui`) + Vite, mais **modules vides (stubs)** — 321 lignes au total (~3 % du jeu). `main.js` dit lui-même « extraction progressive en cours ». **Vite a pour entrée `index.html`** → `vite build` ne fait que **minifier le monolithe** ; les modules `src/` ne sont importés nulle part (code mort pour l'instant).

| Sous-tâche Mission 2 | État | Vérifié |
|---|---|---|
| (1) Vite + structure `src/` | ✅ scaffoldé | structure conforme au plan |
| (2) Extraction des données (`HERO_DEFS`, biomes, monstres) en modules | ❌ **non fait** | modules = stubs de 5 lignes |
| (3) Store + event bus + refacto `killMonster()` | ❌ **non fait** | `events.js` = stub ; le monolithe appelle toujours les renders en dur (0 `emit`) |
| (4) Écran Carte du Monde + hub | ✅ fait dans le monolithe | `renderWorldMap()` s'exécute sans erreur |
| (5) Sauvegarde `DEFAULT_STATE`+deepMerge+IndexedDB | ✅ fait dans le monolithe | **round-trip + migration vérifiés** |

## Tests exécutés (jsdom, chemin réel du jeu)
- **Round-trip save/load** : `gold=1.2345e25` (→ `"12.3Sp"`), `zone=42`, héros `vargas` niv. 50, `squad[1]='vargas'` → sauvegardés, wipe mémoire, rechargés **à l'identique**. `gold` correctement re-converti en `_Dec`.
- **Migration vieille sauvegarde** (gold numérique `5000`, champs manquants, sans `_v`) : charge **sans crash**, `gold`→`_Dec`(5000), `zone=7`, **nouveaux champs `DEFAULT_STATE` injectés**, `squad` reste un tableau.
- **World Map** : `renderWorldMap()` s'exécute sans exception.
- **Boot** : **0 erreur runtime.**
- **Diagnostic aliasing `deepMerge`** : hypothèse d'un partage de référence `G.heroes`/`DEFAULT_STATE.heroes` → **infirmée empiriquement** (`false`). Aucune correction nécessaire (et aucune faite : on ne « corrige » pas du code sain sur une théorie).

## Ce qui reste = le cœur architectural
L'**extraction réelle** du monolithe (11 832 lignes) vers les modules `src/` câblés via event bus/store **n'est pas faite**. C'est la pièce la plus lourde, la plus risquée, et **non vérifiable sans navigateur** (serveur Vite + test de jeu manuel).

**Recommandation d'architecte :** ne PAS faire cette extraction en « big-bang ». Procéder en *strangler-fig* incrémental — un module à la fois, en testant dans le navigateur entre chaque étape — en commençant par les modules pur-logique sans dépendance DOM (`bignum`, `data/*`, `rng`, `events`), puis en basculant `index.html` sur `<script type="module" src="/src/main.js">` progressivement.

---

## 🧩 Extraction modulaire — Incrément 1 (guidé, 2026-06-09)

Premier pas de l'extraction *strangler-fig* : les modules pur-logique **sans dépendance DOM** sont désormais **réels et vérifiés en Node** (le monolithe n'est **pas** modifié — risque nul sur le jeu en production).

| Module | Contenu | Source | Vérifié |
|---|---|---|---|
| `src/core/bignum.js` | `_Dec`, `D`, `fmt` | extrait **verbatim** de index.html | 30 000+ tests de propriété |
| `src/data/heroes.js` | `HERO_DEFS` (12 héros) | extrait **verbatim** | **identique au monolithe** (0 divergence) |
| `src/core/events.js` | bus pub/sub (`on/off/emit`) | nouveau | délivrance payload, désabonnement, no-crash |
| `src/core/rng.js` | RNG seedé (mulberry32) | nouveau | déterministe, ∈[0,1), sensible au seed |

- **Total : 90 016 assertions Node passées, 0 échec.**
- `src/main.js` câblé pour importer ces 4 modules réels (point d'entrée futur).
- **Build Vite vérifié** : `npx vite build` → « 2 modules transformed, ✓ built ». (En sandbox, `emptyOutDir` bute sur un `EPERM` de suppression — artefact d'environnement, sans effet sur ta machine.)
- Test repo : `tests/modules.test.mjs` (nécessite `"type":"module"` dans package.json ou vitest pour tourner en l'état).

### ⚠️ Important — divergence temporaire assumée
`index.html` contient **toujours sa copie inline** de `_Dec/D/fmt/HERO_DEFS`. Tant que le câblage n'est pas fait, **il y a deux copies**. C'est normal en migration incrémentale, mais **toute modif doit se faire dans le monolithe jusqu'au câblage**, sinon les copies divergent.

### Prochain incrément (à tester dans le navigateur)
1. Extraire les données restantes : `biomes`, `monsters`, `balance`, `affixes`, `skilltree`, `banners` (pur data, node-testable comme `heroes`).
2. Câbler `bignum` en premier dans `index.html` : `<script type="module">` + `import {…} from './src/core/bignum.js'`, supprimer la copie inline, et **exposer sur `window`** toutes les fonctions appelées par les `onclick=` du HTML.
3. `npm run dev` → vérifier en navigateur : démarrage, `fmt`, combat, sauvegarde — avant de continuer.

### 🧹 À nettoyer de ton côté
- `dist_check/` (créé pour prouver le build, non supprimable depuis la sandbox).

---

## 🧩 Extraction modulaire — Incrément 2 (couche données complète, 2026-06-09)

Toute la **couche de données pure** est désormais extraite en modules réels, via un extracteur à équilibrage de parenthèses (découpe fiable des objets multi-lignes), chaque constante étant **vérifiée par import ESM + comparaison d'identité au monolithe**.

| Module | Constantes | Vérif |
|---|---|---|
| `data/heroes.js` | HERO_DEFS (12) | ✅ identique |
| `data/biomes.js` | ZONE_THEMES, TIER_PREFIXES, BIOME_BGS, BIOME_GLOW_COLORS, ELEM_BADGE_COLOR, ELEM_ICONS, ELEM_COLORS | ✅ |
| `data/monsters.js` | MONSTER_IMAGES | ✅ |
| `data/balance.js` | EVO_*, ELEMENT_ADVANTAGE, MILESTONES, MILESTONE_LABELS, HERO_TYPES, TYPE_MODS, BB_TIER_*, SPARK_WINDOW_MS | ✅ |
| `data/affixes.js` | ITEM_RARITIES, ITEM_SLOTS/NAMES/ICONS, AFFIX_TABLE (13), SPHERE_DEFS, MATERIAL_DEFS | ✅ |
| `data/skilltree.js` | SKILL_TREE_DEF, PARAGON_CATEGORIES | ✅ |
| `data/banners.js` | SUMMON_POOLS | ✅ |
| `data/liveops.js` | ACHIEVEMENTS_DEFS, LOGIN_REWARDS, DQ_POOL, WEEKLY_BOSSES, OBJECTIVES | ✅ |
| `data/squad.js` | FORMATIONS, SYNERGIES | ✅ |

- **37 constantes, 644 lignes — toutes identiques au monolithe (0 divergence).**
- `src/main.js` importe l'ensemble (core + data) : **17 exports, import sans erreur** vérifié en Node.
- **Prep câblage** : 51 fonctions appelées par les `onclick=` inline énumérées ; stratégie de câblage faible-risque documentée dans **`WIRING_GUIDE.md`** (bundle "globals" en IIFE chargé avant le monolithe, plutôt que de modulariser le monolithe).

### Reste à faire (prochains incréments)
- Extraire `core/save.js`, `core/loop.js`, `core/store.js`, puis `systems/*` et `ui/*`.
- **Câblage navigateur** (étape gated, voir `WIRING_GUIDE.md`) : un bloc inline supprimé à la fois + `npm run dev` entre chaque.

---

## 🧩 Extraction modulaire — Incrément 3 (couche core logique, 2026-06-09)

La couche **core** est extraite. Pour les fonctions, j'extrais en **verbatim** uniquement les morceaux purs/portables ; les fonctions couplées au `G` global (`loadGame`/`saveGame`/`_applyLoadedData`) **restent dans le monolithe** jusqu'au câblage.

| Module | Contenu | Source | Vérif Node |
|---|---|---|---|
| `core/save.js` | `DEFAULT_STATE`, `deepMerge`, `migrateSave`, `SAVE_VERSION`, helpers IndexedDB | **verbatim** | DEFAULT_STATE **identique** au monolithe ; deepMerge & migrate testés |
| `core/store.js` | conteneur d'état G + dirty flag (`getState/patch/reset/markDirty`) | nouveau (cible câblage) | get/patch/reset/dirty ✅ |
| `core/loop.js` | `createFixedTimestep` (cœur accumulateur §1.2, sans DOM) | extrait/refactoré | clamp testé : dt=10 s → **7 steps (pas 300)** |

- **16 assertions Node, 0 échec.** Points clés vérifiés :
  - `migrateSave` : `elimo→margonia` (heroes/squad/leader) + normalisation héros + `_v=5`.
  - `deepMerge` : override + défauts conservés + fusion nested + tableaux remplacés.
  - `loop` : `dt=0.1 s → 3 steps`, `dt=10 s → 7 steps` (anti spirale de la mort).
- `src/main.js` agrège core + data : **24 exports, import sans erreur**.

### État de la couche `core` (`src/core/`, 324 lignes réelles)
`bignum` ✅ · `events` ✅ · `rng` ✅ · `save` ✅ · `store` ✅ · `loop` ✅

### ⚠️ Fin du runway "headless"
La **couche données + core est extraite et vérifiée sans navigateur**. Le reste (`systems/*`, `ui/*`) est **intrinsèquement couplé** au DOM et à l'état `G` global : son extraction est désormais **indissociable du câblage** et **doit se faire dans le navigateur** (`npm run dev`), un bloc à la fois, selon `WIRING_GUIDE.md`. C'est l'étape suivante naturelle — et elle te revient (test manuel), ou je prépare les éditions « prêtes à tester ».

---

## 🔌 Câblage — Incrément 4 : bignum branché via globals.bundle.js (2026-06-09)

Premier câblage réel appliqué à `index.html`, **prouvé en jsdom avant application** (et re-vérifié après).

**Ce qui a changé dans `index.html` :**
- Ajout, **avant** le `<script>` principal (ligne 4470), de :
  `<script src="./assets/globals.bundle.js"></script>`
- **Suppression** de la copie inline de `class _Dec` / `function D` / `function fmt` (ex-lignes 5457–5533), remplacée par un commentaire-marqueur.
- Backup : `index.BEFORE_WIRING.*.html`.

**Nouveaux fichiers :**
- `src/globals.js` — point d'entrée "globals" (expose `window._Dec/D/fmt` + `on/off/emit` + `createRng/rng`).
- `assets/globals.bundle.js` — bundle IIFE (esbuild, 4,4 ko).

**Vérifié (jsdom, bundle chargé avant le monolithe) — 7/7, 0 erreur :**
- `window.D/fmt/_Dec` exposés par le bundle ; le monolithe les résout **sans copie inline** ;
- `fmt(1e21)=1.00Sx` ; `G.gold instanceof window._Dec` ; **round-trip sauvegarde OK**.
- Syntaxe de tous les `<script>` inline : OK.

### ⚠️ À FAIRE PAR TOI — confirmation navigateur (jsdom ≠ vrai navigateur)
```
npm run dev
```
Checklist : menu démarre · nombres affichés (`fmt`) · combat (tap/mort/boss) · achat/level-up · invocation · **recharger la page → progression conservée** · console sans `ReferenceError`.
- Console attendue : `[globals] exposés sur window : _Dec, D, fmt, ...`
- ⚠️ Build prod : `vite build` traite le `<script src>` ; si friction, garder le tag tel quel (chemin relatif) ou copier le bundle dans `dist/assets/`. Le **dev server** (test ci-dessus) fonctionne normalement.

### 🔁 Pour le prochain câblage (data, puis save/store/loop)
1. Étendre `src/globals.js` (ajouter les imports data + `Object.assign(window, Biomes, Balance, ...)`).
2. Rebuild : `npx esbuild src/globals.js --bundle --format=iife --outfile=assets/globals.bundle.js`
3. Supprimer le bloc inline correspondant dans `index.html` (ex. `const HERO_DEFS = [...]`).
4. `npm run dev` → valider **avant** le bloc suivant.
