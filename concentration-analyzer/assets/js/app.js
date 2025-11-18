/**
 * Concentration Analyzer - Main JavaScript
 */

const App = {
    chart: null,
    currentUserId: null,
    currentCourseId: null,

    init() {
        this.bindEvents();
        this.loadUsers();
        this.setDefaultDates();
    },

    bindEvents() {
        document.getElementById('syncBtn').addEventListener('click', () => this.syncMoodleData());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.runAnalysis());
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadConcentrationData());
    },

    setDefaultDates() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        document.getElementById('startDate').value = this.formatDate(sevenDaysAgo);
        document.getElementById('endDate').value = this.formatDate(now);
    },

    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    async loadUsers() {
        try {
            const response = await fetch('api/get_concentration_data.php?action=users');
            const data = await response.json();

            if (data.success && data.users.length > 0) {
                const userSelect = document.getElementById('userId');
                const courseSelect = document.getElementById('courseId');

                userSelect.innerHTML = '<option value="">사용자 선택</option>';
                data.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.user_id;
                    option.dataset.courseId = user.course_id;
                    option.textContent = `사용자 ${user.user_id} - 코스 ${user.course_id} (${user.session_count}개 세션)`;
                    userSelect.appendChild(option);
                });

                userSelect.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    if (selectedOption.dataset.courseId) {
                        courseSelect.value = selectedOption.dataset.courseId;
                    }
                });
            }
        } catch (error) {
            console.error('사용자 목록 로드 실패:', error);
        }
    },

    async syncMoodleData() {
        const btn = document.getElementById('syncBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading"></span> 동기화 중...';
        btn.disabled = true;

        try {
            const response = await fetch('api/moodle_sync.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync' })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('success', `✓ ${data.message}`);
                await this.loadUsers();
            } else {
                this.showAlert('error', `✗ 동기화 실패: ${data.error}`);
            }
        } catch (error) {
            this.showAlert('error', `✗ 오류: ${error.message}`);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async runAnalysis() {
        const userId = document.getElementById('userId').value;
        const courseId = document.getElementById('courseId').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!userId || !courseId) {
            this.showAlert('error', '사용자와 코스를 선택해주세요.');
            return;
        }

        const btn = document.getElementById('analyzeBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading"></span> 분석 중...';
        btn.disabled = true;

        try {
            const startTime = Math.floor(new Date(startDate).getTime() / 1000);
            const endTime = Math.floor(new Date(endDate + ' 23:59:59').getTime() / 1000);

            const response = await fetch('api/analyze_patterns.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'full_analysis',
                    user_id: parseInt(userId),
                    course_id: parseInt(courseId),
                    start_time: startTime,
                    end_time: endTime
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('success', `✓ ${data.message}`);
                await this.loadConcentrationData();
            } else {
                this.showAlert('error', `✗ 분석 실패: ${data.error}`);
            }
        } catch (error) {
            this.showAlert('error', `✗ 오류: ${error.message}`);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async loadConcentrationData() {
        const userId = document.getElementById('userId').value;
        const courseId = document.getElementById('courseId').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!userId || !courseId) {
            this.showAlert('error', '사용자와 코스를 선택해주세요.');
            return;
        }

        this.currentUserId = userId;
        this.currentCourseId = courseId;

        const startTime = Math.floor(new Date(startDate).getTime() / 1000);
        const endTime = Math.floor(new Date(endDate + ' 23:59:59').getTime() / 1000);

        try {
            // 집중도 데이터 로드
            const metricsResponse = await fetch(
                `api/get_concentration_data.php?action=metrics&user_id=${userId}&course_id=${courseId}&start_time=${startTime}&end_time=${endTime}`
            );
            const metricsData = await metricsResponse.json();

            // 변동 구간 데이터 로드
            const fluctuationsResponse = await fetch(
                `api/get_concentration_data.php?action=fluctuations&user_id=${userId}&course_id=${courseId}&start_time=${startTime}&end_time=${endTime}`
            );
            const fluctuationsData = await fluctuationsResponse.json();

            // 요약 통계 로드
            const summaryResponse = await fetch(
                `api/get_concentration_data.php?action=summary&user_id=${userId}&course_id=${courseId}&start_time=${startTime}&end_time=${endTime}`
            );
            const summaryData = await summaryResponse.json();

            if (metricsData.success) {
                this.renderChart(metricsData.chart_data);
                this.renderStats(summaryData.summary);
                this.renderFluctuationsTable(fluctuationsData.fluctuations || [], fluctuationsData.statistics || {});
            } else {
                this.showAlert('error', '데이터 로드 실패');
            }
        } catch (error) {
            this.showAlert('error', `오류: ${error.message}`);
        }
    },

    renderChart(chartData) {
        const ctx = document.getElementById('concentrationChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '집중도 점수',
                    data: chartData.scores,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `집중도: ${context.parsed.y.toFixed(2)}점`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '집중도 점수 (0-100)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '시간'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    renderStats(summary) {
        document.getElementById('avgScore').textContent = summary.avg_score ? parseFloat(summary.avg_score).toFixed(1) : '0.0';
        document.getElementById('totalSessions').textContent = summary.total_sessions || '0';
        document.getElementById('totalFluctuations').textContent = summary.total_fluctuations || '0';
        document.getElementById('highSeverityCount').textContent = summary.high_severity_count || '0';

        // 평균 점수에 따른 색상 변경
        const avgScoreCard = document.querySelector('.stat-card:nth-child(1)');
        if (summary.avg_score >= 70) {
            avgScoreCard.className = 'stat-card success';
        } else if (summary.avg_score >= 50) {
            avgScoreCard.className = 'stat-card warning';
        } else {
            avgScoreCard.className = 'stat-card danger';
        }

        // 높은 심각도 카운트에 따른 색상
        const severityCard = document.querySelector('.stat-card:nth-child(4)');
        if (summary.high_severity_count > 5) {
            severityCard.className = 'stat-card danger';
        } else if (summary.high_severity_count > 2) {
            severityCard.className = 'stat-card warning';
        } else {
            severityCard.className = 'stat-card success';
        }
    },

    renderFluctuationsTable(fluctuations, statistics) {
        const tbody = document.getElementById('fluctuationsBody');
        tbody.innerHTML = '';

        if (fluctuations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <p>변동 구간이 발견되지 않았습니다.</p>
                    </td>
                </tr>
            `;
            return;
        }

        fluctuations.forEach(f => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(f.start_time * 1000).toLocaleString('ko-KR')}</td>
                <td><span class="badge badge-${f.fluctuation_type}">${this.getTypeLabel(f.fluctuation_type)}</span></td>
                <td><span class="badge badge-${f.severity}">${this.getSeverityLabel(f.severity)}</span></td>
                <td>${parseFloat(f.baseline_score).toFixed(2)}</td>
                <td>${parseFloat(f.z_score).toFixed(2)}</td>
                <td>${f.description}</td>
            `;
            tbody.appendChild(row);
        });
    },

    getTypeLabel(type) {
        const labels = {
            'spike': '급상승',
            'drop': '급하락',
            'irregular': '불규칙'
        };
        return labels[type] || type;
    },

    getSeverityLabel(severity) {
        const labels = {
            'high': '높음',
            'medium': '보통',
            'low': '낮음'
        };
        return labels[severity] || severity;
    },

    showAlert(type, message) {
        const alertContainer = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
