// =============================================================
// UI DISPLAYS & GRIDS
// =============================================================
// P3 §3.3 — throttle : barre 10 Hz, texte 5 Hz (appels force aux spawns/loads)
let _hpBarAt = 0, _hpTxtAt = 0;
function updateHpBar(force = false) {
    const now = performance.now();
    if (!force && now - _hpBarAt < 100) return;
    _hpBarAt = now;
    const pct = Math.max(0, D(G.monsterHp).div(G.monsterMaxHp).toNumber() * 100); // §1.5
    
    const fillEl = document.getElementById('hp-bar-fill');
    const delayEl = document.getElementById('hp-bar-delay');
    if (fillEl) fillEl.style.width = pct + '%';
    if (delayEl) delayEl.style.width = pct + '%';
    
    const container = document.querySelector('.monster-container .hp-bar-container');
    if (container) {
        if (pct > 0 && pct < 20) {
            container.classList.add('pulse-low-hp');
        } else {
            container.classList.remove('pulse-low-hp');
        }
    }
    
    if (force || now - _hpTxtAt >= 200) {
        _hpTxtAt = now;
        document.getElementById('hp-text').textContent = `${fmt(Math.max(0, G.monsterHp))} / ${fmt(G.monsterMaxHp)}`;
    }
}

function updateMonsterUI() {
    const container = document.getElementById('monster-emoji-container');
    if (container) {
        if (G.isTestCombat) {
            container.classList.add('ogre-layout');
        } else {
            container.classList.remove('ogre-layout');
        }
    }

    if (G.isTestCombat) {
        document.getElementById('zone-name').textContent = "Arène de Test";
        document.getElementById('zone-progress').textContent = "🤖 Vie Infinie";
        const badge = document.getElementById('zone-elem-badge');
        badge.innerHTML = "🌐 Neutre";
        badge.style.background = "#8A93A6";
        const me = document.getElementById('monster-emoji');
        applyBiomeBg(0);
        me.src = "assets/img-combat/boss ogre.png";
        me.style.filter = "drop-shadow(0 8px 20px rgba(0,0,0,0.6))";
        document.getElementById('monster-name').textContent = "Boss Ogre";
        document.getElementById('boss-label').style.display = 'none';
        document.getElementById('boss-timer').style.display = 'none';
        updateHpBar(true);
        return;
    }
    const theme  = ZONE_THEMES[(G.zone-1) % ZONE_THEMES.length];
    const tier   = Math.floor((G.zone-1) / ZONE_THEMES.length);
    const prefix = TIER_PREFIXES[Math.min(tier, TIER_PREFIXES.length-1)];

    document.getElementById('zone-name').textContent = `Zone ${G.zone} — ${theme.name}`;
    document.getElementById('zone-progress').textContent = G.isBoss ? '👑 BOSS' : `Monstre ${G.monsterIndex+1} / 10`;

    const badge = document.getElementById('zone-elem-badge');
    badge.innerHTML = `${ELEM_ICONS[theme.elem] || ''} ${theme.elem}`;
    badge.style.background = ELEM_COLORS[theme.elem];

    const me = document.getElementById('monster-emoji');
    const biomeIdx = (G.zone - 1) % ZONE_THEMES.length;
    applyBiomeBg(biomeIdx); // fond de zone dynamique
    const mType    = G.monsterIndex < 4 ? 0 : G.monsterIndex < 7 ? 1 : 2;
    const imgIdx   = G.isBoss ? 3 : mType;

    // Cherche l'image spécifique du biome, sinon fallback sur les sprites Feu
    const biomeImgs = MONSTER_IMAGES[biomeIdx];
    const imgPath   = biomeImgs ? biomeImgs[imgIdx] : MONSTER_IMAGES[0][imgIdx];
    me.src = imgPath;

    // Applique hue-rotate seulement pour les biomes sans sprites propres
    _applyMonsterFilter(me, biomeImgs ? 0 : theme.bgHue);

    // CORRECTION : On ne touche plus à la hauteur ici pour éviter les conflits de taille
    if (G.isBoss) {
        document.getElementById('monster-name').textContent = prefix + theme.bossName;
    } else {
        document.getElementById('monster-name').textContent = prefix + theme.monsters[mType];
    }

    document.getElementById('boss-label').style.display = G.isBoss ? 'inline-flex' : 'none';
    document.getElementById('boss-timer').style.display = G.isBoss ? 'block' : 'none';
    updateHpBar(true);
}

function _applyMonsterFilter(el, hue) {
    const freeze = G.monsterFrozen > 0;
    const debuff = G.monsterDebuff > 0;
    const h = hue > 0 ? `hue-rotate(${hue}deg) ` : ''; // pas de teinte si sprite propre
    
    const isBossZone10 = (G.zone % 10 === 0 && G.isBoss);
    const bossShadow = isBossZone10 ? ' drop-shadow(0 10px 20px rgba(255, 0, 0, 0.3))' : '';

    if (freeze) {
        el.style.filter = `${h}brightness(1.4) saturate(0.4) drop-shadow(0 0 18px rgba(100,200,255,0.95))` + bossShadow;
    } else if (debuff) {
        el.style.filter = `${h}drop-shadow(0 0 14px rgba(160,0,255,0.85)) drop-shadow(0 8px 20px rgba(0,0,0,.6))` + bossShadow;
    } else {
        el.style.filter = `${h}drop-shadow(0 8px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 14px ${_biomeGlowColor})` + bossShadow;
    }
}


let _updAt = 0, _updTimer = null;
function updateDisplays() {
    // P3 §3.3 — throttle 5 Hz (l'œil ne lit pas plus vite) + appel traînant
    const _now = performance.now();
    if (_now - _updAt < 200) {
        if (!_updTimer) _updTimer = setTimeout(() => { _updTimer = null; updateDisplays(); }, 210 - (_now - _updAt));
        return;
    }
    _updAt = _now;
    document.getElementById('gold-display').innerHTML = `<i class="ra ra-gold-bar"></i> ${fmt(G.gold)}`;
    document.getElementById('gems-display').innerHTML = `<i class="ra ra-gem"></i> ${G.gems}`;
    document.getElementById('honor-display').innerHTML = `<i class='ra ra-sword'></i> ${fmt(G.honorPoints)} PH`;
    
    let dps = getTotalDPS();
    let dpsStr = fmt(dps);
    if(G.playerSkillsActive.frenzy > 0) dpsStr = `<span style="color:#f1c40f">${fmt(dps*3)} (Frénésie)</span>`;
    document.getElementById('dps-display').innerHTML = `<i class='ra ra-sword'></i> DPS : ${dpsStr}/s`;
    document.getElementById('tap-dmg-val').textContent = '+' + getSupportPower() + ' BC';
    
    // §2.1 — Éveils I/II/III uniquement (cap 25 supprimé)
    // §2.1 — Éveils I/II/III uniquement (cap 25 supprimé)
    const _tapAwakenings = [10, 50, 100];
    const nextTapAwakening = _tapAwakenings.find(m => m > G.tapDamageLevel);
    document.getElementById('tap-next-ms').textContent = nextTapAwakening
        ? 'Prochain Eveil Soutien : Niv.' + nextTapAwakening + ' (+' + (3 + Math.floor(nextTapAwakening * 0.4)) + ' BC/tap)'
        : 'Soutien Maitre -- Max BC/tap atteint !';

    // §3.1 — renderFooterBB et renderMaterialsPanel retirés du tick 100ms :
    // ils sont appelés à la demand sur événement (achat, kill, ouverture d'onglet)
    if(document.querySelector('.tab-btn[data-tab="skills"]')?.classList.contains('active')) renderSkills();
    renderObjectiveBar();

    const autoBtn = document.getElementById('combat-auto-btn');
    if (autoBtn) {
        if (G.autoCombat) {
            autoBtn.classList.add('active');
            autoBtn.textContent = 'AUTO ON';
        } else {
            autoBtn.classList.remove('active');
            autoBtn.textContent = 'AUTO OFF';
        }
    }

    _updateSummonGlow();
}

function renderSquadGrid() {
    const container = document.getElementById('squad-grid');
    container.innerHTML = '';
    
    const maxSlots = Math.max(4, G.maxSquadSize || 4);
    // Ensure squad array is large enough
    while (G.squad.length < maxSlots) G.squad.push(null);
    // Update grid columns dynamically
    container.style.gridTemplateColumns = `repeat(${maxSlots}, 1fr)`;

    for (let i = 0; i < maxSlots; i++) {
        const id = G.squad[i];
        const h = G.heroes[id];
        const def = id ? HERO_DEFS.find(d => d.id === id) : null;

        const card = document.createElement('div');
        const gauge = id ? (G.bbGauges[id] || 0) : 0;
        const isExtra = i >= 4;
        card.className = `squad-slot-card ${id ? 'filled' : ''} ${i === 0 ? 'leader-slot' : ''} ${gauge >= 100 ? 'bb-ready' : ''} ${isExtra ? 'squad-slot-5' : ''}`;

        if (id && h && def) {
            const gauge = G.bbGauges[id] || 0;
            card.innerHTML = `
                <img src="${getHeroImage(id, h.stars, 'squad')}" alt="">
                <div class="squad-stars">${'★'.repeat(h.stars)}</div>
                <div class="bb-gauge-fill" style="width:${gauge}%"></div>
                <div class="squad-badge" style="background:${i === 0 ? 'linear-gradient(90deg, #f1c40f, #e67e22)' : 'rgba(0,0,0,0.75)'}">
                    ${i === 0 ? '👑 LEADER' : def.elem}
                </div>
            `;
            card.onclick = () => openHeroModal(id);
        } else {
            card.innerHTML = `<div class="squad-slot-empty-icon">${isExtra ? '⭐' : '<i class="ra ra-shield"></i>'}</div><div class="squad-slot-empty-lbl">${isExtra ? 'BONUS' : 'LIBRE'}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
                const listBtn = document.querySelector('.tab-btn[data-tab="heroes"]');
                listBtn.classList.add('active');
                document.getElementById('panel-heroes').classList.add('active');
            };
        }

        container.appendChild(card);
    }
    
    const badge = document.getElementById('squad-ls-badge');
    const leaderId = G.squad[0];
    if (leaderId && G.heroes[leaderId]) {
        const lDef = HERO_DEFS.find(d => d.id === leaderId);
        badge.textContent = `LS Leader: ${getLeaderSkillName(lDef.id)}`;
    } else {
        badge.textContent = 'Leader Skill: Aucun';
    }
}

function getLeaderSkillName(id) {
    const ls = {
        ignis:   "Colère d'Agni (+50% DPS Feu)",
        vargas:  "Moral de Combat (+20% DPS team)",
        selena:  "Prêtresse d'Eau (+30% HP, +25% Gold)",
        margonia: "Maîtrise du Givre (+35% DPS Eau)",
        lance:   "Rempart de Gaïa (+40% DEF, +20% HP)",
        zeln:    "Instinct du Chasseur (+30% DPS Terre)",
        karl:    "Force Draconique (+40% DPS Foudre/Ténèbres)",
        eze:     "Foudre Alpha (+50% Crit mult, +20% Clic)",
        sera:    "Créateur Suprême (+30% DPS team)",
        atro:    "Lumière Sacrée (+40% DPS Lumière, +15% all)",
        magress: "Tyrannie des Ombres (+50% DPS Ténèbres)",
        kikuri:  "Malédiction Éternelle (+10% DPS team)",
    };
    return ls[id] || 'Aucun';
}

function getHeroPrice(def) {
    // §2.2 — Grille recalibrée + entrelacement multi-élément
    const priceMap = {
        // VAGUE 1 — couverture multi-élément (1 attaquant par élément, prix doux)
        ignis:   0,        // Feu
        selena:  800,      // Eau
        lance:   4000,     // Terre
        karl:    18000,    // Foudre
        kikuri:  70000,    // Ténèbres
        atro:    200000,   // Lumière
        // VAGUE 2 — le second héros (plus fort) de chaque élément (chasse long terme)
        vargas:  600000,   // Feu
        margonia:1500000,  // Eau
        zeln:    4000000,  // Terre
        eze:     10000000, // Foudre
        magress: 30000000, // Ténèbres
        sera:    70000000, // Lumière
    };
    return priceMap[def.id] !== undefined ? priceMap[def.id] : (def.baseDPS * 15000);
}

function renderHeroesGrid() {
    const grid = document.getElementById('heroes-grid');
    grid.innerHTML = '';
    const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;

    // Tri par prix : la grille suit l'ordre réel de déblocage (éléments entrelacés)
    const ordered = [...HERO_DEFS].sort((a, b) => getHeroPrice(a) - getHeroPrice(b));
    ordered.forEach(def => {
        const h = G.heroes[def.id];
        const locked = !h;
        const hasAdvantage = !locked && ELEMENT_ADVANTAGE[def.elem] === currentZoneElem;
        const inSquad = G.squad.includes(def.id);
        const isLeader = G.squad[0] === def.id;

        const div = document.createElement('div');
        div.className = `hero-mini-card ${locked ? 'locked' : `evo-${h.stars}`}`;

        if (!locked) {
            const expPct = (h.level / EVO_LEVEL_CAPS[h.stars]) * 100;
            div.innerHTML = `
                <img src="${getHeroImage(def.id, h.stars, 'squad')}" alt="" loading="lazy" decoding="async">
                <div class="hero-mini-elem">${def.icon}</div>
                ${inSquad ? `<div class="hero-mini-squad-badge">${isLeader ? '👑' : '⚔'}</div>` : ''}
                ${hasAdvantage ? `<div class="hero-mini-adv">🔺</div>` : ''}
                <div class="hero-mini-info">
                    <span class="hero-mini-stars">${'★'.repeat(h.stars)}</span>
                    <span class="hero-mini-name">${def.titles[h.stars - 3]}</span>
                    <span class="hero-mini-level">Lv.${h.level} / ${EVO_LEVEL_CAPS[h.stars]}</span>
                </div>
                <div class="hero-mini-exp-bar">
                    <div class="hero-mini-exp-fill" style="width:${expPct}%"></div>
                </div>
            `;
            div.onclick = () => openHeroModal(def.id);
        } else {
            // Héros non possédé — affichage selon mode d'obtention
            let acquireLabel, acquireColor;
            if (GOLD_BUYABLE_HEROES.includes(def.id)) {
                const price = getHeroPrice(def);
                acquireLabel = price === 0 ? '🆓 Gratuit' : `${fmt(price)} Or`;
                acquireColor = '#f1c40f';
            } else if (GEMS_GACHA_HEROES.includes(def.id)) {
                acquireLabel = '<i class="ra ra-crystal-ball"></i> Gacha 5💎';
                acquireColor = '#00d2ff';
            } else {
                acquireLabel = '🏆 Gacha 500PH';
                acquireColor = '#c084fc';
            }
            div.innerHTML = `
                <img src="${getHeroImage(def.id, 3, 'squad')}" alt="" loading="lazy" decoding="async">
                <div class="hero-mini-elem">${def.icon}</div>
                <div class="hero-mini-info">
                    <span class="hero-mini-stars">${'★'.repeat(3)}</span>
                    <span class="hero-mini-name" style="color:#a0b0c0">${def.titles[0]}</span>
                    <span class="hero-mini-level" style="color:${acquireColor}">${acquireLabel}</span>
                </div>
            `;
            div.onclick = () => openHeroModal(def.id);
        }

        grid.appendChild(div);
    });

    renderSquadGrid();
    updatePartyStats();
    renderSynergies();
    renderFormations();
}

function upgradeTap(times = 1) {
    Sound.init();
    // CORRECTION : Passage de 1.05 à 1.14 pour indexer le coût sur l'économie réelle
    let currentCost = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel));
    
    if (times === 1) {
        if (D(G.gold).gte(currentCost)) { // §1.5
            G.gold = D(G.gold).sub(currentCost);
            G.tapDamageLevel++;
            Sound.playLevelUp();
        }
    } else if (times === 10) {
        let totalCost = 0;
        for (let i = 0; i < 10; i++) {
            totalCost += Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + i));
        }
        if (D(G.gold).gte(totalCost)) { // §1.5
            G.gold = D(G.gold).sub(totalCost);
            G.tapDamageLevel += 10;
            Sound.playLevelUp();
        } else {
            showNotif("❌ Pas assez d'Or pour l'amélioration ×10 !");
        }
    } else if (times === 'max') {
        let count = 0;
        let totalCost = 0;
        while (true) {
            let nextCost = Math.floor(10 * Math.pow(1.14, G.tapDamageLevel + count));
            if (D(G.gold).gte(D(totalCost).add(nextCost))) { // §1.5
                totalCost += nextCost;
                count++;
            } else {
                break;
            }
        }
        if (count > 0) {
            G.gold = D(G.gold).sub(totalCost); // §1.5
            G.tapDamageLevel += count;
            Sound.playLevelUp();
            showNotif(`✨ Soutien Actif amélioré de +${count} niveaux ! (+${getSupportPower()} BC/tap)`);
        } else {
            showNotif("❌ Pas assez d'Or pour améliorer le Tap !");
        }
    }
    updateDisplays();
    (markSaveDirty(), saveGame());
}

function buyCurrentHero() {
    if (!currentHeroModal) return;
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    if (!def || G.heroes[def.id]) return;

    // Option A — bloquer l'achat or pour les héros gacha
    if (!GOLD_BUYABLE_HEROES.includes(def.id)) {
        showNotif('❌ Ce héros s\'obtient uniquement via Gacha !');
        return;
    }

    const price = getHeroPrice(def);
    if (price > 0 && D(G.gold).lt(price)) { // §1.5
        showNotif(`❌ Pas assez d'Or ! (${fmt(G.gold)} / ${fmt(price)} Or)`);
        return;
    }

    G.gold = D(G.gold).sub(price); // §1.5
    const summonedType = HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)];
    G.heroes[def.id] = initHero(summonedType, def.id); // §2.2 ①
    
    // Auto add to squad if space
    const emptyIdx = G.squad.indexOf(null);
    if (emptyIdx >= 0) { G.squad[emptyIdx] = def.id; if (emptyIdx === 0) G.leaderId = def.id; }
    
    Sound.init(); Sound.playLevelUp();
    showNotif(`✨ ${def.titles[0]} rejoint l'équipe !`);
    (markSaveDirty(), saveGame());
    updateDisplays();
    openHeroModal(def.id);
    renderHeroesGrid();
}

function equipSphere(sphereId) {
    if (!currentHeroModal || !G.heroes[currentHeroModal]) return;
    const h = G.heroes[currentHeroModal];
    
    // Unequip current sphere
    if (h.equippedSphere) {
        if (!G.spheres[h.equippedSphere]) G.spheres[h.equippedSphere] = 0;
        G.spheres[h.equippedSphere]++;
        h.equippedSphere = null;
    }
    
    // Equip new sphere
    if (sphereId !== 'none' && SPHERE_DEFS[sphereId] && G.spheres[sphereId] > 0) {
        G.spheres[sphereId]--;
        h.equippedSphere = sphereId;
    }
    
    (markSaveDirty(), saveGame());
    updateDisplays();
    openHeroModal(currentHeroModal);
}

let currentHeroModal = null;
function openHeroModal(id) {
    currentHeroModal = id;
    const def = HERO_DEFS.find(d=>d.id===id);
    const h = G.heroes[id];
    
    const modal = document.getElementById('hero-modal');
    modal.style.setProperty('--hero-theme-color', ELEM_COLORS[def.elem] || '#fff');
    
    const lvlBadge = document.getElementById('hm-header-lvl');
    if (lvlBadge) lvlBadge.textContent = 'Lv.' + (h ? h.level : '1');
    
    const sphereIconEl = document.getElementById('hm-slot-sphere-icon');
    if (sphereIconEl) {
        if (h && h.equippedSphere && SPHERE_DEFS[h.equippedSphere]) {
            const icons = {
                bijou_sacre: '<i class="ra ra-gem" style="color:#00d2ff"></i>',
                barre_legwand: '<i class="ra ra-gold-bar" style="color:#f1c40f"></i>',
                pierre_choc: '<i class="ra ra-crossed-swords" style="color:#e74c3c"></i>'
            };
            sphereIconEl.innerHTML = icons[h.equippedSphere] || '💎';
        } else {
            sphereIconEl.innerHTML = '<i class="ra ra-plus"></i>';
        }
    }
    
    if (!h) {
        // --- PURCHASE MODE ---
        document.getElementById('hm-title').textContent = def.titles[0] + ' (Contrat)';
        const img = document.getElementById('hm-image'); img.src = getHeroImage(id, 3, 'full');
        document.getElementById('hm-stars').textContent = '★★★';
        document.getElementById('hm-elem').innerHTML = def.icon;
        document.getElementById('hm-lore').textContent = `"${def.lore}"`;
        
        document.getElementById('hm-type').textContent = 'Inconnu';
        document.getElementById('hm-lvl').textContent = '1 / 50';
        document.getElementById('hm-dps').textContent = fmt(def.baseDPS);
        document.getElementById('hm-hp-def').textContent = '??? HP / ??? DEF';
        document.getElementById('hm-lb').textContent = '+0%';
        document.getElementById('hm-ls').textContent = getLeaderSkillName(def.id);
        document.getElementById('hm-next-cap').textContent = 'Rejoignez l\'équipe pour dévoiler son potentiel.';
        document.getElementById('hm-evo-mats-row').style.display = 'none';
        document.getElementById('hm-sphere-row').style.display = 'none';

        document.getElementById('hm-actions-owned').style.display = 'none';
        const actionsBuy = document.getElementById('hm-actions-buy');
        actionsBuy.style.display = 'block';

        const btnBuy = document.getElementById('hm-btn-buy');
        if (GOLD_BUYABLE_HEROES.includes(def.id)) {
            // ── Achat or classique ──
            const price = getHeroPrice(def);
            btnBuy.innerHTML = `<span style="font-size:14px">${price === 0 ? 'Débloquer gratuitement' : 'Acheter Héros'}</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">${price === 0 ? '🆓 Gratuit' : fmt(price) + ' 🪙'}</span>`;
            btnBuy.disabled = price > 0 && D(G.gold).lt(price); // §1.5
            btnBuy.onclick = buyCurrentHero;
        } else if (GEMS_GACHA_HEROES.includes(def.id)) {
            // ── Héros Tier S/A → gacha gemmes ──
            btnBuy.innerHTML = `<span style="font-size:14px"><i class='ra ra-crystal-ball'></i> Invoquer</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">Rare Summon (5💎)</span>`;
            btnBuy.disabled = G.gems < 5;
            btnBuy.onclick = () => { closeHeroModal(); summonRare(); };
        } else {
            // ── Héros Tier B-mid → gacha PH ──
            btnBuy.innerHTML = `<span style="font-size:14px"><i class="ra ra-trophy"></i> Invoquer</span><br><span id="hm-cost-buy" style="font-size:11px;opacity:0.8">Honor Summon (500 PH)</span>`;
            btnBuy.disabled = G.honorPoints < 500;
            btnBuy.onclick = () => { closeHeroModal(); summonHonor(); };
        }
    } else {
        // --- OWNED MODE ---
        document.getElementById('hm-actions-buy').style.display = 'none';
        document.getElementById('hm-actions-owned').style.display = 'flex';
        
        const maxLvl = EVO_LEVEL_CAPS[h.stars];
        const evoTargetStars = h.stars + 1;
        const evoZoneGate = (evoTargetStars <= 6) ? EVO_ZONE_GATES[evoTargetStars] : 999;
        const canEvolve = h.level >= maxLvl && h.stars < 6 && G.maxZone >= evoZoneGate;
        
        document.getElementById('hm-title').textContent = def.titles[h.stars - 3] + ` (${h.type})`;
        const img = document.getElementById('hm-image'); img.src = getHeroImage(id, h.stars, 'full');
        document.getElementById('hm-stars').textContent = '★'.repeat(h.stars);
        document.getElementById('hm-elem').innerHTML = def.icon;
        document.getElementById('hm-lore').textContent = `"${def.lore}"`;
        
        document.getElementById('hm-type').textContent = h.type || 'Lord';
        document.getElementById('hm-lvl').textContent = `${h.level} / ${maxLvl}`;
        document.getElementById('hm-dps').textContent = fmt(getHeroDPS(def, h));
        
        const tMod = TYPE_MODS[h.type || 'Lord'];
        const hHp = def.baseDPS * 18 * h.level * h.stars * tMod.hp;
        const hDef = def.baseDPS * 1.5 * h.level * h.stars * tMod.def;
        document.getElementById('hm-hp-def').textContent = `${fmt(hHp)} HP / ${fmt(hDef)} DEF`;
        
        document.getElementById('hm-lb').textContent = `+${h.duplicates * 10}%`;
        document.getElementById('hm-ls').textContent = getLeaderSkillName(def.id);
        
        // §2.1 — Éveils I/II/III uniquement
        const _heroAwakenings = [10, 50, 100];
        const nextHeroAwakening = _heroAwakenings.find(m => m > h.level);
        document.getElementById('hm-next-cap').textContent = nextHeroAwakening
            ? `Prochain Éveil : ${MILESTONE_LABELS[nextHeroAwakening]} (Niv.${nextHeroAwakening})`
            : '✦✦✦ Tous les Éveils atteints';

        // SPHERES
        document.getElementById('hm-sphere-row').style.display = 'flex';
        const sphereSelect = document.getElementById('hm-sphere-select');
        let optionsHtml = `<option value="none">-- Aucune --</option>`;
        if (h.equippedSphere && SPHERE_DEFS[h.equippedSphere]) {
            optionsHtml += `<option value="${h.equippedSphere}" selected>${SPHERE_DEFS[h.equippedSphere].name} (Équipée)</option>`;
        }
        Object.keys(G.spheres).forEach(sId => {
            if (G.spheres[sId] > 0 && SPHERE_DEFS[sId]) {
                optionsHtml += `<option value="${sId}">${SPHERE_DEFS[sId].name} (${G.spheres[sId]})</option>`;
            }
        });
        sphereSelect.innerHTML = optionsHtml;

        const lvlRow = document.getElementById('hm-levelup-row');
        if (h.level < maxLvl) {
            const remaining = maxLvl - h.level;
            const cost1   = getHeroLevelCost(def, h);
            const levels10 = Math.min(10, remaining);
            const cost10  = calcBulkCost(def, h, levels10);
            const costMax = calcBulkCost(def, h, remaining);
            const canAny  = D(G.gold).gte(cost1); // §1.5

            const btn1 = document.getElementById('hm-btn-lvlup');
            btn1.disabled = !canAny;
            document.getElementById('hm-cost-1').textContent = fmt(cost1) + ' Or';

            const btn10 = document.getElementById('hm-btn-lvlup10');
            btn10.disabled = !canAny;
            document.getElementById('hm-cost-10').textContent =
                levels10 < 10 ? `×${levels10} — ${fmt(cost10)} Or` : `${fmt(cost10)} Or`;

            const { count: affordCount, cost: affordCost } = calcAffordableLevels(def, h, remaining);
            const btnMax = document.getElementById('hm-btn-lvlupmax');
            btnMax.disabled = affordCount === 0;
            document.getElementById('hm-cost-max').textContent =
                affordCount > 0 ? `×${affordCount} — ${fmt(affordCost)} Or` : 'Or insuffisant';

            lvlRow.style.display = 'flex';
        } else {
            lvlRow.style.display = 'none';
        }

        const btnEvo = document.getElementById('hm-btn-evolve');
        const evoRow = document.getElementById('hm-evo-mats-row');
        
        if (h.stars < 6 && h.level >= maxLvl) {
            if (!canEvolve) {
                btnEvo.textContent = `🔒 Zone ${evoZoneGate - 1} Boss requis pour ${evoTargetStars}★`;
                btnEvo.disabled = true;
                btnEvo.style.display = 'block';
                evoRow.style.display = 'none';
            } else {
                const evoCost = EVO_COSTS[h.stars];
                btnEvo.textContent = `Évoluer en ${h.stars+1}★ (${fmt(evoCost)} 🪙)`;
                
                evoRow.style.display = 'flex';
                const reqs = getEvolutionRequirements(def.elem, h.stars);
                let listStr = "";
                let hasMats = true;
                
                reqs.forEach(req => {
                    if (req.item === 'duplicate') {
                        const owned = h.duplicates || 0;
                        const color = owned >= req.qty ? '#2ecc71' : '#e74c3c';
                        listStr += `<span style="color:${color}">Doublons sacrifiés : ${owned} / ${req.qty}</span>`;
                        if (owned < req.qty) hasMats = false;
                    } else {
                        const owned = G.materials[req.item] || 0;
                        const matName = MATERIAL_DEFS[req.item].name;
                        const color = owned >= req.qty ? '#2ecc71' : '#e74c3c';
                        listStr += `<span style="color:${color}">${matName} : ${owned} / ${req.qty}</span>`;
                        if (owned < req.qty) hasMats = false;
                    }
                });
                
                document.getElementById('hm-evo-mats-list').innerHTML = listStr;
                btnEvo.disabled = D(G.gold).lt(evoCost) || !hasMats; // §1.5
                btnEvo.style.display = 'block';
            }
        } else {
            btnEvo.style.display = 'none';
            evoRow.style.display = 'none';
        }
        
        const squadBtn = document.getElementById('hm-btn-squad');
        const inSquad = G.squad.includes(id);
        if (inSquad) {
            const isLeader = G.squad[0] === id;
            squadBtn.textContent = isLeader ? "Retirer de la Squad (Déjà Leader)" : "Promouvoir Leader / Retirer";
        } else {
            squadBtn.textContent = "Ajouter à la Squad";
        }
    }

    // Evo progress bar (Amélioration 3.3)
    if (G.heroes[id]) renderEvoProgressBar(id);

    document.getElementById('hero-modal').classList.add('visible');
    BGM.update();
}

function toggleSphereSelect() {
    const row = document.getElementById('hm-sphere-row');
    if (row.style.display === 'none' || row.style.display === '') {
        row.style.display = 'flex';
    } else {
        row.style.display = 'none';
    }
}

function getEvolutionRequirements(elem, stars) {
    const elemLower = elem === 'Feu' ? 'fire' : elem === 'Eau' ? 'water' : elem === 'Terre' ? 'earth' : elem === 'Foudre' ? 'thunder' : elem === 'Lumière' ? 'light' : 'dark';
    // §ÉCO — recettes pilotées par EVO_MATS (src/data/balance.js), indexées par étoiles CIBLE.
    // Clés génériques crystal/idol/totem → préfixées par l'élément ; mimic = universel.
    // Indexé par étoiles ACTUELLES (comme EVO_COSTS) : EVO_MATS[3] = recette 3★→4★, etc.
    const recipe = (typeof EVO_MATS !== 'undefined' && EVO_MATS[stars]) ? EVO_MATS[stars] : null;
    if (recipe) {
        return Object.entries(recipe).map(([key, qty]) =>
            key === 'mimic' ? { item: 'mimic', qty }
                            : { item: `${elemLower}_${key}`, qty });
    }
    // ── Repli (ancien comportement) si EVO_MATS indisponible ──
    if (stars === 3) {
        return [ { item: `${elemLower}_crystal`, qty: 1 }, { item: 'mimic', qty: 1 } ];
    } else if (stars === 4) {
        return [ { item: `${elemLower}_crystal`, qty: 1 }, { item: `${elemLower}_idol`, qty: 1 }, { item: 'mimic', qty: 1 } ];
    } else if (stars === 5) {
        return [ { item: `${elemLower}_idol`, qty: 1 }, { item: `${elemLower}_totem`, qty: 1 }, { item: 'mimic', qty: 2 } ];
    }
    return [];
}

function closeHeroModal() { document.getElementById('hero-modal').classList.remove('visible'); renderHeroesGrid(); BGM.update(); }

// §2.1 — Détecte les passages d'Éveil et déclenche la célébration
const _AWAKENING_LEVELS = [10, 50, 100];
const _AWAKENING_NAMES  = { 10: 'Éveil I', 50: 'Éveil II', 100: 'Éveil III' };
const _AWAKENING_GEMS   = { 10: 3, 50: 5, 100: 10 };
function _checkHeroAwakening(heroId, def, prevLevel, newLevel) {
    _AWAKENING_LEVELS.forEach(threshold => {
        if (prevLevel < threshold && newLevel >= threshold) {
            const name = _AWAKENING_NAMES[threshold];
            const gemReward = _AWAKENING_GEMS[threshold];
            G.gems += gemReward;
            setTimeout(() => {
                showNotif(`✦ ${def.titles[def.titles.length - 1] || def.id} — ${name} atteint ! +${gemReward} Gemmes`);
                screenFlash('rgba(255,215,0,0.35)');
            }, 200);
        }
    });
}

function levelUpCurrentHero(times = 1) {
    const h = G.heroes[currentHeroModal];
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    const cap = EVO_LEVEL_CAPS[h.stars];
    if (h.level >= cap) return;

    if (times === 'max') {
        // CORRECTION MAJEURE : On calcule le maximum de niveaux achetables avec l'Or ACTUEL du joueur
        const remainingToCap = cap - h.level;
        const { count, cost } = calcAffordableLevels(def, h, remainingToCap);
        
        if (count > 0) {
            const prevLevel = h.level;
            G.gold = D(G.gold).sub(cost); // §1.5
            h.level += count;
            Sound.playLevelUp();
            showNotif(`⬆ ${def.titles[h.stars - 3]} a gagné +${count} niveaux !`);
            _checkHeroAwakening(currentHeroModal, def, prevLevel, h.level); // §2.1
        } else {
            showNotif("❌ Pas assez d'Or pour acheter un niveau !");
        }
    } else {
        // Mode classique +1 ou +10
        const maxLevels = Math.min(times, cap - h.level);
        const { count, cost } = calcAffordableLevels(def, h, maxLevels);
        if (count > 0) {
            const prevLevel = h.level;
            G.gold = D(G.gold).sub(cost); // §1.5
            h.level += count;
            Sound.playLevelUp();
            _checkHeroAwakening(currentHeroModal, def, prevLevel, h.level); // §2.1
        }
    }
    
    openHeroModal(currentHeroModal);
    (markSaveDirty(), saveGame());
    updateDisplays();
}

function evolveCurrentHero() {
    const h = G.heroes[currentHeroModal];
    const def = HERO_DEFS.find(d => d.id === currentHeroModal);
    const cost = EVO_COSTS[h.stars];
    const reqs = getEvolutionRequirements(def.elem, h.stars);
    
    // Axe 3 : vérification de zone
    const evoTargetStars = h.stars + 1;
    const evoZoneGate = (evoTargetStars <= 6) ? EVO_ZONE_GATES[evoTargetStars] : 999;
    if (G.maxZone < evoZoneGate) {
        showNotif(`🔒 Zone ${evoZoneGate - 1} Boss requis pour évoluer en ${evoTargetStars}★ !`);
        return;
    }
    
    let hasMats = true;
    reqs.forEach(req => {
        if (req.item === 'duplicate') {
            if ((h.duplicates || 0) < req.qty) hasMats = false;  // Axe 4 : doublons
        } else {
            const owned = G.materials[req.item] || 0;
            if (owned < req.qty) hasMats = false;
        }
    });
    
    if(D(G.gold).gte(cost) && h.level >= EVO_LEVEL_CAPS[h.stars] && h.stars < 6 && hasMats) { // §1.5
        G.gold = D(G.gold).sub(cost); // §1.5
        reqs.forEach(req => {
            if (req.item === 'duplicate') {
                h.duplicates -= req.qty;    // Axe 4 : consomme les doublons
            } else {
                G.materials[req.item] -= req.qty;
            }
        });
        h.stars++; h.level = 1; Sound.playLevelUp(); screenFlash('#fff'); openHeroModal(currentHeroModal);
        // Pilier 3: achievement 6★
        if (h.stars === 6) setTimeout(() => triggerAchievementShare('hero_6star', { heroId: currentHeroModal }), 600);
        (markSaveDirty(), saveGame());
    }
}

function toggleSquadCurrentHero() {
    const id = currentHeroModal;
    const index = G.squad.indexOf(id);
    
    if (index >= 0) {
        if (index === 0) {
            const others = G.squad.slice(1).filter(s => s !== null);
            if (others.length === 0) {
                alert("Vous devez garder au moins 1 héros dans la Squad !");
                return;
            }
            const nextIndex = G.squad.indexOf(others[0]);
            G.squad[nextIndex] = null;
            G.squad[0] = others[0];
            G.leaderId = others[0];
        } else {
            G.squad[index] = G.squad[0];
            G.squad[0] = id;
            G.leaderId = id;
        }
    } else {
        const emptyIndex = G.squad.indexOf(null);
        if (emptyIndex >= 0) {
            G.squad[emptyIndex] = id;
        } else {
            const maxSlots = Math.max(4, G.maxSquadSize || 4);
            G.squad[maxSlots - 1] = id;
        }
        if (!G.squad[0]) { G.squad[0] = id; G.leaderId = id; }
    }
    
    openHeroModal(id);
    renderHeroesGrid();
}
