/**
 * Number Melody - Sound System
 * Generates musical tones for number interactions
 */

// Audio Context (Web Audio API)
let audioContext;
let masterGain;

// Musical scale frequencies (C Major scale)
const SCALE_FREQUENCIES = {
    1: 261.63, // C4
    2: 293.66, // D4
    3: 329.63, // E4
    4: 349.23, // F4
    5: 392.00, // G4
    6: 440.00, // A4
    7: 493.88, // B4
    8: 523.25, // C5
    9: 587.33  // D5
};

// Sound patterns for different modes
const SOUND_PATTERNS = {
    melody: {
        type: 'sine',
        duration: 0.3,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2
    },
    rhythm: {
        type: 'square',
        duration: 0.2,
        attack: 0.001,
        decay: 0.05,
        sustain: 0.5,
        release: 0.1
    },
    harmony: {
        type: 'triangle',
        duration: 0.4,
        attack: 0.02,
        decay: 0.15,
        sustain: 0.6,
        release: 0.25
    }
};

/**
 * Initialize audio context
 */
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3; // Master volume
        masterGain.connect(audioContext.destination);
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

/**
 * Play sound for a number
 */
function playSound(number, pattern = 'melody') {
    if (!CONFIG.soundEnabled) return;

    initAudio();

    const frequency = SCALE_FREQUENCIES[number] || 440;
    const soundPattern = SOUND_PATTERNS[pattern] || SOUND_PATTERNS.melody;

    playTone(frequency, soundPattern);
}

/**
 * Play a musical tone
 */
function playTone(frequency, pattern) {
    const now = audioContext.currentTime;

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = pattern.type;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Create envelope (ADSR)
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, now);

    // Attack
    envelope.gain.linearRampToValueAtTime(1, now + pattern.attack);

    // Decay
    envelope.gain.linearRampToValueAtTime(
        pattern.sustain,
        now + pattern.attack + pattern.decay
    );

    // Sustain (hold)
    const sustainEnd = now + pattern.duration - pattern.release;
    envelope.gain.setValueAtTime(pattern.sustain, sustainEnd);

    // Release
    envelope.gain.linearRampToValueAtTime(0, sustainEnd + pattern.release);

    // Connect nodes
    oscillator.connect(envelope);
    envelope.connect(masterGain);

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + pattern.duration);

    // Add slight vibrato for richness
    if (pattern.type === 'sine') {
        const vibrato = audioContext.createOscillator();
        const vibratoGain = audioContext.createGain();

        vibrato.frequency.value = 5; // 5Hz vibrato
        vibratoGain.gain.value = 2; // Vibrato depth

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        vibrato.start(now);
        vibrato.stop(now + pattern.duration);
    }
}

/**
 * Play a sequence of numbers
 */
function playSequence(numbers, pattern = 'melody', tempo = 500) {
    if (!CONFIG.soundEnabled) return;

    initAudio();

    numbers.forEach((number, index) => {
        setTimeout(() => {
            playSound(number, pattern);
        }, index * tempo);
    });
}

/**
 * Play celebration sound for correct answer
 */
function playCelebrationSound() {
    if (!CONFIG.soundEnabled) return;

    initAudio();

    // Play a happy chord progression
    const celebration = [
        { notes: [261.63, 329.63, 392.00], delay: 0 },     // C-E-G (C major)
        { notes: [293.66, 369.99, 440.00], delay: 200 },   // D-F#-A (D major)
        { notes: [392.00, 493.88, 587.33], delay: 400 }    // G-B-D (G major)
    ];

    celebration.forEach(({ notes, delay }) => {
        setTimeout(() => {
            notes.forEach(freq => {
                playTone(freq, {
                    type: 'sine',
                    duration: 0.6,
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.3
                });
            });
        }, delay);
    });

    // Add sparkle effect
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const freq = 800 + Math.random() * 800;
                playTone(freq, {
                    type: 'sine',
                    duration: 0.15,
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0.3,
                    release: 0.1
                });
            }, i * 50);
        }
    }, 600);
}

/**
 * Play error sound
 */
function playErrorSound() {
    if (!CONFIG.soundEnabled) return;

    initAudio();

    // Play descending tones
    const errorNotes = [349.23, 293.66, 261.63]; // F-D-C

    errorNotes.forEach((freq, index) => {
        setTimeout(() => {
            playTone(freq, {
                type: 'sawtooth',
                duration: 0.2,
                attack: 0.001,
                decay: 0.05,
                sustain: 0.5,
                release: 0.1
            });
        }, index * 150);
    });
}

/**
 * Play click sound
 */
function playClickSound() {
    if (!CONFIG.soundEnabled) return;

    initAudio();

    const now = audioContext.currentTime;

    // Create noise for click effect
    const bufferSize = audioContext.sampleRate * 0.05;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start(now);
    noise.stop(now + 0.05);
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
    CONFIG.soundEnabled = !CONFIG.soundEnabled;

    if (CONFIG.soundEnabled) {
        initAudio();
        playClickSound();
    }

    return CONFIG.soundEnabled;
}

/**
 * Set master volume
 */
function setVolume(volume) {
    if (masterGain) {
        masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Create audio visualizer (optional enhancement)
 */
function createVisualizer(canvasElement) {
    if (!audioContext) {
        initAudio();
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    masterGain.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;

            const hue = (i / bufferLength) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    draw();
}

// Auto-initialize on first user interaction
document.addEventListener('click', function initOnClick() {
    initAudio();
    document.removeEventListener('click', initOnClick);
}, { once: true });
