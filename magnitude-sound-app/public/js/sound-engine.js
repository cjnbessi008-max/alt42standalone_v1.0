/**
 * Magnitude Sound - Web Audio API 사운드 엔진
 * 벡터의 크기/방향을 음악으로 변환하여 재생
 */

class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.currentOscillator = null;
        this.currentGain = null;
        this.currentPanner = null;

        // 사운드 파라미터
        this.params = {
            volume: 0,
            frequency: 220,
            pan: 0,
            waveform: 'sine',
            duration: 1.0
        };
    }

    /**
     * Audio Context 초기화 (사용자 제스처 필요)
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            // AudioContext 생성 (브라우저 호환성)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // 마스터 게인 노드 생성
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5; // 전체 볼륨 50%
            this.masterGain.connect(this.audioContext.destination);

            this.isInitialized = true;
            console.log('✅ Audio Context initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Audio Context:', error);
            return false;
        }
    }

    /**
     * 벡터 데이터를 사운드 파라미터로 변환
     *
     * @param {Object} vector - 벡터 객체 {x, y, magnitude, direction}
     * @returns {Object} 사운드 파라미터
     */
    vectorToSoundParams(vector) {
        const { magnitude, direction } = vector;

        // 1. 크기 -> 음량 (0~1)
        // 최대 크기를 10으로 가정
        const maxMagnitude = 10;
        const volume = Math.min(1.0, magnitude / maxMagnitude);

        // 2. 크기 -> 주파수 (Hz)
        // 220Hz (A3) ~ 880Hz (A5) 범위로 로그 스케일 매핑
        const minFreq = 220;
        const maxFreq = 880;
        const normalizedMagnitude = Math.min(1.0, magnitude / maxMagnitude);
        const frequency = minFreq * Math.pow(maxFreq / minFreq, normalizedMagnitude);

        // 3. 방향 -> 스테레오 패닝
        // 0° = 중앙 우측, 90° = 상단 (우측), 180° = 좌측, 270° = 하단 (좌측)
        // -1 (left) ~ 1 (right)
        let normalizedAngle = direction;
        if (normalizedAngle > 180) {
            normalizedAngle -= 360;
        }
        const pan = Math.max(-1, Math.min(1, Math.sin(direction * Math.PI / 180)));

        // 4. 방향 -> 파형 선택 (8방향)
        const octant = Math.floor(direction / 45) % 8;
        const waveforms = [
            'sine',      // 0° - 동 (E)
            'triangle',  // 45° - 북동 (NE)
            'square',    // 90° - 북 (N)
            'sawtooth',  // 135° - 북서 (NW)
            'sine',      // 180° - 서 (W)
            'triangle',  // 225° - 남서 (SW)
            'square',    // 270° - 남 (S)
            'sawtooth'   // 315° - 남동 (SE)
        ];
        const waveform = waveforms[octant];

        // 5. 크기 -> 지속 시간
        // 큰 벡터일수록 긴 소리
        const duration = 0.5 + (normalizedMagnitude * 1.5); // 0.5~2초

        return {
            volume: parseFloat(volume.toFixed(3)),
            frequency: parseFloat(frequency.toFixed(2)),
            pan: parseFloat(pan.toFixed(3)),
            waveform,
            octant,
            duration: parseFloat(duration.toFixed(2))
        };
    }

    /**
     * 소리 재생
     *
     * @param {Object} vector - 벡터 객체
     */
    async playSound(vector) {
        if (!this.isInitialized) {
            console.warn('⚠️ Audio Context not initialized. Call initialize() first.');
            return;
        }

        // AudioContext가 suspended 상태면 resume
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // 이전 소리 중지
        this.stopSound();

        // 벡터를 사운드 파라미터로 변환
        this.params = this.vectorToSoundParams(vector);

        // UI 업데이트
        this.updateSoundUI();

        // 오디오 노드 생성 및 연결
        try {
            // Oscillator (음원)
            this.currentOscillator = this.audioContext.createOscillator();
            this.currentOscillator.type = this.params.waveform;
            this.currentOscillator.frequency.setValueAtTime(
                this.params.frequency,
                this.audioContext.currentTime
            );

            // Gain (음량 조절)
            this.currentGain = this.audioContext.createGain();
            this.currentGain.gain.setValueAtTime(0, this.audioContext.currentTime);

            // Envelope: Attack-Decay-Sustain-Release (ADSR)
            const now = this.audioContext.currentTime;
            const attackTime = 0.1;
            const decayTime = 0.1;
            const sustainLevel = this.params.volume * 0.7;
            const releaseTime = 0.2;

            // Attack
            this.currentGain.gain.linearRampToValueAtTime(
                this.params.volume,
                now + attackTime
            );

            // Decay
            this.currentGain.gain.linearRampToValueAtTime(
                sustainLevel,
                now + attackTime + decayTime
            );

            // Sustain
            this.currentGain.gain.setValueAtTime(
                sustainLevel,
                now + this.params.duration - releaseTime
            );

            // Release
            this.currentGain.gain.linearRampToValueAtTime(
                0,
                now + this.params.duration
            );

            // Panner (스테레오 위치)
            this.currentPanner = this.audioContext.createStereoPanner();
            this.currentPanner.pan.setValueAtTime(
                this.params.pan,
                this.audioContext.currentTime
            );

            // 노드 연결: Oscillator -> Gain -> Panner -> MasterGain -> Destination
            this.currentOscillator.connect(this.currentGain);
            this.currentGain.connect(this.currentPanner);
            this.currentPanner.connect(this.masterGain);

            // 재생 시작
            this.currentOscillator.start(now);
            this.currentOscillator.stop(now + this.params.duration);

            // 재생 종료 후 정리
            this.currentOscillator.onended = () => {
                this.cleanupNodes();
            };

            console.log('🎵 Playing sound:', this.params);

            // 비주얼 피드백
            this.visualFeedback();

        } catch (error) {
            console.error('❌ Failed to play sound:', error);
        }
    }

    /**
     * 소리 중지
     */
    stopSound() {
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
                this.currentOscillator.onended = null;
            } catch (e) {
                // 이미 중지됨
            }
            this.cleanupNodes();
        }
    }

    /**
     * 오디오 노드 정리
     */
    cleanupNodes() {
        if (this.currentOscillator) {
            this.currentOscillator.disconnect();
            this.currentOscillator = null;
        }
        if (this.currentGain) {
            this.currentGain.disconnect();
            this.currentGain = null;
        }
        if (this.currentPanner) {
            this.currentPanner.disconnect();
            this.currentPanner = null;
        }
    }

    /**
     * 사운드 UI 업데이트
     */
    updateSoundUI() {
        // 음량 바
        const volumeBar = document.getElementById('volume-bar');
        if (volumeBar) {
            volumeBar.style.width = `${this.params.volume * 100}%`;
        }

        // 주파수 바
        const frequencyBar = document.getElementById('frequency-bar');
        const frequencyValue = document.getElementById('frequency-value');
        if (frequencyBar) {
            const normalizedFreq = (this.params.frequency - 220) / (880 - 220);
            frequencyBar.style.width = `${normalizedFreq * 100}%`;
        }
        if (frequencyValue) {
            frequencyValue.textContent = `${Math.round(this.params.frequency)} Hz`;
        }

        // 파형
        const waveformValue = document.getElementById('waveform-value');
        if (waveformValue) {
            waveformValue.textContent = this.params.waveform;

            // 파형별 색상
            const waveformColors = {
                'sine': '#6366f1',
                'triangle': '#8b5cf6',
                'square': '#ec4899',
                'sawtooth': '#f59e0b'
            };
            waveformValue.style.background = waveformColors[this.params.waveform] || '#6366f1';
        }
    }

    /**
     * 비주얼 피드백 (캔버스 플래시 효과)
     */
    visualFeedback() {
        const canvas = document.getElementById('vector-canvas');
        if (!canvas) return;

        // 원래 스타일 저장
        const originalFilter = canvas.style.filter;

        // 플래시 효과
        canvas.style.filter = 'brightness(1.3)';

        setTimeout(() => {
            canvas.style.filter = originalFilter;
        }, 200);
    }

    /**
     * 마스터 볼륨 설정
     *
     * @param {number} volume - 0~1 사이의 볼륨 값
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * 현재 파라미터 가져오기
     */
    getParams() {
        return this.params;
    }

    /**
     * AudioContext 상태 확인
     */
    isReady() {
        return this.isInitialized && this.audioContext && this.audioContext.state === 'running';
    }
}

// 전역 변수로 내보내기
window.SoundEngine = SoundEngine;
