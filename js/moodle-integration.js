/**
 * Moodle LMS Integration Module
 * Handles communication with Moodle 3.7 LMS
 */

class MoodleIntegration {
    constructor() {
        this.apiUrl = 'php/moodle-api.php';
        this.wsToken = null;
        this.moodleUrl = null;
        this.currentProblem = null;
        this.connectionStatus = 'disconnected';
    }

    /**
     * Initialize connection with Moodle
     * @param {string} moodleUrl - Moodle instance URL
     * @param {string} wsToken - Web service token
     * @returns {Promise<boolean>} Success status
     */
    async initialize(moodleUrl, wsToken) {
        this.moodleUrl = moodleUrl;
        this.wsToken = wsToken;

        try {
            this.updateConnectionStatus('connecting');

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'test_connection',
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                this.updateConnectionStatus('connected');
                console.log('Moodle connection established');
                return true;
            } else {
                this.updateConnectionStatus('error');
                console.error('Moodle connection failed:', data.error);
                return false;
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            console.error('Connection error:', error);
            return false;
        }
    }

    /**
     * Load problem from Moodle
     * @param {number} problemId - Problem ID in Moodle
     * @returns {Promise<Object>} Problem data
     */
    async loadProblem(problemId) {
        try {
            this.updateConnectionStatus('loading');

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_problem',
                    problem_id: problemId,
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.updateConnectionStatus('connected');
                return data.problem;
            } else {
                this.updateConnectionStatus('error');
                throw new Error(data.error || 'Failed to load problem');
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            console.error('Error loading problem:', error);
            throw error;
        }
    }

    /**
     * Get problem list from Moodle course
     * @param {number} courseId - Course ID in Moodle
     * @returns {Promise<Array>} Array of problems
     */
    async getProblemList(courseId) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_problem_list',
                    course_id: courseId,
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                return data.problems;
            } else {
                throw new Error(data.error || 'Failed to load problem list');
            }
        } catch (error) {
            console.error('Error loading problem list:', error);
            throw error;
        }
    }

    /**
     * Submit student answer to Moodle
     * @param {number} problemId - Problem ID
     * @param {Object} answer - Student's answer data
     * @returns {Promise<Object>} Submission result
     */
    async submitAnswer(problemId, answer) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submit_answer',
                    problem_id: problemId,
                    answer: answer,
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                return {
                    correct: data.correct,
                    score: data.score,
                    feedback: data.feedback
                };
            } else {
                throw new Error(data.error || 'Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * Save student progress
     * @param {number} problemId - Problem ID
     * @param {Object} progressData - Progress data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveProgress(problemId, progressData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_progress',
                    problem_id: problemId,
                    progress: progressData,
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    /**
     * Load student progress
     * @param {number} problemId - Problem ID
     * @returns {Promise<Object>} Progress data
     */
    async loadProgress(problemId) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load_progress',
                    problem_id: problemId,
                    moodle_url: this.moodleUrl,
                    ws_token: this.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                return data.progress;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    }

    /**
     * Update connection status indicator
     * @param {string} status - Status ('connected', 'disconnected', 'loading', 'error')
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;

        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const statusConfig = {
            connected: { text: '🔗 연결됨', class: 'status-connected' },
            disconnected: { text: '❌ 연결 끊김', class: 'status-disconnected' },
            connecting: { text: '🔄 연결 중...', class: 'status-loading' },
            loading: { text: '⏳ 로딩 중...', class: 'status-loading' },
            error: { text: '⚠️ 오류', class: 'status-error' }
        };

        const config = statusConfig[status] || statusConfig.disconnected;

        statusElement.textContent = config.text;
        statusElement.className = 'connection-status ' + config.class;
    }

    /**
     * Parse problem data for derivative visualization
     * @param {Object} problem - Problem data from Moodle
     * @returns {Object} Parsed data for visualization
     */
    parseProblemData(problem) {
        return {
            id: problem.id,
            title: problem.title || 'Derivative Problem',
            description: problem.description || '',
            function: problem.function || 'x^2',
            xRange: {
                min: problem.x_min || -5,
                max: problem.x_max || 5
            },
            targetPoints: problem.target_points || [],
            hints: problem.hints || [],
            difficulty: problem.difficulty || 'medium'
        };
    }

    /**
     * Format problem data for display
     * @param {Object} problem - Problem data
     * @returns {string} HTML string for display
     */
    formatProblemDisplay(problem) {
        const parsed = this.parseProblemData(problem);

        return `
            <div class="problem-header">
                <h3>${parsed.title}</h3>
                <span class="difficulty-badge difficulty-${parsed.difficulty}">
                    ${parsed.difficulty.toUpperCase()}
                </span>
            </div>
            <div class="problem-description">
                <p>${parsed.description}</p>
            </div>
            <div class="problem-function">
                <strong>함수:</strong>
                <code>f(x) = ${parsed.function}</code>
            </div>
            <div class="problem-range">
                <strong>X 범위:</strong>
                [${parsed.xRange.min}, ${parsed.xRange.max}]
            </div>
        `;
    }

    /**
     * Get current problem
     * @returns {Object} Current problem data
     */
    getCurrentProblem() {
        return this.currentProblem;
    }

    /**
     * Check if connected to Moodle
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.connectionStatus === 'connected';
    }

    /**
     * Disconnect from Moodle
     */
    disconnect() {
        this.wsToken = null;
        this.moodleUrl = null;
        this.currentProblem = null;
        this.updateConnectionStatus('disconnected');
    }

    /**
     * Load demo problem (for testing without Moodle)
     * @returns {Object} Demo problem data
     */
    loadDemoProblem() {
        this.currentProblem = {
            id: 'demo-1',
            title: '데모: 이차 함수의 도함수',
            description: 'x²의 그래프와 그 도함수 2x를 관찰하세요. X 값이 변할 때 기울기가 어떻게 변하는지 확인하세요.',
            function: 'x^2',
            x_min: -5,
            x_max: 5,
            target_points: [0, 1, 2],
            hints: [
                'x = 0일 때 기울기는 0입니다.',
                'x가 증가하면 기울기도 증가합니다.',
                'f\'(x) = 2x입니다.'
            ],
            difficulty: 'beginner'
        };

        this.updateConnectionStatus('connected');
        return this.currentProblem;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleIntegration;
}
