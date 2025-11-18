/**
 * Inclusion Gate 애니메이션 관리
 * 게이트 열림/닫힘 효과 및 애니메이션 제어
 */

class GateAnimation {
    constructor() {
        this.includeGate = document.getElementById('includeGate');
        this.excludeGate = document.getElementById('excludeGate');
        this.animationDuration = 800; // ms
    }

    /**
     * 게이트 열기 애니메이션
     * @param {HTMLElement} gate - 게이트 요소
     */
    openGate(gate) {
        return new Promise((resolve) => {
            gate.classList.add('open');
            setTimeout(() => {
                resolve();
            }, this.animationDuration);
        });
    }

    /**
     * 게이트 닫기 애니메이션
     * @param {HTMLElement} gate - 게이트 요소
     */
    closeGate(gate) {
        return new Promise((resolve) => {
            gate.classList.remove('open');
            setTimeout(() => {
                resolve();
            }, this.animationDuration);
        });
    }

    /**
     * 모든 게이트 닫기
     */
    async closeAllGates() {
        await Promise.all([
            this.closeGate(this.includeGate),
            this.closeGate(this.excludeGate)
        ]);
    }

    /**
     * 정답 게이트 열기
     * @param {boolean} isInclude - true면 포함 게이트, false면 포함X 게이트
     */
    async openCorrectGate(isInclude) {
        const gate = isInclude ? this.includeGate : this.excludeGate;
        await this.openGate(gate);
        this.addBounceEffect(gate);
    }

    /**
     * 오답 게이트 흔들기
     * @param {boolean} isInclude - true면 포함 게이트, false면 포함X 게이트
     */
    shakeWrongGate(isInclude) {
        const gate = isInclude ? this.includeGate : this.excludeGate;
        gate.classList.add('shake');
        setTimeout(() => {
            gate.classList.remove('shake');
        }, 500);
    }

    /**
     * 바운스 효과 추가
     * @param {HTMLElement} gate - 게이트 요소
     */
    addBounceEffect(gate) {
        gate.classList.add('bounce');
        setTimeout(() => {
            gate.classList.remove('bounce');
        }, 500);
    }

    /**
     * 게이트 리셋 (다음 문제를 위해)
     */
    async reset() {
        await this.closeAllGates();
        this.includeGate.classList.remove('shake', 'bounce');
        this.excludeGate.classList.remove('shake', 'bounce');
    }

    /**
     * 게이트 상태 확인
     * @param {HTMLElement} gate - 게이트 요소
     * @returns {boolean} 열려있으면 true
     */
    isOpen(gate) {
        return gate.classList.contains('open');
    }

    /**
     * 양쪽 게이트 동시에 열기 (시연용)
     */
    async openBothGates() {
        await Promise.all([
            this.openGate(this.includeGate),
            this.openGate(this.excludeGate)
        ]);
    }

    /**
     * 게이트 애니메이션 데모
     */
    async demo() {
        console.log('게이트 애니메이션 데모 시작');

        // 1. 포함 게이트 열기
        await this.openGate(this.includeGate);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. 포함 게이트 닫기
        await this.closeGate(this.includeGate);
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. 포함X 게이트 열기
        await this.openGate(this.excludeGate);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. 포함X 게이트 닫기
        await this.closeGate(this.excludeGate);
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. 양쪽 동시에 열기
        await this.openBothGates();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. 리셋
        await this.reset();

        console.log('게이트 애니메이션 데모 종료');
    }
}

// 전역 인스턴스 생성
let gateAnimation;

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', () => {
    gateAnimation = new GateAnimation();
    console.log('GateAnimation 초기화 완료');
});
