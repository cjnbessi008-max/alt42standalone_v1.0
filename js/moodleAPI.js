/**
 * Moodle API Integration
 * Handles communication with Moodle LMS via PHP bridge
 */

class MoodleAPI {
    constructor() {
        this.baseURL = './api/moodle-bridge.php';
        this.sessionToken = null;
        this.userId = null;
        this.currentProblem = null;
    }

    /**
     * Initialize connection with Moodle
     */
    async initialize() {
        try {
            const response = await this.request('init');

            if (response.success) {
                this.sessionToken = response.token;
                this.userId = response.userId;
                console.log('Moodle connection initialized');
                return response;
            } else {
                throw new Error(response.message || 'Failed to initialize');
            }
        } catch (error) {
            console.error('Moodle initialization error:', error);
            // Return mock data for development
            return this.getMockInitData();
        }
    }

    /**
     * Get user information from Moodle
     */
    async getUserInfo() {
        try {
            const response = await this.request('getUserInfo', {
                userId: this.userId
            });

            return response.success ? response.data : this.getMockUserData();
        } catch (error) {
            console.error('Get user info error:', error);
            return this.getMockUserData();
        }
    }

    /**
     * Fetch next problem/question from Moodle
     */
    async getNextProblem() {
        try {
            const response = await this.request('getNextProblem', {
                userId: this.userId,
                sessionToken: this.sessionToken
            });

            if (response.success) {
                this.currentProblem = response.data;
                return response.data;
            } else {
                return this.getMockProblem();
            }
        } catch (error) {
            console.error('Get problem error:', error);
            return this.getMockProblem();
        }
    }

    /**
     * Submit answer to Moodle
     * @param {string} answer - User's answer
     */
    async submitAnswer(answer) {
        try {
            const response = await this.request('submitAnswer', {
                userId: this.userId,
                problemId: this.currentProblem?.id,
                answer: answer,
                sessionToken: this.sessionToken
            });

            return response.success ? response.data : this.getMockSubmitResult(answer);
        } catch (error) {
            console.error('Submit answer error:', error);
            return this.getMockSubmitResult(answer);
        }
    }

    /**
     * Get user's score history
     */
    async getScoreHistory() {
        try {
            const response = await this.request('getScoreHistory', {
                userId: this.userId
            });

            return response.success ? response.data : [];
        } catch (error) {
            console.error('Get score history error:', error);
            return [];
        }
    }

    /**
     * Update user progress
     */
    async updateProgress(progressData) {
        try {
            const response = await this.request('updateProgress', {
                userId: this.userId,
                ...progressData
            });

            return response.success;
        } catch (error) {
            console.error('Update progress error:', error);
            return false;
        }
    }

    /**
     * Generic request method
     */
    async request(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);

        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        const response = await fetch(this.baseURL, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // ============ MOCK DATA FOR DEVELOPMENT ============

    getMockInitData() {
        return {
            success: true,
            token: 'mock-token-' + Date.now(),
            userId: 'user123',
            message: 'Mock mode - Moodle not connected'
        };
    }

    getMockUserData() {
        return {
            id: 'user123',
            name: 'Student Demo',
            email: 'demo@example.com',
            totalScore: 0,
            level: 1,
            streak: 0
        };
    }

    getMockProblem() {
        const problems = [
            {
                id: 1,
                type: 'fraction',
                question: 'Calculate: 1/2 + 1/4 = ?',
                answer: '3/4',
                difficulty: 1,
                points: 10
            },
            {
                id: 2,
                type: 'fraction',
                question: 'Simplify: 6/8',
                answer: '3/4',
                difficulty: 1,
                points: 10
            },
            {
                id: 3,
                type: 'fraction',
                question: 'Calculate: 2/3 × 3/4 = ?',
                answer: '1/2',
                difficulty: 2,
                points: 20
            },
            {
                id: 4,
                type: 'fraction',
                question: 'Convert to mixed number: 7/3',
                answer: '2 1/3',
                difficulty: 2,
                points: 15
            },
            {
                id: 5,
                type: 'fraction',
                question: 'Calculate: 5/6 - 1/3 = ?',
                answer: '1/2',
                difficulty: 2,
                points: 20
            }
        ];

        const randomProblem = problems[Math.floor(Math.random() * problems.length)];
        return randomProblem;
    }

    getMockSubmitResult(userAnswer) {
        const isCorrect = Math.random() > 0.3; // 70% correct for demo

        return {
            correct: isCorrect,
            points: isCorrect ? this.currentProblem?.points || 10 : 0,
            message: isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!',
            correctAnswer: this.currentProblem?.answer,
            explanation: isCorrect ? 'Great job!' : 'Let\'s review this concept.'
        };
    }
}

// Create global instance
window.moodleAPI = new MoodleAPI();
