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

// ── Libellés du menu Home dérivés du nom de fichier de chaque image ──
// Le texte affiché correspond EXACTEMENT au nom du fichier image (sans extension),
// proprement formaté (espaces + capitale par mot).
function _formatHomeLabel(src) {
    let base = (src || '').split('/').pop();          // garde le nom du fichier
    try { base = decodeURIComponent(base); } catch (e) {}
    base = base.replace(/\.[^.]+$/, '');              // retire l'extension
    base = base.replace(/[_-]+/g, ' ').trim();        // _ et - -> espaces
    return base.split(/\s+/).map(w =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
}
// Applique l'ambiance élémentaire (halo + particules) et génère les particules une fois.
const HOME_FX_ELEMENTS = ['fire', 'water', 'earth', 'thunder', 'light', 'dark'];
function applyHomeLeaderFx(element) {
    const screen = document.getElementById('new-home-screen');
    const fx = document.getElementById('home-element-fx');
    if (!screen || !fx) return;
    HOME_FX_ELEMENTS.forEach(e => screen.classList.remove('elem-' + e));
    screen.classList.add('elem-' + (HOME_FX_ELEMENTS.includes(element) ? element : 'fire'));
    if (!fx.childElementCount) {
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('span');
            p.className = 'home-fx-p';
            const size = (3 + Math.random() * 5).toFixed(1);
            p.style.left = (Math.random() * 100).toFixed(1) + '%';
            p.style.width = p.style.height = size + 'px';
            p.style.animationDuration = (6 + Math.random() * 7).toFixed(1) + 's';
            p.style.animationDelay = (-Math.random() * 10).toFixed(1) + 's';
            fx.appendChild(p);
        }
    }
}

function initHomeMenuLabels() {
    document.querySelectorAll('#new-home-screen [data-home-label]').forEach(btn => {
        const img = btn.querySelector('img');
        const lbl = btn.querySelector('.home-btn-label');
        if (!img || !lbl) return;
        // Libellé explicite via l'attribut (ex. data-home-label="Village")
        // sinon dérivé du nom de fichier de l'image.
        const override = (btn.getAttribute('data-home-label') || '').trim();
        lbl.textContent = override || _formatHomeLabel(img.getAttribute('src'));
    });
}

// Met à jour le fond du Home (illustration du leader) + l'ambiance élémentaire.
// Appelée à l'ouverture du Hub ET à chaque changement de leader/squad, pour
// que le Home reflète toujours le vrai leader (et non plus Ignis par défaut).
function refreshHomeLeaderVisual() {
    const leaderId = (G.squad && G.squad[0]) || G.leaderId || null;
    const imgEl = document.getElementById('home-leader-bg');
    if (imgEl) {
        const FALLBACK_BG = 'ecran titre/fond.png';
        if (leaderId) {
            const hData = (G.heroes && G.heroes[leaderId]) || { stars: 3 };
            imgEl.src = getHeroImage(leaderId, hData.stars, 'full');
            imgEl.onerror = () => { imgEl.src = FALLBACK_BG; imgEl.onerror = null; };
        } else {
            imgEl.src = FALLBACK_BG;
        }
    }
    let _leaderElem = 'fire';
    if (leaderId && typeof HERO_DEFS !== 'undefined') {
        const lDef = HERO_DEFS.find(d => d.id === leaderId);
        if (lDef && lDef.element) _leaderElem = lDef.element;
    }
    applyHomeLeaderFx(_leaderElem);
}
window.refreshHomeLeaderVisual = refreshHomeLeaderVisual;

// Grade de la squad (1..10) selon le total d'étoiles (max 6 héros × 7★ = 42).
// Seuils = étoiles minimales requises pour chaque grade ; G10 = squad quasi-parfaite.
const HOME_GRADE_MIN = [0, 5, 10, 14, 18, 22, 26, 30, 34, 39]; // index 0 → grade 1
function homeSquadGrade(totalStars) {
    let g = 1;
    for (let i = 0; i < HOME_GRADE_MIN.length; i++) {
        if (totalStars >= HOME_GRADE_MIN[i]) g = i + 1;
    }
    return g;
}
window.homeSquadGrade = homeSquadGrade;

// Total d'étoiles de la squad (max 6 héros × 7★ = 42).
// Compte les membres de la squad + le leader (G.leaderId) s'il n'y est pas déjà,
// pour refléter le héros réellement affiché même quand la squad n'est pas remplie.
function homeSquadTotalStars() {
    let total = 0;
    try {
        const G2 = window.G || (typeof G !== 'undefined' ? G : null);
        if (!G2 || !G2.heroes) return 0;
        const ids = new Set((G2.squad || []).filter(Boolean));
        if (G2.leaderId) ids.add(G2.leaderId);
        ids.forEach(id => {
            const h = G2.heroes[id];
            if (h && h.stars) total += h.stars;
        });
    } catch (e) {}
    return total;
}

// Met à jour le header du Home (nom + niveau + or + emblème de grade).
// Découplé de renderHubCurrencies pour rester fiable, et rappelé en boucle
// tant que le Home est affiché (l'or/les étoiles évoluent en jeu).
function refreshHomeHeader() {
    const screen = document.getElementById('new-home-screen');
    if (!screen) return;
    const G2 = window.G || (typeof G !== 'undefined' ? G : {});
    const _fmt = (typeof fmt === 'function') ? fmt : (v => String(v));

    const nameEl  = document.getElementById('home-player-name');
    const lvEl    = document.getElementById('home-player-lv');
    const goldEl  = document.getElementById('home-gold-val');
    const starsEl = document.getElementById('home-squad-stars');
    const gradeEl = document.getElementById('home-grade-img');

    if (nameEl) nameEl.textContent = G2.playerName || 'Invocateur';
    if (lvEl)   lvEl.textContent   = 'Niv. ' + (G2.summonerLevel || 1);
    if (goldEl) goldEl.textContent = _fmt(G2.gold || 0);

    if (starsEl || gradeEl) {
        const totalStars = homeSquadTotalStars();
        const grade = homeSquadGrade(totalStars);
        if (starsEl) starsEl.textContent = totalStars + ' ★';
        if (gradeEl) {
            const want = 'assets/img home/icons/G' + grade + '.png';
            if (gradeEl.getAttribute('src') !== want) gradeEl.setAttribute('src', want);
            const pill = gradeEl.closest('.home-stat');
            if (pill) pill.title = 'Grade ' + grade + '/10 — ' + totalStars + ' étoiles de squad';
        }
    }
}
window.refreshHomeHeader = refreshHomeHeader;

// Rafraîchissement périodique du header tant que le Home est visible (1 Hz).
setInterval(() => {
    const hub = document.getElementById('hub-menu');
    if (!hub || hub.classList.contains('hidden') || hub.classList.contains('panel-open')) return;
    try { refreshHomeHeader(); } catch (e) {}
}, 1000);

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

    // -- NOUVEAU HOME UI --
    // Fond du Hero + ambiance élémentaire = leader courant de la squad
    refreshHomeLeaderVisual();
    // Libellés des boutons = nom de fichier de l'image correspondante
    initHomeMenuLabels();

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
    host.setAttribute('data-section', tabName); // permet de cibler le style par section (ex. Unités)
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

// Construit l'équipe du combat tour par tour À PARTIR DE LA SQUAD du joueur.
// Les stats restent dans la fourchette équilibrée du prototype (l'idle a de trop gros nombres).
const TURNCOMBAT_ROLE_DEF = { mage: 100, support: 140, tank: 170 };
function _buildTurnHeroes() {
    if (!G.squad || typeof HERO_DEFS === 'undefined') return null;
    const list = [];
    G.squad.filter(Boolean).forEach(id => {
        const d = HERO_DEFS.find(x => x.id === id);
        if (!d) return;
        const mult = (d.bb && d.bb.multiplier) || 100;
        const atk  = Math.max(240, Math.min(360, Math.round(250 + mult * 0.5)));
        const def  = TURNCOMBAT_ROLE_DEF[d.role] || 110;
        let img = null;
        try { if (typeof getHeroImage === 'function') img = getHeroImage(d.id, 3, 'squad'); } catch (e) {}
        list.push({ id: d.id, name: d.name, element: d.element || 'fire', atk: atk, def: def, img: img });
    });
    return list.length ? list : null;
}

// Ouvre la page de combat tour par tour.
// opts (facultatif) : { zone, element, monsterName, reward, bg, stage:{a,s,isBoss} }
// Sans opts : thème de la zone courante (combat rapide).
function openTurnCombat(opts) {
    opts = opts || {};
    try {
        const zone  = opts.zone || G.zone || 1;
        const biome = (typeof BIOME_DEFS !== 'undefined') ? BIOME_DEFS.find(b => zone >= b.zoneStart && zone <= b.zoneEnd) : null;
        const elem  = opts.element || (biome && TURNCOMBAT_ELEM_MAP[biome.elem]) || 'fire';
        // Récompense modeste qui suit la progression (sans déséquilibrer le jeu idle)
        const reward = (opts.reward != null) ? opts.reward : Math.round(500 * zone);
        const heroes = _buildTurnHeroes();
        const ctx = {
            monsterName: opts.monsterName || (biome ? (biome.bossName || (biome.name + '').toUpperCase()) : 'BOSS OGRE'),
            element: elem,
            zone: zone,
            bg: opts.bg || TURNCOMBAT_BG[elem] || null,
            reward: reward,
            stage: opts.stage || null,   // {a,s,isBoss} → créditée au retour si victoire
            heroes: heroes,              // équipe = squad du joueur (null → équipe par défaut)
            teamHp: heroes ? Math.max(2500, 1250 * heroes.length) : null,
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
        }
        // Si le combat venait d'un stage : marquer le stage terminé (étoiles, gemmes, EXP)
        if (r.stage && typeof _creditStageClear === 'function') _creditStageClear(r.stage);
        if (typeof markSaveDirty === 'function') markSaveDirty();
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

    // -- NOUVEAU HOME UI --
    const homeGold = document.getElementById('home-gold-display');
    const homeExpText = document.getElementById('home-exp-text-display');
    const homeExpFill = document.getElementById('home-exp-fill-new');
    if (homeGold) homeGold.textContent = fmt(G.gold || 0) + ' G';
    if (homeExpText) homeExpText.textContent = `EXP: ${fmt(G.exp || 0)}/${fmt(G.maxExp || 10)}`;
    if (homeExpFill) homeExpFill.style.width = Math.min(100, ((G.exp || 0) / (G.maxExp || 10)) * 100) + '%';

    // -- HOME HEADER premium : nom + niveau + or + grade de la squad --
    try { refreshHomeHeader(); } catch (e) {}

    // §ÉCO — Points de Maître + indicateur de fragments
    const pmEl   = document.getElementById('hub-pm-val');
    const fragEl = document.getElementById('hub-frag-val');
    if (pmEl) pmEl.textContent = fmt(G.masterPoints || 0);
    if (fragEl) {
        const fr  = G.heroFragments || {};
        const cap = (typeof FRAGMENTS_PER_HERO !== 'undefined') ? FRAGMENTS_PER_HERO : 50;
        let bestId = null, bestN = 0;
        for (const id in fr) { if (fr[id] > bestN) { bestN = fr[id]; bestId = id; } }
        fragEl.textContent = bestN > 0 ? `${bestN}/${cap}` : '0';
        const slot = document.getElementById('hub-frag-slot');
        if (slot) {
            const def = (bestId && typeof HERO_DEFS !== 'undefined') ? HERO_DEFS.find(d => d.id === bestId) : null;
            slot.title = def ? `Fragments : ${def.name} (${bestN}/${cap})` : 'Fragments de héros';
        }
    }
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
            ? '⏳ Recharge épuisée pour aujourd\'hui'
            : `✨ Recharger tous les gisements — gratuit (${left}/j)`;
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
        showNotif('✨ Tous les gisements rechargés — 5/5 partout !');
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

// §ÉCO v2 — Gacha retiré : l'invocation gratuite redirige vers l'Atelier (création déterministe).
function adFreeSummon() {
    showNotif("✨ Crée tes héros à l'Atelier avec tes matériaux !");
    if (typeof openMasterShop === 'function') openMasterShop();
    return;
    // (ancien code conservé mort, neutralisé)
    /* eslint-disable */
    watchAdForReward('freeSummon',
        (watched) => {
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
    if (localStorage.getItem(key)) { showNotif('✓ Déjà doublé pour cette quête.'); return; }
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
                Ressuscite ton équipe et continue le combat (bonus gratuit, limité par jour).
            </div>
            <button onclick="_bossReviveAccept()" style="width:100%;background:linear-gradient(135deg,#1f7a52,#2bbe7e);
                border:1px solid #8af0c0;color:#06160f;font-family:'Outfit',sans-serif;font-size:14px;
                font-weight:700;padding:12px;border-radius:8px;cursor:pointer;margin-bottom:10px;
                box-shadow:0 4px 14px rgba(43,190,126,0.45);">
                ✨ Ressusciter l'équipe (gratuit)
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

// ── Taux Gacha (affichage transparent) — §ÉCO : dérivé de RARE_RATES / RARE_PITY ──
const _RR = (typeof RARE_RATES !== 'undefined') ? RARE_RATES : { S:0.05, A:0.20, B:0.35, base:0.40 };
const _RP = (typeof RARE_PITY !== 'undefined') ? RARE_PITY : 40;
const _pctR = x => Math.round(x * 100) + ' %';
const GACHA_RATES = [
    { label: 'Héros S (6★-ready)', rate: _pctR(_RR.S), pity: `Garanti en ${_RP} invocations` },
    { label: 'Héros A (5★)', rate: _pctR(_RR.A), pity: 'Garanti en 10 invocations' },
    { label: 'Sphère', rate: _pctR(_RR.B), pity: '—' },
    { label: 'Matériau d\'évolution', rate: _pctR(_RR.base), pity: '—' },
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

// §ÉCO v2 — JEU OFFLINE : aucun achat in-app. buyIAP est neutralisé.
function buyIAP(productId) {
    showNotif("🪙 Jeu hors-ligne : pas d'achat. Tout se gagne en jouant !");
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
// §ÉCO v2 — JEU OFFLINE : plus aucun achat. La "boutique" devient un panneau d'information
// qui renvoie vers l'Atelier d'Invocation (création or + matériaux) et le Comptoir (échange PH).
function renderShopPanel() {
    const el = document.getElementById('panel-shop');
    if (!el) return;
    el.innerHTML = `
        <div class="shop-section">
            <div class="shop-section-title">🪙 Jeu hors-ligne — 100 % gagnable</div>
            <div class="shop-card">
                <div class="shop-card-name">Aucun achat, aucune publicité</div>
                <div class="shop-card-desc">Tous les héros et toutes les évolutions s'obtiennent en jouant :
                    farme les matériaux dans les niveaux, puis crée tes héros à l'Atelier.</div>
            </div>
        </div>
        <div class="shop-section">
            <div class="shop-section-title">🛠 Obtenir des héros</div>
            <div class="shop-card">
                <div class="shop-card-name">Atelier d'Invocation</div>
                <div class="shop-card-desc">Réunis l'or et les matériaux de l'élément d'un héros pour l'invoquer (déterministe, sans hasard).</div>
                <button class="shop-btn buy" onclick="openMasterShop()">Ouvrir l'Atelier</button>
            </div>
            <div class="shop-card">
                <div class="shop-card-name">Comptoir d'échange</div>
                <div class="shop-card-desc">Convertis tes Points d'Honneur en matériaux quand il te manque une pièce (200 PH → 1 Cristal du biome).</div>
                <button class="shop-btn buy" onclick="summonHonor()">Échanger 200 PH</button>
            </div>
        </div>`;
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
        window.G = G; // garder window.G synchro après réassignation
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

// Fonction de triche/développement pour débloquer tout le jeu facilement
function devUnlockEverything() {
    if (!confirm("Voulez-vous débloquer tout le contenu du jeu (tous les héros niveau 100, or/gemmes infinis, matériaux...) pour tester ?")) {
        return;
    }
    
    // 1. Débloquer tous les héros au max
    if (typeof HERO_DEFS !== 'undefined') {
        HERO_DEFS.forEach(def => {
            G.heroes[def.id] = {
                level: 100,
                stars: 7,
                duplicates: 99,
                limitBreak: 99,
                type: 'Anima',
                equippedSphere: null,
                _id: def.id
            };
        });
        
        // Remplir l'équipe active
        const heroIds = HERO_DEFS.map(d => d.id);
        G.squad = heroIds.slice(0, 5);
        while (G.squad.length < 5) G.squad.push(null);
        G.leaderId = heroIds[0] || null;
    }

    // 2. Ressources infinies
    if (typeof D !== 'undefined') {
        G.gold = D("1e30");
        G.totalGold = D("1e30");
    } else {
        G.gold = 1e30;
        G.totalGold = 1e30;
    }
    G.gems = 9999999;
    G.honorPoints = 9999999;
    G.prestigeCrystals = 9999999;
    G.masterPoints = 9999999;
    G.divineEssence = 9999999;

    // 3. Matériaux de craft max
    if (typeof MATERIAL_DEFS !== 'undefined') {
        Object.keys(MATERIAL_DEFS).forEach(matId => {
            G.materials[matId] = 9999;
        });
    }

    // 4. Progression max
    G.maxZone = 60;
    G.zone = 60;

    // 5. Sauvegarder et recharger
    if (typeof markSaveDirty === 'function') markSaveDirty();
    if (typeof saveGame === 'function') saveGame();
    
    if (typeof showNotif === 'function') {
        showNotif('🔓 Tout est débloqué ! Rechargement...');
    }
    setTimeout(() => location.reload(), 1000);
}

