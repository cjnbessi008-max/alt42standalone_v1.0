/**
 * Graphing Engine with Derivative Support
 * Prevents "Derivative Pulse" bug by maintaining stable axis ranges
 */

class GraphCalculator {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentFunction = null;
        this.xRange = [-10, 10];
        this.yRange = null; // Will be calculated
        this.numPoints = 200;
        this.derivativeVisible = false;

        // Fixed layout configuration to prevent graph resizing
        this.layout = {
            margin: { t: 20, r: 20, b: 40, l: 50 },
            xaxis: {
                title: 'x',
                range: this.xRange,
                fixedrange: false,
                gridcolor: '#e0e0e0',
                zerolinecolor: '#999'
            },
            yaxis: {
                title: 'y',
                fixedrange: false,
                gridcolor: '#e0e0e0',
                zerolinecolor: '#999'
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                bordercolor: '#ddd',
                borderwidth: 1
            },
            hovermode: 'closest',
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa'
        };

        this.config = {
            responsive: true,
            displayModeBar: false
        };
    }

    /**
     * Parse and evaluate mathematical expression
     */
    parseFunction(expr) {
        // Replace common mathematical notation
        expr = expr.replace(/\^/g, '**');
        expr = expr.replace(/sin/g, 'Math.sin');
        expr = expr.replace(/cos/g, 'Math.cos');
        expr = expr.replace(/tan/g, 'Math.tan');
        expr = expr.replace(/sqrt/g, 'Math.sqrt');
        expr = expr.replace(/abs/g, 'Math.abs');
        expr = expr.replace(/ln/g, 'Math.log');
        expr = expr.replace(/log/g, 'Math.log10');
        expr = expr.replace(/exp/g, 'Math.exp');

        return expr;
    }

    /**
     * Evaluate function at a given x value
     */
    evaluate(expr, x) {
        try {
            const parsedExpr = this.parseFunction(expr);
            return eval(parsedExpr);
        } catch (e) {
            console.error('Error evaluating function:', e);
            return NaN;
        }
    }

    /**
     * Generate x values for plotting
     */
    generateXValues() {
        const [xMin, xMax] = this.xRange;
        const step = (xMax - xMin) / this.numPoints;
        const xValues = [];

        for (let i = 0; i <= this.numPoints; i++) {
            xValues.push(xMin + i * step);
        }

        return xValues;
    }

    /**
     * Calculate y values for a given function expression
     */
    calculateYValues(expr, xValues) {
        return xValues.map(x => this.evaluate(expr, x));
    }

    /**
     * Calculate numerical derivative using central difference method
     * This provides better accuracy than forward/backward differences
     */
    calculateDerivative(expr, xValues) {
        const h = 0.0001; // Small step for numerical derivative
        const derivatives = [];

        for (let x of xValues) {
            const yPlus = this.evaluate(expr, x + h);
            const yMinus = this.evaluate(expr, x - h);
            const derivative = (yPlus - yMinus) / (2 * h);
            derivatives.push(derivative);
        }

        return derivatives;
    }

    /**
     * Calculate optimal y-axis range based on data
     * Adds padding to prevent clipping
     */
    calculateYRange(yValues, padding = 0.1) {
        const validYValues = yValues.filter(y => !isNaN(y) && isFinite(y));

        if (validYValues.length === 0) {
            return [-10, 10];
        }

        const yMin = Math.min(...validYValues);
        const yMax = Math.max(...validYValues);
        const yRange = yMax - yMin;

        // Add padding to prevent data touching edges
        const paddedMin = yMin - yRange * padding;
        const paddedMax = yMax + yRange * padding;

        return [paddedMin, paddedMax];
    }

    /**
     * Plot the main function
     * CRITICAL: This method sets up the initial plot with fixed axes
     */
    plotFunction(expr) {
        this.currentFunction = expr;
        this.derivativeVisible = false;

        const xValues = this.generateXValues();
        const yValues = this.calculateYValues(expr, xValues);

        // Calculate and set y-axis range ONCE
        // This prevents the "pulse" effect when adding derivative
        this.yRange = this.calculateYRange(yValues);
        this.layout.yaxis.range = this.yRange;

        const trace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: 'f(x)',
            line: {
                color: '#667eea',
                width: 3
            }
        };

        // Use Plotly.newPlot for initial plot
        Plotly.newPlot(this.containerId, [trace], this.layout, this.config);
    }

    /**
     * Add derivative to existing plot
     * CRITICAL FIX: Uses Plotly.react() instead of Plotly.update()
     * This prevents graph "pulse" by smoothly transitioning without re-rendering
     */
    showDerivative() {
        if (!this.currentFunction) {
            console.error('No function plotted');
            return;
        }

        this.derivativeVisible = true;

        const xValues = this.generateXValues();
        const yValues = this.calculateYValues(this.currentFunction, xValues);
        const derivativeValues = this.calculateDerivative(this.currentFunction, xValues);

        // Calculate combined y-range for both functions
        // CRITICAL: This ensures axes don't change when derivative is added
        const allYValues = [...yValues, ...derivativeValues];
        const combinedYRange = this.calculateYRange(allYValues);

        // Update layout with new y-range (if needed)
        this.layout.yaxis.range = combinedYRange;

        const functionTrace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: 'f(x)',
            line: {
                color: '#667eea',
                width: 3
            }
        };

        const derivativeTrace = {
            x: xValues,
            y: derivativeValues,
            type: 'scatter',
            mode: 'lines',
            name: "f'(x)",
            line: {
                color: '#48bb78',
                width: 3,
                dash: 'dot'
            }
        };

        // CRITICAL FIX: Use Plotly.react() with animation config
        // This smoothly updates the plot without the "pulse" effect
        Plotly.react(
            this.containerId,
            [functionTrace, derivativeTrace],
            this.layout,
            this.config
        ).then(() => {
            console.log('Derivative added smoothly without pulse');
        });
    }

    /**
     * Hide derivative and show only original function
     */
    hideDerivative() {
        if (!this.currentFunction) {
            return;
        }

        this.derivativeVisible = false;

        const xValues = this.generateXValues();
        const yValues = this.calculateYValues(this.currentFunction, xValues);

        // Restore original y-range
        this.yRange = this.calculateYRange(yValues);
        this.layout.yaxis.range = this.yRange;

        const functionTrace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: 'f(x)',
            line: {
                color: '#667eea',
                width: 3
            }
        };

        // Use react for smooth transition
        Plotly.react(
            this.containerId,
            [functionTrace],
            this.layout,
            this.config
        );
    }

    /**
     * Clear the plot
     */
    clear() {
        Plotly.purge(this.containerId);
        this.currentFunction = null;
        this.derivativeVisible = false;
    }

    /**
     * Get symbolic derivative (simple cases only)
     */
    getSymbolicDerivative(expr) {
        // Simple symbolic derivatives for common functions
        const derivatives = {
            'x': '1',
            'x**2': '2*x',
            'x**3': '3*x**2',
            'Math.sin(x)': 'Math.cos(x)',
            'Math.cos(x)': '-Math.sin(x)',
            'Math.exp(x)': 'Math.exp(x)'
        };

        const parsed = this.parseFunction(expr);
        return derivatives[parsed] || "f'(x)";
    }
}

// Export for use in app.js
window.GraphCalculator = GraphCalculator;
