/**
 * Smartphone Simulator
 * Virtual smartphone display in bottom-right corner
 */

class SmartphoneSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.screen = document.getElementById('smartphoneScreen');
        this.toggle = document.getElementById('smartphoneToggle');
        this.isMinimized = false;
        this.currentQuestion = null;

        this.init();
    }

    init() {
        // Toggle smartphone visibility
        this.toggle.addEventListener('click', () => {
            this.toggleMinimize();
        });

        // Make smartphone draggable
        this.makeDraggable();

        // Listen to show/hide checkbox
        const checkbox = document.getElementById('showSmartphone');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.container.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    }

    /**
     * Make smartphone draggable
     */
    makeDraggable() {
        const handle = this.container.querySelector('.smartphone-drag-handle');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        handle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === handle) {
                isDragging = true;
            }
        }

        const container = this.container;

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, container);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
    }

    /**
     * Toggle minimize/maximize
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('hidden', this.isMinimized);
    }

    /**
     * Display welcome message
     */
    showWelcome() {
        this.screen.innerHTML = `
            <div class="smartphone-content">
                <div class="text-center py-5">
                    <i class="fas fa-mobile-alt fa-3x text-primary mb-3"></i>
                    <h5>Deviation Breeze</h5>
                    <p class="text-muted">학습 편차 분석 시스템</p>
                    <p class="text-muted small">퀴즈를 선택하면 문제가 표시됩니다</p>
                </div>
            </div>
        `;
    }

    /**
     * Display a quiz question
     */
    showQuestion(question) {
        this.currentQuestion = question;

        const optionsHtml = question.options.map((option, index) => `
            <li data-index="${index}">${option}</li>
        `).join('');

        this.screen.innerHTML = `
            <div class="smartphone-content">
                <div class="quiz-question">
                    <h6>문제 ${question.number}</h6>
                    <p>${question.text}</p>
                </div>

                <div class="quiz-options-container">
                    <ul class="quiz-options" id="quizOptions">
                        ${optionsHtml}
                    </ul>
                </div>

                <button class="quiz-submit-btn" id="submitAnswer" disabled>
                    <i class="fas fa-check"></i> 답안 제출
                </button>

                <div id="feedbackArea"></div>
            </div>
        `;

        this.attachOptionListeners();
    }

    /**
     * Attach click listeners to options
     */
    attachOptionListeners() {
        const options = this.screen.querySelectorAll('.quiz-options li');
        const submitBtn = this.screen.querySelector('#submitAnswer');
        let selectedIndex = null;

        options.forEach((option, index) => {
            option.addEventListener('click', () => {
                // Remove previous selection
                options.forEach(opt => opt.classList.remove('selected'));

                // Select current option
                option.classList.add('selected');
                selectedIndex = index;

                // Enable submit button
                submitBtn.disabled = false;
            });
        });

        submitBtn.addEventListener('click', () => {
            if (selectedIndex !== null) {
                this.submitAnswer(selectedIndex);
            }
        });
    }

    /**
     * Submit answer
     */
    submitAnswer(selectedIndex) {
        const isCorrect = selectedIndex === this.currentQuestion.correctIndex;
        const feedbackArea = this.screen.querySelector('#feedbackArea');
        const submitBtn = this.screen.querySelector('#submitAnswer');
        const options = this.screen.querySelectorAll('.quiz-options li');

        // Disable submit button
        submitBtn.disabled = true;

        // Highlight correct/incorrect
        options.forEach((option, index) => {
            if (index === selectedIndex) {
                option.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
            if (index === this.currentQuestion.correctIndex) {
                option.classList.add('correct');
            }
        });

        // Show feedback
        feedbackArea.innerHTML = `
            <div class="feedback-message ${isCorrect ? 'success' : 'error'}">
                <i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'}"></i>
                ${isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해보세요.'}
            </div>
        `;

        // Trigger callback if exists
        if (this.currentQuestion.onSubmit) {
            this.currentQuestion.onSubmit(selectedIndex, isCorrect);
        }

        // Auto advance after 2 seconds
        setTimeout(() => {
            if (isCorrect && this.currentQuestion.onNext) {
                this.currentQuestion.onNext();
            }
        }, 2000);
    }

    /**
     * Show loading state
     */
    showLoading(message = '로딩 중...') {
        this.screen.innerHTML = `
            <div class="smartphone-content">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="text-muted">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.screen.innerHTML = `
            <div class="smartphone-content">
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h6>오류 발생</h6>
                    <p class="text-muted">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show quiz summary
     */
    showSummary(results) {
        const correctCount = results.filter(r => r.isCorrect).length;
        const totalCount = results.length;
        const percentage = Math.round((correctCount / totalCount) * 100);

        this.screen.innerHTML = `
            <div class="smartphone-content">
                <div class="text-center py-4">
                    <i class="fas fa-trophy fa-3x text-warning mb-3"></i>
                    <h5>퀴즈 완료!</h5>

                    <div class="summary-stats mt-4">
                        <div class="stat-box mb-3">
                            <h2 class="text-primary">${percentage}%</h2>
                            <p class="text-muted">정답률</p>
                        </div>

                        <div class="row">
                            <div class="col-6">
                                <div class="stat-box">
                                    <h4 class="text-success">${correctCount}</h4>
                                    <p class="text-muted small">정답</p>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-box">
                                    <h4 class="text-danger">${totalCount - correctCount}</h4>
                                    <p class="text-muted small">오답</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="quiz-submit-btn mt-3" onclick="smartphone.showWelcome()">
                        <i class="fas fa-home"></i> 처음으로
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize smartphone simulator
let smartphone;
document.addEventListener('DOMContentLoaded', () => {
    smartphone = new SmartphoneSimulator('smartphoneContainer');
    smartphone.showWelcome();
});

// Export for use in other scripts
window.SmartphoneSimulator = SmartphoneSimulator;
