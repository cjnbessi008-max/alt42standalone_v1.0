/**
 * Rule Door - Main Application
 */

class RuleDoorApp {
    constructor() {
        this.currentRule = null;
        this.currentQuestion = null;
        this.currentQuiz = null;
        this.refreshIntervals = [];

        // Bind elements
        this.elements = {
            studentName: document.getElementById('student-name'),
            quizName: document.getElementById('quiz-name'),
            questionContent: document.getElementById('question-content'),
            answerInput: document.getElementById('answer-input'),
            checkAnswerBtn: document.getElementById('check-answer-btn'),
            submitAnswerBtn: document.getElementById('submit-answer-btn'),
            feedbackArea: document.getElementById('feedback-area'),
            feedbackMessage: document.getElementById('feedback-message'),
            ruleName: document.getElementById('rule-name'),
            ruleType: document.getElementById('rule-type'),
            ruleDescription: document.getElementById('rule-description'),
            ruleBadgeText: document.getElementById('rule-badge-text')
        };

        // Bind event listeners
        this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.elements.checkAnswerBtn.addEventListener('click', () => this.handleCheckAnswer());
        this.elements.submitAnswerBtn.addEventListener('click', () => this.handleSubmitAnswer());

        // Enable/disable submit button based on answer input
        this.elements.answerInput.addEventListener('input', () => {
            const hasAnswer = this.elements.answerInput.value.trim().length > 0;
            // Submit button is enabled only after checking answer
        });
    }

    /**
     * Initialize the application
     */
    async initialize() {
        Logger.log('Initializing Rule Door App');
        loadingController.show();

        try {
            // Load quiz information
            await this.loadQuizInfo();

            // Load student information
            await this.loadStudentInfo();

            // Load or create rule for this quiz
            await this.loadRule();

            // Load first question
            await this.loadQuestion();

            // Load initial statistics
            await this.loadStatistics();

            // Start refresh intervals
            this.startRefreshIntervals();

            Logger.log('App initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize app', error);
            this.showError('Failed to load application. Please refresh the page.');
        } finally {
            loadingController.hide();
        }
    }

    /**
     * Load quiz information
     */
    async loadQuizInfo() {
        try {
            this.currentQuiz = await api.getQuizInfo(SESSION.quizId);
            this.elements.quizName.textContent = `Quiz: ${this.currentQuiz.name || 'Unknown'}`;
            Logger.log('Quiz loaded', this.currentQuiz);
        } catch (error) {
            Logger.error('Failed to load quiz info', error);
            this.elements.quizName.textContent = 'Quiz: Error loading';
        }
    }

    /**
     * Load student information
     */
    async loadStudentInfo() {
        try {
            const student = await api.getStudentInfo(SESSION.studentId);
            this.elements.studentName.textContent = `Student: ${student.firstname} ${student.lastname}`;
            Logger.log('Student loaded', student);
        } catch (error) {
            Logger.error('Failed to load student info', error);
            this.elements.studentName.textContent = `Student: User ${SESSION.studentId}`;
        }
    }

    /**
     * Load rule for current quiz
     */
    async loadRule() {
        try {
            // Try to get existing rule
            this.currentRule = await api.getRuleByQuizId(SESSION.quizId);
            Logger.log('Rule loaded', this.currentRule);
        } catch (error) {
            Logger.warn('No rule found for quiz, creating default rule');

            // Create default rule
            const newRule = {
                moodle_quiz_id: SESSION.quizId,
                moodle_course_id: SESSION.courseId,
                rule_name: `Quiz ${SESSION.quizId} - Duplicate Check`,
                rule_type: 'duplicate_not_allowed',
                description: 'Automatically created rule for duplicate prevention',
                is_active: 1
            };

            this.currentRule = await api.createRule(newRule);
            Logger.log('Rule created', this.currentRule);
        }

        // Update rule display
        this.updateRuleDisplay();
    }

    /**
     * Update rule display
     */
    updateRuleDisplay() {
        if (!this.currentRule) return;

        this.elements.ruleName.textContent = this.currentRule.rule_name;
        this.elements.ruleType.textContent = this.currentRule.rule_type === 'duplicate_allowed'
            ? 'Duplicate Allowed'
            : 'Duplicate Not Allowed';
        this.elements.ruleDescription.textContent = this.currentRule.description || 'No description';

        // Update badge
        this.elements.ruleBadgeText.textContent = this.currentRule.rule_type === 'duplicate_allowed'
            ? 'Duplicates OK ✓'
            : 'No Duplicates ✗';

        this.elements.ruleBadgeText.style.background = this.currentRule.rule_type === 'duplicate_allowed'
            ? 'rgba(40, 167, 69, 0.9)'
            : 'rgba(220, 53, 69, 0.9)';
        this.elements.ruleBadgeText.style.color = 'white';
    }

    /**
     * Load question
     */
    async loadQuestion() {
        try {
            const questions = await api.getQuizQuestions(SESSION.quizId);

            if (questions && questions.length > 0) {
                this.currentQuestion = questions[0]; // Load first question
                this.elements.questionContent.innerHTML = `
                    <h3>${this.currentQuestion.question_name}</h3>
                    <div>${this.currentQuestion.questiontext}</div>
                    <p><small>Type: ${this.currentQuestion.question_type} | Max Mark: ${this.currentQuestion.maxmark}</small></p>
                `;
                Logger.log('Question loaded', this.currentQuestion);
            } else {
                this.elements.questionContent.innerHTML = '<p>No questions available for this quiz.</p>';
            }
        } catch (error) {
            Logger.error('Failed to load question', error);
            this.elements.questionContent.innerHTML = '<p>Error loading question. Using demo question.</p><p><strong>Demo Question:</strong> What is 2 + 2?</p>';

            // Set demo question for testing
            this.currentQuestion = {
                question_id: 1,
                question_name: 'Demo Math Question',
                questiontext: 'What is 2 + 2?',
                question_type: 'shortanswer'
            };
        }
    }

    /**
     * Handle check answer button click
     */
    async handleCheckAnswer() {
        const answer = this.elements.answerInput.value.trim();

        if (!answer) {
            this.showFeedback('Please enter an answer first.', 'warning');
            return;
        }

        loadingController.show();

        try {
            // Prepare answer data
            const answerData = {
                answer: answer,
                question_id: this.currentQuestion ? this.currentQuestion.question_id : 1,
                timestamp: new Date().toISOString()
            };

            // Evaluate door state
            const doorState = await api.evaluateDoorState(
                this.currentRule.id,
                SESSION.studentId,
                answerData
            );

            Logger.log('Door state evaluated', doorState);

            // Update door visualization
            doorController.updateFromState(doorState);

            // Show feedback
            if (doorState.door_status === 'open') {
                this.showFeedback(`✓ ${doorState.reason}`, 'success');
                this.elements.submitAnswerBtn.disabled = false;
            } else {
                this.showFeedback(`✗ ${doorState.reason}`, 'error');
                this.elements.submitAnswerBtn.disabled = true;
            }

        } catch (error) {
            Logger.error('Failed to check answer', error);
            this.showFeedback('Error checking answer. Please try again.', 'error');
        } finally {
            loadingController.hide();
        }
    }

    /**
     * Handle submit answer button click
     */
    async handleSubmitAnswer() {
        const answer = this.elements.answerInput.value.trim();

        if (!answer) {
            this.showFeedback('Please enter an answer first.', 'warning');
            return;
        }

        loadingController.show();

        try {
            // Prepare answer data
            const answerData = {
                answer: answer,
                question_id: this.currentQuestion ? this.currentQuestion.question_id : 1,
                timestamp: new Date().toISOString()
            };

            // Record attempt
            const attemptResult = await api.recordAttempt({
                rule_id: this.currentRule.id,
                student_id: SESSION.studentId,
                moodle_question_id: this.currentQuestion ? this.currentQuestion.question_id : 1,
                answer_data: answerData,
                is_correct: null, // Will be determined by grading logic
                time_spent_seconds: null
            });

            Logger.log('Attempt recorded', attemptResult);

            // Update statistics
            statsController.incrementAttempts();
            if (attemptResult.is_duplicate) {
                statsController.incrementDuplicates();
            }

            // Show success message
            this.showFeedback('Answer submitted successfully!', 'success');

            // Reset form
            this.elements.answerInput.value = '';
            this.elements.submitAnswerBtn.disabled = true;

            // Close door
            doorController.close('Answer submitted. Ready for next question.');

            // Reload statistics
            await this.loadStatistics();

        } catch (error) {
            Logger.error('Failed to submit answer', error);
            this.showFeedback('Error submitting answer. Please try again.', 'error');
        } finally {
            loadingController.hide();
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        this.elements.feedbackArea.classList.remove('hidden', 'success', 'error', 'warning');
        this.elements.feedbackArea.classList.add(type);
        this.elements.feedbackMessage.textContent = message;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showFeedback(message, 'error');
    }

    /**
     * Load statistics
     */
    async loadStatistics() {
        try {
            const stats = await api.getAttemptStatistics(this.currentRule.id, SESSION.studentId);
            statsController.update(stats);
            Logger.log('Statistics loaded', stats);
        } catch (error) {
            Logger.error('Failed to load statistics', error);
        }
    }

    /**
     * Start refresh intervals
     */
    startRefreshIntervals() {
        // Refresh statistics periodically
        const statsInterval = setInterval(() => {
            this.loadStatistics();
        }, CONFIG.STATISTICS_REFRESH_INTERVAL);

        this.refreshIntervals.push(statsInterval);

        Logger.log('Refresh intervals started');
    }

    /**
     * Stop refresh intervals
     */
    stopRefreshIntervals() {
        this.refreshIntervals.forEach(interval => clearInterval(interval));
        this.refreshIntervals = [];
        Logger.log('Refresh intervals stopped');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Logger.log('DOM loaded, initializing app');

    const app = new RuleDoorApp();
    app.initialize();

    // Make app globally accessible for debugging
    if (CONFIG.DEBUG) {
        window.ruleDoorApp = app;
        window.api = api;
        window.doorController = doorController;
        window.statsController = statsController;
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.ruleDoorApp) {
        window.ruleDoorApp.stopRefreshIntervals();
    }
});
