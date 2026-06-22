// =============================================================
// INITIALIZATIONS, SAVING & UTILITIES
// =============================================================
function getHeroImage(id, stars, context = 'full') {
    const mapping = {
        // ── 6 héros avec NOUVELLE illustration (format NOM-3.png) ──
        // Pas de dossier "Unité" dédié : le contexte 'unit' retombe sur 'squad' (voir plus bas).
        ignis: {
            squad: 'Squad img/IGNIS-3.png',
            full: 'full img/IGNIS-3.png'
        },
        selena: {
            squad: 'Squad img/SELENA-3.png',
            full: 'full img/SELENA-3.png'
        },
        sera: {
            squad: 'Squad img/SERA-3.png',
            full: 'full img/SERA-3.png'
        },
        atro: {
            squad: 'Squad img/ATRO-3.png',
            full: 'full img/ATRO-3.png'
        },
        karl: {
            squad: 'Squad img/KARL-3.png',
            full: 'full img/KARL-3.png'
        },
        magress: {
            // Le fichier est orthographié MAGRUSS (≠ id 'magress')
            squad: 'Squad img/MAGRUSS-3.png',
            full: 'full img/MAGRUSS-3.png'
        },
        // ── 6 héros legacy : anciennes images conservées dans les dossiers bc/ ──
        vargas: {
            unit: 'bc/Unité/vargas-trois-etoile (1).png',
            squad: 'Squad img/bc/vargas-trois-etoile (1).png',
            full: 'full img/bc/Vargas-trois-etoile.png'
        },
        margonia: {
            unit: 'bc/Unité/Margonia-trois-etoile (1).png',
            squad: 'Squad img/bc/margonia-trois-etoile.png',
            full: 'full img/bc/Margonia-trois-etoile.png'
        },
        elimo: {
            unit: 'bc/Unité/Margonia-trois-etoile (1).png',
            squad: 'Squad img/bc/margonia-trois-etoile.png',
            full: 'full img/bc/Margonia-trois-etoile.png'
        },
        lance: {
            unit: 'bc/Unité/Lance-trois-etoile (1).png',
            squad: 'Squad img/bc/Lance-trois-etoile.png',
            full: 'full img/bc/Lance_trois_etoile.png'
        },
        zeln: {
            unit: 'bc/Unité/Zeln_trois_etoile (1).png',
            squad: 'Squad img/bc/Zeln_trois_etoile.png',
            full: 'full img/bc/Zeln_trois_etoile.png'
        },
        eze: {
            unit: 'bc/Unité/Eze-trois-etoile.png',
            squad: 'Squad img/bc/Eza-trois-etoile.png',
            full: 'full img/bc/Eza_trois_etoile.png'
        },
        kikuri: {
            unit: 'bc/Unité/Kikuri-trois-etoile (1).png',
            squad: 'Squad img/bc/Kikuri-trois-etoile.png',
            full: 'full img/bc/Kikuri-trois-etoile.png'
        }
    };
    
    const hero = mapping[id];
    if (hero) {
        // Contexte demandé → sinon unit → sinon squad → sinon first available
        const path = hero[context] || hero.squad || hero.unit || hero.full;
        if (path) {
            // Encode chaque segment du chemin pour gérer espaces et accents (é, etc.)
            const normalized = path.normalize('NFD');
            const encoded = normalized.split('/').map(s => encodeURIComponent(s)).join('/');
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
    window.G = G; // garder window.G synchro après réassignation (SquadStore lit window.G)
    // §1.2 — Sécuriser partyHp nul ou absent dans vieilles sauvegardes
    if (!G.partyHp || G.partyHp <= 0) G.partyHp = G.partyMaxHp || 100;
    // Force squad size to always be 5 (fixed)
    G.maxSquadSize = 5;
    if (G.squad.length > 5) G.squad = G.squad.slice(0, 5);
    while (G.squad.length < 5) G.squad.push(null);
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
