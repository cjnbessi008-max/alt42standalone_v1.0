/**
 * Function Mood JavaScript
 * Handles API communication and UI updates
 */

class FunctionMoodApp {
    constructor() {
        this.apiUrl = 'api/index.php';
        this.currentProblemId = null;
        this.isMinimized = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDefaultProblem();
    }

    setupEventListeners() {
        // Toggle smartphone visibility
        const toggleBtn = document.querySelector('.smartphone-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSmartphone());
        }

        // Analyze button
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeCustomFunction());
        }
    }

    toggleSmartphone() {
        const container = document.querySelector('.smartphone-container');
        container.classList.toggle('minimized');
        this.isMinimized = !this.isMinimized;

        const toggleBtn = document.querySelector('.smartphone-toggle');
        toggleBtn.innerHTML = this.isMinimized ? '📱' : '✕';
    }

    async loadDefaultProblem() {
        // Load a default function for demonstration
        await this.analyzeFunction('x**2', -10, 10);
    }

    async analyzeCustomFunction() {
        const input = document.getElementById('function-input');
        if (!input || !input.value.trim()) {
            this.showError('Please enter a function expression');
            return;
        }

        const functionExpr = input.value.trim();
        await this.analyzeFunction(functionExpr, -10, 10);
    }

    async analyzeFunction(expression, domainMin, domainMax) {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}?path=analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    function: expression,
                    domain_min: domainMin,
                    domain_max: domainMax
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentProblemId = data.problem_id;
                this.displayAnalysis(expression, data.analysis);
            } else {
                this.showError(data.error || 'Analysis failed');
            }
        } catch (error) {
            this.showError('Failed to analyze function: ' + error.message);
        }
    }

    async loadProblem(problemId) {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}?path=problem&id=${problemId}`);
            const data = await response.json();

            if (data.success) {
                this.currentProblemId = problemId;
                this.displayAnalysis(data.problem.function_expression, data.analysis);
            } else {
                this.showError(data.error || 'Failed to load problem');
            }
        } catch (error) {
            this.showError('Failed to load problem: ' + error.message);
        }
    }

    displayAnalysis(expression, analysis) {
        const content = document.querySelector('.app-content');

        // Get mood emoji
        const emoji = this.getMoodEmoji(analysis.mood_type);

        content.innerHTML = `
            <div class="function-card">
                <div class="function-expression">f(x) = ${this.formatExpression(expression)}</div>
            </div>

            <div class="mood-display" style="background: ${analysis.color};">
                <div class="mood-emoji">${emoji}</div>
                <div class="mood-label">${analysis.emotion}</div>
                <div class="mood-description">${analysis.description}</div>
            </div>

            <div class="function-card">
                <div class="scores-container">
                    <div class="score-item">
                        <div class="score-label">완만함</div>
                        <div class="score-value">${analysis.smoothness}</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${analysis.smoothness}%;"></div>
                        </div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">급변도</div>
                        <div class="score-value">${analysis.steepness}</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${analysis.steepness}%;"></div>
                        </div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">변화율</div>
                        <div class="score-value">${analysis.variation}</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${analysis.variation}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="graph-container">
                <div class="graph-title">함수 그래프</div>
                <canvas id="function-graph" class="graph-canvas"></canvas>
            </div>
        `;

        // Draw graph
        this.drawFunctionGraph(expression, analysis.color);

        // Animate scores
        setTimeout(() => {
            this.animateScores();
        }, 100);
    }

    getMoodEmoji(moodType) {
        const emojiMap = {
            'calm': '😌',
            'steady': '😊',
            'energetic': '😄',
            'dynamic': '🤩',
            'explosive': '🤯',
            'chaotic': '😵'
        };
        return emojiMap[moodType] || '😐';
    }

    formatExpression(expr) {
        // Format mathematical expression for display
        return expr
            .replace(/\*\*/g, '^')
            .replace(/\*/g, '·')
            .replace(/sqrt/g, '√');
    }

    drawFunctionGraph(expression, color) {
        const canvas = document.getElementById('function-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // Draw function curve (simplified visualization)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        const points = 100;
        const xMin = -10;
        const xMax = 10;
        const xRange = xMax - xMin;

        for (let i = 0; i <= points; i++) {
            const x = xMin + (xRange * i / points);
            const y = this.evaluateSimple(expression, x);

            if (isFinite(y)) {
                const canvasX = (x - xMin) / xRange * width;
                const canvasY = height / 2 - (y * 20); // Scale factor

                if (i === 0) {
                    ctx.moveTo(canvasX, canvasY);
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        ctx.stroke();
    }

    evaluateSimple(expression, x) {
        // Simple evaluation for common functions
        // This is a basic implementation - expand as needed
        try {
            let expr = expression.replace(/x/g, `(${x})`);
            expr = expr.replace(/\^/g, '**');

            // Support basic math functions
            const sin = Math.sin;
            const cos = Math.cos;
            const tan = Math.tan;
            const sqrt = Math.sqrt;
            const abs = Math.abs;
            const exp = Math.exp;
            const log = Math.log;
            const pow = Math.pow;

            return eval(expr);
        } catch (e) {
            return NaN;
        }
    }

    animateScores() {
        const fills = document.querySelectorAll('.score-fill');
        fills.forEach(fill => {
            const width = fill.style.width;
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.width = width;
            }, 50);
        });
    }

    showLoading() {
        const content = document.querySelector('.app-content');
        content.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>함수를 분석하는 중...</div>
            </div>
        `;
    }

    showError(message) {
        const content = document.querySelector('.app-content');
        content.innerHTML = `
            <div class="error-message">
                ⚠️ ${message}
            </div>
        `;
    }

    async syncFromMoodle(courseId) {
        try {
            const response = await fetch(`${this.apiUrl}?path=sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    course_id: courseId
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`동기화 완료: ${data.sync_result.imported}개 문제 가져옴`);
            } else {
                this.showError(data.error || 'Sync failed');
            }
        } catch (error) {
            this.showError('Failed to sync from Moodle: ' + error.message);
        }
    }

    async getMoodConfigurations() {
        try {
            const response = await fetch(`${this.apiUrl}?path=moods`);
            const data = await response.json();

            if (data.success) {
                return data.moods;
            }
        } catch (error) {
            console.error('Failed to fetch mood configurations:', error);
        }
        return [];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.functionMoodApp = new FunctionMoodApp();
});

// Moodle integration helper
function loadMoodleProblem(problemId) {
    if (window.functionMoodApp) {
        window.functionMoodApp.loadProblem(problemId);
    }
}

function syncMoodleCourse(courseId) {
    if (window.functionMoodApp) {
        window.functionMoodApp.syncFromMoodle(courseId);
    }
}
