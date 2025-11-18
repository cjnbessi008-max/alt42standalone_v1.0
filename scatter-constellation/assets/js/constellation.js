/**
 * Constellation Visualization Engine
 * 별자리 시각화 엔진 - Canvas를 사용한 산점도 별자리 그리기
 */

class ConstellationEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.connections = [];
        this.selectedPoint = null;
        this.hoveredPoint = null;
        this.animationFrame = null;

        // Settings
        this.settings = {
            autoConnect: true,
            maxConnectionDistance: 3.0,
            pointSizeMin: 4,
            pointSizeMax: 12,
            lineWidth: 2,
            lineAlpha: 0.3,
            glowEnabled: true,
            animationSpeed: 1
        };

        // Resize canvas to fit container
        this.resizeCanvas();

        // Event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    /**
     * Resize canvas to match display size
     */
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseMove(x, y);
        });

        // Mouse click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleClick(x, y);
        });

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCanvas();
            this.updatePointPositions();
        }, 250));
    }

    /**
     * Load problem data and create constellation points
     */
    loadProblems(problems) {
        this.points = [];
        this.connections = [];

        if (!problems || problems.length === 0) {
            this.showEmptyState();
            return;
        }

        // Create points from problems
        problems.forEach((problem, index) => {
            const point = this.createPoint(problem, index);
            this.points.push(point);
        });

        // Auto-connect nearby points
        if (this.settings.autoConnect) {
            this.createConnections();
        }

        // Trigger initial animation
        this.animatePointsIn();
    }

    /**
     * Create a constellation point from problem data
     */
    createPoint(problem, index) {
        // Map difficulty (0-10) to x-axis
        // Map score (0-100) to y-axis
        const x = Utils.map(problem.x || problem.difficulty || 5, 0, 10, 50, this.width - 50);
        const y = Utils.map(problem.y || problem.score || 50, 0, 100, this.height - 50, 50);

        // Size based on importance/grade
        const size = Utils.map(
            problem.max_grade || problem.grade || 5,
            0, 100,
            this.settings.pointSizeMin,
            this.settings.pointSizeMax
        );

        return {
            id: problem.id || index,
            name: problem.name || problem.problem_name || `Problem ${index + 1}`,
            type: problem.type || problem.problem_type || 'question',
            difficulty: problem.difficulty || 5,
            score: problem.score || 0,
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            size: size,
            color: problem.color || this.getColorByDifficulty(problem.difficulty || 5),
            alpha: 0, // For fade-in animation
            data: problem
        };
    }

    /**
     * Get color based on difficulty level
     */
    getColorByDifficulty(difficulty) {
        if (difficulty >= 8) return '#FF4444'; // Hard - Red
        if (difficulty >= 6) return '#FFA500'; // Medium-Hard - Orange
        if (difficulty >= 4) return '#FFD700'; // Medium - Gold
        if (difficulty >= 2) return '#44FF44'; // Easy-Medium - Green
        return '#4444FF'; // Easy - Blue
    }

    /**
     * Create connections between nearby points
     */
    createConnections() {
        this.connections = [];

        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];

                // Calculate distance in normalized space
                const dx = (p2.x - p1.x) / this.width * 10;
                const dy = (p2.y - p1.y) / this.height * 10;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect if within threshold
                if (distance <= this.settings.maxConnectionDistance) {
                    this.connections.push({
                        from: i,
                        to: j,
                        strength: 1 - (distance / this.settings.maxConnectionDistance)
                    });
                }
            }
        }
    }

    /**
     * Animate points appearing
     */
    animatePointsIn() {
        const duration = 1000; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.points.forEach((point, index) => {
                const delay = index * 50; // Stagger animation
                const pointProgress = Utils.clamp((elapsed - delay) / duration, 0, 1);
                point.alpha = Utils.easeInOut(pointProgress);
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(x, y) {
        let foundPoint = null;

        for (const point of this.points) {
            if (Utils.pointInCircle(x, y, point.x, point.y, point.size * 2)) {
                foundPoint = point;
                break;
            }
        }

        if (foundPoint !== this.hoveredPoint) {
            this.hoveredPoint = foundPoint;
            this.canvas.style.cursor = foundPoint ? 'pointer' : 'crosshair';
        }
    }

    /**
     * Handle click
     */
    handleClick(x, y) {
        for (const point of this.points) {
            if (Utils.pointInCircle(x, y, point.x, point.y, point.size * 2)) {
                this.selectPoint(point);
                return;
            }
        }

        // Clicked empty space - deselect
        this.selectPoint(null);
    }

    /**
     * Select a point
     */
    selectPoint(point) {
        this.selectedPoint = point;

        // Trigger event for external listeners
        const event = new CustomEvent('pointSelected', {
            detail: point
        });
        this.canvas.dispatchEvent(event);
    }

    /**
     * Update point positions (after resize)
     */
    updatePointPositions() {
        this.points.forEach(point => {
            // Recalculate positions based on new canvas size
            point.x = Utils.map(point.difficulty, 0, 10, 50, this.width - 50);
            point.y = Utils.map(point.score, 0, 100, this.height - 50, 50);
        });
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('문제 데이터가 없습니다', this.width / 2, this.height / 2 - 20);
        this.ctx.fillText('Course를 선택해주세요', this.width / 2, this.height / 2 + 10);
    }

    /**
     * Main animation loop
     */
    animate() {
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Draw everything
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw grid
        this.drawGrid();

        // Draw connections
        this.drawConnections();

        // Draw points
        this.drawPoints();

        // Draw axis labels
        this.drawAxisLabels();
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        // Vertical lines
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw connections between points
     */
    drawConnections() {
        this.connections.forEach(conn => {
            const from = this.points[conn.from];
            const to = this.points[conn.to];

            if (!from || !to) return;

            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.settings.lineAlpha * conn.strength * from.alpha * to.alpha})`;
            this.ctx.lineWidth = this.settings.lineWidth;

            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();
        });
    }

    /**
     * Draw constellation points
     */
    drawPoints() {
        this.points.forEach(point => {
            const isSelected = point === this.selectedPoint;
            const isHovered = point === this.hoveredPoint;
            const scale = isSelected ? 1.5 : isHovered ? 1.3 : 1;
            const size = point.size * scale;

            // Glow effect
            if (this.settings.glowEnabled && point.alpha > 0) {
                const gradient = this.ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, size * 3
                );
                gradient.addColorStop(0, point.color + Math.floor(point.alpha * 255).toString(16).padStart(2, '0'));
                gradient.addColorStop(1, point.color + '00');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Main point
            this.ctx.fillStyle = point.color;
            this.ctx.globalAlpha = point.alpha;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Border for selected
            if (isSelected) {
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            this.ctx.globalAlpha = 1;

            // Show label on hover
            if (isHovered || isSelected) {
                this.drawPointLabel(point);
            }
        });
    }

    /**
     * Draw label for a point
     */
    drawPointLabel(point) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = '10px sans-serif';

        const text = point.name;
        const metrics = this.ctx.measureText(text);
        const padding = 6;
        const labelX = point.x - metrics.width / 2 - padding;
        const labelY = point.y - point.size - 20;

        // Background
        this.ctx.fillRect(
            labelX,
            labelY,
            metrics.width + padding * 2,
            16
        );

        // Text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, point.x, labelY + 12);
        this.ctx.textAlign = 'left';
    }

    /**
     * Draw axis labels
     */
    drawAxisLabels() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '10px sans-serif';

        // X-axis label (Difficulty)
        this.ctx.textAlign = 'right';
        this.ctx.fillText('난이도 →', this.width - 10, this.height - 10);

        // Y-axis label (Score)
        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('점수 →', 0, 0);
        this.ctx.restore();
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.points = [];
        this.connections = [];
    }
}
