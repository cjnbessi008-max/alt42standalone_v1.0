/**
 * math-functions.js
 * Mathematical function definitions and utilities
 */

class MathFunctions {
    /**
     * Predefined mathematical functions
     */
    static functions = {
        x2: {
            name: 'f(x) = x²',
            fn: (x) => x * x,
            derivative: (x) => 2 * x,
            domain: { min: -10, max: 10 },
            range: { min: -5, max: 100 }
        },
        x3: {
            name: 'f(x) = x³',
            fn: (x) => x * x * x,
            derivative: (x) => 3 * x * x,
            domain: { min: -5, max: 5 },
            range: { min: -125, max: 125 }
        },
        sin: {
            name: 'f(x) = sin(x)',
            fn: (x) => Math.sin(x),
            derivative: (x) => Math.cos(x),
            domain: { min: -2 * Math.PI, max: 2 * Math.PI },
            range: { min: -1.5, max: 1.5 }
        },
        exp: {
            name: 'f(x) = eˣ',
            fn: (x) => Math.exp(x),
            derivative: (x) => Math.exp(x),
            domain: { min: -3, max: 3 },
            range: { min: 0, max: 20 }
        }
    };

    /**
     * Evaluate a custom function string
     * @param {string} expr - Expression like "x * x + 2 * x + 1"
     * @param {number} x - Input value
     * @returns {number} - Result
     */
    static evaluateCustom(expr, x) {
        try {
            // Security: Only allow safe mathematical operations
            const safeExpr = expr
                .replace(/\^/g, '**')  // Convert ^ to **
                .replace(/[^0-9x+\-*/().\s]/gi, '');  // Remove unsafe characters

            // Create function from expression
            const fn = new Function('x', `return ${safeExpr}`);
            return fn(x);
        } catch (error) {
            console.error('Invalid function expression:', error);
            return NaN;
        }
    }

    /**
     * Calculate secant line slope between two points
     * @param {Object} point1 - {x, y}
     * @param {Object} point2 - {x, y}
     * @returns {number} - Slope (average rate of change)
     */
    static calculateSlope(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;

        if (Math.abs(dx) < 0.0001) {
            return Infinity;  // Vertical line
        }

        return dy / dx;
    }

    /**
     * Get secant line equation in the form y = mx + b
     * @param {Object} point1 - {x, y}
     * @param {Object} point2 - {x, y}
     * @returns {Object} - {m: slope, b: intercept, equation: string}
     */
    static getSecantEquation(point1, point2) {
        const m = this.calculateSlope(point1, point2);

        if (!isFinite(m)) {
            return {
                m: Infinity,
                b: null,
                equation: `x = ${point1.x.toFixed(2)}`
            };
        }

        // y - y1 = m(x - x1)
        // y = mx - mx1 + y1
        const b = point1.y - m * point1.x;

        // Format equation
        const mStr = m >= 0 ? m.toFixed(3) : `(${m.toFixed(3)})`;
        const bStr = b >= 0 ? ` + ${b.toFixed(3)}` : ` - ${Math.abs(b).toFixed(3)}`;
        const equation = `y = ${mStr}x${bStr}`;

        return { m, b, equation };
    }

    /**
     * Calculate points on secant line for rendering
     * @param {Object} point1 - {x, y}
     * @param {Object} point2 - {x, y}
     * @param {number} extension - How far to extend beyond points (in graph units)
     * @returns {Array} - [{x, y}, {x, y}] - Start and end points of extended line
     */
    static getSecantLinePoints(point1, point2, extension = 2) {
        const { m, b } = this.getSecantEquation(point1, point2);

        if (!isFinite(m)) {
            // Vertical line
            return [
                { x: point1.x, y: Math.min(point1.y, point2.y) - extension },
                { x: point1.x, y: Math.max(point1.y, point2.y) + extension }
            ];
        }

        // Extend line in both directions
        const minX = Math.min(point1.x, point2.x) - extension;
        const maxX = Math.max(point1.x, point2.x) + extension;

        return [
            { x: minX, y: m * minX + b },
            { x: maxX, y: m * maxX + b }
        ];
    }

    /**
     * Format number for display
     * @param {number} num - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted string
     */
    static formatNumber(num, decimals = 3) {
        if (!isFinite(num)) {
            return '∞';
        }
        return num.toFixed(decimals);
    }

    /**
     * Generate points for plotting a function
     * @param {Function} fn - Function to plot
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} steps - Number of points to generate
     * @returns {Array} - [{x, y}, ...]
     */
    static generateFunctionPoints(fn, xMin, xMax, steps = 200) {
        const points = [];
        const dx = (xMax - xMin) / steps;

        for (let i = 0; i <= steps; i++) {
            const x = xMin + i * dx;
            const y = fn(x);

            if (isFinite(y)) {
                points.push({ x, y });
            } else {
                // Break line at discontinuities
                if (points.length > 0) {
                    points.push(null);
                }
            }
        }

        return points;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathFunctions;
}
