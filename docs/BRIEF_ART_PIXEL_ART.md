# 🎨 Brief de direction artistique — PIXEL-ART HD
### Final Frontier · cohérence visuelle des assets (monstres, héros, décors)

> **But :** un seul langage graphique pour tout le jeu. On garde tes **décors pixel-art existants** (carte du monde, biomes) comme référence, et on **regénère les monstres et les portraits de héros** dans le même style pour effacer le choc anime/peinture/pixel actuel.
>
> Tu as ton propre générateur d'images : ce doc te donne les **règles communes**, un **squelette de prompt** réutilisable, et des **prompts complets prêts à coller** pour tes assets actuels.

---

## 1. Pourquoi pixel-art (et pas peint / anime)

| Style | Ce qu'on garde | Ce qu'on refait | Coût |
|---|---|---|---|
| **Pixel-art HD ✅** | Toute la carte + les biomes (ton meilleur art, le plus nombreux) | Monstres + portraits héros | **Faible** |
| Peint (Hades) | Le monstre actuel | **Toute la carte** + portraits | Élevé |
| Anime gacha | Les portraits | **Toute la carte** + monstres | Élevé |

Pixel-art = on capitalise sur l'existant le plus fort, c'est léger sur mobile, et c'est le standard du genre idle/RPG.

---

## 2. Règles communes (NON négociables — c'est ce qui crée la cohérence)

Tout asset doit respecter ces 8 règles, sinon il « jure » avec les autres :

1. **Technique** : pixel-art HD, *clean cluster pixels* (pas de dithering sale), résolution interne ~**128–192 px** puis upscale net ×3–4 (nearest-neighbor). Pas d'anti-aliasing flou.
2. **Outline** : contour sombre **sélectif** (selout) — foncé côté ombre, absent ou coloré côté lumière. Jamais un contour noir uniforme façon sticker.
3. **Lumière** : source **unique en haut**. Chaque perso porte un **rim light de son élément** (liseré lumineux sur la silhouette) :
   - Feu `#FF4D29` · Eau `#38C8FF` · Foudre `#FFD93D` · Terre `#3FBF6B` · Lumière `#FFE08A` · Ténèbres `#B14CFF`
4. **Palette** : sombre et froide en base (fonds `#0B0E14 → #1C2333`), couleurs saturées **réservées** aux persos/effets (règle 90/10). Ivoire pour les hautes lumières `#F2EDE3`.
5. **Lisibilité de silhouette** : le perso doit être reconnaissable en ombre chinoise à 64 px. Formes massives, peu de détails parasites.
6. **Fond** : **transparent** pour persos/monstres (PNG alpha). Décors = scènes complètes.
7. **Cadrage** : monstres et héros **plein cadre, ancrés en bas** (les pieds touchent le bord bas), pour qu'ils « posent » sur le sol en jeu.
8. **Pas de texte, pas d'UI, pas de cadre** dans l'image — l'interface est gérée par le code.

**Astuce cohérence (clé) :** garde un **suffixe de style identique** à la fin de CHAQUE prompt (le bloc en `★` plus bas) et, si ton outil le permet, **réutilise le même seed / la même "style reference"** d'un asset à l'autre.

---

## 3. Le squelette de prompt réutilisable

```
[SUJET], [POSE/ACTION], [ÉLÉMENT + rim light de couleur], 
full body, centered, feet at bottom edge, transparent background,
★ STYLE SUFFIX (à coller tel quel à chaque fois) ★
```

### ★ STYLE SUFFIX (copie-colle identique partout) ★
```
high-resolution pixel art, clean clustered pixels, selective dark outline,
single top light source, dark cool fantasy palette with one saturated accent,
16-bit JRPG boss style, crisp nearest-neighbor edges, no dithering noise,
no text, no UI, no frame, no watermark, transparent background
```

### Negative prompt (anti-incohérence)
```
blurry, anti-aliased, smooth gradients, 3d render, photorealistic, painterly,
anime cel shading, soft airbrush, jpeg artifacts, drop shadow, white background,
extra limbs, text, logo, watermark, UI elements
```

---

## 4. Specs techniques (pour matcher le code actuel)

| Asset | Dimensions à générer | Sortie finale | Poids cible |
|---|---|---|---|
| Portrait héros | 512×512 (carré, alpha) | **WebP 256–512 px** | < 60 Ko |
| Monstre / boss | 768×768 (alpha, ancré bas) | **WebP ~512 px** | < 120 Ko |
| Décor de biome (combat) | 1024×1024 ou 1080×1350 | **WebP** | < 200 Ko |

**Format :** exporte en `.webp` (qualité ~82). **Transparence obligatoire** pour héros/monstres.

**Nommage = chemins déjà câblés dans le jeu** (remplace simplement les fichiers) :
- Héros : `assets/heroes/Squad img/IGNIS-3.webp`, `SELENA-3.webp`, `SERA-3.webp`, `bc/Lance-trois-etoile.webp`
- Boss : `assets/img-combat/boss ogre.webp`
- Biome combat : `assets/Biome/<zone>.webp`

> ⚠️ Je viens de créer des versions étalonnées `*_g.webp` que le combat utilise actuellement. Quand tu auras tes nouveaux assets pixel-art, on repointera le code vers eux (ou on réutilise les mêmes noms) — dis-le-moi, je m'en occupe.

---

## 5. Prompts complets, prêts à coller (tes assets actuels)

### 🔥 Héros — IGNIS (Feu)
```
Young male fire warrior with spiky orange hair, confident battle stance,
burning ember rim light in #FF4D29 outlining his silhouette,
full body, centered, feet at bottom edge, transparent background,
high-resolution pixel art, clean clustered pixels, selective dark outline,
single top light source, dark cool fantasy palette with one saturated accent,
16-bit JRPG boss style, crisp nearest-neighbor edges, no dithering noise,
no text, no UI, no frame, no watermark, transparent background
```

### 💧 Héros — SELENA (Eau)
```
Female water mage with flowing blue hair, calm graceful pose, holding a water orb,
glacier-cyan rim light in #38C8FF outlining her silhouette,
full body, centered, feet at bottom edge, transparent background,
[★ STYLE SUFFIX ★]
```

### 🌿 Héros — LANCE (Terre)
```
Armored earth knight with a heavy spear, grounded heroic stance,
moss-green rim light in #3FBF6B outlining his silhouette,
full body, centered, feet at bottom edge, transparent background,
[★ STYLE SUFFIX ★]
```

### ✨ Héros — SERA (Lumière)
```
Female light cleric with golden hair and radiant robes, serene uplifting pose,
ivory-gold rim light in #FFE08A outlining her silhouette,
full body, centered, feet at bottom edge, transparent background,
[★ STYLE SUFFIX ★]
```

### 👹 Boss — OGRE (Feu)
```
Massive red-skinned fire ogre boss with horns and battle scars, menacing,
arms slightly raised, lower body fading into ember smoke,
burning rim light in #FF4D29, full body, centered, feet at bottom edge,
transparent background,
[★ STYLE SUFFIX ★]
```

### 🌋 Décor — Cavernes d'Agni (biome Feu)
```
Side-scroller fantasy battle background, volcanic cavern with lava rivers and
basalt rock formations, glowing orange light, deep dark foreground silhouette
framing the scene, atmospheric depth in 3 layers,
high-resolution pixel art, clean clustered pixels, dark cool palette with
saturated fire-orange accents, 16-bit JRPG environment, no characters,
no text, no UI, no watermark
```

> Pour les autres biomes (Forêt aux Champignons, Lac Luminescent, Temple de la Jungle…), reprends le même prompt en changeant juste le **décor** et la **couleur d'accent** (vert mousse, cyan, etc.).

---

## 6. Méthode pour garder TOUS les héros cohérents (futur roster)

1. Génère **un héros de référence** qui te plaît, note son **seed** / sauve-le en **style reference**.
2. Pour chaque nouveau héros : même squelette de prompt, même suffixe `★`, même seed/ref, tu changes seulement **sujet + élément + couleur de rim light**.
3. Vérifie à la fin que tous tiennent côte à côte à 64 px (test de silhouette).

---

## 7. Quand tu as tes assets

Dépose-les dans les dossiers ci-dessus (mêmes noms = zéro code à toucher), ou envoie-les moi : je repointe les chemins, je régénère les `.webp` optimisés et je revérifie le rendu en live dans le navigateur. On pourra alors enchaîner sur le **cadrage** et le **« jus »** (animations) sur une base enfin cohérente.
