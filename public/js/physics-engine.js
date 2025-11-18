/**
 * Physics Engine for Roll Along App
 * Handles ball physics, rolling animation, and coordinate visualization
 */

class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Physics properties
        this.ball = {
            x: 0,          // Current x position on graph
            y: 0,          // Current y position on graph
            screenX: 0,    // Screen x position
            screenY: 0,    // Screen y position
            radius: 15,    // Ball radius in pixels
            color: '#FF6B6B',
            rotation: 0,   // Current rotation angle
            velocity: 0,   // Current velocity
            mass: 1
        };

        // Graph settings
        this.graph = {
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            gridSize: 1
        };

        // Animation settings
        this.isAnimating = false;
        this.targetX = 0;
        this.animationSpeed = 0.05;
        this.lastFrameTime = 0;

        // Function to evaluate
        this.currentFunction = (x) => x; // Default: y = x

        // Trail points for visual effect
        this.trail = [];
        this.maxTrailLength = 50;
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    // Convert graph coordinates to screen coordinates
    graphToScreen(graphX, graphY) {
        const scaleX = this.canvas.width / (this.graph.xMax - this.graph.xMin);
        const scaleY = this.canvas.height / (this.graph.yMax - this.graph.yMin);

        return {
            x: (graphX - this.graph.xMin) * scaleX,
            y: this.canvas.height - (graphY - this.graph.yMin) * scaleY
        };
    }

    // Convert screen coordinates to graph coordinates
    screenToGraph(screenX, screenY) {
        const scaleX = this.canvas.width / (this.graph.xMax - this.graph.xMin);
        const scaleY = this.canvas.height / (this.graph.yMax - this.graph.yMin);

        return {
            x: (screenX / scaleX) + this.graph.xMin,
            y: this.graph.yMax - (screenY / scaleY)
        };
    }

    // Set the function to visualize
    setFunction(func) {
        this.currentFunction = func;
    }

    // Update ball position to specific x coordinate
    setBallPosition(x) {
        this.ball.x = x;
        try {
            this.ball.y = this.currentFunction(x);

            // Check if y is valid
            if (isNaN(this.ball.y) || !isFinite(this.ball.y)) {
                this.ball.y = 0;
            }
        } catch (e) {
            console.error('Function evaluation error:', e);
            this.ball.y = 0;
        }

        const screenPos = this.graphToScreen(this.ball.x, this.ball.y);
        this.ball.screenX = screenPos.x;
        this.ball.screenY = screenPos.y;

        // Add to trail
        this.trail.push({ x: screenPos.x, y: screenPos.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    // Animate ball to target x position
    animateToX(targetX, speed = 0.05) {
        this.targetX = targetX;
        this.animationSpeed = speed;
        this.isAnimating = true;
    }

    // Update physics (called every frame)
    update(deltaTime) {
        if (!this.isAnimating) return;

        const dx = this.targetX - this.ball.x;

        // If close enough to target, stop
        if (Math.abs(dx) < 0.01) {
            this.setBallPosition(this.targetX);
            this.isAnimating = false;
            return;
        }

        // Move towards target
        const step = dx * this.animationSpeed;
        const newX = this.ball.x + step;

        // Update rotation based on movement
        const distance = Math.abs(step);
        const circumference = 2 * Math.PI * this.ball.radius;
        const rotationChange = (distance * (2 * Math.PI)) / circumference;
        this.ball.rotation += rotationChange * Math.sign(step);

        this.setBallPosition(newX);
    }

    // Draw the entire scene
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw axes
        this.drawAxes();

        // Draw function curve
        this.drawFunctionCurve();

        // Draw trail
        this.drawTrail();

        // Draw ball
        this.drawBall();

        // Draw coordinates
        this.drawCoordinates();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = this.graph.xMin; x <= this.graph.xMax; x += this.graph.gridSize) {
            const screenPos = this.graphToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = this.graph.yMin; y <= this.graph.yMax; y += this.graph.gridSize) {
            const screenPos = this.graphToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.canvas.width, screenPos.y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        const origin = this.graphToScreen(0, 0);

        // X-axis
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, origin.y);
        this.ctx.lineTo(this.canvas.width, origin.y);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, 0);
        this.ctx.lineTo(origin.x, this.canvas.height);
        this.ctx.stroke();

        // Axis labels
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        // X-axis labels
        for (let x = this.graph.xMin; x <= this.graph.xMax; x += 2) {
            if (x === 0) continue;
            const screenPos = this.graphToScreen(x, 0);
            this.ctx.fillText(x.toString(), screenPos.x, origin.y + 15);
        }

        // Y-axis labels
        this.ctx.textAlign = 'right';
        for (let y = this.graph.yMin; y <= this.graph.yMax; y += 2) {
            if (y === 0) continue;
            const screenPos = this.graphToScreen(0, y);
            this.ctx.fillText(y.toString(), origin.x - 5, screenPos.y + 4);
        }
    }

    drawFunctionCurve() {
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let firstPoint = true;
        const step = (this.graph.xMax - this.graph.xMin) / 200;

        for (let x = this.graph.xMin; x <= this.graph.xMax; x += step) {
            try {
                const y = this.currentFunction(x);

                if (isNaN(y) || !isFinite(y)) continue;

                const screenPos = this.graphToScreen(x, y);

                if (firstPoint) {
                    this.ctx.moveTo(screenPos.x, screenPos.y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(screenPos.x, screenPos.y);
                }
            } catch (e) {
                // Skip invalid points
            }
        }

        this.ctx.stroke();
    }

    drawTrail() {
        if (this.trail.length < 2) return;

        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        this.ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }

        this.ctx.stroke();
    }

    drawBall() {
        const { screenX, screenY, radius, rotation, color } = this.ball;

        // Save context
        this.ctx.save();

        // Translate to ball position
        this.ctx.translate(screenX, screenY);

        // Rotate the ball
        this.ctx.rotate(rotation);

        // Draw ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(2, 2, radius, radius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw ball
        const gradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, radius);
        gradient.addColorStop(0, '#FFE66D');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, '#C44569');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw ball pattern (lines to show rotation)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-radius, 0);
        this.ctx.lineTo(radius, 0);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, -radius);
        this.ctx.lineTo(0, radius);
        this.ctx.stroke();

        // Restore context
        this.ctx.restore();

        // Draw position marker
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        // Vertical line to x-axis
        const origin = this.graphToScreen(0, 0);
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX, origin.y);
        this.ctx.stroke();

        // Horizontal line to y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(origin.x, screenY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawCoordinates() {
        // Draw coordinate display at top of canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 180, 50);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';

        this.ctx.fillText(`x = ${this.ball.x.toFixed(2)}`, 20, 30);
        this.ctx.fillText(`y = ${this.ball.y.toFixed(2)}`, 20, 50);
    }

    // Animation loop
    animate(currentTime) {
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }

        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.draw();

        if (this.isAnimating) {
            requestAnimationFrame((time) => this.animate(time));
        }
    }

    // Start animation
    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.lastFrameTime = 0;
            requestAnimationFrame((time) => this.animate(time));
        }
    }

    // Stop animation
    stop() {
        this.isAnimating = false;
    }

    // Reset to origin
    reset() {
        this.ball.x = 0;
        this.ball.y = 0;
        this.ball.rotation = 0;
        this.trail = [];
        this.setBallPosition(0);
        this.draw();
    }

    // Clear trail
    clearTrail() {
        this.trail = [];
    }
}
