/**
 * Outlier Shadow - Smartphone UI JavaScript
 * Handles real-time updates and interactive features
 */

class OutlierShadowApp {
    constructor() {
        this.currentFilter = 'all';
        this.updateInterval = null;
        this.courseId = null;
        this.quizId = null;

        this.init();
    }

    init() {
        // Get configuration from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.courseId = urlParams.get('course_id');
        this.quizId = urlParams.get('quiz_id');

        // Set up filter tabs
        this.setupFilterTabs();

        // Initial data load
        this.loadData();

        // Set up auto-refresh (every 30 seconds)
        this.updateInterval = setInterval(() => this.loadData(), 30000);
    }

    setupFilterTabs() {
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Update filter
                this.currentFilter = e.target.dataset.filter;
                this.filterStudents();
            });
        });
    }

    async loadData() {
        try {
            const params = new URLSearchParams();
            if (this.courseId) params.append('course_id', this.courseId);
            if (this.quizId) params.append('quiz_id', this.quizId);

            const response = await fetch(`api/get_students.php?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                this.renderStudents(data.students);
                this.renderStatistics(data.statistics);
            } else {
                this.showError(data.error || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Network error. Please check your connection.');
        }
    }

    renderStudents(students) {
        const container = document.getElementById('students-container');

        if (!students || students.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>No student data available</p>
                </div>
            `;
            return;
        }

        // Sort by score (descending)
        students.sort((a, b) => {
            const scoreA = parseFloat(a.avg_score || a.score || 0);
            const scoreB = parseFloat(b.avg_score || b.score || 0);
            return scoreB - scoreA;
        });

        container.innerHTML = students.map(student => this.createStudentCard(student)).join('');

        // Apply current filter
        this.filterStudents();
    }

    createStudentCard(student) {
        const score = parseFloat(student.avg_score || student.score || 0);
        const isOutlier = student.is_outlier || false;
        const outlierInfo = student.outlier_info;

        let scoreClass = 'normal';
        let outlierClass = '';
        let outlierBadge = '';

        if (isOutlier && outlierInfo) {
            scoreClass = outlierInfo.type;
            outlierClass = `outlier ${outlierInfo.type}`;
            const badgeText = outlierInfo.type === 'low' ? 'At Risk' : 'Excelling';
            outlierBadge = `<div class="outlier-badge ${outlierInfo.type}">${badgeText}</div>`;
        }

        const name = `${student.firstname || ''} ${student.lastname || ''}`.trim() || 'Unknown Student';
        const userId = student.userid || student.id || 'N/A';
        const attemptCount = student.attempt_count || 0;
        const minScore = parseFloat(student.min_score || 0).toFixed(1);
        const maxScore = parseFloat(student.max_score || 0).toFixed(1);

        return `
            <div class="student-card ${outlierClass}" data-filter-type="${isOutlier ? outlierInfo.type : 'normal'}">
                ${outlierBadge}
                <div class="student-info">
                    <div>
                        <h3 class="student-name">${this.escapeHtml(name)}</h3>
                        <div class="student-id">ID: ${userId}</div>
                    </div>
                    <div class="score-display">
                        <div class="score-value ${scoreClass}">${score.toFixed(1)}</div>
                        <div class="score-label">Score</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${scoreClass}" style="width: ${score}%"></div>
                </div>
                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="stat-value">${attemptCount}</div>
                        <div class="stat-label">Attempts</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${minScore}</div>
                        <div class="stat-label">Min</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${maxScore}</div>
                        <div class="stat-label">Max</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStatistics(statistics) {
        const statsContainer = document.getElementById('stats-summary');

        if (!statistics || !statsContainer) return;

        const totalStudents = statistics.outlier_count !== undefined ?
            (statistics.students?.length || 0) : 0;
        const outlierCount = statistics.outlier_count || 0;
        const outlierPercent = totalStudents > 0 ?
            ((outlierCount / totalStudents) * 100).toFixed(1) : 0;

        let statsHtml = '<h3>Statistics</h3><div class="stats-grid">';

        if (statistics.mean !== undefined) {
            statsHtml += `
                <div class="stats-grid-item">
                    <div class="stat-value">${parseFloat(statistics.mean).toFixed(1)}</div>
                    <div class="stat-label">Mean</div>
                </div>
                <div class="stats-grid-item">
                    <div class="stat-value">${parseFloat(statistics.stddev || 0).toFixed(1)}</div>
                    <div class="stat-label">Std Dev</div>
                </div>
            `;
        }

        if (statistics.median !== undefined) {
            statsHtml += `
                <div class="stats-grid-item">
                    <div class="stat-value">${parseFloat(statistics.median).toFixed(1)}</div>
                    <div class="stat-label">Median</div>
                </div>
            `;
        }

        statsHtml += `
            <div class="stats-grid-item">
                <div class="stat-value">${outlierCount}</div>
                <div class="stat-label">Outliers</div>
            </div>
            <div class="stats-grid-item">
                <div class="stat-value">${outlierPercent}%</div>
                <div class="stat-label">Outlier %</div>
            </div>
            <div class="stats-grid-item">
                <div class="stat-value">${totalStudents}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>`;

        statsContainer.innerHTML = statsHtml;
    }

    filterStudents() {
        const cards = document.querySelectorAll('.student-card');

        cards.forEach(card => {
            const filterType = card.dataset.filterType;

            if (this.currentFilter === 'all') {
                card.style.display = 'block';
            } else if (this.currentFilter === 'outliers') {
                card.style.display = (filterType === 'low' || filterType === 'high') ? 'block' : 'none';
            } else {
                card.style.display = filterType === this.currentFilter ? 'block' : 'none';
            }
        });
    }

    showError(message) {
        const container = document.getElementById('students-container');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.outlierApp = new OutlierShadowApp();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.outlierApp) {
        window.outlierApp.destroy();
    }
});
