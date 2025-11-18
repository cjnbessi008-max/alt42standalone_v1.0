/**
 * Graph Chime - Graph Renderer
 * Canvas를 사용한 그래프 그리기
 */

class GraphRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 그래프 설정
        this.config = {
            gridSize: 40,
            axisColor: '#333',
            gridColor: '#DDD',
            lineColor: '#4A90E2',
            lineWidth: 3,
            pointColor: '#50C878',
            pointRadius: 6,
            margin: 20
        };

        // 좌표계 설정
        this.origin = {
            x: this.width / 2,
            y: this.height / 2
        };

        this.scale = this.config.gridSize; // 1단위 = gridSize 픽셀
    }

    /**
     * 캔버스 초기화
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 배경 그리드 그리기
     */
    drawGrid() {
        const { gridSize, gridColor } = this.config;

        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

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
     * 좌표축 그리기
     */
    drawAxes() {
        const { axisColor } = this.config;
        const { x: ox, y: oy } = this.origin;

        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(0, oy);
        this.ctx.lineTo(this.width, oy);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(ox, 0);
        this.ctx.lineTo(ox, this.height);
        this.ctx.stroke();

        // 축 레이블
        this.ctx.fillStyle = axisColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('x', this.width - 20, oy - 10);
        this.ctx.fillText('y', ox + 10, 20);
        this.ctx.fillText('O', ox + 5, oy + 15);

        // 눈금 표시
        this.drawTickMarks();
    }

    /**
     * 눈금 표시
     */
    drawTickMarks() {
        const { gridSize, axisColor } = this.config;
        const { x: ox, y: oy } = this.origin;

        this.ctx.fillStyle = axisColor;
        this.ctx.font = '11px Arial';

        // X축 눈금
        for (let i = 1; i <= 4; i++) {
            // 양수
            const xPos = ox + i * gridSize;
            this.ctx.fillText(i.toString(), xPos - 4, oy + 15);

            // 음수
            const xNeg = ox - i * gridSize;
            this.ctx.fillText('-' + i, xNeg - 8, oy + 15);
        }

        // Y축 눈금
        for (let i = 1; i <= 5; i++) {
            // 양수
            const yPos = oy - i * gridSize;
            this.ctx.fillText(i.toString(), ox + 5, yPos + 4);

            // 음수
            const yNeg = oy + i * gridSize;
            this.ctx.fillText('-' + i, ox + 5, yNeg + 4);
        }
    }

    /**
     * 일차함수 그래프 그리기
     * @param {number} slope - 기울기
     * @param {number} yIntercept - y절편
     */
    drawLinearFunction(slope, yIntercept) {
        const { lineColor, lineWidth } = this.config;

        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.setLineDash([]);

        this.ctx.beginPath();

        // 그래프 범위
        const xMin = -this.origin.x / this.scale;
        const xMax = (this.width - this.origin.x) / this.scale;

        // 시작점
        const x1 = xMin;
        const y1 = slope * x1 + yIntercept;
        const screenX1 = this.toScreenX(x1);
        const screenY1 = this.toScreenY(y1);
        this.ctx.moveTo(screenX1, screenY1);

        // 끝점
        const x2 = xMax;
        const y2 = slope * x2 + yIntercept;
        const screenX2 = this.toScreenX(x2);
        const screenY2 = this.toScreenY(y2);
        this.ctx.lineTo(screenX2, screenY2);

        this.ctx.stroke();
    }

    /**
     * 점 그리기
     * @param {number} x - x좌표
     * @param {number} y - y좌표
     * @param {string} label - 레이블
     * @param {string} color - 색상
     */
    drawPoint(x, y, label = '', color = null) {
        const pointColor = color || this.config.pointColor;
        const { pointRadius } = this.config;

        const screenX = this.toScreenX(x);
        const screenY = this.toScreenY(y);

        // 점 그리기
        this.ctx.fillStyle = pointColor;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, pointRadius, 0, 2 * Math.PI);
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 레이블
        if (label) {
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(label, screenX + 10, screenY - 10);
        }
    }

    /**
     * 절편 표시
     * @param {number} yIntercept - y절편
     * @param {number} xIntercept - x절편
     */
    highlightIntercepts(yIntercept, xIntercept) {
        // y절편 (0, b)
        if (yIntercept !== null) {
            this.drawPoint(0, yIntercept, `(0, ${yIntercept.toFixed(2)})`, '#FF6B6B');

            // 가이드 라인
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);

            const screenY = this.toScreenY(yIntercept);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.width, screenY);
            this.ctx.stroke();
        }

        // x절편 (a, 0)
        if (xIntercept !== null) {
            this.drawPoint(xIntercept, 0, `(${xIntercept.toFixed(2)}, 0)`, '#4ECDC4');

            // 가이드 라인
            this.ctx.strokeStyle = '#4ECDC4';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);

            const screenX = this.toScreenX(xIntercept);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.height);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    /**
     * 논리 좌표를 화면 좌표로 변환
     */
    toScreenX(x) {
        return this.origin.x + x * this.scale;
    }

    toScreenY(y) {
        return this.origin.y - y * this.scale; // Y축은 위가 양수
    }

    /**
     * 완전한 그래프 렌더링
     * @param {object} problem - 문제 데이터
     */
    render(problem) {
        this.clear();
        this.drawGrid();
        this.drawAxes();

        if (problem && problem.slope !== null && problem.y_intercept !== null) {
            this.drawLinearFunction(
                parseFloat(problem.slope),
                parseFloat(problem.y_intercept)
            );

            this.highlightIntercepts(
                parseFloat(problem.y_intercept),
                problem.x_intercept ? parseFloat(problem.x_intercept) : null
            );
        }
    }
}
