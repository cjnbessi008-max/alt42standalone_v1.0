/**
 * Character Animator
 * 캐릭터 이동 애니메이션 관리
 */

class CharacterAnimator {
    constructor(graphRenderer) {
        this.renderer = graphRenderer;
        this.animationId = null;
        this.isAnimating = false;
    }

    /**
     * 캐릭터 이동 애니메이션 (적분 값만큼 이동)
     *
     * @param {Object} problemData 문제 데이터
     * @param {number} targetX 목표 X 좌표
     * @param {number} duration 애니메이션 지속 시간 (ms)
     * @param {Function} onComplete 완료 콜백
     */
    animateWalk(problemData, targetX, duration = 2000, onComplete = null) {
        if (this.isAnimating) {
            this.stop();
        }

        const startX = problemData.function.lower_bound;
        const distance = targetX - startX;
        const startTime = Date.now();

        this.isAnimating = true;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-cubic)
            const eased = this.easeOutCubic(progress);

            const currentX = startX + (distance * eased);

            // 그래프 업데이트
            this.renderer.updateAnimation(problemData, currentX);

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * 점진적으로 면적 채우기 애니메이션
     *
     * @param {Object} problemData 문제 데이터
     * @param {number} startBound 시작 범위
     * @param {number} endBound 끝 범위
     * @param {number} duration 지속 시간
     * @param {Function} onComplete 완료 콜백
     */
    animateFillArea(problemData, startBound, endBound, duration = 1500, onComplete = null) {
        if (this.isAnimating) {
            this.stop();
        }

        const distance = endBound - startBound;
        const startTime = Date.now();

        this.isAnimating = true;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = this.easeInOutQuad(progress);
            const currentBound = startBound + (distance * eased);

            // 그래프 업데이트 (면적만 변경)
            this.renderer.clear();
            this.renderer.drawGrid();
            this.renderer.drawAxes();

            const graphColor = problemData.colors?.graph || this.renderer.colors.graph;
            this.renderer.drawFunction(problemData.function.expression, graphColor);

            // 면적 채우기
            const areaColor = problemData.colors?.area || this.renderer.colors.area;
            this.renderer.fillIntegralArea(
                problemData.function.expression,
                startBound,
                currentBound,
                areaColor
            );

            // 캐릭터는 끝 지점에 고정
            this.renderer.drawCharacter(currentBound);

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * 성공 애니메이션 (점프 효과)
     *
     * @param {Object} problemData 문제 데이터
     * @param {number} characterX 캐릭터 X 위치
     * @param {Function} onComplete 완료 콜백
     */
    animateSuccess(problemData, characterX, onComplete = null) {
        const duration = 1000;
        const startTime = Date.now();
        const jumpHeight = 50; // 픽셀 단위 점프 높이

        this.isAnimating = true;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 포물선 운동 (sine wave)
            const jumpProgress = Math.sin(progress * Math.PI);
            const currentJump = jumpProgress * jumpHeight;

            // 그래프 재렌더링
            this.renderer.clear();
            this.renderer.drawGrid();
            this.renderer.drawAxes();

            const graphColor = problemData.colors?.graph || this.renderer.colors.graph;
            this.renderer.drawFunction(problemData.function.expression, graphColor);

            const areaColor = 'rgba(46, 204, 113, 0.3)'; // 성공 색상 (녹색)
            this.renderer.fillIntegralArea(
                problemData.function.expression,
                problemData.function.lower_bound,
                problemData.function.upper_bound,
                areaColor
            );

            // 캐릭터 점프 (Canvas Y 좌표 조정)
            const canvasX = this.renderer.transformX(characterX);
            const canvasY = this.renderer.transformY(0) - currentJump;

            const size = 20;
            const charColor = '#2ecc71'; // 성공 색상

            this.renderer.ctx.fillStyle = charColor;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(canvasX, canvasY - size, size, 0, Math.PI * 2);
            this.renderer.ctx.fill();

            // 별 효과
            this.drawStars(canvasX, canvasY - size, progress);

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * 실패 애니메이션 (흔들림 효과)
     *
     * @param {Object} problemData 문제 데이터
     * @param {number} characterX 캐릭터 X 위치
     * @param {Function} onComplete 완료 콜백
     */
    animateFailure(problemData, characterX, onComplete = null) {
        const duration = 600;
        const startTime = Date.now();
        const shakeIntensity = 10; // 픽셀 단위 흔들림 강도

        this.isAnimating = true;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 흔들림 효과 (감쇠하는 sine wave)
            const shakeProgress = Math.sin(progress * Math.PI * 10) * (1 - progress);
            const shake = shakeProgress * shakeIntensity;

            // 그래프 재렌더링
            this.renderer.clear();
            this.renderer.drawGrid();
            this.renderer.drawAxes();

            const graphColor = problemData.colors?.graph || this.renderer.colors.graph;
            this.renderer.drawFunction(problemData.function.expression, graphColor);

            const areaColor = 'rgba(231, 76, 60, 0.3)'; // 실패 색상 (빨강)
            this.renderer.fillIntegralArea(
                problemData.function.expression,
                problemData.function.lower_bound,
                characterX,
                areaColor
            );

            // 캐릭터 흔들림
            const shakeX = characterX + this.renderer.inverseTransformX(shake) - this.renderer.inverseTransformX(0);
            this.renderer.drawCharacter(shakeX, 20, '#e74c3c'); // 실패 색상

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * 별 효과 그리기
     */
    drawStars(centerX, centerY, progress) {
        const ctx = this.renderer.ctx;
        const starCount = 8;
        const radius = 40 + (progress * 30); // 확산 효과

        for (let i = 0; i < starCount; i++) {
            const angle = (i / starCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const size = 3 * (1 - progress); // 페이드 아웃

            ctx.fillStyle = `rgba(255, 215, 0, ${1 - progress})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 애니메이션 중지
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;
    }

    /**
     * Easing Functions
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * 재생 중 여부 확인
     */
    isPlaying() {
        return this.isAnimating;
    }
}
