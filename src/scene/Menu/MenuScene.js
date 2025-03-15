class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.showingCredits = false;
    }

    preload() {
        // Load vehicle sprites for menu display
        if (window.assetCheck && window.assetCheck.bus) {
            this.load.image('menuBus', window.assetCheck.bus);
        } else {
            this.load.image('menuBus', 'assets/bus.png');
        }
        
        if (window.assetCheck && window.assetCheck.car) {
            this.load.image('menuCar', window.assetCheck.car);
        } else {
            this.load.image('menuCar', 'assets/car.png');
        }
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // Launch AudioScene if needed
        if (!this.scene.isActive('AudioScene')) {
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
        
        // Use sprites instead of geometric shapes
        this.createVehicleSprites(centerX, 260);
        
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
            
            // Start engine sound and begin game
            if (!this.scene.isActive('AudioScene')) {
                this.scene.launch('AudioScene');
                this.time.delayedCall(100, () => {
                    this.scene.get('AudioScene').events.emit('start_engine');
                });
            } else {
                this.scene.get('AudioScene').events.emit('start_engine');
            }
            
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
        
        // Add credits button functionality
        creditsButton.on('pointerdown', () => {
            this.showCreditsScreen(centerX, centerY);
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
    }
    
    // Create vehicle sprites instead of geometric shapes
    createVehicleSprites(x, y) {
        try {
            // Add vehicles with animation
            const bus = this.add.sprite(x, y, 'menuBus');
            bus.setScale(0.5);
            
            const leftCar = this.add.sprite(x - 180, y + 60, 'menuCar').setScale(0.6);
            const rightCar = this.add.sprite(x + 180, y + 60, 'menuCar').setScale(0.6);
            
            // Flip one car for variety
            rightCar.flipX = true;
            
            // Animate the bus slightly
            this.tweens.add({
                targets: bus,
                y: y - 10,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
        } catch (error) {
            // Fallback to geometric shapes if sprites fail
            this.createBusIcon(x, y);
            this.createTrafficLight(x - 180, y);
            this.createTrafficLight(x + 180, y);
        }
    }
    
    // Keep original methods as fallbacks
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
    
    showCreditsScreen(centerX, centerY) {
        // Don't create multiple credit screens
        if (this.showingCredits) return;
        this.showingCredits = true;
        
        // Create credits container for easy cleanup
        this.creditsGroup = this.add.group();
        
        // Semi-transparent background overlay
        const overlay = this.add.rectangle(centerX, centerY, 800, 600, 0x000000, 0.7);
        this.creditsGroup.add(overlay);
        
        // Credits panel
        const creditsPanel = this.add.rectangle(centerX, centerY, 500, 400, 0x333344, 1)
            .setStrokeStyle(2, 0x8888aa);
        this.creditsGroup.add(creditsPanel);
        
        // Credits title
        const title = this.add.text(centerX, centerY - 160, 'CREDITS', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.creditsGroup.add(title);
        
        // Credits content
        const credits = [
            { role: 'Art Assets', name: 'Yiqian Zheng' },
            { role: 'Sound Assets', name: 'FreeSound' },
            { role: 'Programming', name: 'Sunchi Wang' }
        ];
        
        let yOffset = centerY - 100;
        credits.forEach(credit => {
            const roleText = this.add.text(centerX - 100, yOffset, credit.role + ':', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#aaaaff',
                fontWeight: 'bold'
            }).setOrigin(0, 0.5);
            
            const nameText = this.add.text(centerX + 20, yOffset, credit.name, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            }).setOrigin(0, 0.5);
            
            this.creditsGroup.add(roleText);
            this.creditsGroup.add(nameText);
            
            yOffset += 40;
        });
        
        // Additional information
        const infoText = this.add.text(centerX, centerY + 50, 
            'Created for CMPM120\nStuck Behind The Bus Simulator', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
        this.creditsGroup.add(infoText);
        
        // Close button
        const closeButton = this.add.rectangle(centerX, centerY + 150, 160, 50, 0x555566, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x8888aa);
        this.creditsGroup.add(closeButton);
            
        const closeText = this.add.text(centerX, centerY + 150, 'CLOSE', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.creditsGroup.add(closeText);
        
        // Close button hover effects
        closeButton.on('pointerover', () => {
            closeButton.fillColor = 0x666677;
        });
        
        closeButton.on('pointerout', () => {
            closeButton.fillColor = 0x555566;
        });
        
        // Close button functionality
        closeButton.on('pointerdown', () => {
            this.closeCreditsScreen();
        });
        
        // Also allow closing with ESC key
        this.input.keyboard.once('keydown-ESC', () => {
            this.closeCreditsScreen();
        });
    }
    
    closeCreditsScreen() {
        if (this.creditsGroup) {
            this.creditsGroup.clear(true, true);
            this.creditsGroup = null;
            this.showingCredits = false;
        }
    }
}

export default MenuScene;
