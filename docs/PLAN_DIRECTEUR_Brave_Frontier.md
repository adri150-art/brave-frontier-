# ⚔️ PLAN DIRECTEUR — *Brave Frontier Clicker*
### Rapport drastique de mise à jour · Lead Game Design · Direction Artistique · Architecture Logicielle

> **Préambule sans complaisance.** J'ai lu ton code réel — pas un placeholder. `index.html` = **10 211 lignes** (3 580 de CSS, ~5 700 de JS, le tout en portée globale, dans un seul fichier). J'ai aussi lu tes deux rapports existants (`AUDIT_Brave_Frontier_Clicker.md`, `RAPPORT_VIRALITE.md`) et constaté que tu as déjà implémenté une grande partie de leurs recommandations (les tags `§2.1`, `§3.4`, `§5.3` sont partout dans le code). **Ce document ne répète donc pas ces rapports : il part de là où ils s'arrêtent et va plus loin.** J'ai vérifié chaque affirmation chiffrée avec un calcul réel (voir encadrés « Preuve »). Tu m'as donné carte blanche : je l'utilise.

---

## 🩸 VERDICT BRUTAL EN 60 SECONDES

Ton jeu n'est **pas** un prototype bâclé. C'est un hybride idle-battler étonnamment complet : squad de 4, roue élémentaire, Brave Bursts à cinématiques canvas, gacha avec pitié, évolution 3★→6★, prestige, spheres, formations, synergies, quêtes journalières, boss hebdo, login streak, offline, cartes de partage. **Tu as déjà 80 % des systèmes d'un jeu commercial.** C'est précisément pour ça que mon verdict est dur : tu es à deux doigts d'un bon jeu, mais **quatre murs structurels** t'empêchent d'y arriver, et un seul d'entre eux peut tuer le projet à lui seul.

1. **🧱 LE MUR DES NOMBRES (existentiel).** Tes nombres sont des `Number` JavaScript (doubles 64 bits). Ton `fmt()` plafonne au suffixe `Qi` (10¹⁸). **Preuve calculée : les HP de boss dépassent 2⁵³ (la limite d'entier exact du JS, ~9,0×10¹⁵) dès la zone 177, et `fmt()` casse totalement à la zone 203.** Au-delà, la précision se dégrade puis tout devient `Infinity`. Pour un jeu à prestige censé tourner en boucle, **c'est un plafond de verre infranchissable**. À régler en premier, avant tout le reste.
2. **🧱 LE MUR ÉCONOMIQUE.** Tes HP montent en 1,20^zone, ton or en 1,165^zone. **L'or croît MOINS vite que les HP.** Preuve : à la zone 200, un monstre a **361× plus de HP que l'or qu'il rapporte**, contre 1× à la zone 1. Le « temps pour tuer » explose pendant que le revenu stagne. C'est un mur de progression mathématiquement garanti (ton audit l'avait vu en §2.1 ; il n'est pas résolu, juste repoussé).
3. **🧱 LE MUR DE PERFORMANCE MOBILE.** Tu n'as **pas** de game loop. Tu as **5 `setInterval` non coordonnés** (deux à 100  ms, un à 1 s, un à 15 s, un à 30 s) qui cohabitent avec `requestAnimationFrame` pour les particules — deux horloges concurrentes, sans delta-time, sans accumulateur. Couplé à 63 réécritures `innerHTML`, des `void el.offsetWidth` (reflows synchrones forcés) à chaque clic, et 4 panneaux reconstruits à **chaque kill**, ça donne un WebView Android qui rame et chauffe. Ton audit l'avait pointé (§3.1) ; il faut maintenant le refondre, pas le rafistoler.
4. **🧱 LE MUR DE LA MONOTONIE.** Le « clicker » meurt dès que le DPS passif écrase le tap. Sans système de **loot profond** et de **theory-crafting**, il ne reste qu'à regarder des barres se vider. Tes spheres et formations sont un début, mais ce ne sont pas encore des systèmes qui « mangent » des centaines d'heures.

**Et le potentiel ?** Tu as un actif rare que 99 % des clickers n'ont pas : **l'ADN de Brave Frontier**, c'est-à-dire le *Spark timing* et le *BB/SBB/UBB chaining*. C'est ton crochet. Personne sur le Play Store ne fait « idle-clicker + skill de timing Brave Frontier + raids communautaires ». **C'est là qu'est ton jeu unique.** J'y reviens en Axe 2.

---

## 1. 🏗️ ANALYSE CRITIQUE DU CODE & ARCHITECTURE

### 1.1 — Le péché originel : un monolithe de 10 211 lignes

Tout est dans `index.html` : données (`HERO_DEFS`, `ZONE_THEMES`, `FORMATIONS`, `SYNERGIES`, `SUMMON_POOLS`…), logique (combat, économie, gacha, rétention), rendu (261 `getElementById`, 35 `querySelector`, 63 `innerHTML`) et état global (`let G = {…}`). Tout est en portée globale, sans modules, sans build.

**Pourquoi ça bloque l'ajout de 50 fonctionnalités :**

- **Couplage total.** `killMonster()` (ligne 6858) touche à l'or, aux gemmes, à l'honneur, au spawn, *et* appelle `renderAchievements()`, `renderDailyQuests()`, `renderFooterBB()`, `renderMaterialsPanel()`. Une seule fonction connaît la moitié du jeu. Chaque feature ajoutée augmente le risque de régression ailleurs.
- **Collisions de noms inévitables.** En portée globale, `rand`, `draw`, `tick`, `resize` sont redéfinis dans plusieurs IIFE. À 50 features, tu auras des écrasements silencieux.
- **Données figées dans le code.** Ajouter un héros = éditer un tableau au milieu de 5 700 lignes de JS. Impossible de faire du LiveOps (events datés, équilibrage à chaud) ou de confier l'équilibrage à un tableur.
- **Aucun test possible.** Rien n'est isolé, donc rien n'est testable unitairement. À ce volume, c'est un risque de production.

> **Nuance d'architecte (honnêteté).** Le choix « single-file, vanilla, zéro dépendance » n'était **pas idiot** : démarrage instantané, aucun bundler, déploiement trivial, parfait pour un WebView. Tu as eu raison de **fuir** ton ancienne architecture Phaser/Pixi (`src.OLD.backup/`) qui était sur-ingénierée pour un clicker. **Mais tu as dépassé le point où le single-file est un avantage.** À 10 k lignes, il est devenu un passif. La solution n'est pas React (overkill, alourdit le WebView) : c'est un **découpage en modules ES + un build léger qui recompile en un seul fichier**. Tu gardes l'avantage « un seul artefact à livrer », tu récupères la maintenabilité. Voir §1.7.

### 1.2 — Tu n'as pas de game loop. Tu as 5 horloges qui se battent.

État actuel (vérifié) :

| Timer | Rôle | Problème |
|---|---|---|
| `setInterval(…, 100)` ×2 | DPS passif (10×/s) + timer de mort/attaque monstre | Pas de delta-time : sur WebView throttlé en arrière-plan, les ticks sont écrasés → désync combat |
| `setInterval(…, 1000)` | reset compteur Live DPS | OK mais isolé |
| `setInterval(saveGame, 15000)` | sauvegarde | `JSON.stringify(G)` bloquant sur le main thread |
| `setInterval(…, 30000)` | re-render quêtes | Rebuild DOM même si l'onglet est fermé |
| `requestAnimationFrame` (updateP/draw) | particules | **Horloge n°2**, désynchronisée des `setInterval` |

**Le diagnostic professionnel :** `setInterval` n'est **pas** une boucle de simulation. Il dérive, il ne se cale pas sur le rafraîchissement écran, et les navigateurs mobiles le *throttlent* agressivement (jusqu'à 1 tick/s) quand l'app passe en arrière-plan ou que la batterie est faible. Résultat : ta simulation de combat avance à une vitesse différente de tes animations, et le jeu « saute » au retour de veille.

**Prescription — une seule boucle maître, fixed-timestep avec accumulateur :**

```js
// UN SEUL rAF. La simulation avance par pas FIXES (déterministe, rejouable,
// idéal pour l'offline et l'anti-triche). Le rendu interpole.
const TICK = 1 / 30;                 // 30 Hz de simulation logique
let acc = 0, last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;          // anti "spirale de la mort" après une veille
  acc += dt;
  while (acc >= TICK) {              // rattrape le temps réel par pas fixes
    simulate(TICK);                  // combat, DPS, cooldowns, BB gauges…
    acc -= TICK;
  }
  render(acc / TICK);                // dessin + interpolation visuelle
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Bénéfices directs : **simulation déterministe** (deux joueurs avec la même seed obtiennent le même résultat → indispensable pour les raids/PvP async et l'anti-triche), **offline = N pas de `simulate()`** (tu peux *vraiment* simuler l'absence au lieu d'estimer 35 % du DPS), **une seule horloge** donc plus de désync, et **throttling propre** (le `while` rattrape sans exploser).

### 1.3 — Tu recalcules tout l'univers 10 fois par seconde

`getTotalDPS()` → `getSquadStats()` → `getHeroStats()` (lignes 5456+) fait des `Math.pow(1.5, stars-3)`, applique ratios de rôle, facteur de niveau, limit break, **4 multiplicateurs de milestone**, sphere… **pour chaque héros, à chaque tick de 100 ms.** Or ces valeurs ne changent **qu'à 4 événements** : level-up, évolution, équipement de sphere, changement de squad/formation.

**Prescription — pattern « dirty flag » + cache :**

```js
let _statsCache = null, _statsDirty = true;
function invalidateStats() { _statsDirty = true; }   // appelée aux 4 events seulement
function getSquadStats() {
  if (_statsDirty) { _statsCache = computeSquadStats(); _statsDirty = false; }
  return _statsCache;
}
```

Gain : tu passes de ~quelques milliers d'opérations `Math.pow` par seconde à **zéro** en régime stationnaire. Sur mobile bas de gamme, c'est la différence entre 60 fps et 30 fps.

### 1.4 — Le DOM est ton ennemi sur mobile

Inventaire vérifié des points chauds :

- **À chaque clic** (`monster-zone` listener, ligne ~6968) : `document.createElement('div.dmg-text')` + `appendChild` + `setTimeout(remove, 920)`. À 8 clics/s + autoclick, c'est ~8 allocations/suppressions DOM par seconde → **pression GC → micro-freezes**.
- **`void el.offsetWidth`** répété (pour redémarrer les animations CSS) : chaque appel force un **reflow synchrone**. Tu en as plusieurs *par clic* (monster-shake, arena-click-shock, combo-max). Le reflow est l'opération la plus chère du navigateur.
- **`killMonster()` reconstruit 4 panneaux** (`innerHTML`) à chaque kill. À haut DPS (plusieurs kills/s), tu reconstruis des centaines de nœuds/s pour des panneaux parfois **invisibles** (onglet fermé).

**Prescriptions :**

1. **Object pooling** pour les nombres de dégâts : pré-alloue 30 `div` réutilisés en rotation, ou — mieux — **dessine-les sur le canvas de particules** (tu en as déjà un). Zéro DOM, zéro GC.
2. **Découple rendu et simulation** : `killMonster()` met à jour l'état + un flag `panelsDirty`. Le rendu des panneaux se fait dans `render()`, **throttlé** (≤ 4×/s) et **uniquement si le panneau est visible** (`if (panel.classList.contains('active'))`).
3. **`requestIdleCallback`** pour les panneaux non critiques (achievements, matériaux) afin de ne pas voler le budget frame.
4. **Bannis `void offsetWidth`** : utilise l'API Web Animations (`el.animate(...)`) qui ne force pas de reflow et tourne sur le compositeur GPU.

### 1.5 — 🔴 LE MUR DES NOMBRES (à traiter en priorité absolue)

> **Preuve calculée (exécutée, pas estimée) :**
> - HP de mob normal `10 × 1,20^(z-1)` dépasse **2⁵³ (9,007×10¹⁵)** à la **zone 190**.
> - HP de boss `× 12` dépasse 2⁵³ dès la **zone 177**.
> - `fmt()` (dernier suffixe `Qi` = 10¹⁸) casse à la **zone 203**.
> - Coût du dernier niveau d'un héros 6★ (`50 × 1,30^150`) = **6,17×10¹⁸**, déjà au-delà de l'entier exact.

Au-dessus de 2⁵³, `Number` **perd des entiers** (5 000 000 000 000 001 == 5 000 000 000 000 000). Les compteurs deviennent faux, les comparaisons de prix déraillent, puis tout tombe à `Infinity`. Pour un idle/prestige, **la progression infinie est le produit** — ce bug le détruit.

**Deux options (je recommande la A) :**

- **Option A — `break_infinity.js` (Decimal).** La bibliothèque standard des idle games (Cookie Clicker-likes, Antimatter Dimensions). Mantisse + exposant, gère jusqu'à 10^(10^308). **Mais ne mets pas tout en Decimal** (c'est plus lent que `Number`). Discipline : **uniquement** les grandeurs qui explosent — `gold`, `monsterHp`, `dps`, `damage`, coûts. Garde `Number` pour timers, pourcentages, cooldowns, index. C'est un refactor ciblé d'une douzaine de fonctions (`getMonsterMaxHp`, `getHeroStats`, `getHeroLevelCost`, `killMonster`, `fmt`…).
- **Option B — repenser l'échelle.** Si tu veux rester en `Number`, tu dois **plafonner** la progression « plate » (zones finies, ex. 300 max) et faire de **la puissance relative** (via prestige multiplicatif qui *rebase*) le vrai vecteur. Plus simple, mais ça te ferme la porte de l'idle infini. Vu ton ADN BF, je penche pour A.

Dans les deux cas, **refais `fmt()`** : table de suffixes étendue (`K M B T Qa Qi Sx Sp Oc No Dc…`) puis **bascule en notation scientifique** (`1.23e45`) au-delà — c'est ce que font tous les idle games matures.

### 1.6 — La sauvegarde : solide à 70 %, fragile sur les 30 % qui comptent

Bon : clé unique `bf_clicker_v4`, **backup avant écriture** (ligne 5404), autosave 15 s + `beforeunload` + `visibilitychange`, et une vraie fonction `migrateSave()` **versionnée** (`_v`). C'est mieux que beaucoup de jeux indés.

Mauvais :

- **`loadGame()` = ~30 lignes de `if (G.x === undefined) G.x = défaut`** éparpillées (lignes 5360-5395). C'est un anti-pattern : les valeurs par défaut sont dupliquées (une fois dans `let G = {}`, une fois ici) et un oubli = `undefined` qui se propage en `NaN`. **Remède : un `DEFAULT_STATE` unique + deep-merge** à la lecture (`G = deepMerge(DEFAULT_STATE, parsed)`). Une seule source de vérité.
- **`JSON.stringify(G)` toutes les 15 s sur le main thread.** Tant que `G` est petit, OK. Quand tu ajouteras inventaire de loot, historique, stats détaillées, ça deviendra un micro-freeze récurrent. **Remède : save « dirty »** (ne sérialise que si l'état a changé) + sérialisation dans un `requestIdleCallback` ou un Web Worker.
- **`localStorage` est volatile sur mobile.** Android/WebView **purge** le localStorage sous pression mémoire ou au nettoyage. Un joueur qui perd 200 h de progression te met 1★ et désinstalle. **Remède critique pour la rétention : sauvegarde cloud** (compte anonyme → liée à Google Play Games Services, ou Firebase). Migre aussi vers **IndexedDB** (quota plus élevé, asynchrone) avec localStorage en fallback. La sauvegarde cloud n'est pas un luxe : **c'est un levier de rétention J30 et un argument de réinstallation.**

### 1.7 — La structure cible exacte (scalable à 50 features)

Voici l'arborescence que j'imposerais. **Modules ES + build léger (Vite ou esbuild) qui produit un seul `bundle.js`** → tu gardes « un artefact à livrer », tu récupères modules, tree-shaking, et tu peux ajouter TypeScript plus tard.

```
brave-frontier/
├─ index.html                 # squelette + <div id="app"> + 1 seul <script type="module">
├─ vite.config.js             # build → dist/ (single bundle, minifié)
├─ src/
│  ├─ main.js                 # bootstrap : load → init systems → start loop
│  ├─ core/
│  │   ├─ loop.js             # LA boucle rAF fixed-timestep (§1.2)
│  │   ├─ store.js            # état central + dirty flags + invalidation
│  │   ├─ events.js           # bus d'événements (pub/sub) : découple systèmes & UI
│  │   ├─ save.js             # DEFAULT_STATE, deepMerge, migrations, IndexedDB+cloud
│  │   ├─ bignum.js           # wrapper Decimal + fmt() unifié
│  │   └─ rng.js              # RNG seedé (déterministe → raids, anti-triche)
│  ├─ data/                   # DONNÉES PURES (zéro logique) — éditables sans toucher au code
│  │   ├─ heroes.js           # HERO_DEFS
│  │   ├─ biomes.js           # ZONE_THEMES + nodes de carte
│  │   ├─ monsters.js
│  │   ├─ affixes.js          # table d'affixes de loot (§2.4)
│  │   ├─ skilltree.js        # arbre de compétences
│  │   ├─ banners.js          # gacha (pools, taux, pitié)
│  │   ├─ liveops.js          # events datés, battle pass
│  │   └─ balance.js          # TOUTES les constantes de courbe (un seul endroit !)
│  ├─ systems/                # LOGIQUE PURE (entrée: état, sortie: état). Testable.
│  │   ├─ combat.js           # tap, DPS, BB, sparks, dégâts, mort
│  │   ├─ economy.js          # or, coûts, achats, soft caps
│  │   ├─ progression.js      # zones, biomes, déblocages
│  │   ├─ gacha.js            # tirages, pitié
│  │   ├─ loot.js             # génération procédurale d'équipement
│  │   ├─ prestige.js         # réincarnation / ascension / paragon
│  │   ├─ retention.js        # login, quêtes, offline, events
│  │   └─ monetization.js     # ads, IAP, battle pass
│  └─ ui/                     # RENDU uniquement. Lit l'état, écoute le bus, ne décide rien.
│      ├─ screens/            # WorldMap, Battle, Squad, Summon, Town…
│      ├─ components/         # HpBar, HeroCard, CurrencyBar, Modal… (réutilisables)
│      ├─ render.js           # orchestre le rendu, throttlé, visible-only (§1.4)
│      └─ fx/                 # particules canvas, floaters poolés, VFX
├─ assets/                    # (déjà bien organisé : heroes, biomes, monsters, ui, music)
└─ tests/                     # systems/ testés sans DOM
```

**Trois règles d'or qui rendent les 50 features indolores :**

1. **Data ≠ Systems ≠ UI.** Les données ne contiennent aucune logique. Les systèmes ne touchent jamais au DOM. L'UI ne décide jamais d'une règle de jeu. Ajouter un héros = éditer `data/heroes.js`. Ajouter un écran = ajouter un fichier dans `ui/screens/`. **Aucune feature ne fait grossir un fichier existant de façon dangereuse.**
2. **Le bus d'événements découple tout.** `combat.js` émet `monster:killed` ; `retention.js`, `loot.js`, `ui/` y réagissent **sans se connaître**. Fini le `killMonster()` qui appelle 4 fonctions de rendu en dur. Tu branches/débranches des systèmes sans casser les autres.
3. **`balance.js` = bible des courbes.** Toutes les constantes (1,20 ; 1,165 ; multiplicateurs ; coûts) au même endroit, commentées. L'équilibrage devient un acte de game design, pas une chasse au trésor dans 5 700 lignes.

> **Ce que je jetterais sans hésiter :** `index.OLD.backup.html`, `index_OLD_backup.html`, `src.OLD.backup/` (versionne avec Git, pas avec des copies de fichiers — c'est une bombe à confusion). Et la logique de `initResponsiveLayout()` qui **déplace des nœuds DOM entre conteneurs** (`appendChild` du même panneau tantôt à gauche, tantôt dans le drawer) : c'est fragile et coûteux. Remplace par **un seul layout responsive en CSS Grid/Flex** piloté par media queries, sans déménagement de DOM.

---

## 2. 🎮 GAMEPLAY LOOP & SYSTÈMES RPG/CLICKER (le cœur)

### 2.1 — Ta boucle actuelle, sans complaisance

Tu n'as **pas** un clicker classique, et c'est une bonne chose : tu as un **idle-battler actif**. Tap = dégâts directs + combo (×0,1/combo, max ×40) + crit scaling ; en parallèle, le DPS passif du squad tape 10×/s ; le monstre et le boss ripostent (HP d'équipe, timer de boss 30 s, **Attaque Ultime** à 2,8× qui exige le bouclier de Lance). Squad K.O. → repli, on **perd une zone**. **C'est un vrai loop avec tension.** Garde ce squelette.

**Les trois fissures du loop :**

1. **Le tap meurt.** Dès que `getTotalDPS()` dépasse `getTapDamage()` (et ça arrive vite), taper devient cosmétique. Le « clicker » s'éteint et il ne reste que de l'idle. Ton audit l'a vu (§2.3). **Le tap doit rester pertinent à vie** — pas via les dégâts bruts (impossible de suivre le DPS exponentiel), mais via un **rôle actif** : générer des Battle Crystals (charge des BB), déclencher les **Sparks** (§2.5), poser des crits qui appliquent des debuffs. Le tap devient un *outil de skill*, pas une source de DPS.
2. **La courbe est un piège (math vérifiée).**

> **Preuve :** HP `10×1,20^(z-1)` vs Or `10×1,165^(z-1)`. Comme 1,20 > 1,165, le ratio HP/Or = (1,20/1,165)^(z-1) **diverge** :
> | Zone | HP/kill ÷ Or/kill |
> |---|---|
> | 1 | ×1,0 |
> | 50 | ×4,3 |
> | 100 | ×18,7 |
> | 150 | ×82 |
> | 200 | **×362** |
>
> Traduction : à mesure qu'on avance, chaque monstre coûte **de plus en plus de temps** (HP/DPS) pour rapporter **proportionnellement de moins en moins d'or**. Le revenu/seconde s'effondre face au coût des niveaux (`baseCost × rate^level`). **Mur garanti.**

**Correctif :** la règle d'or des idle games est que **le revenu doit croître au moins aussi vite que le coût de la puissance**. Trois leviers, à combiner :
   - **Aligne les bases** : or en `1,20^z` (= HP) au minimum, voire légèrement au-dessus, pour que « farmer une zone » finance toujours le prochain palier.
   - **Sépare les devises de progression** : l'or finance le *court terme* (niveaux), une devise de prestige finance le *long terme* (multiplicateurs permanents). Le mur devient alors **intentionnel** et **franchissable par le prestige**, pas subi.
   - **Soft caps explicites** : au lieu d'un mur invisible, pose des paliers lisibles (« zone 50 : tu sens que ça ralentit → prestige pour x2 permanent »). Le joueur comprend *pourquoi* et a une action claire.

3. **Le milestone en escalier est ingérable.**

> **Preuve :** les multiplicateurs de `getHeroStats()` (×3 à 10, ×4 à 25, ×8 à 50, ×20 à 100) sont **cumulatifs → ×1 920 au niveau 100**. Un seul level-up (99→100) **multiplie le DPS par 20 d'un coup**.

Ces sauts rendent l'équilibrage impossible : juste avant le palier le joueur est sous-puissant (mur), juste après il *one-shot* tout (trivial). **Correctif :** remplace la fonction en escalier par une **courbe lisse** (ex. DPS ∝ niveau^1,5 ou exponentielle douce) **+ 2-3 spikes intentionnels et téléphonés** (« Éveil » à des niveaux clés, avec animation et récompense visible). Le power spike doit être un *moment de game design*, pas un accident de formule.

### 2.2 — Détruire la monotonie : les systèmes RPG de rupture

Tu demandes des mécaniques qui « détruisent la monotonie du clicker ». Les voici, par ordre d'impact sur la rétention. **Le n°1 est non négociable.**

**① LOOT PROCÉDURAL À AFFIXES (le système-roi).**
Tes `SPHERE_DEFS` sont des objets **fixes** à multiplicateur unique. C'est plat. Transforme-les en **équipement généré aléatoirement à la Diablo/PoE** — c'est LE moteur anti-monotonie des idle-RPG (AFK Arena, Idle Heroes, Almost a Hero en vivent).
   - **Rareté** : Commun → Magique → Rare → Épique → Légendaire → Mythique (réutilise ta palette 3★→6★).
   - **Affixes** : chaque pièce roule 1 à 6 affixes parmi une table (`%DPS`, `%HP`, `%crit`, `%crit dmg`, `+spark dmg`, `%BC gen`, `%or`, `réduction CD`, dégâts élémentaires…). La **variance** (rolls hauts/bas) crée la chasse : deux Légendaires ne sont jamais identiques.
   - **Slots** : 6 emplacements par héros (arme, armure, casque, bottes, 2 accessoires) → 6 × 4 héros = 24 décisions d'optimisation.
   - **Boucles de craft** : *reroll* d'un affixe (coût de matériaux — tu as déjà `MATERIAL_DEFS` !), *upgrade* (+1…+15), *sets* (4 pièces d'un set = bonus de synergie), *fusion* de doublons. Chacune est un puits de ressources et une raison de farmer.
   - **Pourquoi ça marche** : ça transforme « je clique sur le même monstre » en « je farme la zone 60 parce qu'elle drop le set Inferno dont il me manque les bottes avec un bon roll de crit ». **C'est la rétention par le theory-crafting.**

**② ARBRE DE COMPÉTENCES DE L'INVOCATEUR (méta-progression globale).**
Pas par héros — **global au joueur**. Un grand arbre (façon sphère-grid FFX / arbre PoE) où une **devise de skill** (gagnée par zone/prestige) débloque des nœuds : branches Offensive (%DPS, crit, spark), Défensive (HP équipe, mitigation), Économie (%or, %drop), Élémentaire (bonus par élément), Idle (gains offline). Donne **des choix qui s'excluent** (tu ne peux pas tout prendre) → des *builds*, des respec payants, du contenu de discussion communautaire (« quel arbre pour du Feu burst ? »).

**③ PRESTIGE MULTI-COUCHES (l'endgame qui ne finit jamais).**
Ton prestige actuel est mono-couche (`prestigeBonus: {dps, gold, slot}`). Les idle games matures ont **2-4 couches gigognes**, chacune débloquée par la précédente :
   - **Couche 1 — Réincarnation** (tu l'as) : reset des zones → **Cristaux de Prestige** → multiplicateurs permanents. *Première boucle, accessible tôt.*
   - **Couche 2 — Ascension** : quand tu as beaucoup réincarné, reset *les Cristaux eux-mêmes* → **Essence Divine** → débloque l'arbre de compétences avancé + nouveaux héros 6★. *Boucle de mid-game.*
   - **Couche 3 — Transcendance (Paragon)** : un arbre **infini** (façon Diablo Paragon) où chaque point donne un micro-bonus permanent — le puits sans fond pour les *whales* de temps. *Endgame vrai.*

   Chaque couche **rebase** l'échelle des nombres → c'est aussi ce qui rend le « mur économique » du §2.1 *franchissable et satisfaisant* au lieu de frustrant.

**④ LE SYSTÈME SIGNATURE — SPARK / BB CHAINING (ton ADN Brave Frontier).**
C'est ici que tu te démarques. Dans le vrai Brave Frontier, taper/déclencher les BB au **bon timing** fait « *Spark* » (les coups se chevauchent) → dégâts bonus massifs. **Réintroduis cette couche de skill actif :**
   - Quand plusieurs héros déclenchent leur BB dans une **fenêtre de timing** serrée, ils *sparkent* → multiplicateur de dégâts + génération de BC bonus.
   - Le tap (qui « meurt » sinon) sert à **ajuster le timing** des sparks → le clic redevient une compétence, pas du DPS brut.
   - Tiers d'ultimes : **BB → SBB (Super) → UBB (Ultimate)**, débloqués par évolution, avec jauges distinctes. L'UBB est un moment cinématique (tu as déjà `triggerBBCanvas` !).
   - **Pourquoi c'est ton crochet** : aucun idle-clicker du Play Store ne propose une *couche de skill de timing héritée de BF*. C'est différenciant, ça crée un *skill ceiling* (donc du contenu compétitif), et ça réutilise tes assets et ton moteur de BB existants.

### 2.3 — Multi-écrans, carte du monde, ou défilement continu ?

**Direction claire : carte du monde par biome, en nodes de progression.** Pas de défilement infini de zones numérotées (« zone 207 » n'évoque rien), pas une seule page surchargée.

**Pourquoi :** tu as **déjà 6 biomes illustrés** (Forêt de Gaïa, Océan Éternel, Pic Foudroyé, Cavernes d'Agni, Sanctuaire Céleste, Néant des Ombres) qui dorment dans `assets/Biome/`. Une carte façon **AFK Arena / Brave Frontier** leur donne vie : chaque biome est une **région** ; chaque région contient des **stages/nodes** (combat, élite, boss, événement, trésor) reliés par un chemin. C'est lisible, ça crée des **jalons mémorables** (« j'ai fini les Cavernes d'Agni »), des déblocages (un biome ouvre une feature), et des **moments partageables** (boss de fin de biome → carte de victoire, tu as déjà `generateBossVictoryCard` !).

**Architecture d'écrans recommandée (hub & spoke) :**

```
        ┌──────────── HUB / VILLE (persistant) ────────────┐
        │  Squad · Invocation · Forge/Loot · Arbre · Boutique  │
        └───────────────────────┬──────────────────────────┘
                                 │
                    ┌──── CARTE DU MONDE ────┐   (6 biomes, déblocage progressif)
                    │  Biome → liste de stages │
                    └───────────┬─────────────┘
                                │
                        ┌─── COMBAT ───┐   (ton loop actuel : tap + squad + BB + boss)
                        │  + idle/AFK  │
                        └──────────────┘
```

   - **Le combat reste ta boucle actuelle** (ne la jette pas). Tu l'encapsules juste dans un écran « Stage ».
   - **Le mode idle/AFK** tourne sur le « dernier stage atteint » même quand tu navigues ailleurs → tu farmes pendant que tu optimises ton loot. C'est le confort idle moderne.
   - **Navigation mobile** : un *bottom nav* à 4-5 onglets (Combat · Carte · Héros · Invocation · Boutique). Voir Axe 3.

> **En une phrase :** garde ton moteur de combat, **enferme-le dans une carte de biomes à nodes**, ajoute un **hub persistant** pour les systèmes méta. Tu passes d'« un écran de clic » à « un monde ».

---

## 3. 🎨 DIRECTION VISUELLE & UI/UX (optimisé pour Gemini)

### 3.1 — État des lieux visuel

Le `viewport` est **bien réglé** (`maximum-scale=1, user-scalable=no, viewport-fit=cover`) — parfait pour un WebView plein écran avec encoches. Tu as des assets cohérents (héros en 3 contextes : full / squad / combat, 6 biomes, monstres par biome avec boss). **Le problème n'est pas le manque d'assets, c'est la cohérence et l'intégration UI.** Deux dangers : (a) des assets générés à des moments différents avec des styles divergents (éclairage, palette, niveau de détail) ; (b) une UI qui mélange émojis (`🔥💧⚡`), icônes de font (`<i class="ra ra-fire">`) et PNG → identité visuelle brouillonne. **La cohérence se gagne en amont, dans le prompt.** D'où la « bible » ci-dessous.

### 3.2 — La règle d'or pour Gemini : une BIBLE DE STYLE réutilisable

Le secret de la cohérence avec un générateur d'images, c'est de **préfixer chaque prompt avec le même bloc de style**, et d'utiliser une **image de référence** (la première validée) comme ancrage pour toutes les suivantes. Voici ta bible — colle-la **en tête de chaque prompt** :

> **[STYLE BIBLE — à préfixer partout]**
> *"Dark fantasy mobile gacha RPG art, in the visual style of Brave Frontier and AFK Arena. Hand-painted digital illustration, rich saturated colors, dramatic volumetric lighting, strong rim light, high contrast, ornate gold-and-deep-blue UI accents (#b4934c gold, #0d1a30 navy). Clean readable shapes optimized for small mobile screens, no text, no watermark, no logos. Cohesive color grading, cinematic atmosphere."*

Conventions techniques à **toujours** spécifier :
   - **Fonds** : `16:9` (desktop/tablette) **ET** `9:16` (mobile portrait) — génère les deux, ne recadre jamais un 16:9 en portrait (tu perds la composition).
   - **Sprites/UI/icônes** : **fond transparent (PNG alpha)**, demande explicitement *"on a transparent background, isolated, centered, no shadow on ground"*. Gemini ne fait pas toujours du vrai alpha → prévois un détourage (ou demande un fond `pure magenta #FF00FF` / `chroma key green` à retirer ensuite).
   - **Sprite sheets** : demande *"sheet layout, N frames in a grid, evenly spaced, identical character, transparent background"* pour les VFX et animations.
   - **Résolution** : génère **2× la taille d'affichage** (écrans Retina). Icônes 256×256, cartes héros 512×768, fonds 1920×1080 / 1080×1920.
   - **Nommage** : `biome_{element}_{16x9|9x16}_{day|night|boss}.png`, `mob_{biome}_{nom}_{common|elite|boss}.png`, `ui_{type}_{state}.png`, `icon_{nom}.png`. La cohérence de nommage = pipeline d'intégration automatisable.

### 3.3 — 📦 Bibliothèque complète de prompts Gemini

#### A. Fonds de biomes (×6 biomes × 2 ratios × 3 ambiances = jusqu'à 36 fonds)
Pour chaque biome, génère **16:9 + 9:16**, en 3 ambiances (exploration / nuit / arène de boss). Exemples prêts à l'emploi (préfixe toujours par la Bible) :

   - **Feu — Cavernes d'Agni** : *"a vast volcanic cavern, rivers of molten lava, glowing obsidian rock formations, floating embers and ash, ominous red-orange glow, deep shadows, distant erupting volcano. Empty arena foreground for a battle, no characters."*
   - **Eau — Océan Éternel** : *"an endless luminous ocean under a twilight sky, bioluminescent coral towers, gentle glowing waves, drifting jellyfish lights, teal and deep-blue palette, serene yet vast. Empty foreground."*
   - **Terre — Forêt de Gaïa** : *"an ancient overgrown forest, colossal mossy trees, shafts of golden light through the canopy, glowing spores, emerald and amber palette, sacred natural temple ruins. Empty foreground."*
   - **Foudre — Pic Foudroyé** : *"a stormy mountain peak above the clouds, perpetual lightning, crackling electric arcs on jagged rocks, violet-and-gold storm light, dramatic wind. Empty foreground."*
   - **Lumière — Sanctuaire Céleste** : *"a floating celestial sanctuary, marble-and-gold architecture, radiant holy light, drifting feathers and light motes, soft white-and-gold palette, divine atmosphere. Empty foreground."*
   - **Ténèbres — Néant des Ombres** : *"a void realm of shadow, fractured floating obsidian platforms, purple void energy, distant eldritch structures, deep violet-and-black palette, eerie and oppressive. Empty foreground."*
   - **Variante boss** : ajoute *"darker, more dramatic, storm clouds, ominous central focal point, danger atmosphere, intensified lighting"*.

#### B. Sprites d'ennemis (par biome : 3 communs + 1 élite + 1 boss)
   - **Commun** : *"[STYLE BIBLE] a [creature] enemy for the [biome] zone — e.g. a lava slime / reef turtle / corrupted treant — full body, dynamic idle pose, facing 3/4 left, on a transparent background, isolated, centered, mobile game enemy sprite, clean silhouette readable at small size."*
   - **Boss** : *"…an imposing [boss type] boss — e.g. the Dragon of Agni / Leviathan — massive scale, menacing pose, glowing elemental energy, intricate detail, dramatic rim light, transparent background, isolated. Designed to fill the upper half of a phone screen."*
   - **Astuce variété** : génère **3 teintes** par commun (le code applique déjà un `hue-filter` via `_applyMonsterFilter` — demande un sprite **neutre/désaturé** pour que le teintage code soit propre).

#### C. UI Kit (le plus rentable en cohérence)
Génère le kit **en une seule passe** (un seul prompt « planche ») pour garantir l'unité :
   - **Cadres/panneaux** : *"[STYLE BIBLE] a UI panel frame, ornate gold filigree border on dark navy semi-transparent background, rounded corners, fantasy RPG HUD, 9-slice ready (uniform border), transparent center, no text."*
   - **Boutons (4 états)** : *"a fantasy RPG button, gold-and-navy, in 4 states on one sheet: normal, hover/glow, pressed/darkened, disabled/greyed. Rounded rectangle, transparent background, no text."*
   - **Barres** : *"a set of game UI bars (HP red, BB/energy blue, XP gold), horizontal, ornate end-caps, empty and full versions, transparent background."*
   - **Cadres de rareté** : *"6 card frames for rarity tiers (3★ blue, 4★ gold, 5★ pink, 6★ purple), ornate corners, glowing border matching tier color, transparent center, one sheet."*
   - **Portail d'invocation / bannière gacha** : *"an ornate magical summoning gate, glowing runes, swirling elemental energy at the center, epic and inviting, vertical 9:16 composition for a gacha banner."*

#### D. Icônes (256×256, transparent, planche cohérente)
   - **Monnaies** : *"a sheet of 4 fantasy currency icons on transparent background: a gold coin (Or), a blue gem (Gemmes), a honor medal (Honneur), a glowing prestige crystal (Cristaux). Consistent style, chunky readable shapes, soft inner glow."*
   - **Onglets bottom-nav** : *"a sheet of 5 line+fill UI icons: crossed swords (Combat), world map (Carte), hero portrait (Héros), summon gate (Invocation), shop bag (Boutique). Two states each: inactive (grey) and active (gold glow)."*
   - **Compétences/éléments** : *"6 elemental orb icons: fire, water, earth, thunder (yellow), light, dark (purple). Glossy, glowing, transparent background, consistent set."* → **remplace tes émojis** `🔥💧⚡` par ces icônes pour une identité pro.

#### E. Cartes & illustrations de héros (cohérent avec tes 3 contextes existants)
   - **Full art** (512×768) : *"[STYLE BIBLE] full-body hero splash art of [name], [element] [class], [court descriptif depuis ton `lore`], heroic dynamic pose, ornate armor, glowing elemental weapon, dramatic lighting, transparent or simple gradient background, gacha card art quality."*
   - **Évolutions** : génère **4 paliers** (3★→6★) du même héros avec armure/aura de plus en plus imposante — *"…progressively more divine/ornate, additional glowing aura, evolved form"*. Réutilise tes `titles` (Épéiste → Chevalier → Général → Dieu du Feu).
   - **Sprite de combat** (vue de dos/profil pour l'arène) + **thumbnail squad** (buste, cadré serré).

#### F. VFX (sprite sheets pour les Brave Bursts — réutilise `triggerBBCanvas`)
   - *"[STYLE BIBLE] a VFX sprite sheet of a [fire/water/…] Brave Burst explosion, 8 frames in a 4×2 grid, animated energy burst from small to large, transparent background, identical centering, mobile game effect."*
   - Une planche par élément (6) + une planche « UBB » plus spectaculaire.

### 3.4 — Refonte UI/UX : jouable à une main, épurée, intuitive

Principes mobiles non négociables (norme Material / pouce) :
   - **Zone du pouce.** Tout ce qui est tapé souvent (le monstre, les BB, l'onglet actif) doit être dans la **moitié basse** de l'écran. Les infos (or, zone, HP boss) en **haut** (lecture, pas action). Aujourd'hui tu as un *bottom nav* en germe — pousse-le à fond.
   - **Cibles ≥ 48 px.** Boutons de BB, onglets, achats : minimum 48×48 dp avec marge. Mesure tes boutons actuels ; les cartes héros « non focusables » (ton audit §4.2) doivent devenir de vrais boutons accessibles.
   - **Bottom-sheets, pas drawers latéraux.** Les panneaux (Héros, Invocation, Forge) montent du bas en *bottom-sheet* (geste naturel au pouce), avec *handle* de glissement et fond *scrim*. Remplace le `initResponsiveLayout()` qui déménage le DOM.
   - **Réduis la densité.** Aujourd'hui beaucoup d'infos simultanées. Hiérarchise : 1 action primaire par écran, le reste à un tap. *Progressive disclosure*.
   - **Game feel = juice, mais avec un Mode Performance.** Garde le screen-shake, les flashes, les particules — mais expose un réglage **Qualité (Haute / Basse)** (ton audit §4.4) qui coupe filtres CSS lourds, particules ambiantes et VFX sur les appareils faibles. Détecte le *frame budget* et propose-le automatiquement.

**Wireframe mobile cible (portrait, une main) :**

```
┌─────────────────────────────┐
│  Or · Gemmes · Honneur   ⚙️   │  ← barre d'état (haut, lecture seule)
│  Zone 42 — Cavernes d'Agni    │
├─────────────────────────────┤
│                             │
│        [ BOSS / MOB ]        │  ← cible de tap (centre-haut),
│         barre de HP          │     fond de biome
│                             │
│   ······ floaters dégâts ·····│
├─────────────────────────────┤
│  HP équipe ▓▓▓▓▓░░  (DEF)     │
│  [BB1][BB2][BB3][BB4]  ← squad│  ← jauges BB (zone du pouce)
├─────────────────────────────┤
│ ⚔️Combat 🗺️Carte 🦸Héros 🌀Invoc 🛒│  ← bottom nav (5)
└─────────────────────────────┘
```

---

## 4. 🔁 RÉTENTION & MONÉTISATION (F2P éthique et rentable)

### 4.1 — Ce que tu as déjà (ne le sous-estime pas)

Tu as **déjà** : login bonus avec streak, quêtes journalières (rotation par date), boss hebdomadaire, gains offline (35 %/s, cap 8 h), gacha **avec pitié** (`pityCountRare`/`pityCountS`), cartes de partage social (`generateSquadCard`, `generateBossVictoryCard`, `generateAchievementCard`). **C'est une fondation de rétention que beaucoup de jeux lancés n'ont pas.** Le travail n'est pas de tout créer, c'est d'**amplifier, cadencer et brancher la monétisation dessus.**

### 4.2 — Rewarded Ads : non intrusives, mais hautement rentables

Règle d'or éthique **et** commerciale : **la pub récompensée est toujours un choix du joueur qui le rend plus fort**, jamais une interruption forcée. Pas d'interstitiels qui coupent le combat. Les placements, par valeur décroissante :

| Placement | Récompense | Cap/jour | Pourquoi ça marche |
|---|---|---|---|
| **×2 gains offline** | Double le coffre AFK au retour | 1/retour | Placement n°1 du genre. Le joueur revient *content*, regarde une pub *volontiers*. |
| **Buff ×2 Or 30 min** | Multiplicateur temporaire | 3-4 | Crée des sessions actives plus longues. |
| **Invocation gratuite** | 1 tirage offert | 1 | Donne le goût du gacha sans payer → convertit plus tard. |
| **Reroll de loot / affixe** | Relancer un drop | 5 | Branché sur le système de loot (§2.2) : demande énorme. |
| **Revive en combat de boss** | Ressuscite l'équipe (au lieu de repli) | 2-3 | Moment de tension = forte propension à regarder. |
| **×2 récompense de quête** | Double une quête réclamée | par quête | Synergie avec ta rétention existante. |

Implémentation : **AdMob** (médiation pour remplir l'inventaire), via le wrapper natif du portage (Capacitor/TWA — voir Axe 5). Toujours un **fallback** si aucune pub n'est dispo (donne la récompense de base sans pub plutôt que de bloquer).

### 4.3 — Achats In-App (IAP) : éthiques = rentables sur la durée

Grille recommandée (prix indicatifs EUR, à localiser) :

   - **« No Ads + » à 2,99 €** — retire les pubs forcées (s'il y en a) **ET** garde l'accès « ×2 offline » en *toggle permanent gratuit*, **+** un petit bonus permanent (ex. +25 % or). *Ne vends pas juste un retrait : vends un upgrade.* C'est le premier achat le plus fréquent.
   - **Battle Pass / Pass Saisonnier à 4,99–9,99 €/saison** — **le modèle F2P le plus éthique et le plus rentable** aujourd'hui. Deux pistes (gratuite + premium), récompenses gagnées **en jouant** (pas en payant pour gagner), durée ~4 semaines. Donne une raison de revenir *chaque jour* pendant toute la saison. **À prioriser dès que la rétention de base est saine.**
   - **Starter Pack à 0,99–1,99 €** (one-shot, J2-J3) — petit pack de gemmes + un héros 5★ + matériaux. Conversion d'amorçage classique, à *prix d'appel*.
   - **Packs de gemmes** (0,99 € → 49,99 €) avec bonus croissant — la devise premium pour le gacha/forge.
   - **Multiplicateurs permanents** (×2 Or, ×2 BC) à ~3-5 € — *value claire*, pas de hasard.
   - **Cosmétiques / skins de héros** — **la monétisation la plus éthique qui existe** (zéro impact gameplay). Tes assets Gemini rendent ça peu coûteux à produire. Skins, auras, thèmes d'UI.

**Garde-fous (sinon Google te sanctionne ET les joueurs te détestent) :**
   - **Affiche les taux de gacha** (probabilités exactes). C'est **obligatoire** sur Google Play pour les loot boxes, et c'est un signal de confiance.
   - **Pas de pay-to-win destructeur** : le payeur progresse plus vite, il ne rend pas le jeu injouable pour les autres (sépare la progression PvE du PvP/arène, ou fais du PvP async par paliers).
   - **Pas de dark patterns** : pas de faux compte à rebours, pas de « offre qui disparaît » mensongère (ton audit a déjà relevé un texte de prestige trompeur §2.6 — même rigueur côté boutique).

### 4.4 — Mécaniques de rétention : la science du retour quotidien

   - **Offline « scientifique ».** Aujourd'hui : 35 %/s de DPS, cap 8 h, **or uniquement**. Améliore :
     - **Vraie simulation** grâce au fixed-timestep (§1.2) : simule N ticks d'absence → tu peux créditer **or + kills + progression de zone + drops de loot**, pas juste de l'or. Beaucoup plus satisfaisant.
     - **Courbe de rendement** : 100 % du DPS la 1ʳᵉ heure, dégressif ensuite, cap qui **incite au retour** (« ton coffre est plein, reviens le vider »). Le cap est un *appointment mechanic*, pas une punition.
     - **« Fast Rewards »** (façon AFK Arena) : un bouton qui octroie X minutes de gains instantanés — gratuit 1×/jour, puis via **pub** (lien direct avec §4.2).
   - **Cadence de rendez-vous** : Journalier (quêtes + login + fast rewards) → Hebdomadaire (boss hebdo, reset de pass de quêtes) → Mensuel (event saisonnier, calendrier de connexion 30 jours). Trois horloges = trois raisons de revenir à trois fréquences.
   - **Streak avec récompense croissante + filet « comeback »** : le streak login monte (J1…J30), mais prévois une mécanique de *retour* (« content de te revoir » avec bonus) pour ne pas punir l'absence — punir l'absence fait *churner* plus vite.
   - **Events datés (LiveOps)** : depuis `data/liveops.js`, des events à durée limitée (biome event, boss invité, ×2 weekend). C'est le moteur de rétention long terme des jeux service.
   - **Boss Mondial communautaire** (évolution de ton boss hebdo) : un boss **partagé par tous les joueurs**, dont la barre de HP descend collectivement, avec un classement de dégâts et des récompenses par paliers. **C'est ton Pilier 5 (communauté) ET un crochet viral** : on revient pour « contribuer », on partage son score (réutilise tes cartes de partage). Faisable côté serveur léger (Firebase/Cloud Functions).
   - **Notifications push** (via le portage natif / PWA) : « ton coffre AFK est plein », « le boss mondial expire dans 2 h », « ton énergie d'event est pleine ». **Le levier de réengagement n°1 sur mobile** — mais avec parcimonie (1-2/jour max, opt-in, sinon désinstallation).
   - **Sauvegarde cloud = rétention** (rappel du §1.6) : un joueur qui change de téléphone et retrouve sa progression reste. Un joueur qui perd tout part pour toujours.

---

## 5. 🗺️ FEUILLE DE ROUTE TECHNIQUE (Missions 1 → 5)

L'ordre est **délibéré** : on assainit les fondations avant d'empiler des features (sinon on construit sur le mur des nombres et le DOM-thrash). Pour chaque mission : l'objectif, pourquoi maintenant, **le prompt exact à me donner pour coder**, et les critères de validation.

### 🔴 MISSION 1 — Fondations techniques (« stop the bleeding »)
**Objectif :** tuer les trois murs techniques (nombres, boucle, perf) sans changer le gameplay.
**Pourquoi en premier :** tout le reste se construit dessus. Inutile d'ajouter du loot si le jeu casse zone 177 et rame sur mobile.
**Ce que tu me demanderas de coder :**
> *« Mission 1 : (1) Intègre `break_infinity.js` et convertis en Decimal uniquement `gold, monsterHp, dps, damage` et les coûts (`getMonsterMaxHp`, `getHeroStats`, `getHeroLevelCost`, `killMonster`). (2) Réécris `fmt()` avec table de suffixes étendue + notation scientifique au-delà. (3) Remplace les 5 `setInterval` par UNE boucle `requestAnimationFrame` à fixed-timestep avec accumulateur. (4) Ajoute un cache de stats avec dirty flag (`invalidateStats()` aux level-up/évo/équip/squad). (5) Object-pool les nombres de dégâts (ou passe-les sur le canvas) et supprime les `void offsetWidth` au profit de l'API Web Animations. »*

**Validation :** atteindre programmatiquement la zone 500 sans `Infinity` ni perte de précision (test unitaire sur les courbes) ; profiling Chrome DevTools (CPU 4×, throttle mobile) montrant un seul rAF et < 16 ms/frame en combat soutenu ; aucun changement de ressenti de gameplay.

### 🔴 MISSION 2 — Modularisation + Carte du monde
**Objectif :** éclater le monolithe selon la structure §1.7 et introduire la carte de biomes + le hub.
**Pourquoi maintenant :** c'est la condition pour ajouter « 50 features » sans tout casser, et la carte donne du sens à la progression.
**Ce que tu me demanderas de coder :**
> *« Mission 2 : (1) Mets en place Vite + la structure `src/core|data|systems|ui`. (2) Extrais les données (`HERO_DEFS`, biomes, monstres) dans `data/`. (3) Crée le store central + le bus d'événements ; refactore `killMonster()` pour qu'il émette `monster:killed` au lieu d'appeler les renders en dur. (4) Implémente l'écran Carte du Monde (6 biomes → nodes de stages) + le hub persistant + le mode idle/AFK sur le dernier stage. (5) Migre la sauvegarde vers `DEFAULT_STATE` + deepMerge + IndexedDB (fallback localStorage). »*

**Validation :** build produit un seul bundle ; ajouter un héros = éditer un seul fichier de data ; navigation carte→stage→combat fluide ; sauvegardes existantes (`bf_clicker_v4`) migrées sans perte (teste avec une vraie save).

### 🟠 MISSION 3 — Systèmes RPG de rupture
**Objectif :** loot procédural à affixes + arbre de compétences + prestige multi-couches + Spark/BB chaining.
**Pourquoi maintenant :** fondations saines + monde en place → on peut empiler la profondeur qui crée la rétention long terme.
**Ce que tu me demanderas de coder :**
> *« Mission 3 : (1) Système de loot : `data/affixes.js` + générateur procédural (rareté, affixes rollés, 6 slots/héros) + écran Forge (reroll/upgrade/fusion via matériaux). (2) Arbre de compétences global de l'invocateur avec devise de skill + respec. (3) Prestige à 2 couches (Réincarnation existante → Ascension) avec rebase des courbes. (4) Spark/BB chaining : fenêtre de timing, bonus de spark, tiers BB→SBB→UBB ; redonne un rôle actif au tap. »*

**Validation :** deux Légendaires générés ne sont jamais identiques ; un build « crit/spark » bat mesurablement un build « DPS brut » sur un même stage (preuve de theory-crafting) ; la courbe d'engagement post-prestige est positive (le joueur revient plus fort, pas frustré).

### 🟠 MISSION 4 — Direction visuelle & UI mobile
**Objectif :** intégrer les assets Gemini cohérents + refonte UI une main + Mode Performance.
**Pourquoi maintenant :** le contenu existe (Missions 1-3), il faut maintenant le rendre beau, lisible et fluide sur téléphone avant de scaler l'acquisition.
**Ce que tu me demanderas de coder :**
> *« Mission 4 : (1) Remplace émojis/icônes-font par le UI kit Gemini (monnaies, onglets, éléments, raretés). (2) Refonte layout mobile : bottom-nav 5 onglets + bottom-sheets (supprime le déménagement de DOM de `initResponsiveLayout`). (3) Intègre les fonds de biomes 9:16 + sprites détourés + cadres de rareté. (4) Ajoute le Mode Performance (Haute/Basse) avec détection auto du frame budget. »*

**Validation :** test sur un Android bas de gamme réel (ou émulateur throttlé) à ≥ 30 fps en Mode Basse ; toutes les actions fréquentes atteignables au pouce ; cibles ≥ 48 dp ; cohérence visuelle (zéro émoji résiduel dans l'UI de jeu).

### 🟡 MISSION 5 — Rétention, monétisation & portage Play Store
**Objectif :** rewarded ads + battle pass + events + boss mondial + cloud save + push, puis empaqueter pour Google Play.
**Pourquoi en dernier :** on ne monétise et on n'acquiert que sur un jeu solide, beau et qui retient — sinon on brûle le budget pub sur un produit qui *churn*.
**Ce que tu me demanderas de coder :**
> *« Mission 5 : (1) Wrapper natif (Capacitor ou TWA) pour le Play Store + plugin AdMob. (2) Rewarded ads aux 6 placements définis (×2 offline en priorité) avec caps et fallback. (3) Battle Pass saisonnier (piste gratuite + premium) + boutique IAP (No-Ads+, starter, gemmes, cosmétiques) avec taux de gacha affichés. (4) Offline scientifique (or+kills+zone+loot, courbe dégressive, Fast Rewards). (5) Sauvegarde cloud (Google Play Games / Firebase) + notifications push + `data/liveops.js` (events datés) + boss mondial communautaire. »*

**Validation :** AAB qui passe la pré-revue Play Console ; tunnel d'achat testé en sandbox ; une pub récompensée crédite et a un fallback ; restauration de save sur un second appareil ; conformité (déclaration loot box, politique de confidentialité, pas de dark patterns).

---

## 🧭 Synthèse & priorités

| Priorité | Quoi | Impact | Effort |
|---|---|---|---|
| **P0** | break_infinity + boucle rAF unique + cache stats | Empêche la mort du jeu (zone 177) + fluidité mobile | Moyen |
| **P0** | Aligner courbe Or sur HP (≥1,20) + soft caps | Supprime le mur économique | Faible |
| **P1** | Modularisation + Carte du monde + cloud save | Scalabilité + rétention | Élevé |
| **P1** | Loot à affixes + Spark/BB chaining | Détruit la monotonie + crochet unique | Élevé |
| **P2** | UI mobile une main + assets Gemini cohérents | Conversion store + rétention | Moyen |
| **P2** | Battle pass + rewarded ads + boss mondial | Revenus + viralité | Moyen |

## ⚠️ Anti-patterns à éviter (carte blanche oblige)

   - **Ne migre PAS vers React/un gros framework.** Pour un WebView clicker, c'est du poids mort. Modules ES + Vite suffisent.
   - **Ne mets PAS tout en Decimal.** Cible uniquement les grandeurs qui explosent ; le reste reste `Number` (perf).
   - **Ne garde PAS les courbes en escalier.** Lisse + 2-3 spikes intentionnels.
   - **Ne monétise pas avant d'avoir la rétention.** Des pubs sur un jeu qui churn = budget brûlé.
   - **Ne fais pas de pay-to-win destructeur ni de dark patterns.** Google sanctionne, les joueurs fuient, et tu l'as déjà compris (cf. ton souci de transparence dans l'audit).
   - **Ne dépends pas du seul localStorage.** Un wipe = un 1★ et une désinstallation.

## 🎯 La phrase à retenir
Tu n'as pas un clicker de plus à sauver — tu as un **idle-battler complet** à **assainir techniquement** puis à **différencier** par ce que personne d'autre n'a : le **skill de timing Brave Frontier** (Spark/BB chaining) greffé sur une boucle idle, autour de **raids communautaires**. Règle les murs (Mission 1-2), pose la profondeur (Mission 3), rends-le beau et mobile (Mission 4), monétise proprement (Mission 5). Dans cet ordre.

*Quand tu veux, dis-moi simplement « On attaque la Mission 1 » et je commence à coder.*




