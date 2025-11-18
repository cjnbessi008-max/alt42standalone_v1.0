/**
 * Inequality Parser and Solver
 * Parses and evaluates mathematical inequalities
 */

class InequalityParser {
    constructor() {
        this.operators = ['>=', '<=', '>', '<', '='];
    }

    /**
     * Parse an inequality string into components
     * @param {string} inequalityStr - e.g., "y > 2*x + 1"
     * @returns {Object} Parsed inequality object
     */
    parse(inequalityStr) {
        const trimmed = inequalityStr.replace(/\s+/g, '');

        // Find operator
        let operator = null;
        let operatorIndex = -1;

        for (const op of this.operators) {
            const idx = trimmed.indexOf(op);
            if (idx !== -1) {
                operator = op;
                operatorIndex = idx;
                break;
            }
        }

        if (!operator) {
            throw new Error(`No valid operator found in: ${inequalityStr}`);
        }

        const leftSide = trimmed.substring(0, operatorIndex);
        const rightSide = trimmed.substring(operatorIndex + operator.length);

        return {
            original: inequalityStr,
            operator: operator,
            leftSide: leftSide,
            rightSide: rightSide,
            evaluate: (x, y) => this.evaluate(leftSide, rightSide, operator, x, y)
        };
    }

    /**
     * Evaluate an inequality at point (x, y)
     * @param {string} left - Left side expression
     * @param {string} right - Right side expression
     * @param {string} operator - Comparison operator
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether the inequality is satisfied
     */
    evaluate(left, right, operator, x, y) {
        try {
            const leftValue = this.evaluateExpression(left, x, y);
            const rightValue = this.evaluateExpression(right, x, y);

            switch (operator) {
                case '>':
                    return leftValue > rightValue;
                case '<':
                    return leftValue < rightValue;
                case '>=':
                    return leftValue >= rightValue;
                case '<=':
                    return leftValue <= rightValue;
                case '=':
                    return Math.abs(leftValue - rightValue) < 0.001;
                default:
                    return false;
            }
        } catch (e) {
            console.error('Evaluation error:', e);
            return false;
        }
    }

    /**
     * Evaluate a mathematical expression
     * @param {string} expr - Expression string
     * @param {number} x - X value
     * @param {number} y - Y value
     * @returns {number} Result
     */
    evaluateExpression(expr, x, y) {
        // Replace variables
        let processed = expr.replace(/x/g, `(${x})`);
        processed = processed.replace(/y/g, `(${y})`);

        // Replace multiplication symbols
        processed = processed.replace(/\*/g, '*');

        // Safe evaluation using Function constructor
        // This is safer than eval() but still needs validation
        try {
            const func = new Function('return ' + processed);
            return func();
        } catch (e) {
            // Fallback: try to parse as simple expression
            return this.simpleEval(processed);
        }
    }

    /**
     * Simple expression evaluator (fallback)
     * @param {string} expr - Expression
     * @returns {number} Result
     */
    simpleEval(expr) {
        // Remove parentheses and evaluate
        expr = expr.replace(/[()]/g, '');

        // Handle basic operations
        const tokens = expr.split(/([+\-*/])/);
        let result = parseFloat(tokens[0]);

        for (let i = 1; i < tokens.length; i += 2) {
            const operator = tokens[i];
            const operand = parseFloat(tokens[i + 1]);

            switch (operator) {
                case '+':
                    result += operand;
                    break;
                case '-':
                    result -= operand;
                    break;
                case '*':
                    result *= operand;
                    break;
                case '/':
                    result /= operand;
                    break;
            }
        }

        return result;
    }

    /**
     * Parse multiple inequalities
     * @param {Array<string>} inequalities - Array of inequality strings
     * @returns {Array<Object>} Array of parsed inequalities
     */
    parseMultiple(inequalities) {
        return inequalities.map((ineq, index) => {
            try {
                const parsed = this.parse(ineq);
                parsed.id = index;
                parsed.color = this.getColorForIndex(index);
                return parsed;
            } catch (e) {
                console.error(`Error parsing inequality ${index}: ${ineq}`, e);
                return null;
            }
        }).filter(x => x !== null);
    }

    /**
     * Get a color for an inequality index
     * @param {number} index - Inequality index
     * @returns {string} RGB color string
     */
    getColorForIndex(index) {
        const colors = [
            [255, 99, 132],   // Red
            [54, 162, 235],   // Blue
            [255, 206, 86],   // Yellow
            [75, 192, 192],   // Teal
            [153, 102, 255],  // Purple
            [255, 159, 64],   // Orange
            [199, 199, 199],  // Grey
            [83, 102, 255],   // Indigo
            [255, 99, 255],   // Pink
            [99, 255, 132]    // Green
        ];

        return colors[index % colors.length];
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InequalityParser;
}
