/**
 * Main Application Script
 * Deviation Breeze - Learning Deviation Visualization
 */

class DeviationBreezeApp {
    constructor() {
        this.visualizer = null;
        this.currentQuizId = null;
        this.autoRefreshInterval = null;

        this.init();
    }

    async init() {
        console.log('Initializing Deviation Breeze...');

        // Initialize visualizer
        this.visualizer = new BreezeVisualizer('breezeSvg', 'breezeVisualization');

        // Setup event listeners
        this.setupEventListeners();

        // Test Moodle connection
        await this.testMoodleConnection();

        // Load initial data
        await this.loadCourses();

        console.log('Deviation Breeze initialized successfully!');
    }

    setupEventListeners() {
        // Course selection
        document.getElementById('courseSelect').addEventListener('change', (e) => {
            this.onCourseSelected(e.target.value);
        });

        // Quiz selection
        document.getElementById('quizSelect').addEventListener('change', (e) => {
            this.currentQuizId = e.target.value;
            document.getElementById('loadQuizBtn').disabled = !this.currentQuizId;
        });

        // Load quiz button
        document.getElementById('loadQuizBtn').addEventListener('click', () => {
            this.loadQuizDeviation();
        });

        // Auto refresh toggle
        document.getElementById('autoRefresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
    }

    /**
     * Test Moodle connection
     */
    async testMoodleConnection() {
        const statusBadge = document.getElementById('moodle-status');

        try {
            const result = await API.testMoodle();

            if (result.success) {
                statusBadge.innerHTML = '<i class="fas fa-circle"></i> Moodle 연결됨';
                statusBadge.classList.remove('badge-secondary', 'badge-danger');
                statusBadge.classList.add('badge-success', 'connected');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            console.error('Moodle connection failed:', error);
            statusBadge.innerHTML = '<i class="fas fa-circle"></i> Moodle 연결 실패';
            statusBadge.classList.remove('badge-secondary', 'badge-success');
            statusBadge.classList.add('badge-danger', 'disconnected');

            this.showNotification('Moodle 연결에 실패했습니다. 설정을 확인해주세요.', 'error');
        }
    }

    /**
     * Load courses from Moodle
     */
    async loadCourses() {
        const courseSelect = document.getElementById('courseSelect');

        this.showLoading(true);

        try {
            const result = await API.getCourses();

            if (result.success && result.data) {
                courseSelect.innerHTML = '<option value="">코스를 선택하세요...</option>';

                result.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.fullname || course.shortname;
                    courseSelect.appendChild(option);
                });

                this.showNotification('코스 목록을 불러왔습니다.', 'success');
            }
        } catch (error) {
            console.error('Failed to load courses:', error);
            this.showNotification('코스 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle course selection
     */
    async onCourseSelected(courseId) {
        const quizSelect = document.getElementById('quizSelect');
        quizSelect.disabled = true;
        quizSelect.innerHTML = '<option value="">퀴즈를 불러오는 중...</option>';

        if (!courseId) {
            quizSelect.innerHTML = '<option value="">먼저 코스를 선택하세요...</option>';
            return;
        }

        this.showLoading(true);

        try {
            // Get quizzes for this course
            const result = await API.getQuizzes();

            if (result.success && result.data) {
                // Filter quizzes by course
                const quizzes = result.data.filter(q => q.course_id == courseId);

                quizSelect.innerHTML = '<option value="">퀴즈를 선택하세요...</option>';

                quizzes.forEach(quiz => {
                    const option = document.createElement('option');
                    option.value = quiz.id;
                    option.textContent = quiz.quiz_name;
                    quizSelect.appendChild(option);
                });

                quizSelect.disabled = false;

                if (quizzes.length === 0) {
                    this.showNotification('이 코스에 퀴즈가 없습니다.', 'warning');
                }
            }
        } catch (error) {
            console.error('Failed to load quizzes:', error);
            this.showNotification('퀴즈 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load quiz deviation data and visualize
     */
    async loadQuizDeviation() {
        if (!this.currentQuizId) return;

        this.showLoading(true);

        try {
            // First, calculate deviation
            await API.calculateDeviation(this.currentQuizId);

            // Then, get visualization data
            const result = await API.getDeviationVisualization(this.currentQuizId);

            if (result.success && result.data) {
                const data = result.data;

                // Render visualization
                this.visualizer.render(data);

                // Update student table
                this.updateStudentTable(data.students);

                // Update stats
                this.updateStats(data.statistics);

                this.showNotification('편차 분석이 완료되었습니다.', 'success');

                // Start auto refresh if enabled
                if (document.getElementById('autoRefresh').checked) {
                    this.startAutoRefresh();
                }
            }
        } catch (error) {
            console.error('Failed to load deviation:', error);
            this.showNotification('편차 분석에 실패했습니다: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Update student table
     */
    updateStudentTable(students) {
        const tbody = document.getElementById('studentTableBody');

        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">데이터가 없습니다</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(student => `
            <tr>
                <td><strong>${student.rank}</strong></td>
                <td>${student.name}</td>
                <td>${student.score.toFixed(2)}</td>
                <td>${student.percentile}%</td>
                <td>${student.deviation.toFixed(2)}</td>
                <td>
                    <span class="badge cluster-${student.cluster}">
                        ${this.getClusterLabel(student.cluster)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="app.showStudentDetail(${student.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Update statistics panel
     */
    updateStats(stats) {
        const statsContainer = document.getElementById('statsContainer');

        statsContainer.innerHTML = `
            <div class="stat-item mb-2">
                <strong>평균 점수:</strong>
                <span class="float-right">${stats.avg_score.toFixed(2)}</span>
            </div>
            <div class="stat-item mb-2">
                <strong>표준편차:</strong>
                <span class="float-right">${stats.std_deviation.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <strong>학생 수:</strong>
                <span class="float-right">${stats.total_students}명</span>
            </div>
        `;
    }

    /**
     * Show student detail
     */
    async showStudentDetail(studentId) {
        this.showLoading(true);

        try {
            const result = await API.getStudent(studentId);

            if (result.success && result.data) {
                const student = result.data;

                // Show in modal or smartphone
                if (window.smartphone) {
                    smartphone.screen.innerHTML = `
                        <div class="smartphone-content">
                            <h5 class="mb-3">${student.full_name}</h5>
                            <p><strong>사용자명:</strong> ${student.username}</p>
                            <p><strong>이메일:</strong> ${student.email || 'N/A'}</p>
                        </div>
                    `;
                }

                this.showNotification(`${student.full_name}의 정보를 불러왔습니다.`, 'success');
            }
        } catch (error) {
            console.error('Failed to load student:', error);
            this.showNotification('학생 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Get cluster label
     */
    getClusterLabel(cluster) {
        const labels = {
            'high': '상위권',
            'medium': '중위권',
            'low': '하위권',
            'outlier': '이상치'
        };
        return labels[cluster] || cluster;
    }

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear existing interval

        this.autoRefreshInterval = setInterval(() => {
            if (this.currentQuizId) {
                console.log('Auto refreshing...');
                this.loadQuizDeviation();
            }
        }, 30000); // Refresh every 30 seconds

        console.log('Auto refresh started');
    }

    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('Auto refresh stopped');
        }
    }

    /**
     * Show loading spinner
     */
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple console notification for now
        // Can be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Could use Bootstrap toast or other notification library
        // For now, just log to console
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DeviationBreezeApp();
});

// Export for debugging
window.app = app;
