/**
 * Teacher Dashboard JavaScript
 */

const API_BASE = '../../backend/api.php';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

// Refresh data
function refreshData() {
    loadDashboardData();
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load dashboard stats
        const dashboardResponse = await fetch(`${API_BASE}/dashboard/teacher`);
        const dashboardData = await dashboardResponse.json();

        // Update stats
        updateStats(dashboardData.stats);

        // Update alerts
        updateAlerts(dashboardData.recent_alerts);

        // Update trouble concepts
        updateTroubleConcepts(dashboardData.trouble_concepts);

        // Load students
        const studentsResponse = await fetch(`${API_BASE}/students`);
        const studentsData = await studentsResponse.json();
        updateStudents(studentsData.students);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// Update statistics cards
function updateStats(stats) {
    document.getElementById('totalStudents').textContent = stats.total_students || 0;
    document.getElementById('totalConcepts').textContent = stats.total_concepts || 0;
    document.getElementById('studentsNeedingAttention').textContent =
        stats.students_with_unstable_concepts || 0;
    document.getElementById('unstableInstances').textContent =
        stats.total_unstable_instances || 0;
}

// Update recent alerts
function updateAlerts(alerts) {
    const container = document.getElementById('alertsContainer');

    if (!alerts || alerts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>현재 경고가 없습니다. 모든 학생이 안정적으로 학습하고 있습니다!</p>
            </div>
        `;
        return;
    }

    let html = '';
    alerts.forEach(alert => {
        const severityClass = alert.stability_score < 40 ? 'danger' : 'warning';
        const icon = alert.stability_score < 40 ? '🔴' : '⚠️';

        html += `
            <div class="alert alert-${severityClass}">
                <span class="alert-icon">${icon}</span>
                <div style="flex: 1;">
                    <strong>${alert.student_name}</strong>님이
                    <strong>${alert.concept_name}</strong> 개념을 불안정하게 이해하고 있습니다.
                    <br>
                    <small>
                        안정성 점수: ${formatScore(alert.stability_score)} |
                        정확도: ${formatPercentage(alert.accuracy_rate)} |
                        권장 조치: ${getActionText(alert.recommended_action)}
                    </small>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Update students table
function updateStudents(students) {
    const container = document.getElementById('studentsContainer');

    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>등록된 학생이 없습니다.</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>학년</th>
                    <th>불안정한 개념 수</th>
                    <th>상태</th>
                    <th>작업</th>
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach(student => {
        const unstableCount = parseInt(student.unstable_count) || 0;
        const statusBadge = getStatusBadge(unstableCount);

        html += `
            <tr>
                <td><strong>${student.name}</strong></td>
                <td>${student.grade_level || '-'}</td>
                <td>${unstableCount}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewStudentDetails(${student.id})">
                        상세보기
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Update trouble concepts
function updateTroubleConcepts(concepts) {
    const container = document.getElementById('conceptsContainer');

    if (!concepts || concepts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>현재 주의가 필요한 개념이 없습니다!</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>개념</th>
                    <th>어려움을 겪는 학생 수</th>
                    <th>평균 안정성 점수</th>
                    <th>작업</th>
                </tr>
            </thead>
            <tbody>
    `;

    concepts.forEach(concept => {
        const avgStability = parseFloat(concept.avg_stability);

        html += `
            <tr>
                <td><strong>${concept.name}</strong></td>
                <td>${concept.struggling_count}명</td>
                <td>
                    <div class="stability-score">
                        <span>${formatScore(avgStability)}</span>
                        ${renderStabilityBar(avgStability)}
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="viewConceptDetails(${concept.id})">
                        상세보기
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// View student details
async function viewStudentDetails(studentId) {
    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`);
        const data = await response.json();

        let details = `학생: ${data.student.name}\n학년: ${data.student.grade_level}\n\n`;
        details += `불안정한 개념:\n`;

        if (data.unstable_concepts.length === 0) {
            details += '없음 - 모든 개념을 안정적으로 이해하고 있습니다!';
        } else {
            data.unstable_concepts.forEach(concept => {
                details += `\n• ${concept.concept_name}\n`;
                details += `  안정성: ${formatScore(concept.stability_score)}\n`;
                details += `  정확도: ${formatPercentage(concept.accuracy_rate)}\n`;
                details += `  권장 조치: ${getActionText(concept.recommended_action)}\n`;
            });
        }

        alert(details);
    } catch (error) {
        console.error('Error loading student details:', error);
        alert('학생 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// View concept details
async function viewConceptDetails(conceptId) {
    try {
        const response = await fetch(`${API_BASE}/concepts/${conceptId}`);
        const data = await response.json();

        let details = `개념: ${data.concept.name}\n설명: ${data.concept.description}\n\n`;
        details += `어려움을 겪는 학생:\n`;

        if (data.struggling_students.length === 0) {
            details += '없음 - 모든 학생이 이 개념을 잘 이해하고 있습니다!';
        } else {
            data.struggling_students.forEach(student => {
                details += `\n• ${student.student_name}\n`;
                details += `  안정성: ${formatScore(student.stability_score)}\n`;
                details += `  정확도: ${formatPercentage(student.accuracy_rate)}\n`;
            });
        }

        alert(details);
    } catch (error) {
        console.error('Error loading concept details:', error);
        alert('개념 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// Helper functions
function formatScore(score) {
    return `${parseFloat(score).toFixed(1)}점`;
}

function formatPercentage(value) {
    return `${parseFloat(value).toFixed(1)}%`;
}

function getStatusBadge(unstableCount) {
    if (unstableCount === 0) {
        return '<span class="badge badge-success">안정적</span>';
    } else if (unstableCount <= 2) {
        return '<span class="badge badge-warning">주의</span>';
    } else {
        return '<span class="badge badge-danger">위험</span>';
    }
}

function renderStabilityBar(score) {
    const level = score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
    return `
        <div class="stability-bar">
            <div class="stability-bar-fill ${level}" style="width: ${score}%"></div>
        </div>
    `;
}

function getActionText(action) {
    const actions = {
        'intensive_review': '집중 복습 필요',
        'guided_practice': '가이드된 연습 필요',
        'additional_practice': '추가 연습 필요',
        'monitor': '모니터링 계속'
    };
    return actions[action] || action;
}

function showError(message) {
    alert(message);
}
