/* ============================================================
   GRIMOIRE NOIR — étape 2 : bottom sheet à 3 crans
   Rend le tiroir mobile (#tab-content) glissable au pouce :
   crans PEEK (36%) / MID (75%, défaut) / FULL (94%).
   - Flick vers le bas au cran PEEK → closeDrawer() (logique
     existante du jeu, non modifiée).
   - N'altère ni switchTab() ni .collapsed : pure surcouche.
   - Mobile uniquement (<1024px). Pointer events + capture.
   ============================================================ */
(function () {
    'use strict';

    var DETENTS = { peek: 0.36, mid: 0.75, full: 0.94 };
    var current = 'mid';

    function init() {
        var sheet = document.getElementById('tab-content');
        var header = sheet && sheet.querySelector('.drawer-header');
        if (!sheet || !header) { setTimeout(init, 500); return; }

        var arena = sheet.parentElement;
        function arenaH() { return arena.clientHeight || window.innerHeight; }
        function isMobile() { return window.innerWidth < 1024; }

        function applyDetent(name, animate) {
            current = name;
            if (!isMobile()) { sheet.style.height = ''; return; }
            if (animate === false) sheet.classList.add('gn-dragging');
            sheet.style.height = Math.round(DETENTS[name] * arenaH()) + 'px';
            if (animate === false) {
                requestAnimationFrame(function () { sheet.classList.remove('gn-dragging'); });
            }
        }

        /* hauteur par défaut au premier affichage */
        if (isMobile()) applyDetent('mid');

        window.addEventListener('resize', function () {
            if (!isMobile()) { sheet.style.height = ''; return; }
            applyDetent(current);
        });

        /* ── drag ── */
        var dragging = false, startY = 0, startH = 0, lastY = 0, lastT = 0, vel = 0;

        header.addEventListener('pointerdown', function (ev) {
            if (!isMobile()) return;
            if (ev.target.closest('.drawer-close-btn')) return;
            dragging = true;
            startY = lastY = ev.clientY;
            startH = sheet.getBoundingClientRect().height;
            lastT = performance.now();
            vel = 0;
            sheet.classList.add('gn-dragging');
            header.setPointerCapture(ev.pointerId);
        });

        header.addEventListener('pointermove', function (ev) {
            if (!dragging) return;
            var now = performance.now();
            var dt = now - lastT;
            if (dt > 0) vel = (ev.clientY - lastY) / dt;   /* px/ms, + = vers le bas */
            lastY = ev.clientY; lastT = now;

            var h = startH + (startY - ev.clientY);
            var min = DETENTS.peek * arenaH() * 0.6;
            var max = DETENTS.full * arenaH();
            sheet.style.height = Math.max(min, Math.min(max, h)) + 'px';
            ev.preventDefault();
        });

        function endDrag(ev) {
            if (!dragging) return;
            dragging = false;
            sheet.classList.remove('gn-dragging');

            var moved = startY - lastY;                    /* + = monté */
            if (Math.abs(moved) < 8) {                     /* simple tap : rien */
                applyDetent(current);
                return;
            }

            var FLICK = 0.45;                              /* px/ms */
            if (vel > FLICK) {                             /* flick vers le bas */
                if (current === 'peek') {
                    sheet.style.height = '';
                    if (typeof window.closeDrawer === 'function') window.closeDrawer();
                    current = 'mid';                       /* prochain open = mid */
                    return;
                }
                applyDetent(current === 'full' ? 'mid' : 'peek');
                return;
            }
            if (vel < -FLICK) {                            /* flick vers le haut */
                applyDetent(current === 'peek' ? 'mid' : 'full');
                return;
            }

            /* pas de flick : snap au cran le plus proche */
            var h = sheet.getBoundingClientRect().height / arenaH();
            var best = 'mid', dist = Infinity;
            for (var k in DETENTS) {
                var d = Math.abs(DETENTS[k] - h);
                if (d < dist) { dist = d; best = k; }
            }
            applyDetent(best);
            if (typeof window.resizeP === 'function') setTimeout(window.resizeP, 300);
        }
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
