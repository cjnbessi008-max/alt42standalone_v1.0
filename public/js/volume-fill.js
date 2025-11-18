/**
 * Volume Fill Animation Class
 * 부피가 물처럼 차오르는 애니메이션 제어
 */
class VolumeFill {
    constructor() {
        this.waterFill = document.getElementById('water-fill');
        this.waterSurface = document.getElementById('water-surface');
        this.percentageText = document.getElementById('volume-percentage');

        // 비커 치수 (SVG viewBox 기준)
        this.beakerHeight = 253; // 비커 내부 높이
        this.beakerBottom = 283;  // 비커 바닥 y 좌표
        this.beakerTop = 30;      // 비커 상단 y 좌표

        this.currentPercentage = 0;
        this.targetPercentage = 0;

        this.messages = {
            0: "학습을 시작해보세요! 🎓",
            25: "좋은 시작입니다! 💪",
            50: "절반을 달성했어요! 🎉",
            75: "거의 다 왔어요! 🌟",
            100: "완벽합니다! 축하합니다! 🎊"
        };
    }

    /**
     * 진도율을 설정하고 애니메이션 시작
     * @param {number} percentage - 0에서 100 사이의 진도율
     */
    setPercentage(percentage) {
        percentage = Math.max(0, Math.min(100, percentage));
        this.targetPercentage = percentage;
        this.animateToTarget();
    }

    /**
     * 목표 퍼센트까지 부드럽게 애니메이션
     */
    animateToTarget() {
        const animate = () => {
            const diff = this.targetPercentage - this.currentPercentage;

            if (Math.abs(diff) < 0.1) {
                this.currentPercentage = this.targetPercentage;
                this.updateVisuals();
                return;
            }

            this.currentPercentage += diff * 0.1; // Easing
            this.updateVisuals();
            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 비주얼 요소 업데이트
     */
    updateVisuals() {
        const percentage = this.currentPercentage;

        // 물 높이 계산
        const waterHeight = (this.beakerHeight * percentage) / 100;
        const waterY = this.beakerBottom - waterHeight;

        // 물 영역 업데이트
        this.waterFill.setAttribute('height', waterHeight);
        this.waterFill.setAttribute('y', waterY);

        // 물 표면 위치 업데이트
        this.waterSurface.setAttribute('cy', waterY);

        // 퍼센트 텍스트 업데이트
        const displayPercentage = Math.round(percentage);
        this.percentageText.textContent = `${displayPercentage}%`;

        // 퍼센트 텍스트 위치 조정 (물 위에 표시)
        let textY = waterY - 20;
        if (percentage < 30) {
            textY = this.beakerBottom - 20; // 하단 고정
        }
        this.percentageText.setAttribute('y', textY);

        // 퍼센트 텍스트 색상 변경
        if (percentage > 50) {
            this.percentageText.setAttribute('fill', '#fff');
        } else {
            this.percentageText.setAttribute('fill', '#0288D1');
        }

        // 격려 메시지 업데이트
        this.updateMessage(displayPercentage);

        // 물결 효과 강도 조절
        this.updateWaveEffect(percentage);
    }

    /**
     * 격려 메시지 업데이트
     */
    updateMessage(percentage) {
        const messageElement = document.getElementById('encouragement-message');

        let message = this.messages[0];
        for (let threshold in this.messages) {
            if (percentage >= threshold) {
                message = this.messages[threshold];
            }
        }

        if (messageElement.textContent !== message) {
            messageElement.style.animation = 'none';
            setTimeout(() => {
                messageElement.textContent = message;
                messageElement.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        }
    }

    /**
     * 물결 효과 조절
     */
    updateWaveEffect(percentage) {
        if (percentage > 0) {
            this.waterSurface.style.opacity = '0.5';
        } else {
            this.waterSurface.style.opacity = '0';
        }
    }

    /**
     * 현재 퍼센트 반환
     */
    getPercentage() {
        return Math.round(this.currentPercentage);
    }

    /**
     * 리셋
     */
    reset() {
        this.targetPercentage = 0;
        this.currentPercentage = 0;
        this.updateVisuals();
    }

    /**
     * 특정 퍼센트만큼 증가
     */
    incrementBy(amount) {
        const newPercentage = Math.min(100, this.targetPercentage + amount);
        this.setPercentage(newPercentage);
        return newPercentage;
    }

    /**
     * 특정 퍼센트만큼 감소
     */
    decrementBy(amount) {
        const newPercentage = Math.max(0, this.targetPercentage - amount);
        this.setPercentage(newPercentage);
        return newPercentage;
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
