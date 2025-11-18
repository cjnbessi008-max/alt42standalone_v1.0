/**
 * LMS Integration Module
 * Connects to Moodle LMS (MySQL 5.7, PHP 7.1.9, Moodle 3.7)
 * Receives problem information and user data
 */

class LMSIntegration {
    constructor() {
        this.apiEndpoint = this.detectLMSEndpoint();
        this.sessionToken = null;
        this.currentProblem = null;
        this.userId = null;
    }

    /**
     * Detect LMS endpoint from URL parameters or configuration
     */
    detectLMSEndpoint() {
        const urlParams = new URLSearchParams(window.location.search);
        const lmsUrl = urlParams.get('lms_url') ||
                      localStorage.getItem('lms_endpoint') ||
                      'http://localhost/moodle'; // Default for development

        return lmsUrl;
    }

    /**
     * Initialize connection with Moodle LMS
     */
    async initialize() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            this.sessionToken = urlParams.get('token') ||
                              sessionStorage.getItem('moodle_session_token');
            this.userId = urlParams.get('userid') ||
                         sessionStorage.getItem('moodle_user_id');

            if (this.sessionToken) {
                await this.validateSession();
            }

            // Load problem data from URL or storage
            const problemId = urlParams.get('problemid');
            if (problemId) {
                await this.loadProblem(problemId);
            } else {
                // Load demo problem for testing
                this.loadDemoProblem();
            }

            console.log('LMS Integration initialized:', {
                endpoint: this.apiEndpoint,
                hasToken: !!this.sessionToken,
                userId: this.userId
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize LMS integration:', error);
            // Fall back to demo mode
            this.loadDemoProblem();
            return false;
        }
    }

    /**
     * Validate session token with Moodle
     */
    async validateSession() {
        if (!this.sessionToken) {
            throw new Error('No session token available');
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.sessionToken,
                    wsfunction: 'core_webservice_get_site_info',
                    moodlewsrestformat: 'json'
                })
            });

            const data = await response.json();

            if (data.errorcode) {
                throw new Error(`Moodle API Error: ${data.message}`);
            }

            this.userId = data.userid;
            sessionStorage.setItem('moodle_user_id', this.userId);
            sessionStorage.setItem('moodle_session_token', this.sessionToken);

            return true;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }

    /**
     * Load problem data from Moodle
     */
    async loadProblem(problemId) {
        try {
            // Moodle Web Service API call
            const response = await fetch(`${this.apiEndpoint}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.sessionToken,
                    wsfunction: 'local_rotationalsweep_get_problem',
                    moodlewsrestformat: 'json',
                    problemid: problemId
                })
            });

            const data = await response.json();

            if (data.errorcode) {
                throw new Error(`Failed to load problem: ${data.message}`);
            }

            this.currentProblem = {
                id: data.id,
                title: data.title,
                difficulty: data.difficulty,
                learningObjective: data.learningobjective,
                curveFunction: data.curvefunction || 'x^2',
                rotationAxis: data.rotationaxis || 'x',
                bounds: {
                    start: parseFloat(data.boundstart) || 0,
                    end: parseFloat(data.boundend) || 2
                },
                parameters: {
                    rotationSpeed: parseFloat(data.rotationspeed) || 2.0,
                    spiralPitch: parseFloat(data.spiralpitch) || 0.5,
                    segments: parseInt(data.segments) || 64
                }
            };

            this.updateProblemDisplay();
            return this.currentProblem;

        } catch (error) {
            console.error('Failed to load problem from Moodle:', error);
            this.loadDemoProblem();
            return this.currentProblem;
        }
    }

    /**
     * Load demo problem for testing without Moodle connection
     */
    loadDemoProblem() {
        this.currentProblem = {
            id: 'DEMO-001',
            title: '회전체의 부피 계산',
            difficulty: '중급',
            learningObjective: 'y = x² 함수를 x축 중심으로 회전시켜 생성되는 회전체의 부피를 이해한다.',
            curveFunction: 'x^2',
            rotationAxis: 'x',
            bounds: {
                start: 0,
                end: 2
            },
            parameters: {
                rotationSpeed: 2.0,
                spiralPitch: 0.5,
                segments: 64
            }
        };

        this.updateProblemDisplay();
        console.log('Demo problem loaded:', this.currentProblem);
    }

    /**
     * Update problem information display
     */
    updateProblemDisplay() {
        if (!this.currentProblem) return;

        const problemIdEl = document.getElementById('problem-id');
        const difficultyEl = document.getElementById('problem-difficulty');
        const objectiveEl = document.getElementById('learning-objective');

        if (problemIdEl) problemIdEl.textContent = this.currentProblem.id;
        if (difficultyEl) difficultyEl.textContent = this.currentProblem.difficulty;
        if (objectiveEl) objectiveEl.textContent = this.currentProblem.learningObjective;
    }

    /**
     * Submit student progress to Moodle
     */
    async submitProgress(progressData) {
        if (!this.sessionToken || !this.userId) {
            console.warn('Cannot submit progress: No active session');
            return false;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.sessionToken,
                    wsfunction: 'local_rotationalsweep_submit_progress',
                    moodlewsrestformat: 'json',
                    userid: this.userId,
                    problemid: this.currentProblem.id,
                    progress: JSON.stringify(progressData),
                    timestamp: Date.now()
                })
            });

            const data = await response.json();

            if (data.errorcode) {
                throw new Error(`Failed to submit progress: ${data.message}`);
            }

            console.log('Progress submitted successfully:', data);
            return true;

        } catch (error) {
            console.error('Failed to submit progress:', error);
            return false;
        }
    }

    /**
     * Get current problem data
     */
    getProblem() {
        return this.currentProblem;
    }

    /**
     * Update problem parameters
     */
    updateParameters(parameters) {
        if (this.currentProblem) {
            this.currentProblem.parameters = {
                ...this.currentProblem.parameters,
                ...parameters
            };
        }
    }
}

// Export for use in other modules
window.LMSIntegration = LMSIntegration;
