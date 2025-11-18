/**
 * Calm Growth App - Main Application Logic
 * Connects frontend to PHP backend and manages app state
 */

class CalmGrowthApp {
    constructor() {
        this.apiBase = 'php/api.php';
        this.userId = 1; // Default user ID
        this.currentProblem = null;
        this.problems = [];
        this.vibration = new CalmGrowthVibration({
            baseIntensity: 100,
            dampingFactor: 1.5,
            minIntensity: 10,
            enabled: true
        });

        this.init();
    }

    /**
     * Initialize app
     */
    async init() {
        console.log('🌊 Calm Growth App initializing...');

        // Setup event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadProblems();

        // Update UI
        this.updateStats();

        console.log('✅ App ready!');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Load problems button
        const loadBtn = document.getElementById('load-problems-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadProblems());
        }

        // Sync Moodle button
        const syncBtn = document.getElementById('sync-moodle-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncMoodleQuiz());
        }

        // Test vibration button
        const testVibBtn = document.getElementById('test-vibration-btn');
        if (testVibBtn) {
            testVibBtn.addEventListener('click', () => this.testVibration());
        }

        // Simulate growth button
        const simulateBtn = document.getElementById('simulate-growth-btn');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => this.simulateGrowth());
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetApp());
        }

        // Toggle vibration
        const toggleBtn = document.getElementById('toggle-vibration-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleVibration());
        }

        // Collapse smartphone
        const collapseBtn = document.getElementById('collapse-phone-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleSmartphone());
        }
    }

    /**
     * Load problems from backend
     */
    async loadProblems() {
        try {
            this.showLoading(true);

            const response = await fetch(`${this.apiBase}?endpoint=problems`);
            const data = await response.json();

            if (data.success) {
                this.problems = data.data;
                this.renderProblems();
                this.showNotification('Problems loaded successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to load problems');
            }
        } catch (error) {
            console.error('Error loading problems:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render problems in smartphone UI
     */
    renderProblems() {
        const container = document.getElementById('app-content');
        if (!container) return;

        if (this.problems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.8);">
                    <div style="font-size: 48px; margin-bottom: 10px;">📚</div>
                    <div style="font-size: 16px; font-weight: 600;">No problems yet</div>
                    <div style="font-size: 13px; margin-top: 5px;">Sync from Moodle or add manually</div>
                </div>
            `;
            return;
        }

        const problemsHTML = this.problems.map(problem => `
            <div class="problem-card" data-problem-id="${problem.id}">
                <div class="problem-title">${this.escapeHtml(problem.title)}</div>
                <div class="problem-description">${this.escapeHtml(problem.description || 'No description')}</div>
                <div class="problem-meta">
                    <span class="badge badge-${problem.difficulty_level}">${problem.difficulty_level}</span>
                    <span class="badge badge-category">${problem.category || 'General'}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = problemsHTML;

        // Add click handlers
        container.querySelectorAll('.problem-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const problemId = e.currentTarget.dataset.problemId;
                this.viewProblem(problemId);
            });
        });
    }

    /**
     * View problem and trigger vibration
     */
    async viewProblem(problemId) {
        const problem = this.problems.find(p => p.id == problemId);
        if (!problem) return;

        this.currentProblem = problem;

        // Log activity
        await this.logActivity(problemId, 'view', 1.0);

        // Get vibration params from server
        await this.updateVibrationFromServer(problemId);

        // Trigger vibration
        const smartphone = document.querySelector('.smartphone-container');
        await this.vibration.vibrate(smartphone);

        // Update stats
        this.updateStats();

        this.showNotification(`Viewing: ${problem.title}`, 'info');
    }

    /**
     * Log activity to backend
     */
    async logActivity(problemId, actionType, logValue = 1.0) {
        try {
            const response = await fetch(`${this.apiBase}?endpoint=activity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    problem_id: problemId,
                    action_type: actionType,
                    log_value: logValue
                })
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error logging activity:', error);
            return false;
        }
    }

    /**
     * Update vibration settings from server
     */
    async updateVibrationFromServer(problemId = null) {
        try {
            let url = `${this.apiBase}?endpoint=vibration&user_id=${this.userId}`;
            if (problemId) {
                url += `&problem_id=${problemId}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                const serverParams = data.data;

                // Update local vibration log value
                this.vibration.setLogValue(serverParams.log_value);

                console.log('📊', serverParams.message);
                return serverParams;
            }
        } catch (error) {
            console.error('Error updating vibration:', error);
        }
    }

    /**
     * Sync quiz from Moodle
     */
    async syncMoodleQuiz() {
        const quizId = prompt('Enter Moodle Quiz ID to sync:');
        if (!quizId) return;

        try {
            this.showLoading(true);

            // Get quiz questions from Moodle
            const response = await fetch(`${this.apiBase}?endpoint=moodle-quizzes&quiz_id=${quizId}`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                // Sync each question
                let synced = 0;
                for (const question of data.data) {
                    const syncResponse = await fetch(`${this.apiBase}?endpoint=sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question_id: question.id })
                    });

                    const syncData = await syncResponse.json();
                    if (syncData.success) synced++;
                }

                this.showNotification(`Synced ${synced} questions from Moodle!`, 'success');
                await this.loadProblems();
            } else {
                throw new Error('No questions found in quiz');
            }
        } catch (error) {
            console.error('Error syncing Moodle:', error);
            this.showNotification(`Sync error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Test vibration
     */
    async testVibration() {
        if (this.problems.length > 0) {
            const randomProblem = this.problems[Math.floor(Math.random() * this.problems.length)];
            await this.viewProblem(randomProblem.id);
        } else {
            // Test without problem
            const smartphone = document.querySelector('.smartphone-container');
            this.vibration.addActivity(1.0);
            await this.vibration.vibrate(smartphone);
            this.updateStats();
        }
    }

    /**
     * Simulate growth
     */
    simulateGrowth() {
        this.showNotification('Simulating Calm Growth...', 'info');

        const smartphone = document.querySelector('.smartphone-container');
        let count = 0;
        const maxCount = 10;

        const interval = setInterval(() => {
            this.vibration.addActivity(Math.random() * 2 + 0.5);
            this.vibration.vibrate(smartphone);
            this.updateStats();

            count++;
            if (count >= maxCount) {
                clearInterval(interval);
                this.showNotification('Simulation complete!', 'success');
            }
        }, 1000);
    }

    /**
     * Reset app
     */
    async resetApp() {
        if (!confirm('Reset all data including vibration log?')) return;

        this.vibration.reset();
        this.updateStats();
        this.showNotification('App reset!', 'success');
    }

    /**
     * Toggle vibration
     */
    toggleVibration() {
        const enabled = this.vibration.toggle();
        const btn = document.getElementById('toggle-vibration-btn');

        if (btn) {
            btn.textContent = enabled ? '🔊 Disable Vibration' : '🔇 Enable Vibration';
            btn.className = enabled ? 'btn btn-danger' : 'btn btn-success';
        }

        this.showNotification(
            enabled ? 'Vibration enabled' : 'Vibration disabled',
            'info'
        );
    }

    /**
     * Toggle smartphone collapse
     */
    toggleSmartphone() {
        const smartphone = document.querySelector('.smartphone-container');
        const btn = document.getElementById('collapse-phone-btn');

        smartphone.classList.toggle('collapsed');

        if (btn) {
            btn.textContent = smartphone.classList.contains('collapsed') ? '+' : '−';
        }
    }

    /**
     * Update stats dashboard
     */
    updateStats() {
        const stats = this.vibration.getStats();

        this.updateStatCard('log-value-stat', stats.currentLogValue.toFixed(2));
        this.updateStatCard('intensity-stat', `${stats.currentIntensity.toFixed(1)}%`);
        this.updateStatCard('damping-stat', `${stats.dampingPercentage}%`);
        this.updateStatCard('activity-stat', stats.activityCount);
    }

    /**
     * Update individual stat card
     */
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const container = document.getElementById('app-content');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<strong>${message}</strong>`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calmGrowthApp = new CalmGrowthApp();
});
