/**
 * Ball Physics Engine
 * Handles physics calculations and ball animation
 */

class BallPhysics {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Canvas setup
        this.setupCanvas();

        // Physics parameters (will be set from problem data)
        this.y0 = 100;          // Initial position (m)
        this.v0 = 0;            // Initial velocity (m/s)
        this.a = -9.8;          // Acceleration (m/s²)
        this.maxTime = 10;      // Maximum simulation time (s)

        // Simulation state
        this.time = 0;          // Current time (s)
        this.isRunning = false;
        this.isPaused = false;
        this.dt = 0.016;        // Time step (~60 fps)

        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;

        // History for graph
        this.history = {
            time: [],
            position: [],
            velocity: []
        };

        // Scale factors for visualization
        this.pixelsPerMeter = 2;
        this.groundY = this.canvas.height - 30;

        // Ball appearance
        this.ballRadius = 10;
        this.ballColor = '#667eea';
    }

    setupCanvas() {
        // Make canvas responsive
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.groundY = this.canvas.height - 30;
            this.draw();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    /**
     * Set problem parameters
     */
    setProblem(y0, v0, a, maxTime) {
        this.y0 = y0;
        this.v0 = v0;
        this.a = a;
        this.maxTime = maxTime;
        this.reset();
    }

    /**
     * Calculate position at time t
     * y(t) = y0 + v0*t + 0.5*a*t²
     */
    calculatePosition(t) {
        return this.y0 + this.v0 * t + 0.5 * this.a * t * t;
    }

    /**
     * Calculate velocity at time t
     * v(t) = v0 + a*t
     */
    calculateVelocity(t) {
        return this.v0 + this.a * t;
    }

    /**
     * Calculate acceleration (constant)
     */
    calculateAcceleration() {
        return this.a;
    }

    /**
     * Get current state
     */
    getState() {
        const position = this.calculatePosition(this.time);
        const velocity = this.calculateVelocity(this.time);
        const acceleration = this.calculateAcceleration();

        return {
            time: this.time,
            position: position,
            velocity: velocity,
            acceleration: acceleration
        };
    }

    /**
     * Start simulation
     */
    start() {
        if (this.isRunning && !this.isPaused) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    /**
     * Pause simulation
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume simulation
     */
    resume() {
        if (!this.isRunning) return;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    /**
     * Reset simulation
     */
    reset() {
        this.time = 0;
        this.isRunning = false;
        this.isPaused = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Clear history
        this.history = {
            time: [],
            position: [],
            velocity: []
        };

        this.draw();
    }

    /**
     * Animation loop
     */
    animate(currentTime) {
        if (!this.isRunning || this.isPaused) return;

        // Calculate elapsed time
        const elapsed = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Update time
        this.time += elapsed;

        // Check boundaries
        const state = this.getState();

        // Stop if ball hits ground (position <= 0) or exceeds max time
        if (state.position <= 0 || this.time >= this.maxTime) {
            this.isRunning = false;
            this.isPaused = false;

            // Clamp time to max
            if (this.time >= this.maxTime) {
                this.time = this.maxTime;
            }

            this.draw();
            return;
        }

        // Record history
        this.history.time.push(this.time);
        this.history.position.push(state.position);
        this.history.velocity.push(state.velocity);

        // Draw
        this.draw();

        // Continue animation
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    /**
     * Draw the scene
     */
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#e8f4f8');
        gradient.addColorStop(1, '#b8d4e8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw ground
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(0, this.groundY, width, height - this.groundY);

        // Draw grass
        ctx.fillStyle = '#90c840';
        ctx.fillRect(0, this.groundY - 5, width, 5);

        // Draw height markers (grid)
        this.drawHeightMarkers();

        // Get current state
        const state = this.getState();

        // Calculate ball screen position
        const ballX = width / 2;
        const ballY = this.groundY - (state.position * this.pixelsPerMeter);

        // Draw ball
        this.drawBall(ballX, ballY);

        // Draw velocity vector
        this.drawVelocityVector(ballX, ballY, state.velocity);
    }

    /**
     * Draw height markers
     */
    drawHeightMarkers() {
        const ctx = this.ctx;
        const width = this.canvas.width;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

        // Draw every 10 meters
        for (let h = 0; h <= this.y0 + 20; h += 10) {
            const y = this.groundY - (h * this.pixelsPerMeter);
            if (y >= 0 && y <= this.canvas.height) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();

                ctx.fillText(h + 'm', 5, y - 2);
            }
        }
    }

    /**
     * Draw ball
     */
    drawBall(x, y) {
        const ctx = this.ctx;

        // Clamp y to visible area
        y = Math.max(this.ballRadius, Math.min(this.groundY, y));

        // Shadow
        ctx.beginPath();
        ctx.arc(x, this.groundY - 2, this.ballRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Ball gradient
        const gradient = ctx.createRadialGradient(
            x - this.ballRadius * 0.3,
            y - this.ballRadius * 0.3,
            this.ballRadius * 0.1,
            x,
            y,
            this.ballRadius
        );
        gradient.addColorStop(0, '#8b9dea');
        gradient.addColorStop(1, this.ballColor);

        // Ball
        ctx.beginPath();
        ctx.arc(x, y, this.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#4a5bb5';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(x - this.ballRadius * 0.3, y - this.ballRadius * 0.3, this.ballRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    /**
     * Draw velocity vector
     */
    drawVelocityVector(x, y, velocity) {
        const ctx = this.ctx;

        // Scale velocity for visualization
        const scale = 2;
        const vectorLength = velocity * scale;

        // Vector points downward for negative velocity
        const endX = x;
        const endY = y - vectorLength;

        // Don't draw if velocity is too small
        if (Math.abs(vectorLength) < 2) return;

        // Arrow color based on direction
        const color = velocity > 0 ? '#10b981' : '#ef4444';

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const arrowSize = 6;
        const angle = Math.atan2(endY - y, endX - x);

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.font = '10px Arial';
        ctx.fillText('v', endX + 5, endY);
    }
}
