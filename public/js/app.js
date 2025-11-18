/**
 * Stat Story Mode - Main App JavaScript
 */

// API 기본 URL
const API_BASE_URL = '/api';

// 전역 상태
const AppState = {
    currentScreen: 'home-screen',
    studentId: null,
    currentScenario: null,
    currentProgress: null,
    scenarios: [],
    concepts: []
};

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen-content').forEach(screen => {
        screen.classList.remove('active');
    });

    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        AppState.currentScreen = screenId;
    }

    // 뒤로가기 버튼 표시 제어
    const backBtn = document.getElementById('back-btn');
    if (screenId === 'home-screen') {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'block';
    }
}

// 학생 ID 설정
function setStudentId() {
    const studentId = prompt('학생 ID를 입력하세요:');
    if (studentId) {
        AppState.studentId = studentId;
        localStorage.setItem('studentId', studentId);
        updateStudentInfo();
        loadScenarios();
    }
}

// 학생 정보 업데이트
function updateStudentInfo() {
    const studentIdDisplay = document.getElementById('student-id');
    if (AppState.studentId) {
        studentIdDisplay.textContent = AppState.studentId;
        document.getElementById('set-student-btn').textContent = 'ID 변경';
    } else {
        studentIdDisplay.textContent = '입력 필요';
    }
}

// 스토리 시나리오 목록 로드
async function loadScenarios(filters = {}) {
    const scenariosListEl = document.getElementById('scenarios-list');
    scenariosListEl.innerHTML = '<h3>스토리 목록</h3><div class="loading">로딩 중...</div>';

    try {
        const params = new URLSearchParams(filters);
        const response = await axios.get(`${API_BASE_URL}/story_controller.php/scenarios?${params}`);

        if (response.data.success) {
            AppState.scenarios = response.data.data;
            renderScenarios();
        } else {
            scenariosListEl.innerHTML = '<p>스토리를 불러올 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('Error loading scenarios:', error);
        scenariosListEl.innerHTML = '<p>오류가 발생했습니다.</p>';
    }
}

// 스토리 목록 렌더링
function renderScenarios() {
    const scenariosListEl = document.getElementById('scenarios-list');

    if (AppState.scenarios.length === 0) {
        scenariosListEl.innerHTML = '<h3>스토리 목록</h3><p>표시할 스토리가 없습니다.</p>';
        return;
    }

    let html = '<h3>스토리 목록</h3>';

    AppState.scenarios.forEach(scenario => {
        html += `
            <div class="scenario-card" onclick="selectScenario(${scenario.id})">
                <h4>${escapeHtml(scenario.title)}</h4>
                <p>${escapeHtml(scenario.description)}</p>
                <div class="scenario-meta">
                    <span class="badge">${difficultyToKorean(scenario.difficulty_level)}</span>
                    <span class="badge">${escapeHtml(scenario.target_grade)}</span>
                    <span class="badge">${escapeHtml(scenario.stat_concept)}</span>
                </div>
            </div>
        `;
    });

    scenariosListEl.innerHTML = html;
}

// 난이도 한글 변환
function difficultyToKorean(difficulty) {
    const map = {
        'basic': '기초',
        'intermediate': '중급',
        'advanced': '고급'
    };
    return map[difficulty] || difficulty;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 스토리 선택
async function selectScenario(scenarioId) {
    if (!AppState.studentId) {
        alert('먼저 학생 ID를 설정해주세요.');
        setStudentId();
        return;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/story_controller.php/scenario?id=${scenarioId}`);

        if (response.data.success) {
            AppState.currentScenario = response.data.data;
            showStoryScreen();
        }
    } catch (error) {
        console.error('Error loading scenario:', error);
        alert('스토리를 불러올 수 없습니다.');
    }
}

// 스토리 화면 표시
function showStoryScreen() {
    const scenario = AppState.currentScenario;

    document.getElementById('story-title').textContent = scenario.title;
    document.getElementById('story-description').textContent = scenario.description;
    document.getElementById('story-difficulty').textContent = difficultyToKorean(scenario.difficulty_level);
    document.getElementById('story-grade').textContent = scenario.target_grade;

    showScreen('story-screen');

    // 스토리 시작 또는 이어하기
    checkProgress(scenario.id);
}

// 진행 상황 확인
async function checkProgress(scenarioId) {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/story_controller.php/progress?student_id=${AppState.studentId}&scenario_id=${scenarioId}`
        );

        if (response.data.success && response.data.data && response.data.data.id) {
            // 기존 진행 상황 있음 - 이어하기
            AppState.currentProgress = response.data.data;
            continueStory();
        } else {
            // 새로 시작
            startNewStory(scenarioId);
        }
    } catch (error) {
        console.error('Error checking progress:', error);
        startNewStory(scenarioId);
    }
}

// 새 스토리 시작
async function startNewStory(scenarioId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/story_controller.php/start`, {
            student_id: AppState.studentId,
            scenario_id: scenarioId
        });

        if (response.data.success) {
            AppState.currentProgress = {
                id: response.data.data.progress_id,
                current_step_id: response.data.data.current_step_id,
                completed_steps: [],
                score: 0
            };
            loadCurrentStep();
        }
    } catch (error) {
        console.error('Error starting story:', error);
        alert('스토리를 시작할 수 없습니다.');
    }
}

// 스토리 이어하기
function continueStory() {
    loadCurrentStep();
}

// 내 진행 상황 로드
async function loadMyProgress() {
    if (!AppState.studentId) {
        alert('먼저 학생 ID를 설정해주세요.');
        return;
    }

    const progressListEl = document.getElementById('progress-list');
    progressListEl.innerHTML = '<div class="loading">로딩 중...</div>';

    try {
        const response = await axios.get(
            `${API_BASE_URL}/story_controller.php/progress?student_id=${AppState.studentId}`
        );

        if (response.data.success && response.data.data.length > 0) {
            renderProgressList(response.data.data);
        } else {
            progressListEl.innerHTML = '<p>진행 중인 스토리가 없습니다.</p>';
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        progressListEl.innerHTML = '<p>진행 상황을 불러올 수 없습니다.</p>';
    }
}

// 진행 상황 목록 렌더링
function renderProgressList(progressList) {
    const progressListEl = document.getElementById('progress-list');
    let html = '';

    progressList.forEach(progress => {
        const completionPercent = progress.is_completed ? 100 :
            Math.round((progress.completed_steps.length / 10) * 100); // 임시로 10단계 가정

        html += `
            <div class="progress-item">
                <h4>${escapeHtml(progress.title)}</h4>
                <p>개념: ${escapeHtml(progress.stat_concept)}</p>
                <p>진행률: ${completionPercent}%</p>
                <p>점수: ${progress.score}점</p>
                <p>마지막 활동: ${new Date(progress.last_activity).toLocaleDateString('ko-KR')}</p>
                ${progress.is_completed ?
                    '<span class="badge" style="background: #28a745; color: white;">완료</span>' :
                    '<button class="btn-secondary" onclick="continueProgress(' + progress.scenario_id + ')">계속하기</button>'
                }
            </div>
        `;
    });

    progressListEl.innerHTML = html;
}

// 진행 상황 계속하기
async function continueProgress(scenarioId) {
    await selectScenario(scenarioId);
}

// 통계 개념 로드
async function loadConcepts() {
    const conceptsListEl = document.getElementById('concepts-list');
    conceptsListEl.innerHTML = '<div class="loading">로딩 중...</div>';

    try {
        const response = await axios.get(`${API_BASE_URL}/story_controller.php/concepts`);

        if (response.data.success) {
            AppState.concepts = response.data.data;
            renderConcepts();
        } else {
            conceptsListEl.innerHTML = '<p>개념을 불러올 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('Error loading concepts:', error);
        conceptsListEl.innerHTML = '<p>오류가 발생했습니다.</p>';
    }
}

// 통계 개념 렌더링
function renderConcepts() {
    const conceptsListEl = document.getElementById('concepts-list');
    let html = '';

    AppState.concepts.forEach(concept => {
        html += `
            <div class="concept-card">
                <h4>${escapeHtml(concept.concept_name_ko)}</h4>
                <p class="concept-en">${escapeHtml(concept.concept_name_en)}</p>
                <p>${escapeHtml(concept.description)}</p>
                ${concept.formula ? `<p><strong>공식:</strong> ${escapeHtml(concept.formula)}</p>` : ''}
            </div>
        `;
    });

    conceptsListEl.innerHTML = html;
}

// 스마트폰 최소화/최대화
function toggleSmartphone() {
    const container = document.getElementById('smartphone-container');
    container.classList.toggle('minimized');

    const toggleBtn = document.getElementById('toggle-btn');
    toggleBtn.textContent = container.classList.contains('minimized') ? '□' : '_';
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 학생 ID 로드
    const savedStudentId = localStorage.getItem('studentId');
    if (savedStudentId) {
        AppState.studentId = savedStudentId;
        updateStudentInfo();
    }

    // 초기 스토리 목록 로드
    loadScenarios();

    // 버튼 이벤트
    document.getElementById('set-student-btn').addEventListener('click', setStudentId);
    document.getElementById('toggle-btn').addEventListener('click', toggleSmartphone);
    document.getElementById('back-btn').addEventListener('click', () => showScreen('home-screen'));
    document.getElementById('home-btn').addEventListener('click', () => {
        showScreen('home-screen');
        loadScenarios();
    });

    // 메뉴 버튼
    document.getElementById('menu-btn').addEventListener('click', () => showScreen('menu-screen'));
    document.getElementById('close-menu-btn').addEventListener('click', () => showScreen('home-screen'));
    document.getElementById('my-progress-btn').addEventListener('click', () => {
        showScreen('progress-screen');
        loadMyProgress();
    });
    document.getElementById('concepts-btn').addEventListener('click', () => {
        showScreen('concepts-screen');
        loadConcepts();
    });

    // 네비게이션 버튼
    document.getElementById('nav-home').addEventListener('click', () => showScreen('home-screen'));
    document.getElementById('nav-story').addEventListener('click', () => {
        if (AppState.currentScenario) {
            showScreen('story-screen');
        } else {
            alert('스토리를 선택해주세요.');
        }
    });
    document.getElementById('nav-profile').addEventListener('click', () => {
        showScreen('progress-screen');
        loadMyProgress();
    });
});
