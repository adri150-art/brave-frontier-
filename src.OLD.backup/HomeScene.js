export class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        // Pas besoin de charger d'images externes, on génère tout en code !
    }

    create() {
        const w = 540;
        const h = 960;

        // --- 1. FOND GRADIENT DYNAMIQUE ---
        // Un fond semi-sombre avec un dégradé vertical mystique (bleu nuit à violet foncé)
        let bg = this.add.graphics();
        bg.fillGradientStyle(0x0f1423, 0x0f1423, 0x1a0f2e, 0x1a0f2e, 1);
        bg.fillRect(0, 0, w, h);

        // Petites étoiles décoratives en arrière-plan pour donner de la profondeur
        for (let i = 0; i < 40; i++) {
            let x = Phaser.Math.Between(0, w);
            let y = Phaser.Math.Between(0, h - 150);
            this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.Between(2, 7) / 10);
        }


        // --- 2. HEADER INTERFACE (Barre de Profil Métallique) ---
        let header = this.add.graphics();
        header.fillStyle(0x151a2e, 0.9);
        header.fillRoundedRect(10, 15, w - 20, 110, 12);
        header.lineStyle(2, 0x4a5a8a, 1);
        header.strokeRoundedRect(10, 15, w - 20, 110, 12);

        // Textes Profil à gauche
        this.add.text(30, 30, 'Linus', { fontSize: '18px', fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Arial Black' });
        this.add.text(30, 58, 'Niv. 22', { fontSize: '13px', fill: '#00d2ff', fontWeight: 'bold', fontFamily: 'Arial' });
        this.add.text(95, 58, 'RC 1', { fontSize: '13px', fill: '#e74c3c', fontWeight: 'bold', fontFamily: 'Arial' });

        // Jauge d'Énergie (Stamina) stylisée avec reflet
        this.add.text(30, 85, 'Énergie', { fontSize: '11px', fill: '#a0a0a0', fontFamily: 'Arial' });
        let energyBg = this.add.graphics();
        energyBg.fillStyle(0x0b0d16, 1).fillRoundedRect(85, 85, 140, 14, 4);
        let energyFill = this.add.graphics();
        energyFill.fillGradientStyle(0x2ecc71, 0x27ae60, 0x2ecc71, 0x27ae60, 1).fillRoundedRect(85, 85, 95, 14, 4);
        this.add.text(155, 92, '45 / 75', { fontSize: '10px', fontWeight: 'bold', fill: '#ffffff' }).setOrigin(0.5);

        // Devises et Devises Premium à droite (Alignées proprement)
        let createCurrency = (x, y, label, val, color) => {
            this.add.text(x, y, label, { fontSize: '13px', fill: color, fontWeight: 'bold' });
            this.add.text(x + 30, y, val, { fontSize: '13px', fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Courier' });
        };
        createCurrency(340, 32, '💎', '1,250', '#00d2ff');
        createCurrency(340, 60, '🪙', '845,900', '#f1c40f');
        createCurrency(340, 88, '🔮', '124,510', '#9b59b6');


        // --- 3. LES 5 COMPARTIMENTS D'UNITÉS (Cadres Néon Fantasy) ---
        const cardW = 92;
        const cardH = 260;
        const startX = 54;
        const cardY = 320;

        for (let i = 0; i < 5; i++) {
            let cx = startX + (i * 108);
            
            // Fond de carte avec dégradé sombre immersif
            let cardBg = this.add.graphics();
            cardBg.fillGradientStyle(0x1c2442, 0x1c2442, 0x0d1222, 0x0d1222, 1);
            cardBg.fillRoundedRect(cx - cardW/2, cardY - cardH/2, cardW, cardH, 8);
            
            // Définition de la couleur de la bordure (Le 2ème est le LEADER avec bordure dorée)
            let isLeader = (i === 1);
            let colorNeon = isLeader ? 0xf1c40f : 0x34495e;
            let thickness = isLeader ? 3 : 1.5;

            cardBg.lineStyle(thickness, colorNeon, 1);
            cardBg.strokeRoundedRect(cx - cardW/2, cardY - cardH/2, cardW, cardH, 8);

            // Effet d'ombre/silhouette de héros à l'intérieur
            let silhouette = this.add.graphics();
            silhouette.fillStyle(0xffffff, 0.03);
            silhouette.fillCircle(cx, cardY - 20, 25);
            silhouette.fillTriangle(cx, cardY + 10, cx - 30, cardY + 70, cx + 30, cardY + 70);

            // Étiquettes de texte intégrées
            if (isLeader) {
                this.add.text(cx, cardY - cardH/2 + 15, 'LEADER', { fontSize: '10px', fontWeight: 'bold', fill: '#f1c40f', backgroundColor: '#111625' }).setOrigin(0.5).setPadding(3);
            }
            this.add.text(cx, cardY + cardH/2 - 35, `SLOT ${i+1}`, { fontSize: '11px', fill: '#8a9baf', fontWeight: 'bold' }).setOrigin(0.5);
            
            // Pastille d'élément en bas
            let elementColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6]; // Feu, Eau, Terre, Foudre, Ténèbres
            this.add.circle(cx, cardY + cardH/2 - 12, 8, elementColors[i]).setStrokeStyle(1.5, 0xffffff);

            // Rendre la zone interactive
            let zone = this.add.rectangle(cx, cardY, cardW, cardH, 0x000, 0).setInteractive({ useHandCursor: true });
            zone.on('pointerover', () => { cardBg.lineStyle(3, 0x00d2ff).strokeRoundedRect(cx - cardW/2, cardY - cardH/2, cardW, cardH, 8); });
            zone.on('pointerout', () => { cardBg.lineStyle(thickness, colorNeon).strokeRoundedRect(cx - cardW/2, cardY - cardH/2, cardW, cardH, 8); });
        }


        // --- 4. LE GRAND BOUTON RECTANGLE "QUEST" (Le Cœur Flamboyant) ---
        let btnX = w / 2;
        let btnY = 590;
        let btnW = 460;
        let btnH = 130;

        let questBox = this.add.graphics();
        // Dégradé orange/rouge style volcanique ardent
        questBox.fillGradientStyle(0xd35400, 0xd35400, 0xc0392b, 0xc0392b, 1);
        questBox.fillRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);
        questBox.lineStyle(4, 0xf39c12, 1);
        questBox.strokeRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);

        let questText = this.add.text(btnX, btnY, 'LANCER LA QUÊTE', { 
            fontSize: '32px', 
            fontWeight: '900', 
            fill: '#ffffff', 
            fontFamily: 'Arial Black',
            stroke: '#7f2d00',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Zone de clic invisible sur le bouton Quest
        let questInteract = this.add.rectangle(btnX, btnY, btnW, btnH, 0x000, 0).setInteractive({ useHandCursor: true });
        
        questInteract.on('pointerover', () => {
            questBox.clear();
            questBox.fillGradientStyle(0xe67e22, 0xe67e22, 0xd35400, 0xd35400, 1);
            questBox.fillRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);
            questBox.lineStyle(4, 0xfff000, 1).strokeRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);
            questText.setScale(1.05);
        });

        questInteract.on('pointerout', () => {
            questBox.clear();
            questBox.fillGradientStyle(0xd35400, 0xd35400, 0xc0392b, 0xc0392b, 1);
            questBox.fillRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);
            questBox.lineStyle(4, 0xf39c12, 1).strokeRoundedRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 16);
            questText.setScale(1);
        });

        // Direction le combat au clic !
        questInteract.on('pointerdown', () => {
            this.scene.start('CombatScene');
        });


        // --- 5. LE FOOTER (Barre de Navigation Premium) ---
        let footer = this.add.graphics();
        footer.fillStyle(0x0b0d16, 0.98);
        footer.fillRect(0, h - 110, w, 110);
        footer.lineStyle(2, 0x232b45, 1).strokeLineShape(new Phaser.Geom.Line(0, h - 110, w, h - 110));

        const tabs = ['MENU', 'UNITÉS', 'VILLAGE', 'BOUTIQUE', 'INVOC', 'AMIS'];
        const tabW = w / tabs.length;

        tabs.forEach((tabName, index) => {
            let tx = (tabW / 2) + (index * tabW);
            let ty = h - 55;

            // Arrière-plan de la cellule
            let tabBg = this.add.graphics();
            if (index === 0) {
                // Onglet actif (MENU / HOME) allumé en bleu électrique
                tabBg.fillGradientStyle(0x1a2e40, 0x1a2e40, 0x0b0d16, 0x0b0d16, 0.6);
                tabBg.fillRect(index * tabW + 2, h - 108, tabW - 4, 106);
            }

            // Texte de l'onglet
            let tColor = (index === 0) ? '#00f0ff' : '#a0aab5';
            this.add.text(tx, ty + 15, tabName, { fontSize: '11px', fontWeight: 'bold', fill: tColor, fontFamily: 'Arial' }).setOrigin(0.5);

            // Petit symbole géométrique à la place de l'icône
            let iconCircle = this.add.circle(tx, ty - 12, 14, (index === 0) ? 0x00f0ff : 0x232b45).setAlpha(0.7);

            // Rendre l'onglet interactif
            let tabBtn = this.add.rectangle(tx, ty, tabW, 110, 0x000, 0).setInteractive({ useHandCursor: true });
            tabBtn.on('pointerdown', () => {
                if (tabName === 'INVOC') {
                    this.dialogueBox("La taverne d'invocation ouvrira bientôt !");
                }
            });
        });
    }

    dialogueBox(message) {
        let box = this.add.graphics();
        box.fillStyle(0x0b0d16, 0.95).fillRoundedRect(90, 440, 360, 80, 8);
        box.lineStyle(2, 0x00f0ff, 1).strokeRoundedRect(90, 440, 360, 80, 8);
        
        let txt = this.add.text(270, 480, message, { fontSize: '13px', fill: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);
        
        this.time.delayedCall(1500, () => {
            box.destroy();
            txt.destroy();
        });
    }
}
