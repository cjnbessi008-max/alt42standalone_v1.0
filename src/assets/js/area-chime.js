/**
 * Area Chime - 넓이 완성 종소리 재생 모듈
 * HTML5 Audio API 사용
 */

class AreaChime {
    constructor(options = {}) {
        this.audioFile = options.audioFile || '/src/assets/audio/area-chime.mp3';
        this.volume = options.volume || 0.5;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.audio = null;
        this.fallbackAudio = null;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // 메인 오디오 객체 생성
        this.audio = new Audio(this.audioFile);
        this.audio.volume = this.volume;
        this.audio.preload = 'auto';

        // 대체 포맷 (OGG)
        this.fallbackAudio = new Audio(this.audioFile.replace('.mp3', '.ogg'));
        this.fallbackAudio.volume = this.volume;
        this.fallbackAudio.preload = 'auto';

        // 오디오 로드 에러 처리
        this.audio.addEventListener('error', (e) => {
            console.warn('Area Chime MP3 load failed, trying OGG format');
            this.useWebAudioFallback();
        });
    }

    /**
     * 종소리 재생
     */
    play() {
        if (!this.enabled) {
            console.log('Area Chime is disabled');
            return;
        }

        // 오디오 파일이 있으면 재생
        if (this.audio && this.audio.readyState >= 2) {
            this.audio.currentTime = 0;
            this.audio.play().catch(err => {
                console.warn('Failed to play chime:', err);
                this.playFallback();
            });
        } else {
            // 파일이 없으면 웹 오디오 API로 간단한 종소리 생성
            this.playFallback();
        }

        console.log('🔔 Area Chime played!');
    }

    /**
     * 대체 재생 (OGG 또는 Web Audio API)
     */
    playFallback() {
        // OGG 포맷 시도
        if (this.fallbackAudio && this.fallbackAudio.readyState >= 2) {
            this.fallbackAudio.currentTime = 0;
            this.fallbackAudio.play().catch(() => {
                this.useWebAudioFallback();
            });
        } else {
            this.useWebAudioFallback();
        }
    }

    /**
     * Web Audio API를 사용한 종소리 생성
     */
    useWebAudioFallback() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // 부드러운 종소리 주파수 (C5 음)
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.type = 'sine';

            // 볼륨 페이드 아웃
            gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1.5);

            console.log('🔔 Area Chime played (Web Audio API fallback)');
        } catch (err) {
            console.error('Failed to play chime with Web Audio API:', err);
        }
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) this.audio.volume = this.volume;
        if (this.fallbackAudio) this.fallbackAudio.volume = this.volume;
    }

    /**
     * 활성화/비활성화
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 오디오 미리 로드
     */
    preload() {
        if (this.audio) {
            this.audio.load();
        }
        if (this.fallbackAudio) {
            this.fallbackAudio.load();
        }
    }
}

// 전역 인스턴스
window.areaChime = new AreaChime({
    volume: 0.5,
    enabled: true
});
