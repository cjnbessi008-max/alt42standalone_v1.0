/**
 * Trap Detection LMS - Frontend Application
 * Main JavaScript file
 */

// API Base URL
const API_BASE = window.location.origin + '/api/';

// State
let currentQuestion = null;
let selectedOption = null;
let startTime = null;
let currentStudentId = 1;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadQuestion(1); // Load first question by default
    loadStudentRecommendations();
});

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            switchView(view);

            // Update active state
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Update student ID when input changes
    const studentIdInput = document.getElementById('student-id-input');
    if (studentIdInput) {
        studentIdInput.addEventListener('change', function() {
            currentStudentId = parseInt(this.value) || 1;
            loadStudentRecommendations();
        });
    }
}

/**
 * Switch between views
 */
function switchView(viewName) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Load data based on view
    if (viewName === 'teacher') {
        loadTeacherDashboard();
    } else if (viewName === 'analytics') {
        // Analytics loaded on demand
    } else if (viewName === 'student') {
        loadQuestion(1);
        loadStudentRecommendations();
    }
}

/**
 * Load question
 */
async function loadQuestion(questionId) {
    const container = document.getElementById('question-container');
    container.innerHTML = '<div class="loading">문제를 불러오는 중...</div>';

    try {
        const response = await fetch(`${API_BASE}get-question.php?id=${questionId}`);
        const result = await response.json();

        if (result.success) {
            currentQuestion = result.data;
            startTime = Date.now();
            renderQuestion(result.data);
        } else {
            container.innerHTML = `<div class="error">❌ ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Error loading question:', error);
        container.innerHTML = '<div class="error">❌ 문제를 불러오는데 실패했습니다.</div>';
    }
}

/**
 * Render question
 */
function renderQuestion(question) {
    const container = document.getElementById('question-container');

    let html = `
        <div class="question-text">${question.question_text}</div>
        <ul class="options-list">
    `;

    if (question.options && question.options.length > 0) {
        question.options.forEach((option, index) => {
            html += `
                <li class="option-item" data-option-id="${option.id}" onclick="selectOption(${option.id})">
                    <strong>${String.fromCharCode(65 + index)}.</strong> ${option.option_text}
                </li>
            `;
        });
    }

    html += `
        </ul>
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="submitAnswer()" id="submit-btn" disabled>답안 제출</button>
        </div>
    `;

    container.innerHTML = html;

    // Hide previous results
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('trap-info-container').style.display = 'none';
}

/**
 * Select option
 */
function selectOption(optionId) {
    selectedOption = optionId;

    // Update UI
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
    });

    document.querySelector(`[data-option-id="${optionId}"]`).classList.add('selected');

    // Enable submit button
    document.getElementById('submit-btn').disabled = false;
}

/**
 * Submit answer
 */
async function submitAnswer() {
    if (!selectedOption || !currentQuestion) {
        alert('답을 선택해주세요.');
        return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    try {
        const response = await fetch(`${API_BASE}submit-answer.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentStudentId,
                question_id: currentQuestion.id,
                selected_option_id: selectedOption,
                time_spent: timeSpent
            })
        });

        const result = await response.json();

        if (result.success) {
            displayResult(result.data);
            loadStudentRecommendations(); // Refresh recommendations
        } else {
            alert('오류: ' + result.error);
            submitBtn.disabled = false;
            submitBtn.textContent = '답안 제출';
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        alert('답안 제출에 실패했습니다.');
        submitBtn.disabled = false;
        submitBtn.textContent = '답안 제출';
    }
}

/**
 * Display result
 */
function displayResult(data) {
    const resultContainer = document.getElementById('result-container');
    const trapContainer = document.getElementById('trap-info-container');

    // Display result
    resultContainer.className = 'result-box ' + (data.is_correct ? 'correct' : 'incorrect');
    resultContainer.style.display = 'block';

    let resultHTML = `
        <div class="result-icon">${data.is_correct ? '✅' : '❌'}</div>
        <h3>${data.is_correct ? '정답입니다!' : '오답입니다.'}</h3>
    `;

    resultContainer.innerHTML = resultHTML;

    // Display trap information if any
    if (data.traps_detected && data.traps_detected.length > 0) {
        trapContainer.style.display = 'block';

        let trapHTML = `
            <h3>⚠️ 함정을 발견했습니다!</h3>
            <p>다음 내용을 참고하여 다시 생각해보세요:</p>
        `;

        data.traps_detected.forEach(trap => {
            trapHTML += `
                <div class="trap-item">
                    <h4>🎯 ${trap.description}</h4>
                    <p><strong>설명:</strong> ${trap.explanation}</p>
                    ${trap.hint ? `<p><strong>힌트:</strong> ${trap.hint}</p>` : ''}
                </div>
            `;
        });

        // Display interventions if any
        if (data.interventions && data.interventions.length > 0) {
            trapHTML += '<h4>💡 추천 학습 자료:</h4>';
            data.interventions.forEach(intervention => {
                trapHTML += `
                    <div class="intervention-item">
                        <strong>${intervention.title}</strong>
                        <p>${intervention.content}</p>
                    </div>
                `;
            });
        }

        trapHTML += `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="loadQuestion(${currentQuestion.id})">다시 풀어보기</button>
            </div>
        `;

        trapContainer.innerHTML = trapHTML;
    } else {
        trapContainer.style.display = 'none';
    }

    // Add next question button if correct
    if (data.is_correct) {
        resultContainer.innerHTML += `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="loadQuestion(${currentQuestion.id + 1})">다음 문제</button>
            </div>
        `;
    }
}

/**
 * Load student recommendations
 */
async function loadStudentRecommendations() {
    const container = document.getElementById('student-recommendations');
    container.innerHTML = '<div class="loading">통계를 불러오는 중...</div>';

    try {
        const response = await fetch(`${API_BASE}student-recommendations.php?student_id=${currentStudentId}`);
        const result = await response.json();

        if (result.success) {
            renderStudentRecommendations(result.data);
        } else {
            container.innerHTML = `<div class="error">데이터 로드 실패</div>`;
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        container.innerHTML = '<div class="error">데이터 로드 실패</div>';
    }
}

/**
 * Render student recommendations
 */
function renderStudentRecommendations(data) {
    const container = document.getElementById('student-recommendations');

    const stats = data.statistics;

    let html = `
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.total_incidents || 0}</div>
                <div class="stat-label">총 함정</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.resolved_count || 0}</div>
                <div class="stat-label">해결됨</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.unresolved_count || 0}</div>
                <div class="stat-label">미해결</div>
            </div>
        </div>
    `;

    if (data.focus_areas && data.focus_areas.length > 0) {
        html += '<h3>집중 학습 영역</h3><ul class="trap-list">';
        data.focus_areas.forEach(area => {
            html += `
                <li class="trap-item">
                    <h4>${area.area}</h4>
                    <p>발생 횟수: ${area.incident_count}회</p>
                    <span class="trap-badge ${area.priority}">${area.priority === 'high' ? '높음' : '중간'}</span>
                </li>
            `;
        });
        html += '</ul>';
    } else {
        html += '<p>아직 함정에 빠진 적이 없습니다. 계속 열심히 하세요! 🎉</p>';
    }

    container.innerHTML = html;
}

/**
 * Load teacher dashboard
 */
async function loadTeacherDashboard() {
    try {
        const response = await fetch(`${API_BASE}teacher-dashboard.php`);
        const result = await response.json();

        if (result.success) {
            renderTeacherDashboard(result.data);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/**
 * Render teacher dashboard
 */
function renderTeacherDashboard(data) {
    // Render summary
    const summaryContainer = document.getElementById('dashboard-summary');
    const summary = data.summary;

    summaryContainer.innerHTML = `
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-value">${summary.total_incidents || 0}</div>
                <div class="stat-label">총 발생</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.affected_students || 0}</div>
                <div class="stat-label">영향받은 학생</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.active_traps || 0}</div>
                <div class="stat-label">활성 함정</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.resolved_incidents || 0}</div>
                <div class="stat-label">해결됨</div>
            </div>
        </div>
    `;

    // Render common traps
    const trapsContainer = document.getElementById('common-traps');
    if (data.most_common_traps && data.most_common_traps.length > 0) {
        let html = '<ul class="trap-list">';
        data.most_common_traps.slice(0, 5).forEach(trap => {
            html += `
                <li class="trap-item">
                    <h4>${trap.trap_description}</h4>
                    <p>발생: ${trap.incident_count}회 | 학생: ${trap.affected_students}명</p>
                    <span class="trap-badge ${trap.severity}">${trap.severity}</span>
                    <span class="trap-badge">${trap.trap_type}</span>
                </li>
            `;
        });
        html += '</ul>';
        trapsContainer.innerHTML = html;
    } else {
        trapsContainer.innerHTML = '<p>아직 데이터가 없습니다.</p>';
    }

    // Render recent incidents
    const incidentsContainer = document.getElementById('recent-incidents');
    if (data.recent_incidents && data.recent_incidents.length > 0) {
        let html = '<div class="incident-list">';
        data.recent_incidents.slice(0, 10).forEach(incident => {
            const date = new Date(incident.created_at);
            html += `
                <div class="incident-item">
                    <strong>${incident.full_name || incident.username}</strong> - ${incident.trap_description}
                    <div class="timestamp">${date.toLocaleString('ko-KR')}</div>
                </div>
            `;
        });
        html += '</div>';
        incidentsContainer.innerHTML = html;
    } else {
        incidentsContainer.innerHTML = '<p>최근 발생 내역이 없습니다.</p>';
    }

    // Render help requests
    const helpContainer = document.getElementById('help-requests');
    if (data.help_requests && data.help_requests.length > 0) {
        let html = '<ul>';
        data.help_requests.forEach(request => {
            html += `
                <li>${request.full_name} - ${request.trap_description}</li>
            `;
        });
        html += '</ul>';
        helpContainer.innerHTML = html;
    } else {
        helpContainer.innerHTML = '<p>도움 요청이 없습니다.</p>';
    }
}

/**
 * Analyze question
 */
async function analyzeQuestion() {
    const questionId = document.getElementById('analyze-question-id').value;
    if (!questionId) {
        alert('문제 ID를 입력하세요.');
        return;
    }

    // This would require a new API endpoint for question analysis
    alert('문제 분석 기능은 곧 추가될 예정입니다.');
}
