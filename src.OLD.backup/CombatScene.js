export class CombatScene extends Phaser.Scene {
    constructor() { super({ key: 'CombatScene' }); }

    // ══ Éléments ═══════════════════════════════════════════════════════════
    getDamageMultiplier(atk, def) {
        const T = { 'Feu':{'Terre':1.5,'Eau':0.5}, 'Eau':{'Feu':1.5,'Terre':0.5},
                    'Terre':{'Eau':1.5,'Feu':0.5}, 'Foudre':{'Eau':1.5,'Terre':1.2},
                    'Lumière':{'Ténèbres':1.5}, 'Ténèbres':{'Lumière':1.5} };
        return (T[atk]&&T[atk][def])||1.0;
    }
    calculateDamage(attacker, defender, power, isSpark=false) {
        const sph = this._getSphereData(attacker.equippedSphere);
        const atk = attacker.baseStats.atk * (sph?sph.atkMult:1) * (this.odMode?1.3:1);
        const def = Math.max(1, defender.baseStats.def);
        const el  = this.getDamageMultiplier(attacker.types[0], defender.types[0]);
        const base = Math.floor((2*attacker.level/5+2)*power*atk/def/50+2);
        return Math.max(1, Math.floor(base * el * (isSpark?1.5:1) * (0.85+Math.random()*0.15)));
    }
    _getSphereData(id) {
        if (!id) return null;
        return [{id:'sacred_blade',atkMult:1.2,defMult:1.0,bbGainMult:1.0},
                {id:'iron_shield', atkMult:1.0,defMult:1.2,bbGainMult:1.0},
                {id:'prism_orb',   atkMult:1.0,defMult:1.0,bbGainMult:1.25},
                {id:'life_orb',    atkMult:1.3,defMult:1.0,bbGainMult:1.0},
                {id:'rocky_helmet',atkMult:1.0,defMult:1.15,bbGainMult:1.0,riposte:true},
                {id:'leftovers',   atkMult:1.0,defMult:1.0,bbGainMult:1.0,regen:true}]
            .find(s=>s.id===id)||null;
    }
    _ec(el) { return {'Feu':0xe74c3c,'Eau':0x3498db,'Terre':0x2ecc71,'Foudre':0xf1c40f,'Lumière':0xfffff0,'Ténèbres':0x9b59b6}[el]||0xffffff; }
    _ech(el){ return {'Feu':'#e74c3c','Eau':'#3498db','Terre':'#2ecc71','Foudre':'#f1c40f','Lumière':'#fffde7','Ténèbres':'#9b59b6'}[el]||'#fff'; }
    _ei(el) { return {'Feu':'🔥','Eau':'💧','Terre':'🌿','Foudre':'⚡','Lumière':'✨','Ténèbres':'🌑'}[el]||'◆'; }

    // ══ Assets ═════════════════════════════════════════════════════════════
    preload() {
        this.load.image('boss_dragon','https://img.icons8.com/color/512/dragon.png');
        this.load.image('boss_demon', 'https://img.icons8.com/color/512/devil.png');
        this.load.image('boss_titan', 'https://img.icons8.com/color/512/robot.png');
        this.load.image('ignis_combat','assets/visual hero /2d rpg/ignis.png');
        this.load.image('h_knight','https://img.icons8.com/color/512/knight.png');
        this.load.image('h_mage',  'https://img.icons8.com/color/512/wizard.png');
        this.load.image('h_archer','https://img.icons8.com/color/512/archer.png');
        this.load.image('h_valky', 'https://img.icons8.com/color/512/valkyrie.png');
        this.load.image('h_monk',  'https://img.icons8.com/color/512/monk.png');
    }
    _heroKey(name) {
        const n=(name||'').toLowerCase();
        if (['vargas','ignis','lava','lorand','elza','ardent'].includes(n)) return 'ignis_combat';
        if (['selena','rina','sera','tilith','maxwell'].includes(n)) return 'h_valky';
        if (['lance','zaza','golia'].includes(n)) return 'h_knight';
        if (['karl','eze','duelmr','sodis','colt'].includes(n)) return 'h_archer';
        if (['sirius','mirfan','kikuri','luxfon'].includes(n)) return 'h_mage';
        return 'h_monk';
    }
    _bossKey(name) {
        const n=(name||'').toLowerCase();
        if (n.includes('dragon')||n.includes('feu')) return 'boss_dragon';
        if (n.includes('demon')||n.includes('maudit')||n.includes('obscur')) return 'boss_demon';
        return 'boss_titan';
    }

    // ══ CREATE ═════════════════════════════════════════════════════════════
    create(data) {
        const W=540, H=960;
        const ARENA_H   = 370;
        const BOSS_BAR_H= 62;
        const CARDS_Y   = ARENA_H + BOSS_BAR_H + 2;
        const CARD_H    = 96;
        const CARD_GAP  = 4;
        const CARD_W    = 261;
        const OD_Y      = CARDS_Y + 3*(CARD_H+CARD_GAP) + 2;
        const OD_H      = 38;
        const ITEMS_Y   = OD_Y + OD_H + 2;

        this.heroesActedThisRound=0; this.lastAttackTime=0; this.attacksInWindow=0;
        this.isBossTurn=false; this.roundNumber=1; this.odGauge=0;
        this.odMode=false; this.odTurnsLeft=0;
        this.currentNodeId=data?.nodeId||null;
        this.BOSS_X=385; this.BOSS_Y=185;
        this.ARENA_H=ARENA_H;

        const isBossNode=data?.enemyHp>=5000;
        this.boss={ name:data?.enemyName||'ORBE TONNERRE', level:isBossNode?75:55,
            baseStats:{atk:isBossNode?180:130,def:90},
            currentHp:data?.enemyHp||1928, maxHp:data?.enemyHp||1928,
            types:[data?.enemyElement||'Foudre'], statusEffects:[] };

        const FB=[
            {id:'d0',name:'Ignis', level:16,stars:3,unitType:'Guardian',baseStats:{atk:112,def:83}, currentHp:1200,maxHp:1200,types:['Feu'],  equippedSphere:'life_orb'},
            {id:'d1',name:'Selena',level:16,stars:3,unitType:'Anima',   baseStats:{atk:102,def:89}, currentHp:1350,maxHp:1350,types:['Eau'],  equippedSphere:'leftovers'},
            {id:'d2',name:'Lance', level:15,stars:3,unitType:'Lord',    baseStats:{atk:97, def:107},currentHp:1400,maxHp:1400,types:['Terre'],equippedSphere:'rocky_helmet'}
        ];
        let saved=(window.gameState?.activeSquad||[]).filter(u=>u);
        if(!saved.length) saved=FB;

        const STAR_STR={3:'★★★',4:'★★★★',5:'★★★★★',6:'★★★★★★'};
        const STAR_HEX={3:'#cd7f32',4:'#aaaaaa',5:'#f1c40f',6:'#c084fc'};
        const TYPE_COL={Lord:'#aaaaaa',Anima:'#3498db',Breaker:'#e74c3c',Guardian:'#2ecc71',Oracle:'#9b59b6'};

        this.squadUnits=saved.slice(0,6).map(u=>({
            ...u, name:u.name.toLowerCase()==='vargas'?'Ignis':u.name,
            bbValue:0, bbCapacity:u.stars>=5?200:100,
            isAttacking:false, hasActed:false, isKO:false, statusEffects:[],
            assetKey:this._heroKey(u.name)
        }));

        this._genTextures();

        // ══════════════════════════════════════════════════════════════════
        // 1. ARÈNE — FOND ÉPIQUE MULTI-COUCHES (style Brave Frontier)
        // ══════════════════════════════════════════════════════════════════

        // ── Ciel dégradé dramatique (4 couleurs)
        const sky=this.add.graphics();
        const bossEl=this.boss.types[0];
        const skyTop    = bossEl==='Feu'?0x1a0510:bossEl==='Eau'?0x020d2a:bossEl==='Ténèbres'?0x0a0020:0x12051e;
        const skyBottom = bossEl==='Feu'?0x3d0a00:bossEl==='Eau'?0x002040:bossEl==='Ténèbres'?0x1a0040:0x1a0830;
        sky.fillGradientStyle(skyTop,skyTop,skyBottom,skyBottom,1);
        sky.fillRect(0,0,W,ARENA_H);

        // ── Rayons de lumière (volumétrique)
        const rays=this.add.graphics();
        const bossCol=this._ec(bossEl);
        for(let i=0;i<10;i++){
            const angle=(-45+i*9)*Math.PI/180;
            rays.fillStyle(bossCol,0.018);
            rays.fillTriangle(270,0, 270+Math.sin(angle)*900,ARENA_H, 270+Math.sin(angle+0.1)*900,ARENA_H);
        }

        // ── Brumes distantes (couches)
        for(let m=0;m<3;m++){
            const mist=this.add.graphics();
            mist.fillStyle(0x000022, 0.12+m*0.06);
            mist.fillRect(0, ARENA_H*(0.2+m*0.1), W, ARENA_H*0.15);
        }

        // ── Sol de pierre magique
        const floor=this.add.graphics();
        floor.fillGradientStyle(0x1a0800,0x1a0800,0x050500,0x050500,1);
        floor.fillRect(0,ARENA_H*0.6,W,ARENA_H*0.4);

        // Lignes de perspective du sol
        floor.lineStyle(1,0x442200,0.35);
        const horizY=ARENA_H*0.6;
        const vanishX=W/2;
        for(let lx=-W;lx<W*2;lx+=55){
            floor.lineBetween(vanishX,horizY,lx,ARENA_H);
        }
        // Lignes horizontales (courbées)
        for(let ly=0;ly<8;ly++){
            const y=horizY+ly*((ARENA_H-horizY)/7);
            floor.lineStyle(1,0x553300,0.15+ly*0.04);
            floor.lineBetween(0,y,W,y);
        }

        // ── Runes magiques dans le sol (cercles et lignes)
        const runes=this.add.graphics();
        [[W/2,ARENA_H*0.82],[W/2-100,ARENA_H*0.88],[W/2+100,ARENA_H*0.88]].forEach(([rx,ry],ri)=>{
            runes.lineStyle(1.5,bossCol,0.15+ri*0.05);
            runes.strokeCircle(rx,ry,30+ri*8);
            runes.lineStyle(1,bossCol,0.08);
            runes.strokeCircle(rx,ry,50+ri*12);
            // Étoile dans rune
            for(let a=0;a<6;a++){
                const ang=a*Math.PI/3+0.3;
                runes.lineStyle(1,bossCol,0.1);
                runes.lineBetween(rx+Math.cos(ang)*25,ry+Math.sin(ang)*25, rx+Math.cos(ang+Math.PI/3)*25,ry+Math.sin(ang+Math.PI/3)*25);
            }
        });

        // ── Lueur de sol (sous les pieds)
        const groundGlow=this.add.graphics();
        groundGlow.fillStyle(bossCol,0.07); groundGlow.fillEllipse(W/2,ARENA_H*0.75,W*0.9,60);
        groundGlow.fillStyle(bossCol,0.04); groundGlow.fillEllipse(W/2,ARENA_H*0.8,W,100);

        // ── Colonnes de pierre avec torches
        [[0],[W-80]].forEach(([colX])=>{
            const col=this.add.graphics();
            // Corps colonne
            col.fillGradientStyle(0x3a2a10,0x2a1a08,0x3a2a10,0x2a1a08,1);
            col.fillRect(colX,0,80,ARENA_H);
            // Détails colonne
            col.lineStyle(1,0x6a4a20,0.5); col.strokeRect(colX+8,0,64,ARENA_H);
            [0.15,0.35,0.55,0.75,0.9].forEach(yf=>{
                col.fillStyle(0x2a1800,0.7); col.fillRect(colX,ARENA_H*yf,80,8);
            });
            // Torche
            const tx=colX+(colX===0?60:20), ty=ARENA_H*0.35;
            col.fillStyle(0x5a4020,1); col.fillRect(tx-4,ty,8,25);
            col.fillStyle(0xff6600,0.8); col.fillCircle(tx,ty-5,8);
            col.fillStyle(0xff9900,0.6); col.fillCircle(tx,ty-10,5);
            col.fillStyle(0xffdd00,0.4); col.fillCircle(tx,ty-14,3);
        });

        // ── Particules: braises + poussière
        this._spawnEmbers(W, ARENA_H, bossEl);
        this._spawnDust(W, ARENA_H);

        // ── SPRITES HÉROS dans l'arène
        const heroCount=this.squadUnits.length;
        const heroPositions=this._computeHeroArenaPositions(heroCount, ARENA_H);
        this.arenaHeroSprites=[];

        this.squadUnits.forEach((unit,i)=>{
            const {x,y}=heroPositions[i];
            const elCol=this._ec(unit.types[0]);

            // Ombre au sol
            const shadow=this.add.graphics();
            shadow.fillStyle(0x000000,0.4); shadow.fillEllipse(x,y+45,60,14);

            // Cercle élémentaire au sol
            const footGlow=this.add.graphics();
            footGlow.lineStyle(1.5,elCol,0.5); footGlow.strokeEllipse(x,y+40,55,12);
            footGlow.fillStyle(elCol,0.08); footGlow.fillEllipse(x,y+40,55,12);
            this.tweens.add({targets:footGlow,alpha:{from:0.3,to:1},duration:1200+i*300,yoyo:true,repeat:-1});

            // Aura élémentaire (double couche)
            const aura1=this.add.graphics();
            aura1.fillStyle(elCol,0.08); aura1.fillCircle(x,y,55);
            const aura2=this.add.graphics();
            aura2.fillStyle(elCol,0.12); aura2.fillCircle(x,y,38);
            aura2.lineStyle(1.5,elCol,0.4); aura2.strokeCircle(x,y,38);
            this.tweens.add({targets:aura1,alpha:{from:0.3,to:0.8},scaleX:{from:0.95,to:1.05},scaleY:{from:0.95,to:1.05},duration:1400+i*200,yoyo:true,repeat:-1});
            this.tweens.add({targets:aura2,alpha:{from:0.5,to:1},duration:900+i*150,yoyo:true,repeat:-1});

            // Sprite
            const spr=this.add.image(x,y,unit.assetKey).setDisplaySize(72,72);
            spr.setTint(0xfff0f0);
            if(!unit.isKO) this.tweens.add({targets:spr,y:y-7,duration:1800+i*180,yoyo:true,repeat:-1,ease:'Sine.inOut'});

            // Badge étoile flottant
            const starBadge=this.add.text(x,y-48,'★',{fontSize:'11px',fill:STAR_HEX[unit.stars]||'#aaa',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setAlpha(0.8);

            this.arenaHeroSprites.push({sprite:spr,aura1,aura2,footGlow,baseX:x,baseY:y,shadow});
        });

        // ══ BOSS ═══════════════════════════════════════════════════════
        const BX=this.BOSS_X, BY=this.BOSS_Y;

        // Aura boss (multi-couches pour effet glow)
        this.bossAuraGfx=this.add.graphics();
        this._drawBossAura(this.bossAuraGfx, BX, BY);
        this.tweens.add({targets:this.bossAuraGfx,alpha:{from:0.5,to:1},scaleX:{from:0.95,to:1.05},scaleY:{from:0.95,to:1.05},duration:1800,yoyo:true,repeat:-1});

        // Anneaux de portail derrière le boss
        [120,100,80].forEach((r,ri)=>{
            const ring=this.add.graphics();
            ring.lineStyle(ri===0?1:2,bossCol,0.15+ri*0.1);
            ring.strokeCircle(BX,BY,r);
            this.tweens.add({targets:ring,scaleX:{from:0.95,to:1.08},scaleY:{from:0.95,to:1.08},alpha:{from:0.3,to:0.8},duration:2000+ri*300,yoyo:true,repeat:-1});
        });

        // Ombre boss (ellipse + glow)
        const bossShadow=this.add.graphics();
        bossShadow.fillStyle(0x000000,0.5); bossShadow.fillEllipse(BX,BY+90,130,24);
        bossShadow.fillStyle(bossCol,0.07); bossShadow.fillEllipse(BX,BY+90,180,40);

        // Sprite boss (grand)
        this.bossSprite=this.add.image(BX,BY,this._bossKey(this.boss.name)).setDisplaySize(170,170);
        this.bossSprite.setTint(0xffeeff);
        this.tweens.add({targets:this.bossSprite,y:BY-12,duration:2100,yoyo:true,repeat:-1,ease:'Sine.inOut'});

        // Badge élément boss (stylisé)
        const bElCol=this._ec(this.boss.types[0]);
        const elBadgeBg=this.add.graphics();
        elBadgeBg.fillStyle(bElCol,0.9); elBadgeBg.fillRoundedRect(BX-22,BY-105,44,24,5);
        elBadgeBg.lineStyle(1.5,0xffffff,0.3); elBadgeBg.strokeRoundedRect(BX-22,BY-105,44,24,5);
        this.add.text(BX,BY-93,this._ei(this.boss.types[0]),{fontSize:'14px'}).setOrigin(0.5);

        // Badge niveau boss
        const lvBg=this.add.graphics();
        lvBg.fillStyle(0x440000,0.95); lvBg.fillRoundedRect(BX+52,BY-44,44,22,4);
        lvBg.lineStyle(1,0xaa3333,0.8); lvBg.strokeRoundedRect(BX+52,BY-44,44,22,4);
        this.add.text(BX+74,BY-33,`LV${this.boss.level}`,{fontSize:'10px',fontFamily:'Cinzel',fill:'#ff9999',fontStyle:'bold'}).setOrigin(0.5);

        // ── TURN indicator (cristal central)
        const turnBg=this.add.graphics();
        turnBg.fillStyle(0x000000,0.75); turnBg.fillRoundedRect(W/2-55,ARENA_H*0.65-2,110,36,8);
        turnBg.lineStyle(2,0x4488ff,0.9); turnBg.strokeRoundedRect(W/2-55,ARENA_H*0.65-2,110,36,8);
        turnBg.lineStyle(1,0x88aaff,0.3); turnBg.strokeRoundedRect(W/2-52,ARENA_H*0.65+1,104,30,6);
        this.add.text(W/2-28,ARENA_H*0.65+7,'TURN',{fontSize:'10px',fontFamily:'Cinzel',fill:'#88bbff',fontStyle:'bold'});
        this.roundText=this.add.text(W/2+22,ARENA_H*0.65+9,`${this.roundNumber}`,{fontSize:'16px',fontFamily:'Cinzel',fill:'#ffffff',fontStyle:'bold'}).setOrigin(0.5,0);

        // Cristaux décoratifs animés
        for(let i=0;i<6;i++){
            const cx=W/2-60+i*24, cy=ARENA_H*0.65-14;
            const crGfx=this.add.graphics();
            const crCol=i%3===0?0x00aaff:i%3===1?0x0066ff:0x4400cc;
            crGfx.fillStyle(crCol,0.85); crGfx.fillCircle(0,0,4);
            crGfx.lineStyle(1,0xffffff,0.5); crGfx.strokeCircle(0,0,4);
            crGfx.setPosition(cx,cy);
            this.tweens.add({targets:crGfx,y:cy-5,alpha:{from:0.5,to:1},duration:500+i*110,yoyo:true,repeat:-1,ease:'Sine.inOut'});
        }

        // ══════════════════════════════════════════════════════════════════
        // 2. BARRE BOSS (panneau stylisé)
        // ══════════════════════════════════════════════════════════════════
        const bossPanelY=ARENA_H;

        const bossPanBg=this.add.graphics();
        bossPanBg.fillGradientStyle(0x1e0000,0x1e0000,0x080000,0x080000,1);
        bossPanBg.fillRect(0,bossPanelY,W,BOSS_BAR_H);
        // Ligne de séparation dorée
        bossPanBg.lineStyle(2,0x550000,1); bossPanBg.lineBetween(0,bossPanelY,W,bossPanelY);
        bossPanBg.lineStyle(1,0x330000,1); bossPanBg.lineBetween(0,bossPanelY+BOSS_BAR_H,W,bossPanelY+BOSS_BAR_H);
        // Ligne déco supérieure
        bossPanBg.lineStyle(1,0xff2222,0.3); bossPanBg.lineBetween(0,bossPanelY+1,W,bossPanelY+1);

        // Icône boss
        const miniEl=this.add.graphics();
        miniEl.fillStyle(this._ec(this.boss.types[0]),1); miniEl.fillCircle(20,bossPanelY+18,13);
        miniEl.lineStyle(1.5,0xffffff,0.3); miniEl.strokeCircle(20,bossPanelY+18,13);
        this.add.text(20,bossPanelY+18,this._ei(this.boss.types[0]),{fontSize:'14px'}).setOrigin(0.5);

        // Nom du boss
        this.add.text(42,bossPanelY+6,this.boss.name,{
            fontSize:this.boss.name.length>18?'11px':this.boss.name.length>12?'13px':'15px',
            fontFamily:'Cinzel',fill:'#ffffff',fontStyle:'bold',
            shadow:{color:'#ff0000',blur:8,offsetX:0,offsetY:0,fill:true}
        });

        // Barre HP boss
        const hpBarX=8, hpBarY=bossPanelY+35, hpBarW=W-16, hpBarH=16;
        // Background barre
        const hpBg=this.add.graphics();
        hpBg.fillStyle(0x220000,1); hpBg.fillRoundedRect(hpBarX,hpBarY,hpBarW,hpBarH,5);
        hpBg.lineStyle(1.5,0x550000,1); hpBg.strokeRoundedRect(hpBarX,hpBarY,hpBarW,hpBarH,5);

        this.bossHpGfx=this.add.graphics();
        this._redrawBossHP(hpBarX,hpBarY,hpBarW,hpBarH);
        this.bossHpMeta={x:hpBarX,y:hpBarY,w:hpBarW,h:hpBarH};

        this.bossHpText=this.add.text(W/2,hpBarY+8,`${this.boss.currentHp} / ${this.boss.maxHp}`,{
            fontSize:'9px',fontFamily:'Rajdhani',fill:'#ffaaaa',fontStyle:'bold',stroke:'#000',strokeThickness:2
        }).setOrigin(0.5);

        this.bossHpPct=this.add.text(W-10,hpBarY+8,`${Math.round(this.boss.currentHp/this.boss.maxHp*100)}%`,{
            fontSize:'9px',fontFamily:'Rajdhani',fill:'#ff8888',fontStyle:'bold'
        }).setOrigin(1,0.5);

        // ══════════════════════════════════════════════════════════════════
        // 3. CARTES HÉROS — grille 2 colonnes redessinée
        // ══════════════════════════════════════════════════════════════════
        const cardZoneBg=this.add.graphics();
        cardZoneBg.fillGradientStyle(0x07090f,0x07090f,0x050710,0x050710,1);
        cardZoneBg.fillRect(0,CARDS_Y-2,W,3*(CARD_H+CARD_GAP)+4);
        // Ligne de séparation déco
        cardZoneBg.lineStyle(1,0x1a2040,1); cardZoneBg.lineBetween(0,CARDS_Y-2,W,CARDS_Y-2);

        this.heroCards=[];
        this.squadSprites=[];
        this.squadUnits.forEach((unit,i)=>{
            const col=i%2;
            const row=Math.floor(i/2);
            const cx=col*(CARD_W+W-2*CARD_W-6)+7;
            const cy=CARDS_Y+row*(CARD_H+CARD_GAP);
            const container=this.add.container(0,0);
            this._buildHeroCard(container,unit,i,cx,cy,CARD_W,CARD_H,TYPE_COL,STAR_STR,STAR_HEX);
            this.heroCards.push(container);
            this.squadSprites.push(container);
        });

        // ══════════════════════════════════════════════════════════════════
        // 4. BARRE OVERDRIVE (style BF doré)
        // ══════════════════════════════════════════════════════════════════
        const odPanBg=this.add.graphics();
        odPanBg.fillGradientStyle(0x1a1200,0x1a1200,0x0c0900,0x0c0900,1);
        odPanBg.fillRect(0,OD_Y,W,OD_H);
        odPanBg.lineStyle(1,0x664400,1); odPanBg.lineBetween(0,OD_Y,W,OD_Y);
        odPanBg.lineStyle(1,0x442200,1); odPanBg.lineBetween(0,OD_Y+OD_H,W,OD_Y+OD_H);
        // Ligne dorée déco
        odPanBg.lineStyle(1,0xf1c40f,0.2); odPanBg.lineBetween(0,OD_Y+1,W,OD_Y+1);

        this.add.text(W/2,OD_Y+5,'OVERDRIVE',{
            fontSize:'10px',fontFamily:'Cinzel',fill:'#f1c40f',fontStyle:'bold',
            stroke:'#7a5000',strokeThickness:3
        }).setOrigin(0.5);

        const odBarY=OD_Y+18;
        const odBarBg=this.add.graphics();
        odBarBg.fillStyle(0x1a0d00,1); odBarBg.fillRoundedRect(8,odBarY,W-16,14,4);
        odBarBg.lineStyle(1.5,0x664400,1); odBarBg.strokeRoundedRect(8,odBarY,W-16,14,4);

        this.odBar=this.add.graphics();
        this.odBarMeta={x:8,y:odBarY,w:W-16,h:14};

        if(typeof updateODDisplay==='function') updateODDisplay(0);
        window.odActive=false;

        // ══════════════════════════════════════════════════════════════════
        // 5. ITEMS (zone bas — style BF complet)
        // ══════════════════════════════════════════════════════════════════
        const itemZoneBg=this.add.graphics();
        itemZoneBg.fillGradientStyle(0x08091a,0x08091a,0x040510,0x040510,1);
        itemZoneBg.fillRect(0,ITEMS_Y,W,H-ITEMS_Y);
        itemZoneBg.lineStyle(1,0x1a2050,1); itemZoneBg.lineBetween(0,ITEMS_Y,W,ITEMS_Y);
        // Ligne déco bleue
        itemZoneBg.lineStyle(1,0x2244aa,0.3); itemZoneBg.lineBetween(0,ITEMS_Y+1,W,ITEMS_Y+1);

        this.add.text(W/2,ITEMS_Y+7,'- ITEMS -',{
            fontSize:'9px',fontFamily:'Cinzel',fill:'#4466bb',fontStyle:'bold',letterSpacing:4
        }).setOrigin(0.5);

        const ITEMS=[
            {icon:'🧪',label:'Cure',    count:10, col:0x2ecc71},
            {icon:'💧',label:'Rosée',   count:2,  col:0x3498db},
            {icon:'⚡',label:'Stimul.', count:10, col:0xf1c40f},
            {icon:'💊',label:'Eau Ste', count:10, col:0x00d2ff},
            {icon:'✨',label:'Réanim.', count:1,  col:0xc084fc},
        ];
        const itemSlotW=W/ITEMS.length;
        ITEMS.forEach((item,i)=>{
            const ix=i*itemSlotW+itemSlotW/2;
            const iy=ITEMS_Y+20;

            // Socle stylisé
            const base=this.add.graphics();
            // Fond socle hexagonal/rond
            base.fillStyle(0x0d1030,0.95); base.fillRoundedRect(ix-26,iy+28,52,32,6);
            base.lineStyle(1.5,item.col,0.4); base.strokeRoundedRect(ix-26,iy+28,52,32,6);
            // Lueur sous le socle
            base.fillStyle(item.col,0.05); base.fillEllipse(ix,iy+60,60,18);

            // Cercle badge icône
            const iconBg=this.add.graphics();
            iconBg.fillStyle(item.col,0.12); iconBg.fillCircle(ix,iy+12,20);
            iconBg.lineStyle(1.5,item.col,0.35); iconBg.strokeCircle(ix,iy+12,20);
            this.tweens.add({targets:iconBg,alpha:{from:0.6,to:1},duration:1200+i*200,yoyo:true,repeat:-1});

            // Icône
            const iconTxt=this.add.text(ix,iy+12,item.icon,{fontSize:'20px'}).setOrigin(0.5);
            this.tweens.add({targets:iconTxt,y:iy+8,duration:1500+i*200,yoyo:true,repeat:-1,ease:'Sine.inOut'});

            // Badge compteur
            const cntBg=this.add.graphics();
            cntBg.fillStyle(0x000000,0.85); cntBg.fillRoundedRect(ix-14,iy-10,28,16,4);
            cntBg.lineStyle(1,item.col,0.5); cntBg.strokeRoundedRect(ix-14,iy-10,28,16,4);
            this.add.text(ix,iy-2,`x${item.count}`,{fontSize:'8px',fontFamily:'Rajdhani',fill:'#ffdd88',fontStyle:'bold'}).setOrigin(0.5);

            // Label
            this.add.text(ix,iy+46,item.label,{fontSize:'8px',fontFamily:'Rajdhani',fill:'#8899cc'}).setOrigin(0.5);
        });

        // ══════════════════════════════════════════════════════════════════
        // 6. EFFETS POST-PROCESSING (lueurs via textures floues)
        // ══════════════════════════════════════════════════════════════════
        this._setupGlowEffects();
    }

    // ══════════════════════════════════════════════════════════════════════
    // EFFETS DE LUEUR (simulés sans pixi-filters externe)
    // ══════════════════════════════════════════════════════════════════════
    _setupGlowEffects() {
        // Ajouter des post-process via camera effects natifs Phaser
        this.cameras.main.setPostPipeline('GlowFX');
    }

    // ══════════════════════════════════════════════════════════════════════
    // BUILDERS
    // ══════════════════════════════════════════════════════════════════════
    _buildHeroCard(container, unit, idx, cx, cy, CW, CH, TYPE_COL, STAR_STR, STAR_HEX) {
        const elCol   = this._ec(unit.types[0]);
        const elHex   = this._ech(unit.types[0]);
        const typeCol = TYPE_COL[unit.unitType]||'#aaa';
        const hpRatio = unit.currentHp / unit.maxHp;
        const bbReady = unit.bbValue >= unit.bbCapacity;

        // ── Fond carte (dégradé latéral élémentaire)
        const cardBg=this.add.graphics();
        cardBg.fillGradientStyle(0x0d1225,0x0d1225,0x08091a,0x08091a,1);
        cardBg.fillRoundedRect(cx,cy,CW,CH,6);
        // Bordure élémentaire (double)
        cardBg.lineStyle(2,elCol,0.5); cardBg.strokeRoundedRect(cx,cy,CW,CH,6);
        cardBg.lineStyle(1,elCol,0.15); cardBg.strokeRoundedRect(cx+2,cy+2,CW-4,CH-4,4);

        // Bande élémentaire gauche (dégradée)
        const stripe=this.add.graphics();
        stripe.fillStyle(elCol,0.35); stripe.fillRoundedRect(cx,cy,6,CH,{tl:6,bl:6,tr:0,br:0});
        stripe.fillStyle(elCol,0.12); stripe.fillRoundedRect(cx+6,cy,12,CH,{tl:0,bl:0,tr:0,br:0});

        // ── Portrait
        const portW=CH-8, portH=CH-8;
        const portX=cx+8, portY=cy+4;

        // Fond portrait (dégradé dramatique)
        const portBg=this.add.graphics();
        portBg.fillGradientStyle(0x0a0f20,0x0a0f20,0x050810,0x050810,1);
        portBg.fillRoundedRect(portX,portY,portW,portH,4);
        portBg.lineStyle(1,elCol,0.25); portBg.strokeRoundedRect(portX,portY,portW,portH,4);

        // Lueur élémentaire derrière portrait
        const portGlow=this.add.graphics();
        portGlow.fillStyle(elCol,0.08); portGlow.fillEllipse(portX+portW/2,portY+portH/2,portW,portH);

        // Sprite héros
        const heroImg=this.add.image(portX+portW/2, portY+portH/2, unit.assetKey)
            .setDisplaySize(portW-6, portH-6);

        // Overlay dégradé bas portrait (ombre de texte)
        const portOverlay=this.add.graphics();
        portOverlay.fillGradientStyle(0x000000,0x000000,0x000000,0x000000,0,0,0.7,0.7);
        portOverlay.fillRect(portX, portY+portH-22, portW, 22);

        // Étoiles en bas portrait
        const starsTxt=this.add.text(portX+portW/2, portY+portH-8, STAR_STR[unit.stars]||'★★★',{
            fontSize:'7px', fill:STAR_HEX[unit.stars]||'#aaa', fontStyle:'bold',stroke:'#000',strokeThickness:2
        }).setOrigin(0.5);

        // Badge élément (coin haut-gauche)
        const elBadge=this.add.graphics();
        elBadge.fillStyle(elCol,0.9); elBadge.fillCircle(portX+10,portY+10,10);
        elBadge.lineStyle(1,0xffffff,0.3); elBadge.strokeCircle(portX+10,portY+10,10);
        const elIcon=this.add.text(portX+10,portY+10,this._ei(unit.types[0]),{fontSize:'10px'}).setOrigin(0.5);

        // ── Zone info droite
        const tx=portX+portW+8, tw=CW-(portW+18);

        // Nom héros
        const nameTxt=this.add.text(tx, cy+5, unit.name,{
            fontSize:unit.name.length>10?'10px':'12px', fontFamily:'Cinzel', fill:'#e8eaf6', fontStyle:'bold',
            wordWrap:{width:tw}, shadow:{color:elHex,blur:6,fill:true}
        });

        // Badge type
        const tbBg=this.add.graphics();
        tbBg.fillStyle(Phaser.Display.Color.HexStringToColor(typeCol.slice(1)).color,0.18);
        tbBg.fillRoundedRect(tx,cy+20,58,14,3);
        tbBg.lineStyle(1,Phaser.Display.Color.HexStringToColor(typeCol.slice(1)).color,0.4);
        tbBg.strokeRoundedRect(tx,cy+20,58,14,3);
        const typeTxt=this.add.text(tx+29,cy+27,unit.unitType.toUpperCase(),{
            fontSize:'7px',fontFamily:'Rajdhani',fill:typeCol,fontStyle:'bold'
        }).setOrigin(0.5);

        // HP label
        this.add.text(tx,cy+38,'HP',{fontSize:'7px',fontFamily:'Rajdhani',fill:'#6677aa',fontStyle:'bold'});
        const hpVal=this.add.text(tx+20,cy+38,`${unit.currentHp}/${unit.maxHp}`,{
            fontSize:'7px',fontFamily:'Rajdhani',fill:'#99aacc'
        });

        // Barre HP
        const hpBarW=tw+2, hpBarY2=cy+50, hpBarH2=6;
        const hpBarBg=this.add.graphics();
        hpBarBg.fillStyle(0x0d1020,1); hpBarBg.fillRoundedRect(tx,hpBarY2,hpBarW,hpBarH2,2);
        hpBarBg.lineStyle(1,0x1a2240,1); hpBarBg.strokeRoundedRect(tx,hpBarY2,hpBarW,hpBarH2,2);

        const hpBarCol=hpRatio>0.5?0x33cc55:hpRatio>0.25?0xddaa00:0xcc2200;
        const hpBar=this.add.graphics();
        hpBar.fillStyle(hpBarCol,1);
        hpBar.fillRoundedRect(tx,hpBarY2,Math.max(0,hpBarW*hpRatio),hpBarH2,2);
        // Reflet HP
        const hpShine=this.add.graphics();
        hpShine.fillStyle(0xffffff,0.18);
        hpShine.fillRoundedRect(tx,hpBarY2,Math.max(0,hpBarW*hpRatio),3,2);

        // ── BB Button (état dynamique)
        const bbY=cy+CH-22, bbH=19, bbW=tw+2;
        const bbBtnBg=this.add.graphics();
        const bbBar=this.add.graphics();
        const bbBtnTxt=this.add.text(tx+bbW/2, bbY+9,'',{
            fontSize:'8px',fontFamily:'Cinzel',fill:'#000',fontStyle:'bold'
        }).setOrigin(0.5);
        this._renderBBButton(bbBtnBg, bbBar, bbBtnTxt, unit, tx, bbY, bbW, bbH);

        // Zone interactive BB
        const bbZone=this.add.rectangle(tx+bbW/2, bbY+bbH/2, bbW, bbH, 0x000000, 0)
            .setInteractive({useHandCursor:true});
        bbZone.on('pointerdown',()=>{
            if(unit.isKO||unit.hasActed||this.isBossTurn||unit.isAttacking) return;
            const type=unit.bbValue>=unit.bbCapacity?(unit.bbCapacity>=200?'sbb':'bb'):'normal';
            this.triggerAttack(unit,container,type);
        });
        bbZone.on('pointerover',()=>{ if(!unit.isKO&&!unit.hasActed&&unit.bbValue>=unit.bbCapacity){ bbBtnBg.alpha=1.2; }});
        bbZone.on('pointerout', ()=>{ bbBtnBg.alpha=1; });

        // Zone portrait cliquable
        const portZone=this.add.rectangle(portX+portW/2,portY+portH/2,portW,portH,0x000000,0)
            .setInteractive({useHandCursor:true});
        portZone.on('pointerdown',()=>{
            if(unit.isKO||unit.hasActed||this.isBossTurn||unit.isAttacking) return;
            this.triggerAttack(unit,container,'normal');
        });
        portZone.on('pointerover',()=>{
            if(!unit.isKO&&!unit.hasActed){
                cardBg.clear();
                cardBg.fillGradientStyle(0x121830,0x121830,0x0d1225,0x0d1225,1);
                cardBg.fillRoundedRect(cx,cy,CW,CH,6);
                cardBg.lineStyle(2.5,elCol,0.9); cardBg.strokeRoundedRect(cx,cy,CW,CH,6);
                cardBg.lineStyle(1,elCol,0.4); cardBg.strokeRoundedRect(cx+2,cy+2,CW-4,CH-4,4);
            }
        });
        portZone.on('pointerout', ()=>{
            cardBg.clear();
            cardBg.fillGradientStyle(0x0d1225,0x0d1225,0x08091a,0x08091a,1);
            cardBg.fillRoundedRect(cx,cy,CW,CH,6);
            cardBg.lineStyle(2,elCol,unit.hasActed?0.2:0.5); cardBg.strokeRoundedRect(cx,cy,CW,CH,6);
            cardBg.lineStyle(1,elCol,0.1); cardBg.strokeRoundedRect(cx+2,cy+2,CW-4,CH-4,4);
        });

        // Status overlay
        const statusTxt=this.add.text(portX+portW/2,portY+portH/2,'',{
            fontSize:'11px',fontFamily:'Rajdhani',fill:'#ff4444',fontStyle:'bold',stroke:'#000',strokeThickness:3
        }).setOrigin(0.5);

        // Stocker les refs
        container.hpBar=hpBar; container.hpShine=hpShine; container.hpVal=hpVal;
        container.bbBtnBg=bbBtnBg; container.bbBar=bbBar; container.bbBtnTxt=bbBtnTxt;
        container.bbGlow=this.add.graphics(); container.sbbGlow=this.add.graphics();
        container.cardBg=cardBg; container.statusLabel=statusTxt; container.unitSprite=heroImg;
        container.portGlow=portGlow;
        container.startX=0; container.startY=0; container.elemTint=elCol;
        container._unit=unit; container._cx=cx; container._cy=cy;
        container._CW=CW; container._CH=CH;
        container._hpBarX=tx; container._hpBarY=hpBarY2; container._hpBarW=hpBarW; container._hpBarH=hpBarH2;
        container._bbY=bbY; container._bbW=bbW; container._bbH=bbH;
        container._portX=portX; container._portY=portY; container._portW=portW; container._portH=portH;
    }

    _renderBBButton(bg, bar, txt, unit, tx, y, w, h) {
        bg.clear(); bar.clear();
        const ready = unit.bbValue >= unit.bbCapacity;
        const sbb   = unit.bbValue >= 200 && unit.bbCapacity >= 200;
        const pct   = Math.min(1, unit.bbValue / (unit.bbCapacity||100));

        if (unit.isKO) {
            bg.fillStyle(0x1a0000,0.95); bg.fillRoundedRect(tx,y,w,h,3);
            bg.lineStyle(1,0x440000,1); bg.strokeRoundedRect(tx,y,w,h,3);
            txt.setText('💀 KO').setColor('#ff4444');
        } else if (sbb) {
            // SBB — violet pulsant
            bg.fillGradientStyle(0x3a0055,0x3a0055,0x220033,0x220033,1);
            bg.fillRoundedRect(tx,y,w,h,3);
            bg.lineStyle(2,0xc084fc,1); bg.strokeRoundedRect(tx,y,w,h,3);
            bg.fillStyle(0xc084fc,0.2); bg.fillRoundedRect(tx,y,w*pct,h,3);
            bg.lineStyle(1,0xffffff,0.1); bg.lineBetween(tx,y+h/2,tx+w*pct,y+h/2);
            txt.setText('★ SUPER BRAVE BURST').setColor('#e8b4ff');
        } else if (ready) {
            // BB prêt — cyan brillant
            bg.fillGradientStyle(0x003355,0x003355,0x001a33,0x001a33,1);
            bg.fillRoundedRect(tx,y,w,h,3);
            bg.lineStyle(2,0x00d2ff,1); bg.strokeRoundedRect(tx,y,w,h,3);
            bg.fillStyle(0x00d2ff,0.18); bg.fillRoundedRect(tx,y,w*pct,h,3);
            bg.lineStyle(1,0xffffff,0.1); bg.lineBetween(tx,y+h/2,tx+w*pct,y+h/2);
            txt.setText('✦ BRAVE BURST').setColor('#00e5ff');
        } else {
            // Recharge — barre bleue sombre
            bg.fillStyle(0x080e1a,1); bg.fillRoundedRect(tx,y,w,h,3);
            bg.lineStyle(1,0x1a2f4a,1); bg.strokeRoundedRect(tx,y,w,h,3);
            if(pct>0){
                bar.fillStyle(0x005577,0.8); bar.fillRoundedRect(tx,y,w*pct,h,3);
                bar.fillStyle(0x0088aa,0.4); bar.fillRoundedRect(tx,y,w*pct,Math.floor(h/2),3);
            }
            txt.setText('BRAVE BURST').setColor('#2a4466');
        }
    }

    _computeHeroArenaPositions(count, arenaH) {
        const positions=[];
        const startX=105, stepY=count<=3?55:42;
        const baseY=arenaH*0.52;
        for(let i=0;i<count;i++){
            const offset=(i-(count-1)/2);
            positions.push({ x:startX+(i%2)*25, y:baseY+offset*stepY });
        }
        return positions;
    }

    _genTextures() {
        if (this.textures.exists('spark')) return;
        // Spark blanc
        const g=this.make.graphics({x:0,y:0,add:false});
        g.fillStyle(0xffffff,1); g.fillCircle(4,4,4);
        g.generateTexture('spark',8,8); g.destroy();
        // Braise orange
        const g2=this.make.graphics({x:0,y:0,add:false});
        g2.fillStyle(0xff7700,1); g2.fillCircle(3,3,3);
        g2.generateTexture('ember',6,6); g2.destroy();
        // Poussière
        const g3=this.make.graphics({x:0,y:0,add:false});
        g3.fillStyle(0xaaaaff,1); g3.fillCircle(2,2,2);
        g3.generateTexture('dust',4,4); g3.destroy();
        // Cristal BB
        const g4=this.make.graphics({x:0,y:0,add:false});
        g4.fillStyle(0x00ccff,1); g4.fillCircle(4,4,4);
        g4.fillStyle(0xffffff,0.7); g4.fillCircle(3,3,2);
        g4.generateTexture('crystal',8,8); g4.destroy();
    }

    _spawnEmbers(W, arenaH, bossEl) {
        const tints = {'Feu':[0xff6600,0xff3300,0xffaa00],'Eau':[0x00aaff,0x0055ff,0x44ddff],
                       'Foudre':[0xffff00,0xffaa00,0xffffff],'Ténèbres':[0x8800ff,0xaa00cc,0xff00ff],
                       'Lumière':[0xffffaa,0xffffff,0xffdd44],'Terre':[0x44ff88,0x00cc44,0x88ffaa]};
        const tc=tints[bossEl]||[0xff6600,0xff3300,0xffaa00];
        this.add.particles(0,0,'ember',{
            x:{min:80,max:W-80}, y:{min:arenaH*0.25,max:arenaH*0.9},
            speedY:{min:-70,max:-20}, speedX:{min:-20,max:20},
            scale:{start:1.2,end:0}, tint:tc,
            lifespan:{min:1800,max:3200}, frequency:150,
            blendMode:'ADD', alpha:{start:0.6,end:0}
        });
    }

    _spawnDust(W, arenaH) {
        this.add.particles(0,0,'dust',{
            x:{min:0,max:W}, y:{min:arenaH*0.5,max:arenaH},
            speedY:{min:-15,max:-3}, speedX:{min:-8,max:8},
            scale:{start:0.8,end:0}, tint:[0x8888aa,0x6666cc,0xaaaacc],
            lifespan:{min:3000,max:6000}, frequency:500,
            blendMode:'NORMAL', alpha:{start:0.3,end:0}
        });
    }

    _drawBossAura(g, x, y) {
        const col=this._ec(this.boss.types[0]);
        g.clear();
        // Aura extérieure (très transparente)
        for(let i=4;i>=0;i--){
            g.fillStyle(col, (5-i)*0.02);
            g.fillCircle(x,y,80+i*25);
        }
        // Anneaux brillants
        g.lineStyle(2,col,0.5); g.strokeCircle(x,y,95);
        g.lineStyle(1.5,col,0.25); g.strokeCircle(x,y,125);
        g.lineStyle(1,col,0.12); g.strokeCircle(x,y,155);
    }

    _redrawBossHP(x,y,w,h) {
        if(!x){ const m=this.bossHpMeta; if(!m) return; x=m.x;y=m.y;w=m.w;h=m.h; }
        const pct=this.boss.currentHp/this.boss.maxHp;
        // Dégradé de couleur selon HP
        const col=pct>0.6?0xcc1111:pct>0.35?0xcc6600:pct>0.15?0xff2200:0xff0000;
        this.bossHpGfx.clear();
        if(pct>0){
            const bw=Math.floor(w*pct);
            this.bossHpGfx.fillStyle(col,1);
            this.bossHpGfx.fillRoundedRect(x,y,bw,h,5);
            // Reflet haut
            this.bossHpGfx.fillStyle(0xffffff,0.15);
            this.bossHpGfx.fillRoundedRect(x,y,bw,Math.floor(h*0.45),5);
            // Ligne de brillance
            this.bossHpGfx.lineStyle(1,0xffffff,0.25);
            this.bossHpGfx.lineBetween(x+5,y+2,x+bw-5,y+2);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // COMBAT
    // ══════════════════════════════════════════════════════════════════════
    triggerAttack(unit, container, type) {
        unit.isAttacking=true; unit.hasActed=true; this.heroesActedThisRound++;

        const cx=container._cx, cy=container._cy, CW=container._CW, CH=container._CH;
        container.cardBg.clear();
        container.cardBg.fillGradientStyle(0x0a0c18,0x0a0c18,0x06080f,0x06080f,1);
        container.cardBg.fillRoundedRect(cx,cy,CW,CH,6);
        container.cardBg.lineStyle(2,container.elemTint,0.2); container.cardBg.strokeRoundedRect(cx,cy,CW,CH,6);
        // Effet "agi" — overlay sombre sur portrait
        if(container.portGlow){container.portGlow.alpha=0.3;}

        const now=Date.now();
        if(now-this.lastAttackTime<(this.odMode?800:400)){
            this.attacksInWindow++;
            if(this.attacksInWindow>=2) this.showSparkEffect();
        } else { this.attacksInWindow=1; }
        this.lastAttackTime=now;

        this._addOD(5);
        if(window.AudioEngine) window.AudioEngine.playHit();

        // Anim sprite arène
        const areaSpr=this.arenaHeroSprites[this.squadUnits.indexOf(unit)];
        if(areaSpr){
            this.tweens.killTweensOf(areaSpr.sprite);
            this.tweens.add({
                targets:areaSpr.sprite, x:areaSpr.baseX+85,
                duration:90, ease:'Power3', yoyo:true,
                onYoyo:()=>{ if(type==='sbb'||type==='bb') this._flashArenaAttack(areaSpr,unit,type); }
            });
            // Flash d'aura lors de l'attaque
            this.tweens.add({targets:areaSpr.aura2,alpha:{from:1,to:0},duration:300});
        }

        if     (type==='sbb') this.executeSuperBraveBurst(unit,container);
        else if(type==='bb')  this.executeBraveBurst(unit,container);
        else                  this.executeNormalAttack(unit,container);
    }

    _flashArenaAttack(areaSpr, unit, type) {
        const col=type==='sbb'?0xc084fc:0x00d2ff;
        // Ring d'énergie qui s'expanse
        const ring=this.add.graphics();
        ring.lineStyle(3,col,0.9); ring.strokeCircle(areaSpr.baseX,areaSpr.baseY,30);
        this.tweens.add({targets:ring,scaleX:4,scaleY:4,alpha:0,duration:400,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
        // Flash de lumière
        const flash=this.add.graphics();
        flash.fillStyle(col,0.25); flash.fillCircle(areaSpr.baseX,areaSpr.baseY,55);
        this.tweens.add({targets:flash,alpha:0,duration:250,onComplete:()=>flash.destroy()});
    }

    _addOD(v) {
        this.odGauge=Math.min(100,this.odGauge+v);
        const m=this.odBarMeta;
        this.odBar.clear();
        const pct=this.odGauge/100;
        if(pct>0){
            // Dégradé or → rouge selon remplissage
            const col=pct<0.5?0xf1c40f:pct<0.8?0xff8800:0xff4400;
            this.odBar.fillStyle(col,1);
            this.odBar.fillRoundedRect(m.x,m.y,Math.floor(m.w*pct),m.h,4);
            // Reflet
            this.odBar.fillStyle(0xffffff,0.25);
            this.odBar.fillRoundedRect(m.x,m.y,Math.floor(m.w*pct),Math.floor(m.h*0.45),4);
            // Brillance centrale
            this.odBar.lineStyle(1,0xffffff,0.2);
            this.odBar.lineBetween(m.x+4,m.y+2,m.x+Math.floor(m.w*pct)-4,m.y+2);
        }
        if(typeof updateODDisplay==='function') updateODDisplay(this.odGauge);
    }

    activateOD() {
        if(this.odGauge<100||this.isBossTurn) return;
        this.odGauge=0; this.odMode=true; this.odTurnsLeft=3;
        this.odBar.clear();
        if(typeof updateODDisplay==='function') updateODDisplay(0);
        this.showPopup(270,this.ARENA_H/2,'⚡ OVERDRIVE !','#f1c40f',52);
        this.cameras.main.shake(300,0.025);
        this.cameras.main.flash(200,255,180,0,false);
        // Effet d'onde de choc OD
        for(let r=0;r<3;r++){
            this.time.delayedCall(r*100,()=>{
                const od=this.add.graphics();
                od.lineStyle(3,0xf1c40f,0.8); od.strokeRect(0,0,540,this.ARENA_H);
                this.tweens.add({targets:od,scaleX:1.1,scaleY:1.1,alpha:0,duration:500,ease:'Cubic.easeOut',onComplete:()=>od.destroy()});
            });
        }
        // Overlay flash doré
        const odFlash=this.add.graphics();
        odFlash.fillStyle(0xf1c40f,0.15); odFlash.fillRect(0,0,540,this.ARENA_H);
        this.tweens.add({targets:odFlash,alpha:0,duration:1000,onComplete:()=>odFlash.destroy()});
    }

    executeNormalAttack(attacker, container) {
        const isSpark=this.attacksInWindow>=2;
        this.time.delayedCall(80,()=>{
            const dmg=this.calculateDamage(attacker,this.boss,42,isSpark);
            const elM=this.getDamageMultiplier(attacker.types[0],this.boss.types[0]);
            const col=elM>1?'#f1c40f':elM<1?'#6699ff':'#ff9966';
            this.applyDamageToBoss(dmg,col);
            this.bossHitFlash(0xffffff);
            const sph=this._getSphereData(attacker.equippedSphere);
            this.spawnCrystals(attacker,container,false,sph?sph.bbGainMult:1.0);
            if(isSpark) this.showSparkEffect();
            attacker.isAttacking=false; this.checkRoundEnd();
        });
    }

    _showCutIn(name, skillName, colorHex, assetKey) {
        const col=Phaser.Display.Color.HexStringToColor(colorHex.replace('#','')).color;
        const ov  =this.add.rectangle(270,this.ARENA_H/2,540,this.ARENA_H,0x000000,0).setDepth(100).setAlpha(0);
        const s1  =this.add.rectangle(270,this.ARENA_H/2,540,200,col,1).setDepth(101).setScaleY(0);
        const s2  =this.add.rectangle(270,this.ARENA_H/2,540,180,0x000000,0.5).setDepth(101).setScaleY(0);
        // Lignes déco cut-in
        const lines=this.add.graphics().setDepth(102);
        lines.lineStyle(2,0xffffff,0.3); lines.lineBetween(0,this.ARENA_H/2-95,540,this.ARENA_H/2-95);
        lines.lineBetween(0,this.ARENA_H/2+95,540,this.ARENA_H/2+95);
        const port=this.add.image(-100,this.ARENA_H/2,assetKey).setDisplaySize(240,240).setDepth(103).setAlpha(0);
        const tn  =this.add.text(580,this.ARENA_H/2-30,name,{
            fontSize:'40px',fontFamily:'Cinzel',fill:'#fff',fontStyle:'bold',stroke:'#000',strokeThickness:6
        }).setOrigin(0,0.5).setDepth(104).setAlpha(0);
        const ts  =this.add.text(270,this.ARENA_H/2+22,skillName,{
            fontSize:'20px',fontFamily:'Rajdhani',fill:colorHex,fontStyle:'bold',stroke:'#000',strokeThickness:4
        }).setOrigin(0.5).setDepth(104).setAlpha(0).setScale(0.4);
        // Flash d'entrée
        this.cameras.main.flash(80,255,255,255,false);
        this.tweens.add({targets:ov,alpha:1,duration:60});
        this.tweens.add({targets:[s1,s2],scaleY:1,duration:90,ease:'Cubic.easeOut'});
        this.tweens.add({targets:port,x:160,alpha:1,duration:180,ease:'Back.easeOut'});
        this.tweens.add({targets:tn,x:290,alpha:1,duration:180,ease:'Back.easeOut',delay:40});
        this.tweens.add({targets:ts,scale:1,alpha:1,duration:240,ease:'Elastic.easeOut',delay:80});
        this.cameras.main.shake(80,0.012);
        this.time.delayedCall(1200,()=>{
            this.tweens.add({targets:[ov,s1,s2,port,tn,ts,lines],alpha:0,duration:150,
                onComplete:()=>[ov,s1,s2,port,tn,ts,lines].forEach(o=>o.destroy())});
        });
    }

    executeBraveBurst(attacker, container) {
        this._resetBBBar(attacker, container);
        if(window.AudioEngine) window.AudioEngine.playBB();
        this._addOD(12);
        this._showCutIn(attacker.name,'✦ BRAVE BURST','#00d2ff',attacker.assetKey);
        this.time.delayedCall(800,()=>{
            this.cameras.main.shake(160,0.018); this.cameras.main.flash(60,0,210,255,false);
            const dmg=this.calculateDamage(attacker,this.boss,90);
            this.applyDamageToBoss(dmg,'#00d2ff'); this.bossHitFlash(0x00d2ff);
            // Onde d'énergie BB
            const bbRing=this.add.graphics();
            bbRing.lineStyle(4,0x00d2ff,1); bbRing.strokeCircle(this.BOSS_X,this.BOSS_Y,30);
            this.tweens.add({targets:bbRing,scaleX:6,scaleY:6,alpha:0,duration:600,ease:'Cubic.easeOut',onComplete:()=>bbRing.destroy()});
            this.spawnCrystals(attacker,container,true,1.0);
            attacker.isAttacking=false; this.checkRoundEnd();
        });
    }

    executeSuperBraveBurst(attacker, container) {
        this._resetBBBar(attacker, container);
        if(window.AudioEngine) window.AudioEngine.playSBB();
        this._addOD(22);
        this.cameras.main.flash(100,180,100,255,false);
        this._showCutIn(attacker.name,'★ SUPER BRAVE BURST ★','#c084fc',attacker.assetKey);
        this.time.delayedCall(800,()=>{
            this.cameras.main.shake(280,0.035); this.cameras.main.flash(80,180,80,255,false);
            const d1=this.calculateDamage(attacker,this.boss,155);
            this.applyDamageToBoss(d1,'#c084fc');
            this.time.delayedCall(150,()=>this.applyDamageToBoss(Math.floor(d1*0.5),'#ff88cc'));
            this.time.delayedCall(300,()=>this.applyDamageToBoss(Math.floor(d1*0.3),'#ffaaff'));
            this.bossHitFlash(0xc084fc);
            this.spawnCrystals(attacker,container,true,1.6);
            // Triple onde SBB
            for(let r=0;r<3;r++){
                this.time.delayedCall(r*120,()=>{
                    const ring=this.add.graphics();
                    ring.lineStyle(3,0xc084fc,0.9); ring.strokeCircle(this.BOSS_X,this.BOSS_Y,35);
                    this.tweens.add({targets:ring,scaleX:6,scaleY:6,alpha:0,duration:600,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
                });
            }
            // Explosion particules SBB
            const em=this.add.particles(this.BOSS_X,this.BOSS_Y,'spark',{
                speed:{min:200,max:500},angle:{min:0,max:360},
                scale:{start:2,end:0},tint:[0xc084fc,0xffffff,0xff88ff,0x8800ff],
                lifespan:600,blendMode:'ADD',quantity:30
            });
            em.explode(30,this.BOSS_X,this.BOSS_Y);
            this.time.delayedCall(700,()=>em.destroy());
            attacker.isAttacking=false; this.checkRoundEnd();
        });
    }

    _resetBBBar(unit, container) {
        unit.bbValue=0;
        this._renderBBButton(container.bbBtnBg,container.bbBar,container.bbBtnTxt,unit,
            container._hpBarX, container._bbY, container._bbW, container._bbH);
    }

    checkRoundEnd() {
        const active=this.squadUnits.filter(u=>!u.isKO);
        if(!active.every(u=>u.hasActed)) return;
        this.isBossTurn=true;
        if(this.boss.statusEffects.includes('poison')) this.time.delayedCall(250,()=>this.applyDamageToBoss(280,'#a0e8a0'));
        if(this.odMode&&--this.odTurnsLeft<=0) this.odMode=false;
        this.time.delayedCall(900,()=>this.bossTurn());
    }

    bossTurn() {
        this.roundNumber++;
        if(this.roundText) this.roundText.setText(`${this.roundNumber}`);

        // Flash rouge arène
        const bl=this.add.graphics();
        bl.fillStyle(0xaa0000,0.1); bl.fillRect(0,0,540,this.ARENA_H);
        this.tweens.add({targets:bl,alpha:0,duration:600,onComplete:()=>bl.destroy()});
        this.cameras.main.flash(40,255,0,0,false);
        this.cameras.main.shake(100,0.012);

        // Anim boss (plonge vers héros)
        if(this.bossSprite){
            this.tweens.add({targets:this.bossSprite,x:this.BOSS_X-80,duration:200,yoyo:true,ease:'Power2'});
        }

        this.squadUnits.forEach((unit,idx)=>{
            if(unit.isKO) return;
            const dmg=Math.max(6,Math.floor(this.boss.baseStats.atk*0.55-unit.baseStats.def*0.28));
            this.time.delayedCall(idx*80,()=>this.applyDamageToHero(unit,idx,dmg));
        });

        this.time.delayedCall(1100,()=>{
            this.squadUnits.forEach(u=>{ if(!u.isKO) u.hasActed=false; });
            this.heroesActedThisRound=0; this.isBossTurn=false;
            // Reset cartes
            this.squadUnits.forEach((u,i)=>{
                if(!u.isKO){
                    const sp=this.squadSprites[i];
                    const cx=sp._cx,cy=sp._cy,CW=sp._CW,CH=sp._CH;
                    sp.cardBg.clear();
                    sp.cardBg.fillGradientStyle(0x0d1225,0x0d1225,0x08091a,0x08091a,1);
                    sp.cardBg.fillRoundedRect(cx,cy,CW,CH,6);
                    sp.cardBg.lineStyle(2,sp.elemTint,0.5); sp.cardBg.strokeRoundedRect(cx,cy,CW,CH,6);
                    if(sp.portGlow) sp.portGlow.alpha=0.08;
                }
            });
        });
    }

    applyDamageToHero(unit, idx, amount) {
        unit.currentHp=Math.max(0,unit.currentHp-amount);
        const sp=this.squadSprites[idx];
        this._updateHeroCard(unit,sp);
        this.showPopup(sp._cx+sp._CW/2+Phaser.Math.Between(-20,20), sp._cy+10, `-${amount}`,'#ff5544',18);
        sp.unitSprite.setTint(0xff4444);
        this.time.delayedCall(120,()=>{ if(!unit.isKO) sp.unitSprite.clearTint(); });

        if(unit.currentHp<=0&&!unit.isKO){
            unit.isKO=true;
            sp.unitSprite.setTint(0x334355);
            sp.statusLabel.setText('KO');
            const as=this.arenaHeroSprites[idx];
            if(as){
                this.tweens.add({targets:[as.sprite,as.aura1,as.aura2],alpha:0,duration:500,ease:'Power2'});
                this.tweens.add({targets:as.footGlow,alpha:0,duration:300});
            }
            this._renderBBButton(sp.bbBtnBg,sp.bbBar,sp.bbBtnTxt,unit,sp._hpBarX,sp._bbY,sp._bbW,sp._bbH);
            if(this.squadUnits.every(u=>u.isKO)) this._allDefeated();
        }
    }

    _updateHeroCard(unit, sp) {
        const pct=unit.currentHp/unit.maxHp;
        const col=pct>0.5?0x33cc55:pct>0.25?0xddaa00:0xcc2200;
        const bw=Math.max(0,sp._hpBarW*pct);
        sp.hpBar.clear(); sp.hpShine.clear();
        sp.hpBar.fillStyle(col,1); sp.hpBar.fillRoundedRect(sp._hpBarX,sp._hpBarY,bw,sp._hpBarH,2);
        sp.hpShine.fillStyle(0xffffff,0.2); sp.hpShine.fillRoundedRect(sp._hpBarX,sp._hpBarY,bw,Math.floor(sp._hpBarH/2),2);
        sp.hpVal.setText(`${unit.currentHp}/${unit.maxHp}`);
    }

    _allDefeated() {
        this.cameras.main.shake(500,0.045);
        this.showPopup(270,150,'💀 DÉFAITE','#e74c3c',60);
        // Vignette de défaite
        const veil=this.add.graphics(); veil.fillStyle(0x220000,0); veil.fillRect(0,0,540,960);
        this.tweens.add({targets:veil,fillAlpha:0.6,duration:1500});
        this.time.delayedCall(3000,()=>{
            document.getElementById('game-container').style.display='none';
            document.getElementById('map-screen').style.display='flex';
            if(typeof renderWorldMap==='function'&&window.gameState?.currentMap)
                renderWorldMap(window.gameState.currentMap,document.getElementById('map-container'));
            window.MusicManager.play('map', true);
        });
    }

    applyDamageToBoss(amount, color) {
        if(this.boss.currentHp<=0) return;
        this.boss.currentHp=Math.max(0,this.boss.currentHp-amount);
        this._redrawBossHP();
        if(this.bossHpText) this.bossHpText.setText(`${this.boss.currentHp} / ${this.boss.maxHp}`);
        if(this.bossHpPct) this.bossHpPct.setText(`${Math.round(this.boss.currentHp/this.boss.maxHp*100)}%`);
        this.showPopup(this.BOSS_X+Phaser.Math.Between(-50,50), this.BOSS_Y+Phaser.Math.Between(-60,60), `-${amount}`, color, 30);
        if(this.boss.currentHp<=0) this.bossDefeated();
    }

    bossHitFlash(tint=0xffffff) {
        this.bossSprite.setTint(tint);
        this.cameras.main.shake(100,0.014);
        this.time.delayedCall(80,()=>this.bossSprite.clearTint());
        // Explosion d'impact
        const hx=this.BOSS_X+Phaser.Math.Between(-40,40), hy=this.BOSS_Y+Phaser.Math.Between(-40,40);
        const em=this.add.particles(hx,hy,'spark',{
            speed:{min:150,max:400},angle:{min:0,max:360},
            scale:{start:1.8,end:0},tint:[0xffaa00,0xffffff,0xff5500,tint],
            lifespan:400,blendMode:'ADD'
        });
        em.explode(18,hx,hy);
        this.time.delayedCall(500,()=>em.destroy());
        // Flash d'impact sur le boss
        const bFlash=this.add.graphics();
        bFlash.fillStyle(tint,0.2); bFlash.fillCircle(this.BOSS_X,this.BOSS_Y,90);
        this.tweens.add({targets:bFlash,alpha:0,duration:200,onComplete:()=>bFlash.destroy()});
    }

    bossDefeated() {
        this.bossSprite.setTint(0x8888aa);
        this.cameras.main.shake(400,0.05); this.cameras.main.flash(400,255,255,255,false);
        // Grande explosion finale
        const em=this.add.particles(this.BOSS_X,this.BOSS_Y,'spark',{
            speed:{min:200,max:600},angle:{min:0,max:360},
            scale:{start:2.5,end:0},tint:[0xffffff,0xc084fc,0x00f0ff,0xf1c40f,0xff7700,0xff0088],
            lifespan:1000,blendMode:'ADD'
        });
        em.explode(70,this.BOSS_X,this.BOSS_Y);
        // Ondes multiples de victoire
        for(let r=0;r<4;r++){
            this.time.delayedCall(r*200,()=>{
                const vRing=this.add.graphics();
                vRing.lineStyle(4,0xf1c40f,0.8); vRing.strokeCircle(this.BOSS_X,this.BOSS_Y,40);
                this.tweens.add({targets:vRing,scaleX:7,scaleY:7,alpha:0,duration:800,ease:'Cubic.easeOut',onComplete:()=>vRing.destroy()});
            });
        }
        this.time.delayedCall(400,()=>this.showPopup(270,150,'🏆 VICTOIRE !','#f1c40f',54));
        this.time.delayedCall(2200,()=>{ em.destroy(); this._computeAndShowResults(); });
    }

    showSparkEffect() {
        const hx=this.BOSS_X+Phaser.Math.Between(-55,55), hy=this.BOSS_Y+Phaser.Math.Between(-55,55);
        const t=this.add.text(hx,hy,'⚡ SPARK!',{
            fontSize:'26px',fontFamily:'Cinzel',fontStyle:'bold',fill:'#fff',
            stroke:'#f1c40f',strokeThickness:5
        }).setOrigin(0.5).setDepth(150);
        this.tweens.add({targets:t,scale:{from:0.4,to:1.6},y:hy-70,alpha:{from:1,to:0},ease:'Back.easeOut',duration:700,onComplete:()=>t.destroy()});
        const em=this.add.particles(hx,hy,'spark',{
            speed:{min:250,max:500},scale:{start:1.5,end:0},
            tint:[0xffffff,0xf1c40f,0xffdd00],lifespan:300,blendMode:'ADD'
        });
        em.explode(14,hx,hy);
        this.time.delayedCall(350,()=>em.destroy());
        this._addOD(5);
    }

    spawnCrystals(unit, container, isBB=false, bcMult=1.0) {
        const count=isBB?8:3;
        const DEST_X=container._cx+container._CW/2, DEST_Y=container._cy+container._CH/2;
        const col=unit.bbValue>unit.bbCapacity*0.7?0xc084fc:0x00d2ff;
        for(let j=0;j<count;j++){
            this.time.delayedCall(j*40,()=>{
                const cx=this.add.graphics();
                cx.fillStyle(col,0.95); cx.fillCircle(0,0,5);
                cx.fillStyle(0xffffff,0.5); cx.fillCircle(-1,-1,2);
                cx.lineStyle(1,0xffffff,0.4); cx.strokeCircle(0,0,5);
                cx.setPosition(this.BOSS_X+Phaser.Math.Between(-30,30), this.BOSS_Y+Phaser.Math.Between(-30,30));
                // Trail
                const trail=this.add.graphics();
                this.tweens.add({targets:cx,x:DEST_X,y:DEST_Y,duration:Phaser.Math.Between(320,500),ease:'Back.easeIn',
                    onUpdate:()=>{
                        trail.clear();
                        trail.fillStyle(col,0.15); trail.fillCircle(cx.x,cx.y,3);
                    },
                    onComplete:()=>{
                        cx.destroy(); trail.destroy();
                        const gain=Math.floor(10*bcMult*(this.odMode?2:1));
                        unit.bbValue=Math.min(unit.bbCapacity,unit.bbValue+gain);
                        this._renderBBButton(container.bbBtnBg,container.bbBar,container.bbBtnTxt,
                            unit,container._hpBarX,container._bbY,container._bbW,container._bbH);
                        // Flash card si BB prêt
                        if(unit.bbValue>=unit.bbCapacity&&!unit.isKO){
                            const bbCol=unit.bbCapacity>=200?0xc084fc:0x00d2ff;
                            const f=this.add.graphics();
                            f.fillStyle(bbCol,0.15); f.fillRoundedRect(container._cx,container._cy,container._CW,container._CH,6);
                            this.tweens.add({targets:f,alpha:0,duration:500,onComplete:()=>f.destroy()});
                        }
                    }
                });
            });
        }
    }

    showPopup(x,y,text,color,size=22) {
        const t=this.add.text(x,y,text,{
            fontSize:`${size}px`,fontFamily:'Cinzel',fontStyle:'bold',fill:color,
            stroke:'#000',strokeThickness:size>25?5:4
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({targets:t,y:y-65,scale:{from:0.5,to:1.3},alpha:{from:1,to:0},ease:'Back.easeOut',duration:880,onComplete:()=>t.destroy()});
    }

    _computeAndShowResults() {
        if(typeof onBattleWin!=='function') return;
        const isBoss=this.boss.maxHp>=5000, sc=this.boss.maxHp/2000;
        const gems=isBoss?3+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2);
        const zel=Math.floor(300*sc+Math.random()*200*sc);
        const exp=Math.floor(150*sc);
        const mr=Math.random();
        const material=(isBoss||mr<0.25)?(mr<0.10||isBoss?'Mimique 🏺':mr<0.18?'Totem 🔮':'Idole 💡'):null;
        onBattleWin(this.currentNodeId,{enemyName:this.boss.name,expPerUnit:exp,gems,zel,material});
    }

    update() {}
}
