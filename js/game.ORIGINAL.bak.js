// =============================================================
// GAME CONFIGURATION, CONSTANTS & STATE (First to avoid TDZ)
// =============================================================
/* §câblage : EVO_LEVEL_CAPS fourni par assets/globals.bundle.js (src/data) */
/* §câblage : EVO_COSTS fourni par assets/globals.bundle.js (src/data) */
// Zone minimale (maxZone) pour débloquer chaque palier d'évolution
// index = nombre d'étoiles cibles (4★ = index 4, etc.)
/* §câblage : EVO_ZONE_GATES fourni par assets/globals.bundle.js (src/data) */

/* §câblage : ELEMENT_ADVANTAGE fourni par assets/globals.bundle.js (src/data) */
/* §câblage : ELEM_COLORS fourni par assets/globals.bundle.js (src/data) */

// Icônes élémentaires RPG Awesome (HTML) — utilisées dans toutes les vues
/* §câblage : ELEM_ICONS fourni par assets/globals.bundle.js (src/data) */

// 12 héros — 2 par élément (1 Attaquant + 1 Utilitaire), triés par coût croissant
/* §câblage : HERO_DEFS fourni par assets/globals.bundle.js (src/data) */

// Configuration des 6 Biomes officiels (3 Monstres communs + 1 Boss par région)
/* §câblage : ZONE_THEMES fourni par assets/globals.bundle.js (src/data) */

// Prefixes de cycle (zone 7+ = même biomes mais plus durs)
/* §câblage : TIER_PREFIXES fourni par assets/globals.bundle.js (src/data) */

// Fonds de biome — index correspond à ZONE_THEMES
// null = utilise le biome 1 (Feu) comme fallback jusqu'à ce qu'un fond propre existe
/* §câblage : BIOME_BGS fourni par assets/globals.bundle.js (src/data) */

let _lastBiomeIdx = -1; // évite les rechargements inutiles
// Lueur colorée du monstre selon l'élément du biome actif
let _biomeGlowColor = 'rgba(255,255,255,0.3)';
/* §câblage : BIOME_GLOW_COLORS fourni par assets/globals.bundle.js (src/data) */

function applyBiomeBg(biomeIdx) {
    if (biomeIdx === _lastBiomeIdx) return;
    _lastBiomeIdx = biomeIdx;

    const hasOwnImg   = !!BIOME_BGS[biomeIdx];          // image propre au biome ?
    const path        = BIOME_BGS[biomeIdx] || BIOME_BGS[0]; // fallback → biome 1
    const theme       = ZONE_THEMES[biomeIdx];

    // Double quotes + encode l'apostrophe pour ne pas casser url("...")
    const safe = encodeURI(path).replace(/'/g, '%27');
    const bg   = document.getElementById('monster-bg');

    if (bg) {
        bg.style.backgroundImage = `url("${safe}")`;
        // Filtre de couleur élémentaire uniquement si on utilise un fallback
        // (image propre → pas de filtre, les couleurs sont déjà bonnes)
        if (hasOwnImg) {
            bg.style.filter = 'none';
        } else {
            bg.style.filter = `hue-rotate(${theme.bgHue}deg) saturate(1.25) brightness(0.9)`;
        }
    }

    // Lueur du monstre : couleur élémentaire du biome
    _biomeGlowColor = BIOME_GLOW_COLORS[biomeIdx] || 'rgba(255,255,255,0.3)';
    const monsterImg = document.getElementById('monster-emoji');
    if (monsterImg) _applyMonsterFilter(monsterImg, hasOwnImg ? 0 : theme.bgHue);

    // Fond d'écran dynamique global PC
    const dynamicBg = document.getElementById('dynamic-pc-bg');
    if (dynamicBg) {
        dynamicBg.style.backgroundImage = `url("${safe}")`;
        if (hasOwnImg) {
            dynamicBg.style.filter = 'blur(40px) brightness(0.4)';
        } else {
            dynamicBg.style.filter = `hue-rotate(${theme.bgHue}deg) saturate(1.25) brightness(0.36) blur(40px)`;
        }
    }
}

// Cartographie des chemins d'assets (avec fallbacks d'altération de couleur CSS pour les biomes 3 à 6)
/* §câblage : MONSTER_IMAGES fourni par assets/globals.bundle.js (src/data) */

/* §câblage : MILESTONES fourni par assets/globals.bundle.js (src/data) */
/* §câblage : MILESTONE_LABELS fourni par assets/globals.bundle.js (src/data) */ // §2.1 — Éveils remplacent les caps en escalier

/* §câblage : ACHIEVEMENTS_DEFS fourni par assets/globals.bundle.js (src/data) */

/* §câblage : HERO_TYPES fourni par assets/globals.bundle.js (src/data) */
/* §câblage : TYPE_MODS fourni par assets/globals.bundle.js (src/data) */

/* §câblage : MATERIAL_DEFS fourni par assets/globals.bundle.js (src/data) */


// ═══════════════════════════════════════════════════════════════════════════════
// §2.3 — CARTE DU MONDE PAR BIOMES (nodes de progression)
// ═══════════════════════════════════════════════════════════════════════════════

// Couleurs d'élément pour les badges
/* §câblage : ELEM_BADGE_COLOR fourni par assets/globals.bundle.js (src/data) */

// Définition des 6 biomes avec leurs stages/nodes
// Chaque biome = 10 zones du jeu existant (biome 0 = zones 1-10, biome 1 = zones 11-20…)
const BIOME_DEFS = ZONE_THEMES.map((theme, bi) => {
    const zoneStart = bi * 10 + 1;
    const zoneEnd   = zoneStart + 9;
    // Nodes : 8 combat + 1 élite + 1 boss + 1 trésor + 1 événement (12 total)
    const nodes = [];
    for (let i = 0; i < 8; i++) {
        nodes.push({ type: 'combat',   label: '⚔', zone: zoneStart + i,     name: `Stage ${zoneStart + i}` });
    }
    nodes.push({ type: 'elite',   label: '💀', zone: zoneStart + 8, name: `Élite — ${theme.monsters[0]}` });
    nodes.push({ type: 'treasure',label: '💰', zone: zoneStart + 8, name: 'Coffre mystère' });
    nodes.push({ type: 'boss',    label: '👑', zone: zoneEnd,       name: `Boss — ${theme.bossName}` });
    nodes.push({ type: 'event',   label: '🌟', zone: zoneEnd,       name: 'Événement spécial' });
    return {
        id: bi,
        name: theme.name,
        elem: theme.elem,
        bgImg: `assets/Biome/Biome ${['FEU','EAU','TERRE','FOUDRE','LUMIÈRE','TÉNÈBRES'][bi]} _ ${[
            "Les Cavernes d\'Agni","L\'Océan Éternel","La Forêt de Gaïa",
            "Le Pic Foudroyé","Le Sanctuaire Céleste","Le Néant des Ombres"][bi]}.png`,
        unlockZone: zoneStart,   // zone requise pour débloquer ce biome
        nodes,
        zoneStart, zoneEnd,
    };
});

// Détermine le statut d'un node pour un joueur donné
function getNodeStatus(node) {
    const maxZone = G.maxZone || 1;
    if (maxZone > node.zone)  return 'done';
    if (maxZone === node.zone) return 'current';
    return 'locked';
}

// Rend la carte du monde dans #wm-biomes-container
function renderWorldMap() {
    const container = document.getElementById('wm-biomes-container');
    if (!container) return;
    const maxZone = G.maxZone || 1;

    let html = '';
    BIOME_DEFS.forEach(biome => {
        const locked     = maxZone < biome.unlockZone;
        const progress   = biome.nodes.filter(n => getNodeStatus(n) === 'done').length;
        const total      = biome.nodes.length;
        const pct        = Math.round(progress / total * 100);
        const badgeColor = ELEM_BADGE_COLOR[biome.elem] || '#fff';
        // Encode image path safely
        const bg = biome.bgImg;

        html += `<div class="wm-biome-card${locked ? ' locked' : ''}" id="wm-biome-${biome.id}">
            <div class="wm-biome-banner" style="background-image:url('${bg}')">
                <span class="wm-biome-name">${biome.name}</span>
            </div>
            <div class="wm-biome-footer">
                <span class="wm-biome-progress">${progress}/${total} stages · ${pct}%</span>
                <span class="wm-biome-elem" style="background:${badgeColor}22;color:${badgeColor}">${biome.elem}</span>
            </div>
            <div class="wm-nodes-row">`;

        biome.nodes.forEach((node, ni) => {
            const status = locked ? 'locked' : getNodeStatus(node);
            html += `<div class="wm-node ${status} ${node.type}"
                onclick="${status !== 'locked' ? `navigateToStage(${biome.id},${ni})` : ''}"
                title="${node.name}">
                ${node.label}
                <div class="wm-node-tooltip">${node.name}</div>
            </div>`;
        });

        html += `</div></div>`;
    });
    container.innerHTML = html;

    // AFK banner
    const afkInfo = document.getElementById('wm-afk-info');
    const afkStage = document.getElementById('wm-afk-stage');
    if (afkInfo && afkStage) {
        afkInfo.style.display = 'flex';
        const curBiome = BIOME_DEFS.find(b => G.zone >= b.zoneStart && G.zone <= b.zoneEnd);
        afkStage.textContent = curBiome ? `${curBiome.name} — Zone ${G.zone}` : `Zone ${G.zone}`;
    }
}

// Navigation vers un stage : change la zone et ferme le panel
function navigateToStage(biomeId, nodeIdx) {
    const biome = BIOME_DEFS[biomeId];
    if (!biome) return;
    const node = biome.nodes[nodeIdx];
    if (!node) return;
    if (G.maxZone < node.zone && getNodeStatus(node) === 'locked') return;

    // ── Phase 3 : l'ancienne carte bascule en mode legacy (zones infinies) ──
    G.currentStage = null;
    _stageEnded = false;

    // Aller à la zone du node
    G.zone = node.zone;
    G.monsterIndex = 0;
    G.isBoss = (node.type === 'boss');
    G.monsterHp = D(getMonsterMaxHp());
    G.monsterMaxHp = D(getMonsterMaxHp());
    updateHpBar(true);
    spawnMonster();
    invalidateStats();
    updateDisplays();
    // Refermer le panneau sur mobile pour revenir au combat
    if (window.innerWidth < 1024) closeDrawer();
    showNotif(`⚔ ${node.name} — Zone ${node.zone}`);
    markSaveDirty();
}

// Refresh WorldMap quand on l'ouvre
function onWorldMapOpen() {
    renderWorldMap();
}

/* §câblage : SPHERE_DEFS fourni par assets/globals.bundle.js (src/data) */


// ═══════════════════════════════════════════════════════════════════════════════
// §2.2 ① — LOOT PROCÉDURAL À AFFIXES (Diablo/PoE style)
// ═══════════════════════════════════════════════════════════════════════════════

/* §câblage : ITEM_RARITIES fourni par assets/globals.bundle.js (src/data) */

/* §câblage : ITEM_SLOTS fourni par assets/globals.bundle.js (src/data) */
/* §câblage : ITEM_SLOT_NAMES fourni par assets/globals.bundle.js (src/data) */
/* §câblage : ITEM_SLOT_ICONS fourni par assets/globals.bundle.js (src/data) */

// Table d'affixes — chaque affixe a id, label, stat ciblé, range de roll
/* §câblage : AFFIX_TABLE fourni par assets/globals.bundle.js (src/data) */

// Génère un item procédural aléatoire
function generateLootItem(zoneMod = 1) {
    // Rareté pondérée
    const totalWeight = Object.values(ITEM_RARITIES).reduce((s,r)=>s+r.dropWeight,0);
    let roll = Math.random() * totalWeight;
    let rarityKey = 'common';
    for (const [k,r] of Object.entries(ITEM_RARITIES)) {
        roll -= r.dropWeight;
        if (roll <= 0) { rarityKey = k; break; }
    }
    const rarity = ITEM_RARITIES[rarityKey];

    const slot = ITEM_SLOTS[Math.floor(Math.random() * ITEM_SLOTS.length)];
    const numAffixes = Math.max(1, Math.floor(Math.random() * rarity.maxAffixes) + 1);

    // Tire les affixes sans répétition
    const shuffled = [...AFFIX_TABLE].sort(() => Math.random() - 0.5);
    const affixes = shuffled.slice(0, numAffixes).map(a => ({
        id: a.id,
        label: a.label,
        stat: a.stat,
        // Roll pondéré vers le haut pour les rares+
        value: a.min + (a.max - a.min) * Math.pow(Math.random(), rarityKey === 'legendary' || rarityKey === 'mythic' ? 0.5 : 1)
    }));

    // Niveau d'upgrade (+0..+15) — commence à 0
    return {
        id: `item_${Date.now()}_${Math.floor(Math.random()*9999)}`,
        slot,
        rarity: rarityKey,
        upgrade: 0,       // +0 à +15
        affixes,
    };
}

// Calcule les stats totales d'un item (affixes × (1 + upgrade*0.05))
function getItemStats(item) {
    const upgradeMult = 1 + (item.upgrade || 0) * 0.05;
    const stats = {};
    item.affixes.forEach(a => {
        stats[a.stat] = (stats[a.stat] || 0) + a.value * upgradeMult;
    });
    return stats;
}

// Calcule les stats agrégées de tous les équipements d'un héros
function getHeroEquipStats(heroId) {
    const equipment = (G.heroEquipment && G.heroEquipment[heroId]) || {};
    const total = {};
    ITEM_SLOTS.forEach(slot => {
        const item = equipment[slot];
        if (!item) return;
        const stats = getItemStats(item);
        for (const [k,v] of Object.entries(stats)) total[k] = (total[k]||0)+v;
    });
    return total;
}

// Drop d'un item en fin de boss (appelé dans killMonster)
function tryDropLoot() {
    const dropChance = G.isBoss ? 0.80 : 0.12; // 80% boss, 12% normal
    if (Math.random() > dropChance) return;

    const item = generateLootItem(G.zone);
    if (!G.lootBag) G.lootBag = [];
    if (G.lootBag.length >= 50) G.lootBag.shift(); // max 50 items en sac
    G.lootBag.push(item);
    markSaveDirty();

    const r = ITEM_RARITIES[item.rarity];
    if (item.rarity !== 'common' && item.rarity !== 'magic') {
        showNotif(`${r.name} ${ITEM_SLOT_ICONS[item.slot]} ${ITEM_SLOT_NAMES[item.slot]} ${r.name} droppé !`);
    }
    _panelsDirty = true;
}

// Équipe un item sur un héros (remplace le slot)
function equipItem(heroId, item) {
    if (!G.heroEquipment) G.heroEquipment = {};
    if (!G.heroEquipment[heroId]) G.heroEquipment[heroId] = {};
    const old = G.heroEquipment[heroId][item.slot];
    if (old) {
        if (!G.lootBag) G.lootBag = [];
        G.lootBag.push(old); // retour en sac
    }
    G.heroEquipment[heroId][item.slot] = item;
    // Retirer du sac
    if (G.lootBag) G.lootBag = G.lootBag.filter(i => i.id !== item.id);
    invalidateStats();
    markSaveDirty();
    (markSaveDirty(), saveGame());
}

// Reroll d'un affixe aléatoire sur un item (coût : cristaux de zone)
function rerollItemAffix(item) {
    const cost = { fire_crystal: 2, water_crystal: 2, earth_crystal: 2 };
    for (const [mat, qty] of Object.entries(cost)) {
        if ((G.materials[mat]||0) < qty) { showNotif('❌ Matériaux insuffisants pour le reroll'); return false; }
    }
    for (const [mat, qty] of Object.entries(cost)) G.materials[mat] = (G.materials[mat]||0) - qty;
    const idx = Math.floor(Math.random() * item.affixes.length);
    const pool = AFFIX_TABLE.filter(a => a.id !== item.affixes[idx].id);
    const newAffix = pool[Math.floor(Math.random() * pool.length)];
    item.affixes[idx] = { id: newAffix.id, label: newAffix.label, stat: newAffix.stat,
        value: newAffix.min + (newAffix.max - newAffix.min) * Math.random() };
    markSaveDirty();
    return true;
}

// Upgrade d'un item +1 (coût: mimic)
function upgradeItem(item) {
    if ((item.upgrade || 0) >= 15) { showNotif('Upgrade maximum atteint (+15)'); return false; }
    const cost = Math.max(1, Math.floor((item.upgrade + 1) * 1.5));
    if ((G.materials.mimic||0) < cost) { showNotif(`❌ ${cost} Mimic requis`); return false; }
    G.materials.mimic -= cost;
    item.upgrade = (item.upgrade || 0) + 1;
    invalidateStats();
    markSaveDirty();
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2.2 ② — ARBRE DE COMPÉTENCES DU SUMMONER (méta-progression globale)
// ═══════════════════════════════════════════════════════════════════════════════

// Devise : Skill Points (SP) gagnés par boss kill et prestige
/* §câblage : SKILL_TREE_DEF fourni par assets/globals.bundle.js (src/data) */

// Calcule les bonus agrégés de l'arbre de l'invocateur
function getSkillTreeBonuses() {
    const unlocked = G.skillTreeUnlocked || {};
    const total = {};
    for (const [nodeId, nodeDef] of Object.entries(SKILL_TREE_DEF)) {
        if (!unlocked[nodeId]) continue;
        for (const [stat, val] of Object.entries(nodeDef.bonus)) {
            total[stat] = (total[stat] || 0) + val;
        }
    }
    return total;
}

function canUnlockSkillNode(nodeId) {
    const node = SKILL_TREE_DEF[nodeId];
    if (!node) return false;
    if ((G.skillTreeUnlocked||{})[nodeId]) return false; // déjà débloqué
    if ((G.skillPoints||0) < node.cost) return false;
    if (node.requires && !(G.skillTreeUnlocked||{})[node.requires]) return false;
    return true;
}

function unlockSkillNode(nodeId) {
    if (!canUnlockSkillNode(nodeId)) return false;
    const node = SKILL_TREE_DEF[nodeId];
    G.skillPoints = (G.skillPoints||0) - node.cost;
    if (!G.skillTreeUnlocked) G.skillTreeUnlocked = {};
    G.skillTreeUnlocked[nodeId] = true;
    invalidateStats();
    (markSaveDirty(), saveGame());
    showNotif(`✦ Nœud débloqué : ${node.name}`);
    return true;
}

// Réspec complet (coûte 10 gemmes)
function respecSkillTree() {
    if ((G.gems||0) < 10) { showNotif('❌ 10 Gemmes requis pour le Réspec'); return; }
    G.gems -= 10;
    const spent = Object.keys(G.skillTreeUnlocked||{}).reduce((s,k)=>{
        return s + (SKILL_TREE_DEF[k]?.cost||0);
    }, 0);
    G.skillPoints = (G.skillPoints||0) + spent;
    G.skillTreeUnlocked = {};
    invalidateStats();
    (markSaveDirty(), saveGame());
    showNotif('✦ Arbre réinitialisé — Points récupérés');
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2.2 ③ — PRESTIGE MULTI-COUCHES : Couche 2 Ascension + Couche 3 Paragon
// ═══════════════════════════════════════════════════════════════════════════════

// Couche 2 — Ascension : reset les cristaux de prestige → Essence Divine
// Déblocage : avoir fait au moins 5 prestiges
function canAscend() {
    return (G.totalPrestiges || 0) >= 5 && (G.prestigeCrystals || 0) >= 50;
}

function doAscension() {
    if (!canAscend()) { showNotif('❌ Requis : 5 Prestiges et 50 Cristaux'); return; }
    const essenceGained = Math.floor((G.prestigeCrystals || 0) / 10) + Math.floor((G.totalPrestiges||0) / 5);
    G.divineEssence   = (G.divineEssence   || 0) + essenceGained;
    G.totalAscensions = (G.totalAscensions || 0) + 1;
    // Reset couche 1
    G.prestigeCrystals = 0;
    G.prestigeBonus    = { dps: 0, gold: 0, extraSlot: 0 };
    // Bonus permanent : +1 slot squad si pas encore maxé par Ascension
    if (G.maxSquadSize < 6) G.maxSquadSize++;
    while (G.squad.length < G.maxSquadSize) G.squad.push(null);
    invalidateStats();
    (markSaveDirty(), saveGame());
    screenFlash('rgba(192,132,252,0.5)');
    showNotif(`🌟 Ascension ! +${essenceGained} Essence Divine — Squad élargie !`);
}

// Bonus passifs de l'Ascension (+5% DPS cumulatif par ascension)
function getAscensionBonus() {
    const n = G.totalAscensions || 0;
    return { dps_pct: n * 0.05, gold_pct: n * 0.03 };
}

// Couche 3 — Paragon : arbre infini (coût croissant, micro-bonus permanents)
// Déblocage : avoir fait au moins 1 Ascension
/* §câblage : PARAGON_CATEGORIES fourni par assets/globals.bundle.js (src/data) */

function getParagonCost(category) {
    const cat = PARAGON_CATEGORIES[category];
    const currentLevel = (G.paragonLevels||{})[category] || 0;
    return Math.ceil(cat.costBase * Math.pow(cat.costGrowth, currentLevel));
}

function getParagonBonus(category) {
    const level = (G.paragonLevels||{})[category] || 0;
    return level * 0.01; // +1% par niveau, infini
}

function canBuyParagon(category) {
    return (G.totalAscensions||0) >= 1 && (G.divineEssence||0) >= getParagonCost(category);
}

function buyParagon(category) {
    if (!canBuyParagon(category)) { showNotif('❌ Requis : 1 Ascension + Essence Divine'); return; }
    const cost = getParagonCost(category);
    G.divineEssence -= cost;
    if (!G.paragonLevels) G.paragonLevels = {};
    G.paragonLevels[category] = (G.paragonLevels[category]||0) + 1;
    invalidateStats();
    (markSaveDirty(), saveGame());
    showNotif(`⬆ Paragon ${PARAGON_CATEGORIES[category].label} Niv.${G.paragonLevels[category]}`);
}

// Agrège TOUS les bonus de Paragon
function getAllParagonBonuses() {
    const total = {};
    for (const cat of Object.keys(PARAGON_CATEGORIES)) {
        const stat = PARAGON_CATEGORIES[cat].stat;
        const bonus = getParagonBonus(cat);
        if (bonus > 0) total[stat] = (total[stat]||0) + bonus;
    }
    return total;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2.2 ④ — SPARK / BB CHAINING — Timing window + SBB/UBB tiers
// ═══════════════════════════════════════════════════════════════════════════════

// BB tiers par rang d'évolution du héros (stars)
// 3★ = BB · 4★ = BB · 5★ = SBB (Super) · 6★ = UBB (Ultimate)
function getBBTier(heroId) {
    const h = G.heroes[heroId];
    if (!h) return 'BB';
    if (h.stars >= 6) return 'UBB';
    if (h.stars >= 5) return 'SBB';
    return 'BB';
}

const BB_TIER_MULT  = { BB: 1.0, SBB: 1.8, UBB: 4.5 }; // multiplicateur de dégâts
const BB_TIER_LABEL = { BB: 'Brave Burst', SBB: 'Super BB', UBB: '⚡ ULTIMATE BB' };
const BB_TIER_COLOR = { BB: '#00d2ff', SBB: '#f1c40f', UBB: '#ff3366' };

// Fenêtre de Spark : si 2+ BBs déclenchés dans la window → Spark
const SPARK_WINDOW_MS = 1200; // 1,2 s
let _sparkBBLog = []; // timestamps des BBs déclenchés récemment

function recordBBForSpark(heroId) {
    const now = Date.now();
    _sparkBBLog.push({ heroId, t: now });
    // Purge les vieux enregistrements
    _sparkBBLog = _sparkBBLog.filter(e => now - e.t <= SPARK_WINDOW_MS);

    if (_sparkBBLog.length >= 2) {
        // SPARK détecté !
        const chainCount = _sparkBBLog.length;
        const sparkMult  = 1 + chainCount * 0.5; // ×1.5 pour 2, ×2.0 pour 3, ×2.5 pour 4
        const bonusBC    = chainCount * 10;

        // Bonus BC sur tout le squad
        G.squad.filter(id=>id&&G.heroes[id]).forEach(id => {
            const def = HERO_DEFS.find(d=>d.id===id);
            const bbCost = (def?.bb?.cost) || 100;
            if (!G.bbGauges[id]) G.bbGauges[id] = 0;
            G.bbGauges[id] = Math.min(100, G.bbGauges[id] + (bonusBC / bbCost) * 100);
        });

        // Applique le multiplicateur de dégâts via flag temporaire
        G._sparkMult = sparkMult;
        G._sparkExpiry = Date.now() + 3000; // actif 3s
        screenFlash('rgba(255,215,0,0.45)');
        showNotif(`✦ SPARK ×${chainCount} — Multiplicateur ×${sparkMult.toFixed(1)} (${SPARK_WINDOW_MS}ms window) !`);
        renderFooterBB();
        _sparkBBLog = []; // reset après spark
    }
}

// Récupère le multiplicateur Spark actif (1.0 si aucun)
function getActiveSparkMult() {
    if (G._sparkMult && G._sparkExpiry && Date.now() < G._sparkExpiry) return G._sparkMult;
    return 1.0;
}

// §1.6 — Source unique de vérité pour l'état initial
const DEFAULT_STATE = {
    gold: 0, gems: 15, honorPoints: 0, prestigeCrystals: 0, tapDamageLevel: 0, zone: 1, monsterIndex: 0, isBoss: false,
    monsterHp: 10, monsterMaxHp: 10, bossTimer: 30, heroes: {}, bbCooldowns: {},
    playerSkillsCd: { strike: 0, wealth: 0, frenzy: 0 },
    playerSkillsActive: { wealth: 0, frenzy: 0 },
    totalClicks: 0, totalKills: 0, bossKills: 0, totalGold: 0, totalPrestiges: 0, maxZone: 1, maxCombo: 0,
    achievementsClaimed: [], lastSave: 0,
    spheres: {},

    // Squad System
    squad: [null, null, null, null],
    leaderId: null,
    materials: {},
    bbGauges: {},
    partyHp: 100,
    partyMaxHp: 100,
    partyDef: 10,
    deathTimer: 0,
    monsterFrozen: 0,
    monsterDebuff: 0,

    // ── Login Bonus ──
    loginLastDate: null,
    loginPrevDate: null,
    loginStreak: 0,
    loginCycleDays: 0,

    // ── Quêtes Journalières ──
    dailyQuestDate: null,
    dailyQuestsProgress: [0,0,0],
    dailyQuestsClaimed: [false,false,false],
    dailyQuestsSnapshot: null,

    // ── Boss Hebdomadaire ──
    weeklyBossWeek: null,
    weeklyBossHp: 0,
    weeklyBossMaxHp: 0,
    weeklyBossDefeated: false,
    weeklyBossRewardClaimed: false,
    weeklyBossAttemptsToday: 0,
    weeklyBossAttemptsDate: null,

    // ── Compteur global BB pour quêtes ──
    totalBBUses: 0,

    // ── Pilier 4 : Profondeur Stratégique ──
    difficulty: 'normal',
    formation: 'avant-garde',

    // ── Améliorations 3.1–3.5 ──
    tutorialDone: false,
    tutorialStep: 0,
    pityCountRare: 0,
    pityCountS: 0,
    prestigeBonus: { dps: 0, gold: 0, extraSlot: 0 },
    maxSquadSize: 4,

    // §2.2 ① Loot procédural
    heroEquipment: {},  // { heroId: { slot: item } }
    lootBag: [],        // items en attente d'équipement

    // §2.2 ② Arbre de compétences
    skillPoints: 0,
    skillTreeUnlocked: {},

    // §2.2 ③ Ascension / Paragon
    divineEssence: 0,
    totalAscensions: 0,
    paragonLevels: {},

    // §2.2 ④ Spark (état transitoire — pas besoin de persister)
    _sparkMult: 1.0,
    _sparkExpiry: 0,

    // §4.2 — Rewarded Ads : caps journaliers
    // §4.3 — IAP
    iap: {
        noAdsPlus: false,       // 2.99€ — supprime les pubs + ×2 offline permanent + +25% or
        permGoldX2: false,      // 3.99€ — ×2 Or permanent
        permBCX2: false,        // 3.99€ — ×2 BC/HC permanent
        starterUsed: false,     // 0.99€ — one-shot starter pack
        battlePassSeason: null, // saison active (ex: "S1")
        battlePassPremium: false,
        battlePassDay: 0,       // jour actuel dans la saison (0-27)
        battlePassLastClaim: null // date dernière réclamation
    },

    adDate: null,           // date YYYY-MM-DD des caps
    adCaps: {
        offline: 0,         // ×2 gains offline          cap 1/retour → reset par retour
        goldBuff: 0,        // ×2 Or 30 min              cap 3/jour
        freeSummon: 0,      // Invocation gratuite        cap 1/jour
        lootReroll: 0,      // Reroll loot/affixe         cap 5/jour
        bossRevive: 0,      // Revive boss                cap 2/jour
        questDouble: 0,     // ×2 récompense quête        cap 1/quête (géré par idx)
        townReset: 0        // Recharge gisements Ville   cap 3/jour
    },

    // ── Hub & Ville : récolte de composants ──
    townNodes: { crystals: 5, idols: 5, totems: 5, mimics: 5 }, // charges par gisement
    townLastRegen: 0,       // timestamp ms dernière régénération (+1 charge / 10 min)

    // ── Identité du joueur (hub façon BF) ──
    playerName: '',         // pseudo (start-menu 1re partie / Paramètres)
    summonerLevel: 1,       // Rang d'Invocateur (EXP gagnée en terminant des stages — Phase 3)
    summonerExp: 0,

    // ── Système de Stages (Phase 2) ──
    stageProgress: {},      // { "areaIdx-stageIdx": { stars: 0-3, clears: n, bestTime: ms } }
    currentStage: null,     // { area, stage } — stage en cours, null = aucun
    goldBuffExpiry: 0,      // timestamp ms fin du buff ×2 Or
    adOfflinePending: 0,    // montant offline en attente doublement
    autoCombat: false       // combat automatique actif ou non
};

// §1.6 — Deep-merge : les clés de source écrasent target, objets imbriqués mergés récursivement
function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const key of Object.keys(source)) {
        const sv = source[key], tv = target[key];
        if (sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
            tv !== null && typeof tv === 'object' && !Array.isArray(tv)) {
            out[key] = deepMerge(tv, sv);
        } else {
            out[key] = sv;
        }
    }
    return out;
}

let G = deepMerge({}, DEFAULT_STATE);

function pulseCurrency(id) {
    const el = document.getElementById(id);
    if (!el) return;
    // §1.4 — Web Animations API : pas de reflow
    el.animate(
        [{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.22)',filter:'brightness(1.5)',offset:0.4},{transform:'scale(1)',filter:'brightness(1)'}],
        {duration:280, easing:'cubic-bezier(0.25,0.8,0.25,1)'}
    );
}

// §1.7 — _Dec / D / fmt RETIRÉS : désormais fournis par assets/globals.bundle.js (window._Dec/D/fmt). Voir WIRING_GUIDE.md

// =============================================================
// BGM MANAGER & SOUND EFFECT GENERATOR
// =============================================================
class BGMManagerClass {
    constructor() {
        this.currentTrack = null;
        this.tracks = {};
        this.muted = true;
    }

    setMute(muted) {
        this.muted = muted;
        Object.keys(this.tracks).forEach(key => {
            this.tracks[key].muted = muted;
        });
        this.update();
    }

    play(trackName) {
        if (this.muted) return;
        if (this.currentTrack === trackName) return;

        const prev = this.currentTrack;
        this.currentTrack = trackName;

        // Crossfade: fade out old track, fade in new one
        if (prev && this.tracks[prev]) {
            const old = this.tracks[prev];
            const fadeOut = setInterval(() => {
                if (old.volume > 0.03) { old.volume = Math.max(0, old.volume - 0.05); }
                else { old.pause(); old.volume = 0.35; clearInterval(fadeOut); }
            }, 50);
        }

        // Lazy load the audio track
        if (!this.tracks[trackName]) {
            try {
                const audio = new window.Audio(`music/${trackName}.mp3`);
                audio.loop = true;
                audio.volume = 0.35;
                audio.muted = this.muted;
                this.tracks[trackName] = audio;
            } catch (e) {
                console.warn(`Failed to create Audio for track: ${trackName}`, e);
                return;
            }
        }

        const track = this.tracks[trackName];
        if (!track) return;
        track.volume = 0;
        track.muted = false;
        track.currentTime = 0;
        track.play().catch(() => {});
        const fadeIn = setInterval(() => {
            if (track.volume < 0.32) { track.volume = Math.min(0.35, track.volume + 0.05); }
            else { track.volume = 0.35; clearInterval(fadeIn); }
        }, 50);
    }

    update() {
        if (this.muted) {
            Object.keys(this.tracks).forEach(k => this.tracks[k].pause());
            this.currentTrack = null;
            return;
        }

        const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
        const isModalOpen = document.getElementById('hero-modal').classList.contains('visible');

        if (activeTab === 'achievements' || activeTab === 'prestige' || activeTab === 'settings') {
            this.play('map');
        } else if (activeTab === 'gacha' || isModalOpen) {
            this.play('home');
        } else if (G.isBoss) {
            this.play('boss');
        } else {
            this.play('combat');
        }
    }
}
const BGM = new BGMManagerClass();

// Custom Sound Synthesizer Engine (Renamed to Sound to avoid shadowing native Audio)
class SoundEngineClass {
    constructor() { this.ctx = null; this.enabled = false; this.sfxMuted = false; }

    _boot() {
        if (this.ctx) {
            // Résoudre si suspendu (politique autoplay)
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.28;
            // Light reverb via convolver
            this.reverb = this.ctx.createConvolver();
            const len = this.ctx.sampleRate * 0.4;
            const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
            for (let c = 0; c < 2; c++) {
                const d = buf.getChannelData(c);
                for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
            }
            this.reverb.buffer = buf;
            const reverbGain = this.ctx.createGain(); reverbGain.gain.value = 0.18;
            this.reverb.connect(reverbGain); reverbGain.connect(this.master);
            this.master.connect(this.ctx.destination);
            this.enabled = true;
            // Résoudre immédiatement si le contexte démarre suspendu
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch(e) {}
    }

    // Appelé uniquement depuis un geste utilisateur
    init() { this._boot(); BGM.update(); }

    _osc(f, type, t, dur, vol, freqEnd) {
        if (!this.enabled) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(this.master); o.connect(this.reverb);
        o.start(t); o.stop(t + dur + 0.05);
    }

    _noise(t, dur, vol, freq) {
        if (!this.enabled) return;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = freq || 2000; filter.Q.value = 1.5;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(filter); filter.connect(g); g.connect(this.master);
        src.start(t); src.stop(t + dur);
    }

    // Sharp sword strike — metallic "clang" with noise burst
    playHit() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        this._noise(t, 0.06, 0.5, 1800);
        this._osc(220, 'sawtooth', t, 0.07, 0.3, 80);
        this._osc(110, 'square', t, 0.05, 0.2);
    }

    // Critical hit — loud crack + high metallic ring
    playCrit() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        this._noise(t, 0.04, 0.8, 3500);
        this._osc(800, 'square', t, 0.03, 0.35, 200);
        this._osc(1600, 'sine', t + 0.02, 0.18, 0.25, 400);
        this._osc(440, 'sawtooth', t, 0.12, 0.2, 100);
    }

    // Monster kill — triumphant rising chime
    playKill() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._osc(f, 'sine', t + i * 0.06, 0.25, 0.3));
        this._osc(523, 'triangle', t, 0.35, 0.15);
        this._noise(t, 0.05, 0.3, 800);
    }

    // Level up — classic RPG fanfare, bright and ascending
    playLevelUp() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        const melody = [523, 659, 784, 1047, 1319];
        melody.forEach((f, i) => {
            this._osc(f, 'triangle', t + i * 0.07, 0.22, 0.3);
            this._osc(f * 2, 'sine', t + i * 0.07, 0.12, 0.12);
        });
    }

    // Brave Burst — massive explosion, deep bass + high shimmer
    playBB() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        // Deep bass hit
        this._osc(80, 'sine', t, 0.6, 0.5, 40);
        this._osc(60, 'square', t, 0.4, 0.4, 30);
        // Power chord
        [261, 329, 392, 523].forEach((f, i) => this._osc(f, 'sawtooth', t + 0.03, 0.4, 0.2));
        // High shimmer
        this._osc(2093, 'sine', t + 0.05, 0.3, 0.15, 800);
        // Noise burst
        this._noise(t, 0.12, 0.7, 1200);
        this._noise(t + 0.1, 0.2, 0.4, 400);
    }

    // Summon — magical sparkle rising, mystical
    playSummon() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        const sparkle = [440, 554, 659, 880, 1108, 1318, 1760];
        sparkle.forEach((f, i) => {
            this._osc(f, 'sine', t + i * 0.08, 0.6, 0.25);
            this._osc(f * 1.5, 'triangle', t + i * 0.08 + 0.03, 0.2, 0.1);
        });
        this._noise(t + 0.2, 0.4, 0.2, 5000);
    }

    // Claim reward — coin jingle, bright and satisfying
    playClaim() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        [880, 1108, 1318].forEach((f, i) => this._osc(f, 'sine', t + i * 0.05, 0.18, 0.28));
        this._osc(1760, 'triangle', t + 0.15, 0.25, 0.2);
        this._noise(t, 0.04, 0.3, 4000);
    }

    // Prestige — dramatic orchestral swell + impact
    playPrestige() {
        if (!this.enabled || this.sfxMuted) return; const t = this.ctx.currentTime;
        // Low rumble
        this._osc(55, 'sine', t, 0.8, 0.4, 110);
        this._osc(110, 'square', t + 0.1, 0.6, 0.3);
        // Mid choir-like swell
        [220, 277, 330, 440].forEach((f, i) => this._osc(f, 'triangle', t + 0.2 + i * 0.05, 0.7, 0.2));
        // Final high shimmer
        this._osc(1760, 'sine', t + 0.5, 0.6, 0.2, 2200);
        this._noise(t + 0.15, 0.5, 0.5, 600);
        this._noise(t, 0.1, 0.6, 2000);
    }
}
const Sound = new SoundEngineClass();

function toggleBGM() {
    Sound.init();
    BGM.setMute(!BGM.muted);
}

// =============================================================
// PARAMÈTRES
// =============================================================
function openSettingsTab() {
    Sound.init();
    openDrawer('settings');
    BGM.update();
}

function toggleSettingsBGM() {
    Sound.init();
    BGM.setMute(!BGM.muted);
    const btn = document.getElementById('settings-bgm-toggle');
    btn.textContent = BGM.muted ? 'OFF' : 'ON';
    btn.className = 'toggle-btn ' + (BGM.muted ? 'off' : 'on');
}

function toggleSettingsSFX() {
    Sound.sfxMuted = !Sound.sfxMuted;
    const btn = document.getElementById('settings-sfx-toggle');
    btn.textContent = Sound.sfxMuted ? 'OFF' : 'ON';
    btn.className = 'toggle-btn ' + (Sound.sfxMuted ? 'off' : 'on');
    if (!Sound.sfxMuted) Sound.playClaim(); // petit son de confirmation
}

function renderSettingsPanel() {
    // Pseudo : préremplir avec le nom actuel
    const nameInput = document.getElementById('settings-name-input');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = G.playerName || '';
    const bgmBtn = document.getElementById('settings-bgm-toggle');
    if (bgmBtn) {
        bgmBtn.textContent = BGM.muted ? 'OFF' : 'ON';
        bgmBtn.className = 'toggle-btn ' + (BGM.muted ? 'off' : 'on');
    }
    const sfxBtn = document.getElementById('settings-sfx-toggle');
    if (sfxBtn) {
        sfxBtn.textContent = Sound.sfxMuted ? 'OFF' : 'ON';
        sfxBtn.className = 'toggle-btn ' + (Sound.sfxMuted ? 'off' : 'on');
    }
    // §4.2 — Refresh ad boost button labels
    _resetAdCapsIfNeeded();
    const goldBtn = document.getElementById('ad-gold-buff-btn');
    if (goldBtn) {
        const remaining = AD_CAPS_MAX.goldBuff - (G.adCaps.goldBuff || 0);
        const buffActive = G.goldBuffExpiry > Date.now();
        if (buffActive) {
            const secsLeft = Math.ceil((G.goldBuffExpiry - Date.now()) / 1000);
            const m = Math.floor(secsLeft / 60), s = secsLeft % 60;
            goldBtn.innerHTML = `⚡ ×2 Or ACTIF — ${m}m${s.toString().padStart(2,'0')}s restant`;
            goldBtn.disabled = true; goldBtn.style.opacity = '0.6';
        } else if (remaining <= 0) {
            goldBtn.innerHTML = `📺 ×2 Or 30 min &nbsp;<span style="opacity:.7;font-size:11px;">(limite atteinte)</span>`;
            goldBtn.disabled = true; goldBtn.style.opacity = '0.45';
        } else {
            goldBtn.innerHTML = `📺 ×2 Or pendant 30 min &nbsp;<span style="opacity:.7;font-size:11px;">(${remaining}/jour restant)</span>`;
            goldBtn.disabled = false; goldBtn.style.opacity = '1';
        }
    }
    const fsBtn = document.getElementById('ad-free-summon-btn');
    if (fsBtn) {
        const fsRemaining = AD_CAPS_MAX.freeSummon - (G.adCaps.freeSummon || 0);
        fsBtn.disabled = fsRemaining <= 0;
        fsBtn.style.opacity = fsRemaining <= 0 ? '0.45' : '1';
        fsBtn.textContent = fsRemaining <= 0
            ? '📺 Invocation Gratuite — utilisée aujourd\'hui'
            : '📺 Invocation Gratuite (pub) — 1/jour';
    }
    // §5.1 — Mettre à jour les statistiques à chaque ouverture
    renderStats();
}

function confirmReset() {
    if (confirm('⚠️ Supprimer définitivement toute ta progression ?\n\nCette action est irréversible.')) {
        G._resetPending = true;
        // Vider localStorage immédiatement
        localStorage.removeItem('bf_clicker_v4');
        localStorage.removeItem('bf_clicker_backup');
        // Écraser la sauvegarde IDB avec une sentinelle 'RESET'
        // (plus fiable que deleteDatabase qui peut être bloqué par une connexion ouverte)
        _idbOpen().then(db => {
            const tx = db.transaction(_IDB_STORE, 'readwrite');
            tx.objectStore(_IDB_STORE).put('RESET', _IDB_KEY);
            tx.oncomplete = () => { db.close(); location.reload(); };
            tx.onerror    = () => { db.close(); location.reload(); };
        }).catch(() => { location.reload(); });
    }
}

function showNotif(msg) {
    const el = document.getElementById('notif-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 2200);
}

// =============================================================
// PARTICLES & FLYING CRYSTALS ENGINE
// =============================================================
const pCanvas = document.getElementById('particle-canvas'); const pCtx = pCanvas.getContext('2d'); let particles = [];
function resizeP() {
    pCanvas.width  = pCanvas.offsetWidth  || 540;
    pCanvas.height = pCanvas.offsetHeight || 380;
}
resizeP();
window.addEventListener('resize', resizeP);
function spawnParticles(x,y,opts={}) { const c=opts.count||10, s=opts.speed||250, col=opts.colors||['#fff'], sz=opts.size||3, l=opts.life||0.5, g=opts.gravity!==undefined?opts.gravity:250; for(let i=0;i<c;i++){ const a=Math.random()*Math.PI*2, sp=(Math.random()*0.7+0.3)*s; particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-s*0.3,life:l,maxLife:l,size:sz*(0.6+Math.random()*0.8),color:col[Math.floor(Math.random()*col.length)],gravity:g}); } }

function spawnCrystalParticle(x, y, type) {
    const color = type === 'BC' ? '#00d2ff' : '#2ecc71';
    const canvasRect = pCanvas.getBoundingClientRect();
    let targetX = pCanvas.width / 2;
    let targetY = pCanvas.height + 150;
    
    if (type === 'HC') {
        const hpBar = document.getElementById('party-hp-bar-fill');
        if (hpBar) {
            const rect = hpBar.getBoundingClientRect();
            targetX = rect.left + rect.width / 2 - canvasRect.left;
            targetY = rect.top - 10 - canvasRect.top;
        }
    } else {
        const squadBar = document.getElementById('footer-bb-slots');
        if (squadBar && squadBar.children.length > 0) {
            const index = Math.floor(Math.random() * squadBar.children.length);
            const rect = squadBar.children[index].getBoundingClientRect();
            targetX = rect.left + rect.width / 2 - canvasRect.left;
            targetY = rect.top + rect.height / 2 - canvasRect.top;
        }
    }
    
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 280, // Enhanced horizontal fan-out spread
        vy: -180 - Math.random() * 120, // Dynamic vertical pop
        life: 1.8,
        maxLife: 1.8,
        size: 5,
        color: color,
        isCrystal: true,
        crystalType: type,
        targetX: targetX,
        targetY: targetY
    });
}

let lpt = performance.now();
function updateP(now) {
    const dt = Math.min(0.05, (now - lpt) / 1000);
    lpt = now;
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    // 4. AMBIANCE MÉTÉO POUR CHAQUE BIOME
    if (G.zone) {
        const theme = ZONE_THEMES[(G.zone - 1) % ZONE_THEMES.length];
        const elem = theme ? theme.elem : 'Feu';
        if (elem === 'Feu' && Math.random() < 0.08) {
            // Fines cendres orange qui montent
            particles.push({
                x: Math.random() * pCanvas.width,
                y: pCanvas.height + 10,
                vx: (Math.random() - 0.5) * 40,
                vy: -40 - Math.random() * 50,
                life: 3, maxLife: 3,
                size: 2 + Math.random() * 3,
                color: `hsl(${15 + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%)`,
                gravity: 0, isWeather: true
            });
        } else if ((elem === 'Foudre' || elem === 'Eau') && Math.random() < 0.15) {
            // Gouttes de pluie diagonales rapides
            particles.push({
                x: Math.random() * pCanvas.width,
                y: -10,
                vx: 80 + Math.random() * 40,
                vy: 300 + Math.random() * 150,
                life: 2, maxLife: 2,
                size: 1 + Math.random() * 1.5,
                color: 'rgba(174, 219, 255, 0.4)',
                gravity: 0, isWeather: true, isRain: true
            });
        } else if (elem === 'Ténèbres' && Math.random() < 0.05) {
            // Volutes de brume violette
            particles.push({
                x: Math.random() * pCanvas.width,
                y: pCanvas.height - 30 - Math.random() * 60,
                vx: (Math.random() - 0.5) * 20,
                vy: -10 - Math.random() * 15,
                life: 4, maxLife: 4,
                size: 6 + Math.random() * 8,
                color: `rgba(${130 + Math.random() * 40}, 50, ${200 + Math.random() * 50}, 0.15)`,
                gravity: 0, isWeather: true, isMist: true
            });
        } else if (elem === 'Lumière' && Math.random() < 0.06) {
            // Étincelles dorées douces qui descendent
            particles.push({
                x: Math.random() * pCanvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 30,
                vy: 20 + Math.random() * 30,
                life: 5, maxLife: 5,
                size: 2.5 + Math.random() * 2.5,
                color: `rgba(255, 235, 150, ${0.3 + Math.random() * 0.4})`,
                gravity: 0, isWeather: true, isSparkle: true
            });
        } else if (elem === 'Terre' && Math.random() < 0.05) {
            // Spores vertes flottantes
            particles.push({
                x: Math.random() * pCanvas.width,
                y: pCanvas.height + 10,
                vx: (Math.random() - 0.5) * 50,
                vy: -30 - Math.random() * 40,
                life: 4, maxLife: 4,
                size: 2.5 + Math.random() * 2.5,
                color: `hsl(${90 + Math.random() * 30}, 75%, ${50 + Math.random() * 15}%)`,
                gravity: 0, isWeather: true
            });
        }
    }

    particles = particles.filter(p => {
        p.life -= dt;
        if (p.life <= 0) return false;
        
        if (p.isCrystal) {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 20 || p.life < 0.1) {
                if (p.crystalType === 'BC') addBC(1);
                else healParty(Math.ceil(G.partyMaxHp * 0.02));
                
                // 5. ANIMATION D'IMPACT RÉACTIVE (BC/HC EXPLOSION DE PIXELS)
                const blastColors = p.crystalType === 'BC' ? ['#00d2ff', '#ffffff'] : ['#2ecc71', '#ffffff'];
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const sp = 60 + Math.random() * 80;
                    particles.push({
                        x: p.x,
                        y: p.y,
                        vx: Math.cos(angle) * sp,
                        vy: Math.sin(angle) * sp,
                        life: 0.3, maxLife: 0.3,
                        size: 2 + Math.random() * 2,
                        color: blastColors[Math.floor(Math.random() * blastColors.length)],
                        gravity: 100
                    });
                }
                return false;
            }
            
            p.vx += (dx / dist) * 700 * dt;
            p.vy += (dy / dist) * 700 * dt;
            const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
            if (speed > 450) {
                p.vx = (p.vx / speed) * 450;
                p.vy = (p.vy / speed) * 450;
            }
        } else {
            p.vy += p.gravity * dt;
        }
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        const a = p.life / p.maxLife;
        pCtx.globalAlpha = a;
        pCtx.fillStyle = p.color;
        
        if (p.isRain) {
            // Dessin sous forme de fil de pluie oblique
            pCtx.strokeStyle = p.color;
            pCtx.lineWidth = p.size;
            pCtx.beginPath();
            pCtx.moveTo(p.x, p.y);
            pCtx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
            pCtx.stroke();
        } else {
            pCtx.beginPath();
            if (p.isCrystal) {
                pCtx.moveTo(p.x, p.y - p.size);
                pCtx.lineTo(p.x + p.size, p.y);
                pCtx.lineTo(p.x, p.y + p.size);
                pCtx.lineTo(p.x - p.size, p.y);
            } else if (p.isMist) {
                // Brume avec un peu plus de volume
                pCtx.arc(p.x, p.y, p.size * (1 + (1 - a) * 0.5), 0, Math.PI * 2);
            } else {
                pCtx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
            }
            pCtx.fill();
        }
        return true;
    });
    pCtx.globalAlpha = 1;
}
// updateP est appelée par masterFrame — pas de rAF autonome ici

// =============================================================
// INITIALIZATIONS, SAVING & UTILITIES
// =============================================================
function getHeroImage(id, stars, context = 'full') {
    const mapping = {
        ignis: {
            unit: 'Unité/Ignis-trois-etoile (1).png',
            squad: 'Squad img/Ignis-trois-etoile.png',
            full: 'full img/Ignis-trois-etoile.png'
        },
        vargas: {
            unit: 'Unité/vargas-trois-etoile (1).png',
            squad: 'Squad img/vargas-trois-etoile (1).png',
            full: 'full img/Vargas-trois-etoile.png'
        },
        selena: {
            unit: 'Unité/Selena-trois-etoile (1).png',
            squad: 'Squad img/Selena-trois-etoile.png',
            full: 'full img/Selena-trois-etoile.png'
        },
        margonia: {
            unit: 'Unité/Margonia-trois-etoile (1).png',
            squad: 'Squad img/margonia-trois-etoile.png',
            full: 'full img/Margonia-trois-etoile.png'
        },
        elimo: {
            unit: 'Unité/Margonia-trois-etoile (1).png',
            squad: 'Squad img/margonia-trois-etoile.png',
            full: 'full img/Margonia-trois-etoile.png'
        },
        lance: {
            unit: 'Unité/Lance-trois-etoile (1).png',
            squad: 'Squad img/Lance-trois-etoile.png',
            full: 'full img/Lance_trois_etoile.png'
        },
        zeln: {
            unit: 'Unité/Zeln_trois_etoile (1).png',
            squad: 'Squad img/Zeln_trois_etoile.png',
            full: 'full img/Zeln_trois_etoile.png'
        },
        karl: {
            unit: 'Unité/Karl-trois-etoile (1).png',
            squad: 'Squad img/Karl-trois-etoile.png',
            full: 'full img/Karl-trois-etoile.png'
        },
        eze: {
            unit: 'Unité/Eze-trois-etoile.png',
            squad: 'Squad img/Eza-trois-etoile.png',
            full: 'full img/Eza_trois_etoile.png'
        },
        sera: {
            unit: 'Unité/Sera-trois-etoile (1).png',
            squad: 'Squad img/Sera-trois-etoile.png',
            full: 'full img/Sera-trois-etoile.png'
        },
        atro: {
            unit: 'Unité/Atro-trois-etoile (1).png',
            squad: 'Squad img/Atro-trois-etoile.png',
            full: 'full img/Atro-trois-etoile.png'
        },
        magress: {
            unit: 'Unité/Magress-trois-etoile (1).png',
            squad: 'Squad img/Magress-trois-etoile.png',
            full: 'full img/Magress-trois-etoile.png'
        },
        kikuri: {
            unit: 'Unité/Kikuri-trois-etoile (1).png',
            squad: 'Squad img/Kikuri-trois-etoile.png',
            full: 'full img/Kikuri-trois-etoile.png'
        }
    };
    
    const hero = mapping[id];
    if (hero) {
        // Contexte demandé → sinon unit → sinon squad → sinon first available
        const path = hero[context] || hero.squad || hero.unit || hero.full;
        if (path) {
            // Encode chaque segment du chemin pour gérer espaces et accents (é, etc.)
            const encoded = path.split('/').map(s => encodeURIComponent(s)).join('/');
            return `assets/heroes/${encoded}`;
        }
    }
    // Fallback générique : essaie {id}.png (existe pour ignis, eze, karl, lance, selena, sera)
    return `assets/heroes/${id}.png`;
}

function initHero(forcedType = null) {
    const t = forcedType || HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)];
    const inst = { level: 1, stars: 3, duplicates: 0, limitBreak: 0, type: t, equippedSphere: null };
    return inst;
}

// =============================================================
// SAVE / LOAD — VERSIONÉ (§3.3)
// =============================================================
const SAVE_VERSION = 5;

function migrateSave(s) {
    s._v = s._v || 1;
    if (s._v < 2) {
        // Migration elimo -> margonia (déplacée ici pour être versionnée)
        if (s.heroes && s.heroes.elimo) {
            s.heroes.margonia = s.heroes.elimo;
            delete s.heroes.elimo;
        }
        if (s.squad) s.squad = s.squad.map(id => id === 'elimo' ? 'margonia' : id);
        if (s.bbGauges && s.bbGauges.elimo !== undefined) {
            s.bbGauges.margonia = s.bbGauges.elimo;
            delete s.bbGauges.elimo;
        }
        if (s.leaderId === 'elimo') s.leaderId = 'margonia';
        s._v = 2;
    }
    if (s._v < 5) {
        // Normaliser chaque héros avec les champs par défaut
        Object.values(s.heroes || {}).forEach(h => {
            if (h.duplicates === undefined) h.duplicates = 0;
            if (h.type === undefined) h.type = 'Lord';
            if (h.equippedSphere === undefined) h.equippedSphere = null;
        });
        s._v = SAVE_VERSION;
    }
    return s;
}

// §1.6 — IndexedDB helpers
const _IDB_NAME = 'bf_clicker', _IDB_STORE = 'save', _IDB_KEY = 'v4';
function _idbOpen() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(_IDB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(_IDB_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}
function _idbGet(db) {
    return new Promise((res, rej) => {
        const tx = db.transaction(_IDB_STORE, 'readonly');
        const req = tx.objectStore(_IDB_STORE).get(_IDB_KEY);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}
function _idbPut(db, val) {
    return new Promise((res, rej) => {
        const tx = db.transaction(_IDB_STORE, 'readwrite');
        const req = tx.objectStore(_IDB_STORE).put(val, _IDB_KEY);
        req.onsuccess = () => res();
        req.onerror   = e => rej(e.target.error);
    });
}

// §1.6 — Applique les données sauvegardées sur G via deepMerge
function _applyLoadedData(raw) {
    const parsed = migrateSave(JSON.parse(raw));
    G = deepMerge(DEFAULT_STATE, parsed);
    // §1.2 — Sécuriser partyHp nul ou absent dans vieilles sauvegardes
    if (!G.partyHp || G.partyHp <= 0) G.partyHp = G.partyMaxHp || 100;
    // Extend squad array to match unlocked slots
    while (G.squad.length < G.maxSquadSize) G.squad.push(null);
    // §1.5 — Reconvertir valeurs _Dec après désérialisation JSON
    G.gold         = D(G.gold         || 0);
    G.totalGold    = D(G.totalGold    || 0);
    G.monsterHp    = D(G.monsterHp    || 10);
    G.monsterMaxHp = D(G.monsterMaxHp || 10);
    // §2.2① — Tampon _id sur chaque héros (requis pour l'application de l'équipement)
    Object.keys(G.heroes || {}).forEach(id => { if (G.heroes[id] && typeof G.heroes[id] === 'object') G.heroes[id]._id = id; });
}

// §1.6 — Charge depuis IndexedDB (async), fallback localStorage synchrone au boot
async function loadGameAsync() {
    try {
        const db  = await _idbOpen();
        const raw = await _idbGet(db);
        db.close();
        if (raw === 'RESET') { return false; } // sentinelle reset — partie vierge
        if (raw) { _applyLoadedData(raw); return true; }
    } catch (e) { console.warn('[IDB] lecture échouée, fallback localStorage', e); }
    // fallback localStorage
    return loadGame();
}

function loadGame() {
    try {
        const d = localStorage.getItem('bf_clicker_v4');
        if (!d) return false;
        _applyLoadedData(d);
        return true;
    } catch (e) {
        console.warn('Sauvegarde corrompue, démarrage neuf', e);
        return false;
    }
}

// §1.6 — Dirty flag : ne sérialiser que si l'état a changé
let _saveDirty = false;
function markSaveDirty() { _saveDirty = true; }

function _doSave(force) {
    if (G._resetPending) return;
    G.lastSave = Date.now();
    const json = JSON.stringify(G);
    // Écriture IndexedDB (async, sans bloquer le thread)
    _idbOpen().then(db => _idbPut(db, json).then(() => db.close())).catch(() => {});
    // Fallback localStorage synchrone (filet de sécurité)
    try {
        const existing = localStorage.getItem('bf_clicker_v4');
        if (existing) localStorage.setItem('bf_clicker_backup', existing);
        localStorage.setItem('bf_clicker_v4', json);
    } catch (e) { console.warn('Erreur de sauvegarde localStorage', e); }
}

function saveGame(force) {
    if (!force && !_saveDirty) return;
    _saveDirty = false;
    if (!force && typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(_doSave, { timeout: 2000 });
    } else {
        _doSave(force);
    }
}

// §3.4 — Autosave périodique gérée par la boucle maître (voir masterFrame) + fermeture de l'onglet
window.addEventListener('beforeunload', () => { markSaveDirty(); saveGame(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { markSaveDirty(); saveGame(true); } });
setInterval(() => { markSaveDirty(); saveGame(); }, 15000); // autosave périodique toutes les 15s

// =============================================================
// STATS & ECONOMY BALANCING
// =============================================================
// Axe 2 : courbe XP plus raide selon le palier d'étoiles
function getHeroLevelCost(def, hData) {
    // §1.5 — retourne D (50 * 1.30^150 ≈ 6e18, au-delà de 2^53)
    const rates = [0, 0, 0, 1.15, 1.19, 1.24, 1.30];
    const rate = rates[hData.stars] || 1.15;
    return D(def.baseCost).mul(Math.pow(rate, hData.level)).floor();
}

// Calcule le coût total pour N niveaux à partir du niveau actuel (sans limite d'or)
function calcBulkCost(def, h, levels) {
    let total = 0;
    for (let i = 0; i < levels; i++) total += getHeroLevelCost(def, { level: h.level + i });
    return total;
}

// Calcule combien de niveaux on peut acheter avec l'or disponible (plafonné à maxLvl)
function calcAffordableLevels(def, h, maxLevels) {
    const cap = EVO_LEVEL_CAPS[h.stars];
    const limit = Math.min(maxLevels, cap - h.level);
    let total = 0, count = 0;
    for (let i = 0; i < limit; i++) {
        const cost = getHeroLevelCost(def, { level: h.level + i });
        if (D(G.gold).lt(D(total).add(cost))) break; // §1.5
        total += cost; count++;
    }
    return { count, cost: total };
}

function getElementKey(elem) {
    if (!elem) return 'fire';
    const clean = elem.toLowerCase();
    if (clean.includes('feu') || clean === 'fire') return 'fire';
    if (clean.includes('eau') || clean === 'water') return 'water';
    if (clean.includes('terre') || clean === 'earth') return 'earth';
    if (clean.includes('foudre') || clean === 'thunder') return 'thunder';
    if (clean.includes('lumière') || clean.includes('lumiere') || clean === 'light') return 'light';
    if (clean.includes('ténèbres') || clean.includes('tenebres') || clean === 'dark') return 'dark';
    return 'fire';
}

function getHeroStats(def, hData) {
    const role = def.role || 'mage';
    const level = hData.level || 1;
    const limitBreak = hData.limitBreak !== undefined ? hData.limitBreak : (hData.duplicates || 0);
    const stars = hData.stars || 3;
    
    // Budget scaling with stars: 50% increase per star above 3★
    const budgetTotal = def.baseBudget * Math.pow(1.5, stars - 3);
    
    // Distribution ratios by Role
    let dpsRatio = 0.75, hpRatio = 0.15, defRatio = 0.10;
    if (role === 'tank') {
        dpsRatio = 0.15; hpRatio = 0.50; defRatio = 0.35;
    } else if (role === 'support') {
        dpsRatio = 0.40; hpRatio = 0.35; defRatio = 0.25;
    }
    
    // Raw base stats
    const dpsBrute = budgetTotal * dpsRatio;
    const hpBrute = budgetTotal * hpRatio;
    const defBrute = budgetTotal * defRatio;
    
    // Level scaling: +10% per level above 1
    const levelFactor = 1 + (level - 1) * 0.1;
    let dpsNiveau = dpsBrute * levelFactor;
    let hpNiveau = hpBrute * levelFactor;
    let defNiveau = defBrute * levelFactor;
    
    // Limit Break scaling: +5% per duplicate (cumulative)
    const lbFactor = 1 + (limitBreak * 0.05);
    let dpsFinal = dpsNiveau * lbFactor;
    let hpFinal = hpNiveau * lbFactor;
    let defFinal = defNiveau * lbFactor;
    
    // §2.1 — Courbe exponentielle lisse normalisée : même puissance à niveau 100, sans falaise
    // base = 1920^(1/100) ≈ 1.07853 ; Éveils I/II/III = cosmétiques uniquement (pas de multiplicateur)
    const HERO_EXP_BASE = 1.07853;
    const smoothFactor = Math.pow(HERO_EXP_BASE, level - 1); // = 1 au niveau 1, = 1920 au niveau 100
    dpsFinal *= smoothFactor;

    // Sphere modifier (legacy support)
    if (hData.equippedSphere && SPHERE_DEFS[hData.equippedSphere]) {
        const sphereMult = SPHERE_DEFS[hData.equippedSphere].multiplier || 1;
        dpsFinal *= sphereMult;
        hpFinal *= sphereMult;
        defFinal *= sphereMult;
    }

    // §2.2 ① — Équipement procédural affixes
    const heroId = (hData._id) ? hData._id : null;
    if (heroId) {
        const eqStats = getHeroEquipStats(heroId);
        if (eqStats.dps_pct)  dpsFinal *= (1 + eqStats.dps_pct);
        if (eqStats.hp_pct)   hpFinal  *= (1 + eqStats.hp_pct);
        if (eqStats.crit_dmg) dpsFinal *= (1 + eqStats.crit_dmg * 0.5); // 50% du bonus crit dmg contribue au DPS passif
    }

    // §2.2 ② — Arbre de compétences global
    const stBonuses = getSkillTreeBonuses();
    if (stBonuses.dps_pct)  dpsFinal *= (1 + stBonuses.dps_pct);
    if (stBonuses.hp_pct)   hpFinal  *= (1 + stBonuses.hp_pct);

    // §2.2 ③ — Bonus d'Ascension et Paragon
    const ascBonus = getAscensionBonus();
    const parBonus = getAllParagonBonuses();
    dpsFinal *= (1 + (ascBonus.dps_pct||0) + (parBonus.dps_pct||0));
    hpFinal  *= (1 + (parBonus.hp_pct||0));
    
    return {
        dps: Math.max(1, Math.floor(dpsFinal)),
        hp: Math.max(1, Math.floor(hpFinal * 18)),   // Scale HP for realistic RPG look
        def: Math.max(1, Math.floor(defFinal * 1.5))  // Scale DEF to balance boss attacks
    };
}

// §1.3 — Cache dirty-flag (évite recalcul à chaque tick de simulate)
let _squadStatsCache = null, _squadStatsDirty = true;
let _totalDpsCache   = null, _totalDpsDirty   = true;

function invalidateStats() {
    _squadStatsDirty = true;
    _totalDpsDirty   = true;
}

function _computeSquadStats() {
    let squadDps = 0;
    let squadMaxHp = 0;
    let squadDef = 0;
    
    const activeSquadIds = G.squad.filter(Boolean);
    const leaderId = G.squad[0] || null;
    const leaderHero = leaderId ? G.heroes[leaderId] : null;
    const leaderDef = leaderId ? HERO_DEFS.find(d => d.id === leaderId) : null;
    const hasLeaderSkill = leaderDef && leaderDef.leaderSkill;
    
    const activeHeroesStats = activeSquadIds.filter(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const h = G.heroes[id];
        return def && h && h.level != null;
    }).map(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const h = G.heroes[id];
        h._id = id; // §2.2① FIX — sans _id, getHeroStats ne trouve pas l'équipement → affixes sans effet
        const stats = getHeroStats(def, h);
        return { id, def, h, stats };
    });
    
    const elements = activeHeroesStats.map(x => getElementKey(x.def.element));
    
    // Alliance Sacrée: contains at least one light AND dark unit -> +20% BC/HC spawn rate
    let hasAllianceSacree = elements.includes('light') && elements.includes('dark');
    G.allianceSacreeActive = hasAllianceSacree;
    
    // Mono-Élémentaire (Monolithe) and Duo checks
    const uniqueElements = [...new Set(elements)];
    let isMonolithe = activeSquadIds.length >= 1 && uniqueElements.length === 1;
    
    const elemCounts = {};
    elements.forEach(el => { elemCounts[el] = (elemCounts[el] || 0) + 1; });
    
    activeHeroesStats.forEach(x => {
        let dps = x.stats.dps;
        let hp = x.stats.hp;
        let def = x.stats.def;
        
        // Element Advantage check
        const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;
        const zoneElemKey = getElementKey(currentZoneElem);
        const unitElemKey = getElementKey(x.def.element);
        
        let hasAdvantage = false;
        if (unitElemKey === 'fire' && zoneElemKey === 'earth') hasAdvantage = true;
        else if (unitElemKey === 'earth' && zoneElemKey === 'thunder') hasAdvantage = true;
        else if (unitElemKey === 'thunder' && zoneElemKey === 'water') hasAdvantage = true;
        else if (unitElemKey === 'water' && zoneElemKey === 'fire') hasAdvantage = true;
        else if (unitElemKey === 'light' && zoneElemKey === 'dark') hasAdvantage = true;
        else if (unitElemKey === 'dark' && zoneElemKey === 'light') hasAdvantage = true;
        
        if (hasAdvantage) {
            dps *= 1.5;
        }
        
        // Leader Skill
        if (hasLeaderSkill) {
            const ls = leaderDef.leaderSkill;
            let isTarget = false;
            if (ls.target === 'all') {
                isTarget = true;
            } else if (ls.target === 'element') {
                isTarget = unitElemKey === getElementKey(ls.targetDetail);
            } else if (ls.target === 'role') {
                isTarget = x.def.role === ls.targetDetail;
            }
            
            if (isTarget) {
                if (ls.statModifier === 'dps') {
                    dps *= (1 + ls.modifierValue);
                } else if (ls.statModifier === 'pv') {
                    hp *= (1 + ls.modifierValue);
                } else if (ls.statModifier === 'def') {
                    def *= (1 + ls.modifierValue);
                }
            }
        }
        
        // Duo Élémentaire: +25% DPS and +15% PV if exactly 2 share this element
        if (elemCounts[unitElemKey] === 2) {
            dps *= 1.25;
            hp *= 1.15;
        }
        
        squadDps += dps;
        squadMaxHp += hp;
        squadDef += def;
    });
    
    // Mono-Élémentaire (Monolithe): +50% DPS global, but -20% DEF global
    if (isMonolithe) {
        squadDps *= 1.50;
        squadDef *= 0.80;
    }
    
    return {
        dps: Math.max(1, Math.floor(squadDps)),
        maxHp: Math.max(10, Math.floor(squadMaxHp)),
        def: Math.max(1, Math.floor(squadDef))
    };
}

function getSquadStats() {
    if (_squadStatsDirty) { _squadStatsCache = _computeSquadStats(); _squadStatsDirty = false; }
    return _squadStatsCache;
}

function getHeroDPS(def, hData) {
    const stats = getHeroStats(def, hData);
    let dps = stats.dps;
    
    const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;
    const zoneElemKey = getElementKey(currentZoneElem);
    const unitElemKey = getElementKey(def.element);
    
    let hasAdvantage = false;
    if (unitElemKey === 'fire' && zoneElemKey === 'earth') hasAdvantage = true;
    else if (unitElemKey === 'earth' && zoneElemKey === 'thunder') hasAdvantage = true;
    else if (unitElemKey === 'thunder' && zoneElemKey === 'water') hasAdvantage = true;
    else if (unitElemKey === 'water' && zoneElemKey === 'fire') hasAdvantage = true;
    else if (unitElemKey === 'light' && zoneElemKey === 'dark') hasAdvantage = true;
    else if (unitElemKey === 'dark' && zoneElemKey === 'light') hasAdvantage = true;
    
    if (hasAdvantage) dps *= 1.5;
    
    if (G.leaderId && G.heroes[G.leaderId]) {
        const lDef = HERO_DEFS.find(d => d.id === G.leaderId);
        if (lDef && lDef.leaderSkill) {
            const ls = lDef.leaderSkill;
            let isTarget = false;
            if (ls.target === 'all') isTarget = true;
            else if (ls.target === 'element') isTarget = unitElemKey === getElementKey(ls.targetDetail);
            else if (ls.target === 'role') isTarget = def.role === ls.targetDetail;
            
            if (isTarget && ls.statModifier === 'dps') {
                dps *= (1 + ls.modifierValue);
            }
        }
    }
    
    if (G.squad.includes(def.id)) {
        const elements = G.squad.filter(Boolean).map(id => {
            const d = HERO_DEFS.find(x => x.id === id);
            return d ? getElementKey(d.element) : '';
        });
        const elemCounts = {};
        elements.forEach(el => { elemCounts[el] = (elemCounts[el] || 0) + 1; });
        if (elemCounts[unitElemKey] === 2) {
            dps *= 1.25;
        }
        const uniqueElements = [...new Set(elements)];
        if (uniqueElements.length === 1) {
            dps *= 1.50;
        }
    }
    
    return Math.floor(dps);
}

// =============================================================
// =============================================================
// BRAVE BURST — MOTEUR DE PARTICULES CANVAS2D
// =============================================================
const BB_THEMES = {
    'Feu':      { c1:'#ff4500', c2:'#ff9500', c3:'#ffcc00', bg:'rgba(80,10,0,0.82)',   type:'fire'      },
    'Eau':      { c1:'#00b4ff', c2:'#00e5ff', c3:'#ffffff', bg:'rgba(0,20,60,0.82)',   type:'water'     },
    'Terre':    { c1:'#7ec850', c2:'#c8a020', c3:'#d4c080', bg:'rgba(15,30,5,0.82)',   type:'earth'     },
    'Foudre':   { c1:'#ffe000', c2:'#ffffff', c3:'#80c0ff', bg:'rgba(10,10,40,0.88)',  type:'lightning' },
    'Lumière':  { c1:'#ffffff', c2:'#ffe566', c3:'#ffd700', bg:'rgba(40,30,5,0.78)',   type:'light'     },
    'Ténèbres': { c1:'#c060ff', c2:'#7020d0', c3:'#200040', bg:'rgba(5,0,20,0.90)',    type:'dark'      },
};

let _bbAnimId = null;

function triggerBBCanvas(elem, heroName, dmgFmt) {
    const canvas = document.getElementById('bb-canvas');
    if (!canvas) return;
    const ov = document.getElementById('bb-overlay');
    const theme = BB_THEMES[elem] || BB_THEMES['Feu'];

    // Size canvas to overlay
    const rect = ov.getBoundingClientRect();
    const W = canvas.width  = Math.round(rect.width  || 360);
    const H = canvas.height = Math.round(rect.height || 500);
    const cx = W / 2, cy = H * 0.48;

    const ctx = canvas.getContext('2d');
    if (_bbAnimId) { cancelAnimationFrame(_bbAnimId); _bbAnimId = null; }
    ctx.clearRect(0, 0, W, H);

    // Labels
    const heroLabel   = document.getElementById('bb-hero-label');
    const burstLabel  = document.getElementById('bb-burst-label');
    const dmgEl       = document.querySelector('.bb-dmg-text');
    if (heroLabel)  { heroLabel.textContent = heroName; heroLabel.style.color = theme.c2; }
    if (burstLabel) { burstLabel.style.color = theme.c1; burstLabel.style.textShadow = `0 0 20px ${theme.c1}`; }

    // Background fade
    const bgEl = ov.querySelector('.bb-bg');
    if (bgEl) { bgEl.style.background = theme.bg.replace('rgba','rgb').replace(/,[^,]+\)$/,')'); bgEl.style.opacity = '0.88'; }

    // ── Particles ──────────────────────────────────────────────
    const particles = [];
    const rings     = [];

    function rand(a, b) { return a + Math.random() * (b - a); }
    function hex(c) { return c; }

    // Phase timers
    let t = 0; // ms since start
    const PHASE_IMPACT = 120;
    const PHASE_END    = 1600;

    function spawnBurst(count, phase) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            let speed, life, size, trail, color, shape;

            if (theme.type === 'fire') {
                speed = rand(1.5, 6); size = rand(2, 7); life = rand(0.5, 1);
                color = [theme.c1, theme.c2, theme.c3][Math.floor(rand(0,3))];
                trail = 0.88; shape = 'circle';
            } else if (theme.type === 'water') {
                speed = rand(1, 4); size = rand(2, 5); life = rand(0.6, 1.1);
                color = [theme.c1, theme.c2, theme.c3][Math.floor(rand(0,3))];
                trail = 0.92; shape = i % 5 === 0 ? 'ring' : 'circle';
            } else if (theme.type === 'earth') {
                speed = rand(1.5, 5); size = rand(3, 9); life = rand(0.5, 0.9);
                color = [theme.c1, theme.c2, theme.c3][Math.floor(rand(0,3))];
                trail = 0.90; shape = 'square'; // rock fragments
            } else if (theme.type === 'lightning') {
                speed = rand(3, 9); size = rand(1, 4); life = rand(0.2, 0.6);
                color = [theme.c1, theme.c2][Math.floor(rand(0,2))];
                trail = 0.78; shape = 'line';
            } else if (theme.type === 'light') {
                speed = rand(2, 7); size = rand(1.5, 5); life = rand(0.5, 1.0);
                color = [theme.c1, theme.c2, theme.c3][Math.floor(rand(0,3))];
                trail = 0.85; shape = i % 4 === 0 ? 'star' : 'circle';
            } else { // dark
                speed = rand(0.8, 4); size = rand(2, 8); life = rand(0.6, 1.2);
                color = [theme.c1, theme.c2, theme.c3][Math.floor(rand(0,3))];
                trail = 0.94; shape = 'circle';
            }

            particles.push({
                x: cx + rand(-8, 8), y: cy + rand(-8, 8),
                vx: Math.cos(angle) * speed * (phase === 'converge' ? -1 : 1),
                vy: Math.sin(angle) * speed * (phase === 'converge' ? -1 : 1) - (theme.type === 'fire' ? rand(0.5, 2) : 0),
                size, color, life, maxLife: life,
                trail, shape, alpha: 1,
                gravity: theme.type === 'earth' ? rand(0.05, 0.18) : theme.type === 'fire' ? -0.04 : 0,
                rot: rand(0, Math.PI * 2), rotV: rand(-0.1, 0.1),
            });
        }
    }

    function spawnRing(radius, color, width, life) {
        rings.push({ r: radius, maxR: radius * 3.5, color, width, life, maxLife: life });
    }

    function spawnLightningBolt(fromX, fromY, toX, toY, color, segs) {
        const bolt = [];
        for (let i = 0; i <= segs; i++) {
            const f = i / segs;
            bolt.push({
                x: fromX + (toX - fromX) * f + (i > 0 && i < segs ? rand(-20, 20) : 0),
                y: fromY + (toY - fromY) * f + (i > 0 && i < segs ? rand(-20, 20) : 0),
            });
        }
        particles.push({ type: 'bolt', pts: bolt, color, life: 0.3, maxLife: 0.3, alpha: 1, trail: 1 });
    }

    function spawnDarkTendril(angle) {
        const pts = [{ x: cx, y: cy }];
        let px = cx, py = cy, a = angle;
        for (let i = 0; i < 12; i++) {
            a += rand(-0.4, 0.4);
            px += Math.cos(a) * rand(8, 18);
            py += Math.sin(a) * rand(8, 18);
            pts.push({ x: px, y: py });
        }
        particles.push({ type: 'tendril', pts, color: theme.c1, life: rand(0.6, 1.0), maxLife: 1.0, alpha: 1, width: rand(2, 5) });
    }

    // Initial impact burst
    spawnBurst(80, 'explode');
    spawnRing(10, theme.c1, 4, 0.8);
    spawnRing(10, theme.c2, 2, 1.1);

    if (theme.type === 'lightning') {
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            spawnLightningBolt(cx, cy, cx + Math.cos(a) * W * 0.7, cy + Math.sin(a) * H * 0.7, theme.c1, 8);
        }
    }
    if (theme.type === 'dark') {
        for (let i = 0; i < 10; i++) spawnDarkTendril((i / 10) * Math.PI * 2);
    }

    let lastT = performance.now();
    let phase2Done = false;

    function draw(now) {
        const dt = Math.min(now - lastT, 33); lastT = now;
        t += dt;

        // Fade-redraw (trail effect)
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, W, H);

        // Draw rings
        for (let i = rings.length - 1; i >= 0; i--) {
            const rng = rings[i];
            rng.r += (rng.maxR - 10) * 0.06;
            rng.life -= dt / 1000;
            if (rng.life <= 0) { rings.splice(i, 1); continue; }
            const a = Math.max(0, rng.life / rng.maxLife);
            ctx.beginPath();
            ctx.arc(cx, cy, rng.r, 0, Math.PI * 2);
            ctx.strokeStyle = rng.color;
            ctx.globalAlpha = a * 0.7;
            ctx.lineWidth = rng.width * a;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt / 1000;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            const a = Math.max(0, p.life / p.maxLife);

            if (p.type === 'bolt') {
                ctx.beginPath();
                ctx.moveTo(p.pts[0].x, p.pts[0].y);
                p.pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = a;
                ctx.lineWidth = 2 * a;
                ctx.shadowColor = p.color; ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                continue;
            }
            if (p.type === 'tendril') {
                ctx.beginPath();
                ctx.moveTo(p.pts[0].x, p.pts[0].y);
                p.pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = a * 0.7;
                ctx.lineWidth = p.width * a;
                ctx.shadowColor = p.color; ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                continue;
            }

            p.x += p.vx; p.y += p.vy;
            p.vy += p.gravity || 0;
            p.vx *= 0.97; p.vy *= 0.97;
            p.rot += p.rotV || 0;

            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 8;

            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * a * 0.6 + p.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.shape === 'square') {
                const s = p.size * (a * 0.5 + 0.5);
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                ctx.fillRect(-s/2, -s/2, s, s);
                ctx.restore();
            } else if (p.shape === 'ring') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
                ctx.stroke();
            } else if (p.shape === 'line') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
                ctx.strokeStyle = p.color; ctx.lineWidth = p.size * a;
                ctx.stroke();
            } else if (p.shape === 'star') {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                const r1 = p.size * (a * 0.5 + 0.5), r2 = r1 * 0.4, pts2 = 4;
                ctx.beginPath();
                for (let k = 0; k < pts2 * 2; k++) {
                    const r = k % 2 === 0 ? r1 : r2;
                    const ang = (k / (pts2 * 2)) * Math.PI * 2 - Math.PI / 2;
                    k === 0 ? ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r) : ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
                }
                ctx.closePath(); ctx.fill();
                ctx.restore();
            }
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }

        // Secondary burst at impact
        if (!phase2Done && t >= PHASE_IMPACT) {
            phase2Done = true;
            spawnBurst(60, 'explode');
            spawnRing(8, theme.c2, 3, 0.6);
            if (theme.type === 'water') spawnRing(8, theme.c3, 1.5, 0.9);
            if (theme.type === 'lightning') {
                for (let i = 0; i < 5; i++) {
                    const a = rand(0, Math.PI * 2);
                    spawnLightningBolt(cx, cy, cx + Math.cos(a) * rand(W*0.3, W*0.6), cy + Math.sin(a) * rand(H*0.3, H*0.5), theme.c2, 6);
                }
            }
            if (theme.type === 'dark') {
                for (let i = 0; i < 6; i++) spawnDarkTendril(rand(0, Math.PI * 2));
            }
        }

        // Central glow
        const glowA = t < PHASE_IMPACT ? t / PHASE_IMPACT
                    : t < 500 ? 1
                    : Math.max(0, 1 - (t - 500) / 600);
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        grd.addColorStop(0, theme.c2 + 'cc');
        grd.addColorStop(0.4, theme.c1 + '44');
        grd.addColorStop(1, 'transparent');
        ctx.globalAlpha = glowA * 0.6;
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        if (t < PHASE_END && (particles.length > 0 || rings.length > 0 || t < 800)) {
            _bbAnimId = requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, W, H);
            _bbAnimId = null;
        }
    }

    _bbAnimId = requestAnimationFrame(draw);
}

// =============================================================
// TEAM BUILDER MODAL
// =============================================================
let _tbFilter = 'all';
let _tbDragHeroId = null;
let _tbDragSlotIdx = null;

function openTeamBuilder() {
    document.getElementById('team-builder-modal').classList.remove('hidden');
    _tbFilter = 'all';
    renderTeamBuilder();
}

function closeTeamBuilder() {
    document.getElementById('team-builder-modal').classList.add('hidden');
    renderSquadGrid();
    updatePartyStats();
    renderSynergies();
    (markSaveDirty(), saveGame());
}

function tbSetFilter(elem) {
    _tbFilter = elem;
    document.querySelectorAll('.tb-filter-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.elem === elem);
    });
    renderTbRoster();
}

function renderTeamBuilder() {
    renderTbSquad();
    renderTbRoster();
}

function renderTbSquad() {
    const row = document.getElementById('tb-squad-row');
    if (!row) return;
    const maxSlots = Math.max(4, G.maxSquadSize || 4);
    while (G.squad.length < maxSlots) G.squad.push(null);
    row.innerHTML = '';

    for (let i = 0; i < maxSlots; i++) {
        const heroId = G.squad[i];
        const slot = document.createElement('div');
        slot.className = 'tb-slot' + (heroId ? ' filled' : '') + (i === 0 && heroId ? ' leader' : '');
        slot.dataset.slotIdx = i;

        if (heroId) {
            const def = HERO_DEFS.find(d => d.id === heroId);
            const h   = G.heroes[heroId];
            const img = document.createElement('img');
            img.src = getHeroImage(heroId, h ? h.stars : 3, 'squad');
            img.className = 'tb-slot-img';
            img.onerror = () => { img.style.opacity = '0.3'; img.onerror = null; };

            const name = document.createElement('div');
            name.className = 'tb-slot-name';
            name.textContent = def ? def.name : heroId;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'tb-slot-remove';
            removeBtn.title = 'Retirer';
            removeBtn.textContent = '✕';
            removeBtn.onclick = (e) => { e.stopPropagation(); tbRemoveSlot(i); };

            slot.appendChild(img);
            slot.appendChild(name);
            slot.appendChild(removeBtn);

            if (i === 0) {
                const badge = document.createElement('div');
                badge.className = 'tb-slot-badge';
                badge.textContent = '★ LEAD';
                slot.appendChild(badge);
            } else {
                const promoteBtn = document.createElement('div');
                promoteBtn.className = 'tb-slot-promote';
                promoteBtn.textContent = '☆ Lead';
                promoteBtn.onclick = (e) => { e.stopPropagation(); tbPromoteLeader(i); };
                slot.appendChild(promoteBtn);
            }
        } else {
            const emptyIcon = document.createElement('div');
            emptyIcon.className = 'tb-slot-empty-icon';
            emptyIcon.textContent = '+';
            slot.appendChild(emptyIcon);
            const emptyLabel = document.createElement('div');
            emptyLabel.style.cssText = 'font-size: 11px;color:rgba(255,255,255,0.2);';
            emptyLabel.textContent = `Slot ${i+1}`;
            slot.appendChild(emptyLabel);
        }

        // Drag & drop as drop target (for reordering slots)
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault(); slot.classList.remove('drag-over');
            const toIdx = parseInt(slot.dataset.slotIdx);
            if (_tbDragHeroId !== null) {
                // Coming from roster
                tbAddHeroToSlot(_tbDragHeroId, toIdx);
                _tbDragHeroId = null;
            } else if (_tbDragSlotIdx !== null && _tbDragSlotIdx !== toIdx) {
                // Reordering slots
                const tmp = G.squad[_tbDragSlotIdx];
                G.squad[_tbDragSlotIdx] = G.squad[toIdx];
                G.squad[toIdx] = tmp;
                if (G.squad[0]) G.leaderId = G.squad[0];
                _tbDragSlotIdx = null;
                renderTeamBuilder();
            }
        });

        // Make filled slot draggable for reorder
        if (heroId) {
            slot.setAttribute('draggable', 'true');
            slot.addEventListener('dragstart', () => { _tbDragSlotIdx = i; _tbDragHeroId = null; slot.style.opacity='0.5'; });
            slot.addEventListener('dragend',   () => { _tbDragSlotIdx = null; slot.style.opacity='1'; });
        }

        row.appendChild(slot);
    }
}

function renderTbRoster() {
    const roster = document.getElementById('tb-roster');
    if (!roster) return;
    roster.innerHTML = '';

    const ownedIds = Object.keys(G.heroes).filter(id => G.heroes[id]);
    const filtered = _tbFilter === 'all' ? ownedIds : ownedIds.filter(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        return def && def.elem === _tbFilter;
    });

    if (filtered.length === 0) {
        roster.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;grid-column:1/-1;padding:20px;">Aucun héros disponible</div>';
        return;
    }

    // Sort: squad first, then by stars desc
    filtered.sort((a, b) => {
        const aIn = G.squad.includes(a) ? 1 : 0;
        const bIn = G.squad.includes(b) ? 1 : 0;
        if (aIn !== bIn) return bIn - aIn;
        const aS = G.heroes[a]?.stars || 0;
        const bS = G.heroes[b]?.stars || 0;
        return bS - aS;
    });

    filtered.forEach(heroId => {
        const def = HERO_DEFS.find(d => d.id === heroId);
        const h   = G.heroes[heroId];
        if (!def || !h) return;

        const isLeader   = G.squad[0] === heroId;
        const inSquad    = G.squad.includes(heroId);
        const squadSlot  = G.squad.indexOf(heroId);
        const maxSlots   = Math.max(4, G.maxSquadSize || 4);
        const squadFull  = G.squad.filter(Boolean).length >= maxSlots;

        const card = document.createElement('div');
        card.className = 'tb-hero-card' + (isLeader ? ' in-squad-leader' : inSquad ? ' in-squad' : '');
        card.setAttribute('draggable', 'true');

        const img = document.createElement('img');
        img.src = getHeroImage(heroId, h.stars, 'squad');
        img.className = 'tb-hero-img';
        img.onerror = () => { img.style.opacity = '0.3'; img.onerror = null; };

        const name = document.createElement('div');
        name.className = 'tb-hero-name';
        name.textContent = def.name;

        const stars = document.createElement('div');
        stars.className = 'tb-hero-stars';
        stars.textContent = '★'.repeat(h.stars);

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(stars);

        if (isLeader) {
            const badge = document.createElement('div');
            badge.className = 'tb-hero-leader-badge';
            badge.textContent = '★ Lead';
            card.appendChild(badge);
        } else if (inSquad) {
            const badge = document.createElement('div');
            badge.className = 'tb-hero-in-badge';
            badge.textContent = `S${squadSlot+1}`;
            card.appendChild(badge);
        }

        // Click behaviour
        card.onclick = () => {
            if (inSquad) {
                // Remove from squad
                G.squad[squadSlot] = null;
                if (isLeader && G.squad.some(Boolean)) {
                    const nextLead = G.squad.find(Boolean);
                    const idx = G.squad.indexOf(nextLead);
                    G.squad[idx] = null;
                    G.squad.unshift(nextLead);
                    G.squad = G.squad.slice(0, maxSlots);
                }
                G.leaderId = G.squad[0] || null;
                renderTeamBuilder();
            } else if (!squadFull) {
                tbAddHeroToSlot(heroId, -1);
            } else {
                showNotif('❌ Squad pleine ! Retire un héros d\'abord.');
            }
        };

        // Drag from roster to slot
        card.addEventListener('dragstart', () => { _tbDragHeroId = heroId; _tbDragSlotIdx = null; card.classList.add('dragging'); });
        card.addEventListener('dragend',   () => { _tbDragHeroId = null; card.classList.remove('dragging'); });

        roster.appendChild(card);
    });
}

function tbAddHeroToSlot(heroId, slotIdx) {
    const maxSlots = Math.max(4, G.maxSquadSize || 4);
    while (G.squad.length < maxSlots) G.squad.push(null);

    // If hero already in squad, ignore
    if (G.squad.includes(heroId)) { renderTeamBuilder(); return; }

    if (slotIdx >= 0 && slotIdx < maxSlots) {
        // Place in specific slot (drag & drop)
        const existing = G.squad[slotIdx];
        if (existing) {
            // Swap: put existing in first free slot
            const freeIdx = G.squad.indexOf(null);
            if (freeIdx >= 0) G.squad[freeIdx] = existing;
        }
        G.squad[slotIdx] = heroId;
    } else {
        // Add to first empty slot
        const freeIdx = G.squad.indexOf(null);
        if (freeIdx < 0) { showNotif('❌ Squad pleine !'); return; }
        G.squad[freeIdx] = heroId;
    }

    G.leaderId = G.squad[0] || null;
    Sound.init(); Sound.playClaim();
    renderTeamBuilder();
}

function tbRemoveSlot(slotIdx) {
    const maxSlots = Math.max(4, G.maxSquadSize || 4);
    const removed = G.squad[slotIdx];
    G.squad[slotIdx] = null;
    // If we removed the leader (slot 0), promote slot 1
    if (slotIdx === 0 && G.squad.some(Boolean)) {
        const nextLead = G.squad.find(Boolean);
        const idx = G.squad.indexOf(nextLead);
        G.squad[idx] = null;
        G.squad.unshift(nextLead);
        G.squad = G.squad.slice(0, maxSlots);
    }
    G.leaderId = G.squad[0] || null;
    Sound.init(); Sound.playClaim();
    renderTeamBuilder();
}

function tbPromoteLeader(slotIdx) {
    const heroId = G.squad[slotIdx];
    if (!heroId) return;
    G.squad[slotIdx] = G.squad[0];
    G.squad[0] = heroId;
    G.leaderId = heroId;
    Sound.init(); Sound.playClaim();
    renderTeamBuilder();
}

// =============================================================
// AMÉLIORATIONS 3.1–3.5 — TUTORIAL, OBJECTIF, PITY, PRESTIGE CHOICE, EVO BAR
// =============================================================

// ── 3.1 TUTORIEL ─────────────────────────────────────────────
const TUTORIAL_STEPS = [
    { id:1, arrow:'⬆️', msg:'Clique sur le <b>monstre</b> pour l\'attaquer !',             target:'#monster-zone',              check:() => (G.totalClicks||0) >= 1 },
    { id:2, arrow:'⬇️', msg:'Ouvre l\'onglet <b>Héros</b> et achète ton premier guerrier !', target:'.tab-btn[data-tab="heroes"]', check:() => Object.keys(G.heroes||{}).length >= 2 },
    { id:3, arrow:'⬇️', msg:'Dans le panneau Héros, intègre un héros dans ta <b>Squad</b> !', target:'#squad-grid',              check:() => (G.squad||[]).filter(Boolean).length >= 2 },
    { id:4, arrow:'⬇️', msg:'Remplis la <b>jauge BB</b> puis utilise-la !',                 target:'#footer-bb-slots',           check:() => (G.totalBBUses||0) >= 1 },
    { id:5, arrow:'⬆️', msg:'Excellent ! Élimine les <b>5 monstres</b> pour terminer le stage !', target:'#monster-zone',        check:() => Object.values(G.stageProgress||{}).some(p => (p.clears||0) >= 1) },
];
let _tutorialPollTimer = null;

function initTutorial() {
    if (G.tutorialDone) return;
    if (!G.tutorialStep) { G.tutorialStep = 1; }
    renderTutorialStep(G.tutorialStep);
    clearInterval(_tutorialPollTimer);
    _tutorialPollTimer = setInterval(() => {
        if (G.tutorialDone) { clearInterval(_tutorialPollTimer); return; }
        const step = TUTORIAL_STEPS.find(s => s.id === G.tutorialStep);
        if (step && step.check && step.check()) advanceTutorial();
    }, 600);
}

function renderTutorialStep(stepId) {
    const step = TUTORIAL_STEPS.find(s => s.id === stepId);
    if (!step) return;
    const banner = document.getElementById('tutorial-banner');
    if (!banner) return;
    banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:18px;">${step.arrow}</span>
            <span style="color:rgba(255,255,255,0.4);font-size:10px;">TUTO ${stepId}/5</span>
            <span style="flex:1;font-size:12px;line-height:1.4;">${step.msg}</span>
            <button onclick="skipTutorial()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;padding:4px 10px;font-size:10px;cursor:pointer;">Passer ✕</button>
        </div>`;
    banner.classList.add('visible');
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    const t = document.querySelector(step.target);
    if (t) t.classList.add('tutorial-highlight');
}

function advanceTutorial() {
    G.tutorialStep = (G.tutorialStep || 1) + 1;
    if (G.tutorialStep > 5) { skipTutorial(); return; }
    renderTutorialStep(G.tutorialStep);
    (markSaveDirty(), saveGame());
}

function skipTutorial() {
    G.tutorialDone = true; G.tutorialStep = 6; (markSaveDirty(), saveGame());
    clearInterval(_tutorialPollTimer);
    const banner = document.getElementById('tutorial-banner');
    if (banner) banner.classList.remove('visible');
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
}

// ── 3.1 BARRE D'OBJECTIF ─────────────────────────────────────
/* §câblage : OBJECTIVES fourni par assets/globals.bundle.js (src/data) */

function renderObjectiveBar() {
    const bar = document.getElementById('objective-bar');
    if (!bar) return;
    const obj = OBJECTIVES.find(o => G.maxZone < o.zone);
    if (!obj) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    const prevIdx = OBJECTIVES.indexOf(obj) - 1;
    const from = prevIdx >= 0 ? OBJECTIVES[prevIdx].zone : 1;
    const pct  = Math.min(100, Math.round(((G.maxZone - from) / (obj.zone - from)) * 100));
    const tEl  = document.getElementById('obj-text');
    const fEl  = document.getElementById('obj-bar-fill');
    const pEl  = document.getElementById('obj-pct');
    if (tEl) tEl.textContent = obj.label;
    if (fEl) fEl.style.width = pct + '%';
    if (pEl) pEl.textContent = pct + '%';
}

// ── 3.2 GACHA PITY ────────────────────────────────────────────
function updatePityDisplay() {
    const countEl = document.getElementById('pity-rare-text');
    const progEl  = document.getElementById('pity-rare-progress');
    if (!countEl || !progEl) return;
    const c  = G.pityCountRare || 0;
    const cs = G.pityCountS    || 0;
    countEl.textContent = `Invocations sans rare : ${c}`;
    if (cs >= 45)   progEl.innerHTML = `<span style="color:#ef4444">⚡ Tier S garanti prochaine !</span>`;
    else if (c >= 7) progEl.innerHTML = `<span style="color:#34d399">Tier A garanti dans ${10-c} !</span>`;
    else             progEl.textContent = `Pity A dans ${10-c}  ·  Pity S dans ${50-cs}`;
}

function _applyPityAndRoll() {
    G.pityCountRare = (G.pityCountRare || 0) + 1;
    G.pityCountS    = (G.pityCountS    || 0) + 1;

    const isPityS = G.pityCountS  >= 50;
    const isPityA = G.pityCountRare >= 10;

    const roll = Math.random();
    const isNatS = roll < 0.10;

    if (isPityS || isNatS) {
        G.pityCountS = 0; G.pityCountRare = 0;
        const pool = SUMMON_POOLS.S;
        return { type:'hero_S', heroId: pool[Math.floor(Math.random()*pool.length)] };
    }
    if (isPityA || roll < 0.35) {
        G.pityCountRare = 0;
        const pool = SUMMON_POOLS.A;
        return { type:'hero_A', heroId: pool[Math.floor(Math.random()*pool.length)] };
    }
    if (roll < 0.65) {
        const sKeys = Object.keys(SPHERE_DEFS);
        return { type:'sphere', sId: sKeys[Math.floor(Math.random()*sKeys.length)] };
    }
    const allMats = Object.keys(MATERIAL_DEFS);
    const hiMats  = allMats.filter(k => k.includes('_totem') || k==='mimic');
    const pool    = hiMats.length ? hiMats : allMats;
    return { type:'material', mId: pool[Math.floor(Math.random()*pool.length)] };
}

function _grantPityResult(r, quiet) {
    if (r.type === 'hero_S' || r.type === 'hero_A') {
        const def = HERO_DEFS.find(d => d.id === r.heroId);
        if (!def) return;
        if (G.heroes[r.heroId]) {
            G.heroes[r.heroId].duplicates = (G.heroes[r.heroId].duplicates||0)+1;
        } else {
            G.heroes[r.heroId] = initHero(undefined, r.heroId); // §2.2 ①
            const slot = G.squad.indexOf(null);
            if (slot >= 0) { G.squad[slot] = r.heroId; if (slot===0) G.leaderId = r.heroId; }
        }
    } else if (r.type === 'sphere') {
        if (!G.spheres[r.sId])   G.spheres[r.sId]   = 0;
        G.spheres[r.sId]++;
    } else if (r.type === 'material') {
        if (!G.materials[r.mId]) G.materials[r.mId] = 0;
        G.materials[r.mId]++;
    }
}

function summonRare10() {
    if (G.gems < 45) { showNotif('❌ Pas assez de gemmes ! (45 nécessaires)'); return; }
    G.gems -= 45; updateDisplays();

    const results = [];
    for (let i = 0; i < 9; i++) results.push(_applyPityAndRoll());
    // Last pull: force at least Tier A
    let last = _applyPityAndRoll();
    if (last.type !== 'hero_S' && last.type !== 'hero_A') {
        G.pityCountRare = 0;
        const pool = SUMMON_POOLS.A;
        last = { type:'hero_A', heroId: pool[Math.floor(Math.random()*pool.length)] };
    }
    results.push(last);

    // Find best hero result for the animated reveal
    const heroResults = results.filter(r => r.type.startsWith('hero'));
    const bestHero = heroResults.length ? heroResults[heroResults.length-1] : null;

    results.forEach(r => {
        if (r === bestHero) return; // revealed animated below
        _grantPityResult(r, true);
    });

    const heroCount = heroResults.length;
    if (bestHero) {
        const stars = bestHero.type === 'hero_S' ? 6 : 5;
        triggerSummonAnimation(stars, () => _grantSummonedHero(bestHero.heroId));
    } else {
        _grantPityResult(results[9], false);
    }

    updatePityDisplay(); (markSaveDirty(), saveGame());
    renderMaterialsPanel(); renderHeroesGrid();
    showNotif(`✦ ×10 invoqué ! ${heroCount} héros obtenus !`);
}

// ── 3.3 BARRE PROGRESSION ÉVOLUTION ──────────────────────────
function renderEvoProgressBar(heroId) {
    const h   = G.heroes[heroId];
    const def = HERO_DEFS.find(d => d.id === heroId);
    const section = document.getElementById('hm-evo-progress');
    if (!section || !h || !def) return;
    if (h.stars >= 6) { section.style.display='none'; return; }

    section.style.display = 'block';
    const nextStars = h.stars + 1;
    const lvlCap    = EVO_LEVEL_CAPS[h.stars] || 40;
    const goldCost  = EVO_COSTS[h.stars]       || 0;
    const zoneGate  = EVO_ZONE_GATES ? (EVO_ZONE_GATES[nextStars]||0) : 0;
    const reqs      = getEvolutionRequirements ? getEvolutionRequirements(def.elem, h.stars) : [];

    document.getElementById('hm-evo-target-stars').textContent = nextStars + '★';

    // Level bar
    const lvlPct = Math.min(100, Math.round((h.level / lvlCap) * 100));
    const lvlBar = document.getElementById('hm-evo-lvl-bar');
    if (lvlBar) { lvlBar.style.width = lvlPct+'%'; lvlBar.style.background = h.level>=lvlCap ? '#34d399':'#00d2ff'; }
    const lvlVal = document.getElementById('hm-evo-lvl-val');
    if (lvlVal) { lvlVal.textContent = `${h.level} / ${lvlCap}`; lvlVal.style.color = h.level>=lvlCap?'#34d399':'#ef4444'; }

    // Zone gate
    const zoneOk  = G.maxZone >= zoneGate;
    const zoneVal = document.getElementById('hm-evo-zone-val');
    if (zoneVal) {
        zoneVal.textContent = zoneGate>1 ? `Zone ${zoneGate}${zoneOk?' ✓':` (actuelle: ${G.maxZone})`}` : '✓ Libre';
        zoneVal.style.color = zoneOk?'#34d399':'#ef4444';
    }

    // Materials
    const missing = (reqs||[]).filter(r => {
        if (r.item==='duplicate') return (h.duplicates||0) < r.qty;
        return (G.materials[r.item]||0) < r.qty;
    });
    const matsVal = document.getElementById('hm-evo-mats-prog-val');
    if (matsVal) {
        matsVal.textContent = missing.length===0 ? '✓ Tous disponibles' : `${missing.length} matériau(x) manquant(s)`;
        matsVal.style.color = missing.length===0 ? '#34d399':'#ef4444';
    }

    // Gold
    const goldOk  = D(G.gold).gte(goldCost); // §1.5
    const goldVal = document.getElementById('hm-evo-gold-val');
    if (goldVal) {
        goldVal.textContent = `${fmt(goldCost)}${goldOk?' ✓':` (manque ${fmt(goldCost-G.gold)})`}`;
        goldVal.style.color = goldOk?'#34d399':'#ef4444';
    }
}

// ── 3.4 PRESTIGE AVEC CHOIX ──────────────────────────────────
function openPrestigeChoiceModal() {
    if (G.zone < 50) { showNotif('❌ Zone 50 requise pour le Prestige !'); return; }
    const gain = Math.max(1, Math.floor(Math.sqrt(G.zone - 49) * 10));
    document.getElementById('pres-gain-display').textContent = gain + ' Cristaux';

    const slotOpt   = document.getElementById('pres-opt-slot');
    const slotBadge = document.getElementById('pres-slot-badge');
    const slotDesc  = document.getElementById('pres-slot-desc');
    const maxSq = G.maxSquadSize || 4;
    if (maxSq >= 6) {
        if (slotOpt)   { slotOpt.style.opacity='0.45'; slotOpt.style.pointerEvents='none'; }
        if (slotBadge) slotBadge.textContent = '✓ Slot 6 actif';
        if (slotDesc)  slotDesc.textContent = 'Maximum atteint (6 slots)';
    } else {
        if (slotOpt)   { slotOpt.style.opacity='1'; slotOpt.style.pointerEvents='auto'; }
        const nextSlot = maxSq + 1;
        if (slotBadge) slotBadge.textContent = `Slot +1 (→${nextSlot})`;
        if (slotDesc)  slotDesc.textContent = `Débloque un ${nextSlot}e slot de Squad permanent`;
    }

    document.getElementById('prestige-choice-modal').classList.remove('hidden');
}

function doPrestigeChoice(type) {
    G.skillPoints = (G.skillPoints||0) + 3; // §2.2 ② — +3 SP par prestige
    document.getElementById('prestige-choice-modal').classList.add('hidden');

    const gain = Math.max(1, Math.floor(Math.sqrt(G.zone - 49) * 10));
    const _preZone = G.zone;

    // Apply permanent bonus
    if (!G.prestigeBonus) G.prestigeBonus = { dps:0, gold:0, extraSlot:0 };
    if (type === 'dps')  G.prestigeBonus.dps  = (G.prestigeBonus.dps  || 0) + 1;
    if (type === 'gold') G.prestigeBonus.gold = (G.prestigeBonus.gold || 0) + 1;
    if (type === 'slot' && (G.maxSquadSize || 4) < 6) {
        G.maxSquadSize = Math.min(6, (G.maxSquadSize || 4) + 1);
        G.prestigeBonus.extraSlot = (G.prestigeBonus.extraSlot || 0) + 1;
        while (G.squad.length < G.maxSquadSize) G.squad.push(null);
    }

    // Standard prestige reset
    G.prestigeCrystals += gain;
    invalidateStats();   // §1.3 — les cristaux de prestige modifient le DPS total
    G.totalPrestiges++;
    G.gold = D(0); G.zone = 1; // §1.5 G.monsterIndex = 0; G.isBoss = false;
    Object.keys(G.heroes).forEach(id => { if(G.heroes[id]){ G.heroes[id].level=1; } G.bbGauges[id]=0; });
    G.partyHp = G.partyMaxHp;

    const bonusLabels = { dps:'+15% DPS permanent', gold:'+25% Or par kill', slot:'+1 Slot de Squad' };
    Sound.playPrestige(); screenFlash('#c084fc');
    spawnMonster(); (markSaveDirty(), saveGame()); updateDisplays();
    updateDifficultyBadge(); renderFormations(); renderSynergies();
    if (G.totalPrestiges === 1) setTimeout(() => triggerAchievementShare('first_prestige', {crystals:gain, zone:_preZone}), 600);
    showNotif(`∞ Rebirth ! ${bonusLabels[type]} activé ! (+${gain} Cristaux)`);
    renderPrestigePanel();
    renderHeroesGrid();
}

// Override renderPrestigePanel to show active bonuses
function renderPrestigePanel() {
    const panel = document.getElementById('panel-prestige');
    if (!panel) return;
    const pb = G.prestigeBonus || {};
    panel.innerHTML = `<div class="prestige-panel">
        <div class="prestige-icon" style="font-size:30px;font-family:'Outfit',sans-serif;font-weight:700;color:var(--c-teal);">∞</div>
        <div class="prestige-title">Prestige</div>
        <div style="font-size:12px;color:#a0b0c0;margin-bottom:8px;">Recommencez depuis la Zone 1 pour gagner des Cristaux (+10% Stats / cristal). Choisissez un bonus permanent à chaque Rebirth.</div>
        <div style="color:#00d2ff;font-weight:700;margin:8px 0 4px;">Cristaux : ${G.prestigeCrystals} <span style="color:#a0b0c0;font-weight:400;">(+${G.prestigeCrystals*10}% Stats)</span></div>
        <div style="font-size:11px;color:#64748b;margin-bottom:10px;">Prestiges effectués : ${G.totalPrestiges||0}</div>
        ${(pb.dps  ||0) > 0 ? `<div style="font-size:11px;color:#f1c40f;margin-bottom:3px;"><i class='ra ra-sword'></i> Bonus DPS : +${(pb.dps||0)*15}%</div>` : ''}
        ${(pb.gold ||0) > 0 ? `<div style="font-size:11px;color:#fbbf24;margin-bottom:3px;"><i class='ra ra-gold-bar'></i> Bonus Or  : +${(pb.gold||0)*25}%</div>` : ''}
        ${G.maxSquadSize >= 5 ? `<div style="font-size:11px;color:#34d399;margin-bottom:3px;"><i class='ra ra-shield'></i> 5e Slot de Squad : Actif</div>` : ''}
        ${G.maxSquadSize >= 6 ? `<div style="font-size:11px;color:#34d399;margin-bottom:3px;"><i class='ra ra-shield'></i> 6e Slot de Squad : Actif</div>` : ''}
        <button class="prestige-btn" onclick="openPrestigeChoiceModal()" style="margin-top:12px;width:100%;">REBIRTH (Req. Zone 50)</button>
    </div>`;
}

// =============================================================
// PILIER 4 — PROFONDEUR STRATÉGIQUE (déclaré ici pour éviter la TDZ)
// =============================================================

// ── Formations ───────────────────────────────────────────────
/* §câblage : FORMATIONS fourni par assets/globals.bundle.js (src/data) */

// ── Synergies ─────────────────────────────────────────────────
/* §câblage : SYNERGIES fourni par assets/globals.bundle.js (src/data) */

function _computeTotalDPS() {
    let total = 0;
    const formation = FORMATIONS.find(f => f.id === (G.formation || 'avant-garde')) || FORMATIONS[0];
    G.squad.forEach(id => {
        if (id && G.heroes[id]) {
            const h = G.heroes[id]; const def = HERO_DEFS.find(d=>d.id===id);
            h._id = id; // §2.2① FIX — _id requis pour appliquer l'équipement dans getHeroStats
            let heroDps = getHeroDPS(def, h);
            // Formation — bonus par type d'héros
            if (formation.heroMult) heroDps *= formation.heroMult(def, h);
            total += heroDps;
        }
    });
    total = Math.floor(total * (1 + G.prestigeCrystals * 0.10));
    // Prestige bonus DPS
    if (G.prestigeBonus && G.prestigeBonus.dps > 0) total = Math.floor(total * (1 + G.prestigeBonus.dps * 0.15));
    // Formation — bonus global DPS
    if (formation.dpsMult) total = Math.floor(total * formation.dpsMult);
    // Synergies DPS
    const syns = getActiveSynergies();
    syns.forEach(s => { if (s.dpsMult) total = Math.floor(total * s.dpsMult); });
    return total;
}

function getTotalDPS() {
    if (G.deathTimer > 0) return 0;
    if (_totalDpsDirty) { _totalDpsCache = _computeTotalDPS(); _totalDpsDirty = false; }
    return _totalDpsCache;
}

// §SOUTIEN — BC générés par clic par héro (remplace les dégâts de tap)
// Lvl 0 = 3 BC/tap, Lvl 50 = 23 BC/tap, Lvl 100 = 43 BC/tap (linéaire intentionnel)
function getSupportPower() {
    const lvl = G.tapDamageLevel;
    let bc = 3 + Math.floor(lvl * 0.4);
    if (G.leaderId === 'sera') bc = Math.floor(bc * 1.30); // Sera = Créateur Suprême : +30% BC
    return Math.floor(bc * (1 + G.prestigeCrystals * 0.10));
}

function getTapDamage() {
    // §SOUTIEN — alias conservé pour compatibilité (weekly boss sim uniquement)
    return getSupportPower();
}

function getMonsterMaxHp() {
    // §1.5 — retourne D pour gérer les zones 177+ sans perte de précision
    const base = D(10).mul(Math.pow(1.20, G.zone - 1));
    const bossBase = G.isBoss ? base.mul(12) : base;
    const diffMults = { easy: 0.5, normal: 1, hard: 2, extreme: G.isBoss ? 8 : 5 };
    return bossBase.mul(diffMults[G.difficulty] || 1).ceil();
}

function getMonsterAttack() {
    let base = 2.5 * Math.pow(1.16, G.zone - 1);    // §2.4 : 1.21 → 1.16
    if (G.isBoss) {
        base *= 4.5;
    }
    return Math.ceil(base);
}

function updatePartyStats() {
    invalidateStats();   // §1.3 — force recalcul à chaque appel explicite
    const stats = getSquadStats();
    let maxHp = stats.maxHp;
    let totalDef = stats.def;
    
    // Formation — bonus HP/DEF
    const formation = FORMATIONS.find(f => f.id === (G.formation || 'avant-garde')) || FORMATIONS[0];
    if (formation.hpMult)  maxHp    = Math.floor(maxHp    * formation.hpMult);
    if (formation.defMult) totalDef = Math.floor(totalDef * formation.defMult);

    // Synergies HP
    const syns = getActiveSynergies();
    syns.forEach(s => { if (s.hpMult) maxHp = Math.floor(maxHp * s.hpMult); });

    G.partyMaxHp = maxHp;
    G.partyDef = totalDef;
    G.partyHp = Math.min(G.partyHp, G.partyMaxHp);
    updatePartyHpBar();
}

function updatePartyHpBar() {
    const bar = document.getElementById('party-hp-bar-fill');
    if (bar) {
        const pct = Math.max(0, G.partyHp / G.partyMaxHp * 100);
        bar.style.width = pct + '%';
        document.getElementById('party-hp-text').textContent = `${fmt(Math.max(0, G.partyHp))} / ${fmt(G.partyMaxHp)} (DEF: ${fmt(G.partyDef)})`;
    }
    
    // Danger vignette
    const vignette = document.getElementById('danger-vignette');
    if (vignette) {
        const pct = G.partyHp / G.partyMaxHp;
        if (G.difficulty === 'extreme' || (pct <= 0.35 && G.partyHp > 0 && (!G.deathTimer || G.deathTimer <= 0))) {
            vignette.classList.add('active');
        } else {
            vignette.classList.remove('active');
        }
    }
}

// =============================================================
// BATTLE & TIMERS ENGINE
// =============================================================
function spawnMonster() {
    invalidateStats();   // §1.3 — la zone peut changer → avantage élémentaire recalculé
    if (G.currentStage) {
        // Mode stage (Phase 3) : 5 monstres par stage, boss uniquement sur le 5e stage de la zone
        if (G.currentStage.stage === STAGES_PER_AREA - 1 && G.monsterIndex >= 5) {
            G.isBoss = true; G.bossTimer = 30;
        }
    } else if (G.monsterIndex >= 10) { G.isBoss = true; G.monsterIndex = 10; G.bossTimer = 30; }
    // Pilier 3: démarrer le chrono et réinitialiser les dégâts pour les jalons
    if (G.isBoss && [10, 25, 50, 100, 150].includes(G.zone)) {
        _bossStartTime = Date.now(); _bossTotalDmg = 0;
    }
    G.monsterMaxHp = getMonsterMaxHp(); G.monsterHp = D(G.monsterMaxHp); // §1.5
    G.monsterFrozen = 0; G.monsterDebuff = 0;

    G.monsterSpawnTime = Date.now();
    G.monsterFirstAttackDone = false;
    G.bossUltimateTriggered = false;

    updateMonsterUI();

    // CORRECTION CRITIQUE : Séparation des règles d'échelle PC et Mobile
    const monsterImg = document.getElementById('monster-emoji');
    if (monsterImg) {
        if (G.isTestCombat) {
            // Pour l'Ogre de test, on enlève l'inline style pour laisser le CSS (grimoire-noir.css) gérer entièrement la taille
            monsterImg.style.removeProperty('height');
        } else {
            if (window.innerWidth >= 1024) {
                // 🖥️ MODE ORDINATEUR : Proportions en % idéales pour le cadre carré agrandi
                if (G.isBoss) {
                    if (G.zone % 10 === 0) {
                        monsterImg.style.setProperty('height', '92%', 'important');
                    } else {
                        monsterImg.style.setProperty('height', '82%', 'important');
                    }
                } else {
                    monsterImg.style.setProperty('height', '60%', 'important');
                }
            } else {
                // 📱 MODE MOBILE / ANDROID : Utilisation du "vh" (Viewport Height) pour ne jamais déborder
                if (G.isBoss) {
                    if (G.zone % 10 === 0) {
                        // Le gros Boss de fin d'acte reste imposant mais sous le texte
                        monsterImg.style.setProperty('height', '42vh', 'important');
                    } else {
                        // Boss classique de zone
                        monsterImg.style.setProperty('height', '35vh', 'important');
                    }
                } else {
                    // Les monstres de base restent bien proportionnés au centre
                    monsterImg.style.setProperty('height', '26vh', 'important');
                }
            }
        }
    }

    BGM.update();
}

function killMonster() {
    if (G.isTestCombat) {
        G.monsterHp = D(G.monsterMaxHp);
        spawnMonster();
        showNotif("🎯 Monstre de test vaincu ! Régénération...");
        return;
    }
    const _diffGold = { easy: 0.5, normal: 1, hard: 1.5, extreme: 3 };
    const _goldPrestigeBonus = G.prestigeBonus ? (1 + G.prestigeBonus.gold * 0.25) : 1;
    // §1.5 — D pour éviter la perte de précision à hautes zones
    let gold = D(10).mul(Math.pow(1.21, G.zone - 1)).mul(G.isBoss ? 5 : 1).mul(_diffGold[G.difficulty] || 1).mul(_goldPrestigeBonus).mul(getGoldBuffMult()).mul(getIAPGoldMult()).ceil(); // §4.3 IAP gold
    if (G.playerSkillsActive.wealth > 0) gold = gold.mul(2);
    if (G.leaderId === 'selena') gold = gold.mul(1.25).floor();

    // 1. AJOUT DES RESSOURCES
    G.gold = D(G.gold).add(gold); G.totalGold = D(G.totalGold).add(gold); G.totalKills++; Sound.playKill();
    
    if (G.isBoss) {
        G.honorPoints += 10;
        G.bossKills++; G.gems += 1;
        G.skillPoints = (G.skillPoints||0) + 1; // §2.2 ② — +1 SP par boss kill screenFlash('#f1c40f');
        // ── Mode stage (Phase 3) : boss vaincu = stage terminé, pas de zone++ ──
        if (G.currentStage) {
            updateDisplays();
            pulseCurrency('gold-display'); pulseCurrency('gems-display'); pulseCurrency('honor-display');
            tryDropLoot();
            finishStage(true);
            return;
        }
        const _defeatedZone = G.zone; // zone du boss vaincu
        const _bossDmg = _bossTotalDmg; const _bossTime = Date.now() - (_bossStartTime || Date.now());
        G.isBoss = false; G.monsterIndex = 0; G.zone++;
        // §2.3 — Refresh carte si ouverte
        if (document.querySelector('.tab-btn[data-tab="worldmap"]')?.classList.contains('active')) renderWorldMap();
        if(G.zone > G.maxZone) G.maxZone = G.zone;
        // ── Pilier 3: écran de victoire pour les zones jalons ──
        if ([10, 25, 50, 100, 150].includes(_defeatedZone)) {
            const _bn = getBossNameForZone(_defeatedZone);
            setTimeout(() => showBossVictoryScreen(_defeatedZone, _bn, _bossTime, _bossDmg), 350);
        }
        // ── Pilier 3: achievements de zone (première fois) ──
        if (_defeatedZone + 1 === 50  && !G._achZone50)  { G._achZone50  = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_50',  { zone: 50  }), 1200); }
        if (_defeatedZone + 1 === 100 && !G._achZone100) { G._achZone100 = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_100', { zone: 100 }), 1200); }
        if (_defeatedZone + 1 === 200 && !G._achZone200) { G._achZone200 = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_200', { zone: 200 }), 1200); }
    } else {
        G.honorPoints += 1;
        G.monsterIndex++;
        // ── Mode stage (Phase 3) : 5 monstres tués sur un stage normal = stage terminé ──
        if (G.currentStage && G.monsterIndex >= 5 && G.currentStage.stage !== STAGES_PER_AREA - 1) {
            updateDisplays();
            pulseCurrency('gold-display');
            tryDropLoot();
            finishStage(true);
            return;
        }
    }

    // 2. CORRECTION CRITIQUE : On met à jour l'affichage TEXTUEL immédiatement ici
    // pour que l'or apparaisse à l'écran sans attendre les calculs de décors
    updateDisplays();
    pulseCurrency('gold-display');
    if (G.isBoss) {
        pulseCurrency('gems-display');
        pulseCurrency('honor-display');
    }
    
    // 3. ENGENDRER LE PROCHAIN MONSTRE (Contient les calculs graphiques lourds)
    spawnMonster();
    // §1.4 — Ne pas reconstruire les panneaux en direct. masterFrame les render ≤4×/s si visibles.
    _panelsDirty = true;
    tryDropLoot(); // §2.2 ① — chance de drop équipement procédural
    
    // §1.3 — Pop via classe CSS (prioritaire sur monsterIdle grâce à !important)
    const me = document.getElementById('monster-emoji');
    me.classList.remove('monster-pop');
    // §1.4 — reflow supprimé, l'animation de pop est gérée via Web Animations dans spawnMonster
    me.classList.add('monster-pop');
    setTimeout(() => me.classList.remove('monster-pop'), 260);
}

function healParty(amount) {
    if (G.deathTimer > 0) return;
    G.partyHp = Math.min(G.partyMaxHp, G.partyHp + amount);
    updatePartyHpBar();
}

function addBC(count) {
    const active = G.squad.filter(id => id !== null && G.heroes[id]);
    if (active.length === 0) return;
    
    // Alliance Sacrée synergy adds +20% Battle Crystals generation rate
    if (G.allianceSacreeActive) {
        count *= 1.2;
    }
    
    const targetId = active[Math.floor(Math.random() * active.length)];
    const def = HERO_DEFS.find(d => d.id === targetId);
    const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
    
    if (!G.bbGauges[targetId]) G.bbGauges[targetId] = 0;
    
    const pctAdd = (count / bbCost) * 100 * getIAPBCMult(); // §4.3 IAP BC mult
    G.bbGauges[targetId] = Math.min(100, G.bbGauges[targetId] + pctAdd);
    
    renderFooterBB();
    if(document.querySelector('.tab-btn[data-tab="skills"]')?.classList.contains('active')) renderSkills();
}

// =============================================================
// LIVE DPS TRACKER
// =============================================================
let totalDamageDealtInLastSecond = 0;
let liveDpsValue = 0;

// P3 §3.2 — agrégateur de dégâts (cap 12 nombres simultanés)
let _dmgActive = 0;
const _dmgAgg = { sum: 0, hits: 0, el: null, timer: null };
function _aggDamage(dmg) {
    const zone = document.getElementById('monster-zone');
    if (!zone) return;
    if (!_dmgAgg.el) {
        const el = document.createElement('div');
        el.id = 'dmg-aggregate';
        zone.appendChild(el);
        _dmgAgg.el = el;
    }
    _dmgAgg.sum += (dmg && typeof dmg.toNumber === 'function') ? dmg.toNumber() : (Number(dmg) || 0);
    _dmgAgg.hits++;
    const el = _dmgAgg.el;
    el.textContent = `✕${_dmgAgg.hits} — ${fmt(_dmgAgg.sum)}`;
    el.classList.add('visible');
    clearTimeout(_dmgAgg.timer);
    _dmgAgg.timer = setTimeout(() => {
        el.classList.remove('visible');
        _dmgAgg.sum = 0; _dmgAgg.hits = 0;
    }, 600);
}

function trackRealDamage(amount) {
    totalDamageDealtInLastSecond += amount;
}

// Live DPS et DPS passif gérés dans simulate() via accumulateurs

// Variables pour l'accumulation des dégâts passifs
let _passiveDmgAccumulator = 0;
let _passiveDmgTimeAccumulator = 0;

// Visual hit feedback (flashing/shaking) on monster
function triggerMonsterHitVisuals(isCrit = false, isBig = false) {
    const monsterImg = document.getElementById('monster-emoji');
    if (!monsterImg) return;
    
    monsterImg.classList.remove('hit-flash-active', 'hit-shake-active', 'hit-shake-big');
    void monsterImg.offsetWidth; // Trigger reflow
    
    monsterImg.classList.add('hit-flash-active');
    if (isBig) {
        monsterImg.classList.add('hit-shake-big');
    } else {
        monsterImg.classList.add('hit-shake-active');
    }
    
    setTimeout(() => {
        monsterImg.classList.remove('hit-flash-active', 'hit-shake-active', 'hit-shake-big');
    }, 80);
}

// Click slash overlay sparkle
function spawnClickSlash(x, y) {
    const zone = document.getElementById('monster-zone');
    if (!zone) return;
    
    const slash = document.createElement('div');
    slash.className = 'click-slash-effect';
    slash.style.left = x + 'px';
    slash.style.top = y + 'px';
    const angle = Math.floor(Math.random() * 360);
    slash.style.setProperty('--angle', angle + 'deg');
    
    zone.appendChild(slash);
    setTimeout(() => { slash.remove(); }, 300);
}

// Floating damage numbers
let _floatingDmgActiveCount = 0;
function spawnFloatingDamageText(x, y, text, isCrit = false, isBraveBurst = false) {
    if (_floatingDmgActiveCount >= 25) return;
    
    let dmgEl;
    if (typeof _dmgPool !== 'undefined' && _dmgPool) {
        dmgEl = _dmgPool.acquire();
    } else {
        dmgEl = document.createElement('div');
        dmgEl.className = 'dmg-text';
        const mz = document.getElementById('monster-zone');
        if (mz) mz.appendChild(dmgEl);
    }
    
    _floatingDmgActiveCount++;
    dmgEl.textContent = text;
    dmgEl.className = 'dmg-text' + (isCrit ? ' dmg-crit' : '') + (isBraveBurst ? ' dmg-bb' : '');
    dmgEl.style.position = 'absolute';
    dmgEl.style.left = x + 'px';
    dmgEl.style.top = y + 'px';
    dmgEl.style.opacity = '1';
    dmgEl.style.display = 'block';
    dmgEl.style.zIndex = '10';
    dmgEl.style.pointerEvents = 'none';
    
    if (isBraveBurst) {
        dmgEl.style.fontSize = '24px';
        dmgEl.style.fontWeight = '800';
    } else if (isCrit) {
        dmgEl.style.fontSize = '18px';
        dmgEl.style.fontWeight = '700';
    } else {
        dmgEl.style.fontSize = '14px';
    }
    
    const angle = -15 + Math.random() * 30;
    dmgEl.animate([
        { opacity: '1', transform: `translateY(0) scale(0.6) rotate(${angle}deg)` },
        { transform: `translateY(-25px) scale(1.4) rotate(${angle}deg)`, offset: 0.2 },
        { opacity: '0', transform: `translateY(-80px) scale(0.8) rotate(${angle}deg)` }
    ], {
        duration: 900,
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        fill: 'forwards'
    }).onfinish = () => {
        _floatingDmgActiveCount = Math.max(0, _floatingDmgActiveCount - 1);
        if (typeof _dmgPool !== 'undefined' && _dmgPool) {
            _dmgPool.release(dmgEl);
        } else {
            dmgEl.remove();
        }
    };
}

// Inject cloud parallax overlay in the Hub at startup
document.addEventListener('DOMContentLoaded', () => {
    const hubMenu = document.getElementById('hub-menu');
    if (hubMenu) {
        const clouds = document.createElement('div');
        clouds.className = 'hub-cloud-overlay';
        hubMenu.appendChild(clouds);
    }
});

// =============================================================
// GESTIONNAIRE DE CLIC : CRIT SCALING + COMBO GLOW
// =============================================================
let comboCount = 0, comboTimer = null, lastClick = 0;
document.getElementById('monster-zone').addEventListener('pointerdown', (e) => {
    // pointerdown (pas click) : réponse immédiate au doigt, pas de taps avalés en tap rapide
    if (e.button !== undefined && e.button !== 0) return; // clic gauche / tap uniquement
    Sound.init();
    if (G.deathTimer > 0 || D(G.monsterHp).lte(0)) return;
    G.totalClicks++; // §1.5

    // Crit scaling : +0.5% de chance de crit par combo (max +20% au combo 40)
    const bonusCritChance = Math.min(0.20, comboCount * 0.005);
    const isCrit = Math.random() < (0.10 + bonusCritChance);

    const now = Date.now();
    if (now - lastClick < 400) {
        comboCount = Math.min(comboCount + 1, 40);
        if (comboCount >= 15) document.getElementById('monster-zone').classList.add('combo-glow');
    } else {
        comboCount = 1;
        document.getElementById('monster-zone').classList.remove('combo-glow');
    }
    lastClick = now;

    if (comboCount > G.maxCombo) G.maxCombo = comboCount;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        comboCount = 0;
        document.getElementById('combo-display').textContent = '';
        document.getElementById('monster-zone').classList.remove('combo-glow');
    }, 600);

    if (comboCount >= 2) {
        const critIndicator = bonusCritChance > 0
            ? ` <small style="color:#f1c40f">(+${Math.floor(bonusCritChance * 100)}% Crit)</small>`
            : '';
        const comboEl = document.getElementById('combo-display');
        // Scale font with combo: starts at 12px, grows to 22px at ×40
        const fontSize = Math.min(22, 12 + (comboCount / 40) * 10);
        comboEl.style.fontSize = fontSize + 'px';
        // Color progression: white → yellow → orange → red
        const comboColor = comboCount < 10 ? '#e0e6f0'
            : comboCount < 20 ? '#f1c40f'
            : comboCount < 35 ? '#f97316'
            : '#ff3366';
        comboEl.style.color = comboColor;
        comboEl.innerHTML = `COMBO ×${(1 + comboCount * 0.1).toFixed(1)}${critIndicator}`;
        // Max combo explosion
        if (comboCount === 40) {
            // §1.4 — Web Animations API pour combo-max
            comboEl.animate(
                [{transform:'scale(1)'},{transform:'scale(1.5)',offset:0.4},{transform:'scale(0.9)',offset:0.7},{transform:'scale(1)'}],
                {duration:400, easing:'ease-out'}
            );
            comboEl.style.color = '#ff3366';
            screenFlash('rgba(255,51,102,0.3)');
            // §2.1 — SPARK MAX : combo 40 = charge immédiate +25 BC sur tout le squad
            const allActive = G.squad.filter(id => id !== null && G.heroes[id]);
            allActive.forEach(id => {
                const def = HERO_DEFS.find(d => d.id === id);
                const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
                if (!G.bbGauges[id]) G.bbGauges[id] = 0;
                G.bbGauges[id] = Math.min(100, G.bbGauges[id] + (25 / bbCost) * 100);
            });
            renderFooterBB();
        }
    }

    // §SOUTIEN — Le joueur est un soutien : plus de dégâts directs, mais BC + soins pour l'équipe
    const baseBc = getSupportPower();
    const comboMult = 1 + comboCount * 0.1;
    const bcPerHero = Math.floor(baseBc * comboMult * (isCrit ? 3 : 1));

    // Distribue BC à tous les membres actifs du squad
    const active = G.squad.filter(id => id !== null && G.heroes[id]);
    active.forEach(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
        if (!G.bbGauges[id]) G.bbGauges[id] = 0;
        G.bbGauges[id] = Math.min(100, G.bbGauges[id] + (bcPerHero / bbCost) * 100);
    });
    renderFooterBB();

    // Crit → soin 1.5% HP max en bonus
    const healAmt = isCrit ? Math.ceil(G.partyMaxHp * 0.015) : 0;
    if (healAmt > 0) healParty(healAmt);

    // Combo ≥10 → debuff monstre (vulnérabilité tactique infligée par la présence du soutien)
    if (comboCount >= 10) {
        G.monsterDebuff = Math.max(G.monsterDebuff, 3);
    }

    const spawnBC = Math.random() < 0.65; // Plus de cristaux BC car rôle soutien
    const spawnHC = Math.random() < 0.30;

    const r = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - r.left;
    const clickY = e.clientY - r.top;

    if (spawnBC) spawnCrystalParticle(clickX, clickY, 'BC');
    if (spawnHC) spawnCrystalParticle(clickX, clickY, 'HC');

    spawnParticlesFiltered(clickX, clickY, {count: isCrit ? 12 : 4, speed: isCrit ? 250 : 150, colors: isCrit ? ['#00d2ff', '#a78bfa', '#fff'] : ['#60a5fa', '#a78bfa']}); // §3.4 — couleurs soutien
    if (isCrit) Sound.playCrit(); else Sound.playHit();

    // JRPG click slash overlay & monster hit flash/shake feedback
    spawnClickSlash(clickX, clickY);
    triggerMonsterHitVisuals(isCrit, false);

    // §SOUTIEN — Affichage du BC généré au lieu des dégâts
    const theme = ZONE_THEMES[(G.zone - 1) % ZONE_THEMES.length];
    const elemColors = {
        'Feu': '#ff4c30',
        'Eau': '#00d2ff',
        'Terre': '#2ecc71',
        'Foudre': '#f1c40f',
        'Lumière': '#ffffff',
        'Ténèbres': '#c084fc'
    };
    const elemGlows = {
        'Feu': '0 0 10px rgba(255,76,48,0.8)',
        'Eau': '0 0 10px rgba(0,210,255,0.8)',
        'Terre': '0 0 10px rgba(46,204,113,0.8)',
        'Foudre': '0 0 10px rgba(241,196,15,0.8)',
        'Lumière': '0 0 10px rgba(255,255,255,0.8)',
        'Ténèbres': '0 0 10px rgba(192,132,252,0.8)'
    };
    const currentElemColor = elemColors[theme.elem] || '#fff';
    const currentElemGlow = elemGlows[theme.elem] || '0 0 8px rgba(255,255,255,0.5)';

    // P3 §3.2 — cap de nombres simultanés : au-delà de 12, on skip
    if (_dmgActive >= 12) { return; }
    _dmgActive++;
    // §1.4 — Pool de divs réutilisés (zéro allocation DOM, zéro GC)
    const dmgEl = _dmgPool.acquire();
    // §SOUTIEN — Affichage "+X BC" (ou "✨ +X BC SOIN" en crit)
    if (isCrit && healAmt > 0) {
        dmgEl.textContent = `✨ +${bcPerHero} BC  +${healAmt} HP`;
        dmgEl.style.color = '#a78bfa';
        dmgEl.style.textShadow = '0 0 14px rgba(167,139,250,0.9), 0 2px 4px rgba(0,0,0,0.9)';
        dmgEl.style.fontSize = '18px';
    } else {
        dmgEl.textContent = `+${bcPerHero} BC`;
        dmgEl.style.color = '#60a5fa';
        dmgEl.style.textShadow = '0 0 10px rgba(96,165,250,0.8), 0 2px 4px rgba(0,0,0,0.8)';
        dmgEl.style.fontSize = '14px';
    }
    const zoneW = e.currentTarget.clientWidth;
    dmgEl.style.left = Math.max(10, Math.min(clickX - 30, zoneW - 80)) + 'px';
    dmgEl.style.top = Math.max(20, clickY - 10) + 'px';
    dmgEl.style.opacity = '1';
    dmgEl.style.display = 'block';
    dmgEl.animate(
        [{opacity:'1',transform:'translateY(0) scale(0.7)'},{transform:'translateY(-12px) scale(1.1)',offset:0.25},{opacity:'0',transform:'translateY(-70px) scale(0.85)'}],
        {duration:1000, easing:'ease-out', fill:'forwards'}
    ).onfinish = () => { _dmgActive = Math.max(0, _dmgActive - 1); _dmgPool.release(dmgEl); };

    // §SOUTIEN — Le joueur soutient, le monstre n'est pas heurté directement
    // Léger tremblement de l'UI héros pour indiquer l'action de soutien
    const footerEl = document.getElementById('footer');
    if (footerEl && isCrit) {
        footerEl.animate(
            [{filter:'brightness(1)'},{filter:'brightness(1.4)',offset:0.15},{filter:'brightness(1)'}],
            {duration:250, easing:'ease-out'}
        );
    }
    updateHpBar();
});

let lastMonsterAttack = 0;

function triggerScreenShake() {
    const gw = document.getElementById('game-window');
    if (!gw) return;
    // §1.4 — Web Animations API : pas de reflow
    gw.animate([
        {transform:'translate(0,0) rotate(0deg)'},
        {transform:'translate(-8px,5px) rotate(-1deg)',  offset:0.20},
        {transform:'translate(8px,-5px) rotate(1deg)',   offset:0.40},
        {transform:'translate(-6px,-3px) rotate(-0.5deg)',offset:0.60},
        {transform:'translate(6px,3px) rotate(0.5deg)',  offset:0.80},
        {transform:'translate(0,0) rotate(0deg)'}
    ], {duration:150, easing:'ease-out'});
}

function spawnBloodyDamageNumber(dmg, isUltimate = false) {
    const footer = document.getElementById('footer');
    if (!footer) return;
    
    // §1.4 — Pool pour les nombres de dégâts reçus
    const bloodyEl = _bloodyPool.acquire();
    bloodyEl.textContent = '-' + fmt(dmg);
    const rect = footer.getBoundingClientRect();
    const container = document.getElementById('game-window') || document.body;
    const containerRect = container.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) - containerRect.left;
    const y = (rect.top + 20) - containerRect.top;
    bloodyEl.style.left = `${x + (Math.random() * 40 - 20)}px`;
    bloodyEl.style.top = `${y}px`;
    bloodyEl.style.display = 'block';
    if (isUltimate) {
        bloodyEl.style.fontSize = '32px';
        bloodyEl.style.color = '#9b59b6';
        bloodyEl.style.textShadow = '0 0 15px #9b59b6, 0 3px 6px #000';
    } else {
        bloodyEl.style.fontSize = '24px';
        bloodyEl.style.color = '#ff3333';
        bloodyEl.style.textShadow = '0 0 10px #ff3333, 0 2px 4px #000';
    }
    bloodyEl.animate(
        [{opacity:'0',transform:'translateY(-20px) scale(0.6)'},{opacity:'1',transform:'translateY(0px) scale(1.3)',offset:0.15},{transform:'translateY(15px) scale(1.1)',offset:0.40},{opacity:'0',transform:'translateY(60px) scale(0.9)'}],
        {duration:1200, easing:'ease-in', fill:'forwards'}
    ).onfinish = () => _bloodyPool.release(bloodyEl);
}

function handleSquadDeath() {
    // ── Mode stage (Phase 3) : squad K.O. = défaite du stage (pas de recul de zone) ──
    if (G.currentStage) {
        G.deathTimer = 0;
        screenFlash('rgba(231,76,60,0.7)');
        finishStage(false);
        return;
    }
    G.deathTimer = 3.0;
    G.isBoss = false;
    G.monsterIndex = 0;
    if (G.zone > 1) G.zone--;
    screenFlash('rgba(231,76,60,0.7)');
    (markSaveDirty(), saveGame());
}

function triggerBossUltimate() {
    const baseAtk = getMonsterAttack();
    const atkMod = G.monsterFrozen > 0 ? 0.5 : G.monsterDebuff > 0 ? 0.6 : 1.0;
    let ultDmg = Math.ceil((baseAtk * atkMod) * 2.8);
    if (G.lanceShieldActive) {
        ultDmg = Math.floor(ultDmg / 2);
        showNotif("Bouclier de Lance activé ! Dégâts de l'Ultime divisés par 2 !");
    } else {
        showNotif("🚨 ATTAQUE ULTIME ! Sans bouclier, vous subissez de lourds dégâts !");
    }
    
    G.partyHp = Math.max(0, G.partyHp - ultDmg);
    updatePartyHpBar();
    
    spawnBloodyDamageNumber(ultDmg, true);
    triggerScreenShake();
    screenFlash('rgba(255, 0, 0, 0.65)');
    Sound.playHit();
    
    if (G.partyHp <= 0) {
        handleSquadDeath();
    }
}

// =============================================================
// FONCTION DE SIMULATION — appelée par la boucle maître (§1.2)
// dt = pas de temps fixe (1/30 s). Tous les décréments utilisent dt.
// =============================================================
let _dpsAcc  = 0;
let _saveAcc = 0;
let _questAcc = 0;
let _townAcc = 0;
let _autoCombatAcc = 0;

function simulate(dt) {
    // ── Phase 3 : combat gelé tant qu'un écran de résultat de stage est affiché
    //    (ou qu'aucun stage n'est lancé en mode stage) ──
    if (_stageEnded) return;

    // — Combat Automatique (AUTO) —
    if (G.autoCombat) {
        _autoCombatAcc += dt;
        if (_autoCombatAcc >= 0.150) {
            _autoCombatAcc = 0;
            const zone = document.getElementById('monster-zone');
            if (zone) {
                const event = new PointerEvent('pointerdown', {
                    button: 0,
                    bubbles: true,
                    cancelable: true
                });
                zone.dispatchEvent(event);
            }
        }
        // Déclencher les Brave Bursts prêts automatiquement
        const activeSquad = G.squad.filter(id => id !== null && G.heroes[id]);
        activeSquad.forEach(id => {
            if ((G.bbGauges[id] || 0) >= 100) {
                useBB(id);
            }
        });
    } else {
        _autoCombatAcc = 0;
    }
    // — Accumulateurs périodiques —
    _dpsAcc += dt;
    if (_dpsAcc >= 1) {
        liveDpsValue = totalDamageDealtInLastSecond;
        totalDamageDealtInLastSecond = 0;
        _dpsAcc -= 1;
    }
    _saveAcc += dt;
    if (_saveAcc >= 15) {
        markSaveDirty(); // §1.6 — état a forcement changé depuis 15s
        saveGame();
        _saveAcc -= 15;
    }
    _questAcc += dt;
    if (_questAcc >= 30) {
        if (document.getElementById('daily-quests-container')) renderDailyQuests();
        _questAcc -= 30;
    }
    // — Régénération des gisements de la Ville (timestamp-based → gère aussi l'offline) —
    _townAcc += dt;
    if (_townAcc >= 5) {
        townRegenTick();
        _townAcc -= 5;
    }

    // — Timer de mort (squad K.O.) —
    if (G.deathTimer > 0) {
        G.deathTimer -= dt;
        document.getElementById('monster-name').innerHTML = `<span style="color:#e74c3c">SQUAD K.O. - REPLI (${Math.ceil(G.deathTimer)}s)</span>`;
        if (G.deathTimer <= 0) {
            G.partyHp = G.partyMaxHp;
            updatePartyHpBar();
            spawnMonster();
        }
        updateDisplays();
        return;
    }

    if (G.isTestCombat) {
        G.partyHp = G.partyMaxHp;
        updatePartyHpBar();
    }

    // — Filet de sécurité : HP ≤ 0 sans killMonster (ex: chargé depuis save entre deux ticks) —
    if (D(G.monsterHp).lte(0)) { killMonster(); return; }

    // — DPS passif —
    let dps = getTotalDPS();
    if (G.playerSkillsActive.frenzy > 0) dps *= 3;
    if (dps > 0 && D(G.monsterHp).gt(0)) { // §1.5
        const frameDmg = D(dps).mul(dt);
        trackRealDamage(frameDmg.toNumber());
        G.monsterHp = D(G.monsterHp).sub(frameDmg);
        
        // Accumuler les dégâts passifs pour les afficher sous forme de nombres flottants et secousses
        _passiveDmgAccumulator += frameDmg.toNumber();
        _passiveDmgTimeAccumulator += dt;
        if (_passiveDmgTimeAccumulator >= 0.3) {
            if (_passiveDmgAccumulator > 0.01) {
                const zone = document.getElementById('monster-zone');
                if (zone) {
                    const w = zone.clientWidth;
                    const h = zone.clientHeight;
                    const rx = (w * 0.4) + Math.random() * (w * 0.2);
                    const ry = (h * 0.4) + Math.random() * (h * 0.2);
                    spawnFloatingDamageText(rx, ry, fmt(Math.ceil(_passiveDmgAccumulator)), false, false);
                }
                triggerMonsterHitVisuals(false, false);
            }
            _passiveDmgAccumulator = 0;
            _passiveDmgTimeAccumulator = 0;
        }
        
        if (Math.random() < 0.05 * dt * 30) spawnCrystalParticle(150 + Math.random()*240, 100 + Math.random()*100, 'BC');
        if (Math.random() < 0.02 * dt * 30) spawnCrystalParticle(150 + Math.random()*240, 100 + Math.random()*100, 'HC');
        if (D(G.monsterHp).lte(0)) {
            _passiveDmgAccumulator = 0;
            _passiveDmgTimeAccumulator = 0;
            killMonster();
        } else {
            updateHpBar();
        }
    }

    // — Timer boss —
    if (G.isBoss) {
        G.bossTimer -= dt;
        document.getElementById('boss-timer').textContent = `⏱ ${Math.max(0,G.bossTimer).toFixed(1)}s`;
        if (30 - G.bossTimer >= 8 && !G.bossUltimateTriggered) {
            G.bossUltimateTriggered = true;
            triggerBossUltimate();
        }
        if (G.bossTimer <= 0) {
            // §4.2 — Proposer un revive pub avant de repousser
            // Guard : ne pas re-créer la modale si elle est déjà affichée (évite le spam à 30fps)
            if (!document.getElementById('boss-revive-modal')) {
                G.bossTimer = 999; // stopper le tick pendant que la modale est ouverte
                if (adCapAvailable('bossRevive')) {
                    _showBossReviveOffer();
                } else if (G.currentStage) {
                    // ── Mode stage (Phase 3) : temps écoulé = défaite du stage ──
                    finishStage(false);
                } else {
                    showNotif("⏱️ Temps écoulé ! Le Boss vous repousse d'une zone.");
                    G.isBoss = false; G.monsterIndex = 0;
                    if (G.zone > 1) G.zone--;
                    spawnMonster(); (markSaveDirty(), saveGame());
                }
            }
        }
    }

    // — Attaque du monstre —
    const now = Date.now();
    let shouldAttack = false;
    const spawnElapsed = now - G.monsterSpawnTime;
    if (!G.monsterFirstAttackDone) {
        if (spawnElapsed >= 1000) {
            shouldAttack = true;
            G.monsterFirstAttackDone = true;
            lastMonsterAttack = now;
        }
    } else {
        const attackInterval = G.isBoss ? 1500 : 2500;
        if (now - lastMonsterAttack >= attackInterval) {
            shouldAttack = true;
            lastMonsterAttack = now;
        }
    }
    if (shouldAttack && D(G.monsterHp).gt(0) && G.deathTimer <= 0) { // §1.5
        const baseAtk  = getMonsterAttack();
        const atkMod   = G.monsterFrozen > 0 ? 0.5 : G.monsterDebuff > 0 ? 0.6 : 1.0;
        let degatsBruts = baseAtk * atkMod;
        if (G.mitigationActive) degatsBruts *= 0.5;
        const finalDmg = Math.max(1, Math.ceil(degatsBruts - (G.partyDef * 0.5)));
        G.partyHp = Math.max(0, G.partyHp - finalDmg);
        updatePartyHpBar();
        screenFlash('rgba(231,76,60,0.25)');
        triggerScreenShake();
        spawnBloodyDamageNumber(finalDmg, false);
        Sound.playHit();
        if (G.partyHp <= 0) handleSquadDeath();
    }

    // — Cooldowns & statuts —
    Object.keys(G.bbCooldowns).forEach(k => { if(G.bbCooldowns[k]>0) G.bbCooldowns[k] = Math.max(0, G.bbCooldowns[k]-dt); });
    Object.keys(G.playerSkillsCd).forEach(k => { if(G.playerSkillsCd[k]>0) G.playerSkillsCd[k] = Math.max(0, G.playerSkillsCd[k]-dt); });
    if (G.monsterFrozen > 0) { G.monsterFrozen = Math.max(0, G.monsterFrozen - dt); _applyMonsterFilter(document.getElementById('monster-emoji'), ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].bgHue); }
    if (G.monsterDebuff > 0) { G.monsterDebuff = Math.max(0, G.monsterDebuff - dt); _applyMonsterFilter(document.getElementById('monster-emoji'), ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].bgHue); }

    let activeOverlay = false;
    Object.keys(G.playerSkillsActive).forEach(k => {
        if (G.playerSkillsActive[k] > 0) {
            G.playerSkillsActive[k] = Math.max(0, G.playerSkillsActive[k] - dt);
            if (k === 'frenzy') activeOverlay = true;
        }
    });
    document.getElementById('skill-active-overlay').style.display = activeOverlay ? 'block' : 'none';

    if (D(G.monsterHp).gt(0)) updateDisplays(); // §1.5
}

// =============================================================
// UI DISPLAYS & GRIDS
// =============================================================
// P3 §3.3 — throttle : barre 10 Hz, texte 5 Hz (appels force aux spawns/loads)
let _hpBarAt = 0, _hpTxtAt = 0;
function updateHpBar(force = false) {
    const now = performance.now();
    if (!force && now - _hpBarAt < 100) return;
    _hpBarAt = now;
    const pct = Math.max(0, D(G.monsterHp).div(G.monsterMaxHp).toNumber() * 100); // §1.5
    
    const fillEl = document.getElementById('hp-bar-fill');
    const delayEl = document.getElementById('hp-bar-delay');
    if (fillEl) fillEl.style.width = pct + '%';
    if (delayEl) delayEl.style.width = pct + '%';
    
    const container = document.querySelector('.monster-container .hp-bar-container');
    if (container) {
        if (pct > 0 && pct < 20) {
            container.classList.add('pulse-low-hp');
        } else {
            container.classList.remove('pulse-low-hp');
        }
    }
    
    if (force || now - _hpTxtAt >= 200) {
        _hpTxtAt = now;
        document.getElementById('hp-text').textContent = `${fmt(Math.max(0, G.monsterHp))} / ${fmt(G.monsterMaxHp)}`;
    }
}

function updateMonsterUI() {
    const container = document.getElementById('monster-emoji-container');
    if (container) {
        if (G.isTestCombat) {
            container.classList.add('ogre-layout');
        } else {
            container.classList.remove('ogre-layout');
        }
    }

    if (G.isTestCombat) {
        document.getElementById('zone-name').textContent = "Arène de Test";
        document.getElementById('zone-progress').textContent = "🤖 Vie Infinie";
        const badge = document.getElementById('zone-elem-badge');
        badge.innerHTML = "🌐 Neutre";
        badge.style.background = "#8A93A6";
        const me = document.getElementById('monster-emoji');
        applyBiomeBg(0);
        me.src = "assets/img-combat/boss ogre.png";
        me.style.filter = "drop-shadow(0 8px 20px rgba(0,0,0,0.6))";
        document.getElementById('monster-name').textContent = "Boss Ogre";
        document.getElementById('boss-label').style.display = 'none';
        document.getElementById('boss-timer').style.display = 'none';
        updateHpBar(true);
        return;
    }
    const theme  = ZONE_THEMES[(G.zone-1) % ZONE_THEMES.length];
    const tier   = Math.floor((G.zone-1) / ZONE_THEMES.length);
    const prefix = TIER_PREFIXES[Math.min(tier, TIER_PREFIXES.length-1)];

    document.getElementById('zone-name').textContent = `Zone ${G.zone} — ${theme.name}`;
    document.getElementById('zone-progress').textContent = G.isBoss ? '👑 BOSS' : `Monstre ${G.monsterIndex+1} / 10`;

    const badge = document.getElementById('zone-elem-badge');
    badge.innerHTML = `${ELEM_ICONS[theme.elem] || ''} ${theme.elem}`;
    badge.style.background = ELEM_COLORS[theme.elem];

    const me = document.getElementById('monster-emoji');
    const biomeIdx = (G.zone - 1) % ZONE_THEMES.length;
    applyBiomeBg(biomeIdx); // fond de zone dynamique
    const mType    = G.monsterIndex < 4 ? 0 : G.monsterIndex < 7 ? 1 : 2;
    const imgIdx   = G.isBoss ? 3 : mType;

    // Cherche l'image spécifique du biome, sinon fallback sur les sprites Feu
    const biomeImgs = MONSTER_IMAGES[biomeIdx];
    const imgPath   = biomeImgs ? biomeImgs[imgIdx] : MONSTER_IMAGES[0][imgIdx];
    me.src = imgPath;

    // Applique hue-rotate seulement pour les biomes sans sprites propres
    _applyMonsterFilter(me, biomeImgs ? 0 : theme.bgHue);

    // CORRECTION : On ne touche plus à la hauteur ici pour éviter les conflits de taille
    if (G.isBoss) {
        document.getElementById('monster-name').textContent = prefix + theme.bossName;
    } else {
        document.getElementById('monster-name').textContent = prefix + theme.monsters[mType];
    }

    document.getElementById('boss-label').style.display = G.isBoss ? 'inline-flex' : 'none';
    document.getElementById('boss-timer').style.display = G.isBoss ? 'block' : 'none';
    updateHpBar(true);
}

function _applyMonsterFilter(el, hue) {
    const freeze = G.monsterFrozen > 0;
    const debuff = G.monsterDebuff > 0;
    const h = hue > 0 ? `hue-rotate(${hue}deg) ` : ''; // pas de teinte si sprite propre
    
    const isBossZone10 = (G.zone % 10 === 0 && G.isBoss);
    const bossShadow = isBossZone10 ? ' drop-shadow(0 10px 20px rgba(255, 0, 0, 0.3))' : '';

    if (freeze) {
        el.style.filter = `${h}brightness(1.4) saturate(0.4) drop-shadow(0 0 18px rgba(100,200,255,0.95))` + bossShadow;
    } else if (debuff) {
        el.style.filter = `${h}drop-shadow(0 0 14px rgba(160,0,255,0.85)) drop-shadow(0 8px 20px rgba(0,0,0,.6))` + bossShadow;
    } else {
        el.style.filter = `${h}drop-shadow(0 8px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 14px ${_biomeGlowColor})` + bossShadow;
    }
}


let _updAt = 0, _updTimer = null;
function updateDisplays() {
    // P3 §3.3 — throttle 5 Hz (l'œil ne lit pas plus vite) + appel traînant
    const _now = performance.now();
    if (_now - _updAt < 200) {
        if (!_updTimer) _updTimer = setTimeout(() => { _updTimer = null; updateDisplays(); }, 210 - (_now - _updAt));
        return;
    }
    _updAt = _now;
    document.getElementById('gold-display').innerHTML = `<i class="ra ra-gold-bar"></i> ${fmt(G.gold)}`;
    document.getElementById('gems-display').innerHTML = `<i class="ra ra-gem"></i> ${G.gems}`;
    document.getElementById('honor-display').innerHTML = `<i class='ra ra-sword'></i> ${fmt(G.honorPoints)} PH`;
    
    let dps = getTotalDPS();
    let dpsStr = fmt(dps);
    if(G.playerSkillsActive.frenzy > 0) dpsStr = `<span style="color:#f1c40f">${fmt(dps*3)} (Frénésie)</span>`;
    document.getElementById('dps-display').innerHTML = `<i class='ra ra-sword'></i> DPS : ${dpsStr}/s`;
    document.getElementById('tap-dmg-val').textContent = '+' + getSupportPower() + ' BC';
    
    // §2.1 — Éveils I/II/III uniquement (cap 25 supprimé)
    // §2.1 — Éveils I/II/III uniquement (cap 25 supprimé)
    const _tapAwakenings = [10, 50, 100];
    const nextTapAwakening = _tapAwakenings.find(m => m > G.tapDamageLevel);
    document.getElementById('tap-next-ms').textContent = nextTapAwakening
        ? 'Prochain Eveil Soutien : Niv.' + nextTapAwakening + ' (+' + (3 + Math.floor(nextTapAwakening * 0.4)) + ' BC/tap)'
        : 'Soutien Maitre -- Max BC/tap atteint !';

    // §3.1 — renderFooterBB et renderMaterialsPanel retirés du tick 100ms :
    // ils sont appelés à la demand sur événement (achat, kill, ouverture d'onglet)
    if(document.querySelector('.tab-btn[data-tab="skills"]')?.classList.contains('active')) renderSkills();
    renderObjectiveBar();

    const autoBtn = document.getElementById('combat-auto-btn');
    if (autoBtn) {
        if (G.autoCombat) {
            autoBtn.classList.add('active');
            autoBtn.textContent = 'AUTO ON';
        } else {
            autoBtn.classList.remove('active');
            autoBtn.textContent = 'AUTO OFF';
        }
    }

    _updateSummonGlow();
}

function renderSquadGrid() {
    const container = document.getElementById('squad-grid');
    container.innerHTML = '';
    
    const maxSlots = Math.max(4, G.maxSquadSize || 4);
    // Ensure squad array is large enough
    while (G.squad.length < maxSlots) G.squad.push(null);
    // Update grid columns dynamically
    container.style.gridTemplateColumns = `repeat(${maxSlots}, 1fr)`;

    for (let i = 0; i < maxSlots; i++) {
        const id = G.squad[i];
        const h = G.heroes[id];
        const def = id ? HERO_DEFS.find(d => d.id === id) : null;

        const card = document.createElement('div');
        const gauge = id ? (G.bbGauges[id] || 0) : 0;
        const isExtra = i >= 4;
        card.className = `squad-slot-card ${id ? 'filled' : ''} ${i === 0 ? 'leader-slot' : ''} ${gauge >= 100 ? 'bb-ready' : ''} ${isExtra ? 'squad-slot-5' : ''}`;

        if (id && h && def) {
            const gauge = G.bbGauges[id] || 0;
            card.innerHTML = `
                <img src="${getHeroImage(id, h.stars, 'squad')}" alt="">
                <div class="squad-stars">${'★'.repeat(h.stars)}</div>
                <div class="bb-gauge-fill" style="width:${gauge}%"></div>
                <div class="squad-badge" style="background:${i === 0 ? 'linear-gradient(90deg, #f1c40f, #e67e22)' : 'rgba(0,0,0,0.75)'}">
                    ${i === 0 ? '👑 LEADER' : def.elem}
                </div>
            `;
            card.onclick = () => openHeroModal(id);
        } else {
            card.innerHTML = `<div class="squad-slot-empty-icon">${isExtra ? '⭐' : '<i class="ra ra-shield"></i>'}</div><div class="squad-slot-empty-lbl">${isExtra ? 'BONUS' : 'LIBRE'}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
                const listBtn = document.querySelector('.tab-btn[data-tab="heroes"]');
                listBtn.classList.add('active');
                document.getElementById('panel-heroes').classList.add('active');
            };
        }

        container.appendChild(card);
    }
    
    const badge = document.getElementById('squad-ls-badge');
    const leaderId = G.squad[0];
    if (leaderId && G.heroes[leaderId]) {
        const lDef = HERO_DEFS.find(d => d.id === leaderId);
        badge.textContent = `LS Leader: ${getLeaderSkillName(lDef.id)}`;
    } else {
        badge.textContent = 'Leader Skill: Aucun';
    }
}

function getLeaderSkillName(id) {
    const ls = {
        ignis:   "Colère d'Agni (+50% DPS Feu)",
        vargas:  "Moral de Combat (+20% DPS team)",
        selena:  "Prêtresse d'Eau (+30% HP, +25% Gold)",
        margonia: "Maîtrise du Givre (+35% DPS Eau)",
        lance:   "Rempart de Gaïa (+40% DEF, +20% HP)",
        zeln:    "Instinct du Chasseur (+30% DPS Terre)",
        karl:    "Force Draconique (+40% DPS Foudre/Ténèbres)",
        eze:     "Foudre Alpha (+50% Crit mult, +20% Clic)",
        sera:    "Créateur Suprême (+30% DPS team)",
        atro:    "Lumière Sacrée (+40% DPS Lumière, +15% all)",
        magress: "Tyrannie des Ombres (+50% DPS Ténèbres)",
        kikuri:  "Malédiction Éternelle (+10% DPS team)",
    };
    return ls[id] || 'Aucun';
}

function getHeroPrice(def) {
    // §2.2 — Grille recalibrée + entrelacement multi-élément
    const priceMap = {
        // VAGUE 1 — couverture multi-élément (1 attaquant par élément, prix doux)
        ignis:   0,        // Feu
        selena:  800,      // Eau
        lance:   4000,     // Terre
        karl:    18000,    // Foudre
        kikuri:  70000,    // Ténèbres
        atro:    200000,   // Lumière
        // VAGUE 2 — le second héros (plus fort) de chaque élément (chasse long terme)
        vargas:  600000,   // Feu
        margonia:1500000,  // Eau
        zeln:    4000000,  // Terre
        eze:     10000000, // Foudre
        magress: 30000000, // Ténèbres
        sera:    70000000, // Lumière
    };
    return priceMap[def.id] !== undefined ? priceMap[def.id] : (def.baseDPS * 15000);
}

function renderHeroesGrid() {
    const grid = document.getElementById('heroes-grid');
    grid.innerHTML = '';
    const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;

    // Tri par prix : la grille suit l'ordre réel de déblocage (éléments entrelacés)
    const ordered = [...HERO_DEFS].sort((a, b) => getHeroPrice(a) - getHeroPrice(b));
    ordered.forEach(def => {
        const h = G.heroes[def.id];
        const locked = !h;
        const hasAdvantage = !locked && ELEMENT_ADVANTAGE[def.elem] === currentZoneElem;
        const inSquad = G.squad.includes(def.id);
        const isLeader = G.squad[0] === def.id;

        const div = document.createElement('div');
        div.className = `hero-mini-card ${locked ? 'locked' : `evo-${h.stars}`}`;

        if (!locked) {
            const expPct = (h.level / EVO_LEVEL_CAPS[h.stars]) * 100;
            div.innerHTML = `
                <img src="${getHeroImage(def.id, h.stars, 'squad')}" alt="" loading="lazy" decoding="async">
                <div class="hero-mini-elem">${def.icon}</div>
                ${inSquad ? `<div class="hero-mini-squad-badge">${isLeader ? '👑' : '⚔'}</div>` : ''}
                ${hasAdvantage ? `<div class="hero-mini-adv">🔺</div>` : ''}
                <div class="hero-mini-info">
                    <span class="hero-mini-stars">${'★'.repeat(h.stars)}</span>
                    <span class="hero-mini-name">${def.titles[h.stars - 3]}</span>
                    <span class="hero-mini-level">Lv.${h.level} / ${EVO_LEVEL_CAPS[h.stars]}</span>
                </div>
                <div class="hero-mini-exp-bar">
                    <div class="hero-mini-exp-fill" style="width:${expPct}%"></div>
                </div>
            `;
            div.onclick = () => openHeroModal(def.id);
        } else {
            // Héros non possédé — affichage selon mode d'obtention
            let acquireLabel, acquireColor;
            if (GOLD_BUYABLE_HEROES.includes(def.id)) {
                const price = getHeroPrice(def);
                acquireLabel = price === 0 ? '🆓 Gratuit' : `${fmt(price)} Or`;
                acquireColor = '#f1c40f';
            } else if (GEMS_GACHA_HEROES.includes(def.id)) {
                acquireLabel = '<i class="ra ra-crystal-ball"></i> Gacha 5💎';
                acquireColor = '#00d2ff';
            } else {
                acquireLabel = '🏆 Gacha 500PH';
                acquireColor = '#c084fc';
            }
            div.innerHTML = `
                <img src="${getHeroImage(def.id, 3, 'squad')}" alt="" loading="lazy" decoding="async">
                <div class="hero-mini-elem">${def.icon}</div>
                <div class="hero-mini-info">
                    <span class="hero-mini-stars">${'★'.repeat(3)}</span>
                    <span class="hero-mini-name" style="color:#a0b0c0">${def.titles[0]}</span>
                    <span class="hero-mini-level" style="color:${acquireColor}">${acquireLabel}</span>
                </div>
            `;
            div.onclick = () => openHeroModal(def.id);
        }

        grid.appendChild(div);
    });

    renderSquadGrid();
    updatePartyStats();
    renderSynergies();
    renderFormations();
}

function upgradeTap(times = 1) {
    Sound.init();
    // CORRECTION : Passage de 1.05 à 1.14 pour indexer le coût sur l'économie réelle
    let currentCost = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel));
    
    if (times === 1) {
        if (D(G.gold).gte(currentCost)) { // §1.5
            G.gold = D(G.gold).sub(currentCost);
            G.tapDamageLevel++;
            Sound.playLevelUp();
        }
    } else if (times === 10) {
        let totalCost = 0;
        for (let i = 0; i < 10; i++) {
            totalCost += Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + i));
        }
        if (D(G.gold).gte(totalCost)) { // §1.5
            G.gold = D(G.gold).sub(totalCost);
            G.tapDamageLevel += 10;
            Sound.playLevelUp();
        } else {
            showNotif("❌ Pas assez d'Or pour l'amélioration ×10 !");
        }
    } else if (times === 'max') {
        let count = 0;
        let totalCost = 0;
        while (true) {
            let nextCost = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + count));
            if (D(G.gold).gte(D(totalCost).add(nextCost))) { // §1.5
                totalCost += nextCost;
                count++;
            } else {
                break;
            }
        }
        if (count > 0) {
            G.gold = D(G.gold).sub(totalCost); // §1.5
            G.tapDamageLevel += count;
            Sound.playLevelUp();
            showNotif(`✨ Soutien Actif amélioré de +${count} niveaux ! (+${getSupportPower()} BC/tap)`);
        } else {
            showNotif("❌ Pas assez d'Or pour améliorer le Tap !");
        }
    }
    updateDisplays();
    (markSaveDirty(), saveGame());
}

function buyCurrentHero() {
    if (!currentHeroModal) return;
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    if (!def || G.heroes[def.id]) return;

    // Option A — bloquer l'achat or pour les héros gacha
    if (!GOLD_BUYABLE_HEROES.includes(def.id)) {
        showNotif('❌ Ce héros s\'obtient uniquement via Gacha !');
        return;
    }

    const price = getHeroPrice(def);
    if (price > 0 && D(G.gold).lt(price)) { // §1.5
        showNotif(`❌ Pas assez d'Or ! (${fmt(G.gold)} / ${fmt(price)} Or)`);
        return;
    }

    G.gold = D(G.gold).sub(price); // §1.5
    const summonedType = HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)];
    G.heroes[def.id] = initHero(summonedType, def.id); // §2.2 ①
    
    // Auto add to squad if space
    const emptyIdx = G.squad.indexOf(null);
    if (emptyIdx >= 0) { G.squad[emptyIdx] = def.id; if (emptyIdx === 0) G.leaderId = def.id; }
    
    Sound.init(); Sound.playLevelUp();
    showNotif(`✨ ${def.titles[0]} rejoint l'équipe !`);
    (markSaveDirty(), saveGame());
    updateDisplays();
    openHeroModal(def.id);
    renderHeroesGrid();
}

function equipSphere(sphereId) {
    if (!currentHeroModal || !G.heroes[currentHeroModal]) return;
    const h = G.heroes[currentHeroModal];
    
    // Unequip current sphere
    if (h.equippedSphere) {
        if (!G.spheres[h.equippedSphere]) G.spheres[h.equippedSphere] = 0;
        G.spheres[h.equippedSphere]++;
        h.equippedSphere = null;
    }
    
    // Equip new sphere
    if (sphereId !== 'none' && SPHERE_DEFS[sphereId] && G.spheres[sphereId] > 0) {
        G.spheres[sphereId]--;
        h.equippedSphere = sphereId;
    }
    
    (markSaveDirty(), saveGame());
    updateDisplays();
    openHeroModal(currentHeroModal);
}

let currentHeroModal = null;
function openHeroModal(id) {
    currentHeroModal = id;
    const def = HERO_DEFS.find(d=>d.id===id);
    const h = G.heroes[id];
    
    const modal = document.getElementById('hero-modal');
    modal.style.setProperty('--hero-theme-color', ELEM_COLORS[def.elem] || '#fff');
    
    const lvlBadge = document.getElementById('hm-header-lvl');
    if (lvlBadge) lvlBadge.textContent = 'Lv.' + (h ? h.level : '1');
    
    const sphereIconEl = document.getElementById('hm-slot-sphere-icon');
    if (sphereIconEl) {
        if (h && h.equippedSphere && SPHERE_DEFS[h.equippedSphere]) {
            const icons = {
                bijou_sacre: '<i class="ra ra-gem" style="color:#00d2ff"></i>',
                barre_legwand: '<i class="ra ra-gold-bar" style="color:#f1c40f"></i>',
                pierre_choc: '<i class="ra ra-crossed-swords" style="color:#e74c3c"></i>'
            };
            sphereIconEl.innerHTML = icons[h.equippedSphere] || '💎';
        } else {
            sphereIconEl.innerHTML = '<i class="ra ra-plus"></i>';
        }
    }
    
    if (!h) {
        // --- PURCHASE MODE ---
        document.getElementById('hm-title').textContent = def.titles[0] + ' (Contrat)';
        const img = document.getElementById('hm-image'); img.src = getHeroImage(id, 3, 'full');
        document.getElementById('hm-stars').textContent = '★★★';
        document.getElementById('hm-elem').innerHTML = def.icon;
        document.getElementById('hm-lore').textContent = `"${def.lore}"`;
        
        document.getElementById('hm-type').textContent = 'Inconnu';
        document.getElementById('hm-lvl').textContent = '1 / 50';
        document.getElementById('hm-dps').textContent = fmt(def.baseDPS);
        document.getElementById('hm-hp-def').textContent = '??? HP / ??? DEF';
        document.getElementById('hm-lb').textContent = '+0%';
        document.getElementById('hm-ls').textContent = getLeaderSkillName(def.id);
        document.getElementById('hm-next-cap').textContent = 'Rejoignez l\'équipe pour dévoiler son potentiel.';
        document.getElementById('hm-evo-mats-row').style.display = 'none';
        document.getElementById('hm-sphere-row').style.display = 'none';

        document.getElementById('hm-actions-owned').style.display = 'none';
        const actionsBuy = document.getElementById('hm-actions-buy');
        actionsBuy.style.display = 'block';

        const btnBuy = document.getElementById('hm-btn-buy');
        if (GOLD_BUYABLE_HEROES.includes(def.id)) {
            // ── Achat or classique ──
            const price = getHeroPrice(def);
            btnBuy.innerHTML = `<span style="font-size:14px">${price === 0 ? 'Débloquer gratuitement' : 'Acheter Héros'}</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">${price === 0 ? '🆓 Gratuit' : fmt(price) + ' 🪙'}</span>`;
            btnBuy.disabled = price > 0 && D(G.gold).lt(price); // §1.5
            btnBuy.onclick = buyCurrentHero;
        } else if (GEMS_GACHA_HEROES.includes(def.id)) {
            // ── Héros Tier S/A → gacha gemmes ──
            btnBuy.innerHTML = `<span style="font-size:14px"><i class='ra ra-crystal-ball'></i> Invoquer</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">Rare Summon (5💎)</span>`;
            btnBuy.disabled = G.gems < 5;
            btnBuy.onclick = () => { closeHeroModal(); summonRare(); };
        } else {
            // ── Héros Tier B-mid → gacha PH ──
            btnBuy.innerHTML = `<span style="font-size:14px"><i class="ra ra-trophy"></i> Invoquer</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">Honor Summon (500 PH)</span>`;
            btnBuy.disabled = G.honorPoints < 500;
            btnBuy.onclick = () => { closeHeroModal(); summonHonor(); };
        }
    } else {
        // --- OWNED MODE ---
        document.getElementById('hm-actions-buy').style.display = 'none';
        document.getElementById('hm-actions-owned').style.display = 'flex';
        
        const maxLvl = EVO_LEVEL_CAPS[h.stars];
        const evoTargetStars = h.stars + 1;
        const evoZoneGate = (evoTargetStars <= 6) ? EVO_ZONE_GATES[evoTargetStars] : 999;
        const canEvolve = h.level >= maxLvl && h.stars < 6 && G.maxZone >= evoZoneGate;
        
        document.getElementById('hm-title').textContent = def.titles[h.stars - 3] + ` (${h.type})`;
        const img = document.getElementById('hm-image'); img.src = getHeroImage(id, h.stars, 'full');
        document.getElementById('hm-stars').textContent = '★'.repeat(h.stars);
        document.getElementById('hm-elem').innerHTML = def.icon;
        document.getElementById('hm-lore').textContent = `"${def.lore}"`;
        
        document.getElementById('hm-type').textContent = h.type || 'Lord';
        document.getElementById('hm-lvl').textContent = `${h.level} / ${maxLvl}`;
        document.getElementById('hm-dps').textContent = fmt(getHeroDPS(def, h));
        
        const tMod = TYPE_MODS[h.type || 'Lord'];
        const hHp = def.baseDPS * 18 * h.level * h.stars * tMod.hp;
        const hDef = def.baseDPS * 1.5 * h.level * h.stars * tMod.def;
        document.getElementById('hm-hp-def').textContent = `${fmt(hHp)} HP / ${fmt(hDef)} DEF`;
        
        document.getElementById('hm-lb').textContent = `+${h.duplicates * 10}%`;
        document.getElementById('hm-ls').textContent = getLeaderSkillName(def.id);
        
        // §2.1 — Éveils I/II/III uniquement
        const _heroAwakenings = [10, 50, 100];
        const nextHeroAwakening = _heroAwakenings.find(m => m > h.level);
        document.getElementById('hm-next-cap').textContent = nextHeroAwakening
            ? `Prochain Éveil : ${MILESTONE_LABELS[nextHeroAwakening]} (Niv.${nextHeroAwakening})`
            : '✦✦✦ Tous les Éveils atteints';

        // SPHERES
        document.getElementById('hm-sphere-row').style.display = 'flex';
        const sphereSelect = document.getElementById('hm-sphere-select');
        let optionsHtml = `<option value="none">-- Aucune --</option>`;
        if (h.equippedSphere && SPHERE_DEFS[h.equippedSphere]) {
            optionsHtml += `<option value="${h.equippedSphere}" selected>${SPHERE_DEFS[h.equippedSphere].name} (Équipée)</option>`;
        }
        Object.keys(G.spheres).forEach(sId => {
            if (G.spheres[sId] > 0 && SPHERE_DEFS[sId]) {
                optionsHtml += `<option value="${sId}">${SPHERE_DEFS[sId].name} (${G.spheres[sId]})</option>`;
            }
        });
        sphereSelect.innerHTML = optionsHtml;

        const lvlRow = document.getElementById('hm-levelup-row');
        if (h.level < maxLvl) {
            const remaining = maxLvl - h.level;
            const cost1   = getHeroLevelCost(def, h);
            const levels10 = Math.min(10, remaining);
            const cost10  = calcBulkCost(def, h, levels10);
            const costMax = calcBulkCost(def, h, remaining);
            const canAny  = D(G.gold).gte(cost1); // §1.5

            const btn1 = document.getElementById('hm-btn-lvlup');
            btn1.disabled = !canAny;
            document.getElementById('hm-cost-1').textContent = fmt(cost1) + ' Or';

            const btn10 = document.getElementById('hm-btn-lvlup10');
            btn10.disabled = !canAny;
            document.getElementById('hm-cost-10').textContent =
                levels10 < 10 ? `×${levels10} — ${fmt(cost10)} Or` : `${fmt(cost10)} Or`;

            const { count: affordCount, cost: affordCost } = calcAffordableLevels(def, h, remaining);
            const btnMax = document.getElementById('hm-btn-lvlupmax');
            btnMax.disabled = affordCount === 0;
            document.getElementById('hm-cost-max').textContent =
                affordCount > 0 ? `×${affordCount} — ${fmt(affordCost)} Or` : 'Or insuffisant';

            lvlRow.style.display = 'flex';
        } else {
            lvlRow.style.display = 'none';
        }

        const btnEvo = document.getElementById('hm-btn-evolve');
        const evoRow = document.getElementById('hm-evo-mats-row');
        
        if (h.stars < 6 && h.level >= maxLvl) {
            if (!canEvolve) {
                btnEvo.textContent = `🔒 Zone ${evoZoneGate - 1} Boss requis pour ${evoTargetStars}★`;
                btnEvo.disabled = true;
                btnEvo.style.display = 'block';
                evoRow.style.display = 'none';
            } else {
                const evoCost = EVO_COSTS[h.stars];
                btnEvo.textContent = `Évoluer en ${h.stars+1}★ (${fmt(evoCost)} 🪙)`;
                
                evoRow.style.display = 'flex';
                const reqs = getEvolutionRequirements(def.elem, h.stars);
                let listStr = "";
                let hasMats = true;
                
                reqs.forEach(req => {
                    if (req.item === 'duplicate') {
                        const owned = h.duplicates || 0;
                        const color = owned >= req.qty ? '#2ecc71' : '#e74c3c';
                        listStr += `<span style="color:${color}">Doublons sacrifiés : ${owned} / ${req.qty}</span>`;
                        if (owned < req.qty) hasMats = false;
                    } else {
                        const owned = G.materials[req.item] || 0;
                        const matName = MATERIAL_DEFS[req.item].name;
                        const color = owned >= req.qty ? '#2ecc71' : '#e74c3c';
                        listStr += `<span style="color:${color}">${matName} : ${owned} / ${req.qty}</span>`;
                        if (owned < req.qty) hasMats = false;
                    }
                });
                
                document.getElementById('hm-evo-mats-list').innerHTML = listStr;
                btnEvo.disabled = D(G.gold).lt(evoCost) || !hasMats; // §1.5
                btnEvo.style.display = 'block';
            }
        } else {
            btnEvo.style.display = 'none';
            evoRow.style.display = 'none';
        }
        
        const squadBtn = document.getElementById('hm-btn-squad');
        const inSquad = G.squad.includes(id);
        if (inSquad) {
            const isLeader = G.squad[0] === id;
            squadBtn.textContent = isLeader ? "Retirer de la Squad (Déjà Leader)" : "Promouvoir Leader / Retirer";
        } else {
            squadBtn.textContent = "Ajouter à la Squad";
        }
    }

    // Evo progress bar (Amélioration 3.3)
    if (G.heroes[id]) renderEvoProgressBar(id);

    document.getElementById('hero-modal').classList.add('visible');
    BGM.update();
}

function toggleSphereSelect() {
    const row = document.getElementById('hm-sphere-row');
    if (row.style.display === 'none' || row.style.display === '') {
        row.style.display = 'flex';
    } else {
        row.style.display = 'none';
    }
}

function getEvolutionRequirements(elem, stars) {
    const elemLower = elem === 'Feu' ? 'fire' : elem === 'Eau' ? 'water' : elem === 'Terre' ? 'earth' : elem === 'Foudre' ? 'thunder' : elem === 'Lumière' ? 'light' : 'dark';
    // 3★ → 4★ : matériaux standards
    if (stars === 3) {
        return [
            { item: `${elemLower}_crystal`, qty: 1 },
            { item: 'mimic', qty: 1 }
        ];
    }
    // 4★ → 5★ : matériaux + 1 doublon sacrifié (Axe 4)
    else if (stars === 4) {
        return [
            { item: `${elemLower}_crystal`, qty: 1 },
            { item: `${elemLower}_idol`, qty: 1 },
            { item: 'mimic', qty: 1 },
            { item: 'duplicate', qty: 1 }   // Axe 4 : sacrifice 1 doublon
        ];
    }
    // 5★ → 6★ : matériaux rares + 2 doublons sacrifiés (Axe 4)
    else if (stars === 5) {
        return [
            { item: `${elemLower}_idol`, qty: 1 },
            { item: `${elemLower}_totem`, qty: 1 },
            { item: 'mimic', qty: 2 },
            { item: 'duplicate', qty: 2 }   // Axe 4 : sacrifice 2 doublons
        ];
    }
    return [];
}

function closeHeroModal() { document.getElementById('hero-modal').classList.remove('visible'); renderHeroesGrid(); BGM.update(); }

// §2.1 — Détecte les passages d'Éveil et déclenche la célébration
const _AWAKENING_LEVELS = [10, 50, 100];
const _AWAKENING_NAMES  = { 10: 'Éveil I', 50: 'Éveil II', 100: 'Éveil III' };
const _AWAKENING_GEMS   = { 10: 3, 50: 5, 100: 10 };
function _checkHeroAwakening(heroId, def, prevLevel, newLevel) {
    _AWAKENING_LEVELS.forEach(threshold => {
        if (prevLevel < threshold && newLevel >= threshold) {
            const name = _AWAKENING_NAMES[threshold];
            const gemReward = _AWAKENING_GEMS[threshold];
            G.gems += gemReward;
            setTimeout(() => {
                showNotif(`✦ ${def.titles[def.titles.length - 1] || def.id} — ${name} atteint ! +${gemReward} Gemmes`);
                screenFlash('rgba(255,215,0,0.35)');
            }, 200);
        }
    });
}

function levelUpCurrentHero(times = 1) {
    const h = G.heroes[currentHeroModal];
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    const cap = EVO_LEVEL_CAPS[h.stars];
    if (h.level >= cap) return;

    if (times === 'max') {
        // CORRECTION MAJEURE : On calcule le maximum de niveaux achetables avec l'Or ACTUEL du joueur
        const remainingToCap = cap - h.level;
        const { count, cost } = calcAffordableLevels(def, h, remainingToCap);
        
        if (count > 0) {
            const prevLevel = h.level;
            G.gold = D(G.gold).sub(cost); // §1.5
            h.level += count;
            Sound.playLevelUp();
            showNotif(`⬆ ${def.titles[h.stars - 3]} a gagné +${count} niveaux !`);
            _checkHeroAwakening(currentHeroModal, def, prevLevel, h.level); // §2.1
        } else {
            showNotif("❌ Pas assez d'Or pour acheter un niveau !");
        }
    } else {
        // Mode classique +1 ou +10
        const maxLevels = Math.min(times, cap - h.level);
        const { count, cost } = calcAffordableLevels(def, h, maxLevels);
        if (count > 0) {
            const prevLevel = h.level;
            G.gold = D(G.gold).sub(cost); // §1.5
            h.level += count;
            Sound.playLevelUp();
            _checkHeroAwakening(currentHeroModal, def, prevLevel, h.level); // §2.1
        }
    }
    
    openHeroModal(currentHeroModal);
    (markSaveDirty(), saveGame());
    updateDisplays();
}

function evolveCurrentHero() {
    const h = G.heroes[currentHeroModal];
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    const cost = EVO_COSTS[h.stars];
    const reqs = getEvolutionRequirements(def.elem, h.stars);
    
    // Axe 3 : vérification de zone
    const evoTargetStars = h.stars + 1;
    const evoZoneGate = (evoTargetStars <= 6) ? EVO_ZONE_GATES[evoTargetStars] : 999;
    if (G.maxZone < evoZoneGate) {
        showNotif(`🔒 Zone ${evoZoneGate - 1} Boss requis pour évoluer en ${evoTargetStars}★ !`);
        return;
    }
    
    let hasMats = true;
    reqs.forEach(req => {
        if (req.item === 'duplicate') {
            if ((h.duplicates || 0) < req.qty) hasMats = false;  // Axe 4 : doublons
        } else {
            const owned = G.materials[req.item] || 0;
            if (owned < req.qty) hasMats = false;
        }
    });
    
    if(D(G.gold).gte(cost) && h.level >= EVO_LEVEL_CAPS[h.stars] && h.stars < 6 && hasMats) { // §1.5
        G.gold = D(G.gold).sub(cost); // §1.5
        reqs.forEach(req => {
            if (req.item === 'duplicate') {
                h.duplicates -= req.qty;    // Axe 4 : consomme les doublons
            } else {
                G.materials[req.item] -= req.qty;
            }
        });
        h.stars++; h.level = 1; Sound.playLevelUp(); screenFlash('#fff'); openHeroModal(currentHeroModal);
        // Pilier 3: achievement 6★
        if (h.stars === 6) setTimeout(() => triggerAchievementShare('hero_6star', { heroId: currentHeroModal }), 600);
        (markSaveDirty(), saveGame());
    }
}

function toggleSquadCurrentHero() {
    const id = currentHeroModal;
    const index = G.squad.indexOf(id);
    
    if (index >= 0) {
        if (index === 0) {
            const others = G.squad.slice(1).filter(s => s !== null);
            if (others.length === 0) {
                alert("Vous devez garder au moins 1 héros dans la Squad !");
                return;
            }
            const nextIndex = G.squad.indexOf(others[0]);
            G.squad[nextIndex] = null;
            G.squad[0] = others[0];
            G.leaderId = others[0];
        } else {
            G.squad[index] = G.squad[0];
            G.squad[0] = id;
            G.leaderId = id;
        }
    } else {
        const emptyIndex = G.squad.indexOf(null);
        if (emptyIndex >= 0) {
            G.squad[emptyIndex] = id;
        } else {
            G.squad[3] = id;
        }
        if (!G.squad[0]) { G.squad[0] = id; G.leaderId = id; }
    }
    
    openHeroModal(id);
    renderHeroesGrid();
}

// =============================================================
// SUMMON SYSTEM (RARE & HONOR)
// =============================================================
// Axe 5 : Tiers de rareté gacha
// Tier S (5%) : Sera, Magress — héros 6★-ready ultra-puissants
// Tier A (25%) : Margonia, Eze, Atro, Kikuri — héros 4★-ready d'utilité
// Tier B (70%) : les 6 héros standards
/* §câblage : SUMMON_POOLS fourni par assets/globals.bundle.js (src/data) */

// Option A — Équilibrage : seuls les 4 premiers héros sont achetables avec l'or.
// Les Tier S/A + zeln/karl s'obtiennent uniquement via gacha.
// TOUS les héros sont achetables en or, en deux vagues (cf. getHeroPrice) :
//   Vague 1 = 1 attaquant par élément (prix doux) → couverture multi-élément rapide
//   Vague 2 = le second héros de chaque élément (plus cher et plus fort)
// Le gacha (gemmes/PH) reste un raccourci/bonus qui peut aussi donner des doublons (+10%).
const GOLD_BUYABLE_HEROES = HERO_DEFS.map(d => d.id);
const GEMS_GACHA_HEROES   = [...SUMMON_POOLS.S, ...SUMMON_POOLS.A];
const PH_GACHA_HEROES     = ['zeln', 'vargas', ...SUMMON_POOLS.A];

function summonRare() {
    if (G.gems < 5) { showNotif('❌ Pas assez de gemmes !'); return; }
    G.gems -= 5;

    // Use pity-aware roll (Amélioration 3.2)
    const result = _applyPityAndRoll();
    if (result.type === 'hero_S') {
        triggerSummonAnimation(6, () => _grantSummonedHero(result.heroId));
    } else if (result.type === 'hero_A') {
        triggerSummonAnimation(5, () => _grantSummonedHero(result.heroId));
    } else if (result.type === 'sphere') {
        if (!G.spheres[result.sId]) G.spheres[result.sId] = 0;
        G.spheres[result.sId]++;
        triggerSummonAnimation(5, () => showSphereReveal(result.sId, SPHERE_DEFS[result.sId]));
    } else {
        if (!G.materials[result.mId]) G.materials[result.mId] = 0;
        G.materials[result.mId]++;
        triggerSummonAnimation(5, () => showMaterialReveal(result.mId, MATERIAL_DEFS[result.mId]));
    }

    updatePityDisplay(); updateDisplays(); (markSaveDirty(), saveGame());
}

// Axe 1 : Honor Summon coûte 500 PH (Points d'Honneur) au lieu de 2 000 Or
function summonHonor() {
    const cost = 500;
    if (G.honorPoints < cost) { showNotif(`❌ Pas assez de Points d'Honneur ! (${fmt(G.honorPoints)} / ${cost} PH)`); return; }
    G.honorPoints -= cost;

    // Option A — Probabilités Honor Summon (500 PH)
    // 15% Héros Tier A | 15% Héros Tier B-mid (zeln, karl) | 70% Matériaux pondérés
    const phRoll = Math.random();
    if (phRoll < 0.15) {
        // ── Héros Tier A ──
        const heroId = SUMMON_POOLS.A[Math.floor(Math.random() * SUMMON_POOLS.A.length)];
        triggerSummonAnimation(4, () => _grantSummonedHero(heroId));
    } else if (phRoll < 0.30) {
        // ── Héros Tier B-mid (zeln, vargas) ──
        const bMid = ['zeln', 'vargas'];
        const heroId = bMid[Math.floor(Math.random() * bMid.length)];
        triggerSummonAnimation(3, () => _grantSummonedHero(heroId));
    } else {
        // ── Matériaux pondérés ──
        const allKeys = Object.keys(MATERIAL_DEFS);
        // Cristaux (3★) : 50%, Idoles (4★) : 30%, Totems (5★) : 10%, Mimics : 10%
        const weights = allKeys.map(k => {
            if (k === 'mimic') return 10;
            if (k.includes('_totem')) return 10;
            if (k.includes('_idol')) return 30;
            return 50; // crystal
        });
        const totalW = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalW;
        let rolledKey = allKeys[0];
        for (let i = 0; i < allKeys.length; i++) {
            r -= weights[i];
            if (r <= 0) { rolledKey = allKeys[i]; break; }
        }
        const mat = MATERIAL_DEFS[rolledKey];
        if (!G.materials[rolledKey]) G.materials[rolledKey] = 0;
        G.materials[rolledKey]++;
        triggerSummonAnimation(3, () => showMaterialReveal(rolledKey, mat));
    }

    updateDisplays(); (markSaveDirty(), saveGame());
}

// Accorde un héros invoqué : si déjà possédé → +1 duplicate (Limit Break), sinon unlock
function _grantSummonedHero(heroId) {
    const def = HERO_DEFS.find(d => d.id === heroId);
    if (!def) return;
    const isNew = !G.heroes[heroId];
    if (G.heroes[heroId]) {
        // Déjà possédé → Limit Break
        const h = G.heroes[heroId];
        h.limitBreak = (h.limitBreak !== undefined ? h.limitBreak : (h.duplicates || 0)) + 1;
        h.duplicates = h.limitBreak; // sync duplicates for backwards compatibility
        showNotif(`✨ Doublon obtenu ! ${def.name} passe Limit Break +${h.limitBreak} (+5% de statistiques permanentes)`);
    } else {
        const summonedType = HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)];
        G.heroes[heroId] = initHero(summonedType, heroId); // §2.2 ①
        G.heroes[heroId].limitBreak = 0;
        G.heroes[heroId].duplicates = 0;
        const emptyIdx = G.squad.indexOf(null);
        if (emptyIdx >= 0) { G.squad[emptyIdx] = heroId; if (emptyIdx === 0) G.leaderId = heroId; }
        showNotif(`🌟 ${def.name} rejoint l'équipe !`);
    }
    showHeroReveal(heroId, G.heroes[heroId], isNew);
    renderHeroesGrid();
    updateDisplays();
    (markSaveDirty(), saveGame());
}

function triggerSummonAnimation(stars, onReveal) {
    const btnRare   = document.getElementById('rare-summon-btn');
    const btnRare10 = document.getElementById('rare-summon-10-btn');
    const btnHonor  = document.getElementById('honor-summon-btn');
    if (btnRare)   btnRare.disabled   = true;
    if (btnRare10) btnRare10.disabled = true;
    if (btnHonor)  btnHonor.disabled  = true;

    // Overlay portail avec couleur de rareté
    const overlay = document.getElementById('summon-gate-overlay');
    const glow    = document.getElementById('sg-glow');
    glow.className = 'sg-glow rarity-' + Math.min(stars, 6);
    overlay.classList.add('active');
    Sound.init(); Sound.playHit();

    setTimeout(() => {
        Sound.playSummon();
        overlay.classList.remove('active');

        // Flash blanc rapide
        const flash = document.getElementById('summon-overlay');
        flash.style.cssText = 'display:block; opacity:1; background:#fff;';
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => { flash.style.display = 'none'; }, 350);
            if (btnRare)   btnRare.disabled   = false;
            if (btnRare10) btnRare10.disabled = false;
            if (btnHonor)  btnHonor.disabled  = false;
            onReveal();
        }, 160);
    }, 1600);
}

// ---- REVEAL HÉROS ----
const REVEAL_COLORS = { 3:'#6a9fff', 4:'#e6bc00', 5:'#ff5588', 6:'#c084fc' };
const REVEAL_BGS    = {
    3:'linear-gradient(180deg,#040c1e,#0a1840 55%,#000)',
    4:'linear-gradient(180deg,#0e0800,#281a00 55%,#000)',
    5:'linear-gradient(180deg,#120008,#300015 55%,#000)',
    6:'linear-gradient(180deg,#0e0025,#200050 55%,#000)'
};

function showHeroReveal(heroId, heroData, isNew) {
    const def   = HERO_DEFS.find(d => d.id === heroId);
    const stars = Math.min(heroData.stars, 6);
    const glow  = REVEAL_COLORS[stars] || REVEAL_COLORS[3];
    const bg    = REVEAL_BGS[stars]    || REVEAL_BGS[3];

    document.getElementById('reveal-bg').style.background = bg;
    const portrait = document.getElementById('reveal-portrait');
    portrait.src = getHeroImage(heroId, heroData.stars, 'full');
    portrait.style.display = 'block';
    document.getElementById('reveal-material-emoji').style.display = 'none';

    const nameEl = document.getElementById('reveal-hero-name');
    nameEl.textContent = def.titles[heroData.stars - 3];
    nameEl.style.color = glow;
    nameEl.style.textShadow = `0 0 30px ${glow}88, 0 2px 20px rgba(0,0,0,.9)`;

    document.getElementById('reveal-hero-info').innerHTML =
        `${def.elem} ${def.icon} · ${heroData.type} · ` +
        (isNew ? '<span style="color:#2ecc71">✨ NOUVEAU !</span>'
               : '<span style="color:#f1c40f">🔄 Doublon +10% Stats</span>');

    _openReveal(stars, glow);
}

function showSphereReveal(sphereId, sphereDef) {
    document.getElementById('reveal-bg').style.background = 'linear-gradient(180deg,#120008,#300015 55%,#000)';
    document.getElementById('reveal-portrait').style.display = 'none';
    const emojiEl = document.getElementById('reveal-material-emoji');
    emojiEl.textContent = '∞'; emojiEl.style.display = 'block';

    const nameEl = document.getElementById('reveal-hero-name');
    nameEl.textContent = sphereDef.name; nameEl.style.color = '#ff5588';
    nameEl.style.textShadow = `0 0 20px #ff558866, 0 2px 12px rgba(0,0,0,.9)`;
    document.getElementById('reveal-hero-info').innerHTML = `<span style="color:#ff5588">Sphère Légendaire</span>`;

    _openReveal(5, '#ff5588');
}


function showMaterialReveal(matKey, mat) {
    const matEmojis = { crystal:'💎', idol:'🏺', totem:'🗿', mimic:'📦' };
    const emojiKey  = Object.keys(matEmojis).find(k => matKey.includes(k)) || 'crystal';

    document.getElementById('reveal-bg').style.background = 'linear-gradient(180deg,#040818,#0a1530 55%,#000)';
    document.getElementById('reveal-portrait').style.display = 'none';
    const emojiEl = document.getElementById('reveal-material-emoji');
    emojiEl.textContent = matEmojis[emojiKey]; emojiEl.style.display = 'block';

    const nameEl = document.getElementById('reveal-hero-name');
    nameEl.textContent = mat.name; nameEl.style.color = mat.color;
    nameEl.style.textShadow = `0 0 20px ${mat.color}66, 0 2px 12px rgba(0,0,0,.9)`;
    document.getElementById('reveal-hero-info').innerHTML = `<span style="color:${mat.color}">${mat.rarity}</span>`;

    _openReveal(3, mat.color);
}

function _openReveal(stars, glow) {
    const starsEl = document.getElementById('reveal-stars-container');
    starsEl.innerHTML = '';
    const reveal = document.getElementById('summon-reveal');
    reveal.style.display = 'flex'; requestAnimationFrame(() => reveal.classList.add('visible')); // §1.4

    for (let i = 0; i < Math.min(stars, 6); i++) {
        setTimeout(() => {
            const s = document.createElement('span');
            s.className = 'reveal-star'; s.textContent = '★'; s.style.color = glow;
            s.style.animationDelay = '0s'; starsEl.appendChild(s);
            if (!Sound.sfxMuted) Sound.playClaim();
        }, 450 + i * 180);
    }
}

// P4 §3.5 — la révélation se ferme d'un tap n'importe où (skippable)
document.getElementById('summon-reveal')?.addEventListener('click', function(e) {
    if (this.classList.contains('visible') && e.target.id !== 'reveal-continue-btn') closeReveal();
});
function closeReveal() {
    const reveal = document.getElementById('summon-reveal');
    reveal.classList.remove('visible');
    setTimeout(() => { reveal.style.display = 'none'; }, 400);
    renderHeroesGrid(); renderAchievements(); updateDisplays();
    _updateSummonGlow();
}

function _updateSummonGlow() {
    const rareBtn   = document.getElementById('rare-summon-btn');
    const rare10Btn = document.getElementById('rare-summon-10-btn');
    const honorBtn  = document.getElementById('honor-summon-btn');

    const isSummonOverlayActive = document.getElementById('summon-gate-overlay')?.classList.contains('active');
    const isRevealActive = document.getElementById('summon-reveal')?.classList.contains('visible');
    
    if (isSummonOverlayActive || isRevealActive) {
        if (rareBtn)   rareBtn.disabled   = true;
        if (rare10Btn) rare10Btn.disabled = true;
        if (honorBtn)  honorBtn.disabled  = true;
        return;
    }

    if (rareBtn) {
        rareBtn.disabled = G.gems < 5;
        if (G.gems >= 5) rareBtn.classList.add('can-afford');
        else rareBtn.classList.remove('can-afford');
    }
    if (rare10Btn) {
        rare10Btn.disabled = G.gems < 45;
        if (G.gems >= 45) rare10Btn.classList.add('can-afford');
        else rare10Btn.classList.remove('can-afford');
    }
    if (honorBtn) {
        honorBtn.disabled = G.honorPoints < 500;
        honorBtn.classList.toggle('can-afford', G.honorPoints >= 500);
    }
}

function renderMaterialsPanel() {
    const container = document.getElementById('materials-container');
    const list = document.getElementById('materials-list');
    
    let html = "";
    let hasMats = false;
    
    Object.keys(MATERIAL_DEFS).forEach(key => {
        const owned = G.materials[key] || 0;
        if (owned > 0) {
            hasMats = true;
            const def = MATERIAL_DEFS[key];
            html += `<span class="material-badge" style="background:${def.color}">${def.name} x${owned}</span>`;
        }
    });
    
    container.style.display = hasMats ? 'block' : 'none';
    list.innerHTML = hasMats ? html : "Aucun composant d'évolution possédé.";
}

// =============================================================
// SKILLS & BRAVE BURST TRIGGERING
// =============================================================
function usePlayerSkill(id) {
    if(G.playerSkillsCd[id] > 0) return;
    Sound.init(); Sound.playBB();
    if(id === 'strike') {
        // §SOUTIEN — "Frappe" reconvertie : Soutien Massif — injecte 50 BC à tous les héros
        G.playerSkillsCd.strike = 30;
        const bonusBc = 50;
        G.squad.filter(sid => sid !== null && G.heroes[sid]).forEach(sid => {
            const def = HERO_DEFS.find(d => d.id === sid);
            const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
            if (!G.bbGauges[sid]) G.bbGauges[sid] = 0;
            G.bbGauges[sid] = Math.min(100, G.bbGauges[sid] + (bonusBc / bbCost) * 100);
        });
        renderFooterBB();
        screenFlash('rgba(96,165,250,0.4)');
        showNotif('✨ Soutien Massif ! +50 BC pour toute l\'équipe !');
    } else if (id === 'wealth') {
        G.playerSkillsCd.wealth = 60;
        G.playerSkillsActive.wealth = 15;
        screenFlash('#f1c40f');
    } else if (id === 'frenzy') {
        G.playerSkillsCd.frenzy = 60;
        G.playerSkillsActive.frenzy = 15;
        screenFlash('#e74c3c');
    }
}

function renderSkills() {
    const pContainer = document.getElementById('player-skills-container');
    let pHtml = '';
    const pSkills = [
        { id: 'strike', icon: '<i class="ra ra-crossed-swords" style="color:#e74c3c"></i>', name: 'Frappe Foudroyante', desc: 'Inflige 50x vos dégâts de Clic', cd: G.playerSkillsCd.strike, maxCd: 30 },
        { id: 'wealth', icon: '<i class="ra ra-gold-bar" style="color:#f1c40f"></i>',       name: 'Aura de Richesse', desc: 'Double les gains d\'Or pendant 15s', cd: G.playerSkillsCd.wealth, maxCd: 60, active: G.playerSkillsActive.wealth>0 },
        { id: 'frenzy', icon: '<i class="ra ra-lightning-bolt"></i>', name: 'Frénésie', desc: 'Multiplie le DPS par 3 pendant 15s', cd: G.playerSkillsCd.frenzy, maxCd: 60, active: G.playerSkillsActive.frenzy>0 },
    ];
    pSkills.forEach(s => {
        const ready = s.cd <= 0;
        pHtml += `<div class="skill-card">
            <div class="skill-icon">${s.icon}</div>
            <div class="skill-info">
                <div class="skill-name player">${s.name} ${s.active?'(ACTIF)':''}</div>
                <div class="skill-desc">${s.desc}</div>
            </div>
            <button class="skill-btn player-skill ${ready?'ready':''}" ${ready?'':'disabled'} onclick="usePlayerSkill('${s.id}')">
                ${ready ? 'USE' : Math.ceil(s.cd)+'s'}
            </button>
        </div>`;
    });
    pContainer.innerHTML = pHtml;

    const hContainer = document.getElementById('hero-skills-container');
    let hHtml = '';
    
    G.squad.forEach(id => {
        if (!id || !G.heroes[id]) return;
        const h = G.heroes[id];
        const def = HERO_DEFS.find(d => d.id === id);
        
        let bcCostModifier = 0;
        if (G.leaderId && G.heroes[G.leaderId]) {
            const lDef = HERO_DEFS.find(d => d.id === G.leaderId);
            if (lDef && lDef.leaderSkill && lDef.leaderSkill.statModifier === 'bb_cost') {
                bcCostModifier = lDef.leaderSkill.modifierValue;
            }
        }
        const requiredBc = Math.ceil(def.bb.cost * (1 + bcCostModifier));
        const ready = (G.bbGauges[id] || 0) >= 100;
        const dpsDmg = getHeroDPS(def, h) * (def.bb.multiplier || 40);
        
        let descStr = `Inflige ${fmt(dpsDmg)} dégâts élémentaires`;
        if (def.role === 'tank') {
            descStr = `Atténuation -50% dégâts reçus (10s) + ${fmt(dpsDmg)} dégâts (${def.element})`;
        } else if (def.role === 'support') {
            if (def.bb.effectType === 'heal_bc' && def.bb.effectValue <= 1.0) {
                descStr = `Soin ${def.bb.effectValue * 100}% HP + ${fmt(dpsDmg)} dégâts (${def.element})`;
            } else if (def.bb.effectType === 'heal_bc') {
                descStr = `Infection +${def.bb.effectValue} BC à toute la squad + ${fmt(dpsDmg)} dégâts (${def.element})`;
            }
        } else if (def.role === 'mage') {
            descStr = `Frappe Pure — ${fmt(dpsDmg)} dégâts destructeurs (${def.element})`;
        }
        
        const currentBc = Math.floor((G.bbGauges[id] || 0) / 100 * requiredBc);
        
        hHtml += `<div class="skill-card">
            <div class="skill-icon">${def.icon}</div>
            <div class="skill-info">
                <div class="skill-name">${def.titles[h.stars - 3]} — Brave Burst</div>
                <div class="skill-desc">${descStr} · Charge: ${currentBc}/${requiredBc} BC</div>
            </div>
            <button class="skill-btn ${ready?'ready':''}" ${ready?'':'disabled'} onclick="useBB('${def.id}')">
                ${ready ? 'BB !' : 'CHARGING'}
            </button>
        </div>`;
    });
    
    hContainer.innerHTML = hHtml || '<div style="color:#6a7a9a; text-align:center; padding:10px; font-size:11px;">Ajoutez des héros à votre Squad active pour débloquer leurs Brave Bursts. Taper sur l\'écran génère des Battle Crystals (BC) pour les charger.</div>';
}

function useBB(id) {
    const h = G.heroes[id]; const def = HERO_DEFS.find(d=>d.id===id);
    if (!def || !h) return;
    
    // Leader skill BC cost reduction modifier check
    let bcCostModifier = 0;
    if (G.leaderId && G.heroes[G.leaderId]) {
        const lDef = HERO_DEFS.find(d => d.id === G.leaderId);
        if (lDef && lDef.leaderSkill && lDef.leaderSkill.statModifier === 'bb_cost') {
            bcCostModifier = lDef.leaderSkill.modifierValue; // ex: -0.20
        }
    }
    
    const requiredBc = def.bb.cost * (1 + bcCostModifier);
    const gauge = G.bbGauges[id] || 0;
    if (gauge < requiredBc) return;
    
    G.bbGauges[id] = Math.max(0, G.bbGauges[id] - requiredBc);
    G.totalBBUses = (G.totalBBUses || 0) + 1;

    const tier     = getBBTier(id); // §2.2 ④ — SBB/UBB selon l'évolution
    const tierMult = BB_TIER_MULT[tier] || 1.0;
    const dps = getHeroDPS(def, h);
    const multiplier = def.bb.multiplier || 50;
    const sparkMult  = getActiveSparkMult(); // §2.2 ④ — Multiplicateur Spark actif
    const dmg = dps * multiplier * tierMult * sparkMult;
    recordBBForSpark(id); // §2.2 ④ — Log pour détection de Spark chain
    
    const ov = document.getElementById('bb-overlay'); ov.classList.add('active');
    const portraitEl = document.getElementById('bb-portrait-img');
    const stripeEl = ov.querySelector('.bb-stripe');
    const fullImages = {
        'ignis': 'assets/heroes/full img/Ignis-trois-etoile.png',
        'selena': 'assets/heroes/full img/Selena-trois-etoile.png',
        'sera': 'assets/heroes/full img/Sera-trois-etoile.png',
        'atro': 'assets/heroes/full img/Atro-trois-etoile.png',
        'lance': 'assets/heroes/full img/Lance_trois_etoile.png',
        'vargas': 'assets/heroes/full img/Vargas-trois-etoile.png',
        'margonia': 'assets/heroes/full img/Margonia-trois-etoile.png',
        'zeln': 'assets/heroes/full img/Zeln_trois_etoile.png',
        'kikuri': 'assets/heroes/full img/Kikuri-trois-etoile.png',
        'magress': 'assets/heroes/full img/Magress-trois-etoile.png',
        'eze': 'assets/heroes/full img/Eza_trois_etoile.png',
        'karl': 'assets/heroes/full img/Karl-trois-etoile.png'
    };

    if (portraitEl) {
        portraitEl.classList.remove('animate');
        // §1.4 — reflow supprimé : on force la transition en retirant puis ajoutant la classe
        if (fullImages[id]) {
            portraitEl.src = fullImages[id];
            portraitEl.style.color = (BB_THEMES[def.elem]||BB_THEMES['Feu']).c1;
            portraitEl.classList.add('animate');
        }
    }
    if (stripeEl) {
        const themeColor = (BB_THEMES[def.elem]||BB_THEMES['Feu']).c1;
        stripeEl.style.background = `linear-gradient(90deg, transparent, ${themeColor}66, ${themeColor}aa, ${themeColor}66, transparent)`;
        stripeEl.classList.add('active');
    }

    Sound.playBB();

    // ── Canvas particle burst ──────────────────────────────────
    triggerBBCanvas(def.elem, def.name, fmt(dmg));

    // ── Labels animation ───────────────────────────────────────
    const heroLabel  = document.getElementById('bb-hero-label');
    const burstLabel = document.getElementById('bb-burst-label');
    // §2.2 ④ — Affiche le tier (BB/SBB/UBB) sur le label
    if (burstLabel) burstLabel.style.color = BB_TIER_COLOR[tier] || '#00d2ff';
    const dmgEl      = ov.querySelector('.bb-dmg-text');

    if (heroLabel)  { heroLabel.style.opacity = '0'; heroLabel.style.transition = 'opacity 0.2s'; }
    if (burstLabel) { burstLabel.style.opacity = '0'; burstLabel.style.transition = 'opacity 0.25s 0.1s'; }
    if (dmgEl)      { dmgEl.style.transition = 'none'; dmgEl.style.opacity = '0'; dmgEl.style.transform = 'translateX(-50%) scale(0.3)'; dmgEl.style.color = (BB_THEMES[def.elem]||BB_THEMES['Feu']).c1; }

    requestAnimationFrame(() => {
        if (heroLabel)  heroLabel.style.opacity  = '1';
        if (burstLabel) burstLabel.style.opacity = '1';
    });

    if (dmgEl) dmgEl.textContent = fmt(dmg);
    
    // Archetype actions
    const role = def.role || 'mage';
    
    if (role === 'mage') {
        // Pure damage - no secondary effects, high modifier applied directly
    } else if (role === 'tank') {
        // Mitigation / Boss attack debuff active for 10 seconds
        G.mitigationActive = true;
        G.monsterDebuff = 10;
        screenFlash('rgba(230,126,34,0.3)');
        setTimeout(() => {
            G.mitigationActive = false;
            updatePartyStats();
        }, 10000);
    } else if (role === 'support') {
        if (def.bb.effectType === 'heal_bc') {
            if (def.bb.effectValue <= 1.0) {
                // Heal Squad based on Max HP ratio (0.50 or 1.00)
                healParty(Math.floor(G.partyMaxHp * def.bb.effectValue));
            } else {
                // Flat BC generation injected into other units (+30 BC)
                G.squad.forEach(sid => {
                    if (sid && sid !== id && G.heroes[sid]) {
                        if (!G.bbGauges[sid]) G.bbGauges[sid] = 0;
                        G.bbGauges[sid] = Math.min(100, G.bbGauges[sid] + def.bb.effectValue);
                    }
                });
                renderFooterBB();
            }
        }
    }
    
    // Impact + damage at 200ms
    setTimeout(() => {
        G.monsterHp = D(G.monsterHp).sub(dmg); // §1.5
        screenFlash((ELEM_COLORS[def.elem] || '#fff') + '99');
        triggerMonsterHitVisuals(true, true); // Trigger huge hit shake/flash on BB impact!
        if (D(G.monsterHp).lte(0)) killMonster(); else updateHpBar(); // §1.5
    }, 200);

    // Damage number reveal at 450ms
    setTimeout(() => {
        const d = ov.querySelector('.bb-dmg-text');
        if (d) {
            d.style.transition = 'opacity 0.15s, transform 0.3s cubic-bezier(.22,1,.36,1)';
            d.style.opacity = '1';
            d.style.transform = 'translateX(-50%) scale(1)';
        }
    }, 450);

    // P5 — fermeture à 1300ms (< 1,5s) ET skippable au tap (les dégâts sont déjà appliqués à 200ms)
    let _bbClosed = false;
    const _bbClose = () => {
        if (_bbClosed) return;
        _bbClosed = true;
        ov.style.pointerEvents = 'none';
        const heroLabel  = document.getElementById('bb-hero-label');
        const burstLabel = document.getElementById('bb-burst-label');
        const d = ov.querySelector('.bb-dmg-text');
        if (heroLabel)  { heroLabel.style.transition  = 'opacity 0.2s'; heroLabel.style.opacity  = '0'; }
        if (burstLabel) { burstLabel.style.transition = 'opacity 0.2s'; burstLabel.style.opacity = '0'; }
        if (d)          { d.style.transition = 'opacity 0.2s'; d.style.opacity = '0'; }

        const bbBgEl = ov.querySelector('.bb-bg');
        if (bbBgEl) { bbBgEl.style.transition = 'opacity 0.25s'; bbBgEl.style.opacity = '0'; }

        const stripeEl2 = ov.querySelector('.bb-stripe');
        if (stripeEl2) stripeEl2.classList.remove('active');

        const portraitEl2 = document.getElementById('bb-portrait-img');
        if (portraitEl2) portraitEl2.classList.remove('animate');

        setTimeout(() => {
            ov.classList.remove('active');
            if (d) { d.style.transition = 'none'; d.style.transform = 'translateX(-50%) scale(0.3)'; }
            if (bbBgEl) bbBgEl.style.transition = 'none';
            if (portraitEl2) portraitEl2.removeAttribute('src');
        }, 260);
    };
    setTimeout(_bbClose, 1300);
    ov.style.pointerEvents = 'auto';
    ov.onclick = _bbClose; // tap n'importe où = skip
    
    renderFooterBB();
    updateDisplays();
}

function renderFooterBB() {
    const c = document.getElementById('footer-bb-slots');
    let html = '';
    
    const hpPct = Math.max(0, G.partyHp / G.partyMaxHp * 100);
    
    // Rendre exactement 6 slots (3 lignes x 2 colonnes) pour correspondre au visuel Brave Frontier
    for (let i = 0; i < 6; i++) {
        const id = G.squad[i];
        if (!id || !G.heroes[id]) {
            html += `<div class="footer-bb empty-slot" onclick="openTeamBuilder()">
                <div class="fbb-portrait-wrap">
                    <div class="fbb-portrait-container empty">
                        <span class="empty-slot-plus"><i class="ra ra-plus"></i></span>
                    </div>
                </div>
                <div class="fbb-stats-container">
                    <div class="fbb-name-row">
                        <span class="fbb-name" style="color:rgba(255,255,255,0.25)">Vide</span>
                    </div>
                </div>
            </div>`;
            continue;
        }
        const def = HERO_DEFS.find(d => d.id === id);
        const gauge = G.bbGauges[id] || 0;
        const ready = gauge >= 100;
        
        let bcCostModifier = 0;
        if (G.leaderId && G.heroes[G.leaderId]) {
            const lDef = HERO_DEFS.find(d => d.id === G.leaderId);
            if (lDef && lDef.leaderSkill && lDef.leaderSkill.statModifier === 'bb_cost') {
                bcCostModifier = lDef.leaderSkill.modifierValue;
            }
        }
        const requiredBc = Math.ceil(def.bb.cost * (1 + bcCostModifier));
        const currentBc = Math.floor(gauge / 100 * requiredBc);
        const heroImg = getHeroImage(def.id, def.stars, 'squad');
        
        const isDead = G.partyHp <= 0 || G.deathTimer > 0;
        html += `<div class="footer-bb ${ready?'ready':''} ${isDead?'deceased':''}" onclick="useBB('${def.id}')">
            <div class="fbb-portrait-wrap">
                <div class="fbb-portrait-container">
                    <img class="fbb-portrait-img" src="${heroImg}" alt="${def.name}">
                </div>
            </div>
            <div class="fbb-elem-badge elem-${def.elem}"></div>
            <div class="fbb-stats-container">
                <div class="fbb-name-row">
                    <span class="fbb-name">${def.name}</span>
                </div>
                <div class="fbb-bb-label-row">
                    <span class="fbb-bb-label-text">BRAVE BURST</span>
                </div>
                <div class="fbb-bc-bar-track">
                    <div class="fbb-bc-bar-fill bb-gauge-fill-slot" style="width:${gauge}%"></div>
                </div>
            </div>
        </div>`;
    }
    
    c.innerHTML = html;
}

// =============================================================
// ACHIEVEMENTS
// =============================================================
let _achSig = '';
function renderAchievements(force = false) {
    const isDesktop = window.innerWidth >= 1024;
    if(!isDesktop && !document.querySelector('.tab-btn[data-tab="achievements"]')?.classList.contains('active')) return;
    const container = document.getElementById('achievements-container');
    // P4 §3.7 — rebuild seulement si l'état a changé (plus de rebuild par kill)
    const sig = G.achievementsClaimed.length + '|' + ACHIEVEMENTS_DEFS.map(a => a.req(G) ? 1 : 0).join('');
    if (!force && sig === _achSig && container.childElementCount > 0) return;
    _achSig = sig;
    let html = '';
    ACHIEVEMENTS_DEFS.forEach(ach => {
        const isClaimed = G.achievementsClaimed.includes(ach.id);
        const isCompleted = ach.req(G);
        html += `<div class="ach-card ${isClaimed?'claimed':''}">
            <div class="ach-info">
                <div class="ach-name">${ach.name}</div>
                <div class="ach-desc">${ach.desc}</div>
            </div>
            ${isClaimed 
                ? `<div style="color:#2ecc71; font-weight:700; font-size:12px;">✓ Obtenu</div>` 
                : `<button class="ach-btn" ${!isCompleted?'disabled':''} onclick="claimAchievement('${ach.id}')">
                    ${isCompleted ? `Récupérer ${ach.reward}💎` : `${ach.reward}💎`}
                   </button>`
            }
        </div>`;
    });
    container.innerHTML = html;
}
window.claimAchievement = function(id) {
    if(G.achievementsClaimed.includes(id)) return;
    const ach = ACHIEVEMENTS_DEFS.find(a=>a.id===id);
    if(ach && ach.req(G)) {
        G.gems += ach.reward; G.achievementsClaimed.push(id);
        Sound.playClaim(); pulseCurrency('gems-display'); updateDisplays(); renderAchievements(true);
    }
}

// =============================================================
// PRESTIGE REBIRTH
// =============================================================
// renderPrestigePanel and doPrestigeChoice defined above (Améliorations 3.4)
// Legacy doPrestige kept as alias for compatibility
function doPrestige() { openPrestigeChoiceModal(); }

// =============================================================
// TABS & DRAWER LOGIC
// =============================================================
// Rendu d'un onglet (partagé : tiroir de combat & sections du hub)
function _runTabRender(tabName) {
    if(tabName === 'worldmap') onWorldMapOpen(); // §2.3
    if(tabName === 'heroes') renderHeroesGrid();
    if(tabName === 'skills') { renderSkills(); renderFooterBB(); }
    if(tabName === 'achievements') renderAchievements();
    if(tabName === 'gacha') renderMaterialsPanel();
    if(tabName === 'prestige') {
        renderPrestigePanel();
        const presValEl = document.getElementById('pres-crystals-val');
        const presBonusEl = document.getElementById('pres-crystals-bonus');
        if (presValEl) presValEl.textContent = G.prestigeCrystals;
        if (presBonusEl) presBonusEl.textContent = G.prestigeCrystals;
    }
    if(tabName === 'settings') { renderPerfToggle(); renderSettingsPanel(); }
    if(tabName === 'shop') renderShopPanel();
}

function openDrawer(tabName) {
    if (tabName === 'hub') { openHub(); return; } // Hub = overlay dédié, pas un tab-panel (AVANT le lookup tabBtn)
    // ── Un seul jeu : hors stage, TOUTE section s'ouvre DANS le hub
    //    (header + barre du bas du hub conservés, jamais l'ancien tiroir) ──
    if (!G.currentStage && tabName !== 'worldmap') {
        openHub();
        openHubSection(tabName);
        return;
    }
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (!tabBtn) return;

    document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));

    tabBtn.classList.add('active');
    const panel = document.getElementById('panel-' + tabName);
    if (panel) panel.classList.add('active');

    // Update drawer header label
    const titleLbl = document.getElementById('drawer-title-lbl');
    if (titleLbl) {
        titleLbl.textContent = tabBtn.textContent.trim().replace('✕', '').trim();
    }

    // Open drawer on mobile
    const tabContent = document.getElementById('tab-content');
    if (tabContent) tabContent.classList.remove('collapsed');

    _runTabRender(tabName);

    setTimeout(resizeP, 250);
}

function closeDrawer(toHub = true) {
    const tabContent = document.getElementById('tab-content');
    if (tabContent) tabContent.classList.add('collapsed');

    if (window.innerWidth < 1024) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    }
    setTimeout(resizeP, 250);

    // Un seul jeu : hors stage, fermer un panneau ramène toujours au Hub
    if (toHub && !G.currentStage && typeof openHub === 'function') {
        const hub = document.getElementById('hub-menu');
        if (hub && hub.classList.contains('hidden')) openHub();
    }
}

// Responsive Layout DOM reorganization
let _currentLayoutMode = '';
// §3.4 — initResponsiveLayout : déplace les panneaux entre wings desktop ↔ drawers mobile
function initResponsiveLayout() {
    const isDesktop = false; // Forced to false for unified mobile/drawer emulator layout
    const targetMode = 'mobile';
    if (_currentLayoutMode === targetMode) return;
    _currentLayoutMode = targetMode;

    const tabBar          = document.getElementById('tab-bar');
    const tabContent      = document.getElementById('tab-content');
    const rwBar           = document.getElementById('right-wing-tab-bar');
    const rwContent       = document.getElementById('right-wing-tab-content');
    const leftWing        = document.getElementById('left-wing');
    const mobileContainer = document.getElementById('mobile-tab-bar-container');

    if (isDesktop) {
        // ── tab-bar → right-wing-tab-bar ──
        if (tabBar && rwBar && !rwBar.contains(tabBar)) rwBar.appendChild(tabBar);

        // ── Tous les tab-panels (sauf achievements/prestige) → right-wing-tab-content ──
        const skipIds = new Set(['panel-achievements', 'panel-prestige']);
        tabContent && tabContent.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.closest('#hub-panel-content')) return; // hébergé par le hub : ne pas déplacer
            if (!skipIds.has(panel.id) && !rwContent.contains(panel)) rwContent.appendChild(panel);
        });

        // ── panel-achievements + panel-prestige → left-wing ──
        ['panel-achievements', 'panel-prestige'].forEach(id => {
            const panel = document.getElementById(id);
            if (panel && leftWing && !leftWing.contains(panel)) leftWing.appendChild(panel);
        });

        // FIX : remettre #hero-modal dans la right wing au retour desktop
        const heroModalD = document.getElementById('hero-modal');
        const rightWingD = document.getElementById('right-wing');
        if (heroModalD && rightWingD && heroModalD.parentElement !== rightWingD) rightWingD.appendChild(heroModalD);

        // Rendu panneaux permanents
        if (typeof renderPrestigePanel === 'function') renderPrestigePanel();
        if (typeof renderAchievements  === 'function') renderAchievements();
        setTimeout(resizeP, 100);
    } else {
        // ── tab-bar → mobile-tab-bar-container ──
        if (tabBar && mobileContainer && !mobileContainer.contains(tabBar)) mobileContainer.appendChild(tabBar);

        // ── Tous les panneaux → tab-content ──
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.closest('#hub-panel-content')) return; // hébergé par le hub : ne pas déplacer
            if (tabContent && !tabContent.contains(panel)) tabContent.appendChild(panel);
        });
        // ── FIX mobile : #hero-modal vit dans #right-wing (display:none en mobile)
        // → il s'ouvrait dans un conteneur caché (0×0, invisible).
        // On le rattache à #game-window en mobile.
        const heroModal = document.getElementById('hero-modal');
        const gameWindow = document.getElementById('game-window');
        if (heroModal && gameWindow && heroModal.parentElement !== gameWindow) gameWindow.appendChild(heroModal);
        closeDrawer(false); // reshuffle de layout : ne jamais rouvrir le hub ici
    }
    BGM.update();
}
window.addEventListener('resize', initResponsiveLayout);
window.addEventListener('DOMContentLoaded', initResponsiveLayout);
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        Sound.init();
        const tabName = btn.dataset.tab;
        
        if (window.innerWidth < 1024) {
            const isAlreadyActive = btn.classList.contains('active');
            const isDrawerCollapsed = document.getElementById('tab-content').classList.contains('collapsed');
            
            if (isAlreadyActive && !isDrawerCollapsed) {
                closeDrawer();
            } else {
                openDrawer(tabName);
            }
        } else {
            openDrawer(tabName);
        }
        
        BGM.update();
    });
});

_updateSummonGlow();

// §1.6 — Chargement async (IDB → localStorage fallback)
(async () => {
    const loaded = await loadGameAsync();
    if (!loaded) {
        // Départ à zéro : aucun héros — le joueur invoque son premier héros avec les gems de départ
        G.squad = [null, null, null, null];
        G.leaderId = null;
        G.materials = { fire_crystal: 2, mimic: 3 };
    }
    // Auto-unlock test units at level 50
    if (!G.heroes) G.heroes = {};
    if (!G.heroes['unit_10012']) {
        G.heroes['unit_10012'] = { level: 50, stars: 5, duplicates: 0, limitBreak: 0, type: 'Lord', equippedSphere: null };
    }
    if (!G.heroes['unit_10013']) {
        G.heroes['unit_10013'] = { level: 50, stars: 5, duplicates: 0, limitBreak: 0, type: 'Lord', equippedSphere: null };
    }
    if (!G.heroes['unit_ignis_frame']) {
        G.heroes['unit_ignis_frame'] = { level: 50, stars: 5, duplicates: 0, limitBreak: 0, type: 'Lord', equippedSphere: null };
    }
    spawnMonster();
    // §1.2 — Forcer HP à plein après l'initialisation
    updatePartyStats();
    // §1.5 — S'assurer que gold et monsterHp sont des D même si pas de save
    if (!(G.gold instanceof _Dec)) G.gold = D(G.gold || 0);
    if (!(G.totalGold instanceof _Dec)) G.totalGold = D(G.totalGold || 0);
    if (!(G.monsterHp instanceof _Dec)) G.monsterHp = D(G.monsterHp || 10);
    if (!(G.monsterMaxHp instanceof _Dec)) G.monsterMaxHp = D(G.monsterMaxHp || 10);
    G.partyHp = G.partyMaxHp;
    updatePartyHpBar();
    // ── Hub & Ville : régén offline + Hub comme écran d'accueil ──
    townRegenTick(); // applique les charges accumulées hors-ligne
    migrateStagesFromMaxZone(); // Phase 2 — conversion zones infinies → stages
    // ── Phase 3 : reprise après rechargement ──
    if (G.currentStage) {
        // Stage en cours au moment de la fermeture → le chrono repart
        _stageStartTime = Date.now();
        _stageGoldStart = D(G.totalGold);
    } else {
        // Aucun stage lancé → pas de combat qui tourne en fond (un seul jeu : le hub)
        _stageEnded = true;
    }
    updateCombatVisibility();
    // Le Hub est TOUJOURS l'écran d'accueil. Le tutoriel démarre au lancement du 1er stage.
    openHub();
    markSaveDirty(); // §1.6 — marquer dirty après init pour persister l'état initial
})();

// Moteur de rafraîchissement visuel de l'inventaire des sphères
function updateSpheresInventoryDisplay() {
    const container = document.getElementById('global-spheres-stock');
    if (!container) return;
    
    let html = '';
    let count = 0;
    
    Object.keys(SPHERE_DEFS).forEach(sId => {
        const owned = G.spheres[sId] || 0;
        if (owned > 0) {
            count++;
            const def = SPHERE_DEFS[sId];
            let icon = '✦';
            if(sId === 'bijou_sacre') icon = '💎';
            if(sId === 'barre_legwand') icon = '🪙';
            html += `<span class="material-badge" style="background:#1c2445; border: 1px solid #00d2ff; padding: 5px 8px;">
                ${icon} ${def.name} (x${owned}) — <small style="color:#7a8ba8">${def.desc}</small>
            </span>`;
        }
    });
    
    if(count === 0) {
        html = `<span style="font-size:10px; color:#5a6a8a; font-style: italic;">Aucune sphère inactive en stock. Ouvrez des Rare Summons pour en trouver !</span>`;
    }
    container.innerHTML = html;
}

// Système de calcul automatique des gains hors-ligne (Idle Away Engine)
function checkOfflineGains() {
    if (!G.lastSave) return;
    
    const now = Date.now();
    const elapsedSeconds = Math.min(Math.floor((now - G.lastSave) / 1000), 28800);
    
    // Le joueur doit être parti au moins 2 minutes (120s)
    if (elapsedSeconds >= 120) {
        const teamDps = getTotalDPS();
        if (teamDps > 0) {
            // §5.3 — Gain équilibré : 35% du DPS d'équipe · §4.3 IAP No Ads+ double les gains offline
            const _offlineMult = iapOfflineIsDoubled() ? 0.70 : 0.35;
            const offlineGoldGained = Math.floor(elapsedSeconds * teamDps * _offlineMult);
            
            if (offlineGoldGained > 0) {
                // §5.3 — Mettre à jour lastSave AVANT de créditer pour éviter le double-crédit
                G.lastSave = Date.now();
                G.gold = D(G.gold).add(offlineGoldGained); // §1.5
                G.totalGold = D(G.totalGold).add(offlineGoldGained);
                (markSaveDirty(), saveGame()); // persiste immédiatement
                
                // §5.3 — Modale stylée au lieu de alert()
                setTimeout(() => showOfflineModal(elapsedSeconds, offlineGoldGained), 600);
            }
        }
    }
}

function showOfflineModal(elapsed, gold) {
    const mins = Math.floor(elapsed / 60);
    const hours = Math.floor(mins / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins % 60}min` : `${mins} minutes`;
    // §4.2 — cap check avant d'afficher le bouton pub
    const canWatchAd = adCapAvailable('offline');

    const overlay = document.createElement('div');
    overlay.id = 'offline-modal';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 400; display: flex;
        align-items: center; justify-content: center;
        background: rgba(11,14,20,0.92);
    `;
    overlay.innerHTML = `
        <div style="background: linear-gradient(160deg,#0d1a30,#060e1a); border: 2px solid #b4934c;
            border-radius: 16px; padding: 28px 32px; max-width: 340px; width: 90%; text-align: center;
            box-shadow: 0 0 40px rgba(180,147,76,0.3), inset 0 0 20px rgba(0,0,0,0.8);">
            <div style="font-size: 40px; margin-bottom: 12px;">💤</div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 18px; color: #f1c40f; font-weight: 700; margin-bottom: 8px;">
                Bon retour, Invocateur !
            </div>
            <div style="font-size: 13px; color: #a0b0c0; margin-bottom: 16px;">
                Pendant <strong style="color:#fff">${timeStr}</strong> d'absence,<br>
                ton équipe a continué de batailler.
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 22px; color: #f1c40f; font-weight: 700;
                background: rgba(241,196,15,0.1); border: 1px solid rgba(241,196,15,0.3);
                border-radius: 10px; padding: 10px 16px; margin-bottom: 16px;">
                🪙 +${fmt(gold)} Pièces d'Or
            </div>
            ${canWatchAd ? `
            <button onclick="adDoubleOfflineGains(${gold})"
                style="width:100%; background: linear-gradient(135deg,#7c3aed,#4f1d96); border: 1px solid #a78bfa;
                color: #fff; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
                padding: 11px 20px; border-radius: 8px; cursor: pointer; margin-bottom: 10px;
                box-shadow: 0 4px 14px rgba(124,58,237,0.5);">
                📺 Regarder une pub → ×2 Or (+${fmt(gold)})
            </button>` : ''}
            <button onclick="document.getElementById('offline-modal').remove(); updateDisplays();"
                style="width:100%; background: linear-gradient(135deg,#b4934c,#8a6d38); border: none; color: #fff;
                font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; padding: 10px 20px;
                border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                Reprendre l'aventure !
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// =============================================================
// §4.2 — REWARDED ADS MANAGER
// =============================================================

// ── Stub AdMob : remplacé par le SDK natif Capacitor/TWA en portage ──
const AdMob = {
    _ready: false,
    _onReady: [],
    init() { this._ready = true; this._onReady.forEach(fn => fn()); },
    isAvailable() { return this._ready; },
    showRewarded(placementId, onRewarded, onFallback) {
        // En production : AdMob.showRewardedAd(placementId).then(onRewarded).catch(onFallback)
        // Stub : simule une pub avec délai (remplacer par vrai SDK)
        if (!this._ready) { onFallback(); return; }
        // Pour l'instant pas de vraie pub dispo → fallback propre
        onFallback();
    }
};
// Auto-init stub (en production : attendre l'event 'admobReady' du plugin natif)
setTimeout(() => AdMob.init(), 500);

const AD_CAPS_DEFAULT = { offline: 0, goldBuff: 0, freeSummon: 0, lootReroll: 0, bossRevive: 0, townReset: 0 };
const AD_CAPS_MAX     = { offline: 1, goldBuff: 3, freeSummon: 1, lootReroll: 5, bossRevive: 2, townReset: 3 };

// Réinitialise les caps si on est un nouveau jour
function _resetAdCapsIfNeeded() {
    const today = getTodayDateStr();
    if (G.adDate !== today) {
        G.adDate = today;
        G.adCaps = Object.assign({}, AD_CAPS_DEFAULT);
    }
}

// Vérifie si un placement est encore disponible aujourd'hui
function adCapAvailable(placement) {
    _resetAdCapsIfNeeded();
    const max = AD_CAPS_MAX[placement];
    if (max === undefined) return true;
    return (G.adCaps[placement] || 0) < max;
}

// Point d'entrée unique pour tous les placements
// onRewarded() : appelé si la pub est regardée OU si fallback (le joueur reçoit la récompense de base)
function watchAdForReward(placement, onRewarded, onFallback) {
    _resetAdCapsIfNeeded();
    if (!adCapAvailable(placement)) {
        showNotif('📺 Limite quotidienne atteinte pour ce bonus.');
        return;
    }
    G.adCaps[placement] = (G.adCaps[placement] || 0) + 1;
    (markSaveDirty(), saveGame());

    AdMob.showRewarded(
        placement,
        () => { onRewarded(true);  },   // pub regardée → récompense complète
        () => { if (onFallback) onFallback(); else onRewarded(false); } // pas de pub → fallback
    );
}

// =============================================================
// SYSTÈME DE STAGES (Phase 2) — carte → zones → 5 stages → combat
// Équivalence d'équilibrage : stage global g = area×5 + stage + 1 = zone actuelle.
// =============================================================
const STAGES_PER_AREA = 5;

const MAP_DEFS = [
    {
        id: 0,
        name: 'Mistral',
        img: 'assets/map/map%201%20.png',
        areas: [
            // x/y en % de l'image de la carte (768×1376), parcours de bas en haut
            { id: 0, name: 'Gorges Ardentes',        x: 24, y: 88, elem: 'Feu' },
            { id: 1, name: 'Temple des Braises',     x: 56, y: 75, elem: 'Feu' },
            { id: 2, name: 'Lac Luminescent',        x: 66, y: 49, elem: 'Eau' },
            { id: 3, name: 'Forêt aux Champignons',  x: 24, y: 47, elem: 'Eau' },
            { id: 4, name: 'Temple de la Jungle',    x: 76, y: 26, elem: 'Terre' },
        ],
        // Lieux décoratifs verrouillés (teaser des maps suivantes)
        teasers: [
            { name: '???', x: 24, y: 23 },   // Château Sombre
            { name: '???', x: 52, y: 7 },    // Citadelle Céleste
        ]
    }
];

function stageKey(a, s) { return `${a}-${s}`; }
function stageGlobal(a, s) { return a * STAGES_PER_AREA + s + 1; } // = zone équivalente

function getStageInfo(a, s) {
    if (!G.stageProgress) G.stageProgress = {};
    return G.stageProgress[stageKey(a, s)] || { stars: 0, clears: 0, bestTime: 0 };
}

function isStageCleared(a, s) { return getStageInfo(a, s).stars >= 1; }

function isStageUnlocked(a, s) {
    if (a === 0 && s === 0) return true;
    // Stage précédent : (a, s-1), ou dernier stage de la zone précédente
    return s > 0 ? isStageCleared(a, s - 1) : isStageCleared(a - 1, STAGES_PER_AREA - 1);
}

function isAreaUnlocked(a) { return isStageUnlocked(a, 0); }

function isAreaCleared(a) {
    for (let s = 0; s < STAGES_PER_AREA; s++) if (!isStageCleared(a, s)) return false;
    return true;
}

function areaStars(a) {
    let total = 0;
    for (let s = 0; s < STAGES_PER_AREA; s++) total += getStageInfo(a, s).stars;
    return total;
}

// Migration : convertit la progression "zones infinies" (maxZone) en stages terminés.
// Zone z battue (z < maxZone) → stage global z terminé avec 1★ minimum.
function migrateStagesFromMaxZone() {
    if (!G.stageProgress) G.stageProgress = {};
    if (Object.keys(G.stageProgress).length > 0) return; // déjà migré / partie déjà en stages
    const beaten = Math.max(0, (G.maxZone || 1) - 1);
    const map = MAP_DEFS[0];
    const totalStages = map.areas.length * STAGES_PER_AREA;
    const n = Math.min(beaten, totalStages);
    for (let g = 1; g <= n; g++) {
        const a = Math.floor((g - 1) / STAGES_PER_AREA);
        const s = (g - 1) % STAGES_PER_AREA;
        G.stageProgress[stageKey(a, s)] = { stars: 1, clears: 1, bestTime: 0 };
    }
    if (n > 0) markSaveDirty();
}

// ── Écran Carte des Quêtes ──
function openQuestMap() {
    if (typeof Sound !== 'undefined') Sound.init();
    migrateStagesFromMaxZone();
    renderQuestMap();
    const qm = document.getElementById('quest-map-view');
    if (qm) qm.classList.remove('hidden');
    // Scroll vers la prochaine zone à jouer (la carte se parcourt de bas en haut)
    requestAnimationFrame(() => {
        const target = document.querySelector('.qm-area.is-new') || document.querySelector('.qm-area.is-current');
        if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement ? 'auto' : 'auto' });
        else { const sc = document.getElementById('qm-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; }
    });
}

function closeQuestMap() {
    closeAreaPanel();
    const qm = document.getElementById('quest-map-view');
    if (qm) qm.classList.add('hidden');
}

function renderQuestMap() {
    const container = document.getElementById('qm-areas');
    const nameEl = document.getElementById('qm-map-name');
    if (!container) return;
    const map = MAP_DEFS[0];
    if (nameEl) nameEl.textContent = map.name;

    let html = '';
    map.areas.forEach(area => {
        const unlocked = isAreaUnlocked(area.id);
        const cleared  = isAreaCleared(area.id);
        const started  = areaStars(area.id) > 0;
        const isNew    = unlocked && !started;
        let cls = 'qm-area';
        if (!unlocked) cls += ' is-locked';
        else if (isNew) cls += ' is-new';
        else if (cleared) cls += ' is-done';
        else cls += ' is-current';

        html += `<button class="${cls}" style="left:${area.x}%;top:${area.y}%"
            ${unlocked ? `onclick="openAreaPanel(${area.id})"` : 'disabled'}>
            ${isNew ? '<span class="qm-new">NEW AREA</span>' : ''}
            ${unlocked ? '<span class="qm-touch">TOUCH</span><span class="qm-hand">👆</span>' : '<span class="qm-lock">🔒</span>'}
            <span class="qm-area-banner">${area.name}</span>
            ${started ? `<span class="qm-area-stars">★ ${areaStars(area.id)}/${STAGES_PER_AREA * 3}</span>` : ''}
        </button>`;
    });
    (map.teasers || []).forEach(t => {
        html += `<div class="qm-area is-teaser" style="left:${t.x}%;top:${t.y}%">
            <span class="qm-lock">🔒</span>
            <span class="qm-area-banner">${t.name}</span>
        </div>`;
    });
    container.innerHTML = html;

    // Draw flowing dotted SVG paths between map areas
    drawMapPaths();
}

function drawMapPaths() {
    const svg = document.getElementById('qm-paths-svg');
    if (!svg) return;
    const areas = MAP_DEFS[0].areas;
    const teasers = MAP_DEFS[0].teasers || [];
    
    const points = [];
    areas.forEach(a => {
        points.push({ x: a.x, y: a.y, unlocked: isAreaUnlocked(a.id) });
    });
    teasers.forEach(t => {
        points.push({ x: t.x, y: t.y, unlocked: false });
    });
    
    let svgContent = '';
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        const isPathActive = p2.unlocked; 
        const strokeColor = isPathActive ? 'var(--c-amber)' : 'rgba(255,255,255,0.12)';
        const strokeDash = isPathActive ? '8 8' : '4 4';
        const filterGlow = isPathActive ? 'filter: drop-shadow(0 0 3px var(--c-amber-glow));' : '';
        const animation = isPathActive ? 'style="animation: qm-path-flow 2s linear infinite;"' : '';
        
        svgContent += `<line x1="${p1.x}%" y1="${p1.y}%" x2="${p2.x}%" y2="${p2.y}%" 
            stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" 
            stroke-dasharray="${strokeDash}" ${animation} style="${filterGlow}" />`;
    }
    svg.innerHTML = svgContent;
}

// ── Panneau des stages d'une zone ──
let _openAreaId = null;

function openAreaPanel(a) {
    if (typeof Sound !== 'undefined') Sound.init();
    _openAreaId = a;
    renderAreaPanel(a);
    const panel = document.getElementById('area-stages-panel');
    if (panel) panel.classList.remove('hidden');
}

function closeAreaPanel() {
    _openAreaId = null;
    const panel = document.getElementById('area-stages-panel');
    if (panel) panel.classList.add('hidden');
}

function renderAreaPanel(a) {
    const map = MAP_DEFS[0];
    const area = map.areas[a];
    if (!area) return;
    const titleEl = document.getElementById('asp-title');
    const starsEl = document.getElementById('asp-stars');
    const listEl  = document.getElementById('asp-stages');
    if (titleEl) titleEl.textContent = area.name;
    if (starsEl) starsEl.textContent = `★ ${areaStars(a)} / ${STAGES_PER_AREA * 3}`;
    if (!listEl) return;

    let html = '';
    for (let s = 0; s < STAGES_PER_AREA; s++) {
        const info = getStageInfo(a, s);
        const unlocked = isStageUnlocked(a, s);
        const isBossStage = (s === STAGES_PER_AREA - 1);
        const g = stageGlobal(a, s);
        const stars = '★'.repeat(info.stars) + '☆'.repeat(3 - info.stars);
        let bossName = '';
        if (isBossStage) {
            try { bossName = (typeof getBossNameForZone === 'function' && getBossNameForZone(g)) || 'Boss'; }
            catch (e) { bossName = 'Boss'; }
        }
        html += `<button class="asp-stage${unlocked ? '' : ' is-locked'}${info.stars > 0 ? ' is-done' : ''}"
            ${unlocked ? `onclick="startStage(${a},${s})"` : 'disabled'}>
            <span class="asp-stage-num">${a + 1}-${s + 1}</span>
            <span class="asp-stage-name">${isBossStage ? `👑 ${bossName}` : `Stage ${s + 1}`}${isBossStage ? '<span class="asp-boss-tag">BOSS</span>' : ''}</span>
            <span class="asp-stage-stars${info.stars > 0 ? ' lit' : ''}">${unlocked ? stars : '🔒'}</span>
        </button>`;
    }
    listEl.innerHTML = html;
}

// ── Lancement d'un stage ──
// Phase 2 : positionne le combat sur la zone équivalente (la boucle fermée
// vagues/victoire/étoiles arrive en Phase 3).
function startStage(a, s) {
    if (!isStageUnlocked(a, s)) { showNotif('🔒 Termine d\'abord le stage précédent !'); return; }
    if (typeof Sound !== 'undefined') Sound.init();
    const map = MAP_DEFS[0];
    const area = map.areas[a];
    G.currentStage = { area: a, stage: s };
    G.zone = stageGlobal(a, s);
    G.isTestCombat = false;
    G.monsterIndex = 0;
    G.isBoss = false;
    // ── Phase 3 : état de combat propre + chrono du stage ──
    G.deathTimer = 0;
    G.monsterFrozen = 0; G.monsterDebuff = 0;
    G.partyHp = G.partyMaxHp;
    updatePartyHpBar();
    _stageEnded = false;
    _stageStartTime = Date.now();
    _stageGoldStart = D(G.totalGold);
    G.monsterHp = D(getMonsterMaxHp());
    G.monsterMaxHp = D(getMonsterMaxHp());
    closeStageResult();
    closeAreaPanel();
    closeQuestMap();
    closeHub();
    closeDrawer();
    updateHpBar(true);
    spawnMonster();
    invalidateStats();
    updateDisplays();
    updateCombatVisibility();
    if (!G.tutorialDone) initTutorial(); // le tuto guide le joueur dans son premier stage
    showNotif(`⚔ ${area.name} ${a + 1}-${s + 1}`);
    (markSaveDirty(), saveGame());
}

// Le combat n'existe que pendant un stage : hors stage, l'arène est masquée
function updateCombatVisibility() {
    document.body.classList.toggle('out-of-stage', !G.currentStage);
}

// ── Phase 3 : boucle fermée de stage (chrono, étoiles, victoire/défaite) ──
let _stageEnded = false;        // gèle simulate() quand un écran de résultat est affiché
let _stageStartTime = 0;        // chrono du stage en cours
let _stageGoldStart = null;     // totalGold au lancement (→ or gagné pendant le stage)
let _lastStage = null;          // { a, s } — pour Rejouer / Stage suivant

// Seuils d'étoiles (validé : ★★ et ★★★ basées sur le temps)
function stageStarTimes(isBossStage) {
    return isBossStage ? { two: 120000, three: 60000 } : { two: 90000, three: 45000 };
}

function computeStageStars(elapsedMs, isBossStage) {
    const t = stageStarTimes(isBossStage);
    if (elapsedMs <= t.three) return 3;
    if (elapsedMs <= t.two) return 2;
    return 1;
}

// Premier stage débloqué non terminé (pour le label de la porte Quête Principale)
function nextRecommendedStage() {
    const map = MAP_DEFS[0];
    for (let a = 0; a < map.areas.length; a++) {
        for (let s = 0; s < STAGES_PER_AREA; s++) {
            if (isStageUnlocked(a, s) && !isStageCleared(a, s)) return { a, s };
        }
    }
    return null; // tout est terminé
}

function finishStage(victory) {
    const cs = G.currentStage;
    if (!cs) return;
    const a = cs.area, s = cs.stage;
    _lastStage = { a, s };
    _stageEnded = true;
    G.currentStage = null;
    G.isBoss = false;
    G.deathTimer = 0;
    G.isTestCombat = false;
    updateCombatVisibility();

    if (!victory) {
        showStageResult({ victory: false, a, s });
        (markSaveDirty(), saveGame());
        return;
    }

    const elapsed = Math.max(0, Date.now() - (_stageStartTime || Date.now()));
    const isBossStage = (s === STAGES_PER_AREA - 1);
    const stars = computeStageStars(elapsed, isBossStage);

    // Progression (les meilleures étoiles sont conservées)
    const prev = getStageInfo(a, s);
    const firstClear = (prev.clears || 0) === 0;
    G.stageProgress[stageKey(a, s)] = {
        stars: Math.max(prev.stars || 0, stars),
        clears: (prev.clears || 0) + 1,
        bestTime: prev.bestTime ? Math.min(prev.bestTime, elapsed) : elapsed
    };

    // Récompense de première complétion
    let firstGems = 0;
    if (firstClear) {
        firstGems = isBossStage ? 5 : 2;
        G.gems += firstGems;
    }

    // EXP d'Invocateur
    const g = stageGlobal(a, s);
    const exp = 8 + 2 * g;
    G.summonerExp = (G.summonerExp || 0) + exp;
    let lvlUps = 0;
    while (G.summonerExp >= summonerExpMax(G.summonerLevel || 1)) {
        G.summonerExp -= summonerExpMax(G.summonerLevel || 1);
        G.summonerLevel = (G.summonerLevel || 1) + 1;
        lvlUps++;
    }

    // Or gagné pendant le stage
    let goldGained = D(0);
    try { goldGained = D(G.totalGold).sub(_stageGoldStart || D(G.totalGold)); } catch (e) {}

    if (typeof Sound !== 'undefined' && Sound.playClaim) Sound.playClaim();
    showStageResult({ victory: true, a, s, stars, elapsed, firstClear, firstGems, exp, lvlUps, goldGained });
    if (lvlUps > 0) setTimeout(() => showNotif(`🎖 Rang d'Invocateur ${G.summonerLevel} atteint !`), 600);
    (markSaveDirty(), saveGame());
}

// ── Écran de résultat (victoire & défaite) ──
function showStageResult(r) {
    const overlay = document.getElementById('stage-result-overlay');
    if (!overlay) return;
    const map = MAP_DEFS[0];
    const area = map.areas[r.a];
    const stageLabel = `${area ? area.name : 'Zone'} ${r.a + 1}-${r.s + 1}`;

    const titleEl = document.getElementById('sr-title');
    const stageEl = document.getElementById('sr-stage');
    const starsEl = document.getElementById('sr-stars');
    const detailsEl = document.getElementById('sr-details');
    const btnsEl = document.getElementById('sr-buttons');
    const boxEl = document.getElementById('sr-box');

    stageEl.textContent = stageLabel;

    if (r.victory) {
        titleEl.textContent = 'VICTOIRE !';
        boxEl.className = 'sr-box victory';
        starsEl.style.display = 'flex';
        starsEl.innerHTML = [1, 2, 3].map(i =>
            `<span class="sr-star${i <= r.stars ? ' lit' : ''}" style="animation-delay:${0.15 * i}s">★</span>`
        ).join('');
        const secs = (r.elapsed / 1000).toFixed(1);
        const t = stageStarTimes(r.s === STAGES_PER_AREA - 1);
        let html = `<div class="sr-row">⏱ Temps : <b>${secs}s</b> <span class="sr-hint">(★★ ≤ ${t.two/1000}s · ★★★ ≤ ${t.three/1000}s)</span></div>`;
        if (r.goldGained && D(r.goldGained).gt(0)) html += `<div class="sr-row">🪙 Or gagné : <b>+${fmt(r.goldGained)}</b></div>`;
        html += `<div class="sr-row">📖 EXP : <b>+${r.exp}</b>${r.lvlUps > 0 ? ` <span class="sr-lvlup">RANG ${G.summonerLevel} !</span>` : ''}</div>`;
        if (r.firstClear) html += `<div class="sr-row sr-first">🎁 Première victoire : <b>+${r.firstGems} 💎</b></div>`;
        detailsEl.innerHTML = html;

        const next = nextRecommendedStage();
        let btns = '';
        if (next) btns += `<button class="sr-btn primary" onclick="stageResultNext(${next.a},${next.s})">▶ Stage suivant (${next.a + 1}-${next.s + 1})</button>`;
        btns += `<button class="sr-btn" onclick="stageResultRetry()">↻ Rejouer</button>`;
        btns += `<button class="sr-btn ghost" onclick="stageResultHub()">🏠 Hub</button>`;
        btnsEl.innerHTML = btns;
    } else {
        titleEl.textContent = 'DÉFAITE…';
        boxEl.className = 'sr-box defeat';
        starsEl.style.display = 'none';
        detailsEl.innerHTML = `<div class="sr-row">Ta squad a été vaincue. Améliore tes héros,
            change ta formation ou retente ta chance !</div>`;
        btnsEl.innerHTML = `
            <button class="sr-btn primary" onclick="stageResultRetry()">↻ Relancer le stage</button>
            <button class="sr-btn ghost" onclick="stageResultHub()">🏠 Retour au Hub</button>`;
    }
    overlay.classList.remove('hidden');
}

function closeStageResult() {
    const overlay = document.getElementById('stage-result-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function stageResultRetry() {
    if (!_lastStage) { stageResultHub(); return; }
    closeStageResult();
    startStage(_lastStage.a, _lastStage.s); // remet _stageEnded = false
}

function stageResultNext(a, s) {
    closeStageResult();
    startStage(a, s);
}

function stageResultHub() {
    closeStageResult();
    openHub(); // _stageEnded reste true : pas de combat hors stage
}

function startCombatTest() {
    if (typeof Sound !== 'undefined') Sound.init();
    
    G.isTestCombat = true;
    G.currentStage = { area: 0, stage: 0, isTest: true };
    G.zone = 1;
    G.monsterIndex = 0;
    G.isBoss = false;
    G.deathTimer = 0;
    G.monsterFrozen = 0; 
    G.monsterDebuff = 0;
    
    G.partyHp = G.partyMaxHp;
    updatePartyHpBar();
    
    _stageEnded = false;
    _stageStartTime = Date.now();
    _stageGoldStart = D(G.totalGold);
    
    G.monsterMaxHp = D("100000000000000000000000000000000");
    G.monsterHp = D(G.monsterMaxHp);
    
    closeStageResult();
    closeAreaPanel();
    closeQuestMap();
    closeHub();
    closeDrawer();
    
    updateHpBar(true);
    spawnMonster();
    invalidateStats();
    updateDisplays();
    updateCombatVisibility();
    
    showNotif("⚔️ Zone de Test : Combat infini !");
}

// =============================================================
// HUB MENU (Portail d'Elgaia) & LA VILLE — récolte de composants
// =============================================================
const TOWN_NODE_MAX = 5;
const TOWN_REGEN_MS = 10 * 60 * 1000; // 1 charge / 10 min
const TOWN_ELEMS = ['fire', 'water', 'earth', 'thunder', 'light', 'dark'];
const TOWN_NODE_DEFS = {
    crystals: { name: 'Gisement de Cristaux', suffix: '_crystal' },
    idols:    { name: 'Rivière de Vie',       suffix: '_idol' },
    totems:   { name: 'Arbre des Esprits',    suffix: '_totem' },
    mimics:   { name: 'Manoir Hanté',         special: true } // mimic / or / PH
};

function _townEnsureState() {
    if (!G.townNodes) G.townNodes = { crystals: TOWN_NODE_MAX, idols: TOWN_NODE_MAX, totems: TOWN_NODE_MAX, mimics: TOWN_NODE_MAX };
}

// La régén de la Ville ne dépend pas de simulate() (gelé hors stage) :
// tick indépendant toutes les 30s pour les charges + pastilles du hub.
setInterval(() => { try { townRegenTick(); } catch (e) {} }, 30000);

// Régénération timestamp-based : appelée par simulate() (toutes les 5s) et au boot.
// Gère l'offline et clamp les horloges manipulées (townLastRegen > now).
function townRegenTick() {
    _townEnsureState();
    const now = Date.now();
    if (!G.townLastRegen || G.townLastRegen > now) { G.townLastRegen = now; markSaveDirty(); return; }
    const keys = Object.keys(TOWN_NODE_DEFS);
    const allFull = keys.every(k => (G.townNodes[k] || 0) >= TOWN_NODE_MAX);
    if (allFull) {
        // Plein partout → ne pas banquer du temps : le compteur repart d'ici
        G.townLastRegen = now;
    } else {
        const gained = Math.floor((now - G.townLastRegen) / TOWN_REGEN_MS);
        if (gained > 0) {
            keys.forEach(k => { G.townNodes[k] = Math.min(TOWN_NODE_MAX, (G.townNodes[k] || 0) + gained); });
            G.townLastRegen += gained * TOWN_REGEN_MS;
            markSaveDirty();
            const tv = document.getElementById('town-view');
            if (tv && !tv.classList.contains('hidden')) renderTownView();
            const hub = document.getElementById('hub-menu');
            if (hub && !hub.classList.contains('hidden')) renderHubCurrencies();
        }
    }
    _updateTownRegenInfo();
}

function _updateTownRegenInfo() {
    const el = document.getElementById('town-regen-info');
    if (!el) return;
    const keys = Object.keys(TOWN_NODE_DEFS);
    const allFull = keys.every(k => (G.townNodes[k] || 0) >= TOWN_NODE_MAX);
    if (allFull) { el.textContent = '✨ Gisements pleins'; return; }
    const remaining = Math.max(0, TOWN_REGEN_MS - (Date.now() - (G.townLastRegen || Date.now())));
    const m = Math.floor(remaining / 60000), s = Math.floor((remaining % 60000) / 1000);
    el.textContent = `⏳ Prochaine charge : ${m}m ${String(s).padStart(2, '0')}s`;
}

// ── Navigation Hub ──
function openHub() {
    if (typeof Sound !== 'undefined') Sound.init();
    closeTown();
    closeDrawer(false); // false : éviter la récursion closeDrawer → openHub
    G.isTestCombat = false;
    _claimTurnCombatReward(); // crédite les gains d'un combat tour par tour gagné
    renderHubCurrencies();
    const hub = document.getElementById('hub-menu');
    if (hub) hub.classList.remove('hidden');
    document.body.classList.add('hub-open'); // remonte fiche héros & animations d'invocation au-dessus du hub

    // Initialiser et recentrer le carrousel des portes
    initHubCarousel();
    setTimeout(() => {
        scrollToGateIndex(0, 'auto');
        updateHubCarouselVisuals();
    }, 50);
}

function closeHub() {
    closeHubPanel(); // restituer le panneau hébergé avant de quitter le hub (combat en a besoin)
    const hub = document.getElementById('hub-menu');
    if (hub) hub.classList.add('hidden');
    document.body.classList.remove('hub-open');
}

// ── Sections DANS le hub : le panneau est déplacé entre le header et la barre du bas ──
const HUB_SECTION_LABELS = {
    heroes: '🛡️ Unités', shop: '💎 Boutique', gacha: '🔮 Invocations',
    skills: '✨ Skills', achievements: '📖 Succès & Quêtes',
    prestige: '👑 Prestige', settings: '⚙️ Paramètres'
};
let _hubPanelTab = null;

function openHubSection(tabName) {
    const panel = document.getElementById('panel-' + tabName);
    const host = document.getElementById('hub-panel-host');
    const content = document.getElementById('hub-panel-content');
    if (!panel || !host || !content) { closeHub(); return; }

    // Restituer un éventuel panneau précédent
    if (_hubPanelTab && _hubPanelTab !== tabName) closeHubPanel();

    document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
    content.appendChild(panel);
    panel.classList.add('active');
    _hubPanelTab = tabName;

    const titleEl = document.getElementById('hub-panel-title');
    if (titleEl) titleEl.textContent = HUB_SECTION_LABELS[tabName] || tabName;
    host.classList.remove('hidden');
    const hub = document.getElementById('hub-menu');
    if (hub) hub.classList.add('panel-open');

    _runTabRender(tabName);
    _syncHubBBActive(tabName);
}

function closeHubPanel() {
    const host = document.getElementById('hub-panel-host');
    if (host) host.classList.add('hidden');
    const hub = document.getElementById('hub-menu');
    if (hub) hub.classList.remove('panel-open');
    if (_hubPanelTab) {
        const panel = document.getElementById('panel-' + _hubPanelTab);
        if (panel) panel.classList.remove('active');
        _hubPanelTab = null;
        // Restituer le panneau à son conteneur d'origine (tiroir mobile / aile desktop)
        _currentLayoutMode = '';
        initResponsiveLayout();
    }
    _syncHubBBActive(null);
}

// Bouton Home / fermeture de section → retour à l'accueil du hub
function closeHubPanelToHome() {
    if (typeof Sound !== 'undefined') Sound.init();
    closeHubPanel();
    openHub();
}

function _syncHubBBActive(tabName) {
    document.querySelectorAll('.hub-bb-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.sec || 'home') === (tabName || 'home'));
    });
}

function hubNavigate(dest) {
    if (typeof Sound !== 'undefined') Sound.init();
    if (dest === 'coliseum') { showNotif('🏟️ Le Colisée ouvrira ses portes dans une prochaine version !'); return; }
    if (dest === 'town') { openTown(); return; }
    if (dest === 'combat_test') {
        startCombatTest();
        return;
    }
    if (dest === 'turncombat') {
        openTurnCombat();
        return;
    }
    if (dest === 'main') {
        // Stage en cours (hub ouvert via 🏠 pendant le combat) → retour direct au combat
        if (G.currentStage) { closeHub(); closeDrawer(false); return; }
        openQuestMap(); return;
    }
    // Toutes les autres sections s'ouvrent DANS le hub (header + barre du bas conservés)
    openHubSection(dest);
}

// ── PONT vers le combat tour par tour (combat-turn.html) ──────────────────
// Map élément FR (biomes) -> clé EN attendue par le moteur tour par tour
const TURNCOMBAT_ELEM_MAP = { 'Feu':'fire', 'Eau':'water', 'Terre':'earth', 'Foudre':'thunder', 'Lumière':'light', 'Ténèbres':'dark' };
// Décor de biome par élément (fichiers réels du dossier assets/Biome)
const TURNCOMBAT_BG = {
    fire:    "assets/Biome/Biome FEU _ Les Cavernes d'Agni.png",
    water:   "assets/Biome/Biome EAU _ L'Océan Éternel.png",
    earth:   "assets/Biome/Biome TERRE _ La Forêt de Gaïa.png",
    thunder: "assets/Biome/Biome FOUDRE _ Le Pic Foudroyé.png",
    light:   "assets/Biome/Biome LUMIÈRE _ Le Sanctuaire Céleste.png",
    dark:    "assets/Biome/Biome TÉNÈBRES _ Le Néant des Ombres.png",
};

// Ouvre la page de combat tour par tour en lui passant le thème de la zone courante.
function openTurnCombat() {
    try {
        const zone  = G.zone || 1;
        const biome = (typeof BIOME_DEFS !== 'undefined') ? BIOME_DEFS.find(b => zone >= b.zoneStart && zone <= b.zoneEnd) : null;
        const elem  = (biome && TURNCOMBAT_ELEM_MAP[biome.elem]) || 'fire';
        // Récompense modeste qui suit la progression (sans déséquilibrer le jeu idle)
        const reward = Math.round(500 * zone);
        const ctx = {
            monsterName: biome ? biome.bossName || (biome.name + '').toUpperCase() : 'BOSS OGRE',
            element: elem,
            zone: zone,
            bg: TURNCOMBAT_BG[elem] || null,
            reward: reward,
        };
        localStorage.setItem('bf_turncombat_ctx', JSON.stringify(ctx));
    } catch (e) { /* contexte facultatif : la page a des valeurs par défaut */ }
    window.location.href = 'combat-turn.html';
}

// Au retour du combat (réouverture du hub), crédite les gains s'il y en a.
function _claimTurnCombatReward() {
    let r = null;
    try { r = JSON.parse(localStorage.getItem('bf_turncombat_result') || 'null'); } catch (e) {}
    if (!r) return;
    localStorage.removeItem('bf_turncombat_result');
    if (r.win) {
        const gold = Number(r.gold) || 0;
        if (gold > 0) {
            G.gold      = D(G.gold).add(gold);
            G.totalGold = D(G.totalGold || 0).add(gold);
            if (typeof markSaveDirty === 'function') markSaveDirty();
        }
        if (typeof showNotif === 'function') showNotif(`🏆 Victoire ! +${fmt(gold)} Or`);
    } else if (r.win === false) {
        if (typeof showNotif === 'function') showNotif('💀 Défaite — réessaie quand tu veux.');
    }
}

// EXP nécessaire pour passer au Rang d'Invocateur suivant (Phase 3 : gain par stage)
function summonerExpMax(level) { return Math.floor(100 * Math.pow(level, 1.5)); }

// Couleur d'orbe élémentaire (bande squad du hub)
const HUB_ELEM_ORB = {
    fire: '#ff5a14', water: '#1e96ff', earth: '#32c846',
    thunder: '#ffd21e', light: '#fff082', dark: '#aa46ff'
};

function renderHubCurrencies() {
    _townEnsureState();
    // ── Devises ──
    const gemsEl  = document.getElementById('hub-gems-val');
    const goldEl  = document.getElementById('hub-gold-val');
    const honorEl = document.getElementById('hub-honor-val');
    const zoneEl  = document.getElementById('hub-zone-val');
    if (gemsEl)  gemsEl.textContent  = fmt(G.gems || 0);
    if (goldEl)  goldEl.textContent  = fmt(G.gold || 0);
    if (honorEl) honorEl.textContent = fmt(G.honorPoints || 0);
    if (zoneEl) {
        const cs = G.currentStage;
        const area = cs && MAP_DEFS[0].areas[cs.area];
        if (area) {
            zoneEl.textContent = `⚔ En cours : ${area.name} ${cs.area + 1}-${cs.stage + 1}`;
        } else {
            const next = (Object.keys(G.stageProgress || {}).length > 0 || G.maxZone <= 1) ? nextRecommendedStage() : null;
            if (next) {
                const nArea = MAP_DEFS[0].areas[next.a];
                zoneEl.textContent = `▶ ${nArea.name} ${next.a + 1}-${next.s + 1}`;
            } else if (Object.keys(G.stageProgress || {}).length > 0) {
                zoneEl.textContent = '🏆 Map terminée — d\'autres arrivent !';
            } else {
                const biome = (typeof BIOME_DEFS !== 'undefined') && BIOME_DEFS.find(b => G.zone >= b.zoneStart && G.zone <= b.zoneEnd);
                zoneEl.textContent = biome ? `${biome.name} — Zone ${G.zone}` : `Zone ${G.zone || 1}`;
            }
        }
    }

    // ── Identité & Titre dynamique ──
    const nameEl = document.getElementById('hub-player-name');
    const lvEl   = document.getElementById('hub-lv-val');
    const rcEl   = document.getElementById('hub-rc-val');
    const expEl  = document.getElementById('hub-exp-fill');
    const titleEl = document.getElementById('hub-player-title');
    if (nameEl) nameEl.textContent = G.playerName || 'Invocateur';
    if (lvEl)   lvEl.textContent   = G.summonerLevel || 1;
    if (rcEl)   rcEl.textContent   = G.totalPrestiges || 0;
    if (expEl)  expEl.style.width  = Math.min(100, ((G.summonerExp || 0) / summonerExpMax(G.summonerLevel || 1)) * 100) + '%';
    
    if (titleEl) {
        const lv = G.summonerLevel || 1;
        let title = 'Novice';
        if (lv >= 30) title = 'Seigneur';
        else if (lv >= 15) title = 'Chevalier';
        else if (lv >= 6) title = 'Apprenti';
        titleEl.textContent = title;
    }

    // ── Charges de la Ville (header + pastilles) ──
    const totalCharges = Object.keys(TOWN_NODE_DEFS).reduce((sum, k) => sum + (G.townNodes[k] || 0), 0);
    const maxCharges = Object.keys(TOWN_NODE_DEFS).length * TOWN_NODE_MAX; // 4 nodes * 5 max = 20 charges total
    
    const townFillEl = document.getElementById('hub-town-energy-fill');
    const townRefillEl = document.getElementById('hub-town-refill-text');
    if (townFillEl) {
        townFillEl.style.width = Math.min(100, (totalCharges / maxCharges) * 100) + '%';
    }
    if (townRefillEl) {
        townRefillEl.textContent = totalCharges >= maxCharges ? 'RECHARGE COMPLÈTE' : `CHARGES : ${totalCharges} / ${maxCharges}`;
    }
    
    const townBadge   = document.getElementById('hub-town-badge');
    const bbTownBadge = document.getElementById('hub-bb-town-badge');
    if (townBadge)   townBadge.textContent   = totalCharges > 0 ? totalCharges : '';
    if (bbTownBadge) bbTownBadge.textContent = totalCharges > 0 ? totalCharges : '';

    // ── Pastille Invocation gratuite (pub 1/jour) ──
    const summonBadge = document.getElementById('hub-bb-summon-badge');
    if (summonBadge) summonBadge.textContent = (typeof adCapAvailable === 'function' && adCapAvailable('freeSummon')) ? '1' : '';

    // ── Pastille Quêtes : quêtes journalières réclamables ──
    const questsBadge = document.getElementById('hub-quests-badge-side') || document.getElementById('hub-quests-badge');
    const chestBadge = document.getElementById('hub-quests-badge-chest');
    const socialBadge = document.getElementById('hub-bb-social-badge');
    let claimable = 0;
    try {
        if (typeof getDailyQuestPool === 'function' && typeof getDQProgress === 'function') {
            const dq = getDailyQuestPool(getTodayDateStr());
            dq.forEach((q, i) => {
                const isClaimed = Array.isArray(G.dailyQuestsClaimed) && G.dailyQuestsClaimed[i];
                if (!isClaimed && getDQProgress(q) >= q.target) claimable++;
            });
        }
    } catch (e) {}
    if (questsBadge) questsBadge.textContent = claimable > 0 ? claimable : '';
    if (chestBadge) chestBadge.textContent = claimable > 0 ? claimable : '';
    if (socialBadge) socialBadge.textContent = claimable > 0 ? claimable : '';

    renderHubSquadStrip();
}

// Bande de portraits de la squad (réutilise getHeroImage + assets Squad img avec styles par élément)
function renderHubSquadStrip() {
    const strip = document.getElementById('hub-squad-strip');
    if (!strip) return;
    const numSlots = 5;
    let html = '';
    for (let i = 0; i < numSlots; i++) {
        const isLocked = i >= (G.maxSquadSize || 4);
        const heroId = G.squad && G.squad[i];
        
        if (isLocked) {
            html += `<button class="hub-squad-card empty locked" title="Slot verrouillé — Améliorez votre rang" onclick="hubNavigate('heroes')"></button>`;
        } else if (heroId && G.heroes[heroId]) {
            const def = (typeof HERO_DEFS !== 'undefined') ? HERO_DEFS.find(d => d.id === heroId) : null;
            // Par défaut, le slot central (index 2) est le Leader
            const isLeader = G.leaderId ? (G.leaderId === heroId) : (i === 2);
            const orb = HUB_ELEM_ORB[def && def.element] || '#8A93A6';
            const name = def ? def.name : heroId;
            const elemClass = def && def.element ? `elem-${def.element}` : '';
            html += `<button class="hub-squad-card ${elemClass}" style="--orb:${orb}" title="${name}" onclick="openHeroModal('${heroId}')">
                ${isLeader ? '<span class="leader-tag">LEADER</span>' : ''}
                <img src="${getHeroImage(heroId, 3, 'unit')}" alt="${name}" loading="lazy">
                <span class="elem-orb"></span>
            </button>`;
        } else {
            html += `<button class="hub-squad-card empty" title="Slot libre — recruter" onclick="hubNavigate('heroes')"></button>`;
        }
    }
    strip.innerHTML = html;
}

// ── Pseudo : sauvegarde depuis Paramètres ──
function savePlayerName() {
    const input = document.getElementById('settings-name-input');
    if (!input) return;
    const v = input.value.trim().slice(0, 16);
    if (!v) { showNotif('❌ Entre un nom valide'); return; }
    G.playerName = v;
    showNotif(`👤 Bienvenue, ${v} !`);
    renderHubCurrencies();
    (markSaveDirty(), saveGame());
}

// ── La Ville ──
function openTown() {
    townRegenTick();
    renderTownView();
    const tv = document.getElementById('town-view');
    if (tv) tv.classList.remove('hidden');
}

function closeTown() {
    const tv = document.getElementById('town-view');
    if (tv) tv.classList.add('hidden');
}

function renderTownView() {
    _townEnsureState();
    Object.keys(TOWN_NODE_DEFS).forEach(key => {
        const charges = G.townNodes[key] || 0;
        const chargesEl = document.getElementById('town-charges-' + key);
        const gaugeEl   = document.getElementById('town-gauge-' + key);
        const nodeEl    = document.getElementById('town-node-' + key);
        if (chargesEl) chargesEl.textContent = `${charges} / ${TOWN_NODE_MAX}`;
        if (gaugeEl)   gaugeEl.style.width = `${(charges / TOWN_NODE_MAX) * 100}%`;
        if (nodeEl)    nodeEl.classList.toggle('is-empty', charges <= 0);
    });
    const adBtn = document.getElementById('town-ad-reset-btn');
    if (adBtn) {
        const left = AD_CAPS_MAX.townReset - (G.adCaps.townReset || 0);
        adBtn.disabled = !adCapAvailable('townReset');
        adBtn.textContent = adBtn.disabled
            ? '📺 Recharge épuisée pour aujourd\'hui'
            : `📺 Regarder une pub → Recharger tous les gisements (${left}/j)`;
    }
    _updateTownRegenInfo();
}

function _townFloatText(nodeEl, msg) {
    if (!nodeEl) return;
    const span = document.createElement('span');
    span.className = 'town-float-text';
    span.textContent = msg;
    nodeEl.appendChild(span);
    setTimeout(() => span.remove(), 1150);
}

function harvestTownNode(nodeId) {
    const def = TOWN_NODE_DEFS[nodeId];
    if (!def) return;
    townRegenTick();
    if ((G.townNodes[nodeId] || 0) <= 0) {
        showNotif('⏳ Gisement épuisé — 1 charge régénère toutes les 10 min');
        return;
    }
    G.townNodes[nodeId]--;

    if (typeof Sound !== 'undefined') { Sound.init(); if (Sound.playClaim) Sound.playClaim(); }
    const nodeEl = document.getElementById('town-node-' + nodeId);
    if (nodeEl) {
        nodeEl.classList.remove('harvesting');
        void nodeEl.offsetWidth; // restart de l'animation shake
        nodeEl.classList.add('harvesting');
    }

    let floatMsg;
    if (def.special) {
        // Manoir Hanté : 50% Mimic · 30% Or · 20% Points d'Honneur
        const r = Math.random();
        if (r < 0.5) {
            G.materials.mimic = (G.materials.mimic || 0) + 1;
            floatMsg = '+1 Mimic';
            showNotif('🏚️ Manoir Hanté — +1 Mimic !');
        } else if (r < 0.8) {
            const goldAmt = Math.max(100, Math.floor(getTotalDPS() * 45));
            G.gold = D(G.gold).add(goldAmt);
            G.totalGold = D(G.totalGold).add(goldAmt);
            floatMsg = `+${fmt(goldAmt)} Or`;
            showNotif(`🏚️ Manoir Hanté — +${fmt(goldAmt)} Or !`);
            pulseCurrency('gold-display');
        } else {
            G.honorPoints = (G.honorPoints || 0) + 5;
            floatMsg = '+5 PH';
            showNotif('🏚️ Manoir Hanté — +5 Points d\'Honneur !');
            pulseCurrency('honor-display');
        }
    } else {
        // Gisements élémentaires : 1 composant aléatoire du pool
        const elem = TOWN_ELEMS[Math.floor(Math.random() * TOWN_ELEMS.length)];
        const matId = elem + def.suffix;
        G.materials[matId] = (G.materials[matId] || 0) + 1;
        const matName = (typeof MATERIAL_DEFS !== 'undefined' && MATERIAL_DEFS[matId]) ? MATERIAL_DEFS[matId].name : matId;
        floatMsg = `+1 ${matName}`;
        showNotif(`✨ ${def.name} — +1 ${matName} !`);
    }

    _townFloatText(nodeEl, floatMsg);
    if (typeof renderMaterialsPanel === 'function') renderMaterialsPanel();
    renderTownView();
    updateDisplays();
    (markSaveDirty(), saveGame());
}

// ── Reset publicitaire : recharge tous les gisements (cap 3/jour) ──
function adResetTown() {
    _townEnsureState();
    const anyMissing = Object.keys(TOWN_NODE_DEFS).some(k => (G.townNodes[k] || 0) < TOWN_NODE_MAX);
    if (!anyMissing) { showNotif('✨ Tous les gisements sont déjà pleins !'); return; }
    watchAdForReward('townReset', () => {
        Object.keys(TOWN_NODE_DEFS).forEach(k => { G.townNodes[k] = TOWN_NODE_MAX; });
        G.townLastRegen = Date.now();
        if (typeof Sound !== 'undefined' && Sound.playClaim) Sound.playClaim();
        showNotif('📺 Tous les gisements rechargés — 5/5 partout !');
        renderTownView();
        renderHubCurrencies();
        (markSaveDirty(), saveGame());
    });
}

// ── Placement 1 : ×2 Gains Offline ──
function adDoubleOfflineGains(baseGold) {
    watchAdForReward('offline',
        (watched) => {
            const bonus = watched ? baseGold : 0; // pub vue → double, sinon rien de plus
            if (bonus > 0) {
                G.gold = D(G.gold).add(bonus);
                G.totalGold = D(G.totalGold).add(bonus);
                showNotif(`🎬 ×2 Offline ! +${fmt(bonus)} Or bonus !`);
                screenFlash('rgba(241,196,15,0.25)');
            }
            document.getElementById('offline-modal')?.remove();
            updateDisplays(); (markSaveDirty(), saveGame());
        }
    );
}

// ── Placement 2 : ×2 Or pendant 30 min ──
function adGoldBuff() {
    if (G.goldBuffExpiry > Date.now()) { showNotif('⚡ Buff Or déjà actif !'); return; }
    watchAdForReward('goldBuff',
        (watched) => {
            const duration = 30 * 60 * 1000; // 30 min
            G.goldBuffExpiry = Date.now() + duration;
            showNotif(watched ? '🎬 ×2 Or pendant 30 min !' : '⚡ Buff Or activé (30 min)');
            screenFlash('rgba(241,196,15,0.3)');
            (markSaveDirty(), saveGame());
        }
    );
}

// Coefficient actif (appelé dans killMonster)
function getGoldBuffMult() {
    return (G.goldBuffExpiry && G.goldBuffExpiry > Date.now()) ? 2 : 1;
}

// ── Placement 3 : Invocation gratuite ──
function adFreeSummon() {
    watchAdForReward('freeSummon',
        (watched) => {
            // Fallback si pas de pub : donne quand même 1 tirage (rétention prioritaire)
            const result = _applyPityAndRoll();
            showNotif('🎬 Invocation gratuite !');
            if (result.type === 'hero_S') triggerSummonAnimation(6, () => _grantSummonedHero(result.heroId));
            else if (result.type === 'hero_A') triggerSummonAnimation(5, () => _grantSummonedHero(result.heroId));
            else if (result.type === 'sphere') {
                if (!G.spheres[result.sId]) G.spheres[result.sId] = 0;
                G.spheres[result.sId]++;
                triggerSummonAnimation(5, () => showSphereReveal(result.sId, SPHERE_DEFS[result.sId]));
            } else {
                if (!G.materials[result.mId]) G.materials[result.mId] = 0;
                G.materials[result.mId]++;
                triggerSummonAnimation(4, () => showNotif(`🎁 ${result.mId} reçu !`));
            }
            updatePityDisplay(); updateDisplays(); (markSaveDirty(), saveGame());
        }
    );
}

// ── Placement 4 : Reroll loot/affixe ──
function adRerollAffix(item, onDone) {
    watchAdForReward('lootReroll',
        () => {
            const idx = Math.floor(Math.random() * item.affixes.length);
            const pool = AFFIX_TABLE.filter(a => a.id !== item.affixes[idx].id);
            const newAffix = pool[Math.floor(Math.random() * pool.length)];
            item.affixes[idx] = { id: newAffix.id, label: newAffix.label, stat: newAffix.stat,
                value: newAffix.min + (newAffix.max - newAffix.min) * Math.random() };
            markSaveDirty();
            showNotif('🎬 Affixe rerollé gratuitement !');
            if (onDone) onDone();
        }
    );
}

// ── Placement 5 : Revive boss ──
function adBossRevive() {
    if (!G.isBoss) return;
    watchAdForReward('bossRevive',
        () => {
            G.partyHp = G.partyMaxHp;
            G.bossTimer = Math.max(G.bossTimer, 15); // recharge 15s minimum
            G.deathTimer = 0;
            showNotif('🎬 Équipe ressuscitée ! Continuez le combat !');
            screenFlash('rgba(0,255,128,0.25)');
            (markSaveDirty(), saveGame());
        }
    );
}

// ── Placement 6 : ×2 récompense quête ──
function adDoubleQuestReward(idx) {
    _resetAdCapsIfNeeded();
    const key = `quest_${idx}_${getTodayDateStr()}`;
    if (localStorage.getItem(key)) { showNotif('📺 Déjà doublé pour cette quête.'); return; }
    const today = getTodayDateStr();
    if (G.dailyQuestDate !== today) initDailyQuests();
    const quests = getDailyQuestPool(today);
    const quest = quests[idx];
    if (!quest || !G.dailyQuestsClaimed[idx]) return;

    watchAdForReward('questDouble',
        () => {
            localStorage.setItem(key, '1');
            quest.apply(); // applique une deuxième fois
            showNotif(`🎬 Récompense ×2 pour "${quest.name}" !`);
            updateDisplays();
        }
    );
}

// =============================================================
// §4.2 — Modale revive boss (overlay non-intrusif, timer suspendu)
function _showBossReviveOffer() {
    // Pause le timer pendant que le joueur décide
    // bossTimer déjà gelé à 999 par le combat loop avant cet appel
    const overlay = document.createElement('div');
    overlay.id = 'boss-revive-modal';
    overlay.style.cssText = `position:fixed;inset:0;z-index:500;display:flex;align-items:center;
        justify-content:center;background:rgba(11,14,20,0.92);`;
    overlay.innerHTML = `
        <div style="background:linear-gradient(160deg,#1a0a0a,#0d0505);border:2px solid #e74c3c;
            border-radius:16px;padding:28px 28px;max-width:320px;width:90%;text-align:center;
            box-shadow:0 0 40px rgba(231,76,60,0.4);">
            <div style="font-size:38px;margin-bottom:10px;">💀</div>
            <div style="font-family:'Outfit',sans-serif;font-size:18px;color:#e74c3c;font-weight:700;margin-bottom:8px;">
                Temps écoulé !
            </div>
            <div style="font-size:13px;color:#a0b0c0;margin-bottom:18px;">
                Regardez une courte pub pour ressusciter votre équipe et continuer le combat.
            </div>
            <button onclick="_bossReviveAccept()" style="width:100%;background:linear-gradient(135deg,#7c3aed,#4f1d96);
                border:1px solid #a78bfa;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;
                font-weight:700;padding:12px;border-radius:8px;cursor:pointer;margin-bottom:10px;
                box-shadow:0 4px 14px rgba(124,58,237,0.5);">
                📺 Regarder une pub → Ressusciter !
            </button>
            <button onclick="_bossReviveDecline()" style="width:100%;background:rgba(255,255,255,0.07);
                border:1px solid rgba(255,255,255,0.15);color:#a0b0c0;font-family:'Outfit',sans-serif;
                font-size:13px;padding:10px;border-radius:8px;cursor:pointer;">
                Battre en retraite (−1 zone)
            </button>
        </div>`;
    document.body.appendChild(overlay);
}
function _bossReviveAccept() {
    document.getElementById('boss-revive-modal')?.remove();
    adBossRevive();
}
function _bossReviveDecline() {
    document.getElementById('boss-revive-modal')?.remove();
    // ── Mode stage (Phase 3) : refuser le revive = défaite du stage ──
    if (G.currentStage) { finishStage(false); return; }
    showNotif("⏱️ Retraite ! Le Boss vous repousse d'une zone.");
    G.isBoss = false; G.monsterIndex = 0;
    if (G.zone > 1) G.zone--;
    spawnMonster(); (markSaveDirty(), saveGame());
}

// =============================================================
// §4.3 — IAP MANAGER (stub → brancher sur Google Play Billing / Stripe)
// =============================================================

// Stub IAP — en prod : remplacer _iapPurchase par l'appel SDK natif
const IAP = {
    // Simule un achat (toujours succès en dev)
    purchase(productId, onSuccess, onFail) {
        // En production : window.plugins.inAppPurchase.buy(productId).then(...).catch(...)
        console.warn(`[IAP] stub purchase: ${productId}`);
        // Stub : succès immédiat pour dev/test
        setTimeout(() => onSuccess(productId), 300);
    },
    restore(onSuccess) {
        console.warn('[IAP] stub restore');
        onSuccess([]);
    }
};

// ── Catalogue des produits ──
const IAP_PRODUCTS = [
    { id: 'no_ads_plus',      label: 'No Ads+',             price: '2,99 €', oneShot: true,
      desc: '×2 Offline permanent · +25 % Or permanent · Plus de pubs intrusives' },
    { id: 'starter_pack',     label: 'Pack Découverte',     price: '0,99 €', oneShot: true,
      desc: '80 Gemmes · 1 Héros 5★ aléatoire · ×10 Matériaux Haut-Tier' },
    { id: 'perm_gold_x2',     label: '×2 Or Permanent',    price: '3,99 €', oneShot: true,
      desc: 'Tous vos gains d\'Or doublés définitivement' },
    { id: 'perm_bc_x2',       label: '×2 BC/HC Permanent', price: '3,99 €', oneShot: true,
      desc: 'Remplissage des jauges BB deux fois plus rapide' },
    { id: 'gems_80',          label: '80 Gemmes',           price: '0,99 €', oneShot: false,
      desc: '80 💎 — environ 16 invocations rares' },
    { id: 'gems_400',         label: '400 Gemmes',          price: '4,99 €', oneShot: false,
      desc: '400 💎 (+20 bonus) — environ 84 invocations' },
    { id: 'gems_1000',        label: '1 000 Gemmes',        price: '9,99 €', oneShot: false,
      desc: '1 000 💎 (+100 bonus) — environ 220 invocations' },
    { id: 'gems_2200',        label: '2 200 Gemmes',        price: '19,99 €', oneShot: false,
      desc: '2 200 💎 (+300 bonus) — meilleure valeur' },
    { id: 'battle_pass_free', label: 'Battle Pass Saison 1',price: '4,99 €', oneShot: false,
      desc: 'Piste Gratuite + Piste Premium · 28 jours · Récompenses journalières garanties' },
];

// ── Taux Gacha (affichage transparent obligatoire) ──
const GACHA_RATES = [
    { label: 'Héros S (5★)', rate: '2 %', pity: 'Garanti en 50 invocations' },
    { label: 'Héros A (4★)', rate: '10 %', pity: 'Garanti en 10 invocations' },
    { label: 'Sphère Légendaire', rate: '8 %', pity: '—' },
    { label: 'Sphère Rare', rate: '20 %', pity: '—' },
    { label: 'Matériau Haut-Tier', rate: '30 %', pity: '—' },
    { label: 'Matériau Standard', rate: '30 %', pity: '—' },
];

// ── Bonus permanents actifs ──
function getIAPGoldMult() {
    let m = 1;
    if (G.iap.noAdsPlus)   m *= 1.25;
    if (G.iap.permGoldX2)  m *= 2;
    return m;
}
function getIAPBCMult() {
    return G.iap.permBCX2 ? 2 : 1;
}
function iapOfflineIsDoubled() {
    return G.iap.noAdsPlus; // ×2 offline permanent si No Ads+ acheté
}

// ── Appliquer un achat (appelé par IAP.purchase onSuccess) ──
function _applyIAPPurchase(productId) {
    switch (productId) {
        case 'no_ads_plus':
            G.iap.noAdsPlus = true;
            showNotif('✅ No Ads+ activé ! ×2 Offline permanent + +25% Or !');
            break;
        case 'starter_pack':
            G.iap.starterUsed = true;
            G.gems += 80;
            // Donne un héros 5★ aléatoire non possédé
            const sHeroes = HERO_DEFS.filter(d => d.rarity >= 5 && !G.heroes[d.id]);
            if (sHeroes.length) {
                const pick = sHeroes[Math.floor(Math.random() * sHeroes.length)];
                _grantSummonedHero(pick.id);
            }
            // ×10 matériaux haut-tier
            ['fire_crystal','water_crystal','earth_crystal','mimic','totem_atk','totem_def'].forEach(m => {
                G.materials[m] = (G.materials[m] || 0) + 10;
            });
            showNotif('🎁 Pack Découverte reçu ! 80💎 + Héros 5★ + Matériaux !');
            break;
        case 'perm_gold_x2':
            G.iap.permGoldX2 = true;
            showNotif('✅ ×2 Or permanent activé !');
            break;
        case 'perm_bc_x2':
            G.iap.permBCX2 = true;
            showNotif('✅ ×2 BC/HC permanent activé !');
            break;
        case 'gems_80':   G.gems += 80;   showNotif('💎 +80 Gemmes reçues !'); break;
        case 'gems_400':  G.gems += 420;  showNotif('💎 +420 Gemmes reçues (+20 bonus) !'); break;
        case 'gems_1000': G.gems += 1100; showNotif('💎 +1 100 Gemmes reçues (+100 bonus) !'); break;
        case 'gems_2200': G.gems += 2500; showNotif('💎 +2 500 Gemmes reçues (+300 bonus) !'); break;
        case 'battle_pass_free':
            G.iap.battlePassSeason = 'S1';
            G.iap.battlePassPremium = true;
            G.iap.battlePassDay = 0;
            G.iap.battlePassLastClaim = null;
            showNotif('⚔️ Battle Pass Saison 1 activé !');
            break;
    }
    invalidateStats();
    updateDisplays();
    (markSaveDirty(), saveGame());
}

function buyIAP(productId) {
    const prod = IAP_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;
    // Déjà acheté (one-shot)
    if (prod.oneShot && _iapOwned(productId)) {
        showNotif('✅ Déjà possédé !'); return;
    }
    IAP.purchase(productId,
        (id) => _applyIAPPurchase(id),
        () => showNotif('❌ Achat annulé.')
    );
}

function _iapOwned(productId) {
    switch (productId) {
        case 'no_ads_plus':     return G.iap.noAdsPlus;
        case 'starter_pack':    return G.iap.starterUsed;
        case 'perm_gold_x2':    return G.iap.permGoldX2;
        case 'perm_bc_x2':      return G.iap.permBCX2;
        case 'battle_pass_free':return !!G.iap.battlePassSeason;
        default: return false;
    }
}

// ── Battle Pass ──
const BP_REWARDS_FREE = [
    { day:1,  r:'100 Or' },    { day:2,  r:'5 💎' },       { day:3,  r:'Cristal ×3' },
    { day:4,  r:'200 Or' },    { day:5,  r:'Totem ATK' },   { day:6,  r:'10 💎' },
    { day:7,  r:'Invocation' },{ day:8,  r:'300 Or' },      { day:9,  r:'Cristal ×5' },
    { day:10, r:'15 💎' },     { day:11, r:'Mimic ×2' },    { day:12, r:'500 Or' },
    { day:13, r:'20 💎' },     { day:14, r:'Héros A aléat.'},{ day:15, r:'800 Or' },
    { day:16, r:'Cristal ×8' },{ day:17, r:'25 💎' },       { day:18, r:'Totem DEF ×2' },
    { day:19, r:'1 000 Or' },  { day:20, r:'30 💎' },       { day:21, r:'Mimic ×5' },
    { day:22, r:'1 500 Or' },  { day:23, r:'35 💎' },       { day:24, r:'Invocation ×2' },
    { day:25, r:'Cristal ×10'},{ day:26, r:'2 000 Or' },    { day:27, r:'50 💎' },
    { day:28, r:'Héros S aléat.'},
];
const BP_REWARDS_PREMIUM = [
    { day:1,  r:'+50 💎' },    { day:2,  r:'+Mimic ×2' },  { day:3,  r:'+10 💎' },
    { day:4,  r:'+Cristal ×5'},{ day:5,  r:'+20 💎' },      { day:6,  r:'+Totem ×2' },
    { day:7,  r:'+30 💎' },    { day:8,  r:'+Mimic ×3' },   { day:9,  r:'+25 💎' },
    { day:10, r:'+Invoc.' },   { day:11, r:'+40 💎' },      { day:12, r:'+Cristal ×8' },
    { day:13, r:'+50 💎' },    { day:14, r:'+Héros B' },    { day:15, r:'+60 💎' },
    { day:16, r:'+Mimic ×5' }, { day:17, r:'+70 💎' },      { day:18, r:'+Cristal ×10'},
    { day:19, r:'+80 💎' },    { day:20, r:'+Totem ×4' },   { day:21, r:'+90 💎' },
    { day:22, r:'+Mimic ×8' }, { day:23, r:'+100 💎' },     { day:24, r:'+Héros A' },
    { day:25, r:'+Invoc. ×3'},{ day:26, r:'+150 💎' },      { day:27, r:'+200 💎' },
    { day:28, r:'+Héros S' },
];

function claimBattlePassDay() {
    if (!G.iap.battlePassSeason) return;
    const today = getTodayDateStr();
    if (G.iap.battlePassLastClaim === today) { showNotif('✅ Déjà réclamé aujourd\'hui !'); return; }
    if (G.iap.battlePassDay >= 28) { showNotif('🏆 Battle Pass terminé !'); return; }
    const dayIdx = G.iap.battlePassDay;
    G.iap.battlePassLastClaim = today;
    G.iap.battlePassDay = Math.min(G.iap.battlePassDay + 1, 28);
    _applyBPReward(BP_REWARDS_FREE[dayIdx].r);
    if (G.iap.battlePassPremium) _applyBPReward(BP_REWARDS_PREMIUM[dayIdx].r);
    showNotif(`⚔️ Jour ${dayIdx + 1} réclamé !`);
    updateDisplays(); (markSaveDirty(), saveGame());
    renderShopPanel();
}

function _applyBPReward(r) {
    if (!r) return;
    const n = parseInt(r) || 0;
    if (r.includes('💎'))      G.gems += n || parseInt(r.replace(/[^0-9]/g,'')) || 5;
    else if (r.includes('Or')) G.gold = D(G.gold).add(parseInt(r.replace(/[^0-9]/g,'')) || 100);
    else if (r.includes('Cristal')) {
        const qty = parseInt(r.replace(/[^0-9]/g,'')) || 1;
        ['fire_crystal','water_crystal','earth_crystal'].forEach(c => G.materials[c] = (G.materials[c]||0) + qty);
    }
    else if (r.includes('Mimic'))  G.materials.mimic = (G.materials.mimic||0) + (parseInt(r.replace(/[^0-9]/g,''))||1);
    else if (r.includes('Totem ATK')) G.materials.totem_atk = (G.materials.totem_atk||0) + (parseInt(r.replace(/[^0-9]/g,''))||1);
    else if (r.includes('Totem DEF')) G.materials.totem_def = (G.materials.totem_def||0) + (parseInt(r.replace(/[^0-9]/g,''))||1);
    else if (r.includes('Totem ×')) { const q = parseInt(r.replace(/[^0-9]/g,''))||1; G.materials.totem_atk=(G.materials.totem_atk||0)+q; }
    else if (r.includes('Invoc')) { const result = _applyPityAndRoll(); _grantSummonedHero && result.heroId && _grantSummonedHero(result.heroId); }
    else if (r.includes('Héros S')) { const h5 = HERO_DEFS.filter(d=>d.rarity>=5&&!G.heroes[d.id]); if(h5.length) _grantSummonedHero(h5[Math.floor(Math.random()*h5.length)].id); }
    else if (r.includes('Héros A') || r.includes('Héros B')) { const h4 = HERO_DEFS.filter(d=>d.rarity>=4&&!G.heroes[d.id]); if(h4.length) _grantSummonedHero(h4[Math.floor(Math.random()*h4.length)].id); }
}

// ── Rendu du panneau Boutique ──
function renderShopPanel() {
    const el = document.getElementById('panel-shop');
    if (!el) return;

    const today = getTodayDateStr();
    const bpActive = !!G.iap.battlePassSeason;
    const bpCanClaim = bpActive && G.iap.battlePassLastClaim !== today && G.iap.battlePassDay < 28;
    const bpDay = G.iap.battlePassDay || 0;

    let html = '';

    // ── Battle Pass ──
    html += `<div class="shop-section">
        <div class="shop-section-title">⚔️ Battle Pass — Saison 1</div>`;
    if (!bpActive) {
        html += `<div class="shop-card featured">
            <div class="shop-card-name">Battle Pass Premium</div>
            <div class="shop-card-desc">28 jours · Piste gratuite + Piste premium · Récompenses journalières garanties</div>
            <div class="shop-card-price">4,99 €</div>
            <button class="shop-btn buy" onclick="buyIAP('battle_pass_free')">Acheter</button>
        </div>`;
    } else {
        const freeR = BP_REWARDS_FREE[bpDay] || { r: '—' };
        const premR = BP_REWARDS_PREMIUM[bpDay] || { r: '—' };
        html += `<div class="shop-card">
            <div class="shop-card-name">Jour ${bpDay + 1} / 28</div>
            <div class="bp-progress-bar"><div class="bp-progress-fill" style="width:${(bpDay/28*100).toFixed(1)}%"></div></div>
            <div style="font-size:12px;color:#a0b0c0;margin:6px 0;">
                Gratuit : <b style="color:#f1c40f">${freeR.r}</b>
                ${G.iap.battlePassPremium ? `&nbsp;· Premium : <b style="color:#c084fc">${premR.r}</b>` : ''}
            </div>
            ${bpCanClaim
                ? `<button class="shop-btn buy" onclick="claimBattlePassDay()">🎁 Réclamer le Jour ${bpDay + 1}</button>`
                : `<button class="shop-btn" disabled style="opacity:.5">${bpDay>=28?'✅ Terminé':'✅ Déjà réclamé aujourd\'hui'}</button>`}
        </div>`;
    }
    html += `</div>`;

    // ── One-shot deals ──
    html += `<div class="shop-section"><div class="shop-section-title">🎁 Offres Uniques</div>`;
    ['no_ads_plus','starter_pack','perm_gold_x2','perm_bc_x2'].forEach(id => {
        const p = IAP_PRODUCTS.find(x=>x.id===id);
        const owned = _iapOwned(id);
        html += `<div class="shop-card${owned?' owned':''}">
            <div class="shop-card-name">${p.label}</div>
            <div class="shop-card-desc">${p.desc}</div>
            <div class="shop-card-price">${owned ? '✅ Possédé' : p.price}</div>
            <button class="shop-btn${owned?' owned':' buy'}" onclick="buyIAP('${id}')" ${owned?'disabled':''}>
                ${owned ? 'Activé' : 'Acheter'}
            </button>
        </div>`;
    });
    html += `</div>`;

    // ── Gemmes ──
    html += `<div class="shop-section"><div class="shop-section-title">💎 Packs de Gemmes</div>`;
    ['gems_80','gems_400','gems_1000','gems_2200'].forEach(id => {
        const p = IAP_PRODUCTS.find(x=>x.id===id);
        html += `<div class="shop-card">
            <div class="shop-card-name">${p.label}</div>
            <div class="shop-card-desc">${p.desc}</div>
            <div class="shop-card-price">${p.price}</div>
            <button class="shop-btn buy" onclick="buyIAP('${id}')">Acheter</button>
        </div>`;
    });
    html += `</div>`;

    // ── Taux Gacha (transparence obligatoire) ──
    html += `<div class="shop-section">
        <div class="shop-section-title">📊 Taux d'Invocation (Transparence)</div>
        <table class="gacha-rates-table">
            <tr><th>Résultat</th><th>Taux</th><th>Pitié</th></tr>
            ${GACHA_RATES.map(r=>`<tr><td>${r.label}</td><td>${r.rate}</td><td style="color:#6a7a8a">${r.pity}</td></tr>`).join('')}
        </table>
    </div>`;

    el.innerHTML = html;
}

// §5.1 — STATISTIQUES JOUEUR
// =============================================================
function renderStats() {
    const el = document.getElementById('stats-content');
    if (!el) return;
    el.innerHTML = `
        <div class="settings-row"><span>Monstres tués</span><b>${fmt(G.totalKills || 0)}</b></div>
        <div class="settings-row"><span>Boss vaincus</span><b>${fmt(G.bossKills || 0)}</b></div>
        <div class="settings-row"><span>Or total amassé</span><b>${fmt(G.totalGold || 0)}</b></div>
        <div class="settings-row"><span>Clics totaux</span><b>${fmt(G.totalClicks || 0)}</b></div>
        <div class="settings-row"><span>Meilleur combo</span><b>×${(1 + (G.maxCombo||0) * 0.1).toFixed(1)}</b></div>
        <div class="settings-row"><span>Zone maximum</span><b>${G.maxZone || 1}</b></div>
        <div class="settings-row"><span>Prestiges effectués</span><b>${G.totalPrestiges || 0}</b></div>
    `;
}

// =============================================================
// §5.2 — EXPORT / IMPORT DE SAUVEGARDE
// =============================================================
function exportSave() {
    try {
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
        navigator.clipboard.writeText(code).then(() => {
            showNotif('📋 Sauvegarde copiée dans le presse-papier !');
        }).catch(() => {
            // Fallback si clipboard non autorisé
            const ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select(); document.execCommand('copy');
            ta.remove();
            showNotif('📋 Sauvegarde copiée !');
        });
    } catch(e) { showNotif('❌ Erreur lors de l\'export.'); }
}

function importSavePrompt() {
    const code = prompt('Collez votre code de sauvegarde ici :');
    if (!code) return;
    try {
        const parsed = migrateSave(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
        G = { ...G, ...parsed };
        (markSaveDirty(), saveGame());
        showNotif('✅ Sauvegarde importée ! Rechargement…');
        setTimeout(() => location.reload(), 1200);
    } catch(e) { showNotif('❌ Code de sauvegarde invalide.'); }
}

// §5.1 renderStats est appelée par renderSettingsPanel (définie au-dessus)


// Injection des lanceurs automatiques dans les cycles d'initialisation de ton jeu
const originalUpdateDisplays = updateDisplays;
updateDisplays = function() {
    originalUpdateDisplays();
    updateSpheresInventoryDisplay();
    
    // Met à jour dynamiquement l'affichage des trois boutons de Tap sur PC/Mobile
    // CORRECTION : Harmonisation avec le coefficient 1.14
    let tapCost1 = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel));
    let tapCost10 = 0;
    for (let i = 0; i < 10; i++) tapCost10 += Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + i));
    
    let tapMaxCount = 0;
    let tapMaxCost = 0;
    while (true) {
        let nextCost = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + tapMaxCount));
        if (D(G.gold).gte(D(tapMaxCost).add(nextCost))) { // §1.5
            tapMaxCost += nextCost;
            tapMaxCount++;
        } else {
            break;
        }
    }

    const btn1 = document.getElementById('tap-btn-1');
    const btn10 = document.getElementById('tap-btn-10');
    const btnMax = document.getElementById('tap-btn-max');

    if (btn1) { btn1.textContent = `+1 (${fmt(tapCost1)})`; btn1.disabled = D(G.gold).lt(tapCost1); } // §1.5 — comparaison Decimal (était coercion <)
    if (btn10) { btn10.textContent = `×10 (${fmt(tapCost10)})`; btn10.disabled = D(G.gold).lt(tapCost10); } // §1.5
    if (btnMax) {
        btnMax.textContent = tapMaxCount > 0 ? `MAX (+${tapMaxCount})` : 'MAX';
        btnMax.disabled = tapMaxCount === 0;
    }

    // Live DPS : affiche le vrai DPS en vert si l'activité dépasse le passif
    const dpsDisplayEl = document.getElementById('dps-display');
    if (dpsDisplayEl) {
        let passiveDps = getTotalDPS();
        if (G.playerSkillsActive.frenzy > 0) passiveDps *= 3;
        if (liveDpsValue > passiveDps) {
            dpsDisplayEl.innerHTML = `<i class='ra ra-sword'></i> LIVE DPS : <span style="color:#2ecc71;text-shadow:0 0 10px rgba(46,204,113,0.4);font-weight:800;">${fmt(liveDpsValue)}/s</span>`;
        } else {
            let dpsStr = fmt(passiveDps);
            if (G.playerSkillsActive.frenzy > 0) dpsStr = `<span style="color:#f1c40f">${fmt(passiveDps)} (Frénésie)</span>`;
            dpsDisplayEl.innerHTML = `<i class='ra ra-sword'></i> DPS : ${dpsStr}/s`;
        }
    }

    // Indicateurs de touches sur les slots BB (desktop uniquement)
    if (window.innerWidth >= 1024) {
        const bbSlots = document.getElementById('footer-bb-slots');
        if (bbSlots) {
            const bbHints = ['1', '2', '3', '4'];
            Array.from(bbSlots.children).forEach((slot, i) => {
                if (bbHints[i] && !slot.querySelector('.keyboard-key-hint')) {
                    const hint = document.createElement('div');
                    hint.className = 'keyboard-key-hint';
                    hint.textContent = bbHints[i];
                    slot.appendChild(hint);
                }
            });
        }
    }

    // Indicateurs de touches sur les sorts d'invocateur (desktop uniquement)
    if (window.innerWidth >= 1024 && document.querySelector('.tab-btn[data-tab="skills"]')?.classList.contains('active')) {
        const skillContainer = document.getElementById('player-skills-container');
        if (skillContainer) {
            const skillHints = ['A', 'Z', 'E'];
            Array.from(skillContainer.children).forEach((card, i) => {
                if (skillHints[i] && !card.querySelector('.keyboard-key-hint')) {
                    const hint = document.createElement('div');
                    hint.className = 'keyboard-key-hint';
                    hint.textContent = skillHints[i];
                    card.appendChild(hint);
                }
            });
        }
    }
};

// =============================================================
// ═══════════ SYSTÈMES DE RÉTENTION QUOTIDIENNE ═══════════════
// =============================================================

// ─── Utilitaires de date ─────────────────────────────────────
function getTodayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getWeekStr() {
    const d = new Date();
    // ISO week number
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
}

// =============================================================
// LOGIN BONUS — Cycle de 7 jours tournant
// =============================================================
/* §câblage : LOGIN_REWARDS fourni par assets/globals.bundle.js (src/data) */

function initLoginBonus() {
    const today = getTodayDateStr();
    if (G.loginLastDate === today) return; // déjà réclamé aujourd'hui
    renderLoginBonusModal();
    const overlay = document.getElementById('login-bonus-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function renderLoginBonusModal() {
    const grid    = document.getElementById('login-days-grid');
    const streakEl= document.getElementById('login-streak-text');
    const claimBtn= document.getElementById('login-claim-btn');
    if (!grid) return;

    const cycleDays = G.loginCycleDays || 0;
    const streak    = G.loginStreak || 0;
    if (streakEl) streakEl.textContent = `🔥 Série : ${streak} jour${streak!==1?'s':''} consécutif${streak!==1?'s':''}`;

    let html = '';
    LOGIN_REWARDS.forEach((r, i) => {
        let cls = 'login-day-card';
        let check = '';
        if (i < cycleDays)  { cls += ' claimed'; check = '<div style="position:absolute;top:2px;right:4px;font-size:10px;color:#2ecc71">✓</div>'; }
        if (i === cycleDays){ cls += ' today'; }
        html += `<div class="${cls}" style="position:relative">${check}
            <span class="day-icon">${r.icon}</span>
            <span class="day-label">${r.label}</span>
            <span class="day-val">${r.val}</span>
        </div>`;
    });
    grid.innerHTML = html;

    const today = LOGIN_REWARDS[cycleDays];
    if (claimBtn) claimBtn.innerHTML = `🎁 Réclamer — <b>${today.desc}</b>`;
}

function claimLoginBonus() {
    const today   = getTodayDateStr();
    const cycle   = G.loginCycleDays || 0;
    const reward  = LOGIN_REWARDS[cycle];

    reward.apply();

    // Mettre à jour la série
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
    G.loginStreak = (G.loginPrevDate === ydStr || !G.loginPrevDate) ? (G.loginStreak||0)+1 : 1;
    G.loginPrevDate  = today;
    G.loginLastDate  = today;
    G.loginCycleDays = (cycle + 1) % 7;

    (markSaveDirty(), saveGame()); updateDisplays();
    document.getElementById('login-bonus-overlay').classList.add('hidden');
    showNotif(`🎁 Bonus Jour ${cycle+1} réclamé : ${reward.desc} !`);
}

// =============================================================
// QUÊTES JOURNALIÈRES — 3 quêtes par jour, reset à minuit
// =============================================================
/* §câblage : DQ_POOL fourni par assets/globals.bundle.js (src/data) */

// Choisit 3 quêtes déterministes pour la journée (stable même après rechargement)
function getDailyQuestPool(dateStr) {
    const seed = dateStr.split('-').reduce((a, v, i) => a + parseInt(v) * (i+1) * 7, 0);
    const arr  = [...DQ_POOL];
    for (let i = arr.length-1; i > 0; i--) {
        const j = ((seed * (i+13)) % (i+1) + (i+1)) % (i+1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Sélectionne 3 quêtes de types différents si possible
    const selected = [], seen = new Set();
    for (const q of arr) {
        if (selected.length >= 3) break;
        if (!seen.has(q.type)) { selected.push(q); seen.add(q.type); }
    }
    while (selected.length < 3) selected.push(arr[selected.length]);
    return selected;
}

function initDailyQuests() {
    const today = getTodayDateStr();
    if (G.dailyQuestDate !== today) {
        G.dailyQuestDate     = today;
        G.dailyQuestsProgress= [0,0,0];
        G.dailyQuestsClaimed = [false,false,false];
        // Snapshot des compteurs au début du jour
        G.dailyQuestsSnapshot = {
            kills:    G.totalKills,
            bossKills:G.bossKills,
            bbUses:   G.totalBBUses || 0,
            clicks:   G.totalClicks,
            goldGained:D(G.totalGold).toNumber() // §1.5
        };
        (markSaveDirty(), saveGame());
    }
}

function getDQProgress(quest) {
    const snap = G.dailyQuestsSnapshot || {};
    const delta = {
        kills:     G.totalKills - (snap.kills||0),
        bossKills: G.bossKills  - (snap.bossKills||0),
        bbUses:    (G.totalBBUses||0) - (snap.bbUses||0),
        clicks:    G.totalClicks - (snap.clicks||0),
        goldGained:D(G.totalGold).sub(snap.goldGained||0).toNumber() // §1.5
    };
    return Math.min(delta[quest.type] || 0, quest.target);
}

function claimDailyQuest(idx) {
    const today  = getTodayDateStr();
    if (G.dailyQuestDate !== today) initDailyQuests();
    if (G.dailyQuestsClaimed[idx]) return;
    const quests = getDailyQuestPool(today);
    const quest  = quests[idx];
    if (!quest || getDQProgress(quest) < quest.target) return;
    quest.apply();
    G.dailyQuestsClaimed[idx] = true;
    (markSaveDirty(), saveGame()); updateDisplays(); renderDailyQuests();
    showNotif(`✅ "${quest.name}" accomplie ! ${quest.rewardDesc} reçu !`);
}

function renderDailyQuests() {
    const container = document.getElementById('daily-quests-container');
    if (!container) return;

    // Timer reset
    const timerEl = document.getElementById('dq-reset-timer');
    if (timerEl) {
        const now = new Date(), mid = new Date(now);
        mid.setHours(24,0,0,0);
        const diff = mid - now;
        const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
        timerEl.textContent = `Reset dans ${h}h ${m}m`;
    }

    const today  = getTodayDateStr();
    const quests = getDailyQuestPool(today);
    let html = '';

    quests.forEach((q, i) => {
        const prog    = getDQProgress(q);
        const pct     = Math.min(100, (prog / q.target) * 100);
        const isDone  = prog >= q.target;
        const claimed = G.dailyQuestsClaimed && G.dailyQuestsClaimed[i];

        let cardCls = 'daily-quest-card';
        if (claimed) cardCls += ' dq-claimed';
        else if (isDone) cardCls += ' dq-complete';

        // §4.2 — bouton ×2 après réclamation
        const adQuestKey = `quest_${i}_${getTodayDateStr()}`;
        const adQuestUsed = !!localStorage.getItem(adQuestKey);
        let btnHtml;
        if (claimed && !adQuestUsed && adCapAvailable('questDouble'))
            btnHtml = `<span class="dq-btn done">✓ Réclamé</span>
                <button class="dq-btn can" style="margin-left:6px;font-size:11px;padding:4px 8px;"
                    onclick="adDoubleQuestReward(${i})">📺 ×2</button>`;
        else if (claimed)
            btnHtml = `<span class="dq-btn done">✓ Réclamé</span>`;
        else if (isDone) btnHtml = `<button class="dq-btn can" onclick="claimDailyQuest(${i})">Réclamer</button>`;
        else            btnHtml = `<button class="dq-btn wait" disabled>En cours…</button>`;

        html += `<div class="${cardCls}">
            <div class="dq-top">
                <span class="dq-name">${q.name}</span>
                <span class="dq-reward">🎁 ${q.rewardDesc}</span>
            </div>
            <div class="dq-bar"><div class="dq-fill${isDone?' done':''}" style="width:${pct}%"></div></div>
            <div class="dq-bottom">
                <span class="dq-prog-txt">${fmt(Math.floor(prog))} / ${fmt(q.target)}</span>
                ${btnHtml}
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// Rafraîchissement des quêtes géré dans simulate() via _questAcc

// =============================================================
// BOSS HEBDOMADAIRE — Change chaque semaine, 3 tentatives/jour
// =============================================================
/* §câblage : WEEKLY_BOSSES fourni par assets/globals.bundle.js (src/data) */
const WB_MAX_ATTEMPTS_PER_DAY = 3;

function getWeeklyBossDef() {
    const wk  = getWeekStr();
    const num = parseInt(wk.split('-W')[1]) || 0;
    return WEEKLY_BOSSES[num % WEEKLY_BOSSES.length];
}

function initWeeklyBoss() {
    const wk   = getWeekStr();
    const boss = getWeeklyBossDef();
    if (G.weeklyBossWeek !== wk) {
        G.weeklyBossWeek          = wk;
        G.weeklyBossHp            = boss.hp;
        G.weeklyBossMaxHp         = boss.hp;
        G.weeklyBossDefeated      = false;
        G.weeklyBossRewardClaimed = false;
        G.weeklyBossAttemptsToday = 0;
        G.weeklyBossAttemptsDate  = getTodayDateStr();
        (markSaveDirty(), saveGame());
    } else {
        const today = getTodayDateStr();
        if (G.weeklyBossAttemptsDate !== today) {
            G.weeklyBossAttemptsToday = 0;
            G.weeklyBossAttemptsDate  = today;
            (markSaveDirty(), saveGame());
        }
    }
    // Tag de semaine
    const tagEl = document.getElementById('wb-week-tag');
    if (tagEl) { const wkNum = parseInt(wk.split('-W')[1]); tagEl.textContent = `Semaine ${wkNum}`; }
}

function attackWeeklyBoss() {
    if (G.weeklyBossDefeated) return;
    if ((G.weeklyBossAttemptsToday||0) >= WB_MAX_ATTEMPTS_PER_DAY) {
        showNotif('⚠️ Plus de tentatives disponibles aujourd\'hui !'); return;
    }
    const boss   = getWeeklyBossDef();
    const dps    = getTotalDPS();
    // §SOUTIEN — Simule 45s : le joueur soutient → BBs chargés plus vite → burst ×1.5
    const dmg    = Math.floor(dps * 45 * 1.5 * (1 + (G.prestigeCrystals||0) * 0.1));
    G.weeklyBossAttemptsToday = (G.weeklyBossAttemptsToday||0) + 1;
    G.weeklyBossHp = Math.max(0, G.weeklyBossHp - dmg);

    if (G.weeklyBossHp <= 0) {
        G.weeklyBossHp = 0; G.weeklyBossDefeated = true;
        screenFlash('#ff6b6b');
        showNotif(`🎉 ${boss.name} est vaincu ! Réclamez vos récompenses !`);
        Sound.playSummon();
    } else {
        showNotif(`⚔ −${fmt(dmg)} PV infligés au ${boss.name} !`);
    }
    (markSaveDirty(), saveGame()); renderWeeklyBoss(); updateDisplays();
}

function claimWeeklyReward() {
    if (!G.weeklyBossDefeated || G.weeklyBossRewardClaimed) return;
    const boss = getWeeklyBossDef();
    G.gems       += boss.gems;
    G.honorPoints+= boss.ph;
    if (boss.mat) G.materials[boss.mat] = (G.materials[boss.mat]||0) + 1;
    G.weeklyBossRewardClaimed = true;
    (markSaveDirty(), saveGame()); updateDisplays(); renderWeeklyBoss();
    showNotif(`🏆 Récompenses : ${boss.gems} 💎 + ${fmt(boss.ph)} PH + 1 Totem !`);
    screenFlash('#f1c40f');
}

function renderWeeklyBoss() {
    const container = document.getElementById('weekly-boss-container');
    if (!container) return;
    const boss   = getWeeklyBossDef();
    const hpPct  = G.weeklyBossMaxHp > 0 ? Math.max(0, (G.weeklyBossHp / G.weeklyBossMaxHp) * 100) : 0;
    const attLeft= WB_MAX_ATTEMPTS_PER_DAY - (G.weeklyBossAttemptsToday||0);

    // Compte à rebours fin de semaine (dimanche 23:59)
    const now = new Date();
    const sun = new Date(now); sun.setDate(now.getDate() + (7 - now.getDay()) % 7); sun.setHours(23,59,59,999);
    const diffMs = sun - now;
    const daysLeft = Math.floor(diffMs / 86400000);
    const hrsLeft  = Math.floor((diffMs % 86400000) / 3600000);

    let actionHtml;
    if (G.weeklyBossDefeated) {
        if (G.weeklyBossRewardClaimed) {
            actionHtml = `<div class="wb-victory-box">✅ Boss vaincu — Récompenses réclamées !</div>`;
        } else {
            actionHtml = `
                <div class="wb-victory-box">🎉 ${boss.name} est vaincu !</div>
                <button class="wb-reward-btn" onclick="claimWeeklyReward()">
                    🎁 Réclamer ${boss.gems} 💎 + ${fmt(boss.ph)} PH + Totem
                </button>`;
        }
    } else {
        actionHtml = `
            <div class="wb-attempts">⚔ Tentatives aujourd'hui : ${WB_MAX_ATTEMPTS_PER_DAY - attLeft} / ${WB_MAX_ATTEMPTS_PER_DAY}</div>
            <button class="wb-atk-btn" onclick="attackWeeklyBoss()" ${attLeft <= 0 ? 'disabled' : ''}>
                ${attLeft > 0 ? `⚔ Attaquer le Boss (×${attLeft} restant${attLeft>1?'es':''})` : '🔒 Revenez demain'}
            </button>`;
    }

    container.innerHTML = `
        <div class="wb-boss-name">${boss.icon} ${boss.name}</div>
        <div class="wb-boss-sub" style="color:${boss.color}">${boss.elem} · Boss de la Semaine</div>
        <p class="wb-lore">${boss.lore}</p>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div class="wb-hp-bar" style="flex:1"><div class="wb-hp-fill" style="width:${hpPct}%"></div></div>
            <span style="font-size: 11px;color:#6a5a5a;white-space:nowrap">${Math.round(hpPct)}%</span>
        </div>
        <div class="wb-hp-text">${fmt(Math.max(0,G.weeklyBossHp))} / ${fmt(G.weeklyBossMaxHp)} PV</div>
        ${actionHtml}
        <div class="wb-timer-txt">⏳ Reset dans ${daysLeft > 0 ? daysLeft+'j ' : ''}${hrsLeft}h</div>
    `;
}


function getActiveSynergies() {
    const heroes = G.squad.filter(id => id && G.heroes[id]).map(id => HERO_DEFS.find(d => d.id === id)).filter(Boolean);
    const leaderDef = G.leaderId ? HERO_DEFS.find(d => d.id === G.leaderId) : null;
    return SYNERGIES.filter(s => s.condition(heroes, leaderDef));
}

function renderSynergies() {
    const list = document.getElementById('synergy-list');
    if (!list) return;
    const active = getActiveSynergies();
    if (active.length === 0) {
        list.innerHTML = '<div class="synergy-empty">Combine tes héros pour activer des synergies</div>';
        return;
    }
    list.innerHTML = active.map(s => `
        <div class="synergy-chip" style="border-color:${s.borderColor};background:${s.bgColor};color:${s.color}">
            <span class="synergy-chip-icon">${s.icon}</span>
            <div class="synergy-chip-info">
                <div class="synergy-chip-name">${s.name}</div>
                <div class="synergy-chip-bonus">${s.desc}</div>
            </div>
        </div>
    `).join('');
}

// ── Formations UI ─────────────────────────────────────────────
function renderFormations() {
    const grid = document.getElementById('formation-grid');
    if (!grid) return;
    grid.innerHTML = FORMATIONS.map(f => `
        <div class="formation-card ${G.formation === f.id ? 'active' : ''}"
             style="--fc:${f.color}"
             onclick="selectFormation('${f.id}')">
            <div class="formation-card-icon">${f.icon}</div>
            <div class="formation-card-name">${f.name}</div>
            <div class="formation-card-stat">${f.statLine || f.desc}</div>
        </div>
    `).join('');
}

function selectFormation(id) {
    G.formation = id;
    const f = FORMATIONS.find(fm => fm.id === id);
    (markSaveDirty(), saveGame());
    renderFormations();
    updatePartyStats();
    updateDisplays();
    renderSynergies(); // synergies peuvent changer avec DPS affiché
    if (f) showNotif(`◈ Formation : ${f.icon} ${f.name}`);
}

// ── Difficulté ────────────────────────────────────────────────
const DIFF_LABELS = {
    easy:    { icon: '<span class="diff-dot easy">●</span>', name: 'Facile',   cls: 'easy'    },
    normal:  { icon: '<span class="diff-dot normal">●</span>', name: 'Normal',   cls: 'normal'  },
    hard:    { icon: '<span class="diff-dot hard">●</span>', name: 'Difficile',cls: 'hard'    },
    extreme: { icon: '<span class="diff-dot extreme">●</span>', name: 'Extrême',  cls: 'extreme' },
};

function updateDifficultyBadge() {
    const badge = document.getElementById('difficulty-badge');
    if (!badge) return;
    const d = DIFF_LABELS[G.difficulty] || DIFF_LABELS.normal;
    badge.innerHTML = `${d.icon} ${d.name}`;
    badge.className = d.cls;
}

function openDifficultyModal() {
    const modal = document.getElementById('difficulty-modal');
    if (!modal) return;
    // Marquer l'option sélectionnée
    ['easy','normal','hard','extreme'].forEach(lvl => {
        const el = document.getElementById(`diff-opt-${lvl}`);
        if (el) el.classList.toggle('selected', G.difficulty === lvl);
    });
    modal.classList.remove('hidden');
}

function closeDifficultyModal() {
    const modal = document.getElementById('difficulty-modal');
    if (modal) modal.classList.add('hidden');
}

function selectDifficulty(level) {
    G.difficulty = level;
    (markSaveDirty(), saveGame());
    closeDifficultyModal();
    updateDifficultyBadge();
    if (typeof updatePartyHpBar === 'function') updatePartyHpBar(); // update danger vignette state immediately
    // Respawn le monstre courant avec les nouveaux PV
    G.monsterHp = D(getMonsterMaxHp()); // §1.5
    G.monsterMaxHp = G.monsterHp;
    updateHpBar(true);
    const d = DIFF_LABELS[level] || DIFF_LABELS.normal;
    showNotif(`${d.icon} Difficulté : ${d.name}`);
}

// =============================================================
// PILIER 3 — MOMENTS PARTAGEABLES
// =============================================================

// ── Tracking boss pour les cartes de victoire ─────────────────
let _bossStartTime = 0;
let _bossTotalDmg   = 0;

// ── Noms de boss pour les zones jalons ────────────────────────
const BOSS_NAMES_BY_ZONE = {
    10: 'Golem de Fer', 25: 'Hydre des Abysses',
    50: 'Seigneur Drakar', 100: 'Démon Éternel', 150: 'Roi des Ombres',
};
function getBossNameForZone(zone) {
    return BOSS_NAMES_BY_ZONE[zone] || `Boss de la Zone ${zone}`;
}

// ── Utilitaires canvas ────────────────────────────────────────
function _drawGradBg(ctx, w, h, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
}

// ── Partage Web Share API + fallback download ─────────────────
function shareOrDownload(canvas, filename, title) {
    canvas.toBlob(async blob => {
        if (!blob) { showNotif('Erreur de génération'); return; }
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ title, files: [file] }); return; }
            catch (e) { if (e.name === 'AbortError') return; }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        showNotif('🖼️ Image téléchargée !');
    }, 'image/png');
}

// ── SQUAD CARD ────────────────────────────────────────────────
async function generateSquadCard() {
    const W = 800, H = 420;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    _drawGradBg(ctx, W, H, '#0d0820', '#1a0d35');

    // Glow central
    const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 300);
    grd.addColorStop(0, 'rgba(124,58,237,0.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Bordure or
    ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
    _roundRect(ctx, 8, 8, W-16, H-16, 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(241,196,15,0.18)'; ctx.lineWidth = 1;
    _roundRect(ctx, 14, 14, W-28, H-28, 12); ctx.stroke();

    // Titre
    ctx.font = 'bold 22px Outfit, sans-serif'; ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(241,196,15,0.7)'; ctx.shadowBlur = 14;
    ctx.fillText('⚔  MA SQUAD', W/2, 50); ctx.shadowBlur = 0;
    ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Final Frontier Clicker', W/2, 68);

    // Héros actifs
    const activeHeroes = G.squad.filter(id => id && G.heroes[id]);
    const count = Math.min(activeHeroes.length, 4);
    const slotW = 160, slotH = 230, gap = 16;
    const startX = (W - (count * slotW + (count-1) * gap)) / 2;

    const elemBg = { 'Feu':'#3d1a0a','Eau':'#0a1a3d','Terre':'#1a2d0a','Foudre':'#2d2a0a','Lumière':'#2d2a10','Ténèbres':'#1a0a2d' };
    const elemBorder = { 'Feu':'#e05533','Eau':'#3388ee','Terre':'#55bb33','Foudre':'#eecc22','Lumière':'#ffeedd','Ténèbres':'#aa55ff' };
    const elemEmoji = { 'Feu':'🔥','Eau':'💧','Terre':'🌿','Foudre':'⚡','Lumière':'✨','Ténèbres':'🌙' };

    for (let i = 0; i < count; i++) {
        const heroId = activeHeroes[i];
        const h = G.heroes[heroId];
        const def = HERO_DEFS.find(d => d.id === heroId);
        if (!def) continue;

        const sx = startX + i * (slotW + gap), sy = 82;

        // Fond carte
        ctx.fillStyle = elemBg[def.elem] || '#1a1a2d';
        _roundRect(ctx, sx, sy, slotW, slotH, 12); ctx.fill();
        ctx.strokeStyle = elemBorder[def.elem] || '#4a4a6a'; ctx.lineWidth = 1.5;
        _roundRect(ctx, sx, sy, slotW, slotH, 12); ctx.stroke();

        // Image héros
        await new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                ctx.save();
                _roundRect(ctx, sx+6, sy+6, slotW-12, 128, 8); ctx.clip();
                ctx.drawImage(img, sx+6, sy+6, slotW-12, 128);
                ctx.restore(); resolve();
            };
            img.onerror = () => {
                // Fallback texte
                ctx.font = '52px serif'; ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(elemEmoji[def.elem]||'⚔', sx+slotW/2, sy+76);
                resolve();
            };
            img.src = getHeroImage(heroId, h.stars, 'squad');
        });

        // Nom
        ctx.font = 'bold 13px Outfit, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(def.titles ? def.titles[Math.min(h.stars-1,def.titles.length-1)] || def.id : def.id, sx+slotW/2, sy+154);

        // Élément
        ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText((elemEmoji[def.elem]||'') + ' ' + def.elem, sx+slotW/2, sy+170);

        // Étoiles
        const starSz = 13;
        const starsTotal = 6;
        const starsRowW = starsTotal * (starSz + 2);
        const starStartX = sx + (slotW - starsRowW) / 2;
        for (let s = 0; s < starsTotal; s++) {
            ctx.font = `${starSz}px serif`; ctx.textAlign = 'left';
            ctx.fillStyle = s < h.stars ? '#f1c40f' : 'rgba(255,255,255,0.12)';
            ctx.fillText('★', starStartX + s*(starSz+2), sy+194);
        }

        // Niveau
        ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center';
        ctx.fillText(`Niv. ${h.level}`, sx+slotW/2, sy+212);
    }

    // Stats bar en bas
    const statsY = 337;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    _roundRect(ctx, 28, statsY, W-56, 58, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
    _roundRect(ctx, 28, statsY, W-56, 58, 10); ctx.stroke();

    const stats = [
        { label: 'DPS TOTAL',  val: fmt(getTotalDPS()) },
        { label: 'ZONE MAX',   val: `Zone ${G.maxZone}` },
        { label: 'PRESTIGE',   val: `×${G.totalPrestiges||0}` },
    ];
    const statW = (W-56) / stats.length;
    stats.forEach((s, i) => {
        const cx = 28 + statW*i + statW/2;
        ctx.font = 'bold 19px Outfit, sans-serif'; ctx.fillStyle = '#f1c40f'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(241,196,15,0.5)'; ctx.shadowBlur = 8;
        ctx.fillText(s.val, cx, statsY+27); ctx.shadowBlur = 0;
        ctx.font = '9px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(s.label, cx, statsY+44);
    });

    // Filigrane
    ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'right';
    ctx.fillText('brave-frontier-clicker.com', W-18, H-10);

    return canvas;
}

async function openSquadShareModal() {
    const modal = document.getElementById('squad-share-modal');
    if (!modal) return;
    const wrap = document.getElementById('squad-share-canvas-wrap');
    wrap.innerHTML = '<div style="color:#888;font-size:12px;padding:20px">Génération en cours…</div>';
    modal.classList.remove('hidden');
    try {
        const canvas = await generateSquadCard();
        canvas.style.maxWidth = '100%';
        wrap.innerHTML = ''; wrap.appendChild(canvas);
        document.getElementById('squad-share-share-btn').onclick = () =>
            shareOrDownload(canvas, 'ma-squad-brave-frontier.png', 'Ma Squad — Final Frontier Clicker');
    } catch(e) {
        wrap.innerHTML = '<div style="color:#e55;font-size:12px;padding:20px">Erreur de génération.</div>';
    }
}

// ── BOSS VICTORY ──────────────────────────────────────────────
async function generateBossVictoryCard(zone, bossName, timeMs, totalDmg) {
    const W = 800, H = 380;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    _drawGradBg(ctx, W, H, '#0d0310', '#200520');

    const gr2 = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 260);
    gr2.addColorStop(0, 'rgba(200,100,255,0.22)'); gr2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr2; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
    _roundRect(ctx, 8, 8, W-16, H-16, 16); ctx.stroke();

    // Labels
    ctx.font = 'bold 12px Outfit, sans-serif'; ctx.fillStyle = 'rgba(200,150,255,0.6)'; ctx.textAlign = 'center';
    ctx.fillText('★  BOSS VAINCU  ★', W/2, 50);
    ctx.font = 'bold 12px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`Zone ${zone}`, W/2, 70);

    // Nom du boss
    const fontSize = zone >= 100 ? 40 : 36;
    ctx.font = `bold ${fontSize}px Outfit, sans-serif`; ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = 'rgba(241,196,15,0.85)'; ctx.shadowBlur = 22;
    ctx.fillText(bossName, W/2, 132); ctx.shadowBlur = 0;

    // Séparateur
    ctx.strokeStyle = 'rgba(241,196,15,0.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 152); ctx.lineTo(W-100, 152); ctx.stroke();

    // Stats
    const elapsed = timeMs < 60000 ? `${(timeMs/1000).toFixed(1)}s` : `${Math.floor(timeMs/60000)}m${Math.floor((timeMs%60000)/1000)}s`;
    const statsData = [
        { label: 'TEMPS',   val: elapsed,         icon: '⏱️' },
        { label: 'DÉGÂTS',  val: fmt(totalDmg||0), icon: '⚔' },
        { label: 'ZONE',    val: `${zone}`,         icon: '🗺️' },
    ];
    const sw = (W-120) / statsData.length;
    statsData.forEach((s, i) => {
        const cx = 60 + sw*i + sw/2;
        const sy = 222;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        _roundRect(ctx, 60+sw*i+8, sy-34, sw-16, 86, 10); ctx.fill();

        ctx.font = '22px serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(s.icon, cx, sy-4);
        ctx.font = 'bold 19px Outfit, sans-serif'; ctx.fillStyle = '#f1c40f';
        ctx.shadowColor = 'rgba(241,196,15,0.5)'; ctx.shadowBlur = 8;
        ctx.fillText(s.val, cx, sy+22); ctx.shadowBlur = 0;
        ctx.font = '9px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.fillText(s.label, cx, sy+38);
    });

    // Footer
    ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.textAlign = 'center';
    ctx.fillText('Final Frontier Clicker', W/2, H-22);
    ctx.font = '9px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillText(new Date().toLocaleDateString('fr-FR'), W/2, H-8);

    return canvas;
}

let _bossVictoryCanvas = null;

async function showBossVictoryScreen(zone, bossName, timeMs, totalDmg) {
    const overlay = document.getElementById('boss-victory-overlay');
    if (!overlay) return;

    launchVictoryParticles();

    const elapsed = timeMs < 60000 ? `${(timeMs/1000).toFixed(1)}s` : `${Math.floor(timeMs/60000)}m${Math.floor((timeMs%60000)/1000)}s`;
    document.getElementById('bv-zone').textContent = `Zone ${zone}`;
    document.getElementById('bv-boss-name').textContent = bossName;
    document.getElementById('bv-time').textContent = elapsed;
    document.getElementById('bv-dmg').textContent = fmt(totalDmg || 0);

    overlay.classList.remove('hidden');

    try {
        const canvas = await generateBossVictoryCard(zone, bossName, timeMs, totalDmg);
        _bossVictoryCanvas = canvas;
        canvas.style.maxWidth = '100%'; canvas.style.maxHeight = '180px';
        const wrap = document.getElementById('bv-canvas-wrap');
        if (wrap) { wrap.innerHTML = ''; wrap.appendChild(canvas); }
    } catch(e) {}
}

function closeBossVictory() {
    const overlay = document.getElementById('boss-victory-overlay');
    if (overlay) overlay.classList.add('hidden');
    _bossVictoryCanvas = null;
}

function shareBossVictory() {
    if (!_bossVictoryCanvas) { showNotif('Image non prête, patiente un instant !'); return; }
    const bossName = document.getElementById('bv-boss-name').textContent;
    shareOrDownload(_bossVictoryCanvas, `victoire-${bossName.replace(/\s+/g,'-').toLowerCase()}.png`,
        `Boss Vaincu ! ${bossName} — Final Frontier Clicker`);
}

function launchVictoryParticles() {
    const colors = ['#f1c40f','#c084fc','#60a5fa','#34d399','#f87171','#fff'];
    const container = document.getElementById('bv-particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'bv-particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top  = (45 + Math.random() * 45) + 'vh';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDelay    = (Math.random() * 0.7).toFixed(2) + 's';
        p.style.animationDuration = (0.7 + Math.random() * 0.9).toFixed(2) + 's';
        container.appendChild(p);
    }
    setTimeout(() => { if (container) container.innerHTML = ''; }, 2500);
}

// ── ACHIEVEMENT SHARE ─────────────────────────────────────────
const SHARE_MILESTONES = {
    first_prestige: { title:'∞ Premier Prestige !', sub:'Le voyage recommence…',    c1:'#2d0660', c2:'#0d0820', accent:'#c084fc', icon:'🔮' },
    hero_6star:     { title:'⭐ Héros 6★ !',        sub:'La puissance ultime !',      c1:'#1a1200', c2:'#0d0820', accent:'#f1c40f', icon:'⭐' },
    zone_50:        { title:'🗺️ Zone 50 !',          sub:'À mi-chemin vers la légende',c1:'#001a20', c2:'#0d1520', accent:'#34d399', icon:'🗺️' },
    zone_100:       { title:'🏆 Zone 100 !',         sub:'Aventurier d\'Élite !',      c1:'#1a0800', c2:'#0d0820', accent:'#f97316', icon:'🏆' },
    zone_200:       { title:'👑 Zone 200 !',         sub:'Légende Vivante',            c1:'#1a1000', c2:'#0d0820', accent:'#f1c40f', icon:'👑' },
};

let _achShareCanvas = null;

async function triggerAchievementShare(milestoneId, extra) {
    const ms = SHARE_MILESTONES[milestoneId];
    if (!ms) return;
    const modal = document.getElementById('achievement-share-modal');
    if (!modal) return;

    document.getElementById('ach-share-title').textContent = ms.title;
    const wrap = document.getElementById('ach-share-canvas-wrap');
    wrap.innerHTML = '<div style="color:#888;font-size:12px;padding:20px">Génération…</div>';
    modal.classList.remove('hidden');

    try {
        const canvas = await generateAchievementCard(ms, extra);
        _achShareCanvas = canvas;
        canvas.style.maxWidth = '100%';
        wrap.innerHTML = ''; wrap.appendChild(canvas);
        document.getElementById('ach-share-share-btn').onclick = () =>
            shareOrDownload(canvas, `achievement-${milestoneId}.png`, ms.title + ' — Final Frontier Clicker');
    } catch(e) {
        wrap.innerHTML = '<div style="color:#e55;font-size:12px;padding:20px">Erreur.</div>';
    }
}

function closeAchShare() {
    const modal = document.getElementById('achievement-share-modal');
    if (modal) modal.classList.add('hidden');
    _achShareCanvas = null;
}

async function generateAchievementCard(ms, extra) {
    const W = 640, H = 300;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    _drawGradBg(ctx, W, H, ms.c1, ms.c2);

    // Glow de couleur
    const gr = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 200);
    gr.addColorStop(0, ms.accent + '30'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

    // Bordure
    ctx.strokeStyle = ms.accent; ctx.lineWidth = 2.5;
    _roundRect(ctx, 8, 8, W-16, H-16, 14); ctx.stroke();

    // Icône
    ctx.font = '52px serif'; ctx.textAlign = 'center';
    ctx.fillText(ms.icon, W/2, 80);

    // Titre
    ctx.font = 'bold 28px Outfit, sans-serif'; ctx.fillStyle = ms.accent;
    ctx.shadowColor = ms.accent + 'aa'; ctx.shadowBlur = 15;
    ctx.fillText(ms.title, W/2, 132); ctx.shadowBlur = 0;

    // Sous-titre
    ctx.font = '14px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(ms.sub, W/2, 158);

    // Ligne extra
    if (extra) {
        let line = '';
        if (extra.crystals !== undefined) line = `+${extra.crystals} Cristaux de Prestige`;
        if (extra.heroId) {
            const d = HERO_DEFS.find(d2 => d2.id === extra.heroId);
            if (d) line = (d.titles ? d.titles[d.titles.length-1] : d.id) + ' — 6 Étoiles !';
        }
        if (extra.zone) line = `Zone ${extra.zone} franchie !`;
        if (line) {
            ctx.font = 'bold 14px Outfit, sans-serif'; ctx.fillStyle = '#fff';
            ctx.fillText(line, W/2, 186);
        }
    }

    // Stats compactes
    const statLine = `Zone Max : ${G.maxZone}  ·  Prestige ×${G.totalPrestiges||0}`;
    ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(statLine, W/2, 216);

    // Footer
    ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('Final Frontier Clicker', W/2, H-18);
    ctx.font = '9px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillText(new Date().toLocaleDateString('fr-FR'), W/2, H-6);

    return canvas;
}

// ── Initialisation des flags d'achievement zone (évite répétition) ──
if (!G._achZone50)  G._achZone50  = G.maxZone >= 50;
if (!G._achZone100) G._achZone100 = G.maxZone >= 100;
if (!G._achZone200) G._achZone200 = G.maxZone >= 200;

// Lancement de la vérification de déconnexion dès l'ouverture du client
setTimeout(checkOfflineGains, 300);

// Rendu initial de l'interface pour peupler les onglets visibles dès le chargement
renderHeroesGrid();
renderSkills();
renderFooterBB();
updateDisplays();

// ── Pilier 4 : Profondeur stratégique ─────────────────────────
updateDifficultyBadge();
renderFormations();
renderSynergies();

// ── Améliorations 3.1–3.5 ─────────────────────────────────────
renderObjectiveBar();
updatePityDisplay();
renderPrestigePanel();
// Tutoriel : démarre désormais au lancement du premier stage (voir startStage)

// ── Systèmes de rétention ──────────────────────────────────────
initDailyQuests();
initWeeklyBoss();
renderDailyQuests();
renderWeeklyBoss();
// Login bonus après un court délai (laisser le jeu se charger d'abord)
setTimeout(initLoginBonus, 800);

// Handle responsive startup layout
initResponsiveLayout();

// Carousel du Hub
let _hubCarouselInitialized = false;

function initHubCarousel() {
    if (_hubCarouselInitialized) return;
    const scroller = document.getElementById('hub-central-scroller');
    if (!scroller) return;
    
    _hubCarouselInitialized = true;
    
    // Drag-to-scroll pour les utilisateurs PC (souris)
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;
    
    scroller.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasMoved = false;
        startX = e.pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
        scroller.style.scrollBehavior = 'auto'; // désactive la transition fluide pendant le drag
    });
    
    scroller.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            scroller.style.scrollBehavior = 'smooth';
            snapToClosestGate();
        }
    });
    
    scroller.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scroller.style.scrollBehavior = 'smooth';
            snapToClosestGate();
        }
    });
    
    scroller.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scroller.offsetLeft;
        const walk = (x - startX) * 1.4; // multiplicateur de vitesse
        if (Math.abs(x - startX) > 6) {
            hasMoved = true;
        }
        scroller.scrollLeft = scrollLeft - walk;
    });
    
    // Intercepter le click pour éviter la navigation en cas de drag, ou pour centrer les portes décentrées
    scroller.addEventListener('click', (e) => {
        const gate = e.target.closest('.hub-gate-img');
        if (!gate) return;
        
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }
        
        const rect = scroller.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const gateRect = gate.getBoundingClientRect();
        const gateCenterX = gateRect.left + gateRect.width / 2;
        const distance = Math.abs(centerX - gateCenterX);
        
        // Si la porte est décentrée de plus de 45px, on la centre au lieu d'ouvrir le menu
        if (distance > 45) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const containerCenter = scroller.offsetWidth / 2;
            const gateCenter = gate.offsetLeft + (gate.offsetWidth / 2);
            scroller.scrollTo({
                left: gateCenter - containerCenter,
                behavior: 'smooth'
            });
        }
    }, { capture: true });
    
    // Gestionnaire de scroll pour mettre à jour l'échelle/opacité et les indicateurs
    scroller.addEventListener('scroll', updateHubCarouselVisuals);
    
    // Pagination dots
    const dots = document.querySelectorAll('.hub-gate-dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            scrollToGateIndex(index);
        });
    });
}

function updateHubCarouselVisuals() {
    const scroller = document.getElementById('hub-central-scroller');
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    
    const gates = scroller.querySelectorAll('.hub-gate-img');
    const dots = document.querySelectorAll('.hub-gate-dot');
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    gates.forEach((gate, idx) => {
        const img = gate.querySelector('img');
        const card = gate.querySelector('.hub-gate-label-card');
        
        const gateRect = gate.getBoundingClientRect();
        const gateCenterX = gateRect.left + gateRect.width / 2;
        const distance = Math.abs(centerX - gateCenterX);
        
        const maxDist = rect.width / 2 || 200;
        const ratio = Math.max(0, Math.min(1, distance / maxDist));
        
        const scale = 1.06 - (ratio * 0.18); // de 1.06 (au centre) à 0.88
        const opacity = 1.0 - (ratio * 0.7);  // de 1.0 (au centre) à 0.3
        
        if (img) {
            img.style.transform = `scale(${scale})`;
        }
        if (card) {
            card.style.opacity = opacity;
            card.style.transform = `translateX(-50%) scale(${scale})`;
        }
        
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
        }
    });
    
    dots.forEach((dot, idx) => {
        if (idx === closestIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function scrollToGateIndex(index, behavior = 'smooth') {
    const scroller = document.getElementById('hub-central-scroller');
    if (!scroller) return;
    const gates = scroller.querySelectorAll('.hub-gate-img');
    if (gates[index]) {
        const gate = gates[index];
        const containerCenter = scroller.offsetWidth / 2;
        const gateCenter = gate.offsetLeft + (gate.offsetWidth / 2);
        scroller.scrollTo({
            left: gateCenter - containerCenter,
            behavior: behavior
        });
    }
}

function snapToClosestGate() {
    const scroller = document.getElementById('hub-central-scroller');
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const gates = scroller.querySelectorAll('.hub-gate-img');
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    gates.forEach((gate, idx) => {
        const gateRect = gate.getBoundingClientRect();
        const gateCenterX = gateRect.left + gateRect.width / 2;
        const distance = Math.abs(centerX - gateCenterX);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
        }
    });
    
    scrollToGateIndex(closestIndex, 'smooth');
}

// Initialiser le carrousel au démarrage
window.addEventListener('DOMContentLoaded', () => {
    initHubCarousel();
});



BGM.update();

// Écouteur d'événements clavier pour les raccourcis d'ergonomie
window.addEventListener('keydown', (e) => {
    // 1. Fermeture avec Échap : section hub → panneau stages → carte → ville → modal héros
    if (e.key === 'Escape' || e.key === 'Esc') {
        const hph = document.getElementById('hub-panel-host');
        if (hph && !hph.classList.contains('hidden')) { closeHubPanelToHome(); return; }
        const asp = document.getElementById('area-stages-panel');
        if (asp && !asp.classList.contains('hidden')) { closeAreaPanel(); return; }
        const qm = document.getElementById('quest-map-view');
        if (qm && !qm.classList.contains('hidden')) { closeQuestMap(); return; }
        const tv = document.getElementById('town-view');
        if (tv && !tv.classList.contains('hidden')) { closeTown(); return; }
        const modal = document.getElementById('hero-modal');
        if (modal && modal.classList.contains('visible')) {
            closeHeroModal();
        }
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // 2. Sorts d'Invocateur : A / Z / E — utilisé e.key (insensible au layout AZERTY/QWERTY)
    const k = e.key.toLowerCase();
    if (k === 'a') usePlayerSkill('strike');
    else if (k === 'z') usePlayerSkill('wealth');
    else if (k === 'e') usePlayerSkill('frenzy');

    // 3. Brave Bursts de la Squad : 1 / 2 / 3 / 4 (touches numériques, AZERTY & QWERTY)
    const bbKeyMap = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3 };
    if (e.code in bbKeyMap) {
        const slotIdx = bbKeyMap[e.code];
        const heroId = G.squad[slotIdx];
        if (heroId && G.heroes[heroId] && (G.bbGauges[heroId] || 0) >= 100) {
            useBB(heroId);
        }
    }
});

// Toggle du mode combat automatique
window.toggleCombatAuto = function() {
    Sound.init();
    G.autoCombat = !G.autoCombat;
    const btn = document.getElementById('combat-auto-btn');
    if (btn) {
        if (G.autoCombat) {
            btn.classList.add('active');
            btn.textContent = 'AUTO ON';
        } else {
            btn.classList.remove('active');
            btn.textContent = 'AUTO OFF';
        }
    }
    if (typeof Sound !== 'undefined' && typeof Sound.playClaim === 'function') {
        Sound.playClaim();
    }
};
