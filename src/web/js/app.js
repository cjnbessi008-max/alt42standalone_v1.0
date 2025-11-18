/**
 * Concept Avoidance Detection System
 * Frontend JavaScript Application
 */

// Configuration
const API_BASE_URL = '../api/index.php';

// Global state
let currentPatternId = null;
let dashboardData = null;

// Initialize application
$(document).ready(function() {
    console.log('Initializing Concept Avoidance Detection System...');

    // Load dashboard data
    loadDashboard();

    // Set up event listeners
    setupEventListeners();

    // Auto-refresh every 5 minutes
    setInterval(loadDashboard, 300000);
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Sync button
    $('#syncBtn').on('click', function(e) {
        e.preventDefault();
        runSync();
    });

    // Detect button
    $('#detectBtn').on('click', function() {
        runDetection();
    });

    // Resolve pattern button
    $('#resolvePatternBtn').on('click', function() {
        if (currentPatternId) {
            resolvePattern(currentPatternId);
        }
    });
}

/**
 * Load dashboard data
 */
function loadDashboard() {
    console.log('Loading dashboard...');

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/dashboard`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                dashboardData = response.data;
                renderDashboard(response.data);
            } else {
                showError('Failed to load dashboard: ' + response.error.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Dashboard load error:', error);
            showError('Error loading dashboard: ' + error);
        }
    });
}

/**
 * Render dashboard with data
 */
function renderDashboard(data) {
    console.log('Rendering dashboard...', data);

    // Update stats
    $('#stat-students').text(data.total_students || 0);
    $('#stat-patterns').text(data.active_patterns || 0);
    $('#stat-critical').text(data.critical_patterns || 0);
    $('#stat-concepts').text(data.total_concepts || 0);

    // Render charts
    if (data.statistics) {
        renderTypeChart(data.statistics.by_type || []);
        renderSeverityChart(data.statistics.by_severity || []);
    }

    // Render recent patterns
    renderRecentPatterns(data.recent_patterns || []);

    // Render problematic concepts
    renderProblematicConcepts(data.statistics?.problematic_concepts || []);

    // Render students at risk
    renderStudentsAtRisk(data.statistics?.students_at_risk || []);

    // Render sync status
    renderSyncStatus(data.last_sync);

    hideLoading();
}

/**
 * Render type distribution chart
 */
function renderTypeChart(data) {
    const ctx = document.getElementById('typeChart').getContext('2d');

    const labels = {
        'low_accuracy': '낮은 정답률',
        'quick_skip': '빠른 건너뛰기',
        'pattern_avoid': '패턴 회피',
        'time_abnormal': '비정상 시간',
        'mixed': '복합 유형'
    };

    const chartData = {
        labels: data.map(d => labels[d.avoidance_type] || d.avoidance_type),
        datasets: [{
            data: data.map(d => d.count),
            backgroundColor: [
                '#e74c3c',
                '#f39c12',
                '#9b59b6',
                '#3498db',
                '#34495e'
            ]
        }]
    };

    if (window.typeChartInstance) {
        window.typeChartInstance.destroy();
    }

    window.typeChartInstance = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Render severity distribution chart
 */
function renderSeverityChart(data) {
    const ctx = document.getElementById('severityChart').getContext('2d');

    const labels = {
        'critical': '긴급',
        'high': '높음',
        'medium': '중간',
        'low': '낮음'
    };

    const colors = {
        'critical': '#dc3545',
        'high': '#fd7e14',
        'medium': '#ffc107',
        'low': '#17a2b8'
    };

    const chartData = {
        labels: data.map(d => labels[d.severity_level] || d.severity_level),
        datasets: [{
            label: '패턴 수',
            data: data.map(d => d.count),
            backgroundColor: data.map(d => colors[d.severity_level] || '#6c757d')
        }]
    };

    if (window.severityChartInstance) {
        window.severityChartInstance.destroy();
    }

    window.severityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Render recent patterns table
 */
function renderRecentPatterns(patterns) {
    const tbody = $('#recent-patterns-table');
    tbody.empty();

    if (patterns.length === 0) {
        tbody.html('<tr><td colspan="8" class="text-center no-data">감지된 패턴이 없습니다</td></tr>');
        return;
    }

    patterns.forEach(pattern => {
        const row = `
            <tr>
                <td>${formatDateTime(pattern.detection_date)}</td>
                <td>${pattern.moodle_user_id}</td>
                <td>${pattern.concept_name_ko || pattern.concept_name}</td>
                <td><span class="badge badge-type type-${pattern.avoidance_type}">${formatType(pattern.avoidance_type)}</span></td>
                <td><span class="badge severity-${pattern.severity_level}">${formatSeverity(pattern.severity_level)}</span></td>
                <td><strong>${pattern.confidence_score}%</strong></td>
                <td>${pattern.is_resolved ? '<span class="badge badge-success">해결됨</span>' : '<span class="badge badge-warning">미해결</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-info view-pattern" data-id="${pattern.id}">
                        <i class="fas fa-eye"></i> 상세
                    </button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });

    // Add click handlers
    $('.view-pattern').on('click', function() {
        const patternId = $(this).data('id');
        viewPatternDetails(patternId);
    });
}

/**
 * Render problematic concepts
 */
function renderProblematicConcepts(concepts) {
    const container = $('#problematic-concepts-list');
    container.empty();

    if (concepts.length === 0) {
        container.html('<div class="no-data">데이터가 없습니다</div>');
        return;
    }

    concepts.forEach((concept, index) => {
        const item = `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="list-item-title">
                            ${index + 1}. ${concept.concept_name_ko || concept.concept_name}
                        </div>
                        <div class="list-item-subtitle">
                            회피 학생 수: ${concept.student_count}명 | 평균 신뢰도: ${parseFloat(concept.avg_confidence).toFixed(1)}%
                        </div>
                    </div>
                    <div>
                        <span class="badge badge-danger">${concept.student_count}명</span>
                    </div>
                </div>
            </div>
        `;
        container.append(item);
    });
}

/**
 * Render students at risk
 */
function renderStudentsAtRisk(students) {
    const container = $('#students-at-risk-list');
    container.empty();

    if (students.length === 0) {
        container.html('<div class="no-data">데이터가 없습니다</div>');
        return;
    }

    students.forEach((student, index) => {
        const item = `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="list-item-title">
                            ${index + 1}. 학생 ID: ${student.moodle_user_id}
                        </div>
                        <div class="list-item-subtitle">
                            패턴 수: ${student.pattern_count}개 | 평균 신뢰도: ${parseFloat(student.avg_confidence).toFixed(1)}%
                        </div>
                    </div>
                    <div>
                        <span class="badge badge-warning">${student.pattern_count}개</span>
                    </div>
                </div>
            </div>
        `;
        container.append(item);
    });
}

/**
 * Render sync status
 */
function renderSyncStatus(sync) {
    const container = $('#sync-status');

    if (!sync) {
        container.html('<div class="no-data">동기화 기록이 없습니다</div>');
        return;
    }

    const statusClass = sync.sync_status === 'success' ? 'status-success' :
                       sync.sync_status === 'failed' ? 'status-failed' : 'status-started';

    const html = `
        <div class="sync-status">
            <div class="sync-status-item">
                <span class="sync-status-label">유형:</span>
                <span class="sync-status-value">${sync.sync_type}</span>
            </div>
            <div class="sync-status-item">
                <span class="sync-status-label">상태:</span>
                <span class="sync-status-value ${statusClass}">${sync.sync_status}</span>
            </div>
            <div class="sync-status-item">
                <span class="sync-status-label">시작 시간:</span>
                <span class="sync-status-value">${formatDateTime(sync.start_time)}</span>
            </div>
            <div class="sync-status-item">
                <span class="sync-status-label">처리된 레코드:</span>
                <span class="sync-status-value">${sync.records_processed || 0}</span>
            </div>
            ${sync.error_message ? `
                <div class="sync-status-item">
                    <span class="sync-status-label">에러:</span>
                    <span class="sync-status-value text-danger">${sync.error_message}</span>
                </div>
            ` : ''}
        </div>
    `;

    container.html(html);
}

/**
 * View pattern details
 */
function viewPatternDetails(patternId) {
    $.ajax({
        url: `${API_BASE_URL}/patterns/${patternId}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showPatternModal(response.data);
                currentPatternId = patternId;
            } else {
                showError('Failed to load pattern details');
            }
        },
        error: function() {
            showError('Error loading pattern details');
        }
    });
}

/**
 * Show pattern modal
 */
function showPatternModal(pattern) {
    const evidence = typeof pattern.evidence === 'string' ?
                    JSON.parse(pattern.evidence) : pattern.evidence;

    let evidenceHtml = '<div class="evidence-section"><h6>증거 데이터</h6>';
    for (let key in evidence) {
        evidenceHtml += `
            <div class="evidence-item">
                <span class="evidence-label">${key}:</span>
                <span class="evidence-value">${JSON.stringify(evidence[key])}</span>
            </div>
        `;
    }
    evidenceHtml += '</div>';

    const html = `
        <div>
            <h6>기본 정보</h6>
            <p><strong>학생 ID:</strong> ${pattern.moodle_user_id}</p>
            <p><strong>개념:</strong> ${pattern.concept_name_ko || pattern.concept_name} (${pattern.concept_code})</p>
            <p><strong>유형:</strong> <span class="badge badge-type type-${pattern.avoidance_type}">${formatType(pattern.avoidance_type)}</span></p>
            <p><strong>심각도:</strong> <span class="badge severity-${pattern.severity_level}">${formatSeverity(pattern.severity_level)}</span></p>
            <p><strong>신뢰도:</strong> ${pattern.confidence_score}%</p>
            <p><strong>감지일시:</strong> ${formatDateTime(pattern.detection_date)}</p>

            <h6 class="mt-3">학습 데이터</h6>
            <p><strong>총 시도:</strong> ${pattern.total_attempts || 0}회</p>
            <p><strong>정답률:</strong> ${pattern.accuracy_rate || 0}%</p>
            <p><strong>평균 응답 시간:</strong> ${pattern.avg_response_time || 0}초</p>

            ${evidenceHtml}
        </div>
    `;

    $('#pattern-details').html(html);
    $('#patternModal').modal('show');
}

/**
 * Run synchronization
 */
function runSync() {
    if (!confirm('Moodle 데이터를 동기화하시겠습니까?')) {
        return;
    }

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/sync`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ type: 'quiz_attempts' }),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showSuccess(`동기화 완료: ${response.data.processed}개 처리됨`);
                loadDashboard();
            } else {
                showError('동기화 실패: ' + response.error.message);
            }
        },
        error: function() {
            showError('동기화 중 오류 발생');
            hideLoading();
        }
    });
}

/**
 * Run detection
 */
function runDetection() {
    if (!confirm('모든 학생에 대해 개념 회피 감지를 실행하시겠습니까?')) {
        return;
    }

    showLoading();

    $.ajax({
        url: `${API_BASE_URL}/detection/run`,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showSuccess(`감지 완료: ${response.data.count}개의 패턴 발견`);
                loadDashboard();
            } else {
                showError('감지 실패: ' + response.error.message);
            }
        },
        error: function() {
            showError('감지 중 오류 발생');
            hideLoading();
        }
    });
}

/**
 * Resolve pattern
 */
function resolvePattern(patternId) {
    const notes = prompt('해결 노트를 입력하세요 (선택사항):');

    $.ajax({
        url: `${API_BASE_URL}/patterns/${patternId}/resolve`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ notes: notes }),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showSuccess('패턴이 해결됨으로 표시되었습니다');
                $('#patternModal').modal('hide');
                loadDashboard();
            } else {
                showError('패턴 업데이트 실패');
            }
        },
        error: function() {
            showError('패턴 업데이트 중 오류 발생');
        }
    });
}

/**
 * Utility functions
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR');
}

function formatType(type) {
    const types = {
        'low_accuracy': '낮은 정답률',
        'quick_skip': '빠른 건너뛰기',
        'pattern_avoid': '패턴 회피',
        'time_abnormal': '비정상 시간',
        'mixed': '복합'
    };
    return types[type] || type;
}

function formatSeverity(severity) {
    const severities = {
        'critical': '긴급',
        'high': '높음',
        'medium': '중간',
        'low': '낮음'
    };
    return severities[severity] || severity;
}

function showLoading() {
    // Could add a loading overlay here
    console.log('Loading...');
}

function hideLoading() {
    console.log('Loading complete');
}

function showError(message) {
    alert('오류: ' + message);
    hideLoading();
}

function showSuccess(message) {
    alert('성공: ' + message);
}
