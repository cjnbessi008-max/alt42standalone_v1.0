/**
 * Solution Paint - Main Application Logic
 * 부등식 해를 수직선에 시각적으로 표현하는 캔버스 앱
 */

class SolutionPaintApp {
    constructor(config) {
        this.config = config;
        this.currentProblem = null;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'paint'; // 'paint' or 'erase'
        this.paintedRegions = []; // 칠해진 영역들
        this.startTime = null;
        this.timerInterval = null;
        this.attemptCount = 0;

        // 캔버스 설정
        this.canvasWidth = 315;
        this.canvasHeight = 280;
        this.numberLineY = 140; // 수직선 Y 좌표
        this.numberLineMargin = 40; // 양쪽 여백
    }

    /**
     * 앱 초기화
     */
    init() {
        console.log('Solution Paint App initialized');
        this.setupCanvas();
        this.setupEventListeners();
        this.loadProblem();
    }

    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.canvas = document.getElementById('paintCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        // 캔버스 크기 설정
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 도구 버튼
        document.getElementById('paintBtn').addEventListener('click', () => this.selectTool('paint'));
        document.getElementById('eraseBtn').addEventListener('click', () => this.selectTool('erase'));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());

        // 제출 버튼
        document.getElementById('submitBtn').addEventListener('click', () => this.submitAnswer());

        // 다음 문제 버튼
        document.getElementById('nextBtn').addEventListener('click', () => this.loadProblem());

        // 캔버스 마우스 이벤트
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // 캔버스 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    /**
     * 도구 선택
     */
    selectTool(tool) {
        this.currentTool = tool;

        // 버튼 활성화 상태 변경
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (tool === 'paint') {
            document.getElementById('paintBtn').classList.add('active');
        } else if (tool === 'erase') {
            document.getElementById('eraseBtn').classList.add('active');
        }
    }

    /**
     * 문제 로드
     */
    async loadProblem() {
        try {
            // UI 초기화
            this.hideResultModal();
            this.showLoading(true);
            this.hideMainUI();

            // API 호출
            const response = await fetch(this.config.apiUrl + 'get_problem.php');
            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.displayProblem();
                this.clearCanvas();
                this.showMainUI();
                this.startTimer();
                this.attemptCount++;
                document.getElementById('attemptCount').textContent = this.attemptCount;
            } else {
                alert('문제를 불러오는데 실패했습니다: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 문제 표시
     */
    displayProblem() {
        if (!this.currentProblem) return;

        // 문제 텍스트
        document.getElementById('problemText').textContent = this.currentProblem.text;

        // 난이도 표시
        const difficultyMap = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        document.getElementById('difficulty').textContent =
            difficultyMap[this.currentProblem.difficulty] || '보통';

        // 수직선 그리기
        this.drawNumberLine();
    }

    /**
     * 수직선 그리기
     */
    drawNumberLine() {
        if (!this.currentProblem) return;

        const ctx = this.ctx;
        const range = this.currentProblem.displayRange;
        const min = range.min;
        const max = range.max;
        const y = this.numberLineY;
        const startX = this.numberLineMargin;
        const endX = this.canvasWidth - this.numberLineMargin;
        const lineWidth = endX - startX;

        // 캔버스 클리어
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 배경 그리드 (옅은 선)
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const x = startX + (lineWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, this.canvasHeight - 20);
            ctx.stroke();
        }

        // 메인 수직선
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // 화살표 (양쪽 끝)
        this.drawArrow(ctx, endX, y, 10, 'right');
        this.drawArrow(ctx, startX, y, 10, 'left');

        // 눈금과 숫자 표시
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;

        const step = Math.max(1, Math.ceil((max - min) / 10));
        for (let num = min; num <= max; num += step) {
            const x = this.numberToX(num, min, max);

            // 눈금
            ctx.beginPath();
            ctx.moveTo(x, y - 8);
            ctx.lineTo(x, y + 8);
            ctx.stroke();

            // 숫자
            ctx.fillText(num.toString(), x, y + 25);
        }

        // 칠해진 영역 복원
        this.redrawPaintedRegions();
    }

    /**
     * 화살표 그리기
     */
    drawArrow(ctx, x, y, size, direction) {
        ctx.beginPath();
        if (direction === 'right') {
            ctx.moveTo(x, y);
            ctx.lineTo(x - size, y - size / 2);
            ctx.lineTo(x - size, y + size / 2);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y - size / 2);
            ctx.lineTo(x + size, y + size / 2);
        }
        ctx.closePath();
        ctx.fillStyle = '#333';
        ctx.fill();
    }

    /**
     * 숫자를 X 좌표로 변환
     */
    numberToX(num, min, max) {
        const startX = this.numberLineMargin;
        const endX = this.canvasWidth - this.numberLineMargin;
        const lineWidth = endX - startX;
        return startX + ((num - min) / (max - min)) * lineWidth;
    }

    /**
     * X 좌표를 숫자로 변환
     */
    xToNumber(x, min, max) {
        const startX = this.numberLineMargin;
        const endX = this.canvasWidth - this.numberLineMargin;
        const lineWidth = endX - startX;
        return min + ((x - startX) / lineWidth) * (max - min);
    }

    /**
     * 드로잉 시작
     */
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    /**
     * 드로잉 중
     */
    draw(e) {
        if (!this.isDrawing || !this.currentProblem) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 수직선 근처에서만 드로잉
        const lineY = this.numberLineY;
        if (Math.abs(y - lineY) > 40) return;

        const ctx = this.ctx;
        const range = this.currentProblem.displayRange;

        if (this.currentTool === 'paint') {
            // 칠하기
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.lineWidth = 20;

            // 수직선 위에 굵은 선 그리기
            ctx.beginPath();
            ctx.moveTo(x - 1, lineY);
            ctx.lineTo(x + 1, lineY);
            ctx.stroke();

            // 영역 기록
            const num = this.xToNumber(x, range.min, range.max);
            this.paintedRegions.push({
                number: num,
                x: x,
                tool: 'paint'
            });

        } else if (this.currentTool === 'erase') {
            // 지우기
            ctx.clearRect(x - 15, lineY - 15, 30, 30);

            // 영역 기록에서 제거
            this.paintedRegions = this.paintedRegions.filter(region => {
                return Math.abs(region.x - x) > 15;
            });

            // 수직선 다시 그리기
            this.drawNumberLine();
        }
    }

    /**
     * 드로잉 종료
     */
    stopDrawing() {
        this.isDrawing = false;
    }

    /**
     * 칠해진 영역 다시 그리기
     */
    redrawPaintedRegions() {
        const ctx = this.ctx;
        const lineY = this.numberLineY;

        ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
        ctx.lineWidth = 20;

        this.paintedRegions.forEach(region => {
            if (region.tool === 'paint') {
                ctx.beginPath();
                ctx.moveTo(region.x - 1, lineY);
                ctx.lineTo(region.x + 1, lineY);
                ctx.stroke();
            }
        });
    }

    /**
     * 캔버스 초기화
     */
    clearCanvas() {
        this.paintedRegions = [];
        if (this.currentProblem) {
            this.drawNumberLine();
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (!this.currentProblem || this.paintedRegions.length === 0) {
            alert('먼저 수직선에 답을 표시해주세요!');
            return;
        }

        try {
            // 칠해진 영역 분석
            const analysis = this.analyzePaintedRegions();

            // 시간 계산
            const timeSpent = this.getElapsedTime();

            // API 호출
            const requestData = {
                problem_id: this.currentProblem.id,
                student_id: this.config.studentId,
                student_name: this.config.studentName,
                painted_data: {
                    regions: this.paintedRegions,
                    analysis: analysis
                },
                answer_start: analysis.start,
                answer_end: analysis.end,
                time_spent: timeSpent
            };

            const response = await fetch(this.config.apiUrl + 'submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.showResult(data.grading, data.correct_solution);
                this.stopTimer();
            } else {
                alert('제출 중 오류가 발생했습니다: ' + data.error);
            }

        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    /**
     * 칠해진 영역 분석
     */
    analyzePaintedRegions() {
        if (this.paintedRegions.length === 0) {
            return { start: null, end: null };
        }

        const range = this.currentProblem.displayRange;
        const numbers = this.paintedRegions.map(r => r.number).sort((a, b) => a - b);

        // 연속된 영역 찾기
        const start = Math.min(...numbers);
        const end = Math.max(...numbers);

        return {
            start: parseFloat(start.toFixed(2)),
            end: parseFloat(end.toFixed(2)),
            count: this.paintedRegions.length
        };
    }

    /**
     * 결과 표시
     */
    showResult(grading, correctSolution) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const score = document.getElementById('resultScore');
        const feedback = document.getElementById('resultFeedback');

        // 모달 스타일 설정
        modal.className = 'result-modal show';
        if (grading.is_correct) {
            modal.classList.add('correct');
            title.textContent = '🎉 정답입니다!';
        } else {
            modal.classList.add('incorrect');
            title.textContent = '😅 틀렸습니다';
        }

        score.textContent = grading.score + '점';
        feedback.textContent = grading.feedback;

        // 정답 표시 (틀렸을 경우)
        if (!grading.is_correct) {
            let correctText = '\n\n정답: ';
            if (correctSolution.start !== null && correctSolution.end === null) {
                correctText += `x ${this.currentProblem.operator} ${correctSolution.start}`;
            } else if (correctSolution.start === null && correctSolution.end !== null) {
                correctText += `x ${this.currentProblem.operator} ${correctSolution.end}`;
            } else {
                correctText += `${correctSolution.start} ${this.currentProblem.operator} x ${this.currentProblem.operator} ${correctSolution.end}`;
            }
            feedback.textContent += correctText;
        }
    }

    /**
     * 결과 모달 숨기기
     */
    hideResultModal() {
        document.getElementById('resultModal').classList.remove('show');
    }

    /**
     * 타이머 시작
     */
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = this.getElapsedTime();
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * 타이머 정지
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * 경과 시간 계산 (초)
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * 로딩 표시
     */
    showLoading(show) {
        document.querySelector('.loading').style.display = show ? 'block' : 'none';
    }

    /**
     * 메인 UI 표시
     */
    showMainUI() {
        document.getElementById('statsBar').style.display = 'flex';
        document.getElementById('problemDisplay').style.display = 'block';
        document.getElementById('toolButtons').style.display = 'flex';
        document.getElementById('canvasContainer').style.display = 'block';
        document.getElementById('submitSection').style.display = 'block';
    }

    /**
     * 메인 UI 숨기기
     */
    hideMainUI() {
        document.getElementById('statsBar').style.display = 'none';
        document.getElementById('problemDisplay').style.display = 'none';
        document.getElementById('toolButtons').style.display = 'none';
        document.getElementById('canvasContainer').style.display = 'none';
        document.getElementById('submitSection').style.display = 'none';
    }
}
