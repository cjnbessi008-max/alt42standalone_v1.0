/**
 * Main Application Logic
 * Coordinates visualization, API calls, and user interactions
 */

class InverseReflectionApp {
    constructor() {
        this.visualizer = null;
        this.currentProblem = null;
        this.startTime = null;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        // Initialize visualizer
        this.visualizer = new InverseReflectionVisualizer(
            'reflectionCanvas',
            'reflectionOverlay'
        );

        // Bind UI events
        this.bindUIEvents();

        // Load problem
        await this.loadProblem();

        // Update connection status
        this.updateConnectionStatus(true);

        console.log('Inverse Reflection App initialized');
    }

    /**
     * Bind UI event handlers
     */
    bindUIEvents() {
        // Grid toggle
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.visualizer.showGrid = e.target.checked;
            this.visualizer.draw();
            apiClient.logInteraction('toggle_grid', { enabled: e.target.checked });
        });

        // Reflection line toggle
        document.getElementById('showReflectionLine').addEventListener('change', (e) => {
            this.visualizer.showReflectionLine = e.target.checked;
            this.visualizer.draw();
            apiClient.logInteraction('toggle_reflection_line', { enabled: e.target.checked });
        });

        // Animation toggle
        document.getElementById('enableAnimation').addEventListener('change', (e) => {
            this.visualizer.animationEnabled = e.target.checked;
            apiClient.logInteraction('toggle_animation', { enabled: e.target.checked });
        });

        // Show reflection demo button
        document.getElementById('showReflectionBtn').addEventListener('click', () => {
            this.showReflectionDemo();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearVisualization();
        });
    }

    /**
     * Load problem from Moodle
     */
    async loadProblem() {
        try {
            // Get problem ID from URL or use default
            const params = new URLSearchParams(window.location.search);
            const moodleQuestionId = params.get('question_id') || 1;

            // Fetch problem data
            this.currentProblem = await apiClient.getProblem(moodleQuestionId);

            if (this.currentProblem) {
                this.displayProblem();
                this.startTime = Date.now();
            } else {
                // Load default problem for testing
                this.loadDefaultProblem();
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.loadDefaultProblem();
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Load default problem for testing/demo
     */
    loadDefaultProblem() {
        this.currentProblem = {
            id: 0,
            moodle_question_id: 0,
            function_type: 'linear',
            original_function: '2*x + 3',
            inverse_function: '(x - 3) / 2',
            domain_min: -5,
            domain_max: 5,
            difficulty_level: 'easy',
            hints: [
                'Step 1: Replace f(x) with y',
                'Step 2: Swap x and y',
                'Step 3: Solve for y'
            ],
            show_grid: true,
            show_reflection_line: true,
            animation_speed: 'medium',
            color_original: '#2196F3',
            color_inverse: '#F44336',
            color_reflection_line: '#4CAF50'
        };

        this.displayProblem();
    }

    /**
     * Display problem on UI
     */
    displayProblem() {
        // Update function displays
        document.getElementById('originalFunction').textContent =
            `f(x) = ${MathUtils.formatFunctionExpression(this.currentProblem.original_function)}`;
        document.getElementById('inverseFunction').textContent =
            `f⁻¹(x) = ${MathUtils.formatFunctionExpression(this.currentProblem.inverse_function)}`;

        // Update visualizer colors if provided
        if (this.currentProblem.color_original) {
            this.visualizer.colors.original = this.currentProblem.color_original;
        }
        if (this.currentProblem.color_inverse) {
            this.visualizer.colors.inverse = this.currentProblem.color_inverse;
        }
        if (this.currentProblem.color_reflection_line) {
            this.visualizer.colors.reflectionLine = this.currentProblem.color_reflection_line;
        }

        // Set functions in visualizer
        this.visualizer.setFunctions(
            this.currentProblem.original_function,
            this.currentProblem.inverse_function,
            this.currentProblem.domain_min,
            this.currentProblem.domain_max
        );

        // Update controls
        if (this.currentProblem.show_grid !== undefined) {
            document.getElementById('showGrid').checked = this.currentProblem.show_grid;
            this.visualizer.showGrid = this.currentProblem.show_grid;
        }

        if (this.currentProblem.show_reflection_line !== undefined) {
            document.getElementById('showReflectionLine').checked = this.currentProblem.show_reflection_line;
            this.visualizer.showReflectionLine = this.currentProblem.show_reflection_line;
        }

        // Show hints if available
        if (this.currentProblem.hints && this.currentProblem.hints.length > 0) {
            this.displayHints(this.currentProblem.hints);
        }
    }

    /**
     * Display hints
     */
    displayHints(hints) {
        const hintSection = document.getElementById('hintSection');
        const hintContent = document.getElementById('hintContent');

        let hintsHTML = '<ol style="margin: 0; padding-left: 20px;">';
        hints.forEach(hint => {
            hintsHTML += `<li style="margin: 4px 0;">${hint}</li>`;
        });
        hintsHTML += '</ol>';

        hintContent.innerHTML = hintsHTML;
        hintSection.style.display = 'block';
    }

    /**
     * Show reflection demo with preset points
     */
    async showReflectionDemo() {
        apiClient.logInteraction('demo_started', {});

        // Demo points along the original function
        const demoXValues = [
            this.currentProblem.domain_min,
            (this.currentProblem.domain_min + this.currentProblem.domain_max) / 2,
            this.currentProblem.domain_max
        ];

        for (const x of demoXValues) {
            const y = MathUtils.evaluateFunction(this.currentProblem.original_function, x);

            if (y !== null && !isNaN(y)) {
                await this.visualizer.animateReflection({ x, y });
                await this.visualizer.sleep(1000); // Pause between demos
            }
        }

        // Show success message
        this.showMessage('데모 완료! 이제 직접 그래프를 클릭해보세요.', 'success');
    }

    /**
     * Clear visualization
     */
    clearVisualization() {
        this.visualizer.clear();
        apiClient.logInteraction('visualization_cleared', {});
    }

    /**
     * Submit student's answer (for future integration)
     */
    async submitAnswer(attemptedInverse) {
        if (!this.currentProblem || this.currentProblem.id === 0) {
            console.log('Demo mode - answer not submitted');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Verify answer
        const isCorrect = this.verifyAnswer(attemptedInverse);

        // Collect interaction data
        const interactionData = {
            time_spent: timeSpent,
            interactions: apiClient.getInteractionLog()
        };

        // Submit to backend
        try {
            const result = await apiClient.submitAttempt(
                this.currentProblem.id,
                attemptedInverse,
                isCorrect,
                interactionData
            );

            if (result.success) {
                this.showMessage(
                    isCorrect ? '정답입니다! 🎉' : '다시 시도해보세요.',
                    isCorrect ? 'success' : 'error'
                );
            }

            // Clear interaction log
            apiClient.clearInteractionLog();

            return result;
        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showMessage('제출 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Verify student's answer
     */
    verifyAnswer(attemptedInverse) {
        // Test multiple points
        const testPoints = 5;
        let correctCount = 0;

        for (let i = 0; i < testPoints; i++) {
            const x = this.currentProblem.domain_min +
                (this.currentProblem.domain_max - this.currentProblem.domain_min) * Math.random();

            if (MathUtils.verifyInverse(this.currentProblem.original_function, attemptedInverse, x)) {
                correctCount++;
            }
        }

        return correctCount >= testPoints * 0.8; // 80% threshold
    }

    /**
     * Show message to user
     */
    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');

        if (connected) {
            statusDot.style.background = '#4CAF50';
            statusText.textContent = 'Moodle 연결됨';
        } else {
            statusDot.style.background = '#FF9800';
            statusText.textContent = 'Demo 모드';
        }
    }

    /**
     * Get current problem data
     */
    getCurrentProblem() {
        return this.currentProblem;
    }

    /**
     * Get visualizer instance
     */
    getVisualizer() {
        return this.visualizer;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InverseReflectionApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
