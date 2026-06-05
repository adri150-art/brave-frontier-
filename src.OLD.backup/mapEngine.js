// =============================================
// TYPES DE NŒUDS
// =============================================
const NODE_TYPES = {
    START:    { icon: '★', color: '#3a4566', name: 'Départ' },
    BATTLE:   { icon: '⚔', color: '#c0392b', name: 'Combat' },
    CHEST:    { icon: '✦', color: '#f1c40f', name: 'Coffre' },
    FOUNTAIN: { icon: '♥', color: '#2ecc71', name: 'Fontaine' },
    QUESTION: { icon: '?', color: '#3498db', name: 'Événement' },
    SHOP:     { icon: '$', color: '#e67e22', name: 'Boutique' },
    BOSS:     { icon: '♛', color: '#9b59b6', name: 'BOSS' }
};

// =============================================
// POOL ENNEMIS DYNAMIQUES
// =============================================
const ENEMY_POOL = {
    'Feu':      [{ name: 'Dragon Pyro',            hp: 2000, element: 'Feu' },
                 { name: 'Démon Embrasé',           hp: 1800, element: 'Feu' }],
    'Eau':      [{ name: 'Léviathan des Abysses',   hp: 2200, element: 'Eau' },
                 { name: 'Serpent Aquatique',        hp: 1700, element: 'Eau' }],
    'Terre':    [{ name: 'Golem de Pierre',          hp: 2400, element: 'Terre' },
                 { name: 'Troll des Collines',       hp: 2100, element: 'Terre' }],
    'Foudre':   [{ name: 'Aigle Électrique',         hp: 1600, element: 'Foudre' },
                 { name: 'Orbe Tonnerre',             hp: 1900, element: 'Foudre' }],
    'Lumière':  [{ name: 'Ange Déchu',               hp: 2000, element: 'Lumière' },
                 { name: 'Gardien Sacré',             hp: 1750, element: 'Lumière' }],
    'Ténèbres': [{ name: "Revan l'Obscur",           hp: 2300, element: 'Ténèbres' },
                 { name: 'Specter Maudit',            hp: 1950, element: 'Ténèbres' }]
};

const ELEMENTS = ['Feu', 'Eau', 'Terre', 'Foudre', 'Lumière', 'Ténèbres'];

function pickEnemy(isBoss) {
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    if (isBoss) {
        return { name: 'VARGAS MAUDIT — BOSS SUPRÊME', hp: 6500, element };
    }
    const pool = ENEMY_POOL[element];
    const base = pool[Math.floor(Math.random() * pool.length)];
    return { ...base, hp: base.hp + Math.floor(Math.random() * 400) - 200 };
}

// =============================================
// GÉNÉRATION DE LA CARTE ROGUELIKE
// =============================================
function generateWorldMap() {
    const layers = [];

    // Étage 0 : Départ
    layers.push([{
        id: 'n0_0', type: NODE_TYPES.START, layer: 0,
        x: 250, y: 730, active: true, visited: false, enemy: null
    }]);

    // Étages intermédiaires
    const sizes    = [3, 2, 4, 2];
    const typePool = [
        NODE_TYPES.BATTLE, NODE_TYPES.BATTLE,
        NODE_TYPES.CHEST, NODE_TYPES.FOUNTAIN,
        NODE_TYPES.QUESTION, NODE_TYPES.SHOP
    ];

    for (let l = 0; l < sizes.length; l++) {
        const layerNodes = [];
        const size   = sizes[l];
        const layerY = 600 - l * 130;

        for (let c = 0; c < size; c++) {
            const layerX   = (500 / (size + 1)) * (c + 1);
            const randType = typePool[Math.floor(Math.random() * typePool.length)];
            const enemy    = (randType === NODE_TYPES.BATTLE) ? pickEnemy(false) : null;

            layerNodes.push({
                id: `n${l + 1}_${c}`,
                type: randType,
                layer: l + 1,
                x: layerX,
                y: layerY,
                active: false,
                visited: false,
                enemy
            });
        }
        layers.push(layerNodes);
    }

    // Étage Final : BOSS
    layers.push([{
        id: 'nboss', type: NODE_TYPES.BOSS, layer: sizes.length + 1,
        x: 250, y: 60, active: false, visited: false, enemy: pickEnemy(true)
    }]);

    // Arêtes
    const edges = [];
    for (let l = 0; l < layers.length - 1; l++) {
        const curr = layers[l], next = layers[l + 1];
        curr.forEach(c => {
            next.forEach(n => {
                if (curr.length === 1 || next.length === 1 || Math.abs(c.x - n.x) < 160) {
                    edges.push({ from: c.id, to: n.id });
                }
            });
        });
    }

    return { layers, edges };
}

// =============================================
// DESSIN SVG LUMINEUX
// =============================================
function renderWorldMap(map, container) {
    container.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 780');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';

    // Fond dégradé
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'mapBg'); grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
    [['0%','#060912'],['50%','#080d1c'],['100%','#04060e']].forEach(([o,c]) => {
        const s = document.createElementNS('http://www.w3.org/2000/svg','stop');
        s.setAttribute('offset',o); s.setAttribute('stop-color',c); grad.appendChild(s);
    });
    defs.appendChild(grad); svg.appendChild(defs);
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width','500'); bgRect.setAttribute('height','780');
    bgRect.setAttribute('fill','url(#mapBg)'); svg.appendChild(bgRect);

    // Étoiles
    for (let i = 0; i < 60; i++) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        star.setAttribute('cx', Math.random() * 500);
        star.setAttribute('cy', Math.random() * 780);
        star.setAttribute('r',  Math.random() * 1.8 + 0.3);
        star.setAttribute('fill', `rgba(255,255,255,${(Math.random() * 0.5 + 0.1).toFixed(2)})`);
        svg.appendChild(star);
    }
    // Nuages colorés décoratifs
    [[80,150,0.06,'#4466ff'],[420,300,0.05,'#aa44cc'],[200,600,0.04,'#224488']].forEach(([x,y,o,c]) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
        el.setAttribute('cx',x); el.setAttribute('cy',y); el.setAttribute('rx',120); el.setAttribute('ry',60);
        el.setAttribute('fill',c); el.setAttribute('opacity',o); svg.appendChild(el);
    });

    // 1. Chemins
    map.edges.forEach(edge => {
        let fromNode, toNode;
        map.layers.forEach(layer => layer.forEach(n => {
            if (n.id === edge.from) fromNode = n;
            if (n.id === edge.to)   toNode   = n;
        }));
        if (!fromNode || !toNode) return;
        // Ligne de glow
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        glow.setAttribute('x1', fromNode.x); glow.setAttribute('y1', fromNode.y);
        glow.setAttribute('x2', toNode.x);   glow.setAttribute('y2', toNode.y);
        glow.setAttribute('stroke', fromNode.visited ? '#f1c40f' : '#334477');
        glow.setAttribute('stroke-width', '4'); glow.setAttribute('opacity', '0.15');
        svg.appendChild(glow);
        // Ligne principale
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x); line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);   line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke', fromNode.visited ? '#f1c40f88' : '#2a3a5a');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '7,5');
        svg.appendChild(line);
    });

    // 2. Nœuds
    map.layers.forEach(layer => {
        layer.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${node.x},${node.y})`);
            g.style.cursor = node.active ? 'pointer' : (node.visited ? 'default' : 'not-allowed');

            const isBoss = node.type === NODE_TYPES.BOSS;
            const r = isBoss ? 28 : 22;
            const col = node.type.color;

            // Halo de glow (fond)
            const glowBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glowBg.setAttribute('r', String(r + 8));
            glowBg.setAttribute('fill', col);
            glowBg.setAttribute('opacity', node.active ? '0.18' : (node.visited ? '0.06' : '0.08'));
            g.appendChild(glowBg);

            // Halo pulsant pour les nœuds actifs
            if (node.active) {
                const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                pulse.setAttribute('r', String(r + 4));
                pulse.setAttribute('fill', 'none');
                pulse.setAttribute('stroke', col);
                pulse.setAttribute('stroke-width', '2');
                pulse.setAttribute('opacity', '0.7');
                pulse.innerHTML = `<animate attributeName="r" values="${r+2};${r+14};${r+2}" dur="1.8s" repeatCount="indefinite"/>
                                   <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite"/>`;
                g.appendChild(pulse);
            }

            // Cercle principal
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', r);
            if (node.visited) {
                circle.setAttribute('fill', '#0e1a0e');
                circle.setAttribute('stroke', '#2ecc71');
                circle.setAttribute('stroke-width', '2');
            } else {
                // Remplissage avec opacité
                circle.setAttribute('fill', col);
                circle.setAttribute('opacity', node.active ? '1' : '0.55');
                circle.setAttribute('stroke', node.active ? '#ffffff' : col);
                circle.setAttribute('stroke-width', node.active ? '2.5' : '1.5');
            }
            g.appendChild(circle);

            // Icône
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('dominant-baseline', 'central');
            icon.setAttribute('fill', '#fff');
            icon.setAttribute('font-size', isBoss ? '20px' : '16px');
            icon.setAttribute('font-family', 'sans-serif');
            icon.textContent = node.visited ? '✓' : node.type.icon;
            g.appendChild(icon);

            // Label en dessous
            const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lbl.setAttribute('text-anchor', 'middle');
            lbl.setAttribute('y', String(r + 14));
            lbl.setAttribute('fill', node.active ? '#e0e8ff' : '#5a6a8a');
            lbl.setAttribute('font-size', isBoss ? '11px' : '9px');
            lbl.setAttribute('font-family', 'sans-serif');
            lbl.setAttribute('font-weight', node.active ? 'bold' : 'normal');
            lbl.textContent = node.type.name;
            g.appendChild(lbl);

            // Info ennemi
            if ((node.type === NODE_TYPES.BATTLE || node.type === NODE_TYPES.BOSS) && node.enemy && !node.visited) {
                const el2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                el2.setAttribute('text-anchor', 'middle');
                el2.setAttribute('y', String(r + 26));
                el2.setAttribute('fill', '#e74c3c');
                el2.setAttribute('font-size', '8px');
                el2.setAttribute('font-family', 'sans-serif');
                el2.textContent = `${node.enemy.element} · ${node.enemy.hp}HP`;
                g.appendChild(el2);
            }

            // Clic
            if (node.active) {
                g.addEventListener('click', () => {
                    // Désactiver les autres nœuds du même étage (verrouille le chemin mais permet de recommencer en cas d'échec)
                    map.layers.forEach(l => {
                        l.forEach(n => { 
                            if (n.layer === node.layer && n.id !== node.id) {
                                n.active = false; 
                            }
                        });
                    });

                    if (node.type === NODE_TYPES.BATTLE || node.type === NODE_TYPES.BOSS) {
                        window.gameState.currentMap    = map;
                        window.gameState.pendingNodeId = node.id;
                        if (typeof saveGameState === 'function') saveGameState();
                        if (typeof triggerBattleMode === 'function') {
                            triggerBattleMode({
                                enemyName:    node.enemy.name,
                                enemyHp:      node.enemy.hp,
                                enemyElement: node.enemy.element,
                                nodeId:       node.id
                            });
                        }
                    } else if (node.type === NODE_TYPES.CHEST) {
                        node.visited = true;
                        _unlockNextLayer(map, node);
                        const gems = Math.floor(Math.random() * 3) + 1;
                        if (window.gameState) window.gameState.gems += gems;
                        
                        let mat = null;
                        if (window.gameState) {
                            if (!window.gameState.materials) window.gameState.materials = { idoles: 0, totems: 0, mimiques: 0 };
                            const r = Math.random();
                            if (r < 0.35) {
                                mat = 'Idole 💡';
                                window.gameState.materials.idoles++;
                            } else if (r < 0.60) {
                                mat = 'Totem 🔮';
                                window.gameState.materials.totems++;
                            }
                        }
                        
                        if (typeof progressQuest    === 'function') progressQuest('nodes', 1);
                        if (typeof saveGameState    === 'function') saveGameState();
                        if (typeof refreshGemsDisplay === 'function') refreshGemsDisplay();
                        renderWorldMap(map, container);
                        if (typeof showChestOverlay === 'function') showChestOverlay(gems, mat);

                    } else if (node.type === NODE_TYPES.FOUNTAIN) {
                        node.visited = true;
                        _unlockNextLayer(map, node);
                        if (window.gameState) {
                            window.gameState.activeSquad.forEach(u => { if (u) u.currentHp = u.maxHp; });
                        }
                        if (typeof progressQuest      === 'function') progressQuest('nodes', 1);
                        if (typeof saveGameState      === 'function') saveGameState();
                        renderWorldMap(map, container);
                        if (typeof showFountainOverlay === 'function') showFountainOverlay();

                    } else if (node.type === NODE_TYPES.QUESTION) {
                        node.visited = true;
                        _unlockNextLayer(map, node);
                        renderWorldMap(map, container);
                        if (typeof openEventNode === 'function') openEventNode(node, map, container);

                    } else if (node.type === NODE_TYPES.SHOP) {
                        node.visited = true;
                        _unlockNextLayer(map, node);
                        renderWorldMap(map, container);
                        if (typeof openShopNode === 'function') openShopNode(map, container);

                    } else {
                        // START
                        node.visited = true;
                        _unlockNextLayer(map, node);
                        renderWorldMap(map, container);
                    }

                    // Audio
                    if (window.AudioEngine && node.type !== NODE_TYPES.BATTLE && node.type !== NODE_TYPES.BOSS) {
                        window.AudioEngine.playCrystal();
                    }
                });
            }

            svg.appendChild(g);
        });
    });

    container.appendChild(svg);

    // Musique de map
    if (window.AudioEngine) window.AudioEngine.startMapMusic();
}

function _unlockNextLayer(map, node) {
    const next = map.edges.filter(e => e.from === node.id).map(e => e.to);
    map.layers.forEach(l => {
        l.forEach(n => { if (next.includes(n.id)) n.active = true; });
    });
}
