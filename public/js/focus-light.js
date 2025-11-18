/**
 * Focus Light 웹앱 - Focus Light 모듈
 * 도형의 핵심 조건을 밝게 강조하는 기능
 */

const FocusLight = {
    activeHighlights: [],

    /**
     * 하이라이트 적용
     */
    applyHighlight(element, intensity, animationType) {
        console.log('Focus Light 적용:', element.element_selector, intensity, animationType);

        // 선택자로 요소 찾기
        const targetElements = document.querySelectorAll(element.element_selector);

        if (targetElements.length === 0) {
            console.warn('요소를 찾을 수 없음:', element.element_selector);
            return;
        }

        targetElements.forEach(targetElement => {
            // 기존 클래스 제거
            this.removeHighlightClasses(targetElement);

            // 색상 설정
            const color = element.highlight_color || '#FFD700';
            targetElement.style.stroke = color;
            targetElement.style.color = color;

            // 기본 하이라이트 클래스
            targetElement.classList.add('focus-highlighted');

            // 강도 클래스 추가
            targetElement.classList.add(`focus-intensity-${intensity}`);

            // 애니메이션 타입 클래스 추가
            const animationClass = this.getAnimationClass(animationType);
            if (animationClass) {
                targetElement.classList.add(animationClass);
            }

            // 색상 클래스 추가
            const colorClass = this.getColorClass(color);
            if (colorClass) {
                targetElement.classList.add(colorClass);
            }

            // 추적
            this.activeHighlights.push({
                element: targetElement,
                focusElement: element
            });
        });
    },

    /**
     * 애니메이션 클래스 가져오기
     */
    getAnimationClass(type) {
        const map = {
            'glow': 'focus-glow',
            'pulse': 'focus-pulse',
            'flash': 'focus-flash',
            'static': 'focus-static'
        };
        return map[type] || 'focus-glow';
    },

    /**
     * 색상 클래스 가져오기
     */
    getColorClass(color) {
        const colorMap = {
            '#FFD700': 'focus-color-gold',
            '#FF6B6B': 'focus-color-red',
            '#4ECDC4': 'focus-color-blue',
            '#9B59B6': 'focus-color-purple',
            '#50C878': 'focus-color-green',
            '#F39C12': 'focus-color-orange'
        };
        return colorMap[color.toUpperCase()] || null;
    },

    /**
     * 하이라이트 클래스 제거
     */
    removeHighlightClasses(element) {
        const classes = [
            'focus-highlighted',
            'focus-glow',
            'focus-pulse',
            'focus-flash',
            'focus-static',
            'focus-intensity-1',
            'focus-intensity-2',
            'focus-intensity-3',
            'focus-intensity-4',
            'focus-intensity-5',
            'focus-color-gold',
            'focus-color-red',
            'focus-color-blue',
            'focus-color-purple',
            'focus-color-green',
            'focus-color-orange'
        ];

        classes.forEach(cls => element.classList.remove(cls));
    },

    /**
     * 모든 하이라이트 제거
     */
    removeAllHighlights() {
        console.log('모든 Focus Light 제거');

        this.activeHighlights.forEach(({ element }) => {
            this.removeHighlightClasses(element);
            element.style.stroke = '';
            element.style.color = '';
        });

        this.activeHighlights = [];

        // 라벨도 제거
        const labelsContainer = document.getElementById('focus-labels');
        if (labelsContainer) {
            labelsContainer.innerHTML = '';
        }
    },

    /**
     * 특정 하이라이트 업데이트
     */
    updateHighlight(selector, intensity, animationType) {
        const targetElements = document.querySelectorAll(selector);

        targetElements.forEach(element => {
            // 기존 애니메이션/강도 클래스 제거
            element.classList.remove('focus-glow', 'focus-pulse', 'focus-flash', 'focus-static');
            for (let i = 1; i <= 5; i++) {
                element.classList.remove(`focus-intensity-${i}`);
            }

            // 새 클래스 추가
            element.classList.add(`focus-intensity-${intensity}`);
            element.classList.add(this.getAnimationClass(animationType));
        });
    },

    /**
     * 순차적 하이라이트 (여러 요소를 순서대로 강조)
     */
    applySequentialHighlights(elements, intensity, delay = 1000) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.applyHighlight(element, intensity, 'glow');
            }, index * delay);
        });
    },

    /**
     * 하이라이트 깜빡임 (주의를 끌기 위해)
     */
    blinkHighlight(selector, times = 3) {
        const elements = document.querySelectorAll(selector);
        let count = 0;

        const interval = setInterval(() => {
            elements.forEach(element => {
                element.style.opacity = element.style.opacity === '0' ? '1' : '0';
            });

            count++;
            if (count >= times * 2) {
                clearInterval(interval);
                elements.forEach(element => {
                    element.style.opacity = '1';
                });
            }
        }, 300);
    },

    /**
     * 하이라이트 강도 변경 (애니메이션)
     */
    animateIntensity(selector, fromIntensity, toIntensity, duration = 1000) {
        const elements = document.querySelectorAll(selector);
        const steps = Math.abs(toIntensity - fromIntensity);
        const stepDuration = duration / steps;
        const direction = toIntensity > fromIntensity ? 1 : -1;

        let currentIntensity = fromIntensity;

        const interval = setInterval(() => {
            currentIntensity += direction;

            elements.forEach(element => {
                for (let i = 1; i <= 5; i++) {
                    element.classList.remove(`focus-intensity-${i}`);
                }
                element.classList.add(`focus-intensity-${currentIntensity}`);
            });

            if (currentIntensity === toIntensity) {
                clearInterval(interval);
            }
        }, stepDuration);
    },

    /**
     * 호버 이벤트 추가
     */
    addHoverEffects() {
        const focusElements = document.querySelectorAll('.focus-highlighted');

        focusElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.transition = 'transform 0.3s ease';
            });

            element.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1)';
            });
        });
    },

    /**
     * 강조 요소에 툴팁 추가
     */
    addTooltip(selector, text) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            element.setAttribute('title', text);

            // SVG 요소의 경우 title 태그 추가
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = text;
            element.appendChild(title);
        });
    },

    /**
     * 클릭 이벤트 추가 (상호작용)
     */
    addClickHandler(selector, callback) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', callback);
        });
    },

    /**
     * 특수 효과: 레이더 스캔
     */
    radarScan(selector, duration = 2000) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            element.classList.add('focus-radar');

            setTimeout(() => {
                element.classList.remove('focus-radar');
            }, duration);
        });
    },

    /**
     * 특수 효과: 반짝임
     */
    sparkle(selector, duration = 2000) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            element.classList.add('focus-sparkle');

            setTimeout(() => {
                element.classList.remove('focus-sparkle');
            }, duration);
        });
    },

    /**
     * 그룹 하이라이트 (관련된 요소들을 함께 강조)
     */
    highlightGroup(selectors, intensity, animationType) {
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.removeHighlightClasses(element);
                element.classList.add('focus-highlighted');
                element.classList.add(`focus-intensity-${intensity}`);
                element.classList.add(this.getAnimationClass(animationType));
            });
        });
    },

    /**
     * 하이라이트 상태 가져오기
     */
    getActiveHighlights() {
        return this.activeHighlights;
    },

    /**
     * 디버그: 모든 Focus 대상 표시
     */
    debugShowAllTargets() {
        const targets = document.querySelectorAll('.focus-target');
        console.log('Focus 대상 요소:', targets.length, '개');

        targets.forEach((target, index) => {
            console.log(`${index + 1}:`, target.className, target.dataset);
            target.style.outline = '2px dashed red';
        });
    }
};

// 전역으로 노출
window.FocusLight = FocusLight;

// 페이지 로드 후 호버 효과 활성화
document.addEventListener('DOMContentLoaded', () => {
    // 호버 효과는 나중에 추가될 요소에도 적용되도록 이벤트 위임 사용
    document.addEventListener('mouseenter', (e) => {
        if (e.target.classList.contains('focus-highlighted')) {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.transformOrigin = 'center';
        }
    }, true);

    document.addEventListener('mouseleave', (e) => {
        if (e.target.classList.contains('focus-highlighted')) {
            e.target.style.transform = 'scale(1)';
        }
    }, true);
});
