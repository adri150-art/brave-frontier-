# 🜂 DIRECTION ARTISTIQUE — « GRIMOIRE NOIR »
### Refonte visuelle radicale de *Brave Frontier Clicker* · Web mobile (WebView/PWA)

> J'ai regardé ton jeu réel : un hybride idle-battler complet, mais habillé comme un gacha de 2013 — cadres or/marron, emojis en guise de monstres, boutons biseautés. La structure est là, la peau est datée. Voici la nouvelle peau. **Tout ce qui suit est réalisable en DOM/CSS + canvas, sans 3D, sans tuer le WebView.**

---

## 0. LE CONCEPT EN UNE PHRASE

**Un grimoire d'obsidienne qui brûle de l'intérieur.** Fond bleu-noir profond, héros peints en 2D avec rim light élémentaire (lignée *Hades* / *Legends of Runeterra*), UI en verre fumé taillée en diagonale (énergie *Persona 5*, lisibilité moderne), et une seule règle sacrée : **la lumière n'existe que là où il y a du gameplay.** Tout ce qui brille est cliquable, chargé, ou dangereux.

Références assumées : *Hades* (peinture + rim light), *Legends of Runeterra* (splash arts cadrés serré), *Persona 5* (UI diagonale vivante), *Slay the Spire: Downfall* mods UI sombres, et l'enluminure médiévale (encres métalliques sur vélin noir) pour les bordures et le summon.

---

## 1. LE STYLE GRAPHIQUE PRÉCIS

### 1.1 Héros & monstres : « peinture braisée » (painted dark fantasy)
- **Technique** : illustrations 2D peintes, coups de pinceau visibles, pas de cel-shading propre ni de pixel art. Formes massives, silhouettes lisibles à 80 px de haut.
- **La signature** : chaque personnage porte un **rim light de son élément** — un liseré lumineux qui détoure la silhouette (feu = orange brûlé, eau = cyan glacier, foudre = jaune électrique, terre = vert mousse, lumière = ivoire doré, ténèbres = violet ionisé). Sur fond obsidienne, c'est ce liseré qui fait la lecture instantanée de l'élément, plus besoin d'icônes partout.
- **Monstres** : remplacer les emojis par des **silhouettes peintes semi-dissoutes** — créatures dont le bas du corps s'effiloche en braises/fumée de leur élément. Avantage production : le bas dissous masque les pattes/détails coûteux à dessiner, et l'effilochage est animé en CSS/canvas par-dessus un PNG statique.
- **Format** : PNG/WebP détourés 512 px, 2 calques max (corps + braises). Idle animé par CSS (`transform: translateY` sinusoïdal + flammèches canvas), pas de spritesheet d'animation : budget tenu.

### 1.2 Décors de zone : parallaxe d'encre en 3 plans
- Chaque zone = **3 calques PNG larges** (ciel/lointain, milieu, premier plan en silhouette pure noire) qui défilent à vitesses différentes. Style : aplats sombres + une seule source de lumière colorée par zone (lune verte des marais, forge rougeoyante, aurore boréale…).
- Le premier plan est **toujours noir pur** : il cadre la scène comme un théâtre d'ombres et garantit le contraste des monstres quelle que soit la zone.

### 1.3 Matières de l'UI : obsidienne, verre fumé, or vivant
- **Panneaux** : verre fumé sombre (`rgba(19,24,41,.82)` + `backdrop-filter: blur(12px)`), bordure 1 px d'or terni `#8a6d3b` qui s'**embrase** (`#FFB23E`, lueur douce) quand l'élément est actif/abordable.
- **Fini les cadres marron biseautés.** L'or n'est plus une texture : c'est une **lumière**, réservée aux récompenses, au summon et aux jalons.
- **Coins coupés à 45°** (clip-path) sur les cartes et boutons : signature géométrique du jeu, zéro coût de rendu.

### 1.4 Typographie
- **Display (titres, zones, SUMMON)** : *Cinzel* — gravure romaine, autorité, fantasy sans kitsch.
- **UI & corps** : *Outfit* (ou Inter) — moderne, excellente à petite taille.
- **Chiffres de dégâts** : *Bebas Neue* condensée, italique 8°, toujours en couleur d'élément avec contour noir 2 px. Les crits sont 1,8× plus gros, en or, avec éclat.

---

## 2. PALETTE & AMBIANCE

**Ambiance cible : « la veillée d'armes ».** Sombre, calme, précieux — puis des explosions de couleur élémentaire au combat. Le jeu doit donner envie d'être joué dans le noir.

| Rôle | Code | Usage |
|---|---|---|
| Obsidienne (fond) | `#0B0E1A` | fond global, jamais de noir pur |
| Surface | `#131829` | panneaux, cartes |
| Surface haute | `#1C2338` | éléments survolés/actifs |
| Ivoire (texte) | `#F2EDE3` | texte principal |
| Texte secondaire | `#8B93AC` | labels, méta |
| **Or braise** | `#FFB23E` → cœur `#FF6B1A` | récompenses, crits, summon, CTA |
| Feu | `#FF4D29` | rim light + dégâts feu |
| Eau | `#38C8FF` | idem eau |
| Foudre | `#FFD93D` | idem foudre |
| Terre | `#3FBF6B` | idem terre |
| Lumière | `#FFE08A` | idem lumière |
| Ténèbres | `#B14CFF` | idem ténèbres |
| Danger | `#FF3B5C` | HP bas, boss enrage |
| Succès | `#3DFFA8` | quêtes validées, level up |

**Règle des 90/10** : 90 % de l'écran vit entre `#0B0E1A` et `#1C2338` + ivoire. Les couleurs saturées n'occupent jamais plus de 10 % de la surface — c'est ce ratio qui rend chaque flash de couleur jouissif.

---

## 3. UI & ERGONOMIE

### 3.1 Architecture : « tout sous le pouce »
- **L'écran de combat est sacré** : zone monstre = 55 % haut de l'écran, intouchée par l'UI. Tout le reste vit dans une **bottom sheet** à 3 crans (réduite / mi-hauteur / pleine), glissable au pouce. Plus aucun panneau latéral.
- **Nav bar** : 5 onglets en verre fumé, icônes au trait (pas d'emojis), l'onglet actif s'embrase en or et son icône passe en version pleine. Badge braise animé sur les notifications.

### 3.2 Le combat
- **Barre de HP du boss** : segmentée en 10 crans (lisibilité du progrès), remplissage braise qui **se fissure** segment par segment. Nom de zone en Cinzel au-dessus, fin, espacé.
- **Barre BB** : 4 portraits ronds en bas, chacun cerclé d'un **anneau de charge** de sa couleur d'élément. Anneau plein = il **pulse** et émet des particules : impossible de rater un BB prêt. Le chaining trace un **fil de lumière** d'un portrait à l'autre.
- **Spark timing** : la fenêtre de spark est matérialisée par un **anneau qui se contracte** sur le monstre (langage universel des rhythm games). Spark réussi = flash blanc 2 frames + « SPARK! » en Bebas or.

### 3.3 Menus
- **Héros** : cartes verticales coins coupés, splash art cadré buste, rareté = matière de la bordure (3★ acier, 4★ argent, 5★ or, 6★ **or animé** avec reflet qui balaye). Stats en colonne droite, jamais par-dessus l'art.
- **Summon** : l'écran-cathédrale. Portail d'encre noire qui s'ouvre, **la couleur de la fissure spoile la rareté** (bleu → violet → or → or + rayons god-rays pour le 6★). Skippable au tap, toujours.
- **Transitions** : balayage d'encre noire diagonal (400 ms, `clip-path` animé) entre les écrans. Pas de fondu mou.

### 3.4 Accessibilité & confort
- Contraste AA minimum sur tout texte ; toggle « réduire les effets » (coupe shake/flash) ; zones tactiles 48 px ; les éléments sont doublés d'une icône-forme (pas que la couleur).

---

## 4. LE « JUICE »

Hiérarchie stricte — chaque niveau d'impact a son vocabulaire, jamais mélangés :

| Événement | Effets |
|---|---|
| **Tap** | micro-scale du monstre (0.96, 80 ms), étincelle d'élément au point d'impact, chiffre qui jaillit en arc |
| **Crit** | hit-stop 60 ms (gel volontaire), chiffre or 1,8×, onde de choc circulaire, 8 braises éjectées |
| **Spark** | flash blanc 2 frames, anneau d'onde, shake 4 px, son sec |
| **Kill** | le monstre **se dissout en braises** aspirées vers le compteur d'or (l'or « vole » vers le HUD — le gain est physique), pop du loot |
| **BB** | letterbox cinéma (bandes noires 8 %), zoom caméra 1.08, fond assombri à 60 %, slash peint plein écran de la couleur du héros |
| **UBB / boss kill** | aberration chromatique 200 ms, double shake, pluie de braises plein écran, ralenti 0.5× pendant 300 ms |
| **Ambiance permanente** | 12–20 braises/particules de zone qui dérivent (canvas, pooling), vignette douce, pulsation lente des sources de lumière du décor |

**Budget perf (non négociable)** : un seul canvas de particules avec object pooling (200 particules max), effets de caméra = transform CSS sur un conteneur unique (composited), zéro `box-shadow` animé — les lueurs sont des PNG additifs pré-rendus. Tout le juice respecte `prefers-reduced-motion`.

---

## 5. PROMPTS PRÊTS À GÉNÉRER (image gen / commande artiste)

1. **Héros feu (test de style)** : *« painted dark fantasy hero portrait, fire knight, visible brushstrokes, dramatic orange rim light on obsidian black background, embers, bust crop, Hades game art style meets Legends of Runeterra splash, no outline, 512px »*
2. **Monstre dissous** : *« dark fantasy creature silhouette, lower body dissolving into cyan embers and smoke, painted style, glowing cyan rim light, obsidian background, menacing idle pose »*
3. **Décor 3 plans** : *« layered parallax background, swamp at night, single green moon light source, flat dark painted shapes, pure black foreground silhouettes of twisted trees, theatrical lighting »*
4. **Écran summon** : *« black ink portal cracking open with molten gold light, god rays, medieval illuminated manuscript ornaments in burnished gold around the frame, dark cathedral atmosphere »*

---

## 6. ORDRE D'APPLICATION (impact/effort)

1. **Palette + typo + panneaux verre** (pur CSS, 1 jour) → 60 % de la claque immédiatement.
2. **Bottom sheet + nav embrasée** (tu as déjà `bottomsheet.css` : le finir).
3. **Remplacer les emojis monstres** par 10 silhouettes peintes (1 par thème de zone).
4. **Juice combat** (hit-stop, dissolution, or qui vole) — sur le canvas de particules existant.
5. **Anneaux BB + spark ring** — le crochet gameplay mérite le meilleur habillage.
6. **Écran summon cathédrale** en dernier : c'est la cerise, pas le gâteau.

*— Ton DA. Carte blanche utilisée.*
