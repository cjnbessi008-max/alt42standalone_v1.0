/**
 * Probability Grid Main Application
 * Initializes the app, loads problem data, and handles user interactions
 */

class ProbabilityGridApp {
    constructor() {
        // Initialize API client
        this.api = new APIClient('../src/api/api.php');

        // State
        this.currentProblem = null;
        this.grid = null;
        this.smartphone = null;
        this.startTime = Date.now();
        this.sessionId = null;
        this.problemId = null;

        // Get URL parameters
        this.parseURLParams();

        // Initialize app
        this.init();
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('session');
        this.problemId = urlParams.get('problem');

        if (this.sessionId) {
            this.api.setSession(this.sessionId);
        }
    }

    async init() {
        try {
            // Show loading
            this.showLoading(true);

            // Load problem data
            await this.loadProblem();

            // Initialize smartphone display (only if not already in iframe)
            if (window.self === window.top) {
                this.initSmartphoneDisplay();
            }

            // Initialize grid
            this.initGrid();

            // Attach event listeners
            this.attachEventListeners();

            // Hide loading
            this.showLoading(false);

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('앱을 초기화하는 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    }

    async loadProblem() {
        try {
            // Determine which problem to load
            const problemIdToLoad = this.problemId || 1;

            this.currentProblem = await this.api.getProblem(
                problemIdToLoad,
                this.sessionId
            );

            // Update UI with problem data
            this.displayProblem();

        } catch (error) {
            console.error('Failed to load problem:', error);
            throw error;
        }
    }

    displayProblem() {
        const titleEl = document.getElementById('problem-title');
        const descEl = document.getElementById('problem-description');

        if (titleEl) {
            titleEl.textContent = this.currentProblem.title;
        }

        if (descEl) {
            descEl.textContent = this.currentProblem.description;
        }
    }

    initSmartphoneDisplay() {
        // Create smartphone display in bottom right
        this.smartphone = new SmartphoneDisplay({
            position: 'bottom-right',
            width: 375,
            height: 667,
            scale: 0.7,
            title: 'Probability Grid',
            showFrame: true,
            closeable: false
        });

        // Move app container into smartphone
        const appContainer = document.getElementById('app-container');
        const smartphoneContent = this.smartphone.getContentContainer();

        if (appContainer && smartphoneContent) {
            smartphoneContent.appendChild(appContainer);
            appContainer.style.display = 'block';
        }
    }

    initGrid() {
        if (!this.currentProblem) {
            console.error('No problem data available');
            return;
        }

        const gridOptions = {
            width: this.currentProblem.grid_width,
            height: this.currentProblem.grid_height,
            cellSize: 50,
            cellGap: 3,
            showProbability: true,
            interactive: true,
            colorScheme: this.currentProblem.color_scheme,
            events: this.currentProblem.probability_data?.events || [],
            onCellClick: (cellIndex, selectedCells) => {
                this.handleCellClick(cellIndex, selectedCells);
            },
            onCellHover: (cellIndex) => {
                this.handleCellHover(cellIndex);
            }
        };

        // Create grid
        this.grid = new ProbabilityGrid('probability-grid-container', gridOptions);
    }

    attachEventListeners() {
        // Submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        // Answer input - submit on Enter key
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit();
                }
            });
        }
    }

    handleCellClick(cellIndex, selectedCells) {
        console.log('Cell clicked:', cellIndex);
        console.log('Selected cells:', selectedCells);

        // Calculate probability of selected cells
        if (selectedCells.size > 0) {
            const totalCells = this.currentProblem.grid_width * this.currentProblem.grid_height;
            const probability = selectedCells.size / totalCells;

            // Auto-fill answer input
            const answerInput = document.getElementById('answer-input');
            if (answerInput) {
                answerInput.value = probability.toFixed(4);
            }
        }
    }

    handleCellHover(cellIndex) {
        // Optional: Show tooltip or additional info
        console.log('Cell hovered:', cellIndex);
    }

    async handleSubmit() {
        const answerInput = document.getElementById('answer-input');
        const answer = answerInput?.value.trim();

        if (!answer) {
            this.showFeedback('답을 입력해주세요.', 'error');
            return;
        }

        try {
            // Show loading
            this.showLoading(true);

            // Parse answer (handle both decimal and percentage)
            let parsedAnswer = parseFloat(answer.replace('%', ''));
            if (answer.includes('%')) {
                parsedAnswer = parsedAnswer / 100;
            }

            // Calculate time spent
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

            // Get interaction data
            const interactionData = {
                selected_cells: this.grid.getSelectedCells(),
                answer_submitted: answer,
                parsed_answer: parsedAnswer
            };

            // Submit answer
            const result = await this.api.submitAnswer(
                this.currentProblem.id,
                parsedAnswer.toFixed(4),
                interactionData,
                timeSpent
            );

            // Show feedback
            if (result.is_correct) {
                this.showFeedback(
                    `정답입니다! 🎉<br>시도 횟수: ${result.attempt_number}회`,
                    'success'
                );
            } else {
                this.showFeedback(
                    `틀렸습니다. 다시 시도해보세요.<br>정답: ${result.correct_answer}`,
                    'error'
                );
            }

            // Hide loading
            this.showLoading(false);

        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.showFeedback('답을 제출하는 중 오류가 발생했습니다.', 'error');
            this.showLoading(false);
        }
    }

    showFeedback(message, type = 'info') {
        const feedbackEl = document.getElementById('feedback');
        if (!feedbackEl) return;

        feedbackEl.innerHTML = message;
        feedbackEl.className = `feedback feedback-${type}`;
        feedbackEl.style.display = 'block';

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                feedbackEl.style.display = 'none';
            }, 5000);
        }
    }

    showError(message) {
        this.showFeedback(message, 'error');
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProbabilityGridApp();
});
