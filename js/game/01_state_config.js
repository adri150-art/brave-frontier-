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
    // Le combat se déroule désormais sur la page tour par tour (plus de cliqueur)
    if (typeof openTurnCombat === 'function') {
        openTurnCombat({ zone: node.zone, monsterName: (node.name || biome.name || 'COMBAT').toUpperCase() });
    }
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

// §ÉCO — Drop de matériaux d'évolution au combat, piloté par NODE_DROP_RATES.
// Le clicker n'a que deux états de combat : monstre commun (combat) et boss.
function _biomeElemKey() {
    try {
        const t = ZONE_THEMES[(G.zone - 1) % ZONE_THEMES.length];
        return (typeof getElementKey === 'function') ? getElementKey(t.elem) : 'fire';
    } catch (e) { return 'fire'; }
}
function _grantMaterial(key, n = 1) {
    if (typeof MATERIAL_DEFS === 'undefined' || !MATERIAL_DEFS[key]) return false;
    G.materials[key] = (G.materials[key] || 0) + n;
    markSaveDirty();
    return true;
}
function _firstClearGems(isBoss) {
    const R = (typeof GEM_REWARDS !== 'undefined') ? GEM_REWARDS : { stageFirstClear: 3, bossFirstClear: 5 };
    return isBoss ? (R.bossFirstClear ?? 5) : (R.stageFirstClear ?? 3);
}
function tryDropBiomeMaterial() {
    const rates = (typeof NODE_DROP_RATES !== 'undefined') ? NODE_DROP_RATES : null;
    const elem  = _biomeElemKey();
    if (G.isBoss) {
        const b = rates ? rates.boss : { totemRepeat: 0.10, idol: 0.30, mimic: 0.10 };
        // §ÉCO v2 — un boss peut donner Totem + Idole (élément) + Mimic (universel)
        if (Math.random() < (b.totemRepeat ?? 0.10) && _grantMaterial(`${elem}_totem`)) {
            if (typeof showNotif === 'function') showNotif(`💠 Totem de ${elem} obtenu !`);
        }
        if (Math.random() < (b.idol ?? 0)) _grantMaterial(`${elem}_idol`);
        if (Math.random() < (b.mimic ?? 0)) _grantMaterial('mimic');
    } else {
        const c = rates ? rates.combat : { crystal: 0.10, mimic: 0.02 };
        if (Math.random() < (c.crystal ?? 0.08)) _grantMaterial(`${elem}_crystal`);
        if (Math.random() < (c.mimic ?? 0))      _grantMaterial('mimic');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// §ÉCO — FRAGMENTS DE HÉROS + POINTS DE MAÎTRE (voie déterministe anti-malchance)
// ═══════════════════════════════════════════════════════════════════════════════
const FRAGMENT_PM_VALUE = 50; // PM accordés par fragment quand tous les héros du biome sont déjà possédés

// Héros appartenant à l'élément du biome courant.
function _biomeHeroTargets() {
    if (typeof HERO_DEFS === 'undefined' || typeof getElementKey !== 'function') return [];
    const elem = _biomeElemKey();
    return HERO_DEFS.filter(d => getElementKey(d.element) === elem);
}
// Choisit le héros vers lequel accumuler les fragments : non possédé, en priorité celui
// qui en a déjà le plus (pour le finir).
function _pickFragmentTarget() {
    const unowned = _biomeHeroTargets().filter(d => !G.heroes[d.id]);
    if (!unowned.length) return null;
    unowned.sort((a, b) => (G.heroFragments[b.id] || 0) - (G.heroFragments[a.id] || 0));
    return unowned[0];
}
// Débloque un héros sans la grande animation de révélation (sûr pendant la fin de stage).
function _unlockHeroQuiet(heroId) {
    const def = (typeof HERO_DEFS !== 'undefined') ? HERO_DEFS.find(d => d.id === heroId) : null;
    if (!def || G.heroes[heroId]) return false;
    const type = (typeof HERO_TYPES !== 'undefined') ? HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)] : undefined;
    G.heroes[heroId] = (typeof initHero === 'function') ? initHero(type, heroId) : { level: 1, stars: def.rarity || 3 };
    G.heroes[heroId].limitBreak = 0; G.heroes[heroId].duplicates = 0;
    const slot = G.squad.indexOf(null);
    if (slot >= 0) { G.squad[slot] = heroId; if (slot === 0) G.leaderId = heroId; }
    if (typeof showNotif === 'function') showNotif(`🧩 Fragments complétés ! ${def.name} rejoint l'équipe !`);
    if (typeof renderHeroesGrid === 'function') renderHeroesGrid();
    markSaveDirty();
    return true;
}
// Crédite des Points de Maître.
function addMasterPoints(n) {
    if (!n) return;
    G.masterPoints = (G.masterPoints || 0) + n;
    markSaveDirty();
}
// Accumule n fragments vers un héros du biome ; auto-octroi à FRAGMENTS_PER_HERO.
function grantFragments(n) {
    const cap = (typeof FRAGMENTS_PER_HERO !== 'undefined') ? FRAGMENTS_PER_HERO : 50;
    const target = _pickFragmentTarget();
    if (!target) { addMasterPoints(n * FRAGMENT_PM_VALUE); return; } // rien à compléter → PM
    G.heroFragments[target.id] = (G.heroFragments[target.id] || 0) + n;
    if (G.heroFragments[target.id] >= cap) {
        G.heroFragments[target.id] -= cap;
        _unlockHeroQuiet(target.id);
    } else if (typeof showNotif === 'function') {
        const def = HERO_DEFS.find(d => d.id === target.id);
        showNotif(`🧩 +${n} fragment ${def ? def.name : ''} (${G.heroFragments[target.id]}/${cap})`);
    }
    markSaveDirty();
}
// Drops de fragments au combat, piloté par BOSS_HERO_DROP / ELITE_FRAGMENT_DROP.
function tryDropFragments() {
    const fr = (typeof NODE_DROP_RATES !== 'undefined') ? NODE_DROP_RATES : null;
    if (G.isBoss) {
        const pHero  = (typeof BOSS_HERO_DROP !== 'undefined') ? BOSS_HERO_DROP : 0.03;
        const target = _pickFragmentTarget();
        if (target && Math.random() < pHero) {
            G.heroFragments[target.id] = 0;
            _unlockHeroQuiet(target.id);   // drop direct du héros complet
            return;
        }
        grantFragments(3);                 // sinon, fragments garantis sur boss
    } else {
        const p = fr ? (fr.elite.fragment ?? 0.05) : 0.05; // pas d'élite → attaché aux kills normaux
        if (Math.random() < p) grantFragments(1);
    }
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
    squad: [null, null, null, null, null],
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
    maxSquadSize: 5,

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

    // §ÉCO — Fragments de héros + Points de Maître (voie déterministe / anti-malchance)
    heroFragments: {},   // { heroId: nb de fragments accumulés (0..FRAGMENTS_PER_HERO) }
    masterPoints: 0,     // PM gagnés via les doublons, dépensables en boutique

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
// Expose l'état global au reste de la page (ex. l'écran Unités / SquadStore
// dans index.html lit et écrit window.G). Sans ça, les modifs de squad
// partaient dans localStorage au lieu de l'état réel → le Home restait figé.
window.G = G;

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
