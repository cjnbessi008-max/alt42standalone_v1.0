/**
 * Area Completion Detector
 * 넓이 그리기 완성 감지 로직
 */

class AreaDetector {
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.questionData = options.questionData || {};
        this.responseId = options.responseId;
        this.onComplete = options.onComplete || (() => {});
        this.completionThreshold = options.completionThreshold || 95; // 95% 이상이면 완성

        this.currentProgress = 0;
        this.isCompleted = false;
        this.shapePoints = [];
        this.targetArea = 0;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not provided');
            return;
        }

        // 목표 넓이 계산
        this.calculateTargetArea();

        // 캔버스 이벤트 리스너
        this.setupEventListeners();
    }

    /**
     * 목표 넓이 계산
     */
    calculateTargetArea() {
        const shape = this.questionData.shape;
        const data = this.questionData;

        switch (shape) {
            case 'rectangle':
                this.targetArea = data.width * data.height;
                break;
            case 'triangle':
                this.targetArea = (data.base * data.height) / 2;
                break;
            case 'circle':
                this.targetArea = Math.PI * data.radius * data.radius;
                break;
            default:
                this.targetArea = 0;
        }

        console.log('Target area:', this.targetArea);
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        let isDrawing = false;

        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            this.addPoint(e.offsetX, e.offsetY);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                this.addPoint(e.offsetX, e.offsetY);
                this.drawShape();
                this.checkCompletion();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            this.finalizeShape();
        });

        // 터치 이벤트 (모바일 지원)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.addPoint(touch.clientX - rect.left, touch.clientY - rect.top);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.addPoint(touch.clientX - rect.left, touch.clientY - rect.top);
                this.drawShape();
                this.checkCompletion();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            isDrawing = false;
            this.finalizeShape();
        });
    }

    /**
     * 점 추가
     */
    addPoint(x, y) {
        this.shapePoints.push({ x, y });
    }

    /**
     * 도형 그리기
     */
    drawShape() {
        if (this.shapePoints.length < 2) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.moveTo(this.shapePoints[0].x, this.shapePoints[0].y);

        for (let i = 1; i < this.shapePoints.length; i++) {
            this.ctx.lineTo(this.shapePoints[i].x, this.shapePoints[i].y);
        }

        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 도형이 닫혔으면 채우기
        if (this.isShapeClosed()) {
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
            this.ctx.fill();
        }
    }

    /**
     * 도형이 닫혔는지 확인
     */
    isShapeClosed() {
        if (this.shapePoints.length < 3) return false;

        const first = this.shapePoints[0];
        const last = this.shapePoints[this.shapePoints.length - 1];

        const distance = Math.sqrt(
            Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
        );

        return distance < 20; // 20px 이내면 닫힌 것으로 간주
    }

    /**
     * 현재 그린 도형의 넓이 계산 (Shoelace formula)
     */
    calculateCurrentArea() {
        if (this.shapePoints.length < 3) return 0;

        let area = 0;
        const points = this.shapePoints;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }

        return Math.abs(area / 2);
    }

    /**
     * 완성도 확인
     */
    checkCompletion() {
        if (this.isCompleted) return;

        const currentArea = this.calculateCurrentArea();
        const percentage = (currentArea / this.targetArea) * 100;

        this.currentProgress = Math.min(100, percentage);

        // 진행 상황 업데이트
        this.updateProgress();

        // 완성도가 임계값 이상이면 완성 처리
        if (this.currentProgress >= this.completionThreshold && !this.isCompleted) {
            this.completeArea();
        }
    }

    /**
     * 도형 완성 처리
     */
    finalizeShape() {
        if (this.isShapeClosed() && !this.isCompleted) {
            this.checkCompletion();
        }
    }

    /**
     * 넓이 완성
     */
    completeArea() {
        this.isCompleted = true;

        console.log('✅ Area completed!');

        // 완성 효과
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
        this.ctx.fill();

        // 완성 콜백 호출
        this.onComplete({
            area: this.calculateCurrentArea(),
            targetArea: this.targetArea,
            percentage: this.currentProgress
        });

        // 서버에 완성 알림
        this.notifyCompletion();

        // 종소리 재생
        if (window.areaChime) {
            setTimeout(() => {
                window.areaChime.play();
            }, 300); // 0.3초 후 재생
        }
    }

    /**
     * 진행 상황 서버에 업데이트
     */
    async updateProgress() {
        if (!this.responseId) return;

        try {
            await fetch('/src/api/responses.php?action=update_progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    response_id: this.responseId,
                    shape_type: this.questionData.shape,
                    progress_data: {
                        points: this.shapePoints.length,
                        current_area: this.calculateCurrentArea()
                    },
                    completion_percentage: this.currentProgress
                })
            });
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    }

    /**
     * 완성 서버에 알림
     */
    async notifyCompletion() {
        if (!this.responseId) return;

        try {
            const response = await fetch('/src/api/responses.php?action=complete_area', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    response_id: this.responseId
                })
            });

            const result = await response.json();
            console.log('Area completion notified:', result);
        } catch (err) {
            console.error('Failed to notify completion:', err);
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.shapePoints = [];
        this.currentProgress = 0;
        this.isCompleted = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 진행률 가져오기
     */
    getProgress() {
        return this.currentProgress;
    }
}
