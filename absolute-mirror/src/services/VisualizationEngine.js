/**
 * VisualizationEngine - WebGL 기반 미러 터널 시각화 엔진
 * High-performance 3D visualization using WebGL2
 */

import { EVENTS } from '../core/EventBus.js';

export class VisualizationEngine {
    constructor(canvas, config, eventBus) {
        this.canvas = canvas;
        this.config = config.visualization || {};
        this.eventBus = eventBus;

        // Try WebGL2 first, fallback to WebGL1, then Canvas2D
        this.gl = this.initializeWebGL();
        this.renderMode = this.gl ? 'webgl' : 'canvas2d';

        console.log(`[VisualizationEngine] Using ${this.renderMode} rendering`);

        // Rendering state
        this.animationId = null;
        this.time = 0;
        this.isRunning = false;

        // Current visualization data
        this.currentProblem = null;
        this.currentX = 0;
        this.tunnelDepth = this.config.tunnelDepth || 20;
        this.animationSpeed = this.config.animationSpeed || 5;

        // Performance tracking
        this.fps = 60;
        this.frameTime = 0;
        this.lastFrameTime = 0;

        // Visual effects
        this.particles = [];
        this.trails = [];
        this.maxParticles = this.config.maxParticles || 100;
        this.maxTrails = this.config.maxTrails || 20;

        // Colors from config
        this.colors = {
            primary: this.parseColor(this.config.colors?.primary || '#4A90E2'),
            secondary: this.parseColor(this.config.colors?.secondary || '#7B68EE'),
            mirror: this.parseColor(this.config.colors?.mirror || '#f093fb'),
            grid: this.parseColor(this.config.colors?.grid || '#444'),
            axis: this.parseColor(this.config.colors?.axis || '#ff6b6b'),
            highlight: this.parseColor(this.config.colors?.highlight || '#ffd93d')
        };

        // Effects flags
        this.effects = {
            enableGlow: this.config.effects?.enableGlow !== false,
            enableParticles: this.config.effects?.enableParticles !== false,
            enableTrails: this.config.effects?.enableTrails !== false,
            enablePerspective: this.config.effects?.perspective !== false
        };

        this.init();
    }

    /**
     * Initialize WebGL context
     */
    initializeWebGL() {
        try {
            // Try WebGL2
            let gl = this.canvas.getContext('webgl2', {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: false
            });

            if (gl) {
                console.log('[VisualizationEngine] WebGL2 initialized');
                return gl;
            }

            // Fallback to WebGL1
            gl = this.canvas.getContext('webgl', {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: false
            });

            if (gl) {
                console.log('[VisualizationEngine] WebGL1 initialized');
                return gl;
            }

            console.warn('[VisualizationEngine] WebGL not available, using Canvas2D');
            return null;

        } catch (error) {
            console.error('[VisualizationEngine] WebGL initialization failed:', error);
            return null;
        }
    }

    /**
     * Initialize visualization
     */
    async init() {
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        // Setup WebGL if available
        if (this.gl) {
            this.setupWebGL();
        } else {
            this.setupCanvas2D();
        }

        this.eventBus?.emit(EVENTS.VIZ_READY);

        console.log('[VisualizationEngine] Initialized');
    }

    /**
     * Setup WebGL rendering
     */
    setupWebGL() {
        const gl = this.gl;

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Set clear color
        gl.clearColor(0.04, 0.04, 0.12, 1.0);

        console.log('[VisualizationEngine] WebGL setup complete');
    }

    /**
     * Setup Canvas2D rendering (fallback)
     */
    setupCanvas2D() {
        this.ctx = this.canvas.getContext('2d');
        console.log('[VisualizationEngine] Canvas2D setup complete');
    }

    /**
     * Resize canvas to match display size
     */
    resizeCanvas() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const displayWidth = parent.clientWidth;
        const displayHeight = parent.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            this.centerX = displayWidth / 2;
            this.centerY = displayHeight / 2;

            // Update WebGL viewport
            if (this.gl) {
                this.gl.viewport(0, 0, displayWidth, displayHeight);
            }

            console.log(`[VisualizationEngine] Canvas resized to ${displayWidth}x${displayHeight}`);
        }
    }

    /**
     * Set current problem
     */
    setProblem(problem) {
        this.currentProblem = problem;
        this.currentX = 0;

        // Clear effects
        this.particles = [];
        this.trails = [];

        console.log('[VisualizationEngine] Problem set:', problem.equation);

        this.eventBus?.emit(EVENTS.VIZ_UPDATE, { problem });
    }

    /**
     * Set current X value
     */
    setCurrentX(x) {
        this.currentX = x;
        this.event Bus?.emit(EVENTS.VIZ_X_CHANGED, { x });
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(1, Math.min(10, speed));
    }

    /**
     * Start rendering
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.render();

        console.log('[VisualizationEngine] Started');
    }

    /**
     * Stop rendering
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        console.log('[VisualizationEngine] Stopped');
    }

    /**
     * Main render loop
     */
    render() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Calculate FPS
        this.frameTime = deltaTime;
        this.fps = 1000 / deltaTime;

        // Update time
        this.time += this.animationSpeed;

        // Clear canvas
        this.clear();

        // Render based on mode
        if (this.renderMode === 'webgl') {
            this.renderWebGL();
        } else {
            this.renderCanvas2D();
        }

        // Schedule next frame
        this.animationId = requestAnimationFrame(() => this.render());
    }

    /**
     * WebGL rendering
     */
    renderWebGL() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // TODO: Implement WebGL rendering with shaders
        // For now, fallback to Canvas2D
        this.renderCanvas2D();
    }

    /**
     * Canvas2D rendering (main implementation)
     */
    renderCanvas2D() {
        if (!this.ctx || !this.currentProblem) return;

        // Draw background gradient
        this.drawBackground();

        // Draw grid
        this.drawGrid();

        // Draw axes
        this.drawAxes();

        // Draw absolute value graph
        this.drawAbsoluteValueGraph();

        // Draw target line
        this.drawTargetLine();

        // Draw mirror tunnel effect
        this.drawMirrorTunnel();

        // Draw current position marker
        this.drawCurrentPosition();

        // Draw trails
        if (this.effects.enableTrails) {
            this.drawTrails();
        }

        // Draw particles
        if (this.effects.enableParticles) {
            this.updateAndDrawParticles();
        }

        // Draw FPS counter (if debug)
        if (this.config.debug) {
            this.drawFPS();
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        if (this.gl) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        } else if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Draw background gradient
     */
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a2e');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw grid
     */
    drawGrid() {
        const problem = this.currentProblem;
        if (!problem) return;

        this.ctx.strokeStyle = this.colorToCSS(this.colors.grid, 0.3);
        this.ctx.lineWidth = 1;

        const range = problem.getVisualizationRange();

        // Vertical grid lines
        for (let x = Math.floor(range.min); x <= Math.ceil(range.max); x++) {
            const canvasX = this.mapX(x, range);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        const maxY = problem.target * 2;
        const yStep = maxY > 10 ? 2 : 1;

        for (let y = 0; y <= maxY; y += yStep) {
            const canvasY = this.mapY(y, maxY);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvas.width, canvasY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw axes (axis of symmetry)
     */
    drawAxes() {
        const problem = this.currentProblem;
        if (!problem) return;

        const range = problem.getVisualizationRange();
        const axisX = this.mapX(problem.axis, range);

        this.ctx.strokeStyle = this.colorToCSS(this.colors.axis, 0.8);
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(axisX, 0);
        this.ctx.lineTo(axisX, this.canvas.height);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Label
        this.ctx.fillStyle = this.colorToCSS(this.colors.axis);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`x = ${problem.axis}`, axisX + 5, 30);
    }

    /**
     * Draw absolute value graph
     */
    drawAbsoluteValueGraph() {
        const problem = this.currentProblem;
        if (!problem) return;

        const range = problem.getVisualizationRange();

        this.ctx.strokeStyle = this.colorToCSS(this.colors.primary);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let first = true;
        for (let x = range.min; x <= range.max; x += 0.1) {
            const y = problem.calculateAbsoluteValue(x);
            const canvasX = this.mapX(x, range);
            const canvasY = this.mapY(y, problem.target * 2);

            if (first) {
                this.ctx.moveTo(canvasX, canvasY);
                first = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw target line
     */
    drawTargetLine() {
        const problem = this.currentProblem;
        if (!problem) return;

        const targetY = this.mapY(problem.target, problem.target * 2);

        this.ctx.strokeStyle = this.colorToCSS(this.colors.highlight);
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(0, targetY);
        this.ctx.lineTo(this.canvas.width, targetY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Label
        this.ctx.fillStyle = this.colorToCSS(this.colors.highlight);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`y = ${problem.target}`, 10, targetY - 5);
    }

    /**
     * Draw mirror tunnel effect at solutions
     */
    drawMirrorTunnel() {
        const problem = this.currentProblem;
        if (!problem) return;

        const range = problem.getVisualizationRange();
        const targetY = this.mapY(problem.target, problem.target * 2);

        problem.solutions.forEach((solution, idx) => {
            const solX = this.mapX(solution, range);

            // Draw tunnel layers
            for (let i = 0; i < this.tunnelDepth; i++) {
                const depth = i / this.tunnelDepth;
                const scale = 1 - depth * 0.5;
                const alpha = 0.8 - depth * 0.6;
                const offset = Math.sin(this.time * 0.001 + i * 0.2) * 5 * depth;

                const hue = idx === 0 ? 0.67 : 0.78; // Blue vs Purple
                const color = this.hslToRgb(hue, 0.7, 0.5 + depth * 0.2);

                // Draw circle
                this.ctx.fillStyle = this.colorToCSS(color, alpha);
                this.ctx.beginPath();
                this.ctx.arc(solX + offset, targetY, 15 * scale, 0, Math.PI * 2);
                this.ctx.fill();

                // Glow effect
                if (this.effects.enableGlow) {
                    this.ctx.shadowBlur = 20 * scale;
                    this.ctx.shadowColor = this.colorToCSS(color, alpha);
                }
            }

            this.ctx.shadowBlur = 0;

            // Solution label
            this.ctx.fillStyle = idx === 0 ? this.colorToCSS(this.colors.primary) : this.colorToCSS(this.colors.secondary);
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(`x = ${solution}`, solX - 25, targetY - 25);
        });
    }

    /**
     * Draw current position marker
     */
    drawCurrentPosition() {
        if (this.currentX === 0) return;

        const problem = this.currentProblem;
        if (!problem) return;

        const range = problem.getVisualizationRange();
        const currentXPos = this.mapX(this.currentX, range);
        const currentY = problem.calculateAbsoluteValue(this.currentX);
        const currentYPos = this.mapY(currentY, problem.target * 2);

        // Vertical line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(currentXPos, this.canvas.height);
        this.ctx.lineTo(currentXPos, currentYPos);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Point
        const gradient = this.ctx.createRadialGradient(currentXPos, currentYPos, 0, currentXPos, currentYPos, 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(74, 144, 226, 0.3)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(currentXPos, currentYPos, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // White center
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(currentXPos, currentYPos, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Add to trail
        this.trails.push({ x: currentXPos, y: currentYPos, life: 1.0 });
        if (this.trails.length > this.maxTrails) {
            this.trails.shift();
        }
    }

    /**
     * Draw trails
     */
    drawTrails() {
        this.trails.forEach((trail, idx) => {
            trail.life -= 0.05;

            if (trail.life > 0) {
                this.ctx.fillStyle = `rgba(74, 144, 226, ${trail.life * 0.5})`;
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, 5 * trail.life, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.trails = this.trails.filter(t => t.life > 0);
    }

    /**
     * Update and draw particles
     */
    updateAndDrawParticles() {
        // Generate new particles
        if (Math.random() < 0.1 && this.particles.length < this.maxParticles) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
        }

        // Update and draw particles
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

        this.particles = this.particles.filter(p => p.life > 0 && p.y > 0);
    }

    /**
     * Draw FPS counter
     */
    drawFPS() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 10, 20);
        this.ctx.fillText(`Frame: ${this.frameTime.toFixed(2)}ms`, 10, 35);
    }

    /**
     * Map x coordinate to canvas
     */
    mapX(x, range) {
        const normalized = (x - range.min) / (range.max - range.min);
        return normalized * this.canvas.width;
    }

    /**
     * Map y coordinate to canvas
     */
    mapY(y, maxY) {
        const normalized = y / maxY;
        return this.canvas.height - (normalized * this.canvas.height * 0.8);
    }

    /**
     * Parse color string to RGB object
     */
    parseColor(colorString) {
        // Handle hex colors
        if (colorString.startsWith('#')) {
            const hex = colorString.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { r, g, b };
        }

        // Default to white
        return { r: 1, g: 1, b: 1 };
    }

    /**
     * Convert RGB to CSS color
     */
    colorToCSS(color, alpha = 1) {
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Convert HSL to RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r, g, b };
    }

    /**
     * Reset visualization
     */
    reset() {
        this.currentX = 0;
        this.particles = [];
        this.trails = [];
        this.time = 0;

        this.eventBus?.emit(EVENTS.VIZ_RESET);

        console.log('[VisualizationEngine] Reset');
    }
}
