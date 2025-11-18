/**
 * Prerequisite Checker - Frontend Application
 */

const API_BASE = 'api.php';

// Initialize on page load
$(document).ready(function() {
    checkSystemStatus();
    loadConcepts();
    loadCourses();
    initializeEventHandlers();
});

/**
 * Check system and Moodle connection status
 */
function checkSystemStatus() {
    $.when(
        $.get(`${API_BASE}/test`),
        $.get(`${API_BASE}/moodle/test`)
    ).done(function(apiResponse, moodleResponse) {
        const api = apiResponse[0];
        const moodle = moodleResponse[0];

        const statusHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="alert alert-success mb-0">
                        <i class="fas fa-check-circle"></i> <strong>API 상태:</strong> ${api.message}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="alert ${moodle.connected ? 'alert-success' : 'alert-danger'} mb-0">
                        <i class="fas ${moodle.connected ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <strong>Moodle 연결:</strong> ${moodle.message}
                    </div>
                </div>
            </div>
        `;

        $('#systemStatus').html(statusHtml);
    }).fail(function() {
        $('#systemStatus').html(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 시스템 상태를 확인할 수 없습니다.
            </div>
        `);
    });
}

/**
 * Load all knowledge concepts
 */
function loadConcepts() {
    $.get(`${API_BASE}/concepts`, function(concepts) {
        // Populate concepts table
        let tableHtml = '';
        concepts.forEach(concept => {
            tableHtml += `
                <tr>
                    <td><strong>${concept.concept_name_ko}</strong></td>
                    <td>${concept.concept_name}</td>
                    <td><span class="badge badge-info">${concept.grade_level || 'N/A'}</span></td>
                    <td>${renderDifficultyBadge(concept.difficulty_level)}</td>
                    <td><span class="badge badge-secondary" id="prereq-count-${concept.id}">-</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewPrerequisites(${concept.id})">
                            <i class="fas fa-sitemap"></i> 보기
                        </button>
                    </td>
                </tr>
            `;
        });
        $('#conceptsTableBody').html(tableHtml || '<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>');

        // Populate concept select
        let selectHtml = '<option value="">개념을 선택하세요...</option>';
        concepts.forEach(concept => {
            selectHtml += `<option value="${concept.id}">${concept.concept_name_ko} (${concept.concept_name})</option>`;
        });
        $('#conceptSelect').html(selectHtml);

        // Load prerequisite counts
        concepts.forEach(concept => {
            loadPrerequisiteCount(concept.id);
        });
    }).fail(function() {
        $('#conceptsTableBody').html('<tr><td colspan="6" class="text-center text-danger">로딩 실패</td></tr>');
    });
}

/**
 * Load prerequisite count for a concept
 */
function loadPrerequisiteCount(conceptId) {
    $.get(`${API_BASE}/concept/${conceptId}`, function(data) {
        const count = data.prerequisites ? data.prerequisites.length : 0;
        $(`#prereq-count-${conceptId}`).text(count);
    });
}

/**
 * Load Moodle courses
 */
function loadCourses() {
    $.get(`${API_BASE}/moodle/courses`, function(courses) {
        let selectHtml = '<option value="">코스를 선택하세요...</option>';
        courses.forEach(course => {
            selectHtml += `<option value="${course.id}">${course.fullname || course.shortname}</option>`;
        });
        $('#courseSelect').html(selectHtml);
    }).fail(function() {
        $('#courseSelect').html('<option value="">코스 로딩 실패</option>');
    });
}

/**
 * Initialize event handlers
 */
function initializeEventHandlers() {
    // Check prerequisites form
    $('#checkPrerequisitesForm').on('submit', function(e) {
        e.preventDefault();
        const studentId = $('#studentId').val();
        const conceptId = $('#conceptSelect').val();

        if (!studentId || !conceptId) {
            alert('학생 ID와 개념을 모두 선택해주세요.');
            return;
        }

        checkPrerequisites(studentId, conceptId);
    });

    // Assess course form
    $('#assessCourseForm').on('submit', function(e) {
        e.preventDefault();
        const courseId = $('#courseSelect').val();

        if (!courseId) {
            alert('코스를 선택해주세요.');
            return;
        }

        if (confirm('전체 학생을 평가하시겠습니까? 시간이 걸릴 수 있습니다.')) {
            assessCourse(courseId);
        }
    });
}

/**
 * Check prerequisites for a student
 */
function checkPrerequisites(studentId, conceptId) {
    $('#resultContent').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> 확인 중...</div>');
    $('#prerequisiteResults').show();

    $.get(`${API_BASE}/student/${studentId}/concept/${conceptId}/check`, function(result) {
        let html = '';

        if (result.ready) {
            html = `
                <div class="result-card ready fade-in">
                    <h5 class="text-success"><i class="fas fa-check-circle"></i> 준비 완료!</h5>
                    <p>이 학생은 해당 개념을 학습할 준비가 되었습니다.</p>
                </div>
            `;

            if (result.satisfied && result.satisfied.length > 0) {
                html += '<h6 class="mt-3">충족된 전제지식:</h6>';
                result.satisfied.forEach(item => {
                    html += renderPrerequisiteItem(item, 'success');
                });
            }
        } else {
            html = `
                <div class="result-card missing fade-in">
                    <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> 준비 부족</h5>
                    <p>다음 전제지식이 부족합니다:</p>
                </div>
            `;

            if (result.missing && result.missing.length > 0) {
                html += '<h6 class="mt-3">부족한 전제지식 (필수):</h6>';
                result.missing.forEach(item => {
                    html += renderPrerequisiteItem(item, 'danger');
                });
            }

            if (result.weak && result.weak.length > 0) {
                html += '<h6 class="mt-3">약한 전제지식 (권장):</h6>';
                result.weak.forEach(item => {
                    html += renderPrerequisiteItem(item, 'warning');
                });
            }
        }

        $('#resultContent').html(html);
    }).fail(function() {
        $('#resultContent').html('<div class="alert alert-danger">확인 실패. 학생 ID를 확인해주세요.</div>');
    });
}

/**
 * Render prerequisite item
 */
function renderPrerequisiteItem(item, type) {
    const percent = (item.current_mastery * 100).toFixed(0);
    const required = (item.required_mastery * 100).toFixed(0);
    const gap = (item.gap * 100).toFixed(0);

    return `
        <div class="card mb-2 border-${type}">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${item.concept_name_ko}</strong>
                        <span class="badge importance-${item.importance} ml-2">${item.importance}</span>
                        <br>
                        <small class="text-muted">${item.concept_name}</small>
                    </div>
                    <div class="text-right">
                        <div><strong>${percent}%</strong> <small>/ ${required}%</small></div>
                        ${gap > 0 ? `<small class="text-${type}">부족: ${gap}%</small>` : ''}
                    </div>
                </div>
                <div class="progress mt-2" style="height: 20px;">
                    <div class="progress-bar bg-${type}" style="width: ${percent}%">${percent}%</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Assess entire course
 */
function assessCourse(courseId) {
    $('#assessmentContent').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> 평가 중...</div>');
    $('#assessmentResults').show();

    $.ajax({
        url: `${API_BASE}/assess/course`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ course_id: parseInt(courseId) }),
        success: function(result) {
            const html = `
                <div class="alert alert-success fade-in">
                    <h6><i class="fas fa-check-circle"></i> 평가 완료</h6>
                    <ul class="mb-0">
                        <li>전체 학생: <strong>${result.total_students}</strong></li>
                        <li>평가 성공: <strong class="text-success">${result.assessed}</strong></li>
                        <li>평가 실패: <strong class="text-danger">${result.failed}</strong></li>
                    </ul>
                </div>
            `;
            $('#assessmentContent').html(html);

            // Reload concepts to update data
            setTimeout(() => {
                loadConcepts();
            }, 1000);
        },
        error: function() {
            $('#assessmentContent').html('<div class="alert alert-danger">평가 실패</div>');
        }
    });
}

/**
 * View prerequisites for a concept
 */
function viewPrerequisites(conceptId) {
    $('#prerequisiteModalBody').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div>');
    $('#prerequisiteModal').modal('show');

    $.get(`${API_BASE}/concept/${conceptId}/tree`, function(data) {
        const concept = data.concept;
        const tree = data.prerequisite_tree;

        let html = `
            <h5>${concept.concept_name_ko} (${concept.concept_name})</h5>
            <p class="text-muted">${concept.description || '설명 없음'}</p>
            <hr>
        `;

        if (tree && tree.length > 0) {
            html += '<h6>전제지식 트리:</h6>';
            html += renderPrerequisiteTree(tree);
        } else {
            html += '<p class="text-muted">전제지식이 없습니다.</p>';
        }

        $('#prerequisiteModalBody').html(html);
    }).fail(function() {
        $('#prerequisiteModalBody').html('<div class="alert alert-danger">로딩 실패</div>');
    });
}

/**
 * Render prerequisite tree
 */
function renderPrerequisiteTree(tree, level = 0) {
    let html = '<ul class="concept-tree">';

    tree.forEach(item => {
        html += `
            <li>
                <strong>${item.concept_name_ko}</strong>
                <span class="badge importance-${item.importance} ml-2">${item.importance}</span>
                <br>
                <small class="text-muted">${item.concept_name} - 최소 숙달: ${(item.minimum_mastery_level * 100).toFixed(0)}%</small>
                ${item.children && item.children.length > 0 ? renderPrerequisiteTree(item.children, level + 1) : ''}
            </li>
        `;
    });

    html += '</ul>';
    return html;
}

/**
 * Render difficulty badge
 */
function renderDifficultyBadge(level) {
    const colors = {
        1: 'success',
        2: 'info',
        3: 'primary',
        4: 'warning',
        5: 'danger'
    };
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
    return `<span class="badge badge-${colors[level] || 'secondary'}">${stars}</span>`;
}
