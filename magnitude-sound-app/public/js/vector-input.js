/**
 * Magnitude Sound - 벡터 입력 인터페이스
 * 캔버스에서 벡터를 그리고 크기/방향 계산
 */

class VectorInput {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 캔버스 중심점
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;

        // 벡터 상태
        this.vector = { x: 0, y: 0 };
        this.isDrawing = false;
        this.startPoint = null;
        this.endPoint = null;

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 초기 그리드 그리기
        this.drawGrid();
        this.drawAxes();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleEnd(e));

        // 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        });
    }

    /**
     * 캔버스 좌표 가져오기
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * 그리기 시작
     */
    handleStart(event) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(event);
        this.startPoint = coords;

        // 힌트 숨기기
        const hint = document.querySelector('.canvas-hint');
        if (hint) hint.style.display = 'none';
    }

    /**
     * 그리기 중
     */
    handleMove(event) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(event);
        this.endPoint = coords;

        // 벡터 계산 (캔버스 좌표 -> 수학 좌표계)
        this.vector = this.calculateVector(this.startPoint, this.endPoint);

        // 다시 그리기
        this.redraw();
    }

    /**
     * 그리기 종료
     */
    handleEnd(event) {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        // 최종 벡터 계산
        if (this.endPoint) {
            this.vector = this.calculateVector(this.startPoint, this.endPoint);
            this.updateUI();

            // 커스텀 이벤트 발생
            const vectorChangeEvent = new CustomEvent('vectorChange', {
                detail: this.vector
            });
            this.canvas.dispatchEvent(vectorChangeEvent);
        }
    }

    /**
     * 벡터 계산 (캔버스 좌표계 -> 수학 좌표계)
     */
    calculateVector(start, end) {
        // 캔버스 좌표계: 원점 좌상단, Y축 아래 방향
        // 수학 좌표계: 원점 중앙, Y축 위 방향

        const dx = end.x - this.centerX;
        const dy = this.centerY - end.y; // Y축 반전

        // 정규화 (픽셀 -> 논리 단위, 30픽셀 = 1단위)
        const scale = 30;
        const x = dx / scale;
        const y = dy / scale;

        // 크기 계산
        const magnitude = Math.sqrt(x * x + y * y);

        // 방향 계산 (라디안 -> 도)
        let direction = Math.atan2(y, x) * (180 / Math.PI);

        // 0-360도로 정규화
        if (direction < 0) {
            direction += 360;
        }

        return {
            x: parseFloat(x.toFixed(4)),
            y: parseFloat(y.toFixed(4)),
            magnitude: parseFloat(magnitude.toFixed(4)),
            direction: parseFloat(direction.toFixed(2))
        };
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        const magnitudeEl = document.getElementById('magnitude-value');
        const directionEl = document.getElementById('direction-value');
        const coordinatesEl = document.getElementById('coordinates-value');

        if (magnitudeEl) {
            magnitudeEl.textContent = this.vector.magnitude.toFixed(2);
        }

        if (directionEl) {
            directionEl.textContent = `${this.vector.direction.toFixed(1)}°`;
        }

        if (coordinatesEl) {
            coordinatesEl.textContent = `(${this.vector.x.toFixed(2)}, ${this.vector.y.toFixed(2)})`;
        }
    }

    /**
     * 캔버스 다시 그리기
     */
    redraw() {
        // 캔버스 지우기
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드와 축 그리기
        this.drawGrid();
        this.drawAxes();

        // 벡터 그리기
        if (this.startPoint && this.endPoint) {
            this.drawVector(this.centerX, this.centerY, this.endPoint.x, this.endPoint.y);
        }

        // 각도 표시
        if (this.vector.magnitude > 0) {
            this.drawAngleArc();
        }
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = '#f1f5f9';
        this.ctx.lineWidth = 1;

        const gridSize = 30; // 30픽셀 = 1단위

        // 세로선
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 가로선
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 좌표축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.canvas.width, this.centerY);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.canvas.height);
        this.ctx.stroke();

        // 원점 표시
        this.ctx.fillStyle = '#64748b';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 4, 0, 2 * Math.PI);
        this.ctx.fill();

        // 축 레이블
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('X', this.canvas.width - 20, this.centerY - 10);
        this.ctx.fillText('Y', this.centerX + 10, 15);
        this.ctx.fillText('O', this.centerX + 10, this.centerY - 10);
    }

    /**
     * 벡터 그리기
     */
    drawVector(x1, y1, x2, y2) {
        // 벡터 선
        this.ctx.strokeStyle = '#6366f1';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // 화살표 그리기
        this.drawArrowHead(x1, y1, x2, y2);

        // 끝점 표시
        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * 화살표 머리 그리기
     */
    drawArrowHead(x1, y1, x2, y2) {
        const headLength = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        this.ctx.fillStyle = '#6366f1';
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 각도 호 그리기
     */
    drawAngleArc() {
        const radius = 40;

        // 수학 좌표계의 각도 (X축 기준, 반시계방향)
        const angleRad = this.vector.direction * (Math.PI / 180);

        this.ctx.strokeStyle = '#ec4899';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius, 0, -angleRad, true);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // 각도 텍스트
        this.ctx.fillStyle = '#ec4899';
        this.ctx.font = 'bold 14px sans-serif';
        const textX = this.centerX + radius * Math.cos(-angleRad / 2) + 10;
        const textY = this.centerY - radius * Math.sin(-angleRad / 2);
        this.ctx.fillText(`${this.vector.direction.toFixed(1)}°`, textX, textY);
    }

    /**
     * 초기화
     */
    reset() {
        this.vector = { x: 0, y: 0, magnitude: 0, direction: 0 };
        this.startPoint = null;
        this.endPoint = null;
        this.isDrawing = false;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawAxes();

        this.updateUI();

        // 힌트 다시 표시
        const hint = document.querySelector('.canvas-hint');
        if (hint) hint.style.display = 'block';
    }

    /**
     * 현재 벡터 가져오기
     */
    getVector() {
        return this.vector;
    }
}

// 전역 변수로 내보내기
window.VectorInput = VectorInput;
