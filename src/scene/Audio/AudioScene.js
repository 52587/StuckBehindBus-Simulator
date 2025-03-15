class AudioScene extends Phaser.Scene {
    constructor() {
        // Scene starts inactive and is launched by MenuScene
        super({ key: 'AudioScene', active: false });
        this.audioLoaded = false;
        this.audioPlaying = false;
        this.baseVolume = 0.1;
        this.accelerateVolume = 0.3; // Higher volume when accelerating
        this.currentTween = null; // Track the current volume tween
        this.transitionDuration = 300; // ms for volume transition
        this.lastVolumeChangeTime = 0; // Track time of last volume change
        this.volumeChangeDelay = 50; // Minimum ms between volume changes
    }

    preload() {
        // Load the engine sound with error handling
        try {
            this.load.audio('engineSound', 'assets/audio/EngineSoundLoop.wav');
            
            this.load.once('loaderror', (fileObj) => {
                if (fileObj.key === 'engineSound') {
                    this.audioLoaded = false;
                    this.createSilentSound('engineSound');
                }
            });
            
            this.load.once('filecomplete-audio-engineSound', () => {
                this.audioLoaded = true;
            });
        } catch (e) {
            console.error('Error attempting to load audio:', e);
        }
    }
    
    // Create a silent sound placeholder
    createSilentSound(key) {
        // Create an empty audio buffer (1 second of silence)
        const ctx = this.sound.context;
        if (!ctx) return;
        
        try {
            const buffer = ctx.createBuffer(1, 22050, 22050);
            const source = buffer.getChannelData(0);
            for (let i = 0; i < source.length; i++) {
                source[i] = 0; // Silence
            }
            
            // Add this buffer to the cache
            this.cache.audio.add(key, buffer);
            
            console.log('Created silent placeholder for', key);
        } catch (e) {
            console.error('Failed to create silent sound:', e);
        }
    }

    create() {
        // Create engine sound without autoplay
        try {
            this.engineSound = this.sound.add('engineSound', {
                loop: true,
                volume: this.baseVolume
            });
            
            // Set up event listeners for audio control
            this.events.on('start_engine', this.startEngineSound, this);
            this.events.on('stop_engine', this.stopEngineSound, this);
            this.events.on('accelerate', this.increaseVolume, this);
            this.events.on('decelerate', this.decreaseVolume, this);
            this.game.events.on('game_over', this.stopEngineSound, this);
            
        } catch (e) {
            // Create dummy object for error prevention
            this.engineSound = { 
                play: () => {}, 
                stop: () => {},
                setVolume: () => {},
                volume: this.baseVolume,
                isPlaying: false
            };
        }
        
        // Unlock audio context for browsers requiring user interaction
        this.unlockAudio();
    }

    unlockAudio() {
        // Try to unlock audio context when possible
        const context = this.sound.context;
        if (context && context.state === 'suspended') {
            const unlock = () => {
                context.resume().then(() => {
                    console.log('Audio context resumed successfully');
                    
                    // Remove event listeners once unlocked
                    document.removeEventListener('click', unlock);
                    document.removeEventListener('touchstart', unlock);
                    document.removeEventListener('keydown', unlock);
                })
                .catch(err => {
                    console.warn('Failed to resume audio context', err);
                });
            };
            
            // Add event listeners to unlock audio on user interaction
            document.addEventListener('click', unlock);
            document.addEventListener('touchstart', unlock);
            document.addEventListener('keydown', unlock);
        }
    }

    startEngineSound() {
        try {
            if (this.engineSound && !this.audioPlaying) {
                // Check audio context state
                const context = this.sound.context;
                if (context && context.state === 'suspended') {
                    context.resume().then(() => {
                        this.engineSound.play();
                        this.audioPlaying = true;
                        console.log('Engine sound started');
                    });
                } else {
                    this.engineSound.play();
                    this.audioPlaying = true;
                    console.log('Engine sound started');
                }
            }
        } catch (e) {
            console.warn('Error starting engine sound:', e);
        }
    }

    stopEngineSound() {
        try {
            // Stop any active volume tween first
            if (this.currentTween) {
                this.currentTween.stop();
                this.currentTween = null;
            }
            
            if (this.engineSound && this.audioPlaying) {
                this.engineSound.stop();
                this.audioPlaying = false;
                console.log('Engine sound stopped');
            }
        } catch (e) {
            console.warn('Error stopping engine sound:', e);
        }
    }

    // New method for smooth volume transition
    smoothVolumeTransition(targetVolume) {
        // Don't change volume too frequently to prevent audio artifacts
        const now = Date.now();
        if (now - this.lastVolumeChangeTime < this.volumeChangeDelay) {
            return;
        }
        this.lastVolumeChangeTime = now;
        
        try {
            if (this.engineSound && this.audioPlaying) {
                // Stop any existing volume tween
                if (this.currentTween) {
                    this.currentTween.stop();
                }
                
                // Get current volume (or use base volume if not set)
                const currentVolume = this.engineSound.volume !== undefined ? 
                    this.engineSound.volume : this.baseVolume;
                
                // Only tween if there's a significant difference
                if (Math.abs(currentVolume - targetVolume) > 0.01) {
                    // Create a temporary object to tween
                    const volumeObject = { volume: currentVolume };
                    
                    // Create new tween
                    this.currentTween = this.tweens.add({
                        targets: volumeObject,
                        volume: targetVolume,
                        duration: this.transitionDuration,
                        ease: 'Sine.easeInOut',
                        onUpdate: () => {
                            if (this.engineSound && this.audioPlaying) {
                                this.engineSound.setVolume(volumeObject.volume);
                            }
                        },
                        onComplete: () => {
                            this.currentTween = null;
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Error changing sound volume:', e);
        }
    }

    // Replace existing volume control methods with smooth transitions
    increaseVolume() {
        this.smoothVolumeTransition(this.accelerateVolume);
    }

    decreaseVolume() {
        this.smoothVolumeTransition(this.baseVolume);
    }
}

export default AudioScene;
