/**
 * Graph Renderer - Canvas 기반 그래프 렌더링
 */

class GraphRenderer {
    constructor(canvasId, width = 600, height = 400) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;

        // Canvas 크기 설정
        this.canvas.width = width;
        this.canvas.height = height;

        // 그래프 설정
        this.padding = 40;
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;

        // 현재 함수와 근
        this.currentFunction = null;
        this.roots = [];

        // Glow 설정
        this.glowEnabled = true;
        this.glowIntensity = 5;
        this.glowColor = '#00ffff';
    }

    /**
     * 좌표 변환: 수학 좌표 -> 캔버스 좌표
     */
    toCanvasX(x) {
        const graphWidth = this.width - 2 * this.padding;
        return this.padding + ((x - this.xMin) / (this.xMax - this.xMin)) * graphWidth;
    }

    toCanvasY(y) {
        const graphHeight = this.height - 2 * this.padding;
        return this.height - this.padding - ((y - this.yMin) / (this.yMax - this.yMin)) * graphHeight;
    }

    /**
     * 좌표 변환: 캔버스 좌표 -> 수학 좌표
     */
    fromCanvasX(cx) {
        const graphWidth = this.width - 2 * this.padding;
        return this.xMin + ((cx - this.padding) / graphWidth) * (this.xMax - this.xMin);
    }

    fromCanvasY(cy) {
        const graphHeight = this.height - 2 * this.padding;
        return this.yMin + ((this.height - this.padding - cy) / graphHeight) * (this.yMax - this.yMin);
    }

    /**
     * 그래프 범위 자동 조정
     */
    autoScale(fn) {
        const range = MathUtils.findRange(fn, this.xMin, this.xMax, 0.1);

        // Y 범위 조정
        const yPadding = (range.max - range.min) * 0.2;
        this.yMin = range.min - yPadding;
        this.yMax = range.max + yPadding;

        // 범위가 너무 작으면 기본값
        if (this.yMax - this.yMin < 1) {
            this.yMin = -5;
            this.yMax = 5;
        }
    }

    /**
     * 격자 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // 세로 격자선
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            const cx = this.toCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, this.padding);
            this.ctx.lineTo(cx, this.height - this.padding);
            this.ctx.stroke();
        }

        // 가로 격자선
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            const cy = this.toCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, cy);
            this.ctx.lineTo(this.width - this.padding, cy);
            this.ctx.stroke();
        }
    }

    /**
     * 축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X축
        const yAxisPos = this.toCanvasY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, yAxisPos);
        this.ctx.lineTo(this.width - this.padding, yAxisPos);
        this.ctx.stroke();

        // Y축
        const xAxisPos = this.toCanvasX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(xAxisPos, this.padding);
        this.ctx.lineTo(xAxisPos, this.height - this.padding);
        this.ctx.stroke();

        // 축 레이블
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        // X축 눈금
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            if (x === 0) continue;
            const cx = this.toCanvasX(x);
            this.ctx.fillText(x.toString(), cx, yAxisPos + 20);
        }

        // Y축 눈금
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            if (y === 0) continue;
            const cy = this.toCanvasY(y);
            this.ctx.fillText(y.toString(), xAxisPos - 10, cy + 5);
        }

        // 원점
        this.ctx.textAlign = 'right';
        this.ctx.fillText('0', xAxisPos - 5, yAxisPos + 20);
    }

    /**
     * 함수 그래프 그리기
     */
    drawFunction(fn, color = '#667eea', lineWidth = 2) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();

        let isFirst = true;
        const step = (this.xMax - this.xMin) / 500;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = MathUtils.evaluate(fn, x);

            if (y !== null && y >= this.yMin && y <= this.yMax) {
                const cx = this.toCanvasX(x);
                const cy = this.toCanvasY(y);

                if (isFirst) {
                    this.ctx.moveTo(cx, cy);
                    isFirst = false;
                } else {
                    this.ctx.lineTo(cx, cy);
                }
            } else {
                isFirst = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 근 표시 (Glow 효과 포함)
     */
    drawRoots(roots) {
        roots.forEach((root, index) => {
            const cx = this.toCanvasX(root.x);
            const cy = this.toCanvasY(root.y);

            if (this.glowEnabled) {
                // Glow 효과
                this.drawGlowEffect(cx, cy, this.glowIntensity, this.glowColor, index);
            }

            // 근 점 그리기
            this.ctx.fillStyle = this.glowColor;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // 테두리
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 근 값 레이블
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `x = ${MathUtils.formatNumber(root.x, 3)}`,
                cx,
                cy - 15
            );
        });
    }

    /**
     * Glow 효과 그리기
     */
    drawGlowEffect(cx, cy, intensity, color, index) {
        // 애니메이션 효과를 위한 시간 기반 펄스
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2 + index * Math.PI / 3) * 0.3 + 0.7;

        // 다중 레이어 Glow
        const layers = Math.min(intensity, 10);

        for (let i = layers; i > 0; i--) {
            const radius = 10 + i * intensity * pulse;
            const alpha = (0.1 * intensity * pulse) / i;

            this.ctx.fillStyle = this.hexToRgba(color, alpha);
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 내부 밝은 코어
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
        gradient.addColorStop(0, this.hexToRgba(color, 0.8));
        gradient.addColorStop(1, this.hexToRgba(color, 0));

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Hex 색상을 RGBA로 변환
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 전체 그래프 렌더링
     */
    render(fn, roots = []) {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 함수 저장
        this.currentFunction = fn;
        this.roots = roots;

        // 범위 자동 조정
        if (fn) {
            this.autoScale(fn);
        }

        // 그리기 순서
        this.drawGrid();
        this.drawAxes();

        if (fn) {
            this.drawFunction(fn);
        }

        if (roots.length > 0) {
            this.drawRoots(roots);
        }
    }

    /**
     * Glow 설정 업데이트
     */
    updateGlowSettings(enabled, intensity, color) {
        this.glowEnabled = enabled;
        this.glowIntensity = intensity;
        this.glowColor = color;

        // 다시 렌더링
        if (this.currentFunction) {
            this.render(this.currentFunction, this.roots);
        }
    }

    /**
     * 애니메이션 루프
     */
    startAnimation() {
        const animate = () => {
            if (this.glowEnabled && this.roots.length > 0) {
                this.render(this.currentFunction, this.roots);
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// 전역 객체로 노출
window.GraphRenderer = GraphRenderer;
