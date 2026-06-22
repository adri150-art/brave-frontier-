/* ============================================================
   GRIMOIRE NOIR — braises ambiantes
   Canvas autonome dans #monster-zone : 16 braises qui dérivent.
   Object pooling, pause si onglet caché, respecte
   prefers-reduced-motion. Ne touche à AUCUN état du jeu.
   ============================================================ */
(function () {
    'use strict';
    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var COLORS = ['#FFB23E', '#FF8A3D', '#FF6B1A', '#FFD93D'];
    var COUNT = 16;

    function init() {
        var zone = document.getElementById('monster-zone');
        if (!zone) { setTimeout(init, 500); return; }

        /* coins d'or retirés comme demandé */

        if (REDUCED) return;   /* pas de braises animées en motion réduit */

        var canvas = document.createElement('canvas');
        canvas.id = 'gn-embers';
        canvas.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:3;';
        zone.appendChild(canvas);
        var ctx = canvas.getContext('2d');

        var W = 0, H = 0;
        function resize() {
            W = canvas.width = zone.clientWidth;
            H = canvas.height = zone.clientHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        /* pool fixe — zéro allocation dans la boucle */
        var embers = [];
        function reset(e, randomY) {
            e.x = Math.random() * W;
            e.y = randomY ? Math.random() * H : H + 6;
            e.r = 1 + Math.random() * 2.2;
            e.vy = 14 + Math.random() * 26;          /* px/s vers le haut */
            e.sway = 6 + Math.random() * 14;
            e.phase = Math.random() * Math.PI * 2;
            e.life = 0;
            e.maxLife = 5 + Math.random() * 5;        /* secondes */
            e.color = COLORS[(Math.random() * COLORS.length) | 0];
        }
        for (var i = 0; i < COUNT; i++) {
            var e = {};
            reset(e, true);
            embers.push(e);
        }

        var last = performance.now();
        var running = true;
        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
            if (running) { last = performance.now(); requestAnimationFrame(tick); }
        });

        function tick(now) {
            if (!running) return;
            var dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < COUNT; i++) {
                var e = embers[i];
                e.life += dt;
                e.y -= e.vy * dt;
                var x = e.x + Math.sin(e.phase + e.life * 1.4) * e.sway;
                var t = e.life / e.maxLife;
                if (t >= 1 || e.y < -8) { reset(e, false); continue; }
                /* fade in (10%) puis fade out */
                var a = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
                ctx.globalAlpha = a * 0.7;
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(x, e.y, e.r, 0, 6.2832);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
