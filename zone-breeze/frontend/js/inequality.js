/**
 * Zone Breeze - Inequality Parser and Utilities
 */

const InequalityUtils = {
    /**
     * Parse inequality string to extract components
     * @param {string} inequality - Inequality string (e.g., "2x + 3y <= 6")
     * @returns {object} Parsed inequality components
     */
    parse(inequality) {
        // Remove spaces
        const cleaned = inequality.replace(/\s+/g, '');

        // Replace Unicode operators with ASCII
        const normalized = cleaned
            .replace(/≤/g, '<=')
            .replace(/≥/g, '>=')
            .replace(/＋/g, '+')
            .replace(/－/g, '-');

        // Pattern for ax + by operator c
        const pattern = /^([+-]?\d*\.?\d*)x([+-]\d*\.?\d*)y([<>=]+)([+-]?\d+\.?\d*)$/;
        const match = normalized.match(pattern);

        if (match) {
            let [, a, b, operator, c] = match;

            // Handle implicit coefficient of 1
            if (a === '' || a === '+') a = '1';
            if (a === '-') a = '-1';
            if (b === '' || b === '+') b = '1';
            if (b === '-') b = '-1';

            return {
                a: parseFloat(a),
                b: parseFloat(b),
                c: parseFloat(c),
                operator: operator,
                original: inequality
            };
        }

        // Pattern for simple inequalities (x >= 0 or y <= 5)
        const simplePattern = /^([xy])([<>=]+)([+-]?\d+\.?\d*)$/;
        const simpleMatch = normalized.match(simplePattern);

        if (simpleMatch) {
            const [, variable, operator, value] = simpleMatch;

            if (variable === 'x') {
                return {
                    a: 1,
                    b: 0,
                    c: parseFloat(value),
                    operator: operator,
                    original: inequality
                };
            } else {
                return {
                    a: 0,
                    b: 1,
                    c: parseFloat(value),
                    operator: operator,
                    original: inequality
                };
            }
        }

        throw new Error('Invalid inequality format: ' + inequality);
    },

    /**
     * Check if a point satisfies an inequality
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} parsed - Parsed inequality object
     * @returns {boolean} True if point satisfies inequality
     */
    satisfies(x, y, parsed) {
        const value = parsed.a * x + parsed.b * y;
        const c = parsed.c;

        switch (parsed.operator) {
            case '<':
                return value < c;
            case '<=':
                return value <= c;
            case '>':
                return value > c;
            case '>=':
                return value >= c;
            case '=':
            case '==':
                return Math.abs(value - c) < 0.01;
            default:
                return false;
        }
    },

    /**
     * Format inequality for display
     * @param {string} inequality - Inequality string
     * @returns {string} Formatted inequality
     */
    format(inequality) {
        return inequality
            .replace(/\*/g, '·')
            .replace(/<=/g, '≤')
            .replace(/>=/g, '≥');
    },

    /**
     * Get line equation from inequality (y = mx + b form)
     * @param {object} parsed - Parsed inequality object
     * @returns {object} Line equation {slope, intercept}
     */
    getLineEquation(parsed) {
        if (parsed.b === 0) {
            // Vertical line: x = c/a
            return {
                isVertical: true,
                x: parsed.c / parsed.a
            };
        }

        // y = (-a/b)x + (c/b)
        return {
            isVertical: false,
            slope: -parsed.a / parsed.b,
            intercept: parsed.c / parsed.b
        };
    },

    /**
     * Calculate Y value from X on the line
     * @param {number} x - X coordinate
     * @param {object} lineEq - Line equation
     * @returns {number} Y coordinate
     */
    calculateY(x, lineEq) {
        if (lineEq.isVertical) {
            return null; // Cannot calculate Y for vertical line
        }
        return lineEq.slope * x + lineEq.intercept;
    },

    /**
     * Get all points that satisfy all inequalities
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {array} parsedInequalities - Array of parsed inequalities
     * @returns {boolean} True if point satisfies all
     */
    satisfiesAll(x, y, parsedInequalities) {
        return parsedInequalities.every(parsed => this.satisfies(x, y, parsed));
    },

    /**
     * Calculate "energy" level at a point
     * (How well it satisfies all inequalities)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {array} parsedInequalities - Array of parsed inequalities
     * @returns {number} Energy level (0.0 to 1.0)
     */
    calculateEnergy(x, y, parsedInequalities) {
        let totalSatisfaction = 0;
        let count = 0;

        for (const parsed of parsedInequalities) {
            const value = parsed.a * x + parsed.b * y;
            const threshold = parsed.c;

            let satisfaction = 0;

            switch (parsed.operator) {
                case '<':
                case '<=':
                    if (value <= threshold) {
                        // Calculate distance from boundary
                        const distance = threshold - value;
                        satisfaction = Math.min(1.0, distance / 5.0);
                    }
                    break;
                case '>':
                case '>=':
                    if (value >= threshold) {
                        const distance = value - threshold;
                        satisfaction = Math.min(1.0, distance / 5.0);
                    }
                    break;
            }

            totalSatisfaction += Math.max(0, satisfaction);
            count++;
        }

        return count > 0 ? totalSatisfaction / count : 0;
    },

    /**
     * Validate inequality syntax
     * @param {string} inequality - Inequality string
     * @returns {object} {valid: boolean, error: string}
     */
    validate(inequality) {
        try {
            this.parse(inequality);
            return { valid: true, error: null };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InequalityUtils;
}
