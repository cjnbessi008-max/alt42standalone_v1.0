/**
 * Visualization Module
 * Canvas 기반 수열 시각화 및 색감 표현
 */

class SequenceVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.terms = [];
        this.currentIndex = 0;
        this.animationId = null;
        this.config = {
            colorStart: '#FF6B6B',
            colorEnd: '#4ECDC4',
            animationSpeed: 1.0
        };

        this.setupCanvas();
    }

    setupCanvas() {
        // 캔버스 크기 설정
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // 고해상도 디스플레이 지원
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.ctx.scale(dpr, dpr);

        this.width = this.canvas.width / dpr;
        this.height = this.canvas.height / dpr;
    }

    /**
     * 시각화 설정
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    /**
     * 시각화 시작
     */
    start(terms, convergenceType) {
        this.terms = terms;
        this.currentIndex = 0;
        this.convergenceType = convergenceType;

        // 색상 설정
        this.setupColors(convergenceType);

        // 애니메이션 시작
        this.animate();
    }

    /**
     * 색상 설정
     */
    setupColors(type) {
        const colorSchemes = {
            convergent: {
                start: '#FFE66D',
                end: '#4ECDC4'
            },
            divergent: {
                start: '#4ECDC4',
                end: '#FF6B6B'
            },
            oscillating: {
                start: '#F38181',
                end: '#AA96DA'
            }
        };

        const scheme = colorSchemes[type] || colorSchemes.convergent;
        this.config.colorStart = scheme.start;
        this.config.colorEnd = scheme.end;
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        if (this.currentIndex >= this.terms.length) {
            this.onComplete();
            return;
        }

        this.draw();

        const delay = 100 / this.config.animationSpeed;
        this.animationId = setTimeout(() => {
            this.currentIndex++;
            this.animate();
        }, delay);
    }

    /**
     * 그리기
     */
    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 배경 그라디언트
        this.drawBackground();

        // 수열 항들 그리기
        this.drawTerms();

        // 현재 항 강조
        this.drawCurrentTerm();

        // 수렴선 그리기 (수렴하는 경우)
        if (this.convergenceType === 'convergent' || this.convergenceType === 'oscillating') {
            this.drawConvergenceLine();
        }
    }

    /**
     * 배경 그라디언트
     */
    drawBackground() {
        const progress = this.currentIndex / this.terms.length;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);

        const startColor = this.interpolateColor(
            this.config.colorStart,
            this.config.colorEnd,
            progress * 0.3
        );
        const endColor = this.interpolateColor(
            this.config.colorStart,
            this.config.colorEnd,
            progress * 0.7
        );

        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * 수열 항들 그리기
     */
    drawTerms() {
        const visibleTerms = this.terms.slice(0, this.currentIndex + 1);
        if (visibleTerms.length === 0) return;

        // 값의 범위 계산
        const values = visibleTerms.map(t => t.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        const padding = 40;
        const graphHeight = this.height - 2 * padding;
        const graphWidth = this.width - 2 * padding;

        // 선 그리기
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;

        visibleTerms.forEach((term, index) => {
            const x = padding + (index / (this.terms.length - 1)) * graphWidth;
            const y = padding + graphHeight - this.normalizeValue(term.value, minValue, maxValue) * graphHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // 점 그리기
        visibleTerms.forEach((term, index) => {
            const x = padding + (index / (this.terms.length - 1)) * graphWidth;
            const y = padding + graphHeight - this.normalizeValue(term.value, minValue, maxValue) * graphHeight;

            const progress = index / visibleTerms.length;
            const color = this.interpolateColor(this.config.colorStart, this.config.colorEnd, progress);

            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    /**
     * 현재 항 강조
     */
    drawCurrentTerm() {
        if (this.currentIndex >= this.terms.length) return;

        const term = this.terms[this.currentIndex];
        const values = this.terms.slice(0, this.currentIndex + 1).map(t => t.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        const padding = 40;
        const graphHeight = this.height - 2 * padding;
        const graphWidth = this.width - 2 * padding;

        const x = padding + (this.currentIndex / (this.terms.length - 1)) * graphWidth;
        const y = padding + graphHeight - this.normalizeValue(term.value, minValue, maxValue) * graphHeight;

        // 빛나는 효과
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - 20, y - 20, 40, 40);

        // 큰 점
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = this.config.colorEnd;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    /**
     * 수렴선 그리기
     */
    drawConvergenceLine() {
        const lastTerm = this.terms[this.terms.length - 1];
        const values = this.terms.map(t => t.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        const padding = 40;
        const graphHeight = this.height - 2 * padding;

        const y = padding + graphHeight - this.normalizeValue(lastTerm.value, minValue, maxValue) * graphHeight;

        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(this.width - padding, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 수렴값 표시
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText(`수렴값: ${lastTerm.value.toFixed(4)}`, this.width - padding - 100, y - 10);
    }

    /**
     * 값 정규화 (0~1 범위로)
     */
    normalizeValue(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }

    /**
     * 색상 보간
     */
    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * HEX to RGB 변환
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * 애니메이션 중지
     */
    stop() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.stop();
        this.currentIndex = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 완료 콜백
     */
    onComplete() {
        console.log('Visualization complete');
        // 이벤트 발생
        const event = new CustomEvent('visualizationComplete');
        this.canvas.dispatchEvent(event);
    }
}
