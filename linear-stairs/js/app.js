/**
 * Linear Stairs - 등차수열 계단 시각화 앱
 * 등차수열을 계단 형태로 시각화하는 독립형 웹 애플리케이션
 */

class LinearStairs {
    constructor() {
        this.firstTerm = 1;
        this.commonDiff = 2;
        this.termCount = 5;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.currentAnimationStep = 0;

        this.init();
    }

    /**
     * 앱 초기화
     */
    init() {
        // Canvas 설정
        this.canvas = document.getElementById('stairs-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // 이벤트 리스너 등록
        this.attachEventListeners();

        // Moodle에서 전달된 파라미터 확인
        this.loadFromMoodle();

        // 초기 시각화
        this.updateVisualization();

        // 윈도우 리사이즈 처리
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Canvas 크기 조정
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 고해상도 디스플레이 지원
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = 250 * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = '250px';

        this.ctx.scale(dpr, dpr);

        // 리사이즈 후 다시 그리기
        if (this.firstTerm !== null) {
            this.drawStairs(false);
        }
    }

    /**
     * 이벤트 리스너 등록
     */
    attachEventListeners() {
        const btnUpdate = document.getElementById('btn-update');
        const btnAnimate = document.getElementById('btn-animate');

        btnUpdate.addEventListener('click', () => this.updateVisualization());
        btnAnimate.addEventListener('click', () => this.animateStairs());

        // 엔터키로 업데이트
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.updateVisualization();
                }
            });
        });
    }

    /**
     * Moodle URL 파라미터에서 데이터 로드
     */
    loadFromMoodle() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('a1')) {
            this.firstTerm = parseInt(urlParams.get('a1'));
            document.getElementById('input-first-term').value = this.firstTerm;
        }

        if (urlParams.has('d')) {
            this.commonDiff = parseInt(urlParams.get('d'));
            document.getElementById('input-common-diff').value = this.commonDiff;
        }

        if (urlParams.has('n')) {
            this.termCount = parseInt(urlParams.get('n'));
            document.getElementById('input-term-count').value = this.termCount;
        }

        // Moodle 연동 확인
        if (urlParams.has('moodle')) {
            const moodleStatus = document.getElementById('moodle-status');
            moodleStatus.textContent = '연결됨';
            moodleStatus.classList.add('connected');
        }
    }

    /**
     * 시각화 업데이트
     */
    updateVisualization() {
        // 입력값 읽기
        this.firstTerm = parseInt(document.getElementById('input-first-term').value);
        this.commonDiff = parseInt(document.getElementById('input-common-diff').value);
        this.termCount = parseInt(document.getElementById('input-term-count').value);

        // 유효성 검사
        if (this.termCount < 1 || this.termCount > 20) {
            alert('항의 개수는 1~20 사이여야 합니다.');
            return;
        }

        // 정보 표시 업데이트
        document.getElementById('first-term').textContent = this.firstTerm;
        document.getElementById('common-diff').textContent = this.commonDiff;
        document.getElementById('term-count').textContent = this.termCount;

        // 공식 업데이트
        this.updateFormula();

        // 수열 표시 업데이트
        this.updateSequenceDisplay();

        // 계단 그리기
        this.drawStairs(false);
    }

    /**
     * 일반항 공식 업데이트
     */
    updateFormula() {
        const formulaSpecific = document.getElementById('formula-specific');
        formulaSpecific.textContent = `aₙ = ${this.firstTerm} + (n-1)×${this.commonDiff}`;
    }

    /**
     * 수열 표시 업데이트
     */
    updateSequenceDisplay() {
        const sequenceList = document.getElementById('sequence-list');
        sequenceList.innerHTML = '';

        for (let n = 1; n <= this.termCount; n++) {
            const term = this.calculateTerm(n);
            const item = document.createElement('div');
            item.className = 'sequence-item';
            item.textContent = `a${n} = ${term}`;
            item.style.animationDelay = `${(n - 1) * 0.1}s`;
            sequenceList.appendChild(item);
        }
    }

    /**
     * n번째 항 계산
     */
    calculateTerm(n) {
        return this.firstTerm + (n - 1) * this.commonDiff;
    }

    /**
     * 계단 그리기
     */
    drawStairs(animate = false) {
        const ctx = this.ctx;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // 캔버스 초기화
        ctx.clearRect(0, 0, width, height);

        // 수열 계산
        const sequence = [];
        for (let n = 1; n <= this.termCount; n++) {
            sequence.push(this.calculateTerm(n));
        }

        // 최대값, 최소값 찾기
        const maxValue = Math.max(...sequence);
        const minValue = Math.min(...sequence);
        const range = maxValue - minValue;

        // 여백 설정
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // 계단 크기 계산
        const stepWidth = graphWidth / this.termCount;
        const scaleY = range === 0 ? 1 : graphHeight / range;

        // 기준선 (y = 0) 그리기
        const zeroY = padding + graphHeight - (0 - minValue) * scaleY;
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(width - padding, zeroY);
        ctx.stroke();

        // 계단 그리기
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        sequence.forEach((value, index) => {
            const x = padding + index * stepWidth;
            const barHeight = Math.abs(value - minValue) * scaleY;
            const y = zeroY - (value - minValue) * scaleY;

            // 계단 사각형
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 2, y, stepWidth - 4, value >= 0 ? barHeight : -barHeight);

            // 테두리
            ctx.strokeStyle = '#5568d3';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y, stepWidth - 4, value >= 0 ? barHeight : -barHeight);

            // 값 표시
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + stepWidth / 2, y - 5);

            // 항 번호 표시
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(`n=${index + 1}`, x + stepWidth / 2, height - padding + 20);

            // 계단 연결선 (다음 항이 있으면)
            if (index < sequence.length - 1) {
                const nextValue = sequence[index + 1];
                const nextX = padding + (index + 1) * stepWidth;
                const nextY = zeroY - (nextValue - minValue) * scaleY;

                ctx.strokeStyle = '#764ba2';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(x + stepWidth - 2, y);
                ctx.lineTo(nextX + 2, nextY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // 공차 표시 (첫 번째와 두 번째 계단 사이)
        if (this.termCount >= 2) {
            const x1 = padding + stepWidth / 2;
            const x2 = padding + stepWidth + stepWidth / 2;
            const y1 = zeroY - (sequence[0] - minValue) * scaleY;
            const y2 = zeroY - (sequence[1] - minValue) * scaleY;

            // 화살표
            ctx.strokeStyle = '#ff6b6b';
            ctx.fillStyle = '#ff6b6b';
            ctx.lineWidth = 2;

            // 수직 화살표
            this.drawArrow(ctx, x2 + 20, y1, x2 + 20, y2);

            // 공차 값 표시
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`d=${this.commonDiff}`, x2 + 28, (y1 + y2) / 2);
        }
    }

    /**
     * 화살표 그리기
     */
    drawArrow(ctx, fromX, fromY, toX, toY) {
        const headLength = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // 선
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // 화살표 머리
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 계단 애니메이션
     */
    animateStairs() {
        this.currentAnimationStep = 0;
        const originalTermCount = this.termCount;

        const animate = () => {
            if (this.currentAnimationStep <= originalTermCount) {
                this.termCount = this.currentAnimationStep;
                this.updateSequenceDisplay();
                this.drawStairs(true);
                this.currentAnimationStep++;
                setTimeout(animate, 500);
            } else {
                this.termCount = originalTermCount;
            }
        };

        animate();
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.linearStairsApp = new LinearStairs();
});
