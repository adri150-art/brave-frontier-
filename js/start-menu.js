(function initStartMenu() {
    // Start menu simplified: logo and background only, click anywhere to start
    const saveRaw = localStorage.getItem('bf_clicker_v4');
    window._smHadSave = !!saveRaw;
})();

function startMenuContinue() {
    const menu = document.getElementById('start-menu');
    if (menu) {
        menu.classList.add('hide-out');
        setTimeout(function() { menu.style.display = 'none'; }, 720);
    }
}

function startMenuNewGame() {}
function startMenuOptions() {}

// =============================================================
// §1.4 — OBJECT POOLS pour les nombres de dégâts (zéro GC)
// =============================================================
function _createPool(className, parentId, size) {
    const parent = document.getElementById(parentId) || document.body;
    const items = [];
    for (let i = 0; i < size; i++) {
        const el = document.createElement('div');
        el.className = className;
        el.style.display = 'none';
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '200';
        parent.appendChild(el);
        items.push(el);
    }
    let idx = 0;
    return {
        acquire() {
            const el = items[idx % items.length];
            idx++;
            // Annuler toute animation en cours
            el.getAnimations().forEach(a => a.cancel());
            el.style.display = 'block';
            return el;
        },
        release(el) { el.style.display = 'none'; }
    };
}
// Initialisés après le DOM (masterFrame démarre après DOMContentLoaded)
let _dmgPool, _bloodyPool;
function _initPools() {
    _dmgPool    = _createPool('dmg-text',        'monster-zone', 20);
    _bloodyPool = _createPool('bloody-dmg-text', 'game-window',  10);
}

// =============================================================
// §1.4 — Flag panelsDirty pour le rendu throttlé des panneaux
// =============================================================
let _panelsDirty = false, _panelsLastRender = 0;

function _renderDirtyPanels(now) {
    if (!_panelsDirty) return;
    if (now - _panelsLastRender < 250) return;   // ≤ 4×/s
    _panelsDirty = false;
    _panelsLastRender = now;

    // Panneaux critiques : toujours
    renderFooterBB();

    // Panneaux semi-critiques : seulement si leur onglet est actif
    const questPanel = document.getElementById('daily-quests-container');
    if (questPanel && questPanel.closest('.tab-content.active')) renderDailyQuests();

    // Panneaux non-critiques : requestIdleCallback (§1.4)
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => { renderAchievements(); renderMaterialsPanel(); }, {timeout: 500});
    } else {
        setTimeout(() => { renderAchievements(); renderMaterialsPanel(); }, 0);
    }
}

// =============================================================
// BOUCLE MAÎTRE — fixed-timestep requestAnimationFrame (§1.2)
// Une seule horloge : simulate() pour la logique, updateP() pour le rendu.
// =============================================================

// ═══════════════════════════════════════════════════════════════════════════════
// §3.4 — MODE PERFORMANCE : auto-détection FPS + toggle manuel
// ═══════════════════════════════════════════════════════════════════════════════

let _perfMode = false; // false = Haute qualité, true = Basse qualité (perf)
let _perfAutoDetected = false;

// Toggle manuel (appelé depuis Paramètres)
function setPerfMode(low) {
    _perfMode = low;
    document.body.classList.toggle('perf-low', low);
    if (!low && _perfAutoDetected) _perfAutoDetected = false;
    try { localStorage.setItem('bf_perf_mode', low ? '1' : '0'); } catch(e){}
    // Redessiner le bouton pour refléter le nouvel état
    renderPerfToggle();
}

// Applique la préférence sauvegardée au boot
(function() {
    try {
        const saved = localStorage.getItem('bf_perf_mode');
        if (saved === '1') { _perfMode = true; document.body.classList.add('perf-low'); }
    } catch(e) {}
})();

// Auto-détection : mesure le frame budget sur 60 frames après le boot
// Si la médiane des deltas > 33ms (< 30fps) → suggère le mode Perf
let _fpsProbe = { frames: [], done: false, offered: false };
function _probeFrameBudget(now) {
    if (_fpsProbe.done || _perfMode) return;
    if (_fpsProbe.lastT) _fpsProbe.frames.push(now - _fpsProbe.lastT);
    _fpsProbe.lastT = now;
    if (_fpsProbe.frames.length >= 60) {
        _fpsProbe.done = true;
        const sorted = [..._fpsProbe.frames].sort((a,b)=>a-b);
        const median = sorted[Math.floor(sorted.length / 2)];
        if (median > 33 && !_fpsProbe.offered) {
            _fpsProbe.offered = true;
            _perfAutoDetected = true;
            // Propose automatiquement après 3s de jeu
            setTimeout(() => {
                showNotif('⚡ Performances faibles détectées — Mode Performance activé automatiquement');
                setPerfMode(true);
            }, 3000);
        }
    }
}

// Patch screenFlash pour le perf mode
const _origScreenFlash = typeof screenFlash !== 'undefined' ? screenFlash : null;
function screenFlash(col) {
    if (_perfMode) return; // §3.4 — coupé en mode perf
    const f = document.getElementById('screen-flash');
    if (!f) return;
    f.style.background = col; f.style.opacity = '1';
    setTimeout(() => f.style.opacity = '0', 120);
}

// Patch spawnParticles pour le perf mode
const _origSpawnParticles = typeof window._spawnParticlesOrig === 'undefined'
    ? (window._spawnParticlesOrig = null, null) : window._spawnParticlesOrig;

function spawnParticlesFiltered(x, y, opts = {}) {
    if (_perfMode) return; // §3.4 — particules coupées en mode perf
    // appel de la vraie fonction — voir updateP
    const c=opts.count||10, s=opts.speed||250, col=opts.colors||['#fff'], sz=opts.size||3, l=opts.life||0.5, g=opts.gravity!==undefined?opts.gravity:250;
    for(let i=0;i<c;i++){
        const a=Math.random()*Math.PI*2, sp=(Math.random()*0.7+0.3)*s;
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-s*0.3,life:l,maxLife:l,size:sz*(0.6+Math.random()*0.8),color:col[Math.floor(Math.random()*col.length)],gravity:g});
    }
}

// Rendu du toggle Performance dans le panneau Paramètres
function renderPerfToggle() {
    const container = document.getElementById('perf-toggle-container');
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;">
            <div>
                <div style="font-size:11px;font-weight:700;color:#c8d8f0">⚡ Mode Performance</div>
                <div style="font-size: 11px;color:#6a7a9a">Réduit particules, effets et filtres CSS</div>
            </div>
            <button onclick="setPerfMode(${!_perfMode})" style="
                min-width:48px;min-height:28px;border-radius:14px;border:none;cursor:pointer;
                font-size:10px;font-weight:700;padding:4px 10px;
                background:${_perfMode ? '#2ecc71' : '#2a3a5a'};color:${_perfMode ? '#fff' : '#6a7a9a'};
                transition:background 0.2s;">
                ${_perfMode ? 'ON' : 'OFF'}
            </button>
        </div>`;
}

const GAME_TICK = 1 / 30;
let _gameAcc = 0, _gameLast = performance.now();

let _masterStarted = false;
function masterFrame(now) {
    _probeFrameBudget(now); // §3.4 — sonde FPS les 60 premières frames
    if (!_masterStarted) {
        _masterStarted = true;
        _initPools();   // §1.4 — pools initialisés au premier frame (DOM prêt)
    }
    let dt = (now - _gameLast) / 1000;
    _gameLast = now;
    if (dt > 0.25) dt = 0.25;  // anti "spirale de la mort" après une veille
    _gameAcc += dt;
    while (_gameAcc >= GAME_TICK) {
        simulate(GAME_TICK);
        _gameAcc -= GAME_TICK;
    }
    updateP(now);               // particules canvas
    _renderDirtyPanels(now);    // §1.4 — panneaux throttlés, visible-only
    requestAnimationFrame(masterFrame);
}
requestAnimationFrame(masterFrame);

