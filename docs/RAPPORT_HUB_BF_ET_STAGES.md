# Rapport — Hub façon Brave Frontier & Passage en Stages

> **Statut : à valider avant implémentation.**
> Référence visuelle : screenshot du hub de Brave Frontier original (fourni le 11/06/2026).
> Vision : un *Brave Frontier Clicker* — hub central fidèle à BF, combat clicker en vue **Dragon Quest** (ennemi en grand plein écran, première personne), et une progression par **stages séparés** au lieu des zones infinies actuelles.

---

## 1. La vision en une phrase

Quand on lance le jeu (Continuer / Nouvelle Partie), on arrive sur **le hub**, exactement comme dans Brave Frontier. Le combat n'est plus l'écran de base : c'est une **destination** qu'on lance depuis le hub en choisissant un stage, qu'on termine, et dont on revient avec du butin. Le hub devient le cœur du jeu ; l'arène devient une "mission".

C'est un renversement par rapport à l'architecture actuelle où `#combat-arena` est l'écran racine et tout le reste vit dans des tiroirs. **Le hub actuel (Portail d'Elgaia, overlay) sera remplacé** par ce nouveau hub plein écran qui est l'écran racine permanent.

---

## 2. Le Hub — décomposition du screenshot et mapping

Chaque bloc du screenshot BF, de haut en bas, et ce qu'il devient chez nous :

### 2.1 Bandeau supérieur (header doré)

| Élément BF | Notre équivalent | Source de données |
|---|---|---|
| Pseudo (`bagusboy`) | Pseudo du joueur (nouveau : saisi à la 1re partie, modifiable dans Paramètres) | `G.playerName` (nouveau) |
| `Lv 92` + barre EXP | **Rang d'Invocateur** : nouveau niveau de compte. L'EXP est gagnée en terminant des stages | `G.summonerLevel`, `G.summonerExp` (nouveaux) |
| `RC 1` | Compteur de Prestige (déjà existant) | `G.totalPrestiges` |
| `Energy 78/87` | **Non retenu pour l'instant** (choix validé : stages rejouables librement, pas de barrière d'énergie). L'emplacement affichera les charges de la Ville à la place | `G.townNodes` |
| Logo central "BRAVE FRONTIER" | Logo du jeu (asset à fournir, placeholder Cinzel doré en attendant) | — |
| 3 devises à droite (gemmes / or / orbes) | Gemmes 💎, Or 🪙, Points d'Honneur ⚔ — disposition identique en 3 lignes | `G.gems`, `G.gold`, `G.honorPoints` |
| `ARENA ●●●` | Badge Colisée (grisé "Bientôt") | — |

### 2.2 Bande de portraits de la squad

La rangée de héros verticaux avec le badge **LEADER** et l'orbe élémentaire en bas de chaque portrait. On a déjà tout : les assets `assets/heroes/Squad img/*.png` et le mapping `SQUAD_IMGS` / `HERO_ELEM` / `ELEM_GLOW` utilisés par le start-menu. Taper un portrait ouvre la fiche du héros (modal existant `hero-modal`). Slots vides = silhouette "+" qui ouvre la Caserne. 4 slots (5 si le slot prestige est débloqué), comme `G.squad`.

### 2.3 Rangée de menus (sous la squad)

Petits boutons icônes : MENU (paramètres), La Ville, Skills/Sphères, puis à droite EXCHANGE (Boutique), INFO (nouveautés — optionnel), et le livre avec pastille **!** (Succès & Quêtes avec badge si récompense réclamable).

### 2.4 Zone centrale — le carrousel "Vortex Gate"

Grande bannière centrale défilante (les points • • • du screenshot) :

1. **Quête Principale** — reprend le dernier stage en cours / prochain stage à débloquer ("Cavernes d'Agni 1-7 ▶")
2. **La Ville** — récolte de composants (avec badge ⚡ charges disponibles)
3. **Boss Hebdomadaire** — accès direct (système existant)
4. **Bannière d'invocation** — comme le "HEROES SELECTOR SUMMON" du screenshot, mène au gacha

Deux portails latéraux semi-visibles comme dans BF : **ARENA** à gauche (Colisée, grisé "Bientôt") et **QUEST** à droite (ouvre la sélection de stages).

### 2.5 Barre d'icônes du bas (6 boutons)

Fidèle au screenshot, avec pastilles de notification rouges :

| BF | Nous | Pastille rouge si… |
|---|---|---|
| Home | Hub (cet écran) | — |
| Unit | Caserne (Unités) | héros évoluable / lootBag non vide |
| Town | La Ville | charges de récolte disponibles (ex : ④) |
| Shop | Boutique | offre starter non utilisée |
| Summon | Invocations | invocation gratuite (pub) dispo |
| Social | Succès & Quêtes | quête/succès réclamable |

Cette barre **remplace la tab-bar actuelle sur l'écran hub**. En combat, on garde le bouton 🏠 (déjà implémenté) pour revenir au hub.

### 2.6 Visuel

En attendant les images définitives (l'utilisateur les fournira) : fond sombre bleu-acier texturé comme le screenshot, cadres dorés en dégradé HSL + bordures `--gold`, boutons du bas en cartouches dorés arrondis, pastilles rouges, glassmorphism léger. Tous les éléments en placeholders CSS remplaçables par des assets image plus tard (chaque bloc aura une classe `--skin` pour brancher les images sans toucher la structure).

---

## 3. Le système de Stages (choix validé : liste de stages par zone)

### 3.1 Structure (validée le 11/06 avec la map fournie)

Référence : `assets/map/map 1 .png` (768×1376, pixel-art) — une carte verticale type BF/Mistral avec des lieux cliquables, parcourue de bas en haut. Structure à 3 niveaux :

```
CARTE (ex: Map 1)
 └── ZONES cliquables sur la carte (~5 lieux visibles sur map 1 :
      Canyon Ardent → Forêt aux Champignons & Lac Lumineux → Temple de la Jungle
      → Château Sombre / Volcan → Citadelle de Cristal flottante)
      └── 5 STAGES par zone (1-1 … 1-5), séparés, lancés individuellement
           └── 5 MONSTRES par stage
           └── BOSS à la fin du 5e stage de la zone (stage X-5)
```

Présentation comme dans BF : la carte plein écran, des points "TOUCH" avec bannière du nom de la zone, "NEW AREA" clignotant sur la prochaine zone à débloquer, bouton Back vers le hub.

**Équivalence d'équilibrage** : chaque stage = 1 zone actuelle avec 5 monstres au lieu de 10. Stage global g = (zone-1)×5 + stage → formules existantes (`getMonsterMaxHp`, or `10 × 1.21^(g-1)`, gates d'évolution) inchangées. Map 1 couvre les zones équivalentes 1–25 ; les maps suivantes continueront la progression (zones éq. 26–50, etc.). Le boss n'apparaît plus qu'au stage X-5 (au lieu de chaque zone) — le revenu en gemmes/boss sera compensé par les récompenses de première complétion.

### 3.2 Déroulé d'un stage

Un stage est une **mission fermée** :

1. Lancement depuis l'écran Quête (hub → QUEST → zone → stage)
2. **5 vagues** de monstres (l'équivalent des 10 monstres actuels, resserré pour des sessions courtes ; chiffre à ajuster)
3. Dernière vague = **chef de vague** (mini-boss avec timer, mécanique boss actuelle) ; sur les stages X-10, c'est le **Boss de zone** avec son ultimate
4. **Écran de victoire** : butin (or, composants de l'élément du biome, PH, gemme si 1re fois), étoiles obtenues, boutons "Stage suivant ▶" / "Rejouer ↻" / "Hub 🏠"
5. **Défaite** (squad K.O. ou timer boss) : écran de défaite → retour hub (remplace le système actuel de recul de zone)

Le combat lui-même ne change pas : clicker, vue Dragon Quest avec l'ennemi en grand (c'est déjà le cas — `monster-emoji` plein cadre sur fond de biome), BB, soutien, etc.

### 3.3 Étoiles & rejouabilité

Chaque stage garde un score 0–3 étoiles :

- ★ Terminer le stage
- ★★ Terminer sans que la squad tombe K.O.
- ★★★ Terminer en moins de X secondes (X dépend du stage)

Les étoiles cumulées par zone débloquent 3 coffres de zone (ex : 10★ → gemmes, 20★ → composants rares, 30★ → sphère). Les stages terminés restent **rejouables à volonté pour farmer** — les drops de composants suivent l'élément du biome (synergie avec la Ville : la Ville donne de l'aléatoire toutes les 10 min, le farming ciblé se fait dans les stages).

### 3.4 Idle / AFK / offline

La progression infinie disparaît, donc les gains offline changent de support : mode **Patrouille** — le joueur désigne un stage terminé ; les gains offline sont calculés comme aujourd'hui (35 % du DPS × temps) mais thématisés sur ce stage, avec une petite chance de composants de son biome. Le bandeau AFK actuel de la carte (`wm-afk-info`) devient le sélecteur de patrouille.

### 3.5 Données & sauvegarde

```js
// Nouveaux champs G :
playerName: 'Invocateur',
summonerLevel: 1, summonerExp: 0,
stageProgress: {},        // { "1-1": { stars: 3, clears: 12 }, ... }
currentStage: null,        // stage en cours { biome, stage } ou null (au hub)
patrolStage: null,         // stage de patrouille AFK
// G.zone / G.maxZone conservés en interne comme "zone équivalente" pour
// ne pas casser les formules (HP, or, gates d'évo, succès).
```

**Migration des saves existantes** : `maxZone = 37` → tous les stages jusqu'à 3-7 marqués terminés (1★ par défaut), `currentStage = 3-7`, patrouille sur le meilleur stage. Aucune perte de progression.

---

## 4. Impacts sur les systèmes existants

| Système | Impact | Ampleur |
|---|---|---|
| `killMonster()` | Boss vaincu → fin de stage (écran victoire) au lieu de `G.zone++` en continu | Moyen |
| Boss timer / recul de zone | La défaite renvoie au hub au lieu de reculer d'une zone ; le revive pub reste | Faible |
| Carte du monde (`renderWorldMap`) | Devient l'écran **Quête** : cartes de zones → liste de stages avec étoiles. Les `BIOME_DEFS` et nodes existants sont la base directe | Moyen |
| Prestige | Sens conservé : reset de toute la progression de stages contre cristaux. À confirmer : les étoiles sont-elles conservées ? (Recommandation : oui, seul le déblocage est reset) | Faible |
| Succès zone 50/100/200 | Reformulés en stages (ex : "Terminer la zone 5") via la zone équivalente — pas de changement de données | Faible |
| Quêtes journalières / hebdo | Inchangées (kills, BB, etc. fonctionnent par stage). Le boss hebdo gagne une bannière dans le carrousel | Très faible |
| Tutoriel | Réécrit : step 1 = lancer le stage 1-1 depuis le hub, puis steps combat actuels, step final = retour hub. Le hub devient l'écran par défaut **même en nouvelle partie** | Moyen |
| Hub actuel (Portail d'Elgaia) | Remplacé par le nouveau hub plein écran. La Ville est conservée telle quelle (accessible depuis la barre du bas + carrousel) | Faible |
| Offline gains | Recâblés sur la Patrouille (§3.4) | Faible |
| Tab-bar / tiroirs | Conservés en combat ; sur le hub, remplacés par la barre d'icônes BF | Moyen |

---

## 5. Plan d'implémentation par phases

Chaque phase est livrable et testable indépendamment — le jeu reste jouable entre chaque.

**Phase 1 — Hub visuel façon BF** *(index.html, styles.css, game.js, start-menu.js)*
Nouveau `#hub-menu` plein écran : header doré (pseudo, Rang, devises), bande squad (réutilise `SQUAD_IMGS`), carrousel central, barre d'icônes 6 boutons avec pastilles. Le hub devient l'écran racine après le start-menu. L'ancien Portail d'Elgaia est retiré. Les portes pointent encore vers les systèmes actuels (zones infinies) — aucun changement de gameplay.

**Phase 2 — Données stages + écran Quête** *(game.js, src/data)*
`stageProgress`, migration des saves, écran de sélection (zone → stages → étoiles), `startStage(b,s)`. Le combat lancé depuis un stage se comporte encore comme aujourd'hui.

**Phase 3 — Boucle de combat par stage** *(game.js)*
Vagues, fin de stage, écrans victoire/défaite, attribution des étoiles, récompenses 1re fois, retour hub. Suppression de la progression infinie. EXP d'Invocateur.

**Phase 4 — Adaptations systémiques** *(game.js)*
Patrouille AFK/offline, prestige, succès, tutoriel réécrit, coffres d'étoiles par zone.

**Phase 5 — Polish** *(styles.css, assets)*
Animations du carrousel, pastilles dynamiques, sons, transitions hub↔combat, branchement des images définitives fournies par l'utilisateur.

---

## 6. Décisions VALIDÉES (11/06/2026)

1. **Structure** ✅ : carte → zones cliquables sur la map → 5 stages par zone → 5 monstres par stage, boss à la fin du 5e stage (cf. §3.1 et `assets/map/map 1 .png`).
2. **Étoile ★★★** ✅ : basée sur le temps.
3. **Prestige** ✅ : les étoiles survivent au prestige (seul le déblocage de progression est reset).
4. **Défaite** ✅ : écran avec les deux boutons — "Retour au Hub" et "Relancer le stage".
5. **Pseudo** ✅ : demandé à la première partie (petit champ sur le start-menu) ET modifiable dans Paramètres.
6. **Énergie** ✅ : définitivement hors-scope — jeu offline, aucune barrière d'énergie.

**Assets fournis** : `assets/map/map 1 .png` (carte zone 1), `assets/img home/porte quest principal.png` et `porte quette anexe.png` (portes pixel-art pour le hub). Le hub utilisera ces portes ; les visuels manquants restent en placeholders CSS.

---

## 7. Plan de vérification

Au fil des phases : lancement → hub s'affiche avec la vraie squad et les vraies devises ; navigation vers chaque destination et retour ; lancement du stage 1-1, victoire → étoiles + butin + stage suivant ; défaite → retour hub sans perte ; migration d'une vieille save (`maxZone` élevé) → stages débloqués corrects ; tutoriel nouvelle partie de bout en bout ; prestige → reset correct ; mode Patrouille offline ; responsive mobile/desktop ; `node --check` et tests unitaires sur la migration et l'attribution d'étoiles.
