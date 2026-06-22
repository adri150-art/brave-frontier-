// =============================================================
// AMBIENT PARTICLE SYSTEM — fond vivant non-générique
// P1 §4.3 : 35 particules, rendu à 30 fps, pause si invisible/couvert
// =============================================================
(function initAmbientParticles() {
    const canvas = document.getElementById('ambient-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles = [];
    const COUNT = 35; // réduit de 55 → 35

    // Palette signature : carmin + cyan + or
    const COLORS = [
        'rgba(224,123,42,',   // amber/carmin
        'rgba(0,201,167,',    // teal
        'rgba(214,48,49,',    // rouge sang (rare)
        'rgba(232,210,120,',  // or pâle
        'rgba(180,200,255,',  // bleu glacé
    ];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function rand(min, max) { return min + Math.random() * (max - min); }

    function mkParticle() {
        const col = COLORS[Math.floor(Math.random() * COLORS.length)];
        return {
            x:    rand(0, W),
            y:    rand(0, H),
            r:    rand(0.6, 2.2),
            vx:   rand(-0.12, 0.12),
            vy:   rand(-0.3, -0.08),   // dérive vers le haut
            a:    rand(0.05, 0.55),
            da:   rand(-0.002, 0.002), // scintillement
            col,
            pulse: rand(0, Math.PI * 2),
            pulseSpeed: rand(0.005, 0.02),
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: COUNT }, mkParticle);
    }

    // ── Pause : document caché, perf mode, ou écran couvert par un panneau/overlay
    const COVER_IDS = ['bb-overlay', 'summon-overlay', 'login-bonus-overlay',
                       'boss-victory-overlay', 'team-builder-modal', 'hero-modal'];
    let _covered = false, _coverCheckAt = 0;
    function isPaused(now) {
        if (document.hidden) return true;
        if (document.body.classList.contains('perf-low')) return true;
        if (now - _coverCheckAt > 500) { // check DOM léger, 2×/s max
            _coverCheckAt = now;
            const tc = document.getElementById('tab-content');
            _covered = (tc && !tc.classList.contains('collapsed')) ||
                COVER_IDS.some(id => {
                    const el = document.getElementById(id);
                    return el && !el.classList.contains('hidden') && el.style.display !== 'none' && el.offsetParent !== null;
                });
        }
        return _covered;
    }

    let _skip = false; // rendu 1 frame sur 2 → 30 fps, largement suffisant pour un fond
    function tick(now) {
        requestAnimationFrame(tick);
        _skip = !_skip;
        if (_skip || isPaused(now || performance.now())) return;

        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;
            const alpha = Math.max(0.02, Math.min(0.6, p.a + Math.sin(p.pulse) * 0.12));

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.col + alpha + ')';
            ctx.fill();

            // Recycle when off-screen
            if (p.y < -5 || p.x < -10 || p.x > W + 10) {
                Object.assign(p, mkParticle());
                p.y = H + 5;
                p.x = rand(0, W);
            }
        }
    }

    window.addEventListener('resize', resize);
    init();
    requestAnimationFrame(tick);
})();
