// Absolute Mirror - Moodle LMS API Integration

class MoodleAPI {
    constructor(config) {
        this.baseUrl = config.moodle.baseUrl;
        this.endpoints = config.moodle.endpoints;
        this.token = config.moodle.token;
        this.demoMode = config.demo.enabled;
        this.demoProblems = config.demo.problems || [];
        this.currentProblemIndex = 0;
    }

    /**
     * Make API request to Moodle backend
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = this.baseUrl + endpoint;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Include cookies for session management
        };

        // Add token if available
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add body for POST requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API request failed:', error);

            // Fallback to demo mode if API fails
            if (!this.demoMode) {
                console.warn('API failed, falling back to demo mode');
                this.demoMode = true;
            }

            throw error;
        }
    }

    /**
     * Get list of available problems
     */
    async getProblems(filters = {}) {
        if (this.demoMode) {
            return this.getDemoProblems(filters);
        }

        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = `${this.endpoints.getProblems}?${queryParams}`;
            const result = await this.request(endpoint, 'GET');
            return result;
        } catch (error) {
            console.error('Failed to fetch problems:', error);
            return this.getDemoProblems(filters);
        }
    }

    /**
     * Get demo problems (offline mode)
     */
    getDemoProblems(filters = {}) {
        let problems = [...this.demoProblems];

        // Apply filters if any
        if (filters.difficulty) {
            problems = problems.filter(p =>
                p.difficulty === filters.difficulty
            );
        }

        return {
            success: true,
            data: problems,
            total: problems.length,
            demo: true
        };
    }

    /**
     * Get a specific problem by ID
     */
    async getProblem(problemId) {
        if (this.demoMode) {
            return this.getDemoProblem(problemId);
        }

        try {
            const endpoint = `${this.endpoints.getProblem}?id=${problemId}`;
            const result = await this.request(endpoint, 'GET');
            return result;
        } catch (error) {
            console.error('Failed to fetch problem:', error);
            return this.getDemoProblem(problemId);
        }
    }

    /**
     * Get demo problem
     */
    getDemoProblem(problemId) {
        const problem = this.demoProblems.find(p => p.id === problemId);

        if (!problem) {
            // Return first problem if ID not found
            return {
                success: true,
                data: this.demoProblems[0],
                demo: true
            };
        }

        return {
            success: true,
            data: problem,
            demo: true
        };
    }

    /**
     * Get next random problem
     */
    async getRandomProblem() {
        if (this.demoMode) {
            // Cycle through demo problems
            const problem = this.demoProblems[this.currentProblemIndex];
            this.currentProblemIndex = (this.currentProblemIndex + 1) % this.demoProblems.length;

            return {
                success: true,
                data: problem,
                demo: true
            };
        }

        try {
            const endpoint = `${this.endpoints.getProblem}?random=1`;
            const result = await this.request(endpoint, 'GET');
            return result;
        } catch (error) {
            console.error('Failed to fetch random problem:', error);
            return this.getRandomProblem(); // Will use demo mode
        }
    }

    /**
     * Submit student answer
     */
    async submitAnswer(problemId, answer, studentId = null) {
        const submissionData = {
            problem_id: problemId,
            student_id: studentId,
            answer: answer,
            timestamp: new Date().toISOString()
        };

        if (this.demoMode) {
            console.log('Demo mode - Answer submitted:', submissionData);
            return {
                success: true,
                message: 'Answer recorded (demo mode)',
                demo: true
            };
        }

        try {
            const result = await this.request(
                this.endpoints.submitAnswer,
                'POST',
                submissionData
            );
            return result;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return {
                success: false,
                error: error.message,
                demo: true
            };
        }
    }

    /**
     * Get student progress
     */
    async getProgress(studentId) {
        if (this.demoMode) {
            return {
                success: true,
                data: {
                    student_id: studentId || 'demo_student',
                    problems_attempted: 5,
                    problems_correct: 3,
                    accuracy: 60,
                    last_activity: new Date().toISOString()
                },
                demo: true
            };
        }

        try {
            const endpoint = `${this.endpoints.getProgress}?student_id=${studentId}`;
            const result = await this.request(endpoint, 'GET');
            return result;
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse equation string and extract parameters
     */
    parseEquation(equationString) {
        // Parse equations like "|x - 3| = 5" or "|x + 2| = 3"
        const pattern = /\|x\s*([+-])\s*(\d+)\|\s*=\s*(\d+)/;
        const match = equationString.match(pattern);

        if (match) {
            const sign = match[1];
            const offset = parseInt(match[2]);
            const target = parseInt(match[3]);

            // Calculate axis of symmetry
            const axis = sign === '-' ? offset : -offset;

            return {
                axis: axis,
                target: target,
                valid: true
            };
        }

        // Try pattern for |x| = value
        const simplePattern = /\|x\|\s*=\s*(\d+)/;
        const simpleMatch = equationString.match(simplePattern);

        if (simpleMatch) {
            return {
                axis: 0,
                target: parseInt(simpleMatch[1]),
                valid: true
            };
        }

        return {
            axis: 0,
            target: 0,
            valid: false,
            error: 'Invalid equation format'
        };
    }

    /**
     * Verify if a proposed solution is correct
     */
    verifySolution(equation, proposedSolution) {
        const params = this.parseEquation(equation);
        if (!params.valid) {
            return false;
        }

        const leftSolution = params.axis - params.target;
        const rightSolution = params.axis + params.target;

        return proposedSolution === leftSolution ||
               proposedSolution === rightSolution;
    }

    /**
     * Get solutions for an equation
     */
    getSolutions(equation) {
        const params = this.parseEquation(equation);
        if (!params.valid) {
            return [];
        }

        return [
            params.axis - params.target,  // Left solution
            params.axis + params.target   // Right solution
        ];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleAPI;
}
