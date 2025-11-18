/**
 * Next Term Vision - Animation Component
 * 수열 애니메이션 관리 클래스
 */

class NextTermAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.animationTypes = ['slide', 'fade', 'bounce', 'grow'];
        this.currentAnimation = 'slide';
    }

    /**
     * 수열 표시 및 애니메이션
     * @param {Array<number>} sequence - 수열 배열
     * @param {string} animationType - 애니메이션 타입
     */
    displaySequence(sequence, animationType = 'slide') {
        if (!this.container) return;

        this.currentAnimation = animationType;
        this.container.innerHTML = '';

        sequence.forEach((num, index) => {
            setTimeout(() => {
                this.addSequenceItem(num, index, false);
            }, index * 150); // 각 항목을 150ms 간격으로 표시
        });

        // 다음 항 표시 (물음표)
        setTimeout(() => {
            this.addSequenceItem('?', sequence.length, true);
        }, sequence.length * 150 + 200);
    }

    /**
     * 수열 항목 추가
     * @param {number|string} value - 표시할 값
     * @param {number} index - 인덱스
     * @param {boolean} isNext - 다음 항 여부
     */
    addSequenceItem(value, index, isNext = false) {
        const item = document.createElement('div');
        item.className = 'sequence-item';

        if (isNext) {
            item.classList.add('next-item');
        }

        // 애니메이션 클래스 추가
        item.classList.add(`animate-${this.currentAnimation}`);

        item.textContent = value;
        item.style.animationDelay = '0s';

        this.container.appendChild(item);

        // 음성 효과 (선택적)
        this.playSound('pop');
    }

    /**
     * 정답 표시 애니메이션
     * @param {number} answer - 정답
     * @param {boolean} isCorrect - 정답 여부
     */
    revealAnswer(answer, isCorrect) {
        const nextItem = this.container.querySelector('.next-item');
        if (!nextItem) return;

        // 애니메이션 효과
        nextItem.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        if (isCorrect) {
            // 정답일 때
            nextItem.textContent = answer;
            nextItem.style.background = 'linear-gradient(135deg, #52c41a, #95de64)';
            nextItem.style.transform = 'scale(1.2) rotate(360deg)';

            // 축하 파티클 효과
            this.celebrateParticles(nextItem);
            this.playSound('success');

            setTimeout(() => {
                nextItem.style.transform = 'scale(1) rotate(0deg)';
            }, 500);
        } else {
            // 오답일 때
            nextItem.style.background = 'linear-gradient(135deg, #f5222d, #ff7875)';
            nextItem.style.animation = 'shake 0.5s';
            this.playSound('error');

            setTimeout(() => {
                nextItem.style.animation = '';
                nextItem.textContent = '?';
                nextItem.style.background = 'linear-gradient(135deg, #ffd89b, #19547b)';
            }, 1000);
        }
    }

    /**
     * 축하 파티클 효과
     * @param {HTMLElement} element
     */
    celebrateParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 100 + Math.random() * 100;

            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
            `;

            document.body.appendChild(particle);

            const endX = centerX + Math.cos(angle) * velocity;
            const endY = centerY + Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }

    /**
     * 힌트 표시 애니메이션
     * @param {string} hintText
     */
    showHint(hintText) {
        const hintElement = document.getElementById('hintText');
        if (!hintElement) return;

        hintElement.textContent = hintText;
        hintElement.style.display = 'block';
        hintElement.style.animation = 'fadeInScale 0.5s ease-out';

        this.playSound('hint');
    }

    /**
     * 힌트 숨기기
     */
    hideHint() {
        const hintElement = document.getElementById('hintText');
        if (!hintElement) return;

        hintElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            hintElement.style.display = 'none';
        }, 300);
    }

    /**
     * 로딩 애니메이션
     * @param {boolean} show
     */
    showLoading(show) {
        const loading = document.getElementById('loadingIndicator');
        const content = document.getElementById('problemContent');

        if (show) {
            loading.style.display = 'block';
            content.style.display = 'none';
        } else {
            loading.style.display = 'none';
            content.style.display = 'block';
            content.style.animation = 'fadeIn 0.5s ease-out';
        }
    }

    /**
     * 문제 유형 레이블 업데이트
     * @param {string} type
     */
    updateProblemType(type) {
        const typeLabel = document.getElementById('problemTypeLabel');
        if (!typeLabel) return;

        const typeNames = {
            'arithmetic': '산술 수열',
            'geometric': '기하 수열',
            'fibonacci': '피보나치 수열',
            'pattern': '패턴 수열'
        };

        typeLabel.textContent = typeNames[type] || '수열 문제';
        typeLabel.style.animation = 'pulse 0.5s';
    }

    /**
     * 효과음 재생
     * @param {string} soundType
     */
    playSound(soundType) {
        // Web Audio API를 사용한 간단한 비프음 생성
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 소리 유형별 설정
        switch (soundType) {
            case 'pop':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;

            case 'success':
                // 성공 멜로디
                const frequencies = [523.25, 659.25, 783.99]; // C, E, G
                frequencies.forEach((freq, index) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.2);
                    osc.start(audioContext.currentTime + index * 0.15);
                    osc.stop(audioContext.currentTime + index * 0.15 + 0.2);
                });
                break;

            case 'error':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;

            case 'hint':
                oscillator.frequency.value = 1000;
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
        }
    }

    /**
     * 컨테이너 초기화
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 전역 인스턴스 생성
const animation = new NextTermAnimation('sequenceDisplay');
