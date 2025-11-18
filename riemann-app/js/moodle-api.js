/**
 * Moodle API Client
 * Handles communication with Moodle LMS via PHP backend
 */

class MoodleAPI {
    constructor(baseUrl = 'php/') {
        this.baseUrl = baseUrl;
        this.currentProblem = null;
    }

    /**
     * Fetch a problem from Moodle
     * @param {number} problemId - The problem ID
     * @returns {Promise<Object>} Problem data
     */
    async fetchProblem(problemId) {
        try {
            const response = await fetch(`${this.baseUrl}get-problem.php?id=${problemId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                return data.problem;
            } else {
                throw new Error(data.error || 'Failed to fetch problem');
            }
        } catch (error) {
            console.error('Error fetching problem:', error);
            throw error;
        }
    }

    /**
     * Fetch all available problems
     * @returns {Promise<Array>} Array of problem objects
     */
    async fetchAllProblems() {
        try {
            const response = await fetch(`${this.baseUrl}get-all-problems.php`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return data.problems;
            } else {
                throw new Error(data.error || 'Failed to fetch problems');
            }
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw error;
        }
    }

    /**
     * Submit a student's answer
     * @param {number} problemId - The problem ID
     * @param {number} userId - The user ID
     * @param {number} answer - The student's answer
     * @param {number} actualAnswer - The correct answer
     * @returns {Promise<Object>} Result data
     */
    async submitAnswer(problemId, userId, answer, actualAnswer) {
        try {
            const response = await fetch(`${this.baseUrl}submit-answer.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: problemId,
                    user_id: userId,
                    answer: answer,
                    actual_answer: actualAnswer
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return data;
            } else {
                throw new Error(data.error || 'Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * Check connection to Moodle
     * @returns {Promise<boolean>} True if connected
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}check-connection.php`);

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Connection check failed:', error);
            return false;
        }
    }

    /**
     * Parse function string from problem data
     * @param {string} functionStr - Function string (e.g., "x^2", "x*x")
     * @returns {Function} JavaScript function
     */
    parseFunctionString(functionStr) {
        try {
            // Simple parser for common mathematical expressions
            // In production, use a proper math parser like math.js

            // Replace common patterns
            let jsCode = functionStr
                .replace(/\^/g, '**')  // x^2 -> x**2
                .replace(/(\d)x/g, '$1*x')  // 2x -> 2*x
                .replace(/x(\d)/g, 'x*$1')  // x2 -> x*2
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/exp/g, 'Math.exp')
                .replace(/log/g, 'Math.log')
                .replace(/abs/g, 'Math.abs');

            // Create function
            return new Function('x', `return ${jsCode};`);
        } catch (error) {
            console.error('Error parsing function:', error);
            // Default to x^2
            return (x) => x * x;
        }
    }

    /**
     * Get the current problem
     * @returns {Object|null} Current problem data
     */
    getCurrentProblem() {
        return this.currentProblem;
    }
}
