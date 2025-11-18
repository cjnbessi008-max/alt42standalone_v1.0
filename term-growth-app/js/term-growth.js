/**
 * Term Growth - Function Visualization System
 *
 * Visualizes polynomial functions by progressively adding terms
 * and showing how the graph evolves with each addition
 */

class TermGrowth {
    constructor() {
        this.currentStep = 0;
        this.terms = [];
        this.problemData = null;
        this.chart = null;
        this.autoPlayInterval = null;
        this.isAutoPlaying = false;

        // Configuration
        this.config = {
            animationDuration: 800,
            autoPlayDelay: 2000,
            xRange: [-5, 5],
            yRange: [-10, 30],
            pointCount: 100
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for Moodle problem data
        window.addEventListener('moodleProblemLoaded', (event) => {
            this.loadProblem(event.detail);
        });

        // Setup event listeners
        this.setupEventListeners();

        // Initialize chart
        this.initChart();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Control panel buttons
        document.getElementById('nextTermBtn')?.addEventListener('click', () => {
            this.addNextTerm();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('autoPlayBtn')?.addEventListener('click', () => {
            this.toggleAutoPlay();
        });

        // Student button
        document.getElementById('studentNextBtn')?.addEventListener('click', () => {
            this.addNextTerm();
        });
    }

    /**
     * Load problem data
     */
    loadProblem(data) {
        this.problemData = data;
        this.terms = data.terms || [];
        this.config.xRange = data.xRange || [-5, 5];
        this.config.yRange = data.yRange || [-10, 30];

        // Update UI
        this.updateProblemInfo();
        this.renderTermList();
        this.updateProgress();
        this.reset();
    }

    /**
     * Initialize Chart.js graph
     */
    initChart() {
        const ctx = document.getElementById('termGrowthChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'f(x)',
                    data: [],
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: this.config.animationDuration,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        min: this.config.xRange[0],
                        max: this.config.xRange[1],
                        grid: {
                            color: (context) => {
                                if (context.tick.value === 0) {
                                    return '#2C3E50';
                                }
                                return '#E1E8ED';
                            },
                            lineWidth: (context) => {
                                if (context.tick.value === 0) {
                                    return 2;
                                }
                                return 1;
                            }
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        min: this.config.yRange[0],
                        max: this.config.yRange[1],
                        grid: {
                            color: (context) => {
                                if (context.tick.value === 0) {
                                    return '#2C3E50';
                                }
                                return '#E1E8ED';
                            },
                            lineWidth: (context) => {
                                if (context.tick.value === 0) {
                                    return 2;
                                }
                                return 1;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate function value for current terms
     */
    calculateFunction(x) {
        let result = 0;

        for (let i = 0; i <= this.currentStep; i++) {
            const term = this.terms[i];
            if (term) {
                result += term.coefficient * Math.pow(x, term.power);
            }
        }

        return result;
    }

    /**
     * Generate data points for the current function
     */
    generateDataPoints() {
        const points = [];
        const step = (this.config.xRange[1] - this.config.xRange[0]) / this.config.pointCount;

        for (let x = this.config.xRange[0]; x <= this.config.xRange[1]; x += step) {
            const y = this.calculateFunction(x);
            points.push({ x: x, y: y });
        }

        return points;
    }

    /**
     * Update the graph with current function
     */
    updateGraph() {
        if (!this.chart) return;

        const dataPoints = this.generateDataPoints();

        // Update chart data
        this.chart.data.datasets[0].data = dataPoints;
        this.chart.data.datasets[0].label = this.getCurrentFunctionString();

        // Update y-axis range if needed
        const yValues = dataPoints.map(p => p.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        // Add padding
        const padding = (maxY - minY) * 0.2;
        this.chart.options.scales.y.min = Math.floor(minY - padding);
        this.chart.options.scales.y.max = Math.ceil(maxY + padding);

        // Update chart
        this.chart.update();
    }

    /**
     * Get current function as a string
     */
    getCurrentFunctionString() {
        if (this.currentStep < 0) {
            return 'f(x) = 0';
        }

        let functionStr = 'f(x) = ';
        let termStrings = [];

        for (let i = 0; i <= this.currentStep && i < this.terms.length; i++) {
            const term = this.terms[i];
            let termStr = '';

            // Handle coefficient
            const coef = term.coefficient;
            const absCoef = Math.abs(coef);

            if (i > 0) {
                termStr += coef >= 0 ? ' + ' : ' - ';
            } else {
                if (coef < 0) termStr += '-';
            }

            // Add coefficient if not 1 (unless it's a constant term)
            if (term.power === 0) {
                termStr += absCoef;
            } else if (absCoef !== 1) {
                termStr += absCoef;
            }

            // Add variable and power
            if (term.power === 1) {
                termStr += 'x';
            } else if (term.power > 1) {
                termStr += `x²`.replace('²', this.getSuperscript(term.power));
            }

            termStrings.push(termStr);
        }

        return functionStr + termStrings.join('');
    }

    /**
     * Get superscript for power
     */
    getSuperscript(power) {
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return power.toString().split('').map(d => superscripts[d] || d).join('');
    }

    /**
     * Add next term
     */
    addNextTerm() {
        if (this.currentStep >= this.terms.length - 1) {
            this.complete();
            return;
        }

        this.currentStep++;
        this.updateDisplay();
        this.updateGraph();
        this.updateProgress();
        this.renderTermList();

        // Send progress to Moodle
        this.sendProgressToMoodle();

        // Check if completed
        if (this.currentStep >= this.terms.length - 1) {
            setTimeout(() => this.complete(), 500);
        }
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.currentStep = -1;
        this.stopAutoPlay();
        this.updateDisplay();
        this.updateGraph();
        this.updateProgress();
        this.renderTermList();
    }

    /**
     * Toggle auto-play mode
     */
    toggleAutoPlay() {
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    /**
     * Start auto-play mode
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        const btn = document.getElementById('autoPlayBtn');
        if (btn) {
            btn.textContent = '일시정지';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        }

        this.autoPlayInterval = setInterval(() => {
            if (this.currentStep >= this.terms.length - 1) {
                this.stopAutoPlay();
                return;
            }
            this.addNextTerm();
        }, this.config.autoPlayDelay);
    }

    /**
     * Stop auto-play mode
     */
    stopAutoPlay() {
        this.isAutoPlaying = false;
        const btn = document.getElementById('autoPlayBtn');
        if (btn) {
            btn.textContent = '자동 재생';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-success');
        }

        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    /**
     * Update problem information display
     */
    updateProblemInfo() {
        if (!this.problemData) return;

        const problemId = document.getElementById('problemId');
        const difficulty = document.getElementById('difficulty');
        const objective = document.getElementById('objective');

        if (problemId) problemId.textContent = this.problemData.id;
        if (difficulty) difficulty.textContent = this.problemData.difficulty;
        if (objective) objective.textContent = this.problemData.objective;
    }

    /**
     * Update display elements
     */
    updateDisplay() {
        // Update current function display
        const functionDisplay = document.getElementById('currentFunction');
        if (functionDisplay) {
            functionDisplay.textContent = this.getCurrentFunctionString();
        }

        // Update current term display in smartphone
        const currentTermValue = document.getElementById('currentTermValue');
        const termExplanation = document.getElementById('termExplanation');

        if (this.currentStep >= 0 && this.currentStep < this.terms.length) {
            const term = this.terms[this.currentStep];
            if (currentTermValue) {
                currentTermValue.textContent = term.expression;
            }
            if (termExplanation) {
                termExplanation.textContent = term.description;
            }
        } else {
            if (currentTermValue) {
                currentTermValue.textContent = '시작 준비';
            }
            if (termExplanation) {
                termExplanation.textContent = '시작 버튼을 눌러 학습을 시작하세요.';
            }
        }

        // Update button states
        const nextBtn = document.getElementById('nextTermBtn');
        const studentNextBtn = document.getElementById('studentNextBtn');

        const isComplete = this.currentStep >= this.terms.length - 1;

        if (nextBtn) {
            nextBtn.disabled = isComplete;
        }
        if (studentNextBtn) {
            studentNextBtn.disabled = isComplete;
            studentNextBtn.textContent = isComplete ? '완료!' : '다음 단계';
        }
    }

    /**
     * Render term list
     */
    renderTermList() {
        const termList = document.getElementById('termList');
        if (!termList) return;

        termList.innerHTML = '';

        if (this.terms.length === 0) {
            termList.innerHTML = '<p style="text-align: center; color: #7F8C8D;">문제 데이터를 불러오는 중...</p>';
            return;
        }

        this.terms.forEach((term, index) => {
            const termItem = document.createElement('div');
            termItem.className = 'term-item';

            if (index === this.currentStep) {
                termItem.classList.add('active');
            } else if (index < this.currentStep) {
                termItem.classList.add('completed');
            }

            const badge = document.createElement('div');
            badge.className = 'term-badge';
            if (index === this.currentStep) {
                badge.classList.add('active');
            }
            badge.textContent = `항 ${index + 1}`;

            const content = document.createElement('div');
            content.className = 'term-content';

            const expression = document.createElement('div');
            expression.className = 'term-expression';
            expression.textContent = term.expression;

            const description = document.createElement('div');
            description.className = 'term-description';
            description.textContent = term.description;

            content.appendChild(expression);
            content.appendChild(description);

            termItem.appendChild(badge);
            termItem.appendChild(content);

            termList.appendChild(termItem);
        });
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const currentStepDisplay = document.getElementById('currentStep');
        const totalSteps = document.getElementById('totalSteps');

        const total = this.terms.length;
        const current = Math.max(0, this.currentStep + 1);
        const percentage = total > 0 ? (current / total) * 100 : 0;

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (currentStepDisplay) {
            currentStepDisplay.textContent = current;
        }

        if (totalSteps) {
            totalSteps.textContent = total;
        }
    }

    /**
     * Handle completion
     */
    complete() {
        this.stopAutoPlay();

        // Show completion message
        const termExplanation = document.getElementById('termExplanation');
        if (termExplanation) {
            termExplanation.innerHTML = '<strong style="color: #27AE60;">🎉 완료! 모든 항을 추가했습니다!</strong>';
        }

        // Send completion to Moodle
        this.sendCompletionToMoodle();
    }

    /**
     * Send progress to Moodle
     */
    sendProgressToMoodle() {
        if (window.moodleIntegration) {
            const progressData = {
                problemId: this.problemData?.id || 'unknown',
                currentStep: this.currentStep + 1,
                totalSteps: this.terms.length,
                percentage: ((this.currentStep + 1) / this.terms.length) * 100,
                timestamp: new Date().toISOString()
            };

            window.moodleIntegration.sendProgress(progressData);
        }
    }

    /**
     * Send completion to Moodle
     */
    sendCompletionToMoodle() {
        if (window.moodleIntegration) {
            const completionData = {
                problemId: this.problemData?.id || 'unknown',
                completed: true,
                score: 100,
                timestamp: new Date().toISOString()
            };

            window.moodleIntegration.sendCompletion(completionData);
        }
    }
}

// Initialize Term Growth when DOM is ready
let termGrowth;

document.addEventListener('DOMContentLoaded', () => {
    termGrowth = new TermGrowth();
});
