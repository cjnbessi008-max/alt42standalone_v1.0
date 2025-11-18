/**
 * Zone Breeze - Visualization Engine
 * Renders inequality solution regions with zone-based energy effects
 */

class InequalityVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();

        // Visualization state
        this.bounds = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
        this.vertices = [];
        this.energyMap = [];
        this.inequalities = [];
        this.parsedInequalities = [];
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;

        // Animation state
        this.animationFrame = 0;
        this.isAnimating = false;

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOnCanvas = false;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height - 100; // Account for header/footer
    }

    /**
     * Setup mouse and touch event listeners
     */
    setupEventListeners() {
        // Mouse move for hover effects
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.isMouseOnCanvas = true;
            this.updateHoverInfo();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseOnCanvas = false;
            this.hideHoverInfo();
        });

        // Click for interaction tracking
        this.canvas.addEventListener('click', (e) => {
            const coords = this.screenToWorld(this.mouseX, this.mouseY);
            console.log('Clicked at:', coords);
            // Dispatch event for tracking
            window.dispatchEvent(new CustomEvent('canvas-click', { detail: coords }));
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const x = this.bounds.xMin + (screenX / this.canvas.width) * (this.bounds.xMax - this.bounds.xMin);
        const y = this.bounds.yMax - (screenY / this.canvas.height) * (this.bounds.yMax - this.bounds.yMin);
        return { x, y };
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const x = ((worldX - this.bounds.xMin) / (this.bounds.xMax - this.bounds.xMin)) * this.canvas.width;
        const y = ((this.bounds.yMax - worldY) / (this.bounds.yMax - this.bounds.yMin)) * this.canvas.height;
        return { x, y };
    }

    /**
     * Set visualization data
     */
    setData(inequalities, solution, bounds) {
        this.inequalities = inequalities;
        this.vertices = solution.vertices || [];
        this.energyMap = solution.energyMap || [];
        this.bounds = bounds || this.bounds;

        // Parse inequalities
        this.parsedInequalities = inequalities.map(ineq => InequalityUtils.parse(ineq));

        // Start animation
        this.startAnimation();
    }

    /**
     * Clear visualization
     */
    clear() {
        this.vertices = [];
        this.energyMap = [];
        this.inequalities = [];
        this.parsedInequalities = [];
        this.stopAnimation();
        this.render();
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        this.animationFrame++;
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    /**
     * Main render function
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw axes
        this.drawAxes();

        // Draw energy zones
        this.drawEnergyZones();

        // Draw inequality lines
        this.drawInequalityLines();

        // Draw solution region
        this.drawSolutionRegion();

        // Draw vertices
        this.drawVertices();
    }

    /**
     * Draw coordinate grid
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = Math.ceil(this.bounds.xMin); x <= this.bounds.xMax; x++) {
            const screenPos = this.worldToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = Math.ceil(this.bounds.yMin); y <= this.bounds.yMax; y++) {
            const screenPos = this.worldToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.canvas.width, screenPos.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw X and Y axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X-axis
        const xAxisY = this.worldToScreen(0, 0).y;
        if (xAxisY >= 0 && xAxisY <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, xAxisY);
            this.ctx.lineTo(this.canvas.width, xAxisY);
            this.ctx.stroke();

            // X-axis labels
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            for (let x = Math.ceil(this.bounds.xMin); x <= this.bounds.xMax; x++) {
                if (x === 0) continue;
                const screenPos = this.worldToScreen(x, 0);
                this.ctx.fillText(x.toString(), screenPos.x, xAxisY + 15);
            }
        }

        // Y-axis
        const yAxisX = this.worldToScreen(0, 0).x;
        if (yAxisX >= 0 && yAxisX <= this.canvas.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(yAxisX, 0);
            this.ctx.lineTo(yAxisX, this.canvas.height);
            this.ctx.stroke();

            // Y-axis labels
            this.ctx.textAlign = 'right';
            for (let y = Math.ceil(this.bounds.yMin); y <= this.bounds.yMax; y++) {
                if (y === 0) continue;
                const screenPos = this.worldToScreen(0, y);
                this.ctx.fillText(y.toString(), yAxisX - 5, screenPos.y + 4);
            }
        }
    }

    /**
     * Draw energy zones with breeze effect
     */
    drawEnergyZones() {
        if (this.energyMap.length === 0) return;

        const time = this.animationFrame * 0.05;

        for (const point of this.energyMap) {
            if (point.intensity <= 0) continue;

            const screenPos = this.worldToScreen(point.x, point.y);

            // Animated breeze effect
            const wave = Math.sin(time + point.x + point.y) * 0.1 + 0.9;
            const alpha = point.intensity * 0.6 * wave;

            // Color based on intensity
            let color;
            if (point.intensity > 0.7) {
                color = `rgba(76, 175, 80, ${alpha})`; // High energy - green
            } else if (point.intensity > 0.4) {
                color = `rgba(139, 195, 74, ${alpha})`; // Medium energy - light green
            } else {
                color = `rgba(205, 220, 57, ${alpha})`; // Low energy - yellow-green
            }

            // Draw energy point
            const radius = 5 + point.intensity * 3;
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, radius
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                screenPos.x - radius,
                screenPos.y - radius,
                radius * 2,
                radius * 2
            );
        }
    }

    /**
     * Draw inequality boundary lines
     */
    drawInequalityLines() {
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        for (const parsed of this.parsedInequalities) {
            const lineEq = InequalityUtils.getLineEquation(parsed);

            this.ctx.beginPath();

            if (lineEq.isVertical) {
                // Vertical line
                const x = lineEq.x;
                const top = this.worldToScreen(x, this.bounds.yMax);
                const bottom = this.worldToScreen(x, this.bounds.yMin);
                this.ctx.moveTo(top.x, top.y);
                this.ctx.lineTo(bottom.x, bottom.y);
            } else {
                // Non-vertical line
                const y1 = InequalityUtils.calculateY(this.bounds.xMin, lineEq);
                const y2 = InequalityUtils.calculateY(this.bounds.xMax, lineEq);

                const start = this.worldToScreen(this.bounds.xMin, y1);
                const end = this.worldToScreen(this.bounds.xMax, y2);

                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
            }

            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    /**
     * Draw solution region polygon
     */
    drawSolutionRegion() {
        if (this.vertices.length < 3) return;

        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();

        const firstVertex = this.worldToScreen(this.vertices[0].x, this.vertices[0].y);
        this.ctx.moveTo(firstVertex.x, firstVertex.y);

        for (let i = 1; i < this.vertices.length; i++) {
            const vertex = this.worldToScreen(this.vertices[i].x, this.vertices[i].y);
            this.ctx.lineTo(vertex.x, vertex.y);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Draw solution region vertices
     */
    drawVertices() {
        if (this.vertices.length === 0) return;

        this.ctx.fillStyle = '#FF5722';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;

        for (const vertex of this.vertices) {
            const screenPos = this.worldToScreen(vertex.x, vertex.y);

            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    /**
     * Update hover info display
     */
    updateHoverInfo() {
        if (!this.isMouseOnCanvas) return;

        const worldCoords = this.screenToWorld(this.mouseX, this.mouseY);
        const energy = this.parsedInequalities.length > 0
            ? InequalityUtils.calculateEnergy(worldCoords.x, worldCoords.y, this.parsedInequalities)
            : 0;
        const satisfiesAll = this.parsedInequalities.length > 0
            ? InequalityUtils.satisfiesAll(worldCoords.x, worldCoords.y, this.parsedInequalities)
            : false;

        // Update hover info element
        const hoverInfo = document.getElementById('hover-info');
        const hoverX = document.getElementById('hover-x');
        const hoverY = document.getElementById('hover-y');
        const hoverEnergy = document.getElementById('hover-energy');
        const hoverStatus = document.getElementById('hover-status');

        if (hoverInfo && hoverX && hoverY && hoverEnergy && hoverStatus) {
            hoverX.textContent = worldCoords.x.toFixed(2);
            hoverY.textContent = worldCoords.y.toFixed(2);
            hoverEnergy.textContent = (energy * 100).toFixed(0) + '%';
            hoverStatus.textContent = satisfiesAll ? '✓ 해 영역 내부' : '✗ 해 영역 외부';
            hoverStatus.style.color = satisfiesAll ? '#4CAF50' : '#f44336';
            hoverInfo.classList.remove('hidden');
        }
    }

    /**
     * Hide hover info
     */
    hideHoverInfo() {
        const hoverInfo = document.getElementById('hover-info');
        if (hoverInfo) {
            hoverInfo.classList.add('hidden');
        }
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const centerX = (this.bounds.xMin + this.bounds.xMax) / 2;
        const centerY = (this.bounds.yMin + this.bounds.yMax) / 2;
        const rangeX = (this.bounds.xMax - this.bounds.xMin) * 0.8;
        const rangeY = (this.bounds.yMax - this.bounds.yMin) * 0.8;

        this.bounds = {
            xMin: centerX - rangeX / 2,
            xMax: centerX + rangeX / 2,
            yMin: centerY - rangeY / 2,
            yMax: centerY + rangeY / 2
        };

        this.render();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const centerX = (this.bounds.xMin + this.bounds.xMax) / 2;
        const centerY = (this.bounds.yMin + this.bounds.yMax) / 2;
        const rangeX = (this.bounds.xMax - this.bounds.xMin) * 1.25;
        const rangeY = (this.bounds.yMax - this.bounds.yMin) * 1.25;

        this.bounds = {
            xMin: centerX - rangeX / 2,
            xMax: centerX + rangeX / 2,
            yMin: centerY - rangeY / 2,
            yMax: centerY + rangeY / 2
        };

        this.render();
    }

    /**
     * Reset view to center
     */
    resetView() {
        this.bounds = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }

    /**
     * Calculate solution area
     */
    getSolutionArea() {
        if (this.vertices.length < 3) return 0;

        // Shoelace formula for polygon area
        let area = 0;
        const n = this.vertices.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.vertices[i].x * this.vertices[j].y;
            area -= this.vertices[j].x * this.vertices[i].y;
        }

        return Math.abs(area / 2);
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const areaElem = document.getElementById('solution-area');
        const vertexCountElem = document.getElementById('vertex-count');

        if (areaElem) {
            const area = this.getSolutionArea();
            areaElem.textContent = area.toFixed(2);
        }

        if (vertexCountElem) {
            vertexCountElem.textContent = this.vertices.length;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InequalityVisualizer;
}
