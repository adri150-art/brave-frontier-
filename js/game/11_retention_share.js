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
                    onclick="adDoubleQuestReward(${i})">✨ ×2 gratuit</button>`;
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

let _hubCarouselInitialized = false;

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
