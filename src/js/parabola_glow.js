/**
 * Parabola Glow Visualization
 * Renders quadratic functions with glowing solution regions
 */

class ParabolaGlow {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.width = 320;
        this.height = 400;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Coordinate system parameters
        this.padding = 40;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;

        // Data
        this.data = null;
    }

    /**
     * Set problem data and render
     * @param {Object} data - Solution data from API
     */
    setData(data) {
        this.data = data;
        this.render();
    }

    /**
     * Calculate coordinate bounds based on roots and vertex
     */
    calculateBounds() {
        if (!this.data) return { minX: -5, maxX: 5, minY: -5, maxY: 5 };

        const { roots, vertex } = this.data;

        let minX, maxX;
        if (roots.length === 2) {
            const range = Math.abs(roots[1] - roots[0]);
            const margin = range * 0.5;
            minX = roots[0] - margin;
            maxX = roots[1] + margin;
        } else if (roots.length === 1) {
            minX = roots[0] - 5;
            maxX = roots[0] + 5;
        } else {
            minX = vertex.x - 5;
            maxX = vertex.x + 5;
        }

        // Calculate Y range
        const { a, b, c } = this.data.coefficients;
        const yAtMin = a * minX * minX + b * minX + c;
        const yAtMax = a * maxX * maxX + b * maxX + c;
        const yValues = [yAtMin, yAtMax, vertex.y, 0];

        const minY = Math.min(...yValues) - 2;
        const maxY = Math.max(...yValues) + 2;

        return { minX, maxX, minY, maxY };
    }

    /**
     * Convert mathematical coordinates to canvas coordinates
     */
    toCanvasX(x, bounds) {
        const { minX, maxX } = bounds;
        return this.padding + ((x - minX) / (maxX - minX)) * this.graphWidth;
    }

    toCanvasY(y, bounds) {
        const { minY, maxY } = bounds;
        return this.height - this.padding - ((y - minY) / (maxY - minY)) * this.graphHeight;
    }

    /**
     * Main rendering function
     */
    render() {
        if (!this.data) return;

        const bounds = this.calculateBounds();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw glow effect first (below parabola)
        this.drawGlowEffect(bounds);

        // Draw axes
        this.drawAxes(bounds);

        // Draw parabola
        this.drawParabola(bounds);

        // Draw roots
        this.drawRoots(bounds);

        // Draw vertex
        this.drawVertex(bounds);
    }

    /**
     * Draw coordinate axes
     */
    drawAxes(bounds) {
        const { minX, maxX, minY, maxY } = bounds;

        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;

        // Y-axis
        if (minX <= 0 && maxX >= 0) {
            const x = this.toCanvasX(0, bounds);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.height - this.padding);
            this.ctx.stroke();
        }

        // X-axis
        if (minY <= 0 && maxY >= 0) {
            const y = this.toCanvasY(0, bounds);
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(this.width - this.padding, y);
            this.ctx.stroke();
        }

        // Draw tick marks and labels
        this.drawTickMarks(bounds);
    }

    /**
     * Draw tick marks on axes
     */
    drawTickMarks(bounds) {
        const { minX, maxX, minY, maxY } = bounds;

        this.ctx.fillStyle = '#666666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        // X-axis ticks
        const xRange = maxX - minX;
        const xStep = Math.max(1, Math.floor(xRange / 8));
        const xStart = Math.ceil(minX / xStep) * xStep;

        for (let x = xStart; x <= maxX; x += xStep) {
            const canvasX = this.toCanvasX(x, bounds);
            const y0 = this.toCanvasY(0, bounds);

            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, y0 - 3);
            this.ctx.lineTo(canvasX, y0 + 3);
            this.ctx.stroke();

            if (x !== 0) {
                this.ctx.fillText(x.toFixed(0), canvasX, y0 + 15);
            }
        }
    }

    /**
     * Draw the parabola curve
     */
    drawParabola(bounds) {
        const { a, b, c } = this.data.coefficients;
        const { minX, maxX } = bounds;

        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        const step = (maxX - minX) / 200;
        let firstPoint = true;

        for (let x = minX; x <= maxX; x += step) {
            const y = a * x * x + b * x + c;
            const canvasX = this.toCanvasX(x, bounds);
            const canvasY = this.toCanvasY(y, bounds);

            if (firstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw glowing effect for solution regions
     */
    drawGlowEffect(bounds) {
        const { solution, opens_upward, operator } = this.data;
        const { a, b, c } = this.data.coefficients;
        const { minX, maxX, minY, maxY } = bounds;

        if (solution.type === 'empty') {
            return; // No glow for empty solution
        }

        if (solution.type === 'all') {
            // Glow the entire region
            this.fillGlowRegion(minX, maxX, bounds, opens_upward, operator);
            return;
        }

        // Glow specific intervals
        solution.intervals.forEach(interval => {
            const start = interval.start === -Infinity ? minX : interval.start;
            const end = interval.end === Infinity ? maxX : interval.end;
            this.fillGlowRegion(start, end, bounds, opens_upward, operator);
        });
    }

    /**
     * Fill a glowing region
     */
    fillGlowRegion(startX, endX, bounds, opensUpward, operator) {
        const { a, b, c } = this.data.coefficients;
        const { minY, maxY } = bounds;

        // Create gradient for glow effect
        const gradient = this.ctx.createLinearGradient(
            0, this.toCanvasY(maxY, bounds),
            0, this.toCanvasY(minY, bounds)
        );

        // Determine if we should glow above or below the parabola
        const glowBelow = (opensUpward && (operator === '<' || operator === '<=')) ||
                         (!opensUpward && (operator === '>' || operator === '>='));

        if (glowBelow) {
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.0)');
            gradient.addColorStop(0.3, 'rgba(102, 126, 234, 0.15)');
            gradient.addColorStop(0.6, 'rgba(102, 126, 234, 0.25)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0.35)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 193, 7, 0.35)');
            gradient.addColorStop(0.4, 'rgba(255, 193, 7, 0.25)');
            gradient.addColorStop(0.7, 'rgba(255, 193, 7, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 193, 7, 0.0)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        const step = (endX - startX) / 100;
        let firstPoint = true;

        // Draw along the parabola
        for (let x = startX; x <= endX; x += step) {
            const y = a * x * x + b * x + c;
            const canvasX = this.toCanvasX(x, bounds);
            const canvasY = this.toCanvasY(y, bounds);

            if (firstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        // Complete the region
        if (glowBelow) {
            const endCanvasX = this.toCanvasX(endX, bounds);
            const startCanvasX = this.toCanvasX(startX, bounds);
            this.ctx.lineTo(endCanvasX, this.toCanvasY(minY, bounds));
            this.ctx.lineTo(startCanvasX, this.toCanvasY(minY, bounds));
        } else {
            const endCanvasX = this.toCanvasX(endX, bounds);
            const startCanvasX = this.toCanvasX(startX, bounds);
            this.ctx.lineTo(endCanvasX, this.toCanvasY(maxY, bounds));
            this.ctx.lineTo(startCanvasX, this.toCanvasY(maxY, bounds));
        }

        this.ctx.closePath();
        this.ctx.fill();

        // Add extra glow with blur (simulate CSS filter)
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = glowBelow ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 193, 7, 0.4)';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw root points
     */
    drawRoots(bounds) {
        const { roots } = this.data;

        if (roots.length === 0) return;

        this.ctx.fillStyle = '#ff4757';
        roots.forEach(root => {
            const canvasX = this.toCanvasX(root, bounds);
            const canvasY = this.toCanvasY(0, bounds);

            // Draw point
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw label
            this.ctx.fillStyle = '#333333';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(root.toFixed(2), canvasX, canvasY - 10);
            this.ctx.fillStyle = '#ff4757';
        });
    }

    /**
     * Draw vertex point
     */
    drawVertex(bounds) {
        const { vertex } = this.data;

        const canvasX = this.toCanvasX(vertex.x, bounds);
        const canvasY = this.toCanvasY(vertex.y, bounds);

        // Draw point
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw label
        this.ctx.fillStyle = '#333333';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `V(${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)})`,
            canvasX + 8,
            canvasY - 5
        );
    }
}

// App Controller
class ParabolaGlowApp {
    constructor() {
        this.visualizer = new ParabolaGlow('parabolaCanvas');
        this.currentProblem = null;
    }

    /**
     * Initialize the app
     */
    async init() {
        this.showLoading();
        await this.loadProblem();
    }

    /**
     * Load problem from Moodle
     */
    async loadProblem(questionId = null) {
        try {
            const url = questionId
                ? `src/api/moodle_integration.php?id=${questionId}`
                : 'src/api/moodle_integration.php';

            const response = await fetch(url);
            const problem = await response.json();

            this.currentProblem = problem;
            this.displayProblem(problem);
            await this.solveProblem(problem.inequality);

        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는데 실패했습니다.');
        }
    }

    /**
     * Solve the inequality
     */
    async solveProblem(inequality) {
        try {
            const response = await fetch('src/api/parabola_solver.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inequality)
            });

            const solution = await response.json();

            if (solution.error) {
                this.showError(solution.message);
                return;
            }

            this.displaySolution(solution);
            this.visualizer.setData(solution);

        } catch (error) {
            console.error('Error solving problem:', error);
            this.showError('문제 해결 중 오류가 발생했습니다.');
        }
    }

    /**
     * Display problem information
     */
    displayProblem(problem) {
        document.getElementById('problemTitle').textContent = problem.title;
        document.getElementById('problemText').textContent = problem.problem_text;
    }

    /**
     * Display solution
     */
    displaySolution(solution) {
        const solutionText = document.getElementById('solutionText');
        const solutionDetails = document.getElementById('solutionDetails');

        solutionText.textContent = `해: ${solution.solution.description}`;

        // Display details
        let detailsHTML = '';

        // Discriminant
        const discText = solution.discriminant > 0 ? '두 개의 실근' :
                        (solution.discriminant === 0 ? '중근' : '실근 없음');
        detailsHTML += `
            <div class="detail-item">
                <span class="detail-label">판별식 (D)</span>
                <span class="detail-value">${solution.discriminant.toFixed(2)} (${discText})</span>
            </div>
        `;

        // Vertex
        detailsHTML += `
            <div class="detail-item">
                <span class="detail-label">꼭짓점</span>
                <span class="detail-value">(${solution.vertex.x.toFixed(2)}, ${solution.vertex.y.toFixed(2)})</span>
            </div>
        `;

        // Roots
        if (solution.roots.length > 0) {
            const rootsText = solution.roots.map(r => r.toFixed(2)).join(', ');
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">근</span>
                    <span class="detail-value">${rootsText}</span>
                </div>
            `;
        }

        // Opens direction
        detailsHTML += `
            <div class="detail-item">
                <span class="detail-label">포물선 방향</span>
                <span class="detail-value">${solution.opens_upward ? '위로 볼록 ∪' : '아래로 볼록 ∩'}</span>
            </div>
        `;

        solutionDetails.innerHTML = detailsHTML;

        // Hide loading, show content
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <strong>오류</strong><br>
                ${message}
            </div>
        `;
    }

    /**
     * Load a different problem example
     */
    loadExample(a, b, c, operator) {
        this.currentProblem = {
            id: 0,
            title: '예제 문제',
            problem_text: `${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} ${operator} 0`,
            inequality: { a, b, c, operator }
        };

        this.displayProblem(this.currentProblem);
        this.solveProblem(this.currentProblem.inequality);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ParabolaGlowApp();
    app.init();
});
