// Absolute Mirror - Main Application

class AbsoluteMirrorApp {
    constructor() {
        this.config = CONFIG;
        this.moodleAPI = new MoodleAPI(this.config);
        this.mirrorTunnel = null;
        this.currentProblem = null;
        this.solutionVisible = false;

        this.init();
    }

    async init() {
        console.log('Initializing Absolute Mirror App...');

        // Initialize UI elements
        this.initializeUI();

        // Initialize mirror tunnel visualization
        this.initializeMirrorTunnel();

        // Load initial problem if auto-load is enabled
        if (this.config.ui.autoLoadProblem) {
            await this.loadRandomProblem();
        }

        console.log('Absolute Mirror App initialized successfully');
    }

    initializeUI() {
        // Get UI elements
        this.elements = {
            problemTitle: document.getElementById('problemTitle'),
            problemDescription: document.getElementById('problemDescription'),
            equationText: document.getElementById('equationText'),
            loadProblemBtn: document.getElementById('loadProblem'),
            showSolutionBtn: document.getElementById('showSolution'),
            resetViewBtn: document.getElementById('resetView'),
            xValueSlider: document.getElementById('xValue'),
            xValueDisplay: document.getElementById('xValueDisplay'),
            animationSpeedSlider: document.getElementById('animationSpeed'),
            speedDisplay: document.getElementById('speedDisplay'),
            solutionPanel: document.getElementById('solutionPanel'),
            solutionContent: document.getElementById('solutionContent'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            leftValueDisplay: document.querySelector('#leftValue span'),
            rightValueDisplay: document.querySelector('#rightValue span'),
            mirrorAxisDisplay: document.querySelector('#mirrorAxis span')
        };

        // Attach event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Button click handlers
        this.elements.loadProblemBtn.addEventListener('click', () => {
            this.loadRandomProblem();
        });

        this.elements.showSolutionBtn.addEventListener('click', () => {
            this.toggleSolution();
        });

        this.elements.resetViewBtn.addEventListener('click', () => {
            this.resetVisualization();
        });

        // Slider handlers
        this.elements.xValueSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.xValueDisplay.textContent = value.toFixed(1);
            this.updateCurrentX(value);
        });

        this.elements.animationSpeedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.elements.speedDisplay.textContent = speed;
            this.updateAnimationSpeed(speed);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
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

    initializeMirrorTunnel() {
        try {
            this.mirrorTunnel = new MirrorTunnel('mirrorCanvas', this.config.visualization);
            console.log('Mirror tunnel visualization initialized');
        } catch (error) {
            console.error('Failed to initialize mirror tunnel:', error);
            this.showError('시각화를 초기화하는 중 오류가 발생했습니다.');
        }
    }

    async loadRandomProblem() {
        this.showLoading(true);

        try {
            const response = await this.moodleAPI.getRandomProblem();

            if (response.success && response.data) {
                this.currentProblem = response.data;
                this.displayProblem(this.currentProblem);

                // Hide solution when loading new problem
                this.solutionVisible = false;
                this.elements.solutionPanel.style.display = 'none';
                this.elements.showSolutionBtn.textContent = '해설 보기';
            } else {
                throw new Error('Failed to load problem');
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    displayProblem(problem) {
        // Update UI with problem data
        this.elements.problemTitle.textContent = problem.title || '절댓값 방정식 문제';
        this.elements.problemDescription.textContent = problem.description || '';
        this.elements.equationText.textContent = problem.equation || '';

        // Parse equation and update visualization
        const params = this.moodleAPI.parseEquation(problem.equation);

        if (params.valid) {
            this.updateVisualization(params.axis, params.target);
            this.updateInfoDisplay(params.axis, params.target);
        } else {
            console.error('Invalid equation:', problem.equation);
            this.showError('방정식 형식이 올바르지 않습니다.');
        }

        // Reset x value slider
        this.elements.xValueSlider.value = 0;
        this.elements.xValueDisplay.textContent = '0';

        // Add subtle animation to equation display
        this.elements.equationText.style.animation = 'none';
        setTimeout(() => {
            this.elements.equationText.style.animation = 'pulse 2s ease-in-out infinite';
        }, 10);
    }

    updateVisualization(axis, target) {
        if (this.mirrorTunnel) {
            this.mirrorTunnel.setEquation(axis, target);
        }
    }

    updateInfoDisplay(axis, target) {
        const leftSolution = axis - target;
        const rightSolution = axis + target;

        this.elements.leftValueDisplay.textContent = leftSolution.toFixed(1);
        this.elements.rightValueDisplay.textContent = rightSolution.toFixed(1);
        this.elements.mirrorAxisDisplay.textContent = `x = ${axis}`;
    }

    updateCurrentX(x) {
        if (this.mirrorTunnel) {
            this.mirrorTunnel.setCurrentX(x);
            this.mirrorTunnel.isInteracting = true;

            // Calculate and display current absolute value
            if (this.currentProblem) {
                const params = this.moodleAPI.parseEquation(this.currentProblem.equation);
                if (params.valid) {
                    const absValue = Math.abs(x - params.axis);

                    // Update value displays with current calculation
                    this.updateValueHighlight(x, params.axis, absValue, params.target);
                }
            }
        }
    }

    updateValueHighlight(x, axis, absValue, target) {
        // Highlight if close to solution
        const tolerance = 0.5;
        const isCloseTo Solution = Math.abs(absValue - target) < tolerance;

        const leftSolution = axis - target;
        const rightSolution = axis + target;

        // Highlight appropriate value display
        if (Math.abs(x - leftSolution) < tolerance) {
            this.elements.leftValueDisplay.parentElement.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            this.elements.rightValueDisplay.parentElement.style.backgroundColor = '';
        } else if (Math.abs(x - rightSolution) < tolerance) {
            this.elements.rightValueDisplay.parentElement.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            this.elements.leftValueDisplay.parentElement.style.backgroundColor = '';
        } else {
            this.elements.leftValueDisplay.parentElement.style.backgroundColor = '';
            this.elements.rightValueDisplay.parentElement.style.backgroundColor = '';
        }
    }

    updateAnimationSpeed(speed) {
        if (this.mirrorTunnel) {
            this.mirrorTunnel.setAnimationSpeed(speed);
        }
    }

    toggleSolution() {
        this.solutionVisible = !this.solutionVisible;

        if (this.solutionVisible) {
            this.showSolution();
            this.elements.showSolutionBtn.textContent = '해설 숨기기';
        } else {
            this.elements.solutionPanel.style.display = 'none';
            this.elements.showSolutionBtn.textContent = '해설 보기';
        }
    }

    showSolution() {
        if (!this.currentProblem) {
            this.showError('문제를 먼저 불러와주세요.');
            return;
        }

        // Display solution explanation
        const explanation = this.currentProblem.explanation || '해설이 제공되지 않았습니다.';
        this.elements.solutionContent.innerHTML = explanation.replace(/\n/g, '<br>');
        this.elements.solutionPanel.style.display = 'block';

        // Animate solution panel
        this.elements.solutionPanel.style.animation = 'slideIn 0.3s ease-out';
    }

    resetVisualization() {
        if (this.mirrorTunnel) {
            this.mirrorTunnel.reset();
        }

        // Reset sliders
        this.elements.xValueSlider.value = 0;
        this.elements.xValueDisplay.textContent = '0';
        this.elements.animationSpeedSlider.value = 5;
        this.elements.speedDisplay.textContent = '5';

        // Clear highlights
        this.elements.leftValueDisplay.parentElement.style.backgroundColor = '';
        this.elements.rightValueDisplay.parentElement.style.backgroundColor = '';

        console.log('Visualization reset');
    }

    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert(message); // Simple error display, can be enhanced with custom modal
        console.error(message);
    }
}

// Add CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AbsoluteMirrorApp();
});
