/**
 * Operation Trail - 계산 과정 시각화 모듈
 * 계산 과정을 불꽃처럼 연결되는 애니메이션으로 표현합니다
 */

class OperationTrail {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.steps = [];
        this.currentStep = 0;
        this.isAnimating = false;
        this.nodes = [];
        this.sparkContainer = null;

        this.initSparkContainer();
        this.setupCanvas();
    }

    /**
     * Canvas 초기 설정
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        debugLog('Canvas 설정 완료:', rect.width, 'x', rect.height);
    }

    /**
     * 불꽃 파티클 컨테이너 초기화
     */
    initSparkContainer() {
        this.sparkContainer = document.createElement('div');
        this.sparkContainer.id = 'spark-container';
        this.canvas.parentElement.appendChild(this.sparkContainer);
    }

    /**
     * Operation Trail 시작
     */
    async start(steps) {
        if (this.isAnimating) {
            debugLog('이미 애니메이션 진행 중');
            return;
        }

        this.steps = steps;
        this.currentStep = 0;
        this.isAnimating = true;
        this.nodes = [];

        // Canvas 초기화
        this.clear();

        debugLog('Operation Trail 시작:', steps.length, '단계');

        // 단계별로 애니메이션 실행
        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            await this.animateStep(this.steps[i], i);
            await this.delay(this.config.stepDelay);
        }

        // 최종 결과 표시
        await this.showFinalResult();

        this.isAnimating = false;
        debugLog('Operation Trail 완료');
    }

    /**
     * 단계별 애니메이션
     */
    async animateStep(step, index) {
        const stepElement = this.createStepElement(step, index);
        const stepsContainer = document.getElementById('trail-steps');
        stepsContainer.appendChild(stepElement);

        // Canvas에 노드 그리기
        const node = this.createNode(step, index);
        this.nodes.push(node);

        // 이전 노드와 연결선 그리기
        if (index > 0) {
            await this.drawConnection(this.nodes[index - 1], node);
        }

        // 노드 그리기
        this.drawNode(node);

        // 불꽃 효과
        this.createSparks(node.x, node.y);

        // 스텝 하이라이트
        stepElement.classList.add('active');

        // 스크롤 자동 이동
        stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * HTML 단계 요소 생성
     */
    createStepElement(step, index) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'trail-step';
        stepDiv.style.animationDelay = `${index * 0.1}s`;

        stepDiv.innerHTML = `
            <div class="trail-step-number">${index + 1}</div>
            <div class="trail-step-operation">${step.operation}</div>
            <div class="trail-step-expression">${step.expression}</div>
            <div class="trail-step-result">= ${step.result}</div>
        `;

        return stepDiv;
    }

    /**
     * Canvas 노드 생성
     */
    createNode(step, index) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = canvasRect.width / 2;
        const startY = 80;
        const spacing = 120;

        return {
            x: centerX,
            y: startY + (index * spacing),
            radius: this.config.nodeRadius,
            step: step,
            index: index,
            color: this.getOperationColor(step.operation)
        };
    }

    /**
     * 연산 종류에 따른 색상 반환
     */
    getOperationColor(operation) {
        const colorMap = {
            '덧셈': '#10b981',
            '뺄셈': '#ef4444',
            '곱셈': '#8b5cf6',
            '나눗셈': '#f59e0b',
            '괄호 안 덧셈': '#06b6d4',
            '괄호 안 뺄셈': '#f43f5e'
        };

        for (const [key, color] of Object.entries(colorMap)) {
            if (operation.includes(key)) {
                return color;
            }
        }

        return '#3b82f6';
    }

    /**
     * 노드 그리기
     */
    drawNode(node) {
        // 그림자
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 5;

        // 외곽 원
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = node.color;
        this.ctx.fill();

        // 그림자 제거
        this.ctx.shadowColor = 'transparent';

        // 내부 원 (흰색)
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius - 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = node.color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 텍스트
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${node.step.result}`, node.x, node.y);
    }

    /**
     * 노드 간 연결선 그리기 (애니메이션)
     */
    async drawConnection(fromNode, toNode) {
        const steps = 20;
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = fromNode.x + dx * t;
            const y = fromNode.y + dy * t;

            // 그라디언트 선
            const gradient = this.ctx.createLinearGradient(
                fromNode.x, fromNode.y,
                toNode.x, toNode.y
            );
            gradient.addColorStop(0, fromNode.color);
            gradient.addColorStop(1, toNode.color);

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y + fromNode.radius);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();

            await this.delay(20);
        }
    }

    /**
     * 불꽃 효과 생성
     */
    createSparks(x, y) {
        const sparkCount = this.config.sparkCount;

        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount;
            const distance = 40 + Math.random() * 40;
            const spark = document.createElement('div');

            spark.className = 'spark';
            spark.style.left = x + 'px';
            spark.style.top = y + 'px';
            spark.style.background = this.config.sparkColors[
                Math.floor(Math.random() * this.config.sparkColors.length)
            ];

            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            spark.style.setProperty('--tx', tx + 'px');
            spark.style.setProperty('--ty', ty + 'px');

            this.sparkContainer.appendChild(spark);

            // 애니메이션 완료 후 제거
            setTimeout(() => {
                spark.remove();
            }, this.config.sparkDuration);
        }
    }

    /**
     * 최종 결과 표시
     */
    async showFinalResult() {
        const stepsContainer = document.getElementById('trail-steps');
        const finalStep = this.steps[this.steps.length - 1];

        const resultDiv = document.createElement('div');
        resultDiv.className = 'final-result';
        resultDiv.innerHTML = `
            <div class="final-result-label">최종 답</div>
            <div class="final-result-value">${finalStep.result}</div>
        `;

        stepsContainer.appendChild(resultDiv);

        // 대규모 불꽃 효과
        const lastNode = this.nodes[this.nodes.length - 1];
        this.createMassiveSparks(lastNode.x, lastNode.y);
    }

    /**
     * 대규모 불꽃 효과
     */
    createMassiveSparks(x, y) {
        for (let i = 0; i < this.config.sparkCount * 3; i++) {
            setTimeout(() => {
                this.createSparks(x, y);
            }, i * 50);
        }
    }

    /**
     * Canvas 초기화
     */
    clear() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);

        // HTML 단계 초기화
        const stepsContainer = document.getElementById('trail-steps');
        if (stepsContainer) {
            stepsContainer.innerHTML = '';
        }

        // 불꽃 초기화
        if (this.sparkContainer) {
            this.sparkContainer.innerHTML = '';
        }

        this.nodes = [];
        this.currentStep = 0;
    }

    /**
     * 지연 함수
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 진행률 계산
     */
    getProgress() {
        if (this.steps.length === 0) return 0;
        return (this.currentStep / this.steps.length) * 100;
    }

    /**
     * 애니메이션 중지
     */
    stop() {
        this.isAnimating = false;
        debugLog('Operation Trail 중지');
    }

    /**
     * 리셋
     */
    reset() {
        this.stop();
        this.clear();
        this.steps = [];
        this.currentStep = 0;
        debugLog('Operation Trail 리셋');
    }
}

// 전역 Operation Trail 인스턴스
let operationTrail = null;

/**
 * Operation Trail 초기화
 */
function initOperationTrail() {
    operationTrail = new OperationTrail(
        'operation-trail-canvas',
        CONFIG.operationTrail
    );
    debugLog('Operation Trail 초기화 완료');
    return operationTrail;
}
