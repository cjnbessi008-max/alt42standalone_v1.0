/**
 * Main Application Controller
 * Integrates Smartphone Display, Cross Wave, and Moodle API
 */

class QuizApp {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || './backend/api',
            quizId: config.quizId || 1,
            userId: config.userId || 1,
            ...config
        };

        this.smartphone = null;
        this.crossWave = null;
        this.currentSession = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.startTime = null;
        this.score = {
            correct: 0,
            total: 0
        };

        this.init();
    }

    async init() {
        console.log('Initializing Quiz App...');

        // Initialize smartphone display
        this.smartphone = new SmartphoneDisplay('quiz-smartphone');

        // Initialize Cross Wave effect
        this.crossWave = new CrossWave({
            color: '#4CAF50',
            duration: 2000,
            maxRadius: 500,
            intensity: 100
        });

        // Load quiz
        await this.loadQuiz();
    }

    /**
     * Load quiz questions from API
     */
    async loadQuiz() {
        this.smartphone.showLoading('문제를 불러오는 중...');

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/get_questions.php?quiz_id=${this.config.quizId}&user_id=${this.config.userId}`
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load quiz');
            }

            this.questions = data.questions;
            this.currentSession = {
                sessionId: data.session_id,
                quizId: data.quiz_id,
                total: data.total
            };

            console.log(`Loaded ${this.questions.length} questions`, data);

            // Start quiz
            this.startQuiz();

        } catch (error) {
            console.error('Failed to load quiz:', error);
            this.showError('퀴즈를 불러오는데 실패했습니다: ' + error.message);
        }
    }

    /**
     * Start the quiz
     */
    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: this.questions.length };
        this.showQuestion(this.currentQuestionIndex);
    }

    /**
     * Display current question
     */
    showQuestion(index) {
        if (index >= this.questions.length) {
            this.showResults();
            return;
        }

        const question = this.questions[index];
        this.startTime = Date.now();

        const optionsHtml = this.renderOptions(question);

        const html = `
            <div class="quiz-app">
                <div class="quiz-header">
                    <div class="quiz-title">Moodle 퀴즈</div>
                    <div class="quiz-progress">문제 ${index + 1} / ${this.questions.length}</div>
                </div>

                <div class="question-card">
                    <div class="question-difficulty difficulty-${question.difficulty || 'medium'}">
                        ${this.getDifficultyLabel(question.difficulty)}
                    </div>
                    <div class="question-text">${question.question_text}</div>
                    <div class="answer-options" id="answer-options">
                        ${optionsHtml}
                    </div>
                </div>

                <button class="submit-button" id="submit-answer" disabled>
                    답안 제출
                </button>
            </div>
        `;

        this.smartphone.setContent(html);
        this.attachEventListeners(question);
    }

    /**
     * Render answer options
     */
    renderOptions(question) {
        const options = question.options || [];

        if (options.length === 0) {
            // Text input for non-multiple choice
            return `
                <input type="text"
                       class="text-answer-input"
                       id="text-answer"
                       placeholder="답을 입력하세요"
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
            `;
        }

        // Multiple choice options
        return options.map((option, idx) => `
            <div class="answer-option" data-answer="${option}" data-index="${idx}">
                ${option}
            </div>
        `).join('');
    }

    /**
     * Get difficulty label
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            easy: '쉬움',
            medium: '보통',
            hard: '어려움'
        };
        return labels[difficulty] || labels.medium;
    }

    /**
     * Attach event listeners to current question
     */
    attachEventListeners(question) {
        const submitButton = document.getElementById('submit-answer');
        const optionsContainer = document.getElementById('answer-options');
        let selectedAnswer = null;

        // Handle option selection
        if (optionsContainer) {
            const options = optionsContainer.querySelectorAll('.answer-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    options.forEach(opt => opt.classList.remove('selected'));

                    // Select this option
                    option.classList.add('selected');
                    selectedAnswer = option.dataset.answer;

                    // Enable submit button
                    submitButton.disabled = false;
                });
            });
        }

        // Handle text input
        const textInput = document.getElementById('text-answer');
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                selectedAnswer = e.target.value.trim();
                submitButton.disabled = selectedAnswer === '';
            });

            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && selectedAnswer) {
                    this.submitAnswer(question, selectedAnswer);
                }
            });
        }

        // Handle submit button
        submitButton.addEventListener('click', () => {
            if (selectedAnswer) {
                this.submitAnswer(question, selectedAnswer);
            }
        });
    }

    /**
     * Submit answer to backend
     */
    async submitAnswer(question, userAnswer) {
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Get smartphone position for wave effect
        const phonePos = this.smartphone.getPosition();

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/submit_answer.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.currentSession.sessionId,
                    moodle_question_id: question.moodle_question_id,
                    question_text: question.question_text,
                    user_answer: userAnswer,
                    correct_answer: question.correct_answer,
                    time_spent: timeSpent,
                    position: {
                        x: phonePos.x,
                        y: phonePos.y
                    }
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit answer');
            }

            this.handleAnswerResult(result, userAnswer);

        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.showError('답안 제출에 실패했습니다: ' + error.message);
        }
    }

    /**
     * Handle answer submission result
     */
    handleAnswerResult(result, userAnswer) {
        const submitButton = document.getElementById('submit-answer');
        submitButton.disabled = true;

        if (result.is_correct) {
            // Correct answer!
            this.score.correct++;

            // Visual feedback
            this.smartphone.flashSuccess();
            this.highlightCorrectAnswer(userAnswer);

            // Trigger Cross Wave effect
            if (result.wave_effect && result.wave_config) {
                setTimeout(() => {
                    this.crossWave.trigger(
                        result.wave_config.position.x,
                        result.wave_config.position.y,
                        {
                            color: result.wave_config.color,
                            maxRadius: result.wave_config.max_radius,
                            duration: result.wave_config.duration,
                            message: '정답입니다! 🎉'
                        }
                    );
                }, 300);
            }

            // Move to next question after delay
            setTimeout(() => {
                this.currentQuestionIndex++;
                this.showQuestion(this.currentQuestionIndex);
            }, 2500);

        } else {
            // Incorrect answer
            this.smartphone.shake();
            this.highlightIncorrectAnswer(userAnswer);
            this.showFeedback(result.feedback);

            // Allow retry after a moment
            setTimeout(() => {
                submitButton.disabled = false;
                this.clearHighlights();
            }, 2000);
        }
    }

    /**
     * Highlight correct answer
     */
    highlightCorrectAnswer(answer) {
        const options = document.querySelectorAll('.answer-option');
        options.forEach(option => {
            if (option.dataset.answer === answer) {
                option.classList.add('correct');
            }
        });
    }

    /**
     * Highlight incorrect answer
     */
    highlightIncorrectAnswer(answer) {
        const options = document.querySelectorAll('.answer-option');
        options.forEach(option => {
            if (option.dataset.answer === answer) {
                option.classList.add('incorrect');
            }
        });
    }

    /**
     * Clear answer highlights
     */
    clearHighlights() {
        const options = document.querySelectorAll('.answer-option');
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'selected');
        });
    }

    /**
     * Show feedback message
     */
    showFeedback(feedback) {
        if (!feedback) return;

        const feedbackDiv = document.createElement('div');
        feedbackDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${feedback.color || '#f44336'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        feedbackDiv.textContent = feedback.message || '다시 시도해보세요!';
        document.body.appendChild(feedbackDiv);

        setTimeout(() => {
            feedbackDiv.remove();
        }, 2000);
    }

    /**
     * Show quiz results
     */
    showResults() {
        const percentage = Math.round((this.score.correct / this.score.total) * 100);
        let message = '';
        let preset = 'success';

        if (percentage === 100) {
            message = '완벽합니다!';
            preset = 'excellent';
        } else if (percentage >= 80) {
            message = '훌륭합니다!';
            preset = 'achievement';
        } else if (percentage >= 60) {
            message = '잘했습니다!';
            preset = 'correct';
        } else {
            message = '다시 도전해보세요!';
        }

        const html = `
            <div class="quiz-app">
                <div class="results-screen">
                    <div class="quiz-header">
                        <div class="quiz-title">퀴즈 완료!</div>
                    </div>
                    <div class="results-score">${percentage}%</div>
                    <div class="results-message">
                        ${this.score.correct} / ${this.score.total} 정답<br>
                        ${message}
                    </div>
                    <button class="submit-button" id="restart-quiz">
                        다시 시작
                    </button>
                </div>
            </div>
        `;

        this.smartphone.setContent(html);

        // Trigger celebration wave
        const phonePos = this.smartphone.getPosition();
        this.crossWave.triggerPreset(phonePos.x, phonePos.y, preset);

        // Restart button
        document.getElementById('restart-quiz').addEventListener('click', () => {
            this.loadQuiz();
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const html = `
            <div class="quiz-app">
                <div class="loading">
                    <div style="color: #f44336; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <div style="color: #f44336; font-weight: 600;">${message}</div>
                    <button class="submit-button" id="retry-button" style="margin-top: 20px;">
                        다시 시도
                    </button>
                </div>
            </div>
        `;

        this.smartphone.setContent(html);

        document.getElementById('retry-button').addEventListener('click', () => {
            this.loadQuiz();
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Quiz App...');

    // Get configuration from URL parameters or use defaults
    const urlParams = new URLSearchParams(window.location.search);
    const config = {
        apiBaseUrl: urlParams.get('api') || './backend/api',
        quizId: parseInt(urlParams.get('quiz_id')) || 1,
        userId: parseInt(urlParams.get('user_id')) || 1
    };

    // Create global app instance
    window.quizApp = new QuizApp(config);
});
