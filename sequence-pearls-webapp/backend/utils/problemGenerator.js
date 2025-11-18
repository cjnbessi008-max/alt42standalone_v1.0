/**
 * Problem Generator
 * Generates sequence problems dynamically
 */

class ProblemGenerator {
    /**
     * Generate arithmetic sequence
     * @param {number} difficulty - 1 to 5
     * @returns {Object} Problem data
     */
    static generateArithmetic(difficulty) {
        const length = 5 + difficulty; // 6-10 terms
        const start = Math.floor(Math.random() * 20) + 1;
        const commonDiff = Math.floor(Math.random() * 10 * difficulty) + 1;

        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(start + (i * commonDiff));
        }

        // Choose random position (not first or last)
        const missingPos = Math.floor(Math.random() * (length - 2)) + 1;
        const answer = sequence[missingPos];

        return {
            sequence_type: 'arithmetic',
            difficulty,
            sequence_data: JSON.stringify(sequence),
            missing_position: missingPos,
            correct_answer: answer,
            rule_formula: `a_n = ${start} + (n × ${commonDiff})`,
            hint: `This is an arithmetic sequence. Each term increases by ${commonDiff}.`
        };
    }

    /**
     * Generate geometric sequence
     * @param {number} difficulty - 1 to 5
     * @returns {Object} Problem data
     */
    static generateGeometric(difficulty) {
        const length = Math.min(5 + difficulty, 8); // 6-8 terms (geometric grows fast)
        const start = Math.floor(Math.random() * 10) + 1;
        const ratio = difficulty <= 2 ? 2 : 3;

        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(start * Math.pow(ratio, i));
        }

        const missingPos = Math.floor(Math.random() * (length - 2)) + 1;
        const answer = sequence[missingPos];

        return {
            sequence_type: 'geometric',
            difficulty,
            sequence_data: JSON.stringify(sequence),
            missing_position: missingPos,
            correct_answer: answer,
            rule_formula: `a_n = ${start} × ${ratio}^n`,
            hint: `This is a geometric sequence. Each term is multiplied by ${ratio}.`
        };
    }

    /**
     * Generate Fibonacci-like sequence
     * @param {number} difficulty - 1 to 5
     * @returns {Object} Problem data
     */
    static generateFibonacci(difficulty) {
        const length = 6 + difficulty;
        const a = Math.floor(Math.random() * 4);
        const b = Math.floor(Math.random() * 5) + 1;

        const sequence = [a, b];
        for (let i = 2; i < length; i++) {
            sequence.push(sequence[i-1] + sequence[i-2]);
        }

        const missingPos = Math.floor(Math.random() * (length - 3)) + 2;
        const answer = sequence[missingPos];

        return {
            sequence_type: 'fibonacci',
            difficulty,
            sequence_data: JSON.stringify(sequence),
            missing_position: missingPos,
            correct_answer: answer,
            rule_formula: 'a_n = a_(n-1) + a_(n-2)',
            hint: 'This is a Fibonacci-like sequence. Each term is the sum of the previous two.'
        };
    }

    /**
     * Generate problem based on type and difficulty
     * @param {string} type - 'arithmetic', 'geometric', or 'fibonacci'
     * @param {number} difficulty - 1 to 5
     * @returns {Object} Problem data
     */
    static generate(type, difficulty) {
        switch (type) {
            case 'geometric':
                return this.generateGeometric(difficulty);
            case 'fibonacci':
                return this.generateFibonacci(difficulty);
            case 'arithmetic':
            default:
                return this.generateArithmetic(difficulty);
        }
    }

    /**
     * Check if answer is correct (with floating point tolerance)
     * @param {number} userAnswer - User's answer
     * @param {number} correctAnswer - Correct answer
     * @returns {boolean}
     */
    static checkAnswer(userAnswer, correctAnswer) {
        return Math.abs(userAnswer - correctAnswer) < 0.01;
    }
}

module.exports = ProblemGenerator;
