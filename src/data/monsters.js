// §1.7 data/monsters.js — DONNÉES PURES (zéro logique) — Images de monstres par biome
// Extraites VERBATIM de index.html. Source de vérité une fois index.html câblé en module.

export const MONSTER_IMAGES = [
    // Biome 1 — Feu (Assets existants)
    ["assets/monster/biome 1/slime-de-lave-1.png", "assets/monster/biome 1/Canidé-d'enfer-2.png", "assets/monster/biome 1/Élémentaire-de-Scorie.png", "assets/monster/biome 1/BOSS _ Dragon d'Agni.png"],
    // Biome 2 — Eau (Assets existants)
    ["assets/monster/biome 2/Méduse de Cristal (Commun 1).png", "assets/monster/biome 2/Éclaireur Squalide (Commun 2).png", "assets/monster/biome 2/Tortue de Récif (Commun 3).png", "assets/monster/biome 2/👑 BOSS _ Léviathan.png"],
    // Biomes 3 à 6 (Utilisent la structure de fallback CSS hue-rotate basée sur le Biome 1)
    null, null, null, null
];

