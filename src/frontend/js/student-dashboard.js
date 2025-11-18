/**
 * Student Dashboard JavaScript
 */

const API_BASE = '../../backend/api.php';
let currentStudentId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadStudentsList();
});

// Load list of students for selection
async function loadStudentsList() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        const data = await response.json();

        const select = document.getElementById('studentSelect');
        select.innerHTML = '<option value="">학생을 선택하세요...</option>';

        data.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.grade_level || '학년 미지정'})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading students list:', error);
    }
}

// Load student data
async function loadStudentData() {
    const select = document.getElementById('studentSelect');
    currentStudentId = select.value;

    if (!currentStudentId) {
        document.getElementById('studentInfo').style.display = 'none';
        return;
    }

    document.getElementById('studentInfo').style.display = 'block';

    try {
        // Load student stability data
        const response = await fetch(`${API_BASE}/stability?student_id=${currentStudentId}`);
        const data = await response.json();

        updateStudentStats(data.unstable_concepts);
        updateReviewConcepts(data.unstable_concepts);
        updateProgressByConceptAllConcepts(currentStudentId);

    } catch (error) {
        console.error('Error loading student data:', error);
        showError('학생 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// Update student statistics
function updateStudentStats(unstableConcepts) {
    // For demo purposes, we'll estimate total concepts
    const unstableCount = unstableConcepts.length;

    // Estimate total concepts (in real app, this would come from API)
    const totalConceptsEstimate = unstableCount > 0 ? unstableCount * 2 : 6;
    const stableCount = totalConceptsEstimate - unstableCount;

    document.getElementById('totalConceptsLearned').textContent = totalConceptsEstimate;
    document.getElementById('stableConcepts').textContent = stableCount;
    document.getElementById('needsReviewConcepts').textContent = unstableCount;
}

// Update review concepts
function updateReviewConcepts(unstableConcepts) {
    const container = document.getElementById('reviewConceptsContainer');

    if (!unstableConcepts || unstableConcepts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <h3>잘하고 있어요!</h3>
                <p>현재 복습이 필요한 개념이 없습니다. 모든 개념을 안정적으로 이해하고 있어요!</p>
            </div>
        `;
        return;
    }

    let html = '';
    unstableConcepts.forEach(concept => {
        const urgency = concept.stability_score < 40 ? '높음' : '중간';
        const urgencyClass = concept.stability_score < 40 ? 'danger' : 'warning';

        html += `
            <div class="alert alert-${urgencyClass}">
                <div style="flex: 1;">
                    <h3 style="margin-bottom: 8px; font-size: 18px;">
                        ${concept.concept_name}
                    </h3>
                    <p style="margin-bottom: 8px;">
                        ${concept.concept_description || '이 개념을 다시 한번 복습해보세요.'}
                    </p>
                    <div style="display: flex; gap: 20px; margin-top: 10px;">
                        <div>
                            <strong>이해도:</strong>
                            <div class="stability-score">
                                <span>${formatScore(concept.stability_score)}</span>
                                ${renderStabilityBar(concept.stability_score)}
                            </div>
                        </div>
                        <div>
                            <strong>정확도:</strong> ${formatPercentage(concept.accuracy_rate)}
                        </div>
                        <div>
                            <strong>시도 횟수:</strong> ${concept.total_attempts}회
                        </div>
                        <div>
                            <strong>우선순위:</strong>
                            <span class="badge badge-${urgencyClass}">${urgency}</span>
                        </div>
                    </div>
                    <div style="margin-top: 12px;">
                        <strong>권장 학습 방법:</strong> ${getStudentActionText(concept.recommended_action)}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Update progress by concept (all concepts including stable ones)
async function updateProgressByConceptAllConcepts(studentId) {
    const container = document.getElementById('progressContainer');

    try {
        // Get all concepts
        const conceptsResponse = await fetch(`${API_BASE}/concepts`);
        const conceptsData = await conceptsResponse.json();

        // Get student's stability data
        const stabilityResponse = await fetch(`${API_BASE}/stability?student_id=${studentId}`);
        const stabilityData = await stabilityResponse.json();

        // Create a map of concept stability
        const stabilityMap = {};
        stabilityData.unstable_concepts.forEach(item => {
            stabilityMap[item.concept_id] = item;
        });

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>개념</th>
                        <th>이해도</th>
                        <th>정확도</th>
                        <th>시도 횟수</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Show only concepts the student has attempted (has stability data)
        const attemptedConcepts = conceptsData.concepts.filter(concept =>
            stabilityMap[concept.id] !== undefined
        );

        if (attemptedConcepts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>아직 학습한 개념이 없습니다. 문제를 풀어보세요!</p>
                </div>
            `;
            return;
        }

        attemptedConcepts.forEach(concept => {
            const stability = stabilityMap[concept.id];
            const statusBadge = getConceptStatusBadge(stability.stability_score);

            html += `
                <tr>
                    <td><strong>${concept.name}</strong></td>
                    <td>
                        <div class="stability-score">
                            <span>${formatScore(stability.stability_score)}</span>
                            ${renderStabilityBar(stability.stability_score)}
                        </div>
                    </td>
                    <td>${formatPercentage(stability.accuracy_rate)}</td>
                    <td>${stability.total_attempts}회</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading progress data:', error);
        container.innerHTML = '<p>데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// Helper functions
function formatScore(score) {
    return `${parseFloat(score).toFixed(1)}점`;
}

function formatPercentage(value) {
    return `${parseFloat(value).toFixed(1)}%`;
}

function getConceptStatusBadge(stabilityScore) {
    if (stabilityScore >= 60) {
        return '<span class="badge badge-success">✓ 잘 이해함</span>';
    } else if (stabilityScore >= 40) {
        return '<span class="badge badge-warning">⚠ 복습 필요</span>';
    } else {
        return '<span class="badge badge-danger">! 집중 학습 필요</span>';
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

function getStudentActionText(action) {
    const actions = {
        'intensive_review': '이 개념을 처음부터 다시 배워보세요. 기초부터 차근차근 복습이 필요해요.',
        'guided_practice': '선생님이나 부모님과 함께 연습 문제를 풀어보세요.',
        'additional_practice': '비슷한 문제를 더 풀어보면서 연습하세요.',
        'monitor': '잘하고 있어요! 계속 연습하면서 실력을 유지하세요.'
    };
    return actions[action] || action;
}

function showError(message) {
    alert(message);
}
