/**
 * mobile-sync.js
 * Synchronizes main canvas content to mobile view
 */

class MobileSync {
    constructor(mainRenderer, mobileCanvasId) {
        this.mainRenderer = mainRenderer;
        this.mobileCanvas = document.getElementById(mobileCanvasId);

        if (!this.mobileCanvas) {
            console.warn(`Mobile canvas with id "${mobileCanvasId}" not found`);
            return;
        }

        this.mobileRenderer = null;
        this.setupMobileRenderer();

        // Track what needs to be synced
        this.syncData = {
            function: null,
            points: [],
            secantLine: null,
            showSlopeTriangle: false
        };
    }

    /**
     * Set up mobile renderer with same properties as main
     */
    setupMobileRenderer() {
        // Create a smaller version of the main renderer
        this.mobileRenderer = new GraphRenderer('mobile-canvas', {
            xMin: this.mainRenderer.xMin,
            xMax: this.mainRenderer.xMax,
            yMin: this.mainRenderer.yMin,
            yMax: this.mainRenderer.yMax,
            gridSpacing: this.mainRenderer.gridSpacing,
            showGrid: true,
            showAxes: true
        });

        // Scale adjustments for smaller canvas
        this.mobileRenderer.ctx.font = '8px sans-serif';
    }

    /**
     * Update function to be displayed
     */
    setFunction(fn, color) {
        this.syncData.function = { fn, color };
        this.render();
    }

    /**
     * Update points to be displayed
     */
    setPoints(points) {
        this.syncData.points = points;
        this.render();
    }

    /**
     * Update secant line to be displayed
     */
    setSecantLine(point1, point2) {
        this.syncData.secantLine = { point1, point2 };
        this.render();
    }

    /**
     * Toggle slope triangle display
     */
    setShowSlopeTriangle(show) {
        this.syncData.showSlopeTriangle = show;
        this.render();
    }

    /**
     * Update bounds to match main renderer
     */
    updateBounds(xMin, xMax, yMin, yMax) {
        if (this.mobileRenderer) {
            this.mobileRenderer.setBounds(xMin, xMax, yMin, yMax);
            this.render();
        }
    }

    /**
     * Render all synced content to mobile canvas
     */
    render() {
        if (!this.mobileRenderer) return;

        // Clear canvas
        this.mobileRenderer.clear();

        // Draw grid and axes
        this.mobileRenderer.drawGrid();
        this.mobileRenderer.drawAxes();

        // Draw function
        if (this.syncData.function) {
            this.mobileRenderer.drawFunction(
                this.syncData.function.fn,
                this.syncData.function.color,
                1.5  // Thinner line for mobile
            );
        }

        // Draw secant line with beam effect (simplified for mobile)
        if (this.syncData.secantLine) {
            const { point1, point2 } = this.syncData.secantLine;

            // Simple gradient line for mobile (less processing intensive)
            const x1 = this.mobileRenderer.toCanvasX(point1.x);
            const y1 = this.mobileRenderer.toCanvasY(point1.y);
            const x2 = this.mobileRenderer.toCanvasX(point2.x);
            const y2 = this.mobileRenderer.toCanvasY(point2.y);

            const ctx = this.mobileRenderer.ctx;
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(0, 169, 206, 0.8)');
            gradient.addColorStop(0.5, 'rgba(227, 24, 55, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 64, 152, 0.6)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0, 169, 206, 0.5)';

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Draw slope triangle if enabled
            if (this.syncData.showSlopeTriangle) {
                this.drawMobileSlopeTriangle(point1, point2);
            }
        }

        // Draw points
        for (const point of this.syncData.points) {
            this.mobileRenderer.drawPoint(
                point.x,
                point.y,
                point.label || '',
                point.color || '#E31837',
                3  // Smaller points for mobile
            );
        }
    }

    /**
     * Draw simplified slope triangle for mobile
     */
    drawMobileSlopeTriangle(point1, point2) {
        const ctx = this.mobileRenderer.ctx;
        const x1 = this.mobileRenderer.toCanvasX(point1.x);
        const y1 = this.mobileRenderer.toCanvasY(point1.y);
        const x2 = this.mobileRenderer.toCanvasX(point2.x);
        const y2 = this.mobileRenderer.toCanvasY(point2.y);

        ctx.strokeStyle = 'rgba(227, 24, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    /**
     * Clear all synced data
     */
    clear() {
        this.syncData = {
            function: null,
            points: [],
            secantLine: null,
            showSlopeTriangle: false
        };
        if (this.mobileRenderer) {
            this.mobileRenderer.clear();
            this.mobileRenderer.drawGrid();
            this.mobileRenderer.drawAxes();
        }
    }

    /**
     * Resize handler
     */
    handleResize() {
        if (this.mobileRenderer) {
            this.mobileRenderer.setupCanvas();
            this.render();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileSync;
}
