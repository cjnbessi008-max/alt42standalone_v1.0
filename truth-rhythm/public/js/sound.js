/**
 * Truth Rhythm - Sound System
 * 리듬 사운드 재생 및 관리
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.isEnabled = true;
        this.volume = 0.7;
        this.audioContext = null;
        this.initialized = false;
    }

    /**
     * 오디오 컨텍스트 초기화
     */
    init() {
        if (this.initialized) return;

        try {
            // Web Audio API 컨텍스트 생성
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.initialized = true;
            console.log('Sound system initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    /**
     * 사운드 파일 로드
     */
    async loadSound(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[key] = audioBuffer;
            console.log(`Sound loaded: ${key}`);
            return true;
        } catch (error) {
            console.error(`Failed to load sound ${key}:`, error);
            return false;
        }
    }

    /**
     * 사운드 재생
     */
    play(key, options = {}) {
        if (!this.isEnabled || !this.initialized) return;

        if (!this.sounds[key]) {
            console.warn(`Sound not found: ${key}`);
            this.playFallbackSound(key);
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = this.sounds[key];
            gainNode.gain.value = options.volume || this.volume;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            if (options.loop) {
                source.loop = true;
            }

            source.start(0);
            return source;
        } catch (error) {
            console.error(`Failed to play sound ${key}:`, error);
        }
    }

    /**
     * Web Audio API 없이 HTML5 Audio 사용 (폴백)
     */
    playFallbackSound(key) {
        const soundFile = key === 'true' ? 'sounds/true-rhythm.mp3' : 'sounds/false-rhythm.mp3';
        const audio = new Audio(soundFile);
        audio.volume = this.volume;
        audio.play().catch(err => console.error('Fallback sound play failed:', err));
    }

    /**
     * 리듬 패턴 생성 (프로그래밍 방식)
     */
    createRhythmPattern(type, bpm = 120) {
        if (!this.initialized) {
            this.init();
        }

        const pattern = type === 'true' ? this.createTrueRhythm(bpm) : this.createFalseRhythm(bpm);
        return pattern;
    }

    /**
     * 정답 리듬 생성 (경쾌한 패턴)
     */
    createTrueRhythm(bpm) {
        const beatDuration = 60 / bpm;
        const pattern = [
            { frequency: 523.25, duration: 0.1, delay: 0 },           // C5 - 첫 박자
            { frequency: 659.25, duration: 0.1, delay: beatDuration },  // E5 - 두번째 박자
            { frequency: 783.99, duration: 0.2, delay: beatDuration * 2 }, // G5 - 세번째 박자 (길게)
            { frequency: 1046.50, duration: 0.15, delay: beatDuration * 3 } // C6 - 마지막 박자
        ];

        this.playRhythmPattern(pattern);
    }

    /**
     * 오답 리듬 생성 (신중한 패턴)
     */
    createFalseRhythm(bpm) {
        const beatDuration = 60 / bpm;
        const pattern = [
            { frequency: 293.66, duration: 0.15, delay: 0 },           // D4 - 낮은 음
            { frequency: 246.94, duration: 0.15, delay: beatDuration }, // B3 - 더 낮은 음
            { frequency: 220.00, duration: 0.3, delay: beatDuration * 2 } // A3 - 길게 울림
        ];

        this.playRhythmPattern(pattern);
    }

    /**
     * 리듬 패턴 재생
     */
    playRhythmPattern(pattern) {
        if (!this.initialized || !this.isEnabled) return;

        const startTime = this.audioContext.currentTime;

        pattern.forEach(note => {
            this.playTone(
                note.frequency,
                note.duration,
                startTime + note.delay
            );
        });
    }

    /**
     * 단일 톤 재생
     */
    playTone(frequency, duration, startTime) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine'; // 부드러운 사인파

            // ADSR 엔벨로프 적용
            const attackTime = 0.01;
            const decayTime = 0.1;
            const sustainLevel = 0.5;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, startTime + attackTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * sustainLevel, startTime + attackTime + decayTime);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        } catch (error) {
            console.error('Failed to play tone:', error);
        }
    }

    /**
     * 효과음 재생
     */
    playEffect(effectType) {
        switch (effectType) {
            case 'correct':
                this.createTrueRhythm(140); // 빠른 BPM
                break;
            case 'incorrect':
                this.createFalseRhythm(80); // 느린 BPM
                break;
            case 'click':
                this.playTone(800, 0.05, this.audioContext.currentTime);
                break;
            case 'success':
                this.playSuccessFanfare();
                break;
            default:
                console.warn(`Unknown effect type: ${effectType}`);
        }
    }

    /**
     * 성공 팡파르 재생
     */
    playSuccessFanfare() {
        const now = this.audioContext.currentTime;
        const notes = [
            { freq: 523.25, time: 0 },     // C
            { freq: 659.25, time: 0.15 },  // E
            { freq: 783.99, time: 0.3 },   // G
            { freq: 1046.50, time: 0.45 }  // C (high)
        ];

        notes.forEach(note => {
            this.playTone(note.freq, 0.3, now + note.time);
        });
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 사운드 활성화/비활성화
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    /**
     * 사운드 중지
     */
    stopAll() {
        // 새 AudioContext로 리셋
        if (this.audioContext) {
            this.audioContext.close();
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        }
    }
}

// 전역 사운드 매니저 인스턴스
const soundManager = new SoundManager();

// 사용자 인터랙션 시 초기화
document.addEventListener('click', () => {
    if (!soundManager.initialized) {
        soundManager.init();
    }
}, { once: true });

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
}
