/**
 * Audio Synthesizer for Morse Code Facility
 * Uses pure Web Audio API for zero external sound file dependencies!
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambienceGain = null;
        this.morseGain = null;
        this.currentMorseOsc = null;
        this.morseTimeoutIds = [];
        this.isPlayingMorse = false;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.8;
            this.masterGain.connect(this.ctx.destination);

            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.gain.value = 0.15;
            this.ambienceGain.connect(this.masterGain);

            this.morseGain = this.ctx.createGain();
            this.morseGain.gain.value = 0.4;
            this.morseGain.connect(this.masterGain);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play single Morse beep (dit or dah) with smoothed attack/release envelope
    playBeep(durationMs, frequency = 700) {
        if (!this.ctx || this.isMuted) return Promise.resolve();

        return new Promise((resolve) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

            const now = this.ctx.currentTime;
            const attackTime = 0.005; // 5ms rise to avoid pop click
            const releaseTime = 0.005; // 5ms fall
            const durationSec = durationMs / 1000;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.35, now + attackTime);
            gain.gain.setValueAtTime(0.35, now + durationSec - releaseTime);
            gain.gain.linearRampToValueAtTime(0, now + durationSec);

            osc.connect(gain);
            gain.connect(this.morseGain);

            osc.start(now);
            osc.stop(now + durationSec);

            osc.onended = () => {
                resolve();
            };
        });
    }

    /**
     * Convert Morse string (e.g. "... --- ...") into audio timeline
     * morseStr: string of '.', '-', ' '
     * wpm: words per minute (determines unit duration in ms)
     * onSymbol: callback(symbol, durationMs) for screen light effect
     * onComplete: callback when full phrase finished
     */
    playMorseSequence(morseStr, wpm = 18, onSymbolStart = null, onSymbolEnd = null, onComplete = null) {
        this.stopMorse();
        this.init();

        this.isPlayingMorse = true;
        
        // PARIS standard: 1 WPM = 50 units per minute => unit duration = 1200 / wpm ms
        const unitMs = Math.round(1200 / wpm);
        const ditMs = unitMs;
        const dahMs = unitMs * 3;
        const symbolGapMs = unitMs; // gap between dits/dahs in same letter
        const letterGapMs = unitMs * 3; // gap between letters
        const wordGapMs = unitMs * 7; // gap between words

        let delay = 50; // initial slight offset

        const symbols = morseStr.split('');

        symbols.forEach((char, index) => {
            if (char === '.') {
                const timerId = setTimeout(() => {
                    if (!this.isPlayingMorse) return;
                    if (onSymbolStart) onSymbolStart('.', ditMs);
                    this.playBeep(ditMs);
                    setTimeout(() => {
                        if (onSymbolEnd) onSymbolEnd('.');
                    }, ditMs);
                }, delay);
                this.morseTimeoutIds.push(timerId);
                delay += ditMs + symbolGapMs;
            } else if (char === '-') {
                const timerId = setTimeout(() => {
                    if (!this.isPlayingMorse) return;
                    if (onSymbolStart) onSymbolStart('-', dahMs);
                    this.playBeep(dahMs);
                    setTimeout(() => {
                        if (onSymbolEnd) onSymbolEnd('-');
                    }, dahMs);
                }, delay);
                this.morseTimeoutIds.push(timerId);
                delay += dahMs + symbolGapMs;
            } else if (char === ' ') {
                // Check if next char is also space (word gap vs letter gap)
                delay += letterGapMs;
            } else if (char === '/') {
                delay += wordGapMs;
            }
        });

        const endTimerId = setTimeout(() => {
            this.isPlayingMorse = false;
            if (onComplete) onComplete();
        }, delay + 100);
        this.morseTimeoutIds.push(endTimerId);
    }

    stopMorse() {
        this.isPlayingMorse = false;
        this.morseTimeoutIds.forEach(id => clearTimeout(id));
        this.morseTimeoutIds = [];
    }

    // Shotgun Rack / Cocking Sound Effect
    playShotgunCock() {
        this.init();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        
        // Metallic slide pull
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2500, now);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);

        // Click lock back sound
        setTimeout(() => {
            if (!this.ctx) return;
            const clickNow = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            osc.frequency.setValueAtTime(1800, clickNow);
            osc.frequency.exponentialRampToValueAtTime(400, clickNow + 0.05);

            clickGain.gain.setValueAtTime(0.6, clickNow);
            clickGain.gain.exponentialRampToValueAtTime(0.01, clickNow + 0.05);

            osc.connect(clickGain);
            clickGain.connect(this.masterGain);
            osc.start(clickNow);
            osc.stop(clickNow + 0.05);
        }, 120);
    }

    // High Impact Shotgun Blast Sound Effect (Sub bass thump + explosion noise burst + echo)
    playShotgunBlast() {
        this.init();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;

        // 1. Heavy Low-End Punch (Sub Oscillator Drop)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(180, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + 0.5);

        // 2. High Explosive White Noise Burst
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const lowPass = this.ctx.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.setValueAtTime(4000, now);
        lowPass.frequency.exponentialRampToValueAtTime(300, now + 0.7);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        whiteNoise.connect(lowPass);
        lowPass.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.8);

        // 3. Shell Casing Clatter sound shortly after
        setTimeout(() => {
            this.playShellDrop();
        }, 600);
    }

    playShellDrop() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Success Chime for correct code
    playSuccessSound() {
        this.init();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);

            gain.gain.setValueAtTime(0.25, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.25);
        });
    }

    // Terminal Key Press Sound
    playKeyClick() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    // Radio static ambience hum
    startBunkerAmbience() {
        this.init();
        if (this.ambienceSource) return;

        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.ambienceSource = this.ctx.createBufferSource();
        this.ambienceSource.buffer = buffer;
        this.ambienceSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 180;
        filter.Q.value = 2;

        this.ambienceSource.connect(filter);
        filter.connect(this.ambienceGain);
        this.ambienceSource.start();
    }

    stopBunkerAmbience() {
        if (this.ambienceSource) {
            this.ambienceSource.stop();
            this.ambienceSource = null;
        }
    }
}

window.soundEngine = new AudioEngine();
