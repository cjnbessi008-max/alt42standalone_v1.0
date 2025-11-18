/**
 * ALT42 Choice Gesture - Main Application
 * Interactive multiple choice with animated hand gestures
 *
 * Compatible with:
 * - Moodle 3.7
 * - Modern browsers (ES6+)
 */

class ChoiceGestureApp {
    constructor() {
        // API Configuration
        this.apiUrl = 'api.php';

        // Application State
        this.currentQuestion = null;
        this.selectedChoiceId = null;
        this.isAnswered = false;
        this.score = 0;
        this.totalQuestions = 0;

        // DOM Elements
        this.elements = {
            loadingSpinner: document.getElementById('loadingSpinner'),
            questionBox: document.getElementById('questionBox'),
            questionText: document.getElementById('questionText'),
            questionMeta: document.getElementById('questionMeta'),
            choicesContainer: document.getElementById('choicesContainer'),
            handGesture: document.getElementById('handGesture'),
            feedbackMessage: document.getElementById('feedbackMessage'),
            feedbackIcon: document.getElementById('feedbackIcon'),
            feedbackTitle: document.getElementById('feedbackTitle'),
            feedbackText: document.getElementById('feedbackText'),
            btnSubmit: document.getElementById('btnSubmit'),
            btnNext: document.getElementById('btnNext')
        };

        // Initialize application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('🚀 Initializing Choice Gesture App...');

        // Set up event listeners
        this.setupEventListeners();

        // Load first question
        this.loadQuestion();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Submit button
        this.elements.btnSubmit.addEventListener('click', () => {
            this.submitAnswer();
        });

        // Next question button
        this.elements.btnNext.addEventListener('click', () => {
            this.loadQuestion();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isAnswered && this.selectedChoiceId) {
                this.submitAnswer();
            } else if (e.key === 'Enter' && this.isAnswered) {
                this.loadQuestion();
            } else if (e.key >= '1' && e.key <= '4' && !this.isAnswered) {
                const index = parseInt(e.key) - 1;
                const choices = this.elements.choicesContainer.querySelectorAll('.choice-item');
                if (choices[index]) {
                    this.selectChoice(index, this.currentQuestion.choices[index].id);
                }
            }
        });
    }

    /**
     * Load a random question from Moodle
     */
    async loadQuestion() {
        try {
            // Reset state
            this.resetQuestion();

            // Show loading spinner
            this.showLoading(true);

            // Fetch question from API
            const response = await fetch(`${this.apiUrl}?action=random&t=${Date.now()}`);
            const data = await response.json();

            if (data.success && data.data) {
                this.currentQuestion = data.data;
                this.totalQuestions++;
                this.renderQuestion();
            } else {
                this.showError('문제를 불러올 수 없습니다.');
            }

        } catch (error) {
            console.error('Error loading question:', error);
            this.showError('네트워크 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render question and choices
     */
    renderQuestion() {
        const q = this.currentQuestion;

        // Display question text
        this.elements.questionText.textContent = q.questiontext;
        this.elements.questionMeta.textContent = `문제 ${this.totalQuestions} | ${q.category_name || '일반'} | ${q.points}점`;

        // Show question box
        this.elements.questionBox.style.display = 'block';

        // Render choices
        this.renderChoices();

        console.log('✅ Question loaded:', q.name);
    }

    /**
     * Render answer choices
     */
    renderChoices() {
        const choicesContainer = this.elements.choicesContainer;
        choicesContainer.innerHTML = '';

        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

        this.currentQuestion.choices.forEach((choice, index) => {
            const choiceElement = document.createElement('div');
            choiceElement.className = 'choice-item';
            choiceElement.dataset.choiceId = choice.id;
            choiceElement.dataset.index = index;
            choiceElement.setAttribute('tabindex', '0');
            choiceElement.setAttribute('role', 'button');
            choiceElement.setAttribute('aria-label', `선택지 ${labels[index]}: ${choice.answer}`);

            choiceElement.innerHTML = `
                <span class="choice-label">${labels[index]}</span>
                <span class="choice-text">${choice.answer}</span>
            `;

            // Add click event listener
            choiceElement.addEventListener('click', (e) => {
                if (!this.isAnswered) {
                    this.selectChoice(index, choice.id, e);
                }
            });

            // Add keyboard support
            choiceElement.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !this.isAnswered) {
                    e.preventDefault();
                    this.selectChoice(index, choice.id, e);
                }
            });

            choicesContainer.appendChild(choiceElement);
        });
    }

    /**
     * Select a choice with animated hand gesture
     */
    selectChoice(index, choiceId, event) {
        // Remove previous selection
        const allChoices = this.elements.choicesContainer.querySelectorAll('.choice-item');
        allChoices.forEach(choice => choice.classList.remove('selected'));

        // Select new choice
        const selectedChoice = allChoices[index];
        selectedChoice.classList.add('selected');

        this.selectedChoiceId = choiceId;

        // Enable submit button
        this.elements.btnSubmit.disabled = false;

        // Show hand gesture animation
        if (event) {
            this.showHandGesture(event);
        }

        // Add ripple effect
        this.createRipple(event, selectedChoice);

        console.log('👆 Choice selected:', index);
    }

    /**
     * Show animated hand gesture
     */
    showHandGesture(event) {
        const gesture = this.elements.handGesture;
        const rect = event.target.closest('.choice-item').getBoundingClientRect();
        const container = document.querySelector('.screen-content').getBoundingClientRect();

        // Position hand gesture
        gesture.style.left = `${rect.left - container.left + rect.width / 2}px`;
        gesture.style.top = `${rect.top - container.top + rect.height / 2}px`;

        // Remove previous animation classes
        gesture.classList.remove('active', 'swipe-left', 'swipe-right');

        // Trigger reflow
        void gesture.offsetWidth;

        // Add active class for tap animation
        gesture.classList.add('active');

        // Remove animation class after animation completes
        setTimeout(() => {
            gesture.classList.remove('active');
        }, 800);
    }

    /**
     * Create ripple effect on tap
     */
    createRipple(event, element) {
        if (!event) return;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Submit answer and show feedback
     */
    submitAnswer() {
        if (!this.selectedChoiceId || this.isAnswered) {
            return;
        }

        this.isAnswered = true;

        // Find selected choice
        const selectedChoice = this.currentQuestion.choices.find(
            choice => choice.id === this.selectedChoiceId
        );

        const isCorrect = selectedChoice.is_correct;

        // Update UI
        const allChoices = this.elements.choicesContainer.querySelectorAll('.choice-item');
        allChoices.forEach((choiceElement, index) => {
            const choice = this.currentQuestion.choices[index];

            if (choice.is_correct) {
                choiceElement.classList.add('correct');
            } else if (choice.id === this.selectedChoiceId && !isCorrect) {
                choiceElement.classList.add('incorrect');
            }

            // Disable further selection
            choiceElement.style.pointerEvents = 'none';
        });

        // Update score
        if (isCorrect) {
            this.score++;
        }

        // Show feedback
        this.showFeedback(isCorrect, selectedChoice.feedback);

        // Disable submit button, enable next button
        this.elements.btnSubmit.disabled = true;
        this.elements.btnNext.focus();

        console.log(isCorrect ? '✅ Correct!' : '❌ Incorrect!', `Score: ${this.score}/${this.totalQuestions}`);
    }

    /**
     * Show feedback message
     */
    showFeedback(isCorrect, feedbackText) {
        const feedback = this.elements.feedbackMessage;

        if (isCorrect) {
            this.elements.feedbackIcon.textContent = '🎉';
            this.elements.feedbackTitle.textContent = '정답입니다!';
            this.elements.feedbackText.textContent = feedbackText || '잘하셨습니다!';
        } else {
            this.elements.feedbackIcon.textContent = '😢';
            this.elements.feedbackTitle.textContent = '틀렸습니다!';
            this.elements.feedbackText.textContent = feedbackText || '다시 한번 생각해보세요.';
        }

        feedback.classList.add('show');

        // Auto-hide feedback after 3 seconds
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 3000);
    }

    /**
     * Reset question state
     */
    resetQuestion() {
        this.selectedChoiceId = null;
        this.isAnswered = false;
        this.elements.choicesContainer.innerHTML = '';
        this.elements.btnSubmit.disabled = true;
        this.elements.feedbackMessage.classList.remove('show');
    }

    /**
     * Show/hide loading spinner
     */
    showLoading(show) {
        this.elements.loadingSpinner.style.display = show ? 'flex' : 'none';
        this.elements.questionBox.style.display = show ? 'none' : 'block';
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.questionText.textContent = '❌ ' + message;
        this.elements.questionMeta.textContent = '';
        this.elements.questionBox.style.display = 'block';
        console.error('Error:', message);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new ChoiceGestureApp();
    });
} else {
    window.app = new ChoiceGestureApp();
}

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            registration => console.log('✅ ServiceWorker registered'),
            err => console.log('❌ ServiceWorker registration failed:', err)
        ).catch(err => {
            // Ignore if sw.js doesn't exist
        });
    });
}
