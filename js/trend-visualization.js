/**
 * Trend Visualization Module with Glow Effects
 * Renders trend lines with dynamic glow highlighting
 */

class TrendVisualization {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.glowEnabled = true;
        this.glowIntensity = 'medium';

        this.options = {
            animationDuration: 1000,
            glowColor: {
                positive: 'rgba(76, 175, 80, 1)',
                negative: 'rgba(244, 67, 54, 1)',
                neutral: 'rgba(102, 126, 234, 1)'
            },
            ...options
        };
    }

    /**
     * Initialize Chart.js with Trend Glow plugin
     */
    initChart(data, labels) {
        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        const trend = this.detectTrend(data);
        const glowColor = this.getGlowColor(trend);

        // Configure Chart.js
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '학습 점수',
                    data: data,
                    borderColor: glowColor,
                    backgroundColor: this.createGradient(glowColor),
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: glowColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: glowColor,
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: this.options.animationDuration,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: glowColor,
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `점수: ${context.parsed.y}점`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 9
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            },
            plugins: [this.createGlowPlugin(trend)]
        };

        this.chart = new Chart(this.ctx, config);

        // Apply glow effect to canvas
        if (this.glowEnabled) {
            this.applyCanvasGlow(trend);
        }

        return this.chart;
    }

    /**
     * Create gradient for area fill
     */
    createGradient(color) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 220);
        const rgbaColor = color.replace('1)', '0.3)');
        gradient.addColorStop(0, rgbaColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
    }

    /**
     * Detect trend direction
     */
    detectTrend(data) {
        if (data.length < 3) return 'neutral';

        const recent = data.slice(-3);
        const earlier = data.slice(0, 3);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

        const diff = recentAvg - earlierAvg;

        if (diff > 5) return 'positive';
        if (diff < -5) return 'negative';
        return 'neutral';
    }

    /**
     * Get glow color based on trend
     */
    getGlowColor(trend) {
        switch (trend) {
            case 'positive':
                return this.options.glowColor.positive;
            case 'negative':
                return this.options.glowColor.negative;
            default:
                return this.options.glowColor.neutral;
        }
    }

    /**
     * Create custom glow plugin for Chart.js
     */
    createGlowPlugin(trend) {
        const self = this;

        return {
            id: 'trendGlow',
            beforeDraw: (chart) => {
                if (!self.glowEnabled) return;

                const ctx = chart.ctx;
                ctx.save();

                // Apply shadow for glow effect
                const glowColor = self.getGlowColor(trend);
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = self.getGlowBlur();
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            },
            afterDraw: (chart) => {
                if (!self.glowEnabled) return;
                chart.ctx.restore();
            }
        };
    }

    /**
     * Get glow blur intensity
     */
    getGlowBlur() {
        const intensities = {
            low: 8,
            medium: 12,
            high: 20
        };
        return intensities[this.glowIntensity] || intensities.medium;
    }

    /**
     * Apply glow effect to canvas container
     */
    applyCanvasGlow(trend) {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        if (!container) return;

        // Remove existing glow classes
        container.classList.remove(
            'trend-line-glow',
            'trend-line-glow-positive',
            'trend-line-glow-negative'
        );

        // Add appropriate glow class
        if (trend === 'positive') {
            container.classList.add('trend-line-glow-positive');
        } else if (trend === 'negative') {
            container.classList.add('trend-line-glow-negative');
        } else {
            container.classList.add('trend-line-glow');
        }
    }

    /**
     * Update chart data
     */
    updateChart(newData, newLabels) {
        if (!this.chart) {
            return this.initChart(newData, newLabels);
        }

        const trend = this.detectTrend(newData);
        const glowColor = this.getGlowColor(trend);

        this.chart.data.labels = newLabels;
        this.chart.data.datasets[0].data = newData;
        this.chart.data.datasets[0].borderColor = glowColor;
        this.chart.data.datasets[0].backgroundColor = this.createGradient(glowColor);
        this.chart.data.datasets[0].pointBackgroundColor = glowColor;
        this.chart.data.datasets[0].pointHoverBackgroundColor = glowColor;

        this.chart.update('active');

        if (this.glowEnabled) {
            this.applyCanvasGlow(trend);
        }

        return trend;
    }

    /**
     * Toggle glow effect
     */
    toggleGlow(enabled) {
        this.glowEnabled = enabled;

        const container = this.canvas?.parentElement;
        if (container) {
            if (enabled) {
                const data = this.chart?.data?.datasets[0]?.data || [];
                const trend = this.detectTrend(data);
                this.applyCanvasGlow(trend);
            } else {
                container.classList.remove(
                    'trend-line-glow',
                    'trend-line-glow-positive',
                    'trend-line-glow-negative',
                    'glow-disabled'
                );
                container.classList.add('glow-disabled');
            }
        }

        if (this.chart) {
            this.chart.update();
        }
    }

    /**
     * Set glow intensity
     */
    setGlowIntensity(level) {
        const validLevels = ['low', 'medium', 'high'];
        if (validLevels.includes(level)) {
            this.glowIntensity = level;
            if (this.chart) {
                this.chart.update();
            }
        }
    }

    /**
     * Get trend statistics
     */
    getTrendStats(data) {
        if (!data || data.length === 0) {
            return null;
        }

        const trend = this.detectTrend(data);
        const currentScore = data[data.length - 1];
        const averageScore = data.reduce((a, b) => a + b, 0) / data.length;
        const minScore = Math.min(...data);
        const maxScore = Math.max(...data);

        // Calculate velocity (rate of change)
        let velocity = 0;
        if (data.length > 1) {
            const changes = [];
            for (let i = 1; i < data.length; i++) {
                changes.push(data[i] - data[i - 1]);
            }
            velocity = changes.reduce((a, b) => a + b, 0) / changes.length;
        }

        // Calculate improvement
        const improvement = data.length > 1
            ? ((data[data.length - 1] - data[0]) / data[0]) * 100
            : 0;

        return {
            trend,
            currentScore: Math.round(currentScore),
            averageScore: Math.round(averageScore),
            minScore,
            maxScore,
            velocity: Math.round(velocity * 10) / 10,
            improvement: Math.round(improvement),
            dataPoints: data.length
        };
    }

    /**
     * Format labels for display
     */
    formatLabels(timestamps) {
        return timestamps.map(timestamp => {
            const date = new Date(timestamp);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
    }

    /**
     * Add animation effects
     */
    animateIn() {
        if (!this.canvas) return;

        this.canvas.style.opacity = '0';
        this.canvas.style.transform = 'scale(0.9)';
        this.canvas.style.transition = 'all 0.5s ease-out';

        setTimeout(() => {
            this.canvas.style.opacity = '1';
            this.canvas.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Export for use in other modules
window.TrendVisualization = TrendVisualization;
