/**
 * Enhanced Canvas Visualization Engine
 * 개선된 시각화 엔진 with smooth animations
 */

export class Visualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.terms = [];
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.animationId = null;
        this.isPlaying = false;
        this.config = {
            colorStart: '#FFE66D',
            colorEnd: '#4ECDC4',
            animationSpeed: 1.0,
            fps: 60,
            particleEffects: true,
            showGrid: false
        };

        this.listeners = new Map();
        this.setupCanvas();
        this.setupInteraction();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
    }

    setupInteraction() {
        // 터치/마우스 상호작용
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 클릭한 위치에 가까운 점 찾기
            const clickedTerm = this.findNearestTerm(x, y);
            if (clickedTerm) {
                this.emit('termClick', clickedTerm);
            }
        });

        // 리사이즈 대응
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.terms.length > 0) {
                this.draw(this.currentFrame);
            }
        });
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
    start(terms, convergenceType, config = {}) {
        this.stop();

        this.terms = terms;
        this.currentFrame = 0;
        this.totalFrames = terms.length;
        this.isPlaying = true;

        // 색상 설정
        this.setupColors(convergenceType);

        // 커스텀 설정 적용
        if (config) {
            this.setConfig(config);
        }

        // 애니메이션 시작
        this.animate();

        this.emit('start', { terms, convergenceType });
    }

    /**
     * 색상 설정
     */
    setupColors(type) {
        const colorSchemes = {
            convergent: {
                start: '#FFE66D',
                end: '#4ECDC4',
                accent: '#95E1D3'
            },
            divergent: {
                start: '#4ECDC4',
                end: '#FF6B6B',
                accent: '#FFB6B9'
            },
            oscillating: {
                start: '#F38181',
                end: '#AA96DA',
                accent: '#D4A5A5'
            }
        };

        const scheme = colorSchemes[type] || colorSchemes.convergent;
        this.config.colorStart = scheme.start;
        this.config.colorEnd = scheme.end;
        this.config.colorAccent = scheme.accent;
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isPlaying) return;

        this.draw(this.currentFrame);

        const delay = (1000 / this.config.fps) / this.config.animationSpeed;

        this.animationId = setTimeout(() => {
            this.currentFrame++;

            if (this.currentFrame >= this.totalFrames) {
                this.onComplete();
            } else {
                this.animate();
            }
        }, delay);
    }

    /**
     * 프레임 그리기
     */
    draw(frameIndex) {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 배경 그라디언트
        this.drawBackground(frameIndex);

        // 그리드 (옵션)
        if (this.config.showGrid) {
            this.drawGrid();
        }

        // 현재까지의 수열 항들
        const visibleTerms = this.terms.slice(0, frameIndex + 1);

        if (visibleTerms.length === 0) return;

        // 값의 범위 계산
        const values = visibleTerms.map(t => t.value);
        const { min, max } = this.getValueRange(values);

        // 좌표 변환 설정
        const padding = { top: 40, right: 40, bottom: 60, left: 60 };
        const graphWidth = this.width - padding.left - padding.right;
        const graphHeight = this.height - padding.top - padding.bottom;

        // 축 그리기
        this.drawAxes(padding, graphWidth, graphHeight, min, max);

        // 선 그리기
        this.drawLine(visibleTerms, padding, graphWidth, graphHeight, min, max);

        // 점 그리기
        this.drawPoints(visibleTerms, padding, graphWidth, graphHeight, min, max, frameIndex);

        // 현재 항 강조
        if (frameIndex < visibleTerms.length) {
            this.highlightCurrentTerm(visibleTerms[frameIndex], padding, graphWidth, graphHeight, min, max);
        }

        // 수렴선 (수렴하는 경우)
        if (frameIndex >= this.totalFrames * 0.5) {
            this.drawConvergenceLine(padding, graphWidth, graphHeight, min, max);
        }

        // 정보 표시
        this.drawInfo(visibleTerms[frameIndex], frameIndex);
    }

    /**
     * 배경 그라디언트
     */
    drawBackground(frameIndex) {
        const progress = frameIndex / this.totalFrames;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);

        const startColor = this.interpolateColor(
            this.config.colorStart,
            this.config.colorEnd,
            progress * 0.2
        );
        const endColor = this.interpolateColor(
            this.config.colorStart,
            this.config.colorEnd,
            progress * 0.5
        );

        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        // 세로선
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // 가로선
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 축 그리기
     */
    drawAxes(padding, graphWidth, graphHeight, min, max) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.textAlign = 'center';

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, padding.top + graphHeight);
        this.ctx.lineTo(padding.left + graphWidth, padding.top + graphHeight);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, padding.top);
        this.ctx.lineTo(padding.left, padding.top + graphHeight);
        this.ctx.stroke();

        // X축 레이블
        const xStep = Math.max(Math.floor(this.totalFrames / 5), 1);
        for (let i = 0; i <= this.totalFrames; i += xStep) {
            const x = padding.left + (i / this.totalFrames) * graphWidth;
            const y = padding.top + graphHeight + 20;

            this.ctx.fillText(`n=${i}`, x, y);

            // 눈금
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding.top + graphHeight);
            this.ctx.lineTo(x, padding.top + graphHeight + 5);
            this.ctx.stroke();
        }

        // Y축 레이블
        this.ctx.textAlign = 'right';
        const yStep = (max - min) / 5;

        for (let i = 0; i <= 5; i++) {
            const value = min + yStep * i;
            const y = padding.top + graphHeight - (i / 5) * graphHeight;

            this.ctx.fillText(value.toFixed(2), padding.left - 10, y + 4);

            // 눈금
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left - 5, y);
            this.ctx.lineTo(padding.left, y);
            this.ctx.stroke();
        }
    }

    /**
     * 선 그리기
     */
    drawLine(terms, padding, graphWidth, graphHeight, min, max) {
        if (terms.length < 2) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 5;

        terms.forEach((term, index) => {
            const x = padding.left + (index / (this.totalFrames - 1)) * graphWidth;
            const y = padding.top + graphHeight - this.normalize(term.value, min, max) * graphHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 점 그리기
     */
    drawPoints(terms, padding, graphWidth, graphHeight, min, max, currentFrame) {
        terms.forEach((term, index) => {
            const x = padding.left + (index / (this.totalFrames - 1)) * graphWidth;
            const y = padding.top + graphHeight - this.normalize(term.value, min, max) * graphHeight;

            const progress = index / this.totalFrames;
            const color = this.interpolateColor(this.config.colorStart, this.config.colorEnd, progress);

            // 점의 크기 (최근 점일수록 크게)
            const isRecent = index >= currentFrame - 5;
            const radius = isRecent ? 7 : 5;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
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
    highlightCurrentTerm(term, padding, graphWidth, graphHeight, min, max) {
        const index = term.n;
        const x = padding.left + (index / (this.totalFrames - 1)) * graphWidth;
        const y = padding.top + graphHeight - this.normalize(term.value, min, max) * graphHeight;

        // 빛나는 효과
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - 30, y - 30, 60, 60);

        // 큰 점
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();

        this.ctx.strokeStyle = this.config.colorEnd;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 파티클 효과 (옵션)
        if (this.config.particleEffects) {
            this.drawParticles(x, y);
        }
    }

    /**
     * 파티클 효과
     */
    drawParticles(x, y) {
        const particleCount = 8;
        const radius = 20;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fill();
        }
    }

    /**
     * 수렴선 그리기
     */
    drawConvergenceLine(padding, graphWidth, graphHeight, min, max) {
        const lastValue = this.terms[this.terms.length - 1].value;
        const y = padding.top + graphHeight - this.normalize(lastValue, min, max) * graphHeight;

        this.ctx.beginPath();
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(padding.left, y);
        this.ctx.lineTo(padding.left + graphWidth, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 레이블
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Limit: ${lastValue.toFixed(4)}`, padding.left + graphWidth - 120, y - 10);
    }

    /**
     * 정보 표시
     */
    drawInfo(term, frameIndex) {
        if (!term) return;

        const infoX = 20;
        const infoY = 20;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(infoX, infoY, 180, 80);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'left';

        this.ctx.fillText(`항: n = ${term.n}`, infoX + 10, infoY + 25);
        this.ctx.fillText(`값: ${term.value.toFixed(6)}`, infoX + 10, infoY + 50);
        this.ctx.fillText(`진행: ${frameIndex + 1} / ${this.totalFrames}`, infoX + 10, infoY + 75);
    }

    /**
     * 값 범위 계산
     */
    getValueRange(values) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1 || 1;

        return {
            min: min - padding,
            max: max + padding
        };
    }

    /**
     * 정규화 (0~1)
     */
    normalize(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }

    /**
     * 색상 보간
     */
    interpolateColor(color1, color2, factor) {
        factor = Math.max(0, Math.min(1, factor));

        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * HEX to RGB
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
     * 가까운 항 찾기
     */
    findNearestTerm(clickX, clickY) {
        // TODO: 구현
        return null;
    }

    /**
     * 완료 처리
     */
    onComplete() {
        this.isPlaying = false;
        this.emit('complete', { totalFrames: this.totalFrames });
    }

    /**
     * 중지
     */
    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 일시정지
     */
    pause() {
        this.isPlaying = false;
    }

    /**
     * 재개
     */
    resume() {
        if (!this.isPlaying && this.currentFrame < this.totalFrames) {
            this.isPlaying = true;
            this.animate();
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.stop();
        this.currentFrame = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 특정 프레임으로 이동
     */
    seekTo(frameIndex) {
        this.currentFrame = Math.max(0, Math.min(frameIndex, this.totalFrames - 1));
        this.draw(this.currentFrame);
    }

    /**
     * 이벤트 리스너
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * 스크린샷
     */
    toDataURL(type = 'image/png', quality = 0.92) {
        return this.canvas.toDataURL(type, quality);
    }

    /**
     * 파괴
     */
    destroy() {
        this.stop();
        this.listeners.clear();
        this.ctx = null;
    }
}

export default Visualizer;
