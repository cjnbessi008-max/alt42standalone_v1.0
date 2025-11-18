/**
 * Graph Visualization Module
 * 그래프 시각화 및 접선 표시
 */

class GraphVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.colorMapper = window.gradientColorMapper;

        // 그래프 설정
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -5;
        this.yMax = 5;

        // 현재 상태
        this.currentFunction = 'quadratic';
        this.currentX = 1;
        this.showTangent = true;
        this.animating = true;
        this.animationId = null;
        this.animationTime = 0;

        // 함수 정의
        this.functions = {
            quadratic: {
                f: (x) => x * x,
                derivative: (x) => 2 * x,
                label: 'y = x²'
            },
            cubic: {
                f: (x) => x * x * x - 2 * x,
                derivative: (x) => 3 * x * x - 2,
                label: 'y = x³ - 2x'
            },
            sine: {
                f: (x) => Math.sin(x),
                derivative: (x) => Math.cos(x),
                label: 'y = sin(x)'
            },
            exponential: {
                f: (x) => Math.exp(x / 2),
                derivative: (x) => 0.5 * Math.exp(x / 2),
                label: 'y = e^(x/2)'
            },
            custom: {
                f: (x) => x * x,
                derivative: (x) => 2 * x,
                label: 'Custom'
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.startAnimation();
    }

    setupEventListeners() {
        // 함수 선택
        document.getElementById('function-select').addEventListener('change', (e) => {
            this.currentFunction = e.target.value;
            if (e.target.value === 'custom') {
                document.getElementById('custom-function-group').style.display = 'flex';
            } else {
                document.getElementById('custom-function-group').style.display = 'none';
            }
            this.render();
        });

        // X 포인트 슬라이더
        const xSlider = document.getElementById('x-point');
        const xValue = document.getElementById('x-value');
        xSlider.addEventListener('input', (e) => {
            this.currentX = parseFloat(e.target.value);
            xValue.textContent = this.currentX.toFixed(1);
            this.render();
        });

        // 접선 표시 체크박스
        document.getElementById('show-tangent').addEventListener('change', (e) => {
            this.showTangent = e.target.checked;
            this.render();
        });

        // 애니메이션 체크박스
        document.getElementById('animate').addEventListener('change', (e) => {
            this.animating = e.target.checked;
            if (this.animating) {
                this.startAnimation();
            } else {
                this.stopAnimation();
            }
        });

        // Moodle 동기화 버튼
        document.getElementById('moodle-sync').addEventListener('click', () => {
            this.syncWithMoodle();
        });

        // 캔버스 클릭 이벤트
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const graphX = this.canvasToGraphX(canvasX);

            this.currentX = Math.max(this.xMin, Math.min(this.xMax, graphX));
            document.getElementById('x-point').value = this.currentX;
            document.getElementById('x-value').textContent = this.currentX.toFixed(1);
            this.render();
        });
    }

    startAnimation() {
        if (this.animationId) return;

        const animate = () => {
            if (!this.animating) return;

            this.animationTime += 0.02;
            this.currentX = Math.sin(this.animationTime) * 3;

            document.getElementById('x-point').value = this.currentX;
            document.getElementById('x-value').textContent = this.currentX.toFixed(1);

            this.render();
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    render() {
        this.clearCanvas();
        this.drawGrid();
        this.drawAxes();
        this.drawFunction();

        if (this.showTangent) {
            this.drawTangentLine();
            this.drawTangentPoint();
        }

        this.updateInfo();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // 수직선
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            const canvasX = this.graphToCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvas.height);
            this.ctx.stroke();
        }

        // 수평선
        for (let y = Math.ceil(this.yMin); y <= this.yMax; y++) {
            const canvasY = this.graphToCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvas.width, canvasY);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X축
        const y0 = this.graphToCanvasY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y0);
        this.ctx.lineTo(this.canvas.width, y0);
        this.ctx.stroke();

        // Y축
        const x0 = this.graphToCanvasX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, 0);
        this.ctx.lineTo(x0, this.canvas.height);
        this.ctx.stroke();

        // 축 라벨
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px sans-serif';

        // X축 숫자
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            if (x === 0) continue;
            const canvasX = this.graphToCanvasX(x);
            this.ctx.fillText(x.toString(), canvasX - 5, y0 + 15);
        }

        // Y축 숫자
        for (let y = Math.ceil(this.yMin); y <= this.yMax; y++) {
            if (y === 0) continue;
            const canvasY = this.graphToCanvasY(y);
            this.ctx.fillText(y.toString(), x0 + 5, canvasY + 5);
        }
    }

    drawFunction() {
        const func = this.functions[this.currentFunction];
        const step = (this.xMax - this.xMin) / 200;

        // 함수를 여러 세그먼트로 나누어 그리며, 각 세그먼트에 색상 적용
        for (let x = this.xMin; x < this.xMax; x += step) {
            const x1 = x;
            const x2 = x + step;
            const y1 = func.f(x1);
            const y2 = func.f(x2);

            // 중간점에서의 미분값으로 색상 결정
            const midX = (x1 + x2) / 2;
            const slope = func.derivative(midX);
            const color = this.colorMapper.getColor(slope);

            const canvasX1 = this.graphToCanvasX(x1);
            const canvasY1 = this.graphToCanvasY(y1);
            const canvasX2 = this.graphToCanvasX(x2);
            const canvasY2 = this.graphToCanvasY(y2);

            // Y 범위 체크
            if (Math.abs(y1) > 100 || Math.abs(y2) > 100) continue;

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX1, canvasY1);
            this.ctx.lineTo(canvasX2, canvasY2);
            this.ctx.stroke();
        }
    }

    drawTangentLine() {
        const func = this.functions[this.currentFunction];
        const x = this.currentX;
        const y = func.f(x);
        const slope = func.derivative(x);

        // 접선 색상
        const color = this.colorMapper.getColor(slope);

        // 접선 방정식: y - y0 = m(x - x0)
        // y = mx - mx0 + y0
        const b = y - slope * x;

        // 접선 그리기
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        const x1 = this.xMin;
        const y1 = slope * x1 + b;
        const x2 = this.xMax;
        const y2 = slope * x2 + b;

        this.ctx.moveTo(this.graphToCanvasX(x1), this.graphToCanvasY(y1));
        this.ctx.lineTo(this.graphToCanvasX(x2), this.graphToCanvasY(y2));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawTangentPoint() {
        const func = this.functions[this.currentFunction];
        const x = this.currentX;
        const y = func.f(x);
        const slope = func.derivative(x);

        const color = this.colorMapper.getColor(slope);

        const canvasX = this.graphToCanvasX(x);
        const canvasY = this.graphToCanvasY(y);

        // 외곽선
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // 내부 점
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    updateInfo() {
        const func = this.functions[this.currentFunction];
        const x = this.currentX;
        const y = func.f(x);
        const slope = func.derivative(x);
        const angle = this.colorMapper.slopeToAngle(slope);

        // 좌표 업데이트
        document.getElementById('point-coords').textContent =
            `(${x.toFixed(2)}, ${y.toFixed(2)})`;

        // 접선 방정식
        const b = y - slope * x;
        const equation = slope >= 0
            ? `y = ${slope.toFixed(2)}x + ${b.toFixed(2)}`
            : `y = ${slope.toFixed(2)}x ${b.toFixed(2)}`;
        document.getElementById('tangent-equation').textContent = equation;

        // 경사도 정보
        document.getElementById('slope-value').textContent = slope.toFixed(2);
        document.getElementById('angle-value').textContent = angle.toFixed(2);
    }

    graphToCanvasX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.canvas.width;
    }

    graphToCanvasY(y) {
        return this.canvas.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.canvas.height;
    }

    canvasToGraphX(canvasX) {
        return (canvasX / this.canvas.width) * (this.xMax - this.xMin) + this.xMin;
    }

    canvasToGraphY(canvasY) {
        return this.yMax - (canvasY / this.canvas.height) * (this.yMax - this.yMin);
    }

    async syncWithMoodle() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        // 로딩 상태
        statusText.textContent = '연결중...';
        statusDot.classList.remove('connected', 'error');

        try {
            const response = await fetch('/api/moodle-connector.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_problem'
                })
            });

            const data = await response.json();

            if (data.success) {
                statusText.textContent = 'Moodle 연결됨';
                statusDot.classList.add('connected');

                // Moodle에서 받은 문제 정보 적용
                if (data.problem) {
                    this.applyProblemData(data.problem);
                }
            } else {
                throw new Error(data.message || '연결 실패');
            }
        } catch (error) {
            console.error('Moodle sync error:', error);
            statusText.textContent = '연결 실패';
            statusDot.classList.add('error');

            // 개발 모드: 가짜 데이터 사용
            this.applyProblemData({
                function_type: 'quadratic',
                x_point: 2,
                show_tangent: true
            });
        }
    }

    applyProblemData(problem) {
        if (problem.function_type) {
            this.currentFunction = problem.function_type;
            document.getElementById('function-select').value = problem.function_type;
        }

        if (problem.x_point !== undefined) {
            this.currentX = problem.x_point;
            document.getElementById('x-point').value = problem.x_point;
            document.getElementById('x-value').textContent = problem.x_point.toFixed(1);
        }

        if (problem.show_tangent !== undefined) {
            this.showTangent = problem.show_tangent;
            document.getElementById('show-tangent').checked = problem.show_tangent;
        }

        this.render();
    }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    const visualizer = new GraphVisualizer('graph-canvas');
    window.graphVisualizer = visualizer;
});
