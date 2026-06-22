# ⚔️ REFONTE VISUELLE COMPLÈTE — MOBILE
### Brave Frontier Clicker · Nouvelle direction artistique + plan fluidité
*Rapport du 10/06/2026 — basé sur un audit mesuré du code actuel (index.html 770 l., css/styles.css 3 716 l., js/game.js 6 328 l.)*

---

## 0. RÉSUMÉ EXÉCUTIF

Le jeu actuel souffre de deux maladies liées : **une DA incohérente** (deux thèmes empilés qui se battent : `styles.css` "néon bleu" + `grimoire-noir.css` en override par-dessus) et **une UI qui sature le GPU mobile** (172 box-shadows, 29 animations infinies, backdrop-filters, canvas plein écran permanent, 26 images de plus de 1 Mo dont un fond d'accueil de 7 Mo).

La recommandation : **ne pas re-patcher. Repartir d'une DA neuve, unique, conçue mobile-first**, avec un budget de rendu strict, et reconstruire l'UI écran par écran sur un système de design tokens. Le gameplay (game.js) reste ; la couche visuelle est remplacée.

---

## 1. CONSTAT — POURQUOI C'EST MOCHE ET PAS FLUIDE (chiffres mesurés)

### 1.1 — Incohérence visuelle (le "moche")

| Problème | Mesure | Effet |
|---|---|---|
| Deux thèmes empilés | `styles.css` (3 716 l.) + `grimoire-noir.css` (456 l.) en override | Couleurs/bordures incohérentes selon les écrans, cascade imprévisible |
| **5 familles de polices** | Rajdhani, Nunito, Cinzel, Outfit, Bebas Neue (2 requêtes Google Fonts) | Aucune identité typographique, flash de polices au chargement |
| **69 styles inline** dans le HTML | `style="..."` partout dans index.html | Impossible de thémer globalement, valeurs en dur |
| Texte illisible | **49 occurrences de font-size 6–9 px** dans le CSS | Illisible sur mobile, en-dessous de tout standard d'accessibilité |
| Pas de système | Aucune échelle d'espacement, de rayons ni de couleurs centralisée (variables partielles) | Chaque panneau a ses propres valeurs → effet "patchwork" |
| Emoji + PNG + icônes RPG-Awesome mélangés | 3 langages iconographiques simultanés | Aspect amateur |

### 1.2 — Saturation GPU/CPU (le "pas fluide")

| Problème | Mesure | Coût |
|---|---|---|
| **Assets monstrueux** | 99 Mo d'assets, 62 images, **26 > 1 Mo**, `home_ui_clean.png` = **7 Mo**, `visual hero/` = 45 Mo, `heroes/` = 28 Mo | Décodage d'images = jank au scroll/changement d'écran, mémoire GPU explosée sur mobile |
| Box-shadows | **172** déclarations | Chaque shadow flou = repaint coûteux ; empilées sur des éléments animés = catastrophe |
| `backdrop-filter: blur()` | 10 occurrences (jusqu'à blur(15px)) | L'effet CSS le plus cher qui existe sur mobile : repaint de tout ce qui est derrière, à chaque frame |
| Animations infinies | **29** `animation: ... infinite` simultanées | GPU jamais au repos, batterie, throttling thermique → chute de FPS progressive |
| `transition: all` | **38** occurrences | Anime des propriétés layout (width/height/top) → reflow à chaque frame au lieu de compositor-only |
| `filter:` | 49 occurrences | drop-shadow/glow par filtre = très cher |
| Canvas ambient permanent | 55 particules plein écran à 60 fps, **même quand un menu couvre tout**, jamais en pause, pas de cap devicePixelRatio | Une boucle rAF entière brûlée pour un fond invisible la moitié du temps |
| Rendu DOM du combat | 66 `innerHTML`, 135 écritures `.style.` dans game.js | Reconstructions de chaînes HTML + reflows (déjà partiellement mitigé par le dirty-flag §1.4, mais le fond du problème reste) |

> Le mode Performance existant (§3.4, auto-détection FPS) est un **aveu** : le jeu détecte qu'il rame et coupe ses propres effets. La refonte doit faire que le mode "haute qualité" tienne 60 fps sur un téléphone moyen de gamme — le perf mode devient un bonus batterie, pas une béquille.

### 1.3 — Ergonomie mobile

- `user-scalable=no` + blocage pinch-zoom JS : OK pour un jeu, mais alors **tout doit être lisible sans zoom** — incompatible avec les 49 textes de 6–9 px.
- Zones tactiles : nombreux boutons < 44×44 px (standard Apple/Android : 44–48 px minimum).
- `safe-area-inset` géré dans styles.css (10 occurrences) mais **pas dans grimoire-noir.css** → le thème qui gagne la cascade ignore l'encoche.
- Modales centrées type desktop au lieu de **bottom sheets** (le pouce vit en bas de l'écran) — `bottomsheet.css` existe mais n'est presque pas exploité.

---

## 2. NOUVELLE DIRECTION ARTISTIQUE — « AURORA FORGE »

On abandonne Grimoire Noir (sombre-sur-sombre, illisible en plein soleil, dépendant de glows coûteux). La nouvelle identité : **dark fantasy lisible et "premium mobile"** — fonds profonds mais froids et mats, et la couleur vit dans **le contenu** (héros, gemmes, effets), pas dans la déco. Référence d'exécution : la lisibilité d'un AFK Arena / Archero, la sobriété d'interface d'un Slay the Spire mobile.

### 2.1 Principes non négociables

1. **La déco ne brille pas.** Zéro glow permanent, zéro animation décorative infinie. La lumière est un événement (coup critique, invocation, level-up) — jamais un état.
2. **1 écran = 1 point focal.** Le combat montre le monstre. Les menus montrent leur contenu. Tout le reste est neutre.
3. **Budget de rendu par écran** (voir §4.2) : c'est une contrainte de DA, pas juste de tech.
4. **Le pouce d'abord** : toute action fréquente sous la moitié basse de l'écran, toute modale devient bottom sheet.

### 2.2 Palette (design tokens — source de vérité unique)

```css
:root {
  /* Fonds — froids, mats, 3 niveaux max */
  --bg-0: #0B0E14;        /* fond d'app */
  --bg-1: #131826;        /* panneaux, cartes */
  --bg-2: #1C2333;        /* éléments surélevés, sheets */
  --stroke: #2A3349;      /* bordures 1px — remplace 90% des box-shadows */

  /* Texte — contraste AA garanti sur bg-1 */
  --txt-1: #EDF1FA;       /* titres, valeurs */
  --txt-2: #9AA6C0;       /* secondaire */
  --txt-3: #5C6884;       /* désactivé, légendes */

  /* Accents — réservés au SENS, jamais à la déco */
  --gold:   #F2C14E;      /* monnaie or, récompenses */
  --gem:    #4EC9F2;      /* gemmes, premium */
  --hp:     #E5484D;      /* dégâts, vie, danger */
  --energy: #57D9A3;      /* heal, succès, validation */
  --arcane: #A78BFA;      /* Brave Burst, rareté épique */

  /* Raretés (cadres héros/invocation) */
  --r-common: #8A93A6;  --r-rare: #4EC9F2;
  --r-epic:   #A78BFA;  --r-myth: #F2C14E;
}
```

Règle d'usage : **un accent par composant maximum.** Un bouton est soit or, soit neutre — jamais dégradé multicolore.

### 2.3 Typographie — 2 familles, point final

| Rôle | Police | Usage |
|---|---|---|
| Display | **Cinzel** (700) — déjà chargée, identité fantasy | Titres d'écran, nom du jeu, bannières d'événement. JAMAIS sous 18 px |
| UI + chiffres | **Outfit** (400/600/800) variable | Tout le reste. Chiffres en `font-variant-numeric: tabular-nums` pour les compteurs (or/DPS qui ne "sautent" plus) |

Supprimer Rajdhani, Nunito, Bebas Neue. Échelle fixe : 12 / 14 / 16 / 20 / 26 / 34 px (minimum absolu 12 px ; les 49 textes de 6–9 px sont remontés ou supprimés). `font-display: swap` + préchargement des 2 fichiers woff2 subsettés.

### 2.4 Formes, profondeur, matières

- **Rayons** : 8 px (boutons, cartes), 16 px (sheets, panneaux), 999 px (pills). Rien d'autre.
- **Profondeur sans shadows** : la hiérarchie se fait par les 3 niveaux de fond + bordure `--stroke` 1px. Budget box-shadow : **une seule ombre douce autorisée par écran** (sur le sheet actif), `0 -8px 24px rgba(0,0,0,.45)`.
- **Plus aucun backdrop-filter.** Les overlays utilisent un fond plein `rgba(11,14,20,.92)` — visuellement quasi identique, gratuit en GPU.
- Texture : un seul PNG de grain/nebula 256×256 répété en overlay 4% d'opacité sur `--bg-0`, statique. C'est ça qui donne le "premium", pas les glows.

### 2.5 Iconographie

Un seul langage : **lucide/phosphor en SVG inline monochromes** (teintés par `currentColor`), 20–24 px. Les emojis disparaissent de l'UI (ils restent tolérés dans les textes de notification). RPG-Awesome (webfont entière chargée pour ~15 icônes) est supprimé.

### 2.6 Langage d'animation (le "juice" qui ne rame pas)

- **Propriétés autorisées : `transform` et `opacity` uniquement.** Interdiction d'animer width/height/top/left/box-shadow/filter. Les 38 `transition: all` sont remplacées par des transitions explicites.
- Durées : 120 ms (feedback tap), 200 ms (ouverture sheet), 350 ms (transition d'écran). Easing unique : `cubic-bezier(.2,.8,.2,1)`.
- Feedback de tap universel : `scale(.96)` 120 ms + (si supporté) `navigator.vibrate(8)`.
- Les événements gardent leur spectacle (BB, invocation, boss kill) : plein écran, courts (< 1,5 s), skippables au tap, et **le canvas ambient + animations de fond sont mis en pause pendant**.
- `prefers-reduced-motion` déjà présent : conservé et étendu.

---

## 3. REFONTE ÉCRAN PAR ÉCRAN

### 3.1 Écran d'accueil / start menu (`sm-panel`)
- Remplacer `home_ui_clean.png` (7 Mo !) par : fond dégradé CSS + **une** illustration héros recadrée mobile, exportée en AVIF/WebP ≤ 150 Ko, + logo en SVG.
- Un seul CTA central ("JOUER", pill or, 56 px de haut), boutons secondaires (paramètres, crédits) en icônes 44 px en bas.
- Animation d'entrée : fade + translateY du logo, une fois. Pas de boucle.

### 3.2 Combat (`combat-arena`, `monster-zone`)
C'est l'écran où l'on passe 90% du temps — budget de rendu le plus strict.
- **Le monstre est le héros visuel** : sprite ≤ 512 px WebP, centré, fond de biome en 2 plans (image floutée *à l'export*, pas au runtime) avec parallaxe `transform` subtile.
- Barre de vie monstre : grosse, haute (10 px), chiffres tabulaires, flash blanc 80 ms au hit (opacity).
- Nombres de dégâts : pool d'éléments réutilisés (déjà amorcé via `_initPools`), animés en transform/opacity, **cap à 12 simultanés** ; au-delà, agrégation ("×8 hits — 12 450").
- HUD haut (or/gemmes/DPS) : une seule barre mince `--bg-1`, valeurs tabulaires, mise à jour throttlée à 5 Hz max (l'œil ne lit pas plus vite).
- Footer BB : portraits ronds 48 px, anneau de charge en `conic-gradient` (statique, mis à jour par pas), tap = burst. Supprimer les glows pulsants permanents des slots chargés → remplacer par un seul "shine" en transform qui traverse le portrait toutes les 4 s.
- `screen-flash`, vignette de danger : opacity uniquement, jamais de filtre.

### 3.3 Navigation (`tab-bar`, `tab-content`)
- Tab bar fixe en bas, 5 onglets max visibles (Héros, Invocation, Boutique, Quêtes, ⋯ Plus), icônes SVG + label 12 px, hauteur 56 px + safe-area. Les onglets excédentaires (Skills, Succès, Prestige, Réglages) passent dans "Plus" (sheet).
- Les `tab-panel` deviennent des **bottom sheets à 2 crans** (60% / plein écran), glissables, fermables au swipe-down — exploiter et généraliser `bottomsheet.css`.
- Transition entre onglets : crossfade 200 ms, pas de slide layout.

### 3.4 Panneau Héros (`heroes-grid`, `squad-grid`, `hero-modal`)
- Cartes héros : portrait 1:1 (96 px, WebP), cadre 2 px couleur de rareté (`--r-*`), nom 14 px, niveau en pill. Supprimer les fonds dégradés par carte.
- La grille devient **virtualisée** (rendu des seules cartes visibles) — indispensable quand le roster grandit.
- `hero-modal` → bottom sheet plein écran : grand portrait en haut, stats en 2 colonnes, boutons d'action (Acheter / Lvl+1 / +10 / MAX / Évoluer) en barre collée en bas, 48 px de haut chacun.
- Formation/squad : slots 64 px, drag & drop avec ghost en `transform`, halo de leader = bordure, pas de glow.

### 3.5 Invocation / Gacha (`panel-gacha`, `summon-overlay`)
- L'écran le plus "spectacle autorisé" : cérémonie courte (~1,2 s), skippable, cercle d'invocation en **un seul SVG animé en transform/rotate**, flash de rareté = fond plein coloré 150 ms.
- Révélation : carte qui flip (rotateY), bordure de rareté, **multi-pull en grille** avec stagger de 60 ms — pas 10 animations lourdes en série.
- Les vidéos/PNG lourds de cérémonie actuels sont remplacés par cette séquence vectorielle.

### 3.6 Boutique (`panel-shop`)
- Sections claires (Gemmes / Boosts / Pub récompensée), cartes produits uniformes, prix en pill or. Un seul badge "Meilleure offre" (accent), pas de clignotement.

### 3.7 Skills / Succès / Quêtes / Prestige
- Skill tree : rendu en SVG unique (lignes + nœuds), pan/zoom par transform ; nœuds achetables = bordure `--energy`, pas d'animation idle.
- Succès & quêtes : lignes de liste 56 px, progression en barre fine, bouton "Réclamer" à droite (48 px). `renderAchievements()` ne rebuild plus à chaque kill (cf. audit §1.7) : mise à jour ciblée par succès.
- Prestige : un écran-cérémonie dédié (fond `--arcane`, chiffres avant/après), le seul endroit où un dégradé violet est permis.

### 3.8 Réglages (`panel-settings`)
- Liste système : toggles natifs-like 48 px. Le toggle Performance reste, reformulé ("Économie de batterie").

### 3.9 Overlays événements (BB `bb-overlay`, boss victory, level-up)
- Tous au-dessus de la tab bar (corriger le z-index, cf. audit §1.5), tous skippables, tous < 1,5 s, fond plein (pas de blur), et tous **suspendent** le canvas ambient et la boucle de rendu des panneaux pendant leur durée.

---

## 4. PLAN FLUIDITÉ — OBJECTIF 60 FPS SUR MILIEU DE GAMME

### 4.1 Pipeline d'assets (le plus gros gain, à faire en premier)
1. Conversion de masse PNG/JPG → **WebP (+ AVIF si simple)** : héros 512 px max, vignettes 192 px, monstres 512 px, fonds 1080 px de large max. Cible : **99 Mo → < 15 Mo**, aucune image > 300 Ko.
2. Générer 2 tailles par image (`@1x`/`@2x`) + `srcset`, et `loading="lazy"` + `decoding="async"` partout hors écran de combat.
3. Précharger uniquement : fond du biome courant, monstre courant, portraits du squad.
4. Script outillable : `tools/optimize-assets.mjs` (sharp) — à ajouter.

### 4.2 Budget de rendu par écran (contrat à faire respecter en review)
- box-shadow : **≤ 1** par écran · backdrop-filter : **0** · animations infinies : **≤ 2** (et uniquement transform/opacity) · `transition: all` : **0** · couches composited simultanées : ≤ 8.

### 4.3 Canvas & boucles
- Ambient particles : cap `devicePixelRatio` à 2, **pause quand un sheet/overlay couvre l'écran** et via `visibilitychange`, 30 fps lui suffit (1 frame sur 2), passer COUNT 55 → 35.
- Une seule horloge (la boucle maître fixed-timestep existe déjà — y rattacher l'ambient au lieu de son rAF séparé).
- Particules de combat : pool pré-alloué (amorcé), cap dur 60 vivantes.

### 4.4 DOM
- Éradiquer les 66 `innerHTML` chauds : les remplacer par mise à jour de `textContent`/classes sur nœuds persistants (les compteurs or/DPS/HP notamment).
- Listes longues (héros, succès, boutique) : virtualisation simple (IntersectionObserver ou fenêtrage manuel).
- Les 69 styles inline du HTML migrent vers des classes tokenisées.

### 4.5 CSS & fonts
- Nouveau `css/` modulaire : `tokens.css`, `base.css`, `components.css`, `screens/combat.css`, `screens/menus.css`, `effects.css`. Suppression de `grimoire-noir.css` et du thème néon — **un seul thème**.
- 2 woff2 subsettés auto-hébergés (latin), `preload` + `font-display: swap`. Suppression de RPG-Awesome.

### 4.6 Critères d'acceptation (mesurables)
- 60 fps stables en combat sur un Android milieu de gamme (throttling CPU ×4 dans DevTools : pas de frame > 24 ms).
- First load < 3 s en 4G ; poids page initiale < 2,5 Mo.
- Aucun texte < 12 px ; aucune cible tactile < 44 px ; contraste AA partout.
- Lighthouse mobile Performance ≥ 85.

---

## 5. ROADMAP D'EXÉCUTION

| Phase | Contenu | Effort | Gain |
|---|---|---|---|
| **P1 — Fondations** | Pipeline assets (WebP), tokens.css, 2 polices, suppression backdrop-filters & `transition: all`, pause du canvas ambient | 1–2 j | Énorme (fluidité immédiate) |
| **P2 — Squelette UI** | Tab bar 5 onglets, généralisation bottom sheets, safe-areas, tailles tactiles/textes mini | 2–3 j | Structure |
| **P3 — Combat** | HUD, monstre, dégâts poolés/agrégés, footer BB, suppression glows permanents | 2–3 j | L'écran principal devient beau ET fluide |
| **P4 — Menus** | Héros (cartes + virtualisation + sheet), gacha (cérémonie SVG), boutique, quêtes/succès | 3–4 j | Cohérence totale |
| **P5 — Événements & polish** | Overlays BB/boss/prestige, micro-interactions, haptique, passe contraste/a11y | 1–2 j | Le "premium" |
| **P6 — Validation** | Mesures DevTools throttlées, Lighthouse, test 360×640 → 430×932, recette des budgets §4.2 | 1 j | Preuve |

Chaque phase est livrable indépendamment : le jeu reste jouable entre chaque.

---

## 6. ANNEXE — CE QU'ON SUPPRIME PUREMENT ET SIMPLEMENT

`grimoire-noir.css` + `grimoire-noir.js` + `grimoire-sheet.js` (le thème override), RPG-Awesome, Rajdhani/Nunito/Bebas Neue, `home_ui_clean.png` (7 Mo), tous les glows pulsants permanents, les 10 backdrop-filters, les dégradés multicolores de boutons, les emojis d'UI, les modales centrées desktop.

*Tout ce qui est listé ici est remplacé par un équivalent défini aux §2–3 — rien n'est retiré sans remplacement.*

---

## 7. RECETTE D'EXÉCUTION — RÉSULTATS (10/06/2026)

Les 6 phases ont été exécutées. Mesures finales contre les critères du §4.6 :

| Critère | Avant | Après | Verdict |
|---|---|---|---|
| Poids des assets | 99 Mo (26 images > 1 Mo, accueil 7 Mo) | **15 Mo** (accueil 252 Ko) | ✅ |
| Chemin critique au chargement | ~8 Mo+ | **0,76 Mo** (cible < 2,5 Mo) | ✅ |
| `backdrop-filter` | 10 + 2 en JS | **0** | ✅ |
| `transition: all` | 38 | **0** | ✅ |
| Textes < 10 px | 53 occurrences (6–9 px) | **0** | ✅ |
| Familles de polices | 5 | **2** (Cinzel + Outfit) | ✅ |
| Animations infinies permanentes en combat | ~8 (glows pulsants) | **1** (shine BB, transform pur) + idle du monstre (contenu) | ✅ |
| Nombres de dégâts simultanés | illimité | **cap 12 + agrégation** | ✅ |
| MAJ HUD / barre HP | par tap / 30 Hz | **5 Hz / 10 Hz** (chiffres tabulaires) | ✅ |
| Canvas ambient | 55 part. à 60 fps, jamais en pause | **35 part. à 30 fps, pause si couvert/caché** | ✅ |
| Overlays événements | BB ~2 s non skippable | **≤ 1,3 s, tous skippables au tap** | ✅ |
| Cibles tactiles | nombreuses < 44 px | **≥ 44 px** (actions héros 48 px) | ✅ |
| Tab bar mobile | 8 onglets, labels 7–9 px | **5 onglets + "Plus"**, labels 10 px | ✅ |
| Tests | — | smoke test 22/22 · modules 90 016/90 016 | ✅ |

**Restes à faire (hors périmètre exécuté)** : test visuel sur appareil réel (l'extension Chrome n'accède pas aux URL `file://` — ouvrir le jeu à la main), remplacement complet de l'iconographie (RPG-Awesome/emojis → SVG, §2.5), cérémonie gacha vectorielle complète (§3.5), suppression définitive du thème grimoire-noir au profit d'un thème unique Aurora Forge (§4.5), mesure Lighthouse/60 fps sur appareil.
