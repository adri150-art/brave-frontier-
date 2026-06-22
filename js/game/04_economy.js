// =============================================================
// STATS & ECONOMY BALANCING
// =============================================================
// Axe 2 : courbe XP plus raide selon le palier d'étoiles
function getHeroLevelCost(def, hData) {
    // §1.5 — retourne D (50 * 1.30^150 ≈ 6e18, au-delà de 2^53)
    const rates = [0, 0, 0, 1.15, 1.19, 1.24, 1.30];
    const rate = rates[hData.stars] || 1.15;
    return D(def.baseCost).mul(Math.pow(rate, hData.level)).floor();
}

// Calcule le coût total pour N niveaux à partir du niveau actuel (sans limite d'or)
function calcBulkCost(def, h, levels) {
    let total = 0;
    for (let i = 0; i < levels; i++) total += getHeroLevelCost(def, { level: h.level + i });
    return total;
}

// Calcule combien de niveaux on peut acheter avec l'or disponible (plafonné à maxLvl)
function calcAffordableLevels(def, h, maxLevels) {
    const cap = EVO_LEVEL_CAPS[h.stars];
    const limit = Math.min(maxLevels, cap - h.level);
    let total = 0, count = 0;
    for (let i = 0; i < limit; i++) {
        const cost = getHeroLevelCost(def, { level: h.level + i });
        if (D(G.gold).lt(D(total).add(cost))) break; // §1.5
        total += cost; count++;
    }
    return { count, cost: total };
}

function getElementKey(elem) {
    if (!elem) return 'fire';
    const clean = elem.toLowerCase();
    if (clean.includes('feu') || clean === 'fire') return 'fire';
    if (clean.includes('eau') || clean === 'water') return 'water';
    if (clean.includes('terre') || clean === 'earth') return 'earth';
    if (clean.includes('foudre') || clean === 'thunder') return 'thunder';
    if (clean.includes('lumière') || clean.includes('lumiere') || clean === 'light') return 'light';
    if (clean.includes('ténèbres') || clean.includes('tenebres') || clean === 'dark') return 'dark';
    return 'fire';
}

function getHeroStats(def, hData) {
    const role = def.role || 'mage';
    const level = hData.level || 1;
    const limitBreak = hData.limitBreak !== undefined ? hData.limitBreak : (hData.duplicates || 0);
    const stars = hData.stars || 3;
    
    // Budget scaling with stars: 50% increase per star above 3★
    const budgetTotal = def.baseBudget * Math.pow(1.5, stars - 3);
    
    // Distribution ratios by Role
    let dpsRatio = 0.75, hpRatio = 0.15, defRatio = 0.10;
    if (role === 'tank') {
        dpsRatio = 0.15; hpRatio = 0.50; defRatio = 0.35;
    } else if (role === 'support') {
        dpsRatio = 0.40; hpRatio = 0.35; defRatio = 0.25;
    }
    
    // Raw base stats
    const dpsBrute = budgetTotal * dpsRatio;
    const hpBrute = budgetTotal * hpRatio;
    const defBrute = budgetTotal * defRatio;
    
    // Level scaling: +10% per level above 1
    const levelFactor = 1 + (level - 1) * 0.1;
    let dpsNiveau = dpsBrute * levelFactor;
    let hpNiveau = hpBrute * levelFactor;
    let defNiveau = defBrute * levelFactor;
    
    // Limit Break scaling: +5% per duplicate (cumulative)
    const lbFactor = 1 + (limitBreak * 0.05);
    let dpsFinal = dpsNiveau * lbFactor;
    let hpFinal = hpNiveau * lbFactor;
    let defFinal = defNiveau * lbFactor;
    
    // §2.1 — Courbe exponentielle lisse normalisée : même puissance à niveau 100, sans falaise
    // base = 1920^(1/100) ≈ 1.07853 ; Éveils I/II/III = cosmétiques uniquement (pas de multiplicateur)
    const HERO_EXP_BASE = 1.07853;
    const smoothFactor = Math.pow(HERO_EXP_BASE, level - 1); // = 1 au niveau 1, = 1920 au niveau 100
    dpsFinal *= smoothFactor;

    // Sphere modifier (legacy support)
    if (hData.equippedSphere && SPHERE_DEFS[hData.equippedSphere]) {
        const sphereMult = SPHERE_DEFS[hData.equippedSphere].multiplier || 1;
        dpsFinal *= sphereMult;
        hpFinal *= sphereMult;
        defFinal *= sphereMult;
    }

    // §2.2 ① — Équipement procédural affixes
    const heroId = (hData._id) ? hData._id : null;
    if (heroId) {
        const eqStats = getHeroEquipStats(heroId);
        if (eqStats.dps_pct)  dpsFinal *= (1 + eqStats.dps_pct);
        if (eqStats.hp_pct)   hpFinal  *= (1 + eqStats.hp_pct);
        if (eqStats.crit_dmg) dpsFinal *= (1 + eqStats.crit_dmg * 0.5); // 50% du bonus crit dmg contribue au DPS passif
    }

    // §2.2 ② — Arbre de compétences global
    const stBonuses = getSkillTreeBonuses();
    if (stBonuses.dps_pct)  dpsFinal *= (1 + stBonuses.dps_pct);
    if (stBonuses.hp_pct)   hpFinal  *= (1 + stBonuses.hp_pct);

    // §2.2 ③ — Bonus d'Ascension et Paragon
    const ascBonus = getAscensionBonus();
    const parBonus = getAllParagonBonuses();
    dpsFinal *= (1 + (ascBonus.dps_pct||0) + (parBonus.dps_pct||0));
    hpFinal  *= (1 + (parBonus.hp_pct||0));
    
    return {
        dps: Math.max(1, Math.floor(dpsFinal)),
        hp: Math.max(1, Math.floor(hpFinal * 18)),   // Scale HP for realistic RPG look
        def: Math.max(1, Math.floor(defFinal * 1.5))  // Scale DEF to balance boss attacks
    };
}

// §1.3 — Cache dirty-flag (évite recalcul à chaque tick de simulate)
let _squadStatsCache = null, _squadStatsDirty = true;
let _totalDpsCache   = null, _totalDpsDirty   = true;

function invalidateStats() {
    _squadStatsDirty = true;
    _totalDpsDirty   = true;
}

function _computeSquadStats() {
    let squadDps = 0;
    let squadMaxHp = 0;
    let squadDef = 0;
    
    const activeSquadIds = G.squad.filter(Boolean);
    const leaderId = G.squad[0] || null;
    const leaderHero = leaderId ? G.heroes[leaderId] : null;
    const leaderDef = leaderId ? HERO_DEFS.find(d => d.id === leaderId) : null;
    const hasLeaderSkill = leaderDef && leaderDef.leaderSkill;
    
    const activeHeroesStats = activeSquadIds.filter(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const h = G.heroes[id];
        return def && h && h.level != null;
    }).map(id => {
        const def = HERO_DEFS.find(d => d.id === id);
        const h = G.heroes[id];
        h._id = id; // §2.2① FIX — sans _id, getHeroStats ne trouve pas l'équipement → affixes sans effet
        const stats = getHeroStats(def, h);
        return { id, def, h, stats };
    });
    
    const elements = activeHeroesStats.map(x => getElementKey(x.def.element));
    
    // Alliance Sacrée: contains at least one light AND dark unit -> +20% BC/HC spawn rate
    let hasAllianceSacree = elements.includes('light') && elements.includes('dark');
    G.allianceSacreeActive = hasAllianceSacree;
    
    // Mono-Élémentaire (Monolithe) and Duo checks
    const uniqueElements = [...new Set(elements)];
    let isMonolithe = activeSquadIds.length >= 1 && uniqueElements.length === 1;
    
    const elemCounts = {};
    elements.forEach(el => { elemCounts[el] = (elemCounts[el] || 0) + 1; });
    
    activeHeroesStats.forEach(x => {
        let dps = x.stats.dps;
        let hp = x.stats.hp;
        let def = x.stats.def;
        
        // Element Advantage check
        const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;
        const zoneElemKey = getElementKey(currentZoneElem);
        const unitElemKey = getElementKey(x.def.element);
        
        let hasAdvantage = false;
        if (unitElemKey === 'fire' && zoneElemKey === 'earth') hasAdvantage = true;
        else if (unitElemKey === 'earth' && zoneElemKey === 'thunder') hasAdvantage = true;
        else if (unitElemKey === 'thunder' && zoneElemKey === 'water') hasAdvantage = true;
        else if (unitElemKey === 'water' && zoneElemKey === 'fire') hasAdvantage = true;
        else if (unitElemKey === 'light' && zoneElemKey === 'dark') hasAdvantage = true;
        else if (unitElemKey === 'dark' && zoneElemKey === 'light') hasAdvantage = true;
        
        if (hasAdvantage) {
            dps *= 1.5;
        }
        
        // Leader Skill
        if (hasLeaderSkill) {
            const ls = leaderDef.leaderSkill;
            let isTarget = false;
            if (ls.target === 'all') {
                isTarget = true;
            } else if (ls.target === 'element') {
                isTarget = unitElemKey === getElementKey(ls.targetDetail);
            } else if (ls.target === 'role') {
                isTarget = x.def.role === ls.targetDetail;
            }
            
            if (isTarget) {
                if (ls.statModifier === 'dps') {
                    dps *= (1 + ls.modifierValue);
                } else if (ls.statModifier === 'pv') {
                    hp *= (1 + ls.modifierValue);
                } else if (ls.statModifier === 'def') {
                    def *= (1 + ls.modifierValue);
                }
            }
        }
        
        // Duo Élémentaire: +25% DPS and +15% PV if exactly 2 share this element
        if (elemCounts[unitElemKey] === 2) {
            dps *= 1.25;
            hp *= 1.15;
        }
        
        squadDps += dps;
        squadMaxHp += hp;
        squadDef += def;
    });
    
    // Mono-Élémentaire (Monolithe): +50% DPS global, but -20% DEF global
    if (isMonolithe) {
        squadDps *= 1.50;
        squadDef *= 0.80;
    }
    
    return {
        dps: Math.max(1, Math.floor(squadDps)),
        maxHp: Math.max(10, Math.floor(squadMaxHp)),
        def: Math.max(1, Math.floor(squadDef))
    };
}

function getSquadStats() {
    if (_squadStatsDirty) { _squadStatsCache = _computeSquadStats(); _squadStatsDirty = false; }
    return _squadStatsCache;
}

function getHeroDPS(def, hData) {
    const stats = getHeroStats(def, hData);
    let dps = stats.dps;
    
    const currentZoneElem = ZONE_THEMES[(G.zone-1)%ZONE_THEMES.length].elem;
    const zoneElemKey = getElementKey(currentZoneElem);
    const unitElemKey = getElementKey(def.element);
    
    let hasAdvantage = false;
    if (unitElemKey === 'fire' && zoneElemKey === 'earth') hasAdvantage = true;
    else if (unitElemKey === 'earth' && zoneElemKey === 'thunder') hasAdvantage = true;
    else if (unitElemKey === 'thunder' && zoneElemKey === 'water') hasAdvantage = true;
    else if (unitElemKey === 'water' && zoneElemKey === 'fire') hasAdvantage = true;
    else if (unitElemKey === 'light' && zoneElemKey === 'dark') hasAdvantage = true;
    else if (unitElemKey === 'dark' && zoneElemKey === 'light') hasAdvantage = true;
    
    if (hasAdvantage) dps *= 1.5;
    
    if (G.leaderId && G.heroes[G.leaderId]) {
        const lDef = HERO_DEFS.find(d => d.id === G.leaderId);
        if (lDef && lDef.leaderSkill) {
            const ls = lDef.leaderSkill;
            let isTarget = false;
            if (ls.target === 'all') isTarget = true;
            else if (ls.target === 'element') isTarget = unitElemKey === getElementKey(ls.targetDetail);
            else if (ls.target === 'role') isTarget = def.role === ls.targetDetail;
            
            if (isTarget && ls.statModifier === 'dps') {
                dps *= (1 + ls.modifierValue);
            }
        }
    }
    
    if (G.squad.includes(def.id)) {
        const elements = G.squad.filter(Boolean).map(id => {
            const d = HERO_DEFS.find(x => x.id === id);
            return d ? getElementKey(d.element) : '';
        });
        const elemCounts = {};
        elements.forEach(el => { elemCounts[el] = (elemCounts[el] || 0) + 1; });
        if (elemCounts[unitElemKey] === 2) {
            dps *= 1.25;
        }
        const uniqueElements = [...new Set(elements)];
        if (uniqueElements.length === 1) {
            dps *= 1.50;
        }
    }
    
    return Math.floor(dps);
}
