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
            goldBtn.innerHTML = `✨ ×2 Or 30 min &nbsp;<span style="opacity:.7;font-size:11px;">(limite atteinte)</span>`;
            goldBtn.disabled = true; goldBtn.style.opacity = '0.45';
        } else {
            goldBtn.innerHTML = `✨ ×2 Or pendant 30 min — gratuit &nbsp;<span style="opacity:.7;font-size:11px;">(${remaining}/jour)</span>`;
            goldBtn.disabled = false; goldBtn.style.opacity = '1';
        }
    }
    const fsBtn = document.getElementById('ad-free-summon-btn');
    if (fsBtn) {
        const fsRemaining = AD_CAPS_MAX.freeSummon - (G.adCaps.freeSummon || 0);
        fsBtn.disabled = fsRemaining <= 0;
        fsBtn.style.opacity = fsRemaining <= 0 ? '0.45' : '1';
        fsBtn.textContent = '🛠 Atelier d\'Invocation';
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
