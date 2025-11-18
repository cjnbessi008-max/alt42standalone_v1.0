/**
 * Log Function Calculator
 * Calculates growth based on logarithmic functions
 */

class LogCalculator {
    constructor() {
        this.solvedProblems = 0;
        this.correctAnswers = 0;
        this.totalAttempts = 0;
        this.baseGrowthRate = 10; // Base height increment per problem
    }

    /**
     * Calculate tree height based on problems solved
     * Uses logarithmic growth: height = base * log₂(n + 1)
     */
    calculateTreeHeight(problemsSolved) {
        if (problemsSolved === 0) return 0;

        // Logarithmic growth function
        // height = 50 * log₂(problemsSolved + 1)
        const height = 50 * Math.log2(problemsSolved + 1);
        return Math.round(height);
    }

    /**
     * Calculate growth rate (how much the tree grows per problem)
     * The rate decreases as more problems are solved (logarithmic property)
     */
    calculateGrowthRate(problemsSolved) {
        // Derivative of log growth
        // rate = 50 / ((problemsSolved + 1) * ln(2))
        const rate = 50 / ((problemsSolved + 1) * Math.LN2);
        return Math.round(rate * 10) / 10;
    }

    /**
     * Calculate current level based on problems solved
     */
    calculateLevel(problemsSolved) {
        // Level up every 5 problems
        return Math.floor(problemsSolved / 5) + 1;
    }

    /**
     * Calculate accuracy percentage
     */
    calculateAccuracy() {
        if (this.totalAttempts === 0) return 0;
        return Math.round((this.correctAnswers / this.totalAttempts) * 100);
    }

    /**
     * Calculate progress percentage to next level
     */
    calculateProgress() {
        const problemsInCurrentLevel = this.solvedProblems % 5;
        return (problemsInCurrentLevel / 5) * 100;
    }

    /**
     * Record a problem attempt
     */
    recordAttempt(isCorrect) {
        this.totalAttempts++;

        if (isCorrect) {
            this.correctAnswers++;
            this.solvedProblems++;
            return true;
        }

        return false;
    }

    /**
     * Get current statistics
     */
    getStatistics() {
        return {
            solvedProblems: this.solvedProblems,
            correctAnswers: this.correctAnswers,
            totalAttempts: this.totalAttempts,
            accuracy: this.calculateAccuracy(),
            level: this.calculateLevel(this.solvedProblems),
            progress: this.calculateProgress(),
            treeHeight: this.calculateTreeHeight(this.solvedProblems),
            growthRate: this.calculateGrowthRate(this.solvedProblems)
        };
    }

    /**
     * Get logarithmic growth formula display
     */
    getGrowthFormula() {
        const n = this.solvedProblems + 1;
        const logValue = Math.log2(n).toFixed(2);
        return `log₂(${n}) = ${logValue}`;
    }

    /**
     * Calculate leaf count based on tree height
     * More leaves appear as the tree grows
     */
    calculateLeafCount(height) {
        // Exponential increase in leaves
        // leaves = 3 + floor(log₂(height + 1) * 2)
        if (height === 0) return 1;
        return 3 + Math.floor(Math.log2(height + 1) * 2);
    }

    /**
     * Calculate branch count
     */
    calculateBranchCount(problemsSolved) {
        // More branches every 3 problems
        return Math.min(Math.floor(problemsSolved / 3) + 1, 6);
    }

    /**
     * Reset statistics
     */
    reset() {
        this.solvedProblems = 0;
        this.correctAnswers = 0;
        this.totalAttempts = 0;
    }

    /**
     * Load statistics from localStorage
     */
    loadFromStorage() {
        const saved = localStorage.getItem('logTreeStats');
        if (saved) {
            const data = JSON.parse(saved);
            this.solvedProblems = data.solvedProblems || 0;
            this.correctAnswers = data.correctAnswers || 0;
            this.totalAttempts = data.totalAttempts || 0;
        }
    }

    /**
     * Save statistics to localStorage
     */
    saveToStorage() {
        const data = {
            solvedProblems: this.solvedProblems,
            correctAnswers: this.correctAnswers,
            totalAttempts: this.totalAttempts
        };
        localStorage.setItem('logTreeStats', JSON.stringify(data));
    }
}

// Export for use in other files
const logCalculator = new LogCalculator();
