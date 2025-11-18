/**
 * Wave Minus - 집합 차집합 애니메이션 엔진
 * 집합 간 차집합을 파도처럼 밀려나가는 효과로 시각화
 */

class WaveMinus {
    constructor() {
        this.setA = [];
        this.setB = [];
        this.result = [];
        this.isAnimating = false;
    }

    /**
     * 집합 A와 B를 설정
     * @param {Array} setA - 집합 A의 원소들
     * @param {Array} setB - 집합 B의 원소들
     */
    setSets(setA, setB) {
        this.setA = [...setA];
        this.setB = [...setB];
        this.calculateResult();
    }

    /**
     * 차집합 계산 (A - B)
     */
    calculateResult() {
        this.result = this.setA.filter(item => !this.setB.includes(item));
    }

    /**
     * 집합 A의 원소를 렌더링
     * @param {HTMLElement} container - 렌더링할 컨테이너
     */
    renderSetA(container) {
        container.innerHTML = '';
        this.setA.forEach((item, index) => {
            const element = this.createSetElement(item, index);

            // B에도 포함된 원소는 표시
            if (this.setB.includes(item)) {
                element.classList.add('in-both');
                element.setAttribute('data-in-both', 'true');
            }

            container.appendChild(element);
        });
    }

    /**
     * 집합 B를 렌더링
     * @param {HTMLElement} container - 렌더링할 컨테이너
     */
    renderSetB(container) {
        container.innerHTML = '';
        this.setB.forEach((item, index) => {
            const element = this.createSetElement(item, index);
            container.appendChild(element);
        });
    }

    /**
     * 집합 원소 DOM 요소 생성
     * @param {*} value - 원소 값
     * @param {number} index - 인덱스
     * @returns {HTMLElement}
     */
    createSetElement(value, index) {
        const div = document.createElement('div');
        div.className = 'set-item';
        div.textContent = value;
        div.setAttribute('data-value', value);
        div.setAttribute('data-index', index);
        return div;
    }

    /**
     * 결과 집합 렌더링
     * @param {HTMLElement} container - 렌더링할 컨테이너
     */
    renderResult(container) {
        container.innerHTML = '';
        this.result.forEach((item, index) => {
            const element = this.createSetElement(item, index);
            element.classList.add('result-item');
            container.appendChild(element);
        });
    }

    /**
     * Wave Minus 애니메이션 실행
     * 차집합에서 제거되는 원소들을 파도처럼 순차적으로 제거
     * @param {HTMLElement} containerA - 집합 A 컨테이너
     * @param {HTMLElement} resultContainer - 결과 컨테이너
     * @param {Function} onComplete - 완료 콜백
     */
    async playWaveAnimation(containerA, resultContainer, onComplete) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // 제거될 원소들 찾기 (B에 포함된 원소들)
        const elementsToRemove = Array.from(containerA.children).filter(el =>
            el.getAttribute('data-in-both') === 'true'
        );

        // 파도 효과: 순차적으로 제거
        for (let i = 0; i < elementsToRemove.length; i++) {
            const element = elementsToRemove[i];

            // 파도 딜레이 (각 원소가 순차적으로 밀려남)
            await this.delay(200 * i);

            // Wave 애니메이션 클래스 추가
            element.classList.add('removing');

            // 효과음이나 추가 효과를 여기에 추가 가능
            this.createWaveRipple(element);
        }

        // 모든 애니메이션이 완료될 때까지 대기
        await this.delay(1500);

        // 결과 표시
        this.renderResult(resultContainer);

        // 결과 원소들을 순차적으로 나타냄
        const resultElements = Array.from(resultContainer.children);
        for (let i = 0; i < resultElements.length; i++) {
            await this.delay(100);
            resultElements[i].style.animation = `popIn 0.5s ease-out ${i * 0.1}s forwards`;
        }

        this.isAnimating = false;

        if (onComplete) {
            onComplete();
        }
    }

    /**
     * 파도 효과 시각화 (리플 효과)
     * @param {HTMLElement} element - 대상 원소
     */
    createWaveRipple(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = rect.left + 'px';
        ripple.style.top = rect.top + 'px';
        ripple.style.width = rect.width + 'px';
        ripple.style.height = rect.height + 'px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(102, 126, 234, 0.5)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'rippleExpand 1s ease-out forwards';

        document.body.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }

    /**
     * 지연 함수
     * @param {number} ms - 밀리초
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 랜덤 문제 생성
     * @param {number} minSize - 최소 집합 크기
     * @param {number} maxSize - 최대 집합 크기
     * @param {number} maxValue - 최대 원소 값
     * @returns {Object} {setA, setB}
     */
    static generateRandomProblem(minSize = 5, maxSize = 10, maxValue = 20) {
        const sizeA = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        const sizeB = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

        // 집합 A 생성 (중복 없이)
        const setA = new Set();
        while (setA.size < sizeA) {
            setA.add(Math.floor(Math.random() * maxValue) + 1);
        }

        // 집합 B 생성 (A와 일부 겹치도록)
        const setB = new Set();
        const arrayA = Array.from(setA);

        // A의 일부 원소를 B에 포함 (교집합 생성)
        const numCommon = Math.floor(Math.random() * Math.min(sizeA, sizeB) / 2) + 1;
        for (let i = 0; i < numCommon; i++) {
            const randomIndex = Math.floor(Math.random() * arrayA.length);
            setB.add(arrayA[randomIndex]);
        }

        // B의 나머지 원소 추가
        while (setB.size < sizeB) {
            setB.add(Math.floor(Math.random() * maxValue) + 1);
        }

        return {
            setA: Array.from(setA).sort((a, b) => a - b),
            setB: Array.from(setB).sort((a, b) => a - b)
        };
    }

    /**
     * 초기화
     */
    reset() {
        this.setA = [];
        this.setB = [];
        this.result = [];
        this.isAnimating = false;
    }
}

// CSS 애니메이션 추가 (동적)
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleExpand {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(3);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
