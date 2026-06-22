# 🧩 Patchs UI prêts à tester — Accessibilité + Bottom-sheet

Deux livrables **additifs**, **vérifiés en jsdom (12/12)**, à intégrer puis valider au navigateur (`npm run dev`).

## 1. ♿ Patch accessibilité — `assets/a11y.enhance.js`
Rend focusables au clavier les éléments cliquables non natifs (cartes, onglets, nœuds de carte, boutons BB…) + support Enter/Espace + style de focus visible. **Couvre le contenu généré dynamiquement** (MutationObserver). **N'altère aucun comportement existant.**

**Intégration** — une ligne, à la fin du `<body>` (après le monolithe) :
```html
<script src="./assets/a11y.enhance.js" defer></script>
```
**Vérifié (jsdom) :** `role="button"` + `tabindex="0"` ajoutés aux éléments custom ; Enter/Espace déclenchent le clic ; `<button>` natifs laissés intacts ; idempotent.

**À valider au navigateur :** Tab parcourt les cartes/boutons ; le focus est visible (contour ambre) ; Entrée/Espace activent l'élément focalisé ; lecteur d'écran annonce « bouton ».

## 2. 📱 Composant Bottom-sheet — `src/ui/components/BottomSheet.js` + `assets/bottomsheet.css`
Feuille modale montant du bas (une main), vanilla, zéro dépendance. Fermeture : scrim, **swipe vers le bas**, **Échap**, bouton ✕. Respecte `prefers-reduced-motion`/perf-low et `safe-area-inset`.

**Intégration**
```html
<link rel="stylesheet" href="./assets/bottomsheet.css">
```
```js
import { BottomSheet } from './src/ui/components/BottomSheet.js';
const sheet = new BottomSheet();
sheet.open({ title:'Héros', html: heroesPanelHTML });   // ou { node: panelEl }
// sheet.close();
```
> Note d'archi : ce composant est la **cible de remplacement** des drawers + du déménagement de DOM de `initResponsiveLayout`. Migration recommandée : router un panneau à la fois vers `BottomSheet`, valider au navigateur, puis retirer l'ancien drawer correspondant. (S'intègre quand `index.html` consomme les modules — sinon copier la classe en inline le temps de la transition.)

**Vérifié (jsdom) :** scrim caché au départ ; `open()` affiche + injecte titre/contenu ; clic scrim et Échap ferment.

**À valider au navigateur :** animation d'entrée fluide ; swipe vers le bas ferme ; scroll interne OK sur contenu long ; pas de fuite de focus derrière le scrim.

## Ce que je n'ai PAS fait (volontairement)
Je n'ai **pas câblé** ces patchs dans `index.html` : leur rendu et leur ergonomie se jugent au navigateur. Ils sont prêts ; dis-moi si tu veux que j'ajoute la ligne `a11y.enhance.js` (très faible risque) et/ou que je route un premier panneau vers le bottom-sheet.
