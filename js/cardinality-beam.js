/**
 * Cardinality Beam Visualization
 * 집합의 원소 수에 따라 빛의 강도가 변하는 시각화
 */

class CardinalityBeam {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cardinality = 0;
        this.targetCardinality = 0;
        this.animationFrame = null;
        this.particles = [];
        this.maxParticles = 100;

        // 애니메이션 설정
        this.animationSpeed = 0.1;

        this.init();
    }

    init() {
        // 초기 파티클 생성
        this.createParticles();
        this.animate();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height,
                speedY: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: Math.random() * 100,
                maxLife: 100,
                opacity: 0
            });
        }
    }

    setCardinality(value) {
        this.targetCardinality = Math.max(0, value);
        // 카디널리티 값 업데이트
        document.getElementById('beamCount').textContent = this.targetCardinality;
        document.getElementById('elementCount').textContent = this.targetCardinality;
    }

    animate() {
        // 부드러운 전환
        if (Math.abs(this.cardinality - this.targetCardinality) > 0.01) {
            this.cardinality += (this.targetCardinality - this.cardinality) * this.animationSpeed;
        } else {
            this.cardinality = this.targetCardinality;
        }

        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    draw() {
        // 캔버스 클리어
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 빛의 강도 계산 (0-1 범위, 최대 20개 원소 기준)
        const intensity = Math.min(this.cardinality / 20, 1);

        // 중앙 빛 기둥 그리기
        this.drawBeamCore(intensity);

        // 파티클 효과
        this.drawParticles(intensity);

        // 빛 번짐 효과
        this.drawGlow(intensity);
    }

    drawBeamCore(intensity) {
        const centerX = this.canvas.width / 2;
        const bottomY = this.canvas.height;
        const topY = this.canvas.height * (1 - intensity * 0.8);

        // 빛 기둥의 너비
        const beamWidth = 40 + (intensity * 60);

        // 그라디언트 생성
        const gradient = this.ctx.createLinearGradient(centerX, bottomY, centerX, topY);

        // 강도에 따라 색상 변화
        const hue = 250 - (intensity * 50); // 보라색(250)에서 파란색(200)으로
        const saturation = 70 + (intensity * 30);
        const lightness = 40 + (intensity * 40);

        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${intensity * 0.8})`);
        gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness + 10}%, ${intensity * 0.6})`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${intensity * 0.3})`);

        // 빛 기둥 그리기
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - beamWidth / 2, bottomY);
        this.ctx.lineTo(centerX - beamWidth / 3, topY);
        this.ctx.lineTo(centerX + beamWidth / 3, topY);
        this.ctx.lineTo(centerX + beamWidth / 2, bottomY);
        this.ctx.closePath();
        this.ctx.fill();

        // 중앙 밝은 선
        this.ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${intensity})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, bottomY);
        this.ctx.lineTo(centerX, topY);
        this.ctx.stroke();
    }

    drawParticles(intensity) {
        this.particles.forEach(particle => {
            // 강도에 따라 파티클 활성화
            if (particle.life < intensity * 100) {
                particle.life += 1;
                particle.opacity = Math.min(particle.life / particle.maxLife * intensity, intensity);
            } else {
                particle.life -= 1;
                particle.opacity = Math.max(particle.opacity - 0.02, 0);
            }

            // 파티클 위치 업데이트
            particle.y -= particle.speedY * intensity;
            particle.x += particle.speedX * intensity;

            // 화면 밖으로 나가면 리셋
            if (particle.y < 0) {
                particle.y = this.canvas.height;
                particle.x = this.canvas.width / 2 + (Math.random() - 0.5) * 80;
            }

            // 파티클 그리기
            if (particle.opacity > 0) {
                this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();

                // 빛나는 효과
                this.ctx.shadowBlur = 10 * intensity;
                this.ctx.shadowColor = `rgba(102, 126, 234, ${particle.opacity})`;
            }
        });

        this.ctx.shadowBlur = 0;
    }

    drawGlow(intensity) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 중앙 글로우
        const glowGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 150
        );

        const alpha = intensity * 0.3;
        glowGradient.addColorStop(0, `rgba(102, 126, 234, ${alpha})`);
        glowGradient.addColorStop(0.5, `rgba(102, 126, 234, ${alpha * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 하단 밝은 영역
        const bottomGlow = this.ctx.createRadialGradient(
            centerX, this.canvas.height, 0,
            centerX, this.canvas.height, 100
        );

        const bottomAlpha = intensity * 0.5;
        bottomGlow.addColorStop(0, `rgba(102, 126, 234, ${bottomAlpha})`);
        bottomGlow.addColorStop(0.5, `rgba(102, 126, 234, ${bottomAlpha * 0.5})`);
        bottomGlow.addColorStop(1, 'rgba(102, 126, 234, 0)');

        this.ctx.fillStyle = bottomGlow;
        this.ctx.fillRect(0, this.canvas.height - 150, this.canvas.width, 150);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
