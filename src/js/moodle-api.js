/**
 * Moodle LMS Integration API
 * Handles communication with Moodle 3.7 backend
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

class MoodleAPI {
    constructor() {
        this.baseUrl = this.detectMoodleUrl();
        this.sessionToken = null;
        this.currentProblem = null;
        this.studentId = null;
        this.courseId = null;
        this.activityId = null;

        this.init();
    }

    /**
     * Detect Moodle base URL from current context
     */
    detectMoodleUrl() {
        // Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const moodleUrl = urlParams.get('moodle_url');

        if (moodleUrl) {
            return moodleUrl;
        }

        // Try to get from parent frame (if embedded)
        try {
            if (window.parent && window.parent !== window) {
                const parentUrl = window.parent.location.href;
                if (parentUrl.includes('moodle')) {
                    return parentUrl.split('/mod/')[0];
                }
            }
        } catch (e) {
            console.warn('Cannot access parent frame:', e);
        }

        // Default fallback
        return '/moodle';
    }

    /**
     * Initialize API connection
     */
    async init() {
        try {
            // Get session parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.sessionToken = urlParams.get('token');
            this.studentId = urlParams.get('student_id');
            this.courseId = urlParams.get('course_id');
            this.activityId = urlParams.get('activity_id');

            // If no parameters, try to load from localStorage (for testing)
            if (!this.sessionToken) {
                this.loadFromStorage();
            }

            console.log('Moodle API initialized:', {
                baseUrl: this.baseUrl,
                hasToken: !!this.sessionToken,
                studentId: this.studentId,
                courseId: this.courseId,
                activityId: this.activityId
            });
        } catch (error) {
            console.error('Failed to initialize Moodle API:', error);
        }
    }

    /**
     * Load session from localStorage (for development/testing)
     */
    loadFromStorage() {
        const stored = localStorage.getItem('moodle_session');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.sessionToken = data.token;
                this.studentId = data.studentId;
                this.courseId = data.courseId;
                this.activityId = data.activityId;
            } catch (e) {
                console.warn('Failed to parse stored session:', e);
            }
        }
    }

    /**
     * Save session to localStorage (for development/testing)
     */
    saveToStorage() {
        const data = {
            token: this.sessionToken,
            studentId: this.studentId,
            courseId: this.courseId,
            activityId: this.activityId
        };
        localStorage.setItem('moodle_session', JSON.stringify(data));
    }

    /**
     * Make API request to Moodle
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}/webservice/rest/server.php`;

        const params = new URLSearchParams({
            wstoken: this.sessionToken || 'demo_token',
            wsfunction: endpoint,
            moodlewsrestformat: 'json'
        });

        if (data && method === 'GET') {
            Object.keys(data).forEach(key => {
                params.append(key, data[key]);
            });
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method === 'POST') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${url}?${params}`, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check for Moodle error response
            if (result.exception) {
                throw new Error(result.message || 'Moodle API error');
            }

            return result;
        } catch (error) {
            console.error('API request failed:', error);

            // Return mock data for development
            return this.getMockResponse(endpoint, data);
        }
    }

    /**
     * Get mock response for development/testing
     */
    getMockResponse(endpoint, data) {
        console.log('Using mock data for:', endpoint);

        switch (endpoint) {
            case 'local_touchmath_get_problem':
                return this.getMockProblem();

            case 'local_touchmath_submit_answer':
                return this.getMockSubmitResponse(data);

            default:
                return { success: true, mock: true };
        }
    }

    /**
     * Get mock problem for testing
     */
    getMockProblem() {
        return {
            id: 1,
            title: '이차함수의 접선',
            description: '주어진 곡선 위의 점에서 접선을 그려보세요',
            function: {
                type: 'polynomial',
                coefficients: {
                    a: 0.5,
                    b: 0,
                    c: -2
                },
                display: 'f(x) = 0.5x² - 2'
            },
            targetPoint: {
                x: 2,
                y: 0
            },
            tolerance: 0.5,
            hints: [
                '접선은 곡선과 한 점에서만 만납니다',
                '접선의 기울기는 그 점에서의 미분값과 같습니다'
            ]
        };
    }

    /**
     * Get mock submit response
     */
    getMockSubmitResponse(data) {
        // Simple validation for mock
        const isCorrect = Math.random() > 0.3; // 70% correct for testing

        return {
            success: true,
            correct: isCorrect,
            score: isCorrect ? 100 : 0,
            feedback: isCorrect
                ? '정확합니다! 접선을 올바르게 그렸습니다.'
                : '조금 더 정확하게 그려보세요. 힌트를 확인해보세요.',
            solution: {
                point: { x: 2, y: 0 },
                slope: 2,
                equation: 'y = 2x - 4'
            }
        };
    }

    /**
     * Fetch problem from Moodle
     */
    async getProblem(problemId = null) {
        const data = {
            courseid: this.courseId,
            activityid: this.activityId,
            studentid: this.studentId
        };

        if (problemId) {
            data.problemid = problemId;
        }

        const response = await this.request('local_touchmath_get_problem', 'GET', data);
        this.currentProblem = response;

        return response;
    }

    /**
     * Submit answer to Moodle
     */
    async submitAnswer(answerData) {
        const data = {
            courseid: this.courseId,
            activityid: this.activityId,
            studentid: this.studentId,
            problemid: this.currentProblem?.id,
            answer: JSON.stringify(answerData),
            timestamp: new Date().toISOString()
        };

        const response = await this.request('local_touchmath_submit_answer', 'POST', data);

        return response;
    }

    /**
     * Save student progress
     */
    async saveProgress(progressData) {
        const data = {
            courseid: this.courseId,
            activityid: this.activityId,
            studentid: this.studentId,
            progress: JSON.stringify(progressData),
            timestamp: new Date().toISOString()
        };

        return await this.request('local_touchmath_save_progress', 'POST', data);
    }

    /**
     * Get student progress
     */
    async getProgress() {
        const data = {
            courseid: this.courseId,
            activityid: this.activityId,
            studentid: this.studentId
        };

        return await this.request('local_touchmath_get_progress', 'GET', data);
    }

    /**
     * Log interaction event
     */
    async logEvent(eventType, eventData) {
        const data = {
            courseid: this.courseId,
            activityid: this.activityId,
            studentid: this.studentId,
            eventtype: eventType,
            eventdata: JSON.stringify(eventData),
            timestamp: new Date().toISOString()
        };

        // Fire and forget - don't wait for response
        this.request('local_touchmath_log_event', 'POST', data).catch(err => {
            console.warn('Failed to log event:', err);
        });
    }

    /**
     * Check if connected to Moodle
     */
    isConnected() {
        return !!(this.sessionToken && this.studentId);
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected(),
            baseUrl: this.baseUrl,
            studentId: this.studentId,
            courseId: this.courseId,
            activityId: this.activityId,
            hasProblem: !!this.currentProblem
        };
    }
}
