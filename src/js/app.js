/**
 * app.js
 * Main application logic - integrates all components
 */

class SecantBeamApp {
    constructor() {
        // Initialize renderers
        this.mainRenderer = null;
        this.secantBeam = null;
        this.mobileSync = null;

        // Application state
        this.currentFunction = null;
        this.selectedPoints = [];
        this.autoAnimate = false;

        // Current function type
        this.functionType = 'x2';

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Set up all components
     */
    setup() {
        // Initialize main renderer
        this.mainRenderer = new GraphRenderer('graph-canvas', {
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            gridSpacing: 1
        });

        // Initialize secant beam
        this.secantBeam = new SecantBeam(this.mainRenderer, {
            beamWidth: 8,
            glowRadius: 20,
            animationSpeed: 0.02
        });

        // Initialize mobile sync
        this.mobileSync = new MobileSync(this.mainRenderer, 'mobile-canvas');

        // Set initial function
        this.setFunction('x2');

        // Set up event listeners
        this.setupEventListeners();

        // Initial render
        this.render();

        console.log('✨ Secant Beam Visualization initialized!');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Function selector
        const functionSelect = document.getElementById('function-select');
        functionSelect.addEventListener('change', (e) => {
            this.functionType = e.target.value;
            this.setFunction(e.target.value);
            this.resetPoints();
        });

        // Custom function input
        const customFunctionInput = document.getElementById('custom-function');
        const customFunctionGroup = document.getElementById('custom-function-group');

        functionSelect.addEventListener('change', (e) => {
            customFunctionGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        customFunctionInput.addEventListener('change', (e) => {
            if (this.functionType === 'custom') {
                this.setCustomFunction(e.target.value);
                this.resetPoints();
            }
        });

        // Auto-animate checkbox
        const autoAnimateCheckbox = document.getElementById('auto-animate');
        autoAnimateCheckbox.addEventListener('change', (e) => {
            this.autoAnimate = e.target.checked;
            if (this.autoAnimate) {
                this.secantBeam.startAnimation();
            } else {
                this.secantBeam.stopAnimation();
            }
            this.render();
        });

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => this.resetPoints());

        // Canvas click handler
        const canvas = document.getElementById('graph-canvas');
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Set mathematical function to visualize
     */
    setFunction(type) {
        const funcDef = MathFunctions.functions[type];
        if (!funcDef) {
            console.error(`Unknown function type: ${type}`);
            return;
        }

        this.currentFunction = funcDef.fn;
        this.functionType = type;

        // Update bounds if needed
        if (funcDef.domain && funcDef.range) {
            this.mainRenderer.setBounds(
                funcDef.domain.min,
                funcDef.domain.max,
                funcDef.range.min,
                funcDef.range.max
            );
            this.mobileSync.updateBounds(
                funcDef.domain.min,
                funcDef.domain.max,
                funcDef.range.min,
                funcDef.range.max
            );
        }

        // Update mobile sync
        this.mobileSync.setFunction(this.currentFunction, '#004098');

        this.render();
    }

    /**
     * Set custom function from user input
     */
    setCustomFunction(expr) {
        try {
            this.currentFunction = (x) => MathFunctions.evaluateCustom(expr, x);
            this.mobileSync.setFunction(this.currentFunction, '#004098');
            this.render();
        } catch (error) {
            console.error('Invalid custom function:', error);
            alert('잘못된 함수 표현식입니다. 예: x * x + 2 * x + 1');
        }
    }

    /**
     * Handle canvas click for point selection
     */
    handleCanvasClick(event) {
        if (!this.currentFunction) return;

        // Get click position in math coordinates
        const pos = this.mainRenderer.getMousePosition(event);

        // Snap to function curve
        const y = this.currentFunction(pos.x);

        if (!isFinite(y)) {
            console.warn('Cannot select point: function undefined at this x');
            return;
        }

        const point = { x: pos.x, y: y };

        // Add point to selection
        if (this.selectedPoints.length < 2) {
            this.selectedPoints.push(point);
        } else {
            // Reset and start new selection
            this.selectedPoints = [point];
        }

        // Update UI
        this.updatePointInfo();
        this.updateSlopeInfo();

        // Render with new points
        this.render();
    }

    /**
     * Update point information display
     */
    updatePointInfo() {
        const pointAEl = document.getElementById('point-a');
        const pointBEl = document.getElementById('point-b');

        if (this.selectedPoints.length >= 1) {
            const p = this.selectedPoints[0];
            pointAEl.textContent = `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
        } else {
            pointAEl.textContent = '선택하세요';
        }

        if (this.selectedPoints.length >= 2) {
            const p = this.selectedPoints[1];
            pointBEl.textContent = `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
        } else {
            pointBEl.textContent = '선택하세요';
        }
    }

    /**
     * Update slope information display
     */
    updateSlopeInfo() {
        const slopeValueEl = document.getElementById('slope-value');
        const slopeFormulaEl = document.getElementById('slope-formula');
        const secantEquationEl = document.getElementById('secant-equation');

        if (this.selectedPoints.length === 2) {
            const [p1, p2] = this.selectedPoints;

            // Calculate slope
            const slope = MathFunctions.calculateSlope(p1, p2);
            slopeValueEl.textContent = MathFunctions.formatNumber(slope, 3);

            // Show formula with actual values
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            slopeFormulaEl.textContent = `Δy / Δx = ${dy.toFixed(3)} / ${dx.toFixed(3)}`;

            // Show secant equation
            const eq = MathFunctions.getSecantEquation(p1, p2);
            secantEquationEl.textContent = eq.equation;
        } else {
            slopeValueEl.textContent = '-';
            slopeFormulaEl.textContent = 'Δy / Δx';
            secantEquationEl.textContent = '-';
        }
    }

    /**
     * Reset selected points
     */
    resetPoints() {
        this.selectedPoints = [];
        this.updatePointInfo();
        this.updateSlopeInfo();
        this.secantBeam.stopAnimation();
        this.autoAnimate = false;
        document.getElementById('auto-animate').checked = false;
        this.render();
    }

    /**
     * Main render function
     */
    render() {
        if (!this.mainRenderer || !this.currentFunction) return;

        // Clear canvas
        this.mainRenderer.clear();

        // Draw grid and axes
        this.mainRenderer.drawGrid();
        this.mainRenderer.drawAxes();

        // Draw function curve
        this.mainRenderer.drawFunction(this.currentFunction, '#004098', 2.5);

        // Draw secant beam if two points selected
        if (this.selectedPoints.length === 2) {
            const [p1, p2] = this.selectedPoints;

            // Draw extended secant line (faint dashed)
            this.secantBeam.drawExtendedSecant(p1, p2);

            // Draw glowing secant beam
            this.secantBeam.draw(p1, p2, this.autoAnimate);

            // Draw slope triangle
            this.secantBeam.drawSlopeTriangle(p1, p2);

            // Update mobile sync
            this.mobileSync.setSecantLine(p1, p2);
            this.mobileSync.setShowSlopeTriangle(true);
        } else {
            this.mobileSync.setSecantLine(null, null);
            this.mobileSync.setShowSlopeTriangle(false);
        }

        // Draw selected points
        const labels = ['A', 'B'];
        const pointsForMobile = [];

        this.selectedPoints.forEach((point, index) => {
            this.mainRenderer.drawPoint(
                point.x,
                point.y,
                labels[index],
                '#E31837',
                6
            );

            pointsForMobile.push({
                x: point.x,
                y: point.y,
                label: labels[index],
                color: '#E31837'
            });
        });

        // Update mobile view
        this.mobileSync.setPoints(pointsForMobile);

        // Continue animation if enabled
        if (this.autoAnimate && this.selectedPoints.length === 2) {
            requestAnimationFrame(() => this.render());
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.mainRenderer.setupCanvas();
        this.mobileSync.handleResize();
        this.render();
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.secantBeam) {
            this.secantBeam.destroy();
        }
    }
}

// Initialize app when page loads
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new SecantBeamApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
