// §1.7 core/save.js — DEFAULT_STATE, deepMerge, migrateSave, helpers IndexedDB
// Morceaux PURS/PORTABLES extraits verbatim de index.html (§1.6/§3.3).
// ⚠️ loadGame/saveGame/_applyLoadedData restent dans le monolithe (couplés à G global)
//    et seront câblés via store.js à l'étape navigateur.

export const DEFAULT_STATE = {
    gold: 0, gems: 15, honorPoints: 0, prestigeCrystals: 0, tapDamageLevel: 0, zone: 1, monsterIndex: 0, isBoss: false,
    monsterHp: 10, monsterMaxHp: 10, bossTimer: 30, heroes: {}, bbCooldowns: {},
    playerSkillsCd: { strike: 0, wealth: 0, frenzy: 0 },
    playerSkillsActive: { wealth: 0, frenzy: 0 },
    totalClicks: 0, totalKills: 0, bossKills: 0, totalGold: 0, totalPrestiges: 0, maxZone: 1, maxCombo: 0,
    achievementsClaimed: [], lastSave: 0,
    spheres: {},

    // Squad System
    squad: ['ignis', null, null, null],
    leaderId: 'ignis',
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
        questDouble: 0      // ×2 récompense quête        cap 1/quête (géré par idx)
    },
    goldBuffExpiry: 0,      // timestamp ms fin du buff ×2 Or
    adOfflinePending: 0     // montant offline en attente doublement
};

export function deepMerge(target, source) {
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

export const SAVE_VERSION = 5;

export function migrateSave(s) {
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

export const _IDB_NAME = 'bf_clicker', _IDB_STORE = 'save', _IDB_KEY = 'v4';
export function _idbOpen() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(_IDB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(_IDB_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}
export function _idbGet(db) {
    return new Promise((res, rej) => {
        const tx = db.transaction(_IDB_STORE, 'readonly');
        const req = tx.objectStore(_IDB_STORE).get(_IDB_KEY);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}
export function _idbPut(db, val) {
    return new Promise((res, rej) => {
        const tx = db.transaction(_IDB_STORE, 'readwrite');
        const req = tx.objectStore(_IDB_STORE).put(val, _IDB_KEY);
        req.onsuccess = () => res();
        req.onerror   = e => rej(e.target.error);
    });
}
