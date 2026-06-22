/* §4.2 — Accessibilité : rend focusables au clavier les éléments cliquables non natifs.
 * ADDITIF : n'altère aucun comportement existant. Charger APRÈS le monolithe :
 *   <script src="./assets/a11y.enhance.js" defer></script>
 * Couvre aussi le contenu généré dynamiquement (MutationObserver). */
(function () {
  'use strict';
  var NATIVE = { A:1, BUTTON:1, INPUT:1, SELECT:1, TEXTAREA:1 };
  // Sélecteurs des éléments interactifs custom du jeu
  var SEL = '[onclick],.clickable,.tab-btn,.hero-card,.wm-node,.wm-biome-card,.bb-btn,.skill-btn,.summon-btn,.drawer-close-btn';

  function enhance(el) {
    if (!el || el.nodeType !== 1 || el.__a11y) return;
    if (NATIVE[el.tagName]) return;            // déjà focusable nativement
    if (!el.matches || !el.matches(SEL)) return;
    el.__a11y = true;
    if (!el.hasAttribute('role'))     el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (el.getAttribute('aria-label') == null) {
      var t = (el.textContent || '').trim();
      if (t) el.setAttribute('aria-label', t.slice(0, 60));
    }
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        el.click();
      }
    });
  }

  function scan(root) {
    if (root.nodeType === 1 && root.matches && root.matches(SEL)) enhance(root);
    if (root.querySelectorAll) root.querySelectorAll(SEL).forEach(enhance);
  }

  function init() {
    // Style de focus visible (sinon focusable mais invisible au clavier)
    var st = document.createElement('style');
    st.textContent = '[role="button"]:focus-visible,.tab-btn:focus-visible,.hero-card:focus-visible{outline:3px solid #f1c40f;outline-offset:2px;border-radius:6px;}';
    document.head.appendChild(st);
    scan(document);
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.__a11yEnhance = { enhance: enhance, scan: scan }; // exposé pour tests
})();
