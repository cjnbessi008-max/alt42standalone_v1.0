/**
 * Shape Rendering and Management
 */

class Shape {
    constructor(data) {
        this.id = data.shape_id;
        this.name = data.name;
        this.type = data.type;
        this.color = data.color || CONFIG.SHAPES.DEFAULT_COLOR;
        this.description = data.description;
        this.properties = data.mathematical_properties || {};
        this.detailedProperties = data.properties || [];

        // Position and size
        this.x = CONFIG.CANVAS.WIDTH / 2;
        this.y = CONFIG.CANVAS.HEIGHT / 2;
        this.size = CONFIG.SHAPES.DEFAULT_SIZE;
        this.rotation = 0;
        this.scale = 1;

        // Animation state
        this.isAnimating = false;
        this.currentAnimation = null;
    }

    /**
     * Draw the shape on canvas
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = CONFIG.SHAPES.STROKE_COLOR;
        ctx.lineWidth = CONFIG.SHAPES.STROKE_WIDTH;

        switch (this.type) {
            case 'circle':
                this.drawCircle(ctx);
                break;
            case 'square':
                this.drawSquare(ctx);
                break;
            case 'triangle':
                this.drawTriangle(ctx);
                break;
            case 'rectangle':
                this.drawRectangle(ctx);
                break;
            case 'pentagon':
                this.drawPolygon(ctx, 5);
                break;
            case 'hexagon':
                this.drawPolygon(ctx, 6);
                break;
            default:
                this.drawCircle(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw circle
     */
    drawCircle(ctx) {
        const radius = this.size / 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw square
     */
    drawSquare(ctx) {
        const half = this.size / 2;
        ctx.beginPath();
        ctx.rect(-half, -half, this.size, this.size);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw triangle (equilateral)
     */
    drawTriangle(ctx) {
        const height = (this.size * Math.sqrt(3)) / 2;
        ctx.beginPath();
        ctx.moveTo(0, -height * 2/3);
        ctx.lineTo(-this.size / 2, height / 3);
        ctx.lineTo(this.size / 2, height / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw rectangle
     */
    drawRectangle(ctx) {
        const width = this.size * 1.2;
        const height = this.size * 0.8;
        ctx.beginPath();
        ctx.rect(-width / 2, -height / 2, width, height);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw regular polygon
     */
    drawPolygon(ctx, sides) {
        const angle = (Math.PI * 2) / sides;
        const radius = this.size / 2;

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const x = radius * Math.cos(angle * i - Math.PI / 2);
            const y = radius * Math.sin(angle * i - Math.PI / 2);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Check if point is inside shape
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        switch (this.type) {
            case 'circle':
                return distance <= this.size / 2;
            case 'square':
            case 'rectangle':
                const halfWidth = this.type === 'square' ? this.size / 2 : (this.size * 1.2) / 2;
                const halfHeight = this.type === 'square' ? this.size / 2 : (this.size * 0.8) / 2;
                return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
            default:
                return distance <= this.size / 2;
        }
    }

    /**
     * Get shape properties as array
     */
    getPropertiesArray() {
        const props = [];

        if (this.detailedProperties && this.detailedProperties.length > 0) {
            return this.detailedProperties.map(prop => ({
                name: prop.name,
                value: prop.value,
                type: prop.type
            }));
        }

        // Fallback to mathematical properties
        for (const [key, value] of Object.entries(this.properties)) {
            props.push({
                name: key,
                value: typeof value === 'number' ? Utils.formatNumber(value) : value,
                type: 'geometric'
            });
        }

        return props;
    }
}

class ShapeRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentShape = null;
        this.shapes = [];
        this.transformations = [];

        this.setupCanvas();
        this.setupInteraction();
    }

    /**
     * Setup canvas
     */
    setupCanvas() {
        // Set canvas size
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    /**
     * Setup interaction handlers
     */
    setupInteraction() {
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;

        const handleStart = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

            touchStartTime = Date.now();
            touchStartX = x;
            touchStartY = y;

            if (this.currentShape && this.currentShape.containsPoint(x, y)) {
                Utils.log('Shape touched:', this.currentShape.name);
                this.onShapeTouch(x, y);
            }
        };

        const handleEnd = (e) => {
            const duration = Date.now() - touchStartTime;
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
            const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top;

            // Track interaction
            SessionManager.trackInteraction({
                shape_id: this.currentShape?.id,
                interaction_type: 'tap',
                start_x: touchStartX,
                start_y: touchStartY,
                end_x: x,
                end_y: y,
                duration_ms: duration
            });
        };

        this.canvas.addEventListener('mousedown', handleStart);
        this.canvas.addEventListener('touchstart', handleStart);
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('touchend', handleEnd);
    }

    /**
     * Handle shape touch
     */
    onShapeTouch(x, y) {
        if (!this.currentShape || this.currentShape.isAnimating) return;

        // Pulse animation on touch
        this.animatePulse();

        // Display properties
        this.displayProperties();
    }

    /**
     * Animate pulse effect
     */
    animatePulse() {
        const originalScale = this.currentShape.scale;
        const animator = new ShapeAnimator(this.currentShape);

        animator.animate({
            property: 'scale',
            from: originalScale,
            to: originalScale * 1.2,
            duration: 300,
            easing: 'easeOutQuad',
            onComplete: () => {
                animator.animate({
                    property: 'scale',
                    from: originalScale * 1.2,
                    to: originalScale,
                    duration: 300,
                    easing: 'easeInQuad'
                });
            }
        });
    }

    /**
     * Display shape properties
     */
    displayProperties() {
        const panel = document.getElementById('propertiesContent');
        if (!panel || !this.currentShape) return;

        const properties = this.currentShape.getPropertiesArray();
        let html = '';

        if (properties.length === 0) {
            html = '<p class="hint">속성 정보가 없습니다</p>';
        } else {
            properties.forEach(prop => {
                html += `
                    <div class="property-item">
                        <span class="property-name">${prop.name}</span>
                        <span class="property-value">${prop.value}</span>
                    </div>
                `;
            });
        }

        panel.innerHTML = html;

        // Track properties viewed
        SessionManager.trackInteraction({
            shape_id: this.currentShape.id,
            interaction_type: 'touch',
            properties_viewed: properties.map(p => p.name)
        });
    }

    /**
     * Load and display shape
     */
    async loadShape(shapeId) {
        try {
            const response = await API.getShape(shapeId);
            if (response.success) {
                this.currentShape = new Shape(response.data);
                this.render();
                this.displayProperties();
                Utils.log('Shape loaded:', this.currentShape.name);
            }
        } catch (error) {
            Utils.error('Failed to load shape:', error);
        }
    }

    /**
     * Render current shape
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid if enabled
        if (CONFIG.CANVAS.SHOW_GRID) {
            this.drawGrid();
        }

        // Draw current shape
        if (this.currentShape) {
            this.currentShape.draw(this.ctx);
        }
    }

    /**
     * Draw grid
     */
    drawGrid() {
        const gridSize = 20;
        this.ctx.strokeStyle = CONFIG.CANVAS.GRID_COLOR;
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Start animation loop
     */
    startAnimationLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
}
