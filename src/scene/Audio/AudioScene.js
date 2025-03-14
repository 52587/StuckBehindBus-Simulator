class AudioScene extends Phaser.Scene {
    constructor() {
        // Change to inactive by default - will be started manually
        super({ key: 'AudioScene', active: false });
        this.audioLoaded = false;
        this.audioPlaying = false;
    }

    preload() {
        // Try loading the audio file but handle potential errors
        try {
            this.load.audio('engineSound', 'assets/audio/EngineSoundLoop.wav');
            
            // Add specific error handler for this audio file
            this.load.once('loaderror', (fileObj) => {
                if (fileObj.key === 'engineSound') {
                    console.warn('Engine sound file not found. Using silent placeholder.');
                    this.audioLoaded = false;
                    
                    // Create a short silent sound as fallback
                    this.createSilentSound('engineSound');
                }
            });
            
            // Set flag if loading succeeds
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
        console.log('AudioScene created');
        // Create engine sound but don't play it yet
        try {
            this.engineSound = this.sound.add('engineSound', {
                loop: true,
                volume: 0.1
            });
            
            // Set up event listeners
            this.events.on('start_engine', this.startEngineSound, this);
            this.events.on('stop_engine', this.stopEngineSound, this);
            this.game.events.on('game_over', this.stopEngineSound, this);
            
            console.log(this.audioLoaded ? 'Audio loaded and ready' : 'Silent placeholder ready');
        } catch (e) {
            console.warn('Could not create engine sound:', e);
            // Create a dummy object to prevent errors
            this.engineSound = { 
                play: () => {}, 
                stop: () => {},
                isPlaying: false
            };
        }
        
        // After scene/game is loaded, unlock audio context when available
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
            if (this.engineSound && this.audioPlaying) {
                this.engineSound.stop();
                this.audioPlaying = false;
                console.log('Engine sound stopped');
            }
        } catch (e) {
            console.warn('Error stopping engine sound:', e);
        }
    }
}

export default AudioScene;
