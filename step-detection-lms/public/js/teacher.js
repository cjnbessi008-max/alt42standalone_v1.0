/**
 * Step Detection LMS - Teacher Dashboard
 */

const API_BASE = '/api/v1';

const state = {
    students: [],
    currentStudentId: null
};

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'API request failed');
    }

    return result.data;
}

// Load Dashboard
async function loadDashboard() {
    try {
        const students = await apiCall('/students');
        state.students = students;

        // Calculate stats
        const totalStudents = students.length;
        const totalSolutions = students.reduce((sum, s) => sum + (s.total_solutions || 0), 0);
        const totalSuspicious = students.reduce((sum, s) => sum + (s.suspicious_solutions || 0), 0);
        const avgTrustScore = students.reduce((sum, s) => sum + (parseFloat(s.overall_trust_score) || 100), 0) / totalStudents;

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('totalSolutions').textContent = totalSolutions;
        document.getElementById('detectionRate').textContent = totalSolutions > 0
            ? Math.round((totalSuspicious / totalSolutions) * 100) + '%'
            : '0%';
        document.getElementById('avgTrustScore').textContent = Math.round(avgTrustScore);

        // Render student table
        renderStudentTable(students);

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        alert('대시보드를 불러올 수 없습니다.');
    }
}

// Render Student Table
function renderStudentTable(students) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    students.forEach(student => {
        const trustScore = parseFloat(student.overall_trust_score) || 100;
        const trustClass = trustScore >= 85 ? 'trust-high' : trustScore >= 60 ? 'trust-medium' : 'trust-low';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.full_name}</td>
            <td>${student.grade_level || '-'}</td>
            <td>${student.total_solutions || 0}</td>
            <td>${student.suspicious_solutions || 0}</td>
            <td><span class="trust-badge ${trustClass}">${Math.round(trustScore)}</span></td>
            <td>${trustScore >= 85 ? '✅ 정상' : trustScore >= 60 ? '⚠️ 주의' : '❌ 검토필요'}</td>
            <td><button class="btn-secondary" onclick="viewStudent(${student.id})">상세보기</button></td>
        `;
        tbody.appendChild(row);
    });
}

// View Student Detail
async function viewStudent(studentId) {
    try {
        state.currentStudentId = studentId;

        const student = await apiCall(`/students/${studentId}`);
        const trustProfile = await apiCall(`/students/${studentId}/trust-profile`);
        const detections = await apiCall(`/detections/student/${studentId}`);

        // Show student detail screen
        document.getElementById('dashboardOverview').classList.remove('active');
        document.getElementById('studentDetail').classList.add('active');

        // Display student info
        document.getElementById('studentName').textContent = `${student.full_name} (${student.grade_level || '학년 미정'})`;

        document.getElementById('studentTotalSolutions').textContent = trustProfile.total_solutions || 0;
        document.getElementById('studentSuspicious').textContent = trustProfile.suspicious_solutions || 0;
        document.getElementById('studentTrustScore').textContent = Math.round(trustProfile.overall_trust_score || 100);

        // Calculate average score from recent solutions
        if (student.recent_solutions && student.recent_solutions.length > 0) {
            const avgScore = student.recent_solutions.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0) / student.recent_solutions.length;
            document.getElementById('studentAvgScore').textContent = Math.round(avgScore);
        } else {
            document.getElementById('studentAvgScore').textContent = '-';
        }

        // Detection breakdown
        renderDetectionBreakdown(trustProfile.detection_breakdown);

        // Recent solutions
        renderRecentSolutions(student.recent_solutions);

        // Detection history
        renderDetectionHistory(detections);

    } catch (error) {
        console.error('Failed to load student details:', error);
        alert('학생 정보를 불러올 수 없습니다.');
    }
}

function renderDetectionBreakdown(breakdown) {
    const container = document.getElementById('detectionBreakdown');
    container.innerHTML = '';

    const typeNames = {
        'time_anomaly': '⏱️ 시간 이상',
        'logical_inconsistency': '🔗 논리적 불일치',
        'sequence_violation': '📝 순서 위반',
        'hint_dependency': '💡 힌트 의존'
    };

    if (!breakdown || breakdown.length === 0) {
        container.innerHTML = '<p>탐지된 이상 패턴이 없습니다.</p>';
        return;
    }

    breakdown.forEach(item => {
        const card = document.createElement('div');
        card.className = 'stat-item';
        card.innerHTML = `
            <div class="stat-value">${item.count}</div>
            <div class="stat-label">${typeNames[item.detection_type] || item.detection_type}</div>
            <div style="font-size: 0.9rem; color: #7F8C8D;">평균 신뢰도: ${Math.round(item.avg_confidence)}%</div>
        `;
        container.appendChild(card);
    });
}

function renderRecentSolutions(solutions) {
    const container = document.getElementById('recentSolutions');
    container.innerHTML = '';

    if (!solutions || solutions.length === 0) {
        container.innerHTML = '<p>풀이 기록이 없습니다.</p>';
        return;
    }

    solutions.forEach(solution => {
        const card = document.createElement('div');
        card.className = 'detection-card';

        const date = new Date(solution.started_at).toLocaleString('ko-KR');
        const scoreClass = solution.score >= 80 ? 'trust-high' : solution.score >= 60 ? 'trust-medium' : 'trust-low';

        card.innerHTML = `
            <h4>${solution.problem_title}
                <span class="trust-badge ${scoreClass}">점수: ${solution.score || 0}</span>
            </h4>
            <p>제출: ${date} | 상태: ${solution.status === 'submitted' ? '완료' : '진행중'}</p>
            <button class="btn-secondary" onclick="viewSolution(${solution.id})">풀이 상세</button>
        `;
        container.appendChild(card);
    });
}

function renderDetectionHistory(detections) {
    const container = document.getElementById('detectionHistory');
    container.innerHTML = '';

    if (!detections || detections.length === 0) {
        container.innerHTML = '<p>탐지된 이상 패턴이 없습니다.</p>';
        return;
    }

    const typeNames = {
        'time_anomaly': '⏱️ 시간 이상',
        'logical_inconsistency': '🔗 논리적 불일치',
        'sequence_violation': '📝 순서 위반',
        'hint_dependency': '💡 힌트 의존'
    };

    detections.forEach(detection => {
        const card = document.createElement('div');
        card.className = `detection-card ${detection.severity}`;

        const date = new Date(detection.detected_at).toLocaleString('ko-KR');

        card.innerHTML = `
            <h4>${typeNames[detection.detection_type] || detection.detection_type}
                <span class="confidence">신뢰도: ${detection.confidence_score}%</span>
                <span class="confidence" style="background: ${getSeverityColor(detection.severity)}; color: white;">
                    ${getSeverityText(detection.severity)}
                </span>
            </h4>
            <p>${detection.description}</p>
            <p style="font-size: 0.9rem; color: #7F8C8D;">문제: ${detection.problem_title} | 탐지: ${date}</p>
        `;
        container.appendChild(card);
    });
}

function getSeverityColor(severity) {
    const colors = {
        'critical': '#E74C3C',
        'high': '#E67E22',
        'medium': '#F39C12',
        'low': '#95A5A6'
    };
    return colors[severity] || '#95A5A6';
}

function getSeverityText(severity) {
    const texts = {
        'critical': '매우 심각',
        'high': '심각',
        'medium': '주의',
        'low': '낮음'
    };
    return texts[severity] || severity;
}

async function viewSolution(solutionId) {
    try {
        const solution = await apiCall(`/solutions/${solutionId}`);

        const detailHtml = `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3>풀이 상세</h3>
                <p><strong>문제:</strong> ${solution.problem_title}</p>
                <p><strong>점수:</strong> ${solution.score}</p>
                <p><strong>신뢰도:</strong> ${Math.round(solution.trust_score)}</p>
                <p><strong>소요 시간:</strong> ${Math.floor(solution.total_time_seconds / 60)}분 ${solution.total_time_seconds % 60}초</p>

                <h4>단계별 제출</h4>
                ${solution.step_submissions.map((step, i) => `
                    <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
                        <strong>Step ${i + 1}: ${step.display_name}</strong><br>
                        입력: ${JSON.stringify(step.student_input)}<br>
                        소요 시간: ${step.time_spent_seconds}초 |
                        힌트 사용: ${step.hint_used ? '✅' : '❌'}
                    </div>
                `).join('')}
            </div>
        `;

        alert('풀이 상세 정보를 새 창에서 표시합니다.');
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>풀이 상세</title>
                <link rel="stylesheet" href="css/style.css">
            </head>
            <body>
                <div class="container">${detailHtml}</div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Failed to load solution:', error);
        alert('풀이 정보를 불러올 수 없습니다.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    document.getElementById('backToDashboard').addEventListener('click', () => {
        document.getElementById('studentDetail').classList.remove('active');
        document.getElementById('dashboardOverview').classList.add('active');
    });
});
