/**
 * Smartphone Simulator
 * Handles smartphone-specific interactions and animations
 */

class SmartphoneSimulator {
    constructor() {
        this.isAnimating = false;
        this.currentProblemIndex = 0;
        this.problems = [];

        this.initEventListeners();
    }

    initEventListeners() {
        // Navigation buttons
        document.getElementById('btn-prev')?.addEventListener('click', () => {
            this.navigateProblem(-1);
        });

        document.getElementById('btn-next')?.addEventListener('click', () => {
            this.navigateProblem(1);
        });

        document.getElementById('btn-check')?.addEventListener('click', () => {
            this.checkAnswer();
        });

        // Touch/swipe simulation (for future enhancement)
        this.setupTouchSimulation();
    }

    setProblems(problems) {
        this.problems = problems;
        this.currentProblemIndex = 0;
    }

    navigateProblem(direction) {
        if (this.isAnimating) return;

        const newIndex = this.currentProblemIndex + direction;

        if (newIndex < 0 || newIndex >= this.problems.length) {
            this.showMessage('마지막 문제입니다.');
            return;
        }

        this.currentProblemIndex = newIndex;
        this.loadProblem(this.problems[newIndex]);
        this.animateTransition(direction);
    }

    loadProblem(problem) {
        // This would be called from the main app
        console.log('Loading problem:', problem);
    }

    animateTransition(direction) {
        this.isAnimating = true;

        const canvas = document.getElementById('graph-canvas');
        const appContent = document.querySelector('.app-content');

        // Slide animation
        appContent.style.transform = `translateX(${direction * 100}%)`;
        appContent.style.opacity = '0';

        setTimeout(() => {
            appContent.style.transition = 'none';
            appContent.style.transform = `translateX(${-direction * 100}%)`;

            setTimeout(() => {
                appContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                appContent.style.transform = 'translateX(0)';
                appContent.style.opacity = '1';

                setTimeout(() => {
                    this.isAnimating = false;
                }, 300);
            }, 50);
        }, 300);
    }

    checkAnswer() {
        this.showMessage('정답 확인 기능은 구현 중입니다.', 'info');
        this.addRippleEffect(event.target);
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 50%;
            transform: translateX(50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    addRippleEffect(element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            width: ${size}px;
            height: ${size}px;
            left: ${event.clientX - rect.left - size/2}px;
            top: ${event.clientY - rect.top - size/2}px;
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    setupTouchSimulation() {
        const canvas = document.getElementById('graph-canvas');

        let touchStartX = 0;
        let touchEndX = 0;

        canvas?.addEventListener('mousedown', (e) => {
            touchStartX = e.clientX;
        });

        canvas?.addEventListener('mouseup', (e) => {
            touchEndX = e.clientX;
            this.handleSwipe(touchStartX, touchEndX);
        });

        // Prevent text selection during drag
        canvas?.addEventListener('dragstart', (e) => e.preventDefault());
    }

    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) < threshold) return;

        if (diff > 0) {
            // Swipe left - next problem
            this.navigateProblem(1);
        } else {
            // Swipe right - previous problem
            this.navigateProblem(-1);
        }
    }

    vibrate(pattern = [100]) {
        // Simulate haptic feedback (only works on mobile devices)
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(50%) translateY(-20px);
            opacity: 0;
        }
    }

    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(2);
            opacity: 0;
        }
    }

    .app-content {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize simulator
const smartphoneSimulator = new SmartphoneSimulator();
