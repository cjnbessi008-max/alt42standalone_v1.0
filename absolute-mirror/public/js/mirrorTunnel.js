// Absolute Mirror - Mirror Tunnel Visualization Engine

class MirrorTunnel {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.animationId = null;
        this.time = 0;

        // Equation parameters
        this.axis = 3;           // Axis of symmetry
        this.target = 5;         // Target absolute value
        this.currentX = 0;       // Current x value being visualized
        this.leftBound = -10;
        this.rightBound = 10;

        // Animation parameters
        this.tunnelDepth = config.tunnelDepth || 20;
        this.animationSpeed = 5;

        // Visual effects
        this.particles = [];
        this.trails = [];

        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Start animation
        this.animate();
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    setEquation(axis, target) {
        this.axis = axis;
        this.target = target;
        this.updateVisualization();
    }

    setCurrentX(x) {
        this.currentX = x;
        this.updateVisualization();
    }

    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    calculateAbsoluteValue(x) {
        return Math.abs(x - this.axis);
    }

    // Map x value to canvas x coordinate
    mapX(x) {
        const range = this.rightBound - this.leftBound;
        const normalized = (x - this.leftBound) / range;
        return normalized * this.canvas.width;
    }

    // Map y value to canvas y coordinate
    mapY(y) {
        const maxY = Math.max(this.target * 2, 15);
        const normalized = y / maxY;
        return this.canvas.height - (normalized * this.canvas.height * 0.8);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.config.colors?.grid || '#444';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        // Vertical grid lines
        for (let x = this.leftBound; x <= this.rightBound; x++) {
            const canvasX = this.mapX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        const maxY = Math.max(this.target * 2, 15);
        for (let y = 0; y <= maxY; y += 2) {
            const canvasY = this.mapY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvas.width, canvasY);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawAxes() {
        // Draw axis of symmetry
        this.ctx.strokeStyle = this.config.colors?.axis || '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.8;
        this.ctx.setLineDash([10, 5]);

        const axisX = this.mapX(this.axis);
        this.ctx.beginPath();
        this.ctx.moveTo(axisX, 0);
        this.ctx.lineTo(axisX, this.canvas.height);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;

        // Draw axis label
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`x = ${this.axis}`, axisX + 5, 30);
    }

    drawAbsoluteValueGraph() {
        this.ctx.strokeStyle = this.config.colors?.primary || '#4A90E2';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let first = true;
        for (let x = this.leftBound; x <= this.rightBound; x += 0.1) {
            const y = this.calculateAbsoluteValue(x);
            const canvasX = this.mapX(x);
            const canvasY = this.mapY(y);

            if (first) {
                this.ctx.moveTo(canvasX, canvasY);
                first = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    drawTargetLine() {
        // Draw horizontal line at target value
        this.ctx.strokeStyle = this.config.colors?.highlight || '#ffd93d';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        const targetY = this.mapY(this.target);
        this.ctx.beginPath();
        this.ctx.moveTo(0, targetY);
        this.ctx.lineTo(this.canvas.width, targetY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Label
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`y = ${this.target}`, 10, targetY - 5);
    }

    drawMirrorEffect() {
        // Draw mirror tunnel effect - creating depth perception
        const solutions = [
            this.axis + this.target,  // Right solution
            this.axis - this.target   // Left solution
        ];

        solutions.forEach((sol, idx) => {
            const solX = this.mapX(sol);
            const solY = this.mapY(this.target);

            // Draw multiple layers creating tunnel effect
            for (let i = 0; i < this.tunnelDepth; i++) {
                const depth = i / this.tunnelDepth;
                const scale = 1 - depth * 0.5;
                const alpha = 0.8 - depth * 0.6;
                const offset = Math.sin(this.time * 0.001 + i * 0.2) * 5;

                // Calculate color gradient through tunnel
                const hue = idx === 0 ? 240 : 280; // Blue for right, purple for left
                const color = `hsla(${hue + depth * 30}, 70%, ${50 + depth * 20}%, ${alpha})`;

                // Draw circle at solution point
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(
                    solX + offset * depth,
                    solY,
                    15 * scale,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Draw connecting lines creating tunnel effect
                if (i > 0) {
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = 2 * scale;
                    this.ctx.beginPath();
                    this.ctx.moveTo(solX, solY);
                    this.ctx.lineTo(
                        solX + offset * depth,
                        solY + (i * 3)
                    );
                    this.ctx.stroke();
                }

                // Add glow effect
                if (this.config.effects?.enableGlow) {
                    this.ctx.shadowBlur = 20 * scale;
                    this.ctx.shadowColor = color;
                }
            }

            // Reset shadow
            this.ctx.shadowBlur = 0;

            // Draw solution label
            this.ctx.fillStyle = idx === 0 ? '#4A90E2' : '#7B68EE';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(
                `x = ${sol.toFixed(1)}`,
                solX - 25,
                solY - 25
            );
        });
    }

    drawCurrentPosition() {
        if (this.currentX === 0 && !this.isInteracting) return;

        const currentXPos = this.mapX(this.currentX);
        const currentY = this.calculateAbsoluteValue(this.currentX);
        const currentYPos = this.mapY(currentY);

        // Draw vertical line from x-axis to point
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(currentXPos, this.canvas.height);
        this.ctx.lineTo(currentXPos, currentYPos);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw point
        const gradient = this.ctx.createRadialGradient(
            currentXPos, currentYPos, 0,
            currentXPos, currentYPos, 20
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(74, 144, 226, 0.3)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(currentXPos, currentYPos, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw white center
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(currentXPos, currentYPos, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Add trail effect
        if (this.config.effects?.enableTrails) {
            this.trails.push({
                x: currentXPos,
                y: currentYPos,
                life: 1.0
            });

            // Keep only recent trails
            if (this.trails.length > 20) {
                this.trails.shift();
            }
        }
    }

    drawTrails() {
        if (!this.config.effects?.enableTrails) return;

        this.trails.forEach((trail, idx) => {
            trail.life -= 0.05;

            if (trail.life > 0) {
                this.ctx.fillStyle = `rgba(74, 144, 226, ${trail.life * 0.5})`;
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, 5 * trail.life, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Remove dead trails
        this.trails = this.trails.filter(t => t.life > 0);
    }

    drawParticles() {
        if (!this.config.effects?.enableParticles) return;

        // Generate new particles occasionally
        if (Math.random() < 0.1) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
        }

        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.01;

            if (particle.life > 0) {
                this.ctx.fillStyle = `rgba(123, 104, 238, ${particle.life})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0 && p.y > 0);
    }

    updateVisualization() {
        // This will be called by the animation loop
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        this.clear();

        // Set background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all elements
        this.drawGrid();
        this.drawAxes();
        this.drawAbsoluteValueGraph();
        this.drawTargetLine();
        this.drawMirrorEffect();
        this.drawTrails();
        this.drawCurrentPosition();
        this.drawParticles();
    }

    animate() {
        this.time += this.animationSpeed;
        this.render();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.currentX = 0;
        this.trails = [];
        this.particles = [];
        this.time = 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MirrorTunnel;
}
