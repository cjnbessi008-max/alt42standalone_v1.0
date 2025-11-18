/**
 * Animation Engine
 * Orchestrates the integration by parts animation sequence
 */

class AnimationEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Robot arms
        this.leftArm = new RobotArm(this.canvas, 60, 150, 'left');
        this.rightArm = new RobotArm(this.canvas, 300, 150, 'right');

        // Animation state
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.currentStep = 0;

        // Formula elements
        this.formula = {
            original: '∫ u dv',
            transformed: 'uv - ∫ v du'
        };

        this.setupCanvas();
    }

    /**
     * Setup canvas
     */
    setupCanvas() {
        // Set canvas size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Clear and draw initial state
        this.clear();
        this.leftArm.draw();
        this.rightArm.draw();
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw text on canvas
     */
    drawText(text, x, y, options = {}) {
        const {
            font = 'bold 20px Arial',
            color = 'white',
            align = 'center',
            baseline = 'middle'
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Main animation sequence
     */
    async playAnimation(problem = null) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.currentStep = 0;

        try {
            await this.animationSequence(problem);
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            this.isPlaying = false;
        }
    }

    /**
     * Animation sequence
     */
    async animationSequence(problem) {
        const baseDuration = 1000 / this.speed;

        // Step 1: Show original formula
        this.currentStep = 1;
        this.clear();
        this.drawText('∫ u dv', 90, 100, { font: 'bold 24px Arial', color: '#FFD700' });
        this.leftArm.draw();
        this.rightArm.draw();
        await this.delay(baseDuration);

        // Step 2: Left arm reaches for formula
        this.currentStep = 2;
        await this.leftArm.moveTo(120, 100, baseDuration);
        this.clear();
        this.drawText('∫ u dv', 90, 100, { font: 'bold 24px Arial', color: '#FFD700' });
        this.leftArm.draw();
        this.rightArm.draw();

        // Step 3: Left arm grabs formula
        this.currentStep = 3;
        await this.leftArm.grab('∫ u dv');
        this.clear();
        this.leftArm.draw();
        this.rightArm.draw();

        // Step 4: Pull gesture
        this.currentStep = 4;
        await this.leftArm.pull(-1);

        // Step 5: Formula transformation begins
        this.currentStep = 5;
        this.clear();
        this.drawText('Transforming...', this.canvas.width / 2, 50, {
            font: 'italic 18px Arial',
            color: '#FFF'
        });
        this.leftArm.draw();
        this.rightArm.draw();
        await this.delay(baseDuration * 0.5);

        // Step 6: Show intermediate step
        this.currentStep = 6;
        this.clear();
        this.drawText('u', 100, 100, { font: 'bold 20px Arial', color: '#FFD700' });
        this.drawText('·', 120, 100, { font: 'bold 20px Arial', color: '#FFF' });
        this.drawText('v', 140, 100, { font: 'bold 20px Arial', color: '#90EE90' });
        this.leftArm.draw();
        this.rightArm.draw();
        await this.delay(baseDuration);

        // Step 7: Right arm appears
        this.currentStep = 7;
        await this.rightArm.moveTo(220, 100, baseDuration);
        this.clear();
        this.drawText('u', 100, 100, { font: 'bold 20px Arial', color: '#FFD700' });
        this.drawText('·', 120, 100, { font: 'bold 20px Arial', color: '#FFF' });
        this.drawText('v', 140, 100, { font: 'bold 20px Arial', color: '#90EE90' });
        this.drawText('-', 180, 100, { font: 'bold 20px Arial', color: '#FFF' });
        this.leftArm.draw();
        this.rightArm.draw();

        // Step 8: Right arm grabs second term
        this.currentStep = 8;
        await this.rightArm.grab('∫ v du');
        this.clear();
        this.drawText('u', 100, 100, { font: 'bold 20px Arial', color: '#FFD700' });
        this.drawText('·', 120, 100, { font: 'bold 20px Arial', color: '#FFF' });
        this.drawText('v', 140, 100, { font: 'bold 20px Arial', color: '#90EE90' });
        this.drawText('-', 180, 100, { font: 'bold 20px Arial', color: '#FFF' });
        this.leftArm.draw();
        this.rightArm.draw();

        // Step 9: Right arm pulls
        this.currentStep = 9;
        await this.rightArm.pull(1);

        // Step 10: Show final formula
        this.currentStep = 10;
        this.clear();
        this.drawText('uv - ∫ v du', this.canvas.width / 2, 100, {
            font: 'bold 26px Arial',
            color: '#00FF00'
        });
        this.leftArm.release();
        this.rightArm.release();
        await this.delay(baseDuration * 0.5);
        this.leftArm.draw();
        this.rightArm.draw();

        // Step 11: Success animation
        this.currentStep = 11;
        await this.successAnimation();

        // Step 12: Return to rest position
        this.currentStep = 12;
        await this.leftArm.moveTo(60, 200, baseDuration);
        await this.rightArm.moveTo(300, 200, baseDuration);
        this.clear();
        this.drawText('✓ Complete!', this.canvas.width / 2, 150, {
            font: 'bold 30px Arial',
            color: '#00FF00'
        });
        this.leftArm.draw();
        this.rightArm.draw();
    }

    /**
     * Success animation (confetti/sparkles)
     */
    async successAnimation() {
        const particles = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: this.canvas.width / 2,
                y: 100,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                size: Math.random() * 5 + 3,
                life: 1.0
            });
        }

        const animateParticles = () => {
            this.clear();

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3; // Gravity
                p.life -= 0.02;

                if (p.life > 0) {
                    this.ctx.fillStyle = p.color;
                    this.ctx.globalAlpha = p.life;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });

            this.ctx.globalAlpha = 1.0;
            this.drawText('uv - ∫ v du', this.canvas.width / 2, 100, {
                font: 'bold 26px Arial',
                color: '#00FF00'
            });
            this.leftArm.draw();
            this.rightArm.draw();

            if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animateParticles);
            }
        };

        animateParticles();
        await this.delay(1000);
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPaused = true;
        gsap.globalTimeline.pause();
    }

    /**
     * Resume animation
     */
    resume() {
        this.isPaused = false;
        gsap.globalTimeline.resume();
    }

    /**
     * Stop animation
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        gsap.globalTimeline.clear();
        this.reset();
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.currentStep = 0;
        this.clear();
        this.leftArm.reset();
        this.rightArm.reset();
        this.leftArm.draw();
        this.rightArm.draw();
    }

    /**
     * Set animation speed
     */
    setSpeed(speed) {
        this.speed = Math.max(0.5, Math.min(2.0, speed));
        gsap.globalTimeline.timeScale(this.speed);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms / this.speed));
    }

    /**
     * Resize handler
     */
    resize() {
        this.setupCanvas();
    }
}
