/**
 * Slope Sound - Math Engine
 * Handles function evaluation and derivative calculation
 */

class MathEngine {
    constructor() {
        this.epsilon = 0.0001; // For numerical derivative
    }

    /**
     * Parse and evaluate mathematical expression
     * @param {string} expression - Math expression (e.g., 'x^2', 'sin(x)')
     * @param {number} x - Input value
     * @returns {number} - Result
     */
    evaluate(expression, x) {
        try {
            // Replace mathematical notation with JavaScript
            let jsExpression = expression
                .replace(/\^/g, '**')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/exp/g, 'Math.exp')
                .replace(/log/g, 'Math.log')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs');

            // Create function and evaluate
            const func = new Function('x', `return ${jsExpression}`);
            return func(x);
        } catch (error) {
            console.error('Error evaluating expression:', error);
            return NaN;
        }
    }

    /**
     * Calculate derivative using numerical differentiation
     * f'(x) ≈ (f(x + ε) - f(x - ε)) / (2ε)
     * @param {string} expression - Math expression
     * @param {number} x - Point to calculate derivative
     * @returns {number} - Derivative value
     */
    derivative(expression, x) {
        const f_plus = this.evaluate(expression, x + this.epsilon);
        const f_minus = this.evaluate(expression, x - this.epsilon);

        const slope = (f_plus - f_minus) / (2 * this.epsilon);

        return slope;
    }

    /**
     * Get analytical derivative expression (for display purposes)
     * @param {string} expression - Original expression
     * @returns {string} - Derivative expression
     */
    getDerivativeExpression(expression) {
        // Simple pattern matching for common functions
        const patterns = {
            'x^2': '2*x',
            'x^3': '3*x^2',
            'x^4': '4*x^3',
            'sin(x)': 'cos(x)',
            'cos(x)': '-sin(x)',
            'exp(x)': 'exp(x)',
            'exp(x/2)': '0.5*exp(x/2)'
        };

        return patterns[expression] || "f'(x)";
    }

    /**
     * Generate points for plotting
     * @param {string} expression - Math expression
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} numPoints - Number of points to generate
     * @returns {Array} - Array of {x, y} points
     */
    generatePoints(expression, xMin, xMax, numPoints = 200) {
        const points = [];
        const step = (xMax - xMin) / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * step;
            const y = this.evaluate(expression, x);

            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Find y range for given x range
     * @param {Array} points - Array of {x, y} points
     * @returns {Object} - {min, max}
     */
    findYRange(points) {
        if (points.length === 0) {
            return { min: -10, max: 10 };
        }

        let min = Infinity;
        let max = -Infinity;

        points.forEach(point => {
            if (point.y < min) min = point.y;
            if (point.y > max) max = point.y;
        });

        // Add padding (10%)
        const padding = (max - min) * 0.1;
        return {
            min: min - padding,
            max: max + padding
        };
    }

    /**
     * Check if point is within function curve
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} expression - Function expression
     * @param {number} threshold - Distance threshold
     * @returns {boolean}
     */
    isNearCurve(x, y, expression, threshold = 0.5) {
        const actualY = this.evaluate(expression, x);
        return Math.abs(y - actualY) < threshold;
    }
}

// Export for use in other modules
window.MathEngine = MathEngine;
