/**
 * Spring Physics Engine
 * 스프링의 물리적 동작을 시뮬레이션하는 엔진
 */

class SpringPhysics {
    constructor(config = {}) {
        // 스프링 물리 파라미터
        this.stiffness = config.stiffness || 0.05; // 스프링 강성
        this.damping = config.damping || 0.8; // 감쇠 계수
        this.mass = config.mass || 1.0; // 질량
        this.restLength = config.restLength || 100; // 자연 길이

        // 현재 상태
        this.position = config.initialPosition || 0;
        this.velocity = 0;
        this.acceleration = 0;

        // 목표 위치
        this.targetPosition = this.position;

        // 애니메이션 상태
        this.isAnimating = false;
    }

    /**
     * 목표 위치 설정
     */
    setTarget(target) {
        this.targetPosition = target;
        this.isAnimating = true;
    }

    /**
     * 물리 시뮬레이션 업데이트 (Hooke's Law)
     */
    update(deltaTime = 1) {
        if (!this.isAnimating) return;

        // 스프링 힘 계산: F = -k * x
        const displacement = this.position - this.targetPosition;
        const springForce = -this.stiffness * displacement;

        // 감쇠력 계산: F = -c * v
        const dampingForce = -this.damping * this.velocity;

        // 총 힘
        const totalForce = springForce + dampingForce;

        // 가속도 계산: a = F / m
        this.acceleration = totalForce / this.mass;

        // 속도 업데이트: v = v + a * dt
        this.velocity += this.acceleration * deltaTime;

        // 위치 업데이트: x = x + v * dt
        this.position += this.velocity * deltaTime;

        // 정지 조건 체크 (매우 작은 변화는 정지로 간주)
        if (Math.abs(this.velocity) < 0.01 && Math.abs(displacement) < 0.1) {
            this.position = this.targetPosition;
            this.velocity = 0;
            this.isAnimating = false;
        }

        return this.position;
    }

    /**
     * 현재 위치 반환
     */
    getPosition() {
        return this.position;
    }

    /**
     * 애니메이션 중인지 확인
     */
    isActive() {
        return this.isAnimating;
    }

    /**
     * 리셋
     */
    reset() {
        this.position = this.restLength;
        this.velocity = 0;
        this.acceleration = 0;
        this.targetPosition = this.restLength;
        this.isAnimating = false;
    }
}

/**
 * Spring Coil (스프링 코일) 클래스
 * 실제 스프링 모양을 그리는 데 사용
 */
class SpringCoil {
    constructor(x, y, length, coils = 10, width = 30) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.coils = coils;
        this.width = width;
        this.color = '#333';
        this.lineWidth = 3;
    }

    /**
     * 스프링 코일 그리기
     */
    draw(ctx, currentLength) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'round';

        ctx.beginPath();

        const segmentLength = currentLength / (this.coils * 2);
        let currentY = this.y;
        let currentX = this.x;

        ctx.moveTo(currentX, currentY);

        // 지그재그 패턴으로 스프링 그리기
        for (let i = 0; i < this.coils * 2; i++) {
            currentY += segmentLength;
            currentX = this.x + (i % 2 === 0 ? this.width / 2 : -this.width / 2);
            ctx.lineTo(currentX, currentY);
        }

        // 끝점
        ctx.lineTo(this.x, this.y + currentLength);

        ctx.stroke();
        ctx.restore();
    }

    /**
     * 나선형 스프링 그리기 (더 사실적)
     */
    drawSpiral(ctx, currentLength) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'round';

        ctx.beginPath();

        const totalPoints = this.coils * 20; // 해상도
        const angleIncrement = (Math.PI * 2 * this.coils) / totalPoints;

        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = i * angleIncrement;
            const y = this.y + t * currentLength;
            const radius = this.width / 2;
            const x = this.x + Math.cos(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.restore();
    }

    /**
     * 무게 그리기 (스프링 끝에 매달린 물체)
     */
    drawWeight(ctx, yPosition, color = '#ff6b6b', size = 20) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // 원형 무게
        ctx.beginPath();
        ctx.arc(this.x, yPosition, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - size / 4, yPosition - size / 4, size / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 고정점 그리기 (스프링이 매달린 점)
     */
    drawAnchor(ctx, color = '#4ecdc4', size = 15) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // 사각형 고정점
        ctx.fillRect(this.x - size, this.y - size / 2, size * 2, size);
        ctx.strokeRect(this.x - size, this.y - size / 2, size * 2, size);

        // 볼트 효과
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(this.x + i * (size / 2), this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
        }

        ctx.restore();
    }
}
