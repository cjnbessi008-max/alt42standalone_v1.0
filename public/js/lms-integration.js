/**
 * LMS Integration Module
 * Handles communication with Moodle LMS
 */

class LMSIntegration {
    constructor() {
        this.apiEndpoint = 'api/moodle-bridge.php';
        this.problemData = null;
        this.userId = null;
        this.courseId = null;
        this.sessionId = null;

        // Check for LTI parameters in URL
        this.initFromURL();
    }

    /**
     * Initialize from URL parameters (LTI launch)
     */
    initFromURL() {
        const params = new URLSearchParams(window.location.search);

        // Get LTI parameters
        this.userId = params.get('user_id') || params.get('userId');
        this.courseId = params.get('course_id') || params.get('courseId');
        this.problemId = params.get('problem_id') || params.get('problemId');
        this.sessionId = params.get('session_id') || params.get('sessionId');

        // Store in hidden fields
        if (this.problemId) {
            document.getElementById('problemId').value = this.problemId;
        }
        if (this.userId) {
            document.getElementById('userId').value = this.userId;
        }
        if (this.courseId) {
            document.getElementById('courseId').value = this.courseId;
        }

        // Log connection info
        console.log('LMS Integration initialized:', {
            userId: this.userId,
            courseId: this.courseId,
            problemId: this.problemId,
            sessionId: this.sessionId
        });

        // Load problem data if available
        if (this.problemId) {
            this.loadProblemData();
        }
    }

    /**
     * Load problem data from Moodle
     */
    async loadProblemData() {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=getProblem&problemId=${this.problemId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId || ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.problemData = data.problem;
                this.applyProblemData(data.problem);
                console.log('Problem data loaded:', data.problem);
            } else {
                throw new Error(data.message || 'Failed to load problem data');
            }
        } catch (error) {
            console.error('Error loading problem data:', error);
            this.showError('문제 데이터를 불러오는데 실패했습니다.');
        }
    }

    /**
     * Apply problem data to the app
     */
    applyProblemData(problem) {
        // Example problem structure:
        // {
        //     id: 123,
        //     title: "이차함수 그래프 그리기",
        //     function: "quadratic",
        //     customFunction: "x*x",
        //     xRange: { min: -10, max: 10 },
        //     yRange: { min: -10, max: 10 },
        //     instructions: "공을 움직여서 함수를 이해하세요"
        // }

        if (problem.title) {
            document.querySelector('header h1').textContent = problem.title;
        }

        if (problem.instructions) {
            document.querySelector('header p').textContent = problem.instructions;
        }

        if (problem.function) {
            const functionSelect = document.getElementById('functionSelect');
            functionSelect.value = problem.function;
            functionSelect.dispatchEvent(new Event('change'));
        }

        if (problem.customFunction) {
            const customFunction = document.getElementById('customFunction');
            customFunction.value = problem.customFunction;
            customFunction.dispatchEvent(new Event('input'));
        }

        if (problem.xRange) {
            const xValue = document.getElementById('xValue');
            if (problem.xRange.min !== undefined) {
                xValue.min = problem.xRange.min;
            }
            if (problem.xRange.max !== undefined) {
                xValue.max = problem.xRange.max;
            }
        }
    }

    /**
     * Submit student progress to Moodle
     */
    async submitProgress(data) {
        try {
            const payload = {
                action: 'submitProgress',
                userId: this.userId,
                courseId: this.courseId,
                problemId: this.problemId,
                sessionId: this.sessionId,
                progress: {
                    timestamp: new Date().toISOString(),
                    ...data
                }
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Progress submitted successfully');
                return true;
            } else {
                throw new Error(result.message || 'Failed to submit progress');
            }
        } catch (error) {
            console.error('Error submitting progress:', error);
            return false;
        }
    }

    /**
     * Submit answer to Moodle
     */
    async submitAnswer(answer) {
        try {
            const payload = {
                action: 'submitAnswer',
                userId: this.userId,
                courseId: this.courseId,
                problemId: this.problemId,
                sessionId: this.sessionId,
                answer: {
                    timestamp: new Date().toISOString(),
                    ...answer
                }
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Answer submitted successfully');
                this.showSuccess('답변이 제출되었습니다!');
                return result;
            } else {
                throw new Error(result.message || 'Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showError('답변 제출에 실패했습니다.');
            return null;
        }
    }

    /**
     * Track interaction event
     */
    async trackEvent(eventName, eventData) {
        try {
            await this.submitProgress({
                eventName,
                eventData,
                ballPosition: window.rollAlongEngine ? {
                    x: window.rollAlongEngine.ball.x,
                    y: window.rollAlongEngine.ball.y
                } : null
            });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'lms-toast lms-toast-error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'lms-toast lms-toast-success';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize LMS integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lmsIntegration = new LMSIntegration();

    // Track page load
    if (window.lmsIntegration.problemId) {
        window.lmsIntegration.trackEvent('page_load', {
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    // Track significant interactions
    const trackInteraction = (eventName) => {
        if (window.lmsIntegration.problemId) {
            window.lmsIntegration.trackEvent(eventName, {
                timestamp: Date.now()
            });
        }
    };

    // Add event tracking
    document.getElementById('playBtn')?.addEventListener('click', () => trackInteraction('play_clicked'));
    document.getElementById('pauseBtn')?.addEventListener('click', () => trackInteraction('pause_clicked'));
    document.getElementById('resetBtn')?.addEventListener('click', () => trackInteraction('reset_clicked'));
    document.getElementById('functionSelect')?.addEventListener('change', (e) => {
        trackInteraction('function_changed', { function: e.target.value });
    });

    console.log('LMS Integration ready');
});

// Add toast styles dynamically
const style = document.createElement('style');
style.textContent = `
    .lms-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .lms-toast.show {
        opacity: 1;
        transform: translateY(0);
    }

    .lms-toast-error {
        background: #f44336;
    }

    .lms-toast-success {
        background: #4CAF50;
    }
`;
document.head.appendChild(style);
