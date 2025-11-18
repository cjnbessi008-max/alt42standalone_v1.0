/**
 * Pattern Loop Animation Engine
 * 주기함수의 반복이 패턴 애니메이션으로 보이는 시스템
 */

class PatternLoopEngine {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = options.width || 360;
        this.height = options.height || 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // 애니메이션 설정
        this.fps = options.fps || 60;
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.time = 0;
        this.isPlaying = false;
        this.animationId = null;

        // 패턴 저장소
        this.patterns = [];

        // 그리드 설정
        this.showGrid = options.showGrid !== undefined ? options.showGrid : true;
        this.gridColor = options.gridColor || '#e0e0e0';

        // 캔버스 중심점
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        // 스케일
        this.scaleX = options.scaleX || 50;
        this.scaleY = options.scaleY || 50;

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 크기 조절 대응
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
    }

    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    /**
     * 패턴 추가
     * @param {Object} patternData 패턴 데이터
     */
    addPattern(patternData) {
        const pattern = new Pattern(patternData);
        this.patterns.push(pattern);
        return pattern;
    }

    /**
     * 패턴 제거
     * @param {number} index 패턴 인덱스
     */
    removePattern(index) {
        if (index >= 0 && index < this.patterns.length) {
            this.patterns.splice(index, 1);
        }
    }

    /**
     * 모든 패턴 제거
     */
    clearPatterns() {
        this.patterns = [];
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        if (!this.showGrid) return;

        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);

        // 수직 그리드
        for (let x = 0; x <= this.width; x += this.scaleX) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // 수평 그리드
        for (let y = 0; y <= this.height; y += this.scaleY) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);

        // 중심 축 그리기
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.width, this.centerY);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.height);
        this.ctx.stroke();
    }

    /**
     * 패턴 그리기
     * @param {Pattern} pattern 패턴 객체
     */
    drawPattern(pattern) {
        this.ctx.strokeStyle = pattern.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const points = 200;
        const timeOffset = this.time * pattern.animationSpeed;

        for (let i = 0; i < points; i++) {
            const t = (i / points) * Math.PI * 4 - timeOffset;
            const x = this.centerX + (i / points) * this.width - this.width / 2;
            const y = this.centerY - pattern.getValue(t) * this.scaleY * pattern.amplitude;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 원형 패턴 그리기 (극좌표)
     * @param {Pattern} pattern 패턴 객체
     */
    drawCircularPattern(pattern) {
        this.ctx.strokeStyle = pattern.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const points = 360;
        const timeOffset = this.time * pattern.animationSpeed;
        const radius = Math.min(this.width, this.height) / 3;

        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = radius * (1 + pattern.getValue(angle * pattern.frequency + timeOffset) * 0.3 * pattern.amplitude);
            const x = this.centerX + r * Math.cos(angle);
            const y = this.centerY + r * Math.sin(angle);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * 리사주 패턴 그리기
     * @param {Pattern} pattern1 첫 번째 패턴
     * @param {Pattern} pattern2 두 번째 패턴
     */
    drawLissajous(pattern1, pattern2) {
        this.ctx.strokeStyle = pattern1.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const points = 500;
        const timeOffset = this.time;
        const scaleX = this.width / 3;
        const scaleY = this.height / 3;

        for (let i = 0; i < points; i++) {
            const t = (i / points) * Math.PI * 2;
            const x = this.centerX + pattern1.getValue(t * pattern1.frequency + timeOffset) * scaleX * pattern1.amplitude;
            const y = this.centerY + pattern2.getValue(t * pattern2.frequency + timeOffset) * scaleY * pattern2.amplitude;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 프레임 렌더링
     * @param {number} timestamp 타임스탬프
     */
    render(timestamp) {
        if (!this.isPlaying) return;

        const deltaTime = timestamp - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);

            // 캔버스 클리어
            this.ctx.clearRect(0, 0, this.width, this.height);

            // 배경
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.width, this.height);

            // 그리드 그리기
            this.drawGrid();

            // 패턴 그리기
            if (this.patterns.length === 1) {
                this.drawPattern(this.patterns[0]);
                this.drawCircularPattern(this.patterns[0]);
            } else if (this.patterns.length === 2) {
                this.drawLissajous(this.patterns[0], this.patterns[1]);
            } else {
                this.patterns.forEach(pattern => {
                    this.drawPattern(pattern);
                });
            }

            // 시간 업데이트
            this.time += 0.05;
        }

        this.animationId = requestAnimationFrame((ts) => this.render(ts));
    }

    /**
     * 애니메이션 시작
     */
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.lastFrameTime = performance.now();
            this.animationId = requestAnimationFrame((ts) => this.render(ts));
        }
    }

    /**
     * 애니메이션 정지
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 애니메이션 리셋
     */
    reset() {
        this.pause();
        this.time = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 그리드 표시/숨김
     * @param {boolean} show 표시 여부
     */
    setShowGrid(show) {
        this.showGrid = show;
    }
}

/**
 * Pattern 클래스
 * 개별 주기함수 패턴
 */
class Pattern {
    constructor(data) {
        this.name = data.name || 'Pattern';
        this.functionType = data.function_type || 'sine';
        this.amplitude = parseFloat(data.amplitude) || 1.0;
        this.frequency = parseFloat(data.frequency) || 1.0;
        this.phase = parseFloat(data.phase) || 0.0;
        this.color = data.color || '#3498db';
        this.animationSpeed = parseFloat(data.animation_speed) || 1.0;
    }

    /**
     * 주기함수 값 계산
     * @param {number} t 시간 (라디안)
     * @returns {number} 함수 값
     */
    getValue(t) {
        const input = t * this.frequency + this.phase;

        switch (this.functionType) {
            case 'sine':
                return Math.sin(input);
            case 'cosine':
                return Math.cos(input);
            case 'tangent':
                return Math.tan(input) / 10; // 스케일 조정
            case 'square':
                return Math.sin(input) >= 0 ? 1 : -1;
            case 'sawtooth':
                return 2 * ((input / (2 * Math.PI)) - Math.floor((input / (2 * Math.PI)) + 0.5));
            case 'triangle':
                return 2 * Math.abs(2 * ((input / (2 * Math.PI)) - Math.floor((input / (2 * Math.PI)) + 0.5))) - 1;
            default:
                return Math.sin(input);
        }
    }
}

// 전역 네임스페이스에 추가
window.PatternLoopEngine = PatternLoopEngine;
window.Pattern = Pattern;
