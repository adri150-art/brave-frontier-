# Rapport d'Équilibrage — Refonte Soutien Actif

## Résumé

Le joueur ne fait plus de dégâts directs au monstre. Chaque clic devient une **action de soutien** : génération de BC pour toute l'équipe, soins en critique, et debuff tactique au combo. L'équipe tue le monstre, le joueur la propulse.

---

## Problème fondamental (ancien système)

Le tap-damage était structurellement cassé sur deux aspects :

**1. Irrélevance progressive.** Les dégâts de tap suivaient une courbe exponentielle (base 1.07853^niveau) mais les HP des monstres aussi (1.20^zone). À partir de la zone ~30, le DPS auto des héros représentait >95% des dégâts. Le joueur cliquait sans que ça change quoi que ce soit — c'était du bruit visuel.

**2. Absence d'identité.** Le joueur tapait pour faire des dégâts. Les héros tapaient pour faire des dégâts. Il n'y avait pas de distinction de rôle, pas de tension stratégique. Le "combo ×40" était juste un multiplicateur de dégâts parmi d'autres.

---

## Nouveau Système : Soutien Actif

### `getSupportPower()` — BC générés par clic par héro

| Niveau Soutien | BC/tap/héro | BB rechargé en X clics (cost 100) |
|---|---|---|
| 0 | 3 | ~34 clics |
| 25 | 13 | ~8 clics |
| 50 | 23 | ~4 clics |
| 100 | 43 | ~2 clics |

La courbe est **linéaire intentionnellement** — contrairement aux dégâts exponentiels d'avant, le BC/tap reste lisible et ne crée pas d'écart abyssal entre les niveaux.

### Mécaniques de clic

| Action | Effet |
|---|---|
| Clic normal | +X BC à tous les héros actifs |
| Crit (10% base) | ×3 BC + soin 1.5% HP max |
| Combo ×10+ | Debuff monstre −40% attaque (3s) |
| Combo MAX ×40 | Charge immédiate +25 BC à tout le squad |
| Cristaux BC (65%) | Particule BC générée |
| Cristaux HC (30%) | Particule HC générée |

### Frénésie (skill actif)

Avant : ×3 DPS + ×3 tap-dégâts. Maintenant : ×3 DPS + ×3 BC/tap. Le joueur en Frénésie spam les clics pour charger tous les BBs en quelques secondes — un burst coordonné d'un autre niveau.

### Compétence "Frappe" reconvertie → "Soutien Massif"

Activait un one-shot tap×50. Maintenant : injecte **+50 BC** à tous les héros instantanément. Sur un squad de 4 héros avec cost 50 chacun, c'est 4 BBs chargés d'un coup. Spectaculaire et stratégique.

---

## Équilibrage des héros (inchangé, mais renforcé)

Le nouveau système **valorise davantage** les personnages déjà présents :

- **Sera** (Créateur Suprême, leader) : +30% BC/tap via son `getSupportPower()` bonus — devient le leader parfait pour un joueur actif
- **Zeln / Margonia** (healers BB) : leur BC-injection de BB synergise maintenant avec les BC du joueur — combo dévastateur
- **Lance / Magress** (tanks) : leur mitigation dure 10s, qui est exactement la fenêtre où le joueur peut spam-cliquer pour recharger le squad pendant que l'équipe est protégée

---

## Équilibrage du Boss Hebdomadaire

Ancien calcul : `DPS×30 + tap×20` → tap pouvait représenter jusqu'à 40% des dégâts boss à bas niveau, puis 0% au niveau 100.

Nouveau calcul : `DPS × 45 × 1.5` — simule 45s de combat où le joueur, en soutenant, permet plus de BBs = burst ×1.5. Plus cohérent avec le nouveau rôle.

---

## Courbe de progression recommandée

```
Zones 1-15   → BC/tap faible, le joueur apprend le rythme combo → BB
Zones 16-40  → Soutien niveau 20-40 : les BBs chainés deviennent impactants
Zones 41-80  → Spark combos + SBB disponibles : le joueur orchestre des vagues de BBs
Zones 81+    → UBB + Soutien max : le joueur est le chef d'orchestre de l'équipe
```

---

## Paramètres à ajuster selon le ressenti

| Paramètre | Valeur actuelle | Zone d'ajustement |
|---|---|---|
| BC base au niveau 0 | 3 | 2–5 |
| Coefficient par niveau | ×0.4 | ×0.3–×0.6 |
| Soin sur crit | 1.5% HP max | 1%–3% |
| Debuff monstre au combo 10 | −40% atk, 3s | durée 2s–5s |
| Bonus BC Frénésie | ×3 | ×2–×4 |
| Soutien Massif (skill) | +50 BC flat | 30–75 |

---

## Ce qui n'a PAS changé

- Le DPS auto des héros (inchangé — c'est eux qui tuent)
- Le système de combo (même compteur, même glow à ×15, même max ×40)
- Le système de Spark entre BBs
- Les coûts d'upgrade du Soutien (même formule 1.14^niveau)
- L'arbre de compétences, les équipements, les sphères
- La mort du squad si les HP tombent à 0

---

*Ce rapport correspond aux commits appliqués dans `js/game.js` et `index.html`.*
