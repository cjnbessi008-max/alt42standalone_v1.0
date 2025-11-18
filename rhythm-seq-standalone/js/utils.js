/**
 * Utility Functions
 * Helper functions used throughout the app
 */

const Utils = {
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <strong>${icons[type] || 'ℹ'}</strong>
            ${message}
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => container.removeChild(toast), 300);
        }, duration);
    },

    /**
     * Format time (HH:MM)
     */
    formatTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    /**
     * Shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get difficulty label
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            easy: { text: '쉬움', color: '#48bb78' },
            medium: { text: '보통', color: '#ed8936' },
            hard: { text: '어려움', color: '#f56565' }
        };
        return labels[difficulty] || labels.medium;
    },

    /**
     * Calculate sequence pattern
     */
    analyzeSequence(sequence) {
        if (sequence.length < 2) return { type: 'unknown' };

        // Check arithmetic sequence
        const diff1 = sequence[1] - sequence[0];
        const isArithmetic = sequence.every((num, i) => {
            if (i === 0) return true;
            return (num - sequence[i - 1]) === diff1;
        });

        if (isArithmetic) {
            return {
                type: 'arithmetic',
                commonDifference: diff1
            };
        }

        // Check geometric sequence
        if (sequence[0] !== 0) {
            const ratio = sequence[1] / sequence[0];
            const isGeometric = sequence.every((num, i) => {
                if (i === 0) return true;
                return Math.abs((num / sequence[i - 1]) - ratio) < 0.0001;
            });

            if (isGeometric) {
                return {
                    type: 'geometric',
                    commonRatio: ratio
                };
            }
        }

        // Check Fibonacci
        const isFibonacci = sequence.every((num, i) => {
            if (i < 2) return true;
            return num === sequence[i - 1] + sequence[i - 2];
        });

        if (isFibonacci) {
            return { type: 'fibonacci' };
        }

        return { type: 'special' };
    },

    /**
     * Generate confetti effect
     */
    createConfetti() {
        const colors = ['#667eea', '#f093fb', '#4facfe', '#48bb78', '#ed8936'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';

            document.body.appendChild(confetti);

            const fallDuration = 2000 + Math.random() * 1000;
            const fallDistance = window.innerHeight + 20;
            const horizontalDrift = (Math.random() - 0.5) * 200;

            confetti.animate([
                {
                    transform: `translate(0, 0) rotate(0deg)`,
                    opacity: 1
                },
                {
                    transform: `translate(${horizontalDrift}px, ${fallDistance}px) rotate(${Math.random() * 720}deg)`,
                    opacity: 0
                }
            ], {
                duration: fallDuration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                document.body.removeChild(confetti);
            };
        }
    },

    /**
     * Parse URL parameters
     */
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    },

    /**
     * Map number to musical note
     */
    numberToNote(num) {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octave = Math.floor(num / 10) + 3;
        const noteIndex = num % 7;
        return `${notes[noteIndex]}${Math.min(octave, 7)}`;
    },

    /**
     * Calculate color based on value
     */
    valueToColor(value, max) {
        const hue = (value / max) * 360;
        return `hsl(${hue}, 70%, 60%)`;
    },

    /**
     * Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if device supports touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * Get random element from array
     */
    randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Clamp number between min and max
     */
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
};

// Add slideOut animation to stylesheet
if (!document.getElementById('utils-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-styles';
    style.textContent = `
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
