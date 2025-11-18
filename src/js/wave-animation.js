/**
 * Wave Animation Controller
 * 근의 개수 변화 시 파동 애니메이션 처리
 */

class WaveAnimationController {
    constructor() {
        this.waveOverlay = document.getElementById('waveOverlay');
        this.waveCanvas = document.getElementById('waveCanvas');
        this.waveMessage = document.getElementById('waveMessage');
        this.ctx = this.waveCanvas ? this.waveCanvas.getContext('2d') : null;

        // Wave 파라미터
        this.waveAmplitude = 20;
        this.waveFrequency = 0.02;
        this.waveSpeed = 0.05;
        this.wavePhase = 0;
        this.isAnimating = false;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        if (this.ctx) {
            this.startCanvasAnimation();
        }
    }

    /**
     * 근의 개수 변화에 따른 파동 효과 트리거
     * @param {number} oldCount - 이전 근의 개수
     * @param {number} newCount - 새로운 근의 개수
     */
    triggerWave(oldCount, newCount) {
        const change = newCount - oldCount;
        const changeType = change > 0 ? 'increase' : 'decrease';

        // 전체 화면 파동 효과
        this.showFullScreenWave(changeType, change);

        // 캔버스 파동 강화
        this.intensifyCanvasWave(changeType);

        // 메시지 표시
        this.showWaveMessage(changeType, Math.abs(change));

        // 스마트폰 흔들림 효과
        this.shakeSmartphone();
    }

    /**
     * 전체 화면 파동 효과
     */
    showFullScreenWave(changeType, change) {
        // 스마트폰 위치를 중심으로 파동 생성
        const smartphone = document.querySelector('.smartphone-container');
        if (!smartphone) return;

        const rect = smartphone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 모든 ripple 요소 위치 설정
        const ripples = this.waveOverlay.querySelectorAll('.ripple');
        ripples.forEach(ripple => {
            ripple.style.left = `${centerX}px`;
            ripple.style.top = `${centerY}px`;
        });

        // 파동 효과 활성화
        this.waveOverlay.className = `wave-overlay active ${changeType}`;

        // 애니메이션 종료 후 클래스 제거
        setTimeout(() => {
            this.waveOverlay.classList.remove('active', changeType);
        }, 2000);
    }

    /**
     * 캔버스 파동 강화
     */
    intensifyCanvasWave(changeType) {
        // 파동 진폭 일시적으로 증가
        const originalAmplitude = this.waveAmplitude;
        this.waveAmplitude = changeType === 'increase' ? 40 : 30;

        // 2초 후 원래대로 복구
        setTimeout(() => {
            this.waveAmplitude = originalAmplitude;
        }, 2000);
    }

    /**
     * 파동 메시지 표시
     */
    showWaveMessage(changeType, change) {
        const messages = {
            increase: `근 ${change}개 증가!`,
            decrease: `근 ${change}개 감소!`
        };

        this.waveMessage.textContent = messages[changeType];
        this.waveMessage.classList.add('active');

        setTimeout(() => {
            this.waveMessage.classList.remove('active');
        }, 2000);
    }

    /**
     * 스마트폰 흔들림 효과
     */
    shakeSmartphone() {
        const container = document.querySelector('.wave-container');
        if (container) {
            container.classList.add('animate');
            setTimeout(() => {
                container.classList.remove('animate');
            }, 500);
        }
    }

    /**
     * 캔버스 Wave 애니메이션 시작
     */
    startCanvasAnimation() {
        this.isAnimating = true;
        this.drawWave();
    }

    /**
     * Wave 그리기
     */
    drawWave() {
        if (!this.isAnimating || !this.ctx) return;

        const width = this.waveCanvas.width;
        const height = this.waveCanvas.height;
        const centerY = height / 2;

        // 캔버스 초기화
        this.ctx.clearRect(0, 0, width, height);

        // 그라디언트 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#e0e7ff');
        gradient.addColorStop(1, '#f0f4ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        // 여러 개의 Wave 그리기
        this.drawSingleWave(centerY, this.waveAmplitude, this.wavePhase, 'rgba(102, 126, 234, 0.3)', 2);
        this.drawSingleWave(centerY, this.waveAmplitude * 0.7, this.wavePhase + Math.PI / 4, 'rgba(118, 75, 162, 0.3)', 2);
        this.drawSingleWave(centerY, this.waveAmplitude * 0.5, this.wavePhase + Math.PI / 2, 'rgba(59, 130, 246, 0.2)', 1.5);

        // 위상 업데이트
        this.wavePhase += this.waveSpeed;

        // 다음 프레임
        this.animationFrameId = requestAnimationFrame(() => this.drawWave());
    }

    /**
     * 단일 Wave 그리기
     */
    drawSingleWave(centerY, amplitude, phase, color, lineWidth) {
        if (!this.ctx) return;

        const width = this.waveCanvas.width;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';

        for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin(x * this.waveFrequency + phase) * amplitude;

            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // Wave 아래 채우기 (투명도)
        this.ctx.lineTo(width, this.waveCanvas.height);
        this.ctx.lineTo(0, this.waveCanvas.height);
        this.ctx.closePath();
        this.ctx.fillStyle = color.replace('0.3', '0.05').replace('0.2', '0.03');
        this.ctx.fill();
    }

    /**
     * 애니메이션 중지
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * 애니메이션 재개
     */
    resumeAnimation() {
        if (!this.isAnimating) {
            this.startCanvasAnimation();
        }
    }
}

// 전역 인스턴스 생성
let waveController = null;

// DOM 로드 후 초기화
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        waveController = new WaveAnimationController();
    });
}
