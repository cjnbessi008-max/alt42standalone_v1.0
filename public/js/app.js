/**
 * Data Shuffle Quiz System - Frontend Application
 *
 * Handles quiz loading, display, and interaction
 */

class ShuffledQuizApp {
    constructor() {
        this.apiBaseUrl = '/src/api'; // Adjust based on your server setup
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            quizIdInput: document.getElementById('quizId'),
            studentIdInput: document.getElementById('studentId'),
            loadQuizBtn: document.getElementById('loadQuizBtn'),
            resetBtn: document.getElementById('resetBtn'),
            statusMessage: document.getElementById('statusMessage'),
            mobileContent: document.getElementById('mobileContent'),
            shuffleInfo: document.getElementById('shuffleInfo'),
            shuffleDetails: document.getElementById('shuffleDetails'),
            systemStatus: document.getElementById('systemStatus'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.elements.loadQuizBtn.addEventListener('click', () => this.loadQuiz());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        // Allow Enter key to trigger quiz load
        this.elements.quizIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadQuiz();
        });
        this.elements.studentIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadQuiz();
        });
    }

    /**
     * Load shuffled quiz from API
     */
    async loadQuiz() {
        const quizId = parseInt(this.elements.quizIdInput.value);
        const studentId = parseInt(this.elements.studentIdInput.value);

        if (!quizId || !studentId) {
            this.showStatus('Please enter valid Quiz ID and Student ID', 'error');
            return;
        }

        this.showLoading(true);
        this.updateSystemStatus('Loading...');

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/shuffle.php?quiz_id=${quizId}&student_id=${studentId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentQuiz = data;
                this.currentQuestionIndex = 0;
                this.answers = {};
                this.startTime = Date.now();

                this.displayShuffleInfo(data);
                this.displayQuestion(0);

                this.showStatus(
                    `Quiz loaded successfully! ${data.total_questions} questions shuffled.`,
                    'success'
                );
                this.updateSystemStatus('Quiz Active');
            } else {
                throw new Error(data.error?.message || 'Failed to load quiz');
            }

        } catch (error) {
            console.error('Error loading quiz:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
            this.updateSystemStatus('Error');
            this.showMockQuiz(); // Show mock data for demonstration
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display shuffle information
     */
    displayShuffleInfo(data) {
        const html = `
            <div><strong>Quiz ID:</strong> ${data.quiz_id}</div>
            <div><strong>Student ID:</strong> ${data.student_id}</div>
            <div><strong>Total Questions:</strong> ${data.total_questions}</div>
            <div><strong>Shuffle Seed:</strong> <code>${data.shuffle_seed}</code></div>
            <div><strong>Expires:</strong> ${new Date(data.expires_at).toLocaleString()}</div>
            <div><strong>Execution Time:</strong> ${data.execution_time_ms}ms</div>
        `;

        this.elements.shuffleDetails.innerHTML = html;
        this.elements.shuffleInfo.style.display = 'block';
    }

    /**
     * Display question in mobile view
     */
    displayQuestion(index) {
        if (!this.currentQuiz || !this.currentQuiz.questions[index]) {
            return;
        }

        const question = this.currentQuiz.questions[index];
        const progress = ((index + 1) / this.currentQuiz.total_questions) * 100;

        const html = `
            <div class="question-card">
                <!-- Progress Bar -->
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        Question ${index + 1} of ${this.currentQuiz.total_questions}
                    </div>
                </div>

                <!-- Question Header -->
                <div class="question-header">
                    <span class="question-number">
                        Question ${question.shuffled_position}
                    </span>
                    <span>
                        Original: #${question.original_position}
                    </span>
                </div>

                <!-- Question Text -->
                <div class="question-text">
                    ${question.question_text || question.name}
                </div>

                <!-- Answer Options -->
                <div class="answers-container">
                    ${question.answers.map((answer, idx) => `
                        <div class="answer-option">
                            <input
                                type="radio"
                                name="answer"
                                id="answer-${idx}"
                                value="${answer.id}"
                                ${this.answers[question.id] === answer.id ? 'checked' : ''}
                                onchange="quizApp.selectAnswer('${question.id}', '${answer.id}')"
                            >
                            <label for="answer-${idx}">
                                <span class="answer-letter">${answer.display_letter || String.fromCharCode(65 + idx)}</span>
                                <span class="answer-text">${answer.text}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>

                <!-- Navigation Buttons -->
                <div class="navigation-buttons">
                    <button
                        class="btn-prev"
                        ${index === 0 ? 'disabled' : ''}
                        onclick="quizApp.previousQuestion()"
                    >
                        ← Previous
                    </button>

                    ${index < this.currentQuiz.total_questions - 1 ? `
                        <button
                            class="btn-next"
                            onclick="quizApp.nextQuestion()"
                        >
                            Next →
                        </button>
                    ` : `
                        <button
                            class="btn-submit"
                            onclick="quizApp.submitQuiz()"
                        >
                            Submit Quiz
                        </button>
                    `}
                </div>
            </div>
        `;

        this.elements.mobileContent.innerHTML = html;
    }

    /**
     * Select an answer
     */
    selectAnswer(questionId, answerId) {
        this.answers[questionId] = answerId;
        console.log('Answer selected:', { questionId, answerId });
    }

    /**
     * Navigate to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.total_questions - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion(this.currentQuestionIndex);
        }
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion(this.currentQuestionIndex);
        }
    }

    /**
     * Submit quiz
     */
    async submitQuiz() {
        const answeredCount = Object.keys(this.answers).length;
        const totalQuestions = this.currentQuiz.total_questions;

        if (answeredCount < totalQuestions) {
            if (!confirm(`You have only answered ${answeredCount} out of ${totalQuestions} questions. Submit anyway?`)) {
                return;
            }
        }

        this.showLoading(true);

        try {
            // Calculate score (for demo purposes)
            let correctCount = 0;

            for (const question of this.currentQuiz.questions) {
                const selectedAnswerId = this.answers[question.id];
                if (selectedAnswerId) {
                    const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
                    if (selectedAnswer && selectedAnswer.is_correct) {
                        correctCount++;
                    }
                }
            }

            const score = Math.round((correctCount / totalQuestions) * 100);
            const timeSpent = Math.round((Date.now() - this.startTime) / 1000);

            this.displayResults(score, correctCount, totalQuestions, timeSpent);

            this.showStatus('Quiz submitted successfully!', 'success');
            this.updateSystemStatus('Completed');

        } catch (error) {
            console.error('Error submitting quiz:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display quiz results
     */
    displayResults(score, correctCount, totalQuestions, timeSpent) {
        const emoji = score >= 80 ? '🎉' : score >= 60 ? '😊' : '📚';
        const message = score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep practicing!';

        const html = `
            <div class="result-container">
                <div class="result-icon">${emoji}</div>
                <div class="result-score">${score}%</div>
                <div class="result-message">${message}</div>

                <div class="info-panel" style="margin: 0;">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Correct Answers:</span>
                            <span class="info-value">${correctCount} / ${totalQuestions}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Time Spent:</span>
                            <span class="info-value">${this.formatTime(timeSpent)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Quiz ID:</span>
                            <span class="info-value">${this.currentQuiz.quiz_id}</span>
                        </div>
                    </div>
                </div>

                <button class="btn-next mt-20" onclick="quizApp.reset()">
                    Take Another Quiz
                </button>
            </div>
        `;

        this.elements.mobileContent.innerHTML = html;
    }

    /**
     * Reset quiz
     */
    reset() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = null;

        this.elements.mobileContent.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-icon">📱</div>
                <h2>Virtual Smartphone</h2>
                <p>학생 퀴즈 화면</p>
                <p class="help-text">좌측에서 Quiz를 로드하세요</p>
            </div>
        `;

        this.elements.shuffleInfo.style.display = 'none';
        this.elements.statusMessage.style.display = 'none';
        this.updateSystemStatus('Ready');
    }

    /**
     * Show mock quiz for demonstration (when API is unavailable)
     */
    showMockQuiz() {
        this.showStatus('API unavailable. Showing mock data for demonstration.', 'info');

        // Create mock quiz data
        this.currentQuiz = {
            success: true,
            quiz_id: 101,
            student_id: 1001,
            total_questions: 5,
            questions: [
                {
                    id: 5001,
                    name: 'Math Question 1',
                    question_text: 'What is 2 + 2?',
                    original_position: 1,
                    shuffled_position: 3,
                    answers: [
                        { id: 'C', text: '4', is_correct: true, display_letter: 'A', shuffled_position: 0 },
                        { id: 'A', text: '3', is_correct: false, display_letter: 'B', shuffled_position: 1 },
                        { id: 'D', text: '5', is_correct: false, display_letter: 'C', shuffled_position: 2 },
                        { id: 'B', text: '22', is_correct: false, display_letter: 'D', shuffled_position: 3 }
                    ]
                },
                {
                    id: 5002,
                    name: 'Math Question 2',
                    question_text: 'What is 10 - 3?',
                    original_position: 2,
                    shuffled_position: 1,
                    answers: [
                        { id: 'B', text: '7', is_correct: true, display_letter: 'A', shuffled_position: 0 },
                        { id: 'A', text: '6', is_correct: false, display_letter: 'B', shuffled_position: 1 },
                        { id: 'C', text: '8', is_correct: false, display_letter: 'C', shuffled_position: 2 },
                        { id: 'D', text: '13', is_correct: false, display_letter: 'D', shuffled_position: 3 }
                    ]
                },
                {
                    id: 5003,
                    name: 'Math Question 3',
                    question_text: 'What is 3 × 4?',
                    original_position: 3,
                    shuffled_position: 5,
                    answers: [
                        { id: 'C', text: '12', is_correct: true, display_letter: 'A', shuffled_position: 0 },
                        { id: 'A', text: '7', is_correct: false, display_letter: 'B', shuffled_position: 1 },
                        { id: 'B', text: '11', is_correct: false, display_letter: 'C', shuffled_position: 2 },
                        { id: 'D', text: '16', is_correct: false, display_letter: 'D', shuffled_position: 3 }
                    ]
                },
                {
                    id: 5004,
                    name: 'Math Question 4',
                    question_text: 'What is 15 ÷ 3?',
                    original_position: 4,
                    shuffled_position: 2,
                    answers: [
                        { id: 'C', text: '5', is_correct: true, display_letter: 'A', shuffled_position: 0 },
                        { id: 'A', text: '3', is_correct: false, display_letter: 'B', shuffled_position: 1 },
                        { id: 'B', text: '4', is_correct: false, display_letter: 'C', shuffled_position: 2 },
                        { id: 'D', text: '6', is_correct: false, display_letter: 'D', shuffled_position: 3 }
                    ]
                },
                {
                    id: 5005,
                    name: 'Math Question 5',
                    question_text: 'What is 8 + 7?',
                    original_position: 5,
                    shuffled_position: 4,
                    answers: [
                        { id: 'B', text: '15', is_correct: true, display_letter: 'A', shuffled_position: 0 },
                        { id: 'A', text: '14', is_correct: false, display_letter: 'B', shuffled_position: 1 },
                        { id: 'C', text: '16', is_correct: false, display_letter: 'C', shuffled_position: 2 },
                        { id: 'D', text: '17', is_correct: false, display_letter: 'D', shuffled_position: 3 }
                    ]
                }
            ],
            shuffle_seed: 'a3f5c9e2b1d4...',
            cached: false,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            execution_time_ms: 45
        };

        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = Date.now();

        this.displayShuffleInfo(this.currentQuiz);
        this.displayQuestion(0);
        this.updateSystemStatus('Demo Mode');
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = `status-message ${type}`;
        this.elements.statusMessage.style.display = 'block';

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                this.elements.statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Update system status indicator
     */
    updateSystemStatus(status) {
        this.elements.systemStatus.textContent = status;
    }

    /**
     * Format time in seconds to readable format
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
    }
}

// Initialize app when DOM is loaded
let quizApp;
document.addEventListener('DOMContentLoaded', () => {
    quizApp = new ShuffledQuizApp();
    console.log('Data Shuffle Quiz App initialized');
});
