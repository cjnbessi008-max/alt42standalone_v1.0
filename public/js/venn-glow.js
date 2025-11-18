/**
 * Venn Glow - 빛나는 벤다이어그램 컴포넌트
 * 집합 A와 B를 감성적인 빛나는 원으로 표현
 */
class VennGlow {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.animationProgress = 0;
        this.isAnimating = false;

        // 기본 옵션
        this.options = {
            radiusA: 80,
            radiusB: 80,
            overlap: 40,
            colorA: { r: 255, g: 100, b: 200 },      // 핑크
            colorB: { r: 100, g: 200, b: 255 },      // 블루
            glowIntensity: 20,
            pulseSpeed: 0.02,
            showLabels: true,
            showElements: true,
            animationDuration: 3000,
            ...options
        };

        // 집합 데이터
        this.setA = [];
        this.setB = [];
        this.intersection = [];

        // 애니메이션 상태
        this.pulseOffset = 0;
        this.intersectionGlow = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.startPulseAnimation();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.width = rect.width;
        this.height = rect.height;

        // 중심점 계산
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        // 원의 중심점 계산
        this.centerA = {
            x: this.centerX - this.options.overlap / 2,
            y: this.centerY
        };
        this.centerB = {
            x: this.centerX + this.options.overlap / 2,
            y: this.centerY
        };
    }

    /**
     * 집합 데이터 설정
     */
    setData(setA, setB) {
        this.setA = setA || [];
        this.setB = setB || [];
        this.intersection = this.setA.filter(item => this.setB.includes(item));
        this.draw();
    }

    /**
     * 지속적인 펄스 애니메이션
     */
    startPulseAnimation() {
        const animate = () => {
            this.pulseOffset += this.options.pulseSpeed;
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopPulseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 교집합 강조 애니메이션
     */
    playIntersectionAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animationProgress = 0;

        const startTime = Date.now();
        const duration = this.options.animationDuration;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.animationProgress = Math.min(elapsed / duration, 1);

            // Ease-in-out 함수
            const eased = this.animationProgress < 0.5
                ? 2 * this.animationProgress * this.animationProgress
                : 1 - Math.pow(-2 * this.animationProgress + 2, 2) / 2;

            this.intersectionGlow = eased;

            if (this.animationProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                // 천천히 원래대로
                this.fadeOutIntersectionGlow();
            }
        };

        animate();
    }

    fadeOutIntersectionGlow() {
        const fadeOut = () => {
            this.intersectionGlow -= 0.02;
            if (this.intersectionGlow > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.intersectionGlow = 0;
            }
        };
        fadeOut();
    }

    /**
     * 메인 그리기 함수
     */
    draw() {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 펄스 효과 계산
        const pulse = Math.sin(this.pulseOffset) * 0.1 + 1;
        const glowPulse = Math.sin(this.pulseOffset * 1.5) * 0.5 + 0.5;

        // 그림자/글로우 레이어 그리기 (뒤에서부터)
        this.drawGlowLayer(this.centerA.x, this.centerA.y, this.options.radiusA * pulse, this.options.colorA, glowPulse);
        this.drawGlowLayer(this.centerB.x, this.centerB.y, this.options.radiusB * pulse, this.options.colorB, glowPulse);

        // 교집합 특별 글로우
        if (this.intersection.length > 0) {
            this.drawIntersectionGlow();
        }

        // 메인 원 그리기
        this.drawCircle(this.centerA.x, this.centerA.y, this.options.radiusA, this.options.colorA, 0.3);
        this.drawCircle(this.centerB.x, this.centerB.y, this.options.radiusB, this.options.colorB, 0.3);

        // 라벨 그리기
        if (this.options.showLabels) {
            this.drawLabel('A', this.centerA.x - this.options.radiusA / 2, this.centerY - 10, this.options.colorA);
            this.drawLabel('B', this.centerB.x + this.options.radiusA / 2, this.centerY - 10, this.options.colorB);
        }

        // 집합 원소 표시
        if (this.options.showElements && (this.setA.length > 0 || this.setB.length > 0)) {
            this.drawElements();
        }
    }

    /**
     * 글로우 레이어 그리기
     */
    drawGlowLayer(x, y, radius, color, intensity) {
        const layers = this.options.glowIntensity;

        for (let i = layers; i > 0; i--) {
            const layerRadius = radius + (i * 2);
            const alpha = (intensity * 0.05 * (layers - i)) / layers;

            this.ctx.beginPath();
            this.ctx.arc(x, y, layerRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.fill();
        }
    }

    /**
     * 교집합 글로우 그리기
     */
    drawIntersectionGlow() {
        if (this.intersectionGlow <= 0) return;

        const midX = (this.centerA.x + this.centerB.x) / 2;
        const midY = (this.centerA.y + this.centerB.y) / 2;
        const glowRadius = 60;

        // 무지개 색상 효과
        const colors = [
            { r: 255, g: 100, b: 200 },
            { r: 255, g: 200, b: 100 },
            { r: 100, g: 255, b: 200 },
            { r: 100, g: 200, b: 255 },
        ];

        const colorIndex = Math.floor(this.animationProgress * colors.length) % colors.length;
        const color = colors[colorIndex];

        for (let i = 30; i > 0; i--) {
            const layerRadius = glowRadius * this.intersectionGlow * (i / 30);
            const alpha = this.intersectionGlow * 0.1 * (30 - i) / 30;

            this.ctx.beginPath();
            this.ctx.arc(midX, midY, layerRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.fill();
        }

        // 중앙 밝은 점
        this.ctx.beginPath();
        this.ctx.arc(midX, midY, 5 * this.intersectionGlow, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.intersectionGlow * 0.8})`;
        this.ctx.fill();
    }

    /**
     * 원 그리기
     */
    drawCircle(x, y, radius, color, alpha) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * 라벨 그리기
     */
    drawLabel(text, x, y, color) {
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 텍스트 그림자
        this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(text, x, y);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 집합 원소 표시
     */
    drawElements() {
        const onlyA = this.setA.filter(item => !this.setB.includes(item));
        const onlyB = this.setB.filter(item => !this.setA.includes(item));

        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // A만의 원소
        this.drawElementsInCircle(onlyA, this.centerA.x - 25, this.centerY, '#fff');

        // B만의 원소
        this.drawElementsInCircle(onlyB, this.centerB.x + 25, this.centerY, '#fff');

        // 교집합 원소
        if (this.intersection.length > 0) {
            const midX = (this.centerA.x + this.centerB.x) / 2;
            this.drawElementsInCircle(this.intersection, midX, this.centerY, '#fff');
        }
    }

    drawElementsInCircle(elements, x, y, color) {
        const text = elements.slice(0, 5).join(', ');
        if (elements.length > 5) {
            text += '...';
        }

        this.ctx.fillStyle = color;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(text, x, y);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 정리
     */
    destroy() {
        this.stopPulseAnimation();
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}

// 전역으로 export
window.VennGlow = VennGlow;
