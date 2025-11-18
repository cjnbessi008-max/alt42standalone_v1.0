/**
 * Main Application Logic
 * Handles UI interactions and Moodle API integration
 */

class GraphApp {
    constructor() {
        this.calculator = new GraphCalculator('plotlyGraph');
        this.currentProblem = null;

        this.initializeElements();
        this.attachEventListeners();
        this.loadProblemFromMoodle();
    }

    initializeElements() {
        this.functionInput = document.getElementById('functionInput');
        this.plotBtn = document.getElementById('plotBtn');
        this.derivativeBtn = document.getElementById('derivativeBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.problemInfo = document.getElementById('problemInfo');
        this.currentFunctionDisplay = document.getElementById('currentFunction');
        this.derivativeDisplay = document.getElementById('derivativeDisplay');
        this.derivativeFunctionText = document.getElementById('derivativeFunctionText');
    }

    attachEventListeners() {
        this.plotBtn.addEventListener('click', () => this.handlePlot());
        this.derivativeBtn.addEventListener('click', () => this.handleDerivative());
        this.resetBtn.addEventListener('click', () => this.handleReset());

        // Allow Enter key to plot
        this.functionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handlePlot();
            }
        });
    }

    /**
     * Load problem data from Moodle LMS
     */
    async loadProblemFromMoodle() {
        try {
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('problemid') || '1';
            const userId = urlParams.get('userid') || 'demo';

            this.problemInfo.innerHTML = '<span class="loading"></span> Loading...';

            // Call Moodle API
            const response = await fetch(`api/problem_api.php?problemid=${problemId}&userid=${userId}`);

            if (!response.ok) {
                throw new Error('Failed to load problem');
            }

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.displayProblemInfo(data.problem);

                // Set initial function if provided
                if (data.problem.function) {
                    this.functionInput.value = data.problem.function;
                    this.handlePlot();
                }
            } else {
                throw new Error(data.message || 'Unknown error');
            }

        } catch (error) {
            console.error('Error loading problem:', error);
            this.problemInfo.innerHTML = `
                <strong>Demo Mode</strong><br>
                Problem: Graph f(x) = x² and its derivative
            `;

            // Demo mode: plot default function
            this.handlePlot();
        }
    }

    /**
     * Display problem information from Moodle
     */
    displayProblemInfo(problem) {
        this.problemInfo.innerHTML = `
            <strong>${problem.title || 'Math Problem'}</strong><br>
            ${problem.description || 'Plot the function and explore its derivative'}
        `;
    }

    /**
     * Handle plot button click
     */
    handlePlot() {
        const expr = this.functionInput.value.trim();

        if (!expr) {
            alert('Please enter a function');
            return;
        }

        try {
            // Test if function is valid
            const testValue = this.calculator.evaluate(expr, 1);

            if (isNaN(testValue) || !isFinite(testValue)) {
                throw new Error('Invalid function');
            }

            // Plot the function
            this.calculator.plotFunction(expr);

            // Update display
            this.currentFunctionDisplay.textContent = expr;
            this.derivativeDisplay.style.display = 'none';

            // Enable derivative button
            this.derivativeBtn.disabled = false;
            this.derivativeBtn.textContent = 'Show Derivative';

            // Log activity to Moodle (if available)
            this.logActivity('plot', expr);

        } catch (error) {
            alert('Invalid function. Please check your syntax.\n\nExamples:\n- x^2\n- sin(x)\n- 2*x + 3');
            console.error('Plot error:', error);
        }
    }

    /**
     * Handle derivative button click
     * Toggle between showing and hiding derivative
     */
    handleDerivative() {
        if (this.calculator.derivativeVisible) {
            // Hide derivative
            this.calculator.hideDerivative();
            this.derivativeBtn.textContent = 'Show Derivative';
            this.derivativeDisplay.style.display = 'none';

            this.logActivity('hide_derivative', this.functionInput.value);
        } else {
            // Show derivative
            this.calculator.showDerivative();
            this.derivativeBtn.textContent = 'Hide Derivative';

            // Update derivative display
            const symbolicDerivative = this.calculator.getSymbolicDerivative(this.functionInput.value);
            this.derivativeFunctionText.textContent = symbolicDerivative;
            this.derivativeDisplay.style.display = 'block';

            this.logActivity('show_derivative', this.functionInput.value);
        }
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        this.calculator.clear();
        this.functionInput.value = 'x^2';
        this.currentFunctionDisplay.textContent = 'x²';
        this.derivativeDisplay.style.display = 'none';
        this.derivativeBtn.disabled = true;
        this.derivativeBtn.textContent = 'Show Derivative';

        this.logActivity('reset', '');
    }

    /**
     * Log student activity to Moodle
     */
    async logActivity(action, details) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('problemid') || '1';
            const userId = urlParams.get('userid') || 'demo';

            const data = {
                userid: userId,
                problemid: problemId,
                action: action,
                details: details,
                timestamp: new Date().toISOString()
            };

            await fetch('api/moodle_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

        } catch (error) {
            console.error('Failed to log activity:', error);
            // Non-critical error, continue
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GraphApp();
});
