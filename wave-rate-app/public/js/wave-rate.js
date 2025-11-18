/**
 * Wave Rate Visualization Engine
 * Visualizes function rate of change as wave patterns
 */

class WaveRateEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Canvas dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Function parameters
        this.functionExpr = 'x*x';
        this.xMin = -5;
        this.xMax = 5;

        // Animation parameters
        this.currentX = this.xMin;
        this.animationSpeed = 1;
        this.amplitudeScale = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.animationId = null;

        // Data storage
        this.points = [];
        this.derivatives = [];
        this.wavePoints = [];

        // Wave parameters
        this.waveFrequency = 0.1;
        this.wavePhase = 0;

        this.init();
    }

    init() {
        this.clearCanvas();
        this.drawGrid();
        this.drawAxes();
    }

    /**
     * 함수 표현식을 JavaScript 함수로 변환
     */
    createFunction(expr) {
        try {
            // 안전한 함수 생성 (eval 대신 Function 사용)
            return new Function('x', `
                try {
                    return ${expr};
                } catch(e) {
                    return 0;
                }
            `);
        } catch (e) {
            console.error('Invalid function expression:', e);
            return (x) => 0;
        }
    }

    /**
     * 수치 미분 계산 (중앙 차분법)
     */
    calculateDerivative(func, x, h = 0.001) {
        return (func(x + h) - func(x - h)) / (2 * h);
    }

    /**
     * 함수 데이터 계산
     */
    calculateFunctionData() {
        const func = this.createFunction(this.functionExpr);
        this.points = [];
        this.derivatives = [];

        const steps = 200;
        const dx = (this.xMax - this.xMin) / steps;

        for (let i = 0; i <= steps; i++) {
            const x = this.xMin + i * dx;
            const y = func(x);
            const derivative = this.calculateDerivative(func, x);

            this.points.push({ x, y });
            this.derivatives.push({ x, value: derivative });
        }
    }

    /**
     * 파동 진폭 계산 (변화율 기반)
     */
    calculateWaveAmplitude(derivative) {
        // 변화율이 클수록 파동 진폭이 커짐
        return Math.tanh(Math.abs(derivative) / 5) * 30 * this.amplitudeScale;
    }

    /**
     * 캔버스 초기화
     */
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (this.width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
            const y = (this.height / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 좌표축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X axis
        const yCenter = this.height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, yCenter);
        this.ctx.lineTo(this.width, yCenter);
        this.ctx.stroke();

        // Y axis
        const xCenter = this.width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(xCenter, 0);
        this.ctx.lineTo(xCenter, this.height);
        this.ctx.stroke();
    }

    /**
     * 좌표 변환 (수학 좌표 -> 캔버스 좌표)
     */
    transformX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
    }

    transformY(y) {
        const yRange = this.getYRange();
        return this.height - ((y - yRange.min) / (yRange.max - yRange.min)) * this.height;
    }

    /**
     * Y축 범위 계산
     */
    getYRange() {
        if (this.points.length === 0) {
            return { min: -10, max: 10 };
        }

        const yValues = this.points.map(p => p.y);
        const min = Math.min(...yValues);
        const max = Math.max(...yValues);
        const margin = (max - min) * 0.1;

        return {
            min: min - margin,
            max: max + margin
        };
    }

    /**
     * 원함수 그리기
     */
    drawFunction() {
        if (this.points.length === 0) return;

        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        this.points.forEach((point, index) => {
            const x = this.transformX(point.x);
            const y = this.transformY(point.y);

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    /**
     * 도함수 그리기
     */
    drawDerivative() {
        if (this.derivatives.length === 0) return;

        this.ctx.strokeStyle = '#E74C3C';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();

        const yCenter = this.height / 2;

        this.derivatives.forEach((point, index) => {
            const x = this.transformX(point.x);
            const y = yCenter - (point.value * 15); // 스케일 조정

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    /**
     * 파동 그리기 (핵심 기능)
     */
    drawWave() {
        if (this.derivatives.length === 0) return;

        this.ctx.strokeStyle = '#2ECC71';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();

        const yCenter = this.height / 2;
        const wavePoints = [];

        this.derivatives.forEach((point, index) => {
            const x = this.transformX(point.x);

            // 변화율에 따른 파동 진폭 계산
            const amplitude = this.calculateWaveAmplitude(point.value);

            // 현재 위치에 따른 위상 계산
            const phase = this.wavePhase + (point.x - this.xMin) * this.waveFrequency;

            // 파동 y 좌표 계산
            const waveY = yCenter + amplitude * Math.sin(phase);

            wavePoints.push({ x, y: waveY, amplitude });

            if (index === 0) {
                this.ctx.moveTo(x, waveY);
            } else {
                this.ctx.lineTo(x, waveY);
            }
        });

        this.ctx.stroke();
        this.wavePoints = wavePoints;

        // 현재 위치 마커
        this.drawCurrentPositionMarker();
    }

    /**
     * 현재 위치 마커 그리기
     */
    drawCurrentPositionMarker() {
        const func = this.createFunction(this.functionExpr);
        const currentY = func(this.currentX);
        const currentDerivative = this.calculateDerivative(func, this.currentX);

        const x = this.transformX(this.currentX);
        const y = this.transformY(currentY);

        // 마커 원
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // 수직선
        this.ctx.strokeStyle = '#FF6B6B';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 정보 업데이트
        this.updateInfo(this.currentX, currentY, currentDerivative);
    }

    /**
     * 정보 표시 업데이트
     */
    updateInfo(x, y, derivative) {
        document.getElementById('current-x').textContent = x.toFixed(2);
        document.getElementById('current-y').textContent = y.toFixed(2);
        document.getElementById('current-derivative').textContent = derivative.toFixed(2);

        const ratePercentage = Math.abs(derivative) * 10;
        document.getElementById('rate-percentage').textContent =
            ratePercentage.toFixed(1) + '%';
    }

    /**
     * 애니메이션 렌더링
     */
    render() {
        this.clearCanvas();
        this.drawGrid();
        this.drawAxes();
        this.drawFunction();
        this.drawDerivative();
        this.drawWave();
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isRunning || this.isPaused) return;

        // X 위치 업데이트
        this.currentX += 0.05 * this.animationSpeed;
        this.wavePhase += 0.1 * this.animationSpeed;

        // 범위 초과 시 리셋
        if (this.currentX > this.xMax) {
            this.currentX = this.xMin;
            this.wavePhase = 0;
        }

        this.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 애니메이션 시작
     */
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.animate();
    }

    /**
     * 애니메이션 일시정지
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * 애니메이션 재개
     */
    resume() {
        this.isPaused = false;
        this.animate();
    }

    /**
     * 애니메이션 중지 및 초기화
     */
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentX = this.xMin;
        this.wavePhase = 0;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.render();
    }

    /**
     * 함수 설정
     */
    setFunction(expr, xMin, xMax) {
        this.functionExpr = expr;
        this.xMin = xMin;
        this.xMax = xMax;
        this.currentX = xMin;

        this.calculateFunctionData();
        this.render();
    }

    /**
     * 속도 설정
     */
    setSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * 진폭 배율 설정
     */
    setAmplitudeScale(scale) {
        this.amplitudeScale = scale;
        this.render();
    }

    /**
     * 패턴 매칭 정확도 계산 (학생 평가용)
     */
    calculatePatternAccuracy() {
        // 실제 구현에서는 학생이 그린 패턴과 비교
        // 여기서는 시뮬레이션
        return Math.random() * 0.3 + 0.7; // 70-100% 범위
    }
}

// Export for use in smartphone-ui.js
window.WaveRateEngine = WaveRateEngine;
