/**
 * Change Wave - 함수 변화 시각화 엔진
 * 함수의 변화 패턴을 파동처럼 재생
 */

class ChangeWave {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Canvas 해상도 설정
        this.canvas.width = 300;
        this.canvas.height = 400;

        // 애니메이션 상태
        this.isPlaying = false;
        this.currentX = -5;
        this.speed = 1.0;
        this.animationId = null;

        // 함수 정의
        this.functionExpr = 'x * x';  // 기본: f(x) = x²
        this.functionName = 'f(x) = x²';
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -2;
        this.yMax = 25;

        // 파동 데이터 저장
        this.waveData = [];
        this.maxWaveLength = 100;

        // 색상 설정
        this.colors = {
            background: '#ffffff',
            grid: '#e9ecef',
            axis: '#495057',
            wave: '#667eea',
            waveTrail: 'rgba(102, 126, 234, 0.3)',
            point: '#f03e3e',
            derivative: '#20c997'
        };

        this.init();
    }

    init() {
        this.drawInitialState();
    }

    // 함수 평가
    evaluateFunction(x) {
        try {
            // 안전한 함수 평가 (Math 함수 지원)
            const func = new Function('x', 'Math', `
                with (Math) {
                    return ${this.functionExpr};
                }
            `);
            return func(x, Math);
        } catch (error) {
            console.error('함수 평가 오류:', error);
            return 0;
        }
    }

    // 수치 미분 (변화율 계산)
    calculateDerivative(x) {
        const h = 0.001;
        const y1 = this.evaluateFunction(x - h);
        const y2 = this.evaluateFunction(x + h);
        return (y2 - y1) / (2 * h);
    }

    // 좌표 변환: 수학 좌표 -> Canvas 좌표
    toCanvasX(x) {
        const xRange = this.xMax - this.xMin;
        return ((x - this.xMin) / xRange) * this.canvas.width;
    }

    toCanvasY(y) {
        const yRange = this.yMax - this.yMin;
        return this.canvas.height - ((y - this.yMin) / yRange) * this.canvas.height;
    }

    // 초기 상태 그리기
    drawInitialState() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawAxes();
        this.drawFunctionCurve();
    }

    // 그리드 그리기
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;

        // 세로 그리드
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            const canvasX = this.toCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvas.height);
            this.ctx.stroke();
        }

        // 가로 그리드
        const yStep = (this.yMax - this.yMin) / 10;
        for (let y = this.yMin; y <= this.yMax; y += yStep) {
            const canvasY = this.toCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvas.width, canvasY);
            this.ctx.stroke();
        }
    }

    // 축 그리기
    drawAxes() {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;

        // X축
        const yZero = this.toCanvasY(0);
        if (yZero >= 0 && yZero <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(this.canvas.width, yZero);
            this.ctx.stroke();
        }

        // Y축
        const xZero = this.toCanvasX(0);
        if (xZero >= 0 && xZero <= this.canvas.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, this.canvas.height);
            this.ctx.stroke();
        }
    }

    // 함수 곡선 그리기 (반투명)
    drawFunctionCurve() {
        this.ctx.strokeStyle = this.colors.waveTrail;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();

        let firstPoint = true;
        for (let x = this.xMin; x <= this.xMax; x += 0.1) {
            const y = this.evaluateFunction(x);
            const canvasX = this.toCanvasX(x);
            const canvasY = this.toCanvasY(y);

            if (firstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }
        this.ctx.stroke();
    }

    // 파동 효과 그리기
    drawWave() {
        if (this.waveData.length < 2) return;

        // 파동 궤적
        this.ctx.strokeStyle = this.colors.wave;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let i = 0; i < this.waveData.length; i++) {
            const point = this.waveData[i];
            const canvasX = this.toCanvasX(point.x);
            const canvasY = this.toCanvasY(point.y);

            if (i === 0) {
                this.ctx.moveTo(canvasX, canvasY);
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }
        this.ctx.stroke();

        // 현재 포인트 (파동의 선두)
        if (this.waveData.length > 0) {
            const current = this.waveData[this.waveData.length - 1];
            const canvasX = this.toCanvasX(current.x);
            const canvasY = this.toCanvasY(current.y);

            // 포인트 원
            this.ctx.fillStyle = this.colors.point;
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // 포인트 외곽 링 (펄스 효과)
            this.ctx.strokeStyle = this.colors.point;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 10, 0, Math.PI * 2);
            this.ctx.stroke();

            // 변화율 표시 (접선)
            const derivative = current.derivative;
            const tangentLength = 30;
            const dx = tangentLength;
            const dy = derivative * tangentLength;

            this.ctx.strokeStyle = this.colors.derivative;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX - dx, canvasY + dy);
            this.ctx.lineTo(canvasX + dx, canvasY - dy);
            this.ctx.stroke();
        }
    }

    // 프레임 렌더링
    render() {
        this.drawInitialState();
        this.drawWave();
    }

    // 애니메이션 업데이트
    update() {
        if (!this.isPlaying) return;

        // x 값 증가
        this.currentX += 0.05 * this.speed;

        // 범위 초과시 리셋
        if (this.currentX > this.xMax) {
            this.currentX = this.xMin;
            this.waveData = [];
        }

        // 현재 점 계산
        const y = this.evaluateFunction(this.currentX);
        const derivative = this.calculateDerivative(this.currentX);

        // 파동 데이터에 추가
        this.waveData.push({
            x: this.currentX,
            y: y,
            derivative: derivative
        });

        // 최대 길이 제한
        if (this.waveData.length > this.maxWaveLength) {
            this.waveData.shift();
        }

        // UI 업데이트
        this.updateUI(this.currentX, y, derivative);

        // 렌더링
        this.render();

        // 다음 프레임
        this.animationId = requestAnimationFrame(() => this.update());
    }

    // UI 정보 업데이트
    updateUI(x, y, derivative) {
        document.getElementById('current-x').textContent = x.toFixed(2);
        document.getElementById('current-y').textContent = y.toFixed(2);
        document.getElementById('derivative').textContent = derivative.toFixed(2);
        document.getElementById('function-expr').textContent = this.functionName;
    }

    // 재생
    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.update();
    }

    // 일시정지
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    // 리셋
    reset() {
        this.pause();
        this.currentX = this.xMin;
        this.waveData = [];
        this.render();
        this.updateUI(0, 0, 0);
    }

    // 속도 설정
    setSpeed(speed) {
        this.speed = speed;
    }

    // 함수 설정
    setFunction(expr, name, xMin, xMax, yMin, yMax) {
        this.functionExpr = expr;
        this.functionName = name;
        this.xMin = xMin || this.xMin;
        this.xMax = xMax || this.xMax;
        this.yMin = yMin || this.yMin;
        this.yMax = yMax || this.yMax;
        this.reset();
    }
}

// 전역 Change Wave 인스턴스
let changeWave;

// 초기화 함수
function initChangeWave() {
    changeWave = new ChangeWave('waveCanvas');

    // 버튼 이벤트 연결
    document.getElementById('btn-play').addEventListener('click', () => {
        changeWave.play();
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
        changeWave.pause();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        changeWave.reset();
    });

    // 속도 조절
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');

    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        changeWave.setSpeed(speed);
        speedValue.textContent = speed.toFixed(1) + 'x';
    });
}

// Moodle에서 문제 정보 불러오기
async function loadProblemFromMoodle() {
    try {
        // URL 파라미터에서 문제 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problem') || 1;

        // API 호출
        const response = await fetch(`../api/get_problem.php?id=${problemId}`);

        if (!response.ok) {
            throw new Error('문제를 불러올 수 없습니다.');
        }

        const problem = await response.json();

        // UI 업데이트
        document.getElementById('problem-title').textContent = problem.title;
        document.getElementById('problem-description').textContent = problem.description;

        // 함수 설정
        if (problem.function_expr) {
            changeWave.setFunction(
                problem.function_expr,
                problem.function_name,
                problem.x_min,
                problem.x_max,
                problem.y_min,
                problem.y_max
            );
        }

    } catch (error) {
        console.error('Moodle 연동 오류:', error);

        // 기본 문제로 대체
        document.getElementById('problem-title').textContent = '이차함수의 변화 관찰하기';
        document.getElementById('problem-description').textContent =
            'f(x) = x² 함수의 변화를 관찰하세요. 재생 버튼을 눌러 파동을 시작하세요.';
    }
}

// 전역 함수로 노출
window.initChangeWave = initChangeWave;
window.loadProblemFromMoodle = loadProblemFromMoodle;
