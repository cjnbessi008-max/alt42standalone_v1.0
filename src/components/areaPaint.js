/**
 * Area Paint 애니메이션 컴포넌트
 * 그래프 아래 영역을 색감 애니메이션으로 채우는 기능
 */

class AreaPaint {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.currentProgress = 0;
        this.targetProgress = 100;
        this.isAnimating = false;

        // 애니메이션 설정
        this.animationSpeed = 0.5; // 진행 속도
        this.colors = [
            { r: 102, g: 126, b: 234, a: 0.3 },  // #667eea
            { r: 118, g: 75, b: 162, a: 0.3 },   // #764ba2
            { r: 255, g: 107, b: 107, a: 0.3 },  // #ff6b6b
            { r: 78, g: 205, b: 196, a: 0.3 },   // #4ecdc4
        ];
        this.currentColorIndex = 0;
        this.colorTransition = 0;

        // 그래프 데이터
        this.graphData = null;
        this.calculatedArea = 0;
    }

    /**
     * 그래프 데이터 설정
     * @param {Object} data - { function: string, xMin: number, xMax: number, points: Array }
     */
    setGraphData(data) {
        this.graphData = data;
        this.calculatedArea = this.calculateArea();
        this.drawGraph();
    }

    /**
     * 그래프 그리기
     */
    drawGraph() {
        if (!this.graphData) return;

        const { points, xMin, xMax, yMin, yMax } = this.graphData;

        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 좌표계 설정
        const margin = 40;
        const width = this.canvas.width - 2 * margin;
        const height = this.canvas.height - 2 * margin;

        // 좌표 변환 함수
        const scaleX = (x) => margin + ((x - xMin) / (xMax - xMin)) * width;
        const scaleY = (y) => this.canvas.height - margin - ((y - yMin) / (yMax - yMin)) * height;

        // 축 그리기
        this.drawAxes(margin, scaleX, scaleY, xMin, xMax, yMin, yMax);

        // 그래프 선 그리기
        this.drawGraphLine(points, scaleX, scaleY);

        // 넓이 채우기 (애니메이션 진행률에 따라)
        if (this.currentProgress > 0) {
            this.fillArea(points, scaleX, scaleY);
        }
    }

    /**
     * 축 그리기
     */
    drawAxes(margin, scaleX, scaleY, xMin, xMax, yMin, yMax) {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(margin, scaleY(0));
        this.ctx.lineTo(this.canvas.width - margin, scaleY(0));
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(scaleX(0), margin);
        this.ctx.lineTo(scaleX(0), this.canvas.height - margin);
        this.ctx.stroke();

        // 눈금 표시
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';

        // X축 눈금
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            if (x !== 0) {
                const px = scaleX(x);
                this.ctx.fillText(x.toString(), px, scaleY(0) + 20);
            }
        }

        // Y축 눈금
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
            if (y !== 0) {
                const py = scaleY(y);
                this.ctx.fillText(y.toString(), scaleX(0) - 10, py + 4);
            }
        }
    }

    /**
     * 그래프 선 그리기
     */
    drawGraphLine(points, scaleX, scaleY) {
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        points.forEach((point, index) => {
            const x = scaleX(point.x);
            const y = scaleY(point.y);

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    /**
     * 넓이 채우기 (애니메이션)
     */
    fillArea(points, scaleX, scaleY) {
        const progress = this.currentProgress / 100;
        const endIndex = Math.floor(points.length * progress);

        if (endIndex < 2) return;

        // 그라디언트 색상 계산
        const color1 = this.colors[this.currentColorIndex];
        const nextColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        const color2 = this.colors[nextColorIndex];

        const r = Math.floor(color1.r + (color2.r - color1.r) * this.colorTransition);
        const g = Math.floor(color1.g + (color2.g - color1.g) * this.colorTransition);
        const b = Math.floor(color1.b + (color2.b - color1.b) * this.colorTransition);
        const a = color1.a + (color2.a - color1.a) * this.colorTransition;

        // 그라디언트 생성
        const gradient = this.ctx.createLinearGradient(
            scaleX(points[0].x),
            scaleY(points[0].y),
            scaleX(points[endIndex - 1].x),
            scaleY(0)
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        // 시작점 (X축에서 시작)
        this.ctx.moveTo(scaleX(points[0].x), scaleY(0));

        // 그래프 선을 따라 그리기
        for (let i = 0; i < endIndex; i++) {
            this.ctx.lineTo(scaleX(points[i].x), scaleY(points[i].y));
        }

        // 마지막 점에서 X축으로 내려오기
        this.ctx.lineTo(scaleX(points[endIndex - 1].x), scaleY(0));

        // 닫기
        this.ctx.closePath();
        this.ctx.fill();

        // 테두리 추가
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a + 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * 넓이 계산 (사다리꼴 공식 사용)
     */
    calculateArea() {
        if (!this.graphData || !this.graphData.points) return 0;

        const points = this.graphData.points;
        let area = 0;

        for (let i = 0; i < points.length - 1; i++) {
            const x1 = points[i].x;
            const y1 = Math.max(0, points[i].y); // 음수 영역 제외
            const x2 = points[i + 1].x;
            const y2 = Math.max(0, points[i + 1].y);

            // 사다리꼴 넓이
            const width = x2 - x1;
            const avgHeight = (y1 + y2) / 2;
            area += width * avgHeight;
        }

        return Math.abs(area);
    }

    /**
     * 애니메이션 시작
     */
    start() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.currentProgress = 0;
        this.animate();
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isAnimating) return;

        // 진행률 증가
        this.currentProgress += this.animationSpeed;

        // 색상 전환
        this.colorTransition += 0.01;
        if (this.colorTransition >= 1) {
            this.colorTransition = 0;
            this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        }

        // 진행률 업데이트
        const progressBar = document.getElementById('progress-fill');
        const areaValue = document.getElementById('area-value');

        if (progressBar) {
            progressBar.style.width = `${this.currentProgress}%`;
        }

        if (areaValue) {
            const currentArea = (this.calculatedArea * this.currentProgress / 100).toFixed(2);
            areaValue.textContent = `넓이: ${currentArea}`;
        }

        // 그래프 다시 그리기
        this.drawGraph();

        // 완료 체크
        if (this.currentProgress >= this.targetProgress) {
            this.isAnimating = false;
            this.currentProgress = this.targetProgress;
            if (areaValue) {
                areaValue.textContent = `넓이: ${this.calculatedArea.toFixed(2)}`;
            }
            return;
        }

        // 다음 프레임
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 애니메이션 정지
     */
    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.stop();
        this.currentProgress = 0;
        this.colorTransition = 0;
        this.currentColorIndex = 0;

        const progressBar = document.getElementById('progress-fill');
        const areaValue = document.getElementById('area-value');

        if (progressBar) {
            progressBar.style.width = '0%';
        }

        if (areaValue) {
            areaValue.textContent = '넓이: 0';
        }

        this.drawGraph();
    }

    /**
     * 계산된 넓이 반환
     */
    getCalculatedArea() {
        return this.calculatedArea;
    }
}

// 전역 인스턴스
window.AreaPaint = AreaPaint;
