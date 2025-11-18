/**
 * Smartphone UI Controller
 * Handles drag, resize, and positioning of virtual smartphone
 */

class SmartphoneUI {
    constructor() {
        this.smartphone = null;
        this.dragHandle = null;
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
    }

    /**
     * Initialize smartphone UI
     */
    init() {
        this.smartphone = document.getElementById('smartphone');
        this.dragHandle = this.smartphone.querySelector('.drag-handle');

        // Set up drag events
        this.dragHandle.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));

        // Touch events for mobile
        this.dragHandle.addEventListener('touchstart', this.dragStart.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.dragEnd.bind(this));

        // Update time
        this.updateTime();
        setInterval(() => this.updateTime(), 60000); // Update every minute

        // Load saved position
        this.loadPosition();

        console.log('[SmartphoneUI] Initialized');
    }

    /**
     * Start dragging
     */
    dragStart(e) {
        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }

        if (e.target === this.dragHandle) {
            this.isDragging = true;
            this.smartphone.style.cursor = 'grabbing';
        }
    }

    /**
     * Dragging
     */
    drag(e) {
        if (this.isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }

            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.setTranslate(this.currentX, this.currentY);
        }
    }

    /**
     * End dragging
     */
    dragEnd(e) {
        if (this.isDragging) {
            this.initialX = this.currentX;
            this.initialY = this.currentY;
            this.isDragging = false;
            this.smartphone.style.cursor = 'move';

            // Save position
            this.savePosition();
        }
    }

    /**
     * Set transform translate
     */
    setTranslate(xPos, yPos) {
        this.smartphone.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    /**
     * Save position to localStorage
     */
    savePosition() {
        const position = {
            x: this.xOffset,
            y: this.yOffset
        };
        localStorage.setItem('smartphonePosition', JSON.stringify(position));
    }

    /**
     * Load position from localStorage
     */
    loadPosition() {
        const saved = localStorage.getItem('smartphonePosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                this.xOffset = position.x || 0;
                this.yOffset = position.y || 0;
                this.setTranslate(this.xOffset, this.yOffset);
            } catch (error) {
                console.error('[SmartphoneUI] Error loading position:', error);
            }
        }
    }

    /**
     * Reset position
     */
    resetPosition() {
        this.xOffset = 0;
        this.yOffset = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.setTranslate(0, 0);
        this.savePosition();
    }

    /**
     * Update phone time display
     */
    updateTime() {
        const timeElement = document.getElementById('phoneTime');
        if (timeElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * Display question on phone
     */
    displayQuestion(question) {
        const questionContent = document.getElementById('questionContent');
        const answerOptions = document.getElementById('answerOptions');

        if (!questionContent || !answerOptions) return;

        // Strip HTML tags for display
        const text = this.stripHTML(question.questiontext);
        questionContent.innerHTML = text;

        // Clear previous answers
        answerOptions.innerHTML = '';

        // Display answers if available
        if (question.answers && question.answers.length > 0) {
            question.answers.forEach((answer, index) => {
                const option = document.createElement('div');
                option.className = 'answer-option';
                option.textContent = `${String.fromCharCode(65 + index)}. ${this.stripHTML(answer.answer)}`;

                option.addEventListener('click', () => {
                    this.selectAnswer(option, answer);
                });

                answerOptions.appendChild(option);
            });
        } else {
            answerOptions.innerHTML = '<p style="text-align: center; color: #999;">답변 옵션이 없습니다</p>';
        }

        // Add highlight animation
        questionContent.style.animation = 'none';
        setTimeout(() => {
            questionContent.style.animation = 'pulse 0.5s ease';
        }, 10);
    }

    /**
     * Select answer
     */
    selectAnswer(optionElement, answer) {
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
        });

        // Mark as selected
        optionElement.classList.add('selected');

        // Check if correct (fraction > 0.9 means correct in Moodle)
        if (answer.fraction && parseFloat(answer.fraction) > 0.9) {
            optionElement.classList.add('correct');
            this.showFeedback('정답입니다!', 'success');
        } else {
            optionElement.classList.add('incorrect');
            this.showFeedback('다시 생각해보세요', 'error');
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.transition = 'opacity 0.3s';
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    /**
     * Strip HTML tags
     */
    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /**
     * Show loading state
     */
    showLoading() {
        const questionContent = document.getElementById('questionContent');
        if (questionContent) {
            questionContent.innerHTML = '<div class="loading"></div> 문제를 불러오는 중...';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const questionContent = document.getElementById('questionContent');
        if (questionContent) {
            questionContent.innerHTML = `<p style="color: #f44336;">❌ ${message}</p>`;
        }
    }
}

// Create global smartphone UI instance
const smartphoneUI = new SmartphoneUI();
