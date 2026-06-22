# Bestiaire & 6 Maps — équilibrage ancré sur Ignis

## Ce qui a été livré

| Fichier | Rôle |
|---|---|
| `src/data/bestiary.js` | **Bestiaire complet** : 6 maps × 5 zones × 5 stages = **150 stages, 630 monstres** (480 communs, 120 mini-boss, 30 boss). Stats calculées et équilibrées. |
| `src/data/stats-system.js` | Ajout du palier **7★** (`RARITY_TUNING[7]` : cap 150, statMult 12.5). |
| `src/data/balance.js` | Constantes d'évolution étendues au **6★→7★** (caps, coûts, gates, matériaux, points de maître). |
| `js/game/09_tabs_stages.js` | `MAP_DEFS` passe de **1 à 6 maps** (noms, zones, éléments, lore, tier). |
| `tools/bestiary-balance.mjs` | Outil de **preuve d'équilibrage** (héros « classe Ignis » vs monstres). |
| `docs/bestiary.json` | Export lisible de tout le bestiaire. |

## Structure du monde

Chaque map = 5 zones. Chaque zone = 5 stages.
**Stages 1 à 4** : vague de communs **+ un mini-boss** à la fin.
**Stage 5** : vague de communs **+ le boss de zone** à la fin.
La zone 5 de chaque map porte un **boss-signature unique** (le climax de la map).

## Paliers de puissance

| Map | Nom | Héros recommandés |
|---|---|---|
| 1 | Mistral | 3★ |
| 2 | Sylvania | 3★ |
| 3 | Glaciarem | 4★ |
| 4 | Vulcanor | 5★ |
| 5 | Aetheria | 6★ |
| 6 | Abyssia | 7★ |

## Comment l'équilibrage fonctionne

Tout est ancré sur un **héros de référence « classe Ignis »** (mage Breaker, budget 100)
**maximisé** au cap de son palier. Les stats des monstres sont dérivées en **ratio** de
ce héros (`ENCOUNTER_RATIOS` dans `bestiary.js`) :

- **commun** : PV = 1,8 × ATK_héros — meurt en quelques coups ;
- **mini-boss** : PV = 9 × ATK_héros — effort réel ;
- **boss** : PV = 18 × ATK_héros — combat marquant.

À l'intérieur d'une map, la puissance monte doucement (+15 %/zone, +5 %/stage). Les maps
1 et 2 partagent le palier 3★ : la Map 2 est durcie (×1,5) pour faire le pont vers la Map 3.

**Pour tout rééquilibrer**, il suffit de toucher `ENCOUNTER_RATIOS`, `MAP_WITHIN_TIER_MULT`,
`ZONE_RAMP` ou `STAGE_RAMP` — un seul endroit. Puis relancer :

```
node tools/bestiary-balance.mjs
```

L'outil vérifie que les coups-pour-tuer et la marge de survie restent dans la bande équitable
(« ni trop fort, ni trop faible ») sur les 6 maps, et imprime la courbe de puissance.

## Reste à brancher (côté moteur — à faire délibérément)

Le **contenu** (maps, zones, monstres, stats) est prêt. Deux branchements moteur restent,
volontairement séparés pour ne pas risquer ta sauvegarde / ton combat actuels :

1. **Navigation multi-maps dans la carte.** `renderQuestMap()` et les fonctions de
   progression de `09_tabs_stages.js` utilisent encore `MAP_DEFS[0]` et une clé de stage
   `"${area}-${stage}"` (sans index de map). Pour exposer les 6 maps :
   - introduire `G.currentMap` (défaut 0) ;
   - préfixer la clé : `stageKey(m, a, s)` → `"${m}-${a}-${s}"` en gardant `"0-..."`
     pour la Map 1 (compat des sauvegardes existantes) ;
   - itérer `MAP_DEFS` au lieu de `MAP_DEFS[0]`.

2. **Combat lit le bestiaire.** Le combat actuel calcule les PV/ATT via la courbe
   exponentielle `getMonsterMaxHp()` / `getMonsterAttack()` (par `G.zone`). Pour utiliser
   les stats équilibrées du bestiaire, brancher dans `spawnMonster()` :
   ```js
   const cs = Bestiary.stageCombatStats(G.currentMap, area, stage);
   // cs.commonHp / cs.commonAtk … et cs.leaderHp / cs.leaderAtk pour le mini-boss/boss
   ```
   `Bestiary.getStage(map, zone, stage)` renvoie aussi les **noms** des monstres pour l'UI.

Tant que ce n'est pas branché, la Map 1 continue de fonctionner exactement comme avant.
