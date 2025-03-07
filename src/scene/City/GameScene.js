class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.playerLane = 0; // 0=left, 1=right (changed from 3 lanes to 2)
        this.busLane = 0; // Bus starts in left lane
        this.lanes = [0, 1];
        this.lanePositions = [300, 500]; // X positions for lanes (adjusted for 2 lanes)
        
        // Y positions for vehicles (higher = closer to bottom)
        this.playerY = 500; 
        this.busY = 300;
        
        // Forward creep speed
        this.forwardSpeed = 0.3;
        this.backwardSpeed = 0.6;
        
        // Min and max Y positions for player
        this.minPlayerY = 400; // Maximum forward position
        this.maxPlayerY = 500; // Starting/maximum backward position
        
        // Track player progress (0 = back, 1 = fully forward)
        this.playerProgress = 0;
    }

    preload() {
        // No preloading needed for shapes
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create full-screen road with perspective (trapezoid shape for pseudo-3D effect)
        this.createPerspectiveRoad(centerX, centerY, width, height);
        
        // Setup the animated center line
        this.setupAnimatedCenterLine(centerX, height);
        
        // Bus in front of player
        this.bus = this.createBus(this.lanePositions[this.busLane], this.busY);
        
        // Player car
        this.player = this.createPlayerCar(this.lanePositions[this.playerLane], this.playerY);
        
        // Instructions text - updated to include UP key instructions
        this.add.text(centerX, 30, 'STUCK BEHIND THE BUS', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
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
        
        // Score text (just for testing)
        this.scoreText = this.add.text(16, 16, 'Time: 0', {
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
        
        // Simple timer for testing
        this.elapsedTime = 0;
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        
        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Track if player is trying to move forward
        this.isAccelerating = false;
        
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
        this.input.keyboard.on('keydown-UP', () => {
            this.isAccelerating = true;
            this.accelerationIndicator.setText('Accelerating: Yes');
            this.accelerationIndicator.setColor('#00ff00');
        });
        
        this.input.keyboard.on('keyup-UP', () => {
            this.isAccelerating = false;
            this.accelerationIndicator.setText('Accelerating: No');
            this.accelerationIndicator.setColor('#ffffff');
        });
        
        // Randomly change bus lane occasionally with delay
        this.lastBusMove = 0;
        this.busMoveCooldown = 3000; // 3 seconds minimum between bus lane changes
    }
    
    createPerspectiveRoad(centerX, centerY, width, height) {
        // Road extends all the way to the top of the screen
        const roadWidth = 600; // Width at the bottom (closer to viewer)
        const roadFarWidth = 200; // Width at the top (further from viewer)
        
        // Calculate the road edges
        const leftBottomX = centerX - roadWidth/2;
        const rightBottomX = centerX + roadWidth/2;
        const leftTopX = centerX - roadFarWidth/2;
        const rightTopX = centerX + roadFarWidth/2;
        
        // Road background (asphalt) - from bottom to top of screen
        const roadPoints = [
            { x: leftBottomX, y: height },        // Bottom left
            { x: rightBottomX, y: height },       // Bottom right
            { x: rightTopX, y: 0 },               // Top right
            { x: leftTopX, y: 0 }                 // Top left
        ];
        
        // Create the grass areas first as triangular shapes (so road draws on top)
        
        // Left grass - triangle extending from screen left to road edge
        const leftGrassPoints = [
            { x: 0, y: height },             // Bottom left corner of screen
            { x: leftBottomX, y: height },    // Bottom left corner of road
            { x: leftTopX, y: 0 },            // Top left corner of road
            { x: 0, y: 0 }                    // Top left corner of screen
        ];
        
        // Right grass - triangle extending from road edge to screen right
        const rightGrassPoints = [
            { x: rightBottomX, y: height },   // Bottom right corner of road
            { x: width, y: height },          // Bottom right corner of screen
            { x: width, y: 0 },               // Top right corner of screen
            { x: rightTopX, y: 0 }            // Top right corner of road
        ];
        
        // Draw left grass
        const leftGrassGraphics = this.add.graphics({ fillStyle: { color: 0x33aa33 } });
        leftGrassGraphics.fillPoints(leftGrassPoints, true);
        
        // Draw right grass
        const rightGrassGraphics = this.add.graphics({ fillStyle: { color: 0x33aa33 } });
        rightGrassGraphics.fillPoints(rightGrassPoints, true);
        
        // Create the road (on top of grass)
        const roadGraphics = this.add.graphics({ fillStyle: { color: 0x444444 } });
        roadGraphics.fillPoints(roadPoints, true);
    }
    
    createLaneDividers(centerX, centerY, height) {
        // Create perspective lane dividers - just one center line now
        const graphics = this.add.graphics();
        
        // Center line is now handled by the animated system
        // The drawDashedLine method is kept for reference but not used here
    }
    
    drawDashedLine(graphics, startX, startY, endX, endY) {
        const segments = 30; // More segments for full height
        const dx = (endX - startX) / segments;
        const dy = (endY - startY) / segments;
        
        graphics.lineStyle(3, 0xffffff, 0.8);
        for (let i = 0; i < segments; i += 2) {
            graphics.beginPath();
            graphics.moveTo(startX + i * dx, startY + i * dy);
            graphics.lineTo(startX + (i + 1) * dx, startY + (i + 1) * dy);
            graphics.strokePath();
        }
    }
    
    setupAnimatedCenterLine(centerX, height) {
        // Create an array to store our line segments
        this.lineSegments = [];
        this.lineGraphics = this.add.graphics();
        
        // Define the perspective effect (narrowing toward the top)
        this.bottomWidth = 20;   // Width of the dash at the bottom
        this.topWidth = 3;       // Width of the dash at the top (smaller)
        this.bottomLength = 45;  // Length at the bottom (increased for better visibility)
        this.topLength = 15;     // Length at the top
        this.minGap = 20;        // Minimum gap between segments (at the top)
        this.maxGap = 100;       // Maximum gap between segments (at the bottom)
        this.baseSpeed = 0.6;    // Slightly slower base speed
        
        // Create segments with non-linear spacing
        // Start above the screen
        let y = -this.topLength;
        let progress = 0; // 0 at top, 1 at bottom
        
        // Create fewer segments due to increased spacing
        while (y < height + this.bottomLength) {
            // Calculate progress relative to screen height
            progress = Phaser.Math.Clamp(y / height, 0, 1);
            
            // Calculate segment length based on progress (varies from topLength to bottomLength)
            const segmentLength = this.topLength + (this.bottomLength - this.topLength) * progress;
            
            // Calculate segment width
            const segmentWidth = this.topWidth + (this.bottomWidth - this.topWidth) * progress;
            
            // Add the segment
            this.lineSegments.push({
                y: y,
                length: segmentLength,
                width: segmentWidth,
                speed: this.baseSpeed * (1 + progress),  // Speed increases with progress
                progress: progress  // Store progress for reference
            });
            
            // Calculate the gap for the next segment
            // Use non-linear (quadratic) growth for gap size
            const gap = this.minGap + (this.maxGap - this.minGap) * (progress * progress);
            
            // Move to the position for the next segment
            y += segmentLength + gap;
        }
    }
    
    drawAnimatedCenterLine() {
        // Clear previous rendering
        this.lineGraphics.clear();
        this.lineGraphics.fillStyle(0xffffff, 0.8);
        
        const centerX = this.scale.width / 2;
        
        // Draw each line segment
        for (const segment of this.lineSegments) {
            // Draw the line segment
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
            // Move segment down with its individual speed
            segment.y += segment.speed;
            
            // Calculate the segment's progress down the screen (0-1)
            // Use direct position calculation to ensure consistent growth
            const progress = Phaser.Math.Clamp(segment.y / height, 0, 1);
            segment.progress = progress;
            
            // Update speed based on progress - move faster near the bottom
            segment.speed = this.baseSpeed * (1 + progress * 2);
            
            // Update width based on progress (linear growth)
            segment.width = this.topWidth + (this.bottomWidth - this.topWidth) * progress;
            
            // Length grows with position on screen - always directly proportional to progress
            // No separate length progress calculation needed - just use screen position
            segment.length = this.topLength + (this.bottomLength - this.topLength) * progress;
            
            // If segment is off the bottom of the screen, reset to the top
            if (segment.y > height) {
                // Find the segment with the smallest Y position (topmost segment)
                const topSegment = this.lineSegments.reduce((prev, curr) => 
                    (prev.y < curr.y) ? prev : curr
                );
                
                // Reset to initial values for the top of the screen
                segment.progress = 0;
                segment.speed = this.baseSpeed;
                segment.width = this.topWidth;
                segment.length = this.topLength;
                
                // Calculate the gap based on its progress (which is now 0)
                const gap = this.minGap; // Smallest gap at the top
                
                // Position this segment above the topmost segment with appropriate gap
                segment.y = topSegment.y - segment.length - gap;
            }
        }
        
        // Sort segments by y to ensure proper drawing order
        this.lineSegments.sort((a, b) => a.y - b.y);
        
        // Redraw the segments
        this.drawAnimatedCenterLine();
    }
    
    createBus(x, y) {
        // Create a group for the bus and its parts
        const busGroup = this.add.container(x, y);
        
        // Bus body
        const busBody = this.add.rectangle(0, 0, 120, 200, 0x3366dd)
            .setStrokeStyle(3, 0x000000);
        busGroup.add(busBody);
        
        // Bus windows (create multiple windows going up the bus)
        for (let i = 0; i < 4; i++) {
            const windowY = -70 + i * 40;
            const busWindow = this.add.rectangle(0, windowY, 80, 25, 0x88ccff)
                .setStrokeStyle(1, 0x000000);
            busGroup.add(busWindow);
        }
        
        // Bus lights
        const leftLight = this.add.rectangle(-40, 80, 15, 10, 0xffff00)
            .setStrokeStyle(1, 0x000000);
        const rightLight = this.add.rectangle(40, 80, 15, 10, 0xffff00)
            .setStrokeStyle(1, 0x000000);
        busGroup.add(leftLight);
        busGroup.add(rightLight);
        
        // Bus wheels
        const leftWheel = this.add.circle(-40, 90, 20, 0x000000);
        const rightWheel = this.add.circle(40, 90, 20, 0x000000);
        const leftWheelCap = this.add.circle(-40, 90, 10, 0x888888);
        const rightWheelCap = this.add.circle(40, 90, 10, 0x888888);
        busGroup.add(leftWheel);
        busGroup.add(rightWheel);
        busGroup.add(leftWheelCap);
        busGroup.add(rightWheelCap);
        
        return busGroup;
    }
    
    createPlayerCar(x, y) {
        const carGroup = this.add.container(x, y);
        
        // Car body
        const carBody = this.add.rectangle(0, 0, 80, 140, 0xdd3333)
            .setStrokeStyle(2, 0x000000);
        carGroup.add(carBody);
        
        // Windshield
        const windshield = this.add.rectangle(0, -30, 70, 40, 0x88ccff)
            .setStrokeStyle(1, 0x000000);
        carGroup.add(windshield);
        
        // Car wheels
        const leftWheel = this.add.circle(-35, 50, 15, 0x000000);
        const rightWheel = this.add.circle(35, 50, 15, 0x000000);
        const leftWheelCap = this.add.circle(-35, 50, 7, 0x888888);
        const rightWheelCap = this.add.circle(35, 50, 7, 0x888888);
        carGroup.add(leftWheel);
        carGroup.add(rightWheel);
        carGroup.add(leftWheelCap);
        carGroup.add(rightWheelCap);
        
        // Headlights
        const leftLight = this.add.circle(-25, 65, 8, 0xffffcc);
        const rightLight = this.add.circle(25, 65, 8, 0xffffcc);
        carGroup.add(leftLight);
        carGroup.add(rightLight);
        
        return carGroup;
    }
    
    updateTimer() {
        this.elapsedTime++;
        this.scoreText.setText('Time: ' + this.elapsedTime);
    }
    
    moveLeft() {
        if (this.playerLane > 0) { // Now only 0 and 1 are valid
            this.playerLane--;
            this.updateLaneText();
            this.tweenCarToLane(this.player, this.playerLane);
            // Bus might follow after a delay
            this.checkBusFollowPlayer();
        }
    }
    
    moveRight() {
        if (this.playerLane < 1) { // Now only 0 and 1 are valid
            this.playerLane++;
            this.updateLaneText();
            this.tweenCarToLane(this.player, this.playerLane);
            // Bus might follow after a delay
            this.checkBusFollowPlayer();
        }
    }
    
    checkBusFollowPlayer() {
        const now = this.time.now;
        if (now - this.lastBusMove > this.busMoveCooldown) {
            // Calculate blocking probability based on player progress
            // As player gets further forward, bus is more likely to block
            const blockingChance = this.playerProgress >= 1 ? 
                100 : // 100% chance when player is at max forward position
                Math.min(70 + Math.floor(this.playerProgress * 30), 99); // 70-99% based on progress
                
            if (Phaser.Math.Between(0, 100) < blockingChance) {
                this.time.delayedCall(Phaser.Math.Between(300, 1000), () => {
                    // Move bus to player's lane
                    if (this.busLane !== this.playerLane) {
                        this.busLane = this.playerLane;
                        this.tweenCarToLane(this.bus, this.busLane);
                        this.lastBusMove = this.time.now;
                    }
                });
            }
        }
    }
    
    updateLaneText() {
        const laneNames = ['Left', 'Right']; // Changed to 2 lanes
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
    
    changeBusLane() {
        const now = this.time.now;
        if (now - this.lastBusMove > this.busMoveCooldown) {
            // Random lane change (other than following player)
            if (Phaser.Math.Between(0, 100) < 20) {
                this.busLane = this.busLane === 0 ? 1 : 0; // Toggle lane
                this.tweenCarToLane(this.bus, this.busLane);
                this.lastBusMove = now;
            }
        }
    }

    update() {
        const isBlockedByBus = this.playerLane === this.busLane;
        
        // Update animated line segments
        this.updateLineSegments();
        
        // Player creeps forward only when UP key is pressed and not blocked by bus
        if (this.isAccelerating && !isBlockedByBus) {
            if (this.playerY > this.minPlayerY) {
                // Calculate what the new Y position would be
                const newY = this.playerY - this.forwardSpeed;
                
                // Cap the position to maintain a 99% maximum progress
                const minAllowedY = this.maxPlayerY - 0.99 * (this.maxPlayerY - this.minPlayerY);
                
                // Only move if we wouldn't exceed 99% progress
                if (newY >= minAllowedY) {
                    this.playerY = newY;
                    this.player.y = this.playerY;
                } else {
                    // Hard cap at 99% progress
                    this.playerY = minAllowedY;
                    this.player.y = this.playerY;
                    
                    // Force bus to block when we reach max progress
                    if (this.busLane !== this.playerLane) {
                        this.busLane = this.playerLane;
                        this.tweenCarToLane(this.bus, this.busLane);
                        this.lastBusMove = this.time.now;
                        
                        // Message removed as requested
                    }
                }
            }
        } else if (isBlockedByBus) {
            // Player moves back if behind bus (unchanged)
            if (this.playerY < this.maxPlayerY) {
                this.playerY += this.backwardSpeed;
                // Ensure we don't exceed maxPlayerY
                if (this.playerY > this.maxPlayerY) {
                    this.playerY = this.maxPlayerY;
                }
                this.player.y = this.playerY;
            }
        }
        
        // Ensure player Y position is always within allowed bounds
        if (this.playerY < this.minPlayerY) this.playerY = this.minPlayerY;
        if (this.playerY > this.maxPlayerY) this.playerY = this.maxPlayerY;
        
        // Calculate player progress percentage (0-1)
        // Use Phaser.Math.Clamp to ensure progress is between 0 and 0.99
        this.playerProgress = Phaser.Math.Clamp(
            (this.maxPlayerY - this.playerY) / (this.maxPlayerY - this.minPlayerY),
            0,
            0.99
        );
        
        // Update progress text (ensures it's always 0-99%)
        const displayProgress = Math.max(0, Math.min(Math.floor(this.playerProgress * 100), 99));
        this.progressText.setText('Progress: ' + displayProgress + '%');
        
        // Bus gradually moves to block player with some delay
        if (isBlockedByBus && Math.abs(this.busY - this.playerY) > 180) {
            this.busY += 0.4; // Bus moves back to block player
            this.bus.y = this.busY;
        }
        
        // Occasionally check if bus should change lanes
        // Higher chance of blocking as player progresses
        if (Phaser.Math.Between(0, 1000) < (5 + this.playerProgress * 15)) {  // Increased from 10 to 15
            this.checkBusFollowPlayer();
        }
        
        // Check if player is in same lane as bus and display a warning
        if (isBlockedByBus) {
            // Add a warning if not already displayed
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
            // Remove the warning if player changes lanes
            this.warningText.destroy();
            this.warningText = null;
        }
    }
}

export default GameScene;
