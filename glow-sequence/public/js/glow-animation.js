/**
 * Glow Animation Effects
 * Creates dynamic glowing animations for sequence numbers
 */

class GlowAnimator {
    constructor() {
        this.animations = new Map();
    }

    /**
     * Apply glow effect to an element
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Animation options
     */
    applyGlow(element, options = {}) {
        const {
            color = '#00ffff',
            secondaryColor = '#ff00ff',
            intensity = 1,
            speed = 'medium',
            pattern = 'pulse'
        } = options;

        // Remove existing animation
        this.removeGlow(element);

        // Set up animation based on pattern
        switch (pattern) {
            case 'pulse':
                this.pulsate(element, color, intensity, speed);
                break;
            case 'wave':
                this.wave(element, color, secondaryColor, speed);
                break;
            case 'sparkle':
                this.sparkle(element, color, intensity);
                break;
            case 'rainbow':
                this.rainbow(element, speed);
                break;
            default:
                this.pulsate(element, color, intensity, speed);
        }
    }

    /**
     * Pulsating glow effect
     */
    pulsate(element, color, intensity, speed) {
        const duration = this.getSpeed(speed);
        const keyframes = [
            {
                boxShadow: `0 0 ${10 * intensity}px ${color}, 0 0 ${20 * intensity}px ${color}`,
                transform: 'scale(1)',
                filter: 'brightness(1)'
            },
            {
                boxShadow: `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`,
                transform: 'scale(1.05)',
                filter: 'brightness(1.2)'
            },
            {
                boxShadow: `0 0 ${10 * intensity}px ${color}, 0 0 ${20 * intensity}px ${color}`,
                transform: 'scale(1)',
                filter: 'brightness(1)'
            }
        ];

        const animation = element.animate(keyframes, {
            duration: duration,
            iterations: Infinity,
            easing: 'ease-in-out'
        });

        this.animations.set(element, animation);
    }

    /**
     * Wave glow effect with color transition
     */
    wave(element, color1, color2, speed) {
        const duration = this.getSpeed(speed);
        const keyframes = [
            {
                boxShadow: `0 0 15px ${color1}, 0 0 30px ${color1}`,
                borderColor: color1
            },
            {
                boxShadow: `0 0 15px ${color2}, 0 0 30px ${color2}`,
                borderColor: color2
            },
            {
                boxShadow: `0 0 15px ${color1}, 0 0 30px ${color1}`,
                borderColor: color1
            }
        ];

        const animation = element.animate(keyframes, {
            duration: duration,
            iterations: Infinity,
            easing: 'ease-in-out'
        });

        this.animations.set(element, animation);
    }

    /**
     * Sparkle effect
     */
    sparkle(element, color, intensity) {
        const sparkleInterval = setInterval(() => {
            const spark = document.createElement('div');
            spark.className = 'sparkle';
            spark.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 10px ${color};
            `;

            const rect = element.getBoundingClientRect();
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height;

            spark.style.left = x + 'px';
            spark.style.top = y + 'px';

            element.style.position = 'relative';
            element.appendChild(spark);

            // Animate sparkle
            spark.animate([
                { opacity: 0, transform: 'scale(0)' },
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0) translateY(-20px)' }
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                spark.remove();
            };
        }, 300);

        this.animations.set(element, { type: 'interval', ref: sparkleInterval });
    }

    /**
     * Rainbow glow effect
     */
    rainbow(element, speed) {
        const duration = this.getSpeed(speed) * 2;
        const colors = [
            '#ff0000', // red
            '#ff7f00', // orange
            '#ffff00', // yellow
            '#00ff00', // green
            '#0000ff', // blue
            '#4b0082', // indigo
            '#9400d3'  // violet
        ];

        const keyframes = colors.map(color => ({
            boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
            borderColor: color
        }));

        const animation = element.animate(keyframes, {
            duration: duration,
            iterations: Infinity,
            easing: 'linear'
        });

        this.animations.set(element, animation);
    }

    /**
     * Remove glow effect from element
     */
    removeGlow(element) {
        const animation = this.animations.get(element);
        if (animation) {
            if (animation.type === 'interval') {
                clearInterval(animation.ref);
            } else {
                animation.cancel();
            }
            this.animations.delete(element);
        }
    }

    /**
     * Convert speed string to milliseconds
     */
    getSpeed(speed) {
        const speeds = {
            slow: 3000,
            medium: 1500,
            fast: 800
        };
        return speeds[speed] || speeds.medium;
    }

    /**
     * Animate sequence reveal
     * @param {Array} elements - Array of elements to animate
     * @param {Object} options - Animation options
     */
    async animateSequenceReveal(elements, options = {}) {
        const {
            delay = 200,
            color = '#00ffff',
            stagger = true
        } = options;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            // Initial state
            element.style.opacity = '0';
            element.style.transform = 'scale(0.5)';

            // Animate in
            await new Promise(resolve => {
                setTimeout(() => {
                    element.animate([
                        { opacity: 0, transform: 'scale(0.5)' },
                        { opacity: 1, transform: 'scale(1.1)' },
                        { opacity: 1, transform: 'scale(1)' }
                    ], {
                        duration: 500,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });

                    // Apply glow
                    this.applyGlow(element, { color, pattern: 'pulse' });

                    resolve();
                }, stagger ? i * delay : 0);
            });
        }
    }

    /**
     * Create particle burst effect
     */
    createParticleBurst(element, color = '#00ffff', count = 20) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${centerX}px;
                top: ${centerY}px;
                box-shadow: 0 0 10px ${color};
            `;

            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / count;
            const velocity = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${tx}px, ${ty}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }

    /**
     * Clear all animations
     */
    clearAll() {
        this.animations.forEach((animation, element) => {
            this.removeGlow(element);
        });
        this.animations.clear();
    }
}

// Create global instance
const glowAnimator = new GlowAnimator();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlowAnimator;
}
