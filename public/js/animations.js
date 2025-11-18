/**
 * Animation System
 */

class ShapeAnimator {
    constructor(shape) {
        this.shape = shape;
        this.isAnimating = false;
        this.currentAnimation = null;
    }

    /**
     * Animate shape property
     */
    animate(options) {
        const {
            property,
            from,
            to,
            duration = CONFIG.ANIMATION.DURATION,
            easing = CONFIG.ANIMATION.EASING,
            onUpdate = null,
            onComplete = null
        } = options;

        if (this.isAnimating) {
            Utils.log('Animation already in progress, queuing...');
        }

        this.isAnimating = true;
        this.shape.isAnimating = true;

        const startTime = performance.now();
        const easingFunc = EASING[easing] || EASING.linear;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFunc(progress);

            // Calculate current value
            const currentValue = from + (to - from) * easedProgress;

            // Update shape property
            this.shape[property] = currentValue;

            // Call update callback
            if (onUpdate) {
                onUpdate(currentValue, progress);
            }

            // Continue or complete
            if (progress < 1) {
                this.currentAnimation = requestAnimationFrame(step);
            } else {
                this.isAnimating = false;
                this.shape.isAnimating = false;
                this.currentAnimation = null;

                if (onComplete) {
                    onComplete();
                }
            }
        };

        this.currentAnimation = requestAnimationFrame(step);
    }

    /**
     * Stop current animation
     */
    stop() {
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
            this.currentAnimation = null;
            this.isAnimating = false;
            this.shape.isAnimating = false;
        }
    }

    /**
     * Rotate shape
     */
    rotate(degrees = 360, duration = 1500) {
        const currentRotation = this.shape.rotation;
        const targetRotation = currentRotation + Utils.degToRad(degrees);

        this.animate({
            property: 'rotation',
            from: currentRotation,
            to: targetRotation,
            duration: duration,
            easing: 'easeInOutQuad'
        });
    }

    /**
     * Scale shape
     */
    scaleShape(factor = 1.5, duration = 1000) {
        const currentScale = this.shape.scale;

        this.animate({
            property: 'scale',
            from: currentScale,
            to: factor,
            duration: duration / 2,
            easing: 'easeOutQuad',
            onComplete: () => {
                this.animate({
                    property: 'scale',
                    from: factor,
                    to: currentScale,
                    duration: duration / 2,
                    easing: 'easeInQuad'
                });
            }
        });
    }

    /**
     * Move shape
     */
    move(targetX, targetY, duration = 800) {
        const startX = this.shape.x;
        const startY = this.shape.y;

        this.animate({
            property: 'x',
            from: startX,
            to: targetX,
            duration: duration,
            easing: 'easeInOutCubic'
        });

        // Animate Y separately (parallel animation)
        const yAnimator = new ShapeAnimator(this.shape);
        yAnimator.animate({
            property: 'y',
            from: startY,
            to: targetY,
            duration: duration,
            easing: 'easeInOutCubic'
        });
    }

    /**
     * Morph shape (color change as simple morph)
     */
    morph(targetColor, duration = 2000) {
        const startColor = this.hexToRgb(this.shape.color);
        const endColor = this.hexToRgb(targetColor);

        if (!startColor || !endColor) return;

        this.animate({
            property: '_morphProgress',
            from: 0,
            to: 1,
            duration: duration,
            easing: 'easeInOutCubic',
            onUpdate: (value) => {
                const r = Math.round(startColor.r + (endColor.r - startColor.r) * value);
                const g = Math.round(startColor.g + (endColor.g - startColor.g) * value);
                const b = Math.round(startColor.b + (endColor.b - startColor.b) * value);
                this.shape.color = this.rgbToHex(r, g, b);
            },
            onComplete: () => {
                this.shape.color = targetColor;
            }
        });
    }

    /**
     * Skew effect (using rotation with scaling)
     */
    skew(duration = 1200) {
        const steps = [
            { rotation: Utils.degToRad(15), scale: 1.1 },
            { rotation: Utils.degToRad(-15), scale: 0.9 },
            { rotation: 0, scale: 1 }
        ];

        let currentStep = 0;

        const animateStep = () => {
            if (currentStep >= steps.length) return;

            const step = steps[currentStep];
            this.animate({
                property: 'rotation',
                from: this.shape.rotation,
                to: step.rotation,
                duration: duration / steps.length,
                easing: 'easeInOutQuad'
            });

            const scaleAnimator = new ShapeAnimator(this.shape);
            scaleAnimator.animate({
                property: 'scale',
                from: this.shape.scale,
                to: step.scale,
                duration: duration / steps.length,
                easing: 'easeInOutQuad',
                onComplete: () => {
                    currentStep++;
                    animateStep();
                }
            });
        };

        animateStep();
    }

    /**
     * Reflect (flip horizontally)
     */
    reflect(duration = 1000) {
        const currentScale = this.shape.scale;

        // Shrink to thin line
        this.animate({
            property: 'scale',
            from: currentScale,
            to: 0.1,
            duration: duration / 2,
            easing: 'easeInQuad',
            onComplete: () => {
                // Expand back
                this.animate({
                    property: 'scale',
                    from: 0.1,
                    to: currentScale,
                    duration: duration / 2,
                    easing: 'easeOutQuad'
                });
            }
        });
    }

    /**
     * Bounce effect
     */
    bounce(duration = 1000) {
        const startY = this.shape.y;
        const bounceHeight = 50;

        const bounces = [
            { y: startY - bounceHeight, duration: duration * 0.3 },
            { y: startY, duration: duration * 0.2 },
            { y: startY - bounceHeight * 0.5, duration: duration * 0.2 },
            { y: startY, duration: duration * 0.15 },
            { y: startY - bounceHeight * 0.25, duration: duration * 0.1 },
            { y: startY, duration: duration * 0.05 }
        ];

        let currentBounce = 0;

        const animateBounce = () => {
            if (currentBounce >= bounces.length) return;

            const bounce = bounces[currentBounce];
            this.animate({
                property: 'y',
                from: this.shape.y,
                to: bounce.y,
                duration: bounce.duration,
                easing: currentBounce % 2 === 0 ? 'easeOutQuad' : 'easeInQuad',
                onComplete: () => {
                    currentBounce++;
                    animateBounce();
                }
            });
        };

        animateBounce();
    }

    /**
     * Pulse with color change
     */
    pulseWithColor(targetColor, duration = 1000) {
        const originalScale = this.shape.scale;
        const originalColor = this.shape.color;

        // Scale up
        this.scaleShape(1.3, duration);

        // Change color
        setTimeout(() => {
            this.morph(targetColor, duration / 2);
        }, duration / 4);

        // Revert color
        setTimeout(() => {
            this.morph(originalColor, duration / 2);
        }, duration * 0.75);
    }

    /**
     * Helper: Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Helper: Convert RGB to hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

// Transformation presets
const Transformations = {
    rotate: (animator) => animator.rotate(360, 1500),
    scale: (animator) => animator.scaleShape(1.5, 1000),
    translate: (animator) => {
        const canvas = document.getElementById('shapeCanvas');
        const newX = Math.random() * (canvas.width - 100) + 50;
        const newY = Math.random() * (canvas.height - 100) + 50;
        animator.move(newX, newY, 800);
    },
    morph: (animator) => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        animator.morph(randomColor, 2000);
    },
    skew: (animator) => animator.skew(1200),
    reflect: (animator) => animator.reflect(1000)
};
