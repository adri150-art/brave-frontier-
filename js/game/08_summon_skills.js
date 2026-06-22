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

// §ÉCO v2 — Gacha retiré. summonRare redirige vers l'Atelier d'Invocation (création déterministe).
function summonRare() {
    showNotif("✨ Plus de tirage aléatoire : crée tes héros à l'Atelier (or + matériaux) !");
    if (typeof openMasterShop === 'function') openMasterShop();
}

// §ÉCO v2 — Comptoir d'échange déterministe (remplace l'Honor Summon aléatoire).
// Échange des Points d'Honneur contre 1 Cristal de l'élément du biome courant.
function summonHonor() {
    const ex   = (typeof HONOR_EXCHANGE !== 'undefined') ? HONOR_EXCHANGE : { crystal: 200, idol: 600, mimic: 1500 };
    const cost = ex.crystal;
    if (G.honorPoints < cost) { showNotif(`❌ Pas assez de Points d'Honneur ! (${fmt(G.honorPoints)} / ${cost} PH)`); return; }
    const elem = (typeof _biomeElemKey === 'function') ? _biomeElemKey() : 'fire';
    const key  = `${elem}_crystal`;
    if (typeof MATERIAL_DEFS === 'undefined' || !MATERIAL_DEFS[key]) { showNotif('❌ Échange indisponible.'); return; }
    G.honorPoints -= cost;
    G.materials[key] = (G.materials[key] || 0) + 1;
    showNotif(`🤝 Échange : -${cost} PH → 1 ${MATERIAL_DEFS[key].name}`);
    if (typeof renderMaterialsPanel === 'function') renderMaterialsPanel();
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
        // §ÉCO — un doublon crédite aussi des Points de Maître (boutique d'échange garantie)
        const pmTable = (typeof MASTER_POINTS_DUPE !== 'undefined') ? MASTER_POINTS_DUPE : { 3:500, 4:1500, 5:5000, 6:15000 };
        const pmGain  = pmTable[def.rarity] || pmTable[3] || 0;
        if (pmGain && typeof addMasterPoints === 'function') addMasterPoints(pmGain);
        showNotif(`✨ Doublon ! ${def.name} → Limit Break +${h.limitBreak} (+5% stats) · +${pmGain} PM`);
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

// ═══════════════════════════════════════════════════════════════════════════════
// §ÉCO v2 — ATELIER D'INVOCATION (création déterministe : or + matériaux + Essence)
// Remplace le gacha ET l'ancienne boutique Points de Maître. Aucun hasard.
// (Essence = G.gems réaffectées en catalyseur rare.)
// ═══════════════════════════════════════════════════════════════════════════════
function _pmFmt(n) { return (typeof fmt === 'function') ? fmt(n) : String(n); }

const _MAT_LABEL = { crystal: 'Cristal', idol: 'Idole', totem: 'Totem', mimic: 'Mimic' };

// Palier du héros (B commun / A avancé / S élite) — via SUMMON_POOLS, repli sur la rareté.
function _heroTier(def) {
    if (typeof SUMMON_POOLS !== 'undefined') {
        if (SUMMON_POOLS.S.includes(def.id)) return 'S';
        if (SUMMON_POOLS.A.includes(def.id)) return 'A';
    }
    if ((def.rarity || 3) >= 5) return 'S';
    if ((def.rarity || 3) >= 4) return 'A';
    return 'B';
}

// Recette de création d'un héros : { gold, essence, mats:[{key,n,label}] }
function _heroRecipe(def) {
    const R = (typeof CREATE_RECIPE !== 'undefined') ? CREATE_RECIPE : {
        B: { gold:4000, crystal:6 }, A: { gold:30000, idol:6, mimic:4 }, S: { gold:150000, totem:8, mimic:6, essence:3 }
    };
    const tier = _heroTier(def);
    const r    = R[tier] || R.B;
    const elem = (typeof getElementKey === 'function') ? getElementKey(def.element) : 'fire';
    const mats = [];
    if (r.crystal) mats.push({ key: `${elem}_crystal`, n: r.crystal, label: `${_MAT_LABEL.crystal} ${def.elem||''}` });
    if (r.idol)    mats.push({ key: `${elem}_idol`,    n: r.idol,    label: `${_MAT_LABEL.idol} ${def.elem||''}` });
    if (r.totem)   mats.push({ key: `${elem}_totem`,   n: r.totem,   label: `${_MAT_LABEL.totem} ${def.elem||''}` });
    if (r.mimic)   mats.push({ key: 'mimic',           n: r.mimic,   label: 'Mimic' });
    return { tier, gold: r.gold || 0, essence: r.essence || 0, mats };
}

// Compat : le bouton du header appelait updateMasterPmDisplay (laissé inoffensif).
function updateMasterPmDisplay() {}

function openMasterShop() {
    const m = document.getElementById('master-shop-modal');
    if (!m) return;
    renderMasterShop();
    m.style.display = 'flex';
}
function closeMasterShop() {
    const m = document.getElementById('master-shop-modal');
    if (m) m.style.display = 'none';
}
// Alias explicites
function openAtelier()  { openMasterShop(); }
function closeAtelier() { closeMasterShop(); }

function renderMasterShop() {
    const list = document.getElementById('master-shop-list');
    if (!list) return;

    let html = '';
    HERO_DEFS.forEach(def => {
        const owned = !!G.heroes[def.id];
        const rec   = _heroRecipe(def);
        // état de chaque ressource
        const goldOk = (typeof D === 'function') ? D(G.gold).gte(rec.gold) : (G.gold >= rec.gold);
        const essOk  = (G.gems || 0) >= rec.essence;
        let matsOk = true;
        const parts = [];
        parts.push(`<span style="color:${goldOk?'#bfe3c7':'#e88'};">${_pmFmt(rec.gold)} or</span>`);
        rec.mats.forEach(m => {
            const have = G.materials[m.key] || 0;
            const ok = have >= m.n; if (!ok) matsOk = false;
            parts.push(`<span style="color:${ok?'#bfe3c7':'#e88'};">${m.label} ${have}/${m.n}</span>`);
        });
        if (rec.essence > 0) {
            parts.push(`<span style="color:${essOk?'#bfe3c7':'#e88'};">Essence ${(G.gems||0)}/${rec.essence}</span>`);
        }
        const can = !owned && goldOk && matsOk && essOk;
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #234539;border-radius:10px;margin-bottom:8px;background:${owned?'rgba(52,211,153,0.06)':'rgba(255,255,255,0.02)'};">
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:#e8f3ec;">${def.icon||''} ${def.name} <span style="font-size:11px;color:#b8902a;">${'★'.repeat(def.rarity||3)}</span> <span style="font-size:10px;color:#7fa;">[${rec.tier}]</span></div>
                <div style="font-size:10.5px;color:#9fb3aa;line-height:1.5;">${owned ? 'Déjà invoqué' : parts.join(' · ')}</div>
            </div>
            ${owned
                ? `<span style="color:#34d399;font-size:12px;font-weight:700;white-space:nowrap;">✓ Possédé</span>`
                : `<button onclick="createHero('${def.id}')" ${can?'':'disabled'} style="background:${can?'linear-gradient(135deg,#1f7a52,#2bbe7e)':'#243a30'};color:${can?'#06160f':'#5a6f63'};border:none;border-radius:8px;padding:8px 12px;font-weight:800;font-size:12px;cursor:${can?'pointer':'not-allowed'};white-space:nowrap;">🛠 Invoquer</button>`}
        </div>`;
    });
    list.innerHTML = html;
}

// Création déterministe d'un héros : déduit or + matériaux (+ Essence), puis débloque.
function createHero(heroId) {
    const def = HERO_DEFS.find(d => d.id === heroId);
    if (!def) return;
    if (G.heroes[heroId]) { showNotif('Déjà invoqué.'); return; }
    const rec = _heroRecipe(def);
    if (!(D(G.gold).gte(rec.gold))) { showNotif(`❌ Or insuffisant (${_pmFmt(rec.gold)} requis)`); return; }
    for (const m of rec.mats) {
        if ((G.materials[m.key] || 0) < m.n) { showNotif(`❌ ${m.label} insuffisant (${G.materials[m.key]||0}/${m.n})`); return; }
    }
    if ((G.gems || 0) < rec.essence) { showNotif(`❌ Essence insuffisante (${G.gems||0}/${rec.essence})`); return; }

    G.gold = D(G.gold).sub(rec.gold);
    rec.mats.forEach(m => { G.materials[m.key] = (G.materials[m.key] || 0) - m.n; });
    if (rec.essence > 0) G.gems -= rec.essence;
    if (typeof _unlockHeroQuiet === 'function') _unlockHeroQuiet(heroId);
    showNotif(`🛠 ${def.name} invoqué grâce à tes matériaux !`);
    renderMasterShop();
    if (typeof updateDisplays === 'function') updateDisplays();
    if (typeof renderHeroesGrid === 'function') renderHeroesGrid();
    (markSaveDirty(), saveGame());
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

    updateMasterPmDisplay(); // §ÉCO — rafraîchit le solde PM sur le bouton boutique
    const cost1  = (typeof RARE_SUMMON_COST    !== 'undefined') ? RARE_SUMMON_COST    : 5;  // §ÉCO
    const cost10 = (typeof RARE_SUMMON_COST_10 !== 'undefined') ? RARE_SUMMON_COST_10 : 45; // §ÉCO
    const costH  = (typeof HONOR_SUMMON_COST   !== 'undefined') ? HONOR_SUMMON_COST   : 500;// §ÉCO
    if (rareBtn) {
        rareBtn.disabled = G.gems < cost1;
        if (G.gems >= cost1) rareBtn.classList.add('can-afford');
        else rareBtn.classList.remove('can-afford');
    }
    if (rare10Btn) {
        rare10Btn.disabled = G.gems < cost10;
        if (G.gems >= cost10) rare10Btn.classList.add('can-afford');
        else rare10Btn.classList.remove('can-afford');
    }
    if (honorBtn) {
        honorBtn.disabled = G.honorPoints < costH;
        honorBtn.classList.toggle('can-afford', G.honorPoints >= costH);
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
    // Image "full" pour l'animation Brave Burst : source unique = getHeroImage (cf. 03_save_init.js)
    const bbFullSrc = getHeroImage(id, (def && def.stars) || 3, 'full');

    if (portraitEl) {
        portraitEl.classList.remove('animate');
        // §1.4 — reflow supprimé : on force la transition en retirant puis ajoutant la classe
        if (bbFullSrc) {
            portraitEl.src = bbFullSrc;
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