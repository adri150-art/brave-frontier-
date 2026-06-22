# ✅ Mission 3 — Rapport de vérification (systèmes RPG de rupture)

**Date :** 2026-06-09 · **Fichier :** `index.html`

## Constat
Comme M1/M2, **Mission 3 est déjà implémentée** dans le monolithe, et **bien conçue** — proche du plan : loot procédural à affixes, arbre de compétences + Paragon, prestige multi-couches (Ascension), Spark/BB chaining, et la courbe « Éveil » qui remplace l'escalier ×20. **Tous les bonus sont CONSOMMÉS** dans le calcul (pas de système mort) : `getSquadStats` (6299-6314) et `useBB` (9304-9310), drop dans `killMonster`.

## 🐞 Bug trouvé & corrigé — l'équipement n'avait AUCUN effet
`getHeroStats` applique l'équipement via `hData._id` — mais **`_id` n'était posé nulle part** sur les objets héros. Résultat : tout le système de **loot procédural (la pièce maîtresse anti-monotonie de M3) était mort** — les items droppaient et s'équipaient, mais ne donnaient **aucune stat**.

**Correctif (3 points, sûrs) :**
- `_computeTotalDPS` : `h._id = id` avant `getHeroDPS` (chemin DPS).
- `_computeSquadStats` : `h._id = id` avant `getHeroStats` (chemin HP/DEF).
- `_applyLoadedData` : tampon `_id` sur tous les héros au chargement (couvre tous les autres appels + persiste).

**Preuve :** DPS `2.9e3 → 3.2e3` (nœud de skill) `→ 4.5e3` (arme +30 % / +5 upgrade ⇒ +37,5 % appliqués). Avant le fix : `3.2e3 → 3.2e3` (aucun effet).

## Tests exécutés (jsdom, fonctions réelles in-game) — 22/22, 0 erreur
| Système | Vérifié |
|---|---|
| ① Loot | 5000 items : **affixes toujours ∈ [min,max]**, nb affixes ≤ maxAffixes, distribution rareté plausible ; `getItemStats` × upgrade (+10 ⇒ ×1,5) |
| ② Arbre de compétences | gate (SP insuffisants / prérequis), unlock déduit le coût, agrégation des bonus (0,25), respec rembourse exactement + coûte 10 gemmes |
| ③ Ascension (couche 2) | gate (5 prestiges + 50 cristaux), effets (essence + reset cristaux + +1 slot squad), bonus +5 % DPS/ascension |
| ④ Paragon (couche 3) | coût croissant (×1,15/niv), achat déduit l'essence, bonus +1 %/niveau, gate (1 ascension requise) |
| ⑤ Spark / BB tiers | `getBBTier` 3★→BB / 5★→SBB / 6★→UBB ; 2 BBs dans la fenêtre → ×2,0 ; expiry → ×1,0 |
| ⑥ Intégration | un nœud de skill **et** une pièce d'équipement font **monter le DPS** (preuve de bout en bout) |

## Limitations mineures notées (non bloquantes)
- `rerollItemAffix` peut tirer un affixe dupliquant un autre affixe déjà présent sur l'item (le pool n'exclut que celui remplacé). Cosmétique.
- `_id` est désormais sérialisé dans la sauvegarde (octet négligeable, sans effet).

## Verdict
**Mission 3 fonctionnelle et vérifiée**, avec un **bug majeur corrigé** (l'équipement était sans effet). Le système de loot — moteur principal de rétention par le theory-crafting — fonctionne maintenant réellement.
