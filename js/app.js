/**
 * Main Application - KAIST Touch Math Academy
 * Integrates LMS data with Trend Glow visualization
 */

class TrendGlowApp {
    constructor() {
        this.lms = new LMSIntegration();
        this.visualization = new TrendVisualization('trendChart');
        this.currentStudent = 1;
        this.currentModule = 'addition';
        this.realtimeUpdateInterval = null;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('🚀 Initializing Trend Glow App...');

        // Setup event listeners
        this.setupEventListeners();

        // Update connection status
        this.updateConnectionStatus();

        // Load initial data
        await this.loadData();

        // Start realtime updates (optional)
        // this.startRealtimeUpdates();

        console.log('✅ App initialized successfully');
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Student selection
        const studentSelect = document.getElementById('student-select');
        if (studentSelect) {
            studentSelect.addEventListener('change', async (e) => {
                this.currentStudent = parseInt(e.target.value);
                await this.loadData();
            });
        }

        // Module selection
        const moduleSelect = document.getElementById('module-select');
        if (moduleSelect) {
            moduleSelect.addEventListener('change', async (e) => {
                this.currentModule = e.target.value;
                await this.loadData();
            });
        }

        // Glow toggle
        const glowToggle = document.getElementById('glow-toggle');
        if (glowToggle) {
            glowToggle.addEventListener('change', (e) => {
                this.visualization.toggleGlow(e.target.checked);
                this.updateGlowIndicator(e.target.checked);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadData();
                this.showNotification('데이터가 새로고침되었습니다');
            });
        }
    }

    /**
     * Load data from LMS
     */
    async loadData() {
        try {
            console.log(`📊 Loading data for student ${this.currentStudent}, module ${this.currentModule}`);

            // Show loading state
            this.showLoadingState();

            // Fetch performance data
            const response = await this.lms.fetchStudentPerformance(
                this.currentStudent,
                this.currentModule
            );

            if (response.success) {
                const { student, module, performance } = response.data;

                // Update chart
                const labels = this.visualization.formatLabels(performance.timestamps);
                this.visualization.updateChart(performance.scores, labels);

                // Update statistics
                this.updateStats(performance);

                // Update recent problems
                await this.updateRecentProblems();

                // Add entrance animation
                this.visualization.animateIn();

                console.log('✅ Data loaded successfully');
            }

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError('데이터를 불러오는데 실패했습니다');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Update statistics display
     */
    updateStats(performance) {
        // Current score
        const currentScoreEl = document.getElementById('current-score');
        if (currentScoreEl) {
            currentScoreEl.textContent = `${performance.currentScore}점`;
            this.animateValue(currentScoreEl, performance.currentScore);
        }

        // Trend direction
        const trendEl = document.getElementById('trend-direction');
        if (trendEl) {
            const trendIcons = {
                'up': '📈 상승',
                'down': '📉 하락',
                'neutral': '➡️ 유지'
            };
            trendEl.textContent = trendIcons[performance.trend] || '➡️ 유지';

            // Add glow to trend arrow
            trendEl.className = 'stat-value';
            if (performance.trend === 'up') {
                trendEl.classList.add('trend-arrow', 'up');
            } else if (performance.trend === 'down') {
                trendEl.classList.add('trend-arrow', 'down');
            }
        }

        // Average score
        const avgScoreEl = document.getElementById('avg-score');
        if (avgScoreEl) {
            avgScoreEl.textContent = `${performance.averageScore}점`;
            this.animateValue(avgScoreEl, performance.averageScore);
        }

        // Update velocity bar
        const velocityBar = document.getElementById('velocity-bar');
        if (velocityBar) {
            velocityBar.style.width = `${performance.velocity}%`;
        }

        // Update improvement bar
        const improvementBar = document.getElementById('improvement-bar');
        if (improvementBar) {
            improvementBar.style.width = `${performance.improvement}%`;
        }
    }

    /**
     * Update recent problems list
     */
    async updateRecentProblems() {
        try {
            const response = await this.lms.fetchRecentProblems(
                this.currentStudent,
                this.currentModule,
                5
            );

            if (response.success) {
                const problemList = document.querySelector('.problem-list');
                if (problemList) {
                    problemList.innerHTML = response.data.map(problem => `
                        <div class="problem-item">
                            <span class="problem-text">${problem.problemText}</span>
                            <span class="problem-score ${problem.correct ? 'correct' : 'incorrect'}">
                                ${problem.correct ? '✓' : '✗'}
                            </span>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading recent problems:', error);
        }
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus() {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            const connected = this.lms.checkConnection();
            statusEl.textContent = connected ? '연결됨' : '연결 끊김';
            statusEl.className = connected ? 'status-connected' : 'status-disconnected';
        }
    }

    /**
     * Update glow indicator
     */
    updateGlowIndicator(enabled) {
        const indicator = document.getElementById('glow-indicator');
        if (indicator) {
            const dot = indicator.querySelector('.glow-dot');
            const text = indicator.querySelector('.glow-text');

            if (enabled) {
                dot.style.background = '#4caf50';
                text.textContent = 'Trend Glow 활성';
            } else {
                dot.style.background = '#999';
                text.textContent = 'Trend Glow 비활성';
            }
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const chart = document.getElementById('trendChart');
        if (chart) {
            chart.style.opacity = '0.5';
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const chart = document.getElementById('trendChart');
        if (chart) {
            chart.style.opacity = '1';
        }
    }

    /**
     * Animate number value
     */
    animateValue(element, targetValue) {
        if (!element) return;

        const duration = 800;
        const startValue = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);

            const currentText = element.textContent;
            const suffix = currentText.replace(/[0-9]/g, '');
            element.textContent = `${currentValue}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Show notification
     */
    showNotification(message) {
        console.log('📢', message);

        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(102, 126, 234, 0.95);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌', message);
        this.showNotification(message);
    }

    /**
     * Start realtime updates (optional)
     */
    startRealtimeUpdates() {
        if (this.realtimeUpdateInterval) {
            clearInterval(this.realtimeUpdateInterval);
        }

        this.realtimeUpdateInterval = this.lms.startRealtimeUpdates(
            async (update) => {
                // Only update if it's for current student/module
                if (update.studentId === this.currentStudent &&
                    update.moduleId === this.currentModule) {
                    console.log('🔄 Realtime update received:', update);
                    await this.loadData();
                }
            },
            10000 // Update every 10 seconds
        );

        console.log('🔄 Realtime updates started');
    }

    /**
     * Stop realtime updates
     */
    stopRealtimeUpdates() {
        if (this.realtimeUpdateInterval) {
            clearInterval(this.realtimeUpdateInterval);
            this.realtimeUpdateInterval = null;
            console.log('⏸️ Realtime updates stopped');
        }
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.stopRealtimeUpdates();
        this.visualization.destroy();
        console.log('👋 App destroyed');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TrendGlowApp();
});

// Make app globally accessible for debugging
window.TrendGlowApp = TrendGlowApp;
window.app = app;
