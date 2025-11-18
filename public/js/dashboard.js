/**
 * Teacher Dashboard Logic
 */

const API_BASE = '/api';
let authToken = null;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
});

/**
 * Check authentication
 */
function checkAuth() {
    authToken = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!authToken || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(userStr);

    // Require teacher or admin role
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
        alert('교사 또는 관리자만 접근할 수 있습니다.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('teacher-name').textContent = currentUser.full_name;
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/**
 * API Request Helper
 */
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };

    const response = await fetch(API_BASE + endpoint, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        return null;
    }

    return await response.json();
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Load class overview
        const classData = await apiRequest('/analytics.php?action=class_overview');

        if (classData) {
            displayClassOverview(classData);
        }

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

/**
 * Display class overview
 */
function displayClassOverview(data) {
    // Update overview stats
    const stats = data.class_statistics;
    document.getElementById('total-students').textContent = stats.total_students || 0;
    document.getElementById('total-sessions').textContent = stats.total_sessions || 0;
    document.getElementById('avg-final-score').textContent = Math.round(stats.avg_final_score || 0);
    document.getElementById('avg-focus-score').textContent = Math.round(stats.avg_focus_score || 0);

    // Display students list
    displayStudentsList(data.students);

    // Display recent activity
    displayRecentActivity(data.recent_activity);

    // Load difficulty performance
    loadDifficultyPerformance();
}

/**
 * Display students list
 */
function displayStudentsList(students) {
    const container = document.getElementById('students-list');

    if (!students || students.length === 0) {
        container.innerHTML = '<p class="text-center">학생이 없습니다.</p>';
        return;
    }

    const html = students.map(student => {
        const avgScore = Math.round(student.average_final_score || 0);
        const totalSessions = student.total_sessions || 0;
        const totalTime = Math.round((student.total_learning_time_seconds || 0) / 60);

        return `
            <div class="student-item" onclick="viewStudentDetail('${student.user_id}', '${student.full_name}')">
                <div class="student-name">${student.full_name} (${student.username})</div>
                <div class="student-stats">
                    <span>세션: ${totalSessions}</span>
                    <span>평균: ${avgScore}점</span>
                    <span>학습: ${totalTime}분</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

/**
 * Display recent activity
 */
function displayRecentActivity(activities) {
    const container = document.getElementById('recent-activity');

    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="text-center">최근 활동이 없습니다.</p>';
        return;
    }

    const html = activities.map(activity => {
        const date = new Date(activity.started_at);
        const timeStr = date.toLocaleString('ko-KR');
        const duration = Math.round(activity.duration_seconds / 60);
        const score = Math.round(activity.final_score || 0);

        return `
            <div class="activity-item">
                <div class="activity-user">${activity.full_name}</div>
                <div class="activity-meta">
                    ${timeStr} · ${duration}분 · 점수: ${score}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

/**
 * Load difficulty performance (all students)
 */
async function loadDifficultyPerformance() {
    try {
        const data = await apiRequest('/analytics.php?action=difficulty_analysis');

        if (!data || !data.difficulty_analysis || data.difficulty_analysis.length === 0) {
            document.getElementById('difficulty-tbody').innerHTML =
                '<tr><td colspan="7" class="text-center">데이터 없음</td></tr>';
            return;
        }

        const difficultyLabels = ['쉬움', '기본', '중급', '고급', '최고난도'];

        const html = data.difficulty_analysis.map(item => {
            const label = difficultyLabels[item.difficulty_level - 1] || item.difficulty_level;
            const avgTime = item.avg_time_minutes ? Math.round(item.avg_time_minutes) : 0;

            return `
                <tr>
                    <td><span class="badge badge-primary">${label} (${item.difficulty_level})</span></td>
                    <td>${item.total_attempts}</td>
                    <td>${item.correct_attempts}</td>
                    <td>${item.accuracy_rate}%</td>
                    <td>${item.avg_score}</td>
                    <td>${avgTime}분</td>
                    <td>${item.avg_focus_score}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('difficulty-tbody').innerHTML = html;

    } catch (error) {
        console.error('Failed to load difficulty performance:', error);
    }
}

/**
 * View student detail
 */
async function viewStudentDetail(userId, fullName) {
    try {
        const data = await apiRequest(`/analytics.php?action=user_statistics&user_id=${userId}`);

        if (!data) return;

        // Show detail panel
        document.getElementById('student-detail').classList.remove('hidden');

        // Update student name
        document.getElementById('detail-student-name').textContent = fullName + ' 상세 정보';

        // Update overview stats
        const stats = data.statistics;
        document.getElementById('detail-sessions').textContent = stats.total_sessions || 0;
        document.getElementById('detail-avg-score').textContent = Math.round(stats.average_final_score || 0);
        document.getElementById('detail-avg-focus').textContent = Math.round(stats.average_focus_score || 0);
        document.getElementById('detail-total-time').textContent =
            Math.round((stats.total_learning_time_seconds || 0) / 60) + '분';

        // Difficulty breakdown
        if (data.difficulty_breakdown && data.difficulty_breakdown.length > 0) {
            const difficultyLabels = ['쉬움', '기본', '중급', '고급', '최고난도'];

            const html = data.difficulty_breakdown.map(item => {
                const label = difficultyLabels[item.difficulty_level - 1] || item.difficulty_level;
                const accuracyRate = item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0;
                const avgScore = Math.round(item.avg_score || 0);

                return `
                    <tr>
                        <td><span class="badge badge-primary">${label} (${item.difficulty_level})</span></td>
                        <td>${item.attempts}</td>
                        <td>${accuracyRate}%</td>
                        <td>${avgScore}</td>
                        <td>-</td>
                    </tr>
                `;
            }).join('');

            document.getElementById('detail-difficulty-tbody').innerHTML = html;
        } else {
            document.getElementById('detail-difficulty-tbody').innerHTML =
                '<tr><td colspan="5" class="text-center">데이터 없음</td></tr>';
        }

        // Recent sessions
        if (data.recent_sessions && data.recent_sessions.length > 0) {
            const html = data.recent_sessions.map(session => {
                const date = new Date(session.started_at);
                const timeStr = date.toLocaleString('ko-KR');
                const duration = Math.round(session.duration_seconds / 60);
                const score = Math.round(session.final_score || 0);
                const focus = Math.round(session.focus_score || 0);
                const accuracy = Math.round(session.accuracy_rate || 0);

                return `
                    <div class="activity-item">
                        <div class="flex-between">
                            <strong>${timeStr}</strong>
                            <span class="badge ${score >= 80 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-danger'}">
                                ${score}점
                            </span>
                        </div>
                        <div class="activity-meta">
                            학습 시간: ${duration}분 · 집중도: ${focus} · 정답률: ${accuracy}%
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('detail-recent-sessions').innerHTML = html;
        } else {
            document.getElementById('detail-recent-sessions').innerHTML =
                '<p class="text-center">세션 기록이 없습니다.</p>';
        }

        // Scroll to detail
        document.getElementById('student-detail').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Failed to load student detail:', error);
        alert('학생 정보 로딩 중 오류가 발생했습니다.');
    }
}

/**
 * Close student detail
 */
function closeStudentDetail() {
    document.getElementById('student-detail').classList.add('hidden');
}
