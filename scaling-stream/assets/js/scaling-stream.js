/**
 * Scaling Stream Visualization Engine
 * Handles the visual representation of similarity scaling
 */

class ScalingStream {
    constructor() {
        this.scaleFactor = 1.0;
        this.minScale = 0.1;
        this.maxScale = 10.0;
        this.isStreaming = false;
        this.isPaused = false;
        this.currentQuestion = null;
        this.animationFrame = null;
        this.streamInterval = null;
        this.shapeType = 'square'; // square, circle, triangle, star
    }

    /**
     * Initialize the scaling stream
     */
    init() {
        this.scaledShape = document.getElementById('scaledShape');
        this.originalShape = document.getElementById('originalShape');
        this.scaleIndicator = document.getElementById('scaleValue');
        this.scaleProgress = document.getElementById('scaleProgress');

        console.log('[ScalingStream] Initialized');
    }

    /**
     * Set current question
     */
    setQuestion(question) {
        this.currentQuestion = question;
        console.log('[ScalingStream] Question set:', question);
    }

    /**
     * Start streaming animation
     */
    startStream() {
        if (this.isStreaming && !this.isPaused) {
            console.log('[ScalingStream] Already streaming');
            return;
        }

        this.isStreaming = true;
        this.isPaused = false;

        // Add streaming class for animations
        this.scaledShape.classList.add('streaming');
        this.originalShape.classList.add('pulse');

        // Animate scaling
        this.streamInterval = setInterval(() => {
            if (!this.isPaused) {
                this.animateScale();
            }
        }, 50);

        console.log('[ScalingStream] Streaming started');
    }

    /**
     * Pause streaming
     */
    pauseStream() {
        this.isPaused = !this.isPaused;
        console.log('[ScalingStream] Paused:', this.isPaused);
    }

    /**
     * Stop streaming
     */
    stopStream() {
        this.isStreaming = false;
        this.isPaused = false;

        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Remove animation classes
        this.scaledShape.classList.remove('streaming');
        this.originalShape.classList.remove('pulse');

        console.log('[ScalingStream] Streaming stopped');
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.stopStream();
        this.scaleFactor = 1.0;
        this.updateScale(1.0);
        console.log('[ScalingStream] Reset');
    }

    /**
     * Animate scale factor
     */
    animateScale() {
        // Oscillate scale factor using sine wave
        const time = Date.now() / 1000;
        const amplitude = 0.5;
        const frequency = 0.5;

        this.scaleFactor = 1.0 + amplitude * Math.sin(2 * Math.PI * frequency * time);
        this.updateScale(this.scaleFactor);
    }

    /**
     * Update scale visualization
     */
    updateScale(scale) {
        if (!this.scaledShape) return;

        this.scaleFactor = Math.max(this.minScale, Math.min(this.maxScale, scale));

        // Apply transform
        this.scaledShape.style.transform = `scale(${this.scaleFactor})`;

        // Update indicator
        if (this.scaleIndicator) {
            this.scaleIndicator.textContent = `${this.scaleFactor.toFixed(2)}x`;
        }

        // Update progress bar (normalized to 0-100%)
        if (this.scaleProgress) {
            const normalized = ((this.scaleFactor - this.minScale) / (this.maxScale - this.minScale)) * 100;
            this.scaleProgress.style.width = `${normalized}%`;
        }

        // Create particles at significant scale changes
        if (Math.abs(this.scaleFactor - 1.0) > 0.4) {
            this.createParticle();
        }
    }

    /**
     * Create particle effect
     */
    createParticle() {
        if (!this.scaledShape || Math.random() > 0.1) return; // 10% chance

        const particle = document.createElement('div');
        particle.className = 'particle';

        const rect = this.scaledShape.getBoundingClientRect();
        const containerRect = this.scaledShape.parentElement.getBoundingClientRect();

        particle.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;

        this.scaledShape.parentElement.appendChild(particle);

        setTimeout(() => particle.remove(), 2000);
    }

    /**
     * Set shape type
     */
    setShapeType(type) {
        const validTypes = ['square', 'circle', 'triangle', 'star'];
        if (!validTypes.includes(type)) {
            console.warn(`[ScalingStream] Invalid shape type: ${type}`);
            return;
        }

        this.shapeType = type;

        // Remove all shape classes
        validTypes.forEach(t => {
            this.scaledShape.classList.remove(t);
            this.originalShape.classList.remove(t);
        });

        // Add new shape class
        if (type !== 'square') {
            this.scaledShape.classList.add(type);
            this.originalShape.classList.add(type);
        }

        console.log(`[ScalingStream] Shape changed to: ${type}`);
    }

    /**
     * Calculate and display similarity
     */
    async calculateSimilarity(question1Id, question2Id) {
        try {
            const result = await api.calculateSimilarity(question1Id, question2Id);

            if (result.success) {
                const similarity = result.data.similarity;

                // Update UI
                const similarityElement = document.getElementById('similarityScore');
                if (similarityElement) {
                    similarityElement.textContent = `${result.data.percentage}%`;

                    // Add badge
                    let badge = '';
                    if (similarity > 0.7) {
                        badge = '<span class="similarity-badge high">높음</span>';
                    } else if (similarity > 0.4) {
                        badge = '<span class="similarity-badge medium">보통</span>';
                    } else {
                        badge = '<span class="similarity-badge low">낮음</span>';
                    }

                    similarityElement.innerHTML = `${result.data.percentage}% ${badge}`;
                }

                // Adjust scale based on similarity
                this.updateScale(0.5 + similarity * 1.5);

                return similarity;
            }
        } catch (error) {
            console.error('[ScalingStream] Similarity calculation error:', error);
        }

        return 0;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            scaleFactor: this.scaleFactor,
            isStreaming: this.isStreaming,
            isPaused: this.isPaused,
            shapeType: this.shapeType,
            currentQuestion: this.currentQuestion
        };
    }
}

// Create global scaling stream instance
const scalingStream = new ScalingStream();
