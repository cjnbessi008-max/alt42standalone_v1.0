/**
 * Explosion Animation Engine
 * Canvas 기반 불꽃 애니메이션 구현
 */

class ExplosionAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isAnimating = false;

        // 애니메이션 설정
        this.config = {
            type: 'fire',
            colorScheme: 'red-orange',
            speed: 1.0,
            intensity: 1.0
        };

        // 색상 스킴
        this.colorSchemes = {
            'red-orange': ['#FF5722', '#FF9800', '#FFEB3B'],
            'blue-purple': ['#3F51B5', '#673AB7', '#9C27B0'],
            'yellow-white': ['#FFEB3B', '#FFF176', '#FFFFFF'],
            'green-cyan': ['#4CAF50', '#00BCD4', '#00E5FF']
        };
    }

    /**
     * 애니메이션 설정 업데이트
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    /**
     * 파티클 클래스
     */
    createParticle(x, y, type = 'spark') {
        const colors = this.colorSchemes[this.config.colorScheme] || this.colorSchemes['red-orange'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6 * this.config.speed,
            vy: (Math.random() - 0.5) * 6 * this.config.speed,
            radius: Math.random() * 3 + 1,
            color: color,
            alpha: 1,
            life: 1,
            decay: 0.01 + Math.random() * 0.02,
            type: type
        };
    }

    /**
     * 불꽃 폭발 효과
     */
    explode(count = 1) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 폭발 강도에 따라 파티클 수 결정
        const particleCount = Math.min(50 * this.config.intensity, 200);

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle(centerX, centerY, 'explosion'));
        }

        // 충격파 효과
        this.createShockwave(centerX, centerY);

        // 애니메이션 시작
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * 불꽃 지속 효과 (화염)
     */
    fire(intensity = 1) {
        const centerX = this.canvas.width / 2;
        const bottomY = this.canvas.height - 50;

        // 화염 파티클 생성
        for (let i = 0; i < 5 * intensity; i++) {
            const particle = this.createParticle(
                centerX + (Math.random() - 0.5) * 40,
                bottomY,
                'fire'
            );
            // 화염은 위로 올라감
            particle.vy = -Math.random() * 3 - 1;
            particle.vx = (Math.random() - 0.5) * 2;
            this.particles.push(particle);
        }

        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * 불꽃 튀는 효과 (스파크)
     */
    spark(count = 1) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 50;

        const sparkCount = Math.min(20 * count, 100);

        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount;
            const particle = this.createParticle(centerX, centerY, 'spark');
            const speed = 2 + Math.random() * 3;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.radius = Math.random() * 2 + 1;
            this.particles.push(particle);
        }

        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * 충격파 효과
     */
    createShockwave(x, y) {
        const shockwave = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 150,
            alpha: 0.8,
            type: 'shockwave'
        };
        this.particles.push(shockwave);
    }

    /**
     * 파티클 업데이트
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'shockwave') {
                // 충격파 업데이트
                p.radius += 5;
                p.alpha -= 0.02;
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            } else {
                // 일반 파티클 업데이트
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // 중력 효과
                p.life -= p.decay;
                p.alpha = p.life;

                // 파티클 소멸
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    /**
     * 파티클 그리기
     */
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            if (p.type === 'shockwave') {
                // 충격파 그리기
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 152, 0, ${p.alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else {
                // 파티클 그리기
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                // 그라디언트 효과
                const gradient = this.ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.radius
                );
                gradient.addColorStop(0, `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, `${p.color}00`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                // 글로우 효과
                if (p.type === 'explosion') {
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = p.color;
                }
            }
        });

        this.ctx.shadowBlur = 0;
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        this.updateParticles();
        this.drawParticles();

        // 파티클이 남아있으면 계속 애니메이션
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stopAnimation();
        }
    }

    /**
     * 애니메이션 시작
     */
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    /**
     * 애니메이션 중지
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 모든 파티클 제거
     */
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.stopAnimation();
    }

    /**
     * 카운트 증가 시 애니메이션 효과
     */
    onCountIncrease(currentCount, previousCount) {
        const increaseRatio = currentCount / previousCount;

        if (increaseRatio >= 3) {
            // 큰 증가: 폭발 효과
            this.explode(currentCount);
        } else if (increaseRatio >= 2) {
            // 중간 증가: 스파크 효과
            this.spark(currentCount);
        } else {
            // 작은 증가: 화염 효과
            this.fire(this.config.intensity);
        }
    }

    /**
     * 지속적인 화염 효과 (루프)
     */
    startFireLoop() {
        this.fireLoopInterval = setInterval(() => {
            this.fire(0.5);
        }, 100);
    }

    /**
     * 화염 루프 중지
     */
    stopFireLoop() {
        if (this.fireLoopInterval) {
            clearInterval(this.fireLoopInterval);
            this.fireLoopInterval = null;
        }
    }
}

// 전역 애니메이션 인스턴스
let explosionAnim = null;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    explosionAnim = new ExplosionAnimation('explosion-canvas');
});
