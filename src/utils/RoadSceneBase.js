/**
 * Base class for road-based scenes with common functionality
 * Helps reduce code duplication between GameScene and UrbanScene
 */
class RoadSceneBase extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.playerLane = 0; // 0=left, 1=right
        this.busLane = 0; // Bus starts in left lane
        this.lanes = [0, 1];
        this.lanePositions = [300, 500]; // X positions for lanes
        
        // Y positions for vehicles
        this.playerY = 500; 
        this.busY = 300;
        
        // Speed controls
        this.forwardSpeed = 0.3;
        this.backwardSpeed = 0.6;
        
        // Min and max Y positions for player
        this.minPlayerY = 400;
        this.maxPlayerY = 500;
        
        // Track player progress (0 = back, 1 = fully forward)
        this.playerProgress = 0;
        
        // Line animation properties
        this.lineSegments = [];
        this.bottomWidth = 20;
        this.topWidth = 3;
        this.bottomLength = 45;
        this.topLength = 15;
        this.minGap = 20;
        this.maxGap = 100;
        this.baseSpeed = 0.6;
    }

    // Common setup for both scenes
    setupCommonElements(centerX, centerY, sceneTitle) {
        // Setup title
        this.add.text(centerX, 30, sceneTitle, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(centerX, 70, 'LEFT/RIGHT arrows to change lanes\nUP arrow to move forward\nSPACE for game over', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        // Lane indicator
        this.laneText = this.add.text(16, 50, 'Lane: Left', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Score text
        this.scoreText = this.add.text(16, 16, 'Time: ' + (this.elapsedTime || 0), {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Progress tracking text
        this.progressText = this.add.text(16, 80, 'Progress: 0%', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Set up timer
        this.elapsedTime = this.elapsedTime || 0;
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        
        // Visual indicator for acceleration
        this.accelerationIndicator = this.add.text(16, 110, 'Accelerating: No', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Register one-time key handlers
        this.input.keyboard.on('keydown-LEFT', this.moveLeft, this);
        this.input.keyboard.on('keydown-RIGHT', this.moveRight, this);
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameOverScene', { score: this.elapsedTime });
        });
        
        // UP key controls for acceleration
        this.input.keyboard.on('keydown-UP', this.startAccelerating, this);
        this.input.keyboard.on('keyup-UP', this.stopAccelerating, this);
        
        // Bus lane change cooldown
        this.lastBusMove = 0;
        this.busMoveCooldown = 3000; // 3 seconds minimum between bus lane changes
    }
    
    startAccelerating() {
        this.isAccelerating = true;
        this.accelerationIndicator.setText('Accelerating: Yes');
        this.accelerationIndicator.setColor('#00ff00');
    }
    
    stopAccelerating() {
        this.isAccelerating = false;
        this.accelerationIndicator.setText('Accelerating: No');
        this.accelerationIndicator.setColor('#ffffff');
    }
    
    // Generic update timer - can be overridden by specific scenes
    updateTimer() {
        this.elapsedTime++;
        this.scoreText.setText('Time: ' + this.elapsedTime);
    }
    
    // Shared lane movement methods
    moveLeft() {
        if (this.playerLane > 0) {
            this.playerLane--;
            this.updateLaneText();
            this.tweenCarToLane(this.player, this.playerLane);
            this.checkBusFollowPlayer();
        }
    }
    
    moveRight() {
        if (this.playerLane < 1) {
            this.playerLane++;
            this.updateLaneText();
            this.tweenCarToLane(this.player, this.playerLane);
            this.checkBusFollowPlayer();
        }
    }
    
    updateLaneText() {
        const laneNames = ['Left', 'Right'];
        this.laneText.setText('Lane: ' + laneNames[this.playerLane]);
    }
    
    tweenCarToLane(car, laneIndex) {
        this.tweens.add({
            targets: car,
            x: this.lanePositions[laneIndex],
            duration: 300,
            ease: 'Cubic.easeOut'
        });
    }
    
    checkBusFollowPlayer() {
        const now = this.time.now;
        if (now - this.lastBusMove > this.busMoveCooldown) {
            // Calculate blocking probability based on player progress
            const blockingChance = this.playerProgress >= 1 ? 
                100 : Math.min(70 + Math.floor(this.playerProgress * 30), 99);
                
            if (Phaser.Math.Between(0, 100) < blockingChance) {
                this.time.delayedCall(Phaser.Math.Between(300, 1000), () => {
                    if (this.busLane !== this.playerLane) {
                        this.busLane = this.playerLane;
                        this.tweenCarToLane(this.bus, this.busLane);
                        this.lastBusMove = this.time.now;
                    }
                });
            }
        }
    }
    
    // Common vehicle creation methods
    createBus(x, y) {
        // Create a sprite using the Bus.PNG image
        // Note: You must preload this in your scene's preload method with:
        // this.load.image('bus', 'assets/Bus.PNG');
        const bus = this.add.sprite(x, y, 'bus');
        
        // Set appropriate scale if needed
        // Adjust these values based on your actual image size
        bus.setScale(0.5);
        
        // Make sure origin is centered for proper positioning
        bus.setOrigin(0.5, 0.5);
        
        return bus;
    }
    
    createPlayerCar(x, y) {
        const carGroup = this.add.container(x, y);
        
        // Car body
        carGroup.add(
            this.add.rectangle(0, 0, 80, 140, 0xdd3333)
                .setStrokeStyle(2, 0x000000)
        );
        
        // Windshield
        carGroup.add(
            this.add.rectangle(0, -30, 70, 40, 0x88ccff)
                .setStrokeStyle(1, 0x000000)
        );
        
        // Car wheels
        carGroup.add(this.add.circle(-35, 50, 15, 0x000000));
        carGroup.add(this.add.circle(35, 50, 15, 0x000000));
        carGroup.add(this.add.circle(-35, 50, 7, 0x888888));
        carGroup.add(this.add.circle(35, 50, 7, 0x888888));
        
        // Headlights
        carGroup.add(this.add.circle(-25, 65, 8, 0xffffcc));
        carGroup.add(this.add.circle(25, 65, 8, 0xffffcc));
        
        return carGroup;
    }
    
    // Optimize line animation for better performance
    setupAnimatedCenterLine(centerX, height) {
        this.lineSegments = [];
        this.lineGraphics = this.add.graphics();
        
        // Create fewer segments for better performance
        const segmentCount = 15; // Reduced from dynamic creation
        const segmentSpacing = height / segmentCount;
        
        for (let i = 0; i < segmentCount + 2; i++) {
            // Start above screen and go beyond bottom
            let y = -this.topLength + i * segmentSpacing;
            
            // Calculate progress relative to screen height
            let progress = Phaser.Math.Clamp(y / height, 0, 1);
            
            this.lineSegments.push({
                y: y,
                length: this.topLength + (this.bottomLength - this.topLength) * progress,
                width: this.topWidth + (this.bottomWidth - this.topWidth) * progress,
                speed: this.baseSpeed * (1 + progress),
                progress: progress
            });
        }
    }
    
    drawAnimatedCenterLine() {
        this.lineGraphics.clear();
        this.lineGraphics.fillStyle(0xffffff, 0.8);
        
        const centerX = this.scale.width / 2;
        
        for (const segment of this.lineSegments) {
            this.lineGraphics.fillRect(
                centerX - segment.width / 2, 
                segment.y, 
                segment.width, 
                segment.length
            );
        }
    }
    
    updateLineSegments() {
        const height = this.scale.height;
        
        for (const segment of this.lineSegments) {
            segment.y += segment.speed;
            
            const progress = Phaser.Math.Clamp(segment.y / height, 0, 1);
            segment.progress = progress;
            segment.speed = this.baseSpeed * (1 + progress * 2);
            segment.width = this.topWidth + (this.bottomWidth - this.topWidth) * progress;
            segment.length = this.topLength + (this.bottomLength - this.topLength) * progress;
            
            if (segment.y > height + segment.length) {
                segment.y = -segment.length;
                segment.progress = 0;
                segment.speed = this.baseSpeed;
                segment.width = this.topWidth;
                segment.length = this.topLength;
            }
        }
        
        this.drawAnimatedCenterLine();
    }
    
    // Common update logic
    commonUpdate() {
        const isBlockedByBus = this.playerLane === this.busLane;
        
        // Update animated line segments
        this.updateLineSegments();
        
        // Player movement logic
        if (this.isAccelerating && !isBlockedByBus) {
            this.movePlayerForward();
        } else if (isBlockedByBus) {
            this.movePlayerBackward();
        }
        
        // Ensure player Y position is always within allowed bounds
        this.playerY = Phaser.Math.Clamp(this.playerY, this.minPlayerY, this.maxPlayerY);
        
        // Calculate player progress
        this.playerProgress = Phaser.Math.Clamp(
            (this.maxPlayerY - this.playerY) / (this.maxPlayerY - this.minPlayerY),
            0,
            0.99
        );
        
        // Update progress text
        const displayProgress = Math.max(0, Math.min(Math.floor(this.playerProgress * 100), 99));
        this.progressText.setText('Progress: ' + displayProgress + '%');
        
        // Bus movement logic
        this.updateBusPosition(isBlockedByBus);
        
        // Warning display
        this.updateWarningText(isBlockedByBus);
    }
    
    movePlayerForward() {
        if (this.playerY > this.minPlayerY) {
            const newY = this.playerY - this.forwardSpeed;
            const minAllowedY = this.maxPlayerY - 0.99 * (this.maxPlayerY - this.minPlayerY);
            
            if (newY >= minAllowedY) {
                this.playerY = newY;
            } else {
                this.playerY = minAllowedY;
                this.enforceBusBlocking();
            }
            
            this.player.y = this.playerY;
        }
    }
    
    movePlayerBackward() {
        if (this.playerY < this.maxPlayerY) {
            this.playerY += this.backwardSpeed;
            if (this.playerY > this.maxPlayerY) {
                this.playerY = this.maxPlayerY;
            }
            this.player.y = this.playerY;
        }
    }
    
    enforceBusBlocking() {
        if (this.busLane !== this.playerLane) {
            this.busLane = this.playerLane;
            this.tweenCarToLane(this.bus, this.busLane);
            this.lastBusMove = this.time.now;
        }
    }
    
    updateBusPosition(isBlockedByBus) {
        // Bus gradually moves to block player with some delay
        if (isBlockedByBus && Math.abs(this.busY - this.playerY) > 180) {
            this.busY += 0.4;
            this.bus.y = this.busY;
        }
        
        // Occasionally check if bus should change lanes
        if (Phaser.Math.Between(0, 1000) < (5 + this.playerProgress * 15)) {
            this.checkBusFollowPlayer();
        }
    }
    
    updateWarningText(isBlockedByBus) {
        if (isBlockedByBus) {
            if (!this.warningText) {
                this.warningText = this.add.text(400, 550, 'You\'re stuck behind the bus!', {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5);
            }
        } else if (this.warningText) {
            this.warningText.destroy();
            this.warningText = null;
        }
    }
}

export default RoadSceneBase;
