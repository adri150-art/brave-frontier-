// §3.4 ui/components/BottomSheet.js — Feuille modale montant du bas (mobile, une main).
// Vanilla, zéro dépendance. Remplace progressivement les drawers + le déménagement DOM.
// Usage :
//   import { BottomSheet } from './ui/components/BottomSheet.js';
//   const sheet = new BottomSheet();
//   sheet.open({ title:'Héros', html:'<div>…</div>' });   // ou { node: el }
//   sheet.close();
// Fermeture : clic sur le scrim, swipe vers le bas, touche Échap, bouton ✕.

export class BottomSheet {
  constructor(opts = {}) {
    this.maxHeightVh = opts.maxHeightVh || 85;
    this._build();
  }

  _build() {
    const scrim = document.createElement('div');
    scrim.className = 'bs-scrim';
    scrim.setAttribute('hidden', '');
    scrim.innerHTML =
      '<div class="bs-sheet" role="dialog" aria-modal="true" tabindex="-1">' +
        '<div class="bs-grip" aria-hidden="true"></div>' +
        '<div class="bs-header"><span class="bs-title"></span>' +
          '<button class="bs-close" aria-label="Fermer">✕</button></div>' +
        '<div class="bs-body"></div>' +
      '</div>';
    this.scrim  = scrim;
    this.sheet  = scrim.querySelector('.bs-sheet');
    this.titleEl= scrim.querySelector('.bs-title');
    this.bodyEl = scrim.querySelector('.bs-body');
    this.sheet.style.maxHeight = this.maxHeightVh + 'vh';

    scrim.addEventListener('click', (e) => { if (e.target === scrim) this.close(); });
    scrim.querySelector('.bs-close').addEventListener('click', () => this.close());
    this._onKey = (e) => { if (e.key === 'Escape' && this.isOpen()) this.close(); };

    // Swipe-to-dismiss
    let startY = 0, dy = 0, dragging = false;
    const grip = scrim.querySelector('.bs-grip');
    const down = (y) => { startY = y; dy = 0; dragging = true; this.sheet.style.transition = 'none'; };
    const move = (y) => { if (!dragging) return; dy = Math.max(0, y - startY); this.sheet.style.transform = 'translateY(' + dy + 'px)'; };
    const up   = () => { if (!dragging) return; dragging = false; this.sheet.style.transition = ''; this.sheet.style.transform = ''; if (dy > 90) this.close(); };
    grip.addEventListener('touchstart', (e) => down(e.touches[0].clientY), { passive: true });
    grip.addEventListener('touchmove',  (e) => move(e.touches[0].clientY), { passive: true });
    grip.addEventListener('touchend', up);
    grip.addEventListener('mousedown', (e) => down(e.clientY));
    window.addEventListener('mousemove', (e) => move(e.clientY));
    window.addEventListener('mouseup', up);

    document.body.appendChild(scrim);
  }

  isOpen() { return !this.scrim.hasAttribute('hidden'); }

  open({ title = '', html = null, node = null } = {}) {
    this.titleEl.textContent = title;
    this.bodyEl.innerHTML = '';
    if (node) this.bodyEl.appendChild(node);
    else if (html != null) this.bodyEl.innerHTML = html;
    this._lastFocus = document.activeElement;
    this.scrim.removeAttribute('hidden');
    // reflow puis classe pour l'animation d'entrée
    void this.scrim.offsetWidth;
    this.scrim.classList.add('bs-open');
    document.addEventListener('keydown', this._onKey);
    this.sheet.focus();
    return this;
  }

  close() {
    this.scrim.classList.remove('bs-open');
    document.removeEventListener('keydown', this._onKey);
    const done = () => { this.scrim.setAttribute('hidden', ''); this.sheet.removeEventListener('transitionend', done); };
    this.sheet.addEventListener('transitionend', done);
    // filet si pas de transition (tests/headless)
    setTimeout(() => { if (this.scrim.classList.contains('bs-open') === false) this.scrim.setAttribute('hidden', ''); }, 350);
    if (this._lastFocus && this._lastFocus.focus) this._lastFocus.focus();
    return this;
  }
}
