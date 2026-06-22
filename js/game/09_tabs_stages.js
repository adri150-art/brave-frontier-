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

    const runPostLoadInit = () => {
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
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        runPostLoadInit();
    } else {
        window.addEventListener('DOMContentLoaded', runPostLoadInit);
    }
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
                style="width:100%; background: linear-gradient(135deg,#1f7a52,#2bbe7e); border: 1px solid #8af0c0;
                color: #06160f; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
                padding: 11px 20px; border-radius: 8px; cursor: pointer; margin-bottom: 10px;
                box-shadow: 0 4px 14px rgba(43,190,126,0.45);">
                ✨ Bonus gratuit → ×2 Or (+${fmt(gold)})
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

// §ÉCO v2 — JEU OFFLINE : plus aucune publicité (AdMob retiré).
// Les anciens "bonus pub" deviennent des bonus GRATUITS, simplement plafonnés par jour
// pour rester equilibres. On conserve les caps comme limiteur de rythme.
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

// Point d'entrée unique : accorde directement la récompense (gratuite, plafonnée), sans pub.
function watchAdForReward(placement, onRewarded, onFallback) {
    _resetAdCapsIfNeeded();
    if (!adCapAvailable(placement)) {
        showNotif('⏳ Limite quotidienne atteinte pour ce bonus.');
        return;
    }
    G.adCaps[placement] = (G.adCaps[placement] || 0) + 1;
    (markSaveDirty(), saveGame());
    onRewarded(true); // récompense complète, gratuite (jeu offline)
}

// =============================================================
// SYSTÈME DE STAGES (Phase 2) — carte → zones → 5 stages → combat
// Équivalence d'équilibrage : stage global g = area×5 + stage + 1 = zone actuelle.
// =============================================================
const STAGES_PER_AREA = 5;

// Tracé commun (x/y en % de l'image de carte) — parcours en zigzag de bas en haut.
// Réutilisé par toutes les maps tant qu'un visuel dédié n'est pas fourni.
const _MAP_PATH = [
    { x: 24, y: 88 }, { x: 56, y: 75 }, { x: 66, y: 49 }, { x: 24, y: 47 }, { x: 76, y: 26 },
];
const _MAP_TEASERS = [{ name: '???', x: 24, y: 23 }, { name: '???', x: 52, y: 7 }];

// Construit les 5 zones d'une map depuis (noms, éléments) + le tracé commun.
function _mkAreas(specs) {
    return specs.map((s, i) => ({ id: i, name: s[0], elem: s[1], x: _MAP_PATH[i].x, y: _MAP_PATH[i].y }));
}

// ─────────────────────────────────────────────────────────────────────────
// 6 MAPS — alignées sur src/data/bestiary.js (MAP_THEMES) :
//   tier = palier d'étoiles recommandé des héros.
//   Map 1 & 2 → 3★ | Map 3 → 4★ | Map 4 → 5★ | Map 5 → 6★ | Map 6 → 7★
//   img : seul map 1 a un visuel dédié ; les autres le réutilisent (à remplacer
//   par les visuels définitifs une fois disponibles).
// ─────────────────────────────────────────────────────────────────────────
const _MAP1_IMG = 'assets/map/map%201%20.png';
const MAP_DEFS = [
    {
        id: 0, name: 'Mistral', tier: 3, img: _MAP1_IMG,
        lore: 'Les marches ardentes où débutent tous les invocateurs.',
        areas: _mkAreas([
            ['Gorges Ardentes', 'Feu'], ['Temple des Braises', 'Feu'],
            ['Lac Luminescent', 'Eau'], ['Forêt aux Champignons', 'Eau'],
            ['Temple de la Jungle', 'Terre'],
        ]),
        teasers: _MAP_TEASERS,
    },
    {
        id: 1, name: 'Sylvania', tier: 3, img: _MAP1_IMG,
        lore: 'Forêts profondes et marécages électriques aux créatures plus tenaces.',
        areas: _mkAreas([
            ['Bois Murmurants', 'Terre'], ['Tourbière Putride', 'Terre'],
            ['Cascades d’Émeraude', 'Eau'], ['Clairière Foudroyée', 'Foudre'],
            ['Ravin de Braise', 'Feu'],
        ]),
        teasers: _MAP_TEASERS,
    },
    {
        id: 2, name: 'Glaciarem', tier: 4, img: _MAP1_IMG,
        lore: 'Cimes gelées et orages perpétuels : le premier vrai test de force.',
        areas: _mkAreas([
            ['Banquise Brisée', 'Eau'], ['Fjord Silencieux', 'Eau'],
            ['Pic des Tempêtes', 'Foudre'], ['Toundra Pétrifiée', 'Terre'],
            ['Sanctuaire de Givre', 'Lumière'],
        ]),
        teasers: _MAP_TEASERS,
    },
    {
        id: 3, name: 'Vulcanor', tier: 5, img: _MAP1_IMG,
        lore: 'Forges infernales et abîmes obscurs sous une terre en fusion.',
        areas: _mkAreas([
            ['Caldeira Rugissante', 'Feu'], ['Mines de Foudre', 'Foudre'],
            ['Rivière de Magma', 'Feu'], ['Galeries Effondrées', 'Terre'],
            ['Antre Obscur', 'Ténèbres'],
        ]),
        teasers: _MAP_TEASERS,
    },
    {
        id: 4, name: 'Aetheria', tier: 6, img: _MAP1_IMG,
        lore: 'Le royaume céleste corrompu : gardiens divins déchus et tempêtes sacrées.',
        areas: _mkAreas([
            ['Parvis Radieux', 'Lumière'], ['Nefs Suspendues', 'Lumière'],
            ['Vortex Céleste', 'Foudre'], ['Bassins Astraux', 'Eau'],
            ['Crypte des Anges', 'Ténèbres'],
        ]),
        teasers: _MAP_TEASERS,
    },
    {
        id: 5, name: 'Abyssia', tier: 7, img: _MAP1_IMG,
        lore: 'Le Néant primordial. Au-delà : seuls les avatars des dieux subsistent.',
        areas: _mkAreas([
            ['Seuil des Ombres', 'Ténèbres'], ['Abîme Sans Fond', 'Ténèbres'],
            ['Cœur Incandescent', 'Feu'], ['Faille de Lumière', 'Lumière'],
            ['Trône Primordial', 'Ténèbres'],
        ]),
        teasers: [],
    },
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
    const g = stageGlobal(a, s);
    const isBossStage = (s === STAGES_PER_AREA - 1);
    // Nom du monstre : nom du boss sur le dernier stage, sinon nom de la zone
    let monsterName = area ? (area.name + '').toUpperCase() : 'COMBAT';
    if (isBossStage) {
        try { const bn = (typeof getBossNameForZone === 'function') && getBossNameForZone(g); if (bn) monsterName = (bn + '').toUpperCase(); } catch (e) {}
    }
    const reward = Math.round(500 * g) * (isBossStage ? 2 : 1);
    closeStageResult();
    closeAreaPanel();
    closeQuestMap();
    // ── Le combat se déroule désormais sur la page tour par tour (plus de cliqueur) ──
    openTurnCombat({ zone: g, monsterName: monsterName, reward: reward, stage: { a: a, s: s, isBoss: isBossStage } });
}

// Crédite la complétion d'un stage gagné en tour par tour (sans toucher à l'UI d'arène).
function _creditStageClear(stage) {
    if (!stage || stage.a == null || stage.s == null) return;
    if (typeof getStageInfo !== 'function') return;
    const a = stage.a, s = stage.s;
    const isBossStage = (s === STAGES_PER_AREA - 1);
    const prev = getStageInfo(a, s);
    const firstClear = (prev.clears || 0) === 0;
    const stars = 3; // victoire tour par tour → 3 étoiles (à affiner plus tard)
    G.stageProgress[stageKey(a, s)] = {
        stars: Math.max(prev.stars || 0, stars),
        clears: (prev.clears || 0) + 1,
        bestTime: prev.bestTime || 0
    };
    if (firstClear) { G.gems = (G.gems || 0) + _firstClearGems(isBossStage); } // §ÉCO
    const g = stageGlobal(a, s);
    const exp = 8 + 2 * g;
    G.summonerExp = (G.summonerExp || 0) + exp;
    while (typeof summonerExpMax === 'function' && G.summonerExp >= summonerExpMax(G.summonerLevel || 1)) {
        G.summonerExp -= summonerExpMax(G.summonerLevel || 1);
        G.summonerLevel = (G.summonerLevel || 1) + 1;
    }
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
        firstGems = _firstClearGems(isBossStage); // §ÉCO
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
    // Zone de test → combat tour par tour rapide (thème de la zone courante), sans progression de stage
    openTurnCombat();
}
