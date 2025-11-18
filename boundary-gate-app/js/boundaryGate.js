/**
 * Boundary Gate Animation Controller
 * 부등호 게이트 애니메이션을 제어하는 클래스
 */

class BoundaryGate {
    constructor(gateElementId) {
        this.gateElement = document.getElementById(gateElementId);
        this.currentType = 'ge'; // 'ge' (>=) or 'le' (<=)
        this.isOpen = false;
        this.isAnimating = false;
    }

    /**
     * 게이트 타입 설정 (>= 또는 <=)
     * @param {string} type - 'ge' 또는 'le'
     */
    setType(type) {
        if (this.isAnimating) return;

        this.currentType = type;
        const geGate = document.getElementById('gateGreaterEqual');
        const leGate = document.getElementById('gateLessEqual');

        // 게이트 전환 애니메이션
        this.gateElement.classList.add('gate-transition');

        setTimeout(() => {
            if (type === 'ge') {
                geGate.style.display = 'block';
                leGate.style.display = 'none';
            } else {
                geGate.style.display = 'none';
                leGate.style.display = 'block';
            }
        }, 300);

        setTimeout(() => {
            this.gateElement.classList.remove('gate-transition');
        }, 600);
    }

    /**
     * 게이트 열기
     */
    open() {
        if (this.isOpen || this.isAnimating) return;

        this.isAnimating = true;
        this.gateElement.classList.remove('gate-closed');
        this.gateElement.classList.add('gate-open');
        this.isOpen = true;

        // 상태 업데이트
        this.updateStatus('게이트가 열렸습니다! ✓');

        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }

    /**
     * 게이트 닫기
     */
    close() {
        if (!this.isOpen || this.isAnimating) return;

        this.isAnimating = true;
        this.gateElement.classList.remove('gate-open');
        this.gateElement.classList.add('gate-closed');
        this.isOpen = false;

        // 상태 업데이트
        this.updateStatus('게이트가 닫혔습니다');

        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }

    /**
     * 게이트 토글 (열기/닫기)
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * 정답 효과 표시
     */
    showCorrectEffect() {
        this.gateElement.classList.add('gate-correct');
        this.open();

        setTimeout(() => {
            this.gateElement.classList.remove('gate-correct');
        }, 1000);
    }

    /**
     * 오답 효과 표시
     */
    showIncorrectEffect() {
        this.gateElement.classList.add('gate-incorrect');

        setTimeout(() => {
            this.gateElement.classList.remove('gate-incorrect');
        }, 500);
    }

    /**
     * 힌트 효과 표시
     */
    showHint() {
        this.gateElement.classList.add('gate-hint');

        setTimeout(() => {
            this.gateElement.classList.remove('gate-hint');
        }, 3000);
    }

    /**
     * 로딩 효과 표시
     */
    showLoading() {
        this.gateElement.classList.add('gate-loading');
    }

    /**
     * 로딩 효과 숨기기
     */
    hideLoading() {
        this.gateElement.classList.remove('gate-loading');
    }

    /**
     * 게이트 활성화 효과
     */
    activate() {
        this.gateElement.classList.add('gate-active');
    }

    /**
     * 게이트 비활성화
     */
    deactivate() {
        this.gateElement.classList.remove('gate-active');
    }

    /**
     * 게이트 등장 애니메이션
     */
    enter() {
        this.gateElement.classList.add('gate-enter');
        this.activate();

        setTimeout(() => {
            this.gateElement.classList.remove('gate-enter');
        }, 800);
    }

    /**
     * 게이트 사라지는 애니메이션
     */
    exit() {
        this.gateElement.classList.add('gate-exit');

        return new Promise(resolve => {
            setTimeout(() => {
                this.gateElement.classList.remove('gate-exit');
                resolve();
            }, 600);
        });
    }

    /**
     * 게이트 상태 메시지 업데이트
     * @param {string} message - 표시할 메시지
     */
    updateStatus(message) {
        const statusElement = document.getElementById('gateStatusText');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * 게이트 초기화
     */
    reset() {
        this.isOpen = false;
        this.isAnimating = false;
        this.gateElement.className = 'boundary-gate';
        this.updateStatus('게이트가 닫혀있습니다');
    }

    /**
     * 특정 조건에 따라 게이트 자동 제어
     * @param {number} leftNum - 왼쪽 숫자
     * @param {number} rightNum - 오른쪽 숫자
     * @param {string} operator - 'ge' 또는 'le'
     * @returns {boolean} - 조건이 참인지 여부
     */
    checkCondition(leftNum, rightNum, operator) {
        if (operator === 'ge') {
            return leftNum >= rightNum;
        } else if (operator === 'le') {
            return leftNum <= rightNum;
        }
        return false;
    }

    /**
     * 문제에 맞는 게이트 타입 자동 결정
     * @param {number} leftNum - 왼쪽 숫자
     * @param {number} rightNum - 오른쪽 숫자
     * @returns {string} - 'ge' 또는 'le'
     */
    determineCorrectType(leftNum, rightNum) {
        // 간단한 로직: 큰 수가 왼쪽이면 >=, 작은 수가 왼쪽이면 <=
        return leftNum >= rightNum ? 'ge' : 'le';
    }
}

// 전역 인스턴스 생성
let boundaryGate;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    boundaryGate = new BoundaryGate('boundaryGate');
    boundaryGate.enter();
});
