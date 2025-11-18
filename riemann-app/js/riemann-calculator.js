/**
 * Riemann Sum Calculator
 * Handles mathematical calculations for Riemann sums
 */

class RiemannCalculator {
    constructor() {
        this.currentFunction = null;
        this.a = 0; // Lower bound
        this.b = 2; // Upper bound
        this.n = 5; // Number of subdivisions
        this.type = 'midpoint'; // left, right, midpoint, trapezoid
    }

    /**
     * Set the function to integrate
     * @param {Function} func - The function f(x)
     * @param {string} displayText - Display text for the function
     */
    setFunction(func, displayText) {
        this.currentFunction = func;
        this.displayText = displayText || 'f(x)';
    }

    /**
     * Set the integration interval
     * @param {number} a - Lower bound
     * @param {number} b - Upper bound
     */
    setInterval(a, b) {
        this.a = a;
        this.b = b;
    }

    /**
     * Set the number of subdivisions
     * @param {number} n - Number of subdivisions
     */
    setSubdivisions(n) {
        this.n = Math.max(1, Math.floor(n));
    }

    /**
     * Set the Riemann sum type
     * @param {string} type - 'left', 'right', 'midpoint', or 'trapezoid'
     */
    setType(type) {
        this.type = type;
    }

    /**
     * Calculate the width of each rectangle
     * @returns {number} Delta x
     */
    getDeltaX() {
        return (this.b - this.a) / this.n;
    }

    /**
     * Calculate the Riemann sum
     * @returns {number} The approximate integral value
     */
    calculateRiemannSum() {
        if (!this.currentFunction) return 0;

        const dx = this.getDeltaX();
        let sum = 0;

        switch (this.type) {
            case 'left':
                for (let i = 0; i < this.n; i++) {
                    const x = this.a + i * dx;
                    sum += this.currentFunction(x) * dx;
                }
                break;

            case 'right':
                for (let i = 1; i <= this.n; i++) {
                    const x = this.a + i * dx;
                    sum += this.currentFunction(x) * dx;
                }
                break;

            case 'midpoint':
                for (let i = 0; i < this.n; i++) {
                    const x = this.a + (i + 0.5) * dx;
                    sum += this.currentFunction(x) * dx;
                }
                break;

            case 'trapezoid':
                sum = (this.currentFunction(this.a) + this.currentFunction(this.b)) / 2;
                for (let i = 1; i < this.n; i++) {
                    const x = this.a + i * dx;
                    sum += this.currentFunction(x);
                }
                sum *= dx;
                break;
        }

        return sum;
    }

    /**
     * Get rectangle data for visualization
     * @returns {Array} Array of rectangle objects {x, y, width, height}
     */
    getRectangles() {
        if (!this.currentFunction) return [];

        const dx = this.getDeltaX();
        const rectangles = [];

        for (let i = 0; i < this.n; i++) {
            let x, height;

            switch (this.type) {
                case 'left':
                    x = this.a + i * dx;
                    height = this.currentFunction(x);
                    break;

                case 'right':
                    x = this.a + (i + 1) * dx;
                    height = this.currentFunction(x);
                    break;

                case 'midpoint':
                    x = this.a + (i + 0.5) * dx;
                    height = this.currentFunction(x);
                    break;

                case 'trapezoid':
                    const x1 = this.a + i * dx;
                    const x2 = this.a + (i + 1) * dx;
                    x = (x1 + x2) / 2;
                    height = (this.currentFunction(x1) + this.currentFunction(x2)) / 2;
                    break;
            }

            rectangles.push({
                x: this.a + i * dx,
                height: height,
                width: dx,
                samplePoint: x
            });
        }

        return rectangles;
    }

    /**
     * Get points for drawing the function curve
     * @param {number} numPoints - Number of points to calculate
     * @returns {Array} Array of {x, y} points
     */
    getFunctionPoints(numPoints = 200) {
        if (!this.currentFunction) return [];

        const points = [];
        const dx = (this.b - this.a) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            const x = this.a + i * dx;
            const y = this.currentFunction(x);
            points.push({ x, y });
        }

        return points;
    }

    /**
     * Calculate the exact integral (for known functions)
     * @returns {number} The exact integral value
     */
    calculateExactIntegral() {
        // For demonstration, we'll calculate for x² over [0, 2]
        // In a real app, this would be more sophisticated or use numerical integration
        if (this.displayText === 'f(x) = x²') {
            // Integral of x² is x³/3
            return (Math.pow(this.b, 3) - Math.pow(this.a, 3)) / 3;
        }

        // For other functions, use high-precision numerical integration
        return this.numericalIntegration(1000);
    }

    /**
     * High-precision numerical integration using Simpson's rule
     * @param {number} n - Number of subdivisions (must be even)
     * @returns {number} Approximate integral value
     */
    numericalIntegration(n = 1000) {
        if (!this.currentFunction) return 0;

        n = Math.floor(n / 2) * 2; // Ensure n is even
        const h = (this.b - this.a) / n;
        let sum = this.currentFunction(this.a) + this.currentFunction(this.b);

        for (let i = 1; i < n; i++) {
            const x = this.a + i * h;
            const coefficient = (i % 2 === 0) ? 2 : 4;
            sum += coefficient * this.currentFunction(x);
        }

        return (h / 3) * sum;
    }

    /**
     * Get the maximum function value in the interval (for scaling)
     * @returns {number} Maximum y value
     */
    getMaxValue() {
        if (!this.currentFunction) return 1;

        const points = this.getFunctionPoints(100);
        return Math.max(...points.map(p => p.y), 0);
    }

    /**
     * Get the minimum function value in the interval (for scaling)
     * @returns {number} Minimum y value
     */
    getMinValue() {
        if (!this.currentFunction) return 0;

        const points = this.getFunctionPoints(100);
        return Math.min(...points.map(p => p.y), 0);
    }
}
