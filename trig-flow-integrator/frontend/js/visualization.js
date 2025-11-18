/**
 * Trig Flow Integrator - 시각화 엔진
 * Canvas를 사용한 부드러운 애니메이션 렌더링
 */

class TrigVisualizer {
    constructor(canvasId, integrator) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.integrator = integrator;

        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 시각화 설정
        this.config = {
            xMin: -2 * Math.PI,
            xMax: 2 * Math.PI,
            yMin: -5,
            yMax: 5,
            numPoints: 200,
            showGrid: true,
            showAxes: true,
            showArea: true,
            showOriginal: true,
            showIntegral: true,
            colorOriginal: '#3498db',
            colorIntegral: '#e74c3c',
            colorArea: 'rgba(52, 152, 219, 0.2)',
            lineWidth: 2.5,
            animationSpeed: 0.02
        };

        // 애니메이션 상태
        this.animation = {
            running: false,
            progress: 0,
            requestId: null
        };
    }

    /**
     * 캔버스 리사이징
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = width * 0.75; // 4:3 비율

        this.canvas.width = width;
        this.canvas.height = height;

        this.width = width;
        this.height = height;

        this.draw();
    }

    /**
     * 좌표 변환: 수학 좌표 -> 캔버스 좌표
     */
    toCanvasX(x) {
        const { xMin, xMax } = this.config;
        return ((x - xMin) / (xMax - xMin)) * this.width;
    }

    toCanvasY(y) {
        const { yMin, yMax } = this.config;
        return this.height - ((y - yMin) / (yMax - yMin)) * this.height;
    }

    /**
     * 좌표 변환: 캔버스 좌표 -> 수학 좌표
     */
    fromCanvasX(canvasX) {
        const { xMin, xMax } = this.config;
        return xMin + (canvasX / this.width) * (xMax - xMin);
    }

    fromCanvasY(canvasY) {
        const { yMin, yMax } = this.config;
        return yMax - (canvasY / this.height) * (yMax - yMin);
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        if (!this.config.showGrid) return;

        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        const { xMin, xMax, yMin, yMax } = this.config;

        // 수직 그리드 라인
        const xStep = Math.PI / 2;
        for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
            const canvasX = this.toCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.height);
            this.ctx.stroke();
        }

        // 수평 그리드 라인
        const yStep = 1;
        for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
            const canvasY = this.toCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.width, canvasY);
            this.ctx.stroke();
        }
    }

    /**
     * 축 그리기
     */
    drawAxes() {
        if (!this.config.showAxes) return;

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X축
        const y0 = this.toCanvasY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y0);
        this.ctx.lineTo(this.width, y0);
        this.ctx.stroke();

        // Y축
        const x0 = this.toCanvasX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, 0);
        this.ctx.lineTo(x0, this.height);
        this.ctx.stroke();

        // 축 레이블
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        // X축 레이블
        const xLabels = [
            { x: -2 * Math.PI, label: '-2π' },
            { x: -Math.PI, label: '-π' },
            { x: 0, label: '0' },
            { x: Math.PI, label: 'π' },
            { x: 2 * Math.PI, label: '2π' }
        ];

        xLabels.forEach(({ x, label }) => {
            const canvasX = this.toCanvasX(x);
            if (canvasX >= 0 && canvasX <= this.width) {
                this.ctx.fillText(label, canvasX, y0 + 20);
            }
        });

        // Y축 레이블
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(this.config.yMin); y <= this.config.yMax; y++) {
            if (y !== 0) {
                const canvasY = this.toCanvasY(y);
                this.ctx.fillText(y.toString(), x0 - 10, canvasY + 5);
            }
        }
    }

    /**
     * 함수 곡선 그리기
     */
    drawCurve(points, color, lineWidth = 2.5) {
        if (points.length === 0) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const firstPoint = points[0];
        this.ctx.moveTo(this.toCanvasX(firstPoint.x), this.toCanvasY(firstPoint.y));

        // 베지어 곡선으로 부드럽게 그리기
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const canvasX = this.toCanvasX(point.x);
            const canvasY = this.toCanvasY(point.y);

            if (i === 1) {
                this.ctx.lineTo(canvasX, canvasY);
            } else {
                const prevPoint = points[i - 1];
                const prevCanvasX = this.toCanvasX(prevPoint.x);
                const prevCanvasY = this.toCanvasY(prevPoint.y);

                // 부드러운 곡선을 위한 제어점
                const cpX = (prevCanvasX + canvasX) / 2;
                this.ctx.quadraticCurveTo(prevCanvasX, prevCanvasY, cpX, (prevCanvasY + canvasY) / 2);
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 면적 그리기
     */
    drawArea(points, color) {
        if (!this.config.showArea || points.length === 0) return;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const firstPoint = points[0];
        this.ctx.moveTo(this.toCanvasX(firstPoint.x), this.toCanvasY(firstPoint.y));

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            this.ctx.lineTo(this.toCanvasX(point.x), this.toCanvasY(point.y));
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 전체 그리기
     */
    draw(animationProgress = 1) {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 배경
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 그리드와 축
        this.drawGrid();
        this.drawAxes();

        const { xMin, xMax, numPoints } = this.config;
        const animXMax = xMin + (xMax - xMin) * animationProgress;

        // 면적 그리기 (적분)
        if (this.config.showArea && this.config.showOriginal) {
            const areaPoints = this.integrator.generateAreaPoints(xMin, animXMax, Math.floor(numPoints * animationProgress));
            this.drawArea(areaPoints, this.config.colorArea);
        }

        // 원함수 그리기
        if (this.config.showOriginal) {
            const originalPoints = this.integrator.generatePoints(xMin, animXMax, Math.floor(numPoints * animationProgress), 'original');
            this.drawCurve(originalPoints, this.config.colorOriginal, this.config.lineWidth);
        }

        // 적분 함수 그리기
        if (this.config.showIntegral) {
            const integralPoints = this.integrator.generatePoints(xMin, animXMax, Math.floor(numPoints * animationProgress), 'integral');
            this.drawCurve(integralPoints, this.config.colorIntegral, this.config.lineWidth);
        }
    }

    /**
     * 애니메이션 시작
     */
    startAnimation() {
        if (this.animation.running) return;

        this.animation.running = true;
        this.animation.progress = 0;

        const animate = () => {
            if (!this.animation.running) return;

            this.animation.progress += this.config.animationSpeed;

            if (this.animation.progress >= 1) {
                this.animation.progress = 1;
                this.animation.running = false;
            }

            this.draw(this.animation.progress);

            if (this.animation.running) {
                this.animation.requestId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 애니메이션 정지
     */
    stopAnimation() {
        this.animation.running = false;
        if (this.animation.requestId) {
            cancelAnimationFrame(this.animation.requestId);
            this.animation.requestId = null;
        }
    }

    /**
     * 애니메이션 리셋
     */
    resetAnimation() {
        this.stopAnimation();
        this.animation.progress = 0;
        this.draw(0);
    }

    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.draw(this.animation.progress);
    }

    /**
     * 뷰포트 설정
     */
    setViewport(xMin, xMax, yMin, yMax) {
        this.config.xMin = xMin;
        this.config.xMax = xMax;
        this.config.yMin = yMin;
        this.config.yMax = yMax;
        this.draw(this.animation.progress);
    }
}
