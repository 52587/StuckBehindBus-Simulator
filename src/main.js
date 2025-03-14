import MenuScene from './scene/Menu/MenuScene.js';
import GameScene from './scene/City/GameScene.js';
import GameOverScene from './scene/Menu/GameOverScene.js';
import UrbanScene from './scene/Urban/UrbanScene.js';
import AudioScene from './scene/Audio/AudioScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222233',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Start with MenuScene first, then add AudioScene
    scene: [MenuScene, AudioScene, GameScene, UrbanScene, GameOverScene],
    render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false
    },
    canvasStyle: 'display: block; margin: 0 auto;',
    audio: {
        disableWebAudio: false,
        noAudio: false
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Start the audio scene explicitly after game created
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Start audio scene manually
        if (game.scene && game.scene.getScene('AudioScene')) {
            console.log('Starting AudioScene manually');
            game.scene.start('AudioScene');
        }
        
        // Apply willReadFrequently fix
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            console.log('Applied willReadFrequently fix to canvas');
        }
    }, 200);
});