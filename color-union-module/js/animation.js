/**
 * Animation Helper Functions
 * Advanced animations for Color Union visual effects
 */

const AnimationHelper = {
    /**
     * Create ripple effect
     */
    createRipple(element, x, y, color) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = color;

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    /**
     * Animate number counting
     */
    animateNumber(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    },

    /**
     * Morph between two colors with intermediate steps
     */
    morphColors(fromColor, toColor, steps, callback) {
        const from = this.hexToRgb(fromColor);
        const to = this.hexToRgb(toColor);

        const stepR = (to.r - from.r) / steps;
        const stepG = (to.g - from.g) / steps;
        const stepB = (to.b - from.b) / steps;

        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep >= steps) {
                clearInterval(interval);
                return;
            }

            const r = Math.round(from.r + (stepR * currentStep));
            const g = Math.round(from.g + (stepG * currentStep));
            const b = Math.round(from.b + (stepB * currentStep));

            const color = this.rgbToHex(r, g, b);
            callback(color, currentStep, steps);

            currentStep++;
        }, 50);
    },

    /**
     * Create floating elements animation
     */
    createFloatingElements(container, elements, duration) {
        elements.forEach((el, index) => {
            const floatingEl = document.createElement('div');
            floatingEl.className = 'floating-element';
            floatingEl.textContent = el;
            floatingEl.style.left = `${Math.random() * 80 + 10}%`;
            floatingEl.style.animationDelay = `${index * 0.1}s`;
            floatingEl.style.animationDuration = `${duration}ms`;

            container.appendChild(floatingEl);

            setTimeout(() => {
                floatingEl.remove();
            }, duration);
        });
    },

    /**
     * Shake animation for incorrect answer
     */
    shake(element) {
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    },

    /**
     * Success celebration animation
     */
    celebrate(container) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'];

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = `${Math.random() * 0.3}s`;

                container.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 50);
        }
    },

    /**
     * Pulse effect for highlighting
     */
    pulse(element, count = 3) {
        let pulseCount = 0;
        const interval = setInterval(() => {
            if (pulseCount >= count) {
                clearInterval(interval);
                element.style.transform = 'scale(1)';
                return;
            }

            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);

            pulseCount++;
        }, 400);
    },

    /**
     * Utility: hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Utility: RGB to hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Smooth scroll to element
     */
    smoothScrollTo(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
};

// Add CSS for animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .ripple {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        opacity: 0.6;
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(3);
            opacity: 0;
        }
    }

    .floating-element {
        position: absolute;
        font-size: 24px;
        font-weight: bold;
        color: white;
        animation: float-up 2s ease-out forwards;
        pointer-events: none;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    @keyframes float-up {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
        }
    }

    .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        animation: confetti-fall 2s ease-out forwards;
        pointer-events: none;
        z-index: 9999;
    }

    @keyframes confetti-fall {
        0% {
            top: -10%;
            transform: rotateZ(0deg);
        }
        100% {
            top: 100%;
            transform: rotateZ(360deg);
        }
    }
`;
document.head.appendChild(style);
