/**
 * Graph Chime - Audio Engine
 * Web Audio API를 사용한 음향 생성
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.currentOscillator = null;
    }

    /**
     * Audio Context 초기화 (사용자 제스처 필요)
     */
    init() {
        if (this.isInitialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isInitialized = true;
            console.log('Audio Engine initialized');
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            alert('이 브라우저는 음향 재생을 지원하지 않습니다.');
        }
    }

    /**
     * 단일 음 재생
     * @param {number} frequency - 주파수 (Hz)
     * @param {number} duration - 지속 시간 (ms)
     * @param {string} waveType - 파형 타입 ('sine', 'square', 'triangle', 'sawtooth')
     */
    playTone(frequency, duration = 500, waveType = 'sine') {
        if (!this.isInitialized) {
            this.init();
        }

        // 기존 소리 정지
        this.stop();

        // Oscillator 생성
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // 부드러운 시작과 끝 (ADSR 엔벨로프)
        const now = this.audioContext.currentTime;
        const attackTime = 0.05; // 50ms attack
        const releaseTime = 0.1; // 100ms release

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(0.3, now + duration / 1000 - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

        // 연결: Oscillator -> Gain -> Destination
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 재생
        oscillator.start(now);
        oscillator.stop(now + duration / 1000);

        this.currentOscillator = oscillator;

        // 정리
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
            this.currentOscillator = null;
        };

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    /**
     * 화음 재생 (여러 음을 동시에)
     * @param {Array} frequencies - 주파수 배열
     * @param {number} duration - 지속 시간 (ms)
     * @param {string} waveType - 파형 타입
     */
    playChord(frequencies, duration = 500, waveType = 'sine') {
        if (!this.isInitialized) {
            this.init();
        }

        this.stop();

        const now = this.audioContext.currentTime;
        const gainNode = this.audioContext.createGain();

        // 각 주파수마다 Oscillator 생성
        const oscillators = frequencies.map(freq => {
            const osc = this.audioContext.createOscillator();
            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, now);
            osc.connect(gainNode);
            return osc;
        });

        // 전체 볼륨 조절
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, now + duration / 1000 - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

        gainNode.connect(this.audioContext.destination);

        // 모든 Oscillator 시작
        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration / 1000);
        });

        // 정리
        setTimeout(() => {
            oscillators.forEach(osc => osc.disconnect());
            gainNode.disconnect();
        }, duration);

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    /**
     * 순차적으로 음 재생 (멜로디)
     * @param {Array} notes - [{frequency, duration, waveType}, ...]
     */
    async playSequence(notes) {
        for (const note of notes) {
            await this.playTone(
                note.frequency,
                note.duration || 500,
                note.waveType || 'sine'
            );
            // 노트 사이 짧은 간격
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    /**
     * 재생 중지
     */
    stop() {
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
                this.currentOscillator.disconnect();
            } catch (e) {
                // 이미 정지됨
            }
            this.currentOscillator = null;
        }
    }

    /**
     * 절편 값을 음계로 변환
     * @param {number} value - 절편 값
     * @param {string} type - 'y_intercept' or 'x_intercept'
     * @returns {object} - {frequency, noteName, waveType}
     */
    interceptToNote(value, type = 'y_intercept') {
        // 기본 음계 매핑 (C4-A4 for y절편, C5-A5 for x절편)
        const yInterceptScale = [
            { min: -5, max: -4, freq: 261.63, note: 'C4', wave: 'sine' },
            { min: -4, max: -3, freq: 277.18, note: 'C#4', wave: 'sine' },
            { min: -3, max: -2, freq: 293.66, note: 'D4', wave: 'sine' },
            { min: -2, max: -1, freq: 311.13, note: 'D#4', wave: 'sine' },
            { min: -1, max: 0, freq: 329.63, note: 'E4', wave: 'sine' },
            { min: 0, max: 1, freq: 349.23, note: 'F4', wave: 'sine' },
            { min: 1, max: 2, freq: 369.99, note: 'F#4', wave: 'sine' },
            { min: 2, max: 3, freq: 392.00, note: 'G4', wave: 'sine' },
            { min: 3, max: 4, freq: 415.30, note: 'G#4', wave: 'sine' },
            { min: 4, max: 5, freq: 440.00, note: 'A4', wave: 'sine' }
        ];

        const xInterceptScale = [
            { min: -5, max: -4, freq: 523.25, note: 'C5', wave: 'triangle' },
            { min: -4, max: -3, freq: 554.37, note: 'C#5', wave: 'triangle' },
            { min: -3, max: -2, freq: 587.33, note: 'D5', wave: 'triangle' },
            { min: -2, max: -1, freq: 622.25, note: 'D#5', wave: 'triangle' },
            { min: -1, max: 0, freq: 659.25, note: 'E5', wave: 'triangle' },
            { min: 0, max: 1, freq: 698.46, note: 'F5', wave: 'triangle' },
            { min: 1, max: 2, freq: 739.99, note: 'F#5', wave: 'triangle' },
            { min: 2, max: 3, freq: 783.99, note: 'G5', wave: 'triangle' },
            { min: 3, max: 4, freq: 830.61, note: 'G#5', wave: 'triangle' },
            { min: 4, max: 5, freq: 880.00, note: 'A5', wave: 'triangle' }
        ];

        const scale = type === 'y_intercept' ? yInterceptScale : xInterceptScale;

        // 값에 맞는 음계 찾기
        for (const noteData of scale) {
            if (value >= noteData.min && value < noteData.max) {
                return {
                    frequency: noteData.freq,
                    noteName: noteData.note,
                    waveType: noteData.wave
                };
            }
        }

        // 범위를 벗어나면 기본값
        return type === 'y_intercept'
            ? { frequency: 440, noteName: 'A4', waveType: 'sine' }
            : { frequency: 880, noteName: 'A5', waveType: 'triangle' };
    }
}

// 전역 AudioEngine 인스턴스
const audioEngine = new AudioEngine();
