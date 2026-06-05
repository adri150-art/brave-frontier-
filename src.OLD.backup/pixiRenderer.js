// ================================================================
// BRAVE FRONTIER WEB — PixiJS Visual Engine
// Backgrounds animés, effets de lueur, particules épiques
// ================================================================

class BFPixiRenderer {
    constructor() {
        this.apps = {};
        this._timers = [];
        this._active = null;
    }

    // ────────────────────────────────────────────────────────────
    // UTILITAIRES
    // ────────────────────────────────────────────────────────────
    _makeApp(canvas) {
        return new PIXI.Application({
            view: canvas,
            width: 540, height: 960,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
    }

    _lerp(a, b, t) { return a + (b - a) * t; }
    _rand(min, max) { return min + Math.random() * (max - min); }
    _randInt(min, max) { return Math.floor(this._rand(min, max + 1)); }

    _drawGradientRect(g, x, y, w, h, colors) {
        // Simule un dégradé vertical avec des bandes
        const steps = 32;
        const sh = h / steps;
        colors.forEach((c, ci) => {
            if (ci === colors.length - 1) return;
            const c1 = colors[ci], c2 = colors[ci + 1];
            const segSteps = Math.ceil(steps / (colors.length - 1));
            const startStep = ci * segSteps;
            for (let s = 0; s < segSteps && startStep + s < steps; s++) {
                const t = s / segSteps;
                const r = Math.round(this._lerp((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t));
                const gv = Math.round(this._lerp((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t));
                const b = Math.round(this._lerp(c1 & 0xff, c2 & 0xff, t));
                const col = (r << 16) | (gv << 8) | b;
                g.beginFill(col, 1);
                g.drawRect(x, y + (startStep + s) * sh, w, sh + 1);
                g.endFill();
            }
        });
    }

    // ────────────────────────────────────────────────────────────
    // ÉCRAN ACCUEIL — Cosmos épique
    // ────────────────────────────────────────────────────────────
    initHome() {
        this.destroy('home');
        const canvas = document.getElementById('pixi-home');
        if (!canvas) return;
        const app = this._makeApp(canvas);
        this.apps['home'] = app;
        const W = 540, H = 960;

        // ── FOND cosmos dégradé
        const bg = new PIXI.Graphics();
        this._drawGradientRect(bg, 0, 0, W, H, [0x020010, 0x08003a, 0x120055, 0x06002a, 0x010008]);
        app.stage.addChild(bg);

        // ── NÉBULEUSES (grandes taches colorées flottantes)
        const nebulas = new PIXI.Container();
        app.stage.addChild(nebulas);
        const nebulaColors = [0x3d0080, 0x001a80, 0x800030, 0x003d80, 0x1a0040];
        for (let n = 0; n < 8; n++) {
            const gfx = new PIXI.Graphics();
            const cx = this._rand(50, W - 50);
            const cy = this._rand(30, H - 200);
            const rx = this._rand(80, 200);
            const ry = this._rand(50, 130);
            const col = nebulaColors[this._randInt(0, nebulaColors.length - 1)];
            for (let r = 3; r >= 0; r--) {
                gfx.beginFill(col, (4 - r) * 0.022);
                gfx.drawEllipse(cx, cy, rx * (1 + r * 0.35), ry * (1 + r * 0.35));
                gfx.endFill();
            }
            gfx._ox = cx; gfx._oy = cy;
            gfx._vx = this._rand(-0.08, 0.08);
            gfx._vy = this._rand(-0.04, 0.04);
            gfx._phase = this._rand(0, Math.PI * 2);
            nebulas.addChild(gfx);
        }

        // ── ÉTOILES multi-couches (parallaxe)
        const starLayers = [];
        [
            { count: 180, size: 0.6, speed: 0.1, alpha: 0.4 },
            { count: 90,  size: 1.1, speed: 0.2, alpha: 0.65 },
            { count: 35,  size: 1.8, speed: 0.35, alpha: 0.9 }
        ].forEach(cfg => {
            const layer = new PIXI.Container();
            app.stage.addChild(layer);
            const stars = [];
            for (let i = 0; i < cfg.count; i++) {
                const gfx = new PIXI.Graphics();
                const x = this._rand(0, W);
                const y = this._rand(0, H);
                gfx.beginFill(0xffffff, cfg.alpha);
                gfx.drawCircle(0, 0, cfg.size);
                gfx.endFill();
                gfx.position.set(x, y);
                gfx._baseAlpha = cfg.alpha;
                gfx._phase = this._rand(0, Math.PI * 2);
                gfx._twinkleSpeed = this._rand(0.6, 2.5);
                layer.addChild(gfx);
                stars.push(gfx);
            }
            starLayers.push({ stars, speed: cfg.speed });
        });

        // ── ÉTOILES FILANTES
        const shootingStars = [];
        const addShootingStar = () => {
            const ss = new PIXI.Graphics();
            ss._x = this._rand(-100, W + 100);
            ss._y = this._rand(-50, H * 0.6);
            ss._vx = this._rand(3, 8);
            ss._vy = this._rand(2, 5);
            ss._life = 0;
            ss._maxLife = this._rand(40, 80);
            ss._len = this._rand(60, 150);
            app.stage.addChild(ss);
            shootingStars.push(ss);
        };
        for (let i = 0; i < 3; i++) addShootingStar();

        // ── PILIERS DE LUMIÈRE (bas vers haut, dorés)
        const pillars = new PIXI.Container();
        app.stage.addChild(pillars);
        for (let p = 0; p < 5; p++) {
            const gfx = new PIXI.Graphics();
            const px = this._rand(80, W - 80);
            const pw = this._rand(20, 60);
            gfx.beginFill(0xffaa00, 0.025);
            gfx.drawRect(px - pw / 2, 0, pw, H);
            gfx.endFill();
            gfx.beginFill(0xffcc44, 0.04);
            gfx.drawRect(px - pw / 6, 0, pw / 3, H);
            gfx.endFill();
            gfx._phase = this._rand(0, Math.PI * 2);
            gfx._speed = this._rand(0.008, 0.02);
            pillars.addChild(gfx);
        }

        // ── ORBES FLOTTANTS (sphères lumineuses colorées)
        const orbs = [];
        const orbColors = [0x00ccff, 0xaa00ff, 0xff6600, 0x00ff99, 0xff0066];
        for (let o = 0; o < 12; o++) {
            const gfx = new PIXI.Graphics();
            const col = orbColors[this._randInt(0, orbColors.length - 1)];
            const r = this._rand(2, 7);
            for (let i = 3; i >= 0; i--) {
                gfx.beginFill(col, (4 - i) * 0.1);
                gfx.drawCircle(0, 0, r * (1 + i * 0.8));
                gfx.endFill();
            }
            gfx.beginFill(0xffffff, 0.7);
            gfx.drawCircle(0, 0, r * 0.3);
            gfx.endFill();
            gfx.position.set(this._rand(30, W - 30), this._rand(100, H - 200));
            gfx._vx = this._rand(-0.4, 0.4);
            gfx._vy = this._rand(-0.6, -0.1);
            gfx._phase = this._rand(0, Math.PI * 2);
            gfx._col = col;
            app.stage.addChild(gfx);
            orbs.push(gfx);
        }

        // ── AURORA (bas de l'écran, vagues colorées)
        const aurora = new PIXI.Graphics();
        app.stage.addChild(aurora);

        // ── VIGNETTE
        const vig = new PIXI.Graphics();
        for (let v = 0; v < 10; v++) {
            vig.lineStyle(20 + v * 5, 0x000000, 0.06 + v * 0.01);
            vig.drawRect(0, 0, W, H);
        }
        app.stage.addChild(vig);

        // ── ANIMATION LOOP
        let tick = 0;
        app.ticker.add(() => {
            tick += 0.016;

            // Nébuleuses flottantes
            nebulas.children.forEach(n => {
                n.x = Math.sin(tick * 0.15 + n._phase) * 20;
                n.y = Math.cos(tick * 0.1 + n._phase) * 12;
                n.alpha = 0.8 + Math.sin(tick * 0.3 + n._phase) * 0.2;
            });

            // Étoiles scintillantes
            starLayers.forEach(layer => {
                layer.stars.forEach(s => {
                    s.alpha = s._baseAlpha * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(tick * s._twinkleSpeed + s._phase)));
                });
            });

            // Étoiles filantes
            shootingStars.forEach((ss, idx) => {
                ss._life++;
                if (ss._life > ss._maxLife) {
                    ss.clear();
                    ss._x = this._rand(-100, W + 100);
                    ss._y = this._rand(-50, H * 0.5);
                    ss._vx = this._rand(3, 9);
                    ss._vy = this._rand(2, 5);
                    ss._life = 0;
                    ss._maxLife = this._rand(50, 90);
                    ss._len = this._rand(70, 160);
                }
                ss._x += ss._vx;
                ss._y += ss._vy;
                const p = ss._life / ss._maxLife;
                const alpha = p < 0.3 ? p / 0.3 : p > 0.7 ? (1 - p) / 0.3 : 1;
                ss.clear();
                ss.lineStyle(1.5, 0xffffff, alpha * 0.9);
                ss.moveTo(ss._x, ss._y);
                ss.lineTo(ss._x - ss._vx / ss._vx * ss._len, ss._y - ss._vy / ss._vx * ss._len);
                ss.lineStyle(0.5, 0xccddff, alpha * 0.5);
                ss.moveTo(ss._x, ss._y);
                ss.lineTo(ss._x - ss._vx / ss._vx * ss._len * 0.6, ss._y - ss._vy / ss._vx * ss._len * 0.6);
            });

            // Piliers lumineux pulsants
            pillars.children.forEach(p => {
                p.alpha = 0.5 + 0.5 * Math.sin(tick * p._speed * 60 + p._phase);
            });

            // Orbes flottants
            orbs.forEach(orb => {
                orb.position.x += orb._vx;
                orb.position.y += orb._vy;
                orb.alpha = 0.6 + 0.4 * Math.sin(tick * 2 + orb._phase);
                if (orb.position.y < -20) { orb.position.y = H + 20; orb.position.x = this._rand(30, W - 30); }
                if (orb.position.x < -20) orb.position.x = W + 20;
                if (orb.position.x > W + 20) orb.position.x = -20;
            });

            // Aurora au bas
            aurora.clear();
            for (let a = 0; a < 4; a++) {
                const aY = H - 180 + a * 35;
                const aAlpha = 0.035 - a * 0.007;
                const aCol = a % 2 === 0 ? 0x4400ff : 0x00aaff;
                aurora.beginFill(aCol, aAlpha);
                aurora.moveTo(0, aY);
                for (let x = 0; x <= W; x += 20) {
                    const waveY = aY + Math.sin(tick * 0.8 + x * 0.015 + a) * 18;
                    aurora.lineTo(x, waveY);
                }
                aurora.lineTo(W, H); aurora.lineTo(0, H);
                aurora.endFill();
            }
        });
    }

    // ────────────────────────────────────────────────────────────
    // ÉCRAN CARTE — Paysage fantastique épique
    // ────────────────────────────────────────────────────────────
    initMap() {
        this.destroy('map');
        const canvas = document.getElementById('pixi-map');
        if (!canvas) return;
        const app = this._makeApp(canvas);
        this.apps['map'] = app;
        const W = 540, H = 960;

        // ── Ciel crépuscule
        const sky = new PIXI.Graphics();
        this._drawGradientRect(sky, 0, 0, W, H * 0.55,
            [0x001030, 0x0a1a50, 0x1a0840, 0x2a0a20]);
        app.stage.addChild(sky);

        // ── Sol / terrain
        const terrain = new PIXI.Graphics();
        this._drawGradientRect(terrain, 0, H * 0.55, W, H * 0.45,
            [0x050f20, 0x0a1a10, 0x060d05]);
        app.stage.addChild(terrain);

        // ── Montagnes lointaines (silhouettes)
        const mtns = new PIXI.Graphics();
        const mtnPts = [[0,H*0.56],[60,H*0.3],[120,H*0.45],[180,H*0.22],[240,H*0.38],[300,H*0.18],[360,H*0.32],[420,H*0.25],[480,H*0.4],[540,H*0.35],[540,H*0.56]];
        mtns.beginFill(0x0d1525, 1);
        mtns.moveTo(mtnPts[0][0], mtnPts[0][1]);
        mtnPts.forEach(p => mtns.lineTo(p[0], p[1]));
        mtns.closePath(); mtns.endFill();
        // Deuxième rang
        const mtnPts2 = [[0,H*0.58],[80,H*0.42],[160,H*0.52],[220,H*0.35],[280,H*0.48],[340,H*0.38],[400,H*0.5],[460,H*0.42],[540,H*0.55],[540,H*0.58]];
        mtns.beginFill(0x08101e, 1);
        mtns.moveTo(mtnPts2[0][0], mtnPts2[0][1]);
        mtnPts2.forEach(p => mtns.lineTo(p[0], p[1]));
        mtns.closePath(); mtns.endFill();
        app.stage.addChild(mtns);

        // ── Étoiles
        const stars = new PIXI.Container();
        app.stage.addChild(stars);
        const starArr = [];
        for (let i = 0; i < 200; i++) {
            const g = new PIXI.Graphics();
            const size = this._rand(0.5, 2);
            g.beginFill(0xffffff, this._rand(0.3, 0.9));
            g.drawCircle(0, 0, size);
            g.endFill();
            g.position.set(this._rand(0, W), this._rand(0, H * 0.55));
            g._phase = this._rand(0, Math.PI * 2);
            g._speed = this._rand(0.8, 2.5);
            stars.addChild(g);
            starArr.push(g);
        }

        // ── Lune / astre
        const moon = new PIXI.Graphics();
        moon.beginFill(0xfff8e0, 0.9);
        moon.drawCircle(420, 90, 32);
        moon.endFill();
        moon.beginFill(0xffeeaa, 0.3);
        moon.drawCircle(420, 90, 52);
        moon.endFill();
        moon.beginFill(0xffdd88, 0.12);
        moon.drawCircle(420, 90, 80);
        moon.endFill();
        app.stage.addChild(moon);

        // ── Brume (bas de l'écran)
        const fog = new PIXI.Graphics();
        app.stage.addChild(fog);

        // ── Particules magiques (lucioles)
        const particles = [];
        const partContainer = new PIXI.Container();
        app.stage.addChild(partContainer);
        for (let p = 0; p < 60; p++) {
            const g = new PIXI.Graphics();
            const col = [0x00ffaa, 0x0088ff, 0xffaa00, 0xff00aa, 0xaaaaff][this._randInt(0, 4)];
            g.beginFill(col, 0.8);
            g.drawCircle(0, 0, this._rand(1.5, 4));
            g.endFill();
            g.beginFill(0xffffff, 0.6);
            g.drawCircle(0, 0, 1);
            g.endFill();
            g.position.set(this._rand(0, W), this._rand(H * 0.3, H - 50));
            g._vy = this._rand(-0.5, -0.1);
            g._vx = this._rand(-0.3, 0.3);
            g._phase = this._rand(0, Math.PI * 2);
            g._speed = this._rand(0.5, 2);
            partContainer.addChild(g);
            particles.push(g);
        }

        // ── Rayons de lumière lunaire
        const rays = new PIXI.Graphics();
        for (let r = 0; r < 6; r++) {
            const angle = (-20 + r * 8) * Math.PI / 180;
            rays.beginFill(0xfff8e0, 0.012);
            rays.moveTo(420, 90);
            rays.lineTo(420 + Math.cos(angle) * 800, 90 + Math.sin(angle) * 800);
            rays.lineTo(420 + Math.cos(angle + 0.08) * 800, 90 + Math.sin(angle + 0.08) * 800);
            rays.closePath(); rays.endFill();
        }
        app.stage.addChild(rays);

        let tick = 0;
        app.ticker.add(() => {
            tick += 0.016;

            // Étoiles scintillantes
            starArr.forEach(s => {
                s.alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(tick * s._speed + s._phase));
            });

            // Lune pulsante
            moon.alpha = 0.85 + 0.15 * Math.sin(tick * 0.5);

            // Particules
            particles.forEach(p => {
                p.position.x += p._vx + Math.sin(tick * p._speed + p._phase) * 0.4;
                p.position.y += p._vy;
                p.alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(tick * p._speed * 2 + p._phase));
                if (p.position.y < H * 0.25) {
                    p.position.y = H - 30;
                    p.position.x = this._rand(0, W);
                }
            });

            // Brume rampante
            fog.clear();
            for (let f = 0; f < 3; f++) {
                fog.beginFill(0x061220, 0.07 - f * 0.02);
                fog.moveTo(0, H - 80 + f * 30);
                for (let x = 0; x <= W; x += 30) {
                    fog.lineTo(x, H - 80 + f * 30 + Math.sin(tick * 0.4 + x * 0.02 + f) * 15);
                }
                fog.lineTo(W, H); fog.lineTo(0, H);
                fog.endFill();
            }
        });
    }

    // ────────────────────────────────────────────────────────────
    // DESTROY
    // ────────────────────────────────────────────────────────────
    destroy(key) {
        if (this.apps[key]) {
            this.apps[key].destroy(false, { children: true });
            this.apps[key] = null;
        }
    }

    destroyAll() {
        Object.keys(this.apps).forEach(k => this.destroy(k));
    }
}

window.BFPixi = new BFPixiRenderer();
