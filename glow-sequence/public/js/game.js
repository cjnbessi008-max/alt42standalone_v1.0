/**
 * Glow Sequence - Main Game Logic
 * Handles game state, user interactions, and API calls
 */

class GlowSequenceGame {
    constructor() {
        this.currentStudent = null;
        this.problems = [];
        this.currentProblemIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalAttempts = 0;
    }

    /**
     * Initialize game with student data
     */
    setStudent(studentData) {
        this.currentStudent = studentData;
        console.log('Student loaded:', studentData);
    }

    /**
     * Load problems from API
     */
    async loadProblems(difficulty = null, limit = 20) {
        if (!this.currentStudent) {
            throw new Error('Student not loaded');
        }

        try {
            let url = `../api/get_problems.php?student_id=${this.currentStudent.id}&limit=${limit}`;
            if (difficulty) {
                url += `&difficulty=${difficulty}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.problems = data.data.problems;
                this.currentProblemIndex = 0;
                return this.problems;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading problems:', error);
            throw error;
        }
    }

    /**
     * Get current problem
     */
    getCurrentProblem() {
        if (this.currentProblemIndex >= this.problems.length) {
            return null;
        }
        return this.problems[this.currentProblemIndex];
    }

    /**
     * Submit answer
     */
    async submitAnswer(answer, timeSpent, hintUsed = false) {
        if (!this.currentStudent) {
            throw new Error('Student not loaded');
        }

        const currentProblem = this.getCurrentProblem();
        if (!currentProblem) {
            throw new Error('No current problem');
        }

        try {
            const response = await fetch('../api/submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.currentStudent.id,
                    sequence_id: currentProblem.id,
                    answer: answer,
                    time_spent: timeSpent,
                    hint_used: hintUsed
                })
            });

            const data = await response.json();

            if (data.success) {
                this.totalAttempts++;
                if (data.data.is_correct) {
                    this.correctAnswers++;
                    this.score += data.data.score_earned;
                }
                return data.data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * Move to next problem
     */
    nextProblem() {
        this.currentProblemIndex++;
        return this.getCurrentProblem();
    }

    /**
     * Get student progress
     */
    async getProgress() {
        if (!this.currentStudent) {
            throw new Error('Student not loaded');
        }

        try {
            const response = await fetch(`../api/get_progress.php?student_id=${this.currentStudent.id}`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error getting progress:', error);
            throw error;
        }
    }

    /**
     * Get accuracy percentage
     */
    getAccuracy() {
        if (this.totalAttempts === 0) return 0;
        return Math.round((this.correctAnswers / this.totalAttempts) * 100);
    }

    /**
     * Reset game state
     */
    reset() {
        this.problems = [];
        this.currentProblemIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalAttempts = 0;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlowSequenceGame;
}
