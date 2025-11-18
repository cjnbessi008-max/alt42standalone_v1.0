/**
 * Focus Light 웹앱 - 메인 애플리케이션 로직
 */

// API 기본 URL (개발 환경)
const API_BASE = './api';

// 전역 상태
const AppState = {
    problems: [],
    currentProblem: null,
    focusEnabled: true,
    intensity: 3,
    animationType: 'glow'
};

/**
 * 앱 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Focus Light 앱 초기화 중...');

    // 시계 업데이트
    updateClock();
    setInterval(updateClock, 1000);

    // 문제 목록 로드
    loadProblems();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 스마트폰 토글 설정
    setupSmartphoneToggle();
});

/**
 * 시계 업데이트
 */
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

/**
 * 문제 목록 로드
 */
async function loadProblems() {
    try {
        const response = await fetch(`${API_BASE}/problems.php`);
        const result = await response.json();

        if (result.success) {
            AppState.problems = result.data;
            renderProblemList(result.data);
            console.log('문제 로드 완료:', result.data.length, '개');
        } else {
            showError('문제를 불러올 수 없습니다: ' + result.message);
        }
    } catch (error) {
        console.error('문제 로드 실패:', error);
        showError('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 문제 목록 렌더링
 */
function renderProblemList(problems) {
    const listElement = document.getElementById('problem-list');

    if (problems.length === 0) {
        listElement.innerHTML = '<div class="loading">등록된 문제가 없습니다.</div>';
        return;
    }

    listElement.innerHTML = problems.map(problem => `
        <div class="problem-item" data-id="${problem.id}" onclick="loadProblem(${problem.id})">
            <h4>${problem.title}</h4>
            <p>${problem.description || '설명 없음'}</p>
            <div class="problem-meta">
                <span class="badge">${problem.grade_level || '미분류'}</span>
                <span class="badge difficulty-${problem.difficulty}">${getDifficultyText(problem.difficulty)}</span>
                <span class="badge">${problem.subject}</span>
            </div>
        </div>
    `).join('');
}

/**
 * 난이도 텍스트 변환
 */
function getDifficultyText(difficulty) {
    const map = {
        'easy': '쉬움',
        'medium': '보통',
        'hard': '어려움'
    };
    return map[difficulty] || difficulty;
}

/**
 * 특정 문제 로드
 */
async function loadProblem(problemId) {
    try {
        console.log('문제 로드 중:', problemId);

        const response = await fetch(`${API_BASE}/problems.php?id=${problemId}`);
        const result = await response.json();

        if (result.success) {
            AppState.currentProblem = result.data;
            displayProblem(result.data);
            updateProblemSelection(problemId);
            console.log('문제 표시 완료:', result.data);
        } else {
            showError('문제를 불러올 수 없습니다: ' + result.message);
        }
    } catch (error) {
        console.error('문제 로드 실패:', error);
        showError('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 문제 표시
 */
function displayProblem(problem) {
    // 제목과 설명 업데이트
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-description').textContent = problem.description || '';

    // 문제 정보 패널 표시
    const infoPanel = document.getElementById('problem-info');
    const detailsElement = document.getElementById('problem-details');

    infoPanel.style.display = 'block';
    detailsElement.innerHTML = `
        <p><strong>과목:</strong> ${problem.subject}</p>
        <p><strong>학년:</strong> ${problem.grade_level || '미분류'}</p>
        <p><strong>난이도:</strong> ${getDifficultyText(problem.difficulty)}</p>
        <p><strong>도형 수:</strong> ${problem.shapes ? problem.shapes.length : 0}</p>
    `;

    // 도형 렌더링
    if (problem.shapes && problem.shapes.length > 0) {
        ShapeRenderer.renderShapes(problem.shapes);

        // Focus Light 적용
        if (AppState.focusEnabled) {
            applyFocusLight(problem.shapes);
        }
    } else {
        clearShapes();
    }
}

/**
 * 도형 초기화
 */
function clearShapes() {
    const canvas = document.getElementById('shape-canvas');
    canvas.innerHTML = '';

    const labelsContainer = document.getElementById('focus-labels');
    labelsContainer.innerHTML = '';
}

/**
 * Focus Light 적용
 */
function applyFocusLight(shapes) {
    const labelsContainer = document.getElementById('focus-labels');
    labelsContainer.innerHTML = '';

    shapes.forEach(shape => {
        if (shape.focus_elements && shape.focus_elements.length > 0) {
            shape.focus_elements.forEach(element => {
                FocusLight.applyHighlight(element, AppState.intensity, AppState.animationType);

                // 라벨 생성
                if (element.label) {
                    createFocusLabel(element);
                }
            });
        }
    });
}

/**
 * Focus 라벨 생성
 */
function createFocusLabel(element) {
    const labelsContainer = document.getElementById('focus-labels');

    const label = document.createElement('div');
    label.className = 'focus-label';
    label.style.setProperty('--label-color', element.highlight_color);

    label.innerHTML = `
        <span class="focus-label-icon"></span>
        <span>${element.label}</span>
    `;

    labelsContainer.appendChild(label);
}

/**
 * 문제 선택 상태 업데이트
 */
function updateProblemSelection(problemId) {
    document.querySelectorAll('.problem-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.id) === problemId) {
            item.classList.add('active');
        }
    });
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 강도 슬라이더
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityValue = document.getElementById('intensity-value');

    intensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        AppState.intensity = value;
        intensityValue.textContent = value;

        if (AppState.currentProblem) {
            applyFocusLight(AppState.currentProblem.shapes);
        }
    });

    // 애니메이션 선택
    const animationSelect = document.getElementById('animation-select');
    animationSelect.addEventListener('change', (e) => {
        AppState.animationType = e.target.value;

        if (AppState.currentProblem) {
            applyFocusLight(AppState.currentProblem.shapes);
        }
    });

    // Focus Light 토글 버튼
    const toggleBtn = document.getElementById('toggle-focus-btn');
    toggleBtn.addEventListener('click', () => {
        AppState.focusEnabled = !AppState.focusEnabled;

        if (AppState.focusEnabled) {
            toggleBtn.textContent = 'Focus Light ON';
            toggleBtn.style.background = '#4A90E2';

            if (AppState.currentProblem) {
                applyFocusLight(AppState.currentProblem.shapes);
            }
        } else {
            toggleBtn.textContent = 'Focus Light OFF';
            toggleBtn.style.background = '#95A5A6';
            FocusLight.removeAllHighlights();
        }
    });
}

/**
 * 스마트폰 토글 설정
 */
function setupSmartphoneToggle() {
    const toggle = document.getElementById('smartphone-toggle');
    const container = document.querySelector('.smartphone-container');

    toggle.addEventListener('click', () => {
        container.classList.toggle('minimized');
    });
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    const listElement = document.getElementById('problem-list');
    listElement.innerHTML = `
        <div class="loading" style="color: #E74C3C;">
            ⚠️ ${message}
        </div>
    `;
    console.error(message);
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.loadProblem = loadProblem;
