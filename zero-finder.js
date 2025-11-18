/**
 * Zero Finder - Finds roots (zeros) of mathematical functions
 * Uses a combination of bisection method and Newton's method
 */

class ZeroFinder {
    constructor(mathParser) {
        this.parser = mathParser;
        this.tolerance = 0.0001;
        this.maxIterations = 100;
    }

    /**
     * Find all zeros of a function within a range
     * @param {string} expression - The mathematical expression
     * @param {number} min - Minimum x value
     * @param {number} max - Maximum x value
     * @returns {Array} - Array of zero objects {x, y}
     */
    findZeros(expression, min, max) {
        const zeros = [];
        const step = 0.1; // Scan step size

        // Scan the range to find sign changes
        let prevX = min;
        let prevY = this.parser.evaluate(expression, min);

        for (let x = min + step; x <= max; x += step) {
            const y = this.parser.evaluate(expression, x);

            // Check for sign change (potential zero crossing)
            if (!isNaN(y) && !isNaN(prevY) && isFinite(y) && isFinite(prevY)) {
                if (prevY * y < 0) {
                    // Sign change detected, refine the zero
                    const zero = this.bisectionMethod(expression, prevX, x);
                    if (zero !== null) {
                        // Check if this zero is not too close to existing zeros
                        if (!this.isDuplicate(zeros, zero.x)) {
                            zeros.push(zero);
                        }
                    }
                } else if (Math.abs(y) < this.tolerance) {
                    // Very close to zero
                    if (!this.isDuplicate(zeros, x)) {
                        zeros.push({ x: x, y: y });
                    }
                }
            }

            prevX = x;
            prevY = y;
        }

        // Refine zeros using Newton's method
        const refinedZeros = zeros.map(zero => this.newtonMethod(expression, zero.x));

        return refinedZeros.filter(zero => zero !== null);
    }

    /**
     * Bisection method to find a zero between two points
     * @param {string} expression - The mathematical expression
     * @param {number} a - Left boundary
     * @param {number} b - Right boundary
     * @returns {Object|null} - Zero object {x, y} or null
     */
    bisectionMethod(expression, a, b) {
        let left = a;
        let right = b;
        let iterations = 0;

        while (iterations < this.maxIterations) {
            const mid = (left + right) / 2;
            const y = this.parser.evaluate(expression, mid);

            if (Math.abs(y) < this.tolerance || Math.abs(right - left) < this.tolerance) {
                return { x: mid, y: y };
            }

            const yLeft = this.parser.evaluate(expression, left);

            if (yLeft * y < 0) {
                right = mid;
            } else {
                left = mid;
            }

            iterations++;
        }

        return null;
    }

    /**
     * Newton's method to refine a zero
     * @param {string} expression - The mathematical expression
     * @param {number} x0 - Initial guess
     * @returns {Object|null} - Refined zero object {x, y} or null
     */
    newtonMethod(expression, x0) {
        let x = x0;
        let iterations = 0;

        while (iterations < this.maxIterations) {
            const y = this.parser.evaluate(expression, x);
            const dy = this.parser.derivative(expression, x);

            if (Math.abs(y) < this.tolerance) {
                return { x: x, y: y };
            }

            if (Math.abs(dy) < 0.00001) {
                // Derivative too small, can't continue
                return { x: x, y: y };
            }

            x = x - y / dy;
            iterations++;
        }

        const finalY = this.parser.evaluate(expression, x);
        if (Math.abs(finalY) < this.tolerance * 10) {
            return { x: x, y: finalY };
        }

        return null;
    }

    /**
     * Check if a zero is a duplicate (too close to existing zeros)
     * @param {Array} zeros - Array of existing zeros
     * @param {number} x - X coordinate to check
     * @returns {boolean} - True if duplicate, false otherwise
     */
    isDuplicate(zeros, x) {
        const minDistance = 0.05;
        return zeros.some(zero => Math.abs(zero.x - x) < minDistance);
    }

    /**
     * Format a zero for display
     * @param {Object} zero - Zero object {x, y}
     * @returns {string} - Formatted string
     */
    formatZero(zero) {
        return `x = ${zero.x.toFixed(4)}`;
    }
}

// Create a global instance
const zeroFinder = new ZeroFinder(mathParser);
