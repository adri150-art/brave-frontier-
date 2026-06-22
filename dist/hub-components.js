window.hubComponents = {
  css: `
/* ─── STYLE DE L'HEADER (TOPBAR) ─── */
.hub-topbar {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: stretch;
    position: relative;
    z-index: 10;
    padding: calc(8px + env(safe-area-inset-top, 0px)) 14px 8px;
    background: linear-gradient(180deg, rgba(12, 16, 30, 0.95) 0%, rgba(8, 10, 18, 0.85) 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
}

.hub-header-panel {
    background: rgba(20, 24, 38, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 10px;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 82px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.hub-header-panel:hover {
    border-color: rgba(0, 210, 255, 0.25);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 210, 255, 0.15);
}

.hub-player-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 4px;
}
.hub-player-name {
    font-size: 11px;
    font-weight: 800;
    color: #00d2ff;
    text-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 85px;
}
.hub-player-title {
    font-size: 8px;
    font-weight: 700;
    color: #a78bfa;
    text-shadow: 0 0 6px rgba(167, 139, 250, 0.3);
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
.hub-player-stats {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 3px;
}
.hub-stat-row {
    display: flex;
    gap: 8px;
    font-size: 9px;
    font-weight: 800;
    color: #ffd21e;
    text-shadow: 0 0 8px rgba(253, 210, 30, 0.3);
}
.hub-stat b {
    color: #fff;
}
.hub-stat-bar-container {
    display: flex;
    align-items: center;
    gap: 4px;
}
.hub-bar-label {
    font-size: 7px;
    font-weight: 900;
    color: #8fa6c0;
    width: 28px;
}
.hub-exp-bar, .hub-energy-bar {
    flex: 1;
    height: 6px;
    background-color: rgba(4, 5, 10, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
}
.hub-exp-fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #ff5e3a, #ff9500);
    box-shadow: 0 0 6px rgba(255, 94, 58, 0.8);
    transition: width 0.3s;
}
.hub-energy-fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #00f2fe, #4facfe);
    box-shadow: 0 0 6px rgba(79, 172, 254, 0.8);
    transition: width 0.3s;
}
.hub-refill-text {
    font-size: 7px;
    font-weight: 800;
    color: #ffe9b0;
    text-shadow: 0 1px 1px #000;
    text-align: right;
    margin-top: 1px;
}


.hub-currencies-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.hub-currency-slot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(10, 12, 18, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 2px 8px;
    height: 18px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
    transition: all 0.2s ease;
}
.hub-currency-slot:hover {
    background: rgba(20, 25, 38, 0.9);
    border-color: rgba(255, 255, 255, 0.15);
}
.hub-currency-slot[title="Gemmes"]:hover {
    border-color: rgba(0, 210, 255, 0.4);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.2), inset 0 1px 2px rgba(0,0,0,0.6);
}
.hub-currency-slot[title="Pièces d'or"]:hover {
    border-color: rgba(241, 196, 15, 0.4);
    box-shadow: 0 0 8px rgba(241, 196, 15, 0.2), inset 0 1px 2px rgba(0,0,0,0.6);
}
.hub-currency-slot[title="Points d'honneur"]:hover {
    border-color: rgba(167, 139, 250, 0.4);
    box-shadow: 0 0 8px rgba(167, 139, 250, 0.2), inset 0 1px 2px rgba(0,0,0,0.6);
}
#hub-atelier-slot:hover {
    border-color: rgba(138, 240, 192, 0.4);
    box-shadow: 0 0 8px rgba(138, 240, 192, 0.2), inset 0 1px 2px rgba(0,0,0,0.6);
}
.hub-cur-icon {
    font-size: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 10px;
}
.hub-cur-icon.icon-gems { color: #4ec9f2; }
.hub-cur-icon.icon-gold { color: #ffd21e; }
.hub-cur-icon.icon-honor { color: #e5484d; }
.hub-cur-val {
    font-size: 9px;
    font-weight: 900;
    color: #e6f0fa;
    text-shadow: 0 1px 1px #000;
}
.hub-arena-btn-row {
    display: flex;
    justify-content: stretch;
    margin-top: 2px;
}
.hub-arena-badge-btn {
    width: 100%;
    background: linear-gradient(135deg, #a7333f 0%, #63101d 100%);
    border: 1px solid #ff4d4d;
    border-radius: 6px;
    padding: 3px 0;
    font-size: 8px;
    font-weight: 950;
    color: #fff;
    letter-spacing: 1.5px;
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.6), 0 1px 2px #000;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.hub-arena-badge-btn:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.65), 0 2px 8px rgba(239, 68, 68, 0.3);
    transform: translateY(-1px);
}
.hub-arena-badge-btn:active {
    transform: translateY(1px);
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
}

/* ─── STYLE DU FOOTER (BOTTOMBAR) ─── */
.hub-bottombar {
    flex: 0 0 auto;
    display: flex; gap: 6px;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
    background: rgba(6, 8, 16, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
}
.hub-bb-btn {
    position: relative;
    flex: 1 1 0; min-height: 52px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(18, 22, 35, 0.55);
    color: rgba(237, 241, 250, 0.65);
    font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
    font-family: var(--font-ui, 'Outfit', sans-serif);
    cursor: pointer;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.hub-bb-btn:hover {
    background: rgba(28, 35, 55, 0.75);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3);
}
.hub-bb-btn:active {
    transform: scale(0.95);
}

.hub-bb-btn[data-sec="heroes"] { --theme-color: #ef4444; }
.hub-bb-btn[data-sec="town"]   { --theme-color: #10b981; }
.hub-bb-btn[data-sec="home"]   { --theme-color: #ffd21e; }
.hub-bb-btn[data-sec="gacha"]  { --theme-color: #a855f7; }
.hub-bb-btn[data-sec="settings"] { --theme-color: #06b6d4; }

.hub-bb-btn:hover {
    border-top-color: var(--theme-color) !important;
}

.hub-bb-btn.active {
    background: rgba(25, 30, 48, 0.85);
    border-color: var(--theme-color);
    border-top: 2px solid var(--theme-color);
    color: #fff;
    font-weight: 800;
    box-shadow: 
        0 0 14px rgba(0, 0, 0, 0.4),
        0 0 10px rgba(var(--theme-rgb, 255, 210, 30), 0.25);
    text-shadow: 0 0 6px var(--theme-color);
    transform: translateY(0);
}

.hub-bb-btn[data-sec="heroes"].active { --theme-rgb: 239, 68, 68; }
.hub-bb-btn[data-sec="town"].active   { --theme-rgb: 16, 185, 129; }
.hub-bb-btn[data-sec="home"].active   { --theme-rgb: 255, 210, 30; }
.hub-bb-btn[data-sec="gacha"].active  { --theme-rgb: 168, 85, 247; }
.hub-bb-btn[data-sec="settings"].active { --theme-rgb: 6, 182, 212; }

.hub-bb-btn:hover .hub-bb-icon,
.hub-bb-btn.active .hub-bb-icon {
    color: var(--theme-color);
    filter: drop-shadow(0 0 5px var(--theme-color));
}

.hub-bb-icon { 
    font-size: 20px; 
    line-height: 1; 
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.7)); 
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
}
.hub-bb-img-icon {
    height: 28px;
    width: auto;
    object-fit: contain;
    transition: transform 0.2s ease;
}
.hub-bb-btn:hover .hub-bb-img-icon,
.hub-bb-btn.active .hub-bb-img-icon {
    transform: scale(1.1);
    filter: drop-shadow(0 0 5px var(--theme-color));
}
  `,
  header: `
    <!-- Panel Gauche : Infos joueur -->
    <div class="hub-header-panel hub-header-left" onclick="hubNavigate('settings')" title="Profil & Paramètres">
        <div class="hub-player-header">
            <span class="hub-player-name" id="hub-player-name">Invocateur</span>
            <span class="hub-player-title" id="hub-player-title">Novice</span>
        </div>
        <div class="hub-player-stats">
            <div class="hub-stat-row">
                <span class="hub-stat">Lv <b id="hub-lv-val">1</b></span>
            </div>
            <!-- Barre d'exp -->
            <div class="hub-stat-bar-container">
                <span class="hub-bar-label">EXP</span>
                <div class="hub-exp-bar"><span class="hub-exp-fill" id="hub-exp-fill" style="width:0%"></span></div>
            </div>
            <!-- Charges ville (Energy-style) -->
            <div class="hub-stat-bar-container">
                <span class="hub-bar-label">VILLE</span>
                <div class="hub-energy-bar"><span class="hub-energy-fill" id="hub-town-energy-fill" style="width:100%"></span></div>
            </div>
            <div class="hub-refill-text" id="hub-town-refill-text">RECHARGE COMPLET</div>
        </div>
    </div>


    <!-- Panel Droite : Devises & Arène -->
    <div class="hub-header-panel hub-header-right">
        <div class="hub-currencies-grid">
            <div class="hub-currency-slot" title="Pièces d'or">
                <span class="hub-cur-icon icon-gold"><i class="ra ra-gold-bar"></i></span>
                <span id="hub-gold-val" class="hub-cur-val">0</span>
            </div>
            <div class="hub-currency-slot" title="Points d'honneur">
                <span class="hub-cur-icon icon-honor"><i class="ra ra-sword"></i></span>
                <span id="hub-honor-val" class="hub-cur-val">0</span>
            </div>
        </div>
    </div>
  `,
  footer: `
    <button class="hub-bb-btn" data-sec="heroes" onclick="hubNavigate('heroes')">
        <span class="hub-bb-icon"><img src="assets/ui/bouton_unite.png" class="hub-bb-img-icon" alt="Unités"></span>Unités
    </button>
    <button class="hub-bb-btn" data-sec="town" onclick="hubNavigate('town')">
        <span class="hub-bb-icon"><i class="ra ra-village"></i></span>Ville
        <span class="hub-bb-badge" id="hub-bb-town-badge"></span>
    </button>
    <button class="hub-bb-btn active" data-sec="home" onclick="closeHubPanelToHome()">
        <span class="hub-bb-icon"><i class="ra ra-castle-gate"></i></span>Home
    </button>
    <button class="hub-bb-btn" data-sec="gacha" onclick="hubNavigate('gacha')">
        <span class="hub-bb-icon"><i class="ra ra-magic-portal"></i></span>Invoc
        <span class="hub-bb-badge" id="hub-bb-summon-badge"></span>
    </button>
    <button class="hub-bb-btn" data-sec="settings" onclick="hubNavigate('settings')">
        <span class="hub-bb-icon"><i class="ra ra-cog"></i></span>Paramètre
    </button>
  `
};
