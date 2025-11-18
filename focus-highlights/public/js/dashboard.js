/**
 * Dashboard JavaScript
 * Handles dashboard data visualization and interaction
 */

(function() {
    'use strict';

    const CONFIG = {
        apiBaseUrl: '/focus-highlights/api'
    };

    class Dashboard {
        constructor(userId, daysBack) {
            this.userId = userId;
            this.daysBack = daysBack || 30;
            this.data = null;

            this.init();
        }

        init() {
            this.loadData();
            this.setupRefreshButton();
        }

        loadData() {
            this.showLoading();

            fetch(CONFIG.apiBaseUrl + '/get_dashboard_data.php?user_id=' + this.userId + '&days=' + this.daysBack)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.data = data;
                        this.render();
                    } else {
                        this.showError(data.error);
                    }
                })
                .catch(error => {
                    this.showError('Failed to load dashboard data: ' + error.message);
                });
        }

        render() {
            this.renderStats();
            this.renderHighlights();
            this.renderChart();
            this.renderCourseBreakdown();
            this.renderRecentSessions();
            this.hideLoading();
        }

        renderStats() {
            const stats = this.data.stats;

            if (!stats) return;

            document.getElementById('total-sessions').textContent = stats.total_sessions || 0;
            document.getElementById('highlight-count').textContent = stats.highlight_count || 0;
            document.getElementById('avg-focus-score').textContent = stats.avg_focus_score ?
                parseFloat(stats.avg_focus_score).toFixed(1) : '0.0';
            document.getElementById('total-study-time').textContent =
                this.formatDuration(stats.total_study_time || 0);
            document.getElementById('avg-accuracy').textContent = stats.avg_accuracy ?
                parseFloat(stats.avg_accuracy).toFixed(1) + '%' : '0.0%';
        }

        renderHighlights() {
            const container = document.getElementById('highlights-container');
            const highlights = this.data.highlights;

            if (!highlights || highlights.length === 0) {
                container.innerHTML = '<p class="no-data">No highlights yet. Keep up the focused learning!</p>';
                return;
            }

            let html = '';

            highlights.forEach(highlight => {
                const date = new Date(highlight.session_start);
                const duration = this.formatDuration(highlight.duration_seconds);
                const focusScore = parseFloat(highlight.focus_score).toFixed(1);

                html += `
                    <div class="highlight-card">
                        <div class="highlight-header">
                            <span class="highlight-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                            <span class="highlight-score">${focusScore}/100</span>
                        </div>
                        <div class="highlight-body">
                            <h3>${highlight.course_name || 'Unknown Course'}</h3>
                            <p class="highlight-duration">Duration: ${duration}</p>
                            <p class="highlight-reason">${highlight.highlight_reason || 'Great focus session!'}</p>
                            ${highlight.accuracy_rate > 0 ?
                                `<p class="highlight-accuracy">Accuracy: ${parseFloat(highlight.accuracy_rate).toFixed(1)}%</p>` : ''}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        renderChart() {
            const canvas = document.getElementById('focus-chart');
            const dailyScores = this.data.daily_scores;

            if (!canvas || !dailyScores || dailyScores.length === 0) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const padding = 40;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Prepare data
            const dates = dailyScores.map(d => d.date);
            const scores = dailyScores.map(d => parseFloat(d.avg_score) || 0);
            const maxScore = Math.max(...scores, 100);
            const minScore = 0;

            // Draw axes
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            // Draw grid lines
            ctx.strokeStyle = '#f0f0f0';
            for (let i = 0; i <= 5; i++) {
                const y = padding + ((height - 2 * padding) * i) / 5;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
            }

            // Draw line chart
            if (scores.length > 0) {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.beginPath();

                scores.forEach((score, index) => {
                    const x = padding + ((width - 2 * padding) * index) / (scores.length - 1 || 1);
                    const y = height - padding - ((height - 2 * padding) * (score - minScore)) / (maxScore - minScore);

                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });

                ctx.stroke();

                // Draw points
                ctx.fillStyle = '#4CAF50';
                scores.forEach((score, index) => {
                    const x = padding + ((width - 2 * padding) * index) / (scores.length - 1 || 1);
                    const y = height - padding - ((height - 2 * padding) * (score - minScore)) / (maxScore - minScore);

                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }

            // Draw labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';

            // Y-axis labels
            for (let i = 0; i <= 5; i++) {
                const y = padding + ((height - 2 * padding) * i) / 5;
                const label = Math.round(maxScore - ((maxScore - minScore) * i) / 5);
                ctx.textAlign = 'right';
                ctx.fillText(label, padding - 10, y + 5);
            }

            // X-axis labels (show every nth date)
            const step = Math.ceil(dates.length / 7);
            dates.forEach((date, index) => {
                if (index % step === 0) {
                    const x = padding + ((width - 2 * padding) * index) / (scores.length - 1 || 1);
                    const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    ctx.textAlign = 'center';
                    ctx.fillText(dateStr, x, height - padding + 20);
                }
            });
        }

        renderCourseBreakdown() {
            const container = document.getElementById('course-breakdown');
            const courses = this.data.course_breakdown;

            if (!courses || courses.length === 0) {
                container.innerHTML = '<p class="no-data">No course data available</p>';
                return;
            }

            let html = '<table class="breakdown-table"><thead><tr>' +
                '<th>Course</th>' +
                '<th>Sessions</th>' +
                '<th>Avg Score</th>' +
                '<th>Total Time</th>' +
                '<th>Highlights</th>' +
                '</tr></thead><tbody>';

            courses.forEach(course => {
                html += `
                    <tr>
                        <td>${course.course_name || 'Unknown'}</td>
                        <td>${course.session_count}</td>
                        <td>${parseFloat(course.avg_focus_score || 0).toFixed(1)}</td>
                        <td>${this.formatDuration(course.total_duration)}</td>
                        <td>${course.highlight_count}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        renderRecentSessions() {
            const container = document.getElementById('recent-sessions');
            const sessions = this.data.recent_sessions;

            if (!sessions || sessions.length === 0) {
                container.innerHTML = '<p class="no-data">No recent sessions</p>';
                return;
            }

            let html = '<table class="sessions-table"><thead><tr>' +
                '<th>Date/Time</th>' +
                '<th>Course</th>' +
                '<th>Duration</th>' +
                '<th>Focus Score</th>' +
                '<th>Highlight</th>' +
                '</tr></thead><tbody>';

            sessions.forEach(session => {
                const date = new Date(session.session_start);
                const isHighlight = parseInt(session.is_highlight) === 1;

                html += `
                    <tr class="${isHighlight ? 'highlight-row' : ''}">
                        <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                        <td>${session.course_name || 'Unknown'}</td>
                        <td>${this.formatDuration(session.duration_seconds)}</td>
                        <td>${parseFloat(session.focus_score || 0).toFixed(1)}</td>
                        <td>${isHighlight ? '⭐' : '-'}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        formatDuration(seconds) {
            if (!seconds || seconds === 0) return '0m';

            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        }

        setupRefreshButton() {
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadData();
                });
            }
        }

        showLoading() {
            const loader = document.getElementById('dashboard-loader');
            if (loader) {
                loader.style.display = 'block';
            }
        }

        hideLoading() {
            const loader = document.getElementById('dashboard-loader');
            if (loader) {
                loader.style.display = 'none';
            }
        }

        showError(message) {
            alert('Error: ' + message);
            this.hideLoading();
        }
    }

    // Expose to global scope
    window.Dashboard = Dashboard;

})();
