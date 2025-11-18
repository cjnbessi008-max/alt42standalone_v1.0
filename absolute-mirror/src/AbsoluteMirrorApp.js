/**
 * AbsoluteMirrorApp - 메인 애플리케이션
 * Main application class that orchestrates all components
 */

import { Application } from './core/Application.js';
import { APIService } from './services/APIService.js';
import { VisualizationEngine } from './services/VisualizationEngine.js';
import { EVENTS } from './core/EventBus.js';

export class AbsoluteMirrorApp extends Application {
    constructor(config) {
        super(config);

        this.currentProblem = null;
        this.startTime = null;
        this.studentId = config.studentId || null;
    }

    /**
     * Register application services
     */
    async registerServices() {
        // API Service
        this.container.registerSingleton('api', APIService, {
            dependencies: ['config', 'eventBus']
        });

        // Visualization Engine (requires canvas element, so register as factory)
        this.container.registerFactory('visualization', (config, eventBus) => {
            const canvas = document.getElementById('mirrorCanvas');
            if (!canvas) {
                throw new Error('Canvas element #mirrorCanvas not found');
            }
            return new VisualizationEngine(canvas, config, eventBus);
        }, {
            dependencies: ['config', 'eventBus'],
            singleton: true
        });

        console.log('[AbsoluteMirrorApp] Services registered');
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        await super.setupEventListeners();

        // Problem events
        this.eventBus.on(EVENTS.PROBLEM_LOADED, async ({ problem }) => {
            await this.handleProblemLoaded(problem);
        });

        this.eventBus.on(EVENTS.USER_SUBMIT, async ({ answer }) => {
            await this.handleAnswerSubmit(answer);
        });

        // UI events
        this.setupUIListeners();

        console.log('[AbsoluteMirrorApp] Event listeners setup');
    }

    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        // Load problem button
        const loadBtn = document.getElementById('loadProblem');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadRandomProblem());
        }

        // Show solution button
        const solutionBtn = document.getElementById('showSolution');
        if (solutionBtn) {
            solutionBtn.addEventListener('click', () => this.toggleSolution());
        }

        // Reset button
        const resetBtn = document.getElementById('resetView');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetVisualization());
        }

        // X value slider
        const xSlider = document.getElementById('xValue');
        if (xSlider) {
            xSlider.addEventListener('input', (e) => this.handleXValueChange(parseFloat(e.target.value)));
        }

        // Animation speed slider
        const speedSlider = document.getElementById('animationSpeed');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => this.handleSpeedChange(parseInt(e.target.value)));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch(e.key) {
                case 'n':
                case 'N':
                    this.loadRandomProblem();
                    break;
                case 's':
                case 'S':
                    this.toggleSolution();
                    break;
                case 'r':
                case 'R':
                    this.resetVisualization();
                    break;
            }
        });
    }

    /**
     * Render the application
     */
    async render() {
        console.log('[AbsoluteMirrorApp] Rendering...');

        // Start visualization engine
        const vizEngine = this.service('visualization');
        vizEngine.start();

        // Load initial problem if configured
        if (this.config.ui?.autoLoadProblem) {
            await this.loadRandomProblem();
        }

        console.log('[AbsoluteMirrorApp] Rendered');
    }

    /**
     * Load random problem
     */
    async loadRandomProblem() {
        try {
            this.showLoading(true);

            const apiService = this.service('api');
            const response = await apiService.getRandomProblem();

            if (response.success && response.data) {
                this.currentProblem = response.data;
                this.startTime = Date.now();

                await this.eventBus.emit(EVENTS.PROBLEM_LOADED, { problem: this.currentProblem });

                this.updateProblemUI();
                this.hideSolution();
            }

        } catch (error) {
            console.error('[AbsoluteMirrorApp] Failed to load problem:', error);
            this.showError('문제를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle problem loaded
     */
    async handleProblemLoaded(problem) {
        const vizEngine = this.service('visualization');
        vizEngine.setProblem(problem);

        console.log('[AbsoluteMirrorApp] Problem loaded:', problem.equation);
    }

    /**
     * Update problem UI
     */
    updateProblemUI() {
        if (!this.currentProblem) return;

        const problem = this.currentProblem;

        // Update problem info
        const titleEl = document.getElementById('problemTitle');
        if (titleEl) titleEl.textContent = problem.title;

        const descEl = document.getElementById('problemDescription');
        if (descEl) descEl.textContent = problem.description;

        const eqEl = document.getElementById('equationText');
        if (eqEl) {
            eqEl.textContent = problem.equation;
            eqEl.style.animation = 'none';
            setTimeout(() => eqEl.style.animation = 'pulse 2s ease-in-out infinite', 10);
        }

        // Update info displays
        const leftValEl = document.querySelector('#leftValue span');
        if (leftValEl) leftValEl.textContent = problem.solutions[0].toFixed(1);

        const rightValEl = document.querySelector('#rightValue span');
        if (rightValEl) rightValEl.textContent = problem.solutions[1].toFixed(1);

        const axisEl = document.querySelector('#mirrorAxis span');
        if (axisEl) axisEl.textContent = `x = ${problem.axis}`;

        // Reset x slider
        const xSlider = document.getElementById('xValue');
        if (xSlider) {
            const range = problem.getVisualizationRange();
            xSlider.min = range.min;
            xSlider.max = range.max;
            xSlider.value = 0;
        }

        const xDisplay = document.getElementById('xValueDisplay');
        if (xDisplay) xDisplay.textContent = '0';
    }

    /**
     * Handle X value change
     */
    handleXValueChange(x) {
        const xDisplay = document.getElementById('xValueDisplay');
        if (xDisplay) xDisplay.textContent = x.toFixed(1);

        const vizEngine = this.service('visualization');
        vizEngine.setCurrentX(x);

        // Highlight if near solution
        if (this.currentProblem) {
            const isNear = this.currentProblem.isNearSolution(x, 0.5);

            const leftValEl = document.querySelector('#leftValue');
            const rightValEl = document.querySelector('#rightValue');

            if (isNear) {
                const nearLeft = Math.abs(x - this.currentProblem.solutions[0]) < 0.5;
                const nearRight = Math.abs(x - this.currentProblem.solutions[1]) < 0.5;

                if (leftValEl) {
                    leftValEl.style.backgroundColor = nearLeft ? 'rgba(76, 175, 80, 0.3)' : '';
                }
                if (rightValEl) {
                    rightValEl.style.backgroundColor = nearRight ? 'rgba(76, 175, 80, 0.3)' : '';
                }
            } else {
                if (leftValEl) leftValEl.style.backgroundColor = '';
                if (rightValEl) rightValEl.style.backgroundColor = '';
            }
        }
    }

    /**
     * Handle speed change
     */
    handleSpeedChange(speed) {
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) speedDisplay.textContent = speed;

        const vizEngine = this.service('visualization');
        vizEngine.setAnimationSpeed(speed);
    }

    /**
     * Toggle solution display
     */
    toggleSolution() {
        const solutionPanel = document.getElementById('solutionPanel');
        const solutionBtn = document.getElementById('showSolution');

        if (!solutionPanel) return;

        const isVisible = solutionPanel.style.display !== 'none';

        if (isVisible) {
            this.hideSolution();
        } else {
            this.showSolution();
        }
    }

    /**
     * Show solution
     */
    showSolution() {
        if (!this.currentProblem) {
            this.showError('먼저 문제를 불러와주세요.');
            return;
        }

        const solutionPanel = document.getElementById('solutionPanel');
        const solutionContent = document.getElementById('solutionContent');
        const solutionBtn = document.getElementById('showSolution');

        if (solutionContent) {
            solutionContent.innerHTML = this.currentProblem.explanation.replace(/\n/g, '<br>');
        }

        if (solutionPanel) {
            solutionPanel.style.display = 'block';
            solutionPanel.style.animation = 'slideIn 0.3s ease-out';
        }

        if (solutionBtn) {
            solutionBtn.textContent = '해설 숨기기';
        }

        this.eventBus.emit(EVENTS.UI_SHOW_SOLUTION);
    }

    /**
     * Hide solution
     */
    hideSolution() {
        const solutionPanel = document.getElementById('solutionPanel');
        const solutionBtn = document.getElementById('showSolution');

        if (solutionPanel) {
            solutionPanel.style.display = 'none';
        }

        if (solutionBtn) {
            solutionBtn.textContent = '해설 보기';
        }

        this.eventBus.emit(EVENTS.UI_HIDE_SOLUTION);
    }

    /**
     * Reset visualization
     */
    resetVisualization() {
        const vizEngine = this.service('visualization');
        vizEngine.reset();

        // Reset sliders
        const xSlider = document.getElementById('xValue');
        if (xSlider) xSlider.value = 0;

        const xDisplay = document.getElementById('xValueDisplay');
        if (xDisplay) xDisplay.textContent = '0';

        const speedSlider = document.getElementById('animationSpeed');
        if (speedSlider) speedSlider.value = 5;

        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) speedDisplay.textContent = '5';

        // Clear highlights
        document.querySelectorAll('.value-display').forEach(el => {
            el.style.backgroundColor = '';
        });

        console.log('[AbsoluteMirrorApp] Visualization reset');
    }

    /**
     * Handle answer submit
     */
    async handleAnswerSubmit(answer) {
        if (!this.currentProblem) return;

        try {
            const timeSpent = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

            const apiService = this.service('api');
            const response = await apiService.submitAnswer(
                this.currentProblem.id,
                answer,
                this.studentId,
                timeSpent
            );

            if (response.success) {
                this.showMessage(response.message, response.is_correct ? 'success' : 'info');

                if (response.is_complete_correct) {
                    await this.eventBus.emit(EVENTS.PROBLEM_SOLVED, {
                        problem: this.currentProblem,
                        timeSpent
                    });
                }
            }

        } catch (error) {
            console.error('[AbsoluteMirrorApp] Failed to submit answer:', error);
            this.showError('답안 제출에 실패했습니다.');
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        // Simple alert for now - can be enhanced with custom toast
        alert(message);

        this.eventBus.emit(EVENTS.UI_TOAST, { message, type });
    }

    /**
     * Stop the application
     */
    async stop() {
        const vizEngine = this.service('visualization');
        vizEngine.stop();

        await super.stop();
    }
}
