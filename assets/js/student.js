/**
 * Student Interface JavaScript
 * Handles condition checking, reading time tracking, and submission
 */

class ProblemViewer {
    constructor() {
        this.studentId = parseInt(document.getElementById('student-id').value);
        this.problemId = parseInt(document.getElementById('problem-id').value);
        this.minReadingTime = parseInt(document.getElementById('min-reading-time').value);
        this.requireAllConditions = document.getElementById('require-all-conditions').value === '1';
        this.totalConditions = parseInt(document.getElementById('total-conditions').value);

        this.startTime = null;
        this.readingTime = 0;
        this.timerInterval = null;
        this.checkedConditions = new Set();
        this.sessionData = {
            scrollEvents: 0,
            mouseMovements: 0,
            focusLostCount: 0
        };

        this.init();
    }

    init() {
        this.initializeProgress();
        this.startTimer();
        this.attachEventListeners();
        this.trackBehavior();
        this.updateUI();
    }

    /**
     * Initialize progress on the server
     */
    async initializeProgress() {
        try {
            const response = await fetch('../api/student_progress.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.problemId
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to initialize progress:', result.error);
            }
        } catch (error) {
            console.error('Error initializing progress:', error);
        }
    }

    /**
     * Start reading timer
     */
    startTimer() {
        this.startTime = Date.now();

        this.timerInterval = setInterval(() => {
            this.readingTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
            this.updateSubmissionRequirements();

            // Update server every 10 seconds
            if (this.readingTime % 10 === 0) {
                this.updateReadingTime();
            }
        }, 1000);
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.readingTime / 60);
        const seconds = this.readingTime % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        document.getElementById('reading-time').textContent = timeString;

        // Change timer color when minimum time is met
        const timerElement = document.querySelector('.reading-timer');
        if (this.readingTime >= this.minReadingTime) {
            timerElement.classList.add('time-met');
        } else {
            timerElement.classList.remove('time-met');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Condition checkboxes
        const checkboxes = document.querySelectorAll('.condition-check');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleConditionCheck(e));
        });

        // Submit button
        const submitButton = document.getElementById('submit-button');
        submitButton.addEventListener('click', () => this.handleSubmit());

        // Page visibility (track focus loss)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sessionData.focusLostCount++;
            }
        });

        // Before unload - end session
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    /**
     * Track user behavior (scrolling, mouse movement)
     */
    trackBehavior() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.sessionData.scrollEvents++;
            }, 100);
        });

        let mouseMoveTimeout;
        let lastMouseMove = 0;
        document.addEventListener('mousemove', () => {
            const now = Date.now();
            if (now - lastMouseMove > 500) { // Throttle to every 500ms
                clearTimeout(mouseMoveTimeout);
                mouseMoveTimeout = setTimeout(() => {
                    this.sessionData.mouseMovements++;
                }, 100);
                lastMouseMove = now;
            }
        });
    }

    /**
     * Handle condition checkbox change
     */
    async handleConditionCheck(event) {
        const checkbox = event.target;
        const conditionId = parseInt(checkbox.dataset.conditionId);
        const conditionItem = checkbox.closest('.condition-item');

        if (checkbox.checked) {
            this.checkedConditions.add(conditionId);
            conditionItem.classList.add('checked');

            // Send to server
            await this.checkCondition(conditionId);
        } else {
            this.checkedConditions.delete(conditionId);
            conditionItem.classList.remove('checked');
        }

        this.updateProgress();
        this.updateSubmissionRequirements();
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const progressCount = document.getElementById('progress-count');
        const progressFill = document.getElementById('progress-fill');

        progressCount.textContent = this.checkedConditions.size;

        const percentage = (this.checkedConditions.size / this.totalConditions) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    /**
     * Update submission requirements
     */
    updateSubmissionRequirements() {
        const timeRequirement = document.getElementById('req-time');
        const conditionsRequirement = document.getElementById('req-conditions');
        const submitButton = document.getElementById('submit-button');

        // Check time requirement
        const timeMet = this.readingTime >= this.minReadingTime;
        if (timeMet) {
            timeRequirement.classList.remove('incomplete');
            timeRequirement.classList.add('complete');
        } else {
            timeRequirement.classList.add('incomplete');
            timeRequirement.classList.remove('complete');
        }

        // Check conditions requirement
        const conditionsMet = this.checkedConditions.size === this.totalConditions;
        if (conditionsMet) {
            conditionsRequirement.classList.remove('incomplete');
            conditionsRequirement.classList.add('complete');
        } else {
            conditionsRequirement.classList.add('incomplete');
            conditionsRequirement.classList.remove('complete');
        }

        // Enable submit button if all requirements met
        if (timeMet && conditionsMet) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        this.updateProgress();
        this.updateSubmissionRequirements();
    }

    /**
     * Send condition check to server
     */
    async checkCondition(conditionId) {
        try {
            const response = await fetch('../api/student_progress.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.problemId,
                    action: 'check_condition',
                    condition_id: conditionId,
                    time_to_check: this.readingTime
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to check condition:', result.error);
            }
        } catch (error) {
            console.error('Error checking condition:', error);
        }
    }

    /**
     * Update reading time on server
     */
    async updateReadingTime() {
        try {
            await fetch('../api/student_progress.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.problemId,
                    action: 'update_reading_time',
                    additional_time: 10
                })
            });
        } catch (error) {
            console.error('Error updating reading time:', error);
        }
    }

    /**
     * End reading session
     */
    async endSession() {
        try {
            await fetch('../api/student_progress.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.problemId,
                    action: 'end_session',
                    session_duration: this.readingTime,
                    scroll_events: this.sessionData.scrollEvents,
                    mouse_movements: this.sessionData.mouseMovements,
                    focus_lost_count: this.sessionData.focusLostCount
                })
            });
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }

    /**
     * Handle problem submission
     */
    async handleSubmit() {
        // Confirm submission
        if (!confirm('답안을 제출하시겠습니까?\n제출 후에는 수정할 수 없습니다.')) {
            return;
        }

        // End timer
        clearInterval(this.timerInterval);

        try {
            // End session
            await this.endSession();

            // Submit
            const response = await fetch('../api/student_progress.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.problemId,
                    action: 'submit'
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('답안이 성공적으로 제출되었습니다!');
                // Redirect or show completion message
                window.location.href = `completion.php?problem_id=${this.problemId}&student_id=${this.studentId}`;
            } else {
                alert(`제출 실패: ${result.error}`);
                // Restart timer if submission failed
                this.startTimer();
            }
        } catch (error) {
            console.error('Error submitting:', error);
            alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            this.startTimer();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProblemViewer();
});
