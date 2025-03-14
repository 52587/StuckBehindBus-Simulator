class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        console.log('MenuScene preload started');
        // No need to load audio here anymore
    }

    create() {
        console.log('MenuScene create started');
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // Make sure AudioScene is running
        if (!this.scene.isActive('AudioScene')) {
            console.log('Starting AudioScene from MenuScene');
            this.scene.launch('AudioScene');
        }

        // Create background using a rectangle
        const background = this.add.rectangle(centerX, centerY, width, height, 0x333344);
        
        // Create title area with a rounded rectangle
        const titleBg = this.add.rectangle(centerX, 150, 500, 120, 0x444466, 0.7);
        titleBg.setStrokeStyle(2, 0x8888aa);
        
        // Add title text
        this.add.text(centerX, 130, 'STUCK BEHIND THE BUS', {
            fontFamily: 'Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(centerX, 170, 'The Dull Pursuit', {
            fontFamily: 'Arial',
            fontSize: '22px',
            fontStyle: 'italic',
            color: '#dddddd'
        }).setOrigin(0.5);
        
        // Create decorative bus icon (using simple shapes)
        this.createBusIcon(centerX, 260);
        
        // Create start button
        const startButton = this.add.rectangle(centerX, 350, 200, 60, 0x4466aa, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x8888ff);
            
        const startText = this.add.text(centerX, 350, 'START GAME', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.fillColor = 0x5577cc;
        });
        
        startButton.on('pointerout', () => {
            startButton.fillColor = 0x4466aa;
        });
        
        // Button click - start audio and transition to game scene
        startButton.on('pointerdown', () => {
            startButton.fillColor = 0x335599;
            
            // Make sure AudioScene is running before emitting events
            if (!this.scene.isActive('AudioScene')) {
                this.scene.launch('AudioScene');
                
                // Give it a moment to initialize before sending events
                this.time.delayedCall(100, () => {
                    this.scene.get('AudioScene').events.emit('start_engine');
                });
            } else {
                this.scene.get('AudioScene').events.emit('start_engine');
            }
            
            // Transition to the game scene
            this.scene.start('GameScene');
        });
        
        // Create credits button
        const creditsButton = this.add.rectangle(centerX, 430, 200, 50, 0x555566, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x8888aa);
            
        const creditsText = this.add.text(centerX, 430, 'CREDITS', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Credits button hover effect
        creditsButton.on('pointerover', () => {
            creditsButton.fillColor = 0x666677;
        });
        
        creditsButton.on('pointerout', () => {
            creditsButton.fillColor = 0x555566;
        });
        
        // Add decorative traffic lights
        this.createTrafficLight(100, 200);
        this.createTrafficLight(width - 100, 200);
        
        // Add version text
        this.add.text(width - 10, height - 10, 'v0.1 Alpha', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#aaaaaa'
        }).setOrigin(1);

        console.log('MenuScene creation complete');
    }
    
    createBusIcon(x, y) {
        // Bus body
        this.add.rectangle(x, y, 180, 80, 0x777799).setStrokeStyle(2, 0xaaaacc);
        
        // Bus windows
        for (let i = 0; i < 3; i++) {
            this.add.rectangle(x - 60 + i * 50, y - 15, 30, 20, 0xaaddff);
        }
        
        // Bus wheels
        this.add.circle(x - 60, y + 40, 15, 0x333333);
        this.add.circle(x + 60, y + 40, 15, 0x333333);
        
        // Bus door
        this.add.rectangle(x + 30, y + 10, 20, 40, 0x666688);
    }
    
    createTrafficLight(x, y) {
        // Traffic light pole
        this.add.rectangle(x, y + 60, 10, 120, 0x666666);
        
        // Traffic light housing
        this.add.rectangle(x, y, 30, 80, 0x333333).setStrokeStyle(2, 0x555555);
        
        // Lights
        this.add.circle(x, y - 25, 10, 0xff0000); // Red
        this.add.circle(x, y, 10, 0xffff00); // Yellow
        this.add.circle(x, y + 25, 10, 0x00ff00); // Green
    }
}

export default MenuScene;
