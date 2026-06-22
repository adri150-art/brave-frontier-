// =============================================================
// BATTLE & TIMERS ENGINE
// =============================================================
function spawnMonster() {
    invalidateStats();   // §1.3 — la zone peut changer → avantage élémentaire recalculé
    if (G.currentStage) {
        // Mode stage (Phase 3) : 5 monstres par stage, boss uniquement sur le 5e stage de la zone
        if (G.currentStage.stage === STAGES_PER_AREA - 1 && G.monsterIndex >= 5) {
            G.isBoss = true; G.bossTimer = 30;
        }
    } else if (G.monsterIndex >= 10) { G.isBoss = true; G.monsterIndex = 10; G.bossTimer = 30; }
    // Pilier 3: démarrer le chrono et réinitialiser les dégâts pour les jalons
    if (G.isBoss && [10, 25, 50, 100, 150].includes(G.zone)) {
        _bossStartTime = Date.now(); _bossTotalDmg = 0;
    }
    G.monsterMaxHp = getMonsterMaxHp(); G.monsterHp = D(G.monsterMaxHp); // §1.5
    G.monsterFrozen = 0; G.monsterDebuff = 0;

    G.monsterSpawnTime = Date.now();
    G.monsterFirstAttackDone = false;
    G.bossUltimateTriggered = false;

    updateMonsterUI();

    // CORRECTION CRITIQUE : Séparation des règles d'échelle PC et Mobile
    const monsterImg = document.getElementById('monster-emoji');
    if (monsterImg) {
        if (G.isTestCombat) {
            // Pour l'Ogre de test, on enlève l'inline style pour laisser le CSS (grimoire-noir.css) gérer entièrement la taille
            monsterImg.style.removeProperty('height');
        } else {
            if (window.innerWidth >= 1024) {
                // 🖥️ MODE ORDINATEUR : Proportions en % idéales pour le cadre carré agrandi
                if (G.isBoss) {
                    if (G.zone % 10 === 0) {
                        monsterImg.style.setProperty('height', '92%', 'important');
                    } else {
                        monsterImg.style.setProperty('height', '82%', 'important');
                    }
                } else {
                    monsterImg.style.setProperty('height', '60%', 'important');
                }
            } else {
                // 📱 MODE MOBILE / ANDROID : Utilisation du "vh" (Viewport Height) pour ne jamais déborder
                if (G.isBoss) {
                    if (G.zone % 10 === 0) {
                        // Le gros Boss de fin d'acte reste imposant mais sous le texte
                        monsterImg.style.setProperty('height', '42vh', 'important');
                    } else {
                        // Boss classique de zone
                        monsterImg.style.setProperty('height', '35vh', 'important');
                    }
                } else {
                    // Les monstres de base restent bien proportionnés au centre
                    monsterImg.style.setProperty('height', '26vh', 'important');
                }
            }
        }
    }

    BGM.update();
}

function killMonster() {
    if (G.isTestCombat) {
        G.monsterHp = D(G.monsterMaxHp);
        spawnMonster();
        showNotif("🎯 Monstre de test vaincu ! Régénération...");
        return;
    }
    const _diffGold = { easy: 0.5, normal: 1, hard: 1.5, extreme: 3 };
    const _goldPrestigeBonus = G.prestigeBonus ? (1 + G.prestigeBonus.gold * 0.25) : 1;
    // §1.5 — D pour éviter la perte de précision à hautes zones
    let gold = D(10).mul(Math.pow(1.21, G.zone - 1)).mul(G.isBoss ? 5 : 1).mul(_diffGold[G.difficulty] || 1).mul(_goldPrestigeBonus).mul(getGoldBuffMult()).mul(getIAPGoldMult()).ceil(); // §4.3 IAP gold
    if (G.playerSkillsActive.wealth > 0) gold = gold.mul(2);
    if (G.leaderId === 'selena') gold = gold.mul(1.25).floor();

    // 1. AJOUT DES RESSOURCES
    G.gold = D(G.gold).add(gold); G.totalGold = D(G.totalGold).add(gold); G.totalKills++; Sound.playKill();
    
    if (G.isBoss) {
        G.honorPoints += 10;
        // §ÉCO — gemme de boss rejoué pilotée par GEM_REWARDS (1er clear géré par finishStage)
        const _bossGem = (typeof GEM_REWARDS !== 'undefined') ? (GEM_REWARDS.bossRepeat ?? 1) : 1;
        G.bossKills++; G.gems += _bossGem;
        tryDropBiomeMaterial(); // §ÉCO — drop Totem du biome (matériaux conservés)
        // §ÉCO v2 — drops aléatoires de héros retirés : les héros se créent à l'Atelier
        G.skillPoints = (G.skillPoints||0) + 1; // §2.2 ② — +1 SP par boss kill screenFlash('#f1c40f');
        // ── Mode stage (Phase 3) : boss vaincu = stage terminé, pas de zone++ ──
        if (G.currentStage) {
            updateDisplays();
            pulseCurrency('gold-display'); pulseCurrency('gems-display'); pulseCurrency('honor-display');
            tryDropLoot();
            finishStage(true);
            return;
        }
        const _defeatedZone = G.zone; // zone du boss vaincu
        const _bossDmg = _bossTotalDmg; const _bossTime = Date.now() - (_bossStartTime || Date.now());
        G.isBoss = false; G.monsterIndex = 0; G.zone++;
        // §2.3 — Refresh carte si ouverte
        if (document.querySelector('.tab-btn[data-tab="worldmap"]')?.classList.contains('active')) renderWorldMap();
        if(G.zone > G.maxZone) G.maxZone = G.zone;
        // ── Pilier 3: écran de victoire pour les zones jalons ──
        if ([10, 25, 50, 100, 150].includes(_defeatedZone)) {
            const _bn = getBossNameForZone(_defeatedZone);
            setTimeout(() => showBossVictoryScreen(_defeatedZone, _bn, _bossTime, _bossDmg), 350);
        }
        // ── Pilier 3: achievements de zone (première fois) ──
        if (_defeatedZone + 1 === 50  && !G._achZone50)  { G._achZone50  = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_50',  { zone: 50  }), 1200); }
        if (_defeatedZone + 1 === 100 && !G._achZone100) { G._achZone100 = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_100', { zone: 100 }), 1200); }
        if (_defeatedZone + 1 === 200 && !G._achZone200) { G._achZone200 = true; (markSaveDirty(), saveGame()); setTimeout(() => triggerAchievementShare('zone_200', { zone: 200 }), 1200); }
    } else {
        G.honorPoints += 1;
        tryDropBiomeMaterial(); // §ÉCO — drop Cristal du biome (matériaux conservés)
        G.monsterIndex++;
        // ── Mode stage (Phase 3) : 5 monstres tués sur un stage normal = stage terminé ──
        if (G.currentStage && G.monsterIndex >= 5 && G.currentStage.stage !== STAGES_PER_AREA - 1) {
            updateDisplays();
            pulseCurrency('gold-display');
            tryDropLoot();
            finishStage(true);
            return;
        }
    }

    // 2. CORRECTION CRITIQUE : On met à jour l'affichage TEXTUEL immédiatement ici
    // pour que l'or apparaisse à l'écran sans attendre les calculs de décors
    updateDisplays();
    pulseCurrency('gold-display');
    if (G.isBoss) {
        pulseCurrency('gems-display');
        pulseCurrency('honor-display');
    }
    
    // 3. ENGENDRER LE PROCHAIN MONSTRE (Contient les calculs graphiques lourds)
    spawnMonster();
    // §1.4 — Ne pas reconstruire les panneaux en direct. masterFrame les render ≤4×/s si visibles.
    _panelsDirty = true;
    tryDropLoot(); // §2.2 ① — chance de drop équipement procédural
    
    // §1.3 — Pop via classe CSS (prioritaire sur monsterIdle grâce à !important)
    const me = document.getElementById('monster-emoji');
    me.classList.remove('monster-pop');
    // §1.4 — reflow supprimé, l'animation de pop est gérée via Web Animations dans spawnMonster
    me.classList.add('monster-pop');
    setTimeout(() => me.classList.remove('monster-pop'), 260);
}

function healParty(amount) {
    if (G.deathTimer > 0) return;
    G.partyHp = Math.min(G.partyMaxHp, G.partyHp + amount);
    updatePartyHpBar();
}

function addBC(count) {
    const active = G.squad.filter(id => id !== null && G.heroes[id]);
    if (active.length === 0) return;
    
    // Alliance Sacrée synergy adds +20% Battle Crystals generation rate
    if (G.allianceSacreeActive) {
        count *= 1.2;
    }
    
    const targetId = active[Math.floor(Math.random() * active.length)];
    const def = HERO_DEFS.find(d => d.id === targetId);
    const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
    
    if (!G.bbGauges[targetId]) G.bbGauges[targetId] = 0;
    
    const pctAdd = (count / bbCost) * 100 * getIAPBCMult(); // §4.3 IAP BC mult
    G.bbGauges[targetId] = Math.min(100, G.bbGauges[targetId] + pctAdd);
    
    renderFooterBB();
    if(document.querySelector('.tab-btn[data-tab="skills"]')?.classList.contains('active')) renderSkills();
}

// =============================================================
// LIVE DPS TRACKER
// =============================================================
let totalDamageDealtInLastSecond = 0;
let liveDpsValue = 0;

// P3 §3.2 — agrégateur de dégâts (cap 12 nombres simultanés)
let _dmgActive = 0;
const _dmgAgg = { sum: 0, hits: 0, el: null, timer: null };
function _aggDamage(dmg) {
    const zone = document.getElementById('monster-zone');
    if (!zone) return;
    if (!_dmgAgg.el) {
        const el = document.createElement('div');
        el.id = 'dmg-aggregate';
        zone.appendChild(el);
        _dmgAgg.el = el;
    }
    _dmgAgg.sum += (dmg && typeof dmg.toNumber === 'function') ? dmg.toNumber() : (Number(dmg) || 0);
    _dmgAgg.hits++;
    const el = _dmgAgg.el;
    el.textContent = `✕${_dmgAgg.hits} — ${fmt(_dmgAgg.sum)}`;
    el.classList.add('visible');
    clearTimeout(_dmgAgg.timer);
    _dmgAgg.timer = setTimeout(() => {
        el.classList.remove('visible');
        _dmgAgg.sum = 0; _dmgAgg.hits = 0;
    }, 600);
}

function trackRealDamage(amount) {
    totalDamageDealtInLastSecond += amount;
}

// Live DPS et DPS passif gérés dans simulate() via accumulateurs

// Variables pour l'accumulation des dégâts passifs
let _passiveDmgAccumulator = 0;
let _passiveDmgTimeAccumulator = 0;

// Visual hit feedback (flashing/shaking) on monster
function triggerMonsterHitVisuals(isCrit = false, isBig = false) {
    const monsterImg = document.getElementById('monster-emoji');
    if (!monsterImg) return;
    
    monsterImg.classList.remove('hit-flash-active', 'hit-shake-active', 'hit-shake-big');
    void monsterImg.offsetWidth; // Trigger reflow
    
    monsterImg.classList.add('hit-flash-active');
    if (isBig) {
        monsterImg.classList.add('hit-shake-big');
    } else {
        monsterImg.classList.add('hit-shake-active');
    }
    
    setTimeout(() => {
        monsterImg.classList.remove('hit-flash-active', 'hit-shake-active', 'hit-shake-big');
    }, 80);
}

// Click slash overlay sparkle
function spawnClickSlash(x, y) {
    const zone = document.getElementById('monster-zone');
    if (!zone) return;
    
    const slash = document.createElement('div');
    slash.className = 'click-slash-effect';
    slash.style.left = x + 'px';
    slash.style.top = y + 'px';
    const angle = Math.floor(Math.random() * 360);
    slash.style.setProperty('--angle', angle + 'deg');
    
    zone.appendChild(slash);
    setTimeout(() => { slash.remove(); }, 300);
}

// Floating damage numbers
let _floatingDmgActiveCount = 0;
function spawnFloatingDamageText(x, y, text, isCrit = false, isBraveBurst = false) {
    if (_floatingDmgActiveCount >= 25) return;
    
    let dmgEl;
    if (typeof _dmgPool !== 'undefined' && _dmgPool) {
        dmgEl = _dmgPool.acquire();
    } else {
        dmgEl = document.createElement('div');
        dmgEl.className = 'dmg-text';
        const mz = document.getElementById('monster-zone');
        if (mz) mz.appendChild(dmgEl);
    }
    
    _floatingDmgActiveCount++;
    dmgEl.textContent = text;
    dmgEl.className = 'dmg-text' + (isCrit ? ' dmg-crit' : '') + (isBraveBurst ? ' dmg-bb' : '');
    dmgEl.style.position = 'absolute';
    dmgEl.style.left = x + 'px';
    dmgEl.style.top = y + 'px';
    dmgEl.style.opacity = '1';
    dmgEl.style.display = 'block';
    dmgEl.style.zIndex = '10';
    dmgEl.style.pointerEvents = 'none';
    
    if (isBraveBurst) {
        dmgEl.style.fontSize = '24px';
        dmgEl.style.fontWeight = '800';
    } else if (isCrit) {
        dmgEl.style.fontSize = '18px';
        dmgEl.style.fontWeight = '700';
    } else {
        dmgEl.style.fontSize = '14px';
    }
    
    const angle = -15 + Math.random() * 30;
    dmgEl.animate([
        { opacity: '1', transform: `translateY(0) scale(0.6) rotate(${angle}deg)` },
        { transform: `translateY(-25px) scale(1.4) rotate(${angle}deg)`, offset: 0.2 },
        { opacity: '0', transform: `translateY(-80px) scale(0.8) rotate(${angle}deg)` }
    ], {
        duration: 900,
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        fill: 'forwards'
    }).onfinish = () => {
        _floatingDmgActiveCount = Math.max(0, _floatingDmgActiveCount - 1);
        if (typeof _dmgPool !== 'undefined' && _dmgPool) {
            _dmgPool.release(dmgEl);
        } else {
            dmgEl.remove();
        }
    };
}

// Inject cloud parallax overlay in the Hub at startup
document.addEventListener('DOMContentLoaded', () => {
    const hubMenu = document.getElementById('hub-menu');
    if (hubMenu) {
        const clouds = document.createElement('div');
        clouds.className = 'hub-cloud-overlay';
        hubMenu.appendChild(clouds);
    }
});

// =============================================================
// GESTIONNAIRE DE CLIC : CRIT SCALING + COMBO GLOW
// =============================================================
let comboCount = 0, comboTimer = null, lastClick = 0;
document.getElementById('monster-zone').addEventListener('pointerdown', (e) => {
    // pointerdown (pas click) : réponse immédiate au doigt, pas de taps avalés en tap rapide
    if (e.button !== undefined && e.button !== 0) return; // clic gauche / tap uniquement
    Sound.init();
    if (G.deathTimer > 0 || D(G.monsterHp).lte(0)) return;
    G.totalClicks++; // §1.5

    // Crit scaling : +0.5% de chance de crit par combo (max +20% au combo 40)
    const bonusCritChance = Math.min(0.20, comboCount * 0.005);
    const isCrit = Math.random() < (0.10 + bonusCritChance);

    const now = Date.now();
    if (now - lastClick < 400) {
        comboCount = Math.min(comboCount + 1, 40);
        if (comboCount >= 15) document.getElementById('monster-zone').classList.add('combo-glow');
    } else {
        comboCount = 1;
        document.getElementById('monster-zone').classList.remove('combo-glow');
    }
    lastClick = now;

    if (comboCount > G.maxCombo) G.maxCombo = comboCount;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        comboCount = 0;
        document.getElementById('combo-display').textContent = '';
        document.getElementById('monster-zone').classList.remove('combo-glow');
    }, 600);

    if (comboCount >= 2) {
        const critIndicator = bonusCritChance > 0
            ? ` <small style="color:#f1c40f">(+${Math.floor(bonusCritChance * 100)}% Crit)</small>`
            : '';
        const comboEl = document.getElementById('combo-display');
        // Scale font with combo: starts at 12px, grows to 22px at ×40
        const fontSize = Math.min(22, 12 + (comboCount / 40) * 10);
        comboEl.style.fontSize = fontSize + 'px';
        // Color progression: white → yellow → orange → red
        const comboColor = comboCount < 10 ? '#e0e6f0'
            : comboCount < 20 ? '#f1c40f'
            : comboCount < 35 ? '#f97316'
            : '#ff3366';
        comboEl.style.color = comboColor;
        comboEl.innerHTML = `COMBO ×${(1 + comboCount * 0.1).toFixed(1)}${critIndicator}`;
        // Max combo explosion
        if (comboCount === 40) {
            // §1.4 — Web Animations API pour combo-max
            comboEl.animate(
                [{transform:'scale(1)'},{transform:'scale(1.5)',offset:0.4},{transform:'scale(0.9)',offset:0.7},{transform:'scale(1)'}],
                {duration:400, easing:'ease-out'}
            );
            comboEl.style.color = '#ff3366';
            screenFlash('rgba(255,51,102,0.3)');
            // §2.1 — SPARK MAX : combo 40 = charge immédiate +25 BC sur tout le squad
            const allActive = G.squad.filter(id => id !== null && G.heroes[id]);
            allActive.forEach(id => {
                const def = HERO_DEFS.find(d => d.id === id);
                const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
                if (!G.bbGauges[id]) G.bbGauges[id] = 0;
                G.bbGauges[id] = Math.min(100, G.bbGauges[id] + (25 / bbCost) * 100);
            });
            renderFooterBB();
        }
    }

    // §SOUTIEN — Le joueur est un soutien : plus de dégâts directs, mais BC + soins pour l'équipe
    const baseBc = getSupportPower();
    const comboMult = 1 + comboCount * 0.1;
    const bcPerHero = Math.floor(baseBc * comboMult * (isCrit ? 3 : 1));

    // Distribue BC à tous les membres actifs du squad
    const active = G.squad.filter(id => id !== null && G.heroes[id]);
    active.forEach(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const bbCost = (def && def.bb && def.bb.cost) ? def.bb.cost : 100;
        if (!G.bbGauges[id]) G.bbGauges[id] = 0;
        G.bbGauges[id] = Math.min(100, G.bbGauges[id] + (bcPerHero / bbCost) * 100);
    });
    renderFooterBB();

    // Crit → soin 1.5% HP max en bonus
    const healAmt = isCrit ? Math.ceil(G.partyMaxHp * 0.015) : 0;
    if (healAmt > 0) healParty(healAmt);

    // Combo ≥10 → debuff monstre (vulnérabilité tactique infligée par la présence du soutien)
    if (comboCount >= 10) {
        G.monsterDebuff = Math.max(G.monsterDebuff, 3);
    }

    const spawnBC = Math.random() < 0.65; // Plus de cristaux BC car rôle soutien
    const spawnHC = Math.random() < 0.30;

    const r = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - r.left;
    const clickY = e.clientY - r.top;

    if (spawnBC) spawnCrystalParticle(clickX, clickY, 'BC');
    if (spawnHC) spawnCrystalParticle(clickX, clickY, 'HC');

    spawnParticlesFiltered(clickX, clickY, {count: isCrit ? 12 : 4, speed: isCrit ? 250 : 150, colors: isCrit ? ['#00d2ff', '#a78bfa', '#fff'] : ['#60a5fa', '#a78bfa']}); // §3.4 — couleurs soutien
    if (isCrit) Sound.playCrit(); else Sound.playHit();

    // JRPG click slash overlay & monster hit flash/shake feedback
    spawnClickSlash(clickX, clickY);
    triggerMonsterHitVisuals(isCrit, false);

    // §SOUTIEN — Affichage du BC généré au lieu des dégâts
    const theme = ZONE_THEMES[(G.zone - 1) % ZONE_THEMES.length];
    const elemColors = {
        'Feu': '#ff4c30',
        'Eau': '#00d2ff',
        'Terre': '#2ecc71',
        'Foudre': '#f1c40f',
        'Lumière': '#ffffff',
        'Ténèbres': '#c084fc'
    };
    const elemGlows = {
        'Feu': '0 0 10px rgba(255,76,48,0.8)',
        'Eau': '0 0 10px rgba(0,210,255,0.8)',
        'Terre': '0 0 10px rgba(46,204,113,0.8)',
        'Foudre': '0 0 10px rgba(241,196,15,0.8)',
        'Lumière': '0 0 10px rgba(255,255,255,0.8)',
        'Ténèbres': '0 0 10px rgba(192,132,252,0.8)'
    };
    const currentElemColor = elemColors[theme.elem] || '#fff';
    const currentElemGlow = elemGlows[theme.elem] || '0 0 8px rgba(255,255,255,0.5)';

    // P3 §3.2 — cap de nombres simultanés : au-delà de 12, on skip
    if (_dmgActive >= 12) { return; }
    _dmgActive++;
    // §1.4 — Pool de divs réutilisés (zéro allocation DOM, zéro GC)
    const dmgEl = _dmgPool.acquire();
    // §SOUTIEN — Affichage "+X BC" (ou "✨ +X BC SOIN" en crit)
    if (isCrit && healAmt > 0) {
        dmgEl.textContent = `✨ +${bcPerHero} BC  +${healAmt} HP`;
        dmgEl.style.color = '#a78bfa';
        dmgEl.style.textShadow = '0 0 14px rgba(167,139,250,0.9), 0 2px 4px rgba(0,0,0,0.9)';
        dmgEl.style.fontSize = '18px';
    } else {
        dmgEl.textContent = `+${bcPerHero} BC`;
        dmgEl.style.color = '#60a5fa';
        dmgEl.style.textShadow = '0 0 10px rgba(96,165,250,0.8), 0 2px 4px rgba(0,0,0,0.8)';
        dmgEl.style.fontSize = '14px';
    }
    const zoneW = e.currentTarget.clientWidth;
    dmgEl.style.left = Math.max(10, Math.min(clickX - 30, zoneW - 80)) + 'px';
    dmgEl.style.top = Math.max(20, clickY - 10) + 'px';
    dmgEl.style.opacity = '1';
    dmgEl.style.display = 'block';
    dmgEl.animate(
        [{opacity:'1',transform:'translateY(0) scale(0.7)'},{transform:'translateY(-12px) scale(1.1)',offset:0.25},{opacity:'0',transform:'translateY(-70px) scale(0.85)'}],
        {duration:1000, easing:'ease-out', fill:'forwards'}
    ).onfinish = () => { _dmgActive = Math.max(0, _dmgActive - 1); _dmgPool.release(dmgEl); };

    // §SOUTIEN — Le joueur soutient, le monstre n'est pas heurté directement
    // Léger tremblement de l'UI héros pour indiquer l'action de soutien
    const footerEl = document.getElementById('footer');
    if (footerEl && isCrit) {
        footerEl.animate(
            [{filter:'brightness(1)'},{filter:'brightness(1.4)',offset:0.15},{filter:'brightness(1)'}],
            {duration:250, easing:'ease-out'}
        );
    }
    updateHpBar();
});

let lastMonsterAttack = 0;

function triggerScreenShake() {
    const gw = document.getElementById('game-window');
    if (!gw) return;
    // §1.4 — Web Animations API : pas de reflow
    gw.animate([
        {transform:'translate(0,0) rotate(0deg)'},
        {transform:'translate(-8px,5px) rotate(-1deg)',  offset:0.20},
        {transform:'translate(8px,-5px) rotate(1deg)',   offset:0.40},
        {transform:'translate(-6px,-3px) rotate(-0.5deg)',offset:0.60},
        {transform:'translate(6px,3px) rotate(0.5deg)',  offset:0.80},
        {transform:'translate(0,0) rotate(0deg)'}
    ], {duration:150, easing:'ease-out'});
}

function spawnBloodyDamageNumber(dmg, isUltimate = false) {
    const footer = document.getElementById('footer');
    if (!footer) return;
    
    // §1.4 — Pool pour les nombres de dégâts reçus
    const bloodyEl = _bloodyPool.acquire();
    bloodyEl.textContent = '-' + fmt(dmg);
    const rect = footer.getBoundingClientRect();
    const container = document.getElementById('game-window') || document.body;
    const containerRect = container.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) - containerRect.left;
    const y = (rect.top + 20) - containerRect.top;
    bloodyEl.style.left = `${x + (Math.random() * 40 - 20)}px`;
    bloodyEl.style.top = `${y}px`;
    bloodyEl.style.display = 'block';
    if (isUltimate) {
        bloodyEl.style.fontSize = '32px';
        bloodyEl.style.color = '#9b59b6';
        bloodyEl.style.textShadow = '0 0 15px #9b59b6, 0 3px 6px #000';
    } else {
        bloodyEl.style.fontSize = '24px';
        bloodyEl.style.color = '#ff3333';
        bloodyEl.style.textShadow = '0 0 10px #ff3333, 0 2px 4px #000';
    }
    bloodyEl.animate(
        [{opacity:'0',transform:'translateY(-20px) scale(0.6)'},{opacity:'1',transform:'translateY(0px) scale(1.3)',offset:0.15},{transform:'translateY(15px) scale(1.1)',offset:0.40},{opacity:'0',transform:'translateY(60px) scale(0.9)'}],
        {duration:1200, easing:'ease-in', fill:'forwards'}
    ).onfinish = () => _bloodyPool.release(bloodyEl);
}

function handleSquadDeath() {
    // ── Mode stage (Phase 3) : squad K.O. = défaite du stage (pas de recul de zone) ──
    if (G.currentStage) {
        G.deathTimer = 0;
        screenFlash('rgba(231,76,60,0.7)');
        finishStage(false);
        return;
    }
    G.deathTimer = 3.0;
    G.isBoss = false;
    G.monsterIndex = 0;
    if (G.zone > 1) G.zone--;
    screenFlash('rgba(231,76,60,0.7)');
    (markSaveDirty(), saveGame());
}

function triggerBossUltimate() {
    const baseAtk = getMonsterAttack();
    const atkMod = G.monsterFrozen > 0 ? 0.5 : G.monsterDebuff > 0 ? 0.6 : 1.0;
    let ultDmg = Math.ceil((baseAtk * atkMod) * 2.8);
    if (G.lanceShieldActive) {
        ultDmg = Math.floor(ultDmg / 2);
        showNotif("Bouclier de Lance activé ! Dégâts de l'Ultime divisés par 2 !");
    } else {
        showNotif("🚨 ATTAQUE ULTIME ! Sans bouclier, vous subissez de lourds dégâts !");
    }
    
    G.partyHp = Math.max(0, G.partyHp - ultDmg);
    updatePartyHpBar();
    
    spawnBloodyDamageNumber(ultDmg, true);
    triggerScreenShake();
    screenFlash('rgba(255, 0, 0, 0.65)');
    Sound.playHit();
    
    if (G.partyHp <= 0) {
        handleSquadDeath();
    }
}

// =============================================================
// FONCTION DE SIMULATION — appelée par la boucle maître (§1.2)
// dt = pas de temps fixe (1/30 s). Tous les décréments utilisent dt.
// =============================================================
let _dpsAcc  = 0;
let _saveAcc = 0;
let _questAcc = 0;
let _townAcc = 0;
let _autoCombatAcc = 0;

function simulate(dt) {
    // ── Phase 3 : combat gelé tant qu'un écran de résultat de stage est affiché
    //    (ou qu'aucun stage n'est lancé en mode stage) ──
    if (_stageEnded) return;

    // — Combat Automatique (AUTO) —
    if (G.autoCombat) {
        _autoCombatAcc += dt;
        if (_autoCombatAcc >= 0.150) {
            _autoCombatAcc = 0;
            const zone = document.getElementById('monster-zone');
            if (zone) {
                const event = new PointerEvent('pointerdown', {
                    button: 0,
                    bubbles: true,
                    cancelable: true
                });
                zone.dispatchEvent(event);
            }
        }
        // Déclencher les Brave Bursts prêts automatiquement
        const activeSquad = G.squad.filter(id => id !== null && G.heroes[id]);
        activeSquad.forEach(id => {
            if ((G.bbGauges[id] || 0) >= 100) {
                useBB(id);
            }
        });
    } else {
        _autoCombatAcc = 0;
    }
    // — Accumulateurs périodiques —
    _dpsAcc += dt;
    if (_dpsAcc >= 1) {
        liveDpsValue = totalDamageDealtInLastSecond;
        totalDamageDealtInLastSecond = 0;
        _dpsAcc -= 1;
    }
    _saveAcc += dt;
    if (_saveAcc >= 15) {
        markSaveDirty(); // §1.6 — état a forcement changé depuis 15s
        saveGame();
        _saveAcc -= 15;
    }
    _questAcc += dt;
    if (_questAcc >= 30) {
        if (document.getElementById('daily-quests-container')) renderDailyQuests();
        _questAcc -= 30;
    }
    // — Régénération des gisements de la Ville (timestamp-based → gère aussi l'offline) —
    _townAcc += dt;
    if (_townAcc >= 5) {
        townRegenTick();
        _townAcc -= 5;
    }

    // — Timer de mort (squad K.O.) —
    if (G.deathTimer > 0) {
        G.deathTimer -= dt;
        document.getElementById('monster-name').innerHTML = `<span style="color:#e74c3c">SQUAD K.O. - REPLI (${Math.ceil(G.deathTimer)}s)</span>`;
        if (G.deathTimer <= 0) {
            G.partyHp = G.partyMaxHp;
            updatePartyHpBar();
            spawnMonster();
        }
        updateDisplays();
        return;
    }

    if (G.isTestCombat) {
        G.partyHp = G.partyMaxHp;
        updatePartyHpBar();
    }

    // — Filet de sécurité : HP ≤ 0 sans killMonster (ex: chargé depuis save entre deux ticks) —
    if (D(G.monsterHp).lte(0)) { killMonster(); return; }

    // — DPS passif —
    let dps = getTotalDPS();
    if (G.playerSkillsActive.frenzy > 0) dps *= 3;
    if (dps > 0 && D(G.monsterHp).gt(0)) { // §1.5
        const frameDmg = D(dps).mul(dt);
        trackRealDamage(frameDmg.toNumber());
        G.monsterHp = D(G.monsterHp).sub(frameDmg);
        
        // Accumuler les dégâts passifs pour les afficher sous forme de nombres flottants et secousses
        _passiveDmgAccumulator += frameDmg.toNumber();
        _passiveDmgTimeAccumulator += dt;
        if (_passiveDmgTimeAccumulator >= 0.3) {
            if (_passiveDmgAccumulator > 0.01) {
                const zone = document.getElementById('monster-zone');
                if (zone) {
                    const w = zone.clientWidth;
                    const h = zone.clientHeight;
                    const rx = (w * 0.4) + Math.random() * (w * 0.2);
                    const ry = (h * 0.4) + Math.random() * (h * 0.2);
                    spawnFloatingDamageText(rx, ry, fmt(Math.ceil(_passiveDmgAccumulator)), false, false);
                }
                triggerMonsterHitVisuals(false, false);
            }
            _passiveDmgAccumulator = 0;
            _passiveDmgTimeAccumulator = 0;
        }
        
        if (Math.random() < 0.05 * dt * 30) spawnCrystalParticle(150 + Math.random()*240, 100 + Math.random()*100, 'BC');
        if (Math.random() < 0.02 * dt * 30) spawnCrystalParticle(150 + Math.random()*240, 100 + Math.random()*100, 'HC');
        if (D(G.monsterHp).lte(0)) {
            _passiveDmgAccumulator = 0;
            _passiveDmgTimeAccumulator = 0;
            killMonster();
        } else {
            updateHpBar();
        }
    }

    // — Timer boss —
    if (G.isBoss) {
        G.bossTimer -= dt;
        document.getElementById('boss-timer').textContent = `⏱ ${Math.max(0,G.bossTimer).toFixed(1)}s`;
        if (30 - G.bossTimer >= 8 && !G.bossUltimateTriggered) {
            G.bossUltimateTriggered = true;
            triggerBossUltimate();
        }
        if (G.bossTimer <= 0) {
            // §4.2 — Proposer un revive pub avant de repousser
            // Guard : ne pas re-créer la modale si elle est déjà affichée (évite le spam à 30fps)
            if (!document.getElementById('boss-revive-modal')) {
                G.bossTimer = 999; // stopper le tick pendant que la modale est ouverte
                if (adCapAvailable('bossRevive')) {
                    _showBossReviveOffer();
                } else if (G.currentStage) {
                    // ── Mode stage (Phase 3) : temps écoulé = défaite du stage ──
                    finishStage(false);
                } else {
                    showNotif("⏱️ Temps écoulé ! Le Boss vous repousse d'une zone.");
                    G.isBoss = false; G.monsterIndex = 0;
                    if (G.zone > 1) G.zone--;
                    spawnMonster(); (markSaveDirty(), saveGame());
                }
            }
        }
    }

    // — Attaque du monstre —
    const now = Date.now();
    let shouldAttack = false;
    const spawnElapsed = now - G.monsterSpawnTime;
    if (!G.monsterFirstAttackDone) {
        if (spawnElapsed >= 1000) {
            shouldAttack = true;
            G.monsterFirstAttackDone = true;
            lastMonsterAttack = now;
        }
    } else {
        const attackInterval = G.isBoss ? 1500 : 2500;
        if (now - lastMonsterAttack >= attackInterval) {
            shouldAttack = true;
            lastMonsterAttack = now;
        }
    }
    if (shouldAttack && D(G.monsterHp).gt(0) && G.deathTimer <= 0) { // §1.5
        const baseAtk  = getMonsterAttack();
        const atkMod   = G.monsterFrozen > 0 ? 0.5 : G.monsterDebuff > 0 ? 0.6 : 1.0;
        let degatsBruts = baseAtk * atkMod;
        if (G.mitigationActive) degatsBruts *= 0.5;
        const finalDmg = Math.max(1, Math.ceil(degatsBruts - (G.partyDef * 0.5)));
        G.partyHp = Math.max(0, G.partyHp - finalDmg);
        updatePartyHpBar();
        screenFlash('rgba(231,76,60,0.25)');
        triggerScreenShake();
        spawnBloodyDamageNumber(finalDmg, false);
        Sound.playHit();
        if (G.partyHp <= 0) handleSquadDeath();
    }

    // — Cooldowns & statuts —
    Object.keys(G.bbCooldowns).forEach(k => { if(G.bbCooldowns[k]>0) G.bbCooldowns[k] = Math.max(0, G.bbCooldowns[k]-dt); });
    Object.keys(G.playerSkillsCd).forEach(k => { if(G.playerSkillsCd[k]>0) G.playerSkillsCd[k] = Math.max(0, G.playerSkillsCd[k]-dt); });
    if (G.monsterFrozen > 0) { G.monsterFrozen = Math.max(0, G.monsterFrozen - dt); _applyMonsterFilter(document.getElementById('monster-emoji'), ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].bgHue); }
    if (G.monsterDebuff > 0) { G.monsterDebuff = Math.max(0, G.monsterDebuff - dt); _applyMonsterFilter(document.getElementById('monster-emoji'), ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].bgHue); }

    let activeOverlay = false;
    Object.keys(G.playerSkillsActive).forEach(k => {
        if (G.playerSkillsActive[k] > 0) {
            G.playerSkillsActive[k] = Math.max(0, G.playerSkillsActive[k] - dt);
            if (k === 'frenzy') activeOverlay = true;
        }
    });
    document.getElementById('skill-active-overlay').style.display = activeOverlay ? 'block' : 'none';

    if (D(G.monsterHp).gt(0)) updateDisplays(); // §1.5
}
