/**
 * Canvas Module - Shape Manipulation and Drawing
 * Handles shape tearing, moving, and area calculation
 */

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // State
        this.mode = 'cut'; // 'cut' or 'move'
        this.originalShape = null;
        this.pieces = [];
        this.selectedPiece = null;
        this.cutLine = [];
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // Session
        this.sessionId = null;
        this.attemptCount = 0;

        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this));

        // Prevent default touch behavior
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }

    /**
     * Load shape onto canvas
     */
    loadShape(shape, sessionId) {
        this.sessionId = sessionId;
        this.originalShape = {
            vertices: shape.vertices,
            color: shape.color_code,
            area: shape.original_area,
            name: shape.shape_name
        };

        // Create initial piece (the whole shape)
        this.pieces = [{
            vertices: [...shape.vertices],
            color: shape.color_code
        }];

        this.attemptCount = 0;
        this.updateAttemptDisplay();
        this.draw();
    }

    /**
     * Set interaction mode
     */
    setMode(mode) {
        this.mode = mode;
        this.selectedPiece = null;
        this.cutLine = [];
        this.draw();
    }

    /**
     * Handle interaction start (mouse down / touch start)
     */
    handleStart(e) {
        e.preventDefault();
        const pos = this.getPosition(e);

        if (this.mode === 'cut') {
            this.cutLine = [pos];
        } else if (this.mode === 'move') {
            // Find piece at position
            this.selectedPiece = this.findPieceAtPosition(pos);
            if (this.selectedPiece) {
                this.isDragging = true;
                const centroid = this.calculateCentroid(this.selectedPiece.vertices);
                this.dragOffset = {
                    x: pos.x - centroid.x,
                    y: pos.y - centroid.y
                };
            }
        }

        this.draw();
    }

    /**
     * Handle interaction move (mouse move / touch move)
     */
    handleMove(e) {
        e.preventDefault();
        const pos = this.getPosition(e);

        if (this.mode === 'cut' && this.cutLine.length > 0) {
            this.cutLine.push(pos);
            this.draw();
        } else if (this.mode === 'move' && this.isDragging && this.selectedPiece) {
            const centroid = this.calculateCentroid(this.selectedPiece.vertices);
            const dx = pos.x - this.dragOffset.x - centroid.x;
            const dy = pos.y - this.dragOffset.y - centroid.y;

            // Move the piece
            this.selectedPiece.vertices = this.selectedPiece.vertices.map(v => ({
                x: v.x + dx,
                y: v.y + dy
            }));

            this.draw();
        }
    }

    /**
     * Handle interaction end (mouse up / touch end)
     */
    async handleEnd(e) {
        e.preventDefault();

        if (this.mode === 'cut' && this.cutLine.length > 1) {
            // Perform cut
            await this.performCut();
        } else if (this.mode === 'move' && this.isDragging) {
            // Log move action
            if (this.sessionId) {
                await API.logManipulation(
                    this.sessionId,
                    'move',
                    { piece: this.selectedPiece },
                    this.calculatePolygonArea(this.selectedPiece.vertices)
                );
            }
        }

        this.isDragging = false;
        this.cutLine = [];
        this.draw();
    }

    /**
     * Get mouse/touch position relative to canvas
     */
    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * Find piece at given position
     */
    findPieceAtPosition(pos) {
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            if (this.isPointInPolygon(pos, this.pieces[i].vertices)) {
                return this.pieces[i];
            }
        }
        return null;
    }

    /**
     * Check if point is inside polygon
     */
    isPointInPolygon(point, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Perform cut operation
     */
    async performCut() {
        if (this.cutLine.length < 2) return;

        const newPieces = [];

        for (const piece of this.pieces) {
            const cutResult = this.cutPolygon(piece.vertices, this.cutLine);

            if (cutResult.length > 1) {
                // Polygon was cut, add the resulting pieces
                cutResult.forEach(vertices => {
                    if (this.calculatePolygonArea(vertices) > CONFIG.MIN_PIECE_SIZE) {
                        newPieces.push({
                            vertices: vertices,
                            color: piece.color
                        });
                    }
                });
            } else {
                // Polygon was not cut, keep original
                newPieces.push(piece);
            }
        }

        if (newPieces.length > this.pieces.length) {
            this.pieces = newPieces;
            this.attemptCount++;
            this.updateAttemptDisplay();

            // Log cut action
            if (this.sessionId) {
                await API.logManipulation(
                    this.sessionId,
                    'tear',
                    { cutLine: this.cutLine, pieces: this.pieces }
                );
            }

            UIHelpers.showToast('도형이 잘렸습니다!', 'success');
        }

        this.cutLine = [];
    }

    /**
     * Cut polygon by line (simplified implementation)
     * In a real app, you'd use a more sophisticated algorithm like Sutherland-Hodgman
     */
    cutPolygon(vertices, cutLine) {
        // This is a simplified version
        // For a production app, implement proper polygon clipping algorithm

        if (cutLine.length < 2) return [vertices];

        // Get cut line start and end
        const start = cutLine[0];
        const end = cutLine[cutLine.length - 1];

        // Check if cut line intersects polygon
        const intersections = [];
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            const intersection = this.lineIntersection(
                start, end,
                vertices[i], vertices[j]
            );
            if (intersection) {
                intersections.push({
                    point: intersection,
                    edge: i
                });
            }
        }

        // If we have exactly 2 intersections, we can split the polygon
        if (intersections.length === 2) {
            const poly1 = [];
            const poly2 = [];

            let currentPoly = poly1;
            let intersectionIndex = 0;

            for (let i = 0; i < vertices.length; i++) {
                currentPoly.push(vertices[i]);

                // Check if we need to switch polygons
                if (intersectionIndex < intersections.length &&
                    i === intersections[intersectionIndex].edge) {
                    currentPoly.push(intersections[intersectionIndex].point);
                    currentPoly = (currentPoly === poly1) ? poly2 : poly1;
                    currentPoly.push(intersections[intersectionIndex].point);
                    intersectionIndex++;
                }
            }

            return [poly1, poly2];
        }

        // No valid cut, return original
        return [vertices];
    }

    /**
     * Calculate line intersection
     */
    lineIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.001) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }

        return null;
    }

    /**
     * Calculate polygon area using Shoelace formula
     */
    calculatePolygonArea(vertices) {
        let area = 0;
        const n = vertices.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += vertices[i].x * vertices[j].y;
            area -= vertices[j].x * vertices[i].y;
        }

        return Math.abs(area / 2);
    }

    /**
     * Calculate centroid of polygon
     */
    calculateCentroid(vertices) {
        let cx = 0, cy = 0;
        for (const v of vertices) {
            cx += v.x;
            cy += v.y;
        }
        return {
            x: cx / vertices.length,
            y: cy / vertices.length
        };
    }

    /**
     * Draw everything on canvas
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pieces
        this.pieces.forEach(piece => {
            this.drawPolygon(piece.vertices, piece.color,
                piece === this.selectedPiece ?
                CONFIG.SELECTED_PIECE_ALPHA : CONFIG.UNSELECTED_PIECE_ALPHA);
        });

        // Draw cut line
        if (this.cutLine.length > 0) {
            this.ctx.strokeStyle = CONFIG.CUT_LINE_COLOR;
            this.ctx.lineWidth = CONFIG.CUT_LINE_WIDTH;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(this.cutLine[0].x, this.cutLine[0].y);
            for (let i = 1; i < this.cutLine.length; i++) {
                this.ctx.lineTo(this.cutLine[i].x, this.cutLine[i].y);
            }
            this.ctx.stroke();
        }

        // Update current area display
        this.updateAreaDisplay();
    }

    /**
     * Draw polygon
     */
    drawPolygon(vertices, color, alpha = 1.0) {
        if (vertices.length < 3) return;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // Fill
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Stroke
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = CONFIG.LINE_WIDTH;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Get current total area
     */
    getTotalArea() {
        return this.pieces.reduce((sum, piece) => {
            return sum + this.calculatePolygonArea(piece.vertices);
        }, 0);
    }

    /**
     * Update area display
     */
    updateAreaDisplay() {
        const totalArea = this.getTotalArea();
        const areaDisplay = document.getElementById('current-area');
        if (areaDisplay) {
            areaDisplay.textContent = Math.round(totalArea);
        }
    }

    /**
     * Update attempt count display
     */
    updateAttemptDisplay() {
        const attemptDisplay = document.getElementById('attempt-count');
        if (attemptDisplay) {
            attemptDisplay.textContent = this.attemptCount;
        }
    }

    /**
     * Reset to original shape
     */
    reset() {
        if (this.originalShape) {
            this.pieces = [{
                vertices: [...this.originalShape.vertices],
                color: this.originalShape.color
            }];
            this.selectedPiece = null;
            this.cutLine = [];
            this.draw();
            UIHelpers.showToast('초기화되었습니다', 'info');
        }
    }

    /**
     * Validate area conservation
     */
    async validate() {
        if (!this.sessionId) {
            UIHelpers.showToast('세션이 유효하지 않습니다', 'error');
            return null;
        }

        UIHelpers.showLoading();

        try {
            const result = await API.validateArea(this.sessionId, this.pieces);
            UIHelpers.hideLoading();
            return result;
        } catch (error) {
            UIHelpers.hideLoading();
            UIHelpers.showToast('검증 중 오류가 발생했습니다', 'error');
            console.error('Validation error:', error);
            return null;
        }
    }
}
