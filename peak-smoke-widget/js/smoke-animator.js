/**
 * Smoke Animator - 극값에서 연기가 피어오르는 효과
 * Canvas 기반 파티클 시스템
 */

class SmokeAnimator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas 요소를 찾을 수 없습니다:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.peaks = [];
        this.graphData = [];
        this.animationId = null;
        this.isAnimating = false;

        // 캔버스 크기 설정
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 좌표 변환 설정
        this.padding = 40;
        this.xRange = { min: -10, max: 10 };
        this.yRange = { min: -10, max: 10 };
    }

    /**
     * 캔버스 크기 조정
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    /**
     * 좌표 변환 설정
     * @param {number} minX - X 최소값
     * @param {number} maxX - X 최대값
     * @param {number} minY - Y 최소값
     * @param {number} maxY - Y 최대값
     */
    setCoordinateSystem(minX, maxX, minY, maxY) {
        this.xRange = { min: minX, max: maxX };
        this.yRange = { min: minY, max: maxY };
    }

    /**
     * 수학 좌표를 캔버스 좌표로 변환
     * @param {number} x - 수학 x 좌표
     * @param {number} y - 수학 y 좌표
     * @returns {object} {x, y} 캔버스 좌표
     */
    mathToCanvas(x, y) {
        const canvasX = this.padding +
            ((x - this.xRange.min) / (this.xRange.max - this.xRange.min)) *
            (this.width - 2 * this.padding);

        const canvasY = this.height - this.padding -
            ((y - this.yRange.min) / (this.yRange.max - this.yRange.min)) *
            (this.height - 2 * this.padding);

        return { x: canvasX, y: canvasY };
    }

    /**
     * 그래프 그리기
     * @param {Array} graphData - [{x, y}] 배열
     * @param {string} color - 선 색상
     * @param {number} lineWidth - 선 두께
     */
    drawGraph(graphData, color = '#2c3e50', lineWidth = 2) {
        if (!graphData || graphData.length === 0) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();

        graphData.forEach((point, index) => {
            const canvasPoint = this.mathToCanvas(point.x, point.y);

            if (index === 0) {
                this.ctx.moveTo(canvasPoint.x, canvasPoint.y);
            } else {
                this.ctx.lineTo(canvasPoint.x, canvasPoint.y);
            }
        });

        this.ctx.stroke();
    }

    /**
     * 축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.lineWidth = 1;

        // X축
        const xAxis = this.mathToCanvas(0, 0);
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, xAxis.y);
        this.ctx.lineTo(this.width - this.padding, xAxis.y);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(xAxis.x, this.padding);
        this.ctx.lineTo(xAxis.x, this.height - this.padding);
        this.ctx.stroke();

        // 화살표
        this.drawArrow(this.width - this.padding, xAxis.y, 5);
        this.drawArrow(xAxis.x, this.padding, 5, true);

        // 레이블
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('x', this.width - this.padding + 10, xAxis.y + 5);
        this.ctx.fillText('y', xAxis.x + 5, this.padding - 10);
    }

    /**
     * 화살표 그리기
     */
    drawArrow(x, y, size, vertical = false) {
        this.ctx.beginPath();
        if (vertical) {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - size, y + size);
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + size, y + size);
        } else {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - size, y - size);
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - size, y + size);
        }
        this.ctx.stroke();
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(149, 165, 166, 0.2)';
        this.ctx.lineWidth = 1;

        const xStep = (this.xRange.max - this.xRange.min) / 10;
        const yStep = (this.yRange.max - this.yRange.min) / 10;

        // 수직선
        for (let x = this.xRange.min; x <= this.xRange.max; x += xStep) {
            const start = this.mathToCanvas(x, this.yRange.min);
            const end = this.mathToCanvas(x, this.yRange.max);
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }

        // 수평선
        for (let y = this.yRange.min; y <= this.yRange.max; y += yStep) {
            const start = this.mathToCanvas(this.xRange.min, y);
            const end = this.mathToCanvas(this.xRange.max, y);
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
    }

    /**
     * 극값 마커 그리기
     * @param {Array} peaks - 극값 배열
     */
    drawPeaks(peaks) {
        peaks.forEach(peak => {
            const pos = this.mathToCanvas(peak.x, peak.y);
            const color = peak.type === 'maximum' ? '#ff6b6b' : '#4ecdc4';

            // 원 그리기
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // 테두리
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 펄스 효과용 큰 원
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;

            // 라벨
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(pos.x - 40, pos.y - 35, 80, 20);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `(${peak.x.toFixed(2)}, ${peak.y.toFixed(2)})`,
                pos.x,
                pos.y - 21
            );
        });
    }

    /**
     * 연기 파티클 생성
     * @param {number} x - x 좌표 (캔버스)
     * @param {number} y - y 좌표 (캔버스)
     * @param {string} type - 'maximum' 또는 'minimum'
     */
    createSmokeParticle(x, y, type) {
        const color = type === 'maximum'
            ? { r: 255, g: 107, b: 107 }
            : { r: 78, g: 205, b: 196 };

        const particle = {
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 1,
            size: 5 + Math.random() * 10,
            alpha: 0.8,
            color: color,
            life: 1.0,
            type: type
        };

        this.particles.push(particle);
    }

    /**
     * 연기 파티클 업데이트 및 그리기
     */
    updateAndDrawParticles() {
        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.01;
            particle.alpha = particle.life * 0.8;
            particle.size += 0.2;

            // 생명이 다한 파티클 제거
            return particle.life > 0;
        });

        // 파티클 그리기
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;

            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );

            gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`);
            gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.4)`);
            gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    /**
     * 극값에서 연기 생성
     */
    emitSmokeFromPeaks() {
        this.peaks.forEach(peak => {
            const pos = this.mathToCanvas(peak.x, peak.y);

            // 프레임당 1-2개의 파티클 생성
            if (Math.random() > 0.5) {
                this.createSmokeParticle(pos.x, pos.y, peak.type);
            }
        });
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        // 캔버스 클리어
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 그리드
        this.drawGrid();

        // 축
        this.drawAxes();

        // 그래프
        this.drawGraph(this.graphData, '#3498db', 3);

        // 연기 파티클
        this.updateAndDrawParticles();

        // 극값 마커
        this.drawPeaks(this.peaks);

        // 극값에서 연기 생성
        this.emitSmokeFromPeaks();

        // 애니메이션 계속
        if (this.isAnimating) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    /**
     * 시각화 시작
     * @param {Array} graphData - 그래프 데이터
     * @param {Array} peaks - 극값 배열
     */
    start(graphData, peaks) {
        this.graphData = graphData;
        this.peaks = peaks;
        this.particles = [];

        // Y 범위 자동 계산
        if (graphData && graphData.length > 0) {
            const yValues = graphData.map(p => p.y);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            const padding = (maxY - minY) * 0.2;

            this.setCoordinateSystem(
                this.xRange.min,
                this.xRange.max,
                minY - padding,
                maxY + padding
            );
        }

        this.isAnimating = true;
        this.animate();
    }

    /**
     * 애니메이션 중지
     */
    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * 클리어
     */
    clear() {
        this.stop();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.particles = [];
        this.peaks = [];
        this.graphData = [];
    }
}

// 전역 인스턴스
window.smokeAnimator = null;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.smokeAnimator = new SmokeAnimator('graphCanvas');
});
