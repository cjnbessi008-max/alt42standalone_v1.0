/**
 * Animation Engine
 * Handles shape decomposition and animation
 */

class AnimationEngine {
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.steps = [];
        this.onStepComplete = null;
        this.onAnimationComplete = null;
    }

    /**
     * Load animation steps
     */
    loadSteps(steps) {
        this.steps = steps;
        this.currentStep = 0;
        debug('Animation steps loaded:', steps.length);
    }

    /**
     * Play animation
     */
    async play() {
        if (this.isPlaying && !this.isPaused) {
            debug('Animation already playing');
            return;
        }

        if (this.isPaused) {
            this.isPaused = false;
            debug('Animation resumed');
            return;
        }

        this.isPlaying = true;
        this.currentStep = 0;
        debug('Animation started');

        await this.playNextStep();
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPaused = true;
        debug('Animation paused');
    }

    /**
     * Reset animation
     */
    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.renderer.clear();
        debug('Animation reset');
    }

    /**
     * Play next step
     */
    async playNextStep() {
        if (!this.isPlaying || this.isPaused) {
            return;
        }

        if (this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];
        debug('Playing step:', this.currentStep, step);

        await this.executeStep(step);

        if (this.onStepComplete) {
            this.onStepComplete(this.currentStep, step);
        }

        this.currentStep++;

        // Wait before next step
        setTimeout(() => this.playNextStep(), 500);
    }

    /**
     * Execute animation step
     */
    async executeStep(step) {
        const { step_type, step_config, description_ko, duration_ms } = step;
        const config = typeof step_config === 'string' ? JSON.parse(step_config) : step_config;

        debug('Executing step:', step_type, config);

        switch (step_type) {
            case 'highlight':
                await this.animateHighlight(config, duration_ms);
                break;

            case 'decompose':
                await this.animateDecompose(config, duration_ms);
                break;

            case 'rotate':
                await this.animateRotate(config, duration_ms);
                break;

            case 'transform':
                await this.animateTransform(config, duration_ms);
                break;

            case 'explain':
                await this.animateExplain(config, description_ko, duration_ms);
                break;

            default:
                debug('Unknown step type:', step_type);
        }
    }

    /**
     * Animate highlight
     */
    async animateHighlight(config, duration) {
        const { element, color } = config;

        return new Promise((resolve) => {
            let opacity = 0;
            const steps = 30;
            const interval = duration / steps;

            const animate = () => {
                opacity += 1 / steps;

                if (opacity >= 1) {
                    opacity = 1;
                    clearInterval(timer);
                    resolve();
                }

                // Redraw with highlight
                this.renderer.clear();
                // Re-draw shape (this would need the current shape data)
                // For now, we'll just draw the highlight effect
            };

            const timer = setInterval(animate, interval);
        });
    }

    /**
     * Animate decompose
     */
    async animateDecompose(config, duration) {
        const { method, parts } = config;

        return new Promise((resolve) => {
            debug('Decomposing:', method, parts);

            // Simulate decomposition animation
            const overlay = document.getElementById('canvasOverlay');
            if (overlay) {
                overlay.textContent = `분해 중: ${parts.join(', ')}`;
            }

            setTimeout(() => {
                if (overlay) {
                    overlay.textContent = '';
                }
                resolve();
            }, duration);
        });
    }

    /**
     * Animate rotate
     */
    async animateRotate(config, duration) {
        const { angle, direction } = config;

        return new Promise((resolve) => {
            let currentAngle = 0;
            const targetAngle = angle || 360;
            const steps = 60;
            const interval = duration / steps;
            const angleStep = targetAngle / steps;

            const animate = () => {
                currentAngle += angleStep;

                if (currentAngle >= targetAngle) {
                    currentAngle = targetAngle;
                    clearInterval(timer);
                    resolve();
                }

                // Apply rotation (would need to save/restore canvas state)
                this.renderer.ctx.save();
                this.renderer.ctx.translate(this.renderer.centerX, this.renderer.centerY);
                this.renderer.ctx.rotate((currentAngle * Math.PI) / 180);
                this.renderer.ctx.translate(-this.renderer.centerX, -this.renderer.centerY);
                // Redraw shape
                this.renderer.ctx.restore();
            };

            const timer = setInterval(animate, interval);
        });
    }

    /**
     * Animate transform
     */
    async animateTransform(config, duration) {
        const { scaleX, scaleY, translateX, translateY } = config;

        return new Promise((resolve) => {
            debug('Transforming:', config);
            setTimeout(resolve, duration);
        });
    }

    /**
     * Animate explain (show text)
     */
    async animateExplain(config, description, duration) {
        const { text } = config;
        const explanationText = text || description;

        return new Promise((resolve) => {
            const overlay = document.getElementById('canvasOverlay');

            if (overlay) {
                overlay.textContent = explanationText;
                overlay.style.display = 'block';
            }

            // Draw text on canvas
            this.renderer.drawText(
                explanationText,
                this.renderer.centerX,
                this.renderer.canvas.height - 30,
                {
                    fontSize: 14,
                    color: '#667eea'
                }
            );

            setTimeout(() => {
                if (overlay) {
                    overlay.textContent = '';
                }
                resolve();
            }, duration);
        });
    }

    /**
     * Complete animation
     */
    complete() {
        this.isPlaying = false;
        this.isPaused = false;
        debug('Animation complete');

        if (this.onAnimationComplete) {
            this.onAnimationComplete();
        }
    }

    /**
     * Get progress percentage
     */
    getProgress() {
        if (this.steps.length === 0) return 0;
        return (this.currentStep / this.steps.length) * 100;
    }
}
