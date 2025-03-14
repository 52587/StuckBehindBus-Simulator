class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.score = data.score || 0;
        
        // Stop the engine sound when game over
        this.game.events.emit('game_over');
    }

    preload() {
        // No need to preload for geometric shapes
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Game over screen background
        this.add.rectangle(centerX, centerY, width, height, 0x222233);
        
        // Game over panel
        this.add.rectangle(centerX, centerY, 500, 350, 0x333344).setStrokeStyle(2, 0x4444aa);
        
        // Game over text
        this.add.text(centerX, 200, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(centerX, 250, 'You were stuck for ' + this.score + ' seconds', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#cccccc'
        }).setOrigin(0.5);
        
        // Underwhelming message
        this.add.text(centerX, 300, 'Nothing exciting happened... as expected.', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'italic',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        
        // Progress report
        if (this.score < 30) {
            this.add.text(centerX, 330, 'You barely experienced the frustration...', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        } else if (this.score < 60) {
            this.add.text(centerX, 330, 'A taste of daily commuter life!', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 330, 'A true master of patience!', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        }
        
        // Create a traffic jam illustration with simple shapes
        this.createTrafficJam(centerX, 380);
        
        // Restart button
        const restartButton = this.add.rectangle(centerX, 450, 180, 50, 0x4466aa, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x8888ff);
            
        const restartText = this.add.text(centerX, 450, 'TRY AGAIN', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Menu button
        const menuButton = this.add.rectangle(centerX, 510, 180, 40, 0x555566, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x8888aa);
            
        const menuText = this.add.text(centerX, 510, 'BACK TO MENU', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Button hover effects
        restartButton.on('pointerover', () => {
            restartButton.fillColor = 0x5577cc;
        });
        
        restartButton.on('pointerout', () => {
            restartButton.fillColor = 0x4466aa;
        });
        
        menuButton.on('pointerover', () => {
            menuButton.fillColor = 0x666677;
        });
        
        menuButton.on('pointerout', () => {
            menuButton.fillColor = 0x555566;
        });
        
        // Button click handlers
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
    
    createTrafficJam(x, y) {
        // Create a few simple car shapes to represent traffic
        const colors = [0xff6666, 0x3366dd, 0x66ff66, 0xffff66];
        
        for (let i = 0; i < 4; i++) {
            // Car body
            const offsetX = -150 + i * 100;
            this.add.rectangle(x + offsetX, y, 80, 40, colors[i % colors.length])
                .setStrokeStyle(1, 0x000000);
                
            // Car wheels
            this.add.circle(x + offsetX - 25, y + 20, 10, 0x333333);
            this.add.circle(x + offsetX + 25, y + 20, 10, 0x333333);
        }
    }
}

export default GameOverScene;
