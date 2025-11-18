/**
 * Moodle API Integration Module
 * Connects to Moodle 3.7 Web Services API
 */

class MoodleAPI {
    constructor() {
        this.baseUrl = '';
        this.token = '';
        this.courseId = null;
        this.quizId = null;
        this.demoMode = false;

        // Demo mode problems
        this.demoProblems = [
            {
                id: 1,
                question: "log₂(8) = ?",
                answer: "3",
                explanation: "2³ = 8 이므로 log₂(8) = 3"
            },
            {
                id: 2,
                question: "log₁₀(100) = ?",
                answer: "2",
                explanation: "10² = 100 이므로 log₁₀(100) = 2"
            },
            {
                id: 3,
                question: "log₂(16) = ?",
                answer: "4",
                explanation: "2⁴ = 16 이므로 log₂(16) = 4"
            },
            {
                id: 4,
                question: "log₅(25) = ?",
                answer: "2",
                explanation: "5² = 25 이므로 log₅(25) = 2"
            },
            {
                id: 5,
                question: "log₃(27) = ?",
                answer: "3",
                explanation: "3³ = 27 이므로 log₃(27) = 3"
            },
            {
                id: 6,
                question: "log₂(32) = ?",
                answer: "5",
                explanation: "2⁵ = 32 이므로 log₂(32) = 5"
            },
            {
                id: 7,
                question: "log₁₀(1000) = ?",
                answer: "3",
                explanation: "10³ = 1000 이므로 log₁₀(1000) = 3"
            },
            {
                id: 8,
                question: "log₂(64) = ?",
                answer: "6",
                explanation: "2⁶ = 64 이므로 log₂(64) = 6"
            },
            {
                id: 9,
                question: "log₄(16) = ?",
                answer: "2",
                explanation: "4² = 16 이므로 log₄(16) = 2"
            },
            {
                id: 10,
                question: "log₂(128) = ?",
                answer: "7",
                explanation: "2⁷ = 128 이므로 log₂(128) = 7"
            }
        ];

        this.currentProblemIndex = 0;
    }

    /**
     * Initialize Moodle connection
     */
    init(config) {
        this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
        this.token = config.token;
        this.courseId = config.courseId;
        this.quizId = config.quizId;
        this.demoMode = config.demoMode || false;

        // Save to localStorage
        if (!this.demoMode) {
            localStorage.setItem('moodleConfig', JSON.stringify(config));
        }
    }

    /**
     * Enable demo mode (works without Moodle)
     */
    enableDemoMode() {
        this.demoMode = true;
        this.currentProblemIndex = 0;
        console.log('Demo mode enabled');
    }

    /**
     * Make API call to Moodle
     */
    async callAPI(functionName, params = {}) {
        if (this.demoMode) {
            return this.getDemoData(functionName, params);
        }

        const url = `${this.baseUrl}/webservice/rest/server.php`;

        const formData = new FormData();
        formData.append('wstoken', this.token);
        formData.append('wsfunction', functionName);
        formData.append('moodlewsrestformat', 'json');

        // Add parameters
        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message || 'Moodle API Error');
            }

            return data;
        } catch (error) {
            console.error('Moodle API Error:', error);
            throw error;
        }
    }

    /**
     * Get demo data (for testing without Moodle)
     */
    getDemoData(functionName, params) {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (functionName) {
                    case 'core_user_get_users_by_field':
                        resolve([{
                            id: 1,
                            fullname: '데모 학습자',
                            email: 'demo@example.com'
                        }]);
                        break;

                    case 'mod_quiz_get_quiz_access_information':
                        resolve({
                            canaccess: true,
                            canreview: true
                        });
                        break;

                    case 'mod_quiz_get_attempt_data':
                        // Return current demo problem
                        const problem = this.demoProblems[this.currentProblemIndex];
                        resolve({
                            questions: [{
                                slot: 1,
                                type: 'numerical',
                                questiontext: problem.question,
                                answer: problem.answer
                            }]
                        });
                        break;

                    default:
                        resolve({});
                }
            }, 500); // Simulate network delay
        });
    }

    /**
     * Get current user info
     */
    async getCurrentUser() {
        if (this.demoMode) {
            return {
                id: 1,
                fullname: '데모 학습자',
                email: 'demo@example.com'
            };
        }

        const users = await this.callAPI('core_user_get_users_by_field', {
            field: 'id',
            'values[0]': '2' // Assuming user ID 2, should be dynamic
        });

        return users[0] || null;
    }

    /**
     * Get quiz questions
     */
    async getQuizQuestions() {
        if (this.demoMode) {
            const problem = this.demoProblems[this.currentProblemIndex];
            return {
                id: problem.id,
                question: problem.question,
                answer: problem.answer,
                explanation: problem.explanation,
                type: 'numerical'
            };
        }

        // In real Moodle, you'd need to start an attempt first
        // This is a simplified version
        const quizData = await this.callAPI('mod_quiz_get_quiz_access_information', {
            quizid: this.quizId
        });

        // Get attempt data (you'd need to create an attempt first)
        const attemptData = await this.callAPI('mod_quiz_get_attempt_data', {
            attemptid: 1 // This should be dynamic
        });

        return attemptData;
    }

    /**
     * Get next problem
     */
    async getNextProblem() {
        if (this.demoMode) {
            const problem = this.demoProblems[this.currentProblemIndex];
            return {
                id: problem.id,
                question: problem.question,
                correctAnswer: problem.answer,
                explanation: problem.explanation
            };
        }

        // Real Moodle implementation
        return await this.getQuizQuestions();
    }

    /**
     * Submit answer
     */
    async submitAnswer(problemId, answer) {
        if (this.demoMode) {
            const problem = this.demoProblems[this.currentProblemIndex];
            const isCorrect = answer.trim() === problem.answer;

            return {
                correct: isCorrect,
                explanation: problem.explanation,
                correctAnswer: problem.answer
            };
        }

        // Real Moodle implementation would be here
        // This would involve submitting to mod_quiz_process_attempt
        return await this.callAPI('mod_quiz_process_attempt', {
            attemptid: 1,
            data: JSON.stringify([{
                name: `q${problemId}`,
                value: answer
            }])
        });
    }

    /**
     * Move to next problem
     */
    nextProblem() {
        if (this.demoMode) {
            this.currentProblemIndex = (this.currentProblemIndex + 1) % this.demoProblems.length;
        }
    }

    /**
     * Test connection
     */
    async testConnection() {
        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Export for use in other files
const moodleAPI = new MoodleAPI();
