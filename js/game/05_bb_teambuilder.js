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
// §ÉCO — pité Tier A (héros 5★) : nombre de tirages sans rare avant garantie.
// La pité Tier S (6★) est pilotée par RARE_PITY (cf. src/data/balance.js).
const RARE_PITY_A = 10;

function updatePityDisplay() {
    const countEl = document.getElementById('pity-rare-text');
    const progEl  = document.getElementById('pity-rare-progress');
    if (!countEl || !progEl) return;
    const sPity = (typeof RARE_PITY !== 'undefined') ? RARE_PITY : 40; // §ÉCO
    const aPity = RARE_PITY_A;
    const c  = G.pityCountRare || 0;
    const cs = G.pityCountS    || 0;
    countEl.textContent = `Invocations sans rare : ${c}`;
    if (cs >= sPity - 1) progEl.innerHTML = `<span style="color:#ef4444">⚡ Tier S garanti prochaine !</span>`;
    else if (c >= aPity - 3) progEl.innerHTML = `<span style="color:#34d399">Tier A garanti dans ${aPity-c} !</span>`;
    else                 progEl.textContent = `Pity A dans ${aPity-c}  ·  Pity S dans ${sPity-cs}`;
}

function _applyPityAndRoll() {
    G.pityCountRare = (G.pityCountRare || 0) + 1;
    G.pityCountS    = (G.pityCountS    || 0) + 1;

    // §ÉCO — taux & pité pilotés par les constantes (src/data/balance.js), avec fallback.
    const R = (typeof RARE_RATES !== 'undefined') ? RARE_RATES : { S:0.05, A:0.20, B:0.35, base:0.40 };
    const S_PITY = (typeof RARE_PITY !== 'undefined') ? RARE_PITY : 40;
    // Seuils cumulés : S | S+A | S+A+B(=sphères) | reste(=matériaux, poids "base").
    const tS      = R.S;
    const tA      = R.S + R.A;
    const tSphere = R.S + R.A + R.B;

    const isPityS = G.pityCountS  >= S_PITY;
    const isPityA = G.pityCountRare >= RARE_PITY_A;

    const roll = Math.random();

    if (isPityS || roll < tS) {
        G.pityCountS = 0; G.pityCountRare = 0;
        const pool = SUMMON_POOLS.S;
        return { type:'hero_S', heroId: pool[Math.floor(Math.random()*pool.length)] };
    }
    if (isPityA || roll < tA) {
        G.pityCountRare = 0;
        const pool = SUMMON_POOLS.A;
        return { type:'hero_A', heroId: pool[Math.floor(Math.random()*pool.length)] };
    }
    if (roll < tSphere) {
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
            // §ÉCO — doublon (tirage ×10) → Points de Maître
            const pmTable = (typeof MASTER_POINTS_DUPE !== 'undefined') ? MASTER_POINTS_DUPE : { 3:500, 4:1500, 5:5000, 6:15000 };
            if (typeof addMasterPoints === 'function') addMasterPoints(pmTable[def.rarity] || pmTable[3] || 0);
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

// §ÉCO v2 — Gacha retiré. summonRare10 redirige vers l'Atelier d'Invocation.
function summonRare10() {
    showNotif("✨ Plus de tirage : assemble or + matériaux à l'Atelier pour créer un héros !");
    if (typeof openMasterShop === 'function') openMasterShop();
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
