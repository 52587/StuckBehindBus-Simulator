import MenuScene from './scene/Menu/MenuScene.js';
import GameScene from './scene/City/GameScene.js';
import GameOverScene from './scene/Menu/GameOverScene.js';
import UrbanScene from './scene/Urban/UrbanScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO, // Changed back to AUTO for better compatibility
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
    scene: [MenuScene, GameScene, UrbanScene, GameOverScene],
    // Use proper renderer configuration instead
    render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false
    },
    // Move canvas settings here
    canvasStyle: 'display: block; margin: 0 auto;'
};

// Create the game instance
const game = new Phaser.Game(config);

// Add fix for willReadFrequently warning directly to the canvas after creation
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short moment for Phaser to create its canvas
    setTimeout(() => {
        // Find the canvas element created by Phaser
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Set the willReadFrequently attribute using getContext options
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            console.log('Applied willReadFrequently fix to canvas');
        }
    }, 100);
});