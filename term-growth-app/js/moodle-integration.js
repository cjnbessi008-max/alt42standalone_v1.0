/**
 * Moodle LMS Integration Module
 *
 * This module handles integration with Moodle 3.7 LMS
 * - Receives problem data from Moodle via API
 * - Sends student progress and results back to Moodle
 * - Handles authentication and session management
 *
 * Requirements:
 * - MySQL 5.7
 * - PHP 7.1.9
 * - Moodle 3.7
 */

class MoodleIntegration {
    constructor() {
        this.config = {
            moodleUrl: 'http://localhost/moodle', // Update with actual Moodle URL
            apiEndpoint: '/webservice/rest/server.php',
            wsToken: null, // Will be set via URL parameter or config
            serviceName: 'term_growth_service'
        };

        this.status = 'disconnected';
        this.currentProblem = null;
        this.studentSession = null;

        this.init();
    }

    /**
     * Initialize Moodle integration
     */
    init() {
        // Get Moodle token from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.config.wsToken = urlParams.get('wstoken') || 'demo_token';

        // Get problem ID from URL parameters
        const problemId = urlParams.get('problemid') || 'demo';

        // Simulate connection check
        this.checkConnection()
            .then(() => {
                if (problemId === 'demo') {
                    this.loadDemoProblem();
                } else {
                    this.loadProblemFromMoodle(problemId);
                }
            })
            .catch(error => {
                console.error('Moodle connection failed:', error);
                this.loadDemoProblem();
            });
    }

    /**
     * Check connection to Moodle server
     */
    async checkConnection() {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // In production, this would make an actual API call to Moodle
                // For demo purposes, we'll use demo mode

                if (this.config.wsToken === 'demo_token') {
                    this.updateStatus('waiting', 'Demo 모드 (Moodle 연결 대기)');
                    resolve({ status: 'demo' });
                } else {
                    // Actual Moodle connection would happen here
                    this.updateStatus('connected', 'Moodle 연결됨');
                    resolve({ status: 'connected' });
                }
            }, 500);
        });
    }

    /**
     * Load problem data from Moodle
     */
    async loadProblemFromMoodle(problemId) {
        try {
            // In production, this would call Moodle Web Services API
            // Example Moodle API call:
            /*
            const response = await fetch(`${this.config.moodleUrl}${this.config.apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.config.wsToken,
                    wsfunction: 'local_termgrowth_get_problem',
                    moodlewsrestformat: 'json',
                    problemid: problemId
                })
            });

            const data = await response.json();
            this.currentProblem = data;
            */

            // For now, load demo data
            this.loadDemoProblem();

        } catch (error) {
            console.error('Failed to load problem from Moodle:', error);
            this.loadDemoProblem();
        }
    }

    /**
     * Load demo problem data
     */
    loadDemoProblem() {
        this.currentProblem = {
            id: 'TG-001',
            title: '2차 다항식 이해하기',
            difficulty: '중급',
            objective: '2차 다항식의 각 항이 그래프에 미치는 영향 이해',
            terms: [
                {
                    id: 1,
                    expression: '3',
                    coefficient: 3,
                    power: 0,
                    description: '상수항 - 그래프를 y축 방향으로 이동'
                },
                {
                    id: 2,
                    expression: '2x',
                    coefficient: 2,
                    power: 1,
                    description: '1차항 - 그래프에 기울기 추가'
                },
                {
                    id: 3,
                    expression: 'x²',
                    coefficient: 1,
                    power: 2,
                    description: '2차항 - 그래프가 포물선으로 변화'
                }
            ],
            xRange: [-5, 5],
            yRange: [-10, 30]
        };

        // Trigger custom event for problem loaded
        window.dispatchEvent(new CustomEvent('moodleProblemLoaded', {
            detail: this.currentProblem
        }));

        this.updateStatus('waiting', 'Demo 모드 실행 중');
    }

    /**
     * Send student progress to Moodle
     */
    async sendProgress(progressData) {
        try {
            console.log('Sending progress to Moodle:', progressData);

            // In production, this would call Moodle Web Services API
            /*
            const response = await fetch(`${this.config.moodleUrl}${this.config.apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.config.wsToken,
                    wsfunction: 'local_termgrowth_save_progress',
                    moodlewsrestformat: 'json',
                    ...progressData
                })
            });

            const result = await response.json();
            return result;
            */

            // For demo, just log the data
            return { success: true, message: 'Progress saved (demo mode)' };

        } catch (error) {
            console.error('Failed to send progress to Moodle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send completion status to Moodle
     */
    async sendCompletion(completionData) {
        try {
            console.log('Sending completion to Moodle:', completionData);

            // In production, this would call Moodle Web Services API
            // and potentially update grade book

            return { success: true, message: 'Completion saved (demo mode)' };

        } catch (error) {
            console.error('Failed to send completion to Moodle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update connection status display
     */
    updateStatus(status, message) {
        this.status = status;

        const statusIndicator = document.getElementById('moodleStatus');
        const statusText = document.getElementById('moodleStatusText');

        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status}`;
            statusText.textContent = message;
        }
    }

    /**
     * Get current problem data
     */
    getProblem() {
        return this.currentProblem;
    }
}

// Initialize Moodle integration when DOM is ready
let moodleIntegration;

document.addEventListener('DOMContentLoaded', () => {
    moodleIntegration = new MoodleIntegration();
});
