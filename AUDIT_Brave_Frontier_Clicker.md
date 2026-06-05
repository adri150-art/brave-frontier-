# 🔍 Audit technique & game design — *Brave Frontier Clicker*

**Fichier audité :** `index.html` (mono-fichier, 5 399 lignes — HTML + CSS + JS inline)
**Périmètre :** structure DOM, CSS responsive (mobile / desktop ≥1024px), logique JS (boucles `setInterval`/`rAF`, formules, jauges, `localStorage`).
**Méthode :** lecture intégrale du fichier + vérification numérique des courbes d'économie (script Python).

> **Verdict global.** Le jeu est ambitieux et visuellement très soigné, mais il souffre de trois maux structurels : (1) une **boucle de rendu qui reconstruit le DOM 10 fois par seconde** (jank garanti sur mobile d'entrée de gamme), (2) une **économie déséquilibrée par construction** où la courbe de PV (×1,28/zone) écrase la courbe d'or (×1,12/zone), rendant les héros achetables en or quasi-inatteignables, et (3) des **restes de code mort/incohérent** issus de refontes successives (bouton Honor qui teste l'or, texte de prestige « +1% » alors que le code donne +10%). Tout est corrigeable ; les correctifs sont fournis ci-dessous.

---

# 1. ❌ Ce qui ne va pas — Bugs, glitches & anomalies

### 1.1 — 🔴 Le bouton « Honor Summon » teste la mauvaise monnaie *(bug fonctionnel)*

`summonHonor()` coûte **500 Points d'Honneur** (ligne 4583-4586), mais `_updateSummonGlow()` active/désactive le bouton selon l'**or** :

```js
// ❌ ACTUEL (ligne 4740-4742) — reste de l'ancienne version "2000 or"
if (honorBtn) {
    honorBtn.disabled = G.gold < 2000;
}
```

Conséquence : le bouton est *grisé* alors que le joueur a 500 PH mais < 2000 or, et *cliquable* (puis rejeté par `summonHonor`) quand il a 2000 or mais 0 PH. Le retour visuel ment au joueur.

```js
// ✅ CORRIGÉ
if (honorBtn) {
    honorBtn.disabled = G.honorPoints < 500;
    honorBtn.classList.toggle('can-afford', G.honorPoints >= 500);
}
```

---

### 1.2 — 🔴 La PV de l'équipe démarre quasi-vide *(bug d'init)*

`G.partyHp` vaut `100` par défaut, mais dès qu'Ignis est dans la squad `updatePartyStats()` recalcule `partyMaxHp` à plusieurs milliers. Comme `partyHp` n'est jamais ré-initialisé à `partyMaxHp` au démarrage (uniquement `partyHp = Math.min(partyHp, partyMaxHp)`, ligne 3469), **la barre de vie affiche un mince filet rouge au lancement** et déclenche même la *danger-vignette*.

```js
// ✅ CORRIGÉ — à la fin de l'initialisation (après le 1er updatePartyStats), ajouter :
updatePartyStats();
G.partyHp = G.partyMaxHp;   // démarrer à pleine vie
updatePartyHpBar();
```

Et dans `loadGame()`, sécuriser les vieilles sauvegardes :

```js
if (G.partyHp === undefined || G.partyHp <= 0) G.partyHp = G.partyMaxHp || 100;
```

---

### 1.3 — 🟠 L'animation « pop » du monstre à la mort est annulée par l'animation d'idle

Dans `killMonster()` (ligne 3557-3559) :

```js
const me = document.getElementById('monster-emoji');
me.style.transform = 'scale(0)';
setTimeout(() => me.style.transform = 'scale(1)', 50);
```

Or `#monster-emoji` exécute en permanence `animation: monsterIdle ...` (CSS ligne 1587). **Une animation CSS active l'emporte sur un `transform` inline** : le `scale(0)/scale(1)` n'est donc jamais visible. L'effet de disparition est mort silencieusement.

```js
// ✅ CORRIGÉ — piloter le pop via une classe d'animation dédiée plutôt qu'un transform inline
me.classList.remove('monster-pop');
void me.offsetWidth;            // reflow
me.classList.add('monster-pop');
setTimeout(() => me.classList.remove('monster-pop'), 260);
```

```css
/* ✅ Nouvelle animation, prioritaire sur monsterIdle grâce à !important */
@keyframes monsterPop {
    0%   { transform: scale(1);   opacity: 1; }
    35%  { transform: scale(0);   opacity: 0; }
    36%  { transform: scale(0.2); opacity: 0; }
    100% { transform: scale(1);   opacity: 1; }
}
.monster-pop { animation: monsterPop 0.25s ease-out !important; }
```

---

### 1.4 — 🟠 Les nombres de dégâts sont clampés à `480px` en dur *(casse sur desktop)*

Ligne 3687 :

```js
dmgEl.style.left = Math.max(10, Math.min(clickX - 25, 480)) + 'px';
```

Le `480` est une largeur d'arène mobile. Sur PC, l'arène carrée fait `calc(100vh - 190px)` (souvent ~800-1000px). Tous les nombres de dégâts au-delà de 480px sont **rabattus dans la moitié gauche**, ce qui décorrèle le chiffre du point de clic.

```js
// ✅ CORRIGÉ — clamp dynamique sur la largeur réelle de la zone
const zoneW = e.currentTarget.clientWidth;
dmgEl.style.left = Math.max(10, Math.min(clickX - 25, zoneW - 60)) + 'px';
```

---

### 1.5 — 🟠 Conflit de z-index : la cinématique Brave Burst passe **sous** la barre d'onglets

`#bb-overlay` est en `z-index: 100` (CSS ligne 1336) alors que `#tab-bar` est en `z-index: 110` (ligne 258). Sur mobile, la barre d'onglets reste donc dessinée **au-dessus** de l'animation de BB plein écran. De même `#tab-content` (z-index 100) peut chevaucher l'overlay.

```css
/* ✅ CORRIGÉ — placer les overlays de cinématique au-dessus de toute l'UI de jeu */
#bb-overlay      { z-index: 250; }
#summon-overlay  { z-index: 260; }   /* déjà à 200, on monte par cohérence */
#screen-flash    { z-index: 240; }
```

> Cartographie z-index actuelle (à documenter) : `monster-bg 0` < `particle-canvas 5` < `header 10` < `tab-content 100` = `bb-overlay 100` ⚠️ < `tab-bar 110` < `corner-gem 120` < `gold-frame 125` < `hero-modal 130/150` < `summon-reveal 220` < `danger-vignette 290` < `notif-toast 300`. La collision est uniquement sur le palier **100**.

---

### 1.6 — 🟡 Valeurs initiales codées en dur dans le HTML, désynchronisées du JS

Ligne 2124 : `Zone 1 — Plaines de Mistral` mais `ZONE_THEMES[0].name === "Cavernes d'Agni"`.
Ligne 2152 : `Loup Gris` alors que le 1er monstre est `Slime de Lave`.

Au chargement, le joueur voit un flash de texte erroné avant le premier `updateMonsterUI()`. Solution : vider/neutraliser les libellés statiques.

```html
<!-- ✅ CORRIGÉ -->
<div class="zone-name" id="zone-name">Chargement…</div>
<div id="monster-name">…</div>
```

---

### 1.7 — 🟡 `renderAchievements()` rebuild complet à **chaque kill** (desktop)

`killMonster()` appelle `renderAchievements()` (ligne 3555). Sur desktop le garde-fou ligne 4937 ne bloque pas (car `isDesktop`), donc le conteneur de quêtes est reconstruit en `innerHTML` à chaque monstre tué — inutile, car l'état des quêtes ne change presque jamais. Voir §3 pour le correctif de fond (rendu événementiel).

---

### 1.8 — 🟡 `getHeroPrice` fallback fantôme

```js
return priceMap[def.id] !== undefined ? priceMap[def.id] : (def.baseDPS * 15000);
```

Tous les héros sont dans `priceMap`, donc le fallback `baseDPS * 15000` n'est jamais atteint — mais s'il l'était (nouvel héros ajouté sans prix), il produirait des prix incohérents avec la grille manuelle. À documenter ou à supprimer.

---

# 2. ⚖️ Problèmes d'équilibrage — économie, courbes & progression

### 2.1 — 🔴 La courbe de PV écrase la courbe d'or : mur structurel inévitable

| Zone | PV monstre | Or / kill | ATK monstre | Ratio **PV/Or** |
|----:|----------:|---------:|-----------:|----------------:|
| 1 | 10 | 10 | 2,5 | **1,0** |
| 10 | 92 | 28 | 14 | 3,3 |
| 20 | 1,09 K | 86 | 94 | 12,6 |
| 50 | 1,79 M | 2,58 K | 28,5 K | 694 |
| 100 | 411 G | 746 K | 392 M | 551 064 |
| 139 | 6,24 Qa | 62 M | 664 G | **100 667 360** |

PV croît en **×1,28/zone**, l'or en **×1,12/zone**. L'écart se creuse de `1,28/1,12 ≈ ×1,143` **par zone**. Comme le coût de niveau d'un héros croît lui aussi exponentiellement (`baseCost · rate^level`, rate 1,15→1,30), **les revenus en or ne peuvent jamais financer le DPS requis** : le joueur frappe un mur dur dès la zone ~30-40 et n'a plus que l'idle/offline pour avancer.

**Correctif recommandé — rapprocher les deux exposants** (cible : ratio PV/Or qui croît lentement, pas explosivement) :

```js
// ✅ CORRIGÉ
function getMonsterMaxHp() {
    const base = 10 * Math.pow(1.20, G.zone - 1);   // 1.28 -> 1.20
    return Math.ceil(G.isBoss ? base * 12 : base);
}
function killMonster() {
    // or indexé plus près de la PV : 1.12 -> 1.165
    let gold = Math.ceil(10 * Math.pow(1.165, G.zone - 1) * (G.isBoss ? 5 : 1));
    ...
}
```

Avec `PV ×1,20` et `Or ×1,165`, l'écart par zone tombe à `×1,03` (au lieu de `×1,143`) : la progression reste exigeante mais finançable.

---

### 2.2 — 🔴 Les héros achetables en or sont mathématiquement inatteignables

La grille `getHeroPrice` (ligne 4040-4059) est calibrée pour une économie bien plus rapide que la courbe d'or réelle. En croisant chaque prix avec l'or réellement gagné :

| Héros | Prix (or) | Zone où **un seul kill** rapporte ce prix |
|------|----------:|:--|
| Selena | 8 500 | ~zone **61** |
| Margonia | 45 000 | ~zone 75 |
| Zeln | 750 000 | ~zone 100 |
| Eze | 15 M | ~zone 126 |
| Magress | 950 M | ~zone **163** |

Or **le Prestige se débloque dès la zone 50 et remet l'or et les zones à zéro**. Le joueur n'atteindra donc jamais des zones à 3 chiffres avec cette courbe d'or : Selena (8 500) est déjà à la limite du raisonnable, et tout le « Palier Élite/Divin » (Karl → Magress) est **contenu mort**. Deux options :

**Option A (recommandée) — rendre ces héros invocables**, pas achetables : ils sont déjà dans `SUMMON_POOLS` (Tier S/A). Réserver l'or aux 3-4 premiers, le reste via gachat gemmes/PH.

**Option B — recalibrer la grille** sur la nouvelle courbe d'or §2.1 :

```js
function getHeroPrice(def) {
    const priceMap = {
        ignis: 0, vargas: 1200, selena: 6500,
        margonia: 28000, lance: 90000, zeln: 280000,
        karl: 850000, eze: 2200000, kikuri: 6000000,
        sera: 14000000, atro: 30000000, magress: 70000000,
    };
    return priceMap[def.id] ?? (def.baseDPS * 15000);
}
```

---

### 2.3 — 🟠 Tap vs DPS passif : crossover mal maîtrisé

Le **tap** et les **héros** partagent exactement les mêmes paliers (`MILESTONES` ×3/×4/×8/×20). Mais :

- **Tôt** : le tap (`1 + level`, coût `×1,05`… non, `×1,14`) progresse vite et pas cher → le clic *écrase* le jeu pendant les ~15 premières zones (avec combo ×1,1/clic et crit ×3, voire ×4,5 sous Eze).
- **Tard** : les héros multiplient par `baseDPS` (jusqu'à 700) × `2^(stars-3)` (×8 à 6★) × facteur BB (×150) → ils explosent le tap.

Le problème n'est pas la présence d'un crossover (sain) mais son **absence de signalisation** : rien n'incite le joueur à pivoter du clic vers la squad. Suggestions : plafonner le combo (déjà à ×40) et surtout **réduire le coût-efficacité du tap en fin de partie** en accélérant son coût :

```js
// Coût du tap : 1.14 est trop doux face à l'inflation des PV. Indexer plus fort en fin de partie.
const tapCost = Math.floor(10 * Math.pow(1.16, G.tapDamageLevel));
```

> ⚠️ **Incohérence à corriger d'abord** : le coût du tap est calculé avec **deux exposants différents** dans le code. `updateDisplays` (ligne 3966) et l'achat principal utilisent `1.14`, mais `getTapDamage` n'a pas de coût, et l'ancien `updateDisplays` non patché utilisait `1.05` (ligne 3966 affiche encore `1.05` !). **Le bouton `#tap-btn` affiche un coût `1.05` mais `upgradeTap` débite `1.14`.** Unifier impérativement sur une seule constante :

```js
const TAP_GROWTH = 1.16;
const tapCostAt = lvl => Math.floor(10 * Math.pow(TAP_GROWTH, lvl));
// remplacer TOUTES les occurrences de Math.pow(1.05|1.14, ...) par tapCostAt(...)
```

---

### 2.4 — 🟠 Le mur de DÉFENSE : ATK exponentielle vs HP/DEF linéaires

`getMonsterAttack` croît en **×1,21/zone** (exponentiel), tandis que la PV et la DEF de l'équipe sont **linéaires** en niveau de héros (`baseDPS · 18 · level · stars`). La formule de dégâts :

```js
const finalDmg = Math.max(Math.ceil(baseAtk*atkMod*0.10), Math.ceil(baseAtk*atkMod - partyDef*0.4));
```

garantit un **plancher de 10% de l'ATK** ignorant totalement la DEF. Comme l'ATK est exponentielle, ce plancher seul finit par dépasser la PV max de l'équipe → **morts de squad inévitables** en zones hautes, peu importe l'investissement DEF. C'est un mur de difficulté injuste (la DEF devient cosmétique).

```js
// ✅ CORRIGÉ — adoucir l'ATK et indexer le plancher sur la DEF (réduction logarithmique)
function getMonsterAttack() {
    let base = 2.5 * Math.pow(1.16, G.zone - 1);   // 1.21 -> 1.16
    if (G.isBoss) base *= 4.5;
    return Math.ceil(base);
}
// Atténuation de dégâts façon "armure" (jamais 0, mais la DEF compte toujours)
const reduction = G.partyDef / (G.partyDef + baseAtk);          // 0..1
const finalDmg  = Math.max(1, Math.ceil(baseAtk * atkMod * (1 - reduction * 0.75)));
```

---

### 2.5 — 🟡 Le timer de Boss est sans conséquence (mécanique creuse)

Ligne 3825 : si `bossTimer <= 0`, on fait simplement `G.isBoss=false; G.monsterIndex=0; spawnMonster();` — **aucune pénalité**. Échouer un boss recommence juste la zone, sans perte. Le compte à rebours, la *danger-vignette* et l'ultime n'ont donc aucun enjeu. Soit on lui donne des dents (perte de zone, comme la mort de squad), soit on retire le timer. Proposition « avec dents » :

```js
if (G.bossTimer <= 0) {
    showNotif("⏱️ Temps écoulé ! Le Boss vous repousse d'une zone.");
    G.isBoss = false; G.monsterIndex = 0;
    if (G.zone > 1) G.zone--;     // pénalité symétrique à la mort de squad
    spawnMonster(); saveGame();
}
```

---

### 2.6 — 🟡 Texte de Prestige mensonger (+1% vs +10% réel)

`renderPrestigePanel` annonce *« Cristaux (+1% Stats globales) »* (ligne 4974) mais le code applique **+10% par cristal** :

```js
return Math.floor(total * (1 + G.prestigeCrystals * 0.10));   // getTotalDPS / getTapDamage
```

Un premier prestige zone 50 donne `floor(√1·10)=10` cristaux = **+100% DPS** (et +710% à la zone 100). Soit le texte est faux, soit le coefficient est trop généreux. Décider :

```js
// Option "fidèle au texte" : +1% par cristal
return Math.floor(total * (1 + G.prestigeCrystals * 0.01));
// …ou corriger le texte : "(+10% Stats globales par cristal)"
```

---

# 3. ⚠️ Ce qui posera problème à l'avenir — scalabilité & performance

### 3.1 — 🔴 La boucle 100 ms reconstruit le DOM 10×/seconde (goulot principal mobile)

La boucle de combat (`setInterval(…, 100)`, ligne 3793) appelle `updateDisplays()` à **chaque tick non-mort** (ligne 3878). Or `updateDisplays` (version patchée, ligne 5276) fait, **10 fois par seconde** :

1. `renderFooterBB()` → `innerHTML = …` (re-parse complet des slots BB)
2. `renderMaterialsPanel()` → `innerHTML = …`
3. `updateSpheresInventoryDisplay()` → `innerHTML = …`
4. Une boucle `while` qui calcule `Math.pow(1.14, …)` **autant de fois que `tapMaxCount`** (peut atteindre plusieurs centaines en fin de partie) pour le bouton MAX
5. `getTotalDPS()` (boucle sur la squad + `HERO_DEFS.find` × 4)
6. `setProperty('innerHTML', …)` sur 6+ éléments de devises

Sur un Android d'entrée de gamme, ces reconstructions `innerHTML` + recalculs de layout 10×/s **font ramer** (chaque `innerHTML` invalide le style/layout du sous-arbre). C'est le problème de performance n°1.

**Correctifs :**

**(a) Découpler l'état (rapide) de l'UI (lent).** Mettre à jour les barres/textes par `textContent`/`style.width` (pas de re-parse), et ne reconstruire les listes (`innerHTML`) **que sur événement** (achat, kill, ouverture d'onglet) — jamais dans le tick.

```js
// ✅ Dans le tick 100ms, n'appeler qu'une mise à jour "légère"
function updateDisplaysLight() {
    goldEl.firstChild ? (goldValSpan.textContent = fmt(G.gold)) : null; // textContent only
    dpsValSpan.textContent = fmt(getTotalDPS());
    // barres : largeur uniquement
    document.getElementById('hp-bar-fill').style.width = ... ;
}
// renderFooterBB / renderMaterialsPanel / renderSkills : appelés UNIQUEMENT
// quand la donnée change (addBC, useBB, kill de boss qui drop un mat, etc.)
```

**(b) Pré-calculer le coût MAX du tap sans boucle** (formule fermée de série géométrique) :

```js
// somme de 10*r^level pour 'n' niveaux = 10 * r^level * (r^n - 1)/(r - 1)
function affordableTapLevels(gold, level, r = 1.16) {
    // n max tel que 10*r^level*(r^n - 1)/(r-1) <= gold
    const a = 10 * Math.pow(r, level);
    const n = Math.floor(Math.log(1 + gold * (r - 1) / a) / Math.log(r));
    return Math.max(0, n);
}
```

Cela remplace une boucle `while` potentiellement coûteuse par **2 `Math.log`**.

**(c) `requestAnimationFrame` + throttle.** Faire tourner le tick de combat à 100 ms (logique) mais **ne rafraîchir l'UI texte qu'à ~5 Hz** et les listes jamais dans la boucle. Ajouter aussi une **détection de visibilité** pour suspendre la boucle quand l'onglet est masqué :

```js
let _bgPaused = false;
document.addEventListener('visibilitychange', () => { _bgPaused = document.hidden; });
// au début du tick : if (_bgPaused) { /* avancer la logique mais zéro DOM */ return; }
```

---

### 3.2 — 🔴 Filtres CSS lourds + animations continues = GPU saturé sur mobile

Cumul permanent : `#dynamic-pc-bg { filter: blur(40px) }` (très coûteux, plein écran), `backdrop-filter: blur(12px)` du hero-modal, `drop-shadow` multiples + `hue-rotate` sur le monstre (re-appliqués toutes les 100 ms quand gelé/maudit, §1.7), `conic-gradient` (`.summon-vortex`, `.sg-vortex`) en rotation infinie, `danger-vignette` qui pulse, `spotlightPulse`, `monsterIdle`, `monsterShadow`… Beaucoup tournent **même quand non visibles**.

**Correctifs :**

```css
/* ✅ Respecter la préférence système (accessibilité + perf) */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    #dynamic-pc-bg { filter: brightness(0.4) !important; }   /* on retire le blur 40px */
}
```

```css
/* ✅ Promouvoir les éléments animés sur leur propre couche GPU */
.summon-vortex, .sg-vortex, #monster-emoji, #hp-bar-fill, #party-hp-bar-fill {
    will-change: transform;
}
```

Et exposer un **« Mode performance »** dans les Paramètres qui coupe le blur du fond, les particules météo et les vortex (cf. §4.4). Éviter de ré-appliquer `_applyMonsterFilter` à 10 Hz : ne le faire que **quand l'état gel/malus change**, pas à chaque tick (lignes 3866-3867).

---

### 3.3 — 🟠 Migration de sauvegarde fragile (risque de reset/corruption en MAJ)

`loadGame()` fait `G = { ...G, ...parsed }` : les **champs racine** nouveaux sont préservés (bien), mais les **objets imbriqués** (`heroes`, `playerSkillsActive`, `bbGauges`…) sont **remplacés en bloc** par la sauvegarde. Si une future MAJ ajoute un sous-champ à un héros (ex. `equippedSphere2`, `prestigeStars`), **les héros des sauvegardes existantes ne l'auront pas** → `undefined` propagé dans les calculs. Les garde-fous actuels (`if(!G.materials)…`) et la migration `elimo→margonia` sont **manuels et non versionnés**.

```js
// ✅ Système de migration versionné
const SAVE_VERSION = 5;
function migrate(s) {
    s._v = s._v || 1;
    if (s._v < 2) { /* elimo -> margonia (déplacer ici) */ s._v = 2; }
    if (s._v < 5) {
        // normaliser chaque héros avec les champs par défaut
        Object.values(s.heroes || {}).forEach(h => {
            if (h.duplicates === undefined) h.duplicates = 0;
            if (h.type === undefined) h.type = 'Lord';
            if (h.equippedSphere === undefined) h.equippedSphere = null;
        });
        s._v = 5;
    }
    return s;
}
function loadGame() {
    try {
        const d = localStorage.getItem('bf_clicker_v4');
        if (!d) return false;
        const parsed = migrate(JSON.parse(d));
        G = deepMerge(structuredClone(G), parsed);   // merge récursif, défauts conservés
        return true;
    } catch (e) { console.warn('Save corrompue, démarrage neuf', e); return false; }
}
```

> Conseil : **conserver la clé `bf_clicker_v4`** mais piloter le schéma par `_v` interne. Et **écrire une sauvegarde de secours** (`bf_clicker_backup`) avant chaque `setItem`, pour pouvoir restaurer si un `JSON.parse` échoue.

---

### 3.4 — 🟠 Pas d'autosave périodique : l'or idle peut être perdu

`killMonster()` ne sauvegarde **pas**. Toute la progression passive (kills via DPS) n'est persistée qu'au prochain *autre* `saveGame()` (achat, évolution, mort de squad…). Si le joueur ferme l'onglet après une longue session idle sans interagir, **les gains sont perdus** — et `checkOfflineGains` repart d'un `lastSave` ancien.

```js
// ✅ Autosave toutes les 15 s + à la fermeture
setInterval(saveGame, 15000);
window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
```

---

### 3.5 — 🟡 Précision des grands nombres (perte d'entiers, pas d'`Infinity` immédiat)

Les nombres sont des `double` JS : la précision entière est garantie jusqu'à `2^53 ≈ 9,0 × 10^15`. D'après les courbes :

- **PV de monstre** dépasse `2^53` vers la **zone ~140** ; **PV de boss** (×15) vers la **zone ~130**.
- Au-delà, les PV/or perdent leurs derniers chiffres (cosmétique, pas de `NaN`).
- Pas de risque d'`Infinity` avant ~10^308 (zone ~3000), donc non bloquant en pratique.

Risque réel de `NaN`, lui, **localisé** : `expPct = h.level / EVO_LEVEL_CAPS[h.stars]` devient `NaN` si `stars` sort de `[3..6]`. Sécuriser :

```js
const cap = EVO_LEVEL_CAPS[h.stars] || 1;
const expPct = Math.min(100, (h.level / cap) * 100);
```

Pour aller plus loin (zones « infinies »), prévoir une représentation en **mantisse/exposant** (type `break_infinity.js`) — non urgent tant que le prestige plafonne la progression vers la zone 50-100.

---

# 4. 🛠️ Choses à améliorer — ergonomie, accessibilité & game feel

### 4.1 — 🟠 Raccourcis clavier : libellés ≠ touches réelles (AZERTY/QWERTY)

Les indices affichés sont `A / Z / E` (ligne 5343) mais le handler utilise `e.code` (`KeyA`, `KeyZ`, `KeyE`), qui désigne la **position physique QWERTY**. Sur un clavier AZERTY, `KeyA` est la touche physique marquée **Q**, `KeyZ` la touche **W**. L'indice ment donc à la moitié des joueurs. Utiliser `e.key` (le caractère réellement produit) pour coller au libellé :

```js
// ✅ CORRIGÉ — se baser sur le caractère tapé, insensible à la casse/layout
const k = e.key.toLowerCase();
if (k === 'a') usePlayerSkill('strike');
else if (k === 'z') usePlayerSkill('wealth');
else if (k === 'e') usePlayerSkill('frenzy');
```

---

### 4.2 — 🟠 Accessibilité : cartes cliquables non focusables

Beaucoup d'interactifs sont des `<div onclick>` (cartes héros, slots squad, bannières gacha) : **non atteignables au clavier, invisibles aux lecteurs d'écran**, pas de `:focus-visible`. Minimum vital :

```html
<div class="hero-mini-card" role="button" tabindex="0"
     aria-label="Ignis — niveau 12"
     onclick="openHeroModal('ignis')"
     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHeroModal('ignis')}">
```

```css
/* ✅ Anneau de focus visible (clavier) */
:focus-visible { outline: 2px solid #00f0ff; outline-offset: 2px; }
```

---

### 4.3 — 🟡 Game feel : achats multiples & retours visuels

- **Héros** : les boutons `+1 / ×10 / MAX` existent déjà (bien). Les **sphères/évolutions** n'ont pas de retour « impossible » clair (le bouton se grise mais sans tooltip de cause).
- **Tap** : ajouter un **« +N flottant »** sur le bouton MAX qui prévisualise les niveaux gagnés (déjà partiellement fait, ligne 5305).
- **Survol/clic** : très bon sur desktop (hover dynamiques élémentaires). Sur mobile, ajouter un `:active { transform: scale(.96) }` systématique sur tous les boutons d'achat pour le retour tactile.
- **Auto-attaque visuelle** : le monstre ne « tremble » qu'au clic ; ajouter un micro-shake périodique quand le DPS passif est élevé pour montrer que la squad travaille.

---

### 4.4 — 🟡 Manque un « Mode performance » et un réglage de qualité

Vu §3.2, exposer dans Paramètres un toggle qui : coupe `blur(40px)` du fond, désactive les particules météo (`isWeather`), fige les vortex. Stocker dans `G.lowFx` et tester dans `updateP`/CSS.

```js
// dans updateP, avant le bloc "AMBIANCE MÉTÉO"
if (!G.lowFx && G.zone) { /* … spawn météo … */ }
```

```html
<div class="settings-row">
  <div><div class="settings-row-label">Mode performance</div>
       <div class="settings-row-sub">Coupe flous & particules (mobile lent)</div></div>
  <button class="toggle-btn off" id="settings-lowfx-toggle" onclick="toggleLowFx()">OFF</button>
</div>
```

---

# 5. 💡 Fonctionnalités à ajouter ou à retirer

### 5.1 — ➕ Écran de Statistiques (données déjà collectées mais jamais affichées !)

Le jeu **traque déjà** `totalKills`, `bossKills`, `totalGold`, `totalPrestiges`, `maxCombo`, `maxZone` dans `G` — mais **rien ne les montre au joueur**. C'est de la rétention gratuite : il suffit de les exposer (onglet Paramètres ou Prestige).

```js
function renderStats() {
    const s = G;
    return `
      <div class="settings-section">
        <div class="settings-section-title">📊 Statistiques</div>
        <div class="settings-row"><span>Monstres tués</span><b>${fmt(s.totalKills)}</b></div>
        <div class="settings-row"><span>Boss vaincus</span><b>${fmt(s.bossKills)}</b></div>
        <div class="settings-row"><span>Or total amassé</span><b>${fmt(s.totalGold)}</b></div>
        <div class="settings-row"><span>Clics totaux</span><b>${fmt(s.totalClicks)}</b></div>
        <div class="settings-row"><span>Meilleur combo</span><b>×${(1+s.maxCombo*0.1).toFixed(1)}</b></div>
        <div class="settings-row"><span>Zone max</span><b>${s.maxZone}</b></div>
        <div class="settings-row"><span>Prestiges</span><b>${s.totalPrestiges}</b></div>
      </div>`;
}
```

---

### 5.2 — ➕ Export / Import de sauvegarde (résilience + confiance)

Pas de cloud → un simple export presse-papier protège des purges de cache navigateur (qui effacent `localStorage`).

```js
function exportSave() {
    const blob = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
    navigator.clipboard.writeText(blob);
    showNotif('📋 Sauvegarde copiée dans le presse-papier !');
}
function importSave(code) {
    try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        G = { ...G, ...parsed }; saveGame(); location.reload();
    } catch (e) { showNotif('❌ Code de sauvegarde invalide.'); }
}
```

---

### 5.3 — ➕ Améliorer le système hors-ligne (déjà présent mais perfectible)

`checkOfflineGains` existe (ligne 5241) mais : (1) il n'octroie **que de l'or** sans simuler kills/zones, (2) il utilise `alert()` (bloquant, moche), (3) **il ne sauvegarde pas** après avoir crédité l'or, (4) `lastSave` n'est pas remis à `now` → un second chargement re-crédite. Correctifs :

```js
function checkOfflineGains() {
    if (!G.lastSave) return;
    const elapsed = Math.min(Math.floor((Date.now() - G.lastSave) / 1000), 28800);
    if (elapsed < 120) return;
    const dps = getTotalDPS();
    if (dps <= 0) return;
    const gold = Math.floor(elapsed * dps * 0.35);
    G.gold += gold; G.totalGold += gold;
    G.lastSave = Date.now();           // ✅ évite le double-crédit
    saveGame();                         // ✅ persiste
    showOfflineModal(elapsed, gold);    // ✅ modale stylée, pas d'alert()
}
```

Et idéalement un **« coffre passif »** : un bonus offline qui s'accumule visuellement et se réclame d'un clic (boucle d'engagement classique des idle games).

---

### 5.4 — ➖ À retirer / simplifier

- **Timer de Boss creux** (§2.5) : lui donner des dents *ou* le supprimer.
- **Honor Summon redondant** : il ne donne que des matériaux d'évolution, qui font doublon avec le grind d'évolution. Le fusionner avec le Rare Summon (table de butin unique pondérée) ou lui ajouter une vraie valeur (fragments de héros).
- **Sorts `wealth`/`strike` sous-dimensionnés** : `strike = 50× tap` est ridicule face à un BB = `dps × 150`. Rééquilibrer ou retirer.
- **CSS mort/dupliqué** : le bloc `@media (min-width:1024px) #game-window` est défini **deux fois** (lignes 52-71 et 362-383) ; `.desktop-spheres-inventory`, `.hm-btn`, `.gacha-btn`, `.heroes-grid` sont redéfinis 2× (la 2ᵉ écrase la 1ʳᵉ). À dédupliquer pour réduire le poids et la dette.
- **Fichiers de backup** dans le dossier (`index.OLD.backup.html`, `index_OLD_backup.html`, `src.OLD.backup/`) : à archiver hors du dossier de prod.

---

## 🎯 Top 7 — par ordre de priorité

| # | Sévérité | Sujet | Effort |
|--|--|--|--|
| 1 | 🔴 Perf | Sortir les `innerHTML` de la boucle 100 ms (§3.1) | Moyen |
| 2 | 🔴 Balance | Rapprocher courbes PV/Or & ATK/DEF (§2.1, §2.4) | Faible |
| 3 | 🔴 Balance | Héros or inatteignables → invocables (§2.2) | Faible |
| 4 | 🔴 Bug | PV équipe vide au démarrage (§1.2) | Trivial |
| 5 | 🔴 Bug | Coût du tap incohérent 1.05 vs 1.14 (§2.3) | Trivial |
| 6 | 🟠 Data | Autosave + migration versionnée (§3.3, §3.4) | Moyen |
| 7 | 🟠 Bug | Bouton Honor teste l'or (§1.1) | Trivial |

*Audit réalisé par lecture intégrale du fichier ; courbes d'économie validées numériquement.*
