import { CombatScene } from './CombatScene.js';

const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [CombatScene]
};

window.phaserGame = new Phaser.Game(config);
