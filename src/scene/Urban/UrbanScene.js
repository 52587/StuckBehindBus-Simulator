class UrbanScene extends Phaser.Scene {
    constructor() {
        super('UrbanScene');
        this.playerLane = 0; // 0=left, 1=right
        this.busLane = 0;    // Bus starts in left lane
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

    init(data) {
        // Receive elapsed time from previous scene
        this.elapsedTime = data.elapsedTime || 0;
    }

    preload() {
        console.log("Loading assets in UrbanScene");
        
        // Use verified paths from HTML pre-check
        if (window.assetCheck && window.assetCheck.bus) {
            console.log(`Using verified path for bus: ${window.assetCheck.bus}`);
            this.load.image('bus', window.assetCheck.bus);
        } else {
            // Simple direct loading as fallback
            this.load.image('bus', 'assets/bus.png');
        }
        
        if (window.assetCheck && window.assetCheck.car) {
            console.log(`Using verified path for car: ${window.assetCheck.car}`);
            this.load.image('car', window.assetCheck.car);
        } else {
            // Simple direct loading as fallback
            this.load.image('car', 'assets/car.png');
        }
        
        // Load grass images (less common in urban areas but still used)
        this.load.image('grassLeft', 'assets/GrassLeft.png');
        this.load.image('grassRight', 'assets/GrassRight.png');
        
        // Load tree image for urban scene - use unique key name to avoid conflicts
        this.load.image('urbanTree', 'assets/Tree2.png');
    }
    
    // Keep fallback texture creation but simplify it
    createFallbackTexture(key) {
        console.log(`Creating fallback for ${key}`);
        const graphics = this.make.graphics({x: 0, y: 0, add: false});
        
        if (key === 'bus') {
            graphics.fillStyle(0x3366dd);
            graphics.fillRect(0, 0, 120, 200);
            graphics.strokeRect(0, 0, 120, 200);
        } else if (key === 'car') {
            graphics.fillStyle(0xdd3333);
            graphics.fillRect(0, 0, 80, 140);
            graphics.strokeRect(0, 0, 80, 140);
        }
        
        graphics.generateTexture(key, graphics.width, graphics.height);
        graphics.destroy();
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create full-screen road with perspective (trapezoid shape for pseudo-3D effect)
        this.createPerspectiveRoad(centerX, centerY, width, height);
        
        // Setup the animated center line
        this.setupAnimatedCenterLine(centerX, height);
        
        // Initialize grass arrays (fewer grass in urban scene)
        this.initializeGrassObjects();
        
        // Bus in front of player
        this.bus = this.createBus(this.lanePositions[this.busLane], this.busY);
        this.bus.setDepth(100); // High depth value
        
        // Player car - now with highest depth to appear on top
        this.player = this.createPlayerCar(this.lanePositions[this.playerLane], this.playerY);
        this.player.setDepth(110); // Increased from 90 to appear above bus
        
        // Urban environment title with high depth
        this.add.text(centerX, 30, 'URBAN ENVIRONMENT', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);
        
        this.add.text(centerX, 70, 'LEFT/RIGHT arrows to change lanes\nUP arrow to move forward\nSPACE for game over', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(200);
        
        // Lane indicator with high depth
        this.laneText = this.add.text(16, 50, 'Lane: Left', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(200);
        
        // Score text (continuing from city scene) with high depth
        this.scoreText = this.add.text(16, 16, 'Time: ' + this.elapsedTime, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(200);
        
        // Progress tracking text with high depth
        this.progressText = this.add.text(16, 80, 'Progress: 0%', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(200);
        
        // Continue timer from where it left off
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
        
        // Visual indicator for acceleration with high depth
        this.accelerationIndicator = this.add.text(16, 110, 'Accelerating: No', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(200);
        
        // Register one-time key handlers
        this.input.keyboard.on('keydown-LEFT', this.moveLeft, this);
        this.input.keyboard.on('keydown-RIGHT', this.moveRight, this);
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameOverScene', { score: this.elapsedTime });
        });
        
        // UP key controls with engine sound volume adjustment
        this.input.keyboard.on('keydown-UP', () => {
            this.isAccelerating = true;
            this.accelerationIndicator.setText('Accelerating: Yes');
            this.accelerationIndicator.setColor('#00ff00');
            
            // Increase engine sound volume
            if (this.scene.isActive('AudioScene')) {
                this.scene.get('AudioScene').events.emit('accelerate');
            }
        });
        
        this.input.keyboard.on('keyup-UP', () => {
            this.isAccelerating = false;
            this.accelerationIndicator.setText('Accelerating: No');
            this.accelerationIndicator.setColor('#ffffff');
            
            // Decrease engine sound volume
            if (this.scene.isActive('AudioScene')) {
                this.scene.get('AudioScene').events.emit('decelerate');
            }
        });
        
        // Randomly change bus lane occasionally with delay
        this.lastBusMove = 0;
        this.busMoveCooldown = 3000; // 3 seconds minimum between bus lane changes
    }
    
    createPerspectiveRoad(centerX, centerY, width, height) {
        // Urban road with concrete sides (instead of grass)
        
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
        
        // Left concrete - triangle extending from screen left to road edge
        const leftConcretePoints = [
            { x: 0, y: height },             // Bottom left corner of screen
            { x: leftBottomX, y: height },    // Bottom left corner of road
            { x: leftTopX, y: 0 },            // Top left corner of road
            { x: 0, y: 0 }                    // Top left corner of screen
        ];
        
        // Right concrete - triangle extending from road edge to screen right
        const rightConcretePoints = [
            { x: rightBottomX, y: height },   // Bottom right corner of road
            { x: width, y: height },          // Bottom right corner of screen
            { x: width, y: 0 },               // Top right corner of screen
            { x: rightTopX, y: 0 }            // Top right corner of road
        ];
        
        // Draw left concrete (gray instead of grass)
        const leftConcreteGraphics = this.add.graphics({ fillStyle: { color: 0x888888 } });
        leftConcreteGraphics.fillPoints(leftConcretePoints, true);
        
        // Draw right concrete (gray instead of grass)
        const rightConcreteGraphics = this.add.graphics({ fillStyle: { color: 0x888888 } });
        rightConcreteGraphics.fillPoints(rightConcretePoints, true);
        
        // Create the road (on top of concrete)
        const roadGraphics = this.add.graphics({ fillStyle: { color: 0x444444 } });
        roadGraphics.fillPoints(roadPoints, true);
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
        // Create a sprite using the Bus.PNG image
        const bus = this.add.sprite(x, y, 'bus');
        
        // Set scale to 1 for full-sized bus
        bus.setScale(1);
        
        // Make sure origin is centered for proper positioning
        bus.setOrigin(0.5, 0.5);
        
        return bus;
    }
    
    createPlayerCar(x, y) {
        // Create a sprite using the Car.PNG image
        const car = this.add.sprite(x, y, 'car');
        
        // Set scale to 1 for full-sized car (adjust if needed)
        car.setScale(1);
        
        // Make sure origin is centered for proper positioning
        car.setOrigin(0.5, 0.5);
        
        return car;
    }
    
    updateTimer() {
        this.elapsedTime++;
        this.scoreText.setText('Time: ' + this.elapsedTime);
    }
    
    moveLeft() {
        if (this.playerLane > 0) {
            this.playerLane--;
            this.updateLaneText();
            this.tweenCarToLane(this.player, this.playerLane);
            // Bus might follow after a delay
            this.checkBusFollowPlayer();
        }
    }
    
    moveRight() {
        if (this.playerLane < 1) {
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
    
    // Initialize the environmental objects (grass and trees)
    initializeGrassObjects() {
        // Define the object arrays
        this.environmentalObjects = {
            grass: { left: [], right: [] },
            trees: { left: [], right: [] }
        };
        
        // Road perspective values
        this.roadWidth = 600;
        this.roadFarWidth = 200;
        const centerX = this.scale.width / 2;
        
        // Set up timer for grass spawning
        this.time.addEvent({
            delay: 600,
            callback: () => this.spawnEnvironmentalObject('grass', {
                maxCount: 20,
                chancePercent: 40,
                scale: 0.2,
                sideOffset: 0,
                spawnY: -20,
                assetPrefix: 'grass'
            }),
            callbackScope: this,
            loop: true
        });
        
        // Set up timer for tree spawning
        this.time.addEvent({
            delay: 1500,
            callback: () => this.spawnEnvironmentalObject('trees', {
                maxCount: 10,
                chancePercent: 30,
                scale: 0.3,
                sideOffset: 30, // Extra offset for tree size
                spawnY: -50,
                assetPrefix: 'urbanTree' // Changed from 'tree' to 'urbanTree'
            }),
            callbackScope: this,
            loop: true
        });
    }
    
    // Generic method to spawn an environmental object (grass or trees)
    spawnEnvironmentalObject(type, config) {
        const centerX = this.scale.width / 2;
        const minDistFromCenter = 150;
        
        // Handle left side
        if (this.environmentalObjects[type].left.length < config.maxCount && 
            Phaser.Math.Between(0, 100) < config.chancePercent) {
            
            // Calculate a random X position at least 200px left of center
            const maxX = centerX - minDistFromCenter - config.sideOffset;
            const spawnX = Phaser.Math.Between(20 + config.sideOffset, maxX);
            
            // Create sprite
            const assetKey = type === 'grass' ? `${config.assetPrefix}Left` : config.assetPrefix;
            const obj = this.add.sprite(spawnX, config.spawnY, assetKey);
            obj.setScale(config.scale);
            obj.setOrigin(0.5, 1);
            obj.alpha = type === 'grass' ? 0.8 : 1;
            obj.initialX = spawnX;
            
            // Store type for later reference
            obj.objType = type;
            
            this.environmentalObjects[type].left.push(obj);
        }
        
        // Handle right side
        if (this.environmentalObjects[type].right.length < config.maxCount && 
            Phaser.Math.Between(0, 100) < config.chancePercent) {
            
            // Calculate a random X position at least 200px right of center
            const minX = centerX + minDistFromCenter + config.sideOffset;
            const spawnX = Phaser.Math.Between(minX, this.scale.width - (20 + config.sideOffset));
            
            // Create sprite
            const assetKey = type === 'grass' ? `${config.assetPrefix}Right` : config.assetPrefix;
            const obj = this.add.sprite(spawnX, config.spawnY, assetKey);
            obj.setScale(config.scale);
            obj.setOrigin(0.5, 1);
            obj.alpha = type === 'grass' ? 0.8 : 1;
            obj.initialX = spawnX;
            
            // Store type for later reference
            obj.objType = type;
            
            this.environmentalObjects[type].right.push(obj);
        }
    }
    
    // Generic method to update all environmental objects
    updateEnvironmentalObjects() {
        const height = this.scale.height;
        const centerX = this.scale.width / 2;
        
        // Config for different object types
        const config = {
            grass: { 
                minScale: 0.2, 
                scaleGrowth: 0.8, 
                perspectiveMultiplier: 2.0,
                removeOffset: 50,
                setDepth: true,
                baseDepth: 10 // Low depth for grass - will appear behind
            },
            trees: { 
                minScale: 0.3, 
                scaleGrowth: 0.7, 
                perspectiveMultiplier: 2.0,
                removeOffset: 100,
                setDepth: true,
                baseDepth: 50 // Higher depth - will appear above grass
            }
        };
        
        // Process all object types
        ['grass', 'trees'].forEach(type => {
            // Process left side
            for (let i = this.environmentalObjects[type].left.length - 1; i >= 0; i--) {
                const obj = this.environmentalObjects[type].left[i];
                
                // Move down at a constant speed
                obj.y += 0.5;
                
                // Calculate distance from top (0 at top, 1 at bottom)
                const distFromTop = Math.min(obj.y / height, 1);
                
                // Scale based on y position
                const scale = config[type].minScale + distFromTop * config[type].scaleGrowth;
                obj.setScale(scale);
                
                // Calculate distance from center
                const distanceFromCenter = centerX - obj.initialX;
                
                // Increase horizontal distance based on progress down screen
                const horizontalDistance = distanceFromCenter * (1 + distFromTop * config[type].perspectiveMultiplier);
                
                // Set new X position
                obj.x = centerX - horizontalDistance;
                
                // Set depth for trees to ensure proper layering
                if (config[type].setDepth) {
                    obj.setDepth(config[type].baseDepth + (obj.y / height * 10));
                }
                
                // Remove if off screen
                if (obj.y > height + config[type].removeOffset) {
                    obj.destroy();
                    this.environmentalObjects[type].left.splice(i, 1);
                }
            }
            
            // Process right side
            for (let i = this.environmentalObjects[type].right.length - 1; i >= 0; i--) {
                const obj = this.environmentalObjects[type].right[i];
                
                // Move down at a constant speed
                obj.y += 0.5;
                
                // Calculate progress based on screen position
                const distFromTop = Math.min(obj.y / height, 1);
                
                // Scale based on y position
                const scale = config[type].minScale + distFromTop * config[type].scaleGrowth;
                obj.setScale(scale);
                
                // Calculate distance from center
                const distanceFromCenter = obj.initialX - centerX;
                
                // Increase horizontal distance based on progress
                const horizontalDistance = distanceFromCenter * (1 + distFromTop * config[type].perspectiveMultiplier);
                
                // Set new X position
                obj.x = centerX + horizontalDistance;
                
                // Set depth for trees to ensure proper layering
                if (config[type].setDepth) {
                    obj.setDepth(config[type].baseDepth + (obj.y / height * 10));
                }
                
                // Remove if off screen
                if (obj.y > height + config[type].removeOffset) {
                    obj.destroy();
                    this.environmentalObjects[type].right.splice(i, 1);
                }
            }
        });
    }

    update() {
        const isBlockedByBus = this.playerLane === this.busLane;
        
        // Update animated line segments
        this.updateLineSegments();
        
        // Update environmental objects (grass and trees)
        this.updateEnvironmentalObjects();
        
        // Manage engine sound volume based on actual movement, not just input
        this.updateEngineSound(isBlockedByBus);
        
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
        this.playerProgress = Phaser.Math.Clamp(
            (this.maxPlayerY - this.playerY) / (this.maxPlayerY - this.minPlayerY),
            0,
            0.99
        );
        
        // Update progress text
        const displayProgress = Math.max(0, Math.min(Math.floor(this.playerProgress * 100), 99));
        this.progressText.setText('Progress: ' + displayProgress + '%');
        
        // Bus gradually moves to block player with some delay
        if (isBlockedByBus && Math.abs(this.busY - this.playerY) > 180) {
            this.busY += 0.4; // Bus moves back to block player
            this.bus.y = this.busY;
        }
        
        // Occasionally check if bus should change lanes
        // Higher chance of blocking as player progresses
        if (Phaser.Math.Between(0, 1000) < (5 + this.playerProgress * 15)) {
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
                }).setOrigin(0.5).setDepth(200); // Set high depth for warning
            }
        } else if (this.warningText) {
            // Remove the warning if player changes lanes
            this.warningText.destroy();
            this.warningText = null;
        }
    }

    // New method to update engine sound volume based on actual movement
    updateEngineSound(isBlockedByBus) {
        if (this.scene.isActive('AudioScene')) {
            const audioScene = this.scene.get('AudioScene');
            
            // If accelerating but blocked, use normal volume
            if (this.isAccelerating && isBlockedByBus) {
                audioScene.events.emit('decelerate');
            }
            // If accelerating and not blocked, use higher volume
            else if (this.isAccelerating && !isBlockedByBus) {
                audioScene.events.emit('accelerate');
            }
            // Not accelerating, use normal volume
            else {
                audioScene.events.emit('decelerate');
            }
        }
    }
}

export default UrbanScene;