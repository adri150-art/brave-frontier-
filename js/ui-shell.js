// =============================================================
// P2 — UI SHELL MOBILE : onglet "Plus" + bottom sheet gestuel
// Cf. REFONTE_VISUELLE_MOBILE.md §3.3
// =============================================================
(function initUiShell() {
    'use strict';
    const MORE_TABS = ['skills', 'achievements', 'prestige', 'settings'];

    // ── 1. Onglet "Plus" ─────────────────────────────────────
    const moreBtn = document.getElementById('tab-more-btn');
    const scrim = document.getElementById('more-sheet-scrim');

    function openMoreSheet() {
        scrim.classList.remove('hidden');
        requestAnimationFrame(() => scrim.classList.add('open'));
    }
    function closeMoreSheet() {
        scrim.classList.remove('open');
        setTimeout(() => scrim.classList.add('hidden'), 220);
    }

    if (moreBtn && scrim) {
        moreBtn.addEventListener('click', () => {
            if (typeof Sound !== 'undefined') Sound.init();
            openMoreSheet();
        });
        scrim.addEventListener('click', e => { if (e.target === scrim) closeMoreSheet(); });
        scrim.querySelectorAll('.more-sheet-item').forEach(item => {
            item.addEventListener('click', () => {
                closeMoreSheet();
                if (typeof openDrawer === 'function') openDrawer(item.dataset.tab);
            });
        });

        // État actif du bouton "Plus" : reflète les onglets qu'il regroupe
        const syncMoreActive = () => {
            const active = document.querySelector('#tab-bar .tab-btn.active');
            const want = !!(active && active !== moreBtn && MORE_TABS.includes(active.dataset.tab));
            if (moreBtn.classList.contains('active') !== want) moreBtn.classList.toggle('active', want);
        };
        new MutationObserver(syncMoreActive).observe(
            document.getElementById('tab-bar'),
            { attributes: true, subtree: true, attributeFilter: ['class'] }
        );
    }

    // ── 2. Bottom sheet gestuel sur #tab-content ─────────────
    // 2 crans : normal (75%) / étendu (.expanded = 92%) ; swipe-down = fermer
    const sheet = document.getElementById('tab-content');
    const handle = sheet ? sheet.querySelector('.drawer-header') : null;
    if (!sheet || !handle) return;

    let startY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false;

    function onStart(e) {
        if (window.innerWidth >= 1024) return;        // desktop : pas de geste
        if (e.target.closest('.drawer-close-btn')) return;
        dragging = true;
        startY = lastY = (e.touches ? e.touches[0].clientY : e.clientY);
        lastT = performance.now();
        vel = 0;
        sheet.classList.add('dragging');
    }
    function onMove(e) {
        if (!dragging) return;
        const y = (e.touches ? e.touches[0].clientY : e.clientY);
        const now = performance.now();
        vel = (y - lastY) / Math.max(1, now - lastT);  // px/ms (+ = vers le bas)
        lastY = y; lastT = now;
        const dy = y - startY;
        // vers le bas : suit le doigt ; vers le haut : résistance (pré-expansion)
        sheet.style.transform = dy > 0 ? `translateY(${dy}px)` : `translateY(${dy * 0.2}px)`;
        if (e.cancelable) e.preventDefault();
    }
    function onEnd() {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
        const dy = lastY - startY;
        const flickDown = vel > 0.5, flickUp = vel < -0.5;

        if (dy > 120 || (dy > 30 && flickDown)) {
            // swipe-down → cran inférieur ou fermeture
            if (sheet.classList.contains('expanded')) sheet.classList.remove('expanded');
            else if (typeof closeDrawer === 'function') closeDrawer();
        } else if (dy < -60 || (dy < -20 && flickUp)) {
            sheet.classList.add('expanded');           // swipe-up → plein écran
        }
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd);
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Le cran étendu ne survit pas à la fermeture
    new MutationObserver(() => {
        // NE modifier la classe QUE si nécessaire : classList.remove() réécrit
        // l'attribut même sans changement, ce qui re-déclencherait cet observer
        // en boucle infinie (crash au passage desktop→mobile).
        if (sheet.classList.contains('collapsed') && sheet.classList.contains('expanded')) {
            sheet.classList.remove('expanded');
        }
    }).observe(sheet, { attributes: true, attributeFilter: ['class'] });
})();

// =============================================================
// P5 — MICRO-INTERACTIONS & OVERLAYS SKIPPABLES
// =============================================================
(function initMicroInteractions() {
    'use strict';

    // Haptique : petite vibration (8ms) sur toute cible interactive.
    // Chrome bloque vibrate() tant qu'aucun tap n'a été enregistré ("Intervention")
    // → on n'active l'haptique qu'à partir de la 2e interaction.
    const TAPPABLE = 'button, .tab-btn, .footer-bb, .hero-mini-card, .more-sheet-item, .skill-btn, .squad-slot-card, .tb-filter-chip';
    let _lastVibe = 0, _hadGesture = false;
    document.addEventListener('pointerdown', () => { _hadGesture = true; }, { passive: true, capture: true });
    document.addEventListener('touchstart', (e) => {
        if (!_hadGesture || !navigator.vibrate) return;
        if (!e.target.closest(TAPPABLE)) return;
        const now = performance.now();
        if (now - _lastVibe < 80) return; // anti-spam (tap rapide combat)
        _lastVibe = now;
        try { navigator.vibrate(8); } catch (err) {}
    }, { passive: true });

    // Boss victory : tap hors des boutons = continuer
    const bv = document.getElementById('boss-victory-overlay');
    if (bv) bv.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (typeof closeBossVictory === 'function') closeBossVictory();
    });
})();
