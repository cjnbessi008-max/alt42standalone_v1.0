/**
 * Main Application Logic for Existence Color
 * UI 상호작용 및 시각화 담당
 */

class ExistenceColorApp {
    constructor() {
        this.currentEquationType = 'quadratic';
        this.currentResult = null;
        this.init();
    }

    /**
     * 앱 초기화
     */
    init() {
        this.setupEventListeners();
        this.loadInitialExample();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 방정식 타입 선택
        const typeRadios = document.querySelectorAll('input[name="eq-type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchEquationType(e.target.value);
            });
        });

        // 분석 버튼
        const analyzeBtn = document.getElementById('analyze-btn');
        analyzeBtn.addEventListener('click', () => {
            this.analyzeEquation();
        });

        // 예제 버튼들
        const exampleBtns = document.querySelectorAll('.example-btn');
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.loadExample(e.target);
            });
        });

        // Enter 키로 분석 실행
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeEquation();
                }
            });
        });
    }

    /**
     * 방정식 타입 전환
     * @param {string} type - 'quadratic' 또는 'cubic'
     */
    switchEquationType(type) {
        this.currentEquationType = type;

        const quadraticInputs = document.getElementById('quadratic-inputs');
        const cubicInputs = document.getElementById('cubic-inputs');

        if (type === 'quadratic') {
            quadraticInputs.classList.remove('hidden');
            cubicInputs.classList.add('hidden');
        } else {
            quadraticInputs.classList.add('hidden');
            cubicInputs.classList.remove('hidden');
        }
    }

    /**
     * 예제 로드
     * @param {HTMLElement} button - 클릭된 버튼
     */
    loadExample(button) {
        const type = button.dataset.type;
        const values = button.dataset.values.split(',').map(Number);

        this.switchEquationType(type);

        // 라디오 버튼 선택
        const radio = document.querySelector(`input[name="eq-type"][value="${type}"]`);
        if (radio) radio.checked = true;

        if (type === 'quadratic') {
            document.getElementById('coef-a').value = values[0];
            document.getElementById('coef-b').value = values[1];
            document.getElementById('coef-c').value = values[2];
        } else if (type === 'cubic') {
            document.getElementById('cubic-a').value = values[0];
            document.getElementById('cubic-b').value = values[1];
            document.getElementById('cubic-c').value = values[2];
            document.getElementById('cubic-d').value = values[3];
        }

        // 자동으로 분석 실행
        setTimeout(() => this.analyzeEquation(), 300);
    }

    /**
     * 초기 예제 로드
     */
    loadInitialExample() {
        document.getElementById('coef-a').value = 1;
        document.getElementById('coef-b').value = 0;
        document.getElementById('coef-c').value = -4;
        this.analyzeEquation();
    }

    /**
     * 방정식 분석 실행
     */
    analyzeEquation() {
        // 애니메이션 시작
        const colorCircle = document.getElementById('color-circle');
        colorCircle.classList.add('analyzing');

        // 계수 읽기
        let result;
        let coefficients;

        if (this.currentEquationType === 'quadratic') {
            const a = parseFloat(document.getElementById('coef-a').value) || 0;
            const b = parseFloat(document.getElementById('coef-b').value) || 0;
            const c = parseFloat(document.getElementById('coef-c').value) || 0;

            coefficients = { a, b, c };
            result = MathEngine.analyzeQuadratic(a, b, c);

        } else if (this.currentEquationType === 'cubic') {
            const a = parseFloat(document.getElementById('cubic-a').value) || 0;
            const b = parseFloat(document.getElementById('cubic-b').value) || 0;
            const c = parseFloat(document.getElementById('cubic-c').value) || 0;
            const d = parseFloat(document.getElementById('cubic-d').value) || 0;

            coefficients = { a, b, c, d };
            result = MathEngine.analyzeCubic(a, b, c, d);
        }

        this.currentResult = result;

        // 약간의 지연 후 결과 표시 (UX 향상)
        setTimeout(() => {
            colorCircle.classList.remove('analyzing');
            this.displayResult(result, coefficients);
        }, 500);
    }

    /**
     * 결과 표시
     * @param {Object} result - MathEngine의 분석 결과
     * @param {Object} coefficients - 방정식 계수
     */
    displayResult(result, coefficients) {
        // 방정식 표시
        this.updateEquationDisplay(result.type, coefficients);

        // Existence Color 표시
        this.updateExistenceColor(result);

        // 상세 결과 표시
        this.updateResultPanel(result);

        // 그래프 그리기
        this.drawGraph(result, coefficients);
    }

    /**
     * 방정식 디스플레이 업데이트
     * @param {string} type - 방정식 타입
     * @param {Object} coefficients - 계수
     */
    updateEquationDisplay(type, coefficients) {
        const equationLatex = document.getElementById('equation-latex');
        const latex = MathEngine.formatEquationLatex(type, coefficients);
        equationLatex.innerHTML = latex;

        // MathJax로 렌더링
        if (window.MathJax) {
            MathJax.typesetPromise([equationLatex]).catch((err) => {
                console.warn('MathJax rendering error:', err);
            });
        }
    }

    /**
     * Existence Color 업데이트
     * @param {Object} result - 분석 결과
     */
    updateExistenceColor(result) {
        const colorCircle = document.getElementById('color-circle');
        const colorDescription = document.getElementById('color-description');

        // 색상 적용
        colorCircle.style.background = result.color;

        // 설명 업데이트
        colorDescription.innerHTML = `
            <div style="font-size: 1.2em; margin-bottom: 5px;">
                <strong>${result.colorName}</strong>
            </div>
            <div>${result.description}</div>
        `;
    }

    /**
     * 결과 패널 업데이트
     * @param {Object} result - 분석 결과
     */
    updateResultPanel(result) {
        const resultPanel = document.getElementById('result-panel');
        const discriminantInfo = document.getElementById('discriminant-info');
        const rootsInfo = document.getElementById('roots-info');
        const rootsList = document.getElementById('roots-list');

        resultPanel.classList.remove('hidden');

        // 판별식 정보
        if (result.discriminant !== null && result.discriminant !== undefined) {
            discriminantInfo.innerHTML = `
                <strong>판별식:</strong> ${result.message}
            `;
        } else {
            discriminantInfo.innerHTML = '';
        }

        // 근의 개수 정보
        rootsInfo.innerHTML = `
            <strong>근의 개수:</strong> ${result.rootCount}개<br>
            <strong>근의 유형:</strong> ${result.description}
        `;

        // 근 목록
        let rootsHTML = '<strong>근:</strong><br>';
        result.roots.forEach((root, index) => {
            const formatted = MathEngine.formatRoot(root);
            rootsHTML += `<div class="root-item">x${index + 1} = ${formatted}</div>`;
        });
        rootsList.innerHTML = rootsHTML;
    }

    /**
     * 그래프 그리기
     * @param {Object} result - 분석 결과
     * @param {Object} coefficients - 계수
     */
    drawGraph(result, coefficients) {
        const graphContainer = document.getElementById('graph-container');
        const canvas = document.getElementById('graph-canvas');
        const ctx = canvas.getContext('2d');

        graphContainer.classList.remove('hidden');

        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 그래프 범위 계산
        const bounds = MathEngine.calculateGraphBounds(result.roots);
        const { xMin, xMax } = bounds;
        const padding = 30;
        const graphWidth = canvas.width - 2 * padding;
        const graphHeight = canvas.height - 2 * padding;

        // y 범위 계산
        const points = [];
        const step = (xMax - xMin) / 100;
        for (let x = xMin; x <= xMax; x += step) {
            const y = MathEngine.evaluatePolynomial(result.type, coefficients, x);
            points.push({ x, y });
        }

        const yValues = points.map(p => p.y);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const yRange = yMax - yMin;
        const yPadding = yRange * 0.1;

        // 좌표 변환 함수
        const toCanvasX = (x) => padding + ((x - xMin) / (xMax - xMin)) * graphWidth;
        const toCanvasY = (y) => canvas.height - padding - ((y - (yMin - yPadding)) / (yMax - yMin + 2 * yPadding)) * graphHeight;

        // 축 그리기
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // x축
        const yAxisPos = toCanvasY(0);
        ctx.beginPath();
        ctx.moveTo(padding, yAxisPos);
        ctx.lineTo(canvas.width - padding, yAxisPos);
        ctx.stroke();

        // y축
        const xAxisPos = toCanvasX(0);
        ctx.beginPath();
        ctx.moveTo(xAxisPos, padding);
        ctx.lineTo(xAxisPos, canvas.height - padding);
        ctx.stroke();

        // 그리드 그리기
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;

        // 수직 그리드
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            const canvasX = toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(canvasX, padding);
            ctx.lineTo(canvasX, canvas.height - padding);
            ctx.stroke();
        }

        // 수평 그리드
        const yStep = Math.ceil(yRange / 5);
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
            const canvasY = toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(padding, canvasY);
            ctx.lineTo(canvas.width - padding, canvasY);
            ctx.stroke();
        }

        // 함수 그래프 그리기
        ctx.strokeStyle = result.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        points.forEach((point, index) => {
            const canvasX = toCanvasX(point.x);
            const canvasY = toCanvasY(point.y);

            if (index === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        });

        ctx.stroke();

        // 실근 표시
        const realRoots = result.roots.filter(r => typeof r === 'number');
        realRoots.forEach(root => {
            const canvasX = toCanvasX(root);
            const canvasY = toCanvasY(0);

            // 근 위치에 점 그리기
            ctx.fillStyle = result.color;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
            ctx.fill();

            // 외곽선
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 축 레이블
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('x', canvas.width - padding + 15, yAxisPos);
        ctx.fillText('y', xAxisPos, padding - 10);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new ExistenceColorApp();
    console.log('Existence Color App initialized! 🎨');
});
