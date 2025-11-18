/**
 * Wavy Integral Visualization
 * 구간이 확장되면 넓이가 물결처럼 흔들리는 적분 시각화
 */

class WavyIntegral {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 캔버스 크기 설정
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 적분 파라미터
        this.lowerBound = 0;
        this.upperBound = 2;
        this.targetLower = 0;
        this.targetUpper = 2;

        // 파동 파라미터
        this.waveIntensity = 0.5;
        this.wavePhase = 0;
        this.waveSpeed = 0.05;
        this.isAnimating = false;
        this.animationId = null;

        // 확장 애니메이션
        this.isExpanding = false;
        this.expandProgress = 0;
        this.expandSpeed = 0.02;

        // 함수 정의: f(x) = sin(x) + 2
        this.func = (x) => Math.sin(x) + 2;

        // 좌표 변환 파라미터
        this.xMin = -1;
        this.xMax = 8;
        this.yMin = -0.5;
        this.yMax = 4;

        // 초기 렌더링
        this.render();
    }

    // 좌표 변환: 수학 좌표 -> 캔버스 좌표
    toCanvasX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
    }

    toCanvasY(y) {
        return this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height;
    }

    // 좌표축 그리기
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.toCanvasY(0));
        this.ctx.lineTo(this.width, this.toCanvasY(0));
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(0), 0);
        this.ctx.lineTo(this.toCanvasX(0), this.height);
        this.ctx.stroke();

        // 눈금 그리기
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        for (let x = 0; x <= 8; x++) {
            const canvasX = this.toCanvasX(x);
            this.ctx.fillText(x.toString(), canvasX - 5, this.toCanvasY(0) + 15);
        }
    }

    // 함수 그래프 그리기
    drawFunction() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let x = this.xMin; x <= this.xMax; x += 0.01) {
            const y = this.func(x);
            const canvasX = this.toCanvasX(x);
            const canvasY = this.toCanvasY(y);

            if (x === this.xMin) {
                this.ctx.moveTo(canvasX, canvasY);
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    // 물결치는 적분 영역 그리기
    drawWavyIntegral() {
        const segments = 100;
        const dx = (this.upperBound - this.lowerBound) / segments;

        // 그라디언트 생성
        const gradient = this.ctx.createLinearGradient(
            this.toCanvasX(this.lowerBound),
            0,
            this.toCanvasX(this.upperBound),
            0
        );
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.6)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.6)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        // 아래쪽 경계 (x축)
        this.ctx.moveTo(this.toCanvasX(this.lowerBound), this.toCanvasY(0));

        // 물결치는 위쪽 경계
        for (let i = 0; i <= segments; i++) {
            const x = this.lowerBound + i * dx;
            let y = this.func(x);

            // 파동 효과 추가
            if (this.isAnimating || this.isExpanding) {
                const waveOffset = Math.sin(i * 0.3 + this.wavePhase) * 0.2 * this.waveIntensity;
                y += waveOffset;
            }

            const canvasX = this.toCanvasX(x);
            const canvasY = this.toCanvasY(y);

            if (i === 0) {
                this.ctx.lineTo(canvasX, canvasY);
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        // 오른쪽 경계
        this.ctx.lineTo(this.toCanvasX(this.upperBound), this.toCanvasY(0));

        // 경로 닫기
        this.ctx.closePath();
        this.ctx.fill();

        // 경계선 그리기
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // 적분 값 계산 (리만 합)
    calculateIntegral() {
        const segments = 1000;
        const dx = (this.upperBound - this.lowerBound) / segments;
        let sum = 0;

        for (let i = 0; i < segments; i++) {
            const x = this.lowerBound + i * dx;
            sum += this.func(x) * dx;
        }

        // 파동 효과가 있을 때 약간의 변동 추가
        if (this.isAnimating || this.isExpanding) {
            const waveFactor = Math.sin(this.wavePhase * 2) * 0.05 * this.waveIntensity;
            sum *= (1 + waveFactor);
        }

        return sum;
    }

    // 구간 경계선 그리기
    drawBounds() {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // 하한선
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.lowerBound), 0);
        this.ctx.lineTo(this.toCanvasX(this.lowerBound), this.height);
        this.ctx.stroke();

        // 상한선
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.upperBound), 0);
        this.ctx.lineTo(this.toCanvasX(this.upperBound), this.height);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // 라벨
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('a', this.toCanvasX(this.lowerBound) - 5, this.height - 10);
        this.ctx.fillText('b', this.toCanvasX(this.upperBound) - 5, this.height - 10);
    }

    // 렌더링
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 배경
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 그리기 순서
        this.drawAxes();
        this.drawWavyIntegral();
        this.drawFunction();
        this.drawBounds();

        // 적분 값 업데이트
        const integralValue = this.calculateIntegral();
        document.getElementById('integralValue').textContent =
            `∫ f(x)dx = ${integralValue.toFixed(3)}`;
    }

    // 애니메이션 루프
    animate() {
        this.wavePhase += this.waveSpeed;

        // 확장 애니메이션
        if (this.isExpanding) {
            this.expandProgress += this.expandSpeed;

            // 이징 함수 (easeInOutCubic)
            const t = this.expandProgress;
            const easedProgress = t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // 구간 보간
            this.lowerBound = this.lowerBound +
                (this.targetLower - this.lowerBound) * easedProgress * 0.1;
            this.upperBound = this.upperBound +
                (this.targetUpper - this.upperBound) * easedProgress * 0.1;

            // 확장 완료 체크
            if (this.expandProgress >= 1) {
                this.lowerBound = this.targetLower;
                this.upperBound = this.targetUpper;
                this.isExpanding = false;
                this.expandProgress = 0;
            }
        }

        this.render();

        if (this.isAnimating || this.isExpanding) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    // 애니메이션 시작
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    // 애니메이션 정지
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // 구간 확장
    expandInterval(newLower, newUpper) {
        this.targetLower = newLower;
        this.targetUpper = newUpper;
        this.isExpanding = true;
        this.expandProgress = 0;
        this.startAnimation();

        // 3초 후 애니메이션 서서히 정지
        setTimeout(() => {
            this.isAnimating = false;
        }, 3000);
    }

    // 구간 설정
    setBounds(lower, upper) {
        this.lowerBound = lower;
        this.upperBound = upper;
        this.targetLower = lower;
        this.targetUpper = upper;
        this.render();
    }

    // 파동 강도 설정
    setWaveIntensity(intensity) {
        this.waveIntensity = intensity;
        this.render();
    }

    // 초기화
    reset() {
        this.stopAnimation();
        this.lowerBound = 0;
        this.upperBound = 2;
        this.targetLower = 0;
        this.targetUpper = 2;
        this.wavePhase = 0;
        this.isExpanding = false;
        this.expandProgress = 0;
        this.render();
    }
}
