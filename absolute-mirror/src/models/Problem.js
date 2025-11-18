/**
 * Problem - 절댓값 방정식 문제 모델
 * Represents an absolute value equation problem
 */

export class Problem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || '';
        this.description = data.description || '';
        this.equation = data.equation || '';
        this.difficulty = data.difficulty || 'medium';
        this.gradeLevel = data.grade_level || data.gradeLevel || 7;

        // Parse equation to extract parameters
        this.params = this.parseEquation(this.equation);

        this.axis = data.axis || data.axis_of_symmetry || this.params.axis;
        this.target = data.target || data.target_value || this.params.target;

        this.solutions = data.solutions || this.calculateSolutions();
        this.explanation = data.explanation || '';

        this.metadata = {
            createdAt: data.created_at || data.createdAt || new Date(),
            updatedAt: data.updated_at || data.updatedAt || new Date(),
            moodleQuestionId: data.moodle_question_id || null,
            moodleCourseId: data.moodle_course_id || null
        };
    }

    /**
     * Parse equation string to extract parameters
     * Handles formats: |x - a| = b, |x + a| = b, |x| = b
     */
    parseEquation(equation) {
        if (!equation) {
            return { axis: 0, target: 0, valid: false };
        }

        // Pattern 1: |x - a| = b or |x + a| = b
        const pattern1 = /\|x\s*([+-])\s*(\d+(?:\.\d+)?)\|\s*=\s*(\d+(?:\.\d+)?)/;
        const match1 = equation.match(pattern1);

        if (match1) {
            const sign = match1[1];
            const offset = parseFloat(match1[2]);
            const target = parseFloat(match1[3]);

            // Calculate axis: for |x - 3|, axis = 3; for |x + 3|, axis = -3
            const axis = sign === '-' ? offset : -offset;

            return {
                axis,
                target,
                valid: true,
                format: 'standard'
            };
        }

        // Pattern 2: |x| = b
        const pattern2 = /\|x\|\s*=\s*(\d+(?:\.\d+)?)/;
        const match2 = equation.match(pattern2);

        if (match2) {
            return {
                axis: 0,
                target: parseFloat(match2[1]),
                valid: true,
                format: 'simple'
            };
        }

        // Invalid equation
        return {
            axis: 0,
            target: 0,
            valid: false,
            error: 'Invalid equation format'
        };
    }

    /**
     * Calculate solutions for the equation
     * For |x - a| = b, solutions are x = a + b and x = a - b
     */
    calculateSolutions() {
        return [
            this.axis - this.target,  // Left solution
            this.axis + this.target   // Right solution
        ].sort((a, b) => a - b);  // Sort ascending
    }

    /**
     * Verify if a proposed answer is correct
     */
    verifySolution(answer, tolerance = 0.01) {
        const normalizedAnswer = typeof answer === 'number' ? answer : parseFloat(answer);

        if (isNaN(normalizedAnswer)) {
            return false;
        }

        return this.solutions.some(solution =>
            Math.abs(normalizedAnswer - solution) < tolerance
        );
    }

    /**
     * Verify if multiple answers include both solutions
     */
    verifyCompleteSolution(answers, tolerance = 0.01) {
        if (!Array.isArray(answers) || answers.length !== 2) {
            return false;
        }

        const normalizedAnswers = answers.map(a => parseFloat(a)).sort((a, b) => a - b);

        return this.solutions.every((solution, index) =>
            Math.abs(normalizedAnswers[index] - solution) < tolerance
        );
    }

    /**
     * Calculate absolute value for given x
     */
    calculateAbsoluteValue(x) {
        return Math.abs(x - this.axis);
    }

    /**
     * Get distance from x to nearest solution
     */
    getDistanceToSolution(x) {
        const distances = this.solutions.map(sol => Math.abs(x - sol));
        return Math.min(...distances);
    }

    /**
     * Check if x is close to a solution
     */
    isNearSolution(x, threshold = 0.5) {
        return this.getDistanceToSolution(x) < threshold;
    }

    /**
     * Get hint based on current x value
     */
    getHint(currentX) {
        const absValue = this.calculateAbsoluteValue(currentX);
        const distance = this.getDistanceToSolution(currentX);

        if (distance < 0.5) {
            return '매우 가까워요! 조금만 더 조정해보세요.';
        } else if (absValue < this.target) {
            return `절댓값이 ${absValue.toFixed(1)}입니다. ${this.target}에 도달해야 합니다.`;
        } else if (absValue > this.target) {
            return `절댓값이 ${absValue.toFixed(1)}입니다. ${this.target}보다 작아야 합니다.`;
        } else {
            return '정답입니다!';
        }
    }

    /**
     * Get x range for visualization
     */
    getVisualizationRange() {
        const padding = Math.max(this.target * 1.5, 5);
        return {
            min: this.axis - padding,
            max: this.axis + padding
        };
    }

    /**
     * Convert to plain object
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            equation: this.equation,
            axis: this.axis,
            target: this.target,
            solutions: this.solutions,
            difficulty: this.difficulty,
            gradeLevel: this.gradeLevel,
            explanation: this.explanation,
            metadata: this.metadata
        };
    }

    /**
     * Create from API response
     */
    static fromAPI(data) {
        return new Problem(data);
    }

    /**
     * Validate problem data
     */
    static validate(data) {
        const errors = [];

        if (!data.equation) {
            errors.push('Equation is required');
        }

        if (data.equation) {
            const problem = new Problem(data);
            if (!problem.params.valid) {
                errors.push('Invalid equation format');
            }
        }

        if (data.difficulty && !['easy', 'medium', 'hard'].includes(data.difficulty)) {
            errors.push('Invalid difficulty level');
        }

        if (data.gradeLevel && (data.gradeLevel < 1 || data.gradeLevel > 12)) {
            errors.push('Grade level must be between 1 and 12');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
