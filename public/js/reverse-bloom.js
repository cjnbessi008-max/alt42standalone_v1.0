/**
 * Reverse Bloom JavaScript Client
 * Handles UI interactions and API communication
 */

class ReverseBloomApp {
    constructor() {
        this.apiUrl = 'api.php';
        this.currentQuestion = null;
        this.currentLevel = 6;
        this.bloomSteps = {};
        this.isMinimized = false;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.bindEvents();
        await this.loadRandomQuestion();
    }

    /**
     * Bind UI event listeners
     */
    bindEvents() {
        // Navigation buttons
        document.getElementById('btn-down')?.addEventListener('click', () => this.moveDown());
        document.getElementById('btn-up')?.addEventListener('click', () => this.moveUp());
        document.getElementById('btn-next')?.addEventListener('click', () => this.loadRandomQuestion());

        // Toggle minimize/maximize
        document.getElementById('toggle-btn')?.addEventListener('click', () => this.toggleMinimize());
    }

    /**
     * Load random question from Moodle
     */
    async loadRandomQuestion() {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}?action=random`);
            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.question;
                this.bloomSteps = data.bloom.allSteps;
                this.currentLevel = data.bloom.currentLevel;
                this.renderQuestion();
            } else {
                this.showError(data.error || '문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading question:', error);
            this.showError('서버와의 연결에 실패했습니다.');
        }
    }

    /**
     * Move to lower Bloom level (simpler)
     */
    moveDown() {
        if (this.currentLevel > 1) {
            this.currentLevel--;
            this.renderQuestion();
        }
    }

    /**
     * Move to higher Bloom level (more complex)
     */
    moveUp() {
        if (this.currentLevel < 6) {
            this.currentLevel++;
            this.renderQuestion();
        }
    }

    /**
     * Render current question and Bloom level
     */
    renderQuestion() {
        const currentStep = this.bloomSteps[this.currentLevel];
        if (!currentStep) return;

        // Update level indicator
        document.getElementById('bloom-level-text').textContent = currentStep.label;
        document.getElementById('bloom-description').textContent = currentStep.description;

        // Update progress bar
        const progress = ((6 - this.currentLevel + 1) / 6) * 100;
        document.getElementById('bloom-progress-bar').style.width = `${progress}%`;
        document.getElementById('bloom-progress-bar').style.backgroundColor = currentStep.color;

        // Update question content
        document.getElementById('question-type').textContent = this.currentQuestion.qtype || 'Question';
        document.getElementById('question-text').innerHTML = currentStep.question;
        document.getElementById('question-hint').textContent = currentStep.hint;

        // Render answers if available
        this.renderAnswers();

        // Update button states
        document.getElementById('btn-down').disabled = (this.currentLevel === 1);
        document.getElementById('btn-up').disabled = (this.currentLevel === 6);
    }

    /**
     * Render answer options
     */
    renderAnswers() {
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';

        if (this.currentQuestion.answers && this.currentQuestion.answers.length > 0) {
            this.currentQuestion.answers.forEach((answer, index) => {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'answer-option';
                answerDiv.innerHTML = this.stripHtml(answer.answer);
                answerDiv.dataset.index = index;
                answerDiv.dataset.fraction = answer.fraction;

                answerDiv.addEventListener('click', (e) => this.selectAnswer(e.target));

                answersContainer.appendChild(answerDiv);
            });
        }
    }

    /**
     * Handle answer selection
     */
    selectAnswer(element) {
        // Remove previous selections
        document.querySelectorAll('.answer-option').forEach(el => {
            el.classList.remove('selected', 'correct', 'incorrect');
        });

        // Mark selected
        element.classList.add('selected');

        // Check if correct (fraction = 1.0)
        const isCorrect = parseFloat(element.dataset.fraction) === 1.0;

        setTimeout(() => {
            if (isCorrect) {
                element.classList.remove('selected');
                element.classList.add('correct');
                this.showFeedback('정답입니다! 🎉', 'success');

                // Move to next level after 1.5 seconds
                setTimeout(() => {
                    if (this.currentLevel < 6) {
                        this.moveUp();
                    } else {
                        this.loadRandomQuestion();
                    }
                }, 1500);
            } else {
                element.classList.remove('selected');
                element.classList.add('incorrect');
                this.showFeedback('다시 생각해보세요. 힌트를 참고하세요!', 'error');
            }
        }, 300);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const screen = document.querySelector('.phone-screen');
        screen.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>문제를 불러오는 중...</p>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        const screen = document.querySelector('.phone-screen');
        screen.innerHTML = `
            <div class="app-header">
                <h1>Reverse Bloom</h1>
                <div class="subtitle">부정적분 학습 시스템</div>
            </div>
            <div class="error-message">
                <strong>오류:</strong> ${message}
            </div>
            <button class="bloom-btn bloom-btn-next" onclick="location.reload()">다시 시도</button>
        `;
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        // Could implement a toast notification here
        console.log(`[${type}] ${message}`);
    }

    /**
     * Toggle minimize/maximize
     */
    toggleMinimize() {
        const container = document.querySelector('.smartphone-container');
        container.classList.toggle('minimized');
        this.isMinimized = !this.isMinimized;

        if (!this.isMinimized) {
            this.renderQuestion();
        }
    }

    /**
     * Strip HTML tags for safe display
     */
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bloomApp = new ReverseBloomApp();
});
