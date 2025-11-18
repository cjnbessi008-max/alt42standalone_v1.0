/**
 * Ratio Visualizer
 * 비율을 스프링 애니메이션으로 시각화
 */

class RatioVisualizer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 비율 값
        this.ratioA = options.ratioA || 2;
        this.ratioB = options.ratioB || 3;

        // 스프링 설정
        this.springA = null;
        this.springB = null;
        this.coilA = null;
        this.coilB = null;

        // 애니메이션
        this.animationId = null;
        this.isAnimating = false;

        // 시각화 모드
        // 'dual' - 두 개의 스프링을 나란히 표시
        // 'single' - 하나의 스프링으로 비율 표시
        this.mode = options.mode || 'dual';

        // 컬러
        this.colors = {
            springA: '#667eea',
            springB: '#764ba2',
            weightA: '#667eea',
            weightB: '#764ba2',
            anchor: '#4ecdc4',
            background: '#ffffff'
        };

        this.initialize();
    }

    /**
     * 초기화
     */
    initialize() {
        // 스프링 물리 엔진 생성
        const baseLength = 100;

        this.springA = new SpringPhysics({
            stiffness: 0.05,
            damping: 0.7,
            restLength: baseLength,
            initialPosition: baseLength
        });

        this.springB = new SpringPhysics({
            stiffness: 0.05,
            damping: 0.7,
            restLength: baseLength,
            initialPosition: baseLength
        });

        // 스프링 코일 객체 생성
        if (this.mode === 'dual') {
            this.coilA = new SpringCoil(
                this.width / 3,
                50,
                baseLength,
                8,
                25
            );

            this.coilB = new SpringCoil(
                (this.width / 3) * 2,
                50,
                baseLength,
                8,
                25
            );
        } else {
            // 단일 스프링 모드
            this.coilA = new SpringCoil(
                this.width / 2,
                50,
                baseLength,
                10,
                30
            );
        }

        this.updateRatio(this.ratioA, this.ratioB);
    }

    /**
     * 비율 업데이트
     */
    updateRatio(a, b) {
        this.ratioA = Math.max(1, Math.min(10, a));
        this.ratioB = Math.max(1, Math.min(10, b));

        // 비율에 따른 스프링 길이 계산
        const maxLength = 250;
        const minLength = 50;
        const total = this.ratioA + this.ratioB;

        if (this.mode === 'dual') {
            // 두 스프링의 상대적 길이
            const lengthA = minLength + (maxLength - minLength) * (this.ratioA / total);
            const lengthB = minLength + (maxLength - minLength) * (this.ratioB / total);

            this.springA.setTarget(lengthA);
            this.springB.setTarget(lengthB);
        } else {
            // 단일 스프링: 비율을 길이로 표현
            const ratio = this.ratioA / this.ratioB;
            const length = minLength + (maxLength - minLength) * Math.min(ratio / 3, 1);
            this.springA.setTarget(length);
        }

        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * 애니메이션 시작
     */
    startAnimation() {
        this.isAnimating = true;
        this.animate();
    }

    /**
     * 애니메이션 정지
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        if (!this.isAnimating) return;

        // 물리 엔진 업데이트
        this.springA.update();
        if (this.mode === 'dual') {
            this.springB.update();
        }

        // 화면 그리기
        this.draw();

        // 계속 애니메이션
        if (this.springA.isActive() || (this.mode === 'dual' && this.springB.isActive())) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
        }
    }

    /**
     * 화면 그리기
     */
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.mode === 'dual') {
            this.drawDualMode();
        } else {
            this.drawSingleMode();
        }

        // 비율 텍스트 표시
        this.drawRatioText();
    }

    /**
     * 듀얼 스프링 모드 그리기
     */
    drawDualMode() {
        const lengthA = this.springA.getPosition();
        const lengthB = this.springB.getPosition();

        // 스프링 A
        this.coilA.color = this.colors.springA;
        this.coilA.drawSpiral(this.ctx, lengthA);
        this.coilA.drawAnchor(this.ctx, this.colors.anchor);
        this.coilA.drawWeight(
            this.ctx,
            this.coilA.y + lengthA,
            this.colors.weightA,
            15 + this.ratioA * 2
        );

        // 스프링 B
        this.coilB.color = this.colors.springB;
        this.coilB.drawSpiral(this.ctx, lengthB);
        this.coilB.drawAnchor(this.ctx, this.colors.anchor);
        this.coilB.drawWeight(
            this.ctx,
            this.coilB.y + lengthB,
            this.colors.weightB,
            15 + this.ratioB * 2
        );

        // 레이블
        this.drawLabel(this.coilA.x, this.coilA.y + lengthA + 35, 'A', this.colors.springA);
        this.drawLabel(this.coilB.x, this.coilB.y + lengthB + 35, 'B', this.colors.springB);

        // 비교 선 (옵션)
        this.drawComparisonLine(
            this.coilA.x,
            this.coilA.y + lengthA,
            this.coilB.x,
            this.coilB.y + lengthB
        );
    }

    /**
     * 단일 스프링 모드 그리기
     */
    drawSingleMode() {
        const length = this.springA.getPosition();

        this.coilA.color = this.colors.springA;
        this.coilA.drawSpiral(this.ctx, length);
        this.coilA.drawAnchor(this.ctx, this.colors.anchor);
        this.coilA.drawWeight(
            this.ctx,
            this.coilA.y + length,
            this.colors.weightA,
            20
        );

        // 비율 표시
        const ratio = (this.ratioA / this.ratioB).toFixed(2);
        this.drawLabel(this.coilA.x, this.coilA.y + length + 40, `${ratio}`, this.colors.springA);
    }

    /**
     * 비율 텍스트 표시
     */
    drawRatioText() {
        this.ctx.save();
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `비율: ${this.ratioA}:${this.ratioB}`,
            this.width / 2,
            this.height - 20
        );
        this.ctx.restore();
    }

    /**
     * 레이블 그리기
     */
    drawLabel(x, y, text, color) {
        this.ctx.save();
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    /**
     * 비교 선 그리기
     */
    drawComparisonLine(x1, y1, x2, y2) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x1 + 20, y1);
        this.ctx.lineTo(x2 - 20, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * 리셋
     */
    reset() {
        this.stopAnimation();
        this.springA.reset();
        if (this.mode === 'dual') {
            this.springB.reset();
        }
        this.draw();
    }

    /**
     * 모드 변경
     */
    setMode(mode) {
        this.mode = mode;
        this.initialize();
    }

    /**
     * 현재 비율 반환
     */
    getRatio() {
        return {
            a: this.ratioA,
            b: this.ratioB,
            decimal: this.ratioA / this.ratioB,
            percentage: (this.ratioA / (this.ratioA + this.ratioB) * 100).toFixed(1)
        };
    }
}
