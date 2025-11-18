/**
 * Dual Derivative Sync Engine
 * Handles synchronized visualization of function and its derivative
 */

class DerivativeSync {
    constructor(mathEngine) {
        this.mathEngine = mathEngine;
        this.originalChart = null;
        this.derivativeChart = null;
        this.currentX = 0;
        this.xMin = -5;
        this.xMax = 5;
        this.animationId = null;
        this.isPlaying = false;
        this.animationSpeed = 0.05;
        this.currentFunction = 'x^2';

        // Chart colors
        this.colors = {
            original: 'rgb(102, 126, 234)',
            derivative: 'rgb(237, 137, 54)',
            current: 'rgb(239, 68, 68)',
            tangent: 'rgb(72, 187, 120)'
        };
    }

    /**
     * Initialize both charts
     */
    initialize() {
        this.initializeOriginalChart();
        this.initializeDerivativeChart();
        this.updateCharts();
    }

    /**
     * Initialize the original function chart
     */
    initializeOriginalChart() {
        const ctx = document.getElementById('original-chart');
        if (!ctx) return;

        this.originalChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'f(x)',
                        data: [],
                        borderColor: this.colors.original,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: '현재 점 (Current Point)',
                        data: [],
                        borderColor: this.colors.current,
                        backgroundColor: this.colors.current,
                        borderWidth: 3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        showLine: false
                    },
                    {
                        label: '접선 (Tangent)',
                        data: [],
                        borderColor: this.colors.tangent,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 200
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 10
                            },
                            boxWidth: 15
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'x',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'f(x)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Initialize the derivative chart
     */
    initializeDerivativeChart() {
        const ctx = document.getElementById('derivative-chart');
        if (!ctx) return;

        this.derivativeChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: "f'(x)",
                        data: [],
                        borderColor: this.colors.derivative,
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: '현재 점 (Current Point)',
                        data: [],
                        borderColor: this.colors.current,
                        backgroundColor: this.colors.current,
                        borderWidth: 3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        showLine: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 200
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 10
                            },
                            boxWidth: 15
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'x',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "f'(x)",
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Update both charts with current function
     */
    updateCharts() {
        if (!this.originalChart || !this.derivativeChart) {
            console.error('Charts not initialized');
            return;
        }

        // Generate data points
        const originalPoints = this.mathEngine.generatePoints(
            this.currentFunction,
            this.xMin,
            this.xMax,
            100
        );

        const derivativePoints = this.mathEngine.generateDerivativePoints(
            this.currentFunction,
            this.xMin,
            this.xMax,
            100
        );

        // Update original chart
        this.originalChart.data.datasets[0].data = originalPoints;

        // Update derivative chart
        this.derivativeChart.data.datasets[0].data = derivativePoints;

        // Update current point markers
        this.updateCurrentPoint();

        // Update charts
        this.originalChart.update('none');
        this.derivativeChart.update('none');
    }

    /**
     * Update the current point marker on both charts
     */
    updateCurrentPoint() {
        const fx = this.mathEngine.evaluate(this.currentFunction, this.currentX);
        const fpx = this.mathEngine.derivative(this.currentFunction, this.currentX);

        // Update current point on original chart
        this.originalChart.data.datasets[1].data = [{ x: this.currentX, y: fx }];

        // Update tangent line
        const tangent = this.mathEngine.getTangentLine(this.currentFunction, this.currentX);
        const tangentPoints = [];
        const tangentRange = 2;
        for (let x = this.currentX - tangentRange; x <= this.currentX + tangentRange; x += 0.5) {
            tangentPoints.push({ x: x, y: tangent.evaluate(x) });
        }
        this.originalChart.data.datasets[2].data = tangentPoints;

        // Update current point on derivative chart
        this.derivativeChart.data.datasets[1].data = [{ x: this.currentX, y: fpx }];

        // Update display values
        this.updateDisplayValues(this.currentX, fx, fpx, tangent.slope);
    }

    /**
     * Update the current values display
     */
    updateDisplayValues(x, fx, fpx, slope) {
        document.getElementById('current-x').textContent = this.mathEngine.formatNumber(x);
        document.getElementById('current-fx').textContent = this.mathEngine.formatNumber(fx);
        document.getElementById('current-fpx').textContent = this.mathEngine.formatNumber(fpx);
        document.getElementById('current-slope').textContent = this.mathEngine.formatNumber(slope);
    }

    /**
     * Set current X value
     * @param {number} x - X value
     */
    setCurrentX(x) {
        this.currentX = parseFloat(x);
        this.updateCurrentPoint();
        if (this.originalChart && this.derivativeChart) {
            this.originalChart.update('none');
            this.derivativeChart.update('none');
        }
    }

    /**
     * Set current function
     * @param {string} func - Function expression
     */
    setFunction(func) {
        const validation = this.mathEngine.validateExpression(func);
        if (!validation.valid) {
            console.error('Invalid function:', validation.error);
            return false;
        }

        this.currentFunction = func;
        this.updateCharts();
        return true;
    }

    /**
     * Start animation
     */
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.animate();
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.pause();
        this.currentX = this.xMin;
        this.setCurrentX(this.currentX);
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isPlaying) return;

        this.currentX += this.animationSpeed;

        if (this.currentX > this.xMax) {
            this.currentX = this.xMin;
        }

        this.setCurrentX(this.currentX);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Set animation speed
     * @param {number} speed - Speed multiplier (1-10)
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = 0.01 * speed;
    }

    /**
     * Set x range
     * @param {number} min - Minimum x value
     * @param {number} max - Maximum x value
     */
    setXRange(min, max) {
        this.xMin = min;
        this.xMax = max;
        this.updateCharts();
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentX: this.currentX,
            currentFunction: this.currentFunction,
            isPlaying: this.isPlaying,
            xMin: this.xMin,
            xMax: this.xMax,
            fx: this.mathEngine.evaluate(this.currentFunction, this.currentX),
            fpx: this.mathEngine.derivative(this.currentFunction, this.currentX)
        };
    }

    /**
     * Destroy charts and clean up
     */
    destroy() {
        this.pause();
        if (this.originalChart) {
            this.originalChart.destroy();
        }
        if (this.derivativeChart) {
            this.derivativeChart.destroy();
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DerivativeSync;
}
