// §1.7 data/biomes.js — DONNÉES PURES (zéro logique) — Biomes / zones / couleurs élémentaires
// Extraites VERBATIM de index.html. Source de vérité une fois index.html câblé en module.

export const ZONE_THEMES = [
    { name: "Cavernes d'Agni", elem: 'Feu', bossName: "Dragon d'Agni", monsters: ["Slime de Lave", "Canidé d'Enfer", "Élémentaire de Scorie"], bgHue: 0 },
    { name: "Océan Éternel", elem: 'Eau', bossName: "Léviathan", monsters: ["Méduse de Cristal", "Éclaireur Squalide", "Tortue de Récif"], bgHue: 185 },
    { name: "Forêt de Gaïa", elem: 'Terre', bossName: "Ancien Gardien", monsters: ["Mandragore Bourgeonnante", "Esprit Sylvestre", "Arachnide des Bois"], bgHue: 95 },
    { name: "Pic Foudroyé", elem: 'Foudre', bossName: "Titan Foudre", monsters: ["Scarabée Volte", "Rapace des Nuées", "Renard de Foudre"], bgHue: 50 },
    { name: "Sanctuaire Céleste", elem: 'Lumière', bossName: "Archange Déchu", monsters: ["Éclat Flottant", "Pégase de Marbre", "Sentinelle Sacrée"], bgHue: 40 },
    { name: "Néant des Ombres", elem: 'Ténèbres', bossName: "Faucheur d'Âmes", monsters: ["Ombre Errante", "Gargouille de Crypte", "Spectre Maudit"], bgHue: 270 }
];

export const TIER_PREFIXES = ['', 'Alfa ', 'Légendaire ', 'Mythique ', 'Divin '];

export const BIOME_BGS = [
    "assets/Biome/Biome FEU _ Les Cavernes d'Agni.png",          // 0 — Feu      ✓
    "assets/Biome/Biome EAU _ L'Océan Éternel.png",              // 1 — Eau      ✓
    "assets/Biome/Biome TERRE _ La Forêt de Gaïa.png",           // 2 — Terre    ✓
    "assets/Biome/Biome FOUDRE _ Le Pic Foudroyé.png",           // 3 — Foudre   ✓
    "assets/Biome/Biome LUMIÈRE _ Le Sanctuaire Céleste.png",    // 4 — Lumière  ✓
    "assets/Biome/Biome TÉNÈBRES _ Le Néant des Ombres.png",     // 5 — Ténèbres ✓
];

export const BIOME_GLOW_COLORS = [
    'rgba(231, 76,  60,  0.75)', // Feu
    'rgba(52,  152, 219, 0.75)', // Eau
    'rgba(39,  174, 96,  0.75)', // Terre
    'rgba(241, 196, 15,  0.75)', // Foudre
    'rgba(253, 243, 150, 0.75)', // Lumière
    'rgba(155, 89,  182, 0.75)', // Ténèbres
];

export const ELEM_BADGE_COLOR = {
    Feu:'#e74c3c', Eau:'#3498db', Terre:'#2ecc71',
    Foudre:'#f1c40f', Lumière:'#fcf3cf', Ténèbres:'#9b59b6'
};

export const ELEM_ICONS = {
    'Feu':      '<i class="ra ra-fire"></i>',
    'Eau':      '<i class="ra ra-droplet"></i>',
    'Terre':    '<i class="ra ra-leaf"></i>',
    'Foudre':   '<i class="ra ra-lightning-bolt"></i>',
    'Lumière':  '<i class="ra ra-sun"></i>',
    'Ténèbres': '<i class="ra ra-skull"></i>',
};

export const ELEM_COLORS = { 'Feu': '#e74c3c', 'Eau': '#3498db', 'Terre': '#2ecc71', 'Foudre': '#f1c40f', 'Lumière': '#fff9c4', 'Ténèbres': '#9b59b6' };

