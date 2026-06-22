# Rapport de nettoyage — Brave Frontier Web

*Établi le 15 juin 2026 · état des lieux + plan d'action validé avec toi*

Tu as choisi : **(1)** rapport et plan d'abord, je n'exécute rien sans ta validation ; **(2)** on garde **une seule application** (pas de rechargement de page entre écrans) mais avec le code rangé ; **(3)** le combat tour par tour s'ouvrira **comme une page lancée depuis le hub**. Tout le plan ci-dessous respecte ces trois choix.

---

## 1. Résumé en une phrase

Ton projet **fonctionne**, mais il est lourd (≈ 200 Mo dont **101 Mo d'archives** et **99 Mo d'images**), il contient **des doublons** (`bc/`, `dist/`, doubles dossiers d'images), **25 fichiers `.DS_Store`** parasites, **des dossiers nommés avec un espace à la fin** (source de bugs), et **5 images cassées**. Le vrai « désordre » n'est pas tant l'`index.html` que le fichier `js/game.js` de **7885 lignes** qui fait tout. Rien de grave, tout est réparable proprement.

---

## 2. Ce que contient ton dossier aujourd'hui

| Dossier / fichier | Taille | Rôle | Verdict |
|---|---|---|---|
| `index.html` | 61 Ko (1065 lignes) | Le jeu (tous les écrans dans un seul fichier) | ✅ à garder, à mieux organiser |
| `js/game.js` | 416 Ko (**7885 lignes**) | Tout le moteur du jeu | ⚠️ monolithe à découper |
| `js/` (autres) | — | ui-shell, particules, menu démarrage | ✅ ok |
| `src/` | 184 Ko | Refonte du code en modules (data + core) | ⚠️ **partiellement utilisé** — voir §4 |
| `assets/` | **99 Mo** | Images, musiques, sons | ⚠️ à ranger |
| `css/` | 272 Ko | `tokens.css` + `styles.css` | ✅ ok |
| `combat-turn.html` + `combat-turn-engine.js` | 33 Ko | Combat tour par tour (prototype) | ⚠️ pas encore relié + 2 images cassées |
| `_archive/` | **101 Mo** | Vieilles sauvegardes + images originales | 🗑️ à sortir du projet |
| `dist/` | 7,4 Mo | Build automatique (Vite) | 🗑️ régénérable, à ignorer |
| `bc/index.html` | 60 Ko | Copie quasi identique de `index.html` | 🗑️ doublon à supprimer |
| 14 fichiers `.md` à la racine | — | Rapports, plans, audits | 📁 à regrouper dans `docs/` |
| `tools/` | — | Scripts de test/maintenance | ✅ ok |
| `25 × .DS_Store` | — | Fichiers cachés macOS | 🗑️ à supprimer + ignorer |

---

## 3. Les problèmes concrets (par ordre d'importance)

### 🔴 A. Cinq images cassées (références qui pointent vers du vide)

**Dans `combat-turn.html`** — les deux images du Final Burst d'Ignis :
- `assets/heroes/FINAL BURST/IGNIS FINAL BURST OFF.png` → **n'existe pas**
- `assets/heroes/FINAL BURST/IGNIS FINAL BURST ON.png` → **n'existe pas**

Les vrais fichiers sont rangés dans des sous-dossiers, avec un autre nom :
- `assets/heroes/FINAL BURST/OFF/IGNIS-3.png`
- `assets/heroes/FINAL BURST/ON/IGNIS-3.png`

→ Il faut corriger les chemins (ou renommer les fichiers de façon cohérente).

**Dans `css/styles.css`** — trois fonds de l'interface de combat :
- `assets/img combat /processed/battle_meter_frame.png` → manquant
- `assets/img combat /processed/battle_ui_24.png` → manquant (référencé 2× avec deux écritures différentes)

`battle_meter_frame.png` existe pourtant... mais dans `dist/assets/`, pas dans `assets/img combat /processed/`. À recopier au bon endroit.

### 🔴 B. Dossiers nommés avec un espace à la fin

Quatre dossiers se terminent par une espace invisible :
`assets/img combat `, `assets/visual hero `, `assets/visual hero /illusration `, `assets/test `

C'est une **bombe à retard** : selon le navigateur ou l'outil, l'espace est encodé `%20` ou ignoré, ce qui casse des chemins de façon imprévisible (c'est exactement la cause d'une des images cassées ci-dessus). À renommer sans espace : `img-combat`, `visual-hero`, `illustration`, `test`. (Note : « illusration » est aussi une faute de frappe.)

### 🟠 C. Doublons qui sèment la confusion

- **`bc/index.html`** : copie de `index.html` à **1 ligne de différence** près. Tu ne sais plus lequel est le vrai → risque de modifier le mauvais. À supprimer (après archivage).
- **`dist/`** (7,4 Mo) : ce n'est pas du code source, c'est le résultat automatique de `npm run build`. Il se régénère tout seul. Déjà dans `.gitignore`.
- **Images en double** : `assets/...` ET `_archive/assets_originals/...` contiennent les mêmes héros/monstres/biomes. Les originaux peuvent rester dans l'archive **hors projet**.

### 🟠 D. `_archive/` pèse 101 Mo dans ton dossier de travail

Vieux `index_OLD_backup.html`, `src.OLD.backup/`, et une copie complète des images originales. C'est utile à **garder**, mais **pas dans le dossier du jeu** : ça alourdit tout, ça brouille les recherches. À déplacer dans un dossier de sauvegarde séparé (ou un .zip).

### 🟡 E. 25 fichiers `.DS_Store`

Fichiers cachés créés par le Finder macOS, inutiles au jeu. À supprimer et à ajouter au `.gitignore`.

### 🟡 F. 14 rapports `.md` éparpillés à la racine

`AUDIT_...`, `PLAN_DIRECTEUR_...`, `MISSION1..4_VERIFICATION`, `RAPPORT_...`, etc. Ça noie les fichiers importants. À regrouper dans un dossier `docs/`.

---

## 4. Le vrai « découpage » : organiser le code, pas casser l'app

Tu voulais « séparer l'index en plusieurs fichiers ». Voici le point clé à comprendre :

> Ton `index.html` est **une seule application**. Les écrans (hub, combat, invocation, équipe, boutique…) ne sont pas des pages séparées : ils sont tous dans la page et c'est `js/game.js` qui les **montre/cache**. Ils partagent le **même état** (or, héros, sauvegarde). Si on coupait l'index en vrais fichiers `.html` indépendants, on **casserait** ce partage.

Donc, conformément à ton choix, on garde **un seul jeu fluide**, et on range **le code derrière**. Le vrai désordre est dans `js/game.js` (7885 lignes qui font tout).

**Bonne nouvelle :** tu as **déjà commencé** ce rangement ! Le dossier `src/` contient une version modulaire (`src/data/heroes.js`, `src/core/bignum.js`, `src/systems/combat.js`…). Une partie (`src/data` + `src/core`) est même **déjà utilisée** : elle est compilée dans `assets/globals.bundle.js`, que `game.js` consomme. Mais les modules d'écrans (`src/ui/screens/…`) ne sont **pas encore branchés**.

**Plan de rangement du code (sans rien casser) :**
1. Garder `index.html` comme **page unique** du jeu.
2. Continuer la migration **déjà entamée** : déplacer petit à petit les morceaux de `js/game.js` vers les modules `src/` correspondants (combat → `src/systems/combat.js`, gacha → `src/systems/gacha.js`, etc.).
3. Découper la **partie HTML** de l'index en « gabarits » (partials) clairs par écran, ré-assemblés au build — l'utilisateur ne voit toujours qu'une seule app.
4. Tester après **chaque** déplacement (les tests existent déjà dans `tests/`).

C'est un chantier progressif : on le fait par étapes, en vérifiant que le jeu tourne à chaque fois.

---

## 5. Combat tour par tour : le relier depuis le hub

État actuel : `combat-turn.html` + `combat-turn-engine.js` forment un **prototype autonome qui marche tout seul**, mais (a) il a 2 images cassées (§3.A) et (b) **rien ne le lance depuis le hub**. Il a déjà un bouton `HUB` pour revenir.

**Plan (selon ton choix « page ouverte depuis le hub ») :**
1. Corriger les 2 images de Final Burst.
2. Ajouter dans le hub un bouton « Combattre » qui **ouvre `combat-turn.html`** en passant les infos du combat (boss, étage, équipe) via l'URL ou le `localStorage`.
3. Au bout du combat, le bouton `HUB` (déjà présent) **renvoie à `index.html`** et applique les gains (or, XP).
4. Plus tard, si tu veux, on pourra fusionner les deux moteurs — mais ce n'est pas nécessaire pour que ça marche.

---

## 6. Structure cible proposée

```
brave-frontier-web/
├── index.html              ← le jeu (page unique)
├── combat-turn.html        ← combat, ouvert depuis le hub
├── combat-turn-engine.js
├── css/                    ← styles (inchangé)
├── js/                     ← scripts page (game.js allégé au fil du temps)
├── src/                    ← modules (cible de la migration du code)
├── assets/
│   ├── heroes/             ← noms cohérents, sans dossier en double
│   ├── monster/
│   ├── ui/
│   ├── img-combat/         ← (ex « img combat », sans espace)
│   ├── visual-hero/        ← (ex « visual hero »)
│   ├── music/
│   └── ...
├── docs/                   ← tous les .md (rapports, plans, audits)
├── tools/                  ← scripts (inchangé)
├── tests/                  ← inchangé
└── (hors projet) sauvegardes/  ← _archive déplacé ici
```

**Dossiers à créer :** `docs/`, `assets/img-combat/`, `assets/visual-hero/` (renommages).
**Dossiers à supprimer/sortir du projet :** `bc/`, `dist/` (régénérable), `_archive/` (à déplacer hors du dossier).

---

## 7. Plan d'exécution proposé (par phases, du plus sûr au plus impliquant)

**Phase 1 — Nettoyage sans risque** *(aucun impact sur le jeu)*
- Supprimer les 25 `.DS_Store` et les ajouter au `.gitignore`.
- Déplacer les 14 `.md` dans `docs/`.
- Supprimer `bc/` (après l'avoir mis dans la sauvegarde) et confirmer `dist/` ignoré.
- Déplacer `_archive/` hors du dossier de travail (ou le zipper).

**Phase 2 — Réparer les images** *(corrige des bugs visibles)*
- Corriger les 2 chemins de Final Burst dans `combat-turn.html`.
- Replacer les 3 fonds de combat manquants pour `styles.css`.
- Renommer les 4 dossiers à espace final et mettre à jour les chemins qui les utilisent.

**Phase 3 — Relier le combat au hub** *(nouvelle fonctionnalité)*
- Bouton « Combattre » dans le hub → ouvre `combat-turn.html` avec le contexte.
- Retour au hub + application des gains.

**Phase 4 — Ranger le code (progressif)** *(le gros morceau, par petites étapes testées)*
- Découper `js/game.js` vers les modules `src/`, en gardant une seule app.
- Découper le HTML de l'index en gabarits par écran.

Je te recommande de me laisser faire **les phases 1 et 2 d'abord** (sûres et rapides, gros gain de propreté), puis on enchaîne sur 3 et 4 quand tu es à l'aise.

---

## 8. Avant / après en chiffres

| | Avant | Après (estimé) |
|---|---|---|
| Poids du dossier de travail | ≈ 200 Mo | ≈ 95 Mo (sans `_archive` ni `dist`) |
| Fichiers `.DS_Store` | 25 | 0 |
| Images cassées | 5 | 0 |
| Dossiers à espace final | 4 | 0 |
| Doublons d'`index.html` | 2 (`index`, `bc`) | 1 |
| `.md` à la racine | 14 | 0 (rangés dans `docs/`) |
| Combat relié au hub | non | oui |

---

**Dis-moi simplement « go phase 1 » (ou les phases que tu veux), et je l'exécute.** Je te fais un point après chaque phase, et rien n'est supprimé sans qu'une copie existe d'abord dans la sauvegarde.
