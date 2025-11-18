/**
 * Audio Manager
 * Handles sound effects and musical notes
 */

const AudioManager = {
    context: null,
    enabled: true,
    masterVolume: 0.3,

    /**
     * Initialize Audio Context
     */
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = Storage.getSettings().soundEnabled;
            return true;
        } catch (error) {
            console.warn('Web Audio API not supported', error);
            this.enabled = false;
            return false;
        }
    },

    /**
     * Play a musical note
     */
    playNote(note, duration = 0.3) {
        if (!this.enabled || !this.context) return;

        const frequency = this.noteToFrequency(note);
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },

    /**
     * Play number as musical note
     */
    playNumberNote(num) {
        const note = Utils.numberToNote(num);
        this.playNote(note, 0.4);
    },

    /**
     * Play chord (multiple notes)
     */
    playChord(notes, duration = 0.5) {
        if (!this.enabled || !this.context) return;

        notes.forEach(note => {
            this.playNote(note, duration);
        });
    },

    /**
     * Play success sound
     */
    playSuccess() {
        if (!this.enabled || !this.context) return;

        const notes = ['C5', 'E5', 'G5', 'C6'];
        notes.forEach((note, index) => {
            setTimeout(() => this.playNote(note, 0.2), index * 100);
        });
    },

    /**
     * Play error sound
     */
    playError() {
        if (!this.enabled || !this.context) return;

        const frequency = 200;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.3);
    },

    /**
     * Play click sound
     */
    playClick() {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'square';
        oscillator.frequency.value = 800;

        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.05);
    },

    /**
     * Play whoosh sound
     */
    playWhoosh() {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.2);
    },

    /**
     * Play sequence as melody
     */
    async playSequence(sequence, tempo = 600) {
        if (!this.enabled || !this.context) return;

        for (let i = 0; i < sequence.length; i++) {
            this.playNumberNote(sequence[i]);
            await Utils.sleep(tempo);
        }
    },

    /**
     * Play ascending scale
     */
    async playScale(ascending = true) {
        if (!this.enabled || !this.context) return;

        const notes = ascending
            ? ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
            : ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

        for (const note of notes) {
            this.playNote(note, 0.2);
            await Utils.sleep(150);
        }
    },

    /**
     * Play achievement unlock sound
     */
    playAchievement() {
        if (!this.enabled || !this.context) return;

        // Triumphant fanfare
        const melody = [
            { note: 'G4', time: 0 },
            { note: 'G4', time: 200 },
            { note: 'G4', time: 400 },
            { note: 'C5', time: 600 }
        ];

        melody.forEach(({ note, time }) => {
            setTimeout(() => this.playNote(note, 0.3), time);
        });
    },

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        Storage.updateSetting('soundEnabled', this.enabled);

        if (this.enabled) {
            this.playClick();
            Utils.showToast('사운드 켜짐', 'info');
        } else {
            Utils.showToast('사운드 꺼짐', 'info');
        }

        return this.enabled;
    },

    /**
     * Set volume
     */
    setVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
    },

    /**
     * Convert note name to frequency
     */
    noteToFrequency(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };

        const match = note.match(/^([A-G][b#]?)(\d)$/);
        if (!match) return 440; // Default to A4

        const noteName = match[1];
        const octave = parseInt(match[2]);

        const noteNumber = noteMap[noteName];
        const a4 = 440;
        const semitonesFromA4 = (octave - 4) * 12 + noteNumber - 9;

        return a4 * Math.pow(2, semitonesFromA4 / 12);
    },

    /**
     * Create oscillator with ADSR envelope
     */
    createADSR(frequency, attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.3) {
        if (!this.context) return;

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        // ADSR Envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + attack);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(this.masterVolume * sustain, now + attack + decay + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + attack + decay + 0.5 + release);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        return { oscillator, gainNode };
    },

    /**
     * Create rhythmic pulse
     */
    startRhythmicPulse(bpm = 120) {
        if (!this.enabled || !this.context) return null;

        const interval = (60 / bpm) * 1000;
        let pulseInterval = setInterval(() => {
            this.playClick();
        }, interval);

        return pulseInterval;
    },

    /**
     * Stop rhythmic pulse
     */
    stopRhythmicPulse(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
        }
    }
};
