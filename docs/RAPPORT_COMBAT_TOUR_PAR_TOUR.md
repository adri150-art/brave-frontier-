# Rapport de cadrage — Système de combat « Encaisser & Répliquer »

> But de ce document : **acter le concept** et découper le travail en **phases validées une par une**.
> Aucune ligne de code n'est écrite tant qu'on n'est pas d'accord sur ce rapport.

---

## 1. Ce que j'ai compris du concept (à valider)

Le combat devient un **tour par tour à deux temps**, autour d'une **jauge de PV commune** à toute l'équipe.

### Déroulé d'un tour
1. **Annonce (Menace)** — le monstre désigne le héros qu'il frappera : un **effet de lumière** apparaît sur le portrait du héros ciblé (ex. Ignis) pour prévenir le joueur **avant** qu'il joue.
2. **Tour des héros** — pour **chaque héros**, le joueur choisit via **deux boutons placés à côté de son portrait** :
   - **ATT** → le héros attaque le monstre ;
   - **DEF** → le héros se met en Garde (réduit les dégâts sur la jauge commune) **mais n'attaque pas ce tour-ci**.
   - Les deux sont **exclusifs** : ATT ou DEF, pas les deux.
   - Le **Brave Burst** ne se déclenche **qu'en touchant le portrait du héros** (action distincte des boutons ATT/DEF).
   - Les boutons doivent être **grands et bien placés** pour être faciles à cliquer.
3. **Tour du monstre** — le monstre frappe le héros annoncé. Les dégâts sur la jauge commune dépendent de **la DEF et de l'élément du héros ciblé** (+ de la Garde s'il a été mis en DEF).
4. **Fin de tour** — gains de Brave Burst (voir §3), puis tour suivant.

> Côté joueur, visuellement il n'y a que : **l'effet « qui va être attaqué »** + **les boutons ATT/DEF** + **le tap sur le portrait pour le BB**. Le reste est automatique.

### Réfraction élémentaire (le cœur tactique)
La jauge est commune, mais **qui encaisse compte**. Le multiplicateur dépend de l'élément du **héros ciblé** face à l'élément du **monstre** :
- Monstre **Feu** frappe **Selena (Eau)** → la jauge perd **presque rien** (résistance).
- Monstre **Feu** frappe **Lance (Plante)** → la jauge **prend très cher** (faiblesse).

→ Le teambuilding et le **placement** des héros sur les slots deviennent stratégiques (mettre le bon élément/tank pour encaisser).

---

## 2. Brave Burst — pacing déterministe (pas d'aléatoire)

Objectif : pouvoir lancer **~2 BB par donjon de 5 niveaux** (≈ 15–20 tours). Jauge = **100 points**.
- **Génération passive** : **+10 points par héros à la fin de chaque tour** → pleine en 10 tours.
- **Bonus de synergie (joueurs experts)** : enchaîner les attaques des héros dans un **ordre élémentaire précis** crée une réaction (ex. **Selena [Eau] puis Lance [Plante] = « Floraison »**) → **+5 ou +10 BB** aux deux héros impliqués.
- **Bouton Auto** : le casual laisse monter ses jauges (≈ 2 BB / donjon) ; le joueur pro optimise l'ordre pour remplir **deux fois plus vite**.

---

## 3. Capacités avancées (plus tard)
- **Provocation** : un passif/Leader redirige l'attaque ennemie vers un héros choisi (protéger un slot faible).
- **Barrières élémentaires** : poser une protection sur un allié fragile.
- **Changement d'élément** : modifier temporairement la nature d'énergie de l'équipe.
- **Passif Leader** : immuniser contre les altérations d'état pour le tour, etc.

---

## 4. Le point d'attention honnête

Ton jeu actuel est un **clicker temps réel** (le monstre frappe sur des timers, on clique en continu). Ce concept est un **vrai tour par tour** : c'est une **nouvelle boucle de combat**, pas un petit ajout. Il faut donc décider **comment elle cohabite** avec l'existant (voir décisions ci-dessous) — c'est LA question à trancher avant de commencer.

---

## 5. Découpage en phases (on en valide UNE à la fois)

| Phase | Contenu | Visuel ? | On valide quoi |
|---|---|---|---|
| **0. Cadrage** | Ce rapport : concept + décisions | non | Tu confirmes que j'ai bien compris |
| **1. Boucle logique** | Machine à états du tour (annonce → choix ATT/DEF par héros → attaques héros → attaque monstre → fin de tour). **Sans UI**, testée par logs | non | Le tour s'enchaîne correctement, dégâts/réfraction justes |
| **2. UI de combat** | Boutons **ATT/DEF** par héros (grands, bien placés), **effet lumière** sur le héros ciblé, **tap portrait = BB**, jauge commune | **oui (nouveau)** | Ça se joue à la main, c'est clair et cliquable |
| **3. Réfraction & éléments** | DEF + élément du héros ciblé → dégâts ; résistances/faiblesses | non | Les exemples (Eau encaisse Feu, Plante souffre) marchent |
| **4. Brave Burst** | +10/tour fixe, réactions de synergie (Floraison…), comportement Auto | partiel | ~2 BB/donjon en casual, plus vite en optimisant |
| **5. Avancé** | Provocation, barrières, changement d'élément, passifs Leader | partiel | Les outils de redirection/protection fonctionnent |
| **6. Intégration & équilibrage** | Brancher sur un donjon (5 niveaux / 15–20 tours), pacing, playtest | non | Le combat est jouable et équilibré de bout en bout |

**Règle de travail** : je ne passe à la phase suivante **qu'après ta validation** de la précédente. Chaque phase est petite et vérifiable.

---

## 6. Décisions à trancher avant la Phase 1

1. **Périmètre** : ce combat tour par tour **remplace** le clicker, ou c'est un **mode dédié** (ex. uniquement pour les boss/donjons), le clicker restant pour le farm ?
2. **Point de départ** : on commence bien par la **Phase 1 (logique pure, sans UI)** ?
3. **Sécurité** : je travaille dans un **fichier séparé/module isolé** activé par un drapeau, pour ne jamais casser le jeu existant pendant qu'on construit — ok ?

Dis-moi sur ces 3 points (surtout le 1), et on lance la Phase 1 proprement.
