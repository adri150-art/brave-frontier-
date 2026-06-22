# 🚀 Rapport Viralité & Game Design — Brave Frontier Clicker
**Analyse complète · Juin 2026**

---

## 📌 Verdict de départ

Ton jeu est visuellement soigné, techniquement complet et ambitieux pour un projet solo. Les images originales, les biomes, le système BB, le gacha, l'évolution 3★→6★, les sphères — c'est honnêtement beaucoup de travail. Mais si tu le mettais en ligne demain tel quel, voilà ce qui se passerait : quelques dizaines de personnes le joueraient, quelques-unes le finiraient, et ensuite rien. Pas parce que le jeu est mauvais — mais parce qu'il lui manque les mécaniques qui **font revenir les gens et les poussent à en parler**.

Ce rapport explique exactement quoi changer et dans quel ordre.

---

## 🔍 Partie 1 — Diagnostic : Pourquoi ça ne devient pas viral

### 1.1 Le problème fondamental : tu n'as pas de crochet

Un jeu viral a toujours **un truc** — un moment qu'on ne peut pas s'empêcher de raconter à quelqu'un.

- Cookie Clicker : *"attends, j'ai des grands-mères qui fabriquent des cookies à l'échelle industrielle"*
- Vampire Survivors : *"je suis devenu si fort que les ennemis ne peuvent même plus m'atteindre"*
- Wordle : *"on a tous le même puzzle aujourd'hui, je l'ai eu en 3 essais"*

Quel est le "truc" de ton jeu en ce moment ? La réponse honnête : il n'y en a pas encore. Le gacha existe, les BB existent, mais aucune de ces mécaniques n'a été poussée jusqu'au moment de stupéfaction qui fait crier *"t'as vu ça ?"*

### 1.2 Aucune raison de revenir le lendemain

Les jeux idle retenus ont des **raisons quotidiennes** de se reconnecte :
- Login bonus
- Quête journalière
- Boss d'événement limité dans le temps
- Tournoi hebdomadaire
- Raid de guilde

Ton jeu a un système offline (gains passifs) mais aucun contenu qui change. Si je ferme le jeu ce soir et reviens demain, il ne s'est rien passé d'intéressant — juste des chiffres plus grands. Ce n'est pas suffisant.

### 1.3 Rien à partager

Quand un joueur fait quelque chose d'impressionnant dans ton jeu, que se passe-t-il ? Rien. Il n'y a aucun :
- Écran de résultat partageable ("J'ai battu le Boss Zone 50 !")
- Carte de squad exportable
- Rang dans un classement mondial
- Code de squad à envoyer à un ami

Les jeux qui se propagent donnent aux joueurs **quelque chose à montrer**.

### 1.4 Ton seul canal de distribution est le bouche-à-oreille

Comme c'est un jeu web sans app mobile, tu n'as pas accès à l'App Store, Google Play, Steam (directement), ni aux algorithmes de découverte. 100% de tes nouveaux joueurs doivent venir d'une recommandation humaine. Donc si le jeu ne crée pas lui-même des ambassadeurs, la croissance est zero.

### 1.5 La boucle de jeu manque de tension

En ce moment, la progression ressemble à ça :
> Clique → gagne de l'or → achète des héros → clique plus vite → prestige → recommence

C'est fonctionnel mais prévisible. Il n'y a pas de moment de décision tendu, pas de choix difficile à faire. Les meilleurs idle games créent de la **friction désirée** — des moments où tu dois choisir entre deux chemins, où ta stratégie compte vraiment.

---

## 🎯 Partie 2 — Ce qui manque vraiment : les 5 piliers

### Pilier 1 — UN CROCHET UNIQUE 🪝

C'est le plus important. Voilà ce que je recommande spécifiquement pour TON jeu :

**"Le Défi du Jour"** — inspiré de Wordle, adapté à l'idle RPG.

Chaque jour, tous les joueurs du monde font face au **même Boss du Jour**, avec les mêmes conditions (ex : zone 30, élément Eau, timer 60 secondes). Le score (dégâts infligés en temps limité) est publié. Tu partages ton score comme une image auto-générée sur Discord/Twitter.

Pourquoi ça marche :
- Tout le monde parle du même boss en même temps → communauté naturelle
- Le partage est intégré dans la mécanique, pas rajouté après
- Ça crée de la compétition sans serveur complexe (les scores peuvent être locaux avec un système d'honneur)
- C'est unique dans le genre idle clicker

**Alternative : le Mode Arena** — ton squad affronte le squad d'un autre joueur (simulé automatiquement). Tu exportes ton squad comme un code, quelqu'un d'autre l'importe et combat contre toi. Pas besoin de serveur temps réel — juste de l'asynchrone.

### Pilier 2 — RÉTENTION QUOTIDIENNE 📅

Sans ces mécaniques, les gens partent et ne reviennent pas :

**Login bonus (7 jours tournant)** — Le premier retour le lendemain doit être récompensé. Pas besoin d'être spectaculaire : 1 gemme, 500 PH, un cristal d'évolution. Ce qui compte c'est le *streak* (la série de jours consécutifs). Les joueurs ne veulent pas briser leur streak.

**Quête Journalière (3 objectifs simples)** — Exemples :
- Tuez 50 monstres → 200 PH
- Utilisez un BB 3 fois → 1 Gemme
- Atteignez la zone X → 1 Cristal Feu

Ces objectifs doivent changer chaque jour à minuit. Ça donne une raison concrète de revenir.

**Boss Hebdomadaire** — Un boss spécial (avec son propre artwork) disponible pendant 7 jours, avec des récompenses exclusives (une sphère unique, une illustration de héros déblocable). La rareté temporelle crée de l'urgence.

### Pilier 3 — MOMENTS PARTAGEABLES 📸

Intègre dans le jeu des **moments naturels de partage** :

**Carte de Squad exportable** — Un bouton "Partager ma Squad" qui génère une image PNG propre : les 4 héros avec leurs étoiles, le DPS total, la zone max atteinte, le rang de prestige. Cette image doit être belle — elle est la pub du jeu.

**Écran de victoire de Boss spectaculaire** — Quand tu bats un boss majeur (zones 10, 25, 50, 100), affiche un écran plein écran avec le nom du boss vaincu, le temps mis, les dégâts totaux. Ajoute un bouton "Partager". Les gens adorent poster leurs victoires.

**Achievements avec image partageable** — "Premier Prestige", "6★ obtenu", "Zone 100 atteinte" — chaque achievement majeur devrait générer une petite carte partageable stylisée.

### Pilier 4 — PROFONDEUR STRATÉGIQUE 🧠

Pour que les joueurs passent du temps et en parlent à d'autres joueurs, il faut que les **choix comptent vraiment**. En ce moment, la stratégie est limitée à "mets tes meilleurs héros dans la squad". Voilà ce qui apporterait de la profondeur :

**Synergie d'équipe** — Des bonus qui se déclenchent uniquement avec des combinaisons spécifiques :
- "2 héros Feu dans la squad → +30% ATK globale"
- "Squad full mono-élément → +50% DPS mais -20% PV"
- "Leader Eau contre boss Feu → +75% dégâts"

Ces synergies poussent les joueurs à teoriser et partager leurs compositions optimales. C'est exactement ce que font les communautés de jeux comme AFK Arena ou TFT.

**Mode de Difficulté Choisie** — Laisse le joueur régler manuellement la difficulté d'une zone (Facile/Normal/Difficile/Extrême). En Extrême, les récompenses sont ×3 mais les monstres ont ×5 PV. Ça crée des défis à relever et à raconter.

**Le Système de Formations** — En plus du squad de 4, ajoute une "formation" qui change la disposition des héros et leurs rôles (Tank devant, Mage derrière, etc.) avec des malus/bonus différents. Ça ajoute une dimension de stratégie sans complexité excessive.

### Pilier 5 — COMMUNAUTÉ & DISTRIBUTION 🌍

Le jeu seul ne peut pas se propager. Il a besoin d'un écosystème :

**Serveur Discord officiel** — C'est la première chose à créer. Un Discord avec : canal d'annonces, salon de partage de squads, canal de stratégie, salon de fan art. Les jeux web viraux ont presque tous une communauté Discord active. Le Discord *est* le jeu social quand tu n'as pas de serveur multijoueur.

**Itch.io** — Publie le jeu sur itch.io dès maintenant. C'est gratuit, les jeux web y sont très bien représentés, et il y a une audience active de joueurs qui cherchent des projets indé. Mets de belles screenshots, une description soignée, et une GIF de gameplay.

**Newgrounds** — Plateforme historique des jeux web, très active en 2026. Un bon jeu y monte vite dans les rankings si les premières heures de votes sont positives.

**TikTok/YouTube Shorts** — Enregistre 30 secondes de gameplay spectaculaire (une invocation 6★, un BB chainé, un boss vaincu à la limite) et poste-le. Les jeux web qui deviennent viraux sur TikTok explosent. Le format court est parfait pour montrer le game feel.

**Reddit** — r/incremental_games (82k membres) est exactement ta cible. Les développeurs qui postent honnêtement "j'ai fait ça en solo, voici le lien" avec quelques screenshots reçoivent des retours et des joueurs.

---

## 🛠️ Partie 3 — Ce qu'il faut modifier dans le jeu

### 3.1 L'onboarding (les 3 premières minutes)

C'est là où tu perds la majorité des joueurs. En ce moment, le joueur arrive sur le jeu et... doit comprendre seul. Il faut :

**Un tutoriel en 5 actions** (pas plus) :
1. "Clique sur le monstre pour l'attaquer" → flèche animée qui pointe vers le monstre
2. "Achète Ignis avec ton or" → flèche vers la boutique
3. "Mets-le dans ta squad" → flèche vers le slot squad
4. "Remplis la jauge BB et utilise-la" → mise en surbrillance de la jauge
5. "Bats le boss pour passer à la zone suivante" → écran de victoire

Ça prend 2 minutes et ça transforme le taux de rétention des nouveaux joueurs.

**Un objectif clair au départ** — La première chose visible doit être un objectif simple et atteignable : "Objectif : Atteindre la Zone 5". Les joueurs qui ont un objectif explicite restent 3× plus longtemps que ceux qui explorent librement.

### 3.2 Le système de gacha — ajouter la pitié

Le gacha sans pitié est frustrant et pousse les joueurs à partir. Ajoute :

**Pity counter** — Après 10 invocations sans héros 5★/6★, la prochaine est garantie Tier A minimum. Après 50 invocations sans Tier S, la prochaine est garantie Tier S.

Affiche le compteur clairement : "7/10 invocations sans héros rare — pity dans 3". Ça motive à continuer d'investir plutôt que d'abandonner.

**Invocation ×10 avec bonus** — Un bouton "Invoquer ×10" qui coûte 45 gemmes (au lieu de 50) avec une récompense garantie. C'est le standard du genre et les joueurs s'attendent à l'avoir.

### 3.3 La progression — enlever les murs invisibles

Les bugs d'équilibrage identifiés dans l'audit (courbes PV/Or, héros inatteignables) créent des **murs frustrants où le joueur ne comprend pas pourquoi il bloque**. La règle d'or : un joueur peut toujours trouver quoi faire pour avancer. Si il est bloqué, il faut lui montrer explicitement la prochaine étape.

Ajoute une barre de progression visuelle "Prochaine évolution" qui montre exactement ce qu'il manque (or, matériaux, zone requise). Les joueurs patient s'ils voient le bout du tunnel.

### 3.4 La boucle de fin de jeu (endgame)

Le prestige est bien, mais "recommencer avec +10% stats" c'est mince comme récompense. L'endgame a besoin :

**Prestige avec choix** — Au lieu de juste +10% stats, le joueur choisit parmi 3 bonus différents à chaque prestige :
- Option A : +15% DPS global
- Option B : +25% or gagné par kill
- Option C : +1 slot de squad permanent

Ces choix créent des "builds de prestige" différents que les joueurs comparent et discutent.

**Biomes Légendaires (zones 100+)** — Des zones post-prestige avec des mécaniques spéciales : le monstre contre-attaque quand tu le clic trop vite, les boss ont des phases, l'élément change en cours de combat. Ça donnerait une destination aux joueurs hardcore.

### 3.5 Le feedback visuel — amplifier les moments forts

**Les BB doivent être spectaculaires** — En ce moment, l'animation BB existe mais n'est pas l'événement qu'elle devrait être. Chaque BB doit avoir son propre VFX plein écran (au moins 1-2 secondes) qui fait sentir la puissance du héros. C'est un moment à montrer en vidéo.

**Les évolutions doivent être célébrées** — Quand un héros passe de 5★ à 6★, ce doit être l'événement le plus spectaculaire du jeu. Animation spéciale, musique qui change, flash d'écran, voix (même synthétique) qui dit le nouveau titre du héros. C'est ce moment-là que le joueur voudra filmer.

**Combo visible et dramatique** — Le combo multiplicateur (×1.1, ×2.2…) doit être physiquement plus grand sur l'écran à chaque hit. Quand tu atteins ×40 (le maximum), il doit y avoir une réaction visuelle explosive.

---

## 📊 Partie 4 — Feuille de route prioritaire

Voici exactement dans quel ordre travailler pour maximiser l'impact :

### 🔴 Phase 1 — Fondations (à faire maintenant)

| # | Quoi | Pourquoi c'est urgent |
|---|------|----------------------|
| 1 | Corriger les bugs critiques de l'audit (HP vide, bouton Honor, courbes économie) | Le jeu doit être jouable sans frustration technique |
| 2 | Tutoriel 5 étapes | Sans ça, tu perds 80% des nouveaux joueurs en 2 min |
| 3 | Autosave toutes les 15s + `beforeunload` | La perte de progression = joueurs qui ne reviennent jamais |
| 4 | Login bonus (7 jours) | Mécanisme de rétention n°1, implémentation simple |
| 5 | Quêtes journalières (3 par jour) | Donne une raison de revenir demain |

### 🟠 Phase 2 — Différenciation (dans les 2-4 semaines)

| # | Quoi | Pourquoi |
|---|------|---------|
| 6 | Défi du Jour (boss quotidien identique pour tous) | Ton crochet viral principal |
| 7 | Carte de squad partageable (export PNG) | Permet aux joueurs de faire ta pub |
| 8 | Pity system gacha + Invoc ×10 | Réduit la frustration, augmente l'engagement gacha |
| 9 | Synergies d'équipe (bonus de combinaison) | Apporte de la profondeur stratégique |
| 10 | Écran de victoire boss partageable | Moment naturel de partage |

### 🟡 Phase 3 — Croissance (dans le mois suivant)

| # | Quoi | Pourquoi |
|---|------|---------|
| 11 | Publier sur Itch.io avec description + screenshots | Distribution gratuite, audience garantie |
| 12 | Créer le serveur Discord | Fédère la communauté, donne du feedback direct |
| 13 | Boss Hebdomadaire avec récompenses exclusives | Rétention long terme |
| 14 | BB ultra-spectaculaires par héros | Contenu viral naturel, moments à filmer |
| 15 | Prestige avec choix de bonus | Profondeur endgame, discussions de "build" |

### 🟢 Phase 4 — Expansion (si la communauté répond bien)

| # | Quoi | Pourquoi |
|---|------|---------|
| 16 | Mode Arena asynchrone (combat de squads) | PvP sans serveur temps réel |
| 17 | Version mobile (PWA) | Push notifications, icône sur l'écran d'accueil |
| 18 | Événements saisonniers (boss Halloween, Noël) | Rétention cyclique, buzz saisonnier |
| 19 | Classement mondial (leaderboard) | Compétition, prestige social |

---

## 💡 Partie 5 — L'idée qui pourrait tout changer

Si tu veux UN seul ajout qui transforme ton jeu, c'est ça :

**Le Défi du Jour + partage automatique.**

Voilà comment ça fonctionne concrètement :

1. Chaque jour à 00h00, un "Seed" (nombre aléatoire du jour) détermine un boss unique — ses stats, son élément, son timer.
2. Tous les joueurs voient ce boss dans un onglet "DÉFI" spécial.
3. Le joueur combat avec son squad habituel et fait le plus de dégâts possible en 60 secondes.
4. À la fin, un écran affiche son score + un bouton "Partager".
5. Ce bouton génère une image PNG stylisée avec : le nom du boss du jour, son score, ses héros utilisés, et une phrase comme "Peux-tu faire mieux ? → [lien du jeu]".

Le lien inclus dans chaque image partagée = acquisition gratuite de nouveaux joueurs.

C'est Wordle appliqué à ton jeu. Et ça ne nécessite **aucun serveur** — le seed du jour est calculé côté client avec la date, le classement est optionnel ou basé sur l'honneur.

---

## 🎯 Conclusion

Ton jeu a les fondations. Les images sont originales et bonnes, le système BB est différenciant, l'évolution multi-étoiles donne de la profondeur. Tu n'as pas un problème de qualité — tu as un problème d'**accroche** et de **rétention**.

La liste de priorités est claire. Si tu appliques juste la Phase 1 + le Défi du Jour, tu auras un jeu qui mérite d'être découvert et qui donne aux joueurs les outils pour le propager.

Le travail le plus difficile est fait. Maintenant c'est la finition qui fait la différence.

---

*Rapport rédigé après lecture intégrale du code source (5 697 lignes), de l'audit technique, et analyse des mécaniques de viralité des jeux idle web en 2025-2026.*
