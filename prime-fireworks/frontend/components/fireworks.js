/**
 * Prime Fireworks - Fireworks Animation Engine
 * 폭죽 애니메이션 엔진
 */

class FireworksEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isAnimating = false;
    }

    /**
     * 캔버스 초기화
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 파티클 생성
     */
    createParticle(x, y, color, vx = 0, vy = 0) {
        return {
            x, y,
            vx, vy,
            color,
            size: Math.random() * 3 + 2,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02,
            gravity: 0.05
        };
    }

    /**
     * 폭죽 폭발 효과
     */
    explode(x, y, color, particleCount = 30) {
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            this.particles.push(
                this.createParticle(x, y, color, vx, vy)
            );
        }
    }

    /**
     * 파티클 업데이트
     */
    updateParticles() {
        this.particles = this.particles.filter(p => {
            // 위치 업데이트
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;

            // 속도 감쇠
            p.vx *= 0.98;
            p.vy *= 0.98;

            // 생명력 감소
            p.life -= p.decay;

            return p.life > 0;
        });
    }

    /**
     * 파티클 렌더링
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    /**
     * 숫자 그리기
     */
    drawNumber(number, x, y, size = 60, color = 'white') {
        this.ctx.save();
        this.ctx.font = `bold ${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(number, x, y);
        this.ctx.restore();
    }

    /**
     * 소수 배지 그리기
     */
    drawPrimeBadge(number, x, y, isPrime = true) {
        const color = isPrime ? '#4caf50' : '#ff9800';

        // 원형 배경
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // 숫자
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(number, x, y);
        this.ctx.restore();
    }

    /**
     * 폭죽 애니메이션 실행
     */
    animate() {
        if (!this.isAnimating) return;

        this.clear();
        this.updateParticles();
        this.drawParticles();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 애니메이션 시작
     */
    start() {
        this.isAnimating = true;
        this.animate();
    }

    /**
     * 애니메이션 정지
     */
    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * 소수 분해 애니메이션 재생
     */
    async playFactorizationAnimation(fireworksData) {
        this.clear();
        this.start();

        const stages = fireworksData.animation_stages;
        const centerX = this.canvas.width / 2;

        // 초기 숫자 표시
        this.drawNumber(fireworksData.original_number, centerX, 80);
        await this.delay(1000);

        // 각 단계별 폭발 애니메이션
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];

            // 폭발 효과
            this.explode(
                stage.explosion.center_x,
                stage.explosion.center_y,
                stage.explosion.color,
                40
            );

            await this.delay(500);

            // 분해된 인수들 표시
            this.clear();
            stage.factor_positions.forEach(factor => {
                if (factor.is_prime) {
                    this.drawPrimeBadge(factor.number, factor.x, factor.y, true);
                } else {
                    this.drawNumber(factor.number, factor.x, factor.y, 40, factor.color);
                }
            });

            await this.delay(800);
        }

        // 최종 소수들 표시
        this.clear();
        const finalPrimes = fireworksData.final_prime_positions;

        finalPrimes.forEach((prime, index) => {
            setTimeout(() => {
                this.drawPrimeBadge(prime.number, prime.x, prime.y, true);
                this.explode(prime.x, prime.y, prime.color, 20);
            }, index * 200);
        });

        await this.delay(2000);

        // 최종 폭죽 효과
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height * 0.5;
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
            this.explode(x, y, colors[i % colors.length], 50);
            await this.delay(300);
        }

        await this.delay(2000);
        this.stop();
    }

    /**
     * 지연 함수
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 배경 별 효과
     */
    drawStars() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;

            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

// 전역 객체로 노출
window.FireworksEngine = FireworksEngine;
