/**
 * Inner View Mode 기능 모듈
 * 입체 도형을 투명하게 만들어 내부 구조를 보여주는 기능
 */

class InnerViewMode {
    constructor(renderer) {
        this.renderer = renderer;
        this.isActive = false;
        this.currentTransparency = 0; // 0 = 불투명, 100 = 완전 투명
        this.animationDuration = 500; // ms
        this.animationFrame = null;

        this.elements = {
            toggleButton: document.getElementById('inner-view-toggle'),
            transparencySlider: document.getElementById('transparency-slider'),
            transparencyValue: document.getElementById('transparency-value')
        };

        this.initialize();
    }

    /**
     * 이벤트 리스너 초기화
     */
    initialize() {
        // Inner View 토글 버튼
        if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('click', () => {
                this.toggle();
            });
        }

        // 투명도 슬라이더
        if (this.elements.transparencySlider) {
            this.elements.transparencySlider.addEventListener('input', (e) => {
                this.setTransparency(parseFloat(e.target.value));
            });
        }
    }

    /**
     * Inner View Mode 토글
     */
    toggle() {
        this.isActive = !this.isActive;

        if (this.isActive) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    /**
     * Inner View Mode 활성화
     */
    activate() {
        console.log('Inner View Mode 활성화');

        // UI 업데이트
        if (this.elements.toggleButton) {
            this.elements.toggleButton.classList.add('active');
        }

        if (this.elements.transparencySlider) {
            this.elements.transparencySlider.disabled = false;
        }

        // 애니메이션으로 투명도 증가
        this.animateTransparency(this.currentTransparency, 70);
    }

    /**
     * Inner View Mode 비활성화
     */
    deactivate() {
        console.log('Inner View Mode 비활성화');

        // UI 업데이트
        if (this.elements.toggleButton) {
            this.elements.toggleButton.classList.remove('active');
        }

        if (this.elements.transparencySlider) {
            this.elements.transparencySlider.disabled = true;
        }

        // 애니메이션으로 투명도 감소
        this.animateTransparency(this.currentTransparency, 0);
    }

    /**
     * 투명도 직접 설정
     */
    setTransparency(value) {
        this.currentTransparency = Math.max(0, Math.min(100, value));

        // Three.js 렌더러에 투명도 적용
        if (this.renderer) {
            this.renderer.setTransparency(this.currentTransparency);
        }

        // UI 업데이트
        this.updateUI();
    }

    /**
     * 애니메이션으로 투명도 변경
     */
    animateTransparency(from, to) {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const startTime = Date.now();
        const delta = to - from;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);

            // Ease-out 함수 적용
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = from + (delta * eased);

            this.setTransparency(currentValue);

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        // 슬라이더 값 업데이트
        if (this.elements.transparencySlider) {
            this.elements.transparencySlider.value = this.currentTransparency;
        }

        // 투명도 퍼센트 텍스트 업데이트
        if (this.elements.transparencyValue) {
            this.elements.transparencyValue.textContent = `${Math.round(this.currentTransparency)}%`;
        }
    }

    /**
     * 현재 상태 반환
     */
    getState() {
        return {
            isActive: this.isActive,
            transparency: this.currentTransparency
        };
    }

    /**
     * 특정 투명도 레벨로 점프 (애니메이션 없이)
     */
    jumpToTransparency(value) {
        this.setTransparency(value);
    }

    /**
     * 리셋
     */
    reset() {
        this.isActive = false;
        this.setTransparency(0);

        if (this.elements.toggleButton) {
            this.elements.toggleButton.classList.remove('active');
        }

        if (this.elements.transparencySlider) {
            this.elements.transparencySlider.disabled = true;
        }
    }
}
