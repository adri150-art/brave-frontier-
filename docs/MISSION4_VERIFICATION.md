# 🎨 Mission 4 — Direction visuelle & UI mobile : état + plan

**Date :** 2026-06-09 · **Nature :** M4 est **majoritairement visuelle** → l'essentiel (rendu, ressenti « une main », génération d'assets) se valide **dans le navigateur + via Gemini**, pas en headless. Je vérifie ici ce qui est vérifiable sans navigateur et je liste précisément le reste.

## ✅ Vérifié sans navigateur
| Élément | État | Preuve |
|---|---|---|
| **Mode Performance (§3.4)** | ✅ fait & vérifié | CSS `perf-low` (coupe particules/shake/flash/blur/transitions) + badge + **auto-détection FPS** (médiane > 33 ms → proposition). jsdom 5/5 : toggle ajoute/retire `body.perf-low` + persiste `localStorage bf_perf_mode`. |
| **Responsive** | ⚠️ partiel | 12 media queries (380/768/992/1023/1024 + `prefers-reduced-motion`). Layout par **drawers** présent. |
| **Audit assets (Android)** | ✅ 0 casse de casse | 43 réfs `assets/`/`music/` : **aucune incohérence de casse/nom** → pas de rupture sur WebView Android (sensible à la casse). |
| **Audit assets (manquants)** | ⚠️ 4 BGM absents | `music/{home,combat,boss,map}.mp3` référencés par `BGMManagerClass` mais **absents** (`music/` ne contient que `.DS_Store`). BGM silencieux (muet par défaut → pas de crash). |

## ⏳ Reste à faire (navigateur + Gemini — ton terrain)
1. **Kit visuel Gemini** (le gros du morceau) : **69 icônes-font `<i class="ra/fa">`** + émojis encore en place. À remplacer par le kit cohérent (monnaies, onglets, éléments, raretés) — **prompts prêts dans `PLAN_DIRECTEUR_Brave_Frontier.md` §3.3**.
2. **Refonte layout mobile** : passer des drawers au **bottom-nav 5 onglets + bottom-sheets**, et **supprimer le déménagement de DOM** de `initResponsiveLayout` (CSS Grid/Flex piloté par media queries). Wireframe dans le plan §3.4.
3. **Fonds de biomes 9:16** : les 6 biomes existent en paysage ; générer les variantes **portrait mobile** (prompts §3.3 A).
4. **Accessibilité** : **0 `tabindex`/`role`/`aria`** actuellement. Rendre les cartes/divs cliquables focusables (`role="button"` + `tabindex="0"`), cibles ≥ 48 dp. (Audit `§4.2`.)
5. **BGM** : ajouter tes pistes **Suno** sous les noms exacts : `music/home.mp3`, `music/combat.mp3`, `music/boss.mp3`, `music/map.mp3`.

## Pourquoi je ne « code » pas M4 à l'aveugle
Le rendu visuel, l'ergonomie une main et l'intégration d'assets se jugent à l'œil, dans un vrai navigateur/téléphone. Modifier le CSS/layout ou l'a11y sans pouvoir les voir reviendrait à deviner — exactement ce qu'on s'est interdit. Je peux **préparer** des éditions précises (ex. patch a11y, squelette bottom-sheet) « prêtes à tester » si tu veux, sur le modèle du câblage M2.

## Verdict
**Partie logique de M4 (Mode Performance) : faite & vérifiée.** Le reste est de la production visuelle (Gemini) + intégration UI à valider au navigateur, avec une feuille de route et des prompts déjà fournis. Bonne nouvelle pour le portage : **aucun problème de casse d'asset** détecté.
