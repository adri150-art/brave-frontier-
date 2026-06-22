// §1.7 core/rng.js — RNG seedé (déterministe → raids, anti-triche)
// NOUVEAU : pas encore dans index.html. À implémenter lors de l'ajout des raids/PvP.
// Algorithme recommandé : mulberry32 ou xoshiro128**

export function createRng(seed) {
    // Mulberry32 — rapide, période 2^32, suffisant pour un idle game
    let s = seed >>> 0;
    return function () {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const rng = createRng(Date.now());
